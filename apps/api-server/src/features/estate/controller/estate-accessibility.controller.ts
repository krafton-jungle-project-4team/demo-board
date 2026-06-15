import {
    EstateNearbyTransportQuerySchema,
    EstatePropertyListQuerySchema,
    EstatePropertyParamsSchema,
    EstateTransactionParamsSchema,
    EstateWalkTimeToTransportQuerySchema,
    type EstateNearbyTransportResponse,
    type EstatePropertyListResponse,
    type EstatePropertySummaryResponse,
    type EstateWalkTimeToTransportResponse
} from "@nmm/shared";
import { Controller, Get, Param, Query } from "@nestjs/common";
import { EstateAccessibilityService } from "../service/estate-accessibility.service";

@Controller("estate")
export class EstateAccessibilityController {
    constructor(private readonly estateAccessibilityService: EstateAccessibilityService) {}

    @Get("properties")
    getProperties(@Query() query: unknown): Promise<EstatePropertyListResponse> {
        const estatePropertyListQuery = EstatePropertyListQuerySchema.parse(query);

        return this.estateAccessibilityService.getPropertyList(estatePropertyListQuery);
    }

    @Get("properties/:propertyId")
    getProperty(@Param() params: unknown): Promise<EstatePropertySummaryResponse> {
        const { propertyId } = EstatePropertyParamsSchema.parse(params);

        return this.estateAccessibilityService.getPropertyDetail(propertyId);
    }

    @Get("properties/:propertyId/nearby-transport")
    getNearbyTransportByProperty(
        @Param() params: unknown,
        @Query() query: unknown
    ): Promise<EstateNearbyTransportResponse> {
        const { propertyId } = EstatePropertyParamsSchema.parse(params);
        const nearbyTransportQuery = EstateNearbyTransportQuerySchema.parse(query);

        return this.estateAccessibilityService.getNearbyTransportByProperty(propertyId, nearbyTransportQuery);
    }

    @Get("properties/:propertyId/walk-time-to-transport")
    getWalkTimeToTransportByProperty(
        @Param() params: unknown,
        @Query() query: unknown
    ): Promise<EstateWalkTimeToTransportResponse> {
        const { propertyId } = EstatePropertyParamsSchema.parse(params);
        const walkTimeToTransportQuery = EstateWalkTimeToTransportQuerySchema.parse(query);

        return this.estateAccessibilityService.getWalkTimeToTransportByProperty(propertyId, walkTimeToTransportQuery);
    }

    @Get("transactions/:transactionId/nearby-transport")
    getNearbyTransportByTransaction(
        @Param() params: unknown,
        @Query() query: unknown
    ): Promise<EstateNearbyTransportResponse> {
        const { transactionId } = EstateTransactionParamsSchema.parse(params);
        const nearbyTransportQuery = EstateNearbyTransportQuerySchema.parse(query);

        return this.estateAccessibilityService.getNearbyTransportByTransaction(transactionId, nearbyTransportQuery);
    }

    @Get("transactions/:transactionId/walk-time-to-transport")
    getWalkTimeToTransportByTransaction(
        @Param() params: unknown,
        @Query() query: unknown
    ): Promise<EstateWalkTimeToTransportResponse> {
        const { transactionId } = EstateTransactionParamsSchema.parse(params);
        const walkTimeToTransportQuery = EstateWalkTimeToTransportQuerySchema.parse(query);

        return this.estateAccessibilityService.getWalkTimeToTransportByTransaction(
            transactionId,
            walkTimeToTransportQuery
        );
    }
}
