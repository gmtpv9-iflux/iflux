# 01 — Media Architecture  
## Community Media Library · HLD

| | |
|--|--|
| **Document ID** | SOL-COM-MEDIA-01 |
| **Version** | 1.0 |
| **Status** | 🟡 Draft → Owner Review |
| **Date** | 2026-07-30 |
| **Overview** | [`00-Solution-Overview.md`](00-Solution-Overview.md) |
| **Neo SoT** | SoT-COM-MEDIA-001 |

> Kiến trúc capability · Data Model · Lifecycle · Boundary · Sequence.  
> Chi tiết bước Import → [`02`](02-Media-Import-Pipeline.md). Storage/SEO/Variant → [`03`](03-Media-Storage-SEO-Strategy.md).

---

# 1. Capability Diagram

```text
Media Library (SoT)
│
├── Upload              ← Editor / Admin tải file
├── Import              ← Media Import Pipeline (localize)
├── Search              ← Library UI + API
├── Preview             ← Library + Editor picker
├── Usage               ← Article ↔ Asset ledger
├── Metadata            ← Business + Technical (+ SEO fields)
├── SEO                 ← Filename · Alt · Media URL ổn định
├── Storage             ← Bytes + Variants
└── Deduplication       ← Cùng nội dung hình → 1 Asset
```

**Media Import Pipeline** (capability chị em, không phải UI Library):

```text
Media Import Pipeline
│
├── Scan External Images
├── Download
├── Validate
├── Optimize → Variants (theo Format Policy)
├── Deduplicate
├── Persist Asset
└── Replace Article references
```

---

# 2. Ownership (Solution map)

| Concern | Owner runtime | Ghi chú |
|---------|---------------|---------|
| Media Asset entity | **Media Service / Library API** | Tạo · đọc · soft-delete |
| File bytes + Variants | **Media Storage** (dưới Media Library) | Không module khác ghi file |
| Naming + Media URL | **Media Library** | Cấp 1 lần |
| Usage ledger | **Media Library** | |
| Scan/Replace HTML | **Import Pipeline** | |
| Article body/cover/seo fields | **Community Articles** | Chỉ lưu tham chiếu |
| Publish decision | **Community Articles** | Gọi Media Publish Check |
| Render User Web | **Community UI** | GET URL as-is |

**Cấm:** RSS service / TipTap client / script ad-hoc tự `writeFile` vào thư mục media.

---

# 3. Logical Architecture

```text
┌──────────── Admin UI ────────────┐
│ ArticleEdit │ Library │ Upload   │
└──────┬──────────┬──────────┬─────┘
       │          │          │
       ▼          ▼          ▼
┌──────────────────────────────────┐
│         Media API (HTTP)         │
│  /media/assets  /media/import    │
│  /media/upload  /media/usage     │
│  /media/publish-check            │
└───────────────┬──────────────────┘
                │
       ┌────────┴────────┐
       ▼                 ▼
┌─────────────┐   ┌──────────────┐
│ Media Domain│   │ Import Worker│
│ Asset/Usage │   │ (sync/async) │
│ Metadata    │   └──────┬───────┘
└──────┬──────┘          │
       │                 ▼
       │          ┌──────────────┐
       └─────────►│   Storage    │
                  │ Original +   │
                  │ Variants     │
                  └──────────────┘

Community Articles API
  └── persist payload (body_html, cover, seo) — refs only
```

---

# 4. Core Objects (Data Model — logical)

## 4.1 Media Asset

```text
Media Asset
│
├── Identity
│     ├── asset_id (unique)
│     ├── content_fingerprint (dedup key — kỹ thuật Solution)
│     └── status (active | archived | deleted_soft)
│
├── Storage
│     ├── storage_key / path root
│     └── Variants[]  (Original, delivery variants…)
│
├── Metadata — Business
│     ├── display_name / title (optional)
│     ├── created_at · created_by
│     ├── updated_at
│     └── source (Media Source summary)
│
├── Metadata — SEO
│     ├── filename (stable, SEO)
│     ├── alt_text
│     ├── caption (optional)
│     └── media_url (public canonical for this asset’s primary delivery)
│
├── Metadata — Technical
│     ├── mime / bytes / width / height (primary)
│     └── variant_manifest
│
└── Usage
      └── Usage[] → article_id · field (body|cover|seo) · created_at
```

## 4.2 Media Usage

```text
Media Usage
├── usage_id
├── asset_id
├── article_id
├── field_ref   (body | cover | seo_og_image | …)
├── created_at
└── created_by (optional)
```

**Cardinality:**

```text
Article A ──┐
            ├──► Media Asset X
Article B ──┘
```

Một Asset · nhiều Article (SoT UR-03).

## 4.3 Media Source

```text
Media Source
├── original_url (nullable nếu upload thuần)
├── provider / channel (rss | paste | upload | …)
├── captured_at
└── notes (optional)
```

**Không** dùng làm `img src` khi Publish.

## 4.4 Media Variant

```text
Media Variant
├── variant_id
├── asset_id
├── role        (original | delivery | thumbnail | …)
├── format      (policy-driven — không hardcode SoT)
├── width / height / bytes
├── storage_key
└── public_url
```

