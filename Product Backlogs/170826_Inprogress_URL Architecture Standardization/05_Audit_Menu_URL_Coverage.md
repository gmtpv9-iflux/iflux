# Audit — Menu Admin URL coverage sau Wave 1

**Task:** `170826_Inprogress_URL Architecture Standardization`  
**Ngày đo:** 17/08/2026  
**Nguồn đo:** `IfluxAdminNavRegistry.sidebar` + `IfluxAdminRoutes.hrefFor` (worktree `staging`, commit Wave 1 `ec7935f`) + HTTP `https://staging.iflux.vn`  
**Không phải:** khóa SoT mới · không phải ủy quyền Wave 2

---

# 0. Kết luận (nguyên nhân, không suy diễn)

**Chưa áp dụng toàn bộ.** BRD BR-02 (“URL Admin phải tiếng Anh”) vẫn đúng là **yêu cầu sản phẩm**. Việc đã thi công chỉ là **Wave 1** theo đề xuất D-02 / D-04 trên `04` — **không** Owner Locked.

| Hạng | Số |
|---|---|
| Mục menu (item + child, không đếm group/parent rỗng) | **98** |
| Đã đổi URL English (Wave 1) | **4** |
| Menu vẫn URL tiếng Việt / path cũ | **94** |
| Login (không nằm menu) | đã đổi `/admin/login` |

Link Owner thấy:

```text
https://staging.iflux.vn/admin/goi-cuoc/entitlements
```

Đây **không phải sót Wave 1**. Đây là URL canonical hiện tại của `subscription-entitlements` (nhãn menu “Vai trò & Quyền”). Wave 1 **không** gồm trang này.

Live cùng lúc đo:

| URL | HTTP | Ý nghĩa |
|---|---|---|
| `/admin/goi-cuoc/entitlements` | **200** | Canonical đang là tiếng Việt |
| `/admin/subscription/entitlements` | **301 → `/admin/goi-cuoc/entitlements`** | English **bị đảo về VI** — rule nginx cũ, Wave 1 không đụng |
| `/admin/system-settings/administrators/list` | **200** | Wave 1 đã invert |
| `/admin/system-settings/sla` | **404** | Group có `urlSegment=system-settings` **không** tự serve sibling |
| `/admin/he-thong/sla` | **200** | Sibling cùng group menu vẫn VI |
| `/admin/dashboard` | **301 → `/admin/tong-quan`** | English module vẫn 301 về VI |

---

# 1. Vì sao không “chuyển đổi linh hoạt” toàn menu

Ba lớp cùng lúc. Không phải một lớp hỏng rồi các lớp kia tự sửa.

## 1.1. Phạm vi Wave 1 (đề xuất trên 04) — không phải bug runtime

[`04_Solution.md`](04_Solution.md) D-02 (đề xuất Solution — **không** Owner Locked):

```text
Cùng architecture, hai wave URL.
Wave 1 = 4 trang Quản trị viên + login.
Wave 2 = phần Admin còn lại.
```

D-04 Wave 2: bảng slug §8 ghi **“đề xuất, chưa khóa”**. Không có ủy quyền đổi `goi-cuoc` → `subscription`.

[`01_BRD.md`](01_BRD.md): không còn ghi ủy quyền Implementation mới. Wave 1 / V5 = evidence.

## 1.2. Menu không tự dựng URL English

`pathFor(routeKey)` chỉ trả URL khi **chính node đó** có `urlSegment` (item), và cộng `group.urlSegment` + `parent.urlSegment` nếu có.

Đo trên registry sau Wave 1 — **chỉ 6 chỗ** có `urlSegment`:

| Node | `urlSegment` |
|---|---|
| group “Cài đặt hệ thống” | `system-settings` |
| parent “Quản trị viên” | `administrators` |
| 4 child list / profile / roles / permissions | `list` / `profile` / `roles` / `permissions` |

94 mục còn lại: `pathFor` = `null` → `hrefFor` **fallback** `PAGES[key].slug` (vẫn VI).

Hệ quả trong **cùng group** “Cài đặt hệ thống”: 4 child Administrators ra English; SLA / 4 tầng / cờ / bảo trì / audit **vẫn** `/admin/he-thong/…`. Group `urlSegment` **không** lan sang item không có `urlSegment`. Đây là cách hàm đang viết, không phải engine locale tự invert.

## 1.3. Nginx ngoài Wave 1 vẫn EN → VI

