import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { CreatePostRequest, Post, PostListResponse, UpdatePostRequest } from "@nmm/shared";
import { createPost, deletePost, findPost, findPosts, updatePost, type PostListParams } from "./post-api";

export const postQueryKeys = {
    listPrefix: ["posts", "list"] as const,
    list: (params: PostListParams) => [...postQueryKeys.listPrefix, params] as const,
    detail: (id: string) => ["posts", "detail", id] as const
};

export function usePostListQuery(params: PostListParams) {
    return useQuery({
        queryKey: postQueryKeys.list(params),
        queryFn: ({ signal }): Promise<PostListResponse> => findPosts(params, signal),
        placeholderData: (previousData) => previousData,
        throwOnError: true
    });
}

export function usePostDetailQuery(id: string) {
    return useSuspenseQuery({
        queryKey: postQueryKeys.detail(id),
        queryFn: ({ signal }) => findPost(id, signal)
    });
}

export function useCreatePostMutation(options?: { onSuccess?: (post: Post) => void }) {
    return useMutation({
        mutationFn: (data: CreatePostRequest) => createPost(data),
        onSuccess: options?.onSuccess
    });
}

export function useUpdatePostMutation(options?: { onSuccess?: (post: Post) => void }) {
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdatePostRequest }) => updatePost(id, data),
        onSuccess: options?.onSuccess
    });
}

export function useDeletePostMutation(options?: { onSuccess?: () => void }) {
    return useMutation({
        mutationFn: (id: string) => deletePost(id),
        onSuccess: options?.onSuccess
    });
}
