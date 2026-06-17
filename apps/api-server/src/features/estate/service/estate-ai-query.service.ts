import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import {
    EstateMarketSummaryResponseSchema,
    EstateSimilarTransactionResponseSchema,
    EstateTransactionResponseSchema,
    type EstateMarketSummaryRequest,
    type EstateMarketSummaryResponse,
    type EstateSimilarTransactionItem,
    type EstateSimilarTransactionRequest,
    type EstateSimilarTransactionResponse,
    type EstateTransactionFilter,
    type EstateTransactionResponse
} from "@nmm/shared";
import { DataSource } from "typeorm";
import { serverEnv } from "../../../infra/env";
import { ESTATE_ERRORS, createEstateError } from "../estate.errors";
import {
    createEmbedding,
    createEstateTransactionEmbeddingInput,
    toPgVector,
    type EstateEmbeddingSource
} from "./estate-embedding";

const SIMILAR_CANDIDATE_MULTIPLIER = 5;
const MAX_SIMILAR_CANDIDATE_LIMIT = 100;
const MIN_SIMILAR_VECTOR_SIMILARITY = 0.45;
const TEN_THOUSAND_KRW_PER_EOK = 10_000;
const SQUARE_METERS_PER_PYEONG = 3.305785;
const BUILDING_USE_KEYWORDS = ["아파트", "오피스텔", "연립", "다세대", "단독", "다가구"];

type EstateTransactionRow = {
    id: string;
    source_row_number: number;
    receipt_year: number;
    district_code: string;
    district_name: string;
    legal_dong_code: string;
    legal_dong_name: string;
    lot_type_code: string | null;
    lot_type_name: string | null;
    main_lot_number: string | null;
    sub_lot_number: string | null;
    building_name: string | null;
    contract_date: Date | string;
    deal_amount_10k_krw: number;
    building_area_square_meter: string;
    land_area_square_meter: string | null;
    floor: number | null;
    right_type: string | null;
    canceled_at: Date | string | null;
    built_year: number;
    building_use: string;
    report_type: string;
    brokered_agent_sgg_name: string | null;
};

type EstateTransactionEmbeddingRow = {
    embedding: string;
};

type SimilarTransactionRow = EstateTransactionRow & {
    vector_similarity: string;
};

type MarketSummaryRow = {
    total_count: string;
    latest_contract_date: Date | string | null;
    deal_amount_min_10k_krw: string | null;
    deal_amount_max_10k_krw: string | null;
    deal_amount_average_10k_krw: string | null;
    deal_amount_median_10k_krw: string | null;
    building_area_min_square_meter: string | null;
    building_area_max_square_meter: string | null;
    building_area_average_square_meter: string | null;
};

type WhereSql = {
    whereSql: string;
    values: unknown[];
    searchRankSql: string;
};

@Injectable()
export class EstateAiQueryService {
    constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

    async getTransaction(transactionId: number): Promise<EstateTransactionResponse> {
        const transaction = await this.findTransaction(transactionId);

        if (!transaction) {
            throw createEstateError(ESTATE_ERRORS.TRANSACTION_NOT_FOUND);
        }

        return transaction;
    }

    async findSimilarTransactions(request: EstateSimilarTransactionRequest): Promise<EstateSimilarTransactionResponse> {
        const filters = createSimilarTransactionFilter(request);
        const referenceTransaction =
            request.referenceTransactionId === undefined
                ? null
                : await this.getTransaction(request.referenceTransactionId);
        const queryEmbedding =
            request.referenceTransactionId === undefined
                ? await this.createQueryEmbedding(request.queryText ?? "")
                : await this.getTransactionEmbedding(request.referenceTransactionId);
        const rows = await this.findSimilarTransactionRows(
            queryEmbedding,
            { ...request, filters },
            referenceTransaction
        );
        const hasSpecificFilters = hasSpecificTransactionFilter(filters);
        const items = rows
            .map((row) => this.toSimilarTransactionItem(row, filters, referenceTransaction))
            .filter((item) => hasSpecificFilters || item.vectorSimilarity >= MIN_SIMILAR_VECTOR_SIMILARITY)
            .sort((left, right) => compareSimilarTransactionItems(left, right, request.sortBy))
            .slice(0, request.limit);

        return EstateSimilarTransactionResponseSchema.parse({ items });
    }

