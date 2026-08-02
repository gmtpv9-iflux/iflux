# Plan — Community Media Library  
## Capability Backend + Integration (5 Phases)

| | |
|--|--|
| **Document ID** | PLAN-COM-MEDIA-001 |
| **Version** | 1.0 |
| **Status** | 🟢 Implemented on Production (P0–P5 one-shot · 2026-07-30) |
| **Date** | 2026-07-30 |
| **Neo BRD** | [`01-BRD-COM-MEDIA-001.md`](01-BRD-COM-MEDIA-001.md) |
| **Neo SoT** | [`03-SoT-Community-Media-Library.md`](03-SoT-Community-Media-Library.md) |
| **Neo Solution** | [`04-Solution/`](04-Solution/) |
| **Neo Audit** | [`02-Discovery-Audit-Admin-Media-Current-State.md`](02-Discovery-Audit-Admin-Media-Current-State.md) |
| **Governance** | PG-1.0 · Engineering Change CG · UR-001 (chỉ binding UI có sẵn) |

> **Tính chất Plan:** Capability **Backend + Integration**.  
> **Không** xây giao diện Library / TipTap UI / Cover Picker / Nav / Upload Dialog mới.  
> Dùng **HTML/CSS/Admin pattern đã có** — chỉ nối API · Banner · Status · Publish Check · nút nghiệp vụ trên template hiện tại.

---

# PG-001 — Phase Overview

## 1. Task Objective

Đưa **Community Media Library** vào Production theo SoT-COM-MEDIA-001:

* Media Asset do iFlux sở hữu (Library = SoT).  
* Editor **một nút** 「Nhập vào Thư viện」 → toàn bộ ảnh ngoài thành Media URL.  
* Publish Contract: không External Image · Alt đủ.  
* Upload + Domain/API/Storage/Variant/Dedup/Usage hoạt động.  
* **Không** ship UI greenfield — chỉ integration vào Editor/template sẵn có.

## 2. Task Roadmap

| Phase | Objective (vai trò → Task Complete) |
|-------|-------------------------------------|
| **0 — Foundation** | Module Media · config · permission · routes stub · storage root · domain registration — **chưa** Upload/Import/Library logic |
| **1 — Media Domain & Storage** | DB + Storage Adapter + Naming + Public URL + Variant manifest + List/Detail/Search API — Library **độc lập** qua API |
| **2 — Upload Pipeline** | Upload → Validate → Normalize → Variant → Dedup → Storage → Asset → Return |
| **3 — Import Pipeline** | Scan → Download → … → Replace HTML/Cover/OG → Usage → Job — **feature chính** (RSS localize) |
| **4 — Editor Integration** | Nối API vào template có sẵn (Banner · Status · nút · Publish Check) — **không làm UI mới** |
| **5 — Stabilization** | Retry · Cleanup · Soft Delete · Logging · Audit · Performance · Regression — **PASS** |

## 3. Current Phase Objective

*Khi Owner mở thi công:* bắt đầu **Phase 0**.  
*(Plan này khóa roadmap; từng Phase mở theo Exit trước đó.)*

## 4. Phase Contribution

```text
Task Complete (Media Library Production)
  ↑
Phase 5 Stabilization PASS
  ↑
Phase 4 Editor Integration (template ↔ backend)
  ↑
Phase 3 Import Pipeline (1-click localize)
  ↑
Phase 2 Upload Pipeline
  ↑
Phase 1 Domain & Storage (API Library độc lập)
  ↑
Phase 0 Foundation
```

**Sau Phase N chưa được:**

| Sau Phase | Chưa được claim |
|-----------|-----------------|
| 0 | Có Upload/Import/Library nghiệp vụ |
| 1 | Có localize RSS / Publish gate Editor |
| 2 | Có Import HTML / Banner Editor |
| 3 | Có Editor 1-click trên Production UI (chưa wire) |
| 4 | Stabilization / soft-delete GC / perf PASS |
| 5 | — Task Complete |

## 5. Exit checklist (preview)

