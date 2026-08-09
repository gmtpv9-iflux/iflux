# 10 — Developer Guide · Add Notification Consumer

**Phase D deliverable** · Áp dụng sau khi Platform PASS  
**SoT:** [`06-Platform-SoT.md`](06-Platform-SoT.md) · [`PhaseD-D1-Solution-And-Owner-Decision.md`](PhaseD-D1-Solution-And-Owner-Decision.md)

---

## Khi nào dùng guide này

Product yêu cầu notification business mới (Affiliate · Community · Orders · Alert…).  
Developer **chỉ làm consumer slice** — **không** sửa Platform core (`dispatcher.js` · `preference.service.js` · `delivery-channel.js`).

---

## Checklist (5 bước)

### 1. Đăng ký Notification Type (seed)

Thêm case vào [`backend/src/modules/notifications/notification-platform-seed-data.js`](../../../backend/src/modules/notifications/notification-platform-seed-data.js):

- `code` — immutable API contract (`TYPE_CODE_RE`)
- `admin` — NOTIF-USER-xxx
- `variables[]` — canonical keys qua `variable-alias.js`
- `group_label` — canonical human group trong seed · **sole SoT D6** · dispatch check = `type_code` · `group_label IS NULL` = non-configurable
- `defaultTitle` / `defaultMessage`

Chạy validate + seed:

```bash
cd backend
node scripts/seed-notification-platform-types.js
```

### 2. Seed default template

Script seed tự upsert `notification_templates` (anti-drift Phase C).  
Admin có thể sửa copy sau trên ADM-SYS-003 — **không** sửa code.

### 3. Hook business event → dispatch

**Đúng:**

```javascript
const dispatcher = require('./modules/notifications/dispatcher');

await dispatcher.dispatch({
  typeCode: 'YOUR_TYPE_CODE',
  recipientUserId: uuid,
  variables: {
    recipient_name: '…',
    member: '…'
    // keys ⊆ Type.variables contract
  },
  dedupeKey: 'optional:idempotent:key',
  href: '/deep-link',
  icon: 'ti-bell' // optional — fallback Type.icon
});
```

**Sai — cấm:**

```javascript
// ❌ Gọi inbox trực tiếp
inbox.pushToUser(userId, { title: '…', body: '…' });

// ❌ Render client-side
IfluxSystemNotificationTemplates.render('USER_XXX', vars);

// ❌ Import delivery-channel từ Domain
require('./delivery-channel').sendInApp(...);

// ❌ Business rule trong dispatcher
if (typeCode === 'AFFILIATE_…') { … }
```

Domain module **resolve recipient** (F0 upline · follower list…) rồi gọi `dispatch()` **per recipient**.

### 4. Verify

| Check | Cách |
|-------|------|
| Admin copy | ADM-SYS-003 — sửa mẫu tiêu đề/nội dung |
| User bucket | Quyền riêng tư → tắt bucket → không nhận mới |
| Inbox | Bell đọc `GET /api/notifications` |
| Preference OFF | Không row inbox mới |
| Dedupe | Cùng `dedupeKey` không double-send |

### 5. Done

Không tạo NotificationManager · không Admin page mới · không App Shell mode mới.

---

## Ví dụ đã ship Phase D

| Consumer | Hook | Type |
|----------|------|------|
| Affiliate F0 signup | `auth.service` → `referral-signup.consumer.js` | `AFFILIATE_REFERRAL_SUCCESS` |
| FN-001 follower post | `fn-subscriber.js` follower branch | `COMMUNITY_POST_FROM_FOLLOWING` |

---

## Ownership reminder

```text
Domain Event     → dispatch({ typeCode, recipientUserId, variables })
Dispatcher       → template · preference · render · delivery
Delivery Channel → inbox only
User Web         → read API · không compose
```

---

*Notification Platform Foundation — Phase D2.5 — 2026-07-28*
