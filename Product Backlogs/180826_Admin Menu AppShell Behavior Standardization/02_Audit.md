# Audit — Admin Menu AppShell Behavior Standardization

**Task:** `180826_Admin Menu AppShell Behavior Standardization`  
**Ngày đo:** 18/08/2026  
**Nguồn:** worktree `staging` · `IfluxAdminAppShell` · `IfluxAdminAppShellSidebar` · `IfluxAdminAppShellHeader` · `IfluxAdminNavRegistry` · `IfluxAdminRoutes` · `iflux-admin-ui.js` · HTML `Admin_Design_system/app/**`  
**BRD:** [`01_BRD.md`](01_BRD.md)  
**SoT Product:** `docs/SoT — iFlux Product Architecture (V2).md` — App Shell khởi tạo một lần, Header thuộc App Shell  

**Lượt này:** Audit only. **Không** Solution. **Không** Implementation.  
**BRD:** *Owner Proposed — Audit Required* → chờ Owner xác nhận Audit trước khi mở Implementation.

---

# 0. Kết luận

Admin hiện **có một canonical Menu/Header implementation** (AppShell JS).  
Admin **không có** một AppShell instance sống xuyên suốt khi chuyển Page.

```text
Hiện trạng runtime
──────────────────
Mỗi Page = 1 HTML document đầy đủ
  ├── slot Sidebar (copy markup)
  ├── slot Header  (copy markup)
  └── Page Content

Click Menu
  → location.assign(canonical href)
  → unload document
  → load document mới
  → boot lại AppShell + Sidebar + Header
```

Đây là **MPA (multi-page HTML)**, không phải mô hình BRD:

```text
Admin AppShell (1 instance)
├── Header       ← persistent
├── Menu         ← persistent
└── Page Host    ← thay đổi
```

Hai lớp expand/collapse đang tồn tại song song. BRD nói về **lớp parent submenu**, không phải thu gọn rail.

| Lớp | Cơ chế | Default hiện tại | Persist khi đổi Page |
|---|---|---|---|
| **A. Parent submenu** (`open`) | Click tên parent → accordion trong module | **Expanded** parent đầu mỗi module + parent của Page active | **Không** — tính lại mỗi lần boot |
| **B. Sidebar rail** (`ix-sidebar-collapsed`) | Nút hamburger desktop | **Expanded** (trừ khi localStorage = `1`) | **Có** — `localStorage` |
| **C. Mobile drawer** (`ix-sidebar-open`) | Hamburger < 1200px | Đóng | **Không** |

**GAP cốt lõi (BR-03…BR-07, BR-10, AC-01…AC-07, AC-15):** Menu state bị code ép theo Page; click Menu reload cả AppShell.

**Không GAP (giữ nguyên, không đụng):** Page Identity · Permission · Canonical Route Registry · URL Architecture Wave 2 · IA order/name.

---

# 1. Trả lời 10 câu BR-15

## 1.1 Admin AppShell hiện tại nằm ở đâu

| Vai trò | File | API |
|---|---|---|
| Façade | `Admin_Design_system/iflux-admin-ui/iflux-admin-app-shell.js` | `IfluxAdminAppShell` |
| Sidebar renderer | `iflux-admin-app-shell-sidebar.js` | `IfluxAdminAppShellSidebar.render` |
| Header renderer | `iflux-admin-app-shell-header.js` | `IfluxAdminAppShellHeader.render` |
| Chrome (rail / scroll / overlay) | `iflux-admin-ui.js` | `ix-sidebar-collapsed`, scroll restore |
| Slot trên từng Page | HTML `aside.ix-sidebar` + `header.ix-navbar` | `data-ix-admin-shell` |

`IfluxAdminAppShell` là façade: resolve `hrefFor` / `activeKey` / `getSidebarNav` / `fillBreadcrumb` / `refresh`.  
**Không** có Page Host. **Không** có router client giữ document.

