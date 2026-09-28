# Design System — Single UI Authority Restructure

**Date:** 2026-08-31  
**Mode:** AUDIT → PLAN ONLY  
**Implement:** NO · Rename: NO · Move: NO · Commit: NO

**Owner lock (compliance 44 accepted, có điều kiện):**

- [`design_system/README.md`](../../../../../../../design_system/README.md) **đã đúng target** — **không amend**.  
- Chỉ amend [`docs/SoT — Canonical UI Architecture (Design System ↔ Pattern).md`](../../../../../../../docs/SoT%20—%20Canonical%20UI%20Architecture%20(Design%20System%20↔%20Pattern).md) §2.  
- Coverage 95% Chat = gap task 42, không phải gap restructure.  
- `design_system/index.html` **không** giữ trong DS. Redirect `/design_system/` = nginx/router **ngoài** DS.  
- Numbering **toàn bộ** subfolder authority.  
- Third-party source **không** là Design Authority → Tabler = `/vendor/tabler/`.

`design_system/` chỉ chứa UI authority do **iFlux sở hữu**.

```
THIRD_PARTY_INSIDE_DESIGN_SYSTEM     = 0
NON_AUTHORITY_FILE_INSIDE_DESIGN_SYSTEM = 0
README_AMEND_REQUIRED                = NO
SOT_CANONICAL_UI_AMEND_REQUIRED      = YES
NUMBERED_HIERARCHY                   = FULL
READY_FOR_IMPLEMENTATION             = YES
```

---

## A. CURRENT DESIGN_SYSTEM TREE

Live (2026-08-31), file counts:

```
design_system/
├── README.md                         authority docs (file, không phải layer)
├── index.html                        redirect → workbench/  (KHÔNG phải UI contract)
├── tokens/           16 files
│   ├── registry.json
│   ├── source/       color, typography, spacing, radius, shadow, motion, size, zindex, breakpoints
│   └── generated/
│       ├── css/  primitives.css  semantic.css  themes/{dark,light}.css
│       └── js/   token-index.js  breakpoints.js
├── foundation/       11 files
│   ├── reset.css  fonts.css  typography.css  layout.css
│   ├── fonts/    BeVietnamPro-{200,400,600,800}.woff2
│   └── icons/
│       ├── icons.css
│       └── vendor/tabler/  tabler-icons.min.css  icon-index.json
├── primitives/       8 folders
│   └── alert  avatar  badge  button  chip  navigation  progress  title
├── components/       19 folders
│   └── action-bar  breadcrumb  card  chart  chat  data-list  drawer
│       dropdown  form  modal  page-header  pagination  search  stat
│       table  tabs  timeline  toast  wizard
├── widgets/          README.md only (scope, 0 contract CSS/JS)
├── adapters/web/     theme.js          ← NON-AUTHORITY
├── vendor/           EMPTY             ← NON-AUTHORITY
├── sandbox/          11 files          ← NON-AUTHORITY
├── workbench/        3 files           ← NON-AUTHORITY
└── scripts/          4 mjs             ← NON-AUTHORITY
```

**Đã xóa khỏi `design_system/`:** `patterns/` · `references/` (live Pattern = repo `patterns/`).  
**Không tồn tại:** `design_system/manifests/`.  
**Không có:** `design_system/vendor/apexcharts` (chart = SVG nội bộ `components/chart`).

---

## B. DESIGN_AUTHORITY folders

Chỉ 5 nhánh được **định nghĩa UI**:

| Order | Target | Current | Owns |
|---|---|---|---|
| 01 | `design_system/01_tokens/` | `tokens/` | Giá trị. Source JSON + generated CSS/JS |
| 02 | `design_system/02_foundation/` | `foundation/` | Global/base: reset, font, type, layout, icons |
| 03 | `design_system/03_primitives/` | `primitives/` | Atom độc lập: Button, Avatar, Chip, … |
| 04 | `design_system/04_components/` | `components/` | Capability tái sử dụng: Chat, Form, Table, … |
| 05 | `design_system/05_widgets/` | `widgets/` | Generic widget chrome only. Hiện README |

