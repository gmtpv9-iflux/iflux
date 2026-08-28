# Plan — Design System ↔ Pattern Separation

**Mode:** AUDIT + MIGRATION + DOCUMENTATION  
**Code:** CHƯA THI CÔNG — chờ Owner duyệt plan này.  
**SoT khóa:** [`docs/SoT — Canonical UI Architecture (Design System ↔ Pattern).md`](../../../../../../../docs/SoT%20—%20Canonical%20UI%20Architecture%20(Design%20System%20↔%20Pattern).md)

Cấp trên: [`docs/SoT — iFlux Product Architecture (V2).md`](../../../../../../../docs/SoT%20—%20iFlux%20Product%20Architecture%20(V2).md)

---

## 0. Owner lock đã chốt (2026-08-28)

| # | Quyết định |
|---|---|
| 1 | `page-header` → `design_system/components/page-header/` |
| 2 | `data-list` → `design_system/components/data-list/` |
| 3 | Workbench 1 AppShell; route canonical `?area=design-system` / `?area=patterns`; iframe `/patterns/…`; alias `module=` |
| 4 | Sandbox chỉ Tokens / Foundation / Primitives / Components / Widgets / Visual / Contract. Bỏ Patterns + References khỏi primary. |
| 5 | `reference-layers.css` = LEGACY COMPATIBILITY DEBT. Chỉ giảm, không tăng. Không clean hết wave này. |
| 6 | `manifests/` **không tạo**. OPTIONAL / NOT ESTABLISHED. |

Ngoài 6 câu: `patterns/widgets/` reserved — không tạo folder rỗng. Deploy **bắt buộc** copy `patterns/`. Docs path cập nhật trong cùng task.

**Review 2026-08-28:** tách PRE-SHIP / POST-DEPLOY; freeze `reference-layers.css` sau Pattern root move; xóa obsolete chỉ khi `LIVE_CONSUMER = 0`. Xem §7 và §12.

---

## 1. Phạm vi / ngoài phạm vi

### Làm

- Structural migration path
- Update href / route / iframe / CI / nginx redirect
- Hai README
- `design_system/widgets/README.md` (scope only, không invent chrome CSS)
- Sandbox nav + demo Page Header / Data List → Components
- Debt register `reference-layers.css`
- Orphan scan
- Visual / route regression
- Report A–P + PRE-SHIP gates (local)
- Commit + push `staging` → deploy
- POST-DEPLOY smoke/regression trên Staging
- FINAL architecture lock chỉ sau POST-DEPLOY PASS

### Không làm

- Rebuild Chat
- Canonicalize Auth / parity mới
- Sửa User Profile visual / behavior / mapping
- Tạo business runtime
- Tách `reference-layers.css` vào từng pattern-local.css
- Tạo `design_system/manifests/`
- Tạo specific widget template
- Invent generic widget shell CSS nếu chưa có requirement

---

## 2. Inventory trước migration (A)

### 2.1 Design System hiện tại

```
design_system/
  index.html                    → workbench/
  adapters/web/theme.js
  tokens/{source,generated,registry.json}
  foundation/{fonts,icons,reset,typography,layout}
  primitives/{alert,avatar,badge,button,chip,navigation,progress,title}
  components/{action-bar,breadcrumb,card,chart,chat,drawer,dropdown,form,
              modal,pagination,search,stat,table,tabs,timeline,toast,wizard}
  patterns/
    page-header/page-header.css
    data-list/data-list.js
  references/patterns/
    auth/          {index,login,register,forgot,verify-2fa}.html + page.js
    charts/        index.html + page.js
    chat/          index.html + page.js          ← W07 sai; move as-is
    form-add/      index.html + page.js
    order-detail/  index.html + page.js
    order-list/    index.html + page.js
    referrals/     index.html + page.js
    table-list/    index.html + page.js
    user-profile/  index.html + user-profile.css + user-profile.js
    wizard/        index.html + page.js
    _up_base_82a7586/   forensic snapshot — không catalog
    _up_base_a733c0a/   forensic snapshot — không catalog
  sandbox/
    assets/{reference-layers.css,sandbox.css,sandbox.js}
    sections/{tokens,foundation,primitives,components,patterns,references,visual,contract}
    patterns/      leftover HTML cũ (P6 invalidated) — không phải destination
    playground/
    index.html
  workbench/{index.html,workbench.css,workbench.js}
  scripts/{build-tokens,verify-tokens,audit-icons,check-governance}
```

