CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# BRD — Website SEO Metadata Management & SEO Platform

|                |                                                                                     |
| -------------- | ----------------------------------------------------------------------------------- |
| **Task ID**    | `040826_Website_SEO_Metadata_Management`                                            |
| **Task Type**  | Epic / Platform-level Business Requirement                                          |
| **Product**    | iFlux                                                                               |
| **Scope**      | Toàn bộ public website, page, article và public entity                              |
| **Status**     | 🔒 **OWNER LOCKED** (2026-08-09) — BR Checklist §0 + Amendment Reviewer MUST (HTTP Status · Conflict Resolution · Singleton) **đã khóa** · Implementation **NOT AUTHORIZED** · SoT / Solution = Owner đang kiểm tra absorb |
| **Governance** | **Business Requirement → Mandatory Audit → SoT → Solution & Plan → Implementation** |
| **Amendment**  | **2026-08-09** — khóa Clean Public URL (SEO) ≠ Public Identity / Affiliate URL; **2026-08-09** — đánh số BR Checklist Registry (§0); **2026-08-09** — Reviewer MUST: HTTP Status trong SEO Contract (§10); Conflict Resolution giữa SEO signals (§14/§33); Duplicate/Singleton metadata (§38) · **LOCKED cùng ngày** |

---

# 0. BR Checklist Registry (KHÓA)

> Registry này **thuộc tầng BRD** (Product Backlogs Governance §2.1).  
> Chữ requirement **không diễn giải lại** — chỉ **đánh số** map từ §5–§50 / §45.  
> §41 / §42 / §51 = cửa **Audit deliverable**, không tạo product BR mới.  
> Audit / SoT / Solution / Plan / Verification **MUST** trả lời **đủ mọi dòng** dưới đây.

### 0.1 Map § → BR

| BR | § BRD | Tên ngắn |
|----|-------|----------|
| BR-01 | §5 | Automatic SEO by Default |
| BR-02 | §6 | Field Ownership Classification |
| BR-03 | §7 | Global Website SEO |
| BR-04 | §8 | Website Identity |
| BR-05 | §9 | Favicon / Site Icon |
| BR-06 | §10 | Page SEO Contract (+ HTTP Status / coherent URL policy) |
| BR-07 | §11 | Coverage — Mandatory |
| BR-08 | §12 | Dynamic Entity SEO |
| BR-09 | §13 | SEO Template Engine |
| BR-10 | §14 | SEO Rule Engine (+ Conflict Resolution) |
| BR-11 | §15 | Canonical — Automatic |
| BR-12 | §16 | Canonical Edge Cases |
| BR-13 | §17 | Robots — Automatic |
| BR-14 | §18 | Sitemap — Automatic |
| BR-15 | §19 | OpenGraph — Automatic |
| BR-16 | §20 | Twitter/X — Derived |
| BR-17 | §21 | Default Image Fallback |
| BR-18 | §22 | Image SEO |
| BR-19 | §23 | Description Automation |
| BR-20 | §24 | Title Automation |
| BR-21 | §25 | Structured Data |
| BR-22 | §26 | Breadcrumb |
| BR-23 | §27 | Internal Linking |
| BR-24 | §28 | Slug & URL |
| BR-25 | §29 | Redirect Management |
| BR-26 | §30 | Pagination |
| BR-27 | §31 | Multi-language Readiness |
| BR-28 | §32 | SEO Preview |
| BR-29 | §33 | SEO Health / Quality Gate |
| BR-30 | §34 | SEO Versioning |
| BR-31 | §35 | SEO Source Traceability |
| BR-32 | §36 | SEO CMS |
| BR-33 | §37 | SEO Permission |
| BR-34 | §38 | SEO Source of Truth — Mandatory (+ Singleton metadata) |
| BR-35 | §39 | Human vs Crawler Consistency |
| BR-36 | §40 | Search Engine / SERP Representation |
| BR-37 | §44 | SEO-ready by Default |
| BR-45 | §45 | SEO vs Affiliate / Public Identity Boundary |
| BR-46 | §46 | Compatibility Requirements |
| BR-47 | §47 | Reuse Requirement |
| BR-48 | §48 | Non-Functional Requirements |
| BR-SC | §50 | Success Criteria (verification index) |

### 0.2 Atomic Req ID (bất biến)

