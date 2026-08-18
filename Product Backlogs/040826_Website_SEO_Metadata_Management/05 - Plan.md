CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# 05 — Plan

# Website SEO Metadata Management & SEO Platform

| | |
|--|--|
| **Task ID** | `040826_Website_SEO_Metadata_Management` |
| **BRD** | [`01 - Business Requirement.md`](01%20-%20Business%20Requirement.md) · §0 · 🔒 OWNER LOCKED (rev.C) |
| **Audit** | [`02 - Mandatory-Audit.md`](02%20-%20Mandatory-Audit.md) · 🔒 APPROVED rev. **C** (V1–V15) |
| **SoT** | [`03 - Governing SoT.md`](03%20-%20Governing%20SoT.md) · 🔒 OWNER LOCKED rev. **B.3** |
| **Solution** | [`04 - Solution Design.md`](04%20-%20Solution%20Design.md) · **Rev D.1.2** · 🔒 OWNER LOCKED (absorb 2026-08-10) |
| **Prerequisite** | `090826_Site_Metadata_Asset_Dynamic_Configuration_Foundation` — **consume**; MUST NOT recreate Admin SEO / Global·Page·asset authority |
| **Document** | Plan — execution index (Product Backlogs Governance **§2.6**) |
| **Date** | 2026-08-09 · **Align A.2** 2026-08-10 |
| **Rev** | **A.2** + **A.2.1** Owner Clarification 2026-08-11 |
| **Status** | 🔒 Plan A.2 · P0–P4 GO done · Residual clarified · **No new Impl GO** |
| **Governance** | BR → Audit → SoT B.3 → Solution D.1.2+D.1.3 → Plan A.2.1 → STOP |

> Plan = **execution index**. Không redesign BRD / Audit / SoT / Solution.  
> Trace: `BR → AUD → SOT → SOL → PLAN → Impl → Evidence → Verification → Closure`.  
> Mục tiêu Plan = đạt **BR Checklist §0**; ngữ cảnh gap = **Audit V1–V15**; chính sách = **SoT B.2**; HOW = **Solution D.1.1**.

---

# 0. Gate & hierarchy

```text
01 BRD            🔒 LOCKED (rev.C)
02 Audit          🔒 APPROVED (rev.C) · V1–V15
03 SoT            🔒 LOCKED (B.2) · HTTP · D-SEO-11 · Singleton
04 Solution       🔒 LOCKED (D.1.1) · D-SEO-09 principle · Foundation consume
05 Plan           🔒 OWNER LOCKED  ← THIS
06 Impl           ✅ AUTHORIZED (theo Plan)
07 Verification   `06 - Verification-Evidence` — sau P9 handoff
```

**Cấm** tuyên bố BR PASS / đóng epic ở tầng Impl. Chỉ Verification + Owner acceptance mới đóng.

---

## 0.1 Implementation safety rules (bắt buộc)

1. Inspect existing implementation **before** creating new code/schema.
2. **Consume Foundation `090826`** for Global/Page/asset/public effective SEO config — **cấm** Admin “System → SEO Settings” thứ hai.
3. Reuse Affiliate/Public Identity resolver; **cấm** refactor attribution trừ defect SEO-boundary + Owner (BR-45.7).
4. Reuse Vietnamese-first routes (`IfluxSeoUrl` / existing route authority); **cấm** English slug migration (`/stocks`, …).
5. Preserve `/co-phieu/{ticker}`.
6. Do not delete legacy metadata writers until replacement pipeline is live **and** verified (singleton path).
7. Do not change unrelated modules.
8. Every migration must be backward-compatible with Production.
9. Every runtime change must have a rollback path.
10. **No** Plan redesign of Solution invariants (D-SEO-09 layered principle; D-SEO-11 precedence; Singleton = Contract Violation).

---

# 1. Plan purpose

Chuyển Solution D.1.1 thành chuỗi workstream để:

1. Một **SEO Contract** (gồm HTTP Status) cho mọi public URL type trong BR-07.
2. **Conflict resolution** deterministic (D-SEO-11) + Health ERROR cho invalid states.
3. **Singleton** authoritative head emission (một owner render).
4. **Index Boundary** layered (D-SEO-09) cho decorated / Affiliate variants — không phá attribution.
5. **First HTML** đủ cho list/hub (vá Audit V2) + reuse article path (V3).
6. **Sitemap** sống + robots coherence (vá V4/V5).
7. **Identity/favicon** wire từ Foundation (vá V6) — không fork store.
8. OG / Twitter / SD / breadcrumb / internal Clean targets từ Contract.
9. Preview + Health + observability.
10. **Không** rebuild Foundation CMS; chỉ extend platform controls cần thiết.

---

# 2. Audit root cause → Plan focus

```text
ROOT (Audit C): thiếu SEO Platform / Contract + ownership phân tán
        ↓
Plan builds: Contract · Conflict · Singleton head · Sitemap · Index Boundary
        ↓
Plan consumes: Foundation config/assets · Affiliate resolver · VN routes
```

| Audit | Severity | Plan workstream |
|-------|----------|-----------------|
| V1 | 🔴 | P1 Contract + P8 CMS consume |
| V2 | 🔴 | P4 First HTML list/hub |
| V3 | 🟠 | P4 reuse article → Contract |
| V4 | 🟠 | P5 robots governance in-repo |
| V5 | 🔴 | P5 sitemap generator |
| V6 | 🔴 | P8 favicon/identity from Foundation |
| V7 | 🔴 | P4 singleton ownership transfer |
| V8 | 🟢 | P2 preserve Affiliate boundary |
| V9 | 🟠 | P2 D-SEO-09 layered enforcement |
| V10 | 🟠 | P2 variant classification (`?ref=`/`?r=`/publicId) |
| V11 | 🟠 | P4·P7·P8 SERP machine-readable chain |
| V12 | 🔴 | P3 auto/manual field classification |
| V13 | 🔴 | P1 HTTP in Contract |
| V14 | 🔴 | P1·P7 conflict engine + Health |
| V15 | 🟠 | P4·P7 singleton detection |

