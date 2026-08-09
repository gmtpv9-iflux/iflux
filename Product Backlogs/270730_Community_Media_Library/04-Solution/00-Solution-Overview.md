# 00 — Solution Overview  
## Community Media Library & Image Localization

| | |
|--|--|
| **Document ID** | SOL-COM-MEDIA-00 |
| **Version** | 1.0 |
| **Status** | 🟡 Draft → Owner Review |
| **Date** | 2026-07-30 |
| **Audience** | Product Owner · Reviewer |
| **Neo SoT** | [`../03-SoT-Community-Media-Library.md`](../03-SoT-Community-Media-Library.md) (SoT-COM-MEDIA-001) |
| **Neo BRD** | [`../01-BRD-COM-MEDIA-001.md`](../01-BRD-COM-MEDIA-001.md) |
| **Neo Audit** | [`../02-Discovery-Audit-Admin-Media-Current-State.md`](../02-Discovery-Audit-Admin-Media-Current-State.md) |

> **Vai trò file này:** Overview cho Owner — không đi sâu kỹ thuật.  
> Chi tiết nằm ở `01`…`05` trong cùng thư mục [`04-Solution/`](./).

---

## Bộ tài liệu Solution

| # | File | Trách nhiệm |
|---|------|-------------|
| **00** | **File này** | Mục tiêu · scope · architecture overview · Decision Matrix |
| **01** | [`01-Media-Architecture.md`](01-Media-Architecture.md) | Capability · Ownership · Data Model · Lifecycle · Boundary · Sequence |
| **02** | [`02-Media-Import-Pipeline.md`](02-Media-Import-Pipeline.md) | Scanner → Store → Replace HTML · Retry · Error · Transaction |
| **03** | [`03-Media-Storage-SEO-Strategy.md`](03-Media-Storage-SEO-Strategy.md) | Storage · URL · Naming · SEO · **Asset Variant** · Dedup · Metadata · Search · Usage |
| **04** | [`04-Admin-UX-Workflow.md`](04-Admin-UX-Workflow.md) | **Editor Workflow** — 1 nút 「Nhập vào Thư viện」· banner · status · reuse (PO) |
| **05** | [`05-Media-Format-Policy.md`](05-Media-Format-Policy.md) | Input formats · Variant Policy · quality · EXIF — **không hardcode WebP vào kiến trúc** |

---

# 1. Mục tiêu Solution

Thiết kế **High-Level Design** cho Greenfield Capability **Community Media Library**, đủ để Implementation đi theo bản thiết kế mà không phát sinh quyết định nghiệp vụ ad-hoc khi code.

Solution phải chứng minh SoT:

* Media Library = SoT duy nhất của Media Asset  
* Article chỉ tham chiếu Asset  
* Publish Contract (không External Image)  
* SEO Asset Repository (URL · filename · Alt)  
* Import Pipeline = đường duy nhất localize  

---

# 2. Capability Overview

```text
                    Community Admin
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
      Article          Media Library      RSS Ingest
     (nội dung)             │            (hotlink in)
                            │
                    Media Service
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
          Storage       Metadata        Usage
         (+ Variants)   (+ SEO)      (Article↔Asset)
```

**Hai đường vào Asset:**

1. **Import / Localize** — từ HTML / cover / SEO image đang hotlink.  
2. **Upload** — Editor tải file trực tiếp vào Library (MVP có).

**Một đường ra Publish:**

```text
RSS / Paste URL (IMG-A tạm)
        ↓
   Import (1 thao tác)
        ↓
   Media Library (Asset + Variants)
        ↓
   Article (chỉ Media URL)
        ↓
   Publish (PASS | FAIL)
```

---

# 3. Architecture Overview (Owner-level)

```text
┌─────────────────────────────────────────────────────────┐
│                 Admin · Quản lý cộng đồng                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Article Edit │  │ Media Library│  │ RSS Admin    │  │
│  │ + Import btn │  │ Search/Prev  │  │ (ingest URL) │  │
│  └──────┬───────┘  └──────▲───────┘  └──────┬───────┘  │
│         │ Import           │                 │ hotlink  │
│         ▼                  │                 ▼          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Media Import Pipeline                 │  │
│  │  Scan → Download → Validate → Optimize → Dedup   │  │
│  │       → Save Asset → Replace refs → Save Article │  │
│  └───────────────────────┬──────────────────────────┘  │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Media Library (SoT)                   │  │
│  │  Asset · Variants · Metadata · Usage · Media URL │  │
│  └───────────────────────┬──────────────────────────┘  │
└──────────────────────────┼──────────────────────────────┘
                           ▼
                 Storage (MVP: disk domain iFlux)
                           │
                           ▼
              User Web · Feed · Detail · OG
                 (chỉ tiêu thụ Media URL)
```

Chi tiết: [`01-Media-Architecture.md`](01-Media-Architecture.md).

---

# 4. Business Flow (tóm tắt)

```text
External Image
      ↓
 Detected (trong Article)
      ↓
 Import Pipeline
      ↓
 Media Asset (+ Variants)
      ↓
 Referenced (Media Usage)
      ↓
 Publish check
      ├─ PASS → Published
      └─ FAIL → Reject (còn External Image)
```

---

