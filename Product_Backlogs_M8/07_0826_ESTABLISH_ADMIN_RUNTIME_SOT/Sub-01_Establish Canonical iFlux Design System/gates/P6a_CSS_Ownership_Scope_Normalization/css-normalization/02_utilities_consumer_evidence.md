# P6a — `utilities.css` consumer evidence

**Scope:** `design_system/**` · **Không classify.**  
**File:** `design_system/foundation/utilities.css`  
**Nguồn:** HTML + CSS/JS consume class (token consume không tính class consumer).

---

## 1. Padding

Mọi `.ifx-p-*` numeric/semantic = `padding: … !important`.

| Class | Consumer path | Element | Pattern | Parent / context | Override khác? | Nếu bỏ class, padding từ đâu |
|---|---|---|---|---|---|---|
| `.ifx-p-24` | W01–W10 `references/patterns/*/index.html` `<main>` | `<main class="ifx-container ifx-container-max ifx-p-24">` | cả 10 Reference | Page frame | **Có.** `.ifx-container` (`layout.css`) set `padding-inline: var(--ifx-space-container)` (responsive 16→32). `.ifx-p-24` `!important` thắng **mọi cạnh** = 24 cố định | Chỉ `padding-inline` từ `.ifx-container`; **không** có `padding-block` trên container |
| `.ifx-p-16` | `references/patterns/chat/index.html` | `<div class="ifx-p-16">` | W07 | Con `.ifx-chat-thread`; chứa avatar + search | `.ifx-chat-thread` không set padding. `.ifx-card-body` không bọc node này | 0 (thread không inset) |
| `.ifx-p-16` | same | `<p class="ifx-p-16 ifx-mb-0">` ×2 (“Hội thoại” / “Danh bạ”) | W07 | Trong `.ifx-chat-thread` | `p` không có padding Foundation. `!important` thắng nếu sau này bọc card-body | 0 |
| `.ifx-p-0` `.ifx-p-2` `.ifx-p-4` `.ifx-p-8` `.ifx-p-12` `.ifx-p-20` `.ifx-p-32` | — | — | — | — | — | 0 HTML |
| `.ifx-p-xs` `.ifx-p-sm` `.ifx-p-md` `.ifx-p-lg` `.ifx-p-xl` | — | — | — | — | — | 0 HTML. Token `--ifx-padding-*` **có** CSS owner khác (sandbox chrome) — xem bảng 4 |

Không có element gắn đồng thời `.ifx-p-16` + `.ifx-p-md`.

---

## 2. Margin

Mọi `.ifx-m-*` / `mt` / `mb` = `margin[-*] !important`.

