# P6a — TOKEN NORMALIZATION 04E  
# Final Token verify + layer lock

**MODE:** VERIFY + GOVERNANCE LOCK ONLY — no source / generated / rename / bind / Foundation / runtime change  
**Date:** 2026-08-28  
**Baseline:** Token 03 `2fb98c2` · 04A `e6c3b1a` · 04B `5341bda` · 04C `af1edc8` · 04D `bab67b9`

```text
TOKEN_LAYER = LOCKED
TOKEN_LAYER_READY_TO_LOCK = YES
```

No new Token wave is opened.

---

## A. Token 03 invariants

| Rule | Result |
|---|---|
| ONE TOKEN = ONE OWNER = ONE SOURCE DEFINITION | Hold |
| ONE CANONICAL COMPILER | `design_system/scripts/build-tokens.mjs` |
| Multiple owner-scoped source roots | 5 active, 0 orphan |
| Global source = Global responsibilities only | Hold |
| Generated = readonly | Hold |
| Collision = build fail | Gate still active |
| DUPLICATE OWNER | **0** |
| WRONG_OWNER | **0** |
| UNRESOLVED OWNER | **0** |
| GLOBAL → LOWER `{ref}` | **0** |
| Market ↔ Money Flow | **0** |

Inventory: **342** unique `--ifx-*` names.

---

## B. 04A

These eight remain absent from Global source + generated + Canon `var()`:

`--ifx-z-base` · `--ifx-z-raised` · `--ifx-z-onboarding` · `--ifx-duration-instant` · `--ifx-duration-slower` · `--ifx-ease-in` · `--ifx-ease-in-out` · `--ifx-radius-none`

Admin leftover `:root` define is runtime debt.

---

## C. 04B

| Check | Result |
|---|---|
| Toast | `var(--ifx-shadow-xl)` = 1 · `var(--ifx-shadow-modal)` = 0 |
| Modal | `var(--ifx-shadow-modal)` = 1 |
| Sandbox header | `var(--ifx-bg-surface)` |
| `--ifx-bg-navbar` source/generated | **0** |
| `--ifx-color-border-frost` source/generated | **0** |
| Dark `--ifx-border-default` | `rgba(207, 211, 236, 0.12)` |

---

## D. 04C

`--ifx-inset-compact` = 1 generated semantic definition.  
`--ifx-inset-widget` = 0 source · 0 generated · 0 Canon `var()`.  
Alert + Chat use `inset-compact`. No Canon alias. Leftover Admin/User_Web `var(--ifx-inset-widget)` = runtime debt.

---

## E. 04D

`--ifx-space-container` / `--ifx-grid-gutter` are **not** token-source entries. Generated semantic = 0. Token-index = 0.  
Sole Canon writer: `foundation/layout.css`.

| Viewport | container | gutter |
|---|---|---|
| base / 390 / 480 | 16 | 16 |
| 768 | 20 | 24 |
| 1024 | 24 | 24 |
| 1280 / 1440 | 32 | 24 |

Consumers unchanged. Canon dual SoT = **0**. Admin leftover writer = runtime debt.

---

## F. Accepted / deferred Canon debt (does not block lock)

| Item | Status |
|---|---|
| Search height ← `--ifx-size-avatar-md` | **KNOWN CONSUMER MISBIND · ACCEPTED FOR TOKEN LOCK.** Value 36px is correct. No control-height token. One consumer. Do not change. |
| `medium` / `semibold` both 600 | **VALID DISTINCT SEMANTIC ROLES.** Same physical value. Not a lock blocker. |
| `--ifx-alpha-shell-55` | **KNOWN NAMING DEBT.** Owner Global. Value valid. Runtime consumers exist. Rename not required. |
| `--ifx-z-topnav` = 220 | **VALID GLOBAL OVERLAY SLOT.** No rename. |

---

## G. Legacy compatibility (do not change)

- Numeric `font-size-*` tokens  
- Numeric `line-height-*` tokens  
- Extra legacy weight aliases (`thin` / `light` / `extralight` / `extrabold` / `black`)  

Migration debt. Not Canonical Token Layer blockers.

---

## H. Runtime migration debt (do not solve)

- Admin leftover `:root` token definitions  
- User_Web leftover `:root` token definitions  
- User_Web hardcoded App Shell values  
- Tabbar live **72** vs canonical **60**  
- brand-cta: User_Web `var()` + App Shell hardcoded twin  
- Leftover `--ifx-inset-widget` binds (Admin + User_Web)  
- Admin `spacing.css` still writes `--ifx-space-container` / `--ifx-grid-gutter`  

These do **not** reopen Token Layer.

---

## I. Registry / index

5 active roots: `global` · `platform-admin` · `platform-web` · `module-market` · `module-money-flow`.  
Orphan source JSON = 0. Inventory 342 · duplicate names 0 · stale paths 0.  
Foundation runtime vars are **not** listed as token-source entries.

---

## J. Determinism

```text
[build-tokens] OK — global: prim=207 sem=64 theme dark=36 · light=36 | platform-admin: prim=3 | platform-web: prim=5 theme 2/2 | module-market: prim=10 theme 10/10 | module-money-flow: prim=3 theme 2/2 · breakpoints: 5
```

Second run: generated `git diff = 0`. Collision gate green.

---

## K. Regression

W01–W10 + Sandbox + components (Alert / Chat / Toast / Modal) + playground (container/grid) + dark/light generated CSS: HTTP **200**.  
No missing Canon `var()`. No duplicate Canon token. Expected visual change = **ZERO**.

---

## L. Lock

Recorded on P1 (`gates/P1.md` — Token Layer LOCK):

```text
TOKEN_LAYER = LOCKED
```

No new token may be added, renamed, moved, or deleted without a new approved requirement and owner decision.  
Existing deferred runtime migration does **not** reopen Canonical Token Layer.

---

## Final

**TOKEN_LAYER_READY_TO_LOCK = YES**  
**TOKEN_LAYER = LOCKED**

STOP. Do not open any new Token wave.
