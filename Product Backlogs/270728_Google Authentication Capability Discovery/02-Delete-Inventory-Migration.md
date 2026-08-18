# Phase 3 — Delete Inventory / Migration Mapping

**Date:** 2026-07-28  
**Status:** 🔒 **LOCKED** · OD-DEL-01…08 APPROVE · **NO CODE**  
**Prerequisite:** [01-Solution-Design-Google-Authentication-Capability.md](01-Solution-Design-Google-Authentication-Capability.md) 🔒  
**Next:** [03-Implementation-Plan.md](03-Implementation-Plan.md)  
**Baseline:** `AFFILIATE_GOLDEN` / `release/affiliate-golden`  
**Mục tiêu:** REPLACE not EXTEND — xóa / chuyển / giữ + governance ownership & dependencies.

---

## 0. Nguyên tắc Phase 3

```text
Thêm lớp mới mà không xóa lớp cũ = FAIL
```

Mỗi dòng dưới đây phải có một trong: **DELETE** · **MOVE** · **REPLACE** · **KEEP** · **DEFER** (có lý do + owner).

---

## 1. Target module map (sau rebuild — chưa code)

| TO-BE module | Responsibility |
|--------------|----------------|
| `GoogleProvider` (client) | GIS → immutable `IdentityProof` |
| `ProviderRegistry` (client) | resolve provider → Provider |
| `SocialLoginUseCase` (client) | Orchestration only |
| `AuthRedirectPolicy` | Authentication-owned redirect |
| `Session` (`establishSession`) | Giữ trong Auth/Session |
| `GoogleIdTokenVerifier` | → `VerifiedIdentity` |
| `VerifierRegistry` | resolve → Verifier |
| `IdentityService` | find/create/merge/login từ VerifiedIdentity |
| Affiliate AR / Attribution | **Không đổi SoT** — chỉ xóa call-site lệch |

---

## 2. Client — `auth-social.js` (322 lines @ freeze)

| Symbol / vùng | Lines (approx) | Concern | Action | Move to / Replace with |
|---------------|----------------|---------|--------|------------------------|
| `initGoogle` | ~110–130 | GIS init | **MOVE** | `GoogleProvider` |
| `loginGoogle` | ~132–156 | GIS prompt + credential | **MOVE** | `GoogleProvider.getProof()` |
| `google.accounts.id.prompt` / initialize / `__ifxOnGoogleCredential` | trong loginGoogle | GIS callback | **MOVE** | `GoogleProvider` |
| `loadScript` (GSI URL) | ~72–86 | SDK load | **MOVE** (shared util OK) | Provider util hoặc GoogleProvider |
| `affiliateCodeForSocial` | ~252–258 | Affiliate | **DELETE** khỏi social/Google | Chỉ `SocialLoginUseCase` gọi AR |
| `bindSocialButtons` Google branch | ~260–288 | UI + remember + affiliate opts | **SPLIT** | UI bind mỏng → UseCase; **DELETE** affiliate/remember khỏi Google path trong file này |
| `finishSocialLogin` | ~105–108 | Bridge Auth | **REPLACE** | `SocialLoginUseCase` / `IfluxAuth` facade |
| `ensureAuth` | ~99–103 | Auth guard | **KEEP/MOVE** | Auth util |
| `loadConfig` / `fetchSocialConfigDirect` / `resolveSocialApiBase` | ~11–70 | Multi-provider config | **KEEP** tạm → sau **MOVE** `SocialAuthConfig` | DEFER split full nếu OQ Google-first |
| `loginApple` | ~158–179 | Apple | **KEEP** tạm (OD-SOL-05 Google-first) | Later → `AppleProvider` |
| `loginFacebook` | ~181–204 | Facebook | **KEEP** tạm | Later → `FacebookProvider` |
| `loginZalo` / `handleZaloCallback` | ~206–250 | Zalo + AR trong callback | **KEEP** tạm · **NOTE** AR trong Zalo = call-site lệch (phase sau DELETE) | Later |
| `initPage` | ~291–310 | Orchestrate config + Zalo cb + bind | **REPLACE** | Page boot → UseCase + bind UI |
| `IfluxAuthSocial` export API | ~312–321 | Public surface | **REPLACE** | Registry + UseCase exports; deprecate `IfluxAuthSocial.loginGoogle` |

### 2.1 `auth-social.js` outcome dự kiến

| | |
|--|--|
| **Before** | ~322 lines · Google+Apple+FB+Zalo+Affiliate+UI+remember |
| **After Google rebuild (OD-SOL-05)** | Google GIS **gone** · Affiliate Google-path **gone** · còn Apple/FB/Zalo + config + thin bind **hoặc** file đổi tên / thu hẹp |
| **Ideal later** | File biến mất → `providers/*` + `SocialLoginUseCase` + page bind |

