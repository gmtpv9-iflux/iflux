# W6 Chat — Forensic visual diff

**Date:** 2026-08-31  
**Baseline:** `2c90856` `patterns/chat/` (pre-W6 isolate)  
**Current:** Staging / HEAD Canonical  
**CHAT_W6 before fix:** FAIL · MIGRATION = NOT COMPLETE

Không dùng coverage / legacy-class=0 làm acceptance.

## Token side effect

| Item | Legacy dump | Canonical now | DELTA |
|---|---|---|---|
| `html` font-size | `var(--ifx-text-body-md-size)` = 0.9375rem → **15px**; rem scale 15 | Foundation `html { 100% }` → **16px** | rem × 16/15 |
| `--ifx-inset-widget` | `12px 16px` (dump) | **không tồn tại** trong DS | padding header/composer = invalid → 0 |
| `--ifx-space-container` | 16 / 20 / 32 (dump MQ) | layout 16 / 20 / 24 / 32 | 1024–1279: 24 vs 32 |
| radius button/card/xl | 6 / 8 / 12 | 6 / 8 / 12 | 0 |
| space 4–20 rem | 0.25–1.25rem | cùng | 0 nếu html 16; ≠ nếu so pixel dump 15 |
| bubble/item/pane | px literal | px literal | 0 (không phụ thuộc rem) |

Không đổi Foundation `html 16%`. Chat page: `html.ifx-chat-host { font-size: var(--ifx-font-size-md) }` để rem khớp isolate.

## Viewport

Legacy: **0** `@media` trên `.ix-chat-*`. 1440 / 768 / 390 = **cùng 3 cột** (280 | main | 240). 390 main có thể width 0.

Current: stack dưới 768. **CẤM** — đây là “fix mobile”, không phải baseline.

---

## A. Toàn workspace

| | |
|---|---|
| LEGACY | `display:flex` (row). `height: calc(100vh - 140px)`. `min-height: 600px`. `overflow: hidden`. radius 8. border 1. bg surface |
| CURRENT | column mặc định; row chỉ ≥768. `height: auto` / 100%. **không** 140. overflow visible mobile |
| DELTA | layout + height + overflow |
| OWNER | Chat |
| FILE | `design_system/04_components/05_chat/chat.css` |

## B. Thread pane

| | |
|---|---|
| LEGACY | `width: 280px`. `flex-shrink: 0`. `border-right`. mọi viewport |
| CURRENT | 280 chỉ ≥768 + panes=3. Dưới 768: `flex:1`, `min-height:240`, `border-bottom` |
| DELTA | width / axis / border |
| OWNER | Chat |
| FILE | `chat.css` |

## C. Thread header / search

| | |
|---|---|
| LEGACY | pad `12 16`. Search: pad `7 10 7 32`, fs 13, icon abs left 10 fs 13, không ring |
| CURRENT | pad `var(--ifx-inset-widget)` = **invalid**. Search h 32, icon 16, pad-inline 8 |
| DELTA | header pad 0; search geometry |
| OWNER | Chat + Search embedded |
| FILE | `chat.css` · `04_components/12_search/search.css` |

## D. Thread item

| | |
|---|---|
| LEGACY | flex, gap 12, pad `10px 16px` |
| CURRENT | cùng |
| DELTA | 0 (class). `<button>` vs `<div>` — reset button 0 pad đã bù |
| OWNER | Chat |
| FILE | — |

## E. Active item

| | |
|---|---|
| LEGACY | `.active` → `--ix-bg-active` |
| CURRENT | `.is-active` → `--ifx-bg-active` |
| DELTA | 0 nếu token cùng giá trị theme |
| OWNER | Chat |
| FILE | — |

## F. Conversation header

| | |
|---|---|
| LEGACY | pad `12 20`. identity gap 10. name 14/600. role 12. avatar 28 fs **12** |
| CURRENT | pad 12 20. gap 10. name 14/600. role 12. avatar 28 fs **10** (sm/2xs) |
| DELTA | avatar initials 12→10 |
| OWNER | Chat |
| FILE | `chat.css` |

## G. Message body

| | |
|---|---|
| LEGACY | pad 20. gap 16. overflow auto |
| CURRENT | cùng token |
| DELTA | 0 (trừ rem root) |
| OWNER | Chat |
| FILE | — |

