# 01 — BRD — AppShell Sidebar Scroll Behavior

|                    |                                           |
| ------------------ | ----------------------------------------- |
| **Task ID**        | `100826_AppShell_Sidebar_Scroll_Behavior` |
| **Task Type**      | AppShell / Shared Layout Behavior         |
| **Domain**         | Frontend Architecture / AppShell          |
| **Surface**        | User Web AppShell (Left / Right Sidebar)  |
| **Status**         | 🔒 **OWNER LOCKED** (2026-08-10) · **AMENDED** Reverse Sync / INV-11·12 / AC-04 (cùng ngày) |
| **Document**       | Business Requirement Document (BRD)       |
| **Next Phase**     | Audit Amendment (map BR mới) → SoT        |
| **Implementation** | **NOT DEFINED AT BRD LEVEL**              |
| **Governance**     | [`Product Backlogs Governance`](../Product%20Backlogs%20Governance.md) — BR → Audit → SoT → Solution → Plan → Implementation |
| **Constraint SoT** | Product Architecture V2 · Engineering Change Governance · UR-001 (nếu đụng relocation) |

---

## Governance Compliance (BRD intake)

Đối chiếu `Product Backlogs/Product Backlogs Governance.md` tại thời điểm khóa BRD:

| Governance requirement | BRD này | Ghi chú |
| --- | --- | --- |
| Hierarchy one-way: BRD → Audit → SoT → Solution → Plan → Impl | ✅ §21 | Khớp chuỗi bắt buộc |
| BRD = requirement tối cao; không khóa implementation | ✅ §4.2 · §21 · Implementation row | Cấm sticky/fixed/JS như requirement |
| **BR Checklist cố định (BR / atomic Req ID)** | ✅ §23 | Bổ sung registry để Audit sinh checklist từ BR — không từ code inventory |
| Audit sinh từ BR Checklist (cấm code-first reverse) | ✅ §16 + §23 | Audit phase phải map từng BR |
| SoT giữa Audit và Solution | ✅ §21 bước 03 | Không skip SoT trừ Owner N/A có lý do |
| Conflict → STOP → escalate | ✅ ngầm theo Governance | Tầng thấp không override BRD |
| Final Verification bắt đầu từ BR Checklist | ✅ §18 AC + §23 | Phase sau |
| Surface / owner / out-of-scope rõ | ✅ §8–§15 | AppShell owner; Page = consumer |

**Kết luận intake:** BRD **tuân thủ** Governance sau khi có §23 BR Checklist Registry.  
**Cấm ngay:** Audit/Solution tự chọn cơ chế sticky/fixed trước khi Audit+SoT+Solution khóa.

---

# 1. Business Objective

Chuẩn hóa hành vi scroll của **AppShell Sidebar** trên toàn hệ thống.

AppShell Sidebar bao gồm tất cả Sidebar do AppShell sở hữu, bao gồm:

* **Left Sidebar**
* **Right Sidebar**

### Objective 1 — Viewport accessibility

Khi User scroll trang dài, Sidebar có thể chuyển sang trạng thái **viewport-following** khi cần thiết, trong khi **Main Content tiếp tục scroll theo document**, để Sidebar không rời khỏi khả năng tiếp cận chỉ vì Main còn rất dài.

### Objective 2 — Reversible, geometry-aware relationship

Maintain a **reversible, geometry-aware relationship** between Sidebar and Main Content across **both** scroll directions.

Task này **không** chỉ là “làm Sidebar luôn nhìn thấy”, và **không** được hiểu là “làm Sidebar sticky”.

Bản chất:

> Thiết kế AppShell Sidebar behavior có khả năng chuyển sang viewport-following khi đạt trigger, nhưng **vẫn bảo toàn document-relative position** và **đồng bộ hai chiều** với Main Content — kể cả khi User đổi hướng scroll và khi quay về đầu document.

Behavior phải là **shared AppShell behavior**, không được trở thành logic riêng của từng Page.

### Locked behavior cycle (WHAT — không HOW)

```text
① DOWN
   Sidebar bottom đạt Viewport Bottom − 24px
           ↓
   Sidebar enters viewport-following

② CONTINUE DOWN
   Main Content tiếp tục scroll
   Sidebar tiếp tục viewport-following

③ REVERSE UP
   Sidebar KHÔNG resume document-flow ngay
           ↓
   chờ Reverse Synchronization Boundary
           ↓
   Sidebar + Main Content cùng resume document-relative movement (đồng bộ)

④ RETURN TO TOP
   Sidebar + Main Content
           ↓
   cùng về đúng document-relative position ban đầu
   (như viewport-following chưa từng được kích hoạt)
```

**BRD khóa WHAT ở trên. BRD không khóa HOW** (không quy định kỹ thuật cụ thể nào để đạt behavior).

