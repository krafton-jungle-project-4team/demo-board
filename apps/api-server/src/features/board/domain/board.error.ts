import { createDomainError, type DomainErrorDefinition } from "../../../common/domain";

const boardErrorDefinitions = {
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
} as const satisfies Record<string, DomainErrorDefinition<string>>;

export type BoardErrorCode = (typeof boardErrorDefinitions)[keyof typeof boardErrorDefinitions]["code"];

export const boardErrors = {
    postNotFound: () => createDomainError(boardErrorDefinitions.postNotFound),
    commentNotFound: () => createDomainError(boardErrorDefinitions.commentNotFound),
    unknownTags: () => createDomainError(boardErrorDefinitions.unknownTags),
    notResourceOwner: () => createDomainError(boardErrorDefinitions.notResourceOwner)
};

export function isBoardErrorCode(code: string): code is BoardErrorCode {
    return Object.values(boardErrorDefinitions).some((definition) => definition.code === code);
}
