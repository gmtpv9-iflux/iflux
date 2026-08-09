# 03 — Source of Truth

# Community Market Data — Remove Mock Data & Runtime Market Data Integrity

| | |
|--|--|
| **Task ID** | `090826_Community_Market_Data_Mock_Removal_Runtime_Integrity` |
| **BRD** | [`01-BRD.md`](01-BRD.md) · 🔒 **LOCKED** rev. B · **28 Req ID** |
| **Mandatory Audit** | [`02-Mandatory-Audit.md`](02-Mandatory-Audit.md) · ✅ **APPROVED** rev. B |
| **Document** | Source of Truth — Owner decisions + authority |
| **Date** | 2026-08-09 |
| **Status** | 🔒 **OWNER LOCKED** · D1–D7 **ALL LOCKED** |
| **Implementation** | ✅ **AUTHORIZED** — WP-0…7 |
| **Next gate** | Solution LOCKED · [`05-Plan.md`](05-Plan.md) OPEN/DRAFT |

> SoT khóa **authority / ownership / behavior / luật chơi**.  
> SoT **không** mô tả cách implement.  
> **Cấm** Implementation trước Owner LOCK Plan.

---

## 0. Gate

```text
01 BRD       → LOCKED
02 Audit     → APPROVED
03 SoT       → OWNER LOCKED   ← bạn đã qua
04 Solution  → OWNER LOCKED
05 Plan      → OWNER LOCKED
Implementation → AUTHORIZED (WP-0…7)
```

### Owner Approval (Audit) — giữ nguyên

> GAP Audit = SoT/Solution inputs. Không soft-pass Implementation. Không DELETE CSS theo tên “mock”.

---

## 1. Nguyên tắc khóa (P*)

| # | Principle | Source |
|---|-----------|--------|
| P1 | Production không dùng mock làm market-value authority | BR-01…08,14,15 · **D2** |
| P2 | Unavailable ≠ mock; không fake zero | BR-06,07,12,18 · **D4** |
| P3 | Community = consumer only; không authority riêng | BR-09,10,14 |
| P4 | Mock-data ownership ≠ UI-component ownership | BR-19 · BR-20 · Audit V13–V14 |
| P5 | Trace consumer→DOM/class→CSS trước DELETE\|REUSE\|KEEP\|PROMOTE | **D7** |
| P6 | Cấm xóa CSS/class chỉ vì tên “mock” | BR-19.NONAME |
| P7 | Không xây Design System thứ hai · reuse theo tương đương | **D6** |
| P8 | Cấm bulk-migrate CSS chỉ để “chuẩn hóa” | **D6** |
| P9 | Sector/Eco chưa có runtime performance authority → **UNAVAILABLE** (hợp lệ) | **D1** |
| P10 | Tên khác ≠ component khác | **D6** |
| P11 | Không FE aggregate / API aggregate mới / mock cho Sector/Eco perf (task này) | **D1** |
| P12 | **`IfluxMockMarket` không còn vai trò production** — remove theo BR-19/20; identity = Master/DB thật | **D2** |
| P13 | Schedule → Sync → DB → Runtime/API → UI; đọc persisted mới nhất = không “freshness cũ”; **không** Freshness Contract riêng | **D3** |
| P14 | Có data → REAL; không data → UNAVAILABLE thống nhất; không `0` / mock thay thế | **D4** |
| P15 | Cho phép **phased** delivery; mỗi phase không leak mock/fake; tổng thể đạt BR completeness | **D5** |

```text
Market value (stock)     = runtime / DB persisted quotes (qua sync hiện hữu)
Sector/Eco performance   = UNAVAILABLE (chưa có authority) — D1
Identity                 = Master / DB thật — không IfluxMockMarket — D2
UI                       = existing component / DS / truly-local — D6/D7
```

---

## 2. Audit gaps — đóng / chuyển Solution

| Gap | Status sau SoT LOCK |
|-----|---------------------|
| **G-CSS-01** | Solution deliverable (process **D7**) |
| **G-CSS-02** | Solution deliverable (equivalence map **D6**) |
| **G-CSS-03** | **Đóng** (**D6**) |
| **G-AGG-01** | **Đóng** (**D1**) |

---

## 3. Decision Registry — D1…D7 ALL LOCKED

### D1 — Sector / Ecosystem performance · 🔒 LOCK

Sector/Eco performance chưa có runtime authority → **UNAVAILABLE**.  
Không FE aggregate · không API aggregate mới (task này) · không mock/fake.  
UNAVAILABLE ≠ thiếu tính năng. Aggregate tương lai = OUT OF SCOPE.

| BR | Đạt bằng |
|----|----------|
| BR-03/04 | UNAVAILABLE |
| BR-05 | Stock REAL khi có; Sector/Eco UNAVAILABLE |
| BR-13 | Cấm tự tính/đoán |

---

