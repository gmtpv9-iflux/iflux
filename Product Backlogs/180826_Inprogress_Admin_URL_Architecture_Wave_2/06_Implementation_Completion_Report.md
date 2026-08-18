# Implementation Completion Report — Admin URL Architecture Wave 2

**Task:** `180826_Inprogress_Admin_URL_Architecture_Wave_2`  
**Ngày:** 18/08/2026  
**Status:** IMPLEMENTATION COMPLETE — local writer/Express-logic PASS · Staging HTTP = chờ CI sau push

```text
IMPLEMENTATION COMPLETE
```

---

## 1. Files changed

| File | Việc |
|---|---|
| `05_Implementation-Plan.md` · `01_BRD.md` · `04_Solution.md` | Cụm A: Plan LOCK + Implementation AUTHORIZED |
| `iflux-admin-nav-registry.js` | Matrix urlSegment · RUNTIME `nav: false` · `adminHomeHref` → overview |
| `iflux-admin-routes.js` | Alias `legacy: true` · evidenced `legacySlugs` · `hrefFor` → `pathFor` + query/hash metadata |
| `admin-rbac-client.js` | `PAGE_PERM` copy key catalog đã có · HREF_PERM KEEP |
| `iflux-admin-app-shell.js` | Ẩn `nav: false` khỏi sidebar |
| `hub.html` | `hrefFor` · bỏ RUNTIME khỏi checklist · BC slot |
| `backend/src/app.js` | `/admin` **302** → `/admin/overview` |
| `infra/staging-1/iflux-staging-app.conf` | Bỏ Page-serve HTML · compatibility 301 evidenced · `@admin_ia` |
| `Admin_Design_system/app/**/*.html` | `#adm-page-bc` + một số href Page → canonical |

Không tạo registry/engine/`pathForV2`. Không sửa SoT.

## 2. Functions changed

| Function | File | Thay đổi |
|---|---|---|
| `pathFor` / `trailFor` / `adminHomeHref` | nav-registry | Writer từ urlSegment Matrix |
| `hrefFor` + `decorateFromSlug` | routes | Writer = pathFor; slug = metadata (query/hash) |
| `matchPath` | routes | Không đổi shape — đọc pathFor + slug + legacySlugs |
| `detectActiveKey` | routes | `subscriptions/plan-edit` · `orders/edit` |
| `PAGE_PERM` / `permForHref` | rbac | Map identity → key đã có; HREF fallback KEEP |
| `getSidebarNav` / `mapParent` | app-shell | `nav: false` |
| `mountAdminUi` | app.js | 302 target overview |

## 3. Migration clusters completed

| Cụm | Scope | Local |
|---|---|---|
| A | Docs LOCK | PASS |
| B | Alias `legacy: true` + key remap (transactions / loyalty / chu-de-registry / brand-identity) | PASS |
| C | Dashboard `/admin/overview` · `/admin` 302 | PASS (pack + nginx) |
| D | Interface + Studio 1 identity / 13 hash | PASS |
| E | System leaves (không đụng administrators Wave 1) | PASS |
| F | Users + entitlements + requests | PASS |
| G | Subscriptions + membership | PASS |
| H | Orders + notifications | PASS |
| I | Community + topics + RUNTIME | PASS |
| J | Market + data-operations + data | PASS |
| K | Metadata + marketing + AI + analytics | PASS |
| L | Breadcrumb `#adm-page-bc` · href Page còn cứng | PASS (slot) |

Express-logic (matchPath → pathFor → 200/301) PASS local **trước** khi đổi nginx.

## 4. Canonical URL verification (local pack)

88 Page Identity: `pathFor(identity) === canonical Matrix`.

Mẫu:

| Identity | Canonical |
|---|---|
| `dashboard-index` | `/admin/overview` |
| `system-admin-list` | `/admin/administrators/list` |
| `system-ds-studio` | `/admin/interface/ds-studio` |
| `users-list` | `/admin/users/list` |
| `subscription-plans` | `/admin/subscriptions/plans` |
| `loyalty-promo-list` | `/admin/membership/promo/list` |
| `community-content-dashboard` | `/admin/community/overview` |
| `cau-chuyen-list` | `/admin/topics/list` |
| `market-ops-feed-health` | `/admin/data-operations/feed-health` |

## 5. Legacy → canonical (1 hop, evidence)

| Legacy | → | Evidence |
|---|---|---|
| `/admin/tong-quan` · `/admin/dashboard` | `/admin/overview` | [P][N] |
| `/admin/he-thong/ds-studio` | `/admin/interface/ds-studio` | [P][N][H] |
| `/admin/he-thong/admin-list` | `/admin/administrators/list` | [P] Wave 1 |
| `/admin/khach-hang/list` | `/admin/users/list` | [P][N][H] |
| `/admin/goi-cuoc/plans` · `/admin/subscription/plans` | `/admin/subscriptions/plans` | [P][N][H] |
| `/admin/goi-cuoc/plan-edit?plan=new` | `/admin/subscriptions/plan-edit?plan=new` | [P][R] query giữ |
| `/admin/market-ops/feed-health` | `/admin/data-operations/feed-health` | [N][H] |
| `/admin/story/detail` | `/admin/topics/registry-detail` | [H] |

`/admin` **không** 301 — **302** → `/admin/overview`.

## 6. Express routing verification

`mountAdminUi` không đổi shape:

```text
matchPath → pathFor(identity) → 200 file | 301 canonical + query
/admin → 302 /admin/overview
```

