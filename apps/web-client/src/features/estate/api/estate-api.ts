import {
    EstateLegalDongListResponseSchema,
    EstateNearbyTransportResponseSchema,
    EstateSimilarTransactionResponseSchema,
    EstateTransactionListResponseSchema,
    EstateTransactionResponseSchema,
    EstateWalkTimeToTransportResponseSchema,
    type EstateLegalDongListResponse,
    type EstateNearbyTransportQuery,
    type EstateNearbyTransportResponse,
    type EstateSimilarTransactionRequest,
    type EstateSimilarTransactionResponse,
    type EstateTransactionListQuery,
    type EstateTransactionListResponse,
    type EstateTransactionResponse,
    type EstateWalkTimeToTransportQuery,
    type EstateWalkTimeToTransportResponse
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

export function getEstateNearbyTransportByTransaction(
    transactionId: number,
    query: EstateNearbyTransportQuery
): Promise<EstateNearbyTransportResponse> {
    return requestApiData(
        `estate/transactions/${transactionId}/nearby-transport?${createEstateNearbyTransportSearchParams(query)}`,
        EstateNearbyTransportResponseSchema
    );
}

export function getEstateWalkTimeToTransportByTransaction(
    transactionId: number,
    query: EstateWalkTimeToTransportQuery
): Promise<EstateWalkTimeToTransportResponse> {
    return requestApiData(
        `estate/transactions/${transactionId}/walk-time-to-transport?${createEstateWalkTimeToTransportSearchParams(query)}`,
        EstateWalkTimeToTransportResponseSchema
    );
}

export function findSimilarEstateTransactions(
    request: EstateSimilarTransactionRequest
): Promise<EstateSimilarTransactionResponse> {
    return requestApiData("estate/ai/transactions/similar", EstateSimilarTransactionResponseSchema, {
        method: "POST",
        json: request
    });
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

function createEstateNearbyTransportSearchParams(query: EstateNearbyTransportQuery) {
    const searchParams = new URLSearchParams();

    searchParams.set("transportType", query.transportType);
    searchParams.set("radiusKm", String(query.radiusKm));
    searchParams.set("limit", String(query.limit));

    return searchParams.toString();
}

function createEstateWalkTimeToTransportSearchParams(query: EstateWalkTimeToTransportQuery) {
    const searchParams = new URLSearchParams();

    searchParams.set("transportType", query.transportType);
    searchParams.set("radiusKm", String(query.radiusKm));
    searchParams.set("maxCandidates", String(query.maxCandidates));
    searchParams.set("searchOption", query.searchOption);

    return searchParams.toString();
}
