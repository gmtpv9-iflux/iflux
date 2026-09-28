# P6a — PAGE 01 User Profile — Legacy Exact Clone

**Date:** 2026-08-28  
**Mode:** DESTRUCTIVE REBUILD / FORENSIC CLONE  
**Canonical URL:** `/design_system/references/patterns/user-profile/`  
**Verdict:** `USER_PROFILE_LEGACY_CLONE = PASS`

Chat was not opened. Token layer was not touched. No Foundation / Primitive / Component / Pattern / Module classification was performed.

---

## A. Legacy source files used

| Role | Path |
|---|---|
| HTML SoT | `Admin_Design_system/patterns/user-profile.html` |
| CSS bundle entry | `Admin_Design_system/iflux-admin-ui/iflux-admin-ui.css` (imports only — contents inlined) |
| CSS copied | `primitives/color.css`, `radius.css`, `shadow.css`, `motion.css`, `z-index.css`, `layout.css` |
| | `semantic/theme.css`, `business-tokens.css`, `aliases.css` |
| | `typography.css`, `spacing.css`, `foundation/heart-action.css` |
| | `components.css`, `atoms-extensions.css`, `utilities.css` |
| JS copied | `iflux-admin-ui.js` |
| | `iflux-admin-notifications.js` (Legacy loads this dynamically from `iflux-admin-ui.js`) |
| | `pattern-user-profile.js` |
| | `iflux-theme.js` |

---

## B. New three-file structure

```
design_system/references/patterns/user-profile/
├── index.html
├── user-profile.css
└── user-profile.js
```

Deleted: `design_system/references/patterns/user-profile/page.js` (previous Canonical page JS).

No page CSS was added to `reference-layers.css`, Foundation, Primitive, Component, Pattern, or Module layers.

---

## C. HTML extraction notes

- Body DOM is a literal copy of Legacy. The only body difference after stripping `<script>` is one trailing blank line before the script block.
- All 156 `style=` attributes were **kept inline**. None were extracted. Accuracy over cleanliness.
- Demo text, hrefs, IDs, `data-*`, icons, tab/modal markup unchanged.
- Head wiring only:
  - Legacy: `fonts.css` + `iflux-admin-ui.css` (which `@import`s Tabler).
  - Clone: `fonts.css` + Tabler asset link + `user-profile.css`.
- Scripts collapsed to `user-profile.js` + `PatternUserProfile.init();`.

---

## D. CSS extraction notes

- Full Legacy Admin UI CSS dump concatenated into `user-profile.css` (~148 KB).
- Values remain Legacy `--ix-*` / rem. **Not** remapped to Canonical `--ifx-*` tokens.
- `html { font-size: body-md }` from Legacy `components.css` is included → root `15px` (matches Legacy computed rem).
- No Canonical `design_system/foundation/*`, primitives, components, or `reference-layers.css` are linked.

---

## E. JS extraction notes

- `iflux-admin-ui.js` looks up `script[src*="iflux-admin-ui.js"]` to load notifications. That path does not exist on the clone, so `iflux-admin-notifications.js` is **inlined** in `user-profile.js`.
- Runtime result is the same injected navbar bell + dropdown as live Legacy.
- `iflux-theme.js` still injects the sun/moon toggle into `.ix-nav-actions` (same as live Legacy).
- Profile behavior copied as-is: tabs (`data-ix-profile-tab`), modal open/close/overlay, copy-ref, `ixToast` on inline onclick, table search/paginate for `#aff-table`.
- No Canonical `Ifx*` abstractions. No invented JS.

---

## F. External asset dependencies

| Asset | Why |
|---|---|
| `/Admin_Design_system/iflux-admin-ui/fonts.css` + `fonts/BeVietnamPro-400.woff2` | Legacy typeface. `url()` paths must stay on the Admin font folder. |
| `/Admin_Design_system/iflux-admin-ui/vendor/tabler-icons/tabler-icons.min.css` | Legacy glyphs. Same icon font as Legacy. |

These are asset dependencies only. They do not alter Legacy rendering.

---

## G. Exact text parity

| | Legacy | Clone |
|---|---|---|
| Visible text nodes (1440 / 768 / 390) | 255 | 255 |

`TEXT_MISMATCH = 0`  
Sequential list and set comparison: empty diff.

---

## H. Icon parity

| | Legacy | Clone |
|---|---|---|
| `i.ti` class lists | 45 | 45 |

`ICON_MISMATCH = 0`  
Same Tabler class names, including `ti-receipt` on the injected orders link.

---

## I. Link parity

| | Legacy | Clone |
|---|---|---|
| `a[href]` | 15 | 15 |

`LINK_MISMATCH = 0`  
Includes Hub, all sidebar pattern hrefs, `@violet.dev`, and `../subscription/transactions.html` from the notification footer.

Extra `<link>` in clone `<head>` is the Tabler stylesheet (not a page `<a>`).

---

## J. DOM parity

