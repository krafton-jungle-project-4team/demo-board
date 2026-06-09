import { Inject, Injectable } from "@nestjs/common";
import { BETTER_AUTH, type BetterAuth } from "../database";
import { AUTH_REPOSITORY, authErrors, type ActiveUser, type AuthRepository, type UserRecord } from "../domain";

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

    async requireUserRecord(context: AuthRequestContext): Promise<UserRecord> {
        const session = await this.auth.api.getSession({
            headers: this.toHeaders(context),
            query: {
                disableCookieCache: true
            }
        });
        const userId = session?.user.id;
        const user = userId ? await this.authRepository.findUser(userId) : undefined;

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

    async requireActiveUserRecord(context: AuthRequestContext): Promise<ActiveUser> {
        const user = await this.requireUserRecord(context);

        if (user.status !== "ACTIVE" || !user.name) {
            throw authErrors.signupRequired();
        }

        return user as ActiveUser;
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
}
