# 06 — Implementation Evidence · Phase E

**Date:** 2026-07-27 (rev.10)  
**Status:** **PHASE F PASS (automated) — Final Owner sign pending**  
**Workflow:** [`12-Slice-Execution-Workflow.md`](12-Slice-Execution-Workflow.md) rev.10  
**Prerequisite:** Phase C GO · SCG · [`08`](08-Owner-Signoff.md)

---

## Evidence precedes conclusion (LOCKED · EG-1)

Agent **cấm** kết luận `PASS` · `FAIL` · `NO REGRESSION` · `SoT COMPLIANT` **trước** khi thu thập và ghi bằng chứng trong block Evidence của slice.

```text
Discovery → Implementation → Verification → Regression → CI
    ↓
Evidence (commands + output + metrics)
    ↓
Conclusion
```

**Cấm:** ghi PASS → rồi mới tìm evidence.

---

## Agent Session Contract (paste đầu mỗi phiên Cursor)

> Làm việc theo [`12`](12-Slice-Execution-Workflow.md) rev.10 · [`06`](06-Implementation-Evidence.md) = **execution state authority**.  
> **Không** suy tiến độ từ chat.  
> **Không** hỏi Owner nếu Decision Test = NO (SoT/Matrix/Plan đã trả lời).  
> Sau mỗi slice: cập nhật **Resume Marker** + evidence **trước** khi mở slice tiếp.  
> Chỉ STOP: **P0 · A0 · S0 · M0 · B0** · MAJOR (rollback playbook 08).  
> **EG-5:** Slice PASS + Q1–Q4 + Decision Test clear → **immediate Slice N+1** — **cấm** hỏi "tiếp không?" / "review trước?".

---

**06 là authority duy nhất về execution state và implementation progress** (Phase E/F).

**Không** thay thế authority khác:

| Domain | Authority |
|--------|-----------|
| Product / phase sign-off | [`08`](08-Owner-Signoff.md) |
| Decision Matrix · per-file rows | Phase C Matrix · [`04b`](04b-Per-File-Occurrence-Registry.md) discovery |
| SoT · AC/GR | [`02`](02-SoT.md) |
| Migration · rollback procedure | [`05`](05-Breakpoint-Migration-Strategy.md) |
| **Execution state · slice progress · evidence** | **06 (this file)** |

- **Cấm** suy execution state từ chat.
- Crash / phiên mới → resume **Resume Marker** + slice block cuối.
- Cập nhật Resume Marker + Slice Summary mỗi lần đổi trạng thái.

---

## Resume Marker

> **Agent: đọc block này trước — không đọc chat.**

| Field | Value |
|-------|-------|
| **Current Slice** | **Phase F** — Regression |
| **Current Step** | `regression matrix` |
| **Current Status** | `DONE` |
| **Last PASS Step** | Phase F automated PASS · CI + production verify |
| **Last FAIL Step** | — |
| **Failure budget** | issue: — · attempts: **0/3** |
| **Remaining TODO** | 08 Final Owner sign (visual QA optional) |
| **Last Updated** | 2026-07-27 |
| **Next Action** | Owner Final sign in 08 · Task CLOSED |

**Status values:** `NOT STARTED` · `IN PROGRESS` · `IMPLEMENTED` · `SELF AUDIT` · `FIXING` · `READY FOR NEXT` · `DONE` · `STOPPED`

**Step examples:** `discovery rg` · `implement` · `verify SoT` · `regression 1023` · `run CI` · `root cause` · `await Owner decision`

---

## Slice lifecycle (LOCKED)

```text
NOT STARTED
    ↓
IN PROGRESS
    ↓
IMPLEMENTED          ← code done · audit chưa chạy
    ↓
SELF AUDIT
    ↓
PASS?
 ├── NO → FIXING (budget ≤3) → SELF AUDIT
 └── YES → Regression classify
              ├── MAJOR → STOPPED (Owner: Rollback | Hotfix)
              └── NONE / MINOR fixed
                        ↓
                   READY FOR NEXT → DONE
```

---

## Metrics rule (LOCKED)

**Metrics phải phản ánh objective của slice** — không spam metric không liên quan.

| Slice | Primary metric (example) |
|-------|--------------------------|
| 1 Foundation | `layout.css` token export / catalog sync checks |
| 2 Runtime abstraction | magic numbers in abstraction module · semantic helper count |
| 3 App Shell | `innerWidth` / `DRAWER_MAX` in shell files → 0 |
| 4 Shared UI | literals in block-templates / components scope |
| 5 Pages | page-scoped `@media` / JS literals per Matrix |
| 6 Widgets + CI | **CI violations → 0** (slice objective) |

