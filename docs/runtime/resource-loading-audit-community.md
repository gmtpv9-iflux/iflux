# Resource Loading Audit — Community Page (News-only shell)

**Phase:** 1 — Resource Loading Audit (READ ONLY)  
**Scope:** `/cong-dong` khi Sidebar = OFF, Placement Widget = 0, UI chỉ còn Header + Tin tức  
**Evidence source:** Network list do user cung cấp + lần theo code (file / line / function). **Không** chạy Chrome Coverage trong phiên này; cột Usage dựa trên static reference trong code.  
**Constraint:** Không sửa code, không tối ưu, không xóa asset.

**Audit date:** 2026-07-21  
**Entry HTML:** `User_Web/community/index.html`

---

## 0. Boot call stack (đã chứng minh từ code)

```
community/index.html
  L47  <script type="module" src="…/runtime/bootstrap.js">
        ↓
bootstrap.js
  L189–211  start()
  L197      bootShell(pageKey)          → shell-boot.js
  L206      resolveManifest('community') → community.manifest.js (composite: true)
  L211      bootPage(manifest, mountEl) → page-runtime.js
        ↓
page-runtime.js
  L24–79   bootPage()
  L30      renderPageHeader / ensureSections  → app-shell.js (import)
  L63–78   for each manifest.widgets → loadWidget(slot)  → widget-loader.js
        ↓
widget-loader.js
  L52–54   loadStyles(slot.css)         → legacy-bridge.js loadStyles
  L61      import(slot.lazyModule)      → widgets/community-page/index.js
  L65      mod.mount(host, …)
        ↓
widgets/community-page/index.js
  L86–102  mount()
  L88      loadScriptTiers(CORE_TIERS)  → legacy-bridge.js loadScriptTiers → loadScript
  L89      loadScript(iflux-header-search.js)  [fire-and-forget]
  L101–102 IfluxCommunityPage.init() + mountFromHostTree()
        ↓
mountFromHostTree (cùng file)
  L60      IfluxPageLayoutEngine.buildHostTree(root, 'community')
  L63–64   nếu tree.length → mountPublishedWidgets (0 widget khi Placement tắt)
  L69–70   syncEmptyHostChrome → ẩn sidebar / section trống
```

**Shell parallel stack** (`shell-boot.js` `bootShell` → `ensureParallel` L54–67):

```
shell-boot.bootShell
  ↓ ensureParallel (legacy-bridge.loadScript, async=false, execute order = array order)
  1 iflux-platform-boot.js
  2 iflux-api-bundle.js
  3 auth.js
  4 platform-layers-widgets.js
  5 entitlement-catalog.js
  6 plans-store.js
  7 iflux-entitlements.js
  8 block-templates.js          ← lần 1 (App Shell)
  9 iflux-widget-shell.js
 10 iflux-block-paywall.js
 11 iflux-block-gate.js
 12 iflux-guest-shell.js
  (+ nếu logged-in) iflux-web-ui.js → idle-load header extras
```

**Community feature tiers** (`community-page/index.js` `CORE_TIERS` L16–48 → `loadScriptTiers`):

| Tier | Scripts |
|------|---------|
| 0 | watchlist-taxonomy, block-templates (lần 2), profile-users-store, iflux-market-registry-store |
| 1 | seo-url, profile-links, iflux-market-seed-data, iflux-market-ecosystem-seeds |
| 2 | mock-market, watchlist-store |
| 3 | watchlist-ui, community-geo-ai, page-layout-engine |
| 4 | community-store |
| 5 | community-ui |
| 6 | community-daily-feed, community-page.js |

> Một số script Tier 2–6 **không** có trong Network list user paste (có thể cắt list / cache hit / timing). Audit vẫn ghi chúng trong **Appendix A** vì code **luôn** gọi `loadScriptTiers(CORE_TIERS)` bất kể Placement = 0.

---

## 1. Resource Inventory

### 1.1 JavaScript (theo list user + initiator đã chứng minh)

