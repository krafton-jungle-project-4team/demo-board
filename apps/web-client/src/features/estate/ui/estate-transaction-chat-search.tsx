import { Link, useNavigate } from "@tanstack/react-router";
import { BotIcon, SearchIcon } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import type { EstateAgentAction, EstateAgentState, EstateSimilarTransactionItem } from "@nmm/shared";
import { Alert, AlertDescription, AlertTitle } from "@nmm/ui/components/alert";
import { Badge } from "@nmm/ui/components/badge";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@nmm/ui/components/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@nmm/ui/components/field";
import { Spinner } from "@nmm/ui/components/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nmm/ui/components/table";
import { Textarea } from "@nmm/ui/components/textarea";
import { useEstateAgentMutation } from "../api/estate-mutations";
import { ApiClientError } from "@/shared/api/http-client";

const RECOMMENDED_TRANSACTION_LIMIT = 5;
const SQUARE_METERS_PER_PYEONG = 3.305785;
const INITIAL_AGENT_STATE: EstateAgentState = {
    recommendations: []
};

export function EstateTransactionChatSearch() {
    const [promptInput, setPromptInput] = useState("");
    const [recommendationPrompt, setRecommendationPrompt] = useState("");
    const [agentState, setAgentState] = useState<EstateAgentState>(INITIAL_AGENT_STATE);
    const navigate = useNavigate();
    const estateAgentMutation = useEstateAgentMutation();
    const trimmedPrompt = promptInput.trim();
    const canSubmit = trimmedPrompt.length > 0 && !estateAgentMutation.isPending;

    function handlePromptInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
        setPromptInput(event.target.value);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        estateAgentMutation.reset();
        estateAgentMutation.mutate(
            {
                message: trimmedPrompt,
                state: agentState,
                limit: RECOMMENDED_TRANSACTION_LIMIT
            },
            {
                onSuccess: (response) => {
                    setAgentState(response.state);

                    if (response.action.type === "recommendations") {
                        setRecommendationPrompt(trimmedPrompt);
                    }

                    if (response.action.type === "open_transaction") {
                        void navigate({
                            to: "/estate/transactions/$transactionId",
                            params: {
                                transactionId: String(response.action.transactionId)
                            }
                        });
                    }
                }
            }
        );
    }
    const agentAction = estateAgentMutation.data?.action ?? null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BotIcon />
                    실거래 추천 챗봇
                </CardTitle>
                <CardDescription>원하는 조건을 문장으로 적으면 비슷한 실거래 5건을 찾아드려요.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <form onSubmit={handleSubmit}>
                    <FieldGroup className="gap-3">
                        <Field>
                            <FieldLabel htmlFor="estate-transaction-chat-search">추천 조건</FieldLabel>
                            <Textarea
                                id="estate-transaction-chat-search"
                                value={promptInput}
                                onChange={handlePromptInputChange}
                                placeholder="예: 잠실동 오피스텔을 찾아줘."
                                disabled={estateAgentMutation.isPending}
                                className="min-h-24 resize-y"
                            />
                            <FieldDescription>
                                법정동, 가격대, 면적, 건물 용도를 함께 적으면 더 정확해져요.
                            </FieldDescription>
                        </Field>
                        <Button type="submit" disabled={!canSubmit} className="w-full sm:w-fit">
                            {estateAgentMutation.isPending ? (
                                <Spinner data-icon="inline-start" />
                            ) : (
                                <SearchIcon data-icon="inline-start" />
                            )}
                            요청하기
                        </Button>
                    </FieldGroup>
                </form>

                {agentAction && agentAction.type !== "recommendations" ? (
                    <RecommendationCommandPanel action={agentAction} />
                ) : null}

                <EstateTransactionRecommendationResult
                    items={estateAgentMutation.data?.state.recommendations ?? []}
                    prompt={recommendationPrompt}
                    error={estateAgentMutation.error}
                    isError={estateAgentMutation.isError}
                    isIdle={estateAgentMutation.isIdle}
                    isPending={estateAgentMutation.isPending}
                />
            </CardContent>
        </Card>
    );
}

