# 04 — Solution — AppShell Architecture Standardization & Reuse Foundation

|                |                                                                 |
| -------------- | --------------------------------------------------------------- |
| **Task ID**    | `100826_AppShell_Architecture_Standardization_Reuse_Foundation` |
| **Document**   | Solution                                                        |
| **Status**     | 🔒 **VR-04 RESOLVED** (Owner 2026-08-11, amend §9) · Plan UNGATED |
| **Scope**      | **User Web only**                                               |
| **Admin**      | OUT OF SCOPE — separate Foundation                              |
| **Authority**  | `01 - BRD.md` → `02 - Audit.md` → `03 - SoT.md`                 |
| **Downstream** | `100826_AppShell_Sidebar_Scroll_Behavior`                       |
| **Next**       | `05 - Plan.md` → Implementation                                 |
| **Governance** | BRD → Audit → SoT → Solution → Plan → Implementation · **vết dầu loang** §32 |
| **Amendment**  | 2026-08-11 — VR-04 gỡ UNRESOLVED bằng evidence Discover (8-agent Widget Host trace, xem §9) sau khi phát hiện task này trùng phạm vi với yêu cầu Sidebar Ownership Refactor từ SEO Metadata Management L1 (tách riêng, xem `040826_.../22 - L1 Execution.md`) |

---

# 0. Solution Objective

## 0.1 Final target

Đưa User Web từ trạng thái:

```text
Page
└── AppShell
    ├── Canonical Sections
    └── Page / Widget-owned AppShell-like structures
```

về:

```text
Page
└── Canonical AppShell
    ├── Header / Navigation
    ├── Left Sidebar       [optional]
    ├── Main Content       [required]
    ├── Right Sidebar      [optional]
    └── other shell regions
            ↓
         Section
            ↓
       Existing Widget Host
```

Trong đó:

1. Mọi AppShell-semantic responsibility có **một canonical owner**.
2. Không còn AppShell-like structure drift không được giải thích.
3. Page chỉ consume AppShell capability.
4. Existing Widget Host được giữ nguyên contract và behavior.
5. Không refactor Widget internals.
6. Không biến Foundation thành visual redesign.
7. Architecture convergence hoàn tất trước khi downstream Sidebar Scroll được implement.

---

# 1. Problem → Solution Model

Mandatory Audit chứng minh:

```text
Canonical AppShell exists
        +
Canonical Sections exist
        +
Multiple Page-local AppShell-like structures exist
        =
Architecture ownership drift
```

Do đó Solution không tạo một AppShell mới.

Solution sử dụng:

> **Canonical AppShell hiện hữu làm single architectural owner và converge các confirmed AppShell-semantic structures về owner đó.**

---

# 2. Core Solution Pattern

Mọi migration MUST follow pattern:

```text
CURRENT
Page
└── AppShell
    └── Main
        └── AppShell-like Structure
            └── Existing Widget Host
```

→

```text
TARGET
Page
└── AppShell
    └── Canonical Section
        └── Existing Widget Host
```

### Critical rule

**Widget Host là payload cần preserve, không phải object cần rewrite.**

Migration chủ yếu thay đổi:

```text
ownership
composition boundary
section placement
shell integration
```

không thay đổi:

```text
widget implementation
widget business logic
widget data contract
widget internal behavior
```

---

# 3. Architecture Convergence Strategy

Solution chia migration thành 4 bước logic.

```text
STEP 1
Classify
   ↓
STEP 2
Define canonical target
   ↓
STEP 3
Converge shell boundary
   ↓
STEP 4
Verify Widget Host preservation
```

Không được thực hiện kiểu:

```text
MISS
 ↓
move DOM
```

mà phải:

```text
MISS
 ↓
semantic classification
 ↓
canonical ownership
 ↓
risk assessment
 ↓
migration
 ↓
verification
```

---

# 4. Step 1 — Confirm Semantic Ownership

Mỗi VR MUST được đưa qua ownership decision.

Decision tree:

```text
Does the structure provide shared shell responsibility?
        │
        ├── NO → PAGE OWNED
        │
        └── YES
             ↓
       APP SHELL OWNED
             ↓
       canonical Section
```

Các tiêu chí:

* semantic role;
* cross-page reuse;
* shell-level lifecycle;
* shell-level responsive responsibility;
* shared navigation/layout responsibility;
* whether another Page could consume the same capability.

CSS class hoặc DOM position **không đủ** để quyết định ownership.

---

# 4A. Ownership Decision Register

> SoT §13.1 khóa **classification boundary**.  
> Hàng **CONVERGE / PAGE_OWNED** dưới đây = Solution ownership outcome (Plan thi hành HOW).  
> Hàng **UNRESOLVED** = **cấm migrate / cấm giả định PAGE_OWNED** cho đến khi Owner chốt semantic (escalate SoT nếu cần).  
> **Current implementation / CSS / sticky ≠ canonical ownership.**

