import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type {
    CreatePostRequest,
    CreatePostResponse,
    PostListResponse,
    UpdatePostRequest,
    UpdatePostResponse
} from "@nmm/shared";
import {
    createPost,
    deletePost,
    findPost,
    findPosts,
    updatePost,
    type PostListParams,
    type RouteResourceId
} from "./post-api";

export const postQueryKeys = {
    listPrefix: ["posts", "list"] as const,
    list: (params: PostListParams) => [...postQueryKeys.listPrefix, params] as const,
    detail: (id: RouteResourceId) => ["posts", "detail", String(id)] as const
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

export function useDeletePostMutation(options?: { onSuccess?: () => void }) {
    return useMutation({
        mutationFn: (id: RouteResourceId) => deletePost(id),
        onSuccess: options?.onSuccess
    });
}
