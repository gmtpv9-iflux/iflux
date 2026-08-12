CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# 04 — Solution Design

# Website SEO Metadata Management & SEO Platform

|                     |                                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Task ID**         | `040826_Website_SEO_Metadata_Management`                                                                    |
| **BRD**             | `01 - Business Requirement.md` · §0 BR Checklist · 🔒 LOCKED (rev.C)                                        |
| **Mandatory Audit** | `02 - Mandatory-Audit.md` · 🔒 LOCKED · ✅ APPROVED rev. **C**                                               |
| **Governing SoT**   | `03 - Governing SoT.md` · 🔒 OWNER LOCKED rev. **B.3** (Owner Final Decision 2026-08-10) |
| **Prerequisite**    | `090826_Site_Metadata_Asset_Dynamic_Configuration_Foundation` · SEO Platform **consumes** Foundation (MUST NOT recreate) |
| **Document**        | Solution Design                                                                                             |
| **Rev**             | **D.1.2** + **Appendix D.1.3** (2026-08-11 Owner Clarification: Singleton DEFER · ALT policy · BR-01.3 PASS · Breadcrumb/Versioning) |
| **Status**          | 🔒 **OWNER LOCKED** — Implementation residual **chỉ** khi Owner GO mới; Singleton redesign **DEFER** |
| **Governance**      | BRD → Audit → SoT **B.3** → **Solution D.1.2** → Plan 05 align → STOP & REPORT |

> **Purpose:** Define HOW the locked SEO policies are implemented as one coherent SEO platform.
>
> This document MUST satisfy the locked BRD, incorporate Mandatory Audit findings, and remain subordinate to Governing SoT **rev. B.2**.
>
> Solution MUST NOT redefine, weaken, or silently modify SoT policy.  
> Solution MUST NOT base on SoT B.1.  
> Solution MUST NOT recreate Foundation (`090826`) configuration / asset / public-metadata authority.

### Changelog rev. D → D.1 (2026-08-09)

| Fix | Nội dung |
|-----|----------|
| MUST-1 | Pin Governing SoT **B.2** |
| MUST-2 | **D-SEO-09** = layered Index Boundary Enforcement principle · Owner LOCKED · signal detail → Plan |
| MUST-3 | Absorb **090826 Foundation** — SEO Platform consumes; §28 / SOL-CMS / SOL-IDENT không tạo authority thứ hai |
| MUST-4 | Fix BR→Decision mapping (BR-06.3/06.4 · BR-10.2 → **D-SEO-11**); SOL pointers §0.1.1 / §3.1 |
| SHOULD | Internal SEO target · other HTTP · Health matrix · Contract Violation language · DoD D-SEO-09 không `[x]` complete |
| D.1.1 | Reviewer clarify: **BR không trùng / không sửa BR** · overlap = Solution implementation scope · BR disposition matrix §28.4 · SOL-VERSION/RBAC consume-extend |

### Changelog rev. D.1.1 → D.1.2 (2026-08-10) — SoT B.3 absorb ONLY

| Fix | Nội dung |
|-----|----------|
| HOMEPAGE | SOL-CONTEXT / SOL-CANON / SOL-HTML: `/` pageKey=`community`; Clean identity `/cong-dong`; anti-duplicate |
| AUTO | SOL-AUTO / SOL-TMPL: rule-driven Admin template → deterministic resolve; AUTO ≠ AI |
| FAVICON | SOL-IDENT: global-only; page-level override forbidden; residual API → Plan cleanup |
| SLUG 301 | SOL-CANON / SOL-REDIR: `former_slugs` store + 301 mechanism (official) |
| ENTITY | SOL-TMPL / SOL-OG: type template + OG/Social once-per-type; Article override KEEP |
| ZALO | SOL-HTML: Zalo = crawler consumer via **existing** shell; no separate pipeline |
| DEFER | SOL-BC Wave C; SOL-VERSION → Foundation NOTSTART; Pagination N/A (Audit 13); WATCH/SEARCH lock |
| GAPS | SOL-IMG: ALT track ≠ Social JPEG/PNG track; both need Plan before Owner GO |
| SINGLETON | Detector expansion KEEP; ≠ architecture PASS |

---

# 0. Solution Gate

## 0.1 Authority

The governing sequence is:

```text
01 - Business Requirement.md          · 🔒 LOCKED (rev.C)
        ↓
02 - Mandatory-Audit.md               · 🔒 APPROVED (rev.C)
        ↓
03 - Governing SoT.md                 · 🔒 OWNER LOCKED (rev. **B.2**)
        ↓
Prerequisite: 090826 Foundation       · consume boundary (MUST)
        ↓
04 - Solution Design.md               ← this document · rev. **D.1.1** · 🔒 **OWNER LOCKED** (2026-08-09)
        ↓
05 - Plan                             ← OPEN after Solution LOCK
        ↓
Implementation                        ← only after Plan Owner LOCK / authorize
```

Authority precedence:

```text
BRD
  > Mandatory Audit
  > Governing SoT
  > Solution
  > Plan
  > Implementation
```

If implementation feasibility conflicts with a locked policy:

```text
STOP
 ↓
Owner Decision
 ↓
SoT amendment if policy changes
 ↓
Solution amendment
```

Implementation MUST NOT resolve a policy conflict by silently changing the Solution or SoT.

---

## 0.2 Solution Responsibility

This Solution is responsible for defining:

* architecture
* component ownership
* resolution flow
* data flow
* enforcement mechanisms
* rendering integration
* conflict handling
* validation
* observability
* reuse boundaries
* implementation constraints

This Solution does **not** define:

* new SEO policy
* new URL taxonomy
* new Affiliate architecture
* new Index Universe policy
* new content semantics
* arbitrary SEO ranking strategy
* keyword strategy
* implicit URL migration

---

# 1. Solution Objectives

The solution establishes a single SEO platform that provides deterministic SEO behavior for:

* public static pages
* public entity pages
* Community articles
* future public entities
* eligible public URLs
* URL variants
* crawler-facing HTML
* social previews
* sitemap
* structured data
* Admin SEO configuration
* SEO health diagnostics

The target outcome is:

```text
                 SEO Configuration / Source Data
                              │
                              ▼
                    ┌───────────────────┐
                    │ SEO Context       │
                    │ + URL Resolution  │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ SEO Policy Engine │
                    │ Eligibility       │
                    │ Conflict          │
                    │ Resolution        │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ SEO Resolver      │
                    │ Template / Data   │
                    │ Override / Fallback│
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ SEO Contract      │
                    │ ONE authoritative │
                    │ result            │
                    └─────────┬─────────┘
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
        First HTML        Social/OG        Sitemap/SD
             │
             ▼
        Human Runtime
```

The core architectural objective is:

> **Every public rendered document receives one authoritative SEO result from one governed resolution path.**

---

# 2. Core Architectural Principles

## 2.1 One SEO Contract

All SEO consumers MUST consume the same logical SEO Contract.

No feature module may independently construct:

* title
* description
* canonical
* robots
* OG URL
* OG title
* OG description
* structured-data identity
* sitemap eligibility

---

## 2.2 One SEO Identity

Every indexable public URL MUST resolve to exactly one SEO identity.

```text
Public URL
   ↓
SEO Identity
   ↓
Canonical Clean Public URL
```

Affiliate/Public Identity decorators do not create additional SEO identities.

---

## 2.3 One Metadata Instance per Rendered Document

For every rendered public document, there MUST be exactly one authoritative instance of each applicable SEO metadata field.

Applicable fields include:

```text
<title>
<meta name="description">
<link rel="canonical">
<meta name="robots">

og:url
og:title
og:description
og:image

twitter:card
twitter:title
twitter:description
twitter:image
```

Where standard semantics permit multiple values, multiplicity may exist only where explicitly allowed.

Otherwise:

```text
duplicate authoritative metadata
        ↓
Health ERROR
```

The Solution MUST therefore provide a singleton metadata emission boundary.

---

## 2.4 HTTP Status Is Part of SEO Contract Semantics

HTTP status MUST be resolved as part of the SEO result.

Conceptually:

```text
HTTP Status
SEO Eligibility
Redirect
Canonical
Robots
Sitemap
OG/SD Identity
```

are one coherent decision set.

Required baseline semantics:

| HTTP Status | SEO behavior                                                 |
| ----------- | ------------------------------------------------------------ |
| `200`       | Normal resource evaluation                                   |
| `301`       | Permanent redirect; destination governs SEO identity         |
| `302`       | Temporary redirect; must not create independent SEO identity |
| `404`       | Resource not found; non-indexable                            |
| `410`       | Resource permanently gone; non-indexable                     |

The implementation MUST NOT allow incoherent combinations such as:

```text
404 + indexable
404 + sitemap eligible
404 + canonical self-identity
410 + indexable
redirect + sitemap eligible
redirect + independent OG/SD identity
```

---

## 2.5 Deterministic Conflict Resolution