| Class | Path | Element | Pattern | Context | Undo / thắng gì | Nếu bỏ |
|---|---|---|---|---|---|---|
| `.ifx-mb-16` | W01–W10 | `<div class="ifx-inline-md ifx-mb-16">` | mọi Reference | Hàng Theme toggle ngay dưới `<main>` | Không có margin mặc định trên `div` | 0 |
| `.ifx-mb-24` | W01, W03, W08 | `.ifx-stat-strip.ifx-mb-24` | table-list / order-list / referrals | Dưới page-header | `stat-strip.css` không set margin-bottom | 0 |
| `.ifx-mb-24` | W02 | `.ifx-grid.ifx-mb-24` | form-add | Lưới 8/4 | `.ifx-grid` không margin | 0 |
| `.ifx-mb-24` | W08 | `.ifx-grid.ifx-mb-24` | referrals | Bước 3 cột | same | 0 |
| `.ifx-mb-24` | W09 | `.ifx-card.ifx-mb-24` ×2 | charts | Card tuần tự | `.ifx-card` không margin | 0 |
| `.ifx-mb-24` | sandbox `sections/patterns.html` | `.ifx-card` / `.ifx-grid` | Sandbox catalog | Demo | same | 0 |
| `.ifx-mb-16` | W05 | `.ifx-flex-col…ifx-mb-16` identity; `.ifx-flex.ifx-w-full.ifx-mb-16` stats; `.ifx-stack-sm.ifx-mb-16`; `.ifx-tabs.ifx-mb-16` | user-profile | Card identity + tabs | `div`/`tabs` 0 mb | 0 |
| `.ifx-mb-16` | W07 | identity col + last flex row | chat | Card phải | 0 | 0 |
| `.ifx-mb-16` | W10 | `.ifx-tabs.ifx-mb-16`; `.ifx-alert.ifx-mb-16` | auth | Trong card | alert không mb | 0 |
| `.ifx-mb-16` | W02 | `<label class="ifx-choice ifx-mb-16">` | form-add | Trước hr/switch | `.ifx-choice` không mb | 0 |
| `.ifx-mb-12` | W02 | `<p class="ref-page-form-add-group-label ifx-mb-12">` ×5 | form-add | Nhóm field | `p { margin: 0 0 var(--ifx-stack-sm) }` = 12. Utility `mb-12` + `!important` **trùng giá trị** stack-sm (cả hai = space-12) | `p` vẫn `margin-bottom: stack-sm` |
| `.ifx-mb-12` | W04 | `<div class="ifx-inline-sm ifx-mb-12">` | order-detail | Icon + “12 bản ghi” | `div` 0 | 0 |
| `.ifx-mb-8` | W07 | `.ifx-inline-md.ifx-mb-8`; `.ifx-flex.ifx-justify-between.ifx-mb-8` ×2 | chat | Thread header / meta rows | `div` 0 | 0 |
| `.ifx-mb-8` | sandbox `components.html` | `<p class="ifx-mb-8">Radio</p>` | Sandbox | Demo radio | `p` đã có mb stack-sm (12). Utility **thắng** → 8 | `p` → 12 |
| `.ifx-mb-0` | W01 | `.ifx-form-group.ifx-mb-0` ×3 | table-list | Filter row | **Undo** `.ifx-form-group { margin-bottom: var(--ifx-stack-md) }` | form-group mb = stack-md |
| `.ifx-mb-0` | W02 | `.ifx-form-group.ifx-mb-0` ×6; `<small class="ifx-mb-0">` ×3 | form-add | Form cells; meta dưới dropzone | form-group undo như trên. `small` Foundation **không** set margin — `mb-0` không thắng selector nào | form-group: stack-md; small: 0 sẵn |
| `.ifx-mb-0` | W05 | `<p class="ifx-mb-0">` ×7; `.ref-page-user-profile-setting-title.ifx-mb-0`; `.ifx-form-group.ifx-mb-0` ×4; `.ifx-form-row.ifx-mb-0` ×1 | user-profile | Card body + modal | **Undo `p` mb stack-sm.** form-group undo stack-md. **Undo `.ifx-form-row { margin-bottom: var(--ifx-space-16) }`** (`form.css` L186) | `p` → stack-sm; form-group → stack-md; form-row → 16 |
| `.ifx-mb-0` | W04 | `.ref-module-order-group.ifx-mb-0` trên `<p>`; `<small class="ifx-mb-0">` | order-detail | Card “Địa chỉ B” | Undo `p` mb | `p` → 12 |
| `.ifx-mb-0` | W06 | `.ifx-form-group.ifx-mb-0` ×18 | wizard | Mọi field trong step | Undo form-group | stack-md |
| `.ifx-mb-0` | W07 | `<p class="ifx-p-16 ifx-mb-0">` ×2 | chat | Section label trong thread | Undo `p` mb | `p` → 12 |
| `.ifx-mb-0` | W08 | `.ifx-form-group.ifx-mb-0` | referrals | Invite form | Undo form-group | stack-md |
| `.ifx-mt-16` | W02 | `<div class="ifx-flex … ifx-mt-16">` hàng switch | form-add | Cuối cột phải | `div` 0 mt | 0 |
| `.ifx-mt-16` | W06 | `.ifx-grid.ifx-mt-16.ifx-mb-16` ×2; `.ifx-form-row.ifx-mt-16` ×3 | wizard | Dưới `<h2>` bước | `h2 { margin: 0 0 space-8 }`. Grid/row 0 mt. Utility **không** xóa h2 mb — thêm mt trên sibling | grid/row mt = 0 |
| `.ifx-mt-8` | W10 | `<button class="ifx-btn … ifx-w-full ifx-mt-8">` | auth | Dưới primary | `.ifx-btn` không margin | 0 |
| `.ifx-m-*` (0/4/8/12/16/24) | — | — | — | — | — | 0 HTML |
| `.ifx-mt-0` `.ifx-mt-4` `.ifx-mt-12` `.ifx-mt-24` | — | — | — | — | — | 0 HTML |
| `.ifx-mb-4` | — | — | — | — | — | 0 HTML |
| `.ifx-m-xs` … `.ifx-m-xl` | — | — | — | — | — | 0 HTML |

