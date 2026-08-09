# Phase 4 · Step 3 — Implementation Change List

**Date:** 2026-07-29  
**Status:** DONE (local) · deploy Production theo quy tắc iFlux  
**Design:** [`07-Phase-04-Implementation-Design-Lifecycle-Authority.md`](07-Phase-04-Implementation-Design-Lifecycle-Authority.md) ACCEPT  

---

## Change List

| File | Action | Summary |
|------|--------|---------|
| `User_Web/iflux-web-ui/runtime/navigation-context.js` | Modify | +`replaceProjection` (mirror only; reject authenticated); clone `replaced`; comment Projection ≠ Authority |
| `User_Web/iflux-web-ui/runtime/pnc-lifecycle.js` | Modify | +`replaceGuestOwner` (BD-06); `onIncomingReferrer` Guest last-wins; giữ `isLoggedIn` skip (BD-08); syncBar sau transition |

**Không đụng:** `affiliate-resolver.js` · `auth.js` · Writer · Register AR.

---

## Behavior delta

| Transition | Before | After |
|------------|--------|-------|
| Guest A → enter B | first-touch giữ A | **replace → B** |
| Guest A→…→E | first-touch | **last-wins E** |
| Self + enter B | skip | skip (**BD-08** giữ) |
| Register/Login/Logout | AS-IS | AS-IS (+ syncBar) |

---

## Change List (amend — history sync)

| File | Action | Summary |
|------|--------|---------|
| `pnc-lifecycle.js` | Modify | `onPopState` Guest: re-parse Owner URL → `onIncomingReferrer` (V-T8 Back/Forward); logged-in giữ restore+Self |

---

## Behavior delta (amend)

| Transition | Before (Step 3) | After (Step 4 fix) |
|------------|-----------------|---------------------|
| Guest Back IFLB→IFLA | session restore có thể giữ B | Active = **A** từ URL Candidate |