| VR | Structure | Decision | Canonical target | Migration |
| --- | --- | --- | --- | --- |
| **VR-01** | Flow Left Sidebar | **APP_SHELL** | AppShell Left Sidebar | **CONVERGE** |
| **VR-02** | Community Right Sidebar | **APP_SHELL** | AppShell Right Sidebar | **CONVERGE** |
| **VR-03** | Entity List Sidebar/Main | **APP_SHELL** | AppShell Left Sidebar + Main | **CONVERGE** |
| **VR-04** | Stock/Group columns (Section only) | **APP_SHELL** (Section) · **PAGE_OWNED** (candlestick/header content) | AppShell Left Sidebar (Section) + Main (page content, sibling) | **CONVERGE (Section) / NO promote (page content)** — amend 2026-08-11, xem §9 |
| **VR-05** | Account profile sidebar | **PAGE_OWNED** | Remain inside Account Main | **NO promote** |
| **VR-06** | Checkout order summary | **PAGE_OWNED** | Remain inside Checkout Main | **NO promote** |
| **VR-CP** | communityPost aside (story) | **PAGE_OWNED** | Content composition trong Main | **NO promote** |

### Evidence basis (semantic — không dùng CSS làm proof)

| VR | Decision | Audit (current-state only) | SoT rule | Semantic rationale (authority) |
| --- | --- | --- | --- | --- |
| **VR-01** | CONVERGE | §3.1 flow `1C+AL` · §5 VR-01 Left Sidebar AL High | §7 Left = **AppShell capability** · §13.1 **AppShell candidate → Requires convergence** | Structure provides **shared shell Left Sidebar** responsibility (cùng semantic với home/market Left). Cross-page shell lifecycle/reuse; Sidebar Scroll downstream cần AppShell Section. |
| **VR-02** | CONVERGE | §3.1 community Right AL · §5 VR-02 · §3.4 Right API unused | §8 Right = **AppShell capability LOCK** · Community = MISS **consumer** | Capability đã khóa AppShell; consumer bypass Main. Converge HOW only — không reopen “Right thuộc AppShell?”. |
| **VR-03** | CONVERGE | §3.1 ELP inner `.ifx-mkt-layout` · §5 VR-03 · §6 visual≠arch | §7 Left capability · §13.1 **AppShell semantic candidate → Requires convergence** | ELP sidebar+main = **cùng semantic composition** market 2-col shell; hiện chỉ reuse CSS class, không consume Section API → ownership drift bắt buộc converge. |
| **VR-04** | CONVERGE (Section) / PAGE_OWNED (content) | §5 VR-04 MISS-structure stock/group columns · **Discover 2026-08-11** (8-agent source trace, xem §9) | §7 MUST evaluate stock/group by **semantic role** · §13.1 resolved bằng evidence runtime (không phải CSS) | **Semantic lock đạt được bằng runtime evidence, không phải CSS/sticky.** `stock-page.js` và `group-page.js` (dùng chung cho sector/family/article-detail) đều tự fetch `PagePublished` qua publishKey riêng (`stock-detail`, `sector-detail`, `eco-detail`, `cau-chuyen-detail`) và mount Widget vào `[data-ifx-section="sidebar"]` — **cùng cơ chế Section/Widget Host với VR-01/02/03**, không phải page tự vẽ UI. Candlestick chart + stock header là **sibling** của Widget Host trong cùng cột trái, **không nằm trong host**, và là data đặc thù trang → giữ PAGE_OWNED, **không** promote toàn cột thành 1 sidebar owner. Sticky CSS trên `.ifx-stock-col--*` vẫn là legacy residue (không đổi kết luận này), xử lý ở Hygiene. |
| **VR-05** | PAGE_OWNED | §3.2 account static profile sidebar · SHELL_ONLY | §6 Page được cung cấp content composition trong Main · §13.1 classification | **Account-domain** nav/panels (chỉ phục vụ `/tai-khoan` feature surface) — không phải shared AppShell Sidebar capability tái dùng cross-page. Visual “sidebar” ≠ shell capability. |
| **VR-06** | PAGE_OWNED | §3.2 checkout order summary trong Main | §6 Main = page content OK · sticky **không** dùng làm proof | **Checkout-domain** transactional composition (tóm tắt đơn trong flow thanh toán) — không shared shell Sidebar. Quyết định dựa **domain responsibility**, không dựa sticky CSS. |
| **VR-CP** | PAGE_OWNED | §3.1 `communityPost` **PASS** · aside = content UI trong page module | §6 Main may hold page content · §8 Right = feed MISS riêng (VR-02) | Aside story trên bài viết = **content UI** trong Main của post page — **không** cùng semantic Community feed Right Sidebar (VR-02). |

### Anti-pattern (CẤM)

```text
CSS / sticky / current DOM
        ↓
“đang page-owned”
        ↓
canonical PAGE_OWNED
```

Đúng:

```text
Current implementation (Audit)
        ↓
Semantic responsibility + AppShell/Section SoT
        ↓
Ownership decision
        ↓
Solution migrate / no-migrate
```

### Gate

```text
Foundation DoD / Wave 4
    ↓
mọi VR CONVERGE đã migrate+verify (VR-01/02/03 + VR-04 Section)
    ↓
VR-05/06/CP + VR-04 page-content PAGE_OWNED confirmed (no accidental promote)
    ↓
VR-04 ownership ĐÃ resolved 2026-08-11 (§9 amend) — gate cũ đã tháo
    ↓
Wave 5 / Sidebar Scroll full contract có thể mở sau khi Wave 4 đóng
```