SEO signals MUST NOT be independently evaluated without a precedence model.

The platform MUST resolve conflicts across:

```text
HTTP status
redirect
index eligibility
canonical
robots
sitemap eligibility
OG URL
structured-data URL
internal SEO target
```

into one coherent result.

Conceptually:

```text
Request
  ↓
HTTP / URL classification
  ↓
Redirect decision
  ↓
Index Universe
  ↓
Canonical identity
  ↓
Robots policy
  ↓
Sitemap eligibility
  ↓
OG / SD identity
  ↓
Final SEO Contract
```

If an invalid state survives resolution:

```text
Prevent emission
OR
Health ERROR
```

depending on the nature of the conflict.

---

# 3. Solution Component Registry

| SOL ID            | Component                          | Primary Authority          | Serves BR         |
| ----------------- | ---------------------------------- | -------------------------- | ----------------- |
| **SOL-CONTEXT**   | SEO request/context normalization  | SoT URL/Identity authority | BR-01,07,45       |
| **SOL-CONTRACT**  | Single SEO Metadata Contract       | D-SEO-03 · SoT §3          | BR-06,34,01       |
| **SOL-SINGLETON** | Singleton metadata emission        | SoT **§0.1.1 · §25.1** · D-SEO-03 | BR-29.3,34.4     |
| **SOL-AUTO**      | Automatic-by-default resolver      | D-SEO-04                   | BR-01,02,19,20,37 |
| **SOL-OVERRIDE**  | Manual override governance         | SoT §5.2                   | BR-02.B,02.C      |
| **SOL-TMPL**      | Template / Rule engines            | SoT §6 · §9                | BR-08,09,10.1     |
| **SOL-HTTP**      | HTTP status/SEO coherence          | SoT **§3 · §3.1 · §39 · D-SEO-11** | BR-06.3,06.4,10.2,29.2 |
| **SOL-CONFLICT**  | Deterministic conflict resolution  | SoT **D-SEO-11**           | BR-10.2,29.2      |
| **SOL-URL**       | Vietnamese-first URL consumption   | D-SEO-10                   | BR-07,24          |
| **SOL-CANON**     | Canonical engine                   | SoT **§8** · D-SEO-01      | BR-11,12          |
| **SOL-INDEX**     | Index Boundary Enforcement         | D-SEO-01 · **D-SEO-09**    | BR-13,45          |
| **SOL-AFF**       | Affiliate/Public Identity boundary | D-SEO-02                   | BR-45,46          |
| **SOL-HTML**      | First-HTML crawler rendering       | D-SEO-05                   | BR-35,07          |
| **SOL-OG**        | OG/Twitter from Contract           | SoT §11                    | BR-15,16          |
| **SOL-SD**        | Structured data from Contract      | SoT §14                    | BR-21             |
| **SOL-SITEMAP**   | Sitemap eligibility/output         | D-SEO-06                   | BR-14             |
| **SOL-IDENT**     | Favicon/site identity **consume Foundation** | D-SEO-07 · **090826** | BR-03,04,05 |
| **SOL-IMG**       | Image SEO + default OG fallback    | SoT §12 · §23 · **090826 assets** | BR-17,18 |
| **SOL-LINK**      | Internal SEO links = Clean Public  | SoT §22                    | BR-23             |
| **SOL-BC**        | Breadcrumb                         | SoT §15                    | BR-22             |
| **SOL-REDIR**     | Redirect governance                | SoT §21                    | BR-25             |
| **SOL-PREV**      | SEO Preview from Contract          | SoT §30                    | BR-28             |
| **SOL-HEALTH**    | SEO Health checks                  | SoT §31 · D-SEO-11         | BR-29             |
| **SOL-VERSION**   | Versioning / rollback / audit      | SoT §27–28                 | BR-30,31          |
| **SOL-CMS**       | Admin SEO surfaces **consume Foundation** | SoT §32 · **090826** · D-SEO-08 | BR-32 |
| **SOL-RBAC**      | SEO permissions                    | SoT §29                    | BR-33             |
| **SOL-VERIFY**    | Search verification tokens         | SoT §33                    | BR-03             |
| **SOL-OBS**       | Observability chain                | SoT §44                    | BR-48.OBS         |
| **SOL-REUSE**     | Reuse before replace               | D-SEO-08 · **090826**      | BR-47             |
| **SOL-CACHE**     | Cache / invalidation               | SoT NFR                    | BR-48             |
| **SOL-FAIL**      | Failure / fallback                 | SoT NFR                    | BR-48.REL         |

> Registry is singular. Duplicate SOL rows are prohibited.

---

# 4. SEO Resolution Architecture

## 4.1 Canonical Resolution Flow

```text
Incoming Request
       │
       ▼
URL / Identity Context
       │
       ├── Clean Public URL
       │
       └── Public Identity / Affiliate URL
                    │
                    ▼
             Attribution Context
                    │
                    ▼
             Underlying Resource
                    │
                    ▼
             URL Classification
                    │
                    ▼
             HTTP / Redirect State
                    │
                    ▼
             Index Universe
                    │
                    ▼
             Entity / Page
                    │
                    ▼
             Locale
                    │
                    ▼
             Template
                    │
                    ▼
             Entity Data
                    │
                    ▼
             Manual Override
                    │
                    ▼
             Derived Metadata
                    │
                    ▼
             Default Fallback
                    │
                    ▼
             Conflict Resolution
                    │
                    ▼
             SEO Contract
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
       HTML        Social    Sitemap
```

---

# 5. SEO Context

The resolver MUST receive a normalized context.

Conceptually:

```text
SEOContext
├── requestedUrl
├── cleanPublicUrl
├── urlVariant
├── publicIdentity
├── affiliateContext
├── locale
├── route
├── pageType
├── entityType
├── entityId
├── entityState
├── httpStatus
├── redirect
└── indexUniverseState
```

The exact implementation structure may differ.

The important invariant is:

> SEO must consume the existing URL/Identity authority rather than independently reconstructing route identity.

---

# 6. URL and Identity Boundary

## 6.1 Clean Public URL

The Clean Public URL is the SEO identity for eligible public resources.

Example:

```text
https://iflux.vn/cong-dong/bai-viet/example
```

---

## 6.2 Affiliate/Public Identity

For:

```text
/{publicId}/...
```

the runtime MUST:

1. resolve Public Identity
2. preserve attribution
3. resolve underlying clean resource
4. classify decorated URL outside Index Universe
5. keep SEO identity on clean resource
6. prevent decorated URL from sitemap
7. prevent decorated URL from becoming OG/SD identity

The SEO layer MUST consume the result.

It MUST NOT redesign Affiliate behavior.

---

# 7. Index Boundary Enforcement — D-SEO-09

## 7.0 Decision nature (MUST)

**D-SEO-09 is not a new SEO policy.**

Policy already LOCKED (SoT Index Universe / Affiliate / Public Identity):

> Public Identity / Affiliate **decorated URL ∉ SEO Index Universe**.

Example:

```text
Clean:     https://iflux.vn/cong-dong/bai-viet/abc
Decorated: https://iflux.vn/ABC123/cong-dong/bai-viet/abc
```

Same content may be reachable; SEO identity remains the Clean Public URL only.

D-SEO-09 answers **one** Solution question:

> How does the platform ensure a decorated / non-Clean URL variant cannot become an independent SEO entity?

Same principle MAY apply to other non-SEO variants (`?ref=`, `?r=`, …) when URL Policy places them outside Index Universe.

---

## 7.1 Owner Decision — 🔒 LOCKED (mechanism principle)

| Field | Value |
| ----- | ----- |
| **Status** | 🔒 **OWNER LOCKED** (principle) |
| **Mechanism** | **Layered Index Boundary Enforcement** |
| **Implementation detail** | **DEFERRED TO PLAN** (signal placement / runtime path) |

### Mandatory invariants (LOCKED)

After Affiliate/Public Identity resolution at the URL/Identity boundary — **before** SEO Contract treats the request as a SEO identity:

```text
Decorated URL
      ↓
Affiliate / Public Identity resolution
      ↓
Variant classified = DECORATED (or other non-index variant)
      ↓
Underlying Clean Public resource
      ↓
SEO identity = Clean Public URL
      ↓
Decorated URL:
  - NOT Index Universe
  - NOT sitemap
  - NOT independent OG identity
  - NOT independent SD identity
  - canonical → Clean Public URL where applicable
  - non-index signal MUST be emitted (HTTP and/or HTML — path chosen in Plan)
  - Affiliate attribution MUST still run normally
```

| # | Invariant | Required |
| - | --------- | -------- |
| 1 | Variant classification at URL/Identity boundary | MUST |
| 2 | SEO identity collapse to Clean Public URL | MUST |
| 3 | Index Universe exclusion | MUST |
| 4 | Sitemap exclusion | MUST |
| 5 | No independent OG / SD identity | MUST |
| 6 | Appropriate non-index signal for the rendering path | MUST |
| 7 | Affiliate attribution preserved | MUST |

