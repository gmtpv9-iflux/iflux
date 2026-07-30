# WP6 Exit Evidence — Cleanup + Architecture Diff AFTER

**Date:** 2026-07-28  
**Playbook:** [03-Implementation-Plan.md](03-Implementation-Plan.md) §WP6  
**Entry:** WP5 Gate APPROVED  
**Status:** ⏳ Agent Exit · chờ Owner Gate → WP7 (+ RV-1)

---

## 1. Legacy shim leak — RESOLVED (REPLACE)

| Before WP6 | After WP6 |
|------------|-----------|
| `social-auth.service.verifyGoogleIdToken` shim | **DELETED** |
| `social-auth.service.verifySocialToken` unused export | **DELETED** |
| Admin `require(...verifyGoogleIdToken)` | **MOVED** → `googleVerifier.verify` → `VerifiedIdentity` |

```bash
rg verifyGoogleIdToken backend --glob '*.js'
→ chỉ còn comment trong social-auth.service.js (không export/function)
```

**Consumer runtime:** Admin dùng GoogleVerifier trực tiếp — **không** còn shim User Web/legacy.

---

## 2. Delete Checklist (OD-DEL-07)

| ID | Item | PASS |
|----|------|------|
| D1 | GIS / loginGoogle / initGoogle deleted from auth-social | ✅ |
| D2 | google-onetap.js deleted | ✅ |
| D3 | affiliateCodeForSocial gone | ✅ |
| D4 | dual AR inject in loginWithSocial gone | ✅ (`getAffiliateContextCode` not in body) |
| D5 | provider self-navigate gone | ✅ |
| D6 | switch not in Identity orchestration | ✅ |
| D7 | no deprecated verifyGoogleIdToken stub | ✅ **deleted** |
| D8 | rg gates PASS (User_Web runtime) | ✅ |

---

## 3. Ownership Checklist

| ID | Check | PASS |
|----|-------|------|
| O1 | Modules in matrix exist (`social-auth/*`, `identity/*`) | ✅ |
| O2 | MOVE + old owner removed | ✅ |
| O3 | No dual GIS ownership | ✅ |
| O4 | Dependency direction | ✅ Provider ↛ AR/Redirect |
| O5 | Redirect = Authentication | ✅ WP4 |
| O6 | Page ↛ GoogleProvider directly | ✅ via UseCase |

`auth-social.js` = residual Apple/FB/Zalo + bind only · **≠ Google GIS owner**.

---

## 4. Architecture Diff — AFTER (cutover)

### BEFORE (baseline — gone)

```text
Page → auth-social (GIS+AR+UI) → loginWithSocial(+inject AR)
     → google-onetap (GIS#2+AR+navigate)
Backend: switch(provider) in verifySocialToken
```

### AFTER (repo now)

```text
Page
  → SocialLoginUseCase
       → ProviderRegistry → GoogleProvider → IdentityProof
       → AR.getCodeForIdentityCreation()   // sole social reader
       → loginWithSocial (no inject)
       → Session
       → IfluxAuthRedirectPolicy

Route
  → socialLoginOrRegister
       → VerifierRegistry → GoogleVerifier → VerifiedIdentity
       → find/create/merge + Attribution if new

Admin Google
  → googleVerifier.verify → VerifiedIdentity  // no shim
```

---

## 5. Static metrics Before → After

| Metric | Before (freeze) | After WP6 |
|--------|----------------:|----------:|
| auth-social.js lines | 322 | **260** |
| google-onetap.js | 147 | **0 deleted** |
| social-auth.service.js lines | 217 | **37** (config only) |
| switch(provider) in verify orchestration | 1 | **0** |
| verifyGoogleIdToken export | yes | **no** |
| Google GIS owner | auth-social | **GoogleProvider** |

---

## 6. KEEP tạm (OD-DEL-03)

Apple / Facebook / Zalo token acquisition còn trong `auth-social.js` → `UseCase.completeWithTokens`.  
WP7 smoke / defer split provider.

---

## 7. Gate

```text
Agent: WP6 Exit = PASS
Owner: Approve → WP7 Regression Matrix + RV-1
```

Không Production deploy đến WP7 PASS.

---

*WP6 evidence — cleanup + AFTER diff.*
