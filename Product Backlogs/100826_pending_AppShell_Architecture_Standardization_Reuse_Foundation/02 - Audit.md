# 02 — Mandatory Audit — AppShell Architecture Standardization & Reuse Foundation

| | |
| --- | --- |
| **Task ID** | `100826_AppShell_Architecture_Standardization_Reuse_Foundation` |
| **Document** | Mandatory Audit (Current State Evidence) |
| **Status** | 🔒 **AUDIT COMPLETE** (2026-08-10) · Next: SoT |
| **Input** | 🔒 [`01 - BRD.md`](01%20-%20BRD.md) |
| **Authority** | Audit không đổi BRD · không khóa Solution · dừng tại **Widget Host** |
| **Evidence** | Codebase `User_Web/**` + `Admin_Design_system/**` (shell riêng) · 2026-08-10 |
| **Downstream** | `100826_AppShell_Sidebar_Scroll_Behavior` = **PENDING — blocked** |

---

## 0. Audit model & method

```text
Page
└── AppShell
    └── Section
        └── Widget Host   ← Audit dừng tại đây
```

**Phân biệt bắt buộc (BRD §11):**

| Layer | Meaning |
| --- | --- |
| Current implementation | Code/HTML thực tế |
| Canonical architectural role | Semantic responsibility (Header / Sidebar / Main / …) |

**Compliance (BRD §12):** `PASS` · `PARTIAL` · `MISS` · `FAIL` · `N/A`

**CẤM:** coi current implementation = canonical ownership; audit Widget internals; chọn HOW cho Solution.

### Surface scope (evidence-derived)

| Surface | AppShell stack | In this Audit |
| --- | --- | --- |
| **User Web** | `.ifx-app` · `header.ifx-topnav` · `main.ifx-main` · `bootShell` / GuestShell / page-runtime | **Primary full inventory** |
| **Admin** | `ix-sidebar` / `ix-navbar` · `iflux-admin-app-shell*.js` | **Separate shell** — inventory pointer only (không dùng chung User Web AppShell) |
| SEO/redirect stubs | meta refresh / `location.replace` | `N/A` — không phải runtime Page surface |

---

## 1. Executive findings

1. User Web có **một Canonical AppShell chrome** lặp trên **25** HTML surfaces (`.ifx-app` + topnav + main) + `bootShell`.
2. **Chỉ `market` và `home`** tạo Left Sidebar Section qua **canonical** `ensureSections` + `applyMarketLayout` / `applyHubLayout`.
3. Nhiều Page **consume chrome AppShell** nhưng tự dựng **AppShell-like Section** (Left/Right sidebar, multi-col) bên trong Widget/Page → classify **PARTIAL** + Violation **MISS-structure**.
4. **Right Sidebar** AppShell (`ensureSections('sidebar-right')`) **không** được page nào dùng; Community right = page-owned.
5. **6** pageKeys `SHELL_ONLY` — chrome AppShell nhưng **không** `bootPage` / `[data-ifx-page-runtime]` (account, checkout, comments, write, share, stockComment) → **PARTIAL**.
6. Auth ×4 + redirects = **N/A** (không yêu cầu content AppShell).
7. Admin = shell stack **khác hẳn** — không reuse User Web AppShell.
8. Soft-nav P1 chỉ allowlist 5 outlet pages — lifecycle soft teardown gắn `[data-ifx-page-runtime]`.
9. Downstream Sidebar Scroll **đúng bị block**: Sidebar ownership / Section boundary chưa khóa SoT Foundation.

---

## 2. Deliverable A — Full Page Inventory (User Web runtime)

### 2.1 Canonical AppShell files

