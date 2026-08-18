# 01 — Solution · Responsive Breakpoint Consolidation

**Date:** 2026-07-27 (rev.6)  
**Status:** **DRAFT — awaiting Phase A PASS**  
**SoT:** [`02-SoT.md`](02-SoT.md)  
**Type:** ECR kiến trúc — **consolidate breakpoints, not design a breakpoint framework**

**Vai trò tài liệu:** Solution/SoT **khóa nguyên tắc** · Owner **quyết implementation** (API shape · catalog) · **không** dùng Solution làm tài liệu thiết kế API.

---

## 1. Vấn đề

Hệ thống hiện có **nhiều lớp breakpoint không thống nhất**:

1. **Foundation SoT** — 7 token trong `layout.css` (`--ifx-bp-xs` … `--ifx-bp-3xl`)
2. **Runtime de-facto** — `1023.98px` khóa App Shell (drawer · bottom nav · account mobile)
3. **Legacy ad-hoc** — `480` · `520` · `720` · `900` · `960` · `1100` · `1199.98` rải rác CSS/JS
4. **Viewport Preview** — 4 khung QA (`IfluxViewportRegistry`) — **khác mục đích** với Foundation

Giao task kiểu *“đổi hết sang token”* **không an toàn** — dễ regress responsive toàn hệ thống.

---

## 1.1 Responsive Source of Truth hierarchy (LOCKED rev.4)

**Foundation là SoT px duy nhất.** Runtime / Feature là phân loại audit — không ngang hàng.

```text
Foundation Breakpoint Tokens (layout.css)     ← ONLY SoT for px values
        ▼
Semantic Runtime abstraction (Owner decides shape — illustrative only in 10)
        ▼
Consumers — no magic numbers
```

**Runtime abstraction must not become a second Source of Truth.** Foundation remains the only authority for breakpoint values.

Chi tiết: [`02-SoT.md`](02-SoT.md) §0.1 · [`10-Semantic-Breakpoint-API.md`](10-Semantic-Breakpoint-API.md) — **§3 examples illustrative, not locked API**

---

## 1.2 Responsive Decision Sources (taxonomy — audit only)

**Không phải mọi con số px trong CSS/JS đều là “breakpoint”.**  
Phase A **chỉ inventory** các nguồn quyết định responsive — **loại trừ** Layout Constraint.

```text
Foundation Breakpoint     ← DS SoT (375 … 1600 · bp-xs … bp-3xl)
        ↓
Runtime Breakpoint        ← semantic hành vi shell (DRAWER_MAX · mobile shell)
        ↓
Feature Threshold         ← compact mode riêng feature/widget/page
        ↓
Layout Constraint         ← KHÔNG thuộc task · KHÔNG audit/migrate
```

| Type | Định nghĩa | Ví dụ | In scope task? |
|------|------------|-------|----------------|
| **Foundation Breakpoint** | Ngưỡng trong DS `layout.css` | `768` · `bp-md` | ✅ SoT · migrate target |
| **Runtime semantic** | Abstraction · map → Foundation | `mobile-shell` → `bp-lg` | ✅ migrate via abstraction |
| **Feature Threshold** | Ngưỡng layout riêng module | `pricing-grid-compact` @ 900 | ✅ Exception / MAP |
| **Layout Constraint** | Kích thước tối thiểu component/UI | `min-width: 280px` · avatar · input | ❌ **Out of scope** |

**Cấm audit nhầm:** `min-width: 240px` trên input/table cell **không** đưa vào inventory breakpoint.

**Signals → Type mapping (Phase A):**

| Signal | Typical type |
|--------|----------------|
| `@media (max-width: …)` viewport | Foundation / Runtime / Feature |
| `@container` | Feature Threshold (thường) |
| `window.innerWidth` · `matchMedia` | Runtime / Feature |
| JS `DRAWER_MAX` · `MOBILE_*_MAX` | **Runtime Breakpoint** |
| `ResizeObserver` | **Không phải breakpoint** — appendix only |

---

## 2. Giải pháp: ECR có gate

Không migrate một lần. Pipeline:

```text
Discovery → Classification → Decision Matrix (Owner)
    → Migration Plan → Implementation (by layer) → Regression
```

Mỗi phase có **gate PASS** trước khi phase sau mở code.

---

## 3. Phase A — Discovery (No Code)

### 3.1 Inventory signals

Quét toàn repo (User Web · Admin · Shared) — **chỉ** Foundation · Runtime · Feature Threshold.

