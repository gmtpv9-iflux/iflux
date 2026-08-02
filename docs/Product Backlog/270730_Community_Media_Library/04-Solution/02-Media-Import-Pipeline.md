# 02 — Media Import Pipeline  
## System Workflow (Dev) · Localize External Images → Media Asset

| | |
|--|--|
| **Document ID** | SOL-COM-MEDIA-02 |
| **Version** | 1.1 |
| **Status** | 🟡 Draft → Owner Review |
| **Date** | 2026-07-30 |
| **Architecture** | [`01-Media-Architecture.md`](01-Media-Architecture.md) |
| **Storage/SEO** | [`03-Media-Storage-SEO-Strategy.md`](03-Media-Storage-SEO-Strategy.md) |
| **Editor Workflow (PO)** | [`04-Admin-UX-Workflow.md`](04-Admin-UX-Workflow.md) |

> **Workflow 2 — System.** Trigger từ nút Editor **「Nhập vào Thư viện」** (một click).  
> Editor không thấy các bước dưới; chỉ thấy progress + “N mới / M tái sử dụng” (file `04`).

---

# 1. Pipeline Overview

```text
Article (draft / pending / published_rss…)
        │
        ▼
┌───────────────────┐
│ 1. Load Article   │  body_html · cover · seo.og_image
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 2. Scan Images    │  phát hiện External Image trong scope
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 3. For each URL   │  (parallel có giới hạn concurrency)
│   Download        │
│   Validate        │
│   Optimize        │  → Variants (Format Policy)
│   Deduplicate     │
│   Save Asset      │
│   Map old→new URL │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 4. Replace refs   │  HTML + cover + seo
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 5. Write Usages   │
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ 6. Save Article   │  transaction / compensating
└─────────┬─────────┘
          ▼
     Result report (ok / partial / fail)
```

---

# 2. Scope của Scan (MVP)

| Vùng | Scan |
|------|------|
| `body_html` — mọi `<img src>` | **Có** |
| `cover.url` | **Có** |
| `seo.og_image` | **Có** |
| CSS `background-image` / `<picture>` / srcset ngoài | **Không** MVP (ghi Future) |
| Category `cover_url` | **Không** MVP (Article-only) |

**External Image** = URL không thuộc allowlist domain iFlux Media (host cấu hình).

**Đã là Media URL** → bỏ qua (idempotent re-import).

---

# 3. Stage specs

## 3.1 Scanner

**Input:** article payload.  
**Output:** danh sách `{ source_url, location: body|cover|seo, node_hint? }`.

Rules:

* Parse HTML an toàn (DOM parser server-side).  
* Chuẩn hóa URL (absolute; bỏ fragment).  
* Dedup danh sách URL trong cùng job (cùng URL nhiều chỗ → download 1 lần).  
* Báo cáo số external tìm thấy trước khi chạy nặng (UI progress).

## 3.2 Downloader

* HTTP(S) GET · timeout · max bytes (Format Policy).  
* Follow redirect có giới hạn.  
* **SSRF guard:** chặn localhost · link-local · private ranges · metadata IPs.  
* User-Agent iFlux bot có thể cấu hình.  
* Retry: N lần với backoff cho 408/429/5xx (không retry 404/410).

**Partial:** một URL fail → ghi lỗi item · tiếp tục URL khác (NFR độ tin cậy).

## 3.3 Validator

* Magic bytes / content-type ∈ input formats Policy.  
* Width/height decode được (trừ GIF animated policy).  
* Reject HTML/PDF giả dạng ảnh.  
* Reject empty / quá lớn.

## 3.4 Optimizer → Variants

Gọi **Asset Variant Strategy** ([`03`](03-Media-Storage-SEO-Strategy.md) · [`05`](05-Media-Format-Policy.md)):

```text
Original bytes
    ↓
Normalize (orient, strip EXIF theo policy)
    ↓
Persist Variant role=original
    ↓
Generate delivery variants (MVP subset)
```

## 3.5 Deduplicate

* Tính `content_fingerprint` trên bytes **đã normalize** (định nghĩa kỹ thuật trong `03`).  
* Nếu Asset active trùng fingerprint → **reuse** Asset; không ghi file mới.  
* Vẫn tạo Usage mới cho Article hiện tại.  
* Map `source_url → existing media_url`.

## 3.6 Save Asset

Nếu không reuse:

* Cấp `asset_id` · SEO filename · Media URL.  
* Lưu Media Source (`original_url`, channel=`import`|`rss_localize`).  
* Alt mặc định: từ `img[alt]` · cover.alt · article title (theo thứ tự ưu tiên Solution).  
* Status = `active`.

