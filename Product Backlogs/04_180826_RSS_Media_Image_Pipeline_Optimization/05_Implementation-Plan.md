# 05 — Implementation Plan: Media Image Platform

| | |
|--|--|
| **Task** | `04_180826_RSS_Media_Image_Pipeline_Optimization` |
| **Status** | **PLAN AMENDED (execution)** — 2026-08-19. BRD / SoT / Solution **không** đổi |
| **Căn cứ** | [`01_BRD.md`](01_BRD.md) **LOCKED** · Audit · [`03_SoT.md`](03_SoT.md) **LOCKED** · [`04_Solution.md`](04_Solution.md) **LOCKED** · [`06_BR-Checklist.md`](06_BR-Checklist.md) |
| **Thứ tự** | Solution §41 = SoT §39 |
| **Governance** | BR Checklist Backbone + A/B/C. P10 verify-only cho metric. Ingest async = Solution §30 |

**Không** suy profile size từ CSS. **Không** seed `card-lg` · `media-thumbnail` · `media-detail` (file riêng) · AVIF delivery.

---

# 0. Freeze — Owner lock (một nguồn)

| Profile | Size | Crop | Format | Quality | Consumer |
|---|---|---|---|---|---|
| `media-compact` | `120×120` | cover | WebP | 82 | Compact list |
| `media-card` | `640×auto` max 640 | none | WebP | 82 | Card desktop + mobile (một file) |
| `media-hero` | **`960×540`** | cover | WebP | 84 | Hero **và** Detail cover |
| `media-body` | **`960×auto`** max 960 | none | WebP | 84 | Body, không crop |
| `media-og` | `1200×630` | cover | JPEG | 85 | OG/social |

- Detail → **cùng** `media-hero@v1`. Resolver/consumer gọi `media-hero`. **Không** tạo derivative `media-detail`.
- Master static: **lossless WebP**. Animation: animated WebP; nếu không preserve được → giữ original + limitation, **không** flatten âm thầm.
- Raw RSS: **không** xóa chỉ vì job xong hoặc đã có derivative. Cleanup chỉ khi **đồng thời** Master READY + Required Derivatives READY + References UPDATED + Integrity VERIFIED. Sau gate: SUCCESS retain **24h** rồi cleanup; FAILURE retain tối đa **7 ngày** (recovery/retry).
- Legacy `…-001.webp` sống trong compatibility window.
- `/admin/media/upload` = **adapter/entry** thôi. Mọi validate → normalize → master → derivative → metadata → lifecycle đi **một** Media Image Platform. Cấm pipeline SEO/Admin riêng.
- Community Upload UI **không** làm trong task. Ingest **producer-neutral**. Future Community = thêm adapter, **không** `community-media-pipeline`.
- Usage (`media_usages`): semantic **Asset + consumer + owner + field** là **P0 bắt buộc + implement trong task** nếu thiếu. Không để Usage Architecture thành future work.

---

# 0.1 Authority — Plan chỉ execution

```text
BRD LOCKED → Audit → SoT LOCKED → Solution LOCKED → Plan (file này) → Implementation
```

Implementation lệch Solution → **sửa code**, không sửa Solution.

**Plan gap đã đóng (lần amend này):**

1. Observability Solution §32 → **phase P5b implement**; P10 **chỉ verify** runtime.
2. Ingest async Solution §30 → **P2 persist master + enqueue; P5 worker generate**. Cấm `persistRequiredDerivatives` trong path HTTP/import.
3. Cleanup clock → **P7 action enqueue CLEANUP** theo 24h / 7d sau AND-gate (không chỉ mô tả gate).
4. Admin **tạo profile** (BRD §6 / SoT AC-19 / Solution §34 manage) → **P6 create**, không suy “seed 5 = hết create”.

---

# 0.2 Ingest async — chốt execution (Solution §30)

```text
RSS request / Admin import / upload
  fetch (nếu URL)
  → validate
  → normalize / master
  → persist asset + master only
  → enqueue GENERATE (required ACTIVE profile versions)
  → return          ← không chờ 5 derivative

Worker (không block RSS HTTP)
  GENERATE
  → load master
  → load active profile versions
  → generate required derivatives
  → verify
  → update lifecycle (READY khi required xong)
```

