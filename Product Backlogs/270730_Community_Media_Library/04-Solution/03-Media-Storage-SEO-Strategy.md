# 03 — Media Storage · SEO · Asset Variant Strategy

| | |
|--|--|
| **Document ID** | SOL-COM-MEDIA-03 |
| **Version** | 1.0 |
| **Status** | 🟡 Draft → Owner Review |
| **Date** | 2026-07-30 |
| **Format Policy** | [`05-Media-Format-Policy.md`](05-Media-Format-Policy.md) |
| **Neo SoT** | NR-* · SEO-M-* · BR-M-* |

> Gom policy Storage · URL · Naming · SEO · **Variant** · Dedup · Metadata · Search · Usage.  
> **Không** gắn kiến trúc vào một codec cố định (WebP-only). Codec là thuộc tính của **Variant**.

---

# 1. Storage Strategy (MVP)

## 1.1 Logical layout

```text
{MEDIA_ROOT}/
  community/
    {YYYY}/
      {MM}/
        {asset_id}/
          original.{ext}
          v-{role}-{WxH}.{ext}     ← variants
          manifest.json            ← optional on-disk index
```

* `MEDIA_ROOT` nằm dưới quyền phục vụ domain iFlux (web root hoặc alias `/media`).  
* **Extension Point:** đổi backend sang Object Storage (S3/MinIO) mà **không** đổi SoT / Asset model — chỉ đổi Storage Adapter.

## 1.2 Ownership

Chỉ **Media Storage** (Media Library) được ghi vào `MEDIA_ROOT`.

## 1.3 Soft delete

* DB: `status=deleted_soft` · ngừng serve public (hoặc serve 410).  
* Bytes: giữ N ngày rồi GC khi Usage=0 (job sau).

---

# 2. URL Strategy

| Loại | Vai trò | Ví dụ khái niệm |
|------|---------|-----------------|
| **External URL** | Media Source / hotlink trước Import | `https://cdn-ngoai/...` |
| **Internal URL / storage key** | Đường nội bộ hệ thống (path/key) | `community/2026/07/{id}/…` |
| **Public Media URL** | URL hiển thị · SEO · Publish | `https://iflux.vn/media/community/…` |
| **CDN URL** | Extension — cùng Public contract, origin khác | Future |

Rules:

* Publish chỉ chấp nhận **Public Media URL** (host allowlist).  
* Public URL **ổn định** theo Asset primary delivery (NR-03 / SEO-M-04).  
* Variant có thể có URL riêng; primary cho `<img src>` / cover / OG = variant `role=delivery` (hoặc `original` nếu chưa có delivery — theo Policy).

```text
External URL
    ↓ Import
Internal storage key + Variants
    ↓
Public Media URL  ←── Article tham chiếu cái này
    ↓ (future)
CDN URL (optional alias)
```

---

# 3. File Naming Strategy (SEO)

## 3.1 Principles (SoT)

* Media Library cấp phát **một lần**.  
* Phản ánh nội dung bài / ngữ cảnh.  
* Không đổi sau cấp phát.

## 3.2 Solution template (MVP)

```text
{article-slug-normalized}-{seq}
```

* `article-slug-normalized`: từ slug/title bài · ASCII/hyphen · max length.  
* `seq`: 001, 002… trong phạm vi article import job (hoặc global per asset).  
* Extension thuộc **variant**, không nhét codec vào “tên nghiệp vụ” nếu có thể tách:

Khuyến nghị:

* **Logical name:** `co-phieu-vic-vuot-dinh-001`  
* **File on disk:** `co-phieu-vic-vuot-dinh-001.webp` (delivery) · `…-001.orig.jpg` (original)

Upload không có article: `{uploader-hint|img}-{shortid}`.

## 3.3 Ai không được đặt tên

RSS · Editor free-text · Frontend — **không** quyết định tên cuối (NR-04).

---

# 4. SEO Strategy