Cascade sống: `.ifx-mb-0` + `!important` đang undo `.ifx-form-group` / `.ifx-form-row` vì `form.css` load **sau** utilities. `p` + class mb đã thắng element **không cần** `!important`. `.ifx-p-24` thắng `.ifx-container` padding-inline vì utilities load sau + shorthand `padding`.

---

## 3. Gap + Stack + Inline

`.ifx-flex` / `.ifx-flex-col` (`layout.css`) = `display:flex` **không** set `gap`. `.ifx-grid` set `gap: var(--ifx-grid-gutter)` — **không** có consumer gắn `.ifx-gap-*` trên `.ifx-grid`.

### Gap class

| Class | Path | Parent display | Layout owner sẵn? | Component set gap lại? |
|---|---|---|---|---|
| `.ifx-gap-24` | W02 ×2, W04 ×2, W05 ×1 `ifx-flex-col` | flex column | Flex primitive, 0 gap | Không |
| `.ifx-gap-12` | W02 `ifx-flex-col` ×3 | flex column | same | Không |
| `.ifx-gap-8` | W08 `ifx-flex-col` ×3; `ifx-flex … ifx-gap-8` ×2; W07 `ifx-flex-col` ×1; sandbox `ifx-flex-col ifx-gap-8` | flex | same | Không |
| `.ifx-gap-sm` | W02 `ifx-flex ifx-gap-sm`; W05 `ifx-flex ifx-gap-sm` ×2; sandbox primitives/components wrap | flex (+ wrap) | same | Chip/Button tự gap **nội bộ**, không ghi đè gap của parent này |
| `.ifx-gap-xs/md/lg/xl` | sandbox `foundation.html` + `playground/preview.html` demo rows | `.ifx-flex` | demo | Không |
| `.ifx-gap-0` `.ifx-gap-4` `.ifx-gap-16` | — | — | — | 0 HTML |

Token `--ifx-gap-*` được **component CSS** consume trực tiếp (card header, tabs, toast, table, action-bar, stat, timeline, chart, modal) — **không** qua class `.ifx-gap-*`.

### Stack

| Class | Consumers | Container | Children | Override `> * + *` margin-top? | Nested stack? | 2 phần tử? |
|---|---|---|---|---|---|---|
| `.ifx-stack-sm` | W04 footer: 4 flex-rows + `hr` | `div` trong `.ifx-card-footer` | 5 siblings | Không thấy lower override | Không | Không (5) |
| `.ifx-stack-sm` | W04 card “Người”: 2 flex-rows | `div` trong card-body | 2 | Không | Không | **Có — đúng 2** |
| `.ifx-stack-sm` | W05 identity: 4 flex-rows | `div` + `ifx-mb-16` | 4 | Không | Không | Không |
| `.ifx-stack-sm` | sandbox foundation gap demo; primitives.html; playground | demo | demo | — | playground nest flex trong stack | demo |
| `.ifx-stack-md` | sandbox primitives.html | demo | — | — | — | — |
| `.ifx-stack-xs` `.ifx-stack-lg` `.ifx-stack-xl` | 0 HTML | — | — | — | — | — |

