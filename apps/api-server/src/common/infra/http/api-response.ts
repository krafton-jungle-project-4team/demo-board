import { randomUUID } from "node:crypto";

export type ApiSuccessResponse<TData> = {
    requestId: string;
    data: TData;
};

export type ApiErrorResponse = {
    requestId: string;
    error: {
        code: string;
        message: string;
    };
};

type HttpHeaderValue = string | string[] | undefined;

export type ApiRequest = {
    requestId?: string;
    headers?: Record<string, HttpHeaderValue>;
};

export type ApiResponse = {
    setHeader(name: string, value: string): void;
};

export function getRequestId(request: ApiRequest, response?: ApiResponse) {
    const existingRequestId = request.requestId;

    if (existingRequestId) {
        response?.setHeader("x-request-id", existingRequestId);

        return existingRequestId;
    }

    const headerRequestId = request.headers?.["x-request-id"];
    const requestId = readHeaderValue(headerRequestId) ?? randomUUID();

    request.requestId = requestId;
    response?.setHeader("x-request-id", requestId);

    return requestId;
}

function readHeaderValue(value: HttpHeaderValue) {
    const firstValue = Array.isArray(value) ? value[0] : value;
    const trimmedValue = firstValue?.trim();

    return trimmedValue && trimmedValue.length > 0 ? trimmedValue : undefined;
}
