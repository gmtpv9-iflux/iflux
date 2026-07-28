# WP2 Exit Evidence — SocialLoginUseCase

**Date:** 2026-07-28  
**Playbook:** [03-Implementation-Plan.md](03-Implementation-Plan.md) §WP2  
**Entry:** WP1 Gate APPROVED (Owner)  
**Status:** ✅ Owner Gate APPROVED → WP3

---

## Flow (REQUIRED after WP2)

```text
Page / bind
  → SocialLoginUseCase.execute('google')
       → ProviderRegistry → GoogleProvider.getProof()
       → AR.getCodeForIdentityCreation()   ← MỘT lần (UseCase only)
       → IfluxAuth.loginWithSocial(tokens, { referral_code?, remember_me })
            → Session (establishSession) — không inject AR
  → Page onSuccess → redirectAfterAuth (Redirect ownership → WP4)
```

**CẤM còn lại (đã xóa):**

```text
GoogleProvider → finishSocialLogin / runGoogleFromRegistry  ❌ gone
loginWithSocial dual-inject AR                              ❌ gone
```

---

## Tasks done

| Task | Result |
|------|--------|
| `social-auth/social-login-usecase.js` | ✅ execute + completeWithTokens |
| Google bind → UseCase.execute | ✅ |
| Apple/FB/Zalo tokens → UseCase.completeWithTokens | ✅ |
| DELETE `affiliateCodeForSocial` | ✅ |
| DELETE dual inject trong `loginWithSocial` | ✅ |
| Page login/register không pass `referral_code` social | ✅ |
| One Tap → UseCase.completeWithTokens (AR không trong onetap) | ✅ |
| Bỏ WP1 wire `runGoogleFromRegistry` | ✅ |

---

## Delete Checklist

| Item | PASS |
|------|------|
| `affiliateCodeForSocial` gone | ✅ |
| dual `referral_code` inject removed | ✅ |
| Page không pass referral cho Google | ✅ |

---

## Ownership Checklist

| Item | PASS |
|------|------|
| UseCase = sole **social** AR reader | ✅ (rg: usecase only among social/google/onetap/auth-social/login-init) |
| Page ↛ AR (social) | ✅ login-init CLEAN |
| Provider ↛ AR | ✅ |

**Còn AR hợp lệ ngoài social:** `affiliate-resolver` SoT · `auth-register-init` form register · `auth.js` registration helpers · `loyalty-affiliate-store` — không phải Google social path.

---

## Exit Criteria

| # | Criterion | Evidence |
|---|-----------|----------|
| 1 | AC-SOC-02 sole UseCase AR for social | greps above |
| 2 | UseCase thin (no GIS/verify/Attribution write) | usecase.js chỉ AR read + loginWithSocial |
| 3 | Google path không AR trong Provider | CLEAN |
| 4 | D3/D4 PASS | ✅ |

---

## Metrics

| File | Before WP2 | After WP2 |
|------|----------:|----------:|
| auth-social.js | 281 | **260** |
| social-login-usecase.js | — | **84** |

---

## Gate

```text
Agent: WP2 Exit = PASS
Owner: Approve → WP3 DELETE One Tap
```

Không Production deploy.

---

*WP2 evidence.*
