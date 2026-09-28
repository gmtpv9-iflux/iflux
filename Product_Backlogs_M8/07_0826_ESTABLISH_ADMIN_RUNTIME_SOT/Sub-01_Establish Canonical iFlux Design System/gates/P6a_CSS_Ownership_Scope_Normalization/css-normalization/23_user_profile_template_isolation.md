# P6a — PAGE 01 User Profile — Step 2 Template Isolation

**Date:** 2026-08-28  
**Mode:** IMPLEMENT TEMPLATE ISOLATION ONLY  
**Baseline:** `USER_PROFILE_LEGACY_CLONE = PASS` · `b0e182d`  
**Verdict:** `USER_PROFILE_TEMPLATE_ISOLATED = PASS`

No CSS mapping. No class canonicalization. No Chat changes. Token layer untouched.

---

## A. AppShell DOM removed

From `design_system/references/patterns/user-profile/index.html`:

| Removed | Notes |
|---|---|
| `.ix-root` | Admin page wrapper |
| `.ix-layout` | Sidebar + main flex lock |
| `aside.ix-sidebar` | Admin nav + brand + Patterns menu |
| `header.ix-navbar` | Search, bell, navbar `VM` avatar |
| Injected theme toggle | No `.ix-nav-actions` host |
| Injected notification bell | No navbar mount point |
| `main.ix-main` | Sidebar offset column |

Runtime check: clone has `sidebar/navbar/notif/theme = false`. Legacy still has all four.

---

## B. Profile DOM retained

Minimal frame: one `.ix-content` (existing Legacy content pad `30px` — not a new layout).

Kept exactly:

- `h1` Chi tiết người dùng
- breadcrumb Hub / ADM-USR-002 · User Detail
- `.ix-profile-grid`
- `.ix-profile-sidebar` column (profile content, not Admin nav)
- hero / avatar / name / Pro Member / stats / Details
- Plan card, Referral card
- tabs Account / Activity / Affiliate / Security
- all tab panels, table, forms, actions
- `#editModal` and all modal fields

---

## C. CSS removed

Provably AppShell-only rules deleted from `user-profile.css`:

- `.ix-root`
- `.ix-layout` and all `.ix-sidebar-collapsed` variants
- `.ix-sidebar` (+ scrollbar)
- `.ix-brand` / `.ix-brand-logo` / `.ix-brand-name`
- `.ix-main`
- `.ix-overlay` / mobile sidebar media query
- `.ix-navbar`
- `[data-ix-admin-page-host]`
- `.ix-menu*` / `.ix-menu-item--muted` / `.ix-menu-badge`
- `.ix-search*`
- `.ix-nav-actions` / `.ix-nav-btn` / `.ix-nav-dot`
- `.ix-avatar` / `.ix-avatar-online` (navbar only; profile uses `.ix-profile-avatar`)
- `html, body { height: 100%; overflow: hidden }` — AppShell viewport lock (would clip the isolated page)

---

## D. CSS retained

- Full Legacy token / typography / spacing / component dump except the blocks above
- `.ix-content` (minimal frame)
- All `.ix-profile-*`, cards, chips, buttons, table, tabs, modal, forms
- `--ix-sidebar-w` custom properties left in the token dump (unused; not tree-shaken)
- Unused helpers such as `.ix-layout-main` left (unsure → keep)

No Canonical remapping. No `.ifx-*` rename.

---

## E. JS removed

- Admin sidebar toggle + sidebar scroll restore
- `iflux-admin-notifications.js` + loader
- `iflux-theme.js` (navbar sun/moon injection)
- Ctrl+K → `.ix-search` focus
- `IfluxAdminAuth.patchNavbarAdmin`
- Environment chip rewriter for `.ix-nav-actions`

---

## F. JS retained

- `ixToast` (Suspend / Upgrade / Save / copy)
- `PatternUserProfile` tabs / modal / copy-ref
- Table search + `#aff-table` pagination
- Generic modal ESC, ripple, progress, table sort (not refactored)

---

## G. External dependencies remaining

| Asset | Why |
|---|---|
| `/Admin_Design_system/iflux-admin-ui/fonts.css` + BeVietnamPro woff2 | Same typeface as Legacy template |
| `/Admin_Design_system/iflux-admin-ui/vendor/tabler-icons/tabler-icons.min.css` | Same glyphs |

Head theme script still applies `data-theme` from localStorage. It does not inject a toggle.

---

## H. Profile-content parity

Compare Legacy `.ix-content` + `#editModal` vs isolated Reference same subtree.

| Check | Legacy | Clone | Result |
|---|---|---|---|
| Text nodes | 235 | 235 | `TEXT_MISMATCH = 0` |
| Icons | 27 | 27 | `ICON_MISMATCH = 0` |
| `a[href]` in subtree | 1 (Hub) | 1 | match |
| Profile column | 300 × 1435.95 | 300 × 1435.95 | 0 |
| Avatar | 90 × 90, fs 22.5, fw 800 | same | 0 |
| Name | 133.58 × 25.31 | same | 0 |
| Hero pad | 40 24 28 | same | 0 |
| First card | 300 × 681.59, r 8 | same | 0 |
| Tabs height / gap | 31 / 3.75 | same | 0 |
| Content pad | 30px | 30px | 0 |
| Modal inner | 520 × 534.72 | 520 × 534.72 | 0 |
| `html` font-size | 15px | 15px | 0 |
| overflow-x | 0 | 0 | 0 |
| 768 / 390 text/icon | 0 mismatch | 0 mismatch | PASS |
| Tabs + modal open/close | — | PASS | `PROFILE_BEHAVIOR_MISMATCH = 0` |

**Intentional (removed Admin shell only):**

| Delta | Cause |
|---|---|
| `dx = -260` | Admin sidebar 260px gone |
| `dy = -64` | Admin navbar 64px gone |
| `dw = +260` on h1 / breadcrumb / tabs / grid | Content well is now full viewport (1380 vs 1120 at 1440) |

Fixed-size template pieces did not change. `MATERIAL_PROFILE_VISUAL_MISMATCH = 0`.

`PROFILE_CONTENT_MISSING = 0`

---

## I. Changed files

| File | Action |
|---|---|
| `design_system/references/patterns/user-profile/index.html` | AppShell stripped; `.ix-content` + template + modal kept |
| `design_system/references/patterns/user-profile/user-profile.css` | AppShell-only rules removed |
| `design_system/references/patterns/user-profile/user-profile.js` | AppShell JS removed |
| this report | added |

Not touched: `design_system/references/patterns/chat/**`, token layer, Foundation, Primitive, Component, `reference-layers.css`.

---

## Gate

```
TEXT_MISMATCH = 0
ICON_MISMATCH = 0
PROFILE_CONTENT_MISSING = 0
PROFILE_BEHAVIOR_MISMATCH = 0
MATERIAL_PROFILE_VISUAL_MISMATCH = 0

USER_PROFILE_TEMPLATE_ISOLATED = PASS
```

Stopped. No CSS mapping. Chat blocked until Owner review.
