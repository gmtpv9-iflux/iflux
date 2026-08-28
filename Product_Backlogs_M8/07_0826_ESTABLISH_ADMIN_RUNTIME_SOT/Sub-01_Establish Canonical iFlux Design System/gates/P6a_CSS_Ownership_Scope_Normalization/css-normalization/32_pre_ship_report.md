# PRE-SHIP report — Design System ↔ Pattern Separation

**Date:** 2026-08-28  
**Scope:** Phases 1–9 local. **Chưa FINAL lock.**  
**SoT:** [`docs/SoT — Canonical UI Architecture (Design System ↔ Pattern).md`](../../../../../../../docs/SoT%20—%20Canonical%20UI%20Architecture%20(Design%20System%20↔%20Pattern).md)  
**Plan:** [`31_ds_pattern_separation_plan.md`](31_ds_pattern_separation_plan.md)

```
ARCHITECTURE_READY_FOR_CHAT_REBUILD = NO
```

---

## A. Inventory trước

Xem plan §2. Pattern nằm `design_system/references/patterns/`. Global Pattern = page-header + data-list. Chưa có `patterns/` root, `widgets/`, `manifests/`.

## B. Target tree thực tế

```
design_system/README.md
design_system/widgets/README.md
design_system/components/page-header/
design_system/components/data-list/
design_system/sandbox/  (7 section; không patterns/references)
patterns/README.md
patterns/{auth,charts,chat,form-add,order-detail,order-list,referrals,table-list,user-profile,wizard}/
```

Không có: `design_system/manifests/`, `patterns/widgets/`, `design_system/patterns/`, `design_system/references/`.

`_up_base_*`: không còn trên disk lúc `git mv` (bad source). Không invent lại.

## C. Mapping

| Cũ | Mới |
|---|---|
| `design_system/patterns/page-header/` | `design_system/components/page-header/` |
| `design_system/patterns/data-list/` | `design_system/components/data-list/` |
| `design_system/references/patterns/<id>/` | `patterns/<id>/` |

Href Pattern: `../../../…` → `../../design_system/…` (+ page-header/data-list → `components/`).

## D / E / F

`page-header` → Component. `data-list` → Component. Global Pattern layer xóa sau `LIVE_CONSUMER = 0`.

## G. reference-layers.css

Frozen: LEGACY COMPATIBILITY DEBT / NO NEW RULE. Body rule không đụng. Register giữ plan §6.

## H. Workbench

Canonical: `?area=design-system&section=` / `?area=patterns&pattern=`  
Alias: `?module=sandbox|patterns`  
Iframe: `/patterns/<id>/…`

## I. Sandbox

Tokens, Foundation, Primitives, Components (+ page-header, data-list), Widgets, Visual, Contract.  
`patterns.html` / `references.html` đã xóa sau scan.

## J / K

`design_system/README.md`, `patterns/README.md` — Owner soạn, chuyển từ `iflux_ui_architecture_readmes/`.  
`design_system/widgets/README.md` — scope only.

## L / M

Live HTML/JS/CSS: 0 hit `design_system/references/patterns/` và `design_system/patterns/`.  
Nginx 301 old URL = redirect, không phải consumer source.  
Docs archive stamped `moved 2026-08-28`.  
`sandbox/patterns/**` leftover P6: giữ debt (không xóa).

`ORPHAN_PATTERN_PATHS` (live code) = **0**

## N. User Profile

Diff chỉ path `../../../` → `../../design_system/`. Local href 200. `USER_PROFILE_REGRESSION_LOCAL` = PASS (path-only). Staging chưa chấm.

## O. Pattern routes local

Mọi catalog HTML + 330 asset href = 200 trên `127.0.0.1:8901`. `sections/patterns.html` = 404 (đã xóa).

## P. File (architecture)

Tạo README ×3, `widgets.html`, `patterns/*` (mv).  
Sửa workbench, sandbox, CI, nginx, docs path.  
Xóa `design_system/patterns/`, `design_system/references/`, `sections/patterns.html`, `sections/references.html`.

---

## PRE_SHIP_GATES

| Gate | |
|---|---|
| `DESIGN_SYSTEM_PATTERN_SEPARATION` | PASS |
| `DESIGN_SYSTEM_README` | PASS |
| `PATTERN_README` | PASS |
| `GLOBAL_PATTERN_LAYER_REMOVED_OR_CLASSIFIED` | PASS |
| `WORKBENCH_ROUTING_LOCAL` | PASS |
| `SANDBOX_SCOPE_NORMALIZED` | PASS |
| `REFERENCE_LAYERS_FROZEN` | PASS |
| `USER_PROFILE_REGRESSION_LOCAL` | PASS |
| `ORPHAN_PATTERN_PATHS` | 0 |
| `CLEANUP_LIVE_CONSUMER` | PASS |
| **PRE_SHIP** | **PASS** |

POST-DEPLOY: chưa. Chat rebuild: **NO**.
