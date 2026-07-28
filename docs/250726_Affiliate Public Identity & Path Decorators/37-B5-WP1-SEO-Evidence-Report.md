# B5-WP1 — SEO Evidence Report (Article Scope)

**Date:** 2026-07-27  
**Status:** **PASS — WP-1 Exit Gate (Article scope)**  
**Owner sign-off:** 2026-07-27  
**Predecessor:** [`36-B5-Pre-Implementation-Audit.md`](36-B5-Pre-Implementation-Audit.md)  
**Scope:** Article Pipeline A/B + metadata consumers · **không** entity/list · **không** JSON-LD SSR

---

## 1. Policy B — LOCKED

```text
Navigation Identity     /IFLYZ2NC/cong-dong/bai-viet/{slug}
SEO Identity            /cong-dong/bai-viet/{slug}  (absolute: https://iflux.vn/…)
```

| Quyết định | Status |
|------------|--------|
| Tách Navigation ≠ SEO identity | ✅ |
| Không RSS canonical ngoài vào head/schema | ✅ |
| Route `/cong-dong/bai-viet/` giữ nguyên | ✅ |
| SEO-001 gate = Article Pipeline only (Option A) | ✅ |

---

## 2. Gate matrix — B5.1

| Gate | Criterion | Result |
|------|-----------|--------|
| **SEO-001** | Article có một canonical duy nhất (Pipeline A/B) | ✅ PASS |
| **SEO-002** | `og:url` ≡ canonical (article) | ✅ PASS |
| **SEO-003** | Schema/microdata URL consumers dùng metadata SoT | ✅ PASS (post GAP-01→03) |
| **SEO-004** | Không bypass RSS → SEO output | ✅ PASS |

**Out of scope (documented, không block):**

| Item | Phase |
|------|-------|
| Entity/list SSR canonical (`/co-phieu`, `/cong-dong`) | B5.4 |
| JSON-LD SSR Pipeline A/B | B5.5 (P2) |
| G7 duplicate SEO apply (`seo-url` vs `community-ui`) | B5.6 backlog |

---

## 3. Implementation — GAP-B5-01 → 03

| GAP | Fix | Verified |
|-----|-----|----------|
| **01** | `community-post-page.js` — `mainEntityOfPage` ← `postCanonical`/`metadata` | ✅ No `location.href` |
| **02** | `community-ui.js` — breadcrumb/geo JSON-LD ← `metadata.canonical` | ✅ |
| **03** | `seo-url.js` — `postCanonical()` metadata SoT only | ✅ No `seo.canonical_url` RSS |

Cache bust: `b5wp1_20260727` · deployed Production · CDN purged.

---

## 4. Production regression (head — pre/post WP-1)

Article mẫu: `hpg-tri-vong-thep-dau-tu-cong-2026` · prefix `IFLYZ2NC`

| Request | canonical | og:url | IFL in meta |
|---------|-----------|--------|-------------|
| `/cong-dong/bai-viet/hpg-…` | clean | = canonical | ❌ |
| `/IFLYZ2NC/cong-dong/bai-viet/hpg-…` | clean | = canonical | ❌ |
| Bot UA (Facebook/Zalo) | clean | = canonical | ❌ |

Head metadata **unchanged PASS** — WP-1 fix chỉ client consumers (microdata/breadcrumb/share derive input).

---

## 5. Owner notes (không blocker)

### B5.6 — SEO consumer consolidation

Hai đường apply song song:

```text
G6  seo-url.js      applyPostSeoToDocument()
G7  community-ui.js applySeoToDocument()
```

Hiện cùng consume `post.metadata` → không lỗi runtime. Kiến trúc mục tiêu: **1 SoT → 1 renderer**. Backlog — không vào WP-2.

### Entity SEO

Article SSR metadata PASS · Entity SPA metadata TODO — domain khác → **B5.4**.

---

## 6. Verdict

```text
WP-1 Exit Gate     ✅ PASS (Article scope)
WP-2 Share Funnel  🚀 GO — Pre-Audit next
Writer/Context     🔒 FROZEN (0 diff)
```

---

*WP-1 đóng — mở WP-2 Share Pre-Implementation Audit.*
