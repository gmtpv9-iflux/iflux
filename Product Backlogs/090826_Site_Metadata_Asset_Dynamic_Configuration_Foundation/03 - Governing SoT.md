# 03 — Governing SoT

# Site Metadata, Asset & Dynamic Configuration Foundation

|                    |                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Task ID**        | `090826_Site_Metadata_Asset_Dynamic_Configuration_Foundation`                                                              |
| **BRD**            | [`01 - Business Requirement.md`](01%20-%20Business%20Requirement.md) · **§16 · 🔒 OWNER LOCKED**                             |
| **Audit**          | [`02 - Mandatory-Audit.md`](02%20-%20Mandatory-Audit.md) · **Rev A · ✅ OWNER APPROVED**                                     |
| **Document**       | **Governing SoT — Authority, Scope, Precedence, Reuse & Governance**                                                       |
| **Date**           | 2026-08-09                                                                                                                 |
| **Rev**            | **B.2** — SOT-15 align Owner IA: **Thiết lập SEO** (hệ thống + từng trang); không Brand / không Page Settings |
| **Governance**     | Product Backlogs Governance §2 — Business Requirement → Mandatory Audit → Governing SoT → Solution → Plan → Implementation |
| **SoT status**     | 🔒 **OWNER APPROVED / LOCKED** (2026-08-09) · Rev B.2 IA align                                                |
| **Implementation** | ❌ **NOT AUTHORIZED**                                                                                                       |
| **Solution**       | ⏳ **AUTHORIZED FOR OWNER REVIEW** — Plan/Impl vẫn khóa đến khi Solution LOCK                                              |
| **Related**        | `040826_Website_SEO_Metadata_Management` — **PENDING / downstream consumer**                                               |

> **Purpose:** Khóa authority / scope / precedence / reuse cho Foundation. Trả lời **BR + Audit** (Governance §2.4). Không override BRD/Audit. Không khóa Solution mechanism.

### Review note (rev. B.1 — 2026-08-09)

| Check | Kết luận | Hành động |
|-------|----------|-----------|
| Bám Audit? | ✅ | Giữ §3 / §34 / §35 |
| Phục vụ BRD? | ✅ | Giữ SOT-01…28 + §32 |
| Governance §2.4? | **PARTIAL** trước B.1 — §33 dạng code block thiếu bảng + cột Trạng thái | **Bổ sung §33 SoT Checklist bảng** |
| Gate Audit | Audit **APPROVED** | Header + §0.2 cập nhật |
| Tên file | Thống nhất hyphen | `01 - …` · `02 - Mandatory-Audit.md` · `03 - Governing SoT.md` |

---

# 0. Governance Gate

## 0.1 Document role

Tài liệu này là **Governing Source of Truth (SoT)** cho Foundation:

> **Site Metadata, Asset & Dynamic Configuration Foundation**

SoT này **không phải Solution Design** và **không phải Implementation Plan**.

SoT có nhiệm vụ khóa:

* configuration authority;
* ownership;
* scope;
* precedence;
* inheritance semantics;
* asset authority;
* runtime authority;
* Admin authority;
* reuse / modify / delete / migrate boundary;
* downstream constraints;
* traceability từ BRD và Mandatory Audit;
* điều kiện để mở Solution.

SoT **không khóa trước**:

* table name cụ thể;
* API path cụ thể;
* request/response schema cụ thể;
* folder/file architecture cụ thể;
* framework/module implementation;
* migration SQL;
* UI layout chi tiết;
* caching implementation;
* deployment procedure.

Các nội dung trên thuộc **Solution / Plan** sau khi SoT được Owner APPROVE.

---

## 0.2 Governance sequence

```text
01 - Business Requirement.md  · 🔒 OWNER LOCKED
        │
        │  BR-01 ... BR-13 · §16
        ▼
02 - Mandatory-Audit.md  · ✅ OWNER APPROVED (Rev A)
        │
        │  AUD-01.x ... AUD-13.x
        ▼
03 - Governing SoT.md  ← THIS DOCUMENT · 🔒 OWNER APPROVED / LOCKED
        │
        │  SOT-xx
        ▼
04 — Solution Design
        │
        ▼
05 — Plan
        │
        ▼
06 — Implementation
        │
        ▼
Evidence A/B/C
        │
        ▼
Final Acceptance
```

> **Flow chuẩn:** BRD LOCK → Audit APPROVE → SoT APPROVE → Solution LOCK → Plan → Impl.  
> Ngoại lệ thứ tự lần này (Audit trước BRD Lock) đã đóng — **không lặp**.

**Không được bỏ qua SoT để đi thẳng từ Audit sang Solution.**

---

# 1. Source References

## 1.1 Primary requirement source

**BRD:**

[`01 - Business Requirement.md`](01%20-%20Business%20Requirement.md)

Requirement registry:

* BR-01 — Global Site Configuration
* BR-02 — Asset Management Foundation
* BR-03 — Page-level Configuration
* BR-04 — Article-level Configuration
* BR-05 — Admin Dynamic Configuration Surface
* BR-06 — Persistence & Authority
* BR-07 — Inheritance & Override
* BR-08 — Runtime Metadata Consumption
* BR-09 — Crawler / Public HTML Readiness
* BR-10 — Validation & Integrity
* BR-11 — Existing Page Compatibility
* BR-12 — Foundation / SEO Separation
* BR-13 — Security & Permission

Atomic source of truth:

> **BRD §16 — BR Checklist Registry**

---

## 1.2 Audit source

**Mandatory Audit:**

[`02 - Mandatory-Audit.md`](02%20-%20Mandatory-Audit.md)

Revision / gate:

> **Rev A — first full atomic audit · ✅ OWNER APPROVED 2026-08-09**

Audit evidence sources:

* `Admin_Design_system/`
* `User_Web/`
* `backend/`
* `infra/`
* Production `https://iflux.vn`
* Production curl/head/favicon evidence
* existing Admin routes / permission catalog
* existing database migrations
* existing runtime metadata pipeline

---

## 1.3 Governance source

Product Backlogs Governance:

* Business Requirement
* Mandatory Audit
* Governing SoT
* Solution
* Plan
* Implementation
* Evidence
* Final Acceptance

Nguyên tắc áp dụng:

> **Audit describes the current state. SoT governs the future authority model. Solution decides how that model is technically realized.**

---

# 2. SoT Decision Principles

## SOT-P-01 — Requirement preservation

SoT **không được thay đổi ý nghĩa BRD**.

Nếu SoT cần quyết định một chi tiết chưa đủ trong BRD:

1. phải chỉ rõ BR liên quan;
2. phải chỉ rõ Audit evidence;
3. phải ghi rationale;
4. nếu vượt khỏi authority của SoT thì đánh dấu `OWNER DECISION REQUIRED`.

---

## SOT-P-02 — Audit traceability mandatory

Mọi governing decision phải truy được:

```text
SoT Decision
    ↓
BR ID
    ↓
Audit ID
    ↓
Evidence / Finding
```

Không có quyết định architecture nào được đưa vào SoT chỉ vì “có vẻ hợp lý” mà không có requirement/evidence support.

---

## SOT-P-03 — Reuse before Create

Theo BRD constraint và Audit §4:

> **Reuse / Modify existing capability trước khi Create capability mới.**

Chỉ tạo authority/storage/module mới khi Solution chứng minh existing capability:

* không thể mở rộng;
* không thể migrate;
* hoặc việc mở rộng làm sai ownership/domain boundary.

---

## SOT-P-04 — Single authority

Một value/configuration chỉ được có **một authoritative source**.

Không cho phép:

```text
DB value
+ localStorage value
+ hard-coded value
+ manifest value
```

cùng tồn tại như các authority song song.

Fallback có thể tồn tại.

**Fallback không được trở thành competing authority.**

---

