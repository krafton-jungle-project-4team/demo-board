import { useMutation } from "@tanstack/react-query";
import type { EstateSimilarTransactionRequest } from "@nmm/shared";
import { findSimilarEstateTransactions } from "./estate-api";

export function useFindSimilarEstateTransactionsMutation() {
    return useMutation({
        mutationFn: (request: EstateSimilarTransactionRequest) => findSimilarEstateTransactions(request)
    });
}
