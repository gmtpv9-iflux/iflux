# ABH E3 — Deploy Verification

**Date:** 2026-07-27  
**Phase:** Event-driven L4 ↔ Permission decouple — **CLOSED**

---

## Changes

| File | Change |
|------|--------|
| `platform-layers-widgets.js` | `notifyPropagate(opts)` → `iflux-widget-catalog-changed` with frozen payload (`action`, `widgetIds`, `at`); legacy comment removed |
| `platform-layers.html` | Removed `entitlement-catalog.js` |
| `platform-layers-catalog.js` | `buildDisplayBlocks()` from L4 native (no EntitlementCatalog) |
| `platform-layers-page.js` | `blockLabel()` via `PlatformLayersWidgets.resolveWidgetCopy` |
| `entitlements.html` | Subscribe event → refresh matrix; fix L4 script path `../system/platform-layers-widgets.js` |
| `entitlement-matrix-ui.js` | Filter "Tất cả" — **WidgetRegistryReader only** (no L4 direct fallback) |
| `plan-edit.html` | Subscribe event → refresh blocks catalog |

---

## E3 cleanup (ABH-08 / CG-021)

| Check | Result |
|-------|--------|
| Legacy `notifyPropagate` comment block | **Removed** ✅ |
| `entitlement-matrix-ui.js` dual path (Reader + L4 direct) | **Removed** ✅ |
| Event payload `Object.freeze` + `action` save/delete/bulk | **Done** ✅ |
| `widgetIds` on save/delete | **Done** ✅ |
| `entitlements.html` L4 script path | **Fixed** ✅ |

---

## Dependency check (post E3 close)

| Edge | Expected | Result |
|------|----------|--------|
| L4 → `EntitlementCatalog.refresh()` active | 0 | ✅ |
| L4 page → load `entitlement-catalog.js` | Removed | ✅ |
| Permission matrix → L4 direct (dual path) | 0 | ✅ |
| Event dispatch | 1 (`platform-layers-widgets.js`) | ✅ |
| Event subscribe (Admin) | 2 (`entitlements.html`, `plan-edit.html`) | ✅ |

---

## Manual verify

1. Open **Kiến trúc 4 tầng** — display tab loads (no console error missing EntitlementCatalog)
2. Save/edit widget L4 — **entitlements** page open in other tab → matrix widget list updates after event
3. Filter "Tất cả" / "Chỉ Widget đang Bật" — row counts match baseline (19 enabled)

---

## Next: E4 Runtime adapters

- `PlansRuntimeReader` / `L4RuntimeReader`
- Swap `User_Web/iflux-web-ui/runtime/shell-boot.js` — remove Admin Store load
