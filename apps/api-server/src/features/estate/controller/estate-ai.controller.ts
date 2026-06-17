import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import {
    EstateAgentChatRequestSchema,
    EstateMarketSummaryRequestSchema,
    EstateSimilarTransactionRequestSchema,
    type EstateAgentChatResponse,
    type EstateMarketSummaryResponse,
    type EstateSimilarTransactionResponse
} from "@nmm/shared";
import { EstateAgentService } from "../service/estate-agent.service";
import { EstateAiQueryService } from "../service/estate-ai-query.service";

@Controller("estate/ai")
export class EstateAiController {
    constructor(
        private readonly estateAgentService: EstateAgentService,
        private readonly estateAiQueryService: EstateAiQueryService
    ) {}

    @Post("agent/chat")
    chatWithAgent(@Body() body: unknown): Promise<EstateAgentChatResponse> {
        const request = EstateAgentChatRequestSchema.parse(body);

        return this.estateAgentService.chat(request);
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
