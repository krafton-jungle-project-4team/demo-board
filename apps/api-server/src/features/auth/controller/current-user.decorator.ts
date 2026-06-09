import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import { authErrors } from "../domain";
import type { AuthenticatedRequest } from "./auth-request";

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.currentUser) {
        throw authErrors.sessionRequired();
    }

    return request.currentUser;
});
