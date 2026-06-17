import {
    EstateTransportPoiSchema,
    type EstateRouteCoordinate,
    type EstateTransportPoi,
    type EstateTransportPoiCategory,
    type EstateTransportType,
    type EstateWalkRouteSearchOption
} from "@nmm/shared";
import { DomainError } from "../../../app-errors";
import { serverEnv } from "../../../infra/env";
import { ESTATE_ERRORS, createEstateError } from "../estate.errors";

type TmapNearbyTransportRequest = {
    latitude: number;
    longitude: number;
    transportType: EstateTransportType;
    radiusKm: number;
    limit: number;
};

type TmapPedestrianRouteRequest = {
    origin: {
        name: string;
        latitude: number;
        longitude: number;
    };
    destination: {
        name: string;
        latitude: number;
        longitude: number;
    };
    searchOption: EstateWalkRouteSearchOption;
};

export type TmapPedestrianRouteSummary = {
    totalDistanceM: number;
    totalTimeSec: number;
    routePath: EstateRouteCoordinate[];
};

const TMAP_PLANNED_STATION_KEYWORDS = [
    "개통예정",
    "개통 예정",
    "예정역",
    "미개통",
    "공사중",
    "공사 중",
    "계획",
    "가칭"
];

const TMAP_WALK_ROUTE_SEARCH_OPTION: Record<EstateWalkRouteSearchOption, string> = {
    recommended: "0",
    main_road: "4",
    shortest: "10",
    shortest_no_stairs: "30"
};

export class TmapClientService {
    async searchNearbyTransport(request: TmapNearbyTransportRequest): Promise<EstateTransportPoi[]> {
        const requestUrl = createTmapUrl("/pois/search/around");
        requestUrl.searchParams.set("version", "1");
        requestUrl.searchParams.set("centerLon", String(request.longitude));
        requestUrl.searchParams.set("centerLat", String(request.latitude));
        requestUrl.searchParams.set("categories", toTmapTransportCategory(request.transportType));
        requestUrl.searchParams.set("radius", String(request.radiusKm));
        requestUrl.searchParams.set("count", String(request.limit));
        requestUrl.searchParams.set("page", "1");
        requestUrl.searchParams.set("reqCoordType", "WGS84GEO");
        requestUrl.searchParams.set("resCoordType", "WGS84GEO");
        requestUrl.searchParams.set("sort", "distance");

        const responseBody = await this.requestJson(requestUrl);
        const transportPois = readTmapPois(responseBody)
            .map(toEstateTransportPoi)
            .filter((poi): poi is EstateTransportPoi => poi !== null)
            .slice(0, request.limit);

        return EstateTransportPoiSchema.array().parse(transportPois);
    }

    async getPedestrianRoute(request: TmapPedestrianRouteRequest): Promise<TmapPedestrianRouteSummary> {
        const requestUrl = createTmapUrl("/routes/pedestrian");
        requestUrl.searchParams.set("version", "1");

        const responseBody = await this.requestJson(requestUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                startX: String(request.origin.longitude),
                startY: String(request.origin.latitude),
                endX: String(request.destination.longitude),
                endY: String(request.destination.latitude),
                reqCoordType: "WGS84GEO",
                resCoordType: "WGS84GEO",
                startName: encodeURIComponent(request.origin.name),
                endName: encodeURIComponent(request.destination.name),
                searchOption: TMAP_WALK_ROUTE_SEARCH_OPTION[request.searchOption]
            })
        });
        const totalDistanceM = findNumberByKey(responseBody, "totalDistance");
        const totalTimeSec = findNumberByKey(responseBody, "totalTime");
        const routePath = readRoutePath(responseBody);

        if (totalDistanceM === null || totalTimeSec === null) {
            throw createEstateError(ESTATE_ERRORS.NO_WALK_ROUTE_FOUND);
        }

        return {
            totalDistanceM: Math.round(totalDistanceM),
            totalTimeSec: Math.round(totalTimeSec),
            routePath
        };
    }

    private async requestJson(requestUrl: URL, init: RequestInit = {}) {
        assertTmapAppKey();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), serverEnv.tmap.timeoutMs);

        try {
            const response = await fetch(requestUrl, {
                ...init,
                headers: createTmapHeaders(init.headers),
                signal: controller.signal
            });

            if (!response.ok) {
                throw createTmapHttpError(response.status);
            }

            return (await response.json()) as unknown;
        } catch (error) {
            if (error instanceof DomainError) {
                throw error;
            }

            if (error instanceof Error && error.name === "AbortError") {
                throw createEstateError(ESTATE_ERRORS.TMAP_TIMEOUT);
            }

            throw createEstateError(ESTATE_ERRORS.TMAP_BAD_RESPONSE);
        } finally {
            clearTimeout(timeoutId);
        }
    }
}

