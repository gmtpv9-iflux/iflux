# SoT — Engineering Change Governance

**Trạng thái:** SoT v1.1.1  
**Mục đích:** Kiểm soát cách thay đổi hệ thống, ngăn duplicate implementation, shadow architecture, cosmetic replacement (`display:none` + tạo mới), và migration sai hướng.  
**Phạm vi áp dụng:** Tất cả thay đổi code, UI, runtime, API, data flow, configuration, tooling.

**Product SoT cấp cao nhất:** [`SoT — iFlux Product Architecture (V2).md`](./SoT%20%E2%80%94%20iFlux%20Product%20Architecture%20(V2).md)  
**Cursor Rules (hành xử agent):** [`.cursor/rules/engineering-change-governance.mdc`](../.cursor/rules/engineering-change-governance.mdc)

---

# 0. Mục tiêu

Tài liệu này định nghĩa các nguyên tắc bắt buộc khi thay đổi hệ thống.

Mục tiêu:

* Ưu tiên tái sử dụng trước khi tạo mới.
* Ưu tiên sửa đúng owner trước khi thêm layer mới.
* Loại bỏ implementation cũ khi migration hoàn tất.
* Ngăn tồn tại nhiều nguồn sự thật.
* Ngăn AI agent / developer tạo workaround thay vì sửa kiến trúc.
* Bắt buộc **chứng minh Impact Analysis** trước khi Plan / Implementation.

---

# 1. Authority Level

Khi thực hiện thay đổi, thứ tự ưu tiên:

```
1. Product SoT (V2)
2. Architecture SoT
3. Domain SoT
4. Runtime/Data/Widget SoT
5. Engineering Change Governance SoT
6. Implementation detail
```

Không được dùng implementation hiện tại để biện minh cho việc phá SoT.

Hierarchy vận hành:

```
Product Architecture V2
        ↓
Domain SoT
        ↓
Runtime/Data/Widget SoT
        ↓
Engineering Change Governance
        ↓
Cursor Rules
        ↓
Implementation
```

---

# 2. Core Principle

## Rule CG-001 — Reuse Before Create

Trước khi tạo code mới bắt buộc:

1. Tìm implementation hiện tại.
2. Xác định owner.
3. Đánh giá khả năng:

   * reuse
   * rename
   * refactor
   * migrate
   * delete

Chỉ được tạo mới khi implementation hiện tại không thể đáp ứng contract mới.

---

## Rule CG-002 — No Duplicate Responsibility

Một responsibility chỉ có một owner.

Không được tồn tại:

```
Old Affiliate Flow
       +
New Affiliate Flow
```

hoặc:

```
Old Share Builder
       +
New Share Builder
```

Nếu hai module cùng quyết định một business behavior → violation.

---

## Rule CG-005 — Mandatory Impact Analysis

Trước khi tạo Plan implementation, phải xác định:

```
1. Existing implementation
2. Existing owner
3. Existing consumers
4. Existing data flow
5. Existing UI entry points
6. Existing tests/evidence
```

Output bắt buộc:

```
Impact Analysis:

Feature:
Current owner:
Files:
Functions:
Consumers:
Storage/API:
Decision:
- Reuse
- Modify
- Migrate
- Delete
```

Nếu không có phần này → **Plan chưa hợp lệ** → không được implement.

---

## Rule CG-006 — Existing Does Not Mean Correct / New

```
Existing code chỉ là evidence về hiện trạng,
không phải authority.
```

Hai lỗi đối xứng đều cấm:

1. Thấy khó sửa → tạo cái mới (workaround).
2. Thấy code cũ → giữ nguyên dù **sai owner / sai SoT**.

Decision phải dựa trên:

```
SoT + Ownership + Contract
```

không dựa trên:

```
Code đã tồn tại lâu
```

Không được dùng implementation để phá SoT; cũng không được dùng “đã có sẵn” để từ chối sửa đúng owner.

---

# 3. Change Classification

Mọi thay đổi phải thuộc một loại:

## Type A — Modify Existing

Dùng khi:

* logic hiện tại đúng owner
* chỉ thay đổi behavior
* mở rộng capability
* đổi text / label / style / naming / presentation **mà behavior không đổi**

Ví dụ:

