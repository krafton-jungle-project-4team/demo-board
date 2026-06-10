import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { AuthQueryService } from "../service/auth-query.service";
import { type AuthenticatedRequest, toAuthRequestContext } from "./auth-request";

@Injectable()
export class SessionUserGuard implements CanActivate {
    constructor(
        private readonly authQueryService: AuthQueryService,
        private readonly logger: PinoLogger
    ) {}

    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

        request.authClaims = await this.authQueryService.requireAuthClaims({
            ...toAuthRequestContext(request),
            allowPending: true
        });
        this.logger.assign({
            sessionId: request.authClaims.sessionId,
            userId: request.authClaims.userId
        });

        return true;
    }
}
