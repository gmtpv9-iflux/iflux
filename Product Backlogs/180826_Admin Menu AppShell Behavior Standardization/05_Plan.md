# Implementation Plan — Admin Menu AppShell Behavior Standardization

**Task:** `180826_Admin Menu AppShell Behavior Standardization`  
**Status:** **OWNER LOCKED** — Implementation **AUTHORIZED** (Owner 18/08/2026)  
**Ngày:** 18/08/2026  
**Authority:** SoT `03_SoT.md` > BRD `01_BRD.md` > Solution Rev 2 `04_Solution_Plan.md`  
**Căn cứ:** Audit `02_Audit.md` · Owner D-01-B / D-02-A / D-03-A / D-04-A · Review `05_Review_BRD_SoT_Solution.md` (đã hấp thụ vào Solution Rev 2)

**Im lặng Owner ≠ authorization.** Plan này chỉ được thi công sau Owner LOCK.

Không sửa SoT. Không mở lại D-01…D-04. Không chọn lại S1 vs S2 — Solution §4/§11 đã khóa **S1**.

---

# 0. Mục tiêu Plan

Map Solution Rev 2 → **code hiện hữu**. Một đường boot, một đường navigation, một Menu, một Header, một Page Host.

```text
Document lần đầu = HTML Page Express đang serve
        ↓
Boot AppShell hiện có (một lần)
        ↓
Bọc Page-owned → data-ix-admin-page-host
        ↓
Mọi nav nội bộ /admin/...
        ↓
hrefFor / pathFor / matchPath / detectActiveKey / trailFor
        ↓
fetch HTML canonical hiện có
        ↓
Thay Page Host (không unload document)
```

---

# 1. Impact Analysis (bắt buộc trước code)

| Hạng | Hiện trạng (Audit) | Quyết định |
|---|---|---|
| Feature | Admin AppShell Menu/Header/nav | Persistent AppShell + Page Host |
| Current owner | `IfluxAdminAppShell` + Sidebar + Header | **Modify** — không tạo owner mới |
| Files | `iflux-admin-app-shell.js` · `iflux-admin-app-shell-sidebar.js` · `iflux-admin-app-shell-header.js` · `iflux-admin-ui.js` · `admin-rbac-client.js` · `admin-view-gate.js` | Modify |
| Functions | `getSidebarNav` · `applyDefaultFirstParentOpen` · `mapParent` · `refresh` · `render` · `location.assign` · `gateMenu` · `toggleParent` | Modify / **Delete** (default-open, assign nội bộ) |
| Consumers | 97 HTML slot · `hub.html` · RBAC · breadcrumb | Không đổi Identity |
| Storage/API | Rail `localStorage` · scroll `sessionStorage` | **Không đụng** rail |
| Express / Wave 2 | `mountAdminUi` `sendFile` | **Không đổi** |
| Decision | Reuse + Modify | Không Create AppShell/Page/Registry mới |

**Không tạo file mới** trừ khi Implementation chứng minh không sửa được file trên — Plan này **không** dự kiến file JS mới.

---

# 2. Quyết định đã khóa — Plan không được mở lại

