# 07 — Removal Plan: Task 04 Media Image Platform

| | |
|--|--|
| **Task** | `04_180826_RSS_Media_Image_Pipeline_Optimization` |
| **Loại** | **Owner-directed removal** — không phải tiếp P7–P10 |
| **Phương pháp mặc định** | **CẤM** `git reset` / revert dải `30ee7d5^..HEAD` |
| **Phương pháp** | Reverse-engineer dependency → gỡ **hành vi Task 04** trên file shared → xóa artifact Task 04 → down schema 058 **chỉ Staging** |
| **05 / 06** | **OUT OF SCOPE — UNCHANGED** (mục 8) |

BRD / SoT / Solution Task 04 **không sửa** (LOCKED). File này = execution removal.  
Rác còn sót **nặng hơn** thiếu một tính năng — mỗi lớp phải có evidence “hết” trước khi đóng.

---

# 0. Vì sao không rollback commit

Task 04 **sửa đè** owner đang sống:

| File | Trước `30ee7d5` (giữ contract) | Task 04 thêm (gỡ) |
|---|---|---|
| `media.service.js` | `createAssetFromBuffer` → `normalizeAndVariants` → role `original` / `delivery` / `thumbnail` / `social` · status `active` · `resolveSocialCompatibleImage` | master-only + `enqueueGenerate*` + `resolveMedia` + profile CRUD + `processQueuedMediaJobs` + VERIFY→READY |
| `media-process.js` | `normalizeAndVariants` · sniff · download | `createMaster` · `generateDerivative` từ Registry · bomb/SSRF nhánh platform |
| `media.routes.js` | upload / import / assets | `GET/POST/PATCH /profiles*` · `resolve/:profile` |
| `media-trigger.worker.js` | auto-import bài PENDING | `processQueuedMediaJobs` sau import |
| `permission-catalog.js` | không module `media` | 4 key `media.*` |
| Nav / routes / RBAC client | không page Quy chuẩn | group Library + page + HREF_PERM |
| `058_*.sql` | không có | registry + cột platform |

`git reset` về trước Task 04 sẽ kéo theo rủi ro: mất comment **CỔNG URL** (35feff7, Owner khóa riêng), và coi mọi diff shared là “một cục”.  
**Được phép:** đọc `30ee7d5^` như **mẫu contract** từng hàm, rồi **sửa/xóa đúng chỗ** trên HEAD.

---

# 1. Impact Analysis (bắt buộc trước code)

| Feature | Owner hiện tại | Files | Quyết định |
|---|---|---|---|
| Ingest upload/import | `createAssetFromBuffer` | `media.service.js` | **Modify** — trả sync `normalizeAndVariants` |
| Ảnh sync (delivery/thumb/social) | `normalizeAndVariants` | `media-process.js` | **Modify** — giữ hàm pre-04; xóa generate-from-registry |
| OG crawler pre-04 | `resolveSocialCompatibleImage` | `media.service.js` · SEO | **Reuse** — không giữ `resolveMedia` |
| RSS | `rss-ingest.service.js` | không resize | **Reuse** — không đụng |
| Auto-import worker | `media-trigger.worker.js` | import PENDING | **Modify** — xóa 1 call `processQueuedMediaJobs` |
| Profile Admin | page + nav | `app/library/*` · nav · routes · rbac | **Delete** page + entry IA |
| Registry / 058 | DB Staging | `058` + tables/cột | **Delete** schema Task 04; **giữ** `043`/`054` `media_*` |
| 4 perm `media.*` | catalog + `admin_permissions` | catalog · seed lúc boot | **Delete** khỏi catalog → bootstrap xóa row |
| Comment CỔNG URL | nav-registry header | 1 block | **Giữ** |
| 05 / 06 identity | Git + leftover + CI map | `.github` · leftover path · `production` branch | **Không đụng** |

**Không** tạo `media-platform-v2` / stub ẩn. **Không** push `production`. **Không** ghi leftover `/var/www/iflux/production` · DB `iflux` · `:3001`.

---

# 2. Inventory gỡ (reviewer tree)

## 2.1 Git / `staging`

- Worktree Owner = `staging`. Remote `github`. Deploy = push `staging` → CI.
- **CẤM** revert/reset cả dải Task 04.
- **CẤM** force-push. **CẤM** đụng branch `production`.
- Commit removal **scoped** (code + down SQL + audit). Không nhét 05/06 docs.

## 2.2 Application code (surgical)

**Trả contract pre-04 (modify existing):**

