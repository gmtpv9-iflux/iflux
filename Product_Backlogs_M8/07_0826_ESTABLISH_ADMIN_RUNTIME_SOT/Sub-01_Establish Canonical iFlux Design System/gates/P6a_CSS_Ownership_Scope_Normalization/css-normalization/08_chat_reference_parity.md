# P6a — Chat Reference Parity

**Date:** 2026-08-27  
**Owner:** MODULE / FEATURE — Chat  
**CHAT_PARITY = PASS**

---

## A. Legacy → canonical replacement

| Legacy | Canonical |
|---|---|
| `.ix-chat-layout` | `.ref-module-chat-layout` |
| `.ix-chat-sidebar` | `.ref-module-chat-sidebar` |
| `.ix-chat-sidebar-header` | `.ref-module-chat-sidebar-header` |
| `.ix-chat-list` | `.ref-module-chat-list` |
| inline search | `.ifx-search.ref-module-chat-search` (`max-width: none`) |
| inline section label | `.ref-module-chat-section-label` |
| item text wrapper | `.ref-module-chat-item-content` + `.ref-module-chat-item-row` |
| `.ix-chat-item-time` | `.ref-module-chat-item-time` (`font-size-2xs`) |
| `.ix-chat-item-name/preview` | keep `.ifx-chat-item-name/preview` |
| header name/role inline | `.ref-module-chat-title` / `.ref-module-chat-role` |
| `.ix-chat-main/header/body/footer` | `.ifx-chat-main/header/body` + module header/messages/composer |
| `.ix-chat-bubble` 60%/12px | `.ref-module-chat-bubble` + keep `.ifx-chat-bubble` surface |
| inline bubble `margin-top:6` | `.ref-module-chat-message-group` `gap: space-8` |
| `.ix-chat-input` | `.ifx-input.ifx-chat-input.ref-module-chat-composer-input` + `form.css` |
| `.ix-chat-profile` | `.ref-module-chat-profile` |
| profile identity/groups | `.ref-module-chat-profile-identity/group/rows/row` |
| `--ix-*` | `--ifx-*` only |
| `calc(100vh - 140px)` AppShell | `calc(100vh - 12.5rem)` Reference chrome |
| 280 / 240 | Module geometry (not Global tokens) |

## B. Owner per added rule

All new rules = **MODULE** (`.ref-module-chat-*` in `reference-layers.css`).  
Reused Global: Layout tokens, Avatar, Search, Button, Input, `.ifx-chat-item/bubble/message`.

## C. Global additions

**0.** No token, no chat.css edit, no Search size API.

## D. Module Chat additions

Shell, sidebar, list scroll, search width, section label, item content/time, conversation header/title/role, message group, bubble density, composer flex, profile pane + identity + info rows + actions.

## E. Removed

- Grid 8+4 + external Card around profile  
- `.ifx-chat` 2-pane wrapper on this Reference  
- Chip on profile role  
- `.ref-page-chat-identity` / `.ref-page-chat-meta`  
- `chip.css` / `card.css` from W07 head  
- empty hook `.ref-module-chat-thread-section`

## F. DOM before → after

```
BEFORE: Grid → [ifx-chat: thread|main] + [Card profile]
AFTER:  .ref-module-chat-layout
        ├── sidebar (header + list)
        ├── conversation (header + body + composer)
        └── profile (identity + info + options)
```

## G. Measurements (local, 1440 dark)

| | Legacy staging | Canonical after |
|---|---|---|
| Shell | 1120×760 | 1216×700 (container-max) |
| Sidebar | 280, list overflow auto | 280×698, list 601 overflow auto |
| Profile | 240 in-shell | 240×698, border-left, no Card |
| Cards | 0 in shell | **0** |
| Bubble | 60%, radius 12, pad 10×14 | 60%, radius 12 (`radius-xl`), pad 8×12 |
| Time | ~9–10px | 10px (`2xs`) |
| Composer | field chrome | Input: pad 8×12, border, radius 6, flex 1 |
| Theme | dark surface | dark `rgb(43,44,64)` / light white |

## H. Responsive

| Width | Result |
|---|---|
| 1440 | 3 pane 280 + flex + 240 |
| 768 | 2 pane + profile row below (max-height 14rem) |
| 390 | column stack, no overflow-x |

## I. Changed files

- `design_system/sandbox/assets/reference-layers.css`
- `design_system/references/patterns/chat/index.html`

## J. Regression

1440 dark/light, 768, 390: PASS shell, panes, scrolls, hierarchy, composer surface, no Card, no `ix-*`, no inline style.

## K. Residual vs Legacy (intentional)

- Avatar profile **48** (`avatar-lg`) not 56 — no new Global size  
- Search height **36** (Global Search) not 33 compact  
- Section label **muted** not accent hex  
- Sent surface = `--ifx-action-primary` (dark token happens to match old accent)  
- Options stay Button ghost, not bare text rows  
- Bubble pad 8×12 (canonical input/space) not 10×14  
- Height uses Reference header offset, not AppShell 140px  
- JS-sent new bubbles keep Component class only (no module bubble class)

CHAT_PARITY = **PASS**
