STATUS: `MIGRATION SCHEMA RECONCILIATION HOÀN TẤT (2026-08-12) — Staging = Production 100% structural parity — Phase 4 UNBLOCKED cho bước migration, tiếp tục PM2/nginx`
Phase liên quan: **Phase 4 (Staging Isolation)**
Migration hiện hữu (001-056) không bị sửa. `migration-runner.js` không bị sửa. Production không bị thay đổi.

---

## Execution Log #2 — 054/055/056 trên Staging (2026-08-12, sau audit chi tiết + quyết định Owner)

### Owner decision

| Migration | Quyết định | Lý do |
|---|---|---|
| `053_sectors_vnd_l2_catalog.sql` | ❌ SKIP | Seed 19 ngành — giữ nguyên quyết định defer |
| `054_site_seo_foundation.sql` | ✅ RUN | DDL hợp lệ, Production đã có, Staging thiếu |
| `055_seed_page_seo_baseline.sql` | ✅ RUN (đi cùng 054) | Baseline SEO data, phụ thuộc bảng `page_seo_configs` do 054 tạo |
| `056_community_rss_article_schema_v2.sql` | ⚠️ RUN có kiểm soát | UPDATE có điều kiện, đã audit chính xác tác động (chỉ đổi `name`, giữ `mapping_json`) |

### Audit trước khi chạy (nội dung SQL + trạng thái Staging + tác động dự đoán)

| File | Loại | Trạng thái Staging trước khi chạy | Tác động dự đoán |
|---|---|---|---|
| `054` | DDL | `page_seo_configs`: chưa có. `media_usages`: 0 dòng, còn constraint cũ | Tạo `page_seo_configs`; ALTER `media_usages` (thêm `scope`/`owner_ref`, `article_id` nullable, drop constraint cũ, tạo unique index mới) |
| `055` | DATA (INSERT 19 dòng) | Phụ thuộc `054` | Seed 19 template SEO mặc định theo `page_key` |
| `056` | DATA (UPDATE có điều kiện) | `community_rss_schema.default_article` đã có, `mapping_json` không có key `version` | Điều kiện `mapping_json->>'version' IS NULL` khớp → UPDATE `name` + `updated_at`; **không đụng `mapping_json`** |

Không có `DELETE` trong cả 3 file. Không có xung đột UNIQUE nguy hiểm.

### Execution — one-off controlled procedure (giống cơ chế đã dùng cho 057)

Script Node độc lập, không thuộc repo, đã xoá sau khi dùng — chạy đúng thứ tự `054 → 055 → 056`, mỗi file 1 transaction riêng (BEGIN → SQL → INSERT tracking CHỈ KHI thành công → COMMIT), dừng ngay nếu 1 file lỗi. Không đụng `053`, không sửa `migration-runner.js`, không tự INSERT tracking giả cho bất kỳ file nào.

```text
$ node apply-054-055-056-oneoff.js
APPLIED: 054_site_seo_foundation.sql
APPLIED: 055_seed_page_seo_baseline.sql
APPLIED: 056_community_rss_article_schema_v2.sql
Done. 053_sectors_vnd_l2_catalog.sql was NOT touched (Owner decision: defer seed).
```

### Verify sau khi chạy (7 điểm Owner yêu cầu)

| # | Kiểm tra | Kết quả |
|---|---|---|
| 1 | `page_seo_configs` tồn tại, schema khớp Production | ✅ |
| 2 | `media_usages` khớp Production (constraint/index/nullable) | ✅ constraint cũ đã drop, unique index mới + index mới đúng, `article_id` nullable |
| 3 | `page_seo_configs` có baseline data đúng kỳ vọng | ✅ 19 dòng (`dashboard`, `market`, `community`, `flow`, `sectors`, `ecosystems`, ...) |
| 4 | `community_rss_schema.default_article.name` update đúng | ✅ `"Schema bài viết Cộng đồng (community_posts)"`, `mapping_json` giữ nguyên `{"body":"content","title":"title"}` |
| 5 | `schema_migrations` phản ánh đúng migration thực chạy | ✅ id 54/55/56 = đúng 3 file, đúng timestamp |
| 6 | `053` không xuất hiện như vừa được apply | ✅ chỉ `053_market_time_sot_interval_check.sql` (applied từ trước), `053_sectors_vnd_l2_catalog.sql` vẫn không tracking |
| 7 | `057` vẫn chỉ có 1 record tracking | ✅ |

