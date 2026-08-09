# Affiliate Attribution Architecture Audit (Production)

**Date:** 2026-07-28  
**Scope:** Production hiện trạng · Business Lifecycle (Affiliate Link → Account Created)  
**Constraints:** NO CODE · NO Solution · NO SoT · NO ADR · NO implementation proposal (tại thời điểm audit)

**Trigger:** D5 regression FAIL — Owner test Path C (link `/IFL...` → Đăng nhập header → Google) · không notification · không bảng Affiliate.

**Task pack:** [README.md](README.md) · SoT/Solution tạo sau audit → [02-SoT-Affiliate-Attribution.md](02-SoT-Affiliate-Attribution.md) · [05-Solution-Design-Identity-Creation.md](05-Solution-Design-Identity-Creation.md)

**Bản gốc (mirror):** [`docs/Affiliate-Attribution-Architecture-Audit.md`](../../Affiliate-Attribution-Architecture-Audit.md)

---

## 1. Architecture Discovery

### 1.1 Tóm tắt hiện trạng

Affiliate Attribution trên Production **không phải một pipeline thống nhất**. Có **nhiều lớp capture** (client transport), **một authority server** (`users.referred_by`), và **một lớp client graph** (`localStorage` parents map) **không đồng bộ ngược lên server**.

Server chỉ ghi `referred_by` tại **INSERT user** khi request signup/social mang `referral_code` (email OTP chain) hoặc OTP payload đã resolve sẵn `referred_by`.

Mọi hành vi **sau** account create (login social, `applyReferrerToUser`, `linkNewUserToReferrer`) chỉ mutate **client localStorage** — **không** cập nhật Postgres · **không** trigger notification server.

### 1.2 Affiliate Link — cách Production nhận URL

| Input URL | Nginx | Browser `location.pathname` | Capture chạy? |
|-----------|-------|------------------------------|---------------|
| `/IFL[A-Z0-9]{5,17}` | rewrite → `/` (community) | vẫn `/IFL…` | ✅ |
| `/IFL…/cong-dong/…` | strip prefix → `/cong-dong/…` | vẫn `/IFL…/…` | ✅ |
| `/MINH10` | không match IFL gate | `/MINH10` | ❌ (404 hoặc không parse) |
| `?ref=IFL…` | 301 giữ query | không path IFL | ❌ incoming P5 retired |
| `/home?ref=…` | 301 → `/nha-cua-toi?ref=…` | không path IFL | ❌ |

**Evidence:** `infra/nginx-iflux-production-locations.conf` L23–37, L64–67 · curl Production 2026-07-28.

Outgoing link builder: `loyalty-affiliate-store.js` `buildReferralLink()` — regex `^IFL[A-Z0-9]{5,17}$` · fallback Share Foundation `decorateAffiliateRef()`.

---

## 2. Data Ownership

### 2.1 Bảng ownership

| Artifact | Storage | Owner module | Authority | Dùng cho signup bind? | Dùng cho UI Affiliate table? | Dùng cho notification? |
|----------|---------|--------------|-----------|----------------------|------------------------------|------------------------|
| `users.referred_by` | Postgres | `legacy-auth/auth.service.js` | **Server SoT** | ✅ (nếu set lúc INSERT) | ✅ via `GET /auth/referrals/sync` | ✅ (input `referredById`) |
| `email_verification_otps.payload.referred_by` | Postgres | `startRegistration` | Temp (pre-user) | ✅ → verifyEmail | ❌ | ❌ |
| `iflux_ref_code` | cookie + localStorage | `affiliate-resolver.js` · `loyalty-affiliate-store.js` | Client transport | ⚠️ chỉ nếu consumer đọc & gửi API | ❌ trực tiếp | ❌ |
| `iflux_ref_from_link` | localStorage | cùng owner cookie | Client flag | ⚠️ UI/register logic | ❌ | ❌ |
| `iflux_aff_context_v1` | localStorage | `affiliate-resolver.js` | Client snapshot | ❌ không đọc bởi auth API | ❌ | ❌ |
| `iflux_pnc_domain_v1` | sessionStorage | `navigation-context.js` | PNC domain | ❌ | ❌ | ❌ |
| `iflux_referral_parents_v1` | localStorage | `loyalty-affiliate-store.js` | Client graph | ❌ server | ✅ `listNetworkMembers` local | ❌ |
| `iflux_referral_members_meta_v1` | localStorage | `loyalty-affiliate-store.js` | Client meta | ❌ | ✅ (joinedAt local) | ❌ |
| `iflux_referral_directory_v1` | localStorage | `loyalty-affiliate-store.js` | Code→user cache | validate UI | ❌ | ❌ |

