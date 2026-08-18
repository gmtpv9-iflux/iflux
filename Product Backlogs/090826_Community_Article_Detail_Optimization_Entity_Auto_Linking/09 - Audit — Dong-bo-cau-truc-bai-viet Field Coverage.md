# Audit — Đồng bộ cấu trúc bài viết (field coverage)

**Date:** 2026-08-10  
**URL:** https://iflux.vn/admin/cong-dong/dong-bo-cau-truc-bai-viet  
**Scope:** Nguồn dữ liệu trang · có đủ trường bài iFlux không · lệch vs Admin Sửa / User Web chi tiết  
**Không thi công** — chỉ audit.

---

## 1. Verdict

| Câu hỏi | Kết luận |
|---------|----------|
| Trang lấy dữ liệu từ đâu? | **Catalog tĩnh JS** `Admin_Design_system/app/community/rss-catalog.js` → `IfluxRssCatalog.ARTICLE_FIELD_MAP` (**24** dòng). **Không** gọi API, **không** đọc `community_posts` / `content_articles`. |
| Có phải SoT persistence bài viết? | **Không.** Đây là **Data Mapping Specification** (RSS ngoài → field iFlux). Persistence SoT vẫn là `community_posts.payload`. |
| Đã chứa đủ mọi trường runtime bài iFlux? | **Chưa.** Là bản map ingest gần đúng; **key lệch** vài chỗ quan trọng; thiếu trường runtime / UI đang dùng. |
| Vì sao HTML/crawler thấy “Tổng: 0”? | Markup khởi tạo `#rss-schema-count = 0` + tbody trống; **JS mới đổ 24 dòng**. Snapshot không chạy JS → hiện 0. File catalog trên CDN **có** đủ 24 `ifluxKey`. |

---

## 2. Pipeline dữ liệu trang (hiện trạng)

```text
dong-bo-cau-truc-bai-viet.html
  → script rss-catalog.js          (định nghĩa ARTICLE_FIELD_MAP)
  → script rss-article-schema-page.js
       render() đọc window.IfluxRssCatalog.ARTICLE_FIELD_MAP
       → vẽ bảng CafeF | VietStock | Báo Đầu Tư
```

- Comment trong catalog: *“External Source → iFlux Article (**community_posts**)”* — ý định map về payload Community, không phải `content_articles`.
- Backend **có** API `GET /rss-article-schema` + bảng `community_rss_schema` (Wave D metadata) — **trang này không dùng**. Hai SoT mapping tiềm năng (JS catalog vs DB schema) chưa nối.

---

## 3. Danh sách 24 trường trên trang (catalog)

| # | Nhãn UI | `ifluxKey` | Ghi chú map |
|---|---------|------------|-------------|
| 1 | Tiêu đề | `title` | OK |
| 2 | URL (slug nội bộ) | `slug` | OK |
| 3 | URL nguồn | `external_url` | Ingest; **không** có ô trên Admin Sửa |
| 4 | Danh mục | `category_id` | OK (ý nghĩa) |
| 5 | Chủ đề | `topic_id` | **Lệch key** — runtime = `chu_de_id` (+ slug/name) |
| 6 | Chủ thể | `entities` | **Thô** — runtime Admin = `tickers` / `sectors` / `ecosystems` / `exchange` |
| 7 | Mô tả bài viết | `excerpt` | OK |
| 8 | Nội dung bài viết | `body` | **Lệch key** — runtime = `body_html` |
| 9–12 | Ảnh đại diện | `cover.url/alt/caption/credit` | OK |
| 13 | Tác giả / Nguồn | `author_display` | **Abstract** — runtime = `author.id` + `author.display_name` |
| 14 | Ngày đăng | `published_at` | OK (Admin còn `scheduled_at`) |
| 15 | Ngày cập nhật | `updated_at` | User Web hiển thị; Admin Sửa không edit |
| 16–19 | SEO | `seo.title/description/keywords/canonical` | Khớp form Admin; DB còn ghi thêm `meta_*` / `og_*` |
| 20 | Trạng thái | `status` | OK |
| 21–24 | Display | `display.featured/pin/comments/share` | OK |

---

## 4. Đối chiếu Admin · Danh sách / Sửa bài viết

### 4.1 Admin Sửa (`edit.html` + `article-edit-page.js` → `community_posts`)

| Trường trên form / payload | Có trên trang Đồng bộ? | Khớp key? |
|----------------------------|------------------------|-----------|
| `title` | Có | Có |
| `slug` | Có | Có |
| `excerpt` | Có | Có |
| `body_html` | Có (nhãn Nội dung) | **Không** — map ghi `body` |
| `category_id` | Có | Có |
| `chu_de_id` / `chu_de_slug` / `chu_de_name` | Có (nhãn Chủ đề) | **Không** — map ghi `topic_id` |
| `tickers` / `sectors` / `ecosystems` / `exchange` | Gộp 1 dòng “Chủ thể” | **Không tách** — map ghi `entities` |
| `cover.*` | Có | Có |
| `seo.title/description/keywords/canonical` | Có | Có |
| `status` | Có | Có |
| `scheduled_at` / Ngày đăng | Một phần (`published_at`) | **Thiếu** `scheduled_at` riêng |
| `display.*` | Có | Có |
| **`author` (id / display_name)** | Chỉ `author_display` | **Không** — form Sửa **không có** ô Tác giả/Nguồn |
| **`external_url`** | Có trên map | Form Sửa **không có** |