### Full schema diff cuối cùng — Production vs Staging

```text
Object inventory : Production 461 / Staging 461 — 0 khác biệt cả 2 chiều
Column-level     : 100/100 bảng khớp hoàn toàn — 0 bảng lệch cột
```

**KẾT LUẬN: `iflux_staging` đạt structural parity 100% với Production** (schema — không tính data, vì `053` bị skip có chủ đích nên `sectors`/`ecosystems` thiếu phần data enrichment, nhưng đây là data, không phải schema).

---

## Execution Log — 057 trên Staging (2026-08-12, sau khi có lệnh Owner)

### Vấn đề phát hiện trước khi chạy (đúng như Owner lường trước)

Đọc trực tiếp `backend/src/core/database/migration-runner.js`:

```js
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
const pending = files.filter(f => !applied.has(f));
for (const file of pending) { await applyMigration(file, sql); }  // lỗi 1 file = dừng cả loop
```

Sort theo **tên file alphabet**, không theo thời điểm tạo. `053_sectors_vnd_l2_catalog.sql` < `057_...sql`. Query trực tiếp `schema_migrations` thật trên `iflux_staging` xác nhận: 52 dòng, dừng tại `053_market_time_sot_interval_check.sql`; `053_sectors_vnd_l2_catalog.sql` **KHÔNG** được tracking.

→ Đúng nhánh quyết định của Owner: *"053 không được tracking nhưng runner sẽ replay nó → không chạy `npm run migrate`."* **Không chạy `npm run migrate` trực tiếp.**

`migration-runner.js` không có cơ chế target 1 file cụ thể, và không export `applyMigration` để tái dùng trực tiếp.

### Giải pháp đã dùng: one-off controlled procedure (không sửa runner, không tự INSERT tracking trước khi DDL chạy)

Viết 1 script Node độc lập (`/tmp/apply-057-oneoff.js`, **không thuộc repo, không commit, đã xoá sau khi dùng**), tái tạo **đúng transaction semantics** của `applyMigration()` thật trong runner:

```text
ensureMigrationsTable() (idempotent, giống ensureMigrationsTable() thật)
  → kiểm tra chưa applied
  → BEGIN
  → chạy SQL của ĐÚNG 1 file 057
  → INSERT schema_migrations CHỈ KHI SQL thành công
  → COMMIT (lỗi thì ROLLBACK, không tracking)
```

Không đụng `053_sectors_vnd_l2_catalog.sql`, không đụng `054/055/056`, không sửa `migration-runner.js`.

### Kết quả thực thi

```text
$ node apply-057-oneoff.js
APPLIED: 057_sectors_ecosystems_taxonomy_columns_reconciliation.sql
exit code: 0
```

### Verify sau khi chạy

| Kiểm tra | Kết quả |
|---|---|
| `schema_migrations` có tracking row cho `057` | ✅ id=53, `applied_at=2026-08-12 17:47:37` |
| `053_sectors_vnd_l2_catalog.sql` vẫn KHÔNG tracking | ✅ `COUNT(*) = 0` — không seed, đúng quyết định Owner |
| `sectors` có đủ 5 cột + 3 object phụ thuộc | ✅ `slug`, `description`, `display_order`, `icon_media_id`, `deleted_at` + `sectors_slug_key` + `sectors_icon_media_id_fkey` + `idx_sectors_deleted_display` |
| `ecosystems` có đủ 5 cột + 3 object phụ thuộc | ✅ tương tự |
| `sectors` — dữ liệu | 19 dòng (có sẵn từ migration `027` đã applied trước đó) — `slug`=0/19, `display_order≠0`=0/19 → **không bị enrich bởi seed 053** (đúng quyết định) |
| `ecosystems` — dữ liệu | 23 dòng, `slug`=0/23 → tương tự |
| Diff schema Production vs Staging (post-057), riêng `sectors`/`ecosystems` | **0 khác biệt** — cột khớp 100% cả 2 bảng |
| Diff toàn schema Production vs Staging (post-057), phần còn lại | Còn khác ở `page_seo_configs` (Production có, Staging chưa) + `media_usages` 1 constraint/2 index — **xác nhận nguyên nhân: do `054_site_seo_foundation.sql` chưa áp lên Staging (ngoài phạm vi lệnh lần này), không phải drift mới** |

