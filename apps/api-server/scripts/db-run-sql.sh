#!/bin/sh
set -eu

ENV_FILE="${NMM_ENV_FILE:-apps/api-server/.env}"
TARGET_PATH="${1:?Usage: sh apps/api-server/scripts/db-run-sql.sh <sql-file-or-directory>}"

if [ ! -f "$ENV_FILE" ]; then
    echo "Missing env file: $ENV_FILE" >&2
    exit 1
fi

if [ ! -e "$TARGET_PATH" ]; then
    echo "Missing SQL target: $TARGET_PATH" >&2
    exit 1
fi

set -a
. "$ENV_FILE"
set +a

DB_USER="${NMM_DB_USERNAME:-namanmu}"
DB_NAME="${NMM_DB_DATABASE:-namanmu}"

run_psql() {
    docker compose --env-file "$ENV_FILE" exec -T postgres \
        psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" "$@"
}

ensure_schema_migrations() {
    run_psql <<'SQL'
CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
SQL
}

is_sql_file_applied() {
    migration_name="$1"
    applied="$(run_psql -tAc "SELECT 1 FROM schema_migrations WHERE name = '$migration_name'")"

    [ "$applied" = "1" ]
}

run_sql_file() {
    sql_file="$1"
    migration_name="$(basename "$sql_file")"

    if is_sql_file_applied "$migration_name"; then
        echo "Skipping $sql_file"
        return
    fi

    echo "Applying $sql_file"
    {
        printf "BEGIN;\n"
        cat "$sql_file"
        printf "\nINSERT INTO schema_migrations (name) VALUES ('%s');\n" "$migration_name"
        printf "COMMIT;\n"
    } | run_psql
}

ensure_schema_migrations

if [ -d "$TARGET_PATH" ]; then
    found_sql_file=false

    for sql_file in "$TARGET_PATH"/*.sql; do
        if [ ! -e "$sql_file" ]; then
            continue
        fi

        found_sql_file=true
        run_sql_file "$sql_file"
    done

    if [ "$found_sql_file" = false ]; then
        echo "No SQL files in $TARGET_PATH"
    fi
else
    run_sql_file "$TARGET_PATH"
fi
