# P6a — TOKEN NORMALIZATION 03E  
# Ownership architecture final verify + lock

**MODE:** VERIFY + GOVERNANCE LOCK ONLY — no token move / rename / delete / value change / consumer bind  
**Date:** 2026-08-28  
**Baseline:** 03A `bd49f90` · 03B `b7d2a90` · 03C `6516211` · 03D1 `85c12b4`

```text
TOKEN_03 = LOCKED
TOKEN_03_OWNERSHIP_ARCHITECTURE = PASS
TOKEN_03_READY_TO_LOCK = YES
GLOBAL_OWNERSHIP_PURE = YES
```

Token 04 is **not** opened.

---

## A. Registry

| id | owner | layer | status | sourceRoot | generatedRoot |
|---|---|---|---|---|---|
| global | global | global | active | `design_system/tokens/source` | `design_system/tokens/generated` |
| platform-admin | admin | platform | active | `platform/admin/tokens/source` | `platform/admin/tokens/generated` |
| platform-web | web | platform | active | `platform/web/tokens/source` | `platform/web/tokens/generated` |
| module-market | market | module | active | `modules/market/tokens/source` | `modules/market/tokens/generated` |
| module-money-flow | money-flow | module | active | `modules/money-flow/tokens/source` | `modules/money-flow/tokens/generated` |

All five roots exist on disk and participate in `design_system/scripts/build-tokens.mjs`.  
Orphan `**/tokens/source/*.json` outside the registry: **0**.  
Reserved / empty active owners: **0**.  
`platform/app` and widget token roots remain unregistered until a token has that owner.

---

## B. Ownership uniqueness

Canonical `--ifx-*` names (theme dark+light counted once): **354**.  
`DUPLICATE TOKEN OWNER = 0`.  
Compiler `assertNoCssNameCollision` remains active (prints owner A/B + source A/B and fails the build).

---

## C. Global purity

| Check | Result |
|---|---|
| Admin / Web / Market / Money Flow names in Global source | **0** |
| `--ifx-gradient-brand-cta` in Global | **0** (moved 03D1 → `platform-web`) |
| WRONG_OWNER | **0** |
| UNRESOLVED | **0** |

Global `topnav` string hits are `--ifx-z-topnav` (KEEP_GLOBAL overlay slot) and a 03B note in `shadow.json`. Not wrong-owner.

Allowed remaining Global categories (not solved here): KEEP_GLOBAL · LEGACY_COMPATIBILITY · NAMING_DEBT · DEAD_CANDIDATE.

---

## D. Dependency direction

| Rule | Result |
|---|---|
| GLOBAL → PLATFORM | **0** |
| GLOBAL → MODULE | **0** |
| Market ↔ Money Flow | **0** |
| Any lower-owner cross `{ref}` | **0** |
| PLATFORM/MODULE → GLOBAL | Present and allowed (e.g. `{color.orange.500}`) |

---

## E. Generated ownership

| Owner | Generated `--ifx-*` | Destination |
|---|---|---|
| global | 319 | `design_system/tokens/generated/**` only |
| admin | 3 | `platform/admin/tokens/generated/**` |
| web | 7 | `platform/web/tokens/generated/**` |
| market | 20 | `modules/market/tokens/generated/**` |
| money-flow | 5 | `modules/money-flow/tokens/generated/**` |

Lower-owner names in Global generated: **0**.  
Global names redefined in lower generated: **0**.  
Lower generated names not in that owner’s source: **0**.

---

## F. Token-index traceability

Inventory: **354** · duplicate inventory names: **0**.  
Claims ↔ inventory: exact match.  
Every row has `name` · `owner` · `layer` · `source` · `generated`; source file exists; generated file exists; owner/layer/generatedRoot match the registry.

---

## G. Deterministic build

```text
[build-tokens] OK — global: prim=216 sem=66 theme dark=37 · light=37 | platform-admin: prim=3 sem=0 theme none | platform-web: prim=5 sem=0 theme dark=2 · light=2 | module-market: prim=10 sem=0 theme dark=10 · light=10 | module-money-flow: prim=3 sem=0 theme dark=2 · light=2 · breakpoints: 5
```

Second run: generated `git diff = 0`. Collision gate green.

---

## H. Moved-token value stability

Compared all 03B / 03C / 03D1 moved names against Global generated at 03A `bd49f90`:

**35 / 35 stable. VALUE CHANGES = 0.**

Ownership changed only.

---

## I. Regression

W01–W10 (`references/patterns/*`) + Sandbox + Global `primitives` / `semantic` / `themes/{dark,light}`: HTTP **200**.  
No missing `var()` introduced by this architecture.  
No duplicate `--ifx-*` in canonical artifacts.  
Expected visual change across Token 03: **ZERO**.

---

## J. Deferred — Token 04 (do not solve)

- Search height ← `--ifx-size-avatar-md`
- Toast elevation ← `--ifx-shadow-modal`
- Alert / Chat padding ← `--ifx-inset-widget`
- `space-container` / `grid-gutter` dual owner vs Foundation layout
- `medium` vs `semibold`
- `border-frost` naming
- `bg-navbar` naming
- `alpha-shell-55` naming
- optional `--ifx-z-topnav` rename (slot stays Global)
- 8 dead candidates (`z-base`, `z-raised`, `z-onboarding`, `duration-instant`, `duration-slower`, `ease-in`, `ease-in-out`, `radius-none`)

---

## K. Deferred — legacy / runtime (do not solve)

**LEGACY_COMPATIBILITY:** numeric `font-size-*`, numeric `line-height-*`, extra weight aliases.

**RUNTIME DEBT:**

- Admin leftover `:root` token definitions
- User_Web leftover `:root` token definitions
- hardcoded App Shell values
- tabbar live **72** vs canonical **60**
- brand-cta: `flow.css` `var()` + App Shell hardcoded twin `#f26522 → #e8304a`

These do **not** block Token 03 lock.

---

## L. Governance lock

Recorded on P1 (`gates/P1.md` — Token 03E LOCK):

```text
ONE TOKEN = ONE OWNER = ONE SOURCE DEFINITION
ONE CANONICAL COMPILER
MULTIPLE OWNER-SCOPED SOURCE ROOTS ALLOWED
GLOBAL SOURCE = GLOBAL RESPONSIBILITIES ONLY
GENERATED ARTIFACTS = READONLY
COLLISION = BUILD FAIL
NO PERMANENT DUAL SOT
```

Unregistered JSON is not SoT. Runtime leftover Admin/User_Web `:root` is not canonical source.

---

## Final

**TOKEN_03_OWNERSHIP_ARCHITECTURE = PASS**  
**TOKEN_03_READY_TO_LOCK = YES**  
**TOKEN_03 = LOCKED**

STOP. Do not begin Token 04.
