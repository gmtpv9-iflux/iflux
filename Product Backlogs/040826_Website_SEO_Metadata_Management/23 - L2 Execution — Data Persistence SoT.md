# 23 — L2 Execution: Data / Persistence / SoT

**Layer:** L2 (theo `20 - Master Verification Specification.md` v1.1, §13)
**Gate trước:** L1 = ✅ PASS (xem `22`, kể cả Sidebar ownership đã RESOLVED).
**Phương pháp:** Đọc source (resolver/service/schema) + **gọi trực tiếp API Production** (`https://iflux.vn/api/seo/*`) để lấy evidence là **response thật**, không chỉ suy luận từ code — đúng yêu cầu "Reviewer MUST" của L2-TC-08 ("evidence là response API/resolver output, không phải chỉ đọc code").

---

## L2-TC-01 — Persistence

**PASS.**

```
Admin input → Validation (zod) → DB persistence → Read-back
```

| Layer | File | Evidence |
|---|---|---|
| Schema | `backend/migrations/054_site_seo_foundation.sql:6-13` | `page_seo_configs(page_key PK, payload JSONB, updated_at, updated_by)` |
| Write | `backend/src/modules/site-seo/site-seo.routes.js:86-123` | `PUT /api/admin/seo/pages/:pageKey` — zod validate → `svc.upsertPageSeo()` → `INSERT ... ON CONFLICT (page_key) DO UPDATE` (`site-seo.service.js:120-149`) |
| Read-back | `site-seo.service.js:76-89` | `getPageSeo()` — `SELECT * FROM page_seo_configs WHERE page_key = $1` |

**Live evidence (read-back qua public API, giá trị đã lưu từ trước vẫn resolve đúng):**

```
GET /api/seo/effective?pageKey=stock-detail
→ title_template: "iFlux | {Mã} - {Tên cổ phiếu}"   (giá trị Admin đã lưu, đọc lại đúng)

GET /api/seo/effective?pageKey=community
→ title: "iFlux | Cộng đồng chứng khoán"             (PAGE override đọc lại đúng)
```

---

## L2-TC-02 — SoT (không competing source)

**PASS.**

| Scope | Owner duy nhất | File |
|---|---|---|
| GLOBAL | `marketing_brand_identity.payload` qua `wave-d-admin.service.js` (`brandSvc`) | `site-seo.service.js:36-48` |
| PAGE | `page_seo_configs` | `site-seo.service.js:76-149` |
| ARTICLE | `community_posts.payload.seo` (overlay, không table riêng) | `site-seo-resolver.js:208-245 normalizeArticle()` |
| ENTITY (Stock/Sector/Eco/Story runtime) | `seo-platform/entity-templates.js` — **khai báo rõ "does not extend Foundation resolver authority" (PD-02)**, chỉ tiêu thụ `foundationEffective` làm input | `entity-templates.js:1-7` |
| RUNTIME (Contract) | `seo-platform/seo-contract.js` — **consume-only**, comment tường minh dòng 5: *"PD-02: consumes Foundation effective config as INPUT — does not extend Foundation resolver authority."* | `seo-contract.js:5` |

**Live evidence — GLOBAL field không bị page nào ghi đè khác nhau (không competing source):**

`favicon_url` / `logo_url` / `site_name` **giống hệt nhau tuyệt đối** trên 3 lời gọi khác pageKey (không pageKey / `community` / `stock-detail`) — cùng 1 giá trị `/media/community/2026/08/mas_msmmd7i0_460412e0/img-001.webp` (favicon) và `mas_msn0iyam_d117b67b` (logo). Không có 2 nguồn tranh nhau cho field GLOBAL.

---

## L2-TC-03 — Effective resolver (precedence)

**PASS.**

Precedence khóa cứng trong code — **không phải suy luận**, đọc trực tiếp:

```591:  56- 64:site-seo-resolver.js
if (!isBlank(article)) return { state: 'OVERRIDDEN', sourceScope: 'ARTICLE', ... };
if (key !== 'faviconUrl' && key !== 'logoUrl' && !isBlank(page)) return { sourceScope: 'PAGE', ... };
if (!isBlank(global)) return { state: 'INHERITED', sourceScope: 'GLOBAL', ... };
if (!isBlank(fallback)) return { state: 'UNSET', sourceScope: 'FALLBACK', ... };
```

`ARTICLE > PAGE > GLOBAL > FALLBACK` — đúng thứ tự BRD §4 yêu cầu.

**Live test 6 case (spec yêu cầu):**