`createAssetFromBuffer` **không** gọi generate/persist 5 derivative đồng bộ.

PASS async chỉ khi:

- **A:** call path không generate sync (`rg` + đọc hàm).
- **B:** sau ingest: asset + `role=master`; job `GENERATE` `queued`/`PROCESSING`; derivative profile **chưa** đủ cho đến worker.
- **C:** runtime: request/import trả về trước khi 5 file profile xuất hiện; worker tạo sau.

Job table tồn tại **không** đủ PASS.

---

# 0.3 Vertical slice trong mỗi phase

Mỗi phase chia slice theo hàng [`06_BR-Checklist.md`](06_BR-Checklist.md). Xong một slice → A/B/C ngay. Không để cuối phase mới phát hiện slice sai.

Ví dụ P2:

```text
P2 Master
  ├─ BR-01.02 / BRD-22.01 MIME + bomb + SSRF  → A/B/C
  ├─ BR-01.03 / BRD-04.02 master lossless/animated → A/B/C
  ├─ BR-02.01 raw tạm; không 4 role cứng → A/B/C
  └─ BR-21.01 persist + enqueue; không generate sync → A/B/C
```

---

# 1. Impact Analysis (bắt buộc trước code)

| | |
|--|--|
| **Feature** | Media Image Platform + RSS/Admin adapter + consumer resolver |
| **Owner hiện tại** | `backend/src/modules/media/*` · RSS `rss-ingest.service.js` · SEO `resolveSocialCompatibleImage` · User Web `community-ui.js` |
| **Files** | Xem §2 |
| **Functions** | `createMaster` · `createAssetFromBuffer` (master + enqueue only) · `generateDerivative` (worker only) · `importArticle` · `runAutoImportWorker` / `processQueuedMediaJobs` · `resolveMedia` · `resolvePostDisplayImage` |
| **Consumers** | Community card/hero/detail/body · OG · Admin import/upload SEO |
| **Storage/API** | `media_assets` · `media_variants` · `media_sources` · `media_usages` · `media_jobs` · `GET /media` · `POST /api/admin/media/*` |

**Decision**

| Capability | Quyết định | Why cannot modify? |
|---|---|---|
| Process + persist + OG swap | **Modify** `media-process.js` · `media.service.js` · `media-import` · `media-trigger` · `media.routes` | Đã là owner |
| RSS bind | **Modify** `rss-ingest.service.js` | Chỉ adapter; không processor riêng |
| Feed/detail `src` | **Modify** `community-ui.js` + feed DTO nếu cần assetId | Không tạo runtime image helper mới |
| OG | **Modify** `seo-platform.service.js` | Đổi sang resolver `media-og` |
| Profile registry | **Create tables** `media_image_profiles` + `media_image_profile_versions` | `media_variants.role` không phải registry/version/lifecycle |
| Representation | **Modify** `media_variants` (thêm `profile_version_id`) **hoặc** bảng representation nếu UNIQUE `(asset, role)` không đủ | Variante theo profile version — đánh giá ở P0 |
| Jobs | **Modify** `media_jobs.kind` | Đã có bảng |
| Usage | **P0 xác minh** `media_usages` đủ consumer + owner + field; **thiếu thì ALTER trong task này** | Đã có bảng — không stash sang future Library |
| Admin/SEO upload | **Modify** `POST /admin/media/upload` thành adapter vào platform | Giữ endpoint; **cấm** process riêng |
| Admin Quy chuẩn | **Create** 1 page + 1 nav item + 1 route | Không có page tương đương. **Không** tạo library listing |
| RBAC | **Modify** `permission-catalog.js` | Key mới SoT/Solution đã khóa |

**Cấm:** `media-platform-v2.js` · processor song song · `display:none` pipeline cũ · hardcode `resize(960,540)` ngoài registry.

---

# 2. Inventory — sửa chỗ đang có

