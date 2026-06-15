import type { IncomingMessage, ServerResponse } from "node:http";
import { All, Body, Controller, Get, Patch, Req, Res, UseGuards } from "@nestjs/common";
import {
    UpdateResidenceDongRequestSchema,
    type CurrentUserResponse,
    type UpdateResidenceDongRequest
} from "@nmm/shared";
import { SkipApiResponse } from "../../../infra/http";
import { AuthUser } from "../decorator/auth-user.decorator";
import { AuthGuard } from "../guard/auth.guard";
import { AuthService } from "../service/auth.service";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Get("me")
    @UseGuards(AuthGuard)
    getMe(@AuthUser() authUser: CurrentUserResponse): CurrentUserResponse {
        return authUser;
    }

    @Patch("me/residence-dong")
    @UseGuards(AuthGuard)
    updateResidenceDong(
        @AuthUser() authUser: CurrentUserResponse,
        @Body() body: unknown
    ): Promise<CurrentUserResponse> {
        const request: UpdateResidenceDongRequest = UpdateResidenceDongRequestSchema.parse(body);

        return this.authService.updateResidenceDong(authUser, request);
    }

    @SkipApiResponse()
    @All(["", "*path"])
    handleAuth(@Req() request: IncomingMessage, @Res() response: ServerResponse): Promise<void> {
        return this.authService.handle(request, response);
    }
}
