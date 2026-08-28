# P6a — Reusable Reference Template Parity

**MODE** = AUDIT → OWNER CLASSIFICATION → IMPLEMENT APPROVED PARITY  
**Date:** 2026-08-28  
**Baseline:** `TOKEN_LAYER = LOCKED` · `REFERENCE_COMPONENT_CLOSURE = PASS` · `CHAT_COMPONENT_NORMALIZATION = PASS` · commit `d7d74f6`  
**Scope:** W04 / W05 / W06 / W07 / W08 / W10  
**Measurement:** Chrome headless · local `127.0.0.1:8901` · 1440 / 768 / 390 · dark + light spot

Not reopened: Token · Foundation (except unapproved `block-title` removal) · Tabs/Wizard/Form hide+Stack contracts · rejected Chat 3-pane / 280–240 / viewport-height shell.

---

## Final gates

| Gate | Result |
|---|---|
| W04_PARITY | **PASS** |
| W05_TEMPLATE_PARITY | **PASS** |
| W06_TEMPLATE_PARITY | **PASS** |
| W07_TEMPLATE_PARITY | **PASS** |
| W08_PARITY | **PASS** |
| W10_TEMPLATE_PARITY | **PASS** |
| BLOCK_TITLE_NEEDED | **YES** |
| BLOCK_TITLE_OWNER | **PRIMITIVE** (Title · `.ifx-group-title`) |
| GENERIC_CONTENT_BODY_NEEDED | **NO** |
| REUSABLE_REFERENCE_PARITY | **PASS** |

---

## A. Cross-page content grammar

| Role | Existing contract? | Owner | Class | Notes |
|---|---|---|---|---|
| GROUP TITLE (caps muted) | **added** | Primitive / Title | `.ifx-group-title` | Typography only. Prefer `h3` inside Card. |
| Profile section heading (14/600 primary, not caps) | **added** | Module | `.ref-module-profile-heading` | W05 “Chi tiết”. Not Block Title. |
| PRIMARY TEXT | yes | context | Title / identity hooks / Form | Page or Form, not a new Body. |
| SECONDARY TEXT / META | yes | Foundation `small` + page role | `.ref-page-*-role` | Identity meta only. |
| HELPER | yes | Form | `.ifx-field-hint` | KEEP. |
| LABEL / VALUE (form) | yes | Form | `.ifx-label` + `.ifx-field-value` | KEEP. Do not `.ref-*`. |
| KV / INFO ROW (horizontal muted label + primary value) | **added** | Form | `.ifx-info-row` / `-label` / `-value` | W04 person. Not W05. |
| Profile KV (label 600 primary + value secondary + hairline) | **added** | Module | `.ref-module-profile-row/key/val` | W05 only. Different grammar than info-row. |
| Chat personal info (icon + text, not space-between) | **added** | Module | `.ref-module-chat-info` | W07. |
| ACTION ROW | yes | Module + Button | `.ref-module-chat-action` | Full-width ghost/outline. |
| IDENTITY | yes | Page | `.ref-page-user-profile-*` / `.ref-page-chat-*` | |
| LIST / LIST ITEM | yes | Timeline / Table / Chat item | existing | |
| STATUS | yes | Chip | existing | |
| TIMESTAMP | yes | Chat / Timeline meta | existing | |

Admin `.ix-menu-header` = Platform chrome. Not this contract.

**GENERIC_CONTENT_BODY_NEEDED = NO.** Heterogeneous bodies are role primitives + Module/Page composition. Do not add `.card-body p|span|li`.

---

## B. Block Title final decision

Owner temporarily added Foundation `block-title { padding: 16px 20px; … uppercase muted }`. **Not approved. Removed.**

- **BLOCK_TITLE_NEEDED = YES**
- **BLOCK_TITLE_OWNER = PRIMITIVE** (Title)
- Canonical HTML: semantic element + **`.ifx-group-title`**
- Do **not** use custom element `<block-title>`
- Do **not** use `.ifx-block-title` (name implies box/inset)

Name **group-title** because the role is a grouped-list heading (Personal Info / Options / Hội thoại), not a layout block.

---

## C. Block Title — typography vs inset

| Layer | Owns |
|---|---|
| **Typography** (Title) | size xs · weight semibold · caps tracking · uppercase · muted · margin 0 |
| **Composition** (parent) | padding · margin · gap · divider · placement |

**Generic Block Title must NOT own `padding: 16px 20px`.**

