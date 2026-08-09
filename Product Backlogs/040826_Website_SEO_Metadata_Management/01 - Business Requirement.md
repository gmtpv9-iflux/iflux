# BRD — Website SEO Metadata Management & SEO Platform

|                |                                                                                     |
| -------------- | ----------------------------------------------------------------------------------- |
| **Task ID**    | `040826_Website_SEO_Metadata_Management`                                            |
| **Task Type**  | Epic / Platform-level Business Requirement                                          |
| **Product**    | iFlux                                                                               |
| **Scope**      | Toàn bộ public website, page, article và public entity                              |
| **Status**     | **BRD — Owner Draft / Implementation LOCKED**                                       |
| **Governance** | **Business Requirement → Mandatory Audit → SoT → Solution & Plan → Implementation** |

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
19. Không phá Public Identity/Affiliate architecture.
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

Tối thiểu:

```text
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
```

và Public Identity decorator **không được tự động trở thành SEO canonical identity** nếu trái với canonical policy hiện hữu.

SEO Platform phải tương thích với Affiliate/Public Identity architecture.

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

# 45. Compatibility Requirements

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

Đặc biệt:

> Affiliate/referral data không được đưa vào Article Metadata, canonical hoặc OG nếu trái với canonical/affiliate policy hiện hữu.

---

# 46. Reuse Requirement

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

Nếu foundation hiện hữu có thể reuse thì phải reuse.

Nếu một utility có giá trị dùng chung lâu dài, phải đánh giá việc đưa nó vào đúng **Platform/Design System/Foundation ownership** thay vì tạo code riêng cho từng page.

---

# 47. Non-Functional Requirements

## Consistency

Một URL phải có một resolved SEO result.

## Determinism

Cùng URL + cùng data state → cùng SEO metadata.

## Performance

SEO resolution không được tạo bottleneck đáng kể.

## Reliability

SEO failure không được làm page crash.

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

## Security

SEO configuration phải chịu RBAC.

## Auditability

Mọi override/configuration change quan trọng phải truy được.

## Rollback

Phải có rollback.

---

# 48. Out of Scope

BRD này không mặc định yêu cầu:

* redesign website
* thay đổi business logic
* thay đổi Market Data
* thay đổi Money Flow
* thay đổi Affiliate architecture
* thay đổi Public Identity architecture
* thay đổi authentication
* thay đổi frontend framework
* thay đổi Node.js architecture nếu Audit không chứng minh cần thiết

SEO implementation chỉ được thay đổi những phần cần thiết để đáp ứng SEO requirements.

---

# 49. Success Criteria

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
21. Không phá Affiliate/Public Identity.
22. Không phá canonical policy.
23. Không cần developer sửa code cho SEO operation thông thường.
24. Google/Search Engine có đầy đủ machine-readable representation.
25. Có Mandatory Audit evidence trước implementation.
26. Có SoT documentation sau Audit.
27. Có documentation đủ để developer/AI tuân thủ architecture trong các task SEO tương lai.

---

# 50. Governance Sequence

BRD này khóa **Business Requirement**, không khóa implementation.

Quy trình bắt buộc:

```text
01 — Business Requirement
        ↓
02 — Mandatory Audit
        ↓
03 — Audit PASS
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

---

# 51. Final Owner Mandate

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

### Requirement cuối cùng

> **Xây dựng SEO Platform cấp toàn website, trong đó mọi public URL — bao gồm homepage, static page, article, stock, sector, ecosystem, author, tag, collection và các entity tương lai — đều có một SEO Contract được resolve tự động từ một Source of Truth duy nhất.**
>
> **Hệ thống phải ưu tiên Automatic SEO by Default, tự động sinh canonical, robots, sitemap eligibility, OG/Twitter, structured data, breadcrumb, fallback image, title và description khi có thể; chỉ yêu cầu manual input hoặc override đối với dữ liệu thực sự mang tính editorial/business.**
>
> **Mọi metadata phải truy nguyên được nguồn, template, rule, override và version. Mọi rendering pipeline phải consume cùng SEO contract và không được tự ý tạo/ghi đè metadata.**
>
> **Trước mọi implementation phải thực hiện Mandatory Audit để xác định hiện trạng metadata ownership, rendering pipeline, hardcode, cache, crawler/human differences, Google indexing và SERP gaps.**
>
> **Mục tiêu cuối cùng là biến SEO thành một platform capability của iFlux — không phải một tập hợp các bản sửa SEO riêng lẻ cho từng page.**
