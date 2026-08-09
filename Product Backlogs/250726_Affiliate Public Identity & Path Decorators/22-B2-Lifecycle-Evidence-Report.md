# B2 — Lifecycle Evidence Report

**Date:** 2026-07-27  
**Status:** **PASS** (lifecycle / Owner state — không B3 prepend)  
**Scope:** [`21-B2-Lifecycle-Scope-Lock.md`](21-B2-Lifecycle-Scope-Lock.md) rev.2 + transition contracts  
**Domain Object:** ADR rev.4.2 · Matrix §1 · §4 idempotency

---

## 1. Domain Object gate

| Rule | Implementation |
|------|----------------|
| Transitions only | `create` · `transfer` · `deactivate` (+ aliases) |
| Idempotent | same-owner `create` · same-self `transfer` · `deactivate(null)` no-op |
| Frozen export | `getContext()` → `Object.freeze(clone)` |
| Single gate | `pnc-lifecycle.js` → `IfluxNavigationContext` |
| CẤM direct mutation | No exported mutable reference |
| returnTo zone | `isReturnToAllowed()` — Application Zone only |

---

## 2. Architecture diff (B1 → B2)

```text
B1  bridge subscribe (noop) · API only

B2  pnc-lifecycle.js     — transition gate
    bridge → onIncomingReferrer → create (guest + not logged in)
    bridge replay deferred until after restoreSessionIfLoggedIn (G7)
    auth establishSession  → onSessionEstablished → transfer/create Self
    auth logout            → onLogout → deactivate
    requireAuth            → saveReturnTo (Application Zone only)
    sessionStorage persist — implementation detail
    popstate               → restore · no resurrect when logged out
```

**Không đụng:** `Routes.to` prepend · `hrefFor` · header · widgets · Share · SEO URL write

---

## 3. Files changed

| File | Change |
|------|--------|
| `runtime/navigation-context.js` | persist · returnTo zone filter · idempotent create/transfer/deactivate · freeze |
| `runtime/pnc-lifecycle.js` | lifecycle gate · deferred incoming replay · foreign owner guard |
| `runtime/pnc-shell-bridge.js` | wire lifecycle · `replayPendingIncoming` after auth restore |
| `auth.js` | trigger hooks only (`onSessionEstablished` · `onLogout` · `saveReturnTo`) |
| nginx inject | + `pnc-lifecycle.js` |
| ADR + Matrix + B2 Scope | §4.3 idempotency · returnTo zone · G7 · AC-14/15 |

---

## 4. PASS gate G1–G7 (state-only)

| Gate | B2 assertion |
|------|----------------|
| G1 | `getContext().ownerPublicId === IFL111` after nav/reload/back |
| G2 | After register → owner IFL999 · reload persists |
| G3 | Login → owner IFL999 · `referred_by` unchanged (server) |
| G4 | Logout → `getContext() === null` · back no resurrect |
| G5 | `getReturnTo()` set on auth entry (app zone only) · owner IFL999 after OAuth session |
| G6 | Logged-in open foreign link → owner stays Self |
| G7 | F5 on foreign URL while logged-in → owner stays Self (not foreign referrer) |

*Bar URL prepend: deferred **B3**.*

---

## 5. Transition contracts (verified in code)

| Contract | Code path |
|----------|-----------|
| `create(IFL111)` ×2 same owner | `createContext` early return if `activeContext.ownerPublicId === owner` |
| `transfer(IFL999)` when already IFL999 auth | `transferOwnership` early return |
| `deactivate()` when null | `deactivateContext` safe no-op |
| `setReturnTo('/dang-nhap')` | `isReturnToAllowed` → reject null |
| Foreign refresh G7 | `restoreSessionIfLoggedIn()` before `replayPendingIncoming()` |

---

## 6. Grep hygiene

```bash
rg 'Routes\.to\(|hrefFor' User_Web/iflux-web-ui/runtime/pnc-  # 0 prepend logic
rg 'location\.(replace|href)' User_Web/iflux-web-ui/runtime/pnc-lifecycle.js  # 0
rg 'createContext\(' User_Web/iflux-web-ui/runtime/pnc-shell-bridge.js  # 0 direct — via lifecycle
```

---

## 7. B3 Entry

B2 **CLOSED** — không mở rộng thêm (trừ hotfix).

B4 **GO** — Consumer Migration · [`26-B4-Consumer-Migration-Scope-Lock.md`](26-B4-Consumer-Migration-Scope-Lock.md)

---

**B2 CLOSED** · **B3 CLOSED** · B4 GO Wave 1
