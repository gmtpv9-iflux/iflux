# P6a — PAGE 01 User Profile — Step 3C Approved Global Primitive Decisions

**Date:** 2026-08-28  
**Mode:** IMPLEMENT APPROVED PRIMITIVES + TARGETED AUDIT  
**Baseline:** `USER_PROFILE_EXISTING_CANONICAL_APPLIED = PASS` · `a733c0a`

```
BUTTON_OUTLINE_DANGER = PASS
PROGRESS_SM = PASS
USER_PROFILE_PRIMITIVE_MIGRATION = PASS
MATERIAL_VISUAL_DELTA = 0
F0_F1_F2_MATCH = NEITHER
PRIMITIVE_LAYER_READY_FOR_OWNER_REVIEW = YES
```

Component layer not touched. Chat not touched. Group Label not created. F0/F1/F2 markup/CSS not changed.

---

## A. Button Primitive change

`design_system/primitives/button/button.css` — added after `.ifx-btn-outline`:

```css
/* Dùng cho:
 * - destructive action cần mức nhấn thấp hơn danger filled
 */
.ifx-btn-outline-danger {
  background: transparent;
  color: var(--ifx-danger);
  border-color: var(--ifx-danger);
}
.ifx-btn-outline-danger:hover {
  background: var(--ifx-danger-soft);
  color: var(--ifx-danger);
}
```

`.ifx-btn-danger` unchanged. Not composed with `.ifx-btn-outline`. No new token.

---

## B. Suspend migration

Before: `.ifx-btn.ifx-btn-outline` + inline `color/border-color: var(--ix-danger)`.

After: `.ifx-btn.ifx-btn-outline-danger` + local `flex:1;justify-content:flex-start` only.

Computed @1440 rest: color `rgb(255, 62, 29)`, border `1px solid` same, size 125 × 35.28125 — identical.

---

## C. Progress Primitive change

`design_system/primitives/progress/progress.css`:

```css
/* Dùng cho:
 * - progress bar compact trong card/table/dense UI
 * 6px = existing --ifx-space-4 + --ifx-space-2 (no --ifx-space-6 on the 4pt scale).
 */
.ifx-progress-sm {
  height: calc(var(--ifx-space-4) + var(--ifx-space-2));
}
```

`--ifx-space-6` does **not** exist (scale is 2 / 4 / 8 / 12…). No token created. Default 8px and `.ifx-progress-lg` 12px unchanged.

---

## D. Billing progress migration

Replaced two anonymous inline boxes with:

```html
<div class="ifx-progress ifx-progress-sm" style="--ifx-progress-value: 87%">
  <span class="ifx-progress-bar"></span>
</div>
```

`87%` is consumer/data (`--ifx-progress-value`), not a CSS contract.

Loaded `design_system/primitives/progress/progress.css`.

```
PROGRESS_BASE_REUSED = YES
PROGRESS_SM_REUSED = YES
```

---

## E. Progress local visual residual

Canonical track is `--ifx-bg-input` + `--ifx-radius-full`. Accepted bar is violet wash + 6px **px**.

On this page `html` rem = 15px, so `space-4 + space-2` computes **5.625px**. That was a visible delta. Global Progress was **not** changed.

```css
.ix-content .ix-plan-card .ifx-progress {
  background: rgba(105,108,255,.2);
}
.ix-content .ix-plan-card .ifx-progress-sm {
  height: 6px;
}
```

Radius left as Canonical `9999px` (on a 6px bar this matches Legacy `3px` capsule). Fill 87% / accent `#696cff` matched without extra residual.

---

## F. Avatar reuse result

**Not consumed.** `.ix-profile-avatar` left as-is. `avatar.css` not loaded.

`.ifx-avatar` base is 36px, soft primary fill, primary text, semibold / sm. Hero needs 90px, 3px accent ring, **solid** accent, `#fff`, 32/bold. Adding `.ifx-avatar` would require overriding every painted property. That is not zero-delta reuse of the Primitive contract.

---

## G. Chip unchanged confirmation

`design_system/primitives/chip/chip.css` — not edited. Page still uses `.ifx-chip*` + local `11px`. No `.ifx-chip-sm` / compact API.

---

## H. Title unchanged confirmation

`design_system/primitives/title/title.css` — not edited. “Details” still the inline 14/600 residual. Not page/section/widget title.

---

## I. Group Label deferred confirmation

No `.ifx-group-label` (or variants) created. Owner lock: wait for User Profile + Chat evidence.

---

## J. Exact F0/F1/F2 Legacy CSS

From `user-profile.css` (consumed dump):

```css
.ix-layer-f0 {
  background: rgba(105,108,255,.15); color: var(--ix-accent);
  padding: 2px 8px; border-radius: 20px; font-size: var(--ifx-font-size-10); font-weight: var(--ifx-font-weight-semibold);
}
.ix-layer-f1 {
  background: rgba(40,199,111,.15); color: var(--ix-success);
  padding: 2px 8px; border-radius: 20px; font-size: var(--ifx-font-size-10); font-weight: var(--ifx-font-weight-semibold);
}
.ix-layer-f2 {
  background: rgba(255,159,67,.15); color: var(--ix-warning);
  padding: 2px 8px; border-radius: 20px; font-size: var(--ifx-font-size-10); font-weight: var(--ifx-font-weight-semibold);
}
.ix-layer-info {
  display: flex; gap: var(--ifx-inline-md); flex-wrap: wrap;
  padding: var(--ifx-space-12) 20px; border-bottom: 1px solid var(--ix-border);
  align-items: center;
}
.ix-layer-pill {
  display: flex; align-items: center; gap: var(--ifx-inline-sm);
  font-size: var(--ifx-font-size-12); color: var(--ix-text-secondary);
  background: var(--ix-bg-hover);
  padding: 4px 10px; border-radius: 20px;
}
.ix-layer-pill strong { color: var(--ix-text-primary); }
```

