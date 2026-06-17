import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import {
    EstateAgentChatResponseSchema,
    type EstateAgentChatRequest,
    type EstateAgentChatResponse,
    type EstateAgentToolCall,
    type EstateSimilarTransactionItem,
    type EstateTransactionResponse
} from "@nmm/shared";
import { DataSource } from "typeorm";
import { serverEnv } from "../../../infra/env";
import { ESTATE_ERRORS, createEstateError } from "../estate.errors";
import { EstateAiQueryService } from "./estate-ai-query.service";

const ESTATE_AGENT_MAX_STEPS = 3;
const ESTATE_AGENT_RECOMMENDATION_LIMIT = 5;
const ESTATE_AGENT_MAX_RECOMMENDATION_LIMIT = 10;
const MAX_ESTATE_AGENT_SESSIONS = 100;
const SQUARE_METERS_PER_PYEONG = 3.305785;

const ESTATE_AGENT_INSTRUCTIONS = [
    "당신은 부동산 실거래 추천 AI agent입니다.",
    "사용자의 요청을 보고 필요한 도구를 스스로 선택하고 실행하세요.",
    "새 매물 추천 요청은 search_similar_transactions를 사용하세요.",
    "사용자가 원하는 추천 개수를 말하면 search_similar_transactions의 limit으로 전달하세요.",
    "최근/최신 거래 요청은 search_similar_transactions의 sortBy를 recent로 전달하세요.",
    "가장 비싼/최고가 거래 요청은 search_similar_transactions의 sortBy를 dealAmountDesc로 전달하세요. 사용자가 개수를 말하지 않으면 limit은 1입니다.",
    "가장 싼/최저가 거래 요청은 search_similar_transactions의 sortBy를 dealAmountAsc로 전달하세요. 사용자가 개수를 말하지 않으면 limit은 1입니다.",
    "search_similar_transactions 결과는 원본 후보입니다.",
    "층, 가격, 면적처럼 원본 후보를 검토한 뒤 제외할 수 있는 조건이 있으면 search_similar_transactions의 limit을 최종 필요 개수보다 여유 있게 전달하세요.",
    "검색 결과 중 최종 화면에 보여줄 후보를 정했다면 최종 답변 전에 반드시 select_recommendations를 호출하세요.",
    "조건에 맞지 않는 후보를 답변에서 제외할 때는 select_recommendations에서도 제외하세요.",
    "select_recommendations의 ranks는 직전 search_similar_transactions 결과의 원래 번호입니다.",
    "법정동, 가격, 면적, 최신, 최고가, 최저가처럼 새 조건이 포함된 요청은 세션 후보만 보지 말고 새로 검색하세요.",
    "최근 추천 후보의 N번 상세/이동/페이지 요청은 get_transaction_detail을 사용하세요.",
    "최근 추천 후보의 추천 이유 요청은 explain_recommendation을 사용하세요.",
    "최근 추천 후보 두 개의 비교 요청은 compare_recommendations를 사용하세요.",
    "최근 추천 후보가 필요한데 세션에 후보가 없으면 먼저 검색 조건을 입력해 달라고 답하세요.",
    "도구 없이 답할 수 있는 간단한 안내는 도구를 호출하지 말고 바로 답하세요.",
    "최종 답변은 한국어로 짧고 구체적으로 작성하세요."
].join("\n");

