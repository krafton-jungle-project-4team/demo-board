import { Inject, Injectable } from "@nestjs/common";
import { UserSchema, type User } from "@nmm/shared";
import { AUTH_QUERY_PROVIDER, authErrors, type ActiveUser, type AuthQueryProvider, type UserRecord } from "../domain";

export const sessionCookieName = "nmm_session";

export type AuthRequestContext = {
    authorization?: string;
    cookieHeader?: string;
    allowPending?: boolean;
};

@Injectable()
export class AuthQueryService {
    constructor(@Inject(AUTH_QUERY_PROVIDER) private readonly authQueryProvider: AuthQueryProvider) {}

    async getCurrentUser(context: AuthRequestContext): Promise<User> {
        return this.toUser(await this.requireUserRecord({ ...context, allowPending: true }));
    }

    async requireUser(context: AuthRequestContext): Promise<ActiveUser> {
        return this.toActiveUser(await this.requireUserRecord(context));
    }

    async requireUserRecord(context: AuthRequestContext): Promise<UserRecord> {
        const sessionToken = this.readSessionToken(context);
        const user = sessionToken ? await this.authQueryProvider.findUserBySessionToken(sessionToken) : undefined;

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

    readSessionToken(context: AuthRequestContext) {
        return this.readCookieToken(context.cookieHeader) ?? this.readBearerToken(context.authorization);
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

    private readCookieToken(cookieHeader: string | undefined) {
        if (!cookieHeader) {
            return undefined;
        }

        const cookies = cookieHeader.split(";").map((item) => item.trim());
        const sessionCookie = cookies.find((cookie) => cookie.startsWith(`${sessionCookieName}=`));
        const token = sessionCookie?.slice(`${sessionCookieName}=`.length);

        return token ? decodeURIComponent(token) : undefined;
    }

    private readBearerToken(authorization: string | undefined) {
        if (!authorization?.startsWith("Bearer ")) {
            return undefined;
        }

        return authorization.slice("Bearer ".length).trim() || undefined;
    }
}
