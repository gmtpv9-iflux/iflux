# ABH E5 — Semantic · Ownership · E6 Sunset Audit

**Ngày:** 2026-07-27  
**Audience:** Owner / Reviewer (bổ sung sau E5-Evidence-Report)  
**Trạng thái E5:** **CONDITIONAL PASS** — Boundary ✅ · Duplication ⚠️ · E6 sunset plan ✅

---

## Tóm tắt thẳng (Reviewer đúng)

| Hạng mục | Verdict | Ghi chú |
|----------|---------|---------|
| Boundary (Admin off shell) | ✅ PASS | grep + Production shell-boot |
| Dependency direction | ✅ PASS | 0 Placement/PageSettings/PlatformLayers trong runtime normalize |
| Runtime purity (no I/O) | ✅ PASS | grep §3 |
| Logic duplication | ⚠️ **DEBT** | ~24 function semantic fork — không phải rename module |
| SoT ownership | ⚠️ **DUAL defaults** | Matrix = API ✅ · Default rules = Admin + Runtime ⚠️ |
| E6 facade sunset | ✅ **PLANABLE** | 11 files / 14 call-sites — bảng §5 |

**E5 không FAIL boundary.**  
**E5 chưa đủ để ký PASS kiến trúc “sạch”** nếu yêu cầu zero duplication — cần **ABH-TD-E5-001** (shared extract) trong E6.

---

## 1. Semantic diff — EntitlementCatalog vs IfluxPlanNormalize

### 1.1 Phạm vi file

| | Admin `entitlement-catalog.js` | Runtime `plan-normalize-runtime.js` |
|---|-------------------------------|-------------------------------------|
| LOC | 790 | 411 |
| Export public | ~30 keys (matrix UI, refresh, tree…) | **6** keys |
| Role | Admin Permission WGS + matrix UI | User Web projection only |

### 1.2 Function inventory (tên)

```bash
# Shared function names (logic cùng tên)
applyPageBlockDefaults, blocksForPage, buildBlocksCatalog,
defaultActionsForTier, defaultBlocksForTier, defaultCapabilitiesForTier,
defaultLimitsForTier, defaultPagesForTier, getWidgetTitle,
isPermissionScopedWidget, isStaticPageBlock, isWidgetEntitlementId,
legacyEntToFeatures, migratePlanWidgetAliases, normalizePlan,
resolveBlockEnabled, syncLegacyEntFromActions, syncPageBlocksFromWidgets,
tierRank, widgetMinTier, widgetPageKey, wl
# → 22 function (không tính nested set/op)
```

| Loại | Số lượng | Ví dụ |
|------|----------|-------|
| **Giữ nguyên semantic** (runtime subset) | **22** | `normalizePlan`, `resolveBlockEnabled`, `defaultLimitsForTier` |
| **Bỏ** (Admin-only) | **18** | `buildAccessTree`, `setAccessValue`, `refreshBlocksCatalog`, `coverageSummary`, `buildL4Adapter`, `l4()` |
| **Mới** (runtime-only) | **1** | `getBlocks()` wrapper |
| **Đơn giản hóa** | 3 | `wl()` — không `PlatformLayersWidgets`; `defaultActionsForTier` — keys inline vs `ACTIONS[]`; `isPermissionScopedWidget` — không Admin L4 store |

### 1.3 Ước lượng copy (thành thật)

| Metric | Giá trị |
|--------|---------|
| LOC runtime module | 411 |
| LOC “core normalize path” (ước lượng) | ~300–320 |
| Semantic giống Admin subset | **~85–90%** |
| LOC copy kiểu `380/411` | **Không chính xác** — đúng hơn: **~270–300 LOC logic fork** + ~90 LOC data/constants |
| Admin-only code trong file cũ | ~470 LOC **không** copy |

**Kết luận §1:** Reviewer **đúng lo ngại duplication**. Đây **không** chỉ đổi tên module — là **fork có chủ đích** của runtime-facing subset. **Không PASS kiến trúc lý tưởng** (single SoT cho rules). **PASS boundary** (tách Admin load).