Stack **không** `!important`. `p`/`small` bên trong hàng flex: margin `p` có thể cộng với stack trên sibling `div` (W04/W05 children là `div`, không phải `p`).

### Inline

| Class | Consumers | Element | Component đã flex+gap? | Icon+text trong Button/Chip/Badge/td? |
|---|---|---|---|---|
| `.ifx-inline-md` | W01–W10 hàng Theme | `div` | Không | Chrome page, không phải Button |
| `.ifx-inline-md` | W01 / W03 table: avatar + tên ×10 | `div` trong `td` | Table `td` không flex. Avatar/Chip tự chứa | **Có — cell identity** (không phải Button) |
| `.ifx-inline-md` | W04 item row avatar+tên; W04 person header | `div` trong `td` / card | same | Cell / card header |
| `.ifx-inline-md` | W07 thread header; message rows | `div` | `.ifx-chat-item` / `.ifx-chat-message` **đã** `display:flex; gap: var(--ifx-inline-md)` — **hàng markup này không dùng class chat-item** | Thread toolbar |
| `.ifx-inline-md` | W08 table person ×6; W06 2 hàng | `div` | Table/form | Cell |
| `.ifx-inline-sm` | W01 toolbar table actions; W04 “12 bản ghi”; W05 setting actions; W07 | `div` | Button group: mỗi `.ifx-btn` tự `inline-flex` + gap icon | **Có — cụm nút trong td / card** |
| `.ifx-inline-xs` | W01 / W03 action icons ×10 mỗi bảng | `div` trong `td` | `.ifx-btn-icon` đã flex | **Có — Table cell actions** |
| `.ifx-inline-lg` `.ifx-inline-xl` | 0 HTML | — | — | — |

---

## 4. Semantic layout regions

| Class | HTML count | Pattern | Element | Việc đang làm (quan sát) | Owner khác cùng padding/margin? | Lower override cùng property? |
|---|---|---|---|---|---|---|
| `.ifx-space-container` | **0** | — | — | Class không dùng | `.ifx-container` **đã** `padding-inline: var(--ifx-space-container)` | — |
| `.ifx-space-section` | **0** | — | — | — | Token `--ifx-space-section` đổi theo breakpoint trong `layout.css :root`. Không có class section | — |
| `.ifx-space-page` | **0** | — | — | — | Token dùng `sandbox.css` `.sb-* { margin-top: var(--ifx-space-page) }` — harness, không class | — |
| `.ifx-space-card-inset` | **0** | — | — | — | `.ifx-card-header/body/footer` + `.ifx-stat` + drawer/modal dùng `--ifx-inset-card*` | — |
| `.ifx-space-widget-inset` | **0** | — | — | — | `.ifx-alert` + `.ifx-chat-input-bar` dùng `--ifx-inset-widget` | — |

---

## 5. Display / width / text / truncate

| Class | Consumers | Context | JS toggle? | Ghi chú quan sát |
|---|---|---|---|---|
| `.ifx-hidden` | **0 HTML** | — | **Không.** `table.js` toggle `is-hidden`, không `ifx-hidden` | `display:none !important` không có consumer |
| `.ifx-block` | W01 ×10 `<span class="… ifx-block">` tên bản ghi; W04 ×3 `<small class="ifx-block">` SKU / PER | Trong `.ifx-inline-md` (inline-flex) | Không | Ép span/small xuống dòng dưới avatar. `small` mặc định inline |
| `.ifx-w-full` | W05 flex stats bar; W07 `.ifx-search`; W07 ×3 `.ifx-btn`; W10 ×5 `.ifx-btn`; W04 `.ifx-stack-sm`; W08 flex stats | Search/button/flex | Không | `.ifx-search` **đã** `width:100%; max-width: var(--ifx-space-256)` — `w-full` trùng width, **không** gỡ max-width. `.ifx-input` **đã** `width:100%` (OTP chỉ thêm text-center, không w-full). `.ifx-btn` **không** width 100% |
| `.ifx-text-center` | W05 ×3 + wrapper; W07 identity; W08 ×3 stats; W10 `<input class="ifx-input ifx-text-center">` | Flex stats / OTP | Không | Table `th` = `text-align:left` (`table.css`). Không gắn utility trên `th`/`td` |
| `.ifx-text-left` `.ifx-text-right` | **0** | — | — | Table đã left trên `th` |
| `.ifx-truncate` | **0** | — | — | Không consumer; không thấy `min-width:0` cặp class này |

