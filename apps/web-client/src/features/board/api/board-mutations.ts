import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { BoardCommentWriteRequest, BoardPostCreateRequest, BoardPostUpdateRequest } from "@nmm/shared";
import {
    createBoardComment,
    createBoardCommentReply,
    createBoardPost,
    deleteBoardComment,
    deleteBoardPost,
    updateBoardComment,
    updateBoardPost
} from "./board-api";
import { boardQueryKeys } from "./board-queries";

type UpdateBoardPostVariables = {
    postId: number;
    request: BoardPostUpdateRequest;
};

type BoardCommentVariables = {
    commentId: number;
    request: BoardCommentWriteRequest;
};

export function useCreateBoardPostMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: BoardPostCreateRequest) => createBoardPost(request),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: boardQueryKeys.all });
        }
    });
}

export function useUpdateBoardPostMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, request }: UpdateBoardPostVariables) => updateBoardPost(postId, request),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: boardQueryKeys.all });
        }
    });
}

export function useDeleteBoardPostMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBoardPost,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: boardQueryKeys.all });
        }
    });
}

export function useCreateBoardCommentMutation(postId: number) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: BoardCommentWriteRequest) => createBoardComment(postId, request),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: boardQueryKeys.all });
        }
    });
}

export function useCreateBoardCommentReplyMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ commentId, request }: BoardCommentVariables) => createBoardCommentReply(commentId, request),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: boardQueryKeys.all });
        }
    });
}

export function useUpdateBoardCommentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ commentId, request }: BoardCommentVariables) => updateBoardComment(commentId, request),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: boardQueryKeys.all });
        }
    });
}

export function useDeleteBoardCommentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteBoardComment,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: boardQueryKeys.all });
        }
    });
}
