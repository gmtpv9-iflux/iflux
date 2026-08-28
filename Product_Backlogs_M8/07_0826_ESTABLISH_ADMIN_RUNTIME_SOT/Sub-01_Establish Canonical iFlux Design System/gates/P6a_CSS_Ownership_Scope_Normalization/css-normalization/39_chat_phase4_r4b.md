# P6a — Chat Phase 4 — R4-B

**Date:** 2026-08-28  
**Strategy:** R4-B (Phase 3 approved)  
**Baseline:** isolate `37` + mapping `38`

```
CHAT_CANONICAL_EXISTING_APPLIED = PASS
CHAT_PATTERN_LOCAL_NORMALIZED = PASS
UNUSED_LEGACY_SELECTOR_COUNT = 0
MATERIAL_VISUAL_DELTA = 0
BEHAVIOR_MISMATCH = 0
REFERENCE_LAYERS_NEW_RULE = 0
GLOBAL_CHAT_CHANGED = NO
```

Không extend Global Chat. Không implement MG01–MG06.

---

## A. Canonical linked

Sau `chat.css` (dump token / rem 15px giữ). **Không** `reset.css` / `typography.css` / `primitives.css` / `components/chat` / `reference-layers.css`.

| File | Why |
|---|---|
| `design_system/foundation/icons/vendor/tabler/tabler-icons.min.css` | CAN_MAP Tabler asset |
| `design_system/tokens/generated/css/semantic.css` | token names Avatar consume |
| `design_system/tokens/generated/css/themes/dark.css` + `light.css` | `--ifx-*` theme |
| `design_system/primitives/avatar/avatar.css` | 4 occurrence map |

Fonts BeVietnamPro vẫn Admin path (cùng typeface Legacy).

---

## B. CAN_MAP_EXISTING applied

| Occurrence | Map? | Why |
|---|---|---|
| Tabler `.ti` | YES — href DS vendor | Glyph + class list Δ 0 |
| CM / NM / JC / SG | YES — `.ifx-avatar.ifx-avatar-sm` + info/danger/warning/success | Không presence, không size override; computed Δ 0 |
| FR + WM (dot 8px) | **NO** | `.ifx-avatar { overflow:hidden }` cắt presence |
| Header FR `font-size:12px` | **NO** | fs override; chưa chứng minh 0 |
| Message FR `font-size:11px` | **NO** | same |
| Rail FR 56×56 | **NO** | size 56 ≠ sm 28 |
| John 32 / JD 28 `.ix-avatar` | **NO** | không phải avatar-sm; ring 36 |

---

## C. Pattern-local kept

`patterns/chat/chat.css` (~47 KB): token `:root` / `[data-theme]` + reset + `.ix-content` + unmapped `.ix-avatar*` + `.ix-btn*` + toàn bộ `.ix-chat-*`.

`patterns/chat/chat.js` = PatternChat (không đổi).

3-pane, 280, 240, bubble 10×14 / r12 / 60%, item 10×16, composer, labels, search inline, copy Legacy.

---

## D. Unused dump

Trước: 858 unique / 811 dead.  
Sau: **45** selector, tất cả required:

`*` / `html` / `body` / `:root` / `[data-theme]` / `.ix-content` / `.ix-avatar*` consumed / `.ix-btn*` consumed / 22 `.ix-chat-*`.

`UNUSED_LEGACY_SELECTOR_COUNT = 0`

---

## E. Không làm

- `design_system/components/chat/*` — git diff rỗng  
- `reference-layers.css` — 0 rule mới; Pattern không link  
- MG01–MG06 — chỉ còn candidate (bubble pad, composer, 32/56, group-label 11/accent, IfxChat emit)  
- 2-pane / Page Header / đổi copy  

---

## F. Regression vs Legacy `.ix-content` (dark)

| | 1440 | 768 | 390 |
|---|---|---|---|
| TEXT / ICON | 0 | 0 | 0 |
| Sidebar 280 / profile 240 | 0 | 0 | 0 |
| Layout height 760 | 0 | 0 | 0 |
| Bubble 60% / 10×14 / r12 | 0 | 0 | 0 |
| Item pad 10×16 | 0 | 0 | 0 |
| Avatar computed (scoped) | 0 | 0 | 0 |
| html rem / overflow-x | 15 / hidden | same | same |

1440 layout width +260 = gỡ AppShell (cố ý).

6 click + Send + Enter = PASS.

---

## G. MG candidate register (không mở wave này)

MG01 item · MG02 bubble pad/font · MG03 emit avatar+time · MG04 composer · MG05 avatar 32/56/accent/ring · MG06 group-label 11/accent. Cần cross-consumer trước khi mở DS.

---

STOP. Không mở task extend Global Chat.
