# P6a — FILE EXECUTION PLAN · `typography.css`

**Phase:** A — Audit & File Plan  
**Status:** `FILE_AUDIT = PASS CANDIDATE` · `FILE_PLAN = PENDING OWNER` · `EXECUTION = BLOCKED`  
**Ngày:** 2026-08-27  
**Baseline:** `4741d70` (trạng thái ngay trước execution P6a chưa duyệt)  
**Phạm vi consumer:** `design_system/**` · `design_system/references/**` · `design_system/sandbox/**`  
**Ngoài scope:** `Admin_Design_system/` · production Admin / User Web / modules / widgets

Đây là **PROPOSAL**. Kết quả execution trước đó = preliminary findings, không phải approved list.

UNKNOWN = 0.

---

## A. Current responsibility

| | |
|---|---|
| File | `design_system/foundation/typography.css` |
| Current owner | Global Design System — Foundation (path đúng; header cũ, chưa đúng SoT P6a) |
| Expected owner | Global Design System — Foundation |
| Layer | Foundation |
| Capability | Typography |
| Dependencies | Token primitives (`--ifx-font-*`, `--ifx-space-*`, `--ifx-text-primary/muted`, theme colors) |
| Consumers | Sandbox Foundation; P6 W01–W10 HTML; Primitive Button (tokens `--ifx-text-btn-*`); Card / Title / Form / Table / Chart (tokens hoặc `font-size` riêng — không consume class typo trừ visual roles) |

---

## B. Inventory

### B1. Token groups (`:root`)

| Rule / token group | Consumer (Canonical DS) | Current responsibility |
|---|---|---|
| `--ifx-text-display-*` | `.ifx-typo-display-*` · Sandbox demo | Display scale |
| `--ifx-text-h1`–`h6-*` | Semantic `h1`–`h6` + `.ifx-typo-h*` | Heading scale |
| `--ifx-text-title-*` | `.ifx-typo-title-*` · W01–W08 / W10 | Title visual role |
| `--ifx-text-body-*` | `body` · `.ifx-typo-body-*` · Card/Title consume `body-sm` | Body scale |
| `--ifx-text-caption-*` / `--ifx-text-overline-*` | `small` / `figcaption` / `caption` · `.ifx-typo-overline` | Caption / overline |
| `--ifx-text-label-*` | `.ifx-typo-label-*` · W02 | Label visual role |
| `--ifx-text-btn-*` | `primitives/button/button.css` (class `.ifx-typo-btn-*` = 0 HTML) | Button text tokens |
| `--ifx-text-price-*` / percentage / volume / money / index / change / timestamp | `.ifx-typo-price-s/m` ở W03/W04/W08; còn lại Sandbox-only | Market / numeric object |
| `--ifx-text-table-*` | `.ifx-typo-table-*` = Sandbox-only. Table CSS **không** dùng token này | Table typography twin |
| `--ifx-text-chart-*` | `.ifx-typo-chart-*` = 0 HTML. `chart.css` dùng `--ifx-font-size-*` | Chart typography twin |
| `--ifx-text-widget-*` / `--ifx-text-ranking-num-*` | `.ifx-typo-widget-*` / ranking = 0 HTML | Widget typography |

### B2. Semantic HTML

| Rule | Consumer | Current responsibility |
|---|---|---|
| `html` | mọi page DS | rem root + family |
| `body` | mọi page DS | body-md contract |
| `h1`–`h6` | Sandbox + page titles | Semantic heading |
| `p` `strong` `em` `small` `blockquote` `ul/ol` `li+li` `code` `pre` `figcaption` `caption` | Sandbox + references | Semantic HTML First |

### B3. Visual role classes — HTML consumers in `design_system/`

