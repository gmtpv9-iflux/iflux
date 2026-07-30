# Phase D5 — R1/R3 Referral Failure Audit (Production)

**Date:** 2026-07-28  
**Trigger:** Owner test R1 bước 4–6 FAIL — không có thông báo · không có dòng mới bảng Affiliate  
**Phạm vi:** Audit + bằng chứng · **không code**

---

## 1. Triệu chứng Owner báo

| Bước | Kết quả |
|------|---------|
| R1.1–1.3 Admin đổi tiêu đề · toggle User không đổi | ✅ PASS |
| R1.4 User B đăng ký qua link giới thiệu A | Đã thực hiện |
| R1.5 User A không thấy thông báo mới có TEST | ❌ FAIL |
| R1.6 Bảng Danh sách thành viên (Affiliate) không có dòng mới | ❌ FAIL |

**Kết luận sơ bộ:** Không phải lỗi template/messaging — **sự kiện referral không xảy ra trên server**.

---

## 2. Bằng chứng Production (Postgres)

### 2.1 Toàn hệ thống — referral & notification chưa từng chạy E2E

```sql
-- 15 user · chỉ 1 user có referred_by
SELECT COUNT(*) AS total, COUNT(referred_by) AS with_referrer FROM users;
-- total=15, with_referrer=1

-- Không có bản ghi referral notification nào từ trước đến nay
SELECT COUNT(*) FROM user_inbox_notifications
WHERE template_code = 'AFFILIATE_REFERRAL_SUCCESS';
-- 0
```

### 2.2 User đăng ký gần nhất (khớp thời điểm test ~12:41)

| Field | Giá trị |
|-------|---------|
| email | `trungpv.gpg@gmail.com` |
| created_at | **2026-07-28 12:41:02+07** |
| auth_provider | **google** |
| referral_code | IFLJGWZN |
| **referred_by** | **NULL** |

→ Backend **không ghi** ai giới thiệu user này.

### 2.3 Trường hợp referral duy nhất từng thành công (lịch sử)

| User | referred_by | auth_provider | created_at |
|------|-------------|---------------|------------|
| phamvan3@gmail.com | phamvan@gmail.com (IFL9552M) | email | 2026-07-06 |

→ Trước khi Notification Platform live (28/07) · vẫn **0** notification server cho case này.

### 2.4 Platform sẵn sàng — không phải blocker

| Check | Kết quả |
|-------|---------|
| `notification_types` AFFILIATE_REFERRAL_SUCCESS | enabled=true, group_label=Affiliate |
| `notification_templates` in_app | có title (Owner đã sửa) |
| `user_notification_type_preferences` | 0 row (default ON) |

### 2.5 OTP pending gần đây — referral_code không vào payload

```json
{"referred_by": null, ...}  // 3 row email_verification_otps gần nhất
```

---

## 3. Chuỗi nhân quả (root cause chain)

```text
User B đăng ký
  → users.referred_by = NULL          ← ĐIỂM GÃY
  → notifyReferralSignupF0Safe skip (reason: no_referrer)
  → user_inbox_notifications: 0 row
  → getAffiliateSync: không có edge A→B
  → Bảng Danh sách thành viên User A: không có dòng mới
  → Chuông User A: không có thông báo
```

Code backend (`referral-signup.consumer.js`):

```javascript
if (!newUserId || !referredById) return { skipped: true, reason: 'no_referrer' };
```

**R1 bước 5–6 FAIL là hệ quả của attribution signup FAIL — không phải lỗi render template.**

---

## 4. Nguyên nhân gốc (ranked)

### RC-1 · PRIMARY — Referral không gắn vào `users.referred_by` lúc signup

Mọi downstream (notification + bảng thành viên server sync) phụ thuộc field này.

**Evidence:** 14/15 user Production `referred_by IS NULL` · user test hôm nay NULL.

---

### RC-2 · HIGH — User B đăng ký bằng Google · mã giới thiệu có thể không gửi API

**Evidence DB:** `trungpv.gpg@gmail.com` · `auth_provider = google`.

Luồng social backend chỉ set referrer khi request có `referral_code`:

