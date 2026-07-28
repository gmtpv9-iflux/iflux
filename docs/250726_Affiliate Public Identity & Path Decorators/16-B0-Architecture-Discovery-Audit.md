# B0 — Architecture Discovery Audit

**Task:** Personal Affiliate Context (Cách 2 — pivot từ decorate-on-share)  
**Date:** 2026-07-27  
**Status:** Discovery only — **không code · không ADR**  
**Extended by:** [`17-B0-URL-Ownership-Navigation-Pipeline-Audit.md`](17-B0-URL-Ownership-Navigation-Pipeline-Audit.md) (URL owner · pipeline · severity upgrades)  
**Prerequisite:** P0–P5 (Phase A transport) CLOSED · Owner yêu cầu audit trước Phase B

---

## Mục tiêu audit

Xác nhận **hiện trạng** Navigation · Router · URL ownership · Login lifecycle trước khi viết ADR-AFF-004 và triển khai Phase B (Personal Affiliate Context).

**Ba lớp URL cần tách (Owner):**

| Lớp | Ý nghĩa | Ví dụ |
|-----|---------|--------|
| **Content Identity** | Canonical entity — SEO, OG, JSON-LD, sitemap | `https://iflux.vn/cong-dong/bai-viet/abc` |
| **User Context** | URL trên thanh địa chỉ khi user logged-in (target Cách 2) | `https://iflux.vn/IFL9552M/cong-dong/bai-viet/abc` |
| **Transport URL** | Incoming affiliate link (visitor mở link người khác) | `https://iflux.vn/IFLxxxx/cong-dong` |

Phase A (P0–P5) đã khóa **Transport = path-only**. Phase B chưa có — **User Context = sạch** (Cách 1).

---

# A. Navigation Ownership Inventory

Ai có thể thay đổi URL trên thanh địa chỉ?

## A.1 `history.pushState` / `history.replaceState`

| Owner | File | Mục đích | Prepend own publicId? |
|-------|------|----------|------------------------|
| **Affiliate Resolver** | `runtime/affiliate-resolver.js` | Incoming: strip `/IFL…/` → canonical path | ❌ (strip, ngược Cách 2) |
| Auth Social OAuth | `auth-social.js` | Xóa query OAuth khỏi URL | ❌ |
| Hub / profile chat | `hub-page.js`, `profile-chat-page.js` | Sync query params (tab, peer) | ⚠️ cần aware prefix |
| Community post | `community-post-page.js` | Hash anchor `#comment-id` only | ⚠️ |

**Không có SPA router pushState** cho page navigation — iFlux chủ yếu **full page load** (`location.replace` / `<a href>`).

## A.2 `location.href` / `location.replace` / `location.assign`

| Owner | Files (chính) | Mục đích | Prepend được? |
|-------|---------------|----------|---------------|
| **Auth** | `auth.js` (~10 call sites) | login redirect, `redirectAfterAuth`, `requireAuth`, cross-tab sync | ✅ **HIGH** — central |
| **Guest Shell** | `iflux-guest-shell.js` | Guest → login; logged-in → `appHomePath()` | ✅ |
| **App Shell / Header** | `iflux-web-ui.js` | Logout redirect, tier gate, nav clicks | ✅ |
| Auth inits | `auth-login-init.js`, `auth-otp-init.js`, `auth-forgot-init.js` | Post-auth navigation | ✅ |
| Register | `auth-register-init.js` → `redirectAfterAuth()` | Post-register | ✅ |
| Share feature | `runtime/share-feature-boot.js` | `/chia-se` → `/nha-cua-toi` | ✅ |
| Account feature | `runtime/account-feature-boot.js` | Messages redirect | ✅ |
| Entity redirects | `entity-pretty-url-redirect.js`, `stock-pretty-url-redirect.js` | Legacy URL cleanup | ⚠️ |
| Pricing / loyalty | `iflux-pricing-modal.js`, `loyalty-page.js`, `loyalty-affiliate.js` | CTA navigation | ⚠️ |
| Staging gate | `iflux-staging-gate.js` | Env redirect | ❌ |
| Mail deeplink | `iflux-mail-deeplink.js` | External deep links | ⚠️ |
| Google One Tap | `google-onetap.js` | Post-login | ✅ |
| Social OAuth | `auth-social.js` | Provider redirect out + return | ❌ / ⚠️ |
| Stock comment | `stock-comment-page.js` | Back navigation | ⚠️ |

