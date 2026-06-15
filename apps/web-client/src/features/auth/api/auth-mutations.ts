import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateResidenceDong } from "./auth-api";
import { currentUserQueryOptions } from "./auth-queries";

export function useUpdateResidenceDongMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateResidenceDong,
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: currentUserQueryOptions.queryKey
            });
        }
    });
}
