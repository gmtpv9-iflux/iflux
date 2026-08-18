# Audit — Admin S1 URL / Route / Page Identity / Navigation / Breadcrumb

**Product:** iFlux  
**Task:** `170826_Inprogress_URL Architecture Standardization`  
**Căn cứ:** [`01_BRD.md`](01_BRD.md) §6 Mandatory Audit  
**Phạm vi đo:** Staging 1 (mã `Admin_Design_system/` + `backend/` trên worktree `staging`) + runtime `https://staging.iflux.vn`  
**Ngày đo:** 17/08/2026  
**Status:** Owner Locked — Audit  
**Đối chiếu SoT:** [`03b_SoT_Comparison.md`](03b_SoT_Comparison.md) (Locked)  
**Solution:** [`04_Solution.md`](04_Solution.md) (Owner Locked 17/08/2026)

---

# 0. Ranh giới tài liệu

Owner yêu cầu: **audit trước, đối chiếu SoT sau**.

Tài liệu này **chỉ** trả lời BRD §6 bằng evidence hiện trạng. Chấm SoT nằm ở [`03b_SoT_Comparison.md`](03b_SoT_Comparison.md). Không khóa Solution. Không đổi URL / route / menu.

`03_SoT.md` và `Product_Backlogs_New/Governance_URL_Architecture.md` được dùng **như nguồn evidence đã có**, không như tiêu chí chấm trong file này.

---

# 1. Phương pháp và evidence tái sử dụng

## 1.1. Không audit lại từ số 0

| Evidence cũ | Dùng cho | Còn đúng 17/08? |
|---|---|---|
| [`Product_Backlogs_New/04_160826_inprogress_NewProduct_Staging_2/Phase-02-Administrators/02_Audit — S1 Reference (Bốn trang Quản trị viên).md`](../../Product_Backlogs_New/04_160826_inprogress_NewProduct_Staging_2/Phase-02-Administrators/02_Audit%20—%20S1%20Reference%20(Bốn%20trang%20Quản%20trị%20viên).md) | 4 trang Quản trị viên: URL, file, breadcrumb, permission, alias | Có — URL `/admin/he-thong/admin-*` vẫn sống trên S1 |
| [`Product Backlogs/020826_Admin_Page_Architecture_Standardization/02 - Context Audit.md`](../020826_Admin_Page_Architecture_Standardization/02%20-%20Context%20Audit.md) | Convention file `app/{module}/{page}.html`, nginx rewrite 2 cấp, `iflux-admin-routes.js` | Convention A đã thắng trên đĩa (`sectors.html`, `ecosystems.html` tồn tại). Nginx vẫn còn fallback Convention B |
| `infra/nginx-iflux-production-locations.conf` | Rewrite + alias English → Vietnamese | Pattern **khớp runtime S1** (đo HTTP, không SSH ghi) |
| `docs/SoT — iFlux Product Architecture (V2).md` § Admin URLs | Product docs đang trích URL Admin tiếng Việt | Evidence citation — không dùng làm authority URL của task này |

## 1.2. Audit bổ sung (phục vụ BRD, chưa có trong evidence cũ)

- Toàn bộ `PAGES` trong `iflux-admin-routes.js` (không chỉ 4 trang Quản trị viên).
- Mapping Nav ↔ Route ↔ Permission (`HREF_PERM`).
- Nguồn breadcrumb (hardcode HTML vs `adm-page-bc`).
- Phân tán URL (HTML href, nginx, API).
- HTTP sống trên `staging.iflux.vn` cho URL hiện tại / alias English / URL 3 cấp kiểu BRD.

## 1.3. HTTP sống — Staging 1 (17/08/2026)

| URL | Kết quả |
|---|---|
| `/admin/he-thong/admin-list` | **200** |
| `/admin/he-thong/admin-permissions` | **200** |
| `/admin/system/admin-list` | **301** → `/admin/he-thong/admin-list` |
| `/admin/login` | **301** → `/admin/dang-nhap` |
| `/admin/dang-nhap` | **200** |
| `/admin/system-settings/administrators/permissions` | **404** |

Canonical Admin đang sống = **slug tiếng Việt**. English module path là **alias bị đẩy về Vietnamese**. URL 3 cấp English trong ví dụ BRD **chưa tồn tại** trên S1.

---

# 2. Kiến trúc hiện trạng (as-is)

S1 Admin **không** có một Canonical Route Registry theo nghĩa BRD (một nguồn Page Identity ↔ IA ↔ URL). Có **nhiều lớp độc lập** cùng nói về URL:

```text
IA (nhãn sidebar)
   IfluxAdminNavRegistry.sidebar
        ↓  routeKey (string)
   IfluxAdminRoutes.PAGES[key].slug
        ↓  href menu
   Nginx rewrite  /admin/{vi-module}/{leaf}  →  /Admin_Design_system/app/{en-folder}/{leaf}.html
        ↓
   HTML file + breadcrumb (thường hardcode)
        ↓  song song
   admin-rbac-client.HREF_PERM   (regex trên href → permission)
        ↓  song song
   backend  /api/admin/{english-resource}
```