## A.3 Route SoT — `IfluxRoutes.to()`

| Owner | File | Ghi chú |
|-------|------|---------|
| **Route SoT (primary)** | `iflux-routes.js` | `to(key, opts)` · `opts.canonical` → public path sạch |
| **Route SoT (duplicate guard)** | `iflux-platform-boot.js` | Cùng API; `if (global.IfluxRoutes) return` — load order quyết định winner |

**App Shell nav** (`iflux-platform-boot.js`):

- `hrefFor(routeKey)` → **luôn** `IfluxRoutes.to(routeKey, { canonical: true })`
- Topnav brand → `shell.hrefFor('community')` → `/cong-dong` sạch
- User Hub menu → mix `href` literal (`/tai-khoan`, `/membership`) + `hrefFor(route)`

→ **Điểm prepend tập trung nhất:** `IfluxRoutes.to()` + `hrefFor()` — nếu Cách 2, đây là candidate owner #1.

## A.4 HTML hardcoded `href` (initial paint)

| Pattern | Ước lượng | Ghi chú |
|---------|-----------|---------|
| `href="/cong-dong"` trong `.html` shell | ~102 HTML files | Brand link, footer — **paint trước JS** |
| JS string `href="..."` builders | **~60 files** · **~150+ sites** trong `iflux-web-ui/` | Widget renderers, community cards, profile |

Shell re-render nav sau boot (`IfluxAppShellHeader.render`) nhưng **nhiều link trong content widgets hardcode path sạch**.

## A.5 Phân loại ownership (tóm tắt)

| Owner | Vai trò URL bar | Cách 2: prepend? |
|-------|-----------------|------------------|
| **App Shell / IfluxRoutes** | Sinh link điều hướng chính | ✅ **Owner mới (target)** |
| **Auth lifecycle** | Redirect sau login/logout/session | ✅ activate context tại đây |
| **Affiliate Resolver** | Incoming strip prefix | ❌ giữ strip cho **visitor** · không strip **own context** |
| **Share Foundation** | Decorate outgoing (P3) | ⬇️ LOW — thin/no-op nếu URL đã prefix |
| **Widget renderers** | Hardcode entity href | ⚠️ HIGH debt — phải qua Routes hoặc helper |
| **SEO layer** | Canonical/OG — **không** đụng address bar | ❌ never prepend |
| **path-base.js** | `<base href>` physical dir | ⚠️ **CRITICAL** — chưa hiểu `/IFL…/` segment (B0+ nâng cấp) |

---

# B. Link Generation Inventory

## B.1 Builders có hệ thống (SoT / Foundation)

| Builder | Owner | Output affiliate? | Ghi chú |
|---------|-------|-------------------|---------|
| `IfluxRoutes.to(key, opts)` | Platform Runtime | ❌ luôn sạch (`canonical: true` default nav) | **~primary** |
| `IfluxSeoUrl.postSlugPath()` / `stockHref()` / … | SEO module | ❌ content path | Entity links |
| `IfluxShareFoundation.buildShareUrl()` | Share Foundation | ✅ path decorate (P3) | Chỉ khi explicit share |
| `IfluxShareFoundation.decorateAffiliateRef()` | Share Foundation | ✅ | Called from buildShareUrl |
| `IfluxLoyaltyAffiliateStore.buildReferralLink()` | Loyalty | ✅ via Foundation | Profile affiliate tab |
| `community-ui.shareUrl(slug)` | Community UI | ❌ **canonical only** | **Dead export (0 consumers)** — delete candidate, B0+ |
| `interaction/catalog/index.js` resolve + share | Interaction | ✅ via Foundation | Community post share button |
| `share-action.js` `createShare()` | DS Foundation UI | ✅ via Foundation | Insight card share |
| `auth.js` `loginWithReturn()` | Auth | ❌ return path sạch | Query `?return=` only |

## B.2 Consumer surfaces (copy / share / open)

