# Audit — Admin URL Architecture Wave 2

**Task:** `180826_Inprogress_Admin_URL_Architecture_Wave_2`  
**Ngày đo:** 18/08/2026  
**Nguồn:** worktree `staging` sau `24beb82` · `IfluxAdminNavRegistry` · `IfluxAdminRoutes` · `admin-rbac-client.js` · `infra/staging-1/iflux-staging-app.conf`  
**BRD:** [`02_BRD.md`](02_BRD.md)  
**Predecessor CLOSED:** `170826` — Wave 1 Administrators + D-03 + dispatcher  

**Lượt này:** Audit only. **Không** Solution. **Không** Implementation. BRD: *IMPLEMENTATION NOT YET AUTHORIZED*.

Architecture LOCK kế thừa — **không mở lại:** OD-1…OD-6 · D-01 · D-03 · D-06. OD-7 trên `170826` = “không mở Wave 2 trên task cũ”. Task `180826` là kênh Wave 2 mới.

---

# 0. Kết luận

Wave 1 đã chứng minh mô hình trên **4 trang Administrators + login**. Phần còn lại của Admin **vẫn hai mức architecture**:

```text
4 Page     → pathFor() = canonical
94 menu    → PAGES.slug = writer
hầu hết Page → nginx VI rewrite thắng Express
hầu hết perm → HREF_PERM regex trên URL
hầu hết BC  → HTML hardcode hub.html
```

| Hạng | Số | Ghi chú |
|---|---|---|
| Group IA | 16 | **0** có `urlSegment` |
| Parent IA | 12 | **1** có `urlSegment` (`administrators`) |
| Menu item (item + child) | **98** | khớp đo 17/08 |
| Có `urlSegment` / `pathFor` | **4** | Wave 1 only |
| Writer = `PAGES.slug` | **94** | gồm Studio + dashboard + 5 Hướng dẫn |
| `PAGES` object key | 116 | |
| `PAGES` identity (`value.key`) | 99 | |
| `PAGE_PERM` | 4 | list / roles / permissions / `system-ds-studio` |
| `HREF_PERM` regex | 87 | giữ — còn consumer |
| HTML `#adm-page-bc` | 15 | shell/`trailFor` |
| HTML hardcode `hub.html` trong BC | ~80 file | writer lệch |
| User Web trong scope | 0 | OUT |

Wave 2 **chưa** đạt AC BRD §17. Đây là baseline, không phải failure của Wave 1.

---

# 1. Admin Page inventory

## 1.1 Cách đếm

- **Menu item** = node `type=item` hoặc child của `parent` trong `sidebar`.
- **Page Identity** = `PAGES[].key` (D-01).
- **Studio:** 13 menu / 13 object key / **1** identity `system-ds-studio` (D-03 LOCK).
- **Hướng dẫn:** 5 menu, slug `/Admin_Design_system/*.html`, `file: null` — không phải `/admin` Page URL.

## 1.2 Menu → identity → writer

| Loại | Menu | Identity riêng | Writer canonical |
|---|---|---|---|
| Wave 1 Administrators | 4 | 4 | `pathFor` |
| DS Studio | 13 | **1** | `slug` + hash region |
| Dashboard | 1 | 1 | `slug` `/admin/tong-quan` |
| Hướng dẫn | 5 | 5 | `slug` file path — **NON-PAGE / INFRA** |
| Admin Page còn lại | 75 | 75 | `slug` VI module |
| **Tổng menu** | **98** | 86 menu-identity + 1 Studio + 5 guide | |

`hrefFor === slug` trên 94 item không `pathFor`. `hrefFor === pathFor === slug` trên 4 Wave 1 (slug đã hygiene 2 cấp).

## 1.3 PAGES ngoài menu (18 object key)

Không phải menu item. Vai trò lẫn: alias, runtime page, leftover.

