# P6a — Readiness (trước khi Owner chỉ thị từng file)

**Ngày:** 2026-08-27  
**SOP:** `new_solution.md` / `03_Solution.md`  
**Delivery:** Option B = `sandbox/assets/reference-layers.css`  
**typography.css:** EXECUTION COMPLETE · OWNER_ACCEPTANCE PENDING · `01c_typography_execution.md`  
**utilities.css:** EXECUTION COMPLETE · OWNER_ACCEPTANCE PENDING · `02c_utilities_execution.md`

---

## 1. Hiện trạng `design_system/`

| Layer | Path | CSS files | Vai trò P6a |
|---|---|---|---|
| Tokens | `tokens/generated/css/` | primitives · semantic · dark · light | Global — không đụng trừ Owner chỉ |
| Foundation | `foundation/` | `fonts` · `reset` · `typography` · `layout` · `utilities` · `icons` (+ vendor Tabler) | Hàng đợi Global cleanup |
| Primitives | `primitives/` | button · title · chip · badge · avatar · alert · progress · nav | Hàng đợi |
| Components | `components/` | 18 file (card, table, form, tabs, chart, chat, wizard, …) | Hàng đợi |
| Patterns | `patterns/` | `page-header/page-header.css` | Hàng đợi |
| References | `references/patterns/<name>/index.html` | **0 CSS local · 0 `<style>`** | Consumer — markup only |
| Sandbox catalog | `sandbox/index.html` + `assets/sandbox.css` | Harness `.sb-*` | Simulation surface đã dựng khung rỗng |
| Leftover | `sandbox/patterns/` | chrome/local/entry + 9 HTML P6-v1 | **INVALIDATED** — không phải P6a surface. Chưa xóa |

Không có class `.ref-platform-*` / `.ref-module-*` / `.ref-page-*` / `.ref-widget-*` trong repo trước khi dựng khung.

`typography.css` đã rollback về `4741d70` (426 dòng). Execution P6a trước đó không còn trên implementation.

---

## 2. Reference map (path thật — khác sơ đồ trong Solution §3)

| Wave | Folder thật | Candidate |
|---|---|---|
| W01 | `table-list/` | `references/patterns/table-list/` |
| W02 | `form-add/` | `references/patterns/form-add/` |
| W03 | `order-list/` | `references/patterns/order-list/` |
| W04 | `order-detail/` | `references/patterns/order-detail/` |
| W05 | `user-profile/` (không phải `user-account`) | `references/patterns/user-profile/` |
| W06 | `wizard/` | `references/patterns/wizard/` |
| W07 | `chat/` | `references/patterns/chat/` |
| W08 | `referrals/` | `references/patterns/referrals/` |
| W09 | `charts/` | `references/patterns/charts/` |
| W10 | `auth/` | `references/patterns/auth/` |

Mỗi file là **HTML document độc lập** (link P1–P5 CSS). Catalog chỉ **link ra** candidate — không iframe, không nhúng markup vào `sandbox/index.html`.

---

## 3. Đã chuẩn bị

- [x] SOP chính thức = `03_Solution.md` (copy từ `new_solution.md`)
- [x] Khung 4 layer + 10 pattern subsection **rỗng** trong `sandbox/index.html` `<style>`
- [x] Không invent selector `.ref-*`
- [x] Không sửa Global CSS
- [x] Không đổi Reference HTML

---

## 4. Blocker — CSS trong `index.html` không tới candidate

`<style>` trong `sandbox/index.html` chỉ áp catalog (`sandbox/?section=…`).

Owner test URL hiện tại là trang riêng, ví dụ:

`https://staging.iflux.vn/design_system/references/patterns/order-list/`

Trang đó **không** load `sandbox/index.html` → MOVE CSS xuống block Sandbox sẽ **không** hiện trên candidate trừ khi Owner chốt một delivery.

| Option | Cách | Trade-off |
|---|---|---|
| **A — literal SoT** | Chỉ `<style>` trong `sandbox/index.html` | Phải đổi cách xem W01–W10 (nhúng/iframe vào catalog). URL candidate hiện tại không nhận simulation CSS |
| **B — cùng surface, load được** | Giữ SoT trong Sandbox; tách block ra file dưới `sandbox/assets/` và **link** từ `index.html` + 10 reference HTML | Candidate URL hiện tại vẫn chạy. Một file simulation, không phải Global |
| **C** | Copy `<style>` vào từng Reference | Cấm — Solution §11 / §20 (không rải CSS 10 file) |

Agent **không** tự chọn. Cần Owner chốt A / B / C trước MOVE đầu tiên.

---

## 5. Hàng đợi file Global (Owner gửi từng file)

Thứ tự không phải thứ tự thi công — Owner chỉ định.

**Foundation:** `typography.css` · `layout.css` · `utilities.css` · `reset.css` · `fonts.css` · `icons.css`

**Primitives:** `button.css` · `title.css` · `chip.css` · `badge.css` · `avatar.css` · `alert.css` · `progress.css` · `nav.css`

**Components:** `card` · `table` · `form` · `tabs` · `chart` · `chat` · `wizard` · `stat` · `stat-strip` · `search` · `pagination` · `dropdown` · `modal` · `drawer` · `toast` · `timeline` · `breadcrumb` · `action-bar`

**Patterns:** `page-header.css`

Khi gửi một file, Owner + Architect chốt từng rule:

`KEEP GLOBAL` | `DELETE` | `MOVE TO PLATFORM` | `MOVE TO MODULE` | `MOVE TO PAGE` | `MOVE TO WIDGET`

Agent chỉ audit evidence + execute đúng allocation.

---

## 6. Consumer cần nhớ khi đụng `typography.css` (audit sẵn, không phải approved list)

| Class | Consumer Canonical DS |
|---|---|
| `.ifx-typo-price-s` / `-m` | W03 order-list · W04 order-detail · W08 referrals · Sandbox Foundation demo |
| `.ifx-typo-title-*` / `body-*` / `label-*` | Nhiều W01–W08 + Sandbox |
| `.ifx-typo-h*` / table / status / timestamp | Sandbox Foundation demo only |
| `--ifx-text-btn-*` | `button.css` (class `.ifx-typo-btn-*` = 0 HTML) |

File plan cũ `css-normalization/01_typography.md` = **preliminary findings**. Không dùng làm approved allocation.

---

## 7. Agent chờ

1. Owner chốt delivery **A / B / C**
2. Owner gửi file đầu tiên + allocation từng rule

Không tự mở file. Không tự classify.
