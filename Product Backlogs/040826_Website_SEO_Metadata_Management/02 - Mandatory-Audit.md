CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# 02 — Mandatory Audit

# Website SEO Metadata Management & SEO Platform

| | |
|--|--|
| **Task ID** | `040826_Website_SEO_Metadata_Management` |
| **BRD** | [`01 - Business Requirement.md`](01%20-%20Business%20Requirement.md) · **§0 BR Checklist Registry** · §41 / §42 / §45 |
| **Document** | Mandatory Audit — sinh từ **BR Checklist** (Governance §2.1 / §2.3) |
| **Date** | 2026-08-09 |
| **Rev** | **C** — Delta BRD amendment: HTTP Status (§10.1) · Conflict Resolution (§14.1) · Singleton metadata (§38.1); giữ nguyên BR-45 Policy vs Mechanism |
| **Evidence** | Repo `User_Web/` · `backend/` · `infra/nginx-iflux-production-locations.conf` · Production `https://iflux.vn` (curl) · Foundation `090826` (capability adjacent — không PASS epic SEO) |
| **Audit status** | 🔒 **OWNER LOCKED** · ✅ **APPROVED** · rev. **C** · Implementation **NOT AUTHORIZED** |
| **Epic status** | BRD + Audit **LOCKED** · SoT / Solution = **Owner đang kiểm tra** (chưa absorb BRD C) · Plan **NOT OPEN** |
| **Next gate** | Owner kiểm tra / absorb SoT + Solution → Owner LOCK Solution (kèm D-SEO-09) → Plan |

> Audit trả lời: **hiện trạng đối với từng BR / Req ID là gì?**  
> Audit **không** thay đổi requirement BRD và **không** khóa Solution / Plan / Implementation.  
> Form: [`Product Backlogs Governance.md`](../Product%20Backlogs%20Governance.md) **§2.3**.


### Changelog rev. B → rev. C (BRD amendment absorb)

| Thay đổi | Chi tiết |
|----------|----------|
| BR-06.3 / 06.4 · AUD-06.3 / 06.4 | HTTP Status thuộc SEO Contract; HTTP ↔ robots ↔ canonical ↔ sitemap phải coherent |
| BR-10.2 · AUD-10.2 | Conflict-resolution deterministic giữa SEO signals |
| BR-29.2 / 29.3 · AUD-29.2 / 29.3 | Health ERROR cho signal conflict + duplicate singleton tags |
| BR-34.4 · AUD-34.4 | Singleton metadata trên mỗi rendered document |
| SC-30…32 | Verification index bổ sung |
| Verdict | **Không đổi root cause** (thiếu SEO Platform); thêm gap V13–V15 |

### Changelog rev. A → rev. B (BR-45 focus)

| Thay đổi | Chi tiết |
|----------|----------|
| V9 / AUD-45.3 / SC-23 | **Không** đồng nhất máy móc `NOT SEO` = `meta robots noindex` |
| Policy | Affiliate/Public Identity URL **MUST NOT** là indexable SEO identity → phải nằm **ngoài SEO Index Universe** |
| Mechanism | noindex / canonical-only / robots.txt / sitemap exclusion / rendering policy = **SoT/Solution** sau APPROVE — Audit **không khóa** |
| Severity BR-45.3 | Từ “Critical runtime thiếu noindex” → **Missing SEO Index Universe policy** (SoT input); **không** là root cause SEO; Affiliate runtime **không** FAIL attribution |
| Root cause | Giữ: thiếu SEO Platform / SEO Contract SoT + ownership phân tán |

---

## 0. Executive Verdict

| # | Finding | Severity | BR / AUD |
|---|---------|----------|----------|
| V1 | **Không có Website SEO Platform / CMS SoT** — chỉ có SEO fields rời (article/category Admin) + URL helper `IfluxSeoUrl` | 🔴 Critical | BR-32,34 · AUD-OWN |
| V2 | **List/hub shells** (`/cong-dong`, `/nha-cua-toi`, Market, …): first HTML ≈ **chỉ `<title>`** — thiếu description / canonical / OG / robots / JSON-LD / favicon | 🔴 Critical | BR-06,07,15,20,34,35 · AUD-OWN,REN |
| V3 | **Article** là path chín nhất: backend `resolveArticleMetadata` + nginx Pipeline A (social bots) / B (SPA inject head) | 🟠 High | BR-08.ARTICLE,15,35 · AUD-REN |
| V4 | **`robots.txt` live trên Prod** nhưng **không version trong repo**; khai báo `Sitemap: https://iflux.vn/sitemap.xml` | 🟠 High | BR-13,14 · AUD-OWN |
| V5 | **`GET /sitemap.xml` → 404** (Express JSON) — **không** có generator trong repo | 🔴 Critical | BR-14 · AUD-OWN |
| V6 | **`favicon.ico` → 404**; User_Web shells **không** có `<link rel="icon">`; Brand Admin có field nhưng **không** wire public head | 🔴 Critical | BR-05 · AUD-OWN |
| V7 | Metadata ownership **phân tán**: static HTML title · page manifests `documentTitle` · `page-definition.js` · `community-ui.js` / `seo-url.js` · backend articles · nginx | 🔴 Critical | BR-34 · AUD-OWN |
| V8 | Affiliate runtime: **publicId path** `/IFL…/` decorate + nginx internal rewrite; **canonical/og:url article giữ Clean URL** — attribution hoạt động; **không** tạo SEO identity riêng cho publicId trên article path | 🟢 Evidence OK (boundary hướng đúng cục bộ) | BR-45.1,45.4,45.5 · AUD-45 |
| V9 | **Chưa có SEO Index Universe policy** rõ ràng cho Affiliate/Public Identity URL variants (Clean = SEO Universe; decorated = Attribution Universe). Cơ chế kỹ thuật **chưa** được Audit khóa | 🟠 High — **missing SEO policy** (SoT input), **không** = Affiliate runtime broken | BR-45.0,45.2,45.3 · AUD-45 |
| V10 | `?ref=` / `?r=` bị **strip** ở share normalize; decorator chính Prod = **path publicId** | 🟠 High (quan sát ownership Share/Affiliate — không kết luận refactor) | BR-12.2,45.2 · AUD-45 |
| V11 | Google SERP symptom (BRD §3): title/snippet/favicon lệch — **chưa** có Search Console dump; SERP matrix = **PARTIAL** | 🟠 High | BR-36 · AUD-SERP |
| V12 | Automatic vs Manual: **chưa** có platform classification SoT — hiện trạng ad-hoc | 🔴 Critical | BR-02 · AUD-MATRIX |
| V13 | **HTTP Status không nằm trong SEO Contract** — nginx/status tách khỏi robots/canonical/sitemap; rủi ro incoherent URL policy (BRD §10.1) | 🔴 Critical | BR-06.3,06.4 · AUD-06 |
| V14 | **Không có conflict-resolution deterministic** giữa HTTP / redirect / canonical / robots / sitemap / OG·SD URL | 🔴 Critical | BR-10.2 · AUD-10 |
| V15 | **Singleton SEO tags không enforced** — đa pipeline (HTML/JS/SPA/Node/nginx) có thể duplicate `<title>` / description / canonical | 🟠 High | BR-34.4 · AUD-34 |