**Được giữ trong `design_system/` nhưng không phải layer:** `README.md` (mô tả authority — iFlux).

**Không được giữ trong `design_system/`:**

- `index.html` — xóa. Redirect `/design_system/` do nginx/router ngoài DS  
- `adapters/` `sandbox/` `workbench/` `scripts/` `vendor/` (rỗng)  
- `foundation/icons/vendor/tabler/` — third-party source → `/vendor/tabler/`

Dependency **một chiều**:

```
05_widgets → 04_components → 03_primitives → 02_foundation → 01_tokens
```

Cấm ngược. Audit CSS/JS hiện tại: **0 import ngược** (không `from` layer dưới lên trên). Compose = HTML `<link>` từ consumer (Pattern / Sandbox / Workbench), không phải DS import Pattern.

`04_components/data-list` consume **sibling** Table + Pagination + Search (JS `IfxTable` / `IfxPagination`). Đây là orchestration cùng layer, không phải dependency lên 05. Giữ. Đánh số `data-list` **sau** các component nó gọi.

---

## C. NON_AUTHORITY folders

| Current | Vì sao không phải Design Authority | Live consumer |
|---|---|---|
| `design_system/adapters/web/theme.js` | Theme **boot** (storage `ifx-theme`, `data-theme`). Không định nghĩa màu. | 12 Pattern HTML `script src=.../adapters/web/theme.js`. Workbench **không** link file này (snippet / IfxTheme khác). |
| `design_system/vendor/` | Folder **rỗng**. 0 file. | 0 |
| `design_system/sandbox/` | Acceptance **viewer** của DS. `reference-layers.css` = LEGACY DEBT, không contract mới. | Workbench load `sandbox.css` `sandbox.js` `reference-layers.css`. `sandbox.js` fetch `sections/*.html` + `<link>` `../tokens|foundation|primitives|components`. 11 Pattern HTML vẫn `<link> reference-layers.css`. |
| `design_system/workbench/` | Shared **AppShell viewer** (2 area). `base href="/design_system/workbench/"`. | Staging URL `/design_system/workbench/?area=`. `index.html` root redirect vào đây. `workbench.js` mount iframe `/patterns/<id>/`. |
| `design_system/scripts/` | Compiler / verify / governance. Không visual. | `tokens/registry.json` `"compiler": "design_system/scripts/build-tokens.mjs"`. Header generated CSS ghi path này. `check-governance.mjs` `DS = ..` (parent = `design_system/`). **Không** có npm script repo-root. CI **không** chạy scripts này trên push. |
| `design_system/index.html` | Redirect, không contract | Bookmark `/design_system/` — **xóa file**. Nginx/router ngoài DS |
| `foundation/icons/vendor/tabler/` | Third-party Tabler source (CSS + `icon-index.json`) | Mọi Pattern/Workbench/Sandbox `<link>` Tabler + `audit-icons.mjs` + `sandbox.js` fetch `icon-index.json` |

**Luật:** third-party source ≠ Design Authority. Không giữ `02_foundation/02_icons/01_vendor/01_tabler/`.

---

## D. Exact move plan (adapters / vendor / sandbox / workbench / scripts)

Không move cho đến khi Wave rewrite path + deploy copy + nginx 301 sẵn.

