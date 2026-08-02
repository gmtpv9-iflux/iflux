# 02 — Context Audit: Admin Sector & Ecosystem Management Capability
**Task ID:** `010826_Admin_Sectors_Ecosystems_Capability`  
**Trạng thái:** `APPROVED (UPDATED — Code Audit Rev.2)`  
**Nguồn Dữ Liệu Quản Trị (SSoT):** `PostgreSQL Database (sectors, ecosystems)`  
**Ngày Cập nhật:** `2026-08-02`  

---

## 1. Current State (Khám phá Hiện trạng Thực tế)

### A. Database Layer (Lớp Cơ sở Dữ liệu)
- **Cấu trúc 12 trường dữ liệu chuẩn:** Bảng `sectors` và `ecosystems` trên PostgreSQL Production đã chuẩn hóa 12 trường (`id`, `code`, `slug`, `name_vi`, `description`, `display_order`, `icon_media_id`, `divisor`, `is_active`, `created_at`, `updated_at`, `deleted_at`).
- **Ràng buộc & Index:**
  - `code` có ràng buộc `UNIQUE` (`sectors_code_key`, `ecosystems_code_key`).
  - `slug` hỗ trợ Nullable và có ràng buộc `UNIQUE` (`sectors_slug_key`, `ecosystems_slug_key`).
  - Có Index hiệu năng `idx_sectors_deleted_display` và `idx_ecosystems_deleted_display` cho query điều kiện `deleted_at IS NULL ORDER BY display_order ASC`.
- **Ràng buộc Khóa ngoại (Foreign Keys):** `stocks.sector_id` tham chiếu `sectors.id`, `stocks.ecosystem_id` tham chiếu `ecosystems.id`. Không phát sinh bản ghi mồ côi (`orphan_sector_fk = 0`, `orphan_eco_fk = 0`).

### B. Backend API Layer (Lớp Xử lý Máy chủ)
- **REST Endpoints hiện có:**
  - **Sector Admin:** `GET /api/admin/sectors`, `POST /api/admin/sectors`, `GET /api/admin/sectors/:id`, `PATCH /api/admin/sectors/:id`, `DELETE /api/admin/sectors/:id`.
  - **Ecosystem Admin:** `GET /api/admin/ecosystems`, `POST /api/admin/ecosystems`, `GET /api/admin/ecosystems/:id`, `PATCH /api/admin/ecosystems/:id`, `DELETE /api/admin/ecosystems/:id`, `POST /api/admin/ecosystems/:id/activate`, `POST /api/admin/ecosystems/:id/deactivate`.
  - **Public Read:** `GET /api/market/sectors`, `GET /api/market/ecosystems`.

- **⚠️ Logic Delete thực tế (Code Audit):**
  - `sectors-admin.service.js` → `deleteSector()` thực thi **Hard Delete** (`DELETE FROM sectors WHERE id = $1`), kèm kiểm tra `stock_count > 0` trước khi xóa.
  - `ecosystems-admin.service.js` → `deleteEcosystem()` thực thi **Hard Delete**: gỡ liên kết stocks (`UPDATE stocks SET ecosystem_id = NULL`) rồi `DELETE FROM ecosystems WHERE id = $1`.
  - **Kết luận:** Cả 2 module đang xóa vĩnh viễn (Hard Delete), **KHÔNG** phải Soft Delete như mong muốn của BR.

- **⚠️ Hàm restoreSector đã tồn tại nhưng chưa hoạt động (Code Audit):**
  - `sectors-admin.service.js` dòng 132-142: Hàm `restoreSector(id)` đã được viết, kiểm tra unique `code` trên tập active (`deleted_at IS NULL`), rồi set `deleted_at = NULL, is_active = TRUE`.
  - Tuy nhiên, `sectors-admin.routes.js` **KHÔNG đăng ký** route `POST /:id/restore` nên hàm này không thể gọi được qua API.
  - `ecosystems-admin.service.js` **KHÔNG có** hàm `restoreEcosystem`.

- **⚠️ mapRow thiếu trường dữ liệu (Code Audit):**
  - Hàm `mapRow()` ở cả 2 service chỉ trả về **8 trường**: `id`, `code`, `name_vi`, `divisor`, `is_active`, `stock_count`, `created_at`, `updated_at`.
  - **Thiếu hoàn toàn 4 trường:** `slug`, `description`, `display_order`, `icon_media_id`.
  - Trường `deleted_at` cũng không được trả về → Frontend không biết bản ghi nào đã bị xóa mềm.
  - Ecosystem có thêm trường `tickers` (danh sách mã cổ phiếu liên kết).