Chưa có: `design_system/widgets/`, `design_system/manifests/`, repo-root `patterns/`.

### 2.2 Consumer — page-header

| Consumer | Link hiện tại |
|---|---|
| `references/patterns/{form-add,chat,table-list,order-detail,order-list,charts,wizard,referrals}/index.html` | `../../../patterns/page-header/page-header.css` |
| `sandbox/assets/sandbox.js` | `../patterns/page-header/page-header.css` |
| `sandbox/sections/patterns.html` | markup demo |

User Profile **không** consume page-header.

### 2.3 Consumer — data-list

| Consumer | Link hiện tại |
|---|---|
| `table-list`, `order-list`, `referrals` `index.html` | `../../../patterns/data-list/data-list.js` |
| `sandbox.js` | `../patterns/data-list/data-list.js` |
| `components/table/table.js` | comment composer path |

### 2.4 Consumer — `reference-layers.css`

Mọi pattern HTML (trừ User Profile + `_up_base_*`) link:

`../../../sandbox/assets/reference-layers.css`

Workbench `index.html` cũng link file này (viewer chrome — giữ, không thêm rule).

User Profile consume DS token/primitive/component bằng `../../../tokens|primitives|components/…` — **không** link `reference-layers.css`.

### 2.5 Leftover / archive

| Path | Phân loại | Hành động wave này |
|---|---|---|
| `references/patterns/_up_base_*` | Forensic archive | Move kèm, **không** nav Workbench |
| `sandbox/patterns/*.html` + `js/` + `assets/` | Dead leftover P6 cũ | Orphan scan. Không xóa nếu chưa evidence 0 ref. Debt. |
| `sandbox/sections/patterns.html` | Compose catalog | Ngừng load. Demo page-header/data-list chuyển Components. Compose page → Workbench Patterns. **Xóa chỉ khi LIVE_CONSUMER = 0** (Phase 8). |
| `sandbox/sections/references.html` | Wave notes | Ngừng load. Không primary. **Xóa chỉ khi LIVE_CONSUMER = 0** (Phase 8). |

### 2.6 Deploy hiện tại

`.github/workflows/deploy-staging.yml` chỉ:

```
cp -a "$GITHUB_WORKSPACE/design_system" "$RELEASE_DIR/design_system"
```

Không copy `patterns/` → staging `/patterns/` sẽ 404 nếu thiếu bước này.

Nginx Staging 1: `location / { try_files $uri $uri/ =404; }` — đủ nếu file có trên web root.

---

## 3. Target tree thực tế (B)

```
design_system/
├── README.md                          ← tạo
├── tokens/                            giữ
├── foundation/                        giữ
├── primitives/                        giữ
├── components/
│   ├── … (hiện có)
│   ├── page-header/page-header.css    ← từ patterns/page-header
│   └── data-list/data-list.js         ← từ patterns/data-list
├── widgets/
│   └── README.md                      ← scope only
├── adapters/                          giữ
├── sandbox/                           nav chuẩn hóa
├── workbench/                         area= + iframe /patterns/
└── scripts/                           giữ

patterns/
├── README.md                          ← tạo
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
├── _up_base_82a7586/                  unlisted
└── _up_base_a733c0a/                  unlisted
```

Obsolete source **không** xóa vì “folder empty”.

Thứ tự xóa khóa (Phase 8):

```
move → rewrite consumers → repo-wide old-path scan → LIVE_CONSUMER = 0 → delete
```

