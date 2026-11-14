#!/usr/bin/env bash
# Shared helpers for napfdeal scripts. Sourced, not executed.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/napfdeal}"
cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "error: $APP_DIR/.env not found" >&2
  exit 1
fi

# Load .env (simple KEY=VALUE lines; quoted values allowed)
set -a
# shellcheck disable=SC1091
source .env
set +a

BACKUP_DIR="${BACKUP_DIR:-/var/backups/napfdeal}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
BACKUP_PASSPHRASE_FILE="${BACKUP_PASSPHRASE_FILE:-/root/.napfdeal-backup-pass}"

log() { echo "[$(date '+%F %T')] $*"; }

require_passphrase() {
  if [[ ! -s "$BACKUP_PASSPHRASE_FILE" ]]; then
    echo "error: passphrase file $BACKUP_PASSPHRASE_FILE missing or empty" >&2
    exit 1
  fi
}
