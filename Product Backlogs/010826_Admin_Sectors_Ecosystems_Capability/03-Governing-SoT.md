# 03 — Governing SoT: Admin Sector & Ecosystem Management Capability
**Task ID:** `010826_Admin_Sectors_Ecosystems_Capability`  
**Trạng thái:** `UPDATED (Rev.2 — Code Audit Alignment)`  
**Loại Tài Liệu:** `Design Governance Contract (Hợp Đồng Quản Trị Thiết Kế)`  
**Nguồn Dữ Liệu Quản Trị (SSoT):** `PostgreSQL Database (sectors, ecosystems)`  
**Ngày Cập nhật:** `2026-08-02`  

---

> [!IMPORTANT]
> **Vai trò Hợp đồng Quản trị Thiết kế (Design Governance Contract):**  
> Governing SoT là **Hợp đồng Quản trị Thiết kế** tập hợp đầy đủ ranh giới, quy tắc, giả định, rủi ro quản trị và tiêu chí hoàn thành tại thời điểm thiết kế.  
> Tài liệu trả lời các câu hỏi cốt lõi để định hướng cho `04-Solution.md` và `05-Implementation-Plan.md` thi công chính xác mà không bị lặp lại thủ tục hành chính.

---

## 1. Governing Scope Summary (Tóm Tắt Quyền Sở Hữu Quyết Định Task)