1. `media.service.js` — xóa block Task 04 (`listImageProfiles*`, `createImageProfile`, `updateImageProfile`, `enqueueGenerate*`, `processQueuedMediaJobs`, `resolveMedia`, `PROFILE_*`, VERIFY→READY). `createAssetFromBuffer` lại ghi 3–4 role sync, `status='active'`. Export chỉ surface pre-04.
2. `media-process.js` — khôi phục `normalizeAndVariants` (delivery WebP + thumb 400 + social JPEG). Xóa `createMaster` / `generateDerivative` / profile spec literals 120/640/960/1200.
3. `media.routes.js` — xóa `/profiles*` và `resolve/:profile`. Giữ upload/import/assets/usages.
4. `media-trigger.worker.js` — xóa `processQueuedMediaJobs`. Giữ vòng import PENDING.
5. `permission-catalog.js` — xóa module `media` (4 key).
6. `iflux-admin-routes.js` — xóa `library-image-profiles`.
7. `admin-rbac-client.js` — xóa regex + `PAGE_PERM` media.
8. `iflux-admin-nav-registry.js` — xóa group/item Library. **Giữ** comment CỔNG URL.

**Xóa file (chỉ Task 04):**

- `Admin_Design_system/app/library/quy-chuan-hinh-anh.html`
- `Admin_Design_system/app/library/quy-chuan-hinh-anh.js`
- `backend/migrations/058_media_image_platform.sql` (thay bằng down — mục 2.3)

**Working tree bẩn (chưa commit) — coi là rác Task 04, không ship:**

- `media-import.service.js` (`profileForLocation` / `resolveMedia`)
- `seo-platform.service.js` (`resolveMedia(..., 'media-og')`)
- `User_Web/.../community-ui.js` (`profileKeyForSurface`)

Phải **discard hunk** này trước hoặc trong cùng removal — không để consumer gọi API đã xóa.

**Không đụng:** `rss-ingest.service.js` (0 sharp) · `043`/`054` · leftover 05 · workflow 06 · comment CỔNG URL.

## 2.3 DB — chỉ `iflux_staging`

Down **mới** (modify-first: một file migrate down, chạy tay trên Staging). Thứ tự:

1. `UPDATE media_jobs` kind platform → `cancelled` (GENERATE/REGENERATE/REBUILD/VERIFY/CLEANUP).
2. `UPDATE media_variants SET profile_version_id = NULL`.
3. `UPDATE media_assets SET master_variant_id = NULL, cleanup_eligible_at = NULL` (cột Task 04).
4. Drop FK `media_jobs.profile_*` · `media_variants.profile_version_id` · `media_assets.master_variant_id`.
5. `DELETE` variant `role IN ('media-compact','media-card','media-hero','media-body','media-og')` — **chỉ** role Task 04; **cấm** xóa `original`/`delivery`/`thumbnail`/`social`.
6. `DROP` `media_image_profile_versions` · `media_image_profiles`.
7. Drop cột Task 04: `media_assets.is_animated` / `limitation` / `cleanup_eligible_at` / `master_variant_id` (nếu không consumer pre-04); `media_variants.profile_version_id`; `media_jobs` asset/profile/attempt/error/started/completed **chỉ khi** chứng minh pre-04 không dùng. Nếu pre-04 `createJob` không có các cột đó — drop. Nếu cột đã bị code cũ đọc — **giữ cột, null, bỏ FK** (ưu tiên không gãy 043).
8. Xóa row `schema_migrations` `058` nếu có.
9. `DELETE FROM admin_permissions WHERE key LIKE 'media.%'` — backup nếu bootstrap chưa chạy.

**CẤM:** `DROP` `media_assets` / `media_variants` / `media_usages` / `media_jobs` / `media_sources` (043).  
**CẤM:** migrate `iflux_production_next` · DB leftover `iflux`.

## 2.4 Permissions

Catalog không còn `media.*` → boot `seedPermissions` xóa key lạ. Verify: `SELECT key FROM admin_permissions WHERE key LIKE 'media.%'` = 0.

## 2.5 Navigation / UI

- Menu **Quản lý Thư viện** / Quy chuẩn **không** còn.
- `/admin/library/image-profiles` và legacy `/admin/thu-vien/quy-chuan-hinh-anh` → **không** serve page Task 04 (404 hoặc next, không 200 HTML Quy chuẩn).
- Label tiếng Việt các menu khác **không** đổi.

## 2.6 Jobs / services Task 04

- Không enqueue GENERATE lúc ingest.
- Worker không claim platform jobs.
- HTTP không còn `/profiles` · `/resolve/:profile`.

## 2.7 Test artifacts + disk Staging

| Artifact | Action |
|---|---|
| Profile `media-p6-probe` / `media-p6-spec` | Xóa cùng bảng registry |
| Job `mjob_mszf*` còn queued/cancelled | Xóa hoặc cancelled + không worker |
| Asset test `mas_mszd*` / `mas_msze*` / `mas_mszer*` (P2–P5) | Xóa **variant role media-*** + file disk tương ứng. **Không** xóa hàng loạt `media_assets` 12k |
| File `*-media-hero@v1.webp` v.v. dưới media root Staging | Xóa theo inventory role Task 04 |
| `/tmp` script test | Đã cấm commit; `rm` nếu còn |

---

# 3. Thứ tự thực hiện

