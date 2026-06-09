import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import { authErrors } from "../domain";
import type { AuthenticatedRequest } from "./auth-request";

export const CurrentAuth = createParamDecorator((_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.authClaims) {
        throw authErrors.sessionRequired();
    }

    return request.authClaims;
});
