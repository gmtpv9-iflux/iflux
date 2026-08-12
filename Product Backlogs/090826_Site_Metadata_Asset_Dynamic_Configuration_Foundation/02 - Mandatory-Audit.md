# 02 — Mandatory Audit

# Site Metadata, Asset & Dynamic Configuration Foundation

| | |
|--|--|
| **Task ID** | `090826_Site_Metadata_Asset_Dynamic_Configuration_Foundation` |
| **BRD** | [`01 - Business Requirement.md`](01%20-%20Business%20Requirement.md) · **§16 BR Checklist Registry** |
| **Document** | Mandatory Audit — sinh từ **BR Checklist** (Governance §2.1 / §2.3) |
| **Date** | 2026-08-09 |
| **Rev** | **A** — first full atomic audit · **Owner APPROVED 2026-08-09** |
| **Evidence** | Repo `Admin_Design_system/` · `User_Web/` · `backend/` · `infra/` · Production `https://iflux.vn` (curl head/favicon) |
| **BRD lock** | 🔒 **OWNER LOCKED** (2026-08-09) · §16 bất biến |
| **Audit status** | ✅ **OWNER APPROVED** · SoT = 🔒 APPROVED · Solution chờ LOCK · Plan / Implementation **NOT AUTHORIZED** |
| **Related** | Prerequisite cho epic SEO `040826_Website_SEO_Metadata_Management` (**⏸ PENDING**) |
| **Next gate** | Owner REVIEW / LOCK Solution → Plan → Implementation |

> **Flow note:** Chuẩn Governance = **BRD LOCK → Audit APPROVE → SoT APPROVE**. Lần này Owner cho phép ngoại lệ thứ tự (Audit trước BRD Lock); đã chỉnh lại — **không lặp**.

> Audit trả lời: **hiện trạng đối với từng BR / Req ID là gì?**  
> Audit **không** thay đổi requirement BRD và **không** khóa Solution / Plan / Implementation.  
> Form: [`Product Backlogs Governance.md`](../Product%20Backlogs%20Governance.md) **§2.3**.

---

## 0. Executive Verdict

| # | Finding | Severity | BR |
|---|---------|----------|-----|
| V1 | **Không có Foundation thống nhất Global → Page → Article** — không có resolver precedence chung; không có schema scope ba tầng cho metadata/config SEO-related | 🔴 Critical | BR-06,07,12 |
| V2 | **Global Admin chỉ name + tagline** (`marketing_brand_identity`) — thiếu description, favicon, logo, default SEO title/desc/OG/social; **runtime public không đọc** brand DB | 🔴 Critical | BR-01,05,08 |
| V3 | **Logo/favicon Admin code orphan** (`brand-identity-page.js` + localStorage) — **không** gắn vào live `brand-identity.html`; authority song song chết | 🟠 High | BR-01.3–01.4, BR-02, BR-06 |
| V4 | **Page Settings = widget placement**, không phải Page SEO/config metadata — page title/meta hiện tại = static HTML + `*.manifest.js` | 🔴 Critical | BR-03,05 |
| V5 | **Article SEO là path chín nhất**: Admin form + `community_posts.payload` + nginx Pipeline A/B + client `applyPostSeoToDocument` — nhưng **không inherit** Page/Global; OG/social image = derived (cover), không field riêng | 🟠 High | BR-04,08,09 |
| V6 | **Asset foundation chỉ cho Community Media Library** (article) — không phải Global/config asset authority; không standalone Media Admin page | 🟠 High | BR-02 |
| V7 | **Dual authority site name**: DB brand name vs hardcode `iFlux` trong shells / `resolveArticleMetadata.site_name: 'iFlux'` | 🔴 Critical | BR-06.5–06.10, BR-08.9 |
| V8 | **Public hub first HTML ≈ title-only**; `favicon.ico` Prod **404**; không `<link rel="icon">` trên User_Web shells | 🔴 Critical | BR-01.3, BR-08.8, BR-09 |
| V9 | **Category SEO** tồn tại (Admin + DB) nhưng **User_Web không consume** — adjacent gap, không thay Page foundation | 🟡 Medium | BR-03 / adjacent |
| V10 | **BR-12 đúng hướng**: SEO epic (`040826`) đang PENDING vì thiếu foundation này — hiện SEO phải “tự mang” infrastructure | 🟢 Evidence OK (dependency) | BR-12 |

### Root Cause (hiện trạng) — KHÓA cho Foundation

```text
ROOT CAUSE
─────────────────────────────────
Không có Site Configuration Foundation
(Global / Page / Article + Asset + shared authority)
        ↓
Metadata / brand / assets phân tán:
  · hard-coded HTML / SVG / manifests
  · brand DB hẹp (name/tagline) — không wire runtime
  · orphan localStorage brand assets
  · Page Settings = placement (sai domain nếu dùng làm SEO)
  · Article SEO ad-hoc (chỉ community posts)
  · Media Library chỉ article
        ↓
Không có inheritance Global → Page → Article
        ↓
SEO / metadata optimization downstream
không có nền tảng tái sử dụng (BR-12)
```