**Kết luận: Migration `057` PASS đúng phạm vi được Owner cho phép. `sectors`/`ecosystems` hết structural drift so với Production. Không có side-effect ngoài dự kiến (không đụng migration nào khác, không seed data).**

---

## Owner Decision (2026-08-12)

| # | Quyết định | Trạng thái |
|---|---|---|
| 1 | Migration reconciliation cho `sectors`/`ecosystems` | **Approved to prepare** |
| 2 | Tạo file migration mới, **KHÔNG CHẠY** ở bước này | **Đã tạo** — [`backend/migrations/057_sectors_ecosystems_taxonomy_columns_reconciliation.sql`](../../backend/migrations/057_sectors_ecosystems_taxonomy_columns_reconciliation.sql) — chờ Owner review nội dung trước khi chạy trên Staging/Production |
| 3 | Seed 19 ngành (`053_sectors_vnd_l2_catalog.sql`) | **Deferred** — không trộn vào `057`, không chạy trên Staging ở phase này |
| 4 | `schema_migrations` 16/56 | **Deferred / technical debt riêng**, không xử lý trong Phase 4 |

**File `057` — nội dung đúng theo §5.4 đã đề xuất, không thêm gì khác:**
- Chỉ 2 bảng: `sectors`, `ecosystems`.
- Chỉ 5 cột + 3 object phụ thuộc mỗi bảng (đúng danh sách mục 2.1).
- Idempotent (`ADD COLUMN IF NOT EXISTS`, guard `pg_constraint` trước khi `ADD CONSTRAINT`, `CREATE INDEX IF NOT EXISTS`) — an toàn chạy trên cả Production (no-op vì đã có) và Staging (tạo mới).
- Không seed data, không đụng file `053_sectors_vnd_l2_catalog.sql`, không thêm cột/tính năng nào ngoài phạm vi đã audit.
- **CHƯA CHẠY** trên `iflux_staging` hoặc Production — Cursor không tự ý chạy `npm run migrate` cho đến khi Owner review xong nội dung file.

---

## Phát hiện bổ sung (ngoài phạm vi yêu cầu, chỉ báo cáo — chưa xử lý)

Khi soạn `057`, kiểm tra chéo repo local với Production phát hiện: **repo local có 59 file migration `.sql`, Production chỉ có 56 file.** 3 file tồn tại ở local nhưng chưa từng có trên Production:

| File local | Loại | Nội dung |
|---|---|---|
| `041_legacy_referral_code_normalize.sql` | DATA (1 UPDATE, có guard `WHERE email=...`) | Sửa `referral_code` cho 1 user cụ thể (`minh@iflux.vn`) từ `MINH10` → `IFLMVN10` |
| `042_affiliate_referral_notification_template.sql` | DATA (UPDATE) | Cập nhật nội dung template thông báo `AFFILIATE_REFERRAL_SUCCESS` |
| `056_seed_page_seo_pricing.sql` | DATA (INSERT/UPSERT) | Seed `page_seo_configs` cho page `pricing` (liên quan task SEO Metadata Management, "Owner request 2026-08-10") |

**Đã kiểm tra: cả 3 file đều là DATA (UPDATE/INSERT), không có DDL nào, không đụng `sectors`/`ecosystems`.** → Không ảnh hưởng đến kết luận structural drift ở audit này. Trước đây audit gán "041, 042 missing" là *gap số thứ tự* — thực ra chính xác hơn là **local có, Production không có 3 file này** (khác gap thuần số thứ tự). Không tự sửa gì ở đây — ghi nhận để Owner biết, xử lý ở task/quyết định riêng (có thể liên quan trực tiếp tới Phase 1 Reconciliation Inventory của chính task Git Deployment này, vì `backend/migrations/` chưa được audit riêng ở `08`).

---

