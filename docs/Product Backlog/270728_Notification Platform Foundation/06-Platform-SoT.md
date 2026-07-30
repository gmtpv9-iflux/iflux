# 06 — Platform SoT · Notification Platform Foundation

**Date:** 2026-07-28  
**Status:** ✅ **LOCKED** — Owner Phase A · 2026-07-28  
**Phạm vi:** Product + Architecture contract  
**Plan:** [`09-Plan-Roadmap.md`](09-Plan-Roadmap.md) · **SoT index:** [`07-SoT-Index.md`](07-SoT-Index.md)

**Architecture audits (bắt buộc đọc trước LOCK):**

| # | File |
|---|------|
| 02 | [`02-Ownership-Audit.md`](02-Ownership-Audit.md) |
| 03 | [`03-Boundary-Audit.md`](03-Boundary-Audit.md) |
| 04 | [`04-Variable-Contract-Audit.md`](04-Variable-Contract-Audit.md) |
| 05 | [`05-Runtime-Flow-Audit.md`](05-Runtime-Flow-Audit.md) |

---

## 0. Tuyên bố kiến trúc (LOCKED intent)

> **Notification Platform không thuộc bất kỳ domain nào.**  
> Affiliate · Community · Orders · Membership · Follow — tất cả là **consumers**.

Platform là **capability cross-cutting** (Product Architecture V2). Domain owns business event; Platform owns Type · Template · Dispatch · Inbox · Delivery.

### 0.1 Deployment model — modular monolith (LOCKED v1)

iFlux hiện tại = **modular monolith**: nhiều **module** trong **một backend** · **một DB** · **một deploy** · **một runtime** — **không** phải microservices.

| | Modular monolith (v1) | Microservices (cấm v1) |
|---|----------------------|-------------------------|
| Notification | Module `backend/src/modules/notifications/` | Service riêng + DB riêng |
| Giao tiếp | In-process · event bus nội bộ | Kafka · RabbitMQ · HTTP giữa services |
| Deploy | Cùng backend | Deploy · monitor riêng |

> **Platform v1 implementation:** Notification Platform là **module trong backend hiện hữu**. Tách thành service độc lập trong tương lai **không** đổi contract `NotificationDispatcher.dispatch()` và **không** ảnh hưởng domain consumers.

SoT khóa **interface** (dispatch contract · boundary) — **không** khóa deployment model vĩnh viễn.

---

## 1. Nguyên tắc

| # | Nguyên tắc |
|---|------------|
| P1 | **Platform** là trung tâm — không thiết kế xoay quanh một Notification Type |
| P2 | **Notification Type** = registry entry — **không** chứa business logic |
| P3 | **Template** SoT = **server (DB)** — Admin sửa title/body |
| P4 | **Admin UX giữ nguyên** (ADM-SYS-003) — [`08-Admin-UX-Contract.md`](08-Admin-UX-Contract.md) (editable · Save · Restore · Preview) |
| P5 | Admin **không**「Thêm mẫu」v1 — Developer seed Type + template |
| P6 | Domain **emit** type code — Platform **dispatch** — domain **cấm** render · inbox · template edit |
| P7 | Variable contract — [`04-Variable-Contract-Audit.md`](04-Variable-Contract-Audit.md) |
| P8 | Ownership — [`02-Ownership-Audit.md`](02-Ownership-Audit.md) · Boundary — [`03-Boundary-Audit.md`](03-Boundary-Audit.md) |
| P9 | **Scope guards v1** (§8) — cấm Cursor/agent mở rộng preference center · template history · delivery framework · message queue |

---

## 2. Pipeline runtime (LOCKED)

Chi tiết responsibility matrix: [`05-Runtime-Flow-Audit.md`](05-Runtime-Flow-Audit.md) §2.

```text
Business Event (Domain)
        ↓
Domain: resolve recipients + dispatch(typeCode, variables)  OR  Event → in-process listener (§3.9)
        ↓
Notification Dispatcher          ← Platform module, same backend process
        ↓
Rule Engine (enabled · preference · channel · dedupe)
        ↓
Template Lookup (DB by type + channel)
        ↓
Render (canonical variables → title, body)
        ↓
Delivery — **v1: in_app only** (§8.3)
        ↓
Notification record (inbox)
        ↓
App Shell displays DTO
```

---

## 3. Entity definitions

### 3.1 Notification

| Field | Mô tả |
|-------|--------|
| `id` | UUID |
| `user_id` | Người nhận |
| `type_code` | FK → Notification Type |
| `channel` | Kênh đã deliver |
| `title` | Đã render |
| `body` | Đã render |
| `payload_json` | Snapshot variables (audit) |
| `read_at` | Nullable |
| `created_at` | |

*Map hiện tại:* `user_inbox_notifications` (+ legacy `notifications_json` retire dần).