const ESTATE_AGENT_TOOLS: OpenAiToolDefinition[] = [
    {
        type: "function",
        name: "search_similar_transactions",
        description: "사용자의 자연어 조건으로 부동산 실거래 추천 후보를 찾습니다.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                queryText: {
                    type: "string",
                    description: "사용자가 입력한 검색 조건 문장입니다."
                },
                limit: {
                    type: ["integer", "null"],
                    minimum: 1,
                    maximum: ESTATE_AGENT_MAX_RECOMMENDATION_LIMIT,
                    description:
                        "검색할 원본 후보 개수입니다. 사용자가 원하는 개수가 있으면 기본으로 그 개수를 쓰되, 조건 검토 후 제외할 수 있으면 최대 10까지 여유 있게 요청하세요. 개수 조건이 없으면 null입니다."
                },
                sortBy: {
                    type: ["string", "null"],
                    enum: ["similarity", "recent", "dealAmountDesc", "dealAmountAsc", null],
                    description:
                        "최근/최신 거래 요청이면 recent, 가장 비싼/최고가 요청이면 dealAmountDesc, 가장 싼/최저가 요청이면 dealAmountAsc, 그 외에는 similarity입니다."
                }
            },
            required: ["queryText", "limit", "sortBy"],
            additionalProperties: false
        }
    },
    {
        type: "function",
        name: "select_recommendations",
        description:
            "직전 검색 결과 중 최종 답변과 화면에 보여줄 추천 후보를 선택합니다. 검색 결과를 검토해 조건에 맞지 않는 후보를 제외하거나 순서를 조정할 때 사용합니다.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                ranks: {
                    type: "array",
                    items: {
                        type: "integer",
                        minimum: 1
                    },
                    description:
                        "직전 search_similar_transactions 결과의 1부터 시작하는 원래 번호 목록입니다. 이 순서대로 화면에 표시합니다."
                },
                reason: {
                    type: ["string", "null"],
                    description: "선택/제외 이유입니다. 필요 없으면 null입니다."
                }
            },
            required: ["ranks", "reason"],
            additionalProperties: false
        }
    },
    {
        type: "function",
        name: "get_transaction_detail",
        description:
            "실거래 상세를 조회합니다. 최근 추천 후보의 순번으로 이동/상세 요청을 받으면 rank를 사용하고, 실거래 ID를 알면 transactionId를 사용합니다.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                rank: {
                    type: ["integer", "null"],
                    description: "최근 추천 후보의 1부터 시작하는 순번입니다. 순번 요청이 아니면 null입니다."
                },
                transactionId: {
                    type: ["integer", "null"],
                    description: "조회할 실거래 ID입니다. 순번으로 찾는 경우 null입니다."
                }
            },
            required: ["rank", "transactionId"],
            additionalProperties: false
        }
    },
    {
        type: "function",
        name: "explain_recommendation",
        description: "최근 추천 후보 중 N번이 추천된 이유를 설명합니다.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                rank: {
                    type: "integer",
                    description: "최근 추천 후보의 1부터 시작하는 순번입니다."
                }
            },
            required: ["rank"],
            additionalProperties: false
        }
    },
    {
        type: "function",
        name: "compare_recommendations",
        description: "최근 추천 후보 중 두 순번의 실거래를 비교합니다.",
        strict: true,
        parameters: {
            type: "object",
            properties: {
                leftRank: {
                    type: "integer",
                    description: "비교할 첫 번째 추천 후보 순번입니다."
                },
                rightRank: {
                    type: "integer",
                    description: "비교할 두 번째 추천 후보 순번입니다."
                }
            },
            required: ["leftRank", "rightRank"],
            additionalProperties: false
        }
    }
];

type EstateAgentSessionState = {
    lastRecommendations: EstateSimilarTransactionItem[];
    lastUserMessage: string;
    lastToolResult: string;
};

type EstateAgentResponseDraft = {
    toolCalls: EstateAgentToolCall[];
    recommendations?: EstateSimilarTransactionItem[];
    comparedTransactions?: EstateSimilarTransactionItem[];
    targetTransactionId?: number;
};

type EstateAgentToolResult = {
    status: "completed" | "failed";
    message: string;
    output: Record<string, unknown>;
    recommendations?: EstateSimilarTransactionItem[];
    comparedTransactions?: EstateSimilarTransactionItem[];
    targetTransactionId?: number;
};

type OpenAiToolDefinition = {
    type: "function";
    name: string;
    description: string;
    strict: boolean;
    parameters: Record<string, unknown>;
};

type OpenAiResponseInputItem = Record<string, unknown>;

type OpenAiFunctionCall = {
    type: "function_call";
    call_id: string;
    name: string;
    arguments: string;
};

type OpenAiResponseBody = {
    output?: OpenAiResponseInputItem[];
    output_text?: string;
};

type RecommendationSort = "similarity" | "recent" | "dealAmountDesc" | "dealAmountAsc";

@Injectable()
export class EstateAgentService {
    private readonly estateAiQueryService: EstateAiQueryService;
    private readonly sessions = new Map<string, EstateAgentSessionState>();

    constructor(@InjectDataSource() dataSource: DataSource) {
        this.estateAiQueryService = new EstateAiQueryService(dataSource);
    }

