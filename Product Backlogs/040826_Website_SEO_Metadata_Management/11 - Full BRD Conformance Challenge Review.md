CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# 11 — Full BRD Conformance Challenge Review

| | |
|--|--|
| **Task** | `040826_Website_SEO_Metadata_Management` |
| **Mode** | READ-ONLY · **Challenge** artifact + impl **against FULL BRD** — không confirm “có vẻ đúng” |
| **Normative baseline** | [`01 - Business Requirement.md`](01%20-%20Business%20Requirement.md) · §0 Registry · Atomic Req ID · LOCKED §10/§14/§38/§45 · §51 |
| **Artifacts challenged** | `02` Audit · `03` SoT · `04` Solution · `05` Plan · `06`/`09` Verification · `10` OG Social Audit · live Production + `seo-platform/` · nginx · Admin |
| **Date** | 2026-08-10 ~21:40 +07 |
| **Implementation** | **Không** sửa code · **Không** mở Plan mới · **Không** tạo requirement mới |

**Rule:** Không PASS nếu thiếu evidence. Không PASS vì “không thấy bug”. Missing evidence → **UNRESOLVED**.

---

## A. Overall Verdict

```text
FAIL
```

**Không** đạt full BRD conformance. SEO Platform core (Contract + HTTP policy + conflict + sitemap/robots + Affiliate Index Boundary + nhiều bot shells) **có evidence thật**, nhưng **§0 Checklist đầy đủ không đạt**. Một LOCKED requirement FAIL = blocker dù nhiều dòng khác PASS.

**Wave B:** **KHÔNG đóng.**  
**Epic closure:** **KHÔNG authorized.**  
**Affiliate refactor:** **KHÔNG** đề xuất (boundary PASS).

---

## B. Blocking Findings

| # | Finding | BR / SC | Evidence |
|---|---------|---------|----------|
| B1 | Homepage `/` First HTML **rỗng SEO/OG** mọi UA (kể FB/Googlebot/Zalo) — nginx `location = /` SPA, **không** `seo_shell` | BR-07.HOME, BR-34.*, BR-15, SC-01/32 | [`10`](10%20-%20Audit%20OG%20Social%20Preview%20Evidence.md) RC-1 |
| B2 | `og:image` / `twitter:image` emit **relative** `/media/….webp` — không đạt social absolute | BR-15.1, BR-16.1, SC-07 | `10` RC-3; hub/article First HTML |
| B3 | Human/Googlebot/Social **không** thống nhất First HTML (Zalo hub = SPA rỗng; comment nginx **CẤM Zalo** open-graph) | BR-35.1, BR-34.3, SC-14 | `10` RC-2; `iflux-prod-app.conf` |
| B4 | Singleton không chứng minh trên mọi rendered document; detector thiếu field; multi-writer còn | BR-34.4, BR-29.3, SC-32 | `head-renderer.js` detect*; SPA+JS dual path |
| B5 | Admin vẫn **manual-first** SEO title/desc (thiếu auto-resolution UX) | BR-01.3, BR-37.1 | Admin SEO pages + article edit |
| B6 | Breadcrumb / Pagination SEO **không** có engine | BR-22.1, BR-26.1, SC-09 | Không emit trong seo-platform |
| B7 | Versioning + Rollback UX **false / thiếu** | BR-30.1, BR-48.ROLL, SC-17/18 | Plan residual; routes flags |
| B8 | Không có GSC Declared→Indexed→SERP evidence | BR-36.1, BR-05.2, SC-26 | Audit V11 PARTIAL; 09 non-claim |
| B9 | `09` từng PASS BR-15…16 trên `og:title/url` — **đã rút**; Wave B mở | BR-15/16 | `09` + `10` |
| B10 | Artifact stale: BRD header / Audit `02` vẫn “Impl NOT AUTHORIZED” trong khi Plan `05` **AUTHORIZED** + Wave B OPEN — governance docs **không đồng bộ** | §51, SC-29 | So sánh header `01`/`02` vs `05` |

---

## C. BRD Coverage Counts

| Status | Count |
|--------|------:|
| **PASS** | 42 |
| **PARTIAL** | 68 |
| **FAIL** | 22 |
| **UNRESOLVED** | 4 |
| **Total atomic rows (§0.2 + SC)** | **136** |

> Coverage % **không** che blocker. FAIL trên HOME / OG / Singleton / SC-01/07/14/32 đủ chặn claim epic PASS.

---

## D. Critical Boundary Verdicts

