import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
    EstateNearbyTransportResponseSchema,
    EstatePropertyListResponseSchema,
    EstatePropertySummaryResponseSchema,
    EstateWalkRouteSchema,
    EstateWalkTimeToTransportResponseSchema,
    type EstateNearbyTransportQuery,
    type EstateNearbyTransportResponse,
    type EstatePropertyListQuery,
    type EstatePropertyListResponse,
    type EstatePropertySummaryResponse,
    type EstateTransportPoi,
    type EstateWalkRoute,
    type EstateWalkTimeToTransportQuery,
    type EstateWalkTimeToTransportResponse
} from "@nmm/shared";
import { Repository } from "typeorm";
import { DomainError } from "../../../app-errors";
import { serverEnv } from "../../../infra/env";
import { ESTATE_ERRORS, createEstateError } from "../estate.errors";
import { EstatePropertyEntity } from "../database";
import { TmapCacheService } from "./tmap-cache.service";
import { TmapClientService } from "./tmap-client.service";

const WALK_ROUTE_NOTICE =
    "TMAP API 기준 예상 도보 시간이며 실제 이동 시간은 보행 속도, 신호, 출입구, 현장 상황에 따라 달라질 수 있습니다.";

type CachedWalkRouteValue = Omit<EstateWalkRoute, "cached">;

@Injectable()
export class EstateAccessibilityService {
    constructor(
        @InjectRepository(EstatePropertyEntity) private readonly properties: Repository<EstatePropertyEntity>,
        private readonly tmapClient: TmapClientService,
        private readonly tmapCache: TmapCacheService
    ) {}

    async getPropertyList(query: EstatePropertyListQuery): Promise<EstatePropertyListResponse> {
        const queryBuilder = this.properties
            .createQueryBuilder("estate_properties")
            .where("estate_properties.latitude IS NOT NULL")
            .andWhere("estate_properties.longitude IS NOT NULL")
            .orderBy("estate_properties.transaction_count", "DESC")
            .addOrderBy("estate_properties.id", "ASC")
            .limit(query.limit);

        if (query.q) {
            queryBuilder.andWhere(
                `(
                    estate_properties.parcel_address ILIKE :keyword
                    OR estate_properties.legal_dong_name ILIKE :keyword
                    OR array_to_string(estate_properties.building_names, ' ') ILIKE :keyword
                )`,
                { keyword: `%${query.q}%` }
            );
        }

        if (query.districtName) {
            queryBuilder.andWhere("estate_properties.district_name = :districtName", {
                districtName: query.districtName
            });
        }

        if (query.legalDongName) {
            queryBuilder.andWhere("estate_properties.legal_dong_name = :legalDongName", {
                legalDongName: query.legalDongName
            });
        }

        const properties = await queryBuilder.getMany();
        const items = properties.map((property) => this.toPropertySummary(property));

        return EstatePropertyListResponseSchema.parse({
            items,
            count: items.length
        });
    }

    async getPropertyDetail(propertyId: number): Promise<EstatePropertySummaryResponse> {
        return this.getProperty(propertyId);
    }

    async getNearbyTransport(
        propertyId: number,
        query: EstateNearbyTransportQuery
    ): Promise<EstateNearbyTransportResponse> {
        const property = await this.getProperty(propertyId);
        const transportPois = await this.getNearbyTransportPois(property, query);

        if (transportPois.length === 0) {
            throw createEstateError(ESTATE_ERRORS.NO_TRANSPORT_FOUND);
        }

        return EstateNearbyTransportResponseSchema.parse({
            property,
            transportPois,
            provider: "tmap",
            radiusKm: query.radiusKm
        });
    }

    async getWalkTimeToTransport(
        propertyId: number,
        query: EstateWalkTimeToTransportQuery
    ): Promise<EstateWalkTimeToTransportResponse> {
        const property = await this.getProperty(propertyId);
        const nearbyTransportQuery = {
            transportType: query.transportType,
            radiusKm: query.radiusKm,
            limit: Math.max(query.maxCandidates, 5)
        };
        const transportPois = await this.getNearbyTransportPois(property, nearbyTransportQuery);
        const candidates = await this.getWalkRouteCandidates(property, transportPois, query);

        if (candidates.length === 0) {
            throw createEstateError(ESTATE_ERRORS.NO_WALK_ROUTE_FOUND);
        }

        const sortedCandidates = [...candidates].sort((left, right) => left.totalTimeSec - right.totalTimeSec);

        return EstateWalkTimeToTransportResponseSchema.parse({
            property,
            best: sortedCandidates[0] ?? null,
            candidates: sortedCandidates,
            provider: "tmap",
            cacheUsed: sortedCandidates.some((candidate) => candidate.cached),
            notice: WALK_ROUTE_NOTICE
        });
    }

    private async getProperty(propertyId: number): Promise<EstatePropertySummaryResponse> {
        const property = await this.properties.findOne({
            where: {
                id: propertyId
            }
        });

        if (!property) {
            throw createEstateError(ESTATE_ERRORS.PROPERTY_NOT_FOUND);
        }

        if (property.latitude === null || property.longitude === null) {
            throw createEstateError(ESTATE_ERRORS.PROPERTY_COORDINATES_MISSING);
        }

        return this.toPropertySummary(property);
    }

    private toPropertySummary(property: EstatePropertyEntity): EstatePropertySummaryResponse {
        if (property.latitude === null || property.longitude === null) {
            throw createEstateError(ESTATE_ERRORS.PROPERTY_COORDINATES_MISSING);
        }

        return EstatePropertySummaryResponseSchema.parse({
            id: Number(property.id),
            propertyKey: property.propertyKey,
            parcelAddress: property.parcelAddress,
            buildingNames: property.buildingNames,
            districtName: property.districtName,
            legalDongName: property.legalDongName,
            transactionCount: property.transactionCount,
            latitude: Number(property.latitude),
            longitude: Number(property.longitude)
        });
    }

