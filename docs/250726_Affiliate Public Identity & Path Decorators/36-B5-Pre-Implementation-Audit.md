# B5 — Pre-Implementation Audit (WP-1 SEO Metadata Boundary)

**Date:** 2026-07-27  
**Status:** **AUDIT PASS · Policy B APPROVED · WP-1 GAP-01→03 IMPLEMENTED**  
**Owner order:** B5-Pre-Implementation-Audit → **WP-1 SEO** → WP-2 Share → WP-3 Static (optional)  
**Scope lock:** [`35-B5-SEO-Share-Scope-Lock.md`](35-B5-SEO-Share-Scope-Lock.md) · frozen Writer/Context/route  
**Baseline:** [`13-P4-Evidence-Report.md`](13-P4-Evidence-Report.md)

---

## 0. Executive summary

| Câu hỏi Owner | Kết luận audit |
|---------------|----------------|
| `/IFLYZ2NC/cong-dong/bai-viet/abc` — canonical là **A** (có prefix) hay **B** (sạch)? | **B — sạch** · Production + Backend SoT xác nhận |
| `canonical` = `og:url`? | **Có** trên article Pipeline A/B (mẫu regressed PASS) |
| `publicId` / `ref` lọt vào SEO identity? | **Không** trên head · GAP-01→03 **fixed** (microdata/breadcrumb) |
| WP-2 Share | **Chưa mở** — chờ khóa policy WP-1 |

**Policy đề xuất khóa (Owner sign-off WP-1):**

> SEO identity (canonical · og:url · schema url) = **canonical path sạch** `https://iflux.vn/cong-dong/bai-viet/{slug}` — **không** owner prefix · **không** `?ref=`.  
> Affiliate identity = navigation + share outgoing (WP-2) — **tách domain**.

---

## 1. Owner gates — SEO-001 … SEO-004

| Gate | Tiêu chí | Article (Pipeline A/B) | Entity / list SPA | Verdict |
|------|----------|--------------------------|-------------------|---------|
| **SEO-001** | Mọi public page một canonical duy nhất | ✅ Article Pipeline A/B | ⚠️ Entity/list — **ngoài B5.1** (→ B5.4) | **PARTIAL** · gate B5.1 only |
| **SEO-002** | `og:url` ≡ canonical (không mâu thuẫn) | ✅ PASS (mẫu matrix) | ⚠️ Entity: og:url absent until JS | **PARTIAL** |
| **SEO-003** | Schema URL cùng policy canonical | ✅ Head patch · **GAP-01→03 fix B5.1** | ⚠️ JSON-LD SSR — **P2 / B5.5** | **PARTIAL** · article client |
| **SEO-004** | Không generator bypass policy | ✅ Backend + **GAP-03 fixed** | — | **PASS** (B5.1) |

**WP-1 exit gate (B5.1 — Owner 2026-07-27):** SEO-001..004 **PASS trên Article Pipeline A/B + metadata consumers** sau GAP-B5-01→03. Entity/list (GAP-B5-04) và JSON-LD SSR (GAP-B5-05) = **follow-up**, không block WP-1 exit.

---

## 2. Canonical policy — câu trả lời A vs B

### 2.1 Quyết định kiến trúc (evidence)

```text
Browser bar URL (navigation)     /IFLYZ2NC/cong-dong/bai-viet/{slug}   ← Writer decorate
SEO canonical / og:url (metadata)  /cong-dong/bai-viet/{slug}            ← clean (B)
```

| Layer | Owner | Prefix trong output? |
|-------|-------|----------------------|
| Navigation URL | `shell-url-writer.js` (FROZEN) | Có — khi `ownerPublicId` active |
| Article Metadata SoT | `resolveArticleMetadata` (backend) | **Không** |
| Head inject Pipeline A/B | `buildArticleMetadataHeadHtml` | **Không** |
| Client head patch | `applyPostSeoToDocument` → `page-definition` | **Không** (consume `post.metadata`) |

### 2.2 Backend SoT (locked behavior)

File: `backend/src/modules/community/community-articles.service.js`

```javascript
/* Chia sẻ link iFlux → url / canonical luôn URL iFlux (không dùng canonical RSS ngoài). */
const canonical = base + '/cong-dong/bai-viet/' + encodeURIComponent(slug);
return { url: canonical, canonical, ... };
```

RSS field `seo.canonical` (cafef.vn…) **không** đi vào Metadata SoT — verified mẫu `cen-land-…-tgr0`.

---

## 3. Generator inventory

### 3.1 Canonical + og:url

