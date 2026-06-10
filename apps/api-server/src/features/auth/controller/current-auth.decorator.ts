import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import { appErrors } from "../../../app-errors";
import type { AuthenticatedRequest } from "./auth-request";

export const CurrentAuth = createParamDecorator((_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.authClaims) {
        throw appErrors.authSessionRequired();
    }

    return request.authClaims;
});
