# Product Backlogs Governance

## 1. Hierarchy và One-Way Constraint

Các tầng trong Product Backlog phải tuân thủ **hierarchy một chiều**:

```text
01 BRD
   ↓
02 Audit
   ↓
03 SoT
   ↓
04 Solution
   ↓
05 Plan
   ↓
Implementation
```

Quan hệ giữa các tầng là **one-way constraint**:

```text
BRD
 └─► Audit
      └─► SoT
           └─► Solution
                └─► Plan
                     └─► Implementation
```

Tầng thấp hơn **không được override, thay đổi, diễn giải lại hoặc loại bỏ** bất kỳ requirement, evidence, authority, decision, architecture, semantics hoặc constraint nào đã được xác lập ở tầng cao hơn.

```text
Plan ──X──► Solution
Plan ──X──► SoT
Plan ──X──► BRD

Solution ──X──► SoT
Solution ──X──► Audit
Solution ──X──► BRD

SoT ──X──► Audit
SoT ──X──► BRD

Audit ──X──► BRD
```

### 1.1. Nguyên tắc của từng tầng

**BRD — Requirement**

BRD là requirement tối cao.

Các tầng bên dưới phải thực hiện đúng requirement của BRD và không được tự ý thay đổi, diễn giải lại hoặc loại bỏ requirement.

**Audit — Current State Evidence**

Audit trả lời:

> Hệ thống hiện tại đang như thế nào đối với các requirement của BRD?

Audit cung cấp evidence về hiện trạng và không được thay đổi requirement của BRD.

**SoT — Authority**

SoT xác định authority cần thiết để đáp ứng BRD trong bối cảnh hiện trạng đã được Audit xác định.

Các tầng bên dưới phải tuân thủ SoT đã được thiết lập.

**Solution — Approved Way of Solving**

Solution xác định cách giải quyết dựa trên BRD, Audit và SoT.

Solution đã được khóa thì Plan và Implementation chỉ được cụ thể hóa và triển khai; không được tự thay đổi semantics, architecture hoặc behavior đã được Solution xác định.

**Plan — Execution**

Plan lập kế hoạch và trình tự thực thi những gì đã được các tầng trên xác lập.

Plan không có quyền redesign BRD, Audit, SoT hoặc Solution.

**Implementation — Execution**

Implementation chỉ thực thi Plan và các quyết định đã được xác lập ở các tầng trên.

Implementation không được tự thay đổi Plan hoặc các quyết định của tầng cao hơn để thuận tiện cho việc code.

### 1.2. Conflict / Missing Decision

Nếu tầng thấp phát hiện:

* xung đột với tầng cao hơn; hoặc
* tầng cao hơn thiếu quyết định cần thiết để tiếp tục;

thì **không được tự giải quyết bằng cách override tầng cao hơn**.

Phải:

```text
Conflict / Missing Decision
        ↓
STOP
        ↓
Escalate đúng tầng có authority
        ↓
Owner quyết định
        ↓
Cập nhật tầng cao hơn
        ↓
Tầng thấp tiếp tục
```

Tầng thấp chỉ được đề xuất bổ sung khi nội dung đó **chưa được quy định ở tầng cao hơn** và việc bổ sung không làm thay đổi hoặc mâu thuẫn với bất kỳ quyết định nào đã được xác lập.

---

# 2. BR Traceability và Checklist

Hierarchy ở Mục 1 xác định **quyền hạn giữa các tầng**.

Mục này xác định **traceability xuyên suốt lifecycle**.

**BR là xương sống bất biến của toàn bộ hệ thống.**

## 2.0. Chiều bắt buộc (Forward) — KHÓA

Chuỗi tài liệu / kiểm tra **phải** đi theo chiều:

```text
BRD
 ↓
BR Checklist cố định (atomic · bất biến)
 ↓
Audit Checklist          ← sinh từ BR Checklist
 ↓
SoT Checklist            ← trả lời BR + Audit
 ↓
Solution Checklist       ← trả lời BR + Audit + SoT
 ↓
Plan Checklist           ← index toàn bộ BR
 ↓
Implementation Evidence
 ↓
Final Verification       ← bắt đầu lại từ BR Checklist
```

