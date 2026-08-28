# SoT — Canonical UI Architecture (Design System ↔ Pattern)

> **Trạng thái:** LOCK — Owner 2026-08-28  
> **Phạm vi:** UI Architecture của Canonical Design System và Pattern Library.  
> **Cấp trên:** [`docs/SoT — iFlux Product Architecture (V2).md`](SoT%20—%20iFlux%20Product%20Architecture%20(V2).md)  
> Nếu xung đột với V2 về Product / Page / Widget (Content Unit), **V2 thắng**.  
> SoT này thắng mọi tài liệu cấp dưới về **folder ownership**, **Workbench area**, **Sandbox scope**, và **Global Pattern layer**.

---

## 0. Mục đích

Tách rõ **hai hệ độc lập, ngang hàng**:

| Hệ | Vai trò |
|---|---|
| **Design System** | Single Source of Truth cho **reusable UI contract** |
| **Pattern** | Canonical **Template Library** (preview / reference / acceptance / nguồn template) |

Hai hệ **không** có quan hệ cha–con.

Workbench là **một viewer dùng chung**. Việc Workbench đang nằm trong `design_system/workbench/` **không** suy ra Pattern thuộc Design System.

---

## 1. Alignment với Product Architecture V2

V2 khóa:

- Design System sở hữu: Component (Card / Block / Item / Atom), Tokens, Foundations.
- Design System **không** sở hữu: Page, App Shell (product), Section, Page Composition, **Widget (Content Unit)**, Widget Definition, Widget Template, Business Logic, Data Contract.

SoT này **không** mở lại các ownership đó.

Ánh xạ bắt buộc:

| Thuật ngữ SoT này | Không phải |
|---|---|
| `design_system/widgets/` | Product Widget (Content Unit) của V2 |
| `patterns/` | Design System layer |
| `patterns/widgets/` (reserved) | Generic DS widget chrome |

`design_system/widgets/` chỉ được chứa **generic widget chrome contract** (shell, header, title, actions, body, footer, loading / empty / error, responsive chrome).  
Specific widget (WGT-MKT-001, Market Overview, News Card, Money Flow, …) **không** vào Design System.

---

## 2. Cấu trúc đích

```
design_system/
├── README.md
├── tokens/
├── foundation/
├── primitives/
├── components/
├── widgets/          ← generic chrome only; chưa có contract thì README scope
├── adapters/
├── sandbox/          ← acceptance surface của Design System
├── workbench/        ← shared viewer (2 area ngang hàng)
└── scripts/

patterns/
├── README.md
├── auth/
├── charts/
├── chat/
├── form-add/
├── order-detail/
├── order-list/
├── referrals/
├── table-list/
├── user-profile/
├── wizard/
└── …                 ← pattern mới = sibling, không vào design_system/
```

**Không tồn tại lâu dài:**

- `design_system/patterns/` với nghĩa Global Pattern layer
- `design_system/references/patterns/` làm destination Pattern

**Không tạo ở task migration này:**

| Path | Trạng thái |
|---|---|
| `design_system/manifests/` | **OPTIONAL / NOT ESTABLISHED** — chỉ tạo khi có requirement machine-readable registry thật. Cấm folder rỗng. |
| `patterns/widgets/` | **RESERVED** — chỉ tạo khi có specific widget template đầu tiên. |

`design_system/index.html` (redirect vào Workbench) được giữ. Không đổi nghĩa kiến trúc.

---

## 3. Design System — phạm vi

Design System **chỉ** chứa:

- Tokens
- Foundation
- Primitives
- Components
- Widgets **generic chrome**
- Adapters
- Sandbox (acceptance của DS)
- Workbench (viewer; không phải owner của Pattern)
- Scripts

Design System **không** chứa implementation cụ thể của:

- Auth
- User Profile
- Chat (page / 3-pane template)
- Order List / Table List
- specific market widget
- specific page / template

### 3.1 Khi nào được thêm contract vào Design System

Consumer hỏi: **“Design System đã có contract đúng use case chưa?”**

| Kết quả | Hành động |
|---|---|
| Có | Reuse. Không copy. |
| Có nhưng thiếu reusable valid variant | Extend đúng owner (token / foundation / primitive / component / generic widget). |
| Khác use case nhưng generic + reusable + domain-independent | Tạo contract mới đúng layer. |
| Chỉ local cho một Pattern / Page / Widget cụ thể | **Không** đưa vào Design System. Để Pattern-local hoặc production owner. |

### 3.2 Cấm

