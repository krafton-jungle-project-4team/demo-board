import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { map } from "rxjs";
import { getRequestId, type ApiRequest, type ApiResponse, type ApiSuccessResponse } from "./api-response";
import { SKIP_API_RESPONSE_KEY } from "./skip-api-response.decorator";

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
    constructor(private readonly reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler) {
        const skipApiResponse = this.reflector.getAllAndOverride<boolean>(SKIP_API_RESPONSE_KEY, [
            context.getHandler(),
            context.getClass()
        ]);

        if (skipApiResponse) {
            return next.handle();
        }

        const http = context.switchToHttp();
        const request = http.getRequest<ApiRequest>();
        const response = http.getResponse<ApiResponse>();
        const requestId = getRequestId(request, response);

        return next.handle().pipe(map((data): ApiSuccessResponse<unknown> => ({ requestId, data })));
    }
}
