# Phase D — D3 Exit Evidence (Cleanup)

**Date:** 2026-07-28  
**Phase:** D3 — Cleanup  
**Trạng thái:** ✅ **D3 PASS** — sẵn sàng **D4/D5**  
**Input:** [`PhaseD-D2-Exit-Evidence.md`](PhaseD-D2-Exit-Evidence.md) ✅

---

## 1. D3 checklist — kết quả

| # | Hạng mục | Evidence | Result |
|---|----------|----------|--------|
| 1 | Xóa `pushReferralSignup` | `rg pushReferralSignup User_Web` → 0 | ✅ |
| 2 | Xóa `pushCommunityPost` client compose | `community-store.js` × call · `rg pushCommunityPost User_Web` → 0 | ✅ |
| 3 | fn-subscriber → dispatcher (all branches) | `fn-subscriber.js` × `inbox.pushToUser` | ✅ |
| 4 | Gate 1b — pushToUser ownership | Chỉ `delivery-channel.js` + `inbox.service.js` | ✅ |
| 5 | Gate 3 — inbox cutover migrated types | Bell/panel = API · localStorage = `CLIENT_LOCAL_TYPES` only | ✅ |
| 6 | Catalog / renderTpl zero production consumer | Boot scripts × catalog/templates · `rg renderTpl User_Web` → 0 | ✅ |

---

## 2. fn-subscriber — full dispatcher migration

| Event branch | Type code | Status |
|--------------|-----------|--------|
| Follower @ post | `COMMUNITY_POST_FROM_FOLLOWING` | ✅ D2 |
| Watchlist ticker tag | `FOLLOW_ENTITY_TAGGED_POST` | ✅ D3 |
| Post shared | `FOLLOW_USER_SHARE` | ✅ D3 |
| Comment reply | `INTERACTION_COMMENT_REPLY` | ✅ D3 |
| Entity comment followers | `FOLLOW_ENTITY_COMMENT` | ✅ D3 |
| Comment liked | `INTERACTION_COMMENT_LIKED` | ✅ D3 |

**Không còn** hardcode title/body trong `fn-subscriber.js`.

---

## 3. Client cleanup

### Retired (production)

- `pushReferralSignup` — deleted
- `pushCommunityPost` — deleted
- `renderTpl()` — deleted
- `system-notification-catalog.js` — **không load** boot production
- `system-notification-templates-store.js` — **không load** boot production

### Client-local only (chưa có server consumer — follow-on slice)

| Type | Function | Ghi chú |
|------|----------|---------|
| `subscription_order` | `pushOrderStatus` | Orders slice sau |
| `affiliate_commission` | `pushAffiliateCommission` | Affiliate commission slice sau |
| `alert_triggered` | `pushAlertTriggered` | Alert slice sau |
| `community_message` | `pushCommunityMessage` | Messages slice sau |

Copy inline fallback — **không** qua catalog client.

---

## 4. Inbox SoT cutover (Gate 3 + Gate 4)

```text
Platform-dispatched notifications
  → PostgreSQL user_inbox_notifications
  → GET /api/notifications/summary | GET /api/notifications
  → Bell badge + panel

Client-local allowlist ONLY (temporary backlog)
  → SoT: client-local-notification-types.js
  → localStorage · assertClientLocalWrite() guard
  → merge không ghi đè server SoT
```

`listForUser()` chỉ đọc local cho allowlist — migrated types blocked at write. Chi tiết Gate 4: [`PhaseD-D4-Architecture-Verification.md`](PhaseD-D4-Architecture-Verification.md) §2.

**D5 bắt buộc:** double-send R3 (Affiliate signup) · R4 (Community follower post) — [`PhaseD-D5-Regression-Checklist.md`](PhaseD-D5-Regression-Checklist.md).

---

## 5. Grep snapshot (2026-07-28)

```bash
# Gate 1b
rg pushToUser backend/src
→ inbox.service.js (definition)
→ delivery-channel.js (caller)

# Client compose retired
rg 'pushReferralSignup|pushCommunityPost|renderTpl' User_Web
→ (no matches)

# Catalog boot
rg 'system-notification-catalog|system-notification-templates' User_Web
→ (no matches — files tồn tại repo, không load runtime)
```

---

## 6. Files changed (D3)

**Backend:** `fn-subscriber.js`

**User Web:** `inapp-notifications.js` · `community-store.js` · `account-feature-boot.js` · `checkout-feature-boot.js` · `widgets/messages-page/index.js`

---

## 7. Exit statement

```text
D3 PASS (2026-07-28)
  → D4 Architecture Verification authorized
  → D5 Production regression authorized
```

**Known follow-on (không block D3):** Orders · Commission · Alert · DM server consumers — client-local tạm thời.

---

*Phase D D3 Exit Evidence — 2026-07-28.*
