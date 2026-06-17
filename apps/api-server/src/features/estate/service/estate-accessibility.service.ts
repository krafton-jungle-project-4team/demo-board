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
    type EstateTransportType,
    type EstateWalkRoute,
    type EstateWalkRouteSearchOption,
    type EstateWalkTimeToTransportQuery,
    type EstateWalkTimeToTransportResponse
} from "@nmm/shared";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { DomainError } from "../../../app-errors";
import { serverEnv } from "../../../infra/env";
import { EstatePropertyEntity, EstateTransactionEntity } from "../database";
import { ESTATE_ERRORS, createEstateError } from "../estate.errors";
import { TmapCacheService } from "./tmap-cache.service";
import { TmapClientService } from "./tmap-client.service";

const WALK_ROUTE_NOTICE =
    "TMAP API 기준 예상 도보 시간이며 실제 이동 시간은 보행 속도, 신호, 출입구, 현장 상황에 따라 달라질 수 있습니다.";

type EstateWalkRouteCacheEntry = Omit<EstateWalkRoute, "cached">;

@Injectable()
export class EstateAccessibilityService {
    private readonly tmapCache = new TmapCacheService();
    private readonly tmapClient = new TmapClientService();

    constructor(
        @InjectRepository(EstatePropertyEntity)
        private readonly estateProperties: Repository<EstatePropertyEntity>,
        @InjectRepository(EstateTransactionEntity)
        private readonly estateTransactions: Repository<EstateTransactionEntity>
    ) {}

    async getPropertyList(query: EstatePropertyListQuery): Promise<EstatePropertyListResponse> {
        const queryBuilder = this.estateProperties
            .createQueryBuilder("estateProperty")
            .where("estateProperty.latitude IS NOT NULL")
            .andWhere("estateProperty.longitude IS NOT NULL");

        if (query.districtName) {
            queryBuilder.andWhere("estateProperty.districtName = :districtName", {
                districtName: query.districtName
            });
        }

        if (query.legalDongName) {
            queryBuilder.andWhere("estateProperty.legalDongName = :legalDongName", {
                legalDongName: query.legalDongName
            });
        }

        if (query.q) {
            const keywords = query.q.split(/\s+/);

            keywords.forEach((keyword, index) => {
                queryBuilder.andWhere(
                    new Brackets((bracketQueryBuilder) => {
                        bracketQueryBuilder
                            .where(`estateProperty.parcelAddress ILIKE :propertyKeyword${index}`)
                            .orWhere(`estateProperty.districtName ILIKE :propertyKeyword${index}`)
                            .orWhere(`estateProperty.legalDongName ILIKE :propertyKeyword${index}`)
                            .orWhere(
                                `array_to_string("estateProperty"."building_names", ' ') ILIKE :propertyKeyword${index}`
                            );
                    }),
                    {
                        [`propertyKeyword${index}`]: `%${keyword}%`
                    }
                );
            });
        }

        const properties = await queryBuilder
            .orderBy("estateProperty.transactionCount", "DESC")
            .addOrderBy("estateProperty.id", "ASC")
            .take(query.limit)
            .getMany();

        return EstatePropertyListResponseSchema.parse({
            items: properties.map(toPropertySummary),
            count: properties.length
        });
    }

    async getPropertyDetail(propertyId: number): Promise<EstatePropertySummaryResponse> {
        const property = await this.getPropertyById(propertyId);

        return toPropertySummary(property);
    }

    async getNearbyTransportByProperty(
        propertyId: number,
        query: EstateNearbyTransportQuery
    ): Promise<EstateNearbyTransportResponse> {
        const property = await this.getPropertyById(propertyId);

        return this.createNearbyTransportResponse(property, query);
    }

    async getWalkTimeToTransportByProperty(
        propertyId: number,
        query: EstateWalkTimeToTransportQuery
    ): Promise<EstateWalkTimeToTransportResponse> {
        const property = await this.getPropertyById(propertyId);

        return this.createWalkTimeResponse(property, query);
    }

    async getNearbyTransportByTransaction(
        transactionId: number,
        query: EstateNearbyTransportQuery
    ): Promise<EstateNearbyTransportResponse> {
        const property = await this.getPropertyByTransaction(transactionId);

        return this.createNearbyTransportResponse(property, query);
    }

