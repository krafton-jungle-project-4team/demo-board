import { HttpStatus } from "@nestjs/common";
import { createDomainError } from "../../app-errors";

export const ESTATE_ERRORS = {
    TRANSACTION_NOT_FOUND: {
        statusCode: HttpStatus.NOT_FOUND,
        code: "ESTATE_TRANSACTION_NOT_FOUND",
        message: "실거래 정보를 찾을 수 없습니다."
    },
    PROPERTY_NOT_FOUND: {
        statusCode: HttpStatus.NOT_FOUND,
        code: "ESTATE_PROPERTY_NOT_FOUND",
        message: "매물 위치 정보를 찾을 수 없습니다."
    },
    PROPERTY_COORDINATES_MISSING: {
        statusCode: HttpStatus.CONFLICT,
        code: "ESTATE_PROPERTY_COORDINATES_MISSING",
        message: "매물의 위도/경도 정보가 없습니다."
    },
    TMAP_APP_KEY_MISSING: {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: "ESTATE_TMAP_APP_KEY_MISSING",
        message: "TMAP API 키가 설정되지 않았습니다."
    },
    TMAP_UNAUTHORIZED: {
        statusCode: HttpStatus.BAD_GATEWAY,
        code: "ESTATE_TMAP_UNAUTHORIZED",
        message: "TMAP API 인증에 실패했습니다."
    },
    TMAP_RATE_LIMITED: {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        code: "ESTATE_TMAP_RATE_LIMITED",
        message: "TMAP API 호출 한도를 초과했습니다."
    },
    TMAP_TIMEOUT: {
        statusCode: HttpStatus.GATEWAY_TIMEOUT,
        code: "ESTATE_TMAP_TIMEOUT",
        message: "TMAP API 응답 시간이 초과되었습니다."
    },
    TMAP_BAD_RESPONSE: {
        statusCode: HttpStatus.BAD_GATEWAY,
        code: "ESTATE_TMAP_BAD_RESPONSE",
        message: "TMAP API 응답을 처리할 수 없습니다."
    },
    NO_TRANSPORT_FOUND: {
        statusCode: HttpStatus.NOT_FOUND,
        code: "ESTATE_NO_TRANSPORT_FOUND",
        message: "반경 안의 지하철역 또는 버스정류장을 찾을 수 없습니다."
    },
    NO_WALK_ROUTE_FOUND: {
        statusCode: HttpStatus.NOT_FOUND,
        code: "ESTATE_NO_WALK_ROUTE_FOUND",
        message: "도보 경로를 찾을 수 없습니다."
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
    }
} as const;

export function createEstateError(error: (typeof ESTATE_ERRORS)[keyof typeof ESTATE_ERRORS]) {
    return createDomainError(error);
}