### Root Cause (hiện trạng) — KHÓA cho Epic SEO

```text
ROOT CAUSE (SEO problems hiện tại)
─────────────────────────────────
Không có SEO Platform / SEO Contract SoT toàn website
        ↓
Metadata ownership phân tán (HTML · manifest · JS · backend article · nginx)
        ↓
List/hub: crawler first HTML ≈ title-only
Article: head inject ad-hoc (chưa phải platform)
        ↓
robots.txt trỏ sitemap chết; favicon 404
        ↓
→ SERP / identity / consistency gaps (BRD §3)

KHÔNG phải root cause
─────────────────────────────────
Affiliate / Public Identity runtime
  · Attribution vẫn resolve / decorate / rewrite nội bộ
  · Trên article: canonical & og:url → Clean Public URL
  · Không evidence tạo sitemap URL có publicId
  · Không evidence tạo OG / structured-data identity riêng theo publicId
```

### Universe model (BR-45) — Audit xác nhận

```text
Clean Public URL
→ SEO Universe
→ Canonical / Sitemap / Index eligibility / OG URL / Structured Data / Internal SEO target

PublicId / Affiliate URL  ( /{publicId}/... · ?ref= · ?r= · decorator khác )
→ Attribution Universe
→ NOT SEO Universe
→ vẫn resolve attribution / Public Identity / navigation bình thường
→ MUST NOT được treat như indexable SEO identity
```

**Policy requirement (Audit khóa nhận thức — không khóa cơ chế):**

> Affiliate/Public Identity URLs MUST NOT be treated as indexable SEO identities.  
> Chúng phải nằm **ngoài SEO Index Universe**.

**Implementation mechanism (Audit KHÔNG khóa — SoT/Solution sau APPROVE):**

> noindex meta · canonical-only pointing to Clean · robots.txt rules · sitemap exclusion · crawler rendering policy · hoặc tổ hợp tương đương đã chứng minh.

Audit **cấm** suy diễn: thiếu `meta robots noindex` trên decorated URL = FAIL Affiliate runtime hoặc bắt buộc cơ chế noindex ngay.

---

## 1. Evidence packs (§41) — shared

### 1.1 AUD-OWN — Metadata ownership

| Field | Status | Owner hiện tại | Evidence |
|-------|--------|----------------|----------|
| `<title>` | FOUND (dispersed) | Static HTML shells; `IfluxPageDefinition` ← manifests `documentTitle`; articles ← backend | `User_Web/community/index.html`; `User_Web/iflux-web-ui/runtime/page-definition.js`; `backend/src/modules/community/community-articles.service.js` |
| Meta description | PARTIAL | Share/write static; page-definition META; article backend | List `/cong-dong` first HTML: **không có** |
| `og:*` | PARTIAL | Article backend; `community-ui.js` / `seo-url.js`; share HTML | Cùng |
| `twitter:*` | PARTIAL | Same as OG | Cùng |
| Canonical | PARTIAL | Article backend Clean URL; `setCanonical` in page-definition / seo-url | Article: `https://iflux.vn/cong-dong/bai-viet/{slug}` |
| Robots meta | PARTIAL | Một số manifests `noindex,follow`; list shells không có | `pages/{account,checkout,comments,community-write,share,stock-comment}.manifest.js` |
| JSON-LD | PARTIAL | Client-only post (`community-ui.js` / seo-url); backend head **không** ld+json | |
| Favicon | NOT_FOUND (public) | Brand Admin field only | Prod `favicon.ico` **404**; 0 `rel=icon` User_Web shells |
| Sitemap | NOT_FOUND | Claimed in robots.txt | Prod `/sitemap.xml` **404**; no generator in `backend/src` |
| robots.txt | FOUND (prod) | Live CF+custom; **not in git** | `curl https://iflux.vn/robots.txt` |