### Explicitly NOT locked at Solution

```text
D-SEO-09 ≠ “meta robots noindex alone”
D-SEO-09 ≠ “X-Robots-Tag alone”
D-SEO-09 ≠ nginx file / middleware class / one HTML tag choice
```

Plan selects concrete signal(s) (`meta robots`, `X-Robots-Tag`, edge/runtime, response handling) from **runtime evidence**, provided all seven invariants remain true.

**Weak architecture forbidden:** relying on a single crawler signal without classification + identity collapse + sitemap exclusion.

---

## 7.2 Required policy outcome (unchanged SoT)

```text
Decorated Request
      ↓
Affiliate/Public Identity Resolution
      ↓
Attribution preserved
      ↓
Clean Resource resolved
      ↓
SEO Identity = Clean Public
      ↓
Decorated URL ∉ Index Universe
```

---

# 8. SEO Contract

The normalized SEO Contract MUST conceptually contain:

```text
SEOContract
├── http
│   ├── status
│   ├── redirect
│   └── redirectTarget
│
├── identity
│   ├── requestedUrl
│   ├── seoIdentityUrl
│   └── canonicalUrl
│
├── indexability
│   ├── indexUniverse
│   ├── robots
│   └── sitemapEligible
│
├── document
│   ├── title
│   ├── description
│   └── locale
│
├── social
│   ├── og
│   └── twitter
│
├── structuredData
│
├── breadcrumb
│
├── images
│
└── trace
    ├── source
    ├── mode
    ├── template
    ├── override
    └── version
```

The exact programming interface is implementation-level and belongs to Plan.

---

# 9. HTTP Status Resolution

HTTP status MUST participate in SEO resolution before final metadata emission.

## 9.1 `200`

```text
HTTP 200
 ↓
Evaluate resource
 ↓
Resolve indexability
 ↓
Resolve canonical
 ↓
Resolve metadata
```

A `200` resource may be:

* indexable
* noindex
* decorated/non-indexable
* restricted

depending on policy.

---

## 9.2 `301`

```text
HTTP 301
 ↓
Destination URL
 ↓
Destination SEO identity
```

The redirecting URL MUST NOT become an independent sitemap or SEO identity.

---

## 9.3 `302`

Temporary redirects MUST preserve temporary redirect semantics.

The redirecting URL MUST NOT be independently emitted as a sitemap identity.

---

## 9.4 `404`

A `404` response MUST be:

```text
non-indexable
not sitemap eligible
not a valid canonical SEO identity
```

---

## 9.5 `410`

A `410` response MUST be:

```text
non-indexable
not sitemap eligible
not a valid canonical SEO identity
```

---

## 9.6 Other non-success HTTP

Any other non-success status that is **not** a governed redirect (`301`/`302`) and **not** a governed gone/missing (`404`/`410`) MUST default to:

```text
non-indexable for SEO Contract purposes
not sitemap eligible
not a valid independent SEO identity
Health WARN or ERROR if emitted as if indexable
```

Plan may refine per-status nuance; Solution forbids treating unknown/error responses as silent indexable success.

---

# 10. Conflict Resolution

## 10.1 Resolution Principle

The resolver MUST produce one internally coherent result.

Example:

```text
HTTP = 404
Index = false
Sitemap = false
Canonical = absent
```

is coherent.

But:

```text
HTTP = 404
Index = true
Sitemap = true
Canonical = self
```

is invalid.

---

## 10.2 Conflict Precedence

The Solution establishes the following implementation precedence:

```text
HTTP terminal state / redirect
        ↓
Index Universe membership
        ↓
Canonical identity
        ↓
Robots policy
        ↓
Sitemap eligibility
        ↓
OG URL
        ↓
Structured-data identity
```

Interpretation:

### A. Terminal HTTP state wins

If resource is `404` or `410`:

```text
index = false
sitemap = false
canonical = no valid self-identity
```

### B. Redirect wins over source identity

If URL redirects:

```text
source URL ≠ SEO identity
destination = SEO identity
source ∉ sitemap
```

### C. Index Universe controls SEO identity eligibility

If URL is outside Index Universe:

```text
index = false
sitemap = false
no independent SEO identity
```

### D. Canonical must point to the SEO identity

Canonical cannot contradict the resolved identity.

### E. Social and Structured Data inherit identity

```text
og:url = canonical SEO identity
structuredData.url = same SEO identity
```

unless schema semantics explicitly require another URL.

---

## 10.3 Invalid State Handling

Invalid combinations MUST NOT silently pass.

The platform must either:

```text
Prevent invalid emission
```

or:

```text
Emit safe fallback
+
SEO Health ERROR
```

The specific failure behavior belongs to the implementation Plan, but the invariant is mandatory.

---

# 11. Singleton Metadata Emission

## 11.1 Ownership

The final document head MUST have one authoritative SEO metadata emission boundary.

Architecture:

```text
SEO Contract
     ↓
SEO Head Renderer
     ↓
Document <head>
```

Feature modules MUST NOT append competing SEO tags.

---

## 11.2 Forbidden Pattern

```text
Article module → <title>
SEO engine → <title>
Nginx → OG
SPA → canonical
Page template → robots
```

This creates multiple owners.

---

## 11.3 Required Pattern

```text
Article/Page/Entity
       ↓
Source data
       ↓
SEO Resolver
       ↓
SEO Contract
       ↓
ONE Head Renderer
```

---

## 11.4 Duplicate Detection = Contract Violation

Duplicate authoritative metadata is not a cosmetic Health hint.

It is a **SEO Contract Violation** (SoT Singleton / Authoritative Metadata Instance).

Health checks MUST detect duplicate authoritative metadata and classify as:

```text
Health ERROR · Contract Violation
```

Examples:

```text
2 × <title>
2 × canonical
2 × meta description
2 × og:url
2 × og:title
```

The implementation MUST distinguish legitimate multi-value metadata from duplicate authoritative instances.

---

# 12. Automatic Resolution

Automatic generation is the default.

Resolution:

```text
Source Data
   ↓
Approved Template
   ↓
Derived Metadata
   ↓
Fallback
```

Example Article:

```text
Title
 ← Article.title

Description
 ← SEO override
 ← Article summary
 ← Excerpt
 ← deterministic fallback

Canonical
 ← Clean Public URL

OG
 ← SEO Contract

Structured Data
 ← Article semantics
```

---

# 13. Manual Override

Manual override is exceptional.

Allowed examples:

* editorial SEO title
* editorial SEO description
* article OG image
* approved campaign metadata
* approved indexing exception
* supported structured-data override

Overrides MUST:

* be optional
* be traceable
* be permission controlled
* have deterministic fallback
* never override system-only fields
* be distinguishable from automatic values

---

# 14. System-Only Fields

The following remain system-controlled:

```text
HTTP status
redirect target/type
canonical URL
normalized URL
Index Universe membership
sitemap eligibility
URL variant classification
Public Identity exclusion
derived robots policy
generated og:url
generated structured-data identity
```

Editors MUST NOT directly modify these through normal content UI.

---

# 15. Vietnamese-First URL Taxonomy

The SEO engine consumes existing URL/Route authority.

Current taxonomy remains:

```text
/cong-dong
/cong-dong/bai-viet/{slug}

/thi-truong
/dong-tien

/co-phieu/{ticker}
/nganh/{slug}
/he-sinh-thai/{slug}
```

The Solution MUST NOT:

* invent new Vietnamese taxonomy
* rename `/co-phieu`
* replace `/co-phieu` with `/stocks`
* silently introduce English public routes
* migrate indexed URLs
* change slugs merely for SEO preference

Example:

```text
/co-phieu/vcb
```

remains the Clean Public SEO URL.

---

# 16. Locale Readiness

The architecture remains locale-aware:

```text
Locale
 ↓
URL taxonomy
 ↓
Metadata template
 ↓
Canonical
 ↓
Alternate/hreflang
```

Current Vietnamese behavior remains authoritative.

Future EN SEO requires a separate approved decision.

No existing Vietnamese route may be silently renamed.

---

# 17. Canonical Engine

Canonical resolution:

```text
Requested URL
      ↓
Normalize
      ↓
Classify URL
      ↓
Resolve Clean Public SEO Identity
      ↓
Canonical
```

Canonical MUST be:

* absolute
* HTTPS
* normalized
* deterministic
* Clean Public
* independent of referral decoration
* independent of Public Identity

Example:

```text
https://iflux.vn/cong-dong/bai-viet/example
```

---

# 18. Query Parameters

Query parameters MUST be classified by the URL/SEO policy.

Examples:

```text
?sort=
?filter=
?page=
?ref=
?r=
```

The resolver MUST NOT allow arbitrary query strings to create separate SEO entities.

Affiliate parameters remain under Affiliate/Public Identity authority.

---

# 19. First-HTML Rendering

SEO-critical metadata MUST be available in the crawler-consumable response path for eligible public pages.

