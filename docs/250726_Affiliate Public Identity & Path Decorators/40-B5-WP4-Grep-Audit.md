# B5-WP4 — Architecture Grep Audit

**Date:** 2026-07-27  
**Status:** **PASS**  
**Scope:** B5 closure — no new code · grep-only gates  
**Frozen modules:** Writer · Context · Lifecycle · `decorateAffiliateRef` algorithm

---

## 1. Objective

Xác nhận toàn repo:

- Mọi outgoing share URL đi qua Share Foundation
- Không còn bypass / duplicate URL builder
- Không diff trên navigation core (B3/B2 frozen)

---

## 2. Share Foundation — single outgoing builder

| API | Owner file | Role |
|-----|------------|------|
| `buildShareUrl(opts)` | `share-action-store.js` | Canonical A → decorated share URL B |
| `createShare(payload)` | `share-action-store.js` | Insight wrapper — **requires** `canonicalUrl` |
| `decorateAffiliateRef(clean, code)` | `share-action-store.js` | Path prefix only |

### 2.1 `buildShareUrl` call sites (production, excl. `_bak`)

| File | Role | PASS |
|------|------|------|
| `Admin_Design_system/.../share-action-store.js` | Foundation definition | ✅ |
| `User_Web/.../interaction/catalog/index.js` | Article share consumer | ✅ |

**Result:** 1 consumer + 1 Foundation — **no duplicate builder**.

### 2.2 `createShare` call sites

| File | Line | `canonicalUrl` passed |
|------|------|------------------------|
| `share-action-store.js` | def | `requireCanonicalUrl()` throws if missing |
| `share-action.js` | ~1113 | ✅ `resolveShareCanonical(meta)` |
| `share-action.js` | ~1404 | ✅ `payload.canonicalUrl \|\| resolveOwningPageCanonical()` |

**Result:** **PASS** — no silent home default.

### 2.3 `decorateAffiliateRef` call sites

| File | Use |
|------|-----|
| `share-action-store.js` | Internal — `buildShareUrl` |
| `loyalty-affiliate-store.js` | `buildReferralLink()` — guidance root `/{publicId}` |

**Result:** **PASS** — referral guidance delegates to Foundation, không tự build path.

---

## 3. Dead / removed bypass inventory

| Pattern | Production matches | Status |
|---------|-------------------|--------|
| `homeCanonicalUrl` | **0** (only `_bak`) | ✅ REMOVED |
| `community-ui.shareUrl` | **0** | ✅ REMOVED |
| `shareUrl(slug)` | **0** | ✅ REMOVED |
| Outgoing `?ref=` in `User_Web/iflux-web-ui/*.js` | **0** | ✅ PASS |
| `?ref=` in Share Foundation | **0** | ✅ PASS |
| Hardcode `/IFL…` in User_Web consumers | **0** | ✅ PASS |

---

## 4. `location.href` — classified (not bypass)

| File | Context | Classification |
|------|---------|----------------|
| `interaction/catalog/index.js` | Fallback canonical normalize (strip publicId/ref) — **input**, not outgoing share builder | ✅ EXCLUDED |
| `loyalty-affiliate.js` | Open referral guidance URL in browser (navigate, not copy-share) | ✅ EXCLUDED — guidance UX |

**AC-B5-SHR-002 gate:** No share consumer builds app-zone outgoing URL via raw `location.href` without Foundation decorate.

---

## 5. Frozen navigation core — git diff

| Module | B5 diff |
|--------|---------|
| `shell-url-writer.js` | **0 files** |
| `navigation-context.js` | **0 files** |
| `pnc-lifecycle.js` | **0 files** |

**AC-B5-REG-001 / AC-B5-FROZEN:** **PASS**

---

## 6. Duplicate URL builder check

| Function | Files |
|----------|-------|
| `buildShareUrl` | Foundation only (+ 1 consumer call) |
| `buildReferralLink` | `loyalty-affiliate-store.js` — delegates `decorateAffiliateRef` |
| `shareUrl()` standalone | **none** |

**Result:** **PASS** — single Foundation math.

---

## 7. Outgoing share surface map (final)

| ID | Surface | Path | Foundation |
|----|---------|------|------------|
| S1 | Article — Chia sẻ | `interaction/catalog` → `buildShareUrl` | ✅ |
| S2 | Insight — Copy link | `share-action.js` → `createShare({ canonicalUrl })` | ✅ |
| S3 | Referral tab — Copy | `buildReferralLink` → `decorateAffiliateRef` | ✅ |
| S4 | Coupon copy | clipboard code only | EXCLUDED |

**`navigator.share`:** **0** production call sites (removed from article path; copy-only).

---

## 8. Verdict

| Gate | Result |
|------|--------|
| All outgoing share via Share Foundation | ✅ PASS |
| No dead bypass (`homeCanonicalUrl`, `community-ui.shareUrl`) | ✅ PASS |
| No duplicate URL builder | ✅ PASS |
| Writer/Context/Lifecycle untouched | ✅ PASS |
| Outgoing `?ref=` in JS | ✅ PASS (0) |

**WP-4 Step 1: PASS**

---

*Grep run: 2026-07-27 · repo root · exclude `_bak/`, `node_modules/`*
