import { HttpStatus } from "@nestjs/common";
import { createDomainError } from "../../app-errors";

export function createPostTagNotFoundError() {
    return createDomainError({
        statusCode: HttpStatus.NOT_FOUND,
        code: "POST_TAG_NOT_FOUND",
        message: "게시글 태그를 찾을 수 없습니다."
    });
}