# 3. Current-State Baseline Governed by Audit

Phần này được giữ trong SoT để tránh mất context khi chuyển sang Solution.

## 3.1 Global

Audit xác nhận:

* `marketing_brand_identity` tồn tại.
* Brand Admin hiện có `name` + `tagline`.
* DB persist được hai giá trị này.
* Runtime public **không consume** Brand DB.
* `brand-identity-page.js` / `brand-identity-store.js` là orphan path dùng localStorage.
* logo/favicon chưa có live global authority.
* default SEO title/description/OG/social chưa có.
* Production `/favicon.ico` trả **404**.
* User_Web shells không có `rel="icon"`.
* public article resolver vẫn hard-code:

  * `site_name: 'iFlux'`.

### Governed interpretation

Global capability hiện tại **không phải foundation hoàn chỉnh**.

`marketing_brand_identity` là **existing reusable candidate**, chưa được xem là final authority cho đến khi SoT/Solution migrate/extend hoàn chỉnh.

---

## 3.2 Page

Audit xác nhận:

* Page catalog / page keys tồn tại.
* `pages/*.manifest.js` tồn tại.
* static HTML có `<title>`.
* `page-definition.js` cung cấp page definition.
* Page Settings tồn tại.
* `page_published_versions` tồn tại.
* Nhưng Page Settings hiện là **widget placement/publishing**, không phải Page SEO configuration.
* Page SEO authority chưa tồn tại.
* Page title/description hiện nằm phân tán trong HTML/manifests.
* Page OG/social image chưa có authority.

### Governed interpretation

> **Page Settings không được mặc định trở thành Page SEO authority.**

Page placement và Page metadata/config là hai domain khác nhau trừ khi Solution chứng minh việc hợp nhất không phá ownership.

---

## 3.3 Article

Audit xác nhận Article là capability trưởng thành nhất:

* Community article Admin edit tồn tại.
* `community_posts.payload` persist SEO.
* SEO title tồn tại.
* SEO description tồn tại.
* canonical tồn tại.
* cover tồn tại.
* `resolveArticleMetadata` tồn tại.
* nginx Pipeline A/B tồn tại.
* client `applyPostSeoToDocument` tồn tại.
* crawler/server HTML cho article đã có pipeline.
* article local fallback tồn tại.

Nhưng:

* Article chưa inherit Global/Page.
* OG/social chưa có dedicated Admin controls đầy đủ.
* image hiện được derive theo pipeline:

  * `seo.og_image`
  * cover
  * body image
* Content Engine có `content_articles` là ownership/domain cần được làm rõ.
* Article resolver hiện có precedence riêng, không phải Foundation precedence.

### Governed interpretation

> Article SEO path được **REUSE**, không rebuild từ zero.

Nhưng phải đưa nó vào Foundation precedence chung.

---

## 3.4 Asset

Audit xác nhận Media Library hiện có:

* upload;
* persistence;
* MIME validation;
* size validation;
* variants;
* public URL;
* usage tracking;
* article media/cover support.

Evidence:

* `043_community_media_library.sql`
* `/api/admin/media`
* `media-process.js`
* `media_assets`
* `media_usages`

Nhưng:

```text
media_usages
    ↓
article_id + field_ref
```

nên chưa phải asset authority cho Global/Page.

Ngoài ra:

```text
brand-identity-page.js
        ↓
FileReader
        ↓
localStorage
```

là authority path không được phép tồn tại sau migration.

---

# 4. Target Foundation Model

## SOT-01 — Three-scope configuration model

**Source**

* BR-01
* BR-03
* BR-04
* BR-06
* BR-07
* BR-08
* Audit V1
* Audit §1.1 AUD-OWN
* Audit §2 BR-06 / BR-07 / BR-08

**Decision**

Foundation sử dụng ba configuration scopes:

```text
GLOBAL
   ↓
PAGE
   ↓
ARTICLE
```

### GLOBAL

Default cho toàn site:

* site identity;
* global brand assets;
* default metadata;
* default social/OG configuration.

### PAGE

Override theo public page:

* page title;
* page description;
* page OG image;
* page social/share image;
* các metadata fields thuộc BRD.

### ARTICLE

Override theo article:

* article title;
* article description;
* article OG image;
* article social/share image;
* article-specific metadata thuộc BRD.

**Decision status: GOVERNED**

---

# 5. SOT-02 — Global Authority

**Source**

* BR-01.1–01.10
* BR-05.1
* BR-06.1
* BR-06.5–06.10
* BR-07.1
* BR-08.1
* AUD-01.1–01.10
* AUD-06.1, AUD-06.5–06.10
* AUD-07.1
* AUD-08.1
* Findings V1, V2, V7, V8

**Decision**

Foundation phải có **một Global Configuration Authority**.

Existing:

```text
marketing_brand_identity
```

được xem là **reuse candidate / migration candidate**.

Không được mặc định tạo một Global Configuration table mới chỉ vì dễ implement.

Solution phải ưu tiên:

```text
existing authority
        ↓
extend / normalize / migrate
        ↓
runtime consume
```

Chỉ khi Solution chứng minh existing authority không phù hợp mới được đề xuất authority mới.

### Global authoritative capabilities

Global authority phải có khả năng govern:

* Site Name
* Site Description
* Favicon
* Site Logo
* Default SEO Title
* Default Meta Description
* Default OG Image
* Default Social/Share Image

### Không được

```text
DB brand name
+
hard-coded "iFlux"
+
localStorage brand name
```

làm authority đồng thời.

**Decision status: GOVERNED**

---

# 6. SOT-03 — Page Configuration Authority

**Source**

* BR-03.1–03.10
* BR-05.2
* BR-06.2
* BR-07.2
* BR-08.2–08.4
* AUD-03.1–03.10
* AUD-05.2
* AUD-06.2
* AUD-07.2
* AUD-08.2–08.4
* Finding V4

**Decision**

Page SEO/configuration phải có **authoritative persistent configuration** độc lập về semantics với widget placement.

Page Settings hiện tại:

```text
Page Settings
    =
widget placement / publish configuration
```

không được coi là Page SEO authority chỉ vì nó đã tồn tại.

### Page authority phải govern

* page identity;
* SEO title;
* meta description;
* OG image;
* social/share image;
* override state so với Global.

### Existing manifests

`pages/*.manifest.js`, static `<title>` và `page-definition.js` được coi là:

> **legacy/default implementation source — không phải long-term configuration authority.**

Sau migration:

```text
Page manifest/static HTML
```

không được là primary authority cho Admin-configurable metadata.

**Decision status: GOVERNED**

---

# 7. SOT-04 — Article Configuration Authority

**Source**

* BR-04.1–04.10
* BR-07.3–07.4
* BR-08.3
* BR-09.4
* AUD-04.1–04.10
* AUD-07.3–07.4
* AUD-08.3
* AUD-09.4
* Finding V5

**Decision**

Community Article SEO hiện tại là **primary reuse candidate**.

Không rebuild article metadata pipeline từ zero.

Reuse:

* existing article SEO Admin;
* `community_posts.payload`;
* article resolver;
* Pipeline A;
* Pipeline B;
* client document SEO application.

Nhưng Article authority phải được đưa vào Foundation inheritance model.

### Article local config

Article chỉ lưu **override values**, không bắt buộc duplicate Global/Page values.

Ví dụ:

```text
Global title = "iFlux"
Page title   = null
Article title = null
```

→ effective title = Global.

Nếu:

```text
Global title = "iFlux"
Page title   = "Cộng đồng · iFlux"
Article title = null
```

→ effective title = Page.

Nếu:

```text
Article title = "..."
```

→ effective title = Article.

**Decision status: GOVERNED**

---

# 8. SOT-05 — Global → Page → Article Precedence

**Source**

