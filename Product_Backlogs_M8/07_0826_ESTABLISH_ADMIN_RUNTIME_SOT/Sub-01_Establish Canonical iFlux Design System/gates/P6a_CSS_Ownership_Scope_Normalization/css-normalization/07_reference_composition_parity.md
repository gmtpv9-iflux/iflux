# P6a — Reference Composition Parity & Lower-Layer Normalization

**Mode:** Audit → Owner classification → Implement  
**Date:** 2026-08-27  
**Scope:** W02/W03 control · W04/W05/W06/W07/W08/W10 problem  
**STOP:** No generic Content Body. No Global typography utilities.

---

## 2. Receiver architecture

| Question | Evidence |
|---|---|
| `sandbox/index.html` PLATFORM/MODULE/PAGE/WIDGET comments? | **Không.** File chỉ `<link>` tới `assets/reference-layers.css`. Không có CSS block trong HTML. |
| Physical receiver? | `design_system/sandbox/assets/reference-layers.css` — đã có 4 layer comment + empty `.ref-*` hooks. |
| Sandbox consume? | Có — `sandbox/index.html` line 21. |
| W01–W10 consume cùng source? | Có — mỗi `references/patterns/*/index.html` load `../../../sandbox/assets/reference-layers.css`. |
| Comment trong `index.html` là placeholder? | Link thật, không phải comment documentation. Layer comments nằm **trong** `reference-layers.css`. |

**Không tạo stylesheet song song.** Mọi lower-layer rule đi vào file này.

---

## A. Good baseline — W02 / W03

### WHY W02 LOOKS COHERENT

| Region | Role | Parent | Typography | Color | Outer | Inset | Rhythm | Owner | Hook |
|---|---|---|---|---|---|---|---|---|---|
| Page | title + desc | `ifx-page-header` | Foundation `h1` + Title `p` | primary / muted | `ifx-stack-xl` | container | — | Page Header + Title | none |
| Section/Card | group | `ifx-stack-lg` | Foundation `h2` in `ifx-section-title` | primary | stack-lg | Card | stack-md on card | Card + Title | none |
| Card Body | form fields | Card | `.ifx-label` + `.ifx-input` | label muted | — | Card Body | `ifx-stack-md` + Form group | Form | none |
| Choice / switch | option | Form | `.ifx-choice-title` | Form | — | — | Form internal | Form | leftover empty `.ref-page-form-add-*` **not needed** |
| Tabs | control | grid col | Tabs | Tabs | — | none after P6a-04 | parent stack / panel `stack-md` | Tabs + Form | none |
| Action bar | page actions | page | Button | Button | stack-xl | — | Action Bar | Action Bar | none |

**Mechanism (exact):** W02 không phụ thuộc `.ref-*`. Hierarchy đến từ Foundation heading + Form label/input + Card inset + parent Stack. Empty form-add hooks không phá vì Component đã own.

### WHY W03 LOOKS COHERENT

| Region | Role | Parent | Typography | Color | Rhythm | Owner |
|---|---|---|---|---|---|---|
| Stat Strip | KPI | `ifx-stack-lg` | `.ifx-stat-label` / `.ifx-stat-value` | Stat | Strip internal | Stat + Stat Strip |
| Card / Table | list | Card Body `stack-sm` | Table `th` + document `td` | Table / inherit | toolbar↔table = parent stack-sm | Table + Card |
| Footer | pagination | Card Footer | Pagination | Pagination | Footer inset | Pagination + Card Footer |
| Code / person / value | identity | `td` | **was empty hook** | inherit only | — | Module hook existed but empty |

W03 mạch lạc vì **Stat + Table + Card Footer** đã tự own. Điểm còn thiếu (code/person/value không đậm hơn cell thường) là module identity — cùng contract W04. Wave này **điền** `.ref-module-order-*` (không sửa markup W03).

**Không chỉnh W02 markup.** W03 chỉ bị ảnh hưởng bởi module CSS đã opt-in sẵn.

---

## B. Per-page canonical vs Legacy gap

### W04 Order Detail

