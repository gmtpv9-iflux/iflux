# Audit — Header height regression sau Page Host wrap

**Task:** `180826_Admin Menu AppShell Behavior Standardization`  
**Ngày:** 18/08/2026  
**Status:** Audit only — **không fix · không đóng Task · không PASS**  
**Runtime:** https://staging.iflux.vn · commit `7ce55f9` · Chrome 1440×900  
**Authority:** BRD → SoT → Solution Rev 2 → Plan LOCK  

---

# 1. Page đúng vs Page sai

Cùng một document lifecycle (không F5 giữa chừng):

```text
F5  /admin/requests/withdrawals
 →  /admin/orders/list
 →  /admin/overview
 →  /admin/requests/withdrawals
```

| Bước | Path | Header box | Host box / scroll | Kết luận |
|---|---|---|---|---|
| F5 | `/admin/requests/withdrawals` | **64 × ~975-class** | 510 / 510 | Đúng |
| nav | `/admin/orders/list` | 64 | 552 / 552 | Đúng *trên viewport 900px* |
| nav | `/admin/overview` | **37** | 1130 / 1130 | **Sai** |
| nav | `/admin/requests/withdrawals` | **64** | 510 / 510 | Đúng lại |

F5 trực tiếp `/admin/overview` cũng **37px** — không chỉ sau internal nav.

`--ix-navbar-h` luôn `64px`. Children Header luôn ~36px (nút / search / actions).

Owner đo ~42.969px trên Page sai: cùng lớp lỗi (used height co về content min). Số 37 vs 42.969 phụ thuộc viewport / zoom / chip Header; không phải hai root cause.

**Page đúng không có Header/CSS đặc biệt.** `withdrawals.html` không có stylesheet Page. Host của nó ngắn hơn phần còn lại của `main` (`510 < 900 − 64`). Overview Host `1130 > 836` → flex overflow.

`/admin/orders/list` có thể **sai trên viewport thấp hơn** nếu Host vượt `100vh − 64`. Không phải “Page withdrawals có contract riêng”.

---

# 2. Header có cùng DOM node không?

**Có.** Cùng node, cùng parent, cùng instance id xuyên chuỗi.

```text
header.ix-navbar[data-ix-admin-shell=header]
  parent = main.ix-main     (không đổi)
  không nằm trong [data-ix-admin-page-host]
```

`window.__h === header` = true sau mọi `navigate()`.

Extract **không** chuyển Header sang Host. Hierarchy Header không bị đổi parent.

---

# 3. DOM hierarchy (đúng và sai — giống nhau)

```text
html
  body
    .ix-root
      .ix-layout          display:flex; height:100vh; overflow:hidden
        aside.ix-sidebar
        main.ix-main      display:flex; flex-direction:column;
                          height:100vh; overflow:hidden; min-height:0
          header.ix-navbar          ← AppShell, sibling
          div[data-ix-admin-page-host]   ← wrapper mới (Cụm B)
            .ix-content
            (+ node Page-owned khác nếu có)
```

Trước task, con flex của `main` là:

```text
header.ix-navbar
.ix-content          flex:1; min-height:0; overflow-y:auto
```

Sau `ensurePageHost` / swap:

```text
header.ix-navbar
[data-ix-admin-page-host]   display:block; flex: 0 1 auto; min-height:auto
  └── .ix-content           flex:1  — không còn là flex item của main
```

---

# 4. Computed style — Header

| Property | Withdrawals (đúng) | Overview (sai) |
|---|---|---|
| specified rule | `height: var(--ix-navbar-h)` | cùng rule |
| `--ix-navbar-h` | `64px` | `64px` |
| **used / box height** | **64px** | **37px** |
| `getComputedStyle(height)` | `64px` | `37px` |
| min-height | `auto` | `auto` |
| max-height | `none` | `none` |
| box-sizing | `border-box` | `border-box` |
| display | `flex` | `flex` |
| position | `sticky` | `sticky` |
| flex | `0 1 auto` | `0 1 auto` |
| **flex-shrink** | **1** | **1** |
| flex-grow | `0` | `0` |
| flex-basis | `auto` | `auto` |
| align-items | `center` | `center` |
| align-self | `auto` | `auto` |
| overflow | `visible` | `visible` |

DevTools hover rule vẫn hiện `64px` vì đó là **specified**. Box thật là **used height sau flex shrink**.

---

# 5. CSS rule / source gây co Header

Không có Page `<style>` / selector Page bắn vào `header`, `.ix-navbar`, `.ix-header`, `.ix-root`, `main`, `body`.

`dashboard.css` được `syncPageStyles` đưa vào `[data-ix-admin-page-styles]` khi vào Overview. File này **không** chọn Header. Quay lại Withdrawals: `dashboard.css` **vẫn còn** trên `<head>` nhưng Header **trở lại 64px**. Loại page CSS.

Rule vẫn là AppShell hiện hữu:

```190:201:Admin_Design_system/iflux-admin-ui/components.css
.ix-navbar {
  height: var(--ix-navbar-h);
  ...
  display: flex;
  align-items: center;
  position: sticky;
}
```