| BR | Req ID | Requirement (chữ BRD) | § |
|----|--------|------------------------|---|
| BR-01 | BR-01.1 | Automatic by Default — Manual Override by Exception | §5 |
| BR-01 | BR-01.2 | Metadata deterministic từ Site/Page/URL/Entity/Content/Taxonomy/Author/Image/Template/Rule → MUST auto-sinh | §5 |
| BR-01 | BR-01.3 | Không bắt Editor/Admin nhập thủ công chỉ vì chưa có auto-resolution | §5 |
| BR-01 | BR-01.4 | Manual chỉ cho editorial / business / campaign / exception / explicit override | §5 |
| BR-02 | BR-02.A | Phân loại Fully Automatic (URL, Canonical, OG URL, Breadcrumb URL, Sitemap eligibility, normalization, Structured Data identity, Site identity, entity URL, fallback image, system robots…) | §6.A |
| BR-02 | BR-02.B | Phân loại Automatic + Manual Override (SEO Title, Description, OG/Twitter fields, Slug, Robots exception…) | §6.B |
| BR-02 | BR-02.C | Phân loại Manual / Editorial (SEO đặc biệt, Featured SEO Image, ALT, campaign, explicit noindex…) | §6.C |
| BR-02 | BR-02.D | Phân loại System Only (resolution/canonical/sitemap engines, rendering contract, normalization, schema identity, source/version…) | §6.D |
| BR-03 | BR-03.1 | Quản lý tập trung Global Website SEO fields (Name, Title Template, Description, Domain, Logo, Favicon, icons, Default OG/Social, robots policy, theme, manifest, verification…) | §7 |
| BR-03 | BR-03.2 | Phân biệt Brand Name / Site Name / Homepage Title / Organization Name / Canonical Domain | §7 |
| BR-04 | BR-04.1 | Website Identity là SoT riêng (Brand, Site, Org, Homepage, Logo, Favicon, Canonical Domain, Org URL) | §8 |
| BR-04 | BR-04.2 | Machine-readable identity đủ để Google hiểu website/entity/URL chính | §8 |
| BR-05 | BR-05.1 | Favicon thuộc Website Identity; bao phủ favicon.ico, PNG, link rel=icon, Apple Touch, Manifest, MIME, HTTP, cache, crawler access, prod consistency | §9 |
| BR-05 | BR-05.2 | Khi SERP icon sai: audit Declared → Crawler-visible → Google Cached → SERP Icon | §9 |
| BR-06 | BR-06.1 | Mỗi public URL resolve được SEO Contract gồm tối thiểu: HTTP Status, URL, Page Identity, Page Type, SEO Title, Meta Description, Canonical, Robots, OG Title/Description/Image/URL, Twitter Metadata, Structured Data, Breadcrumb, Sitemap Eligibility, Language, Alternate Language | §10 |
| BR-06 | BR-06.2 | Không public page thiếu SEO / metadata mâu thuẫn / hardcode rời / ownership không rõ | §10 |
| BR-06 | BR-06.3 | SEO Contract MUST include HTTP response state/status so that HTTP status, indexability, canonical, robots and sitemap eligibility form one coherent URL policy | §10 |
| BR-06 | BR-06.4 | HTTP↔SEO coherence: 200 → normal SEO resolution; 301/302 → redirect policy; 404 → not indexable; 410 → not indexable. MUST NOT allow contradictory states (vd. HTTP 404 + index,follow + sitemap eligible) | §10 |
| BR-07 | BR-07.HOME | Coverage `/` | §11 |
| BR-07 | BR-07.STATIC | Coverage Static Pages | §11 |
| BR-07 | BR-07.COM | Coverage Community | §11 |
| BR-07 | BR-07.ARTICLE | Coverage Community Article | §11 |
| BR-07 | BR-07.MARKET | Coverage Market | §11 |
| BR-07 | BR-07.FLOW | Coverage Money Flow | §11 |
| BR-07 | BR-07.MEMBER | Coverage Membership | §11 |
| BR-07 | BR-07.FAQ | Coverage FAQ | §11 |
| BR-07 | BR-07.WATCH | Coverage Watchlist/public nếu indexable | §11 |
| BR-07 | BR-07.STOCK | Coverage Stock | §11 |
| BR-07 | BR-07.SECTOR | Coverage Sector | §11 |
| BR-07 | BR-07.ECO | Coverage Ecosystem | §11 |
| BR-07 | BR-07.AUTHOR | Coverage Author | §11 |
| BR-07 | BR-07.TAG | Coverage Tag | §11 |
| BR-07 | BR-07.COLL | Coverage Collection | §11 |
| BR-07 | BR-07.SEARCH | Coverage Search/Listing | §11 |
| BR-07 | BR-07.PAGE | Coverage Pagination | §11 |
| BR-07 | BR-07.FUTURE | Coverage Future Entity | §11 |
| BR-07 | BR-07.REDIR | Coverage Redirect | §11 |
| BR-07 | BR-07.404 | Coverage 404 | §11 |
| BR-07 | BR-07.410 | Coverage 410 | §11 |
| BR-07 | BR-07.QUERY | Coverage Query URLs | §11 |
| BR-07 | BR-07.REF | Coverage Referral URLs | §11 |
| BR-07 | BR-07.PID | Coverage Public Identity URLs | §11 |
| BR-08 | BR-08.ARTICLE | Dynamic SEO Article template | §12 |
| BR-08 | BR-08.STOCK | Dynamic SEO Stock template | §12 |
| BR-08 | BR-08.SECTOR | Dynamic SEO Sector template | §12 |
| BR-08 | BR-08.AUTHOR | Dynamic SEO Author template | §12 |
| BR-08 | BR-08.TMPL | Template có fallback, validation, override, version, ownership | §12 |
| BR-09 | BR-09.1 | Template Engine — không hardcode từng page; hỗ trợ Global / Page Type / Entity Type / Specific Entity / Override / Fallback | §13 |
| BR-09 | BR-09.2 | Đổi template tác động toàn bộ entity dùng template | §13 |
| BR-10 | BR-10.1 | Rule Engine quyết định indexability và metadata behavior | §14 |
| BR-10 | BR-10.2 | SEO Platform MUST enforce deterministic conflict-resolution across HTTP status, redirect, canonical, robots/indexability, sitemap eligibility, OG URL, structured-data URL and internal SEO targets; invalid contradictory states MUST be prevented or surfaced as SEO Health ERROR | §14 |
| BR-11 | BR-11.1 | Canonical MUST tự động resolve trong workflow thông thường | §15 |
| BR-11 | BR-11.2 | Canonical từ Canonical Domain + Route + Entity Identity + URL Policy | §15 |
| BR-12 | BR-12.1 | Edge policy: query, pagination, sort, filter, referral, public identity, case, slash, slug change, duplicate, legacy, redirect, migration | §16 |
| BR-12 | BR-12.2 | `?ref=` / `?r=` / `/{publicId}/...` và decorator Affiliate **không** thành SEO canonical identity | §16 |
| BR-12 | BR-12.3 | MUST NOT refactor Affiliate/Public Identity trong Epic trừ defect SEO-boundary + Owner approve | §16 |
| BR-13 | BR-13.1 | Robots rule-driven; không bắt Editor chọn index/follow từng content bình thường | §17 |
| BR-14 | BR-14.1 | Sitemap Automatic — eligibility tự động; phản ánh đúng indexable URLs | §18 |
| BR-15 | BR-15.1 | OpenGraph Automatic | §19 |
| BR-16 | BR-16.1 | Twitter/X Derived từ OG/contract | §20 |
| BR-17 | BR-17.1 | Default Image Fallback | §21 |
| BR-18 | BR-18.1 | Image SEO (dimensions, ALT governance…) | §22 |
| BR-19 | BR-19.1 | Description Automation | §23 |
| BR-20 | BR-20.1 | Title Automation | §24 |
| BR-21 | BR-21.1 | Structured Data (JSON-LD) | §25 |
| BR-22 | BR-22.1 | Breadcrumb | §26 |
| BR-23 | BR-23.1 | Internal Linking SEO-facing | §27 |
| BR-24 | BR-24.1 | Slug & URL governance | §28 |
| BR-25 | BR-25.1 | Redirect Management | §29 |
| BR-26 | BR-26.1 | Pagination SEO policy | §30 |
| BR-27 | BR-27.1 | Multi-language Readiness | §31 |
| BR-28 | BR-28.1 | SEO Preview (Google + Social) | §32 |
| BR-29 | BR-29.1 | SEO Health / Quality Gate | §33 |
| BR-29 | BR-29.2 | SEO Health MUST detect conflicting SEO signals (HTTP vs robots vs sitemap vs canonical vs redirect vs OG/SD URL) as ERROR when correctness bị ảnh hưởng | §33 |
| BR-29 | BR-29.3 | Duplicate singleton SEO tags trong một rendered document (title, meta description, canonical, robots, og:url/title/description, primary OG image, Twitter primary) MUST be SEO Health ERROR khi ảnh hưởng correctness | §33 |
| BR-30 | BR-30.1 | SEO Versioning | §34 |
| BR-31 | BR-31.1 | SEO Source Traceability | §35 |
| BR-32 | BR-32.1 | SEO CMS (platform quản trị SEO) | §36 |
| BR-33 | BR-33.1 | SEO Permission / RBAC | §37 |
| BR-34 | BR-34.1 | Một SEO Source of Truth duy nhất | §38 |
| BR-34 | BR-34.2 | FE/BE/SPA/SSR/HTML/JS/Nginx MUST NOT tự tạo/ghi đè metadata ngoài governed pipeline | §38 |
| BR-34 | BR-34.3 | Mọi rendering pipeline consume cùng SEO contract | §38 |
| BR-34 | BR-34.4 | For each rendered public document, SEO singleton fields MUST resolve to exactly one authoritative instance unless the relevant standard explicitly permits multiple values | §38 |
| BR-35 | BR-35.1 | Consistency Browser / Googlebot / Social / Other crawlers; không giả định Pipeline A = Pipeline B | §39 |
| BR-36 | BR-36.1 | Đủ machine-readable cho SERP; audit được Declared → Crawler-visible → Indexed → SERP | §40 |
| BR-37 | BR-37.1 | Publish workflow SEO-ready by default; Editor chỉ Preview / Health / Optional Override | §44 |
| BR-45 | BR-45.0 | SEO MUST NOT treat Affiliate/Public Identity URLs as indexable SEO URLs | §45 |
| BR-45 | BR-45.1 | Clean Public URL = SEO identity duy nhất (canonical / index / sitemap / OG URL / structured-data URL / internal SEO target) | §45.1 |
| BR-45 | BR-45.2 | Public Identity / Affiliate URL ≠ SEO identity; không index riêng | §45.2 |
| BR-45 | BR-45.3 | Attribution vẫn hoạt động; không sitemap; không canonical; không OG/SD identity riêng; mặc định noindex nếu crawler truy cập được; không tạo SEO entity riêng | §45.3 |
| BR-45 | BR-45.4 | SEO MUST NOT preempt Affiliate/Public Identity Resolver; thứ tự Request → Resolver → Content → SEO Contract Clean URL | §45.4 |
| BR-45 | BR-45.5 | Sau resolve: metadata theo Clean Public representation; MUST NOT dùng URL mang publicId/referral làm canonical/og:url/SD/sitemap | §45.5 |
| BR-45 | BR-45.6 | Mandatory Audit MUST có URL variant matrix (Clean / publicId / ?ref= / ?r= / decorator khác) | §45.6 |
| BR-45 | BR-45.7 | Không refactor Affiliate/Public Identity trong Epic SEO trừ defect SEO-boundary + Owner | §45.7 |
| BR-46 | BR-46.1 | SEO MUST NOT phá compatibility requirements (kể cả Affiliate/Public Identity ngoài §45) | §46 |
| BR-47 | BR-47.1 | Reuse existing architecture/capabilities; không chiếm sửa Affiliate resolvers trừ §45.7 | §47 |
| BR-48 | BR-48.CONSIST | NFR Consistency — một URL một SEO result; variant Affiliate resolve về cùng Clean canonical | §48 |
| BR-48 | BR-48.DETERM | NFR Determinism | §48 |
| BR-48 | BR-48.PERF | NFR Performance — không bottleneck; không chặn attribution | §48 |
| BR-48 | BR-48.REL | NFR Reliability — SEO fail không crash page / không mất attribution | §48 |
| BR-48 | BR-48.OBS | NFR Observability (URL→…→Renderer + Affiliate variant chain) | §48 |
| BR-48 | BR-48.SEC | NFR Security — SEO config chịu RBAC | §48 |
| BR-48 | BR-48.AUDIT | NFR Auditability | §48 |
| BR-48 | BR-48.ROLL | NFR Rollback | §48 |
| BR-SC | SC-01 | 100% public URL types có SEO Contract | §50.1 |
| BR-SC | SC-02 | Có một SEO Source of Truth | §50.2 |
| BR-SC | SC-03 | Không còn uncontrolled metadata ownership | §50.3 |
| BR-SC | SC-04 | Canonical tự động resolve | §50.4 |
| BR-SC | SC-05 | Robots tự động resolve | §50.5 |
| BR-SC | SC-06 | Sitemap eligibility tự động resolve | §50.6 |
| BR-SC | SC-07 | OG/Twitter tự động resolve | §50.7 |
| BR-SC | SC-08 | Structured Data tự động resolve | §50.8 |
| BR-SC | SC-09 | Breadcrumb tự động resolve | §50.9 |
| BR-SC | SC-10 | Default image fallback hoạt động | §50.10 |
| BR-SC | SC-11 | Title/Description automatic generation | §50.11 |
| BR-SC | SC-12 | Manual override được governance | §50.12 |
| BR-SC | SC-13 | Favicon/site identity được governance | §50.13 |
| BR-SC | SC-14 | Human/Crawler metadata thống nhất | §50.14 |
| BR-SC | SC-15 | Có SEO Preview | §50.15 |
| BR-SC | SC-16 | Có SEO Health | §50.16 |
| BR-SC | SC-17 | Có versioning | §50.17 |
| BR-SC | SC-18 | Có rollback | §50.18 |
| BR-SC | SC-19 | Có RBAC | §50.19 |
| BR-SC | SC-20 | Có source traceability | §50.20 |
| BR-SC | SC-21 | Không phá Affiliate/Public Identity (§45) | §50.21 |
| BR-SC | SC-22 | Clean Public URL = SEO identity duy nhất (§45.1) | §50.22 |
| BR-SC | SC-23 | PublicId/Affiliate: không sitemap/canonical/OG-SD riêng; có noindex policy (§45.3) | §50.23 |
| BR-SC | SC-24 | Mandatory Audit có URL variant matrix (§45.6) | §50.24 |
| BR-SC | SC-25 | Không cần developer sửa code cho SEO operation thông thường | §50.25 |
| BR-SC | SC-26 | Google có đủ machine-readable representation | §50.26 |
| BR-SC | SC-27 | Có Mandatory Audit evidence trước implementation | §50.27 |
| BR-SC | SC-28 | Có SoT documentation sau Audit | §50.28 |
| BR-SC | SC-29 | Documentation đủ cho task SEO tương lai | §50.29 |
| BR-SC | SC-30 | SEO Contract gồm HTTP Status; HTTP ↔ robots ↔ canonical ↔ sitemap coherent (§10.1) | §50.30 |
| BR-SC | SC-31 | Conflict-resolution deterministic giữa SEO signals; invalid states prevented hoặc Health ERROR (§14.1) | §50.31 |
| BR-SC | SC-32 | Singleton SEO tags trên mỗi rendered document; duplicate = Health ERROR khi ảnh hưởng correctness (§38.1) | §50.32 |

