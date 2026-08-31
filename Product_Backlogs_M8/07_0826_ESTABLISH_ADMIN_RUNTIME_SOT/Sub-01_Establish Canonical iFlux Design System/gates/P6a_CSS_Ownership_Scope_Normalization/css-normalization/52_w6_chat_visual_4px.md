# W6 Chat — đóng 4px composer

**Date:** 2026-08-31  
**Baseline:** `2c90856` isolate  
**Trước:** [51_w6_chat_visual_parity.md](51_w6_chat_visual_parity.md) — input 659 vs 663

## Root cause

Composer Canonical bọc mic/clip trong `.ifx-chat-input-actions { gap: 4px }` → mất 1 gap `--ifx-space-8` so với Legacy (4 sibling, 3 gap). Input flex:1 rộng hơn **4px**.

Thêm: `min-width: 0` trên input/stack (Legacy không có) và `border: none` trên icon btn (Legacy `1px transparent`) — chỉ lộ khi pane hẹp.

## Sửa (Canonical only)

| File | Việc |
|---|---|
| `04_components/05_chat/chat.css` | actions `display: contents` (slot giữ, box biến mất); bỏ `min-width:0` input; icon btn border 1px transparent + `.ti` 16px |
| `patterns/chat/index.html` | icon composer/header = `.ti` (bỏ `.ifx-icon-sm` ép box 16) |

Không Pattern CSS. Không `.ix-*`. 0 `@media` Chat.

## Metric (Chrome, dark, iframe 1440×900 / 768 / 390)

| VP | Node lệch | Δ |
|---|---|---|
| 1440 | workspace … input 659.41 · send 82.09 · icon 32 | **0** |
| 768 | input 183 · icon 18 · bubble 75.14 · panes 280/208.5/240 | **0** |
| 390 | row · thread 280 · main 0 · details 240 · bubble 37.97 · input 183 | **0** |

## Behavior

Select thread + sync header/details. Send + Enter → `.is-sent` + ring + clear input. Console pageerror = 0. Governance PASS.

## Gates

```
VISUAL_1440_DELTA               = 0
VISUAL_768_DELTA                = 0
VISUAL_390_DELTA                = 0
MATERIAL_VISUAL_DELTA           = 0
BEHAVIOR_REGRESSION             = 0
PATTERN_CHAT_CSS / JS           = 0
CHAT_W6                         = PASS
VISUAL_PARITY                   = PASS
```

Owner nghiệm thu: [https://staging.iflux.vn/ui_tooling/workbench/?area=patterns&pattern=chat](https://staging.iflux.vn/ui_tooling/workbench/?area=patterns&pattern=chat)
