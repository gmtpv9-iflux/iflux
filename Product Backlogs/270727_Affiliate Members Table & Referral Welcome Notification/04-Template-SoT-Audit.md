# 04 — Template SoT Audit · NOTIFICATION LEGACY (Evidence only)

> **⚠️ Không dùng làm nền thiết kế Notification Platform.**  
> File này ghi **hiện trạng implementation** (catalog · localStorage · DB stub · hardcode) — input cho Phase B migration.  
> Platform SoT: [`../270728_Notification Platform Foundation/06-Platform-SoT.md`](../270728_Notification%20Platform%20Foundation/06-Platform-SoT.md)

**Date:** 2026-07-27 (evidence) · reframed 2026-07-28

---

## 1. Tóm tắt kết luận (Executive)

| Câu hỏi | Kết luận |
|---------|----------|
| Đổi `defaultTitle` trong catalog JS có ảnh hưởng override localStorage? | **Không** — nếu browser đã lưu override cho `USER_AFF_REFERRAL`, override **luôn thắng** catalog |
| Admin save tiêu đề hiện có hiệu lực đa thiết bị? | **Không** — localStorage theo browser |
| NOTIF-USER-007 có SoT server hôm nay? | **Không** — DB `notif_templates` không chứa case này |
| Tiêu đề runtime có hardcode? | **Có** — fallback `'Referral mới'` trong `inapp-notifications.js` khi render thất bại |
| Đáp ứng Owner「Admin thiết lập động, không hardcode」? | **Chưa** — cần Slice 1 migrate SoT lên server |

---

## 2. Ba hệ thống song song (hiện trạng)

```text
┌─────────────────────────────────────────────────────────────────┐
│ A. ADM-SYS-003 Catalog + localStorage (runtime User Web dùng)   │
│    catalog.js → defaultTitle/defaultMessage                     │
│    templates-store.js → iflux_sys_notif_templates_v1 (override) │
│    Admin UI: announcements-page.js (case expand → Lưu mẫu)      │
├─────────────────────────────────────────────────────────────────┤
│ B. Wave C API notif_templates (PostgreSQL)                      │
│    Bảng: notif_templates — seed tpl_announcement, tpl_email…    │
│    Admin UI: AdmWaveC.initTemplates() — bảng cuối announcements │
│    User Web: KHÔNG đọc cho NOTIF-USER-007                       │
├─────────────────────────────────────────────────────────────────┤
│ C. Hardcoded fallback inapp-notifications.js                    │
│    pushReferralSignup → title: 'Referral mới' nếu render null   │
└─────────────────────────────────────────────────────────────────┘
```

**Vấn đề kiến trúc:** Owner chỉnh NOTIF-USER-007 ở UI (A) nhưng (A) không chạy Production (JS 404) và không sync server; (B) không map NOTIF-USER-007; (C) vi phạm yêu cầu không hardcode.

---

## 3. Chi tiết hệ A — Catalog + localStorage

### 3.1 Catalog (default trong code)

**File (bản sao Admin + User Web):**

- `Admin_Design_system/iflux-admin-ui/system-notification-catalog.js`
- `User_Web/iflux-web-ui/system-notification-catalog.js`

**NOTIF-USER-007:**

| Field | Giá trị |
|-------|---------|
| `id` (caseId runtime) | `USER_AFF_REFERRAL` |
| `code` (hiển thị Admin) | `NOTIF-USER-007` |
| `defaultTitle` | `Referral mới` ← **chưa đúng tiêu đề Owner** |
| `defaultMessage` | `{Tên thành viên mới} đã đăng ký qua mã giới thiệu của bạn.` |

Deploy catalog mới **chỉ** ảnh hưởng client **chưa có override** cho key `USER_AFF_REFERRAL`.

### 3.2 Override localStorage

**Key:** `iflux_sys_notif_templates_v1`  
**Store:** `system-notification-templates-store.js` (Admin + User Web — cùng logic)

**Resolve template (`getTemplate`):**

```text
title  = override.title  ?? catalog.defaultTitle
message = override.message ?? catalog.defaultMessage
```

**Ảnh hưởng khi đổi catalog `defaultTitle`:**

| Trạng thái browser | Kết quả sau deploy catalog mới |
|--------------------|--------------------------------|
| Chưa từng Lưu mẫu | Dùng **defaultTitle mới** từ catalog |
| Đã Lưu mẫu (override.title có giá trị) | Vẫn dùng **override cũ** — catalog **không** ghi đè |
| Đã「Khôi phục mặc định」trong Admin UI | Xóa override → quay về catalog default mới |

**Phạm vi localStorage:**

