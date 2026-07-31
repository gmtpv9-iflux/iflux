# 06 — Báo cáo Nghiệm thu Thực nghiệm (Acceptance Verification Report)

**Task ID:** `270731_Automated_Media_Import_Trigger`  
**Trạng thái:** Triển khai & Nghiệm thu thành công 100%  

---

## 1. Kết quả Xác minh 5 Tiêu chí Nghiệm thu (5 Acceptance Criteria Results)

Để chứng minh hệ thống hoạt động chính xác theo đúng Business Requirement (tự động hóa hoàn toàn từ đầu đến cuối), chúng tôi đã chạy một kịch bản test tích hợp thực tế trên môi trường Server:

### ✅ AC1 & AC2: Trạng thái & Biến đổi URL thực tế trong DB
* **Trước khi xử lý**:
  * `media_status` = `PENDING`
  * Link ảnh gốc (External): `https://images.unsplash.com/photo-1579546929518-9e396f3cc809`
  * Cột `body_html` chứa liên kết ảnh ngoài.
* **Sau khi Worker quét qua**:
  * `media_status` = `COMPLETED`
  * `media_last_error` = `null` (Không có lỗi).
  * Link ảnh cover nội bộ (iFlux local): `/media/community/2026/07/mas_ms93sao9_09af9d57/test-auto-import-title-001.webp`
  * Cột `body_html` tự động ghi đè và chuyển đổi liên kết thành công sang link `/media/...` nội bộ.

### ✅ AC3 & AC4: Xác minh hiển thị Editor & Frontend
* Khi Admin mở Editor hoặc người dùng xem bài viết trên Frontend, hệ thống đọc trực tiếp URL nội địa hóa `/media/...` từ trường `body_html` trong Database.
* **Kết quả**: Không có bất kỳ kết nối mạng (Network request) nào đến máy chủ ảnh gốc bên ngoài (`images.unsplash.com`), hoàn toàn tải ảnh trực tiếp từ hạ tầng iFlux.

### ✅ AC5: Nút bấm thủ công cũ (Regression Test)
* Bấm nút "Nhập vào Thư viện" thủ công không gây ra lỗi, cơ chế `isExternalImageUrl` kiểm tra thấy ảnh đã là link nội địa hóa `/media/...` sẽ tự động bỏ qua không tải lại, đảm bảo **không tạo trùng lặp asset** trong Media Library.

---

## 2. Nhật ký Tài sản và Liên kết được tạo (Media Assets & Usages)

Hệ thống đã tự động sinh ra các liên kết sử dụng ảnh nội bộ chính xác trong các bảng quản lý media:
* **Asset ID**: `mas_ms93sao9_09af9d57`
* **Public URL**: `/media/community/2026/07/mas_ms93sao9_09af9d57/test-auto-import-title-001.webp`
* **Chi tiết Usages**:
  * Bản ghi liên kết 1: `field_ref = 'body'` (Ảnh trong nội dung bài viết).
  * Bản ghi liên kết 2: `field_ref = 'cover'` (Ảnh đại diện bài viết).
  * Bản ghi liên kết 3: `field_ref = 'seo'` (Ảnh chia sẻ mạng xã hội).

---

## 3. Phản hồi các câu hỏi kỹ thuật từ Reviewer

1. **Transaction của `FOR UPDATE SKIP LOCKED`**:
   * Chúng tôi đã tái cấu trúc và bao bọc khối lệnh SELECT/UPDATE trong một Transaction Postgres tường minh (`BEGIN` -> `SELECT ... FOR UPDATE SKIP LOCKED` -> `UPDATE ... SET PROCESSING` -> `COMMIT`). 
   * Giao dịch được COMMIT ngay lập tức sau khi nhận job để giải phóng Row-level lock, tránh giữ khóa DB lâu trong quá trình tải ảnh qua HTTP từ các server ngoài.
2. **Xử lý tiến trình kẹt (Zombie PROCESSING jobs)**:
   * Worker đã được bổ sung cơ chế khôi phục tự động: Quét các job có trạng thái `PROCESSING` nhưng có thời gian cập nhật quá 15 phút để tự động đưa về `PENDING` và tiến hành xử lý lại.
