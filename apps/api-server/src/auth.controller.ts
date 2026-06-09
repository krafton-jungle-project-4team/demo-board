import { Body, Controller, Get, Headers, HttpCode, Post, Query, Res } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags
} from "@nestjs/swagger";
import { AuthService, sessionCookieName, type SessionCookieOptions } from "./auth.service";
import { CompleteSignUpDto, UserDto } from "./posts.dto";

type AuthResponse = {
  cookie(name: string, value: string, options: SessionCookieOptions): void;
  clearCookie(name: string, options: SessionCookieOptions): void;
  redirect(url: string): void;
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("github/start")
  @ApiOperation({ summary: "GitHub OAuth 로그인 시작" })
  @ApiQuery({ name: "redirectTo", required: false, type: String, example: "/posts" })
  @ApiFoundResponse({ description: "GitHub OAuth 승인 화면으로 리다이렉트한다." })
  startGitHub(@Query("redirectTo") redirectTo: string | undefined, @Res() response: AuthResponse) {
    response.redirect(this.authService.createGitHubAuthorizationUrl(redirectTo));
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
      response.redirect(this.authService.createOAuthErrorRedirectUrl(error));
      return;
    }

    try {
      const result = await this.authService.completeGitHubCallback({ code, state });

      response.cookie(sessionCookieName, result.sessionToken, this.authService.getSessionCookieOptions());
      response.redirect(result.redirectUrl);
    } catch {
      response.redirect(this.authService.createOAuthErrorRedirectUrl());
    }
  }

  @Post("signup/complete")
  @HttpCode(200)
  @ApiCookieAuth("sessionCookie")
  @ApiBearerAuth("session")
  @ApiOperation({ summary: "OAuth 가입 완료" })
  @ApiBody({ type: CompleteSignUpDto })
  @ApiOkResponse({ type: UserDto })
  completeSignUp(
    @Body() body: CompleteSignUpDto,
    @Headers("authorization") authorization?: string,
    @Headers("cookie") cookieHeader?: string
  ) {
    return this.authService.completeSignUp(body, {
      authorization,
      cookieHeader,
      allowPending: true
    });
  }

  @Get("me")
  @ApiCookieAuth("sessionCookie")
  @ApiBearerAuth("session")
  @ApiOperation({ summary: "현재 로그인 사용자 조회" })
  @ApiOkResponse({ type: UserDto })
  me(@Headers("authorization") authorization?: string, @Headers("cookie") cookieHeader?: string) {
    return this.authService.requireUser({
      authorization,
      cookieHeader,
      allowPending: true
    });
  }

  @Post("logout")
  @HttpCode(204)
  @ApiCookieAuth("sessionCookie")
  @ApiBearerAuth("session")
  @ApiOperation({ summary: "로그아웃" })
  @ApiNoContentResponse()
  logout(
    @Headers("authorization") authorization: string | undefined,
    @Headers("cookie") cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: AuthResponse
  ) {
    const sessionToken = this.authService.readSessionToken({ authorization, cookieHeader });

    this.authService.deleteSession(sessionToken);
    response.clearCookie(sessionCookieName, this.authService.getClearedSessionCookieOptions());
  }
}
