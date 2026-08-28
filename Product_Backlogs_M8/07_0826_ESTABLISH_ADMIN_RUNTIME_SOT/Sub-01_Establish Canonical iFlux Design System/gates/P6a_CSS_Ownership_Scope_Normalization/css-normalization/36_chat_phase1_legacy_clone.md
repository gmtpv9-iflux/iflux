# P6a — Chat Phase 1 — Legacy Exact Clone

**Date:** 2026-08-28  
**Mode:** FORENSIC CLONE only. Không isolate. Không map. Không canonicalize.  
**Process:** cùng User Profile `22`.  
**SoT path (architecture lock):** `patterns/chat/` — không còn `design_system/references/patterns/chat/`.

```
CHAT_REBUILD_PLAN = APPROVED
CHAT_IMPLEMENT = PHASE_1_DONE
CHAT_LEGACY_CLONE = PASS
CHAT_TEMPLATE_ISOLATED = NO
```

Plan cũ (`30`) ghi destination `references/patterns/chat/` + residual vào `reference-layers.css`.  
SoT thắng: [`docs/SoT — Canonical UI Architecture (Design System ↔ Pattern).md`](../../../../../../../docs/SoT%20—%20Canonical%20UI%20Architecture%20(Design%20System%20↔%20Pattern).md) §2 · §8 · §9 · §12 · §14.

---

## Path lock đã áp

| | Plan `30` (cũ) | Contract mới |
|---|---|---|
| Clone files | `design_system/references/patterns/chat/` | **`patterns/chat/`** |
| Workbench iframe | `../references/patterns/chat/` | **`/patterns/chat/`** (đã có) |
| Residual sau này | `reference-layers.css` `.ref-*` | **Cấm thêm rule.** 4 bậc: DS existing → DS missing generic → Pattern local → Exclude/runtime |
| Global Chat Component | Không đụng Phase 1–2 | Giữ. `design_system/components/chat/*` không sửa |

---

## A. Xóa W07

| File | Việc |
|---|---|
| `patterns/chat/index.html` | Thay bằng clone Legacy |
| `patterns/chat/page.js` | Xóa (`IfxChat` W07) |
| `design_system/references/patterns/chat/` | Không còn live file |

Không xóa / không sửa: `design_system/components/chat/chat.css` · `chat.js` · `reference-layers.css` · Auth · User Profile · token.

---

## B. Ba file mới

```
patterns/chat/
├── index.html
├── chat.css      (~148 KB, dump Admin UI)
└── chat.js       (iflux-admin-ui + notifications inline + pattern-chat + iflux-theme)
```

Đây **không** phải Global Chat Component.

---

## C. HTML

- Body = literal `Admin_Design_system/patterns/chat.html` (AppShell + 3 pane).
- `style=` giữ: **73 = 73**.
- Copy Felecia / John / purchase / email / phone / VoIP icons giữ.
- Head: fonts + Tabler + `chat.css`. Không link Foundation / tokens generated / `reference-layers.css`.
- Script: `chat.js` + `PatternChat.init()`. Không `IfxChat`.

---

## D. CSS / JS dump

CSS: cùng bộ UP Phase 1 (`iflux-admin-ui.css` imports, trừ fonts/Tabler — link asset). `--ix-*` không remap.

JS:

| Source | Vai trò |
|---|---|
| `iflux-admin-ui.js` | AppShell |
| `iflux-admin-notifications.js` | Inline (loader tìm `iflux-admin-ui.js` sẽ miss trên `chat.js`) |
| `pattern-chat.js` | Chọn thread + Send |
| `iflux-theme.js` | Toggle trên `.ix-nav-actions` |

---

## E. Gate vs local Legacy (`/Admin_Design_system/patterns/chat.html`, dark)

SoT visual = file local (cùng nguồn staging). Chrome headless.

| Gate | 1440 | 768 | 390 |
|---|---|---|---|
| TEXT_MISMATCH | 0 (80/80) | 0 | 0 |
| ICON_MISMATCH | 0 (35/35) | 0 | 0 |
| LINK_MISMATCH | 0 (14/14) | 0 | 0 |
| IDs | identical | identical | identical |
| `style=` | 73 = 73 | 73 | 73 |
| html rem | 15px | 15px | 15px |
| overflow-x | hidden | hidden | hidden |
| `.ix-chat-layout` Δ | 0 | 0 | 0 |
| sidebar 280 Δ | 0 | 0 | 0 |
| profile 240 Δ | 0 | 0 | 0 |
| bubble pad 10×14 / max-width 60% | 0 | 0 | 0 |
| item pad 10×16 Δ | 0 | 0 | 0 |
| Admin sidebar 260 Δ | 0 | 0 | 0 |
| PNG byte-equal | **YES** | **YES** | file Δ 5 bytes; box Δ = 0 |

```
MISSING_LEGACY_CONTENT = 0
UNAPPROVED_EXTRA_CONTENT = 0
MATERIAL_VISUAL_MISMATCH = 0
BEHAVIOR_MISMATCH = 0
CHAT_LEGACY_CLONE = PASS
```

PNG: [chat-phase1-evidence/](chat-phase1-evidence/)

---

## F. Hành vi

6 item (3 Chats + 3 Contacts). Plan ghi “7” — Legacy chỉ có 6.

| Click | Header + rail + `.active` |
|---|---|
| Felecia Rower | PASS |
| Waldemar Mannering | PASS |
| Calvin Moore | PASS |
| Natalie Maxwell | PASS |
| Jess Cook | PASS |
| Stacy Garrison | PASS |

Send button + Enter → append `.ix-chat-msg.sent`. Không toast. Phone/video/mic/clip = visual only.

Workbench `?area=patterns&pattern=chat` iframe = `/patterns/chat/`. Phase 1 còn AppShell Admin **trong** iframe (đúng clone; isolate = Phase 2).

---

## G. Không làm ở Phase 1

- Không gỡ AppShell
- Không map `ix-*` → `ifx-*`
- Không sửa `design_system/components/chat/*`
- Không thêm rule `reference-layers.css`
- Không đổi copy
- Không 2-pane / Page Header
- Không commit (chờ Owner)

---

## H. Owner — Phase 2

Khi `CHAT_LEGACY_CLONE` được nhận: gỡ AppShell Admin, giữ `.ix-chat-layout` 3 pane trong `patterns/chat/`. Residual sau isolate **không** đẩy vào `reference-layers.css`.