### 2.0.1. Chiều cấm (Reverse / Code-first) — KHÓA

**CẤM** quy trình:

```text
Code / API / route hiện có gì
        ↓
Audit xem hệ thống có gì
        ↓
Thấy “đủ” thì map ngược vào BR / đánh DONE
```

Đây là gốc lỗi dạng: **BR-11 = DONE** chỉ vì API/route tồn tại, trong khi các atomic BRD (UI / IA / Source Detail / Audit UI / Change Set / Current Master Value…) **chưa được kiểm tra đủ từng dòng**.

Audit **không** được sinh từ hiện trạng implementation.  
Audit **phải** được sinh từ **BR Checklist cố định** rồi mới thu thập evidence hiện trạng cho từng dòng.

---

### 2.1. BR Checklist Registry (xương sống bất biến)

Tập BR (+ atomic Req ID) được xác định bởi **BRD** là checklist chuẩn.

Ví dụ cấp BR:

```text
BRD
 ├─ BR-01
 ├─ BR-02
 ├─ …
 ├─ BR-11
 └─ BR-31 (+ BR-11A nếu BRD có)
```

Ví dụ cấp atomic (bắt buộc khi BRD tách bullet) — **thuộc BRD**, không thuộc Audit:

| BR | Req ID | Requirement (chữ BRD) |
|----|--------|------------------------|
| BR-11 | BR-11.1 | Có capability MDM |
| BR-11 | BR-11.2 | Không tên «Quản lý DNSE» |
| BR-11 | BR-11.3 | Route MDM |
| BR-11 | BR-11.IA | MDM nằm dưới Thị trường |
| BR-11 | BR-11.4 | Multi-provider |
| BR-11 | BR-11.5 | Diff/Conflict |
| BR-11 | BR-11.6a | Current Source |
| BR-11 | BR-11.6b | Source Status |
| BR-11 | BR-11.6c | Trust |
| BR-11 | BR-11.6d | Current Master Value |
| BR-11 | BR-11.6e | Diff |
| BR-11 | BR-11.6f | Conflict |
| BR-11 | BR-11.6g | Apply/Reject |
| BR-11 | BR-11.SD | Source Detail |
| BR-11 | BR-11.AUD-UI | Audit UI |
| BR-11 | BR-11.CS-UI | Change Set UI |

**Không tầng nào dưới BRD được:**

* bỏ dòng atomic;
* gộp nhiều atomic thành một dòng “BR-11 tổng”;
* đổi acceptance / meaning;
* chỉ kiểm tra những gì implementation hiện đang có;
* đánh PASS cho cả BR vì một phần (API/route) đạt.

Nếu BRD có **N** atomic requirement cho một BR → Audit / SoT / Solution / Plan / Verification phải **trả lời đủ N dòng** (hoặc `—` / `N/A` + lý do khi tầng đó không áp dụng — **không xóa dòng**).

Các bảng Audit, SoT, Solution, Plan và Verification phải duy trì traceability đối với **từng BR / atomic**.

Ví dụ khi tầng không áp dụng:

| BR    | Audit    | SoT | Trạng thái |
| ----- | -------- | --- | ---------- |
| BR-03 | AUD-03.1 | —   | N/A        |

Có thể ghi `N/A` hoặc `—` kèm lý do. **Không được xóa hàng.**

---

### 2.2. Shared Artifact — Evidence dùng chung, Traceability không dùng chung ngầm

Một artifact / một lần kiểm tra có thể phục vụ **nhiều BR**.

Ví dụ một check «Database schema không có dual ownership» phục vụ BR-01, BR-05, BR-06, BR-14 — **không cần chạy lại 4 lần**, nhưng **phải có mapping rõ**:

| BR    | Audit  | Audit Check | Status |
| ----- | ------ | ----------- | ------ |
| BR-01 | AUD-02 | AUD-02.04   | PASS   |
| BR-05 | AUD-02 | AUD-02.04   | PASS   |
| BR-06 | AUD-02 | AUD-02.04   | PASS   |
| BR-14 | AUD-02 | AUD-02.04   | PASS   |

