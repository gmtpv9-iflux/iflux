# P6a — Chat Phase 3 — Canonical Mapping / Ownership Audit

**Date:** 2026-08-28  
**Mode:** AUDIT ONLY — 0 HTML / CSS / JS / class rename / commit  
**Baseline:** `CHAT_TEMPLATE_ISOLATED = PASS` (`37`)  
**SoT:** [`docs/SoT — Canonical UI Architecture (Design System ↔ Pattern).md`](../../../../../../../docs/SoT%20—%20Canonical%20UI%20Architecture%20(Design%20System%20↔%20Pattern).md) §3.1 · §4.1 · §8 · §12  
**Artifact:** `patterns/chat/` (`index.html` · `chat.css` dump · `chat.js` PatternChat)

```
CHAT_MAPPING_AUDIT = COMPLETE
READY_FOR_PHASE_4_REVIEW = YES
```

Luật map: `CAN_MAP_EXISTING` chỉ khi **cùng responsibility + cùng visual contract + cùng behavior (nếu có)**. Cùng `flex` / cùng màu / cùng px **không đủ**. `PARTIAL` không tự map.

Classification (architecture lock — **không** PLATFORM / MODULE / PAGE / WIDGET):

1. **DESIGN SYSTEM EXISTING**
2. **DESIGN SYSTEM MISSING GENERIC CONTRACT**
3. **PATTERN LOCAL**
4. **EXCLUDE / RUNTIME**

Cấm thêm rule `reference-layers.css`. Residual Chat không đẩy vào file đó.

---

## A. Structure inventory

| ID | Khối | Legacy source | Role | Classification |
|---|---|---|---|---|
| A | `.ix-content` | `index.html` + dump pad `--ifx-space-container` (30px @1440 / 15px rem) | Frame pad sau isolate | **PATTERN LOCAL** |
| B | `.ix-chat-layout` `data-ix-chat` | dump: flex, `height: calc(100vh - 140px)`, `min-height: 600`, radius lg, border, surface | Workspace **3 pane** | **PATTERN LOCAL** |
| C | `.ix-chat-sidebar` | **280px** fixed | Thread pane | **PATTERN LOCAL** (width). Unit list → xem E / IfxChat |
| D | Section “Chats” / “Contacts” | inline uppercase 11 / 600 / accent / tracking `.5px` | List group label | **DS EXISTING PARTIAL** → không map (xem §7) |
| E | `.ix-chat-item*` `.active` | pad **10×16**, name 14, preview 12, time 10 | Thread row | **DS MISSING GENERIC** (IfxChat item sai contract) |
| F | Avatars / presence | `.ix-avatar` 36+ring; sm 28; inline 32 / 28 / 56; span 8px online | Identity | **PARTIAL** sm+status; **DS MISSING** 32/56/accent/ring |
| G | `.ix-chat-main` | flex column, overflow hidden | Conversation column | **DS EXISTING PARTIAL** (`.ifx-chat-main` cùng role, thiếu 3-pane context) |
| H | `.ix-chat-header` + icon actions | pad 12×20; phone/video/search/dots visual | Conversation header | Header chrome **DS MISSING / PARTIAL**; VoIP **EXCLUDE** |
| I | `.ix-chat-body` `#chat-messages` | pad 20, gap 16 | Message scroller | **DS EXISTING PARTIAL** (`.ifx-chat-body` pad/gap khớp token 20/16) |
| J | `.ix-chat-msg` / `.sent` / `.ix-chat-bubble` | bubble **60%** / **10×14** / **r12** / sent accent | Message | Width+radius gần IfxChat; pad/font/DOM **DS MISSING** |
| K | `.ix-chat-time` + `ti-checks` | 10px muted; ticks inline | Meta | **DS MISSING** (`.ifx-chat-meta` không ticks; IfxChat send không emit time) |
| L | `.ix-chat-footer` / `.ix-chat-input` / Send | composer + `.ix-btn-primary` | Composer | **DS MISSING GENERIC** (IfxChat dùng form + `.ifx-input`) |
| M | mic / clip | `.ix-btn-icon` visual | Attach chrome | Visual **PATTERN LOCAL**; runtime **EXCLUDE** |
| N | `.ix-chat-profile` | **240px** + Personal Info / Options | Contact rail | **PATTERN LOCAL** — không có trong IfxChat |
| O | Personal Info / Options | inline 11 muted uppercase `.5px` | Rail groups | Label **PARTIAL** vs `.ifx-group-label`; content **PATTERN LOCAL** |
| P | 67 `style=` | xem §E | one-off / demo | xem inventory |

