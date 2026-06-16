import { z } from "zod";

const DEFAULT_ESTATE_TRANSACTION_LIST_PAGE = 1;
const DEFAULT_ESTATE_TRANSACTION_LIST_PAGE_SIZE = 20;
const MAX_ESTATE_TRANSACTION_LIST_PAGE_SIZE = 50;
const DEFAULT_ESTATE_SIMILAR_TRANSACTION_LIMIT = 10;
const MAX_ESTATE_SIMILAR_TRANSACTION_LIMIT = 50;

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

export const EstateSimilarTransactionRequestSchema = z.object({
    referenceTransactionId: z.coerce.number().int().positive().optional(),
    queryText: OptionalEstateQueryTextSchema,
    filters: EstateTransactionFilterSchema.default({}),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(MAX_ESTATE_SIMILAR_TRANSACTION_LIMIT)
        .default(DEFAULT_ESTATE_SIMILAR_TRANSACTION_LIMIT)
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
