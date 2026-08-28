# P6a — PAGE 01 User Profile — Step 3 Legacy → Canonical CSS Mapping Audit

**Date:** 2026-08-28  
**Mode:** AUDIT ONLY — no HTML / CSS / JS / token / Foundation / Primitive / Component edits  
**Baseline:** `USER_PROFILE_READY_FOR_CSS_MAPPING = YES` · `82a7586`  
**Target:** `design_system/references/patterns/user-profile/`

```
USER_PROFILE_MAPPING_AUDIT = COMPLETE
USER_PROFILE_READY_FOR_OWNER_CLASSIFICATION = YES
```

No new Primitive / Component / Module / Page / token names invented.

---

## Mapping law applied

A candidate is `CAN_MAP_EXISTING` only when **responsibility** and **required visual/behavior contract** both match.

Same px / same `display:flex` is not a map.

`PARTIAL` is never auto-mapped.

---

## A. Page structure inventory

| Region | Legacy classes / styles | Notes |
|---|---|---|
| PAGE FRAME | `html` `body` `.ix-content` | `.ix-content` = padding only (`--ifx-space-container`). Document scroll. |
| PAGE HEADER | bare `h1` · `.ix-breadcrumb.ix-mb-24` · `ti-chevron-right` inline 12px | No `.ix-h1`. Breadcrumb is `div` + `a` + `i` + `span`, not a list. |
| PROFILE LEFT COLUMN | `.ix-profile-sidebar` | Hard width **300px**. Not Admin sidebar. |
| Profile Card | `.ix-card.ix-mb-24` | Identity + details + actions. |
| Profile Hero | `.ix-profile-hero` | Centered column, pad `40px 24px 28px`. |
| Avatar | `.ix-profile-avatar` | **90×90**, 3px accent ring, `#fff` initials, `font-size-32`. |
| Name | `.ix-profile-name` | 18 / bold. |
| Role/meta | `.ix-chip.ix-chip-primary` + inline `font-size:11px` | “Pro Member”. |
| Metrics | `.ix-profile-stats` / `.ix-profile-stat*` | Full-bleed strip `margin:20px -24px`. |
| Detail group | anonymous `div` pad `0 20px 20px` · inline “Details” title · `.ix-detail-list` / `-label` / `-val` | Status uses chip. |
| Actions | `.ix-btn-primary` + `.ix-btn-outline` (danger color inline) | Edit inert. Suspend → `ixToast`. |
| Plan | `.ix-card.ix-plan-card` · `.ix-plan-price*` · `.ix-plan-feat` | 2px accent border. Progress is **inline**, not `.ix-progress`. |
| Referral | `.ix-card` · `.ix-stat-icon.accent` 32px · `.ix-label` · `.ix-ref-row` · `.ix-ref-input` · `.ix-layer-f0/f1/f2` | Copy via `data-ix-copy-ref`. |
| MAIN COLUMN | anonymous `div` `flex:1;min-width:0` | |
| Tabs | `.ix-profile-tabs` · `.ix-profile-tab.active` · `data-ix-profile-tab` | Loose pills, **solid accent** active. |
| Account | `#tab-account.ix-tab-content.active` · card · `.ix-label` + inline values | |
| Activity | `#tab-activity` · `.ix-act-timeline` · `.ix-act-item` · `.ix-act-dot.ix-stat-icon` | Horizontal list + 32px icon dots. **Not** a vertical marker timeline. |
| Affiliate | `#tab-affiliate` · `.ix-aff-summary` · `.ix-layer-info` · `.ix-layer-pill` · table · network cards | |
| Security | `#tab-security` · `.ix-form-group` · `.ix-input` · 2FA row | |
| Table | `.ix-table-toolbar` · `.ix-table-search` · `#aff-table.ix-table` · `.ix-user-cell` · `.ix-avatar-sm` | `data-ix-search` / `data-ix-paginate`. |
| Modal | **removed** (Step 2B) | Residual generic `.ix-modal*` dump remains in CSS only. |

---

## B. Inline-style inventory

**151** `style=` attributes. **74** unique `(tag + declaration)` signatures.

Disposition key: `CAN_MAP_EXISTING` · `PAGE_SPECIFIC` · `MODULE_SPECIFIC` · `MISSING_CANONICAL_CONTRACT` · `PURE_LAYOUT_VALUE` · `UNRESOLVED`

### B1. Unique signatures (covers all 151)

