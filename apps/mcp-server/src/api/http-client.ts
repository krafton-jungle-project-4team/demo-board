import {
    ApiErrorResponseSchema,
    createApiSuccessResponseSchema,
    type ApiErrorPayload,
    type ApiSuccessResponse
} from "@nmm/shared";
import { z } from "zod";
import { mcpServerEnv } from "../env.js";

type ApiRequestMethod = "GET" | "POST";

type ApiRequestOptions = {
    method?: ApiRequestMethod;
    searchParams?: URLSearchParams;
    body?: unknown;
};

export class ApiClientError extends Error {
    constructor(
        readonly status: number | undefined,
        readonly requestId: string | undefined,
        readonly error: ApiErrorPayload
    ) {
        super(error.message);
        this.name = "ApiClientError";
    }
}

export async function requestApiData<TData>(
    path: string,
    dataSchema: z.ZodType<TData>,
    options: ApiRequestOptions = {}
): Promise<TData> {
    const responseBody = await requestApi(path, options);

    return createApiSuccessResponseSchema(dataSchema).parse(responseBody).data;
}

async function requestApi(path: string, options: ApiRequestOptions): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), mcpServerEnv.requestTimeoutMs);

    try {
        const response = await fetch(createApiUrl(path, options.searchParams), {
            method: options.method ?? "GET",
            headers: createHeaders(options),
            body: options.body === undefined ? undefined : JSON.stringify(options.body),
            signal: controller.signal
        });
        const responseBody = await readJsonBody(response);

        if (!response.ok) {
            throw createApiError(response.status, responseBody);
        }

        assertApiSuccessResponse(responseBody);

        return responseBody;
    } catch (error) {
        throw toApiClientError(error);
    } finally {
        clearTimeout(timeout);
    }
}

function createApiUrl(path: string, searchParams: URLSearchParams | undefined) {
    const normalizedPath = path.replace(/^\//, "");
    const url = new URL(`${mcpServerEnv.apiBaseUrl}/${normalizedPath}`);

    if (searchParams) {
        searchParams.forEach((value, key) => {
            url.searchParams.set(key, value);
        });
    }

    return url;
}

function createHeaders(options: ApiRequestOptions) {
    return {
        Accept: "application/json",
        Authorization: `Bearer ${mcpServerEnv.bearerToken}`,
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" })
    };
}

async function readJsonBody(response: Response) {
    const text = await response.text();

    if (!text) {
        return undefined;
    }

    return JSON.parse(text) as unknown;
}

function createApiError(status: number, responseBody: unknown) {
    const errorResponse = ApiErrorResponseSchema.safeParse(responseBody);

    return new ApiClientError(
        status,
        errorResponse.data?.requestId,
        errorResponse.data?.error ?? {
            code: "HTTP_ERROR",
            message: "API 요청에 실패했습니다."
        }
    );
}

function assertApiSuccessResponse<TData>(responseBody: unknown): asserts responseBody is ApiSuccessResponse<TData> {
    if (!responseBody || typeof responseBody !== "object" || !("data" in responseBody)) {
        throw new ApiClientError(undefined, undefined, {
            code: "MCP_API_RESPONSE_INVALID",
            message: "API 응답 형식이 올바르지 않습니다."
        });
    }
}

function toApiClientError(error: unknown) {
    if (error instanceof ApiClientError) {
        return error;
    }

    if (error instanceof z.ZodError) {
        return new ApiClientError(undefined, undefined, {
            code: "MCP_API_RESPONSE_INVALID",
            message: "API 응답 데이터가 계약과 일치하지 않습니다."
        });
    }

    if (error instanceof Error && error.name === "AbortError") {
        return new ApiClientError(undefined, undefined, {
            code: "MCP_API_REQUEST_TIMEOUT",
            message: "API 서버 요청 시간이 초과되었습니다."
        });
    }

    return new ApiClientError(undefined, undefined, {
        code: "MCP_API_REQUEST_FAILED",
        message: "API 서버에 연결할 수 없습니다."
    });
}
