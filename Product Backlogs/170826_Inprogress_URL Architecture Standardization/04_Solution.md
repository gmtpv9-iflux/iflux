# Solution — Product URL Architecture Standardization (Admin S1)

**Task:** `170826_Inprogress_URL Architecture Standardization`  
**Status:** Owner Locked — 17/08/2026  
**Implementation:** Ủy quyền Wave 1  
**D-01…D-06:** khóa đúng cột Đề xuất  
**Căn cứ:** [`01_BRD.md`](01_BRD.md) · [`02_Audit.md`](02_Audit.md) · [`03_SoT.md`](03_SoT.md) · [`03b_SoT_Comparison.md`](03b_SoT_Comparison.md)

---

# 0. Kết luận comparison (đã khóa như evidence)

S1 Admin **FAIL** SoT §1, §2.2 (UI), §3–§6, §8. API Admin **PASS** §2.2. User Web **OUT** khỏi wave thi công đầu.

Mục tiêu Solution:

```text
Page Identity
  → IA ownership (một chỗ)
  → Route Registry
  → URL tiếng Anh (đủ cấp IA)
  → Navigation + Breadcrumb + Permission binding
```

Legacy URL = **301 only**. Không Page / Menu / Route / Identity mới.

---

# 1. Quyết định Owner phải khóa

SoT không tự điền gap G-01…G-06. **Owner đã khóa D-01…D-06 đúng cột Đề xuất (17/08/2026).**

| ID | Quyết định | Đề xuất | Nếu Owner chọn khác |
|---|---|---|---|
| **D-01** | Page Identity = gì? | **`pageKey` đang có** trong `PAGES`. Gộp alias về một key. Không tạo `PAGE_*` mới | Identity mới = file/registry mới — trái modify-first; phải giải trình |
| **D-02** | Cắt URL English khi nào? | **Cùng architecture, hai wave URL.** Wave 1 = 4 trang Quản trị viên + login. Wave 2 = phần Admin còn lại | Một wave toàn Admin: phải khóa luôn D-04 trước Plan |
| **D-03** | 13 mục DS Studio | **Một** Page Identity `system-ds-studio`. Hash = region, không phải Page mới | 13 identity: giữ 13 key, URL path vẫn một |
| **D-04** | Slug module / parent | Wave 1 **khóa theo ví dụ SoT** (§2). Wave 2: bảng đề xuất §8 — Owner khóa từng dòng | Đổi tên slug SoT (`system-settings`) = đổi SoT, không làm ở task này |
| **D-05** | Nginx | Sửa snippet **đã có** trong repo. S1 chỉ lên khi cùng wave deploy với JS. **Không** SSH Production. Không invent workflow nginx mới | Nếu S1 nginx chưa vào CI: Owner chỉ kênh ghi S1 (đã biết G-05) |
| **D-06** | `system-audit` | **Giữ sibling** (IA hiện tại). Không nhét vào parent Quản trị viên | Đổi IA audit = quyết định product riêng |

**D-04 Wave 1 — khóa theo SoT (không invent):**

| IA | URL slug | pageKey |
|---|---|---|
| Module Cài đặt hệ thống | `system-settings` | — |
| Page/Menu Quản trị viên | `administrators` | `system-admins` (parent nav) |
| Danh sách | `list` | `system-admin-list` |
| Hồ sơ | `profile` | `system-admin-profile` |
| Vai trò | `roles` | `system-admin-roles` |
| Phân quyền | `permissions` | `system-admin-permissions` |
| Login | `/admin/login` | (auth, không phải PAGES item) |

Canonical Wave 1:

```text
/admin/system-settings/administrators/list
/admin/system-settings/administrators/profile
/admin/system-settings/administrators/roles
/admin/system-settings/administrators/permissions
/admin/login
```

Relocation SoT §4 (verification BRD §11):

```text
IA bỏ module system-settings
  → /admin/administrators/permissions
pageKey        = system-admin-permissions
permission     = access.permissions.view
file           = system/admin-permissions.html
```

---

# 2. Impact Analysis (CG-005)

