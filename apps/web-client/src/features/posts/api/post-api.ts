import {
    CommentListResponseSchema,
    CommentSchema,
    CreateCommentRequestSchema,
    CreatePostRequestSchema,
    DeleteCommentResponseSchema,
    DeletePostResponseSchema,
    PostListResponseSchema,
    PostSchema,
    PostTagSchema,
    UpdateCommentRequestSchema,
    UpdatePostRequestSchema,
    type CreateCommentRequest,
    type CreatePostRequest,
    type ListPostsQuery,
    type ResourceId,
    type UpdateCommentRequest,
    type UpdatePostRequest
} from "@nmm/shared";
import { z } from "zod";
import { requestApiData, toQueryString } from "@/shared/api/http-client";

export type PostListParams = Partial<ListPostsQuery>;
export type RouteResourceId = ResourceId | string;

function toRouteId(id: RouteResourceId) {
    return String(id);
}

export function findPosts(params: PostListParams, signal?: AbortSignal) {
    return requestApiData(`/api/posts${toQueryString(params)}`, PostListResponseSchema, { signal });
}

export function findPost(id: RouteResourceId, signal?: AbortSignal) {
    return requestApiData(`/api/posts/${encodeURIComponent(toRouteId(id))}`, PostSchema, { signal });
}

export function createPost(request: CreatePostRequest) {
    return requestApiData("/api/posts", PostSchema, {
        method: "POST",
        body: CreatePostRequestSchema.parse(request)
    });
}

export function updatePost(id: RouteResourceId, request: UpdatePostRequest) {
    return requestApiData(`/api/posts/${encodeURIComponent(toRouteId(id))}`, PostSchema, {
        method: "PATCH",
        body: UpdatePostRequestSchema.parse(request)
    });
}

export function deletePost(id: RouteResourceId) {
    return requestApiData(`/api/posts/${encodeURIComponent(toRouteId(id))}`, DeletePostResponseSchema, {
        method: "DELETE"
    });
}

export function findPostTags(signal?: AbortSignal) {
    return requestApiData("/api/post-tags", z.array(PostTagSchema), { signal });
}

export function findComments(postId: RouteResourceId, signal?: AbortSignal) {
    return requestApiData(`/api/posts/${encodeURIComponent(toRouteId(postId))}/comments`, CommentListResponseSchema, {
        signal
    });
}

export function createComment(postId: RouteResourceId, request: CreateCommentRequest) {
    return requestApiData(`/api/posts/${encodeURIComponent(toRouteId(postId))}/comments`, CommentSchema, {
        method: "POST",
        body: CreateCommentRequestSchema.parse(request)
    });
}

export function updateComment(postId: RouteResourceId, commentId: RouteResourceId, request: UpdateCommentRequest) {
    return requestApiData(
        `/api/posts/${encodeURIComponent(toRouteId(postId))}/comments/${encodeURIComponent(toRouteId(commentId))}`,
        CommentSchema,
        {
            method: "PATCH",
            body: UpdateCommentRequestSchema.parse(request)
        }
    );
}

export function deleteComment(postId: RouteResourceId, commentId: RouteResourceId) {
    return requestApiData(
        `/api/posts/${encodeURIComponent(toRouteId(postId))}/comments/${encodeURIComponent(toRouteId(commentId))}`,
        DeleteCommentResponseSchema,
        {
            method: "DELETE"
        }
    );
}
