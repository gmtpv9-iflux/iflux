# SOLUTION — CSS Ownership Normalization Procedure

## 1. Mục đích

Solution này là SOP dùng lặp lại cho MỌI CSS file.

Không viết Solution riêng cho:

- typography.css;
- button.css;
- table.css;
- form.css;
- pattern CSS;
- các CSS file khác.

Owner chỉ cần chỉ định:

> Apply Solution to `<file>`.

Agent phải thực hiện toàn bộ procedure bên dưới.

Không cần Plan riêng.

---

# 2. Execution unit

Một lần chỉ xử lý:

ONE CSS FILE.

Không chỉnh nhiều file source song song trừ khi MOVE responsibility yêu cầu cập nhật owner đích.

Flow canonical:

AUDIT
→ INVENTORY
→ TRACE CONSUMER
→ CLASSIFY
→ OWNERSHIP DECISION
→ MOVE / DELETE / KEEP
→ OVERRIDE AUDIT
→ NORMALIZE LOCAL PATTERN
→ REGRESSION
→ REPORT
→ FILE COMPLETE

Đây là thứ tự bắt buộc.

---

# 3. STEP 1 — Read file responsibility

Trước khi sửa:

Xác định:

- file path;
- current owner;
- expected canonical owner;
- layer;
- capability;
- dependencies;
- consumers.

Đọc comment header hiện có.

Nếu chưa có ownership header:

→ bổ sung theo SoT.

Không bắt đầu cleanup trước khi hiểu responsibility của file.

---

# 4. STEP 2 — Inventory toàn bộ CSS

Inventory từng:

- selector;
- `:root` token;
- semantic HTML rule;
- class;
- pseudo-state;
- media rule;
- utility;
- component-specific rule;
- business/domain rule.

Không audit theo "nhìn chung".

Phải đi từng rule.

Output:

Selector / token
| Properties
| Current responsibility
| Consumer.

---

# 5. STEP 3 — Trace consumer

Search toàn repo phù hợp.

Tối thiểu:

design_system/
references/
sandbox/
platform/
modules/
features/
pages/
widgets/

nếu tồn tại.

Với mỗi selector:

- consumer count;
- consumer path;
- layer của consumer;
- usage context.

Không coi Sandbox usage là bằng chứng đủ để giữ Global capability.

---

# 6. STEP 4 — Classification

Classify từng rule:

GLOBAL_FOUNDATION
GLOBAL_PRIMITIVE
GLOBAL_COMPONENT
GLOBAL_PATTERN

PLATFORM
MODULE_FEATURE
PAGE
WIDGET

REDUNDANT
DUPLICATE
UNKNOWN

UNKNOWN phải được resolve trước khi file complete.

---

# 7. STEP 5 — Xác định Minimum Valid Scope

Với từng rule hỏi:

> Scope nhỏ nhất mà rule vẫn đúng responsibility là gì?

Nếu Component-specific:

→ Component.

Nếu Pattern-specific:

→ Pattern.

Nếu Platform-specific:

→ Platform.

Nếu Module-specific:

→ Module.

Nếu Page-specific:

→ Page.

Nếu Widget-specific:

→ Widget.

Không giữ ở Global chỉ vì file hiện đang nằm trong `design_system/`.

---

# 8. STEP 6 — KEEP / MOVE / DELETE

Mỗi rule chỉ được một action:

KEEP
MOVE
DELETE

## KEEP

Chỉ khi đúng canonical owner.

## MOVE

Khi responsibility hợp lệ nhưng sai owner.

Procedure:

implement tại owner đúng
→ migrate consumer
→ verify
→ delete original.

Không copy song song.

## DELETE

Khi:

- redundant;
- duplicate;
- no responsibility;
- unnecessary utility;
- obsolete;
- visual regression chứng minh không cần;
- browser/semantic/global owner đã xử lý đúng.

---

# 9. STEP 7 — Override Audit

Đây là bước bắt buộc và là trọng tâm của Solution.

Với từng property trong file đang xử lý:

search tất cả lower scopes có cùng property tác động lên cùng consumer.

Ví dụ:

Global:

```css
.selector {
  font-size: X;
}
````

Local:

```css
.page .selector {
  font-size: Y;
}
```

Đánh dấu:

OVERRIDE CONFLICT.

---

# 10. STEP 8 — Owner Override Normalization Rule

Trong đợt normalization hiện tại:

Nếu lower scope override cùng property đã có ở upper scope:

→ REMOVE lower-scope declaration.

Không cố xác định giá trị thay thế.

Không chuyển nó thành token mới.

Không tạo utility mới.

Không thêm specificity.

Ví dụ:

BEFORE:

```css
h1 {
  font-size: var(--ifx-text-h1-size);
}

.my-page-title h1 {
  font-size: 28px;
}
```

AFTER:

```css
h1 {
  font-size: var(--ifx-text-h1-size);
}

