# Solution — Product URL Architecture Standardization (Admin S1)

**Task:** `170826_Inprogress_URL Architecture Standardization`  
**Status:** **Owner Locked — Decisions** (18/08/2026)  
**Khóa:** OD-1…OD-7 · D-01 · D-03 · D-06. Reconciliation §13: **Owner ACCEPT**. D-03 **LOCK** = `system-ds-studio` + hash region.  
**Implementation:** **AUTHORIZED** — `04` §14, 6 bước tuần tự, Staging 1. Không Wave 2.
**Căn cứ Owner:** quyết định 18/08/2026. Evidence: `02` · `05` · source worktree · HTTP V5 Staging 1.

---



# 0. Governance

```text
Audit evidence → Current Solution → Open Decisions → Owner Decision → Owner Lock
```

| Tầng | Status 18/08 (sau Owner chốt) |
|---|---|
| Audit evidence | `02` · `05` · source inventory §13 · HTTP V5 |
| Current Solution | Khớp Owner Decision; wording OD-5 / D-03 chỉnh theo source |
| Open Decisions | **Đóng** trừ follow-up D-03 |
| Owner Decision | LOCK — §1 |
| Owner Lock | Decisions đã khóa. **Không** = ủy quyền Implementation |

Chuỗi đã LOCK (OD-1):

```text
Page Identity → IA / Route Registry → canonical URL (pathFor) → Application Router → file
```

---



# 0.4. Kết luận comparison (Audit — evidence)

S1 Admin **FAIL** SoT §1, §2.2 (UI), §3–§6, §8. API Admin **PASS** §2.2. User Web **OUT** khỏi wave thi công đầu.

Mục tiêu Solution (khớp `[03b_SoT_Comparison.md](03b_SoT_Comparison.md)` §5):

```text
Page Identity
    ↓
IA
    ↓
Canonical Route Registry
    ↓
URL
    ├── Nav
    ├── Breadcrumb
    └── Permission binding
```

Một edit IA phải đủ cho Nav + Breadcrumb + **URL được serve** — đây là **mục tiêu SoT** (`03` §4 §5 §8.5 §8.6), không tự gắn nhãn Owner Lock cho 04.

Legacy URL = **301 only** (đề xuất Solution). Không Page / Menu / Route / Identity mới.

---



# 1. Owner Decision — LOCK (18/08/2026)

Owner khóa trực tiếp. Không suy từ trạng thái file cũ.

| ID | Quyết định | Status |
|---|---|---|
| **OD-1** | Canonical URL thuộc IA + `pathFor()`. Nginx / HTML / permission không định nghĩa canonical Page URL. | **LOCK** |
| **OD-2** | Giữ `iflux-admin-nav-registry.js` + `iflux-admin-routes.js`. Không registry thứ ba. Không đổi shape IA nếu `group/parent/item/urlSegment` + `pathFor` đủ. | **LOCK** |
| **OD-3** | Nginx không sở hữu Page URL. Application Router resolve Page. Không xóa hết map VI ngay. Xóa `location` chỉ khi chứng minh Page-level duplicate. | **LOCK** |
| **OD-4** | Legacy Page URL: `matchPath` → pageKey → `pathFor()` → **301**. Không thêm nginx `location` từng alias nếu app đủ thông tin. Giữ nginx nếu infrastructure constraint — báo, không xóa vì nguyên tắc. | **LOCK** |
| **OD-5** | `urlSegment` có → `pathFor()` là canonical **duy nhất**. Chưa có → `PAGES.slug` = **legacy/fallback compatibility**, không phải canonical authority. Hết fallback thì bỏ dependency `hrefFor` → `slug`. | **LOCK WITH CONDITION** |
| **OD-6** | English IA = dữ liệu IA. Không mở coverage hàng loạt trước Wave 2. Khi mở: điền `urlSegment`, không router thứ hai. | **LOCK** |
| **OD-7** | Chưa mở bulk invert / gắn segment. Không làm lại Wave 1 nếu V5 chứng minh đúng kiến trúc. | **LOCK** |
| **D-01** | `pageKey` = Page Identity ổn định. Đổi URL không đổi identity. | **LOCK** |
| **D-03** | `pageKey = system-ds-studio`. 13 hash = region/state. 13 nav entry giữ, quy về cùng identity. Không xóa menu. | **LOCK** |
| **D-06** | Giữ `system-audit` sibling. Không refactor IA cho đẹp. | **LOCK** |

## 1.1. D-03 — inventory source (không gộp)

Owner nghiêng phương án 2. Agent **không** khóa, **không** sửa registry.

### Từng entry

