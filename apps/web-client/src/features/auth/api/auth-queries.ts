import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserSchema, type CompleteSignUpRequest, type UpdateCurrentUserRequest, type User } from "@nmm/shared";
import {
    authControllerCompleteSignUp,
    authControllerLogout,
    authControllerUpdateMe,
    getAuthControllerMeUrl
} from "@/shared/api/generated/api-server";

export const authQueryKeys = {
    currentUser: ["auth", "current-user"] as const
};

export function useCurrentUserQuery() {
    return useQuery({
        queryKey: authQueryKeys.currentUser,
        queryFn: ({ signal }) => fetchCurrentUser(signal)
    });
}

export function useCompleteSignUpMutation(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CompleteSignUpRequest) =>
            authControllerCompleteSignUp(data, {
                credentials: "include"
            }).then((response) => response.data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser });
            options?.onSuccess?.();
        }
    });
}

export function useUpdateCurrentUserMutation(options?: { onSuccess?: (user: User) => void }) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateCurrentUserRequest) =>
            authControllerUpdateMe(data, {
                credentials: "include"
            }).then((response) => response.data),
        onSuccess: (user) => {
            const parsedUser = UserSchema.parse(user);

            queryClient.setQueryData(authQueryKeys.currentUser, parsedUser);
            options?.onSuccess?.(parsedUser);
        }
    });
}

export function useLogoutMutation(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () =>
            authControllerLogout({
                credentials: "include"
            }).then((response) => response.data),
        onSuccess: () => {
            queryClient.setQueryData(authQueryKeys.currentUser, null);
            options?.onSuccess?.();
        }
    });
}

async function fetchCurrentUser(signal?: AbortSignal): Promise<User | null> {
    const response = await fetch(getAuthControllerMeUrl(), {
        credentials: "include",
        signal
    });

    if (response.status === 401) {
        return null;
    }

    if (!response.ok) {
        throw new Error("현재 사용자 정보를 불러오지 못했습니다.");
    }

    const responseBody = (await response.json()) as { data: unknown };

    return UserSchema.parse(responseBody.data);
}
