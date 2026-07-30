# Phase D — D1-rev Owner Decision · Naming UX + Preference Model

**Date:** 2026-07-28  
**Trạng thái:** ✅ **SHIPPED 2026-07-28** — Owner sign-off · Migration 039 applied Production · D5 authorized  
**Trigger:** Owner review trước D5 — 2 yêu cầu độc lập cần lock contract trước Migration 039  
**Supersedes:** [`06-Platform-SoT.md`](06-Platform-SoT.md) §3.5 · §8.1 · [`08-Admin-UX-Contract.md`](08-Admin-UX-Contract.md) · [`PhaseD-D1-Solution-And-Owner-Decision.md`](PhaseD-D1-Solution-And-Owner-Decision.md) preference · [`PhaseD-D5-Regression-Checklist.md`](PhaseD-D5-Regression-Checklist.md)

**Contracts cập nhật cùng D1-rev:**

| # | File |
|---|------|
| A | [`08-Admin-UX-Contract.md`](08-Admin-UX-Contract.md) — Naming model |
| B | [`11-User-Preference-UI-Contract.md`](11-User-Preference-UI-Contract.md) — **NEW** |
| C | [`06-Platform-SoT.md`](06-Platform-SoT.md) §3.5 · §8.1 |
| D | [`PhaseD-D5-Regression-Checklist.md`](PhaseD-D5-Regression-Checklist.md) |

---

## 0. Phạm vi — hai yêu cầu độc lập

```text
┌─────────────────────────────────────────────────────────────┐
│  TRACK A — Naming model (UX contract)                         │
│  Tách Tên mẫu vs Tiêu đề/Nội dung · Admin ↔ User đối chiếu   │
│  KHÔNG đổi preference boundary                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  TRACK B — Preference model (architecture)                    │
│  Bật/tắt từng type_code · group chỉ category UI               │
│  KHÔNG đổi dispatcher public API                              │
└─────────────────────────────────────────────────────────────┘
```

Có thể implement song song sau sign-off · **không** ship D5 trước khi cả hai track lock.

---

## TRACK A — Naming model (UX contract)

### A.1 Field semantics (LOCKED đề xuất)

| Field DB | Tên hiển thị | Vai trò | Admin editable | User hiển thị |
|----------|--------------|---------|:--------------:|---------------|
| `admin_code` | **Mã** | Định danh kỹ thuật (NOTIF-USER-007) | ❌ | ❌ |
| `code` (`type_code`) | *(dev only)* | Contract dispatcher/API | ❌ | ❌ |
| `name` | **Tên mẫu thông báo** | Label nghiệp vụ · đối chiếu Admin ↔ User | ✅ | Toggle label |
| `template.title` | **Tiêu đề mẫu** | Copy title gửi vào inbox | ✅ | ❌ (chỉ thấy sau dispatch) |
| `template.body` | **Nội dung mẫu** | Copy body gửi user | ✅ | ❌ |

**Cấm:**

- Dùng `template.title` làm tên hiển thị Admin list.
- Dùng bucket label ("Thông báo Affiliate") làm User toggle label.
- Nhầm `admin_code` / `type_code` với tên hiển thị User.

### A.2 Admin UI (ADM-SYS-003)

**List/header (collapsed):**

```text
Mã: NOTIF-USER-007
Tên mẫu: Thành viên mới đăng ký qua link giới thiệu
(mô tả trigger — read-only)
```

**Expand:**

```text
Tên mẫu:     [editable input → PATCH name]
Tiêu đề mẫu: [editable → PATCH template.title]
Nội dung mẫu:[editable → PATCH template.body]
```

**Bug hiện tại (evidence — chưa fix):**

```javascript
// announcements-page.js
function caseDisplayTitle(t) {
  var title = tpl.title ...
  return title || t.name;  // ← SAI: ưu tiên template.title
}
```

Contract: [`08-Admin-UX-Contract.md`](08-Admin-UX-Contract.md) §4–§6 (D1-rev).

### A.3 User Web UI (Quyền riêng tư)

Toggle label = **`notification_types.name`** (Tên mẫu) — sync từ server, không hardcode.

Ví dụ đối chiếu Owner:

