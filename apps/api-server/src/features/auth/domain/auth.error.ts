import { createDomainError, type DomainErrorDefinition } from "../../../common/domain";

const authErrorDefinitions = {
    oauthCallbackRequired: {
        code: "AUTH_OAUTH_CALLBACK_REQUIRED",
        message: "GitHub OAuth callback code와 state가 필요합니다."
    },
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
    },
    oauthConfigMissing: {
        code: "AUTH_OAUTH_CONFIG_MISSING",
        message: "GitHub OAuth 환경 변수가 필요합니다."
    },
    oauthAccessTokenUnavailable: {
        code: "AUTH_OAUTH_ACCESS_TOKEN_UNAVAILABLE",
        message: "GitHub access token을 발급받지 못했습니다."
    },
    oauthProfileUnavailable: {
        code: "AUTH_OAUTH_PROFILE_UNAVAILABLE",
        message: "GitHub 사용자 정보를 확인하지 못했습니다."
    },
    oauthEmailUnavailable: {
        code: "AUTH_OAUTH_EMAIL_UNAVAILABLE",
        message: "GitHub 이메일 정보를 확인하지 못했습니다."
    },
    oauthVerifiedEmailUnavailable: {
        code: "AUTH_OAUTH_VERIFIED_EMAIL_UNAVAILABLE",
        message: "GitHub에서 검증된 이메일을 확인하지 못했습니다."
    },
    oauthStateInvalid: {
        code: "AUTH_OAUTH_STATE_INVALID",
        message: "GitHub OAuth state가 유효하지 않습니다."
    },
    oauthResponseInvalid: {
        code: "AUTH_OAUTH_RESPONSE_INVALID",
        message: "OAuth 응답 형식이 올바르지 않습니다."
    }
} as const satisfies Record<string, DomainErrorDefinition<string>>;

export type AuthErrorCode = (typeof authErrorDefinitions)[keyof typeof authErrorDefinitions]["code"];

export const authErrors = {
    oauthCallbackRequired: () => createDomainError(authErrorDefinitions.oauthCallbackRequired),
    sessionRequired: () => createDomainError(authErrorDefinitions.sessionRequired),
    userSuspended: () => createDomainError(authErrorDefinitions.userSuspended),
    signupRequired: () => createDomainError(authErrorDefinitions.signupRequired),
    oauthConfigMissing: () => createDomainError(authErrorDefinitions.oauthConfigMissing),
    oauthAccessTokenUnavailable: () => createDomainError(authErrorDefinitions.oauthAccessTokenUnavailable),
    oauthProfileUnavailable: () => createDomainError(authErrorDefinitions.oauthProfileUnavailable),
    oauthEmailUnavailable: () => createDomainError(authErrorDefinitions.oauthEmailUnavailable),
    oauthVerifiedEmailUnavailable: () => createDomainError(authErrorDefinitions.oauthVerifiedEmailUnavailable),
    oauthStateInvalid: () => createDomainError(authErrorDefinitions.oauthStateInvalid),
    oauthResponseInvalid: () => createDomainError(authErrorDefinitions.oauthResponseInvalid)
};

export function isAuthErrorCode(code: string): code is AuthErrorCode {
    return Object.values(authErrorDefinitions).some((definition) => definition.code === code);
}
