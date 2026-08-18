# 03 — Implementation Plan · Responsive Breakpoint Consolidation

**Date:** 2026-07-27 (rev.6)  
**Status:** **LOCKED — Phase E/F complete**  
**SoT:** [`02-SoT.md`](02-SoT.md) rev.4

---

## 1. Gate sequence

```text
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Phase A │ → │ Phase B │ → │ Phase C │ → │ Phase D │ → │ Phase E │ → │ Phase F │
│Discovery│   │ Classify│   │ Matrix  │   │  Plan   │   │  Code   │   │ Regress │
│ NO CODE │   │ NO CODE │   │ OWNER   │   │ NO CODE │   │ SLICES  │   │ 7 VP    │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

**Hard stop (một lần):** Phase C GO + Semantic Completeness Gate ([`08`](08-Owner-Signoff.md)).

**Phase E onward:** [`12`](12-Slice-Execution-Workflow.md) rev.10 · evidence [`06`](06-Implementation-Evidence.md) rev.10.

---

## 1.1 Phase E slice loop (summary)

```text
Implement → Evidence first (EG-1) → Self Audit
    → FAIL? Root Cause + Prevention (budget ≤3)
    → Regression: NONE | MINOR | MAJOR
    → MAJOR: STOP → Owner → Rollback | Hotfix (EG-3)
    → Q4 Owner gate clear → Auto Slice N+1
