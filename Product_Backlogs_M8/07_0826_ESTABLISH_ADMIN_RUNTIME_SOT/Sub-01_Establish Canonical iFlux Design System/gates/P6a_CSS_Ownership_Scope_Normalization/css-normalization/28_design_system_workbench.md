# P6a — Design System Workbench — Shared AppShell

**Date:** 2026-08-28  
> **moved 2026-08-28:** Workbench query canonical `?area=design-system|patterns`. Alias `?module=sandbox|patterns`. Iframe `/patterns/…`.  
**Mode:** AUDIT + IMPLEMENT  
**Visual reference:** Admin `patterns/table-list.html` (sidebar | main)

```
DESIGN_SYSTEM_SHARED_APPSHELL = PASS
SIDEBAR_SINGLE_OWNER = PASS
SANDBOX_MODULE_IN_SHELL = PASS
PATTERNS_MODULE_IN_SHELL = PASS
SANDBOX_GRID_NORMALIZED = PASS
PATTERN_NESTED_SIDEBAR = 0
USER_PROFILE_REGRESSION = PASS
BUTTON_OUTLINE_DANGER_CATALOG = PASS
PROGRESS_SM_CATALOG = PASS
RESPONSIVE = PASS
SCROLL = PASS
```

Entry: [design_system/workbench/](https://staging.iflux.vn/design_system/workbench/)  
Legacy catalog URL `/design_system/sandbox/?section=…` redirects into the workbench.

---

## A. Admin Sidebar source audited

`Admin_Design_system/patterns/table-list.html` → `.ix-root > .ix-layout > aside.ix-sidebar + main.ix-main`

CSS owner: `Admin_Design_system/iflux-admin-ui/components.css`

| Responsibility | Admin fact |
|---|---|
| Width | `--ix-sidebar-w` → 260px (admin-platform token `--ifx-size-sidebar-w`) |
| Collapsed | 72px, labels hidden |
| Position | `fixed; top/left/bottom: 0; overflow-y: auto` |
| Background / border | `--ix-bg-sidebar` + 1px `--ix-border` |
| Brand | height `--ix-navbar-h` (64px), bold title |
| Group label | `.ix-menu-header` uppercase 10 / 600 / tracking .8px |
| Item | flex, gap inline-md, pad 9×20, hover `--ix-bg-hover`, active `--ix-bg-active` + 3px accent rail |
| Icon | Tabler `.ti` 18px / 20px box |
| Mobile | `< 1200px` translateX(-100%), `.ix-sidebar-open` + overlay |
| Scroll | sidebar independent; main `.ix-content` overflow-y auto; html/body overflow hidden |

JS toggle: `iflux-admin-ui.js` (desktop collapse vs mobile drawer). **Not copied.** Admin runtime not loaded.

---

## B. Shared AppShell ownership

```
Existing owner / file: none in design_system
Why cannot modify:
  - foundation/layout.css = container/stack/inline/grid only
  - primitives/navigation/nav.css LOCK: no side-nav / top-bar (structure = platform)
  - sandbox = module content, not shell
New responsibility: Design System workbench AppShell (chrome + host + route)
Removal: sandbox horizontal primary nav is no longer the shell
```

**Path:** `design_system/workbench/`  
Sibling of `sandbox/` and `references/`. One shell. Not Foundation, not Primitive, not Component, not Admin.

Classes: `.ifx-appshell*` (Canonical `ifx-` prefix + AppShell role).  
Nav units reuse `.ifx-nav-item` / `.ifx-nav-icon` / `.ifx-nav-label` / `.ifx-group-label`.

---

## C. Files created / changed

**Created**

- `design_system/workbench/index.html`
- `design_system/workbench/workbench.css`
- `design_system/workbench/workbench.js`
- `design_system/workbench/patterns-catalog.html`
- `design_system/index.html` (redirect)

**Changed**

- `design_system/sandbox/index.html` → redirect preserving query
- `design_system/sandbox/assets/sandbox.js` — hosted API `IfxSandbox`, section fetch from sandbox dir
- `design_system/sandbox/assets/sandbox.css` — stage padding = `--ifx-space-container`
- `design_system/sandbox/sections/foundation.html` — playground src works from workbench
- `design_system/sandbox/sections/primitives.html` — outline-danger + progress sm/default/lg + gap
- `design_system/sandbox/sections/components.html` — toast row gap
- `design_system/sandbox/sections/contract.html` — **deleted 2026-08-28** (Contract section removed)
- `design_system/foundation/layout.css` — `.ifx-gap-xs|sm|md` (missing generic gap)
- 9 Canonical pattern `page.js` — `postMessage` theme apply (mount only)
- this report + evidence

Not edited: `avatar.css`, `chip.css`, `title.css`, `badge.css`, tokens, User Profile HTML/CSS, Chat CSS, Admin runtime.

---

## D. Sidebar DOM ownership

One `<aside class="ifx-appshell-sidebar">` inside `#ifxAppshell`.  
Not inside Sandbox fragments. Not inside Pattern documents.  
Count at every route: **1**.

---

## E. Sidebar CSS ownership

| Piece | Owner |
|---|---|
| Item / group / icon / label / active fill | Primitive `nav.css` |
| Width / brand / rail / collapse / overlay / host scroll | Workbench `workbench.css` |
| Local residual | width **260px**, collapsed **72px**, rail **3px** — Admin measure. Canonical has no sidebar-w token (that token is admin-platform). No new global token. |

---

## F. Routing model

```
?module=sandbox&section=primitives&panel=button
?module=patterns
?module=patterns&pattern=user-profile
```

Missing `module` + present `section` → sandbox.  
Deep link, back/forward, hard refresh restore the same view.  
Shell is not recreated. History is owned by `workbench.js`.

Old `sandbox/?section=…` → `workbench/?module=sandbox&section=…`.

---

## G. Sandbox Module changes

Primary horizontal `sb-nav` removed from the live surface.  
Local `sb-subnav` (Title / Button / Chip / …) kept.  
Theme toggle moved to AppShell bar (`IfxTheme`, same key).

P5 Compose (`section=patterns`) and Wave notes (`section=references`) remain loadable by URL; they are not on the locked Sidebar IA.

---

## H. Sandbox grid / layout

- Stage padding = `--ifx-space-container` (responsive gutter, not a second scale)
- Demo rows: `.ifx-flex.ifx-flex-wrap.ifx-gap-sm`
- Catalog / token swatches keep existing CSS grid
- Section siblings keep `.ifx-stack-*`

---

## I. Patterns Module changes

First-class sibling under the same AppShell.  
Catalog = 10 existing references. No menu item for a missing page.

---

## J. Pattern hosting strategy

**B — iframe inside the Pattern host.**

Why not direct mount: each reference is a full HTML document (own tokens/foundation or Legacy dump). User Profile CSS dump + rem 15px would collide with the workbench document. Chat is locked. Owner forbade rewriting every Pattern this wave.

iframe = isolation boundary, **not** a second AppShell. Pattern documents have no Admin sidebar.

---

## K. User Profile regression

Opened via Patterns → User Profile:

- Accepted visual intact (hero 90, Suspend outline-danger, billing progress-sm)
- Nested Admin/workbench sidebar inside iframe = **0**
- Document scroll inside iframe: scrollY 400 works (scrollHeight 1564)
- Tabs: 4; Affiliate click → `tab-affiliate.active`
- Edit remains inert (not exercised as a write)
- Canonical migrations from `fe4c294` remain

Theme: UP still uses legacy `iflux-theme`. Workbench uses `ifx-theme`. Not synced. No UP file change.

---

## L. Primitive catalog sync

Button catalog shows Danger, Outline, **Outline Danger** (`.ifx-btn-outline-danger`).  
Progress catalog shows **Small** (`.ifx-progress-sm`), Default, **Large**.  
No Sandbox reimplementation of those classes.

---

## M. Responsive

| Viewport | Sidebar | Horizontal overflow |
|---|---|---|
| 1440 | 260px persistent | 0 |
| 1024 | 260px persistent | 0 |
| 768 | off-canvas `translateX(-260)` | 0 |
| 390 | off-canvas; menu opens overlay | 0 |

Breakpoint = Canonical `lg` 1024 (not Admin 1199.98 — media literals locked).  
390: no permanent 260px sidebar.

---

## N. Scroll

| Surface | Owner |
|---|---|
| html/body | `overflow: hidden` on workbench root |
| Sidebar | `overflow-y: auto` — at 600px viewport scrollTop moved (762 > 600) |
| Main host | `overflow-y: auto` (sandbox) |
| Pattern host | `overflow: hidden`; iframe document scrolls |
| Dead wheel / trap | none observed |

---

## O. Duplicate Sidebar count

`PATTERN_NESTED_SIDEBAR = 0`  
Workbench sidebar instances = **1** on every tested route.

---

## P. Evidence

`css-normalization/evidence/design-system-workbench/`

- sandbox-button-1440 / 1024 / 768 / 390
- sandbox-progress-1440
- patterns-catalog-1440
- pattern-user-profile-1440
- mobile-sidebar-open-390

---

## Q. Unresolved architecture debt

1. Pattern host = iframe until a later wave can extract pattern bodies safely.
2. User Profile theme key (`iflux-theme`) ≠ workbench `ifx-theme`.
3. Sandbox `section=patterns` (P5 compose) and `section=references` (wave notes) are deep-link only.
4. `--ifx-size-sidebar-w` stays admin-platform; workbench keeps 260/72 residuals.
5. No favicon (pre-existing 404). Not a gate.

---

## Final

```
DESIGN_SYSTEM_SHARED_APPSHELL = PASS
SIDEBAR_SINGLE_OWNER = PASS
SANDBOX_MODULE_IN_SHELL = PASS
PATTERNS_MODULE_IN_SHELL = PASS
SANDBOX_GRID_NORMALIZED = PASS
PATTERN_NESTED_SIDEBAR = 0
USER_PROFILE_REGRESSION = PASS
BUTTON_OUTLINE_DANGER_CATALOG = PASS
PROGRESS_SM_CATALOG = PASS
RESPONSIVE = PASS
SCROLL = PASS
```

STOP. No Component residual classification, Chat canonicalization, User Profile redesign, Group Label, or F0/F1/F2 remap.
