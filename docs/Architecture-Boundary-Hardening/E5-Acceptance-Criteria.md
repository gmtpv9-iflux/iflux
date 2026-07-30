# ABH E5 — Điều kiện chấp nhận (Acceptance Criteria)

**Ngày:** 2026-07-27  
**Trạng thái:** **E5 CLOSED — PASS WITH ARCHITECTURAL CONDITION** (Owner 2026-07-27)  
**Condition:** [`ABH-TD-E5-001`](ABH-TD-E5-001-Single-Rule-Provenance.md) · [`ABH-12`](ABH-12-Rule-Provenance-Gate.md)  
**SoT:** [`Architecture-Boundary-Hardening-Plan.md`](../Architecture-Boundary-Hardening-Plan.md) §Phase E5 · AB-07 · ABH-08  
**Governance:** [`SoT — Engineering Change Governance.md`](../SoT%20—%20Engineering%20Change%20Governance.md) CG-005 · CG-010 · CG-011 · CG-020 · CG-021 · CG-030  
**Bài học E4:** Phase **FAIL** nếu còn lỗi runtime thuộc scope (vd. console 404 boot) dù grep import = 0. **Không** dùng “PARTIAL PASS” làm đóng phase.

---

## 0.1 Pre-flight (ABH-09 / 10 / 11)

- [x] Owner ack ABH-09 v1.1 (whitelist-first)
- [x] Owner ack ABH-10 (Compatibility Sunset · facade target E6)
- [x] Owner ack ABH-11 (Complexity table + ≥2 consumer rule)
- [ ] Baseline grep ABH-09 §3 → `E5-Evidence-Report.md`
- [ ] ABH-11 complexity table row E5 Target filled post-impl
- [ ] E5 **không** mở rộng Reader/Facade whitelist · **không** thêm facade consumer

---

| Trong scope | Ngoài scope |
|-------------|-------------|
| Gỡ `EntitlementCatalog` (Admin `app/subscription/entitlement-catalog.js`) khỏi User Web shell | Thay đổi ma trận Admin Permission UI |
| Migrate logic **read-only** entitlement runtime sang `iflux-entitlements.js` + readers E4 | `auth.js` client tier grant (RO-01–05) — behavior change |
| Extract pure `normalizePlan` (và helpers read-only cần thiết) — không Store | Publish Pipeline / SoT flow |
| Cập nhật consumers: `iflux-entitlements`, `iflux-block-gate`, `iflux-plans-catalog`, `plans-runtime-reader` | Wave 3 dev key |
| **Không đổi** hành vi sản phẩm guest/free/premium/elite | E6 exit docs (phase riêng) |

**Mục tiêu kiến trúc (plan WS-4):**

```text
Runtime shell KHÔNG load Admin app/subscription/*.js
IfluxEntitlements đọc PlansRuntimeReader + L4RuntimeReader (+ pure normalize)
```

---

## 1. Nguyên tắc PASS/FAIL (mirror CG + ABH-08)

### 1.1 Hai vế bắt buộc (ABH-08)

Mỗi kết luận phase phải có **Introduce** và **Eliminate**. Thiếu một vế → **FAIL** (CG-021).

| Vế | Ý nghĩa | Không đủ nếu chỉ |
|----|---------|------------------|
| **Introduce** | Luồng mới hoạt động + verify runtime | grep “đã thêm file” |
| **Eliminate** | Luồng cũ **UNREACHABLE** (import + window + dynamic load) | grep import = 0 nhưng module vẫn boot |

### 1.2 Cấm additive-only (CG-010, CG-011, CG-020)

- **CẤM** load `entitlement-catalog.js` rồi thêm reader song song “tạm”.
- **CẤM** `if (global.EntitlementCatalog)` fallback vĩnh viễn sau E5 — chỉ được giữ trong PR transition nếu **cùng PR xóa hết** trước merge.
- **CẤM** comment block legacy thay cho xóa script load (E4 lesson).

### 1.3 Evidence bắt buộc trước khi báo PASS

Agent **không** được báo “E5 xong” nếu chưa commit file:

`docs/Architecture-Boundary-Hardening/E5-Evidence-Report.md`

Mỗi hàng checklist §2 phải có: **lệnh grep/curl** + **output thực** (hoặc link screenshot DevTools) — không ghi “→ 0” không kèm chứng cứ.

### 1.4 Runtime gate (bổ sung sau thiếu sót E4)

Các mục **R-** bên dưới là **blocking**. Fail một mục R → **FAIL toàn phase**, kể cả grep sạch.

---