---

# 2. Current State

Hiện tại AppShell có Header và Sidebar trong layout.

Behavior hiện tại:

```text
┌───────────────────────────────────────────────┐
│                    HEADER                     │
│                  fixed / top                  │
├──────────────┬────────────────────────────────┤
│              │                                │
│   SIDEBAR    │          MAIN CONTENT          │
│              │                                │
│              │                                │
│              │                                │
└──────────────┴────────────────────────────────┘
                    ↓
              Document scroll
```

Khi User scroll xuống:

* Header tiếp tục giữ vị trí theo top viewport.
* Main Content di chuyển theo document scroll.
* Sidebar cũng di chuyển theo document scroll.
* Sidebar chưa có cơ chế chuyển sang trạng thái viewport-following khi nó đạt vùng cuối viewport.

Điều này khiến Sidebar có thể rời khỏi viewport trong khi Main Content vẫn còn rất nhiều nội dung để User tiếp tục đọc.

---

# 3. Problem Statement

Sidebar là thành phần điều hướng / hỗ trợ của AppShell và cần duy trì khả năng tiếp cận trong quá trình User đọc nội dung dài.

Behavior hiện tại tạo ra vấn đề:

1. Sidebar rời khỏi viewport khi User scroll xuống.
2. User phải scroll ngược lại mới có thể tiếp cận Sidebar.
3. Main Content và Sidebar hiện đang phụ thuộc cùng document scrolling trong khi nhu cầu sử dụng của chúng khác nhau.
4. Nếu triển khai cơ chế Sidebar-following đơn giản theo một điều kiện bật/tắt trạng thái, có nguy cơ:

   * Sidebar nhảy vị trí.
   * Sidebar quay lại document-flow quá sớm.
   * Sidebar và Main Content mất positional synchronization.
   * Khi User đổi hướng scroll, Sidebar có thể đã về vị trí ban đầu trong khi Main Content chưa quay lại tương ứng (**historical position drift**).
5. Sidebar có thể có chiều cao khác nhau giữa các Page / Sidebar type, bao gồm trường hợp Sidebar cao hơn available viewport.

Do đó cần một **AppShell-level scroll behavior** có khả năng xử lý cả hai hướng scroll và phụ thuộc vào geometry thực tế của Sidebar.

---

# 4. Target Behavior

## 4.1 Normal State

Khi Sidebar chưa đạt trigger boundary:

```text
Header
────────────────────────────────────
Sidebar                 Main Content
│                       │
│                       │
│                       │
│                       │
└───────────────────────┘
```

Sidebar tiếp tục hoạt động theo document flow bình thường.

---

## 4.2 Scroll Down — Sidebar Enters Viewport-Following State

Khi User scroll xuống và:

> **Bottom của Sidebar đạt ngưỡng cách Bottom của viewport 24px**

Sidebar phải chuyển sang trạng thái **viewport-following**.

Conceptual condition:

```text
Sidebar Bottom
      │
      ▼
Viewport Bottom - 24px
```

Từ thời điểm đó:

* Sidebar phải tiếp tục duy trì khả năng hiển thị theo viewport.
* Main Content tiếp tục scroll theo document.
* Sidebar không được tiếp tục bị cuốn khỏi viewport chỉ vì Main Content còn tiếp tục scroll.
* Header vẫn duy trì behavior hiện tại.

**BRD không quy định implementation mechanism.**

Cụ thể, BRD không bắt buộc sử dụng:

* `position: fixed`
* `position: sticky`
* JavaScript scroll listener
* Intersection Observer
* CSS-only solution
* hay bất kỳ implementation cụ thể nào.

---

# 5. Bidirectional Scroll Requirement

Đây là requirement bắt buộc.

Sidebar behavior phải hoạt động đúng khi User:

```text
Scroll Down
    ↓
Sidebar enters viewport-following state
    ↓
Continue scrolling
    ↓
Reverse direction
    ↓
Scroll Up
    ↓
Reverse Synchronization Boundary
    ↓
Synchronized return with Main Content
    ↓
Return to original document-relative position
```

## 5.1 Không resume document-flow ngay khi reverse

Khi User bắt đầu đổi hướng từ scroll-down → scroll-up:

> Sidebar MUST NOT immediately resume document-relative movement / return to its original document-flow position chỉ vì điều kiện kích hoạt viewport-following không còn đúng theo chiều xuống.

Trong đoạn đầu của reverse scroll:

* Sidebar **tiếp tục giữ** trạng thái **viewport-following** hiện tại.
* Sidebar **không** “nhảy” về đầu / về vị trí document ban đầu trong khi Main Content vẫn còn ở phía dưới.

## 5.2 Reverse Synchronization Boundary (khái niệm khóa)

**Định nghĩa (WHAT):**