# 0. Method (Audit-only, không đụng Production/migration files)

```text
1. pg_dump --schema-only Production DB `iflux`                → production_schema.sql (4.515 dòng)
2. Dump schema hiện tại của iflux_staging (đã ở post-migration-52) → staging_post52.sql
3. Tạo DB tạm dùng 1 lần: iflux_schema_audit_scratch (disposable, không phải iflux_staging chính thức)
4. Restore staging_post52.sql vào scratch → scratch ở đúng trạng thái post-52
5. Áp lần lượt 5 file migration còn lại (053×2, 054, 055, 056) trực tiếp bằng psql vào scratch
   → ghi nhận chính xác file nào lỗi, dòng nào, lỗi gì — KHÔNG sửa file, KHÔNG bỏ qua câu lệnh lỗi
6. pg_dump --schema-only scratch (sau khi áp hết những gì áp được) → scratch_full_replay.sql
7. Diff production_schema.sql vs scratch_full_replay.sql ở 3 mức:
   a. Object inventory (mọi Type: TABLE/INDEX/CONSTRAINT/FK/TRIGGER/FUNCTION/SEQUENCE/EXTENSION)
   b. Column-level theo từng bảng (tên cột) cho toàn bộ 100 bảng
   c. Định nghĩa cột (type/default/nullable) cho các cột trùng tên
8. Drop scratch DB — không giữ lại bất kỳ artifact nào ngoài file dump trong /tmp (audit evidence)
```

`iflux_staging` (DB chính thức cho Staging, đang tạo ở Phase 4) **không bị đụng thêm** trong audit này — mọi phép thử "áp migration tiếp" được làm trên bản sao dùng 1 lần rồi xoá.

---

# 1. Kết quả tổng hợp — CHỈ có 1 điểm drift thật, lặp trên 2 bảng

```text
Production tables : 100
Migration tables  : 100
Table lệch        : 0

Trigger  Production=1  / Migration=1   → khớp
Function Production=1  / Migration=1   → khớp
Sequence Production=24 / Migration=24  → khớp
Extension Production=2 (pgcrypto, plpgsql) / Migration=2 → khớp
View     Production=0  / Migration=0   → khớp

Cột trùng tên nhưng type/default/nullable khác nhau: 0
```

→ **Không có discrepancy "ẩn"** nằm rải rác toàn schema. Toàn bộ drift tập trung **chính xác vào 2 bảng: `sectors` và `ecosystems`**.

---

# 2. Danh sách discrepancy đầy đủ (6 object)

## 2.1 — Production có, migration KHÔNG có (nhóm B)

| # | Bảng | Object | Loại | Định nghĩa (Production) |
|---|------|--------|------|--------------------------|
| 1 | `sectors` | `slug` | COLUMN | `character varying(100)` |
| 2 | `sectors` | `description` | COLUMN | `text` |
| 3 | `sectors` | `display_order` | COLUMN | `integer DEFAULT 0 NOT NULL` |
| 4 | `sectors` | `icon_media_id` | COLUMN | `text` |
| 5 | `sectors` | `deleted_at` | COLUMN | `timestamp with time zone` |
| 6 | `sectors` | `sectors_slug_key` | CONSTRAINT (UNIQUE) | `UNIQUE (slug)` |
| 7 | `sectors` | `sectors_icon_media_id_fkey` | FK CONSTRAINT | `FOREIGN KEY (icon_media_id) REFERENCES media_assets(id) ON DELETE SET NULL` |
| 8 | `sectors` | `idx_sectors_deleted_display` | INDEX | `btree (deleted_at, display_order, name_vi)` |
| 9 | `ecosystems` | `slug` | COLUMN | `character varying(100)` |
| 10 | `ecosystems` | `description` | COLUMN | `text` |
| 11 | `ecosystems` | `display_order` | COLUMN | `integer DEFAULT 0 NOT NULL` |
| 12 | `ecosystems` | `icon_media_id` | COLUMN | `text` |
| 13 | `ecosystems` | `deleted_at` | COLUMN | `timestamp with time zone` |
| 14 | `ecosystems` | `ecosystems_slug_key` | CONSTRAINT (UNIQUE) | `UNIQUE (slug)` |
| 15 | `ecosystems` | `ecosystems_icon_media_id_fkey` | FK CONSTRAINT | `FOREIGN KEY (icon_media_id) REFERENCES media_assets(id) ON DELETE SET NULL` |
| 16 | `ecosystems` | `idx_ecosystems_deleted_display` | INDEX | `btree (deleted_at, display_order, name_vi)` |

