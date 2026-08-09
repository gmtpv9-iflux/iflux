# Phase D — D0 Discovery Audit

**Date:** 2026-07-28  
**Phase:** D — Consumer Integration  
**Trạng thái:** ✅ **D0 PASS** — Owner sign-off 2026-07-28 · sẵn sàng D1  
**Input:** Phase C PASS · [`06-Platform-SoT.md`](06-Platform-SoT.md) · [`09-Plan-Roadmap.md`](09-Plan-Roadmap.md) §9

---

## 1. Mục tiêu Phase D (SoT)

| Mục tiêu | Hiện trạng | Gap |
|----------|------------|-----|
| `NotificationDispatcher.dispatch()` full | Skeleton · throw Phase D | **Implement** Rule · Render · inbox |
| Consumer emit type only | Domain hardcode / client render | **Migrate** Affiliate + FN proof |
| Preference bucket UI | Chưa có API/DB · privacy tab chỉ profile fields | **Create** |
| Legacy client paths deleted | User Web vẫn catalog + templates-store + localStorage inbox | **Retire** per slice |
| Developer Guide | Chưa có `10-Developer-Guide-Add-Consumer.md` | **Publish** |

---

## 2. Runtime Ownership Matrix (LOCKED — Phase D gate)

Phase D là phase đầu tiên **đụng runtime thật** (Dispatcher · Consumer · User Web · Preference). Bảng này khóa **ownership từng stage pipeline** — mọi implementation D2+ phải tuân. SoT chi tiết: [`05-Runtime-Flow-Audit.md`](05-Runtime-Flow-Audit.md) §2 · [`06-Platform-SoT.md`](06-Platform-SoT.md) §2.

| Stage | Owner | Input | Output | Forbidden |
|-------|-------|-------|--------|-----------|
| **Domain Event** | Domain module | Business event (order approved · signup · post published) | Notification request (`typeCode` · `recipientUserId` · `variables` · optional `dedupeKey`) | Render title/body · chọn template · ghi inbox · preference logic |
| **Dispatcher** | Platform (`dispatcher.js`) | Notification request | Delivery job (resolved · rendered · deduped) | Business logic · **direct SQL/DB** · UI · God-object orchestration · **gọi `inbox.pushToUser` trực tiếp** |
| **Template Resolver** | Platform (`template.service.js`) | `typeCode` + channel | Template row + variable schema (Platform Contract) | Gọi UI · Admin PATCH · domain override copy |
| **Variable Resolver** | Platform (renderer + `variable-alias.js`) | Domain `variables` map + Type `variables[]` | Canonical payload · substituted `{key}` / legacy tag | Thêm business alias mới · key ngoài Type contract · client-side merge · **query DB** · **branch theo type business** |
| **Preference Engine** | Platform (`preference.service.js`) | User prefs `(user_id, preference_bucket)` + Type `preference_bucket` | Delivery decision (skip / proceed) | Biết consumer cụ thể · per-type toggle · quiet hours v1 |
| **Delivery Channel** | Platform (`delivery-channel.js` → `inbox.service.js`) | Delivery job (rendered title/body · icon · href · dedupe) | In-app record (`user_inbox_notifications`) | Chọn / sửa template · re-render · push/email adapter v1 · **import từ Domain/consumer** |
| **User Web (App Shell)** | Presentation (User Web) | API payload (rendered DTO) | Bell / panel UI | Tự compose notification · `renderTpl` · `pushReferralSignup` · localStorage là SoT inbox |

### 2.1 Mapping module → stage (implementation D2)

| Stage | Module / file (target) |
|-------|-------------------------|
| Domain Event | `auth.service` · `fn-subscriber` (thin) · `loyalty-*` hooks · future domain services |
| Dispatcher | `dispatcher.js` — **pure orchestrator only** · delegates to services below |
| Template Resolver | `template.service.js` · DB `notification_templates` |
| Variable Resolver | `template.service.js` `renderTemplateString` · `variable-alias.js` (legacy compat only) |
| Preference Engine | `preference.service.js` (new) · migration 038 |
| Delivery Channel | `delivery-channel.js` → `sendInApp()` → `inbox.service.js` — **chỉ `dispatcher.js` được import** |
| User Web | `inapp-notifications.js` read API · App Shell bell — **no compose** |

### 2.2 Vi phạm hiện tại (D0 evidence → phải fix Phase D)

| Stage | Vi phạm | File hiện tại |
|-------|---------|---------------|
| Domain Event | Client tự notify thay vì backend request | `loyalty-affiliate-store.js` → `pushReferralSignup` |
| Template + Variable + Delivery | Domain ghi inbox + hardcode copy | `fn-subscriber.js` → **6×** `inbox.pushToUser` + hardcoded strings |
| User Web | Client render template + compose inbox | `inapp-notifications.js` · `system-notification-templates-store.js` |
| Preference Engine | Chưa tồn tại — mọi notify de facto ON | — |

### 2.3 Drift gate (D4 grep — FAIL nếu)

