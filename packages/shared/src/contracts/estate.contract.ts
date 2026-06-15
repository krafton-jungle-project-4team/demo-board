import { z } from "zod";

const OptionalEstateSearchKeywordSchema = z.preprocess((value) => {
    if (typeof value !== "string") {
        return undefined;
    }

    const keyword = value.trim();

    return keyword.length > 0 ? keyword : undefined;
}, z.string().min(1).max(100).optional());

export const EstateTransactionListQuerySchema = z.object({
    legalDongName: OptionalEstateSearchKeywordSchema,
    buildingUse: OptionalEstateSearchKeywordSchema,
    buildingName: OptionalEstateSearchKeywordSchema
});

export type EstateTransactionListQuery = z.infer<typeof EstateTransactionListQuerySchema>;

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

export const EstateTransactionListResponseSchema = z.array(EstateTransactionListItemSchema);

export type EstateTransactionListResponse = z.infer<typeof EstateTransactionListResponseSchema>;
