import type { IncomingMessage, ServerResponse } from "node:http";
import { All, Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import type { CurrentUserResponse } from "@nmm/shared";
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

    @SkipApiResponse()
    @All(["", "*path"])
    handleAuth(@Req() request: IncomingMessage, @Res() response: ServerResponse): Promise<void> {
        return this.authService.handle(request, response);
    }
}
