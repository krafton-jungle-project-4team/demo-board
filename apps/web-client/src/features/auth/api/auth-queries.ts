import { queryOptions } from "@tanstack/react-query";
import { getCurrentUserOrNull } from "./auth-api";

export const currentUserQueryOptions = queryOptions({
    queryKey: ["auth", "current-user"],
    queryFn: getCurrentUserOrNull,
    retry: false
});
