# WP4 Exit Evidence — Redirect Policy (code greps)

**Date:** 2026-07-28  
**Playbook:** [03-Implementation-Plan.md](03-Implementation-Plan.md) §WP4  
**Entry:** WP3 Gate APPROVED  
**Status:** ✅ Owner Gate APPROVED → WP5

---

## Code changes

| Change | File |
|--------|------|
| `IfluxAuthRedirectPolicy.execute` = `redirectAfterAuth` | `auth.js` |
| UseCase sau social success → `AuthRedirectPolicy` (delay 400ms) | `social-login-usecase.js` |
| Social page `onSuccess` **không** còn gọi `redirectAfterAuth` | `auth-login-init.js` · `auth-register-init.js` |
| Password / OTP / already-logged-in vẫn gọi cùng `redirectAfterAuth` | cùng Authentication policy |

---

## Evidence greps (runtime code)

### 1. Provider self-navigate = 0

```text
rg location|navigate|reload|redirectAfterAuth social-auth/google-provider.js
→ CLEAN
```

### 2. Session ↛ Redirect

```text
establishSession body contains redirectAfterAuth / location. ?
→ False / False (35 lines, no navigate)
```

### 3. Ownership surface

```text
auth.js:
  function redirectAfterAuth
  global.IfluxAuthRedirectPolicy = { execute: redirectAfterAuth }
```

### 4. Social path uses policy only (via UseCase)

```text
social-login-usecase.js → IfluxAuthRedirectPolicy.execute || IfluxAuth.redirectAfterAuth
auth-login-init socialAuthSuccess → comment only (no redirectAfterAuth call)
auth-register-init social onSuccess → comment only
```

### 5. Remaining `redirectAfterAuth` callers (Authentication — OK)

| Caller | Why OK |
|--------|--------|
| login-init L5 | already logged-in on auth page |
| login-init L92/L111 | **Password** login success — cùng policy |
| register-init L276 | **Register/OTP form** success — cùng policy |
| UseCase | **Social** success |

### 6. Non-post-auth navigate (allowed)

```text
auth-social.js Zalo OAuth hop: window.location.href = zalo permission URL
→ không phải post-auth Redirect Policy
```

---

## Delete / Ownership Checklist

| Item | PASS |
|------|------|
| no provider self-navigate | ✅ |
| Redirect = Authentication (`IfluxAuthRedirectPolicy` / `redirectAfterAuth`) | ✅ |
| Session ↛ RedirectPolicy | ✅ |
| Một policy cho Google social path | ✅ |
| D5 | ✅ |

---

## Exit Criteria

| # | Result |
|---|--------|
| OD-SOL-12 | ✅ |
| một policy Google path | ✅ |
| D5 | ✅ |

---

## Gate

```text
Agent: WP4 Exit = PASS (code evidence)
Owner: Approve → WP5 VerifierRegistry (rủi ro cao — yêu cầu grep ownership nghiêm)
```

Không Production deploy.

---

*WP4 evidence — code-first.*