* BRD §6
* BR-07.1–07.10
* BR-08
* BR-10.6–10.7
* AUD-07.1–07.10
* AUD-08.1–08.10
* Finding V1

**Decision**

Precedence chính thức:

```text
ARTICLE
   ↓
PAGE
   ↓
GLOBAL
   ↓
FALLBACK POLICY
```

Tương đương:

```text
Article override
    OR Page override
    OR Global default
    OR system fallback
```

### Rule

Một scope chỉ override field mà nó thực sự cấu hình.

Không copy toàn bộ inherited object xuống child scope chỉ để biểu diễn effective value.

---

# 9. SOT-06 — Empty / Null Override Semantics

**Source**

* BR-07.7
* BR-10.4
* BR-10.6
* BR-10.7
* AUD-07.7
* AUD-10.4–10.7

**Decision**

`empty / null / absent` không được mặc định có nghĩa:

> “xóa inherited value”.

Default semantics:

```text
no override
    =
inherit parent
```

Nếu cần explicit clear trong tương lai, phải có semantics riêng được govern trước.

### Required distinction

System phải phân biệt:

```text
INHERITED
OVERRIDDEN
INVALID
UNSET
```

không được collapse tất cả thành empty string.

**Decision status: GOVERNED**

---

# 10. SOT-07 — Effective Configuration Resolver

**Source**

* BR-06.7
* BR-07.6–07.10
* BR-08.1–08.10
* BR-10.6–10.7
* AUD-07
* AUD-08
* AUD-10
* Findings V1, V7

**Decision**

Foundation phải có **một semantic resolver** cho effective configuration.

Mọi runtime consumer phải dùng cùng precedence semantics.

Không cho phép mỗi module tự định nghĩa:

```text
Article fallback A
Page fallback B
SEO fallback C
Manifest fallback D
```

### Resolver conceptual contract

```text
resolveEffectiveConfig({
    global,
    page,
    article
})
        ↓
effective configuration
```

Solution quyết định implementation/module/API cụ thể.

SoT chỉ khóa:

> **Một semantic resolution model duy nhất.**

---

# 11. SOT-08 — Runtime Authority

**Source**

* BR-06.5–06.10
* BR-08.1–08.10
* BR-09.1–09.6
* AUD-06.5–06.10
* AUD-08.1–08.10
* AUD-09.1–09.6
* Findings V7, V8

**Decision**

Runtime public output phải consume **effective configuration**, không consume arbitrary legacy source.

Target:

```text
Admin
  ↓
Persistent Authority
  ↓
Effective Resolver
  ↓
Public Runtime
  ↓
HTML / metadata / assets
```

Không được:

```text
Admin DB
      X
      ↓
Public runtime
```

hoặc:

```text
Admin DB
   X

Hard-coded HTML
   ↓
Public runtime
```

### Critical requirement

`resolveArticleMetadata.site_name: 'iFlux'` không được tiếp tục là authority.

Hard-coded `iFlux` chỉ có thể tồn tại như **fallback policy**, nếu BR/Solution xác nhận cần fallback.

**Decision status: GOVERNED**

---

# 12. SOT-09 — Public HTML / Crawler Authority

**Source**

* BR-08
* BR-09.1–09.6
* AUD-08
* AUD-09
* Finding V8
* Production evidence

**Decision**

Public metadata phải có khả năng xuất hiện trong **server/public HTML path**, không phụ thuộc hoàn toàn vào client-side JavaScript.

Đặc biệt:

```text
Hub / Page
```

không được chỉ có:

```html
<title>...</title>
```

mà thiếu effective description / OG / required metadata khi BR yêu cầu.

Article Pipeline A/B hiện tại được **REUSE**.

### Target

```text
Effective Config
      ↓
Public HTML generation
      ↓
Crawler-readable metadata
```

Client-side metadata application có thể tiếp tục tồn tại cho SPA/runtime update nhưng:

> **Không được là sole authority cho crawler-critical metadata.**

**Decision status: GOVERNED**

---

# 13. SOT-10 — Asset Authority

**Source**

* BR-02.1–02.10
* BR-05.7
* BR-06.4
* BR-08.8
* BR-10.2, BR-10.5
* BR-13.3–13.5
* AUD-02.1–02.10
* AUD-05.7
* AUD-06.4
* AUD-08.8
* AUD-10.2, AUD-10.5
* AUD-13.3–13.5
* Finding V6

**Decision**

Foundation phải có **single persistent asset authority** cho configuration assets.

Existing Community Media Library là **reuse candidate**.

Target capability:

```text
Upload
 ↓
Validate
 ↓
Persist
 ↓
Reference
 ↓
Usage
 ↓
Runtime resolve
```

Asset authority phải có khả năng phục vụ:

```text
GLOBAL
PAGE
ARTICLE
```

configuration usage.

### Existing article media

Được giữ và mở rộng.

### Existing localStorage brand asset

Không được giữ làm authority.

`iflux_brand_identity_v1`:

> **DELETE / MIGRATE**

không phải persistent configuration source.

---

# 14. SOT-11 — Asset Validation

**Source**

* BR-02.4–02.5
* BR-10.2
* BR-10.5
* BR-13.3–13.4
* AUD-02.4–02.5
* AUD-10.2
* AUD-10.5
* AUD-13.3–13.4

**Decision**

Global/Page/Article configuration assets phải đi qua cùng governance principle:

```text
MIME validation
+
size validation
+
image integrity validation
+
persistent reference
```

Không được tồn tại:

```text
Brand asset
→ FileReader
→ localStorage
```

bypass asset authority.

Existing media validation pipeline được **REUSE**.

Solution sẽ quyết định cụ thể validation implementation.

---

# 15. SOT-12 — Asset Usage / Reuse Model

**Source**

* BR-02.7
* BR-02.10
* BR-06.4
* AUD-02.7
* AUD-02.10
* Finding V6

**Decision**

Một asset có thể được reference bởi nhiều configuration scopes.

Conceptual model:

```text
Asset
 ├── GLOBAL usage
 ├── PAGE usage
 └── ARTICLE usage
```

Không duplicate binary chỉ vì asset được dùng ở nhiều scope.

Asset usage metadata phải có khả năng xác định:

* owner/reference;
* scope;
* field;
* usage;
* replacement/dependency implications.

Implementation schema thuộc Solution.

---

# 16. SOT-13 — OG Image vs Social/Share Image

**Source**

* BR-01.7–01.8
* BR-03.5–03.6
* BR-04.5–04.6
* AUD-01.7–01.8
* AUD-03.5–03.6
* AUD-04.5–04.6
* Finding V5

**Decision**

BRD hiện tại phân biệt:

```text
OG Image
Social/Share Image
```

SoT **không tự gộp hai semantic field** chỉ vì implementation hiện tại dùng chung image pipeline.

### Rule

Solution phải xác định:

1. có một physical asset reference dùng cho cả hai;
2. hay có hai independently configurable references;

nhưng phải bảo toàn BRD semantics.

Nếu dùng một value cho cả hai:

> phải được biểu diễn như **shared effective value**, không được làm mất distinction trong governing model.

**Status: SOLUTION CONSTRAINT**

---

# 17. SOT-14 — Site Identity Authority

**Source**

* BR-01.1–01.4
* BR-06.5–06.10
* BR-08.8–08.10
* AUD-01.1–01.4
* AUD-06.5–06.10
* AUD-08.8–08.10
* Findings V2, V3, V7, V8

**Decision**

Site identity phải có một authority thống nhất cho:

```text
Site Name
Site Description
Logo
Favicon
```

### Existing conflicting authorities

| Existing path                 | SoT treatment                               |
| ----------------------------- | ------------------------------------------- |
| `marketing_brand_identity`    | **REUSE / EXTEND**                          |
| hard-coded SVG logo           | **MIGRATE AWAY**                            |
| hard-coded `iFlux`            | **MIGRATE AWAY**                            |
| localStorage brand identity   | **DELETE / MIGRATE**                        |
| `/favicon.ico` static absence | **FIX through governed asset/runtime path** |