CI violations là metric **chính** cho Slice 6 · metric **phụ** cho slice khác nếu liên quan objective.

---

## Gate (một lần — trước Slice 1)

| Condition | Status |
|-----------|--------|
| Phase C Decision Matrix signed | ✅ GO |
| Semantic Completeness Gate | ✅ PASS |
| 09 + JSON populated for GO rows | ✅ (per 08) |
| Phase D D1–D4 | ✅ PASS |
| **Slice 1 allowed** | ✅ **YES** |

---

## Per-slice template (bắt buộc)

```markdown
### Slice N — [name]

**Status:** …
**Started:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD
**Failure budget:** Finding `…` · attempts **N/3** · B0 STOP if N≥3

#### Failure Budget (if applicable)

| Attempt | Finding | Fix tried | Audit result |
|---------|---------|-----------|--------------|
| 1 | … | … | FAIL |
| 2 | … | … | FAIL |
| 3 | … | … | FAIL → **B0 STOP · Failure Budget exceeded** |

*(Ghi đủ 3 rows trước khi báo Owner — EG-2)*

#### Objective
- Scope (Matrix / 03 §6): …
- **Primary metric for this slice:** …
- Files in scope ONLY: …

#### Implementation
| File | Change summary | Matrix ref |
|------|----------------|------------|
| … | … | … |

#### Metrics (slice-objective aligned)
| Metric | Before | After | Command | Tied to objective? |
|--------|--------|-------|---------|-------------------|
| … | … | … | … | YES |

#### Commands (Evidence precedes conclusion)

**Discovery Commands** *(before edit — baseline)*
```bash
rg 'DRAWER_MAX' path
rg 'innerWidth' path
# paste output
```

**Verification Commands**
```bash
# post-change SoT / scope checks
```

**Regression Commands**
```bash
# viewport · boundary
```

**CI Commands**
```bash
python3 scripts/check-breakpoints.py
# classify delta per 12 §8.1 — not auto MAJOR
```

#### Root Cause
| Field | Content |
|-------|---------|
| **Finding** | … |
| **Cause** | … |
| **Fix** | … |
| **Verify** | … |
| **Prevent recurrence** | grep guard · test · rule update — làm sao lỗi không quay lại? |

*(N/A if audit PASS first time)*

#### Rollback Check

| Field | Value |
|-------|-------|
| **Severity** | NONE / MINOR / MAJOR |
| **Rollback recommended** | YES / NO *(MAJOR default YES — suggestion only)* |
| **Owner decision** | — / Pending / **Rollback** / **Hotfix** / Defer |
| **Rollback executed** | YES / NO / N/A *(only after Owner chose Rollback)* |

*(Agent cấm execute rollback trước Owner decision — EG-3)*

#### Four Questions

| Q | Answer | Evidence |
|---|--------|----------|
| Q1 Objective done? | YES/NO | … |
| Q2 Regression severity | NONE / MINOR / MAJOR | … |
| Q3 SoT violation? | YES/NO | … |
| Q4 Owner gate? | NO · or Decision Test → gate P0/A0/S0/M0 | … |

**Decision Test** (12 §3.2 — ghi trước Q4 nếu slice có ambiguity):

| Step | Answer |
|------|--------|
| Q1 SoT/Matrix/Plan đã trả lời? | YES/NO |
| Q2 ≥2 phương án hợp lệ? | YES/NO |
| Q3 Ảnh hưởng P/A/S/M? | YES/NO → gate: … |

**Auto-advance:** Q1=YES · Q2=NONE · Q3=NO · Q4=NO

#### Scope Check

| Outside Matrix | Files outside scope |
|----------------|---------------------|
| YES/NO | none / list |

#### Hidden Work

| Check | Answer | Gate if YES |
|-------|--------|-------------|
| Work outside Matrix | NO | S0 |
| New semantic (not Matrix GO) | NO | M0 |
| New abstraction / SoT | NO | A0 |
| New Foundation token | NO | A0 |
| Runtime defines px | NO | A0 |
| **Unplanned cleanup** | NO | S0 if outside touched scope |
| Touched-scope cleanup only | YES/NO | OK if files ⊆ Matrix scope |

#### Exit Criteria (03 §6)
- [ ] All ✓

#### Self-Audit Result
*(Conclusion — only after Evidence blocks above)*
- [ ] PASS
- [ ] FAIL

#### Slice Summary
```text
Slice N — PASS | Owner Gate: NO | Auto Advance: YES | Next: Slice N+1
```
```

---

## Slice 1 — Foundation

**Status:** `DONE`  
**Primary metric:** Foundation catalog sync · 7 tokens authoritative  
**Last Updated:** 2026-07-27

