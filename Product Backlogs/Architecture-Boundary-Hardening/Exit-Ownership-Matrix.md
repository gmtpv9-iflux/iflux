# Exit — Ownership Matrix (ABH E6)

**Ngày:** 2026-07-27  
**Deliverable #1 / §8**

---

## 1. WGS ownership (Runtime vs Admin)

| WGS | Owner | Runtime role | Admin role |
|-----|-------|--------------|------------|
| **Template** | Design System / Product | Consume `templateRef` | Author templates |
| **Widget Definition (L4)** | Product L4 | `L4RuntimeReader` lazy GET | Create/edit/publish widgets |
| **Placement** | Page Composition | Layout Engine reads Page Published | Page Settings UI |
| **Permission** | Admin Policy + Publish | **Consume** `plans[]` artifact | Matrix edit + PUT publish |
| **Publish** | Backend pipeline | — | `plan-normalize-publish.js` builds artifact |
| **Runtime** | App Shell | Boot readers + entitlements | — |

---

## 2. Removed ownership violations (E4–E6)

| Was (wrong) | Now |
|-------------|-----|
| Runtime owns `normalizePlan` | **Publish** owns · Runtime reads `plans[]` |
| Runtime loads `EntitlementCatalog` | **0** Admin subscription on shell |
| `WidgetLibraryCatalog` as Runtime owner | **Removed** · `L4RuntimeReader` direct |
| `PlansStore` on User Web | **Removed** E4 |
| `PlatformLayersWidgets` on User Web | **Removed** E4 |

---

## 3. Artifact ownership chain

```text
Admin Permission Matrix (Policy Owner)
        │
        ▼ PUT /api/plans/runtime
plan-normalize-publish.js (Publish Owner)
        │
        ▼
plans-runtime.json { plans[] } (Runtime Contract)
        │
        ▼ GET
PlansRuntimeReader → IfluxEntitlements (Consume only)
```

Trace detail: [`E6-Rule-Provenance-Report.md`](E6-Rule-Provenance-Report.md)

---

## 4. Related exit docs

| # | Deliverable | File |
|---|-------------|------|
| 1 | Ownership Matrix | **This file** |
| 2 | Dependency Graph | [`Exit-Dependency-Graph.md`](Exit-Dependency-Graph.md) |
| 3 | Runtime Ownership | [`Exit-Runtime-Ownership.md`](Exit-Runtime-Ownership.md) |
| 4 | Shared Read Models | [`Exit-Shared-Read-Models.md`](Exit-Shared-Read-Models.md) |
| 5 | Cross-WGS Coupling | [`Exit-Coupling-Report.md`](Exit-Coupling-Report.md) |
| 6 | Regression | [`Exit-Regression-Report.md`](Exit-Regression-Report.md) |
| 7 | Security Regression | [`Exit-Security-Regression.md`](Exit-Security-Regression.md) |