**Đếm:** product/atomic rows trong §0.2 ≈ **115+** (kể cả BR-SC). Audit Checklist phải cover **mọi Req ID** (BR-SC = verification index — Audit ghi hiện trạng phục vụ SC, không PASS epic).

---

# 1. Executive Requirement

iFlux cần xây dựng một **SEO Metadata Management Platform** làm **Single Source of Truth (SoT)** cho toàn bộ SEO và machine-readable web metadata của website.

Đây **không phải task sửa SEO cho Community hoặc một page cụ thể**.

Đây là một **platform-level SEO requirement** áp dụng cho:

* Homepage
* tất cả static pages
* tất cả Community pages
* tất cả bài viết
* tất cả public entities
* Stock
* Sector
* Ecosystem
* Author
* Tag
* Collection
* Search/Listing
* Pagination
* các public URL hiện tại
* các public URL được tạo trong tương lai

và các trạng thái URL như:

* indexable
* noindex
* redirect
* 404
* 410
* duplicate URL
* query URL
* referral URL
* public identity URL

Mục tiêu cuối cùng:

> **Mọi public URL phải có một SEO Contract rõ ràng và được hệ thống tự động resolve SEO metadata chuẩn ngay từ đầu, chỉ yêu cầu con người nhập hoặc override những dữ liệu thực sự mang tính biên tập/business.**

---

# 2. Business Problem

Hiện tại SEO metadata của website có nguy cơ bị phân tán giữa nhiều layer:

* HTML
* JavaScript
* SPA
* Backend
* Node/Express
* rendering pipeline
* Nginx/Web Server
* hardcoded source code
* database
* crawler-specific pipeline
* cache

Điều này có thể dẫn tới:

* Google hiển thị title không mong muốn
* Description không đúng
* OG Preview không đúng
* favicon không đúng
* Google hiểu sai website identity
* crawler và browser nhận metadata khác nhau
* canonical không nhất quán
* structured data thiếu hoặc sai
* sitemap không phản ánh đúng indexable URLs
* metadata bị cache
* duplicate metadata
* duplicate URLs
* SEO phải sửa bằng code
* không biết metadata đang được tạo bởi owner nào
* không thể audit chính xác tại sao Google đang hiển thị một kết quả cụ thể

---

# 3. Current Evidence / Business Symptom

Một ví dụ thực tế hiện tại khi tìm kiếm iFlux trên Google có thể xuất hiện dạng:

```text
Cộng đồng · iFlux

iflux.vn

https://iflux.vn

Translate this page

iFlux. ⌘K. U.Read more
```

Trong đó favicon có thể đang hiển thị biểu tượng không đúng mong muốn.

Đây là evidence cho thấy cần audit toàn bộ chain:

```text
Website Configuration
        ↓
SEO Source
        ↓
Rendering
        ↓
Crawler-visible HTML
        ↓
Google Crawl
        ↓
Google Index
        ↓
SERP Representation
```

Không được giả định rằng việc sửa `<title>` là đủ để giải quyết vấn đề.

Google có thể rewrite title/description, do đó requirement của iFlux là:

> **iFlux phải cung cấp một SEO representation hoàn chỉnh, nhất quán và machine-readable cho từng public URL; search engine/crawler phải có đầy đủ dữ liệu cần thiết để tạo SERP representation chính xác.**

---

# 4. Business Goals

SEO Platform phải đạt các mục tiêu:

