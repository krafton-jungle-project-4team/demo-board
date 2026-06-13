import {
    CommentCommandResponseSchema,
    CommentListResponseSchema,
    type CommentCommandResponse,
    type CommentListQuery,
    type CommentListResponse,
    type CreateCommentRequest,
    type UpdateCommentRequest
} from "@nmm/shared";
import { requestApiData } from "@/shared/api/http-client";

export type GetCommentsParams = {
    postId: number;
    query: CommentListQuery;
};

export function getComments({ postId, query }: GetCommentsParams): Promise<CommentListResponse> {
    const searchParams = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize)
    });

    return requestApiData(`posts/${postId}/comments?${searchParams.toString()}`, CommentListResponseSchema);
}

export function createComment(postId: number, request: CreateCommentRequest): Promise<CommentCommandResponse> {
    return requestApiData(`posts/${postId}/comments`, CommentCommandResponseSchema, {
        method: "post",
        json: request
    });
}

export function createReply(commentId: number, request: CreateCommentRequest): Promise<CommentCommandResponse> {
    return requestApiData(`comments/${commentId}/replies`, CommentCommandResponseSchema, {
        method: "post",
        json: request
    });
}

export function updateComment(commentId: number, request: UpdateCommentRequest): Promise<CommentCommandResponse> {
    return requestApiData(`comments/${commentId}`, CommentCommandResponseSchema, {
        method: "patch",
        json: request
    });
}

export function deleteComment(commentId: number): Promise<CommentCommandResponse> {
    return requestApiData(`comments/${commentId}`, CommentCommandResponseSchema, {
        method: "delete"
    });
}