type EstateTransactionRecommendationResultProps = {
    items: EstateSimilarTransactionItem[];
    prompt: string;
    error: Error | null;
    isError: boolean;
    isIdle: boolean;
    isPending: boolean;
};

function EstateTransactionRecommendationResult({
    items,
    prompt,
    error,
    isError,
    isIdle,
    isPending
}: EstateTransactionRecommendationResultProps) {
    if (isIdle || isPending) {
        return null;
    }

    if (isError) {
        const message = getRecommendationErrorMessage(error);

        return (
            <Alert variant="destructive">
                <AlertTitle>{message.title}</AlertTitle>
                <AlertDescription>{message.description}</AlertDescription>
            </Alert>
        );
    }

    if (items.length === 0) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyTitle>추천할 실거래가 없습니다.</EmptyTitle>
                    <EmptyDescription>조건을 조금 넓혀서 다시 검색해보세요.</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
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
                            <TableHead className="min-w-24 text-center">추천도</TableHead>
                            <TableHead className="min-w-24 text-right">상세</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item, index) => (
                            <EstateTransactionRecommendationRow
                                key={item.transaction.id}
                                item={item}
                                rank={index + 1}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
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

function RecommendationCommandPanel({ action }: { action: EstateAgentAction }) {
    if (action.type === "error") {
        return (
            <Alert variant="destructive">
                <AlertTitle>명령을 실행하지 못했습니다.</AlertTitle>
                <AlertDescription>{action.message}</AlertDescription>
            </Alert>
        );
    }

    if (action.type === "explanation") {
        return <RecommendationExplanationAlert explanation={action} />;
    }

    if (action.type === "comparison") {
        return <RecommendationComparisonAlert comparison={action} />;
    }

    return (
        <Alert>
            <AlertTitle>에이전트 응답</AlertTitle>
            <AlertDescription>{action.message}</AlertDescription>
        </Alert>
    );
}

function RecommendationExplanationAlert({
    explanation
}: {
    explanation: Extract<EstateAgentAction, { type: "explanation" }>;
}) {
    return (
        <Alert>
            <AlertTitle>{explanation.title}</AlertTitle>
            <AlertDescription>
                <div className="grid gap-2">
                    <p>{explanation.description}</p>
                    <dl className="grid gap-1 text-sm">
                        {explanation.scores.map((score) => (
                            <div key={score.label} className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">{score.label}</dt>
                                <dd className="font-medium tabular-nums">{score.value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </AlertDescription>
        </Alert>
    );
}

function RecommendationComparisonAlert({
    comparison
}: {
    comparison: Extract<EstateAgentAction, { type: "comparison" }>;
}) {
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
                        <TableBody>
                            {comparison.rows.map((row) => (
                                <TableRow key={row.label}>
                                    <TableCell className="text-muted-foreground">{row.label}</TableCell>
                                    <TableCell className="font-medium tabular-nums">{row.leftValue}</TableCell>
                                    <TableCell className="font-medium tabular-nums">{row.rightValue}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </AlertDescription>
        </Alert>
    );
}

function getRecommendationErrorMessage(error: Error | null) {
    if (error instanceof ApiClientError && error.error.code === "ESTATE_EMBEDDING_NOT_FOUND") {
        return {
            title: "추천을 준비하고 있습니다.",
            description: "실거래 임베딩 데이터가 준비되면 자연어 추천을 사용할 수 있어요."
        };
    }

    if (error instanceof ApiClientError && error.error.code === "ESTATE_EMBEDDING_API_KEY_MISSING") {
        return {
            title: "임베딩 API 키가 필요합니다.",
            description: "API 서버 .env에 OPENAI_API_KEY를 설정한 뒤 서버를 다시 실행해주세요."
        };
    }

    if (error instanceof ApiClientError && error.error.code === "ESTATE_EMBEDDING_REQUEST_FAILED") {
        return {
            title: "임베딩 생성에 실패했습니다.",
            description: "API 키와 네트워크 상태를 확인한 뒤 다시 시도해주세요."
        };
    }

    return {
        title: "추천 후보를 불러오지 못했습니다.",
        description: "잠시 뒤 다시 시도해주세요."
    };
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

function formatScore(score: number) {
    return `${Math.round(score * 100).toLocaleString("ko-KR")}%`;
}