| File | Việc |
|---|---|
| `backend/src/modules/media/media-process.js` | Master lossless WebP / animated; generate **theo profile version**, không 4 role cứng |
| `backend/src/modules/media/media.service.js` | Asset lifecycle · persist **master only** + enqueue GENERATE · `resolveMedia` · **không** gọi generate 5 profile trên ingest path · metric increment (P5b) · **không** file resolver mới nếu nhét được đây |
| `backend/src/modules/media/media-storage.js` | Path `{asset-id}-{profile-key}@v{version}.{ext}` cho file **mới**; không đổi tên file cũ cho đến compatibility xong |
| `backend/src/modules/media/media-import.service.js` | Adapter: ingest → platform; bind asset; **xóa** logic coi delivery full-px là xong |
| `backend/src/modules/media/media-trigger.worker.js` | Thêm kind `GENERATE/REGENERATE/REBUILD/VERIFY/CLEANUP`; bounded concurrency |
| `backend/src/modules/media/media.routes.js` | `upload`/`import` = entry only; resolve · **profile create/edit/lifecycle** · regen; perm mới |
| `backend/src/modules/community/rss-ingest.service.js` | Chỉ fetch + bind; không resize |
| `backend/src/modules/seo-platform/seo-platform.service.js` | OG = `resolveMedia(..., "media-og")` |
| `backend/src/modules/community/community-feed.service.js` | Trả `assetId` (hoặc tương đương) để resolver; không ghép `-300x400` |
| `User_Web/iflux-web-ui/community-ui.js` | Card/compact/hero/detail: `resolveMedia` + profile; detail dùng **`media-hero`** |
| `backend/src/modules/admin-rbac/permission-catalog.js` | Module `media` + 4 key |
| `Admin_Design_system/iflux-admin-ui/iflux-admin-nav-registry.js` | Group **Quản lý Thư viện** · item **Quy chuẩn hình ảnh** (trên Quản lý giao diện — BRD) |
| `Admin_Design_system/iflux-admin-ui/iflux-admin-routes.js` + `admin-rbac-client.js` | 1 slug + perm map |
| **Mới (1 page)** | `Admin_Design_system/app/library/quy-chuan-hinh-anh.html` (+ JS tối thiểu cùng folder) |

**Không đụng:** leftover `/var/iflux/storage` · DB `iflux` · copy 27.632 clone · avatar/comment/onboarding · `APP_ENV=production`.

Deploy: GitHub `staging` → Staging; `production` → Production. Không rsync.

---

# 3. Phases

## P0 — Schema map (read-only) · STOP nếu không map được

**Cấm** migration/SQL ghi trong P0. Chỉ đọc schema + code.

Slices: `BR-01.06` · `BRD-04.01` · `BRD-04.04` · usage consumer/owner/field.

Map `media_assets` / `media_variants` / `media_jobs` / `media_usages` → Solution §20–§27.

### `media_usages` — bắt buộc (không future)

```text
Media Asset
 ├── consumer
 ├── owner
 └── field
```

Map cột hiện có. Thiếu → liệt kê ALTER P1. Cấm “Usage làm sau”.

### Evidence P0 (bắt buộc)

| Lớp | Áp dụng | PASS khi |
|---|---|---|
| **A** | Có | File migration + `media.service` usage SQL; map bảng↔logical |
| **B** | Có | `information_schema` + counts trên `iflux_staging` (SoT env Staging). Reproduce query. |
| **C** | **N/A** | P0 không đổi runtime. Lý do: read-only map. |

### PASS

- Cột ALTER / bảng **phải** tạo (`profiles` + `profile_versions`) **hoặc** đã tồn tại (nếu session trước đã apply 058 — ghi rõ, không giả chưa có).
- UNIQUE `(asset_id, role)` vs `(asset_id, profile_version_id)`.
- Usage đủ 3 nhánh **hoặc** ALTER cụ thể.
- A + B đủ; C = N/A.

### STOP

Không rõ owner cột · `media_assets_v2` · Usage “Library sau”.

Gate: `gates/P0.md` — A/B/C + Req ID. **Không** SoT mới. **Không** P1 nếu P0 chưa PASS.

---

## P1 — DB foundation

ALTER/extend + migration mới **chỉ khi P0 bắt buộc**.

Tối thiểu:

- `media_image_profiles` + `media_image_profile_versions`
- `media_assets`: status (`PROCESSING/READY/FAILED/REGENERATION_*` kể cả `REGENERATION_UNAVAILABLE`) · `is_animated` · master pointer · **`cleanup_eligible_at`** (clock P7 — cột phải có ở P1, enqueue CLEANUP là P7)
- `media_jobs.kind`: 5 kind Solution
- `media_variants` hoặc representation: `profile_version_id` nullable (legacy rows)
- `media_usages`: ALTER ngay trong P1 nếu P0 thiếu consumer / owner / field — P0 đã đủ, **không ALTER usage**

