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

run_sql_file() {
    sql_file="$1"
    echo "Applying $sql_file"
    docker compose --env-file "$ENV_FILE" exec -T postgres \
        psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" < "$sql_file"
}

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