| Forbidden pattern | Scope |
|-------------------|--------|
| Domain `inbox.pushToUser` outside Platform module | Consumer slices migrated |
| Domain/consumer `require('./delivery-channel')` | **Chỉ `dispatcher.js`** (OD-D14) |
| `if (typeCode === 'AFFILIATE_…')` trong `dispatcher.js` | Business rule trong orchestrator (OD-D10) |
| `IfluxSystemNotificationTemplates.render` production path | User Web · Affiliate |
| Pre-rendered title/body passed from Domain to inbox | Any consumer |
| `pushReferralSignup` · hardcode `'Referral mới'` | Affiliate slice |
| User Web adds merge tag / variable ngoài API DTO | App Shell |

**Verdict matrix:** Khóa tại D0 · enforce tại D3 Cleanup + D4 Architecture Verification.

---

## 3. Platform core — inventory

### 3.1 Dispatcher (`dispatcher.js`)

| Item | Status |
|------|--------|
| `loadTemplate()` | ✅ · blocks smoke |
| `dispatch()` | ❌ throws · Phase D |
| `preview()` | ✅ delegates template.service |
| Rule engine (enabled · preference · dedupe) | ❌ chưa có |
| Render → `inbox.pushToUser` | ❌ chưa có |

### 3.2 Inbox (`inbox.service.js` + `notifications.routes.js`)

| Item | Status |
|------|--------|
| `user_inbox_notifications` table | ✅ (existing) |
| `pushToUser` + dedupe | ✅ internal |
| User API `GET /notifications` · summary · read | ✅ backend |
| User Web bell đọc API | ⚠️ **Chưa wire** — `inapp-notifications.js` = localStorage primary |

### 3.3 Preference

| Item | Status |
|------|--------|
| `preference_bucket` on Type seed | ✅ seeded (5 buckets) |
| `user_notification_preferences` table | ❌ chưa migration |
| Preference API | ❌ |
| UI Quyền riêng tư switches | ❌ — `profile-privacy-page.js` chỉ profile visibility |

### 3.4 User Web legacy SoT

| File | Role | Loaded by |
|------|------|-----------|
| `User_Web/.../system-notification-catalog.js` | CASES + MERGE_TAGS | account/checkout/messages boot |
| `User_Web/.../system-notification-templates-store.js` | localStorage template + client render | same |
| `User_Web/.../inapp-notifications.js` | localStorage inbox + `pushReferralSignup` + `renderTpl` | runtime boots |

Admin catalog đã retired Phase C · User Web **chưa**.

---

## 4. Consumer slice — Affiliate

### 4.1 Current path

```text
loyalty-affiliate-store.applyReferralFromServer()
  → IfluxInAppNotifications.pushReferralSignup(referrerId, …)   // client only
       → IfluxSystemNotificationTemplates.render('USER_AFF_REFERRAL', vars)
       → fallback hardcode title 'Referral mới'
       → localStorage inbox push
```

**Chỉ 1 upline (referrer trực tiếp)** — chưa F0/F1/F2 walk.

### 4.2 Platform target

| Item | Target |
|------|--------|
| Type | `AFFILIATE_REFERRAL_SUCCESS` (NOTIF-USER-007) · seeded ✅ |
| Trigger | Backend signup success · sau `referred_by` gắn |
| Recipients | Uplines F0/F1/F2 (max 3) · preference `affiliate_notifications` |
| Hook location | `auth.service` — `verifyEmailOtp` → `createUserFromPending` · OAuth create user |
| Client | **Retire** `pushReferralSignup` production path |

### 4.3 Backend signup hook

| Flow | File | Hook point |
|------|------|------------|
| Email register | `auth.service.js` | `verifyEmailOtp` L329 `createUserFromPending` |
| OAuth register | `auth.service.js` | `findOrCreateOAuthUser` (~L530+) |
| `referred_by` | Set at INSERT | ✅ `resolveReferrer(referral_code)` |

**Gap:** Không có backend emit sau user created · client store tự notify.

### 4.4 Upline chain

| Source | F0/F1/F2 |
|--------|----------|
| Client `loyalty-affiliate-store.resolveUplines` | ✅ walk `readParents()` max 3 |
| Backend upline service | ❌ cần **reuse/create** — walk `users.referred_by` |

---

## 5. Consumer slice — FN-001

### 5.1 Current

| Event | templateCode hardcoded | Title/body |
|-------|------------------------|------------|
| `COMMUNITY_POST_PUBLISHED` (followers) | `USER_COMM_POST` | Hardcode strings |
| Same (watchlist tickers) | `USER_WL_TAGGED_POST` | Hardcode |
| `COMMUNITY_POST_SHARED` | `USER_FOLLOW_SHARE` | Hardcode |
| `ENTITY_COMMENT_CREATED` (reply) | `USER_IX_COMMENT_REPLY` | Hardcode |
| Same (root on entity) | `USER_FOLLOW_ENTITY_COMMENT` | Hardcode |
| `COMMENT_LIKED` | `USER_IX_COMMENT_LIKED` | Hardcode |

