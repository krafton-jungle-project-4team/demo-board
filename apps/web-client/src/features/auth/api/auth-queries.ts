import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserSchema, type User } from "@nmm/shared";
import {
  authControllerCompleteSignUp,
  authControllerLogout,
  authControllerUpdateMe,
  getAuthControllerMeUrl,
  type CompleteSignUpDto,
  type UpdateCurrentUserDto
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
    mutationFn: (data: CompleteSignUpDto) =>
      authControllerCompleteSignUp(data, {
        credentials: "include"
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authQueryKeys.currentUser });
      options?.onSuccess?.();
    }
  });
}

export function useUpdateCurrentUserMutation(options?: { onSuccess?: (user: User) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCurrentUserDto) =>
      authControllerUpdateMe(data, {
        credentials: "include"
      }),
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
      }),
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

  return UserSchema.parse(await response.json());
}
