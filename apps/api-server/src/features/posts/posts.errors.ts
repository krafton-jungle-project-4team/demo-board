import { HttpStatus } from "@nestjs/common";
import { createDomainError, type DomainErrorDefinition } from "../../app-errors";

const POST_NOT_FOUND_ERROR = {
    statusCode: HttpStatus.NOT_FOUND,
    code: "POST_NOT_FOUND",
    message: "게시글을 찾을 수 없습니다."
} satisfies DomainErrorDefinition;

export function createPostNotFoundError() {
    return createDomainError(POST_NOT_FOUND_ERROR);
}