Snippet `infra/staging-1/iflux-staging-app.conf` (sau Wave 1) vẫn:

```text
/admin/subscription(/.*)?  →  301 /admin/goi-cuoc$1
/admin/users(/.*)?         →  301 /admin/khach-hang$1
/admin/dashboard           →  301 /admin/tong-quan
… (các module Wave 2)
```

Nên gõ English “đúng SoT đề xuất” cho entitlements **bị đẩy ngược** về `goi-cuoc`. Wave 1 chỉ invert login + 4 Administrators.

---

# 2. Đã áp dụng (4 mục menu + login)

| Menu | routeKey | URL menu (`hrefFor`) |
|---|---|---|
| Danh sách Quản trị viên | `system-admin-list` | `/admin/system-settings/administrators/list` |
| Hồ sơ | `system-admin-profile` | `/admin/system-settings/administrators/profile` |
| Vai trò quản trị | `system-admin-roles` | `/admin/system-settings/administrators/roles` |
| Phân quyền quản trị | `system-admin-permissions` | `/admin/system-settings/administrators/permissions` |
| *(không menu)* Đăng nhập | — | `/admin/login` |

`pageKey` / permission key / file HTML: không đổi.

---

# 3. Chưa áp dụng — đúng URL menu đang emit

Cột “Module VI” = segment đầu sau `/admin/`.  
Cột “§8 đề xuất” = **chưa khóa** ([`04_Solution.md`](04_Solution.md) §8). Không phải URL đã implement. Leaf tiếng Việt (`danh-sach-bai-viet`, `ma-them`, …) **chưa có** slug EN đã khóa — không bịa leaf.

## 3.1. `goi-cuoc` — đúng link Owner hỏi

| Group / Parent | Nhãn menu | routeKey | URL đang emit |
|---|---|---|---|
| Quản lý người dùng / Quản lý khách hàng | Vai trò & Quyền | `subscription-entitlements` | `/admin/goi-cuoc/entitlements` |
| Quản lý sản phẩm / Gói Hội viên | Danh sách Gói | `subscription-plans` | `/admin/goi-cuoc/plans` |
| Quản lý sản phẩm / Gói Hội viên | Thêm Gói | `subscription-plan-add` | `/admin/goi-cuoc/plan-edit?plan=new` |
| Quản lý sản phẩm | Người đăng ký | `subscription-subscribers` | `/admin/goi-cuoc/subscribers` |

§8 đề xuất module: `goi-cuoc` → `subscription` (chưa khóa). Nginx hiện tại: English `subscription` **301 về** `goi-cuoc`.

## 3.2. Toàn bộ 94 mục — theo group menu

### Tổng quan (1)

| Nhãn | routeKey | URL đang emit |
|---|---|---|
| Tổng quan | `dashboard-index` | `/admin/tong-quan` |

§8 đề xuất: `tong-quan` → `dashboard`. Live: `/admin/dashboard` **301 →** `/admin/tong-quan`.

### Quản lý cộng đồng (12)

| Parent | Nhãn | routeKey | URL đang emit |
|---|---|---|---|
| Quản lý nội dung | Tổng quan | `community-content-dashboard` | `/admin/cong-dong/content/dashboard` |
| Quản lý nội dung | Danh sách Bài viết | `community-content-index` | `/admin/cong-dong/danh-sach-bai-viet` |
| Quản lý nội dung | Danh sách Danh mục | `community-categories` | `/admin/cong-dong/categories` |
| Quản lý nội dung | Danh sách Chủ đề | `community-chu-de-list` | `/admin/cong-dong/danh-sach-chu-de` |
| Kiểm duyệt nội dung | Kiểm duyệt bình luận | `community-comments` | `/admin/cong-dong/comments` |
| Kiểm duyệt nội dung | Kiểm duyệt chủ đề | `community-chu-de-moderation` | `/admin/cong-dong/chu-de-moderation` |
| — | Trung tâm báo cáo | `community-reports` | `/admin/cong-dong/reports` |
| Quản lý Câu chuyện | Danh sách Câu chuyện | `cau-chuyen-list` | `/admin/cau-chuyen/danh-sach` |
| Quản lý Câu chuyện | Chi tiết câu chuyện | `cau-chuyen-detail` | `/admin/cau-chuyen/chi-tiet` |
| Quản lý RSS | Nguồn RSS | `community-rss-providers` | `/admin/cong-dong/nguon-rss` |
| Quản lý RSS | Đồng bộ danh mục | `community-rss-category-sync` | `/admin/cong-dong/dong-bo-danh-muc` |
| Quản lý RSS | Đồng bộ cấu trúc bài viết | `community-rss-article-schema` | `/admin/cong-dong/dong-bo-cau-truc-bai-viet` |

