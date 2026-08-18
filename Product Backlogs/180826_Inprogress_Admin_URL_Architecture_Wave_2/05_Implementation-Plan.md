# Implementation Plan — Admin URL Architecture Wave 2

**Task:** `180826_Inprogress_Admin_URL_Architecture_Wave_2`  
**Status:** **OWNER LOCKED** · Implementation **AUTHORIZED** (Owner 18/08/2026)  
**Ngày:** 18/08/2026  
**Căn cứ:** BRD LOCK · SoT LOCK · Solution RECONCILED (C-01…C-05) · Owner LOCK + AUTHORIZE IMPLEMENTATION  
**Authority:** SoT > BRD > Solution > Plan. Không sửa SoT. Plan này = execution SoT của Wave 2.

---

# 0. Freeze

C-01…C-05 giữ. Không Wave 1 reopen. Không Page Identity mới. Không registry thứ ba.

| ID | Áp dụng |
|---|---|
| C-01 | `data-operations` |
| C-02 | `subscriptions` / `membership` — không `products` / `loyalty` |
| C-03 | `dashboard-index` → `/admin/overview` |
| C-04 | Độ sâu = IA |
| C-05 | Giữ `pageKey` — kể cả `subscription-plan-add` |

---

# 1. Nguyên tắc LOCK (9 điểm Owner)

## 1.1 RUNTIME ≠ NON-PAGE

`RUNTIME` = Page **không** nằm IA/menu.

RUNTIME **vẫn là Page** nếu có canonical URL. Cùng pipeline:

```text
Page Identity → urlSegment → pathFor → hrefFor → matchPath → PAGE_PERM (nếu catalog có key)
```

Không được: giữ legacy routing · bỏ identity · coi RUNTIME = NON-PAGE.

NON-PAGE = `/Admin_Design_system/*.html` (SoT). INFRA = `/admin`, login, static.

## 1.2 Writer transition

```text
BEFORE
  slug → href  (hrefFor fallback PAGES.slug)

MIGRATION
  gắn urlSegment → pathFor trở thành writer
  hrefFor đọc pathFor trước

AFTER
  hrefFor(identity)
        ↓
  pathFor(identity)
        ↓
  canonical URL
```

Sau migration: `PAGES.slug` = compatibility / legacy metadata. **Không** canonical writer. **Không** writer thứ hai.

Cột Matrix “Writer”: `BEFORE slug` | `AFTER hrefFor→pathFor`. Wave 1 đã AFTER.

## 1.3 Express = canonical routing

```text
Browser → Nginx → Express Admin IA → Page Identity → canonical Page
```

Nginx **không** phải Page router. Sau module migrated, nginx chỉ:

- infrastructure (`/admin` 302, static)
- auth (`/admin/login`)
- compatibility redirect (legacy → canonical)
- delegation `@admin_ia` → Express

**Cấm** direct HTML Page-serve trên module đã migrate.

## 1.4 Không tự tạo legacy route

**Cấm** rule: `current slug + EN module = legacy`.

Mỗi URL trong cột Legacy phải có **evidence**:

| Mã | Nguồn |
|---|---|
| **P** | `PAGES.slug` / `legacySlugs` |
| **N** | `iflux-staging-app.conf` location cụ thể |
| **H** | `HREF_PERM` regex khớp path đó |
| **T** | HTML stub / `location.replace` / hardcode href |
| **R** | runtime (`detectActiveKey`, query) |
| **S** | SoT / Wave 1 record đã khóa |

Không liệt kê URL chỉ vì “có vẻ nên có”.  
**Không** ghi canonical URL vào cột Legacy.

## 1.5 `/admin` entrypoint

```text
/admin  →  302  →  /admin/overview
```

`/admin` không phải Page Identity. **Không** tham gia rule `Legacy Page → 301 canonical`. **Không** đổi 302 thành 301.

## 1.6 Permission — không tự phát sinh

```text
canonical URL → matchPath → Page Identity → PAGE_PERM → existing catalog key
```

Legacy URL = input compatibility → cùng identity.  
Không có key trong catalog → **REPORT GAP** — không tạo key.  
HREF_PERM = compatibility đến DEAD. Profile admin: không map (Wave 1).

## 1.7 Studio V9

```text
13 navigation entries
    → 1 Page Identity  system-ds-studio
    → 1 canonical base  /admin/interface/ds-studio
    → 13 hash section states
```

Không 13 Page Identity. Hash **giữ nguyên SoT**:

```text
#page-primitive-tokens
#page-foundations
#page-design-tokens
#page-icons
#page-charts
#page-atoms
#page-items
#page-blocks
#page-cards
#page-organisms
#page-sections
#page-business-objects
#page-user-flows
```

