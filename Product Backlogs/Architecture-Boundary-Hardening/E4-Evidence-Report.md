# ABH E4 — Evidence Report (Replacement vs Additive)

**Ngày:** 2026-07-27  
**Trạng thái:** **PARTIAL PASS** — Plans/L4 path replaced ✅ · EntitlementCatalog Admin vẫn boot (E5) ⚠️ · 404 bulk-fetch đã fix lazy ⚠️→✅

---

## 1. Import / Reference Evidence (`User_Web/`)

### 1.1 `PlansStore`

```bash
rg -n "PlansStore" User_Web/ --glob "*.{js,html}"
```

| File | Loại | Active? |
|------|------|---------|
| `readers/plans-runtime-reader.js:3` | Comment | ❌ |
| `runtime/shell-boot.js:168` | Comment ABH E4 | ❌ |
| `runtime/shell-boot.js:182` | **Comment block legacy** (inside `/* … */`) | ❌ |
| `iflux-guest-shell.js:105` | Comment | ❌ |

**Active runtime call:** `rg "PlansStore\.|window\.PlansStore|global\.PlansStore" User_Web/` → **0**

### 1.2 `PlatformLayersWidgets`

```bash
rg -n "PlatformLayersWidgets" User_Web/ --glob "*.{js,html}"
```

| File | Loại | Active? |
|------|------|---------|
| `readers/l4-runtime-reader.js:3` | Comment | ❌ |
| `runtime/shell-boot.js:168` | Comment | ❌ |
| `runtime/shell-boot.js:181` | **Comment block legacy** | ❌ |

**Active runtime call:** `rg "PlatformLayersWidgets\.|window\.PlatformLayersWidgets|global\.PlatformLayersWidgets" User_Web/` → **0**

### 1.3 `shell-boot` active script loads

| Module | Active `ensureParallel` load? |
|--------|------------------------------|
| `PlansStore` | **0** — chỉ trong comment block đã comment |
| `PlatformLayersWidgets` | **0** — chỉ trong comment block đã comment |
| `EntitlementCatalog` | **1** — `{ global: 'EntitlementCatalog', src: ADMIN + 'app/subscription/entitlement-catalog.js' }` (E5 scope) |

### 1.4 `WidgetLibraryCatalog`

**Không import file Admin.** Runtime facade do `L4RuntimeReader.installLibraryFacade()` gán `window.WidgetLibraryCatalog`.

Active references (đọc global, không import Admin):

| File | Usage |
|------|-------|
| `widget-registry.js` | `WidgetLibraryCatalog \|\| L4RuntimeReader` |
| `market-heatmap.js` |同上 |
| `dashboard-engine.js` | `resolveWidgetCopy` |
| `flow-score-top.js` | `WidgetLibraryCatalog` |
| `community-trending.js` | `L4RuntimeReader \|\| WidgetLibraryCatalog` |
| `iflux-entitlements.js` | `widgetsForPage` fallback |
| `iflux-block-gate.js` | `allWidgetIdsInLibrary` fallback |
| + 4 file khác | resolveWidgetCopy |

**Admin WidgetLibraryCatalog module:** **0 imports**

### 1.5 `EntitlementCatalog`

**19 active references** — vẫn boot Admin module trên shell (790 LOC). **E4 chưa PASS full** theo gate “0 Admin entitlement on shell”. Thuộc **E5**.

---

## 2. Reader Audit (AB-07)

### 2.1 `PlansRuntimeReader` — public API (frozen)

```javascript
PlansRuntimeReader.load(opts?)   // GET /api/plans/runtime → _cache
PlansRuntimeReader.isReady()
PlansRuntimeReader.getPlan(tier)
PlansRuntimeReader.listTiers()
PlansRuntimeReader.listPlans()
PlansRuntimeReader.formatVnd(n)
```

**Không có:** save, publish, hydrate, sync, refresh, notify, mergeRuntime, loadStore.

**Internal:** `mergePlan(base, override)` — pure in-memory merge tier object khi `getPlan()` (không ghi storage, không gọi API write).

### 2.2 `L4RuntimeReader` — public API (frozen)

```javascript
L4RuntimeReader.load(opts?)      // index widgetIds từ plans — KHÔNG bulk HTTP
L4RuntimeReader.isReady()
L4RuntimeReader.widgetIds()
L4RuntimeReader.entitlementMeta(id)
L4RuntimeReader.resolveWidgetCopy(id)
L4RuntimeReader.fetchWidget(id)  // lazy GET single widget
L4RuntimeReader.entitlementList()
L4RuntimeReader.installLibraryFacade()
```

### 2.3 Forbidden pattern grep (readers only)

```bash
rg -n "hydrate\(|publishRuntime|publish\(|\.save\(|saveMatrix|saveStore|sync\(|localStorage|sessionStorage|dispatchEvent|STORAGE_KEY|MIRROR_KEY" \
  User_Web/iflux-web-ui/readers/
```

| Match | Verdict |
|-------|---------|
| `plans-runtime-reader.js:3` comment "No localStorage" | ✅ comment only |
| `status: 'published'` in BASE plan metadata | ✅ false positive (field name) |

**Functional forbidden calls:** **0**

---

## 3. Runtime Path

### Before (E3)

```text
shell-boot.js
  ├─ loadScript PlatformLayersWidgets.js   (~2299 LOC, localStorage L4)
  ├─ loadScript PlansStore.js              (~754 LOC)
  ├─ loadScript EntitlementCatalog.js      (~790 LOC)
  └─ PlansStore.hydrate()
        ├─ GET /api/plans/runtime
        ├─ mergeStoreData + localStorage write
        └─ publishRuntime (PUT admin)
```

