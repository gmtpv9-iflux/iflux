# ABH E4 — Reviewer Deep Audit (trả lời skeptic points)

**Ngày:** 2026-07-27  
**Phạm vi:** Chứng minh **replacement thật** trên User Web Runtime — không chỉ `grep User_Web/ = 0`  
**Trạng thái E4:** **PARTIAL PASS** (Plans/L4 replaced · EntitlementCatalog Admin vẫn boot · E5 pending)

---

## A. `PlansStore` — grep toàn repo + phân loại

### Lệnh

```bash
rg -n "PlansStore" . --glob "*.{js,html}" --glob "!Coverage-*" --glob "!docs/**"
```

### Kết quả phân loại (9 file `.js`/`.html` active code, không tính docs)

| File | Loại | Active runtime? | Ghi chú |
|------|------|-----------------|---------|
| `Admin_Design_system/app/subscription/plans-store.js` | **Admin Owner** | Admin-only | Định nghĩa `global.PlansStore` — **không phải bug** |
| `Admin_Design_system/app/subscription/plans.html` | Admin page | Admin-only | CRUD plans |
| `Admin_Design_system/app/subscription/plan-edit.html` | Admin page | Admin-only | hydrate/savePlan |
| `Admin_Design_system/app/subscription/entitlements.html` | Admin page | Admin-only | matrix + hydrate |
| `Admin_Design_system/app/dashboard/dashboard-stats.js` | Admin dashboard | Admin-only | `PlansStore.listPlans()` |
| `User_Web/.../runtime/shell-boot.js:168` | **Comment** | ❌ | ABH E4 comment |
| `User_Web/.../runtime/shell-boot.js:182` | **Legacy (comment block)** | ❌ | Trong `/* … */` — **không execute** |
| `User_Web/.../readers/plans-runtime-reader.js:3` | **Comment** | ❌ | Docstring |
| `User_Web/.../iflux-guest-shell.js:105` | **Comment** | ❌ | |
| `_bak/share-affiliate-.../auth.js` | **Archive** | ❌ | Backup, không boot |

### Active runtime call — toàn repo, User Web path

```bash
rg "PlansStore\.|window\.PlansStore|global\.PlansStore" User_Web/ --glob "*.{js,html}"
# → 0 matches
```

```bash
rg "PlansStore\.|window\.PlansStore|global\.PlansStore" . \
  --glob "*.{js,html}" --glob "!Admin_Design_system/**" --glob "!_bak/**" --glob "!docs/**"
# → 0 matches (User_Web + backend + shared — không còn gọi PlansStore)
```

**Kết luận A:** `PlansStore` **vẫn tồn tại trên repo** (Admin WGS — đúng ownership). Trên **User Web Runtime không còn active reference** — không chỉ import, mà **cả method call và window global read**.

---

## B. `PlatformLayersWidgets` — grep toàn repo + phân loại

### User Web

```bash
rg "PlatformLayersWidgets" User_Web/ --glob "*.{js,html}"
```

| File | Loại | Active? |
|------|------|---------|
| `shell-boot.js:168` | Comment | ❌ |
| `shell-boot.js:181` | Legacy trong `/* … */` | ❌ |

```bash
rg "PlatformLayersWidgets\.|window\.PlatformLayersWidgets|global\.PlatformLayersWidgets" User_Web/
# → 0 matches
```

### Admin + shared (còn — đúng scope Admin)

| Vùng | File count (active) | Ghi chú |
|------|---------------------|---------|
| Admin L4/Placement | `platform-layers-widgets.js`, `page-settings-*`, `layout-manager-page.js`, … | Owner WGS |
| Admin Permission | `entitlement-catalog.js` fallback L4 | Admin-only; **E3/E5** |
| `shared/runtime-read/` | `widget-registry-reader.js`, `placement-widget-index-reader.js` | Admin context adapter |

**Kết luận B:** 2299 LOC `platform-layers-widgets.js` **không còn được User Web shell tải**. File vẫn trên server (Admin) — **khác** với “vẫn load nhưng không dùng”.

