#!/usr/bin/env bash
#
# Chạy migration Staging 2 theo thứ tự số.
# Bỏ version đã có trong schema_migrations. Mỗi tệp một transaction.
# Gọi với user postgres (peer). Không dùng role ứng dụng staging_2 — không ALTER được.
#
# Usage: bash scripts/migrate.sh [migrations-dir]

set -euo pipefail

DIR="${1:-}"
if [ -z "$DIR" ]; then
  DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/database/migrations"
fi

DB="${PGDATABASE:-staging_2}"

if [ ! -d "$DIR" ]; then
  echo "migrate: khong thay thu muc $DIR" >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "migrate: thieu psql" >&2
  exit 1
fi

applied="$(psql -d "$DB" -v ON_ERROR_STOP=1 -tAc "SELECT version FROM schema_migrations")"

shopt -s nullglob
files=("$DIR"/[0-9][0-9][0-9][0-9]_*.sql)
if [ ${#files[@]} -eq 0 ]; then
  echo "migrate: khong co tep sql trong $DIR"
  exit 0
fi

IFS=$'\n' files_sorted=($(printf '%s\n' "${files[@]}" | sort))
unset IFS

ran=0
for f in "${files_sorted[@]}"; do
  base="$(basename "$f")"
  if [[ ! "$base" =~ ^[0-9]{4}_[a-z0-9_]+\.sql$ ]]; then
    echo "migrate: bo qua ten khong hop le: $base" >&2
    continue
  fi
  version="${base%.sql}"
  if printf '%s\n' "$applied" | grep -Fxq "$version"; then
    echo "migrate: skip $version"
    continue
  fi
  echo "migrate: apply $version"
  psql -d "$DB" -v ON_ERROR_STOP=1 -1 -f "$f"
  ran=$((ran + 1))
done

echo "migrate: xong ($ran tep moi) db=$DB"