| Context | Inset owner | Evidence |
|---|---|---|
| Admin nav/module group | Platform `.ix-menu-header` | Different chrome. Out of scope. |
| Chat thread group | Module `.ref-module-chat-section-label` | pad `8 16 4` — list chrome |
| Chat User Info group | Card body + Stack | title pad **0** (measured) |
| Card body group | Card inset | body pad `16 20 20` |
| Profile sidebar “Chi tiết” | Module heading (not caps) | 13/600 primary |

If Title owned 16/20, Card + Title would double-inset. Padding varies → parent owns inset.

Measured after fix (W07, 1440):

| Title | Element | Size / weight | Padding |
|---|---|---|---|
| Hội thoại / Danh bạ | `p.ifx-group-title` + module pad | 12/600 | 8px 16px 4px |
| Thông tin / Tuỳ chọn | `h3.ifx-group-title` | 12/600 | 0 |

`p` inside `.ifx-card-body` loses `font-size` to existing `.ifx-card-body p` (0,2,1). Approved contract inside Card = **`h3.ifx-group-title`**. That Card `p` rule is leftover generic descendant — not extended this wave.

---

## D. W04 — Order detail

Legacy person KV = `.ix-info-row` + `.ix-info-label` / `.ix-info-value` (muted label · weighted value · space-between).

Canonical now uses Form **`.ifx-info-row`** (W04 now links `form.css`). Totals stay Page hooks (special total 16/800). No Content Body.

Measured 1440: label 13/400 muted · value 13/600 primary.

**W04_PARITY = PASS**

---

## E. W05 — User Profile (template)

### Measured 1440 (Canonical)

| Role | Size / weight | Other |
|---|---|---|
| Name | 18/800 | page identity |
| Role/meta | 13/400 muted | `.ref-page-user-profile-role` |
| Mini-stat value | 18/800 | bordered row |
| Group “Chi tiết” | 13/600 primary | **not** caps — Module |
| KV key | 13/600 primary | |
| KV value | 13/400 secondary | |
| Row | pad 8 / gap 8 / hairline | |
| Account `.ifx-field-value` | 13/600 primary | preserved |
| Account `.ifx-label` | 13/600 secondary | |
| Sidebar / content | 389 / 803 | Grid 4+8 |
| Avatar | Avatar `lg` | 90px ring omitted |

### Hierarchy restored

Name 18/800 → muted role 13 → chip → metrics 18/800 → “Chi tiết” 13/600 → key 600 / value secondary + row rhythm.

**W05_TEMPLATE_PARITY = PASS**

---

## F. W06 — Wizard visual + JS/state

Visual titles already Component-owned (16/600 + subtitle). Panel Stack lives (`display:flex`, gap 16).

### State matrix (mandatory)

| Step | Back visible | Next visible | Save visible | Back disabled | Order | Position | Legacy | Canonical |
|---|---|---|---|---|---|---|---|---|
| 0 Người | yes | yes | no | **yes** | Prev · Next | space-between | Prev disabled · Next only | match |
| 1 Phân loại | yes | yes | no | no | Prev · Next | space-between | Prev + Next | match |
| 2 Thuộc tính | yes | yes | no | no | Prev · Next | space-between | Prev + Next | match |
| 3 Phạm vi | yes | yes | no | no | Prev · Next | space-between | Prev + Next | match |
| 4 Xác nhận | yes | **no** | **yes** | no | Prev · Save | space-between | Submit replaces Next | match |

Back from last → Next returns, Save hides, title “Phạm vi”. Owner: Wizard **Component JS/CSS** (`is-last-step` + prev `disabled`). Not Page CSS.

Shared one nav (vs Legacy per-panel nav) = structural, accepted. Visibility matches Legacy.

**W06_TEMPLATE_PARITY = PASS**

---

## G. W07 — Chat / User Info

Chat Component normalization stays locked. No 3-pane / 240 / 100vh rewrite.

### Width classification (1440) — not “Card width”

| Layer | Canonical px | Owner |
|---|---|---|
| PAGE GRID WIDTH | 1216 | Foundation container/grid |
| CHAT COLUMN | 803 | Page Grid `col-8` |
| PROFILE COLUMN | 389 | Page Grid `col-4` |
| PROFILE CARD WIDTH | 389 | fills column — Card does not set width |
| CARD BODY WIDTH | 387 | Card |
| CONTENT INSET | 16/20/20 | Card body |
| GROUP WIDTH | 347 | body minus inset |
| ROW WIDTH | 347 | group — icon+text, not space-between |

Previous “wrong framing” = wide col-4 + anonymous space-between KV. Not a Card-width bug. Do not force 240.

