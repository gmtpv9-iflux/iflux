# Task 6 — Phase 1 — Hoàn thiện SoT

**Ngày:** 2026-07-24  
**SoT Governance:** PG-1.0 (§PG-001 + §PG-007)  
**Baseline:** [`Phase0-Inventory.md`](./Phase0-Inventory.md)  
**Umbrella:** [`docs/SoT — Interaction Feature (IA-1.0).md`](../SoT%20—%20Interaction%20Feature%20(IA-1.0).md)

---

## 1. Overview

### Task Objective

Chuẩn hóa toàn bộ **Interaction Feature** theo SoT: một Feature · một Component Catalog · nhiều Presentation Host · không hydrate Summary · tuân thủ PS-1.0 · sẵn sàng Runtime Implementation.

### Task Roadmap

| Phase | Objective |
| --- | --- |
| Phase 0 | Audit Baseline — **DONE** (evidence) |
| **Phase 1** | **Hoàn thiện SoT** (IO / IA / IP / IU / IR + PS ref) |
| Phase 2 | Runtime Contract (chi tiết hoá / khóa Impl gate) |
| Phase 3 | API & Store |
| Phase 4 | Migration |
| Phase 5 | Loading |
| Phase 6 | Exit |

### Current Phase

**Phase 1** — viết và neo bộ SoT Interaction trên Baseline Phase 0.  
**Không** sửa Runtime / UI / API production.

### Phase Contribution

```text
Task 6 Complete
  ↑ Phase 6 …
  ↑ Phase 2 Runtime Contract / Impl gates
  ↑ Phase 1 SoT pack DRAFT → Owner Architecture PASS
  ↑ Phase 0 Audit Complete
```

Phase 1 xong (Owner PASS) → được mở Phase 2 formal.  
**Impl code vẫn chưa** nếu Architecture Review chưa PASS (PS Q0 + Owner tick checklist).

---

## 2. Objective

Đóng gói **SoT-first** đủ để Architecture Review: Ownership, Domain sạch permission, Presentation §7.1, Loading Summary=0, API/Store contract, Permission boundary — mọi Violation Phase 0 map được sang đúng file SoT Owner.

---

## 3. Scope

| # | Scope | Việc Phase 1 |
| --- | --- | --- |
| S1 | IO-001 | Ownership chain + mount + Resolver vai trò |
| S2 | IA-001 | Domain kinds · Counter · Events · no Guest matrix |
| S3 | IP-001 | Permission contract + matrix DRAFT |
| S4 | IA-002 | Runtime Summary ≠ Interactive |
| S5 | IA-003 | API + Store contract (counts-only Summary) |
| S6 | IU-001 | Catalog tối thiểu + §7.1 khóa trong file SoT |
| S7 | IR-001 | 0 bundle / 0 Store init Summary |
| S8 | Bookmark Ext | Target rules v1 |
| S9 | Umbrella IA-1.0 | Index + Architecture checklist |
| S10 | PS-1.0 | Tham chiếu — **không** tự duyệt thay Owner |

---

## 4. Evidence

| Nguồn | Dùng cho |
| --- | --- |
| Phase 0 Inventory (V-PS/IO/IU/IR/IA/IP) | Map luật SoT ↔ violation |
| Plan IA-1.0 (reviewer lock §7.1, K1–K5) | Nội dung khóa chuyển vào file SoT |
| PS-1.0 DRAFT | Persistence Follow |

Không đo runtime mới trong Phase 1 (Out of Scope).

---

## 5. Deliverables

### 5.1 Scope → Evidence → Deliverable

| Scope | Evidence | Deliverable (file) |
| --- | --- | --- |
| S1 | V-IO-01/02 · plan ownership | `SoT — Interaction Ownership (IO-001).md` |
| S2 | V-IA-01…03 · kinds | `SoT — Interaction Domain (IA-001).md` |
| S3 | V-IP-01/02 · Q3 | `SoT — Interaction Permission (IP-001).md` |
| S4 | Summary≠Interactive | `SoT — Interaction Runtime (IA-002).md` |
| S5 | API gaps Phase 0 | `SoT — Interaction API Store (IA-003).md` |
| S6 | V-IU-01/02 · §7.1 | `SoT — Interaction UI (IU-001).md` |
| S7 | V-IR-01…03 | `SoT — Interaction Resource Loading (IR-001).md` |
| S8 | Bookmark targets | `SoT — Bookmark Extension v1.md` |
| S9 | Toàn bộ | `SoT — Interaction Feature (IA-1.0).md` |
| — | Phase artifact | **File này** `Phase1-SoT.md` |

