# P6a — PAGE 01 User Profile — Step 3B Apply Existing Canonical Contracts

**Date:** 2026-08-28  
**Mode:** IMPLEMENT APPROVED EXISTING-MAP ONLY  
**Baseline:** `USER_PROFILE_MAPPING_AUDIT = COMPLETE` · `82a7586`  
**Source:** `25_user_profile_legacy_canonical_mapping_audit.md`  
**Target:** `design_system/references/patterns/user-profile/`

```
USER_PROFILE_EXISTING_CANONICAL_APPLIED = PASS
MATERIAL_VISUAL_DELTA = 0
CAN_MAP_EXISTING_REMAINING = 0
USER_PROFILE_READY_FOR_RESIDUAL_CLASSIFICATION = YES
```

No new token / Primitive / Component / global class. Chat not touched. Foundation rem / heading scale unchanged.

---

## A. Canonical dependencies added

Loaded **after** the Legacy dump. **Not** loaded: Foundation `reset.css` / `typography.css` / `layout.css`, Canonical `primitives.css`. Those would change `html` rem or heading scale.

| File | Why |
|---|---|
| `design_system/tokens/generated/css/semantic.css` | `--ifx-radius-button` / `--ifx-radius-chip` / `--ifx-transition-color` / `--ifx-inset-compact` needed by consumed contracts |
| `design_system/tokens/generated/css/themes/dark.css` | `--ifx-action-primary` and semantic color names used by Button / Chip / Form / Toast |
| `design_system/tokens/generated/css/themes/light.css` | same names for `data-theme="light"` |
| `design_system/primitives/button/button.css` | M01 |
| `design_system/primitives/chip/chip.css` | M02 |
| `design_system/primitives/alert/alert.css` | Toast markup uses `.ifx-alert` |
| `design_system/components/form/form.css` | M03 |
| `design_system/components/card/card.css` | M05 slots only — **`.ifx-card` class is not used** (shadow stays off) |
| `design_system/components/toast/toast.css` | M15 |
| `design_system/components/toast/toast.js` | `IfxToast.show` |

Dump `--color-action-primary` / `--ifx-action-primary` both resolve to `--ifx-color-violet-500`. `--ix-*` aliases were **not** remapped (M22 still UNRESOLVED).

---

## B. Button mappings (M01)

| Control | After |
|---|---|
| Edit Profile | `ifx-btn ifx-btn-primary` + local `flex:1;justify-content:flex-start` |
| Suspend | `ifx-btn ifx-btn-outline` + local danger color/border + `flex:1` — **not** `ifx-btn-danger` |
| Upgrade Plan | `ifx-btn ifx-btn-primary` + local `width:100%` |
| Copy (×2) | `ifx-btn ifx-btn-primary ifx-btn-sm` |
| Account Edit | `ifx-btn ifx-btn-outline ifx-btn-sm` |
| Rút hoa hồng | `ifx-btn ifx-btn-success ifx-btn-sm` |
| Export | `ifx-btn ifx-btn-outline ifx-btn-sm` |
| Save Changes | `ifx-btn ifx-btn-primary` |
| Disable 2FA | `ifx-btn ifx-btn-outline ifx-btn-sm` |

Page residuals (not Button Primitive APIs):

- filled variants: `border-width: 0` (Legacy `border:none` vs Canonical `1px transparent`)
- `.ifx-btn-sm { line-height: var(--ifx-text-btn-md-line) }` (Legacy sm did not switch to tight line-height)
- stretch alignment stays local

Ripple listener now targets `.ifx-btn`.

---

## C. Chip mappings (M02)

All status/plan chips → `.ifx-chip` + matching tone (`-primary` / `-success` / `-warning`).

`font-size:11px` inline **kept** on Pro Member / Active / Paid / Pending / Enabled.

Page residual (not a compact-chip API): `border-width:0`, `line-height:inherit`, `border-radius:20px` so Canonical `1px` border + `line-height:1` + `radius-full` do not change the accepted chip box.

Pro Plan chip has no 11px override (same as baseline).

---

## D. Form mappings (M03)

Mapped:

- every `.ix-label` → `.ifx-label` (Account, Referral, Security)
- Security `.ix-input` → `.ifx-input`

Not mapped (PARTIAL / page-owned):

- Account readonly values (still inline 14/500/pad 8)
- Account grid `gap:20px` (Canonical form-row is 16)
- `.ix-form-group` (no Canonical form-group)
- `.ix-ref-input` (referral display, not Form Input)

Page residual: `.ifx-label` / `.ifx-input` keep `--ifx-font-size-14` (Canonical Form uses `sm` / 13).

---

## E. Card-slot mappings (M05)

`.ix-card-header` → `.ifx-card-header`  
`.ix-card-body` → `.ifx-card-body`  

`.ix-card` root **unchanged** (no shadow).

