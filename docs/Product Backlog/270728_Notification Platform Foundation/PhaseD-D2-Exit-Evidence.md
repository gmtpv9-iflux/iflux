# Phase D — D2 Exit Evidence

**Date:** 2026-07-28  
**Phase:** D2 — Implementation  
**Trạng thái:** ✅ **D2 COMPLETE** — sẵn sàng mở **D3 Cleanup**  
**Input:** D1 PASS · [`PhaseD-D1-Solution-And-Owner-Decision.md`](PhaseD-D1-Solution-And-Owner-Decision.md) §A.12

---

## 1. Reviewer Q&A — có dẫn chứng

### 1.1 D2.2 Bell ownership — Bell chỉ consume Inbox API?

**Verdict: ✅ PASS**

Bell UI (`iflux-user-notifications-ui.js`) **không** gọi preference API · **không** filter theo bucket/type.

Chỉ gọi qua `IfluxInAppNotifications`:

| Call | Endpoint | Mục đích |
|------|----------|----------|
| `fetchSummary()` | `GET /api/notifications/summary` | Badge unread count |
| `fetchInboxPage()` | `GET /api/notifications?cursor&limit` | Panel danh sách |
| `markServerRead()` | `POST /api/notifications/:id/read` | Đánh dấu đã đọc |
| `markAllRead()` | `POST /api/notifications/read-all` | Đọc hết |

Preference API (`GET/PATCH /users/me/notification-preferences`) **chỉ** tại tab Quyền riêng tư — `profile-privacy-page.js` · **không** import bell.

```text
Bell UI → fetchSummary / fetchInboxPage → Inbox API
Preference toggle → profile-privacy-page → Preference API → dispatcher (server-side @ dispatch)
```

Filter theo bucket xảy ra **trên server** trong `dispatcher.js` → `preferenceService.canDeliver()` — bell không biết bucket.

---

### 1.2 D2.3 Affiliate — còn client `pushReferralSignup` production consumer?

**Verdict: ✅ 0 production consumer** (dead export + demo seed còn — D3 xóa)

```bash
# Production path grep (User_Web + backend)
rg 'pushReferralSignup' User_Web backend --glob '!**/_bak/**' --glob '!**/docs/**'
```

| File | Vai trò | Production consumer? |
|------|---------|----------------------|
| `loyalty-affiliate-store.js` | ~~gọi pushReferralSignup~~ | ❌ **Đã xóa** D2.3 |
| `inapp-notifications.js` | định nghĩa + export + `seedDemoIfEmpty` demo | ❌ không gọi @ signup thật |
| `auth.service.js` | hook server | ✅ `referral-signup.consumer` → dispatcher |

Flow signup hiện tại:

```text
signup (verify / social)
  → auth.service
  → referral-signup.consumer.notifyReferralSignupF0Safe()
  → dispatcher.dispatch(AFFILIATE_REFERRAL_SUCCESS)
  → preferenceService.canDeliver
  → renderer
  → delivery-channel.sendInApp
  → inbox.pushToUser
```

**Không còn:** `signup → loyalty-affiliate-store → pushReferralSignup`.

---

### 1.3 D2.4 FN-001 scope — không nhầm “fn-subscriber xong”

**Verdict: PASS có phạm vi rõ**

| Branch `fn-subscriber` | D2 status |
|------------------------|-----------|
| **Follower @ post published** | ✅ Migrated → `dispatcher` · `COMMUNITY_POST_FROM_FOLLOWING` |
| Watchlist ticker tags | ⏳ OUT — legacy `inbox.pushToUser` (D3+ slice) |
| Post shared | ⏳ OUT |
| Entity comment / reply | ⏳ OUT |
| Comment liked | ⏳ OUT |

D2.4 chứng minh **1 proof consumer** (follower branch) — **không** = fn-subscriber hoàn tất.

---

### 1.4 Migration 038 — backward compatible & rollback

**Verdict: ✅ Additive only · non-destructive**

```sql
CREATE TABLE IF NOT EXISTS user_notification_preferences (...)
CREATE INDEX IF NOT EXISTS ...
```

| | |
|---|---|
| Destructive DDL | ❌ Không DROP · không ALTER type cũ |
| Default behavior | Không row = bucket **ON** (`canDeliver` default true) |
| Rollback code | Revert backend/FE deploy · PM2 restart |
| Rollback DB | Giữ table (empty/partial OK) · không bắt buộc DROP |
| Data loss risk | ❌ Không |

