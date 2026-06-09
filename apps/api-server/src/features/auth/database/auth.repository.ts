import { Injectable, type OnModuleInit } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "node:crypto";
import { DataSource, Repository } from "typeorm";
import type { User } from "@nmm/shared";
import { OAuthAccountEntity } from "./oauth-account.entity";
import { OAuthStateEntity } from "./oauth-state.entity";
import { SessionEntity } from "./session.entity";
import { UserEntity } from "./user.entity";

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
export class AuthRepository implements OnModuleInit {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(SessionEntity) private readonly sessions: Repository<SessionEntity>,
    @InjectRepository(OAuthAccountEntity) private readonly oauthAccounts: Repository<OAuthAccountEntity>,
    @InjectRepository(OAuthStateEntity) private readonly oauthStates: Repository<OAuthStateEntity>
  ) {}

  async onModuleInit() {
    if (!this.dataSource.isInitialized) {
      return;
    }

    if (await this.users.existsBy({ id: "user-sijun" })) {
      return;
    }

    await this.saveUser({
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
    return `user-${randomUUID()}`;
  }

  async findUserById(id: string) {
    return this.toUserRecord(await this.users.findOneBy({ id }));
  }

  async findUserByEmail(email: string) {
    return this.toUserRecord(await this.users.findOneBy({ email }));
  }

  async findUserBySessionToken(sessionToken: string) {
    const session = await this.sessions.findOneBy({ token: sessionToken });

    return session ? this.findUserById(session.userId) : undefined;
  }

  async saveUser(user: UserRecord) {
    await this.users.save(this.toUserEntity(user));
  }

  async saveSession(sessionToken: string, userId: string) {
    await this.sessions.save({
      token: sessionToken,
      userId
    });
  }

  async deleteSession(sessionToken: string) {
    await this.sessions.delete({ token: sessionToken });
  }

  async findOAuthAccount(key: string) {
    return this.toOAuthAccountRecord(await this.oauthAccounts.findOneBy({ accountKey: key }));
  }

  async saveOAuthAccount(key: string, account: OAuthAccountRecord) {
    await this.oauthAccounts.save({
      accountKey: key,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      userId: account.userId,
      accessToken: account.accessToken,
      providerLogin: account.providerLogin,
      updatedAt: new Date(account.updatedAt)
    });
  }

  async saveOAuthState(state: string, record: OAuthStateRecord) {
    await this.oauthStates.save({
      state,
      redirectTo: record.redirectTo,
      expiresAt: record.expiresAt
    });
  }

  async consumeOAuthState(state: string) {
    const stateRecord = await this.oauthStates.findOneBy({ state });

    if (stateRecord) {
      await this.oauthStates.delete({ state });
    }

    return this.toOAuthStateRecord(stateRecord);
  }

  private toUserEntity(user: UserRecord): UserEntity {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      status: user.status,
      createdAt: new Date(user.createdAt)
    };
  }

  private toUserRecord(user: UserEntity | null) {
    if (!user) {
      return undefined;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString()
    } satisfies UserRecord;
  }

  private toOAuthAccountRecord(account: OAuthAccountEntity | null) {
    if (!account) {
      return undefined;
    }

    return {
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      userId: account.userId,
      accessToken: account.accessToken,
      providerLogin: account.providerLogin,
      updatedAt: account.updatedAt.toISOString()
    } satisfies OAuthAccountRecord;
  }

  private toOAuthStateRecord(state: OAuthStateEntity | null) {
    if (!state) {
      return undefined;
    }

    return {
      redirectTo: state.redirectTo,
      expiresAt: state.expiresAt
    } satisfies OAuthStateRecord;
  }
}
