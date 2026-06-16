import { z } from "zod";

const DEFAULT_ESTATE_TRANSACTION_LIST_PAGE = 1;
const DEFAULT_ESTATE_TRANSACTION_LIST_PAGE_SIZE = 20;
const MAX_ESTATE_TRANSACTION_LIST_PAGE_SIZE = 50;
const DEFAULT_ESTATE_SIMILAR_TRANSACTION_LIMIT = 10;
const MAX_ESTATE_SIMILAR_TRANSACTION_LIMIT = 50;
const DEFAULT_ESTATE_TRANSPORT_RADIUS_KM = 1;
const MAX_ESTATE_TRANSPORT_RADIUS_KM = 3;
const DEFAULT_ESTATE_TRANSPORT_LIMIT = 5;
const MAX_ESTATE_TRANSPORT_LIMIT = 20;
const DEFAULT_ESTATE_WALK_CANDIDATE_COUNT = 5;
const MAX_ESTATE_WALK_CANDIDATE_COUNT = 5;
const DEFAULT_ESTATE_PROPERTY_LIST_LIMIT = 20;
const MAX_ESTATE_PROPERTY_LIST_LIMIT = 100;

const OptionalEstateSearchKeywordSchema = z.preprocess((value) => {
    if (typeof value !== "string") {
        return undefined;
    }

    const keyword = value.trim();

    return keyword.length > 0 ? keyword : undefined;
}, z.string().min(1).max(100).optional());

const OptionalEstateQueryTextSchema = z.preprocess((value) => {
    if (typeof value !== "string") {
        return undefined;
    }

    const queryText = value.trim();

    return queryText.length > 0 ? queryText : undefined;
}, z.string().min(1).max(1000).optional());

const OptionalEstateBooleanSchema = z.preprocess((value) => {
    if (value === "true" || value === "1") {
        return true;
    }

    if (value === "false" || value === "0" || value === "") {
        return false;
    }

    return value;
}, z.boolean().optional());

const OptionalEstatePositiveNumberSchema = z.coerce.number().positive().optional();

const OptionalEstateDateStringSchema = z.string().min(1).max(20).optional();

export const EstateTransactionListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(DEFAULT_ESTATE_TRANSACTION_LIST_PAGE),
    pageSize: z.coerce
        .number()
        .int()
        .min(1)
        .max(MAX_ESTATE_TRANSACTION_LIST_PAGE_SIZE)
        .default(DEFAULT_ESTATE_TRANSACTION_LIST_PAGE_SIZE),
    q: OptionalEstateSearchKeywordSchema,
    legalDongName: OptionalEstateSearchKeywordSchema
});

export type EstateTransactionListQuery = z.infer<typeof EstateTransactionListQuerySchema>;

export const DEFAULT_ESTATE_TRANSACTION_LIST_QUERY = EstateTransactionListQuerySchema.parse({});

export const EstateTransactionParamsSchema = z.object({
    transactionId: z.coerce.number().int().positive()
});

export type EstateTransactionParams = z.infer<typeof EstateTransactionParamsSchema>;

export const EstateTransactionListItemSchema = z.object({
    id: z.number(),
    legalDongName: z.string(),
    buildingName: z.string().nullable(),
    buildingUse: z.string(),
    contractDate: z.string(),
    dealAmount10kKrw: z.number(),
    buildingAreaSquareMeter: z.string(),
    floor: z.number().nullable(),
    builtYear: z.number()
});

export type EstateTransactionListItem = z.infer<typeof EstateTransactionListItemSchema>;

export const EstateTransactionListResponseSchema = z.object({
    items: z.array(EstateTransactionListItemSchema),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(MAX_ESTATE_TRANSACTION_LIST_PAGE_SIZE),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasPreviousPage: z.boolean(),
    hasNextPage: z.boolean()
});

export type EstateTransactionListResponse = z.infer<typeof EstateTransactionListResponseSchema>;

export const EstateTransactionFilterSchema = z.object({
    q: OptionalEstateSearchKeywordSchema,
    districtName: OptionalEstateSearchKeywordSchema,
    legalDongName: OptionalEstateSearchKeywordSchema,
    buildingName: OptionalEstateSearchKeywordSchema,
    buildingUse: OptionalEstateSearchKeywordSchema,
    contractDateFrom: OptionalEstateDateStringSchema,
    contractDateTo: OptionalEstateDateStringSchema,
    dealAmountMin10kKrw: OptionalEstatePositiveNumberSchema,
    dealAmountMax10kKrw: OptionalEstatePositiveNumberSchema,
    areaMinSquareMeter: OptionalEstatePositiveNumberSchema,
    areaMaxSquareMeter: OptionalEstatePositiveNumberSchema,
    includeCanceled: OptionalEstateBooleanSchema
});

export type EstateTransactionFilter = z.infer<typeof EstateTransactionFilterSchema>;