---

# 18. SOT-15 — Page Settings Boundary

**Source**

* BR-03.2
* BR-03.7
* BR-05.2
* AUD-03.2
* AUD-03.7
* AUD-05.2
* Finding V4
* **Solution OD-SOL-03 Rev A.2** (Owner LOCK Admin IA)

**Decision**

Page Settings / **Cài đặt Trang** hiện tại tiếp tục giữ domain:

> **widget placement / page publishing / giao diện**

**CẤM** biến Cài đặt Trang thành SEO / Page metadata authority.

### Admin surface (Solution-locked · Owner)

Page configuration Admin **không** nằm trong Page Settings.

```text
Thiết lập SEO
  └── Thiết lập SEO từng trang
```

Global configuration Admin **không** nằm trong Nhận diện thương hiệu:

```text
Thiết lập SEO
  └── Thiết lập SEO hệ thống
```

`Thiết lập SEO` là mục riêng, **cùng cấp** với Nhận diện thương hiệu.

Authority semantics vẫn thuộc Foundation; exact route/file thuộc Plan.

**Decision status: GOVERNED** (+ Solution IA LOCK A.2)

---

# 19. SOT-16 — Category SEO Boundary

**Source**

* Audit V9
* AUD-03 adjacent finding
* Existing `seo_*` category columns

**Decision**

Category SEO hiện có được xác định là:

> **Adjacent capability — không tự động thuộc Page Foundation.**

Không được kéo Category SEO vào Foundation chỉ vì nó có field `seo_*`.

Trước khi gộp:

* phải chứng minh entity ownership;
* phải map BR;
* phải map Audit;
* phải có Solution decision.

Trong Foundation hiện tại:

> **Category SEO remains adjacent / downstream boundary.**

---

# 20. SOT-17 — Content Engine Boundary

**Source**

* BR-04
* AUD-04.1
* Audit finding về `content_articles`
* Existing Community Article implementation

**Decision**

Community Article hiện là **proven Article reuse path**.

`content_articles` là một ownership/domain cần được phân biệt trước khi gộp vào Article Foundation.

Không được tự động:

```text
community_posts
+
content_articles
```

thành một authority chỉ vì cùng có SEO fields.

Solution phải chứng minh:

* ownership;
* lifecycle;
* public identity;
* resolver compatibility;
* migration impact.

Nếu chưa chứng minh:

> Community Article path được govern trước; Content Engine remains boundary.

---

# 21. SOT-18 — Admin Authority

**Source**

* BR-05.1–05.10
* BR-13.1–13.6
* AUD-05
* AUD-13
* Existing RBAC evidence

**Decision**

Configuration phải được quản lý thông qua authenticated Admin surfaces.

Target:

```text
Admin UI
   ↓
Authorized Admin API
   ↓
Persistent Authority
```

Không chấp nhận:

```text
API-only configuration
```

cho các configuration fields mà BRD yêu cầu Admin quản lý.

---

# 22. SOT-19 — RBAC Boundary

**Source**

* BR-13.1–13.6
* AUD-13.1–13.6

Existing permission patterns:

```text
marketing.brand_identity.*
interface.page_settings.*
community/media permissions
```

được reuse theo domain.

Mọi Foundation surface mới phải:

* authenticated;
* permission checked;
* không bypass Admin RBAC;
* public read chỉ expose fields được phép public.

### Important distinction

```text
Admin write authority
        ≠
Public read authority
```

Brand hiện tại là Admin-only và runtime không đọc.

Foundation phải thiết kế public-read contract riêng cho **effective public configuration**, không expose Admin API trực tiếp.

---

# 23. SOT-20 — Public Read Boundary

**Source**

* BR-08
* BR-09
* BR-13.5
* AUD-08
* AUD-09
* AUD-13.5

Public runtime cần access:

```text
effective public configuration
```

không phải raw Admin configuration.

Conceptually:

```text
Admin Config
     ↓
Authority
     ↓
Resolver
     ↓
Public-safe Effective Config
     ↓
Runtime
```

Không expose:

* internal Admin-only fields;
* permission metadata;
* audit internals;
* unpublished configuration;
* sensitive storage metadata.

Solution quyết định API/server rendering mechanism.

---

# 24. SOT-21 — Validation & Integrity Authority

**Source**

* BR-10.1–10.8
* AUD-10.1–10.8

Foundation phải có thống nhất về:

```text
Input validation
Asset validation
Persistence validation
Effective-value validation
Runtime fallback
Admin feedback
```

Existing article/media validation được reuse.

Không chấp nhận mỗi module có một validation semantic khác nhau.

---

# 25. SOT-22 — Fallback Policy

**Source**

* BR-10.4
* BR-10.6
* BR-10.7
* BR-11.3–11.4
* AUD-10.4–10.7
* AUD-11.3–11.4

Fallback hierarchy:

```text
Article override
    ↓
Page override
    ↓
Global default
    ↓
System fallback
```

System fallback chỉ là **last-resort fallback**, không phải configuration authority.

Ví dụ:

```text
hard-coded "iFlux"
```

chỉ được tồn tại ở fallback layer nếu cần compatibility.

Nó không được trở thành primary metadata source.

---

# 26. SOT-23 — Existing Page Compatibility

**Source**

* BR-11.1–11.7
* AUD-11.1–11.7

Current baseline:

* `/home` render được;
* articles render được;
* existing pages use static/manifests;
* existing metadata is distributed;
* migration chưa thực hiện.

### Governing rule

Foundation migration phải là:

> **non-destructive migration**

Không được:

* làm mất existing metadata;
* phá public routes;
* phá article rendering;
* phá Admin surfaces;
* phá existing article SEO pipeline.

Existing behavior phải được inventory trước khi migrate.

---

# 27. SOT-24 — Legacy Authority Migration

**Source**

* BR-06.10
* BR-08
* BR-11
* AUD-OWN
* AUD-03
* AUD-06
* AUD-08
* Findings V3, V4, V7

Các legacy sources được phân loại:

| Legacy source                    | Governance                                           |
| -------------------------------- | ---------------------------------------------------- |
| static page `<title>`            | migrate to fallback/config                           |
| `pages/*.manifest.js` SEO values | migrate / compatibility fallback                     |
| `page-definition.js` metadata    | no longer primary authority                          |
| hard-coded `iFlux`               | fallback only during transition, then remove if safe |
| hard-coded SVG brand logo        | migrate to asset authority                           |
| orphan localStorage brand store  | delete                                               |
| article resolver                 | reuse + integrate into shared precedence             |

Không được xóa legacy path trước khi replacement authority tồn tại và evidence chứng minh compatibility.

---

# 28. SOT-25 — Single Authority Matrix

| Domain               | Current authority         | Target authority                             | SoT treatment              |
| -------------------- | ------------------------- | -------------------------------------------- | -------------------------- |
| Global Site Name     | DB + hardcode             | Global Foundation Authority                  | Modify/reuse               |
| Global Description   | missing/tagline           | Global Foundation Authority                  | Add capability             |
| Global Logo          | hardcoded SVG / orphan    | Asset Authority                              | Migrate                    |
| Global Favicon       | missing / 404             | Asset Authority                              | Add                        |
| Global SEO defaults  | missing                   | Global Foundation Authority                  | Add                        |
| Page title           | HTML/manifests            | Page Authority                               | Migrate                    |
| Page description     | manifests                 | Page Authority                               | Migrate                    |
| Page OG              | missing                   | Page Authority                               | Add                        |
| Page social image    | missing                   | Page Authority                               | Add                        |
| Article SEO          | `community_posts.payload` | Article Authority integrated with Foundation | Reuse/extend               |
| Article OG           | derived                   | Article Authority                            | Extend                     |
| Article social image | derived/shared            | Article Authority                            | Govern                     |
| Asset binary         | Media Library + orphan    | Single Asset Authority                       | Extend/delete              |
| Effective metadata   | module-specific           | Shared Resolver                              | Create semantic capability |
| Public output        | mixed                     | Effective Runtime Authority                  | Migrate                    |
| Category SEO         | category DB               | Category domain                              | Adjacent                   |

