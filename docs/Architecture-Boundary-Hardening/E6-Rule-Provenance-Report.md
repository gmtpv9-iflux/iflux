# E6 — Rule Provenance Report (ABH-12)

**Ngày:** 2026-07-27  
**Phase:** E6 — Architecture Boundary Hardening  
**Verdict:** **ABH-TD-E5-001 CLOSED** · **ABH-10 CLOSED** · **ABH-TD-E4-001 CLOSED**

---

## 1. ONE Rule Provenance — entitlement rules

| Rule ID | Rule | Single provenance | Trace chain (Runtime → Admin) | Evidence |
|---------|------|-------------------|-------------------------------|----------|
| R1 | Page access per tier | Plans Runtime Artifact `plans[].pages` | Runtime `IfluxEntitlements.hasPage` → `PlansRuntimeReader.getPlan()` → GET `/api/plans/runtime` → `plans[]` → Publish (`plan-normalize-publish.js` on PUT) → Admin matrix `overrides` | `curl iflux.vn/api/plans/runtime` |
| R2 | Block enabled (`hasBlock`) | Plans Runtime Artifact `plans[].blocks` | `IfluxEntitlements.hasBlock` → `!!plan.blocks[id]` → GET artifact → Publish normalize → Admin matrix | No Runtime `resolveBlockEnabled` |
| R3 | Default blocks/pages/limits | Publish pipeline only | Artifact fields pre-filled at publish — Runtime **không** merge defaults | `rg normalizePlan User_Web/` → 0 |
| R4 | Limits | `plans[].limits` in artifact | Same as R1 | curl payload |
| R5 | Capabilities (`ent`) | `plans[].ent` in artifact | Same as R1 | curl payload |
| R6 | Tier matrix overrides | Admin save → `overrides` → publish rebuild | Admin entitlements UI → PUT `/api/plans/runtime` → `buildPublishedArtifact` | `plans.routes.js` PUT |
| R7 | Widget permission scope | `L4RuntimeReader.widgetIds()` index from artifact WGT keys | `IfluxBlockGate` → L4 index from plans artifact widget ids | `l4-runtime-reader.js` |
| R8 | Static page blocks | Resolved into `plans[].blocks` at publish | Publish `STATIC_PAGE_BLOCKS` in `plan-normalize-publish.js` | backend module |

**Forbidden state removed:** Runtime no longer runs `IfluxPlanNormalize.normalizePlan()`.

---

## 2. Trace example — Premium · `hasBlock('WGT-MKT-006')`

```text
User Web IfluxEntitlements.hasBlock('WGT-MKT-006')
  → currentPlan().blocks['WGT-MKT-006']  (boolean from artifact)
  → PlansRuntimeReader.getPlan('premium')
  → GET https://iflux.vn/api/plans/runtime → plans[tier=premium].blocks
  → buildPublishedArtifact() on last Admin PUT
  → backend/src/modules/subscription/plan-normalize-publish.js
  → Admin entitlement matrix overrides (Policy Owner)
```

**No step:** `User Web plan-normalize-runtime.js`.

---

## 3. ABH COMPLETE checklist (Owner §1 ABH-12)

| # | Điều kiện | Status |
|---|-----------|--------|
| 1 | Không Admin module trên Runtime shell | ✅ E4/E5/E6 |
| 2 | Không compatibility layer | ✅ `installLibraryFacade` removed · 0 `WidgetLibraryCatalog` User Web active |
| 3 | Không second cache `WIDGET_SPECS` | ✅ Removed with facade |
| 4 | ONE Rule Provenance | ✅ Publish artifact |
| 5 | Traceable provenance | ✅ This doc |

---

## 4. Verification commands (reproduce)

```bash
# Runtime must NOT interpret
rg "function normalizePlan\(" User_Web/ --glob "*.js"
# → 0

rg "IfluxPlanNormalize|WidgetLibraryCatalog" User_Web/iflux-web-ui --glob "*.js"
# → 0 active (plan-normalize-runtime.js disabled; .restore ignored)

# Artifact has plans[]
curl -sS "https://iflux.vn/api/plans/runtime" | python3 -c "import json,sys; d=json.load(sys.stdin); assert len(d['plans'])==4"

# Shell boot — no normalize module
curl -sS "https://iflux.vn/User_Web/iflux-web-ui/runtime/shell-boot.js?v=abhE620260727" | rg "IfluxPlanNormalize"
# → 0
```

---

*Provenance owner: Permission Publish pipeline · Runtime consume only.*
