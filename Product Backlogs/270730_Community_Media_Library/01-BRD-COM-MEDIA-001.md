# Business Requirements Document (BRD)

# Community Media Library & Image Localization

| | |
|--|--|
| **Document ID** | BRD-COM-MEDIA-001 |
| **Version** | 1.0 |
| **Status** | Draft → **Owner Review** |
| **Date** | 2026-07-30 |
| **Folder** | `docs/Product Backlog/270730_Community_Media_Library/` |

---

# 1. Mục tiêu

Xây dựng tính năng **Media Library** cho Module Quản lý cộng đồng nhằm chuẩn hóa việc quản lý hình ảnh trong bài viết.

Mọi hình ảnh xuất hiện trong bài viết Community phải trở thành tài sản (**Media Asset**) do iFlux quản lý trước khi bài viết được lưu hoặc xuất bản.

Tính năng này giúp:

* Chủ động quản lý toàn bộ hình ảnh.
* Loại bỏ phụ thuộc vào website bên ngoài.
* Đảm bảo tính ổn định của nội dung theo thời gian.
* Chuẩn hóa quản lý media trên toàn hệ thống.
* Tạo nền tảng cho các tính năng mở rộng trong tương lai.
* Xây dựng **Media Library như SEO Asset Repository** của iFlux (**BG-SEO-01**).

---

# 2. Bối cảnh

Hiện nay phần lớn bài viết được tạo từ RSS hoặc nguồn HTML bên ngoài.

Trong nội dung bài viết tồn tại nhiều liên kết hình ảnh trỏ trực tiếp tới website nguồn.

Ví dụ:

* Website A / Website B
* RSS Provider
* CDN của bên thứ ba

Rủi ro:

* Website nguồn xóa ảnh / đổi đường dẫn / chặn hotlink.
* Nội dung bài viết mất hình ảnh.
* Không kiểm soát chất lượng hình ảnh.
* Không quản lý được tài sản media của iFlux.
* Tên file ngẫu nhiên / URL ngoài domain → **giảm giá trị SEO**.

---

# 3. Mục tiêu kinh doanh

Sau khi triển khai:

* 100% hình ảnh trong Community thuộc quyền quản lý của iFlux.
* Không còn phụ thuộc vào hình ảnh của bên thứ ba.
* Editor thao tác nhanh hơn.
* Hình ảnh được quản trị tập trung.
* Có khả năng audit nguồn gốc hình ảnh.
* Hỗ trợ SEO tốt hơn (Image Search · On-page · domain ổn định).
* Tạo nền tảng dùng chung cho các module khác.

| ID | Mục tiêu |
|----|----------|
| **BO-07** | Chuẩn hóa toàn bộ hình ảnh theo chiến lược SEO của iFlux. |
| **BO-08** | Tăng khả năng hình ảnh được lập chỉ mục (Image Search) bởi công cụ tìm kiếm. |
| **BO-09** | Tăng mức độ nhất quán giữa URL, tên file và nội dung bài viết nhằm cải thiện SEO On-page. |

### Business Goal (lâu dài)

> **BG-SEO-01 — Xây dựng Media Library như một tài sản SEO (SEO Asset Repository) của iFlux.**

Media Library không chỉ là nơi “lưu ảnh”, mà là **kho tài sản SEO** của hệ thống. Mọi hình ảnh chuẩn hóa về:

* URL nội bộ (domain iFlux).
* Tên file thân thiện SEO.
* Alt Text.
* Metadata.
* Khả năng tái sử dụng.

Mọi quyết định Solution / SoT / Implementation sau này phải nhất quán với BG-SEO-01 — **không** giới hạn ở mục tiêu “thay link ảnh”.

---

# 4. Phạm vi

## Trong phạm vi

* Module Quản lý cộng đồng.
* Trang sửa bài viết.
* Trang Media Library.
* Import hình ảnh từ HTML.
* Lưu Media Asset.
* Thay thế URL hình ảnh trong bài viết.
* Quản lý Media Asset (metadata · tìm kiếm · usage · audit · SEO fields).

## Ngoài phạm vi

* Upload video.
* Quản lý tài liệu.
* CDN đa vùng.
* AI xử lý hình ảnh.
* Chỉnh sửa / cắt hình ảnh.
* Watermark.
* OCR.
* Phiên bản hóa (versioning) Media Asset.

---

# 5. Stakeholders

| Vai trò | Trách nhiệm |
|---------|-------------|
| Product Owner | Phê duyệt nghiệp vụ |
| Editor | Import và quản lý bài viết |
| Administrator | Quản lý Media Library |
| System | Tự động xử lý Media Import |

---

# 6. Business Problems

