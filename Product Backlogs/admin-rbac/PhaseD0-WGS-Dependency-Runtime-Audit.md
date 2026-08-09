# WGS Dependency Direction & Runtime Ownership Audit

**Ngày:** 2026-07-27  
**SoT:** `docs/SoT — iFlux Product Architecture (V2).md` — Four Sources of Truth (WGS)  
**Phạm vi:** Local repo `iFLUX_P1` — Admin + User Web runtime  
**Loại:** Audit only — không sửa code trong phase này

---

## Khung kiểm tra

### A. Dependency Direction (compile/load time)

WGS **không được import chéo ngang** (chỉ đọc upstream theo hướng khai báo → runtime):

```text
WGS-04 Data (Tầng 4)     → có thể đọc Template
WGS-03 Template          → (không đọc Placement / Permission)
WGS-02 Placement         → có thể đọc L4 (widget catalog)
WGS-01 Permission        → có thể đọc L4 (widget list cho matrix)

CẤM:
  Placement → Template
  Permission → Placement
  L4 → Permission (event/sync ngược)
  Template → Placement
```

### B. Runtime Ownership (execute time)

```text
Runtime → Permission Engine → Placement (PagePublished) → Template → Data

Runtime: CHỈ ĐỌC governance SoT.
CẤM Runtime: save() / publish() / updatePlacement() lên Admin SoT.
```

---

## Phần 1 — Dependency Direction Audit

### 1.1 Tổng quan

| Cấm (From → To) | Vi phạm? | Số chỗ |
|-----------------|----------|--------|
| Placement → Template | **Không** | 0 |
| Permission → Placement | **Có** | 4–5 |
| L4 → Permission | **Có** | 4 (+ vòng tròn) |
| Template → Placement | **Không** | 0 |
| **Vòng tròn L4 ↔ Permission** | **Có** | 1 cặp |

### 1.2 CLEAN — ranh giới đúng SoT

| Ranh giới | Evidence |
|-----------|----------|
| **Placement → Template** | `page-settings.html`, `layout-manager.html`: không load `templates-*.js`. `page-settings-page.js` không reference `TemplatesStore/Catalog`. |
| **Template → Placement** | `templates.html` + `templates-page.js`: zero `PageSettings*` / `layout-manager`. |
| **Placement → L4** (được phép) | `page-settings-catalog.js` → `PlatformLayersWidgets`; `page-runtime-manifest.js` resolve `templateRef` qua L4, không qua Template module. |
| **L4 → Template** (được phép) | `platform-layers-widgets.js` → `TemplatesCatalog/Store` (optional globals). |
| **Permission → L4** (được phép) | `entitlement-catalog.js:116` → `PlatformLayersWidgets.entitlementList()`. |

### 1.3 VIOLATION — Permission → Placement

| ID | File | Line | Import / call | Severity | Context |
|----|------|------|---------------|----------|---------|
| DD-01 | `app/subscription/entitlements.html` | 58–60, 72–84 | Script load `page-settings-catalog.js`, `page-settings-store.js`, `widget-publish-client.js`; inline `PageSettingsStore.hydratePublishedPage()` | **HIGH** | Admin — ma trận entitlement **phụ thuộc** placement published |
| DD-02 | `app/subscription/entitlement-matrix-ui.js` | 57, 71–72 | `PageSettingsCatalog.listEnabledPlacementWidgets()` khi filter "enabled" | **HIGH** | Admin |
| DD-03 | `app/subscription/entitlement-catalog.js` | ~391–392 | Fallback `PageSettingsCatalog.allWidgetIds()` trong `defaultBlocksForTier('elite')` | **MEDIUM** | **User Web shell** load file này |
| DD-04 | `User_Web/iflux-web-ui/iflux-block-gate.js` | ~21–22 | Fallback `PageSettingsCatalog.allWidgetIds()` | **LOW** | Runtime — path chết hôm nay (shell không load PageSettingsCatalog) |

**Script order `entitlements.html` (vi phạm rõ):**

```text
platform-layers-widgets.js
→ page-settings-catalog.js      ← Placement TRƯỚC Permission
→ page-settings-store.js
→ widget-publish-client.js
→ entitlement-catalog.js
→ entitlement-matrix-ui.js
```

### 1.4 VIOLATION — L4 (Widget Definition) → Permission

| ID | File | Line | Import / call | Severity | Context |
|----|------|------|---------------|----------|---------|
| DD-05 | `app/system/platform-layers-widgets.js` | 1878–1882, 2107+ | `notifyPropagate()` → `EntitlementCatalog.refreshBlocksCatalog()` sau save L4 | **HIGH** | **User Web shell** load file này |
| DD-06 | `app/system/platform-layers.html` | ~234 | `<script src="../subscription/entitlement-catalog.js">` | **HIGH** | Admin L4 page |
| DD-07 | `app/system/platform-layers-catalog.js` | ~168 | `EntitlementCatalog.BLOCKS`, `getBlockLabel` | **MEDIUM** | Admin |
| DD-08 | `app/system/platform-layers-page.js` | ~149–151 | `EntitlementCatalog.getBlockLabel()` | **MEDIUM** | Admin |

