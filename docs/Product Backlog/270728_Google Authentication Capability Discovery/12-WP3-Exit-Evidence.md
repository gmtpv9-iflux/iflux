# WP3 Exit Evidence — DELETE One Tap

**Date:** 2026-07-28  
**Playbook:** [03-Implementation-Plan.md](03-Implementation-Plan.md) §WP3  
**Entry:** WP2 Gate APPROVED  
**Status:** ✅ Owner Gate APPROVED → WP4

---

## Tasks done

| Task | Result |
|------|--------|
| DELETE `User_Web/iflux-web-ui/google-onetap.js` | ✅ |
| DELETE `loadGoogleOneTap` + `ifxDeferIdle(loadGoogleOneTap)` khỏi `iflux-web-ui.js` | ✅ |
| DELETE dismiss key / UseCase preload for onetap | ✅ (theo file) |
| Bump `iflux-web-ui.js?v=wp3Ggl20260728` (auth boots + shell-boot) | ✅ |

---

## Delete Checklist

| Item | PASS |
|------|------|
| file gone | ✅ `test -f` → DELETED |
| script include gone | ✅ |
| `rg onetap\|gonetap\|GoogleOneTap\|google-onetap` trên `User_Web` (code) | ✅ **CLEAN** |

`_bak/` / coverage JSON không thuộc runtime — không tính Gate.

---

## Ownership Checklist

| Item | PASS |
|------|------|
| no residual One Tap owner | ✅ |

---

## Exit Criteria

| # | Criterion | Result |
|---|-----------|--------|
| 1 | OD-DEL-02 | ✅ |
| 2 | không còn surface One Tap | ✅ |
| 3 | D2 PASS | ✅ |

---

## Metrics

| Metric | Before | After |
|--------|-------:|------:|
| google-onetap.js lines | 147 | **0 (deleted)** |
| Dual GIS entry (icon + onetap) | 2 | **1** (Provider only) |

---

## Gate

```text
Agent: WP3 Exit = PASS
Owner: Approve → WP4 Redirect Policy
```

Không Production deploy.

---

*WP3 evidence.*