Không lớp nào mang tên **Page Identity**. Ứng viên gần nhất là `pageKey` (object key trong `PAGES`), nhưng:

- object key có thể ≠ `PAGES[key].key`;
- nhiều key trỏ cùng slug / cùng file;
- permission **không** bind `pageKey` — bind **href regex**.

---

# 3. Page Inventory (BRD §6.1)

## 3.1. Số lượng

| Đại lượng | Số | Nguồn |
|---|---:|---|
| Object key trong `PAGES` | 116 | `iflux-admin-routes.js` |
| `PAGES[k].key` khác nhau | 113 | 3 alias đổi `key` |
| Slug path khác nhau (bỏ `#` / `?`) | 96 | |
| File HTML được registry trỏ tới | 89 | không file nào registry-missing |
| HTML dưới `Admin_Design_system/app/` | 110 | 21 file **không** có trong `PAGES` |
| Item sidebar (type=item) | 98 | `iflux-admin-nav-registry.js` |
| Parent menu | 12 | |
| Group IA (type=group) | 16 | chỉ là nhãn, không có ID |
| Route key không có trên sidebar | 18 | alias / trang sâu / legacy |
| Nav item không có trong `PAGES` | 0 | |

## 3.2. Primary scope — bốn trang Quản trị viên

IA sidebar thực tế:

```text
Group: Cài đặt hệ thống
  Parent: Quản trị viên          (key=system-admins, routeKey=system-admin-list)
    Danh sách Quản trị viên
    Hồ sơ
    Vai trò quản trị
    Phân quyền quản trị
  (sibling, ngoài parent) Nhật ký kiểm tra
```

| Field | Danh sách | Hồ sơ | Vai trò | Phân quyền |
|---|---|---|---|---|
| Ứng viên Page Identity | `system-admin-list` | `system-admin-profile` | `system-admin-roles` | `system-admin-permissions` |
| Feature Identity | không có field riêng | không có | không có | không có |
| Module (nav group) | Cài đặt hệ thống | Cài đặt hệ thống | Cài đặt hệ thống | Cài đặt hệ thống |
| Page/Menu (nav parent) | Quản trị viên | Quản trị viên | Quản trị viên | Quản trị viên |
| Sub-page (nav item) | Danh sách Quản trị viên | Hồ sơ | Vai trò quản trị | Phân quyền quản trị |
| Current URL | `/admin/he-thong/admin-list` | `/admin/he-thong/admin-profile` | `/admin/he-thong/admin-roles` | `/admin/he-thong/admin-permissions` |
| Current Route | object key = value.key | object key = value.key | + alias `system-roles` | object key = value.key |
| File | `system/admin-list.html` | `system/admin-profile.html` | `system/admin-roles.html` | `system/admin-permissions.html` |
| Navigation source | NavRegistry `routeKey` → `hrefFor` | cùng | cùng | cùng |
| Breadcrumb source | **HTML hardcode** | **HTML hardcode** | **HTML hardcode** | **HTML hardcode** |
| Permission (client) | `access.admin_accounts.view` | **không có** trong `HREF_PERM` | `access.roles.view` | `access.permissions.view` |
| Database identity | tài khoản admin (bảng users/admin) | cùng user đang login | role row | role↔perm matrix |
| Canonical implementation | `admin-governance.js` + 4 HTML | cùng | cùng | cùng |
| Alias / legacy | `system-admin-users` cùng slug; file chết `admin-users.html` | — | `system-roles`; file chết `roles.html` | — |

**Lệch IA ↔ URL (finding cốt lõi của primary scope):**

```text
IA:     Cài đặt hệ thống / Quản trị viên / Phân quyền quản trị
URL:    /admin/he-thong/admin-permissions
Breadcrumb (hardcode): Admin / Hệ thống / Quản trị viên / Phân quyền quản trị
```

URL có **2 cấp** sau `/admin` (`he-thong` + `admin-permissions`). Parent menu **Quản trị viên không xuất hiện trong URL**. Breadcrumb thì có 4 cấp (Admin + 3). URL **không** phản ánh đủ IA Module → Page → Sub-page.

Ví dụ BRD `/admin/system-settings/administrators/permissions` = **404** trên S1.

## 3.3. Inventory sidebar (98 item) — tóm theo group

Cột Permission lấy từ `HREF_PERM` (regex trên slug). Trống = không khớp rule (dashboard và một số guide dùng path file).

