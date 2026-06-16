import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
    EstateMarketSummaryRequestSchema,
    EstateSimilarTransactionRequestSchema,
    EstateTransactionListQuerySchema,
    EstateTransactionParamsSchema
} from "@nmm/shared";
import {
    findSimilarEstateTransactions,
    getEstateLegalDongs,
    getEstateTransaction,
    getEstateTransactions,
    summarizeEstateMarket
} from "../api/estate-api.js";
import { createToolErrorResult, createToolSuccessResult } from "./tool-result.js";
import {
    createLegalDongListOutput,
    formatLegalDongList,
    formatMarketSummary,
    formatSimilarTransactions,
    formatTransactionDetail,
    formatTransactionList
} from "./estate-formatters.js";
import {
    EstateFindSimilarTransactionsToolInputSchema,
    EstateGetTransactionToolInputSchema,
    EstateListLegalDongsToolInputSchema,
    EstateSearchTransactionsToolInputSchema,
    EstateSummarizeMarketToolInputSchema
} from "./estate-tool-schemas.js";

const READ_ONLY_TOOL_ANNOTATIONS = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
} as const;

export function registerEstateTools(server: McpServer) {
    registerSearchTransactionsTool(server);
    registerListLegalDongsTool(server);
    registerGetTransactionTool(server);
    registerFindSimilarTransactionsTool(server);
    registerSummarizeMarketTool(server);
}

function registerSearchTransactionsTool(server: McpServer) {
    server.registerTool(
        "estate_search_transactions",
        {
            title: "Search Estate Transactions",
            description:
                "실거래 목록을 검색합니다. page, pageSize, q, legalDongName을 받아 API 서버의 GET /api/estate/transactions를 호출합니다. DB를 직접 읽지 않습니다.",
            inputSchema: EstateSearchTransactionsToolInputSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS
        },
        async (input) => {
            try {
                const query = EstateTransactionListQuerySchema.parse(input);
                const response = await getEstateTransactions(query);

                return createToolSuccessResult(formatTransactionList(response), toStructuredContent(response));
            } catch (error) {
                return createToolErrorResult(error);
            }
        }
    );
}

function registerListLegalDongsTool(server: McpServer) {
    server.registerTool(
        "estate_list_legal_dongs",
        {
            title: "List Estate Legal Dongs",
            description:
                "실거래 데이터에 존재하는 법정동 후보를 조회합니다. API 서버의 GET /api/estate/legal-dongs를 호출한 뒤 q, limit, offset을 MCP 서버에서 적용합니다.",
            inputSchema: EstateListLegalDongsToolInputSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS
        },
        async (input) => {
            try {
                const legalDongs = await getEstateLegalDongs();
                const filteredLegalDongs = input.q
                    ? legalDongs.filter((legalDong) => legalDong.includes(input.q ?? ""))
                    : legalDongs;
                const output = createLegalDongListOutput(filteredLegalDongs, input.limit, input.offset);

                return createToolSuccessResult(formatLegalDongList(output), toStructuredContent(output));
            } catch (error) {
                return createToolErrorResult(error);
            }
        }
    );
}

function registerGetTransactionTool(server: McpServer) {
    server.registerTool(
        "estate_get_transaction",
        {
            title: "Get Estate Transaction",
            description:
                "실거래 ID로 단건 상세를 조회합니다. API 서버의 GET /api/estate/transactions/:transactionId를 호출합니다. DB를 직접 읽지 않습니다.",
            inputSchema: EstateGetTransactionToolInputSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS
        },
        async (input) => {
            try {
                const { transactionId } = EstateTransactionParamsSchema.parse(input);
                const response = await getEstateTransaction(transactionId);

                return createToolSuccessResult(formatTransactionDetail(response), toStructuredContent(response));
            } catch (error) {
                return createToolErrorResult(error);
            }
        }
    );
}

function registerFindSimilarTransactionsTool(server: McpServer) {
    server.registerTool(
        "estate_find_similar_transactions",
        {
            title: "Find Similar Estate Transactions",
            description:
                "RAG 기반으로 유사 실거래를 찾습니다. referenceTransactionId 또는 queryText 중 정확히 하나를 받고, API 서버의 POST /api/estate/ai/transactions/similar를 호출합니다.",
            inputSchema: EstateFindSimilarTransactionsToolInputSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS
        },
        async (input) => {
            try {
                const request = EstateSimilarTransactionRequestSchema.parse(input);
                const response = await findSimilarEstateTransactions(request);

                return createToolSuccessResult(formatSimilarTransactions(response), toStructuredContent(response));
            } catch (error) {
                return createToolErrorResult(error);
            }
        }
    );
}

function registerSummarizeMarketTool(server: McpServer) {
    server.registerTool(
        "estate_summarize_market",
        {
            title: "Summarize Estate Market",
            description:
                "조건에 맞는 실거래의 거래 수, 최근 거래일, 가격/면적 집계를 요약합니다. API 서버의 GET /api/estate/ai/market-summary를 호출합니다.",
            inputSchema: EstateSummarizeMarketToolInputSchema,
            annotations: READ_ONLY_TOOL_ANNOTATIONS
        },
        async (input) => {
            try {
                const query = EstateMarketSummaryRequestSchema.parse(input);
                const response = await summarizeEstateMarket(query);

                return createToolSuccessResult(formatMarketSummary(response), toStructuredContent(response));
            } catch (error) {
                return createToolErrorResult(error);
            }
        }
    );
}

function toStructuredContent<TValue extends object>(value: TValue) {
    return value as Record<string, unknown>;
}
