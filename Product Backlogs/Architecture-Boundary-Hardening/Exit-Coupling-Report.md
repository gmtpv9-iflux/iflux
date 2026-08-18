# Exit — Cross-WGS Coupling Report (ABH E6)

**Ngày:** 2026-07-27  
**Scope:** Coupling **closed** vs **allowed reference** post-E6

---

## 1. Coupling removed (violations fixed)

| ID | Before | After | Phase |
|----|--------|-------|-------|
| C-01 | User Web shell loads `EntitlementCatalog` | 0 load | E5 |
| C-02 | User Web shell loads `PlansStore` | 0 load | E4 |
| C-03 | User Web shell loads `PlatformLayersWidgets` | 0 load | E4 |
| C-04 | Runtime `normalizePlan` forks Admin logic | Publish artifact only | E6 |
| C-05 | `L4RuntimeReader` installs `WidgetLibraryCatalog` | Direct reader API | E6 |
| C-06 | Permission reads PageSettingsStore for enabled filter | `PlacementWidgetIndexReader` GET | E2 |
| C-07 | L4 → `EntitlementCatalog.refreshBlocksCatalog()` | Event `iflux-widget-catalog-changed` | E3 |

---

## 2. Allowed references (by design)

| From | To | Mechanism | Contract |
|------|-----|-----------|----------|
| Permission Runtime | Plans artifact | `PlansRuntimeReader` | `plans[].blocks`, `plans[].pages` |
| Permission Runtime | L4 metadata | `L4RuntimeReader` | `widgetIds()`, `entitlementMeta()` |
| Layout Runtime | Page Published | GET `/api/pages/:key` | `placements[]`, `widgetRefs[]` |
| Admin Permission UI | Placement index | `PlacementWidgetIndexReader` | `listEnabledWidgetIds()` |
| Admin Permission | Widget registry | `widgetId` reference | ID only, not store import |
| L4 Admin | Permission Admin | DOM event | `iflux-widget-catalog-changed` |

**Rule:** reference qua **ID / GET artifact / event** — không import Store implementation chéo WGS.

---

## 3. Residual coupling (documented — not violations)

| Coupling | Status | Note |
|----------|--------|------|
| Admin `entitlement-catalog.js` normalize for **UI editing** | ✅ Allowed | Authoring tool · Runtime contract = published `plans[]` |
| `iflux-entitlements.js` tier fallback for `canAccessWidget` legacy meta | 🟡 Pre-existing | Not introduced E6 · OUT OF SCOPE auth.js |
| L4 stub meta before lazy fetch | ✅ Allowed | Read adapter placeholder until GET returns |

---

## 4. Circular dependency check

| Cycle | Status |
|-------|--------|
| L4 ↔ Permission refresh loop | **Broken** (E3 event) |
| Runtime ↔ Admin subscription stores | **Broken** (E4/E5) |
| Facade ↔ Entitlements ↔ normalize | **Broken** (E6) |

```bash
# No Runtime import of Admin subscription paths
rg "app/subscription/" User_Web/ --glob "*.js"
# → 0 active shell loads
```

---

## 5. Consumer migration (ABH-10)

| File | Was | Now |
|------|-----|-----|
| `iflux-entitlements.js` | `WidgetLibraryCatalog.widgetsForPage` | `L4RuntimeReader.widgetIdsForEntitlementDomain` |
| `iflux-block-gate.js` | facade `allWidgetIdsInLibrary` | `L4RuntimeReader.widgetIds` |
| `widget-registry.js` | `WIDGET_SPECS` | `L4RuntimeReader.entitlementMeta` |
| `dashboard-engine.js` | facade `resolveWidgetCopy` | `L4RuntimeReader.resolveWidgetCopy` |
| `widget-renderers.js` | facade | L4RuntimeReader |
| `market-liquidity.js` | facade | L4RuntimeReader |
| `community-market-overview.js` | facade | L4RuntimeReader |
| `market-heatmap.js` | facade | L4RuntimeReader |
| `community-trending.js` | facade | L4RuntimeReader |
| `flow-score-top.js` | facade | L4RuntimeReader |
