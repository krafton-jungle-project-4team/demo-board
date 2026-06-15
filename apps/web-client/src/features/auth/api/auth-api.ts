import { CurrentUserResponseSchema, type CurrentUserResponse, type UpdateResidenceDongRequest } from "@nmm/shared";
import { z } from "zod";
import { ApiClientError, requestApiData } from "@/shared/api/http-client";
import { authClient } from "./auth-client";

export const SignInInputSchema = z.object({
    email: z.string().email("올바른 이메일을 입력해주세요."),
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.")
});

export type SignInInput = z.infer<typeof SignInInputSchema>;

export const SignUpInputSchema = SignInInputSchema.extend({
    name: z.string().min(1, "이름을 입력해주세요.")
});

export type SignUpInput = z.infer<typeof SignUpInputSchema>;

export async function getCurrentUserOrNull(): Promise<CurrentUserResponse | null> {
    try {
        return await requestApiData("auth/me", CurrentUserResponseSchema);
    } catch (error) {
        if (error instanceof ApiClientError && error.status === 401) {
            return null;
        }

        throw error;
    }
}

export async function signInWithEmail(input: SignInInput): Promise<void> {
    const result = await authClient.signIn.email(input);

    if (result.error) {
        throw new Error(result.error.message ?? "로그인에 실패했습니다.");
    }
}

export async function signUpWithEmail(input: SignUpInput): Promise<void> {
    const result = await authClient.signUp.email(input);

    if (result.error) {
        throw new Error(result.error.message ?? "회원가입에 실패했습니다.");
    }
}

export async function signOut(): Promise<void> {
    const result = await authClient.signOut();

    if (result.error) {
        throw new Error(result.error.message ?? "로그아웃에 실패했습니다.");
    }
}

export function updateResidenceDong(request: UpdateResidenceDongRequest): Promise<CurrentUserResponse> {
    return requestApiData("auth/me/residence-dong", CurrentUserResponseSchema, {
        method: "PATCH",
        json: request
    });
}