| Resource | Type | Loaded by (Initiator) | Owner | Runtime Required (News-only) | Actually Used (code evidence) | Notes |
|----------|------|----------------------|-------|------------------------------|-------------------------------|-------|
| `bootstrap.js` | script | `community/index.html` L47 | Runtime | **Yes** | Yes — entry `start()` | Page entry |
| `shell-boot.js` | script | `bootstrap.js` L13 `import { bootShell }` | Runtime / App Shell | **Yes** | Yes — `bootShell('community')` | Auth + entitlements stack |
| `page-runtime.js` | script | `bootstrap.js` L12 `import { bootPage }` | Runtime | **Yes** | Yes — `bootPage(manifest)` | Mount page + WGT-COM-PAGE slot |
| `app-shell.js` | script | `page-runtime.js` L7–12 `import` | App Shell | **Yes** | Yes — `renderPageHeader`, `ensureSections` | Page chrome |
| `widget-loader.js` | script | `page-runtime.js` L13 `import { loadWidget }` | Widget Runtime | **Yes** | Yes — loads WGT-COM-PAGE | Cần kể cả khi Placement=0 (composite page widget) |
| `legacy-bridge.js` | script | Imported by shell-boot L7, page-runtime L14, community-page L7 | Runtime | **Yes** | Yes — `loadScript` / `loadStyles` / `loadScriptTiers` | Loader primitive |
| `mount-published-widgets.js` | script | `page-runtime.js` L15 import; also `community-page` L8 import | Widget Runtime | **Conditional** | Loaded always; **no-op body** khi `tree.length===0` | Vẫn import khi Placement=0 |
| `community.manifest.js` | script | `bootstrap.js` L22 `MANIFEST_MAP.community` → dynamic `import` | Runtime / Page | **Yes** | Yes — defines WGT-COM-PAGE + CSS list | `composite: true` |
| `iflux-platform-boot.js` | script | `shell-boot.js` L55 `ensureParallel` | Platform / App Shell | **Yes** | Yes — Routes, Nav, AppShell; **also** injects market-status-bar | Side-effect L457–477 |
| `iflux-api-bundle.js` | script | `shell-boot.js` L56 | Platform | **Yes** | Yes — API client for plans/auth | |
| `auth.js` | script | `shell-boot.js` L57 | Auth | **Yes** | Yes — session / guest vs login branch | |
| `platform-layers-widgets.js` | script | `shell-boot.js` L58 | Platform (Tầng 4) | **Yes** (Permission) | Yes — Gate `isPermissionScopedWidget` | Không mount widget Placement vẫn cần cho Gate |
| `entitlement-catalog.js` | script | `shell-boot.js` L59 | Platform / Permission | **Yes** | Yes — plan normalize / resolveBlockEnabled | |
| `plans-store.js` | script | `shell-boot.js` L60 | Platform / Permission | **Yes** | Yes — `hydrate()` → fetch `/api/plans/runtime` | |
| `iflux-entitlements.js` | script | `shell-boot.js` L61 | Permission | **Yes** | Yes — `canAccessPage`, Gate | |
| `block-templates.js` | script | (1) `shell-boot.js` L62; (2) `CORE_TIERS[0]` community-page L19 | Design System / Template | **Yes** (News) | Yes — `community-ui.js` gọi `IfluxBlockTemplates.renderFeedPost*` | **Nạp hai lần** (idempotent global) |
| `iflux-widget-shell.js` | script | `shell-boot.js` L63 | Widget Shell / Permission UI | **Yes** (Gate path) | Yes nếu có host locked; News feed ngoài L4 → unlock | Vẫn boot luôn |
| `iflux-block-paywall.js` | script | `shell-boot.js` L64 | Permission (legacy API) | Low for News-only | Thin delegate to Shell | Shell stack |
| `iflux-block-gate.js` | script | `shell-boot.js` L65 | Permission Engine | **Yes** | Yes — `apply('community')` sau Host Tree | Không khóa Tin tức (ngoài L4) nhưng vẫn chạy |
| `iflux-guest-shell.js` | script | `shell-boot.js` L66 | App Shell / Guest | **Yes** | Yes — `bootstrapPage('community')` | Nav / CTA guest hoặc sync login |
| `iflux-web-ui.js` | script | `shell-boot.js` L70–73 **chỉ khi** `IfluxAuth.isLoggedIn()` | App Shell / Header UX | **Yes nếu logged-in** | Yes — syncTopnav + idle load extras | User capture có → session đã login |
| `market-status-bar.js` | script | `iflux-platform-boot.js` L463–469 `load()` | App Shell | Product: global bar | Yes nếu `.ifx-topnav` tồn tại | Side-effect của platform-boot |
| `runtime?_=…` (fetch) | fetch | `plans-store.js` `fetchRuntimePlans` → `/api/plans/runtime` | Platform / Permission | **Yes** | Yes — hydrate plans | Network name `runtime?_=` |
| `watchlist-taxonomy.js` | script | `community-page` CORE_TIERS[0] via `loadScriptTiers` | Watchlist Feature (shared tax) | **Conditional** | Used khi filter URL chủ đề/family (`community-page.js` L216–228 `tax()`); News index thuần có thể không gọi | Vẫn **always loaded** bởi CORE_TIERS |
| `profile-users-store.js` | script | CORE_TIERS[0] | Profile Feature | **Conditional** | `community-store.js` ~L1433 `IfluxProfileUsersStore` | Always in CORE_TIERS |
| `iflux-market-registry-store.js` | script | CORE_TIERS[0] | Market / Registry | **Indirect** | `mock-market.js` đọc `IfluxMarketRegistryStore` | Luôn nạp trước mock-market |
| `seo-url.js` | script | CORE_TIERS[1] | Platform / SEO | **Yes** (News) | Yes — `community-ui` / `community-store` post href & canonical | |
| `profile-links.js` | script | CORE_TIERS[1] | Profile Feature | **Yes** (News cards) | Yes — `community-ui.js` L175–179 avatar/name links | |
| `iflux-market-seed-data.js` | script | CORE_TIERS[1] | Market data seed | **Indirect** | Feeds registry/mock for ticker % trên card | Always CORE_TIERS |
| `iflux-market-ecosystem-seeds.js` | script | CORE_TIERS[1] | Market data seed | **Indirect** | Registry ecosystems | Always CORE_TIERS |
| `insight-share-store.js` | script | `iflux-web-ui.js` idle chain ~L1476 | Insight / Share | Header / share path | Loaded when logged-in idle | Not News Feed critical |
| `insight-share-ui.js` | script | `iflux-web-ui.js` idle chain ~L1476 | Insight / Share | Header / share | Same | `community-page.mount` cũng gọi `IfluxInsightShare.patchAll` nếu có |
| `inapp-notifications.js` | script | `iflux-web-ui.js` `loadUserNotifications` ~L1361 | Notification | Header bell | Logged-in only | |
| `iflux-user-notifications-ui.js` | script | same chain | Notification | Header | Logged-in only | |
| `profile-chat-store.js` | script | `iflux-web-ui.js` messages chain ~L1413 | Profile / Messages | Header messages | Logged-in only | |
| `iflux-header-messages-ui.js` | script | same | Profile / Messages | Header | Logged-in only | |
| `iflux-onboarding.js` | script | `iflux-web-ui.js` ~L1562–1563 | Onboarding | Optional | Idle / query `?onboarding=1` | |
| `iflux-pricing-modal.js` | script | `iflux-web-ui.js` ~L172–173 | Pricing / Upgrade UI | Optional | On demand openPricing | |
| `v4513226cdae34…` | script | Cloudflare (index / CDN) | **CDN / 3rd party** | N/A product | Beacon | Không thuộc iFlux app code |