**Amendment 2026-08-11:** VR-04 đã resolved bằng evidence Discover (§9). Gate "VR-04 UNRESOLVED chặn Wave 5" đã tháo. **Plan** (`05 - Plan.md`) có thể cover đầy đủ Wave 0–5 bao gồm VR-04 Section convergence, không còn cần gate riêng cho stock/group Section — chỉ cần tuân đúng ranh giới: **Section → CONVERGE, candlestick/header content → giữ nguyên PAGE_OWNED, không promote toàn cột**.

---

# 5. Step 2 — Canonical Target Mapping

Sau ownership decision, mỗi confirmed AppShell structure MUST có target Section.

Canonical mapping:

| Semantic role         | Canonical target       |
| --------------------- | ---------------------- |
| Header                | AppShell Header        |
| Navigation            | AppShell Navigation    |
| Left Sidebar          | AppShell Left Sidebar  |
| Main                  | AppShell Main          |
| Right Sidebar         | AppShell Right Sidebar |
| Page-specific content | Page Main              |
| Widget                | Existing Widget Host   |

---

# 6. VR-01 — Flow Left Sidebar

### Decision (§4A)

```text
APP_SHELL → CONVERGE → AppShell Left Sidebar
```

### Current

```text
Flow Page
└── Main
    └── flow-page
        └── Left Sidebar AL
            └── Widget / panel hosts
```

### Target

```text
Flow Page
└── AppShell
    ├── Left Sidebar
    │   └── Existing Widget Hosts
    └── Main
```

### HOW (constraints)

1. Introduce canonical `ensureSections('sidebar')` (hoặc equivalent Section API đã SoT-lock) trên Flow consumer path.
2. Re-parent Existing Flow Widget/panel Hosts vào Left Sidebar Section — **không** rewrite Host internals.
3. Remove Flow-local AppShell-like sidebar wrapper sau khi Host reconnect.
4. Không copy `applyMarketLayout` chỉ vì visual; dùng canonical Section API + shell layout contract.

### Preservation

Không rewrite Flow Widget Hosts. Chỉ converge: sidebar ownership · section boundary · layout integration.

### Risk

**HIGH** — custom layout/panel structure. Plan: **Wave 2a** (Flow trước), verify Layer 1–6 rồi mới 2b.

---

# 7. VR-02 — Community Right Sidebar

### Decision (§4A)

```text
APP_SHELL → CONVERGE → AppShell Right Sidebar
```

(Right Sidebar capability đã SoT-lock; Solution chỉ HOW.)

### Current

```text
Community
└── AppShell
    └── Main
        └── page-owned sidebar-right   ← MISS consumer
```

### Target

```text
Community
└── AppShell
    ├── Main
    └── Right Sidebar
        └── Existing Widget Hosts
```

### HOW (constraints)

1. Enable/consume `ensureSections('sidebar-right')` trên Community index/collections path.
2. Move Existing Right Sidebar Widget Hosts vào canonical Right Section.
3. Remove page-owned `aside…sidebar-right` wrapper duplicate.
4. **Không** tạo Community-specific AppShell.

### Risk

**HIGH**. Plan: **Wave 2b** (sau Flow 2a verify).

---

# 8. VR-03 — Entity List Pages

### Decision (§4A)

```text
APP_SHELL → CONVERGE → AppShell Left Sidebar + Main
```

Affected:

```text
stocks · sectors · ecosystems · cauChuyen
```

### Current

```text
Page
└── AppShell
    └── Main
        └── inner .ifx-mkt-layout
            ├── sidebar
            └── main
```

### Target

```text
Page
└── AppShell
    ├── Left Sidebar
    │   └── Existing ELP Widget Hosts
    └── Main
        └── Existing ELP content
```

### HOW (constraints)

1. Canonical Section API trên runtime root — **không** coi inner `.ifx-mkt-layout` là AppShell.
2. **Visual reuse ≠ architecture ownership** — cấm “copy `applyMarketLayout` vào widget” như substitute cho Section ownership.
3. Preserve Existing ELP Hosts; chỉ đổi ancestor Section ownership.
4. Bốn pageKeys cùng pattern → Plan dầu loang: **một ELP page pilot → verify → roll** (không bung 4 cùng lúc nếu risk cao).

### Risk

**HIGH**. Plan: **Wave 2c** sau 2a+2b verify.

---

# 9. VR-04 — Stock / Group Pages

### Decision (§4A) — RESOLVED 2026-08-11 (Owner amend)

```text
SPLIT decision — không phải một khối đơn:
  Section / Widget Host   → APP_SHELL → CONVERGE
  Candlestick + page-specific stock/group content → PAGE_OWNED → NO promote
```

Affected:

```text
stock (stock-page.js) · sector · family · cauChuyenDetail (group-page.js, shared module)
```

### Amendment rationale — vì sao gỡ được UNRESOLVED

§4A trước đây cấm dùng CSS/sticky làm proof ownership (đúng, giữ nguyên). Cái đã thay đổi là **loại evidence**: không phải CSS, mà là **runtime source evidence** thu thập ngày 2026-08-11 (8-agent Discover, theo yêu cầu "Sidebar Ownership Refactor" của Owner — audit trace `Admin Widget Placement → Widget Registry/Runtime → Widget Host → Rendered Widget`):

