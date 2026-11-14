#!/usr/bin/env bash
# Restore an encrypted backup into the running postgres container.
# Usage: scripts/restore.sh /var/backups/napfdeal/napfdeal-YYYYMMDDTHHMMSSZ.dump.gpg [--yes]
source "$(dirname "$0")/lib.sh"
require_passphrase

file="${1:-}"
if [[ -z "$file" || ! -f "$file" ]]; then
  echo "usage: $0 <backup.dump.gpg> [--yes]" >&2
  echo "available:" >&2
  ls -1t "$BACKUP_DIR"/napfdeal-*.dump.gpg 2>/dev/null | head -n 10 >&2 || true
  exit 1
fi

if [[ "${2:-}" != "--yes" ]]; then
  read -r -p "This REPLACES the database '$POSTGRES_DB' with $file. Type 'restore' to continue: " answer
  [[ "$answer" == "restore" ]] || { echo "aborted"; exit 1; }
fi

log "stopping web and worker"
docker compose stop web worker || true

log "making sure postgres is running"
docker compose up -d postgres
until docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d postgres >/dev/null 2>&1; do sleep 1; done

log "recreating database $POSTGRES_DB"
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\" WITH (FORCE);" \
  -c "CREATE DATABASE \"$POSTGRES_DB\" OWNER \"$POSTGRES_USER\";"

log "restoring"
gpg --batch --quiet --decrypt --pinentry-mode loopback --passphrase-file "$BACKUP_PASSPHRASE_FILE" "$file" \
  | docker compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --exit-on-error

log "starting stack"
docker compose up -d

log "restore finished"