    async summarizeMarket(request: EstateMarketSummaryRequest): Promise<EstateMarketSummaryResponse> {
        const whereSql = this.createWhereSql(request);
        const rows = (await this.dataSource.query(
            `
            SELECT
                COUNT(*)::text AS total_count,
                MAX(contract_date) AS latest_contract_date,
                MIN(deal_amount_10k_krw)::text AS deal_amount_min_10k_krw,
                MAX(deal_amount_10k_krw)::text AS deal_amount_max_10k_krw,
                AVG(deal_amount_10k_krw)::text AS deal_amount_average_10k_krw,
                percentile_cont(0.5) WITHIN GROUP (ORDER BY deal_amount_10k_krw)::text
                    AS deal_amount_median_10k_krw,
                MIN(building_area_square_meter)::text AS building_area_min_square_meter,
                MAX(building_area_square_meter)::text AS building_area_max_square_meter,
                AVG(building_area_square_meter)::text AS building_area_average_square_meter
            FROM estate_transactions
            ${whereSql.whereSql}
            `,
            whereSql.values
        )) as MarketSummaryRow[];
        const row = rows[0];

        return EstateMarketSummaryResponseSchema.parse({
            totalCount: Number(row?.total_count ?? 0),
            latestContractDate: toDateString(row?.latest_contract_date ?? null),
            dealAmount10kKrw: {
                min: toNullableNumber(row?.deal_amount_min_10k_krw ?? null),
                max: toNullableNumber(row?.deal_amount_max_10k_krw ?? null),
                average: toNullableNumber(row?.deal_amount_average_10k_krw ?? null),
                median: toNullableNumber(row?.deal_amount_median_10k_krw ?? null)
            },
            buildingAreaSquareMeter: {
                min: toNullableNumber(row?.building_area_min_square_meter ?? null),
                max: toNullableNumber(row?.building_area_max_square_meter ?? null),
                average: toNullableNumber(row?.building_area_average_square_meter ?? null)
            }
        });
    }

    private async findTransaction(transactionId: number) {
        const rows = (await this.dataSource.query(
            `
            SELECT ${this.estateTransactionSelectSql()}
            FROM estate_transactions
            WHERE estate_transactions.id = $1
            `,
            [transactionId]
        )) as EstateTransactionRow[];
        const row = rows[0];

        return row ? this.toEstateTransactionResponse(row) : null;
    }

    private async getTransactionEmbedding(transactionId: number) {
        const rows = (await this.dataSource.query(
            `
            SELECT embedding::text AS embedding
            FROM estate_transaction_embeddings
            WHERE transaction_id = $1
            `,
            [transactionId]
        )) as EstateTransactionEmbeddingRow[];
        const embedding = rows[0]?.embedding;

        if (!embedding) {
            throw createEstateError(ESTATE_ERRORS.EMBEDDING_NOT_FOUND);
        }

        return embedding;
    }

    private async createQueryEmbedding(queryText: string) {
        await this.assertAnyEmbeddingExists();

        const embedding = await createEmbedding(queryText, serverEnv.ai.embedding);

        return toPgVector(embedding);
    }

    private async assertAnyEmbeddingExists() {
        const rows = (await this.dataSource.query(
            "SELECT EXISTS (SELECT 1 FROM estate_transaction_embeddings) AS has_embedding"
        )) as Array<{ has_embedding: boolean }>;

        if (rows[0]?.has_embedding !== true) {
            throw createEstateError(ESTATE_ERRORS.EMBEDDING_NOT_FOUND);
        }
    }

