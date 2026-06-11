import { createParser, createStandardSchemaV1, parseAsString, parseAsStringEnum } from "nuqs";
import type { inferParserType } from "nuqs";
import type { PostListParams } from "../api/post-api";

export const postSortValues = ["created-desc", "created-asc", "title-asc"] as const;
const postViewValues = ["table", "card"] as const;

const parseAsNumberId = createParser({
    parse: (value) => {
        const parsed = Number(value);

        return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    },
    serialize: String
});

export const postSearchParsers = {
    q: parseAsString.withDefault(""),
    tagId: parseAsNumberId,
    page: parseAsNumberId.withDefault(1),
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
        tagId: search.tagId ?? undefined,
        page: search.page,
        pageSize: 10,
        sort: search.sort,
        view: search.view
    };
}
