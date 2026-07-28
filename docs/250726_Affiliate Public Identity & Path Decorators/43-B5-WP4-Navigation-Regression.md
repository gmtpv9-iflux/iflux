# B5-WP4 — Navigation Regression

**Date:** 2026-07-27  
**Status:** **PASS (no B5 regress on frozen core)**  
**Parallel:** B4.5 soak continues · §4.1 locked  
**Reference:** [`33-Navigation-Conformance-Report.md`](33-Navigation-Conformance-Report.md) · [`34-B4.5-Stabilization-Scope-Lock.md`](34-B4.5-Stabilization-Scope-Lock.md)

---

## 1. Objective

Verify B5 (WP-1 SEO consumers + WP-2 Share consumers + IX sidebar flatten) **did not regress**:

- NavigationContext
- ShellUrlWriter
- PNC Lifecycle
- Share Foundation incoming path
- publicId injection / INV-7

---

## 2. Frozen module diff gate

| Module | B5 change | Result |
|--------|-----------|--------|
| `runtime/shell-url-writer.js` | **0 diff** | ✅ |
| `runtime/navigation-context.js` | **0 diff** | ✅ |
| `runtime/pnc-lifecycle.js` | **0 diff** | ✅ |
| `affiliate-resolver.js` parse contract | **0 diff** | ✅ |
| `decorateAffiliateRef` algorithm | **0 diff** | ✅ |

**AC-B5-REG-001:** **PASS**

---

## 3. B5 touchpoints vs navigation pipeline

```text
B5 modified (consumer-only):
  share-action-store.js      → outgoing URL math only
  share-action.js            → Insight consumer canonical
  interaction/catalog        → article share consumer
  community-ui.js            → SEO JSON-LD consumer (WP-1)
  community-post-page.js     → microdata + IX mount (WP-1 + IX slice)
  seo-url.js                 → postCanonical (WP-1)

NOT modified:
  shell-url-writer.js
  navigation-context.js
  pnc-lifecycle.js
  iflux-routes.js route registry
```

---

## 4. Share Foundation ↔ Navigation boundary

| Direction | Owner | B5 impact |
|-----------|-------|-----------|
| **Incoming** | Loyalty `captureRefFromUrl` + path parse | None — frozen |
| **Outgoing** | Share Foundation `buildShareUrl` | WP-2 contract only |
| **Navigation decorate** | Writer `decorate()` | None — frozen |

**Rule preserved:** Share outgoing **≠** SEO canonical **≠** navigation bar URL builder.

---

## 5. share-feature-boot.js (incoming redirect)

| Behavior | Expected | Status |
|----------|----------|--------|
| `/chia-se` boot | `IfluxHref.navigate('/nha-cua-toi')` | ✅ Uses funnel API |
| Fallback | `ShellUrlWriter.navigate` | ✅ |
| Last resort | `location.replace` | ✅ documented |

No query `?ref=` outgoing — path-only P5 contract intact.

---

## 6. INV-7 — canonical vs bar (article re-verify)

| Layer | URL shape |
|-------|-----------|
| Browser bar (affiliate session) | `/IFLYZ2NC/cong-dong/bai-viet/{slug}` |
| SEO canonical / og:url | `/cong-dong/bai-viet/{slug}` (clean) |
| Share outgoing (affiliate) | `/IFLYZ2NC/cong-dong/bai-viet/{slug}` |

**No regression:** meta clean while bar decorated — same as P4/B5-WP1.

---

## 7. AC-NAV-ROOT smoke (code + prior soak)

| Step | Expected | B5 regress? |
|------|----------|-------------|
| Open `/IFLYZ2NC` | Community shell | ❌ none |
| Sidebar links | `/IFLYZ2NC/...` | ❌ none |
| Article detail link | decorated | ❌ none |
| Refresh | prefix holds | ⏳ B4.5 soak watch |

B5 did not modify bootstrap / Writer / reconcile hooks.

---

## 8. Consumer conformance (unchanged from B4.3)

Matrix §3 in Navigation Conformance — all migrated rows remain **PASS**.  
B5-only consumers:

| Consumer | Nav interaction |
|----------|-----------------|
| Article share | Read-only canonical · no `navigate()` change |
| Insight share | Read-only canonical · modal only |
| SEO patch | `document.head` only |

---

## 9. B4.5 soak status (parallel — not B5 blocker)

| Criterion | Status |
|-----------|--------|
| X1 S1–S15 PASS 2–3 days | ⏳ Owner calendar |
| X2 No P0/P1 identity regress | ⏳ watch |
| X4 C1–C4 conformance | ✅ |

B5 PASS **does not require** B4.5 soak sign-off — parallel tracks per scope lock.

---

## 10. Verdict

| Check | Result |
|-------|--------|
| Writer/Context/Lifecycle 0 diff | ✅ PASS |
| Navigation funnel intact | ✅ PASS |
| INV-7 article meta | ✅ PASS |
| Incoming share boot | ✅ PASS |
| B4.5 soak | ⏳ parallel |

**WP-4 Step 4: PASS**

---

*B5 chứng minh SEO/Share tách khỏi navigation core — core PNC không đổi.*
