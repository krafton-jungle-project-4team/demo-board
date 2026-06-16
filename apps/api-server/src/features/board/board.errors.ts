import { HttpStatus } from "@nestjs/common";
import { createDomainError } from "../../app-errors";

export const BOARD_ERRORS = {
    POST_NOT_FOUND: {
        statusCode: HttpStatus.NOT_FOUND,
        code: "BOARD_POST_NOT_FOUND",
        message: "게시글을 찾을 수 없습니다."
    },
    COMMENT_NOT_FOUND: {
        statusCode: HttpStatus.NOT_FOUND,
        code: "BOARD_COMMENT_NOT_FOUND",
        message: "댓글을 찾을 수 없습니다."
    },
    FORBIDDEN: {
        statusCode: HttpStatus.FORBIDDEN,
        code: "BOARD_FORBIDDEN",
        message: "이 작업을 수행할 권한이 없습니다."
    },
    REPLY_DEPTH_EXCEEDED: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: "BOARD_COMMENT_REPLY_DEPTH_EXCEEDED",
        message: "대댓글에는 답글을 작성할 수 없습니다."
    },
    DELETED_COMMENT_UPDATE: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: "BOARD_COMMENT_DELETED_UPDATE",
        message: "삭제된 댓글은 수정할 수 없습니다."
    },
    DONG_RESIDENCE_REQUIRED: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: "BOARD_DONG_RESIDENCE_REQUIRED",
        message: "내 동네 글을 작성하려면 거주동을 설정해주세요."
    }
} as const;

export function createBoardError(error: (typeof BOARD_ERRORS)[keyof typeof BOARD_ERRORS]) {
    return createDomainError(error);
}
