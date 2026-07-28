# B2 — Lifecycle Scope Lock (Pre-Implementation)

**Date:** 2026-07-27 (rev.2 — B2/B3 dependency split)  
**Status:** **READY TO OPEN** — sau B1 PASS + Entry Gate  
**ADR:** [`18-ADR-AFF-007-Personal-Navigation-Context.md`](18-ADR-AFF-007-Personal-Navigation-Context.md)  
**Transition SoT:** [`19-PNC-State-Transition-Matrix.md`](19-PNC-State-Transition-Matrix.md)  
**Prerequisite:** [`20-B1-Foundation-Evidence-Report.md`](20-B1-Foundation-Evidence-Report.md) **PASS**

---

## B2 vs B3 — dependency split (rev.2)

| | **B2** | **B3** |
|---|--------|--------|
| **Verify** | Lifecycle · **Owner state** | **URL bar** · internal link prepend |
| **API** | `getContext().ownerPublicId` | `Routes.to()` · `hrefFor()` |
| **Sau login** | `Owner=IFL999` ✅ | bar `/IFL999/...` ✅ |

**B2 PASS không yêu cầu** mọi internal link đã prepend.  
**Trạng thái tạm chấp nhận:** `Owner=IFL999` · bar `/cong-dong` (clean) — đến khi B3 ship.

---

## B2 Entry Conditions

| # | Condition | Evidence |
|---|-----------|----------|
| E1 | **B1 PASS** | `20-B1-Foundation-Evidence-Report.md` §6 |
| E2 | **Resolver không còn URL mutation** | grep `replaceState` resolver → 0 |
| E3 | **`normalizePath` production** | iflux.vn inject `iflux-normalize-path.js` |
| E4 | **Shell bridge tồn tại** | `pnc-shell-bridge.js` |
| E5 | **NavigationContext API stable** | `navigation-context.js` · Matrix §3 |
| E6 | **Single Reader wired** | path-base · routes · platform-boot |
| E7 | **ADR-AFF-007 APPROVED** | rev.4 FINAL |
| E8 | **State Transition Matrix** | `19-PNC-State-Transition-Matrix.md` |

### Legacy pathname whitelist (B3/B4)

`affiliate-resolver` · `bootstrap detectPageKey` · nginx · auth helpers — xem B1 §11 E6 note.

---

## B2 Scope — LOCKED

### ✅ Được làm (Lifecycle / Owner state only)

| Capability | Mô tả |
|------------|--------|
| `activateContext()` / `createContext` | Incoming event → Owner=Referrer |
| `transferOwnership()` | Register/login → Owner=Self |
| `deactivateContext()` | Logout → Owner=none |
| **Persistence** | Owner survive reload/back/forward (mechanism = impl detail) |
| **`returnTo`** | Exclusion Zone · persist Owner |
| **`popstate`** | Owner không đổi trên back/forward (non-transition) |
| **Auth triggers** | Gọi Shell API — **không** raw app URL write |

### ❌ Forbidden → B3+

prepend URL · `hrefFor()` · `Routes.to()` prepend · Header · Sidebar · Widget · Breadcrumb · Search · Share · SEO

**Reject PR** nếu B2 diff chạm forbidden.

---

## B2 PASS Gate — Acceptance (state-only)

**Verify chính:** `IfluxNavigationContext.getContext().ownerPublicId` (hoặc Shell wrapper).

**Không verify B2:** internal link href prepend · `Routes.to()` output shape.

### G1 — Owner persist (IFL111)

```gherkin
Given  Owner IFL111 (user guest) · opened via /IFL111/cong-dong
When   in-app navigate → F5 reload → browser back → browser forward
Then   getContext().ownerPublicId = IFL111
```

*Bar prefix: B1 incoming may show IFL111 · B3 owns link prepend consistency.*

### G2 — Register transfer

```gherkin
Given  Owner IFL111
When   Register success · publicId IFL999
Then   getContext().ownerPublicId = IFL999
And    getContext().transferred.fromPublicId = IFL111
When   F5 reload
Then   ownerPublicId = IFL999
```

*Bar `/IFL999/...`: verify **B3** · B2 chỉ Owner.*

### G3 — Login account cũ

```gherkin
Given  Owner IFL111 · /IFL111/cong-dong
When   Login IFL999
Then   getContext().ownerPublicId = IFL999
And    referred_by không ghi đè (server · ADR-AFF-004)
```

### G4 — Logout + back (no resurrect)

```gherkin
Given  Owner IFL999
When   Logout
Then   getContext() = null
When   Browser Back
Then   getContext() = null (no resurrect)
And    ownerPublicId không = IFL999
```

*Bar clean: B3 strip behavior.*

### G5 — Exclusion + OAuth

```gherkin
Given  Owner IFL111 · returnTo=/cong-dong saved
When   Login/OAuth complete · IFL999
Then   getContext().ownerPublicId = IFL999
And    returnTo restored in Shell store
```

*Bar `/IFL999/cong-dong`: **B3**.*

### G6 — Foreign link (logged-in)

```gherkin
Given  Owner IFL999 (authenticated)
When   Direct open /IFL222/cong-dong
Then   getContext().ownerPublicId = IFL999
And    Owner KHÔNG đổi sang IFL222
```

*Nav bar Self prefix: **B3** · B2 chỉ Owner unchanged.*

### G7 — Foreign link refresh (logged-in)

```gherkin
Given  Owner IFL999 (authenticated)
When   Direct open /IFL111/bai-viet/a
Then   getContext().ownerPublicId = IFL999
When   F5 reload on same URL
Then   getContext().ownerPublicId = IFL999
And    Owner KHÔNG đổi sang IFL111
```

*Replay Initial Context Event sau session restore · không recreate guest context.*

---

## Transition contracts (B2)

| API | Contract |
|-----|----------|
| `create(same owner)` | no-op |
| `transfer(same self, authenticated)` | no-op |
| `deactivate()` when null | safe no-op |
| `setReturnTo` | chỉ Application Zone · reject Exclusion paths |

---

## B3 PASS Gate (preview — không thuộc B2)

| Case | Verify |
|------|--------|
| Owner IFL111 | `Routes.to('community')` → `/IFL111/cong-dong` |
| Owner IFL999 | internal links → `/IFL999/...` |
| After login | `replaceState` or nav → bar matches Owner |

---

## B2 Deliverables

1. `22-B2-Lifecycle-Evidence-Report.md`
2. Grep: bridge `createContext` · auth → `transferOwnership` / `deactivateContext`
3. **Zero** diff forbidden list
4. G1–G7 PASS (**state assertions only**)

---

## Gate decision

| | |
|---|---|
| **B2 OPEN?** | ✅ YES (E1–E8) |
| **Code start** | Owner GO B2 |

---

*Rev.2: Owner-centric PASS · B3 dependency removed from B2 gate.*