> **Reverse Synchronization Boundary** là document position tại đó Sidebar có thể resume document-relative movement mà **không** gây positional discontinuity hoặc desynchronization với Main Content.

Từ boundary đó trở đi, Sidebar và Main Content phải di chuyển **đồng bộ** theo quan hệ document-relative hợp lệ.

**BRD không hard-code** giá trị / công thức / offset của boundary này.

Mandatory Audit và Solution MUST xác định boundary dựa trên **actual AppShell geometry**, bao gồm tối thiểu:

* Sidebar height (rendered)
* Viewport / available viewport
* Header geometry (nếu ảnh hưởng)
* Scroll container thực tế
* Quan hệ vị trí Sidebar ↔ Main Content tại thời điểm reverse

```text
BRD (WHAT)
├── Follow khi bottom đạt Viewport Bottom − 24px
├── Reverse không resume document-flow ngay
├── Có Reverse Synchronization Boundary
└── Cuối cùng về đúng document position ban đầu
        ↓
   NOT HOW (cấm khóa trong BRD)
├── không quy định kỹ thuật cụ thể
└── không hard-code công thức boundary
        ↓
   Mandatory Audit (geometry / scroll context)
        ↓
   Solution (chọn cơ chế + định nghĩa boundary cụ thể)
```

## 5.3 Reverse Scroll Behavior — Synchronized Return

Khi User đổi hướng từ scroll-down → scroll-up sau khi Sidebar đã ở viewport-following:

1. Sidebar **không follow ngay** theo nghĩa resume document-flow / quay về vị trí ban đầu ngay lập tức.
2. Sidebar **tiếp tục giữ** trạng thái **viewport-following** hiện tại trong đoạn đầu reverse.
3. **Chỉ khi** Main Content / document đạt **Reverse Synchronization Boundary**, Sidebar mới bắt đầu quay về cùng document flow (resume document-relative movement).
4. Từ điểm đó, Sidebar và Main Content **phải di chuyển đồng bộ**.
5. Khi User scroll lên hết / về đầu document, Sidebar **phải trở về đúng document-relative position ban đầu**, giống như viewport-following **chưa từng** được kích hoạt trong chu kỳ đó.

**Cấm xảy ra:**

```text
Scroll Up
     ↓
Sidebar immediately returns to original / top document position
     ↓
Main Content is still further down
```

Tức là:

```text
Sidebar về đầu  ≠  Main đã về đầu
```

**không được phép.**

## 5.4 Full-cycle return (mandatory semantic)

Sau một chu kỳ **scroll xuống → scroll lên hoàn chỉnh**:

> Sidebar MUST occupy the **same document-relative position** it would have occupied if viewport-following behavior had **never** been activated.

Đây là semantic bắt buộc (xem INV-11, INV-12). Verification bắt buộc gồm case **Scroll down sâu → reverse → scroll hết về đầu**.
# 6. Sidebar Height Requirement

Behavior MUST account for **actual rendered Sidebar height**.

Chiều cao Sidebar là một biến quan trọng của behavior và phải được xác định trong Audit.

Hệ thống phải xem xét tối thiểu các trường hợp:

### Case A — Sidebar ngắn hơn available viewport

```text
Sidebar Height < Available Viewport Height
```

### Case B — Sidebar gần bằng available viewport

```text
Sidebar Height ≈ Available Viewport Height
```

### Case C — Sidebar cao hơn available viewport

```text
Sidebar Height > Available Viewport Height
```

Đặc biệt, khi Sidebar cao hơn available viewport:

* Hệ thống không được giả định rằng toàn bộ Sidebar luôn có thể hiển thị cùng lúc.
* Behavior phải cho phép User tiếp cận các phần khác nhau của Sidebar trong quá trình scroll.
* Scroll down và scroll up phải duy trì behavior nhất quán.
* Không được tạo ra clipping, jump hoặc mất khả năng tiếp cận nội dung Sidebar ngoài ý muốn.

---

# 7. Positional Synchronization

Sidebar và Main Content phải duy trì quan hệ vị trí hợp lý trong toàn bộ lifecycle của scroll.

Requirement:

> Chuyển đổi giữa normal-flow state và viewport-following state MUST NOT gây ra visible positional jump hoặc làm Sidebar mất đồng bộ với Main Content.

Các transition phải được xem xét:

```text
Normal
  ↓
Viewport-following

Viewport-following
  ↓
Normal
```

và đặc biệt:

```text
Scroll Down
  ↓
Viewport-following
  ↓
Immediate Scroll Up
```

---

# 8. AppShell Ownership

Đây là **AppShell-level behavior**.

AppShell phải là owner của Sidebar scroll behavior.

Behavior MUST NOT được triển khai thành các logic độc lập tại từng Page.