| Old | New | Ghi chú |
|---|---|---|
| `design_system/adapters/web/theme.js` | `adapters/web/theme.js` | Repo root `/adapters/`. URL `/adapters/web/theme.js` |
| `design_system/adapters/web/` | `adapters/web/` | |
| `design_system/adapters/` | `adapters/` | Xóa sau move |
| `design_system/vendor/` (empty) | **DELETE** | Không để folder rỗng trong DS |
| `design_system/foundation/icons/vendor/tabler/*` | `vendor/tabler/` | `tabler-icons.min.css` + `icon-index.json`. URL `/vendor/tabler/` |
| `design_system/foundation/icons/vendor/` | **DELETE** sau move | Không `01_vendor` trong Foundation |
| `design_system/sandbox/` | `ui_tooling/sandbox/` | Giữ `assets/` `sections/` `playground/` |
| `design_system/workbench/` | `ui_tooling/workbench/` | Đổi `<base href="/ui_tooling/workbench/">` |
| `design_system/scripts/*.mjs` | `ui_tooling/scripts/*.mjs` | `DS` resolve = `path.resolve(REPO, 'design_system')` — **sửa** `..` hiện tại |
| `design_system/index.html` | **DELETE** | Redirect `/design_system/` / `/design_system` = **nginx/router ngoài DS** → `/ui_tooling/workbench/` |

Target conceptual (Owner):

```
/adapters/
  web/theme.js
/vendor/
  tabler/
    tabler-icons.min.css
    icon-index.json
/ui_tooling/
  sandbox/
  workbench/
  scripts/
```

`02_foundation/02_icons/icons.css` = **chỉ** contract iFlux (`.ifx-icon` / `-sm` / `-lg` + token size).  
Consume Tabler: `@import url("/vendor/tabler/tabler-icons.min.css");` trong `icons.css` **hoặc** load-order bắt buộc vendor → icons (Foundation sở hữu quan hệ consume; **byte Tabler không** nằm trong DS).

---

## E. Exact numbered target tree

```
design_system/
├── README.md
├── 01_tokens/
│   ├── registry.json
│   ├── 01_source/          ← tokens/source/*.json
│   └── 02_generated/
│       ├── 01_css/
│       │   ├── primitives.css
│       │   ├── semantic.css
│       │   └── 01_themes/
│       │       ├── dark.css
│       │       └── light.css
│       └── 02_js/
│           ├── token-index.js
│           └── breakpoints.js
├── 02_foundation/
│   ├── reset.css
│   ├── fonts.css
│   ├── typography.css
│   ├── layout.css
│   ├── 01_fonts/           ← woff2
│   └── 02_icons/
│       └── icons.css          ← iFlux .ifx-icon only; consume /vendor/tabler/
├── 03_primitives/
│   ├── 01_alert/
│   ├── 02_avatar/
│   ├── 03_badge/
│   ├── 04_button/
│   ├── 05_chip/
│   ├── 06_navigation/
│   ├── 07_progress/
│   └── 08_title/
├── 04_components/
│   ├── 01_action-bar/
│   ├── 02_breadcrumb/
│   ├── 03_card/
│   ├── 04_chart/
│   ├── 05_chat/
│   ├── 06_drawer/
│   ├── 07_dropdown/
│   ├── 08_form/
│   ├── 09_modal/
│   ├── 10_page-header/
│   ├── 11_pagination/
│   ├── 12_search/
│   ├── 13_stat/
│   ├── 14_table/
│   ├── 15_tabs/
│   ├── 16_timeline/
│   ├── 17_toast/
│   ├── 18_wizard/
│   └── 19_data-list/      ← sau table/pagination/search (JS consume)
└── 05_widgets/
    └── README.md          ← 0 subfolder mới
```

Ngoài `design_system/`:

```
adapters/web/theme.js
vendor/tabler/        { tabler-icons.min.css, icon-index.json }
ui_tooling/sandbox/   { assets, sections, playground }
ui_tooling/workbench/ { index.html, workbench.css, workbench.js }
ui_tooling/scripts/   { build-tokens, verify-tokens, check-governance, audit-icons }.mjs
patterns/             ← không đổi (không phải DS)
```

**Không invent:** `manifests/`, `05_widgets/<chrome>/` rỗng, `design_system/patterns/`, `02_icons/01_vendor/`.  
`/vendor/tabler/` **có** artifact thật — không phải folder rỗng.

**Số primitive:** alpha hiện tại (không đổi responsibility).  
**Số component:** alpha, `data-list` = 19 vì phụ thuộc 11/12/14.