---

# 3. Owner / Solution locks Plan must obey

| ID | Lock | Plan implication |
|----|------|------------------|
| **D-SEO-01** | Index Universe = Clean Public | P2 classification + eligibility |
| **D-SEO-02** | Affiliate no-refactor | P2 consume resolver only |
| **D-SEO-03** | One SEO Contract | P1 single contract model |
| **D-SEO-04** | Automatic default | P3 templates/rules |
| **D-SEO-05** | First HTML | P4 crawler-visible head |
| **D-SEO-06** | Sitemap/robots coherence | P5 |
| **D-SEO-07** | Identity/favicon | P8 consume Foundation |
| **D-SEO-08** | Reuse before replace | P0 inventory |
| **D-SEO-09** | Layered Index Boundary (principle) | P2 signal placement (Plan decisions below) |
| **D-SEO-10** | Vietnamese-first URLs | P0·P2 consume routes |
| **D-SEO-11** | Conflict precedence | P1·P7 |
| **§0.1.1 / §25.1** | Singleton | P4·P7 |
| **§28.4 Solution** | BR unchanged; Foundation consume | P0·P8 |

---

# 4. Workstream model

```text
P0  Inventory freeze — Foundation + SEO fragments + Affiliate boundary
 ↓
P1  SEO Contract ← consume Foundation effective · HTTP class policy · Conflict (+ trace)
 ↓
P2  URL/Identity classification · Canonical · Index Boundary (D-SEO-09 signals)
 ↓
P3  Auto templates / rules / overrides (field ownership BR-02)
 ↓
P4  Singleton Head Renderer · First HTML (hub/list + article reuse)
 ↓
P5  Robots + Sitemap eligibility/generator (fix dead sitemap)
 ↓
P6  OG / Twitter / SD / Breadcrumb / Internal Clean links / Image fallback
 ↓
P7  SEO Health · Preview · Observability · Conflict/Singleton ERROR
 ↓
P8  Consume Foundation Admin/assets · VERSION/RBAC gap audit · verification tokens
 ↓
P9  Evidence A/B/C handoff → `06 Verification` (không PASS BR ở đây)
```

Không skip P0. Không cleanup competing writers trước P4 verify singleton. Không mở Affiliate redesign.

---

# 5. Plan decisions (execution — trong quyền Plan)

Solution khóa principle; Plan chốt **cụ thể hóa runtime** (đổi phá invariant → escalate Solution/Owner):

| # | Decision | Choice |
|---|----------|--------|
| **PD-01** | Config/Admin authority | **Consume** Foundation `site-seo` / Thiết lập SEO / brand payload / `page_seo_configs` / `/api/seo/effective` — **không** second Global store |
| **PD-02** | Contract host | **Consume** Foundation **effective SEO configuration** as **input** to the platform SEO Contract; **do not extend or duplicate** Foundation’s configuration authority. Platform owns Contract fields for HTTP / conflict / Index / render on top of that input |
| **PD-03** | D-SEO-09 signals (layered) | **All mandatory:** (1) variant classification after Affiliate resolve (2) SEO identity = Clean (3) Index Universe exclude (4) sitemap exclude (5) no independent OG/SD (6) non-index signal (7) attribution intact |
| **PD-04** | Non-index signal placement | **HTML path:** emit `meta robots` noindex (as applicable) from Contract. **Edge/response path** where HTML may be thin or bot pipeline skips body: add `X-Robots-Tag: noindex` on decorated/Affiliate publicId responses when feasible without breaking rewrite. **Never** rely on only one of the two if both paths exist. Exact nginx/Express hook = inventori trong P0 rồi implement P2 |
| **PD-05** | Conflict precedence | Exact SoT/Solution order: HTTP/redirect → Index Universe → Canonical → Robots → Sitemap → OG URL → SD URL |
| **PD-06** | Singleton emission | One Head Renderer owns title/description/canonical/robots/og:*/twitter:*; migrate article/nginx/SPA writers onto Contract; duplicates = Health ERROR |
| **PD-07** | Sitemap | Generate from eligibility; **exclude** decorated/Affiliate variants; fix Prod 404; robots.txt Sitemap URL must match live generator (bring robots under governed repo/process) |
| **PD-08** | Favicon/identity | Wire Foundation assets into public head + `favicon.ico` route; no parallel Media authority |
| **PD-09** | VERSION / RBAC | Inventory Foundation/Admin first; **extend** only gaps; no duplicate version table / permission matrix for same screens |
| **PD-10** | Coverage waves | Wave A: Home + Community list/hub + Article + Stock + 404/410 + Affiliate variants. Wave B: remaining BR-07 types. Wave C: polish SERP/preview/health |

---

# 6. Workstream detail

## P0 — Inventory & freeze

**Goal:** Evidence map of every metadata writer + Foundation surfaces + Affiliate rewrite points.

**Actions:**
- Inventory: Foundation modules, Admin Thiết lập SEO, article metadata, nginx bot pipelines, `seo-url.js`, manifests, static titles.
- URL variant matrix refresh (Clean / publicId / `?ref=` / `?r=`) — Audit SC-24 already partial; freeze for tests.
- Mark competing owners for deletion **after** P4.

**Exit:** Written inventory attached to evidence; no new authority created.

## P1 — SEO Contract + HTTP + Conflict

**Goal:** BR-06 / V13 / V14 · Solution §9 / §9.6 · D-SEO-11 — one Contract including HTTP; conflict engine; **deterministic policy for all HTTP classes** (not only happy-path tests).

**Boundary (PD-02):**

```text
Foundation effective config  (authority / source — unchanged)
        ↓  consume as input
Platform SEO Contract        (HTTP · URL · Index · Conflict · emit)
        ↓
Render / Sitemap / Health
```

MUST NOT: “extend Foundation resolver” so Foundation becomes owner of platform Contract semantics.