# 5. Scope (Solution MVP)

| Trong MVP | Ngoài MVP (xem Future Extension) |
|-----------|----------------------------------|
| Community articles (body · cover · SEO image bài) | Video / Audio / Document Library |
| Import HTML 1 thao tác | Image Editor · Watermark · OCR |
| Upload thủ công vào Library | AI Alt / AI Tagging |
| Media Library list · search · preview · usage | CDN đa vùng |
| Dedup · Soft delete · Publish gate | Object Storage bắt buộc (chỉ Extension Point) |
| Asset Variant architecture (Original + delivery variants) | Mọi variant size/format ngay từ ngày 1 (policy chọn subset MVP) |

---

# 6. Non-goals

* Không sửa nghiệp vụ chữ / taxonomy bài ngoài thay URL hình.  
* Không yêu cầu Editor sửa HTML.  
* Không giải quyết Affiliate Owner URL / Representation.  
* Không hardcode “chỉ WebP mãi mãi” vào Data Model — dùng **Variant Policy** ([`05`](05-Media-Format-Policy.md)).  
* Không mở Media Library cho mọi module (Avatar/Banner…) trong MVP — chỉ **extension points**.

---

# 7. Decision Matrix (đọc 1 trang)

| Chủ đề | Quyết định MVP | Ghi chú |
|--------|----------------|---------|
| Greenfield Media Library | **Có** | Audit 02 |
| Upload | **Có** | Bổ sung (không giả định “đã có”) |
| Import HTML / Localize | **Có** | FR-01…04 |
| Nút Editor (nhãn) | **「Nhập vào Thư viện」** (hoặc Nội địa hóa hình ảnh) | 1 click · không lộ Replace/WebP |
| Replace URL trong bài | **Automatic** trong cùng một thao tác | Ẩn với Editor |
| Deduplication | **Có** (cùng nội dung hình → 1 Asset) | Cơ chế → `03` |
| SEO Filename | **Có** · cấp 1 lần · không đổi | NR-* |
| Alt Text | **Bắt buộc** trước Publish | SEO-M-03 · PC-01 |
| Publish scope bắt buộc | **Body img + Cover + SEO image bài** | PC-* |
| Delete | **Soft delete** (không xóa khi còn Usage) | UR-02 |
| IMG-A (TipTap) | Giữ khi **biên tập**; **Publish Contract thắng** | D-007 |
| RSS | Ingest vẫn nhận hotlink → Editor/Import sau (MVP) | Không block ingest |
| Storage MVP | **Disk dưới domain iFlux** | Extension → Object Storage |
| CDN đa vùng | **Không** MVP | Extension |
| Asset Variant | **Có kiến trúc**; MVP tạo subset theo Format Policy | Không gắn SoT vào 1 codec |
| Content Engine / Comments | **Ngoài** MVP | Extension |
| RBAC | Gắn quyền Community articles + perm media library list | Chi tiết Plan |

---

# 8. Success (Solution đạt khi)

* Owner hiểu Decision Matrix và Architecture Overview.  
* Impl team có HLD đủ để code theo `01`…`05` mà không tự bịa ownership.  
* Publish gate và Import 1 thao tác có đặc tả rõ.  
* Future Extension Points liệt kê — **không** code hook thừa trong MVP.

---

# 9. Impact Analysis (tóm tắt — chi tiết CG khi mở Plan)

| Area | Impact |
|------|--------|
| Admin Article Edit | Nút Import · progress · gate Publish |
| Admin Media Library | **Page mới** |
| TipTap HTML Contract | Allowlist Media URL domain iFlux (+ giữ http(s) tạm khi draft) |
| Backend | Module Media + Import job + storage + usage |
| RSS | Không bắt buộc localize lúc ingest (MVP) |
| User Web | Tiêu thụ URL mới; regression feed/detail/OG |
| Plan IMG-A | Transition document khi Publish enforce |

**CG Decision:** Create new capability (existing không có Media entity).

---

# 10. Acceptance (Overview)

Ánh xạ BRD AC-01…07 + SoT AC-S-* — chứng minh đầy đủ ở Plan/Verification. Overview chỉ neo:

| ID | Ý |
|----|---|
| O-AC-1 | Import 1 thao tác → không còn External Image trong scope |
| O-AC-2 | Asset xuất hiện trong Library + Usage |
| O-AC-3 | Publish FAIL nếu còn External Image |
| O-AC-4 | Filename · Alt · Media URL nội bộ trên mọi Asset Publish |

---

# 11. Đọc tiếp

1. Owner: Decision Matrix §7 — ACCEPT / chỉnh.  
2. Kiến trúc: [`01-Media-Architecture.md`](01-Media-Architecture.md)  
3. Pipeline: [`02-Media-Import-Pipeline.md`](02-Media-Import-Pipeline.md)  
4. Storage/SEO/Variant: [`03-Media-Storage-SEO-Strategy.md`](03-Media-Storage-SEO-Strategy.md)  
5. UX: [`04-Admin-UX-Workflow.md`](04-Admin-UX-Workflow.md)  
6. Format Policy: [`05-Media-Format-Policy.md`](05-Media-Format-Policy.md)

---

*SOL-COM-MEDIA-00 v1.0 · Overview · 2026-07-30*
