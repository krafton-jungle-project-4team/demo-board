import { useMutation } from "@tanstack/react-query";
import type { EstateAgentChatRequest, EstateSimilarTransactionRequest } from "@nmm/shared";
import { chatWithEstateAgent, findSimilarEstateTransactions } from "./estate-api";

export function useFindSimilarEstateTransactionsMutation() {
    return useMutation({
        mutationFn: (request: EstateSimilarTransactionRequest) => findSimilarEstateTransactions(request)
    });
}

export function useChatWithEstateAgentMutation() {
    return useMutation({
        mutationFn: (request: EstateAgentChatRequest) => chatWithEstateAgent(request)
    });
}
