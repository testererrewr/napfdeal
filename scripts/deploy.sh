#!/usr/bin/env bash
# Pull the latest config + images and restart changed services.
# Usage: scripts/deploy.sh
source "$(dirname "$0")/lib.sh"

log "updating repository"
git pull --ff-only

log "pulling images"
docker compose pull

log "starting"
docker compose up -d --remove-orphans

log "cleaning up old images"
docker image prune -f >/dev/null

docker compose ps
log "deployed"
