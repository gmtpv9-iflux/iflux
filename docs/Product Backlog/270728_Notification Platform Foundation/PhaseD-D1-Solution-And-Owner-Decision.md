# Phase D — D1 Solution Proposal + Owner Decision

**Date:** 2026-07-28 (rev Owner architecture review · D1 sign-off)  
**Phase:** D — Consumer Integration  
**Trạng thái:** ✅ **D1 PASS — Owner sign-off 2026-07-28** · **D2 authorized**  
**Input:** [`PhaseD-D0-Discovery-Audit.md`](PhaseD-D0-Discovery-Audit.md) ✅ Owner sign-off · Phase C PASS

> **Workflow Phase D:** D0 ✅ → **D1 ✅ (file này)** → **D2 Implementation authorized**

---

## Phần A — Solution Proposal (Agent)

### A.1 Tóm tắt hướng xử lý

```text
Platform core (D2.1–D2.2)
  → Pure Orchestrator Dispatcher + Preference + Delivery interface
        ↓
Affiliate consumer (D2.3)
  → auth.service hook · **F0 only** (Phase D proof) · retire client path
        ↓
FN-001 proof (D2.4)
  → COMMUNITY_POST_FROM_FOLLOWING only
        ↓
Developer Guide (D2.5) + D3 Cleanup (inbox cutover) + D4/D5
        ↓
Platform PASS
        ↓
Affiliate Enhancement — F1/F2 recipient resolution (follow-up · task 270727)
```

**Runtime gate:** [`PhaseD-D0-Discovery-Audit.md`](PhaseD-D0-Discovery-Audit.md) **§2 Runtime Ownership Matrix (LOCKED)**.

---

### A.2 Domain Event Contract (LOCKED — OD-D12)

`NotificationDispatcher.dispatch()` nhận **một contract cố định** — Domain chỉ gọi signature này; mở rộng sau qua `metadata`, không đổi signature.

```typescript
// Contract v1 — stable
{
  typeCode: string,           // required · Platform Type API contract
  recipientUserId: uuid,      // required
  variables: object,          // required · keys ⊆ Type.variables[] contract
  dedupeKey?: string,         // optional · idempotent delivery
  href?: string,              // optional · deep link inbox item
  icon?: string,              // optional · override Type.icon
  metadata?: object,          // optional · audit · analytics · future email/push context
  channels?: ['in_app']       // v1: ignored except in_app
}
```

**Quy tắc:**

| Rule | Ghi chú |
|------|---------|
| Domain **không** truyền pre-rendered `title`/`body` | Platform render |
| `metadata` opaque cho Platform — Domain không parse | Future-proof |
| Mở rộng field mới → chỉ thêm optional · không breaking | |

---

### A.3 Notification Type = API Contract (LOCKED — OD-D13)

`type_code` (vd. `AFFILIATE_REFERRAL_SUCCESS`) là **contract bất biến** giữa Domain · Platform · Admin · User:

| Cấm | Thay vào |
|-----|----------|
| Rename `type_code` | `deprecated` + Type mới |
| Reuse `type_code` cho nghĩa khác | Type mới |
| Đổi `variables[]` contract in-place | Type mới + migrate consumer |
| Sửa seed để “đổi nghĩa” type cũ | Deprecate row · seed type mới |

Admin chỉ sửa **copy** (title/body template) — không đổi contract Type (08 §5 · Phase C OD-C7).

Validate script (Phase C) enforce placeholder ⊆ variables — giữ cho mọi Type mới.

---

### A.4 Dispatcher — Pure Orchestrator (LOCKED — OD-D10)

**Dispatcher = orchestration only.** Không God Object · không SQL trực tiếp.

```text
dispatcher.dispatch(request)
    │
    ├─► templateService.getTypeByCode(typeCode)
    ├─► preferenceService.canDeliver(userId, type.preference_bucket)
    ├─► renderer.render(type, template, variables)   // immutable resolve
    └─► deliveryChannel.sendInApp({ recipient, title, body, href, icon, dedupeKey, metadata })
```

| Dispatcher **được** | Dispatcher **cấm** |
|---------------------|-------------------|
| Gọi service methods | `query()` / SQL trực tiếp |
| Validate request shape | Biết schema `notification_templates` |
| Orchestrate pipeline order | Biết schema `user_inbox_notifications` |
| Map errors → AppError | Business logic (commission · upline walk) |

**Upline walk · recipient resolution = Domain** (auth hook / fn-subscriber thin) — **không** nằm trong Dispatcher.

**Files (D2.1):**