Mỗi Phase: Deliverables · AC Phase · Evidence · Owner/Reviewer sign · **không** nhảy phase.

---

# 0. Impact Analysis (Plan-level)

| Feature | Current owner | Files / consumers | Decision |
|---------|---------------|-------------------|----------|
| Media capability | **Không có** (Audit 02) | — | **Create** `backend/src/modules/media/` |
| Article persist | `community-articles.service` | `body_html` · `cover` · `seo` | **Modify** — gọi publish-check · nhận replace từ Import |
| TipTap / edit.html | `article-body-editor` · `edit.html` · `article-edit-page` | IMG-A URL | **Modify** — nút/banner/status/API; **không** redesign UI |
| HTML Contract | `article-html-contract.js` | allowlist `https?://` | **Modify** — allow Media URL host iFlux |
| RSS ingest | `rss-ingest.service` | hotlink in | **Reuse** MVP (không auto-import) |
| User Web render | community UI | URL as-is | **Verify** regression — không đổi ownership |
| Upload Media | Không | — | **Create** trong Media module |

**CG-012:** Create Media module vì không có existing Media entity để modify.

**UI policy Plan:** Cấm phase “xây Library page / TipTap chrome / Nav / Dialog” — mọi surface Editor dùng control/`ix-*` đã có trên `edit.html` (bổ sung markup tối thiểu nếu thiếu slot — không Design System mới).

---

# 1. Out of Scope (toàn Plan)

| ❌ Bỏ hẳn | Lý do |
|-----------|--------|
| Xây giao diện Library page | UI/style sẵn — Plan = backend + integration |
| TipTap UI redesign | |
| Cover Picker UI mới | |
| Navigation registry page mới | Có thể đăng ký route **sau** nếu Owner mở task UI riêng |
| Upload Dialog design mới | Dùng input/file pattern Admin hiện có |
| Auto-import lúc RSS ingest | Extension — không Phase 0–5 |
| CDN / S3 bắt buộc | Extension (Adapter sẵn từ Phase 1) |
| Video / AI Alt / Watermark | BRD out |

---

# Phase 0 — Foundation

### Objective

Tạo **khung capability** Media Library trên Backend — sẵn sàng gắn domain ở Phase 1.

### In

* `backend/src/modules/media/` (skeleton)  
* Config: `MEDIA_ROOT` · public base URL · allowlist host  
* Permission hooks (RBAC stub / gắn perm Community)  
* Route đăng ký (health / ping / version)  
* Tạo storage root trên disk (empty)  
* Domain registration trong app bootstrap  

### Out

* Upload · Import · CRUD Asset · Library logic · DB tables nghiệp vụ đầy đủ  

### Deliverables

* Module mount không phá Community routes hiện có  
* Config documented  
* Empty dir `MEDIA_ROOT/community/` tồn tại trên môi trường deploy  

### Acceptance (P0)

| ID | PASS khi |
|----|----------|
| P0-AC-1 | Media module load · route health 200 |
| P0-AC-2 | Config đọc được MEDIA_ROOT + public base |
| P0-AC-3 | Không regress Community article CRUD |

### Exit → mở Phase 1

---

# Phase 1 — Media Domain & Storage

### Objective

**Phần quan trọng nhất:** Domain Model + Storage + API Library độc lập (không cần Editor).

### In — Database

* `media_assets`  
* `media_variants`  
* `media_sources`  
* `media_usages`  
* `media_jobs`  

(Migration + indexes fingerprint / status / created_at.)

### In — Storage

* Storage Adapter (local disk MVP)  
* File Naming (SEO logical name)  
* Public URL builder  
* Variant Manifest (per asset)  

### In — API

* `GET` List (paginate)  
* `GET` Detail  
* `GET` Search (filename · alt · date · status · source)  

### Out

* Upload bytes pipeline · Import HTML · Editor wire  

### Acceptance (P1)