---

## C. “Unreachable” — ai chứng minh? (không chỉ shell-boot)

### Câu hỏi reviewer

> shell-boot không load ≠ toàn bộ runtime unreachable. Còn dynamic loader?

### Dependency graph — User Web boot `/home`

```text
home/index.html
  └─ bootstrap.js (ESM)
       └─ shell-boot.js → bootShell('home')
            ├─ ensureParallel [ACTIVE]
            │    ├─ PlansRuntimeReader.js      (~163 LOC)  ✅
            │    ├─ L4RuntimeReader.js           (~206 LOC)  ✅
            │    ├─ entitlement-catalog.js       (~790 LOC)  ⚠️ E5
            │    └─ iflux-entitlements.js, block-gate, guest-shell, …
            ├─ [COMMENT BLOCK — NOT EXECUTED]
            │    ├─ PlatformLayersWidgets.js     (2299 LOC)  ❌ không chạy
            │    └─ plans-store.js               (754 LOC)    ❌ không chạy
            └─ PlansRuntimeReader.load() → L4RuntimeReader.load()
```

### Dynamic loader audit

| Loader | Có thể kéo PlansStore/PLW? | Evidence |
|--------|---------------------------|----------|
| `shell-boot.js` `ensureParallel` | **Không** (active list) | Production curl shell-boot — lines 170–172 readers only; 181–182 inside comment |
| `feature-runtime.js` manifest | **Cấm** — blocklist | `SHELL_SRC_BLOCKLIST` includes `/plans-store\.js$/i` — throw nếu manifest trỏ |
| `legacy-bridge.js` `loadScript` | Chỉ khi có caller | `rg loadScript.*plans-store User_Web/` → **0** |
| `checkout-feature-boot.js` | **Không** | `PlansRuntimeReader.load()` only |
| HTML `<script>` tags User Web pages | **Không** | `curl iflux.vn/home \| rg plans-store` → 0 |
| `entitlement-catalog.js` | **Không dynamic load** | `rg loadScript\|createElement.*script entitlement-catalog.js` → 0 |

### Runtime global probe (Production — reviewer reproduce)

Sau cold load `https://iflux.vn/home`, DevTools Console:

```javascript
typeof window.PlansStore              // "undefined"  (expected PASS)
typeof window.PlatformLayersWidgets   // "undefined"  (expected PASS)
typeof window.PlansRuntimeReader      // "object"     (expected PASS)
typeof window.L4RuntimeReader         // "object"     (expected PASS)
typeof window.WidgetLibraryCatalog    // "object"     (facade from L4RuntimeReader)
window.WidgetLibraryCatalog.__fromL4RuntimeReader  // true
```

**Phân biệt rõ:**

| Claim | Đúng / Sai |
|-------|------------|
| “PlansStore unreachable **trên User Web Runtime**” | ✅ **Đúng** — không script load, không window global, không consumer call |
| “PlansStore unreachable **toàn repo**” | ❌ **Sai** — Admin pages vẫn dùng (đúng ownership) |
| “shell-boot không load” | ✅ Đúng nhưng **chưa đủ** — cần thêm dynamic loader + window probe (bảng trên) |

---

## D. Runtime Bundle Audit (Network tab evidence)

### Before E4 (shell load path)

| File | LOC | Shell active load |
|------|-----|-------------------|
| `Admin_.../plans-store.js` | 754 | ✅ (removed) |
| `Admin_.../platform-layers-widgets.js` | 2299 | ✅ (removed) |
| **Subtotal removed** | **3053** | |

### After E4 (shell load path)

| File | LOC | Shell active load |
|------|-----|-------------------|
| `User_Web/.../plans-runtime-reader.js` | 163 | ✅ |
| `User_Web/.../l4-runtime-reader.js` | 206 | ✅ |
| `Admin_.../entitlement-catalog.js` | 790 | ✅ (E5 removes) |
| **Subtotal added (readers)** | **369** | |
| **Net shell JS (Plans/L4 only)** | **−2684 LOC** | |