| ID | Nội dung |
|---|---|
| D-01-B | Một AppShell instance; chỉ Page Host đổi |
| D-02-A | Collapsed = Parent Sub-menu; rail giữ |
| D-03-A | Accordion 1 parent / module — **reuse** `toggleParent` |
| D-04-A | Active ≠ auto-expand Parent |
| S1 | Document đầu = HTML hiện có; fetch HTML canonical; không empty shell |
| DOM | Giữ `data-ix-admin-shell` · `data-ix-admin-nav`; được thêm `data-ix-admin-page-host` trên vùng đã có |
| Boot | Một path: boot IIFE hiện có. Không `AppShell.mount()` thứ hai |
| Registry | Chỉ `hrefFor` `pathFor` `matchPath` `detectActiveKey` `trailFor` |
| Nav scope | Mọi internal `/admin/...` phải qua `navigate()` (Menu, breadcrumb, link Page, JS Page, popstate) |
| Nav intercept | **Khóa behavior, không khóa cách.** Cấm coi monkey-patch `location` toàn cục là cách đã chốt. Agent inspect call-site thật rồi chọn interception — không phá native browser navigation, không phá application boundary (login/logout). |
| Page Host boundary | **Khóa outcome, không khóa DOM algorithm.** Phải bao phủ toàn bộ Page-owned surface, không mặc định `.ix-content`. Agent chứng minh từ code/97 Page trước khi implement extract. |
| Page script | Chỉ execute script Page-owned của **Page mới**. Không execute lại AppShell / Registry / RBAC / Auth / global UI. Một Page transition = mỗi script Page tối đa **một** lần. |
| Login | `auth/login.html` + `IfluxAdminAuth` logout/login = **rời** AppShell |

---

# 3. Inventory sửa — file / hàm

## 3.1 Sửa (canonical)

| File | Việc |
|---|---|
| `Admin_Design_system/iflux-admin-ui/iflux-admin-app-shell.js` | Xóa `applyDefaultFirstParentOpen`. `mapParent.open` luôn false lúc map (không `childActive`). `refresh()` không remount Menu/Header trừ khi restore disclosure. Thêm `navigate()` + Page Host theo boundary **đã chứng minh** (§4.1). Một boot id trên `documentElement`. |
| `iflux-admin-app-shell-sidebar.js` | Gỡ `location.assign`. Click item → `IfluxAdminAppShell.navigate(hrefFor(routeKey))`. `render({ preserveOpen })`: snapshot `data-ix-submenu.open` theo `data-ix-route` → restore. Thêm `syncActive()` — chỉ class `active`, **không** đụng `open`. `toggleParent` **giữ** (accordion). |
| `iflux-admin-app-shell-header.js` | Boot một lần. Navigation **không** gọi `render()` trừ update state (avatar đã có). Không tạo Header thứ hai. |
| `iflux-admin-ui.js` | Bỏ `Sidebar.render()` lần 2 lúc boot (hoặc `preserveOpen`). Rail / overlay / scroll: **không đổi**. Bind dropdown/offcanvas/modal/sort: ủy quyền `document` để sống sau swap Host (modify existing, không file mới). Guard một lần (`__ixAdminUiDelegates`). |
| `admin-rbac-client.js` | `gateMenu`: không `refresh()` kiểu wipe Menu. Ẩn/hiện item trên DOM hiện có, hoặc `render({ preserveOpen: true })`. Sau swap Host: `gatePermElements` + `gateCurrentPage`. `showAccessDenied` chỉ thay Page Host, không thay Header/Menu. |
| `admin-view-gate.js` | Export `bootFromAttr`. Gọi lại sau mỗi swap Host. Không re-exec cả file. |

## 3.2 Gỡ khỏi canonical path (Solution §35)

| Behavior | Chỗ | Hành động |
|---|---|---|
| `location.assign(sotHref)` | sidebar.js ~107 | Xóa. Thay `navigate`. |
| `applyDefaultFirstParentOpen` | app-shell.js | **Xóa hàm + call.** |
| `open = childActive \|\| routeKey === active` | `mapParent` | `open: false`. Active riêng. |
| Fallback mark-active + mở parent | `iflux-admin-ui.js` §2 | Xóa hoặc dead (AppShell luôn có). Không mở parent. |

## 3.3 Internal navigation — behavior khóa, cách intercept không khóa

**Behavior bắt buộc (Solution §12–§13):**

```text
Mọi internal /admin/... navigation
    → canonical IfluxAdminAppShell.navigate()
    → không unload document
```

Gồm: Menu, breadcrumb, link trong Page, pagination / action link Admin, JS trong Page, Back/Forward.

**Application boundary — native document navigation giữ:**