### 2.2 Production DB evidence (2026-07-28)

```text
users total: 15
users with referred_by: 1 (phamvan3@gmail.com → phamvan@gmail.com, email signup 2026-07-06)
google users: 6 — referred_by: 0/6
email users: 9 — referred_by: 1/9
user_inbox_notifications AFFILIATE_REFERRAL_SUCCESS: 0 (ever)
Owner test user trungpv.gpg@gmail.com: google · created 12:41 · referred_by NULL
```

---

## A. Affiliate Context Capture

### A.1 Thành phần capture

| # | Component | File | Trigger | Reads URL | Persists | Keys |
|---|-----------|------|---------|-----------|----------|------|
| C1 | **Affiliate Resolver** | `User_Web/iflux-web-ui/runtime/affiliate-resolver.js` | Auto on every HTML (`nginx sub_filter`) | `parseAffiliatePath(pathname)` — segment[1] `IFL…` | cookie + localStorage | `iflux_ref_code`, `iflux_ref_from_link`, `iflux_aff_context_v1` |
| C2 | **Loyalty Affiliate Store** | `loyalty-affiliate-store.js` | `captureRefFromUrl()` on DOMContentLoaded + auth.js boot | `parsePublicIdFromPath()` (delegates AR) | same keys via `storeRefCode` | same |
| C3 | **Auth.js fallback** | `auth.js` L439–442 | `captureRefFromUrl()` module load | delegate C2 | delegate C2 | — |
| C4 | **Register init** | `auth-register-init.js` L48–49 | page init | delegate C2 | — | — |
| C5 | **PNC Lifecycle** | `pnc-lifecycle.js` + `pnc-shell-bridge.js` | event `iflux-incoming-referrer` | via AR detail | sessionStorage PNC | `iflux_pnc_domain_v1` |

### A.2 Lifetime · Expire · Clear

| Key / store | Lifetime | Expire | Clear paths |
|-------------|----------|--------|-------------|
| Cookie `iflux_ref_code` | 30 days (`COOKIE_DAYS`) | cookie expiry | `clearStoredRefCode()` |
| localStorage `iflux_ref_code` | until cleared | none auto | `clearStoredRefCode()` · invalid validate on register |
| localStorage `iflux_ref_from_link` | until cleared | none auto | `clearStoredRefCode()` |
| localStorage `iflux_aff_context_v1` | first-touch once | never overwritten if exists | no explicit clear in runtime |
| sessionStorage PNC | tab session | tab close | `PncLifecycle.onLogout` → deactivate |
| Postgres `referred_by` | permanent | N/A | no user-facing clear |

**Evidence:** `affiliate-resolver.js` L37–55, L57–75 · `loyalty-affiliate-store.js` L87–101, L482–489 · `navigation-context.js` L50–64.

### A.3 Capture không còn (P5 retired)

| Removed | Evidence |
|---------|----------|
| Query `?ref=` incoming parse | `auth-register-init.js` `getUrlRefCode()` — path only · `14-P5-Pre-Implementation-Audit.md` |
| `loyalty-affiliate-store` query branch | comment P5 in store L466–470 |

---

## B. Affiliate Context Consumption

