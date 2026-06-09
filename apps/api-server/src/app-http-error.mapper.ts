import type { DomainError } from "./common/domain";
import type { HttpDomainError } from "./common/http";
import { toAuthHttpError } from "./features/auth/controller/auth-http-error.mapper";
import { toBoardHttpError } from "./features/board/controller/board-http-error.mapper";

export function mapDomainErrorToHttp(error: DomainError): HttpDomainError | undefined {
    return toAuthHttpError(error) ?? toBoardHttpError(error);
}
