import { useQuery, useQueryErrorResetBoundary } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { Suspense, useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { DEFAULT_ESTATE_TRANSACTION_LIST_QUERY } from "@nmm/shared";
import type { EstateTransactionListQuery } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import { Field, FieldLabel } from "@nmm/ui/components/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@nmm/ui/components/input-group";
import { NativeSelect, NativeSelectOption } from "@nmm/ui/components/native-select";
import { AppErrorBoundary } from "@/app/providers/app-error-boundary";
import {
    estateLegalDongListQueryOptions,
    EstateTransactionList,
    EstateTransactionListLoading,
    renderEstateTransactionListError,
    type AreaUnit
} from "@/features/estate";

export function EstateSearchPage() {
    const { reset } = useQueryErrorResetBoundary();
    const legalDongListQuery = useQuery(estateLegalDongListQueryOptions());
    const [searchKeywordInput, setSearchKeywordInput] = useState("");
    const [legalDongNameFilter, setLegalDongNameFilter] = useState("");
    const [query, setQuery] = useState<EstateTransactionListQuery>(DEFAULT_ESTATE_TRANSACTION_LIST_QUERY);
    const [areaUnit, setAreaUnit] = useState<AreaUnit>("squareMeter");
    const queryBoundaryKey = JSON.stringify(query);

    function handleSearchSubmit(event: SubmitEvent) {
        event.preventDefault();

        setQuery(createEstateTransactionListQuery(searchKeywordInput, legalDongNameFilter));
    }

    function handleSearchKeywordInputChange(event: ChangeEvent<HTMLInputElement>) {
        setSearchKeywordInput(event.target.value);
    }

    function handleLegalDongNameFilterChange(event: ChangeEvent<HTMLSelectElement>) {
        const legalDongName = event.target.value;

        setLegalDongNameFilter(legalDongName);
        setQuery(createEstateTransactionListQuery(searchKeywordInput, legalDongName));
    }

    function handleAreaUnitToggle() {
        setAreaUnit((currentAreaUnit) => (currentAreaUnit === "squareMeter" ? "pyeong" : "squareMeter"));
    }

    function handlePageChange(page: number) {
        setQuery((currentQuery) => ({
            ...currentQuery,
            page
        }));
    }

    return (
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">실거래가 검색</h1>
                <p className="text-sm text-muted-foreground">법정동, 건물명, 용도로 실거래가를 조회해보세요.</p>
            </div>

            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSearchSubmit}>
                <Field>
                    <FieldLabel htmlFor="estate-transaction-search" className="sr-only">
                        실거래가 검색
                    </FieldLabel>
                    <InputGroup>
                        <InputGroupAddon>
                            <SearchIcon />
                        </InputGroupAddon>
                        <InputGroupInput
                            id="estate-transaction-search"
                            value={searchKeywordInput}
                            onChange={handleSearchKeywordInputChange}
                            placeholder="거여동 정원빌라, 잠실동 아파트"
                            autoComplete="off"
                        />
                    </InputGroup>
                </Field>
                <Field className="sm:w-40">
                    <FieldLabel htmlFor="estate-legal-dong-filter" className="sr-only">
                        법정동 필터
                    </FieldLabel>
                    <NativeSelect
                        id="estate-legal-dong-filter"
                        value={legalDongNameFilter}
                        onChange={handleLegalDongNameFilterChange}
                        disabled={legalDongListQuery.isLoading || legalDongListQuery.isError}
                        className="w-full"
                    >
                        <NativeSelectOption value="">전체 동</NativeSelectOption>
                        {(legalDongListQuery.data ?? []).map((legalDongName) => (
                            <NativeSelectOption key={legalDongName} value={legalDongName}>
                                {legalDongName}
                            </NativeSelectOption>
                        ))}
                    </NativeSelect>
                </Field>
                <Button type="submit" className="sm:w-24">
                    검색
                </Button>
            </form>

            <AppErrorBoundary key={queryBoundaryKey} onReset={reset} fallback={renderEstateTransactionListError}>
                <Suspense fallback={<EstateTransactionListLoading />}>
                    <EstateTransactionList
                        query={query}
                        areaUnit={areaUnit}
                        onAreaUnitToggle={handleAreaUnitToggle}
                        onPageChange={handlePageChange}
                    />
                </Suspense>
            </AppErrorBoundary>
        </section>
    );
}

function createEstateTransactionListQuery(searchKeywordInput: string, legalDongNameFilter: string) {
    const q = searchKeywordInput.trim();
    const legalDongName = legalDongNameFilter.trim();

    return {
        ...DEFAULT_ESTATE_TRANSACTION_LIST_QUERY,
        q: q.length > 0 ? q : undefined,
        legalDongName: legalDongName.length > 0 ? legalDongName : undefined
    };
}