Minimum:

```text
<title>
description
canonical
robots
OG
Twitter
structured data where applicable
favicon/site identity
```

The crawler path and human path MUST consume the same SEO Contract.

---

# 20. Rendering Architecture

Required:

```text
                 SEO Contract
                      │
             ┌────────┴────────┐
             ▼                 ▼
        Human Runtime      First HTML
             │                 │
             └────────┬────────┘
                      ▼
                Same Metadata
```

Forbidden:

```text
SPA metadata builder
+
server metadata builder
+
Nginx OG builder
+
feature-specific metadata
```

---

# 21. OG / Twitter

OG/Twitter metadata is derived from the SEO Contract.

Required where applicable:

```text
og:title
og:description
og:url
og:type
og:image
og:site_name

twitter:card
twitter:title
twitter:description
twitter:image
```

`og:url` MUST resolve to the same SEO identity as canonical.

Affiliate/Public Identity MUST NOT become the independent OG identity.

---

# 22. Structured Data

Structured Data MUST be generated from the same resolved entity identity.

Supported schemas may include:

```text
Organization
WebSite
WebPage
BreadcrumbList
Article
NewsArticle
Person
FAQPage
CollectionPage
ImageObject
```

Only semantically applicable schemas are emitted.

Structured Data MUST NOT create an identity different from canonical SEO identity.

---

# 23. Breadcrumb

One resolved breadcrumb model feeds:

```text
Visible Breadcrumb
        +
BreadcrumbList JSON-LD
```

Example:

```text
Trang chủ
 ↓
Thị trường
 ↓
Cổ phiếu
 ↓
VCB
```

---

# 23.1 Internal SEO Link Targets (SOL-LINK)

Internal links that participate in SEO discovery / crawl graph MUST target **Clean Public URLs**.

Forbidden as primary SEO targets:

```text
Affiliate / Public Identity decorated paths
attribution-only variants
non-Index-Universe variants
```

Attribution links remain valid for Affiliate flows; they MUST NOT become the site’s default internal SEO graph targets.

---

# 24. Robots Policy

Robots policy is centrally resolved.

Inputs may include:

```text
Index Universe
resource state
URL variant
draft/published
private/public
deleted
empty collection
search page
query variant
pagination
Affiliate/Public Identity
```

Output MUST be deterministic.

Robots is a signal derived from the broader SEO decision.

It is not the sole definition of Index Universe membership.

---

# 25. Sitemap

Sitemap generation consumes SEO eligibility.

```text
SEO Index Universe
        ↓
Eligible canonical URLs
        ↓
Sitemap Generator
        ↓
sitemap.xml
```

Sitemap MUST NOT independently enumerate arbitrary routes.

A sitemap URL MUST NOT normally be:

* noindex
* redirecting
* non-canonical
* decorated
* private
* draft
* deleted
* invalid

Target:

```text
Sitemap URL
     =
Canonical SEO URL
     =
Index Universe URL
```

where applicable.

---

# 26. Redirect Management

Redirect policy is centralized where practical.

Supported:

```text
301
302
410
```

The solution must detect/prevent:

* redirect loops
* redirect chains
* redirect-to-redirect sitemap entries
* canonical-to-redirect conflicts
* redirecting URLs becoming independent SEO identities

---

# 27. URL Migration Constraint

This Solution does NOT authorize URL migration.

Existing routes remain authoritative.

Any future migration requires a separate approved package:

```text
Old URL inventory
 ↓
301 mapping
 ↓
Canonical migration
 ↓
Sitemap migration
 ↓
Internal-link migration
 ↓
Redirect-chain verification
 ↓
Search-engine monitoring
```

No SEO component may initiate this automatically.

---

# 28. Admin SEO Configuration — consume Foundation (`090826`)

## 28.0 Ownership boundary (MUST)

```text
090826 Foundation
      │ owns configuration / assets / public metadata foundation
      │ (Global · Page · identity assets · public effective metadata)
      ▼
SEO Metadata Platform (`040826`)
      │ consumes Foundation as resolver inputs
      │ orchestrates Contract · First HTML · Social · SD · Sitemap · Health
      ▼
SEO Resolver / Contract
```

**FORBIDDEN:**

```text
Foundation SEO Metadata Authority
             +
SEO Platform greenfield “System → SEO Settings” authority
             ↓
       TWO OWNERS
```

SOL-CMS / SOL-IDENT / SOL-IMG **reuse and extend** Foundation Admin surfaces and persistence. They MUST NOT invent a second Global/Page/asset authority.

## 28.1 Existing Foundation surfaces (consume)

Aligned with Foundation Owner IA (**Thiết lập SEO**):

```text
Admin
 └─ Marketing / Tiếp thị
     └─ Thiết lập SEO
         ├── Hệ thống   → Global Site Metadata / identity / defaults
         └── Từng trang → Page SEO configs / templates
```

Foundation already provides (evidence / runtime — reuse, do not recreate):

* Global site metadata (extends brand identity payload where Foundation locked)
* Page SEO configs / defaults
* Public effective metadata (`/api/seo/effective` and Admin SEO APIs as Foundation-owned)
* Favicon / OG / identity assets via Foundation asset authority
* Seeded page SEO baselines where Foundation shipped them

## 28.2 SEO Platform role on Admin

SEO Platform Admin work is **orchestration + governance UI on top of Foundation**:

* Index Universe / robots / sitemap policy controls (platform scope)
* Templates / overrides / preview / health / versioning as SoT §32 requires
* Conflict / singleton / HTTP coherence observability
* Search verification tokens (if not already under Foundation — extend, don’t fork)

These are **resolver / platform inputs and controls**, not a parallel metadata store for the same Global/Page fields.

## 28.3 Conceptual settings (inputs — not a second store)

Settings remain conceptual inputs to the SEO Contract (owned under Foundation persistence where already established):

* site name / title / default description
* default OG image · favicon · Apple touch · PWA icons
* Organization identity
* default robots policy
* Search Console / Bing verification
* locale configuration
* SEO defaults / page templates

Listing these fields here does **not** authorize rebuilding Admin SEO Settings. They name **data consumed from Foundation**.

## 28.4 BR disposition after Foundation (MUST — BR unchanged)

Foundation hoàn thành **không** làm BR-03 / BR-04 / BR-05 / BR-32… biến mất.  
BR vẫn đúng về **mục tiêu**. Cái đổi là **where/how** Solution đạt BR.

| Nội dung | BR | Trước khi absorb Foundation | Sau Foundation (`090826`) |
| -------- | -- | --------------------------- | ------------------------- |
| Admin SEO configuration | MUST | dễ hiểu nhầm = xây trong SEO Platform | **consume** Foundation Admin (**Thiết lập SEO**) |
| Lưu SEO config (DB/API) | MUST | SOL-CMS greenfield | **đã có Foundation** — Platform không tạo store thứ hai |
| Asset / identity (favicon, OG default, icons) | MUST (BR-03…05) | SOL-IDENT tự build | **consume** Foundation asset authority |
| SEO resolver | MUST | SOL-CONTRACT / SOL-AUTO | **040826** làm |
| SEO Contract | MUST | SOL-CONTRACT | **040826** làm |
| First HTML | MUST | SOL-HTML | **040826** làm |
| Canonical / Index Boundary | MUST | SOL-CANON / SOL-INDEX | **040826** làm |
| Sitemap | MUST | SOL-SITEMAP | **040826** làm |
| OG / Structured Data | MUST | SOL-OG / SOL-SD | **040826** làm |
| SEO Health / Conflict / Singleton | MUST | SOL-HEALTH / CONFLICT / SINGLETON | **040826** làm |
| Version / Rollback | MUST (BR-30/31) | SOL-VERSION tự dựng | **consume/extend** Foundation nếu đã có; **gap audit → Plan** — không duplicate store |
| RBAC | MUST (BR-33) | SOL-RBAC tự dựng perm tree | **consume/extend** Admin permission boundary Foundation/existing — không duplicate |

```text
BR = WHAT (locked, không sửa vì Foundation xong)
Solution boundary = WHERE/HOW (consume Foundation + Platform resolver/enforcement)
```

**Không mở Plan** để “làm lại SEO Settings”. Plan (sau Solution LOCK) chỉ được map runtime signals + gap version/RBAC lên Foundation hiện có.

---

# 29. Entity / Page Templates

Reusable templates are centrally managed.

Examples:

```text
Stock:
{Stock Name} ({Ticker}) | iFlux

Sector:
{Sector Name} | iFlux

Article:
{Article Title} | Cộng đồng iFlux

Author:
{Author Name} | Cộng đồng iFlux
```

Templates are versioned.

---

# 30. Description Resolution

Deterministic fallback:

```text
Manual SEO Description
        ↓
Entity SEO Description
        ↓
Entity Summary
        ↓
Excerpt
        ↓
Deterministic Template
        ↓
Global Default
```

The resolver must avoid empty metadata where sufficient source data exists.