Áp dụng cho: `design_system/patterns/`, `design_system/references/`, `sandbox/sections/patterns.html`, `sandbox/sections/references.html`.

Không tạo: `design_system/manifests/`, `patterns/widgets/`.

---

## 4. Mapping old → new (C)

### 4.1 Folder

| Cũ | Mới |
|---|---|
| `design_system/patterns/page-header/` | `design_system/components/page-header/` |
| `design_system/patterns/data-list/` | `design_system/components/data-list/` |
| `design_system/references/patterns/<id>/` | `patterns/<id>/` |
| `design_system/references/patterns/_up_base_*` | `patterns/_up_base_*` |

`<id>` ∈ auth, charts, chat, form-add, order-detail, order-list, referrals, table-list, user-profile, wizard.

Dùng `git mv` để giữ lịch sử.

### 4.2 Href rewrite (depth đổi)

Từ `design_system/references/patterns/<id>/` (`../../../` = `design_system/`):

Sang `patterns/<id>/`:

| Loại | Cũ (trong file pattern) | Mới |
|---|---|---|
| DS token / foundation / primitive / component | `../../../tokens/…` `../../../primitives/…` `../../../components/…` | `../../design_system/tokens/…` (cùng suffix) |
| page-header | `../../../patterns/page-header/page-header.css` | `../../design_system/components/page-header/page-header.css` |
| data-list | `../../../patterns/data-list/data-list.js` | `../../design_system/components/data-list/data-list.js` |
| reference-layers | `../../../sandbox/assets/reference-layers.css` | `../../design_system/sandbox/assets/reference-layers.css` |

User Profile: **chỉ** nhóm token / primitive / component. Không đụng markup, class, local css/js, thứ tự title/breadcrumb.

`_up_base_*`: cùng luật href nếu file còn `../../../`. Không catalog.

Sandbox:

| Cũ | Mới |
|---|---|
| `../patterns/page-header/page-header.css` | `../components/page-header/page-header.css` |
| `../patterns/data-list/data-list.js` | `../components/data-list/data-list.js` |

Workbench iframe:

| Cũ | Mới |
|---|---|
| `../references/patterns/<id>/<file>` | `/patterns/<id>/<file>` |

### 4.3 Workbench URL (H)

Canonical:

```
/design_system/workbench/?area=design-system&section=tokens
/design_system/workbench/?area=design-system&section=components&panel=page-header
/design_system/workbench/?area=patterns&pattern=auth&state=login
/design_system/workbench/?area=patterns&pattern=user-profile
```

Normalize (replaceState, không 404):

- `module=sandbox` → `area=design-system`
- `module=patterns` → `area=patterns`
- `section=patterns` hoặc `section=references` → `section=components` (section đã bỏ)

Nav group label: **Design System** / **Patterns**.  
Title: `Design System · Components`, `Patterns · Auth · Login`.  
Thêm nav item **Widgets** (section `widgets`) — panel empty-state nếu chưa có contract.

Auth switcher: `?area=patterns&pattern=auth&state=…`

### 4.4 Staging URL

| Cũ | Mới |
|---|---|
| `https://staging.iflux.vn/design_system/references/patterns/<id>/` | `https://staging.iflux.vn/patterns/<id>/` |

Nginx: 301 prefix

```
/design_system/references/patterns/ → /patterns/
```

---

## 5. Audit `design_system/patterns/*` (D, E, F)

| Artifact | Class | Destination | Xóa source |
|---|---|---|---|
| `page-header` | A — reusable Component | `design_system/components/page-header/` | Chỉ Phase 8, `LIVE_CONSUMER = 0` |
| `data-list` | A — reusable Component | `design_system/components/data-list/` | Chỉ Phase 8, `LIVE_CONSUMER = 0` |

Không B (widget). Không C (template). Không D (dead).

---

## 6. `reference-layers.css` debt register (G)