1. Một SEO Source of Truth duy nhất.
2. Một ownership rõ ràng cho từng SEO field.
3. Một SEO Contract cho mọi public URL.
4. Automatic SEO by default.
5. Manual override by exception.
6. Canonical được tự động resolve.
7. Robots được tự động resolve.
8. Sitemap eligibility được tự động resolve.
9. Structured Data được tự động sinh.
10. OpenGraph/Twitter được tự động sinh.
11. Breadcrumb được tự động sinh.
12. Default image fallback tự động.
13. SEO metadata nhất quán giữa crawler và human.
14. Có SEO Preview.
15. Có SEO Health/Audit.
16. Có versioning.
17. Có rollback.
18. Có RBAC.
19. Không phá Public Identity/Affiliate architecture — và **không** biến Public Identity / Affiliate URL thành SEO identity (xem §45).
20. Không yêu cầu developer sửa code cho SEO operation thông thường.

---

# 5. Core Principle — Automatic SEO by Default

## Mandatory Requirement

> **Automatic by Default — Manual Override by Exception.**

Bất kỳ SEO metadata nào có thể được xác định một cách deterministic từ:

* Site Configuration
* Page Type
* URL
* Entity Data
* Content
* Taxonomy
* Author
* Image
* Template
* Rule

thì **MUST được hệ thống tự động sinh**.

Không được bắt Editor/Admin nhập thủ công chỉ vì platform chưa có cơ chế auto-resolution.

Manual input chỉ dành cho:

* editorial intent
* business decision
* campaign-specific SEO
* exception
* explicit override

---

# 6. SEO Field Ownership Classification

Mỗi SEO field phải được phân loại thành:

## A. Fully Automatic

Ví dụ:

* Page URL
* Canonical URL
* OG URL
* Breadcrumb URL
* Sitemap eligibility
* URL normalization
* Structured Data identity
* Site identity
* entity URL
* fallback image
* system robots policy

---

## B. Automatic + Manual Override

Ví dụ:

* SEO Title
* Meta Description
* OG Title
* OG Description
* OG Image
* Twitter Title
* Twitter Description
* Twitter Image
* Slug
* Robots exception

---

## C. Manual / Editorial

Ví dụ:

* SEO Title đặc biệt
* SEO Description đặc biệt
* Featured SEO Image
* ALT
* campaign-specific metadata
* explicit noindex exception

---

## D. System Only

Ví dụ:

* Metadata resolution engine
* Canonical engine
* Sitemap engine
* Rendering contract
* URL normalization
* Schema identity
* metadata source/version

---

# 7. Global Website SEO

Phải quản lý tập trung:

* Website Name
* Site Name
* Website Title Template
* Website Description
* Canonical Domain
* Logo
* Favicon
* Apple Touch Icon
* PWA/Manifest Icons
* Default OG Image
* Default Social Image
* OpenGraph Site Name
* Default Robots Policy
* Theme Color
* Manifest
* Search Engine Verification

Phải phân biệt rõ:

```text
Brand Name
Site Name
Homepage Title
Organization Name
Canonical Domain
```

Không được mặc định coi tất cả là một field.

---

# 8. Website Identity

Website Identity phải là một SoT riêng trong SEO architecture.

Tối thiểu:

```text
Brand Name
Site Name
Organization Name
Homepage Identity
Logo
Favicon
Canonical Domain
Organization URL
```

Google phải có đầy đủ machine-readable identity để hiểu:

> Website này là gì, thuộc entity nào và URL chính là gì.

---

# 9. Favicon / Site Icon

Favicon phải được quản lý như một phần của Website Identity.

Audit và platform phải bao phủ:

* favicon.ico
* PNG favicon
* `<link rel="icon">`
* Apple Touch Icon
* Manifest icons
* icon URL
* MIME type
* HTTP status
* cache
* accessibility to crawler
* production consistency

Nếu Google hiển thị favicon cũ/sai, phải xác định:

```text
Declared Icon
↓
Crawler-visible Icon
↓
Google Cached Icon
↓
SERP Icon
```

Không được chỉ sửa frontend mà không xác định nguyên nhân.

---

# 10. Page SEO Contract

Mỗi public URL phải resolve được một SEO Contract.

SEO không chỉ là `<head>`. **HTTP response cũng là một phần SEO Contract.**

Tối thiểu:

```text
HTTP Status
URL
Page Identity
Page Type
SEO Title
Meta Description
Canonical
Robots
OG Title
OG Description
OG Image
OG URL
Twitter Metadata
Structured Data
Breadcrumb
Sitemap Eligibility
Language
Alternate Language
```

### 10.1 HTTP Status trong SEO Contract — Mandatory

SEO Contract **MUST** include HTTP response state/status so that HTTP status, indexability, canonical, robots and sitemap eligibility form **one coherent URL policy**.

Nguyên tắc khóa:

```text
200        → normal SEO resolution
301 / 302  → redirect policy
404        → not indexable
410        → not indexable
```

**MUST NOT** để HTTP status nói một chuyện và SEO metadata nói chuyện khác.

Ví dụ trạng thái **invalid** (cấm / MUST prevent hoặc SEO Health ERROR):

```text
HTTP 404
+ index, follow
+ sitemap = eligible
```

Cùng họ invalid:

```text
HTTP 410 + indexable / sitemap eligible
HTTP 301/302 + canonical/sitemap/OG/SD vẫn chỉ identity của URL nguồn như thể vẫn là trang indexable độc lập (trái redirect policy)
```

Không được có public page ở trạng thái:

> “chưa cấu hình SEO nên hệ thống không biết phải làm gì.”

Mỗi URL phải có policy, kể cả khi policy là:

```text
noindex
```

hoặc:

```text
410
```

---

# 11. Coverage — Mandatory

Phải áp dụng cho **100% public URL types**.

Tối thiểu:

* `/`
* Static Pages
* Community
* Community Article
* Market
* Money Flow
* Membership
* FAQ
* Watchlist/public pages nếu indexable
* Stock
* Sector
* Ecosystem
* Author
* Tag
* Collection
* Search/Listing
* Pagination
* Future Entity
* Redirect
* 404
* 410
* Query URLs
* Referral URLs
* Public Identity URLs

---

# 12. Dynamic Entity SEO

Dynamic metadata phải hỗ trợ:

### Article

```text
{Article Title} | Cộng đồng iFlux
```

### Stock

```text
{Stock Name} ({Ticker}) - Giá, Phân tích, Dòng tiền | iFlux
```

### Sector

```text
{Sector Name} - Phân tích ngành | iFlux
```

### Author

```text
{Author Name} - Cộng đồng iFlux
```

Template phải có:

* fallback
* validation
* override
* version
* ownership

---

# 13. SEO Template Engine

Không hardcode từng page.

Template phải hỗ trợ:

```text
Global
Page Type
Entity Type
Specific Entity
Manual Override
Fallback
```

Ví dụ:

```text
{title} | Cộng đồng iFlux
```

Thay đổi template phải có khả năng tác động đến toàn bộ entity sử dụng template.

---

# 14. SEO Rule Engine

SEO Rule Engine phải quyết định indexability và metadata behavior.

Ví dụ:

```text
Published + Public
→ index, follow
```

```text
Draft
→ noindex
```

```text
Private
→ noindex
```

```text
Deleted
→ 410
```

```text
Empty Collection
→ policy-defined
```

```text
Search Result
→ policy-defined
```

```text
Duplicate URL
→ canonical / redirect
```

Rules phải được governance, không để từng page tự quyết định.

### 14.1 Conflict Resolution giữa SEO signals — Mandatory

BRD đã quy định nhiều signal cùng mô tả một URL:

```text
HTTP status
canonical
robots / indexability
sitemap eligibility
redirect
OG URL
structured-data URL
internal SEO targets
```

