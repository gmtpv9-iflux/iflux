# P6a — CSS Normalization · `typography.css`

**Ngày:** 2026-08-27 · **SOP:** `03_Solution.md` · **Owner:** chờ review  
**Unresolved = 0**

---

## FILE

`design_system/foundation/typography.css`

| | |
|---|---|
| CURRENT OWNER | Global Foundation (đã đúng path) |
| FINAL OWNER | Global Foundation |
| LAYER | Foundation |
| CAPABILITY | Typography |

---

## Selector count

| | Count |
|---|---|
| BEFORE class/utility selectors | 86 |
| AFTER class selectors | 15 |
| BEFORE `:root` token groups (btn + market + table + chart + widget) | 8 extra groups |
| AFTER `:root` token groups | display · heading · title · body · caption/overline · label · **btn tokens only** |

Semantic HTML selectors (html/body/h1–h6/p/strong/em/small/blockquote/lists/code/pre/caption) = **KEEP**.

---

## KEEP

| Rule | Why Global |
|---|---|
| Display / heading / title / body / caption / overline / label **tokens** | Semantic text scale, domain-independent |
| `--ifx-text-btn-*` tokens | Primitive Button consumes; Component owns classes |
| `html` / `body` | Document contract |
| `h1`–`h6` `p` `strong` `em` `small` `blockquote` `ul/ol` `code` `pre` `figcaption` `caption` | Semantic HTML First (Rules §14) |
| `.ifx-typo-display-*` `.ifx-typo-title-*` `.ifx-typo-body-*` `.ifx-typo-label-*` `.ifx-typo-overline` | Visual role độc lập, không trùng tag |
| `.ifx-font-numeric` | Generic tabular family; không biết market object |

---

## DELETE

| Rule | Classification | Reason |
|---|---|---|
| `.ifx-typo-h1`–`.ifx-typo-h6` | DUPLICATE | Trùng `h1`–`h6`. Consumer chỉ Sandbox demo |
| `.ifx-typo-btn-*` | DUPLICATE / GLOBAL_PRIMITIVE wrong | Button CSS đã set size |
| `.ifx-typo-table-*` | DUPLICATE | `table.css` `th`/`td` đã sở hữu |
| `.ifx-typo-chart-*` | GLOBAL_COMPONENT wrong | `chart.css` đã set label/legend |
| `.ifx-typo-widget-*` `.ifx-typo-ranking-num` | WIDGET | Wrong-domain Global |
| `.ifx-typo-price-*` `.ifx-typo-percentage` `.ifx-typo-volume` `.ifx-typo-money` `.ifx-typo-index` `.ifx-typo-change` | MODULE (market) | Rules: Market stock style không Global |
| `.ifx-typo-timestamp` | REDUNDANT | `small` / caption đã có |
| `.ifx-typo-status-*` | REDUNDANT | Chip / alert sở hữu màu trạng thái |
| `.ifx-fs-*` `.ifx-fw-*` `.ifx-lh-*` `.ifx-tracking-*` | Utility framework | 0 consumer HTML trong `design_system/` |
| `.ifx-uppercase` `.ifx-lowercase` `.ifx-capitalize` `.ifx-underline` `.ifx-line-through` `.ifx-no-underline` `.ifx-font-mono` | Utility / REDUNDANT | 0 consumer; `code`/`pre` đã mono |

Token groups DELETE cùng class: price / percentage / volume / money / index / change / timestamp / table / chart / widget / ranking.

---

## MOVE

Không. Table / Button / Chart đã có contract tại owner đúng — không copy token/class sang file đích.

---

## Consumer migration

| Before | After | Files |
|---|---|---|
| `.ifx-typo-price-s` / `.ifx-typo-price-m` | `.ifx-font-numeric` | W03 `order-list` · W04 `order-detail` · W08 `referrals` |
| Sandbox `.ifx-typo-h1`–`h6` / price / table / timestamp / status | Xóa demo; heading = semantic `h1`–`h6` phía trên | `sandbox/sections/foundation.html` |

Stale consumer trong `design_system/` = **0**.

Admin_Design_system vẫn có twin legacy — **ngoài scope P6a** (chưa migrate Admin).

---

## Override conflicts

| Location | Property | Decision |
|---|---|---|
| P6 References | 0 local `font-size` / `font-weight` | — |
| `card.css` `.ifx-card-body > p { font-size: body-sm }` | font-size vs `body` | **KEEP** — Component owns internal body (Rules §15). Không xóa trong wave typography |
| `title.css` `p` trong page-title | font-size body-sm | **KEEP** — Title primitive contract |
| `form.css` `.ifx-label` | font-size sm | **KEEP** — Form field label ≠ `.ifx-typo-label-*` (visual role trên `p`) |
| `table.css` `th`/`td` | font-size | **KEEP** — Table owner |

Override declarations removed ở **typography.css**: không có lower-scope trong file này. Lower-scope unnecessary override không thuộc file này.

Empty local placeholders = 0.

---

## Regression

| Surface | Result |
|---|---|
| Sandbox Foundation → Typography | Semantic HTML + visual roles còn lại |
| W01 / W02 | Không dùng class đã xóa |
| W03 / W04 / W08 | Số dùng `.ifx-font-numeric` — size theo cell Table |
| W05–W07 / W09 / W10 | Title/body/label giữ |
| Dark/Light | Token semantic — không đổi |

---

## File completion

- [x] audit 100%
- [x] selector ownership 100%
- [x] UNKNOWN = 0
- [x] MOVE n/a
- [x] duplicate removed
- [x] pattern/reference updated
- [x] stale consumer (Canonical DS) = 0
- [x] ownership header updated

**File COMPLETE — chờ Owner PASS rồi chỉ định file CSS kế tiếp.**
