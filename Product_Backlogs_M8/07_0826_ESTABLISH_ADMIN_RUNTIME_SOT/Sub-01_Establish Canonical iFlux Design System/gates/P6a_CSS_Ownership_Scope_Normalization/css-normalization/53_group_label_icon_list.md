# Promote Group Label + Icon List

**Date:** 2026-08-31

| Legacy / Sai owner | Canonical | File Owner | Result |
|---|---|---|---|
| `.ifx-chat-details-label` 11/600/uppercase/.5/muted/mb10 | `.ifx-group-label` (REPLACE contract cũ 12/0.8) | `02_foundation/typography.css` | Δ = 0 |
| `.ifx-chat-details-list` | `.ifx-icon-list` | `04_components/20_icon-list/icon-list.css` | Δ = 0 |
| `.ifx-chat-details-row` | `.ifx-icon-list-item` | cùng | Δ = 0 |
| `.ifx-chat-details-action` + `.is-danger` | `.ifx-icon-list-item.is-action` + `.is-danger` | cùng | Δ = 0 |

Chat consumer: `patterns/chat/index.html` — composition only.

```
GLOBAL_GROUP_LABEL              = PASS
GLOBAL_ICON_LIST                = PASS
CHAT_DETAILS_LABEL_RULE         = 0
CHAT_DETAILS_LIST_RULE          = 0
CHAT_DETAILS_ROW_RULE           = 0
DUPLICATE_VISUAL_RULE           = 0
PATTERN_OVERRIDE                = 0
MATERIAL_VISUAL_DELTA           = 0
```

Staging: [https://staging.iflux.vn/ui_tooling/workbench/?area=patterns&pattern=chat](https://staging.iflux.vn/ui_tooling/workbench/?area=patterns&pattern=chat)