| Trang | File | Evidence |
| --- | --- | --- |
| Stock detail | `User_Web/iflux-web-ui/stock-page.js:242-245` | Tự fetch `PagePublished` qua publishKey `stock-detail`, mount widget vào `[data-ifx-section="sidebar"]` — **đúng cơ chế Section/Widget Host**, không phải tự vẽ UI song song |
| Sector detail | `group-page.js:111-114` (shared) | publishKey `sector-detail`, cùng `[data-ifx-section="sidebar"]` |
| Family/Ecosystem detail | `group-page.js` (shared) | publishKey `eco-detail`, cùng mechanism |
| Article detail (câu chuyện) | `group-page.js` (shared) | publishKey `cau-chuyen-detail`, cùng mechanism |

Đây là **cùng cơ chế canonical** đã dùng cho Home/Market (`PagePublished` → `IfluxPageLayoutEngine.buildHostTree` → `mount-published-widgets.js`) — chỉ khác là các page này **self-fetch** thay vì được bootstrap.js resolve, nhưng **API/consumer path là một**, không phải bypass/tự chế như VR-01/02/03 từng là trước converge.

### Current

```text
Stock Detail Page
└── AppShell
    └── Main
        └── Left column
            ├── [data-ifx-section="sidebar"]   ← true Widget Host (PagePublished)
            └── section.ifx-stock-panel        ← candlestick chart + stock header (sibling, page-specific)
```

```text
Sector/Family/Article Detail (qua group-page.js)
└── AppShell
    └── Main
        └── [data-ifx-section="sidebar"]       ← true Widget Host (PagePublished, publishKey riêng)
```

### Target

```text
Stock Detail Page
└── AppShell
    ├── Left Sidebar (canonical Section)
    │   └── Existing Widget Host (stock-detail publishKey) — không rewrite internals
    └── Main
        └── candlestick + stock header    ← giữ PAGE_OWNED, KHÔNG gộp vào Sidebar Section
```

```text
Sector/Family/Article Detail
└── AppShell
    └── Left/Right Sidebar (canonical Section, theo layout hiện có)
        └── Existing Widget Host (publishKey tương ứng, giữ nguyên qua group-page.js)
```

### HOW (constraints)

1. Section/Widget Host của stock-detail + group-page (3 publishKey) → chuyển sang canonical Section API (đồng bộ với Wave 2a-2c), **không** rewrite Widget Host internals hoặc đổi publishKey.
2. **Cấm promote candlestick/header vào Sidebar Section** — đây là page-specific content, phải giữ trong Main như hiện tại (sibling, không lồng vào Section).
3. **Cấm coi toàn bộ cột trái Stock Detail là "1 sidebar owner"** — chỉ phần đang thực sự là Widget Host mới đổi Section ownership.
4. Sticky CSS trên `.ifx-stock-col--*` vẫn là legacy implementation residue — xử lý ở Hygiene (dưới), không dùng làm lý do giữ/đổi ownership.
5. Vì `group-page.js` là 1 module dùng chung 3 page, chỉ cần 1 lần migrate + verify cả 3 publishKey (không tạo 3 sidebar type riêng).

### Hygiene (not ownership)

Sticky CSS `.ifx-stock-col--*` (nếu xác nhận không còn tác dụng sau khi Section đổi ownership) có thể dọn trong cùng wave — **không** ghi đây là "chứng minh ownership", chỉ là cleanup CSS residue.

### Risk

**MEDIUM** (thấp hơn VR-01/02/03 vì cơ chế Section/Widget Host đã đúng sẵn — chỉ chuyển API, không dựng lại UI từ đầu). Plan: **Wave 3b**, sau Wave 2a-2c (Flow/Community/ELP) verify, cùng nhóm risk với VR-05/06/CP nhưng cần regression riêng cho stock-detail + 3 group pages.

---

# 10. VR-05 — Account Profile Sidebar

### Decision (§4A)

```text
PAGE_OWNED → NO promote
```

### Current / Target

```text
Account (SHELL_ONLY)
└── AppShell chrome
    └── Main
        └── account-domain profile sidebar + panels
```

### Justification (semantic — independent of sticky/CSS)

**Account-domain** navigation + panels chỉ phục vụ Account feature (`/tai-khoan`).  
Không thỏa shared AppShell Sidebar capability (không cross-page shell reuse; không consumer của SoT §7 Left).  
SoT §6: Page được phép content composition trong Main.  
**Không** dùng “nhìn giống sidebar” hoặc CSS hiện tại làm proof.

### HOW

1. Remain Page-owned trong Account Main.
2. Consumer contract SHELL_ONLY (§12A) áp dụng cho chrome + feature host — **không** force `bootPage` chỉ để “đối xứng”.

---

# 11. VR-06 — Checkout Summary

### Decision (§4A)

```text
PAGE_OWNED → NO promote
```

### Current / Target

```text
Checkout (SHELL_ONLY)
└── Main
    └── order summary (checkout-domain composition)
```

### Justification (semantic — sticky không phải proof)

**Checkout-domain** transactional composition: tóm tắt đơn trong flow thanh toán — thuộc Page content trong Main (SoT §6), không phải shared AppShell Left/Right Sidebar capability.  
Bất kỳ `position: sticky` nào trên summary = presentation detail / residue — **không** quyết định ownership.

---

# 11A. VR-CP — communityPost aside

### Decision (§4A)

```text
PAGE_OWNED content UI trong Main → NO promote to Right Sidebar
```

Audit §3.1: `communityPost` = **PASS**; aside story = content UI trong page module.  
Khác VR-02 (Community feed Right Sidebar = MISS consumer).

