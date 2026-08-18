# Review — BRD / SoT / Solution vs Audit

**Task:** `180826_Admin Menu AppShell Behavior Standardization`  
**Ngày:** 18/08/2026  
**Lượt này:** Review only. **Không** Implementation. **Không** code.  
**Nguồn:** [`01_BRD.md`](01_BRD.md) (amended) · [`02_Audit.md`](02_Audit.md) · [`03_SoT.md`](03_SoT.md) · [`04_Solution_Plan.md`](04_Solution_Plan.md) · Owner D-01-B / D-02-A / D-03-A / D-04-A

---

# 0. Kết luận

**Audit và BRD amended / SoT không mâu thuẫn về hiện trạng.**  
BRD + SoT mô tả **mục tiêu** đúng với GAP Audit đã đo. D-01…D-04 được đưa vào BRD/SoT/Solution **khớp** Owner LOCK.

**Solution & Plan chưa đủ, và có vài chỗ tự mâu thuẫn, để đạt BRD.**  
Nếu Implementation làm đúng từng chữ Solution mà không chốt các lỗ hổng dưới đây, các AC persistence + navigation regression **sẽ FAIL** dù Menu Collapsed có thể PASS.

Hai lỗi lớn nhất của Solution:

1. **Không neo cơ chế load Page vào hiện trạng Audit đã đo** (97 HTML document đầy đủ + `location.assign` + Express `sendFile`).
2. **Không xử lý các đường reload AppShell ngoài click Menu** — đã có trong Audit.

---

# 1. BRD / SoT vs Audit — có mâu thuẫn không?

## 1.1 Không mâu thuẫn về sự thật hiện trạng

| Audit đã đo | BRD/SoT mục tiêu | Quan hệ |
|---|---|---|
| Mỗi Page = 1 HTML; click Menu = `location.assign` → boot lại AppShell | BR-01…05, SoT §15: cấm unload document | Mục tiêu **vá** GAP. Không phủ nhận Audit. |
| Default parent = Expanded (`applyDefaultFirstParentOpen` + `mapParent.open`) | BR-07, SoT INV-05: default Collapsed | Vá GAP. |
| Parent của Page active bị ép mở | BR-10, D-04-A, SoT INV-07 | Vá GAP. |
| Accordion 1 parent / module đã có | BR-09, D-03-A: giữ accordion | Khớp hiện trạng. |
| Rail collapse độc lập, đã persist `localStorage` | BR-17, D-02-A: không đụng rail | Khớp. |
| 1 Menu JS, 1 Header JS, 97 slot HTML, 0 Page Host | BR-14/15, SoT INV-01…04 | Mục tiêu thêm Page Host trên implementation đã có. |
| Writer URL = `hrefFor` → `pathFor` — đúng Wave 2 | BR-12/19, SoT §12/§16 | Giữ. Không mở lại routing. |
| 13 file không slot = redirect | Solution §18 | Khớp số Audit. |

BRD amended **không đảo** kết luận Audit. Chỉ đổi số hiệu BR/AC và nâng D-01-B từ “chờ Owner” thành yêu cầu chính thức.

## 1.2 Lệch nhãn / quy trình — không phải lệch hiện trạng

| Điểm | Chi tiết | Mức |
|---|---|---|
| Số BR/AC | Audit map AC-01…15 theo BRD **cũ**. BRD mới = AC-01…20, BR-01 giờ là AppShell Persistent (cũ là Expand/Collapse). | Nhầm khi đọc chéo. Cần đọc Audit theo **nội dung**, không theo số. |
| DoD §27 | BRD viết: BRD Locked → Audit → D-01…D-04 → Solution. Thực tế: Audit trước → Owner D-01…D-04 → BRD amended → SoT/Solution. | Quy trình. Không ảnh hưởng kỹ thuật. |
| Audit §5 | Vẫn ghi D-01…D-04 “chưa LOCK”. Đã LOCK. Audit là snapshot. | Cập nhật Audit nếu Owner muốn SoT duy nhất. Không chặn Solution. |

**Không có điểm nào trong BRD/SoT phủ nhận số đo Audit (97 page, `location.assign`, default-open, không Page Host).**

---

# 2. Solution & Plan — chỗ làm hỏng kết quả BRD

Chỉ liệt kê lỗi khiến **không đạt AC**, không phải góp ý style.

