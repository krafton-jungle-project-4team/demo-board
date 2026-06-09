import type { OAuthAccountRecord, OAuthStateRecord, UserRecord } from "./auth.model";

export const AUTH_QUERY_PROVIDER = Symbol("AUTH_QUERY_PROVIDER");
export const AUTH_COMMAND_PROVIDER = Symbol("AUTH_COMMAND_PROVIDER");

export type AuthQueryProvider = {
    findUserById(id: string): Promise<UserRecord | undefined>;
    findUserByEmail(email: string): Promise<UserRecord | undefined>;
    findUserBySessionToken(sessionToken: string): Promise<UserRecord | undefined>;
    findOAuthAccount(key: string): Promise<OAuthAccountRecord | undefined>;
};

export type AuthCommandProvider = {
    createUserId(): string;
    saveUser(user: UserRecord): Promise<void>;
    saveSession(sessionToken: string, userId: string): Promise<void>;
    deleteSession(sessionToken: string): Promise<void>;
    saveUserWithOAuthAccount(user: UserRecord, key: string, account: OAuthAccountRecord): Promise<void>;
    saveOAuthState(state: string, record: OAuthStateRecord): Promise<void>;
    consumeOAuthState(state: string): Promise<OAuthStateRecord | undefined>;
};