| Hạng | Current owner | Files / functions | Consumers | Storage / API | Decision |
|---|---|---|---|---|---|
| Page Identity | `IfluxAdminRoutes.PAGES` object key | `iflux-admin-routes.js` | nav `routeKey`, `detectActiveKey` | không DB | **Reuse** key · **Modify** gộp alias |
| Canonical URL | `PAGES[].slug` + nginx + HTML | `iflux-admin-routes.js` · nginx snippet · HTML href | menu, bookmark, docs | không DB | **Modify** slug; nginx đảo 301 |
| IA tree + nhãn | `IfluxAdminNavRegistry.sidebar` | `iflux-admin-nav-registry.js` | shell, `navTrail` trong `sources-page.js` | — | **Reuse** tree · **Modify** thêm `urlSegment` trên group/parent/item |
| URL writer | `hrefFor` | `iflux-admin-routes.js` | `iflux-admin-app-shell.js` | — | **Modify**: `hrefFor` = join IA segments, không đọc slug rời nếu IA có segment |
| URL → Identity | `matchPath` | cùng file | `detectActiveKey`, (sẽ) perm | — | **Modify**: match canonical + `legacySlugs` → **một** pageKey |
| Permission bind | `HREF_PERM` regex | `admin-rbac-client.js` · `canShowHref` | sidebar ẩn/hiện, 4 trang gov | catalog key giữ | **Modify**: `permForPage(pageKey)`; `permForHref` = matchPath rồi permForPage |
| Breadcrumb | 83 HTML hardcode; 11 `#adm-page-bc` | HTML · `sources-page.js` `navTrail` | trang Admin | — | **Modify**: đưa `trailFor` lên NavRegistry; xóa hardcode in-scope; `sources-page.js` gọi lại |
| File vật lý | Convention A | `Admin_Design_system/app/…` | nginx rewrite | — | **Reuse** — không đổi tên file Wave 1 |
| API | `backend/src/app.js` `/api/admin/…` | không đổi vì URL UI | 4 trang + toàn Admin | — | **Reuse** |
| Legacy URL | nginx EN→VI + alias keys | nginx · `PAGES` | bookmark | — | **Modify**: VI → EN 301; key alias `legacy: true` |
| Dead HTML | 21 file ngoài `PAGES` | `app/**` | gần như không | — | **Delete** khi chứng minh không còn link (Wave 2) |
| User Web locale | `seo-url.js` · boot | — | public SEO | — | **Không đụng** (OUT) |

**Không tạo:** Route Registry file mới · Breadcrumb engine mới · Permission engine mới · Admin app song song · pageId schema mới.

---

# 3. Vì sao không file mới

| Việc | Existing | Why cannot modify? | New file? |
|---|---|---|---|
| Registry Identity + IA + URL | `iflux-admin-routes.js` + `iflux-admin-nav-registry.js` | **Modify được** | Không |
| Breadcrumb từ IA | `navTrail` đã có trong `sources-page.js` | Kéo lên NavRegistry (owner IA) | Không |
| Perm theo Identity | `permForHref` / `HREF_PERM` | Đổi bảng + 1 hop `matchPath` | Không |
| Serve URL mới | nginx snippet đã có `location =` | Thêm exact location + đảo 301 | Không |
| Login EN | nginx `/admin/login` → dang-nhap | Đảo chiều | Không |

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
matchPath / nginx
  canonical + legacySlugs
        ↓
