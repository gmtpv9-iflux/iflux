# P6a — Chat Parity Audit Only (post-revert)

**Date:** 2026-08-27  
**MODE:** AUDIT ONLY — no implementation  
**Canonical measured:** local files after revert `85aa2da` (= `9a7e6bf` W07)  
**Legacy measured:** staging `Admin_Design_system/patterns/chat.html` @ 1440

---

## A. Revert confirmation

| | |
|---|---|
| Reverted | `66b57da` only |
| Revert commit | `85aa2da` — pushed `staging` |
| W07 vs `9a7e6bf` | **0 diff** on `chat/index.html` + `reference-layers.css` |
| `08_chat_reference_parity.md` | deleted with revert |

**Baseline note:** Owner named `d137281`. That commit is **before** `9a7e6bf` (lower-layer hook fill, all References). Instruction was also “revert ONLY 66b57da / do not revert unrelated normalization.” Pre-Chat-wave = **`9a7e6bf`**, not `d137281`.

### Why 66b57da failed (record)

A. Replaced canonical structure instead of restoring missing CSS.  
B. Removed `.ifx-chat` as main structural shell.  
C. Parallel MODULE layout overlapped Chat Component.  
D. Legacy architecture treated as destination.  
E. Shell / profile / responsive / viewport / surface changed without approval.  
F. `.ref-module-chat-bubble` on static only; JS emits `.ifx-chat-bubble` only → `CHAT_PARITY = PASS` invalid.

---

## B. Canonical Chat Component inventory

`design_system/components/chat/chat.css` + `chat.js`

| Selector | What it owns now |
|---|---|
| `.ifx-chat` | flex column; min-height `--ifx-space-256`; surface; border; radius; overflow hidden; md: row |
| `.ifx-chat-thread` | md: width 256 + right border. **No** flex column, **no** overflow-y, **no** header/list split |
| `.ifx-chat-item` | flex row; pad 12×16; hover/active |
| `.ifx-chat-item-name` | sm / medium / primary. **No** line-height 1.2 |
| `.ifx-chat-item-preview` | xs / muted. **No** display:block explicit |
| *(no item-time)* | time is Foundation `<small>` |
| `.ifx-chat-main` | flex column; flex 1; min-width 0 |
| `.ifx-chat-header` | flex; pad 12×16; bottom border |
| `[data-ifx-chat-title]` | semibold + primary. **No** font-size |
| `.ifx-chat-body` | flex 1; overflow-y auto; pad 16; gap 16 |
| `.ifx-chat-message` / `.is-sent` | flex / row-reverse |
| `.ifx-chat-bubble` | max-width **80%**; pad 8×12; radius **card (8)**; sm; lh normal |
| `.is-sent .ifx-chat-bubble` | action-primary + on-primary |
| `.ifx-chat-meta` | 2xs / muted / margin-top 4 |
| `.ifx-chat-input-bar` | flex; inset-widget; top border |
| `.ifx-chat-input` | **flex:1 only** — no surface |

**JS emits:** `.ifx-chat-message.is-sent` + `.ifx-chat-bubble` (no avatar, no meta, no extra class).

**W07 extra (not Component):** Grid 8+4, Card profile, `.ref-module-chat-*` / `.ref-page-chat-*` from `9a7e6bf`. **No `form.css`** on W07 (Sandbox loads Form globally).

---

## C. Element matrix (1440)

Class: **A** CSS on existing structure · **B** small hook · **C** structural (do not do)

