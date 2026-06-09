import { Injectable } from "@nestjs/common";
import type { User } from "@nmm/shared";

export type UserRecord = User;

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

@Injectable()
export class AuthRepository {
  private nextUserNumber = 2;
  private readonly users = new Map<string, UserRecord>();
  private readonly userIdsByEmail = new Map<string, string>();
  private readonly sessionUserIds = new Map<string, string>();
  private readonly oauthAccounts = new Map<string, OAuthAccountRecord>();
  private readonly oauthStates = new Map<string, OAuthStateRecord>();

  constructor() {
    this.saveUser({
      id: "user-sijun",
      email: "sijun@example.com",
      name: "sijun",
      image: null,
      role: "USER",
      status: "ACTIVE",
      createdAt: new Date("2026-06-09T00:00:00.000Z").toISOString()
    });
  }

  createUserId() {
    return `user-${this.nextUserNumber++}`;
  }

  findUserById(id: string) {
    return this.users.get(id);
  }

  findUserByEmail(email: string) {
    const userId = this.userIdsByEmail.get(email);

    return userId ? this.findUserById(userId) : undefined;
  }

  findUserBySessionToken(sessionToken: string) {
    const userId = this.sessionUserIds.get(sessionToken);

    return userId ? this.findUserById(userId) : undefined;
  }

  saveUser(user: UserRecord) {
    this.users.set(user.id, user);
    this.userIdsByEmail.set(user.email, user.id);
  }

  saveSession(sessionToken: string, userId: string) {
    this.sessionUserIds.set(sessionToken, userId);
  }

  deleteSession(sessionToken: string) {
    this.sessionUserIds.delete(sessionToken);
  }

  findOAuthAccount(key: string) {
    return this.oauthAccounts.get(key);
  }

  saveOAuthAccount(key: string, account: OAuthAccountRecord) {
    this.oauthAccounts.set(key, account);
  }

  saveOAuthState(state: string, record: OAuthStateRecord) {
    this.oauthStates.set(state, record);
  }

  consumeOAuthState(state: string) {
    const stateRecord = this.oauthStates.get(state);

    this.oauthStates.delete(state);

    return stateRecord;
  }
}