```text
login / logout / hết phiên
ngoài /admin
auth/login.html
IfluxAdminAuth.loginUrl()
```

**Cách intercept: Agent phải inspect rồi chọn.** Plan **không** khóa monkey-patch `location.assign` / `location.href` / `location.replace` toàn cục.

Trước khi viết intercept, Implementation phải:

1. Liệt kê call-site thật (sidebar `assign`, `<a href>`, `location.href` trong page JS, redirect stub).
2. Với từng nhóm: chọn interception **hẹp** (đổi call-site đã biết, ủy quyền click, v.v.).
3. Chứng minh application boundary vẫn `location` native.
4. Chứng minh không phá `history.back`, reload F5, mở tab mới, `target=_blank`, download.

**Cấm coi đây là cách đã chốt:**

```text
patch Location.prototype / overwrite location.assign toàn cục
```

Nếu sau khi inspect, không có cách hẹp nào đạt behavior — **dừng, hỏi Owner**. Không tự monkey-patch.

Không tạo `PageRegistry`. Resolve target bằng `matchPath` + `hrefFor` / `pathFor`. Link tương đối resolve trên URL hiện tại rồi `matchPath`.

Call-site đã thấy (điểm xuất phát inspect, không phải danh sách đủ):

| File | Ghi chú |
|---|---|
| `iflux-admin-app-shell-sidebar.js` | `location.assign` — **gỡ**, thay `navigate` (3.2) |
| `app/orders/orders-page.js` | `/admin/don-hang/...` |
| `app/loyalty/promo-page.js` | `/admin/thanh-vien/...` |
| `app/subscription/plan-edit.html` inline | `plans.html?saved=1` |
| `app/community/content/content-edit.js` | `index.html` / `edit.html` |
| `app/community/content/article-edit-page.js` | `edit.html?id=` |
| `app/chu-de/chu-de-mapping-page.js` | `mapping.html?id=` |
| `iflux-admin-ui/admin-auth.js` | `loginUrl()` — **không** đi `navigate` |

## 3.4 Cấm đụng

```text
backend/src/app.js mountAdminUi
IfluxAdminNavRegistry IA / urlSegment
IfluxAdminRoutes PAGES / slug / identity
PAGE_PERM / Permission Identity
nginx Wave 2
97 HTML — không lột Header/Menu, không thành module
Rail localStorage / ix-sidebar-collapsed
User Web AppShell
auth/login.html
```

Được thêm **một** attribute: `data-ix-admin-page-host` trên vùng Page-owned mà Agent **đã chứng minh** từ implementation hiện hữu. Không khóa sẵn “mọi sibling của header trong `main`”. Page không bọc được → dừng, hỏi Owner.

---

# 4. Page Host — outcome khóa, algorithm không khóa (Solution §9)

## 4.1 Boundary — Agent phải chứng minh trước khi extract

Solution khóa:

```text
Page Host = toàn bộ Page-owned boundary
≠ mặc định .ix-content
```

Ở lại AppShell (không vào Host):

```text
Header
Menu / Sidebar
Rail / overlay rail
AppShell-owned runtime
```

Vào Host: mọi surface Page cần để Page chạy đúng (DOM, chrome Page, overlay/offcanvas Page, CSS/JS Page, `body` metadata Page).

**Plan không khóa** thuật toán kiểu “sibling của header trong `main` + children sau `.ix-root` trừ `#ix-overlay`”. Đó là giả định — chưa chứng minh trên 97 Page.

Trước Cụm B/D, Implementation phải:

1. Đo từ HTML/JS hiện hữu: Page-owned nằm ở đâu trên tập Page đại diện **và** các biến thể (offcanvas ngoài `main`, footer trong `main`, Studio, Page chỉ `.ix-content`, Page có `body data-*`).
2. Ghi boundary đã chọn + evidence (file / selector / vì sao AppShell-owned bị loại).
3. Chứng minh không mất surface Page; không nuốt Header/Menu/rail.
4. Mới được implement extract/replace theo boundary đó.

