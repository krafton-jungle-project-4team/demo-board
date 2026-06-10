import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from "@nestjs/common";
import {
    CompleteSignUpRequestSchema,
    CompleteSignUpResponseSchema,
    UpdateCurrentUserRequestSchema,
    UpdateCurrentUserResponseSchema,
    UserSchema,
    type User
} from "@nmm/shared";
import type { AuthClaims } from "../auth.model";
import { AuthCommandService } from "../service/auth-command.service";
import { AuthQueryService } from "../service/auth-query.service";
import { ActiveAccountGuard } from "./active-account.guard";
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
        const response = await this.authCommandService.completeSignUp(CompleteSignUpRequestSchema.parse(body), claims);

        return CompleteSignUpResponseSchema.parse(response);
    }

    @Get("me")
    @UseGuards(SessionUserGuard)
    async me(@CurrentAuth() claims: AuthClaims): Promise<User> {
        const user = await this.authQueryService.findUserRecord(claims);

        return UserSchema.parse(user);
    }

    @Patch("me")
    @UseGuards(ActiveAccountGuard)
    async updateMe(@Body() body: unknown, @CurrentAuth() claims: AuthClaims) {
        const response = await this.authCommandService.updateCurrentUser(
            UpdateCurrentUserRequestSchema.parse(body),
            claims
        );

        return UpdateCurrentUserResponseSchema.parse(response);
    }
}
