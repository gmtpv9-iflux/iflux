# 02 — Discovery Audit · Admin hiện trạng Media / Hình ảnh Community

**Date:** 2026-07-30  
**Neo BRD:** [`01-BRD-COM-MEDIA-001.md`](01-BRD-COM-MEDIA-001.md)  
**Status:** ✅ **Audit DONE** — chuẩn bị SoT + Solution (chưa Impact · chưa code)  
**Phạm vi:** Admin Quản lý cộng đồng + backend Community liên quan hình ảnh  
**Verdict:** **Greenfield Media Library.** Hiện chỉ **IMG-A** (dán URL ngoài) + RSS hotlink. Không upload · không localize · không Media Library · không storage/API asset.

---

## 0. Executive summary

| Câu hỏi | Trả lời hiện trạng |
|---------|-------------------|
| Có Thư viện Media trong Admin? | **Không** (nav / page / API / bảng DB = 0) |
| Editor chèn ảnh thế nào? | TipTap **Ảnh (URL)** — chỉ `https://` / `http://` |
| Upload file ảnh? | **Từ chối** (paste/drop) — toast “chưa có Upload Media” |
| Import / localize 1 thao tác? | **Không** |
| RSS đưa ảnh vào bài? | Có — **giữ URL CDN ngoài** trong `cover` + `body_html` |
| Ảnh lưu ở đâu? | Trong `community_posts.payload` JSONB (URL string) — **không** entity Media Asset |
| Gap vs BRD FR/BR/SEO | Hầu hết **MISSING**; vài **PARTIAL** (cover alt/credit) |

---

## 1. Inventory — Admin surfaces

### 1.1 Live (có route / đang dùng)

| Surface | Path | Script | Liên quan media |
|---------|------|--------|-----------------|
| Danh sách bài viết | `app/community/danh-sach-bai-viet.html` · `content/index.html` | `article-list-page.js` | Không |
| **Sửa bài viết** | `app/community/content/edit.html` | `article-edit-page.js` + TipTap stack | **Cover URL + body Image(URL)** |
| Dashboard content | `content/dashboard.html` | `admin-wave-d-pages.js` | Không |
| Danh mục | `categories.html` | `community-categories-page.js` | `cover_url` (text URL) |
| RSS | `nguon-rss.html` · sync danh mục / cấu trúc | RSS pages + ingest BE | Map cover/body từ nguồn **ngoài** |

**Nav:** `iflux-admin-nav-registry.js` — **không** có mục Thư viện Media / Media Library.

### 1.2 Ownership editor (đường chính)

| File | Vai trò |
|------|---------|
| `Admin_Design_system/app/community/content/edit.html` | UI TipTap · cover fields |
| `…/article-edit-page.js` | CRUD `/community/admin/articles` · `body_html` + `cover` |
| `…/article-body-editor.js` | TipTap · Image URL · reject file paste/drop (**IMG-A**) |
| `…/article-html-contract.js` | DOMPurify · `img.src` chỉ `https?://` |
| `iflux-admin-ui/vendor/tiptap/` · `dompurify/` | Vendor |

### 1.3 Dead / orphan (không gắn HTML live)

| File | Rủi ro |
|------|--------|
| `content-edit.js` · `content-list.js` · `content-dashboard.js` | Legacy — Plan FN-CMS-ED-001: không gắn lại |
| `iflux-content-store.js` | Mock/localStorage thumbnail — dễ hiểu nhầm “đã có media” |
| `content/engine.html` · `engine-edit.html` | Không entry routes Admin chính |

---

## 2. Current flows (Editor)

### 2.A Sửa bài viết (CMS)

```text
Danh sách → edit.html[?id=]
  → TipTap (rich | HTML)
  → Cover: url / alt / caption / credit (text)
  → Save → POST/PUT /api/community/admin/articles
  → community_posts.payload JSONB
```

**Chèn ảnh body**

1. Toolbar **Ảnh (URL)** → `prompt('URL ảnh')` → `setImage({ src })` — **không** hỏi Alt.
2. Paste HTML có `<img src="https://…">` → sanitize giữ URL ngoài.
3. Paste/drop **file** → **chặn** + toast IMG-A.
4. Mode HTML: Editor có thể dán mọi `https://` (hotlink).

**Cover / thumbnail**

- Chỉ input URL + alt/caption/credit.
- Không upload · không picker library.
- Backend có thể map `cover.url` → `seo.og_image` nếu thiếu.

### 2.B RSS ingest

`backend/src/modules/community/rss-ingest.service.js`:

- `cover.url` = ảnh nguồn (og / description) — **ngoài**.
- `body_html` giữ `<img src="cdn-ngoài">`.
- `cover.credit` = provider; `cover.alt` ≈ title.
- **Không** download · **không** rewrite URL.

### 2.C Category cover

`community_categories.cover_url` — chuỗi URL tùy ý (thường ngoài).

### 2.D Không tồn tại

- Upload thủ công CMS article  
- One-click Import / localize  
- Media Library list / search / usage / SEO filename  
- File storage `/media/…` (disk/S3) · multer community  

> Ghi chú: Solution draft 270728 từng ghi “upload thủ công đã có” — **không khớp code**. Plan TipTap **IMG-A LOCKED**: chưa Upload Media.

---

## 3. Data model / storage

```sql
-- migrations/004_community_posts.sql
community_posts.payload JSONB  -- body_html, cover{}, seo{}, …
```

**Ảnh trong payload (không entity Media):**

```text
cover: { url, alt, caption, credit }
seo.og_image   ≈ cover.url
body_html      → <img src="https://external/…">
```

