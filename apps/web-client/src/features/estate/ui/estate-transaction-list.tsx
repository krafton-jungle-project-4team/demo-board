import { useSuspenseQuery } from "@tanstack/react-query";
import type { EstateTransactionListQuery } from "@nmm/shared";
import { Alert, AlertDescription, AlertTitle } from "@nmm/ui/components/alert";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@nmm/ui/components/empty";
import { Spinner } from "@nmm/ui/components/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nmm/ui/components/table";
import { estateTransactionListQueryOptions } from "@/features/estate/api/estate-queries";

export type AreaUnit = "squareMeter" | "pyeong";

type EstateTransactionListProps = {
    query: EstateTransactionListQuery;
    areaUnit: AreaUnit;
    onAreaUnitToggle: () => void;
};

export function EstateTransactionList({ query, areaUnit, onAreaUnitToggle }: EstateTransactionListProps) {
    const transactionsQuery = useSuspenseQuery(estateTransactionListQueryOptions(query));
    const transactions = transactionsQuery.data;

    if (transactions.length === 0) {
        return (
            <Empty>
                <EmptyHeader>
                    <EmptyTitle>검색 결과가 없습니다.</EmptyTitle>
                    <EmptyDescription>다른 법정동으로 다시 검색해보세요.</EmptyDescription>
                </EmptyHeader>
            </Empty>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>검색 결과</CardTitle>
                <CardDescription>{transactions.length.toLocaleString("ko-KR")}개</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>법정동</TableHead>
                            <TableHead>건물명</TableHead>
                            <TableHead>용도</TableHead>
                            <TableHead className="min-w-32 text-center">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="mx-auto"
                                    onClick={onAreaUnitToggle}
                                >
                                    면적({getAreaUnitLabel(areaUnit)})
                                </Button>
                            </TableHead>
                            <TableHead className="min-w-20 text-center">층</TableHead>
                            <TableHead>거래금액</TableHead>
                            <TableHead>계약일</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                                <TableCell>{transaction.legalDongName}</TableCell>
                                <TableCell>{transaction.buildingName ?? "-"}</TableCell>
                                <TableCell>{transaction.buildingUse}</TableCell>
                                <TableCell className="min-w-32 text-center tabular-nums">
                                    {formatArea(transaction.buildingAreaSquareMeter, areaUnit)}
                                </TableCell>
                                <TableCell className="min-w-20 text-center tabular-nums">
                                    {transaction.floor === null ? "-" : `${transaction.floor}층`}
                                </TableCell>
                                <TableCell>{transaction.dealAmount10kKrw.toLocaleString("ko-KR")}만원</TableCell>
                                <TableCell>{transaction.contractDate}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function getAreaUnitLabel(areaUnit: AreaUnit) {
    return areaUnit === "squareMeter" ? "㎡" : "평";
}

function formatArea(areaSquareMeter: string, areaUnit: AreaUnit) {
    const squareMeter = Number(areaSquareMeter);

    if (areaUnit === "pyeong") {
        return `${(squareMeter / 3.305785).toLocaleString("ko-KR", {
            maximumFractionDigits: 1
        })}평`;
    }

    return `${squareMeter.toLocaleString("ko-KR", {
        maximumFractionDigits: 2
    })}㎡`;
}

export function EstateTransactionListLoading() {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            불러오는 중
        </div>
    );
}

type EstateTransactionListErrorRenderProps = {
    reset: () => void;
};

export function renderEstateTransactionListError({ reset }: EstateTransactionListErrorRenderProps) {
    return (
        <Alert variant="destructive">
            <AlertTitle>실거래가를 불러오지 못했습니다.</AlertTitle>
            <AlertDescription>
                <Button type="button" variant="link" className="h-auto p-0 text-destructive" onClick={reset}>
                    다시 시도
                </Button>
            </AlertDescription>
        </Alert>
    );
}
