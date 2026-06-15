import {
    BoardCommentListResponseSchema,
    BoardCommandResponseSchema,
    BoardPostDetailResponseSchema,
    BoardPostListResponseSchema,
    BoardTagListResponseSchema,
    type BoardCommentListQuery,
    type BoardCommentListResponse,
    type BoardCommentWriteRequest,
    type BoardCommandResponse,
    type BoardPostCreateRequest,
    type BoardPostDetailResponse,
    type BoardPostListQuery,
    type BoardPostListResponse,
    type BoardPostUpdateRequest,
    type BoardTagResponse
} from "@nmm/shared";
import { requestApiData } from "@/shared/api/http-client";

export function getBoardPostList(query: BoardPostListQuery): Promise<BoardPostListResponse> {
    return requestApiData(`board/posts?${createBoardPostListSearchParams(query)}`, BoardPostListResponseSchema);
}

export function getBoardPost(postId: number): Promise<BoardPostDetailResponse> {
    return requestApiData(`board/posts/${postId}`, BoardPostDetailResponseSchema);
}

export function getBoardTags(): Promise<BoardTagResponse[]> {
    return requestApiData("board/tags", BoardTagListResponseSchema);
}

export function createBoardPost(request: BoardPostCreateRequest): Promise<BoardCommandResponse> {
    return requestApiData("board/posts", BoardCommandResponseSchema, {
        method: "POST",
        json: request
    });
}

export function updateBoardPost(postId: number, request: BoardPostUpdateRequest): Promise<BoardCommandResponse> {
    return requestApiData(`board/posts/${postId}`, BoardCommandResponseSchema, {
        method: "PATCH",
        json: request
    });
}

export function deleteBoardPost(postId: number): Promise<BoardCommandResponse> {
    return requestApiData(`board/posts/${postId}`, BoardCommandResponseSchema, {
        method: "DELETE"
    });
}

export function getBoardComments(postId: number, query: BoardCommentListQuery): Promise<BoardCommentListResponse> {
    const searchParams = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize)
    });

    return requestApiData(`board/posts/${postId}/comments?${searchParams.toString()}`, BoardCommentListResponseSchema);
}

export function createBoardComment(postId: number, request: BoardCommentWriteRequest): Promise<BoardCommandResponse> {
    return requestApiData(`board/posts/${postId}/comments`, BoardCommandResponseSchema, {
        method: "POST",
        json: request
    });
}

export function createBoardCommentReply(
    commentId: number,
    request: BoardCommentWriteRequest
): Promise<BoardCommandResponse> {
    return requestApiData(`board/comments/${commentId}/replies`, BoardCommandResponseSchema, {
        method: "POST",
        json: request
    });
}

export function updateBoardComment(
    commentId: number,
    request: BoardCommentWriteRequest
): Promise<BoardCommandResponse> {
    return requestApiData(`board/comments/${commentId}`, BoardCommandResponseSchema, {
        method: "PATCH",
        json: request
    });
}

export function deleteBoardComment(commentId: number): Promise<BoardCommandResponse> {
    return requestApiData(`board/comments/${commentId}`, BoardCommandResponseSchema, {
        method: "DELETE"
    });
}

function createBoardPostListSearchParams(query: BoardPostListQuery) {
    const searchParams = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
        searchScope: query.searchScope
    });

    if (query.q) {
        searchParams.set("q", query.q);
    }

    if (query.dongCode) {
        searchParams.set("dongCode", query.dongCode);
    }

    return searchParams.toString();
}
