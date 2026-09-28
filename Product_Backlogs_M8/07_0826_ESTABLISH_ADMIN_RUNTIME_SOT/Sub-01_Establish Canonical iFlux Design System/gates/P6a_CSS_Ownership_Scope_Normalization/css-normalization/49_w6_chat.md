# W6 Chat — Canonical migrate

**Date:** 2026-08-31  
**Baseline:** Legacy `patterns/chat/` isolate  
**Mapping:** [42_chat_max_ds_mapping_audit.md](42_chat_max_ds_mapping_audit.md)  
**Workbench lock:** [48_workbench_lock.md](48_workbench_lock.md)

## Owner chain

```
01_tokens (avatar-32 / avatar-xl)
→ 02_foundation (fonts, reset, type, layout, icons)
→ 03_primitives (avatar extend, button reuse)
→ 04_components/12_search (embedded)
→ 04_components/05_chat (workspace 2/3, details, JS)
```

Không nhảy `05_widgets`. Không rule `reference-layers.css`.

## Pattern còn lại

`patterns/chat/index.html` + `page.js`  
= markup demo + `IfxChat.init()` + theme postMessage.

Đã xóa: `patterns/chat/chat.css` · `patterns/chat/chat.js` · `PatternChat`.

## Coverage

```
DS_OWNED                    = 37/37
PATTERN_EXCEPTION           = 2 (fixture + host) — justified
EXCLUDE_RUNTIME             = 7
DESIGN_SYSTEM_COVERAGE      = 100% mappable (≥ 99%)
```

## Local leftover

```
LEGACY_CLASS                = 0
LEGACY_TOKEN                = 0
LEGACY_ASSET_PATH           = 0
LEGACY_JS_SELECTOR          = 0
INLINE_STYLE                = 0
PATTERN_CHAT_CSS            = 0
PATTERN_CHAT_COMPONENT_JS   = 0
REFERENCE_LAYERS_CHAT       = 0
GOVERNANCE_CHECK            = PASS
TOKEN_VERIFY                = 47 mismatch = HEAD baseline
```

## Visual / behavior

Contract absorb: thread 280 · details 240 · item 10×16 · bubble 10×14 / 14 · composer 8×14.  
Offset Admin `100vh-140` xóa. Dưới 768 stack 3 pane (sửa main width 0).

Browser MCP: không có. Click/theme/console/pixel 1440·768·390 không đo được trên máy này.

## Gates

```
WORKBENCH_CONSOLIDATION         = LOCKED
CHAT_W6                         = PASS (contract + leftover; visual pixel n/a)
DESIGN_SYSTEM_COVERAGE          >= 99%
PATTERN_VISUAL_AUTHORITY        = 0
PATTERN_CHAT_CSS                = 0
PATTERN_CHAT_COMPONENT_JS       = 0
LEGACY_* / INLINE / UNMAPPED    = 0
REFERENCE_LAYERS_CHAT_CONSUMER  = 0
MATERIAL_VISUAL_DELTA           = n/a browser
BEHAVIOR_REGRESSION             = n/a browser
CONSOLE_ERROR                   = n/a browser
BROKEN_ASSET                    = (local/staging probe)
```

SoT: [`docs/SoT — Canonical UI Architecture (Design System ↔ Pattern).md`](../../../../../../../docs/SoT%20—%20Canonical%20UI%20Architecture%20(Design%20System%20↔%20Pattern).md)