| Region | Current DOM | Current visual | Legacy | Legacy rule | Missing? | Global eq? | Component eq? | Owner |
|---|---|---|---|---|---|---|---|---|
| Line item name | `.ref-module-order-item-name` inline | body inherit, cùng hàng SKU | 13/500 primary, block | name above sku | **YES** | no (domain name) | Table không own primary cell | MODULE |
| SKU | `.ref-module-order-item-sku` `small` | muted nhưng inline | 11 muted block | stack under name | **YES** display | Foundation `small` color | — | MODULE |
| Price / line total | `.ref-module-order-value` | inherit | 600 primary | weight | **YES** | no | no numeric API (deferred) | MODULE |
| Totals KV | flex + empty hooks | no gap, value = body | `ix-info-row` gap 6, value medium | column + total 16/700 | **YES** | no KV component | — | PAGE |
| Person | empty hooks | name/id cùng hàng, body | 14/600 + 12 muted | block identity | **YES** | no | Avatar owns face only | MODULE |
| Person KV | raw flex, no stack | dính Card Body | mb 16 + info-row | parent rhythm | **YES** | Layout stack | — | PAGE markup (`stack-md` + `stack-sm`) |
| Address B | p + hr + group | group = body p | 600 primary + muted card | | **YES** group weight | Foundation `p` | — | MODULE + PAGE stack-sm |
| Timeline | Timeline component | already owned | Timeline | keep | NO | — | Timeline | — |
| Flush table | Card → table | flush valid | same | keep two compositions | NO | — | Table | — |

### W05 User Profile

| Region | Current | Legacy | Missing? | Owner |
|---|---|---|---|---|
| Name | empty hook, body size | 18/700 primary | **YES** | PAGE |
| Identity children | `flex-col` **no gap** | hero column + 6–12 | **YES** | PAGE (`gap: 8`) |
| Mini stats | empty, body | 18/700 + 10 muted, bordered row | **YES** | PAGE (not Stat — density/surface không fit) |
| Sidebar KV | flex rows, no stack, hr leftover | `ix-detail-list` 7px pad | **YES** rhythm | PAGE markup (`stack-md` + `stack-sm`) |
| Account tab | `ifx-label` + `p` | 14/500 values | NO — Form + Foundation đủ | — |
| Setting title | empty hook | 14/600 | **YES** | PAGE |
| Timeline / Modal / Tabs | Component | — | NO | — |
| 90px avatar ring / bleed stats | Avatar lg | decorative | **NOT restored** | — |

### W06 Wizard

| Region | Current | Legacy | Missing? | Owner |
|---|---|---|---|---|
| Step title/sub | `.ifx-wizard-step-content` (P6a-04) | Wizard | NO | Wizard |
| Panel | `ifx-stack-md` + Form | Form | NO | Wizard + Form + Layout |
| Nav | Body `gap: 24` | 24 | NO | Wizard |
| `ref-page-wizard-step-*` | empty aliases of Grid/Form-row | layout | **NO remaining job** | DELETE hook |

### W07 Chat

| Region | Current | Legacy | Missing? | Owner |
|---|---|---|---|---|
| Thread item name / bubble / meta | Chat CSS | Chat | NO | Chat Component |
| Thread header (Tôi + search) | empty hook, no pad/gap | sidebar header pad + stack | **YES** | MODULE |
| Section label | `p>small` body | 11/600 uppercase | **YES** | MODULE |
| Person name | empty | 13–14/600 | **YES** | MODULE |
| Right-rail identity | flex-col no gap | 14/600 + 8 gap | **YES** | PAGE + markup stack |
| Actions | empty | column gap 8, full width | **YES** | MODULE |

### W08 Referrals

| Region | Current | Legacy | Missing? | Owner |
|---|---|---|---|---|
| Stat Strip | Stat | 18/700 KPI | NO | Stat |
| Step title | empty `.ref-module-referral-label` | 14 secondary / title | **YES** | MODULE |
| Step column | `flex-col` no gap | `ix-referral-step` gap 8 center | **YES** | PAGE |
| In-card counts | empty 12/48/9 | large metric (Legacy 32px F-tier) | **YES** (map xl/bold, **not** 32) | PAGE |
| Table name/value | empty | `ix-user-name` + 600 | **YES** | MODULE |
| Invite row | flex no gap | input+btn gap | **YES** | PAGE |
| How-to body | no stack, hr dính | mb 12–24 | **YES** | PAGE markup `stack-md` |

### W10 Auth

| Region | Current | Legacy | Missing? | Owner |
|---|---|---|---|---|
| Tabs / Form / Alert | Component + `stack-md` | — | NO | Form + Tabs + Alert |
| Submit / alt | empty, auto width | full-width stacked | **YES** | PAGE |
| OTP | empty input | tracked / centered | **YES** | PAGE |
| `ref-page-auth-tabs/alert` | empty | Component owns | **NO job** | DELETE hook |

---

## C. Missing-format inventory (validated)

A finding = Legacy intentional + Canonical lost it + visual loss **or** empty `.ref-*` hook.