Plan **không** gộp communityPost vào Wave 2b.

---

# 12. VR-07 — SHELL_ONLY Features

Affected:

* account;
* checkout;
* comments;
* communityWrite;
* share;
* stockComment.

Solution separates:

```text
AppShell presence
≠
Page runtime section ownership
```

**MUST NOT** force mọi SHELL_ONLY vào `bootPage` chỉ vì architectural symmetry.

---

# 12A. SHELL_ONLY Consumer Contract (LOCKED — AC-10 / AC-11)

### Required (canonical)

| Requirement | Contract |
| --- | --- |
| AppShell chrome | Page MUST mount User Web Canonical AppShell (`.ifx-app` + Header/Nav + Main) qua shell boot hiện hữu |
| Single shell | Exactly **one** Canonical AppShell — không nested AppShell |
| Feature host | Content mounts vào **một** feature host rõ (`[data-ifx-*-page\|write\|…]` hoặc tương đương) **bên trong Main** |
| Lifecycle | Feature owns init/teardown của host nội dung; AppShell owns shell chrome lifecycle |
| No parallel shell | Cấm tạo Left/Right Sidebar AppShell-like mới trong feature nếu semantic là AppShell capability — phải consume §12B |

### Allowed

| Pattern | Notes |
| --- | --- |
| Không `bootPage` / không `[data-ifx-page-runtime]` | Hợp lệ nếu feature host contract ổn định |
| Page-owned layout trong Main | VR-05 / VR-06 = PAGE_OWNED |
| Hard navigation | Mặc định OK |

### Forbidden

| Pattern | Why |
| --- | --- |
| Second AppShell / fake shell chrome | Ownership drift |
| Promote domain sidebar lên AppShell Sidebar không qua §4A | Override SoT/Solution |
| Soft-nav buộc mọi SHELL_ONLY | VR-08 — extension riêng, không Foundation force |

### VR-08 Soft-nav extension (boundary)

Foundation **không** mở rộng soft-nav allowlist như acceptance bắt buộc.

Extension path (AC-11):

```text
New soft-nav consumer
  ↓
must already be Canonical AppShell consumer
  ↓
must have teardown-safe page/feature host
  ↓
Owner/Plan task riêng cập nhật allowlist
  ↓
không tự patch soft-nav trong lúc migrate Sidebar
```

---

# 12B. Canonical Page Consumer / Extension Contract (LOCKED — AC-11)

Path chuẩn cho **Page runtime** consumer mới hoặc Page đang converge:

```text
1. Page mounts Canonical AppShell (existing bootShell / guest shell)
2. Page runtime calls ensureSections(<needed sections>)
      - main (required when using section API)
      - sidebar        ← Left Sidebar capability
      - sidebar-right  ← Right Sidebar capability
3. Existing / new Widget Hosts attach under the Section nodes
4. Layout Engine / widget-loader bind to Hosts (preserve host identity)
5. Page MUST NOT create parallel AppShell-like Left/Right wrappers
```

### Reuse rule

```text
Need Left Sidebar  → ensureSections('sidebar') + Host under Section
Need Right Sidebar → ensureSections('sidebar-right') + Host under Section
Need only Main     → Main Section / page-runtime main Host
```

### Extension rule (future Page)

```text
Future Page
  ↓
reuse §12B
  ↓
cấm Page-local AppShell-like structure cho cùng semantic
```

Wave 1 (Canonical Section Enablement) MUST verify API đủ cho Left + Right + Main trước Wave 2 migrate.

---

# 13. Right Sidebar Solution

Right Sidebar is a special case because:

```text
Capability = canonical
Consumer = missing
```

Therefore Solution MUST establish the canonical consumption path (**§12B** + VR-02 Wave **2b**) before downstream scroll work depends on Right.

Target:

```text
AppShell
├── Main
└── Right Sidebar
      └── Existing Widget Host
```

Community = first canonical Right consumer (§7). Other Pages reuse §12B — không tạo Right local mới.

This makes the downstream task deterministic:

```text
AppShell Sidebar Scroll
        ↓
canonical Left/Right Sidebar Section
        ↓
scroll behavior
```

It removes the current ambiguity:

```text
"Is this Page Sidebar or AppShell Sidebar?"
```

---

# 14. Widget Host Preservation Architecture

The key migration strategy is:

> **Move the ownership boundary around the Host, not the Host implementation itself.**

Conceptually:

```text
BEFORE

Page
└── Local Section
    └── Host A
        └── Widget
```

becomes:

```text
AFTER

AppShell
└── Canonical Section
    └── Host A
        └── Widget
```

Where possible:

```text
Host A = same host
Widget = same widget
configuration = same
data = same
lifecycle = same
```

---

# 15. Host Identity Preservation

Implementation MUST preserve, where technically possible:

* host ID;
* `data-*` attributes;
* mount selector;
* host configuration;
* Layout Engine registration;
* widget-loader contract;
* initialization contract;
* teardown contract.

If a host identity must change because of structural convergence:

```text
old identity
    ↓
new identity
```

Solution MUST explicitly document:

1. why;
2. affected consumer;
3. compatibility strategy;
4. regression verification.

---

# 16. DOM Migration Strategy

Preferred migration order:

```text
1. Preserve Host
2. Introduce canonical Section
3. Reconnect Host
4. Remove duplicate/local shell wrapper
5. Verify behavior
```