cùng pageKey
```

`PAGES[pageKey]` giữ: `key`, `file`, `legacySlugs[]`, `canonical` (bool).  
**Không** giữ `slug` như nguồn thứ hai sau khi IA đã có `urlSegment`. Trong transition Wave 1: chỉ 4 trang + login dùng IA join; trang khác tạm đọc `slug` cũ — **một hàm `hrefFor`**, hai nhánh dữ liệu, không hai writer.

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

Nginx: Wave 1 thêm `location =` cho **cả hai** URL verification (trước và sau) nếu Owner muốn chạy scenario trên S1 trong cùng task. URL “sau” chưa có file map thì 404 — Plan phải có location cho URL sau **hoặc** Owner chấp nhận verify bằng đổi `urlSegment` module rồi deploy nginx cùng commit.

**Cách verify không nhân bản nginx vô hạn:** một `location` prefix:

```text
/admin/system-settings/administrators/{leaf}
/admin/administrators/{leaf}
```

map `{list,profile,roles,permissions}` → file `admin-*.html`. Hai prefix, một bảng leaf. Modify snippet hiện có — không generator mới.

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

| Cũ | Xử lý |
|---|---|
| `/admin/he-thong/admin-list` (và roles/permissions/profile) | 301 → URL EN 3 cấp |
| `/admin/system/admin-list` | 301 → cùng canonical (không còn 301 về VI) |
| `system-admin-users`, `system-roles` | `legacy: true`, `key` trỏ identity canonical; `hrefFor` không trả key này cho nav |
| `/admin/dang-nhap` | 301 → `/admin/login` |
| File chết `admin-users.html`, `roles.html` | không serve; Wave 2 xóa |

Không tạo menu “Quản trị viên (old)”.

---

# 5. Waves

## Wave 1 — chứng minh SoT trên primary scope

In scope:

- D-01…D-06 như §1 (nếu Owner khóa)
- 4 trang Quản trị viên + login
- `hrefFor` / `matchPath` / `permForPage` / `trailFor` trên **file hiện có**
- Nginx exact/prefix cho 4 leaf + 2 prefix relocation + đảo login
- HTML 4 trang: bỏ breadcrumb cứng
- `HREF_PERM` 4 trang → pageKey (các regex khác giữ tạm)

Out Wave 1:

- Đổi URL các module Admin còn lại
- Xóa 21 HTML chết
- User Web locale EN
- Đưa nginx S1 vào Git nếu Owner chưa mở task deploy
- Sửa Product Architecture V2 citations (docs) — làm khi URL Wave 1 sống, cùng commit docs nếu Owner muốn

**Wave 1 đạt SoT** trên 4 trang + scenario relocation. **Chưa** đạt §2.2 cho toàn Admin.

## Wave 2 — phần Admin còn lại

- Gắn `urlSegment` toàn sidebar (sau Owner khóa bảng §8)
- Xóa nhánh `PAGES.slug` còn lại
- `HREF_PERM` hết → pageKey
- Breadcrumb `#adm-page-bc` thay 83 hardcode
- Alias còn lại = 301
- Xóa HTML chết đã chứng minh

Wave 2 mới đóng AC-03 toàn Admin.

---

# 6. SOL map → finding

| SOL | Việc | Finding / SoT |
|---|---|---|
| SOL-ID | D-01: pageKey = Identity; gộp alias | F-04, F-10 · §3 §6 |
| SOL-IA | `urlSegment` trên NavRegistry | F-02, F-07 · §1 |
| SOL-HREF | `hrefFor` join IA | F-06, F-08, F-11 · §5 |
| SOL-MATCH | `matchPath` → một pageKey (canonical + legacy) | F-05, F-06 · §5 |
| SOL-PERM | `permForPage` | F-05 · §3 |
| SOL-BC | `trailFor` + xóa hardcode in-scope | F-09 · §4 |
| SOL-URL1 | Slug EN 3 cấp Wave 1 + login | F-01, F-03, F-13 · §2.2 |
| SOL-NGX | Đảo 301; prefix leaf map | F-15, F-01 · §5 |
| SOL-LEGACY | 301 VI; key `legacy` | F-10, F-12 · §6 |
| SOL-W2 | Phần Admin còn lại | F-01 toàn cục, F-09, F-12 |

---

# 7. Nginx (modify snippet — không invent)

Hiện tại: English module **301 → VI**.

Wave 1:

1. `location =` (hoặc prefix) cho 4 canonical EN + 4 legacy VI + 4 `/admin/system/admin-*` → canonical EN.
2. Prefix relocation `/admin/administrators/{leaf}` → cùng file map.
3. `/admin/login` rewrite file login; `/admin/dang-nhap` 301 → login.
4. Catch-all `/admin/system(/.*)?` **không** được nuốt `/admin/system-settings` (regex hiện tại đã không nuốt — giữ).
5. Root path = **Staging 1** web root khi apply S1. File repo đang ghi production root — **không** copy rule đó sang Production. Chỉ sửa rule URL; path root theo môi trường đang deploy.

