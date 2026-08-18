# SoT — Interaction Feature (IA-1.0 Umbrella)

**Mã:** IA-1.0  
**Task:** Task 6  
**Trạng thái:** Phase 1–3 PASS · Phase 4 Plan PASS · **4.1–4.3 PASS** · **4.4 OPEN Impl** (Q-4.4 PASS) · 4.5 chưa · Phase 5/6 chưa mở  
**Governance:** PG-1.0 + PG-008 + PG-009 + UR-001  
**Chuỗi:** SoT → Contract → Implementation PASS → **Migration (4.4 Impl)**

> Phase 4/5/6 Plan **không** viết trước — chỉ khi Owner mở đúng Phase (PG-009).

---

## Mục tiêu Feature

Một Interaction Feature · một Component Catalog · nhiều Presentation Host · không hydrate Summary · tuân thủ PS-1.0 · sẵn sàng Runtime Impl sau Architecture gate Phase 2.

---

## SoT Ownership Matrix (One Source of Truth)

| SoT | Owner (đúng một việc) | Không làm |
| --- | --- | --- |
| **IO-001** | Ownership + **Presentation Resolver** + mount | Permission matrix · kinds · bundle KPI |
| **IA-001** | Domain (kinds · Counter · Events) | Guest matrix · Resolver logic · UI host |
| **IA-002** | Runtime contract Summary ≠ Interactive | Chọn presentation · Permission |
| **IA-003** | API + Store contract | Presentation · Loading KPI |
| **IP-001** | Permission (Guest/User/…) | Domain kinds · Resolver |
| **IU-001** | UI Catalog + §7.1 Presentation **matrix** | `resolve()` host · Store · Guest matrix |
| **IR-001** | Loading (0 Store / 0 Bundle Summary) | Ownership chain · Permission |
| **PS-1.0** | Persistence platform | Interaction kinds · UI |
| **Bookmark Ext** | Target rules `bookmark` | Core Domain cứng trong IA |

Reviewer / Cursor: sửa khái niệm → **đúng một hàng** trong bảng.

---

## Bộ tài liệu (đọc theo thứ tự)

| # | Mã | File | Vai trò |
| --- | --- | --- | --- |
| 0 | PS-1.0 | `SoT — Persistence & Client Storage Architecture (PS-1.0).md` | Platform persistence — **LOCKED** |
| 1 | IO-001 | `SoT — Interaction Ownership (IO-001).md` | Ownership + Resolver neo **KHÓA** |
| 2 | IA-001 | `SoT — Interaction Domain (IA-001).md` | Kinds · Counter · Events |
| 3 | IP-001 | `SoT — Interaction Permission (IP-001).md` | Guest/User — Q3 **KHÓA** |
| 4 | IA-002 | `SoT — Interaction Runtime (IA-002).md` | Summary ≠ Interactive |
| 5 | IA-003 | `SoT — Interaction API Store (IA-003).md` | API + Store · counts-only |
| 6 | IU-001 | `SoT — Interaction UI (IU-001).md` | Catalog + §7.1 |
| 7 | IR-001 | `SoT — Interaction Resource Loading (IR-001).md` | 0 Store init Summary |
| 8 | Bookmark Ext | `SoT — Bookmark Extension v1.md` | Target rules — **Extension**, không Core |

**Baseline:** `docs/runtime-opt/ia-1.0/Phase0-Inventory.md`  
**Phase 1:** `docs/runtime-opt/ia-1.0/Phase1-SoT.md`  
**Phase 2:** `docs/runtime-opt/ia-1.0/Phase2-Runtime-Contract.md` — **PASS** (`RC-*-nn`)  
**Phase 3:** `docs/runtime-opt/ia-1.0/Phase3-Implementation.md` — **PASS (DoD)**  
**Phase 4:** `docs/runtime-opt/ia-1.0/Phase4-Migration.md` — **Plan PASS**

---

## Quyết định Owner (đã khóa)

| ID | Quyết định | Status |
| --- | --- | --- |
| **Q0** | PS-1.0 duyệt + TTL Summary **30s** | **KHÓA** |
| **Q3** | Guest Share **URL-only** = Allow | **KHÓA** |
| **Q4** | Resolver neo = `IfluxInteractionPresentationResolver` · chỉ trong IO | **KHÓA** |
| **Q1** | KPI 80KB / 700ms | **Chưa khóa** — NFR → Phase 5 |
| **Q-4.4-A…D** | Thread registry · routes · summary · LS cutover | **PASS** 2026-07-24 — IA-001 §6b · IA-003 §3b–3d · RC-API-08…12 |

---

## Architecture Review checklist

- [x] IO-001 diagram + caller `mountInteraction`  
- [x] Resolver **chỉ IO** + neo khóa (Q4)  
- [x] IA-001 không Guest matrix · Bookmark = Extension  
- [x] PS-1.0 Owner duyệt (Q0)  
- [x] IU-001 §7.1 · IP-001 Q3  
- [x] Phase 1 PASS (Architecture Draft) — Owner 2026-07-24  
- [x] Gate mở Phase 2 — Owner đồng ý (Runtime Contract only)  
- [x] Phase 2 Contract Owner **PASS** (ID chuẩn · RC-IU-01 · RC-API-07)  
- [x] Phase 3 OPEN — Impl-only-RC + PG-008  
- [x] Phase 3 Impl Exit (**PASS** DoD 2026-07-24)  

**Impl Runtime code:** được phép **chỉ** theo RC-*; vi phạm = cite `RC-*-nn`.

---

## Gate Phase 4 (Owner)

```text
Phase 3 DoD PASS
  → Phase 4 Plan OPEN (artifact sẵn)
  → Owner PASS Plan → Slice 4.1…
  → Phase 4 DoD Exit → mới Plan Phase 5
CẤM: Plan Phase 5/6 trước Phase 4 Exit (PG-009)
CẤM: Impl tự sửa Contract (PG-008)
```