    private async findSimilarTransactionRows(
        queryEmbedding: string,
        request: EstateSimilarTransactionRequest,
        referenceTransaction: EstateTransactionResponse | null
    ) {
        const filter = request.filters;
        const whereSql = this.createWhereSql(filter, 1);
        const excludeReferenceSql = referenceTransaction
            ? `AND estate_transactions.id <> $${whereSql.values.length + 2}`
            : "";
        const limitParameterIndex = whereSql.values.length + (referenceTransaction ? 3 : 2);
        const candidateLimit = Math.min(request.limit * SIMILAR_CANDIDATE_MULTIPLIER, MAX_SIMILAR_CANDIDATE_LIMIT);
        const orderBySql =
            request.sortBy === "recent"
                ? "estate_transactions.contract_date DESC, estate_transactions.id DESC"
                : createSimilarTransactionOrderBySql(request.sortBy);
        const rows = (await this.dataSource.query(
            `
            SELECT
                ${this.estateTransactionSelectSql()},
                (1 - (estate_transaction_embeddings.embedding <=> $1::vector))::text AS vector_similarity
            FROM estate_transaction_embeddings
            JOIN estate_transactions
                ON estate_transactions.id = estate_transaction_embeddings.transaction_id
            ${whereSql.whereSql}
                ${excludeReferenceSql}
            ORDER BY ${orderBySql}
            LIMIT $${limitParameterIndex}
            `,
            [
                queryEmbedding,
                ...whereSql.values,
                ...(referenceTransaction ? [referenceTransaction.id] : []),
                candidateLimit
            ]
        )) as SimilarTransactionRow[];

        return rows;
    }

    private createWhereSql(filter: Partial<EstateTransactionFilter>, parameterOffset = 0): WhereSql {
        const values: unknown[] = [];
        const clauses: string[] = [];
        let searchRankSql = "0";

        if (filter.includeCanceled !== true) {
            clauses.push("estate_transactions.canceled_at IS NULL");
        }

        if (filter.q) {
            const parameterIndex = pushValue(values, filter.q, parameterOffset);
            const searchTargetSql = this.searchTargetSql(parameterIndex);
            clauses.push(`(${searchTargetSql})`);
            searchRankSql = this.searchRankSql(parameterIndex);
        }

        if (filter.districtName) {
            clauses.push(
                `estate_transactions.district_name = $${pushValue(values, filter.districtName, parameterOffset)}`
            );
        }

        if (filter.legalDongName) {
            const parameterIndex = pushValue(values, filter.legalDongName, parameterOffset);
            clauses.push(
                `(
                    estate_transactions.legal_dong_name = $${parameterIndex}
                    OR estate_transactions.legal_dong_name % $${parameterIndex}
                    OR estate_transactions.legal_dong_name %> $${parameterIndex}
                )`
            );
        }

        if (filter.buildingName) {
            const parameterIndex = pushValue(values, filter.buildingName, parameterOffset);
            clauses.push(
                `(
                    COALESCE(estate_transactions.building_name, '') = $${parameterIndex}
                    OR COALESCE(estate_transactions.building_name, '') % $${parameterIndex}
                    OR COALESCE(estate_transactions.building_name, '') %> $${parameterIndex}
                )`
            );
        }

        if (filter.buildingUse) {
            const parameterIndex = pushValue(values, filter.buildingUse, parameterOffset);
            clauses.push(
                `(
                    estate_transactions.building_use = $${parameterIndex}
                    OR estate_transactions.building_use % $${parameterIndex}
                    OR estate_transactions.building_use %> $${parameterIndex}
                )`
            );
        }

        if (filter.contractDateFrom) {
            clauses.push(
                `estate_transactions.contract_date >= $${pushValue(values, filter.contractDateFrom, parameterOffset)}::date`
            );
        }

        if (filter.contractDateTo) {
            clauses.push(
                `estate_transactions.contract_date <= $${pushValue(values, filter.contractDateTo, parameterOffset)}::date`
            );
        }

        if (filter.dealAmountMin10kKrw) {
            clauses.push(
                `estate_transactions.deal_amount_10k_krw >= $${pushValue(
                    values,
                    filter.dealAmountMin10kKrw,
                    parameterOffset
                )}`
            );
        }

        if (filter.dealAmountMax10kKrw) {
            clauses.push(
                `estate_transactions.deal_amount_10k_krw <= $${pushValue(
                    values,
                    filter.dealAmountMax10kKrw,
                    parameterOffset
                )}`
            );
        }

        if (filter.areaMinSquareMeter) {
            clauses.push(
                `estate_transactions.building_area_square_meter >= $${pushValue(
                    values,
                    filter.areaMinSquareMeter,
                    parameterOffset
                )}`
            );
        }

        if (filter.areaMaxSquareMeter) {
            clauses.push(
                `estate_transactions.building_area_square_meter <= $${pushValue(
                    values,
                    filter.areaMaxSquareMeter,
                    parameterOffset
                )}`
            );
        }

        return {
            whereSql: clauses.length > 0 ? `WHERE ${clauses.join("\nAND ")}` : "WHERE TRUE",
            values,
            searchRankSql
        };
    }