---

# 31. Image SEO

Where supported, image metadata may include:

```text
ALT
width
height
URL
type
caption
credit
```

Source data is preferred.

Manual values are for editorial exceptions.

---

# 32. SEO Preview

Admin preview MUST consume the same resolver.

### Google

```text
Title
URL
Description
```

### OpenGraph

```text
Image
Title
Description
URL
```

### Twitter/X

```text
Card
Image
Title
Description
```

No second preview metadata engine is allowed.

---

# 33. SEO Health

Health operates as an observability layer over the SEO Contract.

Checks include:

```text
missing title
missing description
duplicate title
duplicate description
duplicate canonical
missing canonical
conflicting canonical
missing OG
duplicate OG
invalid robots
HTTP/SEO conflict
sitemap inconsistency
non-canonical sitemap URL
broken redirects
redirect loops
structured-data errors
missing H1
broken internal links
orphan pages
broken images
```

New SoT conflict rules MUST be represented explicitly.

---

# 34. HTTP ↔ SEO Health Rules

Health MUST detect states including:

| Invalid State                             | Health |
| ----------------------------------------- | ------ |
| `404` + indexable                         | ERROR  |
| `404` + sitemap eligible                  | ERROR  |
| `404` + canonical self-identity           | ERROR  |
| `410` + indexable                         | ERROR  |
| `410` + sitemap eligible                  | ERROR  |
| redirect + sitemap eligible               | ERROR  |
| redirect + independent canonical identity | ERROR  |
| redirect + independent OG/SD identity     | ERROR  |
| noindex + sitemap eligible                | ERROR  |
| decorated URL + independent SEO identity  | ERROR  |
| decorated URL + sitemap eligible          | ERROR  |
| decorated URL + independent OG/SD         | ERROR  |
| OG URL ≠ canonical SEO identity           | ERROR  |
| SD URL ≠ canonical SEO identity           | ERROR  |
| duplicate authoritative metadata          | ERROR · Contract Violation |
| internal SEO link → decorated URL as default graph target | WARN/ERROR |

Health is therefore a verification layer for the deterministic contract (D-SEO-11 coherence + Singleton).

---

# 35. SEO Versioning / Audit Trail

Configuration changes that affect SEO Contract inputs MUST be versioned.

Minimum fields (conceptual):

```text
Configuration
Changed By
Changed At
Previous Value
New Value
Version
```

**Reuse rule:** If Foundation (or existing Admin config store) already provides version/history for Global/Page SEO fields, SOL-VERSION **extends that trail** — MUST NOT invent a parallel version table for the same fields.

Gap (full rollback UX / field-level restore) is **audited in Plan**, not assumed greenfield in Solution.

Rollback restores the previous governed configuration without requiring source-code modification.

---

# 36. RBAC

Recommended capability names (conceptual — may map to existing Admin RBAC keys):

```text
SEO.View
SEO.Edit
SEO.Publish
SEO.ManageRedirect
SEO.ManageRobots
SEO.ManageSitemap
SEO.ManageVerification
SEO.Rollback
```

**Reuse rule:** SOL-RBAC **consumes/extends** existing Admin RBAC + Foundation permission boundary. MUST NOT create a second permission matrix for the same Global/Page SEO screens.

System-only metadata remains protected from normal content editing.

---

# 37. Verification

The platform may centrally manage:

* Google Search Console verification
* Bing Webmaster verification
* other approved verification mechanisms

Verification secrets MUST NOT be unnecessarily exposed to frontend JavaScript.

---

# 38. Cache / Invalidation

SEO configuration changes follow:

```text
Admin Change
      ↓
SEO Version
      ↓
Invalidate relevant cache
      ↓
Re-resolve Contract
      ↓
Regenerate sitemap if affected
      ↓
Crawler receives new metadata
```

Relevant layers:

```text
Application
Nginx
CDN / Cloudflare
Generated Sitemap
Browser where applicable
```

Exact cache implementation belongs to Plan.

---

# 39. Observability / Source Traceability

Every SEO result MUST be diagnosable.

For a URL:

```text
Requested URL
 ↓
URL Variant
 ↓
Public Identity
 ↓
HTTP Status
 ↓
Redirect
 ↓
Index Universe
 ↓
Entity
 ↓
Template
 ↓
Automatic Values
 ↓
Manual Overrides
 ↓
Final Values
 ↓
Canonical
 ↓
Robots
 ↓
Sitemap Eligibility
 ↓
OG / SD Identity
 ↓
Rendering Pipeline
```

Each metadata field should expose source information such as:

```text
Title
Source: Article.title
Mode: Automatic
Template: article.default.v1
Override: None
Version: 12
```

or:

```text
Description
Source: Article.seoDescription
Mode: Manual Override
Changed By: ...
Version: ...
```

---

# 40. Existing Code Reuse

Before creating new infrastructure, implementation MUST audit existing components.

## 40.1 Foundation `090826` (MUST consume — primary)

```text
Product Backlogs/090826_Site_Metadata_Asset_Dynamic_Configuration_Foundation/
backend/src/modules/site-seo/*
migrations 054_site_seo_foundation.sql · 055_seed_page_seo_baseline.sql
Admin marketing/thiet-lap-seo-he-thong · thiet-lap-seo-tung-trang
public /api/seo/effective · Admin /api/admin/seo/*
marketing_brand_identity payload EXTEND (Global) per Foundation
media_usages / identity assets per Foundation asset authority
```

SEO Platform **consumes** these. Creating a second Global/Page/asset Admin authority is a **governance FAIL**.

## 40.2 Other known candidates

```text
User_Web/iflux-web-ui/seo-url.js
User_Web/iflux-web-ui/runtime/page-definition.js
backend/src/modules/community/community-articles.service.js
infra/nginx-iflux-production-locations.conf
Affiliate/Public Identity resolver components
```

Reuse is preferred where the existing component already satisfies the required contract.

However:

> Reuse MUST NOT preserve competing ownership.

If a component becomes part of the SEO platform, its ownership must be explicitly transferred to the appropriate SOL component — except Foundation configuration/asset ownership, which **stays Foundation**; SEO Platform remains consumer/orchestrator.

This implements D-SEO-08 **and** Foundation consume boundary.

---

# 41. Audit Finding → Solution Mapping

Every Mandatory Audit finding must have an explicit Solution disposition.

| Audit | Finding                                      | Solution                                 | Disposition                     |
| ----- | -------------------------------------------- | ---------------------------------------- | ------------------------------- |
| V1    | No unified SEO Platform/CMS SoT              | SOL-CONTRACT · SOL-CMS                   | Addressed                       |
| V2    | List/hub first HTML weak                     | SOL-HTML                                 | Addressed                       |
| V3    | Article path more mature                     | SOL-REUSE · SOL-CONTRACT                 | Addressed                       |
| V4    | robots governance gap                        | SOL-INDEX · SOL-OBS                      | Addressed                       |
| V5    | Sitemap unavailable/gap                      | SOL-SITEMAP                              | Addressed                       |
| V6    | Favicon/identity gap                         | SOL-IDENT · **090826**                   | Addressed · consume Foundation  |
| V7    | Distributed ownership                        | SOL-CONTRACT · SOL-SINGLETON · SOL-REUSE · **090826** | Addressed · no second owner |
| V8    | Affiliate runtime / clean canonical          | SOL-AFF · SOL-CANON                      | Preserve                        |
| V9    | Index Boundary enforcement gap               | SOL-INDEX · **§7 D-SEO-09**              | Addressed · principle OWNER LOCKED · signal → Plan |
| V10   | Referral/publicId boundary                   | SOL-AFF                                  | Preserve                        |
| V11   | SERP / verification gap                      | SOL-VERIFY · SOL-HTML · SOL-OBS          | Addressed                       |
| V12   | Auto/manual inconsistency                    | SOL-AUTO · SOL-OVERRIDE · SOL-TMPL       | Addressed                       |
| V13   | HTTP status not part of contract             | SOL-HTTP · SOL-CONTRACT                  | Addressed                       |
| V14   | HTTP/SEO conflict ambiguity                  | SOL-CONFLICT · SOL-HEALTH                | Addressed                       |
| V15   | Duplicate metadata ownership / singleton gap | SOL-SINGLETON · SOL-HEALTH               | Addressed                       |

No finding may be classified as "soft-pass" merely because implementation is deferred.

---

# 42. BR → Audit → SoT → Solution Registry

## 42.1 BR-01 … BR-14