Không được tạo mô hình:

```text
Community Page
└── Custom Sidebar Scroll Logic

Market Page
└── Custom Sidebar Scroll Logic

Money Flow Page
└── Custom Sidebar Scroll Logic
```

Thay vào đó:

```text
AppShell
├── Header
├── Left Sidebar
├── Main Content
└── Right Sidebar

        ↓

Shared Sidebar Scroll Behavior
```

Các Page chỉ là **consumers / compatibility surfaces** của AppShell behavior.

---

# 9. Left Sidebar & Right Sidebar

Requirement áp dụng cho toàn bộ AppShell Sidebar inventory.

Bao gồm:

* AppShell Left Sidebar
* AppShell Right Sidebar

Không được mặc định rằng Left và Right Sidebar có cùng:

* renderer
* height
* parent container
* route coverage
* responsive behavior
* scroll context

Các khác biệt này phải được xác định trong Mandatory Audit.

Nếu có Sidebar nào hiện tại không sử dụng AppShell renderer hoặc có page-specific ownership, phải được xác định rõ và phân loại trước khi Solution được phê duyệt.

---

# 10. Page Compatibility

Feature này không phải Page-level feature.

Tuy nhiên, các Page đang consume AppShell Sidebar phải được audit để xác định compatibility.

Mandatory Audit phải xác định:

* Page nào sử dụng Left Sidebar.
* Page nào sử dụng Right Sidebar.
* Page nào sử dụng cả hai.
* Page nào không có Sidebar.
* Có Page nào override AppShell layout không.
* Scroll container thực tế của từng nhóm Page.
* Có nested scroll container hay không.
* Có Page-specific CSS / JavaScript tác động tới Sidebar hay không.

Nếu phát hiện Page-specific implementation đang cản trở AppShell behavior, đó là **compatibility/remediation finding**, không làm thay đổi ownership của feature.

---

# 11. Scroll Context Requirement

Mandatory Audit MUST xác định chính xác element/container thực sự chịu trách nhiệm cho vertical scrolling.

Phải phân biệt tối thiểu:

* `window`
* `document`
* `body`
* AppShell wrapper
* Main container
* Nested scroll container

Solution không được xây dựng dựa trên giả định rằng `window` luôn là scroll container.

---

# 12. Header Relationship

Header hiện tại có behavior fixed theo top viewport.

Sidebar behavior mới:

* Không được phá vỡ Header.
* Không được tạo overlap ngoài design intent.
* Phải tính đến Header geometry khi xác định available viewport space nếu Audit chứng minh Header ảnh hưởng đến Sidebar positioning.
* Không được thay đổi Header behavior nếu không có requirement riêng.

Header là dependency / geometry constraint của Sidebar, **không thuộc scope thay đổi của task này**.

---

# 13. Responsive Requirement

Behavior phải được Audit trên các viewport/breakpoint mà AppShell hỗ trợ.

Mandatory Audit phải xác định:

* Sidebar có tồn tại trên mobile hay không.
* Left/Right Sidebar có thay đổi thành phần / vị trí trên responsive layout hay không.
* Sidebar có trở thành drawer / overlay / hidden state hay không.
* Scroll behavior nào phù hợp với từng AppShell mode.

Task này không mặc định rằng desktop Sidebar behavior có thể copy nguyên trạng sang mobile.

Nếu responsive architecture không sử dụng Sidebar, behavior này không được ép áp dụng ngoài scope thực tế của Sidebar.

---

# 14. Scope

## 14.1 In Scope

### AppShell

* Left Sidebar
* Right Sidebar
* Shared Sidebar scroll behavior
* Sidebar geometry
* Sidebar scroll state transition
* Bidirectional scroll behavior
* Reverse Synchronization Boundary (concept; giá trị do Audit/Solution)
* Synchronized return / reversible document position
* Sidebar/Main positional synchronization
* Scroll container compatibility
* Header geometry relationship
* Responsive compatibility

### Audit

* Sidebar inventory
* Route coverage
* Ownership
* Renderer
* Geometry
* Scroll context
* Existing CSS/JS behavior
* Page compatibility
* Responsive behavior
* Reverse sync / full-cycle return evidence matrix (§16.H)

---

# 15. Out of Scope

Task này không bao gồm:

* Thay đổi Navigation model.
* Thay đổi Navigation Registry.
* Thay đổi nội dung Sidebar.
* Thay đổi Sidebar information architecture.
* Thay đổi Header design.
* Thay đổi Main Content business logic.
* Thay đổi Page-specific business logic.
* Redesign Sidebar UI.
* Thay đổi typography/token/design system nếu không phát sinh như dependency bắt buộc.
* Tối ưu nội dung hoặc component bên trong Sidebar.
* Thay đổi routing.

