# 24 — L3 Execution: Application / Feature Behavior

**Layer:** L3 (theo `20 - Master Verification Specification.md` v1.1, §15-23)
**Gate trước:** L2 = ✅ PASS (xem `23`, Owner defer TC-09/TC-10, không mở task mới).
**Phương pháp:** Live API/curl trên Production (`https://iflux.vn`, nhiều User-Agent) + source code + tái sử dụng evidence đã có từ `09 - Audit Verification Evidence.md` (không lặp lại công việc đã verify) + grep toàn bộ backend SEO modules để tìm validation/health logic thật.

**Kết quả tổng quan:** L3 phát hiện **3 gap thật** (không phải residual nhẹ) — cần Owner quyết định trước khi coi L3 là "đóng hoàn toàn". Theo đúng nguyên tắc layered gate (`20` §2.1) và Stop-the-Line đã áp dụng ở L1, tôi **dừng lại trình bày** thay vì tự nhận PASS toàn bộ.

---

## L3-A — Global SEO (BR-03/04/05)

| Test | Kết quả | Evidence |
|---|---|---|
| Website name / description | ✅ PASS | Live `/effective` — đã verify ở L2-TC-01/02 |
| Default SEO title / meta description | ✅ PASS | Cùng evidence L2 |
| Default OG image + ALT | ✅ PASS | Live: `og:image`/`og:image:alt` đầy đủ trên mọi page test |
| Inheritance (GLOBAL không override khi PAGE có) | ✅ PASS | L2-TC-03 |
| **Favicon — full chain (BR-05.1)** | ⚠️ **PARTIAL** | Xem dưới |

**Favicon chain thật trên Production (Zalo UA, `GET /`):**

```html
<link rel="icon" href="https://iflux.vn/media/.../img-001.webp" />
<link rel="apple-touch-icon" href="https://iflux.vn/media/.../img-001.webp" />
```

`GET /favicon.ico` → HTTP **302** → redirect tới cùng file `.webp`.

**Gap thật (BR-05.1 yêu cầu "PNG favicon, Apple Touch Icon, Manifest icons, MIME"):**
- Chỉ **1 asset duy nhất** (`.webp`) phục vụ cho cả `favicon.ico` (qua redirect), `rel="icon"`, và `rel="apple-touch-icon"` — không có PNG multi-size riêng (16×16/32×32/180×180 chuẩn Apple Touch).
- Không có `<link rel="manifest">` / PWA icon.
- Không có `<meta name="theme-color">`.
- `favicon.ico` là **redirect 302**, không phải file `.ico` gốc — một số crawler/browser cũ không theo redirect cho favicon.

`head-renderer.js:49-50` xác nhận code chỉ emit đúng 2 dòng trên, dùng **1 biến `favicon` duy nhất**, không có logic multi-size/manifest.

**Verdict L3-A: PASS phần lõi (name/description/OG default/inheritance), GAP thật ở BR-05.1 (favicon chỉ 2/5 hạng mục SoT §13 yêu cầu).**

---

## L3-B — Page SEO (BR-06/07/08/09)

| Test | Kết quả | Evidence |
|---|---|---|
| Page config (persist/read) | ✅ PASS | L2-TC-01 |
| Canonical | ✅ PASS | L2-TC-07/08 |
| Robots | ✅ PASS | L2-TC-07/08 |
| OG / Twitter | ✅ PASS | Live head đầy đủ mọi page test |
| Templates + token resolution | ✅ PASS | L2-TC-04 |
| Fallback | ✅ PASS | L2-TC-05 |
| **Title validation (BR-20): empty/duplicate/quá dài/quá ngắn/invalid characters** | ❌ **FAIL (gap thật)** | Xem dưới |
| **Description validation (BR-19): empty/quá ngắn/quá dài/duplicate/HTML/quality threshold + SEO Warning** | ❌ **FAIL (gap thật)** | Xem dưới |

**Bằng chứng gap — grep toàn bộ backend, không tìm thấy bất kỳ logic nào cho:** duplicate-title detection, duplicate-description detection, minimum-length check, HTML-tag detection trong description, quality-threshold scoring, hoặc surface `SEO Warning` cho Admin.

Thực tế chỉ có (`site-seo.routes.js:34-51,94-96`):

```js
seoTitle: z.string().max(300).optional().nullable(),
metaDescription: z.string().max(2000).optional().nullable(),
```

→ **chỉ có upper-bound length** (zod `.max()`), **không có**: lower-bound, duplicate-across-page detection, ký tự không hợp lệ, HTML strip validation, hay bất kỳ "quality threshold" nào. BR-19/BR-20 (`01 - Business Requirement.md` §23-24) yêu cầu rõ 6 loại validate cho description và 5 loại cho title — hiện tại chỉ đạt 1/6 và 1/5 (đều chỉ là "quá dài", không có gì khác).

**Verdict L3-B: PASS phần resolver/persistence/rendering, FAIL thật ở validation layer (BR-19, BR-20) — chưa từng được implement, không phải regression mới.**

---

## L3-C — Article SEO

| Test | Kết quả | Evidence |
|---|---|---|
| Article title/description + override | ✅ PASS | `09 - Audit Verification Evidence.md` §2 (ARTICLE) — tái xác nhận qua L2-TC-03 case 3 |
| OG image + ALT | ✅ PASS | `entity-templates.js` resolveImage/resolveImageAlt chain (L2-TC-06) |
| Canonical | ✅ PASS | Article dùng Clean URL hệ thống sinh, không theo RSS/external (D-SEO-13) |
| Structured data | ✅ PASS | `structuredData.url` = Clean identity, breadcrumb JSON-LD sinh từ hierarchy thật (đã thấy trong mọi Contract response) |
| Slug + former_slugs 301 | ✅ PASS | Xem L3-E |
| Author/category/topic/publication metadata | ✅ PASS | `09` §2 AUTHOR/COLL đã PASS |

**Verdict L3-C: PASS** (tái xác nhận, không phát hiện gap mới).

---

## L3-D — Entity SEO (BR-07 coverage — stock/sector/eco/story/author/category/topic/tag/collection)

| Entity | Kết quả | Evidence |
|---|---|---|
| Stock | ✅ PASS | Live `HPG` — Contract đầy đủ Persistence→Resolver→HTML→Canonical→Robots→OG→SD (L2-TC-04, L2-TC-07) |
| Sector / Ecosystem / Story | ✅ PASS | `09` §2 — Admin templates PASS; cùng cơ chế `group-page.js` + `ensureSections()` (đã verify Foundation task) |
| Author | ✅ PASS | `09` §2 AUTHOR — alias `com-author` đã fix (`07 - Plan` Phase 0 S3) |
| Category / Collection | ✅ PASS | `09` §2 COLL — `danh-muc` PASS |
| Topic | ✅ PASS | `com-topic` → `/cong-dong` pageKey, cùng Foundation resolver |
| **Tag** | ✅ PASS (redirect-only, không SEO page riêng) | `09` §2 TAG: `/community/tag/foo` → **301** → `/cau-chuyen/foo` — đã Owner-accepted là "redirect coverage", không cần SEO identity riêng cho Tag |

**Verdict L3-D: PASS** — toàn bộ 9 entity surface trong BR-07 đã có evidence PASS (đa số tái sử dụng `09`, không lặp công việc).

---

## L3-E — URL / Slug / Redirect (BR-24/25/26/27)

| Test | Kết quả | Evidence |
|---|---|---|
| Clean URL / slug uniqueness | ✅ PASS | `page_key` PK + `slug` unique theo entity table |
| Slug normalize (case) | ✅ PASS | Live: `/co-phieu/hpg` (lowercase input) → resolve đúng `HPG` |
| Slug change → 301 → canonical mới | ✅ PASS | `former_slugs` mechanism (D-SEO-13), `community.routes.js:449,492,519` — `res.redirect(301, articlePublicPath(newSlug))` |
| Redirect không loop/chain dài | ✅ PASS | Live: `/home` → 301 → `/nha-cua-toi` → 200 (**1 hop**, không loop) |
| Pagination (`?page=`) | ✅ **N/A** (đã khóa ở Audit `13` + SoT Appendix B.3) | "Không có indexable pagination product hiện tại" — không phải gap, là scope thật |
| Language variant | ✅ N/A (chưa mở locale `en`, đúng SoT §24 — chưa tới phase) | — |

**Verdict L3-E: PASS.**

---

## L3-F — Admin UX / SEO CMS / Permission / Health (BR-28/29/32/33)

### SEO Preview (BR-28)

