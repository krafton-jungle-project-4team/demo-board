import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { EstateTransactionListQuerySchema } from "@nmm/shared";
import { getEstateLegalDongs, getEstateTransactions } from "../api/estate-api.js";
import { createToolErrorResult, createToolSuccessResult } from "./tool-result.js";
import { createLegalDongListOutput, formatLegalDongList, formatTransactionList } from "./estate-formatters.js";
import { EstateListLegalDongsToolInputSchema, EstateSearchTransactionsToolInputSchema } from "./estate-tool-schemas.js";

const READ_ONLY_TOOL_ANNOTATIONS = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false
} as const;

export function registerEstateTools(server: McpServer) {
    registerSearchTransactionsTool(server);
    registerListLegalDongsTool(server);
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

function toStructuredContent<TValue extends object>(value: TValue) {
    return value as Record<string, unknown>;
}