## H. Received message

| | |
|---|---|
| LEGACY | row, avatar-sm 28 no ring, bubble hover, time 10 |
| CURRENT | cùng |
| DELTA | 0 |
| OWNER | Chat |
| FILE | — |

## I. Sent message

| | |
|---|---|
| LEGACY | row-reverse. avatar **36 contract + ring 2 accent** bị override 28/11 + `margin-left:4`. bubble accent + `#fff` |
| CURRENT | avatar-sm **không ring**, không ml 4. text `--ifx-text-on-primary` |
| DELTA | ring / margin / (màu chữ nếu token ≠ #fff) |
| OWNER | Avatar slot Chat + Avatar ring |
| FILE | `chat.css` · `patterns/chat/index.html` (class ring) · `avatar.css` nếu ring thiếu |

## J. Avatar

| Size | LEGACY | CURRENT | DELTA |
|---|---|---|---|
| 32 self | `.ix-avatar` 36+**ring** + inline 32/12 + ml 4 | `.ifx-avatar-32` no ring | ring, ml, fs |
| 28 list | sm 28 / 10. presence 8+2 | sm 28. `::after` 8+2 | 0 nếu overflow visible |
| 28 header | sm + fs 12 | sm fs 10 | 2px type |
| 28 sent | `.ix-avatar` ring + 28/11 | sm no ring | ring |
| 56 details | sm + inline 56/20 | xl 56/20 | 0 |

OWNER: `03_primitives/02_avatar` (ring đã có) + Chat slot. FILE: `avatar.css` không đổi default 36; HTML + `chat.css`.

## K. Bubble

| | |
|---|---|
| LEGACY | max 60%. pad 10×14. r 12. fs 14. lh 1.5. stack mt 6 |
| CURRENT | cùng |
| DELTA | 0 |
| OWNER | Chat |
| FILE | — |

## L. Time / ticks

| | |
|---|---|
| LEGACY | 10 muted mt 4. sent right. ticks success 12 |
| CURRENT | cùng |
| DELTA | 0 |
| OWNER | Chat |
| FILE | — |

## M. Composer

| | |
|---|---|
| LEGACY | footer pad 12 16. input pad 8×14 r 6. Send + icon **14**. btn `border:none` w/h icon 32 |
| CURRENT | pad **invalid**. input cùng. icon **16**. btn `border:1px transparent` (box 32 gồm border) |
| DELTA | bar pad; send icon 14→16; icon-btn inner −2 |
| OWNER | Chat (không đổi Button global) |
| FILE | `chat.css` |

## N. Details pane

| | |
|---|---|
| LEGACY | 240 always. pad 20 16. gap 20. border-left |
| CURRENT | 240 chỉ ≥768. dưới 768 full width + border-top + stack |
| DELTA | width / axis |
| OWNER | Chat |
| FILE | `chat.css` |

## O. Labels

| | |
|---|---|
| LEGACY | Chats 11/600/accent/.5 pad 8 16 4. Details 11/muted/.5 mb 10 |
| CURRENT | cùng |
| DELTA | 0 |
| OWNER | Chat |
| FILE | — |

## P. Icons / buttons

| | |
|---|---|
| LEGACY | header i 16. search 13. send 14. details inherit ~12 |
| CURRENT | `ifx-icon-sm` = 16 everywhere used |
| DELTA | search +3; send +2; details +4 |
| OWNER | Chat slot; Search embedded |
| FILE | `chat.css` · `search.css` · markup bỏ `ifx-icon` chỗ size ≠ 16 |

---

## Sửa bắt buộc (canonical only)

1. `chat.css` — row 3-pane mọi viewport; 280/240; `calc(100vh - 140px)`; overflow hidden; `--ifx-inset-compact`; host rem 15; header avatar 12; composer/btn/icon slot; sent ring slot  
2. `search.css` — embedded pad 7/10/7/32, fs 13, icon 13 abs  
3. `index.html` — class ring / bỏ ifx-icon sai size  
4. Không Pattern CSS. Không `.ix-*`. Không đổi architecture.

## Gates trước sửa

```
VISUAL_1440_DELTA = N
VISUAL_768_DELTA  = N
VISUAL_390_DELTA  = N
MATERIAL_VISUAL_DELTA = N
CHAT_W6 = FAIL
```
