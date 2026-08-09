# 07 — SoT Index · Notification Platform Foundation

**Date:** 2026-07-28  
**Mục đích:** Toàn bộ SoT chi phối task + SoT cục bộ.

---

## 1. Thứ tự authority (LOCKED)

```text
1. Product Architecture V2
2. Architecture audits cục bộ (02–05) + Platform SoT (06)
3. Domain SoT (FN-001, PS-1.0, …)
4. Engineering Change Governance
5. Implementation audit (01) — evidence only
```

---

## 2. SoT repo (external)

| SoT | Path |
|-----|------|
| Product Architecture V2 | [`docs/SoT — iFlux Product Architecture (V2).md`](../../SoT%20—%20iFlux%20Product%20Architecture%20(V2).md) |
| Engineering Change Governance | [`docs/SoT — Engineering Change Governance.md`](../../SoT%20—%20Engineering%20Change%20Governance.md) |
| Follow & Notification FN-001 | [`docs/SoT — Follow & Notification Domain.md`](../../SoT%20—%20Follow%20%26%20Notification%20Domain.md) |
| Plan FN-001 | [`docs/Plan — Follow & Notification (FN-001).md`](../../Plan%20—%20Follow%20%26%20Notification%20(FN-001).md) |
| Persistence PS-1.0 | [`docs/SoT — Persistence & Client Storage Architecture (PS-1.0).md`](../../SoT%20—%20Persistence%20%26%20Client%20Storage%20Architecture%20(PS-1.0).md) |
| Resource Loading Task 4 | [`docs/SoT — Resource Loading Strategy (Task 4).md`](../../SoT%20—%20Resource%20Loading%20Strategy%20(Task%204).md) |
| UR-001 | [`.cursor/rules/ui-relocation-governance.mdc`](../../../.cursor/rules/ui-relocation-governance.mdc) |

---

## 3. Task pack — thứ tự đọc (LOCKED)

```text
01 Implementation Audit
02 Ownership Audit
03 Boundary Audit
04 Variable Contract Audit
05 Runtime Flow Audit
06 Platform SoT          ← LOCK sau 02–05
07 SoT Index             ← file này
08 Admin UX Contract
09 Plan & Roadmap
11 User Preference UI Contract   ← D1-rev
```

---

## 4. SoT cục bộ

| # | File | Loại | Trạng thái |
|---|------|------|------------|
| 01 | [`01-Audit-Current-State.md`](01-Audit-Current-State.md) | Implementation evidence | ✅ đủ — không mở rộng |
| 02 | [`02-Ownership-Audit.md`](02-Ownership-Audit.md) | Architecture | ✅ Phase A |
| 03 | [`03-Boundary-Audit.md`](03-Boundary-Audit.md) | Architecture | ✅ Phase A |
| 04 | [`04-Variable-Contract-Audit.md`](04-Variable-Contract-Audit.md) | Architecture | ✅ Phase A |
| 05 | [`05-Runtime-Flow-Audit.md`](05-Runtime-Flow-Audit.md) | Architecture | ✅ Phase A |
| 06 | [`06-Platform-SoT.md`](06-Platform-SoT.md) | **Platform SoT** | ✅ D1-rev §3.5 locked 2026-07-28 |
| 08 | [`08-Admin-UX-Contract.md`](08-Admin-UX-Contract.md) | Contract | ✅ D1-rev 2026-07-28 |
| 11 | [`11-User-Preference-UI-Contract.md`](11-User-Preference-UI-Contract.md) | Contract | ✅ D1-rev 2026-07-28 |
| 09 | [`09-Plan-Roadmap.md`](09-Plan-Roadmap.md) | Plan | v6 · D5 BLOCKED until D1-rev ship |
| D1-rev | [`PhaseD-D1-rev-Preference-Model-Owner-Decision.md`](PhaseD-D1-rev-Preference-Model-Owner-Decision.md) | Owner Decision | ✅ sign-off 2026-07-28 |
| **D6** | [`PhaseD-D6-Notification-Taxonomy-SoT-Proposal.md`](PhaseD-D6-Notification-Taxonomy-SoT-Proposal.md) | Owner Decision | ✅ approved · [`PhaseD-D6-Exit-Evidence.md`](PhaseD-D6-Exit-Evidence.md) |
| B0 | [`PhaseB-B0-Discovery-Audit.md`](PhaseB-B0-Discovery-Audit.md) | Phase B | ✅ |
| B1 | [`PhaseB-Solution-Proposal.md`](PhaseB-Solution-Proposal.md) | Phase B | ✅ |
| B2 | [`PhaseB-B2-Owner-Decision.md`](PhaseB-B2-Owner-Decision.md) | Phase B | ✅ LOCKED |
| C0 | [`PhaseC-C0-Discovery-Audit.md`](PhaseC-C0-Discovery-Audit.md) | Phase C | ✅ |
| C1 | [`PhaseC-Solution-Proposal.md`](PhaseC-Solution-Proposal.md) | Phase C | ✅ |
| C2 | [`PhaseC-C2-Owner-Decision.md`](PhaseC-C2-Owner-Decision.md) | Phase C | ⏳ |
| 10 | [`10-Developer-Guide-Add-Consumer.md`](10-Developer-Guide-Add-Consumer.md) | Guide | Phase D |

---

## 5. Ma trận SoT → Phase

| Phase | Đọc bắt buộc |
|-------|--------------|
| **A — LOCK SoT** | ✅ 2026-07-28 — 02–06 |
| **B — Template System** | 09 §7 B0–B5 · 06 · 08 · 01 |
| **C — Type Registry** | 09 §8 C0–C6 · C0–C2 deliverables · 04 · 06 §3.2 |
| **D — Consumer Integration** | 09 §9 D0–D5 · 03 · 05 · 10 · FN-001 · 270727 |

---

*SoT Index v2 — 2026-07-28.*