| BR    | Req          | SoT / Decision           | Solution                         | Status  |
| ----- | ------------ | ------------------------ | -------------------------------- | ------- |
| BR-01 | BR-01.1…01.4 | D-SEO-04                 | SOL-AUTO · SOL-CONTRACT          | COVERED |
| BR-02 | BR-02.A…D    | §5                       | SOL-AUTO · SOL-OVERRIDE          | COVERED |
| BR-03 | BR-03.1…03.2 | D-SEO-07                 | SOL-IDENT · SOL-VERIFY           | COVERED |
| BR-04 | BR-04.1…04.2 | D-SEO-07                 | SOL-IDENT                        | COVERED |
| BR-05 | BR-05.1…05.2 | D-SEO-07                 | SOL-IDENT                        | COVERED |
| BR-06 | BR-06.1…06.2 | D-SEO-03                 | SOL-CONTRACT · SOL-HTTP          | COVERED |
| BR-06 | BR-06.3…06.4 | SoT §3 · **D-SEO-11**    | SOL-HTTP · SOL-CONFLICT          | COVERED |
| BR-07 | BR-07.*      | D-SEO-05 · D-SEO-10      | SOL-CONTEXT · SOL-URL · SOL-HTML | COVERED |
| BR-07 | REF/PID      | D-SEO-01/02              | SOL-AFF · SOL-INDEX              | COVERED |
| BR-08 | BR-08.*      | §6                       | SOL-TMPL · SOL-AUTO              | COVERED |
| BR-09 | BR-09.1…09.2 | §6                       | SOL-TMPL                         | COVERED |
| BR-10 | BR-10.1      | §9                       | SOL-TMPL                         | COVERED |
| BR-10 | BR-10.2      | **D-SEO-11**             | SOL-CONFLICT · SOL-HEALTH        | COVERED |
| BR-11 | BR-11.1…11.2 | §8                       | SOL-CANON                        | COVERED |
| BR-12 | BR-12.1…12.3 | D-SEO-01/02              | SOL-CANON · SOL-INDEX · SOL-AFF  | COVERED |
| BR-13 | BR-13.1      | D-SEO-06                 | SOL-INDEX · SOL-HTTP             | COVERED |
| BR-14 | BR-14.1      | D-SEO-06                 | SOL-SITEMAP                      | COVERED |

---

## 42.2 BR-15 … BR-37

| BR    | Req          | SoT                      | Solution                                  | Status  |
| ----- | ------------ | ------------------------ | ----------------------------------------- | ------- |
| BR-15 | BR-15.1      | §11                      | SOL-OG                                    | COVERED |
| BR-16 | BR-16.1      | §11                      | SOL-OG                                    | COVERED |
| BR-17 | BR-17.1      | §12                      | SOL-IMG                                   | COVERED |
| BR-18 | BR-18.1      | §23                      | SOL-IMG                                   | COVERED |
| BR-19 | BR-19.1      | §7                       | SOL-AUTO                                  | COVERED |
| BR-20 | BR-20.1      | §6                       | SOL-AUTO · SOL-TMPL                       | COVERED |
| BR-21 | BR-21.1      | §14                      | SOL-SD                                    | COVERED |
| BR-22 | BR-22.1      | §15                      | SOL-BC                                    | COVERED |
| BR-23 | BR-23.1      | §22                      | SOL-LINK                                  | COVERED |
| BR-24 | BR-24.1      | D-SEO-10                 | SOL-URL                                   | COVERED |
| BR-25 | BR-25.1      | §21                      | SOL-REDIR                                 | COVERED |
| BR-26 | BR-26.1      | §18                      | SOL-CANON · SOL-INDEX · SOL-TMPL          | COVERED |
| BR-27 | BR-27.1      | §1.1.2/24                | SOL-URL · locale readiness                | COVERED |
| BR-28 | BR-28.1      | §30                      | SOL-PREV                                  | COVERED |
| BR-29 | BR-29.1      | §31                      | SOL-HEALTH                                | COVERED |
| BR-29 | BR-29.2      | **D-SEO-11**             | SOL-CONFLICT · SOL-HEALTH                 | COVERED |
| BR-29 | BR-29.3      | SoT **§0.1.1 · §25.1**   | SOL-SINGLETON                             | COVERED |
| BR-30 | BR-30.1      | §28                      | SOL-VERSION                               | COVERED |
| BR-31 | BR-31.1      | §27                      | SOL-VERSION · SOL-OBS                     | COVERED |
| BR-32 | BR-32.1      | §32 · **090826**         | SOL-CMS (consume Foundation)              | COVERED |
| BR-33 | BR-33.1      | §29                      | SOL-RBAC                                  | COVERED |
| BR-34 | BR-34.1…34.3 | D-SEO-03                 | SOL-CONTRACT · SOL-HTML                   | COVERED |
| BR-34 | BR-34.4      | SoT **§0.1.1 · §25.1**   | SOL-SINGLETON                             | COVERED |
| BR-35 | BR-35.1      | D-SEO-05                 | SOL-HTML                                  | COVERED |
| BR-36 | BR-36.1      | §35                      | SOL-IDENT · SOL-HTML · SOL-OBS            | COVERED |
| BR-37 | BR-37.1      | D-SEO-04                 | SOL-AUTO · SOL-OVERRIDE                   | COVERED |

---

## 42.3 BR-45 … BR-48

| BR    | Req          | SoT                 | Solution                                     | Status          |
| ----- | ------------ | ------------------- | -------------------------------------------- | --------------- |
| BR-45 | BR-45.0…45.2 | D-SEO-01            | SOL-INDEX · SOL-CANON · SOL-AFF              | COVERED         |
| BR-45 | BR-45.3      | D-SEO-01 + **D-SEO-09** | SOL-INDEX §7                                 | COVERED · principle LOCKED · Plan signals |
| BR-45 | BR-45.4      | §2.2                | SOL-AFF                                      | COVERED         |
| BR-45 | BR-45.5      | §2.3                | SOL-CANON · SOL-CONTRACT                     | COVERED         |
| BR-45 | BR-45.6      | Audit matrix        | SOL-INDEX · SOL-AFF                          | COVERED         |
| BR-45 | BR-45.7      | D-SEO-02            | SOL-AFF                                      | COVERED         |
| BR-46 | BR-46.1      | §43                 | SOL-AFF                                      | COVERED         |
| BR-47 | BR-47.1      | D-SEO-08            | SOL-REUSE                                    | COVERED         |
| BR-48 | BR-48.*      | NFR                 | SOL-OBS · SOL-CACHE · SOL-FAIL · SOL-VERSION | COVERED         |

---

# 43. New Audit C / SoT Delta Coverage

The Solution MUST explicitly absorb the newly locked SoT deltas.

| New Governance Requirement          | SoT Authority         | Solution                |
| ----------------------------------- | --------------------- | ----------------------- |
| HTTP Status in Contract             | SoT **§3 · §3.1**     | SOL-HTTP · SOL-CONTRACT |
| `200` normal SEO semantics          | SoT HTTP Contract     | §9.1                    |
| `301/302` redirect semantics        | SoT HTTP Contract     | §9.2–9.3                |
| `404/410` non-indexability          | SoT HTTP Contract     | §9.4–9.5                |
| Other non-success HTTP              | Solution §9.6         | SOL-HTTP                |
| HTTP ↔ SEO coherence                | **D-SEO-11**          | SOL-CONFLICT · §10      |
| Canonical/robots/sitemap conflict   | **D-SEO-11**          | §10 · §34               |
| OG URL / SD identity coherence      | **D-SEO-11**          | §10.2                   |
| One authoritative metadata instance | SoT **§0.1.1 · §25.1** | SOL-SINGLETON · §11    |
| Duplicate metadata = Contract Violation | Singleton/Health  | §11.4 · §34             |
| Foundation consume (no second owner)| **090826**            | §28 · §40.1 · SOL-CMS   |
| BR-06.3 / 06.4                      | Checklist → **D-SEO-11** | §42                  |
| BR-10.2                             | Checklist → **D-SEO-11** | §42                  |
| BR-29.2 / 29.3                      | Checklist             | §42                     |
| BR-34.4                             | Checklist → §0.1.1    | §42                     |
| SC-30…32                            | Verification          | §44                     |

---

# 44. Solution Verification Checklist

The Solution is not considered complete merely because components exist.

## SC-30 — HTTP Status Coherence

Verify:

```text
200 → valid SEO evaluation
301/302 → redirect semantics
404/410 → non-indexable
```

and no contradictory sitemap/canonical/index state.

**Status:** COVERED at Solution level; Plan must provide evidence.

---

## SC-31 — Conflict Resolution

Verify:

```text
HTTP
redirect
Index Universe
canonical
robots
sitemap
OG
SD
```

cannot produce contradictory authoritative identities.

**Status:** COVERED at Solution level; Plan must provide test matrix.

---

## SC-32 — Singleton Metadata

Verify that one rendered document cannot contain multiple competing authoritative instances of:

```text
title
description
canonical
robots
og:url
og:title
og:description
twitter metadata
```

Duplicate authoritative instances MUST be detectable as Health ERROR.

**Status:** COVERED at Solution level; Plan must provide runtime/render evidence.

---

# 45. D-SEO Decision Coverage

