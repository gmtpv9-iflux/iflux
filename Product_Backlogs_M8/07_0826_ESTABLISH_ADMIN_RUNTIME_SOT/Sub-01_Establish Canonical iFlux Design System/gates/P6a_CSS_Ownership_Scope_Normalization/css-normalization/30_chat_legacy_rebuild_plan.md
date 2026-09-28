# P6a — Chat — Plan & Solution (Legacy Exact Rebuild)

**Mode:** PLAN + SOLUTION — **chưa thi công**  
**Date:** 2026-08-28  
**Owner:** chờ duyệt rồi mới xóa / clone  
**Process SoT:** cùng chuỗi User Profile (`22` → `23` → `25` → `26` / residual)  
**Không dùng:** quy trình Auth size-parity (4 state / `?state=` / apply-then-propose từng metric)

**Legacy SoT:** [`Admin_Design_system/patterns/chat.html`](https://staging.iflux.vn/Admin_Design_system/patterns/chat.html)  
**Canonical hiện tại (sai):** `patterns/chat/` + Workbench `?area=patterns&pattern=chat`  
> **moved 2026-08-28** từ `design_system/references/patterns/chat/`. Không rebuild trong architecture task. Cấm thêm rule vào `reference-layers.css`. Residual theo 4 bậc: DS existing → DS missing generic → Pattern local → Exclude/runtime.  
**Ownership law:** [`new_solution.md`](../new_solution.md) · [`docs/SoT — iFlux Product Architecture (V2).md`](../../../../../../docs/SoT%20—%20iFlux%20Product%20Architecture%20(V2).md)

```
CHAT_REBUILD_PLAN = WAITING_OWNER
CHAT_IMPLEMENT = NO
```

---

## 0. Vì sao phải xóa và làm lại

W07 đã **đổi architecture** rồi gọi là xong:

| | Legacy ([staging chat.html](https://staging.iflux.vn/Admin_Design_system/patterns/chat.html)) | Canon W07 hiện tại |
|---|---|---|
| Khung | 3 pane: thread **280** \| main \| profile **240**; height `calc(100vh - 140px)` min 600 | Chat 2 pane + Grid 8/4; height token 37.5rem; Page Header catalog |
| Copy | Felecia / John / purchase / email / phone — **đúng chữ Legacy** | “Người A / Hội thoại / generic” |
| Bubble | max-width **60%**, pad 10×14, radius **12**, time + ticks | max-width **80%**, pad 8×12, radius card **8** |
| Item | pad **10×16**, name **14**, preview **12**, time **10** | pad 12×16, name sm **13**, preview xs |
| Input | `.ix-chat-input` surface + Send filled | Form input + composer khác |
| Profile rail | pane thứ 3 trong cùng lockup | Card cột 4 — **không** cùng workspace |
| VoIP icons | phone / video / search / dots — **visual** | W07 DROP |
| CSS | `.ix-chat-*` + rất nhiều `style=` | `.ifx-chat-*` + `.ref-module-chat-*` đè lên Component 2-pane |

Audit cũ đã ghi nhận: remap 2-pane + generic copy **không** phải 100% Legacy. Sửa từng hook trên W07 sẽ giữ sai khung.

**Quyết định plan:** xóa compose Chat hiện tại. Rebuild forensic giống User Profile. **Không** sửa `design_system/components/chat/*` ở Phase 1–2.

---

## 1. Process khóa = User Profile (không khác)

| Phase | UP doc | Chat làm gì | Gate | Implement khi |
|---|---|---|---|---|
| **1** | [`22_user_profile_legacy_exact_clone.md`](22_user_profile_legacy_exact_clone.md) | Xóa reference cũ. Clone nguyên trang Legacy (kể cả Admin AppShell) | `CHAT_LEGACY_CLONE = PASS` | Owner duyệt plan này |
| **2** | [`23_user_profile_template_isolation.md`](23_user_profile_template_isolation.md) | Gỡ AppShell Admin; giữ đúng `.ix-chat-layout` 3 pane + copy | `CHAT_TEMPLATE_ISOLATED = PASS` | Owner duyệt Phase 1 evidence |
| **3** | [`25_user_profile_legacy_canonical_mapping_audit.md`](25_user_profile_legacy_canonical_mapping_audit.md) | Audit only: map `ix-*` → Global / lower layer. **0 edit** | `CHAT_MAPPING_AUDIT = COMPLETE` | Owner duyệt isolate |
| **4a** | [`26_user_profile_existing_canonical_applied.md`](26_user_profile_existing_canonical_applied.md) | Chỉ `CAN_MAP_EXISTING` đã duyệt; `MATERIAL_VISUAL_DELTA = 0` | `CHAT_EXISTING_CANONICAL_APPLIED` | Owner duyệt bảng map |
| **4b** | residual / `27` | Rule không map được → đúng lớp trong `reference-layers.css` (`.ref-*`). Không invent Global để “cho giống” | `CHAT_OWNERSHIP_NORMALIZED` | Owner duyệt residual |

Một phase một gate. **Không** gộp clone + canonicalize trong một lần.

---

## 2. Solution — Phase 1 (Forensic clone)

### 2.1 Xóa (chỉ Reference Chat)

```
design_system/references/patterns/chat/index.html   ← xóa nội dung W07
design_system/references/patterns/chat/page.js      ← xóa
```

**Không xóa:** `design_system/components/chat/chat.css` · `chat.js` (Global, phase sau mới đụng).  
**Không đụng:** token, Foundation, Primitive, `reference-layers.css` (Phase 1), Auth, User Profile.

### 2.2 Ba file mới (cùng mô hình UP)

```
design_system/references/patterns/chat/
  index.html     body = literal Legacy chat.html
  chat.css       dump CSS Legacy Admin UI (concat, --ix-*, không remap --ifx-*)
  chat.js        dump JS: iflux-admin-ui + pattern-chat + iflux-theme (như UP)
```

Đây **không** phải Global Chat Component. Chỉ là receiver forensic.

### 2.3 HTML

- DOM body **copy literal** `Admin_Design_system/patterns/chat.html` (AppShell + 3 pane).
- Giữ **mọi** `style=`. Không extract.
- Copy / ID / `data-chat-*` / `data-ix-chat` / icon **không đổi**.
- Head: `fonts.css` + Tabler + `chat.css` (không `iflux-admin-ui.css` @import — inline dump như UP).

### 2.4 CSS dump

Cùng bộ UP đã copy (`iflux-admin-ui.css` imports → inlined). Giá trị `--ix-*` / rem Legacy. `html` font-size theo dump (15px nếu dump có rule đó).

**Không** link `design_system/foundation/*`, tokens generated, `reference-layers.css` ở Phase 1.

### 2.5 JS dump

| Source | Vai trò |
|---|---|
| `iflux-admin-ui.js` (+ notif inline nếu loader 404) | AppShell / toast / ripple |
| `pattern-chat.js` | Chọn thread + gửi tin (DOM `.ix-chat-msg.sent`) |
| `iflux-theme.js` | Toggle theme trên `.ix-nav-actions` |

`PatternChat.init()` giữ nguyên. **Không** `IfxChat` ở Phase 1.

### 2.6 Asset

`/Admin_Design_system/iflux-admin-ui/fonts.css` + BeVietnamPro + Tabler — dependency asset, không đổi render.

### 2.7 Gate Phase 1 (so với [staging](https://staging.iflux.vn/Admin_Design_system/patterns/chat.html), dark, 1440 / 768 / 390)

```
TEXT_MISMATCH = 0
ICON_MISMATCH = 0
LINK_MISMATCH = 0
MISSING_LEGACY_CONTENT = 0
UNAPPROVED_EXTRA_CONTENT = 0
BEHAVIOR_MISMATCH = 0          # chọn thread + Send
MATERIAL_VISUAL_MISMATCH = 0   # pixelmatch threshold 0.1 = 0 px
CHAT_LEGACY_CLONE = PASS
```

Hành vi bắt buộc: click item đổi header + rail phải; Send / Enter append bubble `sent`.

---

## 3. Solution — Phase 2 (Isolate template)

**Sau** `CHAT_LEGACY_CLONE = PASS` và Owner OK.

### Gỡ (AppShell Admin — PLATFORM, không phải Chat template)

`.ix-root` · `.ix-layout` · `aside.ix-sidebar` · `header.ix-navbar` · `main.ix-main` · overlay / menu / search navbar / notif / theme inject.

CSS/JS AppShell-only xóa khỏi dump (cùng luật `23`).

### Giữ (template Chat)

```
.ix-content                    # pad Legacy; không invent layout mới
  .ix-chat-layout[data-ix-chat]
    .ix-chat-sidebar           # 280, list Chats + Contacts
    .ix-chat-main              # header + body + footer
    .ix-chat-profile           # 240, Personal Info + Options
```

Toàn bộ `style=`, copy Felecia/John, phone/video **nút**, search thread, Send.

Workbench AppShell **bọc iframe** — không nằm trong canvas (giống pattern khác sau isolate).

### Gate Phase 2

So subtree `.ix-content` Legacy vs isolate (không so sidebar Admin):

```
TEXT / ICON / template LINK mismatch = 0
.ix-chat-layout / sidebar 280 / profile 240 / bubble 60%  Δ = 0
html rem / overflow-x khớp
CHAT_TEMPLATE_ISOLATED = PASS
```

---

## 4. Solution — Phase 3–4 (phạm vi lớp — khóa trước, làm sau)

Luật map (UP `25`): `CAN_MAP_EXISTING` chỉ khi **cùng responsibility và cùng contract visual/behavior**. Cùng `flex` không đủ. `PARTIAL` không tự map.

Lower layer chỉ vào `design_system/sandbox/assets/reference-layers.css`, prefix:

`.ref-platform-*` · `.ref-module-*` · `.ref-page-*` · `.ref-widget-*`

Không redefine `.ifx-*` trong sandbox. Không `.ifx-auth-*` kiểu invent. Không token mới trừ Owner mở khóa.

### 4.1 Phân loại CSS (dự kiến — chốt ở Phase 3 audit)

| Khối Legacy | Vai trò | Lớp | Artifact đích | Ghi chú 100% |
|---|---|---|---|---|
| Admin sidebar / navbar / overlay | Shell trang Admin | **PLATFORM** | Không vào Global. Phase 2 xóa. Workbench = shell DS | Không clone AppShell vào `ifx-chat` |
| `.ix-content` pad | Frame page sau isolate | **PAGE** | `.ref-page-chat-frame` hoặc giữ dump tới khi map | Không Page Header catalog |
| `.ix-chat-layout` 3 cột, `100vh-140`, min 600 | Workspace 3 pane | **PAGE** (mặc định) | `.ref-page-chat-layout` | Component hiện **2 pane** — **cấm** ép 2 pane để “đúng family”. Mở Component 3-pane chỉ nếu Owner duyệt ở Phase 3 |
| `.ix-chat-sidebar` 280 + header + list | Thread pane | **COMPONENT** nếu contract khớp `.ifx-chat-thread`; không thì PAGE/MODULE hook | Đo Phase 3: width 280 vs 256 = **chưa** CAN_MAP | |
| `.ix-chat-item*` name 14 / preview 12 / time 10 / pad 10×16 | Thread row | **COMPONENT** candidate | Chỉ map khi `.ifx-chat-item*` đổi contract **hoặc** residual PAGE | Không page-patch metric nếu Owner chọn sửa Component |
| Section “Chats” / “Contacts” | Label nhóm list | **MODULE** | `.ref-module-chat-section-label` (đã có, lệch accent/11) | |
| Self row “John Doe” | Identity trên list | **MODULE** | `.ref-module-chat-person` | |
| Search trong sidebar | Filter chrome | **COMPONENT Search** nếu box 32/pad khớp; không → **PAGE** | W07 Search 36 ≠ Legacy 32 | |
| `.ix-chat-main` / header / body / footer | Conversation column | **COMPONENT** `.ifx-chat-main*` | Pad header 12×20, body 20 — đo lại | |
| `.ix-chat-msg` / `.sent` / bubble 60% / r12 / 10×14 | Message | **COMPONENT** | Canon 80% / r8 / 8×12 = **không** CAN_MAP tới khi Component đổi **hoặc** residual | |
| `.ix-chat-time` + ticks | Meta | **COMPONENT** | | |
| `.ix-chat-input` + Send + mic/clip | Composer | Input: Form **hoặc** Chat composer. Send: **Button**. Mic/clip/phone/video: visual **PAGE**, runtime **EXCLUDE** | |
| `.ix-chat-profile` 240 + Personal Info + Options | Contact rail | **PAGE** (một page Chat) hoặc MODULE conversation | **Không** Widget. Không nhét vào `.ifx-chat` 2-pane | |
| Avatar 32/28/56 + presence 8px | Avatar + online | **PRIMITIVE** nếu 90/sm/lg khớp; size 28/56 lệch = PAGE/MODULE overlay | |
| Button icon header | Button primitive | **PRIMITIVE** | | |
| `style=` còn lại | Layout one-off | PAGE / PURE_LAYOUT trên hook `.ref-page-chat-*` | Không đẩy vào Global | |
| Theme `--ix-*` dump | Token | Phase 4 map màu qua theme đã có; **không** invent token | Token layer LOCKED |

### 4.2 Phân loại JS

| Script | Lớp | Đích | Cấm |
|---|---|---|---|
| `pattern-chat.js` chọn thread + Send | **PAGE** (pattern Chat) | `references/patterns/chat/page.js` hoặc `chat.js` sau isolate — **không** Global trừ `IfxChat` chứng minh cùng DOM emit | Không GIS/VoIP |
| `IfxChat` hiện tại | **GLOBAL Component** | Chỉ bật lại khi Phase 4a: emit **đúng** `.ix-chat-msg` / bubble / time **hoặc** Owner chấp nhận đổi Component rồi clone đổi class **và** visual 0 | Không dùng Phase 1–2 |
| `iflux-admin-ui.js` AppShell | **PLATFORM** | Phase 2 xóa | |
| `iflux-theme.js` navbar | **PLATFORM** | Phase 2 xóa. Theme Workbench `postMessage` giữ | |
| `ixToast` / `IfxToast` | **COMPONENT** | Phase 4a nếu Send cần toast — Legacy Send **không** toast | |

### 4.3 `CAN_MAP_EXISTING` sơ bộ (Phase 3 phải đo lại)

| Candidate | Dự kiến |
|---|---|
| Tabler icons | CAN_MAP (asset) |
| `.ifx-btn` / `.ifx-btn-icon` / `.ifx-btn-primary` | PARTIAL — đo pad/icon 16 |
| `.ifx-avatar*` | PARTIAL — size 28/32/56 |
| `.ifx-search` | PARTIAL — 36 vs 32 |
| `.ifx-chat` 2-pane family | **NO** — thiếu pane 3, height, bubble contract |
| Page Header / Grid 8+4 | **NO** — không có trên Legacy template |
| Generic “Người A” copy | **NO** — Phase 1–2 giữ chữ Legacy |

### 4.4 Việc không làm ở mọi phase

- Không 2-pane “cho đúng W07”.  
- Không Page Header / breadcrumb catalog trên splash Chat.  
- Không đổi copy thành generic.  
- Không VoIP/runtime.  
- Không token mới.  
- Không `.ifx-chat-profile` Global trừ Owner mở Component 3-pane.  
- Không sửa `Admin_Design_system/patterns/chat.html`.  
- Không Auth-style 4 tab.  
- Không comment UI.

---

## 5. File chạm theo phase

| Phase | File |
|---|---|
| 1 | `references/patterns/chat/{index.html,chat.css,chat.js}` tạo; `page.js` xóa; evidence PNG |
| 2 | Cắt AppShell trong 3 file trên |
| 3 | Chỉ markdown audit (như `25`) |
| 4a | HTML class rename **có kiểm** + link Canonical CSS **sau** dump; `MATERIAL_VISUAL_DELTA = 0` |
| 4b | `reference-layers.css` subsection `chat`; HTML thêm `.ref-*`; rút dump |

Workbench: Phase 1–2 iframe vẫn `../references/patterns/chat/`. Không `?state=`.

---

## 6. Verify (bắt buộc mỗi phase)

Viewports: **1440 · 768 · 390** (+ **1024** nếu Owner muốn). Theme dark (và light nếu dump hỗ trợ).

Đo Phase 1 (full page vs staging): layout, sidebar Admin, `.ix-chat-layout`, 280, 240, bubble, item, input, profile.

Đo Phase 2: chỉ template (bỏ Admin chrome).

Hành vi: 7 thread/contact click; Send; Enter.

---

## 7. Owner duyệt

| ID | Câu hỏi | Đề xuất |
|---|---|---|
| **C1** | Khóa process = User Profile 1→2→3→4, **không** Auth-parity? | **YES** |
| **C2** | Phase 1 clone **cả AppShell Admin** để pixelmatch staging = 0? | **YES** (như UP) |
| **C3** | Phase 1 **không** đụng Global `components/chat`? | **YES** |
| **C4** | Copy Legacy (Felecia / purchase / email) giữ 100%? | **YES** |
| **C5** | 3-pane: mặc định **PAGE**, không expand Component ở Phase 1–2? | **YES** |
| **C6** | Phone/video/mic/clip: giữ visual, không runtime? | **YES** |
| **C7** | Được phép **xóa** W07 `index.html` + `page.js` khi bắt đầu Phase 1? | **YES** — cần Owner |

**STOP.** Không xóa, không clone, không commit tới khi C1–C7 = YES.

---

## 8. Quan hệ tài liệu

| Doc | Vai trò |
|---|---|
| File này | Plan + Solution Chat rebuild — chờ duyệt |
| [`22`–`27` User Profile](22_user_profile_legacy_exact_clone.md) | Process đã chạy — Chat copy đúng chuỗi |
| [`P6-W07.md`](../../P6-W07.md) | Wave cũ — 2-pane + generic = **superseded** |
| [`09_chat_parity_audit_only.md`](09_chat_parity_audit_only.md) · [`10_chat_canonical_gap_audit.md`](10_chat_canonical_gap_audit.md) | Evidence W07 sai / gap — không phải destination |
| [`new_solution.md`](../new_solution.md) | 5 lớp + `reference-layers.css` |
| [`29_auth_size_parity_proposal.md`](29_auth_size_parity_proposal.md) | **Không** áp cho Chat |
