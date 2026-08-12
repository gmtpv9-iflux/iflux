# 01 — BRD — AppShell Architecture Standardization & Reuse Foundation

|                       |                                                                                 |
| --------------------- | ------------------------------------------------------------------------------- |
| **Task ID**           | **`100826_AppShell_Architecture_Standardization_Reuse_Foundation`**             |
| **Task Type**         | Foundation / Architecture Standardization                                       |
| **Priority**          | P0 — Foundational                                                               |
| **Status**            | **BRD — OWNER LOCKED**                                                          |
| **Governance**        | Business Requirement → Mandatory Audit → SoT → Solution → Plan → Implementation |
| **Downstream Task**   | `100826_AppShell_Sidebar_Scroll_Behavior`                                       |
| **Downstream Status** | **PENDING — blocked by this Foundation** (Audit Foundation COMPLETE 2026-08-10 · chờ SoT) |

---

# 1. Business Context

iFlux là một hệ thống được xây dựng với định hướng **reuse cao**.

Các Page trong hệ thống không nên tự xây dựng lại những capability có tính chất dùng chung. AppShell vì vậy phải được xem là một **shared system foundation**, không chỉ là một tập hợp UI components.

Các capability như:

* Header;
* Navigation;
* Sidebar;
* Main Content Region;
* Section;
* Widget Host;
* responsive shell behavior;
* lifecycle của shell;

có khả năng được sử dụng lại trên nhiều Page.

Khi hệ thống tiếp tục phát triển, việc mỗi Page/Feature tự tạo các cấu trúc tương đương AppShell sẽ làm phát sinh:

```text
Shared capability
        ↓
Multiple implementations
        ↓
Different ownership
        ↓
Different lifecycle
        ↓
Different responsive behavior
        ↓
Architecture drift
        ↓
Future optimization becomes fragmented
```

Do đó cần một Foundation Task để **xác lập AppShell Architecture thống nhất và có thể reuse** trước khi tiếp tục phát triển các capability AppShell riêng lẻ.

---

# 2. Problem Statement

Hiện tại chưa có một AppShell Architecture SoT đủ rõ ràng để xác định thống nhất:

1. AppShell thực sự bao gồm những gì.
2. Page nào đang sử dụng AppShell.
3. Một Page đang sử dụng bao nhiêu AppShell.
4. Mỗi AppShell có những Section nào.
5. Widget Host nằm ở Section nào.
6. Ownership của AppShell và từng Section.
7. Boundary giữa Page → AppShell → Section → Widget Host.
8. Page/Feature nào đang bypass AppShell.
9. Có cấu trúc nào thực chất mang semantic role của AppShell nhưng hiện không được hệ thống nhận diện/consume như AppShell hay không.
10. Mức độ tuân thủ AppShell Architecture của toàn bộ hệ thống hiện tại.

Nếu không chuẩn hóa, các task tương lai sẽ phải tự phát hiện lại architecture và có nguy cơ tạo thêm các implementation song song.

---

# 3. Business Objective

Thiết lập một **single, reusable and governed AppShell Architecture** làm Foundation cho toàn bộ AppShell capability hiện tại và tương lai.

Foundation phải:

* xác định canonical ownership;
* xác định composition boundary;
* xác định Section boundary;
* xác định Widget Host boundary;
* xác định consumer boundary;
* xác định lifecycle ownership;
* xác định responsive ownership;
* xác định reuse rules;
* xác định extension path;
* xác định mức độ compliance của toàn bộ Page trong hệ thống.

Mục tiêu cuối cùng:

> **Future AppShell capability phải được phát triển bằng cách reuse và extend canonical AppShell architecture, thay vì tạo thêm implementation tương đương ở Page hoặc Feature.**

---

# 4. Canonical Architecture Boundary

Task này sử dụng composition boundary sau làm **audit model**:

```text
Page
└── AppShell
    └── Section
        └── Widget Host
```

Đây là boundary để audit và xác định architecture.

**Widget nằm bên trong Widget Host không thuộc scope audit của Foundation này.**

Task chỉ cần xác định:

> Widget Host có tồn tại ở đâu, thuộc Section nào và boundary của nó có đúng hay không.

Không audit:

* từng Widget;
* Widget bật/tắt;
* Widget implementation;
* Widget internals;
* Widget lifecycle;
* Widget business logic.

---

# 5. Scope

## 5.1 AppShell Architecture

Audit và chuẩn hóa toàn bộ architecture liên quan trực tiếp đến AppShell.

Phải xác định:

* AppShell implementations;
* shell-like implementations;
* AppShell regions;
* Section implementations;
* Widget Host boundary;
* initialization;
* mounting;
* lifecycle;
* cleanup;
* responsive behavior;
* consumer boundary.

Không giới hạn việc tìm kiếm theo filename `app-shell`.

---

## 5.2 Full Page Surface Audit

Mandatory Audit **MUST audit toàn bộ Page surfaces trong hệ thống**.

Không được chỉ audit các Page đang gọi AppShell.

Audit phải bắt đầu từ:

```text
Page
```

sau đó xác định:

```text
Page
└── AppShell
    └── Section
        └── Widget Host
```

Mục tiêu là biết chính xác:

> **Toàn bộ hệ thống hiện đang tuân thủ AppShell Architecture như thế nào.**

---

# 6. Mandatory Page Inventory

Audit phải lập inventory của **tất cả Page surfaces** trong phạm vi hệ thống.

Mỗi Page tối thiểu phải xác định:

| Field                   | Requirement   |
| ----------------------- | ------------- |
| Page                    | Mandatory     |
| Route / URL             | Mandatory     |
| Page type               | Mandatory     |
| AppShell count          | Mandatory     |
| AppShell instance(s)    | Mandatory     |
| Sections                | Mandatory     |
| Widget Host location(s) | Mandatory     |
| Compliance status       | Mandatory     |
| Finding                 | Khi có vấn đề |

Không chấp nhận kết luận tổng quát nếu không có Page-level evidence.

---

# 7. AppShell Count Per Page

Với mỗi Page, Audit MUST trả lời:

> **Page này đang sử dụng bao nhiêu AppShell?**

Ví dụ:

```text
Page: Market
AppShell count: 1
```

hoặc:

```text
Page: X
AppShell count: 0
```

hoặc:

```text
Page: Y
AppShell count: 2
```

Nếu có nhiều shell-like structures phải phân biệt:

```text
Canonical AppShell
vs
Additional AppShell-like structure
```

Không được mặc định một wrapper là AppShell chỉ vì nó có kích thước hoặc vị trí tương tự.

---

# 8. AppShell Instance Inventory

Mỗi AppShell instance phải được truy xuất tới:

* location;
* implementation;
* owner;
* initialization path;
* lifecycle;
* Sections;
* Widget Hosts.

Architecture tree tối thiểu:

```text
Page
└── AppShell
    ├── Section A
    │   └── Widget Host
    │
    ├── Section B
    │   └── Widget Host
    │
    └── Section C
```

---

# 9. Section Inventory

Trong mỗi AppShell, Audit MUST xác định toàn bộ Section.

Ví dụ:

```text
Page
└── AppShell
    ├── Header
    ├── Navigation
    ├── Left Sidebar
    ├── Main Content
    └── Right Sidebar
```

Danh sách Section phải được xác định từ current implementation và semantic role thực tế.

Không được áp đặt trước rằng mọi AppShell phải có cùng số lượng Section.

---

# 10. Widget Host Inventory

Trong mỗi Section, Audit MUST xác định:

* Widget Host có tồn tại hay không;
* Widget Host nằm ở đâu;
* Section nào sở hữu Host;
* Host được tạo bởi layer nào;
* Host có tuân thủ canonical boundary hay không.

Ví dụ:

```text
Page
└── AppShell
    ├── Left Sidebar
    │   └── Widget Host
    │
    └── Main Content
        └── Widget Host
```

**Audit dừng tại Widget Host.**

Không cần inventory các Widget nằm bên trong Host.

---

# 11. Critical Rule — Current Implementation ≠ Canonical Architecture

Audit MUST phân biệt:

```text
Current implementation
```

và:

```text
Canonical architectural role
```

Việc một Page hiện đang tự render một structure **không đủ để kết luận structure đó là Page-owned**.

Ví dụ:

```text
Page
└── page-specific implementation
    └── sidebar-like structure
```

Audit phải xác định semantic role của structure đó.