**Owner file:** Design System Sandbox (debt host).  
**Freeze (Phase 3b, sau Pattern root migration):** file = LEGACY COMPATIBILITY DEBT = **NO NEW RULE**.  
Từ architecture lock trở đi: **chỉ giảm, không tăng**.  
Task này không clean toàn bộ. Không xóa block hiện có. Chỉ được sửa comment header (DEBT + freeze).

| Block prefix | Layer cũ | Pattern owner | Consumer HTML | Wave này | Target dần |
|---|---|---|---|---|---|
| `.ref-platform-auth` | PLATFORM | `patterns/auth/` | auth `*.html` | GIỮ | `patterns/auth/` local CSS |
| `.ref-module-order-*` | MODULE | `patterns/order-list/` + `order-detail/` | W03 W04 | GIỮ | pattern-local |
| `.ref-module-chat-*` | MODULE | `patterns/chat/` | chat | GIỮ — Chat rebuild sau **không** thêm block mới | pattern-local hoặc DS generic |
| `.ref-module-referral-*` | MODULE | `patterns/referrals/` | referrals | GIỮ | pattern-local |
| `.ref-page-table-list-primary` | PAGE | `patterns/table-list/` | table-list | GIỮ | pattern-local |
| form-add / wizard comments | PAGE | — | empty | GIỮ comment; không fill | delete khi audit dead |
| `.ref-page-order-detail-*` | PAGE | `patterns/order-detail/` | order-detail | GIỮ | pattern-local |
| `.ref-page-user-profile-*` | PAGE | `patterns/user-profile/` | **không** link file này trên UP hiện tại | GIỮ; đánh dấu có thể dead | confirm rồi xóa |
| `.ref-page-chat-*` | PAGE | `patterns/chat/` | chat | GIỮ | Chat rebuild → local / DS |
| `.ref-page-referrals-*` | PAGE | `patterns/referrals/` | referrals | GIỮ | pattern-local |
| `.ref-page-auth-*` | PAGE | `patterns/auth/` | auth | GIỮ — không canonicalize Auth | pattern-local |
| `.ref-widget-series-compare` | WIDGET | `patterns/charts/` | charts | GIỮ | `patterns/charts/` local |
| `.ref-page-charts-ohlc` | PAGE | `patterns/charts/` | empty body | GIỮ; candidate dead | confirm rồi xóa |

Workbench link file: **không** thêm selector. Chỉ để iframe theme/context nếu cần; ưu tiên bỏ link Workbench ở debt sau nếu chứng minh 0 rule dùng ngoài iframe.

Deliverable thi công: ghi register này vào report + comment đầu file (DEBT, freeze add).

---

## 7. FINAL_PHASE_ORDER

Thứ tự khóa. Không đảo. Không verify Staging trước commit.

```
LOCAL migration
  → LOCAL orphan / regression
  → PRE-SHIP gates
  → commit
  → push staging
  → deploy
  → STAGING smoke / regression
  → FINAL architecture lock
```

`PRE-SHIP PASS` và `POST-DEPLOY PASS` là hai gate set riêng.  
`ARCHITECTURE_READY_FOR_CHAT_REBUILD` chỉ YES sau **POST-DEPLOY PASS**.

### Phase 0 — Freeze + preflight (local)

- Branch: `staging`.
- Không đụng Chat HTML/CSS/JS nội dung, Auth visual, User Profile visual.
- Snapshot list file + `git status` phạm vi (chỉ file architecture).
- Xác nhận local preview sẵn (ví dụ `http://127.0.0.1:8901/`).

### Phase 1 — README + widgets scope (local)

1. Tạo `design_system/README.md` đúng SoT §3–§5, §10.
2. Tạo `patterns/README.md` đúng SoT §4–§5 (folder `patterns/` tạo bởi README hoặc `git mv` đầu tiên).
3. Tạo `design_system/widgets/README.md`: generic chrome only; cấm specific widget; **MANIFESTS = OPTIONAL / NOT ESTABLISHED**.
4. Không tạo `manifests/`. Không tạo `patterns/widgets/`.

