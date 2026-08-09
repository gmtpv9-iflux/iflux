# FN-001 — Phase 0 Inventory (Evidence)

**Ngày:** 2026-07-24  
**Plan:** `docs/Plan — Follow & Notification (FN-001).md`  
**Owner duyệt Plan:** 2026-07-24 «Duyệt, tiến hành»

## Ownership — Notification UI

| Resource | Owner | Path |
|----------|-------|------|
| Bell DOM slot | App Shell | `User_Web/iflux-web-ui/iflux-web-ui.js` |
| Badge + panel | App Shell UI | `iflux-user-notifications-ui.js` (`IfluxUserNotificationsUI`) |
| Unread store (client) | App Shell store | `inapp-notifications.js` (`IfluxInAppNotifications`) |
| CSS | App Shell | `app-shell.css` |

**Cấm tạo:** Community/Entity/Comment `*NotificationManager`.

**Loading hiện tại:** bell click-lazy (gần Need Soon panel). Badge cần summary Need Now sau Auth — sẽ siết Phase 6.

## Follow Entity

Foundation `IfluxFollowAction` + `watchlist-store` + `user-data/watchlist` — **PASS** (không đụng logic).

## Follow User

| Hiện có | Gap |
|---------|-----|
| `profile-follow-store.js` (LS only) + nút hồ sơ | Chưa API / bảng quan hệ |

## Catalog

| SoT §6 | Catalog |
|--------|---------|
| Entity tagged | NOTIF-USER-011 |
| User đăng bài | **NOTIF-USER-008** (`USER_COMM_POST`) — đủ |
| User share | 012 |
| User BL gốc entity | 013 |
| Comment liked | 014 |
| Comment reply | 015 |

Phase 3: không thiếu mẫu đăng bài; chỉ đồng bộ deep-link / template code khi emit.

## Backend trước thi công

- Inbox: `user_data.notifications_json` blob — sẽ thêm bảng inbox + API count/cursor  
- Không event bus — sẽ thêm `core/events/bus.js`  
- Không fan-out notify  

## Exit Phase 0

- [x] Inventory  
- [x] Ownership Shell khóa  
- [x] Gap mẫu: 008 đủ cho §5.2 A  
