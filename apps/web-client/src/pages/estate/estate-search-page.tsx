import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { EstateTransactionListQuery } from "@nmm/shared";
import { Alert, AlertDescription, AlertTitle } from "@nmm/ui/components/alert";
import { Button } from "@nmm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@nmm/ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@nmm/ui/components/empty";
import { Field, FieldLabel } from "@nmm/ui/components/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@nmm/ui/components/input-group";
import { Spinner } from "@nmm/ui/components/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@nmm/ui/components/table";
import { estateTransactionListQueryOptions } from "@/features/estate/api/estate-queries";

export function EstateSearchPage() {
    const [legalDongNameInput, setLegalDongNameInput] = useState("");
    const [query, setQuery] = useState<EstateTransactionListQuery>({});
    const transactionsQuery = useQuery(estateTransactionListQueryOptions(query));

    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const legalDongName = legalDongNameInput.trim();

        setQuery(legalDongName.length > 0 ? { legalDongName } : {});
    }

    function handleLegalDongNameInputChange(event: ChangeEvent<HTMLInputElement>) {
        setLegalDongNameInput(event.target.value);
    }

    return (
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">실거래가 검색</h1>
                <p className="text-sm text-muted-foreground">법정동 기준으로 실거래가를 조회해보세요.</p>
            </div>

            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSearchSubmit}>
                <Field>
                    <FieldLabel htmlFor="estate-legal-dong-search" className="sr-only">
                        법정동 검색
                    </FieldLabel>
                    <InputGroup>
                        <InputGroupAddon>
                            <SearchIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                            id="estate-legal-dong-search"
                            value={legalDongNameInput}
                            onChange={handleLegalDongNameInputChange}
                            placeholder="잠실동, 방이동, 오금동"
                            autoComplete="off"
                        />
                    </InputGroup>
                </Field>
                <Button type="submit" className="sm:w-24">
                    검색
                </Button>
            </form>

            {transactionsQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner />
                    불러오는 중
                </div>
            ) : null}

            {transactionsQuery.isError ? (
                <Alert variant="destructive">
                    <AlertTitle>실거래가를 불러오지 못했습니다.</AlertTitle>
                    <AlertDescription>잠시 후 다시 검색해주세요.</AlertDescription>
                </Alert>
            ) : null}

            {transactionsQuery.isSuccess && transactionsQuery.data.length === 0 ? (
                <Empty>
                    <EmptyHeader>
                        <EmptyTitle>검색 결과가 없습니다.</EmptyTitle>
                        <EmptyDescription>다른 법정동으로 다시 검색해보세요.</EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : null}

            {transactionsQuery.isSuccess && transactionsQuery.data.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>검색 결과</CardTitle>
                        <CardDescription>{transactionsQuery.data.length.toLocaleString("ko-KR")}개</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>법정동</TableHead>
                                    <TableHead>건물명</TableHead>
                                    <TableHead>용도</TableHead>
                                    <TableHead>면적</TableHead>
                                    <TableHead>층</TableHead>
                                    <TableHead>거래금액</TableHead>
                                    <TableHead>계약일</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactionsQuery.data.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell>{transaction.legalDongName}</TableCell>
                                        <TableCell>{transaction.buildingName ?? "-"}</TableCell>
                                        <TableCell>{transaction.buildingUse}</TableCell>
                                        <TableCell>{transaction.buildingAreaSquareMeter}㎡</TableCell>
                                        <TableCell>
                                            {transaction.floor === null ? "-" : `${transaction.floor}층`}
                                        </TableCell>
                                        <TableCell>
                                            {transaction.dealAmount10kKrw.toLocaleString("ko-KR")}만원
                                        </TableCell>
                                        <TableCell>{transaction.contractDate}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : null}
        </section>
    );
}
