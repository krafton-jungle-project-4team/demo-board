import { queryOptions } from "@tanstack/react-query";
import type { BoardCommentListQuery, BoardPostListQuery } from "@nmm/shared";
import { getBoardComments, getBoardPost, getBoardPostList, getBoardTags } from "./board-api";

const boardQueryKeyRoot = ["board"] as const;

export const boardQueryKeys = {
    all: boardQueryKeyRoot,
    postList: (query: BoardPostListQuery) => [...boardQueryKeyRoot, "posts", "list", query] as const,
    post: (postId: number) => [...boardQueryKeyRoot, "posts", postId] as const,
    tags: [...boardQueryKeyRoot, "tags"] as const,
    comments: (postId: number, query: BoardCommentListQuery) =>
        [...boardQueryKeyRoot, "posts", postId, "comments", query] as const
};

export function boardPostListQueryOptions(query: BoardPostListQuery) {
    return queryOptions({
        queryKey: boardQueryKeys.postList(query),
        queryFn: () => getBoardPostList(query)
    });
}

export function boardPostQueryOptions(postId: number) {
    return queryOptions({
        queryKey: boardQueryKeys.post(postId),
        queryFn: () => getBoardPost(postId)
    });
}

export const boardTagsQueryOptions = queryOptions({
    queryKey: boardQueryKeys.tags,
    queryFn: getBoardTags
});

export function boardCommentsQueryOptions(postId: number, query: BoardCommentListQuery) {
    return queryOptions({
        queryKey: boardQueryKeys.comments(postId, query),
        queryFn: () => getBoardComments(postId, query)
    });
}
