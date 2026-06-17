import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import {
    EstateAgentRequestSchema,
    EstateMarketSummaryRequestSchema,
    EstateSimilarTransactionRequestSchema,
    type EstateAgentResponse,
    type EstateMarketSummaryResponse,
    type EstateSimilarTransactionResponse
} from "@nmm/shared";
import { EstateAgentService } from "../service/estate-agent.service";
import { EstateAiQueryService } from "../service/estate-ai-query.service";

@Controller("estate/ai")
export class EstateAiController {
    constructor(
        private readonly estateAiQueryService: EstateAiQueryService,
        private readonly estateAgentService: EstateAgentService
    ) {}

    @Post("agent")
    runAgent(@Body() body: unknown): Promise<EstateAgentResponse> {
        const request = EstateAgentRequestSchema.parse(body);

        return this.estateAgentService.run(request);
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
