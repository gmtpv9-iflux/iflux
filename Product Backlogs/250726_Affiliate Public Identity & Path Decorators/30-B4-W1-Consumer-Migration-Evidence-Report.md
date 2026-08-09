# B4 — Consumer Migration · Wave 1 Evidence Report

**Date:** 2026-07-27  
**Status:** **PASS** (Wave 1 — widgets)  
**Scope:** [`26-B4-Consumer-Migration-Scope-Lock.md`](26-B4-Consumer-Migration-Scope-Lock.md) rev.3 · W1  
**Governance:** MR-1 · MR-2 · Dependency Rule

---

## 1. Wave 1 scope

| File | Change |
|------|--------|
| `widgets/loyalty-page/index.js` | `data-route-key` + `routeUrl()` → `Routes.to()` |
| `widgets/pricing-page/index.js` | FAQ link + checkout CTA → `navigate(canonical)` |
| `widgets/faq-page/index.js` | pricing · membership links |
| `widgets/messages-page/index.js` | breadcrumb home link |
| `loyalty-page.js` | affiliate goto → `consumerNavigate(canonical)` *(widget dep)* |

**Frozen (no diff):** NavigationContext · ShellUrlWriter · normalizePath · lifecycle

---

## 2. Migration pattern

```text
Static HTML  href="#" data-route-key="pricing"
       ↓ mount()
routeUrl(key) → IfluxRoutes.to(key)  → decorated href

Checkout CTA  data-route-canonical="/tai-khoan/thanh-toan?..."
       ↓ click
IfluxShellUrlWriter.navigate(canonical)
```

MR-2: canonical only · no `/IFLxxx/` in consumer source.

---

## 3. Grep gate W1

| Gate | Result |
|------|--------|
| M2 hardcode `href="/cong-dong\|nha-cua-toi\|..."` widgets | **0** |
| M7 `ownerPublicId` widgets | **0** |
| M8 `getContext\|createContext\|transferOwnership` widgets | **0** |
| M9 `normalizePath` widgets | **0** |
| M10 `decorate(` widgets | **0** |
| M11 `/IFL[A-Z0-9]` widgets | **0** |
| MR-1 / MR-2 | PASS — Routes.to + navigate only |

---

## 4. Deploy

Production rsync + Cloudflare purge · 2026-07-27.

---

## 5. Next

**Wave 2** — community-page · community-write · community-post-page

**Conformance:** update [`33-Navigation-Conformance-Report.md`](33-Navigation-Conformance-Report.md)

**B4.5 Stabilization** — after W4 + report all green

---

**B4 Wave 1 CLOSED**
