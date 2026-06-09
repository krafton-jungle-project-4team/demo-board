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
        case "AUTH_SESSION_REQUIRED":
            return HttpStatus.UNAUTHORIZED;
        case "AUTH_USER_SUSPENDED":
        case "AUTH_SIGNUP_REQUIRED":
            return HttpStatus.FORBIDDEN;
    }
}
