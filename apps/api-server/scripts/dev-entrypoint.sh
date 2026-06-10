#!/bin/sh
set -eu

LOCK_HASH_FILE="node_modules/.package-lock.sha256"
CURRENT_LOCK_HASH="$(sha256sum package-lock.json)"

if [ ! -f "$LOCK_HASH_FILE" ] || [ "$(cat "$LOCK_HASH_FILE")" != "$CURRENT_LOCK_HASH" ]; then
    echo "package-lock changed; running npm ci."
    HUSKY=0 npm ci
    printf "%s\n" "$CURRENT_LOCK_HASH" > "$LOCK_HASH_FILE"
else
    echo "package-lock unchanged; skipping npm ci."
fi

npm run build -w @nmm/shared
cd apps/api-server
npx nest start --watch
