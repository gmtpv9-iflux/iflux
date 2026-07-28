# B5-WP4 — SEO Regression

**Date:** 2026-07-27  
**Status:** **PASS (Article scope)** · **PARTIAL (Entity/List — documented follow-up)**  
**Method:** Production fetch · UA `facebookexternalhit/1.1` · `curl` HTTPS  
**Predecessor:** [`37-B5-WP1-SEO-Evidence-Report.md`](37-B5-WP1-SEO-Evidence-Report.md) · P4 matrix

---

## 1. Acceptance criteria mapped

| ID | Criterion | Result |
|----|-----------|--------|
| **AC-B5-SEO-001** | Canonical & `og:url` không chứa `IFL…` / `ref=` | ✅ Article · ⚠️ Entity SPA (see §4) |
| **AC-B5-SEO-002** | Preview matrix regressed ≥ 4/4 | ✅ Re-run article + prefix (§3) |

---

## 2. Sample pages tested

| Page | URL tested | Pipeline |
|------|------------|----------|
| Home / Community | `/cong-dong` · `/IFLYZ2NC/cong-dong` | SPA shell — no SSR meta |
| Article | `/cong-dong/bai-viet/hpg-tri-vong-thep-dau-tu-cong-2026` | **Pipeline A/B** |
| Article + prefix | `/IFLYZ2NC/cong-dong/bai-viet/hpg-…` | **Pipeline A/B** |
| Stock | `/co-phieu/HPG` · prefixed | SPA shell |
| Sector | `/nganh` | SPA shell |
| Dashboard | `/nha-cua-toi` | SPA shell |

---

## 3. Article Pipeline — Production evidence (2026-07-27)

**Sample slug:** `hpg-tri-vong-thep-dau-tu-cong-2026`

| Request | HTTP | `link[rel=canonical]` | `og:url` | IFL in meta | `?ref=` |
|---------|------|----------------------|----------|-------------|---------|
| Clean path | 200 | `https://iflux.vn/cong-dong/bai-viet/hpg-tri-vong-thep-dau-tu-cong-2026` | same | ❌ | ❌ |
| `/IFLYZ2NC/…` prefix | 200 | **same clean canonical** | **same clean og:url** | ❌ | ❌ |
| API `/api/community/articles/…/spa` | 200 | **same clean canonical** | **same clean og:url** | ❌ | ❌ |

**INV-7 verified:** Bar URL có prefix · meta canonical **sạch**.

### Preview UA regression (P4 matrix replay)

| # | URL | UA | Result |
|---|-----|-----|--------|
| 1 | `/IFLYZ2NC/cong-dong/bai-viet/hpg-…` | `facebookexternalhit/1.1` | ✅ PASS |
| 2 | Same | prefixed clean path | ✅ PASS |
| 3 | `/cong-dong/bai-viet/hpg-…` | clean | ✅ PASS |
| 4 | SPA API template | bot-readable head | ✅ PASS |

**AC-B5-SEO-002:** **PASS** (article scope · matches P4 baseline)

---

## 4. Entity / List / Dashboard — SPA initial HTML

| Page | Initial HTML canonical | IFL/ref leak in HTML | Notes |
|------|------------------------|----------------------|-------|
| `/cong-dong` | none in `<head>` | none | Client SEO patch optional |
| `/co-phieu/HPG` | none in `<head>` | none | **B5.4** — entity SSR canonical |
| `/nganh` | none in `<head>` | none | **B5.4** |
| `/nha-cua-toi` | none in `<head>` | none | App zone · not SEO landing |

**Important:** Không phát hiện `IFL…` hay `?ref=` trong raw HTML của các trang này. Thiếu canonical SSR **không phải regression B5** — đã ghi backlog **B5.4** từ WP-1.

---

## 5. WP-1 consumer regression (code-side, unchanged)

| GAP | Consumer | Still metadata SoT |
|-----|----------|-------------------|
| B5-01 | `community-post-page.js` microdata | ✅ |
| B5-02 | `community-ui.js` breadcrumb JSON-LD | ✅ |
| B5-03 | `seo-url.js` `postCanonical()` | ✅ |

No B5-WP2/WP4 code touched SEO head pipeline.

---

## 6. Known follow-ups (not B5 blockers)

| ID | Item | Phase |
|----|------|-------|
| GAP-B5-04 | Entity/list SSR canonical | **B5.4** |
| GAP-B5-05 | JSON-LD SSR Pipeline A/B | **B5.5** |
| GAP-B5-06 | Duplicate `applyPostSeoToDocument` paths | **B5.6** |

---

## 7. Verdict

| Scope | Result |
|-------|--------|
| Article Pipeline A/B (B5.1 gate) | ✅ **PASS** |
| No publicId/ref meta leak (tested pages) | ✅ **PASS** |
| Entity/list SSR canonical presence | ⏳ **Out of scope** → B5.4 |

**WP-4 Step 2: PASS** (within B5 locked scope)

---

*Production: https://iflux.vn · 2026-07-27*