export const EstateTransactionResponseSchema = z.object({
    id: z.number().int().positive(),
    sourceRowNumber: z.number().int().positive(),
    receiptYear: z.number().int().positive(),
    districtCode: z.string(),
    districtName: z.string(),
    legalDongCode: z.string(),
    legalDongName: z.string(),
    lotTypeCode: z.string().nullable(),
    lotTypeName: z.string().nullable(),
    mainLotNumber: z.string().nullable(),
    subLotNumber: z.string().nullable(),
    buildingName: z.string().nullable(),
    contractDate: z.string(),
    dealAmount10kKrw: z.number(),
    buildingAreaSquareMeter: z.number(),
    landAreaSquareMeter: z.number().nullable(),
    floor: z.number().int().nullable(),
    rightType: z.string().nullable(),
    canceledAt: z.string().nullable(),
    builtYear: z.number().int(),
    buildingUse: z.string(),
    reportType: z.string(),
    brokeredAgentSggName: z.string().nullable()
});

export type EstateTransactionResponse = z.infer<typeof EstateTransactionResponseSchema>;

export const EstateSimilarTransactionRequestSchema = z
    .object({
        referenceTransactionId: z.coerce.number().int().positive().optional(),
        queryText: OptionalEstateQueryTextSchema,
        filters: EstateTransactionFilterSchema.default({}),
        limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(MAX_ESTATE_SIMILAR_TRANSACTION_LIMIT)
            .default(DEFAULT_ESTATE_SIMILAR_TRANSACTION_LIMIT)
    })
    .superRefine((request, context) => {
        const hasReferenceTransactionId = request.referenceTransactionId !== undefined;
        const hasQueryText = request.queryText !== undefined;

        if (hasReferenceTransactionId === hasQueryText) {
            context.addIssue({
                code: "custom",
                path: ["referenceTransactionId"],
                message: "referenceTransactionId와 queryText 중 정확히 하나만 입력해야 합니다."
            });
        }
    });

export type EstateSimilarTransactionRequest = z.infer<typeof EstateSimilarTransactionRequestSchema>;

export const EstateSimilarTransactionItemSchema = z.object({
    transaction: EstateTransactionResponseSchema,
    score: z.number().min(0).max(1),
    vectorSimilarity: z.number().min(-1).max(1),
    areaScore: z.number().min(0).max(1),
    priceScore: z.number().min(0).max(1),
    legalDongScore: z.number().min(0).max(1),
    buildingUseScore: z.number().min(0).max(1)
});

export type EstateSimilarTransactionItem = z.infer<typeof EstateSimilarTransactionItemSchema>;

export const EstateSimilarTransactionResponseSchema = z.object({
    items: z.array(EstateSimilarTransactionItemSchema)
});

export type EstateSimilarTransactionResponse = z.infer<typeof EstateSimilarTransactionResponseSchema>;

export const EstateMarketSummaryRequestSchema = EstateTransactionFilterSchema;

export type EstateMarketSummaryRequest = z.infer<typeof EstateMarketSummaryRequestSchema>;

const EstateNullableNumberRangeSchema = z.object({
    min: z.number().nullable(),
    max: z.number().nullable(),
    average: z.number().nullable()
});

export const EstateMarketSummaryResponseSchema = z.object({
    totalCount: z.number().int().min(0),
    latestContractDate: z.string().nullable(),
    dealAmount10kKrw: EstateNullableNumberRangeSchema.extend({
        median: z.number().nullable()
    }),
    buildingAreaSquareMeter: EstateNullableNumberRangeSchema
});

export type EstateMarketSummaryResponse = z.infer<typeof EstateMarketSummaryResponseSchema>;

export const EstateLegalDongListResponseSchema = z.array(z.string().min(1));

export type EstateLegalDongListResponse = z.infer<typeof EstateLegalDongListResponseSchema>;

export const EstatePropertyParamsSchema = z.object({
    propertyId: z.coerce.number().int().positive()
});

export type EstatePropertyParams = z.infer<typeof EstatePropertyParamsSchema>;

export const EstatePropertyListQuerySchema = z.object({
    q: OptionalEstateSearchKeywordSchema,
    districtName: OptionalEstateSearchKeywordSchema,
    legalDongName: OptionalEstateSearchKeywordSchema,
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(MAX_ESTATE_PROPERTY_LIST_LIMIT)
        .default(DEFAULT_ESTATE_PROPERTY_LIST_LIMIT)
});

export type EstatePropertyListQuery = z.infer<typeof EstatePropertyListQuerySchema>;

const EstateLatitudeSchema = z.number().min(-90).max(90);
const EstateLongitudeSchema = z.number().min(-180).max(180);

export const EstateRouteCoordinateSchema = z.object({
    latitude: EstateLatitudeSchema,
    longitude: EstateLongitudeSchema
});

export type EstateRouteCoordinate = z.infer<typeof EstateRouteCoordinateSchema>;

export const EstateTransportTypeSchema = z.enum(["subway", "bus_stop", "all"]).default("all");

export type EstateTransportType = z.infer<typeof EstateTransportTypeSchema>;

export const EstateTransportPoiCategorySchema = z.enum(["subway", "bus_stop", "unknown"]);