| Group IA | Parent | Nhãn | pageKey / routeKey | Current URL | File | Permission |
|---|---|---|---|---|---|---|
| — | — | Tổng quan | `dashboard-index` | `/admin/tong-quan` | `dashboard/index.html` | `dashboard.overview.view` |
| Quản lý cộng đồng | Quản lý nội dung | Tổng quan | `community-content-dashboard` | `/admin/cong-dong/content/dashboard` | `community/content/dashboard.html` | `community.content_dashboard.view` |
| Quản lý cộng đồng | Quản lý nội dung | Danh sách Bài viết | `community-content-index` | `/admin/cong-dong/danh-sach-bai-viet` | `community/danh-sach-bai-viet.html` | `community.articles.view` |
| Quản lý cộng đồng | Quản lý nội dung | Danh sách Danh mục | `community-categories` | `/admin/cong-dong/categories` | `community/categories.html` | `community.categories.view` |
| Quản lý cộng đồng | Quản lý nội dung | Danh sách Chủ đề | `community-chu-de-list` | `/admin/cong-dong/danh-sach-chu-de` | `community/danh-sach-chu-de.html` | `stories.registry.view` |
| Quản lý cộng đồng | Kiểm duyệt nội dung | Kiểm duyệt bình luận | `community-comments` | `/admin/cong-dong/comments` | `community/comments.html` | `community.comments.view` |
| Quản lý cộng đồng | Kiểm duyệt nội dung | Kiểm duyệt chủ đề | `community-chu-de-moderation` | `/admin/cong-dong/chu-de-moderation` | `community/chu-de-moderation.html` | `community.stories.view` |
| Quản lý cộng đồng | — | Trung tâm báo cáo | `community-reports` | `/admin/cong-dong/reports` | `community/reports.html` | `community.reports.view` |
| Quản lý cộng đồng | Quản lý Câu chuyện | Danh sách Câu chuyện | `cau-chuyen-list` | `/admin/cau-chuyen/danh-sach` | `chu-de/danh-sach-cau-chuyen.html` | `stories.registry.view` |
| Quản lý cộng đồng | Quản lý Câu chuyện | Chi tiết câu chuyện | `cau-chuyen-detail` | `/admin/cau-chuyen/chi-tiet` | `chu-de/chi-tiet-cau-chuyen.html` | `stories.cau_chuyen_detail.view` |
| Quản lý cộng đồng | Quản lý RSS | Nguồn RSS | `community-rss-providers` | `/admin/cong-dong/nguon-rss` | `community/nguon-rss.html` | `community.rss_providers.view` |
| Quản lý cộng đồng | Quản lý RSS | Đồng bộ danh mục | `community-rss-category-sync` | `/admin/cong-dong/dong-bo-danh-muc` | `community/dong-bo-danh-muc.html` | `community.rss_category_sync.view` |
| Quản lý cộng đồng | Quản lý RSS | Đồng bộ cấu trúc bài viết | `community-rss-article-schema` | `/admin/cong-dong/dong-bo-cau-truc-bai-viet` | `community/dong-bo-cau-truc-bai-viet.html` | `community.rss_article_schema.view` |
| Quản lý người dùng | Quản lý khách hàng | Danh sách người dùng | `users-list` | `/admin/khach-hang/list` | `users/list.html` | `users.list.view` |
| Quản lý người dùng | Quản lý khách hàng | Vai trò & Quyền | `subscription-entitlements` | `/admin/goi-cuoc/entitlements` | `subscription/entitlements.html` | `subscription.entitlements.view` |
| Quản lý người dùng | Quản lý yêu cầu | Yêu cầu hợp tác | `req-partnership` | `/admin/yeu-cau/partnership` | `requests/partnership.html` | `requests.partnership.view` |
| Quản lý người dùng | Quản lý yêu cầu | Yêu cầu rút tiền | `req-withdrawals` | `/admin/yeu-cau/withdrawals` | `requests/withdrawals.html` | `requests.withdrawals.view` |
| Quản lý người dùng | Quản lý yêu cầu | Đề xuất tính năng | `req-features` | `/admin/yeu-cau/features` | `requests/features.html` | `requests.features.view` |
| Quản lý người dùng | Quản lý yêu cầu | Báo lỗi | `req-bugs` | `/admin/yeu-cau/bugs` | `requests/bugs.html` | `requests.bugs.view` |
| Quản lý người dùng | — | Xuất dữ liệu | `users-export` | `/admin/khach-hang/export` | `users/export.html` | `users.list.export` |
| Quản lý đơn hàng | — | Danh sách đơn hàng | `orders-list` | `/admin/don-hang/list` | `orders/list.html` | `subscription.transactions.view` |
| Quản lý đơn hàng | — | Thêm mới đơn hàng | `orders-add` | `/admin/don-hang/add` | `orders/add.html` | `subscription.transactions.view` |
| Quản lý sản phẩm | Gói Hội viên | Danh sách Gói | `subscription-plans` | `/admin/goi-cuoc/plans` | `subscription/plans.html` | `subscription.plans.view` |
| Quản lý sản phẩm | Gói Hội viên | Thêm Gói | `subscription-plan-add` | `/admin/goi-cuoc/plan-edit?plan=new` | `subscription/plan-edit.html` | `subscription.plans.view` |
| Quản lý sản phẩm | — | Người đăng ký | `subscription-subscribers` | `/admin/goi-cuoc/subscribers` | `subscription/subscribers.html` | `subscription.subscribers.view` |
| Loyalty & Membership | Mã khuyến mãi | Danh sách mã | `loyalty-promo-list` | `/admin/thanh-vien/ma-list` | `loyalty/ma-list.html` | `subscription.loyalty.view` |
| Loyalty & Membership | Mã khuyến mãi | Thêm mã khuyến mãi | `loyalty-promo-add` | `/admin/thanh-vien/ma-them` | `loyalty/ma-them.html` | `subscription.loyalty.view` |
| Loyalty & Membership | Mã khuyến mãi | Quản lý sử dụng | `loyalty-promo-usage` | `/admin/thanh-vien/ma-su-dung` | `loyalty/ma-su-dung.html` | `subscription.loyalty.view` |
| Loyalty & Membership | Membership | Danh sách Membership | `loyalty-membership-list` | `/admin/thanh-vien/membership` | `loyalty/membership.html` | `subscription.loyalty.view` |
| Quản lý giao diện | — | Cài đặt Trang | `system-page-settings` | `/admin/he-thong/page-settings` | `system/page-settings.html` | `interface.page_settings.view` |
| Quản lý giao diện | — | Mẫu giao diện | `system-templates` | `/admin/he-thong/templates` | `system/templates.html` | `interface.design_system.view` |
| Quản lý giao diện | — | 13 mục DS Studio | `system-ds-studio` … `-13` | `/admin/he-thong/ds-studio#…` | **cùng** `system/ds-studio.html` | `interface.design_system.view` |
| Cài đặt hệ thống | — | Bảng SLA | `system-sla` | `/admin/he-thong/sla` | `system/sla.html` | `system.sla.view` |
| Cài đặt hệ thống | — | Kiến trúc 4 tầng | `system-platform-layers` | `/admin/he-thong/platform-layers` | `system/platform-layers.html` | `system.platform_layers.view` |
| Cài đặt hệ thống | — | Cờ tính năng | `system-feature-flags` | `/admin/he-thong/feature-flags` | `system/feature-flags.html` | `system.feature_flags.view` |
| Cài đặt hệ thống | — | Chế độ bảo trì | `system-maintenance` | `/admin/he-thong/maintenance` | `system/maintenance.html` | `system.maintenance.view` |
| Cài đặt hệ thống | Quản trị viên | (4 trang — §3.2) | `system-admin-*` | `/admin/he-thong/admin-*` | `system/admin-*.html` | xem §3.2 |
| Cài đặt hệ thống | — | Nhật ký kiểm tra | `system-audit` | `/admin/he-thong/audit` | `system/audit.html` | `access.audit.view` |
| Quản lý thông báo | — | Push / In-app / Email / History | `notifications-*` | `/admin/thong-bao/{push,in-app,email,history}` | `notifications/*.html` | `notifications.*.view` |
| Quản lý thông báo | — | Thiết lập mẫu thông báo | `system-announcements` | `/admin/he-thong/announcements` | `system/announcements.html` | `notifications.templates.view` |
| Thị trường | — | Mã / HST / Ngành / Lô / Xếp hạng / Công thức | `market-*` | `/admin/thi-truong/{stocks,ecosystems,sectors,lot-threshold,ranking,formulas}` | `market/*.html` | `market.*.view` |
| Thị trường | — | Cấu hình thời gian | `market-cau-hinh-thoi-gian` | `/admin/thi-truong/cau-hinh-thoi-gian` | `market/cau-hinh-thoi-gian.html` | `system.core_setup.view` |
| Thị trường | Quản lý Nguồn Dữ liệu | Nguồn / Đồng bộ CT / Lịch sử | `data-sources`, `market-stock-schema`, `market-sync-history` | `/admin/thi-truong/data-sources` và 2 slug VI | `data/*.html` | `data.sources.view` |
| Vận hành dữ liệu | — | 4 trang | `market-ops-*` | `/admin/van-hanh-du-lieu/{…}` | `market-ops/*.html` | `market_ops.*.view` |
| Quản trị dữ liệu | — | 5 trang | `data-*` | `/admin/du-lieu/{etl-jobs,pipeline,quality,dictionary,reconciliation}` | `data/*.html` | `data.*.view` |
| Metadata | — | 4 trang | `metadata-*` | `/admin/tham-so/{…}` | `metadata/*.html` | `metadata.*.view` |
| Marketing | Thiết lập SEO | SEO hệ thống / từng trang | `marketing-seo-*` | `/admin/tiep-thi/thiet-lap-seo-*` | `marketing/thiet-lap-seo-*.html` | `marketing.seo_*.view` |
| Marketing | — | Onboarding | `marketing-onboarding` | `/admin/tiep-thi/onboarding` | `marketing/onboarding.html` | `marketing.onboarding.view` |
| Trung tâm AI | — | 5 trang | `ai-*` | `/admin/trung-tam-ai/{…}` | `ai/*.html` | `ai.*.view` |
| Phân tích | — | 4 trang | `analytics-*` | `/admin/phan-tich/{users,chu-de,revenue,funnel}` | `analytics/*.html` | mixed (dashboard / stories / subscription) |
| Hướng dẫn | — | 5 trang kit | `Admin-Design-system-*` | `/Admin_Design_system/{hub,design-system,patterns/*}.html` | file gốc, `file: null` | `guides.*.view` |