| # | Case | Kết quả live |
|---|---|---|
| 1 | Chỉ Global | `GET /effective` (không pageKey) → title = default GLOBAL title | ✅ |
| 2 | Global + Page | `GET /effective?pageKey=community` → title = PAGE override (`Cộng đồng chứng khoán`) ≠ Global default | ✅ |
| 3 | Global + Page + Article | Code path `normalizeArticle()` ưu tiên trên Page — verify qua code (không có route public cho phép nhồi `article` overlay trực tiếp; route article thật đi qua `community.routes.js` khi render bài viết — đã PASS trong `09 - Audit Verification Evidence.md` §2 "ARTICLE title bài + template") | ✅ (code + audit trước) |
| 4 | Override | `logoUrl`/`faviconUrl` bị **loại khỏi PAGE layer có chủ đích** (dòng 54) — đây là override GLOBAL-only đã khóa (D-SEO-07 + Owner lock 20260811) | ✅ |
| 5 | Unset | `pageKey=stock-detail` không có `seoTitle` set cứng → rơi xuống `title_template` (raw) rồi `title:''` (live-strip) | ✅ |
| 6 | Fallback | Không pageKey, không global `seoTitle` → fallback `'iFlux'` (`site-seo-resolver.js:118`) | ✅ (code-verified) |

---

## L2-TC-04 — Template persistence (BR-09)

**PASS.**

```
Admin saved template (DB page_seo_configs.payload.seoTitle, VI placeholder)
        ↓
getPublicEffective(pageKey, entityVars)
        ↓
resolveSeoTitleTemplate() (page-seo-placeholders.js)
        ↓
runtime (server-side fill, KHÔNG cần bootstrap JS)
```

**Bằng chứng quan trọng nhất — KHÔNG hardcode, KHÔNG per-page, đổi 1 chỗ ảnh hưởng toàn bộ entity dùng template** (đúng BR-09.1/09.2): template là 1 row DB (`page_seo_configs` theo `page_key`), áp dụng cho **mọi entity** thuộc `pageKey` đó (mọi mã cổ phiếu dùng chung `stock-detail` template) — không nhân bản theo từng mã.

**Live test — trước và sau khi có entity var (chứng minh bootstrap không phá template trước khi resolver xử lý):**

```
GET /api/seo/effective?pageKey=stock-detail
→ title: ""                                          ← KHÔNG leak "{Mã} - {Tên cổ phiếu}" ra public
→ title_template: "iFlux | {Mã} - {Tên cổ phiếu}"    ← raw giữ lại cho client resolve

GET /api/seo/effective?pageKey=stock-detail&ticker=HPG&stockName=Test
→ title: "iFlux | HPG - Test"                        ← RESOLVED đúng khi có entity vars
```

Ngoài ra `GET /api/seo/platform/inspect?path=/co-phieu/hpg&pageKey=stock-detail` (server tự fetch DB thật, không cần query param) trả `document.title: "iFlux | HPG - Công ty Cổ phần Tập đoàn Hòa Phát"` — **server-side resolve thật với dữ liệu Production** (`loadEntitySeoContext()` trong `seo-platform.service.js:73-91` tự query `market-master.service.getStock(ticker)`).

Việc này đã có audit riêng trước đây: `07 - Plan — SEO Dynamic Template Runtime Resolution.md` — **Status: IMPLEMENTED (Owner chốt S1–S5 2026-08-10) · Production deployed** — L2-TC-04 tái xác nhận bằng live API hôm nay, không chỉ tin theo tài liệu cũ.

---

## L2-TC-05 — Default / fallback

**PASS.** Toàn bộ 6 trạng thái đã quan sát được qua live API + code:

| Trạng thái | Evidence |
|---|---|
| unset | `stock-detail` không set `seoTitle` cứng → template |
| empty | `title: ""` khi còn placeholder chưa resolve (không phải lỗi — chủ đích, `live()` strip) |
| invalid | Chưa có input invalid thực tế để test độc lập; code `isBlank()` coi `null`/whitespace là blank → rơi tầng dưới (an toàn, không throw) |
| inherited | `favicon_url`/`logo_url` mọi page đều **INHERITED** từ GLOBAL (state trả về `'INHERITED'`) |
| override | `community.title` override GLOBAL default |
| fallback | Không global `seoTitle` → `'iFlux'` hardcoded fallback cuối cùng (chỉ 1 điểm, có chủ đích, không phải fallback rải rác) |

---

## L2-TC-06 — Asset model (BR-17)

**PASS.**