**Không phải root cause:** “thiếu SEO strategy” — đó là epic `040826`. Task này thiếu **capability nền** để Admin cấu hình + persist + runtime consume thống nhất.

### Scope model (Audit xác nhận nhận thức)

```text
GLOBAL   — default site identity + default metadata + brand assets
PAGE     — override theo public page
ARTICLE  — override theo article
ASSET    — upload → validate → persist → reference → configure → runtime

Precedence (BRD §6 — chưa implement):
Article > Page > Global > (fallback policy)
```

Audit **không khóa** table name / API / Admin route — thuộc SoT/Solution sau APPROVE.

---

## 1. Evidence packs (shared)

### 1.1 AUD-OWN — Configuration ownership

| Scope | Status | Owner hiện tại | Evidence |
|-------|--------|----------------|----------|
| Global name/tagline | FOUND (narrow) | Admin Brand + DB `marketing_brand_identity` | `brand-identity.html` · `AdmWaveD.initBrand` · migration `034_wave_d_meta_community.sql` |
| Global favicon/logo/defaults SEO/OG | NOT_FOUND (live) | Orphan localStorage only | `brand-identity-page.js` / `brand-identity-store.js` **không** load bởi HTML live |
| Page SEO config | NOT_FOUND | Code: static `<title>` + manifests | `User_Web/**/index.html` · `pages/*.manifest.js` · `page-definition.js` |
| Page placement | FOUND (khác domain) | Page Settings publish | `page-settings.html` · `page_published_versions` |
| Article SEO | FOUND (partial) | Community article Admin + payload | `content/edit.html` · `community-articles.service.js` |
| Category SEO | FOUND (ignored runtime) | Categories Admin + columns | `018_community_categories.sql` · User_Web **không** đọc |
| Site name in public meta | HARDCODE | `resolveArticleMetadata` | `site_name: 'iFlux'` |

### 1.2 AUD-ASSET — Asset

| Capability | Status | Evidence |
|------------|--------|----------|
| Article media upload/persist/MIME/size/usages | FOUND | `043_community_media_library.sql` · `/api/admin/media` · `media-process.js` |
| Global brand asset persist | NOT_FOUND | Live brand PATCH chỉ `{ name, tagline }` |
| Favicon public | FAIL / NOT_FOUND | Prod `GET /favicon.ico` → **404**; User_Web không `rel=icon` |
| Asset reuse for config scopes | PARTIAL | `media_usages` chỉ `article_id` + field_ref |

### 1.3 AUD-REN — Runtime / HTML

| Surface | Status | Evidence |
|---------|--------|----------|
| Hub `/home` first HTML | title-only | curl: `<title>Nhà của tôi · iFlux</title>` — không description/OG/favicon |
| Article Pipeline A/B | FOUND | nginx `open-graph` / `spa` · `buildArticleMetadataHeadHtml` |
| Brand DB → public head | NOT_FOUND | Không public API / không User_Web fetch brand |
| Inheritance resolver | NOT_FOUND | Không module Global→Page→Article |

### 1.4 AUD-ADM — Admin surfaces

| Surface | Status | Evidence |
|---------|--------|----------|
| Global Brand (name/tagline) | FOUND | `/admin/tiep-thi/brand-identity` · perm `marketing.brand_identity.*` |
| Global Brand (assets/SEO defaults) | MISSING | — |
| Page Settings (widgets) | FOUND | `/admin/he-thong/page-settings` · `interface.page_settings.*` |
| Page SEO config | MISSING | — |
| Article SEO | FOUND | Community content edit — SEO title/desc/keywords/canonical + cover |
| Article dedicated OG/social fields | MISSING | Image derived từ cover/`seo.og_image` |
| Inherited vs override indicator | MISSING | — |

---

## 2. Audit Checklist — từng atomic BR (§16)

**Status legend:** `FOUND` = capability khớp BR hiện tại · `PARTIAL` = một phần · `MISSING` = không có · `FAIL` = có nhưng trái / không wire · `NOT_EVIDENCED` = lớp evidence áp dụng chưa chứng minh đủ · `N/A-SCOPE` = không áp dụng tầng này (ghi rõ).

> Đây là audit **hiện trạng**, không phải Final Verification. Không dùng `PASS` trừ khi capability **đã** thỏa chữ BRD end-to-end (Admin→Authority→Runtime). Hiện gần như không có atomic nào đạt PASS foundation.

### BR-01 — Global Site Configuration

