import { Body, Controller, Get, Headers, HttpCode, Patch, Post } from "@nestjs/common";
import { AuthCommandService } from "../service/auth-command.service";
import { AuthQueryService } from "../service/auth-query.service";

@Controller("account")
export class AuthController {
    constructor(
        private readonly authCommandService: AuthCommandService,
        private readonly authQueryService: AuthQueryService
    ) {}

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
}