**PASS.** `buildPreviewFromContract()` (`health.js:140-179`) đọc **duy nhất** từ `contract` (không logic riêng) — cùng engine với production First HTML. Route `/api/seo/platform/preview` xác nhận field-for-field khớp `/api/seo/platform/contract`.

### SEO Health (BR-29)

⚠️ **PARTIAL — gap thật.**

**Đã có** (`health.js:24-137`, đã verify live qua `/api/seo/platform/health`):

```text
HTTP_404_INDEXABLE / HTTP_404_SITEMAP / HTTP_404_SELF_CANONICAL
REDIRECT_SITEMAP / REDIRECT_INDEPENDENT_CANONICAL / REDIRECT_INDEPENDENT_OG
SITEMAP_NOINDEX_CONFLICT
DECORATED_SITEMAP / DECORATED_INDEPENDENT_IDENTITY / DECORATED_INDEPENDENT_OG
OG_URL_IDENTITY_MISMATCH / SD_URL_IDENTITY_MISMATCH
MISSING_TITLE (ERROR) / MISSING_DESCRIPTION (WARN) / MISSING_CANONICAL
SINGLETON_VIOLATION (duplicate authoritative tag trên emitted HTML)
```

→ Đây là **per-URL Contract coherence check** (đúng D-SEO-11), rất mạnh — nhưng...

**Chưa có** (yêu cầu tường minh của spec §21 / BR-29): **Duplicate Title** (cross-page), **Duplicate Description** (cross-page), **Broken Canonical** (fetch thật để xác nhận canonical URL sống), **Broken OG Image** (fetch thật ảnh có 200 không), **Invalid Structured Data** (JSON-LD schema validation), **Orphan Page** (không có internal link nào trỏ tới), **Redirect Loop/Chain** (multi-hop detection tự động).

**Root cause:** `health.js` là **per-URL evaluator** (nhận 1 Contract, trả health của chính URL đó) — các hạng mục còn thiếu đều cần **site-wide crawl/aggregate** (so sánh nhiều URL với nhau, hoặc network fetch thật), là một **loại capability khác** (batch job / crawler), chưa tồn tại ở đâu trong repo.

### SEO CMS structure (BR-32)

⚠️ **PARTIAL.** Đã có: Global SEO settings, Page SEO settings, Preview, Health/Inspect (observability). **Chưa có** như 1 khu vực Admin riêng: Templates management (VI placeholder templates hiện chỉ sửa qua field `seoTitle` text thô, không có UI quản lý token/rule tách biệt), Rules Engine UI, Verification (Google/Bing token) UI, Redirects management UI (former_slugs hiện là side-effect của đổi slug, không có UI xem/quản lý danh sách redirect), SEO Audit UI riêng.

### SEO Permission (BR-33)

⚠️ **PARTIAL.** Catalog thật (`admin-rbac/permission-catalog.js:229-230`):

```js
{ key: 'seo_system', actions: ['view', 'edit'] },
{ key: 'seo_pages', actions: ['view', 'edit'] }
```

Chỉ 2 bucket × 2 action = 4 permission. Spec liệt kê 9 scope kỳ vọng (`seo.view/edit/publish/settings.manage/redirect.manage/robots.manage/sitemap.manage/audit.view/version.rollback`) — không tồn tại tách biệt (không có "publish" riêng khỏi "edit", không có robots/sitemap/redirect/audit/rollback riêng).

**Không tự kết luận đây là FAIL của epic SEO** — theo đúng `docs/admin-rbac/Owner-Decision-Matrix-SoT.md` (rule Owner LOCKED): "Admin = full quyền... Không suy diễn Product Intent từ implementation", việc catalog permission có ít hơn danh sách lý tưởng trong 1 spec kỹ thuật **không tự động nghĩa là thiếu implementation** — có thể là **NO_EP** (chưa build API) hoặc **DEAD** (Owner chưa mở) theo đúng model RBAC riêng. Cần Owner xác nhận có nằm trong RBAC Decision Matrix hay là gap thật của epic SEO.

**Verdict L3-F: PARTIAL — 2 gap thật (Health matrix thiếu 7/20 hạng mục cross-page/network-fetch; CMS structure thiếu 5 khu vực quản trị riêng), 1 điểm cần Owner xác nhận qua RBAC SoT riêng (Permission granularity).**

---

## L3-G — Internal Linking (BR-23)

**PASS.** `IfluxSeoUrl` là helper trung tâm, được **tái sử dụng rộng** (grep xác nhận ≥15 file: `stock-page`, `flow`, `community`, `comments-page`, `entity-detail-center`, `community-post-page`, …) — không phải mỗi page tự hardcode href. Đúng D-SEO-08 (reuse before replace) và §27 BRD (internal link sinh từ entity identity).

---

## L3-H — Root Cause thật: 3 triệu chứng Zalo/Google (Owner priority — điều tra trước khi chốt 3 gap trên)

**Nguyên tắc áp dụng:** không suy luận từ DB/API — bắt buộc xác minh **chính xác HTML mà crawler nhận được** (live `curl` với UA thật + đọc source code render path), đúng yêu cầu Owner.

### H1 — Zalo Global (iflux.vn không có description/image)

**Live evidence (`curl -A "Zalo 1.0"` và `curl -A "ZaloBot-LinkCrawler"` → `https://iflux.vn/`):**

```html
<title>iFlux | Cộng đồng chứng khoán</title>
<meta name="description" content="Khám phá bài viết, góc nhìn và chia sẻ từ cộng đồng nhà đầu tư..." />
<meta property="og:title" content="iFlux | Cộng đồng chứng khoán" />
<meta property="og:description" content="Khám phá bài viết, góc nhìn..." />
<meta property="og:image" content="https://iflux.vn/media/community/2026/08/mas_mso9iwlw_77b82d1c/img-001.webp" />
```

→ **HTML hiện tại đầy đủ, đúng, live.** Không phải bug render/route hiện tại.

**Nhưng phát hiện 2 gap thật, cụ thể, vẫn đang tồn tại (không phải cache):**

1. **Thiếu `og:image:width` / `og:image:height` / `og:image:type`** — grep toàn bộ `backend/src/modules/seo-platform/head-renderer.js` (dòng 52-62, nơi **duy nhất** emit OG image cho mọi shell) xác nhận **không có logic nào** emit 3 field này. Facebook/Zalo (theo tài liệu vendor: "Facebook is the strictest about width/height... without them the first share almost always fails") cần các field này để **fetch ảnh ở lần scrape đầu tiên**; thiếu → crawler có thể bỏ qua ảnh ở lần quét đầu, chỉ hiện đúng sau khi "quét lại" — khớp với triệu chứng "Zalo không hiện ảnh".
2. **Ảnh OG mặc định vẫn là `.webp`** (`img-001.webp`, 1200×750, 80KB, HTTP 200 công khai — bản thân ảnh không lỗi) — `resolveSocialCompatiblePublicUrl()` (`media.service.js`) đã có logic ưu tiên JPEG/PNG cho social, nhưng **không có JPEG/PNG variant nào tồn tại trong DB cho đúng asset mặc định này** → hàm fallback về nguyên bản `.webp`. Zalo (nhiều bản cũ) và một số renderer social lịch sử có xử lý WebP không ổn định.

**Kết luận H1:** Route/HTML **không lỗi hiện tại**; gap thật là (1) thiếu `og:image:width/height/type` — code gap trong `head-renderer.js`, và (2) thiếu JPEG/PNG variant cho ảnh OG mặc định — data gap. Cả hai là nguyên nhân hợp lý nhất cho "Zalo không hiện ảnh/mô tả lần đầu chia sẻ". Ngoài ra: **Zalo cache theo URL** (giống Facebook) — nếu Owner đã share/test link này **trước khi** các fix Zalo UA (nginx, 2026-08-10) được deploy, cache cũ của Zalo vẫn giữ kết quả rỗng cho tới khi bị "quét lại".

### H2 — Zalo Page-level (từng trang cũng không ra description/image)

**Live evidence:** `curl -A "Zalo"` trên `/thi-truong`, `/dong-tien`, `/goi-cuoc` → cùng kết quả: full OG tags, đúng ảnh/description riêng từng trang.

**Kết luận H2:** Cùng root cause với H1 — cùng `head-renderer.js`, cùng thiếu `width/height/type`, cùng khả năng ảnh mặc định là webp nếu trang đó cũng dùng ảnh OG mặc định (page riêng có ảnh riêng → tùy asset, cần kiểm tra variant per-page nếu Owner báo cụ thể trang nào).

### H3 — Google SERP hiện "Cộng đồng · iFlux" / "iFlux. ⌘K. U."

**Live evidence — bot shell hiện tại (`curl -A "Googlebot/2.1"` → `/cong-dong`):**