| # | Generator | File | Input | Output policy | Pipeline |
|---|-----------|------|-------|---------------|----------|
| G1 | **Article Metadata resolver** | `community-articles.service.js` · `resolveArticleMetadata` | article + origin | Clean iflux path | SoT |
| G2 | **Head HTML builder** | `buildArticleMetadataHeadHtml` | `meta.*` | `canonical` + `og:url` = cùng giá trị | A + B |
| G3 | **OG-only renderer** | `renderOpenGraphHtml` | meta | Bot preview + refresh → clean | A |
| G4 | **SPA shell injector** | `renderArticleSpaHtml` | meta + `post.html` | Strip template meta → inject G2 | B |
| G5 | **Page Definition applier** | `runtime/page-definition.js` · `setCanonical` / og meta | `definition.seo` | Manifest + runtime patch | B (client) |
| G6 | **Post SEO patch** | `seo-url.js` · `applyPostSeoToDocument` | `post.metadata` | canonical + og:url từ metadata | B (client) |
| G7 | **Community UI duplicate path** | `community-ui.js` · `applySeoToDocument` | `post.metadata` | Same as G6 | B (legacy parallel) |
| G8 | **Stock SEO patch** | `seo-url.js` · `applyStockSeoToDocument` | ticker detail | `stockCanonical` → clean absolute | B (client only) |
| G9 | **Page manifests** | `pages/*.manifest.js` | static seo block | Một số page có `robots`/`description` · **không** canonical | B boot |

### 3.2 Structured data (JSON-LD / microdata)

| # | Generator | File | Notes |
|---|-----------|------|-------|
| S1 | Post JSON-LD (head) | `seo-url.js` · `applyPostSeoToDocument` | `url: meta.canonical` · **client-only** |
| S2 | Post JSON-LD (store) | `community-store.js` · `buildJsonLd` | `mainEntityOfPage` ← canonical arg |
| S3 | Breadcrumb JSON-LD | `community-ui.js` · `applyStorySeoExtras` | Fallback `storyCanonical` / `location.href` |
| S4 | Geo-AI JSON-LD | `community-geo-ai.js` · `buildJsonLdBlocks` | `url: canonical` arg |
| S5 | Article microdata | `community-post-page.js` · `renderArticleMain` | `itemprop="mainEntityOfPage"` — **không** dùng metadata SoT |

### 3.3 nginx routing (read-side, không mutate meta)

```text
/IFL…/cong-dong/bai-viet/{slug}
    → rewrite strip prefix → /cong-dong/bai-viet/{slug}
    → UA bot  → Pipeline A (open-graph)
    → UA human → Pipeline B (spa)
```

File: `infra/nginx-iflux-production-locations.conf` L24–36 · L140–155.

---

## 4. Production verification (regressed P4 matrix)

Environment: `https://iflux.vn` · 2026-07-27  
Article mẫu: `hpg-tri-vong-thep-dau-tu-cong-2026` · Prefix: `IFLYZ2NC`

| # | Request | UA | canonical | og:url | IFL/ref in meta |
|---|---------|-----|-----------|--------|-----------------|
| 1 | `/cong-dong/bai-viet/hpg-…` | Human | clean | clean = canonical | ❌ |
| 2 | `/IFLYZ2NC/cong-dong/bai-viet/hpg-…` | Human | clean | clean | ❌ |
| 3 | `…?ref=IFLYZ2NC` | Human | clean | clean | ❌ |
| 4 | `/IFLYZ2NC/cong-dong/bai-viet/hpg-…` | `facebookexternalhit/1.1` | clean | clean | ❌ |
| 5 | `/IFLYZ2NC/cong-dong/bai-viet/hpg-…` | `ZaloBot/1.0` | clean | clean | ❌ |
| 6 | RSS article `cen-land-…-tgr0` | Human | clean iflux | clean | ❌ (head) |

**API Metadata SoT (mẫu HPG):**

```json
{
  "url": "https://iflux.vn/cong-dong/bai-viet/hpg-tri-vong-thep-dau-tu-cong-2026",
  "canonical": "https://iflux.vn/cong-dong/bai-viet/hpg-tri-vong-thep-dau-tu-cong-2026"
}
```

### 4.1 Entity / list pages (gap observation)

| Page | Initial HTML canonical | Initial og:url | Client patch |
|------|------------------------|----------------|--------------|
| `/co-phieu/HPG` | ❌ absent | ❌ absent | `applyStockSeoToDocument` after load |
| `/cong-dong` | ❌ absent | ❌ absent | manifest `documentTitle` only |
| `/IFLYZ2NC/cong-dong` | ❌ absent | ❌ absent | same |

**Bot crawlers** không chạy article pipeline cho stock/list — preview matrix P4 chỉ cover community/article; entity SEO = **WP-1 follow-up**.

### 4.2 JSON-LD in initial HTML

Article Pipeline B SSR: **0** `application/ld+json` blocks in `<head>` before JS.  
Schema chỉ xuất hiện sau `applyPostSeoToDocument` — bot OG path (A) **không** emit JSON-LD.

---

## 5. GAP register

| ID | Severity | Status | Notes |
|----|----------|--------|-------|
| **GAP-B5-01** | HIGH | ✅ **Fixed B5.1** | `community-post-page.js` — metadata SoT only |
| **GAP-B5-02** | MED | ✅ **Fixed B5.1** | `community-ui.js` breadcrumb/geo JSON-LD |
| **GAP-B5-03** | MED | ✅ **Fixed B5.1** | `seo-url.js` `postCanonical()` |
| **GAP-B5-04** | MED | ⏳ **B5.4** | Entity/list SSR canonical |
| **GAP-B5-05** | LOW | ⏳ **B5.5 (P2)** | JSON-LD Pipeline A/B SSR |
| **GAP-B5-06** | LOW | ⏳ Backlog | Consolidate duplicate apply paths |

