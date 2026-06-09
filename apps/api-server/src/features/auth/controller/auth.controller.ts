import { Body, Controller, Get, Headers, HttpCode, Patch, Post, Query, Res } from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiBody,
    ApiCookieAuth,
    ApiFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiQuery,
    ApiTags
} from "@nestjs/swagger";
import { ApiStandardErrorResponses } from "../../../common/http";
import { AuthCommandService, type SessionCookieOptions } from "../service/auth-command.service";
import { AuthQueryService, sessionCookieName } from "../service/auth-query.service";
import {
    completeSignUpRequestOpenApiSchema,
    logoutApiResponseOpenApiSchema,
    updateCurrentUserRequestOpenApiSchema,
    userApiResponseOpenApiSchema
} from "./auth.openapi";

type AuthResponse = {
    cookie(name: string, value: string, options: SessionCookieOptions): void;
    clearCookie(name: string, options: SessionCookieOptions): void;
    redirect(url: string): void;
};

@ApiTags("auth")
@ApiStandardErrorResponses()
@Controller("auth")
export class AuthController {
    constructor(
        private readonly authCommandService: AuthCommandService,
        private readonly authQueryService: AuthQueryService
    ) {}

    @Get("github/start")
    @ApiOperation({ summary: "GitHub OAuth 로그인 시작" })
    @ApiQuery({ name: "redirectTo", required: false, type: String, example: "/posts" })
    @ApiFoundResponse({ description: "GitHub OAuth 승인 화면으로 리다이렉트한다." })
    async startGitHub(@Query("redirectTo") redirectTo: string | undefined, @Res() response: AuthResponse) {
        response.redirect(await this.authCommandService.createGitHubAuthorizationUrl(redirectTo));
    }

    @Get("github/callback")
    @ApiOperation({ summary: "GitHub OAuth callback 처리" })
    @ApiQuery({ name: "code", required: false, type: String })
    @ApiQuery({ name: "state", required: false, type: String })
    @ApiQuery({ name: "error", required: false, type: String })
    @ApiFoundResponse({ description: "세션 쿠키를 설정한 뒤 web 화면으로 리다이렉트한다." })
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
    @ApiCookieAuth("sessionCookie")
    @ApiBearerAuth("session")
    @ApiOperation({ summary: "OAuth 가입 완료" })
    @ApiBody({ schema: completeSignUpRequestOpenApiSchema })
    @ApiOkResponse({ schema: userApiResponseOpenApiSchema })
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
    @ApiCookieAuth("sessionCookie")
    @ApiBearerAuth("session")
    @ApiOperation({ summary: "현재 로그인 사용자 조회" })
    @ApiOkResponse({ schema: userApiResponseOpenApiSchema })
    async me(@Headers("authorization") authorization?: string, @Headers("cookie") cookieHeader?: string) {
        return this.authQueryService.getCurrentUser({
            authorization,
            cookieHeader
        });
    }

    @Patch("me")
    @ApiCookieAuth("sessionCookie")
    @ApiBearerAuth("session")
    @ApiOperation({ summary: "현재 사용자 정보 수정" })
    @ApiBody({ schema: updateCurrentUserRequestOpenApiSchema })
    @ApiOkResponse({ schema: userApiResponseOpenApiSchema })
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
    @ApiCookieAuth("sessionCookie")
    @ApiBearerAuth("session")
    @ApiOperation({ summary: "로그아웃" })
    @ApiOkResponse({ schema: logoutApiResponseOpenApiSchema })
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