| pageKey | Nav label | Hash / region id | Roadmap (`IfluxDsRoadmap.PAGES`) | File | Perm |
|---|---|---|---|---|---|
| `system-ds-studio` | Token nguyên thủy | `#page-primitive-tokens` | 01 Primitive Tokens · active | `system/ds-studio.html` | `interface.design_system.view` |
| `system-ds-studio-2` | Nền tảng | `#page-foundations` | 02 Foundations · active | cùng file | cùng |
| `system-ds-studio-3` | Token thiết kế | `#page-design-tokens` | 03 Design Tokens · active | cùng | cùng |
| `system-ds-studio-4` | Biểu tượng | `#page-icons` | 04 Icons · active | cùng | cùng |
| `system-ds-studio-5` | Biểu đồ | `#page-charts` | 05 Charts · active | cùng | cùng |
| `system-ds-studio-6` | Nguyên tử | `#page-atoms` | 06 Atoms · active | cùng | cùng |
| `system-ds-studio-7` | Mục | `#page-items` | 07 Items · active | cùng | cùng |
| `system-ds-studio-8` | Khối | `#page-blocks` | 08 Blocks · active | cùng | cùng |
| `system-ds-studio-9` | Thẻ | `#page-cards` | 09 Cards · active | cùng | cùng |
| `system-ds-studio-10` | Tổ hợp · badge `soon` | `#page-organisms` | 10 Organisms · planned | cùng | cùng |
| `system-ds-studio-11` | Phần bố cục · `soon` | `#page-sections` | 11 Sections · planned | cùng | cùng |
| `system-ds-studio-12` | Đối tượng nghiệp vụ · `soon` | `#page-business-objects` | 12 Business Objects · planned | cùng | cùng |
| `system-ds-studio-13` | Luồng người dùng · `soon` | `#page-user-flows` | 13 User Flows · planned | cùng | cùng |

Pathname **một**: `/admin/he-thong/ds-studio`. Khác nhau **chỉ** hash. Không `urlSegment`. `hrefFor` = `PAGES.slug` (fallback OD-5).

### Runtime / state mà hash đại diện

`ds-sot-roadmap.js`: `PAGES[]` id = `primitive-tokens` … `user-flows` — comment file: “danh sách TRANG (không chia MODULE)” = **region trong Studio**, không phải Product Page Identity.

`ds-sot.js` `parseHash` / `navigate`: `#page-{id}` → `state.page` → một hàm `render*Page()` trong **cùng** document. `hashchange` đổi region, không load HTML khác.

`ds-studio.html`: một boot, 13 catalog/studio JS; default `location.hash || '#page-primitive-tokens'`.

### Permission

`HREF_PERM`: **một** regex `/admin/he-thong/ds-studio|\/system\/ds-studio` → `interface.design_system.view`.  
`PAGE_PERM`: **không** có 13 key. Không perm khác nhau theo hash.

### Route semantics

Cùng path. Nginx `he-thong` rewrite **một** file. `matchPath` cộng điểm khi `hash === slugHash` và path chứa `ds-studio` — tách 13 `pageKey` **chỉ để** highlight menu, không phải 13 route path.

### Lifecycle / data contract

Không API / DB / file HTML riêng theo `pageKey`. Cùng session, cùng search `#ds-sot-search`, cùng panel `#ds-sot-panel`. Catalog JS = renderer region.

### Deep-link

Độc lập ở mức **anchor/state**: `/admin/he-thong/ds-studio#page-cards` mở cùng Page, region Cards. Không có pathname riêng (`/admin/he-thong/ds-studio/cards` không tồn tại trong registry).

### Active navigation

Hai lớp:

- App shell: `detectActiveKey` → `matchPath(path, hash)` → 13 `pageKey` → 13 item `active` riêng.  
- `ds-studio.html` inline: `href` chứa `ds-studio.html` **và** hash — coi là region của **cùng** Studio.

Registry **mô hình hóa** 13 Page; runtime Studio **mô hình hóa** 13 region.

### Owner Lock D-03 (18/08)

`pageKey = system-ds-studio`. Hash = region. 13 nav giữ. Implementation Step 1 = normalize identity, không xóa menu.


**Wave 1 slug / pageKey** (evidence sống — không khóa bảng §8 English còn lại):


| IA                      | URL slug          | pageKey                       |
| ----------------------- | ----------------- | ----------------------------- |
| Module Cài đặt hệ thống | `system-settings` | —                             |
| Page/Menu Quản trị viên | `administrators`  | `system-admins` (parent nav)  |
| Danh sách               | `list`            | `system-admin-list`           |
| Hồ sơ                   | `profile`         | `system-admin-profile`        |
| Vai trò                 | `roles`           | `system-admin-roles`          |
| Phân quyền              | `permissions`     | `system-admin-permissions`    |
| Login                   | `/admin/login`    | (auth, không phải PAGES item) |


Slug tên (D-04) giữ theo ví dụ SoT. **V5 đã áp** trên IA sống: group “Cài đặt hệ thống” **không** còn `urlSegment` → URL serve là 2 cấp. Path 3 cấp còn trong `PAGES.slug` = alias → dispatcher 301.

```text
Sống (sau V5):
/admin/administrators/{list|profile|roles|permissions}
/admin/login

Alias (301 → pathFor):
/admin/system-settings/administrators/{leaf}
/admin/he-thong/admin-*
/admin/system/admin-*
```

Relocation SoT §4 = **một** edit IA (đã làm V5):

```text
Bỏ urlSegment module trên group
  → /admin/administrators/permissions
pageKey        = system-admin-permissions
permission     = access.permissions.view
file           = system/admin-permissions.html
```

---



# 2. Impact Analysis (CG-005)


