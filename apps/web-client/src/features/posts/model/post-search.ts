import { createParser, createStandardSchemaV1, parseAsStringEnum } from "nuqs";
import type { inferParserType } from "nuqs";
import type { PostListParams } from "../api/post-api";

export const postSortValues = ["created-desc", "created-asc", "title-asc"] as const;
export const postViewValues = ["table", "card"] as const;

const parseAsPositiveInteger = createParser({
    parse: (value) => {
        const parsed = Number(value);

        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    },
    serialize: String
});

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: true });

function serializeBase64UrlString(value: string) {
    if (!value) {
        return "";
    }

    const binary = Array.from(textEncoder.encode(value), (byte) => String.fromCharCode(byte)).join("");

    return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

const parseAsBase64UrlString = createParser({
    parse: (value) => {
        if (!value) {
            return "";
        }

        try {
            const base64 = value
                .replaceAll("-", "+")
                .replaceAll("_", "/")
                .padEnd(Math.ceil(value.length / 4) * 4, "=");
            const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
            const decoded = textDecoder.decode(bytes);

            return serializeBase64UrlString(decoded) === value ? decoded : null;
        } catch {
            return null;
        }
    },
    serialize: serializeBase64UrlString
});

export const postSearchParsers = {
    q: parseAsBase64UrlString.withDefault(""),
    page: parseAsPositiveInteger.withDefault(1),
    sort: parseAsStringEnum([...postSortValues]).withDefault("created-desc"),
    view: parseAsStringEnum([...postViewValues]).withDefault("table")
};

export const postSearchSchema = createStandardSchemaV1(postSearchParsers, {
    partialOutput: true
});

export type PostSearchState = inferParserType<typeof postSearchParsers>;

export function toFindPostsParams(search: PostSearchState): PostListParams {
    return {
        q: search.q || undefined,
        page: search.page,
        pageSize: 10,
        sort: search.sort,
        view: search.view
    };
}