| BR | Req ID | Audit ID | Audit Check | Current State | Evidence (A/B/C) | Gap | Status |
|----|--------|----------|-------------|---------------|------------------|-----|--------|
| BR-01 | BR-01.1 | AUD-01.1 | Admin thiết lập Site Name | Có field + PATCH | A: `brand-identity.html` `adm-brand-name` · B: `marketing_brand_identity.payload.name` · C: Admin Wave D save | Runtime public **không** dùng giá trị này | **PARTIAL** |
| BR-01 | BR-01.2 | AUD-01.2 | Admin thiết lập Site Description | Chỉ có Tagline; không “Site Description” SEO | A: `adm-brand-tagline` · B: `payload.tagline` | Thiếu description field / semantics | **MISSING** |
| BR-01 | BR-01.3 | AUD-01.3 | Admin thiết lập favicon | Orphan UI localStorage; live Admin không có | A: `brand-identity-page.js` unused · C: Prod favicon **404** | Không Admin live + không public | **FAIL** |
| BR-01 | BR-01.4 | AUD-01.4 | Admin thiết lập site logo | Orphan UI; live = SVG hardcode shells | A: orphan store · C: SVG trong `home/index.html` | Không Admin→persist→runtime | **FAIL** |
| BR-01 | BR-01.5 | AUD-01.5 | Default SEO title | Không field / không DB | — | Missing | **MISSING** |
| BR-01 | BR-01.6 | AUD-01.6 | Default meta description | Không | — | Missing | **MISSING** |
| BR-01 | BR-01.7 | AUD-01.7 | Default OG image | Không | — | Missing | **MISSING** |
| BR-01 | BR-01.8 | AUD-01.8 | Default social/share image | Không | — | Missing | **MISSING** |
| BR-01 | BR-01.9 | AUD-01.9 | Global config persistent | Chỉ name/tagline persistent | B: `marketing_brand_identity` | Payload quá hẹp vs BR-01 | **PARTIAL** |
| BR-01 | BR-01.10 | AUD-01.10 | Runtime consume Global | Brand DB **không** được public runtime đọc; article `site_name` hardcode | A: `resolveArticleMetadata` · C: `/home` head | Dual authority | **FAIL** |

### BR-02 — Asset Management Foundation

| BR | Req ID | Audit ID | Audit Check | Current State | Evidence | Gap | Status |
|----|--------|----------|-------------|---------------|----------|-----|--------|
| BR-02 | BR-02.1 | AUD-02.1 | Admin upload asset | Có cho Community Media (article); không Global brand live | A/B/C: `/api/admin/media` · article edit | Global/config upload thiếu | **PARTIAL** |
| BR-02 | BR-02.2 | AUD-02.2 | Persistent asset reference | `media_assets` (+ variants) | B: `043_community_media_library.sql` | Không cover Global config assets | **PARTIAL** |
| BR-02 | BR-02.3 | AUD-02.3 | Asset URL/reference | `public_url` / variants | media service | OK trong domain article media | **PARTIAL** |
| BR-02 | BR-02.4 | AUD-02.4 | MIME validation | `ALLOWED` + `validateImageBuffer` | `media-process.js` | Brand orphan FileReader không cùng pipeline | **PARTIAL** |
| BR-02 | BR-02.5 | AUD-02.5 | Size validation | multer 15MB + process limits | media routes | Brand orphan ≤500KB local — không DB | **PARTIAL** |
| BR-02 | BR-02.6 | AUD-02.6 | Replace asset in config | Article cover/media replace OK; Global không | article edit | Global replacement missing | **PARTIAL** |
| BR-02 | BR-02.7 | AUD-02.7 | Asset reuse | Media library list + usages | `media_usages` | Chỉ article field_ref | **PARTIAL** |
| BR-02 | BR-02.8 | AUD-02.8 | No browser-state authority | Article media: server persist OK; brand orphan = localStorage **vi phạm** nếu dùng | orphan store `iflux_brand_identity_v1` | Dead path vẫn là dual-authority risk | **PARTIAL** (article OK / brand FAIL path) |
| BR-02 | BR-02.9 | AUD-02.9 | Runtime resolve asset | Article cover/OG qua URL; Global favicon/logo **không** | C: favicon 404 | Global resolve missing | **PARTIAL** |
| BR-02 | BR-02.10 | AUD-02.10 | Single asset authority | Media Library vs orphan brand vs hardcode SVG | multiple | **Duplicate authority** | **FAIL** |

### BR-03 — Page-level Configuration