---

## 6. publicId / ref — leak scan

| Surface | Scan | Result |
|---------|------|--------|
| `<link rel="canonical">` | Production matrix §4 | **Clean** |
| `<meta property="og:url">` | Production matrix §4 | **Clean** |
| `<meta name="*">` / og:* | Article head | **Clean** |
| HTML static `/IFLYZ2NC/cong-dong` | curl | `ref=` matches = **false positive** (`href=`, `crossorigin`) |
| JSON-LD (client) | Code review | Policy OK when metadata present · fallback paths = GAP-01/02 |
| Admin RSS ingest | `seo.canonical` stored | **Not** in Metadata SoT output — OK |

---

## 7. Dependency graph (WP-1 vs WP-2)

```text
                    ┌─────────────────────────┐
                    │ resolveArticleMetadata  │  ← SoT (backend)
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
        Pipeline A head   Pipeline B head   post.metadata API
              │                 │                 │
              └────────┬────────┘                 │
                       ▼                          ▼
              canonical = og:url (clean)    applyPostSeoToDocument
                       │                          │
                       │                    page-definition
                       │                          │
         WP-1 fix ─────┴── GAP microdata/breadcrumb/postCanonical
                       │
         WP-2 (later) ─┴── Share Foundation outgoing URL (không đụng head SoT)
```

**WP-2 explicitly out of scope for this audit** — share consumers listed in [`35-B5-SEO-Share-Scope-Lock.md`](35-B5-SEO-Share-Scope-Lock.md) §4 WP-2.

---

## 8. Grep evidence (generators)

```text
link rel="canonical" writers:
  backend/.../community-articles.service.js  buildArticleMetadataHeadHtml
  User_Web/.../runtime/page-definition.js    setCanonical
  User_Web/.../seo-url.js                    setCanonical (legacy duplicate)

og:url writers:
  buildArticleMetadataHeadHtml
  page-definition.js META_FIELDS
  applyPostSeoToDocument / applySeoToDocument / applyStockSeoToDocument

JSON-LD writers:
  page-definition.js setJsonLdEntries
  seo-url.js applyPostSeoToDocument
  community-store.js buildJsonLd
  community-ui.js applyStorySeoExtras (breadcrumb)
  community-geo-ai.js buildJsonLdBlocks
```

---

## 9. Owner sign-off + WP-1 scope (2026-07-27)

| Quyết định | Status |
|------------|--------|
| Navigation ≠ SEO identity | ✅ APPROVED |
| Không RSS canonical ngoài | ✅ APPROVED |
| Policy B (article `/cong-dong/bai-viet/{slug}`) | ✅ APPROVED — không redesign route |
| SEO-001 gate = Article Pipeline only (Option A) | ✅ APPROVED |
| WP-1 GAP-01→03 | ✅ GO · implemented |
| GAP-04 Entity SEO · GAP-05 JSON-LD SSR | ⏳ Follow-up |

### WP-1 implementation log

| GAP | File | Change |
|-----|------|--------|
| B5-01 | `community-post-page.js` | `mainEntityOfPage` ← metadata / `postCanonical` |
| B5-02 | `community-ui.js` | Breadcrumb + geo JSON-LD ← `metadata.canonical` |
| B5-03 | `seo-url.js` | `postCanonical()` ← metadata SoT |

Cache bust: `b5wp1_20260727`.

---

## 10. Status

| Item | Status |
|------|--------|
| B5-Pre-Implementation-Audit | ✅ **PASS** |
| SEO Identity Policy B | ✅ **APPROVED** |
| WP-1 Implementation (GAP-01→03) | ✅ **SHIPPED** |
| WP-1 Exit Gate | ✅ **PASS** (Article scope) · [`37-B5-WP1-SEO-Evidence-Report.md`](37-B5-WP1-SEO-Evidence-Report.md) |
| WP-2 Share Pre-Audit | ✅ **COMPLETE** · [`38-B5-WP2-Pre-Implementation-Audit.md`](38-B5-WP2-Pre-Implementation-Audit.md) |
| WP-2 Implementation | ✅ **COMPLETE** · [`39-B5-WP2-Share-Evidence-Report.md`](39-B5-WP2-Share-Evidence-Report.md) |
| WP-4 Closure | ✅ **PASS** |
| B5 Owner sign-off | ✅ **PASS — 2026-07-27** · [`39-B5-WP2-Share-Evidence-Report.md`](39-B5-WP2-Share-Evidence-Report.md) §12 |
| B5.6 SEO consumer consolidation | ⏳ Backlog (post B5) |

---

*B5.1 — metadata consumers khớp Policy B trên article. Entity SEO và schema SSR = phase riêng.*
