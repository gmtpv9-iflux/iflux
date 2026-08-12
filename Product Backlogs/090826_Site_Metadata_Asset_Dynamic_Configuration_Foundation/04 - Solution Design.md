# 04 — Solution Design

# Site Metadata, Asset & Dynamic Configuration Foundation

|                     |                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Task ID**         | `090826_Site_Metadata_Asset_Dynamic_Configuration_Foundation`                                                              |
| **BRD**             | [`01 - Business Requirement.md`](01%20-%20Business%20Requirement.md) · **§16 · 🔒 OWNER LOCKED**                           |
| **Audit**           | [`02 - Mandatory-Audit.md`](02%20-%20Mandatory-Audit.md) · **Rev A · ✅ OWNER APPROVED**                                    |
| **SoT**             | [`03 - Governing SoT.md`](03%20-%20Governing%20SoT.md) · **Rev B.1 · 🔒 OWNER APPROVED / LOCKED**                           |
| **Document**        | **Solution Design — Site Metadata, Asset & Dynamic Configuration Foundation**                                              |
| **Date**            | 2026-08-09                                                                                                                 |
| **Rev**             | **A.2** — Owner LOCK Admin IA: **Thiết lập SEO** → hệ thống + từng trang (không Brand / không Page Settings) |
| **Governance**      | Product Backlogs Governance §2 — Business Requirement → Mandatory Audit → Governing SoT → Solution → Plan → Implementation |
| **Solution status** | 🔒 **OWNER LOCKED** (2026-08-09) · Plan AUTHORIZED to open · Impl vẫn theo Plan gate |
| **Implementation**  | ❌ **NOT AUTHORIZED**                                                                                                       |
| **Plan**            | ✅ **AUTHORIZED TO OPEN** — tuân OD-SOL-03 IA · Impl theo Plan gate |
| **Related**         | `040826_Website_SEO_Metadata_Management` — **downstream consumer**                                                         |

> **Purpose:** Chuyển các governing decisions trong SoT thành một **solution model có thể triển khai**, nhưng không đi xuống physical implementation. Solution này phải giải quyết BRD, sử dụng evidence/context từ Audit và không được vượt authority của SoT.

---

# 0. Governance Gate

## 0.1 Solution role

Tài liệu này là **Solution Design** cho:

> **Site Metadata, Asset & Dynamic Configuration Foundation**

Solution trả lời:

> **“Với authority/rule đã bị SoT khóa, hệ thống sẽ được tổ chức thành những capability và flow nào để giải quyết BR?”**

Solution **không phải**:

* Business Requirement;
* Mandatory Audit;
* Governing SoT;
* Implementation Plan;
* migration SQL;
* API specification;
* UI specification;
* deployment procedure.

---

## 0.2 Vết dầu loang — Solution derivation

```text
01 — Business Requirement
        │
        │  BR-01 ... BR-13
        ▼
02 — Mandatory Audit
        │
        │  AUD-01.x ... AUD-13.x
        │  V1 ... V10
        │  Evidence Packs
        ▼
03 — Governing SoT
        │
        │  SOT-01 ... SOT-28
        │  Authority / Boundary / Constraint
        ▼
04 — Solution Design ← THIS DOCUMENT
        │
        │  SOL-01 ... SOL-xx
        ▼
05 — Plan
        │
        ▼
06 — Implementation
        │
        ▼
Evidence / Verification
        │
        ▼
Final Acceptance
```

### Nguyên tắc vết dầu loang

Mỗi Solution Decision phải trả lời được:

```text
SOL
 ↓
SOT
 ↓
BR
 ↓
AUDIT
 ↓
Evidence / Finding
```

Không có:

```text
“Solution thấy nên làm vậy”
```

nếu không có governing source từ SoT.

---

# 1. Source of Truth Chain

## 1.1 Primary sources

| Layer      | Source                          | Authority             |
| ---------- | ------------------------------- | --------------------- |
| Business   | `01 - Business Requirement.md`  | 🔒 Owner Locked       |
| Discovery  | `02 - Mandatory-Audit.md` Rev A | ✅ Owner Approved     |
| Governance | `03 - Governing SoT.md` Rev B.1 | 🔒 Owner Approved     |
| Solution   | **This document**               | 🟡 Owner Review       |

---

## 1.2 Governing SoT

Solution này bị chi phối trực tiếp bởi:

* SOT-01 — Three-scope configuration model
* SOT-02 — Global Authority
* SOT-03 — Page Configuration Authority
* SOT-04 — Article Configuration Authority
* SOT-05 — Global → Page → Article Precedence
* SOT-06 — Empty / Null Override Semantics
* SOT-07 — Effective Configuration Resolver
* SOT-08 — Runtime Authority
* SOT-09 — Public HTML / Crawler Authority
* SOT-10 — Asset Authority
* SOT-11 — Asset Validation
* SOT-12 — Asset Usage / Reuse Model
* SOT-13 — OG Image vs Social/Share Image
* SOT-14 — Site Identity Authority
* SOT-15 — Page Settings Boundary
* SOT-16 — Category SEO Boundary
* SOT-17 — Content Engine Boundary
* SOT-18 — Admin Authority
* SOT-19 — RBAC Boundary
* SOT-20 — Public Read Boundary
* SOT-21 — Validation & Integrity Authority
* SOT-22 — Fallback Policy
* SOT-23 — Existing Page Compatibility
* SOT-24 — Legacy Authority Migration
* SOT-25 — Single Authority Matrix
* SOT-26 — Reuse / Modify / Delete / Create Registry
* SOT-27 — Explicit Non-Goals
* SOT-28 — SEO Dependency

---

# 2. Problem Being Solved

## SOL-PROB-01 — Configuration authority is fragmented

Audit đã xác nhận hiện trạng:

```text
Global
 ├── DB brand identity
 ├── hard-coded brand
 ├── localStorage brand identity
 └── runtime fallback

Page
 ├── static HTML
 ├── manifests
 ├── page-definition
 └── Page Settings

Article
 └── community_posts.payload
```

Các nguồn này không tạo thành một authority model thống nhất.

### Solution response

Tạo một **logical Foundation Configuration Model** gồm:

```text
GLOBAL
   ↓
PAGE
   ↓
ARTICLE
```

và một **Effective Configuration Resolver** đứng giữa configuration authority và runtime.

