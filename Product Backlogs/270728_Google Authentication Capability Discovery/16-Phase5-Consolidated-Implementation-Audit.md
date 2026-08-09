# Phase 5 — Consolidated Implementation Audit (WP1→WP6)

**Date:** 2026-07-28  
**Method:** Đọc **source working tree** + `git show AFFILIATE_GOLDEN^{}` cho metrics baseline — **không** suy từ exit evidence 10–15.  
**Branch:** `feature/google-login-rebuild`  
**Freeze baseline:** `AFFILIATE_GOLDEN^{}` = `b539a959350bceeedb75f1c831a2c20227e042db`  
**Raw greps (lần này):** [`consolidated-greps/phase5-code-audit-20260728.txt`](consolidated-greps/phase5-code-audit-20260728.txt)

---

## Executive Summary

| Area | Verdict | Basis |
|------|---------|--------|
| Kiến trúc AFTER (client + backend) | ✅ khớp code | Call chain đọc từ file |
| WP1–WP6 ownership / delete | ✅ PASS | Grep + đọc source |
| Metrics `322→260` / `147→0` / `217→37` | ✅ hợp lý | `wc -l` + `git show` GOLDEN |
| Apple/FB/Zalo residual | ✅ còn nguyên | `loginApple` / `loginFacebook` / `loginZalo` vẫn trong `auth-social.js` |
| **Ready for WP7?** | ✅ **PASS** | Không blocker kiến trúc |

**Blocking Issues:** Không có.

---

## Kiến trúc hiện tại — đối chiếu Solution Design (code map)

### Client AFTER — verified in source

```text
Page (auth-login-init / auth-register-init)
   ↓  IfluxAuthSocial.initPage → bind → runGoogle
auth-social.runGoogle
   ↓  IfluxSocialLoginUseCase.execute('google')
SocialLoginUseCase
   ↓  IfluxSocialProviderRegistry.resolve(id)
ProviderRegistry
   ↓  adapter.getProof()
GoogleProvider
   ↓  IfluxIdentityProof.create('google','id_token', credential)
IdentityProof
   ↓  readAffiliateCodeOnce() → IfluxAffiliateResolver.getCodeForIdentityCreation
AR (UseCase only — social path)
   ↓  IfluxAuth.loginWithSocial → establishSession
Session
   ↓  IfluxAuthRedirectPolicy.execute (= redirectAfterAuth)
AuthRedirectPolicy
```

| Bước | File · symbol (đọc thật) |
|------|---------------------------|
| Page | `auth-login-init.js` L138: `IfluxAuthSocial.initPage({…})` — **không** self-redirect social (L122 comment) |
| Bind Google | `auth-social.js` L99–105 `runGoogle` → `IfluxSocialLoginUseCase.execute('google')` |
| UseCase | `social-auth/social-login-usecase.js` L81–96 `execute` → `reg.resolve` → `getProof` → `completeWithTokens` |
| Registry | `social-auth/provider-registry.js` L18–24 `resolve`; L32–34 register Google |
| Provider | `social-auth/google-provider.js` L83–120 `getProof` — GIS `accounts.google.com/gsi/client` L8, L66–107 |
| IdentityProof | `social-auth/identity-proof.js` L15–30 `create` → `Object.freeze` |
| AR | UseCase L9–13 `readAffiliateCodeOnce` → gắn `opts.referral_code` L59–63 |
| Session | `auth.js` L1294–1302 `loginWithSocial` → `establishSession` L877–910 (**không** location/redirect) |
| Redirect | UseCase L40–48 `IfluxAuthRedirectPolicy.execute`; policy gắn `auth.js` L1566–1568 |

**Script load order (boot):**  
`auth-login-boot.js` / `auth-register-boot.js`:  
`identity-proof.js` → `google-provider.js` → `provider-registry.js` → `social-login-usecase.js` → `auth-social.js`

### Backend AFTER — verified in source

```text
Route POST /auth/social
   ↓  auth.routes.js → socialLoginOrRegister(config, body)
socialLoginOrRegister
   ↓  verifierRegistry.verify(config, provider, payload)
VerifierRegistry
   ↓  resolve(provider).verify → GoogleVerifier.verify
GoogleVerifier
   ↓  createVerifiedIdentity({ provider, providerUserId, email, … })
VerifiedIdentity
   ↓  getUserBySocialProvider / email merge UPDATE / createSocialUser (+ referral if new)
find / create / merge
```

| Bước | File · symbol |
|------|----------------|
| Route | `auth.routes.js` L68–74 `router.post('/social'…)` → `socialLoginOrRegister` |
| Orchestration | `auth.service.js` L638–680 |
| Verify | L640 `await verifierRegistry.verify(...)` — **không** verify token trong service |
| Registry | `identity/verifier-registry.js` L41–42 `verify` → `resolve().verify`; bootstrap L50–53 |
| GoogleVerifier | `identity/verifiers/google-verifier.js` L20–53 — HTTP `tokeninfo` only |
| VerifiedIdentity | `identity/verified-identity.js` L20–35 |
| find | L643 `getUserBySocialProvider` |
| merge | L646–661 email → `UPDATE users SET auth_provider…` |
| create | L664–677 `createSocialUser` + `emitReferralCreatedAfterIdentityCreated` nếu `isNew` |