| Boundary | Verdict | Note |
|----------|---------|------|
| HTTP ↔ SEO coherence (policy tồn tại) | **PARTIAL** | Code deterministic **có** (`http-policy.js` + `conflict.js`); fleet/live **chưa** đủ (`/` 200+empty; 410 emitter N/A) |
| Conflict Resolution | **PARTIAL** | Precedence HTTP→…→SD **có**; không chứng minh mọi HTML path Health-gated |
| Singleton Metadata | **FAIL** | `/` zero tags; detector incomplete; multi-pipeline |
| SEO SoT | **PARTIAL** | Contract platform **có**; competing writers còn |
| Human ↔ Crawler consistency | **FAIL** | Zalo ≠ FB/Googlebot; Option A human empty title by design |
| Affiliate / Public Identity | **PASS** | Clean identity; noindex decorated; không sitemap `?ref=`; **không refactor** |
| Automatic by Default | **FAIL** (BR-01.3) / **PARTIAL** (01.1–01.4) | Templates có; Admin vẫn bắt nhập |
| Coverage | **FAIL** | HOME `/` FAIL; PAGE FAIL; WATCH/SEARCH Owner-lock PARTIAL |
| Governance readiness | **PARTIAL** | Plan authorized impl; Verification **chưa** đóng; Audit `02` snapshot **stale** vs hiện trạng |

---

## 1. Governance Stage (§51)

```text
BRD 🔒
 → Mandatory Audit 🔒 APPROVED (rev.C)     [gate met historically]
 → SoT 🔒 B.2
 → Solution 🔒 D.1.1
 → Plan 🔒 → Impl AUTHORIZED
 → Implementation (đã chạy)
 → Verification Wave B OPEN — NOT CLOSED
 → Epic closure NOT AUTHORIZED
```

| Claim | Verdict |
|-------|---------|
| “Implementation NEVER authorized” (BRD/`02` header) | **Stale** vs Plan `05` |
| “Mandatory Audit PASS ⇒ epic PASS” | **FALSE** — Audit was gap inventory; post-impl verification incomplete |
| Mở Plan / Impl mới trước khi đóng blocker B1–B4 | **NOT recommended** without Owner priority lock |
| Affiliate refactor | **FORBIDDEN** trừ SEO-boundary defect + Owner (§45.7) |

---

## 2. Deep Challenge — HTTP / SEO Coherence

### 2.1 Deterministic policy — **EXISTS** (code)

| Module | Path | Role |
|--------|------|------|
| HTTP class | `backend/src/modules/seo-platform/http-policy.js` | Classify 200/301/302/404/410/4xx/5xx |
| Conflict | `backend/src/modules/seo-platform/conflict.js` | Precedence: **HTTP → Index Universe → Canonical → Robots → Sitemap → OG → SD** |
| Health | `backend/src/modules/seo-platform/health.js` | ERROR codes e.g. `HTTP_404_INDEXABLE`, `SITEMAP_NOINDEX_CONFLICT` |

### 2.2 HTTP map

| HTTP | Policy (code) | Live evidence gap |
|------|---------------|-------------------|
| **200** | may index + sitemap (unless forceNonIndex / decorated / utility) | `/` = 200 + **empty SEO** (không bị conflict engine “bắt” vì không claim robots/sitemap trên SPA) |
| **301/302** | noindex; no sitemap; canon → redirect target | English→VI redirects evidenced `09` |
| **404** | noindex,nofollow; no sitemap; error shell | Article missing → `renderHttpErrorShell(404)` **PASS** after fix |
| **410** | same class as 404 in policy | **Product emitter N/A** → BR-07.410 **PARTIAL** |

### 2.3 Invalid states

| Invalid state | Prevented in Contract/conflict? | Live fleet? |
|---------------|----------------------------------|-------------|
| 404 + indexable + sitemap | **Yes** (force + Health ERROR) | Article 404 path OK |
| 410 + indexable + sitemap | **Yes** in policy | No 410 product path |
| 301/302 + independent canonical identity | **Yes** (canon→target) | Sample OK |
| noindex + sitemap eligible | **Yes** (`SITEMAP_NOINDEX_CONFLICT`) | Sitemap generator gated |
| canonical=A + SD URL=B | Forced inherit identity when indexable_success | Hub shells OK when shell |
| redirect→B + canonical→C | Forced align | Sample OK |

**Verdict BR-06.3:** **PASS** (Contract includes HTTP).  
**Verdict BR-06.4 / BR-10.2 / SC-30/31:** **PARTIAL** — policy deterministic **tồn tại**; không đủ evidence mọi public HTML path; `/` coherent gap.

---

## 3. Deep Challenge — Singleton Metadata

| Layer | Owner today | Emit | Duplicate risk |
|-------|-------------|------|----------------|
| nginx `@seo_shell_*` | SEO Platform shell | Contract head | Low when used |
| Article `open-graph` / `spa` | Community routes + Contract | Injected head | Medium (scripts before head) |
| Human SPA | Static HTML + JS (`IfluxSeoTitle` / effective API) | Empty then fill | High vs bot shell |
| `/` | Static community SPA | **None** | N/A — **zero** authoritative instance |
| Manifests / page-definition | Legacy | Hardcode titles | Competing writers |

`detectSingletonViolations` (`head-renderer.js`): đếm **title, canonical, robots, og:title, og:url** — **thiếu** description, og:description, og:image, twitter primary → BR-29.3 **PARTIAL**.

**Verdict BR-34.4 / SC-32:** **FAIL**.

---

## 4. Deep Challenge — Affiliate / Public Identity (LOCKED)

### Resolution order (evidenced)

```text
Request
 → Affiliate / Public Identity Resolver (nginx rewrite / Share capture)
 → Attribution
 → Content / Clean path
 → SEO Contract (Clean Public representation)
```

