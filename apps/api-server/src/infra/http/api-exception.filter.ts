import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger, type ExceptionFilter } from "@nestjs/common";
import { DomainError } from "../../app-errors";
import { getRequestId, type ApiErrorResponse, type ApiRequest, type ApiResponse } from "./api-response";

type HttpApiError = {
    statusCode: number;
    code: string;
    message: string;
};

type WritableApiResponse = ApiResponse & {
    headersSent?: boolean;
    status(statusCode: number): WritableApiResponse;
    json(body: ApiErrorResponse): void;
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(ApiExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const http = host.switchToHttp();
        const request = http.getRequest<ApiRequest>();
        const response = http.getResponse<WritableApiResponse>();

        if (response.headersSent) {
            return;
        }

        const requestId = getRequestId(request, response);
        const error = this.toHttpError(exception);

        if (error.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `Unhandled exception for request ${requestId}`,
                exception instanceof Error ? exception.stack : String(exception)
            );
        }

        response.status(error.statusCode).json({
            requestId,
            error: {
                code: error.code,
                message: error.message
            }
        });
    }

    private toHttpError(exception: unknown): HttpApiError {
        if (exception instanceof DomainError) {
            return {
                statusCode: exception.statusCode,
                code: exception.code,
                message: exception.message
            };
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
