import type { AuthUser } from "@nmm/shared";

export type AuthenticatedRequest = {
    authUser?: AuthUser;
};
