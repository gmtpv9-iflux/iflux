# Affiliate Attribution Capability — Task Pack

**Mục tiêu:** Refactor Affiliate Attribution theo capability · Journey Independence · REPLACE not EXTEND.  
**Unblocks:** [Notification Platform D5](../270728_Notification%20Platform%20Foundation/PhaseD-D5-Regression-Checklist.md)

---

## Chỉ mục tài liệu

### Audit (input — discovery only)

| File | Loại | Trạng thái |
|------|------|------------|
| [00-Audit-Architecture-Production.md](00-Audit-Architecture-Production.md) | **Audit** kiến trúc Production · lifecycle · violations V1–V15 | ✅ LOCKED (evidence) |
| [00-Audit-D5-R1-Referral-Failure.md](00-Audit-D5-R1-Referral-Failure.md) | **Audit** D5 R1 FAIL · Path C · root cause chain | ✅ LOCKED (evidence) |

### Plan · Owner · SoT · Solution

| File | Loại | Trạng thái |
|------|------|------------|
| [00-Plan-Owner-Review.md](00-Plan-Owner-Review.md) | Plan rev-2 | ⏳ Chờ duyệt |
| [01-Owner-Decisions-LOCK.md](01-Owner-Decisions-LOCK.md) | Owner Decision OD-AFF | 🔒 LOCKED |
| [02-SoT-Affiliate-Attribution.md](02-SoT-Affiliate-Attribution.md) | **SoT** Product + Rules + AC | 📝 Draft — chờ G1 |
| [03-SoT-Affiliate-Context-Contract.md](03-SoT-Affiliate-Context-Contract.md) | **SoT** Context Contract | 📝 Draft — chờ G1 |
| [04-SoT-Identity-And-Event-Contract.md](04-SoT-Identity-And-Event-Contract.md) | **SoT** Identity + Events | 📝 Draft — chờ G1 |
| [05-Solution-Design-Identity-Creation.md](05-Solution-Design-Identity-Creation.md) | **Solution** (implementation-bound) | ✅ Shipped |
| [06-Regression-Checklist.md](06-Regression-Checklist.md) | T1–T18 regression | ⏳ Chờ E2E |
| [08-Acceptance-Gates-G1-G10.md](08-Acceptance-Gates-G1-G10.md) | **Gates G1–G10** · AC-17 · Forbidden Dependency | ⏳ G4–G10 partial · G1 pending |
| [07-Post-Implementation-Audit-Exit-Evidence.md](07-Post-Implementation-Audit-Exit-Evidence.md) | Post-impl audit + grep evidence | ⏳ CHƯA PASS |

**Bản audit gốc (mirror):**

- [`docs/Affiliate-Attribution-Architecture-Audit.md`](../../Affiliate-Attribution-Architecture-Audit.md)
- [`PhaseD-D5-R1-Referral-Failure-Audit.md`](../270728_Notification%20Platform%20Foundation/PhaseD-D5-R1-Referral-Failure-Audit.md)

---

## Thứ tự đọc

```text
Audit (00-Audit-*) → Plan (00-Plan) → Owner (01) → SoT (02–04) → Solution (05) → Impact (plan §7) → Code
```

**Governance:** SoT không mô tả cookie/localStorage/token. Solution (05) mô tả wiring — vẫn chờ Owner duyệt trước code.

---

## Gates

| Gate | Deliverable |
|------|-------------|
| G0 | 01 Owner Decisions APPROVED |
| G1 | 02–04 SoT APPROVED |
| Solution Design | 05 APPROVED |
| G2 | DELETE inventory (plan §7) |
| Ship | AC-1…16 · T1–T15 · D5 R1/R2/R3 re-run |
