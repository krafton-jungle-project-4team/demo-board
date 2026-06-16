import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ApiClientError } from "../api/http-client.js";

type ToolStructuredContent = Record<string, unknown>;

export function createToolSuccessResult(text: string, structuredContent: ToolStructuredContent): CallToolResult {
    return {
        content: [{ type: "text", text }],
        structuredContent
    };
}

export function createToolErrorResult(error: unknown): CallToolResult {
    const apiError = toReadableApiError(error);

    return {
        isError: true,
        content: [{ type: "text", text: apiError.text }],
        structuredContent: {
            error: {
                status: apiError.status,
                requestId: apiError.requestId,
                code: apiError.code,
                message: apiError.message,
                guidance: apiError.guidance
            }
        }
    };
}

function toReadableApiError(error: unknown) {
    if (error instanceof ApiClientError) {
        const guidance = createActionableGuidance(error.error.code);
        const text = guidance ? `${error.error.message} ${guidance}` : error.error.message;

        return {
            status: error.status,
            requestId: error.requestId,
            code: error.error.code,
            message: error.error.message,
            guidance,
            text
        };
    }

    return {
        status: undefined,
        requestId: undefined,
        code: "MCP_TOOL_ERROR",
        message: "MCP 도구 실행 중 오류가 발생했습니다.",
        guidance: "입력값을 확인한 뒤 다시 호출해주세요.",
        text: "MCP 도구 실행 중 오류가 발생했습니다. 입력값을 확인한 뒤 다시 호출해주세요."
    };
}

function createActionableGuidance(code: string) {
    if (code === "ESTATE_EMBEDDING_NOT_FOUND") {
        return "`npm run estate:embeddings:sync`로 실거래 임베딩을 먼저 동기화해주세요.";
    }

    if (code === "ESTATE_EMBEDDING_API_KEY_MISSING") {
        return "`OPENAI_API_KEY`를 설정한 뒤 queryText 기반 유사 매물 검색을 다시 시도해주세요.";
    }

    if (code === "MCP_API_REQUEST_TIMEOUT") {
        return "필터를 더 좁히거나 API 서버 상태를 확인해주세요.";
    }

    if (code === "MCP_API_REQUEST_FAILED") {
        return "API 서버가 실행 중인지 확인해주세요.";
    }

    return undefined;
}