| # | Element | Exact inline | n | Role | Canonical candidate | Exact? | Disposition |
|---|---|---|---|---|---|---|---|
| IN01 | `i.ti-chevron-right` | `font-size:12px` | 1 | Breadcrumb sep icon size | none (icon size not a Primitive contract) | no | PURE_LAYOUT_VALUE |
| IN02 | `span.ix-chip` | `font-size:11px` | 8 | Compact chip (Pro Member / Active / Paid / Pending / Enabled) | `.ifx-chip` uses `--ifx-text-body-sm-size` | no | PAGE_SPECIFIC |
| IN03 | `div` | `padding:0 20px 20px` | 1 | Details block inset under hero | `.ifx-card-body` pad is 16/20/20 — top 0 is hero-adjacent | no | PAGE_SPECIFIC |
| IN04 | `div` | `font-size:14px;font-weight:600;color:var(--ix-text-primary);margin-bottom:12px` | 1 | “Details” group label | Foundation `h5`/`h6` wrong owner (nav/group vs heading). No group-title Primitive. | no | MISSING_CANONICAL_CONTRACT |
| IN05 | `div` | `display:flex;gap:10px;margin-top:16px` | 1 | Action pair row | `.ifx-inline-sm` gap is 8 not 10. `.ifx-stack` is column. | no | PURE_LAYOUT_VALUE |
| IN06 | `button.ix-btn-primary` | `flex:1` | 1 | Equal-width Edit | Button primitive has no fill-width | no | PURE_LAYOUT_VALUE |
| IN07 | `i.ti-edit` | `font-size:13px` | 1 | Button icon | none | no | PURE_LAYOUT_VALUE |
| IN08 | `button.ix-btn-outline` | `color:var(--ix-danger);border-color:var(--ix-danger);flex:1` | 1 | Danger outline Suspend | `.ifx-btn-danger` is **filled**. No outline-danger. | no | MISSING_CANONICAL_CONTRACT |
| IN09 | `div` | `display:flex;justify-content:space-between;align-items:center;margin-bottom:16px` | 1 | Plan header row | Card header is close but this is inside body | no | PAGE_SPECIFIC |
| IN10 | `i.ti-check` | `color:var(--ix-accent);font-size:14px` | 4 | Plan feature icon | none | no | PAGE_SPECIFIC |
| IN11 | `div` | `margin:16px 0 8px` | 1 | Billing block rhythm | none | no | PURE_LAYOUT_VALUE |
| IN12 | `div` | `display:flex;justify-content:space-between;font-size:12px;color:var(--ix-text-muted);margin-bottom:6px` | 1 | Billing cycle KV | not Stat, not Form | no | PAGE_SPECIFIC |
| IN13 | `span` | `color:var(--ix-text-primary);font-weight:600` | 1 | “26 / 30 days” | none | no | PAGE_SPECIFIC |
| IN14 | `div` | `height:6px;background:rgba(105,108,255,.2);border-radius:3px;overflow:hidden` | 1 | Progress track | `.ifx-progress` height `--ifx-space-8` (8px), radius full, bg `--ifx-bg-input` | no | PARTIAL → PAGE_SPECIFIC |
| IN15 | `div` | `width:87%;height:100%;background:var(--ix-accent);border-radius:3px` | 1 | Progress fill | `.ifx-progress-bar` uses `--ifx-progress-value`, radius full | no | PAGE_SPECIFIC |
| IN16 | `div` | `font-size:11px;color:var(--ix-text-muted);margin-top:4px` | 1+ | Caption (“4 days remaining” and table sublines) | Foundation `small` is caption-sm token, not 11px | no | PAGE_SPECIFIC |
| IN17 | `button.ix-btn-primary` | `width:100%;margin-top:8px` | 1 | Full-width Upgrade | Button has no block variant | no | PURE_LAYOUT_VALUE |
| IN18 | `i` (arrow/copy/cash/edit/download) | `font-size:12px` or `13px` | many | Button icons | none | no | PURE_LAYOUT_VALUE |
| IN19 | `div` | `display:flex;align-items:center;gap:8px;margin-bottom:4px` | 1 | Referral title row | `.ifx-inline-sm` gap 8 — **layout only**, not title contract | no | PURE_LAYOUT_VALUE |
| IN20 | `div.ix-stat-icon` | `width:32px;height:32px;font-size:14px` | 7 | Compact icon well (referral + activity) | `.ifx-stat-icon` = touch-target (~40–44) | no | PAGE_SPECIFIC |
| IN21 | `div` | `font-size:14px;font-weight:600;color:var(--ix-text-primary)` | 3 | Card/section titles without `.ix-card-title` | Title primitive does not define heading size | no | PAGE_SPECIFIC |
| IN22 | `div` | `font-size:12px;color:var(--ix-text-muted);margin-bottom:14px` | 1 | Referral subtitle | Title `> p` is body-sm | no | PAGE_SPECIFIC |
| IN23 | `div.ix-ref-row` | `margin-bottom:12px` | 1 | Space between link/code rows | Stack would change parent | no | PURE_LAYOUT_VALUE |
| IN24 | `input.ix-ref-input` | `font-size:15px;font-weight:700;letter-spacing:2px;text-align:center` | 1 | Referral **code** display | Input primitive has no code/emphasis variant | no | MODULE_SPECIFIC |
| IN25 | `div` | `margin-top:14px;padding:10px 12px;background:rgba(105,108,255,.07);border-radius:var(--ix-radius);font-size:12px;…` | 1 | Commission explainer box | not Alert (no icon-row contract), not Chip | no | MODULE_SPECIFIC |
| IN26 | `i.ti-info-circle` / `strong` | `color:var(--ix-accent\|success\|warning)` | 5 | Emphasis in explainer | none | no | MODULE_SPECIFIC |
| IN27 | `div` | `margin-top:6px;display:flex;flex-direction:column;gap:3px` | 1 | Layer list | `.ifx-stack-sm` gap is 12 not 3 | no | PURE_LAYOUT_VALUE |
| IN28 | `div` | `flex:1;min-width:0` | 1 | Main column | Foundation Grid `col` is 12-col, not leftover flex | no | PAGE_SPECIFIC |
| IN29 | `i` (tab icons) | `font-size:14px` | 4 | Tab icons | Tabs component does not size icons | no | PURE_LAYOUT_VALUE |
| IN30 | `div.ix-card-header` | `justify-content:space-between` | 1 | Header already space-between in CSS | redundant | yes (already in `.ix-card-header`) | CAN_MAP_EXISTING |
| IN31 | `div` | `display:grid;grid-template-columns:1fr 1fr;gap:20px` | 1 | Account field grid | `.ifx-form-row` is 1col / md 2col **16px** gap, not 20 | no | PARTIAL → PAGE_SPECIFIC |
| IN32 | `div` | `font-size:14px;color:var(--ix-text-primary);font-weight:500;padding:8px 0` | 5 | Account field value | `.ifx-field-value` = sm/medium/primary, **no 8px pad**, size is sm not 14 | no | PARTIAL → PAGE_SPECIFIC |
| IN33 | `div` | `font-size:14px;color:var(--ix-accent);font-weight:500;padding:8px 0` | 1 | Username as accent value | `.ifx-field-value` is primary only | no | PAGE_SPECIFIC |
| IN34 | `div` | `font-size:13px;color:var(--ix-text-secondary);padding:8px 0;grid-column:span 2;line-height:1.6` | 1 | Bio | `.ifx-field-value` + span 2 | no | PAGE_SPECIFIC |
| IN35 | `div` | `flex:1` | 6 | Activity item text column | Timeline body is not flex sibling | no | PAGE_SPECIFIC |
| IN36 | `div.ix-card` | `padding:0` | 1 | Affiliate summary card flush | Card body padding would fight | no | PAGE_SPECIFIC |
| IN37 | `div.ix-aff-sum-val` | `color:var(--ix-warning)` / `var(--ix-accent)` | 2 | Colored KPI | Stat value has no tone variants in CSS beyond default | no | MODULE_SPECIFIC |
| IN38 | `span` | `font-size:12px;color:var(--ix-text-muted);font-weight:500` | 1 | “Commission rates:” | none | no | MODULE_SPECIFIC |
| IN39 | `div` | payout bar flex + border-bottom | 1 | Withdrawal row | Action Bar exists but different contract | no | MODULE_SPECIFIC |
| IN40 | `div.ix-table-search` | `margin:0` | 1 | Kill default search margin | Search has no toolbar margin contract | no | PAGE_SPECIFIC |
| IN41 | `td` | product 13px / price 600 / rate color / commission 700 / date muted | 30 | Table cell semantics | Table td has no tone utilities | no | MODULE_SPECIFIC |
| IN42 | `div.ix-card` | `margin-top:24px` | 1 | Network card spacing | `.ix-mb-24` already exists; Stack would replace | no | PURE_LAYOUT_VALUE |
| IN43 | `div` | `display:grid;grid-template-columns:repeat(3,1fr);gap:16px;text-align:center` | 1 | F0/F1/F2 network | 12-col Grid is different semantics | no | MODULE_SPECIFIC |
| IN44 | `div` (3 cards) | tinted bg + 1px border + radius-lg + pad 20 | 3 | Layer KPI tiles | not Card (no `.ifx-card` surface), not Stat | no | MODULE_SPECIFIC |
| IN45 | `div` | uppercase 11/700/tracking .5px layer titles | 3 | Layer headings | not Overline utility (none in Foundation) | no | MODULE_SPECIFIC |
| IN46 | `div` | `font-size:32px;font-weight:800` | 3 | Layer member count | not Stat value (xl/bold, not 32/800) | no | MODULE_SPECIFIC |
| IN47 | `hr` | `border-color:var(--ix-border);margin:10px 0` | 3 | Tile divider | Foundation has no `hr` rule | no | PURE_LAYOUT_VALUE |
| IN48 | `div` | security form column `flex-direction:column;gap:16px;max-width:480px` | 1 | Password form width | Form has no max-width | no | PAGE_SPECIFIC |
| IN49 | `div` | 2FA row space-between wrap gap 12 | 1 | Setting row | previously rejected as generic info-row | no | PAGE_SPECIFIC |
| IN50 | `div` | 2FA title 14/600 + hint 13 muted | 1 | Setting copy | Title primitive `> p` is muted sm | no | PAGE_SPECIFIC |