| Role | Path |
| --- | --- |
| Shell CSS | `User_Web/iflux-web-ui/app-shell.css` |
| Section API | `User_Web/iflux-web-ui/runtime/app-shell.js` (`ensureSections`, `applyMarketLayout`, `applyHubLayout`) |
| Shell boot | `User_Web/iflux-web-ui/runtime/shell-boot.js` (`bootShell`) |
| Bootstrap | `User_Web/iflux-web-ui/runtime/bootstrap.js` (`detectPageKey`, `start`, `SHELL_ONLY`) |
| Page runtime | `User_Web/iflux-web-ui/runtime/page-runtime.js` (`bootPage`) |
| Layout Engine hosts | `User_Web/iflux-web-ui/runtime/page-layout-engine.js` |
| Header/Nav | `User_Web/iflux-web-ui/iflux-platform-boot.js` (`IfluxAppShellHeader`) |
| Guest shell | `User_Web/iflux-web-ui/iflux-guest-shell.js` |
| Soft-nav | `User_Web/iflux-web-ui/runtime/soft-navigation.js` |
| Widget host unload | `User_Web/iflux-web-ui/runtime/widget-loader.js` (`unloadWidget`) |
| Tabbar | `User_Web/iflux-web-ui/iflux-web-ui.js` (`syncMobileTabbar` → `#ifx-mobile-tabbar`) |

### 2.2 Page surfaces counted

| Category | Count | Evidence |
| --- | ---: | --- |
| HTML có `.ifx-app` (runtime pages) | **25** | `User_Web/**/*.html` |
| page manifests | **25** | `User_Web/iflux-web-ui/pages/*.manifest.js` |
| Auth HTML | **4** | `User_Web/auth/*` |
| Redirect / SEO stubs | many | không mount AppShell runtime |

---

## 3. Deliverable B–E — Page → AppShell → Section → Widget Host

### Legend

| Symbol | Meaning |
| --- | --- |
| **1C** | Exactly one Canonical AppShell chrome (`.ifx-app` + bootShell) |
| **+AL** | Additional AppShell-like Section/host **inside** page/widget (bypass canonical section API) |
| **WH** | Widget Host boundary (không inventory Widget bên trong) |

### 3.1 Content pages — `[data-ifx-page-runtime]` + `bootPage`

| Page (pageKey) | Route | AppShell count | Sections (canonical vs AL) | Widget Host location(s) | Status | Finding |
| --- | --- | ---: | --- | --- | --- | --- |
| home | `/nha-cua-toi` | **1C** | Header/Nav: static+Header API · Left+Main: `ensureSections`+`applyHubLayout` · Tabbar: WebUI | `[data-ifx-page-runtime]` → `[data-ifx-section=sidebar\|main]` → Layout Engine / slot hosts | **PASS** | Canonical 2-col AppShell sections |
| market | `/thi-truong` | **1C** | Header/Nav shell · Sidebar+Main: `ensureSections`+`applyMarketLayout` | runtime → sections → Layout Engine hosts | **PASS** | — |
| pricing | `/goi-cuoc` | **1C** | Header/Nav · Main only (`ensureSections`) | runtime → main → page WH | **PASS** | — |
| faq | `/hoi-dap` | **1C** | Header/Nav · Main | runtime → main WH | **PASS** | — |
| loyalty | `/thanh-vien` | **1C** | Header/Nav · Main | runtime → main WH | **PASS** | — |
| watchlist | `/theo-doi` | **1C** | Header/Nav · Main | runtime → main WH | **PASS** | — |
| search | `/tim-kiem` | **1C** | Header/Nav · Main | runtime → main WH | **PASS** | — |
| messages | `/tin-nhan` | **1C** | Header/Nav · Main | runtime → main WH | **PASS** | — |
| communityPost | `/cong-dong/bai-viet…` | **1C** | Header/Nav · Main | runtime → main → post-page WH | **PASS** | Aside story = content UI trong page module (xem VR nếu semantic Right Sidebar) |
| flow | `/dong-tien` | **1C+AL** | Shell chrome · Main via `ensureSections` · **Left sidebar AL** trong `flow-page` | runtime → main WH → internal `data-ifx-section=sidebar` + panels | **PARTIAL** | VR-01 MISS-structure Left |
| community | `/cong-dong` (+ collections) | **1C+AL** | Shell chrome · Main `ensureSections` · **Right sidebar AL** `sidebar-right` | runtime → main → feed layout hosts | **PARTIAL** | VR-02 MISS-structure Right |
| stocks | `/co-phieu` | **1C+AL** | Shell · Main · **inner `.ifx-mkt-layout` sidebar/main** (ELP) | runtime → main → ELP sidebar/main hosts | **PARTIAL** | VR-03 |
| sectors | `/nganh` | **1C+AL** | same ELP | same | **PARTIAL** | VR-03 |
| ecosystems | `/he-sinh-thai` | **1C+AL** | same ELP | same | **PARTIAL** | VR-03 |
| cauChuyen | `/cau-chuyen` | **1C+AL** | same ELP | same | **PARTIAL** | VR-03 |
| stock | `/co-phieu/:t` | **1C+AL** | Shell · Main · **stock columns + sidebar host** | runtime → main → stock-page hosts | **PARTIAL** | VR-04 sticky cols |
| sector | `/nganh/:id` | **1C+AL** | group-page columns | runtime → main → group hosts | **PARTIAL** | VR-04 |
| family | `/he-sinh-thai/:id` | **1C+AL** | group-page | same | **PARTIAL** | VR-04 |
| cauChuyenDetail | `/cau-chuyen/:slug` | **1C+AL** | group-page | same | **PARTIAL** | VR-04 |

