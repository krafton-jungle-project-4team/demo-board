import { useMutation } from "@tanstack/react-query";
import type { EstateAgentRequest, EstateSimilarTransactionRequest } from "@nmm/shared";
import { findSimilarEstateTransactions, runEstateAgent } from "./estate-api";

export function useFindSimilarEstateTransactionsMutation() {
    return useMutation({
        mutationFn: (request: EstateSimilarTransactionRequest) => findSimilarEstateTransactions(request)
    });
}

export function useEstateAgentMutation() {
    return useMutation({
        mutationFn: (request: EstateAgentRequest) => runEstateAgent(request)
    });
}
