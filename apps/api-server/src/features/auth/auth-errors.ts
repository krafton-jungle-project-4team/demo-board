import { HttpStatus } from "@nestjs/common";

export const AUTH_ERRORS = {
    UNAUTHORIZED: {
        statusCode: HttpStatus.UNAUTHORIZED,
        code: "AUTH_UNAUTHORIZED",
        message: "로그인이 필요합니다."
    }
} as const;
