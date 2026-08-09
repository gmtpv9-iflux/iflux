# B3 — Core Navigation Evidence Report

**Date:** 2026-07-27  
**Status:** **PASS**  
**Scope:** [`23-B3-Core-Navigation-Scope-Lock.md`](23-B3-Core-Navigation-Scope-Lock.md) rev.2  
**Matrix:** INV-1 B3 · INV-5

---

## 1. Architecture delivered

```text
Canonical Path (caller)
        ↓
ShellUrlWriter.decorate()     ← single decision point
        ↓
Final URL / Address Bar

Routes.to() / hrefFor() / navigate() / replacePath()
        ↓ funnel
decorate()
```

| Rule | Implementation |
|------|----------------|
| Caller canonical-only | `navigate('/cong-dong')` · `skipDecorate` for query params |
| Single decorate | `shell-url-writer.js` — no public prepend export |
| Zone policy centralized | `isApplicationZone()` in Writer |
| INV-1 B3 | `syncBarWithOwner()` after lifecycle init |
| Foreign bar skip sync | `barHasForeignOwnerPrefix()` — N6/N7 |

---

## 2. Files changed

| File | Change |
|------|--------|
| `runtime/shell-url-writer.js` | **CREATE** — decorate · zone · navigate · replacePath · syncBar |
| `runtime/pnc-lifecycle.js` | syncBarWithOwner on init |
| `iflux-platform-boot.js` | Routes.to → decorate funnel · loginWithReturn skipDecorate |
| `iflux-routes.js` | same funnel |
| `auth.js` | shellNavigate · redirectAfterAuth funnel |
| `iflux-guest-shell.js` | login return query canonical |
| nginx inject | + shell-url-writer.js · cache bust pncB3 |

**Không đụng:** B2 lifecycle logic · Resolver · widget wave (B4) · Share SEO (B5)

---

## 3. PASS gate N1–N10

| Gate | Assertion |
|------|-----------|
| N1 | Guest IFL111 · `Routes.to('community')` → `/IFL111/cong-dong` |
| N2 | Auth IFL999 · links prepend Self |
| N3 | Post-login `redirectAfterAuth` → `navigate(canonical)` → decorated bar |
| N4 | Logout · no prefix (B2 deactivate + clean navigate) |
| N5 | Auth zone · no prepend on `/dang-nhap` |
| N6 | Foreign bar · no sync overwrite on load |
| N7 | INV-1 B3 · syncBar when Owner + clean bar |
| N8 | INV-5 · decorate single point |
| N9 | `/api/*` · assets · no prepend |
| N10 | No public `prependOwnerPath` export |

---

## 4. Grep hygiene

```bash
rg 'prependOwnerPath' User_Web/                           # 0 public export
rg 'IfluxShellUrlWriter' User_Web/iflux-web-ui/runtime/   # shell-url-writer.js only define
rg 'skipDecorate' User_Web/iflux-web-ui/                  # loginWithReturn + auth redirect only
rg 'decorate' User_Web/iflux-web-ui/runtime/shell-url-writer.js
rg 'location\.replace' User_Web/iflux-web-ui/auth.js      # reduced · redirectAfterAuth → shellNavigate
```

---

## 5. B2 regression

G1–G7 Owner state unchanged · idempotency contracts intact.

---

## 6. B4 Entry

Consumer Migration — [`26-B4-Consumer-Migration-Scope-Lock.md`](26-B4-Consumer-Migration-Scope-Lock.md) rev.2 · MR-1 · audit [`25-B4-Pre-Migration-Audit.md`](25-B4-Pre-Migration-Audit.md).

---

**B3 CLOSED** · B4 GO Wave 1