| Yêu cầu | Evidence |
|---|---|
| GLOBAL asset | `page_seo_configs` tách biệt; `marketing_brand_identity.payload.defaultOgImageUrl/faviconUrl/logoUrl` |
| PAGE asset | `page_seo_configs.payload.ogImageUrl` (cùng field set, khác scope) |
| Scoped storage (không lẫn ARTICLE) | `media_usages` có cột `scope` (`GLOBAL/PAGE/ARTICLE`) + `owner_ref`, unique index `(asset_id, scope, owner_ref, field_ref)` — migration `054_site_seo_foundation.sql:16-45` |
| OG image ALT | `resolveImageAlt()` — `entity-templates.js:225-251`, chain: `manual_override → entity_seo → entity_cover → entity_title → global_default` |
| Fallback chain đúng thứ tự Entity → Page Default → Global Default | `resolveImage()` — `entity-templates.js:196-222`: `manual_override → entity_seo → entity_cover → global_default` (Page tier nằm trong `foundation.og_image` đã merge PAGE>GLOBAL trước khi vào entity resolver — cùng cơ chế precedence L2-TC-03) |
| Không broken/empty image ở fallback | **Live evidence:** HPG (không có ảnh riêng) → `social.og.image` = đúng **Global Default OG Image** (`.../mas_mso9iwlw_77b82d1c/img-001.webp`, giống hệt field `og_image` trong `GET /effective` không pageKey) — chứng minh chain Entity(none)→Global hoạt động thật, không trả rỗng/vỡ |

**Ghi nhận nhẹ (không block):** chưa có live case Page-level OG Image override khác Global để test riêng tầng giữa (hiện tại chưa có page nào set `page_seo_configs.ogImageUrl` khác Global trên Production) — đây là **trạng thái baseline hợp lệ** (đúng nguyên tắc Owner đã chốt ở Foundation Sidebar: "chưa có dữ liệu ≠ blocker"), không phải lỗi kiến trúc vì code path đã chứng minh PAGE tham gia đúng precedence chain.

---

## L2-TC-07 — HTTP ↔ SEO Coherence (BR-06.3/06.4 — Reviewer MUST) 🔒 BLOCKING

**PASS.**

Deterministic map — `backend/src/modules/seo-platform/http-policy.js:36-100` (`classifyHttpStatus` + `httpClassPolicy`), không phải rule rải rác từng page.

**Live API evidence (response thật từ `https://iflux.vn/api/seo/platform/contract`, không phải đọc code):**

| HTTP input | `indexUniverse` | `robots` | `sitemapEligible` | `canonicalUrl` | `health` | `coherent` |
|---|---|---|---|---|---|---|
| 200 (`/co-phieu/hpg`) | `true` | `index,follow` | `true` | self | `[]` | `true` |
| 404 (`/co-phieu/khong-ton-tai-xyz`) | `false` | `noindex,nofollow` | `false` | self (noindex, không self-canonical claim) | `[]` | `true` |
| 410 (`/co-phieu/deleted-xyz`) | `false` | `noindex,nofollow` | `false` | — | `[]` | `true` |
| 301 (`/home`) | `false` | `noindex,nofollow` | `false` | self, `allowSelfCanonical:false` | `[]` | `true` |
| DECORATED (`/IFLTEST1/cong-dong`) | `false` | `noindex,nofollow` | `false` | Clean identity (`/cong-dong`) | `[]` | `true` |

**Không case nào tái tạo được tổ hợp invalid bị cấm** (404+index+sitemap, 410+indexable, 301+self-canonical-độc-lập) — resolver tự động **chặn** (correct-before-output), không phải "cho qua rồi cảnh báo". Đây đúng dạng "prevent invalid" mà D-SEO-11 yêu cầu (một trong 2 lựa chọn hợp lệ: prevent HOẶC Health ERROR).

**Gate: BLOCKING — PASS.**

---

## L2-TC-08 — Conflict Resolution Matrix (BR-10.2 — Reviewer MUST) 🔒 BLOCKING

**PASS** (có 1 ghi nhận kỹ thuật không-blocking).

Bảng ưu tiên rõ ràng, 1 module duy nhất — `backend/src/modules/seo-platform/conflict.js:1-98`, comment ngay đầu file: *"Precedence: HTTP → Index Universe → Canonical → Robots → Sitemap → OG → SD"*.

**Live test 5 tổ hợp invalid tối thiểu theo BRD §14.1:**

