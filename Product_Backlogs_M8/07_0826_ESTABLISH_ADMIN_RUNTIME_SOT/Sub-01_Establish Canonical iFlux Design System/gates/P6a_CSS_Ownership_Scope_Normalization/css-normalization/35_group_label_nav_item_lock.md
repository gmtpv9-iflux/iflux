# Group label + nav item lock

**Date:** 2026-08-28  
**Scope:** Design System live CSS/HTML. Patterns: no consumer of the old class.

## Rename

`.ifx-nav-group-label` → `.ifx-group-label`

| File | Change |
|---|---|
| `design_system/foundation/typography.css` | New typography contract `.ifx-group-label` |
| `design_system/primitives/navigation/nav.css` | Removed old `.ifx-nav-group-label`; locked `.ifx-nav-item` base |
| `design_system/workbench/workbench.css` | Nav composition `.ifx-appshell-nav .ifx-group-label`; collapsed selectors renamed |
| `design_system/workbench/index.html` | Group titles Design System / Patterns |
| `design_system/sandbox/sections/primitives.html` | Demo Nhóm A / Nhóm B |
| `patterns/` | No HTML/CSS used the old class |

Repo search after change: **0** live `.ifx-nav-group-label` in `*.html` / `*.css` / `*.js`.

## Token check (Owner CSS vs Design System)

| Value in Owner CSS | Token | Status |
|---|---|---|
| `var(--ifx-font-size-12)` | alias of `--ifx-font-size-xs` = `0.75rem` | Có |
| `var(--ifx-font-weight-semibold)` | `600` | Có |
| `var(--ifx-text-muted)` | theme | Có |
| `var(--ifx-inset-card)` | `var(--ifx-space-16) var(--ifx-space-20)` | Có — **2 giá trị** |
| `var(--ifx-space-8)` / `var(--ifx-space-12)` | `0.5rem` / `0.75rem` | Có |
| `var(--ifx-font-size-sm)` | `0.8125rem` | Có |
| `var(--ifx-text-secondary)` | theme | Có |
| `var(--ifx-transition-color)` | color/bg/border transition | Có |
| `letter-spacing: 0.8px` | **không có token 0.8px** | Gần nhất: `--ifx-letter-spacing-caps: 0.08em` |
| `4px` (composition padding) | **không có token px** | Gần nhất: `--ifx-space-4: 0.25rem` (= 4px khi root 16px) |

Owner CSS được viết đúng như đã chốt, kể cả 2 raw value.

## Composition note

`padding: var(--ifx-inset-card) 4px` bung thành 3 cạnh vì `--ifx-inset-card` đã là 2 giá trị:

- top = `--ifx-space-16` (16px)
- left/right = `--ifx-space-20` (20px)
- bottom = `4px`

Workbench verify (1440): group label padding `16 / 20 / 4 / 20`. Sandbox group label không nằm trong `.ifx-appshell-nav` nên không nhận composition padding.

## AppShell nav-item

Đã bỏ `padding-inline: var(--ifx-space-20)` trên `.ifx-appshell-nav .ifx-nav-item` để không ghi đè padding đã lock (`8px 12px`). Giữ `position` / `width` / `border-radius` / rail `::before` (chrome sidebar, không nằm trong block Owner lock).