### D2 — Remove `IfluxMockMarket` · 🔒 LOCK

**Bỏ** câu hỏi “giữ mock làm identity bridge”.

> **`IfluxMockMarket` không còn vai trò trong runtime production của task này.**  
> Xóa/loại bỏ theo trace + migration rules BR-19/20.  
> Identity cần thiết → **Master / DB thật**. Không giữ module mang bản chất mock làm cầu nối.

| BR | Đạt bằng |
|----|----------|
| BR-08 | Không hardcode catalog quote; identity ≠ mock module |
| BR-16 | Mock không load production; test isolation nếu còn mock = ngoài Prod path |

---

### D3 — System Schedule / Sync → DB → Runtime · 🔒 LOCK

**Không** tạo Freshness Contract riêng cho task này.  
**Không** có chuyện “freshness bị cũ” nếu runtime đọc đúng **persisted state mới nhất trong DB**.

Admin **Cấu hình thời gian** chỉ quyết định **khi nào** hệ thống sync.  
Sau sync thành công → DB chứa state mới → Runtime/API **phải** đọc state đó → UI.

```text
Admin
  ↓
Cấu hình thời gian          ← quyết định lịch / khi nào sync
  ↓
System Schedule
  ↓
Sync dữ liệu thật
  ↓
DB                          ← current persisted state
  ↓
Runtime / API hiện hữu
  ↓
UI                          ← record mới nhất; chưa có → UNAVAILABLE
```

#### Luật khóa (D3)

1. DB = source of **current persisted state** sau sync.
2. Runtime/API đọc state mới nhất từ path hiện hữu — **không** lớp freshness song song.
3. Chưa có data trong DB → **UNAVAILABLE** (không mock / không fake “mới”).
4. Task này **không** phát minh freshness architecture; chỉ bảo đảm consumer đi đúng read path đã có.
5. Metadata sync (last_sync_at, …) thuộc cơ chế Admin/Sync hiện hữu — không redefine trong task.

| BR | Đạt bằng |
|----|----------|
| BR-11 | Align Schedule/Sync → DB → Runtime; không Freshness Contract riêng |

---

### D4 — UNAVAILABLE presentation · 🔒 LOCK

Behavior/presentation only:

```text
Có dữ liệu authoritative → hiển thị dữ liệu thật (REAL)
Không có dữ liệu         → UNAVAILABLE thống nhất
```

#### Luật khóa (D4)

1. Không biến UNAVAILABLE thành `0`.
2. Không lấy mock thay thế.
3. Không fake zero / placeholder số giả để đầy UI.
4. Presentation cụ thể (em-dash / empty / copy tiếng Việt) = Solution chọn **một** pattern thống nhất theo DS/token hiện có — SoT khóa **semantics**, không khóa pixel.

| BR | Đạt bằng |
|----|----------|
| BR-12 | Availability state REAL / UNAVAILABLE |
| BR-18 | Integrity > visual completeness |

---

### D5 — Phased implementation · 🔒 LOCK

> **Cho phép chia nhiều phase.**

Mỗi phase **phải**:

* không đưa mock market-value authority trở lại;
* không tạo fake value để lấp chỗ trống;
* không phá integrity consumer chưa migrate (consumer chưa migrate: không được tiếp tục dựa mock như authority “ổn” — phải migrate hoặc UNAVAILABLE theo Plan);
* **cuối cùng** đạt completeness theo BR-15.

Ví dụ khung (Solution/Plan chi tiết hóa):

```text
Phase 1 — Community → runtime thật / UNAVAILABLE → PASS phase
Phase 2 — Market    → runtime thật / UNAVAILABLE → PASS phase
Phase 3 — consumers khác → runtime thật / UNAVAILABLE → PASS phase
        → BR completeness
```

| BR | Đạt bằng |
|----|----------|
| BR-15 | Phased OK + final completeness |

---

### D6 — Design System / Component Reuse · 🔒 LOCK

Không DS thứ hai. Equivalence (visual/behavior/token/DOM) trước tạo mới.  
Có → REUSE. Không → Token+Foundation → Promote nếu reusable. Cấm bulk-migrate.  
**Tên khác ≠ component khác.**

---

### D7 — Inventory process · 🔒 LOCK (process)

SoT không cần full CSS matrix. Solution: Inventory → consumer→DOM→CSS → equivalence → REUSE | PROMOTE DS | KEEP LOCAL.

---

## 4. SoT Checklist (README §2.4) — ALL LOCKED