Seed **đúng 5** profile ACTIVE v1 (bảng §0). Không row `media-detail`.

Slices: `BRD-05.01`–`BRD-05.10` · `BRD-04.01` · `BRD-04.03`–`BRD-04.05` · `BRD-13.01` (seed format).

### Evidence P1

| Lớp | Áp dụng | PASS khi |
|---|---|---|
| **A** | Có | `058_media_image_platform.sql` + query helpers `listImageProfiles` / `getActiveProfileVersionByKey` |
| **B** | Có | Staging: 5 key ACTIVE đúng spec §0 · 0 key cấm · `cleanup_eligible_at` tồn tại · 12,601 asset không bị rewrite |
| **C** | **N/A** | P1 là schema/seed. Lý do: chưa đổi runtime HTTP. Admin đọc registry = P6. |

### PASS

Registry đọc được 5 key. Query profile version theo key. `cleanup_eligible_at` có trên `media_assets`. A + B đủ; C = N/A.

---

## P2 — Master pipeline (modify `media-process`)

```text
validate (MIME thật, size, dimension, pixel/frame bomb, SSRF ở download)
 → decode
 → master = lossless WebP | animated WebP | keep original + limitation
 → persist asset + master only
 → enqueue GENERATE
 → return
```

Master **không** serve consumer. **Không** ghi 4 role cứng. **Không** generate 5 derivative trong hàm persist.

Deviation hiện có (`persistRequiredDerivatives` trong `createAssetFromBuffer`) → **sửa implementation** (rule F). Không sửa Solution.

### PASS

- JPEG test → 1 master, 0 thumb 400, 0 `.original` permanent.
- A: path không gọi `generateDerivative` / `persistRequiredDerivatives` trên ingest.
- B: row master + job GENERATE queued; 0 profile variant trước worker.
- C: request trả về trước khi 5 file profile có trên disk (sau deploy Staging).

---

## P3 — Derivative engine

`generate(master, profileVersion)` — đọc **DB profile**, không hằng số trong processor.

Hero/detail: **một** file `960×540` cover WebP. **Không** tạo `media-detail`.

Body: max width 960, height auto, crop none.

OG: JPEG `1200×630` q85.

Idempotent: UNIQUE `(asset_id, profile_version_id)`.

Worker GENERATE: `SELECT` profile version theo `job.profile_version_id` → `generateDerivative` → persist `profile_version_id`.

Source test **không** 16:9 (vd. 1600×800) để hero `960×540` khác body `960×480`.

Slices: `BR-01.04` · `BR-01.05` · `BRD-04.07`.

### Evidence P3

| Lớp | Áp dụng | PASS khi |
|---|---|---|
| **A** | Có | `generateDerivative` không chứa 120/640/960/1200 / `media-detail`. Worker load version từ DB. |
| **B** | Có | Asset mới: 5 variant đúng `profile_version_id` · 0 `media-detail` · UNIQUE giữ 1 row/version · master vẫn `role=master`. |
| **C** | Có | Staging `sharp`: compact 120×120 WebP · card 640×auto WebP · hero 960×540 WebP · body max960×auto WebP · og 1200×630 JPEG. |

### PASS

5 output khớp registry. Hero ≠ body trên source không 16:9. Master không bị ghi đè thành delivery. A+B+C.

---

## P4 — Resolver

Trong `media.service.js`:

```text
resolveMedia(assetId, profileKey)
```

- `media-detail` nếu lỡ gọi → **cùng** bản ghi `media-hero` (alias code, không file thứ hai).
- Missing derivative → nearest registered → không 404 gãy; **không** generate sync trên request.
- Response: url, width, height, mime, profile, version, status.

Legacy path `/media/.../…-001.webp` → map asset (inventory), không đoán `-001 = card`.

API: `GET /api/admin/media/assets/:id/resolve/:profile` (bám prefix `/api/admin/media` hiện có).

Nearest fallback: width/`max_width` từ Registry (không map hằng 120/640/960/1200 trong resolver).