## 2. Checklist PASS — bắt buộc 100%

### A. Eliminate — Admin subscription trên User Web shell

| ID | Kiểm tra | Pass criteria | Lệnh evidence (bắt buộc chạy) |
|----|----------|---------------|----------------------------------|
| E5-A1 | shell-boot **active** load EntitlementCatalog | **0** entry `ensureParallel` / `loadScript` trỏ `entitlement-catalog.js` | `rg -n "entitlement-catalog|EntitlementCatalog" User_Web/iflux-web-ui/runtime/shell-boot.js` — chỉ được comment hoặc 0 |
| E5-A2 | User Web load **bất kỳ** `Admin_Design_system/app/subscription/*.js` | **0** active load trên shell path | `rg -n "app/subscription/" User_Web/` → 0 active (comment OK) |
| E5-A3 | `window.EntitlementCatalog` sau boot `/home` | **undefined** hoặc **không tồn tại** | DevTools Console: `typeof window.EntitlementCatalog` → `"undefined"` |
| E5-A4 | Dynamic loader không kéo Admin catalog | feature-runtime blocklist vẫn chặn; manifest không require catalog | `rg "entitlement-catalog" User_Web/` — chỉ blocklist/test |
| E5-A5 | Network — không fetch Admin subscription JS | **0** request `entitlement-catalog.js` trên cold load `/home` | DevTools Network filter `entitlement-catalog` → 0 |

### B. Introduce — Runtime entitlement stack (replacement)

| ID | Kiểm tra | Pass criteria | Evidence |
|----|----------|---------------|----------|
| E5-B1 | `IfluxEntitlements` không gọi `EntitlementCatalog.*` | **0** active reference | `rg "EntitlementCatalog" User_Web/ --glob "*.{js,html}"` → 0 (trừ comment/docs/evidence) |
| E5-B2 | `iflux-block-gate.js` | `isPermissionScopedWidget` từ runtime pure / L4 reader — **không** Admin | grep file → 0 `EntitlementCatalog` |
| E5-B3 | `iflux-plans-catalog.js` | `normalizePlan` từ shared pure — **không** Admin | grep file → 0 `EntitlementCatalog` |
| E5-B4 | `plans-runtime-reader.js` | `normalizePlan` từ shared pure — **không** delegate Admin | grep file → 0 `EntitlementCatalog` |
| E5-B5 | Pure normalize module | File mới (vd. `shared/runtime-read/plan-normalize.js` hoặc inline trong `iflux-entitlements.js` nếu CG-012 justify) — **no store, no localStorage** | AB-07 grep trên file normalize |
| E5-B6 | Public API `IfluxEntitlements` | **Không đổi** surface export hiện tại (same keys) | Diff export object + consumer grep |

**Pure normalize — AB-07 forbidden (phải 0 functional):**

```bash
rg "localStorage|sessionStorage|hydrate\(|publish|\.save\(|sync\(|dispatchEvent|refreshBlocksCatalog" <normalize-module-path>
```

### C. Consumer migration (Before → After)

Mọi consumer **active** phải map trong Evidence Report:

| Consumer | Before (E4 partial) | After (E5 required) |
|----------|---------------------|---------------------|
| `shell-boot.js` | load Admin `entitlement-catalog.js` | **không load** |
| `iflux-entitlements.js` | `EntitlementCatalog.normalizePlan`, `PAGES`, `BLOCKS`, `resolveBlockEnabled`, `blocksForPage`, `isPermissionScopedWidget` | `PlansRuntimeReader` + `L4RuntimeReader` + pure normalize / runtime index |
| `iflux-block-gate.js` | `EntitlementCatalog.isPermissionScopedWidget` | pure helper hoặc `L4RuntimeReader.entitlementMeta` |
| `iflux-plans-catalog.js` | `EntitlementCatalog.normalizePlan` | pure normalize |
| `plans-runtime-reader.js` | delegate `EntitlementCatalog.normalizePlan` | pure normalize |

**Dead path audit (UNREACHABLE):**

```bash
rg "EntitlementCatalog\.|window\.EntitlementCatalog|global\.EntitlementCatalog" User_Web/ --glob "*.{js,html}"
# → 0 active
```

Không chỉ import — mọi `global.EntitlementCatalog` conditional cũng phải **0**.

### D. AB-07 — Không God Reader / God Entitlements