**Trace:**

`SOL-PROB-01 → SOT-01, SOT-02, SOT-03, SOT-04, SOT-07 → BR-01, BR-03, BR-04, BR-06, BR-07, BR-08 → V1/V2/V4/V5/V7`

---

# 3. Target Solution Architecture

## SOL-01 — Foundation capability model

Solution tổ chức Foundation thành 5 capability chính:

```text
┌──────────────────────────────────────────────────┐
│             CONFIGURATION AUTHORITY             │
│                                                  │
│   GLOBAL        PAGE          ARTICLE            │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│            EFFECTIVE CONFIGURATION               │
│                  RESOLVER                         │
│                                                  │
│       ARTICLE > PAGE > GLOBAL > FALLBACK         │
└───────────────┬──────────────────┬───────────────┘
                │                  │
                ▼                  ▼
       Public Metadata       Runtime Consumer
                │
                ▼
        Public HTML / UI
```

Song song:

```text
                ┌─────────────────┐
                │ Asset Authority │
                └────────┬────────┘
                         │
                         ▼
                 Asset References
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
           GLOBAL       PAGE      ARTICLE
```

Admin side:

```text
Admin UI
   ↓
Authenticated / Authorized Admin Surface
   ↓
Configuration Authority
```

Public side:

```text
Configuration Authority
        ↓
Effective Resolver
        ↓
Public-safe Effective Configuration
        ↓
Public Runtime / HTML
```

---

# 4. SOL-02 — Configuration Scope Solution

## 4.1 Global

Global configuration cung cấp:

* Site Name
* Site Description
* Logo
* Favicon
* Default SEO Title
* Default Meta Description
* Default OG Image
* Default Social/Share Image

Global là **default authority**.

---

## 4.2 Page

Page configuration cung cấp các override ở page scope:

* Page Title
* Page Description
* Page OG Image
* Page Social/Share Image
* các metadata/configuration fields được BRD yêu cầu.

Page không duplicate toàn bộ Global configuration.

---

## 4.3 Article

Article configuration tiếp tục reuse capability trưởng thành hiện tại:

* Article SEO title;
* Article description;
* canonical;
* Article OG;
* Article social/share configuration;
* article asset references.

Article chỉ cung cấp local values khi cần override.

---

## 4.4 Effective value

Một field được resolve theo:

```text
ARTICLE
   ↓ if configured
PAGE
   ↓ if configured
GLOBAL
   ↓ if configured
SYSTEM FALLBACK
```

Ví dụ:

```text
Global title  = "iFlux"
Page title    = null
Article title = null

Effective = "iFlux"
```

Nếu:

```text
Global title  = "iFlux"
Page title    = "Cộng đồng · iFlux"
Article title = null

Effective = "Cộng đồng · iFlux"
```

Nếu:

```text
Article title = "Bài viết A"

Effective = "Bài viết A"
```

**Trace:**

`SOL-02 → SOT-01, SOT-05, SOT-06, SOT-07 → BR-01, BR-03, BR-04, BR-07, BR-08`

---

# 5. SOL-03 — Global Authority Solution

Existing persistence candidate:

```text
marketing_brand_identity
```

được đưa vào solution theo chiến lược **data authority**:

```text
REUSE / EXTEND / NORMALIZE
  ↓
BECOME (or feed) GLOBAL CONFIGURATION AUTHORITY
```

Không tạo Global **data** authority song song nếu chưa chứng minh cannot-extend.

### Owner LOCK — Global Admin surface (2026-08-09 · Rev A.2)

**Admin UI cho Global SEO/config KHÔNG đặt trong Nhận diện thương hiệu.**

```text
Nhận diện thương hiệu
  = marketing brand surface riêng (giữ)
  ≠ Global SEO / default metadata Admin surface

Thiết lập SEO
  └── Thiết lập SEO hệ thống   ← Global Admin surface (BR-01 / BR-05.1)
```

**Thiết lập SEO hệ thống** quản lý (tối thiểu theo BR):

* Site Name / Site Description (global identity for public metadata);
* Favicon / Site Logo (public assets);
* Default SEO Title / Meta Description;
* Default OG Image / Social·Share Image;
* upload/replace asset qua Asset Authority (Media Library);
* lưu persistent + runtime consume.

Exact route/slug/perm thuộc Plan; **label + parent IA** đã khóa.

### Existing conflicts

| Existing source             | Solution treatment                         |
| --------------------------- | ------------------------------------------ |
| `marketing_brand_identity`  | Reuse/Extend **persistence** nếu phù hợp; **không** đồng nghĩa Admin = Brand page |
| Brand Admin live UI         | Giữ Nhận diện thương hiệu; **không** nhồi Global SEO vào đây |
| hard-coded `iFlux`          | migrate to fallback/configuration          |
| hard-coded SVG logo         | migrate to Asset Authority                 |
| localStorage brand identity | remove as authority                        |
| `/favicon.ico` 404          | resolve through governed asset/public path |

### Solution principle

Sau migration:

```text
Global Config Authority
        │
        ├── Site Identity
        ├── Default Metadata
        └── Asset References
```

phải là **một logical authority**, dù physical persistence có thể extend existing structures.

Admin write path:

```text
Thiết lập SEO hệ thống → Authorized Admin API → Global Authority
```

**Trace:**

`SOL-03 → SOT-02, SOT-14, SOT-18, SOT-24, SOT-25, SOT-26 → BR-01, BR-05.1, BR-06, BR-08, BR-11 → V2/V3/V7/V8`

**Decision status: OWNER LOCKED (Admin IA · Thiết lập SEO hệ thống)**

---

# 6. SOL-04 — Page Authority Solution

Page metadata được tách khỏi semantic domain của Page Settings.

### Current

```text
Page Settings / Cài đặt Trang
    ↓
Giao diện · widget placement / publishing
```

### Target

```text
Page Configuration Authority
    ↓
Page metadata/configuration
```

### Owner LOCK — Page Admin IA (2026-08-09 · **supersedes** A.1 reuse-first vào Page Settings)

**Cài đặt Trang = domain Giao diện** → **không** đặt Page SEO/metadata vào đó.

```text
Thiết lập SEO
  └── Thiết lập SEO từng trang   ← Page Admin surface (BR-03 / BR-05.2)
```

**Thiết lập SEO từng trang** cho phép Admin:

* chọn / nhận diện từng public page;
* thiết lập page title / description / OG / social;
* thấy field state INHERITED / OVERRIDDEN / UNSET / INVALID (SOL-12);
* lưu persistent; runtime resolve theo precedence.

### Hard rules

```text
Cài đặt Trang (placement)
        ≠
Thiết lập SEO từng trang (metadata)

Page Settings KHÔNG trở thành SEO authority
```

Page Settings **tiếp tục** chỉ:

> **widget placement / page publishing / giao diện**

Có thể **reuse** page catalog/keys/identity data từ hệ thống page hiện có (không reuse nhầm thành nhét SEO form vào Page Settings UI).

### Legacy migration

Các nguồn:

```text
static HTML <title>
pages/*.manifest.js
page-definition.js
```

được xử lý theo:

```text
existing value
      ↓
migration / compatibility extraction
      ↓
Page Authority
```

Trong thời gian chuyển đổi, legacy value có thể tồn tại dưới dạng compatibility fallback nhưng không được tiếp tục là primary authority.

**Trace:**

`SOL-04 → SOT-03, SOT-15, SOT-18, SOT-23, SOT-24 → BR-03, BR-05.2, BR-06, BR-07, BR-08, BR-11 → V4`

**Decision status: OWNER LOCKED (Admin IA · Thiết lập SEO từng trang)**

---

# 7. SOL-05 — Article Reuse Solution

Article là capability được ưu tiên **reuse before create**.

Existing pipeline:

```text
Community Admin
      ↓
community_posts.payload
      ↓
resolveArticleMetadata
      ↓
Pipeline A / Pipeline B
      ↓
Public Article
```

được giữ làm nền.

Solution chỉ bổ sung:

```text
Article Local Configuration
          ↓
Shared Effective Resolver
          ↓
Foundation Public Output
```

### Không làm

```text
New Article SEO system
        +
Old Article SEO system
```

### Làm

```text
Existing Article capability
          ↓
Integrate with Foundation
          ↓
Shared precedence
```

**Trace:**

`SOL-05 → SOT-04, SOT-05, SOT-07, SOT-09, SOT-13, SOT-17, SOT-26 → BR-04, BR-07, BR-08, BR-09, BR-11 → V5`

---

# 8. SOL-06 — Effective Configuration Resolver

Resolver là capability trung tâm của Solution.

## Conceptual input

```text
Global Configuration
Page Configuration
Article Configuration
```

## Conceptual output

```text
Effective Public Configuration
```

## Resolution

```text
for each field:

    Article override
        OR
    Page override
        OR
    Global value
        OR
    System fallback
```

Resolver phải xử lý field-level inheritance.

Không merge theo kiểu:

```text
child object replaces parent object entirely
```

nếu child chỉ override một field.

### Example

```text
GLOBAL
title       = "iFlux"
description = "Money Flow Intelligence"

PAGE
title       = "Cộng đồng"
description = null

ARTICLE
title       = null
description = "Bài viết về thị trường"
```

Effective:

```text
title       = "Cộng đồng"
description = "Bài viết về thị trường"
```

### Important

Resolver là **semantic capability**.

Solution không khóa:

* function name;
* module name;
* API path;
* implementation language;
* caching mechanism.

**Trace:**

`SOL-06 → SOT-05, SOT-06, SOT-07, SOT-22 → BR-06, BR-07, BR-08, BR-10`

---

# 9. SOL-07 — Asset Foundation Solution

Existing Media Library được sử dụng làm nền:

```text
Media Library
      ↓
Asset Authority
```

thay vì tạo thêm một Brand Asset System hoặc Page Asset System riêng.

### Target capability

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
Resolve
```

Một binary asset có thể được reference bởi:

```text
GLOBAL
PAGE
ARTICLE
```

mà không cần duplicate binary.

---

## 9.1 Existing asset reuse

| Existing                 | Solution |
| ------------------------ | -------- |
| `media_assets`           | Reuse    |
| upload pipeline          | Reuse    |
| MIME validation          | Reuse    |
| size validation          | Reuse    |
| variants                 | Reuse    |
| public URL               | Reuse    |
| `media_usages`           | Extend   |
| article media            | Preserve |
| localStorage brand asset | Remove   |

**Trace:**

`SOL-07 → SOT-10, SOT-11, SOT-12, SOT-14, SOT-26 → BR-02, BR-06, BR-08, BR-10, BR-13 → V3/V6`

---

# 10. SOL-08 — Asset Reference Model

Solution phân biệt:

```text
Asset Binary
```

và:

```text
Configuration Reference
```

Ví dụ:

```text
Asset A
  ↓
Global.logo

Asset A
  ↓
Page.home.og_image

Asset A
  ↓
Article.123.social_image
```

không tạo ba binary.

### Conceptual relationship

```text
                 ┌──────────────┐
                 │     Asset    │
                 └──────┬───────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
       GLOBAL         PAGE         ARTICLE
       reference     reference     reference
```

Usage tracking được mở rộng từ article-only sang configuration scopes.

Physical usage schema thuộc Plan/Implementation.

---

# 11. SOL-09 — OG / Social Image Solution

BRD phân biệt:

```text
OG Image
Social / Share Image
```

Solution **không làm mất semantic distinction**.

### Owner LOCK — Solution preference (2026-08-09)

**Default model:**

```text
Semantic fields:  độc lập
  · og_image_ref
  · social_image_ref

Physical/default behavior:
  · một asset reference CÓ THỂ được dùng chung mặc định
    cho cả OG và Social/Share
  · Admin/runtime có thể override riêng từng field sau này
```

### Rules

1. Model configuration **giữ hai semantic fields** (không gộp thành một field duy nhất trong governing model).
2. Default / empty override trên Social có thể **inherit shared effective asset** từ OG (hoặc ngược lại theo Plan — miễn nhất quán), để tránh duplicate asset không cần thiết.
3. Khi một scope set override riêng cho Social (hoặc OG), effective value của field đó tách khỏi shared default.
4. Không được diễn giải “cùng một binary asset” thành “BRD chỉ còn một semantic field”.

```text
DEFAULT (shared)
OG Image ────────┐
                 ├── same asset reference (optional default)
Social Image ────┘

