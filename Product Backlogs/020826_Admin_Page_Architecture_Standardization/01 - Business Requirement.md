# Business Requirement — Chuẩn hóa Kiến trúc Trang Admin (Admin Page Architecture Standardization)

|                 |                   |
| --------------- | ----------------- |
| **Document ID** | BR-ADMIN-ARCH-001 |
| **Version**     | 1.0               |
| **Status**      | 🔒 **LOCKED**     |
| **Date**        | 2026-08-02        |
| **Owner**       | Product Owner     |
| **Priority**    | High              |


---

# 1. Business Background

Trong quá trình mở rộng các module quản trị (ví dụ: Stocks, Sectors, Ecosystems...), hệ thống xuất hiện dấu hiệu sử dụng nhiều convention khác nhau cho cùng một loại trang Admin.

Hiện tại chưa tồn tại một **Business Source of Truth (SoT)** quy định thống nhất về kiến trúc của các trang Admin, bao gồm:

* cấu trúc thư mục
* cấu trúc file
* URL convention
* routing convention
* infrastructure mapping

Việc thiếu một chuẩn thống nhất khiến các module mới có thể được phát triển theo các convention khác nhau, dẫn đến khó bảo trì và tăng rủi ro phát sinh lỗi khi triển khai Production.

---

# 2. Business Problem

Hệ thống hiện chưa có một quy định thống nhất về kiến trúc của Admin Pages.

Điều này dẫn tới các rủi ro:

* Các module Admin có thể được xây dựng theo nhiều convention khác nhau.
* Infrastructure phải bổ sung nhiều special-case để phục vụ từng module.
* Khó mở rộng các module mới.
* Tăng chi phí bảo trì dài hạn.
* Khó xác định nguyên nhân khi phát sinh lỗi routing hoặc deployment.
* Không có tiêu chuẩn để review hoặc nghiệm thu các module mới.

---

# 3. Business Objective

Thiết lập một **Business Source of Truth duy nhất** cho kiến trúc Admin nhằm đảm bảo:

* toàn bộ Admin sử dụng cùng một convention;
* mọi module mới phải tuân theo convention này;
* giảm special-case trong toàn hệ thống;
* giảm chi phí bảo trì lâu dài;
* tạo nền tảng thống nhất cho các tài liệu SoT, Solution và Implementation sau này.

---

# 4. Business Scope

## In Scope

* Kiến trúc tổng thể của Admin Pages.
* Convention cấu trúc thư mục.
* Convention cấu trúc file.
* URL Convention.
* Router Convention.
* Navigation Convention.
* Infrastructure Mapping liên quan đến Admin Pages.

## Out of Scope

* Business Logic.
* API.
* Database.
* Permission.
* UI/UX.
* Tính năng mới.
* Performance Optimization.

---

# 5. Mandatory Audit (Bắt buộc)

**Không được phép đề xuất Solution hoặc sửa code trước khi hoàn thành Audit.**

Mục tiêu của Audit là xác định **Business Source of Truth** dựa trên kiến trúc thực tế của hệ thống, không dựa trên giả định.

Audit phải sử dụng bằng chứng (code, cấu trúc thư mục, cấu hình, lịch sử thay đổi...) và tuyệt đối không suy đoán.

---

## 5.1 Existing Architecture Audit

Xác định:

* Kiến trúc hiện tại của toàn bộ Admin.
* Convention đang được sử dụng.
* Mức độ đồng nhất của hệ thống.

---

## 5.2 Historical Audit

Xác định:

* Convention nào đã tồn tại trước.
* Convention nào mới xuất hiện.
* Những thay đổi đó được tạo ra ở thời điểm nào.
* Có phải đây là chủ đích thiết kế hay chỉ là kết quả của từng phase triển khai.

Mọi kết luận phải có bằng chứng.

---

## 5.3 Consistency Audit

Đánh giá mức độ thống nhất giữa:

* Physical Files
* Router
* Navigation
* Infrastructure

Chỉ rõ layer nào đang đồng nhất và layer nào đang lệch so với phần còn lại.

---

## 5.4 Root Cause Analysis

Xác định nguyên nhân gốc của sự không đồng nhất.

Không được dừng ở triệu chứng (ví dụ: 404 hoặc rewrite).

Phải chỉ rõ:

* nguyên nhân gốc,
* phạm vi ảnh hưởng,
* mức độ ảnh hưởng.

---

## 5.5 Convention Analysis

Audit phải xác định:

* hiện đang tồn tại bao nhiêu convention;
* convention nào đang được sử dụng nhiều nhất;
* convention nào phản ánh đúng kiến trúc tổng thể của Admin.

Không được lựa chọn convention chỉ vì phù hợp với một module riêng lẻ.

---

# 6. Audit Deliverables

Audit phải tạo tối thiểu các tài liệu sau:

* Existing Architecture Inventory.
* Convention Inventory.
* Consistency Matrix.
* Historical Analysis.
* Root Cause Analysis.
* Candidate Convention Analysis.
* Recommendation Report.

---

# 7. Business Decision Required

Sau khi hoàn thành Audit, phải trình Product Owner:

* Business Source of Truth được đề xuất.
* Lý do lựa chọn.
* Ưu điểm.
* Nhược điểm.
* Phạm vi ảnh hưởng.
* Chi phí migration.
* Rủi ro nếu không chuẩn hóa.

Product Owner sẽ quyết định convention chính thức trước khi bước sang Solution.

---

# 8. Success Criteria

Business Requirement được coi là hoàn thành khi:

* Đã xác định rõ một Business Source of Truth cho kiến trúc Admin.
* Đã xác định nguyên nhân gốc của sự không đồng nhất.
* Đã có đầy đủ bằng chứng cho mọi kết luận.
* Đã có Recommendation được Product Owner xem xét.
* Chưa thực hiện bất kỳ thay đổi code hoặc Infrastructure nào.

---

# 9. Constraints

Trong phạm vi Business Requirement này:

* Không sửa code.
* Không sửa Router.
* Không sửa Navigation.
* Không sửa Nginx.
* Không deploy.
* Không tạo workaround.
* Không tạo special-case.
* Không lựa chọn solution trước khi Audit hoàn thành.

---

# 10. Risks

Nếu không chuẩn hóa:

* Tiếp tục xuất hiện nhiều convention trong Admin.
* Infrastructure phải bổ sung special-case theo từng module.
* Gia tăng chi phí bảo trì.
* Khó mở rộng hệ thống.
* Khó review và nghiệm thu các module mới.
* Gia tăng rủi ro phát sinh lỗi Production.

---

# 11. Next Governance Steps

Business Requirement này chỉ nhằm xác định vấn đề và yêu cầu Audit.

Quy trình bắt buộc sau khi BR được phê duyệt:

```text
Business Requirement
        ↓
Architecture Audit
        ↓
Business Source of Truth (SoT)
        ↓
Solution Design
        ↓
Implementation Plan
        ↓
Implementation
        ↓
Verification
```