| ID | Rule | Pass |
|----|------|------|
| E5-D1 | Module entitlement runtime **không** có save/publish/hydrate/sync/refresh/notify | forbidden grep = 0 |
| E5-D2 | **Không** mở rộng `PlansRuntimeReader` / `L4RuntimeReader` thêm write API cho E5 | public API frozen như E4 Evidence |
| E5-D3 | Nếu tạo `EntitlementRuntimeReader` — surface **chỉ** read: `normalizePlan`, `resolveBlockEnabled`, `isPermissionScopedWidget`, `pages`, `blocksForPage` — **không** `refresh*` | liệt kê public API trong Evidence |

### E. Refactor balance (CG-021)

| Metric | Ghi trong Evidence Report |
|--------|---------------------------|
| Removed LOC | Admin `entitlement-catalog.js` **không còn load** (~790 LOC off shell) |
| Added LOC | pure normalize + wiring (ghi số thực) |
| Net shell LOC | phải **giảm** — nếu tăng >50 LOC phải justify Ownership |
| Removed runtime paths | `EntitlementCatalog` boot path |
| Added runtime paths | pure read path only — **1** path, không dual |

---

## 3. Runtime verification (blocking — R-*)

**Deploy Production → purge Cloudflare → hard refresh.** Không PASS trên local-only.

| ID | Probe | Pass criteria |
|----|-------|---------------|
| **R-1** | Console cold load `https://iflux.vn/home` | **0 error**, **0 failed network** thuộc entitlement/L4/plans boot (404 favicon ngoài scope E5 nhưng ghi chú) |
| **R-2** | Guest menu | `IfluxEntitlements.visibleMenus()` — cùng số item + keys như baseline E4 Evidence (screenshot hoặc console dump) |
| **R-3** | Tier matrix `hasBlock` | Guest / Free / Premium — probe **≥5 widget IDs** từ matrix (incl. WGT-* permission-scoped): kết quả **identical** before/after E5 deploy |
| **R-4** | Paywall / block gate | Trang có widget gated — guest thấy gate, premium pass — **unchanged** |
| **R-5** | `canAccessPage` | 5 page keys: `home`, `market`, `community`, `dashboard`, `pricing` × guest/free/premium — matrix PASS |
| **R-6** | DevTools Application | **Không ghi** key Admin mới: `iflux-admin-plans-v1`, `iflux_l4_widgets_v2`, entitlement mirror keys |
| **R-7** | Admin regression | Ma trận Permission save tier block → User Web `hasBlock` vẫn sync (manual 1 case) |

### Ma trận tier test (tối thiểu)

```
Tier: guest | free | premium
API:  PlansRuntimeReader.load() done
Check: IfluxEntitlements.currentPlan().tier
Check: IfluxEntitlements.hasBlock('<id>') × 3 widget IDs
Check: IfluxEntitlements.visibleMenus().map(m => m.key)
Check: document.querySelectorAll nav menu items) — không crash
```

---

## 4. Dual Path Audit template (bắt buộc trong E5-Evidence-Report)

| Flow | Status | Evidence |
|------|--------|----------|
| Old: shell → Admin `entitlement-catalog.js` → `BLOCKS`/`PAGES` | **Removed** | E5-A1..A5 + E5-A3 runtime |
| Old: consumers → `EntitlementCatalog.*` | **Removed** | grep E5-B1 + Dead path |
| New: shell → PlansRuntimeReader + L4RuntimeReader → IfluxEntitlements | **Active** | R-1..R-7 |
| New: pure normalize (no Admin) | **Active** | E5-B5 AB-07 grep |

Thiếu cột **Removed** với evidence → **FAIL** (ABH-08).

---

## 5. Definition of Done — E5 (Owner 2026-07-27)

### 5.1 Boundary scope — **PASS**

- [x] Checklist §2 (A–E) có evidence trong `E5-Evidence-Report.md`
- [x] 0 Admin subscription on shell
- [x] IfluxPlanNormalize + readers — không Admin delegate trên shell

### 5.2 Architecture ownership — **CONDITION (ABH-TD-E5-001 + ABH-12)**

- [ ] **ONE Rule Provenance** of entitlement rules (không phải “one implementation”)
- [ ] Runtime **MUST NOT** interpret — consume artifact/JSON only
- [ ] Provenance **traceable** Runtime → Publish → Permission → Admin
- [ ] [`E6-Rule-Provenance-Report.md`](E6-Rule-Provenance-Report.md) (ABH-12)

**Solution priority (E6):** Generated Artifact → Server-side normalize → Shared core (fallback only) — see [`ABH-TD-E5-001`](ABH-TD-E5-001-Single-Rule-Provenance.md) §3.

**E5 overall:** **PASS WITH ARCHITECTURAL CONDITION** — không FAIL · không full PASS · ABH track incomplete until condition closed.