    async chat(request: EstateAgentChatRequest): Promise<EstateAgentChatResponse> {
        const sessionId = request.sessionId ?? randomUUID();
        const session = this.getSession(sessionId);
        const draft: EstateAgentResponseDraft = {
            toolCalls: []
        };
        const input: OpenAiResponseInputItem[] = [
            {
                role: "user",
                content: createAgentInputMessage(request.message, session)
            }
        ];

        session.lastUserMessage = request.message;

        for (let step = 0; step < ESTATE_AGENT_MAX_STEPS; step += 1) {
            const response = await this.createModelResponse(input);
            const output = response.output ?? [];
            const functionCalls = output.filter(isOpenAiFunctionCall);

            input.push(...output);

            if (functionCalls.length === 0) {
                const answer = extractResponseText(response);

                return this.toChatResponse(sessionId, draft, answer);
            }

            for (const functionCall of functionCalls) {
                const toolResult = await this.executeTool(functionCall, request.message, session);

                draft.toolCalls.push({
                    name: functionCall.name,
                    arguments: parseToolArguments(functionCall.arguments),
                    status: toolResult.status,
                    message: toolResult.message
                });

                if (toolResult.recommendations) {
                    draft.recommendations = toolResult.recommendations;
                }

                if (toolResult.comparedTransactions) {
                    draft.comparedTransactions = toolResult.comparedTransactions;
                }

                if (toolResult.targetTransactionId) {
                    draft.targetTransactionId = toolResult.targetTransactionId;
                }

                session.lastToolResult = toolResult.message;
                input.push({
                    type: "function_call_output",
                    call_id: functionCall.call_id,
                    output: JSON.stringify(toolResult.output)
                });
            }
        }

        throw createEstateError(ESTATE_ERRORS.AGENT_STEP_LIMIT_EXCEEDED);
    }

    private getSession(sessionId: string): EstateAgentSessionState {
        const existingSession = this.sessions.get(sessionId);

        if (existingSession) {
            return existingSession;
        }

        const session = {
            lastRecommendations: [],
            lastUserMessage: "",
            lastToolResult: ""
        };

        this.sessions.set(sessionId, session);
        this.pruneSessions();

        return session;
    }

    private pruneSessions() {
        if (this.sessions.size <= MAX_ESTATE_AGENT_SESSIONS) {
            return;
        }

        const oldestSessionId = this.sessions.keys().next().value;

        if (typeof oldestSessionId === "string") {
            this.sessions.delete(oldestSessionId);
        }
    }