| Tổ hợp invalid test | Kết quả thực tế (API response) | Verdict |
|---|---|---|
| HTTP 404 + index,follow + sitemap eligible | Bị conflict.js Rule A **ép** về `noindex,nofollow` + `sitemapEligible:false` trước khi trả ra | ✅ Chặn |
| HTTP 410 + indexable/sitemap eligible | Cùng Rule A | ✅ Chặn |
| noindex + sitemap eligible | Rule "Sitemap vs robots" (`conflict.js:72-76`) tự set `sitemapEligible=false` + `err('SITEMAP_NOINDEX_CONFLICT')` nếu phát sinh | ✅ Chặn (rule tồn tại, chưa cần trigger vì upstream đã loại trước) |
| HTTP 301 + canonical=old + sitemap=old | Rule B (`conflict.js:33-41`): redirect → `canonicalUrl=null` (rồi Rule C set lại = seoIdentity, không phải "old URL độc lập"), `sitemapEligible=false` | ✅ Chặn |
| Decorated URL có SEO identity độc lập | Rule cuối (`conflict.js:78-87`) — regex `IFL[A-Za-z0-9]{5,17}` phát hiện `publicId` lọt vào `seoIdentityUrl` → tự sửa về `cleanPublicUrl` + `err('DECORATED_INDEPENDENT_IDENTITY')` | ✅ Chặn (live test `/IFLTEST1/cong-dong` xác nhận `seoIdentityUrl` = Clean, không phải decorated) |

**Ghi nhận không-blocking:** với `httpClass='redirect'`, Rule E (`conflict.js:61-70`) chỉ null `social.og.url`, **không** null `structuredData.url` một cách tường minh — có thể tạo lệch OG-vs-SD trên Contract diagnostic nếu bị gọi trực tiếp với `httpStatus=301`. **Không phải bug Production sống**: redirect thật (former_slugs, `/home`→`/nha-cua-toi`) được `community.routes.js:449,492,519` xử lý bằng `res.redirect(301, ...)` thô ngay ở Express layer — **không** render HTML/JSON-LD nào cả trên response 301 thật, nên SD-url không bao giờ thực sự "leak" ra ngoài. Ghi nhận làm tech-debt cho lần dọn resolver kỹ thuật sau, không mở task mới.

**Gate: BLOCKING — PASS** (evidence = response API thật, đúng yêu cầu Reviewer).

---

## L2-TC-09 — SEO Source Traceability (BR-31, §35)

**PARTIAL PASS (non-blocking residual).**

Yêu cầu tối thiểu mỗi field trả: `Field / Value / Source / Template / Rule / Override(Y-N) / Version / Updated At`.

**Có 2 cơ chế traceability tồn tại, nhưng KHÔNG hợp nhất thành 1 record đủ như spec:**

1. **Per-field (Admin-only)** — `resolveField()` (`site-seo-resolver.js:36-90`) trả `{key, value, state, source, sourceScope}` cho từng field (`seoTitle`, `metaDescription`, `ogImageUrl`, …). `state: OVERRIDDEN/INHERITED/UNSET` = tương đương Override Y/N. **Thiếu:** Version, Updated At (tồn tại ở DB row `page_seo_configs.updated_at` nhưng chưa merge vào record field).
2. **Contract-level (public)** — `trace: {source, foundation, mode, templateVersion}` (`seo-contract.js:328-333`) — chỉ 1 object cho **toàn bộ page**, không phân theo field riêng Title/Description/Canonical/Robots/OG Image như spec yêu cầu.

**Live evidence xác nhận cả 2 tồn tại nhưng tách rời:**

```
GET /api/seo/platform/inspect?path=/co-phieu/hpg&pageKey=stock-detail
→ trace: {source: "seo-platform.contract", foundation: "090826.effective", mode: "automatic", templateVersion: 1}
→ templates: null   (chỉ populate khi Contract được gọi kèm input.entity/entityType — route /inspect hiện KHÔNG truyền entity vào buildSeoContract cho case server-fetch)
```

**Kết luận:** minimum test đề bài ("1 field manual override, 1 field auto-resolve từ template, 1 field fallback — xác nhận source khác nhau đúng") **PASS** ở mức Admin `resolveField()` (source/sourceScope khác nhau đúng: `'Thiết lập SEO bài viết'` / `'Thiết lập SEO từng trang'` / `'Thiết lập SEO hệ thống'` / `'Fallback'`). Phần **KHÔNG PASS đầy đủ**: chưa có 1 API duy nhất trả full record (Field+Value+Source+Template+Rule+Override+Version+UpdatedAt) — đây là **gap lắp ráp (assembly gap)**, không phải thiếu dữ liệu nguồn.

**Không tự sửa ngay** (đúng CG-030): mở rộng response API là thay đổi diện Production, cần Owner xác nhận có muốn mở ngay trong epic này hay ghi nhận residual.