Tương tự SoT / Solution / Evidence:

```text
Solution-A (MDM Control Plane)
 ├─ BR-11
 ├─ BR-12
 ├─ BR-16
 └─ BR-23
```

Checklist vẫn giữ **một dòng riêng cho từng BR / atomic**:

| BR    | Audit    | SoT    | Solution | Trạng thái |
| ----- | -------- | ------ | -------- | ---------- |
| BR-11 | AUD-11.1 | SOT-01 | SOL-A    | ...        |
| BR-12 | AUD-12.1 | SOT-01 | SOL-A    | ...        |

**Shared evidence ≠ shared BR row.**  
**Cấm** suy diễn: “EV-A xong ⇒ mọi BR liên quan DONE”.

---

## 2.3. Audit Checklist — sinh từ BR Checklist

Audit phải xác định rõ mỗi kết quả đang phục vụ **BR / Req ID** nào.

Audit Checklist **phải được tạo từ BR Checklist**, không từ inventory code.

Checklist Audit tối thiểu:

| BR | BR Requirement | Audit ID | Audit Check | Required Evidence (A/B/C khi áp dụng) | Status |
|----|----------------|----------|-------------|----------------------------------------|--------|
| BR-11 | MDM dưới Thị trường | AUD-11-IA | Kiểm tra Admin IA | code/nav + UI | … |
| BR-11 | Source Detail | AUD-11-SD | Kiểm tra Source Detail surface | route + UI | … |
| BR-11 | Audit surface | AUD-11-AUD | Kiểm tra Audit UI | UI + API | … |
| BR-11 | Current Master Value | AUD-11-CV | Kiểm tra entity×field value | DB + API + UI | … |
| BR-11 | Change Set | AUD-11-CS | Kiểm tra Change Set UI | UI + API | … |

Một Audit result có thể được **reference** ở nhiều dòng BR — mỗi dòng vẫn đánh giá riêng.

Audit phải trả lời được:

> **Đối với từng atomic BR này, hiện trạng là gì và evidence nào chứng minh điều đó?**

**CẤM:** «Tôi audit BR-11 và thấy API 200 nên PASS.»  
**ĐÚNG:** từng BR-11.1 … BR-11.CS-UI có hàng Audit riêng + Status riêng.

Audit không được dùng để thay đổi hoặc giảm requirement của BRD.

---

## 2.4. SoT Checklist — trả lời BR + Audit

SoT không được chỉ là câu mô tả tổng («Market Master là PostgreSQL») mà không có bảng mapping.

SoT phải xác định authority nào phục vụ **từng BR / atomic** và dựa trên Audit nào.

Checklist tối thiểu:

| BR    | Audit    | SoT                         | Trạng thái |
| ----- | -------- | --------------------------- | ---------- |
| BR-01 | AUD-01   | PostgreSQL stocks           | …          |
| BR-01 | AUD-01   | PostgreSQL sectors          | …          |
| BR-01 | AUD-01   | PostgreSQL ecosystems       | …          |
| BR-05 | AUD-02   | stocks.sector_id            | …          |
| BR-05 | AUD-02   | stocks.ecosystem_id         | …          |
| BR-11 | AUD-11   | MDM registry                | …          |
| BR-11 | AUD-11   | Field authority             | …          |
| BR-11 | AUD-11   | Change Set                  | —          |
| BR-11 | AUD-11   | Audit UI                    | —          |

Không có SoT liên quan → ghi `—` / `N/A`. **Không xóa dòng BR.**

Một SoT decision có thể phục vụ nhiều BR (reference chung) — mỗi BR vẫn một hàng riêng.

SoT không được tự ý thay đổi requirement hoặc kết luận Audit ở tầng trên.

---

## 2.5. Solution Checklist — trả lời BR + Audit + SoT

Một Solution component (vd. Market Data Management Control Plane) có thể phục vụ nhiều BR — bảng phải liệt kê đủ:

| BR    | Audit  | SoT            | Solution                 | Trạng thái |
| ----- | ------ | -------------- | ------------------------ | ---------- |
| BR-11 | AUD-11 | MDM Registry   | MDM Control Plane        | …          |
| BR-12 | AUD-12 | Source Registry| MDM Source Registry      | …          |
| BR-15 | AUD-15 | Field Authority| Authority Matrix         | …          |
| BR-16 | AUD-16 | Import SoT     | Governed Import Pipeline | …          |
| BR-19 | AUD-19 | Change Set     | Change Comparison UI     | …          |
| BR-20 | AUD-20 | Conflict SoT   | Review Queue             | …          |
| BR-23 | AUD-23 | Audit SoT      | Audit Trail              | …          |

Solution không được thay đổi BRD, Audit hoặc SoT để làm implementation dễ hơn.

Nếu phát hiện Solution thiếu quyết định cần thiết:

```text
STOP
→ Escalate
→ Owner quyết định
→ Update Solution
→ Resume
```

Không được để Plan tự quyết định thay cho Solution.

---

## 2.6. Plan Checklist — execution index (không copy nội dung)

Plan là lớp execution. Plan **không** cần diễn giải lại Audit / SoT / Solution.

Plan chỉ cần checklist đầy đủ mọi BR / atomic và **reference**:

| BR    | Audit  | SoT    | Solution | Plan / Action | Status  |
| ----- | ------ | ------ | -------- | ------------- | ------- |
| BR-01 | AUD-01 | SOT-01 | SOL-01   | PLAN-01       | DONE    |
| BR-02 | AUD-02 | SOT-02 | SOL-02   | PLAN-02       | DONE    |
| BR-11 | AUD-11 | SOT-11 | SOL-11   | PLAN-11       | BLOCKED |

Chi tiết đọc theo chuỗi reference:

```text
BR-11 → AUD-11 → SOT-11 → SOL-11 → PLAN-11 → Evidence
```

Plan là:

> **Execution index của toàn bộ BR.**

Plan không phải tầng redesign quyết định phía trên.

---

## 2.7. Implementation / Evidence Checklist

Implementation phải tạo evidence để chứng minh từng BR đã được thực hiện.

Checklist có thể được sử dụng trong Plan hoặc Completion/Verification artifact:

| BR    | Plan    | Evidence | Trạng thái |
| ----- | ------- | -------- | ---------- |
| BR-01 | PLAN-01 | EV-01    | DONE       |
| BR-02 | PLAN-02 | EV-02    | DONE       |
| BR-03 | PLAN-03 | —        | INCOMPLETE |

Một evidence có thể chứng minh nhiều BR.

Ví dụ:

| BR    | Plan    | Evidence  | Trạng thái |
| ----- | ------- | --------- | ---------- |
| BR-11 | PLAN-11 | EV-MDM-01 | DONE       |
| BR-16 | PLAN-16 | EV-MDM-01 | DONE       |
| BR-17 | PLAN-17 | EV-MDM-01 | DONE       |

Nhưng từng BR vẫn phải được đánh giá riêng.

---

## 2.8. Quy tắc cố định của Checklist

Các checklist phải tuân thủ (xem thêm **§5.0 Sáu luật khóa**):

1. **BR / atomic Req ID là khóa chính của traceability.**
2. **Mỗi BR / atomic phải có dòng riêng ở từng tầng có checklist.**
3. Shared Audit / SoT / Solution / Evidence được phép reference bởi nhiều BR.
4. Không được gộp nhiều BR / atomic thành một dòng chỉ vì dùng chung artifact.
5. Không được xóa BR vì tầng đó không áp dụng.
6. Nếu không áp dụng, ghi `N/A` / `—` và lý do nếu cần.
7. Trạng thái của từng BR / atomic phải được xác định độc lập.
8. Checklist của BR không được tự ý thay đổi requirement của BRD.
9. **Audit Checklist phải được sinh từ BR Checklist** — không từ code inventory.
10. **Final Verification bắt đầu từ BR Checklist** — không từ «code có gì».

Do đó, mỗi hàng phải có thể đọc như một **traceability chain**:

```text
BR / Req ID
→ Audit
→ SoT
→ Solution
→ Plan
→ Evidence
→ Status
```

---

# 3. BR-Based Verification và Completion

Final Verification **bắt đầu từ BR Checklist cố định**, không bắt đầu từ code, Plan, hay “những gì vừa implement”.

