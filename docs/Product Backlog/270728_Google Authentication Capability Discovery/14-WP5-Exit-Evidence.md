# WP5 Exit Evidence — VerifierRegistry + VerifiedIdentity (code ownership)

**Date:** 2026-07-28  
**Playbook:** [03-Implementation-Plan.md](03-Implementation-Plan.md) §WP5  
**Entry:** WP4 Gate APPROVED  
**Status:** ✅ Owner Gate APPROVED → WP6

---

## Responsibility graph (AFTER)

```text
Route (auth.routes)
   ↓
socialLoginOrRegister  (auth.service — Identity orchestration)
   ↓
VerifierRegistry.verify(provider, payload)
   ↓
GoogleVerifier.verify  (HTTP Google only)
   ↓
VerifiedIdentity  { provider, providerUserId, email, emailVerified, displayName, avatarUrl }
   ↑
Identity find/create/merge + Attribution (IdentityCreated only)
```

**Không còn:** IdentityService → GoogleVerifier → User.

---

## Owner check 1 — Verifier ↛ DB

```bash
rg -n "query\(|User\.find|db\.|FROM users|INSERT INTO|UPDATE users|getPool" \
  backend/src/modules/legacy-auth/identity/verifiers/
→ CLEAN
```

---

## Owner check 2 — IdentityService không verify token

```bash
rg -n "verifyGoogleIdToken|tokeninfo|switch\s*\(" backend/src/modules/legacy-auth/auth.service.js
→ CLEAN
```

`socialLoginOrRegister` chỉ gọi `verifierRegistry.verify` rồi `toLegacySocialProfile`.

---

## Owner check 3 — switch(provider)

```bash
rg -n "switch\s*\(" backend/src/modules/legacy-auth/identity/ \
  backend/src/modules/legacy-auth/auth.service.js \
  backend/src/modules/legacy-auth/social-auth.service.js
```

Hits = **comments only** (“không switch…”). **Không còn `switch (` statement.**

Registration: `verifier-registry.js` `register('google'|…)` bootstrap — allowed.

---

## Owner check 4 — VerifiedIdentity contract

`google-verifier.js` returns:

```js
createVerifiedIdentity({
  provider: 'google',
  providerUserId: String(tokenPayload.sub),
  email, emailVerified, displayName, avatarUrl
})
```

`Object.freeze` · **không** `return user` / DB row.

---

## Owner check 5 — files added

| Path | Role |
|------|------|
| `identity/verified-identity.js` | Contract + toLegacySocialProfile |
| `identity/verifier-registry.js` | register / resolve / verify |
| `identity/verifiers/google-verifier.js` | Google proof only |
| `identity/verifiers/apple|facebook|zalo-verifier.js` | Wrap register tối thiểu |
| `social-auth.service.js` | Config + compat shim (admin `verifyGoogleIdToken` → VerifiedIdentity → legacy profile) |

---

## Smoke

```text
node require verifier-registry → list [google,apple,facebook,zalo]
```

---

## Delete / Ownership Checklist

| Item | PASS |
|------|------|
| switch không trong IdentityService / UseCase / Provider | ✅ |
| Verifier ↛ DB | ✅ |
| VerifierRegistry = Identity module | ✅ |
| VerifiedIdentity only from verifier | ✅ |
| Attribution vẫn sau IdentityCreated trong socialLoginOrRegister | ✅ (giữ) |
| D6 | ✅ |

---

## Gate

```text
Agent: WP5 Exit = PASS (5 ownership checks)
Owner: Approve → WP6 cleanup
```

Không Production deploy.

---

*WP5 evidence — code-first.*