| ID | Finding | Layer |
|---|---|---|
| M1 | Order name / person / code primary | MODULE |
| M2 | Order SKU / person-id block under name | MODULE |
| M3 | Order numeric value weight + tabular | MODULE |
| M4 | Order group title weight | MODULE |
| P1 | Order totals column + total emphasis | PAGE |
| P2 | W04 person/address parent rhythm | PAGE (Stack markup) |
| P3 | Profile name 18/bold | PAGE |
| P4 | Profile identity gap | PAGE |
| P5 | Profile mini-stat 18/bold + row chrome | PAGE |
| P6 | Profile setting title | PAGE |
| P7 | W05 sidebar parent rhythm | PAGE (Stack markup) |
| M5 | Chat thread section pad/gap | MODULE |
| M6 | Chat person + section label | MODULE |
| M7 | Chat action column | MODULE |
| P8 | Chat rail identity + meta value | PAGE |
| P9 | Chat rail parent rhythm | PAGE (Stack markup) |
| M8 | Referral name + table value | MODULE |
| P10 | Referral step gap/center | PAGE |
| P11 | Referral in-card metric | PAGE |
| P12 | Referral invite gap | PAGE |
| P13 | W08 how-to body stack | PAGE (Stack markup) |
| P14 | Auth submit/alt width 100% | PAGE |
| P15 | Auth OTP tracking/center | PAGE |
| W01 | Table-list primary cell (empty hook, same grammar) | PAGE |

---

## D. Classification counts

| Layer | Count | Notes |
|---|---|---|
| GLOBAL | **0** | Gate fail: Foundation/Form/Card/Stat/Table/Chat/Wizard already express generic contracts. Domain identity ≠ Global utility. |
| PLATFORM | **0** | References AppShell-free. |
| MODULE | **8** | orders ×4, chat ×3, referrals ×1 family (label+value) |
| PAGE | **16** | W04–W10 composition + W01 primary cell |
| WIDGET | **0** | Không có Widget artifact độc lập. |

---

## E. Empty `.ref-*` hook resolution

| Hook | Consumer | Purpose | Action |
|---|---|---|---|
| `.ref-module-order-value/code/person` | W03, W04 | identity / value | **IMPLEMENT** |
| `.ref-module-order-item-name/sku/person-id/group` | W04 | line + person + pay group | **IMPLEMENT** |
| `.ref-module-chat-*` | W07 | thread chrome + rail actions | **IMPLEMENT** |
| `.ref-module-referral-label/value` | W08 | step/table name + value | **IMPLEMENT** |
| `.ref-page-order-detail-summary*` / `total*` / `record-count` | W04 | totals + meta | **IMPLEMENT** |
| `.ref-page-user-profile-name/identity/stats/stat*/actions/setting-*` | W05 | identity + metric + setting | **IMPLEMENT** |
| `.ref-page-chat-identity/meta` | W07 | rail | **IMPLEMENT** |
| `.ref-page-referrals-step/stat*/invite` | W08 | steps + in-card metric + invite | **IMPLEMENT** |
| `.ref-page-auth-submit/alt/otp` | W10 | auth compose | **IMPLEMENT** |
| `.ref-page-table-list-primary` | W01 | primary cell | **IMPLEMENT** |
| `.ref-page-order-detail-column/person` | W04 | alias of stack/inline | **DELETE** class |
| `.ref-page-user-profile-tabs/settings` | W05 | Tabs / stack already | **DELETE** class |
| `.ref-page-referrals-stats/steps` | W08 | Stat Strip / Grid | **DELETE** class |
| `.ref-page-auth-tabs/alert` | W10 | Tabs / Alert | **DELETE** class |
| `.ref-page-wizard-step-grid/row` | W06 | Grid / Form-row | **DELETE** class |
| `.ref-page-form-add-*` | W02 control | Grid/Form already | **KEEP markup, no CSS** (không đụng control) |
| `.ref-page-order-list-stats` | W03 control | Stat Strip | **KEEP markup, no CSS** |
| `.ref-page-table-list-stats/filters` | W01 | unused/no extra job | no CSS |
| `.ref-page-charts-section` | W09 out of scope | leftover | no CSS |

---

## F. Global additions

**Không.** Gate:

1. Foundation `h1–h6` / `small` / `p` đủ document.  
2. Layout Stack/Inline/Grid đủ rhythm.  
3. Form / Card / Stat / Table / Tabs / Timeline / Chat / Wizard / Title đủ primitive/component.  
4. Mọi gap còn lại là domain identity hoặc page composition.  
5. Không có semantic reusable contract mới.

Không thêm `.ifx-typo-*`. Không thêm KV component. Không thêm Content Body.

---

## G. Lower-layer additions

File: `design_system/sandbox/assets/reference-layers.css`

Typography tokens used (canonical only):

| Role | Current before | Legacy | Token | Owner |
|---|---|---|---|---|
| Order name / person / code | inherit 15 | 13–14/500–600 | `font-size-sm` + semibold + primary | MODULE |
| Order / referral value | inherit | 600 primary | sm + semibold + numeric + tabular | MODULE |
| Order total | inherit | 16/700 | `font-size-lg` + bold | PAGE |
| Profile / referral mini metric | inherit | 18/700 (not 32) | `font-size-xl` + bold | PAGE |
| Profile name | inherit | 18/700 | `font-size-xl` + bold | PAGE |
| Chat section label | body `small` | 11/600 caps | xs + semibold + muted + caps | MODULE |
| Auth OTP | input default | tracked center | xl + caps tracking + center | PAGE |

