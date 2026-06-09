import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from "@nestjs/common";
import { map } from "rxjs";
import { getRequestId, type ApiRequest, type ApiResponse, type ApiSuccessResponse } from "./api-response";

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
        const http = context.switchToHttp();
        const request = http.getRequest<ApiRequest>();
        const response = http.getResponse<ApiResponse>();
        const requestId = getRequestId(request, response);

        return next.handle().pipe(map((data): ApiSuccessResponse<unknown> => ({ requestId, data })));
    }
}
