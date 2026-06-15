import { Injectable } from "@nestjs/common";
import type {
    EstateTransportPoi,
    EstateTransportPoiCategory,
    EstateTransportType,
    EstateWalkRouteSearchOption
} from "@nmm/shared";
import { serverEnv } from "../../../infra/env";
import { ESTATE_ERRORS, createEstateError } from "../estate.errors";

const TMAP_PEDESTRIAN_SEARCH_OPTIONS: Record<EstateWalkRouteSearchOption, string> = {
    recommended: "0",
    main_road: "4",
    shortest: "10",
    shortest_no_stairs: "30"
};

type SearchNearbyTransportParams = {
    latitude: number;
    longitude: number;
    transportType: EstateTransportType;
    radiusKm: number;
    limit: number;
};

type GetPedestrianRouteParams = {
    originName: string;
    originLatitude: number;
    originLongitude: number;
    destinationName: string;
    destinationLatitude: number;
    destinationLongitude: number;
    searchOption: EstateWalkRouteSearchOption;
};

type PedestrianRouteResult = {
    totalDistanceM: number;
    totalTimeSec: number;
};

@Injectable()
export class TmapClientService {
    async searchNearbyTransport(params: SearchNearbyTransportParams): Promise<EstateTransportPoi[]> {
        const response = await this.requestJson(this.createNearbyTransportUrl(params), {
            method: "GET",
            headers: {
                Accept: "application/json"
            }
        });

        return parseNearbyTransportResponse(response);
    }

    async getPedestrianRoute(params: GetPedestrianRouteParams): Promise<PedestrianRouteResult> {
        const response = await this.requestJson(`${serverEnv.tmap.baseUrl}/tmap/routes/pedestrian?version=1`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                startX: params.originLongitude,
                startY: params.originLatitude,
                endX: params.destinationLongitude,
                endY: params.destinationLatitude,
                startName: encodeURIComponent(params.originName),
                endName: encodeURIComponent(params.destinationName),
                reqCoordType: "WGS84GEO",
                resCoordType: "WGS84GEO",
                searchOption: TMAP_PEDESTRIAN_SEARCH_OPTIONS[params.searchOption]
            })
        });

        return parsePedestrianRouteResponse(response);
    }

    private createNearbyTransportUrl(params: SearchNearbyTransportParams) {
        const searchParams = new URLSearchParams({
            version: "1",
            centerLon: String(params.longitude),
            centerLat: String(params.latitude),
            categories: toTmapCategories(params.transportType),
            radius: String(params.radiusKm),
            count: String(params.limit),
            page: "1",
            reqCoordType: "WGS84GEO",
            resCoordType: "WGS84GEO",
            sort: "distance"
        });

        return `${serverEnv.tmap.baseUrl}/tmap/pois/search/around?${searchParams.toString()}`;
    }

    private async requestJson(url: string, init: RequestInit) {
        const appKey = serverEnv.tmap.appKey;

        if (!appKey) {
            throw createEstateError(ESTATE_ERRORS.TMAP_APP_KEY_MISSING);
        }

        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), serverEnv.tmap.timeoutMs);

        try {
            const response = await fetch(url, {
                ...init,
                headers: {
                    ...init.headers,
                    appKey
                },
                signal: abortController.signal
            });

            if (response.status === 401) {
                throw createEstateError(ESTATE_ERRORS.TMAP_UNAUTHORIZED);
            }

            if (response.status === 429) {
                throw createEstateError(ESTATE_ERRORS.TMAP_RATE_LIMITED);
            }

            if (!response.ok) {
                throw createEstateError(ESTATE_ERRORS.TMAP_BAD_RESPONSE);
            }

            return (await response.json()) as unknown;
        } catch (error) {
            if (isAbortError(error)) {
                throw createEstateError(ESTATE_ERRORS.TMAP_TIMEOUT);
            }

            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }
}

function toTmapCategories(transportType: EstateTransportType) {
    if (transportType === "subway") {
        return "지하철";
    }

    if (transportType === "bus_stop") {
        return "버스정류장";
    }

    return "지하철;버스정류장";
}

