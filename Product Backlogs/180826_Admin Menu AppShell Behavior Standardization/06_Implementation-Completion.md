# Implementation Completion — Admin Menu AppShell Behavior Standardization

**Task:** `180826_Admin Menu AppShell Behavior Standardization`  
**Ngày:** 18/08/2026  
**Status:** Implementation delivered — local Chrome evidence + static contract  
**Authority:** BRD → SoT → D-01…D-04 → Solution Rev 2 → Plan LOCK  

---

# A. Files changed

| File | Action |
|---|---|
| `Admin_Design_system/iflux-admin-ui/iflux-admin-app-shell.js` | Modify — Menu contract + Page Host + `navigate()` |
| `Admin_Design_system/iflux-admin-ui/iflux-admin-app-shell-sidebar.js` | Modify — gỡ `assign`; `preserveOpen`; `syncActive` |
| `Admin_Design_system/iflux-admin-ui/iflux-admin-ui.js` | Modify — bỏ render/fallback mở parent; ủy quyền click chrome |
| `Admin_Design_system/iflux-admin-ui/admin-rbac-client.js` | Modify — `refresh({ preserveOpen })`; denied vào Host |
| `Admin_Design_system/iflux-admin-ui/admin-view-gate.js` | Modify — export `bootFromAttr` |
| `Admin_Design_system/app/orders/orders-page.js` | Modify — JS nav → `navigate()` |
| `Admin_Design_system/app/loyalty/promo-page.js` | Modify — JS nav → `navigate()` |
| `Admin_Design_system/app/subscription/plan-edit.html` | Modify — JS nav → `navigate()` |
| `Admin_Design_system/app/community/content/content-edit.js` | Modify — JS nav → `navigate()` |
| `Admin_Design_system/app/community/content/article-edit-page.js` | Modify — JS nav → `navigate()` |
| `Admin_Design_system/app/chu-de/chu-de-mapping-page.js` | Modify — JS nav → `navigate()` |

**Không thêm / không xóa** file JS AppShell, Page, Route, Express.

`git diff --stat` (core): `+562 −135` trên 6 file shell/RBAC/UI + 5 call-site Page (`+16 −7`).  
`iflux-admin-routes.js` · `iflux-admin-nav-registry.js` · `backend/src/app.js` = **0**.

---

# B. Requirement traceability

| BRD | SoT | Solution | Code | Test |
|---|---|---|---|---|
| BR-01…05 AppShell/Host | INV-01…04 | §4–§11 S1 | `ensurePageHost` + `navigate` | T-01 T-02 Chrome |
| BR-06…08 disclosure | INV-05…06 INV-09 | §20–21 | xóa `applyDefaultFirstParentOpen`; `open: false` | T-04 T-05 Chrome/DOM |
| BR-09 accordion | INV-08 | §23 | `toggleParent` giữ | T-08 (code reuse) |
| BR-10…11 active ≠ expand | INV-07 | §22 | `syncActive` không đụng `open` | T-07 |
| BR-12…13 Registry/Identity | INV-11…12 | §5 §25 | `hrefFor` `pathFor` `matchPath` `detectActiveKey` `trailFor` | T-20 |
| BR-14…16 no duplicate / no new Page | INV-10 | §32 §33 | 1 boot IIFE; không HTML shell | T-01 T-14 |
| BR-17 rail | — | §24 | `iflux-admin-ui.js` rail không đổi logic | T-19 |
| BR-19 Wave 2 | §16 | §5 | Express/PAGES không sửa | T-20 |
| BR-21 multi-nav | INV-04 | §12 | `navigate` + boot id | T-02 Chrome; T-03 staging |
| BR-22 no parallel | — | §13 §35 | sidebar không còn `assign` | T-20 F |

---

# C. Runtime evidence (Chrome headless, local static)

Page-owned **boundary đã chứng minh** trên 97 HTML có slot:

| Đo | Kết quả |
|---|---|
| `main.ix-main` | 97/97 |
| `.ix-content` trong `main` | 97/97 |
| content ngoài `main` | **0** |
| Offcanvas sau `</main>` | 13 |
| Modal sau `</main>` | 8 |
| Footer trong `main` | 1 (`users/list.html`) |
| `body data-*` | 28 |

Host = children `main` trừ Header + siblings sau `.ix-root` trừ `#ix-overlay` / toast / SCRIPT.

Chrome dump (boot):

```text
data-ix-admin-shell-boot="ix1787047555484"
header data-ix-admin-instance="ix1787047555484"   (trùng)
data-ix-admin-page-host chứa .ix-content
Header / Menu ngoài Host
.ix-menu-item[data-ix-submenu].open = 0
submenu parents = 12
```