function assertTmapAppKey() {
    if (!serverEnv.tmap.appKey) {
        throw createEstateError(ESTATE_ERRORS.TMAP_APP_KEY_MISSING);
    }
}

function createTmapHttpError(statusCode: number) {
    if (statusCode === 401 || statusCode === 403) {
        return createEstateError(ESTATE_ERRORS.TMAP_UNAUTHORIZED);
    }

    if (statusCode === 408 || statusCode === 504) {
        return createEstateError(ESTATE_ERRORS.TMAP_TIMEOUT);
    }

    if (statusCode === 429) {
        return createEstateError(ESTATE_ERRORS.TMAP_RATE_LIMITED);
    }

    return createEstateError(ESTATE_ERRORS.TMAP_BAD_RESPONSE);
}

function createTmapUrl(pathname: string) {
    const baseUrl = serverEnv.tmap.baseUrl.replace(/\/+$/, "");
    const normalizedBaseUrl = baseUrl.endsWith("/tmap") ? baseUrl : `${baseUrl}/tmap`;

    return new URL(`${normalizedBaseUrl}${pathname}`);
}

function createTmapHeaders(headers: RequestInit["headers"]) {
    const tmapHeaders: Record<string, string> = {
        appKey: serverEnv.tmap.appKey ?? "",
        Accept: "application/json"
    };

    if (headers && typeof headers === "object" && !Array.isArray(headers)) {
        Object.entries(headers).forEach(([key, value]) => {
            if (typeof value === "string") {
                tmapHeaders[key] = value;
            }
        });
    }

    return tmapHeaders;
}

function toTmapTransportCategory(transportType: EstateTransportType) {
    if (transportType === "subway") {
        return "지하철";
    }

    if (transportType === "bus_stop") {
        return "버스정류장";
    }

    return "지하철;버스정류장";
}

function readTmapPois(responseBody: unknown): Record<string, unknown>[] {
    const root = toRecord(responseBody);
    const searchPoiInfo = toRecord(root?.searchPoiInfo);
    const pois = toRecord(searchPoiInfo?.pois)?.poi;

    if (Array.isArray(pois)) {
        return pois.flatMap((poi) => {
            const poiRecord = toRecord(poi);

            return poiRecord ? [poiRecord] : [];
        });
    }

    const singlePoi = toRecord(pois);

    return singlePoi ? [singlePoi] : [];
}

function toEstateTransportPoi(poi: Record<string, unknown>): EstateTransportPoi | null {
    const name = readString(poi, ["name", "poiName", "bizName"]);
    const latitude = readNumber(poi, ["frontLat", "noorLat", "lat", "latitude"]);
    const longitude = readNumber(poi, ["frontLon", "noorLon", "lon", "longitude"]);

    if (!name || latitude === null || longitude === null) {
        return null;
    }

    return {
        id: readString(poi, ["id", "poiId"]) ?? undefined,
        name,
        category: inferPoiCategory(poi),
        operationStatus: inferPoiOperationStatus(poi),
        latitude,
        longitude,
        straightDistanceM: normalizeDistanceMeters(readNumber(poi, ["radius", "distance", "dist"])),
        rawProvider: "tmap"
    };
}

function inferPoiCategory(poi: Record<string, unknown>): EstateTransportPoiCategory {
    const text = [
        ...readStrings(poi, ["name", "poiName", "bizName"]),
        ...readStrings(poi, ["upperBizName", "middleBizName", "lowerBizName", "detailBizName"]),
        ...readStrings(poi, ["desc"])
    ].join(" ");

    if (text.includes("버스") || text.includes("정류장")) {
        return "bus_stop";
    }

    if (text.includes("지하철") || text.includes("호선") || text.includes("역[")) {
        return "subway";
    }

    const name = readString(poi, ["name", "poiName", "bizName"]) ?? "";

    if (name.endsWith("역")) {
        return "subway";
    }

    return "unknown";
}

