# Audit — Notification Platform · Current State

| | |
|--|--|
| **Document ID** | AUD-NOTIF-RT-001 |
| **Version** | 1.0 |
| **Date** | 2026-07-30 |
| **Status** | ✅ Complete — audit only |
| **Scope** | User Web + Admin + Backend Notification Runtime |
| **Constraint** | Không sửa code · Không refactor · Không đề xuất kiến trúc mới ngoài Root Cause |

---

# 0. Executive Verdict

| Yêu cầu | Verdict | Root Cause (tóm tắt) |
|---------|---------|----------------------|
| User badge unread realtime | **FAIL** | Module chuông **lazy-load chỉ khi click**; không polling/WS; badge không mount lúc boot |
| User realtime popup / push khi event | **FAIL** | Dispatcher **chỉ INSERT DB** — **không có** Realtime Gateway / emit client |
| Offline → Online sync | **FAIL** | Có `GET /summary` nhưng **không gọi lúc reconnect/login shell**; chỉ khi init chuông (sau click) |
| Admin popup đơn hàng lặp lại | **FAIL** | Runtime Admin **riêng** (localStorage); toast “đã xem” lưu **sessionStorage** → mỗi session replay unread |
| User ↔ Admin cùng một Notification Platform | **FAIL (SoT)** | **Hai runtime tách biệt** (Trường hợp A) |

**Affiliate case (đã chứng minh thực tế):**  
Event → Create → Persist = **PASS**.  
Đứt tại **Dispatch → Push → Client Receive → Badge Update**.

---

# 1. Notification Runtime Architecture (hiện tại)

## 1.1 Hai runtime song song (xác nhận)

```text
═══════════════════════════════════════════════════════════════
 RUNTIME A — User Notification Platform (server-backed)
═══════════════════════════════════════════════════════════════
 Business Event / Auth referral
        ↓
 Event Bus (in-process)  OR  direct consumer (auth → referral)
        ↓
 dispatcher.dispatch()
        ↓
 deliveryChannel.sendInApp()
        ↓
 inbox.pushToUser() → PostgreSQL user_inbox_notifications
        ↓
 ─── HẾT. Không WebSocket / SSE / queue push / poll trigger ───
        ↓ (chỉ khi client chủ động)
 GET /api/notifications/summary | GET /api/notifications
        ↓
 IfluxInAppNotifications + IfluxUserNotificationsUI
        ↓
 Bell panel / badge (sau khi lazy-load)

═══════════════════════════════════════════════════════════════
 RUNTIME B — Admin Order Notifications (client-only sandbox)
═══════════════════════════════════════════════════════════════
 IfluxSubscriptionOrdersStore (localStorage orders)
        ↓
 IfluxAdminNotifications.pushNewOrder / syncOrdersFromStore
        ↓
 localStorage iflux_admin_notifications_v1
        ↓
 Admin bell + ixToast
        ↓
 Toast “seen” = sessionStorage iflux_admin_notif_toast_seen_v1
        (không dùng user_inbox_notifications / dispatcher)
```

**Kết luận SoT:** Không phải một Platform với nhiều consumer UI.  
Đang là **hai hệ thống tạo / lưu / phân phối / trạng thái hiển thị** khác nhau.

## 1.2 Ownership / Files

| Runtime | Ownership hiện tại | File chính |
|---------|-------------------|------------|
| A — Persist + Dispatch | Backend `modules/notifications` | `dispatcher.js`, `inbox.service.js`, `delivery-channel.js`, `fn-subscriber.js`, `referral-signup.consumer.js` |
| A — User API | Backend routes | `notifications.routes.js` → `/api/notifications/*` |
| A — User UI | User Web | `inapp-notifications.js`, `iflux-user-notifications-ui.js`, lazy trong `iflux-web-ui.js` |
| B — Admin | Admin UI local | `iflux-admin-notifications.js` + `subscription-orders-store.js` |
| Catalog (metadata) | Shared seed / Admin templates UI | `notification-platform-seed-data.js`, Admin wave-c templates pages |
| Event Bus | Backend core | `backend/src/core/events/bus.js` (**in-process only**) |