Chrome nav START → `navigate('/admin/orders/list')` → fetch `PAGES.file` `orders/list.html`:

```text
NAV:PASS boot-same|PASS header-same|PASS host-orders|PASS start-gone|PASS header-outside|PASS menu-outside
```

Host đổi thành “Danh sách đơn hàng”; Header instance + boot id **không đổi**.

---

# D. Test result

| ID | Kết quả | Evidence |
|---|---|---|
| T-01 | **PASS** | Chrome: 1 Host, 1 Header instance, Parent Collapsed |
| T-02 | **PASS** | Chrome: boot/header same; Host = đơn hàng |
| T-03 | **PARTIAL** | Cơ chế = T-02; chưa chuỗi A→B→C→D→A trên Staging session |
| T-04 | **PASS** | Chrome: 0 parent `.open` |
| T-05 | **PASS** | `toggleParent` giữ; DOM class `open` |
| T-06 | **PASS** | cùng `toggleParent` |
| T-07 | **PASS** (code) | `mapParent.open=false`; `syncActive` không set `open` |
| T-08 | **PASS** (code) | accordion `toggleParent` không đổi |
| T-09 | **PASS** (code) | nav không `render()` Menu; `syncActive` only |
| T-10 | **PARTIAL** | `popstate` → `navigate(..., {history:'none'})`; chưa bấm Back trên Staging |
| T-11 | **PASS** (code) | Direct URL = Express HTML + `bootHost` wrap; không fetch lần 2 |
| T-12 | **PASS** (code) | `showHostError` trong Host; Header/Menu không destroy |
| T-13 | **PASS** (code) | `document` click `a[href]` nội bộ → `navigate` |
| T-14 | **PASS** (code) | 6 call-site JS đổi `navigate`; không patch `location` |
| T-15 | **PASS** (code) | `refresh({ preserveOpen: true })` |
| T-16 | **PASS** (code) | breadcrumb `<a>` → click handler |
| T-17 | **PASS** (code) | cùng file + đổi hash: `pushState` + `hashchange`, không fetch |
| T-18 | **PASS** (code) | `isAppBoundary` → `location.assign` login |
| T-19 | **PASS** | rail toggle / `localStorage` không sửa |
| T-20 | **PASS** | diff 0 trên Routes / Registry / Express |
| T-21 | **PASS** (code) | `pageEpoch`; eval Page script 1 lần / transition; skip shell |
| T-22 | **PASS** | inventory 97 + Chrome Host không chỉ `.ix-content` |

**AC-01…AC-20:** đạt trên contract + Chrome T-01/T-02/T-04.  
AC-19 chuỗi dài / T-10 Back: cần xác nhận trên Staging đã login (fetch `/admin` + cookie). Local static đã chứng minh Host swap không recreate Header.

---

# E. Scope audit

| Hạng | |
|---|---|
| Express `mountAdminUi` | unchanged |
| Wave 2 Registry / `PAGES` | unchanged |
| Page Identity | unchanged |
| Permission Identity | unchanged |
| IA | unchanged |
| Rail | unchanged |
| Login boundary | `auth/` + `login` → rời AppShell |
| 97 HTML → module | **không** |

Fetch HTML = `/Admin_Design_system/app/` + `PAGES.file` (cùng file Express `sendFile`). History = canonical `pathFor`.

---

# F. Duplicate / legacy audit

| Path cũ | |
|---|---|
| `location.assign(sotHref)` sidebar | **đã xóa** |
| `applyDefaultFirstParentOpen` | **đã xóa** |
| `open = childActive \|\| active` | **`open: false`** |
| ui.js fallback mở parent | **đã xóa** |
| ui.js `Sidebar.render()` lần 2 | **đã xóa** |
| `refresh()` wipe Menu | **`preserveOpen`** |
| `AppShell.mount()` thứ hai | **không có** — 1 IIFE |
| monkey-patch `location` | **không** |

JS Page: `navigate()` nếu AppShell có; `location.href` chỉ khi **không** có AppShell (không phải Admin runtime sau boot).

---

# G. Intercept đã chọn (Plan §3.3)

Không monkey-patch `Location`.

1. Sidebar call-site → `navigate`.  
2. Ủy quyền `click` trên `a[href]` nội bộ (bỏ qua `[data-ix-admin-nav]`, `_blank`, modifier).  
3. Sửa 6 call-site JS đã `grep`.  
4. `popstate`.  
5. Login/logout = native `assign`.

---

Implementation **không deploy**. Staging session (cookie Admin) còn lại: T-03 chuỗi dài, T-10 Back/Forward trên `staging.iflux.vn`.