### 4.2 Admin Danh sách (cột hiển thị)

Cột dùng: Nguồn (`nguonLabel` ← nhiều nguồn cạnh tranh gồm `author` / `source_*`), Tiêu đề, Danh mục, Chủ đề (`chu_de_name`), Trạng thái, link xem/sửa.

→ Cột **Nguồn** phụ thuộc attribution runtime, **không** đọc trang Đồng bộ. Map có `author_display` nhưng **không đồng bộ** với `nguonLabel` hiện tại.

---

## 5. Đối chiếu User Web · Chi tiết bài (`community-post-page.js`)

| Surface User Web | Nguồn field | Có trên trang Đồng bộ? |
|------------------|-------------|------------------------|
| Tiêu đề | `title` | Có |
| Lead / mô tả | `excerpt` | Có |
| Hero ảnh | `cover` | Có |
| Byline tác giả | `author.display_name` (+ tier badge) | Một phần (`author_display`) |
| Publisher phụ | `publisher` / `provider` / `source.name` | **Không** (và đang cạnh tranh SoT attribution) |
| Ngày đăng / cập nhật | `published_at` / `updated_at` | Có |
| Tags / chủ đề | `story_tags` / `chu_de*` | Một phần (`topic_id`) |
| Sidebar mã / ngành / HST | `tickers` / `sectors` / `ecosystems` | Một phần (`entities`) |
| Thân bài | `body_html` | Một phần (`body`) |
| SEO document | `seo` + `IfluxSeoUrl` | Một phần (4 field) |
| GEO AI / FAQ khối | `geo` / helper | **Không** (capability ngoài schema RSS) |
| Bình luận / like / share UI | `stats` + `display.comments/share` | Display flags có; **stats** không |

---

## 6. Trường runtime / UI đang dùng mà map chưa phản ánh đúng

### 6.1 Thiếu hoặc sai key (ưu tiên nếu Owner muốn trang = schema bài)

| Hạng mục | Hiện trên map | Thực tế SoT / UI |
|----------|---------------|------------------|
| Nội dung | `body` | `body_html` |
| Chủ đề | `topic_id` | `chu_de_id` (+ slug/name/tags) |
| Attribution | `author_display` | `author.id` + `author.display_name` |
| Chủ thể | `entities` (1 ô) | `tickers` · `sectors` · `ecosystems` · `exchange` (+ `entity_occurrences`) |
| Lịch đăng | chỉ `published_at` | thêm `scheduled_at` |
| Provenance RSS | có `external_url` | thêm `source_id` / `from_rss` (kỹ thuật; có thể ghi chú “không hiển thị”) |
| Byline cạnh tranh UW | — | `publisher` / `provider` / `vendor` — **đang hiện** trên chi tiết nếu có |
| SEO mở rộng DB | 4 field | `seo.meta_*` / `og_*` / `og_image` (normalize ghi) |
| Engagement | — | `stats.*` (UW) |
| GEO | — | `geo` (UW) |

### 6.2 Có trên map nhưng không phải ô Admin Sửa

- `external_url`
- `updated_at`
- `author_display` (không có `fld-author`)

→ Map **không** = form Admin; map = **ingest + một phần** schema bài.

---

## 7. `content_articles`?

**Không** liên quan trang này. Trang không liệt kê cột SQL Content Engine. Kho bài Admin/User Web Community = `community_posts`.

---

## 8. Khuyến nghị (chờ Owner — chưa code)

1. **Khóa vai trò trang:** chỉ Mapping Spec RSS → payload Community **hoặc** nâng thành Schema Catalog khớp 1:1 `normalizeArticleInput` — chọn một.
2. Nếu giữ Mapping Spec: sửa key lệch (`body_html`, `chu_de_id`, `author.id`/`display_name`, tách entity) cho khớp ingest/Admin — **Modify** `rss-catalog.js`, không tạo page mới.
3. Nếu cần SoT mapping từ DB: nối trang tới `community_rss_schema` **hoặc** xóa API chết — tránh 2 catalog.
4. Attribution epic (Wave A+): độc lập; trang Đồng bộ **không** phải nguồn sự thật byline.

---

## 9. Evidence files

| File | Vai trò |
|------|---------|
| `Admin_Design_system/app/community/dong-bo-cau-truc-bai-viet.html` | Shell trang |
| `Admin_Design_system/app/community/rss-catalog.js` | **Nguồn data** `ARTICLE_FIELD_MAP` (24) |
| `Admin_Design_system/app/community/rss-article-schema-page.js` | Render bảng |
| `Admin_Design_system/app/community/content/edit.html` | Form Sửa |
| `Admin_Design_system/app/community/content/article-edit-page.js` | Payload Admin |
| `backend/src/modules/community/community-articles.service.js` | `normalizeArticleInput` |
| `User_Web/iflux-web-ui/community-post-page.js` | Chi tiết User Web |
| `backend/src/modules/metadata/wave-d-admin.routes.js` | API `rss-article-schema` (chưa gắn UI) |