| Check | Result |
|---|---|
| IDs | identical (`ref-link`, `ref-code`, `tab-account`, `tab-activity`, `tab-affiliate`, `aff-table`, `tab-security`, `editModal`) |
| `data-*` inventory | identical |
| Tabs / modal / lists / rows | identical |
| Injected theme toggle + notif bell | present on both |

**Intentional differences (reported):**

1. Head CSS/JS srcs point at the three local files + font/icon assets.
2. Notifications JS is inlined instead of a second network request. Clone does not 404 `iflux-admin-notifications.js`. Live Legacy currently 404s that request if the dynamic loader races; both still mount the bell because Legacy eventually loads it and Clone inlines it.
3. One trailing blank line removed before `</body>` scripts.

`MISSING_LEGACY_CONTENT = 0`  
`UNAPPROVED_EXTRA_CONTENT = 0`

---

## K. Computed visual parity matrix (1440, dark)

| Region | Legacy | Clone | Δ |
|---|---|---|---|
| `.ix-layout` | 1440 × 1600 | 1440 × 1600 | 0 |
| `.ix-sidebar` | 260 × 1600 | 260 × 1600 | 0 |
| `.ix-main` | 1180 × 1600 @x260 | 1180 × 1600 @x260 | 0 |
| `.ix-content` | 1180 × 1536, pad 30 | same | 0 |
| `.ix-navbar` | 1180 × 64, pad 0 30, gap 11.25 | same | 0 |
| `.ix-profile-grid` | 1120 × 1435.95, gap 22.5 | same | 0 |
| `.ix-profile-sidebar` | 300 × 1435.95 | same | 0 |
| first `.ix-card` | 300 × 681.59, radius 8 | same | 0 |
| `.ix-profile-hero` | 298 × 329.19, pad 40 24 28 | same | 0 |
| `.ix-profile-avatar` | 90 × 90, fs 22.5, fw 800 | same | 0 |
| `.ix-profile-name` | 133.58 × 25.31, fs 16.875 | same | 0 |
| `.ix-profile-tabs` | 797.5 × 31, gap 3.75 | same | 0 |
| `h1` | 1120 × 42.19, fs 28.125, fw 700 | same | 0 |
| `#editModal` closed | display none | display none | 0 |
| `#editModal` open overlay | 1440 × 1600, flex | same | 0 |
| modal inner | 520 × 534.72 | 520 × 534.72 | 0 |
| `html` font-size | 15px | 15px | 0 |
| overflow-x | 0 | 0 | 0 |

Color / weight / padding matched on every measured node.

---

## L. Responsive result

| Viewport | overflow-x L/C | text / icon / href mismatch | grid / avatar / sidebar / name Δ |
|---|---|---|---|
| 1440 | 0 / 0 | 0 | 0 |
| 768 | 0 / 0 | 0 | 0 |
| 390 | 0 / 0 | 0 | 0 |

No horizontal overflow difference.

---

## M. Screenshots / visual comparison

Evidence:

`Product_Backlogs_M8/07_0826_ESTABLISH_ADMIN_RUNTIME_SOT/Sub-01_Establish Canonical iFlux Design System/gates/P6a_CSS_Ownership_Scope_Normalization/css-normalization/evidence/user-profile-clone/`

| Pair | pixelmatch (threshold 0.1) |
|---|---|
| legacy-1440.png vs clone-1440.png | **0 pixels** |
| legacy-768.png vs clone-768.png | **0 pixels** |
| legacy-390.png vs clone-390.png | **0 pixels** |
| legacy-modal.png vs clone-modal.png | **0 pixels** |

Same viewport, dark theme, same default Account tab (modal pair = Edit Profile open).

---

## N. Changed / deleted files

| File | Action |
|---|---|
| `design_system/references/patterns/user-profile/index.html` | rebuilt from Legacy |
| `design_system/references/patterns/user-profile/user-profile.css` | added (Legacy CSS dump) |
| `design_system/references/patterns/user-profile/user-profile.js` | added (Legacy JS dump) |
| `design_system/references/patterns/user-profile/page.js` | deleted |
| this report + evidence PNGs | added |

Not touched: `design_system/references/patterns/chat/**`, token source/generated CSS, Foundation, Primitive, Component, `reference-layers.css`.

---

## Behavior check

| Action | Result |
|---|---|
| Activity tab on / Account tab off | PASS |
| Account tab restore | PASS |
| Edit Profile modal open | PASS |
| Modal close | PASS |
| `window.ixToast` present | PASS |

`BEHAVIOR_MISMATCH = 0`

---

## Gate

```
TEXT_MISMATCH = 0
ICON_MISMATCH = 0
LINK_MISMATCH = 0
MISSING_LEGACY_CONTENT = 0
UNAPPROVED_EXTRA_CONTENT = 0
BEHAVIOR_MISMATCH = 0
MATERIAL_VISUAL_MISMATCH = 0

USER_PROFILE_LEGACY_CLONE = PASS
```

Stopped. Chat page is blocked until Owner review.