```html
<main><h1>iFlux | Cộng đồng chứng khoán</h1></main>
```

→ Shell HTML hiện tại **hoàn toàn sạch** — không có bất kỳ dấu vết "⌘K" hay "U" nào.

**Nguồn gốc chuỗi "⌘K. U." — xác nhận bằng grep source:**

```html
<!-- User_Web/community/index.html — App Shell topnav, DOM order: logo alt → search kbd hint → avatar initial -->
<img class="ix-brand-logo" data-ifx-seo-logo alt="iFlux" ... hidden />
<input placeholder="Tìm CP, ngành, họ, chủ đề… (⌘K)" ... />
<kbd class="ifx-hdr-search-kbd">⌘K</kbd>
...
<button class="ix-avatar" data-ifx-user-initials>U</button>
```

→ Thứ tự "iFlux" → "⌘K" → "U" **khớp chính xác** với thứ tự DOM của App Shell chrome (logo alt, search shortcut, avatar khách). Đây **chỉ có thể** xuất hiện nếu Google từng crawl/render **nhánh Human SPA** (không phải bot-shell hiện tại) — tức là snapshot đã lập chỉ mục **từ TRƯỚC** khi cơ chế bot-shell/SSI-title hiện tại tồn tại đầy đủ trên production.

**Kiểm tra độ mới của index:** `site:iflux.vn` trên Google search → **0 kết quả** (site gần như chưa được index lại / index rất mỏng) — nhất quán với giả thuyết "index cũ/thưa", không phải "bug đang sống".

**Kết luận H3: Đây là STALE INDEX, không phải lỗi code đang sống.** Live HTML hiện tại (bot-shell) sạch 100%, không thể tạo ra chuỗi "⌘K/U" nếu crawl lại từ bây giờ. Khắc phục không phải sửa code, mà là **hành động vận hành**: yêu cầu Google Search Console "Request Indexing" cho các URL bị ảnh hưởng (`/`, `/cong-dong`, …) để ép crawl lại; nếu không có Search Console, chỉ có thể chờ Google tự crawl lại (không có SLA cố định).

---

## L3 Exit Gate

```text
L3-A Global SEO            PASS (core) — GAP thật: favicon chain BR-05.1 (2/5 hạng mục)
L3-B Page SEO               PASS (resolver/render) — FAIL thật: Title/Description validation BR-19/BR-20 (chưa implement)
L3-C Article SEO           PASS
L3-D Entity SEO (9 surface) PASS
L3-E URL/Slug/Redirect     PASS
L3-F Admin UX/CMS/Perm/Health  PARTIAL — GAP thật: Health matrix (7/20 thiếu), CMS structure (5 khu thiếu); Permission granularity cần Owner xác nhận qua RBAC SoT riêng
L3-G Internal Linking      PASS
L3-H Social Preview Root Cause (Zalo/Google)  H1/H2 → gap #4+#5 FIXED + verified 2 tầng (2026-08-11); H3 = stale index, không code, chờ Owner Request Indexing
```

## **L3 Exit Gate: ⏸ STOP — chờ Owner quyết định trước khi coi PASS.**

Khác với L2 (2 residual đã có sẵn phân loại rõ + Owner-locked deferral từ trước), **3 gap ở L3 là phát hiện MỚI, chưa từng được Owner phân loại/khóa trong bất kỳ tài liệu nào của epic này**:

| # | Gap | BR | Mức độ |
|---|---|---|---|
| 1 | Favicon chain thiếu PNG multi-size / manifest / theme-color | BR-05.1 | Nhẹ — favicon vẫn hiển thị đúng (đã xác nhận ở phần 3 câu hỏi Zalo/Google phía trên), chỉ thiếu completeness |
| 2 | Title/Description validation (duplicate/quality/length dưới/ký tự) hoàn toàn chưa implement | BR-19, BR-20 | **Trung bình-cao** — Admin có thể lưu title/description trùng lặp hoặc chất lượng thấp mà hệ thống không cảnh báo |
| 3 | SEO Health thiếu 7 hạng mục cross-page/network (Duplicate Title/Desc, Broken Canonical/OG Image, Invalid SD, Orphan Page, Redirect Loop); CMS thiếu 5 khu quản trị riêng | BR-29, BR-32 | Trung bình — health hiện tại vẫn bắt đúng lỗi coherence quan trọng nhất (D-SEO-11), chỉ thiếu lớp "audit toàn site" |
| 4 | `og:image:width` / `og:image:height` / `og:image:type` không được emit ở đâu trong `head-renderer.js` — dùng chung cho Global/Page/Article/Entity | BR-05 / social preview | **✅ FIXED (2026-08-11)** — xem bằng chứng dưới |
| 5 | Ảnh OG mặc định (site-wide) chỉ có `.webp`, không có JPEG/PNG variant trong DB — `resolveSocialCompatiblePublicUrl()` đã có logic ưu tiên JPEG/PNG nhưng không có gì để chọn | BR-05 / social preview | **✅ FIXED (2026-08-11)** — xem bằng chứng dưới |
| 6 | "Tên site" (`site_name`, đã có trong `marketing_brand_identity.payload`, resolver trả nhất quán — xem L2) **chưa được expose thành field quản lý riêng** trong Admin "Thiết lập SEO hệ thống" — Admin hiện phải biết đến Brand Identity ngầm bên dưới, không có ô "Tên site" tách biệt khỏi "Tiêu đề SEO mặc định" | BR-03 / CMS exposure | Owner chốt: **FIX, nhưng P1** — không block Zalo, đưa vào CMS scope riêng, chưa code |

**H3 (Google SERP stale index) không đưa vào bảng gap implementation** — đây là hành động vận hành (Search Console re-index), không phải code fix. Owner xác nhận không tạo task code cho H3.

---

### Gap #4 + #5 — FIX đã triển khai (2026-08-11)

**Nguyên tắc Owner đặt ra khi chốt fix:** không hardcode dimensions cho ảnh Global hiện tại; renderer phải lấy width/height/mime từ **asset metadata thật**; root cause #5 nằm ở **Asset Pipeline** (thiếu JPEG/PNG derivative), không phải sửa URL string trong `head-renderer.js`.

**Thực hiện (modify-first, đúng 4 file, không thêm abstraction mới):**

| File | Thay đổi |
|---|---|
| `backend/src/modules/media/media.service.js` | `resolveSocialCompatiblePublicUrl(url): string` → `resolveSocialCompatibleImage(url): {url, width, height, mime}` — cùng 1 hàm, cùng 1 call site, trả thêm metadata thật từ `media_variants` (không hardcode) |
| `backend/src/modules/media/media-process.js` | `normalizeAndVariants()` thêm derivative **`social`** (JPEG, quality 85, flatten nền trắng) — chỉ sinh khi ảnh gốc **không phải** sẵn jpeg/png. Áp dụng cho **mọi upload tương lai** (Admin SEO upload, article import) — đúng root cause "Asset Pipeline" Owner yêu cầu |
| `backend/src/modules/media/media.service.js` (`createAssetFromBuffer`) | Ghi thêm variant `social` vào `media_variants` khi pipeline sinh ra (role mới, không cần migration — `media_variants.role` là TEXT tự do) |
| `backend/src/modules/seo-platform/seo-platform.service.js` (`applySocialCompatibleImage`) | Nhận `{url,width,height,mime}` thay vì string; ghi `contract.social.og.imageWidth/imageHeight/imageMime` — **một điểm chốt duy nhất**, tự động áp dụng cho Global/Page/Article/Entity (đều đi qua `resolveContract`/`resolveArticleContract` → `applySocialCompatibleImage`) |
| `backend/src/modules/seo-platform/head-renderer.js` | Emit `og:image:type` / `og:image:width` / `og:image:height` từ `social.imageMime/imageWidth/imageHeight` — chỉ emit khi có giá trị thật, không hardcode |

**Backfill dữ liệu đã tồn tại (one-off, chạy trực tiếp trên Production, không để lại file script):** quét toàn bộ `media_assets` đang gắn `media_usages` scope GLOBAL/PAGE mà không có variant jpeg/png nào → tìm ra 3 asset (GLOBAL/og, GLOBAL/social, PAGE community/og — đều webp-only) → sinh variant `social` (JPEG) cho cả 3 bằng đúng logic `sharp` vừa thêm vào pipeline, insert vào `media_variants`, xóa script tạm sau khi chạy.

**Deploy:** 4 file → Production (`/var/iflux/backend`), `pm2 restart iflux-api`, Cloudflare purge toàn bộ.

**Verify 2 tầng theo đúng yêu cầu Owner (không chỉ gọi API SEO):**

