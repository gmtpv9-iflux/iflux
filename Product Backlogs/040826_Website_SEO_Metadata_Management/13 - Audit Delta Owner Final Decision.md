CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# 13 — Audit Delta · Owner Final Decision

# Epic 040826 · READ-ONLY · 2026-08-10

| | |
|--|--|
| **Mode** | READ-ONLY — no code · no deploy · no behavior change |
| **Purpose** | Evidence for governance absorb / Solution gaps |
| **Parent** | [`12 - Governance Deviation Register.md`](12%20-%20Governance%20Deviation%20Register.md) |
| **Production** | `https://iflux.vn` |

---

## 1. Pagination — BR-26 / BR-07.PAGE

### Verdict

**Exists indexable pagination product surface: NO → classify N/A bằng evidence.**

(Không tự kết luận trước audit; kết luận sau evidence.)

### Codebase

| Surface | Mechanism | Public SEO `?page=`? |
|---------|-----------|----------------------|
| Community feed | `offset` / infinite scroll | **No** |
| Entity lists | `loadMore` | **No** |
| Admin article list | `?page=` Admin API | Admin only |
| SEO Platform | No pagination SEO engine | — |

### Production (Googlebot)

| URL | Status | Canonical | Robots | Distinct pagination SEO? |
|-----|--------|-----------|--------|--------------------------|
| `/cong-dong?page=1` | 200 | `https://iflux.vn/cong-dong` | `index,follow` | **No** — same hub shell |
| `/cong-dong?page=2` | 200 | same hub | `index,follow` | **No** |
| `/thi-truong?page=2` | 200 | `https://iflux.vn/thi-truong` | `index,follow` | **No** |

### Sitemap

| Check | Result |
|-------|--------|
| Locs in sitemap | ~3390 |
| Locs with `page=` / `?page` | **0** |

### Classification

**N/A** — Product không có indexable pagination identity. Soft note: `?page=N` vẫn 200 + index,follow nhưng canonical gộp về hub (không phải pagination SEO product).

**Re-open Solution gap** chỉ khi Product ship listing `?page=` as SEO identity.

---

## 2. Image ALT — BR-18 (inventory only · tách Social format)

### SoT / Solution / Challenge

| Doc | Note |
|-----|------|
| BRD BR-18.1 | Editorial ALT, Caption, Credit |
| Solution §31 / SOL-IMG | ALT/width/height… |
| Challenge `11` | BR-18.1 FAIL |

### Sources

| Layer | Path / behavior |
|-------|-----------------|
| Cover editorial | `cover.alt` persist |
| RSS | `alt: enriched.title` (generated) |
| Feed DTO | `cover.alt \|\| null` |
| User Web | `seo.og_image_alt` → `cover.alt` → **title** fallback |
| Article SEO normalize | **không** write `og_image_alt` |
| Head renderer / Contract | **không** emit `og:image:alt` |

### Missing / weak cases

| Case | Type | Surfaces |
|------|------|----------|
| Empty cover.alt | Falls back to title | Feed, article hero |
| image_url-only feed | alt null | Cards |
| og_image_alt | FE read; not Contract | Gap |
| SEO Platform ALT | Absent | BR-18 residual |
| Avatars/onboarding | `alt=""` | a11y non-SEO |

**Next:** Solution amendment riêng (không gộp JPEG/PNG) → Plan → Owner GO → Impl.

---

## 3. Social image JPEG/PNG — tách ALT

### Absolute URL

Hubs/articles bot shells: `og:image` / `twitter:image` = **absolute** `https://iflux.vn/...` (authorized absolutize).

### Format

| Check | Result |
|-------|--------|
| Sample OG asset | `…/img-001.webp` · HTTP 200 · `image/webp` |
| Sibling `.png` / `.jpg` | **404** |
| Public JPEG/PNG for social | **Missing** |

### Gap

Solution chưa khóa JPEG/PNG social output policy đủ để PASS BR-18 format compatibility. Absolute URL OK; **WebP-only** = residual → Solution amendment trước impl.

---

## 4. Zalo crawler boundary

### Nginx (`infra/nginx-iflux-production-locations.conf`)

| Class | Bot UA includes Zalo? | Behavior |
|-------|----------------------|----------|
| Hub shells | **No** (googlebot, FB, Twitter, LinkedIn, Slack, Telegram…) | Zalo → SPA like Human |
| Article open-graph | Comment: **CẤM** Zalo\|WhatsApp\|FBAN (IAB=Human) | Zalo → `spa` (+meta), **not** `open-graph` pipe |

### Production matrix

| URL | UA | First HTML | OG |
|-----|-----|------------|-----|
| `/cong-dong` | ZaloShare | SPA ~empty title | **No OG** |
| `/cong-dong` | facebookexternalhit | seo_shell | Full OG |
| Article | ZaloShare | spa+meta in head | Full OG (webp) |
| Article | facebookexternalhit | open-graph pipe | Full OG |

### Owner Decision A implication

Zalo = crawler → cần amend SoT/Solution + Plan: thêm Zalo vào hub `418` shell path **và** align article path với existing shell architecture; **không** pipeline riêng; không phá IAB Human boundary beyond governed crawler UA list.

**CHƯA CODE** trong turn này.

---

## 5. Page-level Favicon residual

| Layer | Status |
|-------|--------|
| Admin UI page favicon | **Removed** 2026-08-10 |
| Admin global favicon | Present |
| API PUT page `faviconUrl` | **Still accepted** (`site-seo.routes.js`) |
| Store `page_seo_configs.payload.faviconUrl` | **Still stored** |
| Resolver PAGE > GLOBAL | **Still applies** for favicon |
| Runtime head | Emits page favicon if non-blank |

**Residual for Owner GO impl:** strip/ignore page-level favicon in API/patch/resolver so GLOBAL-only. Không tạo override mới.

---

## 6. Scorecard

| Area | Verdict | Gate |
|------|---------|------|
| Pagination | **N/A** (evidence) | Re-open if Product ships pages |
| Image ALT | Inventory gaps | Solution riêng |
| Social JPEG/PNG | Absolute OK; WebP-only | Solution amendment |
| Zalo | Hubs Human; articles spa+OG | SoT/Solution/Plan → Owner GO |
| Favicon page residual | API/store/resolver | Owner GO cleanup |
