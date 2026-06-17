import { HttpStatus } from "@nestjs/common";
import { createDomainError } from "../../app-errors";

export const ESTATE_ERRORS = {
    TRANSACTION_NOT_FOUND: {
        statusCode: HttpStatus.NOT_FOUND,
        code: "ESTATE_TRANSACTION_NOT_FOUND",
        message: "실거래 정보를 찾을 수 없습니다."
    },
    EMBEDDING_NOT_FOUND: {
        statusCode: HttpStatus.CONFLICT,
        code: "ESTATE_EMBEDDING_NOT_FOUND",
        message: "유사 매물 검색을 위해 실거래 임베딩 동기화가 필요합니다."
    },
    EMBEDDING_API_KEY_MISSING: {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: "ESTATE_EMBEDDING_API_KEY_MISSING",
        message: "임베딩 API 키가 설정되지 않았습니다."
    },
    EMBEDDING_PROVIDER_UNSUPPORTED: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: "ESTATE_EMBEDDING_PROVIDER_UNSUPPORTED",
        message: "지원하지 않는 임베딩 공급자입니다."
    },
    EMBEDDING_REQUEST_FAILED: {
        statusCode: HttpStatus.BAD_GATEWAY,
        code: "ESTATE_EMBEDDING_REQUEST_FAILED",
        message: "임베딩 생성 요청에 실패했습니다."
    },
    AGENT_API_KEY_MISSING: {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: "ESTATE_AGENT_API_KEY_MISSING",
        message: "AI 에이전트 API 키가 설정되지 않았습니다."
    },
    AGENT_REQUEST_FAILED: {
        statusCode: HttpStatus.BAD_GATEWAY,
        code: "ESTATE_AGENT_REQUEST_FAILED",
        message: "AI 에이전트 요청에 실패했습니다."
    },
    AGENT_STEP_LIMIT_EXCEEDED: {
        statusCode: HttpStatus.BAD_GATEWAY,
        code: "ESTATE_AGENT_STEP_LIMIT_EXCEEDED",
        message: "AI 에이전트 실행 단계가 제한을 초과했습니다."
    }
} as const;

export function createEstateError(error: (typeof ESTATE_ERRORS)[keyof typeof ESTATE_ERRORS]) {
    return createDomainError(error);
}