| Hạng            | Current owner                       | Files / functions                                   | Consumers                                 | Storage / API   | Decision                                                                                     |
| --------------- | ----------------------------------- | --------------------------------------------------- | ----------------------------------------- | --------------- | -------------------------------------------------------------------------------------------- |
| Page Identity   | `IfluxAdminRoutes.PAGES` object key | `iflux-admin-routes.js`                             | nav `routeKey`, `detectActiveKey`         | không DB        | **Reuse** key · **Modify** gộp alias                                                         |
| Canonical URL   | `pathFor` (IA) + `PAGES.slug` leftover | `iflux-admin-nav-registry.js` · `hrefFor` | menu, bookmark, docs | không DB | **Modify** `pathFor`; slug = alias đến Wave 2 |
| IA tree + nhãn  | `IfluxAdminNavRegistry.sidebar`     | `iflux-admin-nav-registry.js`                       | shell, `navTrail` trong `sources-page.js` | —               | **Reuse** tree · **Modify** thêm `urlSegment` trên group/parent/item                         |
| URL writer      | `hrefFor`                           | `iflux-admin-routes.js`                             | `iflux-admin-app-shell.js`                | —               | **Modify**: `hrefFor` = join IA segments, không đọc slug rời nếu IA có segment               |
| URL → Identity  | `matchPath`                         | cùng file                                           | `detectActiveKey`, (sẽ) perm              | —               | **Modify**: match canonical + `legacySlugs` → **một** pageKey                                |
| Permission bind | `HREF_PERM` regex                   | `admin-rbac-client.js` · `canShowHref`              | sidebar ẩn/hiện, 4 trang gov              | catalog key giữ | **Modify**: `permForPage(pageKey)`; `permForHref` = matchPath rồi permForPage                |
| Breadcrumb      | 83 HTML hardcode; 11 `#adm-page-bc` | HTML · `sources-page.js` `navTrail`                 | trang Admin                               | —               | **Modify**: đưa `trailFor` lên NavRegistry; xóa hardcode in-scope; `sources-page.js` gọi lại |
| File vật lý     | `PAGES[pageKey].file` | `Admin_Design_system/app/…` | dispatcher `sendFile` | — | **Reuse** path file — không đổi tên khi relocate |
| Serve URL IA    | nginx `location =` từng leaf (Wave 1 cũ) | `app.js` `mountAdminUi` · nginx `@admin_ia` | 4 trang Administrators + URL IA mới | — | **Modify** `createApp` đã có + **một** fallback nginx |
| API JSON        | `backend/src/app.js` `/api/admin/…` | không đổi vì URL UI | 4 trang + toàn Admin | — | **Reuse** |
| Legacy URL      | nginx EN→VI + alias keys | nginx · `PAGES` · dispatcher 301 | bookmark | — | **Modify**: URL cũ → `pathFor`; key alias `legacy: true` |
| Dead HTML       | 21 file ngoài `PAGES`               | `app/**`                                            | gần như không                             | —               | **Delete** khi chứng minh không còn link (Wave 2)                                            |
| User Web locale | `seo-url.js` · boot                 | —                                                   | public SEO                                | —               | **Không đụng** (OUT)                                                                         |


**Không tạo:** Route Registry file mới · Breadcrumb engine mới · Permission engine mới · Admin app song song · pageId schema mới.

---



# 3. Vì sao không file mới


| Việc                         | Existing                                                | Why cannot modify?             | New file? |
| ---------------------------- | ------------------------------------------------------- | ------------------------------ | --------- |
| Registry Identity + IA + URL | `iflux-admin-routes.js` + `iflux-admin-nav-registry.js` | **Modify được**                | Không     |
| Breadcrumb từ IA             | `navTrail` đã có trong `sources-page.js`                | Kéo lên NavRegistry (owner IA) | Không     |
| Perm theo Identity           | `permForHref` / `HREF_PERM`                             | Đổi bảng + 1 hop `matchPath`   | Không     |
| Serve URL mới                | `app.js` + nginx snippet                                | Dispatcher đọc registry đã có; nginx một fallback | Không     |
| Login EN                     | nginx `/admin/login` → dang-nhap                        | Đảo chiều                      | Không     |


---



# 4. Architecture — một nguồn cập nhật



## 4.1. Ai sở hữu gì

```text
NavRegistry (IA)
  group.urlSegment + label
  parent.urlSegment + label
  item.routeKey + label + urlSegment
        ↓
Routes.hrefFor(pageKey)
  walk IA tới item có routeKey
  join /admin + segments (bỏ segment trống)
        ↓
URL
        ↓
matchPath (pathFor + slug + legacy)
        ↓
cùng pageKey
        ↓
Dispatcher serve PAGES.file / 301 pathFor
```

`PAGES[pageKey]` giữ: `key` (identity), `file` (implementation), `legacySlugs[]` (alias match).  
**OD-5:** `PAGES.slug` không phải canonical authority. Có `urlSegment` → `pathFor()` duy nhất. Chưa có → `slug` chỉ fallback/legacy. Một hàm `hrefFor`, hai nhánh **vai trò khác nhau**, không hai canonical.

Khi Wave 2 gắn `urlSegment` hết cây: xóa nhánh `slug` cũ.

## 4.2. Relocation = một thao tác IA

Muốn SoT §4:

1. Trong `sidebar`, **di chuyển node** `system-admin-permissions` ra khỏi parent `system-admins` (hoặc đổi parent / bỏ module segment).
2. Không đổi `routeKey` / `pageKey` / permission key / file.