| Signal | Ví dụ | Ghi chú |
|--------|--------|---------|
| `@media` viewport | `max-width` · `min-width` | Phân loại Type trước khi gom số |
| `@container` | container queries | Thường Feature Threshold |
| `window.innerWidth` | `<= 1023.98` | Runtime hoặc Feature |
| `matchMedia(...)` | `(max-width: …)` | Runtime hoặc Feature |
| JS constants | `DRAWER_MAX` · `MOBILE_*_MAX` | Runtime Breakpoint |
| `ResizeObserver` | chart repaint | **Appendix — không inventory** |

**Loại trừ bắt buộc:** `min-width` / `max-width` trên component (input, avatar, table cell, card min) → Layout Constraint.

### 3.2 Output

Bảng inventory → [`04-Breakpoint-Discovery-Audit.md`](04-Breakpoint-Discovery-Audit.md)

Mỗi hàng **bắt buộc** (một occurrence = một dòng — **không gộp theo px**):

| Column | Required |
|--------|----------|
| **Value** | px |
| **File** | path + line |
| **Semantic** | `mobile-shell` · `pricing-grid-compact` · … |
| **Owner** | module responsibility |
| **Consumers** | CSS · JS · CSS + JS |
| **Decision** | Phase C: MAP · KEEP · EXCEPTION |

**Authority:** [`04b-Per-File-Occurrence-Registry.md`](04b-Per-File-Occurrence-Registry.md) — **66 occurrences** seeded.

**Consumers** phục vụ **AC-BP-02**: semantic có CSS + JS → migrate **cùng slice**.

Không biết owner → **TBD** — block Phase E row.

---

## 4. Phase B — Classification

Hai trục **bắt buộc** trước Decision Matrix:

### 4.1 Type (taxonomy §1.1)

Foundation · Runtime · Feature Threshold — **không** gom Layout Constraint.

### 4.2 Migration category

| Category | Ý nghĩa |
|----------|---------|
| **Foundation-aligned** | Trùng DS token — giữ / chuẩn hóa semantic |
| **Legacy** | Không còn nên dùng — đưa Matrix |
| **Feature-specific** | Feature Threshold — Owner + Semantic Owner |
| **Exception** | Owner approve · NO MAPPING · giữ px |

---

## 5. Phase C — Decision Matrix (Owner only)

**Cursor không tự quyết.** Mỗi hàng **bắt buộc** 4 cột:

| Existing | Semantic | Decision | Result |
|----------|----------|----------|--------|

**Decision** (enum — không mặc định Replace):

| Decision | Ý nghĩa |
|----------|---------|
| **MAP** | Thay bằng Foundation semantic (ghi `bp-*` target) |
| **NO MAPPING · KEEP** | Giữ px · không có token tương đương · không migrate |
| **EXCEPTION** | Giữ px · đăng ký Exception Registry |
| **REVIEW** | Chưa quyết — block Phase E row |

**Result** — ví dụ:

| Existing | Semantic | Decision | Result |
|----------|----------|----------|--------|
| 375 | `bp-xs` | MAP | Keep Foundation |
| 520 | legacy spacing · Alert Form | NO MAPPING · KEEP | Exception EXC-520 |
| 640 | `bp-sm` | MAP | Keep Foundation |
| 768 | `bp-md` | MAP | Keep Foundation |
| 900 | Dashboard compact | REVIEW | TBD — Owner + Semantic Owner |
| 1023.98 | mobile shell · `bp-lg` | REVIEW | MAP `bp-lg` **or** Runtime alias |
| 1100 | Market grid | REVIEW | MAP `bp-xl` **or** NO MAPPING |

Case điển hình:

### A — MAP candidate (Runtime)

```text
1023.98  ·  semantic: mobile-shell  ·  Decision: MAP  ·  Result: bp-lg (1024)
```

Một semantic **mobile shell** — drawer · bottom nav · account mobile — **một** ngưỡng (AC-BP-06).

### B — NO MAPPING · KEEP

```text
520  ·  semantic: alert-form-narrow  ·  Decision: NO MAPPING · KEEP  ·  Result: Exception EXC-520
```

Không ép `520 → 640` nếu Owner chưa đồng ý đổi layout alert.

### C — EXCEPTION (Feature Threshold)

```text
900  ·  semantic: pricing-grid-compact  ·  Decision: EXCEPTION  ·  Result: EXC-900 scoped files
```

Feature Threshold có thể **không** map Foundation — nhưng phải Exception + Semantic Owner.

---

## 5.1 Semantic Completeness Gate (before Phase E)

**Hard stop** giữa Phase C và Phase E.

Một semantic (hoặc per-file row nếu Owner yêu cầu) **chỉ được code** khi đủ:

| Check | |
|-------|--|
| ✅ **Owner** | module signed |
| ✅ **Consumer(s)** | CSS · JS · both — listed in Matrix (derive from 04b at Phase C) |
| ✅ **Decision** | MAP · NO MAPPING · KEEP · EXCEPTION — **Phase C Matrix GO** · not 04b draft alone |
| ✅ **Regression scope** | viewports + surfaces |