| Check | Kết quả |
|-------|---------|
| Bảng `media_assets` / usage | **Không** |
| API upload /media community | **Không** (grep multer/`/media/` module community = 0) |
| Sanitize HTML server khi save | **Không** — tin client |
| User Web render | Dùng URL đã lưu as-is (hotlink) |

**Song song ngoài BRD (rủi ro sau):**

- Content Engine: `content_articles.image_url`  
- Comment: `image_url` dataURL  

---

## 4. Gap matrix vs BRD-COM-MEDIA-001

| ID | Tóm tắt | Status |
|----|---------|--------|
| FR-01 Detect ảnh ngoài | **MISSING** |
| FR-02 Import 1 thao tác | **MISSING** |
| FR-03 → Media Library | **MISSING** |
| FR-04 Rewrite URL nội bộ | **MISSING** |
| FR-05 Metadata asset | **MISSING** (chỉ cover trên article) |
| FR-06 Preview library | **MISSING** |
| FR-07 Search library | **MISSING** |
| FR-08 Usage tracking | **MISSING** |
| FR-09 Dedup | **MISSING** |
| FR-10 Origin audit | **PARTIAL** (RSS credit / external_url bài — không per-image asset) |
| FR-11 SEO filename | **MISSING** |
| FR-12 Alt per asset | **PARTIAL** (cover có alt; body TipTap không UI alt) |
| FR-13 URL domain iFlux | **MISSING** (policy hiện **cho phép** mọi https) |
| BR-01…07 · BR-09 | **MISSING** |
| BR-04 · BR-08 | **PARTIAL** |
| SEO-01…02 · 05…06 | **MISSING** |
| SEO-03 | **PARTIAL** (cover) |
| SEO-04 | **N/A→MISSING** (chưa có URL nội bộ ổn định) |

**EXISTS ≈ 0** capability Media Library / SEO Asset Repository runtime.

---

## 5. Evidence anchors

```123:135:Admin_Design_system/app/community/content/article-body-editor.js
          /* IMG-A: reject file image paste */
          // ...
              toast('v1 chỉ hỗ trợ ảnh bằng URL https/http — chưa có Upload Media', 'warning');
```

```404:409:backend/src/modules/community/rss-ingest.service.js
        cover: {
          url: enriched.cover_url || '',
          alt: enriched.title || '',
          caption: '',
          credit: providerName
        },
```

`community_posts.payload` JSONB — không bảng Media Asset.

---

## 6. Risks / conflicts cho SoT & Solution

1. **Hotlink = mặc định Production** (RSS + Editor URL).  
2. **IMG-A (Plan TipTap) vs BRD SEO-05** — xung đột chính sách; cần Owner transition.  
3. Solution 270728 giả định upload đã có → **phải viết lại** theo BRD + audit này.  
4. Relative `/media/…` sẽ bị Contract TipTap strip nếu không đổi `isAllowedImgSrc`.  
5. Dual stacks: `community_posts` · Content Engine · comment dataURL.  
6. Dead legacy `content-edit.js` / ContentStore — tránh reuse nhầm.  
7. Không publish-gate domain.  
8. Backend không re-sanitize HTML.

---

## 7. Câu hỏi Owner trước khi khóa SoT / Solution

| # | Quyết định cần chốt |
|---|---------------------|
| 1 | Transition: giữ IMG-A đến khi Library sẵn sàng, hay gate Publish (SEO-05) sớm? |
| 2 | URL shape: `https://iflux.vn/media/…` hay `/media/…`? |
| 3 | Localize scope: body `img` · cover · `og_image` · category `cover_url`? |
| 4 | RSS: auto lúc ingest hay Editor one-click sau khi bài vào CMS? |
| 5 | Phase 1: chỉ External Import, hay + Upload thủ công? (upload **chưa** tồn tại) |
| 6 | Dedup: checksum · URL gốc · cả hai? |
| 7 | Alt bắt buộc trước Publish: mọi `<img>` hay cover-only tạm? |
| 8 | Filename BR-07: template từ title/slug + index? Rename khi tái dùng nhiều bài? |
| 9 | Storage: disk web root Production hay object storage? (CDN phân tán = out of BRD) |
| 10 | Content Engine / comments: cùng Library ngay hay chỉ Community articles? |
| 11 | RBAC: perm mới `community.media.*` hay gắn `articles.edit`? |
| 12 | SoT: viết mới dưới folder 270730 hay align SoT-001…005 từ 270728? |

---

## 8. Implication cho SoT + Solution

```text
Decision (CG): Create new capability
Existing: TipTap Image URL + cover fields + RSS hotlink + JSONB
Why cannot modify only: không có Media entity / Library / storage / import pipeline
New responsibility: Media Asset + Library + Import/localize + SEO metadata (BG-SEO-01)
Removal plan: dual URL policy (IMG-A → iFlux-only) khi Owner chốt transition
```

**Hook sẵn để gắn Solution (không phải Media Library):**

- TipTap Image extension + HTML contract (cần mở rộng allowlist domain iFlux).  
- Cover fields trên article.  
- RSS `body_html` / `cover.url` là nguồn hotlink cần localize.  

**Phải tạo mới:** Media Library Admin UI · API · storage · DB asset · import job · usage · dedup · SEO filename/Alt rules.

---

## 9. Next

1. Owner Review BRD (§17) — nếu chưa ACCEPT, vẫn có thể dùng audit này làm input.  
2. Owner trả lời §7 (hoặc subset tối thiểu).  
3. SoT (business/contract) → Solution → Impact Analysis → Plan → Implementation.

**Không code** trong bước này.

---

*Discovery Audit Admin Media · 2026-07-30 · BRD-COM-MEDIA-001*
