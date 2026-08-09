# Task 6 — Phase 5 — Loading & KPI

**Ngày:** 2026-07-24  
**SoT Governance:** PG-1.0 + PG-008 + PG-009  
**Contracts:** [`Phase2-Runtime-Contract.md`](./Phase2-Runtime-Contract.md) — RC-IR-*  
**SoT:** [`SoT — Interaction Resource Loading (IR-001).md`](../../SoT%20—%20Interaction%20Resource%20Loading%20(IR-001).md)  
**Prerequisite:** [`Phase4-Migration.md`](./Phase4-Migration.md) — **PASS Exit** (Owner 2026-07-24)

**Hướng Phase (khóa):**

> Phase 5 chỉ **Loading / KPI** theo RC-IR-01…05 + đo Q1.  
> **Cấm** redesign SoT / tự sửa Contract (PG-008).  
> **Cấm** viết Plan Phase 6 chi tiết tại đây trước Phase 5 Exit (PG-009).

---

## 0. Open Gate

| Prerequisite | Status |
| --- | --- |
| Phase 4 Slice 4.1–4.5 Impl | ✓ |
| Phase 4 DoD + Matrix | ✓ |
| **Owner PASS Phase 4 Exit** | ✓ Owner «tiếp tục hoàn thiện Task 6» 2026-07-24 |
| Owner PASS Phase 5 Plan | ✓ cùng lệnh (mở Slice Impl) |

---

## 1. Overview

| Phase | Objective | Status |
| --- | --- | --- |
| 0–3 | Audit → SoT → Contract → Impl | PASS |
| 4 | Migration | **PASS Exit** |
| **5** | **Loading & KPI** | **PASS Exit** |
| 6 | Exit Scorecard | **PASS** — Task COMPLETE |

### Objective

- RC-IR-01…03: Summary path **không** ép Interactive bundle / Store interactive / hydrate thread.  
- RC-IR-04: Interactive load on Host mount, scoped.  
- Q1 NFR: Interactive entry **≤ 80KB / 700ms** (đo Prod → khóa hoặc báo Gap).

---

## 3.1 Slices

| Slice | Scope | Status |
| --- | --- | --- |
| **5.1** | Baseline bytes + hygiene `/binh-luan` fallback nginx | **PASS** |
| **5.2** | Boot tách `ensureForSummary` vs `ensureForInteractive`; Article dùng Summary trước | **PASS** |
| **5.3** | KPI Prod measure (entry comments Host) | **PASS** |
| **5.4** | Phase 5 Exit + mở cửa Phase 6 | **PASS** |

```text
✓ Phase 4 Exit
  ✓ Slice 5.1
  ✓ Slice 5.2
  ✓ Slice 5.3
  ✓ Slice 5.4 Exit
  → Phase 6
```

### Slice 5.1 — Baseline + hygiene

| | |
| --- | --- |
| **Scope** | Đo raw/gzip Interaction modules; nginx `location = /binh-luan` |
| **RC** | RC-IR-05 hygiene · không regress Host |
| **DoD** | Evidence bảng bytes trong artifact; `/binh-luan` 200 |
| **Status** | **PASS** — 2026-07-24 |

#### Baseline bytes (local, gzip)

| Module | raw | gzip |
| --- | --- | --- |
| persistence-adapter | 3390 | 1228 |
| interaction-api | 6335 | 1745 |
| interaction-store | 4007 | 1229 |
| permission | 2064 | 865 |
| catalog/index | 11102 | 3219 |
| interaction-host | 5391 | 1467 |
| presentation-resolver | 3057 | 1206 |
| **Summary stack (không resolver)** | ~32KB | **~9.8KB** |
| **+ Interactive extra** | +3KB | **+1.2KB** |

#### Hygiene

- [x] nginx `location = /binh-luan` → comments Host  
- [x] Nested paths `/co-phieu/…/binh-luan` giữ 200  

### Slice 5.2 — Summary vs Interactive boot

| | |
| --- | --- |
| **Scope** | `boot.js` SCRIPTS_SUMMARY / SCRIPTS_INTERACTIVE; Article `ensureForSummary` rồi lazy Interactive khi mount sidebar |
| **RC** | RC-IR-01 · RC-IR-02 · RC-IR-04 |
| **DoD** | Mobile Article chỉ Summary path; Desktop lazy Interactive trước mount interactive |
| **Status** | **PASS** — 2026-07-24 (`ixP5s520260724`) |

Evidence: `interaction/boot.js` · `community-post-page.js` init=`ensureForSummary` · mount sidebar=`ensureForInteractive`.

### Slice 5.3 — KPI Q1

| | |
| --- | --- |
| **Scope** | Đo transfer size entry IX stack trên Prod |
| **DoD** | Số đo trong artifact; PASS nếu ≤80KB |
| **Status** | **PASS** — 2026-07-24 |

#### Evidence Prod (`ixP5s520260724`, Accept-Encoding gzip)

| Metric | Giá trị | Ngưỡng Q1 | Verdict |
| --- | --- | --- | --- |
| IX stack download (8 file) | **11 737 B ≈ 11.5 KB** | ≤ 80 KB | **PASS** |
| `/binh-luan` HTTP | 200 | — | **PASS** |
| `/co-phieu/HPG/binh-luan` | 200 | — | **PASS** |

### Slice 5.4 — Exit

| | |
| --- | --- |
| **Status** | **PASS** — Owner 2026-07-24 |
| **Next** | [`Phase6-Exit.md`](./Phase6-Exit.md) |

---

## 5.3 Checklist

- [x] Summary path không ép Interactive resolver trước (RC-IR-01…03) — Slice 5.2  
- [x] Interactive scoped + lazy (RC-IR-04) — Slice 5.2  
- [x] Không tái diễn V-IR Phase 0 (RC-IR-05) — giữ Phase 4  
- [x] Q1 đo được trên Prod — Slice 5.3  

---

## 8. Exit

| Tiêu chí | Status |
| --- | --- |
| Phase 5 Plan | **PASS** — Owner 2026-07-24 |
| Slice 5.1–5.4 | **PASS** |
| Phase 5 Implementation Exit | **PASS** — Owner 2026-07-24 |

**Phase 5: PASS.** Task 6 → [`Phase6-Exit.md`](./Phase6-Exit.md) — **COMPLETE**.
