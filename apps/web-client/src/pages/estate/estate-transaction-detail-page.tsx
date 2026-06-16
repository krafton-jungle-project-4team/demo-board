import { Suspense } from "react";
import { useQueryErrorResetBoundary, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import type { EstateTransactionResponse } from "@nmm/shared";
import { Badge } from "@nmm/ui/components/badge";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Separator } from "@nmm/ui/components/separator";
import { AppErrorBoundary } from "@/app/providers/app-error-boundary";
import {
    EstateSimilarTransactionList,
    EstateSimilarTransactionListLoading,
    EstateTransactionAccessibilityCard,
    estateTransactionQueryOptions,
    renderEstateSimilarTransactionListError
} from "@/features/estate";

type EstateTransactionDetailPageProps = {
    transactionId: number;
};

const SQUARE_METERS_PER_PYEONG = 3.305785;

export function EstateTransactionDetailPage({ transactionId }: EstateTransactionDetailPageProps) {
    const { reset } = useQueryErrorResetBoundary();
    const transactionQuery = useSuspenseQuery(estateTransactionQueryOptions(transactionId));
    const transaction = transactionQuery.data;
    const address = createEstateTransactionAddress(transaction);

    return (
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <Button asChild variant="ghost" size="sm" className="w-fit">
                <Link to="/estate">
                    <ArrowLeftIcon data-icon="inline-start" />
                    검색으로
                </Link>
            </Button>

            <Card>
                <CardHeader className="gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex flex-col gap-2">
                            <CardTitle className="text-2xl">{transaction.buildingName ?? "건물명 없음"}</CardTitle>
                            <CardDescription>
                                {transaction.districtName} {transaction.legalDongName}
                                {address ? ` · ${address}` : ""}
                            </CardDescription>
                        </div>
                        <Badge variant={transaction.canceledAt ? "destructive" : "secondary"}>
                            {transaction.canceledAt ? "해제" : "거래 완료"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <EstateTransactionHighlight label="거래금액" value={formatDealAmount(transaction)} />
                        <EstateTransactionHighlight label="계약일" value={transaction.contractDate} />
                        <EstateTransactionHighlight
                            label="면적"
                            value={formatArea(transaction.buildingAreaSquareMeter)}
                        />
                    </div>

                    <Separator />

                    <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                        <EstateTransactionDetailItem label="용도" value={transaction.buildingUse} />
                        <EstateTransactionDetailItem label="층" value={formatFloor(transaction.floor)} />
                        <EstateTransactionDetailItem label="건축년도" value={`${transaction.builtYear}년`} />
                        <EstateTransactionDetailItem label="신고구분" value={transaction.reportType} />
                        <EstateTransactionDetailItem
                            label="대지면적"
                            value={formatNullableArea(transaction.landAreaSquareMeter)}
                        />
                        <EstateTransactionDetailItem label="권리구분" value={transaction.rightType ?? "-"} />
                        <EstateTransactionDetailItem
                            label="중개사 소재지"
                            value={transaction.brokeredAgentSggName ?? "-"}
                        />
                        <EstateTransactionDetailItem label="접수연도" value={`${transaction.receiptYear}년`} />
                        <EstateTransactionDetailItem
                            label="거래 원본 번호"
                            value={String(transaction.sourceRowNumber)}
                        />
                        <EstateTransactionDetailItem label="해제일" value={transaction.canceledAt ?? "-"} />
                    </dl>
                </CardContent>
            </Card>

            <EstateTransactionAccessibilityCard transactionId={transactionId} />

            <AppErrorBoundary key={transaction.id} fallback={renderEstateSimilarTransactionListError} onReset={reset}>
                <Suspense fallback={<EstateSimilarTransactionListLoading />}>
                    <EstateSimilarTransactionList transactionId={transaction.id} />
                </Suspense>
            </AppErrorBoundary>
        </section>
    );
}

function EstateTransactionHighlight({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-1 rounded-md border p-4">
            <span className="text-sm text-muted-foreground">{label}</span>
            <strong className="text-lg font-semibold tabular-nums">{value}</strong>
        </div>
    );
}

function EstateTransactionDetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="grid gap-1">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-medium tabular-nums">{value}</dd>
        </div>
    );
}

function createEstateTransactionAddress(transaction: EstateTransactionResponse) {
    const lotNumbers = [transaction.mainLotNumber, transaction.subLotNumber].filter(Boolean);

    if (lotNumbers.length === 0) {
        return "";
    }

    return lotNumbers.join("-");
}

function formatDealAmount(transaction: EstateTransactionResponse) {
    return `${transaction.dealAmount10kKrw.toLocaleString("ko-KR")}만원`;
}

function formatArea(squareMeter: number) {
    const pyeong = squareMeter / SQUARE_METERS_PER_PYEONG;

    return `${squareMeter.toLocaleString("ko-KR", {
        maximumFractionDigits: 2
    })}㎡ (${pyeong.toLocaleString("ko-KR", {
        maximumFractionDigits: 1
    })}평)`;
}

function formatNullableArea(squareMeter: number | null) {
    return squareMeter === null ? "-" : formatArea(squareMeter);
}

function formatFloor(floor: number | null) {
    return floor === null ? "-" : `${floor}층`;
}