**Actions:**
- Define Contract schema fields per Solution §8 (+ `http.status` / redirect).
- Implement conflict resolver per PD-05.
- Source/mode/template/version trace fields (BR-31).
- **Define deterministic HTTP class handling** for statuses outside the named 200/301/302/404/410 set (incl. **403 / 429 / 5xx** and other non-success), covering renderability, robots, canonical, sitemap eligibility, OG/SD emission, Contract cache behavior, and Health classification (operationalizes Solution §9.6 — **không** mở rộng BR).

### P1.1 HTTP status classes (Plan policy)

| Class | Examples | Index / sitemap | Canonical self-identity | Robots / non-index signal | OG / SD identity | Contract cache | Health if treated as indexable |
|-------|----------|-----------------|-------------------------|---------------------------|------------------|----------------|--------------------------------|
| **Indexable success** | `200` (eligible resource) | Per Index Universe + rules | Clean SEO identity when eligible | Per rules | Same SEO identity | Cacheable per NFR | — |
| **Redirect** | `301`, `302` | Source ∉ sitemap; dest = identity | Source ≠ SEO identity | Source non-index as identity | No independent source OG/SD | Short / follow policy | ERROR if source sitemap/OG as identity |
| **Not-found / gone** | `404`, `410` | Not eligible | No valid self-canonical | Non-indexable | No SEO identity emission as indexable page | Prefer no long-lived “indexable” cache | ERROR |
| **Non-indexable non-success** | `403`, other client errors not redirect/gone | Not eligible | No independent SEO identity | Non-indexable; emit safe robots/`X-Robots-Tag` when a document is returned | Do not advertise as share/index identity | Do not cache as indexable success | ERROR if index/sitemap/canonical-self |
| **Transient / server failure** | `429`, `500`, `502`, `503`, `504`, … | Not eligible | No SEO identity from failure | Non-indexable for Contract purposes; avoid inventing rich SEO head that looks like a normal public page | Do not emit OG/SD as if success resource | **MUST NOT** cache failure Contract as durable success SEO | WARN/ERROR if crawled copy looks indexable |

**Invariant (all non-success outside governed redirect):** never silent `indexable success`. Aligns Solution §9.6.

**Exit:**
- Policy table P1.1 implemented in resolver (not docs-only).
- Unit/integration tests for `200` / `301` / `302` / `404` / `410` **and** representative `403` / `429` / `5xx` + invalid combos → prevented or Health ERROR.
- Evidence that Foundation effective config is **input**, Contract ownership stays on Platform.

## P2 — Classification · Canonical · D-SEO-09

**Goal:** BR-11/12/45 · V8/V9/V10 — Clean SEO identity; layered Index Boundary.

**Actions:**
- After Affiliate resolve: classify CLEAN vs DECORATED vs OTHER_NON_INDEX.
- Canonical → Clean Public.
- Apply PD-03/PD-04 signals.
- Preserve attribution.

**Exit:** Variant matrix: decorated ∉ sitemap; no independent OG/SD; attribution still works.

## P3 — Automatic templates / overrides

**Goal:** BR-01/02/08/09/19/20/37 · V12.

**Actions:**
- Field ownership classification enforced in resolver.
- Entity templates (Article/Stock/…) with fallbacks.
- Manual override exception path only.

**Exit:** Publish path SEO-ready without forcing Editor fill.

## P4 — Singleton First HTML

**Goal:** BR-07/34/35 · V2/V3/V7/V15.

**Actions:**
- One Head Renderer from Contract.
- Hub/list shells: full head (title, description, canonical, robots, OG, icons) — not title-only.
- Article pipeline migrates to Contract (reuse maturity).
- Detect duplicate singleton tags.

**Exit:** Sample curl first-HTML for hub + article + decorated URL meet Contract; no duplicate title/canonical.

## P5 — Robots + Sitemap

**Goal:** BR-13/14 · V4/V5.

**Actions:**
- Eligibility from Contract/Index Universe.
- Live `/sitemap.xml` (or governed equivalent) reflecting indexable Clean URLs only.
- robots.txt Sitemap pointer coherent + versioned governance.

**Exit:** Prod sitemap ≠ 404; decorated URLs absent; noindex+eligible = impossible via conflict.

## P6 — Social / SD / links / images

**Goal:** BR-15…23 · related SC.

**Actions:**
- OG/Twitter from Contract; og:url = Clean identity.
- JSON-LD from same identity.
- Breadcrumb model.
- Internal SEO targets = Clean Public only.
- Default OG image from Foundation asset.

**Exit:** Social bot sample + SD lint on Wave A URLs.

## P7 — Health · Preview · Observability

**Goal:** BR-28/29 · SC-30…32 · V11/V14/V15.

**Actions:**
- Health matrix Solution §34.
- Preview from Contract (no second engine).
- Observability chain URL → resolve → Contract → render.

**Exit:** Conflict/singleton ERROR demonstrable; preview matches emitted head.

## P8 — Foundation consume · gaps

**Goal:** BR-03/04/05/30/32/33 · V1/V6 · Solution §28.4.

**Actions:**
- Wire identity/favicon/defaults from Foundation into Head Renderer.
- Platform Admin: only extend Foundation surfaces for preview/health/sitemap/robots controls — **no** new SEO Settings tree under System.
- VERSION/RBAC gap audit → extend minimally.

**Exit:** Public favicon/icons OK; Admin still Thiết lập SEO; gap list documented if incomplete.

## P9 — Evidence handoff

**Goal:** Governance §2.7 prep — not BR PASS.

**Actions:**
- Evidence A/B/C per Wave.
- Open `06 - Verification-Evidence.md` when Owner opens verification gate.
- Do **not** claim epic complete in Plan/Impl notes alone.

---

# 7. Out of scope (Plan MUST NOT)

* Rebuild Foundation Global/Page SEO Admin or DB authority
* Affiliate/Public Identity redesign / publicId format changes
* URL migration to English routes
* Entity Auto-Linking / unrelated Community epics
* Claiming SERP ranking outcomes (only machine-readable readiness)
* Soft-passing Audit findings without Contract/Health evidence

---

# 8. Plan Checklist — BR execution index (Governance §2.6)

