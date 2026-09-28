#!/bin/bash
# IFLUX_DEPLOY_TARGET=staging-2
# Atomic deploy switch — Production runtime (iflux.vn / newprod).
# Artifact = cùng cây nguồn với Staging (User_Web, Admin_Design_system, design_system, platform, modules… + backend).
# (Marker IFLUX_DEPLOY_TARGET=staging-2 và tên file *-newprod giữ nguyên: bản script đang cài trên server kiểm tra chúng khi tự cập nhật.)
# CHỈ đụng:
#   /var/www/iflux/newprod
#   /var/www/iflux/releases-newprod
#   /var/iflux/backend-newprod
#   /etc/nginx/snippets/iflux-newprod-app.conf
#   PM2 iflux-api-newprod
# Không lấy apply vhost production.iflux.vn.conf làm điều kiện thành công.
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
NGINX_APP_SRC="${DEPLOY_META}/iflux-newprod-app.conf"
NGINX_APP_DEST="/etc/nginx/snippets/iflux-newprod-app.conf"
SWITCH_SRC="${DEPLOY_META}/iflux-newprod-deploy-switch.sh"
SWITCH_DEST="/usr/local/bin/iflux-newprod-deploy-switch.sh"

run_migrations() {
  # schema_migrations chỉ có snapshot cũ. CẤM migrate-only.js full queue
  # — sẽ replay 001–061 và gãy. Chỉ apply file mới từ Task 05 (062+) lên iflux_production_next.
  local mig_dir="${BACKEND_RELEASE}/migrations"
  local f base already
  if [ ! -d "$BACKEND_RELEASE" ] || [ ! -d "$mig_dir" ]; then
    echo "Backend release/migrations not found — skip migrate"
    return 0
  fi
  shopt -s nullglob
  for f in "$mig_dir"/*.sql; do
    base="$(basename "$f")"
    case "$base" in
      06[2-9]_*|0[7-9][0-9]_*|[1-9][0-9][0-9]_*) ;;
      *) continue ;;
    esac
    already="$(sudo -u postgres psql -d iflux_production_next -Atc "SELECT 1 FROM schema_migrations WHERE filename='${base}'")"
    if [ "$already" = "1" ]; then
      echo "migrate skip ${base}"
      continue
    fi
    echo "migrate apply ${base}"
    sudo -u postgres psql -d iflux_production_next -v ON_ERROR_STOP=1 -f "$f"
    sudo -u postgres psql -d iflux_production_next -v ON_ERROR_STOP=1 -c "INSERT INTO schema_migrations (filename) VALUES ('${base}')"
  done
}

# Migration 066 đổi URL ảnh Tin tức /media/community/ → /media/news/ trong DB; file trên đĩa chuyển theo.
# Idempotent: không còn thư mục community/ thì bỏ qua; file trùng tên ở news/ giữ nguyên (không ghi đè).
move_news_media() {
  local base root
  base="$(grep -E '^STORAGE_LOCAL_PATH=' "$BACKEND_SHARED_ENV" 2>/dev/null | tail -n 1 | cut -d= -f2- | tr -d "\"' ")"
  [ -n "$base" ] || base="./storage"
  case "$base" in
    /*) ;;
    *) base="${BACKEND_LIVE}/${base#./}" ;;
  esac
  root="${base}/media"
  if [ ! -d "${root}/community" ]; then
    echo "media: community/ không còn — bỏ qua"
    return 0
  fi
  mkdir -p "${root}/news"
  cp -an "${root}/community/." "${root}/news/"
  ( cd "${root}/community" && find . -type f -print0 ) | while IFS= read -r -d '' f; do
    if cmp -s "${root}/community/${f}" "${root}/news/${f}"; then rm -f "${root}/community/${f}"; fi
  done
  find "${root}/community" -depth -type d -empty -delete
  if [ -d "${root}/community" ]; then
    echo "media: community/ còn file khác nội dung với news/ — giữ lại để kiểm tra" >&2
  else
    echo "OK: media community/ → news/"
  fi
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
  if [ ! -f "$NGINX_APP_SRC" ]; then
    echo "Missing Git nginx snippet in $DEPLOY_META" >&2
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
  refuse_if_forbidden "$NGINX_APP_SRC"

  local bak_a="${NGINX_APP_DEST}.bak.${RELEASE_ID}"
  if [ -f "$NGINX_APP_DEST" ]; then
    cp -a "$NGINX_APP_DEST" "$bak_a"
  fi
  cp "$NGINX_APP_SRC" "$NGINX_APP_DEST"
  chmod 644 "$NGINX_APP_DEST"

  if ! nginx -t; then
    echo "nginx -t failed — restore snippet" >&2
    if [ -f "$bak_a" ]; then
      cp -a "$bak_a" "$NGINX_APP_DEST"
    fi
    nginx -t
    exit 1
  fi
  nginx -s reload
  echo "OK: production snippet reloaded from $DEPLOY_META"
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
  live_fe="$(awk -F= '/^FRONTEND_LIVE=/{gsub(/"/,"",$2); print $2; exit}' "$SWITCH_SRC")"
  if [ "$live_fe" = "/var/www/iflux/production" ]; then
    echo "Refusing switch self-update: Live Production frontend path" >&2
    exit 1
  fi
  if [ "$live_fe" = "/var/www/iflux/staging" ]; then
    echo "Refusing switch self-update: Staging 1 frontend path" >&2
    exit 1
  fi
  install -m 755 "$SWITCH_SRC" "$SWITCH_DEST"
  echo "OK: switch script refreshed from $SWITCH_SRC"
}

start_or_restart_api() {
  if pm2 describe iflux-api-newprod >/dev/null 2>&1; then
    pm2 delete iflux-api-newprod
  fi
  pm2 start src/server.js --name iflux-api-newprod --cwd "$BACKEND_LIVE"
  echo "OK: PM2 iflux-api-newprod cwd=$BACKEND_LIVE"
}

if [ "$MIGRATE_ONLY" = "1" ]; then
  run_migrations
  move_news_media
  echo "OK: migrate-only $RELEASE_ID"
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
for d in User_Web Admin_Design_system design_system platform; do
  if [ ! -d "${FRONTEND_RELEASE}/${d}" ]; then
    echo "Frontend release missing ${d}/" >&2
    exit 1
  fi
done
if [ ! -f "${BACKEND_RELEASE}/src/server.js" ]; then
  echo "Backend release missing S1 server.js" >&2
  exit 1
fi
if [ ! -f "$BACKEND_SHARED_ENV" ]; then
  echo "Missing shared env: $BACKEND_SHARED_ENV" >&2
  exit 1
fi

run_migrations
move_news_media

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
