#!/usr/bin/env bash
# Encrypted PostgreSQL backup with 30-day rotation, optionally mirrored to a Hetzner Storage Box.
# Usage: scripts/backup.sh            (run as root, e.g. via napfdeal-backup.timer)
source "$(dirname "$0")/lib.sh"
require_passphrase

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
file="$BACKUP_DIR/napfdeal-$stamp.dump.gpg"
tmp="$file.partial"

log "dumping database to $file"
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --compress=6 \
  | gpg --batch --yes --symmetric --cipher-algo AES256 --pinentry-mode loopback \
        --passphrase-file "$BACKUP_PASSPHRASE_FILE" -o "$tmp"
mv "$tmp" "$file"
chmod 600 "$file"
log "backup size: $(du -h "$file" | cut -f1)"

log "removing local backups older than $BACKUP_RETENTION_DAYS days"
find "$BACKUP_DIR" -name 'napfdeal-*.dump.gpg' -type f -mtime "+$BACKUP_RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name '*.partial' -type f -delete

if [[ -n "${STORAGEBOX_TARGET:-}" ]]; then
  log "mirroring to storage box ($STORAGEBOX_TARGET)"
  # --delete keeps the remote copy in sync, so the 30-day rotation also applies there.
  rsync -a --delete -e "ssh -p 23 -o BatchMode=yes" "$BACKUP_DIR/" "$STORAGEBOX_TARGET/"
else
  log "STORAGEBOX_TARGET not set – backup stays on this server only"
fi

log "done"