    async getWalkTimeToTransportByTransaction(
        transactionId: number,
        query: EstateWalkTimeToTransportQuery
    ): Promise<EstateWalkTimeToTransportResponse> {
        const property = await this.getPropertyByTransaction(transactionId);

        return this.createWalkTimeResponse(property, query);
    }

    private async createNearbyTransportResponse(
        property: EstatePropertyEntity,
        query: EstateNearbyTransportQuery
    ): Promise<EstateNearbyTransportResponse> {
        const propertySummary = toPropertySummary(property);
        const transportPois = await this.getNearbyTransportPois(
            propertySummary,
            query.transportType,
            query.radiusKm,
            query.limit
        );

        return EstateNearbyTransportResponseSchema.parse({
            property: propertySummary,
            transportPois,
            provider: "tmap",
            radiusKm: query.radiusKm
        });
    }

    private async createWalkTimeResponse(
        property: EstatePropertyEntity,
        query: EstateWalkTimeToTransportQuery
    ): Promise<EstateWalkTimeToTransportResponse> {
        const propertySummary = toPropertySummary(property);
        const maxCandidates = Math.max(1, Math.min(query.maxCandidates, serverEnv.tmap.maxTmapCallsPerRequest));
        const transportPois = await this.getNearbyTransportPois(
            propertySummary,
            query.transportType,
            query.radiusKm,
            maxCandidates
        );

        if (transportPois.length === 0) {
            throw createEstateError(ESTATE_ERRORS.NO_TRANSPORT_FOUND);
        }

        const candidates = await this.getWalkRouteCandidates(propertySummary, transportPois, query.searchOption);

        if (candidates.length === 0) {
            throw createEstateError(ESTATE_ERRORS.NO_WALK_ROUTE_FOUND);
        }

        candidates.sort(compareWalkRoutes);

        return EstateWalkTimeToTransportResponseSchema.parse({
            property: propertySummary,
            best: candidates[0],
            candidates,
            provider: "tmap",
            cacheUsed: candidates.some((candidate) => candidate.cached),
            notice: WALK_ROUTE_NOTICE
        });
    }

    private async getWalkRouteCandidates(
        property: EstatePropertySummaryResponse,
        transportPois: EstateTransportPoi[],
        searchOption: EstateWalkRouteSearchOption
    ) {
        const candidates: EstateWalkRoute[] = [];

        for (const transportPoi of transportPois) {
            try {
                candidates.push(await this.getWalkRoute(property, transportPoi, searchOption));
            } catch (error) {
                if (!isNoWalkRouteError(error)) {
                    throw error;
                }
            }
        }

        return candidates;
    }

    private async getWalkRoute(
        property: EstatePropertySummaryResponse,
        transportPoi: EstateTransportPoi,
        searchOption: EstateWalkRouteSearchOption
    ) {
        const cacheKey = createWalkRouteCacheKey(property, transportPoi, searchOption);
        const cachedRoute = this.tmapCache.get<EstateWalkRouteCacheEntry>(cacheKey);

        if (cachedRoute) {
            return EstateWalkRouteSchema.parse({
                ...cachedRoute,
                cached: true
            });
        }

        const routeSummary = await this.tmapClient.getPedestrianRoute({
            origin: {
                name: property.parcelAddress,
                latitude: property.latitude,
                longitude: property.longitude
            },
            destination: {
                name: transportPoi.name,
                latitude: transportPoi.latitude,
                longitude: transportPoi.longitude
            },
            searchOption
        });
        const route = EstateWalkRouteSchema.parse({
            provider: "tmap",
            origin: {
                name: property.parcelAddress,
                latitude: property.latitude,
                longitude: property.longitude
            },
            destination: {
                name: transportPoi.name,
                category: transportPoi.category,
                operationStatus: transportPoi.operationStatus,
                latitude: transportPoi.latitude,
                longitude: transportPoi.longitude
            },
            totalDistanceM: routeSummary.totalDistanceM,
            totalTimeSec: routeSummary.totalTimeSec,
            totalTimeMin: Math.ceil(routeSummary.totalTimeSec / 60),
            routePath: routeSummary.routePath,
            searchOption,
            cached: false,
            computedAt: new Date().toISOString(),
            notice: WALK_ROUTE_NOTICE
        });

        this.tmapCache.set(cacheKey, toWalkRouteCacheEntry(route), serverEnv.tmap.walkRouteCacheTtlSeconds);

        return route;
    }