Cây bắt buộc giữ ở Phase 4 (không gộp 2-pane):

```
.ix-content
  .ix-chat-layout
    .ix-chat-sidebar
    .ix-chat-main
    .ix-chat-profile
```

Không Card: lockup giống card nhưng responsibility = workspace, không `.ifx-card`.  
Không Page Header.  
Không Widget generic.

---

## B. CSS selector inventory (`chat.css` dump)

Heuristic: selector consumed nếu class/id xuất hiện trên HTML isolate, hoặc `html` / `body` / `:root` / `[data-theme]` / `*`.

| Metric | Count |
|---|---|
| TOTAL unique selectors | **858** |
| CONSUMED (true template + document/theme) | **47** |
| UNUSED / dead dump | **811** |
| False-positive `.active` (wizard/tab/nav-pill…) | 8 — **dead**, HTML `active` chỉ trên `.ix-chat-item` |

### B1. Consumed (template)

| Group | Selectors |
|---|---|
| Document | `*` `html` `body` `:root` `[data-theme="dark"|"light"]` |
| Frame | `.ix-content` |
| Avatar | `.ix-avatar` `.ix-avatar img` `.ix-avatar-sm` `-success` `-warning` `-danger` `-info` `-accent` |
| Button | `.ix-btn` `.ix-btn-icon` `:hover` `.ix-btn-primary` `:hover` `:active` |
| Chat | 22 selectors `.ix-chat-*` (layout → profile, item states, bubble sent, input focus) |

Không consume: `.ix-avatar-online` (presence = span), `.ix-avatar-lg` (56px là **inline** trên `.ix-avatar-sm`), `.ix-avatar-group*`.

### B2. Unused dump register (rút Phase 4, không tree-shake Phase 3)

Khối leftover lớn: `.ix-typo*` · `.ix-stat*` · `.ix-table*` · `.ix-profile*` · `.ix-modal*` · `.ix-wizard*` · `.ix-auth*` · `.ix-chip*` · `.ix-timeline*` · `.ix-input*` / form · utilities `.ix-p*` `.ix-m*` · hub · referral · top10 · heart/follow.

Giữ dump token/theme (`:root`, `[data-theme]`, typography rem **15px**) tới khi Phase 4 link Canonical tokens + quyết định rem.

---

## C. Inline-style inventory

**67** `style=` · **33** chữ ký unique.

