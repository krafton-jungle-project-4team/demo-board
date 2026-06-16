import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { MouseEvent } from "react";
import type { EstateSimilarTransactionItem } from "@nmm/shared";
import { Alert, AlertDescription, AlertTitle } from "@nmm/ui/components/alert";
import { Badge } from "@nmm/ui/components/badge";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@nmm/ui/components/empty";
import { Spinner } from "@nmm/ui/components/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nmm/ui/components/table";
import { estateSimilarTransactionsQueryOptions } from "@/features/estate/api/estate-queries";
import { ApiClientError } from "@/shared/api/http-client";

type EstateSimilarTransactionListProps = {
    transactionId: number;
};

type EstateSimilarTransactionListErrorRenderProps = {
    error: Error;
    reset: () => void;
};

const SQUARE_METERS_PER_PYEONG = 3.305785;

export function EstateSimilarTransactionList({ transactionId }: EstateSimilarTransactionListProps) {
    const similarTransactionsQuery = useSuspenseQuery(estateSimilarTransactionsQueryOptions(transactionId));
    const similarTransactions = similarTransactionsQuery.data.items.filter(
        (item) => item.transaction.id !== transactionId
    );

    if (similarTransactions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>비슷한 조건의 거래</CardTitle>
                    <CardDescription>현재 거래와 조건이 가까운 실거래를 보여드려요.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Empty>
                        <EmptyHeader>
                            <EmptyTitle>비슷한 조건의 거래가 없습니다.</EmptyTitle>
                            <EmptyDescription>다른 거래를 보면 추천 결과가 달라질 수 있어요.</EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>비슷한 조건의 거래</CardTitle>
                <CardDescription>조건이 가까운 실거래 {similarTransactions.length}건</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>법정동</TableHead>
                            <TableHead>건물명</TableHead>
                            <TableHead>용도</TableHead>
                            <TableHead className="min-w-32 text-center">면적</TableHead>
                            <TableHead>거래금액</TableHead>
                            <TableHead>계약일</TableHead>
                            <TableHead className="min-w-24 text-center">비슷한 정도</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {similarTransactions.map((item) => (
                            <EstateSimilarTransactionTableRow key={item.transaction.id} item={item} />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function EstateSimilarTransactionTableRow({ item }: { item: EstateSimilarTransactionItem }) {
    const navigate = useNavigate();
    const transaction = item.transaction;
    const transactionDetailParams = {
        transactionId: String(transaction.id)
    };

    function handleClick() {
        navigateToTransactionDetail();
    }

    function handleDetailLinkClick(event: MouseEvent<HTMLAnchorElement>) {
        event.stopPropagation();
    }

    function navigateToTransactionDetail() {
        void navigate({
            to: "/estate/transactions/$transactionId",
            params: transactionDetailParams
        });
    }

    return (
        <TableRow className="cursor-pointer" onClick={handleClick}>
            <TableCell>{transaction.legalDongName}</TableCell>
            <TableCell>
                <Link
                    to="/estate/transactions/$transactionId"
                    params={transactionDetailParams}
                    className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={handleDetailLinkClick}
                >
                    {transaction.buildingName ?? "건물명 없음"}
                </Link>
            </TableCell>
            <TableCell>{transaction.buildingUse}</TableCell>
            <TableCell className="min-w-32 text-center tabular-nums">
                {formatArea(transaction.buildingAreaSquareMeter)}
            </TableCell>
            <TableCell>{formatDealAmount(transaction.dealAmount10kKrw)}</TableCell>
            <TableCell>{transaction.contractDate}</TableCell>
            <TableCell className="min-w-20 text-center">
                <Badge variant="secondary">{formatScore(item.score)}</Badge>
            </TableCell>
        </TableRow>
    );
}

export function EstateSimilarTransactionListLoading() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>비슷한 조건의 거래</CardTitle>
                <CardDescription>현재 거래와 조건이 가까운 실거래를 보여드려요.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner />
                    비슷한 거래를 찾는 중
                </div>
            </CardContent>
        </Card>
    );
}

export function renderEstateSimilarTransactionListError({
    error,
    reset
}: EstateSimilarTransactionListErrorRenderProps) {
    const message = getEstateSimilarTransactionErrorMessage(error);

    return (
        <Card>
            <CardHeader>
                <CardTitle>비슷한 조건의 거래</CardTitle>
                <CardDescription>현재 거래와 조건이 가까운 실거래를 보여드려요.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertTitle>{message.title}</AlertTitle>
                    <AlertDescription className="flex flex-col items-start gap-2">
                        <span>{message.description}</span>
                        <Button type="button" variant="link" className="h-auto p-0 text-destructive" onClick={reset}>
                            다시 시도
                        </Button>
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}

function getEstateSimilarTransactionErrorMessage(error: Error) {
    if (error instanceof ApiClientError && error.error.code === "ESTATE_EMBEDDING_NOT_FOUND") {
        return {
            title: "추천을 준비하고 있습니다.",
            description: "데이터 준비가 끝나면 비슷한 거래를 확인할 수 있어요."
        };
    }

    return {
        title: "추천 거래를 불러오지 못했습니다.",
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
