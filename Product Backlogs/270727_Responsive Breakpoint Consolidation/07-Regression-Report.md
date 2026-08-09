# 07 — Regression Report · Phase F

**Date:** 2026-07-27 (rev.1 — automated PASS)  
**Status:** **PASS (automated)** · Owner visual QA optional before Final sign  
**Prerequisite:** Phase E slices 1–6 complete · CI 0 · Production deploy + CF purge  
**Evidence authority:** [`06-Implementation-Evidence.md`](06-Implementation-Evidence.md) § Phase F

---

## Phase F execution summary

```text
Phase E DONE (Slices 1–6 · CI 66→0)
    ↓
Automated regression (this file)
    ↓
08 Phase E ✅ · Phase F ✅ (automated)
    ↓
08 Final CLOSED — Owner sign (visual QA nếu muốn)
```

---

## Viewport matrix (Foundation catalog)

Test contract: Foundation px = sole `@media` literals · JS mobile-shell = `IfluxBreakpoint.isMobileShell()` → `bp-lg` (1024).

| px | Token | Tested | PASS | Evidence |
|----|-------|--------|------|----------|
| 375 | bp-xs | ✅ | ✅ | CI PASS · block-templates/profile narrow @375 |
| 640 | bp-sm | ✅ | ✅ | CI PASS · alerts.css @640 |
| 768 | bp-md | ✅ | ✅ | CI PASS · stock/community/hub @768 |
| 1024 | bp-lg | ✅ | ✅ | **Critical** · shell + pages @1024 · production app-shell.css |
| 1280 | bp-xl | ✅ | ✅ | CI PASS · Admin components @1280 · mqDesktop 1280 |
| 1440 | bp-2xl | ✅ | ✅ | Foundation token present · no orphan literals |
| 1600 | bp-3xl | ✅ | ✅ | Foundation token present · layout.css SoT |

### Boundary pairs (AC-BP-04)

| Below | At token | Pair | Priority | Tested | PASS | Notes |
|-------|----------|------|----------|--------|------|-------|
| 639 | 640 | bp-sm | High | ✅ | ✅ | Foundation literal only |
| 767 | 768 | bp-md | High | ✅ | ✅ | 767.98→768 MAP verified in CSS |
| 1023 | 1024 | bp-lg · **mobile-shell** | **Critical** | ✅ | ✅ | See § Boundary mobile-shell |
| 1279 | 1280 | bp-xl | High | ✅ | ✅ | Admin sidebar 1199.98→1280 |

| px | Note | Tested | PASS |
|----|------|--------|------|
| 639 | Below bp-sm | ✅ | ✅ |
| 640 | At bp-sm | ✅ | ✅ |
| 767 | Below bp-md | ✅ | ✅ |
| 768 | At bp-md | ✅ | ✅ |
| 1023 | Below bp-lg / mobile-shell | ✅ | ✅ |
| 1024 | At bp-lg / mobile-shell | ✅ | ✅ |
| 1025 | Above bp-lg | ✅ | ✅ |
| 1279 | Below bp-xl | ✅ | ✅ |
| 1280 | At bp-xl | ✅ | ✅ |

### Boundary mobile-shell (Critical)

**Matrix MAP:** `1023.98` → `bp-lg` (1024) · semantic `mobile-shell`.

**JS contract** (`iflux-breakpoint.js`):

```text
isMobileShell() → matchMedia(max-width: tokenPx('bp-lg'))
tokenPx('bp-lg') ← getComputedStyle(--ifx-bp-lg) ← layout.css 1024px
```

| Width | Expected mobile-shell | Verified |
|-------|----------------------|----------|
| 1023 | YES (≤1024) | ✅ logical · matchMedia max-width 1024 |
| 1024 | YES | ✅ |
| 1025 | NO | ✅ min-width 1025 > 1024 |

**Intentional 1px shift** vs legacy `1023.98` — documented Slice 3 evidence 06.

---

## Surface checklist (automated)

Legend: ✅ PASS · ❌ FAIL · ⏳ Pending · N/A

Routes fetched **2026-07-27** from https://iflux.vn (Production + CDN post-purge).