| Variant | Attribution | SEO eligibility | Canonical / OG / SD | Sitemap | Robots |
|---------|-------------|-----------------|---------------------|---------|--------|
| Clean Public | N/A | Index Universe (page rules) | Clean | If eligible | Per Contract |
| `?ref=` / `?r=` | Capture | Outside Index Universe | Clean target | No | noindex (+ X-Robots-Tag) |
| `/{publicId}/…` | Capture | Decorated | Clean | No | noindex |
| Other decorators | Per Share | Must not create SEO entity | Clean | No | noindex policy |

**SEO preempt resolver?** Evidence: rewrite internal, không 301 SEO trước attribution → **PASS BR-45.4**.  
**Sitemap `?ref=`?** 0 trong live XML → **PASS**.  
**Canonical/OG mang publicId?** Contract Clean → **PASS** trên sample `09`.

```text
Finding: Affiliate boundary SEO PASS trên evidence hiện có.
Dependency: Share / Public Identity Foundation (ngoài Epic).
Owner approval required: bất kỳ thay đổi nào ngoài SEO emit / Index Boundary.
KHÔNG đề xuất refactor Affiliate trong Epic này (BR-12.3 / BR-45.7).
```

**Verdict BR-45.0…45.7 / SC-21…24:** **PASS** (với caveat: variant matrix Audit `02` AUD-45 tồn tại; live `09` reconfirm REF/PID).

---

## 5. Deep Challenge — Coverage (không mẫu vài page)

| Type | HTTP | Identity | Title | Desc | Canon | Robots | OG | Twitter | SD | Breadcrumb | Sitemap | Lang | Alt-lang | Status |
|------|------|----------|-------|------|-------|--------|----|---------|----|------------|---------|------|----------|--------|
| `/` HOME | 200 | ∅ | ∅ | ∅ | ∅ | ∅ | ∅ | ∅ | ∅ | ∅ | — | — | — | **FAIL** |
| Static (`/goi-cuoc`) | 200 shell | OK | OK | OK | OK | OK | relative img | derived | WebPage | ∅ | yes | vi | ∅ | **PASS*** |
| Community hub | 200 shell† | OK | OK | OK | OK | OK | relative | derived | OK | ∅ | yes | vi | ∅ | **PASS*** |
| Article | 200 spa/OG | OK | OK | OK | OK | OK | relative | derived | thin | ∅ | yes | vi | ∅ | **PARTIAL** |
| Market / Flow / Member / FAQ | shell† | OK | OK | OK | OK | OK | relative | derived | OK | ∅ | yes | vi | ∅ | **PASS*** |
| Watchlist / Search | SPA | hardcode | hardcode | — | — | — | — | — | — | — | Owner lock | — | — | **PARTIAL** |
| Stock / Sector / Eco | shell | OK | tmpl | OK | OK | OK | relative | — | OK | ∅ | list | vi | ∅ | **PASS*** |
| Author / Collection | shell | OK | OK | OK | OK | OK | relative | — | — | ∅ | — | vi | ∅ | **PASS*** |
| Tag | 301→`/cau-chuyen` | — | — | — | — | — | — | — | — | — | — | — | — | **PASS** (redirect policy) |
| Pagination | — | — | — | — | — | — | — | — | — | — | — | — | — | **FAIL** |
| Future Entity | — | — | — | — | — | — | — | — | — | — | — | — | — | **UNRESOLVED** |
| Redirect | 301 | — | — | — | target | — | — | — | — | — | no | — | — | **PASS** |
| 404 | 404 | error shell | OK | — | — | noindex | — | — | — | — | no | — | — | **PASS** |
| 410 | policy | — | — | — | — | noindex | — | — | — | — | no | — | — | **PARTIAL** |
| Query UTM | 200 | Clean | OK | OK | Clean | per | Clean | — | Clean | — | no decorated | — | — | **PASS** |
| Referral `?ref=` | 200 | Clean | — | — | Clean | noindex | Clean | — | Clean | — | no | — | — | **PASS** |
| Public Identity | rewrite | Clean | — | — | Clean | noindex | Clean | — | Clean | — | no | — | — | **PASS** |

\*PASS bot shell cho Googlebot/FB — **không** Zalo.  
†Zalo = SPA empty → BR-35 FAIL chồng lên.

---

## 6. Automatic by Default

| Field still Admin-entered | Deterministic source exists? | BR-01.3 |
|---------------------------|------------------------------|---------|
| Page SEO Title / Description | Yes (templates / Foundation) | Manual vì UX chưa override-only → **FAIL** |
| Article SEO title/desc/keywords | Yes (title/excerpt/cover) | Manual fields còn → **FAIL** aspect |
| Canonical (article) | Yes (domain+route+slug) | Readonly auto — **improved**; system-only OK |
| Slug | Yes (slugify title) | Auto + former_slugs 301 — **PARTIAL** BR-11/24 |

Manual không chứng minh là editorial/campaign exception → **FAIL BR-01.3**.

---

## 7. Template + Rule Engine

