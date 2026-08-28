# P6a — Chat Phase 2 — Template Isolation

**Date:** 2026-08-28  
**Mode:** ISOLATE ONLY. Không map. Không canonicalize. Không Phase 3.  
**Baseline:** `CHAT_LEGACY_CLONE = PASS` (`36`)  
**Path:** `patterns/chat/` (SoT architecture — không `references/patterns/`)

```
CHAT_TEMPLATE_ISOLATED = PASS
CHAT_MAPPING_AUDIT = NO
```

---

## A. AppShell đã gỡ

| Removed | |
|---|---|
| `.ix-root` / `.ix-layout` / `aside.ix-sidebar` | Admin nav + brand |
| `header.ix-navbar` / `.ix-search` / `.ix-nav-actions` | Search + bell + JD navbar |
| Theme toggle / notif bell JS | Không còn mount point |
| `main.ix-main` | Cột offset sidebar |

Runtime isolate: `root/sidebar/navbar/bell/theme = false`.

---

## B. Template giữ

```
.ix-content
  .ix-chat-layout[data-ix-chat]
    .ix-chat-sidebar
    .ix-chat-main
    .ix-chat-profile
```

Giữ: 3 pane, 6 item, Felecia / John / Contacts / Personal Info / Options, mọi `style=`, phone/video/search/dots + mic/clip visual, Send + Enter, `PatternChat.init()`.

Không: `.ifx-chat`, Page Header, copy generic, 2-pane.

`.ix-avatar` / `.ix-avatar-sm` **giữ** (template Chat dùng). Khác UP (UP xóa vì navbar-only).

---

## C. CSS / JS

**CSS xóa (AppShell-only):** `.ix-root` · `.ix-layout*` · `.ix-sidebar*` · `.ix-brand*` · `.ix-main` · `.ix-overlay` · `.ix-navbar` · `[data-ix-admin-page-host]` · `.ix-menu*` · `.ix-search*` · `.ix-nav-actions/btn/dot` · `html,body` viewport lock (`height:100%` + `overflow:hidden`).

**CSS giữ:** dump token/typography/component trừ khối trên · `.ix-content` pad only · `.ix-chat-*` · `.ix-avatar*` · `.ix-btn*`.

`html,body` giữ rem 15px + `overflow-x: hidden` (khớp Legacy; không khóa chiều cao AppShell).

**JS:** chỉ `pattern-chat.js`. Xóa `iflux-admin-ui` AppShell, notifications, `iflux-theme.js`.

Không thêm rule `reference-layers.css`. Không đụng `design_system/components/chat/*`.

---

## D. Compare subtree (Legacy `.ix-content` vs isolate `.ix-content`)

Không so Admin chrome. Chrome headless, dark.

| Check | 1440 | 768 | 390 |
|---|---|---|---|
| TEXT_MISMATCH | 0 (59/59) | 0 | 0 |
| ICON_MISMATCH | 0 (17/17) | 0 | 0 |
| Thread/contact | 6 = 6 | 6 | 6 |
| SIDEBAR_280_DELTA | 0 | 0 | 0 |
| PROFILE_240_DELTA | 0 | 0 | 0 |
| Layout height | 760 = 760 | 0 | 0 |
| Bubble 60% / 10×14 / r12 | 0 | 0 | 0 |
| Item pad 10×16 | 0 | 0 | 0 |
| Content pad | 30 = 30 | 18.75 | 15 |
| html rem | 15px | 15px | 15px |
| overflow-x | hidden | hidden | hidden |

**Cố ý (gỡ shell, không so):** tại 1440 `.ix-chat-layout` width 1120 → 1380 (`dw = +260` = Admin sidebar). 768 / 390 sidebar Admin vốn off-canvas → width Δ 0.

```
MISSING_TEMPLATE_CONTENT = 0
UNAPPROVED_EXTRA_CONTENT = 0
CHAT_LAYOUT_DELTA = 0          # height + 3-pane; width +260 chỉ ở 1440 do gỡ shell
SIDEBAR_280_DELTA = 0
PROFILE_240_DELTA = 0
BUBBLE_CONTRACT_DELTA = 0
BEHAVIOR_MISMATCH = 0
CHAT_TEMPLATE_ISOLATED = PASS
```

6 click + Send + Enter = PASS. Workbench iframe `/patterns/chat/`.

PNG: [chat-phase2-evidence/](chat-phase2-evidence/)

---

## E. File

| File | |
|---|---|
| `patterns/chat/index.html` | Chỉ `.ix-content` + template |
| `patterns/chat/chat.css` | Cắt AppShell |
| `patterns/chat/chat.js` | Chỉ PatternChat |

Không đụng: Global Chat Component · `reference-layers.css` · Auth · User Profile · token · `Admin_Design_system/patterns/chat.html`.

---

STOP. Chưa Phase 3 mapping audit.
