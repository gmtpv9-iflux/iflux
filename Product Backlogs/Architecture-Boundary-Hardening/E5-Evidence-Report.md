# ABH E5 — Evidence Report

**Ngày:** 2026-07-27  
**Trạng thái:** **PASS WITH ARCHITECTURAL CONDITION** (Owner 2026-07-27)  
**Condition:** [`ABH-TD-E5-001`](ABH-TD-E5-001-Single-Rule-Provenance.md) — must close before ABH track complete  
**Deploy:** Production + Cloudflare purge

---

## 1. Eliminate — Admin subscription off shell

### E5-A1 shell-boot active load

```bash
rg "entitlement-catalog|EntitlementCatalog" User_Web/iflux-web-ui/runtime/shell-boot.js
```

| Line | Active? |
|------|---------|
| 180–181 | Comment block only ❌ |

**Active `ensureParallel` EntitlementCatalog:** **0**

### E5-A2 Admin subscription path

```bash
rg "app/subscription/" User_Web/
# → shell-boot.js comment only
```

### E5-A3 Active EntitlementCatalog calls

```bash
rg "EntitlementCatalog\.|window\.EntitlementCatalog|global\.EntitlementCatalog" User_Web/ --glob "*.{js,html}"
# → 0 active
```

### Production shell-boot (post-purge)

```bash
curl -sS "https://iflux.vn/.../shell-boot.js?v=abhE520260727" | rg "IfluxPlanNormalize|EntitlementCatalog"
```

- `IfluxPlanNormalize` → **active load** ✅
- `EntitlementCatalog` → **comment only** ✅

---

## 2. Introduce — Runtime entitlement stack

| Module | LOC | Role |
|--------|-----|------|
| `plan-normalize-runtime.js` | 411 | Pure normalize · resolveBlockEnabled · PAGES · no store |
| `iflux-entitlements.js` | modified | Uses `IfluxPlanNormalize` only |
| `plans-runtime-reader.js` | modified | `IfluxPlanNormalize.normalizePlan` |
| `iflux-plans-catalog.js` | modified | same |
| `iflux-block-gate.js` | modified | `IfluxPlanNormalize.isPermissionScopedWidget` |

### ABH-09 forbidden grep

```bash
rg "\.(save|publish|hydrate|sync|refresh|notify)\(" User_Web/iflux-web-ui/readers/
# → 0

rg "localStorage|sessionStorage|dispatchEvent" User_Web/iflux-web-ui/plan-normalize-runtime.js
# → 0
```

### Reader/Facade whitelist

**Unchanged** — no new public API on PlansRuntimeReader / L4RuntimeReader / facade.

---

## 3. Consumer migration

| Consumer | Before | After |
|----------|--------|-------|
| `shell-boot.js` | load `entitlement-catalog.js` (~790 LOC) | **removed** · load `plan-normalize-runtime.js` |
| `iflux-entitlements.js` | `EntitlementCatalog.*` | `IfluxPlanNormalize.*` |
| `iflux-block-gate.js` | `EntitlementCatalog.isPermissionScopedWidget` | `IfluxPlanNormalize` → L4 fallback |
| `iflux-plans-catalog.js` | `EntitlementCatalog.normalizePlan` | `IfluxPlanNormalize.normalizePlan` |
| `plans-runtime-reader.js` | delegate Admin normalize | `IfluxPlanNormalize.normalizePlan` |

---

## 4. ABH-11 Complexity (E5)

| Metric | E4 After | E5 After |
|--------|----------|----------|
| Admin `app/subscription/*.js` on shell | 1 (EntitlementCatalog) | **0** |
| Admin `platform-layers-widgets.js` on shell | 0 | 0 |
| Runtime globals (entitlement path) | EntitlementCatalog + readers | **IfluxPlanNormalize** + readers |
| Shell added (normalize) | — | +411 LOC User Web (replaces -790 Admin load) |
| **Net shell entitlement path** | ~790 Admin off + 369 readers | **+411 pure User Web** ≈ **−379 LOC vs E4 shell** |

### Network (expected cold `/home`)

| URL | E4 | E5 |
|-----|----|----|
| `entitlement-catalog.js` | 1 | **0** |
| `plan-normalize-runtime.js` | 0 | **1** |
| `plans-runtime-reader.js` | 1 | 1 |
| `l4-runtime-reader.js` | 1 | 1 |

---

## 5. Dual Path Audit

| Flow | Status |
|------|--------|
| Old: shell → Admin `entitlement-catalog.js` | **Removed** |
| Old: consumers → `EntitlementCatalog.*` | **Removed** (grep 0) |
| New: shell → `IfluxPlanNormalize` + readers | **Active** |
| New: `PlansRuntimeReader` → GET → memory | **Active** (unchanged E4) |

---

## 6. Runtime verification (Owner reproduce)

DevTools after hard refresh `https://iflux.vn/home`:

```javascript
typeof window.EntitlementCatalog        // "undefined"
typeof window.IfluxPlanNormalize        // "object"
typeof window.PlansRuntimeReader        // "object"
IfluxEntitlements.visibleMenus().length // > 0 guest
```

Network filter: `entitlement-catalog` → **0 requests**

---

## 7. E5 Verdict (Owner 2026-07-27)

| Check | Result |
|-------|--------|
| Boundary / Admin removal / dependency | ✅ PASS |
| ABH-09 / ABH-10 not expanded | ✅ PASS |
| **Architecture ownership (ONE Rule Provenance + traceability)** | ⏳ **ABH-TD-E5-001** + **ABH-12** |

**E5 = PASS WITH ARCHITECTURAL CONDITION**

- Boundary E5 **đạt** — không FAIL · không revert.
- **Architecture Incomplete** — Runtime fork interpreter (dual logic), not “small debt”.
- ABH track **không complete** until ABH-TD-E5-001 + ABH-12 closed in E6.

Docs: [`E5-Semantic-Ownership-Audit.md`](E5-Semantic-Ownership-Audit.md) · [`E5-ECG-Compliance-Audit.md`](E5-ECG-Compliance-Audit.md) · [`ABH-TD-E5-001`](ABH-TD-E5-001-Single-Rule-Provenance.md) · [`ABH-12`](ABH-12-Rule-Provenance-Gate.md)
