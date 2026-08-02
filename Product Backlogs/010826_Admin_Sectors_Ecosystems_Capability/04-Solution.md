# 04 - Technical Solution: Admin Sector & Ecosystem Management Capability
**Task ID:** `010826_Admin_Sectors_Ecosystems_Capability`  
**Trạng thái:** `Solution Approved (Governance Compliant Design)`  
**Tài Liệu Quản Trị Chi Phối:** [`03-Governing-SoT.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/03-Governing-SoT.md)  
**Ngày Cập nhật:** `2026-08-02`  

---

## 1. Compliance Statement (Cam Kết Tuân Thủ Governing SoT)

Giải pháp Kỹ thuật này tuân thủ 100% các Ràng buộc (`GCN-01..05`), Quy tắc (`GR-01..05`) và Quyết định Quản trị (`NGD-01..05`) đã chốt tại [`03-Governing-SoT.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/03-Governing-SoT.md):

- **GCN-01 & GR-01 & GR-02:** Tuyệt đối không tạo Data Owner mới. API là Business SoT.
- **GCN-02 & GCN-03:** Bảo vệ nguyên vẹn Contract Public API và Database Schema 12 trường.
- **GCN-04 & GR-05:** Tái sử dụng 100% UI component sẵn có.
- **NGD-01:** Thống nhất cơ chế Quản lý Trạng thái (`Active`/`Inactive`) bằng `PATCH /api/admin/.../:id` chuẩn RESTful cho cả Sector và Ecosystem.
- **NGD-02:** Thực thi Quy tắc Xóa có điều kiện (Conditional Hard Delete) đóng gói trong Transaction Boundary an toàn.
- **NGD-03:** Expose đầy đủ các trường dữ liệu DTO phục vụ Admin UI (`slug`, `description`, `display_order`, `icon_media_id`, `stock_count`, `post_count`).
- **NGD-04:** Sửa ORDER BY dùng `display_order ASC, name_vi ASC`.
- **NGD-05:** Chuẩn hóa Unique Validation cho `code` và `slug`.

---

## 2. Architecture Diagram & Layering (Kế Thừa Kiến Trúc Codebase)

```text
[ Admin UI / Consumer ] (Sidebar Navigation + RBAC Permission Guard + ix-table / ix-modal)
        │
        ▼ (HTTP REST API Request)
[ Admin Router (Express) ] ── (adminAuthMw + RBAC Guard)
        │
        ▼
[ Admin Service (Business Logic) ] ── (Unique Validation, Search/Filter, DTO Mapping, Transaction Boundary Delete)
        │
        ▼
[ Core Database Connection ]
        │
        ▼ (Single DB Transaction with Concurrency Control)
[ PostgreSQL Database (sectors, ecosystems) ] ── (Primary Business SSoT)
```

---

## 3. Solution Decisions Matrix (Bảng Quyết Định Giải Pháp)

| Quyết Định | Phương Án Chọn | Phương Án Bỏ Qua | Lý Do Chọn Giải Pháp |
| :--- | :--- | :--- | :--- |
| **SD-01** | **Quản lý Trạng thái 2 mức (`Active` / `Inactive`)** | Soft Delete phức tạp (`deleted_at` timestamp) | Đơn giản hóa kiến trúc, khớp trực tiếp với cột `is_active` có sẵn trong DB, ẩn khỏi Public App nhưng vẫn bảo tồn liên kết dữ liệu. |
| **SD-02** | **Xóa có điều kiện (Conditional Hard Delete) có Transaction Boundary** | Khôi phục Restore flow hoặc xóa không bảo vệ transaction | Đảm bảo tính toàn vẹn tham chiếu và chống race-condition. Chặn xóa khi `reference_count > 0` và yêu cầu chuyển sang `Inactive`. Chỉ Hard Delete khi `reference_count == 0`. |
| **SD-03** | **Tái sử dụng `ix-modal` & `ix-table`** | Xây dựng UI Component mới | Tuân thủ `GCN-04`, `GR-05`. |
| **SD-04** | **Validation tại Service Layer** | Validation thuần tại Client UI | Business Validation thuộc Backend, ngăn bypass qua API direct call. |
| **SD-05** | **Bổ sung đầy đủ DTO Fields (`stock_count` & `post_count`)** | Bỏ `post_count` hoặc trả response thiếu trường | Đáp ứng 100% Business Requirement: Admin UI hiển thị đầy đủ số lượng cổ phiếu và bài viết liên kết. |
| **SD-06** | **Chuẩn hóa Endpoint Toggle Status qua REST `PATCH`** | Dùng riêng lẻ endpoint activate/deactivate không thống nhất | Thống nhất 100% chuẩn RESTful dùng `PATCH /api/admin/sectors/:id` và `PATCH /api/admin/ecosystems/:id` cho cả 2 module. |