## 1.8 DEAD

Chỉ DEAD khi **đồng thời**:

```text
0 navigation consumer
+ 0 HREF consumer
+ 0 runtime/source reference
+ 0 compatibility requirement
+ 0 known bookmark requirement
+ replacement verified
```

Không xóa alias / HREF / nginx / stub chỉ vì hết navigation.

---

# 2. Files / functions (modify-first)

| File | Function | Việc |
|---|---|---|
| `iflux-admin-nav-registry.js` | `urlSegment` · `pathFor` · `trailFor` | Gắn Matrix. Không đổi shape. `adminHomeHref` = `hrefFor('dashboard-index')` |
| `iflux-admin-routes.js` | `PAGES` · `hrefFor` · `matchPath` · `detectActiveKey` | AFTER: hrefFor→pathFor. slug = metadata. Alias `legacy: true`. Studio highlight theo hash |
| `admin-rbac-client.js` | `PAGE_PERM` · `permForHref` · `HREF_PERM` | Map key **đã có**. GAP = báo, không tạo key |
| `iflux-admin-app-shell.js` | `#adm-page-bc` | Giữ `trailFor` |
| `hub.html` | `hrefFor` | Không đọc slug |
| `app/**/*.html` | BC / href Page | Slot kit. Không đổi `PAGES.file` vì URL |
| `backend/src/app.js` | `mountAdminUi` | Express authority. 200 canonical / 301 legacy + query |
| `infra/staging-1/iflux-staging-app.conf` | `/admin` | INFRA + 302 `/admin` + auth + `@admin_ia`. Page-serve xóa **sau** Express PASS |

Cấm: `pathForV2`, registry mới, User Web, Production, Staging 2.

---

# 3. Quy tắc Matrix

- `g=` / `p=` / `i=` như Solution §4.3.
- Legacy: `URL [mã evidence]`. Bỏ nếu URL = canonical.
- Writer: BEFORE / AFTER (1.2).
- Action: `KEEP_W1` · `ATTACH` · `ALIAS` · `RUNTIME` *(vẫn pipeline)* · `NON-PAGE` · `INFRA` · `STUB`.
- Perm: key catalog hoặc `GAP` hoặc `unmapped` (cố ý).

---

# 4. Migration Matrix

## 4.1 INFRA / AUTH / NON-PAGE

| Identity | Class | Canonical / entry | Legacy (evidence) | urlSegment | Writer | Perm | Consumer | Action |
|---|---|---|---|---|---|---|---|---|
| — | **INFRA entry** | `/admin` **302** → `/admin/overview` | hiện 302 → `/admin/tong-quan` **[N]** — đổi **target** 302, không đổi thành 301 | — | nginx | — | nginx `= /admin` | INFRA |
| — | **AUTH** | `/admin/login` | `/admin/dang-nhap` **[N]** | — | nginx | AUTH | nginx exact | INFRA |
| 5× `Admin-Design-system-*` | **NON-PAGE** | `/Admin_Design_system/*.html` **[P]** | — | không | slug (ngoài pathFor) | HREF guides.* **[H]** | menu + HREF | NON-PAGE |

## 4.2 Dashboard

| Identity | IA | Canonical | Legacy (evidence) | urlSegment | Writer | Perm | Action |
|---|---|---|---|---|---|---|---|
| `dashboard-index` | item Tổng quan | `/admin/overview` | `/admin/tong-quan` **[P][N]** · `/admin/dashboard` **[N]** | `i=overview` | BEFORE slug → AFTER pathFor | `dashboard.overview.view` **[H]** | ATTACH |

`/admin` 302 ≠ hàng này.

## 4.3 Administrators — KEEP Wave 1

| Identity | Canonical | Legacy (evidence) | urlSegment | Writer | Perm | Action |
|---|---|---|---|---|---|---|
| `system-admin-list` | `/admin/administrators/list` | `PAGES.legacySlugs` **[P]** · stub `admin-users.html` **[T]** | `p=administrators` `i=list` | AFTER (đã Wave 1) | `access.admin_accounts.view` PAGE_PERM | KEEP_W1 |
| `system-admin-profile` | `/admin/administrators/profile` | `legacySlugs` **[P]** | `i=profile` | AFTER | **unmapped** (Wave 1) | KEEP_W1 |
| `system-admin-roles` | `/admin/administrators/roles` | `legacySlugs` **[P]** | `i=roles` | AFTER | `access.roles.view` PAGE_PERM | KEEP_W1 |
| `system-admin-permissions` | `/admin/administrators/permissions` | `legacySlugs` **[P]** | `i=permissions` | AFTER | `access.permissions.view` PAGE_PERM | KEEP_W1 |
| `system-admin-users` | = list (alias) | object key **[P]** | — | — | — | ALIAS |
| `system-roles` | = roles (alias) | object key **[P]** | — | — | — | ALIAS |