| BR | Req ID | Audit ID | Audit Check | Current State | Evidence | Gap | Status |
|----|--------|----------|-------------|---------------|----------|-----|--------|
| BR-03 | BR-03.1 | AUD-03.1 | Nhận diện config từng public page | Page catalog/keys cho placement tồn tại; **không** page SEO config entity | `page-settings-catalog.js` · publish tables | Nhận diện page ≠ SEO config | **PARTIAL** |
| BR-03 | BR-03.2 | AUD-03.2 | Admin mở khu vực config page | Page Settings = widgets; **không** SEO panel | `page-settings.html` | Missing SEO surface | **MISSING** (SEO) / FOUND (placement) |
| BR-03 | BR-03.3 | AUD-03.3 | Page title | Hardcode HTML/manifest | `documentTitle` · static title | Không Admin SEO title | **FAIL** |
| BR-03 | BR-03.4 | AUD-03.4 | Page description | Sparse `seo.description` in few manifests; catalog “description” = product blurb | manifests · catalog | Không Admin SEO desc | **FAIL** |
| BR-03 | BR-03.5 | AUD-03.5 | Page OG image | Không | — | Missing | **MISSING** |
| BR-03 | BR-03.6 | AUD-03.6 | Page social image | Không | — | Missing | **MISSING** |
| BR-03 | BR-03.7 | AUD-03.7 | Page config persistent | Placement persistent; SEO page **không** | `page_published_versions` | Sai domain nếu coi là SEO | **MISSING** (SEO persist) |
| BR-03 | BR-03.8 | AUD-03.8 | Page override Global | Không có Global SEO → không override | — | Missing chain | **MISSING** |
| BR-03 | BR-03.9 | AUD-03.9 | Không bắt buộc duplicate Global | N/A — chưa có inheritance model | — | — | **MISSING** |
| BR-03 | BR-03.10 | AUD-03.10 | Runtime resolve page effective config | Runtime = code manifests / static HTML | `page-definition.js` | Không Admin authority | **FAIL** |

### BR-04 — Article-level Configuration

| BR | Req ID | Audit ID | Audit Check | Current State | Evidence | Gap | Status |
|----|--------|----------|-------------|---------------|----------|-----|--------|
| BR-04 | BR-04.1 | AUD-04.1 | Article có config riêng | Có `payload.seo` + cover | B: `community_posts` | Content Engine song song (`content_articles`) — ownership khác | **FOUND** (community) |
| BR-04 | BR-04.2 | AUD-04.2 | Admin/editor truy cập | Community article edit | `content/edit.html` | — | **FOUND** |
| BR-04 | BR-04.3 | AUD-04.3 | Article SEO title | Field `fld-seo-title` | article-edit-page | — | **FOUND** |
| BR-04 | BR-04.4 | AUD-04.4 | Article meta description | `fld-seo-desc` | same | — | **FOUND** |
| BR-04 | BR-04.5 | AUD-04.5 | Article OG image | Không field Admin riêng; derive `seo.og_image \|\| cover \|\| body` | `resolveArticleMetadata` | Thiếu dedicated control | **PARTIAL** |
| BR-04 | BR-04.6 | AUD-04.6 | Article social/share image | Không field riêng; dùng cùng image pipeline | same | Missing dedicated | **PARTIAL** |
| BR-04 | BR-04.7 | AUD-04.7 | Article config persistent | payload JSONB | DB | — | **FOUND** |
| BR-04 | BR-04.8 | AUD-04.8 | Override Page/Global | Không có Page/Global SEO foundation để override | — | Chain missing | **MISSING** |
| BR-04 | BR-04.9 | AUD-04.9 | Không bắt buộc duplicate inherited | Article tự fallback title/excerpt/cover nội bộ — **không** Page/Global inherit | resolver local | Sai semantics BRD | **PARTIAL** (local only) |
| BR-04 | BR-04.10 | AUD-04.10 | Runtime resolve article | Pipeline A/B + SPA apply | nginx · community service · seo-url.js | OK trong article scope | **FOUND** |

### BR-05 — Admin Dynamic Configuration Surface

| BR | Req ID | Audit ID | Audit Check | Current State | Evidence | Gap | Status |
|----|--------|----------|-------------|---------------|----------|-----|--------|
| BR-05 | BR-05.1 | AUD-05.1 | Global Admin surface | Có nhưng hẹp (name/tagline) | brand-identity | Thiếu assets + defaults | **PARTIAL** |
| BR-05 | BR-05.2 | AUD-05.2 | Page Admin surface (config BR) | Placement surface ≠ Page metadata config | page-settings | Missing | **MISSING** |
| BR-05 | BR-05.3 | AUD-05.3 | Article Admin surface | Có SEO section | edit.html | OG/social dedicated thin | **PARTIAL** |
| BR-05 | BR-05.4 | AUD-05.4 | Admin xem giá trị hiện tại | Global hẹp; Article OK; Page SEO N/A | — | Incomplete | **PARTIAL** |
| BR-05 | BR-05.5 | AUD-05.5 | Admin chỉnh sửa | Same as 05.4 | — | Incomplete | **PARTIAL** |
| BR-05 | BR-05.6 | AUD-05.6 | Admin lưu | Brand PATCH; Article save; Page SEO không | — | Incomplete | **PARTIAL** |
| BR-05 | BR-05.7 | AUD-05.7 | Admin thay thế asset | Article media/cover OK; Global brand live không | — | Global missing | **PARTIAL** |
| BR-05 | BR-05.8 | AUD-05.8 | UI phản ánh config thực | Brand UI ≠ public output; Article gần khớp | dual site_name | Global FAIL consistency | **PARTIAL** |
| BR-05 | BR-05.9 | AUD-05.9 | Không API-only | Brand có UI; Page SEO không; Media không standalone UI | — | Một phần đạt | **PARTIAL** |
| BR-05 | BR-05.10 | AUD-05.10 | Phù hợp Admin IA/RBAC | Brand + Page Settings + Article đã có route/perm riêng | nav registry · permission-catalog | Cần SoT map IA 3 scope (§8) — chưa đủ capability | **PARTIAL** |