### 1.2 CSS (theo list user)

| Resource | Type | Loaded by | Owner | Runtime Required (News-only) | Actually Used (code evidence) | Notes |
|----------|------|-----------|-------|------------------------------|-------------------------------|-------|
| `fonts.css` | stylesheet | `community/index.html` L7 | Design System | **Yes** | Yes — fonts | |
| `iflux-admin-ui.css` | stylesheet | `index.html` L8 | Design System | **Yes** | Yes — tokens + components | Bundle `@import` children |
| → `tabler-icons.min.css` | stylesheet | `iflux-admin-ui.css` L5 `@import` | Design System | **Yes** | Yes — `ti ti-*` icons trên feed | |
| → `color.css` … `utilities.css` | stylesheet | `iflux-admin-ui.css` L7–20 | Design System | **Yes** | Yes — tokens / components | Includes business-tokens, aliases, typography, spacing, components, atoms-extensions |
| `app-shell.css` | stylesheet | `index.html` L9 | App Shell | **Yes** | Yes — topnav, layout, widget overlay tokens | |
| → `onboarding.css` | stylesheet | `app-shell.css` L5 `@import` | Onboarding | Low for News-only | Loaded always with app-shell | |
| `widget-shell.css` | stylesheet | `widget-loader` ← `community.manifest.js` L31 `css[]` | Widget Shell / Layout | **Partial** | Grid / widget chrome; News feed dùng class trong community.css nhiều hơn | Manifest luôn inject |
| `block-templates.css` | stylesheet | same manifest L32 | Design System / Template | **Yes** (feed templates) | Yes nếu feed dùng class `ifx-*` từ templates | |
| `watchlist.css` | stylesheet | same manifest L33 | Watchlist Feature | **Conditional** | `community.css` reference `.ifx-stock-row__heart` (heart styles) — phụ thuộc watchlist.css selectors | Manifest luôn inject dù widget Placement=0 |
| `community.css` | stylesheet | same manifest L34 | Community Feature | **Yes** | Yes — feed / Tin tức layout | |
| `insight-share.css` | stylesheet | `iflux-web-ui.js` ~L1462–1466 | Insight / Share | Logged-in extras | Inject khi load insight-share chain | |

