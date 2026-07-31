# SEO Sitemap Capability — Source of Truth (SoT)

**Date:** 2026-08-01  
**Status:** IMPLEMENTED  

## 1. Kiến trúc hệ thống
Hệ thống kết xuất XML Sitemap sử dụng **Provider Pattern**, đăng ký và cấu hình linh hoạt thông qua `SitemapRegistry`.

```text
               GET /sitemap.xml (Public Nginx)
                             │
                             ▼
            GET /api/internal/sitemap (Sitemap Index)
                             │
     ┌───────────────┼───────────────┬───────────────┐
     ▼               ▼               ▼               ▼
sitemap/static  sitemap/posts   sitemap/stocks  ...etc
```

### Các Sitemap con và quy tắc:
* `static`: Các trang tĩnh công khai (`/`, `/cong-dong`, `/goi-cuoc`, `/hoi-dap`, `/thanh-vien`, `/thi-truong`, `/dong-tien`).
* `posts`: Lấy bài viết từ bảng `community_posts` (chỉ khi `status` thuộc `published` hoặc `published_rss`).
* `stocks`: Cổ phiếu hoạt động từ bảng `stocks` (`is_active = true`).
* `sectors`: Ngành nghề từ bảng `sectors`.
* `ecosystems`: Hệ sinh thái hoạt động từ bảng `ecosystems` (`is_active = true`).
* `stories`: Chủ đề hoạt động từ bảng `content_chu_de` (`status = 'active'`).

---

## 2. Quy tắc sinh dữ liệu & Canonical Policy
1. **Chỉ chứa URL Public:**
   * CẤM đưa các tài nguyên chưa được duyệt (`pending`/`draft`/`unpublished`), bị xóa (`deleted`) hay tài nguyên riêng tư (`private`/`account`/`checkout`/`admin`) vào sitemap.
   * CẤM đưa các link API (`/api/...`), link preview, hay link RSS tạm thời.
2. **Canonical Policy:**
   * Tất cả URL sinh ra bắt buộc dùng tiền tố chuẩn: `https://iflux.vn`.
   * CẤM chứa `localhost`, `127.0.0.1`, `staging` hay các URL chứa tham số affiliate/owner.
3. **Thuộc tính `lastmod`:**
   * Được sinh động từ thời gian cập nhật gần nhất (`updated_at` hoặc `created_at`).
   * Không sử dụng `priority` và `changefreq` vì Google đã bỏ qua.
4. **Giới hạn kỹ thuật của Google:**
   * Mỗi sitemap con chứa tối đa **50.000 URL** hoặc dung lượng không vượt quá **50 MB** (không nén).

---

## 3. Cơ chế Caching
* Cache toàn bộ XML thành phẩm cuối cùng của từng route (Sitemap Index, Posts, Stocks, Sectors...) với TTL là **30 phút**.
* Cache sử dụng Redis (`core/cache/redis.js`), tự động fallback sang local Node memory cache nếu không kết nối được Redis.

---

## 4. Tiêu chí nghiệm thu (Acceptance Criteria)
* `GET /sitemap.xml` trả về mã `200 OK` với Header `Content-Type: application/xml`.
* Dữ liệu XML phản hồi hợp lệ theo chuẩn Google Sitemap.
* Không có redirect chain hay broken URL trong sitemap.