OVERRIDE (independent)
OG Image     = asset A
Social Image = asset B   ← allowed later without schema rewrite
```

Physical storage / column strategy thuộc Plan/Implementation, **phải tuân** preference trên + SOT-13.

**Trace:**

`SOL-09 → SOT-13 → BR-01.7–01.8, BR-03.5–03.6, BR-04.5–04.6 → AUD-01.7–01.8, AUD-03.5–03.6, AUD-04.5–04.6`

**Decision status: OWNER LOCKED (shared-default · independent semantics)**

---

# 12. SOL-10 — Public Runtime Solution

Runtime không đọc raw Admin configuration.

Target flow:

```text
Admin
  ↓
Persistent Authority
  ↓
Effective Resolver
  ↓
Public-safe Effective Configuration
  ↓
Public Runtime
```

Public consumer chỉ nhận configuration cần thiết cho public output.

Không expose:

* Admin-only fields;
* permission data;
* internal audit metadata;
* unpublished values;
* storage internals.

---

# 13. SOL-11 — Public HTML / Crawler Solution

Audit đã xác nhận Article có Pipeline A/B nhưng Hub/Page public HTML còn yếu.

Solution giữ nguyên nguyên tắc:

```text
Effective Configuration
        ↓
Public HTML generation
        ↓
Crawler-readable metadata
```

### Article

Reuse:

```text
Pipeline A
Pipeline B
```

### Page / Hub

Bổ sung effective metadata vào public/server rendering path thay vì chỉ:

```text
static <title>
```

Client-side metadata application vẫn có thể tồn tại:

```text
Public HTML
     +
Client runtime update
```

nhưng client JS **không phải sole authority** cho crawler-critical metadata.

**Trace:**

`SOL-11 → SOT-08, SOT-09, SOT-20 → BR-08, BR-09 → V7/V8`

---

# 14. SOL-12 — Admin Configuration Flow

Solution chuẩn hóa Admin flow:

```text
Admin User
    ↓
Authentication
    ↓
RBAC / Permission
    ↓
Configuration Surface
    ↓
Validation
    ↓
Persistent Authority
    ↓
Effective Runtime
```

### Scope surfaces

```text
Thiết lập SEO
  ├── Thiết lập SEO hệ thống      ← Global (SOL-03)
  └── Thiết lập SEO từng trang    ← Page (SOL-04)

Article SEO surface               ← Community article edit (SOL-05)
Nhận diện thương hiệu             ← riêng; không chứa Global SEO
Cài đặt Trang                     ← giao diện/placement; không chứa Page SEO
```

Exact slug/file thuộc Plan; **labels + parent/child** đã Owner LOCK (BRD §8 amendment · OD-SOL-03).

Solution không nhét Global/Page SEO vào Brand hoặc Page Settings dù “tiện mở rộng”.

### Owner LOCK — Field state indicator (2026-08-09)

SoT (SOT-06) đã khóa semantic states:

```text
INHERITED
OVERRIDDEN
INVALID
UNSET
```

**Solution requirement (BR-07.8 · BR-05.4 · BR-05.8):**

Admin configuration surfaces (Page / Article, và Global khi có fallback) **MUST** biểu diễn được trạng thái field-level theo semantic trên, để Admin nhận biết giá trị đang:

* dùng giá trị kế thừa (INHERITED);
* dùng override riêng (OVERRIDDEN);
* chưa set / không có override (UNSET);
* không hợp lệ theo validation (INVALID).

### In scope (Solution)

* Capability: hiển thị / phản ánh **field state** khớp resolver semantics.
* Consistency: cùng vocabulary trên mọi scope Admin liên quan.
* Binding: state lấy từ authority + resolver — không hard-code UI guess.

### Out of scope (Solution — Plan/UI)

* Pixel layout;
* badge/chip/color cụ thể;
* exact component class;
* copy microcopy cuối cùng (ngoài việc semantic phải đúng tiếng Việt khi implement).

```text
Admin MUST show field state
        ≠
Solution locks badge design
```

**Trace:**

`SOL-12 → SOT-06, SOT-07, SOT-18 → BR-05.4, BR-05.8, BR-07.8, BR-10.8 → AUD-05, AUD-07.8`

**Decision status: OWNER LOCKED (capability · not pixels)**

---

# 15. SOL-13 — RBAC Solution

Existing permission domains được reuse.

Conceptual separation:

```text
Admin Write
    ↓
Permission-controlled

Public Read
    ↓
Public-safe projection
```

Không dùng:

```text
Admin API
   ↓
Public Browser
```

làm public read mechanism nếu API đó expose internal Admin authority.

### Principle

```text
WRITE MODEL
     ≠
PUBLIC READ MODEL
```

nhưng cả hai đều bắt nguồn từ cùng authoritative configuration.

**Trace:**

`SOL-13 → SOT-18, SOT-19, SOT-20 → BR-05, BR-13 → AUD-05, AUD-13`

---

# 16. SOL-14 — Validation Solution

Validation được tổ chức theo một logical pipeline:

```text
Input
 ↓
Field Validation
 ↓
Asset Validation
 ↓
Configuration Validation
 ↓
Persistence
 ↓
Effective Resolution
 ↓
Public Output Validation
```

### Asset validation

Reuse existing:

* MIME validation;
* size validation;
* image integrity validation.

### Configuration validation

Phải phân biệt:

```text
valid override
invalid override
unset / inherit
```

Không biến:

```text
null
empty string
invalid value
```

thành cùng một semantic.

**Trace:**

`SOL-14 → SOT-06, SOT-11, SOT-21, SOT-22 → BR-02, BR-07, BR-10, BR-13`

---

# 17. SOL-15 — Legacy Migration Strategy

Migration được thực hiện theo nguyên tắc:

> **Establish new authority before removing old authority.**

## Phase concept

```text
CURRENT
  ↓
Inventory
  ↓
Map
  ↓
Introduce governed authority
  ↓
Migrate existing values
  ↓
Switch runtime consumption
  ↓
Verify compatibility
  ↓
Remove legacy authority
```

### Legacy classes

| Legacy                        | Solution                   |
| ----------------------------- | -------------------------- |
| Static page title             | migrate                    |
| Manifest metadata             | migrate                    |
| `page-definition.js` metadata | migrate                    |
| Hard-coded `iFlux`            | fallback during transition |
| Hard-coded SVG logo           | migrate                    |
| localStorage brand identity   | remove                     |
| Existing article resolver     | integrate                  |
| Existing article pipeline     | preserve                   |

### Critical migration rule

Không được:

```text
DELETE FIRST
```

mà phải:

```text
NEW AUTHORITY
      ↓