| Surface | File | URL source | Affiliate? |
|---------|------|------------|------------|
| Web Share API | `interaction/catalog/index.js` | `buildShareUrl` | ✅ decorate |
| Clipboard copy | `interaction/catalog/index.js`, `share-action.js` | same | ✅ |
| QR | `share-action.js` | `shareResult.qrUrl` | ✅ |
| Insight card URL input | `share-action.js` | `createShare().url` | ✅ |
| Address bar copy | Browser | **current location** | ❌ today · ✅ Cách 2 |
| Referral link field | `profile-affiliate.js`, `loyalty-affiliate.js` | `buildReferralLink` | ✅ |
| Header search pick | `iflux-header-search.js` | `active.getAttribute('href')` | ❌ |
| Mail deeplink | `iflux-mail-deeplink.js` | configured URLs | ❌ |

## B.3 Builder count (ước lượng)

| Loại | Số lượng | Risk Cách 2 |
|------|----------|-------------|
| Central SoT (`IfluxRoutes`) | **1** (+1 duplicate file) | Modify 1 → cover nav |
| SEO entity builders (`IfluxSeoUrl`) | **1 module** · many methods | Keep canonical |
| Share decorate path | **1** (Foundation) | Demote to thin |
| **Ad-hoc hardcoded** `/cong-dong`, `/co-phieu/...` | **~60 JS files** | **HIGH** — không tự động prefix |
| **Parallel shareUrl** (community-ui) | **1** | Must align or delete |

**Kết luận B:** Cách 2 **không** loại bỏ hết builder — chuyển trách nhiệm từ **Share decorate** sang **Routes/context**, nhưng **~60 file hardcode href** vẫn là debt lớn nếu không đi qua Routes.

---

# C. Router Surface Inventory

## C.1 Route registry (`IfluxRoutes.ROUTES`)

| Route key | Public path | Zone | Auth | Shell boot |
|-----------|-------------|------|------|------------|
| home | `/nha-cua-toi` | app | yes | MARKET_CORE |
| market | `/thi-truong` | app | no | MARKET_PLATFORM |
| community | `/cong-dong` | app | no | MARKET_CORE |
| flow, stocks, sectors, … | … | app | mixed | MARKET_PLATFORM |
| auth.* | `/dang-nhap`, … | auth | — | auth-*-boot |
| share | `/chia-se` | app | no | share-feature-boot |

**`detectRoute(path)`** — **CRITICAL** — không strip `/IFL…/` prefix → với Cách 2 **route detection sẽ fail** trên `/IFL9552M/cong-dong` unless normalized first (B0+).

## C.2 Boot patterns (trang → loader)

| Pattern | Ví dụ trang | Navigation style |
|---------|-------------|------------------|
| **Shell boot** | `community/index.html` → `bootstrap.js` → `shell-boot.js` | Full page + App Shell |
| **Feature boot** | `share/`, `account/`, `checkout/`, `comments/` | Module boot + redirect |
| **Auth boot** | `auth/login.html` | Isolated auth zone |
| **Legacy redirect HTML** | `community/cong-dong/*/index.html` | `location.replace` → bai-viet |
| **Static article OG shell** | nginx/static HTML | Meta sạch · refresh to runtime |

## C.3 Navigation mechanism mix

| Mechanism | Phạm vi | % ước lượng |
|-----------|---------|-------------|
| Full page `<a href>` | Shell nav, widgets, cards | **~70%** |
| `location.replace` | Auth, gates, legacy cleanup | **~20%** |
| `history.replaceState` | Resolver strip, query/hash sync | **~5%** |
| `pushState` SPA | **Không có** router SPA chính | **0%** |

## C.4 Hardcode vs Router

| Hạng mục | Trạng thái |
|----------|------------|
| Topnav / User Hub (post-JS) | Qua `IfluxAppShell` + `hrefFor` ✅ |
| Initial HTML shell (`href="/nha-cua-toi"`) | Hardcode ❌ |
| Widget/card links (market, community, stock) | **Hardcode path** ❌ |
| `path-base.js` EXACT map | 40+ paths sạch — **không có IFL segment** ❌ |
| nginx affiliate rewrite | Strip `/IFL…/` server-side → file vật lý ✅ incoming |

**Kết luận C:** Prepend **khả thi tập trung** qua `IfluxRoutes` + auth redirect, nhưng **path-base + detectRoute + hardcode widgets** là blocker phải xử lý trong Phase B.

---