- **⚠️ Không lọc theo `deleted_at` (Code Audit):**
  - `listSectors()` và `listEcosystems()` **không có** điều kiện `WHERE deleted_at IS NULL` → nếu có bản ghi xóa mềm trong DB, chúng vẫn xuất hiện trong danh sách.
  - Không hỗ trợ tham số `include_deleted` để lọc riêng bản ghi đã xóa.
  - Kiểm tra trùng `code` khi tạo mới (`createSector`, `createEcosystem`) kiểm tra trên **toàn bộ** bản ghi bao gồm cả đã xóa mềm, có thể gây xung đột không cần thiết.

- **⚠️ ORDER BY không dùng `display_order` (Code Audit):**
  - Code hiện tại: `ORDER BY s.name_vi ASC` (sectors) và `ORDER BY e.name_vi ASC` (ecosystems).
  - Database có index hỗ trợ `display_order` nhưng code không sử dụng.

- **⚠️ Không nhất quán cơ chế bật/tắt trạng thái (Code Audit):**
  - **Sectors:** Bật/tắt qua `PATCH /:id` với `{status: 'active/inactive'}`, dùng permission `market.sectors.edit`.
  - **Ecosystems:** Có 2 endpoint riêng `POST /:id/activate` (permission `market.ecosystems.status_active`) và `POST /:id/deactivate` (permission `market.ecosystems.status_inactive`), cùng hàm `setEcosystemStatus()` riêng biệt.

### C. Frontend UI & Navigation Layer (Lớp Giao diện & Điều hướng)
- **Menu Navigation:** Đã đăng ký trong `iflux-admin-nav-registry.js` thuộc nhóm **"Thị trường"**:
  - `Quản lý ngành`: routeKey `market-sectors-index` (`/admin/thi-truong/sectors`).
  - `Hệ sinh thái`: routeKey `market-ecosystems-index` (`/admin/thi-truong/ecosystems`).
- **Route Mapping:** Đăng ký trong `iflux-admin-routes.js` trỏ đến `market/sectors/index.html` và `market/ecosystems/index.html`.
- **RBAC Guard:** Đã đăng ký trong `admin-rbac-client.js` cho quyền `market.sectors.view` và `market.ecosystems.view`.

- **⚠️ Hiện trạng Frontend UI (Code Audit):**
  - `market-sectors-page.js` (321 dòng): Có CRUD đầy đủ + inline edit divisor + toggle trạng thái + search debounce 250ms. Sử dụng `ix-chip`, `ixToast`, `ixOpenModal`, `ixCloseModal` đúng quy chuẩn reuse.
  - `market-ecosystems-page.js` (287 dòng): Có CRUD đầy đủ + quản lý tickers + toggle qua activate/deactivate + search + filter theo status. Sử dụng UI components chuẩn.
  - **Cả 2 trang đều KHÔNG có:** Hiển thị bản ghi đã xóa mềm, nút Khôi phục, chip trạng thái "Đã xóa".
  - Thông báo xác nhận xóa ghi "Không hoàn tác" — phù hợp với thực tế hiện tại (Hard Delete).

---

## 2. Ownership & Data Flow Discovery Matrix (Khám phá Quyền Sở Hữu Dữ Liệu)

| Vai trò Kiến trúc | Thành phần đảm nhiệm hiện tại | Loại tác động | Trạng thái Tuân thủ SoT |
| :--- | :--- | :--- | :---: |
| **Business Source of Truth (BSSoT)** | PostgreSQL (`sectors`, `ecosystems`) | SSoT lưu trữ gốc | **✅ Đạt** |
| **Exclusive Writer** | Admin API (`sectors-admin.service.js`, `ecosystems-admin.service.js`) | Lực lượng duy nhất có quyền INSERT/UPDATE/DELETE | **✅ Đạt** |
| **Exclusive Reader** | Market API (`/api/market/sectors`, `/api/market/ecosystems`) | Lực lượng duy nhất cung cấp dữ liệu đọc công khai | **✅ Đạt** |
| **UI Consumer** | Admin UI & User Web Controllers | Đọc & hiển thị dữ liệu (Consumer thuần túy) | **✅ Đạt** |

---

## 3. Dependency Discovery (Khám phá Phụ thuộc Module)

