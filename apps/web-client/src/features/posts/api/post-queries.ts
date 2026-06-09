import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { CreatePostRequest, ListPostsQuery, Post, PostListResponse, UpdatePostRequest } from "@nmm/shared";
import {
    postsControllerCreatePost,
    postsControllerDeletePost,
    postsControllerFindPost,
    postsControllerFindPosts,
    postsControllerUpdatePost
} from "@/shared/api/generated/api-server";

type PostListParams = Partial<ListPostsQuery>;

export const postQueryKeys = {
    listPrefix: ["posts", "list"] as const,
    list: (params: PostListParams) => [...postQueryKeys.listPrefix, params] as const,
    detail: (id: string) => ["posts", "detail", id] as const
};

export function usePostListQuery(params: PostListParams) {
    return useQuery({
        queryKey: postQueryKeys.list(params),
        queryFn: async ({ signal }): Promise<PostListResponse> => {
            const response = await postsControllerFindPosts(params, { signal });

            return response.data;
        },
        placeholderData: (previousData) => previousData,
        throwOnError: true
    });
}

export function usePostDetailQuery(id: string) {
    return useSuspenseQuery({
        queryKey: postQueryKeys.detail(id),
        queryFn: ({ signal }) => postsControllerFindPost(id, { signal }).then((response) => response.data)
    });
}

export function useCreatePostMutation(options?: { onSuccess?: (post: Post) => void }) {
    return useMutation({
        mutationFn: (data: CreatePostRequest) => postsControllerCreatePost(data).then((response) => response.data),
        onSuccess: options?.onSuccess
    });
}

export function useUpdatePostMutation(options?: { onSuccess?: (post: Post) => void }) {
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdatePostRequest }) =>
            postsControllerUpdatePost(id, data).then((response) => response.data),
        onSuccess: options?.onSuccess
    });
}

export function useDeletePostMutation(options?: { onSuccess?: () => void }) {
    return useMutation({
        mutationFn: (id: string) => postsControllerDeletePost(id).then((response) => response.data),
        onSuccess: options?.onSuccess
    });
}