IN30 is the only inline that duplicates an existing consumed rule (card-header already `justify-content:space-between`).

---

## C. Consumed Legacy CSS inventory

**Rule blocks parsed:** 690  
**Unique selectors that can match this page:** **135**  
**Unique selectors with no page class:** **515** (Admin dump)

Consumed groups (actual code in §K):

| Group | Selectors | Responsibility |
|---|---|---|
| Document | `html, body`, `*`, `:root` | Font, rem, colors, aliases |
| Frame | `.ix-content` | Page pad |
| Type utilities in dump | `.ix-card-title`, `.ix-label`, `.ix-btn`, `.ix-table th/td` (typography.css aliases) | Shared type |
| Breadcrumb | `.ix-breadcrumb`, `a`, `a:hover` | Trail |
| Card | `.ix-card`, `-header`, `-body` | Surface |
| Chip | `.ix-chip`, `-primary`, `-success`, `-warning` | Status / plan |
| Button | `.ix-btn`, `-primary`, `-outline`, `-success`, `-sm` | Actions |
| Form | `.ix-form-group`, `.ix-label`, `.ix-input`, focus, placeholder, readonly | Security + referral inputs |
| Table | `.ix-table*`, `.ix-table-toolbar`, `.ix-table-search`, `.ix-user-cell`, `.ix-user-name`, `.ix-avatar-sm` + tone | Affiliate table |
| Pagination dump | `.ix-page-btn.active` | JS injects `.ix-pagination` / `.ix-page-btn` |
| Stat icon | `.ix-stat-icon` + tones | 32px override inline |
| Profile module | `.ix-profile-*`, `.ix-detail-*`, `.ix-plan-*`, `.ix-ref-*`, `.ix-layer-*`, `.ix-aff-*`, `.ix-act-*`, `.ix-tab-content` | Template |
| Utility | `.ix-mb-24` | 24px below cards / breadcrumb |

