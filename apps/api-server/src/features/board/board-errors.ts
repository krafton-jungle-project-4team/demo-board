import { createDomainError, type DomainErrorDefinition } from "../../app-errors";

const boardErrorDefinitions = {
    postNotFound: {
        statusCode: 404,
        code: "BOARD_POST_NOT_FOUND",
        message: "게시글을 찾을 수 없습니다."
    },
    commentNotFound: {
        statusCode: 404,
        code: "BOARD_COMMENT_NOT_FOUND",
        message: "댓글을 찾을 수 없습니다."
    },
    unknownTags: {
        statusCode: 400,
        code: "BOARD_UNKNOWN_TAGS",
        message: "존재하지 않는 태그입니다."
    },
    notResourceOwner: {
        statusCode: 403,
        code: "BOARD_NOT_RESOURCE_OWNER",
        message: "작성자만 변경할 수 있습니다."
    }
} as const satisfies Record<string, DomainErrorDefinition>;

type BoardErrorKey = keyof typeof boardErrorDefinitions;

export const boardErrors = {
    postNotFound: () => createBoardError("postNotFound"),
    commentNotFound: () => createBoardError("commentNotFound"),
    unknownTags: () => createBoardError("unknownTags"),
    notResourceOwner: () => createBoardError("notResourceOwner")
};

function createBoardError(key: BoardErrorKey) {
    return createDomainError(boardErrorDefinitions[key]);
}
