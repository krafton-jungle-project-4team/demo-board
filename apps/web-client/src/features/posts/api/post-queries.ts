import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
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

const postQueryKeys = {
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
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePostRequest) => createPost(data),
        onSuccess: (response) => {
            void queryClient.invalidateQueries({
                queryKey: postQueryKeys.listPrefix,
                refetchType: "none"
            });
            options?.onSuccess?.(response);
        }
    });
}

export function useUpdatePostMutation(options?: { onSuccess?: (response: UpdatePostResponse) => void }) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: RouteResourceId; data: UpdatePostRequest }) => updatePost(id, data),
        onSuccess: (response) => {
            void queryClient.invalidateQueries({
                queryKey: postQueryKeys.listPrefix,
                refetchType: "none"
            });
            void queryClient.invalidateQueries({
                queryKey: postQueryKeys.detail(response.postId),
                refetchType: "none"
            });
            options?.onSuccess?.(response);
        }
    });
}

export function useDeletePostMutation(options?: { onSuccess?: (response: DeletePostResponse) => void }) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: RouteResourceId) => deletePost(id),
        onSuccess: (response) => {
            void queryClient.invalidateQueries({
                queryKey: postQueryKeys.listPrefix,
                refetchType: "none"
            });
            queryClient.removeQueries({ queryKey: postQueryKeys.detail(response.postId) });
            queryClient.removeQueries({ queryKey: postQueryKeys.comments(response.postId) });
            options?.onSuccess?.(response);
        }
    });
}

export function useCreateCommentMutation(options?: { onSuccess?: (response: CreateCommentResponse) => void }) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, data }: { postId: RouteResourceId; data: CreateCommentRequest }) =>
            createComment(postId, data),
        onSuccess: (response, variables) => {
            void queryClient.invalidateQueries({ queryKey: postQueryKeys.comments(variables.postId) });
            options?.onSuccess?.(response);
        }
    });
}

export function useUpdateCommentMutation(options?: { onSuccess?: (response: UpdateCommentResponse) => void }) {
    const queryClient = useQueryClient();

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
        onSuccess: (response, variables) => {
            void queryClient.invalidateQueries({ queryKey: postQueryKeys.comments(variables.postId) });
            options?.onSuccess?.(response);
        }
    });
}

export function useDeleteCommentMutation(options?: { onSuccess?: (response: DeleteCommentResponse) => void }) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, commentId }: { postId: RouteResourceId; commentId: RouteResourceId }) =>
            deleteComment(postId, commentId),
        onSuccess: (response, variables) => {
            void queryClient.invalidateQueries({ queryKey: postQueryKeys.comments(variables.postId) });
            options?.onSuccess?.(response);
        }
    });
}