| Decision                          | Authority        | Solution     | Mechanism                          |
| --------------------------------- | ---------------- | ------------ | ---------------------------------- |
| D-SEO-01 Index Universe           | LOCKED           | SOL-INDEX    | Policy LOCKED                      |
| D-SEO-02 Affiliate no-refactor    | LOCKED           | SOL-AFF      | LOCKED                             |
| D-SEO-03 One Contract             | LOCKED           | SOL-CONTRACT | LOCKED                             |
| D-SEO-04 Automatic default        | LOCKED           | SOL-AUTO     | LOCKED                             |
| D-SEO-05 First HTML               | LOCKED           | SOL-HTML     | LOCKED                             |
| D-SEO-06 Sitemap/robots coherence | LOCKED           | SOL-SITEMAP  | LOCKED                             |
| D-SEO-07 Identity/favicon         | LOCKED           | SOL-IDENT    | LOCKED                             |
| D-SEO-08 Reuse before replace     | LOCKED           | SOL-REUSE    | LOCKED                             |
| D-SEO-09 Index Boundary mechanism | 🔒 OWNER LOCKED (principle) | SOL-INDEX §7 | Layered enforcement · signals → Plan |
| D-SEO-10 Vietnamese-first URLs    | LOCKED           | SOL-URL      | LOCKED                             |
| D-SEO-11 Conflict Resolution      | SoT LOCKED       | SOL-CONFLICT | Policy LOCKED; implementation Plan |

**D-SEO-09 note:** Solution locks the **mechanism principle** (layered Index Boundary Enforcement + seven invariants). It does **not** lock `meta noindex` vs `X-Robots-Tag` vs edge placement — that is Plan.

The Solution does not create a new SEO policy under D-SEO-11. It implements the already locked deterministic conflict-resolution authority.

---

# 46. Non-Goals

This Solution does NOT authorize:

* Affiliate/Public Identity redesign
* referral transport changes
* `publicId` changes
* changing `/co-phieu` to `/stocks`
* silent URL migration
* automatic English route generation
* IA redesign
* content rewriting
* keyword stuffing
* fake structured data
* SEO pages created only to increase URL count
* indexing private/user-specific pages
* replacing existing components without reuse audit
* changing locked SoT policy for implementation convenience

---

# 47. Ownership Target

The final ownership model is:

```text
SEO Configuration
       ↓
SEO Context / URL classification
       ↓
SEO Policy + Conflict Resolver
       ↓
SEO Metadata Resolver
       ↓
SEO Contract
       ↓
ONE authoritative Head Renderer
       ├── First HTML
       ├── Human runtime
       ├── Social
       ├── Structured Data
       └── SEO Preview

SEO Contract
       ↓
Sitemap Eligibility
       ↓
Sitemap Generator

SEO Contract
       ↓
SEO Health / Observability
```

No competing SEO owner should remain in:

```text
feature modules
SPA page builders
Nginx-specific metadata builders
share widgets
page manifests
article-specific head builders
```

unless explicitly designated as an adapter consuming the Contract.

---

# 48. Failure / Fallback Strategy

The SEO platform MUST fail safely.

Principles:

```text
No crash
No accidental indexing
No second SEO identity
No attribution loss
No silent conflict
```

When data is incomplete:

```text
specific source
 ↓
approved fallback
 ↓
global default
```

When SEO identity cannot safely be established:

```text
do not invent identity
+
safe non-indexable behavior where applicable
+
Health ERROR
+
observability record
```

Affiliate attribution must remain intact independently of SEO fallback.

---

# 49. Implementation Boundary

The implementation sequence is:

```text
BRD LOCKED (rev.C)
      ↓
Audit APPROVED (rev.C)
      ↓
SoT LOCKED (rev. **B.2**)
      ↓
Solution D.1.1 · 🔒 OWNER LOCKED (2026-08-09)
      ↓
Plan OPEN
      ↓
Plan APPROVED / LOCK
      ↓
Implementation AUTHORIZED
```

Until Plan is Owner LOCKED / Implementation authorized:

```text
Implementation = NOT AUTHORIZED without Plan gate
```

D-SEO-09 **principle** is LOCKED in Solution; **signal implementation detail** is decided in Plan and executed in Implementation.

---

# 50. Solution-Level Definition of Done

The Solution is complete when it demonstrates:

### Architecture

* [x] One SEO Contract
* [x] One authoritative metadata ownership path
* [x] Singleton metadata emission (= Contract Violation if duplicated)
* [x] Automatic-by-default resolution
* [x] Controlled manual overrides
* [x] First-HTML path
* [x] Sitemap from eligibility
* [x] Consume Foundation `090826` (no second Admin SEO authority)

### SEO Identity

* [x] Clean Public canonical
* [x] Vietnamese-first URL taxonomy preserved
* [x] `/co-phieu/{ticker}` preserved
* [x] Affiliate/Public Identity remains attribution-only
* [x] Decorated URLs excluded from SEO identity (**D-SEO-09 principle LOCKED**)
* [ ] D-SEO-09 **signal placement** (HTML / `X-Robots-Tag` / edge) — **Plan only** · not claimed complete here
* [x] No implicit URL migration
* [x] Internal SEO targets = Clean Public (SOL-LINK)

### Governance

* [x] BRD traceability (incl. BR-06.3/4 · BR-10.2 → D-SEO-11)
* [x] Audit V1–V15 traceability
* [x] SoT **B.2** traceability (§0.1.1 · §3.1 · D-SEO-11)
* [x] D-SEO-01…11 coverage (D-SEO-09 = principle; signals → Plan)
* [x] SC-30…32 coverage

### HTTP / Conflict

* [x] HTTP status part of Contract
* [x] 200 semantics
* [x] 301/302 semantics
* [x] 404/410 semantics
* [x] Other non-success HTTP default non-index (§9.6)
* [x] HTTP ↔ canonical coherence
* [x] HTTP ↔ robots coherence
* [x] HTTP ↔ sitemap coherence
* [x] deterministic conflict resolution (D-SEO-11)
* [x] OG/SD identity coherence
* [x] Health conflict matrix (§34)

### Operations

* [x] SEO Health
* [x] duplicate metadata detection (Contract Violation)
* [x] source traceability
* [x] versioning — **consume/extend** Foundation/existing; gap → Plan
* [x] rollback — same consume/extend rule
* [x] RBAC — **consume/extend** Admin/Foundation boundary; no duplicate matrix
* [x] cache/invalidation
* [x] observability
* [x] verification support

### Reuse

* [x] Existing SEO components identified
* [x] Foundation `090826` identified as consume boundary
* [x] Existing Affiliate/Public Identity components preserved
* [x] Reuse-before-replace enforced
* [x] Competing ownership prohibited

---

# 51. Final Architectural Invariant

The platform MUST enforce the following invariant:

```text
ONE PUBLIC SEO RESOURCE
        ↓
ONE SEO IDENTITY
        ↓
ONE CLEAN CANONICAL
        ↓
ONE SEO CONTRACT
        ↓
ONE AUTHORITATIVE METADATA EMISSION
        ↓
COHERENT HTTP / ROBOTS / SITEMAP / OG / SD
```

For Affiliate/Public Identity:

```text
PUBLIC IDENTITY URL
        ↓
ATTRIBUTION
        ↓
CLEAN PUBLIC RESOURCE
        ↓
SAME SEO IDENTITY
```

Never:

```text
PUBLIC IDENTITY URL
        ↓
SECOND SEO ENTITY
```

For HTTP:

```text
HTTP
 ↓
SEO State
 ↓
Canonical
 ↓
Robots
 ↓
Sitemap
 ↓
OG / SD
```

must remain coherent.

For metadata:

```text
SEO Contract
     ↓
ONE authoritative head emission
```

must remain the only ownership path.

---

# 52. Final Governance Statement

> **SEO Policy = Governing SoT**

> **Audit = evidence of current gaps and constraints**

> **Solution = HOW the locked policy becomes one coherent platform**

> **Plan = executable implementation sequence**

> **Implementation = only after all previous gates are LOCKED**

The Solution MUST NOT solve SEO by adding more independent metadata builders.

It solves the problem by establishing:

```text
Existing URL / Identity Authority
              ↓
      SEO Policy Resolution
              ↓
    Deterministic Conflict Layer
              ↓
       SEO Metadata Resolver
              ↓
        ONE SEO Contract
              ↓
       ONE Metadata Owner
              ↓
 ┌────────────┼────────────┐
 ▼            ▼            ▼
HTML        Social      Sitemap
 ▼            ▼            ▼
Search      Sharing    Discovery
```

**Final principle:**

> Every eligible public URL has exactly one SEO identity, one canonical Clean Public URL, one governed metadata Contract, one authoritative rendered metadata instance, and one coherent HTTP/SEO state.

> Affiliate/Public Identity may attribute traffic, but MUST NOT create a second SEO identity.

> HTTP status, canonical, robots, sitemap, OG, and structured data MUST describe the same resolved SEO state.

> Vietnamese-first public URL taxonomy is consumed from existing route authority; the SEO platform does not redesign URL architecture.