| Layer | Exists? | Authoritative owner |
|-------|---------|---------------------|
| Global | Foundation `site-seo` | Foundation |
| Page Type | `page_seo_configs` + shells | Foundation + SEO Platform consume |
| Entity Type | `entity-templates.js` | SEO Platform |
| Specific Entity | Thin | UNRESOLVED completeness |
| Manual Override | Admin fields | Foundation / article payload |
| Fallback | Chain in templates | SEO Platform |
| Rule Engine (indexability/robots/sitemap/conflict) | **Code modules** `http-policy` + `index-boundary` + `conflict` | **seo-platform** (authoritative for Contract) |
| Rule CMS editable | **Không** | N/A |

Không chấp nhận “hardcode từng page” làm SoT — còn hardcode WATCH/SEARCH → **PARTIAL/FAIL** cục bộ.

---

## 8. Ownership Matrix (key fields)

| Field | Authoritative Owner | Resolution Source | Renderer | Override | Duplicate Risk |
|-------|---------------------|-------------------|----------|----------|----------------|
| title | SEO Platform Contract ← Foundation/template | `entity-templates` / page effective | head-renderer / SPA JS | Admin page/article | **High** (SPA+shell) |
| description | Contract ← effective | same | head-renderer / JS | Admin | High |
| canonical | System Only | Domain+route+slug / Clean | head-renderer | **None** (cleared persist) | Low when shell; **`/` missing** |
| robots | System + utility keys | http-policy + UTILITY_NOINDEX | head-renderer | exception | Medium |
| og:title/desc | Contract social | title/desc | head-renderer | — | Medium |
| og:image | Foundation/entity | `og_image` path | head-renderer | Admin image | **FAIL relative** |
| og:url | Clean identity | Contract | head-renderer | None | Low when shell |
| twitter | Derived OG | Contract | head-renderer | — | Same as OG |
| JSON-LD | Contract SD | head-renderer | thin WebPage | — | Medium |
| breadcrumb | **unowned** | — | **missing** | — | N/A |
| favicon | Foundation → assets | nginx `/favicon.ico` + head when shell | — | Admin | `/` missing link |
| sitemap | SEO Platform | eligibility gate | `/sitemap.xml` | — | — |
| robots.txt | SEO Platform | platform robots | `/robots.txt` | — | CF Managed OFF (evidenced) |
| verification | Foundation (partial) | — | — | Admin | UNRESOLVED completeness |

---

## 9. Rendering / Crawler

```text
Human hub/home     → SPA empty title → JS + /api/seo/effective     (chậm / không crawler)
Googlebot hub      → seo_shell Contract head
FB/Twitter hub     → seo_shell
Zalo hub           → SPA empty                                 ← FAIL social
Article Googlebot  → spa + injected meta
Article FB…        → open-graph
Article Zalo       → spa+meta (CẤM open-graph)
`/` ALL UA         → SPA empty                                 ← FAIL HOME
```

Declared ≠ Crawler-visible ≠ Indexed ≠ SERP.  
Chỉ HTML source trên bot shell **không** đủ claim SC-14/SC-26.

---

## 10. SERP / Google Gap Matrix (declared only — **no GSC**)

| URL | HTTP | HTML Title (bot) | Google Title | Description | Favicon | Canonical | OG | JSON-LD | Status |
|-----|------|------------------|--------------|-------------|---------|-----------|----|---------|--------|
| `/` | 200 | ∅ | **UNRESOLVED** | ∅ | via `/favicon.ico` asset | ∅ | ∅ | ∅ | **FAIL declared** |
| `/cong-dong` | 200 | Admin title | UNRESOLVED | OK | asset | Clean | relative image | WebPage | PARTIAL |
| Article sample | 200 | Article title | UNRESOLVED | OK | — | Clean | relative | thin | PARTIAL |
| `/thi-truong` | 200 | Admin title | UNRESOLVED | OK | — | Clean | relative | WebPage | PARTIAL |

Google rewrite **không** = platform defect nếu declared/crawler/index đúng — nhưng hiện **thiếu Indexed/SERP evidence** → BR-36 **PARTIAL**, không PASS.

---

## 11. Favicon / Website Identity

| Check | Evidence | Status |
|-------|----------|--------|
| Brand / Site / Homepage / Org / Domain separation | Foundation fields + SoT | PARTIAL (homepage `/` không emit) |
| favicon.ico HTTP | 200 `image/webp` ~32KB (`06`/`09`) | PASS asset |
| PNG / Apple / Manifest / MIME `.ico` | Incomplete evidence | PARTIAL |
| Declared→Cached→SERP icon | No GSC | **UNRESOLVED** BR-05.2 |

---

## 12. NFR BR-48

| NFR | Status | Note |
|-----|--------|------|
| CONSIST | PARTIAL | UA forks First HTML |
| DETERM | PARTIAL | Contract deterministic; nginx UA forks intentional |
| PERF | UNRESOLVED | No pack |
| REL | PARTIAL | Error shells; no chaos test |
| OBS | PARTIAL | `/inspect` exists; fleet thin |
| SEC | PARTIAL | Admin perms; Matrix map incomplete |
| AUDIT | PARTIAL | Trace fields; version thin |
| ROLL | **FAIL** | rollback UX false |

