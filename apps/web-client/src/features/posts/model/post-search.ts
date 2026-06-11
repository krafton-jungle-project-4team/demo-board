import { createParser, createStandardSchemaV1, parseAsString, parseAsStringEnum } from "nuqs";
import type { inferParserType } from "nuqs";
import type { PostListParams } from "../api/post-api";

export const postSortValues = ["created-desc", "created-asc", "title-asc"] as const;
export type PostSortValue = (typeof postSortValues)[number];

const postViewValues = ["table", "card"] as const;
const ALL_POST_TAG_SELECT_VALUE = "all";
const DEFAULT_POST_SORT: PostSortValue = "created-desc";
const DEFAULT_POST_VIEW = "table";
export const POST_LIST_PAGE_SIZE = 10;

function parseNumberId(value: string): number | null {
    const parsed = Number(value);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

const parseAsNumberId = createParser({
    parse: parseNumberId,
    serialize: String
});

export const postSearchParsers = {
    q: parseAsString.withDefault(""),
    tagId: parseAsNumberId,
    page: parseAsNumberId.withDefault(1),
    sort: parseAsStringEnum([...postSortValues]).withDefault(DEFAULT_POST_SORT),
    view: parseAsStringEnum([...postViewValues]).withDefault(DEFAULT_POST_VIEW)
};

export const postSearchSchema = createStandardSchemaV1(postSearchParsers, {
    partialOutput: true
});

export type PostSearchState = inferParserType<typeof postSearchParsers>;

export function parsePostSortSelectValue(value: string): PostSortValue | null {
    return postSortValues.find((sort) => sort === value) ?? null;
}

export function toPostTagSelectValue(tagId: number | null): string {
    return tagId === null ? ALL_POST_TAG_SELECT_VALUE : String(tagId);
}

export function parsePostTagSelectValue(value: string): number | null | undefined {
    if (value === ALL_POST_TAG_SELECT_VALUE) {
        return null;
    }

    return parseNumberId(value) ?? undefined;
}

export function toFindPostsParams(search: PostSearchState): PostListParams {
    return {
        q: search.q || undefined,
        tagId: search.tagId ?? undefined,
        page: search.page,
        pageSize: POST_LIST_PAGE_SIZE,
        sort: search.sort,
        view: search.view
    };
}