> Reference only — không copy lại chữ BRD. Status = PLANNED until Impl evidence.

| BR | Req ID | Audit | SoT | Solution | Plan / Action | Status |
|----|--------|-------|-----|----------|---------------|--------|
| BR-01 | BR-01.1 | AUD-01 | D-SEO-04 | SOL-AUTO | P3 | PLANNED |
| BR-01 | BR-01.2 | AUD-01 | D-SEO-04 | SOL-AUTO | P3 | PLANNED |
| BR-01 | BR-01.3 | AUD-01 | D-SEO-04 | SOL-AUTO | P3 | PLANNED |
| BR-01 | BR-01.4 | AUD-01 | D-SEO-04 | SOL-AUTO | P3 | PLANNED |
| BR-02 | BR-02.A | AUD-02 | §5 | SOL-AUTO·OVERRIDE | P3 | PLANNED |
| BR-02 | BR-02.B | AUD-02 | §5 | SOL-AUTO·OVERRIDE | P3 | PLANNED |
| BR-02 | BR-02.C | AUD-02 | §5 | SOL-AUTO·OVERRIDE | P3 | PLANNED |
| BR-02 | BR-02.D | AUD-02 | §5 | SOL-AUTO·OVERRIDE | P3 | PLANNED |
| BR-03 | BR-03.1 | AUD-03 | D-SEO-07·090826 | SOL-IDENT·CMS consume | P0·P8 | PLANNED |
| BR-03 | BR-03.2 | AUD-03 | D-SEO-07·090826 | SOL-IDENT·CMS consume | P0·P8 | PLANNED |
| BR-04 | BR-04.1 | AUD-04 | D-SEO-07·090826 | SOL-IDENT consume | P0·P8 | PLANNED |
| BR-04 | BR-04.2 | AUD-04 | D-SEO-07·090826 | SOL-IDENT consume | P0·P8 | PLANNED |
| BR-05 | BR-05.1 | AUD-05 | D-SEO-07·090826 | SOL-IDENT consume | P8 | PLANNED |
| BR-05 | BR-05.2 | AUD-05 | D-SEO-07·090826 | SOL-IDENT consume | P8 | PLANNED |
| BR-06 | BR-06.1 | AUD-06 | D-SEO-03 | SOL-CONTRACT | P1 | PLANNED |
| BR-06 | BR-06.2 | AUD-06 | D-SEO-03 | SOL-CONTRACT | P1 | PLANNED |
| BR-06 | BR-06.3 | AUD-06 | §3·D-SEO-11 | SOL-HTTP·CONFLICT | P1·P2 | PLANNED |
| BR-06 | BR-06.4 | AUD-06 | §3·D-SEO-11 | SOL-HTTP·CONFLICT | P1·P2 | PLANNED |
| BR-07 | BR-07.HOME | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.STATIC | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.COM | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.ARTICLE | AUD-07 | D-SEO-05 | SOL-HTML·REUSE | P4 | PLANNED |
| BR-07 | BR-07.MARKET | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.FLOW | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.MEMBER | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.FAQ | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.WATCH | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.STOCK | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.SECTOR | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.ECO | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.AUTHOR | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.TAG | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.COLL | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.SEARCH | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.PAGE | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.FUTURE | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.REDIR | AUD-07 | §3·D-SEO-11 | SOL-HTTP | P2·P4 | PLANNED |
| BR-07 | BR-07.404 | AUD-07 | §3·D-SEO-11 | SOL-HTTP | P2·P4 | PLANNED |
| BR-07 | BR-07.410 | AUD-07 | §3·D-SEO-11 | SOL-HTTP | P2·P4 | PLANNED |
| BR-07 | BR-07.QUERY | AUD-07 | D-SEO-05·10 | SOL-CONTEXT·HTML | P4·P5 | PLANNED |
| BR-07 | BR-07.REF | AUD-07 | D-SEO-01/02·09 | SOL-AFF·INDEX | P2·P4 | PLANNED |
| BR-07 | BR-07.PID | AUD-07 | D-SEO-01/02·09 | SOL-AFF·INDEX | P2·P4 | PLANNED |
| BR-08 | BR-08.ARTICLE | AUD-08 | §6 | SOL-TMPL·AUTO | P3 | PLANNED |
| BR-08 | BR-08.STOCK | AUD-08 | §6 | SOL-TMPL·AUTO | P3 | PLANNED |
| BR-08 | BR-08.SECTOR | AUD-08 | §6 | SOL-TMPL·AUTO | P3 | PLANNED |
| BR-08 | BR-08.AUTHOR | AUD-08 | §6 | SOL-TMPL·AUTO | P3 | PLANNED |
| BR-08 | BR-08.TMPL | AUD-08 | §6 | SOL-TMPL·AUTO | P3 | PLANNED |
| BR-09 | BR-09.1 | AUD-09 | §6 | SOL-TMPL | P3 | PLANNED |
| BR-09 | BR-09.2 | AUD-09 | §6 | SOL-TMPL | P3 | PLANNED |
| BR-10 | BR-10.1 | AUD-10 | §9 | SOL-TMPL | P3 | PLANNED |
| BR-10 | BR-10.2 | AUD-10 | D-SEO-11 | SOL-CONFLICT·HEALTH | P1·P7 | PLANNED |
| BR-11 | BR-11.1 | AUD-11 | §8·D-SEO-01 | SOL-CANON | P2 | PLANNED |
| BR-11 | BR-11.2 | AUD-11 | §8·D-SEO-01 | SOL-CANON | P2 | PLANNED |
| BR-12 | BR-12.1 | AUD-12 | D-SEO-01/02 | SOL-CANON·INDEX·AFF | P2 | PLANNED |
| BR-12 | BR-12.2 | AUD-12 | D-SEO-01/02 | SOL-CANON·INDEX·AFF | P2 | PLANNED |
| BR-12 | BR-12.3 | AUD-12 | D-SEO-01/02 | SOL-CANON·INDEX·AFF | P2 | PLANNED |
| BR-13 | BR-13.1 | AUD-13 | D-SEO-06 | SOL-INDEX | P2·P5 | PLANNED |
| BR-14 | BR-14.1 | AUD-14 | D-SEO-06 | SOL-SITEMAP | P5 | PLANNED |
| BR-15 | BR-15.1 | AUD-15 | §11 | SOL-OG | P6 | PLANNED |
| BR-16 | BR-16.1 | AUD-16 | §11 | SOL-OG | P6 | PLANNED |
| BR-17 | BR-17.1 | AUD-17 | §12·090826 | SOL-IMG consume | P6·P8 | PLANNED |
| BR-18 | BR-18.1 | AUD-18 | §23 | SOL-IMG | P6 | PLANNED |
| BR-19 | BR-19.1 | AUD-19 | §7 | SOL-AUTO | P3 | PLANNED |
| BR-20 | BR-20.1 | AUD-20 | §6 | SOL-AUTO·TMPL | P3 | PLANNED |
| BR-21 | BR-21.1 | AUD-21 | §14 | SOL-SD | P6 | PLANNED |
| BR-22 | BR-22.1 | AUD-22 | §15 | SOL-BC | P6 | PLANNED |
| BR-23 | BR-23.1 | AUD-23 | §22 | SOL-LINK | P6 | PLANNED |
| BR-24 | BR-24.1 | AUD-24 | D-SEO-10 | SOL-URL | P0·P2 | PLANNED |
| BR-25 | BR-25.1 | AUD-25 | §21 | SOL-REDIR | P2·P5 | PLANNED |
| BR-26 | BR-26.1 | AUD-26 | §18 | SOL-CANON·INDEX | P2·P5 | PLANNED |
| BR-27 | BR-27.1 | AUD-27 | §24 | SOL-URL locale-ready | P3 | PLANNED |
| BR-28 | BR-28.1 | AUD-28 | §30 | SOL-PREV | P7 | PLANNED |
| BR-29 | BR-29.1 | AUD-29 | §31 | SOL-HEALTH | P7 | PLANNED |
| BR-29 | BR-29.2 | AUD-29 | D-SEO-11 | SOL-HEALTH·CONFLICT | P7 | PLANNED |
| BR-29 | BR-29.3 | AUD-29 | §0.1.1 | SOL-SINGLETON·HEALTH | P4·P7 | PLANNED |
| BR-30 | BR-30.1 | AUD-30 | §28·090826 | SOL-VERSION extend | P8·gap | PLANNED |
| BR-31 | BR-31.1 | AUD-31 | §27 | SOL-VERSION·OBS | P1·P7 | PLANNED |
| BR-32 | BR-32.1 | AUD-32 | §32·090826 | SOL-CMS consume | P0·P8 | PLANNED |
| BR-33 | BR-33.1 | AUD-33 | §29·090826 | SOL-RBAC extend | P8·gap | PLANNED |
| BR-34 | BR-34.1 | AUD-34 | D-SEO-03 | SOL-CONTRACT·HTML | P1·P4 | PLANNED |
| BR-34 | BR-34.2 | AUD-34 | D-SEO-03 | SOL-CONTRACT·HTML | P1·P4 | PLANNED |
| BR-34 | BR-34.3 | AUD-34 | D-SEO-03 | SOL-CONTRACT·HTML | P1·P4 | PLANNED |
| BR-34 | BR-34.4 | AUD-34 | §0.1.1·§25.1 | SOL-SINGLETON | P4·P7 | PLANNED |
| BR-35 | BR-35.1 | AUD-35 | D-SEO-05 | SOL-HTML | P4 | PLANNED |
| BR-36 | BR-36.1 | AUD-36 | §35 | SOL-IDENT·HTML·OBS | P4·P7·P8 | PLANNED |
| BR-37 | BR-37.1 | AUD-37 | D-SEO-04 | SOL-AUTO·OVERRIDE | P3 | PLANNED |
| BR-45 | BR-45.0 | AUD-45 | D-SEO-01/02 | SOL-AFF·INDEX·CANON | P2 | PLANNED |
| BR-45 | BR-45.1 | AUD-45 | D-SEO-01/02 | SOL-AFF·INDEX·CANON | P2 | PLANNED |
| BR-45 | BR-45.2 | AUD-45 | D-SEO-01/02 | SOL-AFF·INDEX·CANON | P2 | PLANNED |
| BR-45 | BR-45.3 | AUD-45 | D-SEO-01·09 | SOL-INDEX §7 | P2 | PLANNED |
| BR-45 | BR-45.4 | AUD-45 | D-SEO-01/02 | SOL-AFF·INDEX·CANON | P2 | PLANNED |
| BR-45 | BR-45.5 | AUD-45 | D-SEO-01/02 | SOL-AFF·INDEX·CANON | P2 | PLANNED |
| BR-45 | BR-45.6 | AUD-45 | D-SEO-01/02 | SOL-AFF·INDEX·CANON | P2 | PLANNED |
| BR-45 | BR-45.7 | AUD-45 | D-SEO-01/02 | SOL-AFF·INDEX·CANON | P2 | PLANNED |
| BR-46 | BR-46.1 | AUD-46 | §43 | SOL-AFF | P2 | PLANNED |
| BR-47 | BR-47.1 | AUD-47 | D-SEO-08·090826 | SOL-REUSE | P0 | PLANNED |
| BR-48 | BR-48.CONSIST | AUD-48 | NFR | SOL-OBS·CACHE·FAIL | P1·P7 | PLANNED |
| BR-48 | BR-48.DETERM | AUD-48 | NFR | SOL-OBS·CACHE·FAIL | P1·P7 | PLANNED |
| BR-48 | BR-48.PERF | AUD-48 | NFR | SOL-OBS·CACHE·FAIL | P1·P7 | PLANNED |
| BR-48 | BR-48.REL | AUD-48 | NFR | SOL-OBS·CACHE·FAIL | P1·P7 | PLANNED |
| BR-48 | BR-48.OBS | AUD-48 | NFR | SOL-OBS·CACHE·FAIL | P1·P7 | PLANNED |
| BR-48 | BR-48.SEC | AUD-48 | NFR | SOL-OBS·CACHE·FAIL | P1·P7 | PLANNED |
| BR-48 | BR-48.AUDIT | AUD-48 | NFR | SOL-OBS·CACHE·FAIL | P1·P7 | PLANNED |
| BR-48 | BR-48.ROLL | AUD-48 | NFR | SOL-OBS·CACHE·FAIL | P1·P7 | PLANNED |
| BR-SC | SC-01 | AUD-SC | SoT B.2 | SOL registry | P1·P4 | PLANNED |
| BR-SC | SC-02 | AUD-SC | SoT B.2 | SOL registry | P1 | PLANNED |
| BR-SC | SC-03 | AUD-SC | SoT B.2 | SOL registry | P4 | PLANNED |
| BR-SC | SC-04 | AUD-SC | SoT B.2 | SOL registry | P2 | PLANNED |
| BR-SC | SC-05 | AUD-SC | SoT B.2 | SOL registry | P2·P5 | PLANNED |
| BR-SC | SC-06 | AUD-SC | SoT B.2 | SOL registry | P5 | PLANNED |
| BR-SC | SC-07 | AUD-SC | SoT B.2 | SOL registry | P6 | PLANNED |
| BR-SC | SC-08 | AUD-SC | SoT B.2 | SOL registry | P6 | PLANNED |
| BR-SC | SC-09 | AUD-SC | SoT B.2 | SOL registry | P6 | PLANNED |
| BR-SC | SC-10 | AUD-SC | SoT B.2 | SOL registry | P6·P8 | PLANNED |
| BR-SC | SC-11 | AUD-SC | SoT B.2 | SOL registry | P3 | PLANNED |
| BR-SC | SC-12 | AUD-SC | SoT B.2 | SOL registry | P3 | PLANNED |
| BR-SC | SC-13 | AUD-SC | SoT B.2 | SOL registry | P8 | PLANNED |
| BR-SC | SC-14 | AUD-SC | SoT B.2 | SOL registry | P4 | PLANNED |
| BR-SC | SC-15 | AUD-SC | SoT B.2 | SOL registry | P7 | PLANNED |
| BR-SC | SC-16 | AUD-SC | SoT B.2 | SOL registry | P7 | PLANNED |
| BR-SC | SC-17 | AUD-SC | SoT B.2 | SOL registry | P8·gap | PLANNED |
| BR-SC | SC-18 | AUD-SC | SoT B.2 | SOL registry | P8·gap | PLANNED |
| BR-SC | SC-19 | AUD-SC | SoT B.2 | SOL registry | P8·gap | PLANNED |
| BR-SC | SC-20 | AUD-SC | SoT B.2 | SOL registry | P1·P7 | PLANNED |
| BR-SC | SC-21 | AUD-SC | SoT B.2 | SOL registry | P2 | PLANNED |
| BR-SC | SC-22 | AUD-SC | SoT B.2 | SOL registry | P2 | PLANNED |
| BR-SC | SC-23 | AUD-SC | SoT B.2 | SOL registry | P2 | PLANNED |
| BR-SC | SC-24 | AUD-SC | SoT B.2 | SOL registry | P0·Audit | PLANNED |
| BR-SC | SC-25 | AUD-SC | SoT B.2 | SOL registry | P3·P8 | PLANNED |
| BR-SC | SC-26 | AUD-SC | SoT B.2 | SOL registry | P4·P6·P8 | PLANNED |
| BR-SC | SC-27 | AUD-SC | SoT B.2 | SOL registry | Audit DONE | PLANNED |
| BR-SC | SC-28 | AUD-SC | SoT B.2 | SOL registry | SoT DONE | PLANNED |
| BR-SC | SC-29 | AUD-SC | SoT B.2 | SOL registry | docs | PLANNED |
| BR-SC | SC-30 | AUD-SC | SoT B.2 | SOL registry | P1·P2 | PLANNED |
| BR-SC | SC-31 | AUD-SC | SoT B.2 | SOL registry | P1·P7 | PLANNED |
| BR-SC | SC-32 | AUD-SC | SoT B.2 | SOL registry | P4·P7 | PLANNED |