export type EstateTransportPoiCategory = z.infer<typeof EstateTransportPoiCategorySchema>;

export const EstateTransportOperationStatusSchema = z.enum(["operating", "planned"]).default("operating");

export type EstateTransportOperationStatus = z.infer<typeof EstateTransportOperationStatusSchema>;

export const EstateWalkRouteSearchOptionSchema = z
    .enum(["recommended", "main_road", "shortest", "shortest_no_stairs"])
    .default("recommended");

export type EstateWalkRouteSearchOption = z.infer<typeof EstateWalkRouteSearchOptionSchema>;

const EstateTransportRadiusSchema = z.coerce
    .number()
    .positive()
    .max(MAX_ESTATE_TRANSPORT_RADIUS_KM)
    .default(DEFAULT_ESTATE_TRANSPORT_RADIUS_KM);

export const EstateNearbyTransportQuerySchema = z.object({
    transportType: EstateTransportTypeSchema,
    radiusKm: EstateTransportRadiusSchema,
    limit: z.coerce.number().int().min(1).max(MAX_ESTATE_TRANSPORT_LIMIT).default(DEFAULT_ESTATE_TRANSPORT_LIMIT)
});

export type EstateNearbyTransportQuery = z.infer<typeof EstateNearbyTransportQuerySchema>;

export const EstateWalkTimeToTransportQuerySchema = z.object({
    transportType: EstateTransportTypeSchema,
    radiusKm: EstateTransportRadiusSchema,
    maxCandidates: z.coerce
        .number()
        .int()
        .min(1)
        .max(MAX_ESTATE_WALK_CANDIDATE_COUNT)
        .default(DEFAULT_ESTATE_WALK_CANDIDATE_COUNT),
    searchOption: EstateWalkRouteSearchOptionSchema
});

export type EstateWalkTimeToTransportQuery = z.infer<typeof EstateWalkTimeToTransportQuerySchema>;

export const EstatePropertySummaryResponseSchema = z.object({
    id: z.number().int().positive(),
    propertyKey: z.string().min(1),
    parcelAddress: z.string().min(1),
    buildingNames: z.array(z.string()),
    districtName: z.string().min(1),
    legalDongName: z.string().min(1),
    transactionCount: z.number().int().min(0),
    latitude: EstateLatitudeSchema,
    longitude: EstateLongitudeSchema
});

export type EstatePropertySummaryResponse = z.infer<typeof EstatePropertySummaryResponseSchema>;

export const EstatePropertyListResponseSchema = z.object({
    items: z.array(EstatePropertySummaryResponseSchema),
    count: z.number().int().min(0)
});

export type EstatePropertyListResponse = z.infer<typeof EstatePropertyListResponseSchema>;

export const EstateTransportPoiSchema = z.object({
    id: z.string().min(1).optional(),
    name: z.string().min(1),
    category: EstateTransportPoiCategorySchema,
    operationStatus: EstateTransportOperationStatusSchema,
    latitude: EstateLatitudeSchema,
    longitude: EstateLongitudeSchema,
    straightDistanceM: z.number().min(0).optional(),
    rawProvider: z.literal("tmap")
});

export type EstateTransportPoi = z.infer<typeof EstateTransportPoiSchema>;

export const EstateWalkRouteSchema = z.object({
    provider: z.literal("tmap"),
    origin: z.object({
        name: z.string().min(1),
        latitude: EstateLatitudeSchema,
        longitude: EstateLongitudeSchema
    }),
    destination: z.object({
        name: z.string().min(1),
        category: EstateTransportPoiCategorySchema,
        operationStatus: EstateTransportOperationStatusSchema,
        latitude: EstateLatitudeSchema,
        longitude: EstateLongitudeSchema
    }),
    totalDistanceM: z.number().int().min(0),
    totalTimeSec: z.number().int().min(0),
    totalTimeMin: z.number().int().min(0),
    routePath: z.array(EstateRouteCoordinateSchema).default([]),
    searchOption: EstateWalkRouteSearchOptionSchema,
    cached: z.boolean(),
    computedAt: z.string().datetime(),
    notice: z.string().min(1)
});

export type EstateWalkRoute = z.infer<typeof EstateWalkRouteSchema>;

export const EstateNearbyTransportResponseSchema = z.object({
    property: EstatePropertySummaryResponseSchema,
    transportPois: z.array(EstateTransportPoiSchema),
    provider: z.literal("tmap"),
    radiusKm: z.number().positive()
});

export type EstateNearbyTransportResponse = z.infer<typeof EstateNearbyTransportResponseSchema>;

export const EstateWalkTimeToTransportResponseSchema = z.object({
    property: EstatePropertySummaryResponseSchema,
    best: EstateWalkRouteSchema.nullable(),
    candidates: z.array(EstateWalkRouteSchema),
    provider: z.literal("tmap"),
    cacheUsed: z.boolean(),
    notice: z.string().min(1)
});

export type EstateWalkTimeToTransportResponse = z.infer<typeof EstateWalkTimeToTransportResponseSchema>;
