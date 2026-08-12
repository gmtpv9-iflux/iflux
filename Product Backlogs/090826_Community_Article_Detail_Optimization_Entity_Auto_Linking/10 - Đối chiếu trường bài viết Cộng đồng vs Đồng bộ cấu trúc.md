# Đối chiếu — Trường thực bài viết Cộng đồng vs trang Đồng bộ cấu trúc

**Date:** 2026-08-10  
**SoT persistence:** `community_posts` (cột bảng + `payload` JSON)  
**Trang map:** https://iflux.vn/admin/cong-dong/dong-bo-cau-truc-bai-viet → `ARTICLE_FIELD_MAP` (**24** dòng)  
**Nguồn runtime:** `normalizeArticleInput` + RSS ingest payload + form Admin Sửa / User Web chi tiết

---

## Verdict ngắn

| | Số |
|--|-----|
| Dòng trên trang Đồng bộ | **24** |
| Trường thực sự đếm được (payload + cột bảng, leaf-level) | **~55+** |
| Kết luận | **Nhiều hơn** trang Đồng bộ — trang map là subset + vài key lệch tên |

Đếm leaf: mỗi key lưu/đọc riêng (vd. `cover.url`, `author.display_name`, `seo.og_image`…), không gộp 1 nhóm = 1 trường.

---

## A. Cột bảng `community_posts` (ngoài payload)

| # | Trường | Trên trang Đồng bộ? | Ghi chú |
|---|--------|---------------------|---------|
| T1 | `id` | Không | PK bài |
| T2 | `user_id` | Không | Actor / owner |
| T3 | `content_type` | Không | Thường `article` (payload cũng có) |
| T4 | `status` | Có (`status`) | Trùng với payload.status |
| T5 | `created_at` | Không | Hệ thống |
| T6 | `updated_at` | Có (`updated_at`) | Cột bảng; map ghi như field bài |

---

## B. Payload — nội dung / taxonomy / entity (Admin Sửa + API)

| # | Trường thực | Trang Đồng bộ (`ifluxKey`) | Khớp? |
|---|-------------|----------------------------|-------|
| 1 | `title` | `title` | Khớp |
| 2 | `slug` | `slug` | Khớp |
| 3 | `excerpt` | `excerpt` | Khớp |
| 4 | `body_html` | `body` | **Lệch tên** |
| 5 | `content_type` | — | Thiếu trên map |
| 6 | `category_id` | `category_id` | Khớp |
| 7 | `category_name` | — | Thiếu (derived / join) |
| 8 | `chu_de_id` | `topic_id` | **Lệch tên** |
| 9 | `chu_de_slug` | — (gộp trong Chủ đề) | Thiếu tách |
| 10 | `chu_de_name` | — | Thiếu tách |
| 11 | `chu_de_tags` / `chu_de` | — | Thiếu (object/array sau ensure) |
| 12 | `tickers` | `entities` (gộp) | **Gộp / lệch** |
| 13 | `sectors` | `entities` | **Gộp / lệch** |
| 14 | `ecosystems` | `entities` | **Gộp / lệch** |
| 15 | `exchange` | `entities` | **Gộp / lệch** |
| 16 | `entity_occurrences` | — | Thiếu |
| 17 | `entities` `{stocks,ecosystems}` | `entities` | Một phần (shape khác Admin) |

---

## C. Payload — cover / SEO / display / lịch

| # | Trường thực | Trang Đồng bộ | Khớp? |
|---|-------------|---------------|-------|
| 18 | `cover.url` | `cover.url` | Khớp |
| 19 | `cover.alt` | `cover.alt` | Khớp |
| 20 | `cover.caption` | `cover.caption` | Khớp |
| 21 | `cover.credit` | `cover.credit` | Khớp |
| 22 | `seo.title` | `seo.title` | Khớp |
| 23 | `seo.description` | `seo.description` | Khớp |
| 24 | `seo.keywords` | `seo.keywords` | Khớp |
| 25 | `seo.canonical` | `seo.canonical` | Khớp |
| 26 | `seo.meta_title` | — | Thiếu (normalize ghi) |
| 27 | `seo.meta_description` | — | Thiếu |
| 28 | `seo.og_title` | — | Thiếu |
| 29 | `seo.og_description` | — | Thiếu |
| 30 | `seo.og_image` | — | Thiếu |
| 31 | `status` | `status` | Khớp |
| 32 | `display.featured` | `display.featured` | Khớp |
| 33 | `display.pin` | `display.pin` | Khớp |
| 34 | `display.comments` | `display.comments` | Khớp |
| 35 | `display.share` | `display.share` | Khớp |
| 36 | `scheduled_at` | — (chỉ `published_at`) | Thiếu |
| 37 | `published_at` | `published_at` | Khớp |

