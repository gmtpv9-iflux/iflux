# 10 — Runtime Breakpoint Abstraction · Owner decision

**Date:** 2026-07-27 (rev.8)  
**Status:** **DRAFT — Owner capability decisions Phase D · Slice 2**  
**SoT px:** Foundation only · [`02-SoT.md`](02-SoT.md) §0.1  
**Task scope:** Consolidate breakpoints — **not** design a breakpoint framework

---

## 1. Nguyên tắc (LOCKED)

```text
Foundation Breakpoint Tokens (layout.css)     ← ONLY SoT for px
        ▼
Runtime abstraction                           ← semantic → Foundation · never defines px
        ▼
Consumers (CSS / JS)                          ← no magic numbers (GR-BP-02)
        ▼
Exception Registry (09)                       ← scoped literals only
```

**Runtime abstraction must not become a second Source of Truth.** Foundation remains the **only** authority for breakpoint **values** (px).

**Consumer contract stability (guideline):** Runtime **may evolve** · consumer contract **should stay stable** when possible.

---

## 2. Owner vs Agent — ai quyết gì (LOCKED)

**Owner quyết** (ghi trong [`08`](08-Owner-Signoff.md) Phase D · **không** hỏi lại ở Phase E):

| # | Owner decision | Nội dung |
|---|----------------|----------|
| **D1** | **Capability boundary** | Runtime abstraction **sở hữu** gì · consumers **bắt buộc** qua abstraction · không magic number (GR-BP-02) |
| **D2** | **Public contract** | Minimal vs rich surface — **capability** consumers được dùng (vd. semantic match · token read · below/above) — **không** khóa tên method |
| **D3** | **CSS bridge strategy** | Sync comment · PostCSS · data-attribute — **một** chiến lược task-wide |
| **D4** | **Semantic catalog v1** | Chỉ từ **Phase C Matrix GO rows** — không 04b draft |

**Agent tự quyết** (implementation · **cấm** hỏi Owner · ghi trong 06 Slice 2):

| Agent chọn | Ví dụ |
|------------|-------|
| File path | `foundation/iflux-breakpoint.js` vs `shared/runtime/breakpoint.js` |
| Module / global name | `IfluxBreakpoint` · `Breakpoint` |
| Class vs function | functional wrapper OK |
| Folder layout | theo convention repo hiện có |
| Export style | ESM default · named · `window.*` |

**Decision Test:** path/folder/class = **implementation** · không phải Owner Decision ([`12`](12-Slice-Execution-Workflow.md) §3.2).

**Agent cấm** Slice 2 cho đến khi **D1–D4 Owner** có trong 08 Phase D (hoặc Phase C bundle nếu Owner gộp gate).

---

## 3. Illustrative examples only (NOT locked API)

§3 ví dụ **minh họa** — không phải contract. Agent chọn shape miễn thỏa D1–D2 capability.

```js
// Illustrative only
Breakpoint.isMobileShell()
Breakpoint.matches('bp-lg')
Breakpoint.below('bp-md')
```

```text
mobile-shell  →  bp-lg  →  1024   (px always from Foundation)
```

Nhiều semantic → cùng token OK (AC-BP-07). **Cấm** cùng semantic → token khác theo file.

---

## 4. CSS bridge (D3 — Owner)

| Option | Note |
|--------|------|
| Sync comment + Foundation literal | Lowest infra |
| PostCSS custom media | Build step |
| Data-attribute from runtime | JS-dependent |

---

## 5. Slice 2 exit criteria

[`03-Implementation-Plan.md`](03-Implementation-Plan.md) §6 Slice 2 · evidence [`06`](06-Implementation-Evidence.md) rev.10.

| Criterion | |
|-----------|--|
| D1–D4 Owner recorded in 08 | ✓ |
| Abstraction implemented · agent path documented in 06 | ✓ |
| Slice 2 consumer migration complete | ✓ |
| No new magic numbers · Foundation sole px authority | ✓ |

---

*Rev.8 — Owner: capability · contract · bridge · catalog · Agent: path/module/export.*
