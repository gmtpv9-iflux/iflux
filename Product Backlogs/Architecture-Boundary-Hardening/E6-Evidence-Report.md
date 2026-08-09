# E6 — Evidence Report

**Ngày:** 2026-07-27  
**Deploy:** Production https://iflux.vn + Cloudflare purge  
**Cache buster:** `abhE620260727`

---

## 1. ABH-TD-E5-001 — Generated Artifact

| Item | Evidence |
|------|----------|
| Publish normalize | `backend/src/modules/subscription/plan-normalize-publish.js` |
| PUT rebuild artifact | `plans.routes.js` → `writeRuntimeFile` → `buildPublishedArtifact` |
| GET returns `plans[]` | `curl iflux.vn/api/plans/runtime` → 4 plans |
| Runtime consume only | `plans-runtime-reader.js` — no client normalize |
| Runtime interpreter removed | `plan-normalize-runtime.js` **DELETED** · not in `shell-boot.js` |

---

## 2. ABH-10 — Facade sunset

| Before | After |
|--------|-------|
| `installLibraryFacade()` → `WidgetLibraryCatalog` | **Removed** from `l4-runtime-reader.js` |
| 11 consumers on facade | Migrated to `L4RuntimeReader` |

```bash
rg "WidgetLibraryCatalog" User_Web/iflux-web-ui --glob "*.js"
# → 0 active (only .restore backup)
```

---

## 3. ABH-TD-E4-001 — No WIDGET_SPECS second cache

| Before | After |
|--------|-------|
| `WIDGET_SPECS` snapshot + `_meta` | `_meta` only via `entitlementMeta()` |

Facade removed — snapshot deleted with it.

---

## 4. ABH-TD-E4-003 — Rename

| Old | New |
|-----|-----|
| `widgetsForPage()` on facade | `L4RuntimeReader.widgetIdsForEntitlementDomain()` |

---

## 5. Production verify (2026-07-27)

```text
GET /api/plans/runtime → plans: 4 tiers: free, premium, elite, guest
shell-boot.js → PlansRuntimeReader + L4RuntimeReader + IfluxEntitlements (no IfluxPlanNormalize)
```

---

## 6. Verdict

| Gate | Status |
|------|--------|
| ABH-TD-E5-001 | ✅ CLOSED |
| ABH-12 traceability | ✅ [`E6-Rule-Provenance-Report.md`](E6-Rule-Provenance-Report.md) |
| ABH-10 | ✅ CLOSED |
| ABH-TD-E4-001 | ✅ CLOSED |
| **E6 phase** | ✅ **PASS** |
| **ABH COMPLETE** | ✅ — [`Final-Exit-Evidence.md`](Final-Exit-Evidence.md) submitted |

## 7. Exit deliverables §8 (complete)

| # | File | Status |
|---|------|--------|
| 1 | [`Exit-Ownership-Matrix.md`](Exit-Ownership-Matrix.md) | ✅ |
| 2 | [`Exit-Dependency-Graph.md`](Exit-Dependency-Graph.md) | ✅ |
| 3 | [`Exit-Runtime-Ownership.md`](Exit-Runtime-Ownership.md) | ✅ |
| 4 | [`Exit-Shared-Read-Models.md`](Exit-Shared-Read-Models.md) | ✅ |
| 5 | [`Exit-Coupling-Report.md`](Exit-Coupling-Report.md) | ✅ |
| 6 | [`Exit-Regression-Report.md`](Exit-Regression-Report.md) | ✅ **Kiểm chứng User Web** |
| 7 | [`Exit-Security-Regression.md`](Exit-Security-Regression.md) | ✅ |
| 8 | [`Final-Exit-Evidence.md`](Final-Exit-Evidence.md) | ✅ **Reviewer sign-off pack** |

---

*Hard refresh https://iflux.vn/home — xem [`Exit-Regression-Report.md`](Exit-Regression-Report.md) §2 · Final proof [`Final-Exit-Evidence.md`](Final-Exit-Evidence.md).*
