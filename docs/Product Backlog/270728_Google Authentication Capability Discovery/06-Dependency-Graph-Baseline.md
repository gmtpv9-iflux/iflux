# Dependency Graph Baseline — trước Phase 5

**Date:** 2026-07-28  
**HEAD:** `b539a95`  
**Loại:** import / script boot / call-graph **hiện tại** (không TO-BE architecture).  
**Sau WP6:** tạo graph AFTER và diff với file này.

---

## 1. Script boot graph (Auth pages)

```text
login.html / register.html
        │
        ▼
auth-login-boot.js  /  auth-register-boot.js
        │
        ├── auth.js                    (IfluxAuth)
        ├── auth-social.js             (IfluxAuthSocial)
        ├── auth-login-init.js | auth-register-init.js
        └── (AR thường qua shell / affiliate-resolver trên app)

Shell / app pages
        │
        ▼
iflux-web-ui.js
        │
        └── inject google-onetap.js    (IfluxGoogleOneTap)
```

Evidence boot:

- `runtime/auth-login-boot.js` — `auth.js` + `auth-social.js` + `auth-login-init.js`
- `runtime/auth-register-boot.js` — `auth.js` + `auth-social.js` + register init
- `iflux-web-ui.js` ~L1675 — `google-onetap.js`

---

## 2. Runtime call graph — Google icon path (BEFORE)

```text
#btn-google click
  → auth-social.bindSocialButtons
       → affiliateCodeForSocial() ──► IfluxAffiliateResolver.getCodeForIdentityCreation
       → loginGoogle()
            → initGoogle() / loadScript(gsi)
            → google.accounts.id.prompt
            → __ifxOnGoogleCredential
            → finishSocialLogin('google', { id_token }, opts)
                 → IfluxAuth.loginWithSocial
                      → [optional] getAffiliateContextCode() again
                      → IfluxApiClient.authSocial
                      → establishSession
                      → clearAffiliateContextAfterConsume (if new+referred)
  → auth-login-init onSuccess
       → IfluxAuth.redirectAfterAuth
```

---

## 3. Runtime call graph — One Tap (BEFORE)

```text
iflux-web-ui.js inject
  → google-onetap.boot
       → loadGsi + google.accounts.id.prompt
       → onCredential
            → AR.getCodeForIdentityCreation
            → IfluxAuth.loginWithSocial('google', { id_token }, { referral_code })
            → IfluxHref.navigate / ShellUrlWriter / location  ← NOT redirectAfterAuth
               OR location.reload
```

---

## 4. Backend call graph (BEFORE)

```text
POST /auth/social
  → auth.routes (legacy-auth)
  → auth.service.socialLoginOrRegister
       → social-auth.service.verifySocialToken
            → switch(provider)
                 → verifyGoogleIdToken | Apple | Facebook | Zalo
       → find/create user
       → attribution if new + referral_code
       → JWT
```

---

## 5. Who imports / calls whom (matrix)

| From | To | Type |
|------|-----|------|
| auth-login-boot | auth.js, auth-social.js, auth-login-init | script |
| auth-login-init | IfluxAuthSocial.initPage, IfluxAuth.redirectAfterAuth, AR | call |
| auth-social | IfluxAuth.loginWithSocial, AR, GIS global | call |
| google-onetap | IfluxAuth.loginWithSocial, AR, GIS, IfluxHref | call |
| auth.js | IfluxApiClient.authSocial, AR (inject), establishSession | call |
| auth.service | verifySocialToken (require social-auth.service) | require |
| social-auth.service | Google tokeninfo HTTP etc. | network |

**GoogleProvider:** không tồn tại — không có cạnh import.

---

## 6. Forbidden edges already present (baseline debt)

| Edge | Why debt |
|------|----------|
| auth-social → AR | Provider/UI layer biết Affiliate |
| google-onetap → AR | idem |
| google-onetap → navigate | Provider-ish biết Redirect |
| auth.js loginWithSocial → AR | Dual inject |
| social-auth → switch in verify | No VerifierRegistry |

Đây là **baseline đúng Plan** — không phải surprise.

---

## 7. AFTER graph (placeholder — điền sau WP6)

```text
Page
  → SocialLoginUseCase
       → ProviderRegistry → GoogleProvider → IdentityProof
       → AR.getCodeForIdentityCreation
       → Identity API
       → Session
       → AuthRedirectPolicy

IdentityService
  → VerifierRegistry → GoogleVerifier → VerifiedIdentity
  → find/create/merge
  → Attribution iff IdentityCreated
```

**Diff gate:** BEFORE Google edges (auth-social GIS, onetap) = removed; AFTER edges = only ALLOWED (OD-DEL-06).

---

*Dependency baseline frozen.*
