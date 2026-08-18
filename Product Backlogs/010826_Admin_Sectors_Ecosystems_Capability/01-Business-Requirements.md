# 01 — Business Requirements: Admin Sector & Ecosystem Management Capability
**Task ID:** `010826_Admin_Sectors_Ecosystems_Capability`  
**Trạng thái:** `APPROVED (UPDATED — Active/Inactive Status & Conditional Hard Delete)`  
**Nguồn Dữ Liệu Quản Trị (SSoT):** `PostgreSQL Database (sectors, ecosystems)`  
**Ngày Cập nhật:** `2026-08-02`

---

> [!IMPORTANT]
> **Nguyên tắc Quản trị Cốt lõi (Core Governance Principle):**  
> Business Requirement **không được phép giả định trạng thái hiện tại của hệ thống**. Mọi giả định đều phải được xác minh thực tế trong giai đoạn Audit (Discovery).  
> Nếu Audit phát hiện hiện trạng hệ thống khác với Business Requirement, Business Requirement không tự động đúng. Reviewer sẽ quyết định Business hay System phải thay đổi.

---

## 1. Tổng quan & Mục tiêu Business

Sau khi hoàn thành chuẩn hóa Database tại Task `010826_Sectors_Ecosystems_Database_Normalization`, PostgreSQL đã trở thành **Business Source of Truth (BSSoT)** duy nhất cho dữ liệu Ngành (`sectors`) và Hệ sinh thái (`ecosystems`).

Mục tiêu nghiệp vụ của Task này là xây dựng hoàn chỉnh **Capability Quản trị Chính thức cho Admin** trên giao diện điều hành, cho phép Admin trực tiếp tác nghiệp quản lý dữ liệu Business Source of Truth một cách tập trung, bảo mật và toàn vẹn.

Các mục tiêu Business trọng tâm:
1. **Quản lý Tập trung:** Cho phép Admin xem, tạo mới, cập nhật và quản lý trạng thái (`Active` / `Inactive`) của Ngành và Hệ sinh thái.
2. **Bảo vệ Tính Toàn vẹn (Single SSoT):** Đảm bảo Admin UI chỉ đóng vai trò là Consumer. Tuyệt đối không tạo bất kỳ Data Owner mới nào (`localStorage`, `registry cache`, `seed`, `hardcode`, `mock`, `duplicate state owner`).
3. **Quản lý Vòng đời Dữ liệu & Quy tắc Xóa:**
   - **Vòng đời Trạng thái (Status Lifecycle):**
     - `Active`: Ngành/Hệ sinh thái đang hoạt động và hiển thị công khai trên ứng dụng.
     - `Inactive`: Ngành/Hệ sinh thái ngưng hoạt động / tạm ẩn khỏi kênh công khai nhưng bảo toàn toàn bộ dữ liệu lịch sử và các liên kết.
   - **Cơ chế Xóa vĩnh viễn có điều kiện (Conditional Hard Delete):**
     - **Đang được sử dụng (`reference_count > 0`):** Nếu sector/ecosystem đang được bất kỳ cổ phiếu (stock), bài viết (post) hoặc dữ liệu hệ thống nào tham chiếu → **TUYỆT ĐỐI KHÔNG CHO PHÉP XÓA (Hard Delete bị chặn)**. Hệ thống yêu cầu/chỉ cho phép chuyển trạng thái sang `Inactive`.
     - **Chưa từng được tham chiếu (`reference_count == 0`):** Nếu sector/ecosystem hoàn toàn chưa được tham chiếu bởi bất kỳ dữ liệu nào → **CHO PHÉP XÓA VĨNH VIỄN (Hard Delete)** khỏi Database.

### Quy trình Quản trị Thay đổi iFLUX (iFLUX Change Governance Lifecycle):
Task này tuân thủ nghiêm ngặt chu trình 8 bước tuần tự:  
`Business Requirements (01)` ➔ `Audit / Discovery (02)` ➔ `Governing SoT (03)` ➔ `Solution (04)` ➔ `Implementation Plan (05)` ➔ `Implementation` ➔ `Verification` ➔ `Acceptance`.

> [!CAUTION]
> **Quy tắc Phase Gate:** Mỗi bước phải được Reviewer kiểm duyệt và ký **PASS / APPROVE** mới được mở Phase tiếp theo. Tuyệt đối không tạo song song các tài liệu `03`, `04`, `05` hay viết code trước.

---

## 2. Mandatory Audit Phase (Giai đoạn Khám phá Hiện trạng Bắt buộc)

Trước khi đề xuất giải pháp kỹ thuật (Solution) và lập kế hoạch thực thi (Implementation Plan), hệ thống phải trải qua **Giai đoạn Audit Độc lập** để khám phá hiện trạng thực tế mà không bị dẫn dắt bởi bất kỳ giả định nào.

