# 08 — BR-11 Cascade · Import ≠ Apply + IA 3 trang

**Status:** Active · Owner reopen 2026-08-08  
**BRD:** `01-Business-Requirements.md` §16 BR-11

## Owner LOCK (tóm tắt)

| # | Rule |
|---|------|
| 1 | IA: Nguồn Market data · Đồng bộ cấu trúc cổ phiếu · Lịch sử đồng bộ — **không** Đồng bộ danh mục |
| 2 | Import ≠ Apply |
| 3 | Conflict Review = offcanvas phải, chỉ sau Import |
| 4 | History + Audit hoàn tất chỉ sau Apply |
| 5 | Entity cấu trúc = Stock |

## Cascade

| Layer | Action |
|-------|--------|
| BRD | ✅ Updated §16 + §53 |
| SoT / Solution | Align UI Control Plane → 3 routes; bỏ auto-apply trong Import |
| Implementation | FE 3 pages + BE deferApply + apply-batch |
| Verify | Import không đổi Master; Apply mới ghi + History |

## Routes

```text
/admin/thi-truong/data-sources
/admin/thi-truong/dong-bo-cau-truc-co-phieu
/admin/thi-truong/lich-su-dong-bo
```
