import { Body, Controller, Get, Param, Post } from "@nestjs/common";
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

    @Post("transactions/search")
    searchTransactions(@Body() body: unknown): Promise<EstateTransactionSearchResponse> {
        const request = EstateTransactionSearchRequestSchema.parse(body);

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

    @Post("market-summary")
    summarizeMarket(@Body() body: unknown): Promise<EstateMarketSummaryResponse> {
        const request = EstateMarketSummaryRequestSchema.parse(body);

        return this.estateAiQueryService.summarizeMarket(request);
    }
}