**Đếm:** 136 atomic rows — MUST khớp BRD §0.2.

---

# 9. Definition of Done (Plan level)

Plan A.1 sẵn sàng Owner LOCK khi:

* [x] Gate Solution D.1.1 LOCKED referenced
* [x] Workstreams P0–P9 cover Audit V1–V15
* [x] Foundation consume / no second SEO Settings explicit
* [x] **PD-02** = consume Foundation effective config as Contract **input** — không extend/duplicate Foundation authority
* [x] **P1.1** HTTP class policy (success / redirect / not-found·gone / non-indexable non-success / transient·5xx) — không chỉ test 200/301/302/404/410
* [x] D-SEO-09 signal placement decided (PD-03/PD-04) without weakening layered invariants
* [x] D-SEO-11 + Singleton in P1/P4/P7
* [x] Full BR §0.2 checklist indexed (no missing Req ID)
* [x] Owner LOCK Plan → Implementation AUTHORIZED

Implementation DoD ≠ Plan DoD. BR PASS chỉ sau Verification.

---

# 10. Final Plan statement

> **BR = WHAT** · **Audit = gaps** · **SoT B.2 = policy** · **Solution D.1.1 = HOW** · **Plan A.1 = execution order + runtime signal choices**.

> SEO Platform **consumes** Foundation effective configuration; **owns** SEO Contract / Conflict / Singleton / Index Boundary / Sitemap / First HTML on top — never absorbs Foundation configuration authority into “extended Foundation resolver”.

