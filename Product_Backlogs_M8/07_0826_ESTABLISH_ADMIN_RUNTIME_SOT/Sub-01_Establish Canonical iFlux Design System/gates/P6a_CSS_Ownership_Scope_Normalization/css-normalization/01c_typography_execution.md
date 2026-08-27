# P6a — typography.css · Phase B execution

**Owner allocation:** APPROVED (Option B + A–V)  
**Status:** `EXECUTION = COMPLETE` · `OWNER_ACCEPTANCE = PENDING`  
**Ngày:** 2026-08-27

---

## Approved action → Actual

| Approved | Actual |
|---|---|
| Option B `sandbox/assets/reference-layers.css` | Created; linked from catalog + W01–W10 |
| KEEP document + semantic HTML + h* / body / caption tokens | Kept |
| KEEP `--ifx-text-btn-*` | Kept; `button.css` không đụng |
| DELETE display / h-class / title / body-class / label / overline / table-twin / chart / widget / status / price / utilities / `.ifx-font-numeric` | Deleted |
| Title/price/label/body HTML → `.ref-*` empty hooks | Migrated per §M §P §Q |
| W06 `h2` drop class | Done |
| Sandbox demo chỉ contract còn sống | Visual-role block removed |
| PLATFORM / WIDGET CSS = none | Empty subsections only |

## Files changed

- `design_system/foundation/typography.css`
- `design_system/tokens/source/typography.json` (note)
- `design_system/sandbox/assets/reference-layers.css` **new**
- `design_system/sandbox/index.html` (load file; bỏ `<style>` tạm)
- `design_system/sandbox/assets/sandbox.css` (`.sb-kicker` → primitive tokens; token overline đã xóa)
- `design_system/sandbox/sections/foundation.html`
- `design_system/sandbox/sections/components.html`
- `design_system/sandbox/sections/patterns.html`
- 10 × `references/patterns/*/index.html`

**Không đụng:** button / table / card / title / chip / breadcrumb / form / chart CSS · Admin · User Web

## Stale

- Deleted class HTML in `design_system/**` = **0**
- Deleted token CSS consume = **0** (`.sb-kicker` đã chuyển primitive)
- `--ifx-font-numeric` primitive **kept** (generated)
- `--ifx-font-mono` primitive **kept** (semantic `code`/`pre`)

## Future finding (không resolve trong wave này)

`BUTTON TOKENS CURRENTLY PHYSICALLY DECLARED IN TYPOGRAPHY FOUNDATION.`  
Review khi audit `button.css`.

## Unresolved

0 trong allocation đã duyệt.

## Owner Gate B

`OWNER_ACCEPTANCE = PENDING`

Hard refresh:

- https://staging.iflux.vn/design_system/sandbox/?section=foundation&panel=typography
- W01–W10 candidate URLs