| Element | Legacy computed | Canonical computed | Impact | Missing property | Existing owner | Proposed | Struct? |
|---|---|---|---|---|---|---|---|
| Chat root | 1120×760, min 600, height 760, overflow hidden | ~803×563, min **256**, grows with content | pane thấp, không “workspace” | taller min-height (Component). **Not** 3-pane | `.ifx-chat` | **COMPONENT** | NO |
| Thread pane | 280, flex col, overflow hidden | 256, `display:block`, overflow visible | list không phải pane | flex-col + min-height 0; width 256 **keep** | `.ifx-chat-thread` | **COMPONENT** | NO |
| Thread header | pad ~12/16, **border-bottom** | `.ref-module-chat-thread-section` pad 12/16, **no** bottom border | header dính list | `border-bottom` | module hook already | MODULE (existing hook) | NO |
| Search | 32px, pad 7/10/7/32, full pane | `.ifx-search` 36× max 256 | hơi cao hơn; width OK in pane | none required | Search primitive | keep Global Search | NO |
| Section label | 11/600/accent/uppercase/0.5px | hook: 12/600/muted/uppercase/caps | đã có; màu khác | optional `color: var(--ifx-action-primary)` | `.ref-module-chat-section-label` | MODULE | NO |
| Thread item | pad 10×16, h 53 | pad 12×16, h ~66 | item thoáng hơn | optional pad 10×16 | `.ifx-chat-item` | **COMPONENT** | NO |
| Name | 13/600, lh 1.2, block | 13/600, lh 1.5 | hierarchy hơi lỏng | `line-height: tight` | `.ifx-chat-item-name` | **COMPONENT** | NO |
| Preview | 11 muted, block | 12 muted | nhẹ | none (xs already) | `.ifx-chat-item-preview` | COMPONENT keep | NO |
| Time | 10 muted nowrap | `<small>` **13** muted | time = body, mất meta | 2xs + nowrap | **none** | **COMPONENT** `.ifx-chat-item-time` | B hook (replace small) |
| Item wrap | block column | `.ifx-flex-1` not column | name/preview vẫn xếp (inner flex) | optional `display:flex; flex-direction:column` | no component wrap | B hook **or** Component child | B |
| Convo header | pad 12×**20** | 12×16 | hẹp hơn | `padding-inline: space-20` | `.ifx-chat-header` | **COMPONENT** | NO |
| Convo title | 14/600 | inherit **15**/600 | title hơi lớn | `font-size: sm` | `[data-ifx-chat-title]` | **COMPONENT** | NO |
| Convo role | 12 muted | `small` 13 muted | nhẹ | `font-size: xs` on header meta | no class | B **or** `.ifx-chat-header-meta` | B |
| Convo body | pad 20, h 639 scroll | pad 16, h 431 scroll | body thấp vì root thấp | pad 20; height follows root | `.ifx-chat-body` | **COMPONENT** | NO |
| Message group | 2 bubbles + `margin-top:6` | 2 bubbles, gap 0 | bubbles dính | `bubble + bubble` gap | none | **COMPONENT** sibling | NO |
| Bubble | max 60%, pad 10×14, radius 12 | max **80%**, 8×12, radius **8** | bóng rộng, góc nhỏ | max-width 60%; radius-xl | `.ifx-chat-bubble` | **COMPONENT** | NO |
| Sent bubble | accent + #fff | action-primary + on-primary | **keep canonical** | none | Component | COMPONENT keep | NO |
| Message time | ~10 muted | `.ifx-chat-meta` **10** 2xs | **OK** | none | `.ifx-chat-meta` | COMPONENT keep | NO |
| Composer | field: bg/border/radius/pad 8×14 | pad 1×2, radius 0, **no Form CSS** | **input trần — lỗi lớn** | surface on `.ifx-chat-input` | `.ifx-chat-input` flex only | **COMPONENT** | NO |
| Profile Card | n/a (pane) | Card 389×457, own surface | 2 surface | not CSS-missing | Card + Grid | PAGE keep | **STRUCTURAL** |
| Profile identity | 56 avatar, 14/600 name, 12 role | 48 avatar, 13/600, Chip | role = chip | name already hook; role = text | hooks + Chip | PAGE/MODULE polish | NO |
| Profile details | icon+text rows | KV small+span | khác pattern | optional row hook | `.ref-page-chat-meta` | PAGE existing | NO |
| Profile actions | text rows | ghost buttons | khác chrome | none required | Button + module action | keep Button | NO |

---

## D / H. CSS-only candidate patch (hypothetical — do not write)

**Runtime gate:** only classes JS already emits, or sibling/element selectors on those classes.