### 3.2 Shell-only pages — chrome AppShell, **no** `bootPage`

| Page | Route | AppShell count | Sections / Hosts | Status | Finding |
| --- | --- | ---: | --- | --- | --- |
| account | `/tai-khoan` | **1C+AL** | Header/Nav shell · **static** profile sidebar + panels (không `ensureSections`) · no `[data-ifx-page-runtime]` | **PARTIAL** | VR-05 page-owned layout |
| checkout | `/thanh-toan` | **1C+AL** | Header/Nav · static main · sticky order summary | **PARTIAL** | VR-06 |
| comments | `/binh-luan` | **1C** | Header/Nav · feature host `[data-ifx-comments-page]` | **PARTIAL** | No page-runtime section API |
| communityWrite | `/cong-dong/viet-bai` | **1C** | Header/Nav · `[data-ifx-community-write]` | **PARTIAL** | — |
| share | `/chia-se` | **1C** | Header/Nav · feature boot | **PARTIAL** | — |
| stockComment | stock comment HTML | **1C** | Header · `[data-ifx-stock-comment-page]` | **PARTIAL** | — |

### 3.3 N/A surfaces

| Surface | Route | AppShell count | Status | Evidence |
| --- | --- | ---: | --- | --- |
| auth.login | `/dang-nhap` | **0** | **N/A** | `ix-auth-root` · auth-login-boot |
| auth.register | `/dang-ky` | **0** | **N/A** | auth-register-boot |
| auth.forgot | `/quen-mat-khau` | **0** | **N/A** | — |
| auth.otp | `/xac-minh-otp` | **0** | **N/A** | — |
| Root / alerts / stories / SEO stubs | various | **0** | **N/A** | redirect only · không semantic content AppShell |

### 3.4 Canonical Section map (User Web AppShell)

| Section semantic | Canonical creator today | Notes |
| --- | --- | --- |
| Header | Static `header.ifx-topnav` + `IfluxAppShellHeader` | Shared |
| Navigation | Inside Header (`nav.ifx-topnav-menu`) | Not separate section node |
| Left Sidebar | **Only** `ensureSections` on **home/market** | Else AL in widget/page |
| Main Content | Static `main.ifx-main` + runtime `[data-ifx-section=main]` | Always on app pages |
| Right Sidebar | **Unused** in `ensureSections` | Community AL only |
| Footer | Reserved in `SHELL_CHROME_KEYS` | **Not rendered** User Web |
| Mobile Tabbar | `IfluxWebUI.syncMobileTabbar` | Injected; not static HTML |

### 3.5 Widget Host boundary (stop)

| Host pattern | Created by | Contained in |
| --- | --- | --- |
| `[data-ifx-page-runtime]` | Static HTML | AppShell Main region |
| `[data-ifx-section=…]` | `ensureSections` **or** page/widget HTML | Section |
| `.ifx-rt-widget[data-widget-id]` | Layout Engine / widget-loader | Section / nested AL |
| Feature `[data-ifx-*-page\|write\|…]` | Static HTML | Shell-only Main |

**Audit không inventory Widget bên trong hosts.**

---

## 4. Deliverable F — Compliance Matrix (summary)

