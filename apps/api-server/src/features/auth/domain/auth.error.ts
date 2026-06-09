import { createDomainError, type DomainErrorDefinition } from "../../../common/domain";

const authErrorDefinitions = {
    sessionRequired: {
        code: "AUTH_SESSION_REQUIRED",
        message: "로그인이 필요합니다."
    },
    userSuspended: {
        code: "AUTH_USER_SUSPENDED",
        message: "정지된 사용자입니다."
    },
    signupRequired: {
        code: "AUTH_SIGNUP_REQUIRED",
        message: "가입 완료가 필요합니다."
    }
} as const satisfies Record<string, DomainErrorDefinition<string>>;

export type AuthErrorCode = (typeof authErrorDefinitions)[keyof typeof authErrorDefinitions]["code"];

export const authErrors = {
    sessionRequired: () => createDomainError(authErrorDefinitions.sessionRequired),
    userSuspended: () => createDomainError(authErrorDefinitions.userSuspended),
    signupRequired: () => createDomainError(authErrorDefinitions.signupRequired)
};

export function isAuthErrorCode(code: string): code is AuthErrorCode {
    return Object.values(authErrorDefinitions).some((definition) => definition.code === code);
}
