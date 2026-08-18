# 12 — Slice Execution Workflow · Phase E/F

**Date:** 2026-07-27 (rev.10)  
**Status:** **LOCKED — ECR execution governance template iFlux**  
**Execution state authority:** [`06-Implementation-Evidence.md`](06-Implementation-Evidence.md) rev.10  
**Rollback procedure:** [`05`](05-Breakpoint-Migration-Strategy.md) §7

---

## 0. Execution governance — 5 rule nền (LOCKED · mọi ECR)

| # | Rule | Cấm |
|---|------|-----|
| **EG-1** | **Evidence precedes conclusion** | PASS/FAIL/NO REGRESSION trước evidence |
| **EG-2** | **Failure budget** | Loop fix vô hạn cùng một issue |
| **EG-3** | **Rollback = quyết định, không phản xạ** | Auto revert production khi MAJOR |
| **EG-4** | **Resume state chuẩn hóa** | Suy execution state từ chat |
| **EG-5** | **Continuous execution** | Hỏi "tiếp không?" / "review trước?" sau slice PASS |

### EG-1 — Evidence precedes conclusion

Agent **cấm** kết luận `PASS` · `FAIL` · `NO REGRESSION` · `SoT COMPLIANT` trước khi ghi bằng chứng trong 06.

```text
Discovery → Implementation → Verification → Regression → CI
    ↓
Evidence
    ↓
Conclusion
```

**Cấm:** ghi PASS → rồi mới tìm evidence.

### EG-2 — Failure budget (LOCKED)

**Cùng một Root Cause / Finding** — audit FAIL → fix → audit FAIL …

```text
FAIL (attempt 1) → Fix → FAIL (attempt 2) → Fix → FAIL (attempt 3)
    ↓
STOP — Failure Budget exceeded
    ↓
Report Owner + full Root Cause history in 06
    ↓
Owner (SoT/Matrix có thể thiếu · không phải agent thiếu kỹ năng)
```

| Rule | |
|------|--|
| Budget | **3** failed audit cycles **cùng Finding** |
| Ghi | Resume Marker `Failure budget` · slice block · Root Cause mỗi attempt |
| STOP id | **B0** — Failure Budget exceeded (báo Owner · không loop thêm) |
| Khác MAJOR | B0 = technical escalation · không auto rollback |

**Cấm** attempt 4+ cùng Finding without Owner ack in 08/06.

### EG-3 — Rollback = quyết định, không phản xạ

MAJOR **≠** auto rollback.

```text
MAJOR detected
    ↓
STOP (không Slice N+1 · không fix-forward mù)
    ↓
Report Owner + evidence
    ↓
Owner quyết: Rollback  |  Hotfix  |  Defer
```

**Default recommendation:** rollback slice (§9) — Owner chọn path.

### EG-4 — Resume state

Chỉ [`06`](06-Implementation-Evidence.md) — **execution state và implementation progress** · không thay 02/04b/05/08.

Resume Marker: Current Slice · Step · Status · **Last PASS Step** · **Last FAIL Step** · Next Action.

### EG-5 — Continuous execution (LOCKED)

Khi slice **PASS** · Q1=YES · Q2=NONE · Q3=NO · Q4=NO · Decision Test=NO:

```text
Update Resume Marker → Current Slice = N+1 → IMMEDIATELY start Slice N+1
```

**Agent MUST NOT ask:**

- "Continue?" · "Review first?" · "Proceed to Slice N+1?"
- bất kỳ confirmation tương đương với Owner

**Chỉ dừng hỏi/chờ** khi: **P0 · A0 · S0 · M0 · B0 · MAJOR**

`06` = progress authority — **không** checkpoint Owner duyệt từng slice.

Vi phạm EG-5 = quay lại conversation-driven · **Agent Contract breach**.

---

## 1. Nguyên tắc