## 4.4 Interface + Studio

| Identity | Canonical | Legacy (evidence) | urlSegment | Writer | Perm | Action |
|---|---|---|---|---|---|---|
| `system-page-settings` | `/admin/interface/page-settings` | `/admin/he-thong/page-settings` **[P][N][H]** | `g=interface` `i=page-settings` | BEFORE slug → AFTER | `interface.page_settings.view` **[H]** | ATTACH |
| `system-templates` | `/admin/interface/templates` | `/admin/he-thong/templates` **[P][N][H]** | `i=templates` | BEFORE→AFTER | `interface.design_system.view` **[H]** | ATTACH |
| `system-ds-studio` | `/admin/interface/ds-studio` | `/admin/he-thong/ds-studio` **[P][N][H]** | `i=ds-studio` (một identity) | BEFORE→AFTER | `interface.design_system.view` PAGE_PERM | ATTACH |
| `system-ds-studio-2`…`-13` | **cùng** base + hash region | slug hash **[P]** | không `urlSegment` | hrefFor(identity)+hash | cùng identity | object `legacy: true`; **không** 13 identity |

V9: 13 nav · 1 identity · 1 base · 13 hash §1.7.

## 4.5 System

| Identity | Canonical | Legacy (evidence) | urlSegment | Writer | Perm | Action |
|---|---|---|---|---|---|---|
| `system-sla` | `/admin/system/sla` | `/admin/he-thong/sla` **[P][N][H]** | `i=system/sla` | BEFORE→AFTER | `system.sla.view` **[H]** | ATTACH |
| `system-platform-layers` | `/admin/system/platform-layers` | `/admin/he-thong/platform-layers` **[P][N][H]** | `i=system/platform-layers` | BEFORE→AFTER | `system.platform_layers.view` **[H]** | ATTACH |
| `system-feature-flags` | `/admin/system/feature-flags` | `/admin/he-thong/feature-flags` **[P][N][H]** | `i=system/feature-flags` | BEFORE→AFTER | `system.feature_flags.view` **[H]** | ATTACH |
| `system-maintenance` | `/admin/system/maintenance` | `/admin/he-thong/maintenance` **[P][N][H]** | `i=system/maintenance` | BEFORE→AFTER | `system.maintenance.view` **[H]** | ATTACH |
| `system-audit` | `/admin/system/audit` | `/admin/he-thong/audit` **[P][N][H]** | `i=system/audit` | BEFORE→AFTER | `access.audit.view` **[H]** | ATTACH |
| `system-core-setup-legacy` | không — stub | `/admin/he-thong/core-setup` **[P][T]** | — | stub | — | STUB → 301 time-config khi DEAD |
| `system-core-setup` | alias → `market-cau-hinh-thoi-gian` | object **[P]** | — | — | — | ALIAS |

`/admin/system/sla` **không** nằm Legacy (Owner §5). Nginx EN `system`→`he-thong` **[N]** = compatibility hiện tại; sau cụm E đổi thành serve/301 đúng canonical — không gọi canonical là legacy.

## 4.6 Users + Requests

| Identity | Canonical | Legacy (evidence) | urlSegment | Writer | Perm | Action |
|---|---|---|---|---|---|---|
| `users-list` | `/admin/users/list` | `/admin/khach-hang/list` **[P][N][H]** | `p=users` `i=list` | BEFORE→AFTER | `users.list.view` **[H]** | ATTACH |
| `subscription-entitlements` | `/admin/users/entitlements` | `/admin/goi-cuoc/entitlements` **[P][N][H]** · `/admin/subscription/entitlements` **[N][H]** · `/admin/quyen-han` **[N]** · `/admin/access` **[N]** | `p=users` `i=entitlements` | BEFORE→AFTER | `subscription.entitlements.view` **[H]** | ATTACH |
| `users-export` | `/admin/users/export` | `/admin/khach-hang/export` **[P][N][H]** | `i=users/export` | BEFORE→AFTER | `users.list.export` **[H]** | ATTACH |
| `req-partnership` | `/admin/requests/partnership` | `/admin/yeu-cau/partnership` **[P][N][H]** | `p=requests` `i=partnership` | BEFORE→AFTER | `requests.partnership.view` **[H]** | ATTACH |
| `req-withdrawals` | `/admin/requests/withdrawals` | `/admin/yeu-cau/withdrawals` **[P][N][H]** | `i=withdrawals` | BEFORE→AFTER | `requests.withdrawals.view` **[H]** | ATTACH |
| `req-features` | `/admin/requests/features` | `/admin/yeu-cau/features` **[P][N][H]** | `i=features` | BEFORE→AFTER | `requests.features.view` **[H]** | ATTACH |
| `req-bugs` | `/admin/requests/bugs` | `/admin/yeu-cau/bugs` **[P][N][H]** | `i=bugs` | BEFORE→AFTER | `requests.bugs.view` **[H]** | ATTACH |

