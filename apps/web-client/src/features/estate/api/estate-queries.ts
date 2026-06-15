import { queryOptions } from "@tanstack/react-query";
import type { EstateTransactionListQuery } from "@nmm/shared";
import { getEstateLegalDongs, getEstateTransactions } from "./estate-api";

const estateQueryKeyRoot = ["estate"] as const; //리액트 쿼리로 부동산 관련 데이터인걸 입력

//리액트쿼리 캐시에 붙일 분류라벨 만드는 함수
export const estateQueryKeys = {
    all: estateQueryKeyRoot,
    legalDongList: () => [...estateQueryKeyRoot, "legal-dongs", "list"] as const,
    transactionList: (query: EstateTransactionListQuery) =>
        [...estateQueryKeyRoot, "transactions", "list", query] as const
};

//어떤 데이터를 받아올지 설정
export function estateTransactionListQueryOptions(query: EstateTransactionListQuery) {
    return queryOptions({
        queryKey: estateQueryKeys.transactionList(query),
        queryFn: () => getEstateTransactions(query)
    });
}

export function estateLegalDongListQueryOptions() {
    return queryOptions({
        queryKey: estateQueryKeys.legalDongList(),
        queryFn: getEstateLegalDongs
    });
}