| # | Rule |
|---|------|
| W1 | **Implement → Self-Audit → Regression classify → Auto next** |
| W2 | **Owner Decision ≠ Implementation** — Decision Test §3.2 trước khi STOP |
| W3 | Self-Audit thiếu evidence = **FAIL** (EG-1) |
| W4 | **No Hidden Work** ngoài Matrix — cleanup/rename **trong file đang sửa** OK |
| W5 | **MAJOR → STOP + báo Owner** — rollback theo quyết định Owner (EG-3) |
| W6 | **EG-5 Continuous execution** — slice PASS → immediate Slice N+1 · cấm hỏi Owner |

**Owner quyết:** P0 · A0 · S0 · M0 — **một lớp gate duy nhất** (không Knowledge Check riêng).

### Agent Session Contract

Paste đầu mỗi phiên — chi tiết: [`06`](06-Implementation-Evidence.md) § Agent Session Contract.

---

## 1.1 Owner vs Agent (LOCKED)

| Owner (STOP) | Agent (tự làm) |
|--------------|----------------|
| P0 Product · IA · UX | Implement · audit · fix MINOR |
| A0 Architecture · SoT · abstraction mới | Evidence · metrics · verify |
| M0 Mapping · Matrix · 09 | Root cause + prevention |
| S0 Scope drift ngoài Matrix | Failure budget tracking |

---

## 1.2 Mandatory Self Review Loop (LOCKED)

```text
Discovery (rg baseline)
    ↓
IN PROGRESS → IMPLEMENTED (code done)
    ↓
SELF AUDIT (Evidence → Conclusion)
    ↓
FAIL? → Root Cause (+ Prevent recurrence) → FIXING (budget ≤3)
    ↓
Regression classify
    ↓
MAJOR → STOP · Rollback recommended · Owner decides
    ↓
Q4 clear → Auto Slice N+1
```

---

## 2. Slice loop (diagram)

```text
Slice N → Implement → Self Audit
              ↓
         FAIL? → Root Cause → Fix (budget ≤3) → loop
              ↓
         Regression classify
              ├── MAJOR → STOP → Owner → Rollback | Hotfix
              ├── MINOR → Fix → loop
              └── NONE (+ CI classified if needed)
                    ↓
              Q4 Owner gate clear?
                    ├── YES → Auto Slice N+1
                    └── NO → STOP (P0/A0/S0/M0)
```

---

## 3. Owner Decision Gate (duy nhất)

Chỉ **STOP** khi **Decision Test** (§3.2) → YES + gate id — ghi trong 06 Q4.

| Id | Khi chọn sai ảnh hưởng |
|----|------------------------|
| **P0** | **Product** · IA · UX · business rule |
| **A0** | **Architecture** · SoT · abstraction · runtime contract |
| **S0** | **Scope** · work ngoài Matrix/slice |
| **M0** | **Mapping** · Exception · semantic · Matrix chưa GO |
| **B0** | **Failure Budget exceeded** — 3× cùng Finding (EG-2) |

**Không STOP:** Matrix GO · audit fix (<3 same Finding) · **file path / module / export** = agent ([`10`](10-Semantic-Breakpoint-API.md) §2).

---

### 3.1 Định nghĩa Owner Decision (LOCKED)

**Nguyên tắc:**

> Một việc chỉ là **Decision** nếu có **từ hai phương án hợp lệ** theo trạng thái SoT hiện tại mà agent **không** có đủ thẩm quyền chọn.

**Owner Decision** = agent phải chọn giữa **≥2 phương án** kỹ thuật hoặc nghiệp vụ đều phù hợp SoT, nhưng lựa chọn sẽ thay đổi **Product / Architecture / Scope / Mapping** mà **chưa** có quyết định ghi nhận (02 · Matrix Phase C · 08 · 09 · 10 D1–D4).

**Không phải Decision (implementation):**

> Nếu SoT · Matrix · Plan · Decision Record đã chỉ **một** phương án duy nhất → đó là **implementation**, dù khó · nhiều file · CI fail · audit FAIL.