SEO Platform **MUST** enforce a **deterministic conflict-resolution policy** across:

* HTTP status
* redirect
* canonical
* robots / indexability
* sitemap eligibility
* OG URL
* structured-data URL
* internal SEO targets

**Invalid contradictory states MUST be prevented or surfaced as SEO Health errors.**

Ví dụ xung đột **không được để tồn tại im lặng**:

```text
HTTP 301
+ canonical = old URL
+ sitemap = old URL
```

```text
noindex
+ sitemap eligible
```

```text
canonical = A
+ structured-data url = B
```

```text
redirect → B
+ canonical → C
```

```text
HTTP 404
+ index, follow
+ sitemap eligible
```

Thứ tự ưu tiên cụ thể / bảng thắng thua chi tiết = **SoT / Solution** (phải deterministic, audit được).  
BRD khóa **bắt buộc có policy + phải phát hiện/ngăn invalid** — không để mỗi layer tự suy.

---

# 15. Canonical — Automatic

Canonical là field **MUST tự động resolve** trong workflow thông thường.

Ví dụ:

```text
/article/abc
```

→

```text
https://iflux.vn/article/abc
```

Không yêu cầu Editor nhập lại canonical URL.

Canonical phải được resolve từ:

```text
Canonical Domain
+
Canonical Route
+
Entity Identity
+
URL Policy
```

---

# 16. Canonical Edge Cases

Phải tự động xử lý policy cho:

* query parameters
* pagination
* sort
* filter
* referral
* public identity
* uppercase/lowercase
* trailing slash
* slug change
* duplicate URL
* legacy URL
* redirect
* entity migration

Đặc biệt:

```text
?ref=
?r=
/{publicId}/...
```

và mọi Public Identity / Affiliate decorator **không được trở thành SEO canonical identity**.

**SoT boundary (LOCKED — chi tiết §45):**

```text
Clean Public URL        → canonical / index / sitemap / OG / structured data
PublicId / Affiliate URL → attribution / identity / navigation only → NOT SEO
```

SEO Platform phải tương thích với Affiliate/Public Identity architecture và **MUST NOT** refactor architecture đó trong Epic này trừ khi Mandatory Audit chứng minh defect thuộc SEO boundary (Owner approval).

---

# 17. Robots — Automatic

Robots phải được rule-driven.

Không bắt Editor chọn `index/follow` cho từng content bình thường.

Phải tự động resolve:

* index
* noindex
* follow
* nofollow
* Googlebot
* Bingbot
* X-Robots-Tag
* robots.txt

---

# 18. Sitemap — Automatic

Editor không cần chọn thủ công “Add to Sitemap”.

Eligibility phải tự động dựa trên:

```text
Public
+
Published
+
Indexable
+
Valid Canonical
+
Valid URL
+
SEO Policy
```

Có thể hỗ trợ:

```text
/sitemap.xml
/post-sitemap.xml
/stock-sitemap.xml
/sector-sitemap.xml
/ecosystem-sitemap.xml
/image-sitemap.xml
/news-sitemap.xml
```

loại nào thực sự cần phải được quyết định qua Audit.

---

# 19. OpenGraph — Automatic

Mặc định:

```text
OG Title
← SEO Title

OG Description
← SEO Description

OG URL
← Canonical / Public URL Policy

OG Image
← Entity Image
← Featured Image
← Page Default Image
← Global Default Image
```

Không bắt Editor nhập lại các giá trị đã có.

---

# 20. Twitter/X — Derived

Mặc định:

```text
Twitter Title
← SEO Title

Twitter Description
← SEO Description

Twitter Image
← OG Image

Twitter Card
← System Policy
```

Chỉ override khi cần.

---

# 21. Default Image Fallback

Nếu entity không có image:

```text
Entity Image
↓
Page Default Image
↓
Global Default OG Image
```

Phải có fallback deterministic.

Không để:

* broken image
* empty image
* invalid image URL

---

# 22. Image SEO

Tự động lấy:

* URL
* Width
* Height
* Format
* Aspect Ratio

Có thể tự động sinh:

* ImageObject
* OG Image
* Social Image

Các dữ liệu editorial:

* ALT
* Caption
* Credit

có thể cần manual input hoặc automatic fallback + warning.

---

# 23. Description Automation

Description phải có resolution chain:

```text
Manual SEO Description
↓
Content Summary / Excerpt
↓
Entity Description
↓
Template
↓
Global Default
```

Hệ thống phải validate:

* empty
* quá ngắn
* quá dài
* duplicate
* HTML
* quality threshold

Nếu không thể tạo description chất lượng:

> **SEO Warning**

không được âm thầm tạo nội dung SEO rác.

---

# 24. Title Automation

Resolution:

```text
Manual Override
↓
SEO Template
↓
Entity/Page Title
↓
Fallback
```

Phải validate:

* empty
* duplicate
* quá dài
* quá ngắn
* invalid characters

---

# 25. Structured Data

JSON-LD phải được sinh tự động theo Page/Entity Type.

Có thể hỗ trợ:

* Organization
* WebSite
* WebPage
* BreadcrumbList
* CollectionPage
* Article
* NewsArticle
* Person
* FAQPage
* SearchAction
* ImageObject
* VideoObject
* FinancialService nếu phù hợp

Editor không phải copy/paste JSON-LD.

---

# 26. Breadcrumb

Breadcrumb phải được tự động sinh từ page/entity hierarchy.

Ví dụ:

```text
Home
→ Market
→ Stocks
→ VCB
```

Breadcrumb UI và Breadcrumb JSON-LD phải sử dụng cùng một resolved hierarchy.

---

# 27. Internal Linking

SEO Platform phải tạo nền tảng cho internal linking dựa trên entity identity.

Ví dụ:

```text
VCB
→ /stocks/vcb
```

```text
Ngân hàng
→ Sector
```

Không được tạo link tới:

* private entity
* draft
* noindex entity
* invalid URL

---

# 28. Slug & URL

Slug mặc định phải được tự động normalize:

* lowercase
* whitespace
* Unicode
* special characters
* reserved words
* collision

Editor có thể override.

Khi slug thay đổi:

```text
Old URL
→ 301
→ New Canonical URL
```

nếu policy cho phép.

---

# 29. Redirect Management

Phải hỗ trợ governance cho:

* 301
* 302
* 410
* legacy URL
* slug migration
* duplicate URL
* redirect conflict

Phải tránh:

* redirect loop
* redirect chain
* canonical/redirect conflict

---

# 30. Pagination

Pagination phải có SEO policy riêng.

Ví dụ:

```text
?page=2
?page=3
```

phải resolve:

* title
* description
* canonical
* robots
* sitemap eligibility
* internal linking

Không mặc định áp dụng một rule cho mọi loại collection.

---

# 31. Multi-language Readiness

Kiến trúc phải sẵn sàng cho:

```text
hreflang
canonical
language alternate
```

Không bắt buộc triển khai nếu iFlux chưa có multilingual requirement.

---

# 32. SEO Preview

Admin phải có:

### Google Search Preview

```text
Title
URL
Description
```

### Social Preview

```text
Image
Title
Description
```

Preview phải sử dụng **cùng metadata resolution engine** với production.

Không tạo preview bằng một logic SEO độc lập.

---

# 33. SEO Health / Quality Gate

Trước publish phải có automatic validation.

Tối thiểu:

```text
HTTP Status
Title
Description
Canonical
Robots
OG
Twitter
Structured Data
Breadcrumb
Sitemap
Image
Signal Coherence
Singleton Tags
```

Phát hiện:

* Missing Title
* Missing Description
* Duplicate Title
* Duplicate Description
* Missing Canonical
* Broken Canonical
* Missing OG
* Broken OG Image
* Missing H1
* Invalid Structured Data
* Broken Image
* Orphan Page
* 404
* 410
* Redirect Loop
* Redirect Chain
* **Conflicting SEO signals** (HTTP vs robots vs sitemap vs canonical vs redirect vs OG/SD URL) — **ERROR** khi ảnh hưởng correctness
* **Duplicate singleton tags** trong một rendered document — **ERROR** khi ảnh hưởng correctness