Quy về object độc lập (không tính trùng cột thuộc cùng 1 ALTER): **10 cột + 4 constraint/FK + 2 index = 16 dòng, nhưng thực chất là đúng 2 pattern giống nhau lặp trên 2 bảng.**

Không tìm thấy migration file nào (kể cả file lỗi) có câu lệnh `ALTER TABLE sectors/ecosystems ADD COLUMN slug/description/display_order/icon_media_id/deleted_at`. Các cột này được thêm vào Production **ngoài migration system** (thao tác trực tiếp không qua file `.sql` nào trong `backend/migrations/`).

## 2.2 — Migration có, Production KHÔNG có (nhóm C)

```text
KHÔNG có. (comm -13 rỗng — không có object nào migration tạo ra mà Production thiếu)
```

## 2.3 — Index/constraint/trigger/function/extension khác nhau ngoài mục 2.1 (nhóm D)

```text
KHÔNG có thêm. Trigger/Function/Sequence/Extension khớp 100% số lượng và định nghĩa.
```

## 2.4 — Migration replay sai / thứ tự sai (nhóm A)

| File | Vấn đề | Phân loại |
|------|--------|-----------|
| `053_sectors_vnd_l2_catalog.sql` | `INSERT INTO sectors (..., display_order, ...)` — thất bại vì cột `display_order` không tồn tại khi migration này chạy theo thứ tự file. Đây **không phải lỗi thứ tự chạy** (migration runner chạy đúng thứ tự alphabet: `053_market_time_sot_interval_check.sql` trước, `053_sectors_vnd_l2_catalog.sql` sau) — mà là **thiếu 1 migration tiền đề** (`ALTER TABLE sectors ADD COLUMN display_order ...`) chưa từng được viết ra. | Root cause = mục 2.1 (thiếu cột), triệu chứng = lỗi replay |

Không phát hiện thêm lỗi replay nào khác. `053_market_time_sot_interval_check.sql`, `054_site_seo_foundation.sql`, `055_seed_page_seo_baseline.sql`, `056_community_rss_article_schema_v2.sql` đều áp thành công vào scratch không lỗi.

## 2.5 — Dữ liệu (không thuộc phạm vi schema-only)

`053_sectors_vnd_l2_catalog.sql` **thực chất là 1 file DATA SEED** (không có DDL nào — chỉ có 1 câu `INSERT ... ON CONFLICT DO UPDATE` nạp tên tiếng Việt + `display_order` cho 19 ngành). Theo nguyên tắc đã chốt ("dữ liệu không thuộc phạm vi schema-only thì không copy"), **row data của file này không thuộc phạm vi reconciliation Staging** — Staging không cần và không nên nhận 19 dòng data thật này qua migration nếu Staging chỉ cần schema. Vấn đề duy nhất liên quan đến file này là nó **không tự chạy được** do thiếu cột — không phải vấn đề "có nên copy data hay không".

---

# 3. Mức độ ảnh hưởng — 2 cột dùng thật, 3 cột chưa dùng

Query trực tiếp trên Production:

| Bảng | Tổng dòng | `slug` có giá trị | `display_order` ≠ 0 | `icon_media_id` có giá trị | `deleted_at` có giá trị |
|------|-----------|--------------------|----------------------|------------------------------|---------------------------|
| `sectors` | 19 | 19/19 (100%) | 19/19 (100%) | 0/19 (0%) | 0/19 (0%) |
| `ecosystems` | 23 | 23/23 (100%) | 0/23 (0%) | 0/23 (0%) | 0/23 (0%) |

**`description` không truy vấn riêng (text, không đo "mức dùng" theo % dễ như trên) nhưng cùng nhóm cột được thêm chung 1 lần với `slug`.**