Hệ quả bắt buộc (cùng `hrefFor` + `trailFor` + `matchPath`):

- URL mới
- Nav vị trí mới
- Breadcrumb mới
- Permission giữ
- Không thêm Page / Menu / Route

**Cơ chế Solution đề xuất** (Owner đã đồng ý hướng — OD-G1; chưa Lock 04):

```text
Sửa IA một lần (NavRegistry: urlSegment / vị trí node)
        ↓
pathFor / trailFor / hrefFor     → Nav + Breadcrumb + URL canonical
        ↓
matchPath(pathFor + slug + legacy) → cùng pageKey
        ↓
Dispatcher (Express, registry JS đã có)
  URL ≠ pathFor  → 301 canonical
  URL  = pathFor → serve PAGES[pageKey].file
        ↓
Nginx: path không có regex module sẵn → @admin_ia → :3002
        (không thêm location theo từng URL mới)
```

Một lần sửa IA **không** sửa: `PAGES` slug, permission key, file HTML, nginx map.

`PAGES.file` = implementation, ổn định khi relocate. `PAGES.slug` = alias cũ cho đến khi xóa nhánh (Wave 2).

**V5 (SoT §4 ví dụ):** xóa `urlSegment` module trên group “Cài đặt hệ thống”.

```text
Trước: /admin/system-settings/administrators/permissions
Sau:   /admin/administrators/permissions
pageKey = system-admin-permissions
```



## 4.3. Permission

```text
pageKey → access.*.view   (bảng mới thay HREF_PERM)
href    → matchPath → pageKey → perm
```

`canShowHref` trong app-shell: giữ chữ ký; bên trong đổi sang hop trên. Không API perm mới.

Hồ sơ: không có `HREF_PERM` hôm nay (mọi admin đã login). **Giữ** — không bịa perm.

## 4.4. Breadcrumb

`IfluxAdminNavRegistry.trailFor(pageKey)` = logic `navTrail` hiện có (Admin + group + parent + item).

Trang in-scope: xóa HTML hardcode, để `#adm-page-bc`, shell hoặc page kit gọi `trailFor`.

`sources-page.js`: xóa `navTrail` local, gọi registry.

Crumb “Admin” trỏ `hrefFor('dashboard-index')` hoặc hub — **một** href từ registry, không hardcode `/Admin_Design_system/hub.html` ở trang mới. Hub kit giữ URL file (ngoài `/admin` IA) cho đến Wave 2.

## 4.5. Alias / legacy


| Cũ                                                          | Xử lý                                                                             |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/admin/he-thong/admin-list` (và roles/permissions/profile) | Dispatcher 301 → `pathFor` (sau V5: `/admin/administrators/{leaf}`) |
| `/admin/system-settings/administrators/{leaf}` | Dispatcher 301 → `pathFor` (slug `PAGES` cũ) |
| `/admin/system/admin-list` | Dispatcher 301 → cùng canonical |
| `system-admin-users`, `system-roles`                        | `legacy: true`, `key` trỏ identity canonical; `hrefFor` không trả key này cho nav |
| `/admin/dang-nhap`                                          | 301 → `/admin/login`                                                              |
| File chết `admin-users.html`, `roles.html`                  | không serve; Wave 2 xóa                                                           |


Không tạo menu “Quản trị viên (old)”.

---



# 5. Waves



## Wave 1 — chứng minh SoT trên primary scope

In scope:

- D-01…D-06 như §1 (nếu Owner khóa)
- 4 trang Quản trị viên + login
- `hrefFor` / `matchPath` / `permForPage` / `trailFor` trên **file hiện có**
- Nginx: **xóa** location theo từng leaf Administrators; thêm fallback `@admin_ia` một lần
- `matchPath` nhận `pathFor` — URL mới không cần sửa `PAGES.slug`
- HTML 4 trang: `#adm-page-bc` + `trailFor`
- V5: một edit IA (bỏ `urlSegment` module) → URL `/admin/administrators/{leaf}`

Out Wave 1:

- Đổi URL English các module Admin còn lại
- Xóa 21 HTML chết
- User Web locale EN

Wave 1 + dispatcher: **đạt SoT §4 / §5 / §8.5 / §8.6 trên 4 trang Quản trị viên** (V5). **Chưa** đạt §2.2 toàn Admin.

## Wave 2 — phủ English phần còn lại

**Đề xuất Solution:** chưa mở invert module hàng loạt. Chờ Owner chốt **OD-7**. Không làm lại Wave 1 (OD-G4 = phạm vi xử lý, không = phê duyệt 04).

---



# 6. SOL map → finding


| SOL        | Việc                                           | Finding / SoT             |
| ---------- | ---------------------------------------------- | ------------------------- |
| SOL-ID     | D-01: pageKey = Identity; gộp alias            | F-04, F-10 · §3 §6        |
| SOL-IA     | `urlSegment` trên NavRegistry                  | F-02, F-07 · §1           |
| SOL-HREF   | `hrefFor` join IA                              | F-06, F-08, F-11 · §5     |
| SOL-MATCH  | `matchPath` → một pageKey (canonical + legacy) | F-05, F-06 · §5           |
| SOL-PERM   | `permForPage`                                  | F-05 · §3                 |
| SOL-BC     | `trailFor` + xóa hardcode in-scope             | F-09 · §4                 |
| SOL-URL1   | Slug EN 3 cấp Wave 1 + login                   | F-01, F-03, F-13 · §2.2   |
| SOL-NGX    | Fallback `@admin_ia` — không map từng URL mới  | F-15, §5 §8.6             |
| SOL-LEGACY | 301 VI; key `legacy`                           | F-10, F-12 · §6           |
| SOL-W2     | Phần Admin còn lại                             | F-01 toàn cục, F-09, F-12 |


