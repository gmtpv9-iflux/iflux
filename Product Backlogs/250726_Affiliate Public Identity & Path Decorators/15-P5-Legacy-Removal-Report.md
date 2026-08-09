# P5 — Legacy Query Referral Removal Report

**Phase:** P5 — Hard cutover  
**Date:** 2026-07-27  
**Owner decision:** Legacy Removal (path-only affiliate)

---

## 1. Objective — achieved

Sau P5, Production runtime:

| Rule | Status |
|------|--------|
| Canonical affiliate format duy nhất `/{publicId}/…` | ✅ |
| Không parse incoming `?ref=` / `?r=` | ✅ |
| Không generate outgoing `?ref=` | ✅ |
| Không redirect compat query | ✅ |
| Không fallback query khi SF chưa load | ✅ (path thin fallback) |

---

## 2. APIs / functions removed

| Removed | Former owner |
|---------|--------------|
| `parseRefFromLocation()` | `loyalty-affiliate-store.js` |
| `parseRefFromReturnParam()` | `loyalty-affiliate-store.js` |
| `hasRefInUrl()` | replaced by `hasPublicIdInPath()` |
| Query branch in `captureRefFromUrl()` | loyalty |
| Query fallback in `buildReferralLink()` | loyalty |
| Query parse in `auth.js` `captureRefFromUrl` fallback | auth |
| Query parse in `auth-register-init.js` `getUrlRefCode` | register |
| `/chia-se?ref=` redirect logic | `share-feature-boot.js` |

---

## 3. Files changed

| File | Change |
|------|--------|
| `User_Web/iflux-web-ui/loyalty-affiliate-store.js` | Path-only incoming; path fallback outgoing |
| `User_Web/iflux-web-ui/runtime/share-feature-boot.js` | Redirect `/nha-cua-toi` only; no query |
| `User_Web/iflux-web-ui/auth-register-init.js` | `getUrlRefCode` → path only |
| `User_Web/iflux-web-ui/auth.js` | `captureRefFromUrl` delegate only |
| `User_Web/iflux-web-ui/interaction/catalog/index.js` | comment wording |
| `User_Web/share/index.html` | cache bust `shareAffP5_20260727` |
| Boot chains (`auth-*`, `account`, `checkout`) | cache bust loyalty + auth |

**Không sửa (forbidden):** `affiliate-resolver.js`, `share-action-store.js` decorate, nginx, signup/payout backend.

---

## 4. Grep evidence (post-P5 runtime)

```bash
rg 'parseRef|\?ref=|\?r=' --glob '*.js' User_Web Admin_Design_system/iflux-admin-ui/foundation
```

| Pattern | Runtime hits | Notes |
|---------|--------------|-------|
| `parseRef` | **0** | Chỉ còn `_bak/` archive |
| `?ref=` | **0** | Chỉ còn `_bak/`, DS pattern demo |
| `?r=` | **0** | runtime sạch |

`share-action-store.js` dùng `searchParams.delete('ref'|'r')` để **sanitize canonical** — không phải capture/generate query referral.

---

## 5. Regression report

Ref test: `IFL9552M`

### PASS (must work)

| Case | Expected | Result |
|------|----------|--------|
| `/IFL9552M/cong-dong` | capture `IFL9552M` | **PASS** |
| `/IFL9552M/post/123` | capture `IFL9552M` | **PASS** |
| `buildShareUrl` (login) | `/IFL9552M/…` | **PASS** (P3 Foundation unchanged) |
| Guest share | canonical sạch | **PASS** |

### FAIL by design (must NOT capture)

| Case | Expected | Result |
|------|----------|--------|
| `/cong-dong?ref=IFL9552M` | no capture from query | **PASS** |
| `/cong-dong?r=IFL9552M` | no capture | **PASS** |
| `/chia-se?ref=IFL9552M` | redirect `/nha-cua-toi` · no query capture | **PASS** |
| `parseRefFromLocation` exists | removed | **PASS** |

---

## 6. Architecture summary (post-P5)

```text
OUTGOING (share đi)
  User.referral_code
        ↓
  Share Foundation.decorateAffiliateRef()
        ↓
  /{publicId}/path

INCOMING (ai mở link)
  /{publicId}/path
        ↓
  affiliate-resolver.js (P2 — strip history, cookie)
        ↓
  loyalty.parsePublicIdFromPath() + captureRefFromUrl()
        ↓
  cookie iflux_ref_code → signup referred_by
```

**Một incoming owner:** `parsePublicIdFromPath()` (Loyalty, delegate Resolver).  
**Một outgoing owner:** `decorateAffiliateRef()` (Share Foundation).

Affiliate identity = **Path Prefix duy nhất**. Query referral **retired** khỏi runtime.

---

## 7. Documentation

| Doc | Update |
|-----|--------|
| `00-README.md` | P5 PASS · task execution CLOSED |
| P0–P4 evidence | Giữ archive · ghi historical query era |
| SoT Product V2 Share | Path-only (via task docs) |

---

## 8. Status

| Gate | Result |
|------|--------|
| Runtime query removal | **PASS** |
| Single incoming / outgoing owner | **PASS** |
| Regression path PASS | **PASS** |
| Query cases FAIL by design | **PASS** |
| Grep hygiene | **PASS** |
| Scope lock | **PASS** |
| Deploy Production | **PASS** — 2026-07-27 · CDN purge |

**P5: PASS** — Legacy query referral retired.
