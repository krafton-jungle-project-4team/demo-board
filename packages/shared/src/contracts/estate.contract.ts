import { z } from "zod";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_ESTATE_TRANSACTION_PAGE = 1;
const DEFAULT_ESTATE_TRANSACTION_PAGE_SIZE = 10;
const MAX_ESTATE_TRANSACTION_PAGE_SIZE = 50;
const DEFAULT_ESTATE_SIMILAR_LIMIT = 5;
const MAX_ESTATE_SIMILAR_LIMIT = 20;

export const EstateTransactionIdSchema = z.number().int().positive();

const OptionalTrimmedTextSchema = z.preprocess((value) => {
    if (typeof value !== "string") {
        return undefined;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : undefined;
}, z.string().min(1).max(100).optional());

const OptionalDateSchema = z.preprocess((value) => {
    if (typeof value !== "string") {
        return undefined;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : undefined;
}, z.string().regex(DATE_PATTERN).optional());

const OptionalPositiveNumberSchema = z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
        return undefined;
    }

    return value;
}, z.coerce.number().positive().optional());

const BooleanQuerySchema = z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
        return undefined;
    }

    if (value === "true") {
        return true;
    }

    if (value === "false") {
        return false;
    }

    return value;
}, z.boolean().default(false));

export const EstateTransactionFilterSchema = z.object({
    q: OptionalTrimmedTextSchema,
    districtName: OptionalTrimmedTextSchema,
    legalDongName: OptionalTrimmedTextSchema,
    buildingName: OptionalTrimmedTextSchema,
    buildingUse: OptionalTrimmedTextSchema,
    contractDateFrom: OptionalDateSchema,
    contractDateTo: OptionalDateSchema,
    dealAmountMin10kKrw: OptionalPositiveNumberSchema,
    dealAmountMax10kKrw: OptionalPositiveNumberSchema,
    areaMinSquareMeter: OptionalPositiveNumberSchema,
    areaMaxSquareMeter: OptionalPositiveNumberSchema,
    includeCanceled: BooleanQuerySchema
});

export type EstateTransactionFilter = z.infer<typeof EstateTransactionFilterSchema>;

export const EstateTransactionSearchRequestSchema = EstateTransactionFilterSchema.extend({
    page: z.coerce.number().int().min(1).default(DEFAULT_ESTATE_TRANSACTION_PAGE),
    pageSize: z.coerce
        .number()
        .int()
        .min(1)
        .max(MAX_ESTATE_TRANSACTION_PAGE_SIZE)
        .default(DEFAULT_ESTATE_TRANSACTION_PAGE_SIZE)
});

export type EstateTransactionSearchRequest = z.infer<typeof EstateTransactionSearchRequestSchema>;

export const EstateTransactionParamsSchema = z.object({
    transactionId: z.coerce.number().int().positive()
});

export type EstateTransactionParams = z.infer<typeof EstateTransactionParamsSchema>;

export const EstateTransactionResponseSchema = z.object({
    id: EstateTransactionIdSchema,
    sourceRowNumber: z.number().int().positive(),
    receiptYear: z.number().int().positive(),
    districtCode: z.string().min(1),
    districtName: z.string().min(1),
    legalDongCode: z.string().min(1),
    legalDongName: z.string().min(1),
    lotTypeCode: z.string().nullable(),
    lotTypeName: z.string().nullable(),
    mainLotNumber: z.string().nullable(),
    subLotNumber: z.string().nullable(),
    buildingName: z.string().nullable(),
    contractDate: z.string().regex(DATE_PATTERN),
    dealAmount10kKrw: z.number().int().positive(),
    buildingAreaSquareMeter: z.number().positive(),
    landAreaSquareMeter: z.number().nullable(),
    floor: z.number().int().nullable(),
    rightType: z.string().nullable(),
    canceledAt: z.string().regex(DATE_PATTERN).nullable(),
    builtYear: z.number().int().min(0),
    buildingUse: z.string().min(1),
    reportType: z.string().min(1),
    brokeredAgentSggName: z.string().nullable()
});

export type EstateTransactionResponse = z.infer<typeof EstateTransactionResponseSchema>;

export const EstateTransactionSearchResponseSchema = z.object({
    items: z.array(EstateTransactionResponseSchema),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1).max(MAX_ESTATE_TRANSACTION_PAGE_SIZE),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasPreviousPage: z.boolean(),
    hasNextPage: z.boolean()
});

export type EstateTransactionSearchResponse = z.infer<typeof EstateTransactionSearchResponseSchema>;

export const EstateSimilarTransactionRequestSchema = z
    .object({
        referenceTransactionId: EstateTransactionIdSchema.optional(),
        queryText: OptionalTrimmedTextSchema,
        filters: EstateTransactionFilterSchema.partial().default({}),
        limit: z.coerce.number().int().min(1).max(MAX_ESTATE_SIMILAR_LIMIT).default(DEFAULT_ESTATE_SIMILAR_LIMIT)
    })
    .superRefine((request, context) => {
        const hasReferenceTransactionId = request.referenceTransactionId !== undefined;
        const hasQueryText = request.queryText !== undefined;

        if (hasReferenceTransactionId === hasQueryText) {
            context.addIssue({
                code: "custom",
                path: ["referenceTransactionId"],
                message: "referenceTransactionId와 queryText 중 하나만 입력해야 합니다."
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

const NullableNumberSchema = z.number().nullable();

export const EstateMarketSummaryResponseSchema = z.object({
    totalCount: z.number().int().min(0),
    latestContractDate: z.string().regex(DATE_PATTERN).nullable(),
    dealAmount10kKrw: z.object({
        min: NullableNumberSchema,
        max: NullableNumberSchema,
        average: NullableNumberSchema,
        median: NullableNumberSchema
    }),
    buildingAreaSquareMeter: z.object({
        min: NullableNumberSchema,
        max: NullableNumberSchema,
        average: NullableNumberSchema
    })
});

export type EstateMarketSummaryResponse = z.infer<typeof EstateMarketSummaryResponseSchema>;