## 3.7 Replace HTML / fields

* Mọi `src` trùng `source_url` → `media_url` (primary delivery URL).  
* Set/keep `alt` từ Asset nếu trống.  
* Khuyến nghị: gắn `data-media-asset-id`.  
* `cover.url` / `seo.og_image` thay tương ứng.  
* **Không** đổi nội dung chữ ngoài thuộc tính ảnh.

## 3.8 Usage + Save Article

* Upsert Media Usage cho mỗi Asset được tham chiếu sau replace.  
* Save article qua Community Articles API/service.  
* Ghi import job log: counts · failures · duration.

---

# 4. Transaction & Rollback

| Chiến lược MVP | Mô tả |
|----------------|-------|
| **Best-effort + report** | Asset đã lưu có thể tồn tại dù article save fail → job có thể “reattach” / re-run idempotent |
| **Compensating** | Nếu replace fail sau khi tạo Asset mới không Usage → Asset `Unused` (cleanup job sau) |

**Không** yêu cầu distributed XA. Idempotent Import là mục tiêu chính:

* Re-run trên bài đã localize → Scanner thấy 0 external → no-op success.

---

# 5. Error Handling

| Lỗi | Hành vi |
|-----|---------|
| Scan 0 external | Success · message “Không còn ảnh ngoài” |
| Download fail | Item fail · tiếp tục |
| Validate fail | Item fail · tiếp tục |
| All items fail | Job fail · article không replace |
| Partial | Job `partial` · article save phần đã map · UI liệt kê URL lỗi |
| SSRF / forbidden | Item fail · không retry |
| Storage full | Job fail · không half-replace nếu chưa có map đủ policy (Solution: fail-closed replace nếu &lt; threshold — mặc định: vẫn partial map) |

**UI:** xem [`04`](04-Admin-UX-Workflow.md) — progress · danh sách lỗi · nút “Thử lại ảnh lỗi”.

---

# 6. Logging & Audit

Mỗi job lưu:

* `job_id` · `article_id` · `actor_id` · timestamps  
* `found` · `succeeded` · `failed` · `reused_dedup`  
* per-item: source_url · outcome · asset_id · error_code  

Phục vụ BRD audit nguồn gốc + vận hành.

---

# 7. Concurrency & Idempotency

* Một article **một import job active** tại một thời điểm (lock advisory).  
* Fingerprint + Media URL map đảm bảo re-import an toàn.  
* Parallel download: worker pool size cấu hình (ví dụ 3–5).

---

# 8. API Contract (Import)

```text
POST /api/media/import
  Auth: Admin
  Body: { article_id: string, options?: { async?: boolean } }

Response 200 (sync):
{
  job_id, status: "succeeded"|"partial"|"failed"|"noop",
  found, succeeded, failed, reused,
  items: [{ source_url, status, asset_id?, media_url?, error? }],
  article_id
}

Response 202 (async):
{ job_id, status: "queued" }

GET /api/media/import/:job_id
  → progress + same result shape
```

Publish check (khác endpoint):

```text
POST /api/media/publish-check
  Body: { article_id } | { body_html, cover, seo }
  → { ok: boolean, external: [...], missing_alt: [...] }
```

---

# 9. Upload Pipeline (đối chiếu)

Không qua Scanner/Download:

```text
Upload file
  → Validate
  → Optimize / Variants
  → Dedup
  → Save Asset (+ Source channel=upload, original_url=null)
  → Return asset to Editor
  → Editor inserts ref
  → Save Article → Usage
```

Chi tiết UX: [`04`](04-Admin-UX-Workflow.md).

---

# 10. RSS relationship

```text
RSS Ingest (MVP)
  → vẫn ghi hotlink vào article
  → KHÔNG gọi Import tự động

Editor / Operator
  → mở bài → Import 1 lần
  → Publish gate
```

**Future:** optional auto-import sau ingest — Extension Point, không MVP.

---

# 11. Acceptance (Pipeline)

| ID | Tiêu chí |
|----|----------|
| PIP-AC-1 | Một thao tác Import xử lý toàn bộ External Image trong scope |
| PIP-AC-2 | Sau succeeded: 0 External Image trong scope |
| PIP-AC-3 | Fail một ảnh không chặn các ảnh còn lại (partial) |
| PIP-AC-4 | Re-import idempotent |
| PIP-AC-5 | Dedup reuse Asset khi cùng nội dung |
| PIP-AC-6 | Usage được ghi cho Article |
| PIP-AC-7 | SSRF / non-image bị từ chối |

---

*SOL-COM-MEDIA-02 v1.0 · Import Pipeline · 2026-07-30*