Catch-all HREF `yeu-cau/` **[H]** KEEP đến DEAD. Canonical `requests/*` không ghi vào Legacy.

## 4.7 Orders

| Identity | Canonical | Legacy (evidence) | urlSegment | Writer | Perm | Action |
|---|---|---|---|---|---|---|
| `orders-list` | `/admin/orders/list` | `/admin/don-hang/list` **[P][N][H]** | `g=orders` `i=list` | BEFORE→AFTER | `subscription.transactions.view` **[H]** | ATTACH |
| `orders-add` | `/admin/orders/add` | `/admin/don-hang/add` **[P][N]** · HREF `/orders/` **[H]** | `i=add` | BEFORE→AFTER | `subscription.transactions.view` **[H]** | ATTACH |
| `orders-edit` | `/admin/orders/edit` | `/admin/don-hang/edit` **[P][R]** · HREF `/orders/` **[H]** | `i=edit` | BEFORE→AFTER *(RUNTIME = không menu, vẫn pipeline)* | `subscription.transactions.view` **[H]** | **RUNTIME** |
| `subscription-transactions` | alias → `orders-list` | object **[P]** · `transactions.html` **[T]** | — | stub | — | ALIAS + STUB |

## 4.8 Subscriptions

| Identity | Canonical | Legacy (evidence) | urlSegment | Writer | Perm | Action |
|---|---|---|---|---|---|---|
| `subscription-plans` | `/admin/subscriptions/plans` | `/admin/goi-cuoc/plans` **[P][N][H]** · `/admin/subscription/plans` **[N][H]** | `g=subscriptions` `i=plans` | BEFORE→AFTER | `subscription.plans.view` **[H]** | ATTACH |
| `subscription-plan-add` | `/admin/subscriptions/plan-edit` | `/admin/goi-cuoc/plan-edit` **[P][N][H]** · `?plan=new` **[R][P]** state | `i=plan-edit` | path AFTER; query = state | `subscription.plans.view` **[H]** | ATTACH · pageKey giữ |
| `subscription-subscribers` | `/admin/subscriptions/subscribers` | `/admin/goi-cuoc/subscribers` **[P][N][H]** | `i=subscribers` | BEFORE→AFTER | `subscription.subscribers.view` **[H]** | ATTACH |

`/admin/subscriptions/*` là canonical mới — không phải legacy.

## 4.9 Membership

| Identity | Canonical | Legacy (evidence) | urlSegment | Writer | Perm | Action |
|---|---|---|---|---|---|---|
| `loyalty-promo-list` | `/admin/membership/promo/list` | `/admin/thanh-vien/ma-list` **[P][N][H]** · `/admin/loyalty/ma-list` **[N][H]** | `g=membership` `p=promo` `i=list` | BEFORE→AFTER | `subscription.loyalty.view` **[H]** | ATTACH |
| `loyalty-promo-add` | `/admin/membership/promo/add` | `/admin/thanh-vien/ma-them` **[P][N]** · HREF thanh-vien **[H]** | `i=add` | BEFORE→AFTER | `subscription.loyalty.view` **[H]** | ATTACH |
| `loyalty-promo-usage` | `/admin/membership/promo/usage` | `/admin/thanh-vien/ma-su-dung` **[P][N]** · HREF **[H]** | `i=usage` | BEFORE→AFTER | `subscription.loyalty.view` **[H]** | ATTACH |
| `loyalty-membership-list` | `/admin/membership/list` | `/admin/thanh-vien/membership` **[P][N][H]** · `/admin/loyalty/membership` **[N][H]** | `i=list` | BEFORE→AFTER | `subscription.loyalty.view` **[H]** | ATTACH |
| `subscription-loyalty` | alias → membership list | object **[P]** · `loyalty.html` **[T]** | — | stub | — | ALIAS |
| `subscription-membership-intro` | không identity riêng | stub → `ma-list` **[T][P]** | — | stub | — | STUB 301 → promo/list khi DEAD |

Không namespace canonical `loyalty`.

## 4.10 Community + RUNTIME cùng pipeline