## 3.4. Route không có trên sidebar (18)

| Object key | value.key | Slug | Ý nghĩa as-is |
|---|---|---|---|
| `market-price-data` | `market-cau-hinh-thoi-gian` | `/admin/thi-truong/cau-hinh-thoi-gian` | alias key ≠ value.key |
| `system-core-setup` | `market-cau-hinh-thoi-gian` | cùng slug trên | bookmark cũ Hệ thống → trang Thị trường |
| `system-core-setup-legacy` | chính nó | `/admin/he-thong/core-setup` | file `system/core-setup.html` còn, **không** trên nav |
| `data-sources-legacy` | `data-sources` | `/admin/du-lieu/sources` | URL cũ module Dữ liệu; nav dùng `/admin/thi-truong/data-sources` |
| `subscription-transactions` | chính nó | `/admin/don-hang/list` | trùng `orders-list` |
| `orders-edit` | chính nó | `/admin/don-hang/edit` | trang sửa; highlight nav ép về `orders-list` |
| `subscription-membership-intro` | chính nó | `/admin/thanh-vien/membership` | trùng membership |
| `subscription-loyalty` | chính nó | cùng | trùng membership |
| `marketing-brand-identity` | chính nó | `/admin/tiep-thi/brand-identity` | nginx 301 → SEO hệ thống |
| `system-roles` | chính nó | `/admin/he-thong/admin-roles` | alias roles |
| `system-admin-users` | chính nó | `/admin/he-thong/admin-list` | alias list |
| `community-content-edit` | chính nó | `/admin/cong-dong/content/edit` | trang sâu, không menu |
| `community-author-list` | chính nó | `/admin/cong-dong/danh-sach-tac-gia` | **có route, không nav** |
| `community-experts` | chính nó | `/admin/cong-dong/experts` | **có route, không nav** |
| `chu-de-registry` | chính nó | `/admin/cong-dong/danh-sach-chu-de` | alias list chủ đề |
| `chu-de-detail` / `mapping` / `analytics` | chính nó | `/admin/chu-de/{detail,mapping,analytics}` | trang sâu Chủ đề, không sidebar |