# D. Login / Session Lifecycle

## D.1 Boot sequence (mọi trang load Auth)

```
auth.js IIFE boot
  → captureRefFromUrl()          [Loyalty — path incoming only, P5]
  → validateLocalSession()
  → initCrossTabSync()
  → refreshSessionFromApi()      [if API mode + logged in]
  → dispatch 'iflux-auth-changed' { boot: true }
```

**Không có bước activate affiliate context.**

## D.2 Login success flow

```
User submit login (auth-login-init.js)
  → IfluxAuth.loginWithEmailApi / loginLocal
  → establishSession(user, token)
       → syncReferralLink(user)     [buildReferralLink → Foundation]
       → IfluxUserDataSync.hydrateFromServer()
  → redirectAfterAuth()
       → ?return= path OR appHomePath()
       → appHomePath = IfluxRoutes.to('community', { canonical: true })
       → location.replace('/cong-dong')   ← SẠCH, không prefix
```

## D.3 Register success flow

```
auth-register-init.js submit
  → IfluxAuth.register()
  → establishSession()
  → redirectAfterAuth()            ← same as login
```

## D.4 Session restore / refresh

| Event | Handler | URL impact |
|-------|---------|------------|
| Page reload (logged in) | `refreshSessionFromApi()` | None — stays current path |
| Cross-tab storage sync | `handleCrossTabAuthSync()` | Redirect if auth page / guest / requiresAuth |
| `iflux-auth-changed` listener | `iflux-platform-boot.js` render nav | Re-render links (canonical) |
| Guest shell DOMContentLoaded | Redirect logged-in off guest paths | → `appHomePath()` |

## D.5 Logout

```
IfluxAuth.logout()
  → clear session storage
  → NO automatic redirect in logout()
UI (iflux-web-ui.js):
  → logout() + location.href = data-logout-href || siteRoot()
```

**Logout không strip prefix** (vì chưa có prefix) — Cách 2 cần **deactivate context → canonical URL**.

## D.6 Lifecycle events — activate prefix ở đâu? (Cách 2 — **chưa có**, candidate)

| Event | Hiện tại | Candidate activate? |
|-------|----------|---------------------|
| Register success | redirect sạch | ✅ **Yes** — before redirect |
| Login success | redirect sạch | ✅ **Yes** |
| Restore session (reload) | no-op URL | ✅ **Yes** — if path sạch + has publicId |
| Refresh token / authMe | profile hydrate only | ⚠️ Maybe — if referral_code newly available |
| Reload tab | same | ✅ Same as restore |
| Logout | site root | ✅ **Deactivate** — strip own prefix |
| Switch account | N/A (single session) | ✅ Same as logout + login |
| Incoming `/IFLxxxx/…` (visitor) | capture + strip | ❌ **Không** activate own — different publicId |

**Prefix insert point (evidence-based, not guess):** ngay sau `establishSession()` khi `user.referral_code` valid **HOẶC** trong `redirectAfterAuth()` / first navigation helper — **Owner chốt trong ADR**.

---

# E. Canonical Boundary Inventory

## E.1 Three-layer separation (audit evidence)

| Layer | Source | Uses `location.href`? | Contains publicId? | Evidence |
|-------|--------|----------------------|-------------------|----------|
| **Content Identity** | Article static HTML (nginx) | ❌ | ❌ | Production curl PASS P4 |
| **Content Identity** | `seo-url.js` applyStoryMeta | ❌ metadata | ❌ | `meta.canonical` from API |
| **Content Identity** | `community-ui.js` applyPostMeta | ❌ | ❌ | `og:url` from metadata |
| **Content Identity** | `community-store.js` buildJsonLd | ❌ | ❌ | `pageUrl` param |
| **Content Identity** | `page-definition.js` | ❌ | ❌ | explicit `seo.canonical` |
| **User Context** | `location.pathname` (browser) | ✅ | ❌ today · ✅ Cách 2 | address bar |
| **Transport** | Incoming affiliate URL | ✅ | ✅ referrer id | P2 resolver |

## E.2 Risk rows (dùng `location.href` cho meta)

