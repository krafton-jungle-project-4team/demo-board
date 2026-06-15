import { DataSource } from "typeorm";
import { serverEnv } from "../../../infra/env";
import {
    createEmbedding,
    createEstateTransactionContentHash,
    createEstateTransactionEmbeddingInput,
    toPgVector,
    type EstateEmbeddingSource
} from "../service/estate-embedding";

const DEFAULT_BATCH_SIZE = 100;

type SyncOptions = {
    limit: number | null;
    batchSize: number;
};

type SyncEstateTransactionRow = {
    id: string;
    legal_dong_name: string;
    building_name: string | null;
    building_use: string;
    building_area_square_meter: string;
    deal_amount_10k_krw: number;
    floor: number | null;
    built_year: number;
    contract_date: Date | string;
    existing_content_hash: string | null;
};

async function main() {
    const options = parseSyncOptions(process.argv.slice(2));
    const dataSource = new DataSource({
        type: "postgres",
        host: serverEnv.database.host,
        port: serverEnv.database.port,
        username: serverEnv.database.username,
        password: serverEnv.database.password,
        database: serverEnv.database.database,
        synchronize: false,
        logging: serverEnv.database.logging
    });

    await dataSource.initialize();

    try {
        const result = await syncEstateTransactionEmbeddings(dataSource, options);

        console.log(
            JSON.stringify({
                scanned: result.scanned,
                synced: result.synced,
                skipped: result.skipped
            })
        );
    } finally {
        await dataSource.destroy();
    }
}

async function syncEstateTransactionEmbeddings(dataSource: DataSource, options: SyncOptions) {
    let lastTransactionId = 0;
    let scanned = 0;
    let synced = 0;
    let skipped = 0;

    while (options.limit === null || synced < options.limit) {
        const rows = await findTransactionRows(dataSource, lastTransactionId, options.batchSize);

        if (rows.length === 0) {
            break;
        }

        for (const row of rows) {
            lastTransactionId = Number(row.id);
            scanned += 1;

            const content = createEstateTransactionEmbeddingInput(toEmbeddingSource(row));
            const contentHash = createEstateTransactionContentHash(content);

            if (row.existing_content_hash === contentHash) {
                skipped += 1;
                continue;
            }

            const embedding = await createEmbedding(content, serverEnv.ai.embedding);

            await upsertTransactionEmbedding(dataSource, {
                transactionId: Number(row.id),
                contentHash,
                embedding: toPgVector(embedding)
            });

            synced += 1;

            if (options.limit !== null && synced >= options.limit) {
                break;
            }
        }
    }

    return { scanned, synced, skipped };
}

async function findTransactionRows(dataSource: DataSource, lastTransactionId: number, batchSize: number) {
    return (await dataSource.query(
        `
        SELECT
            estate_transactions.id::text AS id,
            estate_transactions.legal_dong_name,
            estate_transactions.building_name,
            estate_transactions.building_use,
            estate_transactions.building_area_square_meter,
            estate_transactions.deal_amount_10k_krw,
            estate_transactions.floor,
            estate_transactions.built_year,
            estate_transactions.contract_date,
            estate_transaction_embeddings.content_hash AS existing_content_hash
        FROM estate_transactions
        LEFT JOIN estate_transaction_embeddings
            ON estate_transaction_embeddings.transaction_id = estate_transactions.id
        WHERE estate_transactions.id > $1
        ORDER BY estate_transactions.id ASC
        LIMIT $2
        `,
        [lastTransactionId, batchSize]
    )) as SyncEstateTransactionRow[];
}

async function upsertTransactionEmbedding(
    dataSource: DataSource,
    values: { transactionId: number; contentHash: string; embedding: string }
) {
    await dataSource.query(
        `
        INSERT INTO estate_transaction_embeddings (
            transaction_id,
            content_hash,
            embedding_model,
            embedding_dimensions,
            embedding
        )
        VALUES ($1, $2, $3, $4, $5::vector)
        ON CONFLICT (transaction_id) DO UPDATE
        SET
            content_hash = EXCLUDED.content_hash,
            embedding_model = EXCLUDED.embedding_model,
            embedding_dimensions = EXCLUDED.embedding_dimensions,
            embedding = EXCLUDED.embedding,
            updated_at = CURRENT_TIMESTAMP
        `,
        [
            values.transactionId,
            values.contentHash,
            serverEnv.ai.embedding.model,
            serverEnv.ai.embedding.dimensions,
            values.embedding
        ]
    );
}

function parseSyncOptions(args: string[]): SyncOptions {
    return {
        limit: parseOptionalPositiveIntArg(args, "--limit"),
        batchSize: parseOptionalPositiveIntArg(args, "--batch-size") ?? DEFAULT_BATCH_SIZE
    };
}

function parseOptionalPositiveIntArg(args: string[], name: string) {
    const argIndex = args.indexOf(name);

    if (argIndex === -1) {
        return null;
    }

    const rawValue = args[argIndex + 1];
    const value = Number(rawValue);

    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${name}에는 양의 정수를 입력해야 합니다.`);
    }

    return value;
}

function toEmbeddingSource(row: SyncEstateTransactionRow): EstateEmbeddingSource {
    return {
        legalDongName: row.legal_dong_name,
        buildingName: row.building_name,
        buildingUse: row.building_use,
        buildingAreaSquareMeter: Number(row.building_area_square_meter),
        dealAmount10kKrw: row.deal_amount_10k_krw,
        floor: row.floor,
        builtYear: row.built_year,
        contractDate: toDateString(row.contract_date)
    };
}

function toDateString(value: Date | string) {
    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }

    return value.slice(0, 10);
}

void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