### 5.2 Violation → SoT Owner (đóng vòng Phase 0)

| Violation | SoT xử lý luật |
| --- | --- |
| V-PS-01/02 | PS-1.0 + IA-003 migrate |
| V-IO-01/02 | IO-001 |
| V-IU-01/02 | IU-001 + IO-003 |
| V-IR-01…03 | IR-001 |
| V-IA-01…03 | IA-001 · IA-002 · IA-003 |
| V-IP-01/02 | IP-001 |

---

## 6. Gap

| Gap | Ai khóa | Phase tiếp |
| --- | --- | --- |
| PS-1.0 Owner duyệt (Q0) + TTL 30s | Owner | Trước/song song Architecture PASS |
| Q3 Guest share URL-only | Owner → IP-001 | Trước Impl share |
| Q4 Resolver module name | Owner khi Impl | Phase 2+ |
| Q1 KPI 80KB/700ms | Owner | Phase 5 |
| OpenAPI routes like/fav/share | Eng | Phase 3 |
| DS atoms ActionBar/Sheet đầy đủ | DS + IU | Impl |
| Architecture Review PASS tick | Owner | Gate sang Phase 2 formal |

---

## 7. Out of Scope

- Sửa code / UI / API / migrate  
- Tạo InteractionStore thật  
- Bottom-sheet Impl  
- Purge `iflux_stock_comments_v6`  
- Đo perf production  

---

## 8. Exit

| Tiêu chí | Status |
| --- | --- |
| Đủ file IO/IA/IP/IU/IR/IA-002/IA-003/Bookmark/Umbrella | **Đạt** |
| IA-001 không Guest matrix | **Đạt** |
| §7.1 trong IU-001 | **Đạt** |
| Violation Phase 0 map SoT Owner | **Đạt** |
| PG-007 artifact Phase 1 | **Đạt** |
| Owner Architecture PASS | **Phase 1 PASS (Architecture Draft)** — 2026-07-24 |
| PS-1.0 Owner duyệt | **KHÓA** (Q0) |
| Không đổi Runtime | **Đạt** |

Checklist:

- [x] SoT pack written  
- [x] Umbrella + Ownership Matrix  
- [x] Q0 / Q3 / Q4 khóa vào SoT  
- [x] Phase 1 Architecture Draft PASS  
- [ ] Owner mở Phase 2  
- [x] Không sửa code

---

## 9. Open Items

1. ~~Q0 PS-1.0~~ — **KHÓA** (Owner duyệt + TTL 30s)  
2. ~~Q3 Guest share URL-only~~ — **KHÓA** (`share_url` Guest = YES)  
3. ~~Q4 Resolver neo~~ — **KHÓA** (`IfluxInteractionPresentationResolver` · chỉ IO)  
4. **Q1** KPI 80KB/700ms — hoãn Phase 5 (không chặn Phase 2)  
5. Owner **mở Phase 2** Runtime Contract chính thức — **DONE** (artifact `Phase2-Runtime-Contract.md`)  
6. Owner **PASS Phase 2** Contracts  
7. Entitlement catalog gắn comment/like (Impl)  
8. OpenAPI like/fav/share (Phase 3)  

---

## 10. Phase Verdict

**Phase 1: PASS (Architecture Draft)** — Owner review ~9.3/10.

Đã khóa: **PS-1.0** + **Presentation Resolver trong IO-001** + **Q3 Guest share URL-only** + **SoT Ownership Matrix**.

**Phase 2:** Owner đã mở — xem [`Phase2-Runtime-Contract.md`](./Phase2-Runtime-Contract.md). Architecture không redesign trong Phase 2.