---

## 6. `!important` conflicts

Mọi padding/margin/gap utility + `.ifx-hidden` có `!important`. Stack/inline/space-*/block/w-full/text/truncate **không**.

| Class | Consumer sống | Selector bị thắng | File | Specificity (ước) | Quan sát |
|---|---|---|---|---|---|
| `.ifx-p-24` | 10× `<main.ifx-container>` | `.ifx-container { padding-inline }` | `layout.css` L68–72 | cả hai (0,1,0). utilities **sau** layout | `padding` shorthand thắng `padding-inline` + set padding-block = 24. Token container responsive (16→32) bị bỏ. `!important` không đổi kết quả **với thứ tự file hiện tại**; chặn nếu sau này có longhand padding trên `.ifx-container` |
| `.ifx-p-16` | W07 3 node | không có padding owner trên thread/`p` | — | — | Không thắng selector sống; chỉ set giá trị |
| `.ifx-mb-0` | `.ifx-form-group` ×32 (W01 3 + W02 6 + W05 4 + W06 18 + W08 1) | `.ifx-form-group { margin-bottom: stack-md }` | `form.css` L5 | cả hai (0,1,0). **form.css load sau utilities** | **Không `!important` → form-group thắng.** `!important` là thứ đang undo form stack |
| `.ifx-mb-0` | `.ifx-form-row` W05 ×1 | `.ifx-form-row { margin-bottom: space-16 }` | `form.css` L186 | (0,1,0) vs (0,1,0); form.css sau | **Không `!important` → form-row thắng.** `!important` đang undo |
| `.ifx-mb-0` | `p` W04/W05/W07 | `p { margin: 0 0 stack-sm }` | `typography.css` L173 | (0,0,1) vs (0,1,0). typography **trước** utilities | Class đã thắng element **không cần** `!important` |
| `.ifx-mb-8` trên `p` | sandbox components | `p` mb stack-sm | typography | (0,0,1) vs (0,1,0) | Class đã thắng element không cần `!important`. Effective 8 thay 12 |
| `.ifx-mb-12` trên `p` | W02 group labels | `p` mb stack-sm (=12) | typography | (0,0,1) vs (0,1,0) | Cùng số; class thắng không cần `!important` |
| `.ifx-mb-*` trên `div` / `.ifx-card` / `.ifx-grid` / `.ifx-tabs` / `.ifx-stat-strip` / `.ifx-choice` / `.ifx-alert` | nhiều Reference | owner đó **không** set margin-bottom | — | — | Không có selector bị thắng |
| `.ifx-mt-16` `.ifx-mt-8` trên div/button | W02/W06/W10 | không có mt owner | — | — | Không thắng |
| `.ifx-gap-*` trên `.ifx-flex*` | W02/W04/W05/W07/W08 + sandbox | `.ifx-flex` **không** gap | layout.css | — | Không thắng; **gán** gap |
| `.ifx-p-0` … và mọi p/m/gap **0 HTML** | — | — | — | — | Không conflict runtime |
| `.ifx-hidden` | 0 | — | — | — | Sẵn sàng thắng mọi `display` nếu gắn |

---

## 7. Multiple-utility compositions

Chỉ element gắn **≥2 class thuộc `utilities.css`**:

| Path | Element | Utilities | Context |
|---|---|---|---|
| W01–W10 `index.html` | `div` Theme row | `inline-md` + `mb-16` | Dưới `<main>` |
| W07 chat | `p` section label ×2 | `p-16` + `mb-0` | `.ifx-chat-thread` |
| W07 chat | `div` | `inline-md` + `mb-8` | Avatar + “Tôi” |
| W04 order-detail | `div` footer | `stack-sm` + `w-full` | `.ifx-card-footer` |
| W04 | `div` | `inline-sm` + `mb-12` | Icon + “12 bản ghi” |
| W05 | `div` | `stack-sm` + `mb-16` | Identity fields |
| W05 | `div` | `text-center` + `mb-16` (+ flex-col layout) | Avatar block |
| W05 | `div` | `w-full` + `mb-16` (+ flex) | 3 stat |
| W07 | `div` | `text-center` + `mb-16` | Card phải identity |
| W06 | `div.ifx-grid` ×2 | `mt-16` + `mb-16` | Dưới h2 bước |
| W10 | `button.ifx-btn` | `w-full` + `mt-8` | Nút outline |

Element chỉ 1 utility + nhiều class **ngoài** utilities (`ifx-container`, `ifx-flex`, `ifx-form-group`, `ifx-btn`…) **không** liệt kê ở đây.

---

## 8. Zero-consumer summary

### A. 0 consumer HTML trong `design_system/**`

`.ifx-p-0` `.ifx-p-2` `.ifx-p-4` `.ifx-p-8` `.ifx-p-12` `.ifx-p-20` `.ifx-p-32`  
`.ifx-p-xs` `.ifx-p-sm` `.ifx-p-md` `.ifx-p-lg` `.ifx-p-xl`  
`.ifx-m-0` `.ifx-m-4` `.ifx-m-8` `.ifx-m-12` `.ifx-m-16` `.ifx-m-24`  
`.ifx-m-xs` `.ifx-m-sm` `.ifx-m-md` `.ifx-m-lg` `.ifx-m-xl`  
`.ifx-mt-0` `.ifx-mt-4` `.ifx-mt-12` `.ifx-mt-24`  
`.ifx-mb-4`  
`.ifx-gap-0` `.ifx-gap-4` `.ifx-gap-16`  
`.ifx-stack-xs` `.ifx-stack-lg` `.ifx-stack-xl`  
`.ifx-inline-lg` `.ifx-inline-xl`  
`.ifx-space-container` `.ifx-space-section` `.ifx-space-page` `.ifx-space-card-inset` `.ifx-space-widget-inset`  
`.ifx-hidden` `.ifx-text-left` `.ifx-text-right` `.ifx-truncate`

### B. Sandbox-only (class HTML)

`.ifx-gap-xs` `.ifx-gap-md` `.ifx-gap-lg` `.ifx-gap-xl` (foundation + playground demo)  
`.ifx-stack-md` (primitives.html)  
`.ifx-mb-8` trên `<p>` Radio (components.html) — **ngoài** W07 cũng dùng `mb-8` trên `div`  
`.ifx-mb-24` trên card/grid catalog (patterns.html) — **song song** Reference cũng dùng `mb-24`

### C. Reference consumer thật

`.ifx-p-24` `.ifx-p-16`  
`.ifx-mb-0` `.ifx-mb-8` `.ifx-mb-12` `.ifx-mb-16` `.ifx-mb-24`  
`.ifx-mt-8` `.ifx-mt-16`  
`.ifx-gap-8` `.ifx-gap-12` `.ifx-gap-24` `.ifx-gap-sm`  
`.ifx-stack-sm`  
`.ifx-inline-xs` `.ifx-inline-sm` `.ifx-inline-md`  
`.ifx-block` `.ifx-w-full` `.ifx-text-center`

### D. CSS/JS internal (token, không phải class)

`--ifx-gap-*` `--ifx-stack-*` `--ifx-inline-*` `--ifx-padding-*` `--ifx-inset-card*` `--ifx-inset-widget` `--ifx-space-container/section/page` — consume trong component/layout/sandbox CSS.  
JS: `is-hidden` (table.js), **không** `ifx-hidden`.