**End of Plan — Rev. A.1 · 🔒 OWNER LOCKED (2026-08-09) · Implementation AUTHORIZED**

---

# 11. Implementation progress (Wave A — 2026-08-09)

Không PASS BR tại đây. Evidence runtime:

| Wave | Đã ship | Notes |
|------|---------|--------|
| P0 | Inventory freeze (Foundation site-seo · article head · Affiliate nginx · sitemap gap) | Consume boundary giữ |
| P1 | `backend/src/modules/seo-platform/*` Contract + HTTP class P1.1 + Conflict | Unit tests PASS |
| P2 | Index Boundary DECORATED/`?ref=` + nginx `X-Robots-Tag` map | Layered PD-03/04 |
| P3 | Entity templates + field ownership + description fallback | `entity-templates.js` · Contract consume |
| P4 | Singleton First HTML · article → Contract head · hub shells (+ FAQ/Membership) | `detectSingletonViolations` · X-Original-URI |
| P5 | `/sitemap.xml` + Contract eligibility | **PASS Option A** — bỏ LIMIT 5000; gate `isContractSitemapEligible` |
| P5-B | Production verify sitemap + robots | Origin PASS · Public sitemap PASS · Public robots: **Owner CF pending** (xem §12) |
| P7 | Health §34 · Preview · Inspect observability | `/api/seo/platform/{preview,health,inspect}` |
| P8 | Foundation consume + VERSION/RBAC gap | Route `/favicon.ico` **wired** · asset = **config pending** (xem §12) · Admin preview gắn Contract · Gap revision/rollback UX |
| Wave B | **OPENED** 2026-08-10 | Gate §12 PASS · Evidence: [`06 - Verification-Evidence.md`](06%20-%20Verification-Evidence.md) — chưa BR PASS |