| Phạm vi Quản trị (Domain) | Tài liệu Nắm Quyền (Governing Owner File) | Trách nhiệm Quản trị |
| :--- | :--- | :--- |
| **Business Rules** | [`01-Business-Requirements.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/01-Business-Requirements.md) | Quy định mục tiêu nghiệp vụ, luồng tác nghiệp và tiêu chí nghiệm thu Business. |
| **Current Reality** | [`02-Context-Audit.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/02-Context-Audit.md) | Cung cấp bằng chứng thực tế tại DB, API, UI (Code Audit Rev.2). |
| **Enterprise Architecture** | [`Docs/`](file:///Users/mac/Documents/Productions/iFLUX_P1/Docs/) | Quy định tiêu chuẩn kỹ thuật, single data flow và kiến trúc lưu trữ toàn dự án. |
| **Task Governance & Boundaries** | [`03-Governing-SoT.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/03-Governing-SoT.md) | **Hợp đồng Quản trị Thiết kế** xác lập ranh giới, ràng buộc và quy tắc chi phối Task. |
| **Technical Design** | `04-Solution.md` | Thiết kế chi tiết API, data structures, UI flows tuân thủ Governing SoT. |
| **Execution Plan** | `05-Implementation-Plan.md` | Lập kế hoạch từng bước thi công, lệnh kiểm thử và bằng chứng nghiệm thu. |

---

## 2. Applicable Global SoT Discovery (Danh Mục Global SoT Chi Phối)

Rà soát toàn bộ các tài liệu SoT cấp Enterprise tại thư mục [`Docs/`](file:///Users/mac/Documents/Productions/iFLUX_P1/Docs/):

| # | Global SoT Document | Source Citation (Đường dẫn thực tế) | Authority | Scope (Phạm vi chi phối) |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **iFlux Product Architecture (V2)** | [`Docs/SoT — iFlux Product Architecture (V2).md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Docs/SoT%20%E2%80%94%20iFlux%20Product%20Architecture%20(V2).md) | **Reference** | SoT cấp cao nhất toàn dự án. Không đề cập trực tiếp sectors/ecosystems nhưng là authority hierarchy tối thượng. |
| 2 | **Engineering Change Governance** | [`Docs/SoT — Engineering Change Governance.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Docs/SoT%20%E2%80%94%20Engineering%20Change%20Governance.md) §2 (`CG-001`, `CG-002`, `CG-005`, `CG-012`) | **Mandatory** | Reuse Before Create, No Duplicate Responsibility, Mandatory Impact Analysis, New File Justification. |
| 3 | **Plan SoT Governance** | [`Docs/SoT — Plan SoT Governance.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Docs/SoT%20%E2%80%94%20Plan%20SoT%20Governance.md) | **Mandatory** | Quy trình Gate, cấu trúc artifact, chuỗi logic Scope → Evidence → Deliverable. Task này tuân thủ chu trình 8 bước tuần tự. |
| 4 | **Persistence & Client Storage Architecture (PS-1.0)** | [`Docs/SoT — Persistence & Client Storage Architecture (PS-1.0).md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Docs/SoT%20%E2%80%94%20Persistence%20%26%20Client%20Storage%20Architecture%20(PS-1.0).md) §PS-002, §PS-003 | **Mandatory** | Cấm dùng localStorage/Registry Store làm Business Data Owner. API là Business SoT. |
| 5 | **Follow & Notification Domain** | [`Docs/SoT — Follow & Notification Domain.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Docs/SoT%20%E2%80%94%20Follow%20%26%20Notification%20Domain.md) | **Out of Scope** | Không áp dụng cho Task này. |

> [!NOTE]
> **Tham chiếu đã loại bỏ:** Phiên bản trước tham chiếu `Product Backlogs/010826_Sectors_Ecosystems_Database_Normalization/03-Governing-SoT.md` nhưng thư mục này **không tồn tại** trong Product Backlogs hiện tại. Các quy tắc liên quan (12 trường DB chuẩn hóa, UNIQUE constraint trên `code`/`slug`) đã được xác minh trực tiếp qua Code Audit tại [`02-Context-Audit.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/02-Context-Audit.md) §7A và được kế thừa làm Governing Rule tại §6 của tài liệu này.

---

## 3. Governance Validation Register (Đối Chiếu & Phân Loại Hiện Trạng)

Phân loại chính xác các điểm đối chiếu giữa SoT/BR và Hiện trạng thực tế tại [`02-Context-Audit.md (Rev.2)`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/02-Context-Audit.md):

| Reference Item | Audit Evidence (Code Audit Rev.2) | Validation Status | Mô Tả Phân Loại | Hướng Xử Lý |
| :--- | :--- | :---: | :--- | :--- |
| **Single Data Flow (CG-001)** | DB Postgres 12 trường & Market API | **Verified** | Hiện trạng khớp 100% với SoT kiến trúc. | Giữ nguyên kiến trúc hiện tại. |
| **Zero Local Owner (PS-002)** | Admin UI chỉ đọc token từ localStorage, không lưu business state | **Verified** | Không vi phạm PS-002. | Giữ nguyên nguyên tắc. |
| **Delete Logic (BR-03 vs GAP-01)** | `deleteSector` chặn `stock_count > 0`; `deleteEcosystem` tự động gỡ FK stocks để Hard Delete. | 🔴 **Critical Gap** | Code chưa đồng bộ logic chặn Hard Delete khi `reference_count > 0` và chưa kiểm tra bài viết/dữ liệu tham chiếu khác. | Đưa vào Solution: Chuẩn hóa Conditional Hard Delete (`NGD-02`). |
| **Status Management (BR-03 vs GAP-02)** | `is_active` có trong DB. Sectors dùng PATCH, Ecosystems dùng endpoint activate/deactivate riêng. | 🟠 **Logic Gap** | Cần chuẩn hóa UI & API toggling 2 trạng thái Active/Inactive thống nhất. | Đưa vào Solution: Thống nhất Status Toggling (`NGD-01`). |
| **API Response Fields (GAP-03)** | `mapRow()` chỉ trả 8/12 trường. Thiếu: `slug`, `description`, `display_order`, `icon_media_id`. | 🟠 **Data Gap** | Admin UI không nhận đủ dữ liệu để hiển thị. | Đưa vào Solution: bổ sung trường trong mapRow (`NGD-03`). |
| **Sort Order (BR-04 vs GAP-04)** | Code dùng `ORDER BY name_vi ASC`. Index `display_order` có nhưng không sử dụng. | 🟠 **Logic Gap** | Sai thứ tự sắp xếp so với BR. | Đưa vào Solution: sửa ORDER BY (`NGD-04`). |
| **Unique Check (GAP-05)** | Unique `code`/`slug` chưa đồng bộ logic kiểm tra giữa 2 module. | 🟡 **Logic Gap** | Cần thống nhất logic validate unique trước khi Insert/Update. | Đưa vào Solution: Chuẩn hóa Unique Validation (`NGD-05`). |
| **Toggle Consistency (GAP-06)** | Sectors dùng `PATCH`, Ecosystems dùng endpoint riêng `activate/deactivate`. | 🟡 **Inconsistency** | Không ảnh hưởng chức năng nhưng không nhất quán. | Ghi nhận, xem xét chuẩn hóa sau. Không bắt buộc xử lý trong Scope task này. |

---

## 4. Capability Scope & Architectural Boundaries (Phạm Vi & Ranh Giới)

### A. Phạm vi Thiết kế (Scope Boundary)
| In Scope (Phạm vi Được phép Thiết kế) | Out of Scope (Phạm vi Tuyệt đối Cấm) |
| :--- | :--- |
| ✅ Quản lý CRUD & Trạng thái (`Active`/`Inactive`) Ngành & Hệ sinh thái cho Admin. | ❌ Hệ thống thông báo đẩy (Notification Engine). |
| ✅ **Quy tắc Xóa có điều kiện (Conditional Hard Delete):** Chặn Xóa nếu `reference_count > 0` (yêu cầu chuyển `Inactive`); Cho phép Hard Delete khi `reference_count == 0`. | ❌ Đường ống xử lý Media Asset Upload gốc. |
| ✅ Chuẩn hóa logic Bật/Tắt trạng thái hoạt động (`Active` <-> `Inactive`) trên UI & API. | ❌ Thay đổi logic phân loại bài viết tự động của RSS Ingest. |
| ✅ Bổ sung trường thiếu trong API response (`slug`, `description`, `display_order`, `icon_media_id`). | ❌ Thay đổi bộ lọc tìm kiếm & SEO Canonical routing. |
| ✅ Sửa ORDER BY dùng `display_order ASC, name_vi ASC`. | ❌ Thay đổi Database schema (0 cột mới, 0 migration). |
| ✅ Validation duy nhất cho `code` & `slug`. | ❌ Thay đổi contract Public Market API. |

### B. Ma trận Ranh giới Quản trị (Boundary Diagram)
```text
                  [ PostgreSQL Database ] ─── (Primary Business SoT)
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   [ Admin REST API ]               [ Market Public API ]
  (Exclusive Writer Path)          (Exclusive Reader Path)
            │                                 │
            ▼                                 ▼
     [ Admin UI ]                        [ User Web ]
  (Management Consumer)               (Public Consumer)
```

---

## 5. Governing Constraints (Ràng Buộc Kiến Trúc Bắt Buộc)

Các luật chơi kiến trúc cố định cho `04-Solution.md` và `05-Implementation-Plan.md`:

- **GCN-01 (No New Data Owner):** Cấm tạo thêm bất kỳ Data Owner mới nào (`localStorage`, `registry cache`, `seed`, `mock`). *[Derived: PS-002]*
- **GCN-02 (Immutable Public API):** Cấm thay đổi cấu trúc Contract của Public Market API (`/api/market/sectors`, `/api/market/ecosystems`). *[Derived: CG-002]*
- **GCN-03 (Immutable Schema):** Cấm thay đổi Database Ownership và cấu trúc 12 trường dữ liệu đã chuẩn hóa của `sectors` và `ecosystems`. Không migration, không thêm cột. *[Derived: 02-Context-Audit §7A]*
- **GCN-04 (Zero Duplicate Component):** Cấm tự tạo thêm component UI mới trùng lặp với các capability sẵn có trong Admin Design System. *[Derived: CG-001, CG-012]*
- **GCN-05 (Reuse Before Build):** Bắt buộc ưu tiên tái sử dụng 100% hạ tầng hiện có (`ix-table`, `ix-modal`, `ixToast`, `adminAuthMw`). *[Derived: CG-001, 02-Context-Audit §5]*

---

## 6. Governing Rules & Auditable Derivation Breakdown (Quy Tắc Chi Phối)

### **GR-01 (Single Data Flow Rule)**
- **Nội dung:** Mọi Consumer trên toàn hệ thống chỉ được phép tiêu thụ dữ liệu Ngành và Hệ sinh thái thông qua Market API duy nhất.
- **Derived From:**
  - *File:* [`Docs/SoT — Engineering Change Governance.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Docs/SoT%20%E2%80%94%20Engineering%20Change%20Governance.md)
  - *Heading:* `§2. Core Principle`
  - *Rule ID:* `CG-001`

### **GR-02 (Zero Local Owner Rule)**
- **Nội dung:** Client-side storage (`localStorage`, `registry store`) tuyệt đối không được làm Business Data Owner cho dữ liệu ngành/hệ sinh thái. API là Business SoT duy nhất.
- **Derived From:**
  - *File:* [`Docs/SoT — Persistence & Client Storage Architecture (PS-1.0).md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Docs/SoT%20%E2%80%94%20Persistence%20%26%20Client%20Storage%20Architecture%20(PS-1.0).md)
  - *Heading:* `§PS-002 Persistence Types` & `§PS-003 Allowed vs Forbidden`
  - *Rule ID:* `PS-002`, `PS-003`

### **GR-03 (Status Lifecycle & Conditional Hard Delete Rule)**
- **Nội dung:**
  - Bản ghi quản lý qua 2 trạng thái: `Active` (hoạt động) và `Inactive` (ngưng hoạt động/tạm ẩn khỏi Public App).
  - Thao tác Xóa (Hard Delete `DELETE FROM`) chỉ được phép khi tổng số tham chiếu dữ liệu (`stocks`, `posts`, v.v.) bằng 0 (`reference_count == 0`).
  - Nếu bản ghi đang có tham chiếu (`reference_count > 0`), Hard Delete phải bị chặn hoàn toàn kèm thông báo lỗi rõ ràng yêu cầu Admin chuyển sang trạng thái `Inactive`.
- **Derived From:**
  - *File:* [`01-Business-Requirements.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/01-Business-Requirements.md)
  - *Heading:* `§1 & §3. Yêu cầu Năng lực Nghiệp vụ`
  - *Rule ID:* `BR-03`

### **GR-04 (Unique Validation Rule)**
- **Nội dung:** Mã `code` và `slug` phải được kiểm tra duy nhất trên toàn bộ tập bản ghi trước khi cho phép Create/Update.
- **Derived From:**
  - *File:* [`02-Context-Audit.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/02-Context-Audit.md) §7A — UNIQUE constraint trên `code` và `slug` xác minh từ Database Schema thực tế.
  - *File:* [`01-Business-Requirements.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/01-Business-Requirements.md) §3.5 — Ràng buộc An toàn Nghiệp vụ.
  - *Rule ID:* `BR-05` (Business Validation)

### **GR-05 (100% Capability Reuse Rule)**
- **Nội dung:** Mọi giao diện Admin UI cho Capability này bắt buộc sử dụng lại các UI component hiện có (`ix-table`, `ix-modal`, `ixToast`, `statusChip`).
- **Derived From:**
  - *File:* [`02-Context-Audit.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/02-Context-Audit.md)
  - *Heading:* `§5. Reuse Analysis`
  - *Evidence:* 6 Capability đều đạt Reuse 100%.

---

## 7. Assumptions & Governance Risks (Giả Định & Rủi Ro Quản Trị)

### A. Assumptions (Giả Định Thiết Kế)
- **A-01 (Media Asset Reference):** Trường `icon_media_id` được coi là một chuỗi ID tham chiếu tới Media Asset Library ở dạng TEXT, không tạo FK cứng trong Database.
- **A-02 (RBAC Capability):** Hạ tầng phân quyền Admin hiện có (`adminAuthMw` & client RBAC guard `canPerm()`) đã đủ đáp ứng yêu cầu phân quyền tác nghiệp (`market.sectors.view`, `market.sectors.edit`).
- **A-03 (Frozen Schema):** Cấu trúc 12 trường dữ liệu của 2 bảng `sectors` và `ecosystems` trên PostgreSQL đã đóng băng (freeze), không phát sinh thêm cột dữ liệu mới trong Scope này.
- **A-04 (Reference Counting):** Việc kiểm tra tham chiếu trước khi Xóa sẽ đếm tổng số bản ghi liên quan tại bảng `stocks` và các bảng dữ liệu nội dung/bài viết (nếu có).

### B. Governance Risks (Rủi Ro Quản Trị Kiến Trúc)
- **R-01 (Enterprise SoT Drift):** Nếu `SoT — Persistence Architecture` thay đổi tiêu chuẩn ➔ Task này phải review lại Governing Rules.
- **R-02 (Public API Breakage):** Nếu có thay đổi ngoài ý muốn đối với Contract của Public Market API (`/api/market/*`) ➔ Solution bắt buộc phải điều chỉnh để bảo vệ tính khép kín của Consumer.
- **R-03 (Unchecked Reference Delete):** Nếu code xóa tự ý gỡ FK (như `ecosystems-admin.service.js` đang set `stocks.ecosystem_id = NULL`), dữ liệu mồ côi sẽ phát sinh. Rủi ro này được triệt phá hoàn toàn bằng Conditional Hard Delete Rule (`GR-03`).

---

## 8. Decision Log (Nhật Ký Quyết Định Quản Trị)

| Decision ID | Decision Title (Tên Quyết Định) | Rationale (Lý Do Quyết Định) | Status |
| :--- | :--- | :--- | :---: |
| **NGD-01** | Chuẩn hóa Endpoint Quản lý Trạng thái (`Active`/`Inactive`) qua RESTful `PATCH /api/admin/.../:id`. | Thống nhất 100% chuẩn RESTful cho cả Sector và Ecosystem (`PATCH /api/admin/sectors/:id` và `PATCH /api/admin/ecosystems/:id`), ẩn khỏi Public Market API mà vẫn giữ nguyên liên kết DB. | **APPROVED** |
| **NGD-02** | Thực thi Quy tắc Xóa có điều kiện (Conditional Hard Delete) đóng gói trong Transaction Boundary. | Sử dụng `withTransaction` và `FOR UPDATE` lock để chống race condition. Chặn xóa khi bản ghi đang có tham chiếu (`reference_count > 0`), yêu cầu chuyển sang `Inactive`. Chỉ cho phép Hard Delete khi `reference_count == 0`. Xử lý **GAP-01** (Critical). | **APPROVED** |
| **NGD-03** | Bổ sung trường thiếu trong `mapRow()` của cả 2 service (`slug`, `description`, `display_order`, `icon_media_id`). | API response chỉ trả 8/12 trường. Cần bổ sung 4 trường thực tế để Admin UI hiển thị đầy đủ (loại bỏ giả định `post_count`). Xử lý **GAP-03**. | **APPROVED** |
| **NGD-04** | Sửa ORDER BY dùng `display_order ASC, name_vi ASC`. | Code hiện tại chỉ sort theo `name_vi`. Index DB hỗ trợ `display_order` nhưng code không dùng. Xử lý **GAP-04** theo `BR-04`. | **APPROVED** |
| **NGD-05** | Chuẩn hóa Unique Validation cho `code` và `slug`. | Đảm bảo không bị trùng mã/slug giữa các bản ghi trong hệ thống. Xử lý **GAP-05**. | **APPROVED** |


---

## 9. Capability Success Criteria (Tiêu Chí Hoàn Thành Governance)

Capability Quản lý Ngành & Hệ sinh thái đạt chuẩn Governance khi thỏa mãn 7 tiêu chí chi phối:

- [ ] **SC-01 (Compliance Boundary):** Thiết kế Giải pháp (`04-Solution.md`) tuân thủ 100% các ranh giới và ràng buộc kiến trúc (`GCN-01` đến `GCN-05`).
- [ ] **SC-02 (Zero Data Owner):** Quá trình triển khai không phát sinh bất kỳ Data Owner mới nào (`localStorage`, `registry`, `mock`).
- [ ] **SC-03 (Full BR Fulfillment):** Capability đáp ứng trọn vẹn các yêu cầu nghiệp vụ trong BR (`BR-01` đến `BR-05`), bao gồm Active/Inactive Status & Conditional Hard Delete.
- [ ] **SC-04 (Public Contract Protection):** Contract đọc dữ liệu của Public Market API hoàn toàn không bị ảnh hưởng hay biến đổi.
- [ ] **SC-05 (100% Reuse Compliance):** Tái sử dụng 100% bộ khung thành phần Admin Design System sẵn có.
- [ ] **SC-06 (Conditional Hard Delete Enforcement):** Đảm bảo bản ghi có `reference_count > 0` bị chặn xóa và gợi ý chuyển `Inactive`; bản ghi có `reference_count == 0` được cho phép Hard Delete.
- [ ] **SC-07 (Complete API Response):** `mapRow()` trả đầy đủ các trường cần thiết bao gồm `slug`, `description`, `display_order`, `icon_media_id`.

---

## 10. Governing SoT Gate Checklist

- [x] **Global SoT Discovered:** Khảo sát 5 bộ Global SoT tại `Docs/` và phân loại quyền hạn.
- [x] **BR Inherited:** Kế thừa 100% Business Rules từ `01-Business-Requirements.md`.
- [x] **Audit Inherited:** Kế thừa 100% Code Audit Facts từ `02-Context-Audit.md (Rev.2)`.
- [x] **Conflicts & Gaps Resolved:** Xử lý các GAP đã nhận diện qua 5 quyết định quản trị (`NGD-01` → `NGD-05`).
- [x] **Governing Rules & Constraints Established:** Thiết lập Governing Rules (`GR-01..05`) và Ràng buộc Kiến trúc (`GCN-01..05`).
- [x] **Path References Updated:** Tất cả đường dẫn đã cập nhật chính xác.

---

⛔ **GATE CONTROL 3:**  
Hợp đồng Quản trị Thiết kế `03-Governing-SoT.md` đã cập nhật Rev.3 theo Business Requirement mới (Conditional Hard Delete & Active/Inactive status).
 