| # | Exact inline | n | Role | Canonical | Match | Classification | Phase 4 |
|---|---|---|---|---|---|---|---|
| IN01 | `display:flex;align-items:center;gap:10px;margin-bottom:10px` | 1 | Self row | `.ifx-inline-*` gap 8/12 ≠ 10 | no | **PATTERN LOCAL** / PURE_LAYOUT | local hook |
| IN02 | `width:32px;height:32px;font-size:12px` | 1 | John avatar | sm 28 / md 36 — **không 32** | no | **DS MISSING** size 32 | extend avatar **hoặc** local |
| IN03 | `font-size:13px;font-weight:600;color:var(--ix-text-primary)` | 1 | “John Doe” | title-sm / font-size-sm = 13 @16px | PARTIAL | **PATTERN LOCAL** | local type |
| IN04 | search icon absolute 13px | 1 | Filter chrome | `.ifx-search` height 36, không overlay | no | **PATTERN LOCAL** | local |
| IN05 | search input pad 7/10/7/32, fs 13 | 1 | Filter field | `.ifx-search` / `.ifx-input` focus ring + 36 | no | **PATTERN LOCAL** | local |
| IN06 | Chats label 11/600/accent/uppercase/.5px | 1 | Group label | `.ifx-group-label` 12 / muted / 0.8px | PARTIAL | không map (§7) | Owner chọn |
| IN07 | Contacts = IN06 + `margin-top:8px` | 1 | Group label | same | PARTIAL | same | same |
| IN08 | `position:relative;flex-shrink:0` | 2 | Presence host | `.ifx-avatar-online` | PARTIAL | **PATTERN LOCAL** (span ≠ `::after`) | local hoặc online |
| IN09 | presence 8×8 success + border card | 2 | Online dot | `.ifx-avatar-online::after` 8px | PARTIAL | **DS EXISTING PARTIAL** | map online **nếu** chấp nhận pseudo |
| IN10 | `flex:1;min-width:0` | 6 | Row grow | utility / flex child | n/a | **PURE_LAYOUT** | local |
| IN11 | `display:flex;justify-content:space-between;align-items:center` | 3 | Name+time row | no primitive | n/a | **PURE_LAYOUT** | local |
| IN12 | `flex-shrink:0` | 4 | Avatar lock | avatar `flex-shrink:0` | yes (prop) | **PURE_LAYOUT** | drop khi class đủ |
| IN13 | `flex-shrink:0;font-size:11px` | 3 | FR bubble avatar | sm 28 + 2xs | PARTIAL | **PATTERN LOCAL** | local fs |
| IN14 | `width:28px;height:28px;font-size:11px;flex-shrink:0` | 3 | JD msg avatar | `.ifx-avatar-sm` 28 / 2xs | PARTIAL | **DS EXISTING PARTIAL** | sm nếu chấp nhận mất ring (base ring chỉ `.ix-avatar`) |
| IN15 | `text-align:right` | 3 | Sent time | no | n/a | **PURE_LAYOUT** | local / sent meta |
| IN16 | ticks `color:var(--ix-success);font-size:12px` | 3 | Read receipt | none | no | **PATTERN LOCAL** visual; runtime **EXCLUDE** | local |
| IN17 | header cluster `gap:10px` | 1 | Header identity | inline-md = 12 | no | **PURE_LAYOUT** | local |
| IN18 | header avatar `font-size:12px` | 1 | Initials | sm 2xs | PARTIAL | **PURE_LAYOUT** | local |
| IN19 | name 14/600/primary | 2 | Header + rail name | Ifx title sm 13 | PARTIAL | **PATTERN LOCAL** | local |
| IN20 | role 12/muted | 2 | Header + rail role | `.ifx-chat-header-meta` xs 12 | PARTIAL | **DS EXISTING PARTIAL** | meta **nếu** 12@16 |
| IN21 | `display:flex;gap:4px` | 1 | Icon cluster | none 4px token used as space-4 | n/a | **PURE_LAYOUT** | local |
| IN22 | `font-size:16px` on `i` | 6 | Header/composer icons | `.ifx-icon` md | PARTIAL | **PURE_LAYOUT** / asset Tabler | optional `.ifx-icon` |
| IN23 | `font-size:14px` Send icon | 1 | Send glyph | icon sm | PARTIAL | **PURE_LAYOUT** | local |
| IN24 | `margin-top:6px` 2nd bubble | 1 | Stack received | `.ifx-chat-bubble +` margin **8** | no | **PATTERN LOCAL** | local 6 hoặc chấp nhận 8 |
| IN25 | rail column center gap 8 | 1 | Profile hero | none | n/a | **PATTERN LOCAL** | local |
| IN26 | `width:56px;height:56px;font-size:20px` | 1 | Rail avatar | lg = **48** | no | **DS MISSING** 56 | extend **hoặc** local |
| IN27 | Personal Info / Options label 11/600/uppercase/.5px/muted/mb 10 | 2 | Group label | `.ifx-group-label` 12/0.8/muted | PARTIAL | §7 | Owner chọn |
| IN28 | rail list column gap 8 fs 12 secondary | 2 | Meta stack | none | n/a | **PATTERN LOCAL** | local |
| IN29 | row `gap:6px` + icon accent | 3 | Info rows | none | n/a | **PATTERN LOCAL** | local |
| IN30 | Options row + pointer | 2 | Fake actions | none | n/a | **PATTERN LOCAL** visual; **EXCLUDE** runtime | local |
| IN31 | Block Contact + danger | 1 | Destructive row | none | n/a | same | local |
| IN32 | search wrap `position:relative` | 1 | Icon host | `.ifx-search` | no | **PURE_LAYOUT** | local |

Hardcode 280 / 240 / 60% / 12 **không** tự thành token debt. 60% + r12 đã có trên IfxChat (`max-width: 60%`, `--ifx-radius-xl: 12px`). 280 / 240 = Pattern widths.

---

## D. JS behavior inventory

`patterns/chat/chat.js` = `PatternChat.init()` only. Không `IfxChat`.

