import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from "@nestjs/common";
import { CompleteSignUpRequestSchema, UpdateCurrentUserRequestSchema, type User } from "@nmm/shared";
import type { AuthClaims } from "../domain";
import { AuthCommandService } from "../service/auth-command.service";
import { AuthQueryService } from "../service/auth-query.service";
import { ActiveUserGuard } from "./active-user.guard";
import { CurrentAuth } from "./current-auth.decorator";
import { SessionUserGuard } from "./session-user.guard";

@Controller("account")
export class AuthController {
    constructor(
        private readonly authCommandService: AuthCommandService,
        private readonly authQueryService: AuthQueryService
    ) {}

    @Post("signup/complete")
    @HttpCode(200)
    @UseGuards(SessionUserGuard)
    async completeSignUp(@Body() body: unknown, @CurrentAuth() claims: AuthClaims) {
        return this.authCommandService.completeSignUp(CompleteSignUpRequestSchema.parse(body), claims);
    }

    @Get("me")
    @UseGuards(SessionUserGuard)
    async me(@CurrentAuth() claims: AuthClaims): Promise<User> {
        return this.authQueryService.findUserRecord(claims);
    }

    @Patch("me")
    @UseGuards(ActiveUserGuard)
    async updateMe(@Body() body: unknown, @CurrentAuth() claims: AuthClaims) {
        return this.authCommandService.updateCurrentUser(UpdateCurrentUserRequestSchema.parse(body), claims);
    }
}