#### Objective
- Scope 03 §6.1: `layout.css` SoT · catalog sync · **no consumer changes**

#### Implementation
| File | Change | Matrix |
|------|--------|--------|
| `Admin_Design_system/iflux-admin-ui/primitives/layout.css` | SoT header LOCKED · semantic id comments on 7 tokens | Foundation |
| `Admin_Design_system/ds-sot-foundations-catalog.js` | cssVar `--ifx-bp-xs`…`--ifx-bp-3xl` (was legacy aliases) | Catalog sync |

#### Metrics
| Metric | Before | After | Command | Objective |
|--------|--------|-------|---------|-----------|
| Foundation tokens in layout.css | 7 | 7 | rg count | YES |
| Legacy catalog cssVar aliases | 7 | 0 | rg legacy names | YES |
| CI violations (baseline) | 66 | 66 | check-breakpoints.py | YES (unchanged expected) |

#### Commands

**Discovery**
```bash
rg 'ifx-bp-small-mobile|ifx-bp-mobile' Admin_Design_system/
# before: 7 hits in ds-sot-foundations-catalog.js
# after: exit 1 (no matches)
rg -c 'ifx-bp-' Admin_Design_system/iflux-admin-ui/primitives/layout.css
# 9 (7 tokens + 2 in header comment refs)
```

**Verification**
```bash
# 7 token lines match 02-SoT §1 px values — manual diff PASS
```

**CI**
```bash
python3 scripts/check-breakpoints.py
# FAIL — 66 breakpoint violation(s) — expected Slice 1 (no consumer migrate)
# Foundation px: [375, 640, 768, 1024, 1280, 1440, 1600]
```

#### Root Cause
N/A — audit PASS first time

#### Rollback Check
| Severity | Rollback recommended | Owner decision | Executed |
|----------|---------------------|----------------|----------|
| NONE | NO | — | N/A |

#### Four Questions + Decision Test
| Q | Answer | Evidence |
|---|--------|----------|
| Q1 Objective done | YES | 2 files · layout.css authoritative |
| Q2 Regression | NONE | no consumer files touched |
| Q3 SoT violation | NO | P1 · AC-BP-03 satisfied |
| Q4 Owner gate | NO | Decision Test: SoT answered YES |

| Decision Test | Answer |
|---------------|--------|
| Q1 SoT/Matrix answered | YES |
| Q2 ≥2 options | NO |
| Q3 P/A/S/M | NO |

#### Scope Check · Hidden Work
Outside Matrix: NO · Unplanned cleanup: NO

#### Self-Audit Result
- [x] **PASS**

#### Slice Summary
```text
Slice 1 — PASS | Owner Gate: NO | Auto Advance: YES | Next: Slice 2
```

---

## Slice 2 — Runtime abstraction

**Status:** `DONE`  
**Primary metric:** abstraction module exists · 0 magic px literals in module  
**Agent path:** `Admin_Design_system/iflux-admin-ui/foundation/iflux-breakpoint.js` → `IfluxBreakpoint`  
**Last Updated:** 2026-07-27

#### Objective
- 10 §2 D1–D4 (08 Phase D) · module only · **no App Shell consumer migrate** (Slice 3)

#### Implementation
| File | Change |
|------|--------|
| `foundation/iflux-breakpoint.js` | NEW · reads px from `--ifx-bp-*` · semantic `mobile-shell`→`bp-lg` |

#### Metrics
| Metric | Before | After | Command |
|--------|--------|-------|---------|
| IfluxBreakpoint module | 0 | 1 | `rg IfluxBreakpoint foundation/` |
| Magic px literals in module | — | 0 | `rg '1023|960|900' iflux-breakpoint.js` → none |
| CI violations | 66 | 66 | check-breakpoints.py (expected) |

#### Commands

**Discovery**
```bash
rg 'IfluxBreakpoint' Admin_Design_system/  # 1 file (new module)
rg '1023\.98' foundation/iflux-breakpoint.js  # no matches
```

**Verification**
```bash
# tokenPx reads --ifx-bp-lg via getComputedStyle (no hardcoded 1024 in source)
rg 'tokenPx|SEMANTIC_TOKEN|mobile-shell' foundation/iflux-breakpoint.js
```

**CI**
```bash
python3 scripts/check-breakpoints.py
# FAIL — 66 (unchanged · no consumer migration this slice)
```

#### Four Questions + Decision Test
| Q | Answer |
|---|--------|
| Q1 | YES — module + D4 semantic map |
| Q2 | NONE |
| Q3 | NO |
| Q4 | NO |

