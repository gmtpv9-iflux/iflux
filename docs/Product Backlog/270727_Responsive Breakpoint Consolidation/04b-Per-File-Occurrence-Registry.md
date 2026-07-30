# 04b — Per-File Occurrence Registry · Phase A

**Date:** 2026-07-27 (rev.3)  
**Status:** **DRAFT — seeded from repo scan**  
**Parent:** [`04-Breakpoint-Discovery-Audit.md`](04-Breakpoint-Discovery-Audit.md)  
**Rule:** **Mỗi occurrence = một dòng.** Không gộp theo giá trị số.

**Authority:** Discovery / draft only. **Phase C Decision Matrix** = quyết định migrate · D4 catalog · 09 populate — agent **cấm** dùng row 04b `REVIEW` như GO.

---

## 1. Quy tắc registry

| Column | Required before Phase E |
|--------|-------------------------|
| **Value** | px |
| **File** | path + line |
| **Semantic** | `mobile-shell` · `pricing-grid-compact` · … |
| **Owner** | module / team responsibility |
| **Consumers** | CSS · JS · CSS + JS |
| **Decision** | MAP · NO MAPPING · KEEP · EXCEPTION · REVIEW |
| **Regression scope** | surfaces / viewports (Phase C fill) |

**Semantic / Owner** cột draft — Owner xác nhận Phase B.  
**Decision** mặc định `REVIEW` — chỉ Owner đổi Phase C.

**Tổng:** **66 occurrences** · **11 giá trị px** · **0 Foundation rows** (Foundation chỉ trong `layout.css` — không liệt kê per-file trừ khi vi phạm).

---

## 2. Semantic groups (rollup — derive từ §3, không thay §3)

Dùng cho **AC-BP-02** — migrate theo semantic bundle, không theo số px.

| Semantic | Occurrences | Consumers | AC-BP-02 / AC-BP-06 |
|----------|-------------|-----------|---------------------|
| `mobile-shell` | 9 | **CSS + JS** | **CRITICAL** — một semantic → `bp-lg` · mọi file App Shell |
| `header-messages-mobile` | 5 | JS | Có thể alias `mobile-shell` — Owner quyết |
| `account-profile-mobile` | 3 | CSS | Account Profile · có thể MAP `bp-lg` CSS-only |
| `block-template-mobile` | 2 | CSS | Block Templates |
| `community-layout-tablet` | 2 | CSS | Community · Feature Threshold |
| `ds-studio-tablet` | 2 | CSS | Admin DS Studio |
| `flow-page-layout` | 2 | CSS | Flow Page |
| `widget-shell-narrow` | 2 | CSS | Widget Shell |
| *(single-occurrence semantics)* | 1 each | CSS or JS | Per-row Decision Matrix |

**Lưu ý:** Cùng **900px** · **960px** · **720px** có **nhiều semantic khác nhau** — không một Decision cho cả số.

---

## 3. Full per-file registry

