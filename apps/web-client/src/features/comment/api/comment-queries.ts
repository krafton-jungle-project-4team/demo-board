import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateCommentRequest, UpdateCommentRequest } from "@nmm/shared";
import { createComment, createReply, deleteComment, getComments, updateComment } from "./comment-api";

export type CommentQueryParams = {
    postId: number;
    page: number;
    pageSize: number;
};

export function commentQueryKey(params: CommentQueryParams) {
    return ["comments", params] as const;
}

export function commentQueryOptions(params: CommentQueryParams) {
    return queryOptions({
        queryKey: commentQueryKey(params),
        queryFn: () =>
            getComments({
                postId: params.postId,
                query: {
                    page: params.page,
                    pageSize: params.pageSize
                }
            })
    });
}

export function useCreateCommentMutation(postId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: CreateCommentRequest) => createComment(postId, request),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments"] })
    });
}

export function useCreateReplyMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ commentId, request }: { commentId: number; request: CreateCommentRequest }) =>
            createReply(commentId, request),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments"] })
    });
}

export function useUpdateCommentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ commentId, request }: { commentId: number; request: UpdateCommentRequest }) =>
            updateComment(commentId, request),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments"] })
    });
}

export function useDeleteCommentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteComment,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments"] })
    });
}
