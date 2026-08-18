# ABH E0 — Regression Baseline Checklist

**Purpose:** Before/after probes — behavior must match.

---

## Admin — Permission matrix

| # | Probe | Baseline capture |
|---|-------|------------------|
| 1 | Open `/admin/goi-cuoc/entitlements` | Screenshot filter "Tất cả" vs "Chỉ Widget đang Bật" row count |
| 2 | Toggle block for tier premium | Save → reload → block state persists |
| 3 | L4 save widget | Matrix block list includes new widgetId |

---

## Admin — Placement / Publish

| # | Probe |
|---|-------|
| 4 | Page settings publish home | GET `/api/pages/home` returns placements + widgetRefs |
| 5 | Draft save RBAC | PUT page-composition without auth → 403 |

---

## User Web — Runtime entitlement

| # | Probe | Tier |
|---|-------|------|
| 6 | `/home` guest | Menu pages per guest plan |
| 7 | `/home` free user | Dashboard access |
| 8 | Block paywall | Premium widget shows paywall for free |
| 9 | `IfluxEntitlements.hasBlock('WGT-...')` | Console spot-check 3 ids |

---

## User Web — Boot storage (RO-06/07)

| # | Probe |
|---|-------|
| 10 | Fresh load `/home` | Note if `iflux-admin-plans-v1` / `iflux_l4_widgets_v2` written (Before: yes on hydrate) |
| 11 | Network | `/api/plans/runtime` called ≤2 per session |

---

## Security (unchanged)

| # | Probe | Expected |
|---|-------|----------|
| 12 | PUT plans/runtime no auth | 403 |
| 13 | PATCH entitlements no auth | 403 |

---

## Capture method

Run on Production `https://iflux.vn` before E2/E4 deploy. Record in `Exit-Regression-Report.md` at E6.
