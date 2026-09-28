# P6a — PAGE 01 User Profile — Step 2B Cleanup

**Date:** 2026-08-28  
**Mode:** IMPLEMENT TARGETED CLEANUP ONLY  
**Baseline:** `USER_PROFILE_TEMPLATE_ISOLATED = PASS` · `464b0d3`

```
LEGACY_EDIT_MODAL_REMOVED = YES
DOCUMENT_SCROLL_RESTORED = YES
USER_PROFILE_READY_FOR_CSS_MAPPING = YES
```

No CSS mapping. No class rename. No token mapping. Chat untouched.

---

## A. Modal DOM removed

Deleted the entire `#editModal` overlay and form:

- `.ix-modal-overlay` / `.ix-modal-box`
- Edit Profile / Update your personal information
- First Name / Last Name / Username / Email / Phone / Country fields
- Cancel / Save Changes
- `id="editModal"`, `data-profile-modal`, `data-ix-profile-modal-close`

Stripped `data-ix-profile-modal-open="editModal"` from the two remaining Edit buttons.

---

## B. Modal CSS removed

Proven profile-modal-only rules deleted:

- `.ix-modal-overlay[data-profile-modal]`
- `.ix-modal-overlay[data-profile-modal].open`
- `.ix-modal-box`
- `.ix-modal-close`
- `.ix-modal-sub`

Generic Admin dump `.ix-modal` / `.ix-modal-overlay` (unused on this page) was **not** tree-shaken. Step 3 maps that.

---

## C. Modal JS removed

From `PatternUserProfile`:

- `openProfileModal` / `closeProfileModal`
- listeners for `[data-ix-profile-modal-open]`, `[data-ix-profile-modal-close]`, `[data-profile-modal]`
- `openModal` / `closeModal` exports

Kept: tabs, copy-ref, `ixToast`, table search/pagination.

Generic leftover `ixOpenModal` in the Admin UI dump remains (no `[data-ix-modal]` on this page). No JS errors after removal.

---

## D. Edit action resulting behavior

Two visual actions remain. Neither opens a modal. Neither has an href. Drawer is **not** implemented.

| Control | After cleanup |
|---|---|
| Sidebar **Edit Profile** | `type="button"` · `ix-btn ix-btn-primary` · `ti-edit` · **no target** |
| Account tab **Edit** | `type="button"` · `ix-btn ix-btn-outline ix-btn-sm` · `ti-edit` · **no target** |

State: visible entry only. Click is inert. Canonical drawer / dedicated edit page is a later wave.

---

## E. Root cause of scroll lock

Not `html`/`body` (those were already unlocked in Step 2).

Leftover AppShell **content-pane** contract:

```css
.ix-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}
```

Comment was: `scroll nội bộ, không scroll body`.

After isolation, `.ix-content` is the page root and grows with content (`scrollHeight === clientHeight` of the pane). `overflow-y: auto` still makes it a scrollport, so wheel events are trapped on a box that has nothing to scroll. The document does not receive the wheel.

---

## F. Exact CSS rule(s) changed for scrolling

Removed from `.ix-content`:

- `overflow-y: auto`
- `overflow-x: hidden`
- `flex: 1`
- `min-height: 0`
- `::-webkit-scrollbar` pane chrome

Kept: `padding: var(--ifx-space-container)` (same 30px inset).

No new overflow workaround on `html`/`body`.

Computed after fix: `html/body/.ix-content overflow-y = visible`.

---

## G. Scroll measurements

Viewport height used for test: 900.

| Viewport | doc scrollHeight | clientHeight | overflow-x | wheel Δ scrollTop | scrollTo bottom |
|---|---|---|---|---|---|
| 1440 | 1579 | 900 | 0 | 0 → 679 (max) | 679 / 679 |
| 768 | 2027 | 900 | 0 | 0 → 800 | 1127 / 1127 |
| 390 | 2137 | 900 | 0 | 0 → 800 | 1237 / 1237 |

Document scrolls. Bottom of the default Account view is reachable. No horizontal overflow.

---

## H. Visual regression

1440 vs Step 2 isolation (template pieces):

| Region | After 2B | vs isolation |
|---|---|---|
| Avatar | 90 × 90, 22.5 / 800 | same |
| Name | 133.58 × 25.31 | same |
| Hero pad | 40 24 28 | same |
| Profile column | 300 × 1435.95 | same |
| First card | 300 × 681.59 | same |
| Tabs | 1057.5 × 31 | same |

Intentional content removal: Legacy Edit modal only.

Tabs / toast / copy-ref: no JS errors.

---

## I. Changed files

| File | Action |
|---|---|
| `design_system/references/patterns/user-profile/index.html` | modal DOM out; Edit wiring stripped |
| `design_system/references/patterns/user-profile/user-profile.css` | profile-modal CSS out; `.ix-content` pane scroll out |
| `design_system/references/patterns/user-profile/user-profile.js` | profile-modal JS out |
| this report | added |

Not touched: Chat, tokens, Foundation, Primitive, Component, `reference-layers.css`.

Stopped. Step 3 (CSS mapping) not started.