**Cấm đóng ABH track nếu:**

- Còn `global.EntitlementCatalog &&` trong bất kỳ file User Web active
- Console còn 404/error do entitlement boot path (kể cả lazy fetch sai scope)
- Agent chỉ báo “grep = 0” không paste output
- Net result là additive (Admin catalog vẫn load “phòng hờ”)

---

## 6. Deliverables E5 (ngoài code)

| File | Mục đích |
|------|----------|
| `docs/Architecture-Boundary-Hardening/E5-Evidence-Report.md` | Bằng chứng PASS — **bắt buộc** |
| `docs/Architecture-Boundary-Hardening/E5-Deploy-Verification.md` | R-1..R-7 + screenshot/console dump |
| Cập nhật `E4-Evidence-Report.md` | Ghi E4 closed chỉ khi E5-A2 satisfied (0 Admin subscription shell) |

---

## 7. Impact Analysis tối thiểu (CG-005 — trước khi code)

```
Feature: Runtime Entitlement stack decouple
Current owner: Admin EntitlementCatalog (790 LOC) loaded on User Web shell
Files: shell-boot, iflux-entitlements, iflux-block-gate, iflux-plans-catalog, plans-runtime-reader
Consumers: IfluxEntitlements, IfluxBlockGate, pricing, guest menu, widget gate
Storage-API: GET /api/plans/runtime only; no Admin PATCH
Decision: Extract pure normalize + inline read facades; Eliminate Admin catalog load
Removal plan: entitlement-catalog.js off shell; remove all EntitlementCatalog.* from User_Web
```

---

## 9. Reviewer gates bổ sung (từ E4 deep audit feedback)

Ngoài checklist §2, E5 **FAIL** nếu thiếu các mục sau trong Evidence Report:

### 9.1 Full-repo grep (không chỉ `User_Web/`)

```bash
rg -n "EntitlementCatalog" . --glob "*.{js,html}" --glob "!docs/**" --glob "!Coverage-*"
```

Phân loại bắt buộc mỗi hit: **Active runtime (User Web)** · **Admin-only** · **Comment** · **Legacy/archive** · **Docs**

Cùng pattern cho `PlansStore`, `PlatformLayersWidgets` — chứng minh User Web path = 0 active.

### 9.2 Unreachable ≠ “shell không load”

Phải audit **cả 4 lớp:**

| Lớp | Evidence |
|-----|----------|
| shell-boot active `ensureParallel` | grep — 0 Admin subscription |
| dynamic loader (`feature-runtime.js` blocklist, `loadScript` callers) | grep — 0 path tới `entitlement-catalog.js` |
| `typeof window.EntitlementCatalog` sau boot `/home` | DevTools → `"undefined"` |
| Network tab cold load | 0 request `entitlement-catalog.js` |

### 9.3 Runtime Bundle Audit (Network — blocking)

| Before E5 shell | After E5 shell |
|-----------------|----------------|
| `entitlement-catalog.js` (~790 LOC) | **0 download** |
| Readers E4 (~369 LOC) | giữ nguyên |

Reviewer reproduce: filter Network `entitlement-catalog` → **0** on `/home` cold load.

### 9.4 Facade freeze (`installLibraryFacade`)

Liệt kê **đầy đủ** public surface `window.WidgetLibraryCatalog` sau E5.

**Cấm thêm:** `save*`, `sync*`, `publish*`, `hydrate*`, `refresh*`, `buildLibrary`, `notify*`

```bash
rg "save|sync|publish|hydrate|refresh|localStorage|dispatchEvent" \
  User_Web/iflux-web-ui/readers/l4-runtime-reader.js
# → 0 functional
```

So sánh LOC facade Runtime vs Admin PLW facade — Runtime phải **subset read-only**.

---


| Gap E4 | Bổ sung E5 |
|--------|------------|
| Chỉ grep import PlansStore | + runtime `typeof window.*` + Network tab |
| “PARTIAL PASS” vẫn đề xuất tiếp | **Cấm** đóng phase khi còn item §2/R-* fail |
| Console 404 không blocking | **R-1 blocking** cho mọi lỗi boot thuộc scope |
| EntitlementCatalog “E5 later” không gate E4 close | E4 **chính thức PARTIAL**; E5 **must** close A2 |
| Không bảng consumer | Bảng §2-C bắt buộc |
| Không Dead Path window.* | E5-A3 + Dead path grep bắt buộc |

---

*Document này là gate Reviewer cho E5 — implement chỉ bắt đầu sau Owner ack (hoặc explicit “làm E5” trong task).*