## P-01 — Cơ chế load Page không neo vào Audit → dễ phá BR-12 / BR-16 / BR-19

**Audit:** Page = file HTML đầy đủ. Express `mountAdminUi` `sendFile` cả document. Không có “page module”.

**Solution §8:**

```text
load page module/content
```

**Solution §11 + Test 11:**

```text
Document initial load → Bootstrap AppShell → Resolve URL → Load Page vào Page Host
```

**Solution §17 + WS-08:** “97 Page phải được chuyển thành Page Content” + “migration theo canonical pattern”.

Ba hướng Implementation đều khớp chữ Solution, **hai hướng FAIL BRD**:

| Hướng | Làm gì | Hệ quả BRD |
|---|---|---|
| **S1** | Giữ 97 HTML. Lần đầu = document hiện có. Click sau = `fetch` HTML → chỉ thay Page Host. Express không đổi. | Khớp Audit + BR-16 + BR-19. |
| **S2** | Tạo 1 HTML AppShell trống, 97 page thành fragment / module. | **BR-16** (Page/Route mới cho AppShell) + dễ đụng Express (**BR-19**, Audit: không đổi page router). |
| **S3** | Registry `page_id → module` riêng. | **BR-12 / AC-15** — routing map thứ hai. |

Solution **không khóa S1**. Chữ “page module” + “initial load rồi mới load Page vào Host” + WS-08 migration **đẩy về S2/S3**.

**BRD fail nếu đi S2/S3:** AC-14, AC-15, AC-16, AC-17.

## P-02 — Markup Page Host mới vs slot Audit — rủi ro implementation thứ hai (BR-15 / BR-22 / AC-20)

**Audit slot đang dùng:**

```text
data-ix-admin-shell="sidebar" | "header"
data-ix-admin-nav
.ix-content
```

**Solution §5 ví dụ:**

```html
<div data-ix-admin-app-shell>
  <header data-ix-admin-header></header>
  <aside data-ix-admin-nav></aside>
  <main data-ix-admin-page-host></main>
</div>
```

§4.1 nói dùng `IfluxAdminAppShell` hiện có. §5 vẽ **vocabulary DOM mới**.  
§4.2 thêm `mount() / mountHeader() / mountSidebar()` trong khi Audit: Header/Menu đã boot IIFE `DOMContentLoaded`.

Nếu Implementation **thêm** mount API + markup mới **mà không gỡ** boot cũ:

```text
boot cũ (sidebar.js + header.js + ui.js)
+
AppShell.mount() mới
```

→ **BR-22 / AC-20**. AppShell/Header/Menu có thể được tạo hai lần trên cùng document.

## P-03 — Chỉ chặn click Menu → AC-05…08 / AC-19 FAIL

**Audit:** `location.assign` ở sidebar.  
**Ngoài Menu, cùng document vẫn unload AppShell:**

* `<a href="/admin/...">` trong Page (vd. Thêm đơn hàng).
* `location.href =` trong page JS (vd. xóa đơn → list).
* Breadcrumb `<a href>`.
* 13 redirect stub nếu user chạm bookmark cũ.