Giai đoạn Audit phải sản sinh ra Sản phẩm Bắt buộc [`02-Context-Audit.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/02-Context-Audit.md) bao gồm 6 mục nội dung tiêu chuẩn:
1. **Current State:** Hiện trạng thực tế tại Database, Backend API, Frontend UI và Navigation.
2. **Gap Analysis:** Bảng phân tích lỗ hổng giữa Business Requirement và hiện trạng.
3. **Risk Analysis:** Đánh giá rủi ro phá vỡ SoT, sinh duplicate owner hoặc dữ liệu rác.
4. **Reuse Analysis:** Khảo sát toàn bộ các Capability reusable có sẵn (Table, Modal, Toast, Search, Pagination, Permission Guard) để tái sử dụng 100%.
5. **Evidence:** Bằng chứng thực tế thu thập từ SQL Query, Code Audit, Network Inspection.
6. **Recommendation:** Khuyến nghị làm đầu vào cho tài liệu Solution (`04-Solution.md`).

---

## 3. Yêu cầu Năng lực Nghiệp vụ (Business Capabilities Required)

> [!NOTE]
> Các năng lực nghiệp vụ dưới đây là **mục tiêu Business**. Audit, Governing SoT và Solution có trách nhiệm xác định cách hiện thực phù hợp. Business Requirement không áp đặt giải pháp kỹ thuật.

1. **Điều hướng Quản trị (Admin Navigation):** Tích hợp menu và tuyến điều hướng chuẩn cho Quản lý Ngành và Quản lý Hệ sinh thái.
2. **Hiển thị & Tra cứu Dữ liệu (Read & Search):** Cho phép xem danh sách bản ghi đầy đủ thông tin chuẩn (ID, Tên, Mã, Slug, Thứ tự hiển thị, Trạng thái `Active`/`Inactive`, Số lượng mã cổ phiếu & bài viết liên kết, Thời gian cập nhật).
3. **Thao tác Nghiệp vụ Tập trung (CRUD, Status Toggle & Conditional Hard Delete):** 
   - **Thêm mới & Chỉnh sửa:** Tạo mới và cập nhật các thuộc tính bản ghi.
   - **Quản lý Trạng thái (Active <-> Inactive):** Cho phép bật/tắt trạng thái hoạt động. Khi chuyển sang `Inactive`, bản ghi bị ẩn khỏi Public Market API nhưng giữ nguyên dữ liệu tham chiếu lịch sử trong DB.
   - **Xóa có điều kiện (Conditional Hard Delete):**
     - **Trường hợp A — Sector/Ecosystem đang có tham chiếu (Ví dụ: `Tech` có 523 stocks / bài viết):** Hệ thống **KHÔNG CHO PHÉP DELETE** (Hard Delete bị chặn với thông báo rõ ràng). Admin chỉ được chuyển trạng thái bản ghi sang `Inactive`.
     - **Trường hợp B — Sector/Ecosystem chưa từng được tham chiếu (Ví dụ: `Test123` có 0 stock, 0 bài viết):** Hệ thống **CHO PHÉP DELETE VĨNH VIỄN (Hard Delete)** trực tiếp khỏi Database.
4. **Quy tắc Sắp xếp & Hiển thị (Ordering Rules):** Hiển thị danh sách được ưu tiên sắp xếp theo thứ tự hiển thị (`display_order ASC`) và tên tiếng Việt (`name_vi ASC`).
5. **Ràng buộc An toàn Nghiệp vụ (Business Validation):** Đảm bảo mã (`code`) và `slug` không bị trùng lặp, kiểm tra tổng lượng tham chiếu (`stocks`, `posts`, v.v.) trước khi xử lý yêu cầu xóa.

---

## 4. Tiêu chí Nghiệm thu Nghiệp vụ & Quản trị (Governance Acceptance Criteria)

Task chỉ được đánh giá **PASS** khi hoàn thành đầy đủ cả 2 nhóm tiêu chí:

### A. Tiêu chí Quản trị Quy trình (Governance AC)
- [ ] **AC-GOV-1:** Báo cáo Khảo sát Hiện trạng [`02-Context-Audit.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/02-Context-Audit.md) hoàn tất qua 6 mục nội dung tiêu chuẩn và được Reviewer PASS.
- [ ] **AC-GOV-2:** Tài liệu Governing SoT [`03-Governing-SoT.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/03-Governing-SoT.md) xác nhận không có xung đột kiến trúc và được Reviewer PASS.
- [ ] **AC-GOV-3:** Thiết kế Giải pháp [`04-Solution.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/04-Solution.md) được Reviewer PASS.
- [ ] **AC-GOV-4:** Kế hoạch Triển khai [`05-Implementation-Plan.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Admin_Sectors_Ecosystems_Capability/05-Implementation-Plan.md) được Reviewer PASS trước khi đụng vào mã nguồn.

### B. Tiêu chí Năng lực Nghiệp vụ (Business AC)
- [ ] **AC-BUS-1:** PostgreSQL tiếp tục là Business Source of Truth duy nhất.
- [ ] **AC-BUS-2:** Admin UI hoàn toàn đóng vai trò là Consumer.
- [ ] **AC-BUS-3:** Tuyệt đối không phát sinh Data Owner mới hoặc dữ liệu rác (`localStorage`, `registry`, `mock`, `hardcode`).
- [ ] **AC-BUS-4:** Nghiệp vụ CRUD, Soft Delete và Restore hoạt động chính xác qua REST API.
- [ ] **AC-BUS-5:** Đầy đủ bộ Bằng chứng xác thực (Database, Network Log, UI Render, Lifecycle Test).