§8: `cong-dong` → `community` (chưa khóa). `cau-chuyen` → `stories` (chưa khóa; nginx `story` đang 301 về `chu-de`, không về `cau-chuyen`). Leaf `danh-sach-*`, `nguon-rss`, `dong-bo-*` chưa khóa EN.

### Quản lý người dùng (7, trừ entitlements đã ở 3.1)

| Parent | Nhãn | routeKey | URL đang emit |
|---|---|---|---|
| Quản lý khách hàng | Danh sách người dùng | `users-list` | `/admin/khach-hang/list` |
| Quản lý yêu cầu | Yêu cầu hợp tác | `req-partnership` | `/admin/yeu-cau/partnership` |
| Quản lý yêu cầu | Yêu cầu rút tiền | `req-withdrawals` | `/admin/yeu-cau/withdrawals` |
| Quản lý yêu cầu | Đề xuất tính năng | `req-features` | `/admin/yeu-cau/features` |
| Quản lý yêu cầu | Báo lỗi | `req-bugs` | `/admin/yeu-cau/bugs` |
| — | Xuất dữ liệu | `users-export` | `/admin/khach-hang/export` |

§8: `khach-hang` → `users`; `yeu-cau` → `requests` (chưa khóa). Nginx: `/admin/users` **301 →** `/admin/khach-hang`.

### Quản lý đơn hàng (2)

| Nhãn | routeKey | URL đang emit |
|---|---|---|
| Danh sách đơn hàng | `orders-list` | `/admin/don-hang/list` |
| Thêm mới đơn hàng | `orders-add` | `/admin/don-hang/add` |

§8: `don-hang` → `orders` (chưa khóa). Nginx: `/admin/orders` **301 →** `/admin/don-hang`.

### Loyalty & Membership (4)

| Parent | Nhãn | routeKey | URL đang emit |
|---|---|---|---|
| Mã khuyến mãi | Danh sách mã | `loyalty-promo-list` | `/admin/thanh-vien/ma-list` |
| Mã khuyến mãi | Thêm mã khuyến mãi | `loyalty-promo-add` | `/admin/thanh-vien/ma-them` |
| Mã khuyến mãi | Quản lý sử dụng | `loyalty-promo-usage` | `/admin/thanh-vien/ma-su-dung` |
| Membership | Danh sách Membership | `loyalty-membership-list` | `/admin/thanh-vien/membership` |

§8: `thanh-vien` → `loyalty` (chưa khóa). Leaf `ma-list` / `ma-them` / `ma-su-dung` chưa khóa EN.

### Quản lý giao diện (15) — cùng module URL `he-thong` với Hệ thống

| Nhãn | routeKey | URL đang emit |
|---|---|---|
| Cài đặt Trang | `system-page-settings` | `/admin/he-thong/page-settings` |
| Mẫu giao diện | `system-templates` | `/admin/he-thong/templates` |
| Token nguyên thủy … Luồng người dùng (13 DS Studio) | `system-ds-studio` … `-13` | `/admin/he-thong/ds-studio#…` |

D-03: inventory `04` §1.1 = 1 identity + 13 region (**chưa** Owner Lock). G-06 module EN vs `interface`: chưa khóa. Wave 1 không đổi các URL này.

### Cài đặt hệ thống — sibling chưa Wave 1 (5)

Cùng group đã gắn `urlSegment=system-settings`, **không** đổi URL:

| Nhãn | routeKey | URL đang emit |
|---|---|---|
| Bảng SLA | `system-sla` | `/admin/he-thong/sla` |
| Kiến trúc 4 tầng | `system-platform-layers` | `/admin/he-thong/platform-layers` |
| Cờ tính năng | `system-feature-flags` | `/admin/he-thong/feature-flags` |
| Chế độ bảo trì | `system-maintenance` | `/admin/he-thong/maintenance` |
| Nhật ký kiểm tra | `system-audit` | `/admin/he-thong/audit` |

D-06: `system-audit` giữ sibling, không nhét vào Administrators. Không có `urlSegment` trên 5 item này.

### Quản lý thông báo (5)