`.ix-navbar` **không** có `flex-shrink: 0`. Trước task không sao vì sibling `.ix-content` nhận `flex: 1; min-height: 0` và tự scroll.

`.ix-main`:

```98:108:Admin_Design_system/iflux-admin-ui/components.css
.ix-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100vh;
  overflow: hidden;
}
```

Cơ chế co:

```text
main = flex column, 100vh, overflow hidden
Header  = height 64, flex-shrink 1, min-height auto
Host    = block, flex 0 1 auto, min-height auto (= content)

Host content > (100vh − 64)
  → flex overflow
  → Host không co dưới content (min-height:auto)
  → Header co xuống min-content (~36–43px)
```

Đây đúng khả năng Owner nêu: `height: 64px` tồn tại trên rule, element bị flex shrink.

---

# 6. Page CSS / JS sau swap?

| Hạng | Kết quả |
|---|---|
| `<link>` / `<style>` Page vào `<head>` | Có (`syncPageStyles`) trên Overview |
| Selector Page → Header / `.ix-navbar` / `.ix-main` / `.ix-root` | **Không** |
| Header parent đổi sau swap | **Không** |
| JS Page set height Header | **Không** — box theo Host scrollHeight |
| Lifecycle Withdrawals vs Overview | Overview có `dashboard.css` + ApexCharts; không phải nguyên nhân height |

Khác biệt quyết định: **chiều cao nội dung Page Host** so với `100vh`, không phải script Page.

---

# 7. Root cause

`ensurePageHost()` + `navigate()` insert `[data-ix-admin-page-host]` giữa `main.ix-main` và `.ix-content` **mà không chuyển vai trò flex** mà `.ix-content` đang giữ khi là con trực tiếp của `main`.

Hệ quả:

1. `.ix-content { flex: 1; min-height: 0; overflow-y: auto }` không còn tham gia flex của `main`.
2. Host `display: block` lớn theo content.
3. `main` overflow hidden + Header `flex-shrink: 1` → Header bị ép khi Page cao.
4. Withdrawals “đúng” vì Host thấp, không phải vì Page đó đúng contract.

File/function:

```text
Admin_Design_system/iflux-admin-ui/iflux-admin-app-shell.js
  ensurePageHost()
  navigate() → host.textContent=''; importNode(collectPageOwned)

Admin_Design_system/iflux-admin-ui/components.css
  .ix-main / .ix-navbar / .ix-content   (contract cũ, Host chưa tham gia)
```

Phạm vi: Solution/Plan Cụm B — Page Host fetch → extract → wrap → swap. **Trong Task.**

---

# 8. Vi phạm BRD / SoT / Solution / Plan?

| Nguồn | Chữ | Đánh giá |
|---|---|---|
| BRD BR-02 / BR-05 | Header thuộc AppShell, navigation **giữ nguyên** Header | Instance giữ. **Hình học / used height không giữ** khi Page Host cao. |
| BRD AC-06 | Không unload/recreate Header | Node không recreate. **Appearance Header đổi** — không đủ AC nếu hiểu “giữ nguyên” cả layout. |
| SoT | Page Host đổi; AppShell/Header không đổi | Host đổi đúng. Header **rendered box đổi** = lệch SoT visual. |
| Solution §8–§9 | Marker Host trên vùng Page hiện hữu; **không thay toàn bộ DOM contract** | Wrapper mới **cắt** flex contract `main → .ix-content`. |
| Solution | AppShell-owned stay persistent | Persistent node, **không** persistent geometry. |
| Plan Cụm B | Host = Page-owned boundary đã chứng minh | Boundary đúng (không chỉ `.ix-content`). **Thiếu** chuyển layout role của `.ix-content` lên Host. |

Không vi phạm: Express / `PAGES` / Registry / IA / Permission Identity / D-01…D-04 (mô hình).  
Vi phạm: **implementation Host** so với “AppShell không đổi khi chỉ Page Host thay”.

Không mở architecture mới.

---

# 9. Đề xuất correction tối thiểu — **chưa implement**

Không thêm `min-height: 64px` / override Header.

**Sửa Host cho nhận đúng slot flex mà `.ix-content` từng có khi là con của `main`.**

Modify CSS AppShell hiện hữu (`components.css` hoặc file UI đã load — không file mới), ví dụ ý (chưa code):

```text
[data-ix-admin-page-host] {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

`.ix-content` bên trong Host giữ `flex: 1; min-height: 0; overflow-y: auto` → scroll nội bộ như trước task.

Không:

* `min-height: 64px` trên Header như “fix”;
* `flex-shrink: 0` trên Header **một mình** (Header đứng 64 nhưng Host vẫn `min-height: auto` → content bị `main { overflow: hidden }` cắt, mất scroll `.ix-content`);
* rewrite extract/swap;
* sửa Express / PAGES / Registry / IA;
* file / registry / router mới.

Chờ Owner mở remediation.