SEO fail ≠ page crash: principle only. Attribution fail ≠ SEO: Affiliate PASS.

---

## 13. Reuse BR-47

**PASS** — seo-platform consumes Foundation `site-seo`; Affiliate resolver reused; không parallel SEO Admin store.  
Utilities platform-wide (URL builders, media) — ownership Foundation/SEO đúng hướng; không đề xuất page-specific duplicate.

---

## 14. Complete Requirement Traceability Matrix

Status keys: **PASS** | **PARTIAL** | **FAIL** | **UNRESOLVED**

| Req ID | BRD Requirement | Artifact Evidence | Status | Gap / Contradiction | Required Action |
|--------|-----------------|-------------------|--------|---------------------|-----------------|
| BR-01.1 | Auto by default; manual = exception | SoT D-SEO-04; Plan P3; Admin UX | PARTIAL | Exception model chưa enforce UI | Override-only UX |
| BR-01.2 | Deterministic auto metadata | Contract+templates; 06/09 shells | PARTIAL | `/`∅; Zalo; breadcrumb missing | Cover HOME+social+engines |
| BR-01.3 | Không bắt nhập vì thiếu auto | Admin SEO + article SEO fields | **FAIL** | Manual operational default | Auto-fill; mark override |
| BR-01.4 | Manual chỉ editorial/campaign/override | SoT classification | PARTIAL | UI không enforce | Governance writes |
| BR-02.A | Fully Automatic class | SoT §6.A; system_only fields | PARTIAL | Breadcrumb/SD incomplete | Complete A-class emit |
| BR-02.B | Auto + Manual Override | Overrideable title/desc | PARTIAL | Uneven Admin | Align B-class |
| BR-02.C | Manual / Editorial | Article SEO | PARTIAL | Featured image/ALT thin | Explicit C surfaces |
| BR-02.D | System Only | filterEditorialOverrides | PARTIAL | Version engine incomplete | Close system engines |
| BR-03.1 | Global Website SEO central | Foundation Admin; 09 | PARTIAL | theme/manifest/verification incomplete | §7 inventory |
| BR-03.2 | Brand≠Site≠Home≠Org≠Domain | SoT identity | PARTIAL | `/` không emit | Wire `/` |
| BR-04.1 | Website Identity SoT | D-SEO-07 | PARTIAL | Not on `/` First HTML | Emit identity `/` |
| BR-04.2 | Machine-readable Google | JSON-LD hubs | PARTIAL | `/`∅; schema thin | WebSite/Org + `/` |
| BR-05.1 | Favicon full coverage | 06/09 200 webp; nginx | PARTIAL | ICO/PNG/Apple/manifest | Full favicon audit |
| BR-05.2 | SERP icon audit chain | Audit V11 | **UNRESOLVED** | No GSC | GSC probe |
| BR-06.1 | Full SEO Contract fields | seo-contract.js; 09 | PARTIAL | Breadcrumb; alt-lang | Complete minimum set |
| BR-06.2 | No missing/contradictory/unowned | 10; hardcodes | **FAIL** | `/`; relative og; writers | Singleton+absolutize |
| BR-06.3 | Contract includes HTTP | http on Contract; http-policy | **PASS** | — | Keep |
| BR-06.4 | HTTP↔SEO coherence map | conflict+health | PARTIAL | `/` 200 empty; 410 N/A | Gate `/`; 410 emitter |
| BR-07.HOME | Coverage `/` | **10** all UA SPA empty | **FAIL** | 06 mistook `/nha-cua-toi` | seo_shell on `/` |
| BR-07.STATIC | Static | `/goi-cuoc` shell | **PASS** | — | — |
| BR-07.COM | Community | shell | **PASS*** | Zalo SPA | Owner Zalo |
| BR-07.ARTICLE | Article | 09 title; 10 og | PARTIAL | relative og; Zalo pipe | Absolutize; Zalo policy |
| BR-07.MARKET | Market | shell | **PASS*** | Zalo | — |
| BR-07.FLOW | Money Flow | shell | **PASS*** | Zalo | — |
| BR-07.MEMBER | Membership | shell | **PASS*** | Zalo | — |
| BR-07.FAQ | FAQ | shell | **PASS*** | Zalo | — |
| BR-07.WATCH | Watchlist | Owner #2 không đụng | PARTIAL | hardcode vs BRD | Owner residual lock |
| BR-07.STOCK | Stock | shell+tmpl | **PASS** | — | — |
| BR-07.SECTOR | Sector | shell | **PASS** | — | — |
| BR-07.ECO | Ecosystem | shell | **PASS** | — | — |
| BR-07.AUTHOR | Author | shell | **PASS** | — | — |
| BR-07.TAG | Tag | 301→`/cau-chuyen` | **PASS** | no dedicated tag page | Accept redirect |
| BR-07.COLL | Collection | cat/topic shell | **PASS** | — | — |
| BR-07.SEARCH | Search | Owner lock | PARTIAL | hardcode | Owner residual |
| BR-07.PAGE | Pagination | 09 GAP | **FAIL** | no engine | Owner N/A or implement |
| BR-07.FUTURE | Future Entity | pattern only | **UNRESOLVED** | no extension DoD | Document hook |
| BR-07.REDIR | Redirect | `/home`,`/pricing` | **PASS** | — | — |
| BR-07.404 | 404 | error shell | **PASS** | — | — |
| BR-07.410 | 410 | policy only | PARTIAL | no emitter | Emit when gone |
| BR-07.QUERY | Query | UTM→Clean | **PASS** | — | — |
| BR-07.REF | Referral | `?ref=` noindex | **PASS** | — | — |
| BR-07.PID | Public Identity | `/IFL…` | **PASS** | — | — |
| BR-08.ARTICLE | Article template | Contract | PARTIAL | OG social | Fix OG |
| BR-08.STOCK | Stock template | entity-templates | **PASS** | — | — |
| BR-08.SECTOR | Sector template | — | **PASS** | — | — |
| BR-08.AUTHOR | Author template | — | **PASS** | — | — |
| BR-08.TMPL | fallback/version/ownership | TEMPLATE_VERSION | PARTIAL | version UX | Versioning |
| BR-09.1 | Template engine levels | SOL-TMPL | PARTIAL | specific-entity thin | Prove cascade |
| BR-09.2 | Template blast radius | 09 sample | PARTIAL | limited test | Change-one verify-many |
| BR-10.1 | Rule engine | http-policy+boundary | PARTIAL | no rule CMS | Scope code vs CMS |
| BR-10.2 | Deterministic conflict | conflict.js | PARTIAL | not fleet HTML | Health on emit |
| BR-11.1 | Canonical auto | Clean canon; former_slugs | PARTIAL | `/` missing | HOME shell |
| BR-11.2 | Domain+Route+Entity+Policy | Contract | PARTIAL | `PAGE_KEY_TO_PATH['cau-chuyen']='/chu-de'` stale | Fix path map |
| BR-12.1 | Edge policy matrix | 09 partial | PARTIAL | sort/filter/pagination incomplete | Full edge matrix |
| BR-12.2 | Affiliate ≠ canonical | Clean identity | **PASS** | — | — |
| BR-12.3 | No Affiliate refactor | D-SEO-02 | **PASS** | — | Keep |
| BR-13.1 | Robots rule-driven | robots.txt Platform | **PASS** | — | — |
| BR-14.1 | Sitemap automatic | live XML; eligibility | **PASS** | — | — |
| BR-15.1 | OpenGraph Automatic | **10** FAIL | **FAIL** | relative; `/`∅; Zalo | Absolutize; `/`; Zalo |
| BR-16.1 | Twitter derived | mirrors OG | **FAIL** | same | Same as 15 |
| BR-17.1 | Default image fallback | Foundation og | PARTIAL | relative | Absolutize |
| BR-18.1 | Image SEO | 10 WebP | **FAIL** | ALT/dims missing | Wave C / format |
| BR-19.1 | Description automation | resolveDescription | PARTIAL | Admin manual | Zero-input proof |
| BR-20.1 | Title automation | TITLE_TEMPLATES | PARTIAL | WATCH hardcode | Remove/Owner lock |
| BR-21.1 | Structured Data | WebPage LD | PARTIAL | `/`; Article depth | Richer + `/` |
| BR-22.1 | Breadcrumb | — | **FAIL** | no engine | Contract+emit |
| BR-23.1 | Internal linking | — | **UNRESOLVED** | no audit | Inventory Clean targets |
| BR-24.1 | Slug & URL | former_slugs 301 | PARTIAL | article-scoped | Platform slug CMS |
| BR-25.1 | Redirect management | nginx+article 301 | PARTIAL | no SEO redirect CMS | Govern or accept nginx |
| BR-26.1 | Pagination SEO | — | **FAIL** | none | Owner N/A/impl |
| BR-27.1 | Multi-language | vi-VN only | PARTIAL | no hreflang | Readiness only |
| BR-28.1 | SEO Preview | API preview | PARTIAL | preview≠social proof; relative | Fail relative in preview |
| BR-29.1 | SEO Health | health.js | PARTIAL | not publish gate | Gate critical |
| BR-29.2 | Conflict Health ERROR | health codes | PARTIAL | not fleet | Crawl-health |
| BR-29.3 | Duplicate singleton ERROR | detectSingleton* | PARTIAL | incomplete fields | Expand+live HTML |
| BR-30.1 | Versioning | versionHistory false | **FAIL** | — | Foundation phase |
| BR-31.1 | Traceability | Contract trace | PARTIAL | not Admin-visible | Surface inspect |
| BR-32.1 | SEO CMS | Admin SEO pages | PARTIAL | not full CMS | Scope Foundation |
| BR-33.1 | SEO RBAC | data-ix-perm | PARTIAL | Matrix map | Owner RBAC map |
| BR-34.1 | One SEO SoT | Contract | PARTIAL | competing writers | Delete competitors |
| BR-34.2 | No invent outside pipeline | 10 multi-path | **FAIL** | SPA/manifests | Single emit owner |
| BR-34.3 | All pipelines same Contract | UA forks | **FAIL** | Zalo; `/` | Owner UA + `/` |
| BR-34.4 | Singleton instance | `/` zero | **FAIL** | multi-layer | One head + CI |
| BR-35.1 | Browser/Googlebot/Social consistency | 10 matrix | **FAIL** | Zalo≠FB | Owner Zalo |
| BR-36.1 | SERP chain audit | no GSC | PARTIAL | Indexed/SERP missing | GSC Wave C |
| BR-37.1 | SEO-ready by default | article auto | PARTIAL | Admin fields | Empty-SEO publish proof |
| BR-45.0 | Affiliate not indexable SEO | Index Universe | **PASS** | — | — |
| BR-45.1 | Clean = only SEO identity | 09 | **PASS** | — | — |
| BR-45.2 | PID ≠ SEO identity | 09 | **PASS** | — | — |
| BR-45.3 | Attr OK; no sitemap/canon/OG-SD; noindex | 09 | **PASS** | — | — |
| BR-45.4 | Must not preempt resolver | nginx rewrite | **PASS** | — | No Affiliate refactor |
| BR-45.5 | Metadata = Clean after resolve | 09 | **PASS** | — | — |
| BR-45.6 | Audit URL variant matrix | `02` AUD-45 | **PASS** | — | — |
| BR-45.7 | No refactor unless Owner | Plan/SoT | **PASS** | — | Owner if SEO-bound defect |
| BR-46.1 | Compatibility | attribution intact | **PASS** | — | — |
| BR-47.1 | Reuse | Foundation consume | **PASS** | — | — |
| BR-48.CONSIST | One URL one SEO | UA forks | PARTIAL | Zalo | Align crawler HTML |
| BR-48.DETERM | Determinism | Contract | PARTIAL | UA forks | Document or unify |
| BR-48.PERF | Performance | — | **UNRESOLVED** | no pack | Probe |
| BR-48.REL | Reliability | error shells | PARTIAL | no chaos | Failure inject |
| BR-48.OBS | Observability | inspect | PARTIAL | fleet thin | Fleet obs |
| BR-48.SEC | Security RBAC | Admin perms | PARTIAL | Matrix | Map |
| BR-48.AUDIT | Auditability | trace | PARTIAL | version | Audit log |
| BR-48.ROLL | Rollback | false | **FAIL** | — | Rollback UX |
| SC-01 | 100% types Contract | HOME/PAGE gaps | **FAIL** | — | B1 + PAGE |
| SC-02 | One SoT | BR-34.1 | PARTIAL | — | — |
| SC-03 | No uncontrolled ownership | BR-34.2 | **FAIL** | — | — |
| SC-04 | Canonical auto | BR-11 | PARTIAL | — | — |
| SC-05 | Robots auto | BR-13 | **PASS** | — | — |
| SC-06 | Sitemap eligibility | BR-14 | **PASS** | — | — |
| SC-07 | OG/Twitter auto | BR-15/16 | **FAIL** | — | — |
| SC-08 | SD auto | BR-21 | PARTIAL | — | — |
| SC-09 | Breadcrumb | BR-22 | **FAIL** | — | — |
| SC-10 | Default image | BR-17 | PARTIAL | — | — |
| SC-11 | Title/Desc auto | BR-19/20 | PARTIAL | — | — |
| SC-12 | Override governed | BR-01/02 | PARTIAL | — | — |
| SC-13 | Favicon/identity | BR-04/05 | PARTIAL | — | — |
| SC-14 | Human/Crawler unified | BR-35 | **FAIL** | — | — |
| SC-15 | Preview | BR-28 | PARTIAL | — | — |
| SC-16 | Health | BR-29 | PARTIAL | — | — |
| SC-17 | Versioning | BR-30 | **FAIL** | — | — |
| SC-18 | Rollback | BR-48.ROLL | **FAIL** | — | — |
| SC-19 | RBAC | BR-33 | PARTIAL | — | — |
| SC-20 | Traceability | BR-31 | PARTIAL | — | — |
| SC-21 | Don’t break Affiliate | BR-45 | **PASS** | — | — |
| SC-22 | Clean identity | BR-45.1 | **PASS** | — | — |
| SC-23 | PID policy | BR-45.3 | **PASS** | — | — |
| SC-24 | Variant matrix | AUD-45 | **PASS** | — | — |
| SC-25 | No code for normal SEO ops | Admin+code pipes | PARTIAL | UA/nginx still code | Ops-only proof |
| SC-26 | Google machine-readable | no GSC | PARTIAL | — | GSC |
| SC-27 | Audit before impl | `02` APPROVED | **PASS** | gate historical | — |
| SC-28 | SoT after Audit | `03` LOCKED | **PASS** | — | — |
| SC-29 | Future docs | stale headers | PARTIAL | BRD/`02` vs Plan | Sync governance docs |
| SC-30 | HTTP in Contract | BR-06.3/06.4 | PARTIAL | — | — |
| SC-31 | Conflict deterministic | BR-10.2 | PARTIAL | — | — |
| SC-32 | Singleton tags | BR-34.4 | **FAIL** | — | — |

