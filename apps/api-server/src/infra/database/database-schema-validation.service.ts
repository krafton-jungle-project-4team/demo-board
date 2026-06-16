import { Injectable, type OnApplicationBootstrap } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

const REQUIRED_TABLE_COLUMNS = {
    schema_migrations: ["name", "applied_at"],
    auth_user: ["id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt"],
    auth_session: ["id", "expiresAt", "token", "createdAt", "updatedAt", "ipAddress", "userAgent", "userId"],
    auth_account: [
        "id",
        "accountId",
        "providerId",
        "userId",
        "accessToken",
        "refreshToken",
        "idToken",
        "accessTokenExpiresAt",
        "refreshTokenExpiresAt",
        "scope",
        "password",
        "createdAt",
        "updatedAt"
    ],
    auth_verification: ["id", "identifier", "value", "expiresAt", "createdAt", "updatedAt"],
    auth_users: ["id", "auth_user_id", "email", "name", "residence_dong_code", "created_at", "updated_at"],
    board_songpa_dongs: ["code", "name", "created_at"],
    board_posts: ["id", "author_id", "dong_code", "title", "content", "created_at", "updated_at"],
    board_tags: ["id", "name", "normalized_name", "created_at"],
    board_post_tags: ["id", "post_id", "tag_id", "created_at"],
    board_comments: [
        "id",
        "post_id",
        "author_id",
        "parent_comment_id",
        "depth",
        "content",
        "deleted_at",
        "created_at",
        "updated_at"
    ],
    estate_transactions: [
        "id",
        "property_id",
        "source_row_number",
        "receipt_year",
        "district_code",
        "district_name",
        "legal_dong_code",
        "legal_dong_name",
        "lot_type_code",
        "lot_type_name",
        "main_lot_number",
        "sub_lot_number",
        "building_name",
        "contract_date",
        "deal_amount_10k_krw",
        "building_area_square_meter",
        "land_area_square_meter",
        "floor",
        "right_type",
        "canceled_at",
        "built_year",
        "building_use",
        "report_type",
        "brokered_agent_sgg_name"
    ],
    estate_properties: [
        "id",
        "property_key",
        "pnu",
        "district_code",
        "district_name",
        "legal_dong_code",
        "legal_dong_name",
        "lot_type_code",
        "lot_type_name",
        "main_lot_number",
        "sub_lot_number",
        "parcel_address",
        "building_names",
        "transaction_count",
        "latitude",
        "longitude",
        "created_at",
        "updated_at"
    ],
    estate_transaction_embeddings: [
        "id",
        "transaction_id",
        "content_hash",
        "embedding_model",
        "embedding_dimensions",
        "embedding",
        "created_at",
        "updated_at"
    ]
} as const;

const REQUIRED_INDEXES = [
    "idx_board_posts_title_trgm",
    "idx_board_posts_content_trgm",
    "idx_board_posts_dong_code",
    "idx_auth_users_residence_dong_code",
    "idx_board_tags_name_trgm",
    "idx_board_tags_normalized_name_unique",
    "idx_board_post_tags_post_id_tag_id_unique",
    "idx_estate_transactions_source_row_number_unique",
    "idx_estate_transactions_contract_date",
    "idx_estate_transactions_district_legal_dong",
    "idx_estate_transactions_building_use",
    "idx_estate_transactions_property_id",
    "idx_estate_properties_property_key_unique",
    "idx_estate_properties_pnu_unique",
    "idx_estate_properties_district_legal_dong",
    "idx_estate_transaction_embeddings_transaction_id_unique",
    "idx_estate_transaction_embeddings_embedding_hnsw",
    "idx_estate_transactions_building_name_trgm",
    "idx_estate_transactions_legal_dong_name_trgm",
    "idx_estate_transactions_building_use_trgm"
] as const;

@Injectable()
export class DatabaseSchemaValidationService implements OnApplicationBootstrap {
    constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

    async onApplicationBootstrap() {
        const missingColumns = await this.findMissingColumns();
        const missingIndexes = await this.findMissingIndexes();
        const missingItems = [...missingColumns, ...missingIndexes];

        if (missingItems.length > 0) {
            throw new Error(`Database schema is not migrated. Missing: ${missingItems.join(", ")}`);
        }
    }

    private async findMissingColumns() {
        const tableColumnPairs = Object.entries(REQUIRED_TABLE_COLUMNS).flatMap(([tableName, columnNames]) =>
            columnNames.map((columnName) => ({ tableName, columnName }))
        );
        const rows = (await this.dataSource.query(
            `
            SELECT table_name, column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
                AND table_name = ANY($1::text[])
            `,
            [Object.keys(REQUIRED_TABLE_COLUMNS)]
        )) as Array<{ table_name: string; column_name: string }>;
        const existingColumns = new Set(rows.map((row) => `${row.table_name}.${row.column_name}`));

        return tableColumnPairs
            .filter((pair) => !existingColumns.has(`${pair.tableName}.${pair.columnName}`))
            .map((pair) => `${pair.tableName}.${pair.columnName}`);
    }

    private async findMissingIndexes() {
        const rows = (await this.dataSource.query(
            `
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
                AND indexname = ANY($1::text[])
            `,
            [[...REQUIRED_INDEXES]]
        )) as Array<{ indexname: string }>;
        const existingIndexes = new Set(rows.map((row) => row.indexname));

        return REQUIRED_INDEXES.filter((indexName) => !existingIndexes.has(indexName)).map(
            (indexName) => `index:${indexName}`
        );
    }
}