Không rsync. Không SSH Production.

---

# 8. Bảng slug Wave 2 — đề xuất, chưa khóa

Dùng khi Owner chọn D-02 = một wave, hoặc khi mở Wave 2. Nguồn: đảo `VI_DIR` + alias nginx **đã có**. Không đặt tên mới nếu đã có English alias.

| Segment VI hiện tại | Segment EN đề xuất | Ghi chú |
|---|---|---|
| `he-thong` | `system-settings` | Khớp SoT. **G-06:** group “Quản lý giao diện” vẫn cùng module URL hôm nay — tách `interface` hay giữ chung = Owner |
| `thi-truong` | `market` | alias nginx đã có |
| `khach-hang` | `users` | alias đã có |
| `van-hanh-du-lieu` | `market-ops` | alias đã có |
| `du-lieu` | `data` | alias đã có |
| `goi-cuoc` | `subscription` | alias đã có |
| `don-hang` | `orders` | alias đã có |
| `thanh-vien` | `loyalty` | alias đã có |
| `thong-bao` | `notifications` | alias đã có |
| `tham-so` | `metadata` | alias đã có |
| `tiep-thi` | `marketing` | alias đã có |
| `cong-dong` | `community` | alias đã có |
| `phan-tich` | `analytics` | alias đã có |
| `yeu-cau` | `requests` | alias đã có |
| `trung-tam-ai` | `ai` | alias đã có |
| `chu-de` | `topics` hoặc giữ `chu-de`? | **Chưa khóa** — SoT đòi EN; không có alias sạch. Owner chọn |
| `cau-chuyen` | `stories` | nginx đã 301 `story` → `chu-de`; cần Owner |
| `tong-quan` | `dashboard` | alias đã có |
| `dang-nhap` | `login` | Wave 1 |

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

| # | Thao tác | Kỳ vọng |
|---|---|---|
| V1 | Mở 4 URL EN | 200, đúng file, đúng pageKey |
| V2 | Mở 4 URL VI cũ | 301 → EN |
| V3 | `/admin/system/admin-list` | 301 → EN list, **không** về VI |
| V4 | `/admin/login` 200; `/admin/dang-nhap` 301 | |
| V5 | Đổi IA permissions theo SoT §4 (một edit nav) + nginx prefix sau | Cùng `system-admin-permissions`; URL mới; BC + nav mới; không PAGE_Y |
| V6 | Refresh / deep link / back | không 404 in-scope |
| V7 | Sidebar ẩn theo perm (trừ profile) | cùng khóa `access.*` |
| V8 | API `/api/admin/access` | không đổi |

---

# 11. Covered vs BRD / SoT

| Hạng | Covered trong Solution? | Đạt khi |
|---|---|---|
| BR-01 / SoT §1 | Có — IA join | Wave 1 trên 4 trang |
| BR-02 Admin EN | Có | Wave 1 in-scope; Wave 2 toàn Admin |
| BR-03 Identity ≠ URL | Có — D-01 | Owner khóa D-01 + SOL-ID |
| BR-04…06 relocation / resolve | Có — §4.2 | V5 |
| BR-07 một registry | Có — modify `PAGES` + Nav IA | Wave 1 hàm; Wave 2 hết slug rời |
| BR-08…09 nav/BC | Có | Wave 1: 4 trang; Wave 2: còn lại |
| BR-10…14 no clone / legacy 301 | Có | Wave 1 in-scope |
| BR-15 locale User | Không thi công | Task riêng |
| BR-16 một chỗ cập nhật | Có — move node IA | V5 |
| AC-03 toàn Admin | Wave 2 | Owner D-02 |

---

# 12. Owner Lock

**Locked:** 17/08/2026 — D-01 … D-06 đúng cột Đề xuất.

Wave 1 được thi công. Wave 2 chưa ủy quyền.

**Cấm** đổi URL ngoài Wave 1 / xóa route / gộp identity ngoài alias đã nêu.
