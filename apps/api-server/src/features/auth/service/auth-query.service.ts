import { Inject, Injectable } from "@nestjs/common";
import { UserSchema, type User } from "@nmm/shared";
import { BETTER_AUTH, type BetterAuth } from "../database";
import { authErrors, type ActiveUser, type UserRecord } from "../domain";

export type AuthRequestContext = {
    authorization?: string;
    cookieHeader?: string;
    allowPending?: boolean;
};

@Injectable()
export class AuthQueryService {
    constructor(@Inject(BETTER_AUTH) private readonly auth: BetterAuth) {}

    async getCurrentUser(context: AuthRequestContext): Promise<User> {
        return this.toUser(await this.requireUserRecord({ ...context, allowPending: true }));
    }

    async requireUser(context: AuthRequestContext): Promise<ActiveUser> {
        return this.toActiveUser(await this.requireUserRecord(context));
    }

    async requireUserRecord(context: AuthRequestContext): Promise<UserRecord> {
        const session = await this.auth.api.getSession({
            headers: this.toHeaders(context),
            query: {
                disableCookieCache: true
            }
        });
        const user = session ? this.toUserRecord(session.user) : undefined;

        if (!user) {
            throw authErrors.sessionRequired();
        }

        if (user.status === "SUSPENDED") {
            throw authErrors.userSuspended();
        }

        if (user.status === "PENDING" && !context.allowPending) {
            throw authErrors.signupRequired();
        }

        return user;
    }

    async requireActiveUserRecord(context: AuthRequestContext): Promise<UserRecord> {
        const user = await this.requireUserRecord(context);

        if (user.status !== "ACTIVE" || !user.name) {
            throw authErrors.signupRequired();
        }

        return user;
    }

    toUser(user: UserRecord): User {
        return UserSchema.parse(user);
    }

    private toActiveUser(user: UserRecord): ActiveUser {
        const parsedUser = this.toUser(user);

        if (parsedUser.status !== "ACTIVE" || !parsedUser.name) {
            throw authErrors.signupRequired();
        }

        return parsedUser as ActiveUser;
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

    private toUserRecord(user: BetterAuth["$Infer"]["Session"]["user"]): UserRecord {
        return {
            id: user.id,
            email: user.email,
            name: user.name.trim() || null,
            image: user.image ?? null,
            role: user.role === "ADMIN" ? "ADMIN" : "USER",
            status: this.toUserStatus(user.status),
            createdAt: user.createdAt.toISOString()
        };
    }

    private toUserStatus(value: unknown) {
        if (value === "ACTIVE" || value === "SUSPENDED") {
            return value;
        }

        return "PENDING";
    }
}