| ID | PASS khi |
|----|----------|
| P1-AC-1 | CRUD/list/search API hoạt động với seed/fixture Asset |
| P1-AC-2 | File ghi đúng layout `{MEDIA_ROOT}/community/YYYY/MM/{asset_id}/` |
| P1-AC-3 | Public URL thuộc domain iFlux |
| P1-AC-4 | Media Library **độc lập** (curl/Postman) — không phụ thuộc Editor |

### Exit → mở Phase 2

**Neo Solution:** [`01-Media-Architecture`](04-Solution/01-Media-Architecture.md) · [`03-Storage-SEO`](04-Solution/03-Media-Storage-SEO-Strategy.md)

---

# Phase 2 — Upload Pipeline

### Objective

Hoàn chỉnh đường **Upload → Asset**.

```text
Upload → Validate → Normalize → Variant → Dedup → Storage → Asset → Return
```

### In

* `POST /media/upload` (multipart)  
* Validate theo Format Policy  
* Normalize + strip EXIF  
* Generate variants MVP (`original` · `delivery` · `thumbnail`)  
* Dedup by content fingerprint  
* Return `{ asset_id, media_url, alt, … }`  

### Out

* Scan HTML / Replace article · Editor banner  

### Acceptance (P2)

| ID | PASS khi |
|----|----------|
| P2-AC-1 | Upload JPEG/PNG/WebP → Asset + variants |
| P2-AC-2 | Upload trùng nội dung → reuse Asset (dedup) |
| P2-AC-3 | Reject non-image / oversize / SSRF N/A |
| P2-AC-4 | Response đủ để Editor chèn URL (integration Phase 4) |

### Exit → mở Phase 3

**Neo:** [`05-Format-Policy`](04-Solution/05-Media-Format-Policy.md) · Solution Upload sequence

---

# Phase 3 — Import Pipeline (feature chính)

### Objective

**Một lần Import** → toàn bộ ảnh trong scope thành ảnh iFlux.

```text
Scan HTML → Detect External → Download → Validate → Optimize/Variant
→ Dedup → Save Asset → Replace HTML → Replace Cover → Replace OG
→ Usage → Job log
```

### In

* `POST /media/import` `{ article_id }` (+ async job optional)  
* `GET /media/import/:job_id`  
* Scanner scope: body `<img>` · `cover.url` · `seo.og_image`  
* SSRF guard · retry download · partial success  
* Replace + save article · usages  
* Idempotent re-import  

### Out

* Editor UI wire (Phase 4)  
* Auto RSS ingest import  

### Acceptance (P3)

| ID | PASS khi |
|----|----------|
| P3-AC-1 | Article RSS hotlink → Import → 0 External Image trong scope |
| P3-AC-2 | Cover + OG + body đều Media URL |
| P3-AC-3 | Result có `mới` / `tái sử dụng` / `lỗi` |
| P3-AC-4 | Partial: ảnh OK được replace; ảnh lỗi liệt kê |
| P3-AC-5 | Re-import noop khi đã localize |
| P3-AC-6 | `POST /media/publish-check` FAIL khi còn external / thiếu Alt |

### Exit → mở Phase 4

**Neo:** [`02-Import-Pipeline`](04-Solution/02-Media-Import-Pipeline.md)

---

# Phase 4 — Editor Integration

### Objective

**Không làm UI.** Chỉ tích hợp Backend vào **template/Admin đã có**.

### In — API surface dùng bởi Editor

* Import · Upload · Library list/search · Usage · Retry job · Publish-check  

### In — Binding trên existing

| Hook | Hành vi |
|------|---------|
| `edit.html` / `article-edit-page.js` | Nút **「Nhập vào Thư viện」** · gọi Import API |
| Banner / status chip | Slot tối thiểu trên layout hiện có — **ix-*** sẵn có; không DS mới |
| Progress | Poll job hoặc sync response — hiển thị số liệu `02`/`04` |
| Publish / đổi status published | Gọi publish-check trước — FAIL → message + CTA Import |
| `article-html-contract.js` | Allowlist host Media URL |
| Paste/drop file (optional cùng Phase) | Gọi Upload API thay toast IMG-A reject |