**Không tồn tại trong repo (audit grep):** Notification WebSocket Gateway, SSE endpoint, Socket.IO, Redis pub/sub cho inbox, polling scheduler server→client.

---

# 2. Sequence Diagram — thực tế

## 2.1 Affiliate Registered (User A ← User B signup) — case đã test

```text
User B đăng ký (ref User A)
        │
        ▼
auth.service → notifyReferralSignupF0Safe()
        │
        ▼
referral-signup.consumer.notifyReferralSignupF0()
        │
        ▼
dispatcher.dispatch({ typeCode: AFFILIATE_REFERRAL_SUCCESS, recipientUserId: A })
        │
        ▼
preferenceService.canDeliver → renderer → deliveryChannel.sendInApp
        │
        ▼
inbox.pushToUser → INSERT user_inbox_notifications   ✅ PERSIST
        │
        ✖  (không có bước publish realtime)
        │
User A đang online
        │
        ✖  Client không nhận event
        ✖  Badge không tăng (module chuông chưa load / không poll)
        │
User A bấm chuông
        │
        ▼
iflux-web-ui ensureUserNotifications() lazy-load scripts
        │
        ▼
fetchInboxPage → GET /api/notifications   ✅ LIST thấy item đã có sẵn
```

**Điểm đứt chính xác:** sau `inbox.pushToUser` — **không có Push channel**.  
Secondary: client **không subscribe** và **không poll** summary khi online.

## 2.2 Admin Order Popup (mỗi lần vào Admin)

```text
Admin mở bất kỳ trang shell
        │
        ▼
iflux-admin-notifications.initNavbarBell()
        │
        ▼
syncOrdersFromStore()  ← đọc IfluxSubscriptionOrdersStore (local)
        │
        ▼
pushNewOrder cho order chưa có trong iflux_admin_notifications_v1
        │
        ▼
showUnreadToasts()
        │
        ▼
filter n.read === false (localStorage)
        │
        ▼
sessionStorage toast_seen?
   ├── có trong session hiện tại → skip toast
   └── không (session mới / tab mới / clear) → ixToast lại   ❌ REPLAY
```

---

# 3. Notification Lifecycle (User Platform)

```text
Event
  → Create (dispatcher + template render)
  → Persist (user_inbox_notifications)     ✅ Implemented
  → Dispatch realtime                      ❌ Missing (dispatch = persist only)
  → Push to connected clients              ❌ Missing
  → Client Receive                         ❌ Missing
  → Badge Update                           ❌ Not on event (only on UI init/refresh)
  → UI Render panel                        ⚠️ On-demand (open bell → fetch list)
```

`dispatcher.dispatch` tên gợi ý phân phối realtime; **implementation thực tế = render + INSERT inbox**.  
Evidence: `delivery-channel.js` chỉ gọi `inbox.pushToUser`; không emit bus/WS.

---

# 4. Badge Lifecycle (User)

| Bước | Hiện trạng | Evidence |
|------|------------|----------|
| Badge DOM | Tạo trong `ensureNotifBellPanel` → `data-ifx-bell-notif-badge` | `iflux-user-notifications-ui.js` |
| Data source | Ưu tiên `serverUnread` từ `GET /api/notifications/summary`; fallback local list | `inapp-notifications.js` `fetchSummary` / `unreadCount` |
| Khi paint | `renderMenuBadges()` → `fetchSummary().then(paint)` | `iflux-user-notifications-ui.js` |
| Khi mount module | **Lazy — chỉ sau click chuông** | `iflux-web-ui.js` comment *「Task5 Lazy L12 — chuông: chỉ tải khi click」*; `bindHeaderChromeLazy` |
| Polling | **Không** | grep User_Web: không setInterval/EventSource cho notif |
| WebSocket/SSE | **Không** | grep backend: không gateway notif |
| Giảm khi đọc | `markServerRead` / `markAllRead` → POST API + event `iflux-notifications-change` | Chỉ khi UI đã load |
| Tăng khi notif mới (online) | **Không** | Không listener server push |