V2 SoT (§ App Shell, Blueprint #6): *App Shell chỉ khởi tạo một lần và được dùng chung cho toàn bộ Page.*  
Hiện trạng Admin: AppShell **boot lại trên mọi document**.

## 1.2 Header hiện tại được mount ở đâu

1. **Slot HTML** trên từng Page: `<header class="ix-navbar" data-ix-admin-shell="header">`.
2. **Renderer:** `IfluxAdminAppShellHeader.render()` lúc `DOMContentLoaded` — env chip, logout, avatar.
3. **Phần phụ:** `iflux-admin-notifications.js` `mountBell()` chèn chuông vào `.ix-nav-actions`.

Mỗi lần `location.assign`, slot Header trong document cũ bị hủy; document mới mount Header mới.

## 1.3 Menu hiện tại được mount ở đâu

1. **Slot HTML:** `<nav class="ix-menu" data-ix-admin-nav>` trong `aside.ix-sidebar`.
2. **Renderer:** `IfluxAdminAppShellSidebar.render()` → `host.innerHTML = …` từ `getSidebarNav()`.
3. **Click:** `bindSubmenu` — item → `location.assign(hrefFor(routeKey))`; parent → `toggleParent`.

## 1.4 Có bao nhiêu Menu implementation

| # | Implementation | Vai trò | Kết luận |
|---|---|---|---|
| 1 | `IfluxAdminAppShellSidebar` | Canonical runtime | **Owner duy nhất** |
| 2 | `iflux-admin-ui.js` §2 fallback | Chỉ chạy khi AppShell **chưa** nạp — mark `active` trên HTML cứng | Dead path trên Page đã migrate |
| 3 | `ds-studio.html` hash sync | Overlay `active` theo `#hash` Studio | Không phải Menu thứ 2 |
| 4 | `Admin_Design_system/files (3)/`, `patterns/` | Sidebar HTML cứng | Ngoài `/admin` runtime |

**Canonical Menu JS = 1.**  
**Slot HTML Menu = 97 Page** (copy markup, cùng renderer).  
Đây **không** phải 97 implementation — nhưng **là 97 mount point**, nên mỗi navigation tạo instance DOM mới.

## 1.5 Có Page nào đang tự render Menu/Header riêng không

| Tập | Số | Ghi chú |
|---|---|---|
| `app/**/*.html` có `data-ix-admin-shell` | **97** | Dùng slot + AppShell JS |
| `app/**/*.html` không slot | **13** | Toàn bộ là stub `location.replace` / refresh — không tự render Menu |
| `auth/login.html` | 1 | Auth card — **đúng** ngoài AppShell |
| `hub.html` | 1 | Có slot AppShell (Hướng dẫn / Checklist) |

**Không** có Page live nào tự dựng cây Menu riêng.  
`ds-studio.html` chỉ chỉnh class `active` trên Menu AppShell đã render.

## 1.6 Navigation hiện tại có reload AppShell không

**Có. Full document reload.**

Evidence — `iflux-admin-app-shell-sidebar.js`:

```text
click a.ix-menu-item[data-ix-route]
  → preventDefault
  → IfluxAdminAppShell.hrefFor(routeKey)
  → location.assign(sotHref)
```

`location.assign` = unload AppShell + load AppShell mới + load Page.  
Đúng anti-pattern BR-06. **Không** có nhánh “Update Page Host”.

Hệ quả kèm theo:

- `IfluxAdminAppShell.refresh()` (RBAC `gateMenu`) gọi lại `Sidebar.render()` + `Header.render()` → **ghi đè innerHTML Menu**, mất toggle trong cùng document.
- Scroll Menu được giữ bằng `sessionStorage` (`ix-sidebar-scroll-top`) — chỉ vị trí cuộn, không phải expand/collapse parent.

## 1.7 Menu state hiện tại được quản lý ở đâu

| State | Owner | Store | Sống qua đổi Page |
|---|---|---|---|
| Parent `open` | `getSidebarNav` + class DOM | **Không persist** | Không |
| Item `active` | `detectActiveKey()` → `routeKey === active` | URL / Page Identity | Tính lại — **đúng** |
| Rail collapsed | `iflux-admin-ui.js` | `localStorage['ix-sidebar-collapsed']` | Có |
| Mobile drawer | `iflux-admin-ui.js` | Class DOM | Không |
| Sidebar scroll | `iflux-admin-ui.js` | `sessionStorage['ix-sidebar-scroll-top']` | Có |

**Không** có store cho parent expand/collapse do Admin chọn.

## 1.8 Có hard-code expand/collapse theo Page không

**Có — hai chỗ, mỗi lần `getSidebarNav()`.**

### Ép theo Page (BR-04 FAIL)

`mapParent`:

```text
open = childActive || node.routeKey === active
```

Parent của Page đang mở **luôn Expanded**, bất kể Admin vừa Collapse.

### Ép default Expanded (BR-03 FAIL)

`applyDefaultFirstParentOpen`:

```text
Mỗi MODULE (group):
  nếu chưa có parent nào open
  → parent đầu tiên.open = true
```

Comment trong code: *“mặc định expand parent đầu tiên”*.

Parent có child (11 node):

| Module | Parent bị default-open khi không có active child |
|---|---|
| Quản lý Người dùng | Khách hàng |
| Quản lý Tin tức | Quản lý Tin tức |
| Quản lý Cộng đồng | Kiểm duyệt nội dung |
| Quản lý Thị trường | Quản lý Thực thể |
| Quản lý Sản phẩm | Sản phẩm B2C |
| Loyalty & Membership | Quản lý Loyalty |
| Quản lý Data Sources | Quản lý Market Data |
| Marketing | Thiết lập SEO |

Parent thứ 2 trong cùng module (`Cấu hình thị trường`, `Quản lý Membership`, `Quản lý RSS`) chỉ open khi Page con active, hoặc khi Admin click (rồi mất sau reload).

### Accordion cứng

`toggleParent`: mở parent A → đóng mọi parent sibling cùng module.  
Admin **không** giữ được hai parent cùng module cùng Expanded sau một click.

## 1.9 Có duplicate AppShell / Header / Menu không

**Trong một document:** 1 Sidebar + 1 Header (selector lấy phần tử đầu).  
**Trong một session nhiều Page:** N instance tuần tự (mỗi document một bộ) — vi phạm BR-10 *theo lifecycle*, không phải hai shell chồng trên một màn.

Không có `AppShell A + AppShell B` cùng lúc trên DOM.  
Có `AppShell_page1` chết → `AppShell_page2` mới sinh.

## 1.10 Navigation có tuân thủ canonical Route / Menu Registry không

**Có — writer URL đã khóa Wave 2.**

```text
click routeKey
  → hrefFor(routeKey)
  → Nav.pathFor(routeKey)   ← canonical
  → location.assign
```

`detectActiveKey` / `fillBreadcrumb` / `trailFor` đọc cùng Registry + Routes.  
Task này **không** được tạo routing architecture riêng (BR-13). Audit xác nhận writer hiện tại đã đúng — giữ.

---

# 2. Kiến trúc hiện trạng (ownership)

```text
IfluxAdminNavRegistry     dữ liệu IA (group / parent / item / urlSegment)
        ↓
IfluxAdminRoutes          hrefFor · matchPath · detectActiveKey · PAGES
        ↓
IfluxAdminAppShell        getSidebarNav · fillBreadcrumb · refresh
        ↓
IfluxAdminAppShellSidebar render Menu vào slot Page
IfluxAdminAppShellHeader  patch Header slot Page
        ↓
iflux-admin-ui.js         rail collapse · mobile drawer · scroll persist
        ↓
HTML Page (×97)           copy slot + Page Content  ← document = đơn vị navigation
```

| Thành phần | Owner hiện tại | Persistent? |
|---|---|---|
| Menu data | NavRegistry | Có (code) |
| Canonical URL | `pathFor` / `hrefFor` | Có |
| Active item | Routes `detectActiveKey` | Theo URL |
| Parent expand | `getSidebarNav` + DOM class | Không |
| Header chrome | AppShellHeader + notifications | Không (remount) |
| Page Content | từng HTML | Không (đúng BR-14) |

---

# 3. Map Acceptance Criteria — hiện trạng

| AC | Yêu cầu | Hiện trạng | Kết quả |
|---|---|---|---|
| AC-01 | Menu default Collapsed | `applyDefaultFirstParentOpen` + `mapParent.open` → Expanded | **FAIL** |
| AC-02 | Admin tự Expand/Collapse | Click parent được; accordion + reload + default-open **hủy** lựa chọn | **PARTIAL** |
| AC-03 | State không đổi chỉ vì đổi Page | `open` gắn `childActive` + default-first | **FAIL** |
| AC-04 | Click Menu không reload AppShell | `location.assign` | **FAIL** |
| AC-05 | Header không reload | Header trong document bị unload | **FAIL** |
| AC-06 | Menu không reload | `innerHTML` + document mới | **FAIL** |
| AC-07 | Chỉ Page Host đổi | Không có Page Host | **FAIL** |
| AC-08 | Active đúng Page/Route | `detectActiveKey` + `routeKey` | **PASS** |
| AC-09 | Không duplicate AppShell | 1 / document; N / session | **PARTIAL** |
| AC-10 | Không duplicate Header | 1 renderer; remount mỗi Page | **PARTIAL** |
| AC-11 | Không duplicate Menu impl | 1 canonical JS | **PASS** |
| AC-12 | Không tạo Page/Identity mới | Chưa implement | **N/A** (chưa code) |
| AC-13 | Registry vẫn nguồn duy nhất | `hrefFor` → `pathFor` | **PASS** |
| AC-14 | Tuân URL Architecture SoT | Wave 2 giữ | **PASS** |
| AC-15 | Nhiều Page liên tiếp không recreate AppShell | Mỗi click = document mới | **FAIL** |

Rail collapse (lớp B) **PASS** persist + Admin-controlled — **ngoài** AC-01 nếu AC-01 = parent submenu.

---

# 4. Inventory số

| Hạng | Số |
|---|---|
| Group IA | 21 |
| Parent có submenu (expand/collapse) | **11** |
| Item + child trên sidebar | (giữ IA task trước — không đổi lượt này) |
| HTML Page có slot AppShell | **97** |
| HTML stub không slot | **13** (redirect only) |
| Canonical Menu JS | **1** |
| Canonical Header JS | **1** |
| Page Host | **0** |
| Store parent expand | **0** |

---

# 5. Điểm chưa quyết — dừng Implementation (CG-030)

Ba điểm **không phải bug code**. Owner phải chốt trước khi có Plan.

## D-01 — AC-04…07/15 hiểu theo instance hay theo cảm giác

BRD viết *không unload AppShell*. Hiện trạng Admin là MPA: mỗi Page một HTML.

| Option | Ý | Trade-off |
|---|---|---|
| **D-01-A** | Giữ MPA. Persist parent `open` qua `sessionStorage`. Default Collapsed. Bỏ ép theo Page. Click vẫn `location.assign`. | Modify-first. AC-01…03, AC-08 đạt. AC-04…07/15 **vẫn FAIL theo chữ** (document vẫn reload). |
| **D-01-B** | Xây Page Host (SPA): 1 AppShell, chỉ đổi content. | Đúng chữ BR-05…07/10. **Capability mới.** Rủi ro ownership/routing. Dễ đụng BR-13 nếu tự tạo client router. |
| **D-01-C** | Owner amend AC: “cùng implementation, được remount; state Menu phải sống qua navigation”. | Đổi chữ BRD/AC, không đổi architecture. |

**Không đủ thông tin để chọn.** Im lặng ≠ D-01-B.

## D-02 — Default Collapsed áp dụng lớp nào

| Option | Ý |
|---|---|
| **D-02-A** | Chỉ parent submenu. Rail giữ như hiện tại (default Expanded, persist localStorage). |
| **D-02-B** | Cả parent submenu **và** rail default Collapsed. |
| **D-02-C** | Chỉ rail. Parent giữ default-first-open. |

Evidence BR-01 / BR-09 (*Quản lý Đơn hàng vẫn Expanded*) → **D-02-A** khớp chữ nhất.  
Chưa LOCK.

## D-03 — Accordion vs nhiều parent cùng mở

Hiện: 1 parent open / module.

| Option | Ý |
|---|---|
| **D-03-A** | Giữ accordion (1 parent / module). |
| **D-03-B** | Admin mở độc lập từng parent; không đóng sibling. |

BR-02 không cấm accordion. Cần Owner nếu muốn đổi.

## D-04 — Parent của Page đang xem

| Option | Ý |
|---|---|
| **D-04-A** | Không auto-open. Active item vẫn highlight dù parent Collapsed (Admin tự mở để thấy). |
| **D-04-B** | Chỉ **lần đầu** vào Page: open parent chứa active; sau đó Admin collapse thì giữ collapse khi đổi Page cùng parent. |
| **D-04-C** | Luôn open parent của Page active (hành vi cũ) — **mâu thuẫn BR-04**. |

---

# 6. Việc **không** làm ở Implementation (khi Owner mở)

- Không đổi Page Identity / `PAGES` / `urlSegment` / nginx / Express page router.
- Không đổi IA order/name.
- Không đổi `PAGE_PERM`.
- Không tạo Menu implementation thứ 2.
- Không tạo Page mới để phục vụ expand/collapse.
- Không đụng User Web App Shell.

---

# 7. Definition of Done — vị trí hiện tại

```text
Audit                         ← LƯỢT NÀY
  ↓
Owner xác nhận Audit          ← CHỜ
  ↓
Owner chốt D-01 D-02 D-03 D-04
  ↓
Implementation                ← CHƯA AUTHORIZE
  ↓
Navigation / Persistence / Expand / Duplicate / Route tests
```

Implementation **NOT AUTHORIZED** cho đến khi Owner xác nhận Audit **và** chốt D-01…D-04.

---

# 8. Tóm tắt một trang

1. **Một** Menu JS, **một** Header JS, **97** slot HTML, **0** Page Host.
2. Click Menu = **reload cả document** → AppShell/Header/Menu recreate.
3. Default parent = **Expanded** (first-of-module + parent-of-active-page).
4. Lựa chọn Expand/Collapse của Admin **không được lưu**.
5. Active route **đúng** Registry. URL Architecture **không lệch**.
6. GAP behavior ≠ GAP routing. Sửa behavior không được mở lại Wave 2 URL.
7. Chốt D-01 trước: persist state trên MPA, hay xây AppShell instance thật.