| Identity | Menu? | Canonical | Legacy (evidence) | urlSegment | Writer | Perm | Action |
|---|---|---|---|---|---|---|---|
| `community-content-dashboard` | có | `/admin/community/overview` | `/admin/cong-dong/content/dashboard` **[P][N][H]** | `p=community` `i=overview` | BEFORE→AFTER | `community.content_dashboard.view` **[H]** | ATTACH |
| `community-content-index` | có | `/admin/community/articles` | `/admin/cong-dong/danh-sach-bai-viet` **[P][N][H]** | `i=articles` | BEFORE→AFTER | `community.articles.view` **[H]** | ATTACH |
| `community-categories` | có | `/admin/community/categories` | `/admin/cong-dong/categories` **[P][N][H]** | `i=categories` | BEFORE→AFTER | `community.categories.view` **[H]** | ATTACH |
| `community-chu-de-list` | có | `/admin/community/topics` | `/admin/cong-dong/danh-sach-chu-de` **[P][N][H]** · `/admin/chu-de/registry` **[N][H]** | `i=topics` | BEFORE→AFTER | `stories.registry.view` **[H]** | ATTACH |
| `community-comments` | có | `/admin/community/comments` | `/admin/cong-dong/comments` **[P][N][H]** | `p=community` `i=comments` | BEFORE→AFTER | `community.comments.view` **[H]** | ATTACH |
| `community-chu-de-moderation` | có | `/admin/community/topic-moderation` | `/admin/cong-dong/chu-de-moderation` **[P][N][H]** | `i=topic-moderation` | BEFORE→AFTER | `community.stories.view` **[H]** | ATTACH |
| `community-reports` | có | `/admin/community/reports` | `/admin/cong-dong/reports` **[P][N][H]** | `i=community/reports` | BEFORE→AFTER | `community.reports.view` **[H]** | ATTACH |
| `community-rss-providers` | có | `/admin/community/rss-sources` | `/admin/cong-dong/nguon-rss` **[P][N][H]** | `i=rss-sources` | BEFORE→AFTER | `community.rss_providers.view` **[H]** | ATTACH |
| `community-rss-category-sync` | có | `/admin/community/rss-category-sync` | `/admin/cong-dong/dong-bo-danh-muc` **[P][N][H]** | `i=rss-category-sync` | BEFORE→AFTER | `community.rss_category_sync.view` **[H]** | ATTACH |
| `community-rss-article-schema` | có | `/admin/community/rss-article-schema` | `/admin/cong-dong/dong-bo-cau-truc-bai-viet` **[P][N][H]** | `i=rss-article-schema` | BEFORE→AFTER | `community.rss_article_schema.view` **[H]** | ATTACH |
| `community-content-edit` | **không** | `/admin/community/edit` | `/admin/cong-dong/content/edit` **[P][T]** | `p=community` `i=edit` | BEFORE→AFTER | **GAP** — không HREF/PAGE_PERM | **RUNTIME** + REPORT GAP |
| `community-author-list` | **không** | `/admin/community/authors` | `/admin/cong-dong/danh-sach-tac-gia` **[P]** | `i=authors` + `p=community` | BEFORE→AFTER | **GAP** — HREF unmatched `02b` | **RUNTIME** + REPORT GAP |
| `community-experts` | **không** | `/admin/community/experts` | `/admin/cong-dong/experts` **[P][H]** | `i=experts` + `p=community` | BEFORE→AFTER | `community.experts.view` **[H]** | **RUNTIME** |
| `chu-de-registry` | alias | = `community-chu-de-list` | object **[P]** | — | — | — | ALIAS |

## 4.11 Topics

| Identity | Menu? | Canonical | Legacy (evidence) | urlSegment | Writer | Perm | Action |
|---|---|---|---|---|---|---|---|
| `cau-chuyen-list` | có | `/admin/topics/list` | `/admin/cau-chuyen/danh-sach` **[P][N][H]** · `/admin/chu-de/danh-sach-cau-chuyen` **[H][N]** | `p=topics` `i=list` | BEFORE→AFTER | `stories.registry.view` **[H]** | ATTACH |
| `cau-chuyen-detail` | có | `/admin/topics/detail` | `/admin/cau-chuyen/chi-tiet` **[P][N][H]** | `i=detail` | BEFORE→AFTER | `stories.cau_chuyen_detail.view` **[H]** | ATTACH |
| `chu-de-detail` | **không** | `/admin/topics/registry-detail` | `/admin/chu-de/detail` **[P][H]** · `/admin/story/detail` **[H]** *(nếu path file/HREF)* | `i=registry-detail` `p=topics` | BEFORE→AFTER | `stories.detail.view` **[H]** | **RUNTIME** |
| `chu-de-mapping` | **không** | `/admin/topics/mapping` | `/admin/chu-de/mapping` **[P][H]** | `i=mapping` `p=topics` | BEFORE→AFTER | `stories.mapping.view` **[H]** | **RUNTIME** |
| `chu-de-analytics` | **không** | `/admin/topics/analytics` | `/admin/chu-de/analytics` **[P][H]** | `i=analytics` `p=topics` | BEFORE→AFTER | `stories.analytics.view` **[H]** | **RUNTIME** |