| Object key | Identity | Slug | Phân loại audit |
|---|---|---|---|
| `system-admin-users` | `system-admin-list` | `/admin/administrators/list` | LEGACY alias (`legacy: true`) |
| `system-roles` | `system-admin-roles` | `/admin/administrators/roles` | LEGACY alias |
| `data-sources-legacy` | `data-sources` | `/admin/du-lieu/sources` | alias — **thiếu `legacy: true`** |
| `market-price-data` | `market-cau-hinh-thoi-gian` | cùng slug | alias — thiếu `legacy: true` |
| `system-core-setup` | `market-cau-hinh-thoi-gian` | cùng slug | alias bookmark |
| `system-core-setup-legacy` | **identity riêng** | `/admin/he-thong/core-setup` | leftover HTML stub |
| `subscription-transactions` | cùng key | `/admin/don-hang/list` | trùng `orders-list` |
| `subscription-loyalty` / `subscription-membership-intro` | key riêng | `/admin/thanh-vien/membership` | trùng membership |
| `marketing-brand-identity` | key riêng | `/admin/tiep-thi/brand-identity` | nginx 301 → SEO hệ thống |
| `orders-edit` | `orders-edit` | `/admin/don-hang/edit` | runtime, không menu |
| `community-content-edit` | cùng | `/admin/cong-dong/content/edit` | runtime |
| `community-author-list` / `community-experts` | cùng | slug `/admin/cong-dong/…` | PAGES, experts có HTML kit |
| `chu-de-registry` | cùng | `/admin/cong-dong/danh-sach-chu-de` | trùng menu `community-chu-de-list` |
| `chu-de-detail` / `chu-de-mapping` / `chu-de-analytics` | cùng | `/admin/chu-de/…` | PAGES, không / ít menu |

**F-W2-01:** Một số object key alias **không** `legacy: true` → dễ bị hiểu là Page Identity thứ hai.

## 1.4 Login

Không nằm `PAGES`. Nginx exact `/admin/login` 200; `/admin/dang-nhap` 301. **INFRA / auth** — Wave 1. Không đếm Page in-scope để gắn `urlSegment`.

---

# 2. IA inventory

Nguồn: `iflux-admin-nav-registry.js`.

## 2.1 Group

| Group | `urlSegment` |
|---|---|
| Quản lý cộng đồng | — |
| Quản lý người dùng | — |
| Quản lý đơn hàng | — |
| Quản lý sản phẩm | — |
| Loyalty & Membership | — |
| Quản lý giao diện | — |
| Cài đặt hệ thống | — |
| Quản lý thông báo | — |
| Thị trường | — |
| Vận hành dữ liệu | — |
| Quản trị dữ liệu | — |
| Metadata | — |
| Marketing | — |
| Trung tâm AI | — |
| Phân tích | — |
| Hướng dẫn | — |

**16/16 group không có `urlSegment`.**

## 2.2 Parent

12 parent. **Chỉ** `system-admins` có `urlSegment: "administrators"`.

Các parent còn lại (`community-overview`, `community-moderation`, `community-stories`, `community-rss`, `users-end-users`, `users-requests`, `subscription-membership-plans`, `loyalty-promo`, `loyalty-membership`, `market-data-mgmt`, `marketing-seo`): không segment.

## 2.3 Item `urlSegment`

Chỉ 4 child Wave 1: `list` / `profile` / `roles` / `permissions`.

## 2.4 IA label tree ≠ URL module (hiện trạng)

URL hiện tại **không** luôn phản ánh group/parent IA. Ví dụ:

| Menu nằm group IA | `routeKey` | URL đang emit |
|---|---|---|
| Quản lý người dùng → khách hàng | `subscription-entitlements` | `/admin/goi-cuoc/entitlements` |
| Quản lý người dùng → yêu cầu | `req-*` | `/admin/yeu-cau/…` |
| Quản lý thông báo | `system-announcements` | `/admin/he-thong/announcements` |
| Thị trường → nguồn dữ liệu | `data-sources` | `/admin/thi-truong/data-sources` |
| Quản lý giao diện | `system-ds-studio` | `/admin/he-thong/ds-studio#…` |

