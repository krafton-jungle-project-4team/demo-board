import { Inject, Injectable } from "@nestjs/common";
import { BETTER_AUTH, type BetterAuth } from "../database";
import {
    AUTH_REPOSITORY,
    authErrors,
    type AuthClaims,
    type AuthRepository,
    type CompletedUserRecord,
    type UserRecord
} from "../domain";

export type AuthRequestContext = {
    authorization?: string;
    cookieHeader?: string;
    allowPending?: boolean;
};

@Injectable()
export class AuthQueryService {
    constructor(
        @Inject(BETTER_AUTH) private readonly auth: BetterAuth,
        @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepository
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
            throw authErrors.sessionRequired();
        }

        if (claims.status === "SUSPENDED") {
            throw authErrors.userSuspended();
        }

        if (claims.status === "PENDING" && !context.allowPending) {
            throw authErrors.signupRequired();
        }

        return claims;
    }

    async findUserRecord(claims: AuthClaims): Promise<UserRecord> {
        const user = await this.authRepository.findUser(claims.userId);

        if (!user) {
            throw authErrors.sessionRequired();
        }

        return user;
    }

    async requireCompletedUserRecord(claims: AuthClaims): Promise<CompletedUserRecord> {
        const user = await this.findUserRecord(claims);

        if (user.status !== "ACTIVE" || !user.name) {
            throw authErrors.signupRequired();
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
}