    private searchTargetSql(parameterIndex: number) {
        return `
            COALESCE(estate_transactions.building_name, '') % $${parameterIndex}
            OR COALESCE(estate_transactions.building_name, '') %> $${parameterIndex}
            OR estate_transactions.legal_dong_name % $${parameterIndex}
            OR estate_transactions.legal_dong_name %> $${parameterIndex}
            OR estate_transactions.building_use % $${parameterIndex}
            OR estate_transactions.building_use %> $${parameterIndex}
        `;
    }

    private searchRankSql(parameterIndex: number) {
        return `
            GREATEST(
                similarity(COALESCE(estate_transactions.building_name, ''), $${parameterIndex}),
                word_similarity($${parameterIndex}, COALESCE(estate_transactions.building_name, '')),
                similarity(estate_transactions.legal_dong_name, $${parameterIndex}),
                word_similarity($${parameterIndex}, estate_transactions.legal_dong_name),
                similarity(estate_transactions.building_use, $${parameterIndex}),
                word_similarity($${parameterIndex}, estate_transactions.building_use)
            )
        `;
    }

    private estateTransactionSelectSql() {
        return `
            estate_transactions.id::text AS id,
            estate_transactions.source_row_number,
            estate_transactions.receipt_year,
            estate_transactions.district_code,
            estate_transactions.district_name,
            estate_transactions.legal_dong_code,
            estate_transactions.legal_dong_name,
            estate_transactions.lot_type_code,
            estate_transactions.lot_type_name,
            estate_transactions.main_lot_number,
            estate_transactions.sub_lot_number,
            estate_transactions.building_name,
            estate_transactions.contract_date,
            estate_transactions.deal_amount_10k_krw,
            estate_transactions.building_area_square_meter,
            estate_transactions.land_area_square_meter,
            estate_transactions.floor,
            estate_transactions.right_type,
            estate_transactions.canceled_at,
            estate_transactions.built_year,
            estate_transactions.building_use,
            estate_transactions.report_type,
            estate_transactions.brokered_agent_sgg_name
        `;
    }

    private toEstateTransactionResponse(row: EstateTransactionRow): EstateTransactionResponse {
        return EstateTransactionResponseSchema.parse({
            id: Number(row.id),
            sourceRowNumber: row.source_row_number,
            receiptYear: row.receipt_year,
            districtCode: row.district_code,
            districtName: row.district_name,
            legalDongCode: row.legal_dong_code,
            legalDongName: row.legal_dong_name,
            lotTypeCode: row.lot_type_code,
            lotTypeName: row.lot_type_name,
            mainLotNumber: row.main_lot_number,
            subLotNumber: row.sub_lot_number,
            buildingName: row.building_name,
            contractDate: toDateString(row.contract_date),
            dealAmount10kKrw: row.deal_amount_10k_krw,
            buildingAreaSquareMeter: Number(row.building_area_square_meter),
            landAreaSquareMeter: toNullableNumber(row.land_area_square_meter),
            floor: row.floor,
            rightType: row.right_type,
            canceledAt: toDateString(row.canceled_at),
            builtYear: row.built_year,
            buildingUse: row.building_use,
            reportType: row.report_type,
            brokeredAgentSggName: row.brokered_agent_sgg_name
        });
    }