---

## D. Token mapping

Do **not** create tokens. Hardcoded residual ≠ token debt.

| Legacy value/var | Role | Canonical candidate | Exact? | Safe mapping? |
|---|---|---|---|---|
| `--ix-accent` → `--color-action-primary` | Brand fill / ring | `--ifx-action-primary` (dark: `--ifx-color-violet-500` `#696cff`) | likely same hue if alias chain intact | **UNRESOLVED** until computed alias audit on this page without Admin theme.css |
| `--ix-bg-card` | Card surface | `--ifx-bg-surface` | likely | UNRESOLVED (same) |
| `--ix-text-primary` / `-secondary` / `-muted` | Text | `--ifx-text-*` | likely | UNRESOLVED |
| `--ix-border` | Hairline | `--ifx-border-default` | likely | UNRESOLVED |
| `--ix-success` / `-warning` / `-danger` | Feedback | `--ifx-success` etc. | dark success is **lime-500** in Canonical themes — Legacy `--ix-success` may differ | UNRESOLVED |
| `--ix-radius` / `--ix-radius-lg` | Radii | `--ifx-radius-button` / `--ifx-radius-card` | semantic yes | SEMANTIC_EQUIVALENT |
| `--ifx-space-*` / `--ifx-inset-*` / `--ifx-font-size-*` already in dump | Spacing / type | Canonical generated tokens **same names** | yes if dump copies source | CAN_MAP_EXISTING (already Canonical names inside Legacy file) |
| `--ifx-space-container` on `.ix-content` | Page gutter | Foundation `layout.css` owns this var | yes | CAN_MAP_EXISTING (var only; class `.ix-content` ≠ `.ifx-container`) |
| `html, body { font-size: var(--ifx-text-body-md-size) }` | **Rem root ~15px** | Foundation: `html { font-size: 100% }` **forbids** body-md on html | **no** | UNRESOLVED — changing rem changes every rem on this page |
| `rgba(105,108,255,.07/.2)` | Violet wash | `--ifx-alpha-violet-16` is 0.16 not 0.07/0.20 | no | PURE_LAYOUT_VALUE / do not new-token |
| `90px` avatar | Hero identity | `--ifx-size-avatar-lg` is not 90 | no | PAGE_SPECIFIC not a token |
| `300px` column | Profile rail | no size token | no | PAGE_SPECIFIC |
| `#fff` on avatar initials | On-primary | `--ifx-text-on-primary` | likely | SEMANTIC_EQUIVALENT |
| `36px` / `800` plan price | Price display | no Canonical price class on this page | no | PAGE_SPECIFIC |

**Safe token statement:** many `--ifx-*` **names** already appear in the dump. Replacing `--ix-*` with `--ifx-*` is **not** proven EXACT until this page loads **only** Canonical `tokens/generated` + theme (not Admin `theme.css` aliases). Treat `--ix-*` → `--ifx-*` as **UNRESOLVED**.

---

## E. Foundation mapping

| Need | Canonical | Verdict |
|---|---|---|
| Document font | `foundation/typography.css` `html`/`body` | **PARTIAL**. Legacy dump also sets `html, body { font-size: body-md }` (rem shrink). Foundation forbids that. |
| Page `h1` | Foundation `h1` | **PARTIAL**. Responsibility matches (document heading). This page has **no** `h1 {}` in `user-profile.css`. Computed 28.125px is rem-shrunk Admin scale, not Foundation 16px-root h1. Do not swap until rem contract is decided. |
| Anchor | `reset.css` `--ifx-text-link` | Breadcrumb `a` is secondary→accent hover, **not** generic link. **Do not** use Foundation `a`. |
| Lists | Foundation `ul` adds padding-left + `li+li` margin | `.ix-detail-list` / `.ix-act-timeline` reset list. Foundation default would **break** them. |
| Container | `.ifx-container` | Different: max/gutter system vs `.ix-content` pad-only. **NONE** as replacement. |
| Stack / Inline / Grid | `layout.css` | Valid **composition** for some anonymous flex/grid **only if** gap/direction match. Most page gaps are 10 / 20 / 3 — not stack tokens. |

---

## F. Primitive mapping

| Region | Canonical | Code | Verdict |
|---|---|---|---|
| Buttons | `primitives/button/button.css` `.ifx-btn*` | See §K M01 | **SEMANTIC_EQUIVALENT** chrome. Missing: outline-danger, `flex:1`, `width:100%`. |
| Chips | `primitives/chip/chip.css` `.ifx-chip*` | See §K M02 | **SEMANTIC_EQUIVALENT** minus inline 11px. |
| Avatar 90px | `primitives/avatar/avatar.css` `.ifx-avatar` / `-sm` / `-lg` | md/sm/lg tokens, **no 90px**, no 3px accent **ring**, default is soft-primary not solid accent | **NONE** for hero. |
| Table avatars | `.ifx-avatar-sm` + tone | 28-class Legacy `.ix-avatar-sm` vs token sm | **PARTIAL** (size token ≠ dump 28px unless equal). |
| Title | `primitives/title/title.css` | Only styles `> p` muted. Does **not** style the heading. | **NONE** for “Details” / card titles. |
| Progress | `primitives/progress/progress.css` | 8px track, token width | **PARTIAL** vs 6px / 87% inline. |
| Badge | `primitives/badge/badge.css` | not used; page uses Chip | n/a |
| Alert | used by Canonical Toast | not used as page Alert | n/a |

