import { Inject, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { appErrors } from "../../../app-errors";
import { BETTER_AUTH, type BetterAuth } from "../database";
import { UserEntity } from "../database/user.entity";
import type { AuthClaims, UserRecord } from "../auth.model";

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
        const claims = this.toAuthClaims(await this.requireSession(context));

        this.assertAllowedClaims(claims, context);
        return claims;
    }

    async findUserRecord(claims: AuthClaims): Promise<UserRecord> {
        const user = await this.findUser(claims.userId);

        if (!user) {
            throw new Error("Authenticated user not found.");
        }

        return user;
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

    private async requireSession(context: AuthRequestContext): Promise<BetterAuth["$Infer"]["Session"]> {
        const session = await this.auth.api.getSession({
            headers: this.toHeaders(context),
            query: {
                disableCookieCache: true
            }
        });

        if (!session) {
            throw appErrors.authSessionRequired();
        }

        return session;
    }

    private assertAllowedClaims(claims: AuthClaims, context: AuthRequestContext) {
        if (claims.status === "SUSPENDED") {
            throw appErrors.authUserSuspended();
        }

        if (claims.status === "PENDING" && !context.allowPending) {
            throw appErrors.authSignupRequired();
        }
    }

    private toAuthClaims(session: BetterAuth["$Infer"]["Session"]): AuthClaims {
        return {
            userId: session.user.id,
            sessionId: session.session.id,
            role: session.user.role === "ADMIN" ? "ADMIN" : "USER",
            status: UserEntity.toUserStatus(session.user.status)
        };
    }

    private async findUser(id: string): Promise<UserRecord | undefined> {
        const user = await this.users.findOneBy({ id });

        return user ? UserEntity.from(user).toUser() : undefined;
    }
}