---



# 7. Nginx (modify snippet — một lần)

Login + `/admin/tong-quan` + regex module VI / EN→VI **giữ** (Wave 2 chưa invert).

**Một lần:** `location /admin/` → `try_files` → `@admin_ia` → `:3002`. Path IA mới không có regex sẵn đi vào dispatcher.

Không thêm `location` khi dời Page. Không rsync. Không SSH Production. Root = Staging 1.

---



# 8. Bảng slug Wave 2 — đề xuất, chưa khóa

Dùng khi Owner chọn D-02 = một wave, hoặc khi mở Wave 2. Nguồn: đảo `VI_DIR` + alias nginx **đã có**. Không đặt tên mới nếu đã có English alias.


| Segment VI hiện tại | Segment EN đề xuất          | Ghi chú                                                                                                            |
| ------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `he-thong`          | `system-settings`           | Khớp SoT. **G-06:** group “Quản lý giao diện” vẫn cùng module URL hôm nay — tách `interface` hay giữ chung = Owner |
| `thi-truong`        | `market`                    | alias nginx đã có                                                                                                  |
| `khach-hang`        | `users`                     | alias đã có                                                                                                        |
| `van-hanh-du-lieu`  | `market-ops`                | alias đã có                                                                                                        |
| `du-lieu`           | `data`                      | alias đã có                                                                                                        |
| `goi-cuoc`          | `subscription`              | alias đã có                                                                                                        |
| `don-hang`          | `orders`                    | alias đã có                                                                                                        |
| `thanh-vien`        | `loyalty`                   | alias đã có                                                                                                        |
| `thong-bao`         | `notifications`             | alias đã có                                                                                                        |
| `tham-so`           | `metadata`                  | alias đã có                                                                                                        |
| `tiep-thi`          | `marketing`                 | alias đã có                                                                                                        |
| `cong-dong`         | `community`                 | alias đã có                                                                                                        |
| `phan-tich`         | `analytics`                 | alias đã có                                                                                                        |
| `yeu-cau`           | `requests`                  | alias đã có                                                                                                        |
| `trung-tam-ai`      | `ai`                        | alias đã có                                                                                                        |
| `chu-de`            | `topics` hoặc giữ `chu-de`? | **Chưa khóa** — SoT đòi EN; không có alias sạch. Owner chọn                                                        |
| `cau-chuyen`        | `stories`                   | nginx đã 301 `story` → `chu-de`; cần Owner                                                                         |
| `tong-quan`         | `dashboard`                 | alias đã có                                                                                                        |
| `dang-nhap`         | `login`                     | Wave 1                                                                                                             |


Parent 3 cấp chỉ khi sidebar có `parent`. Wave 1 parent duy nhất khóa: `administrators`.

---



# 9. Ngoài phạm vi

- Redesign Admin / DS / `.ix-*`
- Đổi API path
- Đổi permission **tên khóa** / matrix
- Đổi Database Identity
- User Web locale EN (F-14 / G-04)
- Production deploy / Production Gate
- Staging 2
- Tạo URL SoT riêng cho Admin

---



# 10. Verification (sau Implementation — không chạy từ Solution)

Wave 1 tối thiểu:


| #   | Thao tác                                                         | Kỳ vọng                                                              |
| --- | ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| V1  | Mở 4 URL EN                                                      | 200, đúng file, đúng pageKey                                         |
| V2  | Mở 4 URL VI cũ                                                   | 301 → EN                                                             |
| V3  | `/admin/system/admin-list`                                       | 301 → EN list, **không** về VI                                       |
| V4  | `/admin/login` 200; `/admin/dang-nhap` 301                       |                                                                      |
| V5  | Một edit IA: bỏ `urlSegment` module (group Cài đặt hệ thống) | Nav + BC + URL → `/admin/administrators/permissions`; cùng `pageKey`; **không** sửa nginx / `PAGES.file` / perm |
| V6  | Refresh / deep link / back                                       | không 404 in-scope                                                   |
| V7  | Sidebar ẩn theo perm (trừ profile)                               | cùng khóa `access.*`                                                 |
| V8  | API `/api/admin/access`                                          | không đổi                                                            |


---



# 11. Covered vs BRD / SoT