---

## 4. Design Mapping (Ma Trận Ánh Xạ BR → Solution → NGD)

| Business Rule (BR) | Nguồn Trích Dẫn | NGD Xử Lý | Thiết Kế Giải Pháp Kiến Trúc |
| :--- | :--- | :---: | :--- |
| **BR-01 (Single SSoT & CRUD)** | `01-BR.md` §1 | — | PostgreSQL là SSoT, hỗ trợ trọn vẹn CRUD, Search, Filter & Status Toggle qua REST API. |
| **BR-02 (Consumer UI)** | `01-BR.md` §1 | — | Admin UI tiêu thụ dữ liệu qua REST API. Không tạo Data Owner. |
| **BR-03 (Status & Delete Rules)** | `01-BR.md` §3.3 | **NGD-01, NGD-02** | Trạng thái Active/Inactive qua `PATCH`; Chặn Hard Delete trong Single Transaction khi `reference_count > 0`; Cho phép Hard Delete khi `reference_count == 0`. |
| **BR-04 (Ordering)** | `01-BR.md` §3.4 | **NGD-04** | Sửa `ORDER BY display_order ASC, name_vi ASC`. |
| **BR-05 (Validation & Read Output)** | `01-BR.md` §3.5 | **NGD-03, NGD-05** | Unique check `code`/`slug`; DTO phản hồi trả đầy đủ 12 trường dữ liệu bao gồm `stock_count` và `post_count`. |

---

## 5. Backend Technical Design (Thiết Kế Chi Tiết Backend)

### A. Thiết kế Output DTO Chuẩn Cho Read List & Read Detail (NGD-03)

**Nguyên tắc Kiến trúc:**
Cả API Danh sách (`GET /api/admin/sectors`, `GET /api/admin/ecosystems`) và API Chi tiết (`GET /api/admin/sectors/:id`, `GET /api/admin/ecosystems/:id`) đều phản hồi cấu trúc DTO thống nhất, đáp ứng 100% yêu cầu hiển thị của Business Requirement:

#### Cấu trúc Entity DTO Contract:
```typescript
interface EntityDTO {
  id: number;
  code: string;
  slug: string | null;
  name: string;             // Alias name_vi
  name_vi: string;
  description: string | null;
  display_order: number;
  icon_media_id: string | null;
  divisor: number;
  status: 'active' | 'inactive';
  is_active: boolean;
  stock_count: number;     // Số lượng cổ phiếu liên kết (stocks.sector_id / ecosystem_id)
  post_count: number;      // Số lượng bài viết liên kết (community_posts JSONB)
  created_at: string;      // ISO Date
  updated_at: string;      // ISO Date
}
```

> **Cơ chế Tổng hợp Dữ liệu (Data Aggregation Mechanism):**  
> Tầng Service thực thi tổng hợp số lượng cổ phiếu (`stock_count`) từ liên kết FK `stocks` và số lượng bài viết (`post_count`) từ tham chiếu mảng JSONB `community_posts` để điền đầy đủ 2 trường chỉ số vào Output DTO của cả danh sách lẫn chi tiết.

---

### B. Phạm Vi Tìm Kiếm & Sắp Xếp Danh Sách — Search & Filter (NGD-04)

1. **Phạm vi Tìm kiếm (`q` Scope):**  
   Tham số tìm kiếm `q` thực hiện khớp chuỗi không phân biệt hoa thường (`ILIKE`) trên các trường:
   - `name_vi` (Tên tiếng Việt)
   - `code` (Mã danh mục)
   - `slug` (URL Slug)  
   *(Nếu `q` là chuỗi số khớp chính xác với `id`, kết quả tìm kiếm bao gồm cả bản ghi theo `id`)*.

