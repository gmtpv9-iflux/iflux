# Phase C — NO_EP-7 PASS · `data.etl_jobs`

**Ngày:** 2026-07-27 · **ĐÓNG**  
**Mẫu:** [`PhaseC-Report-Template.md`](./PhaseC-Report-Template.md) 🔒 · **1 page only**

---

## Scope

| | |
|--|--|
| **Page** | `data.etl_jobs` |
| **Permissions** | `view` · `create` · `edit` · `delete` · `execute` |
| **Routes** | **6** |
| **Out of scope** | `data.sources` · `data.pipeline` · `market.stocks` · mọi page khác |

---

## Progress tổng (sau C7)

| Metric | Giá trị |
|--------|---------|
| Matrix Coverage | **43.6%** |
| NO_EP còn lại | **119** |
| DEAD | **14** |

## Page Coverage

| Metric | Value |
|--------|------:|
| Matrix pages | **70** |
| Fully enforced | **16** |
| Remaining | **54** |

## Permission Delta

```text
Matrix keys                 211
Enforced permissions
  ↓ trước C7                 87
  ↓ sau C7                   92   (+5)
NO_EP
  ↓ trước                   124
  ↓ sau                     119
```

## Delta tổng

```text
211 keys → 56 (A/B) → 62 (C1) → 67 (C2) → 73 (C3) → 77 (C4) → 81 (C5) → 87 (C6) → 92 (C7) ← tại đây
```

---

## Coverage delta — PASS

Matrix Coverage **41.2% → 43.6%** · NO_EP **124 → 119**

---

## Route Coverage — PASS

| Module | Routes | FAIL |
|--------|-------:|-----:|
| `data.etl_jobs` | **6** | **0** |

Routes:

| Method | Path | Perm |
|--------|------|------|
| GET | `/api/admin/etl-jobs` | `view` |
| GET | `/api/admin/etl-jobs/:id` | `view` |
| POST | `/api/admin/etl-jobs` | `create` |
| PATCH | `/api/admin/etl-jobs/:id` | `edit` |
| POST | `/api/admin/etl-jobs/:id/execute` | `execute` |
| DELETE | `/api/admin/etl-jobs/:id` | `delete` |

---

## Permission Coverage — PASS

```text
Page:  data.etl_jobs
NO_EP: 5 → 0

  view
  create
  edit
  delete
  execute
```

5/5 key page enforce (Final Audit ghép thẳng, không tự tính).

---

## Regression — PASS

| Role | List | Create | Edit | Execute | Delete |
|------|------|--------|------|---------|--------|
| Admin | 200 | 201 | 200 | 200 | 200 |
| Marketing | 403 | 403 | — | — | — |
| Visitor | 200 | — | — | 403 | 403 |

---

## Issue found — PASS

**Không.**

*(Trước C7: stub GD1. Đã thay API + UI CRUD/Chạy · migration `029` seed 2 job.)*

---

## Tiến trình

```text
✅ A · ✅ B · ✅ C1 … C7
⏳ C8 (Owner mở) — gợi ý data.sources
⏳ … → market.stocks cuối
⏳ Final Audit
```
