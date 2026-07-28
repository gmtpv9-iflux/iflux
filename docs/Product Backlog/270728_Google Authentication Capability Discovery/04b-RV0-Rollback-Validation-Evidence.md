# RV-0 — Rollback Validation Evidence

**Date:** 2026-07-28  
**Plan:** [03-Implementation-Plan.md](03-Implementation-Plan.md) §2 OD-PLAN-07  
**Status:** ✅ **RV-0 PASS** (preflight)

---

## Tag resolution (full 40-char SHA)

```text
git rev-parse AFFILIATE_GOLDEN^{}
b539a959350bceeedb75f1c831a2c20227e042db

git rev-parse HEAD
b539a959350bceeedb75f1c831a2c20227e042db

git rev-parse AFFILIATE_GOLDEN
b51940cbbf3f39ed1333b48f90eacefee26ca3f2   # annotated tag object (≠ commit)
```

| Ref | Full SHA | Note |
|-----|----------|------|
| `AFFILIATE_GOLDEN^{}` | `b539a959350bceeedb75f1c831a2c20227e042db` | Freeze commit · message `feat(affiliate): freeze affiliate attribution capability` |
| `HEAD` (at RV-0) | `b539a959350bceeedb75f1c831a2c20227e042db` | Trùng peel |
| `AFFILIATE_GOLDEN` | `b51940cbbf3f39ed1333b48f90eacefee26ca3f2` | Tag object only |

**File fingerprints:** [baseline-fingerprints/](baseline-fingerprints/) — SHA-256 `auth-social.js` / `google-onetap.js` / `auth.js` / `social-auth.service.js` (working tree == golden blob).

---

## Checklist

| Step | Action | Result |
|------|--------|--------|
| RV-0.1 | Tag exists · peel = freeze commit | ✅ |
| RV-0.2 | `git worktree add --detach /tmp/iflux-affiliate-golden-rv0 AFFILIATE_GOLDEN` | ✅ checkout OK |
| RV-0.3 | Smoke static: `loginGoogle` + `affiliateCodeForSocial` · **no** `googleProxy` | ✅ |
| RV-0.4 | Assets present: auth-social 322 · google-onetap 147 | ✅ |
| RV-0.5 | Worktree removed after probe | ✅ |

### RV-0.3 excerpt

```text
auth-social.js @ AFFILIATE_GOLDEN^{}
  loginGoogle — present
  affiliateCodeForSocial — present
  googleProxy — ABSENT
```

---

## RV-1 (sau WP6 — chưa chạy)

| Step | Status |
|------|--------|
| RV-1.1–1.5 Emergency rollback drill + smoke Password/AR | ⏳ Pending post-WP6 |

---

## Sign-off

| Role | Status |
|------|--------|
| Agent | ✅ RV-0 PASS 2026-07-28 |
| Owner | Xác nhận để mở Runtime/Static baselines → WP1 |

---

*RV-0 only. Production deploy không liên quan.*