    private async createModelResponse(input: OpenAiResponseInputItem[]): Promise<OpenAiResponseBody> {
        const config = serverEnv.ai.agent;

        if (!config.openAiApiKey) {
            throw createEstateError(ESTATE_ERRORS.AGENT_API_KEY_MISSING);
        }

        const response = await fetch(`${config.openAiBaseUrl}/responses`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${config.openAiApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: config.model,
                instructions: ESTATE_AGENT_INSTRUCTIONS,
                input,
                tools: ESTATE_AGENT_TOOLS,
                tool_choice: "auto",
                parallel_tool_calls: false,
                max_output_tokens: 900,
                reasoning: {
                    effort: "low"
                },
                text: {
                    verbosity: "low"
                }
            })
        });

        if (!response.ok) {
            throw createEstateError(ESTATE_ERRORS.AGENT_REQUEST_FAILED);
        }

        return (await response.json()) as OpenAiResponseBody;
    }

    private async executeTool(
        functionCall: OpenAiFunctionCall,
        fallbackQueryText: string,
        session: EstateAgentSessionState
    ): Promise<EstateAgentToolResult> {
        const argumentsRecord = parseToolArguments(functionCall.arguments);

        if (functionCall.name === "search_similar_transactions") {
            return this.searchSimilarTransactions(argumentsRecord, fallbackQueryText, session);
        }

        if (functionCall.name === "select_recommendations") {
            return this.selectRecommendations(argumentsRecord, session);
        }

        if (functionCall.name === "get_transaction_detail") {
            return this.getTransactionDetail(argumentsRecord, session);
        }

        if (functionCall.name === "explain_recommendation") {
            return this.explainRecommendation(argumentsRecord, session);
        }

        if (functionCall.name === "compare_recommendations") {
            return this.compareRecommendations(argumentsRecord, session);
        }

        return createFailedToolResult(`지원하지 않는 도구입니다: ${functionCall.name}`);
    }

    private async searchSimilarTransactions(
        argumentsRecord: Record<string, unknown>,
        fallbackQueryText: string,
        session: EstateAgentSessionState
    ): Promise<EstateAgentToolResult> {
        const queryText = readStringArgument(argumentsRecord, "queryText") ?? fallbackQueryText;
        const limit = resolveRecommendationLimit(argumentsRecord);
        const sortBy = resolveRecommendationSort(argumentsRecord);
        const response = await this.estateAiQueryService.findSimilarTransactions({
            queryText,
            filters: {},
            limit,
            sortBy
        });
        const message = formatSimilarTransactions(response.items);

        session.lastRecommendations = response.items;

        return {
            status: "completed",
            message,
            output: {
                type: "recommendations",
                recommendations: response.items,
                sortBy,
                limit,
                message
            }
        };
    }

    private selectRecommendations(
        argumentsRecord: Record<string, unknown>,
        session: EstateAgentSessionState
    ): EstateAgentToolResult {
        if (session.lastRecommendations.length === 0) {
            return createFailedToolResult("선택할 추천 후보가 없습니다. 먼저 원하는 조건으로 매물을 검색해주세요.");
        }

        const ranks = [...new Set(readIntegerListArgument(argumentsRecord, "ranks"))];
        const recommendations = ranks.flatMap((rank) => session.lastRecommendations[rank - 1] ?? []);
        const message =
            recommendations.length === 0
                ? "화면에 표시할 추천 후보가 없습니다."
                : `화면 표시 후보 ${recommendations.length.toLocaleString("ko-KR")}건을 선택했습니다.`;

        session.lastRecommendations = recommendations;

        return {
            status: "completed",
            message,
            recommendations,
            output: {
                type: "selected_recommendations",
                ranks,
                recommendations,
                message
            }
        };
    }

    private async getTransactionDetail(
        argumentsRecord: Record<string, unknown>,
        session: EstateAgentSessionState
    ): Promise<EstateAgentToolResult> {
        const rank = readIntegerArgument(argumentsRecord, "rank");
        const transactionId = readIntegerArgument(argumentsRecord, "transactionId");
        const rankedRecommendation = rank ? session.lastRecommendations[rank - 1] : undefined;
        const resolvedTransactionId = rankedRecommendation?.transaction.id ?? transactionId;

        if (!resolvedTransactionId) {
            return createFailedToolResult("최근 추천 후보가 없습니다. 먼저 원하는 조건으로 매물을 검색해주세요.");
        }

        const transaction = await this.estateAiQueryService.getTransaction(resolvedTransactionId);
        const message = formatTransactionDetail(transaction);

        return {
            status: "completed",
            message,
            output: {
                type: "transaction_detail",
                transaction,
                message
            },
            targetTransactionId: transaction.id
        };
    }

    private explainRecommendation(
        argumentsRecord: Record<string, unknown>,
        session: EstateAgentSessionState
    ): EstateAgentToolResult {
        const rank = readIntegerArgument(argumentsRecord, "rank");
        const recommendation = rank ? session.lastRecommendations[rank - 1] : undefined;

        if (!rank || !recommendation) {
            return createFailedToolResult("해당 순번의 추천 후보가 없습니다. 먼저 추천 후보를 검색해주세요.");
        }

        const message = createRecommendationExplanation(rank, recommendation);

        return {
            status: "completed",
            message,
            recommendations: session.lastRecommendations,
            output: {
                type: "recommendation_explanation",
                rank,
                recommendation,
                message
            }
        };
    }

    private compareRecommendations(
        argumentsRecord: Record<string, unknown>,
        session: EstateAgentSessionState
    ): EstateAgentToolResult {
        const leftRank = readIntegerArgument(argumentsRecord, "leftRank");
        const rightRank = readIntegerArgument(argumentsRecord, "rightRank");
        const leftRecommendation = leftRank ? session.lastRecommendations[leftRank - 1] : undefined;
        const rightRecommendation = rightRank ? session.lastRecommendations[rightRank - 1] : undefined;

        if (!leftRank || !rightRank || !leftRecommendation || !rightRecommendation) {
            return createFailedToolResult("비교할 추천 후보가 없습니다. 먼저 추천 후보를 검색해주세요.");
        }

        const comparedTransactions = [leftRecommendation, rightRecommendation];
        const message = createRecommendationComparison(leftRank, leftRecommendation, rightRank, rightRecommendation);

        return {
            status: "completed",
            message,
            recommendations: session.lastRecommendations,
            output: {
                type: "recommendation_comparison",
                leftRank,
                rightRank,
                comparedTransactions,
                message
            },
            comparedTransactions
        };
    }

    private toChatResponse(
        sessionId: string,
        draft: EstateAgentResponseDraft,
        answer: string
    ): EstateAgentChatResponse {
        return EstateAgentChatResponseSchema.parse({
            sessionId,
            answer,
            toolCalls: draft.toolCalls,
            recommendations: draft.recommendations,
            comparedTransactions: draft.comparedTransactions,
            targetTransactionId: draft.targetTransactionId
        });
    }
}

