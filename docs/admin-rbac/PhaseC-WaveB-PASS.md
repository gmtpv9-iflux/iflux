# Phase C — Wave B PASS · market_ops + formulas/lot/ranking

**Ngày:** 2026-07-27 · **ĐÓNG**  
**Mẫu:** [`PhaseC-Report-Template.md`](./PhaseC-Report-Template.md) 🔒  
**Batching:** Owner duyệt Wave B

---

## Scope

| | |
|--|--|
| **Pages** | `market.formulas` · `market.lot_threshold` · `market.ranking` · `market_ops.sessions` · `market_ops.missing_ticks` · `market_ops.corrections` |
| **Permissions** | **12** keys |
| **Routes** | **12** |
| **Out of scope** | `market_ops.feed_health` (đã enforce) · `market.stocks` · Wave C+ |

---

## Progress tổng (sau Wave B)

| Metric | Giá trị |
|--------|---------|
| Matrix Coverage | **58.3%** |
| NO_EP còn lại | **88** |
| DEAD | **14** |

## Page Coverage

| Metric | Value |
|--------|------:|
| Matrix pages | **70** |
| Fully enforced | **35** |
| Remaining | **35** |

## Permission Delta

```text
Matrix keys                 211
Enforced permissions
  ↓ trước Wave B            111
  ↓ sau Wave B              123   (+12)
NO_EP
  ↓ trước                   100
  ↓ sau                      88
```

## Delta tổng

```text
211 → … → 97 (C8) → 111 (Wave A) → 123 (Wave B) ← tại đây
```

---

## Coverage delta — PASS

Matrix Coverage **52.6% → 58.3%** · NO_EP **100 → 88**

---

## Route Coverage — PASS

| Method | Path | Perm |
|--------|------|------|
| GET | `/api/admin/market-config/formulas` | `market.formulas.view` |
| PATCH | `/api/admin/market-config/formulas/:id` | `market.formulas.edit` |
| POST | `/api/admin/market-config/formulas/:id/recalculate` | `market.formulas.recalculate` |
| GET | `/api/admin/market-config/lot-threshold` | `market.lot_threshold.view` |
| PATCH | `/api/admin/market-config/lot-threshold` | `market.lot_threshold.edit` |
| GET | `/api/admin/market-config/ranking` | `market.ranking.view` |
| PATCH | `/api/admin/market-config/ranking` | `market.ranking.edit` |
| GET | `/api/admin/market-ops/sessions` | `market_ops.sessions.view` |
| PATCH | `/api/admin/market-ops/sessions/:id` | `market_ops.sessions.edit` |
| GET | `/api/admin/market-ops/missing-ticks` | `market_ops.missing_ticks.view` |
| GET | `/api/admin/market-ops/corrections` | `market_ops.corrections.view` |
| PATCH | `/api/admin/market-ops/corrections/:id` | `market_ops.corrections.edit` |

FAIL = **0**

---

## Permission Coverage — PASS

```text
Page:  market.formulas
NO_EP: 3 → 0
  view · edit · recalculate

Page:  market.lot_threshold
NO_EP: 2 → 0
  view · edit

Page:  market.ranking
NO_EP: 2 → 0
  view · edit

Page:  market_ops.sessions
NO_EP: 2 → 0
  view · edit

Page:  market_ops.missing_ticks
NO_EP: 1 → 0
  view

Page:  market_ops.corrections
NO_EP: 2 → 0
  view · edit
```

---

## Regression — PASS

| Role | formulas GET/PATCH/RECALC | lot GET/PATCH | rank GET/PATCH | sess GET/PATCH | miss GET | corr GET/PATCH |
|------|---------------------------|---------------|----------------|----------------|----------|----------------|
| Admin | 200/200/200 | 200/200 | 200/200 | 200/200 | 200 | 200/200 |
| Marketing | 403/403/403 | 403/403 | 403/403 | 403/403 | 403 | 403/403 |
| Visitor | 200/403/403 | 200/403 | 200/403 | 200/403 | 200 | 200/403 |

---

## Issue found — PASS

**Không.**

---

## Tiến trình

```text
✅ Wave A · ✅ Wave B
⏳ Wave C (ai.* + notifications.*)
⏳ … → Wave F market.stocks cuối
⏳ Final Audit
```
