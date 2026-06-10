import type { User, UserRole, UserStatus } from "@nmm/shared";

export type AuthClaims = {
    userId: string;
    sessionId: string;
    role: UserRole;
    status: UserStatus;
};

export type UserRecord = User;
