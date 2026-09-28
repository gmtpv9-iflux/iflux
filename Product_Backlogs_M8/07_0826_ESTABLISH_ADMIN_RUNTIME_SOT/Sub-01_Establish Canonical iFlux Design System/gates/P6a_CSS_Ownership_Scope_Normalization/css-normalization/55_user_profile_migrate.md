# User Profile — migrate trực tiếp (responsibility → owner → apply → compare)

**Date:** 2026-08-31  
**Baseline clone:** `366f6ef` / freeze `patterns/_tmp_legacy_up/`  
**Compare:** Chrome 1440 + 768, dark, `127.0.0.1:8773`

Không mở Pattern khác. Foundation không delete/rename/đổi metric Global.

---

## A. ĐÃ THAY

| Legacy | Canonical | Exact Owner/File | Parity |
|---|---|---|---|
| `--ix-*` / dump tokens | `--ifx-*` generated | `01_tokens/` | Δ=0 |
| `html,body` rem 15px | `html.ifx-profile-host` font-size md | `04_components/21_profile/profile.css` | Δ=0 |
| `.ix-content` pad container | `.ifx-profile-page` | `21_profile/profile.css` | 1440 Δ=0 |
| `.ix-breadcrumb` | `.ifx-breadcrumb` | `04_components/02_breadcrumb/breadcrumb.css` | Δ=0 |
| `.ix-card` (0 shadow) | `.ifx-card.ifx-card-plain` | `04_components/03_card/card.css` | Δ=0 |
| `.ix-profile-avatar` 90 | `.ifx-avatar-2xl.ifx-avatar-solid` | `03_primitives/02_avatar/avatar.css` | Δ=0 |
| `.ix-chip` + 11px | `.ifx-chip` + `.ifx-chip-sm` | `03_primitives/05_chip/chip.css` | Δ=0 |
| `.ix-btn*` | `.ifx-btn*` / `.ifx-btn-outline-danger` | `03_primitives/04_button/button.css` | Δ=0 |
| `.ix-label` / `.ix-input` | `.ifx-label` / `.ifx-input` | `04_components/08_form/form.css` | Δ=0 |
| `.ix-progress` 6px | `.ifx-progress-sm.ifx-progress-soft` | `03_primitives/07_progress` + profile | Δ=0 |
| `.ix-stat-icon` 32 | `.ifx-stat-icon-sm` | `04_components/13_stat/stat.css` | Δ=0 |
| `.ix-profile-tab.active` | `.ifx-profile-tab.is-active` | `21_profile/profile.css` | Δ=0 |
| `.ix-detail-list` (KV, không icon-list) | `.ifx-meta-list` | `21_profile/profile.css` | Δ=0 |
| Details title 14/600 | `.ifx-profile-details-title` (không `.ifx-group-label`) | `21_profile/profile.css` | Δ=0 |
| `.ix-plan-*` / `.ix-ref-*` / `.ix-layer-*` | `.ifx-plan-*` / `.ifx-ref-*` / `.ifx-layer-*` | `21_profile/profile.css` | Δ=0 |
| `.ix-act-*` | `.ifx-activity-*` | `21_profile/profile.css` | Δ=0 |
| `.ix-aff-*` / network tiles | `.ifx-aff-*` / `.ifx-network-*` | `21_profile/profile.css` | Δ=0 |
| `.ix-table` isolate | `.ifx-table.ifx-table-md` | `04_components/14_table/table.css` | th Δ=0 |
| `.ix-table-search` | `.ifx-search` + `IfxDataList` | `12_search` + `19_data-list` | behavior |
| `.ix-modal-box` 520/32 | `.ifx-profile-modal-box` + `IfxModal` | `09_modal` + profile | Δ=0 |
| `ixToast` / `PatternUserProfile` | `IfxToast` / `IfxProfile.init` | `17_toast` + `21_profile/profile.js` | Δ=0 |

Chrome 1440 paired probes: **deltaCount = 0**. Tab / modal open-close / leftover `.ix-*` = 0.

---

## B. ĐÃ BỔ SUNG DESIGN SYSTEM

| Contract mới/extend | Exact File | Vì sao cần |
|---|---|---|
| `--ifx-size-avatar-2xl` 90px | `01_tokens/01_source/size.json` | thiếu size 90 |
| `.ifx-avatar-2xl` + `.ifx-avatar-solid` | `03_primitives/02_avatar/avatar.css` | thiếu size/fill isolate |
| `.ifx-chip-sm` | `03_primitives/05_chip/chip.css` | 11px isolate |
| `.ifx-card-plain` | `04_components/03_card/card.css` | dump card 0 shadow |
| `.ifx-stat-icon-sm` | `04_components/13_stat/stat.css` | 32px (generic 44) |
| `.ifx-table-md` | `04_components/14_table/table.css` | cell 14 / secondary / pad isolate |
| `21_profile` chrome + `IfxProfile` | `04_components/21_profile/profile.css` + `profile.js` | workspace Profile (không Widget) |

Không tạo `.ifx-profile-group-label` / `.ifx-profile-icon-list` / namespace `--ix-*`.

---

## C. CHƯA THAY

| Legacy | Lý do |
|---|---|
| Chrome **768** page/grid height **3.3px** | Mọi contract đã probe khớp; còn stack tổng. Chưa coi 768 = VERIFIED. |
| `@media max-width:1024` → `min-width:1024` | Governance 5 mốc. Invert 1px đúng 1024. Không đổi Foundation. |
| `.ifx-input:focus` ring | Giống dump (`3px` soft). Không đụng Form Global thêm. |

---

## D. Gate

```
USER_PROFILE_LEGACY_CLONE            = PASS
CANONICAL_REPLACEMENT_VERIFIED       = FAIL   (1440 = 0; 768 stack 3.3px)

DESIGN_SYSTEM_WRONG_OWNER_ADDITION   = 0
FOUNDATION_UNRELATED_CHANGE          = 0
TOKEN_DUPLICATE                      = 0
DUPLICATE_CANONICAL_CONTRACT         = 0

MATERIAL_VISUAL_DELTA                = 1      (768 page/grid 3.3px)
BEHAVIOR_DELTA                       = 0

LEGACY_CLASS                         = 0
LEGACY_TOKEN                         = 0
INLINE_VISUAL_STYLE                  = 0
LEGACY_RESIDUAL                      = 0
PATTERN_VISUAL_AUTHORITY             = 0
```

Pattern chỉ còn `index.html` + `page.js`. Dump `user-profile.css` / `user-profile.js` đã xóa sau khi 1440 paired = 0.

Chưa commit / chưa push. Freeze local: `patterns/_tmp_legacy_up/` (không commit).