Không được mở rộng scope sang các vấn đề trên chỉ vì chúng xuất hiện trong quá trình implementation nếu không có impact trực tiếp tới requirement này.

---

# 16. Mandatory Audit Requirements

Trước khi Solution / Plan được phê duyệt, Mandatory Audit MUST establish evidence cho các nhóm sau.

## A — Complete Sidebar Inventory

Xác định toàn bộ:

| Field                   | Required |
| ----------------------- | -------- |
| Sidebar identifier      | YES      |
| Renderer                | YES      |
| Position: Left / Right  | YES      |
| Route coverage          | YES      |
| AppShell ownership      | YES      |
| Page-specific ownership | YES      |
| Shared / unique         | YES      |
| Responsive mode         | YES      |

---

## B — Scroll Context Audit

Xác định:

```text
Actual vertical scroll owner
AppShell scroll container
Main scroll container
Nested scroll containers
Existing overflow rules
```

---

## C — Geometry Audit

Đo / xác định:

```text
Header height
Sidebar rendered height
Sidebar top
Sidebar bottom
Sidebar parent height
Available viewport height
Main content height
Sidebar container height
Relevant offsets / gaps
```

Không được dùng assumption thay cho measured evidence nếu geometry có thể xác định từ runtime.

---

## D — Existing Behavior Audit

Kiểm tra:

* `position`
* `overflow`
* `sticky`
* `fixed`
* `absolute`
* transforms
* scroll listeners
* Intersection Observer
* Resize Observer
* existing layout calculations
* existing AppShell state management

Mục tiêu là tránh tạo duplicate implementation.

---

## E — Bidirectional Scroll Audit

Phải kiểm tra tối thiểu:

1. Scroll down từ đầu trang.
2. Sidebar đạt trigger boundary (Viewport Bottom − 24px).
3. Tiếp tục scroll xuống.
4. Scroll ngược lên (không immediate resume document-flow).
5. Scroll ngược ngay sau khi vừa kích hoạt.
6. Scroll down sâu → reverse → scroll hết về đầu (**mandatory**).
7. Kiểm tra Sidebar có jump hay không.
8. Kiểm tra Sidebar/Main có mất synchronization hay không.
9. Xác định / đề xuất evidence cho **Reverse Synchronization Boundary** (không hard-code trong BRD).

---

## F — Height Matrix

Phải test / mô phỏng tối thiểu:

| Scenario                        | Required |
| ------------------------------- | -------: |
| Short Sidebar + Long Main       |        ✓ |
| Sidebar ≈ viewport              |        ✓ |
| Tall Sidebar + Long Main        |        ✓ |
| Sidebar > available viewport    |        ✓ |
| Different Left Sidebar heights  |        ✓ |
| Different Right Sidebar heights |        ✓ |

---

## G — Route Compatibility Matrix

Mandatory Audit MUST produce matrix:

| Route     | AppShell | Left Sidebar | Right Sidebar | Scroll Context | Compatibility |
| --------- | -------: | -----------: | ------------: | -------------- | ------------- |
| `<route>` |      ✓/— |          ✓/— |           ✓/— | `<actual>`     | PASS/FAIL     |
| `<route>` |      ✓/— |          ✓/— |           ✓/— | `<actual>`     | PASS/FAIL     |

Danh sách route phải lấy từ codebase evidence, không suy luận.

---

## H — Reverse Sync / Verification Matrix (mandatory)

Mandatory Audit (baseline hiện trạng) **và** Final Verification (sau Implementation) MUST cover:

| Test | Expected |
| --- | --- |
| Scroll down → reverse ngay | Sidebar không jump; không immediate resume document-flow |
| Scroll down sâu → reverse | Sidebar không jump; giữ viewport-following đến Reverse Sync Boundary |
| Scroll down → reverse → scroll up hết | Sidebar và Main **cùng** về đầu / đúng document position ban đầu |
| Scroll down → reverse → lại scroll down | State không bị lỗi; có thể re-enter following đúng trigger |
| Scroll rất nhanh | Không mất synchronization |
| Scroll chậm từng bước | Behavior tương đương scroll nhanh (cùng semantics) |
| Sidebar ngắn | PASS theo AC/INV liên quan |
| Sidebar cao | PASS theo AC/INV liên quan |
| Sidebar > viewport | PASS theo AC/INV liên quan |

**Mandatory acceptance test (khóa):**

> Scroll down sâu → reverse → scroll hết về đầu  
> → Sidebar + Main cùng về đúng document-relative position ban đầu (INV-11 · INV-12 · AC-04).

---

# 17. Business Invariants

Các nguyên tắc sau MUST NOT bị phá vỡ:

### INV-01 — AppShell Ownership

Sidebar scroll behavior thuộc AppShell.

### INV-02 — Shared Behavior

