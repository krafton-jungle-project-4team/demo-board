import { z } from "zod";

const OptionalSearchTextSchema = z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .describe("검색어입니다. 빈 문자열은 보내지 않습니다.");
const OptionalQueryTextSchema = z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .optional()
    .describe("자연어 유사 매물 검색 문장입니다. 예: 잠실 84제곱 아파트 최근 거래");
const OptionalDateStringSchema = z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe("YYYY-MM-DD 형식의 날짜입니다.");
const OptionalPositiveNumberSchema = z.number().positive().optional();

const EstateTransactionFilterToolInputSchema = z
    .object({
        q: OptionalSearchTextSchema.describe("건물명, 법정동, 건물용도에 적용할 통합 검색어입니다."),
        districtName: OptionalSearchTextSchema.describe("자치구명입니다. 예: 송파구"),
        legalDongName: OptionalSearchTextSchema.describe("법정동명입니다. 예: 잠실동"),
        buildingName: OptionalSearchTextSchema.describe("건물명입니다. 예: 헬리오시티"),
        buildingUse: OptionalSearchTextSchema.describe("건물용도입니다. 예: 아파트, 오피스텔"),
        contractDateFrom: OptionalDateStringSchema.describe("계약일 시작일입니다."),
        contractDateTo: OptionalDateStringSchema.describe("계약일 종료일입니다."),
        dealAmountMin10kKrw: OptionalPositiveNumberSchema.describe("최소 거래금액입니다. 단위는 만원입니다."),
        dealAmountMax10kKrw: OptionalPositiveNumberSchema.describe("최대 거래금액입니다. 단위는 만원입니다."),
        areaMinSquareMeter: OptionalPositiveNumberSchema.describe("최소 전용/건물 면적입니다. 단위는 제곱미터입니다."),
        areaMaxSquareMeter: OptionalPositiveNumberSchema.describe("최대 전용/건물 면적입니다. 단위는 제곱미터입니다."),
        includeCanceled: z.boolean().optional().describe("취소 거래 포함 여부입니다. 기본값은 false입니다.")
    })
    .strict();

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

export const EstateGetTransactionToolInputSchema = z
    .object({
        transactionId: z.number().int().positive().describe("조회할 실거래 ID입니다.")
    })
    .strict();

export type EstateGetTransactionToolInput = z.infer<typeof EstateGetTransactionToolInputSchema>;

export const EstateFindSimilarTransactionsToolInputSchema = z
    .object({
        referenceTransactionId: z
            .number()
            .int()
            .positive()
            .optional()
            .describe("기준 실거래 ID입니다. queryText와 동시에 입력하지 않습니다."),
        queryText: OptionalQueryTextSchema,
        filters: EstateTransactionFilterToolInputSchema.default({}).describe("유사 매물 후보를 좁히는 필터입니다."),
        limit: z.number().int().min(1).max(50).default(10).describe("반환할 유사 실거래 수입니다.")
    })
    .strict()
    .superRefine((input, context) => {
        const hasReferenceTransactionId = input.referenceTransactionId !== undefined;
        const hasQueryText = input.queryText !== undefined;

        if (hasReferenceTransactionId === hasQueryText) {
            context.addIssue({
                code: "custom",
                path: ["referenceTransactionId"],
                message: "referenceTransactionId와 queryText 중 정확히 하나만 입력해야 합니다."
            });
        }
    });

export type EstateFindSimilarTransactionsToolInput = z.infer<typeof EstateFindSimilarTransactionsToolInputSchema>;

export const EstateSummarizeMarketToolInputSchema = EstateTransactionFilterToolInputSchema;

export type EstateSummarizeMarketToolInput = z.infer<typeof EstateSummarizeMarketToolInputSchema>;