Prefix nginx `story`→`chu-de` **[N]** = compatibility; không invent `/admin/story/…` từng leaf trừ khi **[H]/[P]** có path đó.

## 4.12 Notifications

| Identity | Canonical | Legacy (evidence) | urlSegment | Perm | Action |
|---|---|---|---|---|---|
| `notifications-push` | `/admin/notifications/push` | `/admin/thong-bao/push` **[P][N][H]** | `g=notifications` `i=push` | `notifications.push.view` **[H]** | ATTACH |
| `notifications-in-app` | `/admin/notifications/in-app` | `/admin/thong-bao/in-app` **[P][N][H]** | `i=in-app` | `notifications.in_app.view` **[H]** | ATTACH |
| `notifications-email` | `/admin/notifications/email` | `/admin/thong-bao/email` **[P][N][H]** | `i=email` | `notifications.email.view` **[H]** | ATTACH |
| `notifications-history` | `/admin/notifications/history` | `/admin/thong-bao/history` **[P][N][H]** | `i=history` | `notifications.history.view` **[H]** | ATTACH |
| `system-announcements` | `/admin/notifications/templates` | `/admin/he-thong/announcements` **[P][N][H]** | `i=templates` | `notifications.templates.view` **[H]** | ATTACH |

Canonical `notifications/*` không ghi Legacy (trùng EN nginx hiện tại — đó là đường sẽ **trở thành** canonical, không phải URL cũ).

## 4.13 Market

| Identity | Canonical | Legacy (evidence) | urlSegment | Perm | Action |
|---|---|---|---|---|---|
| `market-stocks` | `/admin/market/stocks` | `/admin/thi-truong/stocks` **[P][N][H]** | `g=market` `i=stocks` | `market.stocks.view` **[H]** | ATTACH |
| `market-ecosystems-index` | `/admin/market/ecosystems` | `/admin/thi-truong/ecosystems` **[P][N][H]** | `i=ecosystems` | `market.ecosystems.view` **[H]** | ATTACH |
| `market-sectors-index` | `/admin/market/sectors` | `/admin/thi-truong/sectors` **[P][N][H]** | `i=sectors` | `market.sectors.view` **[H]** | ATTACH |
| `market-lot-threshold` | `/admin/market/lot-threshold` | `/admin/thi-truong/lot-threshold` **[P][N][H]** | `i=lot-threshold` | `market.lot_threshold.view` **[H]** | ATTACH |
| `market-cau-hinh-thoi-gian` | `/admin/market/time-config` | `/admin/thi-truong/cau-hinh-thoi-gian` **[P][N][H]** · `/admin/thi-truong/du-lieu-giao-dich` **[N]** · `/admin/du-lieu/du-lieu-giao-dich` **[N][T]** | `i=time-config` | `system.core_setup.view` **[H]** | ATTACH |
| `market-price-data` | alias → time-config | object **[P]** | — | — | ALIAS |
| `data-sources` | `/admin/market/data-sources` | `/admin/thi-truong/data-sources` **[P][N][H]** | `i=data-sources` | `data.sources.view` **[H]** | ATTACH |
| `data-sources-legacy` | alias | `/admin/du-lieu/sources` **[P][H]** | — | — | ALIAS |
| `market-stock-schema` | `/admin/market/stock-schema` | `/admin/thi-truong/dong-bo-cau-truc-co-phieu` **[P][N][H]** | `i=stock-schema` | `data.sources.view` **[H]** | ATTACH |
| `market-sync-history` | `/admin/market/sync-history` | `/admin/thi-truong/lich-su-dong-bo` **[P][N][H]** | `i=sync-history` | `data.sources.view` **[H]** | ATTACH |
| `market-ranking` | `/admin/market/ranking` | `/admin/thi-truong/ranking` **[P][N][H]** | `i=ranking` | `market.ranking.view` **[H]** | ATTACH |
| `market-formulas` | `/admin/market/formulas` | `/admin/thi-truong/formulas` **[P][N][H]** | `i=formulas` | `market.formulas.view` **[H]** | ATTACH |

## 4.14 Data-operations (C-01)