```css
/* COMPONENT — chat.css — JS-safe */

.ifx-chat {
  min-height: 37.5rem; /* 600 — Module geometry not required if Component accepts taller pane */
}

.ifx-chat-thread {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

.ifx-chat-item {
  padding: var(--ifx-space-8) var(--ifx-space-16); /* 8 closer than 10; or keep 12 */
}

.ifx-chat-item-name {
  line-height: var(--ifx-line-height-tight);
}

.ifx-chat-item-preview {
  display: block;
}

.ifx-chat-header {
  padding: var(--ifx-space-12) var(--ifx-space-20);
}

[data-ifx-chat-title] {
  font-size: var(--ifx-font-size-sm);
}

.ifx-chat-body {
  padding: var(--ifx-space-20);
}

.ifx-chat-bubble {
  max-width: 60%;
  border-radius: var(--ifx-radius-xl);
}

.ifx-chat-bubble + .ifx-chat-bubble {
  margin-top: var(--ifx-space-8);
}

.ifx-chat-input {
  flex: 1;
  min-width: 0;
  background: var(--ifx-bg-input);
  border: 1px solid var(--ifx-border-default);
  border-radius: var(--ifx-radius-input);
  padding: var(--ifx-space-input-y) var(--ifx-space-input-x);
  color: var(--ifx-text-primary);
  font-size: var(--ifx-font-size-sm);
  font-family: var(--ifx-font-primary);
}
.ifx-chat-input:focus {
  border-color: var(--ifx-border-focus);
  box-shadow: 0 0 0 3px var(--ifx-action-primary-soft);
  outline: none;
}
```

```css
/* COMPONENT + B hook — item time (JS does not emit items; static + future items) */

.ifx-chat-item-time {
  font-size: var(--ifx-font-size-2xs);
  color: var(--ifx-text-muted);
  white-space: nowrap;
}
/* markup: <small> → <span class="ifx-chat-item-time"> */
```

```css
/* MODULE — already exists; optional color only */

.ref-module-chat-thread-section {
  border-bottom: 1px solid var(--ifx-border-default);
}
.ref-module-chat-section-label {
  /* keep muted OR */
  color: var(--ifx-action-primary);
}
```

**REJECT:** `.ref-module-chat-bubble` (JS không emit).

---

## E. Component vs Module vs Page

| Candidate | Layer |
|---|---|
| taller `.ifx-chat` min-height | COMPONENT |
| thread flex + overflow-y | COMPONENT |
| item pad / name lh / preview block | COMPONENT |
| item time class | COMPONENT + B |
| header inset / title size / body pad | COMPONENT |
| bubble 60% + radius-xl + sibling gap | COMPONENT |
| **composer surface on `.ifx-chat-input`** | **COMPONENT** (highest visual fail) |
| section label / thread header chrome | MODULE (hooks đã có) |
| profile Card identity/rows | PAGE (keep Card) |
| Grid 8+4 | PAGE keep |

---

## F. Runtime DOM compatibility

| Class | JS? | Gate |
|---|---|---|
| `.ifx-chat-bubble` (+ sibling) | YES | PASS |
| `.ifx-chat-input` | YES | PASS |
| `.ifx-chat-message.is-sent` | YES | PASS |
| `.ifx-chat-meta` | NO on new messages | existing gap; don’t invent new bubble-meta class |
| `.ifx-chat-item*` | items not generated | static/sandbox only — Component still correct owner |
| `.ref-module-chat-bubble` | NO | **REJECT** |

---

## G. Structural differences (NOT auto “missing CSS”)

| Difference | Cause poor visual? | Coherent without copy? |
|---|---|---|
| 3-pane vs 2-pane + Card | Partial — two surfaces. Not the composer/time/bubble defects | **YES** — Card beside Chat is valid PAGE compose |
| 280 vs 256 thread | Low | YES — keep 256 token |
| viewport height vs min-256 | **Yes** — squat pane | YES — raise Component min-height; not `100vh` AppShell |
| profile in-shell vs Card | Medium — height mismatch | YES — taller Chat + grid stretch; keep Card |

---

## Answer

**CAN_CANONICAL_CHAT_BE_FIXED_WITHOUT_STRUCTURAL_REWRITE = YES**

Most “xấu” is Component CSS gap (composer, bubble density, item time, pane min-height) plus W07 not loading Form. Not a reason to delete `.ifx-chat` or fold profile into the shell.
