# P6a — utilities.css · Phase B execution

**Owner allocation:** APPROVED  
**Status:** `EXECUTION = COMPLETE` · `OWNER_ACCEPTANCE = PENDING`  
**Ngày:** 2026-08-27

---

## Approved action → Actual

| Approved | Actual |
|---|---|
| KEEP `.ifx-stack-sm` `.ifx-stack-md` | Kept |
| KEEP `.ifx-inline-xs` `.ifx-inline-sm` `.ifx-inline-md` | Kept |
| KEEP tokens `--ifx-gap-*` `--ifx-stack-*` `--ifx-inline-*` `--ifx-padding-*` `--ifx-inset-*` `--ifx-space-*` | Untouched (semantic.css / layout.css / components) |
| DELETE all `.ifx-p-*` `.ifx-m-*` `.ifx-mt-*` `.ifx-mb-*` `.ifx-gap-*` | Deleted |
| DELETE stack-xs/lg/xl · inline-lg/xl | Deleted |
| DELETE `.ifx-space-*` regions · hidden · block · w-full · text-* · truncate | Deleted |
| `!important` = 0 | **0** in `utilities.css` |
| W01–W10 drop `.ifx-p-24` | Done; `.ifx-container` owns gutter |
| W07 `.ifx-p-16` → MODULE hooks empty | `.ref-module-chat-thread-section` · `.ref-module-chat-section-label` |
| mb/mt/gap/w-full/text-center/block → PAGE/MODULE hook empty, or DELETE only | Per allocation |
| W02 `.ifx-mb-12` on group-label | DELETE only |
| `.ifx-mb-0` on small / p / form-group / form-row | DELETE only; no local zero |
| PLATFORM / WIDGET | No new allocation |
| Do not edit layout/form/card/table/button/chat/stat | Untouched |

## Files changed

- `design_system/foundation/utilities.css`
- `design_system/sandbox/assets/reference-layers.css`
- `design_system/sandbox/assets/sandbox.css` (xóa demo `.sb-pg-gap-*` chết)
- `design_system/sandbox/sections/foundation.html`
- `design_system/sandbox/sections/primitives.html`
- `design_system/sandbox/sections/components.html`
- `design_system/sandbox/sections/patterns.html`
- `design_system/sandbox/playground/preview.html`
- 10 × `references/patterns/*/index.html`

## Stale

- Deleted **class** HTML in `design_system/**` = **0**
- Token consume by components/layout/sandbox = **kept**

## Regression — chưa fill CSS

Hook mới = **rỗng**. Owner review các điểm sau (không tự vá):

| Pattern | Element | Property vừa mất |
|---|---|---|
| W01–W10 | `<main.ifx-container>` | `padding: 24` mọi cạnh; horizontal còn từ container token |
| W01–W10 | Theme row | `margin-bottom: 16` |
| W01 / W02 / W05 / W06 / W08 | `.ifx-form-group` | undo `mb-0` → stack-md trở lại |
| W05 | `.ifx-form-row` | undo `mb-0` → 16 trở lại |
| W04 / W05 / W07 | `p` | undo `mb-0` → stack-sm trở lại |
| W02 / W04 / W05 / W07 / W08 | flex columns / rows từng có `.ifx-gap-*` | `gap` |
| W05 / W07 / W08 | stats / identity | `text-align: center` · một số `width: 100%` |
| W07 | thread section / labels | `padding: 16` |
| W07 / W10 | buttons | `width: 100%` |
| W10 | OTP input | `text-align: center` |
| W04 | footer stack | `width: 100%` (div block — có thể không đổi) |
| Sandbox primitives wrap | button/chip/badge/avatar rows | `gap` |

Nếu một element **gãy thật** → Owner chỉ đúng Pattern + element + property. Không fill hook trước.

## Owner Gate B

`OWNER_ACCEPTANCE = PENDING`

Hard refresh:

- https://staging.iflux.vn/design_system/sandbox/?section=foundation&panel=spacing
- W01–W10 candidate URLs