Luồng đúng:

```text
FINAL VERIFICATION
        ↓
BR Checklist (atomic · bất biến từ BRD)
        ↓
Audit evidence (theo từng Audit ID đã gắn BR)
        ↓
SoT / Solution (reference)
        ↓
Implementation Evidence (A + B + C khi áp dụng)
        ↓
BR PASS / PARTIAL / FAIL / NOT EVIDENCED (từng dòng)
```

Ví dụ hàng Verification:

| BR | Requirement | Evidence | Audit | SoT | Solution | Final |
|----|-------------|----------|-------|-----|----------|-------|
| BR-11.IA | MDM dưới Thị trường | Nav code/UI | AUD-11-IA | — | SOL-11 | … |
| BR-11.6d | Current Master Value | DB+API+UI | AUD-11-CV | SOT-11 | SOL-11 | … |
| BR-11.5 | Diff/Conflict | Conflict UI | AUD-11-DC | SOT-11 | SOL-11 | … |

Khi một dòng FAIL — trace có mục tiêu, không audit mù cả hệ thống:

```text
FAIL
 ↓
BR-11.6d
 ↓
AUD-11-CV
 ↓
SOT-11
 ↓
SOL-11
 ↓
Fix Implementation
 ↓
Re-test A/B/C đúng dòng đó
```

## 3.0. Ba lớp bằng chứng (A / B / C) — bắt buộc

Mọi Verification / Completion checklist **phải** thu thập đủ các lớp evidence **áp dụng** cho từng atomic requirement. Không được đánh **PASS** / **DONE** chỉ vì “có code”, “có API”, “có route”, hoặc “agent nói đã làm”.

### 3.0.1. Định nghĩa ba lớp

| Lớp | Tên | Trả lời câu hỏi | Ví dụ hợp lệ |
|-----|-----|-----------------|--------------|
| **A — Static** | Code / config / schema-in-repo | Artifact tồn tại đúng chỗ và đúng semantics chưa? | `rg` / đọc file: path + line; migration SQL; route registry; HTML selector |
| **B — Database** | Trạng thái dữ liệu Production (hoặc môi trường SoT của task) | Schema / constraint / row / FK / count phản ánh BR chưa? | `psql` query: counts, CHECK, FK, sample rows, before/after mutate |
| **C — Runtime** | Hệ thống đang chạy | API / UI / import / network chứng minh hành vi đúng chữ BR chưa? | `curl` HTTP status + body; Admin UI panel có/không; import summary; browser network path |

### 3.0.2. Quy tắc áp dụng

1. **Mỗi atomic BR = một hàng checklist riêng** (không gộp vì dùng chung artifact).
2. Hàng phải ghi rõ kết quả **Evidence A**, **Evidence B**, **Evidence C** (hoặc `N/A` + lý do khi lớp đó **không áp dụng** — ví dụ thuần UI copy không đụng DB → B = `N/A`).
3. Nếu lớp **áp dụng** mà chưa có kết quả reproduce được → Status = **NOT EVIDENCED** (cấm ghi PASS).
4. **PASS** chỉ khi mọi lớp áp dụng đều đủ mạnh để **người khác tự reproduce** và khớp **chữ BRD** (không khớp “ý agent”).
5. **PARTIAL** = đúng hướng nhưng thiếu chữ BRD hoặc thiếu một lớp bắt buộc.
6. **FAIL** = làm trái / thiếu capability bắt buộc đã kiểm được.
7. Shared evidence (một API, một SQL snapshot) được **reference nhiều hàng** — vẫn phải đánh giá từng BR riêng.
8. **Cấm soft-pass:** “route 200”, “caption có chữ MDM”, “API tồn tại” **không** đủ để PASS khi BRD đòi UI panel / Current Master value / nav IA / Source Detail / v.v.

### 3.0.3. Cột checklist Verification tối thiểu (khi dùng A/B/C)

| BR | Req ID | Requirement | Acceptance intent | Solution | Prior Audit | Evidence A | Evidence B | Evidence C | Evidence location | Gap | Decision? | Status |
|----|--------|-------------|-------------------|----------|-------------|------------|------------|------------|-------------------|-----|-----------|--------|