| Decision | Không phải Decision |
|----------|---------------------|
| `900px` → MAP `bp-lg` **hoặc** EXCEPTION · Matrix chưa GO → **M0** | Matrix row GO → migrate theo row |
| Runtime API Option A/B/C capability → **A0** | D2/D3/D4 recorded in **08 Phase D** |
| Bottom nav 5 vs 6 item → **P0** | grep còn 3 file Matrix GO → sửa tiếp |
| Sửa Community trong slice App Shell → **S0** | audit FAIL → root cause → fix |
| MAJOR: Rollback **hoặc** Hotfix → Owner (EG-3) | CI thiếu import → fix |
| | refactor đúng Matrix → continue |

---

### 3.2 Decision Test (LOCKED — chạy trước khi STOP / hỏi Owner)

Agent gặp việc mới → hỏi lần lượt:

**Q1 — SoT / Matrix / Plan / Decision Record đã có đáp án chưa?**

| Answer | Action |
|--------|--------|
| **YES** | **Implement** — không hỏi Owner |
| **NO** | → Q2 |

**Q2 — Có hơn một phương án đều đúng theo SoT hiện tại?**

| Answer | Action |
|--------|--------|
| **NO** | **Implement** (một path duy nhất) |
| **YES** | → Q3 |

**Q3 — Chọn sai có thay đổi Product / Architecture / Scope / Mapping?**

| Answer | Action |
|--------|--------|
| **NO** | Agent tự chọn · ghi lý do trong 06 |
| **YES** | **STOP** · gate **P0 / A0 / S0 / M0** · báo Owner |

```text
Issue
    ↓
SoT/Matrix/Plan đã trả lời?
    ├── YES → Implement
    └── NO
            ↓
        ≥2 phương án hợp lệ?
            ├── NO → Implement
            └── YES
                    ↓
                Ảnh hưởng P/A/S/M?
                    ├── NO → Agent chọn · evidence
                    └── YES → STOP · Owner
```

Ghi kết qu Decision Test trong 06 Q4 (YES/NO từng bước + gate id nếu STOP).

---

### 3.3 Agent MUST NOT ask (LOCKED)

**Cấm** hỏi Owner khi câu trả lời **đã tồn tại** trong:

- [`02`](02-SoT.md) · AC/GR/P  
- Phase C **Decision Matrix** (GO rows)  
- [`03`](03-Implementation-Plan.md) slice scope / exit criteria  
- [`08`](08-Owner-Signoff.md) · [`09`](09-Breakpoint-Exception-Registry.md) · [`10`](10-Semantic-Breakpoint-API.md) Owner notes  

**Ví dụ cấm:**

```text
"Có muốn em sửa file A không?"   — khi Matrix row A = GO
"Em chọn API A hay B?"           — khi D2 đã ghi trong 08
"Có tiếp tục slice không?"       — khi Q1–Q4 PASS → auto advance
```

**Được phép báo Owner (không phải hỏi permission):** MAJOR STOP · failure budget 3× · Decision Test Q3=YES với evidence + phương án đề xuất.

---

## 4. Four Questions + Regression severity

Ghi trong [`06`](06-Implementation-Evidence.md) § Slice N.

| # | Câu hỏi | PASS |
|---|---------|------|
| Q1 | Slice objective done? | YES + diff evidence |
| Q2 | Regression severity | **NONE** (hoặc MINOR đã fixed) |
| Q3 | SoT violation? | NO + output |
| Q4 | Owner gate triggered? | NO — hoặc Decision Test Q3=YES + gate id + Owner pending |

### Q2 — Regression severity

| Level | Action |
|-------|--------|
| **NONE** | Continue |
| **MINOR** | Fix → verify → continue |
| **MAJOR** | **STOP** · report Owner · EG-3 |

**Auto-advance:** Q1=YES · Q2=NONE · Q3=NO · Q4=NO (Decision Test §3.2 không trigger STOP).