## 3.5. HTML không có trong `PAGES` (21) — dead / leftover

`chu-de/registry.html`, `product/feature-suggestions.html`, `subscription/transactions.html`, `subscription/membership-intro.html`, `subscription/loyalty.html`, `system/admin-users.html`, `system/layout-manager.html`, `system/widget-publish.html`, `system/widget-library.html`, `system/roles.html`, `system/onboarding.html`, `users/detail.html`, `users/subscription.html`, `marketing/brand-identity.html`, `community/stories.html`, `community/content/index.html`, `community/content/engine.html`, `community/content/engine-edit.html`, `data/du-lieu-giao-dich.html`, `metadata/story-lifecycle.html`, `analytics/stories.html`.

Đây là **implementation chết hoặc leftover file**, không phải Page Identity thứ hai trên nav. Một số vẫn chứa `href="/admin/…"`.

---

# 4. Route Audit (BRD §6.2)

## 4.1. Route Registry hiện tại

**Có** một object `IfluxAdminRoutes.PAGES` — comment trong file gọi là “Route + Page Registry (SoT)”.

Thực tế registry này là **bảng slug ↔ file ↔ key**, không chứa:

- Module / Page / Sub-page IA;
- Permission;
- Breadcrumb;
- Canonical vs alias flag (alias và canonical cùng hình dạng).

## 4.2. Route nằm ở đâu — bao nhiêu lần

| Lớp | File | Vai trò |
|---|---|---|
| 1 | `Admin_Design_system/iflux-admin-ui/iflux-admin-routes.js` | `PAGES` + `hrefFor` + `matchPath` + `fileFromAdminPath` + `VI_DIR` |
| 2 | `Admin_Design_system/iflux-admin-ui/iflux-admin-nav-registry.js` | IA + `routeKey` — **không** chứa URL |
| 3 | `Admin_Design_system/iflux-admin-ui/admin-rbac-client.js` | `HREF_PERM` ~88 regex trên URL |
| 4 | `infra/nginx-iflux-production-locations.conf` (pattern sống trên S1) | rewrite + **301 English → Vietnamese** |
| 5 | HTML `href="/admin/…"` | 24 chỗ / 21 file |
| 6 | `backend/src/app.js` | API `/api/admin/{english}` — **không** mirror slug UI |
| 7 | Docs Product V2 | trích URL VI như `/admin/cong-dong/danh-sach-chu-de` |

Đổi một URL Admin hôm nay phải đụng **ít nhất lớp 1 + 3 + 4**; breadcrumb/HTML thêm lớp 5.

## 4.3. Cơ chế resolve URL → key

`matchPath(pathname, hash)` chọn object key có score cao nhất (slug exact, file path, `fileFromAdminPath`).

`fileFromAdminPath` giả định **2 cấp**: `/admin/{vi-module}/{rest}` → `{en-folder}/{rest}.html`, trừ vài special-case MDM.

Hệ quả: URL 3 cấp kiểu `/admin/system-settings/administrators/permissions` **không** có trong `VI_DIR` và **không** có rewrite → 404 (đã đo).