### 1.2 AUD-REN — Rendering

| Mode | Status | Evidence |
|------|--------|----------|
| HTML shell + JS | FOUND | Default User Web rewrite → App Shell + bootstrap |
| Article Pipeline A (social bots / `?og=1`) | FOUND | `infra/nginx-iflux-production-locations.conf` → open-graph route |
| Article Pipeline B (human / Googlebot SPA + injected head) | FOUND | Cùng file → spa + backend head inject |
| Full SSR framework | NOT_FOUND | — |
| List-page crawler prerender | NOT_FOUND | First HTML title-only |

### 1.3 AUD-HC — Hardcode sweep (repo)

| Pattern | Approx count | Note |
|---------|-------------:|------|
| `<title>` User_Web HTML | ~79 | Per-page hardcode |
| Static meta description | ~3 | share, write, backend builder |
| `og:` / `twitter:` cluster | ~8 / ~5 | Not platform SoT |
| `rel=icon` User_Web | 0 | |
| Site verification meta | 0 | |

### 1.4 AUD-CACHE

| Layer | Status | Note |
|-------|--------|------|
| Cloudflare CDN | FOUND | `cf-cache-status` trên responses |
| Browser | N/A | Standard |
| Nginx | FOUND | Affiliate rewrite; article UA split |
| Application HTML | FOUND | Article inject; list static |
| Crawler/Search cache | PARTIAL | Cần Search Console / SERP Owner — chưa dump |

---

## 2. Audit Checklist — sinh từ BR Checklist (§0 BRD)

Status: `PASS` | `FAIL` | `PARTIAL` | `NOT_FOUND` | `N/A`

### 2.1 BR-01 … BR-06

| BR | Req ID | BR Requirement (short) | Audit ID | Audit Check | Evidence | Status |
|----|--------|------------------------|----------|-------------|----------|--------|
| BR-01 | BR-01.1 | Automatic by Default | AUD-01.1 | Có platform auto-resolution SEO? | Không SEO platform; article resolve ad-hoc | **FAIL** |
| BR-01 | BR-01.2 | Deterministic auto-sinh | AUD-01.2 | Auto từ Site/Page/Entity…? | Chỉ article gần; shells hardcode title | **FAIL** |
| BR-01 | BR-01.3 | Không bắt nhập vì thiếu auto | AUD-01.3 | Editor có bị bắt nhập SEO? | Article optional SEO fields; không platform default | **PARTIAL** |
| BR-01 | BR-01.4 | Manual chỉ exception | AUD-01.4 | Manual gated? | Không governance override platform | **FAIL** |
| BR-02 | BR-02.A | Class Fully Automatic | AUD-02.A | Classification SoT tồn tại? | Không matrix chính thức | **NOT_FOUND** |
| BR-02 | BR-02.B | Class Auto+Override | AUD-02.B | Idem | Article fields ad-hoc | **PARTIAL** |
| BR-02 | BR-02.C | Class Manual | AUD-02.C | Idem | ALT/campaign không governance SEO platform | **NOT_FOUND** |
| BR-02 | BR-02.D | Class System Only | AUD-02.D | Engines riêng? | Không canonical/sitemap engines platform | **NOT_FOUND** |
| BR-03 | BR-03.1 | Global Website SEO tập trung | AUD-03.1 | Global SEO config SoT? | Brand identity partial; không Website SEO SoT | **FAIL** |
| BR-03 | BR-03.2 | Phân biệt Brand/Site/Home/Org/Domain | AUD-03.2 | Fields tách? | UI brand một phần; không SEO contract | **PARTIAL** |
| BR-04 | BR-04.1 | Website Identity SoT | AUD-04.1 | Identity SoT? | Brand Admin partial | **PARTIAL** |
| BR-04 | BR-04.2 | Machine-readable identity | AUD-04.2 | Org JSON-LD / verification? | Không verification; JSON-LD list thiếu | **FAIL** |
| BR-05 | BR-05.1 | Favicon coverage | AUD-05.1 | Public favicon OK? | Prod 404; no link rel=icon | **FAIL** |
| BR-05 | BR-05.2 | SERP icon chain audit | AUD-05.2 | Declared→SERP? | Declared missing → SERP icon lệch (BRD §3) | **FAIL** |
| BR-06 | BR-06.1 | SEO Contract mọi public URL (gồm HTTP Status) | AUD-06.1 | Contract resolver? | Không platform contract; article gần contract ad-hoc; HTTP status ngoài contract | **FAIL** |
| BR-06 | BR-06.2 | Không page thiếu/mâu thuẫn ownership | AUD-06.2 | List title-only; dispersed owners | §1.1 AUD-OWN | **FAIL** |
| BR-06 | BR-06.3 | HTTP Status trong Contract; coherent URL policy | AUD-06.3 | HTTP + robots + canonical + sitemap cùng model? | Status = nginx/app ad-hoc; không thuộc SEO Contract | **FAIL** |
| BR-06 | BR-06.4 | HTTP↔SEO coherence (200/301·302/404/410) | AUD-06.4 | Invalid combos prevented? | Không gate; 404 page có thể vẫn có title indexable-looking | **FAIL** |

### 2.2 BR-07 Coverage