**Root Cause badge:**  
(1) **Lazy load** → trước click: không có script badge + không gọi summary.  
(2) **Không realtime/poll** → sau khi đã load: badge cũng không tự tăng khi INSERT mới.

---

# 5. Realtime Lifecycle

| Thành phần | Có? | Ghi chú |
|------------|-----|---------|
| Persist inbox | ✅ | `inbox.service.pushToUser` |
| In-process Event Bus | ✅ | `core/events/bus.js` — chỉ FN community/comment events |
| Queue (Bull/Redis) cho notif push | ❌ | Không |
| WebSocket Gateway | ❌ | Không |
| SSE | ❌ | Không |
| Client subscribe | ❌ | Không |
| Client polling unread | ❌ | Không |
| Toast/popup User khi event | ❌ | Không runtime toast cho server inbox |

**Đứt chuỗi tại:** Persist → **(thiếu Push)** → Client.

Affiliate vẫn thấy item khi mở chuông vì panel gọi `fetchInboxPage` (pull). Đó là **pull-on-open**, không phải realtime.

---

# 6. Offline → Online Sync Lifecycle

| Cơ chế kỳ vọng | Hiện trạng |
|----------------|------------|
| Sync missed trên reconnect | ❌ Không có reconnect handler riêng cho notifications |
| Initial fetch unread khi login/shell boot | ❌ Shell boot **không** load `inapp-notifications` / không gọi `fetchSummary` |
| Replay queue | ❌ Không |
| `fetchSummary` API | ✅ Tồn tại — nhưng chỉ khi `IfluxUserNotificationsUI.init/refresh` (sau lazy load) |
| Hydrate event | `iflux-user-data-hydrated` → `refresh` **nếu** UI đã init | Không thay thế boot sync |

**Verdict:** Offline→Online = **FAIL** (không có sync chủ động lúc online lại; chỉ pull khi user mở chuông).

---

# 7. Danh sách event / type sinh notification

## 7.1 Catalog Platform (seed — 23 types)

Nguồn: `backend/src/modules/notifications/notification-platform-seed-data.js` → `CATALOG_CASES`.

| Code | Tên | Wired runtime tạo inbox? |
|------|-----|---------------------------|
| `ORDER_UPGRADE_PENDING` | Đơn nâng cấp — chờ duyệt | ⚠️ Catalog only — **không thấy** `dispatcher.dispatch` backend |
| `ORDER_UPGRADE_APPROVED` | Đã kích hoạt | ⚠️ Catalog only |
| `ORDER_UPGRADE_REJECTED` | Bị từ chối | ⚠️ Catalog only |
| `SUBSCRIPTION_EXPIRING` | Gói sắp hết hạn | ⚠️ Catalog only |
| `SUBSCRIPTION_EXPIRED` | Gói hết hạn | ⚠️ Catalog only |
| `AFFILIATE_COMMISSION_EARNED` | Hoa hồng | ⚠️ Catalog; client local push path tồn tại riêng |
| `AFFILIATE_REFERRAL_SUCCESS` | Referral mới | ✅ `referral-signup.consumer` ← `auth.service` |
| `COMMUNITY_POST_FROM_FOLLOWING` | Bài từ người follow | ✅ `fn-subscriber.onPostPublished` |
| `COMMUNITY_DIRECT_MESSAGE` | Tin nhắn | ⚠️ Catalog; client local type path |
| `ALERT_TRIGGERED` | Alert kích hoạt | ⚠️ Catalog; client local |
| `SYSTEM_ANNOUNCE_*` / maintenance / product / welcome | Hệ thống | ⚠️ Catalog — **không thấy** broadcast dispatcher wire trong audit này |
| `FOLLOW_ENTITY_TAGGED_POST` | Bài gắn ticker WL | ✅ `fn-subscriber` |
| `FOLLOW_USER_SHARE` | Followee share | ✅ `fn-subscriber` |
| `FOLLOW_ENTITY_COMMENT` | Followee comment entity | ✅ `fn-subscriber` |
| `INTERACTION_COMMENT_LIKED` | Like comment | ✅ `fn-subscriber` |
| `INTERACTION_COMMENT_REPLY` | Reply comment | ✅ `fn-subscriber` |
| `ADMIN_ORDER_NEW` | Đơn mới (Admin) | ❌ **Không** qua Platform inbox — Runtime B localStorage |
| `ADMIN_SLA_BREACH` | SLA | Catalog / future |
| `PLATFORM_SMOKE_TEST` | Internal | Non-dispatchable |