**Không chấp nhận:** file mới GoogleProvider **và** `loginGoogle` cũ vẫn sống.

---

## 3. Client — `google-onetap.js` (147 lines)

| Symbol / hành vi | Action | Lý do |
|------------------|--------|-------|
| Toàn bộ file GIS One Tap | **DELETE** | OD-SOL-02 bỏ One Tap |
| `onCredential` + AR read | **DELETE** | Affiliate + Google + redirect gộp |
| Self `navigate` / reload sau login | **DELETE** | Vi phạm Redirect Policy |
| Load từ `iflux-web-ui.js` (`google-onetap.js`) | **DELETE** script inject | Không còn entry |
| `iflux_gonetap_dismiss_at` localStorage | **DELETE** usage | Dead after remove |
| Cooldown / dismiss logic | **DELETE** | One Tap only |

**Acceptance:** `rg google-onetap` / `gonetap` = 0 trong User_Web (trừ docs/changelog nếu có).

---

## 4. Client — `auth.js` (social / affiliate / redirect)

| Symbol / vùng | Action | Note |
|---------------|--------|------|
| `loginWithSocial` inject `referral_code` nếu thiếu (`getAffiliateContextCode`) | **MOVE** sole read vào `SocialLoginUseCase` | **DELETE** dual-inject trong `loginWithSocial` *hoặc* UseCase là caller duy nhất không inject lại |
| `loginWithSocial` → `authSocial` + `establishSession` + clear AR | **SPLIT** | UseCase orchestrates; Session API giữ `establishSession`; clear AR sau IdentityCreated giữ rule Affiliate |
| `redirectAfterAuth` | **KEEP** · re-home ownership doc = **Authentication Redirect Policy** | Cấm provider gọi `location` riêng |
| `getAffiliateContextCode` helper | **KEEP** nhưng **chỉ** UseCase/Identity-contract callers | DELETE khỏi Google Provider path |
| Password / OTP / register paths | **KEEP** | Ngoài scope Google; redirect vẫn cùng policy |

---

## 5. Client — page boots / init

| File | Concern | Action |
|------|---------|--------|
| `auth-login-init.js` — `IfluxAuthSocial.initPage({ referral_code })` | Pass referral vào social init | **REPLACE** — Page không cần truyền referral; UseCase đọc AR |
| `auth-login-init.js` — `affiliateReferralCodeForIdentity` | AR read | **DELETE** hoặc chỉ còn cho password/register paths nếu vẫn cần — social không dùng |
| `auth-login-init.js` — `redirectAfterAuth` onSuccess | Redirect | **KEEP** — gọi Auth Redirect Policy (không đổi per Google) |
| `auth-register-init.js` — tương tự social init | | **REPLACE** cùng pattern |
| `auth-login-boot.js` / `auth-register-boot.js` — script `auth-social.js` | Asset | **MODIFY** — trỏ module mới / version bump; xóa onetap nếu boot gián tiếp |
| `login.html` / `register.html` — `#btn-google` | UI | **KEEP** markup; binding → UseCase |
| `iflux-web-ui.js` — inject `google-onetap.js` | | **DELETE** inject |

---

## 6. Client — API bundle

| Symbol | Action |
|--------|--------|
| `IfluxApiClient.authSocial` flat `id_token` / `access_token` / `oauth_code` | **KEEP** tạm + **map** từ `IdentityProof` trong UseCase **hoặc** **REPLACE** body `{ proof }` (Plan chọn một; không dual-write lâu) |
| `remember_me` / `referral_code` trên body | **KEEP** — không thuộc Google Provider |

---

## 7. Backend — verify / identity

| File / symbol | Action | Target |
|---------------|--------|--------|
| `social-auth.service.js` — `verifySocialToken` **switch(provider)** | **REPLACE** | `VerifierRegistry.resolve` |
| `verifyGoogleIdToken` | **MOVE** | `GoogleIdTokenVerifier` → returns **VerifiedIdentity** (không User) |
| `verifyAppleIdToken` / Facebook / Zalo | **KEEP** shape → wrap Verifier interface | Register vào VerifierRegistry (có thể cùng PR hoặc DEFER non-Google) |
| `SUPPORTED_PROVIDERS` array + assert | **REPLACE** | Registry keys |
| `auth.service.js` — `socialLoginOrRegister` | **MODIFY** | Nhận proof → verifier → **VerifiedIdentity** → find/create/merge (Identity) — **không** GIS |
| Attribution `referral_code` / `referred_by` trong socialLoginOrRegister | **KEEP** | Affiliate SoT — không chuyển vào Verifier |
| `getPublicSocialConfig` | **KEEP** | Config endpoint |

