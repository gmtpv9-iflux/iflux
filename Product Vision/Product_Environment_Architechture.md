# iFlux — Backend Development Bootstrap

---

**Mã tài liệu:** BACKEND_BOOTSTRAP
**Phiên bản:** 1.0.0
**Trạng thái:** LOCKED — Bootstrap Phase
**Phạm vi:** Backend Foundation Initialization
**Nguồn SoT:** Product Vision, Product Strategy, BRD, IA, PRD, PEP, Tech Specification

---

# 1. Mục đích

Tài liệu này định nghĩa phạm vi và nguyên tắc khởi tạo Backend cho dự án iFlux.

Mục tiêu của giai đoạn Bootstrap là xây dựng **Backend Foundation** làm nền tảng thống nhất cho toàn bộ quá trình phát triển sau này.

Trong giai đoạn này **không triển khai Business Logic** của bất kỳ nghiệp vụ nào. Mọi thành phần được xây dựng chỉ nhằm thiết lập kiến trúc, framework và các quy ước kỹ thuật phục vụ cho việc phát triển lâu dài.

---

# 2. Mục tiêu

Backend phải được thiết kế theo kiến trúc Production-Ready ngay từ đầu.

Hệ thống phải hỗ trợ đầy đủ ba môi trường độc lập:

* Local Development
* Staging
* Production

Mọi module được phát triển trong tương lai phải kế thừa cùng một nền tảng kỹ thuật và cùng một tiêu chuẩn triển khai.

---

# 3. Phạm vi triển khai

Trong giai đoạn Bootstrap chỉ được phép xây dựng hạ tầng kỹ thuật của hệ thống.

Bao gồm nhưng không giới hạn:

## 3.1 Project Foundation

Thiết lập nền tảng dự án:

* Project Structure
* Dependency Management
* Configuration Management
* Environment Variables
* Logging
* Error Handling
* Response Convention
* Validation
* Middleware
* Authentication Framework
* Authorization Framework
* Database Connection
* ORM Configuration
* Migration System
* Seeder System
* Cache Layer
* File Storage Layer
* Queue Framework
* Scheduler Framework
* API Versioning
* Swagger / OpenAPI
* Health Check
* Docker (nếu áp dụng)
* Unit Test Framework
* Integration Test Framework

Các thành phần trên chỉ được triển khai ở mức framework và kiến trúc. Không được cài đặt nghiệp vụ cụ thể.

---

## 3.2 Environment Strategy

Chuẩn bị đầy đủ ba môi trường hoạt động độc lập.

### Local

* Local Database
* Local Redis
* Local Storage

Phục vụ phát triển và kiểm thử hằng ngày.

### Staging

* Staging Database
* Staging Redis
* Staging Storage

Phục vụ kiểm thử tích hợp và nghiệm thu trước khi phát hành.

### Production

* Production Database
* Production Redis
* Production Storage

Phục vụ vận hành chính thức.

Ba môi trường phải được tách biệt hoàn toàn.

Việc chuyển đổi môi trường phải thông qua Environment Variables. Tuyệt đối không được hardcode bất kỳ cấu hình nào.

---

## 3.3 Development Standard

Thiết lập tiêu chuẩn thống nhất cho toàn bộ Backend.

Bao gồm:

* Naming Convention
* Folder Structure
* Module Structure
* DTO
* Entity
* Repository
* Service
* Controller
* Exception
* Constants
* Helper
* Utilities
* Common Library

Mọi module phát triển sau này phải tuân thủ cùng một cấu trúc và cùng một Coding Convention.

---

## 3.4 Documentation

Trong quá trình Bootstrap phải đồng thời sinh đầy đủ tài liệu kỹ thuật phục vụ bảo trì và mở rộng hệ thống.

Bao gồm:

* Backend Folder Architecture
* API Architecture
* Environment Variables
* Deployment Flow
* Coding Convention
* Module Template

---

# 4. Ngoài phạm vi (Out of Scope)

Các nội dung sau **không thuộc phạm vi của giai đoạn Bootstrap** và không được triển khai trong tài liệu hoặc mã nguồn của giai đoạn này:

* User
* Authentication Business Logic
* Membership
* Subscription
* Payment
* Stock
* Money Flow
* AI
* Watchlist
* Notification
* Admin
* Bất kỳ nghiệp vụ kinh doanh nào khác.

---

# 5. Quy trình triển khai

Trước khi sinh mã nguồn, hệ thống phải hoàn thành bước phân tích và đề xuất kiến trúc.

Thứ tự thực hiện bắt buộc như sau:

1. Phân tích kiến trúc Backend tổng thể.
2. Đề xuất cấu trúc thư mục.
3. Đề xuất package, framework và lý do lựa chọn.
4. Đề xuất quy trình phát triển Local → Staging → Production.
5. Chờ phê duyệt kiến trúc.
6. Chỉ sau khi được phê duyệt mới được phép sinh mã nguồn.

Không được tự động triển khai Backend khi chưa có xác nhận.

---

# 6. Nguyên tắc bắt buộc

Trong toàn bộ giai đoạn Bootstrap phải tuân thủ các nguyên tắc sau:

* Kiến trúc được ưu tiên trước nghiệp vụ.
* Framework được xây dựng trước Module.
* Chuẩn hóa trước khi mở rộng.
* Không phát sinh Business Logic.
* Không tự ý thay đổi kiến trúc khi chưa được phê duyệt.
* Mọi module về sau phải kế thừa Foundation đã được thiết lập trong giai đoạn này.

---

# 7. Tiêu chí hoàn thành

Giai đoạn Bootstrap được xem là hoàn thành khi đáp ứng đầy đủ các điều kiện sau:

* Backend Foundation đã được thiết lập.
* Ba môi trường Local, Staging và Production đã được chuẩn bị.
* Coding Standard đã được thống nhất.
* Documentation đã được sinh đầy đủ.
* Kiến trúc Backend đã được phê duyệt.
* Hệ thống sẵn sàng cho việc triển khai các Business Module trong các giai đoạn tiếp theo.

---
# iFlux — Development Control Specification

---

**Mã tài liệu:** DEVELOPMENT_CONTROL_SPECIFICATION

**Phiên bản:** 1.0.0

**Trạng thái:** LOCKED

**Phạm vi:** Development Governance • Feature Lifecycle • Release Control • AI Collaboration

**Đối tượng áp dụng:** Tất cả quá trình phát triển Backend, Frontend và AI của iFlux.

**Nguồn SoT:**

* Product Vision
* Product Strategy
* BRD
* IA
* PRD
* PEP
* Tech Specification
* Backend Bootstrap

---

# 1. Mục đích

Tài liệu này định nghĩa cơ chế kiểm soát toàn bộ vòng đời phát triển của iFlux.

Mục tiêu là đảm bảo mọi thay đổi đối với mã nguồn đều được thực hiện theo một quy trình thống nhất, có khả năng kiểm soát, truy vết và phát hành an toàn.

Tài liệu này không quy định cách viết mã nguồn mà quy định cách một thay đổi được tạo ra, kiểm thử, phê duyệt và phát hành.

---

# 2. Nguyên tắc

Toàn bộ quá trình phát triển phải tuân thủ các nguyên tắc sau:

* Mọi thay đổi phải thuộc một Feature xác định.
* Không tồn tại thay đổi "không rõ mục đích".
* Mỗi thời điểm chỉ tập trung hoàn thành một Feature trước khi chuyển sang Feature khác (trừ khi có quyết định khác).
* Feature chỉ được phát hành khi hoàn thành đầy đủ vòng đời quy định.
* Không được triển khai trực tiếp lên Production từ môi trường Local.
* Không được bỏ qua Staging trong quy trình phát hành chính thức.

---

# 3. Môi trường phát triển

## Local

Mục đích:

* Phát triển.
* Debug.
* Unit Test.
* Kiểm thử hằng ngày.

Đây là môi trường duy nhất được phép thay đổi mã nguồn liên tục.

---

## Staging

Mục đích:

* Kiểm thử tích hợp.
* Regression Test.
* Kiểm thử trước phát hành.
* Xác nhận chất lượng Release.

Staging phải phản ánh Production gần nhất có thể.

---

## Production

Mục đích:

* Phục vụ người dùng cuối.

Chỉ tiếp nhận các phiên bản đã được phê duyệt.

---

# 4. Development Workflow

Mọi Feature phải tuân theo quy trình sau:

```text
Planning
    ↓
Implementation
    ↓
Local Test
    ↓
Ready for Staging
    ↓
Staging Test
    ↓
Approved
    ↓
Released
```

Không được bỏ qua bất kỳ bước nào.

---

# 5. Feature Lifecycle

## PLANNING

Được phép:

* Phân tích.
* Thiết kế.
* Chuẩn bị tài liệu.

Không được sửa mã nguồn.

---

## IMPLEMENTATION

Được phép:

* Viết mã nguồn.
* Refactor trong phạm vi Feature.
* Bổ sung Unit Test.

---

## LOCAL TEST

Được phép:

* Debug.
* Sửa lỗi.
* Kiểm thử toàn bộ Feature trên Local.

Không bổ sung tính năng mới.

---

