import { z } from "zod";

const OptionalSearchTextSchema = z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .describe("검색어입니다. 빈 문자열은 보내지 않습니다.");

export const EstateSearchTransactionsToolInputSchema = z
    .object({
        page: z.number().int().min(1).default(1).describe("조회할 페이지 번호입니다."),
        pageSize: z.number().int().min(1).max(50).default(20).describe("한 페이지에 반환할 실거래 수입니다."),
        q: OptionalSearchTextSchema.describe("법정동, 건물명, 건물용도에 적용할 통합 검색어입니다."),
        legalDongName: OptionalSearchTextSchema.describe("정확히 일치시킬 법정동명입니다. 예: 잠실동")
    })
    .strict();

export type EstateSearchTransactionsToolInput = z.infer<typeof EstateSearchTransactionsToolInputSchema>;

export const EstateListLegalDongsToolInputSchema = z
    .object({
        q: OptionalSearchTextSchema.describe("법정동 후보를 좁히는 검색어입니다. 예: 잠실"),
        limit: z.number().int().min(1).max(100).default(20).describe("반환할 법정동 후보 수입니다."),
        offset: z.number().int().min(0).default(0).describe("건너뛸 법정동 후보 수입니다.")
    })
    .strict();

export type EstateListLegalDongsToolInput = z.infer<typeof EstateListLegalDongsToolInputSchema>;
