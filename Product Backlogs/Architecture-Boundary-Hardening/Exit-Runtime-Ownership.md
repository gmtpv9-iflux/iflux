# Exit — Runtime Ownership Matrix (ABH E6)

**Ngày:** 2026-07-27  
**SoT:** Product Architecture V2 — Runtime **consume**, không **interpret**

---

## 1. shell-boot.js — active globals (Production)

| Global | Owner | Load | Mutate | Source |
|--------|-------|------|--------|--------|
| `PlansRuntimeReader` | Permission (read adapter) | ✅ shell | ❌ | GET `/api/plans/runtime` |
| `L4RuntimeReader` | Widget L4 (read adapter) | ✅ shell | ❌ | Lazy GET `/api/widgets/:id` |
| `IfluxEntitlements` | Permission Engine | ✅ shell | ❌ | Reads `PlansRuntimeReader` + L4 index |
| `IfluxBlockGate` | Permission Engine | ✅ shell | ❌ | `IfluxEntitlements.hasBlock` |
| `IfluxGuestShell` | App Shell | ✅ shell | ❌ | Menu chrome |
| ~~`IfluxPlanNormalize`~~ | — | ❌ **removed E6** | — | — |
| ~~`EntitlementCatalog`~~ | — | ❌ **removed E5** | — | — |
| ~~`PlansStore`~~ | — | ❌ **removed E4** | — | — |
| ~~`PlatformLayersWidgets`~~ | — | ❌ **removed E4** | — | — |
| ~~`WidgetLibraryCatalog`~~ | — | ❌ **removed E6** | — | — |

**Cache buster Production:** `abhE620260727`

---

## 2. Runtime module responsibilities

| Module | Allowed | Forbidden |
|--------|---------|-----------|
| `plans-runtime-reader.js` | GET, memory cache, `getPlan()` from `plans[]` | normalize, localStorage, PATCH |
| `l4-runtime-reader.js` | Lazy widget fetch, `entitlementMeta`, `widgetIdsForEntitlementDomain` | facade, `WIDGET_SPECS`, save/publish |
| `iflux-entitlements.js` | `hasBlock` = read `plan.blocks[id]`, `canAccessPage` | `normalizePlan`, tier rule invention |
| `iflux-block-gate.js` | Apply lock UI from `hasBlock` | Permission matrix edit |

---

## 3. DevTools ownership probe (`/home` cold load)

Paste in Console sau hard refresh:

```javascript
({
  PlansRuntimeReader: typeof PlansRuntimeReader,
  L4RuntimeReader: typeof L4RuntimeReader,
  IfluxEntitlements: typeof IfluxEntitlements,
  IfluxPlanNormalize: typeof window.IfluxPlanNormalize,      // expect "undefined"
  EntitlementCatalog: typeof window.EntitlementCatalog,        // expect "undefined"
  WidgetLibraryCatalog: typeof window.WidgetLibraryCatalog,  // expect "undefined"
})
```

**Pass:** 3 defined · 3 undefined.

---

## 4. Network — files must NOT load

Filter Network → JS:

| Pattern | Expected count |
|---------|----------------|
| `entitlement-catalog.js` | **0** |
| `plan-normalize-runtime.js` | **0** |
| `plans-store.js` | **0** |
| `platform-layers-widgets.js` | **0** |

**Must load:**

| File | Purpose |
|------|---------|
| `plans-runtime-reader.js?v=abhE620260727` | Plans artifact reader |
| `l4-runtime-reader.js?v=abhE620260727` | L4 lazy reader |
| `iflux-entitlements.js?v=abhE620260727` | Permission gate |

---

## 5. API calls (Runtime boot)

| Request | When | Owner |
|---------|------|-------|
| `GET /api/plans/runtime` | shell-boot `PlansRuntimeReader.load()` | Published artifact |
| `GET /api/widgets/WGT-*` | lazy on widget title/copy need | Widget artifact |

**Không** gọi Admin paths `Admin_Design_system/app/subscription/`.