### 3.0.4. Cách lấy evidence (mặc định Production cho task iFlux Production)

- **A:** `rg` / đọc file trong repo hoặc web root đã deploy; ghi path + line / pattern.
- **B:** SSH origin theo `infra/staging/staging.env` → `sudo -u postgres psql -d iflux` (không in IP/credential ra hội thoại Owner).
- **C:** `curl https://iflux.vn/api/...` (+ Admin key khi cần); hard refresh Admin/User page; ghi HTTP + panel/network.

### 3.0.5. Vòng lặp đóng gap

```text
Verify BR (A+B+C)
      ↓
PASS hết? ──Yes──► Final Acceptance PASS → đóng task
      │
     No (FAIL / PARTIAL / NOT EVIDENCED)
      ↓
Trace BR → Audit → SoT → Solution → Plan → Implementation
      ↓
Fix đúng tầng (không override tầng cao)
      ↓
Re-test cùng tiêu chuẩn A+B+C
      ↓
Update checklist
      ↓
Lặp cho đến khi ALL PASS
```

Không được kết thúc vòng lặp khi còn hàng áp dụng ở trạng thái FAIL / PARTIAL / NOT EVIDENCED.

## 3.1. Kiểm tra tất cả BR

Phải kiểm tra **tất cả BR được quy định trong BRD**.

Checklist Verification:

| BR    | Plan    | Evidence | Trạng thái | Acceptance |
| ----- | ------- | -------- | ---------- | ---------- |
| BR-01 | PLAN-01 | EV-01    | DONE       | PASS       |
| BR-02 | PLAN-02 | EV-02    | DONE       | PASS       |
| BR-03 | PLAN-03 | —        | INCOMPLETE | —          |

Không được kết luận task DONE chỉ vì:

* code đã được implement;
* Plan đã chạy hết;
* Solution đã được triển khai;
* một số BR quan trọng đã DONE.

**Definition of Done được xác định ở cấp BR.**

---

## 3.2. Evidence phải chứng minh BR

Evidence phải được gắn với đúng BR mà nó chứng minh.

Một evidence có thể dùng cho nhiều BR:

```text
EV-A
 ├─ BR-11
 ├─ BR-16
 └─ BR-17
```

Nhưng Verification vẫn phải cập nhật từng BR:

| BR    | Evidence | Trạng thái |
| ----- | -------- | ---------- |
| BR-11 | EV-A     | DONE       |
| BR-16 | EV-A     | DONE       |
| BR-17 | EV-A     | DONE       |

Không được chỉ ghi:

```text
EV-A → "MDM hoàn thành"
```

rồi suy diễn rằng mọi BR liên quan đều DONE.

---

## 3.3. Nếu BR chưa DONE

Nếu bất kỳ BR nào có trạng thái:

```text
INCOMPLETE
NOT DONE
WRONG
```

thì phải trace ngược theo chain:

```text
BR
 ↓
Audit
 ↓
SoT
 ↓
Solution
 ↓
Plan
 ↓
Implementation
```

Mục đích là xác định chính xác tầng nào chứa thông tin cần thiết để xử lý gap.

Ví dụ:

| BR    | Audit    | SoT    | Solution | Plan    | Evidence | Trạng thái |
| ----- | -------- | ------ | -------- | ------- | -------- | ---------- |
| BR-16 | AUD-16.x | SOT-xx | SOL-xx   | PLAN-16 | —        | INCOMPLETE |

Sau đó:

```text
BR-16
  ↓
Review Audit-16
  ↓
Review SoT liên quan
  ↓
Review Solution liên quan
  ↓
Xác định implementation gap
  ↓
Fix
  ↓
Re-test
  ↓
Update Evidence
  ↓
BR-16 = DONE
```

Không được tự sửa implementation bằng cách thay đổi ngầm quyết định của tầng trên.

---

## 3.4. Nếu phát hiện vấn đề ở tầng cao hơn

Trong quá trình fix, nếu phát hiện:

| Vấn đề                            | Xử lý                      |
| --------------------------------- | -------------------------- |
| BRD mâu thuẫn / thiếu requirement | Escalate Owner ở BRD       |
| Audit thiếu evidence hiện trạng   | Update / complete Audit    |
| SoT thiếu authority               | Escalate / update SoT      |
| Solution thiếu quyết định         | Escalate / update Solution |
| Plan thiếu execution detail       | Update Plan                |
| Implementation sai Plan           | Fix Implementation         |

Luôn sửa tại **đúng tầng có authority**.

Không dùng tầng thấp để workaround quyết định thuộc tầng cao.

---

## 3.5. Final Acceptance

Task chỉ được đóng khi:

```text
All BR
   ↓
All required Evidence
   ↓
All BR = DONE
   ↓
Final Acceptance = PASS
```

Bảng Final Acceptance:

| BR    | Evidence | Trạng thái | Acceptance |
| ----- | -------- | ---------- | ---------- |
| BR-01 | EV-01    | DONE       | PASS       |
| BR-02 | EV-02    | DONE       | PASS       |
| BR-03 | EV-03    | DONE       | PASS       |
| ...   | ...      | ...        | ...        |
| BR-N  | EV-N     | DONE       | PASS       |

Không được kết thúc task chỉ vì:

```text
Plan = COMPLETED
```

Phải đạt:

```text
BR Checklist = ALL DONE
+
Required Evidence = PRESENT
+
Acceptance = PASS
```

---

# 4. Lifecycle tổng thể

Toàn bộ lifecycle được quản lý theo **BR traceability**, trong khi hierarchy kiểm soát quyền thay đổi:

```text
                         BEFORE EXECUTION

01 BRD
 │
 ├── BR Checklist cố định (BR-01…BR-N + atomic Req ID)
 │         │
 │         ▼  (sinh từ BR — KHÔNG từ code)
02 Audit Checklist
 │         │
 │         ▼
03 SoT Checklist
 │         │
 │         ▼
04 Solution Checklist
 │         │
 │         ▼
05 Plan Checklist (index BR)
 │         │
 │         ▼
Implementation
 │         │
 │         ▼
Evidence (A/B/C)
 │         │
 │         ▼
Final Verification  ← bắt đầu lại từ BR Checklist
 │
 ├── ALL PASS → Final Acceptance → đóng task
 │
 └── FAIL / PARTIAL / NOT EVIDENCED
              │
              ▼
     Trace đúng dòng: BR → Audit → SoT → Solution → Plan → Fix
              │
              ▼
           Re-test A/B/C dòng đó
              │
              ▼
        Update checklist → lặp đến ALL PASS
```

**Cấm** nhánh: Code inventory → Audit opportunistic → map DONE vào BR.

## 4.1. Ba nguyên tắc phải được giữ đồng thời

### Hierarchy

```text
BRD
 ↓
Audit
 ↓
SoT
 ↓
Solution
 ↓
Plan
 ↓
Implementation
```

Quy định:

> **Tầng dưới không được override tầng trên.**

### Traceability (forward only)

```text
BR
 ↓
BR Checklist cố định
 ↓
Audit Checklist
 ↓
SoT Checklist
 ↓
Solution Checklist
 ↓
Plan Checklist
 ↓
Implementation Evidence
 ↓
Final Verification (từ BR)
```

Quy định:

> **Mọi hoạt động phải truy được về BR; mọi kết quả cuối phải quay lại chứng minh từng atomic BR — không map ngược từ code.**

### Evidence discipline

> **A/B/C khi áp dụng · shared evidence OK · không gộp BR row · không soft-pass.**

Ba nguyên tắc này độc lập nhưng phải áp dụng đồng thời.

---

# 5. Core Governance Rules

## 5.0. Sáu luật khóa (BR Checklist Backbone)

### Rule 1 — BR is Immutable

BRD là nguồn yêu cầu tối cao. **BR Checklist (kể cả atomic Req ID)** không được thay đổi bởi Audit, SoT, Solution, Plan hoặc Implementation.

### Rule 2 — Every Downstream Artifact Must Trace to BR

Mọi Audit / SoT / Solution / Plan / Verification đều phải có **bảng mapping** về BR / Req ID. Không chấp nhận narrative không có hàng checklist.