---

## 2. Dependency Graph

```
HTML (community/index.html)
├── CSS: fonts.css, iflux-admin-ui.css (+ primitives…), app-shell.css (+ onboarding.css)
└── JS: bootstrap.js
      ├── shell-boot.js
      │     └── legacy-bridge.loadScript → Platform stack
      │           ├── iflux-platform-boot → (+ market-status-bar.js)
      │           ├── iflux-api-bundle
      │           ├── auth
      │           ├── platform-layers-widgets
      │           ├── entitlement-catalog
      │           ├── plans-store ──fetch──► /api/plans/runtime
      │           ├── iflux-entitlements
      │           ├── block-templates (Shell copy #1)
      │           ├── iflux-widget-shell / paywall / gate
      │           ├── iflux-guest-shell
      │           └── [logged-in] iflux-web-ui.js
      │                 └── idle: notifications, messages, insight-share, onboarding, pricing-modal
      ├── community.manifest.js
      └── page-runtime.js
            ├── app-shell.js
            ├── widget-loader.js
            │     ├── loadStyles(manifest.css) → widget-shell / block-templates / watchlist / community
            │     └── import(WGT-COM-PAGE)
            │           └── community-page/index.js
            │                 ├── loadScriptTiers(CORE_TIERS) → Feature + Market seeds + Store + UI + Daily feed
            │                 ├── community-page.init → News Feed DOM
            │                 └── mountFromHostTree
            │                       ├── page-layout-engine (buildHostTree → 0 placements)
            │                       ├── BlockGate.apply
            │                       ├── mount-published-widgets (no-op if empty)
            │                       └── syncEmptyHostChrome (ẩn sidebar / empty hosts)
            └── mount-published-widgets.js (imported; unused body when empty)
```

---

## 3. Ownership Matrix (tóm tắt)

