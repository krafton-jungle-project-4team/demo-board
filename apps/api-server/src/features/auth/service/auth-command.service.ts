import { Inject, Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { CompleteSignUpRequestSchema, UpdateCurrentUserRequestSchema, type User } from "@nmm/shared";
import { serverEnv } from "../../../common/env";
import {
    AUTH_COMMAND_PROVIDER,
    AUTH_OAUTH_PROVIDER,
    AUTH_QUERY_PROVIDER,
    authErrors,
    type AuthCommandProvider,
    type AuthQueryProvider,
    OAuthProviderError,
    type OAuthProvider,
    type OAuthProviderProfile,
    type UserRecord
} from "../domain";
import { AuthQueryService, type AuthRequestContext } from "./auth-query.service";

export type SessionCookieOptions = {
    httpOnly: true;
    sameSite: "lax";
    secure: boolean;
    path: "/api";
};

@Injectable()
export class AuthCommandService {
    constructor(
        @Inject(AUTH_COMMAND_PROVIDER) private readonly authCommandProvider: AuthCommandProvider,
        @Inject(AUTH_QUERY_PROVIDER) private readonly authQueryProvider: AuthQueryProvider,
        @Inject(AUTH_OAUTH_PROVIDER) private readonly oauthProvider: OAuthProvider,
        private readonly authQueryService: AuthQueryService
    ) {}

    async createGitHubAuthorizationUrl(redirectTo?: string) {
        const state = randomBytes(32).toString("base64url");

        await this.authCommandProvider.saveOAuthState(state, {
            redirectTo: this.normalizeRedirectPath(redirectTo, this.loginRedirectPath),
            expiresAt: Date.now() + 10 * 60 * 1000
        });

        return this.readOAuthProviderResult(() => this.oauthProvider.createAuthorizationUrl({ state }));
    }

    async completeGitHubCallback(input: { code?: string; state?: string }) {
        if (!input.code || !input.state) {
            throw authErrors.oauthCallbackRequired();
        }

        const state = await this.consumeOAuthState(input.state);
        const accessToken = await this.requestOAuthProviderResult(() => this.oauthProvider.exchangeCode(input.code!));
        const profile = await this.requestOAuthProviderResult(() => this.oauthProvider.fetchProfile(accessToken));
        const emails = await this.requestOAuthProviderResult(() => this.oauthProvider.fetchEmails(accessToken));
        const email = this.readOAuthProviderResult(() => this.oauthProvider.pickVerifiedEmail(profile, emails));
        const user = await this.upsertGitHubUser({
            accessToken,
            email,
            profile
        });
        const sessionToken = await this.createSession(user);
        const redirectPath = user.status === "PENDING" ? this.signupRedirectPath : state.redirectTo;

        return {
            user: this.authQueryService.toUser(user),
            sessionToken,
            redirectUrl: this.toWebUrl(redirectPath)
        };
    }

    async completeSignUp(input: unknown, context: AuthRequestContext): Promise<User> {
        const request = CompleteSignUpRequestSchema.parse(input);
        const user = await this.authQueryService.requireUserRecord({ ...context, allowPending: true });

        user.name = request.name;
        user.status = "ACTIVE";
        await this.authCommandProvider.saveUser(user);

        return this.authQueryService.toUser(user);
    }

    async updateCurrentUser(input: unknown, context: AuthRequestContext): Promise<User> {
        const request = UpdateCurrentUserRequestSchema.parse(input);
        const user = await this.authQueryService.requireActiveUserRecord(context);

        user.name = request.name;
        await this.authCommandProvider.saveUser(user);

        return this.authQueryService.toUser(user);
    }

    async deleteSession(sessionToken: string | undefined) {
        if (sessionToken) {
            await this.authCommandProvider.deleteSession(sessionToken);
        }
    }

    getSessionCookieOptions(): SessionCookieOptions {
        return {
            httpOnly: true,
            sameSite: "lax",
            secure: serverEnv.auth.sessionCookieSecure,
            path: "/api"
        };
    }

    getClearedSessionCookieOptions(): SessionCookieOptions {
        return this.getSessionCookieOptions();
    }

    createOAuthErrorRedirectUrl(reason = "oauth") {
        const errorPath = new URLSearchParams({ reason }).toString();

        return this.toWebUrl(`${this.errorRedirectPath}?${errorPath}`);
    }

    private async upsertGitHubUser(input: {
        accessToken: string;
        email: string;
        profile: OAuthProviderProfile;
    }): Promise<UserRecord> {
        const providerAccountKey = this.createProviderAccountKey(
            input.profile.provider,
            input.profile.providerAccountId
        );
        const existingAccount = await this.authQueryProvider.findOAuthAccount(providerAccountKey);
        const now = new Date().toISOString();
        let user = existingAccount ? await this.authQueryProvider.findUserById(existingAccount.userId) : undefined;

        if (!user) {
            user = await this.authQueryProvider.findUserByEmail(input.email);
        }

        if (!user) {
            user = {
                id: this.authCommandProvider.createUserId(),
                email: input.email,
                name: null,
                image: input.profile.avatarUrl,
                role: "USER",
                status: "PENDING",
                createdAt: now
            };
        } else {
            user.image = input.profile.avatarUrl;
        }

        await this.authCommandProvider.saveUserWithOAuthAccount(user, providerAccountKey, {
            provider: "github",
            providerAccountId: input.profile.providerAccountId,
            userId: user.id,
            accessToken: input.accessToken,
            providerLogin: input.profile.login,
            updatedAt: now
        });

        return user;
    }

    private async consumeOAuthState(state: string) {
        const stateRecord = await this.authCommandProvider.consumeOAuthState(state);

        if (!stateRecord || stateRecord.expiresAt < Date.now()) {
            throw authErrors.oauthStateInvalid();
        }

        return stateRecord;
    }

    private async createSession(user: UserRecord) {
        const sessionToken = randomBytes(32).toString("base64url");

        await this.authCommandProvider.saveSession(sessionToken, user.id);

        return sessionToken;
    }

    private normalizeRedirectPath(value: string | undefined, fallback: string) {
        if (!value || !value.startsWith("/") || value.startsWith("//")) {
            return fallback;
        }

        return value;
    }

    private toWebUrl(path: string) {
        return new URL(path, this.webOrigin).toString();
    }

    private createProviderAccountKey(provider: "github", providerAccountId: string) {
        return `${provider}:${providerAccountId}`;
    }

    private get webOrigin() {
        return serverEnv.auth.webOrigin;
    }

    private get loginRedirectPath() {
        return serverEnv.auth.loginRedirectPath;
    }

    private get signupRedirectPath() {
        return serverEnv.auth.signupRedirectPath;
    }

    private get errorRedirectPath() {
        return serverEnv.auth.errorRedirectPath;
    }

    private async requestOAuthProviderResult<T>(request: () => Promise<T>) {
        try {
            return await request();
        } catch (error) {
            this.throwAuthError(error);
        }
    }

    private readOAuthProviderResult<T>(read: () => T) {
        try {
            return read();
        } catch (error) {
            this.throwAuthError(error);
        }
    }

    private throwAuthError(error: unknown): never {
        if (!(error instanceof OAuthProviderError)) {
            throw error;
        }

        switch (error.failure) {
            case "ACCESS_TOKEN_UNAVAILABLE":
                throw authErrors.oauthAccessTokenUnavailable();
            case "PROFILE_UNAVAILABLE":
                throw authErrors.oauthProfileUnavailable();
            case "EMAIL_UNAVAILABLE":
                throw authErrors.oauthEmailUnavailable();
            case "VERIFIED_EMAIL_UNAVAILABLE":
                throw authErrors.oauthVerifiedEmailUnavailable();
            case "RESPONSE_INVALID":
                throw authErrors.oauthResponseInvalid();
        }
    }
}