Ngoại lệ 3 cấp đã có: `/admin/cong-dong/content/dashboard` và `/edit` (nginx rule riêng `cong-dong/{sub}/{page}`).

## 4.4. Duplicate slug / alias

| Slug | Keys cùng slug | Ghi chú |
|---|---|---|
| `/admin/he-thong/admin-list` | `system-admin-list`, `system-admin-users` | alias tên cũ |
| `/admin/he-thong/admin-roles` | `system-admin-roles`, `system-roles` | alias tên cũ |
| `/admin/don-hang/list` | `orders-list`, `subscription-transactions` | 2 pageKey, 1 trang |
| `/admin/thanh-vien/membership` | 3 keys | 1 file |
| `/admin/thi-truong/cau-hinh-thoi-gian` | 3 keys (kể cả `system-core-setup`) | relocation cũ: Hệ thống → Thị trường, **giữ nhiều key** |
| `/admin/cong-dong/danh-sach-chu-de` | `community-chu-de-list`, `chu-de-registry` | |
| `/admin/he-thong/ds-studio` | 13 keys (khác hash) | 13 “trang” nav, 1 file, 1 path |

## 4.5. Legacy route (nginx 301 về VI)

English module prefixes bị **cấm sống** — luôn 301 về tiếng Việt:

`/admin/system` → `/admin/he-thong`  
`/admin/users` → `/admin/khach-hang`  
`/admin/market` → `/admin/thi-truong`  
`/admin/community` → `/admin/cong-dong`  
… (cùng pattern cho data, subscription, notifications, metadata, marketing, analytics, requests, ai, login)

Đây **không** phải redirect tạm. Đây là **canonical = Vietnamese**.

## 4.6. Route không resolve Page Identity

`matchPath` trả về **object key**, không phải identity ổn định:

- Cùng file `cau-hinh-thoi-gian.html` có thể thắng `market-price-data` / `market-cau-hinh-thoi-gian` / `system-core-setup` tùy score.
- 13 DS Studio keys phân biệt bằng **hash**, không bằng path.

Không có API `pageId → canonical URL`. Chiều ngược là `hrefFor(key)` — nếu caller cầm key alias, có thể ra đúng slug; nếu cầm URL, phải `matchPath` rồi `hrefFor`.

---

# 5. Page Identity Audit (BRD §6.3)

## 5.1. Câu hỏi bắt buộc: Page Identity = URL?

**Trên runtime permission: gần như có.**  
`IfluxAdminRbac.permForHref(href)` — khóa vào trang = **URL**. Sidebar ẩn/hiện theo href, không theo `pageKey`.

**Trên registry: gần như không.**  
`pageKey` tồn tại độc lập với slug. Đổi slug trong `PAGES` **không** đổi `pageKey` — nhưng **không đủ**: `HREF_PERM` + nginx + HTML vẫn giữ URL cũ.

## 5.2. Ứng viên identity đang chồng

| Ứng viên | Ổn định khi đổi URL? | Dùng làm gì hôm nay |
|---|---|---|
| `pageKey` (`PAGES` object key) | Có, nếu chỉ sửa `slug` | nav `routeKey`, `detectActiveKey` |
| `PAGES[k].key` | Lệch 3 chỗ | `hrefFor` fallback |
| URL slug | Không | permission, nginx, bookmark, docs |
| File path | Không (convention A gắn leaf) | rewrite |
| Permission key `access.permissions.view` | Có | RBAC / matrix |
| `data-admin-gov` trên body | Có (4 trang) | `admin-governance.js` mode |

**Deviation ghi nhận:** hệ thống **vừa** có pageKey **vừa** dùng URL như identity thứ hai (permission + nginx canonical).

## 5.3. Feature / Permission / Database

- Feature Identity: **không** có field trên Admin page. Không suy diễn.
- Permission: catalog key kiểu `module.page.action` — độc lập URL **về tên**, nhưng **gắn vào URL** ở client.
- Database: role / account / matrix **không** lưu URL trang Admin.

---

# 6. Navigation Audit (BRD §6.4)

Nguồn duy nhất cho **nhãn + cây IA** sidebar: `IfluxAdminNavRegistry.sidebar`.

Cách resolve href:

```text
nav.routeKey  →  IfluxAdminRoutes.hrefFor(routeKey)  →  PAGES[key].slug
```

Nav **không** hardcode URL (đúng hướng BR-08 một phần).

Nav **không** đọc IA ownership từ registry thứ hai. Group/parent chỉ là object trong cùng mảng.

Khi Page đổi chỗ trong IA: sửa mảng sidebar là đủ **vị trí menu**. URL **không** tự đổi. Breadcrumb **không** tự đổi.

Không thấy menu bản sao chỉ để giữ URL cũ trên 4 trang Quản trị viên. Alias nằm ở `PAGES` / nginx, không nhân bản parent “Quản trị viên”.

Lệch ownership URL vs IA (ví dụ ngoài 4 trang):

- Nav group **Quản lý giao diện** nhưng URL vẫn `/admin/he-thong/…` (cùng module slug với Cài đặt hệ thống).
- Nav group **Quản lý thông báo** nhưng “Thiết lập mẫu thông báo” URL `/admin/he-thong/announcements`.
- “Vai trò & Quyền” nằm IA Người dùng nhưng URL `/admin/goi-cuoc/entitlements`.

