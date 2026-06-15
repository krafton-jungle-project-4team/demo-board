import { Controller, Get, Param, Query } from "@nestjs/common";
import {
    EstateNearbyTransportQuerySchema,
    EstatePropertyListQuerySchema,
    EstatePropertyParamsSchema,
    EstateWalkTimeToTransportQuerySchema,
    type EstateNearbyTransportResponse,
    type EstatePropertyListResponse,
    type EstatePropertySummaryResponse,
    type EstateWalkTimeToTransportResponse
} from "@nmm/shared";
import { EstateAccessibilityService } from "../service/estate-accessibility.service";

@Controller("estate/properties")
export class EstateAccessibilityController {
    constructor(private readonly estateAccessibilityService: EstateAccessibilityService) {}

    @Get()
    getPropertyList(@Query() query: unknown): Promise<EstatePropertyListResponse> {
        const request = EstatePropertyListQuerySchema.parse(query);

        return this.estateAccessibilityService.getPropertyList(request);
    }

    @Get(":propertyId")
    getPropertyDetail(@Param() params: unknown): Promise<EstatePropertySummaryResponse> {
        const { propertyId } = EstatePropertyParamsSchema.parse(params);

        return this.estateAccessibilityService.getPropertyDetail(propertyId);
    }

    @Get(":propertyId/nearby-transport")
    getNearbyTransport(@Param() params: unknown, @Query() query: unknown): Promise<EstateNearbyTransportResponse> {
        const { propertyId } = EstatePropertyParamsSchema.parse(params);
        const request = EstateNearbyTransportQuerySchema.parse(query);

        return this.estateAccessibilityService.getNearbyTransport(propertyId, request);
    }

    @Get(":propertyId/walk-time-to-transport")
    getWalkTimeToTransport(
        @Param() params: unknown,
        @Query() query: unknown
    ): Promise<EstateWalkTimeToTransportResponse> {
        const { propertyId } = EstatePropertyParamsSchema.parse(params);
        const request = EstateWalkTimeToTransportQuerySchema.parse(query);

        return this.estateAccessibilityService.getWalkTimeToTransport(propertyId, request);
    }
}
