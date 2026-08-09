# 05 — Runtime Flow Audit · Notification Platform Foundation

**Date:** 2026-07-28  
**Loại:** Architecture audit — **Runtime responsibility matrix**  
**Mục đích:** Nhìn một bảng biết **Platform vs Domain** được phép làm gì tại từng bước pipeline.  
**Liên quan:** [`02-Ownership-Audit.md`](02-Ownership-Audit.md) · [`03-Boundary-Audit.md`](03-Boundary-Audit.md)

---

## 1. Pipeline tổng quan (target state)

```text
Domain: Business Event occurs
    → (optional) Domain resolves recipient ids
    → Domain calls dispatch(typeCode, recipientUserId, variables)  OR  Event → Platform Subscriber → dispatch
Platform: Rule → Template → Render → Inbox → (Push/Email)
App Shell: Display DTO
```

---

## 2. Responsibility matrix — core pipeline

| Step | Platform | Domain | Admin | Ghi chú |
|------|:--------:|:------:|:-----:|---------|
| **Business logic / trigger** | ❌ | ✅ | ❌ | Order approved · referral signup · post published |
| **Publish business event** | ❌ | ✅ | ❌ | Event bus — FN-001 pattern |
| **Resolve recipient list** | ❌ | ✅ | ❌ | F0/F1/F2 · followers · watchlist users |
| **Choose Notification Type code** | ❌ | ✅ | ❌ | Developer maps event → typeCode |
| **Call `dispatch()`** | ❌ | ✅* | ❌ | *Domain backend hook mỏng — không UI |
| **Preference check** | ✅ | ❌ | ❌ | Server toggle per user |
| **Type enabled check** | ✅ | ❌ | ❌ | Global kill switch |
| **Template lookup** | ✅ | ❌ | ❌ | DB by type + channel |
| **Render title/body** | ✅ | ❌ | ❌ | Variable substitution |
| **Dedupe check** | ✅ | ❌ | ❌ | Optional key from domain |
| **Save inbox record** | ✅ | ❌ | ❌ | `user_inbox_notifications` |
| **Push delivery** | ✅ (metadata only; **skip v1**) | ❌ | ❌ | §8.3 — no FCM/APNs |
| **Email delivery** | ✅ (metadata only; **skip v1**) | ❌ | ❌ | no SMTP v1 |
| **Edit template copy** | ❌ | ❌ | ✅ | ADM-SYS-003 → PATCH API |
| **Register new Type** | ✅ (process) | ✅ (request) | ❌ | Developer seed migration |
| **Display bell / panel** | ❌** | ❌ | ❌ | **App Shell — không Domain |

---

## 3. Responsibility matrix — forbidden paths

| Step | Platform | Domain | Lý do cấm |
|------|:--------:|:------:|-----------|
| Domain `insert inbox` | — | ❌ | Duplicate SoT · bypass rule/render |
| Domain pass pre-rendered title/body | — | ❌ | Admin template vô hiệu |
| Domain `render()` template client | — | ❌ | localStorage SoT anti-pattern |
| Platform compute referral commission | ❌ | — | Domain business |
| Platform publish community post | ❌ | — | Domain business |
| Admin trigger dispatch | — | — | ❌ Admin — không biết business event |

---

## 4. Flow A — Event bus (preferred FN-001)

```text
┌──────── Domain ────────┐
│ order.service          │
│   publish('order.approved', payload)
└───────────┬────────────┘
            ▼
┌──────── In-process listener (NOT a microservice) ────┐
│ backend/modules/notifications/subscribers/*.js     │
│   map payload → typeCode                           │
│   NotificationDispatcher.dispatch(...)             │
└───────────┬────────────────────────────────────────┘
            ▼
     [Rule → Template → Render → Inbox in_app only]
```

**v1 cấm:** queue · worker · Kafka · notification-service repo. Chi tiết: [`06-Platform-SoT.md`](06-Platform-SoT.md) §0.1 · §3.9 · §8.4.

**Domain không import inbox.** Listener thuộc Platform module folder.

---

## 5. Flow B — Direct dispatch (allowed, thin hook)

```text
┌──────── Domain ────────┐
│ auth.service register  │
│   … referral attached  │
│   dispatch(AFFILIATE_REFERRAL_SUCCESS, …)  ← 3–5 lines max
└───────────┬────────────┘
            ▼
     [Rule → Template → Render → Inbox]
```

**Điều kiện:** Không render · không inbox · không template string trong domain file.

---

## 6. Flow C — Client path (legacy — RETIRE)

```text
┌──────── Domain Client ────────┐
│ loyalty-affiliate-store       │
│   IfluxInAppNotifications     │
│     .pushReferralSignup()     │
│   → client render template    │
│   → localStorage SoT          │
└───────────────────────────────┘
         ❌ RETIRE @ Consumer Integration
```

---

## 7. Read path (User Web)

| Step | Platform | Domain | App Shell |
|------|:--------:|:------:|:---------:|
| GET /notifications/summary | ✅ API | ❌ | ✅ consumer |
| GET /notifications?cursor | ✅ API | ❌ | ✅ consumer |
| Mark read | ✅ API | ❌ | ✅ consumer |
| Hydrate from localStorage SoT | ❌ retire | ❌ | ❌ |

---

## 8. Admin edit path

| Step | Platform | Admin |
|------|:--------:|:-----:|
| List Types + templates | ✅ API | ✅ UI |
| PATCH title/body | ✅ API | ✅ Save |
| Validate variables in template | ✅ | ❌ (Platform warn on save) |
| Trigger send | ❌ | ❌ |

---

## 9. Hiện trạng vs target (gap)

| Step | Hiện tại | Target |
|------|----------|--------|
| Affiliate notify | Flow C ❌ | Flow B or A |
| Community post | Subscriber hardcode ❌ | Flow A + dispatch |
| Template lookup | Client catalog ❌ | Platform DB |
| Preference check | Missing ❌ | Platform Rule |
| Admin save | localStorage ❌ | Platform PATCH |

---

## 10. Phase Consumer Integration — flow migration order

| # | Consumer | Flow target | Type code (draft) |
|---|----------|-------------|-------------------|
| 1 | Affiliate referral | B or A | `AFFILIATE_REFERRAL_SUCCESS` |
| 2 | FN-001 post follower | A | `COMMUNITY_POST_FROM_FOLLOWING` |
| 3 | FN-001 watchlist tag | A | `WATCHLIST_ENTITY_POST` |
| 4+ | Orders · Interaction… | A | per Type registry |

---

## 11. Exit criteria Runtime Flow Audit

- [ ] Owner xác nhận matrix §2–§3
- [ ] Flow A preferred · Flow B allowed · Flow C retire — accepted
- [ ] Input locked vào [`06-Platform-SoT.md`](06-Platform-SoT.md)

---

*Runtime Flow Audit v1 — 2026-07-28 — chờ Owner LOCK.*