| Rule | Consumer count / path | Current responsibility |
|---|---|---|
| `.ifx-typo-display-*` | Sandbox Foundation only | Display role |
| `.ifx-typo-h1`–`.ifx-typo-h6` | Sandbox Foundation only | Duplicate of `h1`–`h6` |
| `.ifx-typo-title-lg/md/sm` | W01 table-list · W02 form-add · W03 order-list · W04 order-detail · W05 profile · W06 wizard · W07 chat · W08 referrals · Sandbox | Title role (không trùng tag) |
| `.ifx-typo-body-lg/md/sm` | W02 · Sandbox foundation/components/patterns | Body role |
| `.ifx-typo-label-*` | W02 form-add · Sandbox | Label role trên `p` |
| `.ifx-typo-overline` | Sandbox Foundation | Overline role |
| `.ifx-typo-btn-*` | 0 HTML | Twin của Button size |
| `.ifx-typo-price-s` | W03 ×10 · W04 ×7 · W08 ×12 · Sandbox | Số trong ô table (tên “price”) |
| `.ifx-typo-price-m` | W04 ×1 · Sandbox | Số tổng |
| `.ifx-typo-price-xl/l` | Sandbox only | Market price scale |
| `.ifx-typo-percentage` `.ifx-typo-volume` `.ifx-typo-money` `.ifx-typo-index` `.ifx-typo-change` | 0 HTML (class có, không dùng) | Market object |
| `.ifx-typo-timestamp` | Sandbox only | Caption twin |
| `.ifx-typo-table-*` | Sandbox only | Twin `table.css` `th`/`td` |
| `.ifx-typo-chart-*` | 0 HTML | Twin `chart.css` |
| `.ifx-typo-widget-*` `.ifx-typo-ranking-num` | 0 HTML | Widget |
| `.ifx-typo-status-*` | Sandbox only | Status color (Chip/Alert đã có semantic) |
| `.ifx-fs-*` `.ifx-fw-*` `.ifx-lh-*` `.ifx-tracking-*` | 0 HTML | Utility framework |
| `.ifx-uppercase` `.ifx-lowercase` `.ifx-capitalize` `.ifx-underline` `.ifx-line-through` `.ifx-no-underline` `.ifx-font-mono` | 0 HTML | Utility / `code`/`pre` đã mono |
| `.ifx-font-numeric` | 0 HTML hiện tại (class còn sống) | Generic tabular family |

---

## C. Classification

| Rule | Classification | Correct owner |
|---|---|---|
| Display / heading / title / body / caption / overline / label **tokens** | GLOBAL_FOUNDATION | Foundation Typography |
| `--ifx-text-btn-*` tokens | GLOBAL_FOUNDATION (token) / consume = GLOBAL_PRIMITIVE | Token ở Typography; class ở Button |
| `html` `body` `h1`–`h6` `p` `strong` `em` `small` lists `code` `pre` `caption`/`figcaption` | GLOBAL_FOUNDATION | Foundation Typography |
| `.ifx-typo-display-*` `.ifx-typo-title-*` `.ifx-typo-body-*` `.ifx-typo-label-*` `.ifx-typo-overline` | GLOBAL_FOUNDATION | Foundation — visual role độc lập |
| `.ifx-font-numeric` | GLOBAL_FOUNDATION | Foundation — generic tabular |
| `.ifx-typo-h1`–`.ifx-typo-h6` | DUPLICATE | Semantic `h1`–`h6` đã sở hữu |
| `.ifx-typo-btn-*` | DUPLICATE | `button.css` đã set size |
| `--ifx-text-table-*` + `.ifx-typo-table-*` | DUPLICATE | `table.css` `th`/`td` |
| `--ifx-text-chart-*` + `.ifx-typo-chart-*` | GLOBAL_COMPONENT (sai chỗ) | `chart.css` |
| `--ifx-text-widget-*` + `.ifx-typo-widget-*` `.ifx-typo-ranking-num` | WIDGET | Không thuộc Global |
| `--ifx-text-price-*` + `.ifx-typo-price-*` / percentage / volume / money / index / change | MODULE | Market / numeric object — không Global |
| `.ifx-typo-timestamp` + token | REDUNDANT | `small` / caption |
| `.ifx-typo-status-*` | REDUNDANT | Chip / Alert |
| `.ifx-fs-*` `.ifx-fw-*` `.ifx-lh-*` `.ifx-tracking-*` + transform/decoration utilities + `.ifx-font-mono` | REDUNDANT | 0 consumer; utility framework |

