import { z } from "zod";

export const ApiErrorPayloadSchema = z.object({
    code: z.string(),
    message: z.string()
});

export type ApiErrorPayload = z.infer<typeof ApiErrorPayloadSchema>;

export const ApiErrorResponseSchema = z.object({
    requestId: z.string(),
    error: ApiErrorPayloadSchema
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export function createApiSuccessResponseSchema<TData>(dataSchema: z.ZodType<TData>) {
    return z.object({
        requestId: z.string(),
        data: dataSchema
    });
}

export type ApiSuccessResponse<TData> = {
    requestId: string;
    data: TData;
};