Không tạo implementation riêng theo Page nếu Sidebar là cùng một AppShell capability.

### INV-03 — 24px Trigger

Ngưỡng business requirement là **24px clearance tại viewport bottom**.

Implementation có thể khác, nhưng behavior cuối cùng phải đáp ứng semantic requirement này.

### INV-04 — Bidirectional

Behavior phải đúng ở cả scroll-down và scroll-up.

### INV-05 — No Jump

Không được có visible positional jump khi chuyển state.

### INV-06 — Synchronization

Sidebar không được mất synchronization với Main Content.

### INV-07 — Geometry-Aware

Behavior phải tính đến rendered Sidebar height và available viewport.

### INV-08 — No Page Ownership

Page không trở thành owner của Sidebar scroll state.

### INV-09 — Existing Architecture First

Không được tạo implementation mới nếu AppShell đã có infrastructure có thể reuse.

### INV-10 — Responsive Integrity

Không được phá vỡ responsive behavior hiện tại.

### INV-11 — Reversible Document Position

Sau một chu kỳ scroll xuống → scroll lên hoàn chỉnh, Sidebar MUST return to the **same document-relative position** it would have occupied if viewport-following behavior had **never** been activated.

Không được phép:

```text
Sidebar đã về đầu / vị trí ban đầu
     ≠
Main Content vẫn còn ở phía dưới
```

### INV-12 — No Historical Position Drift

Activation of viewport-following behavior MUST NOT **permanently** alter the Sidebar's document-relative position.

Sidebar có thể ở trạng thái viewport-following trong lúc scroll, nhưng việc đó **không** được làm thay đổi vị trí thật của nó trong document sau khi chu kỳ reverse hoàn tất:

```text
Before:  Sidebar document position = X
Scroll down: Sidebar viewport-following
Scroll up (qua Reverse Sync Boundary → synchronized return)
After:   Sidebar document position = X
```

---

# 18. Acceptance Criteria

Task được xem là đạt Business Requirement khi tất cả các điều kiện sau được thỏa mãn.

## AC-01 — Sidebar Inventory

Toàn bộ AppShell Left/Right Sidebar đã được inventory và route mapping có evidence.

## AC-02 — Correct Trigger

Khi Sidebar bottom đạt configured clearance:

> **Viewport Bottom − 24px**

Sidebar chuyển sang viewport-following behavior theo Solution đã được phê duyệt.

## AC-03 — Main Continues Scrolling

Sau khi Sidebar enters viewport-following state:

* Main Content tiếp tục scroll.
* Sidebar không bị cuốn khỏi viewport ngoài boundary đã được định nghĩa.

## AC-04 — Reverse Scroll Synchronization

Khi User reverse scroll:

* Sidebar **không** immediately resume document-flow movement.
* Sidebar **duy trì viewport-following state** trong đoạn đầu của reverse scroll.
* Khi đạt **Reverse Synchronization Boundary**, Sidebar bắt đầu di chuyển cùng Main Content (document-relative, đồng bộ).
* Sidebar **không được jump**.
* Sidebar và Main Content phải giữ positional synchronization trong phần còn lại của reverse scroll.
* Khi User về đầu document, Sidebar phải ở **đúng vị trí document-relative ban đầu** (INV-11 · INV-12).

**Mandatory test:** Scroll down sâu → reverse → scroll hết về đầu.

## AC-05 — No Positional Jump

Không xuất hiện visible jump tại state transition.

## AC-06 — Sidebar Height

Behavior hoạt động đúng với:

* Sidebar ngắn.
* Sidebar gần bằng viewport.
* Sidebar dài.
* Sidebar dài hơn available viewport.

## AC-07 — Left Sidebar

Left Sidebar đạt behavior tương ứng với requirement trên tất cả route hợp lệ.

## AC-08 — Right Sidebar

Right Sidebar đạt behavior tương ứng với requirement trên tất cả route hợp lệ.

## AC-09 — Page Independence

Không cần thêm custom Sidebar scroll implementation tại từng Page để đạt behavior.

## AC-10 — Header Integrity

Header giữ nguyên behavior hiện tại và không bị regression.

## AC-11 — Responsive Integrity

Không phá vỡ AppShell responsive behavior.

## AC-12 — Scroll Context

Behavior hoạt động đúng với scroll container thực tế đã được xác định trong Audit.

## AC-13 — Existing Code Reuse

Không tồn tại duplicate implementation khi đã có AppShell/shared infrastructure phù hợp.

---

# 19. Non-Functional Requirements

## NFR-01 — Visual Stability

State transition phải ổn định, không flicker/jump.

## NFR-02 — Performance

Scroll behavior không được tạo ra main-thread workload không cần thiết hoặc gây perceptible scroll jank.

## NFR-03 — Maintainability

