# ABH E0 — Ownership Matrix

**Task:** Architecture Boundary Hardening  
**Phase:** E0 Baseline  
**Ngày:** 2026-07-27

---

## WGS Ownership (OP-01 Single Owner)

| WGS | Owner module | Concern | Canonical persistence |
|-----|--------------|---------|------------------------|
| **WGS-01 Template** | Template Library | `templateId`, schema, capability, renderer contract | `templates` store / DS SoT |
| **WGS-02 Widget Definition (L4)** | `platform-layers-widgets.js` | `widgetId`, `templateRef`, metadata, outputs | L4 store + publish → WidgetPublished |
| **WGS-03 Widget Placement** | Page Settings | page, section, span, order, position | Draft → Publish → **PagePublished** |
| **WGS-04 Widget Permission** | Entitlement | tier, block, visibility | Plans runtime + entitlement matrix |

**Runtime** = consumer only (OP-04). Không Owner bất kỳ WGS nào.

---

## Concern → Owner (no duplicate)

| Concern | Owner | Not Owner |
|---------|-------|-----------|
| Template pick | Template Library | L4, Placement, Permission |
| Widget metadata | L4 | Placement, Permission |
| Slot on page | Placement | Permission, Template impl |
| Tier / block gate | Permission | Placement, Runtime |
| Published layout | Publish Pipeline → PagePublished | Runtime (read only) |
| User dashboard override | User preference layer | Admin Placement SoT |

---

## Read Adapter layer (Gate 3)

Path: `shared/runtime-read/` — **not** a WGS Owner.

| Reader | Reads from | Used by |
|--------|------------|---------|
| `PlansRuntimeReader` | GET `/api/plans/runtime` | User Web Runtime, Auth labels |
| `L4RuntimeReader` | Published L4 / public read | User Web widget-registry |
| `WidgetRegistryReader` | Published / L4 projection | Admin Permission (via contract) |
| `PlacementWidgetIndexReader` | GET `/api/placement-widget-index` | Admin Permission matrix filter |

Readers: immutable, stateless, AB-07 compliant.

---

## Violations to fix (baseline)

| Violation | Wrong Owner acting | Fix phase |
|-----------|-------------------|-----------|
| Permission → PageSettingsStore | Permission reads Placement impl | E2 |
| L4 → EntitlementCatalog.refresh | L4 mutates Permission cache | E3 |
| Runtime → PlansStore.hydrate+localStorage | Runtime runs Admin sync | E4 |
| Runtime → PlatformLayersWidgets migrate | Runtime runs L4 Admin store | E4 |

Reference (allowed, keep): `widgetId`, `templateRef`, GET PagePublished.
