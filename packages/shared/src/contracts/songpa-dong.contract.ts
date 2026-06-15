import { z } from "zod";

export const SONGPA_BOARD_DONGS = [
    { stdgCd: "10100", stdgNm: "잠실동" },
    { stdgCd: "10200", stdgNm: "신천동" },
    { stdgCd: "10300", stdgNm: "풍납동" },
    { stdgCd: "10400", stdgNm: "송파동" },
    { stdgCd: "10500", stdgNm: "석촌동" },
    { stdgCd: "10600", stdgNm: "삼전동" },
    { stdgCd: "10700", stdgNm: "가락동" },
    { stdgCd: "10800", stdgNm: "문정동" },
    { stdgCd: "10900", stdgNm: "장지동" },
    { stdgCd: "11100", stdgNm: "방이동" },
    { stdgCd: "11200", stdgNm: "오금동" },
    { stdgCd: "11300", stdgNm: "거여동" },
    { stdgCd: "11400", stdgNm: "마천동" }
] as const;

export type SongpaBoardDong = (typeof SONGPA_BOARD_DONGS)[number];
export type SongpaBoardDongCode = SongpaBoardDong["stdgCd"];

const SONGPA_BOARD_DONG_CODE_SET = new Set<string>(SONGPA_BOARD_DONGS.map((dong) => dong.stdgCd));
const SONGPA_BOARD_DONG_NAME_BY_CODE = new Map<string, string>(
    SONGPA_BOARD_DONGS.map((dong) => [dong.stdgCd, dong.stdgNm])
);

export const SongpaBoardDongCodeSchema = z.custom<SongpaBoardDongCode>(
    (value) => typeof value === "string" && SONGPA_BOARD_DONG_CODE_SET.has(value),
    "송파구 동을 선택해주세요."
);

export const SongpaBoardDongNameSchema = z.string().min(1);

export const NullableSongpaBoardDongCodeSchema = z.preprocess(
    (value) => (value === undefined ? null : value),
    SongpaBoardDongCodeSchema.nullable()
);

export const NullableSongpaBoardDongNameSchema = z.preprocess(
    (value) => (value === undefined ? null : value),
    SongpaBoardDongNameSchema.nullable()
);

export const SongpaBoardDongSchema = z.object({
    stdgCd: SongpaBoardDongCodeSchema,
    stdgNm: SongpaBoardDongNameSchema
});

export const SongpaBoardDongListResponseSchema = z.array(SongpaBoardDongSchema);

export type SongpaBoardDongListResponse = z.infer<typeof SongpaBoardDongListResponseSchema>;

export function isSongpaBoardDongCode(value: unknown): value is SongpaBoardDongCode {
    return SongpaBoardDongCodeSchema.safeParse(value).success;
}

export function getSongpaBoardDongName(value: string | null | undefined) {
    if (!value) {
        return null;
    }

    return SONGPA_BOARD_DONG_NAME_BY_CODE.get(value) ?? null;
}
