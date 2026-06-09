import { ArgumentsHost, Catch, HttpException, HttpStatus, type ExceptionFilter } from "@nestjs/common";
import { DomainError } from "../domain";
import { getRequestId, type ApiErrorResponse, type ApiRequest, type ApiResponse } from "./api-response";

export type HttpDomainError = {
    statusCode: number;
    code: string;
    message: string;
};

export type DomainErrorHttpMapper = (error: DomainError) => HttpDomainError | undefined;

type WritableApiResponse = ApiResponse & {
    headersSent?: boolean;
    status(statusCode: number): WritableApiResponse;
    json(body: ApiErrorResponse): void;
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
    constructor(private readonly mapDomainError: DomainErrorHttpMapper) {}

    catch(exception: unknown, host: ArgumentsHost) {
        const http = host.switchToHttp();
        const request = http.getRequest<ApiRequest>();
        const response = http.getResponse<WritableApiResponse>();

        if (response.headersSent) {
            return;
        }

        const requestId = getRequestId(request, response);
        const error = this.toHttpError(exception);

        response.status(error.statusCode).json({
            requestId,
            error: {
                code: error.code,
                message: error.message
            }
        });
    }

    private toHttpError(exception: unknown): HttpDomainError {
        if (exception instanceof DomainError) {
            return (
                this.mapDomainError(exception) ?? {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    code: "UNKNOWN_DOMAIN_ERROR",
                    message: exception.message
                }
            );
        }

        if (this.isValidationError(exception)) {
            return {
                statusCode: HttpStatus.BAD_REQUEST,
                code: "VALIDATION_ERROR",
                message: "요청 형식이 올바르지 않습니다."
            };
        }

        if (exception instanceof HttpException) {
            return {
                statusCode: exception.getStatus(),
                code: "HTTP_ERROR",
                message: this.readHttpExceptionMessage(exception)
            };
        }

        return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            code: "INTERNAL_SERVER_ERROR",
            message: "서버 오류가 발생했습니다."
        };
    }

    private isValidationError(exception: unknown) {
        return exception instanceof Error && exception.name === "ZodError";
    }

    private readHttpExceptionMessage(exception: HttpException) {
        const response = exception.getResponse();

        if (typeof response === "string") {
            return response;
        }

        if (response && typeof response === "object" && "message" in response) {
            const message = (response as { message?: unknown }).message;

            if (typeof message === "string") {
                return message;
            }

            if (Array.isArray(message) && typeof message[0] === "string") {
                return message[0];
            }
        }

        return exception.message || "요청을 처리할 수 없습니다.";
    }
}