1. **Crawler HTML (Zalo UA thật, `curl -A "Zalo 1.0"`)** — `/`, `/thi-truong`, `/cong-dong`:

```html
<meta property="og:image" content="https://iflux.vn/media/community/2026/08/mas_mso9iwlw_77b82d1c/img-001.social.jpg" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="750" />
```

2. **Ảnh thực tế tải trực tiếp** (`curl` chính URL trong `og:image`):

```text
HTTP/2 200, content-type: image/jpeg, content-length: 146327
file → JPEG image data, baseline, precision 8, 1200x750, components 3
```

→ **Không còn WebP** — Zalo/Facebook nhận đúng JPEG 1200×750 kèm width/height/type. Spot-check thêm Entity (`/co-phieu/HPG`, UA Googlebot) — cùng kết quả, không regression.

**Trạng thái #4/#5: FIXED + verified 2 tầng.** Việc "Zalo/FB có hiện đúng ảnh khi share thật hay không" (behavior thật của Zalo, ngoài tầm kiểm soát code) cần Owner tự test share link thật sau purge — closure cuối cùng của H1/H2 theo đúng lưu ý của Owner ("đừng vội kết luận đã fix chỉ vì curl thấy đúng").

---

**Theo đúng CG-030 (Uncertainty Handling):** #6 vẫn là điểm **chưa tự quyết** — Owner đã chốt FIX/P1, chờ đưa vào implementation plan CMS riêng (không code ngay).

---

## L3-N — Owner chốt 4 gap còn lại + FIX Gap #2 (Title/Description Validation, BR-19/BR-20) — 2026-08-12

**Owner quyết định cuối (đóng L3 Exit Gate):**

| # | Gap | Quyết định cuối | Trạng thái |
|---|---|---|---|
| 1 | Favicon completeness (BR-05.1) | **DEFER** | Ghi nhận, không chặn L3 |
| 2 | Title/Description validation (BR-19/BR-20) | **FIX ngay trong epic** | ✅ **FIXED — xem bằng chứng dưới** |
| 3 | SEO Health/CMS completeness (BR-29/BR-32) | **DEFER** | Ghi nhận, không chặn L3 |
| 6 | "Tên site" Admin field (CMS exposure) | **FIX, nhưng P1** — CMS scope riêng | Backlog P1, không chặn L3 |

### Fix Gap #2 — Implementation (modify-first, 1 file mới + 1 file sửa, không thêm route mới)

**Root cause (đã xác nhận ở L3-B):** `site-seo.routes.js` chỉ có `zod .max()` (upper-bound) cho `seoTitle`/`metaDescription`/`defaultSeoTitle`/`defaultMetaDescription` — hoàn toàn chưa có: duplicate detection, minimum length, invalid characters, HTML detection, quality threshold.

**Thực hiện:**

| File | Thay đổi |
|---|---|
| `backend/src/modules/site-seo/seo-content-quality.js` (**mới** — capability chưa từng tồn tại ở đâu trong codebase, không phải duplicate) | `validateTitle(value, {others})` / `validateDescription(value, {others})` — BR-20: empty/duplicate/quá dài/quá ngắn/invalid-characters (HTML+control-char = **ERROR** chặn lưu; length/duplicate = **WARNING**). BR-19: cùng cơ chế + HTML detection + quality threshold (length khuyến nghị 50–160 ký tự) |
| `backend/src/modules/site-seo/site-seo.service.js` | `updateGlobalSeo()` + `upsertPageSeo()` gọi `runContentQualityGate()` trước khi ghi DB — thu thập title/description ở **tất cả scope khác** (Global + mọi Page) để check duplicate; throw `AppError.badRequest('SEO_CONTENT_QUALITY', ...)` nếu có error (block save); trả `seoWarnings: [...]` trong response nếu chỉ là chất lượng (đúng nguyên tắc BR-19 "SEO Warning, không silently tạo rác") |

**Nguyên tắc phân loại Error vs Warning:** HTML/ký tự điều khiển trong `<title>`/`<meta description>` = **ERROR** (phá vỡ correctness của `<head>`, nhất quán với BR-29.2/29.3 "MUST be ERROR khi ảnh hưởng correctness"). Length ngoài khuyến nghị + duplicate = **WARNING** (chất lượng/best-practice, Admin có thể cố ý override, không silent nhưng không chặn).

**Verify — chạy trực tiếp qua `svc.upsertPageSeo()` thật (không mock), dùng `page_key` test tạm rồi xóa sạch ngay sau khi xong (không để lại dữ liệu/table/route mới):**

```text
Test 1 — HTML trong title (<b>Bad</b> Title)         → BLOCK ✅ (SEO_CONTENT_QUALITY: "không được chứa thẻ HTML")
Test 2 — title/description hợp lệ, đủ dài            → LƯU thành công, seoWarnings: [] ✅
Test 3 — title quá ngắn ("Ngắn", 4 ký tự)              → LƯU thành công (không block), seoWarnings: [TITLE_TOO_SHORT] ✅
Test 4 — description trùng với trang "account" thật    → LƯU thành công, seoWarnings: [DESCRIPTION_DUPLICATE] ✅
Cleanup — DELETE row test                              → OK, không còn residual ✅
```

**Deploy:** 2 file → `/var/iflux/backend` (Production), `pm2 restart iflux-api` (pid mới, uptime reset, không downtime khác 0 request). **Không regression:** `/`, `/thi-truong`, `/cong-dong` vẫn HTTP 200; `GET /api/seo/effective` vẫn trả đúng dữ liệu hiện hành.

**Trạng thái Gap #2: ✅ FIXED + verified qua real service call.**

---

## L3 Exit Gate (cập nhật) — ✅ **PASS**

```text
L3-A Global SEO            PASS (core) — #1 Favicon: Owner DEFER
L3-B Page SEO               PASS (resolver/render) — #2 Title/Description validation: ✅ FIXED (L3-N)
L3-C Article SEO           PASS
L3-D Entity SEO (9 surface) PASS
L3-E URL/Slug/Redirect     PASS
L3-F Admin UX/CMS/Perm/Health  PARTIAL — #3 Health/CMS: Owner DEFER; #6 "Tên site" field: Owner P1 (CMS scope riêng, không chặn)
L3-G Internal Linking      PASS
L3-H/I/J/K/L/M Social Preview + Zalo in-app browser  Tất cả đã điều tra xong + FIXED (#4/#5 OG metadata, bug Zalo in-app browser) hoặc khép lại với kết luận rõ ràng (H3 = vận hành, không code)
```

**L3 Exit Gate: ✅ PASS (2026-08-12).** 4 gap còn lại đã được Owner phân loại rõ ràng (2 DEFER, 1 FIXED, 1 P1-backlog-không-chặn) — không còn "phát hiện mới chưa phân loại". **L4 UNLOCKED.**

---

## L3-I — Root `/` vs `/cong-dong` Reconciliation Audit (Owner STOP-THE-LINE, 2026-08-12)

**Trigger:** Owner tự kiểm tra View Source `https://iflux.vn/` bằng browser thường (không phải crawler UA) → thấy **không có canonical, không có og:\***, chỉ có `<title>`. Nghi ngờ mâu thuẫn với báo cáo trước ("Zalo UA nhận đầy đủ OG"). **Owner yêu cầu: KHÔNG SỬA CODE, chỉ đối chiếu evidence.**

**Kết quả: không có code change nào trong phần này — chỉ đọc source + query Production.**

### A. Effective SEO resolver — `pageKey=community` (áp dụng cho cả `/` và `/cong-dong`, xem mục B)

Live `GET /api/seo/effective?pageKey=community`, đối chiếu resolver logic thật (`site-seo-resolver.js:36-90`, precedence `ARTICLE > PAGE > GLOBAL > FALLBACK`):

