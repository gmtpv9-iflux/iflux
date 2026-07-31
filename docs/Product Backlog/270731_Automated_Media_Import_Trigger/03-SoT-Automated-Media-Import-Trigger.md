# 03 — Single Source of Truth (SoT) Chi phối

**Task ID:** `270731_Automated_Media_Import_Trigger`  
**Ngày lập:** 31/07/2026  
**Cập nhật:** Định nghĩa chuẩn hóa trạng thái COMPLETED  

---

### 1. Quy chuẩn Quản lý và Tái sử dụng (Reusability & Governance Rules)

1. **Bảo toàn Core Logic (Pipeline Invariance)**:
   * **Không thay đổi** file [media-import.service.js](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/media/media-import.service.js) cũng như thuật toán download, convert WebP, nén ảnh, lưu trữ asset, cập nhật HTML.
   * Mọi hình thức kích hoạt tự động hay thủ công đều phải sử dụng chung hàm `importArticle(config, articleId, actor)` để đảm bảo chỉ có duy nhất một bộ logic xử lý ảnh trong hệ thống.

2. **Cơ chế Kích hoạt Tự động chạy ngầm (Non-Blocking Auto-Trigger)**:
   * Việc tự động kích hoạt nhập ảnh **không được thực hiện đồng thời (synchronously)** trong luồng cào RSS hay luồng tạo bài viết để tránh gây nghẽn hoặc timeout request.
   * Kích hoạt tự động bắt buộc phải thực hiện bất đồng bộ (Asynchronously) qua hàng đợi (Queue) hoặc tiến trình chạy ngầm định kỳ (Background Cron Job/Worker).

---

### 2. Định nghĩa Nghiệp vụ Bất biến của Trạng thái COMPLETED

Khi một bài viết chuyển sang trạng thái **`media_status = 'COMPLETED'`**, điều này cam kết **bài viết đã được nội địa hóa media hoàn toàn và sạch 100%**:

* **Quy tắc 1**: Không còn bất kỳ liên kết ảnh bên ngoài nào (External Image URL) tồn tại trong `body_html`.
* **Quy tắc 2**: Ảnh đại diện bài viết (`cover.url`) bắt buộc phải là liên kết nội bộ iFlux (`/media/...`).
* **Quy tắc 3**: Ảnh chia sẻ mạng xã hội (`seo.og_image`) bắt buộc phải là liên kết nội bộ iFlux (`/media/...`).
* **Quy tắc 4**: Tất cả các tệp hình ảnh được sử dụng trong bài viết đều đã tồn tại bản ghi Asset vật lý trong hệ thống Media Library.

> **Giá trị bảo vệ dữ liệu**: Dù trang báo gốc (nguồn RSS) xóa ảnh hoặc bị sập link sau này, bài viết trên iFlux vẫn hiển thị đầy đủ hình ảnh mượt mà vì ảnh đã được tải về lưu trữ độc lập trên hạ tầng iFlux từ trước.
