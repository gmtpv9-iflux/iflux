# Phase C — NO_EP-4 PASS · `community.rss_providers`

**Ngày:** 2026-07-26 · **ĐÓNG**  
**Mẫu:** [`PhaseC-Report-Template.md`](./PhaseC-Report-Template.md) 🔒 · **1 page only**

---

## Scope

| | |
|--|--|
| **Page** | `community.rss_providers` |
| **Permissions** | `view` · `create` · `edit` · `delete` |
| **Routes** | **5** |
| **Out of scope** | `community.rss_category_sync` · `community.rss_article_schema` · `community.stories` · `market.*` · mọi page khác |

---

## Progress tổng (sau C4)

| Metric | Giá trị |
|--------|---------|
| Matrix Coverage | **36.5%** |
| NO_EP còn lại | **134** |
| DEAD | **14** |

## Page Coverage

| Metric | Value |
|--------|------:|
| Matrix pages | **70** |
| Fully enforced | **13** |
| Remaining | **57** |

## Permission Delta

```text
Matrix keys                 211
Enforced permissions
  ↓ trước C4                 73
  ↓ sau C4                   77   (+4)
NO_EP
  ↓ trước                   138
  ↓ sau                     134
```

## Delta tổng

```text
211 keys → 56 (A/B) → 62 (C1) → 67 (C2) → 73 (C3) → 77 (C4) ← tại đây
```

---

## Coverage delta — PASS

Matrix Coverage **34.6% → 36.5%** · NO_EP **138 → 134**

---

## Route Coverage — PASS

| Module | Routes | FAIL |
|--------|-------:|-----:|
| `community.rss_providers` | **5** | **0** |

Routes:

| Method | Path | Perm |
|--------|------|------|
| GET | `/api/community/admin/rss-providers` | `view` |
| GET | `/api/community/admin/rss-providers/:id` | `view` |
| POST | `/api/community/admin/rss-providers` | `create` |
| PATCH | `/api/community/admin/rss-providers/:id` | `edit` |
| DELETE | `/api/community/admin/rss-providers/:id` | `delete` |

---

## Permission Coverage — PASS

```text
Page:  community.rss_providers
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

**Không.**

*(UI trước C4 chỉ đọc catalog tĩnh — đã thay bằng API + offcanvas CRUD + `data-ix-perm`. Seed 3 provider: cafef / vietstock / baodautu.)*

---

## Tiến trình

```text
✅ A · ✅ B · ✅ C1 · ✅ C2 · ✅ C3 · ✅ C4 · ✅ C5
⏳ C6 (Owner mở) — market.ecosystems
⏳ Final Audit — bảng đóng task trong template
```