| Identity | Canonical | Legacy (evidence) | urlSegment | Perm | Action |
|---|---|---|---|---|---|
| `market-ops-feed-health` | `/admin/data-operations/feed-health` | `/admin/van-hanh-du-lieu/feed-health` **[P][N][H]** · `/admin/market-ops/feed-health` **[N][H]** | `g=data-operations` `i=feed-health` | `market_ops.feed_health.view` **[H]** | ATTACH |
| `market-ops-sessions` | `/admin/data-operations/sessions` | `/admin/van-hanh-du-lieu/sessions` **[P][N][H]** · `/admin/market-ops/sessions` **[N][H]** | `i=sessions` | `market_ops.sessions.view` **[H]** | ATTACH |
| `market-ops-missing-ticks` | `/admin/data-operations/missing-ticks` | VI + `market-ops` **[P][N][H]** | `i=missing-ticks` | `market_ops.missing_ticks.view` **[H]** | ATTACH |
| `market-ops-corrections` | `/admin/data-operations/corrections` | VI + `market-ops` **[P][N][H]** | `i=corrections` | `market_ops.corrections.view` **[H]** | ATTACH |

Không invent `/admin/data-operations/…` trong Legacy.

## 4.15 Data / Metadata / Marketing / AI / Analytics

Writer tất cả: BEFORE slug → AFTER hrefFor→pathFor. Canonical EN trùng nginx hiện tại → **không** ghi EN vào Legacy.

| Identity | Canonical | Legacy (evidence) | urlSegment | Perm | Action |
|---|---|---|---|---|---|
| `data-etl-jobs` | `/admin/data/etl-jobs` | `/admin/du-lieu/etl-jobs` **[P][N][H]** | `g=data` `i=etl-jobs` | `data.etl_jobs.view` **[H]** | ATTACH |
| `data-pipeline` | `/admin/data/pipeline` | `/admin/du-lieu/pipeline` **[P][N][H]** | `i=pipeline` | `data.pipeline.view` **[H]** | ATTACH |
| `data-quality` | `/admin/data/quality` | `/admin/du-lieu/quality` **[P][N][H]** | `i=quality` | `data.quality.view` **[H]** | ATTACH |
| `data-dictionary` | `/admin/data/dictionary` | `/admin/du-lieu/dictionary` **[P][N][H]** | `i=dictionary` | `data.dictionary.view` **[H]** | ATTACH |
| `data-reconciliation` | `/admin/data/reconciliation` | `/admin/du-lieu/reconciliation` **[P][N][H]** | `i=reconciliation` | `data.reconciliation.view` **[H]** | ATTACH |
| `metadata-sector-types` | `/admin/metadata/sector-types` | `/admin/tham-so/sector-types` **[P][N][H]** | `g=metadata` `i=sector-types` | `metadata.sector_types.view` **[H]** | ATTACH |
| `metadata-enums` | `/admin/metadata/enums` | `/admin/tham-so/enums` **[P][N][H]** | `i=enums` | `metadata.enums.view` **[H]** | ATTACH |
| `metadata-themes` | `/admin/metadata/themes` | `/admin/tham-so/themes` **[P][N][H]** | `i=themes` | `metadata.themes.view` **[H]** | ATTACH |
| `metadata-chu-de-lifecycle` | `/admin/metadata/topic-lifecycle` | `/admin/tham-so/chu-de-lifecycle` **[P][N][H]** · `story-lifecycle.html` **[T]** | `i=topic-lifecycle` | `metadata.story_lifecycle.view` **[H]** | ATTACH |
| `marketing-seo-system` | `/admin/marketing/seo/system` | `/admin/tiep-thi/thiet-lap-seo-he-thong` **[P][N][H]** · `/admin/tiep-thi/seo-system` **[N]** | `g=marketing` `p=seo` `i=system` | `marketing.seo_system.view` **[H]** | ATTACH |
| `marketing-seo-pages` | `/admin/marketing/seo/pages` | `/admin/tiep-thi/thiet-lap-seo-tung-trang` **[P][N][H]** · `/admin/tiep-thi/seo-pages` **[N]** | `i=pages` | `marketing.seo_pages.view` **[H]** | ATTACH |
| `marketing-onboarding` | `/admin/marketing/onboarding` | `/admin/tiep-thi/onboarding` **[P][N][H]** | `i=onboarding` | `marketing.onboarding.view` **[H]** | ATTACH |
| `marketing-brand-identity` | alias → seo/system | `/admin/tiep-thi/brand-identity` **[P][N][T]** | — | `marketing.seo_system.view` **[H]** | ALIAS |
| `ai-prompts` | `/admin/ai/prompts` | `/admin/trung-tam-ai/prompts` **[P][N][H]** | `g=ai` `i=prompts` | `ai.prompts.view` **[H]** | ATTACH |
| `ai-prompt-detail` | `/admin/ai/prompt-detail` | `/admin/trung-tam-ai/prompt-detail` **[P][N][H]** | `i=prompt-detail` | `ai.prompts.view` **[H]** | ATTACH |
| `ai-logs` | `/admin/ai/logs` | `/admin/trung-tam-ai/logs` **[P][N][H]** | `i=logs` | `ai.logs.view` **[H]** | ATTACH |
| `ai-cost` | `/admin/ai/cost` | `/admin/trung-tam-ai/cost` **[P][N][H]** | `i=cost` | `ai.cost.view` **[H]** | ATTACH |
| `ai-quality` | `/admin/ai/quality` | `/admin/trung-tam-ai/quality` **[P][N][H]** | `i=quality` | `ai.quality.view` **[H]** | ATTACH |
| `analytics-users` | `/admin/analytics/users` | `/admin/phan-tich/users` **[P][N][H]** | `g=analytics` `i=users` | `dashboard.overview.view` **[H]** | ATTACH |
| `analytics-chu-de` | `/admin/analytics/topics` | `/admin/phan-tich/chu-de` **[P][N][H]** | `i=topics` | `stories.analytics.view` **[H]** | ATTACH |
| `analytics-revenue` | `/admin/analytics/revenue` | `/admin/phan-tich/revenue` **[P][N][H]** | `i=revenue` | `subscription.transactions.view` **[H]** | ATTACH |
| `analytics-funnel` | `/admin/analytics/funnel` | `/admin/phan-tich/funnel` **[P][N][H]** | `i=funnel` | `dashboard.overview.view` **[H]** | ATTACH |

