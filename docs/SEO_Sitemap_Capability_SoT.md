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

---

## 2. Nguồn dữ liệu (Source of Truth)

| Entity | DB Table | URL Path |
| :--- | :--- | :--- |
| **Posts** (Bài viết) | `community_posts` | `/cong-dong/bai-viet/:slug` hoặc `:id` |
| **Stocks** (Cổ phiếu) | `stocks` | `/co-phieu/:ticker` |
| **Sectors** (Ngành) | `sectors` | `/nganh/:code` |
| **Ecosystems** (Hệ sinh thái) | `ecosystems` | `/he-sinh-thai/:code` |
| **Stories** (Chủ đề) | `content_chu_de` | `/cau-chuyen/:slug` |
| **Static** (Trang tĩnh) | (Hằng số tĩnh) | `/`, `/goi-cuoc`, `/hoi-dap`... |

---

## 3. Quy tắc sinh dữ liệu & Canonical Policy
1. **Chỉ chứa URL Public:**
   * CẤM đưa các tài nguyên chưa được duyệt (`pending`/`draft`/`unpublished`), bị xóa (`deleted`) hay tài nguyên riêng tư (`private`/`account`/`checkout`/`admin`) vào sitemap.
   * CẤM đưa các link API (`/api/...`), link preview, hay link RSS tạm thời.
2. **Canonical Policy:**
   * Tất cả URL sinh ra bắt buộc dùng tiền tố chuẩn cấu hình từ biến môi trường `PUBLIC_SITE_URL` (không chứa localhost, staging, `/api`, owner URLs, or affiliate URLs).
3. **Thuộc tính `lastmod`:**
   * Được sinh động từ thời gian cập nhật gần nhất (`updated_at` hoặc `created_at`).
   * Đối với Static Pages, ưu tiên biến `SEO_STATIC_LASTMOD` hoặc tự động lấy ngày chỉnh sửa gần nhất của tệp tin `User_Web/community/index.html`.
   * Không sử dụng `priority` và `changefreq` vì Google đã bỏ qua.
4. **Giới hạn kỹ thuật & Tự động phân trang (Pagination):**
   * Mỗi sitemap con chứa tối đa **50.000 URL** hoặc dung lượng không vượt quá **50 MB** (không nén).
   * Khi số lượng URL của một provider vượt quá 50.000, hệ thống tự động phân trang sitemap con (Ví dụ: `sitemap-posts-1.xml`, `sitemap-posts-2.xml`...).

---

## 4. Cơ chế Caching & Khả năng chịu lỗi (Fault Tolerance)
* **XML Caching:** Cache toàn bộ XML thành phẩm của từng route với TTL là **30 phút** qua Redis, tự động fallback sang in-memory local cache.
* **Fault Tolerance:** Nếu một provider bất kỳ xảy ra lỗi truy vấn DB (ví dụ: `Stocks` lỗi), các provider khác vẫn hoạt động độc lập và sitemap index vẫn kết xuất bình thường. Sitemap con bị lỗi sẽ kết xuất dữ liệu XML rỗng hợp lệ thay vì trả lỗi 500.
* **On-Demand Querying:** Khi có request truy vấn một sitemap con cụ thể (ví dụ: `sitemap-posts.xml`), chỉ duy nhất provider tương ứng thực hiện query dữ liệu từ DB.

---

## 5. Tiêu chí nghiệm thu (Acceptance Criteria)
* `GET /sitemap.xml` trả về mã `200 OK` với Header `Content-Type: application/xml`.
* Dữ liệu XML phản hồi hợp lệ theo chuẩn Google Sitemap.
* Không có duplicate URL (hệ thống tự động lọc trùng lặp dữ liệu trước khi kết xuất).
* Không có redirect chain, không chứa URL lỗi 404 hay URL rác.
* XML Validate PASS.
* Google Search Console đọc được sitemap.