Phải phân biệt:

```text
ERROR
WARNING
INFO
```

---

# 34. SEO Versioning

Các thay đổi phải có history:

* Title
* Description
* Canonical
* Robots
* OG
* Structured Data
* Template
* Rule

Có:

* before
* after
* user
* timestamp
* version
* rollback

---

# 35. SEO Source Traceability

Mỗi resolved field phải truy nguyên được:

```text
Field
Value
Source
Template
Rule
Override
Version
Updated At
```

Ví dụ:

```text
SEO Title
Value: VCB tăng mạnh | Cộng đồng iFlux

Source:
SEO_TEMPLATE

Template:
community_article_title_v1

Override:
NO
```

hoặc:

```text
Source:
MANUAL_OVERRIDE
```

Đây là requirement bắt buộc để phát hiện metadata bị hardcode hoặc bị ghi đè ngoài governance.

---

# 36. SEO CMS

Đề xuất khu vực:

```text
Admin
└── System
    └── SEO Settings
```

Quản lý:

* Global SEO
* Website Identity
* Templates
* Rules
* Default Images
* Verification
* Sitemap
* Robots
* Redirects
* SEO Audit
* SEO Health

Content Editor không cần truy cập toàn bộ configuration này.

---

# 37. SEO Permission

SEO phải tuân RBAC.

Cần Audit permission catalog hiện hữu trước khi tạo key mới.

Có thể cần:

```text
seo.view
seo.edit
seo.publish
seo.settings.manage
seo.redirect.manage
seo.robots.manage
seo.sitemap.manage
seo.audit.view
seo.version.rollback
```

Không được duplicate permission hiện hữu.

---

# 38. SEO Source of Truth — Mandatory

> **Mọi SEO metadata chỉ được phép có một Source of Truth duy nhất.**

Frontend, Backend, SPA, SSR, HTML template, JavaScript, Nginx hoặc bất kỳ rendering layer nào:

**MUST NOT**

tự tạo hoặc ghi đè SEO metadata ngoài governed SEO pipeline.

Nếu có nhiều rendering pipelines:

```text
Browser
Crawler
SSR
SPA
OG
Future Renderer
```

tất cả phải consume cùng một SEO metadata contract.

### 38.1 Duplicate / Singleton Metadata — Mandatory

Một SoT duy nhất **chưa đủ** nếu một rendered document vẫn emit nhiều bản SEO tag cùng vai trò.

Architecture hiện tại có nhiều pipeline (HTML + JS + SPA + Node + Nginx) nên rủi ro thực tế:

```text
<title>...</title>
<title>...</title>
```

```text
<meta name="description" ...>
<meta name="description" ...>
```

```text
hai canonical
```

**Khóa:**

> For each rendered public document, SEO singleton fields MUST resolve to exactly one authoritative instance unless the relevant standard explicitly permits multiple values.

Tối thiểu **singleton** (một instance authoritative):

```text
<title>                  → 1
meta description         → 1
canonical                → 1
robots                   → governed (không duplicate mâu thuẫn)
og:url                   → 1
og:title                 → 1
og:description           → 1
primary OG image         → governed
Twitter primary fields   → governed
```

Duplicate singleton tags **MUST** là:

```text
SEO Health = ERROR
```

nếu ảnh hưởng correctness.

---

# 39. Human vs Crawler Consistency

Phải audit và đảm bảo consistency giữa:

```text
Browser
Googlebot
Social Crawler
Other Search Crawlers
```

đặc biệt phải kiểm tra trường hợp:

```text
Pipeline A — Bot/OG HTML
Pipeline B — SPA/Human
```

Không được giả định hai pipeline giống nhau.

---

# 40. Search Engine / SERP Representation

SEO Platform phải đảm bảo đủ dữ liệu để search engine hiểu:

* Website
* Site Name
* Page
* Entity
* URL
* Title
* Description
* Image
* Organization
* Breadcrumb
* Content type

Không yêu cầu Google phải hiển thị chính xác 100% text đã khai báo, vì search engine có quyền rewrite.

Thay vào đó:

> **Declared Metadata → Crawler-visible Metadata → Indexed Metadata → SERP Representation**

phải có khả năng audit và giải thích được sự khác biệt.

---

# 41. Mandatory SEO Audit

**Không được implementation trước Mandatory Audit.**

Audit phải xác định:

### Metadata Ownership

* `<title>` ở đâu?
* Description ở đâu?
* OG ở đâu?
* Twitter ở đâu?
* Canonical ở đâu?
* Robots ở đâu?
* JSON-LD ở đâu?
* Favicon ở đâu?
* Sitemap ở đâu?
* robots.txt ở đâu?

### Rendering

* SSR?
* SPA?
* HTML shell?
* JS mutation?
* Node/Express?
* Nginx?
* crawler pipeline?

### Consistency

* Human vs crawler
* OG vs page
* Google vs HTML

### Hardcode

Search toàn repository:

```text
<title>
meta description
og:*
twitter:*
canonical
robots
JSON-LD
favicon
verification
```

### Cache

Audit:

* Browser
* CDN
* Nginx
* Application
* HTML
* API
* Crawler/Search cache

### Google

Phải xác định:

* Google đang index title nào?
* Description nào?
* Canonical nào?
* URL nào?
* Favicon nào?
* Google có rewrite không?
* Có duplicate URL không?

### SEO vs Affiliate / Public Identity URL Variants (BẮT BUỘC — §45)

Mandatory Audit **MUST** kiểm tra toàn bộ URL variants (ít nhất):

* Clean Public URL
* `/{publicId}/...`
* `?ref=`
* `?r=`
* các referral / decorator khác nếu tồn tại trên Production

và chứng minh rõ matrix:

```text
URL Variant
→ Attribution Behavior
→ SEO Eligibility
→ Canonical
→ Sitemap Eligibility
→ Robots
```

Audit **MUST** xác nhận:

* Affiliate / Public Identity Resolver hoàn tất attribution **trước** mọi SEO redirect/normalize;
* SEO metadata sau resolve trỏ **Clean Public URL** (không theo `publicId`/referral decorator);
* Public Identity / Affiliate URL **không** vào sitemap, **không** làm canonical, **không** tạo OG/Structured Data identity riêng;
* request Affiliate/Public Identity có khả năng crawler truy cập → policy `noindex` (hoặc tương đương đã chứng minh).

Nếu phát hiện vấn đề cross-domain ngoài SEO boundary → ghi **finding/dependency riêng**, **không** tự refactor Affiliate/Public Identity trong Epic SEO.

---

# 42. SEO SERP Gap Report

Mandatory Audit phải tạo matrix:

| URL          | HTML Title | Google Title | Description | Favicon | Canonical | OG | JSON-LD | Status |
| ------------ | ---------- | ------------ | ----------- | ------- | --------- | -- | ------- | ------ |
| `/`          | ?          | ?            | ?           | ?       | ?         | ?  | ?       | ?      |
| `/cong-dong` | ?          | ?            | ?           | ?       | ?         | ?  | ?       | ?      |
| Article      | ?          | ?            | ?           | ?       | ?         | ?  | ?       | ?      |
| Stock        | ?          | ?            | ?           | ?       | ?         | ?  | ?       | ?      |
| Sector       | ?          | ?            | ?           | ?       | ?         | ?  | ?       | ?      |
| Ecosystem    | ?          | ?            | ?           | ?       | ?         | ?  | ?       | ?      |

---

# 43. Automatic vs Manual Matrix

Mandatory Audit + SoT phải tạo matrix chính thức.

Ví dụ:

| Field               | Automatic | Manual Override | Manual Required | System Only |
| ------------------- | --------: | --------------: | --------------: | ----------: |
| URL                 |         ✓ |                 |                 |           ✓ |
| Canonical           |         ✓ |               △ |                 |           ✓ |
| SEO Title           |         ✓ |               ✓ |                 |             |
| Description         |         ✓ |               ✓ |               △ |             |
| OG Title            |         ✓ |               ✓ |                 |             |
| OG Description      |         ✓ |               ✓ |                 |             |
| OG URL              |         ✓ |                 |                 |           ✓ |
| OG Image            |         ✓ |               ✓ |                 |             |
| Twitter Title       |         ✓ |               ✓ |                 |             |
| Twitter Description |         ✓ |               ✓ |                 |             |
| Twitter Image       |         ✓ |               ✓ |                 |             |
| Robots              |         ✓ |               △ |                 |           ✓ |
| Sitemap Eligibility |         ✓ |                 |                 |           ✓ |
| Breadcrumb          |         ✓ |                 |                 |           ✓ |
| JSON-LD             |         ✓ |               △ |                 |           ✓ |
| Image Width         |         ✓ |                 |                 |           ✓ |
| Image Height        |         ✓ |                 |                 |           ✓ |
| ALT                 |         △ |               ✓ |               △ |             |
| Slug                |         ✓ |               ✓ |                 |             |
| Redirect            |         ✓ |               ✓ |               △ |             |
| Favicon             |         ✓ |                 |                 |           ✓ |
| Site Name           |         ✓ |                 |                 |           ✓ |

Matrix cuối cùng phải được chốt sau Audit.

---

# 44. SEO-ready by Default

Một Article/Page sau khi publish phải **SEO-ready mặc định** mà không yêu cầu Editor nhập 10–20 SEO fields.

Workflow bình thường chỉ cần các business/content fields cần thiết:

```text
Title
Content
Category
Entity
Author
Featured Image
Slug
Publish
```

Hệ thống tự resolve:

```text
SEO Title
Description
Canonical
Robots
OG
Twitter
Structured Data
Breadcrumb
Sitemap
Image Metadata
```

Editor chỉ xử lý:

```text
SEO Preview
SEO Health
Optional Override
```

---

# 45. SEO vs Affiliate / Public Identity Boundary — LOCKED

> **SEO Platform MUST NOT treat Affiliate/Public Identity URLs as indexable SEO URLs. SEO applies to the canonical clean public representation of content, while Affiliate/Public Identity URLs remain an attribution/navigation mechanism only.**

Mục tiêu cuối cùng (khóa):

```text
Clean Public URL
→ SEO / Index / Canonical / Sitemap / OG / Structured Data / Internal SEO target

PublicId / Affiliate URL
→ Attribution / Identity / Navigation
→ NOT SEO
```

Epic SEO **MUST NOT** làm hỏng Affiliate attribution hoặc Public Identity resolution. Boundary này là **BẮT BUỘC** trước SoT / Solution / Plan / Implementation.

---

## 45.1 Clean Public URL = SEO identity duy nhất

**Clean Public URL** là SEO identity chính của nội dung và là URL **duy nhất** được phép trở thành:

* canonical
* indexable URL
* sitemap URL
* OG URL (`og:url` và tương đương)
* structured-data URL (JSON-LD `@id` / `url` / `mainEntityOfPage` trỏ nội dung)
* internal SEO target (internal linking SEO-facing)

Không được có hai SEO identity song song cho cùng một content (Clean URL **và** PublicId/Affiliate URL).

---

## 45.2 Public Identity / Affiliate URL ≠ SEO identity

Public Identity / Affiliate URL có dạng:

* `/{publicId}/...`
* referral / decorator URL phục vụ attribution (ví dụ `?ref=`, `?r=`, và decorator khác nếu tồn tại)

là **attribution / identity / navigation mechanism**, **không phải SEO identity**, và **không được SEO/index riêng**.

Chúng **không** tạo ra một SEO page/entity riêng.

---

## 45.3 Hành vi bắt buộc của Public Identity / Affiliate URL

Public Identity / Affiliate URL phải:

| Yêu cầu | Policy |
|---------|--------|
| Attribution | Vẫn hoạt động bình thường |
| Public Identity | Vẫn resolve được |
| Affiliate context | Vẫn giữ attribution / context (cookie/context theo SoT Affiliate hiện hữu) |
| Sitemap | **Không** được đưa vào sitemap |
| Canonical | **Không** được trở thành canonical |
| OG / Structured Data | **Không** tạo OG / Structured Data identity riêng theo URL có `publicId`/referral |
| Robots | Mặc định phải có policy **`noindex`** nếu request có khả năng được crawler truy cập |
| SEO entity | **Không** tạo SEO page/entity riêng |

---

## 45.4 Thứ tự resolution — SEO không được preempt Affiliate

SEO layer **MUST NOT**:

* can thiệp, redirect, hoặc normalize Public Identity / Affiliate URL **trước khi** Affiliate / Public Identity Resolver **hoàn tất** attribution resolution;
* xóa, làm mất, hoặc thay đổi `publicId`, referral context, attribution cookie/context, hoặc Affiliate behavior;
* “làm sạch” URL theo SEO policy theo cách phá attribution path.

Thứ tự bắt buộc (logic nghiệp vụ):

```text
Request (có thể có publicId / ?ref= / ?r= / decorator)
        ↓
Affiliate / Public Identity Resolver
  (capture attribution + resolve identity — KHÔNG bị SEO preempt)
        ↓
Content / Entity resolved
        ↓
SEO Contract resolve theo Clean Public URL (canonical representation)
        ↓
canonical / robots / sitemap eligibility / OG / structured data
```

---

## 45.5 SEO metadata sau khi resolve content

Khi request Affiliate / Public Identity đã được resolve thành content thật:

* SEO metadata **MUST** được tạo theo **canonical clean public representation**;
* **MUST NOT** lấy URL đang mang `publicId` / referral decorator làm canonical, `og:url`, structured-data URL, hay sitemap entry.

---

## 45.6 Mandatory Audit — URL variant matrix

Mandatory Audit (§41) **MUST** kiểm tra tối thiểu các variant:

* clean URL
* `/{publicId}/...`
* `?ref=`
* `?r=`
* referral / decorator khác nếu tồn tại trên Production

và chứng minh:

```text
URL Variant
→ Attribution Behavior
→ SEO Eligibility
→ Canonical
→ Sitemap Eligibility
→ Robots
```

Không đủ audit nếu chỉ kiểm tra Clean Public URL.

---

## 45.7 Không refactor Affiliate / Public Identity trong Epic SEO

**Không được** thay đổi hoặc refactor Affiliate / Public Identity architecture trong Epic SEO này nếu Mandatory Audit **không** chứng minh có defect **trực tiếp thuộc SEO boundary**.

Nếu phát hiện vấn đề cross-domain:

1. Ghi nhận thành **finding / dependency riêng**.
2. **Chờ Owner approval** trước mọi thay đổi Affiliate / Public Identity.
3. Không tự suy diễn “sửa SEO tiện thể sửa Affiliate”.

---

# 46. Compatibility Requirements

SEO Platform MUST NOT tự ý phá:

* Public Identity
* Affiliate Referral
* Clean Canonical URL
* Community Article architecture
* Entity Registry
* RBAC
* Design System
* Existing routing
* Existing product architecture

Đặc biệt — ngoài §45:

> Affiliate / referral / `publicId` **không** được đưa vào Article Metadata, canonical, OG, sitemap, structured-data URL, hoặc indexable SEO identity. Affiliate data thuộc Share / Affiliate / Public Identity foundation — không thuộc SEO Platform ownership.

---

# 47. Reuse Requirement

Trước khi tạo implementation mới phải audit existing:

