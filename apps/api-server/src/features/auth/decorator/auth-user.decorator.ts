import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthUser as AuthUserPayload } from "@nmm/shared";
import type { AuthenticatedRequest } from "../auth.types";

export const AuthUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthUserPayload => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.authUser) {
        throw new Error("Auth user is missing. Use AuthGuard before AuthUser.");
    }

    return request.authUser;
});
