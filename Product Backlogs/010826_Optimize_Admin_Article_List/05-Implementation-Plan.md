# Implementation Plan — Task 010826_Optimize_Admin_Article_List

Tối ưu hoá danh sách bài viết Admin UI, chuẩn hoá quy tắc hiển thị cột "Nguồn" theo đúng Business Rule và ghi vết Quản trị viên xuất bản (Publishing Admin) khi chuyển giao tác quyền từ RSS sang iFlux.

## Proposed Changes

### Backend Service & API Layer

#### [MODIFY] [community-articles.service.js](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/community/community-articles.service.js)
- Trong `updateArticle(id, input, actor)`:
  - Khi bài viết chuyển trạng thái từ `published_rss` sang `published` lần đầu tiên, ghi nhận `record.published_by_admin_id = actor.id` vào `payload`.
  - Khóa không cho ghi đè `published_by_admin_id` nếu đã tồn tại. Ghi vết `last_edited_by_admin_id = actor.id` cho các lần sửa tiếp theo.
- Trong `listArticles(filters)`:
  - Thu thập danh sách `published_by_admin_id` từ kết quả truy vấn.
  - Query batch sang bảng `admin_accounts`: `SELECT id, name, email FROM admin_accounts WHERE id = ANY($1)`.
  - Map thêm đối tượng `published_by: { id: adminId, name: adminAccount.name || adminAccount.email || 'Admin' }` vào từng item bài viết trả về cho Frontend API.

#### [MODIFY] [community.routes.js](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/community/community.routes.js)
- Đảm bảo route `PUT /admin/articles/:id` truyền đúng đối tượng `actor = { id: req.admin.id, name: req.admin.name || req.admin.email }` vào `updateArticle`.

---

### Admin Frontend UI Layer

#### [MODIFY] [article-list-page.js](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/app/community/content/article-list-page.js)
- Cập nhật hàm `nguonLabel(a)`:
  - Nếu `a.status === 'published_rss'`: Trả về Tên nguồn RSS (`source_name` / `provider_name`).
  - Nếu `a.status !== 'published_rss'`: Trả về Tên Quản trị viên xuất bản (`a.published_by.name || a.created_by_name || 'Admin'`).

---

## Verification Plan

### Manual Verification
1. **Kiểm tra bài cào thô RSS (`published_rss`):**
   - Mở `https://iflux.vn/admin/cong-dong/danh-sach-bai-viet` trên môi trường Production sau khi deploy.
   - Xác nhận các bài viết ở trạng thái `Xuất bản (RSS)` hiển thị cột Nguồn là `CafeF`, `VietStock`, `Báo Đầu Tư`...
2. **Kiểm tra bài viết đã xuất bản (`published`):**
   - Chọn 1 bài RSS thô, ấn Sửa -> Xuất bản (`published`).
   - Kiểm tra cột Nguồn của bài viết đó chuyển sang hiển thị đúng Tên Quản trị viên (ví dụ: `Bảo Long` hoặc `Admin`).
   - Kiểm tra DB Postgres xác nhận `payload.author` giữ nguyên tác giả gốc, `published_by_admin_id` lưu đúng UUID của Admin.
