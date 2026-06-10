import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type {
    CommentListResponse,
    CreateCommentRequest,
    CreateCommentResponse,
    CreatePostRequest,
    CreatePostResponse,
    DeleteCommentResponse,
    DeletePostResponse,
    PostListResponse,
    PostTag,
    UpdateCommentRequest,
    UpdateCommentResponse,
    UpdatePostRequest,
    UpdatePostResponse
} from "@nmm/shared";
import {
    createComment,
    createPost,
    deleteComment,
    deletePost,
    findComments,
    findPost,
    findPosts,
    findPostTags,
    updateComment,
    updatePost,
    type PostListParams,
    type RouteResourceId
} from "./post-api";

export const postQueryKeys = {
    tags: ["post-tags"] as const,
    listPrefix: ["posts", "list"] as const,
    list: (params: PostListParams) => [...postQueryKeys.listPrefix, params] as const,
    detail: (id: RouteResourceId) => ["posts", "detail", String(id)] as const,
    comments: (id: RouteResourceId) => ["posts", "comments", String(id)] as const
};

export function usePostListQuery(params: PostListParams) {
    return useQuery({
        queryKey: postQueryKeys.list(params),
        queryFn: ({ signal }): Promise<PostListResponse> => findPosts(params, signal),
        placeholderData: (previousData) => previousData,
        throwOnError: true
    });
}

export function usePostDetailQuery(id: RouteResourceId) {
    return useSuspenseQuery({
        queryKey: postQueryKeys.detail(id),
        queryFn: ({ signal }) => findPost(id, signal)
    });
}

export function usePostTagsQuery() {
    return useQuery({
        queryKey: postQueryKeys.tags,
        queryFn: ({ signal }): Promise<PostTag[]> => findPostTags(signal),
        throwOnError: true
    });
}

export function useCommentsQuery(id: RouteResourceId) {
    return useQuery({
        queryKey: postQueryKeys.comments(id),
        queryFn: ({ signal }): Promise<CommentListResponse> => findComments(id, signal),
        throwOnError: true
    });
}

export function useCreatePostMutation(options?: { onSuccess?: (response: CreatePostResponse) => void }) {
    return useMutation({
        mutationFn: (data: CreatePostRequest) => createPost(data),
        onSuccess: options?.onSuccess
    });
}

export function useUpdatePostMutation(options?: { onSuccess?: (response: UpdatePostResponse) => void }) {
    return useMutation({
        mutationFn: ({ id, data }: { id: RouteResourceId; data: UpdatePostRequest }) => updatePost(id, data),
        onSuccess: options?.onSuccess
    });
}

export function useDeletePostMutation(options?: { onSuccess?: (response: DeletePostResponse) => void }) {
    return useMutation({
        mutationFn: (id: RouteResourceId) => deletePost(id),
        onSuccess: options?.onSuccess
    });
}

export function useCreateCommentMutation(options?: { onSuccess?: (response: CreateCommentResponse) => void }) {
    return useMutation({
        mutationFn: ({ postId, data }: { postId: RouteResourceId; data: CreateCommentRequest }) =>
            createComment(postId, data),
        onSuccess: options?.onSuccess
    });
}

export function useUpdateCommentMutation(options?: { onSuccess?: (response: UpdateCommentResponse) => void }) {
    return useMutation({
        mutationFn: ({
            postId,
            commentId,
            data
        }: {
            postId: RouteResourceId;
            commentId: RouteResourceId;
            data: UpdateCommentRequest;
        }) => updateComment(postId, commentId, data),
        onSuccess: options?.onSuccess
    });
}

export function useDeleteCommentMutation(options?: { onSuccess?: (response: DeleteCommentResponse) => void }) {
    return useMutation({
        mutationFn: ({ postId, commentId }: { postId: RouteResourceId; commentId: RouteResourceId }) =>
            deleteComment(postId, commentId),
        onSuccess: options?.onSuccess
    });
}