---

# 29. SOT-26 — Reuse / Modify / Delete / Create Registry

| Existing capability              | SoT decision          | Reason                                        |
| -------------------------------- | --------------------- | --------------------------------------------- |
| `marketing_brand_identity`       | **MODIFY / EXTEND**   | Existing persistent global identity authority |
| Brand Admin route                | **REUSE / EXTEND**    | Existing Admin IA/RBAC                        |
| `brand-identity-page.js` orphan  | **DELETE / MIGRATE**  | localStorage violates single authority        |
| `brand-identity-store.js` orphan | **DELETE / MIGRATE**  | browser-state authority                       |
| Community Media Library          | **REUSE / EXTEND**    | strongest existing asset pipeline             |
| `media_assets`                   | **REUSE / EXTEND**    | existing persistent asset authority           |
| `media_usages`                   | **EXTEND**            | current article-only scope                    |
| Article SEO Admin                | **REUSE**             | mature existing path                          |
| `community_posts.payload`        | **REUSE / EXTEND**    | existing Article persistence                  |
| `resolveArticleMetadata`         | **REUSE / REFACTOR**  | existing effective article path               |
| nginx Pipeline A/B               | **REUSE / EXTEND**    | existing crawler-ready article path           |
| `applyPostSeoToDocument`         | **REUSE**             | client runtime application                    |
| Page Settings                    | **KEEP AS PLACEMENT** | wrong semantic domain for SEO authority       |
| Page manifests                   | **MIGRATE**           | current static authority                      |
| hard-coded SVG logo              | **MIGRATE**           | duplicate asset authority                     |
| hard-coded `site_name: 'iFlux'`  | **MIGRATE**           | duplicate identity authority                  |
| Category SEO                     | **KEEP ADJACENT**     | different ownership/domain                    |
| Content Engine SEO               | **BOUNDARY REVIEW**   | ownership not yet unified                     |

---

# 30. SOT-27 — Explicit Non-Goals

SoT này **không mở rộng Foundation thành full SEO strategy**.

Out of scope:

* sitemap strategy;
* robots strategy;
* SERP strategy;
* keyword strategy;
* SEO content strategy;
* search ranking optimization;
* structured-data strategy beyond metadata capability required by BRD;
* Google Search Console operations;
* SEO analytics strategy.

Các nội dung này thuộc:

```text
040826_Website_SEO_Metadata_Management
```

Foundation chỉ cung cấp capability để downstream SEO sử dụng.

---

# 31. SOT-28 — SEO Dependency

**Source**

* BR-12.1–12.5
* AUD-12.1–12.5
* Finding V10

Dependency:

```text
090826 Foundation
        ↓
        ↓ provides authority / resolver / asset / runtime capability
        ↓
040826 Website SEO Metadata Management
```

SEO epic không được tạo lại:

* Global config infrastructure;
* Page config infrastructure;
* Asset authority;
* inheritance resolver;
* public metadata authority.

SEO chỉ consume Foundation.

---

# 32. Full BR → Audit → SoT Traceability

Đây là registry bắt buộc để Solution truy ngược.

| BR    | Requirement group         | Audit evidence                                  | Primary SoT            |
| ----- | ------------------------- | ----------------------------------------------- | ---------------------- |
| BR-01 | Global Site Configuration | AUD-01.1–01.10; AUD-OWN; AUD-ASSET; V1/V2/V7/V8 | SOT-02, 14             |
| BR-02 | Asset Foundation          | AUD-02.1–02.10; AUD-ASSET; V3/V6                | SOT-10, 11, 12         |
| BR-03 | Page Configuration        | AUD-03.1–03.10; V4/V9                           | SOT-03, 15             |
| BR-04 | Article Configuration     | AUD-04.1–04.10; V5                              | SOT-04, 13, 17         |
| BR-05 | Admin Dynamic Surface     | AUD-05.1–05.10                                  | SOT-02, 03, 04, 18     |
| BR-06 | Persistence & Authority   | AUD-06.1–06.10; AUD-OWN                         | SOT-02, 07, 08, 14, 25 |
| BR-07 | Inheritance & Override    | AUD-07.1–07.10; V1                              | SOT-05, 06, 07         |
| BR-08 | Runtime Consumption       | AUD-08.1–08.10; AUD-REN; V7/V8                  | SOT-07, 08, 09, 20     |
| BR-09 | Crawler/Public HTML       | AUD-09.1–09.6; AUD-REN; V8                      | SOT-09                 |
| BR-10 | Validation/Integrity      | AUD-10.1–10.8                                   | SOT-06, 11, 21, 22     |
| BR-11 | Existing Compatibility    | AUD-11.1–11.7                                   | SOT-22, 23, 24         |
| BR-12 | Foundation/SEO separation | AUD-12.1–12.5; V10                              | SOT-27, 28             |
| BR-13 | Security/Permission       | AUD-13.1–13.6                                   | SOT-18, 19, 20         |

---

# 33. SoT Checklist — trả lời BR + Audit (Governance §2.4)

Checklist **bắt buộc dạng bảng**. Mỗi atomic Req ID một hàng.  
Cột **Trạng thái** = trạng thái **governing** tại SoT (không phải Final Verification PASS).

| Trạng thái | Ý nghĩa |
|------------|---------|
| **GOVERNED** | Authority / rule đã khóa; Solution phải tuân |
| **CONSTRAINT** | SoT khóa constraint; chi tiết physical/API thuộc Solution |
| **BOUNDARY** | Ngoài Foundation hoặc adjacent — không tự gộp |
| **OPEN-SOL** | Conceptual governed; design cụ thể mở cho Solution |

### 33.1 BR-01 — Global Site Configuration

| BR | Req ID | Audit | SoT | Trạng thái |
|----|--------|-------|-----|------------|
| BR-01 | BR-01.1 | AUD-01.1 | SOT-02 · SOT-14 | GOVERNED |
| BR-01 | BR-01.2 | AUD-01.2 | SOT-02 | GOVERNED |
| BR-01 | BR-01.3 | AUD-01.3 | SOT-10 · SOT-14 | GOVERNED |
| BR-01 | BR-01.4 | AUD-01.4 | SOT-10 · SOT-14 | GOVERNED |
| BR-01 | BR-01.5 | AUD-01.5 | SOT-02 | GOVERNED |
| BR-01 | BR-01.6 | AUD-01.6 | SOT-02 | GOVERNED |
| BR-01 | BR-01.7 | AUD-01.7 | SOT-02 · SOT-13 | GOVERNED |
| BR-01 | BR-01.8 | AUD-01.8 | SOT-02 · SOT-13 | GOVERNED |
| BR-01 | BR-01.9 | AUD-01.9 | SOT-02 | GOVERNED |
| BR-01 | BR-01.10 | AUD-01.10 | SOT-08 · SOT-14 | GOVERNED |

### 33.2 BR-02 — Asset Management Foundation