| BR | Req ID | Surface | Audit ID | First-HTML SEO Contract? | Status |
|----|--------|---------|----------|--------------------------|--------|
| BR-07 | BR-07.HOME | `/` → `/nha-cua-toi` | AUD-07.HOME | Title only | **FAIL** |
| BR-07 | BR-07.STATIC | FAQ, pricing, … | AUD-07.STATIC | Title / manifest JS | **FAIL** |
| BR-07 | BR-07.COM | `/cong-dong` | AUD-07.COM | Title only (curl 2026-08-09) | **FAIL** |
| BR-07 | BR-07.ARTICLE | `/cong-dong/bai-viet/…` | AUD-07.ARTICLE | Backend inject title/desc/canonical/og/twitter | **PARTIAL** |
| BR-07 | BR-07.MARKET | `/thi-truong` | AUD-07.MARKET | Shell title / JS | **FAIL** |
| BR-07 | BR-07.FLOW | Money Flow | AUD-07.FLOW | Shell title / JS | **FAIL** |
| BR-07 | BR-07.MEMBER | Membership/loyalty | AUD-07.MEMBER | Shell | **FAIL** |
| BR-07 | BR-07.FAQ | FAQ | AUD-07.FAQ | Shell | **FAIL** |
| BR-07 | BR-07.WATCH | Watchlist | AUD-07.WATCH | Index intent không rõ | **PARTIAL** |
| BR-07 | BR-07.STOCK | Stock entity | AUD-07.STOCK | Shell + IfluxSeoUrl href; limited meta | **FAIL** |
| BR-07 | BR-07.SECTOR | Sector | AUD-07.SECTOR | Idem | **FAIL** |
| BR-07 | BR-07.ECO | Ecosystem | AUD-07.ECO | Idem | **FAIL** |
| BR-07 | BR-07.AUTHOR | Author | AUD-07.AUTHOR | Href helpers; meta incomplete | **FAIL** |
| BR-07 | BR-07.TAG | Tag | AUD-07.TAG | No platform SEO | **NOT_FOUND** |
| BR-07 | BR-07.COLL | Collection | AUD-07.COLL | No platform SEO | **NOT_FOUND** |
| BR-07 | BR-07.SEARCH | Search | AUD-07.SEARCH | Shell | **FAIL** |
| BR-07 | BR-07.PAGE | Pagination | AUD-07.PAGE | No pagination SEO policy engine | **NOT_FOUND** |
| BR-07 | BR-07.FUTURE | Future entity | AUD-07.FUTURE | No contract pattern | **FAIL** |
| BR-07 | BR-07.REDIR | Redirect | AUD-07.REDIR | Nginx `/home`→`/nha-cua-toi`; no SEO redirect CMS | **PARTIAL** |
| BR-07 | BR-07.404 | 404 | AUD-07.404 | No governed SEO 404 contract | **NOT_FOUND** |
| BR-07 | BR-07.410 | 410 | AUD-07.410 | Not evidenced | **NOT_FOUND** |
| BR-07 | BR-07.QUERY | Query URLs | AUD-07.QUERY | No query SEO policy platform | **FAIL** |
| BR-07 | BR-07.REF | Referral URLs | AUD-07.REF | Attribution Universe; Clean canonical trên article; **chưa** có SEO Index Universe exclusion policy (mechanism TBD SoT) | **PARTIAL** |
| BR-07 | BR-07.PID | Public Identity URLs | AUD-07.PID | Attribution hoạt động; Clean canonical article; **chưa** có Index Universe policy platform | **PARTIAL** |

### 2.3 BR-08 … BR-37