No new Primitive proposed.

---

## G. Component mapping

| Legacy region | Canonical | Match | Missing if partial |
|---|---|---|---|
| `.ix-card` | `.ifx-card` | **PARTIAL** | Canonical **adds `box-shadow: var(--ifx-shadow-card)`**. Legacy card has **no shadow**. Auto-replace would change accepted surface. |
| `.ix-card-header/body` | `.ifx-card-header/body` | **SEMANTIC_EQUIVALENT** padding tokens | Header already space-between; Canonical adds `gap`. |
| `.ix-profile-tab*` | `.ifx-tabs` / `.ifx-tab.is-active` | **NONE** | Canonical = **segmented track** + soft active. Legacy = loose pills + **solid accent** + `.active`. Different contract. `IfxTabs` uses `data-ifx-tab` / `is-active` / panels. |
| Account values | `.ifx-field-value` | **PARTIAL** | No 8px vertical pad; size sm vs 14px; no accent variant. |
| Security fields | `.ifx-label` / `.ifx-input` / `.ifx-form-row` | **SEMANTIC_EQUIVALENT** | form-row gap 16 vs page 16 — OK for security stack; Account grid is 20px. |
| `.ix-breadcrumb` | `.ifx-breadcrumb` | **PARTIAL** | Canonical is `ul/li` + `.ifx-breadcrumb-sep` / `-current`. Page is `div` + Tabler chevron. |
| Page h1 + crumb | `.ifx-page-header` | **PARTIAL** | Pattern is composition only. Page is not that DOM. |
| `.ix-table` | `.ifx-table` | **PARTIAL** | Hover: Legacy `rgba(255,255,255,0.02)` vs `--ifx-bg-hover`. |
| `.ix-table-search` | `.ifx-search` | **PARTIAL** | Toolbar-embedded; height token may differ. |
| Pagination JS | `IfxPagination` | **PARTIAL** | Canonical **does not hide tbody rows**. Legacy `data-ix-paginate` owns slice. |
| `.ix-act-*` | `.ifx-timeline` | **NONE** | Timeline = vertical line + 16px marker. Activity = flex row + 32px **icon** dots. |
| `ixToast` | `IfxToast.show` | **SEMANTIC_EQUIVALENT** | Host/class names differ; behavior (type, 3500ms, icons) matches. |
| `.ix-stat-icon` 32px | `.ifx-stat-icon` | **PARTIAL** | Stat icon is ~44px in a Stat **card**, not a 32px well. |
| Profile metrics strip | `.ifx-stat` / stat-strip | **NONE** | 3-up full-bleed identity metrics ≠ Stat card. |
| Plan / referral / aff / layers | — | **NONE** | Page/Module composition. |
| Modal | `.ifx-modal` | n/a | DOM removed. Dump CSS leftover only. |

---

## H. Page / Module residuals

**PAGE_SPECIFIC** — User Profile template composition, not Global:

- `.ix-profile-grid` / `.ix-profile-sidebar` **300px** / wrap at 1024
- `.ix-profile-hero` padding 40/24/28
- `.ix-profile-avatar` 90 + ring
- `.ix-profile-name` / `.ix-profile-stats*`
- `.ix-detail-list*`
- `.ix-profile-tabs` / `.ix-profile-tab` / `.ix-tab-content`
- `.ix-act-*` activity list
- `.ix-content` as Reference frame
- Most identity/account/security inlines

**MODULE_SPECIFIC** — Affiliate / plan / referral presentation:

- `.ix-plan-card` / `.ix-plan-price*` / `.ix-plan-feat`
- `.ix-ref-row` / `.ix-ref-input` / copy row
- `.ix-layer-f0/f1/f2` / `.ix-layer-info` / `.ix-layer-pill`
- `.ix-aff-summary*` / network tiles / table cell tones / payout row
- Referral code letter-spacing display

---

## I. JS mapping

| Legacy behavior | Legacy | Canonical | Exact? | Safe to map? | Residual |
|---|---|---|---|---|---|
| Profile tabs | `data-ix-profile-tab` + `.active` on `.ix-profile-tab` / `.ix-tab-content` | `IfxTabs` + `.ifx-tab.is-active` + `[data-ifx-panel]` | **no** (class + chrome + API) | **no** until tab visual is classified | Keep PatternUserProfile tabs |
| Copy referral | `data-ix-copy-ref` + clipboard + `ixToast` | none | no | no | PAGE/MODULE residual |
| Toast | `window.ixToast(msg, type)` inline onclick | `IfxToast.show` | **behavior yes**, API/markup no | SEMANTIC_EQUIVALENT after onclick rewrite | residual until Owner allows JS swap |
| Table search | `[data-ix-search]` filters `tr` via `display` | `IfxTable` owns `is-hidden`, **not** search input | no | no | residual composer |
| Pagination | `[data-ix-paginate]` slices rows, injects “Showing 1–5 of 6” | `IfxPagination` UI + `ifx-page-change` only | **no** | no | residual |
| Ripple on `.ix-btn` | Admin dump | none | — | do not invent | leftover dump |
| Generic `ixOpenModal` | dump, no DOM | `IfxModal` | unused | ignore | unused JS |

