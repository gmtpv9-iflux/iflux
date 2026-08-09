# 02 — SoT · Responsive Breakpoint Consolidation

**Date:** 2026-07-27 (rev.6)  
**Status:** **DRAFT — chưa LOCKED** (chờ Phase C Owner sign-off)  
**Prerequisite:** Phase A PASS · [`04b-Per-File-Occurrence-Registry.md`](04b-Per-File-Occurrence-Registry.md)  
**Solution:** [`01-Solution.md`](01-Solution.md)

---

## 0. Owner lock — nguyên tắc bắt buộc

| # | Nguyên tắc | Status |
|---|------------|--------|
| **P1** | Chỉ **Foundation** (`layout.css`) là **SoT duy nhất** cho giá trị px | DRAFT |
| **P2** | Runtime semantic + Feature Threshold **không** được tự định nghĩa px | DRAFT |
| **P3** | **JS và CSS** consume qua **runtime abstraction** / Exception — không magic number | DRAFT |
| **P4** | Consumer **không** hardcode px — abstraction shape do Owner (Slice 2) | DRAFT |
| **P5** | **Một runtime semantic = một px band** (AC-BP-06) | DRAFT |
| **P6** | **Một semantic → một Foundation token** — nhiều semantic → cùng token OK (AC-BP-07) | DRAFT |
| **P7** | Runtime abstraction **không** trở thành SoT thứ hai — px chỉ từ Foundation | DRAFT |
| **P8** | Runtime **may evolve** · consumer contract **should stay stable** when possible (guideline) | DRAFT |

---

## 0.1 Responsive Source of Truth hierarchy (LOCKED)

**Foundation là SoT duy nhất.** Runtime và Feature Threshold là **phân loại audit/migrate** — **không** ngang hàng SoT.

```text
Foundation Breakpoint Tokens (layout.css)
        │  ← ONLY place that defines px: 375 … 1600
        ▼
Semantic Runtime abstraction (Owner decides shape — [`10`](10-Semantic-Breakpoint-API.md))
        │  ← semantic → bp-* → px from Foundation only
        ▼
Consumers (CSS / JS)
        │  ← no magic numbers · no innerWidth literals (GR-BP-02)
        ▼
Exception Registry (09) — scoped literals only
```

**Đúng:**

```text
mobile-shell  →  bp-lg  →  1024
```

**Cấm:**

```text
mobile-shell  →  1023.98   (Runtime tự SoT)
layout.css 1024  →  Runtime 1030   (Runtime override Foundation)
```

**Runtime abstraction must not become a second Source of Truth.** Foundation remains the only authority for breakpoint values.

Contract: [`10-Semantic-Breakpoint-API.md`](10-Semantic-Breakpoint-API.md)

---

## 0.2 Taxonomy (audit classification only)

| Type | Defines px? | Role |
|------|-------------|------|
| **Foundation Breakpoint** | ✅ **SoT** | `layout.css` tokens |
| **Runtime semantic** | ❌ | Maps to Foundation via API |
| **Feature Threshold** | ❌ (Exception only) | Scoped · [`09`](09-Breakpoint-Exception-Registry.md) |
| **Layout Constraint** | ❌ | Out of scope |

---

## 1. Foundation catalog (SoT duy nhất)

**File authority:** `Admin_Design_system/iflux-admin-ui/primitives/layout.css`

| Token | px | Semantic id |
|-------|-----|---------------|
| `--ifx-bp-xs` | 375 | `bp-xs` |
| `--ifx-bp-sm` | 640 | `bp-sm` |
| `--ifx-bp-md` | 768 | `bp-md` |
| `--ifx-bp-lg` | 1024 | `bp-lg` |
| `--ifx-bp-xl` | 1280 | `bp-xl` |
| `--ifx-bp-2xl` | 1440 | `bp-2xl` |
| `--ifx-bp-3xl` | 1600 | `bp-3xl` |

**Không file nào khác** được thêm giá trị px mới vào catalog.

---

## 2. Tách biệt — Viewport Preview ≠ Foundation

| Registry | Count | Widths | Mục đích |
|----------|-------|--------|----------|
| `IfluxViewportRegistry` | 4 | 375 · 768 · 1280 · 1440 | Admin preview / QA |
| Foundation breakpoints | 7 | 375 … 1600 | **Runtime SoT** |

Regression: 7 Foundation widths + **boundary pairs** → [`07-Regression-Report.md`](07-Regression-Report.md)

---

## 3. Exception Registry

Authority: [`09-Breakpoint-Exception-Registry.md`](09-Breakpoint-Exception-Registry.md) · [`breakpoint-exceptions.json`](breakpoint-exceptions.json)

