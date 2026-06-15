import { EstateTransactionListQuerySchema, type EstateTransactionListResponse } from "@nmm/shared";
import { Controller, Get, Query } from "@nestjs/common";
import { EstateQueryService } from "../service/estate-query.service";

@Controller("estate")
export class EstateController {
    constructor(private readonly estateQueryService: EstateQueryService) {}

    @Get("transactions")
    getTransactions(@Query() query: unknown): Promise<EstateTransactionListResponse> {
        const estateTransactionListQuery = EstateTransactionListQuerySchema.parse(query);

        return this.estateQueryService.getTransactions(estateTransactionListQuery);
    }
}
