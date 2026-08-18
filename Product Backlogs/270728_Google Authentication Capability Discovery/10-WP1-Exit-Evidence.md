# WP1 Exit Evidence — ProviderRegistry + GoogleProvider

**Date:** 2026-07-28  
**Playbook:** [03-Implementation-Plan.md](03-Implementation-Plan.md) §WP1  
**Branch:** `feature/google-login-rebuild`  
**Status:** ✅ Owner Gate APPROVED · bridge tạm đã **thay bằng UseCase** tại WP2  
xem [11-WP2-Exit-Evidence.md](11-WP2-Exit-Evidence.md)

---

## Entry

| Check | Result |
|-------|--------|
| RV-0 PASS | ✅ |
| Plan LOCKED | ✅ |
| Branch feature | ✅ |

---

## Tasks done

| Task | Result |
|------|--------|
| `social-auth/identity-proof.js` — immutable `IfluxIdentityProof.create` | ✅ |
| `social-auth/google-provider.js` — GIS → `getProof()` → IdentityProof | ✅ |
| `social-auth/provider-registry.js` — register/resolve | ✅ |
| MOVE GIS khỏi `auth-social.js` | ✅ |
| Wire tạm: `runGoogleFromRegistry` → Registry → finishSocialLogin | ✅ |
| Boot login/register load 3 scripts trước auth-social | ✅ |

---

## Delete Checklist (WP1)

| Item | PASS |
|------|------|
| `loginGoogle` / `initGoogle` / `__ifxOnGoogleCredential` khỏi auth-social | ✅ |
| auth-social không còn `accounts.google` / `google.accounts` | ✅ |
| Dual GIS trong **auth-social + Provider** | ✅ (chỉ Provider) |
| One Tap dual entry | ⏳ WP3 (cố ý — OD-SOL-02) |

---

## Ownership Checklist (WP1)

| Item | PASS |
|------|------|
| GoogleProvider owner = Social Auth (`social-auth/`) | ✅ |
| auth-social không còn claim GIS | ✅ |
| OD-DEL-08: old GIS symbols removed, not deprecated stub | ✅ (`loginGoogle` export removed) |
| Provider ↛ AR / Session / Redirect | ✅ rg affiliate/referral/session/redirect = 0 trên google-provider |

---

## Exit Criteria

| # | Criterion | Evidence |
|---|-----------|----------|
| 1 | `GoogleProvider.getProof()` → immutable IdentityProof | `Object.freeze` in identity-proof.js · kind=`id_token` |
| 2 | auth-social không còn logic GIS | rg GIS patterns = 0 |
| 3 | Provider ↛ UseCase/AR/Session/Redirect | no imports; rg clean |
| 4 | D1 partial | GIS moved; loginGoogle deleted from auth-social |

---

## Metrics delta (partial)

| File | Before | After WP1 |
|------|-------:|----------:|
| auth-social.js lines | 322 | 281 |
| Google GIS owner | auth-social | `social-auth/google-provider.js` |

---

## Gate

```text
Agent: WP1 Exit Criteria + Evidence = PASS
Owner: Approve Gate → WP2 SocialLoginUseCase
```

**Không** Production deploy (Plan: sau WP7).

---

*WP1 evidence only.*