**F-W2-02 (STOP nếu tự suy):** BRD §8: số cấp URL = hệ quả IA. Nếu Wave 2 gắn `urlSegment` theo **cây group/parent hiện tại**, nhiều URL sẽ **đổi hình** (vd. entitlements rời `goi-cuoc`). Nếu gắn segment chỉ để **tái tạo slug hiện tại**, IA không trở thành nguồn URL. Đây là quyết định dữ liệu IA — **không tự chọn trong Audit**.

## 2.5 Studio (D-03 — không mở lại)

13 nav giữ. Identity = `system-ds-studio`. Hash = region. Chưa có `urlSegment` → writer vẫn `slug`.

---

# 3. URL inventory

## 3.1 Canonical writer

```text
hrefFor(key)
  → pathFor(key)   nếu node có urlSegment     [4]
  → PAGES.slug     fallback                   [94]
```

`pathFor` chỉ đọc `urlSegment` trên **chính node** (+ group/parent nếu có). Không đọc `PAGES.slug`.

## 3.2 Module path đang sống (từ slug menu `/admin/…`)

| Prefix slug | Số menu (xấp xỉ) | English alias nginx đã có? |
|---|---|---|
| `/admin/administrators/` | 4 | canonical Wave 1 |
| `/admin/he-thong/` | 15 giao diện + 5 hệ thống + 1 announcements + studio hashes | `system` → VI 301 |
| `/admin/cong-dong/` | 10 | `community` → VI |
| `/admin/cau-chuyen/` | 2 | `story` → `chu-de` (không phải `cau-chuyen` EN sạch) |
| `/admin/khach-hang/` | 2 | `users` → VI |
| `/admin/goi-cuoc/` | 3 (+ entitlements) | `subscription` → VI |
| `/admin/yeu-cau/` | 4 | `requests` → VI |
| `/admin/don-hang/` | 2 | `orders` → VI |
| `/admin/thanh-vien/` | 4 | `loyalty` → VI |
| `/admin/thong-bao/` | 4 | `notifications` → VI |
| `/admin/thi-truong/` | 10 | `market` → VI |
| `/admin/van-hanh-du-lieu/` | 4 | `market-ops` → VI |
| `/admin/du-lieu/` | 5 | `data` → VI |
| `/admin/tham-so/` | 4 | `metadata` → VI |
| `/admin/tiep-thi/` | 3 | `marketing` → VI |
| `/admin/trung-tam-ai/` | 5 | `ai` → VI |
| `/admin/phan-tich/` | 4 | `analytics` → VI |
| `/admin/tong-quan` | 1 | `dashboard` → VI |

Bảng EN đề xuất trên `170826` `04` §8 = **đề xuất, chưa khóa** (đặc biệt `chu-de`, G-06 `interface` vs `he-thong`).

## 3.3 Query trong slug

`subscription-plan-add`: slug = `/admin/goi-cuoc/plan-edit?plan=new`. `pathFor` không encode query. Runtime `detectActiveKey` đặc biệt cho `plan=new`.

**F-W2-03:** Query-as-identity không phải Page URL thuần. Giữ như runtime state trừ khi Owner mở quyết định.

## 3.4 Serve path hôm nay

| URL loại | Ai serve | Ví dụ |
|---|---|---|
| Wave 1 canonical | Express `mountAdminUi` | `/admin/administrators/permissions` 200 + `x-powered-by: Express` |
| Wave 1 legacy | Express 301 | `he-thong/admin-*`, `system-settings/…`, `system/admin-*` |
| Hầu hết menu VI | **Nginx regex rewrite file** | `/admin/goi-cuoc/entitlements`, `/admin/he-thong/sla` |
| Login / tong-quan | Nginx exact | INFRA |
| EN module | Nginx 301 → VI | `/admin/subscription/…` → `/admin/goi-cuoc/…` |

**F-W2-04:** Ngoài Wave 1, nginx **vẫn biết danh sách module Page**. Trái mục tiêu BRD §12 (“Nginx không biết danh sách Page”) — đúng OD-3 “chưa xóa ngay”; Wave 2 phải classify rồi mới xóa khi hết consumer.

---

# 4. Permission inventory

Nguồn: `admin-rbac-client.js`.