MIGRATE
      ↓
SWITCH
      ↓
VERIFY
      ↓
REMOVE LEGACY
```

**Trace:**

`SOL-15 → SOT-23, SOT-24, SOT-26 → BR-06, BR-08, BR-11 → AUD-11 + V3/V4/V7`

---

# 18. SOL-16 — Backward Compatibility Solution

Existing pages/articles phải tiếp tục render trong quá trình chuyển đổi.

Compatibility strategy:

```text
Existing source
      ↓
Mapped to new authority
      ↓
Effective Resolver
      ↓
same / compatible public output
```

Trong migration window:

```text
legacy value
```

có thể được sử dụng như compatibility fallback nhưng:

> không được ghi ngược trở lại thành competing authority.

### Compatibility requirements

Không được làm hỏng:

* existing public routes;
* article rendering;
* article SEO;
* existing Admin editing;
* existing media;
* existing page rendering.

---

# 19. SOL-17 — Content Engine Boundary

`content_articles` không được tự động hợp nhất với:

```text
community_posts
```

Solution hiện tại:

```text
Community Article
       ↓
Foundation Article Authority integration
```

Trong khi:

```text
Content Engine
       ↓
Boundary
```

được giữ nguyên cho đến khi ownership/lifecycle/public identity được chứng minh.

Không tạo migration hợp nhất chỉ vì hai domain cùng có SEO fields.

**Trace:**

`SOL-17 → SOT-17 → BR-04 → AUD-04.1`

---

# 20. SOL-18 — Category SEO Boundary

Category SEO tiếp tục là downstream/adjacent capability.

Solution không kéo:

```text
category.seo_*
```

vào Foundation chỉ vì cùng liên quan metadata.

Nếu tương lai cần hợp nhất:

```text
Category
 ↓
BR
 ↓
Audit
 ↓
SoT amendment
 ↓
Solution amendment
```

Không mở rộng scope ngầm trong implementation.

**Trace:**

`SOL-18 → SOT-16 → AUD V9 → BR boundary`

---

# 21. SOL-19 — SEO Downstream Contract

Foundation cung cấp:

```text
Configuration Authority
Asset Authority
Inheritance
Effective Resolver
Public Metadata Capability
```

SEO downstream consume các capability đó.

Target:

```text
090826 Foundation
        │
        ├── configuration
        ├── asset
        ├── resolver
        └── public metadata
                │
                ▼
040826 Website SEO Metadata Management
```

SEO solution **không được tạo lại**:

* Global configuration;
* Page configuration;
* Article configuration;
* Asset authority;
* inheritance resolver;
* runtime metadata authority.

**Trace:**

`SOL-19 → SOT-27, SOT-28 → BR-12 → V10`

---

# 22. SOL-20 — End-to-End Runtime Flow

## Global

```text
Admin
 ↓
Global Authority
 ↓
Asset Reference
 ↓
Effective Resolver
 ↓
Public-safe Config
 ↓
HTML / Runtime
```

## Page

```text
Admin
 ↓
Page Authority
 ↓
optional Page Override
 ↓
Global fallback
 ↓
Effective Resolver
 ↓
HTML / Runtime
```

## Article

```text
Community Article Admin
 ↓
community_posts.payload
 ↓
Article Authority
 ↓
Article override
 ↓
Page override
 ↓
Global fallback
 ↓
Effective Resolver
 ↓
Pipeline A / B + Runtime
```

## Asset

```text
Admin Upload
 ↓
Media Library
 ↓
Validation
 ↓
Asset Authority
 ↓
Usage Reference
 ↓
Global / Page / Article
 ↓
Effective Runtime
```

---

# 23. SOL-21 — Failure / Fallback Behavior

Solution phải bảo đảm fallback không tạo authority thứ hai.

### Normal

```text
Article
 ↓
Page
 ↓
Global
```

### Missing Article value

```text
Article = unset
      ↓
Page
```

### Missing Page value

```text
Page = unset
      ↓
Global
```

### Missing Global value

```text
Global = unset
      ↓
System fallback
```

### Invalid override

Invalid configuration không được trở thành effective value.

```text
Invalid child
     ↓
reject / ignore according to validation semantics
     ↓