| Hạng                           | Covered trong Solution?                             | Đạt khi                                |
| ------------------------------ | --------------------------------------------------- | -------------------------------------- |
| BR-01 / SoT §1                 | Có — IA join                                        | Wave 1 trên 4 trang                    |
| BR-02 Admin EN                 | Có                                                  | Wave 1 in-scope; Wave 2 toàn Admin     |
| BR-03 Identity ≠ URL           | D-01 **LOCK**                                       | `pageKey` ổn định                      |
| BR-04…06 relocation / resolve  | **Có** — dispatcher + `matchPath(pathFor)` | V5 |
| BR-07 một registry             | Một phần — `hrefFor` hai nhánh (`pathFor` / `slug` ngoài 4 trang) | Wave 2 xóa slug |
| BR-08…09 nav/BC                | Một phần — 4 trang runtime BC | Wave 2 |
| BR-10…14 no clone / legacy 301 | Một phần — 4 trang + login | Wave 2 |
| BR-15 locale User              | Không thi công | Task riêng |
| BR-16 một chỗ cập nhật         | **Có** — một edit NavRegistry | V5 |
| AC-03 toàn Admin               | OD-6 / OD-7 **LOCK** — chưa mở coverage | Khi Owner mở Wave 2 |


---



# 12. Trạng thái tài liệu

| Tài liệu | Status |
|---|---|
| `01` BRD | File đang ghi Locked — không ủy quyền Implementation từ header cũ |
| `02` / `05` | Audit evidence |
| `03` SoT | Locked độc lập — không khóa cùng 04 trước đây; rule SoT giữ |
| `03b` | Comparison |
| `04` Solution | **Owner Locked — Decisions** 18/08. §13 ACCEPT trừ D-03. Implementation **chưa** ủy quyền. Plan §14 |
| `06` | Ghi nhận OD-G2 / OD-6 / OD-7 |
| Implementation | Evidence V5 ≠ lệnh code mới |


# 13. Solution Reconciliation (18/08/2026) — không implement

Đối chiếu: Owner Decision ↔ Solution (file này) ↔ source worktree. Số liệu chạy `vm` load hai registry.

## 13.1. Bảng

| Owner Decision | Solution hiện tại | Source evidence | Có mâu thuẫn? | Cần sửa gì? |
|---|---|---|---|---|
| **OD-1** Canonical = IA + `pathFor` | §0 §4.2 | `pathFor()` chỉ đọc `sidebar` + `urlSegment`. Menu/shell dùng `hrefFor` → `pathFor` trước. | **Solution ≠ Source (một phần)** | `hub.html` đọc `PAGES.slug` trực tiếp. `trailFor` hardcode `/admin/tong-quan`. `HREF_PERM` 87 regex URL. Express: `pathFor \|\| hrefFor` — khi không có segment, redirect target = `slug`. Không tự sửa; xem impact. |
| **OD-2** Hai file registry, không shape mới | §3 §4.1 | Chỉ hai file. `pathFor` xử lý group/parent/item. Shape đủ cho Wave 1. Toàn IA: 94/98 item **không** có `urlSegment` — không phải shape thiếu, là dữ liệu (OD-6). | **Không** (boundary). Cạnh: `VI_DIR`/`fileFromAdminPath` trong routes = resolve phụ cho `matchPath`, không phải registry thứ ba. `HREF_PERM` = perm map theo URL. | Không tạo file. Báo: hai cạnh URL. Không đoán xóa. |
| **OD-3** Nginx không sở hữu Page URL; không xóa hết VI | §7 | Prefix `/admin/` → `@admin_ia` → `:3002`. Regex VI **rewrite file** thắng prefix → **bypass Express** cho hầu hết menu. Regex EN→VI **301** (vd. `subscription`→`goi-cuoc`) cũng bypass. Exact: `login`, `tong-quan`. | **Solution ≠ Source (migration)** | Nginx vẫn Page-level serve/301 cho URL không có `urlSegment`. Đúng OD-3 “không xóa ngay”. Không xóa trong scope này. |
| **OD-4** Legacy 301 ở app: matchPath → pathFor | §4.2 §4.5 | `mountAdminUi`: 301 + giữ query. Target = `pathFor` nếu có. Wave 1 S1: `system-settings/…` và `he-thong/admin-*` → `/admin/administrators/…` (`Express`). | **Không** trên Wave 1. **Có** ngoài Wave 1: nginx EN→VI 301, không qua app. | Giữ nginx EN→VI (constraint + OD-7). Không thêm `location` alias mới. |
| **OD-5** slug = fallback, không canonical | §4.1 (đã sửa wording) | Inventory §13.2. `hrefFor`: `pathFor` rồi mới `slug`. 4 page có segment: `hrefFor===pathFor`, **`slug` ≠ `pathFor`**. 108 identity: `hrefFor===slug`. | **Không** với wording đã sửa. Field `slug` của 4 page Wave 1 vẫn **giữ URL 3 cấp** (đóng vai legacy trong `matchPath`, tên field gây nhầm). | Sau ủy quyền Implementation: chuyển 4 `slug` 3 cấp vào `legacySlugs` (không đổi behavior). **Chưa làm.** |
| **OD-6** English = IA data; chưa Wave 2 | §5 §8 | `urlSegment` EN: 4 item + 1 parent. 0 group. 94 item không segment → href VI. | **Không** | Không implement coverage. |
| **OD-7** Chưa bulk; không làm lại Wave 1 | §5 | Wave 1 = 4 Administrators + login. V5: group không còn `system-settings`; URL 2 cấp 200; 3 cấp 301. | **Không** | Không rewrite Wave 1. |
| **D-01** pageKey = identity | §1 | `PAGES[].key` = 111 identity / 116 object key. 5 alias trỏ identity. `matchPath` trả `value.key`. `PAGE_PERM` 3 key (không profile — giữ). | **Không** trên in-scope | Không đổi pageKey. |
| **D-03** | §1.1 inventory | 13 key registry / 1 file / 1 path / 1 perm / hash state | Evidence → **1 identity + 13 region**. Chưa Owner Lock | Không gộp cho đến Owner khóa |
| **D-06** audit sibling | §1 | `system-audit` item sau parent Quản trị viên, cùng group “Cài đặt hệ thống”. BRD/SoT không đòi parent-child. | **Không** | Không đổi IA. |

