import {
    CompleteSignUpRequestSchema,
    CompleteSignUpResponseSchema,
    UpdateCurrentUserRequestSchema,
    UpdateCurrentUserResponseSchema,
    UserSchema,
    type CompleteSignUpRequest,
    type UpdateCurrentUserRequest
} from "@nmm/shared";
import { requestApiData } from "@/shared/api/http-client";
import { authClient } from "./auth-client";

export function getCurrentUser(signal?: AbortSignal) {
    return requestApiData("account/me", UserSchema, { signal });
}

export function completeSignUp(request: CompleteSignUpRequest) {
    return requestApiData("account/signup/complete", CompleteSignUpResponseSchema, {
        method: "POST",
        json: CompleteSignUpRequestSchema.parse(request)
    });
}

export function updateCurrentUser(request: UpdateCurrentUserRequest) {
    return requestApiData("account/me", UpdateCurrentUserResponseSchema, {
        method: "PATCH",
        json: UpdateCurrentUserRequestSchema.parse(request)
    });
}

export async function logout() {
    await authClient.signOut();
}