### User Info restored (required)

| Legacy capability | Canonical |
|---|---|
| Personal Info group | `h3.ifx-group-title` “Thông tin” |
| mail + email | `.ref-module-chat-info` · `a1@example.com` |
| phone + number | `.ref-module-chat-info` · `0123 456 789` |
| clock + hours | `.ref-module-chat-info` · `T2–T6 09:00–17:00` |
| Options group | `h3.ifx-group-title` “Tuỳ chọn” |
| Important Contact | ghost action “Liên hệ quan trọng” |
| Shared Media | ghost action “Media chung” |
| Block Contact | outline action “Chặn liên hệ” |
| Name + muted role | `.ref-module-chat-person` + `.ref-page-chat-role` |

Icons accent (`--ifx-action-primary`). Options = Button (hover/focus already owned). English Vuexy copy genericized.

THREAD / CONVERSATION / COMPOSER already Component-owned.

**W07_TEMPLATE_PARITY = PASS**

---

## H. W08 — Referrals

After Component closure, remaining gap was in-card metric row chrome.

Implemented Page-only: `.ref-page-referrals-stat-row` border-block + stat pad 12 + dividers + 18/800 values.

Not restored: 72px dashed icons · F-tree · $ reward ornament.

**W08_PARITY = PASS**

---

## I. W10 — Auth

Stack after `d7d74f6` **works**. Do not add form-group margin.

| Viewport | panel display | child gaps (alert→field→field→action→alt) | label→input |
|---|---|---|---|
| 1440 | flex | 16 | 8 |
| 768 | flex | 16 | 8 |
| 390 | flex | 16 | 8 |

Added session helper under “Ghi nhớ”: `.ifx-field-hint`. OTP helper already Form-owned.

Tabs / register / reset / OTP present. No extra margins.

**W10_TEMPLATE_PARITY = PASS**

---

## J. Missing demo-content inventory

### W05

| | N |
|---|---|
| LEGACY_USEFUL_ITEMS | 22 |
| CANONICAL_PRESENT | 18 |
| MISSING_REFERENCE_CAPABILITY | **0** |
| INTENTIONALLY_OMITTED | **4** |

Present: avatar · name · role/meta · status chip · 3 mini-metrics · Details heading · 7 KV rows (mã/email/status/role/phone/date/region) · Edit · Lock · Account tab + readonly fields (`.ifx-field-value`) · Activity tab + timeline · Security tab + password + 2FA · edit modal.

Omitted: 90px accent ring · Plan card · Affiliate tab · Referral link/code card.

### W06

| | N |
|---|---|
| LEGACY_USEFUL_ITEMS | 12 |
| CANONICAL_PRESENT | 10 |
| MISSING_REFERENCE_CAPABILITY | **0** |
| INTENTIONALLY_OMITTED | **2** |

Present: 5 steps · current/done · panel title/subtitle · fields · Prev disabled step 0 · Next steps 0–3 · Save only step 4 · back restores Next.

Omitted: bordered radio-cards (`ix-radio-card`) · per-panel duplicate nav DOM.

### W07

| | N |
|---|---|
| LEGACY_USEFUL_ITEMS | 16 |
| CANONICAL_PRESENT | 14 |
| MISSING_REFERENCE_CAPABILITY | **0** |
| INTENTIONALLY_OMITTED | **2** |

Present: thread search · thread groups · conversation bubbles/time · composer · identity name · role · Personal Info (email/phone/hours + icons) · Options (star/media/block).

Omitted: 3-pane / 240 / 100vh shell · VoIP microphone (page contract: no VoIP).

### W10

| | N |
|---|---|
| LEGACY_USEFUL_ITEMS | 11 |
| CANONICAL_PRESENT | 8 |
| MISSING_REFERENCE_CAPABILITY | **0** |
| INTENTIONALLY_OMITTED | **3** |

Present: login · register · reset · OTP + helper · remember + session helper · tabs · demo alert · full-width submit · alt link.

Omitted: 100vh centered 420 · brand lockup · Google/social row · password-reveal control (no Form primitive; not invented).

No silent omissions. Every gap is either implemented or listed as intentional.

---

## K. Component / Primitive additions

| Addition | Owner | Why cannot modify only HTML |
|---|---|---|
| `.ifx-group-title` | Title primitive | Repeated caps group label. Not Foundation. |
| `.ifx-info-row` + label/value | Form | Repeated horizontal KV. W04 + future order/admin cards. |
| Wizard `is-last-step` hide Next / show Submit | Wizard CSS | Shared nav contract. |
| Wizard `paint()` last-step + prev disabled | Wizard JS | State, not Page CSS. |