UNKNOWN = 0.

---

## D. Override matrix

P6 References: **0 file CSS local** — không có lower-scope `font-size` trên `.ifx-*`.

| Upper rule | Lower override | Property | Consumer | Current effect | Proposed treatment |
|---|---|---|---|---|---|
| `body` / `p` (body-md + margin) | `card.css` `.ifx-card-body > p { font-size: body-sm }` | font-size | Card body | Body trong card nhỏ hơn document | **KEEP** — Component owns internal typography (Rules §15). **Không đụng trong wave typography** |
| `p` | `title.css` page-title `p` → body-sm | font-size | Title primitive | Mô tả title nhỏ hơn `p` | **KEEP** — Title contract. Ngoài file này |
| semantic / label tokens | `form.css` `.ifx-label` → `font-size: sm` | font-size | Form fields | Field label ≠ `.ifx-typo-label-*` | **KEEP** — Form owner. Ngoài file này |
| `--ifx-text-table-*` (Global) | `table.css` `th`/`td` dùng `--ifx-font-size-*` | font-size / weight | Tables | Table **không** consume token table trong typography | **KEEP** table.css. Proposed: DELETE twin token/class ở typography |
| `--ifx-text-chart-*` | `chart.css` `.ifx-chart-label` → `2xs` | font-size | Charts | Chart không dùng `.ifx-typo-chart-*` | **KEEP** chart.css. Proposed: DELETE twin |
| `--ifx-text-btn-*` | `button.css` `.ifx-btn` / `-sm` / `-lg` | font-size / weight / line | Buttons | Button consume **token**, không consume `.ifx-typo-btn-*` | **KEEP** tokens + button.css. Proposed: DELETE `.ifx-typo-btn-*` only |
| `h1`–`h6` | `.ifx-typo-h1`–`h6` (cùng file) | full type + margin | Sandbox demo | Duplicate cùng file | Proposed DELETE class |
| `.ifx-table td` (sm) | `.ifx-typo-price-s` trên `<span>` trong `td` | font-size 18 + bold | W03/W04/W08 | Số lớn/đậm hơn cell | Proposed DELETE class + bỏ class trên span (size theo cell) **hoặc** Owner CHANGE |

Empty local placeholders: không đề xuất tạo.

---

## E. Proposed actions

| Rule | Action | Target owner | Reason | Impact |
|---|---|---|---|---|
| Semantic HTML + display/title/body/label/overline tokens + classes | KEEP | Foundation | Semantic / visual role độc lập | 0 runtime change |
| `--ifx-text-btn-*` | KEEP | Foundation (token) | Button đang consume | 0 |
| Ownership header SoT | NORMALIZE | Foundation | Header hiện tại chưa đúng comment SoT §20 | Comment only |
| `.ifx-typo-h1`–`h6` | DELETE | — | DUPLICATE semantic HTML | Sandbox demo bỏ 6 dòng |
| `.ifx-typo-btn-*` | DELETE | — | Button đã sở hữu | 0 HTML consumer |
| `--ifx-text-table-*` + `.ifx-typo-table-*` | DELETE | — | Twin; table.css đã đủ | Sandbox demo bỏ |
| `--ifx-text-chart-*` + `.ifx-typo-chart-*` | DELETE | — | Twin; chart.css đã đủ | 0 HTML |
| Widget / ranking tokens + classes | DELETE | — | WIDGET, sai Global | 0 HTML |
| Price / market tokens + classes | DELETE | — | MODULE / market | W03/W04/W08 + Sandbox — xem mục F |
| Timestamp + status classes/tokens | DELETE | — | REDUNDANT | Sandbox demo bỏ |
| Utility `ifx-fs/fw/lh/tracking` + transform/decoration + `.ifx-font-mono` | DELETE | — | 0 consumer; cấm utility framework | 0 HTML |
| `.ifx-font-numeric` | KEEP | Foundation | Generic tabular; không biết “price” | Sẵn sàng nhận consumer nếu Owner approve migration F |
| `card.css` / `title.css` / `form.css` / `table.css` / `button.css` | **Không đụng** | Component/Primitive | Ngoài file; §15 | — |