### Rule 3 — Checklist Rows Must Never Disappear

Nếu một tầng không áp dụng → ghi `—` / `N/A` (+ lý do nếu cần). **Không được xóa dòng BR / atomic.**

### Rule 4 — Evidence May Be Shared, Traceability May Not

Một Audit result / evidence có thể phục vụ nhiều BR.  
Mỗi BR / atomic vẫn phải có **một mapping row riêng** và Status riêng. Cấm gộp / suy diễn ngầm.

### Rule 5 — Downstream Documents Answer Upstream Checklists

```text
Audit     → trả lời BR Checklist
SoT       → trả lời BR + Audit Checklist
Solution  → trả lời BR + Audit + SoT
Plan      → danh sách / index toàn bộ BR cần xử lý (reference, không copy)
Verification → trả lời lại BR Checklist bằng Evidence
```

Audit **không** trả lời câu «code có gì?» rồi mới chọn BR.  
Audit trả lời **từng dòng BR Checklist đã khóa**.

### Rule 6 — Final Verification Starts From BR, Not From Code

Không kiểm tra:

```text
Code hiện có gì? → đủ thì DONE
```

Mà kiểm tra:

```text
Từng BR / atomic đã có evidence chứng minh hoàn thành chưa?
```

Nếu chưa:

```text
BR → Audit → SoT → Solution → Plan → Implementation → Evidence → Re-verify
```

để xác định đúng điểm cần fix — không soft-pass, không bỏ sót atomic.

---

## 5.1. Quy tắc vận hành bổ sung

1. **BRD là requirement tối cao.**
2. **BR / atomic Req ID là khóa xuyên suốt toàn bộ lifecycle.**
3. **Audit Checklist phải được sinh từ BR Checklist** — không sinh từ inventory code.
4. **SoT phải chỉ rõ SoT phục vụ BR/Audit nào.**
5. **Solution phải chỉ rõ Solution phục vụ BR/Audit/SoT nào.**
6. **Plan phải có checklist đầy đủ tất cả BR và reference xuống Audit/SoT/Solution.**
7. **Implementation phải tạo evidence gắn với BR / atomic.**
8. **Verification phải kiểm tra lại từng BR / atomic.**
9. **Một artifact có thể phục vụ nhiều BR nhưng không được làm mất checklist riêng của từng BR.**
10. **Checklist phải được biểu diễn bằng bảng để có thể rà soát theo hàng ngang.**
11. **Không được xóa BR khỏi checklist vì một tầng không áp dụng; sử dụng `N/A` / `—` khi cần.**
12. **Tầng thấp không được override tầng cao.**
13. **Conflict hoặc missing decision ở tầng cao → STOP → escalate đúng tầng → Owner quyết định → cập nhật → resume.**
14. **Không được đánh dấu DONE/PASS nếu thiếu evidence/acceptance theo checklist của BR.**
15. **Task chỉ được đóng khi toàn bộ BR / atomic đạt DONE/PASS và Final Acceptance PASS.**
16. **Verification bắt buộc đủ ba lớp bằng chứng A (Static) / B (Database) / C (Runtime) khi áp dụng** — xem §3.0. Cấm soft-pass.
17. **Sau mỗi đợt fix phải re-verify cùng tiêu chuẩn A+B+C; còn FAIL/PARTIAL/NOT EVIDENCED thì lặp đến khi ALL PASS.**
18. **Cấm đánh PASS cả BR vì một phần capability** (vd. API/route có trong khi UI/IA/Source Detail/Audit/Change Set chưa đủ từng atomic).

### Nguyên tắc cốt lõi

> **Hierarchy controls who may decide.**

> **BR Checklist (immutable) is the backbone — not AI memory.**

> **Traceability is a document structure, not a skill of the agent.**

> **Forward chain only: BR → Audit → SoT → Solution → Plan → Evidence → Verify.**

> **Evidence may be shared; BR rows may not be collapsed.**

> **Evidence A+B+C proves what was actually completed.**

> **No soft-pass without reproduceable evidence.**

> **Final Verification starts from BR, never from code inventory.**