### Network tab — bằng chứng mạnh nhất (reviewer checklist)

Cold load `https://iflux.vn/home` → DevTools Network → filter:

| URL pattern | Expected After E4 |
|-------------|-------------------|
| `plans-store.js` | **0 requests** |
| `platform-layers-widgets.js` | **0 requests** |
| `plans-runtime-reader.js` | **1 request** (~163 LOC served) |
| `l4-runtime-reader.js` | **1 request** |
| `entitlement-catalog.js` | **1 request** (E5 removes) |

**Lưu ý:** File cũ **vẫn tồn tại trên origin** (HTTP 200 nếu curl trực tiếp — `plans-store.js` ≈ 32KB). Điều quan trọng là **browser không download** trong boot path — không phải file bị xóa khỏi disk.

```bash
# File tồn tại server (Admin vẫn cần)
curl -sS -o /dev/null -w "%{http_code}" "https://iflux.vn/Admin_Design_system/app/subscription/plans-store.js"
# → 200

# HTML /home không reference
curl -sS "https://iflux.vn/home" | rg "plans-store|platform-layers-widgets"
# → (empty)
```

---

## E. `installLibraryFacade()` — God Facade audit

### Code location

`User_Web/iflux-web-ui/readers/l4-runtime-reader.js` lines 98–136

### Surface `window.WidgetLibraryCatalog` (Runtime facade)

| Method / field | Loại | AB-07 |
|----------------|------|-------|
| `__fromL4RuntimeReader: true` | marker | ✅ |
| `ENTITY_LABELS` | static read | ✅ |
| `WIDGET_SPECS` | snapshot read | ✅ |
| `allWidgetIdsInLibrary()` | read | ✅ |
| `widgetIds()` | read | ✅ |
| `canonicalWidgetId(id)` | pure | ✅ |
| `getPageDeploy(id)` / `widgetDeploy` | read memory | ✅ |
| `resolveWidgetCopy(id)` | read (+ lazy GET) | ✅ |
| `widgetsForPage(pageKey)` | filter read | ✅ |
| `groupForWidget(id)` | projection | ✅ |
| `deployLabel(id)` | string | ✅ |
| `widgetDefaults(id)` | read | ✅ |

### Forbidden on facade — grep

```bash
rg "hydrate|publish|sync|save|refresh|localStorage|sessionStorage|dispatchEvent|merge" \
  User_Web/iflux-web-ui/readers/l4-runtime-reader.js
# → 0 functional (chỉ comment "prefetch")
```

**Không có** trên facade: `sync()`, `publish()`, `hydrate()`, `refresh()`, `buildLibrary()` (Admin-only), `save`, `notifyPropagate`.

### So sánh Admin `PlatformLayersWidgets.installLibraryFacade()` (1524–1564)

| Admin facade có | Runtime facade có? |
|-----------------|---------------------|
| `buildLibrary`, `stats`, `findWidget` | ❌ (Admin authoring) |
| `WIDGET_GROUPS`, `getPreviewSpec` | ❌ |
| `resolveWidgetCopy`, `widgetsForPage`, `widgetIds` | ✅ (subset) |

**Rủi ro God Facade:** Facade **hiện tại** là read projection mỏng. **Freeze gate E5/E6:** cấm thêm `save*` / `sync*` / `refresh*` lên facade; mọi mutation giữ ở Admin L4.

**Điểm cần theo dõi:** `WIDGET_SPECS` build **một lần** lúc `installLibraryFacade()` — sau lazy `fetchWidgetOnce` title có thể cập nhật `_meta` nhưng `WIDGET_SPECS` không auto-refresh. Đây là stale-read edge, **không** phải God Facade — fix nếu cần: reinstall facade sau fetch hoặc đọc trực tiếp `_meta` (E5+ nếu bug UI).

---

## F. Verdict thẳng cho Reviewer