**Khớp Solution Design đã lock:** ✅ (client + backend).

---

## Metrics (baseline GOLDEN → working tree)

| File | GOLDEN (`git show`) | NOW (`wc -l`) | Đánh giá |
|------|--------------------:|-------------:|----------|
| `auth-social.js` | **322** | **260** | Δ −62 — **GIS/`loginGoogle`/`initGoogle` MOVE** ra Provider; Apple/FB/Zalo **còn** |
| `google-onetap.js` | **147** | **deleted** | Đúng OD-SOL-02 |
| `social-auth.service.js` | **217** | **37** | Đúng kỳ vọng — chỉ còn `getPublicSocialConfig` + `SUPPORTED_PROVIDERS` |

### Vì sao 322→260 không nghi xóa nhầm Apple/FB/Zalo?

Diff `AFFILIATE_GOLDEN` → working tree trên `auth-social.js` cho thấy:

- **Xóa:** `initGoogle`, `loginGoogle`, GIS `accounts.google.com/gsi/client`, `__ifxOnGoogleCredential`, `finishSocialLogin` trực tiếp + AR read trong file này.
- **Giữ / đổi mỏng:** `loginApple` (L115), `loginFacebook` (L138), `loginZalo` (L163), `AppleID` / `FB.login` / `oauth.zaloapp.com` — vẫn gọi SDK; hoàn tất qua `completeTokens` → UseCase (AR + Session + Redirect).
- Export hiện tại: `loadConfig`, `loginApple`, `loginFacebook`, `loginZalo`, `bindSocialButtons`, `initPage`, `handleZaloCallback` — **không** còn `loginGoogle`.

→ Giảm ~62 dòng = khối GIS chuyển ownership, **không** phải cắt residual providers.

---

## WP1 Audit — GoogleProvider sole GIS

| Check | Evidence từ code |
|-------|------------------|
| GIS chỉ trong Provider | `google-provider.js`: `GSI_SRC`, `google.accounts.id.initialize` / `prompt` |
| `auth-social.js` không GIS | `rg loginGoogle\|initGoogle\|__ifxOnGoogleCredential\|accounts\.google\|google\.accounts\|GSI_SRC` → **CLEAN** |
| Page không gọi Provider trực tiếp | Page → `IfluxAuthSocial` → UseCase |

**WP1:** ✅ PASS

---

## WP2 Audit — SocialLoginUseCase sole social AR

| Check | Evidence |
|-------|----------|
| AR read trong social path | Chỉ `social-login-usecase.js` L9–13 trong `social-auth/` + `auth-social` **không** đọc AR |
| `loginWithSocial` dual inject | Body `loginWithSocial` (`auth.js` L1294–1317): **`getAffiliateContextCode` = False**; comment L1298 |
| `affiliateCodeForSocial` | `rg` toàn `User_Web` → **0** |
| AR còn hợp lệ ngoài social | `auth.js` `getAffiliateContextCode` chỉ dùng `resolveRegistrationRefCode` (form register L476); `auth-register-init.js`; `affiliate-resolver.js` SoT; loyalty store |

**WP2:** ✅ PASS

---

## WP3 Audit — One Tap DELETE

| Check | Evidence |
|-------|----------|
| File | `User_Web/iflux-web-ui/google-onetap.js` — **không tồn tại** |
| Refs | `rg onetap\|GoogleOneTap\|google-onetap\|loadGoogleOneTap` trên `User_Web` → **CLEAN** |
| `iflux-web-ui.js` | không còn load One Tap |

**WP3:** ✅ PASS

---

## WP4 Audit — Redirect chỉ qua AuthRedirectPolicy

| Check | Evidence |
|-------|----------|
| Policy | `auth.js` L1566–1568 `IfluxAuthRedirectPolicy.execute = redirectAfterAuth` |
| Social success | UseCase L66–69 → `applyAuthRedirectPolicy()` |
| Provider | `google-provider.js`: **PROVIDER_NO_NAV** (không `location` / `navigate` / redirect) |
| Session | `establishSession` body: location=False, redirect=False |
| Page social | `auth-login-init.js` L120–122 — toast only, không `redirectAfterAuth` trên social success |
| Password | vẫn `IfluxAuth.redirectAfterAuth()` trực tiếp (Authentication-owned — cùng hàm policy) |

Zalo `window.location.href` trong `loginZalo` = OAuth hop, không phải post-auth policy.

**WP4:** ✅ PASS

