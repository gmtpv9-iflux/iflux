# 03 — SoT — AppShell Architecture Standardization & Reuse Foundation

|                 |                                                                                      |
| --------------- | ------------------------------------------------------------------------------------ |
| **Task ID**     | `100826_AppShell_Architecture_Standardization_Reuse_Foundation`                      |
| **Document**    | System of Truth — AppShell Architecture                                              |
| **Status**      | 🔒 **OWNER LOCKED — USER WEB** (governance patch AC/VR/Scope 2026-08-10)             |
| **Authority**   | BRD + Mandatory Audit + **Owner Scope Decision** (§1.3)                              |
| **Scope**       | **User Web only** — xem §1.3                                                         |
| **Admin**       | **OUT OF SCOPE — governed separately** (Owner clarification, không phải Solution override) |
| **Audit Input** | [`02 - Audit.md`](02%20-%20Audit.md)                                                 |
| **Next**        | Solution → Plan → Implementation                                                     |
| **Downstream**  | `100826_AppShell_Sidebar_Scroll_Behavior`                                            |
| **Governance**  | BRD → Mandatory Audit → SoT → Solution → Plan → Implementation                       |

---

# 0. Purpose

Document này là **System of Truth duy nhất** cho AppShell Architecture của **User Web** sau Mandatory Audit.

SoT này khóa:

* canonical AppShell;
* AppShell Sections;
* Page → AppShell composition;
* Section → Widget Host boundary;
* ownership;
* lifecycle boundary;
* reuse rules;
* extension rules;
* architecture convergence rules;
* Widget Host preservation rules;
* compliance interpretation;
* downstream consumption contract.

SoT này **không phải Solution**.

Không quyết định:

* DOM migration cụ thể;
* file nào sửa trước;
* code implementation;
* migration sequence;
* CSS implementation;
* Sidebar scroll algorithm.

Các quyết định đó thuộc **Solution / Plan** và MUST tuân thủ SoT này.

---

# 1. Authority Scope

## 1.1 In Scope

```text
User Web
└── Page
    └── AppShell
        └── Section
            └── Widget Host
```

SoT này áp dụng cho toàn bộ User Web Page surfaces được Mandatory Audit inventory.

---

## 1.2 Out of Scope

Admin AppShell:

```text
Admin
└── ix-sidebar / ix-navbar / iflux-admin-app-shell*
```

**không thuộc SoT này.**

Admin sẽ có Foundation / SoT riêng khi được yêu cầu.

Không được dùng User Web AppShell SoT này để ép Admin reuse implementation.

---

## 1.3 Owner Scope Decision (LOCK)

BRD yêu cầu inventory / chuẩn hóa AppShell architecture trên Page surfaces của hệ thống. Mandatory Audit đã xác nhận:

```text
User Web AppShell  ≠  Admin AppShell stack
```

**Owner Scope Decision:**

> Foundation convergence trong task này **chỉ áp dụng User Web**.  
> Admin AppShell được xác nhận là một shell stack riêng trong Audit và sẽ được quản trị bằng **task/SoT riêng**.  
> Quyết định này là **scope clarification của Owner**, **không** phải Solution override BRD.

Trace:

```text
BRD
 ↓
Audit phát hiện User Web ≠ Admin
 ↓
Owner Scope Decision (this §)
 ↓
SoT = User Web
 ↓
Admin = separate governance
```

---

# 2. Canonical Architecture

User Web AppShell canonical composition là:

```text
Page
└── AppShell
    ├── Header / Navigation
    ├── Left Sidebar       [optional]
    ├── Main Content       [required]
    ├── Right Sidebar      [optional]
    └── other canonical shell regions
```

Trong từng Section:

```text
AppShell
└── Section
    └── Widget Host
```

**Widget Host là architectural boundary cuối cùng của Foundation này.**

Widget bên trong Widget Host không thuộc SoT scope.

---

# 3. Canonical AppShell

Canonical User Web AppShell hiện tại được xác định bởi shared shell architecture đã được Audit evidence:

```text
.ifx-app
├── header.ifx-topnav
└── main.ifx-main
```

với runtime shell lifecycle:

```text
bootShell
├── Header / Navigation
├── GuestShell where applicable
└── AppShell runtime integration
```

Các canonical shell components hiện được evidence trong:

* `app-shell.css`
* `runtime/app-shell.js`
* `runtime/shell-boot.js`
* `runtime/bootstrap.js`
* `runtime/page-runtime.js`
* `page-layout-engine.js`
* Header API
* GuestShell
* Soft Navigation
* Widget loader
* Mobile Tabbar

**Implementation details không được xem là architecture contract nếu không được SoT này hoặc downstream Solution xác nhận.**

---

# 4. Canonical AppShell Ownership

AppShell owns **shared shell responsibilities**.

Bao gồm semantic responsibility cho:

* Header;
* Navigation;
* Main shell boundary;
* Sidebar Sections khi SoT xác định Sidebar đó là AppShell capability;
* shell-level responsive behavior;
* shell lifecycle;
* shell-to-page consumer contract.

AppShell **không automatically own every visual column or aside**.

Ownership phải dựa trên **semantic responsibility**, không dựa trên:

* filename;
* CSS class;
* DOM location;
* current implementation;
* việc Page hiện đang render nó.

---

# 5. Current Canonical Sections

Mandatory Audit xác nhận các Section semantic hiện có:

| Section       | Current status                               | SoT                                                |
| ------------- | -------------------------------------------- | -------------------------------------------------- |
| Header        | Canonical                                    | **APP SHELL OWNED**                                |
| Navigation    | Inside Header                                | **APP SHELL OWNED**                                |
| Main Content  | Canonical                                    | **APP SHELL OWNED**                                |
| Left Sidebar  | Canonical consumer hiện chỉ Home/Market      | **APP SHELL CAPABILITY**                           |
| Right Sidebar | API tồn tại nhưng chưa có canonical consumer | **APP SHELL CAPABILITY — consumer chưa chuẩn hóa** |
| Footer        | Reserved nhưng chưa render User Web          | **Reserved — not active**                          |
| Mobile Tabbar | Shared shell/UI behavior                     | **APP SHELL OWNED**                                |

---

# 6. Main Content

`Main Content` là canonical AppShell region.

Canonical boundary:

```text
Page
└── AppShell
    └── Main
        └── Page Content / Widget Host
```

Page được phép cung cấp business/content composition bên trong Main.

Page không được tạo một AppShell thay thế bên trong Main.

---

# 7. Left Sidebar

Left Sidebar là **AppShell capability**, không phải mặc định Page-owned.

Current canonical implementation được Audit xác nhận tại:

```text
home
market
    ↓
ensureSections('sidebar')
```

Tuy nhiên:

> Việc hiện tại chỉ Home/Market consume canonical Left Sidebar **không có nghĩa các Left Sidebar semantic khác mặc định là Page-owned.**

Các structure như:

* Flow Left Sidebar;
* Entity List Left Sidebar;
* Stock/Group sidebar/column;
* các tương lai tương đương;

MUST được đánh giá theo semantic role.

Nếu SoT/Solution xác định structure là shared AppShell Sidebar capability:

```text
Page
└── AppShell
    └── Left Sidebar
        └── Widget Host
```

phải là canonical target architecture.

---

# 8. Right Sidebar

Right Sidebar được xác định là **AppShell capability**.

Evidence:

```text
ensureSections('sidebar-right')
```

đã tồn tại trong canonical AppShell Section API.

Tuy nhiên Audit xác nhận:

> **Không có Page hiện tại consume Right Sidebar thông qua canonical AppShell Section API.**

Do đó:

```text
Right Sidebar
= Canonical AppShell capability
= Current consumer GAP
```

Community hiện có:

```text
Community
└── Main
    └── page-owned / bypass sidebar-right   ← MISS consumer
```

không được coi là canonical chỉ vì current implementation đang nằm trong Community.

**SoT lock (WHAT):**

> **Right Sidebar là canonical AppShell capability.**  
> Community Right Sidebar là **current MISS consumer** của capability đó.  
> **Solution MUST define convergence HOW** (đưa consumer về canonical AppShell Section → Widget Host) — không được reopen câu hỏi “Right Sidebar có thuộc AppShell không?”.

---

# 9. Section Semantic Ownership Rule

Một structure được xem là AppShell Section nếu nó mang **shared shell semantic responsibility**.

Không được xác định ownership bằng:

```text
filename
CSS class
current parent
current renderer
current page
```

Thay vào đó phải xét:

1. Semantic role.
2. Shared responsibility.
3. Cross-page reuse potential.
4. Shell lifecycle responsibility.
5. Responsive shell responsibility.
6. Whether the capability logically belongs to the Page or Shell.