Nếu structure thực chất có semantic responsibility thuộc AppShell nhưng hiện đang bypass canonical AppShell, phải ghi nhận:

```text
MISS
```

hoặc:

```text
PARTIAL / FAIL
```

tùy mức độ violation.

Không được che giấu architectural drift bằng cách coi current implementation là canonical ownership.

---

# 12. Compliance Classification

Mỗi Page phải được phân loại.

## PASS

Page tuân thủ AppShell Architecture và đúng ownership/boundary.

```text
Page
└── AppShell
    └── Section
        └── Widget Host
```

---

## MISS

Page có một hoặc nhiều cấu trúc mang semantic role của AppShell nhưng **không consume/identify canonical AppShell architecture**.

Ví dụ:

```text
Page
└── AppShell-like structure
    └── Section
        └── Widget Host
```

nhưng không sử dụng canonical AppShell.

`MISS` là trạng thái đặc biệt quan trọng để đo **architecture compliance**.

---

## PARTIAL

Page có AppShell nhưng một hoặc nhiều boundary chưa tuân thủ.

Ví dụ:

```text
Page
└── AppShell
    ├── Section A
    │   └── Widget Host ✓
    │
    └── Section B
        └── parallel local implementation ✗
```

---

## FAIL

Có architectural violation rõ ràng.

Ví dụ:

```text
Page
├── AppShell
└── Duplicate AppShell-like structure
```

hoặc một shared AppShell responsibility bị reimplemented rõ ràng ở Page/Feature.

---

## N/A

Chỉ sử dụng khi Page **thực sự không có semantic AppShell requirement**.

Không được dùng `N/A` chỉ vì Page hiện tại không gọi AppShell.

Phải có evidence.

---

# 13. Page Architecture Compliance Matrix

Mandatory Audit phải tạo một matrix:

| Page   | Route  | AppShell Count | Sections | Widget Hosts | Status  | Finding                        |
| ------ | ------ | -------------: | -------- | ------------ | ------- | ------------------------------ |
| Page A | `/...` |              1 | ...      | ...          | PASS    | —                              |
| Page B | `/...` |              1 | ...      | ...          | PARTIAL | ...                            |
| Page C | `/...` |              0 | ...      | ...          | MISS    | AppShell-like structure bypass |
| Page D | `/...` |              0 | ...      | ...          | N/A     | ...                            |

**Tất cả số liệu phải là evidence-derived.**

---

# 14. Full-System Compliance Baseline

Audit phải tổng hợp:

```text
Total Pages
Pages with AppShell
Pages without AppShell
Pages with AppShell-like structures
PASS
PARTIAL
MISS
FAIL
N/A
```

Đồng thời phải chỉ ra:

> Có bao nhiêu Page đang có cấu trúc mang semantic role AppShell nhưng chưa tuân thủ canonical AppShell.

Mục đích là tạo **baseline compliance** cho toàn hệ thống.

---

# 15. Architecture Violation Register

Mỗi Page có `MISS`, `PARTIAL` hoặc `FAIL` phải có finding riêng.

Mỗi finding tối thiểu:

| Field                 | Requirement |
| --------------------- | ----------- |
| Finding ID            | Mandatory   |
| Page                  | Mandatory   |
| Route                 | Mandatory   |
| Current Structure     | Mandatory   |
| Expected Architecture | Mandatory   |
| Actual Owner          | Mandatory   |
| Canonical Owner       | Mandatory   |
| Section               | Mandatory   |
| Widget Host           | Mandatory   |
| Status                | Mandatory   |
| Evidence              | Mandatory   |
| Risk                  | Mandatory   |

---

# 16. Cross-Page Consistency

Audit không chỉ kiểm tra từng Page độc lập.

Phải so sánh các Page có cùng semantic shell structures.

Ví dụ:

```text
Market
Home
Community
Dashboard
...
```

Nếu cùng có một semantic region nhưng implementation khác nhau:

```text
Page A → AppShell Section
Page B → Page-local implementation
Page C → Feature-local implementation
```

phải ghi nhận **architecture drift**.

Mục tiêu là phát hiện:

> Cùng một capability nhưng đang có nhiều ownership hoặc implementation boundary khác nhau.

---

# 17. Ownership Requirement

Mỗi shared AppShell capability phải có **single authoritative owner**.

