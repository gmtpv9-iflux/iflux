# SoT — Plan Phase Governance (PG-1.0)

**Mã:** PG-1.0  
**Tầng:** Process / Platform (áp dụng **mọi** Task có Plan Phase)  
**Trạng thái:** ACTIVE — Owner 2026-07-24 (cập nhật Phase Artifact Structure)  
**Mục đích:** Mọi Phase Plan neo **mục tiêu Task** + **mục tiêu Phase** trong chuỗi complete; artifact Phase theo một thứ tự chuẩn (SoT-first).

> Feature SoT (IA, PS, RL…) **không** thay thế tài liệu này.  
> Mọi file kết quả Phase (`docs/runtime-opt/…`, plan Cursor, canvas Phase) **bắt buộc** theo §PG-001 + §PG-007.

---

## PG-001 — Phase Overview (bắt buộc đứng đầu)

Khối Overview **phải** gồm đúng thứ tự:

```text
Task Objective
        ↓
Task Roadmap
        ↓
Current Phase Objective
        ↓
Phase Contribution (→ Task Complete)
        ↓
Exit checklist (preview — chi tiết ở mục Exit artifact)
```

### 1. Task Objective

Mục tiêu **toàn bộ Task** (đích complete), không chỉ phase hiện tại.  
Viết ngắn, kiểm chứng được khi Task xong.

### 2. Task Roadmap

Bảng **mọi Phase** của Task, mỗi dòng một Objective đóng góp vào Task Complete.

| Phase | Objective (vai trò trong hành trình Task) |
| --- | --- |
| … | … |

### 3. Current Phase Objective

- Tên Phase hiện tại  
- Objective cụ thể của Phase  
- Output chính (danh sách ngắn — chi tiết Deliverables ở mục 5 artifact)

### 4. Phase Contribution

Chuỗi logic: Phase này xong → mở được gì → **chưa** được phép gì.

```text
Task Complete
  ↑
Phase N Exit
  ↑
… đóng góp trung gian …
  ↑
Phase 0
```

---

## PG-007 — Phase Artifact Structure (bắt buộc)

Mọi Phase Result / Phase Plan body **theo đúng thứ tự** (sau Overview):

```text
1. Overview          ← §PG-001 (đứng đầu file)
2. Objective         ← mục tiêu Phase (một khối rõ)
3. Scope             ← sẽ rà / sẽ làm gì
4. Evidence          ← bằng chứng / inventory / đo lường
5. Deliverables      ← kết quả đóng gói từ Evidence (không trùng liệt kê Scope)
6. Gap               ← thiếu / lệch / backlog phân loại
7. Out of Scope      ← Phase này không đụng
8. Exit              ← checklist PASS Phase
9. Open Items        ← chờ Owner / SoT khác
10. Phase Verdict    ← kết luận ngắn + next
```

### Quy tắc Scope → Evidence → Deliverable

```text
Scope          = hỏi gì / rà gì
        ↓
Evidence       = thấy gì (bảng, file neo, số đo)
        ↓
Deliverable    = đóng gói kết quả (Catalog, Report, Matrix…)
```

**CẤM** liệt kê cùng một ý hai lần kiểu:

- Scope: “Store Inventory”  
- Deliverables: “Ownership Report”  

mà không nối chuỗi. Đúng:

| Scope | Evidence | Deliverable |
| --- | --- | --- |
| Store / Ownership | bảng owners AS-IS + file neo | Ownership Report |

Deliverable **là kết quả của** Scope + Evidence — không phải danh sách song song trùng nghĩa.

### Violation ID — nhóm theo SoT Owner (SoT-first)

Mọi Violation Report trong Deliverables **phải** nhóm theo tài liệu SoT chịu trách nhiệm:

| Prefix | SoT Owner | Ví dụ |
| --- | --- | --- |
| `V-PS-xx` | PS-1.0 Persistence | LS authoritative business |
| `V-IO-xx` | IO-001 Ownership | thiếu Host / sai caller mount |
| `V-IU-xx` | IU-001 UI / Presentation | lệch §7.1, Component `if (mobile)` |
| `V-IR-xx` | IR-001 Resource Loading | hydrate Summary, bundle sai owner |
| `V-IA-xx` | IA-001 Domain / Runtime kinds | Counter Owner, kind collision |
| `V-IP-xx` | IP-001 Permission | Guest/User policy lệch / thiếu boundary |

Reviewer nhìn ID → biết sửa ở SoT nào. **Cấm** một bảng phẳng trộn PS / Domain / Loading / Presentation không prefix Owner.

---

## PG-002 — Thứ tự sau Overview

Chỉ viết theo §PG-007.  
**CẤM** bắt đầu file Phase bằng bảng kỹ thuật mà không có Task Objective + Roadmap.  
**CẤM** đặt Out of Scope / Exit trước Evidence + Deliverables (trừ Exit preview trong Overview).

---

## PG-003 — Chuỗi logic xuyên suốt (invariant)

```text
Task Objective → Roadmap → Phase Objective
        → Scope → Evidence → Deliverables
        → Gap → Out of Scope → Exit → Open Items → Verdict
        → Next Phase
```