| BR | Req ID | Audit | SoT | Trạng thái |
|----|--------|-------|-----|------------|
| BR-02 | BR-02.1 | AUD-02.1 | SOT-10 | GOVERNED |
| BR-02 | BR-02.2 | AUD-02.2 | SOT-10 · SOT-12 | GOVERNED |
| BR-02 | BR-02.3 | AUD-02.3 | SOT-10 | GOVERNED |
| BR-02 | BR-02.4 | AUD-02.4 | SOT-11 | GOVERNED |
| BR-02 | BR-02.5 | AUD-02.5 | SOT-11 | GOVERNED |
| BR-02 | BR-02.6 | AUD-02.6 | SOT-10 · SOT-12 | GOVERNED |
| BR-02 | BR-02.7 | AUD-02.7 | SOT-12 | GOVERNED |
| BR-02 | BR-02.8 | AUD-02.8 | SOT-10 · SOT-14 | GOVERNED |
| BR-02 | BR-02.9 | AUD-02.9 | SOT-08 · SOT-10 | GOVERNED |
| BR-02 | BR-02.10 | AUD-02.10 | SOT-10 · SOT-12 | GOVERNED |

### 33.3 BR-03 — Page-level Configuration

| BR | Req ID | Audit | SoT | Trạng thái |
|----|--------|-------|-----|------------|
| BR-03 | BR-03.1 | AUD-03.1 | SOT-03 | GOVERNED |
| BR-03 | BR-03.2 | AUD-03.2 | SOT-15 | GOVERNED |
| BR-03 | BR-03.3 | AUD-03.3 | SOT-03 · SOT-24 | GOVERNED |
| BR-03 | BR-03.4 | AUD-03.4 | SOT-03 · SOT-24 | GOVERNED |
| BR-03 | BR-03.5 | AUD-03.5 | SOT-03 · SOT-13 | GOVERNED |
| BR-03 | BR-03.6 | AUD-03.6 | SOT-03 · SOT-13 | GOVERNED |
| BR-03 | BR-03.7 | AUD-03.7 | SOT-03 | GOVERNED |
| BR-03 | BR-03.8 | AUD-03.8 | SOT-05 | GOVERNED |
| BR-03 | BR-03.9 | AUD-03.9 | SOT-05 · SOT-06 | GOVERNED |
| BR-03 | BR-03.10 | AUD-03.10 | SOT-07 · SOT-08 | GOVERNED |

### 33.4 BR-04 — Article-level Configuration

| BR | Req ID | Audit | SoT | Trạng thái |
|----|--------|-------|-----|------------|
| BR-04 | BR-04.1 | AUD-04.1 | SOT-04 · SOT-17 | GOVERNED |
| BR-04 | BR-04.2 | AUD-04.2 | SOT-04 | GOVERNED |
| BR-04 | BR-04.3 | AUD-04.3 | SOT-04 | GOVERNED |
| BR-04 | BR-04.4 | AUD-04.4 | SOT-04 | GOVERNED |
| BR-04 | BR-04.5 | AUD-04.5 | SOT-04 · SOT-13 | GOVERNED |
| BR-04 | BR-04.6 | AUD-04.6 | SOT-04 · SOT-13 | GOVERNED |
| BR-04 | BR-04.7 | AUD-04.7 | SOT-04 | GOVERNED |
| BR-04 | BR-04.8 | AUD-04.8 | SOT-05 | GOVERNED |
| BR-04 | BR-04.9 | AUD-04.9 | SOT-05 · SOT-06 | GOVERNED |
| BR-04 | BR-04.10 | AUD-04.10 | SOT-04 · SOT-08 · SOT-09 | GOVERNED |

### 33.5 BR-05 — Admin Dynamic Configuration Surface

| BR | Req ID | Audit | SoT | Trạng thái |
|----|--------|-------|-----|------------|
| BR-05 | BR-05.1 | AUD-05.1 | SOT-02 · SOT-18 | GOVERNED |
| BR-05 | BR-05.2 | AUD-05.2 | SOT-03 · SOT-15 · SOT-18 | GOVERNED |
| BR-05 | BR-05.3 | AUD-05.3 | SOT-04 · SOT-18 | GOVERNED |
| BR-05 | BR-05.4 | AUD-05.4 | SOT-18 | GOVERNED |
| BR-05 | BR-05.5 | AUD-05.5 | SOT-18 | GOVERNED |
| BR-05 | BR-05.6 | AUD-05.6 | SOT-18 | GOVERNED |
| BR-05 | BR-05.7 | AUD-05.7 | SOT-10 · SOT-18 | GOVERNED |
| BR-05 | BR-05.8 | AUD-05.8 | SOT-08 · SOT-18 | GOVERNED |
| BR-05 | BR-05.9 | AUD-05.9 | SOT-18 | GOVERNED |
| BR-05 | BR-05.10 | AUD-05.10 | SOT-18 · SOT-19 | GOVERNED |

### 33.6 BR-06 — Persistence & Authority

| BR | Req ID | Audit | SoT | Trạng thái |
|----|--------|-------|-----|------------|
| BR-06 | BR-06.1 | AUD-06.1 | SOT-02 | GOVERNED |
| BR-06 | BR-06.2 | AUD-06.2 | SOT-03 | GOVERNED |
| BR-06 | BR-06.3 | AUD-06.3 | SOT-04 | GOVERNED |
| BR-06 | BR-06.4 | AUD-06.4 | SOT-10 · SOT-12 | GOVERNED |
| BR-06 | BR-06.5 | AUD-06.5 | SOT-02 · SOT-07 · SOT-25 | GOVERNED |
| BR-06 | BR-06.6 | AUD-06.6 | SOT-02 · SOT-14 | GOVERNED |
| BR-06 | BR-06.7 | AUD-06.7 | SOT-07 · SOT-08 | GOVERNED |
| BR-06 | BR-06.8 | AUD-06.8 | SOT-18 | GOVERNED |
| BR-06 | BR-06.9 | AUD-06.9 | SOT-01 | GOVERNED |
| BR-06 | BR-06.10 | AUD-06.10 | SOT-08 · SOT-24 | GOVERNED |

### 33.7 BR-07 — Inheritance & Override

| BR | Req ID | Audit | SoT | Trạng thái |
|----|--------|-------|-----|------------|
| BR-07 | BR-07.1 | AUD-07.1 | SOT-02 · SOT-05 | GOVERNED |
| BR-07 | BR-07.2 | AUD-07.2 | SOT-03 · SOT-05 | GOVERNED |
| BR-07 | BR-07.3 | AUD-07.3 | SOT-04 · SOT-05 | GOVERNED |
| BR-07 | BR-07.4 | AUD-07.4 | SOT-05 | GOVERNED |
| BR-07 | BR-07.5 | AUD-07.5 | SOT-05 | GOVERNED |
| BR-07 | BR-07.6 | AUD-07.6 | SOT-07 | GOVERNED |
| BR-07 | BR-07.7 | AUD-07.7 | SOT-06 | GOVERNED |
| BR-07 | BR-07.8 | AUD-07.8 | SOT-06 · SOT-18 | GOVERNED |
| BR-07 | BR-07.9 | AUD-07.9 | SOT-07 | GOVERNED |
| BR-07 | BR-07.10 | AUD-07.10 | SOT-07 | GOVERNED |

### 33.8 BR-08 — Runtime Metadata Consumption

| BR | Req ID | Audit | SoT | Trạng thái |
|----|--------|-------|-----|------------|
| BR-08 | BR-08.1 | AUD-08.1 | SOT-02 · SOT-07 · SOT-08 | GOVERNED |
| BR-08 | BR-08.2 | AUD-08.2 | SOT-03 · SOT-07 · SOT-08 | GOVERNED |
| BR-08 | BR-08.3 | AUD-08.3 | SOT-04 · SOT-07 · SOT-08 | GOVERNED |
| BR-08 | BR-08.4 | AUD-08.4 | SOT-03 · SOT-08 | GOVERNED |
| BR-08 | BR-08.5 | AUD-08.5 | SOT-08 · SOT-09 | GOVERNED |
| BR-08 | BR-08.6 | AUD-08.6 | SOT-09 · SOT-13 | GOVERNED |
| BR-08 | BR-08.7 | AUD-08.7 | SOT-09 · SOT-13 | GOVERNED |
| BR-08 | BR-08.8 | AUD-08.8 | SOT-10 · SOT-14 | GOVERNED |
| BR-08 | BR-08.9 | AUD-08.9 | SOT-08 | GOVERNED |
| BR-08 | BR-08.10 | AUD-08.10 | SOT-07 · SOT-08 | GOVERNED |