function createAgentInputMessage(message: string, session: EstateAgentSessionState) {
    return [
        `사용자 메시지: ${message}`,
        "",
        "세션 상태:",
        createSessionSummary(session),
        session.lastToolResult ? `마지막 도구 결과: ${session.lastToolResult}` : "마지막 도구 결과: 없음"
    ].join("\n");
}

function createSessionSummary(session: EstateAgentSessionState) {
    if (session.lastRecommendations.length === 0) {
        return "최근 추천 후보 없음";
    }

    return session.lastRecommendations
        .map((item, index) => {
            const transaction = item.transaction;
            const buildingName = transaction.buildingName ?? "건물명 없음";

            return `${index + 1}번: transactionId=${transaction.id}, ${transaction.legalDongName} ${buildingName}, ${transaction.buildingUse}, ${formatFloor(transaction.floor)}, 계약일 ${transaction.contractDate}, ${formatArea(transaction.buildingAreaSquareMeter)}, ${formatDealAmount(transaction.dealAmount10kKrw)}, 추천도 ${formatScore(item.score)}`;
        })
        .join("\n");
}

function isOpenAiFunctionCall(output: OpenAiResponseInputItem): output is OpenAiFunctionCall {
    return (
        output.type === "function_call" &&
        typeof output.call_id === "string" &&
        typeof output.name === "string" &&
        typeof output.arguments === "string"
    );
}

function extractResponseText(response: OpenAiResponseBody) {
    if (typeof response.output_text === "string" && response.output_text.trim().length > 0) {
        return response.output_text.trim();
    }

    const messageText = response.output
        ?.flatMap((item) => {
            if (item.type !== "message" || !Array.isArray(item.content)) {
                return [];
            }

            return item.content.flatMap((contentItem) => {
                if (
                    isRecord(contentItem) &&
                    contentItem.type === "output_text" &&
                    typeof contentItem.text === "string"
                ) {
                    return [contentItem.text];
                }

                return [];
            });
        })
        .join("\n")
        .trim();

    return messageText && messageText.length > 0 ? messageText : "요청을 처리했습니다.";
}