| Module | Responsibility |
|--------|----------------|
| `dispatcher.js` | Orchestrator only |
| `template.service.js` | Type + template DB |
| `preference.service.js` | Preference DB |
| `renderer.js` (hoặc export từ template.service) | Variable resolve + render string |
| `delivery-channel.js` | Channel interface |

---

### A.5 Variable Resolver + Renderer (LOCKED — OD-D11)

**Renderer** (`renderer.js` hoặc export từ `template.service.js`):

| Renderer **được** | Renderer **cấm** |
|-------------------|------------------|
| Nhận `(templateTitle, templateBody, resolvedVars)` | `query()` / SQL / đọc DB |
| Substitute `{key}` · alias legacy trên **copy** | Biết nghĩa business type (`AFFILIATE_*`, `COMMUNITY_*`) |
| Pure function · deterministic output | Import Domain module · side-effect |

```text
Input variables (Domain)
        │
        ▼
   shallow copy  →  resolvedVars = { ...variables }
        │
        ▼
   alias map (legacy compat · read-only)
        │
        ▼
   render(title, body, resolvedVars)   // no DB · no typeCode branch
```

| Cấm | Đúng |
|-----|------|
| Mutate `variables` object gốc | `const resolvedVars = Object.assign({}, variables)` |
| `vars.actor_name = …` in-place | Merge alias vào **copy** mới |
| Domain object bị side-effect | Renderer pure function |

`variable-alias.js` = legacy compat only (Phase C OD-C8) — không thêm business alias mới.

---

### A.6 Delivery Channel — Interface (LOCKED — OD-D11)

**Create** `delivery-channel.js`:

```javascript
// v1
async function sendInApp({ recipientUserId, title, body, href, icon, dedupeKey, templateCode, metadata }) {
  return inboxService.pushToUser(recipientUserId, { ... });
}

// v2+ (stub — không implement Phase D)
// async function sendEmail(...) { skip v1 }
// async function sendPush(...) { skip v1 }
```

| Rule | Ghi chú |
|------|---------|
| **Chỉ `dispatcher.js`** import / gọi `delivery-channel.js` (OD-D14) | Domain · consumer · `fn-subscriber` **cấm** |
| Dispatcher gọi `deliveryChannel.sendInApp()` | Không gọi `inbox.pushToUser` trực tiếp |
| `pushToUser` = internal inbox.service | **Chỉ** Delivery Channel import |
| Thêm email/push sau | Implement adapter · **Dispatcher không đổi** |

---

### A.7 Platform core — Preference

Migration `038_user_notification_preferences.sql` · `preference.service.js`:

- `canDeliver(userId, preferenceBucket)` → boolean (default `true` if no row)
- API: `GET/PATCH /users/me/notification-preferences`
- UI: Quyền riêng tư — section「Thông báo theo nhóm」· server save

Buckets v1: `affiliate_notifications` · `community_notifications` · `follow_notifications` · `alert_notifications` · `system_notifications`

---

### A.8 User Web inbox — Incremental + bắt buộc cutover (OD-D4 rev)

**Không** để trạng thái incremental vô thời hạn.

```text
D2 (migration window)
  → Migrated types: server inbox only · client không push
  → Unmigrated types: localStorage tạm (orders · commission…)

D3 Cleanup (PASS gate)
  → Bell đọc GET /api/notifications là primary
  → Retire client compose paths (pushReferralSignup · renderTpl production)
  → Retire localStorage inbox SoT cho migrated flows
  → Grep: no dual inbox merge/sync path
```

| D3 FAIL nếu | |
|-------------|---|
| `pushReferralSignup` còn production | Affiliate slice |
| Client + server cùng ghi 1 event type | Dual dispatch |
| localStorage inbox là SoT cho dispatched types | Cutover chưa xong |

---

### A.9 Consumer — Affiliate (Phase D: F0 only — OD-D3)

**Hook:** `auth.service` sau user create (email verify + OAuth) — **không Event Bus** (OD-D2 ✅ Owner).

**Phase D proof scope (F0 only):**

1. Resolve **F0 upline only** (direct referrer) — **Domain helper**, không Dispatcher
2. `dispatch({ typeCode: 'AFFILIATE_REFERRAL_SUCCESS', recipientUserId: f0UserId, … })`
3. D3: retire `pushReferralSignup` · hardcode `'Referral mới'`

**Out of scope Phase D (follow-up sau Platform PASS):**

- F1/F2 upline traversal · dedupe chain · regression multi-recipient
- Deliverable: **Affiliate Enhancement** (task 270727) — sau khi D4/D5 PASS

