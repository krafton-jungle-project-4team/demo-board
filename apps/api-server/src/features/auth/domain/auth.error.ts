import {
    createDomainError,
    defineDomainErrors,
    isDomainErrorCode,
    type DomainErrorCode
} from "../../../common/core/domain";

const authErrorDefinitions = defineDomainErrors({
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
});

export type AuthErrorCode = DomainErrorCode<typeof authErrorDefinitions>;

export const authErrors = {
    sessionRequired: () => createDomainError(authErrorDefinitions.sessionRequired),
    userSuspended: () => createDomainError(authErrorDefinitions.userSuspended),
    signupRequired: () => createDomainError(authErrorDefinitions.signupRequired)
};

export function isAuthErrorCode(code: string): code is AuthErrorCode {
    return isDomainErrorCode(authErrorDefinitions, code);
}