| Status | Count (runtime pageKeys / surfaces) | List |
| --- | ---: | --- |
| **PASS** | **9** | home, market, pricing, faq, loyalty, watchlist, search, messages, communityPost |
| **PARTIAL** | **16** | flow, community, stocks, sectors, ecosystems, cauChuyen, stock, sector, family, cauChuyenDetail, account, checkout, comments, communityWrite, share, stockComment |
| **MISS** (whole page) | **0** | Không có content page **chỉ** AL mà không có Canonical chrome |
| **FAIL** | **0** | Không có 2 Canonical AppShell xung đột trên cùng page |
| **N/A** | **4+** | Auth ×4 + redirects/stubs |

**MISS ở cấp structure** (nằm trong PARTIAL pages): xem §5 Violation Register.

---

## 5. Deliverable G — Architecture Violation Register

| ID | Type | Where | Semantic role | Current impl | Canonical? | Severity |
| --- | --- | --- | --- | --- | --- | --- |
| VR-01 | **MISS-structure** | flow-page LAYOUT | Left Sidebar + panel hosts | Widget HTML `ifx-flow-market-sidebar` | Manifest main-only; không `ensureSections(sidebar)` | High — Sidebar Scroll downstream |
| VR-02 | **MISS-structure** | community-page feed | Right Sidebar | `aside…sidebar-right` | AppShell right unused | High |
| VR-03 | **MISS-structure** | entity-list-page | Left Sidebar + Main grid | Inner `.ifx-mkt-layout` | Reuses market CSS classes, **không** AppShell apply on runtime root | High |
| VR-04 | **MISS-structure** | stock/group-page | Left (Right) column chrome | `.ifx-stock-col--*` + sticky CSS | Page-owned multi-col | High |
| VR-05 | **PARTIAL** | account profile | Left nav + content | Static `ix-profile-sidebar` | Không page-runtime / ensureSections | Med |
| VR-06 | **PARTIAL** | checkout | Order summary column | Sticky `.ix-order-summary` | Page CSS | Med |
| VR-07 | **PARTIAL** | SHELL_ONLY ×4 content features | Main content host | Feature boot hosts | Chrome OK; no unified section API | Med |
| VR-08 | **FINDING** | Soft-nav allowlist | Lifecycle | Chỉ 5 pages | Entity/write hard-nav | Med — reuse/extension |
| VR-09 | **FINDING** | Admin vs User Web | AppShell | Two stacks | Không shared | High for “toàn hệ thống” SoT |
| VR-10 | **FINDING** | `sidebar-right` API | Right Section | Comment-only capability | Stub | Med |

---

## 6. Deliverable H — Cross-Page Consistency

| Shared semantic | Implementations found | Ownership drift |
| --- | --- | --- |
| AppShell chrome (Header/Nav) | 25× static HTML + Header API + GuestShell | **Consistent** (Canonical) |
| Left Sidebar | (1) ensureSections home/market · (2) flow widget · (3) ELP · (4) stock/group · (5) account static | **Inconsistent** |
| Right Sidebar | Community feed only (+ optional stock right) | **Inconsistent / incomplete AppShell** |
| Main Widget Host | page-runtime sections vs feature hosts vs nested hosts | **Split** bootPage vs SHELL_ONLY |
| Market 2-col CSS | `applyMarketLayout` on runtime **vs** ELP inner `.ifx-mkt-layout` | **Visual reuse ≠ architecture reuse** |
| Responsive collapse | app-shell.css (chrome) + market/hub/flow/stock/community CSS (content) | **Split ownership** |
| Sticky follow | stock cols + pricing summary | **Page-owned** — không AppShell capability |

---

## 7. Deliverable I — Full-System Compliance Baseline

### User Web (primary)

```text
Runtime pages with Canonical AppShell chrome: 25
  PASS:     9   (36%)
  PARTIAL: 16   (64%)
  MISS:     0   (0% whole-page)
  FAIL:     0
Auth/N/A:   4+ (excluded from % above)
Pages with AppShell-like nested structures: 10+ (listed VR-01…04)
```

### Admin

```text
Separate AppShell stack (ix-*) — NOT counted in User Web PASS/PARTIAL %.
SoT MUST decide: one Product AppShell SoT spanning Admin+User, hoặc two governed shells.
```