| Consumer | Reads context? | Mechanism | Purpose | Sends to server? | Evidence |
|----------|----------------|-----------|---------|------------------|----------|
| **Register form (email)** | ✅ | `resolveRegistrationRefCode` → POST `/auth/register` | signup attribution | ✅ `referral_code` in body | `auth.js` L445–461, L917–940 |
| **Register OTP verify** | ✅ (indirect) | OTP payload `referred_by` set at register start | persist at INSERT | ✅ | `auth.service.js` L170–181, L329–337 |
| **Register social buttons** | ⚠️ partial | `IfluxAuthSocial.initPage({ referral_code: getEffectiveRefCode() })` **once at page load** | social signup | ✅ if non-empty at load | `auth-register-init.js` L351–352 |
| **Login social buttons** | ❌ | `initPage` **no** `referral_code` | login / implicit register | ❌ | `auth-login-init.js` L137–140 |
| **Google One Tap** | ❌ | `loginWithSocial(..., {})` | quick signup | ❌ | `google-onetap.js` L73 |
| **Zalo OAuth callback** | ⚠️ | sessionStorage `ifx_zalo_ref` if set at redirect | zalo signup | ✅ if ref stored | `auth-social.js` L214–215, L248 |
| **loginWithSocial post-hook** | ⚠️ client only | `applyReferrerToUser` → `linkNewUserToReferrer` | local graph | ❌ **no API** | `auth.js` L535–540, L1292 |
| **finishApiRegister** | ✅ if server returned `referred_by` | `applyRegistrationReferralAsync` | sync client graph from server | read-only server field | `auth.js` L971–979 |
| **establishSession** | ⚠️ | `syncReferralParentToStore(user.referred_by)` | client graph from profile | ❌ | `auth.js` L887 |
| **Affiliate tab render** | ✅ server | `syncFromServerAsync` → `GET /auth/referrals/sync` | members table | read | `profile-affiliate.js` L205–206 |
| **PNC / Shell URL** | ✅ PNC only | `ownerPublicId` for URL bar | navigation UX | ❌ attribution | `pnc-lifecycle.js` L26–41 |
| **Share Foundation outgoing** | ❌ incoming | uses **logged-in user** `referral_code` only | decorate outgoing URL | N/A | `share-action-store.js` L40–45 |
| **Subscription order reconcile** | ⚠️ | reads `buyer.referred_by` or order meta | commission client events | ❌ bind | `subscription-orders-store.js` L217–231 |
| **Backend resolveReferrer** | ✅ | SQL `users.referral_code` | map code→id at signup | producer | `auth.service.js` L100–105 |

---

## C. Account Creation Inventory (100% paths found in repo + Production)

| # | Path | Creates account? | Production active? | Consumes affiliate context? | Writes `referred_by`? | Evidence |
|---|------|------------------|--------------------|-----------------------------|----------------------|----------|
| 1 | Email register → OTP verify | ✅ | ✅ API | ✅ if `referral_code` in POST register | ✅ at verify INSERT | `auth.routes.js` L106–113, L205–213 |
| 2 | Google OAuth `/auth/social` **new user** | ✅ | ✅ | ✅ **only if** `referral_code` in POST body | ✅ at INSERT | `auth.service.js` L610–621 |
| 3 | Apple OAuth new user | ✅ | ✅ (if configured) | same as #2 | same | same |
| 4 | Facebook OAuth new user | ✅ | ✅ (if configured) | same | same | same |
| 5 | Zalo OAuth new user | ✅ | ✅ (if configured) | ⚠️ via sessionStorage ref | same | `auth-social.js` |
| 6 | **Login page Google** (new Google account) | ✅ implicit | ✅ **Owner test** | ❌ | ❌ | `auth-login-init.js` — no referral_code |
| 7 | Google One Tap (app pages) | ✅ implicit | ✅ (non-auth pages) | ❌ | ❌ | `google-onetap.js` L73 |
| 8 | Admin create customer | ✅ | ✅ | ❌ | ❌ (column absent INSERT) | `admin-users.service.js` L206–213 |
| 9 | Local/mock register (`dataMode≠api`) | ✅ | ❌ Production default | ✅ client `applyRegistrationReferral` | ❌ server | `auth.js` L1405–1402 · Production `dataMode=api` |
| 10 | Local OTP register | ✅ | ❌ Production | client only | ❌ | `verifyEmailAndRegisterLocal` |
| 11 | Seed script `seed-demo-minh.js` | ✅ | ops only | ❌ | ❌ | no `referred_by` in INSERT |
| 12 | `backend/scripts/server.py` INSERT | ✅ | dev script | unknown | optional column | grep only |
| 13 | Magic Link | ❌ not found | — | — | — | repo grep 0 |
| 14 | Invitation flow | ❌ not found | — | — | — | repo grep 0 |
| 15 | Bulk import API | ❌ not found | — | — | — | — |
| 16 | Social link existing email | ❌ (login only) | ✅ | ❌ | ❌ | `socialLoginOrRegister` existing branch |