### Phase 2 — Component moves + rewrite consumers (local)

1. `git mv design_system/patterns/page-header` → `design_system/components/page-header`
2. `git mv design_system/patterns/data-list` → `design_system/components/data-list`
3. Rewrite consumer: `sandbox.js`, comment `table.js`, pattern HTML vẫn còn ở `references/patterns/` (href page-header / data-list tạm trỏ `../../../components/…` nếu rewrite lúc này; hoặc gộp rewrite vào Phase 3 cùng depth mới).
4. Copy demo Page Header + Data List vào `sections/components.html` (panel `page-header`, `data-list`). Không chuyển record-detail / entity-form / conversation / order-history.
5. **Không xóa** `design_system/patterns/` ở phase này — kể cả khi folder trống.

### Phase 3 — Pattern root moves + rewrite consumers (local)

1. `git mv` từng `design_system/references/patterns/<id>` → `patterns/<id>` (kể cả `_up_base_*`).
2. Rewrite href theo §4.2. **Không** format/prettify HTML ngoài path.
3. User Profile: diff chỉ được là path string.
4. **Không xóa** `design_system/references/` ở phase này — kể cả khi folder trống.

### Phase 3b — Freeze `reference-layers.css` (local, bắt buộc sau Phase 3)

Ngay sau Pattern root migration:

1. Ghi header: **LEGACY COMPATIBILITY DEBT** + **NO NEW RULE**.
2. Không thêm selector / block / declaration.
3. Không xóa block hiện có (clean dần task khác).
4. Từ thời điểm này (và sau architecture lock): file **chỉ được giảm, không được tăng**.

### Phase 4 — Workbench (local)

1. `workbench.js`: `area` canonical; alias `module`; bỏ `patterns`/`references` khỏi `SANDBOX_SECTIONS`; thêm `widgets`.
2. `workbench/index.html`: group label Design System / Patterns; nav Widgets; href `area=`; auth tabs `area=`.
3. `mountPattern`: `src = '/patterns/' + id + '/' + file`.
4. Title / brand: không suy ra Patterns ⊂ Design System. Không đổi visual canvas Pattern.

### Phase 5 — Sandbox (local)

1. `sandbox.js` `SECTIONS` = tokens, foundation, primitives, components, widgets, visual, contract.
2. Tạo `sections/widgets.html` empty-state. Không invent UI comment trên canvas.
3. Ngừng **load/serve** `sections/patterns.html` và `sections/references.html` (gỡ khỏi router / nav). **Không xóa file** ở phase này.
4. Sửa link `visual.html` / `contract.html` → `section=components&panel=data-list`.
5. `sandbox/index.html` redirect: `module=sandbox` → `area=design-system`.

### Phase 6 — Deploy artifacts (local write only)

Chỉ **viết** file CI / nginx. Không verify Staging. Không tuyên bố architecture lock.

1. `deploy-staging.yml`: thêm `cp -a "$GITHUB_WORKSPACE/patterns" "$RELEASE_DIR/patterns"` (khi folder tồn tại).
2. `infra/staging-1/iflux-staging-app.conf`: 301 `/design_system/references/patterns/` → `/patterns/`.
3. Có thể thêm health curl `/patterns/user-profile/` vào workflow — chạy **sau** deploy, không phải điều kiện PRE-SHIP.

### Phase 7 — Docs path (local)

Cập nhật path string, thêm 1 dòng “moved YYYY-MM-DD”:

- `gates/P6.md` + `P6-W01` … `P6-W10`
- `30_chat_legacy_rebuild_plan.md` — path + cấm thêm `reference-layers`; ownership 4 bậc SoT §12
- `29_auth_size_parity_proposal.md` — path only
- `02_CSS_Ownership_Rules_SoT.md` — header: Pattern không còn layer DS; §17 supersede → SoT UI Architecture
- `28_design_system_workbench.md` — query `area=`

Không rewrite lịch sử PASS/FAIL của wave cũ.

