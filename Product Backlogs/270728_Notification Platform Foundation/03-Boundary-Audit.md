# 03 — Boundary Audit · Notification Platform Foundation

**Date:** 2026-07-28  
**Loại:** Architecture audit — **Architecture Boundary**  
**Mục đích:** Khóa **domain được làm gì / cấm làm gì** — ranh giới cứng trước SoT.  
**Liên quan:** [`02-Ownership-Audit.md`](02-Ownership-Audit.md) · [`05-Runtime-Flow-Audit.md`](05-Runtime-Flow-Audit.md)

---

## 1. Ranh giới tổng quan

```text
┌─────────────────── DOMAIN LAYER ───────────────────┐
│  Affiliate · Community · Orders · Follow · Alert   │
│  Owns: Business facts · Event publish · Recipients │
│  FORBIDDEN: Template · Render · Inbox · Push/Email │
└────────────────────────┬───────────────────────────┘
                         │ Event / dispatch request
                         ▼
┌──────────────── PLATFORM LAYER ────────────────────┐
│  Type Registry · Template · Rule · Dispatcher      │
│  Inbox · Delivery adapters · Preference            │
│  FORBIDDEN: Order logic · Referral tree · Post feed│
└────────────────────────┬───────────────────────────┘
                         │ DTO
                         ▼
┌──────────────── APP SHELL (User Web) ──────────────┐
│  Bell · Panel · Mark read — display only           │
│  FORBIDDEN: Template edit · Business dispatch      │
└────────────────────────────────────────────────────┘
```

**Notification Platform không thuộc bất kỳ domain nào.**

---

## 2. Domain boundary matrix

| Domain | ✅ Được | ❌ Cấm |
|--------|---------|--------|
| **Affiliate** | `emit` / `publish` referral.signup.success · resolve F0/F1/F2 recipient ids · `dispatch(typeCode, recipientUserId, variables)` | `insert notification` · render template · sửa template · gọi Push/Email trực tiếp |
| **Community** | `publish` post.published · comment.liked · resolve actor/post facts | `dispatch()` **trong UI layer** · hardcode title · inbox write |
| **Follow** | `publish` follow.created · list follower ids (existing follow service) | Notification template ownership |
| **Orders** | `publish` order.* events · payload order facts | `OrderService.sendNotification()` · ghi inbox |
| **Alert** | `publish` alert.triggered · ticker/condition facts | Render/copy notification |
| **Admin Ops** | PATCH template copy · campaign CRUD (broadcast) | Tạo Type · hook business trigger |

**Ghi chú `dispatch()`:** Domain backend **được** gọi `NotificationDispatcher.dispatch()` như **client mỏng** của Platform — payload chỉ gồm `typeCode`, `recipientUserId`, `variables`, `dedupeKey`. **Không** truyền title/body đã render (trừ Phase migrate tạm — phải có exit date).

---

## 3. Platform boundary matrix

| Platform module | ✅ Owns | ❌ Không được |
|-----------------|---------|---------------|
| **Type Registry** | code · admin_code · variables schema · category | Business rules (referral tier calc) |
| **Template Store** | title/body mẫu · version | Khi nào gửi (trigger) |
| **Rule Engine** | enabled · preference · channel · dedupe | Resolve affiliate upline |
| **Dispatcher** | orchestration end-to-end | Domain-specific recipient logic |
| **Inbox Service** | persist · cursor API · dedupe index | Community post content |
| **Render** | placeholder substitution | Fetch user profile từ domain DB (chỉ variables đã truyền) |

---

## 4. Ví dụ cụ thể (Affiliate vs Community)

### Affiliate — đúng boundary

```javascript
// auth.service.js — sau signup success
eventBus.publish('referral.signup.success', {
  newUserId, displayName, uplineIds: [f0, f1, f2]
});

// affiliate-notif-subscriber.js — Platform-owned subscriber HOẶC affiliate hook mỏng
for (const uplineId of uplineIds) {
  await NotificationDispatcher.dispatch({
    typeCode: 'AFFILIATE_REFERRAL_SUCCESS',
    recipientUserId: uplineId,
    variables: { member: displayName },
    dedupeKey: `aff_ref:${newUserId}:${uplineId}`
  });
}
```

### Affiliate — sai boundary

```javascript
// ❌ CẤM
await inbox.pushToUser(uplineId, {
  title: 'Referral mới',
  body: displayName + ' đã đăng ký…'
});

// ❌ CẤM
IfluxInAppNotifications.pushReferralSignup(uplineId, data);
```

### Community — đúng boundary

```javascript
// community.service — chỉ publish
eventBus.publish('community.post.published', { postId, authorId, title, tickers });

// fn-subscriber → migrate to Platform subscriber
await NotificationDispatcher.dispatch({
  typeCode: 'COMMUNITY_POST_FROM_FOLLOWING',
  recipientUserId: followerId,
  variables: { actor: authorName, post_title: title },
  dedupeKey: `comm_post:${postId}:${followerId}`
});
```

### Community — sai boundary

```javascript
// ❌ CẤM — domain UI gọi dispatch
CommunityPage.onPostCreated(function () {
  NotificationDispatcher.dispatch(…);
});

// ❌ CẤM — frontend render template
IfluxSystemNotificationTemplates.render('USER_COMM_POST', vars);
```

---

## 5. Admin boundary

| ADM-SYS-003 (Template) | ADM-NOTIF-* (Campaign) |
|------------------------|-------------------------|
| Sửa copy per Notification Type | Tạo chiến dịch broadcast |
| Không biết trigger | Không thay Type registry |
| Platform API consumer | Wave C stub — tách pipeline |

**Không gộp** campaign broadcast vào Type dispatch — hai boundary khác nhau.

---

## 6. Client (User Web) boundary

| ✅ Được | ❌ Cấm |
|---------|--------|
| Hiển thị inbox DTO từ API | Client-side template SoT |
| Mark read · unread count | `pushReferralSignup` production path |
| Deep link từ `href` trong DTO | Domain-specific notification managers |

---

## 7. Cross-boundary data contract

Domain → Platform **chỉ** truyền:

| Field | Bắt buộc | Ghi chú |
|-------|----------|---------|
| `typeCode` | ✅ | Phải tồn tại trong Type Registry |
| `recipientUserId` | ✅ | UUID user nhận |
| `variables` | ✅ | Key phải ⊆ Type.variables schema |
| `dedupeKey` | Khuyến nghị | Tránh trùng |
| `channels` | Optional | Default từ Type.supported_channels |
| ~~`title`~~ | ❌ | Platform render |
| ~~`body`~~ | ❌ | Platform render |

---

## 8. Vi phạm boundary hiện tại (cần đóng)

| Vi phạm | Layer | Fix phase |
|---------|-------|-----------|
| Client affiliate render + push | Domain + Client | Consumer Integration |
| fn-subscriber hardcode copy | Platform subscriber | Consumer Integration |
| Catalog/localStorage template SoT | Platform data | Phase B |
| 2 Admin template UI | Admin | Phase B retire |

---

## 9. Exit criteria Boundary Audit

- [ ] Owner xác nhận matrix §2–§3
- [ ] Ví dụ §4 accepted as reference pattern
- [ ] Không conflict Ownership Audit §3
- [ ] Ready for Platform SoT LOCK

---

*Boundary Audit v1 — 2026-07-28 — chờ Owner LOCK.*