### BP-01

Bài viết phụ thuộc hình ảnh bên ngoài.

### BP-02

Không có thư viện media tập trung.

### BP-03

Không thể biết hình ảnh đang được bài viết nào sử dụng.

### BP-04

Editor phải xử lý thủ công nếu muốn lưu hình ảnh.

### BP-05

Không có khả năng audit nguồn gốc hình ảnh.

### BP-06

Tên hình ảnh không chuẩn hóa.

### BP-07

Có khả năng lưu trùng nhiều bản giống nhau.

### BP-08

Hình ảnh lấy từ RSS hoặc website bên ngoài thường có tên file ngẫu nhiên, không phản ánh nội dung bài viết, làm giảm giá trị SEO.

### BP-09

Website không kiểm soát được URL hình ảnh nên không thể chuẩn hóa chiến lược SEO cho Media Asset.

### BP-10

Hình ảnh thuộc domain bên ngoài làm giảm khả năng xây dựng hệ sinh thái nội dung và tài sản số của iFlux.

---

# 7. Business Objectives

### BO-01

Mỗi bài viết chỉ cần một thao tác để chuyển toàn bộ hình ảnh ngoài thành hình ảnh nội bộ.

### BO-02

Toàn bộ hình ảnh được quản lý trong Media Library.

### BO-03

Editor không cần thao tác HTML.

### BO-04

Mỗi Media Asset có thể được quản lý độc lập.

### BO-05

Có thể tìm kiếm Media Asset theo nhiều tiêu chí.

### BO-06

Có thể truy vết nguồn gốc hình ảnh.

*(BO-07 … BO-09 — xem §3.)*

---

# 8. Functional Requirements

### FR-01

Hệ thống phải phát hiện toàn bộ hình ảnh bên ngoài trong nội dung bài viết.

### FR-02

Hệ thống phải cho phép Editor thực hiện import toàn bộ hình ảnh bằng một thao tác.

### FR-03

Sau khi import thành công, toàn bộ hình ảnh phải được lưu vào Media Library.

### FR-04

Sau khi import thành công, toàn bộ URL hình ảnh trong bài viết phải được cập nhật sang URL nội bộ.

### FR-05

Media Library phải lưu thông tin quản trị của từng Media Asset — tối thiểu:

* tên file
* URL nội bộ
* kích thước
* độ phân giải
* nguồn gốc
* thời gian tạo
* người tạo
* trạng thái

### FR-06

Media Library phải hỗ trợ xem trước hình ảnh.

### FR-07

Media Library phải hỗ trợ tìm kiếm.

### FR-08

Media Library phải hỗ trợ xác định Media Asset đang được bài viết nào sử dụng.

### FR-09

Media Library phải tránh tạo Media Asset trùng lặp khi nội dung hình ảnh giống nhau.

### FR-10

Hệ thống phải lưu thông tin nguồn gốc của hình ảnh để phục vụ audit.

### FR-11

Hệ thống phải chuẩn hóa tên file Media Asset theo quy tắc thống nhất của hệ thống nhằm hỗ trợ SEO và khả năng quản trị.

### FR-12

Mỗi Media Asset phải có khả năng lưu và quản lý thuộc tính **Alt Text**.  
Alt Text có thể được kế thừa từ nội dung bài viết hoặc được Editor chỉnh sửa.

### FR-13

Sau khi import, bài viết phải sử dụng URL hình ảnh thuộc **domain quản lý của iFlux**.

---

# 9. User Stories

### US-01

Là Editor, tôi muốn import toàn bộ hình ảnh trong bài viết, để không phải tải từng ảnh thủ công.

### US-02

Là Editor, tôi muốn hệ thống tự thay toàn bộ liên kết hình ảnh, để bài viết chỉ sử dụng hình ảnh nội bộ.

### US-03

Là Administrator, tôi muốn quản lý toàn bộ Media Asset, để dễ tìm kiếm và kiểm soát.

### US-04

Là Administrator, tôi muốn biết hình ảnh đang được bài viết nào sử dụng, để tránh xóa nhầm.

### US-05

Là Product Owner, tôi muốn toàn bộ Community sử dụng Media Asset nội bộ, để không phụ thuộc website bên ngoài.

---

# 10. Business Rules

### BR-01

Một bài viết đã hoàn thành import không được tham chiếu hình ảnh bên ngoài.

### BR-02

Mỗi Media Asset phải có định danh duy nhất trong hệ thống.

### BR-03

Media Asset phải được lưu trong Media Library trước khi được sử dụng trong bài viết.

### BR-04

Mỗi Media Asset phải lưu nguồn gốc ban đầu để phục vụ truy vết.

