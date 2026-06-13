import type { IncomingMessage, ServerResponse } from "node:http";
import { All, Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import type { CurrentUserResponse } from "@nmm/shared";
import { SkipApiResponse } from "../../../infra/http";
import { AuthUser } from "../decorator/auth-user.decorator";
import { AuthGuard } from "../guard/auth.guard";
import { AuthService } from "../service/auth.service";

@Controller()
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @SkipApiResponse()
    @All(["auth", "auth/*path"])
    handleAuth(@Req() request: IncomingMessage, @Res() response: ServerResponse): Promise<void> {
        return this.authService.handle(request, response);
    }

    @Get("me")
    @UseGuards(AuthGuard)
    getMe(@AuthUser() authUser: CurrentUserResponse): CurrentUserResponse {
        return authUser;
    }
}