---

## J. Unused Legacy CSS

| | Count |
|---|---|
| Unique unused selectors (no page class) | **515** |
| Unique consumed | **135** |
| Includes | Chat layout, wizard, auth, hub, nav-pills, generic modal, dropdown, offcanvas, typography utilities, fs/fw helpers, theme-toggle, … |

**Do not delete in this wave.** Step 4 tree-shake.

`reference-layers.css` still has `.ref-page-user-profile-*` from a **rejected** wave. This Reference **does not** use them. Not a mapping candidate.

---

## K. Master mapping matrix

Match: `EXACT` · `SEMANTIC_EQUIVALENT` · `PARTIAL` · `NONE`

| ID | Region | Legacy | Responsibility | Canonical | Match | Disposition | Conf. |
|---|---|---|---|---|---|---|---|
| M01 | Actions | `.ix-btn` / `-primary` / `-outline` / `-sm` / `-success` | Button chrome | `.ifx-btn*` `primitives/button/button.css` | SEMANTIC_EQUIVALENT | CAN_MAP_EXISTING (chrome only) | med |
| M02 | Status/plan chips | `.ix-chip*` | Chip | `.ifx-chip*` | SEMANTIC_EQUIVALENT | CAN_MAP_EXISTING minus 11px | med |
| M03 | Forms | `.ix-label` `.ix-input` `.ix-form-group` | Field chrome | `.ifx-label` `.ifx-input` | SEMANTIC_EQUIVALENT | CAN_MAP_EXISTING | med |
| M04 | Card surface | `.ix-card` | Surface | `.ifx-card` | PARTIAL (shadow) | UNRESOLVED | high |
| M05 | Card slots | `.ix-card-header/body` | Inset | `.ifx-card-header/body` | SEMANTIC_EQUIVALENT | CAN_MAP_EXISTING | med |
| M06 | Breadcrumb | `.ix-breadcrumb` | Trail | `.ifx-breadcrumb` | PARTIAL (DOM) | UNRESOLVED | high |
| M07 | Page heading | bare `h1` | Document title | Foundation `h1` | PARTIAL (rem) | UNRESOLVED | high |
| M08 | Tabs | `.ix-profile-tab.active` | Profile section switch | `.ifx-tabs` segmented | NONE | PAGE_SPECIFIC | high |
| M09 | Hero avatar | `.ix-profile-avatar` | Identity 90+ring | `.ifx-avatar*` | NONE | PAGE_SPECIFIC | high |
| M10 | Table avatars | `.ix-avatar-sm` + tone | Cell identity | `.ifx-avatar-sm` + tone | PARTIAL | UNRESOLVED | med |
| M11 | Table | `.ix-table` | Data table | `.ifx-table` | PARTIAL (hover) | UNRESOLVED | med |
| M12 | Table search | `.ix-table-search` | Filter chrome | `.ifx-search` | PARTIAL | UNRESOLVED | med |
| M13 | Pagination | `data-ix-paginate` | Row slice + UI | `IfxPagination` | PARTIAL | UNRESOLVED | high |
| M14 | Activity | `.ix-act-*` | Event list | `.ifx-timeline` | NONE | PAGE_SPECIFIC | high |
| M15 | Toast | `ixToast` | Feedback | `IfxToast` | SEMANTIC_EQUIVALENT | CAN_MAP_EXISTING (JS later) | med |
| M16 | Account values | inline 14/500/pad8 | Read-only field | `.ifx-field-value` | PARTIAL | PAGE_SPECIFIC | high |
| M17 | Progress | inline 6px/87% | Billing bar | `.ifx-progress` | PARTIAL | PAGE_SPECIFIC | high |
| M18 | Profile rail | `.ix-profile-sidebar` 300 | Template column | none | NONE | PAGE_SPECIFIC | high |
| M19 | Hero / stats / details | `.ix-profile-*` `.ix-detail-*` | Identity composition | none | NONE | PAGE_SPECIFIC | high |
| M20 | Plan / ref / layers / aff | `.ix-plan-*` `.ix-ref-*` `.ix-layer-*` `.ix-aff-*` | Plan + affiliate | none | NONE | MODULE_SPECIFIC | high |
| M21 | Frame | `.ix-content` pad | Reference well | `.ifx-container` | NONE | PAGE_SPECIFIC | high |
| M22 | `--ix-*` | aliases | Color/radius | `--ifx-*` | UNRESOLVED | UNRESOLVED | low |
| M23 | rem root | `html` body-md | Scale | Foundation 16px html | NONE | UNRESOLVED | high |
| M24 | Outline danger | inline | Suspend | none | NONE | MISSING_CANONICAL_CONTRACT | high |
| M25 | Group label “Details” | inline 14/600 | Block title | none | NONE | MISSING_CANONICAL_CONTRACT | high |
| M26 | Icon sizes 12/13/14 | inline | Glyph scale | none | NONE | PURE_LAYOUT_VALUE | high |
| M27 | Flex/grid/gaps | inlines | Local layout | Stack/Inline/Grid only if token-equal | PARTIAL / NONE | PURE_LAYOUT_VALUE or PAGE_SPECIFIC | med |
| M28 | Card header inline justify | `justify-content:space-between` | already in CSS | `.ix-card-header` | EXACT (redundant) | CAN_MAP_EXISTING (delete later) | high |

