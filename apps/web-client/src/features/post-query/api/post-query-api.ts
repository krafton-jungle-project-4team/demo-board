import { PostListResponseSchema, type PostListQuery, type PostListResponse } from "@nmm/shared";
import { requestApiData } from "@/shared/api/http-client";

export function getPostList(query: PostListQuery): Promise<PostListResponse> {
    return requestApiData(`posts?${createPostListSearchParams(query)}`, PostListResponseSchema);
}

function createPostListSearchParams(query: PostListQuery) {
    const searchParams = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
        searchScope: query.searchScope
    });

    if (query.q) {
        searchParams.set("q", query.q);
    }

    return searchParams.toString();
}
