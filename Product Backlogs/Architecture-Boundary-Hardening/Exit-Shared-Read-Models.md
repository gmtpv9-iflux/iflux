# Exit — Shared Read Models Catalog (ABH E6)

**Ngày:** 2026-07-27  
**Rule:** AB-07 — Read / Projection / Index / Lookup only · cấm Save/Publish/Hydrate

---

## 1. User Web Runtime readers

| Reader | Path | HTTP | Whitelist API | Consumers |
|--------|------|------|---------------|-----------|
| **PlansRuntimeReader** | `User_Web/iflux-web-ui/readers/plans-runtime-reader.js` | GET `/api/plans/runtime` | `load`, `getPlan`, `listPlans`, `listTiers`, `formatVnd`, `isReady` | `IfluxEntitlements`, `IfluxGuestShell`, `iflux-plans-catalog`, `L4RuntimeReader.load` |
| **L4RuntimeReader** | `User_Web/iflux-web-ui/readers/l4-runtime-reader.js` | GET `/api/widgets/:id` (lazy) | `load`, `widgetIds`, `widgetIdsForEntitlementDomain`, `entitlementMeta`, `resolveWidgetCopy`, `fetchWidget`, `entitlementList`, `isReady` | `IfluxEntitlements`, `IfluxBlockGate`, `widget-registry`, `dashboard-engine`, widgets |

**E6 change:** PlansRuntimeReader consumes **`plans[]`** published field — no client normalize.

---

## 2. Admin shared readers (`Admin_Design_system/shared/runtime-read/`)

| Reader | Path | HTTP | Scope |
|--------|------|------|-------|
| **PlacementWidgetIndexReader** | `placement-widget-index-reader.js` | GET `/api/placement-widget-index` | Admin Permission UI filter |
| **WidgetRegistryReader** | `widget-registry-reader.js` | Read-only registry index | Admin cross-ref |

Admin readers **không** load trên User Web shell.

---

## 3. Backend published artifacts (not browser modules)

| Artifact | Storage | Builder | Runtime contract |
|----------|---------|---------|------------------|
| **Plans Runtime Artifact** | `backend/data/plans-runtime.json` | `plan-normalize-publish.js` on PUT | `{ version, updatedAt, overrides, custom, plans[] }` |
| **Page Published Artifact** | DB `page_published_versions` | `widget-publish.service.js` | GET `/api/pages/:key` |
| **Placement Widget Index** | Server projection | Index builder from Page Published | GET `/api/placement-widget-index` |

---

## 4. AB-07 lint checklist (E6 pass)

```bash
rg "\.(save|publish|hydrate|sync|refresh|localStorage)\(" User_Web/iflux-web-ui/readers/
# → 0 functional
```

| Check | PlansRuntimeReader | L4RuntimeReader |
|-------|-------------------|-----------------|
| GET only | ✅ | ✅ |
| Memory cache | ✅ | ✅ `_meta` |
| No mutate source | ✅ | ✅ |
| No Admin import | ✅ | ✅ |

---

## 5. Removed (E6 — not in catalog)

| Removed | Reason |
|---------|--------|
| `WidgetLibraryCatalog` facade | ABH-10 compatibility sunset |
| `WIDGET_SPECS` snapshot | ABH-TD-E4-001 second cache |
| `IfluxPlanNormalize` | ABH-TD-E5-001 — provenance moved to publish |
