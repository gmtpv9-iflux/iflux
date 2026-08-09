# Phase C — Wave D PASS · metadata + brand + community còn

**Ngày:** 2026-07-27 · **ĐÓNG**  
**Mẫu:** [`PhaseC-Report-Template.md`](./PhaseC-Report-Template.md) 🔒  
**Batching:** Owner duyệt Wave D

---

## Scope

| | |
|--|--|
| **Pages** | `metadata.enums|sector_types|themes|story_lifecycle` · `marketing.brand_identity` · `community.categories` (status_*) · `comments` · `content_dashboard` · `reports` · `rss_article_schema` · `rss_category_sync` |
| **Permissions** | **26** keys |
| **Out of scope** | Wave E+ · `market.stocks` |

---

## Progress tổng (sau Wave D)

| Metric | Giá trị |
|--------|---------|
| Matrix Coverage | **81.5%** |
| NO_EP còn lại | **39** |
| DEAD | **14** |

## Page Coverage

| Metric | Value |
|--------|------:|
| Matrix pages | **70** |
| Fully enforced | **55** |
| Remaining | **15** |

## Permission Delta

```text
Matrix keys                 211
Enforced permissions
  ↓ trước Wave D            146
  ↓ sau Wave D              172   (+26)
NO_EP
  ↓ trước                    65
  ↓ sau                      39
```

## Delta tổng

```text
211 → … → 146 (Wave C) → 172 (Wave D) ← tại đây
```

---

## Coverage delta — PASS

Matrix Coverage **69.2% → 81.5%** · NO_EP **65 → 39**

---

## Route Coverage — PASS (FAIL = 0)

Mounts: `/api/admin/metadata/*` · `/api/admin/marketing/brand-identity` · `/api/admin/community-ops/*` · `/api/community/admin/categories/:id/status-visible|status-hidden`

---

## Permission Coverage — PASS

```text
Page:  metadata.enums
NO_EP: 4 → 0
  view · create · edit · delete

Page:  metadata.sector_types
NO_EP: 4 → 0
  view · create · edit · delete

Page:  metadata.themes
NO_EP: 2 → 0
  view · edit

Page:  metadata.story_lifecycle
NO_EP: 2 → 0
  view · edit

Page:  marketing.brand_identity
NO_EP: 2 → 0
  view · edit

Page:  community.categories
NO_EP: 2 → 0
  status_visible · status_hidden
  (CRUD đã enforce trước)

Page:  community.comments
NO_EP: 2 → 0
  view · delete

Page:  community.content_dashboard
NO_EP: 1 → 0
  view

Page:  community.reports
NO_EP: 2 → 0
  view · edit

Page:  community.rss_article_schema
NO_EP: 2 → 0
  view · edit
  (execute đã enforce trước)

Page:  community.rss_category_sync
NO_EP: 3 → 0
  view · edit · execute
```

---

## Regression — PASS

Admin views/creates/status/exec = 200/201 · Visitor mutate = 403 · Marketing comments GET = 200 (đúng DB: có `community.comments.view`).

---

## Issue found — PASS

**Không** (expectation Marketing 403 comments sai — role có quyền view).

---

## Tiến trình

```text
✅ Wave A–D
✅ Wave E (đã đóng — xem PhaseC-WaveE-PASS.md)
⏳ Wave F market.stocks cuối
⏳ Final Audit
```