### BR-06 — Persistence & Authority

| BR | Req ID | Audit ID | Audit Check | Current State | Evidence | Gap | Status |
|----|--------|----------|-------------|---------------|----------|-----|--------|
| BR-06 | BR-06.1 | AUD-06.1 | Global persistent storage | Narrow table | `marketing_brand_identity` | Incomplete fields | **PARTIAL** |
| BR-06 | BR-06.2 | AUD-06.2 | Page persistent (config) | Placement yes; SEO no | publish tables | Missing SEO | **MISSING** |
| BR-06 | BR-06.3 | AUD-06.3 | Article persistent | Yes | `community_posts.payload` | — | **FOUND** |
| BR-06 | BR-06.4 | AUD-06.4 | Asset reference persistent | Article media yes | `media_assets` | Global no | **PARTIAL** |
| BR-06 | BR-06.5 | AUD-06.5 | Authority rõ ràng / value | Phân tán | OWN pack | Multiple owners | **FAIL** |
| BR-06 | BR-06.6 | AUD-06.6 | No dual authority | Site name/logo/favicon dual | hardcode vs DB vs orphan | Fail | **FAIL** |
| BR-06 | BR-06.7 | AUD-06.7 | Runtime đọc authority đã lập | Hub/page: code; Article: payload; Brand DB ignored | — | Inconsistent | **FAIL** |
| BR-06 | BR-06.8 | AUD-06.8 | Admin UI cùng authority | Article gần OK; Global Admin≠runtime | — | Global fail | **FAIL** |
| BR-06 | BR-06.9 | AUD-06.9 | Schema hỗ trợ GLOBAL/PAGE/ARTICLE | Không có schema unified 3-scope config | migrations inventory | Missing | **MISSING** |
| BR-06 | BR-06.10 | AUD-06.10 | Không hard-code làm authority chính | Hard-code đang là authority chính cho hub/page/brand assets | shells · manifests · SVG | Fail | **FAIL** |

### BR-07 — Inheritance & Override

| BR | Req ID | Audit ID | Audit Check | Current State | Evidence | Gap | Status |
|----|--------|----------|-------------|---------------|----------|-----|--------|
| BR-07 | BR-07.1 | AUD-07.1 | Global = default | Không implement như default SEO/config | — | Missing | **MISSING** |
| BR-07 | BR-07.2 | AUD-07.2 | Page override Global | Không | — | Missing | **MISSING** |
| BR-07 | BR-07.3 | AUD-07.3 | Article override Page | Không (article chỉ local fallback) | resolver | Missing | **MISSING** |
| BR-07 | BR-07.4 | AUD-07.4 | Article dùng Page khi không override | Không | — | Missing | **MISSING** |
| BR-07 | BR-07.5 | AUD-07.5 | Page dùng Global khi không override | Không | — | Missing | **MISSING** |
| BR-07 | BR-07.6 | AUD-07.6 | Runtime resolve theo precedence | Không resolver chung | — | Missing | **MISSING** |
| BR-07 | BR-07.7 | AUD-07.7 | Empty override không xóa inherited | Policy chưa tồn tại | — | Missing | **MISSING** |
| BR-07 | BR-07.8 | AUD-07.8 | Admin biết riêng vs inherited | Không UI indicator | — | Missing | **MISSING** |
| BR-07 | BR-07.9 | AUD-07.9 | Override semantics nhất quán | Mỗi module tự fallback | article vs manifests vs stock SEO | Fail | **FAIL** |
| BR-07 | BR-07.10 | AUD-07.10 | Không module tự định nghĩa precedence | Hiện **đang** tự định nghĩa | multiple paths | Fail | **FAIL** |

### BR-08 — Runtime Metadata Consumption