### 1.4 Semantic diff `normalizePlan()` — từng bước

| Bước | Admin | Runtime | Khác? |
|------|-------|---------|-------|
| clone plan | `JSON.parse(JSON.stringify)` | same | ❌ |
| merge `pages` defaults | `defaultPagesForTier` | same logic | ❌ |
| guest dashboard false | yes | yes | ❌ |
| merge `ent` / legacy | yes | yes | ❌ |
| merge `blocks` defaults | `defaultBlocksForTier` | same (dynamic BLOCKS) | ⚠️ nguồn BLOCKS khác |
| alias migrate | yes | yes | ❌ |
| actions / limits | yes | yes | ❌ |
| applyPageBlockDefaults | yes | yes | ❌ |
| syncPageBlocksFromWidgets | yes | yes | ❌ |
| syncLegacyEntFromActions | yes | yes | ❌ |
| communityWrite lock | yes | yes | ❌ |

**Khác biệt duy nhất đáng kể:** Admin `wl()` có thể đọc `PlatformLayersWidgets`; Runtime `wl()` chỉ `WidgetLibraryCatalog \|\| L4RuntimeReader`.

---

## 2. Ownership proof — Runtime có phải SoT thứ hai?

### 2.1 grep dual maintenance

```bash
rg "function normalizePlan\(" . --glob "*.js"
# Admin_Design_system/.../entitlement-catalog.js
# User_Web/.../plan-normalize-runtime.js

rg "function resolveBlockEnabled\(" . --glob "*.js"
# Admin entitlement-catalog.js
# User_Web plan-normalize-runtime.js
```

| Function | Admin maintain | Runtime maintain |
|----------|----------------|------------------|
| `normalizePlan` | ✅ (matrix UI, plans-store) | ✅ (User Web) |
| `resolveBlockEnabled` | ✅ | ✅ |
| `blocksForPage` | ✅ | ✅ |
| `isPermissionScopedWidget` | ✅ | ✅ |

→ **Có 2 bản implement** cho default/normalize rules. Reviewer **đúng**.

### 2.2 SoT hierarchy (thực tế sau E5)

```text
SoT cao nhất — tier matrix overrides (guest/free/premium/elite blocks/pages)
  GET /api/plans/runtime  →  PlansRuntimeReader  →  Admin đã publish

SoT widget IDs / deploy metadata (read)
  L4RuntimeReader + WidgetLibraryCatalog (compat)

SoT default rules khi thiếu override  ⚠️ DUAL
  Admin EntitlementCatalog.normalizePlan defaults
  Runtime IfluxPlanNormalize.normalizePlan defaults   ← cùng logic, 2 file
```

**Runtime KHÔNG phải Permission Engine số 2 về write** — không save, không matrix edit.

**Runtime ĐANG là interpreter số 2 về default normalization rules** — đây là debt, không phải boundary fail.

### 2.3 Ticket bắt buộc

| ID | Nội dung | Target |
|----|----------|--------|
| **ABH-TD-E5-001** | **ONE Rule Provenance** — Generated Artifact (preferred) hoặc server publish-time projection; Runtime consume JSON only | **E6** |

**E5 PASS boundary** có thể chấp nhận nếu Owner ack debt **ABH-TD-E5-001** là exit criteria E6.

---

## 3. Pure function proof

```bash
rg "fetch\(|XMLHttpRequest|document\.|location\.|history\." \
  User_Web/iflux-web-ui/plan-normalize-runtime.js
# → 0

rg "localStorage|sessionStorage|dispatchEvent" \
  User_Web/iflux-web-ui/plan-normalize-runtime.js
# → 0 functional (comment only)
```

**Đọc global (read-only projection):**

| Global read | Mục đích |
|-------------|----------|
| `WidgetLibraryCatalog` | widget metadata (compat) |
| `L4RuntimeReader` | widget IDs, deploy |
| `IfluxWidgetRegistry` | fallback title/tier |

