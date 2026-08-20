#!/bin/bash
# IFLUX_DEPLOY_TARGET=staging-1
# Atomic deploy switch cho Staging 1 (staging.iflux.vn).
# CHỈ đụng:
#   /var/www/iflux/staging
#   /var/www/iflux/releases-staging
#   /var/iflux/backend-staging
#   /etc/nginx/sites-enabled/iflux-staging.conf
#   /etc/nginx/snippets/iflux-staging-app.conf
#   PM2 iflux-api-staging (user iflux-app)
# KHÔNG bao giờ chạm Production
#   (/var/www/iflux/production, /var/iflux/backend, PM2 iflux-api,
#    iflux-production.conf, iflux-prod-app.conf)
# hay Staging 2 (/var/www/iflux/newprod, /var/iflux/backend-newprod).
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

FRONTEND_RELEASE="/var/www/iflux/releases-staging/${RELEASE_ID}"
FRONTEND_LIVE="/var/www/iflux/staging"
BACKEND_RELEASE="/var/iflux/backend-staging/releases/${RELEASE_ID}"
BACKEND_LIVE="/var/iflux/backend-staging/current"
DEPLOY_META="/var/www/iflux/releases-staging/${RELEASE_ID}.deploy"
NGINX_VHOST_SRC="${DEPLOY_META}/iflux-staging.conf"
NGINX_APP_SRC="${DEPLOY_META}/iflux-staging-app.conf"
NGINX_VHOST_DEST="/etc/nginx/sites-enabled/iflux-staging.conf"
NGINX_APP_DEST="/etc/nginx/snippets/iflux-staging-app.conf"
SWITCH_SRC="${DEPLOY_META}/iflux-staging-deploy-switch.sh"
SWITCH_DEST="/usr/local/bin/iflux-staging-deploy-switch.sh"

run_migrations() {
  local runner="${BACKEND_RELEASE}/scripts/migrate-only.js"
  if [ ! -d "$BACKEND_RELEASE" ]; then
    echo "Backend release not found — skip migrate: $BACKEND_RELEASE"
    return 0
  fi
  if [ ! -f "$runner" ]; then
    echo "No migrate-only.js in release — skip migrate"
    return 0
  fi
  echo "Skip auto-migrate on Staging 1 (không có migrate.sh CI). Runner tồn tại nhưng không gọi từ switch."
  return 0
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
  if printf '%s\n' "$live" | grep -F -q 'proxy_pass http://127.0.0.1:3001'; then
    echo "Refusing $file: Production API port 3001" >&2
    exit 1
  fi
}

apply_nginx() {
  if [ ! -f "$NGINX_VHOST_SRC" ] || [ ! -f "$NGINX_APP_SRC" ]; then
    echo "No Git nginx in $DEPLOY_META — keep live nginx (workflow cũ)."
    return 0
  fi
  if ! grep -F -q 'server_name staging.iflux.vn' "$NGINX_VHOST_SRC"; then
    echo "Refusing nginx vhost: missing staging.iflux.vn" >&2
    exit 1
  fi
  if ! grep -F -q 'X-IFlux-Env' "$NGINX_VHOST_SRC"; then
    echo "Refusing nginx vhost: missing X-IFlux-Env" >&2
    exit 1
  fi
  if ! grep -F -q 'root /var/www/iflux/staging' "$NGINX_APP_SRC"; then
    echo "Refusing nginx app: missing Staging 1 web root" >&2
    exit 1
  fi
  if ! grep -F -q '127.0.0.1:3002' "$NGINX_APP_SRC"; then
    echo "Refusing nginx app: missing Staging 1 API port 3002" >&2
    exit 1
  fi
  refuse_if_forbidden "$NGINX_VHOST_SRC"
  refuse_if_forbidden "$NGINX_APP_SRC"

  local bak_v="${NGINX_VHOST_DEST}.bak.${RELEASE_ID}"
  local bak_a="${NGINX_APP_DEST}.bak.${RELEASE_ID}"
  cp -a "$NGINX_VHOST_DEST" "$bak_v"
  cp -a "$NGINX_APP_DEST" "$bak_a"
  cp "$NGINX_VHOST_SRC" "$NGINX_VHOST_DEST"
  cp "$NGINX_APP_SRC" "$NGINX_APP_DEST"
  chmod 644 "$NGINX_VHOST_DEST" "$NGINX_APP_DEST"

  if ! nginx -t; then
    echo "nginx -t failed — restore $bak_v $bak_a" >&2
    cp -a "$bak_v" "$NGINX_VHOST_DEST"
    cp -a "$bak_a" "$NGINX_APP_DEST"
    nginx -t
    exit 1
  fi
  nginx -s reload
  echo "OK: Staging 1 nginx reloaded from $DEPLOY_META"
}

refresh_switch() {
  if [ ! -f "$SWITCH_SRC" ]; then
    echo "No Git switch in $DEPLOY_META — keep installed switch."
    return 0
  fi
  if ! grep -F -q 'IFLUX_DEPLOY_TARGET=staging-1' "$SWITCH_SRC"; then
    echo "Refusing switch self-update: missing staging-1 marker" >&2
    exit 1
  fi
  if ! grep -F -q 'FRONTEND_LIVE="/var/www/iflux/staging"' "$SWITCH_SRC"; then
    echo "Refusing switch self-update: missing Staging 1 frontend live path" >&2
    exit 1
  fi
  # Assignment-only. Do not embed the old grep -F needle as a literal —
  # the installed script still searches SWITCH_SRC for that exact string.
  _prod_fe="/var/www/iflux/production"
  if grep -E -q "^FRONTEND_LIVE=\"${_prod_fe}\"" "$SWITCH_SRC"; then
    echo "Refusing switch self-update: Production frontend path" >&2
    exit 1
  fi
  install -m 755 "$SWITCH_SRC" "$SWITCH_DEST"
  echo "OK: switch script refreshed from $SWITCH_SRC"
}

if [ "$MIGRATE_ONLY" = "1" ]; then
  run_migrations
  echo "OK: migrate-only $RELEASE_ID (no-op unless Owner mở migrate CI)"
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

run_migrations

if [ -d "$FRONTEND_LIVE" ] && [ ! -L "$FRONTEND_LIVE" ]; then
  mv "$FRONTEND_LIVE" "${FRONTEND_LIVE}.pre-cicd-$(date +%Y%m%d%H%M%S)"
fi

ln -sfn "$FRONTEND_RELEASE" "$FRONTEND_LIVE"
ln -sfn "$BACKEND_RELEASE" "$BACKEND_LIVE"

su -s /bin/bash iflux-app -c "cd /home/iflux-app && PM2_HOME=/home/iflux-app/.pm2 pm2 restart iflux-api-staging"

apply_nginx
refresh_switch

echo "OK: switched staging frontend -> $FRONTEND_RELEASE, backend -> $BACKEND_RELEASE"