### 33.9 BR-09 — Crawler / Public HTML Readiness

| BR | Req ID | Audit | SoT | Trạng thái |
|----|--------|-------|-----|------------|
| BR-09 | BR-09.1 | AUD-09.1 | SOT-09 | GOVERNED |
| BR-09 | BR-09.2 | AUD-09.2 | SOT-09 | GOVERNED |
| BR-09 | BR-09.3 | AUD-09.3 | SOT-09 | GOVERNED |
| BR-09 | BR-09.4 | AUD-09.4 | SOT-04 · SOT-09 | GOVERNED |
| BR-09 | BR-09.5 | AUD-09.5 | SOT-08 · SOT-09 | GOVERNED |
| BR-09 | BR-09.6 | AUD-09.6 | SOT-09 | GOVERNED |

### 33.10 BR-10 — Validation & Integrity

| BR | Req ID | Audit | SoT | Trạng thái |
|----|--------|-------|-----|------------|
| BR-10 | BR-10.1 | AUD-10.1 | SOT-21 | GOVERNED |
| BR-10 | BR-10.2 | AUD-10.2 | SOT-11 | GOVERNED |
| BR-10 | BR-10.3 | AUD-10.3 | SOT-21 | GOVERNED |
| BR-10 | BR-10.4 | AUD-10.4 | SOT-06 · SOT-21 | GOVERNED |
| BR-10 | BR-10.5 | AUD-10.5 | SOT-11 | GOVERNED |
| BR-10 | BR-10.6 | AUD-10.6 | SOT-07 · SOT-22 | GOVERNED |
| BR-10 | BR-10.7 | AUD-10.7 | SOT-06 · SOT-07 · SOT-22 | GOVERNED |
| BR-10 | BR-10.8 | AUD-10.8 | SOT-21 · SOT-18 | GOVERNED |

### 33.11 BR-11 — Existing Page Compatibility

| BR | Req ID | Audit | SoT | Trạng thái |
|----|--------|-------|-----|------------|
| BR-11 | BR-11.1 | AUD-11.1 | SOT-23 | GOVERNED |
| BR-11 | BR-11.2 | AUD-11.2 | SOT-23 | GOVERNED |
| BR-11 | BR-11.3 | AUD-11.3 | SOT-22 · SOT-23 | GOVERNED |
| BR-11 | BR-11.4 | AUD-11.4 | SOT-04 · SOT-22 | GOVERNED |
| BR-11 | BR-11.5 | AUD-11.5 | SOT-23 · SOT-24 | GOVERNED |
| BR-11 | BR-11.6 | AUD-11.6 | SOT-23 | GOVERNED |
| BR-11 | BR-11.7 | AUD-11.7 | SOT-23 | GOVERNED |

### 33.12 BR-12 — Foundation / SEO Separation

| BR | Req ID | Audit | SoT | Trạng thái |
|----|--------|-------|-----|------------|
| BR-12 | BR-12.1 | AUD-12.1 | SOT-28 | GOVERNED |
| BR-12 | BR-12.2 | AUD-12.2 | SOT-28 | GOVERNED |
| BR-12 | BR-12.3 | AUD-12.3 | SOT-28 | GOVERNED |
| BR-12 | BR-12.4 | AUD-12.4 | SOT-27 | GOVERNED |
| BR-12 | BR-12.5 | AUD-12.5 | SOT-28 | GOVERNED |

### 33.13 BR-13 — Security & Permission

| BR | Req ID | Audit | SoT | Trạng thái |
|----|--------|-------|-----|------------|
| BR-13 | BR-13.1 | AUD-13.1 | SOT-18 · SOT-19 | GOVERNED |
| BR-13 | BR-13.2 | AUD-13.2 | SOT-19 | GOVERNED |
| BR-13 | BR-13.3 | AUD-13.3 | SOT-11 · SOT-19 | GOVERNED |
| BR-13 | BR-13.4 | AUD-13.4 | SOT-11 · SOT-19 | GOVERNED |
| BR-13 | BR-13.5 | AUD-13.5 | SOT-20 | GOVERNED |
| BR-13 | BR-13.6 | AUD-13.6 | SOT-19 | GOVERNED |

### 33.14 Boundary / constraint rows (không thay BR Checklist)

| Item | Audit | SoT | Trạng thái |
|------|-------|-----|------------|
| OG vs Social physical strategy | AUD-01.7–01.8 · AUD-04.5–04.6 | SOT-13 | CONSTRAINT · OPEN-SOL |
| Category SEO | V9 · AUD-03 adjacent | SOT-16 | BOUNDARY |
| Content Engine `content_articles` | AUD-04.1 | SOT-17 | BOUNDARY |
| Exact schema / API / Admin route | — | §37–§38 | OPEN-SOL |

---

# 34. Audit Finding → SoT Traceability

| Audit Finding | Finding meaning                             | Governing response     |
| ------------- | ------------------------------------------- | ---------------------- |
| **V1**        | No Global → Page → Article foundation       | SOT-01, SOT-05, SOT-07 |
| **V2**        | Global Admin too narrow; runtime ignores DB | SOT-02, SOT-08, SOT-14 |
| **V3**        | Brand asset localStorage orphan             | SOT-10, SOT-14, SOT-26 |
| **V4**        | Page Settings ≠ Page SEO                    | SOT-03, SOT-15         |
| **V5**        | Article path strongest but no inheritance   | SOT-04, SOT-05, SOT-13 |
| **V6**        | Media Library article-only                  | SOT-10, SOT-12         |
| **V7**        | Dual site-name authority                    | SOT-02, SOT-08, SOT-14 |
| **V8**        | Hub HTML weak; favicon 404                  | SOT-08, SOT-09, SOT-14 |
| **V9**        | Category SEO not consumed                   | SOT-16                 |
| **V10**       | SEO epic depends on Foundation              | SOT-27, SOT-28         |

---

# 35. Evidence Pack → SoT Traceability

| Evidence Pack | Governs                                        |
| ------------- | ---------------------------------------------- |
| **AUD-OWN**   | SOT-01, SOT-02, SOT-03, SOT-07, SOT-08, SOT-14 |
| **AUD-ASSET** | SOT-10, SOT-11, SOT-12, SOT-14                 |
| **AUD-REN**   | SOT-07, SOT-08, SOT-09                         |
| **AUD-ADM**   | SOT-02, SOT-03, SOT-04, SOT-18, SOT-19         |

---

# 36. Solution Constraints

Solution Design **MUST** satisfy all of the following.

### SC-01

One authoritative configuration model for:

```text
GLOBAL / PAGE / ARTICLE
```

### SC-02

One effective precedence model:

```text
ARTICLE > PAGE > GLOBAL > FALLBACK
```

### SC-03

No browser localStorage as persistent authority.

### SC-04

No hard-coded brand identity as primary authority.

### SC-05

Existing Community Media pipeline must be considered before creating another asset system.

### SC-06

Existing Community Article SEO pipeline must be reused before rebuilding.

### SC-07

Page Settings must not silently become SEO authority without explicit ownership justification.

### SC-08

Public runtime must consume effective public configuration.

### SC-09

Crawler-critical metadata must be available in public/server HTML where required.

### SC-10

Admin write authority and public read authority must remain separate.

### SC-11

Existing pages/articles must remain compatible during migration.

### SC-12

SEO epic must consume Foundation rather than recreate Foundation infrastructure.

---