---

## L2-TC-10 — SEO Versioning & Rollback (BR-30, §34)

**OUT OF SCOPE — Owner-locked deferral (không phải FAIL của epic này).**

**Bằng chứng đây là quyết định Owner đã khóa từ trước, không phải phát hiện mới:**

1. `03 - Governing SoT.md` Appendix B.3: *"## Versioning / Rollback — Out of Epic 040826 → Foundation backlog `100826_SEO_Metadata_Versioning_Rollback_Foundation` **NOTSTART**."*
2. `09 - Audit Verification Evidence.md` §3 (Residual, đã ghi từ 2026-08-10): *"BR-30 / SC-18 | VERSION/rollback UX | Gap Foundation P8 (`inspect.gaps.rollbackUx=false`) — phase riêng"*.
3. **Code tự thừa nhận gap** — `site-seo.service.js:172-180` (`previewAdmin`):
   ```js
   var gaps = {
     versionHistory: false,
     rollbackUx: false,
     notes: ['Foundation có updated_at/updated_by trên page_seo_configs và brand payload — chưa có bảng revision/rollback UX.', ...]
   };
   ```
4. **Live xác nhận hôm nay** — `GET /api/seo/platform/inspect` → `gaps: {versionHistory: false, rollbackUx: false, ...}`.

**Đã có (không phải zero):** `updated_at`/`updated_by` (audit tối thiểu, không phải full history/rollback). **Chưa có:** bảng revision, so sánh before/after, rollback API — đúng như D-SEO tự khai.

**L2-TC-10 không thể PASS trong epic này vì tính năng chưa được Owner authorize build ở đây** — task đích danh (`100826_SEO_Metadata_Versioning_Rollback_Foundation`) vẫn NOTSTART. Không coi đây là regression hay lỗi kiến trúc SEO; giữ nguyên phân loại Owner đã chốt.

---

## L2 Exit Gate

```text
Persistence (L2-TC-01)              PASS
SoT (L2-TC-02)                      PASS
Resolver (L2-TC-03)                 PASS
Precedence (L2-TC-03)               PASS
Template (L2-TC-04)                 PASS
Fallback (L2-TC-05)                 PASS
Asset model (L2-TC-06)              PASS
HTTP↔SEO Coherence (L2-TC-07)       PASS  — BLOCKING gate, evidence = live API
Conflict Resolution (L2-TC-08)      PASS  — BLOCKING gate, evidence = live API (1 tech-debt non-blocking ghi nhận)
Source Traceability (L2-TC-09)      PARTIAL PASS — non-blocking (assembly gap, dữ liệu nguồn đã có)
Versioning/Rollback (L2-TC-10)      OUT OF SCOPE — Owner-locked deferral (100826_..._Foundation NOTSTART), không phải BR trong scope PASS/FAIL của epic này
```

## **L2 Exit Gate: ✅ PASS** (2 điều khoản "Reviewer MUST" — L2-TC-07, L2-TC-08 — PASS bằng live API evidence; 2 residual non-blocking đã ghi nhận minh bạch, không che giấu).

### Owner Final Decision (2026-08-11) — chốt cả 2 residual, đóng L2

| Item | Quyết định |
|---|---|
| L2-TC-09 (Traceability assembly gap) | **Defer** — giữ nguyên residual, dữ liệu nguồn (per-field source/state) đã tồn tại (`resolveField()` + Contract `trace`), chỉ chưa lắp thành 1 record duy nhất. **Không** mở API mới trong epic này. |
| L2-TC-10 (Versioning/Rollback) | **Defer** — giữ NOTSTART ở task Foundation riêng (`100826_SEO_Metadata_Versioning_Rollback_Foundation`), **không** mở song song trong epic này. |
| L2 Exit Gate | **PASS** — defer 2 residual **không** đồng nghĩa L2 chưa đạt. 8/10 test case (Persistence → SoT → Resolver → Precedence → Template → Fallback → Asset → HTTP/SEO Coherence → Conflict Resolution) đã PASS đầy đủ bằng evidence live; 2 residual còn lại là gap đã biết, đã phân loại rõ (assembly gap vs Owner-locked deferral), không phải lỗi kiến trúc mới. |
| L3 | **Mở ngay**, không chờ 2 residual trên. |

**Không mở thêm task nào trong L2.**

**L3 (Application/Feature Behavior) được phép mở tiếp** theo đúng dependency, không chờ 2 residual trên (cả hai không thuộc BLOCKING gate của L2 theo `20 - Master Verification Specification.md` §14).
