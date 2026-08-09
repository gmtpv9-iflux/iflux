# ABH-09 — Reader & Facade Freeze Gate (v1.1)

**Status:** **APPROVED — Owner 2026-07-27 (v1.1 whitelist-first)**  
**Ngày:** 2026-07-27  
**SoT:** [`Architecture-Boundary-Hardening-Plan.md`](../Architecture-Boundary-Hardening-Plan.md) AB-07 · ABH-08  
**Governance:** CG-011 · CG-030  
**Liên kết:** ABH-10 (Compatibility Sunset) · ABH-11 (Net Complexity)

---

## 0. Hai chuyện khác nhau

| | AB-07 (cũ) | ABH-09 (mới) |
|---|-----------|--------------|
| Câu hỏi | Runtime có read-only không? | Reader **được phép lớn đến đâu**? |
| Chặn | save / publish | save **và** God Reader (`refresh`, `warmup`, `resolveEverything`, …) |
| Cơ chế | Blacklist | **Whitelist là chính** — blacklist chỉ bổ sung |

Read-only **không đủ**. Ví dụ vẫn read-only nhưng đã là God Reader:

```text
load · getPlan · listPlans · refresh · warmup · preload · resolve · find · lookup
```

ABH-09 chặn drift kiểu này.

---

## 1. Nguyên tắc — Whitelist first

### 1.1 Quy tắc vàng

> **Only these public APIs are allowed.**  
> Anything else → Owner approval (§4) + cập nhật whitelist.

Blacklist (`save`, `hydrate`, …) **bổ sung** — không thay whitelist.

### 1.2 Không dùng “số method” làm KPI

**Sai:**

> Max methods = 6 → pass

**Đúng:**

> API mới phải chứng minh **consumer + lý do** — không gom logic vào 1 mega-method

| Pattern | Verdict |
|---------|---------|
| `resolveEverything()` 1 method · 2000 LOC | **FAIL** — God Reader |
| `getPlan()` + `getTier()` + `getCurrency()` · 8 method · 40 LOC mỗi cái | OK **nếu** §4 amendment + consumer map |

Review amendment: **LOC / responsibility per method**, không đếm method.

### 1.3 Reader ≠ Store đổi tên

Nội bộ (`mergePlan`, `storeData`, `parseWidgetArtifact`) — OK nếu **không export**, không ghi storage.

---

## 2. Whitelist — ONLY these public APIs (baseline E4)

Mọi key/method **ngoài list** = vi phạm ABH-09 → PR **FAIL** (trừ §4 Owner amend).

### 2.1 `PlansRuntimeReader`

```text
✔ load(opts?)
✔ isReady()
✔ getPlan(tier)
✔ listTiers()
✔ listPlans()
✔ formatVnd(n)
```

**Consumers hiện tại (≥2 — justified):** shell-boot, iflux-entitlements, auth, iflux-guest-shell, checkout-feature-boot, subscription-orders-store, iflux-plans-catalog, pricing-page, l4-runtime-reader (load dep).

### 2.2 `L4RuntimeReader`

```text
✔ load(opts?)
✔ isReady()
✔ widgetIds()
✔ entitlementMeta(id)
✔ resolveWidgetCopy(id)
✔ fetchWidget(id)
✔ entitlementList()
✔ installLibraryFacade()   ← wiring only; không thêm consumer gọi facade qua đây
```

**Consumers:** shell-boot, iflux-block-gate, widget-registry, dashboard-engine, community-trending, market-heatmap, widget-renderers, …

### 2.3 `WidgetLibraryCatalog` (Compatibility Layer — xem ABH-10)

**ONLY** these keys (facade):

```text
✔ __fromL4RuntimeReader
✔ ENTITY_LABELS
✔ WIDGET_SPECS          ← deprecated ABH-TD-E4-001 · target remove E6
✔ allWidgetIdsInLibrary()
✔ widgetIds()
✔ canonicalWidgetId(id)
✔ getPageDeploy(id) / widgetDeploy
✔ resolveWidgetCopy(id)
✔ widgetsForPage(pageKey)   ← semantic debt ABH-TD-E4-003 · rename target E6
✔ groupForWidget(id)
✔ deployLabel(id)
✔ widgetDefaults(id)
```

**Cấm thêm (blacklist bổ sung):** `buildLibrary`, `stats`, `findWidget`, `save*`, `sync*`, `refresh*`, `warmup*`, `preload*`, `WIDGET_GROUPS`, Placement APIs.

---

## 3. Grep gates — mỗi PR E5/E6

### 3.1 Blacklist supplement (forbidden patterns)

```bash
rg -n "\.(save|publish|hydrate|sync|refresh|notify|warmup|preload|mergeStore|saveStore|publishRuntime)\(" \
  User_Web/iflux-web-ui/readers/
# → 0

rg -n "localStorage|sessionStorage|dispatchEvent" \
  User_Web/iflux-web-ui/readers/
# → 0 functional

rg -n "PageSettingsStore|PageSettingsCatalog|PlacementWidgetIndex" \
  User_Web/iflux-web-ui/readers/
# → 0
```

### 3.2 Whitelist drift — diff export block

Reviewer **diff** object literal `global.PlansRuntimeReader = { … }` và `WidgetLibraryCatalog = { … }` — mọi key lạ → FAIL.

Không thay bằng “count = 6”.

### 3.3 Anti mega-method

Amendment PR phải ghi **LOC per new public method**. Method > ~80 LOC hoặc >1 WGS concern → default REJECT (tách pure function / consumer-local).

---

## 4. Amendment — API mới (CG-030)

**Cấm** tự thêm public API trong E5/E6.

Checklist bắt buộc:

1. **Consumer map** — liệt kê **≥2 call-site** active (hoặc Owner exception § ABH-11)
2. **Impact Analysis** — tại sao không sửa consumer / pure function
3. **Không phải** write path (`save`/`sync`/…) → default REJECT
4. **Không phải** mega-method God Reader
5. Owner decision + **cập nhật whitelist §2** (version bump)
6. Grep §3 PASS

---

## 5. Technical Debt (linked gates)

| ID | Nội dung | Block |
|----|----------|-------|
| **ABH-TD-E4-001** | `_meta` vs `WIDGET_SPECS` — **One Source of Truth** | **E6 close** |
| **ABH-TD-E4-002** | regex heuristic · publish `deployPages` | E6 / Backend |
| **ABH-TD-E4-003** | `widgetsForPage` semantic debt → rename entitlement domain | **E6** |

---

## 6. E5 pre-flight (Owner approved 2026-07-27)

- [x] Owner ack ABH-09 v1.1 (whitelist-first)
- [x] Owner ack ABH-10 + ABH-11
- [ ] Baseline grep §3 → `E5-Evidence-Report.md`
- [ ] E5 **không** mở rộng Reader/Facade whitelist
- [ ] `E5-Acceptance-Criteria.md` PASS

**E5:** **OPEN** — điều kiện trên.

---

## 7. E6 pre-flight

- [ ] ABH-TD-E4-001 đóng — `_meta` only
- [ ] ABH-10: facade compatibility removed or consumers on Reader direct
- [ ] ABH-11 complexity table improved vs E4 baseline
- [ ] Whitelist §2 unchanged or Owner-amended only
- [ ] Grep §3 PASS

---

*ABH-09 v1.1 — whitelist là cơ chế chính; API count không phải KPI.*