Không được tồn tại:

```text
Capability X
├── AppShell implementation
├── Page implementation
└── Feature implementation
```

nếu cả ba cùng có semantic responsibility.

Mỗi capability phải được phân loại:

```text
APP SHELL OWNED
PAGE OWNED
FEATURE / WIDGET OWNED
PLATFORM / FOUNDATION OWNED
```

Ownership phải được xác định bằng Audit + SoT.

---

# 18. Composition Boundary Requirement

SoT phải xác định rõ boundary:

```text
Page
    ↓
AppShell
    ↓
Section
    ↓
Widget Host
```

Phải trả lời:

* AppShell owns gì?
* Section owns gì?
* Widget Host thuộc layer nào?
* Page được phép đưa content vào đâu?
* Feature được phép tương tác với AppShell tới mức nào?
* Những gì Page/Feature không được tự reimplement?

---

# 19. Widget Host Boundary

Widget Host là **architectural boundary cuối cùng của task này**.

SoT phải xác định:

* Widget Host thuộc AppShell hay layer khác;
* Widget Host được đặt trong Section nào;
* ai owns Host;
* Page/Feature có được tự tạo Host hay không;
* khi nào một Host implementation là valid;
* khi nào một local Host là architectural bypass.

Không audit nội dung bên trong Widget Host.

---

# 20. Lifecycle Requirement

AppShell architecture phải có lifecycle boundary rõ ràng cho:

* initial page load;
* AppShell initialization;
* Section mounting;
* Widget Host mounting;
* soft navigation;
* consumer replacement;
* unmount;
* cleanup;
* re-entry;
* responsive state changes.

Không được để mỗi Page tự quản lý một phần AppShell lifecycle mà không có contract chung.

---

# 21. Responsive Ownership

Responsive behavior của AppShell phải có ownership rõ ràng.

Phải xác định:

* breakpoint responsibility;
* Section visibility;
* Section collapse;
* layout transition;
* mobile shell behavior;
* consumer behavior khi AppShell thay đổi.

Page/Feature không được tự phá AppShell responsive contract.

---

# 22. Reuse Requirement

Shared AppShell capability phải được reuse thông qua canonical contract.

Future consumer:

```text
Future Page
    ↓
Canonical AppShell
    ↓
Canonical Section
    ↓
Widget Host
```

không được tạo:

```text
Future Page
    ↓
Local AppShell-like implementation
```

nếu capability đó đã thuộc AppShell SoT.

---

# 23. Extension Requirement

Khi phát sinh capability mới có semantic thuộc AppShell, phải có một extension path rõ ràng:

```text
New Requirement
        ↓
Existing AppShell capability
        ↓
Existing contract / extension point
        ↓
New consumer
```

Không mặc định tạo implementation mới tại Page.

---

# 24. Out of Scope

Task này **không trực tiếp implementation**:

* Sidebar Scroll Behavior;
* Header persistence;
* Navigation optimization;
* Responsive redesign;
* Widget redesign;
* Widget internals;
* Widget business logic;
* Widget on/off state;
* Page business logic;
* visual redesign toàn hệ thống.

Task cũng không bắt buộc migrate toàn bộ Page ngay trong Foundation nếu migration cần downstream tasks riêng.

Tuy nhiên mọi deviation phải được **inventory + classify** để không bị mất khỏi architecture baseline.

---

# 25. Relationship With Sidebar Scroll Task

Task:

`100826_AppShell_Sidebar_Scroll_Behavior`

được đặt ở trạng thái:

> **PENDING — BLOCKED BY APP SHELL FOUNDATION**

Foundation phải khóa trước:

* Sidebar ownership;
* Left/Right Sidebar architecture;
* Section boundary;
* Widget Host boundary;
* consumer contract;
* lifecycle;
* responsive ownership.

Sau khi Foundation SoT được lock, Sidebar Scroll Behavior mới tiếp tục Solution/Plan theo SoT.

---

# 26. Mandatory Audit Deliverables

Mandatory Audit MUST produce:

### A — Full Page Inventory

Toàn bộ Page surfaces.

### B — Page Architecture Tree

Cho từng Page:

```text
Page
└── AppShell
    └── Section
        └── Widget Host
```

### C — AppShell Inventory