---

## 2. D2 Exit Checklist (grep-enforceable)

### Dispatcher (`dispatcher.js`)

| # | Gate | Evidence | Result |
|---|------|----------|--------|
| 1 | × `connection` / `query` / `db` | `rg 'connection\|query\(' backend/src/modules/notifications/dispatcher.js` → 0 | ✅ |
| 2 | × business `typeCode` branch | `rg "typeCode ===" dispatcher.js` → 0 | ✅ |
| 3 | × `pushToUser` trực tiếp | `rg pushToUser dispatcher.js` → 0 | ✅ |
| 4 | × re-export `renderTemplateString` | module.exports chỉ `loadTemplate`, `dispatch`, `preview` | ✅ |

Imports hợp lệ: `templateService` · `preferenceService` · `renderer` · `deliveryChannel` · `variable-alias` · `AppError`.

---

### Delivery (OD-D14)

| # | Gate | Evidence | Result |
|---|------|----------|--------|
| 1 | Chỉ `dispatcher.js` import `delivery-channel` | `rg "delivery-channel" backend/src` → 1 file | ✅ |
| 2 | Chỉ `delivery-channel.js` gọi `pushToUser` (ngoài `inbox.service`) | `rg pushToUser backend/src` → `delivery-channel.js` + `fn-subscriber.js` (legacy branches) + `inbox.service.js` | ⚠️ **Partial** — fn legacy OUT of D2 scope |

**Ghi chú:** Affiliate + FN follower **không** gọi `pushToUser` trực tiếp. Còn 5 call-site fn-subscriber legacy → **D3 retire target**.

---

### Consumer

| # | Gate | Evidence | Result |
|---|------|----------|--------|
| 1 | Affiliate không client compose | `loyalty-affiliate-store.js` × `pushReferralSignup` | ✅ |
| 2 | Affiliate server hook | `auth.service` → `referral-signup.consumer.js` | ✅ |
| 3 | FN follower via dispatcher | `fn-subscriber.js` follower loop → `dispatcher.dispatch(COMMUNITY_POST_FROM_FOLLOWING)` | ✅ |

---

### Client

| # | Gate | Evidence | Result |
|---|------|----------|--------|
| 1 | `pushReferralSignup` production consumer = 0 | Chỉ `inapp-notifications.js` define + demo seed | ✅ |
| 2 | Preference server SoT | `GET/PATCH /users/me/notification-preferences` | ✅ |
| 3 | Bell × preference API | `iflux-user-notifications-ui.js` × `notification-preferences` | ✅ |
| 4 | Không local preference write cho buckets | Toggle chỉ save qua API (`profile-privacy-page.js`) | ✅ |

---

### Preference

| # | Gate | Result |
|---|------|--------|
| API standalone OD-D6 | `/users/me/notification-preferences` | ✅ |
| `canDeliver(userId, bucket)` — không `typeCode` | `preference.service.js` | ✅ |
| Migration 038 applied Production | 2026-07-28 | ✅ |

---

## 3. Deliverables D2

| Slice | Status |
|-------|--------|
| D2.1 Platform core | ✅ |
| D2.2 Preference UI + Inbox wire | ✅ |
| D2.3 Affiliate F0 | ✅ |
| D2.4 FN follower proof | ✅ |
| D2.5 Developer Guide | ✅ [`10-Developer-Guide-Add-Consumer.md`](10-Developer-Guide-Add-Consumer.md) |

---

## 4. D3 entry criteria (known debt)

D2 **COMPLETE** không có nghĩa Platform PASS. D3 bắt buộc:

- [ ] Xóa `pushReferralSignup` function/export + demo seed path (`inapp-notifications.js`)
- [ ] Retire fn-subscriber legacy branches (watchlist · share · comment · like) → dispatcher hoặc slice riêng
- [ ] Grep Gate 1b full PASS (0 `pushToUser` ngoài delivery-channel + inbox.service)
- [ ] Inbox cutover — localStorage không SoT cho migrated types (Gate 3)
- [ ] `system-notification-catalog.js` / `renderTpl` production paths (OD-D7 zero consumer)

---

## 5. Exit statement

```text
D2 COMPLETE (2026-07-28)
  → D3 Cleanup authorized
  → D4/D5 after D3 PASS
```

---

*Phase D D2 Exit Evidence — grep snapshot 2026-07-28.*