| BR | Req ID | Audit | SoT | Trạng thái |
|----|--------|-------|-----|------------|
| BR-01 | BR-01 | AUD-MM-01,04 | Stock price = runtime/DB authority; không mock (**D2/D3**) | 🔒 LOCKED |
| BR-02 | BR-02 | AUD-MM-01,04 | Stock change = runtime/DB authority; không mock | 🔒 LOCKED |
| BR-03 | BR-03 | AUD-MM-05,09,10 | Sector perf → UNAVAILABLE (**D1**) | 🔒 LOCKED |
| BR-04 | BR-04 | AUD-MM-06,09,10 | Eco perf → UNAVAILABLE (**D1**) | 🔒 LOCKED |
| BR-05 | BR-05 | AUD-MM-10 | Stock REAL khi có; Sector/Eco UNAVAILABLE (**D1**) | 🔒 LOCKED |
| BR-06 | BR-06 | AUD-MM-07 | Cấm fallback mock (**D2/D4**) | 🔒 LOCKED |
| BR-07 | BR-07 | AUD-MM-07,05 | Cấm fake zero (**D1/D4**) | 🔒 LOCKED |
| BR-08 | BR-08 | AUD-MM-01,11 | Identity Master/DB; remove `IfluxMockMarket` (**D2**) | 🔒 LOCKED |
| BR-09 | BR-09 | AUD-MM-03 | Community consumer-only | 🔒 LOCKED |
| BR-10 | BR-10 | AUD-MM-03 | Cùng authority cross-surface; phase theo **D5** | 🔒 LOCKED |
| BR-11 | BR-11 | AUD-MM-10 | Align System Schedule/Sync → DB (**D3**) | 🔒 LOCKED |
| BR-12 | BR-12 | AUD-MM-07,12 | REAL / UNAVAILABLE (**D4**) | 🔒 LOCKED |
| BR-13 | BR-13 | AUD-MM-09 | Cấm tự tính — UNAVAILABLE (**D1**) | 🔒 LOCKED |
| BR-14 | BR-14 | AUD-MM-02,13 | Không consumer-specific mock authority (**D2**) | 🔒 LOCKED |
| BR-15 | BR-15 | AUD-MM-02,11 | Phased OK; final completeness (**D5**) | 🔒 LOCKED |
| BR-16 | BR-16 | AUD-MM-08,11 | Mock không Prod authority; remove path (**D2**) | 🔒 LOCKED |
| BR-17 | BR-17 | AUD-MM-08 | Không silent re-introduce mock; phase gates (**D5**) | 🔒 LOCKED |
| BR-18 | BR-18 | AUD-MM-14 | Integrity > visual (**D4**) | 🔒 LOCKED |
| BR-19 | BR-19.TRACE | AUD-MM-15 | Process D7 | 🔒 LOCKED |
| BR-19 | BR-19.DEL | AUD-MM-15 | DELETE mock-only sau D7 | 🔒 LOCKED |
| BR-19 | BR-19.KEEP | AUD-MM-15 | KEEP runtime / truly-local | 🔒 LOCKED |
| BR-19 | BR-19.NONAME | AUD-MM-15 | Cấm xóa theo tên mock | 🔒 LOCKED |
| BR-19 | BR-19.NOFALL | AUD-MM-07 | Không mock fallback (**D2/D4**) | 🔒 LOCKED |
| BR-20 | BR-20.OWNER | AUD-MM-15,16 | D6 ownership | 🔒 LOCKED |
| BR-20 | BR-20.PROMOTE | AUD-MM-16 | D6 promote | 🔒 LOCKED |
| BR-20 | BR-20.REUSE-DS | AUD-MM-16 | D6 equivalence reuse | 🔒 LOCKED |
| BR-20 | BR-20.NOBULK | AUD-MM-16 | D6 no bulk | 🔒 LOCKED |
| BR-20 | BR-20.MIGRATE | AUD-MM-16 | D7 migrate then DELETE legacy | 🔒 LOCKED |

**28/28 SoT rows LOCKED.** Không còn Owner decision mở tại SoT.

---

## 5. Governance Status

| Phase | Status |
|-------|--------|
| 01 — BRD | 🔒 **LOCKED** |
| 02 — Audit | ✅ **APPROVED** |
| **03 — SoT** | 🔒 **OWNER LOCKED** · D1–D7 |
| **04 — Solution** | 🔒 **OWNER LOCKED** — [`04-Solution.md`](04-Solution.md) |
| **05 — Plan** | 🔒 **OWNER LOCKED** — [`05-Plan.md`](05-Plan.md) |
| Implementation | ✅ **AUTHORIZED** — WP-0…7 |

### Cấm vẫn giữ đến LOCK Plan

* Implementation / deploy remove-mock trước Plan LOCK
* Soft-pass G-CSS-01/02 không có inventory evidence
* FE aggregate Sector/Eco · invent freshness contract · giữ `IfluxMockMarket` làm bridge

---

## 6. Owner LOCK SoT

> **LOCK SoT.** D1–D7 đã chốt. Không còn architecture decision mở. Solution được mở để thiết kế migration/phasing/inventory — **không** = Implementation authorized.

---

*03-SoT OWNER LOCKED 2026-08-09 · D1–D7 · Implementation NOT AUTHORIZED.*
