# 02 — Audit hiện trạng · Tối ưu hóa Danh sách bài viết Admin

**Date:** 2026-08-01  
**Folder:** `docs/Product Backlog/010826_Optimize_Admin_Article_List/`  

---

## 1. Audit Yêu cầu 1: Nguồn & Bản quyền bài viết RSS sau khi Admin chỉnh sửa

### Khảo sát DB (Production) & Quy định Bản quyền
- **Khi bài viết ở trạng thái cào thô (`published_rss`):** Thông tin tác giả RSS gốc (ví dụ: CafeF, VietStock) được duy trì đầy đủ để đảm bảo tác quyền nguồn cào ban đầu.
- **Khi bài viết được Admin Sửa & Xuất bản (`published`):** Bản quyền bài viết được chuyển giao hoàn toàn về iFlux (bản quyền thuộc về iFlux) do nội dung đã được biên tập và thiết kế mới.
- **Logic hiển thị `nguonLabel(a)` trong Frontend (`article-list-page.js`):**
  * Với bài viết mang trạng thái `published_rss` (chưa sửa), `nguonLabel(a)` trả về tên nhà cung cấp RSS (CafeF, VietStock...).
  * Với bài viết đã được Admin Sửa & Xuất bản (trạng thái `published`), `nguonLabel(a)` trả về Nguồn/Tác giả đại diện iFlux / Admin biên tập, tuân thủ đúng SoT chuyển giao bản quyền iFlux.

---

## 2. Audit Yêu cầu 2: Định dạng Ngày đăng

### Khảo sát Frontend (`article-list-page.js`)
* **Hàm định dạng hiện tại:**
  ```javascript
  function fmtNgayDang(a) {
    var raw = a.published_at || a.scheduled_at || a.created_at || '';
    if (!raw) return '—';
    try {
      return new Date(raw).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return String(raw).slice(0, 16).replace('T', ' ');
    }
  }
  ```
* **Khi render trong bảng:**
  ```javascript
  '<td style="white-space:nowrap;font-size:12px;color:var(--ix-text-muted)">' + esc(fmtNgayDang(a)) + '</td>'
  ```
* **Nhận xét:** Đang dùng `esc()` bọc ngoài, do đó không thể trả về thẻ HTML `<br>` để ngắt dòng trực tiếp từ hàm format.

---

## 3. Audit Yêu cầu 3: Phân trang danh sách bài viết

### Khảo sát Backend Service (`community-articles.service.js`)
* **Logic list hiện tại:**
  * `listArticles` chỉ hỗ trợ `limit` mà không có `offset` hay `page`.
  * Câu lệnh SQL hiện tại:
    ```javascript
    let sql = 'SELECT * FROM community_posts WHERE 1=1';
    ...
    if (filters.limit) {
      params.push(Number(filters.limit));
      sql += ` LIMIT $${params.length}`;
    }
    ```
  * API trả về trực tiếp mảng bài viết: `return res.rows.map(rowToArticle);`
  * API route trả về: `total: list.length`, đây là tổng số phần tử thực tế lấy ra thay vì tổng bản ghi trong DB.

### Khảo sát Frontend (`article-list-page.js`)
* Giao diện hoàn toàn chưa có thanh phân trang hay cơ chế chọn số trang. Đang gọi API cứng với `limit=200` tại hàm `load()`:
  ```javascript
  var path = '/community/admin/articles?limit=200';
  ```
