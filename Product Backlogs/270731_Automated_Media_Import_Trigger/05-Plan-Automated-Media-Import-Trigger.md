# 05 — Kế hoạch Triển khai (Execution Plan) & Tiêu chí Nghiệm thu

**Task ID:** `270731_Automated_Media_Import_Trigger`  
**Ngày lập:** 31/07/2026  
**Trạng thái:** Chờ duyệt Kế hoạch (Awaiting Owner Approval)  

---

## 1. Kế hoạch triển khai theo từng Phase (Phased Roadmap)

### 📍 Phase 1: Tạo Database Migration (Database Base)
* **Mục tiêu**: Bổ sung các cột lưu trữ trạng thái xử lý ảnh cho bảng `community_posts` một cách an toàn.
* **Công việc thực hiện**:
  * Tạo file SQL Migration [044_post_media_status.sql](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/migrations/044_post_media_status.sql).
  * Chạy thử nghiệm Migration cục bộ (local).
* **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  * Migration chạy thành công. Bảng `community_posts` có thêm 3 cột: `media_status` (mặc định `'COMPLETED'`), `media_retry_count` (mặc định `0`), `media_last_error` (mặc định `null`) và index partial được thiết lập chính xác.

---

### 📍 Phase 2: Cấu hình tham số & Tích hợp điểm lưu cờ (Ingestion Point)
* **Mục tiêu**: Tích hợp cờ trạng thái `PENDING` khi tạo bài viết mới từ nguồn RSS và bổ sung cấu hình vận hành.
* **Công việc thực hiện**:
  * Cập nhật file cấu hình [backend/src/config/index.js](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/config/index.js) để thêm 3 biến: `MEDIA_IMPORT_AUTO_ENABLED`, `MEDIA_IMPORT_BATCH_SIZE`, `MEDIA_IMPORT_MAX_RETRY`.
  * Cập nhật file [rss-ingest.service.js](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/community/rss-ingest.service.js) tại hàm chèn bài viết RSS để lưu trạng thái ảnh ban đầu là `'PENDING'`.
* **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  * Chạy thử nghiệm đồng bộ RSS, kiểm tra trong DB thấy các bài viết mới tạo từ RSS được gán cờ `media_status = 'PENDING'` thành công.

---

### 📍 Phase 3: Phát triển Background Worker chạy tự động (Orchestration)
* **Mục tiêu**: Tạo mới Worker định kỳ quét DB các bài viết `PENDING` và kích hoạt tự động xử lý ảnh.
* **Công việc thực hiện**:
  * Tạo mới file Worker [media-trigger.worker.js](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/media/media-trigger.worker.js) với truy vấn khóa dòng nguyên tử `FOR UPDATE SKIP LOCKED`.
  * Đăng ký Worker vào hệ thống Scheduler sẵn có của Backend.
* **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  * Worker khởi động chạy ngầm thành công.
  * Tự động quét và xử lý thành công các bài viết ở trạng thái `PENDING`, chuyển đổi link ảnh ngoài thành link nội bộ iFlux và đưa trạng thái về `COMPLETED`.

---

### 📍 Phase 4: Kiểm thử, Nghiệm thu & Chạy thử khói (Verification & Smoke Test)
* **Mục tiêu**: Đảm bảo toàn bộ luồng tự động hoạt động mượt mà, không tranh chấp, không rác code.
* **Công việc thực hiện**:
  * Kiểm thử cục bộ: Tạo 2 bài viết chứa link ảnh ngoài cùng lúc, kiểm tra xem Worker xử lý có bị trùng lặp không.
  * Kiểm tra Console log xem có lỗi đỏ phát sinh không.
* **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  * 0 lỗi phát sinh.
  * Tính năng an toàn, có khả năng Bật/Tắt tức thì thông qua cấu hình.
