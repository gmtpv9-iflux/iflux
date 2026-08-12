# 03 — SoT — AppShell Sidebar Scroll Behavior

|                     |                                                    |
| ------------------- | -------------------------------------------------- |
| **Task ID**         | `100826_AppShell_Sidebar_Scroll_Behavior`          |
| **BRD**             | `01 - BRD — AppShell Sidebar Scroll Behavior.md`   |
| **Mandatory Audit** | `02` + `02a - Audit Amendment — Reverse Sync.md` + `02b - Audit Amendment — Post-Foundation Convergence.md` |
| **Document Type**   | **Source of Truth (SoT)**                          |
| **Status**          | **OWNER LOCKED**                                   |
| **Authority**       | AppShell Architecture / Shared Layout Governance   |
| **Next Phase**      | Solution (**✅ UNBLOCKED 2026-08-11** — Foundation `100826_AppShell_Architecture_Standardization_Reuse_Foundation` đã CLOSED; Audit đã amend theo `02b`) |

---

# 1. SoT Purpose

Document này thiết lập **Source of Truth** cho AppShell Sidebar capability sau Mandatory Audit.

SoT xác định:

* Sidebar nào thực sự thuộc AppShell.
* Owner của capability.
* Các Consumer hiện tại.
* Các Sidebar nào không thuộc AppShell.
* Scroll context hiện tại.
* Capability gap.
* Target capability boundary.
* Governance boundary giữa AppShell và Page.

SoT này **không quyết định implementation mechanism**.

Các quyết định như:

* `position: sticky`
* `position: fixed`
* JavaScript scroll state
* Intersection Observer
* Resize Observer
* transform
* placeholder / spacer
* hay hybrid implementation

thuộc **Solution phase**, không thuộc SoT.

---

# 2. Authority

Thứ tự authority của task:

```text
BRD
  ↓
Mandatory Audit Evidence
  ↓
THIS SoT
  ↓
Solution
  ↓
Implementation Plan
```

SoT phải được reconcile với BRD và Mandatory Audit.

Nếu Implementation phát hiện evidence mâu thuẫn với SoT:

> **Implementation MUST NOT tự ý thay đổi SoT.**

Phải quay lại Audit / SoT governance để resolve conflict.

---

# 3. Current AppShell Sidebar Capability

Mandatory Audit xác nhận hiện trạng:

### AppShell Left Sidebar

AppShell hiện có **Left Sidebar capability**.

Current active consumers:

1. **Thị trường**
2. **Nhà**

Hai consumer này sử dụng AppShell-owned Sidebar architecture.

---

### AppShell Right Sidebar

Hiện tại:

> **Không có active AppShell Right Sidebar consumer.**

Điều này không có nghĩa AppShell architecture bị giới hạn vĩnh viễn ở Left Sidebar.

Right Sidebar vẫn thuộc capability boundary của AppShell nếu/không khi được AppShell architecture sử dụng trong tương lai.

---

# 4. Sidebar Ownership Matrix

| Sidebar / Surface       | Current Owner       | AppShell Capability | Current Status     |                             Task Scope |
| ----------------------- | ------------------- | ------------------: | ------------------ | -------------------------------------: |
| Thị trường Left Sidebar | AppShell            |                 YES | Active             |                           **IN SCOPE** |
| Nhà Left Sidebar        | AppShell            |                 YES | Active             |                           **IN SCOPE** |
| AppShell Right Sidebar  | AppShell capability |                 YES | No active consumer | **Capability scope / future consumer** |
| Cộng đồng Right Sidebar | Community Page      |                  NO | Active             |                       **OUT OF SCOPE** |
| Stock sticky            | Stock Page          |                  NO | Active             |                       **OUT OF SCOPE** |
| Pricing sticky          | Pricing Page        |                  NO | Active             |                       **OUT OF SCOPE** |

---

# 5. Core Ownership Rule

## SOt-01 — AppShell Owns Shared Sidebar Behavior

> **AppShell is the single owner of shared Sidebar behavior for AppShell-owned Sidebar instances.**

Các Page sử dụng AppShell Sidebar là Consumer.

Page MUST NOT trở thành owner của shared Sidebar scroll state.

Không được tạo mô hình:

```text
Page
└── custom AppShell Sidebar scroll behavior
```

Thay vào đó:

```text
AppShell
├── Sidebar capability
└── Shared Sidebar behavior
       ↑
       │
   Page consumers
```

---

# 6. AppShell Left Sidebar SoT

## SOt-02 — Active Left Sidebar Consumers

Current AppShell Left Sidebar consumers are:

* **Thị trường**
* **Nhà**

