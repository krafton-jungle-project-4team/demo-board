import { createHash } from "node:crypto";
import { ESTATE_ERRORS, createEstateError } from "../estate.errors";

export type EstateEmbeddingConfig = {
    provider: string;
    openAiApiKey?: string;
    openAiBaseUrl: string;
    model: string;
    dimensions: number;
};

export type EstateEmbeddingSource = {
    legalDongName: string;
    buildingName: string | null;
    buildingUse: string;
    buildingAreaSquareMeter: number;
    dealAmount10kKrw: number;
    floor: number | null;
    builtYear: number;
    contractDate: string;
};

type OpenAiEmbeddingResponse = {
    data?: Array<{
        embedding?: unknown;
    }>;
};

export function createEstateTransactionEmbeddingInput(source: EstateEmbeddingSource) {
    const buildingName = source.buildingName ?? "건물명 없음";
    const floorText = source.floor === null ? "층 정보 없음" : `${source.floor}층`;

    return [
        `법정동: ${source.legalDongName}`,
        `건물명: ${buildingName}`,
        `건물용도: ${source.buildingUse}`,
        `전용면적: ${source.buildingAreaSquareMeter}㎡`,
        `거래금액: ${source.dealAmount10kKrw}만원`,
        `층: ${floorText}`,
        `준공연도: ${source.builtYear}`,
        `거래일: ${source.contractDate}`
    ].join("\n");
}

export function createEstateTransactionContentHash(content: string) {
    return createHash("sha256").update(content).digest("hex");
}

export function toPgVector(embedding: number[]) {
    return `[${embedding.join(",")}]`;
}

export async function createEmbedding(input: string, config: EstateEmbeddingConfig) {
    if (config.provider !== "openai") {
        throw createEstateError(ESTATE_ERRORS.EMBEDDING_PROVIDER_UNSUPPORTED);
    }

    if (!config.openAiApiKey) {
        throw createEstateError(ESTATE_ERRORS.EMBEDDING_API_KEY_MISSING);
    }

    const response = await fetch(`${config.openAiBaseUrl}/embeddings`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${config.openAiApiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: config.model,
            input,
            dimensions: config.dimensions,
            encoding_format: "float"
        })
    });

    if (!response.ok) {
        throw createEstateError(ESTATE_ERRORS.EMBEDDING_REQUEST_FAILED);
    }

    const responseBody = (await response.json()) as OpenAiEmbeddingResponse;
    const embedding = responseBody.data?.[0]?.embedding;

    if (!Array.isArray(embedding) || embedding.some((value) => typeof value !== "number")) {
        throw createEstateError(ESTATE_ERRORS.EMBEDDING_REQUEST_FAILED);
    }

    if (embedding.length !== config.dimensions) {
        throw createEstateError(ESTATE_ERRORS.EMBEDDING_REQUEST_FAILED);
    }

    return embedding as number[];
}