- Import Pattern, Page, hoặc specific Widget từ Design System.
- Thêm block mới vào `reference-layers.css` sau khi SoT này lock.
- Map mọi residual Pattern thành PLATFORM / MODULE / PAGE / WIDGET **bên trong Design System**.
- Tạo Global Pattern layer mới.

---

## 4. Pattern — phạm vi

Pattern = Canonical Template Library.

Công năng:

- preview
- reference
- acceptance
- reusable template source
- tương lai có thể được Admin chọn làm template

Pattern **được** sở hữu:

- `index.html` / `*.html`
- `pattern-local.css` (tên file hiện tại được giữ: `user-profile.css`, `page.js`, …)
- `pattern-local.js`
- assets local nếu thật sự cần

Pattern **không** phải:

- Design System layer
- Global Component mặc định
- production runtime / business logic

### 4.1 Luật consume

Nếu Design System đã có contract đúng → Pattern **phải** consume Design System.

Nếu thiếu generic reusable capability → đề xuất bổ sung Design System (không invent `.ifx-*` local giả Global).

Nếu chỉ Pattern đó dùng → để local trong Pattern.

---

## 5. Dependency Law

```
PATTERN              →  DESIGN SYSTEM
PAGE                 →  DESIGN SYSTEM
PRODUCTION WIDGET    →  DESIGN SYSTEM

DESIGN SYSTEM  ↛  Pattern
DESIGN SYSTEM  ↛  Page
DESIGN SYSTEM  ↛  specific Widget
```

Cấm circular dependency.

Workbench được phép **hiển thị** cả hai hệ. Workbench **không** được import Pattern vào token / foundation / primitive / component / widgets generic.

---

## 6. Global Pattern cũ — đã phân loại

`design_system/patterns/` **không** còn là layer.

| Artifact | Destination | Lý do Owner |
|---|---|---|
| `page-header/` | `design_system/components/page-header/` | Reusable composed UI contract (breadcrumb + title + actions). Nhiều consumer. Không phải template. |
| `data-list/` | `design_system/components/data-list/` | `IfxDataList` = reusable orchestration Search + Table + Pagination. CSS/JS sau này colocate tại component này nếu cần. |

Sau migrate: `design_system/patterns/` phải **trống và bị xóa**. Không giữ stub “để lịch sử”.

---

## 7. Sandbox

Sandbox là acceptance surface **chỉ của Design System**.

**Giữ (primary):**

- Tokens
- Foundation
- Primitives
- Components
- Widgets
- Visual
- Contract

**Bỏ khỏi primary nav / catalog:**

- Patterns (compose demos của page/template)
- References (wave notes)

Page Header / Data List sau khi thành Component → demo trong Sandbox **Components**.

Auth / Chat / User Profile / Table List / … → **chỉ** Workbench area Patterns.

Sandbox **không** mô phỏng Platform / Module / Page / specific Widget như trách nhiệm chính.

---

## 8. `reference-layers.css` — Legacy Compatibility Debt

File: `design_system/sandbox/assets/reference-layers.css`

Phân loại: **LEGACY COMPATIBILITY DEBT**.

Không bắt buộc clean hết ở migration đầu.

Bắt buộc:

1. Audit mọi consumer.
2. Mapping block → Pattern owner.
3. **Không thêm block mới** sau SoT này lock.
4. Migrate dần về Pattern-local CSS.
5. Xóa file khi consumer = 0.

**Rule khóa:** file này **chỉ được giảm, không được tăng**.

Không còn là lower-layer receiver lâu dài. Không còn nghĩa “đúng chỗ để map residual thành PLATFORM / MODULE / PAGE / WIDGET trong DS”.

---

## 9. Workbench

Một AppShell / viewer dùng chung.

Hai **area** ngang hàng:

```
DESIGN SYSTEM
  Tokens · Foundation · Primitives · Components · Widgets
  (+ Visual · Contract — acceptance)

PATTERNS
  Auth · Charts · Chat · Form Add · Order Detail · Order List
  Referrals · Table List · User Profile · Wizard
  (+ Widgets khi có template)
```

### 9.1 Route canonical

```
?area=design-system&section=<section>[&panel=<panel>]
?area=patterns&pattern=<id>[&state=<state>]
```

Ví dụ:

```
?area=design-system&section=components
?area=patterns&pattern=auth&state=login
```

Alias (normalize, không gãy bookmark):

| Cũ | Canonical |
|---|---|
| `?module=sandbox&section=…` | `?area=design-system&section=…` |
| `?module=patterns&pattern=…` | `?area=patterns&pattern=…` |

