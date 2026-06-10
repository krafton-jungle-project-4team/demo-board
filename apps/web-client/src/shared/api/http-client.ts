import { ApiErrorResponseSchema, createApiSuccessResponseSchema } from "@nmm/shared";
import type { ApiErrorPayload } from "@nmm/shared";
import ky, { HTTPError, type Options } from "ky";
import type { z } from "zod";

type ApiRequestOptions = Omit<Options, "prefix">;

const apiClient = ky.create({
    prefix: "/api",
    credentials: "include",
    retry: 3,
    timeout: 1000
});

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
    try {
        const body = await apiClient(path, options).json<unknown>();

        return createApiSuccessResponseSchema(dataSchema).parse(body).data;
    } catch (error) {
        if (error instanceof HTTPError) {
            const errorResponse = ApiErrorResponseSchema.safeParse(error.data);

            throw new ApiClientError(
                error.response.status,
                errorResponse.data?.requestId,
                errorResponse.data?.error ?? {
                    code: "HTTP_ERROR",
                    message: "API 요청에 실패했습니다."
                }
            );
        }

        throw error;
    }
}