---

# 5. Execution order

```text
Matrix
 → Identity
 → urlSegment
 → pathFor / hrefFor / trailFor
 → PAGE_PERM (existing keys only)
 → Express
 → nginx (sau Express PASS; không Page-serve)
 → cleanup chỉ khi DEAD §1.8
 → verification
```

Cụm A–L giữ. RUNTIME đi **cùng cụm module** (cùng pathFor/Express/perm), không để lại nginx Page-serve.

FAIL HTTP → không mở cụm sau.

---

# 6. Permission

```text
URL (canonical hoặc legacy) → matchPath → identity → PAGE_PERM → catalog key đã có
```

- Copy key từ HREF → PAGE_PERM. **Không** tạo key.
- **GAP (báo Owner, không bịa):** `community-content-edit`, `community-author-list`.
- `unmapped` cố ý: `system-admin-profile`.
- HREF_PERM KEEP đến DEAD §1.8.
- Catch-all `yeu-cau/` KEEP đến bốn `req-*` + DEAD.

---

# 7. Nginx

Giữ: `= /admin` **302** → overview (sau C); login; dang-nhap 301; static; `@admin_ia`.

Sau Express 200 từng module: bỏ VI-serve HTML; compatibility 301 **chỉ** URL có evidence §1.4; EN prefix hiện 301→VI đổi target → canonical **khi** canonical ≠ path đó.

Không xóa toàn bộ `/admin` một lần. Không Page-serve module đã migrate.

---

# 8. Verification

| # | PASS |
|---|---|
| V1 | 1 Page = 1 identity (kể cả RUNTIME) |
| V2 | Canonical 200 **Express** |
| V3 | Legacy **có evidence** → 301 1 hop · không 301 `/admin` |
| V4 | AFTER: `hrefFor===pathFor` · slug không writer |
| V5 | BC `trailFor` |
| V6 | Perm identity + existing key; GAP không bịa |
| V7 | 0 HTML Page-serve nginx trên module migrated |
| V8 | Query state giữ |
| V9 | 13 nav → 1 identity → 1 base → 13 hash §1.7 |
| V10 | 0 registry/engine/User Web |
| W1 | Administrators + login |

---

# 9. Ngoài lượt

User Web/App · Production · Staging 2 · tạo perm key · đổi API/DB · xóa hàng loạt · đổi 13 hash · ép Guides · reopen Wave 1 · đổi `/admin` 302→301.

---

# 10. STOP GATE (đã mở)

`05` = **OWNER LOCKED**. Implementation **AUTHORIZED** 18/08/2026.

FAIL HTTP / GAP mới → STOP cụm · REPORT · không sửa SoT để PASS.

---

# 11. Báo cáo revise (Owner)

```text
PLAN LOCKED + IMPLEMENTATION AUTHORIZED

- 9/9 Owner directives addressed
- Matrix = execution SoT
- Source evidence gaps (KEEP, REPORT):
    1. community-content-edit — không HREF/PAGE_PERM (GAP)
    2. community-author-list — HREF unmatched 02b (GAP)
- New architecture introduced: NO
```