```

Chi tiết: **12 rev.8** · **06 rev.9**

---

## 2. Phase A — Discovery

| Step | Action | Output |
|------|--------|--------|
| A1 | `rg` / script scan `@media` · `@container` · `innerWidth` · `matchMedia` · `*_MAX` constants | Raw hit list |
| A2 | Loại trừ **Layout Constraint** — chỉ Foundation · Runtime · Feature Threshold | Taxonomy §1.1 |
| A3 | **Per-file registry** — one occurrence = one row · [`04b`](04b-Per-File-Occurrence-Registry.md) | 66 rows |
| A4 | Columns: Value · File · Semantic · Owner · **Consumers** · Decision | AC-BP-02 |
| A5 | Semantic groups rollup §2 in 04b | AC-BP-06 mobile-shell |
| A6 | Owner review — no TBD | Gate A PASS |

**Deliverable:** [`04-Breakpoint-Discovery-Audit.md`](04-Breakpoint-Discovery-Audit.md)

---

## 3. Phase B — Classification

| Step | Action |
|------|--------|
| B1 | Gán category từng BP: Foundation / Legacy / Feature-specific / Exception-TBD |
| B2 | Đánh dấu BP “de-facto standard” (`1023.98`) — semantic note bắt buộc |
| B3 | Nhóm theo layer: Foundation · Shared · AppShell · Page · Widget · Admin |
| B4 | Owner review classification | Gate B PASS |

---

## 4. Phase C — Decision Matrix

| Step | Action |
|------|--------|
| C1 | Matrix 4 cột: **Existing · Semantic · Decision · Result** | §7 audit |
| C2 | Decision = MAP · NO MAPPING · KEEP · EXCEPTION · REVIEW | Không mặc định MAP |
| C3 | AC-BP-06: một semantic mobile-shell → một bp-lg | Runtime rows |
| C4 | Regression scope column filled per semantic | 04b extension |
| C5 | Populate [`09-Breakpoint-Exception-Registry.md`](09-Breakpoint-Exception-Registry.md) + JSON | CI whitelist |
| C6 | Owner sign § Phase C | Gate C PASS |

---

## 5. Phase D — Migration Plan

| Step | Action |
|------|--------|
| D1 | Chốt bridge CSS/JS (shared module · naming) |
| D2 | Thứ tự layer → slice mapping |
| D3 | Risk notes per slice (App Shell = highest) |
| D4 | Rollback / cache-bust strategy |
| D5 | Owner sign § Phase D | Gate D PASS |

**Deliverable:** [`05-Breakpoint-Migration-Strategy.md`](05-Breakpoint-Migration-Strategy.md)

---

## 5.5 Semantic Completeness Gate (before Phase E)

**Between Phase C and Phase E** — không có slice code cho đến khi gate PASS.

Per row / semantic bundle:

- [ ] Owner confirmed  
- [ ] Consumer(s) documented (CSS / JS / both)  
- [ ] Decision ≠ REVIEW  
- [ ] If EXCEPTION → row in **09** + JSON

Sign: [`08-Owner-Signoff.md`](08-Owner-Signoff.md) § Semantic Completeness Gate

---

## 6. Phase E — Implementation slices

### Slice 1 — Foundation

| | |
|--|--|
| **Scope** | `layout.css` · px SoT export · catalog sync |
| **Exit criteria** | ✓ layout.css authoritative · ✓ no consumer changes · ✓ evidence 06 · ✓ self-audit PASS · ✓ no new literals in slice files · ✓ Q1–Q4 clear |
| **CI** | baseline still FAIL expected |

### Slice 2 — Runtime abstraction (Owner D1–D4 · Agent implementation)

| | |
|--|--|
| **Scope** | [`10`](10-Semantic-Breakpoint-API.md) rev.8 · **08 Phase D** required |
| **Exit criteria** | ✓ D1–D4 in 08 Phase D · ✓ abstraction implemented (agent path in 06) · ✓ Slice 2 migration · ✓ no magic numbers · ✓ Foundation sole px · ✓ evidence 06 · ✓ Q2=NONE · Q4=NO |
| **CI** | optional — abstraction module path excluded until Slice 3 consumers migrate |

### Slice 3 — App Shell

| | |
|--|--|
| **Scope** | `iflux-web-ui.js` · `app-shell.css` · `account-feature-boot.js` · `mobile-shell` semantic |
| **Exit criteria** | ✓ audit PASS · ✓ regression boundary 1023/1024 · ✓ evidence 06 · ✓ self-review PASS · ✓ no new literals in shell files · ✓ AC-BP-06/07 mobile-shell · ✓ CI violation count ↓ · ✓ Q1–Q4 clear |
| **Rollback** | [`05`](05-Breakpoint-Migration-Strategy.md) §8 — revert shell + abstraction mapping only |

### Slice 4 — Shared UI

| | |
|--|--|
| **Scope** | block-templates · market-components · interaction/* per Matrix |
| **Exit criteria** | ✓ audit PASS · ✓ slice regression · ✓ evidence · ✓ CI trend ↓ · ✓ Q1–Q4 clear |

### Slice 5 — Pages

| | |
|--|--|
| **Scope** | profile · community · market · stock · hub · loyalty per 04b |
| **Exit criteria** | ✓ audit PASS · ✓ page regression scope · ✓ evidence · ✓ exceptions in 09 if any · ✓ Q1–Q4 clear |

### Slice 6 — Widgets + Admin + CI

| | |
|--|--|
| **Scope** | widgets/* · Admin · 09 JSON · CI job |
| **Exit criteria** | ✓ audit PASS · ✓ **CI v1 exit 0** (AC-BP-08) · ✓ full boundary regression sample · ✓ evidence · ✓ v1 gaps noted · ✓ Q1–Q4 clear |

**Per-slice checklist:** [`12`](12-Slice-Execution-Workflow.md) rev.8 — EG-1…EG-4 · Owner gate Q4

**Definition of Done (mọi slice):** Exit criteria ✓ · **06 rev.10** · IMPLEMENTED→audit · slice-objective metrics · Q4=NO

---

## 7. Phase F — Regression

| Viewport (px) | Foundation token |
|---------------|------------------|
| 375 | bp-xs |
| 640 | bp-sm |
| 768 | bp-md |
| 1024 | bp-lg |
| 1280 | bp-xl |
| 1440 | bp-2xl |
| 1600 | bp-3xl |

**Surfaces (mỗi viewport):**

| Surface | Route / context |
|---------|-----------------|
| Header | Any authenticated page |
| Drawer | Mobile ≤ bp-lg |
| Bottom Navigation | Home · Community · Account sub-views |
| Dashboard | `/home` |
| Article | Community detail |
| Profile | `/tai-khoan` · Affiliate panel |
| Community | `/cong-dong` |
| Admin | Dashboard index |

**Deliverable:** [`07-Regression-Report.md`](07-Regression-Report.md)

---

## 8. Dependencies

| Dependency | Impact |
|------------|--------|
| Profile Navigation (`1023.98`) | Slice 2 App Shell — coordinate Owner |
| Engineering Change Governance | All phases |
| DS Foundation `layout.css` | Slice 1 authority |

---

## 9. Estimated effort (order of magnitude)

| Phase | Effort |
|-------|--------|
| A–C | 1–2 sessions (Owner-heavy) |
| D | 0.5 session |
| E Slice 1–2 | 1–2 sessions (App Shell critical) |
| E Slice 3–5 | 2–4 sessions (breadth) |
| F | 1 session + Owner visual pass |

---

*Plan rev.8 — execution governance 12.*