| Behavior | PatternChat | IfxChat (`components/chat/chat.js`) | Class |
|---|---|---|---|
| Root | `[data-ix-chat]` | `[data-ifx-chat]` | PARTIAL |
| Chọn thread | `.ix-chat-item` + `.active` | `.ifx-chat-item` + `.is-active` | PARTIAL |
| Update title | `#chat-active-name` + role + avatar initials | chỉ `[data-ifx-chat-title]` | **PATTERN LOCAL** (rail + role) |
| Update profile rail | `#right-name/role/avatar` | **không có** | **PATTERN LOCAL** |
| Send | button `[data-ix-chat-send]` + Enter trên input | `form submit` | PARTIAL |
| Append DOM | `.ix-chat-msg.sent` + `.ix-avatar` 28 + `.ix-chat-bubble` + `.ix-chat-time` | `.ifx-chat-message.is-sent` + bubble **only** | **NONE** — không cùng contract |
| Active class | `active` | `is-active` | PARTIAL |
| Toast / persist / VoIP | không | không | — |

Phân loại JS:

| | |
|---|---|
| **A. Generic** (có thể thuộc `IfxChat` sau khi Owner duyệt extend) | Chọn thread; append sent bubble; Enter/send; scroll body |
| **B. Pattern-local demo** | Sync 3rd pane; initials; hardcoded `OP` avatar; `data-chat-name/role`; IDs `#chat-*` / `#right-*` |
| **C. Exclude / runtime** | VoIP, search filter, Options, persist, GIS |

Phase 3: **không move JS**.

---

## E. Token mapping

| Legacy | DS token | Same value? | Action Phase 4 |
|---|---|---|---|
| `--ix-text-*` / `--ix-bg-*` / `--ix-accent` | `--ifx-text-*` / `--ifx-bg-*` / `--ifx-action-primary` | theme tương đương, tên khác | Remap khi link Canonical CSS — **không** invent token |
| `--ix-radius` / `--ix-radius-lg` | `--ifx-radius-button` / `--ifx-radius-card` | cần đo | consume DS |
| `--ifx-font-size-14/12/10` trong dump | cùng tên trên DS | dump rem @ **15px** html; DS sandbox thường **16px** | **PATTERN LOCAL** giữ rem 15 **hoặc** Owner chấp nhận 16 |
| `--ifx-space-container` dump | DS spacing | 30px @1440 (space-32 @15px) | frame local |
| `--ifx-inset-widget` | `--ifx-inset-compact` (12 16) | cùng 2-value | có thể consume |
| 280 / 240 px | **không có** token | — | Pattern local; không tạo token trừ Owner |
| 60% / 12px bubble | đã có trên IfxChat | width+radius **MATCH** | reuse khi IfxChat pad/font được extend |
| `letter-spacing: .5px` | không; group-label lock = **0.8px** | no | local hoặc chấp nhận 0.8 |
| `4px` icon gap | `--ifx-space-4` = 0.25rem | gần | PURE_LAYOUT |

Token layer **LOCKED**. Không invent.

---

## F. Primitive mapping

| Candidate | Legacy | Canonical | Visual | Behavior | Verdict |
|---|---|---|---|---|---|
| Button primary Send | `.ix-btn.ix-btn-primary` | `.ifx-btn.ifx-btn-primary` | dump `border:none`; DS `border:1px transparent`; pad token gần | click send ≠ form | **PARTIAL** — không tự map |
| Button icon | `.ix-btn-icon` 32×32 px | `.ifx-btn-icon` `--ifx-space-32` (2rem) | @15px rem → 30 vs 32 | visual only | **PARTIAL** |
| Avatar sm + status | `.ix-avatar-sm` 28 + success/info/… | `.ifx-avatar-sm` 28 + cùng status (không accent) | gần | none | **CAN_MAP_EXISTING** cho sm+success/warning/danger/info |
| Avatar default / ring | `.ix-avatar` 36 + **2px ring** + `margin-left:4` | `.ifx-avatar` 36, **không ring** | no | — | **DS MISSING** ring **hoặc** local |
| Avatar 32 / 56 | inline | sm 28 / md 36 / lg **48** | no | — | **DS MISSING** |
| Avatar accent | `.ix-avatar-accent` | **không có** `.ifx-avatar-accent` | — | — | **DS MISSING** |
| Online | span 8px | `.ifx-avatar-online::after` 8px | PARTIAL | — | PARTIAL |
| Search | inline ~32 | `.ifx-search` **36** + focus ring + max 256 | no | filter **không chạy** | không map |
| Input/Form | `.ix-chat-input` | `.ifx-input` | pad/focus khác | composer ≠ field | **DS MISSING** composer **hoặc** local |
| Card | — | `.ifx-card` | — | — | **NONE** |
| Group label | xem §7 | `.ifx-group-label` | PARTIAL | — | không tự map |
| Icon wrapper | raw `.ti` + fs inline | `.ifx-icon` | box khác | — | **CAN_MAP** asset Tabler; class wrapper **PARTIAL** |
| Typography heading | không h1 | h1–h6 / group-label | — | — | frame không heading |

