import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from "@nestjs/common";
import { CompleteSignUpRequestSchema, UpdateCurrentUserRequestSchema, type User } from "@nmm/shared";
import type { ActiveUser, UserRecord } from "../domain";
import { AuthCommandService } from "../service/auth-command.service";
import { ActiveUserGuard } from "./active-user.guard";
import { CurrentUser } from "./current-user.decorator";
import { SessionUserGuard } from "./session-user.guard";

@Controller("account")
export class AuthController {
    constructor(private readonly authCommandService: AuthCommandService) {}

    @Post("signup/complete")
    @HttpCode(200)
    @UseGuards(SessionUserGuard)
    async completeSignUp(@Body() body: unknown, @CurrentUser() user: UserRecord) {
        return this.authCommandService.completeSignUp(CompleteSignUpRequestSchema.parse(body), user);
    }

    @Get("me")
    @UseGuards(SessionUserGuard)
    async me(@CurrentUser() user: UserRecord): Promise<User> {
        return user;
    }

    @Patch("me")
    @UseGuards(ActiveUserGuard)
    async updateMe(@Body() body: unknown, @CurrentUser() user: ActiveUser) {
        return this.authCommandService.updateCurrentUser(UpdateCurrentUserRequestSchema.parse(body), user);
    }
}
