import {
    EstateTransactionParamsSchema,
    EstateTransactionListQuerySchema,
    type EstateLegalDongListResponse,
    type EstateTransactionResponse,
    type EstateTransactionListResponse
} from "@nmm/shared";
import { Controller, Get, Param, Query } from "@nestjs/common";
import { EstateQueryService } from "../service/estate-query.service";

@Controller("estate")
export class EstateController {
    constructor(private readonly estateQueryService: EstateQueryService) {}

    @Get("transactions")
    getTransactions(@Query() query: unknown): Promise<EstateTransactionListResponse> {
        const estateTransactionListQuery = EstateTransactionListQuerySchema.parse(query);

        return this.estateQueryService.getTransactions(estateTransactionListQuery);
    }

    @Get("transactions/:transactionId")
    getTransaction(@Param() params: unknown): Promise<EstateTransactionResponse> {
        const { transactionId } = EstateTransactionParamsSchema.parse(params);

        return this.estateQueryService.getTransaction(transactionId);
    }

    @Get("legal-dongs")
    getLegalDongs(): Promise<EstateLegalDongListResponse> {
        return this.estateQueryService.getLegalDongNames();
    }
}
