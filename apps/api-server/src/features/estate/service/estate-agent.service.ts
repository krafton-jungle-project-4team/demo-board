import { Injectable } from "@nestjs/common";
import {
    EstateAgentActionSchema,
    EstateAgentResponseSchema,
    EstateAgentStateSchema,
    type EstateAgentAction,
    type EstateAgentRequest,
    type EstateAgentResponse,
    type EstateAgentState,
    type EstateSimilarTransactionItem
} from "@nmm/shared";
import { serverEnv } from "../../../infra/env";
import { EstateAiQueryService } from "./estate-ai-query.service";
import {
    AGENT_TOOL_DEFINITIONS,
    createToolEmbeddingInput,
    type AgentToolEmbedding,
    type AgentToolName
} from "./estate-agent-tools";
import { createEmbedding } from "./estate-embedding";

const SQUARE_METERS_PER_PYEONG = 3.305785;
const MIN_TOOL_ROUTER_SIMILARITY = 0.25;

type AgentToolResult = {
    status: "success" | "error";
    action: EstateAgentAction;
    state: EstateAgentState;
};

@Injectable()
export class EstateAgentService {
    private toolEmbeddingsPromise: Promise<AgentToolEmbedding[]> | null = null;

    constructor(private readonly estateAiQueryService: EstateAiQueryService) {}

    async run(request: EstateAgentRequest): Promise<EstateAgentResponse> {
        const state = EstateAgentStateSchema.parse(request.state);
        const selectedTool = await this.selectTool(request.message);
        const result =
            selectedTool === null
                ? createUnsupportedRequestResult(state)
                : await this.executeTool(selectedTool.name, request.message, state, request.limit);

        return EstateAgentResponseSchema.parse({
            message: getActionMessage(result.action),
            action: result.action,
            state: result.state,
            toolCalls:
                selectedTool === null
                    ? []
                    : [
                          {
                              name: selectedTool.name,
                              status: result.status
                          }
                      ]
        });
    }

    private async selectTool(message: string) {
        const [messageEmbedding, toolEmbeddings] = await Promise.all([
            createEmbedding(message, serverEnv.ai.embedding),
            this.getToolEmbeddings()
        ]);
        const rankedTools = toolEmbeddings
            .map((tool) => ({
                ...tool,
                similarity: cosineSimilarity(messageEmbedding, tool.embedding)
            }))
            .sort((left, right) => right.similarity - left.similarity);
        const selectedTool = rankedTools[0];

        if (!selectedTool || selectedTool.similarity < MIN_TOOL_ROUTER_SIMILARITY) {
            return null;
        }

        return selectedTool;
    }

    private getToolEmbeddings() {
        this.toolEmbeddingsPromise ??= Promise.all(
            AGENT_TOOL_DEFINITIONS.map(async (tool) => ({
                ...tool,
                embedding: await createEmbedding(createToolEmbeddingInput(tool), serverEnv.ai.embedding)
            }))
        );

        return this.toolEmbeddingsPromise;
    }

    private async executeTool(
        toolName: AgentToolName,
        message: string,
        state: EstateAgentState,
        limit: number
    ): Promise<AgentToolResult> {
        if (toolName === "search_estate_transactions") {
            return await this.searchEstateTransactions(message, state, limit);
        }

        if (toolName === "open_recommendation_detail") {
            return this.openRecommendationDetail(message, state);
        }

        if (toolName === "explain_recommendation") {
            return this.explainRecommendation(message, state);
        }

        return this.compareRecommendations(message, state);
    }

    private async searchEstateTransactions(
        message: string,
        state: EstateAgentState,
        limit: number
    ): Promise<AgentToolResult> {
        const response = await this.estateAiQueryService.findSimilarTransactions({
            queryText: message,
            filters: {},
            limit
        });
        const nextState = EstateAgentStateSchema.parse({
            ...state,
            recommendations: response.items
        });
        const action = EstateAgentActionSchema.parse({
            type: "recommendations",
            message: `조건에 가까운 실거래 ${response.items.length}건을 찾았습니다.`,
            items: response.items
        });

        return {
            status: "success",
            action,
            state: nextState
        };
    }

