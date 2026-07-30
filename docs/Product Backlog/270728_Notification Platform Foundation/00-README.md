# 00 — README · Notification Platform Foundation

**Date:** 2026-07-28  
**Folder:** `docs/Product Backlog/270728_Notification Platform Foundation/`  
**Trạng thái:** ✅ Phase B PASS → ✅ **Phase C PASS** (C6 Production 2026-07-28)

---

## Mục đích

**Business Outcome:** Product mô tả event · người nhận · nội dung · biến · bucket → Developer triển khai **không thiết kế lại Platform**. Chi tiết: [`09-Plan-Roadmap.md`](09-Plan-Roadmap.md) §1.1–§1.2.

Chuẩn bị **Notification Platform Foundation**:

> **Xây Platform — Affiliate · Community · Orders chỉ là consumers.**

1. Developer đăng ký **Notification Type** + seed template
2. Admin chỉnh copy trên UI hiện có (ADM-SYS-003)
3. Consumer emit type → Platform dispatch → deliver

**Governance (mọi phase):** Discovery Audit → Solution Proposal → Owner Decision → Implementation → Cleanup → Regression → Drift Audit PASS.

---

## Thứ tự tài liệu (LOCKED)

```text
01 Implementation Audit        ← đủ, không mở rộng
02 Ownership Audit
03 Boundary Audit
04 Variable Contract Audit
05 Runtime Flow Audit
06 Platform SoT                ← LOCK sau 02–05
07 SoT Index
08 Admin UX Contract           ← LOCKED
09 Plan & Roadmap
Phase B/C deliverables
```

## Phase C workflow (LOCKED)

```text
C0 Discovery Audit        ✅ PhaseC-C0-Discovery-Audit.md
        ↓
C1 Solution Proposal      ✅ PhaseC-Solution-Proposal.md
        ↓
C2 Owner Decision         ✅ PhaseC-C2-Owner-Decision.md (LOCKED)
        ↓
C3 Implementation         ✅
        ↓
C4 Cleanup → C5 Exit Report ✅ PhaseC-C5-Exit-Report.md
        ↓
C6 Production             ✅ PhaseC-C6-Functional-Regression.md
        ↓
Phase C PASS ✅
```

## Phase B workflow (LOCKED)

```text
B0 Discovery Audit        ✅ PhaseB-B0-Discovery-Audit.md
        ↓
B1 Solution Proposal      ✅ PhaseB-Solution-Proposal.md
        ↓
B2 Owner Decision         ✅ PhaseB-B2-Owner-Decision.md (LOCKED)
        ↓
B5 Architecture Verification ✅ PhaseB-B5-Exit-Report.md
        ↓
B6 Functional Regression ✅ PhaseB-B6-Functional-Regression.md
        ↓
Phase B PASS ✅
```

## Thứ tự thi công

```text
Pre-flight (Phase A ✅ LOCKED) → Phase B → Phase C → Phase D Consumer Integration
```

Affiliate task [`270727`](../270727_Affiliate%20Members%20Table%20%26%20Referral%20Welcome%20Notification/00-README.md) = **Phase D consumer**.

---

## Phase D workflow (LOCKED — rev Owner 2026-07-28)

```text
D0 Discovery Audit              ✅ Owner sign-off · Runtime Ownership Matrix
        ↓
D1 Solution + Owner Decision  ⏳ 4 architecture locks added — chờ final sign-off
        ↓
D2 Implementation               STOP — chờ D1 Owner sign-off
        ↓
D3 Cleanup → D4 Verification → D5 Production
        ↓
Phase D PASS
```

*Khác Phase B/C:* sau audit, **Proposal và Owner Decision gộp D1** — đề xuất trước, quyết định Owner điền trong cùng file.

---

## Danh mục