| BR | Req ID | Audit ID | Evidence summary | Status |
|----|--------|----------|------------------|--------|
| BR-08 | BR-08.ARTICLE | AUD-08.ART | Backend templates + metadata fields | **PARTIAL** |
| BR-08 | BR-08.STOCK | AUD-08.STK | `IfluxSeoUrl.stockHref`; no full SEO template engine | **FAIL** |
| BR-08 | BR-08.SECTOR | AUD-08.SEC | Href helpers only | **FAIL** |
| BR-08 | BR-08.AUTHOR | AUD-08.AUTH | Href helpers only | **FAIL** |
| BR-08 | BR-08.TMPL | AUD-08.TMPL | No versioned template ownership platform | **FAIL** |
| BR-09 | BR-09.1 | AUD-09.1 | Hardcode titles per HTML/manifest | **FAIL** |
| BR-09 | BR-09.2 | AUD-09.2 | No global template change propagation | **FAIL** |
| BR-10 | BR-10.1 | AUD-10.1 | No Rule Engine; ad-hoc robots in manifests | **FAIL** |
| BR-10 | BR-10.2 | AUD-10.2 | No deterministic conflict-resolution across HTTP/redirect/canonical/robots/sitemap/OG·SD/internal SEO targets | **FAIL** |
| BR-11 | BR-11.1 | AUD-11.1 | Article auto canonical; not all surfaces | **PARTIAL** |
| BR-11 | BR-11.2 | AUD-11.2 | Domain+route policy only on article path | **PARTIAL** |
| BR-12 | BR-12.1 | AUD-12.1 | Partial edge handling (share strip ref); no full policy matrix | **FAIL** |
| BR-12 | BR-12.2 | AUD-12.2 | Article canonical ignores publicId/ref — **đúng hướng Clean = SEO identity** | **PARTIAL** |
| BR-12 | BR-12.3 | AUD-12.3 | Audit không đề xuất / không yêu cầu refactor Affiliate | **PASS** |
| BR-13 | BR-13.1 | AUD-13.1 | robots.txt + some noindex manifests; không rule engine | **PARTIAL** |
| BR-14 | BR-14.1 | AUD-14.1 | sitemap.xml **404**; no generator | **FAIL** |
| BR-15 | BR-15.1 | AUD-15.1 | Article+share OG; list shells thiếu | **PARTIAL** |
| BR-16 | BR-16.1 | AUD-16.1 | Derived with OG on article; incomplete elsewhere | **PARTIAL** |
| BR-17 | BR-17.1 | AUD-17.1 | No platform default OG image SoT | **FAIL** |
| BR-18 | BR-18.1 | AUD-18.1 | No Image SEO platform | **FAIL** |
| BR-19 | BR-19.1 | AUD-19.1 | Article description resolve; not global | **PARTIAL** |
| BR-20 | BR-20.1 | AUD-20.1 | Titles hardcode + article; no auto engine | **PARTIAL** |
| BR-21 | BR-21.1 | AUD-21.1 | Client JSON-LD post only | **PARTIAL** |
| BR-22 | BR-22.1 | AUD-22.1 | Breadcrumb JSON-LD client post; no platform | **PARTIAL** |
| BR-23 | BR-23.1 | AUD-23.1 | Internal links via SeoUrl/Href; not SEO-governed | **PARTIAL** |
| BR-24 | BR-24.1 | AUD-24.1 | Slug on articles; no full URL governance platform | **PARTIAL** |
| BR-25 | BR-25.1 | AUD-25.1 | Nginx redirects ad-hoc; no Redirect CMS SEO | **FAIL** |
| BR-26 | BR-26.1 | AUD-26.1 | No pagination SEO engine | **NOT_FOUND** |
| BR-27 | BR-27.1 | AUD-27.1 | `lang=vi` shells; no hreflang platform | **PARTIAL** |
| BR-28 | BR-28.1 | AUD-28.1 | No SEO Preview product UI | **NOT_FOUND** |
| BR-29 | BR-29.1 | AUD-29.1 | No SEO Health gate | **NOT_FOUND** |
| BR-29 | BR-29.2 | AUD-29.2 | No Health ERROR cho conflicting SEO signals | **NOT_FOUND** |
| BR-29 | BR-29.3 | AUD-29.3 | No Health ERROR cho duplicate singleton tags | **NOT_FOUND** |
| BR-30 | BR-30.1 | AUD-30.1 | No SEO versioning | **NOT_FOUND** |
| BR-31 | BR-31.1 | AUD-31.1 | No source traceability platform | **NOT_FOUND** |
| BR-32 | BR-32.1 | AUD-32.1 | No Website SEO CMS; article/category fields only | **FAIL** |
| BR-33 | BR-33.1 | AUD-33.1 | No SEO-specific RBAC | **NOT_FOUND** |
| BR-34 | BR-34.1 | AUD-34.1 | Multiple owners — không single SoT | **FAIL** |
| BR-34 | BR-34.2 | AUD-34.2 | FE/BE/nginx đều tạo/inject metadata | **FAIL** |
| BR-34 | BR-34.3 | AUD-34.3 | Pipeline A/B article cùng metadata builder cục bộ; list khác | **PARTIAL** |
| BR-34 | BR-34.4 | AUD-34.4 | Singleton fields không enforced trên rendered document (đa pipeline) | **FAIL** |
| BR-35 | BR-35.1 | AUD-35.1 | Article A/B intentional; list no crawler HTML parity | **PARTIAL** |
| BR-36 | BR-36.1 | AUD-36.1 | SERP gap matrix §3 — thiếu GSC | **PARTIAL** |
| BR-37 | BR-37.1 | AUD-37.1 | Publish article SEO-ready partial; not all entities | **FAIL** |

### 2.4 BR-45 Boundary — Policy vs Mechanism

#### 2.4.1 Phân loại khi đọc BR-45.3

| Loại | Nội dung | Ai khóa | Audit làm gì |
|------|----------|---------|--------------|
| **Policy requirement** | Affiliate/Public Identity URLs **MUST NOT** be treated as indexable SEO identities; phải nằm **ngoài SEO Index Universe**; attribution vẫn hoạt động; **không** sitemap / **không** canonical / **không** OG·SD identity riêng theo decorated URL | BRD §45 | Xác nhận hiện trạng vs policy; **không** đổi BRD |
| **Implementation mechanism** | `meta robots noindex` · canonical-only · robots.txt · sitemap exclusion · rendering / crawler policy · tổ hợp tương đương | **SoT / Solution** sau Owner APPROVE Audit | Ghi **options quan sát**; **không** khóa một cơ chế |

BRD §45.3 liệt kê `noindex` như **một** diễn đạt policy khi crawler truy cập được — Audit **không** suy diễn đó thành “thiếu tag noindex = FAIL Affiliate” hay “Epic SEO phải implement noindex ngay”.

#### 2.4.2 Checklist BR-45