```
AffiliateLabel
        ↓
AffiliateProgramLabel
```

Thực hiện:

```
modify existing
```

Không tạo:

```
OldAffiliateLabel
NewAffiliateProgramLabel
```

---

## Type B — Refactor Ownership

Dùng khi:

* code nằm sai owner
* logic bị duplicate
* cần di chuyển responsibility

Yêu cầu:

* tạo / chỉ định owner đúng
* migrate consumer
* remove owner cũ

---

## Type C — New Capability

Chỉ dùng khi capability chưa tồn tại.

Bắt buộc chứng minh:

```
Search result:
Existing implementation: none
```

---

# 4. No Shadow Implementation Policy

## CG-010 — Cấm che code cũ

Không được dùng:

```css
display:none
visibility:hidden
opacity:0
```

để thay thế implementation.

Không được:

```
Old component
     ↓
hidden

New component
     ↓
visible
```

Ngoại lệ:

Chỉ cho phép khi có:

* migration plan
* owner
* deadline remove
* tracking issue

---

## CG-011 — No Cosmetic Replacement

Không được tạo implementation mới chỉ vì:

* đổi text
* đổi label
* đổi style
* đổi naming
* đổi UI presentation

Nếu behavior không đổi:

```
Modify existing
```

Không:

```
Hide old + create new
```

---

## CG-012 — New File Creation Requires Justification

Mọi file mới phải trả lời:

```
Why cannot modify existing file?

Existing owner:
New owner:
Responsibility difference:
```

Ví dụ — muốn tạo `share-affiliate-builder.js` phải chứng minh:

```
Existing:
share-action-store.js

Reason:
cannot own URL decoration because …
```

Nếu không chứng minh → **không tạo file**.

---

# 5. Migration Rule

## CG-020 — Migration Must End With Cleanup

Một migration hoàn chỉnh gồm:

```
1. Create target
2. Migrate consumer
3. Verify behavior
4. Remove source
5. Remove dead config
6. Remove dead CSS/JS
```

Không được kết thúc ở trạng thái:

```
old + new coexist permanently
```

---

## CG-021 — Deletion Is Part Of Completion

Một task migration **không được PASS** nếu thiếu danh sách Removed (khi còn dead code):

```
Removed:
- unused JS
- unused CSS
- unused config
- unused import
- unused storage key
- unused API
```

“Đã migrate” mà chưa xóa source / dead path → **FAIL**.

---

# 6. Search Before Implementation

Trước khi thêm feature phải audit:

```
grep:
- keyword
- alias
- old naming
- related API
- related storage key
- related CSS class
```

Kết quả phải ghi:

```
Existing inventory:

Found:
- file A
- function B
- component C

Decision:
Reuse A
Modify B
Delete C
```

---

# 7. AI Agent Execution Rule

AI agent không được trực tiếp implement khi chưa hoàn thành Impact Analysis (CG-005).

Flow bắt buộc:

```
Request
   ↓
Inventory / Impact Analysis (CG-005)
   ↓
Ownership / Existing Decision
   ↓
Có đủ thông tin Product / Architecture / Ownership?
   ├── Có → Plan → Approval? → Implementation → Cleanup → Verification
   └── Không → Discuss Solution → Confirm với user → Plan → Implementation → …
```

Ưu tiên hành động:

```
Reuse
 ↓
Modify
 ↓
Refactor ownership
 ↓
Migrate
 ↓
Delete
 ↓
Create new capability
```

Không hiểu “Remove trước Create” là xóa lung tung — **Delete** là bước cleanup sau migrate; **Create new** chỉ khi Type C đã chứng minh không có existing.

Gate tạo mới:

```
Muốn thêm code?
        |
        v
Đã tìm code cũ chưa?
        |
        v
Có owner chưa?
        |
        v
Có lý do không sửa được chưa? (CG-012)
        |
        v
Có plan xóa code cũ chưa? (CG-020/021)
        |
        v
Được tạo mới
```

---

## Uncertainty Handling

Khi gặp vấn đề chưa đủ thông tin để quyết định:

**Không:**

* Tự suy đoán solution.
* Tạo workaround tạm thời.
* Tạo implementation song song để né quyết định.
* Thay đổi architecture boundary.

**Phải:**