Mọi px ngoài Foundation **bắt buộc** row §3 + CI whitelist.

---

## 4. Acceptance Criteria

### AC-BP-01 — Catalog compliance

Không literal responsive ngoài Foundation + Exception Registry (CI PASS).

### AC-BP-02 — JS/CSS semantic parity

Cùng semantic → cùng Foundation token · migrate CSS+JS cùng bundle.

### AC-BP-03 — Foundation SoT

Chỉ `layout.css` định nghĩa px catalog.

### AC-BP-04 — No responsive regression

Phase F PASS — Foundation widths + boundary pairs.

### AC-BP-05 — No new breakpoints

Cấm thêm px mới ngoài Foundation (CI enforces).

### AC-BP-06 — One semantic, one breakpoint band

`mobile-shell` → một band · không Drawer 1024 / Bottom 960.

### AC-BP-07 — One semantic → one Foundation token

Mỗi **semantic id** map **đúng một** Foundation token (`bp-*`) trên toàn repo.

**Được phép** — nhiều semantic → cùng token:

```text
mobile-shell    →  bp-lg
compact-layout  →  bp-lg
desktop-wide    →  bp-xl
desktop-sidebar →  bp-xl
```

**Cấm** — cùng semantic → token/px khác nhau theo file:

```text
mobile-shell → bp-lg   // App Shell
mobile-shell → 960     // elsewhere  ← VI PHẠM
```

Feature Threshold với px ngoài Foundation → **Exception (09)** · không phải AC-BP-07 MAP case.

### AC-BP-08 — CI audit PASS

[`scripts/check-breakpoints.py`](../../scripts/check-breakpoints.py) exit 0 trên repo sau migration.

---

## 5. Governance rules

### GR-BP-01 — No literal outside Foundation API or Exception

Consumer JS/CSS cấm magic px — dùng Semantic API.

### GR-BP-02 — Forbidden patterns (CI enforced)

| Forbidden | Example |
|-----------|---------|
| CSS `@media` ad-hoc px | `@media (max-width: 900px)` |
| JS viewport literal | `window.innerWidth <= 960` |
| JS matchMedia literal | `matchMedia('(max-width:720px)')` |
| JS constants | `DRAWER_MAX = 1023.98` |

**Allowed:**

- `layout.css` Foundation definitions
- Approved runtime abstraction (per Owner decision in 10)
- Exception-scoped literals in 09
- CSS `@media` with `/* SYNC:bp-lg */` literal matching Foundation

Chi tiết: [`11-CI-Breakpoint-Audit.md`](11-CI-Breakpoint-Audit.md)

---

## 5.1 Semantic Completeness Gate (before Phase E)

1. Owner confirmed  
2. Consumer(s) documented  
3. Decision ≠ REVIEW  
4. Regression scope listed  
5. If EXCEPTION → row in **09**

---

## 6. Agent / Cursor rules

| Rule | |
|------|--|
| Phase A–C | No code · Owner Matrix · 09 |
| Phase E | [`12`](12-Slice-Execution-Workflow.md) rev.10 · [`06`](06-Implementation-Evidence.md) rev.10 |
| Decision | Chỉ khi ≥2 phương án hợp lệ · Decision Test §3.2 |
| MUST NOT ask | Đáp án đã có SoT/Matrix/Plan → implement |
| EG-1 | Evidence precedes conclusion |
| EG-2 | **B0** — 3× cùng Finding → Failure Budget exceeded → Owner |
| EG-3 | MAJOR → STOP · Owner quyết Rollback/Hotfix |
| EG-4 | Resume Marker — không suy từ chat |
| No Hidden Work | S0 — cleanup/rename **trong touched scope** OK |

### Owner Decision vs Implementation

Định nghĩa đầy đủ · **Decision Test** · **Agent MUST NOT ask:** [`12`](12-Slice-Execution-Workflow.md) §3.1–§3.3.

| Id | STOP when (Decision Test Q3=YES) |
|----|----------------------------------|
| **P0** | Product · IA · UX · business rule |
| **A0** | Architecture · SoT · runtime contract |
| **S0** | Outside slice / Matrix scope |
| **M0** | Mapping · Exception · Matrix chưa GO |

**Cấm hỏi Owner** nếu đáp án đã có trong SoT · Matrix GO · Plan · 08/09/10.

---

## 7. Gate checklist

| Gate | File |
|------|------|
| Phase A | 04 · 04b |
| Phase C | 09 populated |
| Semantic Completeness | 08 |
| Semantic API | 10 · Slice 2 · **Owner decides shape** |
| CI | 11 · Slice 6 |
| Phase F | 07 |

---

*SoT rev.9 — Decision Test · MUST NOT ask → 12 §3.*