**Cấm:** Verifier query `users` / INSERT.

---

## 8. Migration mapping — API / public surface

| AS-IS | TO-BE | Migration |
|-------|-------|-----------|
| `IfluxAuthSocial.loginGoogle(opts)` | `ProviderRegistry.resolve('google').getProof()` rồi UseCase | DELETE export sau cutover |
| `IfluxAuthSocial.bindSocialButtons` | UI bind → `SocialLoginUseCase.execute` | REPLACE |
| `IfluxAuthSocial.initPage` | Boot: config + bind only | REPLACE / slim |
| `IfluxAuth.loginWithSocial(provider, tokens, opts)` | UseCase hoặc facade map `IdentityProof` | MODIFY signature dần |
| Flat POST `{ id_token }` | `{ proof: { kind, value } }` hoặc mapper một chiều | Plan chọn; **không** dual SoT |
| One Tap auto prompt | — | **DELETE** product surface |
| `google-onetap` navigate | `AuthRedirectPolicy` | DELETE |

---

## 9. Symbols / switch — Dead Code & Registry rules

### 9.1 Dead Code Acceptance (OD-DEL-07)

```text
DELETE = không còn
  file
  symbol
  export
  import
  reference
  script include
```

**Không đủ:** unused · commented-out · `deprecated` wrapper · `loginGoogleOld` còn export · `googleLegacy.js` còn trong tree.

### 9.2 `switch(provider)` rule (amended)

| Allowed | Forbidden |
|---------|-----------|
| Registry **bootstrap** / **registration** layer only | `SocialLoginUseCase` |
| | Application facade |
| | `IdentityService` orchestration |
| | Provider adapters |

```text
# FAIL nếu match trong UseCase / IdentityService / Provider (không phải registry register file)
rg -n "switch\\s*\\(\\s*provider" <usecase|identity-orchestration|providers>
```

### 9.3 Grep gates sau cutover

```text
rg -n "google-onetap|gonetap|__ifxOnGoogleCredential" User_Web
rg -n "getCodeForIdentityCreation|referral_code|affiliate" <GoogleProvider path>
# AR SoT file: behavior diff = 0 (AC-17)
```

---

## 10. What REMAINS intentionally (không xóa nhầm)

| Item | Why KEEP |
|------|----------|
| `affiliate-resolver.js` | Affiliate SoT |
| Attribution trong identity social path (server) | OD-AFF |
| `redirectAfterAuth` | Authentication Redirect Policy |
| Apple/FB/Zalo flows trong `auth-social` (tạm) | OD-SOL-05 |
| Password / OTP | Ngoài scope |
| `AFFILIATE_GOLDEN` | Rollback |

---

## 11. Ownership Matrix after cutover (OD-DEL-05)

| Module / concern | Owner capability after cutover | Consumers allowed |
|------------------|--------------------------------|-------------------|
| `GoogleProvider` | Social Authentication | ProviderRegistry only (+ tests) |
| `ProviderRegistry` | Social Authentication | SocialLoginUseCase |
| `SocialLoginUseCase` | Social Authentication | Auth Page UI / thin Application entry |
| `AuthRedirectPolicy` / `redirectAfterAuth` | **Authentication** | UseCase · Password · OTP success paths |
| `Session` / `establishSession` | Session Capability | UseCase / Auth login paths |
| `IdentityService` (find/create/merge) | Identity Capability | Auth routes / socialLogin orchestration |
| `GoogleIdTokenVerifier` | Identity Capability | VerifierRegistry only |
| `VerifierRegistry` | Identity Capability | IdentityService |
| `IdentityProof` type/contract | Social + Identity (shared contract) | Provider → UseCase → API → Verifier |
| `VerifiedIdentity` | Identity Capability | IdentityService only (post-verify) |
| Affiliate AR | Affiliate Context | UseCase (read) · IdentityCreated clear path |
| Affiliate Attribution | Affiliate Attribution | IdentityCreated handler |
| `auth-social.js` (Apple/FB/Zalo tạm) | Social Authentication (legacy residual) | Page bind until provider split |
| Login/Register HTML + init | Auth Page (Presentation) | — |

**Rule:** File không có owner trong matrix = **FAIL cutover**.

---

## 12. Allowed Dependency Direction (OD-DEL-06)