**Production default dataMode:** `iflux-platform-boot.js` — `production: { dataMode: 'api' }`.

---

## D. Referral Binding

### D.1 Server bind (authoritative)

| Location | Trigger | Owner | Condition |
|----------|---------|-------|-----------|
| `createUserFromPending` | `verifyEmailCode` success | Backend `legacy-auth` | `payload.referred_by` from OTP (set in `startRegistration`) |
| `createSocialUser` | `socialLoginOrRegister` **isNew** | Backend `legacy-auth` | `resolveReferrer(payload.referral_code)` |
| `notifyReferralSignupF0Safe` | immediately after above INSERT | `referral-signup.consumer.js` | `referredById` truthy |

**No other server bind path found** — no PATCH referred_by API · Admin create skips column.

### D.2 Client bind (non-authoritative)

| Location | Trigger | Owner | Persists |
|----------|---------|-------|----------|
| `applyReferralFromServer` | register finish / server `referred_by` / orders | `loyalty-affiliate-store.js` | `iflux_referral_parents_v1` + members meta |
| `applyReferralAtSignup` | register local / stored code | same | same |
| `linkNewUserToReferrer` | after **any** login/social | `auth.js` → store | same — **reads stored code only** |
| `setReferrer` | various | same | same |

**Client bind does not write Postgres.**

### D.3 Bind site count

| Layer | # bind sites |
|-------|-------------|
| Server INSERT | 2 |
| Client localStorage graph | 4+ functions |
| PNC owner context | 1 (navigation — not referral bind) |

---

## E. Notification Trigger

| Trigger | Producer | Event | Depends on UI? | Depends on `referred_by`? | Production rows |
|---------|----------|-------|----------------|---------------------------|-----------------|
| Email verify signup | `auth.service.js` L331–337 | after `createUserFromPending` | ❌ (needs API referral at register start) | ✅ | 0 ever |
| Social new user | `auth.service.js` L615–621 | after `createSocialUser` | ❌ (needs `referral_code` in POST) | ✅ | 0 ever |
| Client `referral_signup` local | **No producer found** in current User Web JS | — | — | — | deprecated path · allowlist remains `client-local-notification-types.js` |
| Dispatcher preference off | skip | `preference.service.canDeliver` | ❌ | N/A | — |

**Template:** `AFFILIATE_REFERRAL_SUCCESS` / NOTIF-USER-007 · seeded · enabled · Production template exists.

**Notification is server-side only** for this type — no UI render step before dispatch.

---

## F. Business Event Timeline (Production actual)

### F.1 Path Owner confirmed (Path C)

```text
[User] Affiliate Link  https://iflux.vn/IFLxxxxxx
         │ owner: Marketing/Share outgoing · nginx IFL gate
         ▼
[Capture C1] affiliate-resolver.js (nginx inject all HTML)
         │ producer: Platform Runtime
         │ persist: cookie + localStorage iflux_ref_code, iflux_ref_from_link
         │ parallel: PNC sessionStorage (C5) — navigation only
         ▼
[Navigate] Header → /dang-nhap
         │ consumer: none for referral transport
         ▼
[Login UI] auth-login-init.js
         │ social init: NO referral_code
         ▼
[OAuth] POST /auth/social  { provider: google, id_token } — NO referral_code
         │ owner: legacy-auth
         ▼
[Account Created] createSocialUser(referredBy=null)
         │ Postgres users.referred_by = NULL
         ▼
[Post-login client] applyReferrerToUser → linkNewUserToReferrer
         │ MAY write localStorage parents on User B device ONLY
         │ DOES NOT update Postgres
         ▼
[Notification hook] notifyReferralSignupF0Safe({ referredById: null })
         │ SKIP reason: no_referrer
         ▼
[Referrer view] getAffiliateSync(User A)
         │ reads Postgres referred_by edges only
         ▼
[UI] No bell · No affiliate member row for User A
```