---

# 7. Breadcrumb Audit (BRD §6.5)

Không có Breadcrumb Engine / canonical IA → crumb.

| Cơ chế | Số HTML | Hành vi |
|---|---:|---|
| Hardcode trong HTML (`.ix-breadcrumb` không có `adm-page-bc`) | **83** | Nhãn + cấp viết tay. 4 trang Quản trị viên thuộc nhóm này |
| `#adm-page-bc` đổ từ JS | **11** | `sources-page.js` đọc **NavRegistry trail**; `admin-page-kit.js` đổ `Admin / {code}` (stub) |
| Không có breadcrumb | phần còn lại | |

4 trang primary scope — hardcode giống nhau về xương:

```text
Admin / Hệ thống / Quản trị viên / {tên trang}
```

Link crumb đầu = `/Admin_Design_system/hub.html` (path file, không phải `/admin/…`).

Đổi IA parent “Quản trị viên” → **phải sửa 4 HTML** (và mọi trang hardcode khác). Không tự theo nav.

---

# 8. Duplicate / legacy (BRD §6.6)

Tái sử dụng 020826 + đo lại:

| Loại | Evidence |
|---|---|
| Convention A vs B | A đã là đĩa hiện tại (`sectors.html`, `ecosystems.html`). Nginx còn rewrite fallback `sectors/index.html` |
| `.ix-*` / Tabler | App Shell Admin — ngoài scope URL; giữ như evidence UI S1 |
| Route chồng | §4.4 |
| Nav chồng | 0 item orphan; 18 route không lên nav |
| File chết | 21 HTML §3.5 |
| CSS chồng | không audit lại (không chặn URL inventory) |
| Relocation đã xảy ra | `system-core-setup` → slug Thị trường, **vẫn giữ key cũ** + file `core-setup.html` + nginx `/admin/he-thong/core-setup` |

Relocation lịch sử **không** xóa identity cũ — nhân bản key / file / URL.

---

# 9. Ngôn ngữ URL (phục vụ BR-02, chưa chấm SoT)

## 9.1. Admin UI

Mọi clean URL `/admin/…` trên registry dùng **segment module tiếng Việt** (`he-thong`, `thi-truong`, `khach-hang`, `cong-dong`, `dang-nhap`, …).

Leaf hỗn hợp: English (`stocks`, `plans`, `admin-list`) và Vietnamese (`danh-sach-chu-de`, `thiet-lap-seo-he-thong`, `cau-hinh-thoi-gian`).

English module path **tồn tại chỉ để 301 về VI**.

Login: canonical `/admin/dang-nhap`.

Hướng dẫn kit: URL vật lý `/Admin_Design_system/….html` — không đi qua `/admin/{vi}`.

## 9.2. API

`LEGACY_API_PREFIX` mặc định `/api`. Admin API **tiếng Anh**:

`/api/admin/access`, `/api/admin/auth`, `/api/admin/users`, `/api/admin/system`, `/api/admin/market/stocks`, …

API **không** localized. API **không** isomorphic với UI slug (`/admin/he-thong/admin-permissions` ≠ `/api/admin/access`).

## 9.3. User Web (dependency, không implement trong task)

Canonical public path **tiếng Việt**: `/nha-cua-toi`, `/thi-truong`, `/dong-tien`, `/cong-dong`, `/cau-chuyen`, … (`iflux-platform-boot.js`, `shell-url-writer.js`).

`seo-url.js` = entity URL, locale meta `vi_VN`. Matcher có vài alias EN (`/market`, `/flow`) — **không** thấy cây locale EN đầy đủ kiểu `/market/money-flow` như ví dụ BRD.

---

# 10. Phân tán canonical URL (BR-13)

Nguồn có khả năng chứa URL Admin — đã xác định:

| Nguồn | Có URL Admin? | Canonical? |
|---|---|---|
| `iflux-admin-routes.js` | Có — bảng chính FE | Một trong các nguồn |
| `iflux-admin-nav-registry.js` | Không (chỉ key) | IA labels |
| `admin-rbac-client.js` | Có — regex | Permission |
| Nginx snippet | Có — rewrite + 301 | Runtime path |
| HTML breadcrumb / href | Có | Bản sao |
| `admin-page-kit.js` / `sources-page.js` | Một phần | |
| Backend `app.js` | API English | Khác surface |
| Database | Không lưu Admin page URL | — |
| Product V2 docs | Có — URL VI | Documentation drift |

**Không** có một chỗ cập nhật duy nhất cho Route + URL + Nav + Breadcrumb.

---

# 11. Khả năng relocation (BR-04 / BR-16) — evidence, không phải test

BRD §11 mô tả scenario:

```text
Trước:  /admin/system-settings/administrators/permissions
Sau:    /admin/administrators/permissions
Identity PAGE_X không đổi
```

Trên S1 **không thể chạy scenario đó**:

1. URL “trước” của BRD **404**.
2. URL đang sống là `/admin/he-thong/admin-permissions`.
3. Đổi IA (kéo item ra khỏi parent) **không** đổi slug.
4. Đổi slug trong `PAGES` **không** đổi breadcrumb / `HREF_PERM` / nginx.
5. Precedent relocation (`core-setup` → Thị trường) **để lại** key + file + URL cũ.

Kết luận evidence: S1 **chưa** có canonical mechanism cho IA change. Đây là gap kiến trúc, không phải kết luận SoT.

---

# 12. Findings (facts cho Solution — chưa đối chiếu SoT)

| ID | Finding | BRD mục liên quan |
|---|---|---|
| F-01 | Canonical Admin URL trên S1 là **tiếng Việt**; English bị 301 về VI | BR-02 |
| F-02 | URL 2 cấp (`/{module-vi}/{leaf}`) **bỏ** cấp Page/Menu. 4 trang Quản trị viên: IA 3 cấp, URL 2 cấp | BR-01 |
| F-03 | `/admin/system-settings/administrators/permissions` **404** | BR-01, AC ví dụ |
| F-04 | Không có Page Identity chính thức; `pageKey` + URL + permission key chồng nhau | BR-03 |
| F-05 | Permission resolve từ **href**, không từ pageKey | BR-03, BR-05 |
| F-06 | Không có Page Identity → canonical URL duy nhất ngoài `hrefFor(key)` | BR-06 |
| F-07 | `PAGES` không đủ làm Route Registry canonical (thiếu IA, alias flag, permission, breadcrumb) | BR-07 |
| F-08 | Nav resolve từ routeKey (tốt) nhưng URL/breadcrumb không theo IA | BR-08 |
| F-09 | 83/110 HTML hardcode breadcrumb | BR-09 |
| F-10 | Nhiều pageKey / file / slug cho cùng một trang (alias chưa hạ cấp thành redirect-only) | BR-10, BR-12, BR-14 |
| F-11 | Đổi IA phải sửa tay nhiều lớp (§4.2) | BR-16, NFR-05 |
| F-12 | 21 HTML ngoài registry; 18 route ngoài nav | BR-11, BR-12 |
| F-13 | API Admin đã English; UI Admin không | BR-02 (API vs Admin lệch) |
| F-14 | User Web canonical VI; cây EN locale kiểu ví dụ BRD chưa thấy trên runtime | BR-15 (dependency) |
| F-15 | Nginx Admin rewrite **không nằm trong Git của S1** (snippet production trong repo; S1 sống cùng pattern). Đổi URL = đổi infra ngoài registry JS | BR-07, BR-16 |

---

# 13. Gaps — không suy diễn

| ID | Chưa đủ evidence / chưa có quyết định Owner |
|---|---|
| G-01 | `pageKey` có được **chốt** thành Page Identity hay cần identity mới? Audit không chọn. |
| G-02 | 13 mục DS Studio = 13 Page Identity hay 1 Page + hash region? |
| G-03 | `system-audit` có thuộc module Quản trị viên hay giữ sibling? |
| G-04 | User Web: những path nào **bắt buộc** SEO locale EN? Chưa inventory đủ để khóa. |
| G-05 | Nginx S1 trên server ≠ file Git — chưa đưa snippet S1 vào repo (đã biết ở task deploy). Audit không đề xuất ghi server. |
| G-06 | Mapping chính xác “Module IA” vs “segment URL” khi group nav ≠ folder (`Quản lý giao diện` vs `he-thong`). Cần Owner khi khóa SoT/Solution. |

---

# 14. Applicable inventory cho bước SoT (chưa làm)

Khi Owner mở đối chiếu SoT, audit này đã đủ để map:

1. Current URL ↔ ứng viên Page Identity (`pageKey`).
2. IA group / parent / item.
3. Permission key.
4. Nguồn nhân bản phải đụng nếu đổi URL.
5. Precedent relocation thất bại (để lại alias).

**Bước tiếp theo đã làm:** [`03b_SoT_Comparison.md`](03b_SoT_Comparison.md) → [`04_Solution.md`](04_Solution.md) (chờ Owner khóa).

---

# 15. Definition of Done — phần Audit

Theo BRD §15 mục 1–8 (audit only):

| # | Mục | Status |
|---|---|---|
| 1 | Mandatory Audit hoàn tất | **Xong** — file này |
| 2 | Admin URL inventory | **Xong** — §3 |
| 3 | Page Identity inventory | **Xong** — §5 (ứng viên + chồng identity) |
| 4 | Route inventory | **Xong** — §4 |
| 5 | Navigation inventory | **Xong** — §6 |
| 6 | Breadcrumb inventory | **Xong** — §7 |
| 7 | Duplicate/legacy | **Xong** — §8 |
| 8 | Existing evidence đã dùng | **Xong** — §1 |
| 9–20 | Solution / Lock / Implementation / Verification | **Chưa** — ngoài phạm vi |

---

# 16. Owner next

1. Findings F-01…F-15 — đã đối chiếu SoT.  
2. Khóa Solution [`04_Solution.md`](04_Solution.md) (D-01…D-06).  
3. Không implement từ audit này.
