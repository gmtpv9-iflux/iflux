# 05 - Implementation Plan: Admin Sector & Ecosystem Management Capability
**Task ID:** `010826_Admin_Sectors_Ecosystems_Capability`  
**Trạng thái Toàn Dự án:** `⏸️ PENDING (Tạm hoãn để thực hiện Task mới 010826_Stock_Registry_Source_of_Truth)`  
**Ngày Cập nhật:** `2026-08-02`  
**Căn Cứ Thượng Nguồn (LOCKED - Khóa Cố Định):**
- [`01-Business-Requirements.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/01-Business-Requirements.md) `[LOCKED]`
- [`02-Context-Audit.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/02-Context-Audit.md) `[LOCKED]`
- [`03-Governing-SoT.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/03-Governing-SoT.md) `[LOCKED]`
- [`04-Solution.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/04-Solution.md) `[LOCKED]`

---

## 1. Governance & Execution Scope (Ranh Giới & Quy Tắc Thi Công)

Kế hoạch này hướng dẫn chi tiết các gói công việc thi công (Work Packages) để triển khai Giải pháp Kỹ thuật tại `04-Solution.md` (Đã khóa).

- **Tuân thủ Ranh giới Quản trị (Governance Boundaries):**
  - **0 Data Owner Mới:** Admin UI đóng vai trò Consumer duy nhất, 100% tiêu thụ qua REST API.
  - **0 Database Migration Mới:** Tái sử dụng schema 12 trường có sẵn trên `sectors` và `ecosystems`.
  - **0 Break Public API Contract:** Giữ nguyên contract đọc công khai `/api/market/*`.
  - **Single Transaction Boundary & Concurrency Locking:** Luồng Delete bắt buộc thực thi trong transaction (`withTransaction`) có khóa bản ghi (`SELECT FOR UPDATE`).

---

## 2. Work Package Execution Plan (Gói Công Việc Thi Công)

### 📦 Work Package 1: Backend Services Implementation (`WP-01`)

* **Status:** `PASSED`
* **Objective:** Hoàn thiện toàn bộ Backend Capability để: Admin API phản hồi đúng DTO Contract theo `04-Solution.md` (bao gồm `stock_count` & `post_count`), luồng Delete xử lý an toàn theo Conditional Hard Delete trong Single DB Transaction, đồng bộ Status Lifecycle qua REST `PATCH`, giữ nguyên Contract đọc của Public API.
* **Reviewers:** Backend Lead + Product Owner
* **Dependency:** Phụ thuộc vào Bộ 4 tài liệu thượng nguồn 01-04 `LOCKED`.

#### Ràng Buộc Thi Công (Implementation Rules — Guard Rails):
- ❌ **KHÔNG** sửa đổi Database Schema hoặc tạo Migration mới.
- ❌ **KHÔNG** sửa đổi Contract đọc dữ liệu của các Public API `/api/market/*`.
- ❌ **KHÔNG** chỉnh sửa bất kỳ tệp tin Frontend nào trong Work Package 1.
- ✅ **CHỈ** được phép chỉnh sửa các tệp tin backend được khai báo trong File Matrix.

#### Entry Criteria:
- [x] Bộ 4 tài liệu thượng nguồn (`01-BR`, `02-Audit`, `03-SoT`, `04-Solution`) đã được ký duyệt và chuyển trạng thái `LOCKED`.

#### Chi Tiết Các Nhiệm Vụ (Tasks):

##### Task BE-01: DTO Aggregation & Output Mapping (`mapRow()`)
* **Tệp tin mục tiêu:** 
  - [`backend/src/modules/market/sectors-admin.service.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/market/sectors-admin.service.js)
  - [`backend/src/modules/market/ecosystems-admin.service.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/market/ecosystems-admin.service.js)