---

## K. Exact F0/F1/F2 HTML

Referral explainer (Account column, always visible):

```html
<span class="ix-layer-f0">F0</span>
<span class="ix-layer-f1">F1</span>
<span class="ix-layer-f2">F2</span>
```

Affiliate `#tab-affiliate`:

```html
<div class="ix-layer-info">
  <div class="ix-layer-pill"><span class="ix-layer-f0">F0</span> <strong>10%</strong> — …</div>
  <div class="ix-layer-pill"><span class="ix-layer-f1">F1</span> <strong>5%</strong> — …</div>
  <div class="ix-layer-pill"><span class="ix-layer-f2">F2</span> <strong>2.5%</strong> — …</div>
  <div class="ix-layer-pill">… Nhận mãi mãi</div>
</div>
```

Table cells: `<td><span class="ix-layer-f0">F0</span></td>` (and F1/F2).

---

## L. F0/F1/F2 computed matrix @1440

| Context | class | text | display | fs | fw | pad | w × h | radius | bg | color | transform / tracking |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Referral explainer | `.ix-layer-f0` | F0 | inline | 9.375 | 600 | 2×8 | 28.22 × 15 | 20px | rgba(105,108,255,.15) | #696cff | none / normal |
| Referral explainer | `.ix-layer-f1` | F1 | inline | 9.375 | 600 | 2×8 | 25.89 × 15 | 20px | rgba(40,199,111,.15) | #71dd37 | none / normal |
| Referral explainer | `.ix-layer-f2` | F2 | inline | 9.375 | 600 | 2×8 | 27.84 × 15 | 20px | rgba(255,159,67,.15) | #ffab00 | none / normal |
| Affiliate pill | `.ix-layer-f0` | F0 | block | 9.375 | 600 | 2×8 | 28.22 × 18.06 | 20px | same F0 | #696cff | none / normal |
| Table cell | `.ix-layer-f0` | F0 | inline | 9.375 | 600 | 2×8 | 28.22 × 15 | 20px | same F0 | #696cff | none / normal |
| Affiliate row wrap | `.ix-layer-info` | Commission rates: … | flex | 14.06 | 400 | 11.25 20 | 1055.5 × 49.56 | 0 | transparent | #cfd3ec | — |
| Affiliate pill shell | `.ix-layer-pill` | F0 10% — … | flex | 11.25 | 400 | 4×10 | 222.86 × 26.06 | 20px | #3a3b55 | #8592a3 | none / normal |

No border on the F-marks. F1 **wash** (legacy green `40,199,111`) ≠ F1 **text** (Canonical success lime).

---

## M. Comparison vs Chip

`.ifx-chip`: inline-flex, chip padding tokens, `body-sm` / medium, `line-height:1`, `1px` transparent border, radius-chip, soft+hue tones from `--ifx-*-soft`.

F-marks: `inline`/`block`, **2×8** pad, **10-token / 600**, no border, hardcoded 20px, custom rgba washes (F1 wash not `--ifx-success-soft`).

Closer than Badge in “soft + hue text”, but **not** the Chip contract. Not a compact Chip either (that API is locked off).

---

## N. Comparison vs Badge

`.ifx-badge`: inline-flex, **filled** solid + on-color text, 2xs/semibold, badge padding, optional uppercase status.

F-marks are **not filled**, not on-color, not uppercase, not count/dot.

**F0_F1_F2_MATCH = NEITHER**

---

## O. Visual / behavior

pixelmatch vs `a733c0a` (threshold 0.1): **1440 / 768 / 390 = 0**.

Avatar 90, column 300, first card 300×681.59, Suspend rest chrome, chips unchanged.

Behavior: tabs, Suspend toast, copy toast, search 2/6, pagination Showing 1–5 of 6, document scroll, no JS errors, Edit inert.

---

## P. Changed files

| File | Action |
|---|---|
| `design_system/primitives/button/button.css` | + `.ifx-btn-outline-danger` |
| `design_system/primitives/progress/progress.css` | + `.ifx-progress-sm` |
| `design_system/references/patterns/user-profile/index.html` | Suspend class; Progress consume; progress.css link |
| `design_system/references/patterns/user-profile/user-profile.css` | Progress page residuals only |
| this report | added |

Not edited: `avatar.css`, `chip.css`, `title.css`, Chat, tokens, Components.

---

## Final

```
BUTTON_OUTLINE_DANGER = PASS
PROGRESS_SM = PASS
USER_PROFILE_PRIMITIVE_MIGRATION = PASS
MATERIAL_VISUAL_DELTA = 0
F0_F1_F2_MATCH = NEITHER
PRIMITIVE_LAYER_READY_FOR_OWNER_REVIEW = YES
```