function parseToolArguments(argumentsText: string) {
    try {
        const parsed = JSON.parse(argumentsText) as unknown;

        return isRecord(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

function readStringArgument(argumentsRecord: Record<string, unknown>, key: string) {
    const value = argumentsRecord[key];

    return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readIntegerArgument(argumentsRecord: Record<string, unknown>, key: string) {
    const value = argumentsRecord[key];

    return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

function readIntegerListArgument(argumentsRecord: Record<string, unknown>, key: string) {
    const value = argumentsRecord[key];

    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is number => typeof item === "number" && Number.isInteger(item) && item > 0);
}

function resolveRecommendationLimit(argumentsRecord: Record<string, unknown>) {
    const limit = readIntegerArgument(argumentsRecord, "limit") ?? ESTATE_AGENT_RECOMMENDATION_LIMIT;

    return Math.min(Math.max(limit, 1), ESTATE_AGENT_MAX_RECOMMENDATION_LIMIT);
}

function resolveRecommendationSort(argumentsRecord: Record<string, unknown>): RecommendationSort {
    const sortBy = readStringArgument(argumentsRecord, "sortBy");

    if (sortBy === "recent" || sortBy === "similarity" || sortBy === "dealAmountDesc" || sortBy === "dealAmountAsc") {
        return sortBy;
    }

    return "similarity";
}

function createFailedToolResult(message: string): EstateAgentToolResult {
    return {
        status: "failed",
        message,
        output: {
            type: "error",
            message
        }
    };
}

function formatSimilarTransactions(items: EstateSimilarTransactionItem[]) {
    if (items.length === 0) {
        return "조건에 맞는 추천 후보가 없습니다.";
    }

    return [
        `추천 후보 ${items.length.toLocaleString("ko-KR")}건을 찾았습니다.`,
        ...items.map((item, index) => {
            const transaction = item.transaction;
            const buildingName = transaction.buildingName ?? "건물명 없음";

            return `${index + 1}번: #${transaction.id} ${transaction.legalDongName} ${buildingName}, ${transaction.buildingUse}, ${formatFloor(transaction.floor)}, 계약일 ${transaction.contractDate}, ${formatArea(transaction.buildingAreaSquareMeter)}, ${formatDealAmount(transaction.dealAmount10kKrw)}, 추천도 ${formatScore(item.score)}`;
        })
    ].join("\n");
}

function formatTransactionDetail(transaction: EstateTransactionResponse) {
    const buildingName = transaction.buildingName ?? "건물명 없음";

    return [
        `실거래 #${transaction.id} 상세입니다.`,
        `${transaction.districtName} ${transaction.legalDongName} ${buildingName}`,
        `${transaction.buildingUse}, ${formatArea(transaction.buildingAreaSquareMeter)}, ${formatFloor(transaction.floor)}, ${transaction.builtYear}년 건축`,
        `계약일 ${transaction.contractDate}, 거래금액 ${formatDealAmount(transaction.dealAmount10kKrw)}`
    ].join("\n");
}

function createRecommendationExplanation(rank: number, item: EstateSimilarTransactionItem) {
    const transaction = item.transaction;
    const transactionName = transaction.buildingName ?? `${transaction.legalDongName} ${transaction.buildingUse}`;

    return [
        `${rank}번 ${transactionName} 추천 이유입니다.`,
        `전체 추천도 ${formatScore(item.score)}, 문맥 유사도 ${formatScore(item.vectorSimilarity)}입니다.`,
        `가격 조건 ${formatScore(item.priceScore)}, 면적 조건 ${formatScore(item.areaScore)}, 법정동 조건 ${formatScore(item.legalDongScore)}, 건물 용도 조건 ${formatScore(item.buildingUseScore)}가 반영됐습니다.`
    ].join("\n");
}

function createRecommendationComparison(
    leftRank: number,
    leftItem: EstateSimilarTransactionItem,
    rightRank: number,
    rightItem: EstateSimilarTransactionItem
) {
    const leftTransaction = leftItem.transaction;
    const rightTransaction = rightItem.transaction;

    return [
        `${leftRank}번과 ${rightRank}번 비교입니다.`,
        `${leftRank}번: ${leftTransaction.legalDongName} ${leftTransaction.buildingName ?? "건물명 없음"}, ${formatDealAmount(leftTransaction.dealAmount10kKrw)}, ${formatArea(leftTransaction.buildingAreaSquareMeter)}, 추천도 ${formatScore(leftItem.score)}`,
        `${rightRank}번: ${rightTransaction.legalDongName} ${rightTransaction.buildingName ?? "건물명 없음"}, ${formatDealAmount(rightTransaction.dealAmount10kKrw)}, ${formatArea(rightTransaction.buildingAreaSquareMeter)}, 추천도 ${formatScore(rightItem.score)}`
    ].join("\n");
}

function formatArea(squareMeter: number) {
    const pyeong = squareMeter / SQUARE_METERS_PER_PYEONG;

    return `${squareMeter.toLocaleString("ko-KR", {
        maximumFractionDigits: 2
    })}㎡ (${pyeong.toLocaleString("ko-KR", {
        maximumFractionDigits: 1
    })}평)`;
}

function formatDealAmount(dealAmount10kKrw: number) {
    return `${dealAmount10kKrw.toLocaleString("ko-KR")}만원`;
}

function formatFloor(floor: number | null) {
    return floor === null ? "층 정보 없음" : `${floor}층`;
}

function formatScore(score: number) {
    return `${Math.round(score * 100).toLocaleString("ko-KR")}%`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