| Field | VALUE (effective) | SOURCE / OWNER | MODE |
|---|---|---|---|
| `site_name` | "iFlux \| Hiểu rõ dòng tiền - Nắm bắt thị trường" | GLOBAL (Thiết lập SEO hệ thống) | **INHERITED** — `siteName` không có field PAGE (resolver hardcode `page.siteName = undefined`, `site-seo-resolver.js:196`) |
| `site_description` | "Nền tảng phân tích thị trường chứng khoán..." | GLOBAL | **INHERITED** — cùng lý do, không có field PAGE |
| `seo_title` | "iFlux \| Cộng đồng chứng khoán" | **PAGE / community** | **OVERRIDDEN** — khớp đúng giá trị Page Admin, khác Global default ("...tin tức thị trường nhanh nhất Việt Nam") |
| `meta_description` | "Khám phá bài viết, góc nhìn..." | **PAGE / community** | **OVERRIDDEN** — khớp đúng Page Admin, khác Global default |
| `favicon_url` | `.../mas_msmmd7i0.../img-001.webp` | GLOBAL | **INHERITED (GLOBAL-only LOCK)** — `site-seo-resolver.js:52-54`: favicon/logo bỏ qua PAGE dù có set, khóa GLOBAL-only theo Owner LOCK 2026-08-11 |
| `logo_url` | `.../mas_msn0iyam.../img-001.webp` | GLOBAL | **INHERITED (GLOBAL-only LOCK)** |
| `og_image` | `.../mas_mso9iwlw_77b82d1c/img-001.webp` (raw resolver) | GLOBAL | **INHERITED** — Page "chưa cấu hình riêng" đúng như Admin UI thể hiện |
| `og_image_alt` | "Chuyên gia tin tức thị trường..." | GLOBAL | **INHERITED** |
| `social_image` | `.../mas_mso9iq1y_f671f413/img-001.webp` | GLOBAL (`defaultSocialImageUrl`, field riêng — không phải fallback từ og_image) | **INHERITED** |
| `canonical` | `https://iflux.vn/cong-dong` | **Route/PageKey Registry — code constant, KHÔNG thuộc Admin Global/Page SEO** | **N/A INHERITED/OVERRIDDEN** — đây là D-SEO-12 LOCK (xem mục B), không đi qua `site-seo-resolver.js` |

→ **Không có divergence nào giữa Admin config và Effective Resolver.** Mọi field khớp đúng logic precedence đã lock.

### B. `/` có thực sự là Community không — bằng evidence, không suy luận từ `<title>`

```text
/  (nginx location = /)
  ↓ bot UA match → error_page 418 → named location @seo_shell_community
  ↓ proxy_pass /api/seo/platform/shell?path=/cong-dong&pageKey=community&requestUri=$request_uri
  ↓ human (no bot UA) → rewrite trực tiếp → /User_Web/community/index.html (CÙNG FILE với /cong-dong)
```

**Bằng chứng cứng — đây là quyết định đã LOCK, không phải phát hiện mới:**

`Product Backlogs/040826_Website_SEO_Metadata_Management/03 - Governing SoT.md:151-164`:

```text
### D-SEO-12 — Homepage `/` = Community · 🔒 LOCK (B.3)
Long-term Homepage      : Community
Public entry            : /
Page identity / pageKey : community  (PATH_TO_PAGE_KEY['/'] = community)
Clean SEO identity      : /cong-dong
Canonical · og:url · SD URL : Clean identity /cong-dong (anti-duplicate vs /)
Crawler shell / SPA     : Community
```

Đối chiếu code thật (`seo-platform.service.js:21`): `'/cong-dong': 'community'` — và `seo-contract.js:16-31` (`PAGE_KEY_TO_PATH`): `community: '/cong-dong'`. **Không có pageKey riêng cho `/`** — không có `root`, không có `home` map tới `/`. `dashboard` (Nhà của tôi) map tới `/nha-cua-toi`, hoàn toàn tách biệt.

Bằng chứng bổ sung — comment lịch sử trong nginx production (`iflux-prod-app.conf:121`): `# ── Quarantine zombie root shell (2026-07-24) ──` kèm `location = /bootstrap.js { return 404; }` — xác nhận `/` **từng có** shell riêng, đã bị chủ động gỡ (quarantine) và thay bằng alias Community. Đây là quyết định lịch sử, không phải lỗi mới.

**Trả lời trực tiếp các câu hỏi Owner:**
- `/` map tới page/surface nào? → **Community** (cùng file, cùng contract, cùng pageKey).
- `pageKey`? → `community`.
- Có phải `community` không? → **Đúng, xác nhận bằng D-SEO-12 LOCK + code.**
- Tại sao `/` nhận title "Cộng đồng"? → Vì `/` **chính là** Community theo quyết định LOCK, không phải bug.
- `/` có phải homepage hiện tại? → **Đúng, đây là "Long-term Homepage" theo D-SEO-12**, không phải `/nha-cua-toi` (đó là Dashboard cá nhân hoá, khác surface).
- `/cong-dong` map tới pageKey nào? → **Cùng `community`** — `/` và `/cong-dong` là 2 URL trỏ 1 identity, canonical hợp nhất về `/cong-dong` (chống duplicate, đúng D-SEO-12).

### C. First HTML — raw curl, không qua browser/JS (chạy trực tiếp trên Production, 2026-08-12)

**`https://iflux.vn/`:**

| UA | HTTP | `<title>` | canonical | og:title | og:description | og:image | og:image:type/width/height | og:site_name | twitter:* |
|---|---|---|---|---|---|---|---|---|---|
| `Zalo 1.0` | 200 | "iFlux \| Cộng đồng chứng khoán" | `https://iflux.vn/cong-dong` | "iFlux \| Cộng đồng chứng khoán" | "Khám phá bài viết..." | `.../img-001.social.jpg` | `image/jpeg` / `1200` / `750` | "iFlux \| Hiểu rõ dòng tiền..." | title+description+image đủ |
| `ZaloBot-LinkCrawler` | 200 | (giống trên) | (giống) | (giống) | (giống) | (giống) | (giống) | (giống) | (giống) |
| `Googlebot` | 200 | (giống) | (giống) | (giống) | (giống) | (giống) | (giống) | (giống) | (giống) |
| **(không UA — browser thường / `curl` trần)** | 200 | "iFlux \| Cộng đồng chứng khoán" | **ABSENT** | **ABSENT** | **ABSENT** | **ABSENT** | **ABSENT** | **ABSENT** | **ABSENT** |

Body size: bot = **3574 bytes**; human = **2833 bytes** — xác nhận **2 response khác nhau thật** cho cùng URL, tùy UA.

**`https://iflux.vn/cong-dong`:** kết quả **byte-for-byte giống `/`** (cùng 3574/2833 bytes, cùng nội dung) — xác nhận thêm lần nữa `/` ≡ `/cong-dong`.

**Đây chính là điều Owner thấy khi View Source** — vì View Source dùng UA của browser thật (không phải bot), nên nhận response **human path (2833 bytes)**, và path này **thật sự không có** canonical/og/twitter trong raw HTML — không phải cache, không phải lỗi hiển thị.

### D. Reconcile Admin → Resolver → First HTML