- Cùng origin (`iflux.vn`) — Admin tab và User Web tab **cùng browser** chia sẻ override
- **Khác thiết bị / khác browser / incognito** — không chia sẻ
- **Không** có sync server → **không đáp ứng** multi-device Admin SoT

### 3.3 Admin save — vì sao Owner không lưu được

| Bước | Trạng thái Production |
|------|------------------------|
| Mở `/admin/he-thong/announcements` | HTML ✅ |
| Load `announcements-page.js` (relative) | **404** → init/bind **không chạy** |
| Nút「Lưu mẫu」 | Không ghi localStorage |
| `AdmWaveC.initTemplates()` (cuối page) | Chạy ✅ — nhưng API **khác hệ** (B), không phải NOTIF-USER-007 |

---

## 4. Chi tiết hệ B — PostgreSQL `notif_templates`

**Migration:** `backend/migrations/033_wave_c_ai_notif.sql`

**Schema:**

```sql
notif_templates (id, code, name, channel, body, updated_at)
```

**Seed hiện có:** `tpl_announcement`, `tpl_email_digest` — **không** có `NOTIF-USER-007` / `USER_AFF_REFERRAL`.

**API:**

- `GET /admin/notifications/templates`
- `PATCH /admin/notifications/templates/:id` — sửa `name`, `body`, `channel` (prompt đơn giản)

**Consumer:** Chỉ `admin-wave-c-pages.js` — **không** nối vào `IfluxInAppNotifications.pushReferralSignup`.

---

## 5. Chi tiết hệ C — Hardcode fallback

**File:** `User_Web/iflux-web-ui/inapp-notifications.js` → `pushReferralSignup()`

```javascript
title: rendered ? rendered.title : 'Referral mới',
message: rendered ? rendered.message : '...hardcoded string...',
```

Đây là **hardcode runtime** khi `IfluxSystemNotificationTemplates.render()` trả null — Owner yêu cầu **loại bỏ** khỏi đường production (chỉ giữ seed/error log nội bộ nếu cần).

---

## 6. Luồng render NOTIF-USER-007 hôm nay (User Web)

```text
Signup referral
  → loyalty-affiliate-store.applyReferralFromServer
  → IfluxInAppNotifications.pushReferralSignup(referrerId, data)
  → renderTpl('USER_AFF_REFERRAL', vars)
       → IfluxSystemNotificationTemplates.render
            → localStorage override (nếu có)
            → else catalog.defaultTitle / defaultMessage
  → push in-app item (title, message)
```

**Chỉ referrer trực tiếp (1 upline)** — chưa F1/F2 (task riêng).

---

## 7. Khuyến nghị implementation (theo Owner H3)

### SoT mục tiêu

| Layer | Vai trò |
|-------|---------|
| **PostgreSQL** | SoT title + message per `case_code` (`NOTIF-USER-007` / `USER_AFF_REFERRAL`) |
| **Admin API** | GET/PATCH mẫu — announcements-page consumer |
| **Backend signup** | Render template server-side khi emit notification (không phụ thuộc browser localStorage) |
| **User Web client** | Fetch template cache hoặc nhận title/message đã render từ server trong payload notification |
| **catalog.js** | **Seed migrate only** — default ban đầu khi row DB chưa có; không dùng làm SoT sau migrate |

### Migration override localStorage

| Hành động | Ghi chú |
|-----------|---------|
| One-time import | Nếu Production có override trong localStorage admin browser → import vào DB (manual/script một lần) |
| Sau migrate | Xóa phụ thuộc runtime vào `iflux_sys_notif_templates_v1` cho case notifications (giữ hoặc retire store) |
| Đổi defaultTitle catalog | Chỉ ảnh hưởng **seed DB lần đầu** — **không** ảnh hưởng row DB đã tồn tại |

### Tiêu đề Owner「Thành viên mới đã đăng ký!」

- Set qua **Admin UI → Lưu** vào DB (dynamic)
- Seed migration có thể dùng giá trị này làm `title` mặc định ban đầu
- **Không** ship bằng cách sửa string trong catalog rồi coi là xong

---

## 8. Checklist audit PASS (trước khi đóng Slice 1)

- [ ] Admin Lưu NOTIF-USER-007 → reload → title giữ trên **mọi browser**
- [ ] User nhận in-app referral → title khớp DB, không `'Referral mới'` hardcode
- [ ] Sửa title Admin → notification mới dùng title mới (không cần deploy frontend)
- [ ] Không còn fallback hardcode title trong `pushReferralSignup` (production path)
- [ ] Catalog defaultTitle đổi **không** ghi đè row DB đã lưu Admin

---

*Audit v1 — 2026-07-27.*
