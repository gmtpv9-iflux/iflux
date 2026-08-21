# 06 — Audit Admin URL vs Governance_URL_Architecture

| Field | Value |
|---|---|
| Date | 2026-08-20 |
| Scope | Toàn bộ URL Admin (không User Web, không API identity) |
| SoT | [`Governance_URL_Architecture.md`](../Governance_URL_Architecture.md) §2.2 |
| Status | **BÁO CÁO — chưa mở wave migrate các module còn lại** |

---

## 1. Kết luận

Governance §2.2: **Admin URL phải tiếng Anh.** Nhãn menu được tiếng Việt. URL ≠ Page Identity. Leftover được 301, không xóa string.

**Writer URL Admin** = `IfluxAdminNavRegistry.pathFor()`. Sidebar đã English `urlSegment`. Staging Express `@admin_ia` 301 mọi leftover slug về `pathFor()`.

**Sau Task 05 (slice này):**

| Nhóm | Canonical | leftover VI |
|---|---|---|
| Quản lý Tin tức + RSS | `/admin/news/*` | `/admin/cong-dong/*` 301 |
| Kiểm duyệt Cộng đồng | `/admin/community/comments` · `topic-moderation` · `reports` | `/admin/cong-dong/comments` v.v. 301 |

`pathFor()` **0 URL tiếng Việt**. `cong-dong` không còn là canonical Admin.

**Chưa tuân §2.2:** hầu hết module Admin khác vẫn để **slug VI trong `iflux-admin-routes.js`**. Staging đã 301 về English. Production nginx **đảo chiều** — 301 English → VI và Page-serve VI.

Wave này **không** migrate `tong-quan`, `khach-hang`, `thi-truong`, … Chờ Owner mở.

---

## 2. Vì sao Admin từng còn `cong-dong`?

Không phải vì Governance cho phép localize Admin. Đó là leftover tiếng Việt (cùng họ `tong-quan`, `khach-hang`). Task 04 chỉ khóa path trong phạm vi Task 04 — không khóa module, không khóa Task 05.

Canonical đúng = **`/admin/news`**, không phải `/admin/tin-tuc`.

---

## 3. Slice đã làm (Task 05)

| Page | Canonical | Leftover (giữ string) |
|---|---|---|
| Danh sách bài viết | `/admin/news/articles` | `/admin/cong-dong`, `/admin/cong-dong/danh-sach-bai-viet`, `/admin/cong-dong/content`, `/admin/community`, `/admin/community/articles` |
| Danh mục | `/admin/news/categories` | `/admin/cong-dong/categories` |
| Chủ đề (Tin tức) | `/admin/news/topics` | `/admin/cong-dong/danh-sach-chu-de`, `/admin/chu-de/registry` |
| Sửa bài | `/admin/news/edit` | `/admin/cong-dong/content/edit` |
| Tác giả | `/admin/news/authors` | `/admin/cong-dong/danh-sach-tac-gia` |
| Chuyên gia | `/admin/news/experts` | `/admin/cong-dong/experts` |
| RSS | `/admin/news/rss-sources` · `rss-category-sync` · `rss-article-schema` | `/admin/cong-dong/nguon-rss` v.v. |
| Kiểm duyệt bình luận | `/admin/community/comments` | `/admin/cong-dong/comments` |
| Kiểm duyệt chủ đề | `/admin/community/topic-moderation` | `/admin/cong-dong/chu-de-moderation` |
| Báo cáo | `/admin/community/reports` | `/admin/cong-dong/reports` |

Không đổi: folder `Admin_Design_system/app/community/`, RBAC `community.*`, API `/api/community` / `/admin/community-ops`.

---

## 4. Inventory — slug VI còn trong Route Registry

Nguồn: `iflux-admin-routes.js` field `slug` (115 page). Writer thật = `pathFor()` (English). Slug VI = leftover / bookmark / Production Page-serve.

### 4.1 Module còn slug VI (90 entry)

