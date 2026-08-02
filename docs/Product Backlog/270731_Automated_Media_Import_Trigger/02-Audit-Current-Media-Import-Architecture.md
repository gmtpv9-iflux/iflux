# 02 — Báo cáo Audit Hiện trạng (Mandatory Audit Baseline)

**Task ID:** `270731_Automated_Media_Import_Trigger`  
**Ngày thực hiện:** 31/07/2026  
**Mục tiêu:** Thực hiện 4 hạng mục Audit bắt buộc để đánh giá tính khả thi và an toàn của việc tự động hóa cơ chế kích hoạt.

---

## 1. Kết quả Xác minh 4 hạng mục (Mandatory Audit Items)

### 🔍 Hạng mục 1: Call Site Audit (Chứng minh số lượng điểm gọi)
* **Câu hỏi**: Hàm `importArticle()` hiện có bao nhiêu điểm gọi (trigger) trong môi trường chạy thật?
* **Kết quả đối chiếu**: Đã quét toàn bộ thư mục `backend/src/`.
  * Hàm `importArticle()` được khai báo xuất khẩu (export) tại [media-import.service.js:L240](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/media/media-import.service.js#L240).
  * Chỉ có **duy nhất 1 điểm gọi** trong toàn bộ dự án hiện tại là ở Router Admin: [media.routes.js:L121](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/media/media.routes.js#L121):
    ```javascript
    const result = await mediaImport.importArticle(config, articleId, actor);
    ```
  * **Kết luận**: PASS. Hiện trạng chỉ có duy nhất một trigger thủ công của Admin. Việc tự động hóa sẽ không làm phá vỡ các luồng ẩn khác.

---

### 🔍 Hạng mục 2: Side Effect Audit (Tác động phụ của hàm)
* **Câu hỏi**: Khi hàm `importArticle()` chạy, những thay đổi nào sẽ được ghi xuống đĩa hoặc database?
* **Kết quả đối chiếu**:
  1. **Database Writes (Ghi cơ sở dữ liệu)**:
     * Tạo một tiến trình lưu vết trong bảng `media_jobs` với trạng thái ban đầu là `'running'` và kết quả cuối cùng là `'succeeded'` hoặc `'failed'`.
     * Tạo mới bản ghi hình ảnh trong bảng `media_assets` và bảng định dạng `media_variants` (nếu ảnh chưa tồn tại).
     * Tạo hoặc cập nhật bản ghi sử dụng ảnh trong bảng `media_usages` để liên kết ảnh với bài viết.
     * Cập nhật các trường `body_html`, `cover`, `seo` của bài viết trong bảng `community_posts` để thay thế toàn bộ liên kết ngoài thành link iFlux nội bộ.
  2. **File System Writes (Ghi tập tin lên đĩa cứng)**:
     * Lưu trữ tệp ảnh gốc và tệp ảnh WebP/AVIF tối ưu vào thư mục lưu trữ media của hệ thống (mặc định tại `/var/www/iflux/.../media/`).
  * **Kết luận**: PASS. Các tác động phụ đều tập trung và an toàn, nằm gọn trong phạm vi quản lý của module Media và Article, đúng theo thiết kế SoT-COM-MEDIA-001.

---

### 🔍 Hạng mục 3: Dependency Audit (Tính độc lập của Service)
* **Câu hỏi**: Hàm `importArticle()` có thể chạy tự động mà không cần giao diện (UI) hoặc yêu cầu HTTP request của Admin không?
* **Kết quả đối chiếu**:
  * Chữ ký hàm: `async function importArticle(config, articleId, actor)`
  * Hàm này **hoàn toàn độc lập**:
    * Không tham chiếu đến bất kỳ đối tượng HTTP request/response (`req`, `res`) nào của Express.
    * Không phụ thuộc vào môi trường trình duyệt (không dùng `window`, `document`, DOM).
    * Tham số `actor` chỉ dùng để ghi nhận tên người tạo (`createdBy` ở dạng chuỗi chữ). Khi chạy tự động, chúng ta có thể truyền vào `{ admin_id: 'system_auto' }` hoặc `null` mà không gây lỗi.
  * **Kết luận**: PASS. Service này sẵn sàng để gọi trực tiếp từ các tiến trình tự động chạy ngầm (Cron/Worker) ở phía backend.

---

### 🔍 Hạng mục 4: Idempotency Audit (Tính an toàn khi chạy lặp lại)
* **Câu hỏi**: Điều gì xảy ra nếu cùng một bài viết được yêu cầu xử lý nhiều lần?
* **Kết quả đối chiếu**:
  * Hàm quét link ảnh ngoài `collectExternal` sử dụng hàm kiểm tra `isExternalImageUrl(url, config)`.
  * Khi một bức ảnh đã được nhập thành công ở lần chạy đầu tiên, link ảnh trong HTML bài viết đã đổi thành dạng nội bộ (bắt đầu bằng `/media` hoặc tên miền iFlux).
  * Ở lần chạy tiếp theo, `isExternalImageUrl` sẽ trả về `false` đối với link nội bộ này và **bỏ qua không xử lý lại**.
  * Nếu một bài viết có 3 ảnh ngoài, lần 1 tải được 2 ảnh và 1 ảnh lỗi. Lần 2 chạy lại sẽ chỉ tải đúng 1 ảnh bị lỗi trước đó.
  * Việc ghi nhận mối quan hệ sử dụng ảnh dùng lệnh `upsertUsage` (nếu có rồi thì cập nhật, chưa có thì tạo mới) nên không bị nhân bản bản ghi rác.
  * **Kết luận**: PASS. Tiến trình có tính lặp lại an toàn tuyệt đối, không gây trùng lặp dữ liệu hay tải lại file đã tối ưu.

---

## 2. Kết luận Tổng thể

Cả 4 mục tiêu kiểm tra đều đạt trạng thái **PASS 100%**. 

Dịch vụ `importArticle()` hiện có tính độc lập cao, an toàn khi chạy lặp lại và dễ dàng kích hoạt tự động. Tôi sẵn sàng nhận chỉ thị tiếp theo từ bạn để chính thức khóa baseline và chuyển sang bước Solution.
