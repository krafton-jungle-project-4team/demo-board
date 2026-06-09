import { HttpStatus } from "@nestjs/common";
import type { DomainError } from "../../../common/domain";
import type { HttpDomainError } from "../../../common/http";
import { isAuthErrorCode, type AuthErrorCode } from "../domain";

export function toAuthHttpError(error: DomainError): HttpDomainError | undefined {
    if (!isAuthErrorCode(error.code)) {
        return undefined;
    }

    return {
        statusCode: readAuthHttpStatus(error.code),
        code: error.code,
        message: error.message
    };
}

function readAuthHttpStatus(code: AuthErrorCode) {
    switch (code) {
        case "AUTH_OAUTH_CALLBACK_REQUIRED":
        case "AUTH_OAUTH_STATE_INVALID":
            return HttpStatus.BAD_REQUEST;
        case "AUTH_SESSION_REQUIRED":
        case "AUTH_OAUTH_ACCESS_TOKEN_UNAVAILABLE":
        case "AUTH_OAUTH_PROFILE_UNAVAILABLE":
        case "AUTH_OAUTH_EMAIL_UNAVAILABLE":
        case "AUTH_OAUTH_VERIFIED_EMAIL_UNAVAILABLE":
            return HttpStatus.UNAUTHORIZED;
        case "AUTH_USER_SUSPENDED":
        case "AUTH_SIGNUP_REQUIRED":
            return HttpStatus.FORBIDDEN;
        case "AUTH_OAUTH_RESPONSE_INVALID":
            return HttpStatus.BAD_GATEWAY;
    }
}
