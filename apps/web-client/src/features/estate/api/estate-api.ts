import {
    EstateTransactionListResponseSchema,
    type EstateTransactionListQuery,
    type EstateTransactionListResponse
} from "@nmm/shared";
import { requestApiData } from "@/shared/api/http-client";

export function getEstateTransactions(query: EstateTransactionListQuery): Promise<EstateTransactionListResponse> {
    return requestApiData(
        `estate/transactions?${createEstateTransactionListSearchParams(query)}`,
        EstateTransactionListResponseSchema
    );
}

function createEstateTransactionListSearchParams(query: EstateTransactionListQuery) {
    const searchParams = new URLSearchParams();

    if (query.legalDongName) {
        searchParams.set("legalDongName", query.legalDongName);
    }

    if (query.buildingUse) {
        searchParams.set("buildingUse", query.buildingUse);
    }

    if (query.buildingName) {
        searchParams.set("buildingName", query.buildingName);
    }

    return searchParams.toString();
}