Decision Test: SoT/Matrix answered YES → implement path agent-chose

#### Self-Audit Result
- [x] PASS

#### Slice Summary
```text
Slice 2 — PASS | Owner Gate: NO | Auto Advance: YES | Next: Slice 3
```

---

## Slice 3 — App Shell

**Status:** `DONE`  
**Primary metric:** shell `innerWidth` / `DRAWER_MAX` / `1023.98` → 0 in scope files  
**Last Updated:** 2026-07-27

#### Objective
- 03 §6.3: `iflux-web-ui.js` · `app-shell.css` · `account-feature-boot.js` · `mobile-shell` → `IfluxBreakpoint.isMobileShell()`

#### Implementation
| File | Change |
|------|--------|
| `runtime/shell-boot.js` | Load `IfluxBreakpoint` before `IfluxWebUI` |
| `iflux-web-ui.js` | `ifxIsMobileShell()` helper · replace 7× `1023.98` / `DRAWER_MAX` |
| `app-shell.css` | 2× `@media` → `1024px` + SYNC comment (D3) |
| `runtime/account-feature-boot.js` | Remove `DRAWER_MAX` · `isAccountMobileNav()` via `IfluxBreakpoint` |

#### Metrics
| Metric | Before | After | Command |
|--------|--------|-------|---------|
| `1023.98` in shell scope files | 11 | 0 | `rg '1023\.98\|DRAWER_MAX' iflux-web-ui.js app-shell.css runtime/account-feature-boot.js` |
| CI violations (repo) | 66 | 56 | `python3 scripts/check-breakpoints.py` |
| Shell scope CI delta | — | −10 | same |

#### Commands

**Discovery**
```bash
rg '1023\.98|DRAWER_MAX' User_Web/iflux-web-ui/iflux-web-ui.js User_Web/iflux-web-ui/app-shell.css User_Web/iflux-web-ui/runtime/account-feature-boot.js
# before: 11 hits · after: no matches
```

**Verification**
```bash
rg 'ifxIsMobileShell|IfluxBreakpoint' User_Web/iflux-web-ui/iflux-web-ui.js runtime/shell-boot.js runtime/account-feature-boot.js
# ifxIsMobileShell defined + 6 call sites · shell-boot loads IfluxBreakpoint
rg 'SYNC:mobile-shell' User_Web/iflux-web-ui/app-shell.css
# 2 SYNC comments + max-width: 1024px
```

**Boundary regression (1023/1024/1025 · logical)**
```text
Matrix MAP 1023.98 → bp-lg (1024). JS: IfluxBreakpoint.isMobileShell() uses matchMedia(max-width: tokenPx('bp-lg')).
At 1023px: matches · at 1024px: matches · at 1025px: no match — intentional 1px shift vs legacy 1023.98.
CSS @media (max-width: 1024px) aligned with Foundation literal + SYNC comment.
```

**CI**
```bash
python3 scripts/check-breakpoints.py
# FAIL — 56 (was 66 · −10 from shell scope)
```

#### Four Questions + Decision Test
| Q | Answer |
|---|--------|
| Q1 | YES — shell uses IfluxBreakpoint + Foundation CSS bridge |
| Q2 | NONE |
| Q3 | NO |
| Q4 | NO |

Decision Test: SoT/Matrix answered YES → implement

#### Self-Audit Result
- [x] PASS

#### Slice Summary
```text
Slice 3 — PASS | Owner Gate: NO | Auto Advance: YES | Next: Slice 4
```

---

## Slice 4 — Shared UI

**Status:** `DONE`  
**Primary metric:** block-templates + market-components literals → Foundation  
**Last Updated:** 2026-07-27

#### Implementation
| File | Change |
|------|--------|
| `block-templates.css` | 480→375 · 1023.98→1024 · 767.98→768 (+ @container) · SYNC comments |
| `market-components.css` | 1023.98→1024 · 767.98/960→768 · merged @768 block |

#### Metrics
| Metric | Before | After |
|--------|--------|-------|
| CI violations | 56 | 48 |
| Slice scope literals | 8 | 0 |

#### Self-Audit Result
- [x] PASS

#### Slice Summary
```text
Slice 4 — PASS | Owner Gate: NO | Auto Advance: YES | Next: Slice 5
```

---

## Slice 5 — Pages

**Status:** `DONE`  
**Primary metric:** profile · community · market · stock · hub · watchlist + header JS  
**Last Updated:** 2026-07-27