* metadata utilities
* URL builders
* canonical utilities
* entity resolvers
* structured data
* sitemap
* robots
* favicon
* image utilities
* Design System
* shared foundations
* Affiliate / Public Identity / Share resolvers *(đọc ownership — **không** chiếm sửa trừ §45.7)*

Nếu foundation hiện hữu có thể reuse thì phải reuse.

Nếu một utility có giá trị dùng chung lâu dài, phải đánh giá việc đưa nó vào đúng **Platform/Design System/Foundation ownership** thay vì tạo code riêng cho từng page.

---

# 48. Non-Functional Requirements

## Consistency

Một URL phải có một resolved SEO result.  
Public Identity / Affiliate URL variant của cùng content **MUST** resolve SEO về **cùng** Clean Public canonical representation (sau attribution), không tạo SEO identity thứ hai.

## Determinism

Cùng URL + cùng data state → cùng SEO metadata.

## Performance

SEO resolution không được tạo bottleneck đáng kể.  
SEO resolution không được chặn hoặc làm mất attribution capture.

## Reliability

SEO failure không được làm page crash.  
SEO failure không được làm mất Affiliate attribution.

## Observability

Phải truy được:

```text
URL
→ Page Type
→ Entity
→ Template
→ Rule
→ Resolved Metadata
→ Renderer
```

và với Affiliate/Public Identity variants:

```text
Request URL Variant
→ Attribution resolved?
→ Clean Public URL
→ SEO Contract
```

## Security

SEO configuration phải chịu RBAC.

## Auditability

Mọi override/configuration change quan trọng phải truy được.

## Rollback

Phải có rollback.

---

# 49. Out of Scope

BRD này không mặc định yêu cầu:

* redesign website
* thay đổi business logic
* thay đổi Market Data
* thay đổi Money Flow
* thay đổi Affiliate architecture *(trừ defect SEO-boundary đã Owner approve — §45.7)*
* thay đổi Public Identity architecture *(cùng điều kiện §45.7)*
* thay đổi authentication
* thay đổi frontend framework
* thay đổi Node.js architecture nếu Audit không chứng minh cần thiết

SEO implementation chỉ được thay đổi những phần cần thiết để đáp ứng SEO requirements **mà không phá** boundary §45.

---

# 50. Success Criteria

Epic chỉ PASS khi:

1. 100% public URL types có SEO Contract.
2. Có một SEO Source of Truth.
3. Không còn uncontrolled metadata ownership.
4. Canonical tự động resolve.
5. Robots tự động resolve.
6. Sitemap eligibility tự động resolve.
7. OG/Twitter tự động resolve.
8. Structured Data tự động resolve.
9. Breadcrumb tự động resolve.
10. Default image fallback hoạt động.
11. Title/Description có automatic generation.
12. Manual override được governance.
13. Favicon/site identity được governance.
14. Human/Crawler metadata thống nhất.
15. Có SEO Preview.
16. Có SEO Health.
17. Có versioning.
18. Có rollback.
19. Có RBAC.
20. Có source traceability.
21. Không phá Affiliate/Public Identity — kể cả attribution, `publicId`, referral context (§45).
22. Không phá canonical policy — Clean Public URL là SEO identity duy nhất (§45.1).
23. Public Identity / Affiliate URL **không** vào sitemap; **không** làm canonical; **không** tạo OG/structured-data identity riêng; có `noindex` (hoặc policy tương đương đã chứng minh) khi crawler có thể truy cập (§45.3).
24. Mandatory Audit có matrix URL Variant → Attribution → SEO Eligibility → Canonical → Sitemap → Robots (§45.6 / §41).
25. Không cần developer sửa code cho SEO operation thông thường.
26. Google/Search Engine có đầy đủ machine-readable representation.
27. Có Mandatory Audit evidence trước implementation.
28. Có SoT documentation sau Audit.
29. Có documentation đủ để developer/AI tuân thủ architecture trong các task SEO tương lai.
30. SEO Contract gồm **HTTP Status**; HTTP status, indexability, canonical, robots và sitemap eligibility tạo **một URL policy nhất quán** (§10.1).
31. Có **conflict-resolution deterministic** giữa SEO signals; trạng thái mâu thuẫn bị ngăn hoặc SEO Health ERROR (§14.1).
32. Mỗi rendered public document có **singleton** SEO tags; duplicate singleton = SEO Health ERROR khi ảnh hưởng correctness (§38.1).

---

# 51. Governance Sequence

BRD này khóa **Business Requirement**, không khóa implementation.

Quy trình bắt buộc:

```text
01 — Business Requirement (BRD)  ← §0 BR Checklist Registry · §45 SEO↔Affiliate Boundary LOCKED
        ↓
02 — Mandatory Audit  ← artifact: `02-Mandatory-Audit.md`
     (gồm URL variant matrix §45.6 / §41 · SERP Gap §42)
        ↓
03 — Audit PASS (Owner APPROVE)
        ↓
04 — SEO Source of Truth
        ↓
05 — Solution & Architecture
        ↓
06 — Implementation Plan
        ↓
07 — Implementation
        ↓
08 — Verification
        ↓
09 — Production SEO Audit
```

Không được bỏ qua Mandatory Audit.  
Không được Implementation trước khi Audit chứng minh boundary §45.  
**Hiện trạng (2026-08-09):** `02-Mandatory-Audit.md` = **DRAFT** · Implementation **NOT AUTHORIZED**.

---

# 52. Final Owner Mandate

> **Không xây một bộ metadata riêng cho Community.**
>
> **Không sửa từng page bằng tay.**
>
> **Không bắt Editor nhập những dữ liệu mà hệ thống có thể tự suy ra.**
>
> **Không để mỗi frontend/backend/template tự tạo SEO metadata.**
>
> **Không coi canonical, OG, robots, sitemap, structured data là các tính năng rời rạc.**
>
> **Không chỉ tối ưu HTML mà bỏ qua Google SERP/indexing.**
>
> **Không implementation trước khi biết chính xác metadata hiện đang được sinh ở đâu.**
>
> **Không biến Public Identity / Affiliate URL thành indexable SEO URL. SEO chỉ áp dụng cho Clean Public URL; Affiliate/Public Identity chỉ là attribution/navigation.**
>
> **Không refactor Affiliate / Public Identity trong Epic SEO nếu Audit không chứng minh defect thuộc SEO boundary — cross-domain finding phải chờ Owner.**

### Requirement cuối cùng

> **Xây dựng SEO Platform cấp toàn website, trong đó mọi public URL — bao gồm homepage, static page, article, stock, sector, ecosystem, author, tag, collection và các entity tương lai — đều có một SEO Contract được resolve tự động từ một Source of Truth duy nhất.**
>
> **Hệ thống phải ưu tiên Automatic SEO by Default, tự động sinh canonical, robots, sitemap eligibility, OG/Twitter, structured data, breadcrumb, fallback image, title và description khi có thể; chỉ yêu cầu manual input hoặc override đối với dữ liệu thực sự mang tính editorial/business.**
>
> **Mọi metadata phải truy nguyên được nguồn, template, rule, override và version. Mọi rendering pipeline phải consume cùng SEO contract và không được tự ý tạo/ghi đè metadata.**
>
> **Clean Public URL là SEO identity duy nhất (canonical / index / sitemap / OG / structured data). Public Identity / Affiliate URL giữ attribution và navigation — NOT SEO.**
>
> **Trước mọi implementation phải thực hiện Mandatory Audit để xác định hiện trạng metadata ownership, rendering pipeline, hardcode, cache, crawler/human differences, Google indexing, SERP gaps, và URL variant matrix SEO↔Affiliate.**
>
> **Mục tiêu cuối cùng là biến SEO thành một platform capability của iFlux — không phải một tập hợp các bản sửa SEO riêng lẻ cho từng page — và không được phá Affiliate / Public Identity architecture.**