### Code evidence (required pairs)

**M01 Button**

LEGACY `user-profile.css`:

```css
.ix-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--ifx-space-button-icon-gap);
  padding: var(--ifx-space-button-y) var(--ifx-space-button-x);
  border-radius: var(--ix-radius);
  font-size: var(--ifx-text-btn-md-size);
  font-weight: var(--ifx-text-btn-md-weight);
  border: none;
}
.ix-btn-primary { background: var(--ix-accent); color: var(--color-text-on-primary); }
.ix-btn-outline { background: transparent; color: var(--ix-text-secondary); border: 1px solid var(--ix-border); }
```

CANONICAL `design_system/primitives/button/button.css`:

```css
.ifx-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ifx-space-button-icon-gap);
  padding: var(--ifx-space-button-y) var(--ifx-space-button-x);
  border-radius: var(--ifx-radius-button);
  border: 1px solid transparent;
  /* + disabled, line-height, transition tokens */
}
.ifx-btn-primary { background: var(--ifx-action-primary); color: var(--ifx-text-on-primary); }
.ifx-btn-outline { background: transparent; color: var(--ifx-text-secondary); border-color: var(--ifx-border-default); }
```

Diff: base `border:none` vs `1px solid transparent`; radius `--ix-radius` vs `--ifx-radius-button`; no outline-danger.

**M02 Chip**

LEGACY:

```css
.ix-chip {
  display: inline-flex; align-items: center; gap: var(--ifx-inline-xs);
  padding: var(--ifx-space-chip-y) var(--ifx-space-chip-x);
  border-radius: 20px;
  font-size: var(--ifx-text-body-sm-size);
  font-weight: var(--ifx-font-weight-medium);
}
.ix-chip-primary { background: var(--ix-accent-soft); color: var(--ix-accent); }
```

CANONICAL `primitives/chip/chip.css`:

```css
.ifx-chip {
  display: inline-flex; align-items: center; gap: var(--ifx-inline-xs);
  padding: var(--ifx-space-chip-y) var(--ifx-space-chip-x);
  border-radius: var(--ifx-radius-chip);
  font-size: var(--ifx-text-body-sm-size);
  border: 1px solid transparent;
}
.ifx-chip-primary { background: var(--ifx-action-primary-soft); color: var(--ifx-action-primary); }
```

Diff: hardcoded `20px` vs `--ifx-radius-chip`; page forces `11px`.

**M04 Card**

LEGACY:

```css
.ix-card {
  background: var(--ix-bg-card);
  border-radius: var(--ix-radius-lg);
  border: 1px solid var(--ix-border);
}
```

CANONICAL `components/card/card.css`:

```css
.ifx-card {
  background: var(--ifx-bg-surface);
  border-radius: var(--ifx-radius-card);
  border: 1px solid var(--ifx-border-default);
  box-shadow: var(--ifx-shadow-card);
}
```

Diff: **shadow**. Not EXACT.

**M08 Tabs**

LEGACY:

```css
.ix-profile-tabs { display: flex; gap: var(--ifx-space-4); flex-wrap: wrap; margin-bottom: var(--ifx-space-24); }
.ix-profile-tab.active { background: var(--ix-accent); color: #fff; }
```

CANONICAL `components/tabs/tabs.css`:

```css
.ifx-tabs {
  display: flex; flex-wrap: wrap; gap: var(--ifx-space-2);
  background: var(--ifx-bg-input);
  border-radius: var(--ifx-radius-button);
  padding: var(--ifx-space-2);
  width: fit-content;
}
.ifx-tab.is-active {
  background: var(--ifx-action-primary-soft);
  color: var(--ifx-action-primary);
}
```

Different chrome. **NONE**.

**M09 Avatar**

LEGACY:

```css
.ix-profile-avatar {
  width: 90px; height: 90px;
  border-radius: 50%;
  border: 3px solid var(--ix-accent);
  background: var(--ix-accent);
  font-size: var(--ifx-font-size-32); font-weight: var(--ifx-font-weight-bold); color: #fff;
}
```

CANONICAL `primitives/avatar/avatar.css`:

```css
.ifx-avatar {
  width: var(--ifx-size-avatar-md);
  height: var(--ifx-size-avatar-md);
  border-radius: var(--ifx-radius-full);
  background: var(--ifx-action-primary-soft);
  color: var(--ifx-action-primary);
}
.ifx-avatar-lg { width: var(--ifx-size-avatar-lg); height: var(--ifx-size-avatar-lg); }
```

No 90px, no ring, opposite fill/text. **NONE**.

**M14 Activity vs Timeline**

LEGACY:

```css
.ix-act-item { display: flex; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--ix-border); }
.ix-act-dot { width: 32px; height: 32px; border-radius: 50%; }
```

CANONICAL `components/timeline/timeline.css`:

```css
.ifx-timeline-item { position: relative; padding-left: var(--ifx-space-32); padding-bottom: var(--ifx-space-20); }
.ifx-timeline-item::before { /* vertical 2px line */ }
.ifx-timeline-marker { width: var(--ifx-space-16); height: var(--ifx-space-16); border: 2px solid var(--ifx-action-primary); }
```

**NONE**.

**M15 Toast JS**

LEGACY `user-profile.js`: `ixToast(message, type, duration)` → `#ix-toast-container` + `.ix-alert`.