---

# 10. AppShell-Like Structure Rule

Nếu Audit phát hiện:

```text
Page
└── AppShell
    └── Main
        └── AppShell-like Sidebar / Region
```

thì structure đó **không được silently accept là Page-owned**.

Nó MUST được classify:

```text
Canonical AppShell
or
MISS-structure
or
Officially Page-owned
```

Quyết định phải được traceable.

---

# 11. Architecture Convergence

Đây là **mandatory requirement** của Foundation.

Mọi `MISS-structure` được SoT xác định là AppShell semantic:

```text
Current
Page
└── AppShell
    └── Main
        └── local AppShell-like Section
```

phải có canonical target:

```text
Target
Page
└── AppShell
    └── Section
        └── Widget Host
```

Mục tiêu của convergence là:

> **Đưa shell responsibility về đúng AppShell ownership mà không phá content/Widget Host contract.**

---

# 12. MISS Classification

`MISS` có hai cấp:

## 12.1 Page-level MISS

Chỉ dùng khi toàn bộ relevant Page không có Canonical AppShell.

Audit hiện tại:

```text
Whole-page MISS = 0
```

---

## 12.2 Structure-level MISS

Dùng khi Page có Canonical AppShell nhưng bên trong vẫn tồn tại AppShell-semantic structure bypass.

Audit hiện tại:

```text
VR-01
VR-02
VR-03
VR-04
```

là các ví dụ quan trọng.

Do đó:

```text
Page = PARTIAL
Structure = MISS
```

là classification hợp lệ.

---

# 13. Current Violation Baseline

Mandatory Audit đã xác định VR baseline. SoT khóa **classification boundary** (WHAT / semantic assessment) — **không** khóa HOW migrate.

## 13.1 VR-01…VR-06 — Semantic assessment (LOCKED boundary)

| VR | Structure | Semantic assessment | SoT status | Solution |
| --- | --- | --- | --- | --- |
| **VR-01** | Flow Left Sidebar | **AppShell candidate** | Requires convergence decision | **HOW TBD** |
| **VR-02** | Community Right Sidebar | **AppShell semantic candidate** (capability Right Sidebar đã LOCK §8) | Requires convergence | **HOW TBD** |
| **VR-03** | Entity List Sidebar/Main | **AppShell semantic candidate** | Requires convergence decision | **HOW TBD** |
| **VR-04** | Stock/Group columns | Ownership requires semantic classification | **Open architectural classification** | TBD |
| **VR-05** | Account profile sidebar | Ownership requires semantic classification | **Open architectural classification** | TBD |
| **VR-06** | Checkout summary | Ownership requires semantic classification | **Open architectural classification** | TBD |

**Ranh giới WHAT / HOW:**

```text
SoT  = Cái gì thuộc AppShell capability / candidate / còn mở classification?
Solution = Đưa về AppShell (hoặc khóa Page-owned) bằng cách nào?
```

- VR-01…VR-03: SoT đã gắn **AppShell (semantic) candidate** → Solution **không** được bỏ qua; phải quyết định convergence path (HOW).
- VR-02: Right Sidebar capability đã khóa AppShell → Community = MISS **consumer**; Solution chỉ định nghĩa **HOW** converge.
- VR-04…VR-06: SoT **chưa** khóa kết quả APP_SHELL vs PAGE_OWNED → Solution **phải** hoàn tất architectural classification trước khi migrate; không giả vờ ownership đã xong.

## 13.2 VR-07…VR-10 — Findings / contracts

| ID | Structure | Current status | SoT treatment |
| --- | --- | --- | --- |
| VR-07 | SHELL_ONLY feature hosts | PARTIAL | Define consumer contract |
| VR-08 | Soft-nav allowlist | FINDING | Lifecycle/extension concern |
| VR-09 | Admin/User split | FINDING | **Out of scope** — Owner Scope Decision §1.3 |
| VR-10 | Right Sidebar API | FINDING | Capability exists; consumer GAP (xem §8 · VR-02) |

**Important:**

Không phải mọi VR đều tự động migrate ngay.  
Solution MUST tuân thủ bảng §13.1: candidate → convergence HOW; open classification → classify trước.

---

# 14. Widget Host Boundary

Widget Host là **preservation boundary**.

Canonical architecture:

```text
Page
└── AppShell
    └── Section
        └── Widget Host
            └── [Widget internals — OUT OF SCOPE]
```

