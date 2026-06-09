import type { UserRecord } from "./auth.model";

export const AUTH_REPOSITORY = Symbol("AUTH_REPOSITORY");

export type AuthUserProfile = Pick<UserRecord, "name" | "status">;

export type AuthRepository = {
    findUser(id: string): Promise<UserRecord | undefined>;
    updateUserProfile(userId: string, profile: AuthUserProfile): Promise<void>;
    deleteUserSessions(userId: string, exceptSessionId?: string): Promise<void>;
};