**Solution §6** chỉ mô tả “Menu click”.  
**BR-05:** “click một Menu/**Page**”.  
**BR-21 / AC-19:** chuỗi A→B→C→D→A không recreate AppShell.

Nếu chỉ intercept sidebar: persistence PASS khi click Menu, **FAIL** khi Admin đi trong Page. Đó vẫn là navigation trong AppShell lifecycle.

## P-04 — `refresh()` / RBAC remount Menu — Audit đã đo, Solution bỏ — AC-07 / AC-10 FAIL

**Audit 1.6:** `IfluxAdminAppShell.refresh()` (RBAC `gateMenu`) gọi `Sidebar.render()` → `innerHTML` mới → mất `open` **trong cùng document**, không cần đổi Page.

Solution WS-05/WS-06 nói “Menu mount một lần” + “giữ state” nhưng **không cấm / không quy định** `render()` sau RBAC.

Hệ quả dù D-01-B đã xong:

```text
Admin Expand Parent
→ RBAC refresh
→ Menu recreate
→ Parent về Collapsed (default)
```

**BR-03, BR-08, AC-07, AC-10 FAIL.** Rail không liên quan.

## P-05 — “Page Content” hẹp hơn Page thật — AC-18 FAIL

**Audit / HTML thực:** Page không chỉ `.ix-content`.

* Offcanvas / overlay **sau** `.ix-root` (vd. `users/list.html`).
* `<style>` / CSS riêng trong `<head>`.
* Script `/Admin_Design_system/app/**` IIFE tự `init`.
* `body data-*` (`data-orders-page`, `data-ix-view-api`).
* `iflux-admin-ui.js` bind **một lần** (dropdown, offcanvas, modal, sort) — không ủy quyền document.

Solution §9: unmount / load / mount “Current Page”.  
Không nói extract gì, script nào được chạy lại, chrome page nằm ngoài `main`.

Nếu chỉ thay `.ix-content`:

* Form/offcanvas mất.
* Script không bind lại.
* View-gate không đọc `data-ix-view-api` mới.

→ **BR-20 / AC-18** (mở sai / vỡ Page) dù AppShell còn sống.

## P-06 — Parallel “Navigation Controller” + “Menu State Manager” vs 1 implementation (BR-15 / BR-22)

**Audit:** accordion = `toggleParent` trong `iflux-admin-app-shell-sidebar.js`. Nav = `hrefFor` + `location.assign` cùng file. Active = `detectActiveKey`.

Solution §19 yêu cầu **thêm** “1 Navigation Controller” + “1 Menu State Manager” như đơn vị mới, cạnh 1 AppShell / 1 Menu.

Nếu đó là **file/object mới** mà `location.assign` và `applyDefaultFirstParentOpen` **còn sống**:

* Default Expanded cũ vẫn chạy (AC-01 FAIL).
* Click có lúc Host, có lúc reload (AC-05 / AC-20 FAIL).

Solution §19 cấm song song “nếu cả hai cùng active” nhưng **không ra lệnh xóa** `location.assign` và `applyDefaultFirstParentOpen`. BR-22 cần lệnh gỡ, không chỉ “đừng thêm bản mới”.

## P-07 — Error: cấm reload (Solution P / Test 12) vs không có contract load

Solution P: Page fail → error **trong** Page Host; **cấm** fallback `location.assign`.

Chưa có: HTML error thuộc Page Host nào, có phải Page/Route mới không (BR-16), fetch 401/login xử lý ra sao.

Rủi ro: Implementation tạo route `/admin/error` (**AC-14**) hoặc im lặng `assign` (**Test 12 / AC-05** lệch).

Login (`auth/login.html`) Audit xếp **ngoài** AppShell. Solution F không loại trừ. Bắt login vào Page Host = sai boundary.

## P-08 — Thứ tự WS vs phụ thuộc thực

```text
01 Page Host → … → 06 Menu State → 08 Migrate 97 page
```

Nếu Host **cần** page đã migrate (S2) thì bước 01–07 không verify được trên runtime thật.  
Nếu Host **fetch HTML hiện có** (S1) thì WS-08 **không cần** và dễ đụng “không sửa business Page” (BRD §2).

Thứ tự **không khóa S1**. WS-08 đứng cuối khuyến khích rewrite 97 file — phạm vi vượt “chỉ đổi runtime AppShell”.

## P-09 — Test bắt buộc thiếu case Audit đã chỉ ra

Có Test 01–12. **Thiếu**, dù AC phụ thuộc:

| Case Audit | AC bị ảnh hưởng nếu không test |
|---|---|
| Click link `/admin/...` **trong** Page, không qua Menu | AC-05…08, AC-19 |
| `refresh()` / RBAC sau khi Admin đã Expand | AC-07, AC-10 |
| Direct URL + sau đó click Menu (không boot 2 lần) | AC-05, Test 11 |
| Studio hash (`ds-studio#...`) | AC-09, AC-18 |
| Bookmark / 13 redirect stub | AC-16, AC-18 |
| `detectActiveKey` / `trailFor` — Solution chỉ nêu `hrefFor`/`pathFor` | AC-09, AC-18 |

Thiếu test → dễ ship Host “chỉ Menu” và báo PASS giả.

---

# 3. Solution khớp BRD / Audit — giữ

Không phải mọi mục đều sai.

* D-01-B / D-02-A / D-03-A / D-04-A ghi đúng, cấm đổi lúc implement.
* §7: không registry URL thứ hai — đúng Audit 1.10.
* §18: 13 redirect không biến thành AppShell — đúng.
* §15 / Solution J: state sống trong AppShell; F5 / đóng browser → Collapsed — khớp BR-07, không bịa persist `localStorage` (tránh đụng rail).
* §22: không đụng Identity / Wave 2 / IA — khớp Audit mục “không làm”.
* Accordion + Active độc lập disclosure — khớp D-03-A / D-04-A.

---

# 4. SoT vs Solution — lệch làm hỏng BRD

| SoT | Solution | Rủi ro |
|---|---|---|
| §15 cấm `location.assign` → unload | Không ghi **xóa** call-site Audit | Call-site còn → SoT FAIL |
| §12 một Registry; không Registry cho AppShell/Page | §8 “page module” | Map thứ hai |
| §14 không Page mới cho AppShell | §11 + WS-08 + Test 11 đọc như shell document trống | Page/HTML mới |
| INV-09 state không reset vì navigation | Không xử lý `Sidebar.render()` | Reset không do đổi Page |

SoT đủ chặt. Solution **lỏng hơn SoT** ở đúng chỗ Audit đã chỉ ra.

---

# 5. Việc phải chốt trên Solution trước khi mở Implementation

Không code cho đến khi Solution LOCK các điểm này. Im lặng = lặp P-01…P-04.

### S-LOCK-1 — Page load = S1 (bắt buộc nếu giữ BR-16/19)

```text
Document lần đầu = HTML Page hiện có (97 file).
AppShell boot một lần trên document đó.
Page Host = vùng content (+ chrome Page ngoài Header/Menu) trong document đó.
Navigation sau = fetch HTML canonical (hrefFor/pathFor) → thay Page Host.
Không tạo HTML AppShell trống.
Không đổi Express sendFile / Wave 2 router.
Không tạo page_id → module map.
```

### S-LOCK-2 — DOM / API

```text
Dùng slot Audit: data-ix-admin-shell, data-ix-admin-nav.
Được thêm data-ix-admin-page-host trên vùng đã có.
Không thay bộ attribute mới song song.
Không thêm mountHeader/mountSidebar nếu boot cũ vẫn chạy.
```

### S-LOCK-3 — Mọi navigation nội bộ `/admin`, không chỉ Menu

Menu · breadcrumb · link trong Page · popstate.  
`location.assign` / `location.href` trong page JS: hoặc chặn cùng controller, hoặc ghi nhận GAP (nếu Owner chấp nhận) — hiện **chưa** được Owner chấp nhận.

### S-LOCK-4 — Cấm remount Menu/Header trên cùng document

```text
Xóa applyDefaultFirstParentOpen.
mapParent.open không đọc childActive / active page.
refresh()/gateMenu không innerHTML Menu trừ khi restore đúng state Admin.
```

### S-LOCK-5 — Page Host phải mang theo phần Page không nằm trong `.ix-content`

Offcanvas, overlay (trừ overlay rail), CSS/JS Page, `body data-*`.  
Không re-exec script AppShell (`app-shell*`, `routes`, `nav-registry`, `iflux-admin-ui.js`).

### S-LOCK-6 — Xóa behavior cũ, không để song song

Gỡ `location.assign` ở sidebar.  
Gỡ default-first-open.  
Gỡ / vô hiệu fallback `iflux-admin-ui.js` §2 nếu còn đường chạy.  
Error: trong Host; 401/login = rời AppShell (ngoài `/admin` app), không phải Page mới.

---

# 6. Tóm tắt cho Owner

| Câu | Trả lời |
|---|---|
| BRD/SoT mâu thuẫn Audit? | **Không** về hiện trạng. Chỉ lệch số BR/AC và thứ tự DoD. |
| Solution đạt BRD nếu implement nguyên chữ? | **Không chắc — nhiều khả năng không.** Thiếu neo S1; dễ tạo shell/module mới; chỉ chặn Menu; bỏ `refresh()`; Page Host hẹp. |
| Mở Implementation ngay? | **Chưa.** Solution status “Owner Proposed / Implementation chưa mở” là đúng cho đến khi LOCK S-LOCK-1…6. |

Implementation **không** được mở trên `04_Solution_Plan.md` bản hiện tại nếu Owner muốn AC-05…10, AC-14…20 đạt thật, không chỉ Menu Collapsed.