    private async getNearbyTransportPois(
        property: EstatePropertySummaryResponse,
        transportType: EstateTransportType,
        radiusKm: number,
        limit: number
    ) {
        const cacheKey = createTransportPoiCacheKey(property, transportType, radiusKm, limit);
        const cachedPois = this.tmapCache.get<EstateTransportPoi[]>(cacheKey);

        if (cachedPois) {
            return cachedPois;
        }

        const transportPois = await this.tmapClient.searchNearbyTransport({
            latitude: property.latitude,
            longitude: property.longitude,
            transportType,
            radiusKm,
            limit
        });

        this.tmapCache.set(cacheKey, transportPois, serverEnv.tmap.transportPoiCacheTtlSeconds);

        return transportPois;
    }

    private async getPropertyByTransaction(transactionId: number) {
        const transaction = await this.estateTransactions.findOne({
            where: { id: transactionId }
        });

        if (!transaction) {
            throw createEstateError(ESTATE_ERRORS.TRANSACTION_NOT_FOUND);
        }

        if (!transaction.propertyId) {
            throw createEstateError(ESTATE_ERRORS.PROPERTY_NOT_FOUND);
        }

        return this.getPropertyById(Number(transaction.propertyId));
    }

    private async getPropertyById(propertyId: number) {
        const property = await this.estateProperties.findOne({
            where: { id: propertyId }
        });

        if (!property) {
            throw createEstateError(ESTATE_ERRORS.PROPERTY_NOT_FOUND);
        }

        assertPropertyCoordinates(property);

        return property;
    }
}

function toPropertySummary(property: EstatePropertyEntity): EstatePropertySummaryResponse {
    const latitude = toFiniteNumber(property.latitude);
    const longitude = toFiniteNumber(property.longitude);

    if (latitude === null || longitude === null) {
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
        latitude,
        longitude
    });
}

function assertPropertyCoordinates(property: EstatePropertyEntity) {
    if (toFiniteNumber(property.latitude) === null || toFiniteNumber(property.longitude) === null) {
        throw createEstateError(ESTATE_ERRORS.PROPERTY_COORDINATES_MISSING);
    }
}

function toFiniteNumber(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string" && value.trim().length > 0) {
        const numberValue = Number(value);

        return Number.isFinite(numberValue) ? numberValue : null;
    }

    return null;
}

function createTransportPoiCacheKey(
    property: EstatePropertySummaryResponse,
    transportType: EstateTransportType,
    radiusKm: number,
    limit: number
) {
    return [
        "transport-poi",
        "tmap",
        toCoordinateCachePart(property.longitude),
        toCoordinateCachePart(property.latitude),
        transportType,
        radiusKm,
        limit
    ].join(":");
}

function createWalkRouteCacheKey(
    property: EstatePropertySummaryResponse,
    transportPoi: EstateTransportPoi,
    searchOption: EstateWalkRouteSearchOption
) {
    return [
        "walk-route",
        "tmap",
        toCoordinateCachePart(property.longitude),
        toCoordinateCachePart(property.latitude),
        toCoordinateCachePart(transportPoi.longitude),
        toCoordinateCachePart(transportPoi.latitude),
        searchOption
    ].join(":");
}

function toCoordinateCachePart(coordinate: number) {
    return coordinate.toFixed(6);
}

function toWalkRouteCacheEntry(route: EstateWalkRoute): EstateWalkRouteCacheEntry {
    return {
        provider: route.provider,
        origin: route.origin,
        destination: route.destination,
        totalDistanceM: route.totalDistanceM,
        totalTimeSec: route.totalTimeSec,
        totalTimeMin: route.totalTimeMin,
        routePath: route.routePath,
        searchOption: route.searchOption,
        computedAt: route.computedAt,
        notice: route.notice
    };
}

function compareWalkRoutes(left: EstateWalkRoute, right: EstateWalkRoute) {
    return left.totalTimeSec - right.totalTimeSec || left.totalDistanceM - right.totalDistanceM;
}

function isNoWalkRouteError(error: unknown) {
    return error instanceof DomainError && error.code === ESTATE_ERRORS.NO_WALK_ROUTE_FOUND.code;
}
