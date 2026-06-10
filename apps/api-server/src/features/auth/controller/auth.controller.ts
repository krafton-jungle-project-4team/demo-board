import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from "@nestjs/common";
import { CompleteSignUpRequestSchema, UpdateCurrentUserRequestSchema, UserSchema, type User } from "@nmm/shared";
import type { AuthClaims } from "../auth.model";
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
        const user = await this.authCommandService.completeSignUp(CompleteSignUpRequestSchema.parse(body), claims);

        return UserSchema.parse(user);
    }

    @Get("me")
    @UseGuards(SessionUserGuard)
    async me(@CurrentAuth() claims: AuthClaims): Promise<User> {
        const user = await this.authQueryService.findUserRecord(claims);

        return UserSchema.parse(user);
    }

    @Patch("me")
    @UseGuards(ActiveUserGuard)
    async updateMe(@Body() body: unknown, @CurrentAuth() claims: AuthClaims) {
        const user = await this.authCommandService.updateCurrentUser(
            UpdateCurrentUserRequestSchema.parse(body),
            claims
        );

        return UserSchema.parse(user);
    }
}