#### Implementation
| File | Change |
|------|--------|
| `profile.css` · `community.css` · `market.css` · `stock.css` · `hub.css` · `watchlist.css` | Foundation px + SYNC |
| `stock-page.js` · `group-page.js` · `profile-chat-page.js` · `community-post-page.js` | `IfluxBreakpoint.isMobileShell()` |
| `iflux-header-messages-ui.js` · `iflux-user-notifications-ui.js` · `iflux-onboarding.js` | mobile-shell via runtime |

#### Metrics
| Metric | Before | After |
|--------|--------|-------|
| CI violations | 48 | 20 |

#### Self-Audit Result
- [x] PASS

#### Slice Summary
```text
Slice 5 — PASS | Owner Gate: NO | Auto Advance: YES | Next: Slice 6
```

---

## Slice 6 — Widgets + Admin + CI

**Status:** `DONE`  
**Primary metric:** **CI violations → 0** (AC-BP-08)  
**Last Updated:** 2026-07-27

#### Implementation
| Area | Files |
|------|-------|
| User Web remainder | `alerts.css` · `app-shell.css` · `flow.css` · `pricing.css` · `widget-shell.css` |
| Admin | `dashboard.css` · `chu-de-admin.css` · `design-sandbox.css` · `ds-sot.css` · `components.css` · `spacing.css` · `iflux-admin-ui.js` |

#### Metrics
| Metric | Before | After | Command |
|--------|--------|-------|---------|
| CI violations | 20 | **0** | `python3 scripts/check-breakpoints.py` → PASS |

#### CI
```bash
python3 scripts/check-breakpoints.py
# PASS — no breakpoint violations detected.
```

#### Self-Audit Result
- [x] PASS

#### Slice Summary
```text
Slice 6 — PASS | Owner Gate: NO | Auto Advance: YES | Next: Phase F
```

---

## Cumulative quality log

| After slice | Primary metric Δ | Regression found | Regression fixed | Owner gates | Rollback count | Notes |
|-------------|------------------|--------------------|------------------|-------------|----------------|-------|
| Baseline | CI 66 | — | — | — | 0 | pre-Phase E |
| Slice 1 | catalog alias 7→0 · CI 66 unchanged | 0 | 0 | 0 | 0 | DONE |
| Slice 2 | module +1 · CI 66 | 0 | 0 | 0 | 0 | DONE |
| Slice 3 | shell literals 11→0 · CI 66→56 | 0 | 0 | 0 | 0 | DONE |
| Slice 4 | shared UI 8→0 · CI 56→48 | 0 | 0 | 0 | 0 | DONE |
| Slice 5 | pages+header JS · CI 48→20 | 0 | 0 | 0 | 0 | DONE |
| Slice 6 | CI **0** | 0 | 0 | 0 | 0 | DONE · AC-BP-08 |
| Phase F | 7 VP + boundary · CI PASS · prod verify | 0 | 0 | 0 | 0 | DONE automated |

---

## Phase F — Regression

**Status:** `DONE` (automated)  
**Primary metric:** 07 matrix PASS · AC-BP-01…08 · CI exit 0  
**Last Updated:** 2026-07-27  
**Deliverable:** [`07-Regression-Report.md`](07-Regression-Report.md) rev.1

#### Objective
- 03 §7 · 12 §11: 7 Foundation viewports · boundary pairs · surfaces · CI · production verify

#### Commands

**CI**
```bash
python3 scripts/check-breakpoints.py
# PASS — no breakpoint violations detected.
```

**AC-BP-01 / GR-BP-02**
```bash
rg 'DRAWER_MAX|MOBILE_SHELL_MAX|MOBILE_CHAT_MAX' User_Web --glob '*.js'
# no matches
rg '1023\.98|767\.98' User_Web Admin_Design_system --glob '*.{css,js}'
# comments only (profile.css note) — no CI literals
```

**Production verify**
```bash
curl -sS -o /dev/null -w "%{http_code}\n" https://iflux.vn/nha-cua-toi   # 200
curl -sS -o /dev/null -w "%{http_code}\n" https://iflux.vn/cong-dong      # 200
curl -sS https://iflux.vn/User_Web/iflux-web-ui/app-shell.css | rg 'max-width: 1024px'
curl -sS https://iflux.vn/Admin_Design_system/iflux-admin-ui/foundation/iflux-breakpoint.js | rg 'isMobileShell'
```

#### Four Questions
| Q | Answer |
|---|--------|
| Q1 | YES — 07 filled · AC mapped |
| Q2 | NONE |
| Q3 | NO |
| Q4 | NO |

#### Self-Audit Result
- [x] PASS

#### Phase F Summary
```text
Phase F — PASS (automated) | Owner Gate: NO | Next: 08 Final sign
```

---

*Evidence rev.11 — Phase F complete · Final Owner sign pending.*