Slices: `BR-01.07` · `BRD-09.01` · `BRD-10.01` · `BRD-11.04`.

### Evidence P4

| Lớp | Áp dụng | PASS khi |
|---|---|---|
| **A** | Có | `resolveMedia` không `generateDerivative`. Alias `media-detail`→`media-hero`. Nearest đọc DB. `findAssetByPublicUrl` không map `-001`=card. |
| **B** | Có | Asset có 5 profile: resolve hero/detail cùng `profile_version_id` hero. 0 row `media-detail`. |
| **C** | Có | HTTP `GET .../resolve/:profile` trên Staging: exact / alias / nearest / missing→master; không sinh variant mới trong request. |

### PASS

Response đủ url, width, height, mime, profile, version, status. Detail = hero file. A+B+C.

---

## P5 — Jobs

Worker hiện có: kind GENERATE / REGENERATE / REBUILD / VERIFY / CLEANUP; bounded concurrency.

**GENERATE (ingest):** load master → active profile versions → generate → verify → READY.

ACTIVE profile → enqueue eligible asset **có master** (async). Không generate trong Admin HTTP.

`REGENERATION_UNAVAILABLE` khi không master — không regen từ thumb/delivery.

GENERATE xong đủ required → enqueue `VERIFY` → file đủ → asset `READY`. Không generate trong HTTP enqueue.

Slices: `BR-01.08` · `BR-02.05` · `BR-02.06` · `BRD-07.01`–`.03` · `BRD-04.06`.

### Evidence P5

| Lớp | Áp dụng | PASS khi |
|---|---|---|
| **A** | Có | `enqueue*` không gọi `generateDerivative`. Worker đọc master disk. VERIFY set READY. CLEANUP `deleted: false`. |
| **B** | Có | Asset mới: 5 GENERATE succeeded + 1 VERIFY succeeded · status READY · no-master → `REGENERATION_UNAVAILABLE`. |
| **C** | Có | Staging: ingest return trước worker; regen từ master không cần `media_sources`; CLEANUP không xóa file. |

### PASS

Worker tạo đủ required derivatives **sau** ingest return. VERIFY → READY. A/B/C execution path — không chỉ “có bảng `media_jobs`”.

---

## P5b — Observability implementation (Solution §32)

**Plan gap đã đóng.** Implement metric **đúng tên** §32 — không đặt tên khác. P10 **không** implement.

| Metric §32 | Owner / cách | A | B | C |
|---|---|---|---|---|
| `media_assets_created` | increment khi persist asset mới | path increment | N/A (counter) hoặc snapshot table nếu persist DB | Staging scrape/read |
| `media_master_generated` | increment khi master READY | path | N/A hoặc DB | Staging |
| `media_derivatives_generated` | increment mỗi derivative thành công | path | N/A hoặc count variants | Staging |
| `media_regeneration_jobs` | increment enqueue GENERATE/REGENERATE/REBUILD | path | `media_jobs` count | Staging |
| `media_generation_failures` | increment job failed | path | jobs `failed` | Staging |
| `media_retry_count` | increment `attempt_count` / retry | path | `attempt_count` | Staging |
| `media_cleanup_count` | increment cleanup xóa raw thành công | path | N/A cho đến P9 | Staging khi có cleanup |
| `media_processing_latency` | histogram; **P50/P95/P99** từ đây | path | N/A | Staging observe percentiles |
| `media_storage_bytes` | master+derivative+raw+total | path/query | SUM `byte_size` + disk | Staging |
| `media_derivative_count` | gauge/count | path | COUNT variants profile | Staging |
| `media_orphan_count` | assets 0 usage | path/query | `NOT EXISTS media_usages` | Staging |
| `media_incomplete_count` | thiếu required derivative | path/query | assets vs 5 profile | Staging |
| `media_regeneration_unavailable` | increment / gauge status | path | `status = REGENERATION_UNAVAILABLE` | Staging |

Log fields §32: `asset_id` · `job_id` · `profile` · `profile_version` · `producer` · `error`.

**Cấm** soft-pass bằng `media_jobs.result` JSONB thay platform metric.

Modify-first: gắn vào module media hiện có (export/read endpoint hoặc counter in-process + persist snapshot). **Không** file `media-metrics-v2.js` song song.

File mới chỉ khi không modify được owner hiện có — ghi Why cannot modify.