Semantic trên nav / title phải là **Design System** và **Patterns**, không còn “Sandbox là parent của Patterns”.

### 9.2 Pattern iframe

```
/patterns/<id>/…
```

Không:

```
/design_system/references/patterns/…
```

Auth state switcher ngoài canvas được giữ (`state=login|register|forgot|verify-2fa`).

---

## 10. README bắt buộc

| File | Vai trò |
|---|---|
| `design_system/README.md` | Định nghĩa DS SoT, layer, dependency, khi nào được / không được thêm contract |
| `patterns/README.md` | Định nghĩa Pattern Library, ownership local, `Pattern → Design System` |

Nội dung khóa nằm ở §3–§5. README implementation phải copy đúng luật, không viết lại nghĩa.

---

## 11. Frozen artifacts (migration này)

| Artifact | Luật |
|---|---|
| **User Profile** | Move path only. Không đổi HTML / CSS / JS / visual / behavior / accepted mapping. `USER_PROFILE_VISUAL_DELTA = 0`. Chỉ được sửa href path để resolve. |
| **Auth** | Move path + update route / docs. Không implement proposal parity mới. Không sửa visual. |
| **Chat** | Move artifact hiện tại (W07 sai). **Không rebuild.** Rebuild sau lock này, process 4 phase + ownership 4 bậc (§12). |

`patterns/_up_base_*` (forensic snapshot User Profile) = **archive, không phải Pattern catalog**. Không vào Workbench nav.

---

## 12. Chat rebuild — ownership model sau lock

Chỉ chạy **sau** architecture task PASS.

Thứ tự quyết định residual:

1. **DESIGN SYSTEM EXISTING** — reuse contract đã có.
2. **DESIGN SYSTEM MISSING GENERIC CONTRACT** — đề xuất contract mới đúng layer.
3. **PATTERN LOCAL** — HTML/CSS/JS cục bộ của `patterns/chat/`.
4. **EXCLUDE / RUNTIME** — AppShell / GIS / VoIP / business — không thuộc Pattern, không thuộc DS.

Cấm mặc định đẩy residual Chat vào `reference-layers.css`.

Process rebuild (không thuộc SoT execution này):

1. Exact clone  
2. Isolate template  
3. Mapping audit (no edits)  
4. Canonical reuse theo 4 bậc trên  

---

## 13. Deploy / serve

`patterns/` là root ngang hàng trên **repo và web root**.

Staging (và mọi môi trường serve Workbench) phải copy `patterns/` ra release.  
Nginx `location /` + `try_files` đã đủ để `/patterns/` resolve **nếu** file có trên web root.

URL cũ `/design_system/references/patterns/…` phải redirect hoặc hết consumer. Không để orphan.

---

## 14. Tài liệu cấp dưới bị supersede (phần liên quan)

Khi xung đột, SoT này thắng:

- P6a CSS Ownership SoT — “generic Pattern composition” như **layer trong Design System**
- P6a CSS Ownership SoT §17 — “bổ sung về Pattern owner” **bên trong** `design_system/`
- Mọi gate P6 / P6a ghi destination `design_system/references/patterns/`
- Chat rebuild plan (`30_chat_legacy_rebuild_plan.md`) — path và residual → `reference-layers.css` như mặc định

P6a CSS Ownership vẫn áp dụng cho **token / foundation / primitive / component** (generic, domain-independent).  
Pattern-local CSS được phép; không còn bắt map mọi residual vào 5 lớp DS.

---

## 15. Gates kiến trúc (khóa)

Hai set. Không verify Staging trước commit. Chi tiết phase: plan `31_ds_pattern_separation_plan.md`.

**PRE-SHIP** (local → được commit / push): separation, README ×2, global pattern classified, workbench local, sandbox scope, `REFERENCE_LAYERS_FROZEN`, UP local, orphan = 0, cleanup chỉ xóa khi `LIVE_CONSUMER = 0`.

**POST-DEPLOY** (sau CI Staging): `/patterns/` resolve, 301 path cũ, `cp patterns/` có trên release, workbench + UP + pattern routes trên Staging.

```
ARCHITECTURE_READY_FOR_CHAT_REBUILD = YES
  chỉ khi PRE_SHIP = PASS
     VÀ POST_DEPLOY = PASS
     VÀ FINAL architecture lock đã ghi
```

Trước POST-DEPLOY PASS: **NO**.

Xóa obsolete: `move → rewrite → repo-wide scan → LIVE_CONSUMER = 0 → delete`. “Folder empty” không đủ.

`MANIFESTS` không là gate. Không fail vì chưa có `manifests/`.