---

## 8. Lifecycle ownership (evidence)

| Phase | Owner today | Notes |
| --- | --- | --- |
| Document chrome | Static HTML per page | ~25 copies — soft-nav keeps DOM for allowlist |
| Shell libs / Header / Guest | `bootShell` | Soft path skips re-chrome |
| Content sections (canonical) | `bootPage` → `ensureSections` | home/market (+ main-only others) |
| Content sections (AL) | Page/widget mount | flow/com/ELP/stock… |
| Widget Host mount/unmount | page-runtime / Layout Engine / `unloadWidget` | Soft teardown outlet |
| Feature pages | `*-feature-boot` after `iflux-shell-ready` | SHELL_ONLY |
| Responsive chrome | `app-shell.css` + WebUI tabbar/drawer | — |
| Responsive content cols | Page/feature CSS | Split |

---

## 9. BRD Acceptance Criteria — Audit readiness

| AC | Audit status | Notes |
| --- | --- | --- |
| AC-01 Full Page Inventory | **PASS** (Audit deliverable) | User Web runtime + Admin pointer + N/A stubs |
| AC-02 AppShell Count | **PASS** (Audit) | Mỗi pageKey có count 1C / 1C+AL / 0 |
| AC-03 Section Mapping | **PASS** (Audit) | §3.4 + per-page |
| AC-04 Widget Host Mapping | **PASS** (Audit) | Dừng tại host |
| AC-05 Compliance classify | **PASS** (Audit) | Matrix §4 |
| AC-06 MISS detection | **PASS** (Audit) | Structure MISS trong VR; whole-page MISS=0 |
| AC-07 Ownership | **PARTIAL → SoT** | Evidence có; **canonical lock = SoT** |
| AC-08 Composition boundary | **PARTIAL → SoT** | Model confirmed; contract lock = SoT |
| AC-09 Cross-page consistency | **PASS** (Audit) | §6 |
| AC-10 Lifecycle | **PARTIAL → SoT** | Evidence §8; ownership lock = SoT |
| AC-11 Reuse/Extension | **GAP → SoT** | Hiện path = copy HTML + bootShell; chưa contract khóa |
| AC-12 Downstream readiness | **GAP** | Sidebar Scroll vẫn cần Foundation SoT trước Solution |

---

## 10. Answers for SoT (Audit → SoT handoff)

SoT **MUST** khóa (BRD §27) dựa trên evidence này:

1. **Canonical AppShell** User Web = `.ifx-app` + topnav + main + `bootShell` / Header / GuestShell / (optional) page-runtime.  
2. **Canonical Left Sidebar Section** hiện chỉ home/market qua `ensureSections` — còn lại = AL (VR).  
3. **Canonical Right Sidebar** = **chưa có consumer** AppShell.  
4. **Widget Host** = `[data-ifx-section]` / Layout Engine host / feature `data-ifx-*` — boundary stop.  
5. **MISS-structure** phải được classify (promote vào AppShell **hoặc** officially Non-AppShell) — không im lặng.  
6. **Admin** = shell riêng — quyết định 1 SoT vs 2 SoT.  
7. **Reuse contract**: cấm Page tự tạo semantic Sidebar/Header tương đương mà không consume Canonical (sau khi SoT lock).  
8. **Downstream** Sidebar Scroll: chỉ apply trên Section SoT nhận là AppShell Sidebar.

---

## 11. Audit DoD (Foundation Audit phase)

* [x] Full Page Inventory (User Web runtime + Admin pointer + N/A)  
* [x] AppShell count per page  
* [x] Section inventory  
* [x] Widget Host mapping (stop at host)  
* [x] No Widget internals audit  
* [x] AppShell-like / MISS-structure detected  
* [x] PARTIAL / FAIL recorded  
* [x] Compliance baseline numbers  
* [x] Cross-page consistency  
* [x] Lifecycle evidence  
* [x] Downstream Sidebar Scroll marked blocked  

**Next:** `03 - SoT` — khóa ownership / boundary / reuse / compliance baseline.  
**Cấm:** Solution/Impl Foundation hoặc resume Sidebar Scroll Solution trước SoT Foundation LOCK.