| BR | Req ID | Audit ID | Audit Check | Current State | Evidence | Gap | Status |
|----|--------|----------|-------------|---------------|----------|-----|--------|
| BR-08 | BR-08.1 | AUD-08.1 | Resolve effective Global | Không từ Admin authority | hardcode | Fail | **FAIL** |
| BR-08 | BR-08.2 | AUD-08.2 | Resolve effective Page | Code manifests / static | page-definition | Not Admin authority | **FAIL** |
| BR-08 | BR-08.3 | AUD-08.3 | Resolve effective Article | Yes (local) | resolveArticleMetadata | OK article-local | **FOUND** |
| BR-08 | BR-08.4 | AUD-08.4 | Page title từ effective config | Title từ code, không Admin config | `/home` title | Fail vs BR | **FAIL** |
| BR-08 | BR-08.5 | AUD-08.5 | Meta description từ effective | Hub thiếu; Article OK | curl home · article pipeline | Hub fail | **PARTIAL** |
| BR-08 | BR-08.6 | AUD-08.6 | OG image từ effective | Hub thiếu; Article derived | same | Hub fail | **PARTIAL** |
| BR-08 | BR-08.7 | AUD-08.7 | Social/share image | Như OG | same | Hub fail | **PARTIAL** |
| BR-08 | BR-08.8 | AUD-08.8 | Favicon/logo đúng scope | Favicon 404; logo SVG hardcode | Prod + shells | Fail | **FAIL** |
| BR-08 | BR-08.9 | AUD-08.9 | Runtime = Admin authority | Global không; Article gần | dual name | Fail Global | **FAIL** |
| BR-08 | BR-08.10 | AUD-08.10 | Không chỉ tồn tại DB mà không consume | Brand DB đúng pattern vi phạm; category SEO cũng | brand + categories | Fail | **FAIL** |

### BR-09 — Crawler / Public HTML Readiness

| BR | Req ID | Audit ID | Audit Check | Current State | Evidence | Gap | Status |
|----|--------|----------|-------------|---------------|----------|-----|--------|
| BR-09 | BR-09.1 | AUD-09.1 | Expose effective title HTML | Title có (code); không từ foundation config | curl `/home` | Authority sai | **PARTIAL** |
| BR-09 | BR-09.2 | AUD-09.2 | Expose description HTML | Hub first HTML không | curl | Missing hub | **FAIL** |
| BR-09 | BR-09.3 | AUD-09.3 | Expose OG HTML | Hub không; Article Pipeline A có | nginx · head builder | Hub missing | **PARTIAL** |
| BR-09 | BR-09.4 | AUD-09.4 | Article expose metadata HTML | Yes | open-graph / spa | — | **FOUND** |
| BR-09 | BR-09.5 | AUD-09.5 | Output nhất quán authority | Global/page không; article gần | — | Incomplete | **PARTIAL** |
| BR-09 | BR-09.6 | AUD-09.6 | Không chỉ client-side metadata | Hub phụ thuộc SPA/client cho nhiều meta; Article bots có server HTML | SEO audit V2/V3 align | Hub risk | **PARTIAL** |

### BR-10 — Validation & Integrity

| BR | Req ID | Audit ID | Audit Check | Current State | Evidence | Gap | Status |
|----|--------|----------|-------------|---------------|----------|-----|--------|
| BR-10 | BR-10.1 | AUD-10.1 | Config input validate | Article SEO zod/limits partial; Global brand minimal | community routes · wave-d | Incomplete | **PARTIAL** |
| BR-10 | BR-10.2 | AUD-10.2 | Asset input validate | Media pipeline yes | media-process | Brand orphan weak | **PARTIAL** |
| BR-10 | BR-10.3 | AUD-10.3 | Invalid không thành authority | Partial media publish-check | media import | No unified policy | **PARTIAL** |
| BR-10 | BR-10.4 | AUD-10.4 | Missing value handling | Article local fallbacks; Global/page ad-hoc | resolver | No foundation policy | **PARTIAL** |
| BR-10 | BR-10.5 | AUD-10.5 | Invalid asset handling | Media yes; Global no | — | Incomplete | **PARTIAL** |
| BR-10 | BR-10.6 | AUD-10.6 | Runtime fallback khi thiếu config | Hardcode / empty | site_name hardcode | Không theo precedence | **PARTIAL** |
| BR-10 | BR-10.7 | AUD-10.7 | Fallback không phá precedence | Precedence chưa có → N/A operational | — | Missing model | **MISSING** |
| BR-10 | BR-10.8 | AUD-10.8 | Admin validation feedback | Toast/form partial theo module | article / brand | Không chuẩn foundation | **PARTIAL** |

### BR-11 — Existing Page Compatibility

