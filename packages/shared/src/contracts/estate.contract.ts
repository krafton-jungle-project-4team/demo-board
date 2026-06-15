import { z } from "zod";

const DEFAULT_ESTATE_TRANSACTION_LIST_PAGE = 1;
const DEFAULT_ESTATE_TRANSACTION_LIST_PAGE_SIZE = 20;
const MAX_ESTATE_TRANSACTION_LIST_PAGE_SIZE = 50;

const OptionalEstateSearchKeywordSchema = z.preprocess((value) => {
    if (typeof value !== "string") {
        return undefined;
    }

    const keyword = value.trim();

    return keyword.length > 0 ? keyword : undefined;
}, z.string().min(1).max(100).optional());

export const EstateTransactionListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(DEFAULT_ESTATE_TRANSACTION_LIST_PAGE),
    pageSize: z.coerce
        .number()
        .int()
        .min(1)
        .max(MAX_ESTATE_TRANSACTION_LIST_PAGE_SIZE)
        .default(DEFAULT_ESTATE_TRANSACTION_LIST_PAGE_SIZE),
    q: OptionalEstateSearchKeywordSchema
});

export type EstateTransactionListQuery = z.infer<typeof EstateTransactionListQuerySchema>;

export const DEFAULT_ESTATE_TRANSACTION_LIST_QUERY = EstateTransactionListQuerySchema.parse({});

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