| Component / Module | Mối quan hệ với Sector / Ecosystem | Loại tác động | Luồng Dữ liệu |
| :--- | :--- | :--- | :--- |
| **Post Editor / Content** | Đính kèm taxonomy ngành vào bài viết | Đọc (Reader) | Đọc công khai qua Market API |
| **Stock Service** | Liên kết cổ phiếu với `sector_id` & `ecosystem_id` | Đọc (Reader) / Liên kết FK | Tham chiếu FK PostgreSQL |
| **RSS Ingest Service** | Phân loại tin tức tự động | Đọc (Reader) | Đọc qua Market API (0 write path) |
| **Market Heatmap / Ranking** | Thống kê hiệu suất theo ngành & hệ sinh thái | Đọc (Reader) | Đọc công khai qua Market API |
| **Search & Filter** | Bộ lọc danh mục tìm kiếm | Đọc (Reader) | Đọc công khai qua Market API |

---

## 4. Gap Analysis (Bảng Phân Tích Lỗ Hổng Hiện Trạng)

| # | Hạng mục Nghiệp vụ | Yêu cầu Nghiệp vụ (BR) | Hiện trạng Khảo sát (Code Audit) | Lỗ hổng (Gap) | Mức độ |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **GAP-01** | **Xóa có điều kiện (Conditional Hard Delete)** | Chặn Xóa nếu `reference_count > 0` (yêu cầu sang `Inactive`); Cho phép Hard Delete khi `reference_count == 0` | `deleteSector` chặn khi `stock_count > 0`. Nhưng `deleteEcosystem` tự động set FK `stocks.ecosystem_id = NULL` để Hard Delete ngay cả khi có stocks liên kết. Chưa kiểm tra bài viết/dữ liệu khác. | **SAI LOGIC CHẶN XÓA:** Ecosystems tự ý gỡ FK để Hard Delete trái quy tắc BR. Chưa kiểm tra tham chiếu bài viết. | 🔴 |
| **GAP-02** | **Quản lý Trạng thái (Active/Inactive)** | Hỗ trợ toggling 2 trạng thái `Active`/`Inactive` chuẩn trên UI & API | `is_active` có trong DB. Sector toggles qua `PATCH`, Ecosystems toggle qua `activate`/`deactivate`. | **KHÔNG NHẤT QUÁN** API route toggle trạng thái giữa 2 module | 🟠 |
| **GAP-03** | **Trả đầy đủ trường dữ liệu** | Admin UI hiển thị đầy đủ thông tin (slug, description, display_order, icon) | `mapRow()` chỉ trả 8/12 trường. Thiếu: `slug`, `description`, `display_order`, `icon_media_id`. | **THIẾU** 4 trường dữ liệu trong API response | 🟠 |
| **GAP-04** | **Sắp xếp theo display_order** | Ưu tiên sắp xếp theo `display_order ASC`, `name_vi ASC` | Code sắp xếp theo `name_vi ASC` duy nhất. Index DB hỗ trợ nhưng code không dùng. | **SAI** thứ tự sắp xếp | 🟠 |
| **GAP-05** | **Kiểm tra trùng Unique (code/slug)** | Check unique code/slug trên tập bản ghi | List/Create hiện tại không lọc trạng thái `deleted_at`. | **CẦN CHUẨN HÓA** logic query unique | 🟡 |
| **GAP-06** | **Nhất quán cơ chế toggle** | Bật/tắt trạng thái thống nhất giữa 2 module | Sectors dùng `PATCH`, Ecosystems dùng endpoint riêng `activate/deactivate` | **KHÔNG NHẤT QUÁN** cơ chế toggle | 🟡 |
| **GAP-07** | **Governing SoT Document** | Tài liệu SoT độc lập cho capability | Đã gắn comment trong code, chưa có tài liệu SoT độc lập. | **THIẾU** (đã giải quyết tại file 03) | ✅ Đã xử lý |
| **GAP-08** | **Audit Logging** | Ghi nhận nhật ký tác nghiệp Admin | Backend thực thi lệnh DB nhưng chưa có bộ ghi vết nhật ký tác nghiệp Admin. | **THIẾU** nhật ký ghi vết thao tác Admin | 🟡 |

---

## 5. Reuse Analysis (Khảo sát Khả năng Tái Sử Dụng Capability)

Audit hệ thống Admin Design System để đảm bảo **100% Reuse, Zero Duplicate Capability**:

| Capability Reusable | Thành phần có sẵn trong Hệ thống | Trạng thái Tái sử dụng |
| :--- | :--- | :---: |
| **DataTable Framework** | Class `ix-table`, `ix-table-wrap`, `ix-table-toolbar` | **Reuse 100%** |
| **CRUD Form Modal** | Component `ix-modal-overlay`, `ixOpenModal()`, `ixCloseModal()` | **Reuse 100%** |
| **Notification Toast** | Utility `ixToast(msg, type)` | **Reuse 100%** |
| **Status Chip Badge** | Component `ix-chip-success`, `ix-chip-secondary` | **Reuse 100%** |
| **Search Box & Debounce** | Event listener input search kết hợp `setTimeout` 250ms | **Reuse 100%** |
| **Auth & Permission Guard** | Middleware `adminAuthMw` (Backend) & `canPerm()` (Frontend RBAC) | **Reuse 100%** |

---

## 6. Out of Scope (Phạm vi Không Khảo sát)

Các hạng mục sau không thuộc phạm vi khảo sát và xử lý của Task này:
1. **Notification System:** Hạ tầng phát sóng thông báo đẩy.
2. **Media Asset Upload Pipeline:** Hạ tầng upload và xử lý file hình ảnh/media gốc.
3. **SEO Canonical Routing:** Cấu hình routing SEO cấp sâu.
4. **Billing & Payment:** Hạ tầng thanh toán và đăng ký gói cước.

---

## 7. Discovery Evidence (Bằng chứng Khám phá Thực tế)

### A. Output Database Schema (`\d sectors` & `\d ecosystems`):
```text
                                        Table "public.sectors"
    Column     |           Type           | Collation | Nullable |               Default               
---------------+--------------------------+-----------+----------+-------------------------------------
 id            | integer                  |           | not null | nextval('sectors_id_seq'::regclass)
 code          | character varying(20)    |           | not null | 
 name_vi       | character varying(100)   |           | not null | 
 divisor       | numeric(20,6)            |           | not null | 1
 created_at    | timestamp with time zone |           |          | now()
 is_active     | boolean                  |           | not null | true
 updated_at    | timestamp with time zone |           | not null | now()
 slug          | character varying(100)   |           |          | 
 description   | text                     |           |          | 
 display_order | integer                  |           | not null | 0
 icon_media_id | text                     |           |          | 
 deleted_at    | timestamp with time zone |           |          | 
Indexes:
    "sectors_pkey" PRIMARY KEY, btree (id)
    "idx_sectors_deleted_display" btree (deleted_at, display_order, name_vi)
    "idx_sectors_is_active" btree (is_active)
    "sectors_code_key" UNIQUE CONSTRAINT, btree (code)
    "sectors_slug_key" UNIQUE CONSTRAINT, btree (slug)
```

### B. Audit Code Base — Backend Service (Bằng chứng Code Thực tế):

