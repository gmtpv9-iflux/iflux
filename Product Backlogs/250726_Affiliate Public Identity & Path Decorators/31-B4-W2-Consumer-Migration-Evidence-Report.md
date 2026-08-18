# B4 — Consumer Migration · Wave 2 Evidence Report

**Date:** 2026-07-27  
**Status:** **PASS** (Wave 2 — community pages)  
**Scope:** [`26-B4-Consumer-Migration-Scope-Lock.md`](26-B4-Consumer-Migration-Scope-Lock.md) rev.3 · W2  
**Governance:** MR-1 · MR-2 · Dependency Rule

---

## 1. Wave 2 scope

| File | Change |
|------|--------|
| `community-page.js` | 5× `href="/cong-dong"` → `routeUrl('community')` → `Routes.to()` |
| `community-write-page.js` | CTA Quay lại → `routeUrl('community')` |
| `community-post-page.js` | Breadcrumb → `routeUrl('community')` · comments fallback → `consumerNavigate(canonical)` |

**Cache bust:** `b4w2Nav20260727` (manifest · feature boot · widget lazy)

**Frozen (no diff):** NavigationContext · ShellUrlWriter · normalizePath · lifecycle

---

## 2. Migration pattern

```text
href="/cong-dong"
       ↓
routeUrl('community') → IfluxRoutes.to('community') → decorated href

openInteractiveFallback
       ↓
commentsHrefFromLocation() → canonical path
       ↓
IfluxShellUrlWriter.navigate(canonical)
```

MR-2: canonical only · no `/IFLxxx/` in consumer source.

---

## 3. Grep gate W2

| Gate | Scope | Result |
|------|-------|--------|
| M2 hardcode `href="/cong-dong\|..."` | community*.js W2 | **0** |
| M7 `ownerPublicId` | community*.js W2 | **0** |
| M8 `getContext\|createContext\|transferOwnership` | community*.js W2 | **0** |
| M9 `normalizePath` | community*.js W2 | **0** |
| M10 `decorate(` | community*.js W2 | **0** |
| M11 `/IFL[A-Z0-9]` | community*.js W2 | **0** |
| MR-1 / MR-2 | manual | PASS |

---

## 4. Deploy

Production rsync + Cloudflare purge · 2026-07-27.

---

## 5. Next

**Wave 3** — iflux-web-ui · guest-shell · header-search

**Conformance:** update [`33-Navigation-Conformance-Report.md`](33-Navigation-Conformance-Report.md)

---

**B4 Wave 2 CLOSED**
