import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { createDomainError } from "../../../app-errors";
import type { ApiRequest } from "../../../infra/http";
import { AUTH_ERRORS } from "../auth-errors";
import type { AuthenticatedRequest } from "../auth.types";
import { AuthService } from "../service/auth.service";

type AuthRequest = ApiRequest & AuthenticatedRequest;

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly authService: AuthService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthRequest>();
        const authUser = await this.authService.findCurrentUser(request.headers ?? {});

        if (!authUser) {
            throw createDomainError(AUTH_ERRORS.UNAUTHORIZED);
        }

        request.authUser = authUser;

        return true;
    }
}