### Phase 8 — LOCAL old-path scan + delete obsolete (chỉ khi LIVE_CONSUMER = 0)

Thứ tự **bắt buộc** cho mỗi obsolete path:

```
move (đã xong Phase 2–3)
→ rewrite consumers (đã xong Phase 2–5)
→ repo-wide old-path scan
→ LIVE_CONSUMER = 0
→ mới delete
```

“Folder empty” **không** đủ để xóa.

Scan sống (HTML / JS / CSS / YML / script / test — không tính docs archive đã stamped):

```
design_system/references/patterns/
design_system/patterns/
../references/patterns/
sandbox/sections/patterns.html
sandbox/sections/references.html
?module=sandbox&section=patterns
?module=sandbox&section=references
```

Obsolete candidates — xóa **từng cái** chỉ khi scan ra `LIVE_CONSUMER = 0` cho path đó:

- `design_system/patterns/`
- `design_system/references/` (cả cây)
- `sandbox/sections/patterns.html`
- `sandbox/sections/references.html`

Nếu còn 1 live consumer → **không xóa**, ghi nợ, PRE-SHIP `ORPHAN_PATTERN_PATHS` FAIL cho đến khi rewrite xong.

`sandbox/patterns/**` leftover P6: cùng luật. Không evidence 0 ref → giữ debt, không xóa.

### Phase 9 — LOCAL orphan + regression

Workbench local:

- Design System: Tokens, Foundation, Primitives, Components (page-header, data-list), Widgets empty-state, Visual, Contract
- Patterns: Auth (4 state), Charts, Chat (W07 as-is), Form Add, Order Detail, Order List, Referrals, Table List, User Profile, Wizard
- Hard refresh, back/forward
- Alias `?module=patterns&pattern=user-profile` vẫn mở đúng

User Profile local: layout / typography / spacing / interaction không lệch do path.  
Chat lệch visual sẵn = chấp nhận. Chỉ fix path.

`ORPHAN_PATTERN_PATHS` (local, hit sống) target **0**.

### Phase 10 — PRE-SHIP gates + commit + push

1. Chấm **PRE-SHIP gates** (§12.1). FAIL → không commit.
2. Report A–P phần local (ghi rõ PRE-SHIP, chưa FINAL).
3. Commit phạm vi architecture only.
4. Push `github/staging`.
5. Deploy do CI. **Không** đợi Staging để gọi PRE-SHIP PASS.  
6. **Không** set `ARCHITECTURE_READY_FOR_CHAT_REBUILD = YES` ở phase này.

### Phase 11 — STAGING smoke / regression (POST-DEPLOY)

Sau CI deploy xong:

- `/patterns/user-profile/` 200
- `/patterns/auth/login.html` 200
- Workbench `?area=design-system&section=components`
- Workbench `?area=patterns&pattern=auth&state=login` + 4 auth state
- Workbench mọi pattern catalog
- 301 `/design_system/references/patterns/<id>/` → `/patterns/<id>/`
- Alias `?module=` normalize
- User Profile staging: `USER_PROFILE_VISUAL_DELTA = 0`
- Chat resolve path (không rebuild)

### Phase 12 — FINAL architecture lock

Chấm **POST-DEPLOY gates** (§12.2).  
PASS hết → `ARCHITECTURE_LOCK = PASS` và `ARCHITECTURE_READY_FOR_CHAT_REBUILD = YES`.  
FAIL → không unlock Chat; fix path / deploy; không canonicalize.

**STOP** sau FINAL lock. Không rebuild Chat / Auth / User Profile visual.

---

## 8. Sandbox / Workbench change list (I, H)

| Surface | Đổi |
|---|---|
| Workbench nav | 2 group ngang hàng; thêm Widgets; bỏ Compose / Wave notes |
| Workbench route | `area=` + alias `module=` |
| Workbench iframe | `/patterns/…` |
| Sandbox sections | −patterns −references +widgets |
| Sandbox components | +panel page-header, data-list |
| `reference-layers.css` | header DEBT + freeze; nội dung rule giữ |

