import { CompleteSignUpRequestSchema, UpdateCurrentUserRequestSchema, UserSchema } from "@nmm/shared";
import { z } from "zod";
import { apiSuccessSchema, zodToOpenApiSchema } from "../../../common/http";

const LogoutResponseSchema = z.object({
    ok: z.boolean()
});

export const completeSignUpRequestOpenApiSchema = zodToOpenApiSchema(CompleteSignUpRequestSchema, { io: "input" });
export const updateCurrentUserRequestOpenApiSchema = zodToOpenApiSchema(UpdateCurrentUserRequestSchema, {
    io: "input"
});
export const userApiResponseOpenApiSchema = apiSuccessSchema(zodToOpenApiSchema(UserSchema));
export const logoutApiResponseOpenApiSchema = apiSuccessSchema(zodToOpenApiSchema(LogoutResponseSchema));