function inferPoiOperationStatus(poi: Record<string, unknown>) {
    const text = [
        ...readStrings(poi, ["name", "poiName", "bizName"]),
        ...readStrings(poi, ["upperBizName", "middleBizName", "lowerBizName", "detailBizName"]),
        ...readStrings(poi, ["desc", "description", "telNo", "parkFlag"])
    ].join(" ");

    return TMAP_PLANNED_STATION_KEYWORDS.some((keyword) => text.includes(keyword)) ? "planned" : "operating";
}

function normalizeDistanceMeters(distance: number | null) {
    if (distance === null) {
        return undefined;
    }

    if (distance < 100) {
        return Math.round(distance * 1000);
    }

    return Math.round(distance);
}

function findNumberByKey(value: unknown, targetKey: string): number | null {
    if (Array.isArray(value)) {
        for (const item of value) {
            const result = findNumberByKey(item, targetKey);

            if (result !== null) {
                return result;
            }
        }

        return null;
    }

    const record = toRecord(value);

    if (!record) {
        return null;
    }

    const ownValue = toNumber(record[targetKey]);

    if (ownValue !== null) {
        return ownValue;
    }

    for (const nestedValue of Object.values(record)) {
        const result = findNumberByKey(nestedValue, targetKey);

        if (result !== null) {
            return result;
        }
    }

    return null;
}

function readRoutePath(responseBody: unknown) {
    return dedupeConsecutiveCoordinates(readGeometryCoordinates(responseBody));
}

function readGeometryCoordinates(value: unknown): EstateRouteCoordinate[] {
    if (Array.isArray(value)) {
        return value.flatMap(readGeometryCoordinates);
    }

    const record = toRecord(value);

    if (!record) {
        return [];
    }

    if (record.type === "LineString") {
        return readLineStringCoordinates(record.coordinates);
    }

    if (record.type === "MultiLineString") {
        return readMultiLineStringCoordinates(record.coordinates);
    }

    return Object.values(record).flatMap(readGeometryCoordinates);
}

function readMultiLineStringCoordinates(value: unknown) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap(readLineStringCoordinates);
}

function readLineStringCoordinates(value: unknown) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((coordinate) => {
        if (!Array.isArray(coordinate)) {
            return [];
        }

        const longitude = toNumber(coordinate[0]);
        const latitude = toNumber(coordinate[1]);

        if (latitude === null || longitude === null || !isValidCoordinate(latitude, longitude)) {
            return [];
        }

        return [{ latitude, longitude }];
    });
}

function dedupeConsecutiveCoordinates(coordinates: EstateRouteCoordinate[]) {
    return coordinates.filter((coordinate, index) => {
        const previousCoordinate = coordinates[index - 1];

        return (
            !previousCoordinate ||
            previousCoordinate.latitude !== coordinate.latitude ||
            previousCoordinate.longitude !== coordinate.longitude
        );
    });
}

function isValidCoordinate(latitude: number, longitude: number) {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function readString(record: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
        const value = record[key];

        if (typeof value === "string" && value.trim().length > 0) {
            return value.trim();
        }

        if (typeof value === "number" && Number.isFinite(value)) {
            return String(value);
        }
    }

    return null;
}

function readStrings(record: Record<string, unknown>, keys: string[]) {
    return keys.flatMap((key) => {
        const value = readString(record, [key]);

        return value ? [value] : [];
    });
}

function readNumber(record: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
        const numberValue = toNumber(record[key]);

        if (numberValue !== null) {
            return numberValue;
        }
    }

    return null;
}

function toNumber(value: unknown) {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string" && value.trim().length > 0) {
        const numberValue = Number(value);

        return Number.isFinite(numberValue) ? numberValue : null;
    }

    return null;
}

function toRecord(value: unknown): Record<string, unknown> | null {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return null;
    }

    return value as Record<string, unknown>;
}