### Out

* Page Thư viện media riêng · Nav item · TipTap redesign · Cover picker modal mới  

### Acceptance (P4)

| ID | PASS khi |
|----|----------|
| P4-AC-1 | Trên bài RSS: 1 click 「Nhập vào Thư viện」 → Done trên Editor |
| P4-AC-2 | Banner/status phản ánh N ảnh ngoài / đã nội địa hóa |
| P4-AC-3 | Kết quả hiện “mới / tái sử dụng” |
| P4-AC-4 | Publish FAIL khi còn ảnh ngoài |
| P4-AC-5 | HTML/CSS composition Editor không bị thay bằng UI mới |
| P4-AC-6 | Template + Backend hoạt động end-to-end trên môi trường test/Prod theo Owner |

### Exit → mở Phase 5

**Neo:** [`04-Editor-Workflow`](04-Solution/04-Admin-UX-Workflow.md) (hành vi) — impl = wire only

---

# Phase 5 — Stabilization

### Objective

Ổn định Production-ready.

### In

* Retry ảnh lỗi (API + Editor CTA)  
* Dedup regression  
* Soft delete Asset (block nếu Usage &gt; 0)  
* Cleanup Unused / failed jobs  
* Logging · Audit (job + source)  
* Performance (concurrency · timeout · large article)  
* Regression: Community CRUD · Feed User Web · RSS ingest · TipTap save  

### Acceptance (P5)

| ID | PASS khi |
|----|----------|
| P5-AC-1 | Toàn bộ P0–P4 AC còn PASS |
| P5-AC-2 | Soft delete + usage guard |
| P5-AC-3 | Log/audit đủ truy vết Import |
| P5-AC-4 | Regression User Web + Admin article PASS |
| P5-AC-5 | Owner smoke: RSS bài → Nhập Thư viện → Publish |

### Exit → **Task Complete** (Media MVP)

---

# 2. Execution Rule (mỗi Phase)

```text
Impact (nếu đổi scope)
  → Implement đúng In/Out Phase
  → Cleanup dead / không dual Upload path
  → Verify AC Phase
  → Exit sign
  → Phase tiếp
```

**Cấm:** Làm UI Library “tiện thể” trong Phase 1–4.  
**Cấm:** Auto-localize RSS ingest trong MVP trừ Owner mở Extension.

---

# 3. Mapping Solution → Phase

| Solution doc | Phase chính |
|--------------|-------------|
| `01` Architecture · Data Model | 0–1 |
| `03` Storage · SEO · Variant · Dedup | 1–2 |
| `05` Format Policy | 2–3 |
| `02` Import Pipeline | 3 |
| `00` Overview Decision Matrix | All |
| `04` Editor Workflow | **4** (behavior) + **5** smoke |

---

# 4. Risks

| Risk | Mitigation |
|------|------------|
| IMG-A vs Publish Contract | Phase 4 enforce check; draft vẫn cho URL ngoài |
| SSRF download | Phase 3 guard |
| Partial import nhầm Publish PASS | publish-check scan lại |
| UI creep | Out of Scope cứng §Out |
| Storage disk full | Config limit + P5 monitor |

---

# 5. Owner Review

| Check | ☐ |
|-------|---|
| ACCEPT roadmap 5 Phase · Backend + Integration | |
| ACCEPT bỏ UI Library / TipTap / Nav / Dialog khỏi Plan | |
| ACCEPT RSS không auto-import (MVP) | |
| ACCEPT mở Phase 0 khi SoT/Solution LOCK | |
| Nhãn nút 「Nhập vào Thư viện」 | |

| Vai trò | Quyết định | Ngày |
|---------|------------|------|
| Product Owner | | |

**PASS Plan →** Phase 0 OPEN (sau SoT + Solution Owner LOCK).

---

*PLAN-COM-MEDIA-001 v1.0 · 2026-07-30 · Backend + Integration · no UI build phases*
