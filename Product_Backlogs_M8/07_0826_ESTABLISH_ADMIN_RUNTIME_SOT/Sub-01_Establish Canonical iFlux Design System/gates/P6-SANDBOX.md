# Gate — Canonical Sandbox Normalization

**Ngày:** 2026-08-26  
**Status:** OPEN — chờ TECHNICAL PASS + OWNER UI PASS  
**Trước:** P6-W01 = PASS / LOCKED  
**Sau khi PASS:** mới OPEN P6-W02

URL: https://staging.iflux.vn/design_system/sandbox/

---

## Bản chất

Sandbox = consumer của Canonical DS (P1–P5 + capability W01).  
Catalog / inspect / visual + interaction acceptance / responsive / theme / regression.

Xóa `design_system/sandbox/` → Canonical DS vẫn đầy đủ.

---

## Navigation

`?section=` + `?panel=`

| Section | Layer |
|---|---|
| tokens | P1 |
| foundation | P2 |
| primitives | P3 |
| components | P4 |
| patterns | P5 |
| references | P6 (không phải Pattern) |
| visual | acceptance |
| contract | ownership / dependency / naming / migration |

---

## W01 phải nhìn thấy

- P4 Stat Strip — `?section=components&panel=stat-strip`
- P4 Table — `?section=components&panel=table`
- P4 Pagination — `?section=components&panel=pagination`
- P5 Data List — `?section=patterns&panel=data-list`
- W01 Reference — `?section=references&panel=w01`

---

## Automated

`node design_system/scripts/check-governance.mjs`

Canonical `.ifx-*` definition trong `sandbox/**/*.css` = 0.

---

## Owner checklist

```text
[ ] A Foundation — viewport × grid một preview · container · typography · icons · theme
[ ] B Primitives — variants / states / sizes
[ ] C Components — Stat Strip · Table · Pagination · các P4 hiện có
[ ] D Patterns — Data List + P5 khác
[ ] E References — W01 Bảng danh sách
[ ] F Navigation — section/panel, không một trang cực dài
[ ] G Source ownership — demo consume canonical · sandbox ifx definition = 0
```

```text
[ ] OWNER UI PASS  → mở P6-W02
[ ] REJECT → sửa sandbox · W02 vẫn BLOCKED
```