Đây là **canonical inventory** tại thời điểm SoT được thiết lập.

Bất kỳ Page mới nào sử dụng cùng AppShell Left Sidebar architecture đều phải consume capability này, không tạo một Sidebar scroll implementation riêng.

---

# 7. AppShell Right Sidebar SoT

## SOt-03 — Right Sidebar Capability

AppShell Right Sidebar hiện:

> **Không có active consumer.**

Do đó:

* Không được tạo fake/current Page usage để chứng minh Right Sidebar đang tồn tại.
* Không được kéo Page-owned Right Sidebar vào AppShell scope.
* Không cần triển khai behavior riêng cho một Right Sidebar consumer chưa tồn tại.
* Shared AppShell capability phải được thiết kế sao cho không khóa kiến trúc chỉ cho Left Sidebar nếu Solution chứng minh việc hỗ trợ cả hai là hợp lý.

---

# 8. Community Right Sidebar Boundary

## SOt-04 — Community Right Sidebar Is Page-Owned

Right Sidebar hiện tại của **Cộng đồng** là:

> **Page-owned Sidebar.**

Nó không phải AppShell Sidebar consumer.

Do đó:

```text
Community
└── Right Sidebar
      └── Page ownership
```

không được được diễn giải thành:

```text
AppShell
└── Right Sidebar
```

### Scope consequence

Task `100826_AppShell_Sidebar_Scroll_Behavior` **không được tự động thay đổi Community Right Sidebar**.

Nếu trong tương lai muốn chuẩn hóa Community Right Sidebar thành AppShell capability, phải tạo / mở rộng requirement và thực hiện governance riêng.

---

# 9. Existing Page-Owned Sticky Boundary

## SOt-05 — Page-Owned Sticky Is Not AppShell Capability

Mandatory Audit phát hiện các sticky behavior hiện có tại:

* Stock
* Pricing

Các behavior này là **page-owned**.

Chúng:

* không phải AppShell Sidebar capability;
* không phải evidence rằng AppShell đã có viewport-following;
* không được coi là implementation hiện tại để claim BRD đã đạt;
* không được tự động refactor vào task này.

---

# 10. Current Scroll Context

## SOt-06 — Document-Level Scrolling

Mandatory Audit xác nhận vertical scrolling hiện tại sử dụng:

> **window / html / body document scrolling context**

AppShell Left Sidebar hiện đang ở trạng thái:

> **normal document flow / `position: static`**

Hiện chưa có shared AppShell viewport-following state.

Đây là baseline architecture của Solution.

---

# 11. Capability Gap

## SOt-07 — Shared Viewport-Following Capability Does Not Exist

Current AppShell architecture chưa có shared capability đáp ứng đầy đủ:

* 24px viewport-bottom trigger;
* viewport-following state;
* bidirectional behavior;
* reverse synchronization;
* Sidebar-height-aware behavior;
* no positional jump;
* restoration to original document-relative position.

Do đó:

> Existing page-owned sticky implementations MUST NOT được tái sử dụng như thể chúng đã đáp ứng AppShell requirement.

---

# 12. Target AppShell Capability

## SOt-08 — Shared Sidebar Scroll Capability

AppShell SHALL provide a shared Sidebar scroll behavior satisfying the BRD.

Capability phải áp dụng cho:

```text
AppShell-owned Sidebar
        ↓
Shared behavior
        ↓
All valid AppShell consumers
```

Capability không được phụ thuộc vào việc Page tự viết scroll logic.

---

# 13. Scroll-Down Behavior SoT

## SOt-09 — 24px Viewport Clearance

Theo BRD:

> Khi Bottom của AppShell Sidebar đạt ngưỡng **24px phía trên Bottom của viewport**, Sidebar phải có khả năng chuyển sang viewport-following behavior.

Semantic requirement:

```text
Sidebar Bottom
      ↓
Viewport Bottom - 24px
      ↓
Viewport-following state
```

Con số **24px** là business/UI behavior requirement và là SoT.

Cách đạt behavior này là Solution concern.

---

# 14. Scroll-Up Behavior SoT

## SOt-10 — Delayed Reverse Following

AppShell Sidebar **không được immediate resume document-flow movement ngay khi User bắt đầu scroll ngược lên**.

Thay vào đó:

```text
Viewport-following
       ↓
User scrolls UP
       ↓
Sidebar remains in current following state
       ↓
Reach Reverse Synchronization Boundary
       ↓
Sidebar resumes synchronized movement
```

Đây là behavior đã được chọn cho task.

Không sử dụng model:

```text
scroll up
↓
immediately unfix
↓
follow document
```