| Admin | User Web toggle |
|-------|-----------------|
| `NOTIF-USER-007` · Tên mẫu: *Thành viên mới đăng ký qua link giới thiệu* | ☑ *Thành viên mới đăng ký qua link giới thiệu* |

Contract: [`11-User-Preference-UI-Contract.md`](11-User-Preference-UI-Contract.md).

---

## TRACK B — Preference model (architecture)

### B.1 Quyết định sản phẩm

**Không còn** khái niệm: *"Affiliate bật/tắt toàn bộ"*.

**Mới:** mỗi Notification Type có trạng thái preference **độc lập**.

```text
Affiliate                          ← preference_group (section header — KHÔNG có switch)

  ☑ Thành viên mới đăng ký qua link giới thiệu    AFFILIATE_REFERRAL_SUCCESS = ON
  ☐ Nhận hoa hồng Affiliate                        AFFILIATE_COMMISSION_EARNED = OFF
```

**Invariant:** Tắt type A **không** ảnh hưởng type B dù cùng group.

### B.2 SoT schema (LOCKED đề xuất)

```text
notification_types
    code              (type_code — PK)
    name              (Tên mẫu — TRACK A)
    preference_group  (category UI only — KHÔNG phải preference boundary)

user_notification_type_preferences
    user_id
    type_code         (FK → notification_types.code)
    enabled
    PRIMARY KEY (user_id, type_code)
```

**Retire sau migrate:**

```text
user_notification_preferences (038)
    (user_id, preference_bucket, enabled)  ← bucket-level — KHÔNG dùng dispatch
```

**Rename semantics:**

| Cũ | Mới |
|----|-----|
| `notification_types.preference_bucket` | `preference_group` |
| Role: preference boundary | Role: **UI grouping only** |

### B.3 Rule engine

```text
dispatch(typeCode, recipientUserId, …)
    → load type
    → canDeliver(userId, typeCode)     ← check (user_id, type_code).enabled
    → NOT canDeliver(userId, preference_group)
    → render + delivery-channel
```

**Sau Migration 039:** bucket **không** còn tham gia quyết định dispatch.

### B.4 Migration 039 proposal

**Mục đích:** cutover preference SoT · bucket cũ chỉ là **migration source**.

| Bước | Hành động |
|------|-----------|
| 1 | `ALTER TABLE notification_types RENAME COLUMN preference_bucket TO preference_group` |
| 2 | `CREATE TABLE user_notification_type_preferences (...)` |
| 3 | Seed: mọi `(user_id, type_code)` default `enabled = true` cho types user-facing in-app |
| 4 | **One-time migrate** từ bucket table: user row `preference_bucket=X, enabled=false` → set `enabled=false` cho **mọi** type có `preference_group` map tương ứng |
| 5 | Verify dispatcher dùng `type_code` only |
| 6 | `DROP TABLE user_notification_preferences` |

**Ghi chú quan trọng:**

- Bucket OFF cũ → OFF **tất cả types trong group** (conservative one-time) — không phải runtime rule.
- Sau cutover: **không** đọc bucket table cho dispatch.
- User thay đổi preference chỉ qua `(type_code, enabled)`.

**Open (Owner OD-D1rev-5):** Types `preference_group = NULL` (vd. Gói đăng ký) — **luôn ON · không hiển thị User UI v1** ✅ APPROVED 2026-07-28

---

## API contract (LOCKED đề xuất)

### GET `/users/me/notification-preferences`

Response grouped by `preference_group` — **group không có field `enabled`**.

```json
{
  "groups": [
    {
      "key": "affiliate",
      "label": "Affiliate",
      "types": [
        {
          "type_code": "AFFILIATE_REFERRAL_SUCCESS",
          "admin_code": "NOTIF-USER-007",
          "name": "Thành viên mới đăng ký qua link giới thiệu",
          "enabled": true
        },
        {
          "type_code": "AFFILIATE_COMMISSION_EARNED",
          "admin_code": "NOTIF-USER-006",
          "name": "Nhận hoa hồng Affiliate",
          "enabled": false
        }
      ]
    }
  ]
}
```

**Filter:** in-app user types · registry `enabled=true` · exclude admin-only (NOTIF-ADM-*).