Không HTTP · không DOM · không navigation → **pure transform + read projection** ✅

---

## 4. Dependency direction

```bash
rg "PageSettings|Placement|WidgetPlacement|PlatformLayers" \
  User_Web/iflux-web-ui/plan-normalize-runtime.js
# → 0
```

✅ PASS

---

## 5. E6 Sunset proof — WidgetLibraryCatalog có thể xóa?

### 5.1 Consumer inventory (User Web, 2026-07-27)

| # | File | API used | E6 replace with |
|---|------|----------|-----------------|
| 1 | `readers/l4-runtime-reader.js` | **install** facade | Remove install; optional thin alias 1 release |
| 2 | `plan-normalize-runtime.js` | `wl()` → facade | `L4RuntimeReader` only |
| 3 | `iflux-entitlements.js` | `widgetsForPage` fallback | `L4RuntimeReader` / rename API |
| 4 | `iflux-block-gate.js` | `allWidgetIdsInLibrary` fallback | `L4RuntimeReader.widgetIds()` |
| 5 | `widget-registry.js` | facade \|\| L4 | L4 only |
| 6 | `widget-renderers.js` | `resolveWidgetCopy` | `L4RuntimeReader.resolveWidgetCopy` |
| 7 | `dashboard-engine.js` | facade fallback ×2 | L4 only |
| 8 | `market-heatmap.js` | facade \|\| L4 | L4 only |
| 9 | `market-liquidity.js` | `resolveWidgetCopy` | L4 only |
| 10 | `community-market-overview.js` | `resolveWidgetCopy` | L4 only |
| 11 | `community-trending.js` | L4 \|\| facade | L4 only |
| 12 | `flow-score-top.js` | `WidgetLibraryCatalog` ×2 | L4 only |

**Tổng:** **11 consumer files** · **~14 call-sites** (không tính installer).

### 5.2 E6 done criteria (ABH-10)

```bash
rg "WidgetLibraryCatalog" User_Web/ --glob "*.js"
# Target: 0 active (hoặc 1 deprecated shim file with @deprecated + delete E7)
```

```javascript
typeof window.WidgetLibraryCatalog  // "undefined" after E6
```

**Không chỉ đổi tên** — xóa `installLibraryFacade()` body hoặc no-op + migrate consumers.

### 5.3 Effort estimate

Mỗi consumer: mechanical `WidgetLibraryCatalog.X` → `L4RuntimeReader.X` (API đã mirror). **Không** mở Reader API mới (ABH-09).

---

**Trạng thái E5:** **PASS WITH ARCHITECTURAL CONDITION** (Owner 2026-07-27)

---

## 8. Owner verdict — không Option A “debt nhỏ”

| Cursor đề xuất | Owner chốt |
|----------------|------------|
| CONDITIONAL PASS / Option A ack debt | **PASS WITH ARCHITECTURAL CONDITION** |
| “FAIL kiến trúc lý tưởng” / “technical debt” | **Architecture Incomplete** — ownership nợ |
| E6 optional cleanup | **E6 BLOCKED** until [`ABH-TD-E5-001`](ABH-TD-E5-001-Single-Rule-Provenance.md) |

**SoT:** Runtime **consume** · Permission **owns rules** — Runtime fork `normalizePlan` = interpreter #2.

**Ticket:** [`ABH-TD-E5-001-Single-Rule-Provenance.md`](ABH-TD-E5-001-Single-Rule-Provenance.md) — acceptance = **ONE Rule Provenance**, not “one implementation”.

**E6 gate:** [`ABH-12-Rule-Provenance-Gate.md`](ABH-12-Rule-Provenance-Gate.md) — provenance + **traceability** + 5 điều kiện ABH COMPLETE.

---

## 9. Đề xuất Owner (superseded)

~~Option A — E5 CONDITIONAL PASS~~ → **Owner: PASS WITH ARCHITECTURAL CONDITION** (§8).

---

*Audit này trả lời 5 nhóm evidence Reviewer — không thay thế runtime test guest/free/premium trên Production.*