Behavior phải có một AppShell-level owner rõ ràng.

## NFR-04 — Predictability

Cùng một AppShell Sidebar type phải có behavior nhất quán giữa các Page consume nó, trừ khi Audit xác định một layout mode khác biệt có chủ đích.

## NFR-05 — No Regression

Không làm thay đổi:

* Navigation behavior
* Sidebar content
* Main Content functionality
* Header behavior
* Existing responsive behavior

ngoài những thay đổi cần thiết để đáp ứng requirement.

---

# 20. Required Solution Deliverables

Mandatory Audit phải hoàn thành trước khi Solution được khóa.

Sau Audit, Solution phải trả lời rõ:

1. AppShell Sidebar hiện được render ở đâu?
2. Có bao nhiêu Left Sidebar?
3. Có bao nhiêu Right Sidebar?
4. Các Sidebar có thực sự dùng chung renderer/owner không?
5. Scroll container thực tế là gì?
6. Sidebar geometry hiện tại như thế nào?
7. Cơ chế nào phù hợp nhất với existing architecture?
8. Làm thế nào để giữ synchronization khi reverse scroll (Reverse Synchronization Boundary)?
9. Làm thế nào xử lý Sidebar cao hơn viewport?
10. Làm thế nào bảo đảm INV-11 / INV-12 (reversible document position · no historical drift)?
11. Có cần thay đổi shared AppShell layout wrapper không?
12. Có cần page remediation không?
13. Có thể reuse infrastructure nào?
14. Có regression risk nào?
15. Test matrix cuối cùng là gì (phải gồm §16.H)?

---

# 21. Governance Sequence

Task này MUST follow Product Backlog Governance:

```text
01 — Business Requirement
        ↓
02 — Mandatory Audit
        ↓
03 — SoT / Governance
        ↓
04 — Solution
        ↓
05 — Implementation Plan
        ↓
06 — Implementation
        ↓
07 — Verification / Production Validation
```

### BRD Boundary

BRD này **không phê duyệt implementation**.

Đặc biệt:

> BRD không được xem việc sử dụng bất kỳ kỹ thuật cụ thể nào (kể cả các kỹ thuật positioning / observation phổ biến) là requirement.  
> BRD **không** mô tả behavior bằng ngôn ngữ “gắn/gỡ” một kỹ thuật cụ thể — chỉ mô tả **viewport-following**, **document-relative movement**, **Reverse Synchronization Boundary**, và **return to original document position**.

Đó là quyết định của **Solution phase**, dựa trên evidence từ Mandatory Audit.

---

# 22. Definition of Done — BRD Phase

BRD phase hoàn tất khi:

* [x] Business objective được xác định (accessibility + reversible geometry-aware relationship).
* [x] Current behavior được xác định.
* [x] Target behavior được xác định (①–④ locked cycle).
* [x] 24px trigger được xác định.
* [x] Bidirectional scroll requirement được xác định.
* [x] Reverse Synchronization Boundary (concept) được xác định — **không** hard-code giá trị.
* [x] Reverse Scroll — Synchronized Return được xác định.
* [x] INV-11 / INV-12 được xác định.
* [x] Sidebar height requirement được xác định.
* [x] Positional synchronization requirement được xác định.
* [x] AppShell ownership được xác định.
* [x] Page compatibility boundary được xác định.
* [x] Left/Right Sidebar scope được xác định.
* [x] Responsive boundary được xác định.
* [x] Mandatory Audit requirements được xác định (gồm §16.H).
* [x] Acceptance criteria được xác định (AC-04 Synchronization).
* [x] Implementation mechanism chưa bị khóa.
* [x] Governance sequence được xác định.
* [x] BR Checklist Registry (atomic) được khóa (§23).

**BRD Status: OWNER LOCKED · AMENDED (Reverse Sync) · Audit v1+02a COMPLETE · SoT LOCKED · Next Solution**

---

# 23. BR Checklist Registry (LOCKED · xương sống bất biến)

> Theo Product Backlogs Governance §2.1 / Rule 1–6: mọi Audit / SoT / Solution / Plan / Verification **phải** có một hàng riêng cho từng BR / atomic dưới đây.  
> **Cấm** gộp hàng · **cấm** sinh Audit từ code inventory rồi map ngược.  
> **Amendment 2026-08-10:** thêm BR-04.* (Reverse Sync), INV-11/12, BR-AUD.H — Audit v1 phải có **Amendment** map các dòng mới.

