import { Link, useNavigate } from "@tanstack/react-router";
import { BotIcon, SearchIcon } from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import type { EstateSimilarTransactionItem } from "@nmm/shared";
import { Alert, AlertDescription, AlertTitle } from "@nmm/ui/components/alert";
import { Badge } from "@nmm/ui/components/badge";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@nmm/ui/components/empty";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@nmm/ui/components/field";
import { Spinner } from "@nmm/ui/components/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nmm/ui/components/table";
import { Textarea } from "@nmm/ui/components/textarea";
import { useFindSimilarEstateTransactionsMutation } from "../api/estate-mutations";
import { ApiClientError } from "@/shared/api/http-client";

const RECOMMENDED_TRANSACTION_LIMIT = 5;
const SQUARE_METERS_PER_PYEONG = 3.305785;
const DETAIL_COMMAND_REGEX = /(\d+)\s*번.*(?:상세|열어|보여|이동|페이지)/;
const COMPARISON_COMMAND_REGEX = /(?:비교|차이|뭐가\s*더|어느\s*게|나아|낫)/;
const EXPLANATION_COMMAND_REGEX = /(?:왜|이유|근거|설명)/;
const RANK_COMMAND_REGEX = /(\d+)\s*번/g;

export function EstateTransactionChatSearch() {
    const [promptInput, setPromptInput] = useState("");
    const [submittedPrompt, setSubmittedPrompt] = useState("");
    const [lastRecommendations, setLastRecommendations] = useState<EstateSimilarTransactionItem[]>([]);
    const [commandPanel, setCommandPanel] = useState<CommandPanel | null>(null);
    const navigate = useNavigate();
    const recommendationMutation = useFindSimilarEstateTransactionsMutation();
    const trimmedPrompt = promptInput.trim();
    const canSubmit = trimmedPrompt.length > 0 && !recommendationMutation.isPending;

    function handlePromptInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
        setPromptInput(event.target.value);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!canSubmit) {
            return;
        }

        const comparisonRanks = parseComparisonCommandRanks(trimmedPrompt);

        if (comparisonRanks !== null) {
            compareRecommendations(comparisonRanks);
            return;
        }

        const detailRank = parseDetailCommandRank(trimmedPrompt);

        if (detailRank !== null) {
            openRecommendationDetail(detailRank);
            return;
        }

        const explanationRank = parseExplanationCommandRank(trimmedPrompt);

        if (explanationRank !== null) {
            explainRecommendation(explanationRank);
            return;
        }

        setCommandPanel(null);
        setSubmittedPrompt(trimmedPrompt);
        setLastRecommendations([]);
        recommendationMutation.reset();
        recommendationMutation.mutate(
            {
                queryText: trimmedPrompt,
                filters: {},
                limit: RECOMMENDED_TRANSACTION_LIMIT
            },
            {
                onSuccess: (response) => {
                    setLastRecommendations(response.items);
                }
            }
        );
    }

    function openRecommendationDetail(rank: number) {
        const recommendation = lastRecommendations[rank - 1];

        if (!recommendation) {
            setCommandPanel({
                type: "error",
                message: `${rank}번 추천 후보가 없습니다. 먼저 후보를 검색해주세요.`
            });
            return;
        }

        setCommandPanel(null);
        void navigate({
            to: "/estate/transactions/$transactionId",
            params: {
                transactionId: String(recommendation.transaction.id)
            }
        });
    }

    function explainRecommendation(rank: number) {
        const recommendation = lastRecommendations[rank - 1];

        if (!recommendation) {
            setCommandPanel({
                type: "error",
                message: `${rank}번 추천 후보가 없습니다. 먼저 후보를 검색해주세요.`
            });
            return;
        }

        setCommandPanel({
            type: "explanation",
            explanation: createRecommendationExplanation(rank, recommendation)
        });
    }

    function compareRecommendations(ranks: [number, number]) {
        const [leftRank, rightRank] = ranks;
        const leftRecommendation = lastRecommendations[leftRank - 1];
        const rightRecommendation = lastRecommendations[rightRank - 1];

        if (!leftRecommendation || !rightRecommendation) {
            setCommandPanel({
                type: "error",
                message: `${leftRank}번과 ${rightRank}번 중 없는 추천 후보가 있습니다.`
            });
            return;
        }

        setCommandPanel({
            type: "comparison",
            comparison: createRecommendationComparison(leftRank, leftRecommendation, rightRank, rightRecommendation)
        });
    }

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
                                placeholder="예: 잠실 근처 10억 이하, 20평대 아파트 거래를 찾고 싶어요."
                                disabled={recommendationMutation.isPending}
                                className="min-h-24 resize-y"
                            />
                            <FieldDescription>
                                법정동, 가격대, 면적, 건물 용도를 함께 적으면 더 정확해져요.
                            </FieldDescription>
                        </Field>
                        <Button type="submit" disabled={!canSubmit} className="w-full sm:w-fit">
                            {recommendationMutation.isPending ? (
                                <Spinner data-icon="inline-start" />
                            ) : (
                                <SearchIcon data-icon="inline-start" />
                            )}
                            후보 찾기
                        </Button>
                    </FieldGroup>
                </form>

                {commandPanel ? <RecommendationCommandPanel commandPanel={commandPanel} /> : null}

                <EstateTransactionRecommendationResult
                    items={recommendationMutation.data?.items ?? []}
                    prompt={submittedPrompt}
                    error={recommendationMutation.error}
                    isError={recommendationMutation.isError}
                    isIdle={recommendationMutation.isIdle}
                    isPending={recommendationMutation.isPending}
                />
            </CardContent>
        </Card>
    );
}

