# Implementation Readiness Audit — Baseline trước Phase 5

**Date:** 2026-07-28  
**Purpose:** Repo có khớp Plan đã lock không? Baseline trước khi sửa code.  
**Không phải:** Architecture / Solution review.  
**Branch:** `feature/google-login-rebuild`  
**HEAD (full):** `b539a959350bceeedb75f1c831a2c20227e042db` — `feat(affiliate): freeze affiliate attribution capability`  
**`AFFILIATE_GOLDEN^{}` (full):** `b539a959350bceeedb75f1c831a2c20227e042db` (trùng HEAD)  
**`AFFILIATE_GOLDEN` tag object:** `b51940cbbf3f39ed1333b48f90eacefee26ca3f2`  
**Fingerprints:** [baseline-fingerprints/](baseline-fingerprints/)  
**Plan:** [03-Implementation-Plan.md](03-Implementation-Plan.md) 🔒  

**Companion:**  
- [05-Grep-Baseline-Report.md](05-Grep-Baseline-Report.md)  
- [06-Dependency-Graph-Baseline.md](06-Dependency-Graph-Baseline.md)  
- [07-Regression-Baseline-Evidence.md](07-Regression-Baseline-Evidence.md)  
- Raw greps: [`baseline-greps/`](baseline-greps/)

---

## 1. Plan ↔ Repo alignment (PASS/FAIL)

| Plan expectation (BEFORE) | Repo location | Status |
|---------------------------|---------------|--------|
| Google GIS logic | `User_Web/iflux-web-ui/auth-social.js` (`initGoogle` / `loginGoogle`) | ✅ PASS |
| Google GIS #2 (One Tap) | `User_Web/iflux-web-ui/google-onetap.js` | ✅ PASS |
| One Tap script inject | `iflux-web-ui.js` L1675 → `google-onetap.js` | ✅ PASS |
| `switch(provider)` verify | `backend/.../social-auth.service.js` `verifySocialToken` | ✅ PASS |
| Social orchestration bridge | `finishSocialLogin` → `IfluxAuth.loginWithSocial` | ✅ PASS |
| Affiliate read in social/Google | `affiliateCodeForSocial` · onetap · auth.js inject · login-init | ✅ PASS (đúng AS-IS cần xóa/gom) |
| Redirect Policy + lệch One Tap | `redirectAfterAuth` in auth.js · **onetap self-navigate** | ✅ PASS (lệch đúng Plan WP4) |
| TO-BE modules chưa tồn tại | `GoogleProvider` / `SocialLoginUseCase` / registries / `IdentityProof` | ✅ PASS (rg = 0) |
| googleProxy contamination | auth-social / onetap | ✅ PASS (**ABSENT**) |
| Apple/FB/Zalo còn trong auth-social | `loginApple` / `loginFacebook` / `loginZalo` | ✅ PASS (KEEP tạm OD-DEL-03) |

**Verdict readiness vs Plan:** ✅ **ALIGNED** — không sai lệch blocking. Có thể RV-0 → WP1.

---

## 2. File inventory (baseline)

| File | Lines | Role BEFORE | Plan action |
|------|------:|-------------|-------------|
| `User_Web/iflux-web-ui/auth-social.js` | 322 | Google+Apple+FB+Zalo+UI+Affiliate+remember | MOVE Google · DELETE affiliate Google-path · KEEP others tạm |
| `User_Web/iflux-web-ui/google-onetap.js` | 147 | GIS #2 + AR + self redirect | **DELETE** |
| `User_Web/iflux-web-ui/iflux-web-ui.js` | (inject ~1675) | Load onetap | **DELETE** inject |
| `User_Web/iflux-web-ui/auth.js` | 1662 | loginWithSocial · session · AR inject · redirectAfterAuth | MODIFY inject · KEEP session/redirect |
| `User_Web/iflux-web-ui/auth-login-init.js` | 151 | Page · AR · initPage · redirect | MODIFY social referral pass |
| `User_Web/iflux-web-ui/auth-register-init.js` | 340 | Register + social init | MODIFY |
| `User_Web/iflux-web-ui/runtime/auth-login-boot.js` | — | Loads auth.js + auth-social.js | MODIFY assets later |
| `User_Web/iflux-web-ui/runtime/auth-register-boot.js` | — | idem | MODIFY later |
| `User_Web/iflux-web-ui/runtime/affiliate-resolver.js` | 190 | Affiliate SoT | **KEEP** (no behavior change) |
| `User_Web/iflux-web-ui/iflux-api-bundle.js` | — | authSocial body | KEEP/map proof later |
| `backend/.../social-auth.service.js` | 217 | switch verify | REPLACE → VerifierRegistry |
| `backend/.../auth.service.js` | 693 | socialLoginOrRegister + attribution | MODIFY verify consume VerifiedIdentity |