| BR | Req ID | Audit ID | Audit Check | Current State | Evidence | Gap | Status |
|----|--------|----------|-------------|---------------|----------|-----|--------|
| BR-11 | BR-11.1 | AUD-11.1 | Public pages tiếp tục render | Hiện render (pre-foundation) | Prod `/home` 200 | Migration risk sau này — SoT/Plan | **FOUND** (baseline) |
| BR-11 | BR-11.2 | AUD-11.2 | Articles tiếp tục render | Yes | article pipeline | — | **FOUND** |
| BR-11 | BR-11.3 | AUD-11.3 | Page chưa config → fallback | Hiện fallback = hardcode code | manifests | Không Admin inheritance | **PARTIAL** |
| BR-11 | BR-11.4 | AUD-11.4 | Article chưa config → fallback | Local title/excerpt/cover | resolver | OK local | **FOUND** |
| BR-11 | BR-11.5 | AUD-11.5 | Existing metadata không mất ngoài migration | Baseline: metadata phân tán — migration chưa chạy | — | SoT phải inventory trước migrate | **NOT_EVIDENCED** (post-migrate) |
| BR-11 | BR-11.6 | AUD-11.6 | No public regression | Baseline OK; foundation chưa ship | — | Verify sau impl | **NOT_EVIDENCED** |
| BR-11 | BR-11.7 | AUD-11.7 | No Admin regression | Baseline OK | — | Verify sau impl | **NOT_EVIDENCED** |

### BR-12 — Foundation / SEO Separation

| BR | Req ID | Audit ID | Audit Check | Current State | Evidence | Gap | Status |
|----|--------|----------|-------------|---------------|----------|-----|--------|
| BR-12 | BR-12.1 | AUD-12.1 | Foundation cung cấp capability cho SEO downstream | **Chưa** — đây là gap của task | SEO epic PENDING | Must build | **MISSING** |
| BR-12 | BR-12.2 | AUD-12.2 | SEO không tự tạo lại infra | Hiện SEO epic **đang phải** mang infra (Audit SEO V1–V7) | `040826` audit | Đúng lý do làm foundation trước | **FAIL** (hiện trạng) |
| BR-12 | BR-12.3 | AUD-12.3 | SEO dùng authority foundation | Foundation authority chưa lập | — | Missing | **MISSING** |
| BR-12 | BR-12.4 | AUD-12.4 | Foundation không mở rộng thành full SEO strategy | BRD Non-Goals giữ; Audit này **không** khóa sitemap/robots/SERP strategy | BRD §4 / §12 | Boundary OK ở BRD | **FOUND** (BRD boundary) |
| BR-12 | BR-12.5 | AUD-12.5 | Metadata capability reuse page mới | Chưa có foundation reuse | — | Missing | **MISSING** |

### BR-13 — Security & Permission

| BR | Req ID | Audit ID | Audit Check | Current State | Evidence | Gap | Status |
|----|--------|----------|-------------|---------------|----------|-----|--------|
| BR-13 | BR-13.1 | AUD-13.1 | Auth cho config management | Admin JWT trên brand / page-settings / article / media | admin-auth · guards | OK cho surface hiện có | **FOUND** (existing surfaces) |
| BR-13 | BR-13.2 | AUD-13.2 | RBAC hiện hành | `marketing.brand_identity.*` · `interface.page_settings.*` · community/media perms | permission-catalog | Surface mới phải map RBAC — SoT | **PARTIAL** |
| BR-13 | BR-13.3 | AUD-13.3 | Upload security policy | Media pipeline authenticated + validate | media routes | Brand orphan bypass | **PARTIAL** |
| BR-13 | BR-13.4 | AUD-13.4 | Asset input validate | Media yes | media-process | Global missing | **PARTIAL** |
| BR-13 | BR-13.5 | AUD-13.5 | Public chỉ consume allowed public config | Article public APIs exist; brand **admin-only** (và không public read) | wave-d admin routes | Cần public-read contract — SoT | **PARTIAL** |
| BR-13 | BR-13.6 | AUD-13.6 | API không bypass permission | Existing guards present on admin routes audited | requireJwtPermission patterns | New endpoints must follow | **FOUND** (pattern exists) |

---

## 3. Status rollup

| BR | Atomic | FOUND | PARTIAL | MISSING | FAIL | NOT_EVIDENCED | Verdict |
|----|--------|-------|---------|---------|------|---------------|---------|
| BR-01 | 10 | 0 | 2 | 4 | 4 | 0 | Foundation Global **không đạt** |
| BR-02 | 10 | 0 | 8 | 0 | 2 | 0 | Asset chỉ article; Global **fail authority** |
| BR-03 | 10 | 0 | 1 | 6 | 3 | 0 | Page SEO config **không có** |
| BR-04 | 10 | 5 | 3 | 2 | 0 | 0 | Article **mạnh nhất** nhưng thiếu inherit + OG riêng |
| BR-05 | 10 | 0 | 9 | 1 | 0 | 0 | Admin surface **không đủ 3 scope** |
| BR-06 | 10 | 1 | 2 | 2 | 5 | 0 | Authority **phân tán** |
| BR-07 | 10 | 0 | 0 | 8 | 2 | 0 | Inheritance **chưa tồn tại** |
| BR-08 | 10 | 1 | 3 | 0 | 6 | 0 | Runtime consume foundation **fail** (trừ article-local) |
| BR-09 | 6 | 1 | 4 | 0 | 1 | 0 | Hub crawler HTML **yếu**; article OK |
| BR-10 | 8 | 0 | 7 | 1 | 0 | 0 | Validation **ad-hoc** |
| BR-11 | 7 | 3 | 1 | 0 | 0 | 3 | Baseline render OK; migrate chưa chứng minh |
| BR-12 | 5 | 1 | 0 | 3 | 1 | 0 | Đúng lý do pending SEO |
| BR-13 | 6 | 2 | 4 | 0 | 0 | 0 | RBAC pattern có; scope mới chưa đủ |

