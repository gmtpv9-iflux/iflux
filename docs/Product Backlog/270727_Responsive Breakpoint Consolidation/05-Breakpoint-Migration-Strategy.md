# 05 — Breakpoint Migration Strategy · Phase D

**Date:** 2026-07-27 (rev.6)  
**Status:** **DRAFT — blocked by Phase C**  
**SoT:** [`02-SoT.md`](02-SoT.md) rev.6  
**Abstraction:** [`10`](10-Semantic-Breakpoint-API.md) — Owner decides API shape

---

## 1. Nguyên tắc migration

| # | Rule |
|---|------|
| M1 | Không big-bang |
| M2 | Layer order §2 — App Shell trước Shared UI |
| M3 | Matrix Decision required |
| M4 | NO MAPPING · KEEP → 09 only |
| M5 | EXCEPTION → 09 + JSON + TTL |
| M6 | Partial regression per slice |
| M7 | Slice 6 CI v1 PASS (AC-BP-08) |

---

## 2. Layer order (LOCKED)

```text
Foundation → Runtime abstraction (Owner shape) → App Shell → Shared UI → Pages → Widgets+Admin → CI
```

---

## 3. Runtime abstraction (Slice 2)

**Principle regardless of shape:** consumers read semantics/tokens — px always from Foundation. Runtime implementation may change; consumer surface should stay stable when possible ([`02`](02-SoT.md) P8).

**Shape not locked:** Owner decides per [`10`](10-Semantic-Breakpoint-API.md) §2.

---

## 4. High-risk — mobile-shell → bp-lg

| Step | Action |
|------|--------|
| 1 | Owner: semantic `mobile-shell` → `bp-lg` (Phase C) |
| 2 | Abstraction exposes mapping (Slice 2) |
| 3 | App Shell consumers migrate atomically (Slice 3) |
| 4 | Regression 1023 · 1024 · 1025 |

---

## 5. Exception workflow

Phase C → row **09** + JSON + **Expiry ≤ 6mo** ([`09`](09-Breakpoint-Exception-Registry.md) TTL policy)

---

## 6. Per-slice scope (summary)

See [`03`](03-Implementation-Plan.md) §6 Exit criteria.

---

## 7. Rollback strategy (LOCKED)

### 7.1 Nguyên tắc

| Rule | |
|------|--|
| R1 | Rollback **theo slice** — git revert commit slice |
| R2 | **Ưu tiên revert semantic mapping** — không revert pages đã migrate ở slice sau nếu không cần |
| R3 | Deploy revert + CF purge (production) |
| R4 | Evidence rollback trong 06 |

### 7.2 Ví dụ — Slice 3 App Shell fail (`1023.98` → `1024`)

```text
Symptom: drawer/bottom broken at 1024

Rollback scope (minimal):
  • Revert App Shell files (iflux-web-ui.js, app-shell.css, account-feature-boot.js, …)
  • Revert abstraction mobile-shell mapping ONLY if mapping changed in Slice 2/3
  • DO NOT revert Slice 5 page CSS unless pages were migrated in same commit

Verify:
  • 1023/1024 boundary behavior restored
  • check-breakpoints.py — expect pre-slice violation count
  • Profile Nav smoke
```

### 7.3 Slice isolation

| Failed slice | Revert | Keep |
|--------------|--------|------|
| Slice 3 App Shell | Shell + mapping | Foundation · abstraction module shell · pages untouched |
| Slice 5 Pages | Page files in commit | App Shell · Shared UI |
| Slice 6 CI | CI config + last migrations | Prior slices if stable |

### 7.4 Rollback Gate (workflow — EG-3)

Khi Self-Audit báo Regression **MAJOR** ([`12`](12-Slice-Execution-Workflow.md) §8–§9):

1. **STOP** — không Slice N+1 · không fix-forward mù  
2. **Report Owner** + evidence 06  
3. Owner quyết: **Rollback** (default recommendation) · **Hotfix** · defer  
4. Chỉ **sau** Owner chọn Rollback → revert §7.2–7.3 · deploy · document 06  

Agent **cấm** auto revert production trước Owner decision (trừ Owner pre-authorize playbook).

---

## 8. Definition of done (migration)

- [ ] Exit criteria per slice (03 §6)
- [ ] 06 evidence each slice
- [ ] CI v1 exit 0 (Slice 6)
- [ ] Rollback tested note for Slice 3 (dry-run revert path documented)

---

*Strategy rev.8 — rollback Owner decision EG-3.*
