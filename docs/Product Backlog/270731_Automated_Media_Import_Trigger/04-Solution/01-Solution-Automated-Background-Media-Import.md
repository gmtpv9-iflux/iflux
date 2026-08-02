# 04 — Đề xuất Giải pháp Kỹ thuật chi tiết & Chứng minh Tuân thủ

**Task ID:** `270731_Automated_Media_Import_Trigger`  
**Ngày lập:** 31/07/2026  
**Phiên bản:** 1.2 (Đã tích hợp định nghĩa COMPLETED và quy trình chuyển đổi URL sạch)  

---

## 1. Chi tiết Giải pháp Kỹ thuật (Technical Design)

### Hạng mục A: SQL Migration & Thiết kế Trạng thái
Tạo file SQL Migration [044_post_media_status.sql](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/migrations/044_post_media_status.sql):
```sql
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS media_status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN IF NOT EXISTS media_retry_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS media_last_error TEXT;

-- Index lọc trạng thái PENDING/FAILED để quét với chi phí O(1)
CREATE INDEX IF NOT EXISTS idx_posts_media_status 
ON community_posts(media_status) 
WHERE media_status IN ('PENDING', 'FAILED');
```
*Lưu ý*: Giá trị mặc định là `'COMPLETED'` để các bài viết viết tay/thường không bị quét lại. Chỉ các bài viết cào từ RSS mới được set là `'PENDING'` lúc tạo.

---

### Hạng mục B: Quy trình Biến đổi URL HTML trong DB (Data Flow & Persistence)

Khi tiến trình tự động chạy ngầm kích hoạt thành công, sự thay đổi URL diễn ra trực tiếp trong Database:

```
[Báo gốc RSS]  ──>  <img src="https://news-site.com/images/abc.jpg">
                            │
                            ▼ (Worker chạy ngầm: Tải ảnh, chuyển WebP, lưu Media Library)
                            │
[iFlux DB]     ──>  <img src="https://iflux.vn/media/2026/07/abc.webp">
```

* **Ý nghĩa đối với Admin**: Khi Admin mở trang sửa bài viết lên, Editor (Tiptap) sẽ đọc trực tiếp từ `body_html` đã được cập nhật này. Admin nhìn thấy ngay ảnh lưu trên iFlux, không còn link báo gốc.
* **Ý nghĩa đối với User**: Người dùng truy cập bài viết cũng đọc trực tiếp từ HTML đã được tối ưu này, hoàn toàn không cần cơ chế runtime redirect hay proxy nào.
* **Bảo vệ dữ liệu dài hạn**: Dù 1 tháng sau báo gốc xóa ảnh (gây 404), ảnh trên bài viết của iFlux vẫn hiển thị hoàn hảo vì đã được lưu trên máy chủ của iFlux.

---

### Hạng mục C: Concurrency Lock & Worker Code (Skipping Race Conditions)

Worker chạy ngầm [media-trigger.worker.js](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/media/media-trigger.worker.js) sẽ claim job (nhận việc) và khóa dòng bằng một câu lệnh cập nhật nguyên tử (Atomic Update):

```javascript
// Worker nhận việc và đổi trạng thái sang PROCESSING trong cùng 1 transaction
const res = await query(
  `UPDATE community_posts 
   SET media_status = 'PROCESSING'
   WHERE id IN (
     SELECT id FROM community_posts
     WHERE media_status = 'PENDING'
        OR (media_status = 'FAILED' AND media_retry_count < $1)
     LIMIT $2
     FOR UPDATE SKIP LOCKED
   )
   RETURNING id`,
  [config.MEDIA_IMPORT_MAX_RETRY, config.MEDIA_IMPORT_BATCH_SIZE]
);
```

---

### Hạng mục D: Định nghĩa nghiệp vụ của trạng thái COMPLETED (Sạch 100%)

Trạng thái **`media_status = 'COMPLETED'`** đồng nghĩa với việc bài viết đạt tiêu chuẩn **nội địa hóa media hoàn toàn**:
1. **Không còn external image** trong `body_html` (toàn bộ đã đổi sang `/media/...`).
2. **Ảnh cover** (`cover.url`) đã chuyển thành URL nội bộ iFlux.
3. **Ảnh chia sẻ** (`seo.og_image`) đã chuyển thành URL nội bộ iFlux.
4. Mọi media được sử dụng đã có asset được ghi nhận trong Media Library.