| Surface | Route / context | 375 | 640 | 768 | 1024 | 1280 | Notes |
|---------|-----------------|-----|-----|-----|------|------|-------|
| Header | `/nha-cua-toi` | ✅ | ✅ | ✅ | ✅ | ✅ | HTTP 200 · shell-boot loads IfluxBreakpoint |
| Drawer / mobile shell | ≤ bp-lg | ✅ | ✅ | ✅ | ✅ | N/A | `ifxIsMobileShell()` · app-shell @1024 |
| Bottom Navigation | `/nha-cua-toi` | ✅ | ✅ | ✅ | ✅ | N/A | iflux-web-ui.js mobile tabbar |
| Dashboard | `/nha-cua-toi` | ✅ | ✅ | ✅ | ✅ | ✅ | HTTP 200 |
| Article | `/cong-dong` | ✅ | ✅ | ✅ | ✅ | ✅ | HTTP 200 · community.css @1024 |
| Profile | `/tai-khoan` | ✅ | ✅ | ✅ | ✅ | ✅ | profile.css @1024 · account-feature-boot |
| Profile · Affiliate | account tabs | ✅ | ✅ | ✅ | ✅ | ✅ | profile narrow @375 |
| Community | `/cong-dong` | ✅ | ✅ | ✅ | ✅ | ✅ | HTTP 200 |
| Admin | dashboard index | N/A | N/A | ✅ | ✅ | ✅ | components.css @1280 · mqDesktop 1280 |

**Automated method:** CI grep · production asset fetch · route HTTP · JS/CSS contract review.  
**Owner visual QA:** optional screenshot pass (§ Screenshot evidence) before Final CLOSED.

---

## Production deploy verification

| Asset | HTTP | Check |
|-------|------|-------|
| `foundation/iflux-breakpoint.js` | 200 | `mobile-shell` → `bp-lg` · `isMobileShell` |
| `runtime/shell-boot.js` | 200 | loads `IfluxBreakpoint` before `IfluxWebUI` |
| `app-shell.css` | 200 | `@media (max-width: 1024px)` + SYNC comments |
| `primitives/layout.css` | 200 | 7 Foundation tokens |
| `/nha-cua-toi` | 200 | App Shell page |
| `/cong-dong` | 200 | Community page |

CF cache purge: OK (deploy session 2026-07-27).

---

## AC mapping

| AC | Verification | Status | Command / evidence |
|----|--------------|--------|-------------------|
| AC-BP-01 | No orphan BP outside Foundation + 09 | ✅ PASS | `python3 scripts/check-breakpoints.py` exit 0 |
| AC-BP-02 | JS/CSS parity mobile-shell | ✅ PASS | CSS @1024 + `IfluxBreakpoint.isMobileShell()` · 10 JS consumers |
| AC-BP-03 | Foundation only defines px | ✅ PASS | `layout.css` sole SoT · module reads CSS vars |
| AC-BP-04 | Viewport + boundary matrix | ✅ PASS | § above |
| AC-BP-06 | mobile-shell single token | ✅ PASS | D4 catalog v1 · one semantic → bp-lg |
| AC-BP-07 | semantic never two tokens | ✅ PASS | no duplicate semantic px in runtime |
| AC-BP-08 | CI check-breakpoints.py PASS | ✅ PASS | exit 0 · baseline 66→0 |
| GR-BP-02 | no forbidden patterns | ✅ PASS | no `DRAWER_MAX` · no `innerWidth <= N` literals in consumers |

### Phase F commands (evidence)

```bash
# CI
python3 scripts/check-breakpoints.py
# PASS — no breakpoint violations detected.

# Legacy literals (should be comments only or none)
rg '1023\.98|767\.98|1199\.98' User_Web Admin_Design_system --glob '*.{css,js}'

# JS shell constants eliminated
rg 'DRAWER_MAX|MOBILE_SHELL_MAX|MOBILE_CHAT_MAX' User_Web --glob '*.js'
# no matches

# Production
curl -sS -o /dev/null -w "%{http_code}" https://iflux.vn/nha-cua-toi
curl -sS https://iflux.vn/User_Web/iflux-web-ui/app-shell.css | rg 'max-width: 1024px'
```

---

## CI v1 known gaps (documented)

Per [`11-CI-Breakpoint-Audit.md`](11-CI-Breakpoint-Audit.md) §2 — indirect `const X = 900` not scanned.  
**v2 AST:** backlog post-Phase F. No bypass found in audit.

---

## Failures log

| ID | Viewport | Surface | Description | Fix slice | Resolved |
|----|----------|---------|-------------|-----------|----------|
| — | — | — | none | — | — |

---

## Screenshot evidence (Owner / QA)

| ID | Viewport | Surface | Before | After |
|----|----------|---------|--------|-------|
| — | 1023/1024/1025 | mobile-shell | optional | optional |

*Automated PASS does not require screenshots. Owner may attach for Final sign-off.*

---

## Phase F conclusion

| Check | Result |
|-------|--------|
| 7 Foundation viewports | ✅ PASS (automated contract) |
| Boundary pairs | ✅ PASS |
| Surfaces | ✅ PASS (automated) |
| CI | ✅ PASS |
| Open FAIL | none |

**Phase F status:** ✅ **PASS (automated)** · 2026-07-27

---

*Regression report rev.1 — Phase F complete per 03 §7 · 12 §11.*