## 13.2. Inventory `PAGES.slug` (source, không suy)

| Số | Hạng |
|---|---|
| 116 | Object key trong `PAGES` — **mỗi key có field `slug`** |
| 111 | Distinct `pageKey` (`value.key`) |
| 5 | Alias key ≠ identity: `market-price-data`, `data-sources-legacy`, `system-core-setup`, `system-roles`, `system-admin-users` |
| 4 | Có `legacySlugs[]` (đúng 4 trang Wave 1) |
| 4 | Có `pathFor` (cùng 4 trang; parent `administrators` không phải page identity riêng cho leaf) |
| 108 | Identity không `pathFor` → `hrefFor` **===** `slug` (fallback) |
| 4 | `pathFor` ≠ `slug` (conflict field; `hrefFor` theo `pathFor` — đúng OD-5) |
| 98 | Nav item; **4** có `urlSegment`; **1** parent có `urlSegment`; **0** group có `urlSegment` |
| 5 | `PAGES` không `file` (5 Hướng dẫn — path `/Admin_Design_system/…`) |

**Chỗ đọc/ghi `PAGES.slug`:**

| File | Vai trò |
|---|---|
| `iflux-admin-routes.js` `hrefFor` | Fallback khi `pathFor` null; alias scan `PAGES[k].slug` |
| `iflux-admin-routes.js` `matchPath` | Candidate cùng `legacySlugs` + `pathFor` |
| `backend/src/app.js` `mountAdminUi` | Canonical = `pathFor` **hoặc** `hrefFor` (= slug nếu không segment) |
| `Admin_Design_system/hub.html` | **Bỏ qua `hrefFor`** — `return p.slug` (Hướng dẫn) |
| App shell / sidebar / `admin-governance.js` | `hrefFor` — không đọc `slug` trực tiếp |
| `page-settings-page.js` `p.slug` | Catalog page-settings, **không** phải `PAGES.slug` |

**4 conflict (Wave 1) — field `slug` còn 3 cấp, canonical sống là 2 cấp:**

```text
pageKey                      slug (field)                                      pathFor / hrefFor
system-admin-list            /admin/system-settings/administrators/list        /admin/administrators/list
system-admin-profile         /admin/system-settings/administrators/profile     /admin/administrators/profile
system-admin-roles           /admin/system-settings/administrators/roles       /admin/administrators/roles
system-admin-permissions     /admin/system-settings/administrators/permissions /admin/administrators/permissions
```

`legacySlugs` của 4 page còn chứa chính path 2 cấp (lúc 3 cấp từng là canonical). `matchPath` vẫn đúng; `hrefFor` không dùng field `slug` cho 4 page này.

## 13.3. Wave 1 / V5 đã chứng minh

| Page | pageKey | file | perm | Canonical sống | 301 về canonical |
|---|---|---|---|---|---|
| Danh sách | `system-admin-list` | `system/admin-list.html` | `access.admin_accounts.view` | `/admin/administrators/list` | `he-thong` / `system` / `system-settings/…` |
| Hồ sơ | `system-admin-profile` | `system/admin-profile.html` | không `PAGE_PERM` (giữ) | `/admin/administrators/profile` | cùng pattern |
| Vai trò | `system-admin-roles` | `system/admin-roles.html` | `access.roles.view` | `/admin/administrators/roles` | cùng pattern |
| Phân quyền | `system-admin-permissions` | `system/admin-permissions.html` | `access.permissions.view` | `/admin/administrators/permissions` | cùng pattern |
| Login | (không PAGES) | `auth/login.html` | — | `/admin/login` | `/admin/dang-nhap` (nginx exact) |

Login + `/admin/tong-quan`: nginx exact — **không** qua Express. Infrastructure / entry. Báo theo OD-3/OD-4; không xóa trong reconciliation.

## 13.4. Owner ACCEPT §13 (18/08) — trừ D-03

Owner chấp nhận reconciliation. Các điểm sau = **migration impact**, không mở lại architecture:

- `hub.html` đọc `PAGES.slug`
- `trailFor` hardcode `/admin/tong-quan`
- `HREF_PERM` 87 regex
- nginx regex VI serve; một số EN→VI 301
- 94 item chưa `urlSegment`

`PAGES.slug` giữ OD-5: có `urlSegment` → `pathFor` canonical; không → `slug` legacy/fallback. Không biến `slug` thành authority thứ hai.

Nginx: phân biệt **legacy compatibility** vs **Page URL ownership**. Không biến nginx thành URL registry vì còn legacy route. Không xóa regex VI/EN→VI trong lượt này (Wave 2 chưa mở).

`HREF_PERM`: không xóa 87 regex chỉ vì đã có `matchPath` → `permForPage`. Khi Implementation: inventory + migrate có kiểm chứng; còn consumer thì xử lý trước khi xóa.