**Sectors Hard Delete** ([`sectors-admin.service.js` dòng 122-130](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/market/sectors-admin.service.js#L122-L130)):
```javascript
async function deleteSector(id) {
  const current = await getSector(id);
  if (!current) throw AppError.notFound('Không tìm thấy ngành');
  if (current.stock_count > 0) {
    throw AppError.badRequest('SECTOR_HAS_STOCKS', 'Ngành còn mã cổ phiếu — hãy gỡ gắn trước khi xóa');
  }
  await query('DELETE FROM sectors WHERE id = $1', [id]);
  return { deleted: true, id: Number(id) };
}
```

**Ecosystems Hard Delete** ([`ecosystems-admin.service.js` dòng 180-186](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/market/ecosystems-admin.service.js#L180-L186)):
```javascript
async function deleteEcosystem(id) {
  const current = await getEcosystem(id);
  if (!current) throw AppError.notFound('Không tìm thấy hệ sinh thái');
  await query('UPDATE stocks SET ecosystem_id = NULL WHERE ecosystem_id = $1', [id]);
  await query('DELETE FROM ecosystems WHERE id = $1', [id]);
  return { deleted: true, id: Number(id) };
}
```

**Sectors mapRow thiếu trường** ([`sectors-admin.service.js` dòng 17-31](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/market/sectors-admin.service.js#L17-L31)):
```javascript
function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id, code: row.code, name: row.name_vi, name_vi: row.name_vi,
    divisor: Number(row.divisor), status: row.is_active ? 'active' : 'inactive',
    is_active: !!row.is_active, stock_count: Number(row.stock_count) || 0,
    created_at: row.created_at, updated_at: row.updated_at || row.created_at
    // THIẾU: slug, description, display_order, icon_media_id, deleted_at
  };
}
```

**restoreSector tồn tại nhưng chưa đăng ký route** ([`sectors-admin.service.js` dòng 132-142](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/market/sectors-admin.service.js#L132-L142)):
```javascript
async function restoreSector(id) {
  const current = await getSector(id);
  if (!current) throw AppError.notFound('Không tìm thấy ngành');
  const dup = await query('SELECT id FROM sectors WHERE code = $1 AND id <> $2 AND deleted_at IS NULL', [current.code, id]);
  if (dup.rows[0]) throw AppError.conflict('DUPLICATE', 'Mã ngành đã tồn tại');
  await query('UPDATE sectors SET deleted_at = NULL, is_active = TRUE, updated_at = NOW() WHERE id = $1', [id]);
  return getSector(id);
}
// Route file KHÔNG có: router.post('/:id/restore', ...)
```

### C. Audit Code Base — Navigation:
- **`iflux-admin-nav-registry.js` (Line 186-187):**
  ```javascript
  { type: 'item', key: "market-ecosystems-index", routeKey: "market-ecosystems-index", label: "Hệ sinh thái", icon: "ti-hierarchy-2", badge: "···" },
  { type: 'item', key: "market-sectors-index", routeKey: "market-sectors-index", label: "Quản lý ngành", icon: "ti-chart-dots-3", badge: "···" },
  ```

### D. Audit Evidence — Ma Trận Tham Chiếu Cấu Trúc Dữ Liệu (Reference Audit Evidence):

Khảo sát toàn bộ Database Schema (`migrations/*.sql`) và Codebase Service Layer (`backend/src/modules/`), kết quả Audit xác nhận chính thức:

1. **Thành phần Tham chiếu 1: Cổ phiếu (`stocks`)**
   - **Cấu trúc lưu trữ:** Bảng `stocks` trên PostgreSQL có 2 cột Foreign Key trực tiếp:
     - `stocks.sector_id` tham chiếu `sectors(id)` (Khai báo tại `migrations/001_init.sql` L25).
     - `stocks.ecosystem_id` tham chiếu `ecosystems(id)` (Khai báo tại `migrations/001_init.sql` L26).
   - **Truy vấn đếm tham chiếu (Audit Query):**
     - Sector stock count: `SELECT COUNT(*)::int FROM stocks WHERE sector_id = $1`
     - Ecosystem stock count: `SELECT COUNT(*)::int FROM stocks WHERE ecosystem_id = $1`

2. **Thành phần Tham chiếu 2: Bài viết & Tin tức (`community_posts`)**
   - **Cấu trúc lưu trữ:** Bảng `community_posts` (Khai báo tại `migrations/004_community_posts.sql`) lưu thuộc tính dưới dạng `JSONB` tại cột `payload`.
   - **Đặc tả trường:**
     - Sector tags: `payload->'sectors'` là một `JSONB` array chứa danh sách `code` hoặc `slug` của các sector liên kết (xử lý tại `community-articles.service.js` L75 & L112).
     - Ecosystem tags: `payload->'ecosystems'` là một `JSONB` array chứa danh sách `code` hoặc `slug` của các ecosystem liên kết (xử lý tại `community-articles.service.js` L76 & L113).
   - **Truy vấn đếm tham chiếu (Audit Query):**
     - Sector post count: `SELECT COUNT(*)::int FROM community_posts WHERE EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(payload->'sectors', '[]'::jsonb)) s(val) WHERE s.val = $code OR s.val = $slug)`
     - Ecosystem post count: `SELECT COUNT(*)::int FROM community_posts WHERE EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(payload->'ecosystems', '[]'::jsonb)) e(val) WHERE e.val = $code OR e.val = $slug)`

3. **Khảo sát các Module khác (Other Modules Audit):**
   - `meta_sector_types` (trong module `metadata`): Là bảng phân loại danh mục metadata độc lập, **không có FK hay tham chiếu** tới `sectors.id`.
   - `community_comments`, `user_profile`, `watchlist_items`, `alerts`: **Không có FK hay tham chiếu** trực tiếp tới `sectors` hay `ecosystems`.
   - **Kết luận Audit:** Chỉ có **đúng 2 bảng** trong toàn bộ Database phát sinh tham chiếu dữ liệu tới Sector/Ecosystem là `stocks` (FK `INT`) và `community_posts` (`JSONB array`).

---