Không bọc được một nhóm Page → **dừng, hỏi Owner**. Không thu hẹp về `.ix-content` để “cho xong”.

Marker: `[data-ix-admin-page-host]`. Không tạo `data-ix-admin-header`.

## 4.2 Fetch Page đích — outcome

```text
GET canonical URL (credentials same-origin, follow redirect)
HTML = document Express đang serve
Extract theo boundary đã chứng minh ở 4.1 (cùng rule lần đầu và lần sau)
Replace Page Host
Đồng bộ document.title và Page-owned body metadata
Đồng bộ CSS Page-owned
```

401 / login HTML / `ix-auth-root` → **rời** AppShell (native document navigation). Không `/admin/error`.

Fetch/parse fail → Error State **trong Host**. Header/Menu sống. Không reload document để “thử lại Page”.

## 4.3 Script — invariant (bắt buộc)

Mỗi lần **một** Page transition (A → B):

```text
Chỉ execute Page-owned script của Page B
Không execute lại:
  AppShell
  Header / Menu bootstrap
  Route / Menu Registry
  RBAC
  Auth
  iflux-admin-ui.js / global UI bootstrap
```

Và:

```text
Cùng một transition A → B
  → mỗi Page-owned script của B chạy tối đa một lần
Không:
  B lần 1 + B lần 2
  A còn chạy khi đã sang B
  Cụm script B bị enqueue hai lần vì fetch + innerHTML + inject
```

Cơ chế chống double-exec do Implementation chọn (dispose runtime Page cũ trước khi init Page mới; không re-inject script đã chạy trong cùng transition). Plan **không** khóa `eval` / cache-bust / clone `<script>`.

**Verify:** A→B→C: listener/init của B không còn sau khi sang C; B không init hai lần.

## 4.4 History

```text
navigate: history.pushState
popstate: navigate(url, { history: 'none' })
Direct URL: Express HTML → boot → wrap Host (không fetch lần 2)
```

---

# 5. Cụm thi công (thứ tự bắt buộc)

Mỗi cụm xong phải verify tại chỗ. Không nhảy cụm.

### Cụm A — Menu disclosure (không Host)

1. Xóa `applyDefaultFirstParentOpen`.
2. `mapParent.open = false` (D-04).
3. Giữ `toggleParent` accordion (D-03).
4. Xóa fallback ui.js mở parent theo path.
5. `refresh` / `gateMenu`: `preserveOpen` hoặc chỉ ẩn hiện, không wipe.

**Verify A:** F5 bất kỳ `/admin/...` → mọi Parent Collapsed; Page active vẫn `active`; Expand rồi RBAC load xong Parent không tự đóng; Expand B đóng A cùng module. Rail không đổi.

### Cụm B — Page Host trên document hiện tại

1. **Trước code:** chứng minh Page-owned boundary (Plan §4.1) — không mặc định `.ix-content`, không dùng algorithm chưa chứng minh.
2. Bọc theo boundary đã chứng minh; marker `data-ix-admin-page-host`.
3. Một Host / document. Header / Menu / rail ở ngoài Host.

**Verify B:** 1 header, 1 `[data-ix-admin-nav]`, 1 Host. Evidence §4.1: Page có offcanvas/overlay/footer/`body data-*` không mất surface; rail overlay không vào Host.

### Cụm C — Navigation path duy nhất

1. Sidebar: `navigate(hrefFor)` thay `assign` (call-site đã biết — gỡ).
2. Inspect toàn bộ nhóm nav nội bộ (Plan §3.3).
3. Chọn interception **hẹp** đạt `navigate()` — **không** monkey-patch `location` toàn cục trừ khi Owner cho phép sau khi hẹp thất bại.
4. `popstate` không unload AppShell.
5. Không file NavigationController mới — hàm trên `IfluxAdminAppShell`.