**Pattern:** `inbox.pushToUser` trực tiếp — vi phạm 03-Boundary-Audit · 06 §3.8.

### 5.2 Seed type mapping

| fn-subscriber legacy code | Platform `type_code` (seed) |
|---------------------------|----------------------------|
| `USER_COMM_POST` | `COMMUNITY_POST_FROM_FOLLOWING` |
| `USER_WL_TAGGED_POST` | `FOLLOW_ENTITY_TAGGED_POST` |
| `USER_FOLLOW_SHARE` | `FOLLOW_USER_SHARE` |
| `USER_FOLLOW_ENTITY_COMMENT` | `FOLLOW_ENTITY_COMMENT` |
| `USER_IX_COMMENT_REPLY` | `INTERACTION_COMMENT_REPLY` |
| `USER_IX_COMMENT_LIKED` | `INTERACTION_COMMENT_LIKED` |

### 5.3 Proof case đề xuất (D1)

Migrate **1 handler** trước — **`onPostPublished` follower branch only**:

- Type: `COMMUNITY_POST_FROM_FOLLOWING`
- Bucket: `community_notifications`
- Xóa hardcode branch tương ứng · giữ watchlist branch Phase D slice sau

*Lý do:* 1 event · 1 type · bus đã wired · dễ regression.

---

## 6. Impact Analysis summary

| Feature | Current owner | Files | Decision |
|---------|---------------|-------|----------|
| Dispatch pipeline | Platform skeleton | `dispatcher.js` | **Modify** — full implement |
| Preference storage | None | new migration + service | **Create** |
| Preference UI | Profile privacy (local) | `profile-privacy-page.js` | **Modify** — add bucket section |
| Affiliate notify | Client store | `loyalty-affiliate-store.js`, `inapp-notifications.js` | **Migrate** → backend dispatch |
| Signup hook | auth | `auth.service.js` | **Modify** — emit after create |
| FN subscriber | Platform (wrong pattern) | `fn-subscriber.js` | **Modify** 1 case → dispatch |
| User inbox read | Split local/API | `inapp-notifications.js`, `notifications.routes.js` | **Modify** — wire API for dispatched items |
| User catalog/templates | Client legacy | `system-notification-catalog.js`, `templates-store.js` | **Retire** when no consumer uses render |
| Developer Guide | None | `10-Developer-Guide-Add-Consumer.md` | **Create** |

---

## 7. Retire list (D cleanup gate)

### Affiliate slice — không PASS nếu còn:

- [ ] `IfluxInAppNotifications.pushReferralSignup` production path
- [ ] `IfluxSystemNotificationTemplates.render('USER_AFF_REFERRAL'…)` production
- [ ] Hardcode `'Referral mới'` fallback @ referral
- [ ] Affiliate module gọi `inbox.pushToUser` trực tiếp

### FN-001 proof slice:

- [ ] Hardcoded title/body cho case migrated (`COMMUNITY_POST_FROM_FOLLOWING`)
- [ ] `inbox.pushToUser` trong branch migrated

### User Web (incremental / full — Owner D1):

- [ ] `system-notification-catalog.js` load path (khi không còn renderTpl consumer)
- [ ] `system-notification-templates-store.js` production render

---

## 8. Architecture Drift Audit (D0)

| Check | D0 status | Matrix §2 stage |
|-------|-----------|-------------------|
| Client template SoT | ❌ User Web vẫn renderTpl | Variable + User Web |
| Direct inbox bypass | ❌ fn-subscriber | Delivery Channel |
| Dual dispatch risk | ⚠️ Affiliate client + future server | Domain Event |
| Dispatcher unimplemented | ❌ expected — Phase D scope | Dispatcher |
| Admin path | ✅ DB only (Phase C) | Template Resolver (Admin PATCH separate) |
| Runtime Ownership Matrix | ✅ **LOCKED §2** | — |

**Verdict:** D0 PASS — đủ evidence mở D1.

---

## 9. Risks

| Risk | Mitigation |
|------|------------|
| Double-send Affiliate | Retire client path trong cùng slice backend |
| User bell không thấy server notification | Wire `inapp-notifications` đọc GET `/notifications` |
| fn-subscriber partial migrate | 1 case proof · delete old branch · không dual path |
| Preference localStorage conflict | Server SoT · migrate UI save to API |
| Scope creep (all 6 fn handlers) | Plan: proof 1 · remaining = follow-on slices |
| Boundary violation mid-D | **§2 Runtime Ownership Matrix** — D4 grep gate |

---

## 10. Exit D0 → D1

```text
D0 PASS ✅ → D1 Solution Proposal + Owner Decision (single file)
```

### Owner sign-off D0

| | Owner |
|---|-------|
| ✅ **D0 PASS** — Runtime Ownership Matrix approved | 2026-07-28 |

Deliverable tiếp: [`PhaseD-D1-Solution-And-Owner-Decision.md`](PhaseD-D1-Solution-And-Owner-Decision.md)

---

*Phase D D0 — Discovery Audit — Owner sign-off 2026-07-28.*