Mỗi Page có bao nhiêu AppShell.

### D — Section Inventory

Mỗi AppShell có những Section nào.

### E — Widget Host Inventory

Widget Host nằm tại Section nào.

### F — Compliance Matrix

```text
PASS
PARTIAL
MISS
FAIL
N/A
```

### G — Architecture Violation Register

Toàn bộ MISS / PARTIAL / FAIL.

### H — Cross-Page Consistency Findings

Các shared semantic regions đang có nhiều implementation/ownership khác nhau.

### I — Full-System Compliance Baseline

Tỷ lệ và số lượng Page theo từng compliance status.

---

# 27. Required SoT Outcomes

Sau Mandatory Audit, SoT phải khóa:

## 27.1 AppShell Ownership

Canonical responsibility của AppShell.

## 27.2 Section Ownership

Canonical ownership của từng Section.

## 27.3 Widget Host Boundary

Canonical boundary tới Widget Host.

## 27.4 Page Consumer Contract

Page consume AppShell như thế nào.

## 27.5 Lifecycle Ownership

Ai owns lifecycle.

## 27.6 Responsive Ownership

Ai owns responsive behavior.

## 27.7 Reuse Contract

Capability được reuse thế nào.

## 27.8 Extension Contract

Future capability được extend thế nào.

## 27.9 Compliance Baseline

Toàn bộ Page được classify theo:

```text
PASS
PARTIAL
MISS
FAIL
N/A
```

---

# 28. Acceptance Criteria

## AC-01 — Full Page Inventory

**PASS khi:**

Toàn bộ Page surfaces trong scope đã được inventory và có evidence.

---

## AC-02 — AppShell Count

**PASS khi:**

Mỗi Page đều có AppShell count rõ ràng.

---

## AC-03 — Section Mapping

**PASS khi:**

Mỗi AppShell instance đều có Section inventory.

---

## AC-04 — Widget Host Mapping

**PASS khi:**

Mỗi Section có Widget Host location rõ ràng nếu tồn tại.

Audit dừng tại Widget Host.

---

## AC-05 — Architecture Compliance

**PASS khi:**

Mỗi Page được classify:

```text
PASS / PARTIAL / MISS / FAIL / N/A
```

với evidence.

---

## AC-06 — AppShell-like MISS Detection

**PASS khi:**

Các Page có cấu trúc mang semantic role AppShell nhưng không consume canonical AppShell được phát hiện và classify.

---

## AC-07 — Ownership

**PASS khi:**

Mỗi shared AppShell capability có canonical owner.

---

## AC-08 — Composition Boundary

**PASS khi:**

Boundary:

```text
Page
→ AppShell
→ Section
→ Widget Host
```

được xác định rõ trong SoT.

---

## AC-09 — Cross-Page Consistency

**PASS khi:**

Các shared semantic regions có nhiều implementation/ownership được phát hiện và ghi nhận.

---

## AC-10 — Lifecycle

**PASS khi:**

AppShell/Section/Widget Host lifecycle ownership rõ ràng.

---

## AC-11 — Reuse / Extension

**PASS khi:**

Future consumer có canonical path để reuse/extend AppShell.

---

## AC-12 — Downstream Readiness

**PASS khi:**

Các AppShell capability tasks trong tương lai không cần tự audit lại ownership/composition architecture từ đầu.

---

# 29. Non-Functional Requirements

### NFR-01 — Consistency

AppShell architecture phải nhất quán giữa các Page.

### NFR-02 — Reusability

Shared capability phải có canonical reuse path.

### NFR-03 — Maintainability

Không tạo parallel implementation cho shared responsibility.

### NFR-04 — Extensibility

Có extension path rõ ràng cho future capability.

### NFR-05 — Lifecycle Safety

Không tạo duplicate/stale shell runtime ownership.

### NFR-06 — Responsive Consistency

Shared shell behavior nhất quán giữa các responsive states.

### NFR-07 — Traceability

Mọi architecture decision phải trace được:

```text
BRD
 ↓
Audit Evidence
 ↓
SoT Decision
 ↓
Solution
 ↓
Plan
 ↓
Implementation
```

---

# 30. Governance Rules

Task MUST tuân thủ:

```text
BRD
  ↓
Mandatory Audit
  ↓
SoT
  ↓
Solution
  ↓
Plan
  ↓
Implementation
```

Không được:

* code trước Audit;
* quyết định ownership chỉ dựa trên filename;
* quyết định ownership chỉ dựa trên current renderer;
* tự promote một Page implementation thành canonical AppShell;
* bỏ qua Page chỉ vì hiện tại Page không gọi AppShell;
* coi Widget là scope audit;
* refactor hàng loạt trước khi SoT lock.

Phải:

* audit toàn bộ Page;
* map Page → AppShell → Section → Widget Host;
* phân biệt current implementation và canonical role;
* phát hiện AppShell-like structures;
* classify compliance;
* khóa ownership bằng SoT;
* xác định reuse và extension contract.

---

# 31. Governance Traceability

```text
Business Problem
│
├── System has high reuse requirement
├── AppShell is shared system foundation
├── Multiple Page consumers exist
├── Some AppShell-like structures may bypass canonical architecture
└── Future optimization requires architectural consistency
│
▼
BRD
│
├── Standardize AppShell Architecture
├── Audit EVERY Page
├── Map AppShell
├── Map Sections
├── Map Widget Hosts
├── Detect MISS
└── Establish compliance baseline
│
▼
Mandatory Audit
│
├── Full Page Inventory
├── Page → AppShell
├── AppShell → Section
├── Section → Widget Host
├── Ownership
├── Bypass detection
├── Cross-page consistency
└── Compliance classification
│
▼
SoT
│
├── Canonical AppShell
├── Canonical Sections
├── Widget Host boundary
├── Page consumer contract
├── Lifecycle
├── Responsive ownership
└── Compliance baseline
│
▼
Solution
│
└── Architecture convergence
│
▼
Plan
│
└── Migration / implementation sequence
```

---

# 32. Definition of Done

Task chỉ được coi là **Foundation Complete** khi:

* [ ] Full Page Inventory complete.
* [ ] Mỗi Page có AppShell count.
* [ ] Mỗi AppShell có Section inventory.
* [ ] Mỗi Section có Widget Host mapping nếu có.
* [ ] Audit dừng tại Widget Host.
* [ ] Không audit Widget internals.
* [ ] AppShell-like structures được phát hiện.
* [ ] MISS được phân biệt rõ.
* [ ] PARTIAL / FAIL được ghi nhận.
* [ ] Cross-page architecture drift được xác định.
* [ ] Canonical AppShell ownership được khóa.
* [ ] Section ownership được khóa.
* [ ] Widget Host boundary được khóa.
* [ ] Page consumer contract được khóa.
* [ ] Lifecycle ownership được khóa.
* [ ] Responsive ownership được khóa.
* [ ] Reuse contract được khóa.
* [ ] Extension contract được khóa.
* [ ] Full-system AppShell compliance baseline được thiết lập.
* [ ] SoT được lock.
* [ ] Downstream AppShell tasks có thể reference Foundation SoT mà không phải audit lại architecture từ đầu.

---

# 33. Final Business Requirement

> **iFlux SHALL establish a single, reusable and governed AppShell Architecture as a shared system foundation.**
>
> **The system SHALL be audited Page-by-Page to determine, with evidence, which AppShell instances each Page uses, which Sections exist within each AppShell, and where the Widget Host boundary exists.**
>
> **The audit SHALL distinguish current implementation from canonical architectural ownership and SHALL identify Pages where an AppShell-semantic structure exists but the Page does not currently consume or identify it as the canonical AppShell architecture. Such cases SHALL be explicitly classified as architecture compliance findings, including MISS where applicable.**
>
> **The audit SHALL establish a full-system compliance baseline using PASS, PARTIAL, MISS, FAIL and N/A classifications.**
>
> **The AppShell Foundation SHALL define canonical ownership, Page → AppShell → Section → Widget Host composition boundaries, lifecycle ownership, responsive ownership, reuse rules and extension paths.**
>
> **Widget internals and Widget-level behavior are outside the scope of this Foundation audit; the architectural audit boundary ends at Widget Host.**
>
> **The resulting AppShell SoT SHALL become the mandatory architectural foundation for future AppShell optimization, reuse and capability development, preventing future consumers from creating parallel implementations for shared AppShell responsibilities.**
