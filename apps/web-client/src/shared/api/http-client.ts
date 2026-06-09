import { ApiErrorResponseSchema, createApiSuccessResponseSchema } from "@nmm/shared";
import type { ApiErrorPayload } from "@nmm/shared";
import type { z } from "zod";

type ApiRequestOptions = Omit<RequestInit, "body"> & {
    body?: unknown;
};

export class ApiClientError extends Error {
    constructor(
        readonly status: number,
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
    const response = await fetch(path, toRequestInit(options));
    const body = await readJson(response);

    if (!response.ok) {
        const errorResponse = ApiErrorResponseSchema.safeParse(body);

        throw new ApiClientError(
            response.status,
            errorResponse.data?.requestId,
            errorResponse.data?.error ?? {
                code: "HTTP_ERROR",
                message: "API 요청에 실패했습니다."
            }
        );
    }

    return createApiSuccessResponseSchema(dataSchema).parse(body).data;
}

export function toQueryString(params: Record<string, number | string | undefined>) {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
            searchParams.set(key, String(value));
        }
    }

    const queryString = searchParams.toString();

    return queryString ? `?${queryString}` : "";
}

function toRequestInit(options: ApiRequestOptions): RequestInit {
    const headers = new Headers(options.headers);
    const body = options.body === undefined ? undefined : JSON.stringify(options.body);

    if (body !== undefined && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    return {
        ...options,
        credentials: options.credentials ?? "include",
        headers,
        body
    };
}

async function readJson(response: Response): Promise<unknown> {
    const text = await response.text();

    if (!text) {
        return undefined;
    }

    return JSON.parse(text) as unknown;
}
