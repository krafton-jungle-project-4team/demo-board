import { HttpStatus } from "@nestjs/common";
import type { DomainError } from "../../../common/core/domain";
import type { HttpDomainError } from "../../../common/infra/http";
import { isBoardErrorCode, type BoardErrorCode } from "../domain";

export function toBoardHttpError(error: DomainError): HttpDomainError | undefined {
    if (!isBoardErrorCode(error.code)) {
        return undefined;
    }

    return {
        statusCode: readBoardHttpStatus(error.code),
        code: error.code,
        message: error.message
    };
}

function readBoardHttpStatus(code: BoardErrorCode) {
    switch (code) {
        case "BOARD_POST_NOT_FOUND":
        case "BOARD_COMMENT_NOT_FOUND":
            return HttpStatus.NOT_FOUND;
        case "BOARD_UNKNOWN_TAGS":
            return HttpStatus.BAD_REQUEST;
        case "BOARD_NOT_RESOURCE_OWNER":
            return HttpStatus.FORBIDDEN;
    }
}
