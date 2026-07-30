# Phase C — Wave E PASS · subscription + system + access sót + stories.*

**Ngày:** 2026-07-27 · **ĐÓNG**  
**Mẫu:** [`PhaseC-Report-Template.md`](./PhaseC-Report-Template.md) 🔒  
**Batching:** Owner duyệt Wave E

---

## Scope

| | |
|--|--|
| **Pages** | `access.admin_accounts` (status_*) · `access.roles.assign_permission` · `stories.analytics` · `stories.cau_chuyen_detail` · `stories.registry` (delete/status_*) · `subscription.plans|entitlements|loyalty|subscribers` · `system.core_setup|feature_flags|maintenance|platform_layers|sla` |
| **Permissions** | **30** keys |
| **Out of scope** | Wave F `market.stocks` · DEAD 14 |

---

## Progress tổng (sau Wave E)

| Metric | Giá trị |
|--------|---------|
| Matrix Coverage | **95.7%** |
| NO_EP còn lại | **9** |
| DEAD | **14** |

## Page Coverage

| Metric | Value |
|--------|------:|
| Matrix pages | **70** |
| Fully enforced | **69** |
| Remaining | **1** |

## Permission Delta

```text
Matrix keys                 211
Enforced permissions
  ↓ trước Wave E            172
  ↓ sau Wave E              202   (+30)
NO_EP
  ↓ trước                    39
  ↓ sau                       9
```

## Delta tổng

```text
211 → … → 172 (Wave D) → 202 (Wave E) ← tại đây
```

---

## Coverage delta — PASS

Matrix Coverage **81.5% → 95.7%** · NO_EP **39 → 9**

---

## Route Coverage — PASS (FAIL = 0)

| Prefix | Keys |
|--------|------|
| `PATCH /api/admin/access/accounts/:id/status` | `status_active` · `status_locked` |
| `PUT /api/admin/access/roles/:id/permissions` | `access.roles.assign_permission` (+ `access.permissions.assign_permission`) |
| `/api/admin/subscription/*` | plans CRUD · entitlements/loyalty view\|edit · subscribers view\|export |
| `/api/admin/system/*` | core_setup · feature_flags · maintenance · platform_layers · sla |
| `/api/admin/stories/*` | analytics.view · cau_chuyen_detail view\|edit |
| `/api/content/admin/chu-de/:id` DELETE + status-* | registry.delete · status_new\|mature\|declining |

Migration: `035_wave_e_sub_system_stories.sql`

---

## Permission Coverage — PASS

```text
Page:  access.admin_accounts
NO_EP: 2 → 0
  status_active · status_locked

Page:  access.roles
NO_EP: 1 → 0
  assign_permission

Page:  stories.analytics
NO_EP: 1 → 0
  view

Page:  stories.cau_chuyen_detail
NO_EP: 2 → 0
  view · edit

Page:  stories.registry
NO_EP: 4 → 0
  delete · status_new · status_mature · status_declining

Page:  subscription.plans
NO_EP: 4 → 0
  view · create · edit · delete

Page:  subscription.entitlements
NO_EP: 2 → 0
  view · edit

Page:  subscription.loyalty
NO_EP: 2 → 0
  view · edit

Page:  subscription.subscribers
NO_EP: 2 → 0
  view · export

Page:  system.core_setup
NO_EP: 3 → 0
  view · edit · configure

Page:  system.feature_flags
NO_EP: 2 → 0
  view · edit

Page:  system.maintenance
NO_EP: 2 → 0
  view · configure

Page:  system.platform_layers
NO_EP: 1 → 0
  view

Page:  system.sla
NO_EP: 2 → 0
  view · edit
```

---

## Regression — PASS

Admin mutate/view = 200/201 · Visitor mutate = 403 (đúng key Matrix).  
Visitor GET một số view = 200 — **đúng DB**: role Visitor có `subscription.plans.view` · `subscribers.view` · `system.platform_layers.view` · `stories.analytics.view`.

---

## Issue found — PASS

**Không** (expectation Visitor 403 trên view sai — role có quyền view trong DB).

---

## Tiến trình

```text
✅ Wave A–E
⏳ Wave F market.stocks (9) cuối
⏳ Final Audit
```
