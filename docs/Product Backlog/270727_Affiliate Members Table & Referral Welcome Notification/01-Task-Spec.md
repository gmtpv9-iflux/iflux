# 01 — Task Spec · Affiliate Members Table & Referral Welcome Notification

**Date:** 2026-07-27  
**Owner request:** Bảng danh sách thành viên tab Affiliate + thông báo chào mừng F0/F1/F2  
**Trạng thái:** 🔄 Owner decisions LOCKED — xem [`03-Owner-Decisions.md`](03-Owner-Decisions.md)

---

## 1. Phạm vi UI

**Vị trí:** User Web → Tài khoản → tab **Affiliate** → card **Danh sách thành viên**  
**Route:** `/tai-khoan?tab=affiliate` (hoặc slug publicId tương đương)

---

## 2. Yêu cầu chức năng (Owner)

### 2.1 Bảng danh sách thành viên — cột bắt buộc

| Cột | Mô tả | Ghi chú |
|-----|--------|---------|
| **Tên thành viên** | Tên hiển thị + avatar/initials | Giữ pattern `ix-user-cell` hiện có |
| **Lớp** | `F0` \| `F1` \| `F2` | Theo vị trí trong chuỗi upline của user đang xem |
| **Ngày tham gia** | Ngày đăng ký tài khoản **thành công** | ISO → `vi-VN`; không phải ngày mua gói |
| **Trạng thái hoạt động** | `Hoạt động` \| `Tạm khóa` | **SoT = Admin** Quản lý khách hàng → Quản lý người dùng → Trạng thái. Mặc định user mới: **Hoạt động** |

**Quy tắc Trạng thái hoạt động**

- Map từ `users.account_status` (backend): `active` → **Hoạt động**, `suspended` → **Tạm khóa**
- Admin đổi trạng thái ở đâu → bảng Affiliate phản ánh y chang (read-only phía User)
- **Không** dùng `membersMeta.status` hiện tại (`active` / `purchased` — lifecycle mua gói affiliate)

### 2.2 Preference「Thông báo Affiliate」(Platform bucket)

> **Cập nhật Platform SoT LOCK 2026-07-28:** Toggle tại **Tài khoản → Quyền riêng tư** — **không** góc bảng Affiliate. Xem [`06-Platform-SoT.md` §3.5](../../270728_Notification%20Platform%20Foundation/06-Platform-SoT.md).

| Thuộc tính | Giá trị |
|------------|---------|
| **Bucket** | `affiliate_notifications` |
| **Vị trí UI** | Tab **Quyền riêng tư** (`/tai-khoan`) |
| **Control** | Switch — nhãn **「Thông báo Affiliate」** |
| **Mặc định** | **Bật** |
| **Phạm vi** | Một switch → referral · hoa hồng · thành viên mua gói… (không per-type) |

**Khi BẬT:** Uplines F0/F1/F2 nhận dispatch `AFFILIATE_REFERRAL_SUCCESS` (và các type Affiliate khác) khi có sự kiện tương ứng.

**Khi TẮT:** Không dispatch types thuộc bucket (bảng thành viên vẫn cập nhật).

### 2.3 SoT nội dung thông báo

| Mã | Case ID (kỹ thuật) | Tiêu đề Owner (mục tiêu) |
|----|---------------------|---------------------------|
| **NOTIF-USER-007** | `USER_AFF_REFERRAL` | **「Thành viên mới đã đăng ký!」** |

**Nguồn mẫu:** Admin → Quản lý thông báo → **Thiết lập mẫu thông báo** (`/admin/he-thong/announcements`) → case NOTIF-USER-007.

**Merge tags:** `{Tên người dùng}`, `{Tên thành viên mới}` (theo catalog hiện có).

**Kênh:** In-app user (`referral_signup`).

### 2.4 Luồng sự kiện đăng ký mới

Khi **1 thành viên mới** đăng ký thành công qua link giới thiệu (ref / affiliate URL):

1. Gắn vào cây F0/F1/F2 (parent chain) — backend + store hiện có
2. **Mỗi upline** trong phạm vi 3 lớp của user bị ảnh hưởng:
   - Nếu bucket **`affiliate_notifications` = Bật** → dispatch referral in-app
   - **Thêm 1 dòng** vào bảng Danh sách thành viên của upline tương ứng (refresh / realtime)
3. User nhận thông báo trên chuông in-app; click điều hướng về tab Affiliate (giữ href hiện tại hoặc cập nhật theo route mới)

**Ví dụ:** A giới thiệu B (F0 của A). B giới thiệu C. C đăng ký mới:
- B nhận thông báo (C là F0 của B)
- A nhận thông báo (C là F1 của A)
- Upline F2 của A (nếu có) nhận thông báo (C là F2)

---

## 3. Hiện trạng code (evidence)

### 3.1 Bảng thành viên — đã có, thiếu cột

**HTML:** `User_Web/account/profile.html` — `#aff-members-table`  
**Render:** `User_Web/iflux-web-ui/profile-affiliate.js` → `renderMembers()`  
**Data:** `IfluxLoyaltyAffiliateStore.listNetworkMembers()`

| Cột hiện tại | Có? |
|--------------|-----|
| Thành viên (tên + mã) | ✅ |
| Lớp F0/F1/F2 | ✅ |
| Ngày tham gia | ✅ (`meta.joinedAt`) |
| Trạng thái hoạt động (Admin) | ❌ |
| Preference bucket Affiliate | ❌ |

### 3.2 Trạng thái trong store — **khác** SoT Owner

`loyalty-affiliate-store.js` → `membersMeta.status`: `active` \| `purchased` (affiliate lifecycle), **không** phải `account_status` Admin.