## 7.2 Producers thực sự gọi `dispatcher.dispatch`

| Producer | Trigger | Type |
|----------|---------|------|
| `referral-signup.consumer` | User đăng ký có referrer | `AFFILIATE_REFERRAL_SUCCESS` |
| `fn-subscriber` | `community.post.published` | `COMMUNITY_POST_FROM_FOLLOWING`, `FOLLOW_ENTITY_TAGGED_POST` |
| `fn-subscriber` | `community.post.shared` | `FOLLOW_USER_SHARE` |
| `fn-subscriber` | `entity.comment.created` | `INTERACTION_COMMENT_REPLY` / `FOLLOW_ENTITY_COMMENT` |
| `fn-subscriber` | `comment.liked` | `INTERACTION_COMMENT_LIKED` |

## 7.3 Client-local (không qua server inbox)

`IfluxInAppNotifications.push*` chỉ ghi local khi type thuộc `IfluxClientLocalNotificationTypes` — song song / legacy với Platform.

Admin orders: `IfluxAdminNotifications` — hoàn toàn client.

---

# 8. Requirements Matrix (PASS / PARTIAL / FAIL)

## R1 — Bell Badge unread tăng/giảm không cần refresh

| | |
|--|--|
| **Verdict** | **FAIL** |
| **Evidence** | Lazy load: `iflux-web-ui.js` `ensureUserNotifications` / `bindHeaderChromeLazy` — chỉ gắn click. Badge paint: `iflux-user-notifications-ui.js` `renderMenuBadges`. Summary API: `inapp-notifications.js` `fetchSummary` → `GET /api/notifications/summary`. Không poll/WS. |
| **Root Cause** | (RC-U1) Chuông không boot cùng shell → badge không tồn tại / không fetch lúc vào trang. (RC-U2) Sau khi load vẫn không có kênh cập nhật khi inbox INSERT. |

## R2 — Realtime khi user online (affiliate / system / …)

| | |
|--|--|
| **Verdict** | **FAIL** |
| **Evidence** | Affiliate persist: `auth.service` → `notifyReferralSignupF0` → `dispatcher` → `inbox.pushToUser`. Không bước sau persist. Bus chỉ in-process (`bus.js`). Owner test: list có khi mở chuông, không realtime. |
| **Root Cause** | (RC-U3) **Không có Realtime delivery layer.** `dispatch` = DB write. Client chỉ **pull-on-open**. |

## R3 — Offline → Online: badge + list cập nhật không cần mở chuông

| | |
|--|--|
| **Verdict** | **FAIL** |
| **Evidence** | Không reconnect handler notif. `shell-boot.js` không load notif modules. `initForCurrentUser`/`fetchSummary` phụ thuộc lazy init. |
| **Root Cause** | (RC-U4) Không có initial/missed sync trên login hoặc visibility/reconnect. |

## R4 — Admin không replay popup đơn hàng đã thông báo