```text
ALLOWED:

Page UI
  → SocialLoginUseCase
    → ProviderRegistry → Provider (Google…)
    → AffiliateResolver.getCodeForIdentityCreation   // read only, UseCase only
    → Identity API / IfluxAuth facade
    → Session.establish
    → AuthRedirectPolicy.execute

Identity route
  → IdentityService
    → VerifierRegistry → Verifier
    → (VerifiedIdentity) find/create/merge
    → Affiliate Attribution (IdentityCreated only)
```

```text
FORBIDDEN (FAIL):

Provider        → UseCase | Session | Redirect | AR | IdentityService
Verifier        → IdentityService | users DB | AR | Session
UseCase         → GIS / google.accounts (bypass Registry)
Page            → Provider | Verifier | AR (social path)
Shell           → GoogleProvider
RedirectPolicy  → Provider | AR
Session         → Provider | AR | RedirectPolicy   // Session không own redirect
```

---

## 13. Ownership Transfer Checklist (OD-DEL-08)

Mọi **MOVE** bắt buộc:

```text
[ ] 1. New owner module tồn tại + nằm trong Ownership Matrix
[ ] 2. Behavior chuyển sang new owner (call-sites mới)
[ ] 3. Old symbol DELETE theo OD-DEL-07 (không deprecated stub)
[ ] 4. Old file/export không còn reference (rg PASS)
[ ] 5. Old owner removed khỏi Responsibility (auth-social không còn claim GIS)
[ ] 6. Dependency Direction vẫn ALLOWED
[ ] 7. Ghi evidence trong WP exit (Plan Phase 4)
```

**Hai owner cùng lúc = FAIL** (EXTEND giả REPLACE).

---

## 14. Architecture Diff — Before / After (gate visual)

### BEFORE (AS-IS — god / leak)

```text
Page
  → auth-social (Google GIS + UI + Affiliate + remember + multi-provider)
       → AR
       → IfluxAuth.loginWithSocial
            → Session
            → (inject AR again)
  → google-onetap (GIS #2 + AR + self redirect)

Backend auth.service
  → switch verifySocialToken
  → Identity + Attribution (cùng chỗ)
```

### AFTER (TO-BE — cutover)

```text
Page
  → SocialLoginUseCase
       → ProviderRegistry → GoogleProvider → IdentityProof (immutable)
       → AR.getCodeForIdentityCreation()     // only here (social)
       → Identity API
       → Session
       → AuthRedirectPolicy                  // Authentication owns

IdentityService
  → VerifierRegistry → GoogleVerifier → VerifiedIdentity
  → find/create/merge
  → Affiliate Attribution iff IdentityCreated
```

**Cutover PASS** chỉ khi runtime + imports khớp AFTER · BEFORE Google paths **gone** (OD-DEL-07).

---

## 15. Risk: EXTEND thay vì REPLACE

| Anti-pattern | Mitigation |
|--------------|------------|
| Thêm GoogleProvider giữ `loginGoogle` | OD-DEL-07 + OD-DEL-08 |
| One Tap “tắt tạm” | OD-DEL-02 DELETE file + inject |
| Dual AR inject | OD-DEL-06 · sole UseCase reader |
| `switch` trong UseCase | §9.2 |
| Verifier returns User | OD-SOL-11 |
| Hai owner | OD-DEL-05 · OD-DEL-08 |

---

## 16. WP foreshadow → Phase 4

Xem [03-Implementation-Plan.md](03-Implementation-Plan.md) — Delete Checklist · Ownership Checklist · Regression Matrix.

---

## 17. Gate Phase 3 — LOCKED

| ID | Quyết định | Status |
|----|------------|--------|
| **OD-DEL-01** | Inventory đủ REPLACE not EXTEND | ✅ APPROVE |
| **OD-DEL-02** | One Tap DELETE hoàn toàn | ✅ APPROVE |
| **OD-DEL-03** | Apple/FB/Zalo KEEP tạm | ✅ APPROVE |
| **OD-DEL-04** | Mở Phase 4 Implementation Plan | ✅ APPROVE |
| **OD-DEL-05** | Ownership Matrix sau cutover (§11) | ✅ APPROVE |
| **OD-DEL-06** | Allowed Dependency Direction (§12) | ✅ APPROVE |
| **OD-DEL-07** | Dead Code Acceptance (§9.1) | ✅ APPROVE |
| **OD-DEL-08** | Ownership Transfer Checklist (§13) | ✅ APPROVE |

**PASS Phase 3:** 🔒 LOCKED. Phase 4 mở. **NO CODE** đến Implementation Plan Owner APPROVE.

---

*Phase 3 Delete Inventory + Migration Governance — LOCKED.*