## READY FOR STAGING

Feature được đóng băng.

Chỉ được phép sửa lỗi nếu phát hiện vấn đề trước khi đưa lên Staging.

---

## STAGING TEST

Được phép:

* Regression Test.
* Integration Test.
* UAT.

Không thay đổi thiết kế hoặc kiến trúc.

---

## APPROVED

Feature đã đạt điều kiện phát hành.

Mã nguồn được đóng băng.

Chỉ được phép tạo Release.

---

## RELEASED

Feature đã phát hành lên Production.

Mọi thay đổi tiếp theo phải thông qua một Feature hoặc Hotfix mới.

---

# 6. Feature Boundary

Mỗi Feature phải có phạm vi rõ ràng.

Trong quá trình phát triển:

* Chỉ được sửa các Module thuộc Feature hiện tại.
* Không được sửa các Module không liên quan nếu chưa có phê duyệt.

Nếu cần thay đổi ngoài phạm vi Feature:

* Phải dừng triển khai.
* Báo cáo phạm vi ảnh hưởng.
* Chờ xác nhận trước khi tiếp tục.

---

# 7. Release Control

Một Feature chỉ được phép phát hành khi đáp ứng tối thiểu các điều kiện sau:

* Hoàn thành Implementation.
* Local Test thành công.
* Build thành công.
* Không còn lỗi nghiêm trọng.
* Đã triển khai Staging.
* Đã hoàn thành kiểm thử trên Staging.
* Đã được phê duyệt.

Nếu thiếu bất kỳ điều kiện nào, Feature không được phép Release.

---

# 8. AI Collaboration Rules

AI là công cụ hỗ trợ phát triển, không phải thực thể quyết định kiến trúc.

AI phải tuân thủ các nguyên tắc sau:

* Không tự ý thay đổi kiến trúc.
* Không tự ý đổi cấu trúc thư mục.
* Không tự ý thay đổi Coding Convention.
* Không tự ý thay đổi API Contract.
* Không tự ý thay đổi Database Schema ngoài phạm vi Feature.
* Không tự ý triển khai lên Staging hoặc Production.
* Không tự ý Merge hoặc Release.

Nếu phát hiện yêu cầu vượt ngoài phạm vi hiện tại, AI phải dừng và yêu cầu xác nhận.

---

# 9. Human Approval

Chỉ chủ dự án hoặc người được ủy quyền mới có quyền:

* Phê duyệt thay đổi kiến trúc.
* Phê duyệt Feature.
* Phê duyệt Release.
* Phê duyệt Hotfix.
* Phê duyệt thay đổi phạm vi.

AI không được phép thay thế bước phê duyệt này.

---

# 10. Hotfix

Hotfix chỉ áp dụng cho lỗi trên Production.

Hotfix phải:

* Có phạm vi tối thiểu.
* Không mở rộng tính năng.
* Không Refactor.
* Không thay đổi kiến trúc.

Sau khi phát hành phải đồng bộ trở lại nhánh phát triển.

---

# 11. Rollback

Mọi Release đều phải có khả năng Rollback.

Nếu Release không đạt yêu cầu trên Production:

* Dừng phát hành.
* Khôi phục phiên bản ổn định gần nhất.
* Phân tích nguyên nhân.
* Tạo Feature hoặc Hotfix mới.

Không sửa trực tiếp trên Production.

---

# 12. Definition of Done

Một Feature được coi là hoàn thành khi:

* Đã hoàn thành toàn bộ phạm vi.
* Đã kiểm thử trên Local.
* Đã kiểm thử trên Staging.
* Đã được phê duyệt.
* Đã phát hành thành công.
* Đã cập nhật tài liệu liên quan nếu có thay đổi.

---

# 13. Mandatory Rules

Trong toàn bộ quá trình phát triển, các quy định sau là bắt buộc:

* Không phát triển ngoài phạm vi Feature.
* Không phát hành trực tiếp từ Local.
* Không bỏ qua Staging.
* Không thay đổi kiến trúc khi chưa được phê duyệt.
* Không triển khai Business Logic ngoài kế hoạch hiện tại.
* Mọi thay đổi đều phải có khả năng truy vết đến Feature tương ứng.

---

# 14. Acceptance Criteria

Tài liệu này được coi là áp dụng thành công khi:

* Mọi Feature đều có vòng đời rõ ràng.
* Mọi thay đổi đều thuộc một Feature xác định.
* AI và lập trình viên tuân thủ cùng một quy trình phát triển.
* Quy trình Local → Staging → Production được áp dụng thống nhất.
* Không có thay đổi hoặc Release vượt ngoài cơ chế kiểm soát của tài liệu này.