---

### 3.2 Notification Type

**Registry — Developer registers via seed. Không business logic.**

| Field | Mô tả |
|-------|--------|
| `code` | Stable slug — `AFFILIATE_REFERRAL_SUCCESS` |
| `admin_code` | NOTIF-USER-007 (legacy display) |
| `name` | **Tên mẫu thông báo** — label Admin list · User toggle (D1-rev) |
| `description` | Trigger mô tả (read-only Admin) |
| `category` | `affiliate` \| `community` \| `orders` \| `system` … |
| `variables` | Schema per [`04-Variable-Contract-Audit.md`](04-Variable-Contract-Audit.md) |
| `supported_channels` | `['in_app']` default |
| `group_label` | **Nhóm thông báo** — human group SoT (D6) · Admin filter + User section header |
| `enabled` | Global kill switch |
| `icon` | Optional |

---

### 3.3 Notification Template

| Field | Mô tả |
|-------|--------|
| `type_code` | FK |
| `channel` | `in_app` \| `push` \| `email` |
| `title` | `{canonical_key}` placeholders |
| `body` | |
| `enabled` | |
| `version` | **Optimistic concurrency only** (§8.2) — integer, tăng mỗi Admin PATCH |
| `updated_at` · `updated_by` | |

**Seed synchronization (OD-C6 · LOCKED Phase C):**

Seed execution follows the Owner-approved **anti-drift** strategy — mô tả **quy tắc ownership**, không khóa cú pháp SQL cụ thể:

| Layer | Quy tắc |
|-------|---------|
| **`notification_types`** | Metadata Type được **đồng bộ từ seed definition** mỗi lần chạy seed (name, description, variables, enabled, …). |
| **`notification_templates` — seed-managed** | Chỉ các field do seed sở hữu (`seed_title`, `seed_body`) được cập nhật khi seed thay đổi. |
| **`notification_templates` — Admin-authored** | Nội dung Admin đã lưu (`title`, `body`) **không bao giờ** bị seed ghi đè. |
| **Restore** | 「Khôi phục mặc định」= copy `seed_*` → `title`/`body` — [`08-Admin-UX-Contract.md`](08-Admin-UX-Contract.md) §7 |

**Cấm:** `ON CONFLICT DO NOTHING` im lặng khi seed definition đã đổi → gây drift seed ≠ DB (Phase C guard + validate-before-seed).

**Authoring SoT vs Runtime SoT:** xem §3.10.

---

### 3.4 Notification Channel

| Channel | Registry v1 | Delivery v1 |
|---------|-------------|-------------|
| `in_app` | ✅ | ✅ **Implement** |
| `push` | ✅ (Type có thể khai báo) | ❌ Adapter chưa implement |
| `email` | ✅ | ❌ Adapter chưa implement |

Chi tiết cấm build FCM/APNs/SMTP/queue: §8.3.

---

### 3.5 Notification Preference (D1-rev — product LOCKED pending sign-off)

> **Preference operates at Notification Type level (`type_code`).**  
> Mỗi type có trạng thái ON/OFF **độc lập** — không bật/tắt cả nhóm.

**Quyết định sản phẩm (Owner 2026-07-28):** User có thể tắt từng notification riêng (vd. tắt hoa hồng nhưng vẫn nhận referral).

**`group_label` — Nhóm thông báo (human SoT · D6):**

```text
group_label: "Affiliate"     ← Admin filter + User section header (same string)
    AFFILIATE_REFERRAL_SUCCESS    ON/OFF  ← độc lập
    AFFILIATE_COMMISSION_EARNED   ON/OFF  ← độc lập
```

**Retired D6:** `preference_group` · `GROUP_LABELS` · `bucketForGroup()` — **DELETE**, không adapter.

**Không còn (retire Migration 039):**

```text
affiliate_notifications (ON/OFF)  → chi phối mọi type affiliate   ← RETIRED
```

**Schema (server SoT):**

```text
notification_types
    code
    name                    ← Tên mẫu (Admin/User đối chiếu)
    group_label             ← Nhóm thông báo (human SoT · D6)

user_notification_type_preferences
    user_id
    type_code               FK → notification_types.code
    enabled
    PRIMARY KEY (user_id, type_code)
```

| Field | Role |
|-------|------|
| `user_id` + `type_code` + `enabled` | **Preference SoT** |
| `group_label` on Type | Nhóm thông báo · Admin filter + User section — **không dispatch check** |
| `group_label IS NULL` | Non-configurable · always ON · ẩn User UI (B5) |

**Rule Engine:** Load Type → `canDeliver(userId, type.code)` → check `(user_id, type_code).enabled` → skip nếu OFF.

**UI:** User Web **Quyền riêng tư** — toggle per type · label = `name` · contract [`11-User-Preference-UI-Contract.md`](11-User-Preference-UI-Contract.md).