| Nhãn | routeKey | URL đang emit |
|---|---|---|
| Thông báo push | `notifications-push` | `/admin/thong-bao/push` |
| Trong ứng dụng | `notifications-in-app` | `/admin/thong-bao/in-app` |
| Chiến dịch email | `notifications-email` | `/admin/thong-bao/email` |
| Lịch sử phát sóng | `notifications-history` | `/admin/thong-bao/history` |
| Thiết lập mẫu thông báo | `system-announcements` | `/admin/he-thong/announcements` |

`system-announcements` nằm group Thông báo nhưng slug module vẫn `he-thong` (PAGES). §8: `thong-bao` → `notifications` (chưa khóa).

### Thị trường (10)

| Nhãn | routeKey | URL đang emit |
|---|---|---|
| Mã cổ phiếu | `market-stocks` | `/admin/thi-truong/stocks` |
| Hệ sinh thái | `market-ecosystems-index` | `/admin/thi-truong/ecosystems` |
| Quản lý ngành | `market-sectors-index` | `/admin/thi-truong/sectors` |
| Ngưỡng lô | `market-lot-threshold` | `/admin/thi-truong/lot-threshold` |
| Cấu hình thời gian | `market-cau-hinh-thoi-gian` | `/admin/thi-truong/cau-hinh-thoi-gian` |
| Nguồn Market data | `data-sources` | `/admin/thi-truong/data-sources` |
| Đồng bộ cấu trúc cổ phiếu | `market-stock-schema` | `/admin/thi-truong/dong-bo-cau-truc-co-phieu` |
| Lịch sử đồng bộ | `market-sync-history` | `/admin/thi-truong/lich-su-dong-bo` |
| Cấu hình xếp hạng | `market-ranking` | `/admin/thi-truong/ranking` |
| Công thức | `market-formulas` | `/admin/thi-truong/formulas` |

§8: `thi-truong` → `market` (chưa khóa). Nginx: `/admin/market` **301 →** `/admin/thi-truong`. Leaf `cau-hinh-thoi-gian`, `dong-bo-cau-truc-co-phieu`, `lich-su-dong-bo` chưa khóa EN.

### Vận hành dữ liệu (4)

| Nhãn | routeKey | URL đang emit |
|---|---|---|
| Sức khỏe feed | `market-ops-feed-health` | `/admin/van-hanh-du-lieu/feed-health` |
| Phiên giao dịch | `market-ops-sessions` | `/admin/van-hanh-du-lieu/sessions` |
| Giám sát tick thiếu | `market-ops-missing-ticks` | `/admin/van-hanh-du-lieu/missing-ticks` |
| Sửa thủ công | `market-ops-corrections` | `/admin/van-hanh-du-lieu/corrections` |

§8: `van-hanh-du-lieu` → `market-ops` (chưa khóa). Nginx invert EN→VI còn hiệu lực.

### Quản trị dữ liệu (5)

| Nhãn | routeKey | URL đang emit |
|---|---|---|
| Tác vụ ETL | `data-etl-jobs` | `/admin/du-lieu/etl-jobs` |
| Giám sát pipeline | `data-pipeline` | `/admin/du-lieu/pipeline` |
| Chất lượng DL | `data-quality` | `/admin/du-lieu/quality` |
| Từ điển dữ liệu | `data-dictionary` | `/admin/du-lieu/dictionary` |
| Đối soát | `data-reconciliation` | `/admin/du-lieu/reconciliation` |

§8: `du-lieu` → `data` (chưa khóa). Nginx: `/admin/data` **301 →** `/admin/du-lieu`.

### Metadata (4)

| Nhãn | routeKey | URL đang emit |
|---|---|---|
| Loại ngành | `metadata-sector-types` | `/admin/tham-so/sector-types` |
| Quản lý enum | `metadata-enums` | `/admin/tham-so/enums` |
| Kho giao diện | `metadata-themes` | `/admin/tham-so/themes` |
| Vòng đời chủ đề | `metadata-chu-de-lifecycle` | `/admin/tham-so/chu-de-lifecycle` |

§8: `tham-so` → `metadata` (chưa khóa). Leaf `chu-de-lifecycle` chưa khóa EN.

### Marketing (3)

| Nhãn | routeKey | URL đang emit |
|---|---|---|
| Thiết lập SEO hệ thống | `marketing-seo-system` | `/admin/tiep-thi/thiet-lap-seo-he-thong` |
| Thiết lập SEO từng trang | `marketing-seo-pages` | `/admin/tiep-thi/thiet-lap-seo-tung-trang` |
| Thiết lập nội dung Onboarding | `marketing-onboarding` | `/admin/tiep-thi/onboarding` |

