# 02 — Ownership Audit · Notification Platform Foundation

**Date:** 2026-07-28  
**Loại:** Architecture audit — **không** audit implementation  
**Mục đích:** Khóa **ai sở hữu gì** trước khi LOCK Platform SoT — tránh domain creep sau 5–10 năm.  
**Tiền đề:** [`01-Audit-Current-State.md`](01-Audit-Current-State.md) (implementation đủ)

---

## 1. Nguyên tắc ownership

| # | Nguyên tắc |
|---|------------|
| O1 | **Notification Platform** không thuộc Affiliate · Community · Orders · Membership — là **capability cross-cutting** (Product Architecture V2) |
| O2 | Domain **owns business event + payload** — Platform **owns delivery pipeline** |
| O3 | Admin **owns copy** (title/body template) — Developer **owns type registration + trigger hook** |
| O4 | Một thành phần = **một owner duy nhất** — không shared ownership mơ hồ |

---

## 2. Ma trận ownership (LOCKED — chờ Owner sign-off)

| Thành phần | Owner | Mô tả ngắn |
|------------|-------|------------|
| **Notification Type** (registry) | **Platform** | Developer *đăng ký* qua migration/seed — không domain tự thêm runtime |
| **Notification Template** (title/body) | **Platform** (data) · **Admin** (copy edit) | SoT DB; Admin PATCH qua ADM-SYS-003 |
| **Notification Preference** | **Platform** | v1: **domain bucket** boolean only — §8.1 · cấm preference center |
| **Notification Rule** | **Platform** | enabled · preference · channel · dedupe — không UI Admin v1 |
| **Notification Dispatcher** | **Platform** | Single entry `dispatch()` |
| **Template render** | **Platform** | Variable → title/body — domain **cấm** render |
| **Notification Inbox** (persist + API) | **Platform** | `user_inbox_notifications` + `/notifications/*` |
| **Inbox UI** (bell · panel) | **App Shell** (User Web) | FN-001 Plan — không feature Manager riêng |
| **Business Event** | **Domain** | signup · order · post published · follow created… |
| **Event Bus / publish** | **Platform infra** · **Domain payload** | Domain publish event; không embed notification logic |
| **Push Provider** | **Platform** | FCM/APNs adapter — Phase sau |
| **Email Provider** | **Platform** | SMTP/ESP adapter — Phase sau |
| **Campaign broadcast** | **Platform Ops** (Admin) | `notif_campaigns` — khác event-driven Type |
| **Merge tag catalog** | **Platform** | Canonical variables — xem [`04-Variable-Contract-Audit.md`](04-Variable-Contract-Audit.md) |

---

## 3. Domain — được và không được

### 3.1 Affiliate / Membership

| Hành vi | Được? | Owner thực hiện |
|---------|-------|-----------------|
| Publish event `referral.signup.success` + payload | ✅ | Affiliate domain |
| Gọi `NotificationDispatcher.dispatch({ typeCode: 'AFFILIATE_REFERRAL_SUCCESS', … })` | ✅ | Affiliate domain (hook mỏng) |
| Sửa Notification Template (title/body) | ❌ | Admin only (Platform UI) |
| `inbox.pushToUser()` trực tiếp | ❌ | Platform only |
| `IfluxInAppNotifications.pushReferralSignup()` | ❌ retire | Anti-pattern hiện tại |
| Hardcode title `'Referral mới'` | ❌ | Platform template SoT |

### 3.2 Community / Follow / Interaction

| Hành vi | Được? |
|---------|-------|
| Publish `community.post.published` · `interaction.comment.liked` … | ✅ |
| Subscriber domain gọi `dispatch(typeCode, …)` | ✅ (Phase Consumer) |
| Subscriber hardcode title/body | ❌ retire (`fn-subscriber.js` hiện tại) |
| `CommunityNotificationManager` | ❌ cấm (FN-001) |

### 3.3 Orders / Subscription

| Hành vi | Được? |
|---------|-------|
| Publish `order.pending` · `order.approved` … | ✅ |
| `OrderService.sendNotification(...)` — method riêng | ❌ **cấm** |
| Ghi trực tiếp `user_inbox_notifications` | ❌ |
| Render template trong order module | ❌ |

### 3.4 Admin (vận hành)

| Hành vi | Được? |
|---------|-------|
| Sửa title/body template (ADM-SYS-003) | ✅ |
| Tạo Notification Type mới từ UI | ❌ v1 |
| Bật/tắt chiến dịch broadcast (push/email campaign) | ✅ (Wave C — tách Type registry) |

---

## 4. Anti-pattern ownership (hiện trạng → cấm)

| Pattern hiện tại | Vi phạm | Owner đúng |
|------------------|---------|------------|
| `loyalty-affiliate-store` → client render template | Domain owns render | Platform |
| `fn-subscriber.js` hardcode title | Domain owns copy | Platform template |
| `inapp-notifications.js` localStorage template SoT | Client owns SoT | Platform DB |
| Catalog `defaultTitle` trong JS deploy | Code owns copy | Platform DB + Admin |
| Domain gọi `pushToUser` trực tiếp | Domain owns inbox | Platform Dispatcher |

**Mục tiêu sau Consumer Integration:** Mọi path production đi qua **một owner inbox** = Platform Dispatcher.

---

## 5. Developer vs Admin vs Platform runtime

```text
┌─────────────────────────────────────────────────────────────┐
│ DEVELOPER (khi có tính năng mới)                            │
│   Owns: Type registration · event hook · variables contract │
│   Không owns: template copy · inbox schema · push/email     │
├─────────────────────────────────────────────────────────────┤
│ ADMIN (vận hành hàng ngày)                                 │
│   Owns: title/body edit · (sau) campaign broadcast         │
│   Không owns: Type creation · trigger · business rules       │
├─────────────────────────────────────────────────────────────┤
│ PLATFORM RUNTIME                                            │
│   Owns: dispatch · rule · render · inbox · delivery        │
├─────────────────────────────────────────────────────────────┤
│ DOMAIN                                                      │
│   Owns: business event · payload facts · recipient resolve  │
│   Không owns: template · inbox write · channel adapter       │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Enforcement (thi công — ghi nhận, không implement ở audit này)

| Cơ chế | Mục đích |
|--------|----------|
| **Chỉ export** `NotificationDispatcher.dispatch` cho domain modules | API surface tối thiểu |
| **`inbox.pushToUser` internal** — không import từ domain | Module boundary |
| **ESLint / CI grep** `pushToUser|pushReferralSignup|sendNotification` ngoài platform | Regression guard |
| **Code review checklist** | Mọi PR notification trace về Type + dispatch |

---

## 7. Exit criteria Ownership Audit

- [ ] Owner xác nhận ma trận §2
- [ ] Owner xác nhận domain cấm §3
- [ ] Không mâu thuẫn FN-001 (App Shell UI owner · event publish)
- [ ] Input cho [`03-Boundary-Audit.md`](03-Boundary-Audit.md) và [`06-Platform-SoT.md`](06-Platform-SoT.md)

---

*Ownership Audit v1 — 2026-07-28 — chờ Owner LOCK.*