| # | File | Loại |
|---|------|------|
| 00 | [`00-README.md`](00-README.md) | Index |
| 01 | [`01-Audit-Current-State.md`](01-Audit-Current-State.md) | Implementation audit ✅ |
| 02 | [`02-Ownership-Audit.md`](02-Ownership-Audit.md) | Architecture ⭐ |
| 03 | [`03-Boundary-Audit.md`](03-Boundary-Audit.md) | Architecture ⭐ |
| 04 | [`04-Variable-Contract-Audit.md`](04-Variable-Contract-Audit.md) | Architecture |
| 05 | [`05-Runtime-Flow-Audit.md`](05-Runtime-Flow-Audit.md) | Architecture |
| 06 | [`06-Platform-SoT.md`](06-Platform-SoT.md) | Platform SoT — **✅ LOCKED** |
| 07 | [`07-SoT-Index.md`](07-SoT-Index.md) | SoT index |
| 08 | [`08-Admin-UX-Contract.md`](08-Admin-UX-Contract.md) | Contract ✅ LOCKED · Save/Restore/Preview |
| 09 | [`09-Plan-Roadmap.md`](09-Plan-Roadmap.md) | Plan v6 |
| B0 | [`PhaseB-B0-Discovery-Audit.md`](PhaseB-B0-Discovery-Audit.md) | ✅ B0 PASS |
| B1 | [`PhaseB-Solution-Proposal.md`](PhaseB-Solution-Proposal.md) | ✅ Proposal |
| B2 | [`PhaseB-B2-Owner-Decision.md`](PhaseB-B2-Owner-Decision.md) | ✅ LOCKED |
| B5 | [`PhaseB-B5-Exit-Report.md`](PhaseB-B5-Exit-Report.md) | ✅ Architecture PASS local |
| B5v | [`PhaseB-B5-Architecture-Verification.md`](PhaseB-B5-Architecture-Verification.md) | Grep gate |
| B6 | [`PhaseB-B6-Functional-Regression.md`](PhaseB-B6-Functional-Regression.md) | ✅ Production PASS |
| C0 | [`PhaseC-C0-Discovery-Audit.md`](PhaseC-C0-Discovery-Audit.md) | ✅ C0 PASS |
| C1 | [`PhaseC-Solution-Proposal.md`](PhaseC-Solution-Proposal.md) | ✅ Proposal |
| C2 | [`PhaseC-C2-Owner-Decision.md`](PhaseC-C2-Owner-Decision.md) | ✅ LOCKED |
| C5 | [`PhaseC-C5-Exit-Report.md`](PhaseC-C5-Exit-Report.md) | ✅ Owner APPROVED |
| C6 | [`PhaseC-C6-Functional-Regression.md`](PhaseC-C6-Functional-Regression.md) | ✅ Production PASS |
| Cwf | [`PhaseC-Developer-Seed-Workflow.md`](PhaseC-Developer-Seed-Workflow.md) | ✅ LOCKED |
| D0 | [`PhaseD-D0-Discovery-Audit.md`](PhaseD-D0-Discovery-Audit.md) | ✅ Owner sign-off |
| D1 | [`PhaseD-D1-Solution-And-Owner-Decision.md`](PhaseD-D1-Solution-And-Owner-Decision.md) | ⏳ Chờ sign-off (4 khóa kiến trúc đã bổ sung) |

---

## Đọc theo vai trò

| Vai trò | Đọc |
|---------|-----|
| **Owner (LOCK)** | 02 → 03 → 04 → 05 → **06** → 09 |
| **Agent thi công** | 07 → 01 → 06 → 09 → 08 |
| **Reviewer** | 02 §2 matrix + 05 §2 matrix |

---

## Bước tiếp theo

1. ~~Owner LOCK Phase A~~ ✅ 2026-07-28
2. ~~**B0** Discovery Audit~~ ✅
3. ~~**B1** Solution Proposal~~ ✅
4. ~~**B2 Owner Decision**~~ ✅ LOCKED
5. ~~**B3–B5**~~ ✅ Implementation + Exit Report
6. ~~Deploy + **B6**~~ ✅ Phase B PASS
7. ~~**C0–C2**~~ ✅
8. ~~**C3–C6**~~ ✅ Phase C PASS
9. **Phase D** — D0 ✅ · **D1 chờ Owner** ← hiện tại

---

*Notification Platform Foundation — Phase A LOCKED — 2026-07-28.*
