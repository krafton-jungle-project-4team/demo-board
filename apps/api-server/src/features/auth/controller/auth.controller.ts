import { Body, Controller, Get, Headers, HttpCode, Patch, Post, Query, Res } from "@nestjs/common";
import { AuthCommandService, type SessionCookieOptions } from "../service/auth-command.service";
import { AuthQueryService, sessionCookieName } from "../service/auth-query.service";

type AuthResponse = {
    cookie(name: string, value: string, options: SessionCookieOptions): void;
    clearCookie(name: string, options: SessionCookieOptions): void;
    redirect(url: string): void;
};

@Controller("auth")
export class AuthController {
    constructor(
        private readonly authCommandService: AuthCommandService,
        private readonly authQueryService: AuthQueryService
    ) {}

    @Get("github/start")
    async startGitHub(@Query("redirectTo") redirectTo: string | undefined, @Res() response: AuthResponse) {
        response.redirect(await this.authCommandService.createGitHubAuthorizationUrl(redirectTo));
    }

    @Get("github/callback")
    async githubCallback(
        @Query("code") code: string | undefined,
        @Query("state") state: string | undefined,
        @Query("error") error: string | undefined,
        @Res() response: AuthResponse
    ) {
        if (error) {
            response.redirect(this.authCommandService.createOAuthErrorRedirectUrl(error));
            return;
        }

        try {
            const result = await this.authCommandService.completeGitHubCallback({ code, state });

            response.cookie(sessionCookieName, result.sessionToken, this.authCommandService.getSessionCookieOptions());
            response.redirect(result.redirectUrl);
        } catch {
            response.redirect(this.authCommandService.createOAuthErrorRedirectUrl());
        }
    }

    @Post("signup/complete")
    @HttpCode(200)
    async completeSignUp(
        @Body() body: unknown,
        @Headers("authorization") authorization?: string,
        @Headers("cookie") cookieHeader?: string
    ) {
        return this.authCommandService.completeSignUp(body, {
            authorization,
            cookieHeader,
            allowPending: true
        });
    }

    @Get("me")
    async me(@Headers("authorization") authorization?: string, @Headers("cookie") cookieHeader?: string) {
        return this.authQueryService.getCurrentUser({
            authorization,
            cookieHeader
        });
    }

    @Patch("me")
    async updateMe(
        @Body() body: unknown,
        @Headers("authorization") authorization?: string,
        @Headers("cookie") cookieHeader?: string
    ) {
        return this.authCommandService.updateCurrentUser(body, {
            authorization,
            cookieHeader
        });
    }

    @Post("logout")
    @HttpCode(200)
    async logout(
        @Headers("authorization") authorization: string | undefined,
        @Headers("cookie") cookieHeader: string | undefined,
        @Res({ passthrough: true }) response: AuthResponse
    ) {
        const sessionToken = this.authQueryService.readSessionToken({ authorization, cookieHeader });

        await this.authCommandService.deleteSession(sessionToken);
        response.clearCookie(sessionCookieName, this.authCommandService.getClearedSessionCookieOptions());

        return { ok: true };
    }
}