---

## WP5 Audit — VerifierRegistry / GoogleVerifier / VerifiedIdentity

| Check | Evidence |
|-------|----------|
| Verifier ↛ DB | `rg query\|FROM users\|INSERT` trên `identity/` → **VERIFIER_NO_DB** |
| Identity không verify token | `socialLoginOrRegister` chỉ `verifierRegistry.verify` rồi DB |
| Không `switch(provider)` orchestration | `auth.service.js` + `identity/` (trừ comment) → **NO_SWITCH** |
| Contract | `createVerifiedIdentity` freeze `{ provider, providerUserId, email, emailVerified, displayName, avatarUrl }` |
| Admin | `admin-auth.service.js` L5, L37 — `googleVerifier.verify` trực tiếp (không shim cũ) |

**WP5:** ✅ PASS

---

## WP6 Audit — Dead code / config-only service

| Check | Evidence |
|-------|----------|
| `social-auth.service.js` | 37 dòng; export chỉ `SUPPORTED_PROVIDERS`, `getPublicSocialConfig` |
| Shim | `function verifyGoogleIdToken` / export — **SHIM_GONE** (chỉ còn mention trong comment L5) |
| Tree AFTER | `User_Web/.../social-auth/{identity-proof,google-provider,provider-registry,social-login-usecase}.js` + `backend/.../identity/**` |

**WP6:** ✅ PASS

---

## Delete Audit

| Concern | Proof |
|---------|--------|
| GIS symbols trong `auth-social` | grep CLEAN |
| `google-onetap.js` + refs | file gone + grep CLEAN |
| `affiliateCodeForSocial` | grep 0 |
| Dual inject trong `loginWithSocial` | False |
| `verifyGoogleIdToken` function/export | SHIM_GONE |
| `switch(provider)` verify orchestration | NO_SWITCH |
| Script include One Tap | boots chỉ load `social-auth/*` + `auth-social.js` |

**Delete Audit:** ✅ PASS

---

## Ownership Audit

| Concern | Owner duy nhất (code) | Dual? |
|---------|----------------------|:-----:|
| GIS client | `IfluxGoogleProvider` | No |
| IdentityProof | `IfluxIdentityProof` | No |
| Client provider resolve | `IfluxSocialProviderRegistry` | No |
| Social orchestration + AR (social) | `IfluxSocialLoginUseCase` | No |
| Session | `IfluxAuth.establishSession` | No |
| Post-auth redirect | `IfluxAuthRedirectPolicy` | No |
| Verify Google proof | `google-verifier.js` | No |
| Verifier resolve | `verifier-registry.js` | No |
| find/create/merge + attribution | `auth.service.socialLoginOrRegister` | No |
| Public social config | `social-auth.service.getPublicSocialConfig` | No |
| Apple/FB/Zalo SDK UI | `auth-social.js` residual (KEEP) | Intentional |

**Ownership Audit:** ✅ PASS

---

## Dependency Audit

| Cạnh cấm | Status trong code |
|----------|-------------------|
| Provider → UseCase / Session / Redirect / AR | **Absent** (`google-provider.js` chỉ GIS + IdentityProof) |
| Verifier → DB | **Absent** |
| Page → Provider bypass UseCase (Google) | **Absent** (`runGoogle` → UseCase) |
| UseCase → Registry → Provider → Proof → AR → Session → Policy | **Present** đúng chiều |

**Dependency Audit:** ✅ PASS

---

## Architecture AFTER Audit

Sơ đồ Solution Design ↔ code: **khớp** (bảng map ở đầu báo cáo).  
Không chỉ vẽ lại — mỗi mũi tên có file + symbol đã mở đọc.

---

## Runtime Regression Pre-WP7

### Phải giữ nguyên

- Affiliate Context capture / IdentityCreated attribution (server path giữ)
- Existing user + context → không overwrite `referred_by`
- Password / form register redirect + AR form path
- Social config endpoint
- Session + `authMe` sau social
- Apple/FB/Zalo residual (nếu enabled) qua `completeWithTokens`
- Admin Google verify behavior (cùng GoogleVerifier)

### Đã đổi (expected)

- GIS location: `auth-social` → `GoogleProvider`
- Social AR read: UseCase only
- One Tap: deleted
- Social redirect: UseCase → AuthRedirectPolicy
- Backend verify: VerifierRegistry; service config-only

### WP7 còn phải chạy

Regression Matrix + Owner R1–R6 screenshots + RV-1 fingerprint.

---

## Ready for WP7?

| | |
|--|--|
| **Verdict** | ✅ **PASS** |
| **Blocking Issues** | None |
| **Ghi chú** | WP1–6 chưa commit trên freeze HEAD — commit trước deploy; chưa Production đến WP7 PASS |

---

*Audit này dựa trên đọc source + grep + `wc -l`/`git show` — không copy kết luận từ 10–15.*