Unapproved Foundation `block-title` **deleted**.

`.ifx-field-value` / `.ifx-field-hint` / Tabs+Wizard hide-only / Chat Component: **unchanged**.

---

## L. Module / Page changes

| Change | Layer |
|---|---|
| `.ref-module-chat-info` + accent icon | Module conversation |
| `.ref-module-chat-section-label` = inset only (typography → Title) | Module |
| `.ref-module-profile-heading/row/key/val` | Module profile |
| `.ref-page-user-profile-role` | Page W05 |
| `.ref-page-chat-role` (replaces `.ref-page-chat-meta`) | Page W07 |
| `.ref-page-referrals-stat-row` chrome | Page W08 |
| W04 person → `.ifx-info-row` + `form.css` link | Page consume Form |
| W05 Details + KV + role | Page consume Module |
| W07 User Info content + `h3.ifx-group-title` | Page consume Title + Module |
| W10 session hint | Page consume Form |
| W06 / Sandbox prev `disabled` initial | Template JS consume Wizard |

---

## M. Intentional Legacy differences

- W05: no 90px ring · no Plan card · no Affiliate tab · no referral card
- W06: `.ifx-choice` not `ix-radio-card` · one shared nav vs per-panel nav
- W07: no 3-pane / 240 rail / 100vh · no VoIP mic · generic copy (not josephGreen)
- W08: no 72 dashed icons / F-tree / $ ornament
- W10: no 100vh / brand lockup / Google · no password-eye
- No `ix-*` · no legacy tokens · no inline styles · no generic Content Body

---

## N. Files changed

- Foundation `typography.css` — **not shipped**. HEAD had no `block-title`. Local tracking edits restored to locked Foundation.
- `design_system/primitives/title/title.css` — `.ifx-group-title`
- `design_system/components/form/form.css` — `.ifx-info-row*`
- `design_system/components/wizard/wizard.css` — last-step action hide
- `design_system/components/wizard/wizard.js` — `is-last-step` + prev disabled
- `design_system/sandbox/assets/reference-layers.css` — module/page hooks
- `design_system/sandbox/sections/components.html` — sandbox wizard prev disabled
- `design_system/references/patterns/order-detail/index.html`
- `design_system/references/patterns/user-profile/index.html`
- `design_system/references/patterns/wizard/index.html`
- `design_system/references/patterns/chat/index.html`
- `design_system/references/patterns/auth/index.html`
- this file

---

## O. Responsive / light-dark regression

| Check | Result |
|---|---|
| Overflow 390 / 768 — W04 W05 W06 W07 W08 W10 | 0 |
| Overflow 1440 — W05 W07 W10 | 0 |
| Light theme W05 W07 W10 | `data-theme=light` · bg `rgb(245,245,249)` · overflow 0 |
| W10 Stack 1440/768/390 | 16px all child gaps |
| W06 back from last | Next restored |
| W02/Sandbox Wizard | same Component JS (Save hidden until last) |

---

## 17. Current `.ref-*` hooks (scoped + related)

| Hook | Verdict |
|---|---|
| `.ref-module-order-*` | KEEP |
| `.ref-page-order-detail-*` | KEEP |
| `.ref-module-profile-*` | IMPLEMENT (this wave) |
| `.ref-page-user-profile-*` | KEEP · role IMPLEMENT |
| `.ref-module-chat-thread-section` / person / actions / action | KEEP |
| `.ref-module-chat-section-label` | KEEP as **inset only** |
| `.ref-module-chat-info` | IMPLEMENT |
| `.ref-page-chat-identity` | KEEP |
| `.ref-page-chat-role` | IMPLEMENT |
| `.ref-page-chat-meta` | DELETE_MEANINGLESS — removed |
| `.ref-module-referral-*` | KEEP |
| `.ref-page-referrals-stat*` | IMPLEMENT chrome |
| `.ref-page-referrals-step` / invite | KEEP |
| `.ref-page-auth-submit/alt/otp` | KEEP |
| Empty W01/W03 class names on Stat Strip (`ref-page-*-stats`) | NO_LONGER_NEEDED — no CSS; left as harmless markers (out of HTML scope this wave) |

No `.ref-*` overrides Component roles (`.ifx-field-value`, `.ifx-field-hint`, `.ifx-info-row`, `.ifx-group-title`, Wizard/Tabs).

---

## STOP

Implementation complete for high-confidence owners. No new architecture opened.

**Do not begin P6a final lock automatically.**