Kiểm tra source code backend (`src/modules/**`) xác nhận các module sau **đang tham chiếu trực tiếp** `slug` / `display_order` / `icon_media_id` của `sectors`/`ecosystems`:

```text
media/media-import.service.js
seo-platform/seo-platform.service.js
community/rss-ingest.service.js
community/community-feed.service.js
community/community-article-schema-fields.js
community/community.routes.js
community/community-entity-resolve.service.js
community/community-articles.service.js
market/market-wave-f.service.js
market/sectors-admin.service.js       (riêng sectors)
market/ecosystems-admin.service.js    (riêng ecosystems)
market/market-master.service.js
market/market-mdm.service.js
```

**Kết luận:** đây không phải cột "rác"/dead schema. `slug` (100% dùng cả 2 bảng) và `sectors.display_order` (100% dùng) là **cột đang phục vụ tính năng thật đang chạy trên Production** (routing theo slug, sắp xếp hiển thị ngành). `icon_media_id`, `deleted_at`, `ecosystems.display_order`, `description` hiện là **scaffolding chưa được dùng** (toàn NULL/0) nhưng đã có trong contract của code (FK, soft-delete pattern).

---

# 4. Vấn đề tách biệt: `schema_migrations` tracking không đầy đủ (không phải structural drift)

Production `schema_migrations` chỉ có **16 dòng**, trong khi có **56 file `.sql`** trong `backend/migrations/`:

```text
015, 016, 017, 018, 019, 020, 021, 022, 023, 024,
037_notification_platform_templates, 038,
043, 045, 046, 052
```

Các file **025–036, 039–042(*), 044, 047–051, 053–056** không xuất hiện trong bảng tracking — **nhưng schema của toàn bộ 98/100 bảng khác (ngoài sectors/ecosystems) khớp 100% với migration replay**, tức là các file này **đã thực sự được áp dụng** vào Production (nếu không áp, các bảng/cột do chúng tạo ra sẽ không tồn tại trên Production, và ta đã chứng minh 0 object migration-only bị thiếu trên Production ở mục 2.2/2.3).

(*) 041, 042 không tồn tại file — đây là gap số thứ tự, không phải file bị mất.

**Đây là 2 vấn đề khác nhau, không nên gộp:**

```text
(A) STRUCTURAL DRIFT (blocking Staging)
    → sectors/ecosystems thiếu 5 cột + 3 object phụ thuộc
    → nguyên nhân: có ai/lúc nào đó ALTER TABLE trực tiếp, KHÔNG qua file migration nào cả
    → hệ quả: migrate.js không tái tạo được structure này trên DB mới

(B) TRACKING DEBT (không blocking Staging structural correctness)
    → schema_migrations trên Production chỉ ghi 16/56
    → hệ quả: KHÔNG thể tin schema_migrations Production để biết "đã chạy gì" —
      nhưng KHÔNG ảnh hưởng khả năng tái tạo schema từ file (đã verify 52 file đầu chạy sạch, khớp Production)
    → đây là governance/audit-trail gap, không phải correctness gap
```

Ngoài ra ghi nhận thêm 1 điểm hygiene nhỏ (không phải drift): trong `backend/migrations/` có 4 file không phải `.sql` (`notification-platform-seed-data.js`, `preference.service.js`, `seed-notification-platform-types.js`, `template.service.js`) — helper code cho migration 037-039, nằm lẫn trong thư mục migration. Không gây lỗi (migrate.js chỉ chạy `.sql`), chỉ là tổ chức thư mục chưa sạch.

---

# 5. Trả lời đúng 4 câu hỏi Owner yêu cầu

## 5.1 — Tổng số discrepancy

```text
Structural discrepancy thật (Production có, migration không có): 2 pattern × lặp trên 2 bảng
  = 5 cột × 2 bảng = 10 cột
  + 3 object phụ thuộc (UNIQUE, FK, INDEX) × 2 bảng = 6 object
  → Tổng 16 dòng khác biệt, nhưng chỉ 2 PATTERN GỐC (không phải 16 vấn đề độc lập)

Governance debt (không phải structural):
  - schema_migrations chỉ ghi 16/56 (thiếu tracking, không thiếu structure)
  - 037 và 053 trùng số thứ tự file (2 cặp)
  - thiếu số thứ tự 041, 042 (gap, không phải mất file)
  - 4 file non-SQL nằm trong thư mục migrations (hygiene)

Object migration có nhưng Production không có: 0
Cột trùng tên nhưng định nghĩa khác nhau (type/default): 0
Trigger/Function/Sequence/Extension/View lệch: 0
```