    private openRecommendationDetail(message: string, state: EstateAgentState): AgentToolResult {
        const rank = parseFirstRank(message);

        if (rank === null) {
            return createRankParseErrorResult(state);
        }

        const recommendation = findRecommendationByRank(state, rank);

        if (!recommendation) {
            return createMissingRecommendationResult(rank, state);
        }

        const action = EstateAgentActionSchema.parse({
            type: "open_transaction",
            message: `${rank}번 추천 후보 상세페이지로 이동합니다.`,
            rank,
            transactionId: recommendation.transaction.id
        });

        return {
            status: "success",
            action,
            state
        };
    }

    private explainRecommendation(message: string, state: EstateAgentState): AgentToolResult {
        const rank = parseFirstRank(message) ?? 1;
        const recommendation = findRecommendationByRank(state, rank);

        if (!recommendation) {
            return createMissingRecommendationResult(rank, state);
        }

        return {
            status: "success",
            action: createRecommendationExplanation(rank, recommendation),
            state
        };
    }

    private compareRecommendations(message: string, state: EstateAgentState): AgentToolResult {
        const ranks = parseComparisonRanks(message);

        if (!ranks) {
            return createRankParseErrorResult(state);
        }

        const [leftRank, rightRank] = ranks;
        const leftRecommendation = findRecommendationByRank(state, leftRank);
        const rightRecommendation = findRecommendationByRank(state, rightRank);

        if (!leftRecommendation || !rightRecommendation) {
            const action = EstateAgentActionSchema.parse({
                type: "error",
                message: `${leftRank}번과 ${rightRank}번 중 없는 추천 후보가 있습니다.`
            });

            return {
                status: "error",
                action,
                state
            };
        }

        return {
            status: "success",
            action: createRecommendationComparison(leftRank, leftRecommendation, rightRank, rightRecommendation),
            state
        };
    }
}