NOT:

```text
1. Rewrite page
2. Rewrite widgets
3. Rebuild layout
4. Hope Host still works
```

The latter is prohibited.

---

# 17. CSS Strategy

Architecture convergence MUST NOT become CSS rewrite.

Rules:

### Preserve

* visual appearance;
* spacing;
* responsive behavior;
* Widget-specific styling.

### Normalize

Only shell responsibility:

* Section ownership;
* canonical shell layout;
* shell-level positioning;
* shell-level responsive rules.

### Remove

Only duplicated CSS that is proven to be obsolete after canonical convergence.

CSS cleanup is a downstream consequence, not the primary objective.

---

# 18. Layout Engine Strategy

Existing Layout Engine integration MUST be preserved.

Before changing a structure:

```text
Identify:
Host
 ↓
Layout Engine registration
 ↓
Mount target
 ↓
Sizing dependency
 ↓
Responsive dependency
```

After migration:

```text
Canonical Section
 ↓
same Host
 ↓
same Layout Engine contract
```

If the Layout Engine currently relies on ancestor geometry, Solution MUST explicitly account for the changed ancestor chain.

---

# 19. Lifecycle Strategy

The target lifecycle is:

```text
AppShell
   ↓
Section
   ↓
Page / Feature consumer
   ↓
Widget Host
   ↓
Widget
```

The migration MUST prevent:

```text
double initialization
double teardown
duplicate listeners
duplicate subscriptions
stale references
orphaned hosts
```

Special attention is required for:

* `bootPage`;
* SHELL_ONLY feature boot;
* soft navigation;
* `unloadWidget`;
* Layout Engine.

---

# 20. Soft Navigation Strategy

AppShell must remain stable where soft navigation expects shell persistence.

Page-specific Widget Hosts must remain page lifecycle-owned unless explicitly governed otherwise.

Target:

```text
AppShell
│
├── Page A
│   └── Host A
│
└── navigation
      ↓
   teardown A
      ↓
   Page B
      └── Host B
```

Migration MUST NOT accidentally make a page Widget Host persistent merely because its Section is now canonical AppShell.

---

### VR-08 Soft-nav (cross-ref)

Preserve soft-nav expectations trên allowlist hiện hữu (§20).  
Extension allowlist = §12A path — **không** Foundation force.

---

# 21. Responsive Strategy

Canonical AppShell Section owns:

```text
shell-level responsive behavior
```

Page owns:

```text
page-specific content responsive behavior
```

When promoting a Sidebar:

```text
Sidebar
 ↓
AppShell responsive contract
```

must be established.

Do not retain competing Page-local responsive rules for the same semantic shell region without explicit justification.

---

# 22. Risk-Control Matrix

Every migration MUST document:

| Risk            | Required control                                  |
| --------------- | ------------------------------------------------- |
| DOM contract    | Preserve host structure/attributes where possible |
| Widget mount    | Verify mount/unmount                              |
| Widget state    | Verify state preservation                         |
| CSS cascade     | Compare before/after computed layout              |
| Layout Engine   | Verify registration and sizing                    |
| Lifecycle       | Verify init/teardown exactly once                 |
| Soft navigation | Verify Page A → Page B                            |
| Responsive      | Verify supported breakpoints                      |
| Scroll          | Verify shell/page scroll ownership                |
| Performance     | Verify no duplicate loading/subscription          |

---

# 23. Verification Strategy

Verification is layered.

## Layer 1 — Architecture

Verify:

```text
Page
└── AppShell
    └── Section
        └── Widget Host
```

No unresolved AppShell-semantic duplicate remains.

---

## Layer 2 — Host

Verify:

* Host exists;
* Host mounts;
* Host unloads;
* Host identity/contract preserved;
* no duplicate Host.

---

## Layer 3 — Widget behavior

Verify:

* rendering;
* data;
* interaction;
* state;
* configuration;
* errors.

Widget internals remain out of Foundation scope, but observable Host behavior MUST remain intact.

---

## Layer 4 — Lifecycle

Verify:

* first load;
* soft navigation;
* hard navigation;
* teardown;
* remount.

---

## Layer 5 — Responsive

Verify relevant desktop/mobile shell states.

---

## Layer 6 — Performance

Verify that convergence does not introduce:

* duplicate script loading;
* duplicate API requests;
* duplicate subscriptions;
* unnecessary remounts;
* additional shell initialization.

---

# 24. No Performance Claim Without Evidence

Architecture standardization is expected to improve:

* reuse;
* consistency;
* maintainability;
* future extensibility;
* ability to implement shared shell behavior once.

However:

> **This Solution does NOT claim that the application will automatically become lighter/faster merely because AppShell is standardized.**

Performance improvement is an expected opportunity, not an acceptance criterion unless measured.

Actual performance benefit MUST be established by evidence.

---

# 25. Downstream Task Contract

This Foundation directly feeds:

`100826_AppShell_Sidebar_Scroll_Behavior`

Dependency:

```text
Foundation
    ↓
Canonical Sidebar ownership
    ↓
Canonical Left/Right Sidebar Sections
    ↓
Sidebar Scroll Behavior
```

Therefore Sidebar Scroll MUST NOT:

* discover Sidebar ownership itself;
* patch Page-local sidebar structures independently;
* introduce another sidebar abstraction;
* implement different behavior per Page.