## 5.2 — Discrepancy nào BẮT BUỘC để Staging chạy đúng

```text
BẮT BUỘC (blocking, có evidence code đang dùng thật):
  sectors.slug              — dùng 100%, nhiều module tham chiếu
  sectors.display_order     — dùng 100%, sectors-admin.service.js
  sectors.sectors_slug_key  — UNIQUE cần cho lookup theo slug không trùng
  ecosystems.slug              — dùng 100%, nhiều module tham chiếu
  ecosystems.ecosystems_slug_key — UNIQUE cần cho lookup theo slug

NÊN CÓ (chưa có evidence dùng thật nhưng code đã viết theo contract này —
nếu thiếu, các endpoint Admin liên quan icon/soft-delete sẽ lỗi ngay khi được gọi,
dù hiện tại Production chưa exercise path đó):
  sectors.description, sectors.icon_media_id, sectors.deleted_at,
  sectors.sectors_icon_media_id_fkey, sectors.idx_sectors_deleted_display
  ecosystems.display_order, ecosystems.description, ecosystems.icon_media_id,
  ecosystems.deleted_at, ecosystems.ecosystems_icon_media_id_fkey,
  ecosystems.idx_ecosystems_deleted_display

Lý do không tách "bắt buộc" và "nên có" thành 2 mức xử lý khác nhau về mặt kỹ thuật:
cả 2 nhóm đều thuộc CÙNG 1 ALTER TABLE thực tế trên Production (cùng lúc thêm 5 cột/bảng).
Không có evidence migration nào tách riêng "phần dùng" khỏi "phần chưa dùng" — tách xử lý
sẽ tạo ra 1 schema lai không khớp Production ở cả 2 nơi. Khuyến nghị xử lý NGUYÊN VẸN cả 5 cột/bảng.
```

## 5.3 — Discrepancy nào là MIGRATION DEBT (không block, chỉ là nợ kỹ thuật)

```text
- schema_migrations Production chỉ ghi 16/56 dòng → không tái tạo được "lịch sử chạy migration"
  chính xác cho Production, nhưng KHÔNG cản việc Staging chạy đúng (Staging sẽ có tracking đầy đủ
  từ đầu vì migrate.js ghi log mỗi lần chạy trên DB mới).
- Trùng số thứ tự 037×2, 053×2; gap 041/042 → không gây lỗi thực thi (migrate.js sort theo tên file,
  không dựa vào số phải liên tục), chỉ là vấn đề đặt tên/quy ước, nên dọn khi có migration reconciliation
  nhưng không urgent.
- 4 file `.js` nằm trong `backend/migrations/` → hygiene, không phải drift.
- File `053_sectors_vnd_l2_catalog.sql` (data seed 19 ngành) không tự chạy được → sau khi có cột,
  Owner cần quyết định: chạy seed này trên Staging hay không (vì đây là DATA, không phải structure —
  không mặc định chạy nếu chính sách là "không clone data thật lên Staging").
```

## 5.4 — Đề xuất migration baseline/reconciliation TỐI THIỂU (chỉ đề xuất, CHƯA tạo file)

Phạm vi tối thiểu chỉ để giải quyết đúng 2 pattern blocking, không đụng gì khác:

```text
Migration mới (ví dụ số 057, để không đụng 001-056 hiện hữu):
  057_sectors_ecosystems_taxonomy_columns_reconciliation.sql

  ALTER TABLE sectors
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS icon_media_id TEXT,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  ALTER TABLE sectors ADD CONSTRAINT sectors_slug_key UNIQUE (slug);
  ALTER TABLE sectors ADD CONSTRAINT sectors_icon_media_id_fkey
    FOREIGN KEY (icon_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;
  CREATE INDEX idx_sectors_deleted_display ON sectors (deleted_at, display_order, name_vi);

  ALTER TABLE ecosystems
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS icon_media_id TEXT,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  ALTER TABLE ecosystems ADD CONSTRAINT ecosystems_slug_key UNIQUE (slug);
  ALTER TABLE ecosystems ADD CONSTRAINT ecosystems_icon_media_id_fkey
    FOREIGN KEY (icon_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;
  CREATE INDEX idx_ecosystems_deleted_display ON ecosystems (deleted_at, display_order, name_vi);
```

