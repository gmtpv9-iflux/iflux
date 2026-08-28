# Chat Normalization — LOCKED

**Date:** 2026-08-28  
**Ship commit:** `167e73b`  
**Remote:** `github/staging`  
**Baseline:** Phase 4 R4-B [`39_chat_phase4_r4b.md`](39_chat_phase4_r4b.md)

```
CHAT_NORMALIZATION = LOCKED
GLOBAL_CHAT_CHANGED = NO
REFERENCE_LAYERS_NEW_RULE = 0
MG01–MG06 = NOT OPEN
```

STOP. Không mở MG01–MG06. Không extend `design_system/components/chat/*`. Không thêm rule `reference-layers.css`.

---

## A. Ship scope

| Path | Role |
|---|---|
| `patterns/chat/index.html` | Legacy isolate, 3-pane, 4 mapped avatars |
| `patterns/chat/chat.css` | Pattern-local (~47 KB, 45 selectors) |
| `patterns/chat/chat.js` | PatternChat only |
| `patterns/chat/page.js` | deleted (W07) |
| Workbench group-label / nav-item | `.ifx-group-label` + locked nav-item (ship cùng Chat) |
| [`35`](35_group_label_nav_item_lock.md) … [`39`](39_chat_phase4_r4b.md) | reports + Phase 1/2 PNG |

---

## B. Post-deploy verify (Staging)

Live: [https://staging.iflux.vn/patterns/chat/](https://staging.iflux.vn/patterns/chat/)  
Workbench: [https://staging.iflux.vn/design_system/workbench/?area=patterns&pattern=chat](https://staging.iflux.vn/design_system/workbench/?area=patterns&pattern=chat)  
Legacy SoT: [https://staging.iflux.vn/Admin_Design_system/patterns/chat.html](https://staging.iflux.vn/Admin_Design_system/patterns/chat.html)

| Check | Result |
|---|---|
| `/patterns/chat/` | 200 · 3-pane · 6 thread · PatternChat |
| `chat.css` / `chat.js` | 200 · `page.js` 404 |
| Workbench `pattern=chat` | iframe `src=/patterns/chat/` → same URL |
| 1440 / 768 / 390 vs Legacy `.ix-content` | metrics **0** (rem, overflow-x, 280/240, 760, item 10×16, bubble 60%/10×14/r12, name/icon) |
| 1440 layout width | **+260** (gỡ Admin AppShell — cố ý) |
| 6 click (FR/WM/CM/NM/JC/SG) | header + rail sync PASS |
| Send + Enter | bubble emit + clear input PASS |

`chat.css` origin last-modified 2026-08-28 11:07 UTC, 47463 bytes = local R4-B.

---

## C. Không làm (vẫn đứng)

- `design_system/components/chat/*` — không đụng  
- `reference-layers.css` — 0 rule mới  
- MG01–MG06 — candidate only, cần cross-consumer  

---

## D. Cache note (không phải Chat fail)

HTML Chat + `chat.css` HIT đã là bản `167e73b`.  
`workbench.css` / `typography.css` URL mặc định còn CF HIT cũ; `?v=167e73b` origin đã có `.ifx-group-label`. Không reopen Chat vì cache group-label.

---

CHAT_NORMALIZATION = LOCKED  
STOP.