Đây chỉ là PROPOSAL. Owner có thể KEEP bất kỳ mục DELETE nào.

---

## F. Consumer migration plan (nếu Owner approve DELETE price)

| Consumer | Hiện tại | Sửa thành (đề xuất) | File |
|---|---|---|---|
| Số trong bảng W03 | `class="ifx-typo-price-s"` | `class="ifx-font-numeric"` | `references/patterns/order-list/index.html` |
| Số W04 | `ifx-typo-price-s` / `ifx-typo-price-m` | `ifx-font-numeric` | `references/patterns/order-detail/index.html` |
| Số W08 | `ifx-typo-price-s` | `ifx-font-numeric` | `references/patterns/referrals/index.html` |
| Sandbox demo h1–h6 / price / table / timestamp / status | class đã DELETE | Xóa demo những role đó; giữ semantic `h1`–`h6` + display/title/body/label/overline + 1 dòng `.ifx-font-numeric` | `sandbox/sections/foundation.html` |
| `typography.json` note (`ifx-fs-*`) | ghi utility còn sống | Cập nhật note cho khớp file sau execution | `tokens/source/typography.json` |

Nếu Owner **CHANGE**: KEEP `.ifx-typo-price-*` → không sửa 3 reference HTML.

W01 `table-list` dùng `.ifx-typo-title-sm` cho số — **không** nằm trong migration price. Không đề xuất đổi trừ khi Owner yêu cầu.

Admin_Design_system twin: **không migrate**.

---

## G. Regression plan (sau Gate A + Phase B)

| Surface | Kiểm tra |
|---|---|
| Sandbox `?section=foundation&panel=typography` | Semantic HTML còn; visual roles KEEP còn; role DELETE không còn demo |
| W01 table-list | Title-sm không đổi |
| W02 form-add | Label / body không đổi |
| W03 / W04 / W08 | Số: nếu migrate — tabular, size theo cell; nếu KEEP price — như baseline |
| W05–W07 / W09 / W10 | Title/body không đổi |
| Button mọi surface | Size không đổi (`--ifx-text-btn-*` KEEP) |
| Dark / Light | Token semantic |
| Viewport 360 / 768 / 1280 | Không media typography (đã cố định) |

---

## H. Expected result (nếu APPROVE ALL đề xuất E+F)

| | |
|---|---|
| Before | 426 dòng; ~86 class/utility; token market/table/chart/widget trong Foundation |
| After | Semantic + visual roles + btn tokens + `.ifx-font-numeric`; 0 class duplicate/market/utility |
| Expected ownership | Foundation chỉ generic/semantic typography |
| Expected unresolved | 0 |
| Files sẽ đổi (nếu approve) | `typography.css` · `foundation.html` · `order-list/index.html` · `order-detail/index.html` · `referrals/index.html` · `typography.json` (note) |

---

## Owner Gate A — chờ duyệt

Trả một trong:

- **APPROVE ALL**
- **APPROVE PARTIAL** (liệt kê KEEP / DELETE / MOVE / không đụng)
- **CHANGE ACTION**
- **REJECT**

Không execution cho đến khi có câu trả lời.