Instead it consumes the canonical Sidebar contract produced by this Foundation.

---

# 26. Downstream Sidebar Scroll Scope

Once Foundation convergence is complete:

```text
AppShell
├── Left Sidebar
│   └── Widget Host
│
└── Right Sidebar
    └── Widget Host
```

the downstream task can implement:

```text
Sidebar viewport-following
```

once at AppShell level.

This allows the same behavior to propagate to every consuming Page.

That is the architectural reason this Foundation must precede Sidebar Scroll.

---

# 27. Task-to-Task Traceability

```text
100826_AppShell_Architecture_Standardization_Reuse_Foundation
│
├── BRD
│   └── defines WHAT
│
├── Mandatory Audit
│   └── establishes CURRENT STATE
│
├── SoT
│   └── establishes ARCHITECTURAL AUTHORITY
│
├── Solution
│   └── establishes CONVERGENCE HOW
│
├── Plan
│   └── establishes EXECUTION ORDER
│
└── Downstream
    └── 100826_AppShell_Sidebar_Scroll_Behavior
        └── consumes canonical Sidebar
```

---

# 28. Governance Rules for Plan

Plan MUST NOT invent architecture decisions.

Plan may only convert Solution into executable work.

Every implementation item MUST trace (vết dầu loang):

```text
Plan item
 ↓
Solution section / Decision ID
 ↓
SoT rule
 ↓
Audit evidence
 ↓
BRD AC
```

Example:

```text
Migrate Community Right Sidebar
 ↓
Solution §4A / §7 / §13
 ↓
SoT §8 / §11 / §14
 ↓
Audit VR-02
 ↓
BRD AC-07 / AC-08 / AC-11
```

This is mandatory traceability.

---

# 28A. Solution Traceability Matrix (AC-01…AC-12)

> Product Backlogs Governance §2.5 — mỗi AC một hàng.  
> AC-01…AC-06 đã LOCK ở Audit + SoT; Solution **consume** (không re-audit).

