import { Link, useNavigate } from "@tanstack/react-router";
import { BotIcon, SendIcon } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import type { EstateAgentChatResponse, EstateAgentToolCall, EstateSimilarTransactionItem } from "@nmm/shared";
import { Alert, AlertDescription, AlertTitle } from "@nmm/ui/components/alert";
import { Badge } from "@nmm/ui/components/badge";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@nmm/ui/components/field";
import { Spinner } from "@nmm/ui/components/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nmm/ui/components/table";
import { Textarea } from "@nmm/ui/components/textarea";
import { useChatWithEstateAgentMutation } from "../api/estate-mutations";
import { ApiClientError } from "@/shared/api/http-client";

const SQUARE_METERS_PER_PYEONG = 3.305785;

export function EstateTransactionChatSearch() {
    const [promptInput, setPromptInput] = useState("");
    const [submittedPrompt, setSubmittedPrompt] = useState("");
    const [sessionId, setSessionId] = useState<string>();
    const [agentResponse, setAgentResponse] = useState<EstateAgentChatResponse | null>(null);
    const navigate = useNavigate();
    const agentMutation = useChatWithEstateAgentMutation();
    const trimmedPrompt = promptInput.trim();
    const canSubmit = trimmedPrompt.length > 0 && !agentMutation.isPending;
    const comparedRecommendation = agentResponse ? createComparedRecommendationComparison(agentResponse) : null;

    function handlePromptInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
        setPromptInput(event.target.value);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        setSubmittedPrompt(trimmedPrompt);
        setAgentResponse(null);
        agentMutation.reset();
        agentMutation.mutate(
            {
                sessionId,
                message: trimmedPrompt
            },
            {
                onSuccess: handleAgentSuccess
            }
        );
    }

    function handleAgentSuccess(response: EstateAgentChatResponse) {
        setSessionId(response.sessionId);
        setAgentResponse(response);

        if (response.targetTransactionId) {
            void navigate({
                to: "/estate/transactions/$transactionId",
                params: {
                    transactionId: String(response.targetTransactionId)
                }
            });
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BotIcon />
                    실거래 추천 에이전트
                </CardTitle>
                <CardDescription>조건 검색, 추천 이유, 매물 비교, 상세 이동을 자연어로 요청해보세요.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <form onSubmit={handleSubmit}>
                    <FieldGroup className="gap-3">
                        <Field>
                            <FieldLabel htmlFor="estate-transaction-chat-search">요청</FieldLabel>
                            <Textarea
                                id="estate-transaction-chat-search"
                                value={promptInput}
                                onChange={handlePromptInputChange}
                                placeholder="예: 잠실 근처 10억 이하, 20평대 아파트 거래를 찾고 싶어요."
                                disabled={agentMutation.isPending}
                                className="min-h-24 resize-y"
                            />
                            <FieldDescription>예: 2번 이동해줘, 1번 2번 비교해줘, 4번 왜 추천했어?</FieldDescription>
                        </Field>
                        <Button type="submit" disabled={!canSubmit} className="w-full sm:w-fit">
                            {agentMutation.isPending ? (
                                <Spinner data-icon="inline-start" />
                            ) : (
                                <SendIcon data-icon="inline-start" />
                            )}
                            보내기
                        </Button>
                    </FieldGroup>
                </form>

                {agentMutation.isError ? <EstateAgentErrorAlert error={agentMutation.error} /> : null}
                {agentResponse ? <EstateAgentAnswer response={agentResponse} /> : null}
                {comparedRecommendation ? <RecommendationComparisonAlert comparison={comparedRecommendation} /> : null}

                <EstateTransactionRecommendationResult
                    items={agentResponse?.recommendations ?? []}
                    prompt={submittedPrompt}
                />
            </CardContent>
        </Card>
    );
}

type RecommendationComparison = {
    title: string;
    leftLabel: string;
    rightLabel: string;
    rows: Array<{
        label: string;
        leftValue: string;
        rightValue: string;
    }>;
};

