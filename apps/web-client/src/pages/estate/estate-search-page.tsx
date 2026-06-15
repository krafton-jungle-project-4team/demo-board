import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { Suspense, useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import type { EstateTransactionListQuery } from "@nmm/shared";
import { Button } from "@nmm/ui/components/button";
import { Field, FieldLabel } from "@nmm/ui/components/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@nmm/ui/components/input-group";
import { AppErrorBoundary } from "@/app/providers/app-error-boundary";
import {
    EstateTransactionList,
    EstateTransactionListLoading,
    renderEstateTransactionListError,
    type AreaUnit
} from "@/features/estate";

export function EstateSearchPage() {
    const { reset } = useQueryErrorResetBoundary();
    const [searchKeywordInput, setSearchKeywordInput] = useState("");
    const [query, setQuery] = useState<EstateTransactionListQuery>({});
    const [areaUnit, setAreaUnit] = useState<AreaUnit>("squareMeter");
    const queryBoundaryKey = JSON.stringify(query);

    function handleSearchSubmit(event: SubmitEvent) {
        event.preventDefault();

        const q = searchKeywordInput.trim();

        setQuery(q.length > 0 ? { q } : {});
    }

    function handleSearchKeywordInputChange(event: ChangeEvent<HTMLInputElement>) {
        setSearchKeywordInput(event.target.value);
    }

    function handleAreaUnitToggle() {
        setAreaUnit((currentAreaUnit) => (currentAreaUnit === "squareMeter" ? "pyeong" : "squareMeter"));
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
                <Button type="submit" className="sm:w-24">
                    검색
                </Button>
            </form>

            <AppErrorBoundary key={queryBoundaryKey} onReset={reset} fallback={renderEstateTransactionListError}>
                <Suspense fallback={<EstateTransactionListLoading />}>
                    <EstateTransactionList query={query} areaUnit={areaUnit} onAreaUnitToggle={handleAreaUnitToggle} />
                </Suspense>
            </AppErrorBoundary>
        </section>
    );
}