---



# 14. Implementation Plan — **AUTHORIZED** (18/08/2026)

Một lượt, 6 bước tuần tự. Verify mỗi bước trước khi sang bước sau. **Không** dừng xin Owner giữa bước. Ngoài Solution → STOP, báo Owner. **Không** Wave 2. **Không** làm lại Wave 1.

**Step 1 = Identity normalization, không phải xóa navigation.**

```text
13 nav entries → 1 Page Identity system-ds-studio → 13 hash regions
KHÔNG: 13 nav entries → xóa còn 1 menu
```

### Bước 2 — OD-5 hygiene Wave 1 `slug`

- **Làm:** 4 field `slug` 3 cấp → `legacySlugs`. Không đổi `pathFor` / file / perm.
- **Output:** `PAGES[wave1].slug` không còn đóng vai URL 3 cấp; `hrefFor` vẫn `pathFor`.
- **Tự kiểm:** HTTP V1–V5 như §10 (200 2 cấp; 301 từ 3 cấp / `he-thong` / `system`).

### Bước 3 — Writer URL còn lệch

- **Làm:** `hub.html` dùng `hrefFor` (không `p.slug` trực tiếp). `trailFor` crumb Admin = `hrefFor('dashboard-index')`.
- **Output:** không còn 2 chỗ tự ghép canonical.
- **Tự kiểm:** hub 5 link Hướng dẫn không vỡ; crumb Admin trên 4 trang Wave 1 trỏ `/admin/tong-quan` (fallback slug dashboard) hoặc `pathFor` nếu sau này có segment.

### Bước 4 — `HREF_PERM` inventory → migrate có kiểm chứng

- **Làm:** bảng consumer `permForHref` / `canShowHref`. Với URL đã `matchPath` + `PAGE_PERM`: chuyển sang `permForPage`. **Không** xóa regex còn consumer hoặc ngoài `PAGE_PERM`.
- **Output:** inventory (số regex còn / đã chuyển / lý do giữ). Wave 1: 3 key đã có `PAGE_PERM` (profile giữ không perm).
- **Tự kiểm:** sidebar ẩn/hiện 4 trang Administrators như V7; một trang ngoài Wave 1 (vd. entitlements) vẫn đúng perm — không regress.

### Bước 5 — Phân loại nginx (ghi nhận, không xóa Wave 2)

- **Làm:** gắn nhãn từng `location /admin`: infra (`login`, static) · legacy compatibility (VI serve, EN→VI) · leftover Page ownership (không thêm mới).
- **Không làm:** xóa regex VI / EN→VI.
- **Output:** bảng trong commit/docs cùng lượt (ngắn, trong `04` hoặc comment snippet).
- **Tự kiểm:** `/admin/he-thong/sla` + `/admin/goi-cuoc/entitlements` 200; Wave 1 301/200 giữ.

### Bước 6 — Verify đóng lượt

- **Làm:** chạy lại §10 V1–V8 trên Staging 1 sau deploy CI.
- **Output:** bảng HTTP (code + Location).
- **Tự kiểm:** đủ 8 hàng PASS. FAIL → không tuyên bố xong; sửa đúng chỗ hỏng (modify-first).

**Ngoài lượt:** Wave 2 `urlSegment` / invert module · xóa `HREF_PERM` hàng loạt · xóa nginx VI · User Web.

---

# 15. Implementation record (lượt AUTHORIZED)

## Step 4 — HREF_PERM inventory

| Hạng | Số | Việc lượt này |
|---|---|---|
| Regex `HREF_PERM` | 88 | **Giữ hết** — còn consumer ngoài `PAGE_PERM` |
| `PAGE_PERM` keys | 4 | list / roles / permissions / **+ `system-ds-studio`** |
| Profile | 0 | Cố ý không map |
| Consumer | `permForHref` → `canShowHref` / gate / `admin-governance.js` | Đã hop `matchPath` → `PAGE_PERM` trước regex |

Migrate có kiểm chứng: Wave 1 (3 key) + Studio đi `PAGE_PERM`. Regex Wave 1 / Studio **không xóa** (fallback + URL cũ).

Ngoài Wave 1 (vd. `subscription.entitlements.view` trên `/admin/goi-cuoc/entitlements`): **giữ regex** — chưa `PAGE_PERM`.

## Step 5 — Nginx `/admin` classification (không xóa Wave 2)

| Nhãn | Ví dụ | Việc lượt này |
|---|---|---|
| **INFRA** | `= /admin/login`, `dang-nhap` 301, `^~ /iflux-admin-ui/`, CSS/html leftover | Giữ |
| **INFRA/entry** | `= /admin/tong-quan` rewrite file | Giữ — không qua Express |
| **APP** | `location /admin/` → `@admin_ia` → `:3002` | Giữ — Page URL ownership |
| **LEGACY** | Regex VI rewrite file (`he-thong`, `goi-cuoc`, …); EN→VI 301 (`subscription`→`goi-cuoc`) | Giữ — Wave 2 chưa mở |
| **LEFTOVER** | Exact leaf Administrators đã xóa ở Dispatcher/V5 | Không thêm lại |

Không xóa VI / EN→VI. Không thêm `location` từng Page.