Pipeline vẫn được chứng minh đủ qua F0:

```text
Signup → dispatch → preference → template → delivery → inbox
```

---

### A.10 Consumer — FN-001 proof (1 case)

`onPostPublished` **follower branch only** → `COMMUNITY_POST_FROM_FOLLOWING` (OD-D5 ✅ Owner).

Delete hardcode branch · không dual path · watchlist branch = follow-on slice.

---

### A.11 Developer Guide + slices

| Slice | Deliverable |
|-------|-------------|
| D2.1 | 038 · preference · renderer extract · delivery-channel · dispatcher orchestrator |
| D2.2 | Preference UI · inbox API wire |
| D2.3 | Affiliate auth hook + retire client |
| D2.4 | FN proof 1 case |
| D2.5 | `10-Developer-Guide-Add-Consumer.md` |
| D3 | **Inbox cutover** · catalog retire · grep matrix §2 |
| D4/D5 | Verify + Production |

### A.12 D2.1 slice exit — PASS criteria (grep-enforceable)

D2.1 **không PASS** chỉ vì `dispatch()` không còn throw. Bắt buộc:

| # | PASS khi |
|---|----------|
| 1 | `dispatcher.js` × import `connection` / `query` / `db` |
| 2 | `dispatcher.js` **không** chứa `if (typeCode === …)` business branch |
| 3 | `dispatcher.js` **không** gọi `inbox.pushToUser` trực tiếp |
| 4 | `delivery-channel.js` là **owner duy nhất** (ngoài `inbox.service.js`) gọi `pushToUser` |
| 5 | Chỉ `dispatcher.js` import `delivery-channel.js` (OD-D14) |
| 6 | Renderer pure — không query DB · không branch theo type business |
| 7 | `preference.service.canDeliver(userId, bucket)` — **không** nhận `typeCode` · không biết consumer |
| 8 | Xóa re-export smell: `dispatcher.js` không re-export `renderTemplateString` (chỉ `template.service` / admin preview) |

*Checklist này = operationalization Gate 1 (D4) tại slice D2.1 — tránh “chạy được” nhưng vi phạm ownership.*

---

## Phần B — Owner Decision

> ✅ **Owner sign-off 2026-07-28** — D2 Implementation authorized.

---

### Đã chốt (Owner review 2026-07-28)

| ID | Quyết định | Owner |
|----|------------|-------|
| **D0** | Discovery Audit PASS · Runtime Ownership Matrix | ✅ 2026-07-28 |
| **OD-D2** | Affiliate hook = `auth.service` · **không Event Bus** | ✅ Option A |
| **OD-D5** | FN proof = `COMMUNITY_POST_FROM_FOLLOWING` only | ✅ Option A |
| **OD-D10** | Dispatcher Pure Orchestrator · no direct SQL | ✅ LOCKED |
| **OD-D11** | Variable immutable · Delivery `sendInApp()` interface | ✅ LOCKED |
| **OD-D12** | Domain Event Contract (signature + metadata) | ✅ LOCKED |
| **OD-D13** | Type `type_code` = API contract · no rename/reuse | ✅ LOCKED |
| **OD-D4 rev** | Incremental **chỉ trong D2** · D3 **bắt buộc** cutover client inbox | ✅ LOCKED |
| **OD-D14** | Chỉ `dispatcher.js` gọi `delivery-channel.js` · consumer/Domain **cấm** import | ✅ LOCKED (post-review D1) |

---

### Owner sign-off D1 (2026-07-28)

| ID | Quyết định | Owner |
|----|------------|-------|
| **OD-D0** | Approve Solution Proposal Phần A + khóa OD-D10–13 | ✅ **APPROVE** |
| **OD-D1** | Thứ tự slice D2.1 → D2.2 → D2.3 → D2.4 → D2.5 → D3 → D4/D5 | ✅ **APPROVE** |
| **OD-D3** | **F0 only** cho Phase D proof · F1/F2 = follow-up sau Platform PASS | ✅ **REVISED** (không F0/F1/F2) |
| **OD-D6** | Standalone `/users/me/notification-preferences` · không gộp Profile API | ✅ **APPROVE** |
| **OD-D7** | Retire catalog/paths khi **zero production consumer + grep PASS + delete** — không retire chỉ vì "đến D3" | ✅ **APPROVE** (có điều kiện) |
| **OD-D8** | Production regression **bắt buộc** D5 — template mới only · preference OFF no inbox · no double-send | ✅ **APPROVE** |
| **OD-D9** | Affiliate slice = deliverable task 270727 · không cần PR tách nếu cùng release | ✅ **APPROVE** |