| Câu hỏi | Trả lời |
|---------|---------|
| grep chỉ User_Web/ đủ không? | **Không** — cần full repo phân loại + active call pattern + window probe |
| PlansStore unreachable? | **User Web Runtime: YES** (multi-path audit §C). **Admin: NO** (correct). |
| 2299 LOC PLW bỏ load hay vẫn tải? | **Bỏ load** khỏi shell — Network 0 request. File vẫn on disk cho Admin. |
| Bundle nhẹ hơn? | **Có** — net −2684 LOC trên shell path Plans/L4; **chưa** net full vì entitlement-catalog 790 LOC còn |
| installLibraryFacade God Facade? | **Chưa** — read-only subset; cần **freeze** surface (§E) |
| E4 PASS? | **PARTIAL** — Plans/L4 replacement proven; EntitlementCatalog + facade freeze = E5/E6 |

---

## G. Bổ sung gate cho E5/E6 (từ feedback reviewer)

Các mục sau đã ghi vào [`E5-Acceptance-Criteria.md`](E5-Acceptance-Criteria.md) §9:

- Full-repo grep phân loại (Active / Comment / Legacy / Docs / Admin-only)
- Unreachable = shell + dynamic loader + `typeof window.*` + Network tab
- Runtime Bundle Audit table Before/After với Network evidence
- Facade surface freeze + forbidden grep trên `installLibraryFacade`

---

## H. Review cuối — `widgetsForPage()` provenance (Boundary)

### Câu hỏi Reviewer

> Runtime Reader cần biết Page? Nếu Placement → widgetsForPage() thì phá Boundary.

### Trả lời thẳng: **Không đọc Placement / PageSettingsStore**

```bash
rg "PageSettingsStore|PageSettingsCatalog|placement-widget|PagePublished" \
  User_Web/iflux-web-ui/readers/l4-runtime-reader.js
# → 0
```

### `widgetsForPage(pageKey)` thực sự làm gì?

**Không phải** “widget nào đang **đặt** trên layout trang X” (Placement WGS).  
**Là** “widget type nào **thuộc domain** trang X cho **entitlement / menu**” (L4 deploy metadata — legacy tên `WGT_DEPLOY` trên Admin).

Call-site duy nhất trên User Web:

```46:53:User_Web/iflux-web-ui/iflux-entitlements.js
  function hasAnyBlockOnPage(pageKey) {
    ...
    if (global.WidgetLibraryCatalog && WidgetLibraryCatalog.widgetsForPage) {
      return WidgetLibraryCatalog.widgetsForPage(pageKey).length > 0;
    }
```

Dùng trong `canAccessPage()` — guest có thể vào trang nếu trang đó có widget entitlement, kể cả khi `plan.pages[pageKey]` false.

### Nguồn dữ liệu thực tế (Runtime)

```text
_ids  ← collectIdsFromPlans(PlansRuntimeReader)
         └─ GET /api/plans/runtime → overrides.*.blocks keys (WGT-*)
         └─ Permission matrix — KHÔNG Placement

widgetDeploy(id).pages  ← _meta[id].pages
         ├─ [boot] pageForWidget(id) — regex prefix heuristic (E4 debt)
         └─ [lazy fetch] parseWidgetArtifact → perm.pages
                └─ GET /api/widgets/:id (WidgetPublished)
                └─ Backend resolvePermission() hiện KHÔNG publish field `pages`
                   → hầu hết vẫn fallback heuristic
```

| Nguồn | Dùng? | Boundary |
|-------|-------|----------|
| **PageSettingsStore** | ❌ | PASS |
| **Placement / PagePublished layout** | ❌ | PASS |
| **GET /api/placement-widget-index** | ❌ | PASS |
| **GET /api/plans/runtime** (widget IDs) | ✅ | PASS — Permission runtime |
| **GET /api/widgets/:id** (WidgetPublished) | ⚠️ intended, `pages` chưa có trong artifact | PASS boundary, **FAIL parity** |
| **Regex `pageForWidget(id)`** | ✅ boot default | **Technical debt** — copy mỏng của Admin `WGT_DEPLOY` |

