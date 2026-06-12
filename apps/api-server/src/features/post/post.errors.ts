import { HttpStatus } from "@nestjs/common";
import { createDomainError } from "../../app-errors";

export function createTagNotFoundError() {
    return createDomainError({
        statusCode: HttpStatus.NOT_FOUND,
        code: "TAG_NOT_FOUND",
        message: "태그를 찾을 수 없습니다."
    });
}