| BR | Req ID | Audit ID | Evidence (hiện trạng) | Status | Phân loại |
|----|--------|----------|----------------------|--------|-----------|
| BR-45 | BR-45.0 | AUD-45.0 | Boundary LOCKED trong BRD; runtime Affiliate hoạt động; SEO Platform chưa enforce Index Universe | **PARTIAL** | Policy awareness vs platform gap |
| BR-45 | BR-45.1 | AUD-45.1 | Article: canonical / og:url = Clean Public. List/hub: thiếu canonical trong first HTML → Clean chưa được declare đủ cho SEO Universe | **PARTIAL** | SEO Platform gap (root cause V1/V2), không phải Affiliate broken |
| BR-45 | BR-45.2 | AUD-45.2 | Decorated URL phục vụ attribution; **không** evidence tạo SEO page/entity riêng; cùng content với Clean | **PARTIAL** | Hướng đúng cục bộ; thiếu policy platform toàn site |
| BR-45 | BR-45.3 | AUD-45.3 | **Attribution:** OK (resolver + nginx rewrite). **Không** tạo sitemap entry publicId (sitemap generator **không tồn tại**). **Không** dùng decorated làm canonical/og trên article. **Chưa** có SEO Index Universe exclusion policy được declare/enforce bởi SEO Platform. Cơ chế cụ thể (**gồm** nhưng **không chỉ** noindex) = **TBD SoT** | **PARTIAL** | **Missing SEO policy** — không phải Affiliate runtime defect |
| BR-45 | BR-45.4 | AUD-45.4 | Resolver scripts sớm trong HTML; nginx **internal rewrite** (không 301 SEO preempt attribution) | **PASS** | Runtime OK |
| BR-45 | BR-45.5 | AUD-45.5 | Article metadata sau resolve → Clean representation | **PARTIAL** | Article OK; surfaces khác thiếu contract |
| BR-45 | BR-45.6 | AUD-45.6 | URL Variant Matrix §4 — đủ cột; phân biệt Attribution vs SEO Universe; mechanism cột = quan sát, không khóa | **PASS** | Deliverable Audit |
| BR-45 | BR-45.7 | AUD-45.7 | Audit **không** yêu cầu / không đề xuất refactor Affiliate / Public Identity | **PASS** | Governance |

#### 2.4.3 Giải thích severity / status BR-45.3 (rev. B)

| Câu hỏi | Trả lời Audit |
|---------|----------------|
| **Runtime defect hiện tại (Affiliate)?** | **Không.** Attribution / Public Identity resolve / decorate / rewrite nội bộ **hoạt động**. Không evidence SEO task đang làm mất attribution context. |
| **Runtime defect SEO identity sai (publicId làm canonical/OG/sitemap)?** | **Không thấy** trên article path: canonical & og:url = Clean. Sitemap generator không tồn tại → **không** có sitemap URL publicId. |
| **Missing SEO policy?** | **Có.** Chưa có SEO Platform declare/enforce: decorated URL ∈ Attribution Universe ⇒ **ngoài SEO Index Universe**. Đây là **SoT input**, không phải “Affiliate hỏng”. |
| **Mechanism đã khóa?** | **Không.** noindex / canonical-only / robots / sitemap exclusion / render policy → **SoT/Solution**. |
| **Có vô tình yêu cầu SEO tạo identity riêng cho user/publicId?** | **Không.** Audit cấm: canonical riêng theo publicId; sitemap có publicId; OG/SD identity riêng; phá attribution. |

### 2.5 BR-46 … BR-48

| BR | Req ID | Audit ID | Status | Note |
|----|--------|----------|--------|------|
| BR-46 | BR-46.1 | AUD-46.1 | **PARTIAL** | Compatibility attribution giữ; Index Universe policy còn thiếu ở SEO side |
| BR-47 | BR-47.1 | AUD-47.1 | **PARTIAL** | Reuse SeoUrl/Href/Affiliate resolvers; chưa SEO platform |
| BR-48 | BR-48.CONSIST | AUD-48.C | **PARTIAL** | Article variants → cùng Clean canonical; list thiếu contract |
| BR-48 | BR-48.DETERM | AUD-48.D | **PARTIAL** | Article deterministic; shells static |
| BR-48 | BR-48.PERF | AUD-48.P | **PASS** | Không evidence SEO chặn attribution |
| BR-48 | BR-48.REL | AUD-48.R | **PARTIAL** | Thiếu SEO metadata không crash page; attribution còn |
| BR-48 | BR-48.OBS | AUD-48.O | **FAIL** | Không observability chain platform |
| BR-48 | BR-48.SEC | AUD-48.S | **FAIL** | Không SEO RBAC |
| BR-48 | BR-48.AUDIT | AUD-48.A | **FAIL** | Không audit trail SEO |
| BR-48 | BR-48.ROLL | AUD-48.RB | **NOT_FOUND** | Không rollback SEO |

### 2.6 BR-SC (Success Criteria — verification index)