**Verify C:** Click Menu không unload document (cùng boot id). URL = `pathFor`. `detectActiveKey` / `trailFor` đúng. Sidebar không còn `location.assign`. Login/logout vẫn native. F5 / tab mới / `target=_blank` không bị gãy.

### Cụm D — Fetch + swap + Page runtime

1. Fetch HTML canonical.
2. Extract / replace theo boundary §4.1 đã chứng minh.
3. Dispose runtime Page cũ **trước** init Page mới.
4. Execute **chỉ** Page-owned script của Page mới, **một lần** / transition (§4.3).
5. `bootFromAttr` / `gatePermElements` trên Host mới — không re-exec RBAC/Auth/ui.js.
6. `syncActive` — không `render()` Menu. Không `Header.render()` mỗi nav.

**Verify D:** A→B: Header/Menu cùng node; Host đổi; Page B chạy đúng một lần. A→B→C: không listener B chồng; B không init lần 2. Active đúng; Parent không tự mở.

### Cụm E — Scope nav + error + dọn

1. Chuỗi A→B→C→D→A: một boot id.
2. Back/Forward không boot lại.
3. Link trong Page + JS nav nội bộ (sau intercept đã chọn) không unload.
4. Direct URL rồi click Menu: một AppShell.
5. Error trong Host; login rời AppShell.
6. 13 redirect: để Express/nginx; sau khi tới canonical thì Host.
7. Không song song: không `assign` + `navigate` cùng target.

**Verify E:** AC-05…20 + Solution §37.

---

# 6. Mapping Solution → Plan

| Solution | Cụm |
|---|---|
| §4 §5 §11 §28 §33 S1, Express, 97 HTML | Toàn Plan — cấm shell/module/Express |
| §6 §7 một boot | Cụm B — không mount() mới |
| §8 DOM | `data-ix-admin-page-host` only |
| §9 §16 §17 Host = Page-owned (không khóa algorithm) | Cụm B + D + T-22 |
| §10 §12 §13 §14 nav | Cụm C |
| §15 lifecycle Page | Cụm D |
| §18 Header | Cụm D — không remount |
| §19 §35 refresh/RBAC | Cụm A |
| §20–23 Menu / D-02…04 | Cụm A |
| §24 Rail | Không làm |
| §25 §26 Active / BC | Cụm C + D — resolver cũ |
| §27 History | Cụm C |
| §29 Redirect | Cụm E — không Page mới |
| §30 §31 Login / Error | Cụm E |
| §32 uniqueness | Boot id + 1 Host |
| §37 Acceptance | §8 dưới |

---

# 7. Không làm

- File JS AppShell/PageHost/MenuState/Router mới.
- HTML `/admin/app-shell` hoặc Page/Route error.
- `page_id → module` / `PageRegistry`.
- Sửa `PAGES`, IA, `urlSegment`, nginx, Express page router.
- Rewrite 97 HTML lột Header/Menu.
- Default rail Collapsed.
- Accordion implementation thứ hai.
- `mountHeader` / `mountSidebar` cạnh boot IIFE.
- Giữ `location.assign` “fallback nếu fetch fail” cho nav nội bộ (Solution §31).
- Monkey-patch `location` / `Location.prototype` toàn cục như cách mặc định.
- Thuật toán extract DOM chưa chứng minh trên biến thể Page; mặc định `.ix-content`.
- Execute lại AppShell / Registry / RBAC / Auth / `iflux-admin-ui.js` khi đổi Page.
- Cho cùng một Page-owned script chạy hai lần trong một transition.
- User Web.

---

# 8. Test bắt buộc (trước khi báo xong)