**v1 CẤM implement (unchanged scope):**

| Cấm | Lý do |
|-----|--------|
| Group/bucket master toggle | Retired D1-rev |
| Per-channel preference matrix | v2 |
| `mute_until` · quiet hours · timezone | v2 |
| Digest · frequency · schedule | v2 |
| Trang「Cài đặt thông báo」độc lập | v2 |

*Supersedes bucket-level decision 2026-07-28 earlier Phase D — see [`PhaseD-D1-rev-Preference-Model-Owner-Decision.md`](PhaseD-D1-rev-Preference-Model-Owner-Decision.md).*

---

### 3.6 Notification Rule

| Check | v1 |
|-------|-----|
| Type `enabled` | ✅ |
| Template `enabled` | ✅ |
| User preference (per `type_code`) | ✅ |
| Channel supported + **deliverable** | ✅ — push/email skip silently nếu adapter chưa có |
| Dedupe key | ✅ |

---

### 3.7 Notification Delivery

**v1:** Chỉ ghi inbox in-app. Bảng `notification_deliveries` **optional** Phase B — nếu có, chỉ log `in_app`.

Không build retry · dead letter · outbound queue v1.

---

### 3.8 Dispatcher (module — không phải service)

**Single public entry** — contract ổn định dù deploy monolith hay tách service sau:

```javascript
NotificationDispatcher.dispatch({
  typeCode: 'AFFILIATE_REFERRAL_SUCCESS',
  recipientUserId: uuid,
  variables: { member: '…' },
  dedupeKey: '…',
  channels: ['in_app']  // v1: ignored nếu khác in_app
});
```

**Implementation v1:** `backend/src/modules/notifications/dispatcher.js` (hoặc mở rộng module hiện có) — **cùng process** với Orders · Affiliate · Community.

**Cấm domain:** `inbox.pushToUser` · render client · pre-rendered title/body · `OrderService.sendNotification()`.

`inbox.pushToUser` = **internal** Platform only.

---

### 3.9 Subscriber (event listener — không phải microservice)

**Subscriber v1** = file handler / listener **trong backend hiện hữu**:

```text
backend/src/modules/notifications/
  dispatcher.js
  inbox.service.js
  subscribers/
    affiliate.subscriber.js    ← listens referral.signup.success
    fn.subscriber.js           ← migrate từ fn-subscriber.js
```

| ✅ v1 | ❌ cấm v1 |
|-------|-----------|
| In-process event bus (`core/events/bus`) | Notification microservice |
| Sync `dispatch()` trong cùng request/transaction path | Worker process riêng |
| Listener file per domain | Kafka · RabbitMQ · SQS |
| | Redis queue · Bull · dead letter |
| | Service discovery |

**Không** tạo `notification-service/` repo · folder deploy riêng · database notification riêng.

---

### 3.10 Authoring SoT vs Runtime SoT (LOCKED — Phase C)

Hai lớp sự thật **khác lifecycle** — không trộn:

```text
Authoring SoT (Developer)
        │
        ▼
notification-platform-seed-data.js
        │  validate-notification-seed.js (guard)
        ▼
seed execution
        │
        ▼
Runtime SoT (Production)
        │
        ▼
notification_types
notification_templates
        │
        ▼
Admin API → Admin UI (read + edit title/body only)
        │
        ▼
Dispatcher / consumers (Phase D)
```

| Lớp | SoT | Ai sửa | Ghi chú |
|-----|-----|--------|---------|
| **Authoring** | `notification-platform-seed-data.js` | Developer | Đăng ký Type · variables contract · seed template defaults |
| **Runtime** | PostgreSQL (`notification_types`, `notification_templates`) | Seed sync + Admin PATCH | DB = runtime authority sau seed |
| **Legacy compat** | `variable-alias.js` | Developer (chỉ backward compat) | **Không** registry variable mới — OD-C8 |

**Câu hỏi thường gặp:**

| Câu hỏi | Trả lời |
|---------|---------|
| DB hay Seed là SoT? | **Authoring** = seed file · **Runtime** = DB · seed **đồng bộ** metadata theo §3.3 |
| Admin thêm Type? | **Không** — Developer seed only (P5) |
| Admin sửa copy? | PATCH `title`/`body` — runtime, không đổi seed file |
| Thêm Type không deploy FE? | Seed + migrate + backend deploy — Admin list tự nhận qua API |

Workflow Developer: [`PhaseC-Developer-Seed-Workflow.md`](PhaseC-Developer-Seed-Workflow.md).

---

## 4. Consumer domains (Phase D)

Affiliate · Community · Orders · Follow · Alert · Interaction — mỗi domain:

1. Publish business event (preferred) hoặc thin `dispatch()` hook
2. **Không** own template · inbox · render

Affiliate task [`270727`](../270727_Affiliate%20Members%20Table%20%26%20Referral%20Welcome%20Notification/00-README.md) = **consumer đầu tiên**, không phải owner Platform.

---

## 5. Phase mapping

| Phase | Trọng tâm |
|-------|-----------|
| **A** | ✅ **LOCKED** 2026-07-28 — file này + audits 02–05 |
| **B** | Template System — DB + API + Admin wire |
| **C** | Type Registry — Developer seed workflow |
| **D — Consumer Integration** | Dispatcher + domain consumers (Affiliate · FN-001…) |

---

## 6. Mapping legacy → platform

| Legacy | Platform |
|--------|----------|
| `USER_AFF_REFERRAL` | `AFFILIATE_REFERRAL_SUCCESS` |
| `{Tên thành viên mới}` | `{member}` + alias map migrate |
| `pushReferralSignup` | `dispatch()` — retire client path |
| localStorage template | DB template |

---

## 7. Out of scope (platform v1)

Xem **§8 Scope guards** — mục chi tiết cấm agent mở rộng.

- Admin tạo Type từ UI
- Visual rule builder · redesign ADM-SYS-003

---

## 8. Scope guards v1 (LOCKED — anti scope-creep)

> Mục đích: ngăn agent/developer biến task 3 ngày thành "Notification Enterprise".  
> Phù hợp [`Engineering Change Governance`](../../SoT%20—%20Engineering%20Change%20Governance.md) CG-011 · CG-030.

### 8.1 Preference — per Notification Type (D1-rev pending sign-off)

- **Granularity:** **`type_code`** — một switch → một Type
- **Field trên Type registry:** `group_label` (Nhóm thông báo — human SoT D6)
- **Field trên user preference:** `(user_id, type_code, enabled)` table `user_notification_type_preferences`
- **UI:** Tài khoản → **Quyền riêng tư** — [`11-User-Preference-UI-Contract.md`](11-User-Preference-UI-Contract.md)

**Retire Migration 039:** `(user_id, preference_bucket)` table 038 · bucket không dùng dispatch.

**Cấm v1:** group master toggle · quiet hours · digest · schedule.

### 8.2 Template `version` — optimistic concurrency only

| `version` là | `version` **không** là |
|--------------|------------------------|
| Integer tăng khi Admin PATCH thành công | Revision history |
| Conflict detect: PATCH stale version → 409 | Rollback UI |
| | Audit log / diff viewer |
| | Draft · publish workflow |
| | Template snapshots table |

**Cấm v1:** `notification_template_revisions` · admin "xem lịch sử mẫu" · restore version N.

### 8.3 Delivery v1 — in_app only

| Layer | v1 |
|-------|-----|
| Type `supported_channels` | Có thể liệt kê `push` · `email` — **metadata only** |
| Runtime delivery | **Chỉ** `in_app` → `inbox.pushToUser` |
| Push/Email adapter | **Không implement** |

**Cấm v1:** FCM · APNs · SMTP · send queue · retry worker · dead letter · `delivery_status` pipeline đầy đủ.

Rule Engine: channel không deliverable → **skip** (log dev), không fail whole platform.

### 8.4 Subscriber v1 — in-process module

Xem §3.9 · §0.1. **Modular monolith** — không microservice · không message broker.

### 8.5 Migration completion rule (CG-020)

**Khi Platform path production PASS** cho một case (checklist Phase B/D):

| Hành động | Bắt buộc |
|-----------|----------|
| Retire runtime read | `system-notification-catalog.js` (client/admin) |
| Retire | `system-notification-templates-store.js` runtime |
| Retire | localStorage `iflux_sys_notif_templates_v1` |
| Retire | `pushReferralSignup()` production path |
| Retire | Hardcoded notification copy trong migrated subscribers |
| Retire | Dual-write catalog + DB |

**Cấm:** Dual-write vô thời hạn · `display:none` giữ legacy path song song (CG-010).

**Phase B exit:** Template Admin = DB only.  
**Phase D exit (per consumer):** Legacy emit path **xóa** trong cùng PR/slice — không "tạm giữ fallback".

Checklist chi tiết: [`01-Audit-Current-State.md`](01-Audit-Current-State.md) §11 · [`09-Plan-Roadmap.md`](09-Plan-Roadmap.md) §12.

---

## 9. Phase A LOCK checklist

- [x] Audits 02–05 reviewed
- [x] §0.1 modular monolith
- [x] §8 scope guards 8.1–8.5
- [x] Preference = per `type_code` · `group_label` human SoT (D6) · D1-rev sign-off
- [x] Owner LOCK — **2026-07-28**

---

*Platform SoT v4 — LOCKED Phase A — 2026-07-28.*
