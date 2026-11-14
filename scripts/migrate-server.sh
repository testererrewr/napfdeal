#!/usr/bin/env bash
# Move napfdeal to a new Debian 12 VPS.
#
# Prerequisites on the NEW server (see README, "Server einrichten", steps 1–4):
#   Docker installed, repo cloned to /opt/napfdeal, `docker login ghcr.io` done,
#   and root SSH access from the OLD server (ssh root@NEW works without password prompt).
#
# Usage (on the OLD server, as root):  scripts/migrate-server.sh <new-server-ip-or-host>
source "$(dirname "$0")/lib.sh"

new="${1:-}"
if [[ -z "$new" ]]; then
  echo "usage: $0 <new-server-ip-or-host>" >&2
  exit 1
fi
remote="root@$new"

log "1/6 checking new server"
ssh -o BatchMode=yes "$remote" "test -d $APP_DIR/.git && command -v docker >/dev/null" \
  || { echo "error: new server not prepared (repo in $APP_DIR + docker required)" >&2; exit 1; }

log "2/6 creating fresh backup"
"$APP_DIR/scripts/backup.sh"
latest="$(ls -1t "$BACKUP_DIR"/napfdeal-*.dump.gpg | head -n 1)"
log "latest backup: $latest"

log "3/6 copying .env, passphrase and backup"
ssh "$remote" "mkdir -p $BACKUP_DIR && chmod 700 $BACKUP_DIR"
scp -p "$APP_DIR/.env" "$remote:$APP_DIR/.env"
scp -p "$BACKUP_PASSPHRASE_FILE" "$remote:$BACKUP_PASSPHRASE_FILE"
scp -p "$latest" "$remote:$BACKUP_DIR/"
ssh "$remote" "chmod 600 $APP_DIR/.env $BACKUP_PASSPHRASE_FILE"

log "4/6 starting database on new server and restoring"
ssh "$remote" "cd $APP_DIR && docker compose pull && scripts/restore.sh $BACKUP_DIR/$(basename "$latest") --yes"

log "5/6 installing systemd units on new server"
ssh "$remote" "cp $APP_DIR/deploy/napfdeal.service $APP_DIR/deploy/napfdeal-backup.service $APP_DIR/deploy/napfdeal-backup.timer /etc/systemd/system/ \
  && systemctl daemon-reload && systemctl enable napfdeal.service napfdeal-backup.timer && systemctl start napfdeal-backup.timer"

log "6/6 done – the new server is running with today's data."
cat <<EOF

Next steps (manual):
  1. Cloudflare → DNS: change the A record for ${DOMAIN} (and www) to the new IP: ${new}
     Keep TTL low (Auto / 60 s) during the move.
  2. Wait until https://${DOMAIN} is served by the new server (Caddy gets a new certificate automatically).
  3. On THIS (old) server stop the stack to avoid two writers:
       systemctl disable --now napfdeal.service
     Anything written here after the backup is NOT on the new server.
     For zero data loss next time: run 'docker compose stop web worker' here BEFORE this script.
  4. Keep the old server for a few days, then cancel it.
EOF
