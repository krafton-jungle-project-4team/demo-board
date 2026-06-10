import {
    CommentListResponseSchema,
    CreateCommentRequestSchema,
    CreateCommentResponseSchema,
    CreatePostRequestSchema,
    CreatePostResponseSchema,
    DeleteCommentResponseSchema,
    DeletePostResponseSchema,
    PostListResponseSchema,
    PostSchema,
    PostTagSchema,
    UpdateCommentRequestSchema,
    UpdateCommentResponseSchema,
    UpdatePostRequestSchema,
    UpdatePostResponseSchema,
    type CreateCommentRequest,
    type CreatePostRequest,
    type ListPostsQuery,
    type ResourceId,
    type UpdateCommentRequest,
    type UpdatePostRequest
} from "@nmm/shared";
import { z } from "zod";
import { requestApiData } from "@/shared/api/http-client";

export type PostListParams = Partial<ListPostsQuery>;
export type RouteResourceId = ResourceId | string;

function toRouteId(id: RouteResourceId) {
    return String(id);
}

export function findPosts(params: PostListParams, signal?: AbortSignal) {
    return requestApiData("posts", PostListResponseSchema, { searchParams: params, signal });
}

export function findPost(id: RouteResourceId, signal?: AbortSignal) {
    return requestApiData(`posts/${encodeURIComponent(toRouteId(id))}`, PostSchema, { signal });
}

export function createPost(request: CreatePostRequest) {
    return requestApiData("posts", CreatePostResponseSchema, {
        method: "POST",
        json: CreatePostRequestSchema.parse(request)
    });
}

export function updatePost(id: RouteResourceId, request: UpdatePostRequest) {
    return requestApiData(`posts/${encodeURIComponent(toRouteId(id))}`, UpdatePostResponseSchema, {
        method: "PATCH",
        json: UpdatePostRequestSchema.parse(request)
    });
}

export function deletePost(id: RouteResourceId) {
    return requestApiData(`posts/${encodeURIComponent(toRouteId(id))}`, DeletePostResponseSchema, {
        method: "DELETE"
    });
}

export function findPostTags(signal?: AbortSignal) {
    return requestApiData("post-tags", z.array(PostTagSchema), { signal });
}

export function findComments(postId: RouteResourceId, signal?: AbortSignal) {
    return requestApiData(`posts/${encodeURIComponent(toRouteId(postId))}/comments`, CommentListResponseSchema, {
        signal
    });
}

export function createComment(postId: RouteResourceId, request: CreateCommentRequest) {
    return requestApiData(`posts/${encodeURIComponent(toRouteId(postId))}/comments`, CreateCommentResponseSchema, {
        method: "POST",
        json: CreateCommentRequestSchema.parse(request)
    });
}

export function updateComment(postId: RouteResourceId, commentId: RouteResourceId, request: UpdateCommentRequest) {
    return requestApiData(
        `posts/${encodeURIComponent(toRouteId(postId))}/comments/${encodeURIComponent(toRouteId(commentId))}`,
        UpdateCommentResponseSchema,
        {
            method: "PATCH",
            json: UpdateCommentRequestSchema.parse(request)
        }
    );
}

export function deleteComment(postId: RouteResourceId, commentId: RouteResourceId) {
    return requestApiData(
        `posts/${encodeURIComponent(toRouteId(postId))}/comments/${encodeURIComponent(toRouteId(commentId))}`,
        DeleteCommentResponseSchema,
        {
            method: "DELETE"
        }
    );
}