## 4.1 Flow hiện tại

```text
permForHref(href)
  → matchPath → PAGE_PERM[pageKey]     nếu có key
  → HREF_PERM first-match regex        fallback
```

`canShowHref` / sidebar giữ chữ ký cũ. Không engine mới.

## 4.2 PAGE_PERM — MIGRATED (identity)

| pageKey | Permission |
|---|---|
| `system-admin-list` | `access.admin_accounts.view` |
| `system-admin-roles` | `access.roles.view` |
| `system-admin-permissions` | `access.permissions.view` |
| `system-ds-studio` | `interface.design_system.view` |

`system-admin-profile`: **cố ý không map** (Wave 1).

## 4.3 HREF_PERM — 87 regex

Phân loại **đề xuất cho Solution** (Audit không xóa):

| Status BRD §11 | Số / phạm vi | Lý do |
|---|---|---|
| **MIGRATED** (identity) | 4 `PAGE_PERM` | hop trước regex |
| **KEEP — LEGACY** | regex Wave 1 + Studio | fallback URL cũ / hash |
| **KEEP — ACTIVE CONSUMER** | ~75 rule Page `/admin/…` | chưa `PAGE_PERM` |
| **KEEP — NON-PAGE** | 5 rule `/Admin_Design_system/…` | Hướng dẫn |
| **KEEP — catch-all** | `yeu-cau/` → `users.list.view` | collision đã đo `170826` `02b` |
| **REMOVE — PROVEN DEAD** | **0 trong lượt này** | chưa chứng minh dead lại; `widget-library` từng nghi dead ở `02b` — **không xóa** đến khi đo lại |

**F-W2-05:** Không xóa `HREF_PERM` hàng loạt. Mỗi nhóm phải inventory consumer (`canShowHref`, gate, governance) trước REMOVE.

---

# 5. Nginx inventory (`/admin`)

File: `infra/staging-1/iflux-staging-app.conf`. Classify theo BRD §12. **Không xóa trong Audit.**

## 5.1 INFRA — giữ

| Location | Việc |
|---|---|
| `= /admin` | 302 → `/admin/tong-quan` |
| `= /admin/login` (+ slash) | rewrite login.html |
| `= /admin/dang-nhap` | 301 → login |
| `= /admin/tong-quan` | rewrite dashboard — **entry, không Express** |
| `^~ /iflux-admin-ui/` | static JS |
| leftover `.html` → `/admin/…` 301 | file URL cũ |

## 5.2 APP

| Location | Việc |
|---|---|
| `/admin/` → `try_files` → `@admin_ia` → `:3002` | dispatcher Wave 1 |

Chỉ thắng khi **không** khớp regex module đứng sau/cạnh (nginx regex vs prefix).

## 5.3 LEGACY — VI serve + EN→VI

Giữ khi Wave 2 chưa chứng minh 0 consumer:

- EN→VI: `users`, `market`, `market-ops`, `data`, `subscription`, `notifications`, `metadata`, `marketing`, `system` (trừ admin-* Wave 1), `community`, `analytics`, `requests`, `ai`, `story`→`chu-de`, `access`/`quyen-han`→ entitlements, `orders`→`don-hang`, `loyalty`→`thanh-vien`, `dashboard`→`tong-quan`
- VI rewrite 2 cấp: `khach-hang`, `thi-truong`, `van-hanh-du-lieu`, `du-lieu`, `goi-cuoc`, `don-hang`, `thanh-vien`, `thong-bao`, `tham-so`, `tiep-thi`, `he-thong` (trừ admin-*), `cong-dong`, `phan-tich`, `yeu-cau`, `trung-tam-ai`, `chu-de`, `cau-chuyen`
- Exact module index: `= /admin/khach-hang`, `goi-cuoc`, `he-thong`, …

## 5.4 LEFTOVER / page-specific

Chưa chứng minh dead:

- Exact MDM: `thi-truong/data-sources`, `dong-bo-cau-truc-co-phieu`, `lich-su-dong-bo`
- 301 nội bộ: `du-lieu-giao-dich`, `tiep-thi/seo-system`, `seo-pages`, `brand-identity`, `chu-de/registry`, `cong-dong/content`
- HTML stub `location.replace` (không phải nginx): `admin-users.html`, `roles.html` → **URL 3 cấp cũ** (`/admin/system-settings/administrators/…`) — Express sẽ 301 tiếp

**F-W2-06:** Stub HTML Wave 1 vẫn trỏ URL 3 cấp, không trỏ canonical 2 cấp. Consumer = bookmark file. Không xóa đến khi chứng minh.

---

# 6. Legacy inventory

## 6.1 Đã 301 Application (Wave 1) — giữ

- `/admin/system-settings/administrators/{leaf}`
- `/admin/he-thong/admin-{list,profile,roles,permissions}`
- `/admin/system/admin-*`
- `legacySlugs[]` trên 4 PAGES Wave 1

## 6.2 301 Nginx EN→VI — chưa Application

Mọi prefix English module §5.3. Target = **slug VI**, không phải `pathFor` (vì chưa có segment).

Wave 2 invert English: các 301 này **đảo chiều** hoặc chuyển sang Express `matchPath` → `pathFor`. Chưa làm.

## 6.3 HTML meta-refresh / `location.replace`

| File | Target |
|---|---|
| `system/admin-users.html` | `/admin/system-settings/administrators/list` |
| `system/roles.html` | `/admin/system-settings/administrators/roles` |
| `system/core-setup.html` | `/admin/thi-truong/cau-hinh-thoi-gian` |
| `data/du-lieu-giao-dich.html` | cùng |
| `subscription/loyalty.html` | `/admin/thanh-vien/membership` |
| `subscription/transactions.html` | `/admin/don-hang/list` |
| `subscription/membership-intro.html` | `/admin/thanh-vien/ma-list` |
| `marketing/brand-identity.html` | SEO hệ thống |
| `system/widget-library.html` | `platform-layers.html#layer-4` |
| `community/stories.html` | `chu-de-moderation.html` |
| `analytics/stories.html` | `chu-de.html` |
| `metadata/story-lifecycle.html` | `chu-de-lifecycle.html` |

Auth `location.replace` → login = INFRA, không phải Page writer.

---

# 7. Hardcode inventory

## 7.1 Navigation

Sidebar App Shell đọc `hrefFor`. Hub `hub.html` đã `hrefFor` (Wave 1 Step 3).

**Không** phát hiện registry thứ ba.

## 7.2 Breadcrumb

| Cơ chế | File (đo) |
|---|---|
| `#adm-page-bc` + `trailFor` (shell hoặc kit) | 15: 4 Administrators, audit, sources, 2 MDM, export, chu-de-moderation, experts, 4 analytics |
| HTML cứng `href="/Admin_Design_system/hub.html"` | ~80 trang app/patterns |
| `trailFor` Admin crumb | `hrefFor('dashboard-index')` → fallback `/admin/tong-quan` |

**F-W2-07:** Đa số Page **không** thỏa BRD §5.D (`breadcrumb == trailFor`). Writer lệch = HTML, không thiếu hàm.

## 7.3 Href Page cứng trong HTML

Ngoài BC: `content/edit.html` → `/admin/cong-dong/danh-sach-bai-viet`; `chu-de/registry.html` cùng pattern; `plan-edit.html` → `plans.html` file path; stub §6.3.

## 7.4 User Web

`24beb82` / Wave 1 không đụng `User_Web/`. Grep Wave 2 scope: không có `pathFor` / `system-ds-studio` trong User Web. **OUT.**

---

# 8. Đối chiếu BRD Wave 2 (chưa implement)

| BRD | Hiện trạng | Gap |
|---|---|---|
| 5.B mọi Page có `urlSegment` | 4/98 menu | 94 |
| `pathFor` = canonical authority | 4 Page | 94 slug |
| Nav từ `hrefFor` | Có (shell) | `hrefFor` vẫn nhánh slug |
| BC từ `trailFor` | 15 file | ~80 hardcode |
| Perm qua identity | 4 `PAGE_PERM` | 87 regex |
| Legacy chỉ 301 | Wave 1 Express; còn lại nginx EN→VI hoặc serve VI | invert chưa mở |
| Nginx không biết Page | prefix APP có; regex module = biết Page | classify + chứng minh dead |
| Không architecture mới | 2 file registry | PASS |
| User Web OUT | PASS | — |

