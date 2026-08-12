# 06 — Verification Evidence (Handoff)

**Task:** `090826_Site_Metadata_Asset_Dynamic_Configuration_Foundation`  
**Doc role:** Evidence pack handoff for separate Verification (`06`) — **không** tuyên bố BR PASS / task closure.  
**Impl status:** Build deployed Production (2026-08-09).  
**Plan ref:** `05 - Plan.md` Rev A.1 · PL-09 handoff only.

---

## 1. Scope shipped (impl)

| PL | Nội dung | Evidence |
|----|----------|----------|
| PL-01 | Baseline inventory | Plan §13 |
| PL-02 | `page_seo_configs` + `media_usages` scope/owner_ref + Admin SEO APIs | Migration `054_site_seo_foundation.sql` applied on Prod DB `iflux` |
| PL-03 | Effective resolver + public `/api/seo/effective` | Curl Prod local: HTTP 200, fallback `site_name=iFlux` |
| PL-04 | Media upload/usages GLOBAL/PAGE + Admin URL/upload fields | `media.routes` `requireAdminAnyPermission`; Admin SEO forms register usages |
| PL-05 | Article metadata consumes Global via resolver | `attachArticleMetadata` async + `resolveArticleMetadata(..., globalPayload)` |
| PL-06 | Admin IA: Thiết lập SEO hệ thống / từng trang | Routes + nav parent + HTML + `AdmWaveD.initSeo*` |
| PL-07 | Hub consume effective SEO (title/meta/favicon/logo) | `bootstrap.enrichManifestWithSiteSeo` + `page-definition.setFavicon` |
| PL-08 | Orphan localStorage brand JS removed | Deleted `brand-identity-page.js`, `brand-identity-store.js` |
| PL-09 | This handoff | File này |

---

## 2. Production smoke (agent)

| Check | Result |
|-------|--------|
| Migration 054 | `CREATE TABLE page_seo_configs`; `media_usages.scope` + `owner_ref`; backfill 13798 rows |
| `pm2 restart iflux-api` | online |
| `GET /api/seo/effective?pageKey=dashboard` | 200 — public effective projection |
| `GET /api/admin/seo/global` (Admin key) | 200 — payload EXTEND brand row |
| Cloudflare purge | success |
| Frontend/Admin rsync | marketing SEO pages + runtime bootstrap |

---

## 3. Atomic BR → evidence pointers (for Verification owner)

Verifier chạy PASS/FAIL theo BR; impl chỉ cung cấp pointer:

| BR cluster | Where to verify | Notes |
|------------|-----------------|-------|
| Global SEO Admin | https://iflux.vn/Admin_Design_system/app/marketing/seo-system.html (slug `/admin/tiep-thi/thiet-lap-seo-he-thong`) | Field-state captions from `/admin/seo/preview` |
| Page SEO Admin | https://iflux.vn/Admin_Design_system/app/marketing/seo-pages.html | pageKey từ Page Settings catalog |
| Brand KEEP | Brand Identity vẫn chỉ name/tagline; payload merge (không wipe SEO) | |
| Public effective | `GET https://iflux.vn/api/seo/effective?pageKey=dashboard` | |
| Hub runtime | https://iflux.vn/home — sau khi set Global/Page title/favicon | Hard refresh sau purge |
| Article | Share/SPA/JSON article `metadata.site_name` từ Global | Fallback tạm `iFlux` khi Global trống |
| Media usages | POST `/api/admin/media/usages` scope GLOBAL/PAGE | ARTICLE path giữ nguyên |

---

## 4. Explicit non-claims

- **Không** BR PASS.
- **Không** đóng task / epic SEO `040826`.
- Hardcode `iFlux` vẫn là **fallback tạm** khi config trống (đúng Plan).
- Category SEO / sitemap / robots **out of scope**.

---

## 5. Files touched (impl summary)

**Backend:** `migrations/054_site_seo_foundation.sql`, `modules/site-seo/*`, `app.js`, `media.routes.js`, `admin-perm-guard.js`, `permission-catalog.js`, `community-articles.service.js`, `community.routes.js`, `wave-d-admin.service.js` (payload merge).

**Admin:** `seo-system.html`, `seo-pages.html`, routes/nav/rbac, `admin-wave-d-pages.js`; deleted orphan brand localStorage JS.

**User Web:** `runtime/bootstrap.js`, `page-definition.js`, `page-runtime.js`, `home/index.html` cache bump.