`fonts.css` `url('./fonts/...')` → `url('./01_fonts/...')`.

---

## F. Old path → new path matrix

### F1. Authority (rename in place)

| Old | New |
|---|---|
| `design_system/tokens/` | `design_system/01_tokens/` |
| `design_system/tokens/source/` | `design_system/01_tokens/01_source/` |
| `design_system/tokens/generated/` | `design_system/01_tokens/02_generated/` |
| `design_system/tokens/generated/css/` | `design_system/01_tokens/02_generated/01_css/` |
| `design_system/tokens/generated/css/themes/` | `design_system/01_tokens/02_generated/01_css/01_themes/` |
| `design_system/tokens/generated/js/` | `design_system/01_tokens/02_generated/02_js/` |
| `design_system/tokens/registry.json` | `design_system/01_tokens/registry.json` |
| `design_system/foundation/` | `design_system/02_foundation/` |
| `design_system/foundation/fonts/` | `design_system/02_foundation/01_fonts/` |
| `design_system/foundation/icons/` | `design_system/02_foundation/02_icons/` |
| `design_system/foundation/icons/icons.css` | `design_system/02_foundation/02_icons/icons.css` |
| `design_system/foundation/icons/vendor/tabler/` | **`vendor/tabler/`** (không còn trong DS) |
| `design_system/foundation/icons/vendor/` | **DELETE** |
| `design_system/primitives/` | `design_system/03_primitives/` |
| `design_system/primitives/alert/` | `design_system/03_primitives/01_alert/` |
| `design_system/primitives/avatar/` | `design_system/03_primitives/02_avatar/` |
| `design_system/primitives/badge/` | `design_system/03_primitives/03_badge/` |
| `design_system/primitives/button/` | `design_system/03_primitives/04_button/` |
| `design_system/primitives/chip/` | `design_system/03_primitives/05_chip/` |
| `design_system/primitives/navigation/` | `design_system/03_primitives/06_navigation/` |
| `design_system/primitives/progress/` | `design_system/03_primitives/07_progress/` |
| `design_system/primitives/title/` | `design_system/03_primitives/08_title/` |
| `design_system/components/` | `design_system/04_components/` |
| `design_system/components/action-bar/` | `design_system/04_components/01_action-bar/` |
| `design_system/components/breadcrumb/` | `design_system/04_components/02_breadcrumb/` |
| `design_system/components/card/` | `design_system/04_components/03_card/` |
| `design_system/components/chart/` | `design_system/04_components/04_chart/` |
| `design_system/components/chat/` | `design_system/04_components/05_chat/` |
| `design_system/components/drawer/` | `design_system/04_components/06_drawer/` |
| `design_system/components/dropdown/` | `design_system/04_components/07_dropdown/` |
| `design_system/components/form/` | `design_system/04_components/08_form/` |
| `design_system/components/modal/` | `design_system/04_components/09_modal/` |
| `design_system/components/page-header/` | `design_system/04_components/10_page-header/` |
| `design_system/components/pagination/` | `design_system/04_components/11_pagination/` |
| `design_system/components/search/` | `design_system/04_components/12_search/` |
| `design_system/components/stat/` | `design_system/04_components/13_stat/` |
| `design_system/components/table/` | `design_system/04_components/14_table/` |
| `design_system/components/tabs/` | `design_system/04_components/15_tabs/` |
| `design_system/components/timeline/` | `design_system/04_components/16_timeline/` |
| `design_system/components/toast/` | `design_system/04_components/17_toast/` |
| `design_system/components/wizard/` | `design_system/04_components/18_wizard/` |
| `design_system/components/data-list/` | `design_system/04_components/19_data-list/` |
| `design_system/widgets/` | `design_system/05_widgets/` |

### F2. Non-authority extract

