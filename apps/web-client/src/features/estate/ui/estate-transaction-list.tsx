import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { MouseEvent, ReactNode } from "react";
import type { EstateTransactionListItem, EstateTransactionListQuery, EstateTransactionListResponse } from "@nmm/shared";
import { Alert, AlertDescription, AlertTitle } from "@nmm/ui/components/alert";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@nmm/ui/components/empty";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@nmm/ui/components/pagination";
import { Spinner } from "@nmm/ui/components/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nmm/ui/components/table";
import { estateTransactionListQueryOptions } from "@/features/estate/api/estate-queries";

const DISABLED_PAGINATION_LINK_CLASS_NAME = "pointer-events-none opacity-50";
const MAX_VISIBLE_PAGE_COUNT = 5;
const SQUARE_METERS_PER_PYEONG = 3.305785;

export type AreaUnit = "squareMeter" | "pyeong";

type EstateTransactionListProps = {
    query: EstateTransactionListQuery;
    areaUnit: AreaUnit;
    onAreaUnitToggle: () => void;
    onPageChange: (page: number) => void;
};

export function EstateTransactionList({ query, areaUnit, onAreaUnitToggle, onPageChange }: EstateTransactionListProps) {
    const transactionsQuery = useSuspenseQuery(estateTransactionListQueryOptions(query));
    const transactionList = transactionsQuery.data;

    if (transactionList.items.length === 0) {
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
                <CardDescription>{transactionList.totalItems.toLocaleString("ko-KR")}개</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
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
                        {transactionList.items.map((transaction) => (
                            <EstateTransactionTableRow
                                key={transaction.id}
                                transaction={transaction}
                                areaUnit={areaUnit}
                            />
                        ))}
                    </TableBody>
                </Table>
                <EstateTransactionListPagination
                    query={query}
                    transactionList={transactionList}
                    onPageChange={onPageChange}
                />
            </CardContent>
        </Card>
    );
}

type EstateTransactionTableRowProps = {
    transaction: EstateTransactionListItem;
    areaUnit: AreaUnit;
};

function EstateTransactionTableRow({ transaction, areaUnit }: EstateTransactionTableRowProps) {
    const navigate = useNavigate();

    function handleClick() {
        void navigate({
            to: "/estate/transactions/$transactionId",
            params: {
                transactionId: String(transaction.id)
            }
        });
    }

    return (
        <TableRow className="cursor-pointer" onClick={handleClick}>
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
    );
}

type EstateTransactionListPaginationProps = {
    query: EstateTransactionListQuery;
    transactionList: EstateTransactionListResponse;
    onPageChange: (page: number) => void;
};

function EstateTransactionListPagination({
    query,
    transactionList,
    onPageChange
}: EstateTransactionListPaginationProps) {
    if (transactionList.totalPages <= 1) {
        return null;
    }

    const previousPage = Math.max(1, transactionList.page - 1);
    const nextPage = Math.min(transactionList.totalPages, transactionList.page + 1);
    const visiblePages = getVisiblePages(transactionList.page, transactionList.totalPages);

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <EstateTransactionPreviousPageLink
                        query={query}
                        page={previousPage}
                        disabled={!transactionList.hasPreviousPage}
                        onPageChange={onPageChange}
                    />
                </PaginationItem>
                {visiblePages.map((pageItem) =>
                    pageItem === "ellipsis" ? (
                        <PaginationItem key={pageItem}>
                            <PaginationEllipsis />
                        </PaginationItem>
                    ) : (
                        <PaginationItem key={pageItem}>
                            <EstateTransactionPageLink
                                query={query}
                                page={pageItem}
                                isActive={pageItem === transactionList.page}
                                onPageChange={onPageChange}
                            >
                                {pageItem}
                            </EstateTransactionPageLink>
                        </PaginationItem>
                    )
                )}
                <PaginationItem>
                    <EstateTransactionNextPageLink
                        query={query}
                        page={nextPage}
                        disabled={!transactionList.hasNextPage}
                        onPageChange={onPageChange}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}

type EstateTransactionPageLinkProps = {
    query: EstateTransactionListQuery;
    page: number;
    isActive?: boolean;
    disabled?: boolean;
    onPageChange: (page: number) => void;
    children?: ReactNode;
};

function EstateTransactionPageLink({
    query,
    page,
    isActive,
    disabled,
    onPageChange,
    children
}: EstateTransactionPageLinkProps) {
    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();

        if (disabled || isActive) {
            return;
        }

        onPageChange(page);
    }

    return (
        <PaginationLink
            href={createEstateTransactionListPageHref(query, page)}
            isActive={isActive}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            className={disabled ? DISABLED_PAGINATION_LINK_CLASS_NAME : undefined}
            onClick={handleClick}
        >
            {children}
        </PaginationLink>
    );
}

function EstateTransactionPreviousPageLink({ query, page, disabled, onPageChange }: EstateTransactionPageLinkProps) {
    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();

        if (disabled) {
            return;
        }

        onPageChange(page);
    }

    return (
        <PaginationPrevious
            href={createEstateTransactionListPageHref(query, page)}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            className={disabled ? DISABLED_PAGINATION_LINK_CLASS_NAME : undefined}
            onClick={handleClick}
        />
    );
}

function EstateTransactionNextPageLink({ query, page, disabled, onPageChange }: EstateTransactionPageLinkProps) {
    function handleClick(event: MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();

        if (disabled) {
            return;
        }

        onPageChange(page);
    }

    return (
        <PaginationNext
            href={createEstateTransactionListPageHref(query, page)}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            className={disabled ? DISABLED_PAGINATION_LINK_CLASS_NAME : undefined}
            onClick={handleClick}
        />
    );
}

type VisiblePageItem = number | "ellipsis";

function getVisiblePages(page: number, totalPages: number): VisiblePageItem[] {
    if (totalPages <= MAX_VISIBLE_PAGE_COUNT) {
        return Array.from({ length: totalPages }, createPageNumber);
    }

    if (page <= 3) {
        return [1, 2, 3, 4, "ellipsis", totalPages];
    }

    if (page >= totalPages - 2) {
        return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
}

function createPageNumber(_: unknown, index: number) {
    return index + 1;
}

function createEstateTransactionListPageHref(query: EstateTransactionListQuery, page: number) {
    const searchParams = new URLSearchParams({
        page: String(page),
        pageSize: String(query.pageSize)
    });

    if (query.q) {
        searchParams.set("q", query.q);
    }

    if (query.legalDongName) {
        searchParams.set("legalDongName", query.legalDongName);
    }

    return `/estate?${searchParams.toString()}`;
}

function getAreaUnitLabel(areaUnit: AreaUnit) {
    return areaUnit === "squareMeter" ? "㎡" : "평";
}

function formatArea(areaSquareMeter: string, areaUnit: AreaUnit) {
    const squareMeter = Number(areaSquareMeter);

    if (areaUnit === "pyeong") {
        return `${(squareMeter / SQUARE_METERS_PER_PYEONG).toLocaleString("ko-KR", {
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
