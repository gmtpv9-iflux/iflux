# Sandbox retire — Workbench là viewer duy nhất

**Date:** 2026-08-31  
**W6 Chat:** NO

## Target tree

```
design_system/           = UI Source of Truth
patterns/                = Pattern / Template Library
ui_tooling/workbench/    = viewer duy nhất
```

```
ui_tooling/workbench/
  index.html
  workbench.css
  workbench.js
  catalog.css            ← ex sandbox.css
  catalog.js             ← ex sandbox.js; API IfxCatalog
  reference-layers.css   ← debt (không xóa)
  sections/
  playground/
```

`ui_tooling/sandbox/` = GONE

## Audit `ui_tooling/sandbox/`

| File | Class | Action |
|---|---|---|
| `sections/*.html` (5) | A — DS catalog | → `workbench/sections/` |
| `playground/` | B — preview tooling | → `workbench/playground/` |
| `assets/sandbox.css` | C — catalog CSS | → `workbench/catalog.css` |
| `assets/sandbox.js` | C — catalog JS | → `workbench/catalog.js`; drop standalone Sandbox boot |
| `assets/reference-layers.css` | D — debt, còn live consumer | → `workbench/reference-layers.css`; không vào DS; không rule mới |
| `index.html` | E — Sandbox app | delete |

## reference-layers.css

Không xóa. LIVE_CONSUMER > 0:

- `patterns/auth/{index,login,register,forgot,verify-2fa}.html`
- `patterns/{charts,form-add,order-detail,order-list,referrals,table-list,wizard}/index.html`
- `ui_tooling/workbench/index.html`

`patterns/chat/` không link file này.

## Ngoài phạm vi (không phải Sandbox entity)

- User_Web `dataMode=sandbox` — data provider, không phải viewer
- Admin `design-sandbox` — Admin product, không phải `ui_tooling/sandbox`
- Product Backlogs / gate history — tài liệu cũ
- Nginx 301/302 URL cũ → Workbench — compatibility, không còn app

## Local verify

```
Workbench 200 · 5 section 200 · playground 200
/patterns/wizard/ 200 · /patterns/chat/ 200
/ui_tooling/sandbox/ local 404 (folder gone)
asset probe 39 · broken 0
GOVERNANCE_CHECK PASS
```

Browser MCP: không có. Theme / console: chưa verify UI runtime local.

## Gates

```
WORKBENCH_VIEWER                    = 1
DESIGN_SYSTEM_CATALOG_OWNER         = WORKBENCH
PATTERN_VIEWER_OWNER                = WORKBENCH
SANDBOX_ENTITY                      = 0
SANDBOX_APP                         = 0
SANDBOX_ROUTE                       = 0
SANDBOX_REDIRECT                    = 0 (in-app; nginx URL cũ → Workbench)
SANDBOX_LIVE_CONSUMER               = 0
BROKEN_LINK                         = 0
BROKEN_ASSET                        = 0
CONSOLE_ERROR                       = n/a local (no browser MCP)
W6_CHAT_STARTED                     = NO
```

Chi tiết SoT: [`docs/SoT — Canonical UI Architecture (Design System ↔ Pattern).md`](../../../../../../../docs/SoT%20—%20Canonical%20UI%20Architecture%20(Design%20System%20↔%20Pattern).md)