2. **Lọc Trạng thái (`status` Filter):**
   - `status=active`: Lọc các bản ghi đang hoạt động (`is_active = TRUE`).
   - `status=inactive`: Lọc các bản ghi bị tạm ẩn (`is_active = FALSE`).

3. **Thứ tự Sắp xếp (Sort Order):**
   - Mặc định luôn sắp xếp theo `display_order ASC, name_vi ASC`.

---

### C. Quy Tắc Xóa Có Điều Kiện & Ranh Giới Giao Dịch (Transaction Boundary & Conditional Hard Delete - NGD-02)

#### 1. Khái niệm Nghiệp vụ (Business Concept):
* **`reference_count` (Tổng số tham chiếu dữ liệu):**  
  $$\text{reference\_count} = \text{References in Stocks (FK)} + \text{References in Community Posts (JSONB)}$$
* **Yêu cầu Kiến trúc:** Lớp Implementation phải tính toán Business Concept `reference_count` theo công thức trên dựa trên tất cả các nguồn dữ liệu đã Audit (§7.D).

#### 2. Nguyên tắc Ranh giới Giao dịch (Transaction Boundary Principle):
Luồng xử lý Delete bắt buộc phải đóng gói hoàn toàn bên trong một **Database Transaction Boundary**.

Transaction phải đảm bảo 5 yêu cầu cốt lõi:
- **Atomic:** Toàn bộ chuỗi kiểm tra và xóa thành công trọn vẹn hoặc thất bại hoàn toàn.
- **Isolation & Concurrency Control:** Ngăn chặn thao tác sửa đổi đồng thời (concurrent modification) để đảm bảo `reference_count` luôn được tính toán trên dữ liệu nhất quán.
- **Reference Validation:** Kiểm tra điều kiện `reference_count`.
- **Delete Execution:** Thực thi xóa vật lý (Hard Delete) khi `reference_count == 0`.
- **Automatic Rollback:** Tự động Rollback và hủy bỏ giao dịch khi `reference_count > 0` hoặc có lỗi phát sinh.

#### 3. Quy trình Giao dịch Chuẩn (Abstract Transaction Flow):
```text
BEGIN DB TRANSACTION
  │
  ├── 1. Khóa/bảo vệ bản ghi mục tiêu khỏi concurrent modification
  │
  ├── 2. Tính toán business concept reference_count trên các nguồn dữ liệu đã Audit (§7.D):
  │      reference_count = stock_references + post_references
  │
  ├── 3. Kiểm tra điều kiện xóa:
  │      IF reference_count > 0:
  │          ROLLBACK TRANSACTION
  │          Return Error (HAS_REFERENCES)
  │      ELSE:
  │          Execute Physical Delete
  │          COMMIT TRANSACTION
  │
END DB TRANSACTION
```

---

### D. Đặc Tả Endpoint Chuẩn Hóa RESTful & Chiến Lược Chuyển Đổi (Endpoint Specification & Migration Strategy - NGD-01)

#### 1. Chuẩn Hóa Kiến Trúc RESTful:
Tất cả các thao tác cập nhật thuộc tính bản ghi và chuyển đổi trạng thái (`is_active: true / false`) cho cả Sector và Ecosystem đều sử dụng một phương thức RESTful thống nhất: **`PATCH /api/admin/.../:id`**.

#### 2. Chiến Lược Chuyển Đổi Endpoint Ecosystems (Migration Strategy):
* **Target Endpoint (Chuẩn chính thức):** `PATCH /api/admin/ecosystems/:id` (cập nhật thông tin & `is_active: true/false`).
* **Phase 1 (Triển khai Task hiện tại):** 
  - Triển khai route chuẩn `PATCH /api/admin/ecosystems/:id` làm Endpoint chính thức cho Admin UI.
  - Giữ lại hai route legacy `POST /api/admin/ecosystems/:id/activate` và `POST /api/admin/ecosystems/:id/deactivate` dưới dạng **Legacy Endpoints** (chuyển hướng nội bộ tới handler `PATCH`) để đảm bảo không làm vỡ các client legacy.
* **Phase 2 (Kế hoạch dọn dẹp tương lai - Future Cleanup):** 
  - Đánh dấu Deprecated và xóa bỏ hoàn toàn hai endpoint legacy `POST /activate` và `POST /deactivate` trong một Task dọn dẹp riêng sau khi 100% client chuyển sang `PATCH`.

