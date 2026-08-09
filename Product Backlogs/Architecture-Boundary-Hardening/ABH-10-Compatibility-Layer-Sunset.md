# ABH-10 — Compatibility Layer Sunset (No Compatibility Forever)

**Status:** **APPROVED — Owner 2026-07-27**  
**Governance:** CG-020 (dead code removal) · CG-021 · One Source of Truth

---

## 0. Vấn đề

Facade migration dễ thành **Permanent Architecture**:

```text
WidgetLibraryCatalog (Runtime facade)
  → tồn tại 2 năm
  → team mới nghĩ đó là Owner WGS
  → không ai dám xóa
```

**Cấm** compatibility layer không có **Target removal**.

---

## 1. Registry — Compatibility Layers (baseline E4)

| Layer | Owner thật | Status | Target removal | Replacement |
|-------|------------|--------|----------------|-------------|
| `window.WidgetLibraryCatalog` (Runtime) | `L4RuntimeReader` + `_meta` | **Compatibility Layer** | **E6** | Consumers gọi `L4RuntimeReader.*` trực tiếp |
| `WIDGET_SPECS` (object snapshot) | `_meta` | **Deprecated** | **E6** | `entitlementMeta()` / live getter — ABH-TD-E4-001 |
| `widgetsForPage()` on facade | entitlement domain | **Semantic debt** | **E6** | Rename → `widgetIdsForEntitlementDomain()` — ABH-TD-E4-003 |

**Không phải Permanent Architecture.** Mỗi row phải có Target removal.

---

## 2. Consumers cần migrate (E6)

| Consumer | Facade API dùng | Target |
|----------|-----------------|--------|
| `iflux-entitlements.js` | `widgetsForPage` | Reader rename API hoặc inline domain helper |
| `iflux-block-gate.js` | `allWidgetIdsInLibrary` | `L4RuntimeReader.widgetIds()` |
| `widget-registry.js` | `WIDGET_SPECS`, facade | `L4RuntimeReader.entitlementMeta` |
| `dashboard-engine.js` | `resolveWidgetCopy` fallback | Reader only |
| `widget-renderers.js` | `resolveWidgetCopy` | Reader only |
| `market-liquidity.js` | `resolveWidgetCopy` | Reader only |
| `community-market-overview.js` | `resolveWidgetCopy` | Reader only |
| `market-heatmap.js` | facade \|\| Reader | Reader only |

**E5:** không thêm consumer facade mới. Chỉ gỡ EntitlementCatalog.

---

## 3. Sunset checklist — E6 close FAIL nếu thiếu

- [ ] `installLibraryFacade()` **removed** hoặc no-op + `WidgetLibraryCatalog` undefined sau boot (nếu consumers migrated)
- [ ] Hoặc: facade còn **≤3** methods shim + doc “remove E7” — **Owner phải chốt**, không mặc định
- [ ] Evidence: grep `WidgetLibraryCatalog` User Web → 0 **hoặc** whitelist shim documented
- [ ] Exit doc ghi **Compatibility removed** — không “kept for safety”

---

## 4. Cấm trong E5/E6

- Thêm API facade “vì legacy consumer”
- Document facade as “Runtime Widget Library Owner”
- Snapshot cache mới trên facade

---

## 5. Template cho layer mới (bất kỳ phase nào)

Mọi compatibility shim mới **bắt buộc** header:

```text
Status:           Compatibility Layer
Introduced:       E<n>
Target removal:   E<m>   (bắt buộc — không để trống)
Replacement:      <Reader / consumer direct>
Consumers:        <list ≥2 or Owner exception ABH-11>
```

Thiếu Target removal → PR **FAIL**.

---

*ABH-10 — compatibility có hạn; không Forever.*
