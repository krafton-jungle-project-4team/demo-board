import {
    CompleteSignUpRequestSchema,
    CompleteSignUpResponseSchema,
    UpdateCurrentUserRequestSchema,
    UpdateCurrentUserResponseSchema,
    UserSchema,
    type CompleteSignUpRequest,
    type CompleteSignUpResponse,
    type UpdateCurrentUserRequest,
    type UpdateCurrentUserResponse,
    type User
} from "@nmm/shared";
import { requestApiData } from "@/shared/api/http-client";
import { authClient } from "./auth-client";

export function getCurrentUser(signal?: AbortSignal): Promise<User> {
    return requestApiData("account/me", UserSchema, { signal });
}

export function completeSignUp(request: CompleteSignUpRequest): Promise<CompleteSignUpResponse> {
    const body: CompleteSignUpRequest = CompleteSignUpRequestSchema.parse(request);

    return requestApiData("account/signup/complete", CompleteSignUpResponseSchema, {
        method: "POST",
        json: body
    });
}

export function updateCurrentUser(request: UpdateCurrentUserRequest): Promise<UpdateCurrentUserResponse> {
    const body: UpdateCurrentUserRequest = UpdateCurrentUserRequestSchema.parse(request);

    return requestApiData("account/me", UpdateCurrentUserResponseSchema, {
        method: "PATCH",
        json: body
    });
}

export async function logout(): Promise<void> {
    await authClient.signOut();
}
