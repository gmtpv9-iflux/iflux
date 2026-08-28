# Visual + Contract sections removed

**Date:** 2026-08-28  
**Mode:** DELETE — không hide / `display:none` / flag.

Viewport playground giữ tại Foundation (`#pgVpBar`). Theme toggle giữ tại Workbench toolbar (`#ifxAppshellTheme`). Không còn section độc lập Visual / Contract.

---

## Deleted

- `design_system/sandbox/sections/visual.html`
- `design_system/sandbox/sections/contract.html`

## Router / nav

- Workbench nav: bỏ Visual Test, Contract
- `SANDBOX_SECTIONS` / `SECTIONS` = tokens, foundation, primitives, components, widgets
- URL cũ `section=visual|contract` → `RETIRED_SECTIONS` → Foundation/Components (không load file đã xóa)

## Orphan scan (live HTML/JS/CSS/YML)

`visual.html` / `contract.html` / `section=visual` / `section=contract` / `data-wb-section=visual|contract` = **0** hit sống.

`RETIRED_SECTIONS` chứa `'visual','contract'` chỉ để normalize bookmark cũ — không serve section.

---

```
VISUAL_SECTION_REMOVED = PASS
CONTRACT_SECTION_REMOVED = PASS
LIVE_REFERENCE = 0
```
