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
    type UpdateCommentRequest,
    type UpdatePostRequest
} from "@nmm/shared";
import { z } from "zod";
import { requestApiData, toQueryString } from "@/shared/api/http-client";

export type PostListParams = Partial<ListPostsQuery>;

export function findPosts(params: PostListParams, signal?: AbortSignal) {
    return requestApiData(`/api/posts${toQueryString(params)}`, PostListResponseSchema, { signal });
}

export function findPost(id: string, signal?: AbortSignal) {
    return requestApiData(`/api/posts/${encodeURIComponent(id)}`, PostSchema, { signal });
}

export function createPost(request: CreatePostRequest) {
    return requestApiData("/api/posts", PostSchema, {
        method: "POST",
        body: CreatePostRequestSchema.parse(request)
    });
}

export function updatePost(id: string, request: UpdatePostRequest) {
    return requestApiData(`/api/posts/${encodeURIComponent(id)}`, PostSchema, {
        method: "PATCH",
        body: UpdatePostRequestSchema.parse(request)
    });
}

export function deletePost(id: string) {
    return requestApiData(`/api/posts/${encodeURIComponent(id)}`, DeletePostResponseSchema, {
        method: "DELETE"
    });
}

export function findPostTags(signal?: AbortSignal) {
    return requestApiData("/api/post-tags", z.array(PostTagSchema), { signal });
}

export function findComments(postId: string, signal?: AbortSignal) {
    return requestApiData(`/api/posts/${encodeURIComponent(postId)}/comments`, CommentListResponseSchema, { signal });
}

export function createComment(postId: string, request: CreateCommentRequest) {
    return requestApiData(`/api/posts/${encodeURIComponent(postId)}/comments`, CommentSchema, {
        method: "POST",
        body: CreateCommentRequestSchema.parse(request)
    });
}

export function updateComment(postId: string, commentId: string, request: UpdateCommentRequest) {
    return requestApiData(
        `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
        CommentSchema,
        {
            method: "PATCH",
            body: UpdateCommentRequestSchema.parse(request)
        }
    );
}

export function deleteComment(postId: string, commentId: string) {
    return requestApiData(
        `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
        DeleteCommentResponseSchema,
        {
            method: "DELETE"
        }
    );
}