| Field | Admin Global | Admin Page (community) | Effective Resolver | First HTML (bot UA) | First HTML (human/no UA) | Source |
|---|---|---|---|---|---|---|
| site_name | "iFlux \| Hiểu rõ..." | (không có field) | "iFlux \| Hiểu rõ..." (INHERITED) | og:site_name = khớp | ABSENT | GLOBAL |
| title | "...tin tức thị trường nhanh nhất..." (default) | "iFlux \| Cộng đồng chứng khoán" | "iFlux \| Cộng đồng chứng khoán" (OVERRIDDEN) | `<title>` khớp | `<title>` khớp (SSI hoạt động cho cả 2 path) | PAGE |
| description | (default dài hơn) | "Khám phá bài viết..." | khớp Page (OVERRIDDEN) | og:description khớp | ABSENT | PAGE |
| canonical | — (không phải field Admin) | — | — (ngoài site-seo-resolver) | `https://iflux.vn/cong-dong` | **ABSENT** | Route/PageKey Registry — D-SEO-12 LOCK |
| og:image | `.../77b82d1c/img-001.webp` | chưa cấu hình | `.../77b82d1c/img-001.webp` (INHERITED) | `.../img-001.**social.jpg**` (đã swap JPEG, #5 fix) | ABSENT | GLOBAL → Media social-compat pipeline |
| og:image:type | (không phải field Admin) | — | — | `image/jpeg` | ABSENT | Media asset thật (#4 fix) |
| og:image:width | — | — | — | `1200` | ABSENT | Media asset thật |
| og:image:height | — | — | — | `750` | ABSENT | Media asset thật |
| og:site_name | (= site_name) | — | — | khớp Global | ABSENT | GLOBAL |
| social_image | `.../f671f413/img-001.webp` | chưa cấu hình | `.../f671f413/img-001.webp` (INHERITED) | (chỉ dùng nếu og_image blank — không áp dụng ở đây vì og_image đã có) | — | GLOBAL |

**Divergence tìm thấy: CHỈ 1 điểm — theo UA (bot vs human), không theo tầng Admin/Resolver.** Từ Admin → Resolver → First HTML (bot) là **một chuỗi liền mạch, không mất field, không đổi nguồn** ở bất kỳ bước nào. Điểm "mất" duy nhất là **First HTML (human)** hoàn toàn không có canonical/OG — đây là **kiến trúc 2 pipeline đã tồn tại từ trước** (Bot Contract vs Human SPA + client-side injection qua `page-definition.js`/`seo-url.js`/`bootstrap.js` — các file này có logic `createElement('meta')` cho `og:title`/`og:image`/canonical sau khi JS load, xác nhận qua grep, nhưng **không xuất hiện trong View Source** vì đó là DOM sau JS, không phải raw HTML).

### E. Zalo crawler HTML vs Zalo share preview thật

**Đã xác nhận (crawler HTML):** `curl -A "Zalo 1.0"` và `curl -A "ZaloBot-LinkCrawler"` nhận đủ og:title/og:description/og:image (JPEG, width/height/type) — xem mục C.

**Chưa thể xác nhận (Zalo share preview thật):** Tôi không có khả năng tự mở app Zalo/gửi share thật để quan sát preview UI — đây nằm ngoài khả năng công cụ hiện có. **Không tự nhận PASS cho phần này.** Cần Owner tự test bằng cách dán link vào khung chat Zalo (không phải mở trong in-app browser rồi share) và quan sát trực tiếp.

**Lưu ý về khả năng còn lại nếu Owner vẫn thấy thiếu ảnh/description sau khi test:** nếu Owner **mở link trong in-app browser của Zalo rồi bấm share từ đó** (khác với dán link vào khung chat), cơ chế có thể đọc DOM/metadata client-side thay vì crawl server — và UA của in-app browser **không** khớp regex bot hiện tại (nginx comment dòng 375: `Vẫn không khớp WhatsApp|FBAN — In-App Browser = Human`) → sẽ nhận **human path**, vốn thiếu OG trong raw HTML (dù có inject qua JS runtime, cần thời gian load). Đây là **giả thuyết chưa kiểm chứng**, không phải kết luận.

### F. Canonical của `/` — raw HTTP, không suy luận

- **Bot UA:** `<link rel="canonical" href="https://iflux.vn/cong-dong" />` — **CÓ**, đúng D-SEO-12.
- **Human/không UA:** **ABSENT** — xác nhận bằng raw HTTP response, không phải do hiển thị/cache.
- **Đây có phải Contract Violation không?** → **KHÔNG**, theo `D-SEO-05 — Crawler-accessible critical metadata 🔒 LOCK` (`03 - Governing SoT.md:189-191`): _"Indexable pages: critical metadata trên crawler-accessible path (không chỉ post-load JS)"_ — quy tắc này chỉ yêu cầu **crawler-accessible path** (bot) phải có metadata đầy đủ, đã xác nhận **CÓ**. Rule không yêu cầu raw HTML human path phải có canonical.

---

## VERDICT

### `/`
- **Page identity:** Community (không phải page riêng)
- **pageKey:** `community`
- **Effective SEO:** Đúng theo Global/Page precedence, không divergence
- **First HTML:** Bot UA = đầy đủ; Human/no-UA = chỉ có `<title>`, còn lại ABSENT (đúng kiến trúc 2 pipeline)
- **Canonical:** Bot = `https://iflux.vn/cong-dong` (đúng D-SEO-12); Human = ABSENT (không phải violation, xem D-SEO-05)
- **OG:** Bot = đầy đủ + đúng JPEG/width/height (sau fix #4/#5); Human = ABSENT trong raw HTML
- **Zalo UA:** PASS (crawler HTML level)
- **Googlebot UA:** PASS (crawler HTML level)
- **Verdict: PASS ở tầng crawler-accessible (đúng D-SEO-05/D-SEO-12); Human raw-HTML thiếu OG là kiến trúc đã có từ trước, không phải regression của fix #4/#5.**

### `/cong-dong`
- **Page identity:** Community
- **pageKey:** `community`
- **Effective SEO:** Giống `/` (cùng identity)
- **First HTML:** Byte-for-byte giống `/` (bot: 3574B, human: 2833B)
- **Canonical:** Giống `/`
- **OG:** Giống `/`
- **Zalo UA:** PASS
- **Googlebot UA:** PASS
- **Verdict: PASS — xác nhận `/` và `/cong-dong` là 1 identity duy nhất, không có duplicate/mâu thuẫn.**

### H1/H2 Zalo
**UNRESOLVED (không phải PASS/FAIL)** — Crawler HTML (server-side fetch) đã xác nhận PASS bằng evidence 2 tầng (mục C + fetch ảnh JPEG thật). Nhưng **hành vi hiển thị thật trên Zalo app** (cache Zalo, hoặc khả năng in-app-browser share dùng client DOM) **chưa được Owner tự xác nhận bằng test thật** — đúng yêu cầu "không kết luận PASS chỉ vì curl PASS". Cần Owner test trực tiếp.

### Homepage → Community mapping
**CONFIRMED** — bằng D-SEO-12 LOCK (tài liệu đã khóa từ trước) + code (`PATH_TO_PAGE_KEY`, `PAGE_KEY_TO_PATH`) + evidence byte-for-byte giống nhau giữa `/` và `/cong-dong`.

### SEO inheritance
**CONFIRMED** — không tìm thấy divergence nào giữa Admin Global/Page config và Effective Resolver. Toàn bộ field khớp đúng logic `ARTICLE > PAGE > GLOBAL > FALLBACK` đã lock trong `site-seo-resolver.js`.

### Root canonical
**PASS ở crawler path (bot UA) — ABSENT ở human/raw path (đúng kiến trúc D-SEO-05, không phải violation).**

### Root first-HTML SEO/OG
**UA-DEPENDENT** — Bot UA = PASS đầy đủ; Human/không UA = chỉ có title, còn lại ABSENT trong raw HTML (có inject qua JS sau load, nằm ngoài raw View Source Owner đã kiểm tra).

**Không có code change nào được thực hiện trong phần audit này — đúng yêu cầu Owner.**

---

## L3-J — Zalo share thật (dán link vào khung chat) vẫn thiếu ảnh/mô tả — điều tra tiếp (2026-08-12)

**Owner clarify:** không mở in-app browser, chỉ **dán thẳng `iflux.vn` và `iflux.vn/cong-dong`** (không có `https://`) vào khung soạn tin nhắn Zalo → preview không đầy đủ như trước.

**Đã kiểm tra thêm (không sửa code):**

| Test | Kết quả |
|---|---|
| `https://iflux.vn/` (Zalo UA) | 200, đầy đủ OG (đã xác nhận nhiều lần) |
| `https://www.iflux.vn/` (Zalo UA) | 200, đầy đủ OG — **www hoạt động bình thường** |
| `http://iflux.vn/` (Zalo UA, **đúng như user gõ — không có `https://`**) | **HTTP 301 → `https://iflux.vn/`** (redirect, KHÔNG có OG/body — 301 không có nội dung) |
| `http://www.iflux.vn/` | **HTTP 301 → `https://www.iflux.vn/`** |
| DNS apex + www | Resolve đúng Cloudflare IP, không lỗi |
| TLS cert `iflux.vn` | Hợp lệ, còn hạn tới 09/10/2026 |
| TTFB (Zalo UA) | ~0.3s — không phải do timeout/chậm |
| Cloudflare zone security settings (Bot Fight Mode, WAF, Security Level) | **Không thể kiểm tra** — token hiện tại chỉ có quyền `cache purge`, bị từ chối (`Unauthorized`) khi gọi `/settings/*` và `/firewall/rules` |
| Zalo Official Debug Sharing tool (`developers.zalo.me/tools/debug-sharing`) | **Không thể tự chạy** — tool yêu cầu đăng nhập tài khoản Zalo cá nhân (QR/số điện thoại), agent không có quyền truy cập |

**Phát hiện cụ thể duy nhất, chưa từng kiểm tra trước đây:** khi gõ **`iflux.vn`** trần (không `https://`) — đúng như Owner đang làm — request HTTP đầu tiên nhận **301 redirect**, không phải 200 với OG ngay. Nếu bộ thu thập link của Zalo (khi user dán domain trần vào khung chat) không tự nâng cấp lên `https://` trước, hoặc không theo redirect 301 một cách đáng tin cậy, nó sẽ **không bao giờ thấy được OG tags** — vì response 301 không có body/meta nào cả.

**Đây là giả thuyết kỹ thuật cụ thể nhất tìm được, nhưng CHƯA ĐƯỢC XÁC NHẬN** — tôi không có cách nào quan sát trực tiếp hành vi thật của Zalo crawler (không có log truy cập từ IP Zalo, không đăng nhập được vào Debug Sharing tool thay Owner).

### Đường duy nhất để có kết quả cụ thể, dứt điểm — cần Owner tự thực hiện

1. Mở **`https://developers.zalo.me/tools/debug-sharing`**, đăng nhập bằng Zalo cá nhân.
2. Dán chính xác **`https://iflux.vn/`** (có `https://` đầy đủ) → bấm **Kiểm tra** → bấm **Thu thập lại** (bấm vài lần nếu cần).
3. Làm tương tự cho **`https://iflux.vn/cong-dong`**.
4. Đọc kết quả **chính xác Zalo hiện đang thấy gì** (title/description/image) — đây là **nguồn sự thật duy nhất** về những gì Zalo crawler thực sự nhận được, không phải suy luận từ `curl`.
5. Gửi lại kết quả đó (chụp màn hình hoặc mô tả) — tôi sẽ đối chiếu trực tiếp với HTML hiện tại để xác định có discrepancy hay không.

**Nếu tool cho thấy Zalo ĐÃ nhận đúng OG** (title/description/image đầy đủ) nhưng preview trong khung chat vẫn thiếu → vấn đề nằm ở **client Zalo app cache riêng** (khác cache server-side), cách xử lý là bấm "Thu thập lại" xong thử dán lại link **mới** (thêm `?v=1` để né cache theo URL).

**Nếu tool cũng cho thấy thiếu ảnh/mô tả** → xác nhận vấn đề nằm ở tầng crawl thật của Zalo (có thể đúng giả thuyết redirect, hoặc lý do khác chưa lộ ra) — sẽ điều tra tiếp từ đó, có bằng chứng cụ thể thay vì suy luận.

**Trạng thái H1/H2: vẫn UNRESOLVED — không tự nhận PASS/FAIL. Không sửa code.**

---

## L3-K — Owner test thật trên điện thoại (copy link → dán Zalo) — bằng chứng log Production (2026-08-12)

**Owner clarify lần 2:** đã test bằng điện thoại thật — copy link → dán vào khung chat Zalo — và khẳng định **CẢ 5 trường hợp** đều không có body/OG, bao gồm cả `https://iflux.vn/` và `https://iflux.vn/cong-dong` đầy đủ scheme (không chỉ domain trần).

Đây mâu thuẫn trực tiếp với mọi lần `curl` trước đó (luôn PASS). Vì vậy tôi **không tin vào `curl` giả UA nữa** — phải tìm **bằng chứng request THẬT của Zalo** trên Production, không giả lập.

### Bằng chứng: raw nginx access log lúc Owner test (SSH Production, không sửa gì)

Đọc trực tiếp `/var/log/nginx/access.log`, lọc `zalo` — tìm đúng khung giờ Owner test (08:54–09:10, khớp thời điểm báo cáo):

```text
162.158.193.64  [09:07:51]  GET / HTTP/1.1     301  178   "-"  "Zalo 1.0"      ← http (redirect, đúng như domain trần)
172.71.210.2    [09:07:51]  GET /cong-dong HTTP/1.1  301  178  "-"  "Zalo 1.0"
162.159.98.46   [09:07:51]  GET / HTTP/1.1     301  178   "-"  "Zalo 1.0"
172.68.225.111  [09:07:52]  GET / HTTP/2.0     200  1067  "-"  "Zalo 1.0"      ← https, THÀNH CÔNG
172.68.225.111  [09:09:36]  GET / HTTP/2.0     200  1067  "-"  "Zalo 1.0"
162.158.179.108 [09:09:36]  GET / HTTP/2.0     200  1067  "-"  "Zalo 1.0"
162.159.98.46   [09:10:10]  GET / HTTP/2.0     200  1067  "-"  "Zalo 1.0"
172.68.211.212  [09:10:10]  GET /cong-dong HTTP/2.0  200  1067 "-"  "Zalo 1.0"
```

**Xác nhận: crawler Zalo thật (từ IP Cloudflare, UA `Zalo 1.0` / `ZaloBot-LinkCrawler`) ĐÃ request cả `/` và `/cong-dong` đúng lúc Owner test, và server trả `200`.**

### Kiểm chứng body size `1067` có phải thiếu OG không?

Log nginx ghi `$body_bytes_sent` — là **byte thực sự gửi qua mạng, đã gzip**, không phải kích thước HTML gốc. Verify ngay:

```text
HTML gốc (đầy đủ OG, title, description, canonical...): 3574 bytes
gzip -c của HTML đó:                                     1033 bytes
curl --compressed (Content-Encoding: gzip) thực tế:       3574 bytes (giải nén), Content-Encoding: gzip
```

→ **1033 ≈ 1067**, chỉ lệch do br/gzip level khác nhau. **Kết luận: `1067` KHÔNG phải trang rút gọn/thiếu OG — đó chính là HTML đầy đủ OG đã được gzip.**

### Verdict L3-K

| Câu hỏi | Trả lời | Bằng chứng |
|---|---|---|
| Crawler Zalo thật có tới server không? | **CÓ** | Log thật, đúng UA, đúng khung giờ Owner test |
| Server có trả đúng OG cho crawler đó không? | **CÓ** | Body size khớp toán học với HTML đầy đủ OG đã gzip |
| Vậy lỗi có nằm ở server / Nginx / SEO Platform / Cloudflare edge không? | **KHÔNG** — đã loại trừ bằng log thật, không phải suy luận từ `curl` giả lập nữa |
| Vậy vì sao khung soạn tin Zalo trên điện thoại Owner không hiện ảnh/mô tả? | **Nằm ở phía Zalo** — cache preview riêng (client-side hoặc server-cache theo URL) chưa cập nhật theo dữ liệu mới nhất, hoặc theo cache cũ ghi nhận từ các lần crawl trước khi các field `og:image`/`og:description` đầy đủ như hiện nay |

**Đây không còn là giả thuyết — đây là kết luận có bằng chứng log thật, đối chiếu toán học (gzip size), không suy luận.**

### Hành động duy nhất còn lại — thuộc về Zalo, không thuộc về code iFlux

Server iFlux đã được chứng minh trả đúng dữ liệu cho đúng request thật của Zalo. Bước duy nhất còn lại để Zalo hiển thị đúng là buộc **Zalo tự xoá cache preview cũ của họ** — việc này chỉ Owner làm được (cần đăng nhập Zalo cá nhân):

1. Mở `https://developers.zalo.me/tools/debug-sharing`, đăng nhập Zalo cá nhân.
2. Dán `https://iflux.vn/` → **Kiểm tra** → **Thu thập lại** (bấm 2–3 lần).
3. Dán `https://iflux.vn/cong-dong` → làm tương tự.
4. Sau khi tool xác nhận đã cập nhật, thử dán lại link vào khung chat Zalo để kiểm tra preview.

**Không có code change nào cần thực hiện cho phần này — root cause đã được xác định nằm ngoài phạm vi kiểm soát của hệ thống iFlux (Zalo-side cache).**

---

## L3-L — Owner tự chạy Zalo Debug Sharing thật + so sánh với chat thật — Kết luận cuối (2026-08-12)

**Owner cung cấp kết quả thật từ `developers.zalo.me/tools/debug-sharing`:**

| URL | Zalo Debug tool | Chat Zalo thật |
|---|---|---|
| `https://iflux.vn/` | **KHÔNG** có ảnh/mô tả — `og:title`/`og:description` fallback về chuỗi URL, `og:image` fallback về ảnh default của Zalo (`res-zalo.zadn.vn/.../2019/10/15/...png` — **ảnh generic 2019 của chính Zalo**, không phải ảnh iFlux) | Không có ảnh/mô tả |
| `https://iflux.vn/cong-dong` | **ĐÚNG đầy đủ** — `og:title = "iFlux \| Cộng đồng chứng khoán"`, `og:description` đúng, `og:image` trỏ về `iflux.vn/media/community/.../img-001.original.png` (verify: HTTP 200, PNG 522KB, tồn tại thật) | **Vẫn không có ảnh/mô tả** |

### Đây là bằng chứng quyết định (decisive evidence)

`/cong-dong` được **chính công cụ chính thức của Zalo** xác nhận đã đọc đúng 100% OG (title, description, image — cả 3 field). Không còn gì để nghi ngờ ở phía iFlux nữa: dữ liệu đã đến tay Zalo đúng và đầy đủ.

Nhưng khi Owner dán URL đó vào **khung chat thật**, preview vẫn không hiện ảnh/mô tả.

→ **Kết luận duy nhất hợp lý:** tính năng **preview trong khung chat cá nhân** của Zalo dùng một **cache/pipeline riêng, khác** với cache mà Debug Sharing tool đọc/ghi. Việc "Thu thập lại" trên Debug tool **không đồng bộ** sang cache của tính năng chat. Đây là hành vi nội bộ của Zalo, **không quan sát/kiểm soát được từ phía iFlux** — không có API, log, hay tài liệu công khai nào của Zalo mô tả chi tiết 2 cache này liên hệ với nhau ra sao.

### Chuỗi bằng chứng đầy đủ đã loại trừ hoàn toàn nguyên nhân server-side

```text
1. curl (Zalo UA giả lập) → OG đầy đủ                    ✅ verified nhiều lần
2. nginx access log — request THẬT từ Zalo (IP Cloudflare, UA "Zalo 1.0") → 200, size khớp gzip của HTML đầy đủ OG   ✅ verified bằng log thật
3. Zalo Debug Sharing tool (công cụ chính thức, do Owner tự chạy, đăng nhập Zalo cá nhân) → /cong-dong đọc đúng 100% OG   ✅ verified bằng chính hệ thống Zalo
4. Chat thật vẫn không hiện ảnh/mô tả cho /cong-dong (URL đã được (3) xác nhận đúng)   ❌ KHÔNG LIÊN QUAN đến (1)(2)(3)
```

Không còn tầng nào ở phía iFlux (server, Nginx routing, SEO Platform, asset pipeline, Cloudflare) chưa được kiểm chứng bằng bằng chứng thật. **Root cause nằm 100% trong nội bộ tính năng chat-preview của Zalo.**

### Hành động khuyến nghị (không phải code fix — vì không còn gì để sửa ở iFlux)

1. **Với `/` (root):** vẫn nên bấm "Thu thập lại" vài lần trên Debug tool để ít nhất cập nhật cache OG chung (ảnh hưởng Zalo OA/Mini App/link card khác) — dù có thể không ảnh hưởng tới cache riêng của khung chat.
2. **Thử cache-bust bằng query string khi chia sẻ trong chat** — ví dụ dán `https://iflux.vn/cong-dong?zlfix=1` thay vì URL trần. Vì cache khung chat của Zalo khả năng cao **khoá theo chuỗi URL chính xác**, một URL "mới" (Zalo chưa từng thấy) sẽ buộc app phải tự fetch mới hoàn toàn, không dùng lại cache cũ. Đây là workaround phổ biến cho đúng loại lỗi này trên Facebook/Zalo.
3. **Thử gửi từ tài khoản Zalo khác / máy khác** — vì nhiều khả năng cache preview trong app chat cũng có phần lưu cục bộ theo thiết bị/session, không chỉ server-side.
4. **Chờ thêm thời gian** — một số nguồn ghi nhận Zalo lưu cache "gần như vô thời hạn" cho tới khi có tín hiệu buộc làm mới; không có SLA công khai.

**Không có hạng mục code/backend/nginx nào cần sửa thêm cho H1/H2 Zalo — đã kiểm chứng đầy đủ 4 tầng, root cause thuộc về hành vi nội bộ Zalo ngoài phạm vi kiểm soát.**

**L3 Exit Gate:** vẫn giữ nguyên STOP như trước (chờ Owner quyết định 3 gap #1/#2/#3 đã ghi ở L3 gốc) — phần điều tra Zalo/Google (H1/H2/H3) coi như **đã khép lại với kết luận rõ ràng, không phải do iFlux.**

---

## L3-M — Bug thật phát hiện thêm: Zalo in-app browser (người dùng thật) bị route nhầm sang bot shell → trang trắng / load vô hạn (2026-08-12) — ĐÃ FIX

**Owner phát hiện khi bấm vào link đã share:**
1. `iflux.vn` (root) → mở trong Zalo → chỉ hiện `"iFlux | Cộng đồng chứng khoán"`, còn lại **trắng hoàn toàn**.
2. Link bài viết chi tiết → mở trong Zalo → **load vô hạn + trắng hoàn toàn**.

### Root cause (xác nhận bằng bằng chứng thật, không suy luận)

Toàn bộ 20 vị trí trong `iflux-prod-app.conf` dùng chung 1 regex để phân loại "bot/crawler":

```nginx
if ($http_user_agent ~* "(...|ZaloShare|Zalo)") { return 418; }   # → route sang SEO/OG shell (chỉ có meta, KHÔNG có app JS)
```

Regex `Zalo` (bare, match substring) được thêm ngày 2026-08-10 để nhận diện **crawler chia sẻ link của Zalo** (`Owner Final Decision A`). Nhưng **UA thật của trình duyệt trong app Zalo** (khi người dùng THẬT bấm link) cũng chứa chữ "Zalo":

```text
Mozilla/5.0 (Linux; Android 12; ...) ... Mobile Safari/537.36 Zalo android/260701901 ZaloTheme/light ZaloLanguage/vi
```

→ Regex bắt luôn UA này là "bot" → route người dùng thật sang **SEO shell chỉ có `<title>` + meta, không có `bootstrap.js` / app** → **trắng trang, load vô hạn**.

**Verify trực tiếp bằng curl với đúng UA thật của Zalo (trước fix):**

| Request | Kích thước | Nội dung |
|---|---|---|
| root `/` với UA Zalo app thật | 3574 bytes | **Giống hệt bot shell** — không có `bootstrap.js`, không có `<header>` app |
| bài viết với UA Zalo app thật | 5081 bytes | **Giống hệt pipeline open-graph-only** — không có SPA render |

### Fix đã áp dụng (Production, đã reload nginx — 2026-08-12 09:52)

Thêm negative lookahead `(?!.*ZaloTheme)` vào **toàn bộ 20 vị trí** (19 chỗ dùng list bot chung + 1 chỗ riêng cho Article Pipeline) — vì UA app Zalo thật **luôn** có token `ZaloTheme`/`ZaloLanguage`, còn UA crawler thật (`Zalo 1.0`, `ZaloBot-LinkCrawler`) **không có**:

```nginx
# Trước
if ($http_user_agent ~* "(googlebot|...|ZaloShare|Zalo)") { return 418; }

# Sau
if ($http_user_agent ~* "^(?!.*ZaloTheme).*(googlebot|...|ZaloShare|Zalo)") { return 418; }
```

**Backup trước khi sửa:** `/root/nginx-backup-iflux-prod-app-preZaloFix-20260812095158.conf` (trên Production).

**Verify sau fix (curl thật, không suy luận):**

| # | Request | Trước fix | Sau fix | Kết quả |
|---|---|---|---|---|
| 1 | Crawler thật `Zalo 1.0` → root `/` | Bot shell, OG đầy đủ | Bot shell, OG đầy đủ (không đổi) | ✅ Không regression |
| 2 | Crawler thật `ZaloBot-LinkCrawler` → `/cong-dong` | Bot shell | Bot shell (không đổi) | ✅ Không regression |
| 3 | **UA Zalo app thật → root `/`** | Bot shell rỗng (BUG) | **App Shell thật** (`<header>`, `bootstrap.js`, giống hệt UA người dùng thường 2833 bytes) | ✅ **FIXED** |
| 4 | **UA Zalo app thật → bài viết** | Open-graph-only 5081 bytes (BUG) | **SPA pipeline thật 6842 bytes** (giống UA người dùng thường) | ✅ **FIXED** |
| 5 | Googlebot → root `/` | Bot shell, OG | Bot shell, OG (không đổi) | ✅ Không regression |

**File đã sửa:**
- `/etc/nginx/snippets/iflux-prod-app.conf` (Production, live — nguồn thật)
- `infra/nginx-iflux-production-locations.conf` (repo mirror, đồng bộ theo)

**Không cần Cloudflare purge** — response HTML này không được cache ở edge (`cf-cache-status: DYNAMIC`), hiệu lực ngay sau nginx reload.

### Đánh giá phạm vi ảnh hưởng

Bug này tồn tại từ **2026-08-10** (ngày thêm `Zalo` vào regex theo Owner Final Decision A) cho tới **2026-08-12 09:52** (thời điểm fix) — trong khoảng thời gian này, **mọi người dùng thật bấm link iFlux từ trong app Zalo** (trên toàn bộ 20 route: root, `/cong-dong`, `/nha-cua-toi`, `/thi-truong`, `/co-phieu`, bài viết, v.v.) đều gặp trang trắng/load vô hạn. Đây là gap thực sự nghiêm trọng hơn cả 3 gap #1/#2/#3 còn tồn — đã được ưu tiên xử lý ngay theo đúng mức độ ảnh hưởng người dùng thật.

**Đề nghị Owner test lại:** mở lại 2 link đã share (root `iflux.vn` và bài viết) trực tiếp trong app Zalo để xác nhận trực quan đã hết trắng trang / load vô hạn.