| AC | Audit | SoT | Solution | Status |
| --- | --- | --- | --- | --- |
| **AC-01** Full Page Inventory | §2–3 | §1 · §2 · §3 · §29 | Consume inventory — no re-open | **SATISFIED** (upstream) |
| **AC-02** AppShell count | §3–4 | §3 · §29 | Consume | **SATISFIED** (upstream) |
| **AC-03** Section mapping | §3.4 · §5 | §5–§8 | §5 · §12B · Wave 1 | **SATISFIED** + enablement |
| **AC-04** Widget Host mapping | §3.5 | §14–§18 | §14–§16 Host preserve | **SATISFIED** + migration constraint |
| **AC-05** Compliance classify | §4 · §7 | §12 · §29–§30 | Wave 4 re-audit after converge | **CLOSED by Plan evidence** |
| **AC-06** MISS detection | §5 VR | §10–§13 | §4A register covers all VR + VR-CP | **SATISFIED** |
| **AC-07** Ownership | §5–6 | §4 · §7–§9 · §13.1 | §4A — VR-01/02/03/05/06/CP/**VR-04 (2026-08-11)** đều locked | **SATISFIED** |
| **AC-08** Composition boundary | §0 · §3 | §2 · §14 · §25 | §2 pattern · §12B | **LOCKED** |
| **AC-09** Cross-page consistency | §6 | §10 · §11 · §26 · §28 | §4A + Wave 2a/b/c converge drift | **LOCKED** (path) |
| **AC-10** Lifecycle | §8 | §19 · §20 | §12A · §19 · §20 | **LOCKED** |
| **AC-11** Reuse / Extension | §9–10 | §26–§28 | **§12A · §12B** | **LOCKED** |
| **AC-12** Downstream readiness | §1 · §10–§11 | §31–§32 | §25–§26 · Wave 5 gate | **DOWNSTREAM** after DoD |

### VR → AC (oil-stain map)

| Decision | Primary AC | Solution |
| --- | --- | --- |
| VR-01 CONVERGE | AC-07 · AC-09 · AC-12 | §6 · Wave 2a |
| VR-02 CONVERGE | AC-07 · AC-11 · AC-12 | §7 · §13 · Wave 2b |
| VR-03 CONVERGE | AC-07 · AC-09 | §8 · Wave 2c |
| VR-04 CONVERGE (Section) / PAGE_OWNED (content) | AC-07 · AC-09 | §9 — resolved 2026-08-11, Wave 3b |
| VR-05 PAGE_OWNED | AC-07 · AC-10 | §10 · §12A · Wave 3a |
| VR-06 PAGE_OWNED | AC-07 | §11 · Wave 3a |
| VR-CP PAGE_OWNED | AC-06 · AC-07 | §11A · Wave 3a |
| VR-07 contract | AC-10 · AC-11 | §12 · §12A |
| VR-08 boundary | AC-11 | §12A soft-nav path |

---

# 28B. Vết dầu loang (LOCKED)

Mọi Solution Decision phải reverse-trace được:

```text
SOL (§ / Decision)
 ↓
SoT
 ↓
BRD AC
 ↓
Audit evidence / VR
```

**CẤM:** “Solution thấy nên làm vậy” khi không có governing source từ SoT + Audit.

**Thi công dầu loang:** một surface (hoặc một pilot page) → verify Layer 1–6 (§23) → mới lan sang surface kế. **CẤM** bung VR-01 + VR-02 + VR-03 cùng một changeset.

---

# 29. Implementation Wave Strategy (dầu loang)

## Wave 0 — Safety Baseline

Freeze Host inventory / contracts / lifecycle / behavior / network baseline. **No architecture change.**

---

## Wave 1 — Canonical Section Enablement

Verify §12B đủ cho Left Sidebar · Right Sidebar · Main. No Widget rewrite. **Gate trước Wave 2.**

---

## Wave 2 — Convergence (một surface / sub-wave)

| Sub-wave | VR | Surface | Order reason |
| --- | --- | --- | --- |
| **2a** | VR-01 | Flow Left Sidebar | Dầu loang: surface đầu + Left Sidebar CONVERGE |
| **2b** | VR-02 | Community Right Sidebar | Sau 2a verify; Right capability consumer |
| **2c** | VR-03 | ELP (pilot 1 page → roll) | Sau 2a+2b; cùng Left+Main pattern |

**Exit mỗi sub-wave:** Layer 1–6 PASS trên surface đó trước khi mở sub-wave kế.  
**CẤM** migrate all Flow+Community+ELP trong một changeset.

---

## Wave 3 — Classification / no-migrate

| Sub | VR | Action |
| --- | --- | --- |
| **3a** | VR-05 / VR-06 / VR-CP | Confirm PAGE_OWNED + no accidental promote (§12A) |
| **3b** | **VR-04** (resolved 2026-08-11) | Migrate Section/Widget Host của stock-detail + group-page (3 publishKey: `sector-detail`, `eco-detail`, `cau-chuyen-detail`) sang canonical Section API; **giữ nguyên** candlestick/header content trong Main (PAGE_OWNED, không promote); regression riêng cho stock-detail + 3 group pages trước khi đóng sub-wave |

**Gate:** 3a đóng trước Wave 4 partial; **3b (VR-04) đóng bằng Layer 1–6 PASS trên cả stock-detail + 3 group pages** trước Foundation DoD đầy đủ / Wave 5 — không còn cần "Owner semantic classification" riêng vì đã resolved ở §9.

---

## Wave 4 — Compliance Closure

Re-audit composition:

```text
Page → AppShell → Section → Widget Host
```

Verify: no unresolved AppShell-semantic drift · no duplicate shell capability · Host/lifecycle/responsive OK · AC-05 evidence.

**CẤM** Wave 4 full DoD nếu Wave 2a–2c **hoặc** Wave 3b (VR-04 migrate) chưa đóng bằng Layer 1–6 PASS.  
Wave 4 partial (chỉ surfaces đã resolve) được phép để thu evidence AC-05 trên CONVERGE pages trong lúc chờ surface còn lại.

---

## Wave 5 — Downstream Enablement

Chỉ sau Foundation DoD:

```text
100826_AppShell_Sidebar_Scroll_Behavior
```

consume canonical Left/Right Sidebar Sections (§25–§26).

---

# 30. Definition of Solution Success

Solution (và Implementation theo Plan) thành công khi:

```text
One AppShell capability
        ↓
Many Pages
        ↓
Same Section contract (§12B)
        ↓
Existing Widget Hosts preserved
        ↓
Shared behavior possible once
```

và:

* §4A: VR-01/02/03 CONVERGE + VR-05/06/CP PAGE_OWNED + **VR-04 CONVERGE (Section) / PAGE_OWNED (content) — resolved 2026-08-11**;
* AC-01…AC-12 có hàng §28A; **AC-07 = SATISFIED** (không còn PARTIAL);
* không còn silent AppShell drift trên CONVERGE surfaces (VR-01/02/03 + VR-04 Section);
* PAGE_OWNED surfaces (VR-05/06/CP + VR-04 candlestick/header) không bị promote nhầm;
* Sidebar Scroll resume trên canonical Left/Right của consumers đã converge, bao gồm stock-detail + 3 group pages.

---

# 31. Final Solution Statement

> **The system will not solve AppShell drift by rewriting individual Pages or Widgets. It will establish the existing User Web AppShell as the single canonical shell owner, converge VR-01/02/03 into canonical Sections, keep VR-05/06/CP as PAGE_OWNED on independent semantic grounds. VR-04 (stock/group columns) is a SPLIT decision resolved 2026-08-11 by runtime source evidence (not CSS/sticky): the Section/Widget Host sub-component CONVERGEs into canonical Sections identically to VR-01/02/03; the candlestick chart + page-specific stock/group content remains PAGE_OWNED and must not be promoted into the Sidebar Section.**
>
> **Current implementation is Audit evidence of state, not Architecture. Sticky CSS on stock/group is LEGACY IMPLEMENTATION RESIDUE — not ownership proof either way. Hygiene cleanup of residue ≠ ownership decision.**
>
> **SHELL_ONLY and future Page consumers follow §12A / §12B. Execution follows vết dầu loang: Wave 2a Flow → verify → 2b Community → verify → 2c ELP → 3a PAGE_OWNED confirm → 3b VR-04 Section migrate (stock-detail + 3 group pages) → verify → Wave 4 → Wave 5.**
>
> **Foundation DoD requires Wave 2a–2c + Wave 3b (VR-04) Layer 1–6 PASS. VR-04 ownership is no longer open — Plan executes the split decision above, không tự suy diễn thêm.**

---