\*PASS\* = Googlebot/FB shell PASS; Zalo excluded.

---

## E. Required Corrections (map BR — không generic)

| # | BR / Req ID | Evidence | Problem | Required correction |
|---|-------------|----------|---------|---------------------|
| 1 | BR-07.HOME, BR-34.*, BR-15, SC-01/32 | `10` RC-1; nginx `location = /` | `/` empty SEO all UA | Gắn `seo_shell` cho `/` (Owner chốt pageKey) |
| 2 | BR-15.1, BR-16.1, BR-17.1, SC-07 | `10` RC-3; head-renderer | relative `og:image` | Absolutize `https://iflux.vn`+path trong Contract/head-renderer |
| 3 | BR-35.1, BR-34.3, SC-14 | `10` RC-2; nginx CẤM Zalo | Zalo ≠ social First HTML | Owner chốt Zalo=crawler → thêm UA; hoặc accept Human-only residual |
| 4 | BR-34.4, BR-29.3, SC-32 | detectSingleton incomplete | Singleton không chứng minh | Mở rộng detector + CI live HTML; cắt competing writers |
| 5 | BR-01.3, BR-37.1, SC-11/12 | Admin SEO inputs | Manual vì thiếu auto UX | Auto-resolve mặc định; manual = override |
| 6 | BR-22.1, SC-09 | no breadcrumb module | Missing | Contract + emit breadcrumb |
| 7 | BR-26.1, BR-07.PAGE | 09 GAP | Pagination | Owner N/A lock **hoặc** policy engine |
| 8 | BR-30.1, BR-48.ROLL, SC-17/18 | versionHistory/rollback false | Missing | Version+rollback phase |
| 9 | BR-36.1, BR-05.2, SC-26 | no GSC | SERP unproven | GSC Declared→Indexed→SERP |
| 10 | BR-11.2 | `PAGE_KEY_TO_PATH['cau-chuyen']='/chu-de'` | Stale path | Đổi `/cau-chuyen` |
| 11 | BR-18.1 | WebP-only OG | Social format risk | Owner: JPEG/PNG policy |
| 12 | §51 / SC-29 | BRD/`02` vs Plan `05` | Stale governance text | Sync headers: Impl authorized; Wave B open; epic not closed |
| 13 | BR-07.WATCH/SEARCH | Owner #2 | Out of BRD mandatory vs Owner lock | Owner **explicit residual accept** |
| 14 | BR-12.3, BR-45.7 | Affiliate PASS | — | **Không** refactor Affiliate |