function cosineSimilarity(left: number[], right: number[]) {
    let dotProduct = 0;
    let leftMagnitude = 0;
    let rightMagnitude = 0;

    for (let index = 0; index < left.length; index += 1) {
        const leftValue = left[index] ?? 0;
        const rightValue = right[index] ?? 0;

        dotProduct += leftValue * rightValue;
        leftMagnitude += leftValue * leftValue;
        rightMagnitude += rightValue * rightValue;
    }

    if (leftMagnitude === 0 || rightMagnitude === 0) {
        return 0;
    }

    return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function parseFirstRank(message: string) {
    return parseRanks(message)[0] ?? null;
}

function parseComparisonRanks(message: string): [number, number] | null {
    const ranks = parseRanks(message);
    const leftRank = ranks[0];
    const rightRank = ranks[1];

    return leftRank === undefined || rightRank === undefined ? null : [leftRank, rightRank];
}

function parseRanks(message: string) {
    return Array.from(message.matchAll(/(\d+)\s*번/g), (match) => Number(match[1]));
}

function findRecommendationByRank(state: EstateAgentState, rank: number) {
    return state.recommendations[rank - 1];
}

function getActionMessage(action: EstateAgentAction) {
    if (action.type === "explanation" || action.type === "comparison") {
        return action.title;
    }

    return action.message;
}

function createUnsupportedRequestResult(state: EstateAgentState): AgentToolResult {
    const action = EstateAgentActionSchema.parse({
        type: "message",
        message: "부동산 실거래 추천, 상세 이동, 추천 이유, 후보 비교 요청만 처리할 수 있습니다."
    });

    return {
        status: "error",
        action,
        state
    };
}

function createRankParseErrorResult(state: EstateAgentState): AgentToolResult {
    const action = EstateAgentActionSchema.parse({
        type: "error",
        message: "추천 후보 번호를 찾지 못했습니다. 예: 2번 상세 보여줘, 1번 2번 비교해줘"
    });

    return {
        status: "error",
        action,
        state
    };
}

function createMissingRecommendationResult(rank: number, state: EstateAgentState): AgentToolResult {
    const action = EstateAgentActionSchema.parse({
        type: "error",
        message: `${rank}번 추천 후보가 없습니다. 먼저 실거래 후보를 검색해주세요.`
    });

    return {
        status: "error",
        action,
        state
    };
}

function createRecommendationExplanation(rank: number, item: EstateSimilarTransactionItem): EstateAgentAction {
    const transaction = item.transaction;
    const transactionName = transaction.buildingName ?? `${transaction.legalDongName} ${transaction.buildingUse}`;

    return EstateAgentActionSchema.parse({
        type: "explanation",
        title: `${rank}번 추천 이유`,
        description: `${transactionName}은 검색 문장과 실거래 정보의 임베딩 유사도, 가격, 면적, 법정동, 건물 용도 점수를 함께 반영해 추천됐습니다.`,
        scores: [
            {
                label: "전체 추천도",
                value: formatScore(item.score)
            },
            {
                label: "문맥 유사도",
                value: formatScore(item.vectorSimilarity)
            },
            {
                label: "가격 조건",
                value: formatScore(item.priceScore)
            },
            {
                label: "면적 조건",
                value: formatScore(item.areaScore)
            },
            {
                label: "법정동 조건",
                value: formatScore(item.legalDongScore)
            },
            {
                label: "건물 용도",
                value: formatScore(item.buildingUseScore)
            }
        ]
    });
}

function createRecommendationComparison(
    leftRank: number,
    leftItem: EstateSimilarTransactionItem,
    rightRank: number,
    rightItem: EstateSimilarTransactionItem
): EstateAgentAction {
    const leftTransaction = leftItem.transaction;
    const rightTransaction = rightItem.transaction;

    return EstateAgentActionSchema.parse({
        type: "comparison",
        title: `${leftRank}번과 ${rightRank}번 비교`,
        leftLabel: `${leftRank}번`,
        rightLabel: `${rightRank}번`,
        rows: [
            {
                label: "건물명",
                leftValue: leftTransaction.buildingName ?? "건물명 없음",
                rightValue: rightTransaction.buildingName ?? "건물명 없음"
            },
            {
                label: "법정동",
                leftValue: leftTransaction.legalDongName,
                rightValue: rightTransaction.legalDongName
            },
            {
                label: "용도",
                leftValue: leftTransaction.buildingUse,
                rightValue: rightTransaction.buildingUse
            },
            {
                label: "거래금액",
                leftValue: formatDealAmount(leftTransaction.dealAmount10kKrw),
                rightValue: formatDealAmount(rightTransaction.dealAmount10kKrw)
            },
            {
                label: "면적",
                leftValue: formatArea(leftTransaction.buildingAreaSquareMeter),
                rightValue: formatArea(rightTransaction.buildingAreaSquareMeter)
            },
            {
                label: "평당가",
                leftValue: formatPricePerPyeong(
                    leftTransaction.dealAmount10kKrw,
                    leftTransaction.buildingAreaSquareMeter
                ),
                rightValue: formatPricePerPyeong(
                    rightTransaction.dealAmount10kKrw,
                    rightTransaction.buildingAreaSquareMeter
                )
            },
            {
                label: "층",
                leftValue: formatFloor(leftTransaction.floor),
                rightValue: formatFloor(rightTransaction.floor)
            },
            {
                label: "준공년도",
                leftValue: `${leftTransaction.builtYear}년`,
                rightValue: `${rightTransaction.builtYear}년`
            },
            {
                label: "계약일",
                leftValue: leftTransaction.contractDate,
                rightValue: rightTransaction.contractDate
            },
            {
                label: "추천도",
                leftValue: formatScore(leftItem.score),
                rightValue: formatScore(rightItem.score)
            },
            {
                label: "문맥 유사도",
                leftValue: formatScore(leftItem.vectorSimilarity),
                rightValue: formatScore(rightItem.vectorSimilarity)
            }
        ]
    });
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

function formatPricePerPyeong(dealAmount10kKrw: number, squareMeter: number) {
    const pyeong = squareMeter / SQUARE_METERS_PER_PYEONG;
    const pricePerPyeong = dealAmount10kKrw / pyeong;

    return `${pricePerPyeong.toLocaleString("ko-KR", {
        maximumFractionDigits: 0
    })}만원/평`;
}

function formatFloor(floor: number | null) {
    return floor === null ? "-" : `${floor}층`;
}

function formatScore(score: number) {
    return `${Math.round(score * 100).toLocaleString("ko-KR")}%`;
}