| Field | Rule |
|-------|------|
| Public Media URL | Domain iFlux · ổn định |
| Filename | §3 |
| Alt Text | Bắt buộc trước Publish; kế thừa `img[alt]` → cover.alt → title |
| Caption / credit | Optional; credit có thể từ Media Source provider |
| OG image | `seo.og_image` = Media URL sau Import |

**Không** dùng External URL trong meta Publish.

---

# 5. Asset Variant Strategy (DAM-style)

## 5.1 Model

```text
Media Asset
├── Original          (canonical bytes sau normalize)
├── Delivery          (format ưu tiên phục vụ web — Policy)
├── Thumbnail         (Library preview)
├── Small / Medium / Large   (responsive — Extension / optional MVP)
├── AVIF / WebP / …   (formats = variants, không phải “đổi SoT”)
└── Future: HiDPI, Dark…   (Extension)
```

## 5.2 Pipeline

```text
Original input
    ↓
Normalize
    ↓
Store Variant(role=original)
    ↓
Generate Variant(role=delivery, format=Policy.primary)
    ↓
Generate Variant(role=thumbnail, …)
    ↓
(Optional) more sizes/formats
    ↓
Publish URLs in manifest
```

## 5.3 Client consumption (tương lai)

```text
Media Asset
    → Request Variant(role, format preference)
    → Done
```

MVP User Web có thể chỉ dùng **một** Public Media URL (delivery). `srcset` = Extension ([`05`](05-Media-Format-Policy.md)).

---

# 6. Deduplication Strategy

```text
Normalize bytes
    ↓
content_fingerprint = hash(normalized_original_bytes)
    ↓
Lookup active Asset by fingerprint
    ├─ Hit  → reuse Asset · add Usage · map URL
    └─ Miss → create Asset + Variants
```

* Dedup **theo nội dung**, không theo External URL (hai CDN khác nhau cùng ảnh → 1 Asset).  
* Thuật toán hash cụ thể (SHA-256…) = implementation detail — **có** trong Plan/code, không cần SoT đổi nếu đổi thuật toán miễn vẫn “cùng nội dung”.

---

# 7. Metadata Strategy (tách lớp)

| Lớp | Ví dụ | Ai sửa |
|-----|--------|--------|
| **Business** | created_by · status · source channel | System / Admin |
| **SEO** | filename · alt · caption · public URL | Library + Import defaults · Editor alt |
| **Technical** | mime · bytes · WxH · fingerprint · variant_manifest | System only |

**Cấm** trộn technical vào UI Editor như “business fields” trừ khi cần hiển thị kích thước.

---

# 8. Search Strategy (Library)

Admin search theo:

| Dimension | MVP |
|-----------|-----|
| Filename | Có |
| Alt text | Có |
| Article (đang dùng) | Có (via Usage join) |
| Source URL / provider | Có |
| Date created | Có |
| Status | Có |

Pagination + sort `created_at DESC` mặc định.

---

# 9. Usage Tracking

```text
One Asset
    ↓
Many Articles (Usage rows)
```

API:

* `GET /media/assets/:id/usages` → list articles.  
* On article save: sync usages từ HTML/cover/seo (hoặc tin Import).  
* Delete Asset: **block** nếu Usage &gt; 0 (UR-02).

---

# 10. Performance notes

* Generate variants async-friendly; MVP sync OK nếu timeout đủ.  
* Thumbnail nhỏ cho Library grid.  
* Không regenerate toàn bộ variants khi chỉ đổi Alt.

---

# 11. Acceptance

| ID | Tiêu chí |
|----|----------|
| ST-AC-1 | Public Media URL thuộc domain iFlux |
| ST-AC-2 | Filename ổn định sau cấp phát |
| ST-AC-3 | Asset có Original + ít nhất Delivery (hoặc Policy equivalent) |
| ST-AC-4 | Dedup reuse khi cùng fingerprint |
| ST-AC-5 | Search đủ dimensions MVP |
| ST-AC-6 | Usage list theo Asset |
| ST-AC-7 | Đổi Format Policy không đòi hỏi đổi SoT objects |

---

*SOL-COM-MEDIA-03 v1.0 · Storage · SEO · Variant · 2026-07-30*