    private async getNearbyTransportPois(
        property: EstatePropertySummaryResponse,
        query: EstateNearbyTransportQuery
    ): Promise<EstateTransportPoi[]> {
        const cacheKey = createTransportPoiCacheKey(property, query);
        const cachedPois = this.tmapCache.get<EstateTransportPoi[]>(cacheKey);

        if (cachedPois) {
            return cachedPois;
        }

        const transportPois = await this.tmapClient.searchNearbyTransport({
            latitude: property.latitude,
            longitude: property.longitude,
            transportType: query.transportType,
            radiusKm: query.radiusKm,
            limit: query.limit
        });
        const filteredPois = transportPois
            .filter((poi) => query.transportType === "all" || poi.category === query.transportType)
            .sort(compareTransportPois)
            .slice(0, query.limit);

        this.tmapCache.set(cacheKey, filteredPois, serverEnv.tmap.transportPoiCacheTtlSeconds);

        return filteredPois;
    }

    private async getWalkRouteCandidates(
        property: EstatePropertySummaryResponse,
        transportPois: EstateTransportPoi[],
        query: EstateWalkTimeToTransportQuery
    ) {
        const maxCandidates = Math.min(query.maxCandidates, serverEnv.tmap.maxTmapCallsPerRequest);
        const targetPois = [...transportPois].sort(compareTransportPois).slice(0, maxCandidates);
        const candidates: EstateWalkRoute[] = [];

        for (const transportPoi of targetPois) {
            const walkRoute = await this.getWalkRoute(property, transportPoi, query);

            if (walkRoute) {
                candidates.push(walkRoute);
            }
        }

        return candidates;
    }

    private async getWalkRoute(
        property: EstatePropertySummaryResponse,
        transportPoi: EstateTransportPoi,
        query: EstateWalkTimeToTransportQuery
    ): Promise<EstateWalkRoute | null> {
        const cacheKey = createWalkRouteCacheKey(property, transportPoi, query.searchOption);
        const cachedRoute = this.tmapCache.get<CachedWalkRouteValue>(cacheKey);

        if (cachedRoute) {
            return EstateWalkRouteSchema.parse({
                ...cachedRoute,
                cached: true
            });
        }

        try {
            const route = await this.tmapClient.getPedestrianRoute({
                originName: property.parcelAddress,
                originLatitude: property.latitude,
                originLongitude: property.longitude,
                destinationName: transportPoi.name,
                destinationLatitude: transportPoi.latitude,
                destinationLongitude: transportPoi.longitude,
                searchOption: query.searchOption
            });
            const walkRoute = EstateWalkRouteSchema.parse({
                provider: "tmap",
                origin: {
                    name: property.parcelAddress,
                    latitude: property.latitude,
                    longitude: property.longitude
                },
                destination: {
                    name: transportPoi.name,
                    category: transportPoi.category,
                    latitude: transportPoi.latitude,
                    longitude: transportPoi.longitude
                },
                totalDistanceM: route.totalDistanceM,
                totalTimeSec: route.totalTimeSec,
                totalTimeMin: Math.ceil(route.totalTimeSec / 60),
                searchOption: query.searchOption,
                cached: false,
                computedAt: new Date().toISOString(),
                notice: WALK_ROUTE_NOTICE
            });
            const cacheValue: CachedWalkRouteValue = {
                provider: walkRoute.provider,
                origin: walkRoute.origin,
                destination: walkRoute.destination,
                totalDistanceM: walkRoute.totalDistanceM,
                totalTimeSec: walkRoute.totalTimeSec,
                totalTimeMin: walkRoute.totalTimeMin,
                searchOption: walkRoute.searchOption,
                computedAt: walkRoute.computedAt,
                notice: walkRoute.notice
            };

            this.tmapCache.set(cacheKey, cacheValue, serverEnv.tmap.walkRouteCacheTtlSeconds);

            return walkRoute;
        } catch (error) {
            if (isSkippableRouteError(error)) {
                return null;
            }

            throw error;
        }
    }
}

function compareTransportPois(left: EstateTransportPoi, right: EstateTransportPoi) {
    const leftDistance = left.straightDistanceM ?? Number.POSITIVE_INFINITY;
    const rightDistance = right.straightDistanceM ?? Number.POSITIVE_INFINITY;

    return leftDistance - rightDistance;
}

function createTransportPoiCacheKey(property: EstatePropertySummaryResponse, query: EstateNearbyTransportQuery) {
    return [
        "transport-poi",
        "tmap",
        normalizeCoordinate(property.longitude),
        normalizeCoordinate(property.latitude),
        query.transportType,
        query.radiusKm,
        query.limit
    ].join(":");
}

function createWalkRouteCacheKey(
    property: EstatePropertySummaryResponse,
    transportPoi: EstateTransportPoi,
    searchOption: EstateWalkTimeToTransportQuery["searchOption"]
) {
    return [
        "walk-route",
        "tmap",
        normalizeCoordinate(property.longitude),
        normalizeCoordinate(property.latitude),
        normalizeCoordinate(transportPoi.longitude),
        normalizeCoordinate(transportPoi.latitude),
        searchOption
    ].join(":");
}

function normalizeCoordinate(value: number) {
    return value.toFixed(6);
}

function isSkippableRouteError(error: unknown) {
    return (
        error instanceof DomainError &&
        (error.code === ESTATE_ERRORS.TMAP_BAD_RESPONSE.code || error.code === ESTATE_ERRORS.NO_WALK_ROUTE_FOUND.code)
    );
}