#### 3. Bảng Đặc Tả Endpoint Chuẩn Hóa:

##### A. Sector Admin Endpoints ([`sectors-admin.routes.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/market/sectors-admin.routes.js))
| Method | Path | Permission | Mô tả | Response Output |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/sectors` | `market.sectors.view` | Danh sách ngành (hỗ trợ `q`, `status`). | `{ success: true, data: EntityDTO[] }` |
| `POST` | `/api/admin/sectors` | `market.sectors.create` | Tạo ngành mới. | `{ success: true, data: EntityDTO }` |
| `GET` | `/api/admin/sectors/:id` | `market.sectors.view` | Chi tiết ngành theo ID. | `{ success: true, data: EntityDTO }` |
| `PATCH` | `/api/admin/sectors/:id` | `market.sectors.edit` | Cập nhật thông tin & Trạng thái (`is_active: true/false`). | `{ success: true, data: EntityDTO }` |
| `DELETE` | `/api/admin/sectors/:id` | `market.sectors.delete` | **Conditional Hard Delete** (Chặn xóa nếu `reference_count > 0`). | `{ success: true, data: { deleted: true, id: number } }` |

##### B. Ecosystem Admin Endpoints ([`ecosystems-admin.routes.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/market/ecosystems-admin.routes.js))
| Method | Path | Permission | Mô tả | Response Output |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/ecosystems` | `market.ecosystems.view` | Danh sách hệ sinh thái (hỗ trợ `q`, `status`). | `{ success: true, data: EntityDTO[] }` |
| `POST` | `/api/admin/ecosystems` | `market.ecosystems.create` | Tạo hệ sinh thái mới. | `{ success: true, data: EntityDTO }` |
| `GET` | `/api/admin/ecosystems/:id` | `market.ecosystems.view` | Chi tiết hệ sinh thái theo ID. | `{ success: true, data: EntityDTO }` |
| `PATCH` | `/api/admin/ecosystems/:id` | `market.ecosystems.edit` | **Standardized REST:** Cập nhật thông tin & Trạng thái. | `{ success: true, data: EntityDTO }` |
| `DELETE` | `/api/admin/ecosystems/:id` | `market.ecosystems.delete` | **Conditional Hard Delete** (Chặn xóa nếu `reference_count > 0`). | `{ success: true, data: { deleted: true, id: number } }` |
| `POST` | `/api/admin/ecosystems/:id/activate` | `market.ecosystems.status_active` | *(Legacy Endpoint - Retained in Phase 1)* Alias tới PATCH. | `{ success: true, data: EntityDTO }` |
| `POST` | `/api/admin/ecosystems/:id/deactivate` | `market.ecosystems.status_inactive` | *(Legacy Endpoint - Retained in Phase 1)* Alias tới PATCH. | `{ success: true, data: EntityDTO }` |

---

## 6. Admin Navigation & Authorization Integration Design (Thiết Kế Điều Hướng & Phân Quyền)

Để đáp ứng trọn vẹn Business Capability cho Admin UI, hệ thống tích hợp sẵn cấu trúc Menu Điều hướng và Guard Phân quyền RBAC:

### A. Ma Trận Điều Hướng Menu Admin (Navigation Matrix)
| Capability Module | Đường Dẫn Frontend (Route Path) | vị trí Sidebar Menu | Menu Key | Breadcrumb Path |
| :--- | :--- | :--- | :--- | :--- |
| **Sectors Capability** | `/admin/market/sectors` | Quản lý Thị trường $\rightarrow$ Ngành | `market.sectors` | Trang chủ $\rightarrow$ Quản lý Thị trường $\rightarrow$ Ngành |
| **Ecosystems Capability** | `/admin/market/ecosystems` | Quản lý Thị trường $\rightarrow$ Hệ sinh thái | `market.ecosystems` | Trang chủ $\rightarrow$ Quản lý Thị trường $\rightarrow$ Hệ sinh thái |

### B. RBAC Permission Mapping
- **Xem danh sách/chi tiết:** Cần quyền `market.sectors.view` / `market.ecosystems.view`.
- **Tạo mới bản ghi:** Cần quyền `market.sectors.create` / `market.ecosystems.create`.
- **Chỉnh sửa / Toggle Trạng thái:** Cần quyền `market.sectors.edit` / `market.ecosystems.edit`.
- **Thực thi Hard Delete:** Cần quyền `market.sectors.delete` / `market.ecosystems.delete`.

---

## 7. Frontend State Matrix (Ma Trận Trạng Thái Giao Diện)

| Trạng Thái UI | Điều Kiện Dữ Liệu | Hiển Thị Giao Diện | Thao Tác Khả Dụng |
| :--- | :--- | :--- | :--- |
| **Loading** | Đang gọi API list/detail | Skeleton row / Spinner loader | N/A |
| **Empty** | `items.length === 0` | Dòng thông báo *"Chưa có dữ liệu"* | Nút *"Thêm mới"* |
| **Normal (Active)** | `status === 'active'` | Dòng dữ liệu chuẩn + `ix-chip-success` "Hoạt động" (hiển thị `stock_count` & `post_count`) | Sửa, Chuyển Inactive, Xóa (nếu `reference_count = 0`) |
| **Normal (Inactive)** | `status === 'inactive'` | Dòng dữ liệu chuẩn + `ix-chip-secondary` "Tắt" (hiển thị `stock_count` & `post_count`) | Sửa, Bật Active, Xóa (nếu `reference_count = 0`) |
| **Error (Has Ref Delete)** | Nhấn Xóa bản ghi có `reference_count > 0` | `ixToast` màu vàng/đỏ báo lỗi | Chặn thao tác Xóa, hướng dẫn chọn Inactive |

---

## 8. Validation Rules & Error Mapping (Bảng Quy Tắc Validation & Lỗi)

| Quy Tắc | Điều Kiện Kiểm Tra | HTTP | Error Code | Thông Báo |
| :--- | :--- | :---: | :--- | :--- |
| **Unique Code** | `code` trùng bản ghi khác | `409` | `DUPLICATE` | *"Mã danh mục đã tồn tại trên hệ thống"* |
| **Unique Slug** | `slug` trùng bản ghi khác | `409` | `DUPLICATE` | *"Slug danh mục đã tồn tại trên hệ thống"* |
| **Conditional Delete Barrier** | Bản ghi đang được tham chiếu (`reference_count > 0`) | `400` | `HAS_REFERENCES` | *"Danh mục đang được tham chiếu. Không thể xóa, vui lòng chuyển sang trạng thái Inactive."* |
| **Divisor Check** | `divisor < 1` hoặc không phải số hữu hạn | `400` | `VALIDATION` | *"Divisor phải ≥ 1"* |
| **Not Found** | `id` không tồn tại trong DB | `404` | `NOT_FOUND` | *"Không tìm thấy danh mục"* |

---

## 9. Deferred & Out of Scope Items (Xử Lý Các Hạng Mục Ngoài Scope)

* **GAP-08 (Audit Logging):** **Deferred / Future Capability**. Hạng mục ghi vết nhật ký thao tác tác nghiệp Admin được hoãn lại (deferred) và sẽ được triển khai trong một Task riêng chuyên trách về Audit Logging Framework. Không tự ý phát sinh implementation trong Scope này.

---

## 10. Security & Non-Functional Constraints (Bảo Mật & Ràng Buộc Phi Chức Năng)

- **Security & Authorization:**
  - Backend bảo vệ bởi `adminAuthMw` và kiểm tra quyền RBAC.
  - Client controller kiểm tra `canPerm()` trước khi render action buttons.
- **Non-Functional Constraints:**
  - ❌ **0 Database Migration mới:** Sử dụng 100% schema 12 trường hiện có.
  - ❌ **0 Public API Contract Change:** Giữ nguyên contract đọc của `/api/market/*`.
  - ❌ **0 Cache Layer:** Đọc trực tiếp từ Postgres.

---

## 11. Verification Strategy & Acceptance Matrix (Chiến Lược Kiểm Thử & Bằng Chứng)

Ma trận kiểm thử bao phủ 100% các Tiêu chí Chấp nhận (Business Acceptance Criteria) và luồng tác nghiệp Lifecycle:

| Case ID | Feature / Flow | Điều Kiện Đầu Vào | Kết Quả Kỳ Vọng (Business Acceptance) | Bằng Chứng Kiểm Thử (Verification Evidence) |
| :--- | :--- | :--- | :--- | :--- |
| **VC-01** | **Create Sector/Ecosystem** | Gửi payload hợp lệ qua `POST /api/admin/sectors` | Tạo bản ghi thành công, tự sinh slug nếu thiếu, trả HTTP 201 Created. | **Network Log:** `201 Created`<br>**UI:** Render bản ghi mới trên `ix-table`<br>**DB:** Record xuất hiện trong DB. |
| **VC-02** | **Unique Code/Slug Check** | Tạo/Sửa bản ghi với `code` hoặc `slug` trùng lập | Hệ thống chặn thao tác, trả lỗi HTTP 409 `DUPLICATE`. | **Network Log:** `409 Conflict`<br>**UI:** `ixToast` hiển thị thông báo lỗi trùng mã/slug. |
| **VC-03** | **Read List & Search** | Gọi `GET /api/admin/sectors?q=Tech&status=active` | Trả danh sách lọc theo `q` (name_vi, code, slug) & status, bao gồm cả `stock_count` và `post_count`. | **Network Log:** `200 OK`<br>**UI Render:** Cột chỉ số hiển thị đủ số cổ phiếu và bài viết. |
| **VC-04** | **Read Detail** | Gọi `GET /api/admin/sectors/:id` với ID hợp lệ | Trả chi tiết DTO chứa đầy đủ 12 trường dữ liệu (`stock_count`, `post_count`). | **Network Log:** `200 OK`<br>**UI Render:** Form `ix-modal` hiển thị đủ thông tin chi tiết. |
| **VC-05** | **Update Info** | Gọi `PATCH /api/admin/sectors/:id` sửa `name_vi`, `display_order` | Bản ghi được cập nhật thành công, `updated_at` được làm mới. | **Network Log:** `200 OK`<br>**DB:** Cột `name_vi`, `display_order`, `updated_at` biến đổi. |
| **VC-06** | **Status Toggle** | Gọi `PATCH /api/admin/ecosystems/:id` với `{ is_active: false }` | Trạng thái chuyển sang `inactive`, ẩn khỏi Public Reader API nhưng DB vẫn lưu FK. | **Network Log:** `200 OK`<br>**UI:** Chip badge chuyển màu `ix-chip-secondary`<br>**Public API:** Không xuất hiện bản ghi. |
| **VC-07** | **Ordering Order** | Gọi `GET /api/admin/sectors` | Danh sách trả về được sắp xếp theo `display_order ASC, name_vi ASC`. | **Network Log:** Array sequence khớp đúng `display_order` tăng dần. |
| **VC-08** | **Blocked Delete** | Gọi `DELETE` cho Sector có `reference_count > 0` (Tech sector — 523 stocks) | Chặn xóa trong DB Transaction, trả lỗi `400 HAS_REFERENCES`, bản ghi **không bị xóa**. | **Network Log:** `400 Bad Request`<br>**UI:** Toast báo lỗi kèm số lượng tham chiếu<br>**DB:** Bản ghi tồn tại nguyên vẹn. |
| **VC-09** | **Unreferenced Hard Delete** | Gọi `DELETE` cho Sector có `reference_count == 0` (Test123 sector) | Xóa vật lý thành công, trả HTTP 200. | **Network Log:** `200 OK`<br>**UI:** Bản ghi biến mất khỏi bảng<br>**DB:** Record bị xoá hoàn toàn khỏi Postgres. |
| **VC-10** | **Concurrent Delete (Race Condition)** | 2 Admin cùng bấm Xóa bản ghi chưa có tham chiếu cùng thời điểm | Tối đa 1 request thành công (HTTP 200), request còn lại nhận HTTP 404, DB nhất quán. | **Parallel Logs:** 1x `200 OK`, 1x `404 Not Found`<br>**DB:** Data nhất quán. |
| **VC-11** | **Concurrent Ref Creation** | Admin A gửi Xóa trong khi Admin B thêm Cổ phiếu mới liên kết | Cơ chế quản lý giao dịch phát hiện tham chiếu mới, chặn lệnh xóa của Admin A với HTTP 400. | **Parallel Logs:** Admin A nhận `400 HAS_REFERENCES`<br>**DB:** Không phát sinh dữ liệu mồ côi. |