---

## 9. README — checklist nội dung (J, K)

### `design_system/README.md`

- Title: Canonical iFlux Design System
- DS = SoT reusable UI contracts
- DS không sở hữu specific Pattern / Page / Widget implementation
- Layer: Tokens, Foundation, Primitives, Components, Widgets generic
- Dependency: consumers → DS; DS ↛ Pattern
- Naming `.ifx-*` chỉ trong DS
- CSS/JS ownership: colocate theo layer
- Bảng “khi nào thêm / không thêm” (SoT §3.1)
- MANIFESTS = OPTIONAL / NOT ESTABLISHED
- `reference-layers.css` = debt, chỉ giảm

### `patterns/README.md`

- Pattern = Canonical Template Library
- Công năng 5 ý SoT §4
- Được local HTML/CSS/JS
- Không phải DS layer / Global Component / production runtime
- Sơ đồ `Pattern → Design System` (không ngược)
- Danh sách pattern catalog (không gồm `_up_base_*`)
- Chat: artifact hiện tại chưa canonical; rebuild sau

---

## 10. Import / link / orphan (L, M)

Ngoài pattern HTML + workbench + sandbox:

- Mọi `href` / `src` / comment sống trong `design_system/**/*.{html,js,css}`
- `.github/workflows/deploy-staging.yml`
- `infra/staging-1/*.conf`
- Test / script nếu có
- Docs path (Phase 7)

Không xóa `sandbox/sections/references.html` khi còn live link. Phase 8: scan → `LIVE_CONSUMER = 0` → mới xóa.

---

## 11. File changed / moved / deleted — dự kiến (P)

**Tạo**

- `design_system/README.md`
- `patterns/README.md`
- `design_system/widgets/README.md`
- `design_system/sandbox/sections/widgets.html`

**git mv**

- `design_system/patterns/page-header` → `design_system/components/page-header`
- `design_system/patterns/data-list` → `design_system/components/data-list`
- 10 pattern + 2 `_up_base_*` → `patterns/`

**Sửa path / route / nav**

- Mọi `patterns/*/index.html` (+ auth 4 file, + `_up_base` nếu cần)
- `workbench/index.html`, `workbench.js`
- `sandbox.js`, `sandbox/index.html`
- `sections/components.html`, `visual.html`, `contract.html`
- `components/table/table.js` (comment)
- `reference-layers.css` (header only)
- `deploy-staging.yml`
- `iflux-staging-app.conf`
- Docs Phase 7

**Xóa — chỉ Phase 8, từng path, `LIVE_CONSUMER = 0` (không đủ “folder empty”)**

- `design_system/patterns/`
- `design_system/references/` (cả cây)
- `sandbox/sections/patterns.html`
- `sandbox/sections/references.html`

**Không xóa wave này (debt)**

- `sandbox/patterns/**` (nếu orphan scan còn nghi)
- Nội dung rule `reference-layers.css`

**Không tạo**

- `design_system/manifests/`
- `patterns/widgets/`

---

## 12. Gates

Hai set. Không gộp.

### 12.1 PRE_SHIP_GATES (local — điều kiện commit / push)

| Gate | PASS khi |
|---|---|
| `DESIGN_SYSTEM_PATTERN_SEPARATION` | Hai root local; Pattern không nằm trong DS |
| `DESIGN_SYSTEM_README` | File đúng SoT |
| `PATTERN_README` | File đúng SoT |
| `GLOBAL_PATTERN_LAYER_REMOVED_OR_CLASSIFIED` | page-header + data-list ở Components; obsolete source chỉ xóa nếu Phase 8 `LIVE_CONSUMER = 0` |
| `WORKBENCH_ROUTING_LOCAL` | `area=` + alias + iframe `/patterns/` + refresh/history **local** |
| `SANDBOX_SCOPE_NORMALIZED` | 7 section; không Patterns/References primary |
| `REFERENCE_LAYERS_FROZEN` | Header DEBT + NO NEW RULE; không thêm rule sau Phase 3b |
| `USER_PROFILE_REGRESSION_LOCAL` | Visual/behavior delta 0 **local** |
| `ORPHAN_PATTERN_PATHS` | 0 hit sống trong repo (code/CI/nginx/test) |
| `CLEANUP_LIVE_CONSUMER` | Mọi path đã xóa có evidence `LIVE_CONSUMER = 0`; path chưa 0 thì còn file |
| `PRE_SHIP` | Mọi gate trên PASS |

