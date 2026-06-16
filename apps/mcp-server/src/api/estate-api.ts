import {
    EstateLegalDongListResponseSchema,
    EstateMarketSummaryResponseSchema,
    EstateSimilarTransactionResponseSchema,
    EstateTransactionListResponseSchema,
    EstateTransactionResponseSchema,
    type EstateLegalDongListResponse,
    type EstateMarketSummaryRequest,
    type EstateMarketSummaryResponse,
    type EstateSimilarTransactionRequest,
    type EstateSimilarTransactionResponse,
    type EstateTransactionFilter,
    type EstateTransactionListQuery,
    type EstateTransactionListResponse,
    type EstateTransactionResponse
} from "@nmm/shared";
import { requestApiData } from "./http-client.js";

export function getEstateTransactions(query: EstateTransactionListQuery): Promise<EstateTransactionListResponse> {
    return requestApiData("estate/transactions", EstateTransactionListResponseSchema, {
        searchParams: createEstateTransactionListSearchParams(query)
    });
}

export function getEstateLegalDongs(): Promise<EstateLegalDongListResponse> {
    return requestApiData("estate/legal-dongs", EstateLegalDongListResponseSchema);
}

export function getEstateTransaction(transactionId: number): Promise<EstateTransactionResponse> {
    return requestApiData(`estate/transactions/${transactionId}`, EstateTransactionResponseSchema);
}

export function findSimilarEstateTransactions(
    request: EstateSimilarTransactionRequest
): Promise<EstateSimilarTransactionResponse> {
    return requestApiData("estate/ai/transactions/similar", EstateSimilarTransactionResponseSchema, {
        method: "POST",
        body: request
    });
}

export function summarizeEstateMarket(query: EstateMarketSummaryRequest): Promise<EstateMarketSummaryResponse> {
    return requestApiData("estate/ai/market-summary", EstateMarketSummaryResponseSchema, {
        searchParams: createEstateFilterSearchParams(query)
    });
}

function createEstateTransactionListSearchParams(query: EstateTransactionListQuery) {
    const searchParams = new URLSearchParams();

    setSearchParam(searchParams, "page", query.page);
    setSearchParam(searchParams, "pageSize", query.pageSize);
    setSearchParam(searchParams, "q", query.q);
    setSearchParam(searchParams, "legalDongName", query.legalDongName);

    return searchParams;
}

function createEstateFilterSearchParams(query: EstateTransactionFilter) {
    const searchParams = new URLSearchParams();

    setSearchParam(searchParams, "q", query.q);
    setSearchParam(searchParams, "districtName", query.districtName);
    setSearchParam(searchParams, "legalDongName", query.legalDongName);
    setSearchParam(searchParams, "buildingName", query.buildingName);
    setSearchParam(searchParams, "buildingUse", query.buildingUse);
    setSearchParam(searchParams, "contractDateFrom", query.contractDateFrom);
    setSearchParam(searchParams, "contractDateTo", query.contractDateTo);
    setSearchParam(searchParams, "dealAmountMin10kKrw", query.dealAmountMin10kKrw);
    setSearchParam(searchParams, "dealAmountMax10kKrw", query.dealAmountMax10kKrw);
    setSearchParam(searchParams, "areaMinSquareMeter", query.areaMinSquareMeter);
    setSearchParam(searchParams, "areaMaxSquareMeter", query.areaMaxSquareMeter);
    setSearchParam(searchParams, "includeCanceled", query.includeCanceled);

    return searchParams;
}

function setSearchParam(searchParams: URLSearchParams, key: string, value: unknown) {
    if (value === undefined || value === null || value === "") {
        return;
    }

    searchParams.set(key, String(value));
}