Admin SoT: `Admin_Design_system/app/users/users-list.js` — `accountStatus`: `active` → Hoạt động, `suspended` → Tạm khóa.

Backend: `users.account_status` (`001_init.sql`, `admin-users.service.js`).

### 3.3 Thông báo referral — chỉ F0 trực tiếp

`loyalty-affiliate-store.js` → `applyReferralFromServer()`:

```javascript
if (isNew && global.IfluxInAppNotifications) {
  IfluxInAppNotifications.pushReferralSignup(referrerId, { ... });
}
```

→ Chỉ notify **referrer trực tiếp** (1 người), **chưa** walk upline F1/F2.  
→ **Chưa** check toggle "Nhận thông báo" per user.

`inapp-notifications.js` → `pushReferralSignup()` đã render template `USER_AFF_REFERRAL` (NOTIF-USER-007) qua `IfluxSystemNotificationTemplates`.

### 3.4 NOTIF-USER-007 — catalog vs Owner title

**Catalog (Admin + User Web):** `system-notification-catalog.js`

| Field | Giá trị hiện tại |
|-------|------------------|
| `code` | `NOTIF-USER-007` |
| `id` | `USER_AFF_REFERRAL` |
| `name` | Referral mới đăng ký |
| `defaultTitle` | **Referral mới** ← chưa đúng tiêu đề Owner |
| `defaultMessage` | `{Tên thành viên mới} đã đăng ký qua mã giới thiệu của bạn.` |

Owner muốn tiêu đề: **「Thành viên mới đã đăng ký!」**

---

## 4. Acceptance Criteria

| ID | Tiêu chí |
|----|----------|
| AC-AFF-M01 | Bảng có đủ 4 cột: Tên, Lớp, Ngày tham gia, Trạng thái hoạt động |
| AC-AFF-M02 | Trạng thái = Admin `account_status` (Hoạt động / Tạm khóa); user mới mặc định Hoạt động |
| AC-AFF-M03 | Admin đổi Tạm khóa → bảng Affiliate user referrer thấy cập nhật sau sync |
| AC-AFF-M04 | Switch「Thông báo Affiliate」tab **Quyền riêng tư**; bucket `affiliate_notifications`; mặc định Bật |
| AC-AFF-M05 | Bucket Tắt → không dispatch types Affiliate cho user đó |
| AC-AFF-M06 | Đăng ký mới F0/F1/F2 → uplines có bucket Bật nhận in-app qua Platform |
| AC-AFF-M07 | Nội dung thông báo render từ template NOTIF-USER-007 (Admin SoT) |
| AC-AFF-M08 | Đăng ký mới → dòng mới xuất hiện trong bảng thành viên của upline tương ứng |
| AC-AFF-M09 | Mobile stack-card bảng affiliate vẫn hoạt động (≤1024px) |
| AC-AFF-M10 | NOTIF-USER-007 save được tiêu đề Owner trên Admin |

---

## 5. Out of scope (task này)

- Push notification mobile (chỉ in-app user theo catalog)
- Email/SMS chào mừng affiliate
- Sửa commission / lịch sử hoa hồng
- Admin tạo/sửa trạng thái từ tab Affiliate User (read-only mirror Admin Users)

---

## 6. Blocker: NOTIF-USER-007 không save được

**Triệu chứng Owner:** Đổi tiêu đề NOTIF-USER-007 thành 「Thành viên mới đã đăng ký!」 nhưng không lưu được.

**Nguyên nhân kỹ thuật (đã xác minh Production):**

| Thành phần | Trạng thái |
|------------|------------|
| Trang Admin | `/admin/he-thong/announcements` → `system/announcements.html` ✅ |
| Script logic | `announcements-page.js` — path **tương đối** trong HTML |
| URL trình duyệt resolve | `/admin/he-thong/announcements-page.js` → **404** |
| File thật | `/Admin_Design_system/app/system/announcements-page.js` → **200** |

→ Cùng pattern lỗi với `orders-page.js` trên `/admin/don-hang/list`: nginx rewrite slug Admin không serve file `.js` cùng prefix.

**Hệ quả:** `announcements-page.js` không chạy → nút 「Lưu mẫu」 không bind → localStorage `iflux_sys_notif_templates_v1` không ghi → User Web vẫn dùng `defaultTitle` cũ.

**Fix tối thiểu (Slice 0 — prerequisite):** Đổi script src sang path tuyệt đối `/Admin_Design_system/app/system/announcements-page.js` (+ bump cache).

**Sau fix Slice 0:** Admin UI bind được — nhưng **chưa đủ** Owner H3: localStorage không phải SoT đa thiết bị. Slice 1 migrate template lên **server** (chi tiết [`04-Template-SoT-Audit.md`](04-Template-SoT-Audit.md)).

**Không chấp nhận:** Chỉ đổi `defaultTitle` trong catalog JS — vẫn hardcode trong code; override localStorage không sync; fallback `'Referral mới'` trong `inapp-notifications.js` vẫn vi phạm.

---

## 7. Ghi chú Product / Architecture

- **Share / Affiliate:** Share là capability chung (Product Architecture V2); ref `?ref=` là decorator Share — không nhét metadata affiliate vào canonical URL.
- **Ngôn ngữ UI:** Nhãn tiếng Việt; slug `/tai-khoan`, `/admin/he-thong/announcements`.
- **DS:** Chỉ dùng component/token Admin/User DS hiện có (`ix-table`, `ix-chip`, switch pattern có sẵn — nếu chưa có switch DS thì báo Owner trước khi thêm CSS ad-hoc).

---

*Task Spec v1 — 2026-07-27.*
