import type { User } from "@nmm/shared";

export type UserRecord = User;

export type ActiveUser = User & {
    name: string;
    status: "ACTIVE";
};

export type OAuthAccountRecord = {
    provider: "github";
    providerAccountId: string;
    userId: string;
    accessToken: string;
    providerLogin: string;
    updatedAt: string;
};

export type OAuthStateRecord = {
    redirectTo: string;
    expiresAt: number;
};
