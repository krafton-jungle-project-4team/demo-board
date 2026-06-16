CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS estate_transaction_embeddings (
    id bigserial PRIMARY KEY,
    transaction_id bigint NOT NULL REFERENCES estate_transactions (id) ON DELETE CASCADE,
    content_hash text NOT NULL,
    embedding_model text NOT NULL,
    embedding_dimensions int NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_estate_transaction_embeddings_transaction_id_unique
ON estate_transaction_embeddings (transaction_id);

CREATE INDEX IF NOT EXISTS idx_estate_transaction_embeddings_embedding_hnsw
ON estate_transaction_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_estate_transactions_building_name_trgm
ON estate_transactions USING gin (building_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_estate_transactions_legal_dong_name_trgm
ON estate_transactions USING gin (legal_dong_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_estate_transactions_building_use_trgm
ON estate_transactions USING gin (building_use gin_trgm_ops);