### PATCH `/users/me/notification-preferences`

**Chỉ nhận `type_code` — KHÔNG nhận `bucket`.**

```json
{
  "items": [
    { "type_code": "AFFILIATE_REFERRAL_SUCCESS", "enabled": true },
    { "type_code": "AFFILIATE_COMMISSION_EARNED", "enabled": false }
  ]
}
```

**Reject:** `{ "bucket": "affiliate_notifications", "enabled": false }` → 400.

### Admin PATCH name (TRACK A)

`PATCH /admin/notifications/types/:code` body `{ "name": "..." }` — Tên mẫu editable.

---

## D5 impact — checklist rewrite

**D5 BLOCKED** until D1-rev implement + deploy.

| Case | Thay đổi |
|------|----------|
| **R0 NEW** | Admin list = Tên mẫu · User toggle label = cùng Tên mẫu |
| **R2** | **Type-level independence** — xem § D5 doc |
| **R6** | Multi-tab sync **per type_code** |
| R1, R3, R4, R5 | Giữ · R1 thêm verify naming |

Chi tiết: [`PhaseD-D5-Regression-Checklist.md`](PhaseD-D5-Regression-Checklist.md).

---

## Implementation slices (sau sign-off ONLY)

```text
D1-rev.A1  Admin naming UX + PATCH name API
D1-rev.A2  User toggle label = name (API-driven)

D1-rev.B1  Migration 039 + preference.service type-level
D1-rev.B2  dispatcher canDeliver(typeCode) + API GET/PATCH
D1-rev.B3  User privacy UI — group header + per-type toggle

D1-rev.C    Deploy + D5 checklist final + D5 authorized
```

**Cấm:** Migration 039 · sửa dispatcher · sửa User UI **trước** Owner sign-off checklist §7.

---

## Owner sign-off checklist

| # | Quyết định | Track | Owner |
|---|------------|-------|-------|
| **OD-D1rev-A1** | `name` = **Tên mẫu thông báo** · Admin list + User toggle label | A | ✅ 2026-07-28 |
| **OD-D1rev-A2** | Admin editable **Tên mẫu** + Tiêu đề mẫu + Nội dung mẫu (3 field) | A | ✅ 2026-07-28 |
| **OD-D1rev-A3** | Cấm dùng `template.title` làm tên hiển thị list | A | ✅ 2026-07-28 |
| **OD-D1rev-B1** | Preference unit = **`type_code`** · `(user_id, type_code, enabled)` | B | ✅ 2026-07-28 |
| **OD-D1rev-B2** | `preference_group` = **category UI only** · không switch group | B | ✅ 2026-07-28 |
| **OD-D1rev-B3** | Migration 039: bucket = migration source only · retire 038 | B | ✅ 2026-07-28 |
| **OD-D1rev-B4** | API PATCH chỉ `type_code` · reject `bucket` | B | ✅ 2026-07-28 |
| **OD-D1rev-B5** | `preference_group = NULL` → always ON · không hiện User toggle v1 | B | ✅ 2026-07-28 |
| **OD-D1rev-C1** | **D5 BLOCKED** until D1-rev implement complete | — | ✅ 2026-07-28 |

---

## Exit D1-rev

```text
✅ Owner sign-off OD-D1rev-A1…C1 (2026-07-28)
✅ Implement D1-rev slices (A1–B3)
✅ Migration 039 applied Production (2026-07-28)
✅ Deploy backend + User Web + Admin + CF purge
→ D5 authorized — chạy PhaseD-D5-Regression-Checklist.md
```

### Deploy evidence (2026-07-28)

| Check | Result |
|-------|--------|
| Migration 039 | `preference_group` column · `user_notification_type_preferences` exists · `user_notification_preferences` dropped |
| Backend | `preference.service.js`, `dispatcher.js`, `auth.routes.js`, `template.service.js`, `platform-admin.routes.js` |
| Admin | `announcements-page.js` — Tên mẫu list + 3-field edit |
| User Web | `profile-privacy-page.js` — group header + per-type toggle · `notification-preference-store.js` |
| API contract | PATCH reject `{ bucket }` · accept `{ type_code, enabled }` |

---

*Phase D D1-rev — SHIPPED 2026-07-28.*