> Foundation (`090826`) owns Global/Page/asset/public metadata configuration; SEO Platform **consumes** it — never recreates a second owner.

---

# Appendix D.1.2 — Owner Final Decision mechanisms (SoT B.3)

> Policy authority = SoT B.3. This appendix binds **HOW** without inventing architecture outside BRD/SoT/Audit `13`.

## A. Homepage `/` (D-SEO-12)

| Concern | Mechanism |
|---------|-----------|
| pageKey | `PATH_TO_PAGE_KEY['/'] = community` |
| Public entry | `/` serves Community SPA / Community crawler shell |
| Clean SEO identity | `/cong-dong` |
| Canonical · og:url · SD url | Absolute Clean URL `https://{origin}/cong-dong` for both `/` and `/cong-dong` shells |
| Sitemap | Emit `/cong-dong` once for this identity |
| Anti-duplicate | MUST NOT emit a second independent Clean SEO identity for `/` |

MUST NOT invent new redirect chains beyond existing governed behavior required for one identity.

## B. SOL-AUTO / SOL-TMPL (rule-driven)

```text
Admin-defined template/rule (Foundation page/global config)
  → Entity variables
  → Deterministic resolver
  → Generated metadata
  → Optional override (SOL-OVERRIDE where allowed)
```

MUST NOT AI-generate SEO formats. Stock/Sector/Ecosystem/Story: one template per type. Other hubs: keep Admin config (no auto-expand).

## C. Article SEO Description (KEEP)

```text
editorial seo.description (if present AND ≠ blank/default excerpt rule)
  → else Article excerpt / description
  → else governed fallback chain
```

Intentional override. No refactor this turn. OG/Social: consume existing cover/`seo.og_image` chain if already matching Owner rule; no duplicate resolver.

## D. Entity OG / Social once-per-type

Consume Foundation PAGE (entity-type pageKey) / GLOBAL OG+social inherit. If page-level empty → GLOBAL. MUST NOT require per-entity social config for Stock/Sector/Eco/Story.

## E. Favicon global-only (SOL-IDENT)

Public favicon = Foundation **GLOBAL** only. Page `faviconUrl` MUST NOT override after authorized cleanup. UI page field already removed; API/store/resolver residual = Plan cleanup task (Owner GO).

## F. former_slugs + 301 (SOL-CANON / SOL-REDIR) — official mechanism

```text
On Article slug change:
  1. Append previous slug to payload.former_slugs (bounded list)
  2. Persist current slug as sole live Clean identity
  3. Public request matching former_slugs → HTTP 301 → current /cong-dong/bai-viet/{currentSlug}
  4. Unknown slug → 404
  5. Canonical on live article = current Clean URL only
```

Lookup: article store query `former_slugs ? $slug`. Emit: spa / open-graph / public article routes. **KEEP existing implementation** after governance absorb. MUST NOT code additional mechanisms beyond amendment scope before Owner GO verify.

## G. Zalo (SOL-HTML) — intent only this turn

Owner A: Zalo = crawler/social-preview. Implementation (later Owner GO): add Zalo UA to **existing** hub `418` → `@seo_shell_*` path; align article First HTML/OG via existing shell/spa+meta architecture; MUST NOT create Zalo-only SEO pipeline; MUST NOT break governed Human/IAB boundaries beyond crawler UA list. Audit `13` documents current exclusion.

## H. SOL-BC Breadcrumb

**Wave C OPENED / SHIPPED 2026-08-11** (Owner “tiếp tục Wave C”).

| | |
|--|--|
| Module | `seo-platform/breadcrumb.js` — one hierarchy |
| Emit | Contract `breadcrumb` + First HTML `BreadcrumbList` JSON-LD (`head-renderer`) |
| Visible | Community SPA nav/LD aligned to same Trang chủ → … Clean URLs |
| Home Clean | `/cong-dong` (D-SEO-12) |

MUST NOT invent Affiliate/PID breadcrumb targets. Singleton redesign still **DEFER**.

## I. Pagination

Audit `13`: **N/A**. No Solution pagination SEO build until Product ships indexable `?page=` identity.

## J. SOL-VERSION

Out of Epic → [`100826_SEO_Metadata_Versioning_Rollback_Foundation`](../100826_SEO_Metadata_Versioning_Rollback_Foundation/00-README.md) **NOTSTART**. Epic documents dependency only.

## K. SOL-IMG — two tracks

| Track | Scope | Next |
|-------|-------|------|
| ALT | Editorial/generated ALT → Contract `imageAlt` → `og:image:alt` | Slice [`16`](16%20-%20Solution%20Slice%20Image%20ALT.md) · GO P4 |
| Social JPEG/PNG | Absolute URL + public JPEG/PNG via media **original** + nginx `^~ /media/` | GO P3 · Evidence `15` |

MUST NOT merge tracks.

## L. Singleton detector vs architecture

KEEP expanded detector as Health/audit. Multi-pipeline singleton consistency (Human/Google/FB/Zalo/First HTML/SPA/OG/fields) remains open — **not PASS** via detector alone.

## M. WATCH / SEARCH

No SOL coverage change — Owner Lock #2.

## N. GSC / SERP

Verification ops after stable impl. Not architecture authority.

---

# Appendix D.1.3 — Owner Clarification · Residual Areas (2026-08-11)

> **Mode:** Governance absorb only. **No Implementation GO** for residual ALT Admin UX / Singleton redesign.  
> Source: Owner Clarification — Final Decision on 4 Residual Areas.

## O. Singleton architecture — DEFER (no GO)

Owner hiểu:

- Googlebot hub First HTML có SEO đầy đủ; Human hub First HTML còn rỗng/JS.
- Article còn khác biệt head vs body rendering.
- Detector expanded ≠ Singleton architecture PASS.

**Decision:** **Chưa xử lý** trong scope hiện tại. Giữ residual FAIL/PARTIAL (BR-34.4 / SC-32 / BR-34.2 / SC-03).

MUST NOT:

- redesign Singleton architecture;
- mở Solution/Plan mới cho Singleton;
- claim BR-34.4 / SC-32 PASS.

Future work requires **Owner GO riêng — Singleton architecture**.

## P. Image ALT policy — LOCKED (implementation residual = no GO yet)

### P.1 Distinctions

```text
og:image:alt     → P4 slice PASS (Evidence 15 · Slice 16)
<img alt="...">  → broader HTML image ALT — not claimed done by P4
```

MUST NOT claim P4 = full BR-18.1. MUST NOT invent complex ALT CMS. MUST **reuse/consume** existing `cover.alt`.

### P.2 OG Image ALT (Admin SEO tools)

Where Admin configures OG Image (hệ thống / từng trang / entity-type surfaces that own OG image), Solution SHALL support optional field:

```text
OG Image ALT
```

- **Optional override** — not required.
- If system already resolved a value → **display** it.
- If none → leave empty for Admin optional input.
- Applies to Story, Article, Community/Hub, Sector, Ecosystem, and other pages/entities with governed OG image.

### P.3 Article cover

`cover.alt` exists. Admin MAY enter ALT for cover. **MUST NOT require** Admin to enter ALT. Missing → deterministic fallback.

### P.4 Deterministic resolution (no AI · no invent)

```text
SEO OG Image ALT override
  → existing cover.alt / image ALT
  → entity / page / article title
  → next valid fallback from existing data
  → empty
```

**Có thì dùng. Không có thì fallback. Không còn nguồn hợp lệ → empty (accepted).**

Override when Title/auto ALT insufficient for the image (example: chart description vs title). If Title fallback enough → Admin enters nothing.

### P.5 Implementation status

Policy **LOCKED**. Admin “OG Image ALT” optional field + display of resolved value = **DONE** Owner GO 2026-08-11 (Production). Slice `16` updated. Full BR-18.1 HTML `<img alt>` CMS still out of scope. Singleton still **DEFER**.

## Q. Breadcrumb · Versioning

| Item | Decision |
|------|----------|
| BR-22.1 / SC-09 Breadcrumb | **Wave C DONE** 2026-08-11 — Contract + JSON-LD + SPA align |
| BR-30.1 / SC-17 / SC-18 / BR-48.ROLL | **NOTSTART** — Foundation backlog; not a new bug of current impl |

## R. BR-01.3 Automatic-by-Default — Owner PASS

Owner: AUTO mechanism **đã tồn tại** (Admin rule/template → deterministic resolver → metadata). Không hiểu BR-01.3 là “chưa có automatic SEO”.

Manual = **override/exception**, not default operation.

**Governance verdict:** **BR-01.3 = PASS** (Owner lock 2026-08-11).

MUST NOT open further “UX proof / E2E audit” scope to re-litigate this PASS. ALT empty/fallback policy above is part of the same rule-driven model — not a BR-01.3 reopen.

---

**End of Solution Design — Rev. D.1.2 + Appendix D.1.3 (2026-08-11) · Implementation residual ALT Admin = no GO · Singleton = DEFER**