---

## D. Payload — attribution / nguồn (SoT byline + legacy cạnh tranh)

| # | Trường thực | Trang Đồng bộ | Khớp? |
|---|-------------|---------------|-------|
| 38 | `author.id` | `author_display` (abstract) | **Lệch** — map 1 ô, runtime 2+ |
| 39 | `author.display_name` | `author_display` | **Lệch** |
| 40 | `author.tier` | — | Thiếu |
| 41 | `author.tier_label` | — | Thiếu (UW badge) |
| 42 | `publisher` | — | Thiếu (UW vẫn đọc) |
| 43 | `provider` | — | Thiếu |
| 44 | `vendor` | — | Thiếu |
| 45 | `source` `{type,id,name,…}` | — | Thiếu (RSS) |
| 46 | `source_id` | — | Thiếu |
| 47 | `source_name` | — | Thiếu |
| 48 | `source_category` | — | Thiếu |
| 49 | `external_url` | `external_url` | Khớp |
| 50 | `from_rss` | — | Thiếu |
| 51 | `origin` | — | Thiếu |
| 52 | `rss_mapping_id` | — | Thiếu |

---

## E. Payload — engagement / phụ (thường có trên bài live)

| # | Trường thực | Trang Đồng bộ | Khớp? |
|---|-------------|---------------|-------|
| 53 | `stats` (likes/comments/shares/views/…) | — | Thiếu |
| 54 | `geo` (GEO AI / region…) | — | Thiếu (UW) |
| 55 | `created_by_name` | — | Đôi khi Admin ghi |
| — | `comments[]` / `liked_by`… | — | Nội bộ; API detail thường strip |

---

## F. 24 dòng trang Đồng bộ — map ngược

| # | `ifluxKey` trên trang | Có leaf runtime tương ứng? | Ghi chú |
|---|----------------------|----------------------------|---------|
| 1 | `title` | Có | |
| 2 | `slug` | Có | |
| 3 | `external_url` | Có | |
| 4 | `category_id` | Có | |
| 5 | `topic_id` | **Không đúng tên** | = ý `chu_de_id` |
| 6 | `entities` | Có nhưng thô | Runtime tách 4+ field |
| 7 | `excerpt` | Có | |
| 8 | `body` | **Không đúng tên** | = `body_html` |
| 9–12 | `cover.*` | Có | |
| 13 | `author_display` | Abstract | = `author.id` + `display_name` |
| 14 | `published_at` | Có | |
| 15 | `updated_at` | Có (cột bảng) | |
| 16–19 | `seo.*` (4) | Có | DB còn 5 SEO phụ |
| 20 | `status` | Có | |
| 21–24 | `display.*` | Có | |

→ **Không có dòng map nào “thừa hoàn toàn”** so với bài Cộng đồng; vấn đề là **thiếu + lệch tên + gộp**.

---

## G. Tóm tắt đếm (để đối chiếu nhanh)

| Nhóm | Số leaf thực ≈ | Có trên trang Đồng bộ (đúng key) | Lệch / gộp / thiếu |
|------|----------------|----------------------------------|--------------------|
| A. Cột bảng | 6 | 1–2 | Nhiều thiếu |
| B. Nội dung / taxonomy / entity | 17 | ~6 đúng + vài lệch | Nhiều |
| C. Cover / SEO / display / lịch | 20 | 13 đúng | Thiếu SEO mở rộng + `scheduled_at` |
| D. Attribution / RSS provenance | 15 | 1 đúng (`external_url`) + 1 abstract | Rất nhiều |
| E. Stats / geo / phụ | 3+ | 0 | Thiếu |
| **Tổng leaf** | **~55+** | **~20 đúng key** trong 24 dòng map | Trang = **ít hơn** thực tế |

---

## H. Cách đọc cho Owner

1. **Trường thực bài Cộng đồng** = mọi key ở bảng B–E (+ cột A) mà Admin/API/ingest ghi vào `community_posts`.  
2. **Trang Đồng bộ** = 24 dòng **mapping RSS → ý field**, không phải inventory đầy đủ.  
3. So sánh số: thực tế **nhiều hơn** 24; trong 24 dòng map gần như dòng nào cũng “có ý nghĩa”, nhưng **không đủ và không khớp tên** với SoT runtime.

Evidence code: `community-articles.service.js` (`normalizeArticleInput`), `rss-ingest.service.js` (payload RSS), `rss-catalog.js` (`ARTICLE_FIELD_MAP`).