---

## G. Component mapping

| Component | Use? | Verdict |
|---|---|---|
| `components/chat` IfxChat | cùng family hội thoại | **PARTIAL / NONE workspace** — xem §H |
| `components/search` | thread filter | **NONE** (36 ≠ ~32; không behavior) |
| `components/form` | composer | **NONE** (IfxChat đang compose Form; Legacy không) |
| `components/card` | — | **NONE** |
| `components/page-header` | — | **NONE** — cấm thêm |
| `widgets/*` generic | — | **NONE** |

---

## H. Chat Component gap matrix

So `design_system/components/chat/chat.css` + `chat.js` với isolate.

| Contract | LEGACY (isolate) | CANONICAL CURRENT | MATCH | Recommendation |
|---|---|---|---|---|
| Workspace | 3 pane; `100vh-140`; min 600; full well | 2 pane; **37.5rem** fixed; no profile | **NONE** | **PATTERN LOCAL**. Không nhét 3-pane vào DS (SoT: Chat page/3-pane ≠ DS). |
| Thread pane | **280** always | **256** (`--ifx-space-256`) from md; stack mobile | **NONE** | Pattern width 280. Không đổi IfxChat 256 trừ Owner extend. |
| Thread item | pad **10×16**; name **14**; preview **12**; time **10**; `.active` | pad **12×16**; name **sm 13**; preview **xs 12**; time **2xs 10**; `.is-active` | **PARTIAL** | **DS MISSING**: variant/item contract = Legacy **hoặc** Pattern override. |
| Section label | 11 accent uppercase .5 | không có; W07 từng `.ref-module-chat-section-label` | **NONE** | Không dùng `reference-layers`. §7. |
| Main column | flex grow giữa 280 và 240 | flex grow trong 2-pane | **PARTIAL** | Reuse layout rules chỉ sau khi workspace Pattern bọc. |
| Header | 12×20; name 14; role 12; 4 icon | 12×20; title sm; meta xs; **0 icon** | **PARTIAL** | Chrome actions = Pattern / EXCLUDE VoIP. |
| Message row | avatar + bubble + time | bubble only on send | **NONE** | **DS MISSING** emit avatar+meta **hoặc** PatternChat giữ. |
| Bubble | 60% / **10×14** / **12** / font 14 | **60%** / **8×12** / **12** / sm 13 | **PARTIAL** | Width+radius MATCH. Pad/font = extend IfxChat **hoặc** local. |
| Sent | `--ix-accent` + `#fff` | `--ifx-action-primary` + on-primary | **PARTIAL** | Theme remap. |
| Time / ticks | 10px + checks | `.ifx-chat-meta` no ticks; send không tạo | **NONE** | Pattern visual; ticks **EXCLUDE** runtime. |
| Composer | `.ix-chat-input` + icons + Send | `.ifx-chat-input-bar` + `.ifx-input` + form | **NONE** | **DS MISSING** composer **hoặc** local. |
| Profile rail | 240 + info + options | **không có** | **NONE** | **PATTERN LOCAL**. Không `.ifx-chat-profile` Global trừ Owner mở. |
| Responsive | không MQ; 390 main width 0 | stack → md 2-pane | **NONE** | Pattern giữ 3-pane (kể cả hẹp). |
| JS DOM | `.ix-chat-msg.sent` + time | `.ifx-chat-message.is-sent` | **NONE** | Không bật `IfxChat` ở Phase 4a trừ Owner chấp nhận đổi emit **và** visual 0. |

`CHAT_COMPONENT_MATCH = PARTIAL`

---

## I. Pattern-local register

| Item | Why local |
|---|---|
| `.ix-content` pad | Template frame, không Page Header / không DS page |
| 3-pane + `calc(100vh - 140px)` + min 600 | Composition Pattern Chat |
| Sidebar 280 / profile 240 | Template metric |
| John Doe self row | Demo identity |
| Thread search inline | Không khớp `.ifx-search` |
| Profile rail + Personal Info / Options markup | Chỉ Pattern Chat |
| PatternChat rail/header sync + IDs | Demo 3-pane |
| Copy Felecia / purchase / email / phone | Demo — giữ; không generic “Người A” |
| Double bubble + margin 6 | Template |
| Inline flex/gap 10/6/4 | PURE_LAYOUT |
| Dump rem 15px | Tới khi Owner đổi root |
| `chat.css` leftover unused | Debt; rút dần, không sang DS |

