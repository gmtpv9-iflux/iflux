# 03 — Owner Decisions · LOCKED

**Date:** 2026-07-27  
**Trạng thái:** ✅ **LOCKED** — Agent được phép thi công theo các quyết định dưới đây

---

## P0-H1 · Preference 「Nhận thông báo」— cập nhật theo Platform SoT LOCK

| | Quyết định |
|---|------------|
| **Lưu trữ** | **Server** — không dùng localStorage |
| **Granularity** | **Business bucket** — `affiliate_notifications` (một switch → mọi type Affiliate) — **không** per-type |
| **UI (LOCKED)** | User Web **Tài khoản → Quyền riêng tư** — SoT [`06-Platform-SoT.md` §3.5](../../270728_Notification%20Platform%20Foundation/06-Platform-SoT.md) |
| **Affiliate task** | Switch「Thông báo Affiliate」bind bucket `affiliate_notifications` — **không** toggle riêng trên bảng thành viên (revise task spec) |

**Implementation (align Platform):**

- DB: `(user_id, preference_bucket, enabled)` — ví dụ bucket `affiliate_notifications`
- Type registry: field `preference_bucket` trên Notification Type
- API: GET/PATCH `/users/me/notification-preferences` hoặc gộp profile privacy payload

---

## P0-H2 · Thời điểm gửi thông báo

| | Quyết định |
|---|------------|
| **Trigger** | **Ngay khi「Đăng ký thành công」** |
| **Email verify** | Luồng xác thực nâng cấp sau **không** ảnh hưởng quyết định này |

**Implementation note:** Hook tại backend signup success (`auth.service` register / OAuth create user) sau khi `referred_by` đã gắn — emit in-app cho uplines F0/F1/F2 (nếu toggle Bật).

---

## P0-H3 · Template Admin dynamic — Platform Foundation

| | Quyết định |
|---|------------|
| **Yêu cầu** | Tiêu đề/nội dung **Admin thiết lập động** — **cấm hardcode** runtime SoT |
| **Thiết kế** | [**Notification Platform Foundation**](../../270728_Notification%20Platform%20Foundation/06-Platform-SoT.md) |
| **Admin UX** | [`08-Admin-UX-Contract.md`](../../270728_Notification%20Platform%20Foundation/08-Admin-UX-Contract.md) |

---

## P0-H4 · Platform-first (Owner 2026-07-28)

| | Quyết định |
|---|------------|
| **Trung tâm** | Notification Platform → Type Registry → Template → **Consumer Integration** |
| **Affiliate task** | Phase **D** consumer — emit `AFFILIATE_REFERRAL_SUCCESS` |
| **Admin「Thêm mẫu」** | **Không** giai đoạn đầu — Developer seed Type |

---

## Thứ tự slice (platform-first)

Xem [`270728/00-README.md`](../../270728_Notification%20Platform%20Foundation/00-README.md).

| Phase | Nội dung |
|-------|----------|
| A | Platform SoT entity |
| B | Template System (DB + API + Admin UX giữ nguyên) |
| C | Notification Type Registry |
| D | Affiliate: bảng · preference · dispatch · regression |

---

*Owner decisions recorded 2026-07-27 · platform-first rev 2026-07-28.*
