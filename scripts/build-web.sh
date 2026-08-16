#!/usr/bin/env bash
#
# Lắp web root tĩnh từ cấu trúc canonical.
#
# Mã nguồn chia theo ranh giới kiến trúc (packages/ dùng chung, apps/ theo ứng
# dụng) nhưng trình duyệt cần một cây thư mục phẳng. Script này là chỗ hai thứ
# đó gặp nhau — không có bundler, không phụ thuộc npm.
#
#   packages/design-system/index.css  --nội tuyến @import-->  dist/assets/ds.css
#   packages/design-system/foundation/{fonts,icons.svg}  -->  dist/assets/
#   apps/web/                                            -->  dist/
#
# CSS cấp module/trang nằm sẵn cạnh trang sở hữu nó trong apps/ nên được chép
# nguyên vị trí; chỉ trang đó nạp. Đây là ranh giới giữ bundle chung khỏi phình
# theo số module.
#
# dist/ là sản phẩm dựng, không commit. CI chạy script này rồi mới copy dist/.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DS="$ROOT/packages/design-system"
OUT="$ROOT/dist"

rm -rf "$OUT"
mkdir -p "$OUT/assets"

# ---- CSS dùng chung: nội tuyến theo đúng thứ tự @import trong manifest ----
# Thứ tự import chính là cascade (hợp đồng khóa trong index.css) nên phải giữ
# nguyên trình tự, không sắp xếp lại.
{
  echo "/* Sinh bởi scripts/build-web.sh — không sửa tay."
  echo "   Nguồn: packages/design-system/index.css và các file nó import. */"
  awk -F"'" '/^@import url\(/ { print $2 }' "$DS/index.css" | while IFS= read -r rel; do
    src="$DS/${rel#./}"
    [ -f "$src" ] || { echo "THIEU FILE: $src" >&2; exit 1; }
    printf '\n/* ==== %s ==== */\n' "${rel#./}"
    cat "$src"
  done
} > "$OUT/assets/ds.css"

# Font và sprite icon: fonts.css trỏ url('./fonts/…') tương đối so với file CSS,
# mà file CSS nay nằm ở /assets/ — nên hai thứ này phải nằm cạnh nó.
cp -R "$DS/foundation/fonts" "$OUT/assets/fonts"
cp "$DS/foundation/icons.svg" "$OUT/assets/icons.svg"

# ---- Ứng dụng ----
cp -R "$ROOT/apps/web/." "$OUT/"

count_import=$(awk -F"'" '/^@import url\(/ { print $2 }' "$DS/index.css" | wc -l | tr -d ' ')
echo "dist/assets/ds.css  <- $count_import file  ($(wc -c < "$OUT/assets/ds.css") bytes)"
echo "dist/              <- $(find "$OUT" -type f | wc -l | tr -d ' ') file tổng cộng"
