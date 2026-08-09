# Phase C — NO_EP-1 PASS · `subscription.transactions`

**Ngày:** 2026-07-26 · **ĐÓNG**  
**Kế hoạch:** [`PhaseC-NOEP1-Plan.md`](./PhaseC-NOEP1-Plan.md)  
**Mẫu:** [`PhaseC-Report-Template.md`](./PhaseC-Report-Template.md) 🔒

---

## Scope

| | |
|--|--|
| **Page** | `subscription.transactions` |
| **Permissions** | `view` · `create` · `edit` · `export` · `cancel` · `approve_payment` · `refund` · `status_pending` · `status_approved` · `status_paid` · `status_rejected` · `status_refunded` |
| **Routes** | **9** |
| **Out of scope** | `users.*` · `community.*` · `market.*` · `stories.*` · mọi page Matrix khác |

---

## Progress tổng (sau C1)

| Metric | Giá trị |
|--------|---------|
| Matrix Coverage | **29.4%** |
| NO_EP còn lại | **149** |
| DEAD | **14** |

## Page Coverage

| Metric | Value |
|--------|------:|
| Matrix pages | **70** |
| Fully enforced | **10** |
| Remaining | **60** |

## Permission Delta

```text
Matrix keys                 211
Enforced permissions
  ↓ trước C1                 56
  ↓ sau C1                   62   (+6)
NO_EP
  ↓ trước                   155
  ↓ sau                     149
```

## Delta tổng

```text
211 keys → 56 (A/B) → 62 (C1) ← tại đây
```

---

## Coverage delta — PASS

Matrix Coverage **26.5% → 29.4%** · NO_EP **155 → 149**

---

## Route Coverage — PASS

| Module | Routes | FAIL |
|--------|-------:|-----:|
| `subscription.transactions` | **9** | **0** |

(GET orders/stats/export · POST admin/approve/reject/refund · PATCH · DELETE)

---

## Permission Coverage — PASS

**NO_EP cụm: 6 → 0** (export · refund · status_pending|approved|paid|refunded).  
12/12 key page đã enforce.

---

## Regression — PASS

| Role | Export | Refund | Change Status |
|------|--------|--------|---------------|
| Admin | 200 | 200 | 200 |
| Marketing | 200 | 403 | 403 paid / 200 approved |
| Visitor | 403 | 403 | 403 |

---

## Issue found — PASS

**Có** · SQL `$11` refund/status → 500 · Fix `$16` · Re-test 200.

---

Cụm Đơn hàng · Server + UI. Chi tiết lịch sử: [`Audit-NOEP-DEAD-List.md`](./Audit-NOEP-DEAD-List.md).