    private toSimilarTransactionItem(
        row: SimilarTransactionRow,
        filter: Partial<EstateTransactionFilter>,
        referenceTransaction: EstateTransactionResponse | null
    ): EstateSimilarTransactionItem {
        const transaction = this.toEstateTransactionResponse(row);
        const vectorSimilarity = clamp(Number(row.vector_similarity), -1, 1);
        const areaScore = referenceTransaction
            ? proximityScore(transaction.buildingAreaSquareMeter, referenceTransaction.buildingAreaSquareMeter)
            : rangeScore(transaction.buildingAreaSquareMeter, filter.areaMinSquareMeter, filter.areaMaxSquareMeter);
        const priceScore = referenceTransaction
            ? proximityScore(transaction.dealAmount10kKrw, referenceTransaction.dealAmount10kKrw)
            : rangeScore(transaction.dealAmount10kKrw, filter.dealAmountMin10kKrw, filter.dealAmountMax10kKrw);
        const legalDongScore = referenceTransaction
            ? exactMatchScore(transaction.legalDongName, referenceTransaction.legalDongName)
            : exactMatchScore(transaction.legalDongName, filter.legalDongName);
        const buildingUseScore = referenceTransaction
            ? exactMatchScore(transaction.buildingUse, referenceTransaction.buildingUse)
            : exactMatchScore(transaction.buildingUse, filter.buildingUse);
        const normalizedVectorSimilarity = clamp((vectorSimilarity + 1) / 2, 0, 1);
        const score = clamp(
            normalizedVectorSimilarity * 0.7 +
                areaScore * 0.1 +
                priceScore * 0.1 +
                legalDongScore * 0.05 +
                buildingUseScore * 0.05,
            0,
            1
        );

        return {
            transaction,
            score,
            vectorSimilarity,
            areaScore,
            priceScore,
            legalDongScore,
            buildingUseScore
        };
    }
}

function pushValue(values: unknown[], value: unknown, parameterOffset = 0) {
    values.push(value);

    return values.length + parameterOffset;
}

function toDateString(value: Date | string | null): string | null {
    if (value === null) {
        return null;
    }

    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }

    return value.slice(0, 10);
}

function toNullableNumber(value: string | null | undefined) {
    return value === null || value === undefined ? null : Number(value);
}

function proximityScore(candidateValue: number, referenceValue: number) {
    const denominator = Math.max(Math.abs(referenceValue), 1);
    const ratio = Math.abs(candidateValue - referenceValue) / denominator;

    return clamp(1 - ratio, 0, 1);
}

function rangeScore(candidateValue: number, minValue?: number, maxValue?: number) {
    if (minValue === undefined && maxValue === undefined) {
        return 0;
    }

    if (minValue !== undefined && maxValue !== undefined) {
        return proximityScore(candidateValue, (minValue + maxValue) / 2);
    }

    if (minValue !== undefined) {
        return candidateValue >= minValue ? 1 : proximityScore(candidateValue, minValue);
    }

    return maxValue !== undefined && candidateValue <= maxValue ? 1 : proximityScore(candidateValue, maxValue ?? 0);
}

function exactMatchScore(candidateValue: string, referenceValue?: string) {
    return referenceValue && candidateValue === referenceValue ? 1 : 0;
}

function compareSimilarTransactionItems(
    left: EstateSimilarTransactionItem,
    right: EstateSimilarTransactionItem,
    sortBy: EstateSimilarTransactionRequest["sortBy"]
) {
    if (sortBy === "recent") {
        return (
            right.transaction.contractDate.localeCompare(left.transaction.contractDate) ||
            right.transaction.id - left.transaction.id
        );
    }

    if (sortBy === "dealAmountDesc") {
        return (
            right.transaction.dealAmount10kKrw - left.transaction.dealAmount10kKrw ||
            right.transaction.contractDate.localeCompare(left.transaction.contractDate) ||
            right.transaction.id - left.transaction.id
        );
    }

    if (sortBy === "dealAmountAsc") {
        return (
            left.transaction.dealAmount10kKrw - right.transaction.dealAmount10kKrw ||
            right.transaction.contractDate.localeCompare(left.transaction.contractDate) ||
            right.transaction.id - left.transaction.id
        );
    }

    return right.score - left.score;
}