### 1.5 Vòng tròn L4 ↔ Permission

```text
L4 → Permission:  platform-layers-widgets.js notifyPropagate → refreshBlocksCatalog
Permission → L4:  entitlement-catalog.js → PlatformLayersWidgets.entitlementList()
```

Cả hai file **cùng load** trên User Web (`shell-boot.js:169–170`). Vòng tròn **dependency graph** — technical debt đáng sợ theo tiêu chí Owner.

### 1.6 Bảng hướng dependency (tóm tắt)

| From → To | SoT | Thực tế | Verdict |
|-----------|-----|---------|---------|
| Placement → Template | Cấm | 0 | ✅ |
| Permission → Placement | Cấm | 4–5 | ❌ |
| L4 → Permission | Cấm | 4 | ❌ |
| Template → Placement | Cấm | 0 | ✅ |
| L4 → Template | Được | Có | ✅ |
| Placement → L4 | Được | Có | ✅ |
| Permission → L4 | Được | Có | ✅ |

**Verdict §1:** **FAIL** — import chéo Permission↔Placement và L4↔Permission tồn tại; Placement↔Template sạch.

---

## Phần 2 — Runtime Ownership Audit

### 2.1 Tổng quan

| Kiểm tra | Kết quả |
|----------|---------|
| User Web gọi `PUT page-composition` / `PATCH entitlements` / `publish/page` | **Không** (grep clean) |
| User Web `saveDraft` / `saveMatrixOverrides` | **Không** |
| PagePublished / widget-loader chỉ GET + apply DOM | **Đúng** — read-only |
| User Web **ghi tier/permission** client-side | **Có** — HIGH |
| User Web load Admin **PlansStore** (write-capable) | **Có** — MEDIUM |
| Nhà Main dashboard layout user override | **By design** — tách lớp user preference |

### 2.2 CLEAN — Runtime chỉ đọc governance

| Module | File | Hành vi |
|--------|------|---------|
| Page manifest | `runtime/bootstrap.js` | GET `/api/pages/:pageKey` only; comment cấm fallback page-composition |
| Layout apply | `runtime/page-layout-engine.js` | GET PagePublished; apply `span` DOM — không persist |
| Widget mount | `runtime/widget-loader.js` | `applySpan` từ slot — không PUT |
| Entitlement facade | `iflux-entitlements.js` | Read-only API (`hasBlock`, `canAccessWidget`) |

### 2.3 VIOLATION — Runtime ghi Permission (tier)

User Web **tự ghi effective tier** → `IfluxEntitlements` đọc tier từ session, không purely từ Admin matrix.

| ID | File | Function | Ghi gì | Severity |
|----|------|----------|--------|----------|
| RO-01 | `User_Web/iflux-web-ui/auth.js` | `syncSubscriptionLifecycle` | `localStorage` session: downgrade `tier` → `free` | **HIGH** |
| RO-02 | `User_Web/iflux-web-ui/auth.js` | `activateTrial` | Client grant `tier`, `subscription_phase=trial_active` | **HIGH** |
| RO-03 | `User_Web/iflux-web-ui/auth.js` | `acknowledgeTrialExpiry` | Client downgrade → free | **HIGH** |
| RO-04 | `User_Web/iflux-web-ui/auth.js` | `updateUser` | Persist tier patches local (+ API profile không gửi tier) | **HIGH** |
| RO-05 | `User_Web/iflux-web-ui/checkout-page.js` | checkout handler | `updateUser({ tier, subscription_phase:'paid' })` sau checkout | **HIGH** |

→ Runtime **không** gọi Admin entitlement API, nhưng **ghi trạng thái permission** mà Permission Engine tin — vi phạm tinh thần "Runtime chỉ đọc".

### 2.4 VIOLATION — Admin write modules trên User Web shell

| ID | File | Trigger | Ghi gì | Severity |
|----|------|---------|--------|----------|
| RO-06 | `runtime/shell-boot.js:170–171` | Mọi page boot | Load full `PlansStore` + `hydrate()` | **MEDIUM** |
| RO-07 | `plans-store.js` `hydrate()` | User Web boot | `localStorage` `iflux-plans-v1` — merge có thể **local beat server** | **MEDIUM** |
| RO-08 | `shell-boot.js:169` | Mọi page boot | Load `PlatformLayersWidgets` | **MEDIUM** |
| RO-09 | `platform-layers-widgets.js` | First L4 read on User Web | `migrateStoreOnce` → `localStorage` `iflux_l4_widgets_v2` | **MEDIUM** |