| Old | New |
|---|---|
| `design_system/adapters/web/theme.js` | `adapters/web/theme.js` |
| `design_system/vendor/` (empty) | **DELETE** |
| `design_system/foundation/icons/vendor/tabler/*` | `vendor/tabler/` |
| `design_system/sandbox/` | `ui_tooling/sandbox/` |
| `design_system/workbench/` | `ui_tooling/workbench/` |
| `design_system/scripts/` | `ui_tooling/scripts/` |
| `design_system/index.html` | **DELETE** — nginx/router `/design_system/` → `/ui_tooling/workbench/` |

### F3. Public URL (sau implement)

| Old URL | New URL |
|---|---|
| `/design_system/tokens/generated/css/semantic.css` | `/design_system/01_tokens/02_generated/01_css/semantic.css` |
| `/design_system/foundation/fonts.css` | `/design_system/02_foundation/fonts.css` |
| `/design_system/foundation/icons/vendor/tabler/tabler-icons.min.css` | `/vendor/tabler/tabler-icons.min.css` |
| `/design_system/foundation/icons/vendor/tabler/icon-index.json` | `/vendor/tabler/icon-index.json` |
| `/design_system/foundation/icons/icons.css` | `/design_system/02_foundation/02_icons/icons.css` |
| `/design_system/primitives/avatar/avatar.css` | `/design_system/03_primitives/02_avatar/avatar.css` |
| `/design_system/components/chat/chat.css` | `/design_system/04_components/05_chat/chat.css` |
| `/design_system/adapters/web/theme.js` | `/adapters/web/theme.js` |
| `/design_system/sandbox/assets/reference-layers.css` | `/ui_tooling/sandbox/assets/reference-layers.css` (debt; Pattern phải ngừng link) |
| `/design_system/workbench/` | `/ui_tooling/workbench/` |
| `/design_system/` | 302 → `/ui_tooling/workbench/` |

Wave chuyển tiếp: nginx `rewrite` old → new **permanent** cho đến `LIVE_CONSUMER = 0`.

---

## G. Dependency rewrite impact

| Consumer | Rewrite |
|---|---|
| Mọi `patterns/*/index.html` (và auth states) | `../../design_system/tokens|foundation|primitives|components` → numbered. Tabler → `/vendor/tabler/tabler-icons.min.css`. `adapters/web/theme.js` → `../../adapters/web/theme.js`. **Gỡ** `sandbox/assets/reference-layers.css` khi Pattern visual authority = 0 (wave Pattern, không gộp Wave 1 nếu còn rule sống). |
| `patterns/chat/` | Tabler path `/vendor/tabler/`. Avatar + semantic numbered. |
| `ui_tooling/sandbox/assets/sandbox.js` | `COMPONENT_CSS/JS` `../components/` → `/design_system/04_components/…`. `../primitives/` → `03_`. `../foundation/` → `02_`. `../tokens/` → `01_`. `SANDBOX_DIR` không còn sibling của DS — **cấm** `../components` sau extract. Dùng root-absolute `/design_system/04_components/…`. |
| `ui_tooling/sandbox/playground/preview.html` | `../../tokens` → `/design_system/01_tokens/…` |
| `ui_tooling/workbench/index.html` | `<base href="/ui_tooling/workbench/">`. Link DS = absolute `/design_system/01_tokens/…` (không `../tokens`). |
| `ui_tooling/workbench/workbench.js` | `pathname.indexOf('/design_system/workbench')` → `/ui_tooling/workbench`. `SANDBOX_SECTIONS` **giữ** tên semantic `tokens`… (query `?section=tokens`, không `01_tokens`). |
| `ui_tooling/scripts/build-tokens.mjs` | `REGISTRY_PATH` = `design_system/01_tokens/registry.json`. Header comment path mới. `sourceRoot` / `generatedRoot` trong registry. |
| `01_tokens/registry.json` | `compiler`: `ui_tooling/scripts/build-tokens.mjs`. `sourceRoot`: `design_system/01_tokens/01_source`. `generatedRoot`: `design_system/01_tokens/02_generated`. Platform/module roots **không** đổi (`platform/*/tokens`, `modules/*/tokens`). |
| Generated CSS headers | Rebuild sau đổi path (byte header đổi → `verify-tokens` phải chạy lại). |
| `check-governance.mjs` | `DS` quét 5 nhánh authority. Tabler **ngoài** DS — không còn `SKIP_DIRS` vì nested vendor trong Foundation. |
| `audit-icons.mjs` | `VENDOR` = `vendor/tabler/` (repo root). Meta `source` path mới. |
| `sandbox.js` icon catalog | fetch `/vendor/tabler/icon-index.json` (không `../foundation/icons/vendor/…`). |
| SoT Canonical UI | **Amend §2 only.** README **không** sửa. Pointer `iflux_ui_architecture_readmes/` nếu drift. |
| User_Web / Admin app | **0** href `design_system/` (đã grep). |
| Chat audit 42 | File đích `design_system/components/chat/` → `04_components/05_chat/` khi implement restructure (không sửa 42 trước duyệt). |