function parseNearbyTransportResponse(response: unknown): EstateTransportPoi[] {
    const poiList = readPoiList(response);

    return poiList.flatMap((poi) => {
        const name = readString(poi.name) ?? readString(poi.poiName);
        const latitude = readNumber(poi.frontLat ?? poi.noorLat ?? poi.lat ?? poi.latitude);
        const longitude = readNumber(poi.frontLon ?? poi.noorLon ?? poi.lon ?? poi.lng ?? poi.longitude);

        if (!name || latitude === null || longitude === null) {
            return [];
        }

        return [
            {
                id: readString(poi.id ?? poi.poiId),
                name,
                category: inferTransportPoiCategory(poi, name),
                latitude,
                longitude,
                straightDistanceM: readStraightDistanceM(poi.radius ?? poi.distance ?? poi.dist),
                rawProvider: "tmap"
            }
        ];
    });
}

function readPoiList(response: unknown) {
    const root = readRecord(response);
    const searchPoiInfo = readRecord(root.searchPoiInfo);
    const pois = readRecord(searchPoiInfo.pois ?? root.pois);
    const poiList = pois.poi ?? searchPoiInfo.poi ?? root.poi;

    if (Array.isArray(poiList)) {
        return poiList.flatMap((poi) => {
            const record = readRecord(poi);

            return Object.keys(record).length > 0 ? [record] : [];
        });
    }

    const record = readRecord(poiList);

    return Object.keys(record).length > 0 ? [record] : [];
}

function inferTransportPoiCategory(poi: Record<string, unknown>, name: string): EstateTransportPoiCategory {
    const categoryText = [
        poi.upperBizName,
        poi.middleBizName,
        poi.lowerBizName,
        poi.bizName,
        poi.category,
        poi.categoryName,
        name
    ]
        .flatMap((value) => {
            const text = readString(value);

            return text ? [text] : [];
        })
        .join(" ");

    if (categoryText.includes("지하철") || categoryText.includes("호선") || /역\[[^\]]+\]$/.test(name)) {
        return "subway";
    }

    if (categoryText.includes("버스정류장") || categoryText.includes("버스")) {
        return "bus_stop";
    }

    return "unknown";
}

function parsePedestrianRouteResponse(response: unknown): PedestrianRouteResult {
    const route = findRouteTotal(readRecord(response));

    if (!route) {
        throw createEstateError(ESTATE_ERRORS.TMAP_BAD_RESPONSE);
    }

    return route;
}

function findRouteTotal(value: unknown): PedestrianRouteResult | null {
    if (Array.isArray(value)) {
        for (const item of value) {
            const route = findRouteTotal(item);

            if (route) {
                return route;
            }
        }

        return null;
    }

    const record = readRecord(value);
    const properties = readRecord(record.properties);
    const totalDistanceM = readNumber(properties.totalDistance ?? record.totalDistance);
    const totalTimeSec = readNumber(properties.totalTime ?? record.totalTime);

    if (totalDistanceM !== null && totalTimeSec !== null) {
        return {
            totalDistanceM: Math.round(totalDistanceM),
            totalTimeSec: Math.round(totalTimeSec)
        };
    }

    for (const child of Object.values(record)) {
        const route = findRouteTotal(child);

        if (route) {
            return route;
        }
    }

    return null;
}

function readRecord(value: unknown): Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

function readString(value: unknown) {
    if (typeof value !== "string") {
        return undefined;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function readNumber(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string") {
        const numberValue = Number(value);

        return Number.isFinite(numberValue) ? numberValue : null;
    }

    return null;
}

function readStraightDistanceM(value: unknown) {
    const distance = readNumber(value);

    if (distance === null) {
        return undefined;
    }

    return distance < 100 ? Math.round(distance * 1000) : Math.round(distance);
}

function isAbortError(error: unknown) {
    return error instanceof Error && error.name === "AbortError";
}