Local: 88 identity pathFor/hrefFor/matchPath **PASS**.  
HTTP Express trên máy: `backend/node_modules` không có — logic = cùng hàm `mountAdminUi`.  
Staging HTTP: mục 17.

## 7. Nginx verification (source audit)

`iflux-staging-app.conf` sau migrate:

- Giữ: `= /admin` **302** overview · login · dang-nhap 301 · `/admin/` → `@admin_ia` → `:3002`
- **0** `rewrite` HTML Page-serve trên `/admin/{module}/…`
- Compatibility 301 chỉ URL có evidence (tong-quan, dashboard, quyen-han, access, chu-de/registry, cau-chuyen, cong-dong/content, seo-system/pages, brand-identity, du-lieu-giao-dich)
- File internals giữ: ecosystems.html / sectors.html / content.html / dashboard CSS
- EN→VI Page-fight **đã gỡ** (users/market/system/orders/…)

## 8. hrefFor / pathFor verification

```text
hrefFor(identity)
    ↓
pathFor(identity)
    ↓
canonical URL
```

- `PAGES.slug` **≠** writer (`dashboard-index` slug vẫn `/admin/tong-quan`)
- Query/hash từ slug metadata: `subscription-plan-add` → `?plan=new` · Studio → 13 hash
- Alias object → `pathFor(PAGES[k].key)`

## 9. Breadcrumb verification

```text
Page Identity → detectActiveKey → trailFor → #adm-page-bc
Admin crumb href = hrefFor('dashboard-index') = /admin/overview
```

80 HTML app + hub: hardcoded BC → slot.  
Studio V9: **không** có BC slot từ trước — không bịa thêm chrome. trailFor sẵn nếu Owner mở slot sau.

## 10. PAGE_PERM verification

URL → matchPath → identity → PAGE_PERM → **existing catalog key**.

- Không map: `system-admin-profile` (unmapped cố ý)
- Không tạo key cho GAP
- HREF_PERM **KEEP** (chưa DEAD)

## 11. Studio V9 verification

```text
13 nav entries
    → 1 identity: system-ds-studio
    → 1 base: /admin/interface/ds-studio
    → 13 hash (không đổi)
```

`#page-primitive-tokens` `#page-foundations` `#page-design-tokens` `#page-icons` `#page-charts` `#page-atoms` `#page-items` `#page-blocks` `#page-cards` `#page-organisms` `#page-sections` `#page-business-objects` `#page-user-flows`

`system-ds-studio-2`…`-13`: `legacy: true` · **không** urlSegment · **không** 13 identity.

## 12. DEAD cleanup performed

**Không.** HREF_PERM, slug, HTML stub, alias object, nginx compatibility evidenced — giữ (chưa đủ 6 điều kiện DEAD).

## 13. Remaining GAPs

| GAP | Lý do | Action |
|---|---|---|
| `community-content-edit` | PAGE_PERM/HREF evidence chưa đủ | KEEP · REPORT · không bịa key |
| `community-author-list` | HREF unmatched 02b | KEEP · REPORT · không bịa key |

`system-admin-profile` = unmapped có chủ đích (không phải GAP bịa).

## 14. Remaining legacy / HREF compatibility

- `PAGES.slug` VI + `legacySlugs` evidenced
- `HREF_PERM` toàn bộ
- Nginx exact 301 listed §7
- HTML file URL `Admin_Design_system/app/…html` → `/admin/{folder}/{page}` rồi Express 301 (file class, không invent leaf mới)
- Stub: `core-setup.html`, `membership-intro`, `transactions.html`, `loyalty.html`, `brand-identity.html`

## 15. V1–V10 + W1

| # | Kết quả | Ghi chú |
|---|---|---|
| V1 | **PASS** local | 1 Page = 1 identity; RUNTIME cùng pipeline |
| V2 | **PASS** local pack | Canonical = pathFor; file tồn tại |
| V3 | **PASS** local pack | Legacy evidenced → identity → pathFor; `/admin` = 302 |
| V4 | **PASS** | hrefFor path === pathFor; slug không writer. Query/hash = state (plan-add, Studio) |
| V5 | **PASS** | Slot `#adm-page-bc` + trailFor. Studio: không slot sẵn |
| V6 | **PASS** | PAGE_PERM existing keys; 2 GAP không bịa |
| V7 | **PASS** source | 0 HTML Page-serve `/admin/{module}` đã migrate |
| V8 | **PASS** local | `?plan=new` giữ trên 301 |
| V9 | **PASS** | 13 nav · 1 identity · 1 base · 13 hash |
| V10 | **PASS** | 0 registry/engine mới · 0 User Web |
| W1 | **PASS** local | administrators/{list,profile,roles,permissions} + login không đổi |
| V7 live sidebar | **NOT RE-RUN** | Chưa session Staging trong lượt này |

## 16. Git / commit

Xem `git log` / `git show` sau commit lượt này. Message:

```text
feat(admin): Wave 2 URL architecture — pathFor writer and Express authority
```

## 17. Staging verification evidence

Chạy **sau** CI `deploy-staging.yml` trên branch `staging`. Cần chứng minh trên `https://staging.iflux.vn`:

```text
/admin                              → 302 /admin/overview
/admin/overview                     → 200 Express
/admin/tong-quan                    → 301 /admin/overview (1 hop)
/admin/dashboard                    → 301 /admin/overview
/admin/administrators/list          → 200 (W1)
/admin/login                        → 200
/admin/interface/ds-studio          → 200
/admin/he-thong/ds-studio           → 301 /admin/interface/ds-studio
```

Kết quả HTTP Staging: điền sau push/CI (mục này cập nhật khi có evidence).