Cascade check: slot padding still `--ifx-inset-card-header` / `--ifx-inset-card-body`. Canonical header adds `gap` — with `space-between` this does not move title/action. First profile card size still **300 × 681.59**.

---

## F. Toast JS migration (M15)

Removed Legacy `ixToast` + `#ix-toast-container` builder.

All consumers now call `IfxToast.show(message, type)`:

- Suspend → `warning` / `Account suspended`
- Upgrade → `info` / `Redirecting to upgrade...`
- Withdraw → `success` / `Yêu cầu rút tiền đã gửi!`
- Save password → `success` / `Password updated!`
- Disable 2FA → `warning` / `2FA disabled`
- Copy empty → `warning` / `Không có nội dung để sao chép`
- Copy ok / fail → `success` / `warning` (same strings)

Verified live: Suspend + copy-ref both render `#ifx-toast-host` / `.ifx-toast`. `window.ixToast` is gone.

---

## G. Redundant inline removed (M28)

Removed `style="justify-content:space-between"` from Account card header. `.ifx-card-header` already owns that.

Inline count **151 → 150**.

---

## H. Legacy code removed

| Removed | Where |
|---|---|
| `ixToast` implementation + `window.ixToast` | `user-profile.js` |
| Redundant header `justify-content` inline | `index.html` |
| `.ix-btn*` / `.ix-chip*` / `.ix-label` / `.ix-input` / `.ix-card-header` / `.ix-card-body` **from the DOM** | `index.html` |

Dump CSS for those selectors was **not** deleted (Step 4 tree-shake). They are now unused on this Reference.

---

## I. Legacy residual code retained

Still page/module-owned in HTML/CSS/JS:

- `.ix-card` (shadowless root)
- `.ix-content` / `.ix-profile-*` / `.ix-detail-*` / `.ix-profile-tab*`
- `.ix-plan-*` / `.ix-ref-*` / `.ix-layer-*` / `.ix-aff-*` / `.ix-act-*`
- `.ix-form-group` / `.ix-ref-input` / `.ix-table*` / `.ix-avatar-sm`
- `--ix-*` aliases
- `html, body { font-size: body-md }`
- Suspend danger outline inline
- Details group label inline
- 11px chip inlines
- Account field inlines
- Tabs / copy-ref / table search / paginate JS
- Full unused Admin dump (chat, wizard, auth, modal, …)

Page residual block at the end of `user-profile.css` (button border / sm line-height / chip box / form 14px).

---

## J. Visual parity

Compared live page vs `82a7586` at 1440 / 768 / 390 (dark, Account tab, full page, deviceScaleFactor 1, pixelmatch threshold 0.1).

| Viewport | pixelmatch | scrollHeight | avatar | column | first card |
|---|---|---|---|---|---|
| 1440 | **0** | 1579 = 1579 | 90 | 300 | 300 × 681.59 |
| 768 | **0** | 2027 = 2027 | 90 | 730.5 | 730.5 × 681.59 |
| 390 | **0** | 2137 = 2137 | 90 | 360 | 360 × 681.59 |

`html` font-size stayed **15px**. `h1` stayed **28.125px**. overflow-x **0**.

First pass had a 2px Account-header shrink (Canonical `.ifx-btn-sm` tight line-height). Fixed with the page residual above; re-measured **0**.

Evidence: `css-normalization/evidence/user-profile-step3b/`

---

## K. Behavior parity

| Check | Result |
|---|---|
| Tabs Account / Activity / Affiliate / Security | `.active` on button + panel |
| Referral copy | `VIOLET10` + toast `Đã sao chép!` |
| Suspend toast | `Account suspended` / warning |
| Table search `Nguyễn` | 2 of 6 rows |
| Pagination (fresh Affiliate) | Showing 1–5 of 6 · 5 rows visible |
| Document scroll | scrollHeight > clientHeight · wheel/scrollTop 400 |
| JS errors | none |
| Edit Profile / Account Edit | inert · no href · no modal · no drawer |

---

## L. Before / after counts

Same inventory method as audit 25: unique rule-block selectors in `user-profile.css`; a selector is consumed only if it contains a class present in the page HTML (class-less `html`/`body`/`*`/`:root` count as consumed).

```
BEFORE (audit 25):
LEGACY_CONSUMED_SELECTORS     = 135
LEGACY_INLINE_STYLES          = 151
CAN_MAP_EXISTING              = 6
PAGE_SPECIFIC                 = 19
MODULE_SPECIFIC               = 8
MISSING_CANONICAL_CONTRACT    = 7
PURE_LAYOUT_VALUE             = 8
UNRESOLVED                    = 7
UNUSED_LEGACY_SELECTORS       = 515

AFTER:
LEGACY_CONSUMED_SELECTORS     = 117
LEGACY_INLINE_STYLES          = 150
CAN_MAP_EXISTING_REMAINING    = 0
PAGE_SPECIFIC                 = 19
MODULE_SPECIFIC               = 8
MISSING_CANONICAL_CONTRACT    = 7
PURE_LAYOUT_VALUE             = 8
UNRESOLVED                    = 7
UNUSED_LEGACY_SELECTORS       = 536
```

