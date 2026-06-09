import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthQueryService } from "../service/auth-query.service";
import { type AuthenticatedRequest, toAuthRequestContext } from "./auth-request";

@Injectable()
export class ActiveUserGuard implements CanActivate {
    constructor(private readonly authQueryService: AuthQueryService) {}

    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

        request.currentUser = await this.authQueryService.requireActiveUserRecord(toAuthRequestContext(request));

        return true;
    }
}
