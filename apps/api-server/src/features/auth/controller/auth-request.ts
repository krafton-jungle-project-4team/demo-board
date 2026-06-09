import type { ApiRequest } from "../../../common/infra/http";
import type { UserRecord } from "../domain";
import type { AuthRequestContext } from "../service/auth-query.service";

type HttpHeaderValue = string | string[] | undefined;

export type AuthenticatedRequest = ApiRequest & {
    currentUser?: UserRecord;
};

export function toAuthRequestContext(request: AuthenticatedRequest): AuthRequestContext {
    return {
        authorization: readHeader(request.headers?.authorization),
        cookieHeader: readHeader(request.headers?.cookie)
    };
}

function readHeader(value: HttpHeaderValue) {
    const firstValue = Array.isArray(value) ? value[0] : value;
    const trimmedValue = firstValue?.trim();

    return trimmedValue && trimmedValue.length > 0 ? trimmedValue : undefined;
}