### BR-05

Media Library là nơi quản lý duy nhất của Media Asset.

### BR-06

Tên file Media Asset phải được chuẩn hóa theo quy tắc thống nhất của hệ thống.

### BR-07

Tên file Media Asset phải phản ánh nội dung bài viết và tuân theo quy tắc đặt tên thống nhất của hệ thống.

### BR-08

Media Asset phải hỗ trợ metadata phục vụ SEO, tối thiểu gồm:

* File Name
* Alt Text
* URL nội bộ

### BR-09

Mọi URL hình ảnh hiển thị trong Community phải thuộc domain do iFlux quản lý.

---

# 11. Non-functional Requirements

## Hiệu năng

* Import nhiều hình ảnh trong một lần thao tác.
* Không làm gián đoạn quá trình chỉnh sửa bài viết.

## Độ tin cậy

* Nếu một hình ảnh lỗi, các hình ảnh còn lại vẫn tiếp tục xử lý.

## Khả năng mở rộng

Media Library phải có khả năng mở rộng để phục vụ nhiều module ngoài Community trong tương lai.

---

# 12. Success Metrics

Hệ thống được xem là thành công khi:

* 100% bài viết mới sử dụng Media Asset nội bộ.
* Editor chỉ cần một thao tác để import toàn bộ hình ảnh.
* Không còn phụ thuộc vào hotlink của bên thứ ba.
* Có thể tìm kiếm và quản lý toàn bộ Media Asset.
* Có thể truy vết nguồn gốc của mọi hình ảnh.
* Không phát sinh Media Asset trùng lặp.
* 100% hình ảnh mới sử dụng URL nội bộ.
* 100% Media Asset có tên file chuẩn hóa.
* 100% Media Asset có Alt Text trước khi bài viết được Publish.
* Không còn hình ảnh hotlink trong Community.

---

# 13. Acceptance Criteria

### AC-01

Editor có thể import toàn bộ hình ảnh của bài viết bằng một thao tác.

### AC-02

Sau khi hoàn thành, bài viết không còn URL hình ảnh bên ngoài.

### AC-03

Media Asset xuất hiện trong Media Library ngay sau khi import.

### AC-04

Media Asset có đầy đủ metadata theo quy định.

### AC-05

Có thể tìm kiếm Media Asset.

### AC-06

Có thể xác định Media Asset đang được bài viết nào sử dụng.

### AC-07

Hệ thống không tạo Media Asset trùng lặp đối với cùng một nội dung hình ảnh.

---

# 14. Ràng buộc

* Không thay đổi nội dung nghiệp vụ của bài viết.
* Không thay đổi quy trình biên tập hiện tại ngoài việc bổ sung khả năng import hình ảnh.
* Không yêu cầu Editor thao tác trực tiếp trên HTML.
* Media Library là nơi quản lý duy nhất đối với hình ảnh của Community.

---

# 15. Out of Scope

* Chỉnh sửa ảnh / cắt ảnh / Watermark.
* AI tạo ảnh.
* Quản lý video / tài liệu.
* CDN phân tán.
* Phiên bản hóa (versioning) Media Asset.

---

# 16. SEO Requirements

| ID | Requirement |
|----|-------------|
| **SEO-01** | Mọi hình ảnh phải sử dụng URL thuộc domain iFlux. |
| **SEO-02** | Mọi Media Asset phải có tên file chuẩn hóa, phản ánh nội dung bài viết. |
| **SEO-03** | Mọi Media Asset phải hỗ trợ Alt Text. |
| **SEO-04** | URL hình ảnh phải ổn định, không thay đổi sau khi Publish. |
| **SEO-05** | Không sử dụng URL ảnh của bên thứ ba trong nội dung đã Publish. |
| **SEO-06** | Media Library phải là nguồn dữ liệu duy nhất phục vụ hình ảnh cho Community. |

---

# 17. Owner Review checklist

| Check | Owner |
|-------|-------|
| ACCEPT mục tiêu + BG-SEO-01 (SEO Asset Repository) | ☐ |
| ACCEPT phạm vi / ngoài phạm vi | ☐ |
| ACCEPT FR-01…13 · BR-01…09 · SEO-01…06 · AC-01…07 | ☐ |
| Cho phép mở Impact Analysis (không code) | ☐ |

| Vai trò | Quyết định | Ngày | Ký |
|---------|------------|------|-----|
| Product Owner | | | ☐ |

**PASS Owner Review BRD →** Impact Analysis **OPEN** · Solution/SoT 270728 phải align theo BRD này.

---

*BRD-COM-MEDIA-001 v1.0 · 2026-07-30 · Draft → Owner Review*
