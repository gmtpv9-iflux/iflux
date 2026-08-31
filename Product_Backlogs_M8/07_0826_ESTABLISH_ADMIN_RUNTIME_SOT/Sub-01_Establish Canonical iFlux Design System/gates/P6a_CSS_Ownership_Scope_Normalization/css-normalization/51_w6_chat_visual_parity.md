# W6 Chat — Visual parity recovery

**Date:** 2026-08-31  
**Audit:** [50_w6_chat_visual_diff.md](50_w6_chat_visual_diff.md)  
**Baseline:** `2c90856` isolate

## Root cause (không phải coverage)

1. `--ifx-inset-widget` không có trong DS → header thread + composer pad = 0  
2. Stack pane dưới 768 — Legacy **không** stack  
3. `height: auto` — Legacy `calc(100vh - 140px)`  
4. `html` 16px vs isolate 15px rem  
5. Theme.js `prefers-color-scheme` lật light (isolate default dark)

## Sửa (Canonical only)

| File | Việc |
|---|---|
| `04_components/05_chat/chat.css` | row 3-pane mọi VP; 280/240; `100vh-140`; inset-compact; host rem 15; slot btn/icon/title |
| `04_components/12_search/search.css` | embedded 7/10/7/32 · 13 · h 32 |
| `04_components/05_chat/chat.js` | emit + ring |
| `patterns/chat/index.html` | ring / bỏ ifx-icon sai size |
| `patterns/chat/page.js` | default dark nếu chưa có `ifx-theme` |

Không Pattern CSS. Không `.ix-*`. Không đổi architecture.

## Metric 1440 (Chrome getComputedStyle, cùng theme dark)

| Node | Legacy | Canonical | Δ |
|---|---|---|---|
| workspace | 1380×760 row r8 | 1380×760 | 0 |
| thread | 280 | 280 | 0 |
| main | 858 | 858 | 0 |
| details | 240 pad 20×16 gap 18.75 | cùng | 0 |
| item | 279×53 pad 10×16 | cùng | 0 |
| header | 858×63 | 858×63 | 0 |
| body | 858×639 gap 15 | cùng | 0 |
| bubble | 170×59 pad 10×14 r12 | cùng | 0 |
| search | 249×32 pad 7 10 7 32 | cùng | 0 |
| composer bar | 858×57 | cùng | 0 |
| input | 659×33 | 663×33 | **w 4px** |
| html fs | 15px | 15px | 0 |

## Viewport 390

Cả hai: row · root 360 · thread **280** · main **0** · details **240**. Không stack.

768: cùng contract (0 MQ Chat).

## Behavior

Select / send / emit `is-sent` + ring / scroll: smoke PASS.

## Gates

```
CANONICAL_OWNERSHIP             = PASS
DESIGN_SYSTEM_COVERAGE          >= 99%
LEGACY_CLASS                    = 0
LEGACY_TOKEN                    = 0
PATTERN_VISUAL_AUTHORITY        = 0
VISUAL_1440_DELTA               = 1 (composer input width 4px)
VISUAL_768_DELTA                = 0 (cùng CSS, không MQ)
VISUAL_390_DELTA                = 0 (pane geometry)
MATERIAL_VISUAL_DELTA           = 1
BEHAVIOR_REGRESSION             = 0
LEGACY_RESIDUAL                 = 0
CHAT_W6                         = FAIL
VISUAL_PARITY                   = FAIL
```

`CHAT_W6` không PASS khi còn 4px input. Owner nghiệm thu Staging.

Workbench: [https://staging.iflux.vn/ui_tooling/workbench/?area=patterns&pattern=chat](https://staging.iflux.vn/ui_tooling/workbench/?area=patterns&pattern=chat)