# 37. Solution Freedom Boundary

Solution **MAY** decide:

* exact DB schema;
* whether `marketing_brand_identity` is extended or migrated;
* exact configuration tables/entities;
* API design;
* resolver implementation;
* server rendering implementation;
* caching;
* invalidation;
* Admin component architecture;
* asset usage schema;
* migration sequencing;
* backward compatibility mechanism.

Solution **MUST NOT** decide against the following SoT:

```text
Single authority
Global → Page → Article
Article > Page > Global > fallback
No localStorage authority
No hard-coded primary authority
Asset authority reusable
Article pipeline reusable
Public-safe effective config
SEO downstream dependency
```

---

# 38. Unresolved Items

Các item dưới đây **không còn là blocker về conceptual authority**, nhưng Solution phải xử lý bằng thiết kế cụ thể:

| Item                                | Status   | Owner                                    |
| ----------------------------------- | -------- | ---------------------------------------- |
| Exact persistence schema            | OPEN     | Solution                                 |
| Exact API contract                  | OPEN     | Solution                                 |
| Exact Admin IA                      | **LOCKED by Solution OD-SOL-03** (Thiết lập SEO) · route/file OPEN Plan |
| Exact asset usage schema            | OPEN     | Solution                                 |
| OG/social physical storage strategy | OPEN     | Solution                                 |
| Migration mechanics from manifests  | OPEN     | Solution                                 |
| Content Engine integration          | BOUNDARY | Solution + Owner if scope changes        |
| Category SEO integration            | BOUNDARY | Separate/Owner decision if scope changes |

Không được dùng các item này để tự ý thay đổi BRD.

---

# 39. Solution Readiness Gate

## 39.1 Requirement coverage

| Gate           | Status |
| -------------- | ------ |
| BR-01 governed | ✅      |
| BR-02 governed | ✅      |
| BR-03 governed | ✅      |
| BR-04 governed | ✅      |
| BR-05 governed | ✅      |
| BR-06 governed | ✅      |
| BR-07 governed | ✅      |
| BR-08 governed | ✅      |
| BR-09 governed | ✅      |
| BR-10 governed | ✅      |
| BR-11 governed | ✅      |
| BR-12 governed | ✅      |
| BR-13 governed | ✅      |

---

## 39.2 Audit coverage

| Gate                    | Status |
| ----------------------- | ------ |
| V1 addressed            | ✅      |
| V2 addressed            | ✅      |
| V3 addressed            | ✅      |
| V4 addressed            | ✅      |
| V5 addressed            | ✅      |
| V6 addressed            | ✅      |
| V7 addressed            | ✅      |
| V8 addressed            | ✅      |
| V9 bounded              | ✅      |
| V10 dependency governed | ✅      |

---

## 39.3 Authority readiness

```text
Global Authority
      ✅ Governed

Page Authority
      ✅ Governed

Article Authority
      ✅ Governed

Asset Authority
      ✅ Governed

Inheritance
      ✅ Governed

Runtime Authority
      ✅ Governed

Public Read Boundary
      ✅ Governed

Admin / RBAC Boundary
      ✅ Governed
```

---

## 39.4 Implementation readiness

**Solution gate OPEN for Owner REVIEW.** Implementation vẫn **NOT READY** đến khi Solution LOCK + Plan.

```text
BRD OWNER LOCKED
   ↓
Audit APPROVED
   ↓
SoT OWNER APPROVED / LOCKED  ← DONE
   ↓
Solution OWNER REVIEW / LOCK
   ↓
Plan → Implementation
```

---

# 40. Final Governing Model

Foundation được govern theo mô hình:

```text
                         ┌─────────────────────┐
                         │   GLOBAL AUTHORITY  │
                         │                     │
                         │ Site Identity       │
                         │ Default Metadata    │
                         │ Brand Assets        │
                         └──────────┬──────────┘
                                    │
                                    │ inherit
                                    ▼
                         ┌─────────────────────┐
                         │    PAGE AUTHORITY   │
                         │                     │
                         │ Page Metadata       │
                         │ Page Assets         │
                         │ Optional Overrides  │
                         └──────────┬──────────┘
                                    │
                                    │ inherit
                                    ▼
                         ┌─────────────────────┐
                         │  ARTICLE AUTHORITY  │
                         │                     │
                         │ Article Metadata    │
                         │ Article Assets      │
                         │ Optional Overrides  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ EFFECTIVE RESOLVER  │
                         │                     │
                         │ Article             │
                         │   > Page            │
                         │   > Global          │
                         │   > Fallback         │
                         └──────────┬──────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 ▼                  ▼                  ▼
          Public HTML         Runtime UI       Asset Resolution
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    ▼
                              PUBLIC OUTPUT
```

Asset pipeline:

```text
Admin Upload
     ↓
Validation
     ↓
Persistent Asset Authority
     ↓
Reference / Usage
     ↓
Global / Page / Article
     ↓
Effective Resolver
     ↓
Runtime
```

Governance pipeline:

```text
BRD §16
   ↓
AUD-01.x ... AUD-13.x
   ↓
SOT-01 ... SOT-28
   ↓
Solution
   ↓
Plan
   ↓
Implementation
```

---

# 41. Final SoT Verdict

### Foundation authority

**GOVERNED**

### Scope model

**GOVERNED**

```text
GLOBAL → PAGE → ARTICLE
```

### Precedence

**GOVERNED**

```text
ARTICLE > PAGE > GLOBAL > FALLBACK
```

### Asset authority

**GOVERNED**

Existing Media Library is the primary reuse candidate.

### Article pipeline

**GOVERNED FOR REUSE**

Existing Article SEO pipeline is not to be rebuilt from zero.

### Page Settings

**GOVERNED AS PLACEMENT / GIAO DIỆN DOMAIN**

Không phải SEO authority. Page SEO Admin = **Thiết lập SEO từng trang** (Solution OD-SOL-03).

### Global SEO Admin

**GOVERNED**

Không đặt trong Nhận diện thương hiệu. Global SEO Admin = **Thiết lập SEO hệ thống**.

### localStorage brand path

**GOVERNED FOR REMOVAL**

Không được tồn tại như authority.

### Hard-coded brand identity

**GOVERNED FOR MIGRATION**

Không được là primary authority.

### Category SEO

**BOUNDED AS ADJACENT**

Không tự động nhập Foundation.

### Content Engine

**BOUNDED**

Chưa tự động hợp nhất ownership.

### SEO epic

**DOWNSTREAM**

Foundation cung cấp capability; SEO không được recreate infrastructure.

---

# 42. Governance Status

| Gate                             | Status                   |
| -------------------------------- | ------------------------ |
| BRD reference                    | ✅ `01 - Business Requirement.md` · **🔒 OWNER LOCKED** |
| Mandatory Audit reference        | ✅ `02 - Mandatory-Audit.md` · **OWNER APPROVED** |
| Atomic BR traceability           | ✅                        |
| SoT Checklist §2.4 (bảng atomic) | ✅ §33                    |
| Atomic Audit traceability        | ✅                        |
| Audit Finding traceability       | ✅                        |
| Evidence Pack traceability       | ✅                        |
| Authority decisions              | ✅                        |
| Precedence                       | ✅                        |
| Reuse / Modify / Delete / Create | ✅                        |
| Solution constraints             | ✅                        |
| Non-goals / boundaries           | ✅                        |
| Solution readiness definition    | ✅                        |
| Owner Approval (SoT)             | ✅ **APPROVED / LOCKED** 2026-08-09 |
| Solution authorization           | ⏳ **REVIEW / LOCK** (Plan chưa mở) |
| Implementation authorization     | ❌ **NOT AUTHORIZED**     |

---

# END OF GOVERNING SOT

# Rev B.1 — OWNER APPROVED / LOCKED · SoT Checklist §2.4 table
