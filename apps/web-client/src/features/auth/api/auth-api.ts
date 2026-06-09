import {
    CompleteSignUpRequestSchema,
    LogoutResponseSchema,
    UpdateCurrentUserRequestSchema,
    UserSchema,
    type CompleteSignUpRequest,
    type UpdateCurrentUserRequest
} from "@nmm/shared";
import { requestApiData } from "@/shared/api/http-client";

export function getCurrentUser(signal?: AbortSignal) {
    return requestApiData("/api/auth/me", UserSchema, { signal });
}

export function completeSignUp(request: CompleteSignUpRequest) {
    return requestApiData("/api/auth/signup/complete", UserSchema, {
        method: "POST",
        body: CompleteSignUpRequestSchema.parse(request)
    });
}

export function updateCurrentUser(request: UpdateCurrentUserRequest) {
    return requestApiData("/api/auth/me", UserSchema, {
        method: "PATCH",
        body: UpdateCurrentUserRequestSchema.parse(request)
    });
}

export function logout() {
    return requestApiData("/api/auth/logout", LogoutResponseSchema, {
        method: "POST"
    });
}
