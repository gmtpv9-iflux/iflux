# P5 — Pre-Implementation Audit (Legacy Query Removal)

**Date:** 2026-07-27  
**Objective:** Hard cutover — một chuẩn affiliate duy nhất `/{publicId}/…`  
**Prerequisite:** P0–P4 PASS (Owner)

---

## Scope lock

> **P5 = retirement phase.** Remove query referral runtime. **Forbidden:** đổi resolver path · Share Foundation decorate · signup attribution rule · payout · publicId format · thêm compat layer mới.

---

## Inventory — `?ref=` / `?r=` / `parseRef*` (pre-P5)

| Location | Type | P5 action |
|----------|------|-----------|
| `loyalty-affiliate-store.js` `parseRefFromLocation` | runtime incoming | **DELETE** |
| `loyalty-affiliate-store.js` `parseRefFromReturnParam` | runtime incoming | **DELETE** |
| `loyalty-affiliate-store.js` `buildReferralLink` fallback `?ref=` | runtime outgoing | **DELETE** → path thin fallback |
| `loyalty-affiliate-store.js` `captureRefFromUrl` query branch | runtime incoming | **DELETE** → path only |
| `share-feature-boot.js` query redirect | runtime compat | **DELETE** → `/nha-cua-toi` only |
| `auth-register-init.js` `getUrlRefCode` query parse | runtime incoming | **MODIFY** → path only |
| `auth.js` `captureRefFromUrl` query fallback | runtime incoming | **DELETE** → delegate Loyalty |
| `interaction/catalog/index.js` comments | comment | **UPDATE** wording |
| `share-action-store.js` `searchParams.delete('ref')` | sanitize canonical | **KEEP** (not capture/generate) |
| `_bak/...` | archive | **IGNORE** |
| `Admin_Design_system/patterns/referrals.html` | DS demo template | **IGNORE** (not Production runtime) |
| Affiliate task docs P0–P4 | historical | **UPDATE** post-P5 |

---

## Incoming owner (target)

```text
captureRefFromUrl()
        ↓
parsePublicIdFromPath()   ← sole incoming parser
```

## Outgoing owner (unchanged — P3)

```text
Share Foundation.decorateAffiliateRef()   ← sole outgoing decorate
```

---

## GO

| Gate | Result |
|------|--------|
| P4 Owner sign-off | ✅ |
| Inventory complete | ✅ |
| Scope bounded | ✅ |

**GO P5 Legacy Removal**
