# Static Metrics Baseline — trước Phase 5 / WP6 After

**Date:** 2026-07-28  
**HEAD / `AFFILIATE_GOLDEN^{}`:** `b539a959350bceeedb75f1c831a2c20227e042db`  
**Fingerprints:** [baseline-fingerprints/](baseline-fingerprints/) (sha256 per file)  
**Purpose:** Chứng minh REPLACE bằng Before/After số — “God file đã nhỏ đi chưa?”

---

## 1. Summary table (BEFORE — freeze)

| Metric | Before | After (điền WP6) |
|--------|-------:|-----------------:|
| `auth-social.js` lines | **322** | |
| `auth-social.js` functions | **17** | |
| `auth-social.js` exports (`IfluxAuthSocial`) | **8** | |
| `auth-social.js` GSI refs | **5** | **0** (expect) |
| `auth-social.js` affiliate reader hits | **6** | **0** Google-path (Zalo tạm có thể >0) |
| `google-onetap.js` lines | **147** | **deleted** |
| `google-onetap.js` functions | **11** | — |
| `google-onetap.js` GSI refs | **9** | — |
| `social-auth.service.js` `switch(provider)` count | **1** | **0** in orchestration (registry OK) |
| `auth.js` lines (whole file) | **1662** | (có thể gần bằng) |
| `loginWithSocial` function lines | **27** | ↓ nếu bỏ inject |
| `loginWithSocial` affiliate-related hits | **4** | **0** dual-inject |
| Distinct files calling `getCodeForIdentityCreation` | **7** | **↓** (UseCase + AR + residual non-Google) |
| Social Google AR reader files (auth-social, onetap, auth inject, login-init) | **4** hot | **1** (UseCase only) target |

---

## 2. `auth-social.js` detail

| | Before |
|--|-------:|
| Lines | 322 |
| Functions (17) | `resolveSocialApiBase`, `fetchSocialConfigDirect`, `loadConfig`, `loadScript`, `providerLabel`, `notConfigured`, `ensureAuth`, `finishSocialLogin`, `initGoogle`, `loginGoogle`, `loginApple`, `loginFacebook`, `loginZalo`, `handleZaloCallback`, `affiliateCodeForSocial`, `bindSocialButtons`, `initPage` |
| Exports (8) | `loadConfig`, `loginGoogle`, `loginApple`, `loginFacebook`, `loginZalo`, `handleZaloCallback`, `bindSocialButtons`, `initPage` |
| Concerns mixed | GIS · Apple · FB · Zalo · UI · Affiliate · remember · bridge |

**After WP6 expect:** không còn `initGoogle` / `loginGoogle` / `affiliateCodeForSocial` (Google path); lines ≪ 322 hoặc file split.

---

## 3. `google-onetap.js` detail

| | Before |
|--|-------:|
| Lines | 147 |
| Functions (11) | `isAuthPage`, `isLoggedIn`, `isApiMode`, `inCooldown`, `markDismissed`, `loadGsi`, `getConfig`, `onCredential`, `isLoggedInPage`, `prompt`, `boot` |
| Export | `IfluxGoogleOneTap.boot` |
| After | **File deleted** (OD-SOL-02) |

---

## 4. `social-auth.service.js`

| | Before |
|--|-------:|
| Lines | 217 |
| Functions | 9 (incl. `verifySocialToken`, `verifyGoogleIdToken`, …) |
| `switch (p)` in `verifySocialToken` | **1** |
| After | Registry resolve; switch **không** trong IdentityService/UseCase |

---

## 5. `auth.js` / `loginWithSocial`

| | Before |
|--|-------:|
| File lines | 1662 |
| `loginWithSocial` body lines | **27** |
| Affiliate hits in body | **4** (inject `referral_code` / context) |
| After | Inject removed; complexity ↓; Session/redirect ownership unchanged |

---

## 6. Affiliate reader file set (BEFORE)

```text
User_Web/iflux-web-ui/auth-social.js
User_Web/iflux-web-ui/auth-login-init.js
User_Web/iflux-web-ui/runtime/affiliate-resolver.js   ← SoT definition OK
User_Web/iflux-web-ui/auth.js
User_Web/iflux-web-ui/loyalty-affiliate-store.js      ← ngoài Google rebuild (không xóa nhầm)
User_Web/iflux-web-ui/google-onetap.js
User_Web/iflux-web-ui/auth-register-init.js
```

**Hot social/Google readers (4):** auth-social · onetap · auth.js · login-init  
**Target after:** 1 orchestration reader (UseCase) + AR SoT (+ register/password paths nếu còn).

---

## 7. After table template (WP6)

| Metric | Before | After | Δ |
|--------|-------:|------:|--:|
| auth-social.js lines | 322 | | |
| google-onetap.js lines | 147 | 0 (deleted) | −147 |
| switch(provider) in verify orchestration | 1 | | |
| affiliate hot readers (social/Google) | 4 | 1 | |
| auth-social GSI refs | 5 | 0 | |

---

*Static metrics baseline. So sánh tại Exit WP6 / WP7.*