### P5 before / after (Production)

| | Before | After |
|--|------:|------:|
| Total URLs | 3 185 | **3 185** |
| Articles | 3 176 | **3 176** |
| Hubs | 9 | **9** |
| Decorated/`?ref=` | 0 | **0** |
| `LIMIT 5000` | yes | **removed** |
| Eligibility | SQL only | **SEO Contract** |

Scale test: 5 500 candidates → 5 445 included (>5000) · 55 noindex excluded · sitemap index mode when soft-cap exceeded.

Public checks: `https://iflux.vn/sitemap.xml` · `https://iflux.vn/robots.txt` · bot `https://iflux.vn/thi-truong`

---

# 12. Owner LOCK — AI crawl / training · CF robots · Favicon config (2026-08-09)

## 12.1 Phân loại (Owner chốt — không mở defect SEO Platform)

```text
Cloudflare Manage robots.txt  →  PASS (Owner tắt Dashboard 2026-08-10)
Favicon                       →  PASS (Owner upload 2026-08-10)
SEO Platform robots origin    →  PASS (không đụng code)
```

```text
Owner tắt CF Manage robots.txt (Dashboard) + purge
Favicon: PASS (2026-08-10)
        ↓
Agent verify public robots PASS (2026-08-10 20:20 +07)
        ↓
Gate Wave B / 06 Verification — đủ điều kiện mở
```

**Cấm:** sửa `backend/src/modules/seo-platform/*` chỉ vì public robots CF hoặc favicon.

---

## 12.2 AI crawl / training policy — LOCKED

```text
search       = YES
use          = reference
ai-train     = NO

AI crawlers  = ALLOW
AI training  = DENY
```

**robots / Content-Signal (origin — SEO Platform) — PASS:**

```text
Content-Signal: search=yes,ai-train=no,use=reference
```

- **Không** `Disallow` GPTBot / ClaudeBot / Google-Extended / Amazonbot / Applebot-Extended / Bytespider / CCBot / meta-externalagent
- **Không** đổi SEO Contract · sitemap · canonical · D-SEO-09 architecture
- Mở `ai-train=yes` sau này = policy decision riêng

---

## 12.4 Favicon — configuration completion (không phải blocker kiến trúc)

```text
Foundation favicon_url  →  SEO Platform consume  →  /favicon.ico
```

- Route **đã wire** — Owner upload asset trong **Thiết lập SEO hệ thống**.
- **Không** mở defect / **không** sửa code chỉ vì chưa có asset.

### Verify favicon (2026-08-10 — Owner uploaded)

| Check | Result |
|-------|--------|
| `https://iflux.vn/favicon.ico` | **HTTP 200** `image/webp` (~32KB) |
| Verdict | **PASS** |

**Status:** `PASS` (Owner upload).

---

## 12.3 Cloudflare Manage robots.txt — Owner/Agent CF config

**Owner (2026-08-10 ~20:20 +07):** đã tắt CF Manage robots.txt trên Dashboard.

**Agent verify public (sau purge):** body = SEO Platform origin — header `# iFlux robots.txt — SEO Platform (040826)` · **không** còn `# BEGIN Cloudflare Managed content`.

**Agent attempt API trước đó (2026-08-10):** `PUT bot_management` → 9109 Unauthorized (`CF_API_TOKEN` chỉ Cache Purge). Owner tự tắt Dashboard → **không cần** mở rộng token cho gate này.

**Status:** `PASS` (Owner Dashboard + agent public verify 2026-08-10).

### Baseline verify (trước tắt — archive)

| Check | Result |
|-------|--------|
| `# BEGIN Cloudflare Managed content` | Còn → FAIL (đã hết sau Owner tắt) |
| Verdict lúc đó | `FAIL_PENDING_CF_TOKEN_SCOPE` |

### Checklist verify public robots (2026-08-10 sau tắt managed)

| Check | Expected | Result |
|-------|----------|--------|
| `Content-Signal: search=yes,ai-train=no,use=reference` | Có | **PASS** |
| `Allow: /` dưới `User-agent: *` | Có | **PASS** |
| `Sitemap: https://iflux.vn/sitemap.xml` | Có | **PASS** |
| Không `# BEGIN Cloudflare Managed content` | Không còn | **PASS** |
| Không CF `Disallow: /` GPTBot / ClaudeBot / Google-Extended… | Không còn | **PASS** |
| Origin robots (backend :3001) | Allow AI + Content-Signal | **PASS** |
| Verdict | | **PASS** |

---

## 12.5 Gate Wave B

