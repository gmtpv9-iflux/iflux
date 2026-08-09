# B1 — PNC Foundation Evidence Report

**Date:** 2026-07-27  
**Status:** **PASS** (Foundation scope — không B2/B3)  
**ADR:** [`18-ADR-AFF-007-Personal-Navigation-Context.md`](18-ADR-AFF-007-Personal-Navigation-Context.md) APPROVED  
**Scope lock:** Infrastructure only · no prepend · no auth lifecycle · no widget migration

---

## 1. Architecture Diff

### Before

```text
affiliate-resolver.js
  parse → capture cookie → history.replaceState(strip) → bar = /cong-dong

path-base.js / IfluxRoutes
  normalizePath = trim only (no IFL strip)
  → /IFL111/cong-dong breaks detectPhysicalBase

No NavigationContext object
No Shell event subscription
```

### After (B1)

```text
affiliate-resolver.js
  parse → capture → emit CustomEvent('iflux-incoming-referrer')
  NO replaceState · NO location mutation

iflux-normalize-path.js (early inject)
  IfluxNormalizePath — pure IFL strip for read pipeline

path-base.js · iflux-routes.js · iflux-platform-boot.js
  normalizePath → delegate IfluxNormalizePath

navigation-context.js
  IfluxNavigationContext API (in-memory store)

pnc-shell-bridge.js
  subscribe event — B1 handler empty (no createContext)

nginx inject order:
  resolver → normalize-path → navigation-context → pnc-shell-bridge → path-base
```

**Behavior change allowed by B1:** Incoming affiliate URL **giữ prefix trên address bar** (strip removed). Routing/assets **đọc canonical** qua `normalizePath`.

**Unchanged:** hrefFor · Routes.to prepend · auth · login · widgets · Share · SEO.

---

## 2. NavigationContext API

**Owner:** Shell (`IfluxNavigationContext` — `runtime/navigation-context.js`)

| Method | Contract |
|--------|----------|
| `createContext(opts)` | `{ ownerPublicId, source?, state?, createdAt?, transferred? }` → context clone · `null` if no owner |
| `getContext()` | Active context clone or `null` |
| `transferOwnership(selfPublicId, reason?)` | `'register' \| 'login'` · returns new context · **B1: not wired to auth** |
| `deactivateContext()` | Clears store |

**Object shape (ADR §4):**

```js
{
  ownerPublicId: 'IFL111',
  source: 'incoming-path',  // CONTEXT_SOURCES.*
  state: 'guest' | 'authenticated',
  createdAt: 1730000000000,
  transferred?: { fromPublicId, at, reason }
}
```

**B1:** API exists · **no caller** from bridge/auth (B2).

---

## 3. normalizePath contract

**Implementation:** `runtime/iflux-normalize-path.js`  
**Public readers:** `IfluxNormalizePath` · `IfluxRoutes.normalizePath` (delegate)

| Input | Output |
|-------|--------|
| `/IFL111/cong-dong` | `/cong-dong` |
| `/IFL9552M/co-phieu/HPG` | `/co-phieu/HPG` |
| `/cong-dong` | `/cong-dong` |
| `/IFL111/` | `/` |
| `/` | `/` |

**Edge cases:**

- Case-insensitive publicId segment (`ifl111` → strip)
- Query/hash stripped before segment parse
- Trailing slash normalized before strip
- Non-IFL first segment unchanged (`/Admin_Design_system/...`)
- **Pure:** no `location` · no `history` · no context mutation

**AC-10:** PASS (contract + delegation wired)

---

## 4. Resolver boundary

| | Before | After |
|---|--------|-------|
| `replaceState` | ✅ strip | ❌ **removed** |
| `location.replace` | ❌ | ❌ |
| Attribution cookie | ✅ | ✅ |
| Initial Context Event | ❌ | ✅ `iflux-incoming-referrer` |
| Knows PNC/Guest/Auth | N/A | ❌ |

---

## 5. Evidence — grep

```bash
# replaceState removed from resolver
rg 'replaceState|stripToCanonical|location\.replace' User_Web/iflux-web-ui/runtime/affiliate-resolver.js
# → 0 matches

# B1 bridge does not activate
rg 'createContext\(' User_Web/iflux-web-ui/runtime/pnc-shell-bridge.js
# → comment only (B2)

# Single reader delegation
rg 'IfluxNormalizePath' User_Web/iflux-web-ui/path-base.js User_Web/iflux-web-ui/iflux-routes.js User_Web/iflux-web-ui/iflux-platform-boot.js
# → all delegate
```

---

## 6. PASS B1 checklist

| Item | Status |
|------|--------|
| Single URL Reader (`normalizePath` pure + wired) | ✅ |
| Single Context Owner (Shell module only) | ✅ |
| Resolver event-only (no URL writer) | ✅ |
| Shell subscribe (no activate B1) | ✅ |
| normalizePath pure | ✅ |
| AC-10 contract | ✅ |
| ❌ prepend URL | ✅ not touched |
| ❌ auth/login/register/logout | ✅ not touched |
| ❌ hrefFor / Routes.to / widgets / Share / SEO | ✅ not touched |
| ❌ session persistence / transferOwnership wiring | ✅ not touched (B2) |