function createSimilarTransactionOrderBySql(sortBy: EstateSimilarTransactionRequest["sortBy"]) {
    if (sortBy === "dealAmountDesc") {
        return "estate_transactions.deal_amount_10k_krw DESC, estate_transactions.contract_date DESC, estate_transactions.id DESC";
    }

    if (sortBy === "dealAmountAsc") {
        return "estate_transactions.deal_amount_10k_krw ASC, estate_transactions.contract_date DESC, estate_transactions.id DESC";
    }

    return "estate_transaction_embeddings.embedding <=> $1::vector";
}

function hasSpecificTransactionFilter(filter: EstateTransactionFilter) {
    return (
        filter.q !== undefined ||
        filter.districtName !== undefined ||
        filter.legalDongName !== undefined ||
        filter.buildingName !== undefined ||
        filter.buildingUse !== undefined ||
        filter.contractDateFrom !== undefined ||
        filter.contractDateTo !== undefined ||
        filter.dealAmountMin10kKrw !== undefined ||
        filter.dealAmountMax10kKrw !== undefined ||
        filter.areaMinSquareMeter !== undefined ||
        filter.areaMaxSquareMeter !== undefined
    );
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function createSimilarTransactionFilter(request: EstateSimilarTransactionRequest): EstateTransactionFilter {
    const queryTextFilter =
        request.referenceTransactionId === undefined
            ? createTransactionFilterFromQueryText(request.queryText ?? "")
            : {};

    return {
        ...queryTextFilter,
        ...request.filters
    };
}

function createTransactionFilterFromQueryText(queryText: string): EstateTransactionFilter {
    const pyeongRange = parsePyeongRange(queryText);

    return {
        legalDongName: parseLegalDongName(queryText),
        buildingUse: parseBuildingUse(queryText),
        dealAmountMin10kKrw: parseDealAmount10kKrw(queryText, "min"),
        dealAmountMax10kKrw: parseDealAmount10kKrw(queryText, "max"),
        areaMinSquareMeter: pyeongRange ? toSquareMeter(pyeongRange.minPyeong) : undefined,
        areaMaxSquareMeter: pyeongRange ? toSquareMeter(pyeongRange.maxPyeong) : undefined
    };
}

function parseLegalDongName(queryText: string) {
    return /([가-힣]+동)/u.exec(queryText)?.[1];
}

function parseBuildingUse(queryText: string) {
    return BUILDING_USE_KEYWORDS.find((buildingUse) => queryText.includes(buildingUse));
}

function parseDealAmount10kKrw(queryText: string, direction: "min" | "max") {
    const pattern =
        direction === "max"
            ? /(\d+(?:\.\d+)?)\s*(억|만원)\s*(?:이하|미만|까지|이내|아래|안쪽|넘지)/u
            : /(\d+(?:\.\d+)?)\s*(억|만원)\s*(?:이상|초과|부터)/u;
    const match = pattern.exec(queryText);

    if (!match) {
        return undefined;
    }

    const amount = Number(match[1]);
    const unit = match[2];

    return unit === "억" ? amount * TEN_THOUSAND_KRW_PER_EOK : amount;
}

function parsePyeongRange(queryText: string) {
    const match = /(\d+(?:\.\d+)?)\s*평대/u.exec(queryText);

    if (!match) {
        return null;
    }

    const minPyeong = Number(match[1]);

    return {
        minPyeong,
        maxPyeong: minPyeong + 10
    };
}

function toSquareMeter(pyeong: number) {
    return pyeong * SQUARE_METERS_PER_PYEONG;
}

export function toEstateEmbeddingSource(transaction: EstateTransactionResponse): EstateEmbeddingSource {
    return {
        legalDongName: transaction.legalDongName,
        buildingName: transaction.buildingName,
        buildingUse: transaction.buildingUse,
        buildingAreaSquareMeter: transaction.buildingAreaSquareMeter,
        dealAmount10kKrw: transaction.dealAmount10kKrw,
        floor: transaction.floor,
        builtYear: transaction.builtYear,
        contractDate: transaction.contractDate
    };
}

export function createEstateEmbeddingInputFromTransaction(transaction: EstateTransactionResponse) {
    return createEstateTransactionEmbeddingInput(toEstateEmbeddingSource(transaction));
}
