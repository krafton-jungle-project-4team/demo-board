import { applyDecorators } from "@nestjs/common";
import {
    ApiBadGatewayResponse,
    ApiBadRequestResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiUnauthorizedResponse
} from "@nestjs/swagger";
import { apiErrorResponseSchema } from "./openapi-schema";

export function ApiStandardErrorResponses() {
    return applyDecorators(
        ApiBadRequestResponse({ schema: apiErrorResponseSchema }),
        ApiUnauthorizedResponse({ schema: apiErrorResponseSchema }),
        ApiForbiddenResponse({ schema: apiErrorResponseSchema }),
        ApiNotFoundResponse({ schema: apiErrorResponseSchema }),
        ApiBadGatewayResponse({ schema: apiErrorResponseSchema }),
        ApiInternalServerErrorResponse({ schema: apiErrorResponseSchema })
    );
}