Sau khi migration này chạy được (Staging và về sau bất kỳ DB mới nào), thì:
- `053_sectors_vnd_l2_catalog.sql` sẽ tự chạy được về mặt cấu trúc (còn chạy hay không trên Staging là quyết định chính sách data, không phải blocker kỹ thuật nữa).
- `IF NOT EXISTS` / kiểm tra constraint trùng tên là để migration này **an toàn khi chạy lại trên Production** (idempotent) — vì Production đã có sẵn các cột/constraint này, migration sẽ no-op trên Production, không phá gì.

**Đây chỉ là đề xuất, KHÔNG được tạo file — chờ Owner quyết định trước khi viết migration thật.**

---

# 6. Trạng thái Phase 4

```text
Phase 4 — Staging Isolation
  Linux users (iflux-app, iflux-deploy)      ✅ DONE
  PostgreSQL DB iflux_staging + role riêng   ✅ DONE (đang ở post-migration-52)
  Storage /var/iflux/storage-staging          ✅ DONE
  ecosystem.staging.config.js                 ✅ DONE (đã soạn, chưa deploy PM2)
  Migration đầy đủ 001→056                    ❌ BLOCKED — chờ Owner quyết định §5.4
  PM2 iflux-api-staging                        ⏸ chưa làm (chờ migration xong)
  Nginx staging trỏ port riêng                 ⏸ chưa làm
  Verify Staging hoạt động, cách ly Production ⏸ chưa làm

STATUS: BLOCKED tại Migration/Schema Reconciliation — như Owner đã chỉ định.
```

---

# 7. Việc KHÔNG làm trong audit này (đúng yêu cầu)

```text
✅ Không tạo migration mới trong backend/migrations/
✅ Không sửa file migration hiện hữu
✅ Không đổi bất kỳ gì trên Production (chỉ pg_dump --schema-only, read-only)
✅ Không copy dữ liệu thật (chỉ dùng --schema-only, không --data)
✅ Mọi thử nghiệm "áp migration tiếp" chỉ chạy trên DB tạm dùng 1 lần rồi xoá (iflux_schema_audit_scratch)
✅ iflux_staging (DB chính thức) giữ nguyên trạng thái post-52 như trước audit
```

---

# 8. Chờ Owner quyết định (ĐÃ CHỐT — xem "Owner Decision" ở đầu file)

1. ~~Có đồng ý với đề xuất migration reconciliation tối thiểu ở §5.4~~ → **Approved to prepare.**
2. ~~Tạo (chưa chạy) file migration `057_...sql`~~ → **Đã tạo, chưa chạy.** Chờ Owner review nội dung file trước khi cho phép chạy trên Staging.
3. ~~Seed 19 ngành~~ → **Deferred.**
4. ~~`schema_migrations` tracking~~ → **Deferred / technical debt riêng.**

## Bước tiếp theo (chờ lệnh Owner)

```text
Owner review nội dung backend/migrations/057_sectors_ecosystems_taxonomy_columns_reconciliation.sql
        ↓
   Owner APPROVE nội dung
        ↓
   Cursor chạy `npm run migrate` TRÊN iflux_staging (KHÔNG chạy Production ở bước này —
   Production đã có structure này rồi, migration sẽ no-op nhưng vẫn cần Owner xác nhận
   thời điểm/việc chạy trên Production riêng, không tự động kèm theo bước Staging)
        ↓
   Verify schema iflux_staging == Production (pg_dump --schema-only lại, diff = 0)
        ↓
   Tiếp tục Phase 4: PM2 iflux-api-staging, nginx staging, dual verification
```

**Phase 4 giữ nguyên BLOCKED cho đến khi Owner approve nội dung `057` và ra lệnh chạy trên Staging.**
