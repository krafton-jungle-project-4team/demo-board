import {
    EstateLegalDongListResponseSchema,
    EstateTransactionResponseSchema,
    EstateTransactionListResponseSchema,
    type EstateLegalDongListResponse,
    type EstateTransactionResponse,
    type EstateTransactionListQuery,
    type EstateTransactionListResponse
} from "@nmm/shared";
import { requestApiData } from "@/shared/api/http-client";

export function getEstateTransactions(query: EstateTransactionListQuery): Promise<EstateTransactionListResponse> {
    return requestApiData(createEstateTransactionListPath(query), EstateTransactionListResponseSchema);
}

export function getEstateTransaction(transactionId: number): Promise<EstateTransactionResponse> {
    return requestApiData(`estate/transactions/${transactionId}`, EstateTransactionResponseSchema);
}

export function getEstateLegalDongs(): Promise<EstateLegalDongListResponse> {
    return requestApiData("estate/legal-dongs", EstateLegalDongListResponseSchema);
}

function createEstateTransactionListPath(query: EstateTransactionListQuery) {
    const searchParams = createEstateTransactionListSearchParams(query);

    return `estate/transactions?${searchParams}`;
}

function createEstateTransactionListSearchParams(query: EstateTransactionListQuery) {
    const searchParams = new URLSearchParams();

    searchParams.set("page", String(query.page));
    searchParams.set("pageSize", String(query.pageSize));

    if (query.q) {
        searchParams.set("q", query.q);
    }

    if (query.legalDongName) {
        searchParams.set("legalDongName", query.legalDongName);
    }

    return searchParams.toString();
}