| | |
|--|--|
| **Verdict** | **FAIL** |
| **Evidence** | `iflux-admin-notifications.js`: `TOAST_SEEN_KEY` = **sessionStorage**; `showUnreadToasts` trên mọi `initNavbarBell`; unread vẫn `read:false` trong localStorage cho đến khi user mark read. Dashboard cũng gọi `showUnreadToasts` (`dashboard-page.js`). |
| **Root Cause** | (RC-A1) Trạng thái “đã popup” **không durable** (session only). (RC-A2) Toast không đồng nghĩa mark-read / displayed_at server. Mỗi session mới = replay unread. |

## R5 — Admin và User cùng một Notification Platform (SoT)

| | |
|--|--|
| **Verdict** | **FAIL** |
| **Evidence** | User: `user_inbox_notifications` + `/api/notifications`. Admin: `localStorage iflux_admin_notifications_v1` + `IfluxSubscriptionOrdersStore`. Seed có `ADMIN_ORDER_NEW` nhưng Admin **không** gọi dispatcher. |
| **Root Cause** | (RC-P1) **Hai runtime** (Trường hợp A). Không phải chỉ thiếu field `displayed_at` trên cùng một repo (dù Runtime B cũng thiếu durable display state — Trường hợp B **trong nội bộ Admin**). |

---

# 9. Root Cause Register (không workaround)

| ID | Layer | Root Cause |
|----|-------|------------|
| **RC-P1** | Architecture | User Platform (DB+API) và Admin Order Notif (localStorage) là **hai hệ thống**. Vi phạm Single Source of Truth cho Notification. |
| **RC-U3** | Backend delivery | Sau persist **không có** publish realtime (WS/SSE/queue→gateway). `dispatcher` chỉ ghi inbox. |
| **RC-U1** | User client boot | Notification UI **lazy-load on bell click** — badge/summary không chạy ở shell boot. |
| **RC-U2** | User client runtime | Không polling / không subscription → badge không đổi khi online có event mới. |
| **RC-U4** | User sync | Không initial/missed sync khi login/reconnect. |
| **RC-A1** | Admin popup | `toast_seen` dùng **sessionStorage** → mất mỗi session. |
| **RC-A2** | Admin state | Popup không persist “displayed”; unread local vẫn true → `showUnreadToasts` lặp. |

### Call stack Affiliate (đứt ở đâu)

```text
auth.service (register)
  → notifyReferralSignupF0Safe
    → dispatcher.dispatch
      → deliveryChannel.sendInApp
        → inbox.pushToUser          ✅ LAST SUCCESSFUL STEP
          → [MISSING] realtime publish
          → [MISSING] client consume
          → [MISSING] badge update
```

### Call stack Admin replay

```text
DOMContentLoaded / page load
  → initNavbarBell
    → syncOrdersFromStore
    → showUnreadToasts
      → read unread from localStorage
      → sessionStorage toast_seen miss (new session)
      → ixToast(order)                 ❌ REPLAY
```

---

# 10. Admin Notification Audit (mục 10)

| Câu hỏi | Trả lời |
|---------|---------|
| Admin dùng Notification Service nào? | **Không** dùng backend `dispatcher`/`inbox`. Dùng `IfluxAdminNotifications` (client). |
| Chung với User? | **Không.** |
| Repository riêng? | localStorage `iflux_admin_notifications_v1` |
| Queue riêng? | Không (sync từ orders store) |
| Event Bus riêng? | DOM events `iflux-admin-notif-changed`, `iflux-orders-changed` + `storage` |
| Bell riêng? | Có — `data-ifx-admin-notif-bell` |
| Popup riêng? | `ixToast` qua `toastOnce` / `showUnreadToasts` |

---

# 11. Popup Lifecycle (Admin) — mục 11

```text
Order trong Store
  → pushNewOrder (local list)
  → toastOnce / showUnreadToasts
  → markToastSeen(id) → sessionStorage only
  → ❌ Không Persist durable “displayed”
  → Login/session sau → show lại nếu vẫn unread
```

