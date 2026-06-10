import { HttpException, HttpStatus } from "@nestjs/common";

type AppErrorDefinition = {
    statusCode: number;
    code: string;
    message: string;
};

const appErrorDefinitions = {
    authSessionRequired: {
        statusCode: HttpStatus.UNAUTHORIZED,
        code: "AUTH_SESSION_REQUIRED",
        message: "로그인이 필요합니다."
    },
    authUserSuspended: {
        statusCode: HttpStatus.FORBIDDEN,
        code: "AUTH_USER_SUSPENDED",
        message: "정지된 사용자입니다."
    },
    authSignupRequired: {
        statusCode: HttpStatus.FORBIDDEN,
        code: "AUTH_SIGNUP_REQUIRED",
        message: "가입 완료가 필요합니다."
    },
    boardPostNotFound: {
        statusCode: HttpStatus.NOT_FOUND,
        code: "BOARD_POST_NOT_FOUND",
        message: "게시글을 찾을 수 없습니다."
    },
    boardCommentNotFound: {
        statusCode: HttpStatus.NOT_FOUND,
        code: "BOARD_COMMENT_NOT_FOUND",
        message: "댓글을 찾을 수 없습니다."
    },
    boardUnknownTags: {
        statusCode: HttpStatus.BAD_REQUEST,
        code: "BOARD_UNKNOWN_TAGS",
        message: "존재하지 않는 태그입니다."
    },
    boardNotResourceOwner: {
        statusCode: HttpStatus.FORBIDDEN,
        code: "BOARD_NOT_RESOURCE_OWNER",
        message: "작성자만 변경할 수 있습니다."
    }
} as const satisfies Record<string, AppErrorDefinition>;

type AppErrorKey = keyof typeof appErrorDefinitions;

export type AppErrorBody = {
    code: (typeof appErrorDefinitions)[AppErrorKey]["code"];
    message: string;
};

export const appErrors = {
    authSessionRequired: () => createAppException("authSessionRequired"),
    authUserSuspended: () => createAppException("authUserSuspended"),
    authSignupRequired: () => createAppException("authSignupRequired"),
    boardPostNotFound: () => createAppException("boardPostNotFound"),
    boardCommentNotFound: () => createAppException("boardCommentNotFound"),
    boardUnknownTags: () => createAppException("boardUnknownTags"),
    boardNotResourceOwner: () => createAppException("boardNotResourceOwner")
};

function createAppException(key: AppErrorKey) {
    const error = appErrorDefinitions[key];

    return new HttpException(
        {
            code: error.code,
            message: error.message
        },
        error.statusCode
    );
}