**Không có BR group nào READY cho Final Acceptance.**  
Article (BR-04 subset) là **reuse candidate** mạnh nhất cho SoT/Solution — không phải foundation hoàn chỉnh.

---

## 4. Existing reusable capabilities (Reuse trước Create — CG)

Audit ghi nhận **có thể reuse / modify** (không phải permission implement):

| Capability | Decision hint for SoT | BR served if extended |
|------------|----------------------|------------------------|
| `marketing_brand_identity` + Brand Admin route | **Modify/extend** payload + wire runtime — **hoặc** migrate nếu SoT chọn authority khác | BR-01,05,06 |
| Orphan `brand-identity-page.js` / localStorage | **Delete or migrate** — không giữ dual | BR-01.3–01.4, BR-02.8, BR-06.6 |
| Community Media Library | **Reuse** cho asset pipeline; mở rộng scope usage (Global/Page) nếu SoT chốt single asset authority | BR-02 |
| Article SEO Admin + `resolveArticleMetadata` + Pipeline A/B | **Reuse** article path; **extend** inherit + dedicated OG fields | BR-04,08,09 |
| Page Settings / publish | **Keep as placement** — **không** reuse làm Page SEO authority trừ khi Owner/SoT quyết định gộp domain (hiện Audit: **domain khác**) | BR-03 (negative) |
| Category `seo_*` | Adjacent — SoT quyết có thuộc Page foundation hay entity riêng | adjacent |
| Page manifests / static titles | **Migrate away** khỏi authority chính khi foundation live | BR-03,06,08 |

> Constraint BRD §13.1–2: **Không** tạo metadata table mới chỉ vì thuận tiện trước khi SoT khóa existing authority.

---

## 5. Owner decisions needed (trước / cùng SoT) — Audit không tự chốt

Các điểm **chưa đủ** để Solution/Plan tự suy (CG-030):

1. **Global authority:** extend `marketing_brand_identity` hay tạo configuration authority mới (sau khi chứng minh cannot-modify)?
2. **Page SEO surface:** gắn vào Page Settings (cùng page) hay Admin surface/route riêng theo BRD §8?
3. **Asset authority:** Media Library là single authority cho Global/Page/Article config assets, hay brand assets tách?
4. **OG vs Social image:** một field hay hai field bắt buộc ở Global/Page/Article (BR liệt kê tách)?
5. **Content Engine vs Community Article:** Content Engine SEO có thuộc foundation Article scope hay out-of-scope?
6. **Category SEO:** đưa vào Page-level foundation hay entity SEO riêng (downstream SEO)?
7. **Public read API** cho Global/Page effective config: shape nào (cấm bypass Admin-only brand hiện tại mà runtime không đọc)?

Audit **dừng** tại đây cho các điểm trên — chờ Owner + SoT.

---

## 6. Dependency note — SEO epic PENDING

```text
090826 Foundation (this task)
        ↓  (required)
040826 SEO Metadata Management  ← OWNER PENDING 2026-08-09
```

SEO Audit/SoT/Solution đã có vẫn **giữ**; Plan/Impl SEO **không mở** đến khi foundation đủ authority cho Global/Page/Article metadata consumption (BR-12).

---

## 7. Gate

| Gate | Status |
|------|--------|
| BRD Owner Lock | 🔒 **OWNER LOCKED** (`01 - Business Requirement.md`) |
| Audit complete | ✅ Rev A — đủ atomic rows từ §16 |
| Audit Owner APPROVE | ✅ **APPROVED** 2026-08-09 |
| SoT | 🔒 `03 - Governing SoT.md` — **OWNER APPROVED / LOCKED** |
| Solution | ⏳ `04 - Solution Design.md` — chờ Owner REVIEW / LOCK |
| Plan / Implementation | ❌ NOT AUTHORIZED |

---

## 8. Recommended next step (Governance)

```text
BRD OWNER LOCKED          ← DONE
Audit APPROVED (rev A)    ← DONE
SoT OWNER APPROVED        ← DONE
    ↓
Owner REVIEW / LOCK Solution (`04 - Solution Design.md`)
    ↓
Plan → Implementation → Evidence A/B/C → Final Acceptance
```

**Cấm** implementation / tạo schema mới trước Solution LOCK + Plan.

> Flow chuẩn: **BRD LOCK → Audit APPROVE → SoT APPROVE → Solution LOCK → Plan → Impl**.

---

# END OF MANDATORY AUDIT (rev. A · OWNER APPROVED)