---

## 5. Root Cause (+ Prevent recurrence)

```text
Finding → Cause → Fix → Verify → Prevent recurrence
```

**Prevent recurrence:** agent tự hỏi — làm sao lỗi không quay lại?

Thiếu Root Cause → audit **FAIL**.

---

## 6. Evidence — metrics (slice-objective aligned)

**Rule:** metric **phải** gắn objective slice (03 §6) — không spam CI nếu slice không phải CI slice.

| Slice | Primary metric example |
|-------|------------------------|
| 3 App Shell | `innerWidth` / `DRAWER_MAX` in shell → 0 |
| 6 CI | violations → 0 |

Số before/after + lệnh + output trong 06 — **trước** conclusion PASS.

---

## 7. No Hidden Work (LOCKED)

**Cấm:**
- Refactor/rename/cleanup **ngoài** Matrix rows hoặc file ngoài slice scope
- Sửa module khác vì “cũng nên sửa” → **S0**

**Được phép (touched scope):** cleanup/rename **trong file Matrix đang sửa**.

**Hidden Work evidence:** ghi **Unplanned cleanup** YES/NO — YES ngoài touched scope → **S0**.

---

## 8. MAJOR Regression — definition (LOCKED)

| MAJOR = user-facing critical |
|------------------------------|
| JS crash / uncaught error trên surface slice |
| Layout **unusable** |
| Navigation broken (drawer · bottom nav · routing) |
| Login / auth broken |
| Header/shell mất hoàn toàn |
| Data loss / corrupt state |

**MINOR:** spacing · wrap · alignment không block flow.

### 8.1 CI — không auto MAJOR

Unexpected CI regression (vd. violations 66→67):

```text
Investigate → Classify → Fix if slice-caused
```

| Outcome | Severity |
|---------|----------|
| Unrelated file / test noise | MINOR hoặc NONE sau fix |
| Slice broke production surface | MAJOR |
| Metric worse · hệ thống vẫn usable | MINOR — fix in loop |

Agent **cấm** gán MAJOR chỉ vì CI exit ≠ 0.

---

## 9. Rollback — recommendation only (EG-3)

MAJOR → **STOP** · ghi 06:

| Field | Agent fills |
|-------|-------------|
| Rollback **recommended** | YES (default) / NO |
| Owner **decision** | Pending / Rollback / Hotfix / Defer |
| Rollback **executed** | only after Owner chose Rollback |

Procedure khi MAJOR (Owner pre-authorize Phase D — [`08`](08-Owner-Signoff.md) Agent Contract):

```text
STOP → Rollback recommended YES → execute 05 §7 → document 06 → báo Owner → STOPPED
```

Agent **cấm** fix-forward mù · **cấm** rollback không ghi 06 · Hotfix vẫn cần Owner nếu không rollback.

---

## 10. Evidence blocks → 06 rev.10

| Block | In 06 |
|-------|--------|
| Evidence precedes conclusion (file top) | ✅ |
| Authority scope (not 02/04b/05/08) | ✅ |
| Resume Marker · Last PASS/FAIL **Step** | ✅ |
| Lifecycle incl. **IMPLEMENTED** | ✅ |
| Commands: **Discovery** → Verification → Regression → CI | ✅ |
| Metrics slice-objective aligned | ✅ |
| Root Cause + **Prevent recurrence** | ✅ |
| Rollback **recommended** · Owner **decision** | ✅ |
| **Decision Test** (§3.2) in Q4 | ✅ |
| Hidden Work + **Unplanned cleanup** | ✅ |
| Cumulative **quality log** | ✅ |

Chi tiết: [`06`](06-Implementation-Evidence.md)

---

## 11. Phase F

Full matrix [`07`](07-Regression-Report.md) + CI PASS · Owner **Final** sign [`08`](08-Owner-Signoff.md).

---

*Workflow rev.10 — Decision Test · MUST NOT ask · Owner Decision definition.*