1. Nêu rõ điểm chưa xác định.
2. Đưa ra các solution khả thi.
3. Phân tích trade-off.
4. Trao đổi với user để chốt hướng.

Chỉ implement sau khi solution được xác định.

Ví dụ quyết định **không phải** vấn đề code (cần Product / Architecture / Ownership):

* Share Affiliate: share về Home hay Entity URL?
* Template Runtime: một Template ID nhiều runtime hay mỗi runtime một template?
* Comment page: tách Runtime riêng hay reuse Article Runtime?

Nếu AI tự chọn, thường chọn phương án “ít sửa code nhất” — không nhất thiết đúng sản phẩm.

---

## Decision Escalation Rule (CG-030)

Nếu thiếu Product / Architecture / Ownership decision:

```
→ Stop implementation.
→ Present solution options + trade-off.
→ Wait for user decision.
```

Ngắn gọn:

> Cái nào không biết nên sửa thế nào thì trao đổi solution với user. Thế thôi.

Đây là **điểm dừng bắt buộc** — không được tự bịa giải pháp để tiếp tục code.

---

# 8. Required Plan Format

Mọi plan thay đổi phải có:

## Impact Analysis (CG-005) — bắt buộc

```
Feature:
Current owner:
Files:
Functions:
Consumers:
Storage/API:
Decision: Reuse | Modify | Migrate | Delete
```

## Existing

```
Current owner:
Current implementation:
Current consumers:
```

## Change

```
Target owner:
Files modified:
Files created:   (kèm CG-012 justification nếu có)
Files removed:
```

## Removal

```
Deprecated:
Removal condition:
Verification:
```

Plan thiếu Impact Analysis → **không hợp lệ**.

---

# 9. Forbidden Patterns

## Duplicate helper

Không:

```
buildShareUrl()
buildReferralUrl()
createShareLink()
```

nếu cùng responsibility.

---

## Duplicate storage

Không:

```
affiliate_code
ref_code
referral_code
```

cho cùng một concept (một SoT naming; alias chỉ đọc tạm rồi deprecate).

---

## Duplicate UI / cosmetic

Không:

```
Old Card
New Card
```

rồi dùng CSS hide (CG-010 / CG-011).

---

## Temporary naming abuse

Không:

```
new_
v2_
final_
latest_
backup_
```

để né migration.

---

# 10. Definition of Done

Một task chỉ PASS khi:

* [ ] Đã có Impact Analysis (CG-005).
* [ ] Đã xác định existing implementation.
* [ ] Đã xác định owner.
* [ ] Không tạo duplicate responsibility.
* [ ] File mới (nếu có) có justification CG-012.
* [ ] Code cũ đã remove nếu không còn dùng (CG-021).
* [ ] Không có hidden legacy (CG-010 / CG-011).
* [ ] Không tạo workaround thay cho sửa owner.
* [ ] Có evidence grep/build/test.
* [ ] Có Review Evidence Package (§13) khi yêu cầu review.

---

# 11. Cursor / AI Agent Instruction

Khi nhận task:

Không được:

> Add new implementation immediately.

Phải thực hiện:

```
1. Inspect existing code (Impact Analysis).
2. Identify reusable implementation.
3. Report conflicts.
4. Propose modification/removal (Plan hợp lệ).
5. Wait for approval if architecture impact exists.
6. Implement → Cleanup → Verify.
```

Ưu tiên:

```
Reuse → Modify → Refactor ownership → Migrate → Delete → Create new capability
```

---

# 12. Final Principle

Hệ thống khỏe không phải là hệ thống có nhiều code mới.

Hệ thống khỏe là hệ thống:

* một responsibility,
* một owner,
* một source of truth,
* một implementation path.

Mọi thay đổi phải làm hệ thống đơn giản hơn hoặc rõ ownership hơn.

---

# 13. Review Evidence Package

Mỗi task trước khi review phải cung cấp:

```
1. Applicable SoT
2. Requirement
3. Existing inventory / Impact Analysis
4. Change plan
5. Changed files
6. Added files (+ CG-012 nếu có)
7. Deleted files
8. Migration evidence
9. Test evidence
```

Reviewer **không** review chỉ dựa trên:

```
"đã làm xong"
```