### PASS P5b

A: implementation path từng metric. B: query cho metric dựa DB; N/A + lý do cho counter thuần. C: **observable trên Staging runtime** (sau deploy phase này). Thiếu C → không PASS.

---

## P6 — Admin Quy chuẩn + RBAC

| Key | Việc |
|---|---|
| `media.profile.view` | list/view |
| `media.profile.manage` | create/edit/lifecycle/version |
| `media.profile.regenerate` | trigger batch |
| `media.cleanup` | destructive — tách khỏi manage |

Một page: list · **create** · edit spec/version · lifecycle (DRAFT/ACTIVE/DEPRECATED/RETIRED) · status · regen progress. **Không** danh sách asset.

**Tạo profile** (BRD-06.06): form/API create + version v1. 5 profile §0 = seed ban đầu, **không** thay create.

Kích hoạt ACTIVE → enqueue GENERATE async (không sync trong request).

Nav: **Quản lý Thư viện** (trên Quản lý giao diện).

Slices: `BR-01.09` · `BRD-06.01`–`.10` · `BRD-08.01`.

### Evidence P6

| Lớp | Áp dụng | PASS khi |
|---|---|---|
| **A** | Có | `POST /profiles` tạo + v1. `PATCH` sửa spec/lifecycle. ACTIVE → `enqueueGenerateForProfile` (không `generateDerivative` trong HTTP). Reserved `media-detail` / `media-thumbnail` / `card-lg` bị từ chối. `listImageProfiles()` chỉ ACTIVE. Page có form tạo/sửa; **không** list asset. 4 perm catalog. Nav Thư viện trên giao diện. |
| **B** | Có | DB: profile DRAFT + version v1. PATCH ACTIVE → jobs GENERATE queued. Reserved key **0** row. Sau RETIRE: `listImageProfiles()` vẫn đúng 5 seed. `admin_permissions` có 4 key `media.*`. |
| **C** | Có | Staging HTTP: create DRAFT 201; reject `media-detail`; PATCH ACTIVE trả enqueue (request không chờ generate); page HTML có form tạo, không có bảng asset; bootstrap seed 4 perm. Test profile RETIRE ngay. |

### PASS

Admin tạo/xem/sửa/lifecycle/kích hoạt async trên page Quy chuẩn. 5 seed ≠ hết create. A+B+C. Không để profile test ACTIVE sót.

---

## P7 — Adapters (producer-neutral)

**Một** Media Ingest / Platform API. Producer chỉ adapter.

| Entry | Vai trò | Cấm |
|---|---|---|
| RSS `rss-ingest` | Adapter: fetch + bind asset | resize / convert / thumbnail riêng |
| `POST /api/admin/media/upload` | **Giữ URL** (compat). Adapter/entry → cùng platform | Pipeline SEO/Admin riêng |
| `POST /api/admin/media/import` | Adapter bài viết → cùng platform | Process ngoài `createAssetFromBuffer` / ingest mới |
| Future Community Upload | **Không UI** trong task. Sau này chỉ thêm adapter | `community-media-pipeline` |

Ingest phải nhận buffer + metadata **không** phụ thuộc RSS. Community sau này không xây lại validate/master/derivative.

**Raw cleanup gate** (AND, rồi mới đồng hồ):

```text
Master READY
  + Required Derivatives READY
  + References UPDATED
  + Integrity VERIFIED
        ↓
SUCCESS → retain 24h → cleanup
FAILURE → retain ≤ 7d → recovery/retry
```

Không xóa raw vì job `COMPLETED` hoặc “đã có vài derivative”.

**Cleanup clock (execution — Plan từng chỉ mô tả gate):**

| Sau AND-gate | Action |
|---|---|
| SUCCESS | ghi `cleanup_eligible_at = now()+24h` · worker/cron enqueue `CLEANUP` khi `now >= cleanup_eligible_at` · job mới được xóa raw |
| FAILURE / incomplete | retain ≤ 7d · enqueue recovery/retry · quá 7d: Owner/policy hàng FAIL — **vẫn không xóa** nếu AND-gate chưa PASS |

Modify `media_jobs` / cột asset nếu P0/P1 cần timestamp. Cấm cleanup trước AND-gate.

---