User Web **không** gọi `saveMatrixOverrides` / `publishRuntime`, nhưng **bundle Admin store có khả năng ghi** và hydrate **đã ghi** localStorage entitlement cache.

### 2.5 INFO — User preference layer (không phải Admin Placement SoT)

| File | Key / API | Ghi chú |
|------|-----------|---------|
| `dashboard-engine.js` | `iflux_web_dashboard_layout_v2` | User reorder/width trên **Nhà Main canvas** — product rule cho phép |
| `iflux-user-data-sync.js` | PUT `/user-data/dashboard` | Sync preference user, không phải PagePublished |

Sidebar home vẫn từ PagePublished; Main = user override — **không** vi phạm Admin Placement SoT.

### 2.6 Bảng Runtime Ownership

| Layer | Đọc đúng? | Ghi sai? |
|-------|------------|----------|
| Permission Engine | ✅ đọc PlansStore/matrix | ❌ tier từ client auth lifecycle |
| Placement | ✅ GET PagePublished | ✅ không ghi PagePublished |
| Template | ✅ qua manifest/L4 ref | ✅ không ghi Template store |
| Data | ✅ Data Provider path | ⚠️ một số store seed (market) — ngoài WGS |

**Verdict §2:** **PARTIAL FAIL** — governance fetch sạch; **tier/permission client write** và **Admin stores trên User Web shell** là nợ kiến trúc.

---

## Phần 3 — Ma trận rủi ro (Reviewer)

| ID | Loại | Mô tả ngắn | Owner WGS lẫn | Ưu tiên fix |
|----|------|------------|---------------|-------------|
| DD-01 | Dependency | Entitlements page load Placement stack | Permission→Placement | P1 |
| DD-02 | Dependency | Matrix UI filter qua PageSettingsCatalog | Permission→Placement | P1 |
| DD-05 | Dependency | L4 save → refresh EntitlementCatalog | L4→Permission | P1 |
| DD-cycle | Dependency | L4 ↔ Permission circular | Both | P1 |
| RO-01–05 | Runtime | Client tier grant/downgrade | Permission | P1 |
| DD-03, RO-06–09 | Mixed | User Web shell loads write-capable Admin modules | Permission + L4 | P2 |
| DD-06–08 | Dependency | L4 Admin UI dùng EntitlementCatalog labels | L4→Permission | P2 |
| RO dashboard | Runtime | User layout localStorage | — (OK) | — |

---

## Phần 4 — Khuyến nghị (không thực hiện trong audit này)

### P1 — Dependency Direction

1. **`entitlements.html`:** bỏ script Placement; filter "enabled widgets" qua API read-only snapshot (published page list hoặc endpoint entitlement scope).
2. **`platform-layers-widgets.js`:** thay `EntitlementCatalog.refreshBlocksCatalog()` bằng `CustomEvent('iflux-l4-widgets-changed')` — chỉ Admin entitlement page lắng nghe.
3. **`platform-layers.html`:** bỏ `entitlement-catalog.js`; label block native L4.

### P1 — Runtime Ownership

4. **Tier lifecycle:** server webhook / profile API là SoT tier; User Web chỉ đọc — bỏ `activateTrial` client grant.
5. **User Web shell:** thay `PlansStore` bằng **read-only runtime adapter** (GET `/api/plans/runtime` → memory, no localStorage write).

### P2

6. Xóa fallback `PageSettingsCatalog` trong `entitlement-catalog.js`, `iflux-block-gate.js`.
7. L4 catalog trên User Web: read-only snapshot, không `migrateStoreOnce`.

---

## Verdict cuối

| Audit | Verdict |
|-------|---------|
| **Dependency Direction** | **FAIL** — Permission↔Placement và L4↔Permission có import/call chéo; Placement↔Template sạch |
| **Runtime Ownership** | **PARTIAL FAIL** — không ghi Placement/Template Admin API; **có ghi Permission (tier)** và **Admin write stores trên User Web** |

Phase D0 RBAC **đóng** không đồng nghĩa WGS dependency sạch — đây là **track kiến trúc riêng** (đề xuất: **Phase E — WGS Boundary Hardening**).

---

**Evidence commands ( tái lập):**

```bash
# Permission → Placement
rg "PageSettingsCatalog" Admin_Design_system/app/subscription/

# L4 → Permission
rg "EntitlementCatalog" Admin_Design_system/app/system/platform-layers-widgets.js

# User Web governance writes
rg "page-composition|saveMatrixOverrides|saveDraft" User_Web/

# Shell loads Admin stores
rg "PlansStore|PlatformLayersWidgets" User_Web/iflux-web-ui/runtime/shell-boot.js
```
