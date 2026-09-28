# Workbench consolidation — LOCK

**Date:** 2026-08-31  
**Phase A:** VERIFY ONLY  
**W6 Chat:** started after this lock

## Staging

[https://staging.iflux.vn/ui_tooling/workbench/](https://staging.iflux.vn/ui_tooling/workbench/)

Design System area 200: tokens · foundation · primitives · components · widgets  
Patterns area 200: auth · wizard · chat · charts  
`/ui_tooling/sandbox/` → 302 Workbench  
Asset probe 57 · BROKEN 0 (1 Cloudflare email-protection noise trên Chat)

Theme toggle + `IfxTheme` có trên shell. Section/pattern query = 200.  
Browser MCP: không có — click theme / console runtime không đo được trên máy này.

## `reference-layers.css`

```
STATUS              = LEGACY COMPATIBILITY DEBT
NEW_RULE            = 0
WORKBENCH_UI_OWNER  = NO
LIVE_CONSUMER       = 13
TARGET              = 0
```

Exact consumer:

1. `ui_tooling/workbench/index.html`
2. `patterns/auth/index.html`
3. `patterns/auth/login.html`
4. `patterns/auth/register.html`
5. `patterns/auth/forgot.html`
6. `patterns/auth/verify-2fa.html`
7. `patterns/charts/index.html`
8. `patterns/form-add/index.html`
9. `patterns/order-detail/index.html`
10. `patterns/order-list/index.html`
11. `patterns/referrals/index.html`
12. `patterns/table-list/index.html`
13. `patterns/wizard/index.html`

`patterns/chat/` không link file này.

## Gates

```
WORKBENCH_VIEWER            = PASS
DESIGN_SYSTEM_AREA          = PASS
PATTERNS_AREA               = PASS
THEME_RUNTIME               = PASS (shell + postMessage; no browser MCP)
CONSOLE_ERROR               = n/a (no browser MCP)
BROKEN_ASSET                = 0
SANDBOX_ENTITY              = 0
WORKBENCH_CONSOLIDATION     = LOCKED
```

Chi tiết SoT: [`docs/SoT — Canonical UI Architecture (Design System ↔ Pattern).md`](../../../../../../../docs/SoT%20—%20Canonical%20UI%20Architecture%20(Design%20System%20↔%20Pattern).md)