---

# 9. Finding (không suy diễn Solution)

| ID | Finding | SoT / BRD |
|---|---|---|
| F-W2-01 | Alias PAGES thiếu `legacy: true` | D-01 |
| F-W2-02 | Gắn `urlSegment` theo IA tree **có thể đổi hình URL** vs tái tạo slug | §8 · OD-6 |
| F-W2-03 | `?plan=new` trong slug | identity vs state |
| F-W2-04 | Nginx VI vẫn serve hầu hết Page | OD-3 · §12 |
| F-W2-05 | `HREF_PERM` còn consumer | §11 |
| F-W2-06 | Stub HTML trỏ URL 3 cấp Wave 1 | OD-4 |
| F-W2-07 | Breadcrumb hardcode chiếm đa số | §5.D |
| F-W2-08 | IA group “Hướng dẫn” không phải `/admin` Page | §5.1 NON-PAGE |
| F-W2-09 | G-06 / `chu-de` EN **chưa khóa** trên `170826` §8 | OD-6 |
| F-W2-10 | `system-audit` sibling — D-06 giữ; chưa `urlSegment` | D-06 |

---

# 10. Open / STOP trước Implementation

BRD §15: STOP nếu architecture conflict / new identity / new URL convention / scope / perm semantics.

Audit **không** khóa các điểm sau. Implementation **không** được tự điền:

1. **Quy ước `urlSegment`:** tái tạo path VI hiện tại, hay invert English ngay, hay theo đúng cây group/parent (đổi hình URL).
2. **G-06:** “Quản lý giao diện” chung `he-thong` hay tách `interface`.
3. **`chu-de` / `cau-chuyen`:** tên EN (`topics` / `stories` / giữ).
4. **Dashboard / login / Hướng dẫn:** Page in-scope hay INFRA / NON-PAGE (khuyến nghị Audit: login+tong-quan = INFRA; 5 Hướng dẫn = NON-PAGE).
5. **Studio:** gắn 1 `urlSegment` cho pathname (hash giữ region) — không tạo 13 identity.

Không có drift architecture mới trong source đo.

---

# 11. Ngoài phạm vi (xác nhận)

- User Web / User App / SEO public / API / DB identity  
- Redesign Admin / DS / Widget  
- Registry / perm engine / BC engine mới  
- Đổi permission **key**  
- Đổi HTML file chỉ vì URL  
- Production / Staging 2  
- Rewrite Wave 1  

---

# 12. Evidence method

```text
node + vm  load iflux-admin-nav-registry.js + iflux-admin-routes.js
grep       HREF_PERM / PAGE_PERM / adm-page-bc / hub.html / location.replace
read       infra/staging-1/iflux-staging-app.conf  (khối /admin)
```

HTTP Wave 1 (re-run 18/08 trên `staging.iflux.vn`) — kế thừa `170826` `04` §16: V1–V6 V8 PASS; V7 live NOT RE-RUN. **Không** re-run toàn bộ 94 URL trong lượt Audit này.

---

# 13. Output lượt này / không làm

| | |
|---|---|
| **DONE** | Đóng `170826`. Audit 19.1 đủ 7 inventory. |
| **NOT DONE** | Solution · Migration Matrix · Implementation · V1–V10 Wave 2 |
| **INTENTIONALLY KEPT** | Toàn bộ leftover Wave 1 (`HREF_PERM`, nginx VI, slug fallback) — Audit không xóa |
| **OUT OF SCOPE** | User Web / Production / Wave 1 rewrite |
| **FOLLOW-UP** | Solution + Migration Matrix **khi Owner ủy quyền Implementation** trên BRD `180826` |

Không tự mở Solution/Implement từ Audit này.