### F.2 Path email register (only server-success case in DB history)

```text
Affiliate Link → capture → /dang-ky → referral_code in POST /auth/register
→ OTP payload.referred_by resolved → verifyEmail → INSERT referred_by
→ notifyReferralSignupF0Safe (if type/preference pass)
→ getAffiliateSync shows member
```

**Production:** 1/9 email users · 0 notifications (platform live after that signup).

### F.3 Legend

| Symbol | Meaning |
|--------|---------|
| producer | writes data |
| consumer | reads data |
| owner | module/file ownership |

---

## G. Component Inventory

| ID | Component | Role in lifecycle | Layer |
|----|-----------|-------------------|-------|
| NGINX-IFL | `nginx-iflux-production-locations.conf` | URL rewrite + script inject | Infra |
| AR | `affiliate-resolver.js` | Incoming path capture | Platform Runtime |
| LAS | `loyalty-affiliate-store.js` | Transport + client graph + UI data | User Web / Loyalty |
| AUTH | `auth.js` | Session + registration referral helpers | User Web Auth |
| AUTH-REG | `auth-register-init.js` | Register UI + social referral at load | User Web Auth |
| AUTH-LOGIN | `auth-login-init.js` | Login UI — no referral | User Web Auth |
| AUTH-SOC | `auth-social.js` | OAuth button wiring | User Web Auth |
| GSI-OT | `google-onetap.js` | One Tap — no referral | User Web |
| PNC | `navigation-context.js` + `pnc-lifecycle.js` | URL owner context | Platform Runtime |
| API-BUNDLE | `iflux-api-bundle.js` | HTTP client | User Web |
| BE-AUTH | `legacy-auth/auth.service.js` | User CREATE + referred_by | Backend |
| BE-NOTIF | `referral-signup.consumer.js` | F0 notification dispatch | Backend |
| BE-SYNC | `getAffiliateSync` | Members list server read | Backend |
| PROF-AFF | `profile-affiliate.js` | Renders members table | User Web UI |
| ADMIN-USR | `admin-users.service.js` | Admin create user | Backend Admin |

---

## H. Current Violations (findings only — no fix proposal)

| ID | Violation | Evidence |
|----|-----------|----------|
| V1 | **Multiple capture owners** — AR + LAS + auth.js duplicate path parse / store | C1–C3 inventory |
| V2 | **Multiple context stores** — cookie, localStorage (3 keys), sessionStorage PNC, Postgres — **không có single read model** | §2.1 table |
| V3 | **Page-dependent consumption** — register sends referral · login does not · same OAuth backend | `auth-register-init.js` L351 vs `auth-login-init.js` L137 |
| V4 | **UI-dependent social referral on register** — `referral_code` frozen at page load, not at click | `auth-register-init.js` L351 |
| V5 | **Implicit signup via Login** creates account without referral despite prior capture | Owner Path C + BE social |
| V6 | **Client/server split** — `linkNewUserToReferrer` mutates local graph but not Postgres | `auth.js` L535–540 · no PATCH API |
| V7 | **Affiliate members table dual source** — UI reads local `listNetworkMembers` merged with server sync; server empty if `referred_by` NULL | `profile-affiliate.js` · `getAffiliateSync` |
| V8 | **PNC context parallel** — incoming referrer stored for navigation, **not wired** to signup API | `pnc-lifecycle.js` vs auth routes |
| V9 | **Google signup 0/N referred** on Production | DB: 6 google, 0 referred_by |
| V10 | **Notification never fired E2E** on Production | 0 inbox rows AFFILIATE_REFERRAL_SUCCESS |
| V11 | **Legacy publicId codes** — `MINH10` fails link builder regex · `/MINH10` 404 | `loyalty-affiliate-store.js` L59–62 · curl |
| V12 | **Admin user create** bypasses referral entirely | `admin-users.service.js` INSERT no `referred_by` |
| V13 | **Hidden coupling** — `establishSession` always calls `syncReferralParentToStore` + `syncFromServerAsync` — can overwrite local graph from empty server | `auth.js` L887–889 |
| V14 | **Deprecated client notification path** — `referral_signup` in allowlist · no `pushReferralSignup` producer in current JS | `client-local-notification-types.js` · `inapp-notifications.js` grep |
| V15 | **Query ref retired** — bookmarks/old links silent fail capture | P5 audit doc · curl `?ref=` |