trừ khi Solution phase chứng minh rằng implementation đó vẫn tạo ra **exactly the same externally observable behavior** và không vi phạm các invariant của BRD.

---

# 15. Reverse Synchronization Boundary

## SOt-11 — Boundary Is a Solution-Derived Geometry

BRD yêu cầu Sidebar phải có **Reverse Synchronization Boundary**.

SoT khóa concept này nhưng **không khóa công thức**.

Định nghĩa:

> Reverse Synchronization Boundary là document-relative boundary tại đó AppShell Sidebar có thể bắt đầu resume synchronized document-flow movement mà không gây positional jump hoặc synchronization drift.

Boundary phải được xác định trong Solution dựa trên actual:

* Sidebar geometry;
* Sidebar rendered height;
* Sidebar document position;
* Header geometry;
* viewport;
* Main Content position;
* scroll context.

Solution MUST NOT sử dụng một magic number không có architectural justification để thay thế boundary này.

---

# 16. Original Document Position

## SOt-12 — Document Position Must Be Reversible

Viewport-following behavior không được làm mất hoặc thay đổi canonical document-relative position của Sidebar.

Invariant:

```text
Before activation
Sidebar document position = X

↓ scroll down

Viewport-following state

↓ scroll up

After complete return
Sidebar document position = X
```

Sidebar phải có khả năng quay lại vị trí document mà nó sẽ có nếu viewport-following behavior chưa từng được kích hoạt.

---

# 17. No Positional Drift

## SOt-13 — No Historical Position Drift

Việc Sidebar chuyển sang viewport-following state MUST NOT tạo ra permanent positional drift.

Không được xảy ra:

```text
Sidebar reaches top
while Main Content is still below
```

hoặc:

```text
Main Content reaches top
while Sidebar remains displaced
```

khi chu kỳ scroll hoàn tất.

---

# 18. Sidebar Height Is Part of Capability Geometry

## SOt-14 — Height-Aware Behavior

Sidebar scroll behavior phải dựa trên **actual rendered Sidebar height**.

Solution phải có khả năng xử lý:

```text
Sidebar < available viewport
Sidebar ≈ available viewport
Sidebar > available viewport
```

Không được xây dựng architecture dựa trên assumption:

> Sidebar luôn ngắn hơn viewport.

Sidebar height có thể dynamic theo content.

---

# 19. Main Content Relationship

## SOt-15 — Main Content Remains Primary Document Scroll

Sidebar viewport-following behavior không được biến Main Content thành một scroll container độc lập nếu điều đó không thuộc architecture hiện tại hoặc không được Solution phê duyệt.

Current SoT:

> Main Content tiếp tục tham gia document-level scrolling.

Khi Sidebar viewport-following:

```text
Main Content
    ↓
continues document scrolling

Sidebar
    ↓
viewport-following within defined boundaries
```

---

# 20. Header Relationship

## SOt-16 — Header Is Existing AppShell Constraint

Header hiện tại giữ behavior fixed theo top viewport.

Task này:

* không thay đổi Header ownership;
* không redesign Header;
* không thay đổi Header behavior nếu không cần thiết;
* phải xem Header geometry là constraint khi xác định available Sidebar viewport.

Nếu Solution cần thay đổi shared layout geometry để đáp ứng Sidebar behavior, phải document rõ dependency đó.

---

# 21. Page Compatibility Boundary

## SOt-17 — Pages Are Consumers, Not Owners

Page-level code có thể được sửa **nếu cần để bảo đảm AppShell compatibility**, nhưng:

> Page remediation không được biến Page thành owner của Sidebar scroll behavior.

Cho phép:

```text
Page
└── compatibility adjustment
```

Không cho phép:

```text
Page
└── independent Sidebar scroll engine
```

---

# 22. Responsive Boundary

## SOt-18 — AppShell Mode Determines Applicability

Sidebar behavior chỉ áp dụng khi Sidebar thực sự tồn tại trong AppShell mode tương ứng.

Nếu responsive mode:

* hides Sidebar;
* transforms Sidebar into drawer;
* transforms Sidebar into overlay;
* hoặc thay đổi AppShell layout;

thì Solution phải xác định behavior tương ứng.

Không được ép desktop Sidebar behavior vào một responsive mode không còn Sidebar.

---

# 23. Existing Code Reuse Principle

## SOt-19 — Reuse Before New Implementation

Solution MUST inspect existing AppShell infrastructure trước khi tạo implementation mới.

Ưu tiên:

```text
Existing AppShell infrastructure
        ↓
Existing shared layout primitives
        ↓
Existing geometry/state utilities
        ↓
New implementation only if necessary
```