* **Nhiệm vụ thi công:**
  - Bổ sung subquery đếm `stock_count` (FK `stocks`) và `post_count` (JSONB array `community_posts`) vào các hàm list & detail query.
  - Cập nhật `mapRow(row)` trả về DTO đầy đủ theo Contract đã định nghĩa tại [`04-Solution.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/04-Solution.md).
* **Dependency:** Không (Task gốc của WP-01).

##### Task BE-02: Search (`q`), Filter (`status`) & Sort Order (`display_order`)
* **Tệp tin mục tiêu:** `sectors-admin.service.js` & `ecosystems-admin.service.js`
* **Nhiệm vụ thi công:**
  - Logic tìm kiếm `q` thực thi `ILIKE` khớp chuỗi trên `name_vi`, `code`, `slug` (và exact match `id` nếu numeric).
  - Logic lọc `status`: `active` (`is_active = TRUE`), `inactive` (`is_active = FALSE`).
  - Sắp xếp mặc định (NGD-04): `ORDER BY s.display_order ASC, s.name_vi ASC`.
* **Dependency:** Phụ thuộc `TASK-BE-01`.

##### Task BE-03: Single Transaction Boundary & Conditional Hard Delete
* **Tệp tin mục tiêu:** `sectors-admin.service.js` & `ecosystems-admin.service.js`
* **Nhiệm vụ thi công:**
  - Đóng gói luồng `deleteSector(id)` và `deleteEcosystem(id)` trong `withTransaction`.
  - Khóa bản ghi bằng `SELECT ... FOR UPDATE`.
  - Tính toán `reference_count = stockCount + postCount` theo đúng **Audit Evidence §7.D**.
  - Nếu `reference_count > 0`: ném lỗi `400 HAS_REFERENCES`, tự động Rollback.
  - Nếu `reference_count == 0`: thực thi `DELETE FROM`, Commit Transaction.
  - **Lưu ý:** Gỡ bỏ dòng code cũ tự ý set `stocks.ecosystem_id = NULL` trong `ecosystems-admin.service.js`.
* **Dependency:** Phụ thuộc `TASK-BE-01`.

##### Task BE-04: REST Endpoint Standardization & Migration Strategy
* **Tệp tin mục tiêu:** 
  - [`backend/src/modules/market/sectors-admin.routes.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/market/sectors-admin.routes.js)
  - [`backend/src/modules/market/ecosystems-admin.routes.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/market/ecosystems-admin.routes.js)
* **Nhiệm vụ thi công:**
  - Chuẩn hóa route `PATCH /api/admin/sectors/:id` và `PATCH /api/admin/ecosystems/:id` làm endpoint cập nhật & status toggle chính thức.
  - Đóng gói route `POST /:id/activate` và `POST /:id/deactivate` của Ecosystems dưới dạng Legacy Aliases chuyển hướng tới `PATCH` cho Phase 1.
* **Dependency:** Phụ thuộc `TASK-BE-03`.

#### Actionable Exit Criteria Checklist (Nghiệm Thu WP-01):
- [x] `mapRow()` trả về đầy đủ DTO bao gồm cả `stock_count` và `post_count` theo contract `04-Solution.md`.
- [x] Query danh sách hỗ trợ tham số `q` tìm kiếm khớp `name_vi`, `code`, `slug`.
- [x] Query danh sách lọc chính xác theo trạng thái `status=active|inactive`.
- [x] Kết quả danh sách sắp xếp chuẩn theo `display_order ASC, name_vi ASC`.
- [x] Luồng Delete đóng gói 100% trong Single DB Transaction với Row Lock (`FOR UPDATE`).
- [x] Luồng Delete trả về HTTP 400 `HAS_REFERENCES` và Rollback khi `reference_count > 0`.
- [x] Luồng Delete thực thi xóa vật lý khỏi Postgres khi `reference_count == 0`.
- [x] Endpoint `PATCH /api/admin/.../:id` cập nhật thông tin và status toggle thành công.
- [x] Không có regression lỗi xảy ra đối với các API khác.

#### WP-01 Deliverables:
- ✅ Backend source code (`sectors-admin.service.js`, `ecosystems-admin.service.js`, route files).
- ✅ Kết quả Test API direct call (cả trường hợp success lẫn blocked delete).
- ✅ Backend Regression Log.

#### WP-01 Rollback Plan:
- Nếu WP-01 thất bại trong nghiệm thu $\rightarrow$ Revert các commit backend về mốc ban đầu, kiểm tra khôi phục nguyên trạng API và tạm dừng triển khai.

---

### 🛑 PHASE GATE 1 (Cổng Chuyển Giai Đoạn 1)
- **Điều kiện mở khóa Phase 2:**
  - [x] 100% Checklist Exit Criteria của **WP-01** đạt trạng thái Checked.
  - [x] **Reviewers (Backend Lead + Product Owner)** ký duyệt PASS cho WP-01.
  - [x] Đơn vị thi công được phép bắt đầu triển khai **WP-02 (Frontend Admin UI)**.

---

### 📦 Work Package 2: Frontend Admin UI Implementation (`WP-02`)

* **Status:** `PASSED`
* **Objective:** Tích hợp toàn bộ Backend Capability lên giao diện Admin UI tiêu chuẩn (`ix-table`, `ix-modal`, `ix-chip`), hiển thị chỉ số tham chiếu, điều hướng sidebar & phân quyền RBAC, tuyệt đối không tạo Business Logic hay Data Owner mới phía Frontend.
* **Reviewers:** Frontend Lead + Product Owner
* **Dependency:** Phụ thuộc vào **PHASE GATE 1** (WP-01 đã được phê duyệt PASS).

#### Ràng Buộc Thi Công (Implementation Rules — Guard Rails):
- ❌ **KHÔNG** chỉnh sửa bất kỳ tệp tin Backend nào trong Work Package 2.
- ❌ **KHÔNG** tạo thêm API mới hoặc tự ý định nghĩa DTO mới trên Frontend.
- ❌ **KHÔNG** tạo Cache Owner (`localStorage`, `sessionStorage`, `state cache`).
- ✅ **CHỈ** tiêu thụ trực tiếp dữ liệu DTO từ REST API đại diện cho PostgreSQL SSoT.

#### Entry Criteria:
- [x] PHASE GATE 1 đã được phê duyệt PASS. Backend API đã sẵn sàng hoạt động.

#### Chi Tiết Các Nhiệm Vụ (Tasks):

##### Task FE-01: Admin Navigation & Menu Integration
* **Nhiệm vụ thi công:**
  - Thêm Sidebar Menu Items dưới mục **Quản lý Thị trường**:
    - Ngành (`/admin/market/sectors` - Permission Guard: `market.sectors.view`)
    - Hệ sinh thái (`/admin/market/ecosystems` - Permission Guard: `market.ecosystems.view`)
  - Thiết lập Breadcrumb paths cho 2 trang.
* **Dependency:** Phụ thuộc `WP-01`.

##### Task FE-02: Bảng Dữ Liệu `ix-table` & Render Status Chip
* **Nhiệm vụ thi công:**
  - Bổ sung 2 cột chỉ số: **Số cổ phiếu (`stock_count`)** và **Số bài viết (`post_count`)**.
  - Hiển thị Trạng thái bằng `ix-chip`:
    - `Active` $\rightarrow$ `ix-chip-success` ("Hoạt động").
    - `Inactive` $\rightarrow$ `ix-chip-secondary` ("Tắt").
* **Dependency:** Phụ thuộc `TASK-FE-01`.

##### Task FE-03: Thao Tác Toggle Status & Handling Delete Error
* **Nhiệm vụ thi công:**
  - Nút Toggle Status gọi `PATCH /api/admin/.../:id` gửi body `{ is_active: !current.is_active }`.
  - Nút Delete hiển thị Modal xác nhận. Khi API trả lỗi `400 HAS_REFERENCES`, bắt lỗi và hiển thị `ixToast` thông báo chi tiết: *"Danh mục đang có cổ phiếu/bài viết liên kết. Không thể xóa, vui lòng chuyển sang trạng thái Inactive."*
* **Dependency:** Phụ thuộc `TASK-FE-02`.

#### Actionable Exit Criteria Checklist (Nghiệm Thu WP-02):
- [x] Sidebar Menu hiển thị đúng 2 mục Ngành & Hệ sinh thái dưới mục Quản lý Thị trường.
- [x] Route Path `/admin/market/sectors` và `/admin/market/ecosystems` hoạt động kèm RBAC Guard.
- [x] Bảng `ix-table` hiển thị chính xác các cột dữ liệu, bao gồm cả `stock_count` và `post_count`.
- [x] Badge trạng thái `ix-chip` đổi màu chính xác giữa Active (`ix-chip-success`) và Inactive (`ix-chip-secondary`).
- [x] Thao tác Toggle Status cập nhật trạng thái ngay lập tức qua API `PATCH`.
- [x] Thao tác Delete bị chặn hiển thị đúng `ixToast` báo lỗi chi tiết số lượng tham chiếu khi API trả `400 HAS_REFERENCES`.
- [x] Form `ix-modal` Thêm mới & Chỉnh sửa hoạt động đúng validation.

#### WP-02 Deliverables:
- ✅ Frontend source code (Navigation Registry, View Pages, Components).
- ✅ Ảnh chụp màn hình giao diện (Screenshots) nghiệm thu các trạng thái UI.
- ✅ Network Log trình duyệt chứng minh tiêu thụ DTO qua API REST.

#### WP-02 Rollback Plan:
- Nếu WP-02 thất bại trong nghiệm thu $\rightarrow$ Revert các commit frontend về mốc ban đầu, giữ nguyên Backend WP-01 đã PASS.

---

### 🛑 PHASE GATE 2 (Cổng Chuyển Giai Đoạn 2)
- **Điều kiện mở khóa Phase 3:**
  - [x] 100% Checklist Exit Criteria của **WP-02** đạt trạng thái Checked.
  - [x] **Reviewers (Frontend Lead + Product Owner)** ký duyệt PASS cho WP-02.
  - [x] Đơn vị thi công được phép bắt đầu triển khai **WP-03 (Verification & Acceptance)**.

---

### 📦 Work Package 3: Verification & Acceptance Execution (`WP-03`)

* **Status:** `PASSED`
* **Objective:** Xác minh toàn bộ Business Requirement đã được hiện thực hóa trọn vẹn, không có regression lỗi, thu thập đầy đủ bằng chứng kiểm thử cho 11 Test Cases (`VC-01` đến `VC-11`) và nghiệm thu 0 Governance Violation.
* **Reviewers:** QA Lead + Product Owner
* **Dependency:** Phụ thuộc vào **PHASE GATE 2** (WP-02 đã được phê duyệt PASS).

#### Entry Criteria:
- [x] PHASE GATE 2 đã được phê duyệt PASS. Cả Backend và Frontend đã hoàn tất tích hợp E2E.

#### Work Package Execution Matrix (Ma Trận Thực Thi Kiểm Thử):

| Case ID | Quy Trình Kiểm Thử | Lệnh Executed / Thao Tác | Kết Quả Kỳ Vọng (Acceptance) | Reviewer Verification |
| :---: | :--- | :--- | :--- | :---: |
| **VC-01** | Create Sector/Ecosystem | `POST /api/admin/sectors` payload chuẩn | Response `201 Created`, tự sinh slug nếu thiếu. | QA Lead `[PASS]` |
| **VC-02** | Unique Validation | `POST` trùng `code` hoặc `slug` | Response `409 Conflict`, hiển thị lỗi trùng mã/slug. | QA Lead `[PASS]` |
| **VC-03** | Read List & Search | `GET /api/admin/sectors?q=Tech&status=active` | Response `200 OK`, mảng trả về có `stock_count` & `post_count`. | QA Lead `[PASS]` |
| **VC-04** | Read Detail | `GET /api/admin/sectors/:id` | Response `200 OK`, trả về DTO đầy đủ theo Contract. | QA Lead `[PASS]` |
| **VC-05** | Update Info | `PATCH /api/admin/sectors/:id` | Response `200 OK`, `updated_at` được làm mới. | QA Lead `[PASS]` |
| **VC-06** | Status Toggle | `PATCH /api/admin/ecosystems/:id` `{is_active: false}` | Status đổi thành `inactive`, Public Reader API không xuất hiện bản ghi. | QA Lead `[PASS]` |
| **VC-07** | Ordering | `GET /api/admin/sectors` | Trả về sắp xếp theo `display_order ASC, name_vi ASC`. | QA Lead `[PASS]` |
| **VC-08** | Blocked Delete | `DELETE /api/admin/sectors/:id` (Tech sector — 523 stocks) | Response `400 HAS_REFERENCES`, bản ghi **KHÔNG BỊ XÓA**. | QA Lead `[PASS]` |
| **VC-09** | Hard Delete | `DELETE /api/admin/sectors/:id` (Test123 sector — 0 ref) | Response `200 OK`, bản ghi bị xoá vật lý khỏi Postgres. | QA Lead `[PASS]` |
| **VC-10** | Concurrent Delete | 2 song song Delete requests cùng lúc | 1x `200 OK`, 1x `404 Not Found`, DB nhất quán. | QA Lead `[PASS]` |
| **VC-11** | Concurrent Insert | Delete song song với Stock Insert mới | Response `400 HAS_REFERENCES`, chặn xóa an toàn. | QA Lead `[PASS]` |

#### Actionable Exit Criteria Checklist (Nghiệm Thu WP-03):
- [x] 100% 11 Test Cases (`VC-01` đến `VC-11`) đạt kết quả **PASS**.
- [x] Kiểm chứng xác minh 0 Governance Violation (0 Cache Owner, 0 Migration thừa, 0 API contract break).
- [x] Thu thập đầy đủ Bằng chứng Kiểm thử (Test Report, Network Logs, Screenshots, SQL verification).

#### WP-03 Deliverables:
- ✅ Test Execution Report (Báo cáo kết quả kiểm thử).
- ✅ Bằng chứng hình ảnh & log (Network Logs, Screenshots).
- ✅ Biên bản nghiệm thu chấp nhận (Sign-off Acceptance Record).

#### WP-03 Rollback Plan:
- Nếu WP-03 phát hiện lỗi nghiêm trọng $\rightarrow$ Khoanh vùng module lỗi, thực hiện fix-hotfix trên branch kiểm thử và chạy lại ma trận VC-01..11.

---

## 3. Overall Project Exit Criteria (Definition of Done toàn Task)

Dự án chỉ được công nhận **HOÀN THÀNH (COMPLETED)** và chuyển giao cho sản xuất khi thỏa mãn 100% thuộc tính của Definition of Done dưới đây:

- [x] **WP-01 (Backend Implementation):** Đã hoàn thành, 100% Exit Checklist checked, Reviewer ký duyệt PASS.
- [x] **WP-02 (Frontend Admin UI):** Đã hoàn thành, 100% Exit Checklist checked, Reviewer ký duyệt PASS.
- [x] **WP-03 (Verification & Acceptance):** Đã hoàn thành, 100% Exit Checklist checked, Reviewer ký duyệt PASS.
- [x] **Ma Trận Test Cases:** 100% các case từ `VC-01` đến `VC-11` đạt trạng thái PASS.
- [x] **Ranh Giới Quản Trị (Governance):** Xác minh 0 Governance Violation (0 Data Owner mới, 0 Schema Migration thừa, 0 Break Public API).
- [x] **Product Owner Sign-off:** Product Owner và Technical Lead ký duyệt chấp nhận hoàn thành Capability.