### After (E4)

```text
shell-boot.js
  ├─ loadScript plans-runtime-reader.js    (163 LOC)
  ├─ loadScript l4-runtime-reader.js       (~195 LOC, lazy fetch)
  ├─ loadScript EntitlementCatalog.js      (~790 LOC) ← E5 removes
  └─ await PlansRuntimeReader.load()
        └─ GET /api/plans/runtime → memory _cache
      await L4RuntimeReader.load()
        └─ index WGT-* from plans blocks → stub meta (no bulk HTTP)
```

**Old path reachable?**

| Path | Reachable? |
|------|------------|
| `PlansStore.hydrate()` | **No** — module not loaded |
| `PlansStore.loadStore()` | **No** |
| `PlatformLayersWidgets.readStore()` | **No** — module not loaded |
| `window.PlansStore` | **undefined** on User Web shell |
| `window.PlatformLayersWidgets` | **undefined** on User Web shell |

---

## 4. Console 404 (E4 defect — fixed)

**Root cause:** `L4RuntimeReader.load()` bulk-fetched **mọi** `WGT-*` trong plans runtime blocks; nhiều widget có trong matrix nhưng **chưa WidgetPublished** → `GET /api/widgets/:id` 404 → browser log console.

**Fix:** `load()` chỉ index + stub metadata; HTTP **lazy** qua `fetchWidget(id)` khi `resolveWidgetCopy` cần title thật; `_missing` cache tránh lặp 404.

**In scope E4:** ✅ — do L4RuntimeReader boot behavior.

---

## 5. Consumer Migration

| Consumer | Before | After | Evidence |
|----------|--------|-------|----------|
| `shell-boot.js` | `PlansStore.hydrate()` | `PlansRuntimeReader.load()` + `L4RuntimeReader.load()` | line ~221 |
| `iflux-entitlements.js` | `PlansStore.getPlan` | `PlansRuntimeReader.getPlan` | grep |
| `auth.js` | `PlansStore.getPlan` | `PlansRuntimeReader.getPlan` | grep |
| `iflux-guest-shell.js` | `PlansStore.hydrate` | `PlansRuntimeReader.load` | grep |
| `checkout-feature-boot.js` | `PlansStore.hydrate` | `PlansRuntimeReader.load` | grep |
| `iflux-plans-catalog.js` | `PlansStore` store() | `PlansRuntimeReader` store() | grep |
| `subscription-orders-store.js` | `PlansStore.getPlan` | `PlansRuntimeReader.getPlan` | grep |
| `pricing-page.js` | `window.PlansStore` | `window.PlansRuntimeReader` | grep |
| `iflux-block-gate.js` | `PlatformLayersWidgets.widgetIds` | `L4RuntimeReader.widgetIds` | grep |
| `widget-registry.js` | `PlatformLayersWidgets` | `L4RuntimeReader` / `WidgetLibraryCatalog` | grep |
| `dashboard-engine.js` | `PlatformLayersWidgets.resolveWidgetCopy` | `L4RuntimeReader.resolveWidgetCopy` | grep |
| `community-trending.js` | `PlatformLayersWidgets` | `L4RuntimeReader` | grep |
| `market-heatmap.js` | `PlatformLayersWidgets` | `L4RuntimeReader` | grep |

**Consumers vẫn dùng EntitlementCatalog (E5):** `iflux-entitlements.js`, `iflux-block-gate.js`, `iflux-plans-catalog.js`, `plans-runtime-reader.js` (normalizePlan delegate).

---

## 6. Refactor Balance (LOC)

| Module | LOC | Shell boot E4 |
|--------|-----|---------------|
| `plans-store.js` (Admin) | 754 | **Removed** |
| `platform-layers-widgets.js` (Admin) | 2299 | **Removed** |
| `entitlement-catalog.js` (Admin) | 790 | Still loaded |
| `plans-runtime-reader.js` | 163 | **Added** |
| `l4-runtime-reader.js` | ~195 | **Added** |

| Metric | Value |
|--------|-------|
| **Removed from shell path** | ~3053 LOC (PlansStore + PLW) |
| **Added readers** | ~358 LOC |
| **Net shell JS** | **−2695 LOC** (excluding EntitlementCatalog) |
| **Removed runtime paths** | hydrate, localStorage plans/L4, publishRuntime on User Web |
| **Added runtime paths** | GET plans/runtime (memory), lazy GET widgets/:id |

**Not a God Reader:** PlansRuntimeReader 6 public methods; L4RuntimeReader 8 public methods — no save/publish/hydrate.

---

## 7. E4 Verdict

| Gate | Result |
|------|--------|
| PlansStore / PlatformLayersWidgets replaced on User Web | ✅ PASS |
| shell-boot không load PlansStore / PLW (active) | ✅ PASS |
| AB-07 readers (no storage/write) | ✅ PASS |
| No console 404 spam on /home boot | ✅ PASS (after lazy fix) |
| EntitlementCatalog removed from shell | ❌ **E5 pending** |
| Full E4 plan acceptance (0 Admin subscription on shell) | ❌ **PARTIAL** |

**Kết luận:** E4 **đã thay thế** Plans + L4 Admin path (replacement, không additive dual path). **Chưa đóng E4 plan đủ** vì EntitlementCatalog Admin vẫn boot — đúng scope **E5**.

---

*Evidence generated from repo grep + wc -l 2026-07-27.*