Foundation không audit hoặc refactor:

* Widget internals;
* Widget implementation;
* Widget business logic;
* Widget configuration;
* Widget rendering internals.

---

# 15. Widget Host Preservation Principle

### MUST NOT break existing Widget Host behavior.

Khi converge một MISS-structure:

```text
Before
Page
└── local Section
    └── Existing Widget Host
```

target phải hướng tới:

```text
After
Page
└── AppShell
    └── Canonical Section
        └── Existing Widget Host
```

**Widget Host phải được preserve về contract và behavior.**

Không được tự ý:

* rewrite Widget Host;
* thay đổi Widget implementation;
* thay đổi Widget data contract;
* thay đổi Widget configuration;
* thay đổi Widget state model;
* thay đổi Widget lifecycle;
* thay đổi Widget business logic.

---

# 16. Widget Host Identity Preservation

Trong migration, Solution phải ưu tiên preserve:

* Host identity;
* Host mount contract;
* Host selector;
* `data-*` contract;
* required DOM attributes;
* mount target;
* initialization path;
* teardown path;
* Layout Engine integration;
* Widget loader integration.

Nếu một trong các thành phần này bắt buộc phải thay đổi:

> Solution MUST explicitly document why the change is necessary and prove no unintended Widget regression.

---

# 17. Widget Host Regression Boundary

Architecture convergence MUST verify:

```text
Before → After
```

về:

| Dimension                 | Requirement                |
| ------------------------- | -------------------------- |
| Host existence            | Preserved                  |
| Host mount                | Preserved                  |
| Host configuration        | Preserved                  |
| Widget initialization     | Preserved                  |
| Widget teardown           | Preserved                  |
| Widget state              | Preserved where applicable |
| Data flow                 | Preserved                  |
| Layout Engine integration | Preserved                  |
| Responsive behavior       | No unintended regression   |
| Soft navigation           | No unintended regression   |

---

# 18. AppShell Does Not Own Widget Internals

AppShell owns:

```text
Section
└── Widget Host
```

AppShell does **not** own:

```text
Widget Host
└── Widget internals
```

This boundary prevents Foundation scope creep.

---

# 19. Lifecycle Ownership

Canonical lifecycle boundary:

```text
Page
 ↓
AppShell lifecycle
 ↓
Section lifecycle
 ↓
Widget Host lifecycle
 ↓
Widget lifecycle
```

AppShell/Section migration MUST NOT accidentally create:

```text
double init
double mount
double teardown
stale host
duplicate listeners
duplicate subscriptions
```

Current implementation has split lifecycle paths:

```text
bootPage
feature boot
Layout Engine
widget-loader
soft-navigation
```

Therefore Solution MUST explicitly account for lifecycle ownership before migration.

---

# 20. Soft Navigation Rule

AppShell should remain stable across supported soft navigation where current architecture intends shell persistence.

Page-specific content MUST remain independently lifecycle-managed.

Target principle:

```text
AppShell
    ↓
stable
    │
    ├── Page A content
    │       ↓
    │    teardown
    │
    └── Page B content
            ↓
         mount
```

A Section migration MUST NOT accidentally turn page-specific Widget Hosts into shell-persistent state unless explicitly specified by a downstream Solution.

---

# 21. Responsive Ownership

AppShell owns responsive behavior of AppShell regions.

Page owns responsive behavior of genuinely Page-specific content.

For a Section promoted into AppShell:

```text
AppShell-owned Section
        ↓
AppShell responsive contract
```

must be used.

Page CSS MUST NOT continue to independently redefine the same shell semantic responsibility after convergence unless explicitly justified.

---

# 22. CSS / DOM Preservation Principle

Architecture convergence MUST distinguish:

```text
Structural ownership change
```

from:

```text
Visual redesign
```

The Foundation objective is the first.

Therefore:

> **Do not redesign visual behavior merely because a structure is being promoted into AppShell.**

Existing visual behavior should be preserved unless it conflicts with canonical AppShell contract.

---

# 23. Risk-Control Requirement

Every MISS selected for convergence MUST have a migration risk assessment.

Minimum dimensions:

```text
Widget Host risk
DOM risk
CSS cascade risk
Layout Engine risk
Lifecycle risk
Soft-navigation risk
Responsive risk
State preservation risk
```

Risk level:

```text
LOW
MEDIUM
HIGH
```