Page-owned sticky implementations không được xem là AppShell infrastructure chỉ vì chúng có behavior tương tự.

---

# 24. Scope Boundary

## IN SCOPE

```text
AppShell
├── Left Sidebar
│   ├── Thị trường
│   └── Nhà
│
├── Shared Sidebar scroll behavior
├── Sidebar geometry
├── Bidirectional scroll behavior
├── Reverse synchronization
├── 24px trigger
├── Main/Sidebar synchronization
└── Responsive AppShell compatibility
```

## OUT OF SCOPE

```text
Community Right Sidebar
Stock page sticky
Pricing page sticky
Page-owned unrelated sticky behaviors
Sidebar content redesign
Navigation redesign
Header redesign
Main Content business logic
Routing changes
```

---

# 25. Governance Rules

## SOt-20 — No Scope Expansion by Similarity

Một Sidebar chỉ vì có hình thức giống AppShell Sidebar **không có nghĩa nó thuộc AppShell capability**.

Ownership được xác định bởi architecture/renderer/owner đã được Audit chứng minh.

---

## SOt-21 — No Implementation Leakage Into SoT

Không được cập nhật SoT bằng các implementation assumptions như:

```text
"Sidebar uses position: fixed"
"Sidebar uses sticky"
"Sidebar uses IntersectionObserver"
```

trừ khi một Solution đã được phê duyệt và sau đó trở thành architectural SoT.

---

## SOt-22 — Solution Must Reconcile With SoT

Solution phải satisfy toàn bộ:

* ownership;
* scope;
* 24px behavior;
* bidirectional behavior;
* reverse synchronization;
* height awareness;
* no drift;
* no page ownership.

Nếu Solution không thể đáp ứng một SoT invariant:

> Solution MUST NOT tự ý thay đổi invariant.

Phải quay lại SoT governance.

---

# 26. Solution Decision Gate

Solution phase được xem là READY khi có thể trả lời bằng evidence/technical reasoning:

1. Làm thế nào kích hoạt viewport-following tại 24px?
2. Làm thế nào preserve Sidebar's original document position?
3. Reverse Synchronization Boundary được xác định như thế nào?
4. Làm thế nào xử lý Sidebar height dynamic?
5. Làm thế nào xử lý Sidebar > available viewport?
6. Làm thế nào đảm bảo Main Content tiếp tục scroll?
7. Làm thế nào ngăn positional jump?
8. Làm thế nào đảm bảo scroll-down → scroll-up → return-to-top không bị drift?
9. Làm thế nào dùng chung cho AppShell Sidebar consumers?
10. Có cần page compatibility changes không?
11. Có thể reuse infrastructure hiện tại nào?
12. Có regression risk nào đối với Header/AppShell layout?

---

# 27. SoT Acceptance

SoT phase được xem là hoàn tất khi:

* [x] AppShell Sidebar ownership được xác định.
* [x] Active Left Sidebar consumers được xác định.
* [x] Right Sidebar capability boundary được xác định.
* [x] Community Right Sidebar được xác định là page-owned.
* [x] Existing Stock/Pricing sticky được xác định là page-owned.
* [x] Current scroll context được xác định.
* [x] Existing AppShell viewport-following gap được xác định.
* [x] 24px behavior được khóa ở capability level.
* [x] Bidirectional behavior được khóa.
* [x] Reverse Synchronization Boundary concept được khóa.
* [x] Original document position invariant được khóa.
* [x] Sidebar height requirement được khóa.
* [x] Main Content relationship được khóa.
* [x] Header relationship được khóa.
* [x] Page ownership boundary được khóa.
* [x] Responsive boundary được khóa.
* [x] Implementation mechanism chưa bị khóa.

---

# 28. Final SoT Statement

> **AppShell is the sole owner of shared Sidebar scroll behavior.**
>
> Current active AppShell Sidebar consumers are the **Left Sidebar on Thị trường and Nhà**. AppShell currently has **no active Right Sidebar consumer**. The **Community Right Sidebar, Stock sticky, and Pricing sticky are page-owned and are outside this AppShell capability scope**.
>
> The existing AppShell Sidebar participates in normal document scrolling and currently has no shared viewport-following capability.
>
> The target capability is a shared, geometry-aware Sidebar behavior with a **24px viewport-bottom activation threshold**, **delayed reverse-scroll synchronization**, preservation of the Sidebar's original document-relative position, and no positional drift or visible jump.
>
> **Implementation mechanism is intentionally not defined by this SoT and must be established by the Solution phase.**

---

# 29. Status

**SoT Status: READY FOR SOLUTION**

**Next Artifact:**

`04 - Solution — AppShell Sidebar Scroll Behavior.md`
