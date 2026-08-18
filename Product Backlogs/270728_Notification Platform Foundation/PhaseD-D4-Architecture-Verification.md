# Phase D — D4 Architecture Verification (+ Exit Report)

**Date:** 2026-07-28  
**Phase:** D4 — Architecture Verification  
**Trạng thái:** ✅ **D4 PASS** — **D5 regression authorized**  
**Input:** [`PhaseD-D3-Exit-Evidence.md`](PhaseD-D3-Exit-Evidence.md) ✅

---

## 1. Merge gates — kết quả

| Gate | Tiêu chí PASS | Evidence | Result |
|------|---------------|----------|--------|
| **Gate 1** | `dispatcher.js` × SQL × business `typeCode` branch | grep 2026-07-28 | ✅ |
| **Gate 1b** | Chỉ `dispatcher.js` → `delivery-channel.js` · chỉ delivery → `pushToUser` (OD-D14) | grep 2026-07-28 | ✅ |
| **Gate 2** | Domain × `renderTemplate()` · `renderPreview()` · `renderTpl()` runtime | grep 2026-07-28 | ✅ |
| **Gate 3** | Sau D3: không path `localStorage → Notification SoT` cho migrated types | cutover + grep boot | ✅ |
| **Gate 4** | `CLIENT_LOCAL_TYPES` ownership khóa boundary | §2 + `client-local-notification-types.js` | ✅ |

---

## 2. Gate 4 — CLIENT_LOCAL_TYPES ownership (Owner request 2026-07-28)

### 2.1 Kiến trúc hiện trạng (locked)

```text
Server Notification Platform
       │
       v
Postgres inbox (user_inbox_notifications)
       │
       v
Bell / panel (GET /api/notifications/*)

        +  (tạm — backlog slices)

Legacy client-local allowlist ONLY
       │
       v
localStorage (iflux_inapp_notifications_v1)
       │
       v
Bell fallback CHỈ khi server fail · filter allowlist
```

### 2.2 Ai quyết định type thuộc CLIENT_LOCAL?

| Câu hỏi | Trả lời |
|---------|---------|
| **Owner** | Notification Platform Foundation (Phase D) — không phải feature team tự thêm |
| **SoT file** | `User_Web/iflux-web-ui/client-local-notification-types.js` — **duy nhất** |
| **Quy trình thêm** | Owner + Impact Analysis (CG-030) · chỉ khi **chưa** có server consumer |
| **Quy trình xóa** | Server consumer PASS → **xóa** khỏi allowlist · không dual path |
| **Runtime guard** | `assertClientLocalWrite()` trong `inapp-notifications.push()` — block migrated + non-allowlist |

### 2.3 Allowlist hiện tại (2026-07-28)

| Client key | Owner slice | Server type (target) | Xóa khi |
|------------|-------------|----------------------|---------|
| `subscription_order` | Orders backlog | TBD | Orders dispatch PASS |
| `affiliate_commission` | Affiliate commission backlog | `AFFILIATE_COMMISSION_EARNED` | Commission dispatch PASS |
| `alert_triggered` | Alert backlog | TBD | Alert dispatch PASS |
| `community_message` | DM backlog | TBD | Messages dispatch PASS |

### 2.4 Denylist — migrated / retired (cấm ghi localStorage)

**Platform type_code (server):**  
`AFFILIATE_REFERRAL_SUCCESS` · `COMMUNITY_POST_FROM_FOLLOWING` · `FOLLOW_ENTITY_TAGGED_POST` · `FOLLOW_USER_SHARE` · `INTERACTION_COMMENT_REPLY` · `FOLLOW_ENTITY_COMMENT` · `INTERACTION_COMMENT_LIKED`

**Legacy client keys retired:**  
`referral_signup` · `community_post`

### 2.5 Gate 4 PASS / FAIL

| | |
|---|---|
| **PASS** | Explicit allowlist · documented owner · migrated type blocked · sole SoT file |
| **FAIL** | Thêm notification mới chỉ vào array client / inline object ngoài SoT file |

```bash
# Gate 4 grep — allowlist chỉ ở SoT file
rg 'CLIENT_LOCAL_TYPES\s*=' User_Web
→ (no matches)

rg 'CLIENT_LOCAL_ALLOWLIST' User_Web
→ client-local-notification-types.js only
```

---

## 3. Catalog — Runtime retired vs Source retired

| File | Runtime consumer | Source status | Action |
|------|------------------|---------------|--------|
| `User_Web/.../system-notification-catalog.js` | **0** (boot × load) | **Deprecated artifact** | Deletion scheduled post-D5 |
| `User_Web/.../system-notification-templates-store.js` | **0** | **Deprecated artifact** | Deletion scheduled post-D5 |
| `Admin_Design_system/.../system-notification-catalog.js` | Admin CASES stub Phase C | Reference/seed only | Separate Admin retire track |

**Phân biệt bắt buộc:**

| | D3 đạt | D4 ghi nhận |
|---|--------|-------------|
| **Runtime retired** | ✅ | grep boot = 0 import |
| **Source retired** | ⏳ post-D5 | Header DEPRECATED + registry §3 · chưa xóa file (CG-020 migration reference) |

**Cấm:** import lại catalog/templates vào boot script sau D3 — Gate 2 + Gate 3 FAIL nếu vi phạm.

---

## 4. Grep snapshot (2026-07-28)

```bash
# Gate 1
rg 'connection|\.query\(|pushToUser' backend/src/modules/notifications/dispatcher.js
→ (no matches)

# Gate 1b
rg 'pushToUser' backend/src
→ inbox.service.js (definition)
→ delivery-channel.js (caller)

rg 'delivery-channel' backend/src
→ dispatcher.js (import)
→ delivery-channel.js

# Gate 2
rg 'function renderTpl|renderTpl\(|pushReferralSignup|pushCommunityPost' User_Web
→ (no runtime matches)

# Gate 3
rg 'system-notification-catalog|system-notification-templates' User_Web/iflux-web-ui/runtime User_Web/iflux-web-ui/widgets User_Web/iflux-web-ui/iflux-web-ui.js
→ (no matches)
```

---

## 5. Files changed (D4 boundary lock)

**User Web (new):** `client-local-notification-types.js`  
**User Web (modified):** `inapp-notifications.js` · boot scripts · `iflux-web-ui.js` · catalog/templates deprecation headers

---

## 6. Exit statement

```text
D4 PASS (2026-07-28)
  → D5 Production regression authorized
  → Double-send cases mandatory (§ PhaseD-D5-Regression-Checklist.md)
```

**Known follow-on (không block D4):** Source delete catalog JS post-D5 · migrate 4 CLIENT_LOCAL types khi consumer slices ship.

**D1-rev (2026-07-28):** Preference model đổi bucket → type-level — [`PhaseD-D1-rev-Preference-Model-Owner-Decision.md`](PhaseD-D1-rev-Preference-Model-Owner-Decision.md). D4 dispatcher/delivery gates **vẫn PASS** · D5 **BLOCKED** pending D1-rev.

---

*Phase D D4 Architecture Verification — 2026-07-28.*
