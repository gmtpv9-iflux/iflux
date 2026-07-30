# Phase C — NO_EP-5 PASS · `market.sectors`

**Ngày:** 2026-07-27 · **ĐÓNG**  
**Mẫu:** [`PhaseC-Report-Template.md`](./PhaseC-Report-Template.md) 🔒 · **1 page only**

---

## Scope

| | |
|--|--|
| **Page** | `market.sectors` |
| **Permissions** | `view` · `create` · `edit` · `delete` |
| **Routes** | **5** |
| **Out of scope** | `market.ecosystems` · `market.stocks` · `community.*` · mọi page khác |

---

## Progress tổng (sau C5)

| Metric | Giá trị |
|--------|---------|
| Matrix Coverage | **38.4%** |
| NO_EP còn lại | **130** |
| DEAD | **14** |

## Page Coverage

| Metric | Value |
|--------|------:|
| Matrix pages | **70** |
| Fully enforced | **14** |
| Remaining | **56** |

## Permission Delta

```text
Matrix keys                 211
Enforced permissions
  ↓ trước C5                 77
  ↓ sau C5                   81   (+4)
NO_EP
  ↓ trước                   134
  ↓ sau                     130
```

## Delta tổng

```text
211 keys → 56 (A/B) → 62 (C1) → 67 (C2) → 73 (C3) → 77 (C4) → 81 (C5) ← tại đây
```

---

## Coverage delta — PASS

Matrix Coverage **36.5% → 38.4%** · NO_EP **134 → 130**

---

## Route Coverage — PASS

| Module | Routes | FAIL |
|--------|-------:|-----:|
| `market.sectors` | **5** | **0** |

Routes:

| Method | Path | Perm |
|--------|------|------|
| GET | `/api/admin/sectors` | `view` |
| GET | `/api/admin/sectors/:id` | `view` |
| POST | `/api/admin/sectors` | `create` |
| PATCH | `/api/admin/sectors/:id` | `edit` |
| DELETE | `/api/admin/sectors/:id` | `delete` |

---

## Permission Coverage — PASS

```text
Page:  market.sectors
NO_EP: 4 → 0

  view
  create
  edit
  delete
```

4/4 key page enforce (Final Audit ghép thẳng, không tự tính).

---

## Regression — PASS

| Role | List | Create | Edit | Delete |
|------|------|--------|------|--------|
| Admin | 200 | 201 | 200 | 200 |
| Marketing | 403 | 403 | — | — |
| Visitor | 200 | 403 | — | 403 |

---

## Issue found — PASS

**Có → đã fix.**

| | |
|--|--|
| **Evidence** | Admin POST 500: `column "is_active" of relation "sectors" does not exist` |
| **Fix** | Migration `027_market_sectors_admin.sql` (thêm `is_active` · `updated_at` · seed 19 ngành) · chạy bằng owner `postgres` · `ALTER TABLE sectors OWNER TO iflux` |
| **Re-test** | Admin CRUD 200/201 PASS |

---

## Tiến trình

```text
✅ A · ✅ B · ✅ C1 · ✅ C2 · ✅ C3 · ✅ C4 · ✅ C5
⏳ C6 (Owner mở) — market.ecosystems
⏳ … → market.stocks cuối
⏳ Final Audit — bảng đóng task trong template
```