Consumed drop = mapped `.ix-btn*` / `.ix-chip*` / `.ix-label` / `.ix-input` / `.ix-card-header` / `.ix-card-body` now unused in the dump. Unused +21 includes those plus the 4 new page-residual selectors (counted as consumed because they use `.ix-content`).

---

## M. NEW residual register

Re-read after the mappings. **No MISSED_EXISTING_MAPPING.**

### A. PAGE_SPECIFIC

```css
.ix-profile-grid / .ix-profile-sidebar { width: 300px; }
.ix-profile-hero { padding: 40px 24px 28px; }
.ix-profile-avatar { width: 90px; height: 90px; border: 3px solid var(--ix-accent); }
.ix-profile-name / .ix-profile-stats*
.ix-detail-list*
.ix-profile-tabs / .ix-profile-tab.active
.ix-tab-content / .ix-act-*
.ix-content { padding: var(--ifx-space-container); }
```

Plus Account field inlines, 2FA row, Details inset, chip `11px`, billing progress 6px/87%, page residuals that hold accepted Button/Chip/Form box (border / sm line-height / chip 20px / label 14).

### B. MODULE_SPECIFIC

```css
.ix-plan-card / .ix-plan-price* / .ix-plan-feat
.ix-ref-row / .ix-ref-input
.ix-layer-f0 / .ix-layer-f1 / .ix-layer-f2 / .ix-layer-pill
.ix-aff-summary* / network tiles / table cell tones / payout row
```

### C. MISSING_CANONICAL_CONTRACT

See §N — all 7 still missing.

### D. PURE_LAYOUT_VALUE

Icon `font-size` 12/13/14; stretch `flex:1` / `width:100%` / `justify-content:flex-start`; gaps 3/10; `margin-top:24px`; `hr` margins.

### E. UNRESOLVED

1. `--ix-*` → `--ifx-*` computed-only on a Canonical-only sheet  
2. `html` rem = body-md (~15px) vs Foundation 16px  
3. `.ifx-card` shadow vs accepted shadowless root  
4. Breadcrumb DOM (`div` + Tabler vs `ul/li`)  
5. Table hover token vs rgba  
6. Pagination / search ownership vs `IfxTable` + `IfxPagination`  
7. Unused dump tree-shake (now 536)

---

## N. Re-evaluation of the 7 previously missing contracts

| # | Responsibility | STILL_MISSING | Current evidence |
|---|---|---|---|
| 1 | Outline danger button | **YES** | `button.ifx-btn.ifx-btn-outline` + `style="color:var(--ix-danger);border-color:var(--ix-danger);flex:1;…"` — Canonical `.ifx-btn-danger` is filled |
| 2 | Group / block label 14/600 | **YES** | Details still `<div style="font-size:14px;font-weight:600;color:var(--ix-text-primary);margin-bottom:12px">Details</div>` — not Foundation heading, not Title primitive |
| 3 | Profile tab (loose + solid active) | **YES** | still `.ix-profile-tab.active` + `data-ix-profile-tab` — `.ifx-tabs` not used |
| 4 | 90px ring avatar | **YES** | still `.ix-profile-avatar` 90×90 + 3px accent ring |
| 5 | Activity icon-row list | **YES** | still `.ix-act-item` + `.ix-act-dot.ix-stat-icon` 32px — not `.ifx-timeline` |
| 6 | Copy field + action row | **YES** | still `.ix-ref-row` + `.ix-ref-input` + Canonical Button — no copy-row contract |
| 7 | Layer pills F0/F1/F2 | **YES** | still `.ix-layer-f0` / `.ix-layer-f1` / `.ix-layer-f2` — Chip tones exist but this is a different badge language |

Applying Button / Chip / Form / Card slots / Toast did **not** close any of these seven.

---

## O. Changed files

| File | Action |
|---|---|
| `design_system/references/patterns/user-profile/index.html` | Canonical classes + deps + toast calls; M28 inline removed |
| `design_system/references/patterns/user-profile/user-profile.css` | page residual block only; dump chrome left in place |
| `design_system/references/patterns/user-profile/user-profile.js` | `ixToast` removed; `IfxToast.show`; ripple → `.ifx-btn` |
| this report + `evidence/user-profile-step3b/` | added |

Not touched: Chat, token source/generated (except **linked**), Foundation, Primitive/Component **source**, `reference-layers.css`.

---

## Final

```
USER_PROFILE_EXISTING_CANONICAL_APPLIED = PASS
MATERIAL_VISUAL_DELTA = 0
CAN_MAP_EXISTING_REMAINING = 0
USER_PROFILE_READY_FOR_RESIDUAL_CLASSIFICATION = YES
```

Stopped. Do not classify or create missing Design System contracts in this wave.