| Value | File | Semantic | Owner | Consumers | Decision |
|-------|------|----------|-------|-----------|----------|
| 480 | `iflux-web-ui/block-templates.css` L595 | `block-template-narrow` | Shared UI · Block Templates | CSS | REVIEW |
| 480 | `iflux-web-ui/profile.css` L384 | `affiliate-summary-narrow` | Account Profile · Affiliate | CSS | REVIEW |
| 520 | `iflux-web-ui/alerts.css` L145 | `alert-form-narrow` | Alerts | CSS | REVIEW |
| 720 | `app/dashboard/dashboard.css` L43 | `dashboard-cards-narrow` | Admin · Dashboard | CSS | REVIEW |
| 720 | `iflux-web-ui/community.css` L2203 | `community-feed-narrow` | Community | CSS | REVIEW |
| 720 | `iflux-web-ui/stock.css` L873 | `stock-layout-narrow` | Market · Stock | CSS | REVIEW |
| 720 | `iflux-web-ui/widget-shell.css` L633 | `widget-shell-narrow` | Widget Shell | CSS | REVIEW |
| 720 | `iflux-web-ui/widget-shell.css` L652 | `widget-shell-narrow` | Widget Shell | CSS | REVIEW |
| 767 | `iflux-admin-ui/spacing.css` L123 | `admin-spacing-mobile` | Admin · DS Spacing | CSS | REVIEW |
| 767.98 | `iflux-web-ui/block-templates.css` L929 | `block-template-tablet` | Shared UI · Block Templates | CSS | REVIEW |
| 767.98 | `iflux-web-ui/block-templates.css` L946 | `block-template-tablet` | Shared UI · Block Templates | CSS | REVIEW |
| 767.98 | `iflux-web-ui/market-components.css` L255 | `market-components-tablet` | Market | CSS | REVIEW |
| 767.98 | `iflux-web-ui/watchlist.css` L301 | `watchlist-row-tablet` | Watchlist | CSS | REVIEW |
| 900 | `app/chu-de/chu-de-admin.css` L151 | `chu-de-admin-layout` | Admin · Chu-de | CSS | REVIEW |
| 900 | `ds-sot.css` L1184 | `ds-studio-layout` | Admin · DS Studio | CSS | REVIEW |
| 900 | `iflux-admin-ui/components.css` L2159 | `admin-components-narrow` | Admin · Components | CSS | REVIEW |
| 900 | `iflux-web-ui/app-shell.css` L683 | `header-layout-min` | App Shell · Header | CSS | REVIEW |
| 900 | `iflux-web-ui/flow.css` L711 | `flow-page-layout` | Flow Page | CSS | REVIEW |
| 900 | `iflux-web-ui/flow.css` L744 | `flow-page-layout` | Flow Page | CSS | REVIEW |
| 900 | `iflux-web-ui/pricing.css` L208 | `pricing-grid-compact` | Subscription · Pricing | CSS | REVIEW |
| 900 | `iflux-web-ui/profile.css` L637 | `profile-layout-band` | Account Profile | CSS | REVIEW |
| 960 | `design-sandbox.css` L227 | `design-sandbox-tablet` | Admin · DS Sandbox | CSS | REVIEW |
| 960 | `ds-sot.css` L153 | `ds-studio-tablet` | Admin · DS Studio | CSS | REVIEW |
| 960 | `ds-sot.css` L413 | `ds-studio-tablet` | Admin · DS Studio | CSS | REVIEW |
| 960 | `iflux-web-ui/community.css` L1278 | `community-layout-tablet` | Community | CSS | REVIEW |
| 960 | `iflux-web-ui/community.css` L1968 | `community-layout-tablet` | Community | CSS | REVIEW |
| 960 | `iflux-web-ui/hub.css` L75 | `hub-layout-tablet` | Hub | CSS | REVIEW |
| 960 | `iflux-web-ui/market-components.css` L263 | `market-components-tablet` | Market | CSS | REVIEW |
| 960 | `iflux-web-ui/market.css` L223 | `market-layout-tablet` | Market | CSS | REVIEW |
| 960 | `iflux-web-ui/profile.css` L284 | `profile-layout-tablet` | Account Profile | CSS | REVIEW |
| 960 | `iflux-web-ui/widget-shell.css` L495 | `widget-shell-tablet` | Widget Shell | CSS | REVIEW |
| 1023.98 | `iflux-web-ui/app-shell.css` L67 | `mobile-shell` | App Shell | CSS | REVIEW |
| 1023.98 | `iflux-web-ui/app-shell.css` L849 | `mobile-shell` | App Shell | CSS | REVIEW |
| 1023.98 | `iflux-web-ui/block-templates.css` L922 | `block-template-mobile` | Shared UI · Block Templates | CSS | REVIEW |
| 1023.98 | `iflux-web-ui/block-templates.css` L939 | `block-template-mobile` | Shared UI · Block Templates | CSS | REVIEW |
| 1023.98 | `iflux-web-ui/community-post-page.js` L325 | `community-post-mobile` | Community | JS | REVIEW |
| 1023.98 | `iflux-web-ui/community.css` L1959 | `community-bottom-surface` | Community | CSS | REVIEW |
| 1023.98 | `iflux-web-ui/group-page.js` L8 | `group-page-mobile` | Community | JS | REVIEW |
| 1023.98 | `iflux-web-ui/iflux-header-messages-ui.js` L94 | `header-messages-mobile` | App Shell · Messages | JS | REVIEW |
| 1023.98 | `iflux-web-ui/iflux-header-messages-ui.js` L207 | `header-messages-mobile` | App Shell · Messages | JS | REVIEW |
| 1023.98 | `iflux-web-ui/iflux-header-messages-ui.js` L224 | `header-messages-mobile` | App Shell · Messages | JS | REVIEW |
| 1023.98 | `iflux-web-ui/iflux-header-messages-ui.js` L230 | `header-messages-mobile` | App Shell · Messages | JS | REVIEW |
| 1023.98 | `iflux-web-ui/iflux-header-messages-ui.js` L236 | `header-messages-mobile` | App Shell · Messages | JS | REVIEW |
| 1023.98 | `iflux-web-ui/iflux-onboarding.js` L354 | `onboarding-mobile` | Onboarding | JS | REVIEW |
| 1023.98 | `iflux-web-ui/iflux-user-notifications-ui.js` L300 | `notifications-mobile` | App Shell · Notifications | JS | REVIEW |
| 1023.98 | `iflux-web-ui/iflux-web-ui.js` L571 | `mobile-shell` | App Shell | JS | REVIEW |
| 1023.98 | `iflux-web-ui/iflux-web-ui.js` L703 | `mobile-shell` | App Shell | JS | REVIEW |
| 1023.98 | `iflux-web-ui/iflux-web-ui.js` L816 | `mobile-shell` | App Shell | JS | REVIEW |
| 1023.98 | `iflux-web-ui/iflux-web-ui.js` L1051 | `mobile-shell` | App Shell | JS | REVIEW |
| 1023.98 | `iflux-web-ui/iflux-web-ui.js` L1260 | `mobile-shell` | App Shell | JS | REVIEW |
| 1023.98 | `iflux-web-ui/iflux-web-ui.js` L1370 | `mobile-shell` | App Shell | JS | REVIEW |
| 1023.98 | `iflux-web-ui/iflux-web-ui.js` L1466 | `mobile-shell` | App Shell | JS | REVIEW |
| 1023.98 | `iflux-web-ui/market-components.css` L240 | `market-components-mobile` | Market | CSS | REVIEW |
| 1023.98 | `iflux-web-ui/profile-chat-page.js` L6 | `messages-mobile-layout` | Messages · Profile Chat | JS | REVIEW |
| 1023.98 | `iflux-web-ui/profile.css` L304 | `account-profile-mobile` | Account Profile | CSS | REVIEW |
| 1023.98 | `iflux-web-ui/profile.css` L320 | `account-profile-mobile` | Account Profile | CSS | REVIEW |
| 1023.98 | `iflux-web-ui/profile.css` L398 | `account-profile-mobile` | Account Profile | CSS | REVIEW |
| 1023.98 | `iflux-web-ui/runtime/account-feature-boot.js` L9 | `account-mobile-nav` | App Shell · Account Profile | JS | REVIEW |
| 1023.98 | `iflux-web-ui/stock-page.js` L6 | `stock-page-mobile-js` | Market · Stock | JS | REVIEW |
| 1023.98 | `iflux-web-ui/stock.css` L841 | `stock-page-mobile` | Market · Stock | CSS | REVIEW |
| 1100 | `app/dashboard/dashboard.css` L39 | `dashboard-grid-collapse` | Admin · Dashboard | CSS | REVIEW |
| 1100 | `iflux-web-ui/flow.css` L705 | `flow-page-wide` | Flow Page | CSS | REVIEW |
| 1100 | `iflux-web-ui/market.css` L97 | `market-grid-collapse` | Market | CSS | REVIEW |
| 1100 | `iflux-web-ui/stock.css` L851 | `stock-layout-collapse` | Market · Stock | CSS | REVIEW |
| 1199.98 | `iflux-admin-ui/components.css` L160 | `admin-layout-tablet` | Admin · Components | CSS | REVIEW |
| 1200 | `iflux-admin-ui/iflux-admin-ui.js` L21 | `admin-shell-layout` | Admin Shell | JS | REVIEW |

---

## 4. Ví dụ — cùng 900px · ba semantic khác nhau

| Value | File | Semantic | Owner | Consumers | Decision (draft pattern) |
|-------|------|----------|-------|-----------|----------------------------|
| 900 | `pricing.css` | `pricing-grid-compact` | Subscription · Pricing | CSS | EXCEPTION? |
| 900 | `dashboard.css` *(nếu có)* | `dashboard-compact-mode` | Admin · Dashboard | CSS | MAP `bp-lg`? |
| 900 | `profile.css` | `profile-layout-band` | Account Profile | CSS | REVIEW |

→ **Ba dòng · ba Decision có thể khác nhau.**

---

## 5. Phase A gate (per-file)

- [x] 66 occurrences logged
- [ ] Owner confirms Semantic + Owner columns (no TBD)
- [ ] Consumers column verified (CSS / JS / both)
- [ ] §2 semantic groups reviewed for AC-BP-02 bundles
- [ ] Roll up to Decision Matrix §7 in [`04-Breakpoint-Discovery-Audit.md`](04-Breakpoint-Discovery-Audit.md) — **by semantic**, not by px alone

---

*Registry rev.3 — paths relative to `User_Web/` or `Admin_Design_system/`.*