```text
0. Snapshot Staging (git SHA + pg_dump schema media_* + list profile/job test) — chỉ đọc/ghi backlog, không dump Production
1. Discard working-tree consumer Task 04 (import / SEO / community-ui)
2. Surgical code (mục 2.2) + giữ CỔNG URL
3. node --check + grep chết: resolveMedia, createImageProfile, processQueuedMediaJobs, media.profile, quy-chuan-hinh-anh
4. Commit scoped → push github staging → CI (05/06 kênh, không sửa workflow)
5. Down SQL trên iflux_staging (mục 2.3)
6. Dọn disk variant Task 04 (mục 2.7)
7. Smoke (mục 4)
8. Ghi 08_Removal-Audit.md — 05/06 = OUT OF SCOPE — UNCHANGED
```

Không nhảy bước 7 khi bước 3 còn symbol Task 04.

---

# 4. Smoke sau removal (tối thiểu)

**Ý nghĩa:** chứng minh **contract pre-04 còn sống**, và **contract Task 04 đã chết**.  
Không dùng PASS “còn VERIFY→READY” — đó **là** Task 04.

| # | Case | PASS khi |
|---|---|---|
| S1 | RSS ingest | Vẫn fetch + bind; `rss-ingest.service.js` 0 sharp/resize/webp |
| S2 | Admin upload | 201 · variant `original`+`delivery`+`thumbnail` (+`social` nếu cần) · `status=active` · **0** job GENERATE |
| S3 | Admin import | Cùng `createAssetFromBuffer` restored · không `resolveMedia` |
| S4 | Media processing | Sync `normalizeAndVariants` trong request (hoặc cùng tick ingest) — không Registry 5 profile |
| S5 | VERIFY → READY | **Âm:** 0 job kind VERIFY; asset mới **không** đi PROCESSING→VERIFY→READY |
| S6 | `resolveMedia(..., 'media-og')` | **Âm:** hàm/route **không** còn. OG = `resolveSocialCompatibleImage` / variant `social` |
| S7 | Consumer hiện hữu | Bài/cover/SEO không 500; ảnh delivery/social cũ vẫn URL được |

S5/S6 FAIL nếu còn path Task 04 “cho có”.

---

# 5. Definition of Done (removal)

- [ ] Grep application: 0 `createImageProfile` · `resolveMedia` · `processQueuedMediaJobs` · `media.profile.` · `listImageProfilesForAdmin`
- [ ] Không file `quy-chuan-hinh-anh.*` · không entry nav Library
- [ ] Staging DB: 0 bảng `media_image_profile*` · 0 variant role `media-*` · 0 perm `media.*`
- [ ] Disk Staging: 0 file `*-media-{compact,card,hero,body,og}@*`
- [ ] S1–S7 PASS
- [ ] `production` branch / `:3003` / leftover 05 **không** mutation
- [ ] Comment CỔNG URL còn
- [ ] Audit mục 8: 05/06 **OUT OF SCOPE — UNCHANGED**

---

# 6. Cấm

- `git reset --hard` / revert range Task 04
- Push `production` · rsync · sửa leftover `:3001`
- Drop `media_assets` (043)
- Giữ page ẩn / `display:none` / `media-platform-v2`
- Sửa workflow 05/06 “cho deploy dễ”
- Gọi việc giữ `resolveMedia` là “smoke consumer”

---

# 7. Commit / deploy

```text
1 commit code+down SQL (hoặc 2: code rồi down note)
push github staging
CI → Staging only
```

Không GitLab. Không amend đã push.

---

# 8. 05 / 06 — OUT OF SCOPE — UNCHANGED

Bắt buộc có trong `08_Removal-Audit.md` (không rollback hai task này).

| Task | Phạm vi | Removal Task 04 được phép? | Kết luận bắt buộc |
|---|---|---|---|
| `05_180826_Legacy_Rollback_Backup_and_Retirement` | Leftover `:3001` · `/var/www/iflux/production` · `/var/iflux/backend` · `/var/iflux/storage` · DB `iflux` · retire runtime cũ | **Không** đọc/ghi/xóa | **OUT OF SCOPE — UNCHANGED** |
| `06_180826_Git_Environment_Identity_Standardization` | `staging`→`:3002` · `production`→`:3003` · cấm `staging-2` = Production · CI map | Chỉ **dùng** kênh (push `staging`). **Không** đổi workflow, default branch, ruleset | **OUT OF SCOPE — UNCHANGED** |

Evidence audit (sau khi làm): `git diff` không chứa `.github/workflows/deploy-production-new.yml` · leftover path · `05_`/`06_` folders; `git branch` `production` không fast-forward vì removal.

---

# 9. Quyết định Owner trước khi thi công

Plan này **chưa thi công**.

Xác nhận:

1. Gỡ hết platform Task 04 (kể cả `resolveMedia` / VERIFY→READY), trả ingest sync pre-04.
2. Giữ comment CỔNG URL.
3. 05/06 không đụng.
4. Chỉ Staging.

Owner nói **làm** → mới code theo thứ tự mục 3.