| Owner | Resources (chính) | Required on News-only? |
|-------|-------------------|------------------------|
| **Runtime** | bootstrap, shell-boot, page-runtime, legacy-bridge, widget-loader, mount-published-widgets, community.manifest | Yes (trừ mount-published body) |
| **App Shell** | app-shell.js/css, platform-boot (routes/nav), guest-shell, market-status-bar, iflux-web-ui (login) | Yes (header) |
| **Platform** | api-bundle, plans-store, platform-layers-widgets, entitlement-catalog, seo-url | Yes (permission + SEO links) |
| **Auth** | auth.js | Yes |
| **Permission** | entitlements, block-gate, widget-shell, block-paywall | Yes (engine chạy; Tin tức không bị khóa) |
| **Design System** | iflux-admin-ui.css tree, fonts, block-templates.js/css | Yes |
| **Community Feature** | community.css, community-page.js, community-store/ui/daily-feed (+ CORE_TIERS deps) | Yes for News |
| **Watchlist Feature** | watchlist-taxonomy, watchlist-store/ui, watchlist.css | Loaded always; **use** chỉ filter/heart paths |
| **Market / Registry** | market-registry-store, seed-data, ecosystem-seeds, mock-market | Loaded for ticker/% trên card |
| **Profile** | profile-users-store, profile-links, profile-chat*, header-messages* | Links: Yes; chat UI: login extras |
| **Notification** | inapp-notifications*, user-notifications-ui* | Login extras |
| **Insight / Share** | insight-share-* + css | Login / patchAll |
| **Onboarding** | onboarding.js + css (via app-shell) | Optional |
| **CDN** | Cloudflare beacon script | N/A |

---

## 4. Candidate List (Optimization Candidates — **không** thực hiện)

Chỉ ghi nhận. Không xóa / không lazy / không refactor trong Phase 1.

### Candidate A — `watchlist.css` luôn inject qua Community manifest

- **Lý do:** `community.manifest.js` L30–35 luôn liệt kê `watchlist.css` dù Placement Widget = 0.  
- **Bằng chứng:** `pages/community.manifest.js` `widgets[0].css`; `widget-loader.js` L52–54 `loadStyles(slot.css)`. Heart selectors trong `community.css` phụ thuộc class watchlist — Usage **partial**.  
- **Risk nếu sau này bỏ sớm:** Mất style heart / stock-row trên panel Cộng đồng khi bật lại widget heatmap.

### Candidate B — Market seed stack luôn nằm trong `CORE_TIERS` dù chỉ News

- **Lý do:** `iflux-market-seed-data.js` (~28 kB compressed transfer trong capture), ecosystem-seeds, registry-store, mock-market được `loadScriptTiers` **trước** khi biết Placement rỗng.  
- **Bằng chứng:** `widgets/community-page/index.js` L16–32; `mock-market.js` phụ thuộc registry. News card ticker % dùng mock/store.  
- **Risk:** Tin tức mất % ticker / entity resolve nếu cắt mà không có data path thay thế.

### Candidate C — `watchlist-taxonomy.js` / `watchlist-store.js` / `watchlist-ui.js` trên News index

- **Lý do:** Always in CORE_TIERS; News index không filter chủ đề vẫn nạp. `tax()` chỉ dùng banner filter; `IfluxWatchlistUI.bindHearts` trong `community-page.js` L557/572.  
- **Bằng chứng:** CORE_TIERS + community-page references.  
- **Risk:** Filter URL `/cong-dong?…` hoặc heart trên card hỏng.

### Candidate D — `mount-published-widgets.js` + `page-layout-engine` khi placements = 0

- **Lý do:** Vẫn import + `buildHostTree` fetch PagePublished để nhận tree rỗng rồi `syncEmptyHostChrome`.  
- **Bằng chứng:** `community-page/index.js` L50–71; page-runtime import mount-published.  
- **Risk:** Không còn ẩn đúng sidebar/host trống; Gate không re-apply sau tree.

### Candidate E — Header extras (`iflux-web-ui.js` idle chain) trên trang chỉ xem Tin tức

- **Lý do:** notifications / messages / insight-share / onboarding / pricing-modal không cần để render News Feed.  
- **Bằng chứng:** `iflux-web-ui.js` L1328–1563; chỉ khi logged-in.  
- **Risk:** Mất chuông / tin nhắn / share / onboarding trên header.

### Candidate F — `block-templates.js` nạp hai lần (Shell + CORE_TIERS)

- **Lý do:** Trùng công việc mạng (thường cache hit lần 2).  
- **Bằng chứng:** `shell-boot.js` L62 + `CORE_TIERS[0]` L19.  
- **Risk:** Thấp (idempotent); gom source có thể làm sai thứ tự boot nếu làm ẩu.

