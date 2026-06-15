import {
    EstateTransactionListResponseSchema,
    type EstateTransactionListQuery,
    type EstateTransactionListResponse
} from "@nmm/shared";
import { requestApiData } from "@/shared/api/http-client";

export function getEstateTransactions(query: EstateTransactionListQuery): Promise<EstateTransactionListResponse> {
    return requestApiData(createEstateTransactionListPath(query), EstateTransactionListResponseSchema);
}

function createEstateTransactionListPath(query: EstateTransactionListQuery) {
    const searchParams = createEstateTransactionListSearchParams(query);

    return searchParams.length > 0 ? `estate/transactions?${searchParams}` : "estate/transactions";
}

function createEstateTransactionListSearchParams(query: EstateTransactionListQuery) {
    const searchParams = new URLSearchParams();

    if (query.q) {
        searchParams.set("q", query.q);
    }

    return searchParams.toString();
}