| Req ID | Hiện trạng phục vụ SC | Status |
|--------|----------------------|--------|
| SC-01 | Chưa 100% SEO Contract | **FAIL** |
| SC-02 | Chưa một SEO SoT | **FAIL** |
| SC-03 | Ownership uncontrolled | **FAIL** |
| SC-04 | Canonical auto chỉ article | **PARTIAL** |
| SC-05 | Robots không rule engine | **PARTIAL** |
| SC-06 | Sitemap chết | **FAIL** |
| SC-07 | OG/Twitter partial | **PARTIAL** |
| SC-08 | JSON-LD partial | **PARTIAL** |
| SC-09 | Breadcrumb partial | **PARTIAL** |
| SC-10 | Default image fallback thiếu | **FAIL** |
| SC-11 | Title/Desc auto thiếu | **PARTIAL** |
| SC-12 | Override chưa governance | **FAIL** |
| SC-13 | Favicon fail | **FAIL** |
| SC-14 | Human/crawler list lệch | **FAIL** |
| SC-15 | Preview NOT_FOUND | **FAIL** |
| SC-16 | Health NOT_FOUND | **FAIL** |
| SC-17 | Versioning NOT_FOUND | **FAIL** |
| SC-18 | Rollback NOT_FOUND | **FAIL** |
| SC-19 | RBAC NOT_FOUND | **FAIL** |
| SC-20 | Traceability NOT_FOUND | **FAIL** |
| SC-21 | Attribution path OK; Index Universe policy chưa platform | **PARTIAL** |
| SC-22 | Clean = SEO identity (article OK; toàn site chưa) | **PARTIAL** |
| SC-23 | Policy “ngoài SEO Index Universe” chưa enforce; **mechanism TBD SoT** (không = FAIL vì thiếu noindex tag) | **PARTIAL** |
| SC-24 | Matrix có trong Audit | **PASS** |
| SC-25 | Vẫn cần code cho SEO | **FAIL** |
| SC-26 | Machine-readable thiếu toàn site | **FAIL** |
| SC-27 | Audit evidence = document này | **PASS** (artifact) |
| SC-28 | SoT docs sau Audit — chưa | **N/A** (gate sau) |
| SC-29 | Future docs — chưa | **N/A** (gate sau) |
| SC-30 | HTTP Status trong Contract + coherent policy — chưa | **FAIL** |
| SC-31 | Conflict-resolution deterministic — chưa | **FAIL** |
| SC-32 | Singleton tags enforced — chưa | **FAIL** |

---

## 3. AUD-SERP — SEO SERP Gap Report (§42)

Google cột = **công khai / BRD §3 symptom**; **không** có Search Console export trong chu kỳ này → đánh **PARTIAL**.

| URL | HTML Title (first paint) | Google Title | Description | Favicon | Canonical | OG | JSON-LD | Status |
|-----|--------------------------|--------------|-------------|---------|-----------|----|---------|--------|
| `/` → `/nha-cua-toi` | Nhà của tôi · iFlux | ? | NOT in HTML | 404 | NOT in HTML | NOT | NOT | **FAIL** / SERP **PARTIAL** |
| `/cong-dong` | Cộng đồng · iFlux | BRD §3: «Cộng đồng · iFlux» + snippet lệch | NOT in HTML | 404 / SERP icon sai (BRD) | NOT | NOT | NOT | **FAIL** |
| Article | Backend inject | ? | Injected | 404 | Clean URL | Injected | Client-only (may miss some crawlers) | **PARTIAL** |
| Stock | Shell title | ? | ? | 404 | ? | ? | ? | **FAIL** |
| Sector | Shell title | ? | ? | 404 | ? | ? | ? | **FAIL** |
| Ecosystem | Shell title | ? | ? | 404 | ? | ? | ? | **FAIL** |

**Gap:** Owner bổ sung Search Console / SERP screenshots nếu yêu cầu cứng cột Google trước khi đóng Audit PASS (không soft-PASS).

---

## 4. AUD-45 — URL Variant Matrix (§45.6 / §41)

> Cột **SEO Index Universe** = policy hiện trạng (có/không được treat như SEO identity).  
> Cột **Mechanism quan sát** = facts kỹ thuật hiện có — **không** đồng nghĩa Audit đã chọn mechanism.

| URL Variant | Attribution Universe | SEO Index Universe (policy hiện trạng) | Canonical (quan sát) | Sitemap (quan sát) | Mechanism quan sát (không khóa) |
|-------------|----------------------|----------------------------------------|----------------------|--------------------|----------------------------------|
| **Clean Public** e.g. `/cong-dong`, `/cong-dong/bai-viet/{slug}` | N/A | **Thuộc SEO Universe** (đúng hướng policy) — nhưng list thiếu full contract | Article: Clean absolute; List: **missing** in first HTML | Generator **không tồn tại** (404) | robots.txt Allow `/`; list không meta robots |
| **`/{publicId}/...`** (`/IFL…/`) | **Có** — resolver + nginx internal rewrite + Writer decorate | **MUST = ngoài SEO Universe** (policy BR-45). Hiện: **chưa** có platform policy enforce; **không** evidence đã tạo SEO identity riêng (canonical/OG vẫn Clean trên article) | Article: vẫn Clean | Không list publicId (không có sitemap) | Không thấy noindex-theo-variant; **không** suy ra bắt buộc noindex tại Audit |
| **`?ref=`** | Legacy / strip ở share normalize | **MUST = ngoài SEO Universe** | Article: Clean nếu còn trên request | N/A | Strip ở share path — ownership Affiliate/Share; không khóa SEO mechanism |
| **`?r=`** | Same | **MUST = ngoài SEO Universe** | Clean | N/A | Same |
| **Decorator khác** | Path publicId = primary trên Prod | **MUST = ngoài SEO Universe** | — | — | — |

### 4.1 Xác nhận bắt buộc (§41) — không yêu cầu hành vi SEO sai

| Check | Result | Audit khẳng định |
|-------|--------|------------------|
| Affiliate/Public Identity Resolver hoàn tất attribution **trước** SEO redirect phá attribution | **PASS** | Không evidence SEO 301 preempt |
| SEO metadata (khi có) trỏ **Clean Public** | **PARTIAL** | Article YES; list thiếu declare |
| PublicId/Affiliate **không** làm canonical | **PASS** (article evidence) | **Cấm** tạo canonical riêng theo publicId/user |
| PublicId/Affiliate **không** vào sitemap | **N/A → PASS hướng** | Không generator; **cấm** thêm sitemap URL có publicId |
| PublicId/Affiliate **không** tạo OG / Structured Data identity riêng | **PASS** (article: og:url Clean; không SD riêng theo publicId) | **Cấm** tạo OG/SD identity theo decorated URL |
| Attribution context **không** bị SEO làm mất | **PASS** | **Cấm** “làm sạch URL” phá attribution |
| Decorated URL nằm ngoài SEO Index Universe | **PARTIAL** | Policy rõ; **enforce mechanism = SoT** (không khóa noindex) |