### Candidate G — `onboarding.css` luôn theo `app-shell.css`

- **Lý do:** `@import` trong app-shell dù không chạy onboarding.  
- **Bằng chứng:** `app-shell.css` L5.  
- **Risk:** Thấp; onboarding UI thiếu style nếu tách sai.

### Candidate H — Cloudflare beacon `v4513226…`

- **Lý do:** Không thuộc product runtime.  
- **Bằng chứng:** 3rd-party CDN; không có trong repo iFlux load path.  
- **Risk:** N/A (infra/CDN).

---

## 5. Kết luận ngắn (News-only)

1. **Header + Permission + DS + Runtime** vẫn là đường bắt buộc — đúng với list user.  
2. **Tin tức không “tự sống”:** vẫn đi qua **WGT-COM-PAGE composite** → `CORE_TIERS` nạp Watchlist/Market/Profile phụ trợ **trước** khi Layout Engine biết Placement = 0.  
3. Placement = 0 chỉ làm **`mountPublishedWidgets` no-op** + **ẩn host**; **không** cắt `CORE_TIERS` / manifest CSS.  
4. Phần lớn “dư” trong capture là **logged-in header idle** + **Community composite deps**, không phải Sitemap.

---

## Appendix A — CORE_TIERS scripts có thể không nằm trong paste Network

Nếu DevTools list bị cắt, các file sau **vẫn được gọi** bởi `loadScriptTiers(CORE_TIERS)`:

| Script | Tier | Owner |
|--------|------|-------|
| `mock-market.js` | 2 | Market |
| `watchlist-store.js` | 2 | Watchlist |
| `watchlist-ui.js` | 3 | Watchlist |
| `community-geo-ai.js` | 3 | Community |
| `runtime/page-layout-engine.js` | 3 | Runtime |
| `community-store.js` | 4 | Community |
| `community-ui.js` | 5 | Community |
| `community-daily-feed.js` | 6 | Community |
| `community-page.js` | 6 | Community |
| `iflux-header-search.js` | after tiers (`loadScript`) | App Shell / Search |

---

## Appendix B — Evidence index (file → function → line)

| Claim | Location |
|-------|----------|
| HTML entry module | `User_Web/community/index.html` L47 |
| `start` → shell → manifest → bootPage | `runtime/bootstrap.js` L189–211 |
| Shell `ensureParallel` list | `runtime/shell-boot.js` L54–67, logged-in L70–73 |
| Plans hydrate fetch | `plans-store.js` `hydrate` / `fetchRuntimePlans` (~L136–152, L239+) |
| Composite manifest + css | `pages/community.manifest.js` L14–36 |
| loadWidget styles + import | `runtime/widget-loader.js` L44–66 |
| CORE_TIERS + mountFromHostTree | `widgets/community-page/index.js` L16–71, L86–102 |
| loadScriptTiers | `runtime/legacy-bridge.js` L92–97 |
| Feed uses BlockTemplates | `community-ui.js` L187–253 |
| Feed uses SeoUrl / ProfileLinks | `community-ui.js` L157–179, L350+ |
| tax() for filter banner | `community-page.js` L214–228 |
| market-status-bar inject | `iflux-platform-boot.js` L457–477 |
| admin-ui css imports | `iflux-admin-ui/iflux-admin-ui.css` L5–20 |
| app-shell imports onboarding | `app-shell.css` L5 |
| idle header extras | `iflux-web-ui.js` L1328–1563 |

---

## Exit Criteria checklist

| Criterion | Status |
|-----------|--------|
| Inventory đầy đủ (theo list user + CORE_TIERS appendix) | PASS |
| Initiator / call stack có file+line | PASS |
| Ownership gán được | PASS |
| Runtime dependency trả lời được | PASS |
| Usage có bằng chứng code (Coverage: chưa chạy — ghi rõ) | PASS (static) |
| Không sửa bất kỳ dòng code nào | PASS |

**Phase 1 complete — không có thay đổi runtime.**