| BR ID | Atomic | Requirement (chữ BRD) | Source |
| --- | --- | --- | --- |
| BR-01 | BR-01.1 | Sidebar scroll = **AppShell-owned** shared behavior | §1 · §8 · INV-01 · INV-08 |
| BR-01 | BR-01.2 | Không triển khai logic scroll riêng theo Page cho cùng AppShell Sidebar capability | §8 · INV-02 · AC-09 |
| BR-01 | BR-01.3 | Objective gồm reversible, geometry-aware relationship hai chiều Sidebar ↔ Main | §1 Objective 2 |
| BR-02 | BR-02.1 | Scope gồm **Left Sidebar** và **Right Sidebar** AppShell | §9 · AC-07 · AC-08 |
| BR-02 | BR-02.2 | Không giả định Left ≡ Right (renderer / height / parent / routes / responsive / scroll context) | §9 |
| BR-03 | BR-03.1 | Normal state: Sidebar theo document flow khi chưa đạt trigger | §4.1 |
| BR-03 | BR-03.2 | Trigger semantic: Sidebar bottom đạt **Viewport Bottom − 24px** → viewport-following | §4.2 · INV-03 · AC-02 |
| BR-03 | BR-03.3 | Sau following: Main tiếp tục scroll; Sidebar không bị cuốn khỏi viewport ngoài boundary | §4.2 · AC-03 · cycle ② |
| BR-03 | BR-03.4 | BRD **không** khóa mechanism / kỹ thuật cụ thể | §4.2 · §21 |
| BR-04 | BR-04.1 | Reverse: không immediately resume document-flow; giữ viewport-following đoạn đầu | §5.1 · §5.3 · INV-04 · AC-04 |
| BR-04 | BR-04.2 | Tồn tại **Reverse Synchronization Boundary** (concept); giá trị do Audit/Solution — không hard-code BRD | §5.2 · AC-04 |
| BR-04 | BR-04.3 | Sau boundary: Sidebar + Main di chuyển đồng bộ (document-relative) | §5.3 · INV-06 · AC-04 |
| BR-04 | BR-04.4 | Full cycle về đầu: cùng document-relative position ban đầu (như chưa từng following) | §5.4 · INV-11 · AC-04 · §16.H |
| BR-04 | BR-04.5 | No historical position drift — following không đổi vĩnh viễn document position | INV-12 |
| BR-05 | BR-05.1 | Geometry-aware: Case A short / B ≈ viewport / C taller than viewport | §6 · INV-07 · AC-06 |
| BR-05 | BR-05.2 | Sidebar > viewport: vẫn tiếp cận được các phần Sidebar; không clip/jump ngoài ý muốn | §6 · AC-06 |
| BR-06 | BR-06.1 | Không visible positional jump khi Normal ↔ Following (kể cả immediate reverse) | §7 · INV-05 · AC-05 |
| BR-06 | BR-06.2 | Giữ positional synchronization Sidebar ↔ Main | §7 · INV-06 · AC-04 |
| BR-07 | BR-07.1 | Header không bị phá / regression; Header = geometry constraint, không đổi behavior Header | §12 · AC-10 |
| BR-08 | BR-08.1 | Scroll container thực tế do Audit xác định; không giả định luôn là `window` | §11 · AC-12 |
| BR-09 | BR-09.1 | Responsive: audit existence / drawer / overlay; không copy desktop nếu không có Sidebar | §13 · INV-10 · AC-11 |
| BR-10 | BR-10.1 | Page = consumer; page-specific cản trở = remediation finding, không đổi ownership | §10 |
| BR-11 | BR-11.1 | Existing-architecture-first: reuse trước create; không duplicate nếu đã có infra | INV-09 · AC-13 |
| BR-12 | BR-12.1 | NFR: visual stability / perf / maintainability / predictability / no regression ngoài scope | §19 |
| BR-AUD | BR-AUD.A | Audit A — Complete Sidebar Inventory (các field bắt buộc) | §16.A · AC-01 |
| BR-AUD | BR-AUD.B | Audit B — Scroll Context | §16.B |
| BR-AUD | BR-AUD.C | Audit C — Geometry (measured) | §16.C |
| BR-AUD | BR-AUD.D | Audit D — Existing behavior (overflow / positioning / observers / …) | §16.D |
| BR-AUD | BR-AUD.E | Audit E — Bidirectional scroll scenarios | §16.E |
| BR-AUD | BR-AUD.F | Audit F — Height matrix | §16.F |
| BR-AUD | BR-AUD.G | Audit G — Route compatibility matrix từ codebase evidence | §16.G |
| BR-AUD | BR-AUD.H | Audit/Verification H — Reverse Sync matrix (gồm mandatory deep-down → reverse → top) | §16.H · AC-04 |

**Documents:**  
- `02 - Audit` (v1) — baseline hiện trạng.  
- `02a - Audit Amendment — Reverse Sync` — **DONE** map BR-01.3 · BR-04.* · BR-AUD.H · INV-11/12.  
- `03 - SoT` — OWNER LOCKED (đã gồm Reverse Sync).  
- **Next:** Solution.
