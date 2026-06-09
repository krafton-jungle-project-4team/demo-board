import {
    createDomainError,
    defineDomainErrors,
    isDomainErrorCode,
    type DomainErrorCode
} from "../../../common/core/domain";

const boardErrorDefinitions = defineDomainErrors({
    postNotFound: {
        code: "BOARD_POST_NOT_FOUND",
        message: "게시글을 찾을 수 없습니다."
    },
    commentNotFound: {
        code: "BOARD_COMMENT_NOT_FOUND",
        message: "댓글을 찾을 수 없습니다."
    },
    unknownTags: {
        code: "BOARD_UNKNOWN_TAGS",
        message: "존재하지 않는 태그입니다."
    },
    notResourceOwner: {
        code: "BOARD_NOT_RESOURCE_OWNER",
        message: "작성자만 변경할 수 있습니다."
    }
});

export type BoardErrorCode = DomainErrorCode<typeof boardErrorDefinitions>;

export const boardErrors = {
    postNotFound: () => createDomainError(boardErrorDefinitions.postNotFound),
    commentNotFound: () => createDomainError(boardErrorDefinitions.commentNotFound),
    unknownTags: () => createDomainError(boardErrorDefinitions.unknownTags),
    notResourceOwner: () => createDomainError(boardErrorDefinitions.notResourceOwner)
};

export function isBoardErrorCode(code: string): code is BoardErrorCode {
    return isDomainErrorCode(boardErrorDefinitions, code);
}