| Segment slug (VI) | Canonical `pathFor()` | Số page | Ghi chú |
|---|---|---|---|
| `/admin/tong-quan` | `/admin/overview` | 1 | Staging đã 301 |
| `/admin/khach-hang/*` | `/admin/users/*` | 2 | |
| `/admin/thi-truong/*` | `/admin/market/*` | 12 | Kèm segment `dong-bo-cau-truc-co-phieu`, `cau-hinh-thoi-gian`, `lich-su-dong-bo` |
| `/admin/van-hanh-du-lieu/*` | `/admin/data-operations/*` | 4 | |
| `/admin/du-lieu/*` | `/admin/data/*` hoặc `/admin/market/data-sources` | 6 | |
| `/admin/goi-cuoc/*` | `/admin/subscriptions/*` · entitlements → `/admin/users/entitlements` | 3 | |
| `/admin/don-hang/*` | `/admin/orders/*` | 4 | |
| `/admin/thanh-vien/*` | `/admin/membership/*` | 6 | Segment con `ma-list`, `ma-them`, `ma-su-dung` |
| `/admin/thong-bao/*` | `/admin/notifications/*` | 4 | |
| `/admin/he-thong/*` | mixed `/admin/interface/*` + `/admin/system/*` | 22 | DS Studio + SLA + audit |
| `/admin/tham-so/*` | `/admin/metadata/*` | 4 | `chu-de-lifecycle` → `topic-lifecycle` |
| `/admin/tiep-thi/*` | `/admin/marketing/*` | 4 | `thiet-lap-seo-*` → `seo/system`, `seo/pages` |
| `/admin/cau-chuyen/*` | `/admin/topics/*` | 2 | `danh-sach`, `chi-tiet` |
| `/admin/chu-de/*` | `/admin/topics/*` | 3 | Knowledge Story — khác Tin tức `/admin/news/topics` |
| `/admin/trung-tam-ai/*` | `/admin/ai/*` | 5 | |
| `/admin/phan-tich/*` | `/admin/analytics/*` | 4 | `chu-de` → `topics` |
| `/admin/yeu-cau/*` | `/admin/requests/*` | 4 | |

### 4.2 Đã English (không vi phạm §2.2)

| Canonical | Ghi chú |
|---|---|
| `/admin/overview` | Nav |
| `/admin/users/*` | Nav |
| `/admin/orders/*` | Nav |
| `/admin/news/*` | **Task 05 — vừa khóa** |
| `/admin/community/comments` · `topic-moderation` · `reports` | Community moderation — English, giữ cho sản phẩm Community |
| `/admin/administrators/*` | Wave 1 đã English |
| `/admin/market/*` · `/admin/data-operations/*` · `/admin/subscriptions/*` · `/admin/membership/*` · `/admin/notifications/*` · `/admin/interface/*` · `/admin/system/*` · `/admin/metadata/*` · `/admin/marketing/*` · `/admin/ai/*` · `/admin/analytics/*` · `/admin/requests/*` · `/admin/topics/*` | Nav English; slug VI vẫn leftover |

### 4.3 Login

| Env | Canonical thực tế | Vi phạm |
|---|---|---|
| Staging | `/admin/login` · leftover `/admin/dang-nhap` 301 | Không |
| Production nginx | `/admin/dang-nhap` · English `/admin/login` **301 về VI** | **Có — đảo Governance** |

---

## 5. Production nginx — đảo chiều Governance

File: `infra/nginx-iflux-production-locations.conf`

Production **không** dùng Express `@admin_ia`. Đang:

1. 301 **English → Vietnamese** (`/admin/community` → `/admin/cong-dong`, `/admin/users` → `/admin/khach-hang`, `/admin/overview` không tồn tại — `/admin/dashboard` → `/admin/tong-quan`).
2. Page-serve HTML từ slug VI (`/admin/cong-dong` → `app/community/`).

Đây là **ngược §2.2**. Staging đã đúng hướng (leftover VI → English).

**Không sửa Production trong wave này.** Khi Owner mở Production: đảo leftover 301 + đưa Admin qua `@admin_ia` (hoặc tương đương), không Page-serve VI.

---

## 6. Staging — leftover shortcut nginx

`infra/staging-1/iflux-staging-app.conf` — vài `=` 301 trước Express. Đã cập nhật:

| Leftover | Canonical |
|---|---|
| `/admin/cong-dong` | `/admin/news/articles` |
| `/admin/cong-dong/content` | `/admin/news/articles` |
| `/admin/chu-de/registry` | `/admin/news/topics` |

Các leftover `/admin/cong-dong/*` còn lại do Express `matchPath` + `pathFor()` 301.

---

## 7. Ngoài phạm vi báo cáo này

- Folder vật lý `app/community/`, `danh-sach-bai-viet.html` — không phải URL Admin.
- API `/admin/community-ops`, `/api/community` — identity API, wave riêng.
- Permission `community.articles.*` — không phải URL.
- User Web `/tin-tuc` — §2.1 cho phép localize.

---

## 8. Đề xuất wave sau (chờ Owner)

1. **P0 Production:** khi mở deploy Production — đảo nginx English→VI, canonical = `pathFor()`.
2. **P1 Route slug:** đổi field `slug` trong `iflux-admin-routes.js` cho 17 segment VI ở §4.1 thành English (giống slice Tin tức). Leftover giữ. Staging gần như đã 301 sẵn.
3. **Không** gộp `/admin/chu-de` (Câu chuyện / Knowledge) vào `/admin/news/topics`.

Không implement §8 trừ khi Owner mở.