type RecommendationExplanation = {
    title: string;
    description: string;
    scores: Array<{
        label: string;
        value: string;
    }>;
};

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

type CommandPanel =
    | {
          type: "error";
          message: string;
      }
    | {
          type: "explanation";
          explanation: RecommendationExplanation;
      }
    | {
          type: "comparison";
          comparison: RecommendationComparison;
      };

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

function parseDetailCommandRank(prompt: string) {
    const detailCommandMatch = DETAIL_COMMAND_REGEX.exec(prompt);

    if (!detailCommandMatch) {
        return null;
    }

    return Number(detailCommandMatch[1]);
}

function parseComparisonCommandRanks(prompt: string): [number, number] | null {
    const isComparisonCommand = COMPARISON_COMMAND_REGEX.test(prompt);

    if (!isComparisonCommand) {
        return null;
    }

    const ranks = Array.from(prompt.matchAll(RANK_COMMAND_REGEX), (match) => Number(match[1]));

    if (ranks.length < 2) {
        return null;
    }

    const [leftRank, rightRank] = ranks;

    if (leftRank === undefined || rightRank === undefined) {
        return null;
    }

    return [leftRank, rightRank];
}

function parseExplanationCommandRank(prompt: string) {
    const isExplanationCommand = EXPLANATION_COMMAND_REGEX.test(prompt);

    if (!isExplanationCommand) {
        return null;
    }

    const rankMatch = Array.from(prompt.matchAll(RANK_COMMAND_REGEX))[0];

    return rankMatch ? Number(rankMatch[1]) : 1;
}

function RecommendationCommandPanel({ commandPanel }: { commandPanel: CommandPanel }) {
    if (commandPanel.type === "error") {
        return (
            <Alert variant="destructive">
                <AlertTitle>명령을 실행하지 못했습니다.</AlertTitle>
                <AlertDescription>{commandPanel.message}</AlertDescription>
            </Alert>
        );
    }

    if (commandPanel.type === "explanation") {
        return <RecommendationExplanationAlert explanation={commandPanel.explanation} />;
    }

    return <RecommendationComparisonAlert comparison={commandPanel.comparison} />;
}

function RecommendationExplanationAlert({ explanation }: { explanation: RecommendationExplanation }) {
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

function createRecommendationExplanation(rank: number, item: EstateSimilarTransactionItem): RecommendationExplanation {
    const transaction = item.transaction;
    const transactionName = transaction.buildingName ?? `${transaction.legalDongName} ${transaction.buildingUse}`;

    return {
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
    };
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
    };
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