Thiếu **bất kỳ** mục → **cấm migrate** row đó.

Sign-off: [`08-Owner-Signoff.md`](08-Owner-Signoff.md) § Semantic Completeness Gate

---

## 6. Phase D — Migration Plan (by layer)

```text
Foundation (tokens + shared helpers)
    ↓
Shared UI (iflux-web-ui.js · block-templates · components)
    ↓
App Shell (drawer · bottom bar · header)
    ↓
Pages (profile · community · market · …)
    ↓
Widgets (per-widget cleanup)
```

Không đảo thứ tự — App Shell trước Pages.

Chi tiết → [`05-Breakpoint-Migration-Strategy.md`](05-Breakpoint-Migration-Strategy.md)

---

## 7. Phase E — Implementation slices

Authority: [`03-Implementation-Plan.md`](03-Implementation-Plan.md) §6 · evidence [`06`](06-Implementation-Evidence.md) rev.8.

| Slice | Scope (summary) |
|-------|-----------------|
| 1 | Foundation — token SoT |
| 2 | Runtime abstraction — **Owner decides shape** · not framework design |
| 3 | App Shell — mobile-shell |
| 4 | Shared UI |
| 5 | Pages |
| 6 | Widgets + Admin + CI |

Workflow Phase E/F: [`12-Slice-Execution-Workflow.md`](12-Slice-Execution-Workflow.md)

---

## 8. Phase F — Regression

Viewport bắt buộc test (Foundation catalog):

```text
375 · 640 · 768 · 1024 · 1280 · 1440 · 1600
```

Mỗi viewport · surface:

- Header · Drawer · Bottom Navigation
- Dashboard · Article · Profile · Community
- Admin shell

Report → [`07-Regression-Report.md`](07-Regression-Report.md)

---

## 9. Out of scope (task này)

| Item | Lý do |
|------|--------|
| Đổi layout/spacing token không liên quan breakpoint | CG-011 |
| Gom Viewport Preview Registry thành 7 khung | Khác mục đích QA |
| Layout Constraint (`min-width: 280px`, …) | §1.1 — không audit |
| Tự thêm breakpoint mới | AC-BP-05 |

---

## 10. Governance rule (LOCKED)

**GR-BP-01 — No literal breakpoint outside Foundation or Exception Registry**

Consumer **cấm** định nghĩa ngưỡng responsive bằng literal:

```js
// CẤM
window.innerWidth < 983
```

Phải reference runtime abstraction / Foundation helper (shape Owner-approved):

```js
// illustrative — not locked
Breakpoint.below('bp-lg')
```

CSS: literal px chỉ từ `layout.css` sync hoặc Exception-scoped file.

---

| AC-BP-07 | Một semantic → một token · nhiều semantic → cùng token OK |
| AC-BP-08 | CI `check-breakpoints.py` PASS |

Chi tiết → [`02-SoT.md`](02-SoT.md) · [`11-CI-Breakpoint-Audit.md`](11-CI-Breakpoint-Audit.md)

---

## 11. Governance (summary)

| Rule | |
|------|--|
| GR-BP-01 | No literal outside Foundation API / Exception |
| GR-BP-02 | Forbidden: `@media 900px` · `innerWidth <= 960` · … |

---

## 12. Success criteria (summary)

| AC | Rule |
|----|------|
| AC-BP-01 | Không BP ngoài catalog nếu chưa Exception |
| AC-BP-02 | JS/CSS cùng semantic |
| AC-BP-03 | Foundation = SoT duy nhất |
| AC-BP-04 | Không regress responsive |
| AC-BP-05 | Không thêm BP mới trong task |
| AC-BP-06 | **Một semantic = một breakpoint band** |
| AC-BP-07 | Một semantic → một token · nhiều semantic → cùng token OK · **cấm** cùng semantic → token khác |

Chi tiết → [`02-SoT.md`](02-SoT.md)

---

## Phase E/F — Slice workflow (rev.8 · ECR execution governance)

Phase E/F: [`12-Slice-Execution-Workflow.md`](12-Slice-Execution-Workflow.md) rev.10

| Mechanism | |
|-----------|--|
| EG-1…EG-4 | Evidence first · failure budget · rollback decision · resume 06 |
| Loop | Implement → Audit → Classify → Auto next |
| MAJOR | STOP → Owner → Rollback **or** Hotfix |
| Gate | Q4 only — P0/A0/S0/M0 |
| Progress | [`06`](06-Implementation-Evidence.md) rev.10 |

---

*Solution rev.6 — principles locked · Owner owns implementation · not API design doc.*