---

## F. What prior “PASS” artifacts must NOT mean

| Artifact claim | Challenge |
|----------------|-----------|
| `06`/`09` hub bot title PASS | ≠ epic BR PASS; ≠ social OG PASS; ≠ HOME `/` |
| BR-15…16 PASS on og:title/url | **Withdrawn** — need `og:image` social-valid |
| Affiliate PASS | ≠ OG/social PASS; ≠ HOME PASS |
| Conflict policy PASS in API sample | ≠ fleet HTML singleton PASS |
| Plan Impl AUTHORIZED | ≠ Verification closed; ≠ BRD full conformance |

---

## G. STOP (review-time)

Review **đóng** tại thời điểm challenge. Không mở Plan mới từ review alone.

---

## H. Remediation batch 2026-08-10 ~21:50 (Owner: fix được ngay)

| Fixed now | Evidence | BR / SC touched |
|-----------|----------|-----------------|
| `/` bot → `@seo_shell_community` (Clean canon `/cong-dong`) | FB/Googlebot First HTML có title+og:image absolute | BR-07.HOME, BR-15 (partial), SC-01 |
| Absolutize `og:image` / favicon / logo in Contract + head defense | Hub/article `og:image` = `https://iflux.vn/media/…` | BR-15.1, BR-16.1, BR-17.1, SC-07 |
| `PAGE_KEY_TO_PATH['cau-chuyen']` → `/cau-chuyen`; `/` → community | Code | BR-11.2 |
| Expand `detectSingletonViolations` fields | Code | BR-29.3 (detector only — not full BR-34.4) |

| Still need Owner | Why not auto-fixed |
|------------------|--------------------|
| Zalo UA = crawler? | Intentional nginx CẤM; product decision (BR-35 / SC-14) |
| Breadcrumb engine | SOL-BC designed, not shipped (BR-22 / SC-09) |
| Pagination SEO | No product `?page=` policy (BR-26 / BR-07.PAGE) |
| Versioning / Rollback UX | Foundation gap flags false (BR-30 / BR-48.ROLL) |
| Image ALT / social JPEG|PNG | BR-18 beyond absolutize |
| Admin SEO override-only UX | BR-01.3 product UX |
| WATCH/SEARCH | Owner lock #2 |
| GSC SERP evidence | BR-36 / SC-26 |

**Affiliate:** unchanged PASS — no redesign.

**Wave B:** still **OPEN** until Owner accepts residual + social re-scrape (Zalo still SPA).