```javascript
// auth.service.js socialLoginOrRegister
const referredBy = await resolveReferrer(payload.referral_code);
user = await createSocialUser(provider, profile, referredBy);
```

Trang đăng ký gọi:

```javascript
// auth-register-init.js
IfluxAuthSocial.initPage({
  referral_code: getEffectiveRefCode(),  // ← evaluate MỘT LẦN lúc load trang
  ...
});
```

**Gap UX/code (audit, chưa sửa):**

| Cách đăng ký | Mã giới thiệu lấy từ đâu |
|--------------|---------------------------|
| Email + nút Đăng ký | `collectRegistrationDraft()` — đọc ô input **lúc bấm** |
| Google / Apple / FB / Zalo | `opts.referral_code` — **đóng băng lúc load trang** |

→ Nếu Owner mở form đăng ký trước · **gõ mã tay sau** · bấm Google → API **không nhận** mã.

**Google One Tap** (mọi trang, không phải register):

```javascript
// google-onetap.js
IfluxAuth.loginWithSocial('google', { id_token: ... }, {})  // referral_code rỗng
```

→ Đăng ký nhanh bằng One Tap **không bao giờ** gửi referral.

---

### RC-3 · HIGH — Link giới thiệu dạng cũ `?ref=` không còn capture (P5)

**HTTP evidence (curl Production):**

| URL | Kết quả |
|-----|---------|
| `https://iflux.vn/IFL9552M` | 200 · load affiliate-resolver |
| `https://iflux.vn/home?ref=IFL9552M` | 301 → `/nha-cua-toi?ref=...` · **không parse path** |
| `https://iflux.vn/MINH10` | **404** |

P5 SoT (`14-P5-Pre-Implementation-Audit.md`): **DELETE** mọi capture `?ref=` · chỉ còn `/{publicId}/…`.

→ Copy link kiểu cũ / bookmark cũ → **không gắn mã** → signup không referrer.

---

### RC-4 · MEDIUM — Một số tài khoản có mã legacy không tạo được link path

| User | referral_code | buildReferralLink() |
|------|---------------|---------------------|
| minh@iflux.vn | **MINH10** | **''** (regex yêu cầu `IFL…`) |
| phamvan@gmail.com | IFL9552M | `https://iflux.vn/IFL9552M` ✅ |

→ Nếu User A dùng tài khoản MINH10 · UI có thể không có link hợp lệ để share.

---

### RC-5 · LOW (loại trừ) — Preference / template / dispatcher

| Check | Kết luận |
|-------|----------|
| Type disabled | ❌ enabled |
| User tắt AFFILIATE_REFERRAL_SUCCESS | ❌ chưa có row preference · default ON |
| Template missing | ❌ có in_app template |
| Dispatcher bug khi có referred_by | ❌ chưa có case test · hook skip trước dispatch |

---

## 5. Bảng thành viên — vì sao cũng trống?

Bảng User A đọc qua `getAffiliateSync` → merge `users.referred_by` từ Postgres.

```javascript
// profile-affiliate.js
Store.syncFromServerAsync(user.id).finally(paint);
// listNetworkMembers ← parentsMap từ server
```

**Không phải bug riêng bảng UI** — cùng root cause `referred_by NULL`.

Client-only `localStorage` (`applyReferrerToUser`) **không** đủ cho User A xem trên máy khác / sau sync server.

---

## 6. Kết luận audit

| ID | Kết luận |
|----|----------|
| **A** | R1/R3 FAIL vì **referral attribution không ghi DB** — không phải vì Admin template |
| **B** | Production **chưa từng** có 1 notification `AFFILIATE_REFERRAL_SUCCESS` thành công |
| **C** | Test hôm nay khớp user Google mới **12:41** · `referred_by = NULL` |
| **D** | Khả năng cao: link/mã không tới API lúc Google signup (RC-2/3/4) |

**D5 R1/R2/R3: BLOCKED** cho đến khi có **1 lần signup referral E2E** chứng minh `referred_by` + inbox + bảng.

---

## 7. Owner clarification (2026-07-28 ~12:59)