`PRE_SHIP = PASS` → được commit + push.  
`PRE_SHIP = FAIL` → không commit.

**Không** gồm Staging HTTP. **Không** set `ARCHITECTURE_READY_FOR_CHAT_REBUILD`.

### 12.2 POST_DEPLOY_GATES (sau CI deploy Staging)

| Gate | PASS khi |
|---|---|
| `STAGING_PATTERNS_RESOLVE` | `/patterns/<id>/` 200 cho mọi catalog pattern |
| `STAGING_OLD_PATH_REDIRECT` | `/design_system/references/patterns/…` → 301 `/patterns/…` |
| `STAGING_DEPLOY_COPY` | Release có `patterns/` (không 404 vì thiếu `cp`) |
| `WORKBENCH_ROUTING_STAGING` | 2 area + Auth 4 state + hard refresh + history trên Staging |
| `USER_PROFILE_REGRESSION_STAGING` | `USER_PROFILE_VISUAL_DELTA = 0` trên Staging |
| `PATTERN_ROUTE_REGRESSION_STAGING` | Mọi pattern catalog resolve đúng |
| `POST_DEPLOY` | Mọi gate trên PASS |

### 12.3 CHAT_REBUILD_UNLOCK_CONDITION

```
ARCHITECTURE_READY_FOR_CHAT_REBUILD = YES
  chỉ khi PRE_SHIP = PASS
     VÀ POST_DEPLOY = PASS
     VÀ FINAL architecture lock (Phase 12) đã ghi
```

Trước POST-DEPLOY PASS: giá trị = **NO**.  
Không unlock từ PRE-SHIP. Không unlock từ “folder empty”.

---

## 13. Report bắt buộc

**Sau Phase 10 (PRE-SHIP):** A–P local + bảng PRE_SHIP_GATES. Ghi `ARCHITECTURE_READY_FOR_CHAT_REBUILD = NO`.

**Sau Phase 12 (FINAL):** bổ sung POST_DEPLOY_GATES + `ARCHITECTURE_LOCK` + `CHAT_REBUILD_UNLOCK_CONDITION`.

Link SoT + plan này. Không tự mở file.

---

## 14. Rủi ro

| Rủi | Mitigation |
|---|---|
| Verify Staging trước push = vòng | PRE-SHIP chỉ local; Staging = Phase 11 |
| Staging 404 `/patterns/` | Phase 6 viết `cp`; chứng minh ở POST-DEPLOY |
| Xóa source khi còn consumer | Phase 8: scan → `LIVE_CONSUMER = 0` → mới xóa |
| Thêm rule `reference-layers.css` | Phase 3b freeze NO NEW RULE |
| User Profile href sai depth | Diff whitelist path-only; local rồi staging |
| Bookmark `?module=` | Alias normalize |
| Chat trông vẫn sai | Chấp nhận — không rebuild |
| Sửa nhầm visual khi “tidy HTML” | Cấm format ngoài path |
| Working tree bẩn | Commit **chỉ** file architecture |

---

## 15. STOP conditions

Sau FINAL architecture lock (Phase 12):

- Không rebuild Chat (trừ khi Owner mở task mới **và** `ARCHITECTURE_READY_FOR_CHAT_REBUILD = YES`)
- Không canonicalize Auth
- Không sửa User Profile visual
- Không tạo business runtime
- Không thêm block `reference-layers.css`
