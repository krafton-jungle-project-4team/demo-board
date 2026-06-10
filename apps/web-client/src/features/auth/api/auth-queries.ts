import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
    CompleteSignUpRequest,
    CompleteSignUpResponse,
    UpdateCurrentUserRequest,
    UpdateCurrentUserResponse,
    User
} from "@nmm/shared";
import { ApiClientError } from "@/shared/api/http-client";
import { completeSignUp, getCurrentUser, logout, updateCurrentUser } from "./auth-api";

export const authQueryKeys = {
    currentUser: ["auth", "current-user"] as const
};

export function useCurrentUserQuery() {
    return useQuery({
        queryKey: authQueryKeys.currentUser,
        queryFn: ({ signal }) => fetchCurrentUser(signal)
    });
}

export function useCompleteSignUpMutation(options?: { onSuccess?: (response: CompleteSignUpResponse) => void }) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CompleteSignUpRequest) => completeSignUp(data),
        onSuccess: (response) => {
            void queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser });
            options?.onSuccess?.(response);
        }
    });
}

export function useUpdateCurrentUserMutation(options?: { onSuccess?: (response: UpdateCurrentUserResponse) => void }) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateCurrentUserRequest) => updateCurrentUser(data),
        onSuccess: (response) => {
            void queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser });
            options?.onSuccess?.(response);
        }
    });
}

export function useLogoutMutation(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => logout(),
        onSuccess: () => {
            queryClient.setQueryData(authQueryKeys.currentUser, null);
            options?.onSuccess?.();
        }
    });
}

async function fetchCurrentUser(signal?: AbortSignal): Promise<User | null> {
    try {
        return await getCurrentUser(signal);
    } catch (error) {
        if (error instanceof ApiClientError && error.status === 401) {
            return null;
        }

        throw error;
    }
}