| File | Pattern | Risk |
|------|---------|------|
| `community-post-page.js` | `canonical = seo.canonical_url \|\| location.href` | **HIGH** — fallback có thể lẫn prefix Cách 2 |
| `interaction/catalog/index.js` | `normalizeShareUrl(location.href)` guest share | **MEDIUM** — share input |
| `community-ui.js` shareUrl | builds from SeoUrl, not location | ✅ LOW |

## E.3 Share payload vs canonical

| Output | Owner | Canonical? |
|--------|-------|------------|
| `sharePayload.url` | Share Foundation | Transport (path affiliate P3) |
| `metadata.canonical` | Community API / store | ✅ Content Identity |
| Insight card copy URL | share-action.js | Transport |

## E.4 Sitemap / RSS / API

| System | Affiliate in URL? | Impact Cách 2 |
|--------|-------------------|---------------|
| Admin sitemap UI | Content paths only | NONE |
| RSS ingest (backend) | Content URLs | NONE |
| Public API article metadata | `canonical_url` field sạch | NONE |
| nginx OG static shell | Clean canonical | NONE |

## E.5 History URL vs canonical (hiện tại P2)

Incoming visitor `/IFL9552M/cong-dong`:

1. nginx serves page  
2. `affiliate-resolver.js` capture + **`replaceState` → `/cong-dong`**  
3. Address bar = **sạch** (User Context = canonical today)

Cách 2 logged-in user: address bar = **prefixed** · canonical meta = **sạch** → **ranh giới chưa tồn tại trên Production** — phải **build mới** và **test**.

---

# F. Impact Matrix

| Module | Impact | Lý do | Phase B candidate |
|--------|--------|-------|-------------------|
| **IfluxRoutes.to / detectRoute** | **CRITICAL** | Prepend own publicId; normalize incoming | B2 |
| **App Shell (platform-boot, web-ui header)** | **HIGH** | All nav href; auth-changed re-render | B1 |
| **Auth (establishSession, redirectAfterAuth)** | **HIGH** | Login/register/logout lifecycle | B1 |
| **path-base.js** | **CRITICAL** | Physical base detection ignores IFL segment | B2 |
| **affiliate-resolver.js** | **MEDIUM** | Dual mode: incoming strip vs own keep | B3 |
| **Widget renderers (~60 files)** | **MEDIUM** | Hardcoded href bypass Routes | B2+ |
| **Share Foundation decorate** | **LOW → NONE** | Thin/no-op if URL already prefixed | B4 |
| **Loyalty capture** | **LOW** | Path incoming unchanged | — |
| **SEO / canonical / JSON-LD** | **MEDIUM** | Must NOT pick up User Context | B4 verify |
| **community-ui.shareUrl** | **LOW (dead)** | 0 consumers — delete export | B4 |
| **nginx rewrite** | **LOW** | Already strips for static serve | — |
| **RSS / sitemap / API** | **NONE** | Content identity only | — |
| **Admin** | **NONE** | Out of scope | — |

---

# G. Findings — blockers trước ADR

1. **Không có single navigation owner hôm nay** — Routes + hardcode + location.replace rải ~60 files.
2. **`IfluxRoutes.to({ canonical: true })` là anti-prefix by design** — App Shell dùng everywhere.
3. **Resolver strip mâu thuẫn Cách 2** cho own publicId — cần dual mode.
4. **`detectRoute` / `path-base` không IFL-aware — CRITICAL** — `/IFL9552M/cong-dong` sẽ break base href + auth gate.
5. **Login redirect luôn về path sạch** — không có hook activate context.
6. **Canonical boundary chưa tách User Context** — 1 fallback (`community-post-page.js`) dùng `location.href`.
7. **Dead export** `community-ui.shareUrl()` — 0 consumers, delete candidate.

---

# H. Recommended next step (không code)

| Step | Deliverable |
|------|-------------|
| Owner review B0 | Confirm findings + chốt 4 lifecycle decisions |
| **ADR-AFF-004** | Personal Affiliate Context — owner map old → new |
| Phase B plan | B1 Shell activate · B2 Routes · B3 Resolver dual · B4 regression |

**Cấm:** code Phase B · viết ADR trước Owner review B0.

---

*B0 audit reproduce:* `rg 'pushState|replaceState|location\.(href|replace)|IfluxRoutes\.to|buildShareUrl|canonical|og:url' User_Web/iflux-web-ui` · Production curl canonical (P4 evidence).*
