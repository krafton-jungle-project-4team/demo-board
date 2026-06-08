import { createParser, createStandardSchemaV1, parseAsString, parseAsStringEnum } from "nuqs";
import type { inferParserType } from "nuqs";
import type { PostsControllerFindPostsParams } from "@/shared/api/generated/api-server";

export const postSortValues = ["created-desc", "created-asc", "title-asc"] as const;
export const postViewValues = ["table", "card"] as const;

const parseAsPositiveInteger = createParser({
  parse: (value) => {
    const parsed = Number(value);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  },
  serialize: String
});

export const postSearchParsers = {
  q: parseAsString.withDefault(""),
  page: parseAsPositiveInteger.withDefault(1),
  sort: parseAsStringEnum([...postSortValues]).withDefault("created-desc"),
  view: parseAsStringEnum([...postViewValues]).withDefault("table")
};

export const postSearchSchema = createStandardSchemaV1(postSearchParsers, {
  partialOutput: true
});

export type PostSearchState = inferParserType<typeof postSearchParsers>;

export function toFindPostsParams(search: PostSearchState): PostsControllerFindPostsParams {
  return {
    q: search.q || undefined,
    page: search.page,
    pageSize: 10,
    sort: search.sort,
    view: search.view
  };
}