| Điều kiện | Wave B |
|-----------|--------|
| Public robots **PASS** **và** favicon **PASS** | Được mở (historical 2026-08-10) |
| Favicon (2026-08-10) | **PASS** (global wire) |
| Public robots (Owner tắt CF Manage 2026-08-10) | **PASS** |
| Gate historical | **OPENED** — Owner 2026-08-10 · [`06 - Verification-Evidence.md`](06%20-%20Verification-Evidence.md) |
| **Gate sau Owner Final Decision (2026-08-10)** | **STOPPED** — không tiếp tục impl Wave B items chưa qua governance absorb + Owner GO |

---

# 13. Plan alignment A.2 — Owner Final Decision (2026-08-10)

**Không tạo Plan mới.** Alignment trên Plan này với SoT B.3 · Solution D.1.2 · Register `12` · Audit `13`.

## 13.1 Hard stop → GO OPENED (scoped)

```text
Owner GO 2026-08-10: Implementation AUTHORIZED chỉ theo
[`14 - Implementation GO Scoped.md`](14%20-%20Implementation%20GO%20Scoped.md)
+ Plan A.2 PD trong scope P0–P4.
CẤM tự mở Singleton / BR-01.3 rewrite / Breadcrumb / Versioning / WATCH-SEARCH / GSC.
```

## 13.2 PD addenda (execution index only)

| ID | Alignment |
|----|-----------|
| **PD-11** | Homepage: pageKey `community` for `/`; Clean identity `/cong-dong`; verify anti-duplicate (canon/OG/SD/sitemap/shell/SPA) |
| **PD-12** | AUTO = Admin template + deterministic resolve; UI show generated vs override; no AI SEO |
| **PD-13** | Favicon global-only; cleanup page `faviconUrl` API/store/resolver on Owner GO |
| **PD-14** | KEEP `former_slugs`+301; verify only after GO; no new redirect mechanism |
| **PD-15** | Entity templates + OG-once-per-type: consume Foundation; no duplicate config |
| **PD-16** | Article SEO Description KEEP; no refactor |
| **PD-17** | Zalo crawler: after Owner GO — existing shell UA only; Audit `13` baseline |
| **PD-18** | Breadcrumb SOL-BC → **Wave C DONE 2026-08-11** (Contract + BreadcrumbList First HTML + SPA align) |
| **PD-19** | Pagination **N/A** (Audit `13`); re-open if Product ships pages |
| **PD-20** | ALT track ≠ Social JPEG/PNG track; each Audit→Solution→Plan→Owner GO |
| **PD-21** | Versioning → Foundation backlog NOTSTART (out of epic) |
| **PD-22** | WATCH/SEARCH Lock #2 — no work |
| **PD-23** | Singleton detector KEEP; multi-pipeline PASS remains open |
| **PD-24** | GSC/SERP after stable; never replaces Architecture Verification |

## 13.3 Ready for Owner GO (later) vs not

| Ready after GO (governance absorbed) | Not ready / DEFER |
|--------------------------------------|-------------------|
| Verify Homepage identity model (KEEP code) | Breadcrumb Wave C |
| Verify former_slugs+301 (KEEP code) | Versioning Foundation |
| Favicon API residual cleanup | WATCH/SEARCH |
| Zalo UA into existing shell | Pagination (N/A) |
| Social JPEG/PNG (after Solution detail) | Claim BR-01.3 / BR-34.4 / SC-09 PASS |
| Image ALT (after Solution detail) | GSC as arch substitute |

## 13.4 Pointers

- Register: [`12 - Governance Deviation Register.md`](12%20-%20Governance%20Deviation%20Register.md)
- Audit Delta: [`13 - Audit Delta Owner Final Decision.md`](13%20-%20Audit%20Delta%20Owner%20Final%20Decision.md)
- Versioning backlog: [`../100826_SEO_Metadata_Versioning_Rollback_Foundation/00-README.md`](../100826_SEO_Metadata_Versioning_Rollback_Foundation/00-README.md)

**End Plan alignment A.2 — P0–P4 GO completed (Evidence `15`).**

---

# 14. Plan A.2.1 — Owner Clarification residuals (2026-08-11)

**Không tạo Plan mới.** Không Implementation trong turn này.

| Area | Owner decision | Plan action |
|------|----------------|-------------|
| Singleton BR-34.4 / SC-32 | **DEFER — no redesign GO** | Giữ residual FAIL/PARTIAL; PD-23 = detector KEEP only; **cấm** claim PASS |
| Image ALT policy | **LOCKED** — optional OG Image ALT + deterministic fallback · no AI · empty OK · reuse `cover.alt` | PD-20 updated; Admin field wiring **chờ GO riêng** |
| Breadcrumb BR-22 / SC-09 | **Wave C DONE** 2026-08-11 | PD-18 closed |
| Versioning / Rollback | **NOTSTART** Foundation | PD-21 unchanged |
| BR-01.3 | **PASS** (Owner) | PD-12 = closed; **không** mở E2E UX audit scope |

### PD-20 (revised)

```text
ALT ≠ Social JPEG/PNG.
og:image:alt P4 PASS (slice).
Full BR-18.1 HTML <img alt> / Admin OG Image ALT optional field =
  policy LOCKED in Solution D.1.3 §P — implementation only after Owner GO.
Resolution: override → cover.alt/image ALT → title → fallback → empty.
```

### PD-12 (revised)

```text
BR-01.3 = PASS (Owner 2026-08-11).
AUTO = Admin rule/template → deterministic resolve → optional override.
Không mở thêm task “chứng minh UX” để hợp thức hóa PASS này.
```

### PD-23 (revised)

```text
Singleton architecture residual DEFER.
Detector KEEP ≠ architecture PASS.
Future = Owner GO riêng Singleton.
```

### Impl gate

| May implement now? | Item |
|--------------------|------|
| **No** | Singleton redesign |
| **Done 2026-08-11** | Admin OG Image ALT UI (Owner GO via “tiếp tục làm”) |
| **Done 2026-08-11** | Breadcrumb Wave C (SOL-BC) |
| **No** | Versioning / WATCH / GSC |
| **No** | BR-01.3 “fix UX” project |

**Admin OG Image ALT:** shipped Production · see slice `16`.