Spacing: parent Stack trên markup; hook chỉ gap nội bộ identity/step/invite/thread-section.

---

## H. Deliberately NOT restored

- Legacy `!important` / inline style dump  
- `.ix-typo-price-s` 18px trên **table cell** (density sai; comment file cũ overstated)  
- Profile 90px avatar + accent ring + stats bleed `width: calc(100% + 48px)`  
- Referral F-tier 32px  
- Chat accent-colored section labels  
- `ix-detail-layout` 1fr/320 (Grid 8+4 đã đủ)  
- Page-wide tag styling  
- Generic Content Body / Card Body default stack  
- W02 `group-label` restyle (control đã mạch lạc)

---

## I. Changed files

- `design_system/sandbox/assets/reference-layers.css` — fill MODULE/PAGE; delete empty dead selectors  
- `design_system/references/patterns/order-detail/index.html` — stack on person/address; drop dead hooks  
- `design_system/references/patterns/user-profile/index.html` — stack on sidebar; KV group; drop dead hooks  
- `design_system/references/patterns/chat/index.html` — stack on rail  
- `design_system/references/patterns/referrals/index.html` — stack on how-to body; drop dead hooks  
- `design_system/references/patterns/wizard/index.html` — drop dead page aliases  
- `design_system/references/patterns/auth/index.html` — drop dead tabs/alert hooks  

Không sửa W02/W03 HTML.

---

## J. Before / after (problem pages)

| Page | Before | After |
|---|---|---|
| W04 | Name/SKU một hàng; value = body; totals dính; person dính | Name block + SKU muted; value 13/600; totals gap 4, total 16/800; person/address stacked |
| W05 | Name/stat = body; identity gap 0; KV dính | Name/stat 18/800; identity gap 8; stats row + border; KV stack-sm |
| W06 | Đã xong P6a-04 | Chỉ xóa hook rỗng. Form/Wizard giữ |
| W07 | Thread header phẳng; rail dính | Thread pad 12/16; label uppercase muted; rail stacked |
| W08 | Step dính; in-card 12 = body; table name/value phẳng | Step gap 8; metric 18/800; table 13/600 |
| W10 | Submit auto width; OTP = input thường | Submit/alt 100%; OTP 18 center |

---

## K. Regression (local, Chrome headless, 1280 + W04 390)

| Check | Result |
|---|---|
| W02 `h1` 24/800, `.ifx-label` 13 muted | PASS — không xuống cấp |
| W03 code/person/value 13/600 primary | PASS — module fill, Table/Stat nguyên |
| W04 name block 13/600, sku block muted, total 16/800, summary gap 4 | PASS |
| W04 390: no overflow-x | PASS |
| W05 name/stat 18/800, identity gap 8; light theme same size | PASS |
| W06 step-content flex gap 4, nav margin-top 0 | PASS |
| W07 person 13/600, section-label 12 uppercase muted, thread pad 12/16 | PASS |
| W08 label/value 13/600, in-card stat 18/800, step gap 8 | PASS |
| W10 submit width = card, OTP 18 center | PASS |
| Tabs / Form / Wizard / Chat bubble / Timeline / Stat Strip | không đụng Component CSS |

Staging URL sau push: cùng path trên `https://staging.iflux.vn/design_system/references/patterns/...`

---

## L. Residual

1. **Generic Content Body vẫn chưa bắt buộc** cho W02/W03/W06/W10 — Form + Stack + Card đủ.  
2. W04/W05/W07 rail KV vẫn là `small` + `flex` ad-hoc — chưa có KV component. Rhythm đã parent-owned; visual đủ dùng.  
3. Table numeric align / tabular trên cột SL vẫn deferred.  
4. W01 `.ref-page-table-list-stats/filters` và W02 leftover classes: control pages, không xóa markup.  
5. Token `--ifx-font-numeric` vẫn alias `--ifx-font-primary`.  
6. Flush table (W04) cell x 16 vs Footer 20 — composition finding cũ, không đụng.

---

## Explicit answers

1. **Global DS có thiếu gì không?** Không — thiếu lower-layer declarations trên hook đã migrate rỗng.  
2. **Global findings:** 0  
3. **Platform:** 0  
4. **Module:** 8  
5. **Page:** 16  
6. **Widget:** 0  
7. **Generic Content Body còn cần không?** Chưa. Wave này chứng minh phần lớn “body thô” là **empty module/page hooks + thiếu parent Stack**, không phải thiếu `.ifx-content-body`. Residual KV có thể là component riêng sau — không phải generic body.
