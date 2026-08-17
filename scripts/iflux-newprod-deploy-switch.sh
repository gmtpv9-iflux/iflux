#!/bin/bash
# IFLUX_DEPLOY_TARGET=staging-2
# Atomic deploy switch cho Staging 2 (hostname production.iflux.vn)
# — CHỈ đụng /var/www/iflux/newprod (frontend), /var/iflux/backend-newprod
# (backend), và vhost Staging 2
# (/etc/nginx/sites-available/production.iflux.vn.conf).
# KHÔNG bao giờ chạm Production
# (/var/www/iflux/production, /var/iflux/backend, PM2 iflux-api,
#  iflux-production.conf, iflux-prod-app.conf)
# hay Staging 1 (/var/www/iflux/staging, /var/iflux/backend-staging).
# Chạy bằng root qua sudo (NOPASSWD) do user iflux-deploy (CI/CD) gọi.
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
NGINX_SRC="${DEPLOY_META}/nginx.conf"
NGINX_DEST="/etc/nginx/sites-available/production.iflux.vn.conf"
SWITCH_SRC="${DEPLOY_META}/iflux-newprod-deploy-switch.sh"
SWITCH_DEST="/usr/local/bin/iflux-newprod-deploy-switch.sh"

run_migrations() {
  local mig_dir="${BACKEND_RELEASE}/migrations"
  local runner="${BACKEND_RELEASE}/migrate.sh"
  if [ ! -d "$BACKEND_RELEASE" ]; then
    echo "Backend release not found — skip migrate: $BACKEND_RELEASE"
    return 0
  fi
  if [ ! -d "$mig_dir" ] || [ ! -f "$runner" ]; then
    echo "No migrate.sh/migrations in release — skip migrate"
    return 0
  fi
  chmod +x "$runner"
  sudo -u postgres bash "$runner" "$mig_dir"
}

refuse_if_forbidden() {
  local file="$1"
  local live
  live="$(grep -v '^[[:space:]]*#' "$file")"
  if printf '%s\n' "$live" | grep -E -q 'server_name[[:space:]]+(www\.)?iflux\.vn([[:space:]]|;|$)'; then
    echo "Refusing $file: Production server_name" >&2
    exit 1
  fi
  if printf '%s\n' "$live" | grep -F -q 'root /var/www/iflux/production'; then
    echo "Refusing $file: Production web root" >&2
    exit 1
  fi
  if printf '%s\n' "$live" | grep -F -q 'iflux-prod-app'; then
    echo "Refusing $file: Production nginx snippet" >&2
    exit 1
  fi
  if printf '%s\n' "$live" | grep -F -q '/admin/dang-nhap'; then
    echo "Refusing $file: legacy /admin/dang-nhap" >&2
    exit 1
  fi
}

apply_nginx() {
  if [ ! -f "$NGINX_SRC" ]; then
    echo "Missing Staging 2 nginx source: $NGINX_SRC" >&2
    exit 1
  fi
  if ! grep -F -q 'server_name production.iflux.vn' "$NGINX_SRC"; then
    echo "Refusing nginx source: missing Staging 2 server_name" >&2
    exit 1
  fi
  if ! grep -F -q 'root /var/www/iflux/newprod' "$NGINX_SRC"; then
    echo "Refusing nginx source: missing Staging 2 web root" >&2
    exit 1
  fi
  if ! grep -F -q 'X-IFlux-Env' "$NGINX_SRC"; then
    echo "Refusing nginx source: missing Staging 2 env header" >&2
    exit 1
  fi
  refuse_if_forbidden "$NGINX_SRC"

  if [ ! -f "$NGINX_DEST" ]; then
    echo "Missing live Staging 2 vhost: $NGINX_DEST" >&2
    exit 1
  fi

  local bak="${NGINX_DEST}.bak.${RELEASE_ID}"
  cp -a "$NGINX_DEST" "$bak"
  cp "$NGINX_SRC" "$NGINX_DEST"
  chmod 644 "$NGINX_DEST"

  if ! nginx -t; then
    echo "nginx -t failed — restore $bak" >&2
    cp -a "$bak" "$NGINX_DEST"
    nginx -t
    exit 1
  fi
  nginx -s reload
  echo "OK: Staging 2 nginx reloaded from $NGINX_SRC"
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
    echo "Refusing switch self-update: missing Staging 2 frontend live path" >&2
    exit 1
  fi
  if grep -F -q 'FRONTEND_LIVE="/var/www/iflux/production"' "$SWITCH_SRC"; then
    echo "Refusing switch self-update: Production frontend path" >&2
    exit 1
  fi
  install -m 755 "$SWITCH_SRC" "$SWITCH_DEST"
  echo "OK: switch script refreshed from $SWITCH_SRC"
}

if [ "$MIGRATE_ONLY" = "1" ]; then
  if [ ! -d "$BACKEND_RELEASE" ]; then
    echo "Backend release not found: $BACKEND_RELEASE" >&2
    exit 1
  fi
  run_migrations
  echo "OK: migrate-only $RELEASE_ID"
  exit 0
fi

if [ ! -d "$FRONTEND_RELEASE" ]; then
  echo "Frontend release not found: $FRONTEND_RELEASE" >&2
  exit 1
fi

run_migrations

ln -sfn "$FRONTEND_RELEASE" "$FRONTEND_LIVE"

if [ -d "$BACKEND_RELEASE" ]; then
  if [ ! -f "$BACKEND_SHARED_ENV" ]; then
    echo "Missing shared env: $BACKEND_SHARED_ENV" >&2
    exit 1
  fi
  ln -sfn "$BACKEND_SHARED_ENV" "${BACKEND_RELEASE}/.env"
  ln -sfn "$BACKEND_RELEASE" "$BACKEND_LIVE"
  cd /tmp
  pm2 restart iflux-api-newprod
  echo "Backend switched -> $BACKEND_RELEASE"
else
  echo "Backend release not found — frontend-only switch: $BACKEND_RELEASE"
fi

apply_nginx
refresh_switch

echo "OK: switched newprod frontend -> $FRONTEND_RELEASE"