§8: `tiep-thi` → `marketing` (chưa khóa). Leaf `thiet-lap-seo-*` chưa khóa EN.

### Trung tâm AI (5)

| Nhãn | routeKey | URL đang emit |
|---|---|---|
| Danh mục prompt | `ai-prompts` | `/admin/trung-tam-ai/prompts` |
| Chi tiết prompt | `ai-prompt-detail` | `/admin/trung-tam-ai/prompt-detail` |
| Nhật ký AI | `ai-logs` | `/admin/trung-tam-ai/logs` |
| Chi phí AI | `ai-cost` | `/admin/trung-tam-ai/cost` |
| Đánh giá chất lượng | `ai-quality` | `/admin/trung-tam-ai/quality` |

§8: `trung-tam-ai` → `ai` (chưa khóa). Nginx: `/admin/ai` **301 →** `/admin/trung-tam-ai`.

### Phân tích (4)

| Nhãn | routeKey | URL đang emit |
|---|---|---|
| Phân tích người dùng | `analytics-users` | `/admin/phan-tich/users` |
| Phân tích chủ đề | `analytics-chu-de` | `/admin/phan-tich/chu-de` |
| Phân tích doanh thu | `analytics-revenue` | `/admin/phan-tich/revenue` |
| Phễu chuyển đổi | `analytics-funnel` | `/admin/phan-tich/funnel` |

§8: `phan-tich` → `analytics` (chưa khóa). Leaf `chu-de` chưa khóa EN.

### Hướng dẫn (5)

| Nhãn | routeKey | URL đang emit |
|---|---|---|
| Checklist | `Admin-Design-system-hub` | `/Admin_Design_system/hub.html` |
| Thành phần UI | `Admin-Design-system-design-system` | `/Admin_Design_system/design-system.html` |
| Mẫu: Bảng | `Admin-Design-system-patterns-table-list` | `/Admin_Design_system/patterns/table-list.html` |
| Mẫu: Form | `Admin-Design-system-patterns-form-add` | `/Admin_Design_system/patterns/form-add.html` |
| Mẫu: Biểu đồ | `Admin-Design-system-patterns-charts` | `/Admin_Design_system/patterns/charts.html` |

Không đi qua `/admin/…`. Wave 1 không đụng. Chưa có quyết định URL English `/admin/…` cho 5 path này.

---

# 4. Đếm theo module URL hiện tại (94 chưa áp dụng)

| Segment đang dùng | Số mục menu |
|---|---|
| `he-thong` | 21 |
| `cong-dong` | 10 |
| `thi-truong` | 10 |
| `du-lieu` | 5 |
| `trung-tam-ai` | 5 |
| `Admin_Design_system` | 5 |
| `goi-cuoc` | 4 |
| `yeu-cau` | 4 |
| `thanh-vien` | 4 |
| `thong-bao` | 4 |
| `van-hanh-du-lieu` | 4 |
| `tham-so` | 4 |
| `phan-tich` | 4 |
| `tiep-thi` | 3 |
| `khach-hang` | 2 |
| `don-hang` | 2 |
| `cau-chuyen` | 2 |
| `tong-quan` | 1 |

---

# 5. Cái architecture làm được / không làm được (sau Wave 1)

**Làm được (đã có, chỉ 4 trang dùng):** `urlSegment` → `pathFor` → `hrefFor`; `legacySlugs` + `matchPath` → cùng `pageKey`; nginx serve EN + 301 VI; breadcrumb `trailFor`.

**Không có:** công tắc “toàn Admin sang English”. Không có locale engine. Không có việc group `urlSegment` tự áp mọi item trong group.

**Muốn hết `goi-cuoc` trên menu:** Owner chốt **OD-6** / **OD-7** trên [`04_Solution.md`](04_Solution.md) (và slug §8 nếu phủ EN). File này **không** ủy quyền việc đó.

---

# 6. Nguồn file

- Nav: `Admin_Design_system/iflux-admin-ui/iflux-admin-nav-registry.js`
- Route: `Admin_Design_system/iflux-admin-ui/iflux-admin-routes.js` (`hrefFor`, `PAGES[].slug`)
- Nginx: `infra/staging-1/iflux-staging-app.conf`
- Khóa phạm vi: [`01_BRD.md`](01_BRD.md) · [`04_Solution.md`](04_Solution.md) D-02 / D-04 / §8