High-risk migration MUST have explicit verification criteria before implementation.

---

# 24. Migration Principle

Migration MUST follow:

```text
Detect
 ↓
Classify semantic ownership
 ↓
Define canonical target
 ↓
Assess risks
 ↓
Preserve Widget Host
 ↓
Converge shell structure
 ↓
Verify behavior
```

Not:

```text
Detect MISS
 ↓
Move DOM immediately
```

---

# 25. Page Consumer Contract

A Page consumes AppShell.

A Page does not own shared AppShell responsibilities.

Canonical:

```text
Page
    ↓
consume
AppShell
    ↓
provide
Sections
    ↓
provide
Widget Host boundaries
```

Page may provide:

* page content;
* page-specific configuration;
* page-specific Widget content;
* page-specific business logic.

Page MUST NOT create a parallel AppShell implementation for an already governed shared capability.

---

# 26. Reuse Rule

Once a capability is classified as AppShell-owned:

> **All future Pages MUST consume the canonical AppShell capability.**

Forbidden pattern:

```text
Existing AppShell Sidebar
+
New Page-specific Sidebar
```

when both implement the same semantic responsibility.

---

# 27. Extension Rule

Future AppShell capability MUST follow:

```text
New requirement
 ↓
Check existing AppShell capability
 ↓
Reuse existing contract
 ↓
Extend canonical AppShell if required
 ↓
Expose to Page
```

Only if the capability is proven Page-specific may it remain Page-owned.

---

# 28. No Silent Architecture Drift

Future implementation MUST NOT introduce:

```text
Page
└── local copy of AppShell capability
```

without explicit architecture decision.

Any new shell-like structure MUST be:

```text
APP SHELL
PAGE OWNED
FEATURE OWNED
```

and traceable to SoT/Solution.

---

# 29. Compliance Baseline

Current User Web baseline from Mandatory Audit:

```text
Canonical AppShell chrome: 25 runtime surfaces

PASS:       9
PARTIAL:   16
Whole-page MISS: 0
FAIL:       0
N/A:        4+
```

Structure-level MISS exists inside PARTIAL pages.

Known high-severity architecture drift:

```text
VR-01
VR-02
VR-03
VR-04
```

This baseline is the starting point for Foundation convergence.

---

# 30. Definition of Architectural Compliance

A Page is **PASS** when:

```text
Page
└── Canonical AppShell
    ├── Canonical Sections
    │   └── Widget Host
    └── No ungoverned AppShell-semantic duplicate
```

A Page is **PARTIAL** when:

```text
Canonical AppShell
+
one or more unresolved deviations
```

A structure is **MISS** when:

```text
AppShell-semantic responsibility
        ↓
exists outside canonical AppShell boundary
```

A Page is **FAIL** when there is a direct architectural conflict, duplicate canonical shell, or equivalent severe violation.

---

# 31. Solution Constraints

The future Solution MUST:

1. Use this SoT as architecture authority.
2. Use Audit evidence as current-state baseline.
3. Resolve each confirmed AppShell-semantic MISS.
4. Not blindly migrate every Page-local sidebar/column.
5. Preserve Widget Host contract.
6. Preserve Widget behavior.
7. Explicitly assess migration risk.
8. Explicitly identify structural changes.
9. Avoid unnecessary visual redesign.
10. Avoid creating another AppShell implementation.
11. Maintain lifecycle correctness.
12. Maintain soft-navigation correctness.
13. Maintain responsive correctness.

---

# 32. Downstream Sidebar Scroll Contract

`100826_AppShell_Sidebar_Scroll_Behavior` remains:

> **PENDING — blocked until Foundation convergence/SoT is sufficiently locked.**

When resumed, it MUST apply only to Sidebar Sections that this SoT/Solution identifies as:

```text
AppShell-owned Sidebar
```

It MUST NOT assume that every current Page sidebar is automatically an AppShell Sidebar.

Therefore:

```text
Sidebar Scroll
       ↓
AppShell Sidebar SoT
       ↓
canonical Section
       ↓
scroll behavior
```

---

# 33. Traceability Matrix (AC → Audit → SoT)

> Product Backlogs Governance: mỗi AC (atomic acceptance của BRD Foundation) phải có hàng riêng.  
> BRD task này dùng **AC-01…AC-12** làm khóa traceability (không có bảng BR-xx riêng).

