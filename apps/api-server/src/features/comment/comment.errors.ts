import { HttpStatus } from "@nestjs/common";
import { createDomainError } from "../../app-errors";

export const COMMENT_ERROR = {
    NOT_FOUND: {
        code: "COMMENT_NOT_FOUND",
        message: "댓글을 찾을 수 없습니다.",
        statusCode: HttpStatus.NOT_FOUND
    },
    REPLY_DEPTH_EXCEEDED: {
        code: "COMMENT_REPLY_DEPTH_EXCEEDED",
        message: "대댓글에는 답글을 작성할 수 없습니다.",
        statusCode: HttpStatus.BAD_REQUEST
    },
    DELETED_COMMENT_UPDATE: {
        code: "COMMENT_DELETED_UPDATE",
        message: "삭제된 댓글은 수정할 수 없습니다.",
        statusCode: HttpStatus.BAD_REQUEST
    }
} as const;

export function createCommentError(error: (typeof COMMENT_ERROR)[keyof typeof COMMENT_ERROR]) {
    return createDomainError(error);
}