**Không phải A (One Tap) · không phải B (form Đăng ký).**

Luồng thực tế:

```text
1. Trình duyệt ẩn danh → mở link /IFL...
2. Không thấy popup Google
3. Bấm「Đăng nhập」header
4. Đăng nhập bằng Google → thành công
5. User A: không thông báo · không dòng bảng Affiliate
```

**Phân loại: Path C — Trang Đăng nhập + Google (tài khoản Google mới).**

| Path | UI | Gửi referral_code API? |
|------|-----|------------------------|
| A | One Tap popup | ❌ |
| B | Trang **Đăng ký** + Google | ✅ (nếu ô mã khóa) |
| **C** | Trang **Đăng nhập** + Google | **❌ không bao giờ** |

Evidence code — `auth-login-init.js`:

```javascript
IfluxAuthSocial.initPage({
  onSuccess: socialAuthSuccess,
  onError: socialAuthError
  // không có referral_code
});
```

So với trang Đăng ký (`auth-register-init.js`) có `referral_code: getEffectiveRefCode()`.

Backend tạo user mới qua `/auth/social` chỉ gắn referrer khi body có `referral_code` → Path C → `referred_by = NULL` → khớp DB user test `trungpv.gpg@gmail.com`.

**Lưu ý UX:** Google lần đầu qua「Đăng nhập」vẫn **tạo tài khoản mới** (backend `isNew=true`) nhưng **không coi là luồng giới thiệu** vì login page không đọc mã đã lưu từ link `/IFL...`.

---

## 8. Cách test lại (Owner — không cần DevTools)

### Bước A — Chuẩn bị User A

1. Vào **Tài khoản → Affiliate** · copy link giới thiệu.
2. **Bắt buộc** link dạng `https://iflux.vn/IFLxxxxxx` (có **IFL** đầu mã).
3. Nếu ô link **trống** hoặc mã kiểu `MINH10` → đổi sang tài khoản có mã `IFL…` (vd. IFL9552M).

### Bước B — User B (trình duyệt ẩn danh)

1. Mở **đúng link** `/IFLxxxxxx` (không dùng `?ref=`).
2. Trang load bình thường (Cộng đồng / Nhà).
3. **Không** bấm「Đăng nhập」header — luồng đó **không** gắn referral.
4. Vào **Đăng ký** (`/dang-ky`) → tab Email hoặc icon Google **trên form đăng ký**.
5. Kiểm tra ô mã giới thiệu **đã khóa/điền sẵn** mã IFL.
6. Hoàn tất (OTP nếu email · hoặc Google **trên form đăng ký**).

### Bước C — User A kiểm tra

1. Chuông → có thông báo mới (tiêu đề có TEST nếu đã sửa Admin).
2. Tài khoản → Affiliate → Bảng có **1 dòng** thành viên mới.

### FAIL nhanh nếu

- B bấm **「Đăng nhập」** header rồi Google (Path C — **không test referral**).
- B dùng **Google One Tap** popup (nếu có).
- Link dạng `?ref=` hoặc `/MINH10`.
- B email/Google đã tồn tại (chỉ login · không tạo user mới lần đầu).

---

## 9. Evidence log

| Nguồn | Timestamp | Ghi chú |
|-------|-----------|---------|
| Postgres `users` | 2026-07-28 audit | 15 users · 1 referred_by · trungpv NULL |
| Postgres `user_inbox_notifications` | 2026-07-28 audit | 0 AFFILIATE_REFERRAL_SUCCESS |
| curl iflux.vn | 2026-07-28 | IFL9552M=200 · MINH10=404 · ?ref=301 |
| PM2 iflux-api logs | 2026-07-28 | NO_REFERRAL_LOGS (80 dòng) |

---

**Task pack (Affiliate Attribution Capability):** [00-Audit-D5-R1-Referral-Failure.md](../Affiliate%20Attribution%20Capability/00-Audit-D5-R1-Referral-Failure.md) · [README](../Affiliate%20Attribution%20Capability/README.md)

**Fix plan:** [00-Plan-Owner-Review.md](../Affiliate%20Attribution%20Capability/00-Plan-Owner-Review.md)
