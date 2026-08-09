# 03 — Điều kiện chấp nhận hoàn thành Task (Foundation)

**Date:** 2026-07-29  
**Task:** Affiliate V2 Architecture Re-baseline — Foundation (trước Plan)  
**Status:** **LOCKED** — định nghĩa Acceptance Criteria đã khóa  
**Pass Foundation:** ✅ **PASS** — 2026-07-29 (Authoring Gate → được viết / khóa `04-Solution.md`)

**Program artifacts (LOCKED numbering):**  
`00-Audit-Context.md` · `01-Task-Objective.md` · `02-SoT.md` · `03-Acceptance-Criteria.md` · `04-Solution.md`

**Chuỗi Program (LOCKED):**

```text
Audit → Mục tiêu → SoT → Acceptance → Solution → Plan
```

> **Cấm** sửa nội dung AC trong file này sau LOCK mà không có Owner/Reviewer mở lại.

---

## 0. Acceptance chứng minh điều gì

**Câu hỏi duy nhất:**

> Objective Foundation đã đạt chưa — dựa trên Audit và SoT?

**Không** dùng Acceptance để hỏi hygiene tài liệu — thuộc **Foundation Deliverables** (§7).

| Quy tắc | |
|---------|--|
| Mỗi AC **trace** về Objective và/hoặc SoT | Không AC tự sinh |
| Mỗi AC chỉ tới **≥1 Evidence** kiểm được | Không AC cảm tính |
| PASS Foundation → được viết / khóa Solution rồi mở Plan | Plan không sửa SoT · không code Foundation |

---

## 1. Nhóm O — Objective đạt chưa

| ID | Điều kiện | Trace | Evidence | Pass |
|----|-----------|-------|----------|------|
| **AC-O1** | Audit có đủ các khối: ownership · responsibility · dependency · lifecycle · observed patterns — Solution không cần giả định thiếu chủ | Objective §4 · §5 · §8 | `00-Audit-Context.md` D.13 · D.15 · D.16 · D.16.5 · D.17 · D.18 | ✅ |
| **AC-O2** | SoT có Product Motivation · Business Goal · Business Vision | Objective §2 · §3 | `02-SoT.md` §1 · §2 · §3 | ✅ |
| **AC-O3** | Scope Foundation kết thúc ở SoT + Solution — không lấy bug-fix / migrate cookie / sửa Register·Share·Auth làm đích Foundation | Objective §1 · §7 · §9 | `01-Task-Objective.md` §7 · `02-SoT.md` §13 | ✅ |
| **AC-O4** | SoT trả lời được (mức Product): Public Identity là gì · capability nào dùng · ai sở hữu · boundary — để Solution ánh xạ (chưa yêu cầu Implementation Plan đầy đủ) | Objective §8 | `02-SoT.md` §4–§7 · §10–§11 | ✅ |

---

## 2. Nhóm S — SoT đạt chưa

| ID | Điều kiện | Trace | Evidence | Pass |
|----|-----------|-------|----------|------|
| **AC-S1** | Mọi Business Rule / Invariant của Identity nằm trong **một** SoT duy nhất | Objective §4.1 · SoT §14 | `02-SoT.md` §8–§9 (BR-* · PI-*) | ✅ |
| **AC-S2** | Audit không định nghĩa BR/PI Product mới — chỉ ghi nhận Vision/Conflict/Evidence; luật Product chỉ ở SoT | Objective · SoT §14 | So sánh `00` §A–C vs `02-SoT.md` §8–§9 | ✅ |
| **AC-S3** | Solution chỉ map SoT → Architecture — không bổ sung Business Rule · Authority · Ownership · Responsibility · Identity Lifecycle ngoài SoT | SoT §14 · Objective §5 | Binding rule ✅ — **verify lại khi khóa** `04-Solution.md` | ✅ |
| **AC-S4** | SoT **có mặt đủ** các mục sau, và **không** chứa runtime assignment: (1) Business Concepts (2) Concept Relationship (3) Ownership Principles (4) Responsibility Principles (5) Product Roles taxonomy khóa (6) Identity Lifecycle Principles | SoT §4–§6 · §10–§12 | `02-SoT.md` §4 · §5 · §6 · §10 · §11 · §12 · §13 | ✅ |
| **AC-S5** | Phân biệt được: Public Identity (Business SoT) ≠ Navigation Context (runtime projection) ≠ Owner URL (Representation) ≠ Canonical | Objective §3 · SoT §4–§5 | `02-SoT.md` §4–§5 · BR-05/06/09/10 · PI-06/09/10 | ✅ |
| **AC-S6** | Identity Transition chỉ theo Business Event; thuộc Platform Identity; consumer không tự đổi | SoT §6 · BR-13–16 · PI-12–13 | `02-SoT.md` §6.0 · §8–§9 | ✅ |

---

## 3. Nhóm A — Audit đủ chưa

| ID | Điều kiện | Trace | Evidence | Pass |
|----|-----------|-------|----------|------|
| **AC-A1** | Audit có: ownership · responsibility · dependency · lifecycle · observed patterns | Objective §4 · §5 | `00` D.13 · D.15 · D.16 · D.16.5 · D.17 · D.18 | ✅ |
| **AC-A2** | Audit không chứa Architecture Solution / Fix Plan / refactor như đích | Objective §7 | `00` header + §D Cấm + D.17 = Observed Patterns only | ✅ |
| **AC-A3** | Traceability Audit → SoT: mọi BR/PI thuộc (a) **Evidence** neo Audit, hoặc (b) **Owner Decision** (vd. BR-16 / §6.0) | Objective · SoT | Matrix BR/PI ↔ `00` Evidence **hoặc** Owner Decision trong `02-SoT.md` | ✅ |