---

## 7. Files changed

| File | Action |
|------|--------|
| `runtime/iflux-normalize-path.js` | **CREATE** |
| `runtime/navigation-context.js` | **CREATE** |
| `runtime/pnc-shell-bridge.js` | **CREATE** |
| `runtime/affiliate-resolver.js` | strip removed · emit event |
| `path-base.js` | delegate normalize |
| `iflux-routes.js` | delegate normalize |
| `iflux-platform-boot.js` | delegate normalize |
| `infra/nginx-iflux-production-locations.conf` | inject order B1 |

---

## 8. Next — B2 only

- Bridge `onIncomingReferrer` → `createContext`
- `transferOwnership` on register/login
- Context lifetime persist
- Exclusion Zone returnTo
- popstate AC-11–13

**B1 CLOSED — không merge B2 trong cùng deploy slice.**

---

## 9. Deploy (Production)

| Step | Status |
|------|--------|
| JS + nginx inject B1 | ✅ 2026-07-27 |
| Cloudflare purge | ✅ |
| Verify HTML | `affResB1` · `iflux-normalize-path` · `navigation-context` · `pnc-shell-bridge` on https://iflux.vn |

---

## 10. Rollback Plan (B1 Foundation)

> Mọi foundation change phải có kế hoạch quay lui — không imply sẽ rollback ngay.

### Trigger (khi nào cân nhắc rollback)

- `normalizePath` regression (assets 404 trên `/IFL…/` paths)
- Resolver event breaks attribution capture
- Production incident truy vết về B1 inject chain

### Steps

```text
1. nginx sub_filter — restore P2 inject (resolver + path-base only):
   affiliate-resolver.js?v=affResP2_20260725
   path-base.js?v=zombieKill20260724
   (remove: iflux-normalize-path · navigation-context · pnc-shell-bridge)

2. Git restore files:
   - runtime/affiliate-resolver.js  (re-add stripToCanonical nếu cần hành vi P2)
   - path-base.js · iflux-routes.js · iflux-platform-boot.js  (bỏ IfluxNormalizePath delegate)
   - DELETE runtime/iflux-normalize-path.js
   - DELETE runtime/navigation-context.js
   - DELETE runtime/pnc-shell-bridge.js

3. rsync Production /var/www/iflux/production/User_Web/...

4. nginx -t && systemctl reload nginx

5. Cloudflare purge_cache (full zone)

6. Verify: /IFL111/cong-dong → strip bar (P2) hoặc clean per restored resolver
```

### Rollback không đụng

- ADR-AFF-007 (giữ APPROVED — rollback code ≠ revert ADR)
- Phase A transport (Share Foundation · loyalty path parse)

---

## 11. B2 Entry Gate

**Chi tiết:** [`21-B2-Lifecycle-Scope-Lock.md`](21-B2-Lifecycle-Scope-Lock.md)

| # | Condition | B1 status |
|---|-----------|-----------|
| E1 | B1 PASS | ✅ |
| E2 | Resolver no URL mutation | ✅ grep 0 |
| E3 | normalizePath production | ✅ |
| E4 | Shell bridge exists | ✅ |
| E5 | NavigationContext API stable | ✅ |
| E6 | Single Reader wired | ✅ (legacy whitelist documented) |
| E7 | ADR APPROVED | ✅ |
| E8 | State Transition Matrix | ✅ `19-PNC-State-Transition-Matrix.md` |

**→ B2 OPEN** (documentation gate · chờ Owner GO code)

---

## 12. B2 Scope Lock (summary)

### ✅ B2 allowed

`activateGuestContext()` · `transferOwnership()` · `deactivateContext()` · session persistence · `returnTo` · popstate · lifecycle hooks (Auth trigger → Shell API)

### ❌ B2 forbidden → B3+

prepend URL toàn site · `hrefFor()` · `Routes.to()` · Header · Sidebar · Widget · Breadcrumb · Search · Share · SEO

---

## 13. B2 PASS Gate (minimum — **state only**, rev.2)

| ID | Scenario | B2 verify (`getContext`) | B3 verify (URL) |
|----|----------|--------------------------|-----------------|
| **G1** | Owner IFL111 → nav/reload/back/forward | owner = IFL111 | bar/links IFL111 |
| **G2** | IFL111 → register → IFL999 → reload | owner = IFL999 | bar IFL999 |
| **G3** | IFL111 → login → IFL999 | owner = IFL999 · referred_by | bar IFL999 |
| **G4** | IFL999 → logout → back | null · no resurrect | bar clean |
| **G5** | Exclusion OAuth | owner IFL999 · returnTo | bar IFL999 path |
| **G6** | IFL999 opens IFL222 link | owner stays IFL999 | nav Self prefix |

Full spec: [`19-PNC-State-Transition-Matrix.md`](19-PNC-State-Transition-Matrix.md) · [`21-B2-Lifecycle-Scope-Lock.md`](21-B2-Lifecycle-Scope-Lock.md)

---

**B1 status:** **PASS · CLOSED**  
**Next:** Owner GO → B2 implementation per scope lock
