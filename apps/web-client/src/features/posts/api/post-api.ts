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
    type CommentListResponse,
    type CreateCommentRequest,
    type CreateCommentResponse,
    type CreatePostRequest,
    type CreatePostResponse,
    type DeleteCommentResponse,
    type DeletePostResponse,
    type ListPostsQuery,
    type Post,
    type PostListResponse,
    type PostTag,
    type ResourceId,
    type UpdateCommentRequest,
    type UpdateCommentResponse,
    type UpdatePostResponse,
    type UpdatePostRequest
} from "@nmm/shared";
import { z } from "zod";
import { requestApiData } from "@/shared/api/http-client";

export type PostListParams = Partial<ListPostsQuery>;
export type RouteResourceId = ResourceId | string;

function toPathId(id: RouteResourceId) {
    return encodeURIComponent(String(id));
}

export function findPosts(params: PostListParams, signal?: AbortSignal): Promise<PostListResponse> {
    return requestApiData("posts", PostListResponseSchema, { searchParams: params, signal });
}

export function findPost(rawPostId: RouteResourceId, signal?: AbortSignal): Promise<Post> {
    const postId = toPathId(rawPostId);

    return requestApiData(`posts/${postId}`, PostSchema, { signal });
}

export function createPost(request: CreatePostRequest): Promise<CreatePostResponse> {
    const body: CreatePostRequest = CreatePostRequestSchema.parse(request);

    return requestApiData("posts", CreatePostResponseSchema, {
        method: "POST",
        json: body
    });
}

export function updatePost(rawPostId: RouteResourceId, request: UpdatePostRequest): Promise<UpdatePostResponse> {
    const postId = toPathId(rawPostId);
    const body: UpdatePostRequest = UpdatePostRequestSchema.parse(request);

    return requestApiData(`posts/${postId}`, UpdatePostResponseSchema, {
        method: "PATCH",
        json: body
    });
}

export function deletePost(rawPostId: RouteResourceId): Promise<DeletePostResponse> {
    const postId = toPathId(rawPostId);

    return requestApiData(`posts/${postId}`, DeletePostResponseSchema, {
        method: "DELETE"
    });
}

export function findPostTags(signal?: AbortSignal): Promise<PostTag[]> {
    return requestApiData("post-tags", z.array(PostTagSchema), { signal });
}

export function findComments(rawPostId: RouteResourceId, signal?: AbortSignal): Promise<CommentListResponse> {
    const postId = toPathId(rawPostId);

    return requestApiData(`posts/${postId}/comments`, CommentListResponseSchema, {
        signal
    });
}

export function createComment(
    rawPostId: RouteResourceId,
    request: CreateCommentRequest
): Promise<CreateCommentResponse> {
    const postId = toPathId(rawPostId);
    const body: CreateCommentRequest = CreateCommentRequestSchema.parse(request);

    return requestApiData(`posts/${postId}/comments`, CreateCommentResponseSchema, {
        method: "POST",
        json: body
    });
}

export function updateComment(
    rawPostId: RouteResourceId,
    rawCommentId: RouteResourceId,
    request: UpdateCommentRequest
): Promise<UpdateCommentResponse> {
    const postId = toPathId(rawPostId);
    const commentId = toPathId(rawCommentId);
    const body: UpdateCommentRequest = UpdateCommentRequestSchema.parse(request);

    return requestApiData(`posts/${postId}/comments/${commentId}`, UpdateCommentResponseSchema, {
        method: "PATCH",
        json: body
    });
}

export function deleteComment(
    rawPostId: RouteResourceId,
    rawCommentId: RouteResourceId
): Promise<DeleteCommentResponse> {
    const postId = toPathId(rawPostId);
    const commentId = toPathId(rawCommentId);

    return requestApiData(`posts/${postId}/comments/${commentId}`, DeleteCommentResponseSchema, {
        method: "DELETE"
    });
}