Chi tiết role/format: [`03`](03-Media-Storage-SEO-Strategy.md) · [`05`](05-Media-Format-Policy.md).

## 4.5 Article reference (Community)

Article **không** nhúng blob. Sau Import/Upload thành công:

| Field | Lưu |
|-------|-----|
| `body_html` | `<img src="{Media URL}" alt="…">` (và thuộc tính cần thiết) |
| `cover.url` | Media URL |
| `cover.alt` | Đồng bộ / kế thừa Alt Asset khi phù hợp |
| `seo.og_image` | Media URL |

Có thể lưu thêm `data-media-asset-id` trên `<img>` (khuyến nghị Solution) để Usage sync chắc — **không** bắt buộc SoT; Solution chọn.

---

# 5. Lifecycle (runtime states)

Ánh xạ SoT §6:

```text
External          ← URL ngoài trong draft / RSS
    ↓ Import/Upload
Imported          ← Asset created (có thể chưa gắn Usage)
    ↓ Article save ref
Referenced        ← Usage ≥ 1
    ↓ Publish PASS
Published Context ← Article published + refs Media URL
    ↓ remove all usages
Unused
    ↓ admin
Archived
    ↓ policy
Deleted (soft)    ← chỉ khi Usage = 0 (hoặc force Owner — ngoài MVP)
```

---

# 6. Sequence — Import

```text
Editor                Media API           Import Worker         Storage        Articles API
  │                      │                      │                  │               │
  │  POST /import {article_id}                  │                  │               │
  │─────────────────────►│                      │                  │               │
  │                      │  enqueue/run         │                  │               │
  │                      │─────────────────────►│                  │               │
  │                      │                      │ load article     │               │
  │                      │                      │─────────────────────────────────►│
  │                      │                      │ scan external    │               │
  │                      │                      │ download/validate│               │
  │                      │                      │ optimize/variants│               │
  │                      │                      │─────────────────►│               │
  │                      │                      │ dedup → asset    │               │
  │                      │◄─────────────────────│                  │               │
  │                      │                      │ replace HTML     │               │
  │                      │                      │ write usages     │               │
  │                      │                      │ save article     │               │
  │                      │                      │─────────────────────────────────►│
  │  progress / result   │◄─────────────────────│                  │               │
  │◄─────────────────────│                      │                  │               │
```

Chi tiết bước & lỗi: [`02`](02-Media-Import-Pipeline.md).

---

# 7. Sequence — Upload

```text
Editor → POST /media/upload (file + alt?)
       → Validate → Optimize → Variants → Dedup?
       → Persist Asset → Return { asset_id, media_url, alt }
       → Editor insert img / set cover
       → Save Article → Upsert Usage
```

---

# 8. Sequence — Publish

```text
Editor → Publish Article
       → Community Articles service
       → Media API publish-check(article_id | html+cover+seo)
              │
              ├─ External Image found → FAIL (PC-02)
              ├─ Missing Alt on required assets → FAIL (PC-01)
              └─ OK → Proceed publish status
```

---

# 9. Boundary

## Làm

* Library CRUD (list/search/preview/soft-delete)  
* Upload · Import · Dedup · Usage · Publish check  
* Variant generation theo Format Policy  

## Không làm (Non-goals architecture)

* Watermark · crop UI · AI Alt/Tag  
* Video/Audio/Document libraries  
* CDN multi-region orchestration  
* Ownership của feed ranking / chu-de  

---

# 10. Module layout đề xuất (implementation hint — không lock path repo)

```text
backend/src/modules/media/          ← NEW
  media.routes.js
  media.service.js                  ← Asset · Usage · Search
  media-storage.js                  ← write/read variants
  media-import.service.js           ← pipeline orchestration
  media-publish-check.js

Admin:
  app/community/media/              ← NEW Library page
  content/edit.html                 ← Import button + publish UX
  article-html-contract.js          ← allowlist Media URL host

User Web: không tạo Asset — chỉ render
```

CG-012: **Create new** vì Discovery không có owner runtime Media.

---

# 11. Security (architecture-level)

* Upload/Import chỉ Admin authenticated + RBAC Community.  
* Download External: timeout · size limit · content-type image · chặn SSRF (deny private IP ranges).  
* Serve media: chỉ path trong storage root; không path traversal.  
* Không tin `body_html` client khi Publish — server re-scan External Image.

---

# 12. Performance (architecture-level)

* Import nhiều ảnh: progress per-image; partial success (SoT NFR).  
* Import nặng → async job + polling (MVP có thể sync nếu N nhỏ; thiết kế API hỗ trợ async).  
* Dedup trước khi ghi variant nặng.  
* Library list phân trang.

---

# 13. Liên kết

| Tiếp | File |
|------|------|
| Overview | [`00`](00-Solution-Overview.md) |
| Import Pipeline | [`02`](02-Media-Import-Pipeline.md) |
| Storage / SEO / Variant | [`03`](03-Media-Storage-SEO-Strategy.md) |
| Admin UX | [`04`](04-Admin-UX-Workflow.md) |
| Format Policy | [`05`](05-Media-Format-Policy.md) |

---

*SOL-COM-MEDIA-01 v1.0 · Architecture · 2026-07-30*