.my-page-title h1 {
}
```

Nếu selector local không có responsibility khác:

→ có thể DELETE selector.

Nếu class/local owner vẫn có semantic/composition responsibility:

→ giữ class HTML;
→ giữ selector local rỗng theo Owner instruction.

Owner sẽ bổ sung local CSS sau nếu cần.

---

# 11. Vì sao làm vậy

Trong codebase hiện tại đã có nhiều trường hợp:

lower scope override upper scope
→ nhưng khi disable lower override
→ UI đẹp hơn hoặc đúng hơn.

Do đó normalization strategy không cố bảo vệ legacy override.

Default assumption:

> override chưa chứng minh được requirement = unnecessary.

Mục tiêu trước tiên là quay về canonical upper contract.

---

# 12. STEP 9 — Property-level override scan

Audit tối thiểu:

font-family
font-size
font-weight
line-height
letter-spacing

color

margin
padding
gap

width
height
min/max-size

display
position
top/right/bottom/left

background
border
radius

text-transform
text-decoration

Nếu lower layer set lại cùng responsibility:

→ remove local declaration theo rule trên.

---

# 13. STEP 10 — Pattern normalization

Sau khi Global source đã normalize:

Apply ngay vào P6 Reference Patterns đang tồn tại.

Pattern/Reference phải consume Global result mới.

Audit:

* stale class;
* stale override;
* duplicate declaration;
* local hack;
* selector specificity;
* local `.ifx-*` definition.

Nếu Pattern đang override Global:

→ remove local override.

Giữ page/pattern class nếu cần làm ownership placeholder.

Không tự thêm CSS thay thế.

---

# 14. STEP 11 — Detect hidden redundant CSS

Thực hiện REMOVE TEST với các declaration đáng nghi.

Test:

WITH RULE
vs
WITHOUT RULE.

Nếu remove:

* không thay đổi UI;
* hoặc UI tốt hơn;
* hoặc trở về đúng semantic/global style;

→ DELETE.

Đặc biệt ưu tiên detect:

Global role
+
local role set lại cùng property.

Không coi việc class có consumer là bằng chứng rằng declarations hữu ích.

---

# 15. STEP 12 — Detect duplicate responsibilities

Search các selector/rule khác đang giải quyết cùng responsibility.

Ví dụ:

semantic `h1`
+
`.ifx-typo-h1`

→ duplicate.

Button internal font
+
`.ifx-typo-btn-md`

→ duplicate ownership.

Table typography
+
global typography utility

→ duplicate ownership.

Chỉ giữ canonical owner.

---

# 16. STEP 13 — Detect wrong-domain Global CSS

Nếu Global CSS có từ khóa/responsibility kiểu:

* stock;
* market;
* community;
* order;
* subscription;
* notification;
* widget;
* admin shell;
* mobile nav;
* page identity;

classify lại.

Không cố rename thành generic để giữ Global nếu responsibility thật vẫn local.

---

# 17. STEP 14 — Update ownership comments

Sau normalization:

Update header của file source.

Comment phải phản ánh responsibility THẬT còn lại.

Không để comment nói file là Foundation nhưng bên trong còn Table/Widget/Page CSS.

Nếu MOVE tạo/sửa file owner đích:

file đích cũng phải có ownership header.

---

# 18. STEP 15 — Regression

Sau mỗi file:

Regression Canonical DS.

Regression ít nhất các P6 References đang PASS.

Hiện tại:

W01
W02
và các wave tiếp theo khi chúng được lock.

Test relevant:

* visual;
* interaction;
* responsive;
* Dark/Light.

Không chỉ chạy syntax/build.

---

# 19. STEP 16 — Sandbox sync

Nếu cleanup thay đổi canonical capability:

Sandbox phải reflect source mới.

Không được để:

source đã delete class
nhưng Sandbox vẫn demo class đó.

Không duplicate implementation trong Sandbox.

---

# 20. STEP 17 — Evidence

Mỗi CSS file tạo một evidence result.

Ví dụ:

gates/css-normalization/01_typography.md

Nội dung:

FILE
CURRENT OWNER
FINAL OWNER

BEFORE selector count
AFTER selector count

KEEP
MOVE
DELETE

Consumer migration

Override conflicts found
Override declarations removed

Empty local ownership placeholders retained

Stale consumers

Regression result

Unresolved = 0.

---

# 21. File completion gate

Một CSS file chỉ COMPLETE khi:

* audit 100%;
* selector ownership 100%;
* UNKNOWN = 0;
* MOVE hoàn tất;
* duplicate removed;
* lower-scope unnecessary overrides removed;
* pattern/reference updated;
* stale consumer = 0;
* regression PASS;
* ownership comment updated.

Sau đó mới xử lý file khác.

---

# 22. Current application scope

Phase hiện tại áp dụng Solution này cho:

Canonical Design System
+
P6 Reference Patterns.

Chưa áp dụng production Admin đại trà.

---

# 23. Sau khi Canonical DS + References sạch

Khi toàn bộ Design System đã normalization PASS:

mở migration thực tế.

Lúc đó vẫn dùng CHÍNH:

`02_CSS_Ownership_Rules_SoT.md`
+
`03_Solution.md`

để audit/migrate CSS của:

Admin Platform
→ Admin Modules
→ Admin Pages
→ Widgets liên quan.

Không tạo một bộ CSS migration rule khác.

---

# 24. Current first execution

File đầu tiên:

`typography.css`

Áp dụng TOÀN BỘ Solution này.

Không coi typography là trường hợp đặc biệt.

Sau typography COMPLETE:

Owner chỉ định file kế tiếp.

Không tự chạy hàng loạt.