type EstateTransactionRecommendationResultProps = {
    items: EstateSimilarTransactionItem[];
    prompt: string;
};

function EstateAgentAnswer({ response }: { response: EstateAgentChatResponse }) {
    return (
        <Alert>
            <AlertTitle>에이전트 응답</AlertTitle>
            <AlertDescription>
                <div className="flex flex-col gap-3">
                    <p>{response.answer}</p>
                    {response.toolCalls.length > 0 ? (
                        <div className="flex flex-wrap gap-2">{response.toolCalls.map(renderToolCallBadge)}</div>
                    ) : null}
                </div>
            </AlertDescription>
        </Alert>
    );
}

function renderToolCallBadge(toolCall: EstateAgentToolCall, index: number) {
    const variant = toolCall.status === "completed" ? "secondary" : "destructive";

    return (
        <Badge key={`${toolCall.name}-${index}`} variant={variant}>
            {formatToolName(toolCall.name)}
        </Badge>
    );
}

function EstateAgentErrorAlert({ error }: { error: Error | null }) {
    const message = getAgentErrorMessage(error);

    return (
        <Alert variant="destructive">
            <AlertTitle>{message.title}</AlertTitle>
            <AlertDescription>{message.description}</AlertDescription>
        </Alert>
    );
}

function EstateTransactionRecommendationResult({ items, prompt }: EstateTransactionRecommendationResultProps) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">추천 후보 {items.length}건</p>
                <p className="text-sm text-muted-foreground">{prompt}</p>
            </div>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-16 text-center">번호</TableHead>
                            <TableHead>법정동</TableHead>
                            <TableHead>건물명</TableHead>
                            <TableHead>용도</TableHead>
                            <TableHead className="min-w-32 text-center">면적</TableHead>
                            <TableHead>거래금액</TableHead>
                            <TableHead>계약일</TableHead>
                            <TableHead className="min-w-24 text-center">검색 적합도</TableHead>
                            <TableHead className="min-w-24 text-right">상세</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>{items.map(renderRecommendationRow)}</TableBody>
                </Table>
            </div>
        </div>
    );
}

function renderRecommendationRow(item: EstateSimilarTransactionItem, index: number) {
    return <EstateTransactionRecommendationRow key={item.transaction.id} item={item} rank={index + 1} />;
}

function EstateTransactionRecommendationRow({ item, rank }: { item: EstateSimilarTransactionItem; rank: number }) {
    const transaction = item.transaction;
    const transactionDetailParams = {
        transactionId: String(transaction.id)
    };

    return (
        <TableRow>
            <TableCell className="text-center tabular-nums">{rank}번</TableCell>
            <TableCell>{transaction.legalDongName}</TableCell>
            <TableCell className="font-medium">{transaction.buildingName ?? "건물명 없음"}</TableCell>
            <TableCell>{transaction.buildingUse}</TableCell>
            <TableCell className="min-w-32 text-center tabular-nums">
                {formatArea(transaction.buildingAreaSquareMeter)}
            </TableCell>
            <TableCell>{formatDealAmount(transaction.dealAmount10kKrw)}</TableCell>
            <TableCell>{transaction.contractDate}</TableCell>
            <TableCell className="min-w-20 text-center">
                <Badge variant="secondary">{formatScore(item.score)}</Badge>
            </TableCell>
            <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                    <Link to="/estate/transactions/$transactionId" params={transactionDetailParams}>
                        상세 보기
                    </Link>
                </Button>
            </TableCell>
        </TableRow>
    );
}

function RecommendationComparisonAlert({ comparison }: { comparison: RecommendationComparison }) {
    return (
        <Alert>
            <AlertTitle>{comparison.title}</AlertTitle>
            <AlertDescription>
                <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>항목</TableHead>
                                <TableHead>{comparison.leftLabel}</TableHead>
                                <TableHead>{comparison.rightLabel}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>{comparison.rows.map(renderComparisonRow)}</TableBody>
                    </Table>
                </div>
            </AlertDescription>
        </Alert>
    );
}

