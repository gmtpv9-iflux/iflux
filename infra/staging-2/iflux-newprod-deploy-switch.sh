#!/bin/bash
# IFLUX_DEPLOY_TARGET=staging-2
# Atomic deploy switch — Production candidate (production.iflux.vn).
# Artifact: Staging 1 (User_Web + Admin_Design_system + backend).
# CHỈ đụng:
#   /var/www/iflux/newprod
#   /var/www/iflux/releases-newprod
#   /var/iflux/backend-newprod
#   /etc/nginx/sites-available/production.iflux.vn.conf
#   /etc/nginx/snippets/iflux-newprod-app.conf
#   PM2 iflux-api-newprod
# KHÔNG bao giờ chạm Live Production
#   (/var/www/iflux/production, /var/iflux/backend, PM2 iflux-api,
#    iflux-production.conf, iflux-prod-app.conf)
# hay Staging 1 (/var/www/iflux/staging, /var/iflux/backend-staging).
# Chạy bằng root qua sudo (NOPASSWD) do user iflux-deploy (CI) gọi.
set -euo pipefail

RELEASE_ID="${1:-}"
if [ -z "$RELEASE_ID" ]; then
  echo "Usage: $0 <release-id> [--migrate-only]" >&2
  exit 1
fi
if ! [[ "$RELEASE_ID" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "Invalid release id: $RELEASE_ID" >&2
  exit 1
fi

MIGRATE_ONLY=0
if [ "${2:-}" = "--migrate-only" ]; then
  MIGRATE_ONLY=1
elif [ -n "${2:-}" ]; then
  echo "Unknown argument: $2" >&2
  exit 1
fi

FRONTEND_RELEASE="/var/www/iflux/releases-newprod/${RELEASE_ID}"
FRONTEND_LIVE="/var/www/iflux/newprod"
BACKEND_RELEASE="/var/iflux/backend-newprod/releases/${RELEASE_ID}"
BACKEND_LIVE="/var/iflux/backend-newprod/current"
BACKEND_SHARED_ENV="/var/iflux/backend-newprod/shared/.env"
DEPLOY_META="/var/www/iflux/releases-newprod/${RELEASE_ID}.deploy"
NGINX_VHOST_SRC="${DEPLOY_META}/iflux-newprod.conf"
NGINX_APP_SRC="${DEPLOY_META}/iflux-newprod-app.conf"
NGINX_VHOST_DEST="/etc/nginx/sites-available/production.iflux.vn.conf"
NGINX_APP_DEST="/etc/nginx/snippets/iflux-newprod-app.conf"
SWITCH_SRC="${DEPLOY_META}/iflux-newprod-deploy-switch.sh"
SWITCH_DEST="/usr/local/bin/iflux-newprod-deploy-switch.sh"

run_migrations() {
  echo "Skip auto-migrate on production-next (schema clone từ Staging 1, không chạy migrate S2)."
  return 0
}

refuse_if_forbidden() {
  local file="$1"
  local live
  live="$(grep -v '^[[:space:]]*#' "$file")"
  if printf '%s\n' "$live" | grep -E -q 'server_name[[:space:]]+(www\.)?iflux\.vn([[:space:]]|;|$)'; then
    echo "Refusing $file: Live Production server_name" >&2
    exit 1
  fi
  if printf '%s\n' "$live" | grep -F -q 'root /var/www/iflux/production'; then
    echo "Refusing $file: Live Production web root" >&2
    exit 1
  fi
  if printf '%s\n' "$live" | grep -F -q 'iflux-prod-app'; then
    echo "Refusing $file: Live Production nginx snippet" >&2
    exit 1
  fi
  if printf '%s\n' "$live" | grep -F -q 'proxy_pass http://127.0.0.1:3001'; then
    echo "Refusing $file: Live Production API port 3001" >&2
    exit 1
  fi
  if printf '%s\n' "$live" | grep -F -q '/var/www/iflux/staging'; then
    echo "Refusing $file: Staging 1 web root" >&2
    exit 1
  fi
  if printf '%s\n' "$live" | grep -F -q '127.0.0.1:3002'; then
    echo "Refusing $file: Staging 1 API port 3002" >&2
    exit 1
  fi
}

apply_nginx() {
  if [ ! -f "$NGINX_VHOST_SRC" ] || [ ! -f "$NGINX_APP_SRC" ]; then
    echo "Missing Git nginx in $DEPLOY_META" >&2
    exit 1
  fi
  if ! grep -F -q 'server_name production.iflux.vn' "$NGINX_VHOST_SRC"; then
    echo "Refusing nginx vhost: missing production.iflux.vn" >&2
    exit 1
  fi
  if ! grep -F -q 'X-IFlux-Env' "$NGINX_VHOST_SRC"; then
    echo "Refusing nginx vhost: missing X-IFlux-Env" >&2
    exit 1
  fi
  if ! grep -F -q 'root /var/www/iflux/newprod' "$NGINX_APP_SRC"; then
    echo "Refusing nginx app: missing newprod web root" >&2
    exit 1
  fi
  if ! grep -F -q '127.0.0.1:3003' "$NGINX_APP_SRC"; then
    echo "Refusing nginx app: missing API port 3003" >&2
    exit 1
  fi
  refuse_if_forbidden "$NGINX_VHOST_SRC"
  refuse_if_forbidden "$NGINX_APP_SRC"

  if [ ! -f "$NGINX_VHOST_DEST" ]; then
    echo "Missing live vhost slot: $NGINX_VHOST_DEST" >&2
    exit 1
  fi

  local bak_v="${NGINX_VHOST_DEST}.bak.${RELEASE_ID}"
  local bak_a="${NGINX_APP_DEST}.bak.${RELEASE_ID}"
  cp -a "$NGINX_VHOST_DEST" "$bak_v"
  if [ -f "$NGINX_APP_DEST" ]; then
    cp -a "$NGINX_APP_DEST" "$bak_a"
  fi
  cp "$NGINX_VHOST_SRC" "$NGINX_VHOST_DEST"
  cp "$NGINX_APP_SRC" "$NGINX_APP_DEST"
  chmod 644 "$NGINX_VHOST_DEST" "$NGINX_APP_DEST"

  if ! nginx -t; then
    echo "nginx -t failed — restore" >&2
    cp -a "$bak_v" "$NGINX_VHOST_DEST"
    if [ -f "$bak_a" ]; then
      cp -a "$bak_a" "$NGINX_APP_DEST"
    fi
    nginx -t
    exit 1
  fi
  nginx -s reload
  echo "OK: production-next nginx reloaded from $DEPLOY_META"
}

refresh_switch() {
  if [ ! -f "$SWITCH_SRC" ]; then
    echo "Missing switch source: $SWITCH_SRC" >&2
    exit 1
  fi
  if ! grep -F -q 'IFLUX_DEPLOY_TARGET=staging-2' "$SWITCH_SRC"; then
    echo "Refusing switch self-update: missing staging-2 marker" >&2
    exit 1
  fi
  if ! grep -F -q 'FRONTEND_LIVE="/var/www/iflux/newprod"' "$SWITCH_SRC"; then
    echo "Refusing switch self-update: missing newprod frontend live path" >&2
    exit 1
  fi
  if grep -E '^FRONTEND_LIVE="/var/www/iflux/production"' "$SWITCH_SRC"; then
    echo "Refusing switch self-update: Live Production frontend path" >&2
    exit 1
  fi
  if grep -E '^FRONTEND_LIVE="/var/www/iflux/staging"' "$SWITCH_SRC"; then
    echo "Refusing switch self-update: Staging 1 frontend path" >&2
    exit 1
  fi
  install -m 755 "$SWITCH_SRC" "$SWITCH_DEST"
  echo "OK: switch script refreshed from $SWITCH_SRC"
}

start_or_restart_api() {
  if pm2 describe iflux-api-newprod >/dev/null 2>&1; then
    pm2 restart iflux-api-newprod --update-env
  else
    cd "$BACKEND_LIVE"
    pm2 start src/server.js --name iflux-api-newprod --update-env
  fi
  echo "OK: PM2 iflux-api-newprod"
}

if [ "$MIGRATE_ONLY" = "1" ]; then
  run_migrations
  echo "OK: migrate-only $RELEASE_ID (no-op)"
  exit 0
fi

if [ ! -d "$FRONTEND_RELEASE" ]; then
  echo "Frontend release not found: $FRONTEND_RELEASE" >&2
  exit 1
fi
if [ ! -d "$BACKEND_RELEASE" ]; then
  echo "Backend release not found: $BACKEND_RELEASE" >&2
  exit 1
fi
if [ ! -d "${FRONTEND_RELEASE}/User_Web" ] || [ ! -d "${FRONTEND_RELEASE}/Admin_Design_system" ]; then
  echo "Frontend release missing S1 artifact (User_Web / Admin_Design_system)" >&2
  exit 1
fi
if [ ! -f "${BACKEND_RELEASE}/src/server.js" ]; then
  echo "Backend release missing S1 server.js" >&2
  exit 1
fi
if [ ! -f "$BACKEND_SHARED_ENV" ]; then
  echo "Missing shared env: $BACKEND_SHARED_ENV" >&2
  exit 1
fi

run_migrations

if [ -d "$FRONTEND_LIVE" ] && [ ! -L "$FRONTEND_LIVE" ]; then
  mv "$FRONTEND_LIVE" "${FRONTEND_LIVE}.pre-s1-$(date +%Y%m%d%H%M%S)"
fi

ln -sfn "$BACKEND_SHARED_ENV" "${BACKEND_RELEASE}/.env"
ln -sfn "$FRONTEND_RELEASE" "$FRONTEND_LIVE"
ln -sfn "$BACKEND_RELEASE" "$BACKEND_LIVE"

cd /tmp
start_or_restart_api

apply_nginx
refresh_switch

echo "OK: switched newprod frontend -> $FRONTEND_RELEASE, backend -> $BACKEND_RELEASE"