---

## J. DS missing generic register

| ID | Missing | Layer đề xuất | Không làm |
|---|---|---|---|
| MG01 | IfxChat item = Legacy 10×16 / 14 / 12 / 10 / `active` | Extend `components/chat` **nếu** Owner muốn Pattern consume Global item | Invent `.ifx-*` trong Pattern |
| MG02 | IfxChat bubble pad 10×14 + font 14 (width 60% + r12 đã có) | Extend bubble **hoặc** variant | Đổi 60% |
| MG03 | Message emit: avatar + time | Extend `IfxChat` **hoặc** giữ PatternChat | |
| MG04 | Composer contract (input + send, không bắt buộc form) | Extend chat composer | Ép `.ifx-input` nếu delta ≠ 0 |
| MG05 | Avatar size 32 + 56; `.ifx-avatar-accent`; ring 36 | Extend `primitives/avatar` **chỉ nếu** tái sử dụng ngoài Chat | Token mới trừ Owner |
| MG06 | Group-label 11 / .5px / accent (nếu coi là variant hệ thống) | Extend `.ifx-group-label` **chỉ nếu** Owner muốn 1 contract | Map sai visual |

Mặc định audit: **MG01–MG04 là đề xuất**, không tự implement. 3-pane **không** vào MG (SoT).

---

## K. Exclude / runtime register

| Item | Visual Phase 4 | Runtime |
|---|---|---|
| Phone / video header | Giữ icon | **EXCLUDE** |
| Header search | Giữ icon | **EXCLUDE** |
| Mic / clip | Giữ icon | **EXCLUDE** |
| Options / Block | Giữ hàng | **EXCLUDE** |
| Thread Search... input | Giữ field | **EXCLUDE** (không filter) |
| Ticks = delivered | Giữ glyph | **EXCLUDE** (không receipt) |
| Persist / API / GIS | — | **EXCLUDE** |
| Workbench AppShell / theme toolbar | ngoài canvas | **EXCLUDE** |
| `reference-layers` `.ref-module-chat-*` / `.ref-page-chat-*` | debt cũ | **Không thêm**; không consume |

---

## L. Unused / dead dump register

`UNUSED_LEGACY_SELECTOR_COUNT = 811` (unique).

Rút Phase 4b theo cụm (profile/table/wizard/auth/typo utilities…). Giữ `:root` / theme / reset / consumed 47 tới khi Canonical CSS thay dump.

---

## M. Final recommendation (Phase 4 — chưa làm)

1. **Workspace 3-pane + profile 240 + frame** → Pattern-local CSS (`patterns/chat/chat.css` sau khi cắt dump). Không 2-pane. Không Page Header. Không `reference-layers`.
2. **IfxChat** không consume nguyên vẹn. Owner chọn:
   - **R4-A:** Extend Global Chat (item/bubble/composer/emit) rồi map class — chỉ khi `MATERIAL_VISUAL_DELTA = 0`.
   - **R4-B (đề xuất mặc định):** Giữ `.ix-chat-*` + PatternChat; consume **chỉ** CAN_MAP (Tabler, avatar-sm+status). Residual local.
3. Button primary/icon = PARTIAL → map sau khi đo `MATERIAL_VISUAL_DELTA = 0`, không đoán.
4. `.ifx-group-label` **không** dán lên Chats/Contacts (accent/11/.5) trừ Owner chấp nhận đổi nhìn.
5. JS: không bật `IfxChat` cho tới R4-A. PatternChat ở lại.
6. Dead dump: xóa theo register L sau khi CSS Canonical/local đã cover consumed 47.

---

## Gate

```
CHAT_MAPPING_AUDIT = COMPLETE
CAN_MAP_EXISTING_COUNT = 2
  1. Tabler Icons asset
  2. .ifx-avatar-sm + status success/warning/danger/info (28)
DS_MISSING_GENERIC_COUNT = 6
PATTERN_LOCAL_COUNT = 16
EXCLUDE_RUNTIME_COUNT = 9
UNUSED_LEGACY_SELECTOR_COUNT = 811
CHAT_COMPONENT_MATCH = PARTIAL
READY_FOR_PHASE_4_REVIEW = YES
```

`PARTIAL` ≠ `CAN_MAP`.

STOP. Không Phase 4. Không sửa Global Chat. Không sửa Pattern Chat. Không thêm `reference-layers`.