| AC | BRD meaning (tóm tắt) | Audit Evidence | SoT Section | Status |
| --- | --- | --- | --- | --- |
| **AC-01** | Full Page Inventory | Audit §2–3 | §1 · §2 · §3 · §29 | **LOCKED** |
| **AC-02** | AppShell count per Page | Audit §3–4 | §3 · §29 | **LOCKED** |
| **AC-03** | Section mapping | Audit §3.4 · §5 | §5 · §6 · §7 · §8 | **LOCKED** |
| **AC-04** | Widget Host mapping (stop at host) | Audit §3.5 | §14 · §15 · §16 · §17 · §18 | **LOCKED** |
| **AC-05** | Architecture compliance classify | Audit §4 · §7 | §12 · §29 · §30 | **LOCKED** |
| **AC-06** | AppShell-like MISS detection | Audit §5 VR · §6 | §10 · §11 · §12 · §13 | **LOCKED** |
| **AC-07** | Ownership | Audit §5–6 · §9–10 | §4 · §7 · §8 · §9 · §13.1 | **LOCKED** (capability + VR boundary; VR-04…06 classification còn mở cho Solution) |
| **AC-08** | Composition boundary Page→AppShell→Section→Host | Audit model §0 · §3 | §2 · §14 · §25 | **LOCKED** |
| **AC-09** | Cross-page consistency | Audit §6 | §10 · §11 · §26 · §28 | **LOCKED** |
| **AC-10** | Lifecycle ownership | Audit §8 | §19 · §20 | **LOCKED** |
| **AC-11** | Reuse / Extension | Audit §9–10 | §26 · §27 · §28 | **LOCKED** |
| **AC-12** | Downstream readiness | Audit §1 · §10 · §11 | §31 · §32 · §1.3 | **DOWNSTREAM** (Sidebar Scroll blocked until Foundation convergence đủ) |

### Topic cross-ref (optional)

| Topic | Audit | SoT |
| --- | --- | --- |
| Admin split | VR-09 · Audit §7 | §1.2 · §1.3 · OUT OF SCOPE |
| Widget preservation | Host boundary | §15–§18 · §22–§23 |
| Soft-nav | Audit VR-08 · §8 | §20 |

---

# 34. Architecture Convergence Definition of Done

Foundation convergence is complete only when:

* [ ] Every known AppShell-semantic MISS has an explicit decision.
* [ ] Every MISS is either:

  * [ ] converged to canonical AppShell; or
  * [ ] explicitly classified as Page-owned with architectural justification.
* [ ] No unresolved silent AppShell drift remains.
* [ ] Left Sidebar ownership is explicit.
* [ ] Right Sidebar ownership is explicit.
* [ ] AppShell Section boundaries are explicit.
* [ ] Page consumer contract is explicit.
* [ ] Widget Host boundaries are preserved.
* [ ] Widget Host behavior has no unintended regression.
* [ ] Lifecycle ownership is preserved/corrected.
* [ ] Soft navigation is preserved.
* [ ] Responsive behavior is preserved.
* [ ] CSS/DOM changes are limited to architectural convergence.
* [ ] Migration risks are documented.
* [ ] User Web compliance baseline is updated.
* [ ] Downstream AppShell capability tasks can reference this SoT.

---

# 35. Final System-of-Truth Statement

> **User Web AppShell is a shared system foundation, not a Page-local UI pattern.**
>
> **Any structure whose semantic responsibility is AppShell-owned SHALL belong to the canonical AppShell architecture, regardless of where the current implementation happens to reside.**
>
> **Architectural drift SHALL be explicitly detected, listed and classified. Confirmed AppShell-semantic drift SHALL converge toward the canonical AppShell → Section → Widget Host boundary.**
>
> **This convergence SHALL preserve existing Widget Host contracts and behavior. Widget internals are outside the Foundation boundary and SHALL NOT be rewritten merely to achieve AppShell convergence.**
>
> **Every migration SHALL explicitly account for DOM, CSS, Layout Engine, lifecycle, responsive, state and soft-navigation risks.**
>
> **Future Pages SHALL reuse canonical AppShell capabilities rather than create parallel Page-local implementations of the same semantic responsibility.**
>
> **Admin AppShell is excluded from this SoT and SHALL be governed independently.**
>
> **This SoT is the mandatory architectural authority for the subsequent Solution, Plan and implementation of User Web AppShell standardization and all downstream AppShell capability tasks.**
