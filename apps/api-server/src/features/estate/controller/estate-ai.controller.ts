import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import {
    EstateMarketSummaryRequestSchema,
    EstateSimilarTransactionRequestSchema,
    EstateTransactionParamsSchema,
    EstateTransactionSearchRequestSchema,
    type EstateMarketSummaryResponse,
    type EstateSimilarTransactionResponse,
    type EstateTransactionResponse,
    type EstateTransactionSearchResponse
} from "@nmm/shared";
import { EstateAiQueryService } from "../service/estate-ai-query.service";

@Controller("estate/ai")
export class EstateAiController {
    constructor(private readonly estateAiQueryService: EstateAiQueryService) {}

    @Get("transactions")
    searchTransactions(@Query() query: unknown): Promise<EstateTransactionSearchResponse> {
        const request = EstateTransactionSearchRequestSchema.parse(query);

        return this.estateAiQueryService.searchTransactions(request);
    }

    @Get("transactions/:transactionId")
    getTransaction(@Param() params: unknown): Promise<EstateTransactionResponse> {
        const { transactionId } = EstateTransactionParamsSchema.parse(params);

        return this.estateAiQueryService.getTransaction(transactionId);
    }

    @Post("transactions/similar")
    findSimilarTransactions(@Body() body: unknown): Promise<EstateSimilarTransactionResponse> {
        const request = EstateSimilarTransactionRequestSchema.parse(body);

        return this.estateAiQueryService.findSimilarTransactions(request);
    }

    @Get("market-summary")
    summarizeMarket(@Query() query: unknown): Promise<EstateMarketSummaryResponse> {
        const request = EstateMarketSummaryRequestSchema.parse(query);

        return this.estateAiQueryService.summarizeMarket(request);
    }
}