| Trạng thái | Lưu ở đâu | Durable? |
|------------|-----------|----------|
| Notification item | localStorage | Có (browser) |
| `read` | localStorage field | Có nếu user bấm “Đã đọc” |
| Toast already shown | sessionStorage | **Không** qua session |
| Server displayed_at | — | **Không có** |

Tiêu chí lần vào sau: `!n.read` + chưa có trong session toast map → toast lại.

---

# 12. SoT Audit — Single Platform — mục 12

| Nguyên tắc | Verdict |
|------------|---------|
| Một Notification Service tạo/lưu/dispatch | **FAIL** — A vs B |
| Một Repository | **FAIL** — PG inbox vs localStorage |
| Consumer/UI khác nhau được phép | User Bell vs Admin Bell **được phép** *nếu* cùng platform — **hiện không cùng** |
| SoT Follow & Notification Domain: Notification là consumer của business event | User path (FN bus) **đúng hướng**; Admin order path **bypass** Platform |

**Files Ownership (Runtime B):**

- `Admin_Design_system/iflux-admin-ui/iflux-admin-notifications.js` — bell/toast/store
- `User_Web/iflux-web-ui/subscription-orders-store.js` — gọi `pushNewOrder` / `syncOrdersFromStore`
- `Admin_Design_system/app/dashboard/dashboard-page.js` — sync + `showUnreadToasts`

**Files Ownership (Runtime A):**

- `backend/src/modules/notifications/*`
- `User_Web/iflux-web-ui/inapp-notifications.js`
- `User_Web/iflux-web-ui/iflux-user-notifications-ui.js`
- Lazy gate: `User_Web/iflux-web-ui/iflux-web-ui.js`

---

# 13. Evidence Index (file → function)

| Concern | File | Symbol |
|---------|------|--------|
| Lazy bell | `User_Web/iflux-web-ui/iflux-web-ui.js` | `ensureUserNotifications`, `bindHeaderChromeLazy`, `installHeaderChromeLazy` |
| Badge paint | `User_Web/iflux-web-ui/iflux-user-notifications-ui.js` | `renderMenuBadges`, `ensureNotifBellPanel`, `init` |
| Summary/Inbox client | `User_Web/iflux-web-ui/inapp-notifications.js` | `fetchSummary`, `fetchInboxPage`, `unreadCount`, `markServerRead` |
| API | `backend/.../notifications.routes.js` | `GET /summary`, `GET /`, `POST /:id/read`, `POST /read-all` |
| Persist | `backend/.../inbox.service.js` | `pushToUser`, `summary`, `listInbox` |
| “Dispatch” | `backend/.../dispatcher.js` | `dispatch` → `sendInApp` only |
| Affiliate | `backend/.../referral-signup.consumer.js` | `notifyReferralSignupF0` |
| Auth wire | `backend/.../legacy-auth/auth.service.js` | `notifyReferralSignupF0Safe` |
| FN events | `backend/.../fn-subscriber.js` | `registerFnNotificationSubscribers` |
| Bus | `backend/src/core/events/bus.js` | in-process `publish`/`subscribe` |
| Admin runtime | `Admin_Design_system/iflux-admin-ui/iflux-admin-notifications.js` | `showUnreadToasts`, `toastOnce`, `initNavbarBell` |
| Admin CSS badge | `User_Web/iflux-web-ui/app-shell.css` | `.ifx-topnav-notif-badge` |

---

# 14. Out of scope (cố ý không làm)

- Không implement realtime gateway  
- Không unify Admin vào Platform  
- Không sửa lazy-load  
- Không đề xuất thiết kế target-state chi tiết (Owner chưa mở phase fix)

---

# 15. Kết luận một câu

**Notification đã được tạo và lưu (User Platform), nhưng hệ thống hiện tại không có lớp realtime delivery; badge User gần như không boot cho đến khi bấm chuông; Admin đang chạy một runtime localStorage riêng và replay toast mỗi session vì “đã hiện” chỉ nhớ trong sessionStorage.**