parent effective value
```

Chi tiết error handling thuộc implementation/Plan, nhưng semantic invariant bị khóa bởi SOT-21/SOT-22.

---

# 24. SOL-22 — Single Authority Outcome

Sau khi hoàn tất Solution, logical authority matrix phải đạt:

| Domain              | Target solution authority           |
| ------------------- | ----------------------------------- |
| Site Name           | Global Authority                    |
| Site Description    | Global Authority                    |
| Logo                | Asset Authority + Global Reference  |
| Favicon             | Asset Authority + Global Reference  |
| Global SEO defaults | Global Authority                    |
| Page metadata       | Page Authority                      |
| Article metadata    | Article Authority                   |
| Effective metadata  | Effective Resolver                  |
| Asset binary        | Asset Authority                     |
| Asset usage         | Asset Usage model                   |
| Public metadata     | Public-safe Effective Configuration |
| Admin write         | Authorized Admin surface            |
| Public read         | Public projection/runtime path      |

Không còn:

```text
DB + HTML + manifest + localStorage + hard-code
```

là các authority song song.

---

# 25. SOL-23 — Reuse / Modify / Delete / Create Decision

| Capability                 | Solution decision            | Reason                                |
| -------------------------- | ---------------------------- | ------------------------------------- |
| `marketing_brand_identity` | **MODIFY / EXTEND**          | existing persistent authority         |
| Brand Admin                | **REUSE / EXTEND**           | existing IA + RBAC                    |
| Media Library              | **REUSE / EXTEND**           | strongest asset capability            |
| `media_assets`             | **REUSE**                    | persistent asset storage              |
| `media_usages`             | **EXTEND**                   | current article-only semantics        |
| Community Article SEO      | **REUSE / INTEGRATE**        | strongest existing metadata path      |
| `community_posts.payload`  | **REUSE**                    | existing Article persistence          |
| `resolveArticleMetadata`   | **REUSE / REFACTOR**         | existing effective Article capability |
| Pipeline A/B               | **REUSE / EXTEND**           | crawler-ready Article path            |
| `applyPostSeoToDocument`   | **REUSE**                    | runtime compatibility                 |
| Page Settings              | **KEEP / REUSE SELECTIVELY** | placement domain                      |
| Page manifests             | **MIGRATE**                  | legacy metadata authority             |
| Static page title          | **MIGRATE**                  | legacy authority                      |
| Hard-coded SVG logo        | **MIGRATE**                  | duplicate asset authority             |
| Hard-coded `iFlux`         | **MIGRATE**                  | duplicate identity authority          |
| localStorage brand store   | **DELETE**                   | invalid persistent authority          |
| Category SEO               | **BOUNDARY**                 | adjacent ownership                    |
| Content Engine             | **BOUNDARY**                 | ownership not unified                 |

---

# 26. SOL-24 — What Solution Does Not Decide

Solution deliberately leaves the following open for Plan / Implementation:

### Persistence

* exact table names;
* exact column names;
* exact migration SQL;
* exact relationship implementation.

### API

* exact routes;
* exact request schema;
* exact response schema;
* authentication transport.

### Frontend

* exact Admin route;
* exact page layout;
* exact form component;
* exact widget composition.

### Runtime

* exact resolver module;
* exact server rendering mechanism;
* exact caching;
* exact invalidation mechanism.

### Assets

* exact usage table schema;
* exact variant generation mechanism;
* exact storage path.

These are implementation choices **provided they remain inside SoT constraints**.

---

# 27. SOL-25 — Solution Constraints

Implementation must not violate:

| Constraint                                                | Source        |
| --------------------------------------------------------- | ------------- |
| GLOBAL → PAGE → ARTICLE                                   | SOT-01        |
| ARTICLE > PAGE > GLOBAL > FALLBACK                        | SOT-05        |
| Null/unset means inherit by default                       | SOT-06        |
| Admin MUST expose field states INHERITED/OVERRIDDEN/INVALID/UNSET | SOT-06 · SOL-12 Owner LOCK |
| One effective resolver semantics                          | SOT-07        |
| Runtime consumes effective configuration                  | SOT-08        |
| Crawler-critical metadata available in public HTML        | SOT-09        |
| Single asset authority                                    | SOT-10        |
| Existing Media Library considered before new asset system | SOT-10/SOT-12 |
| Existing Article pipeline reused                          | SOT-04        |
| OG/Social: independent semantics · shared-default asset OK | SOT-13 · SOL-09 Owner LOCK |
| No localStorage authority                                 | SOT-24/SOT-26 |
| No hard-coded primary authority                           | SOT-02/SOT-14 |
| Page Settings ≠ SEO authority; Page SEO = **Thiết lập SEO từng trang** | SOT-15 · SOL-04 · OD-SOL-03 |
| Global SEO Admin ≠ Brand Identity; Global = **Thiết lập SEO hệ thống** | SOL-03 · OD-SOL-03 |
| Category SEO remains adjacent                             | SOT-16        |
| Content Engine remains boundary                           | SOT-17        |
| Admin write and public read separated                     | SOT-18–20     |
| Existing public behavior preserved                        | SOT-23        |
| SEO consumes Foundation                                   | SOT-28        |

---

# 28. BR → Audit → SoT → Solution Traceability

Đây là **traceability registry chính thức của Solution**.

| BR    | Requirement                 | Audit                          | SoT                       | Solution                       |
| ----- | --------------------------- | ------------------------------ | ------------------------- | ------------------------------ |
| BR-01 | Global Site Configuration   | AUD-01.1–01.10; V2/V7/V8       | SOT-02, SOT-14            | SOL-03, SOL-09, SOL-20         |
| BR-02 | Asset Management Foundation | AUD-02.1–02.10; V3/V6          | SOT-10–12                 | SOL-07, SOL-08, SOL-14         |
| BR-03 | Page Configuration          | AUD-03.1–03.10; V4             | SOT-03, SOT-15            | SOL-04 (Thiết lập SEO từng trang), SOL-06 |
| BR-04 | Article Configuration       | AUD-04.1–04.10; V5             | SOT-04, SOT-13, SOT-17    | SOL-05, SOL-09 (shared-default), SOL-17 |
| BR-05 | Admin Dynamic Surface       | AUD-05.1–05.10                 | SOT-18, SOT-06            | SOL-12 · SOL-03/04 IA · SOL-13 |
| BR-06 | Persistence & Authority     | AUD-06.1–06.10; AUD-OWN        | SOT-02, SOT-07, SOT-08    | SOL-03, SOL-04, SOL-06, SOL-15 |
| BR-07 | Inheritance & Override      | AUD-07.1–07.10; V1             | SOT-05, SOT-06, SOT-07    | SOL-02, SOL-06, SOL-12 (BR-07.8), SOL-21 |
| BR-08 | Runtime Consumption         | AUD-08.1–08.10; AUD-REN; V7/V8 | SOT-07–09, SOT-20         | SOL-06, SOL-10, SOL-11, SOL-20 |
| BR-09 | Crawler/Public HTML         | AUD-09.1–09.6; V8              | SOT-09                    | SOL-11, SOL-20                 |
| BR-10 | Validation/Integrity        | AUD-10.1–10.8                  | SOT-06, SOT-11, SOT-21/22 | SOL-14, SOL-21                 |
| BR-11 | Existing Compatibility      | AUD-11.1–11.7                  | SOT-23/24                 | SOL-15, SOL-16                 |
| BR-12 | Foundation/SEO Separation   | AUD-12.1–12.5; V10             | SOT-27/28                 | SOL-19                         |
| BR-13 | Security/Permission         | AUD-13.1–13.6                  | SOT-18–20                 | SOL-12, SOL-13                 |

---

# 29. Audit Finding → Solution Traceability

| Finding | Audit conclusion                            | SoT          | Solution response      |
| ------- | ------------------------------------------- | ------------ | ---------------------- |
| V1      | No Global → Page → Article foundation       | SOT-01/05/07 | SOL-01, SOL-02, SOL-06 |
| V2      | Global Admin too narrow; runtime ignores DB | SOT-02/08/14 | SOL-03, SOL-10         |
| V3      | Brand asset localStorage orphan             | SOT-10/14/26 | SOL-07, SOL-15         |
| V4      | Page Settings ≠ Page SEO                    | SOT-03/15    | SOL-04                 |
| V5      | Article strongest path but no inheritance   | SOT-04/05/13 | SOL-05, SOL-06, SOL-09 |
| V6      | Media Library article-only                  | SOT-10/12    | SOL-07, SOL-08         |
| V7      | Dual site-name authority                    | SOT-02/08/14 | SOL-03, SOL-10         |
| V8      | Hub HTML weak; favicon 404                  | SOT-08/09/14 | SOL-03, SOL-11         |
| V9      | Category SEO not consumed                   | SOT-16       | SOL-18                 |
| V10     | SEO depends on Foundation                   | SOT-27/28    | SOL-19                 |

---

# 30. Evidence Context Carried Forward

Solution phải preserve các Audit contexts sau:

### Existing persistent capabilities

```text
marketing_brand_identity
media_assets
media_usages
community_posts.payload
page_published_versions
```

### Existing runtime capabilities

```text
resolveArticleMetadata
Pipeline A
Pipeline B
applyPostSeoToDocument
```

### Existing legacy sources

```text
pages/*.manifest.js
page-definition.js
static HTML <title>
hard-coded SVG logo
hard-coded "iFlux"
brand-identity-page.js
brand-identity-store.js
```

### Existing production evidence

```text
/favicon.ico → 404
Hub HTML → incomplete metadata
Article → stronger metadata pipeline
```

Không được bỏ mất các context này khi chuyển sang Plan.

---

# 31. Solution Acceptance Model

Solution chỉ được xem là **conceptually complete** khi chứng minh được 5 lớp:

```text
1. Authority
        ↓
2. Inheritance
        ↓
3. Resolution
        ↓
4. Runtime
        ↓
5. Compatibility
```

## 31.1 Authority

Phải có:

```text
Global
Page
Article
Asset
```

logical authority.

---

## 31.2 Inheritance

Phải có:

```text
Article > Page > Global > Fallback
```

field-level semantics.

---

## 31.3 Resolution

Mọi runtime metadata consumer phải dựa trên cùng effective resolution semantics.

---

## 31.4 Runtime

Effective configuration phải đến được:

```text
Public HTML
+
Runtime UI
```

theo đúng public-read boundary.

---

## 31.5 Compatibility

Existing:

```text
Pages
Articles
Media
Admin
Routes
```

không bị phá trong migration.

---

# 32. Solution Readiness Checklist

| Gate                              | Status | Evidence / Source |
| --------------------------------- | -----: | ----------------- |
| BR-01 solution mapped             |      ✅ | §28               |
| BR-02 solution mapped             |      ✅ | §28               |
| BR-03 solution mapped             |      ✅ | §28               |
| BR-04 solution mapped             |      ✅ | §28               |
| BR-05 solution mapped             |      ✅ | §28               |
| BR-06 solution mapped             |      ✅ | §28               |
| BR-07 solution mapped             |      ✅ | §28               |
| BR-08 solution mapped             |      ✅ | §28               |
| BR-09 solution mapped             |      ✅ | §28               |
| BR-10 solution mapped             |      ✅ | §28               |
| BR-11 solution mapped             |      ✅ | §28               |
| BR-12 solution mapped             |      ✅ | §28               |
| BR-13 solution mapped             |      ✅ | §28               |
| Audit V1–V10 addressed            |      ✅ | §29               |
| SoT authority respected           |      ✅ | §25               |
| Reuse-first applied               |      ✅ | §23               |
| Existing Audit context preserved  |      ✅ | §30               |
| Implementation detail excluded    |      ✅ | §26               |
| Plan boundary preserved           |      ✅ | §26               |
| Category boundary preserved       |      ✅ | SOL-18            |
| Content Engine boundary preserved |      ✅ | SOL-17            |
| SEO downstream boundary preserved |      ✅ | SOL-19            |
| OD-SOL-01 field-state indicator   |      ✅ | SOL-12            |
| OD-SOL-02 OG/Social shared-default |     ✅ | SOL-09            |
| OD-SOL-03 Thiết lập SEO IA (sys+page) |  ✅ | SOL-03 · SOL-04   |

---

# 33. Solution Gate

## Current state

```text
BRD
  ✅ OWNER LOCKED · §8 IA amendment (Thiết lập SEO)

Mandatory Audit
  ✅ OWNER APPROVED

Governing SoT
  🔒 OWNER APPROVED / LOCKED · Rev B.2 IA align

Solution
  🔒 OWNER LOCKED · Rev A.2
```

Therefore:

```text
Solution OWNER LOCKED
      ↓
Plan (AUTHORIZED)
      ↓
Implementation (sau Plan gate)
```

### Important

Solution **không** tự cấp quyền Implementation. Plan phải tuân **SOL-IA / OD-SOL-03**.

---

# 34. Final Solution Model

```text
                         ┌──────────────────────────┐
                         │       ADMIN LAYER        │
                         │                          │
                         │ Global / Page / Article  │
                         │ Asset Management          │
                         └────────────┬─────────────┘
                                      │
                              Auth + RBAC
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │   CONFIGURATION AUTHORITY│
                         │                          │
                         │ GLOBAL                   │
                         │ PAGE                     │
                         │ ARTICLE                  │
                         └────────────┬─────────────┘
                                      │
                         Asset references included
                                      │
                                      ▼
                         ┌──────────────────────────┐
                         │   EFFECTIVE RESOLVER     │
                         │                          │
                         │ ARTICLE                  │
                         │    > PAGE                │
                         │    > GLOBAL              │
                         │    > FALLBACK             │
                         └────────────┬─────────────┘
                                      │
                         Public-safe projection
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
          ┌────────────────────┐             ┌────────────────────┐
          │   PUBLIC HTML      │             │   RUNTIME CONSUMER │
          │                    │             │                    │
          │ Crawler-readable   │             │ Browser UI         │
          │ metadata           │             │ Client metadata    │
          └────────────────────┘             └────────────────────┘
```

Asset:

```text
                 ┌─────────────────────┐
                 │   MEDIA LIBRARY      │
                 │   / Asset Authority  │
                 └──────────┬──────────┘
                            │
                     Validate / Persist
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
           GLOBAL         PAGE         ARTICLE
```

Migration:

```text
Legacy Sources
     │
     ├── manifests
     ├── static title
     ├── hard-coded brand
     ├── hard-coded logo
     └── localStorage brand
             │
             ▼
       Mapping / Migration
             │
             ▼
     Governed Authority
             │
             ▼
        Runtime Switch
             │
             ▼
          Verify
             │
             ▼
       Remove Legacy
```

---

# 35. Final Verdict

## Problem

**SOLVED AT ARCHITECTURAL/SOLUTION LEVEL**

Fragmented metadata/configuration authority được gom thành một logical Foundation model.

## Authority

**SOLVED**

```text
GLOBAL → PAGE → ARTICLE
```

## Precedence

**SOLVED**

```text
ARTICLE > PAGE > GLOBAL > FALLBACK
```

## Asset

**SOLVED**

Existing Media Library là nền tảng reuse, không tạo asset system song song.

## Article

**SOLVED**

Existing Community Article SEO pipeline được reuse và đưa vào shared resolution model.

## Page

**SOLVED**

Page metadata tách semantic khỏi Cài đặt Trang (giao diện/placement).  
**Owner LOCK (A.2):** Admin surface = **Thiết lập SEO → Thiết lập SEO từng trang**.

## Global Admin

**SOLVED**

**Owner LOCK (A.2):** Admin surface = **Thiết lập SEO → Thiết lập SEO hệ thống** — **không** đặt trong Nhận diện thương hiệu.

## Admin field state

**SOLVED (capability)**

Admin MUST biểu diễn `INHERITED | OVERRIDDEN | INVALID | UNSET` — không khóa pixel/layout.

## OG / Social

**SOLVED (preference)**

Semantic fields độc lập; default cho phép shared asset reference; override riêng vẫn được.

## Runtime

**SOLVED**

Runtime consume effective public configuration.

## Crawler

**SOLVED**

Crawler-critical metadata phải đi qua public/server HTML path.

## Legacy

**SOLVED AT STRATEGY LEVEL**

Legacy authority được migrate sau khi replacement authority tồn tại và được verify.

## Security

**SOLVED AT SOLUTION LEVEL**

Admin write và public read được tách boundary.

## SEO

**SOLVED AS DEPENDENCY**

SEO là downstream consumer, không recreate Foundation.

## Category / Content Engine

**BOUNDED**

Không tự ý mở rộng scope.

---

# 36. Governance Status

| Gate                         | Status                |
| ---------------------------- | --------------------- |
| BRD traceability             | ✅                     |
| Mandatory Audit traceability | ✅                     |
| Audit Finding traceability   | ✅                     |
| Evidence context preserved   | ✅                     |
| SoT traceability             | ✅                     |
| Authority model respected    | ✅                     |
| Reuse-before-create          | ✅                     |
| Existing capability reuse    | ✅                     |
| Migration boundary           | ✅                     |
| Runtime boundary             | ✅                     |
| Public HTML boundary         | ✅                     |
| Admin/RBAC boundary          | ✅                     |
| Category boundary            | ✅                     |
| Content Engine boundary      | ✅                     |
| SEO downstream boundary      | ✅                     |
| Physical schema              | ⏳ Plan/Implementation |
| API contract                 | ⏳ Plan/Implementation |
| Exact Admin UI pixels        | ⏳ Plan/Implementation (field-state capability đã LOCK) |
| Migration SQL                | ⏳ Plan/Implementation |
| Deployment                   | ⏳ Plan/Implementation |
| SoT Owner Approval           | ✅ **APPROVED / LOCKED** |
| Owner prefs (3→IA A.2)       | ✅ **LOCKED** OD-SOL-01 · 02 · 03 (Thiết lập SEO) |
| Solution Lock                | ✅ **OWNER LOCKED** Rev A.2 |
| Implementation Authorization | ❌ **NOT AUTHORIZED** until Plan gate |

---

# 36. Owner Decision Registry

| ID | Quyết định | Status | Solution anchor |
|----|------------|--------|-----------------|
| **OD-SOL-01** | Admin MUST biểu diễn field state `INHERITED / OVERRIDDEN / INVALID / UNSET`; không khóa UI pixel | 🔒 LOCK | SOL-12 |
| **OD-SOL-02** | OG & Social: semantic fields độc lập; default cho phép shared asset; override riêng sau được | 🔒 LOCK | SOL-09 |
| **OD-SOL-03** | Admin IA: mục **Thiết lập SEO** (cùng cấp Nhận diện thương hiệu) gồm **Thiết lập SEO hệ thống** (Global) + **Thiết lập SEO từng trang** (Page). **Cấm** nhét Global vào Brand; **cấm** nhét Page vào Cài đặt Trang. Article SEO giữ trên article edit. | 🔒 LOCK · **A.2 supersedes** A.1 Page-Settings-reuse-first | SOL-03 · SOL-04 · SOL-12 |

### A.1 → A.2 changelog (OD-SOL-03)

| Trước (A.1) | Sau (A.2 · Owner) |
|-------------|-------------------|
| Global mở rộng Brand Identity UI | Global = **Thiết lập SEO hệ thống** |
| Page reuse-first vào Page Settings IA | Page = **Thiết lập SEO từng trang** |
| — | Parent **Thiết lập SEO** cùng cấp **Nhận diện thương hiệu** |

---

# END OF SOLUTION DESIGN

**Revision:** A.2  
**Derived from:** BRD §16 + §8 IA amendment → Audit Rev A → SoT Rev B.1  
**Owner prefs locked:** OD-SOL-01 · OD-SOL-02 · OD-SOL-03  
**Solution status:** 🔒 OWNER LOCKED  
**Next governed artifact:** `05 — Plan` (team)  
**Implementation:** Not authorized until Plan gate

---

# 37. SOL-IA — Admin Navigation Contract (Plan must implement)

```text
… (cùng khu vực / cùng cấp với Nhận diện thương hiệu) …

Nhận diện thương hiệu          ← giữ; không chứa Global SEO form

Thiết lập SEO                  ← NEW parent
 ├── Thiết lập SEO hệ thống    ← Global configuration Admin
 └── Thiết lập SEO từng trang  ← Page configuration Admin

Cài đặt Trang                  ← Giao diện / placement ONLY

Community → Sửa bài viết       ← Article SEO (existing)
```

Plan được quyền chọn exact `routeKey` / file path / permission keys, miễn **labels tiếng Việt** và **boundary** trên không đổi.
