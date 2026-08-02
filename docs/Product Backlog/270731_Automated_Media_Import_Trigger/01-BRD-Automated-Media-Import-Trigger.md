# 01 — Business Requirement Document (BRD)

## Task: Tự động hóa cơ chế kích hoạt Media Import (Automation of Existing Media Import Trigger)

**Ngày tạo:** 31/07/2026
**Task ID:** `270731_Automated_Media_Import_Trigger`

---

# 1. Bối cảnh

Hệ thống hiện đã có đầy đủ khả năng:

* nhập hình ảnh từ URL bên ngoài;
* lưu hình ảnh về hạ tầng iFlux;
* chuyển đổi sang định dạng tối ưu;
* cập nhật lại nội dung bài viết để sử dụng media nội bộ.

Quy trình này hiện được kích hoạt thủ công bởi Admin thông qua thao tác **"Nhập vào Thư viện"** sau khi bài viết được đồng bộ từ RSS.

Business Requirement của task này **không nhằm xây dựng lại Media Pipeline**, mà chỉ xem xét khả năng **tự động hóa cơ chế kích hoạt** của pipeline hiện có.

---

# 2. Mục tiêu nghiệp vụ

Nếu hiện trạng được xác nhận đúng như mô tả, hệ thống phải thay đổi từ:

```
RSS Sync
    ↓
Admin mở bài
    ↓
Admin bấm "Nhập vào Thư viện"
    ↓
Media Pipeline hiện có
```

thành:

```
RSS Sync
    ↓
Hệ thống tự động kích hoạt
    ↓
Media Pipeline hiện có
```

Mục tiêu duy nhất của task:

* loại bỏ thao tác kích hoạt thủ công của Admin;
* giữ nguyên toàn bộ hành vi xử lý media hiện có.

---

# 3. Phạm vi thay đổi (In Scope)

Chỉ xem xét:

* thay đổi phương thức kích hoạt Media Pipeline;
* chuyển từ kích hoạt thủ công sang kích hoạt tự động.

---

# 4. Ngoài phạm vi (Out of Scope)

Task này không bao gồm:

* thay đổi Media Library;
* thay đổi thuật toán tải ảnh;
* thay đổi chuyển đổi định dạng ảnh;
* thay đổi cấu trúc lưu trữ;
* thay đổi SEO Asset;
* thay đổi HTML Rewrite;
* thay đổi chất lượng ảnh;
* thay đổi giao diện quản trị (ngoại trừ các thay đổi bắt buộc để phản ánh trạng thái tự động nếu có).

Những thành phần trên được xem là baseline hiện hữu và không thuộc phạm vi thay đổi của task này.

---

# 5. Điều kiện tiên quyết (Mandatory Audit)

Trước khi đề xuất bất kỳ Solution nào, bắt buộc phải thực hiện Audit hiện trạng nhằm xác nhận rằng:

1. Media Pipeline hiện tại đã hoạt động đúng với mô tả trên
2. Tính năng xử lý media hiện có đã đáp ứng mong đợi hiện tại về mặt xử lý.
3. Điều chỉnh mong muốn duy nhất giữa hiện trạng và yêu cầu mới là cơ chế kích hoạt (manual → automatic).

Nếu Audit phát hiện Media Pipeline hiện tại còn thiếu hoặc sai chức năng, phải dừng việc thiết kế Solution cho task này và báo cáo riêng các sai lệch. Không được tự ý mở rộng phạm vi của task.

---

# 6. Kết quả mong muốn

Sau khi Audit tiến hành trả kết quả baseline để hiểu được phạm vi của business requirement
