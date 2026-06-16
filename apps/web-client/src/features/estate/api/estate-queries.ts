import { queryOptions } from "@tanstack/react-query";
import type {
    EstateNearbyTransportQuery,
    EstateSimilarTransactionRequest,
    EstateTransactionListQuery,
    EstateWalkTimeToTransportQuery
} from "@nmm/shared";
import {
    findSimilarEstateTransactions,
    getEstateLegalDongs,
    getEstateNearbyTransportByTransaction,
    getEstateTransaction,
    getEstateTransactions,
    getEstateWalkTimeToTransportByTransaction
} from "./estate-api";

const estateQueryKeyRoot = ["estate"] as const; //리액트 쿼리로 부동산 관련 데이터인걸 입력
const ESTATE_SIMILAR_TRANSACTION_LIMIT = 5;

//리액트쿼리 캐시에 붙일 분류라벨 만드는 함수
export const estateQueryKeys = {
    all: estateQueryKeyRoot,
    legalDongList: () => [...estateQueryKeyRoot, "legal-dongs", "list"] as const,
    transactionList: (query: EstateTransactionListQuery) =>
        [...estateQueryKeyRoot, "transactions", "list", query] as const,
    transaction: (transactionId: number) => [...estateQueryKeyRoot, "transactions", transactionId] as const,
    nearbyTransportByTransaction: (transactionId: number, query: EstateNearbyTransportQuery) =>
        [...estateQueryKeyRoot, "transactions", transactionId, "nearby-transport", query] as const,
    walkTimeToTransportByTransaction: (transactionId: number, query: EstateWalkTimeToTransportQuery) =>
        [...estateQueryKeyRoot, "transactions", transactionId, "walk-time-to-transport", query] as const,
    similarTransactions: (transactionId: number) =>
        [...estateQueryKeyRoot, "transactions", transactionId, "similar"] as const
};

//어떤 데이터를 받아올지 설정
export function estateTransactionListQueryOptions(query: EstateTransactionListQuery) {
    return queryOptions({
        queryKey: estateQueryKeys.transactionList(query),
        queryFn: () => getEstateTransactions(query)
    });
}

export function estateTransactionQueryOptions(transactionId: number) {
    return queryOptions({
        queryKey: estateQueryKeys.transaction(transactionId),
        queryFn: () => getEstateTransaction(transactionId)
    });
}

export function estateLegalDongListQueryOptions() {
    return queryOptions({
        queryKey: estateQueryKeys.legalDongList(),
        queryFn: getEstateLegalDongs
    });
}

export function estateNearbyTransportByTransactionQueryOptions(
    transactionId: number,
    query: EstateNearbyTransportQuery
) {
    return queryOptions({
        queryKey: estateQueryKeys.nearbyTransportByTransaction(transactionId, query),
        queryFn: () => getEstateNearbyTransportByTransaction(transactionId, query)
    });
}

export function estateWalkTimeToTransportByTransactionQueryOptions(
    transactionId: number,
    query: EstateWalkTimeToTransportQuery
) {
    return queryOptions({
        queryKey: estateQueryKeys.walkTimeToTransportByTransaction(transactionId, query),
        queryFn: () => getEstateWalkTimeToTransportByTransaction(transactionId, query)
    });
}

export function estateSimilarTransactionsQueryOptions(transactionId: number) {
    const request: EstateSimilarTransactionRequest = {
        referenceTransactionId: transactionId,
        filters: {},
        limit: ESTATE_SIMILAR_TRANSACTION_LIMIT
    };

    return queryOptions({
        queryKey: estateQueryKeys.similarTransactions(transactionId),
        queryFn: () => findSimilarEstateTransactions(request)
    });
}
