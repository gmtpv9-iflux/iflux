# Task 6 — Phase 6 — Exit

**Ngày:** 2026-07-24  
**SoT Governance:** PG-1.0 + PG-008 + PG-009  
**Prerequisite:** Phase 0–5 PASS · [`Phase5-Loading.md`](./Phase5-Loading.md) Exit PASS

---

## 0. Open Gate

| Prerequisite | Status |
| --- | --- |
| Phase 4 Migration Exit | ✓ |
| Phase 5 Loading/KPI Exit | ✓ |
| Owner mở Phase 6 | ✓ «tiếp tục hoàn thiện Task 6» 2026-07-24 |

---

## 1. Mục đích

Xác nhận Task 6 (Interaction Feature IA-1.0) **đủ điều kiện đóng** theo Architecture + Technical gate — không redesign.

---

## 2. Exit Scorecard

### 2.1 Architecture

| Hạng mục | Evidence | Tick |
| --- | --- | --- |
| SoT pack Phase 1 LOCKED | Phase1 PASS | [x] |
| Runtime Contract RC-* | Phase2 PASS | [x] |
| Ownership / Host / Catalog | Phase3 Article + Phase4 Comments Host | [x] |
| Summary ≠ Interactive | Phase3 · Phase5 boot tách | [x] |
| PS-1.0 · LS không authoritative Comment | Phase4 key RETIRED | [x] |

### 2.2 Technical / Prod

| Hạng mục | Evidence | Tick |
| --- | --- | --- |
| Summary API counts-only | `GET /api/interaction/v1/summary` 200 | [x] |
| Comments Host nested + bare `/binh-luan` | 200 Prod | [x] |
| Auth Bearer POST comment | `getToken` fix `ix45AuthFix` | [x] |
| Dual stack collapsed | Phase4.2 | [x] |
| IR-05 hygiene | Phase4.3 | [x] |
| Q1 IX stack ≤ 80KB | **~11.5 KB** gzip (Phase5.3) | [x] |
| Default post-login = Cộng đồng | `appHomePath` → `/cong-dong` | [x] |
| Zombie root shell quarantined | `_quarantine_zombie_*` · `/index.html`→301 | [x] |

### 2.3 Backlog (không chặn Exit)

| Item | Ghi chú |
| --- | --- |
| Bottom-sheet chrome đầy đủ (V-IU-01) | Host presentation sẵn; UI sheet sau |
| Catalog split file Summary/Interactive | Boot đã tách; catalog còn chung file |
| Feed Summary CommunityStore stats | Ngoài Interactive Migration |

---

## 3. Definition of Done (Task 6)

> Task 6 PASS khi Scorecard Architecture + Technical tick đủ và Owner ký Exit.

- [x] Một Feature Interaction · Catalog · nhiều Host  
- [x] Summary ≠ Interactive · RC-IR  
- [x] Persistence API SoT · LS comment retired  
- [x] Migration bề mặt `/binh-luan` + entity CTA  
- [x] KPI Q1 IX entry đạt  

---

## 8. Exit

| Tiêu chí | Status |
| --- | --- |
| Scorecard Architecture | **PASS** |
| Scorecard Technical | **PASS** |
| **Owner PASS Task 6 Exit** | **PASS** — Owner 2026-07-24 |

```text
Task 6 Interaction (IA-1.0)
  ✓ Phase 0 Audit
  ✓ Phase 1 SoT
  ✓ Phase 2 Contract
  ✓ Phase 3 Impl
  ✓ Phase 4 Migration
  ✓ Phase 5 Loading/KPI
  ✓ Phase 6 Exit
→ TASK COMPLETE
```

**Verdict: Task 6 — COMPLETE (Owner Exit 2026-07-24).**