CANONICAL `components/toast/toast.js`: `IfxToast.show` → `#ifx-toast-host` + `.ifx-alert.ifx-toast`.

Same types/icons/duration. Markup/API differ.

**M03 Form**

LEGACY `.ix-label` / `.ix-input` use `--ifx-font-size-14` + `--ix-*` colors.

CANONICAL `.ifx-label` / `.ifx-input` use `--ifx-font-size-sm` + `--ifx-*`.

Same responsibility. Size token name differs (`14` vs `sm`). SEMANTIC_EQUIVALENT if sm === 14 on Canonical scale.

---

## L. Residual register

### A. PAGE_SPECIFIC

```css
.ix-profile-grid { display: flex; gap: var(--ifx-space-24); align-items: flex-start; }
.ix-profile-sidebar { width: 300px; flex-shrink: 0; }
.ix-profile-hero { padding: 40px 24px 28px; /* flex column center */ }
.ix-profile-avatar { width: 90px; height: 90px; border: 3px solid var(--ix-accent); /* … */ }
.ix-profile-name { font-size: var(--ifx-font-size-18); font-weight: var(--ifx-font-weight-bold); }
.ix-profile-stats { margin: 20px -24px; width: calc(100% + 48px); /* … */ }
.ix-detail-list li { display: flex; gap: var(--ifx-space-8); padding: 7px 0; }
.ix-profile-tabs / .ix-profile-tab / .ix-profile-tab.active
.ix-tab-content { display: none; } .ix-tab-content.active { display: block; }
.ix-act-timeline / .ix-act-item / .ix-act-dot / .ix-act-title / .ix-act-desc / .ix-act-time
.ix-content { padding: var(--ifx-space-container); }
```

Plus account field inlines, 2FA row, details inset, chip `11px`, billing progress 6px/87%.

### B. MODULE_SPECIFIC

```css
.ix-plan-card { border: 2px solid var(--ix-accent); background: rgba(105,108,255,.04); }
.ix-plan-price-num { font-size: 36px; font-weight: 800; }
.ix-ref-row / .ix-ref-input
.ix-layer-f0 / .ix-layer-f1 / .ix-layer-f2
.ix-layer-info / .ix-layer-pill
.ix-aff-summary / .ix-aff-sum-item / .ix-aff-sum-val / .ix-aff-sum-label
```

Plus referral code tracking, explainer wash, F0–F2 tiles, table cell tones, payout row.

### C. MISSING_CANONICAL_CONTRACT

| Responsibility | Consumers | Legacy | Why Canonical insufficient |
|---|---|---|---|
| Outline danger button | Suspend | `color/border: var(--ix-danger)` on `.ix-btn-outline` | `.ifx-btn-danger` is filled only |
| Group / block label (14/600, not a heading) | “Details” | inline | Foundation headings are document headings; Title primitive does not paint the title |
| Profile tab (loose + solid active) | 4 tabs | `.ix-profile-tab.active` | `.ifx-tabs` is a different component |
| 90px ring avatar | Hero | `.ix-profile-avatar` | Avatar primitive sizes + no ring |
| Activity icon-row list | Timeline tab | `.ix-act-*` | Timeline is marker+line |
| Copy field + button | Referral | `.ix-ref-row` | Input+Button exist separately; no copy-row contract |
| Layer pills F0/F1/F2 | Referral + affiliate | `.ix-layer-f*` | Chip tones exist but not this badge language |

Owner names these later. No APIs proposed.

### D. PURE_LAYOUT_VALUE

Icon `font-size` 12/13/14; `flex:1`; `width:100%`; gaps 3/10; `margin-top:24px`; `hr` margins; redundant header `justify-content`.

Not Global token debt.

### E. UNRESOLVED

1. **`--ix-*` → `--ifx-*`** computed equality on a Canonical-only stylesheet.  
2. **`html` rem = body-md (~15px)** vs Foundation **16px**. Blocks Foundation `h1` and all rem maps.  
3. **`.ifx-card` shadow** vs accepted shadowless card.  
4. **Breadcrumb DOM** (div vs ul).  
5. **Table hover** token vs rgba.  
6. **Pagination / search ownership** vs `IfxTable` + `IfxPagination` + `IfxDataList`.  
7. **515 unused dump selectors** — delete vs keep until Step 4.

---

## M. Counts

```
LEGACY_CONSUMED_SELECTORS     = 135   (unique; 690 rule blocks parsed)
LEGACY_INLINE_STYLES          = 151   (74 unique signatures)
CAN_MAP_EXISTING              = 6     (M01 chrome, M02 minus 11px, M03, M05, M15 JS, M28 redundant)
PAGE_SPECIFIC                 = 19    (matrix + residual A)
MODULE_SPECIFIC               = 8     (matrix M20 + residual B)
MISSING_CANONICAL_CONTRACT    = 7     (residual C)
PURE_LAYOUT_VALUE             = 8     (icon sizes, flex fill, small gaps, hr)
UNRESOLVED                    = 7     (residual E)
UNUSED_LEGACY_SELECTORS       = 515
```

Counts are **mapping-row / unique-signature** counts, not 151× one-row-per-inline (table cell repeats share one MODULE row).

---

## Final

```
USER_PROFILE_MAPPING_AUDIT = COMPLETE
USER_PROFILE_READY_FOR_OWNER_CLASSIFICATION = YES
```

No implementation. No commit. No push. Chat not touched.

Stopped. Owner + ChatGPT classify residuals before Step 4.
