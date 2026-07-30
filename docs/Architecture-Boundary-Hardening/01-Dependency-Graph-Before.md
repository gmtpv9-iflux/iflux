# ABH E0 — Dependency Graph (Before)

**Phase:** E0 Baseline  
**Ngày:** 2026-07-27

---

## Allowed reference flow (SoT — unchanged)

```mermaid
flowchart TB
  T[Template]
  L4[Widget Definition L4]
  PL[Placement Page Settings]
  PM[Permission Entitlement]
  PUB[Publish Pipeline]
  PA[Published Artifact]
  RT[User Web Runtime]

  T --> L4
  L4 --> PL
  L4 --> PM
  PL --> PUB
  PM --> PUB
  PUB --> PA
  PA --> RT
```

---

## Implementation coupling (Before — to remove)

```mermaid
flowchart LR
  subgraph VIOLATION
    PM2[entitlement-catalog.js]
    PSS[PageSettingsStore/Catalog]
    L4W[platform-layers-widgets.js]
    EC[EntitlementCatalog]
    PS[PlansStore Admin]
    SB[shell-boot.js]
  end

  PM2 -->|DD-01..04 import| PSS
  L4W -->|DD-05 notifyPropagate| EC
  EC -->|circular| L4W
  SB -->|RO-06| PS
  SB -->|RO-08| L4W
  SB --> EC
```

---

## Clean boundaries (Before — keep)

| Edge | Verdict |
|------|---------|
| Placement → Template impl | ✅ 0 imports |
| Template → Placement | ✅ 0 imports |
| Placement → L4 widgetId | ✅ `page-settings-catalog.js` |
| L4 → Template templateRef | ✅ optional TemplatesCatalog |
| Permission → L4 widget list | ✅ reference (refactor to Reader in E1/E3) |

---

## Target: PlacementWidgetIndex (Gate 2)

```mermaid
flowchart TB
  PS[Page Settings Owner]
  PUB[Publish Pipeline]
  PA[(Published Artifact DB)]
  IDX[Placement Index Builder]
  API[GET /api/placement-widget-index]
  READER[PlacementWidgetIndexReader]
  PM[Permission Admin UI]

  PS --> PUB --> PA --> IDX --> API --> READER --> PM
```

Permission **does not** import PageSettingsStore.

---

## Evidence commands

```bash
rg "PageSettingsCatalog|PageSettingsStore" Admin_Design_system/app/subscription/
rg "EntitlementCatalog" Admin_Design_system/app/system/platform-layers-widgets.js
rg "PlansStore|PlatformLayersWidgets|EntitlementCatalog" User_Web/iflux-web-ui/runtime/shell-boot.js
```
