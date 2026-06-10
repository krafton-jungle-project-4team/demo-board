import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { appErrors } from "../../../app-errors";
import { BETTER_AUTH, type BetterAuth } from "../database";
import { UserEntity } from "../database/user.entity";
import type { AuthClaims, CompletedUserRecord, UserRecord } from "../auth.model";

export type AuthRequestContext = {
    authorization?: string;
    cookieHeader?: string;
    allowPending?: boolean;
};

@Injectable()
export class AuthQueryService {
    constructor(
        @Inject(BETTER_AUTH) private readonly auth: BetterAuth,
        @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>
    ) {}

    async requireAuthClaims(context: AuthRequestContext): Promise<AuthClaims> {
        const session = await this.auth.api.getSession({
            headers: this.toHeaders(context),
            query: {
                disableCookieCache: true
            }
        });
        const claims = session ? this.toAuthClaims(session) : undefined;

        if (!claims) {
            throw appErrors.authSessionRequired();
        }

        if (claims.status === "SUSPENDED") {
            throw appErrors.authUserSuspended();
        }

        if (claims.status === "PENDING" && !context.allowPending) {
            throw appErrors.authSignupRequired();
        }

        return claims;
    }

    async findUserRecord(claims: AuthClaims): Promise<UserRecord> {
        const user = await this.findUser(claims.userId);

        if (!user) {
            throw appErrors.authSessionRequired();
        }

        return user;
    }

    async requireCompletedUserRecord(claims: AuthClaims): Promise<CompletedUserRecord> {
        const user = await this.findUserRecord(claims);

        if (user.status !== "ACTIVE" || !user.name) {
            throw appErrors.authSignupRequired();
        }

        return user as CompletedUserRecord;
    }

    private toHeaders(context: AuthRequestContext) {
        const headers = new Headers();

        if (context.authorization) {
            headers.set("authorization", context.authorization);
        }

        if (context.cookieHeader) {
            headers.set("cookie", context.cookieHeader);
        }

        return headers;
    }

    private toAuthClaims(session: BetterAuth["$Infer"]["Session"]): AuthClaims {
        return {
            userId: session.user.id,
            sessionId: session.session.id,
            role: session.user.role === "ADMIN" ? "ADMIN" : "USER",
            status: this.toUserStatus(session.user.status)
        };
    }

    private toUserStatus(value: unknown) {
        if (value === "ACTIVE" || value === "SUSPENDED") {
            return value;
        }

        return "PENDING";
    }

    private async findUser(id: string): Promise<UserRecord | undefined> {
        const user = await this.users.findOneBy({ id });

        return user ? this.toUserRecord(user) : undefined;
    }

    private toUserRecord(user: UserEntity): UserRecord {
        return {
            id: user.id,
            email: user.email,
            name: user.name.trim() || null,
            image: user.image,
            role: user.role === "ADMIN" ? "ADMIN" : "USER",
            status: this.toUserStatus(user.status),
            createdAt: user.createdAt.toISOString()
        };
    }
}