---

## I. Evidence Index

| Ref | Type | Source | Date |
|-----|------|--------|------|
| E1 | DB | Postgres `users` — 15 rows, 1 referred_by | 2026-07-28 |
| E2 | DB | google 6/6 referred_by NULL | 2026-07-28 |
| E3 | DB | `user_inbox_notifications` AFFILIATE_REFERRAL_SUCCESS = 0 | 2026-07-28 |
| E4 | DB | `trungpv.gpg@gmail.com` google 12:41 NULL | 2026-07-28 |
| E5 | HTTP | curl `/IFL9552M` 200 · `/MINH10` 404 | 2026-07-28 |
| E6 | Code | `auth-login-init.js` L137–140 no referral_code | repo |
| E7 | Code | `auth-register-init.js` L351 referral at init | repo |
| E8 | Code | `google-onetap.js` L73 empty opts | repo |
| E9 | Code | `referral-signup.consumer.js` skip no_referrer | repo |
| E10 | Infra | nginx sub_filter inject AR on all HTML | repo |
| E11 | Owner | Path C reproduction statement | 2026-07-28 |

---

## J. Open Questions (Owner Decision required)

| # | Question | Resolution (task pack) |
|---|----------|------------------------|
| Q1 | Login + OAuth tạo account mới có được coi signup referral hợp lệ? | ✅ OD-AFF-05 · AC-16 · Path C must PASS |
| Q2 | `users.referred_by` = server SoT duy nhất? | ✅ OD-AFF-06 |
| Q3 | First-touch vs last-touch multi-store? | → sole Context owner (S1) |
| Q4 | PNC liên quan attribution? | ✅ R-09 · tách hẳn |
| Q5 | Legacy `MINH10`? | Out of scope task |
| Q6 | Admin-created users bind referral? | Solution §5.5 |
| Q7 | Retroactive client bind promote server? | ❌ DELETE client authority |
| Q8 | One Tap / Login / Register cùng rule? | ✅ Journey Independence · AC-16 |
| Q9 | Members table SoT? | Server `getAffiliateSync` only |
| Q10 | F1/F2 notify scope? | Out of scope Foundation |

---

## K. Related audit (D5 regression — narrow scope)

Chi tiết triệu chứng R1 + root cause chain:  
[00-Audit-D5-R1-Referral-Failure.md](00-Audit-D5-R1-Referral-Failure.md)

Notification D5 checklist:  
[PhaseD-D5-Regression-Checklist.md](../270728_Notification%20Platform%20Foundation/PhaseD-D5-Regression-Checklist.md)

---

## L. Next documents (sau audit)

| Step | File |
|------|------|
| Plan | [00-Plan-Owner-Review.md](00-Plan-Owner-Review.md) |
| Owner | [01-Owner-Decisions-LOCK.md](01-Owner-Decisions-LOCK.md) |
| SoT | [02](02-SoT-Affiliate-Attribution.md) · [03](03-SoT-Affiliate-Context-Contract.md) · [04](04-SoT-Identity-And-Event-Contract.md) |
| Solution | [05-Solution-Design-Identity-Creation.md](05-Solution-Design-Identity-Creation.md) |

---

*End of audit — discovery only. SoT + Solution draft trong task pack — chờ Owner gates trước code.*
