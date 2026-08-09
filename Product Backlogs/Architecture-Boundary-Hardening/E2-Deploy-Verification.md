# ABH E2 — Deploy Verification

**Date:** 2026-07-27  
**Phase:** E1 (readers) + E2 (Placement index API + decouple entitlements)

---

## P2 Baseline (pre-deploy)

| Metric | Value |
|--------|-------|
| p2EnabledCount | **19** |
| Source | [`P2-Baseline-Production.json`](P2-Baseline-Production.json) |

---

## Post-deploy verification

| Check | Result |
|-------|--------|
| Index builder parity (server script) | **19** — match baseline ✅ |
| `GET /api/placement-widget-index` no JWT | **401** ✅ |
| `entitlements.html` — no page-settings scripts | ✅ |
| `entitlement-matrix-ui.js` — no PageSettingsCatalog | ✅ |

---

## Shipped

**Backend**

- `artifact-store.listCurrentPages()` / `listCurrentWidgetIds()`
- `placement-widget-index.service.js`
- `GET /api/placement-widget-index` (JWT `subscription.entitlements.view`)

**Admin**

- `Admin_Design_system/shared/runtime-read/widget-registry-reader.js`
- `Admin_Design_system/shared/runtime-read/placement-widget-index-reader.js`
- `entitlements.html` — removed Placement store coupling
- `entitlement-matrix-ui.js` — enabled filter via index reader
- `entitlement-catalog.js` — removed PageSettings fallback

**Deploy:** Production + Cloudflare purge ✅

---

## Manual (Owner)

Open [Admin entitlements](https://iflux.vn/admin/goi-cuoc/entitlements) → filter **"Chỉ Widget đang Bật"** → expect **19 rows**.

**Owner verify 2026-07-27:** ✅ **19 widget** — P2 parity PASS. E2 closed.

---

## Next phases

- E3 — L4 ↔ Permission event-driven
- E4 — Runtime PlansRuntimeReader / shell-boot
- E5 — Remove EntitlementCatalog from User Web shell
- E6 — Exit deliverables
