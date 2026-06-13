import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DeletePostParams, UpdatePostParams, UpdatePostRequest } from "@nmm/shared";
import { createPost, deletePost, updatePost } from "./posts-api";
import { postsQueryKeys } from "./posts-queries";

type UpdatePostMutationVariables = {
    params: UpdatePostParams;
    request: UpdatePostRequest;
};

export function useCreatePostMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createPost,
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: postsQueryKeys.all
            });
        }
    });
}

export function useUpdatePostMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ params, request }: UpdatePostMutationVariables) => updatePost(params, request),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: postsQueryKeys.all
            });
        }
    });
}

export function useDeletePostMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: DeletePostParams) => deletePost(params),
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: postsQueryKeys.all
            });
        }
    });
}