**Ghi chú Owner OD-D3:**

```text
Phase D Proof = F0 only
        ↓
Platform PASS (D4/D5)
        ↓
Affiliate Enhancement — F1/F2 sau
```

Lý do: D2 xây Platform, không mở rộng Affiliate Engine; F1/F2 khó tách lỗi Platform vs Affiliate chain.

---

### ~~Còn cần Owner sign-off~~ (archived — đã chốt)

<details>
<summary>Checkbox gốc (reference)</summary>

### OD-D0 · Approve Solution Proposal (Phần A + khóa OD-D10–13)

| | Owner |
|---|-------|
| ☑ **APPROVE D1** — authorize D2 Implementation | ✅ |
| □ **REJECT** — ghi chú: | |

### OD-D1 · Thứ tự slice

| Option | Owner chốt |
|--------|------------|
| **A (đề xuất)** D2.1 → D2.2 → D2.3 → D2.4 → D2.5 → D3 → D4/D5 | ☑ |
| B — Khác: | |

### OD-D3 · Upline F0/F1/F2 @ signup

| | Owner |
|---|-------|
| □ **APPROVE** max 3 uplines · dedupe per pair | |
| ☑ **Chỉ F0** (Phase D) · F1/F2 follow-up | ✅ |

### OD-D6 · Preference API shape

| Option | Owner chốt |
|--------|------------|
| **A (đề xuất)** Standalone `/users/me/notification-preferences` | ☑ |
| B Gộp profile/privacy endpoint | |

### OD-D7 · Catalog retire timing

| Option | Owner chốt |
|--------|------------|
| **A (rev)** Zero consumer → grep PASS → delete | ☑ |
| B Xóa toàn bộ catalog Phase D | |

### OD-D8 · Production tests (D5)

| Test | Required | Owner |
|------|----------|-------|
| Affiliate ON → signup → inbox (F0) | ✅ | ☑ |
| Affiliate OFF → no row | ✅ | ☑ |
| Preference multi-device sync | ✅ | ☑ |
| Admin template change → new only | ✅ | ☑ |
| D3: no client inbox dual path | ✅ | ☑ |
| No double-send | ✅ | ☑ |

### OD-D9 · Task 270727 coupling

| | Owner |
|---|-------|
| ☑ Affiliate slice = deliverable 270727 · cùng release OK | ✅ |
| □ Tách PR — note: | |

</details>

## Phần C — Architecture locks + D4 merge gates (D2 enforce)

```text
OD-D10  Dispatcher orchestrator only — no SQL
OD-D11  resolvedVars immutable · deliveryChannel.sendInApp()
OD-D12  dispatch({ typeCode, recipientUserId, variables, dedupeKey, href, icon, metadata })
OD-D13  type_code immutable API contract
OD-D14  delivery-channel.js — caller = dispatcher only
OD-D4   Incremental → D3 cutover mandatory
```

### D4 merge gates (Owner 2026-07-28 — bắt buộc trước merge D2)

**Gate 1 — Dispatcher isolation**

```text
dispatcher.js  ×  connection  ×  query  ×  db   → PASS
dispatcher.js  ×  if (typeCode === '…') business branch   → PASS
```

**Gate 1b — Delivery caller isolation (OD-D14)**

```text
delivery-channel.js  ←  chỉ dispatcher.js import
pushToUser             ←  chỉ delivery-channel.js (+ inbox.service internal)
```

**Gate 2 — Render ownership**

Không module Domain nào được gọi `renderTemplate()` · `renderPreview()` · `renderTpl()` ngoài Platform module.

**Gate 3 — Inbox SoT cutover (sau D3)**

Không còn production path:

```text
localStorage  →  Notification SoT
```

sau D3 cutover — grep PASS bắt buộc.

---

## Phần D — Exit D1

```text
✅ Owner sign-off OD-D0…OD-D9 (2026-07-28) → D2 authorized
```

**Điều chỉnh so với proposal ban đầu:**

| Item | Proposal | Owner chốt |
|------|----------|------------|
| OD-D3 | F0/F1/F2 @ signup | **F0 only** Phase D · F1/F2 follow-up |
| OD-D7 | Retire @ D3 grep | **Zero consumer → grep PASS → delete** |
| D4 | Grep dispatcher SQL | **+ Gate 2 render ownership · Gate 3 localStorage SoT** |

---

*Phase D D1 — Owner sign-off 2026-07-28 — D2 authorized.*
