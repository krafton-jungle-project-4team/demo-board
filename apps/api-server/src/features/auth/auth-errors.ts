import { createDomainError, type DomainErrorDefinition } from "../../app-errors";

const authErrorDefinitions = {
    sessionRequired: {
        statusCode: 401,
        code: "AUTH_SESSION_REQUIRED",
        message: "로그인이 필요합니다."
    },
    userSuspended: {
        statusCode: 403,
        code: "AUTH_USER_SUSPENDED",
        message: "정지된 사용자입니다."
    },
    signupRequired: {
        statusCode: 403,
        code: "AUTH_SIGNUP_REQUIRED",
        message: "가입 완료가 필요합니다."
    }
} as const satisfies Record<string, DomainErrorDefinition>;

type AuthErrorKey = keyof typeof authErrorDefinitions;

export const authErrors = {
    sessionRequired: () => createAuthError("sessionRequired"),
    userSuspended: () => createAuthError("userSuspended"),
    signupRequired: () => createAuthError("signupRequired")
};

function createAuthError(key: AuthErrorKey) {
    return createDomainError(authErrorDefinitions[key]);
}
