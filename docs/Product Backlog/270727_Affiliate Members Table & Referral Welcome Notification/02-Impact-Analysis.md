# 02 — Impact Analysis · Affiliate Members Table & Referral Welcome Notification

**Date:** 2026-07-27  
**Governance:** [`docs/SoT — Engineering Change Governance.md`](../../SoT%20—%20Engineering%20Change%20Governance.md) v1.1

---

## Impact Analysis (tối thiểu)

| Feature | Owner hiện tại | Files chính | Decision |
|---------|----------------|-------------|----------|
| Bảng thành viên Affiliate | `profile-affiliate.js` + `loyalty-affiliate-store.js` | `profile.html`, `profile.css`, `profile-affiliate.js`, `loyalty-affiliate-store.js` | **Modify** |
| Trạng thái Hoạt động / Tạm khóa | Admin Users + `users.account_status` | `admin-users.service.js`, affiliate sync API | **Modify** + expose field trong affiliate sync |
| Toggle Nhận thông báo | Chưa có | User preference store (backend hoặc user settings) | **Modify/Create** — cần persist server-side |
| NOTIF-USER-007 template | `IfluxSystemNotificationTemplates` + catalog | Admin `announcements-page.js`, `system-notification-catalog.js` (Admin + User Web) | **Modify** |
| Notify upline F0/F1/F2 | `applyReferralFromServer` chỉ 1 referrer | `loyalty-affiliate-store.js`, `inapp-notifications.js`, auth signup backend | **Modify** |
| Admin save template | `announcements-page.js` 404 | `announcements.html` script path | **Modify** (prerequisite) |

---

## File inventory (dự kiến chạm)

### User Web

| File | Thay đổi |
|------|----------|
| `User_Web/account/profile.html` | Cột Trạng thái; toggle header bảng |
| `User_Web/iflux-web-ui/profile-affiliate.js` | Render cột status; bind toggle |
| `User_Web/iflux-web-ui/profile.css` | Mobile stack label cột mới (nếu cần) |
| `User_Web/iflux-web-ui/loyalty-affiliate-store.js` | Upline notify; account_status trong member; preference |
| `User_Web/iflux-web-ui/inapp-notifications.js` | (có thể giữ — đã có pushReferralSignup) |
| `User_Web/iflux-web-ui/system-notification-catalog.js` | `defaultTitle` NOTIF-USER-007 |

### Admin

| File | Thay đổi |
|------|----------|
| `Admin_Design_system/app/system/announcements.html` | Fix script path (prerequisite) |
| `Admin_Design_system/iflux-admin-ui/system-notification-catalog.js` | Sync defaultTitle |

### Backend (Phase API — nếu Owner mở)

| File | Thay đổi |
|------|----------|
| `backend/src/modules/legacy-auth/auth.service.js` | Sau signup: emit referral welcome cho uplines |
| `backend/.../auth.routes.js` → referrals sync | Trả `account_status` per member |
| User settings / notification prefs | Field `aff_referral_welcome_enabled` default true |

---

## Consumers

| Consumer | Ảnh hưởng |
|----------|-----------|
| Tab Affiliate desktop/mobile | Bảng + toggle |
| In-app bell (`inapp-notifications.js`) | Thêm notification referral_signup |
| Admin Users list/detail | SoT account_status — read only từ Affiliate |
| Admin Thiết lập mẫu thông báo | Save NOTIF-USER-007 |

---

## Storage / API

| Dữ liệu | Hiện tại | Cần |
|---------|----------|-----|
| Parent chain F0/F1/F2 | localStorage + `/referrals/sync` | Giữ |
| Member joinedAt | `membersMeta.joinedAt` | Giữ; ưu tiên `users.created_at` từ server |
| Member account status | ❌ | `users.account_status` qua sync |
| Toggle Nhận thông báo | ❌ | Persist per user (DB recommended) |
| Template NOTIF-USER-007 | localStorage `iflux_sys_notif_templates_v1` | Fix Admin save; optional server template API sau |

---

## Owner decisions — LOCKED

Xem [`03-Owner-Decisions.md`](03-Owner-Decisions.md).

| ID | Quyết định |
|----|------------|
| **P0-H1** | Preference server · user account · đa thiết bị |
| **P0-H2** | Notify ngay **đăng ký thành công** |
| **P0-H3** | Template title Admin dynamic SoT — audit [`04-Template-SoT-Audit.md`](04-Template-SoT-Audit.md) |

---

## Slice đề xuất (post-Owner)

| Slice | Nội dung | Phụ thuộc |
|-------|----------|-----------|
| **0** | Fix `announcements-page.js` path (Admin UI bind) | — |
| **1** | Server SoT NOTIF-USER-007 + API + backend/User consumer; bỏ hardcode fallback | Slice 0 |
| **2** | DB field + API `aff_referral_notify_enabled` + toggle UI | P0-H1 |
| **3** | Cột Trạng thái hoạt động (`account_status` sync) | — |
| **4** | Notify upline F0/F1/F2 @ signup + row bảng | Slice 1, 2 |
| **5** | Regression | Slice 4 |

---

## Test evidence (khi thi công)

- [ ] Admin save NOTIF-USER-007 title → reload → giữ 「Thành viên mới đã đăng ký!」
- [ ] User A: toggle ON → B đăng ký qua link A → A có bell + row F0
- [ ] C đăng ký qua link B → A có F1 row + bell; B có F0 row + bell
- [ ] Toggle OFF → không bell; vẫn có row bảng
- [ ] Admin khóa user → bảng Affiliate hiện Tạm khóa
- [ ] Mobile ≤1024px: 4 cột stack-card readable

---

*Impact Analysis v1 — 2026-07-27.*