Mỗi Phase phải trả lời được:

1. Task đang đi tới đâu?  
2. Phase này đóng góp gì vào đích đó?  
3. Scope → Evidence → Deliverable đã khép chưa?  
4. Exit gì thì được sang Phase sau?  
5. Phase này **không** được đụng gì?

---

## PG-004 — Quan hệ với SoT khác

| SoT | Quan hệ |
| --- | --- |
| Product Architecture | Product/UI hierarchy — không thay PG |
| Trình tự tối ưu Runtime (Task 3) | Đã có “MỤC ĐÍCH TỔNG THỂ” — Phase mới phải khớp PG-001 + PG-007 |
| PS / IO / IA / IP / IU / IR | Nội dung kỹ thuật; Violation prefix trỏ đúng SoT |
| Plan Cursor (`.cursor/plans`) | Áp dụng Overview + Artifact Structure khi mô tả Phase |

---

## PG-005 — Template tối thiểu

```markdown
# Task N — Phase X — <tên>

## 1. Overview
### Task Objective
…
### Task Roadmap
| Phase | Objective |
| --- | --- |
| … | … |
### Current Phase
…
### Phase Contribution
…

## 2. Objective
…

## 3. Scope
| Scope item | Mô tả |
| --- | --- |
| … | … |

## 4. Evidence
… (inventory / đo / file neo)

## 5. Deliverables
### Mapping Scope → Evidence → Deliverable
| Scope | Evidence | Deliverable |
| --- | --- | --- |
| … | … | … |

### Violation Report (theo SoT Owner)
#### PS — V-PS-xx
#### IO — V-IO-xx
#### IU — V-IU-xx
#### IR — V-IR-xx
#### IA — V-IA-xx
#### IP — V-IP-xx

## 6. Gap
…

## 7. Out of Scope
…

## 8. Exit
- [ ] …

## 9. Open Items
…

## 10. Phase Verdict
…
```

---

## PG-006 — Ví dụ neo Task 6

**Task Objective:** Chuẩn hóa Interaction Feature theo SoT — một Feature · một Component Catalog · nhiều Presentation Host · không hydrate Summary · tuân thủ PS-1.0 · sẵn sàng Runtime Implementation.

**Roadmap:**

| Phase | Objective |
| --- | --- |
| Phase 0 | Audit Baseline |
| Phase 1 | Hoàn thiện SoT |
| Phase 2 | Runtime Contract |
| Phase 3 | API & Store |
| Phase 4 | Migration |
| Phase 5 | Loading |
| Phase 6 | Exit |

Artifact Phase 0: `docs/runtime-opt/ia-1.0/Phase0-Inventory.md`.  
Phase 2: `docs/runtime-opt/ia-1.0/Phase2-Runtime-Contract.md`.

---

## PG-008 — Contract Rule (bắt buộc sau khi có Runtime Contract)

> **Runtime Contract chỉ được phép cụ thể hóa SoT.**

### Được

- Dịch SoT → Contract ID (`RC-*-nn`)  
- Làm rõ boundary / caller / shape đã có trong SoT  

### Cấm

- Thêm Rule không có trong SoT  
- Đổi Rule SoT trong file Contract  
- Diễn giải khác / nới lỏng Rule SoT  
- Implementation tự sửa Contract hoặc tự sinh quy tắc mới  

### Khi SoT thiếu hoặc sai

```text
STOP
  ↓
Update SoT (Phase Architecture / SoT docs)
  ↓
Regenerate / cập nhật Contract cho khớp SoT
  ↓
Tiếp tục Implementation
```

**CẤM** để Contract trở thành “SoT thứ hai”.  
Áp dụng Task 6 Phase 3+ và mọi Task sau (Task 7, 8…).

### Violation khi Impl

Reviewer / Gate dùng ID Contract: ví dụ **vi phạm RC-IO-03**, **vi phạm RC-API-07**, **vi phạm RC-IU-01**.

---

## PG-009 — Implementation Slice (Phase Implementation)

> **Implementation Slice** là đơn vị triển khai nhỏ nhất trong Phase Implementation (Task 6 = Phase 3).

Mỗi Slice **phải** có:

| Khối | Ý nghĩa |
| --- | --- |
| **Scope** | Phạm vi hẹp của slice (không ôm cả Phase) |
| **RC áp dụng** | Danh sách `RC-*-nn` bắt buộc |
| **Deliverable** | File / neo / hành vi ship được |
| **Definition of Done** | Khi nào slice PASS (map RC + checklist liên quan) |

### Cấm lấn Phase

```text
Phase N PASS  →  mới mở Plan Phase N+1
```

- **Không** viết Plan chi tiết Phase 4 / 5 / 6 trong lúc đang làm Phase 3.  
- Roadmap chỉ **tên + vai trò một dòng** — đủ định hướng Task.  
- **Phase 4** Plan Migration — chỉ khi mở Phase 4.  
- **Phase 5** Plan Loading/KPI — chỉ khi mở Phase 5.  
- **Phase 6** Exit Scorecard — chỉ khi Phase 4 + Phase 5 đã PASS.

Áp dụng mọi Task có nhiều Phase Implementation sau này.
