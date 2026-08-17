#!/usr/bin/env bash
#
# Lắp web root tĩnh từ cấu trúc canonical.
#
# Mã nguồn chia theo ranh giới kiến trúc (packages/ dùng chung, apps/ theo ứng
# dụng) nhưng trình duyệt cần một cây URL. Script này là chỗ hai thứ đó gặp
# nhau — không có bundler, không phụ thuộc npm, không ghép CSS.
#
#   packages/design-system/  -->  dist/assets/design-system/
#   apps/web/                -->  dist/
#
# Trang nạp đúng một <link> /assets/design-system/index.css. Browser theo
# @import trong manifest và tải từng file con — DevTools thấy đúng path + dòng.
# CẤM sinh ds.css / source map / cat các file CSS thành một artifact.
#
# CSS cấp module/trang nằm sẵn cạnh trang sở hữu nó trong apps/ nên được chép
# nguyên vị trí; chỉ trang đó nạp.
#
# dist/ là sản phẩm dựng, không commit. CI chạy script này rồi mới copy dist/.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DS="$ROOT/packages/design-system"
OUT="$ROOT/dist"

rm -rf "$OUT"
mkdir -p "$OUT/assets"

# Cây Design System nguyên vẹn — fonts.css url('./fonts/…') và sprite
# foundation/icons.svg giữ đúng vị trí tương đối như trong Git.
cp -R "$DS" "$OUT/assets/design-system"

# ---- Ứng dụng ----
cp -R "$ROOT/apps/web/." "$OUT/"

if [ -e "$OUT/assets/ds.css" ]; then
  echo "CAM: không được sinh dist/assets/ds.css" >&2
  exit 1
fi

count_css=$(find "$OUT/assets/design-system" -name '*.css' | wc -l | tr -d ' ')
echo "dist/assets/design-system/  <- $count_css file CSS (cây nguyên vẹn, không ghép)"
echo "dist/                       <- $(find "$OUT" -type f | wc -l | tr -d ' ') file tổng cộng"