### So sánh Admin (reference)

Admin `PlatformLayersWidgets.widgetsForPage()` filter trên `WGT_DEPLOY` static map (L4 authoring) — **cùng semantic** (deploy domain), **không** đọc PageSettingsStore cho API này.

### Rủi ro Boundary (Reviewer đúng khi cảnh báo)

| Rủi ro | Hiện trạng |
|--------|------------|
| Reader bắt đầu gọi Placement | ❌ Chưa xảy ra |
| Tên `widgetsForPage` gây nhầm với Placement | ⚠️ **Có** — naming debt |
| Heuristic thay Published deploy projection | ⚠️ **Có** — parity debt |

**Khuyến nghị kiến trúc (E5/E6, không implement trong E4):**

1. Đổi tên runtime API → `widgetIdsForEntitlementDomain(pageKey)` hoặc tách reader method — tránh nhầm Placement.
2. Publish `permission.deployPages[]` trong WidgetPublished (backend pipeline) → Runtime đọc artifact, bỏ regex.
3. **Không** wire `widgetsForPage` → `PlacementWidgetIndexReader` — đó là coupling sai WGS.

---

## I. Technical Debt Ticket — `WIDGET_SPECS` snapshot (cache thứ hai)

**ID:** ABH-TD-E4-001  
**Loại:** Technical Debt (không phải bug production blocking E4 PARTIAL)  
**Owner:** Runtime / ABH E6

### Vấn đề

`installLibraryFacade()` build `WIDGET_SPECS` **một lần** khi `load()`:

```102:108:User_Web/iflux-web-ui/readers/l4-runtime-reader.js
      WIDGET_SPECS: (function () {
        var out = {};
        _ids.forEach(function (id) {
          var m = _meta[id];
          if (m) out[id] = { title: m.title, description: m.description, tier: m.tier };
        });
        return out;
      })(),
```

Trong khi `_meta` là **canonical memory cache** — cập nhật sau `fetchWidgetOnce()` (lazy GET).

→ `WIDGET_SPECS` = **snapshot cố định** tại boot; `_meta` = live. **Hai cache cho cùng data.**

### Consumer

| File | Usage |
|------|-------|
| `widget-registry.js:495` | `cat.WIDGET_SPECS \|\| {}` — đọc title/tier |

Sau lazy fetch, `resolveWidgetCopy()` trả title mới từ `_meta`, nhưng `WIDGET_SPECS[id].title` có thể **stale**.

### Acceptance fix (ticket close)

- [ ] **Cấm** object snapshot `WIDGET_SPECS` frozen — chọn một:
  - **A)** `WIDGET_SPECS` → getter `function()` đọc `_meta` live; hoặc
  - **B)** xóa `WIDGET_SPECS`; consumer dùng `resolveWidgetCopy` / `entitlementMeta` only
- [ ] `installLibraryFacade()` không duplicate subset `_meta` — single source `_meta`
- [ ] Evidence: sau `fetchWidgetOnce(id)`, consumer đọc title === `_meta[id].title`
- [ ] grep `WIDGET_SPECS:` object literal snapshot → 0

**Ưu tiên:** E6 cleanup hoặc cùng PR E5 nếu chạm `widget-registry.js`.

---

## J. Gates ABH-09 / 10 / 11 (Owner approved 2026-07-27)

| Gate | Nội dung |
|------|----------|
| **ABH-09 v1.1** | Whitelist-first · không max-method KPI · cấm God Reader mega-method |
| **ABH-10** | `WidgetLibraryCatalog` = Compatibility · **Target removal E6** |
| **ABH-11** | Complexity table · abstraction ≥2 consumers |

**E5:** OPEN — không mở rộng Reader/Facade API.

Docs: [`ABH-09`](ABH-09-Reader-Facade-Freeze-Gate.md) · [`ABH-10`](ABH-10-Compatibility-Layer-Sunset.md) · [`ABH-11`](ABH-11-Net-Complexity-And-Consumer-Justification.md)

---