---

## H. CI / build / nginx / import impact

| Surface | Impact | Plan |
|---|---|---|
| `.github/workflows/deploy-staging.yml` | Chỉ `cp -a design_system`. Sau extract, **thiếu** `adapters/` + `ui_tooling/` + `vendor/` → 404 theme / workbench / icon. | Thêm `cp -a adapters` `cp -a ui_tooling` `cp -a vendor`. |
| Production deploy | Repo **không** có workflow production copy `design_system` trong `.github/workflows` (chỉ staging). Nginx production `try_files` — nếu prod đã serve `/design_system/` từ cùng model, **cùng** thiếu copy. | Wave implement: rà script prod (nếu có ngoài file này) trước push. |
| `infra/staging-1/iflux-staging-app.conf` | `try_files $uri` đủ nếu file có trên root. Đã có 301 `/design_system/references/patterns/` → `/patterns/`. | 301 old authority paths; `/design_system/workbench/` → `/ui_tooling/workbench/`; `/design_system/foundation/icons/vendor/tabler/` → `/vendor/tabler/`; **`location = /design_system` và `/design_system/`** → `/ui_tooling/workbench/` (không file `index.html` trong DS). |
| Import JS module | 0 ESM `import` giữa layer. Chỉ `<script src>` / `<link>`. | Rewrite href, không bundler. |
| Token compiler | Path cứng `design_system/scripts` + `tokens/source`. | Wave 2 scripts + Wave 1 tokens **phải** cùng PR hoặc scripts đọc cả 2 path (cấm shim lâu). |
| Cloudflare cache | `max-age=14400` CSS. | Query `?v=` hoặc purge sau rename. |

---

## I. Pattern mapping algorithm (hierarchy mới)

Khi map **mọi** Legacy Pattern (Chat và các Pattern còn lại):

```
STEP 0  Xác định RESPONSIBILITY (1 contract = 1 dòng). Không đếm selector.

STEP 1  Chọn ĐÚNG owner:
          Value                    → 01_tokens
          Global / base rule       → 02_foundation
          Small independent object → 03_primitives
          Reusable UI capability   → 04_components
          Reusable functional block→ 05_widgets
        Cấm nhảy layer vì “file kia có CSS gần giống”.

STEP 2  Trong ĐÚNG owner: existing contract?
          YES → REUSE (đúng file numbered).
          NO  → EXTEND CHÍNH OWNER ĐÓ (cùng folder).
        Ownership trước. Tokenization sau.
        Cấm: thiếu DS → để Pattern.
        Cấm: Component đã có → Pattern dựng implementation khác.
        Cấm: mọi hardcode → Token; mọi layout → Foundation; mọi block → Widget.

STEP 3  Pattern compose ở cấp semantic CAO NHẤT phù hợp.
          Chat Pattern → 04_components/05_chat
          Chat được consume 03_avatar, 03_button, 02_icons, 01_tokens.
          Pattern KHÔNG tự compose lại Avatar/Button/type/token nếu Chat đã sở hữu.

STEP 4  VERIFY visual/behavior. REMOVE Legacy (.ix-* --ix-* Admin path).

PATTERN sau canonical:
  - compose contract
  - demo / sample data
  - preview markup + Ifx*.init()
PATTERN không sở hữu:
  token system, primitive, component, widget, reusable visual, reusable behavior

PATTERN_VISUAL_AUTHORITY = 0
```