---

## 4. Nhóm C — Consistency

| ID | Điều kiện | Trace | Evidence | Pass |
|----|-----------|-------|----------|------|
| **AC-C1** | Objective · SoT · Acceptance không mâu thuẫn về Goal · Scope · cấm implementation · Public Identity trung tâm | Objective · SoT | Đọc chéo `01` · `02` · `03` | ✅ |
| **AC-C2** | Mọi AC trong §1–§6 trace về Objective hoặc SoT — không AC tự sinh | File này §0 | Cột Trace của AC-O/S/A/C/R/T | ✅ |
| **AC-C3** | Mỗi AC chỉ tới ≥1 Evidence kiểm được | File này §0 | Cột Evidence của từng AC | ✅ |
| **AC-C4** | Không tồn tại hai artifact định nghĩa cùng một Business Rule / Invariant (Single SoT) | SoT §14 · AC-S1 | BR/PI chỉ trong `02-SoT.md` | ✅ |

---

## 5. Nhóm R — Readiness (mở Solution / Plan)

| ID | Điều kiện | Trace | Evidence | Pass |
|----|-----------|-------|----------|------|
| **AC-R1** | Solution chỉ được phép **map** SoT → Architecture — không bổ sung Business Rule mới | SoT §14 · Objective §5 | Binding rule ✅ — **verify lại khi khóa** `04-Solution.md` | ✅ |
| **AC-R2** | Sau PASS Foundation: Plan chỉ map từ Solution đã khóa — không sửa SoT; không mở lại Audit như nguồn luật mới | Objective §9 · chuỗi §0 | Chữ ký §8 + quy tắc Plan khi tạo Plan | ✅ |
| **AC-R3** | Đủ điều kiện mở viết Solution rồi Plan phase đầu (Capability Impact) — chưa code · chưa hotfix Affiliate | Objective §7 · §9 | Chữ ký Owner + Reviewer §8 | ✅ |

---

## 6. Nhóm T — Traceability (hai chiều)

| ID | Điều kiện | Trace | Evidence | Pass |
|----|-----------|-------|----------|------|
| **AC-T1** | Chuỗi Objective → SoT → Acceptance → Solution **trace được hai chiều** | Chuỗi §0 · Objective §5 | Liên kết chéo `01` · `02` · `03` · (Solution khi viết) | ✅ |
| **AC-T2** | Mỗi BR/PI trong SoT có ≥1 Solution mapping | SoT §8–§9 · §14 | **Pass binding** — hoàn tất mapping khi khóa `04-Solution.md` | ✅ |
| **AC-T3** | Không có phần Solution nào không truy ngược được về SoT | SoT §14 · AC-S3 · AC-R1 | **Pass binding** — verify khi khóa `04-Solution.md` | ✅ |

---

## 7. Foundation Deliverables (Governance — không phải Acceptance Objective)

| ID | Điều kiện | Evidence | Pass |
|----|-----------|----------|------|
| **FD-01** | Thư mục Program đúng 5 artifact: `00` · `01` · `02` · `03` · `04` | Listing | ✅ |
| **FD-02** | Đánh số / tiêu đề / liên kết chéo khớp tên file LOCKED | Header từng file | ✅ |
| **FD-03** | Một file SoT Product — không lẫn Resolver/Writer pipeline implementation | `02-SoT.md` LOCKED | ✅ |
| **FD-04** | Một file Audit: Documentary (§A–C) + Runtime (§D); không Fix/refactor | `00-Audit-Context.md` | ✅ |
| **FD-05** | Không còn file phân mảnh SoT/Architecture/Program/Template trong thư mục Program | Listing | ✅ |
| **FD-06** | Owner + Reviewer đã xem bộ Foundation | Chữ ký §8 | ✅ |

---

## 8. Ký Pass Foundation

| Vai trò | Kết luận | Ngày | Ký |
|---------|----------|------|-----|
| Reviewer | **PASS** | 2026-07-29 | ✅ |
| Owner | **PASS** | 2026-07-29 | ✅ |

**PASS Foundation yêu cầu:** toàn bộ **AC-O · AC-S · AC-A · AC-C · AC-R · AC-T** = Pass (FD kèm).

| Kết quả | Hệ quả |
|---------|--------|
| **PASS** ✅ | Được viết / khóa `04-Solution.md` → sau đó tạo **Plan** — Plan map Solution; **không** sửa SoT; **không** code Foundation |
| **REWORK** | — không áp dụng |

---

### Ghi chú Pass 2026-07-29

* Vá cuối SoT trước Pass: Navigation Context = runtime projection · Owner URL format độc lập business · Identity Transition ∈ Platform Identity (Owner Decision) · Product Roles taxonomy khóa.
* **AC-S3 · AC-R1 · AC-T2 · AC-T3** = Pass **binding** — bắt buộc verify lại khi khóa Solution (không được đẻ luật mới; phải có mapping đủ).
* Pass này là **Authoring Gate** cho Solution — **không** phải lệnh mở Plan ngay nếu Solution chưa khóa.

---

*Acceptance chứng minh Objective · Traceability hai chiều · Foundation PASS 2026-07-29.*
