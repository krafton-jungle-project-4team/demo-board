import { queryOptions } from "@tanstack/react-query";
import type { PostListQuery } from "@nmm/shared";
import { getPostList } from "./post-query-api";

export function postListQueryOptions(query: PostListQuery) {
    return queryOptions({
        queryKey: ["posts", "list", query],
        queryFn: () => getPostList(query)
    });
}
