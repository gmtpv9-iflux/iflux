# 04 — Solution · Giải pháp Kỹ thuật tối ưu hóa Danh sách bài viết Admin

**Date:** 2026-08-01  
**Folder:** `docs/Product Backlog/010826_Optimize_Admin_Article_List/`  

---

## 1. Giải pháp 1: Quản lý Nguồn & Bản quyền bài viết RSS

### Tập tin thay đổi: [`article-list-page.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/app/community/content/article-list-page.js) & [`community-articles.service.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/community/community-articles.service.js)

1. **Ở Frontend (`nguonLabel(a)`):**
   - Chỉ bài viết ở trạng thái cào thô chưa chỉnh sửa (`a.status === 'published_rss'`) mới hiển thị tên nguồn RSS gốc (CafeF, VietStock...) để bảo đảm tuân thủ tác quyền bên thứ ba.
   - Khi bài viết đã được Admin chỉnh sửa và ấn Xuất bản (`a.status === 'published'`), bản quyền chính thức thuộc về iFlux, hàm `nguonLabel(a)` sẽ hiển thị Nguồn/Tác giả thuộc iFlux / Admin biên tập.

2. **Ở Backend Service (`community-articles.service.js`):**
   - Khi Admin biên tập và lưu bài viết với trạng thái `published`, hệ thống cập nhật trường tác giả/biên tập viên thực hiện và cho phép chuyển đổi bản quyền sang iFlux đúng theo SoT.

---

## 2. Giải pháp 2: Format Ngày đăng 2 dòng

### Tập tin thay đổi: [`article-list-page.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/app/community/content/article-list-page.js)

1. Sửa hàm `fmtNgayDang(a)` để tách giờ và ngày bằng thẻ `<br>`:
```javascript
  function fmtNgayDang(a) {
    var raw = a.published_at || a.scheduled_at || a.created_at || '';
    if (!raw) return '—';
    try {
      var d = new Date(raw);
      var pad = function (n) { return n < 10 ? '0' + n : String(n); };
      var dateStr = pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
      var timeStr = pad(d.getHours()) + ':' + pad(d.getMinutes());
      return timeStr + '<br>' + dateStr;
    } catch (e) {
      return String(raw).slice(0, 16).replace('T', '<br>');
    }
  }
```

2. Sửa hàm `render(list)` để cột Ngày đăng hiển thị dưới dạng HTML chưa được escape (loại bỏ hàm `esc()`):
```javascript
          '<td style="white-space:nowrap;font-size:12px;color:var(--ix-text-muted)">' + fmtNgayDang(a) + '</td>' +
```

---

## 3. Giải pháp 3: Phân trang danh sách bài viết

### A. Backend Service: [`community-articles.service.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/community/community-articles.service.js)
1. Thêm `COUNT(*) OVER() AS total_count` vào SELECT:
```javascript
  let sql = 'SELECT *, COUNT(*) OVER() AS total_count FROM community_posts WHERE 1=1';
```
2. Parse `page` và `limit`, sau đó áp dụng vào câu query:
```javascript
  if (filters.limit) {
    const limit = Number(filters.limit);
    const page = Number(filters.page || 1);
    const offset = (page - 1) * limit;
    params.push(limit);
    sql += ` LIMIT $${params.length}`;
    params.push(offset);
    sql += ` OFFSET $${params.length}`;
  }
```
3. Trả về cấu trúc đối tượng:
```javascript
  const res = await query(sql, params);
  const total = res.rows.length ? Number(res.rows[0].total_count) : 0;
  return {
    articles: res.rows.map(rowToArticle),
    total
  };
```

### B. Backend Routes: [`community.routes.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/community/community.routes.js)
Cập nhật các API route để giải cấu trúc (destructure) kết quả trả về của `listArticles` và hỗ trợ parse `page`, `limit` từ query.
Ví dụ ở API `/admin/articles`:
```javascript
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const page = req.query.page ? Number(req.query.page) : 1;
      const { articles: list, total } = await articles.listArticles({
        include_all: true,
        status: req.query.status || undefined,
        q: req.query.q,
        category_id: req.query.category_id,
        chu_de_id: req.query.chu_de_id,
        limit,
        page
      });
      return success(res, { articles: list, total });
```

### C. Frontend Admin UI: [`article-list-page.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/app/community/content/article-list-page.js)
1. Khai báo các biến trạng thái phân trang toàn cục:
```javascript
  var currentPage = 1;
  var pageSize = 50;
  var totalCount = 0;
```
2. Thêm hàm `renderPagination()` để tạo HTML điều khiển phân trang bằng Javascript thuần, tuân thủ Admin Design System.
3. Trong hàm `load()`, gọi API kèm theo tham số `page` và `limit`:
```javascript
  var path = '/community/admin/articles?limit=' + pageSize + '&page=' + currentPage;
```
4. Khi nhận kết quả từ API, lấy `total` từ data trả về, gán vào `totalCount` và gọi `renderPagination()`.
5. Đăng ký sự kiện click của các nút trang để cập nhật `currentPage` và gọi lại `load()`.