## P8 — Consumer migration (User Web + OG)

| Surface | `profileKey` |
|---|---|
| Compact | `media-compact` |
| Card | `media-card` |
| Hero featured | `media-hero` |
| Detail cover | `media-hero` |
| Body | `media-body` |
| OG | `media-og` |

Bỏ `src` chỉ delivery full-px khi resolver đã có derivative. CSS crop card 16:9 **giữ** (profile card `crop: none` — Solution lock).

Không `src.replace` / `-300x400`.

Logo/favicon: **không** migrate trong task này.

---

## P9 — Migration existing (controlled)

**Trước** dry-run/migration, capture baseline (cùng công thức đo lại after):

| Metric | Before | After |
|---|---|---|
| Asset count | | |
| Master bytes | | |
| Derivative bytes | | |
| Legacy bytes | | |
| Total media storage | | |

Phục vụ BR-01 / BR-02 + AC-21 / AC-22. Không migrate khi chưa có cột Before.

```text
Baseline → Inventory → Classify A–G → Dry run → Generate required profiles → Verify → Switch reference → Compatibility → Cleanup eligible → After metrics
```

| Class | Việc |
|---|---|
| A file + usable master | Generate 5 profile |
| B thiếu master | `REGENERATION_UNAVAILABLE` · không upscale từ thumb |
| C chỉ delivery cũ | Compatibility URL; không giả master từ WebP q80 trừ Owner mở recovery |
| G 27.632 clone | **Không** restore |

Staging dry-run trước. Production = push `production` sau PASS Staging.

Không xóa `.original` / delivery cũ nếu reference hoặc compatibility chưa PASS.

---

## P10 — Verify / DoD

| Gate | PASS |
|---|---|
| Platform | 5 profile · master ≠ delivery · resolver · jobs 5 kind |
| RSS | Bài mới: master + required derivatives; raw chỉ cleanup sau **đủ gate** rồi 24h; fail ≤ 7d |
| Consumer | Compact/card/hero/detail/body/OG đúng profile; 0 hardcoded filename mới |
| Admin | Page + 4 perm; activate → job; upload SEO = cùng platform |
| Migration | Baseline 5 metric Before→After; 0 mất reference; 27.632 không copy |
| Usage | P0 map + P1 đủ consumer/owner/field nếu thiếu |
| Security | MIME thật · bomb (size/px/frame) · SSRF |
| Observability | **Verify** 13 metric §32 đã tồn tại + C trên Staging. **Không implement** metric ở P10 |
| Perf | Đọc P50/P95/P99 từ `media_processing_latency` (P5b); không unbounded sharp |

### No-go (Solution § / SoT)

Master không đủ regen · resolver sai profile · retry duplicate · raw xóa trước verify · consumer còn ghép filename · cleanup đụng asset đang dùng.

---

# 4. Môi trường

| | |
|---|---|
| Code | Worktree `staging` · PR/push `staging` |
| Verify | `https://staging.iflux.vn` |
| Production | Chỉ sau PASS Staging · push `production` · CI |
| Leftover | CẤM ghi |

---

# 5. Ngoài plan

Avatar · comment · onboarding · insight · Media Library list · Community upload UI · seed AVIF · seed 400px · backfill leftover.

---

# 6. Khóa Plan (amend execution 2026-08-19)

```text
PLAN AMENDED — execution only

BRD / SoT / Solution: UNCHANGED
BR Checklist: 06_BR-Checklist.md (atomic, gồm BR-03 tách hàng)
Observability: P5b implement / P10 verify
Ingest: Solution §30 Persist → Queue → Worker
Cleanup clock: P7 enqueue 24h / 7d sau AND-gate
Admin create profile: P6 (không STOP — các tầng trên đồng ý)
```

**Không** Task DONE khi P0–P10 “completed”. DONE chỉ khi BR Checklist **mọi** Req ID A/B/C PASS + Final Acceptance từ checklist (không từ code inventory).

Next: **P0 read-only** A+B (+ C N/A) → PASS mới P1. Không nhảy P10. Không code P1+ khi P0 chưa PASS.

Prior session đã apply 058 trên `iflux_staging` và có code lệch §30 — P0 map **hiện trạng**; P2/P5 **sửa lệch**. Không hợp thức hóa bằng cách sửa Solution.