| ID | Cách | PASS |
|---|---|---|
| T-01 | Mở `/admin/overview` | 1 AppShell, 1 Header, 1 Menu, 1 Host; Parent Collapsed |
| T-02 | Menu → Đơn hàng list | Cùng boot id; Host đổi; URL `pathFor`; Header/Menu cùng node |
| T-03 | A→B→C→D→A | Không instance mới |
| T-04 | F5 bất kỳ Page | Mọi Parent Collapsed |
| T-05 | Expand Parent | Mở |
| T-06 | Collapse lại | Đóng |
| T-07 | Parent đóng, vào child | Item `active`, Parent vẫn đóng |
| T-08 | Expand A rồi Expand B cùng module | A đóng, B mở |
| T-09 | Expand A → sang Page khác | A vẫn mở |
| T-10 | Back / Forward | Host đổi, AppShell không reload |
| T-11 | Gõ URL trực tiếp rồi click Menu | Express HTML → boot một lần → Host |
| T-12 | Fetch Page fail (chặn mạng Page) | Error trong Host; Header/Menu sống |
| T-13 | Link `/admin/...` **trong** Page | Không unload |
| T-14 | Hành vi JS nav nội bộ (sửa/xóa đơn — call-site thật) | vào `navigate`, không document mới; login vẫn native |
| T-15 | Sau Expand, chờ RBAC `gateMenu` | Parent không reset |
| T-16 | Breadcrumb click | `navigate` + `trailFor` |
| T-17 | Studio hash nếu vào từ Menu | Active đúng region; không registry mới |
| T-18 | Logout / hết phiên | Rời AppShell, vào login — không Host |
| T-19 | Rail hamburger | Như trước task |
| T-20 | `PAGES` / `pathFor` / perm identity | Diff không đụng |
| T-21 | A→B→C: script Page | B init đúng 1 lần; sang C không còn listener B; không AppShell/ui.js/RBAC re-exec |
| T-22 | Boundary Host | Không chỉ `.ix-content`; Page offcanvas/`body data-*`/Studio vẫn đủ surface (theo evidence §4.1) |

**Đo persistence:** `data-ix-admin-shell-boot` (hoặc tương đương) trên `documentElement` — cùng giá trị suốt T-02…T-03, T-10, T-13, T-14.

---

# 9. AC ← Test

| AC | Test |
|---|---|
| AC-01 | T-01 T-04 |
| AC-02 | T-05 T-06 |
| AC-03 T-07 | T-07 |
| AC-04 | T-08 |
| AC-05…08 | T-02 T-13 T-14 |
| AC-09 | T-02 T-16 T-17 |
| AC-10 | T-09 T-15 |
| AC-11…13 | T-01 T-03 boot id |
| AC-14…17 | T-20 + không file/route mới |
| AC-18 | T-02 T-16 T-17 T-13 T-21 T-22 |
| AC-19 | T-03 T-10 |
| AC-20 | sidebar không còn `assign`; không default-open; không fallback mở parent |

---

# 10. Definition of Done — Plan

```text
Owner LOCK Plan này
        ↓
Implementation theo cụm A → E
        ↓
T-01 … T-22 PASS
        ↓
AC-01 … AC-20 PASS
        ↓
Không file/route/identity mới
        ↓
Không song song assign + navigate
```

Implementation **NOT AUTHORIZED** cho đến Owner LOCK Plan.

---

# 11. Tóm tắt một trang

| Làm | Trên file hiện có |
|---|---|
| Default Collapsed, bỏ auto-open | `iflux-admin-app-shell.js` |
| Accordion giữ | `toggleParent` sidebar |
| Không remount Menu | `refresh` / `gateMenu` + `preserveOpen` |
| Page Host | Boundary do Agent chứng minh — không mặc định `.ix-content` |
| Nav duy nhất | `IfluxAdminAppShell.navigate` |
| Gỡ assign sidebar / default-open | sidebar + app-shell |
| JS nav Page | Behavior: vào `navigate`. Cách: inspect, không khóa patch `location` |
| Script Page | Chỉ Page mới, một lần / transition; không re-exec AppShell |
| Không đụng | Express, Registry, IA, rail, login |

**Một câu:** sửa AppShell đang có để document HTML hiện tại sống suốt nav nội bộ; Page lấy từ HTML Express đã serve — không dựng Admin app mới.