**Absent (expected):** GoogleProvider · ProviderRegistry · SocialLoginUseCase · VerifierRegistry · IdentityProof modules.

---

## 3. Symbol inventory (Google / social hot)

| Symbol | File | Plan |
|--------|------|------|
| `initGoogle` | auth-social.js | MOVE → DELETE old |
| `loginGoogle` | auth-social.js | MOVE → DELETE old |
| `__ifxOnGoogleCredential` | auth-social.js | DELETE |
| `affiliateCodeForSocial` | auth-social.js | DELETE |
| `finishSocialLogin` | auth-social.js | REPLACE → UseCase |
| `bindSocialButtons` | auth-social.js | SPLIT |
| `loginApple` / `loginFacebook` / `loginZalo` / `handleZaloCallback` | auth-social.js | KEEP tạm |
| `IfluxAuthSocial.*` | auth-social + login/register init | REPLACE surface |
| `onCredential` / `prompt` / `boot` | google-onetap.js | DELETE file |
| `IfluxGoogleOneTap` | google-onetap.js | DELETE |
| `loginWithSocial` | auth.js | MODIFY (no dual AR) |
| `getAffiliateContextCode` | auth.js | KEEP · UseCase-only callers |
| `redirectAfterAuth` | auth.js | KEEP · Auth ownership |
| `verifySocialToken` + `switch` | social-auth.service.js | REPLACE registry |
| `verifyGoogleIdToken` | social-auth.service.js | MOVE → GoogleVerifier → VerifiedIdentity |
| `socialLoginOrRegister` | auth.service.js | MODIFY orchestration |

---

## 4. Owner inventory (AS-IS — trước cutover)

| Concern | De-facto owner file | Target owner (Plan) |
|---------|---------------------|---------------------|
| GIS button path | auth-social.js | GoogleProvider |
| GIS One Tap | google-onetap.js | **DELETE** |
| Multi-provider UI bind | auth-social.js | Page + UseCase |
| Affiliate read (social) | auth-social · onetap · auth · login-init | SocialLoginUseCase only |
| Session | auth.js | Session Capability |
| Redirect (login page) | auth.js + login-init | Authentication Redirect Policy |
| Redirect (onetap) | google-onetap.js (**lệch**) | DELETE → Policy only |
| Verify Google | social-auth.service.js | GoogleIdTokenVerifier |
| Identity + attribution | auth.service.js | Identity + Attribution (split verify) |

---

## 5. Dependency inventory (tóm tắt)

Chi tiết: [06-Dependency-Graph-Baseline.md](06-Dependency-Graph-Baseline.md).

```text
auth-login-boot → auth.js → auth-social → GIS / finishSocialLogin → loginWithSocial
                                      ↘ AR (affiliateCodeForSocial)
auth-login-init → IfluxAuthSocial.initPage(+referral) · redirectAfterAuth
iflux-web-ui.js → google-onetap → GIS · AR · loginWithSocial · IfluxHref.navigate (lệch)
loginWithSocial → (inject AR) → API authSocial → socialLoginOrRegister → verifySocialToken(switch)
```

---

## 6. Contaminants check

| Contaminant | Expected | Found |
|-------------|----------|-------|
| googleProxy | ABSENT | ✅ ABSENT |
| TO-BE module names in code | ABSENT | ✅ ABSENT |
| Dual GIS | PRESENT (auth-social + onetap) | ✅ PRESENT (đúng Plan DELETE onetap) |

---

## 7. Readiness gate

| Check | Result |
|-------|--------|
| Repo matches Delete Inventory targets | ✅ |
| Grep baseline captured | ✅ `baseline-greps/` |
| Dependency graph baseline | ✅ doc 06 |
| Regression baseline recorded | ✅ doc 07 |
| Blocking mismatch vs Plan | ❌ none |

```text
IMPLEMENTATION READINESS: PASS
Next allowed: RV-0 → WP1 (Phase 5)
```

---

*Baseline only. Không sửa code trong audit này.*