function renderComparisonRow(row: RecommendationComparison["rows"][number]) {
    return (
        <TableRow key={row.label}>
            <TableCell className="text-muted-foreground">{row.label}</TableCell>
            <TableCell className="font-medium tabular-nums">{row.leftValue}</TableCell>
            <TableCell className="font-medium tabular-nums">{row.rightValue}</TableCell>
        </TableRow>
    );
}

function createComparedRecommendationComparison(response: EstateAgentChatResponse) {
    const [leftItem, rightItem] = response.comparedTransactions ?? [];

    if (!leftItem || !rightItem) {
        return null;
    }

    const recommendations = response.recommendations ?? [];
    const leftRank = findRecommendationRank(recommendations, leftItem);
    const rightRank = findRecommendationRank(recommendations, rightItem);

    return createRecommendationComparison(leftRank, leftItem, rightRank, rightItem);
}

function findRecommendationRank(recommendations: EstateSimilarTransactionItem[], item: EstateSimilarTransactionItem) {
    const index = recommendations.findIndex((recommendation) => recommendation.transaction.id === item.transaction.id);

    return index >= 0 ? index + 1 : 1;
}

function createRecommendationComparison(
    leftRank: number,
    leftItem: EstateSimilarTransactionItem,
    rightRank: number,
    rightItem: EstateSimilarTransactionItem
): RecommendationComparison {
    const leftTransaction = leftItem.transaction;
    const rightTransaction = rightItem.transaction;

    return {
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
                label: "검색 적합도",
                leftValue: formatScore(leftItem.score),
                rightValue: formatScore(rightItem.score)
            },
            {
                label: "문맥 유사도",
                leftValue: formatScore(leftItem.vectorSimilarity),
                rightValue: formatScore(rightItem.vectorSimilarity)
            }
        ]
    };
}

function getAgentErrorMessage(error: Error | null) {
    if (error instanceof ApiClientError && error.error.code === "ESTATE_AGENT_API_KEY_MISSING") {
        return {
            title: "AI 에이전트 API 키가 필요합니다.",
            description: "API 서버 .env에 OPENAI_API_KEY를 설정한 뒤 서버를 다시 실행해주세요."
        };
    }

    if (error instanceof ApiClientError && error.error.code === "ESTATE_AGENT_STEP_LIMIT_EXCEEDED") {
        return {
            title: "AI 에이전트가 요청을 완료하지 못했습니다.",
            description: "도구 실행 단계가 제한을 초과했습니다. 요청을 조금 더 구체적으로 다시 입력해주세요."
        };
    }

    if (error instanceof ApiClientError && error.error.code === "ESTATE_EMBEDDING_NOT_FOUND") {
        return {
            title: "추천을 준비하고 있습니다.",
            description: "실거래 임베딩 데이터가 준비되면 자연어 추천을 사용할 수 있어요."
        };
    }

    if (
        error instanceof ApiClientError &&
        (error.error.code === "ESTATE_AGENT_REQUEST_FAILED" || error.error.code === "ESTATE_EMBEDDING_REQUEST_FAILED")
    ) {
        return {
            title: "AI 에이전트 요청에 실패했습니다.",
            description: "API 키와 네트워크 상태를 확인한 뒤 다시 시도해주세요."
        };
    }

    return {
        title: "AI 에이전트 응답을 불러오지 못했습니다.",
        description: "잠시 뒤 다시 시도해주세요."
    };
}

function formatToolName(toolName: string) {
    if (toolName === "search_similar_transactions") {
        return "추천 검색";
    }

    if (toolName === "get_transaction_detail") {
        return "상세 조회";
    }

    if (toolName === "explain_recommendation") {
        return "추천 설명";
    }

    if (toolName === "compare_recommendations") {
        return "매물 비교";
    }

    return toolName;
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