### 4.2 Cross-domain note

Finding “thiếu SEO Index Universe policy cho decorated URLs” = **SEO-side SoT input**.  
**Không** tự mở refactor Affiliate / Public Identity trong Epic SEO (BR-45.7).

---

## 5. AUD-MATRIX — Automatic vs Manual (hiện trạng §43)

> Matrix **evidence hiện trạng** — **chưa** chốt SoT.

| Field | Automatic today | Manual Override today | Manual Required | System Only | Notes |
|-------|-----------------|-----------------------|-----------------|-------------|-------|
| URL | △ helpers | ✓ slug article | — | — | Không platform engine |
| Canonical | △ article | △ Admin article field | — | — | Clean only — không theo publicId |
| SEO Title | △ article resolve | ✓ article Admin | — | — | Shells hardcode |
| Description | △ article | ✓ article Admin | — | — | |
| OG * | △ article | ✓ / static share | — | — | |
| Twitter * | △ derived article | — | — | — | |
| Robots | △ manifests | — | — | — | Không Index Universe engine |
| Sitemap eligibility | ✗ | — | — | — | **Broken** |
| Breadcrumb | △ client post | — | — | — | |
| JSON-LD | △ client post | — | — | — | |
| Favicon | ✗ | Brand URL field unused | — | — | |
| Site Name | △ brand-ish | — | — | — | Không SEO SoT |
| HTTP Status | △ nginx/app | — | — | — | **Ngoài** SEO Contract (BR-06.3 FAIL) |
| Signal conflict gate | ✗ | — | — | — | BR-10.2 / BR-29.2 |
| Singleton tags | ✗ | — | — | — | BR-34.4 / BR-29.3 |

---

## 6. Inventory refs (không thay BR Checklist)

| Area | Paths |
|------|-------|
| URL helper | `User_Web/iflux-web-ui/seo-url.js` |
| Page head mutation | `User_Web/iflux-web-ui/runtime/page-definition.js` |
| Affiliate | `…/runtime/affiliate-resolver.js`, `shell-url-writer.js`, `iflux-href.js` |
| Article SEO | `backend/src/modules/community/community-articles.service.js` |
| Nginx | `infra/nginx-iflux-production-locations.conf` |
| Admin article SEO UI | `Admin_Design_system/app/community/content/edit.html` |
| Brand favicon field | `Admin_Design_system/app/marketing/brand-identity*` |

---

## 7. Gate

| Item | Value |
|------|-------|
| BR Checklist Registry | 🔒 **OWNER LOCKED** (BRD §0 + amendment HTTP/Conflict/Singleton) |
| Mandatory Audit | 🔒 **OWNER LOCKED** · ✅ **APPROVED** · rev. **C** |
| Implementation | ❌ **NOT AUTHORIZED** |
| SoT | 🔒 đã LOCK (rev. B.1) — **Owner đang kiểm tra** absorb BRD/Audit C |
| Solution | 🟡 OWNER REVIEW (rev. C) — **Owner đang kiểm tra** absorb + D-SEO-09 |
| Plan | ❌ **NOT OPEN** until Solution LOCK |

### Owner decisions cần cho SoT / Solution (Audit không quyết)

1. **SEO Platform SoT ownership** (contract resolver, dual pipeline list vs article) — absorb thêm HTTP Status + singleton + conflict policy.
2. **Cách enforce “decorated URL ∉ SEO Index Universe”** — D-SEO-09 mechanism combo (Solution §12).
3. robots.txt / sitemap **versioning** vào repo + generator.
4. Favicon / Website Identity wire vào public head.
5. First-HTML vs JS meta cho list pages (crawler parity).
6. Giữ nguyên: **không** refactor Affiliate trừ SEO-boundary defect đã chứng minh + Owner approve (BR-45.7).
7. **Conflict-resolution precedence table** (HTTP vs redirect vs canonical vs robots vs sitemap vs OG/SD) — SoT/Solution.
8. **Singleton enforcement** across HTML/JS/SPA/Node/nginx pipelines — SoT/Solution.

### Audit khẳng định cuối (BR-45)

```text
✓ Clean Public URL = SEO Universe
✓ PublicId / Affiliate URL = Attribution Universe = NOT SEO Universe
✓ Attribution phải tiếp tục hoạt động
✓ Không tạo canonical / sitemap / OG / SD identity theo publicId
✓ Không làm mất attribution
✓ Không khóa mechanism = noindex
✓ Affiliate runtime ≠ root cause SEO
✓ Root cause = thiếu SEO Platform / SEO Contract SoT + ownership phân tán
✓ (rev.C) HTTP Status · Conflict Resolution · Singleton = BRD LOCKED; hiện trạng Audit = FAIL / NOT_FOUND
```

---

**End of Mandatory Audit — OWNER LOCKED rev. C — 2026-08-09**  
**Implementation NOT AUTHORIZED · Plan NOT OPEN · SoT/Solution = Owner review**