Gate map:

```
RESPONSIBILITY → CANONICAL OWNER → EXISTING? REUSE : EXTEND OWNER → VERIFY → REMOVE LEGACY
```

Cấm: quét mọi folder → thấy gần giống → reuse.

---

## J. Migration order (không gãy runtime)

Không gộp “rename hết + extract hết” một commit mù.

| Wave | Việc | Runtime stay-up |
|---|---|---|
| **W0** | Owner duyệt. Amend **chỉ** SoT Canonical UI §2. **Không** sửa README. Freeze tree. | — |
| **W1** | Number **authority** (`01_`…`05_` + mọi subfolder còn lại). **Không** tạo `02_icons/01_vendor`. Rewrite href Pattern + sandbox + workbench + token header. Nginx 301 old authority paths. | Workbench/sandbox vẫn trong DS wave này. |
| **W2** | Move `scripts/` → `ui_tooling/scripts/`. Sửa `DS` root + registry `compiler`. `audit-icons` trỏ `vendor/tabler` **sau** W3 hoặc cùng PR W3. | Compiler không serve HTTP. |
| **W3** | Cùng wave non-authority HTTP: `adapters/` → `/adapters/`; Tabler → `/vendor/tabler/`; xóa `foundation/icons/vendor/`; `icons.css` consume `/vendor/tabler/`. Deploy `cp adapters` `cp vendor`. Nginx 301 adapters + old Tabler URL. | Icon/theme 404 nếu quên `cp vendor`. |
| **W4** | Move sandbox + workbench → `ui_tooling/`. Absolute `/design_system/01_…` + `/vendor/tabler/`. `<base>` mới. **Xóa** `design_system/index.html`. Nginx `/design_system/` → workbench. Deploy `cp ui_tooling`. | Bookmark workbench cũ 301. |
| **W5** | DELETE empty `design_system/vendor/`. `LIVE_CONSUMER=0` → gỡ 301 cũ (không bắt buộc cùng release). | — |
| **W6** | Pattern visual: gỡ `reference-layers.css`; Chat mapping task 42 (coverage 95% → README 99%). | Không thuộc restructure folder. |

**Cấm W4 trước W1** (sandbox `../components` gãy nếu đã extract mà chưa absolute).  
**Cấm W1 không 301** (Staging CF cache + bookmark).  
**Cấm tạo folder rỗng** để “đủ số”.

---

## K. SoT / docs khi implement

| Doc | Action |
|---|---|
| `design_system/README.md` | **Không amend** |
| `docs/SoT — Canonical UI Architecture (Design System ↔ Pattern).md` §2 | **Amend** — 5 nhánh numbered; adapters/sandbox/workbench/scripts **ngoài** DS; Tabler = `/vendor/tabler/` |
| V2 Product Architecture | Không đổi ownership Page / product AppShell / specific Widget |
| `iflux_ui_architecture_readmes/design_system/README.md` | Chỉ nếu còn drift so với README live |

Workbench nav: nhãn semantic “Tokens / Foundation / …”. Folder physical `01_tokens`.

---

## L. Gates

```
THIRD_PARTY_INSIDE_DESIGN_SYSTEM        = 0
NON_AUTHORITY_FILE_INSIDE_DESIGN_SYSTEM = 0
README_AMEND_REQUIRED                   = NO
SOT_CANONICAL_UI_AMEND_REQUIRED         = YES
NUMBERED_HIERARCHY                      = FULL
READY_FOR_IMPLEMENTATION                = YES
```

STOP. Chưa implement.
