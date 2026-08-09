# Incident Audit — Affiliate Google signup không ghi nhận (IFL1QIF9 → IFLBF526)

**Date:** 2026-08-08  
**Environment:** Production (`iflux.vn`)  
**Constraint:** Evidence-only · không bịa · không ship fix trong audit này  
**Trigger Owner:** Test giới thiệu từ `https://iflux.vn/IFL1QIF9/cong-dong` → Google tạo `https://iflux.vn/IFLBF526/cong-dong` · không thông báo · không Affiliate.

---

## 0. Việc đã làm theo yêu cầu Owner

| Hạng mục | Trạng thái |
|----------|------------|
| Hoàn nguyên client “fix” `getActiveOwner` → lại `getCodeForIdentityCreation` | **DONE** trên Production |
| Files revert | `auth-social.js`, `auth-login-init.js`, `google-onetap.js`, boot cache `affSocialOwner20260808` → `gisBtnUi20260730` / `p6Writer20260730` |
| Cloudflare purge | **DONE** (`purge_everything`) |
| Không implement fix mới trong bước này | **Tuân thủ** |

---

## 1. Verdict (1 trang)

### 1.1 Root cause của **lần test này** (khóa được)

```text
Identity Created (IFLBF526) có referred_by = NULL trên server
        ↓
notifyReferralSignupF0 bỏ qua (reason: no_referrer)
        ↓
Không inbox · không bảng Affiliate
```

**Bằng chứng cứng (DB Production, ngay sau sự cố):**

| referral_code | email | auth_provider | referred_by | created_at (UTC) |
|---------------|-------|---------------|-------------|------------------|
| `IFL1TQGM` | gm.tpv9@gmail.com | google | **null** | 2026-08-08 13:00:49 |
| `IFLBF526` | gm.trunggold@gmail.com | google | **null** | 2026-08-08 13:01:12 |

- Toàn DB chỉ còn **2** user (sau wipe trước đó).
- `resolveReferrer('IFL1QIF9')` → **null** (không có hàng `users.referral_code = IFL1QIF9`).
- `resolveReferrer('IFL1TQGM')` → có user `5b101a37-…`.
- `user_inbox_notifications` = **[]**.
- `users` có `referred_by IS NOT NULL` = **0**.
- API log: `Social user created` cho cả 2 id; **không** có dấu hiệu emit referral thành công.

### 1.2 Vì sao Owner “không thấy gì” trên `IFL1QIF9`

**IFL1QIF9 không phải tài khoản introducer hiện hữu trên Production.**

- Introducer sau wipe / signup mới là **`IFL1TQGM`** (nginx + DB khớp).
- URL `IFL1QIF9` vẫn mở được (path decorator không validate user tồn tại) → dễ gây ảo giác “đây là link affiliate của tôi”.
- Kiểm tra notif trên `/IFL1QIF9/...` = kiểm tra identity **không có trong DB** → luôn trống — **không chứng minh** pipeline Affiliate chết toàn cục.

### 1.3 Đánh giá lại “root cause trước đó” (getCodeForIdentityCreation thiếu)

| Kết luận cũ | Đánh giá sau audit |
|-------------|-------------------|
| AR không còn export `getCodeForIdentityCreation` → Google không gửi `referral_code` | **Đúng như nợ kiến trúc** trên path `auth-social` / login-init / onetap |
| Đó là nguyên nhân duy nhất của fail Owner vừa test | **Không đủ / dễ sai** — vì lúc Owner test, Production **đang chạy bản patch `getActiveOwner`**, mà `IFLBF526.referred_by` vẫn null |

→ Patch “đổi sang getActiveOwner” **không chứng minh được** đã sửa attribution; Owner nghi đúng: sửa một điểm có rủi ro tạo cảm giác đã xong khi gap thật vẫn còn.

---

## 2. Timeline nginx (Production) — không suy đoán UI

Cửa sổ tạo 2 user (giờ VN = UTC+7):

| Time | Request | Ý nghĩa |
|------|---------|---------|
| 20:00:30 | Article referer `https://iflux.vn/IFL1QIF9/cong-dong` | Có journey gắn **orphan** `IFL1QIF9` |
| 20:00:37 | `GET /dang-nhap?return=%2Fcong-dong` | Auth zone — **không** prefix IFL trên URL login |
| 20:00:49 | `POST /api/auth/social` → tạo **IFL1TQGM** | Introducer thật |
| 20:00:49 | `GET /IFL1TQGM/cong-dong` | Self URL sau login |
| 20:01:02 | `GET /IFL1TQGM/cong-dong` | Invitee (hoặc tab khác) mở link introducer **đúng mã** |
| 20:01:05 | `GET /dang-nhap?return=%2Fcong-dong` referer `…/IFL1TQGM/cong-dong` | Vào login từ link đúng |
| 20:01:12 | `POST /api/auth/social` → tạo **IFLBF526** | Invitee · `referred_by` vẫn null |
| 20:01:13 | `GET /IFLBF526/cong-dong` | Self URL invitee |
| 20:01:26+ | Introducer xem `/IFL1TQGM/tai-khoan` + `/api/notifications` = rỗng | Khớp DB |

**Không thấy** `POST /api/auth/social` từ URL có prefix `/IFL…/dang-nhap` — đúng thiết kế: auth zone loại khỏi decorate (`shell-url-writer.isApplicationZone` + `IfluxRoutes` zone `auth`).

---

## 3. Pipeline Attribution (hiện trạng code + gap)

### 3.1 Server (authority) — OK theo contract

```text
POST /auth/social { referral_code }
  → socialLoginOrRegister
      → chỉ khi user MỚI: referredBy = resolveReferrer(referral_code)
      → createSocialUser(..., referredBy)
      → emitReferralCreatedAfterIdentityCreated({ referredById })
          → notifyReferralSignupF0: if (!referredById) skip
```

File: `backend/src/modules/legacy-auth/auth.service.js`  
Consumer: `backend/src/modules/notifications/referral-signup.consumer.js`

Server **không** tự lấy Active Owner từ URL. Không có `referral_code` resolvable → `referred_by` null → **không notif**. Đây là kết quả quan sát được.

### 3.2 Client paths (lệch nhau — gap chính)

| Path | Có load trên `/dang-nhap`? | Nguồn `referral_code` | Trạng thái |
|------|---------------------------|------------------------|------------|
| `IfluxSocialLoginUseCase` | **Không** (không có trong `auth-login-boot.js`) | `IfluxIdentityContext.getActiveOwner()` | Đúng SoT V2 · **không được nối** vào login page |
| `IfluxAuthSocial` + `auth-login-init` | **Có** | `IfluxAffiliateResolver.getCodeForIdentityCreation()` | API **không còn export** trên AR (export: `readActive`, `resolve`, `clearContext`, …) → luôn falsy |
| Patch tạm `getActiveOwner` trong auth-social (đã revert) | Có (lúc test) | `getActiveOwner()` | Nguồn đúng hơn · **vẫn không cứu được** incident này (DB vẫn null) |

AR export hiện tại (Production + local) **không** có `getCodeForIdentityCreation` — confirmed bằng đọc `affiliate-resolver.js` cuối file.

### 3.3 Identity Context persistence

- PNC lưu **`sessionStorage`** key `iflux_pnc_domain_v1` (không phải localStorage).
- Login URL không mang prefix IFL → phụ thuộc sessionStorage còn Active Owner sau khi rời `/IFL…/cong-dong`.
- Nginx inject đủ AR + navigation-context + pnc-lifecycle trên `/dang-nhap` (verified HTML).

### 3.4 Gap còn mở (không bịa body request)

Nginx access log **không** ghi body JSON. Không thể khẳng định 100% payload `referral_code` lúc 20:01:12 là:

- `null` / thiếu, **hay**
- `IFL1QIF9` (orphan → `resolveReferrer` null), **hay**
- `IFL1TQGM` (lẽ ra resolve được — nếu vậy phải có bug server; **không thấy evidence** server bỏ qua khi code hợp lệ).

**Khóa tối thiểu không gap logic:**

1. Outcome server: `referred_by = null` ⇒ không notif.  
2. Introducer URL Owner đang nhìn (`IFL1QIF9`) **không map** user.  
3. Login Google trên `/dang-nhap` **không** đi UseCase đúng SoT; path đang dùng API chết `getCodeForIdentityCreation` (sau revert = trạng thái trước patch).  
4. Patch `getActiveOwner` đã live trong lúc fail ⇒ **không được** tuyên bố “chỉ thiếu getCode…” là đủ cho incident này.

---

## 4. Liên quan “sửa Thị trường / App Shell”

| Nghi ngờ | Evidence |
|----------|----------|
| Module Thị trường ghi đè Affiliate | **Không** — không đụng `users.referred_by` / social auth trong thao tác sector |
| Menu App Shell làm mất affiliate | **Không chứng minh** — shell scripts absolute; fail nằm ở Identity Created payload |
| path-base skip `<base>` cho `/admin/*` | Liên quan Admin empty pages (task khác) · **không** giải thích `referred_by` null |

---

## 5. Phân loại nguyên nhân (Owner decision frame)

| ID | Lớp | Mô tả | Severity | Đã chứng minh? |
|----|-----|-------|----------|----------------|
| **RC-A** | Data / Identity | Owner kiểm tra `IFL1QIF9` trong khi introducer thật = `IFL1TQGM`; `IFL1QIF9` orphan sau wipe | High (đúng triệu chứng “không thấy”) | **YES** |
| **RC-B** | Wiring | `/dang-nhap` Google dùng `auth-social` + `getCodeForIdentityCreation` (dead) · UseCase `getActiveOwner` không boot | High (structural) | **YES** |
| **RC-C** | Residual | Dù patch `getActiveOwner` live, signup invitee vẫn `referred_by` null — cần bắt body/network lần test sạch | High | **PARTIAL** (outcome yes · payload no) |

**Không được gộp RC-B thành “đã fix xong” khi RC-C còn mở.**

---

## 6. Điều kiện tái hiện sạch (để khóa RC-C — chưa chạy trong audit)

1. Wipe / dùng 2 browser profile sạch (không sessionStorage PNC cũ).  
2. Browser A: Google signup → ghi lại `referral_code` Self thật (vd `IFLxxxxx`).  
3. Browser B: mở đúng `https://iflux.vn/{SelfA}/cong-dong` → Đăng nhập → Google.  
4. DevTools → `POST /api/auth/social` → chụp request JSON `referral_code`.  
5. SQL: `SELECT referral_code, referred_by FROM users WHERE referral_code = '{SelfB}'`.  
6. Inbox A: có / không `AFFILIATE_REFERRAL_SUCCESS`.

Chỉ khi có body + SQL cùng lúc mới đóng RC-C không hở.

---

## 7. Khuyến nghị bước tiếp (chờ Owner chốt — chưa code)

1. **Không** ship lại patch “chỉ đổi getActiveOwner trong auth-social” như đủ.  
2. Impact Analysis: một Identity Creation path duy nhất trên `/dang-nhap` = `SocialLoginUseCase.readActiveOwnerOnce` (hoặc tương đương SoT V2), xóa dual path dead `getCodeForIdentityCreation`.  
3. UX/ops: sau wipe user, bắt buộc clear `sessionStorage iflux_pnc_domain_v1` + không dùng URL orphan.  
4. Optional product: reject / soft-warn path `/IFL…` khi publicId không tồn tại (tránh ảo giác affiliate).  
5. Re-test theo §6 trước khi tuyên bố PASS.

---

## 8. Inventory evidence

| Nguồn | Nội dung |
|-------|----------|
| Postgres Production | 2 users · both `referred_by` null · no `IFL1QIF9` |
| `pm2` log | `Social user created` ×2 |
| nginx `access.log` | Timeline §2 |
| `affiliate-resolver.js` | Không export `getCodeForIdentityCreation` |
| `auth-login-boot.js` | Không load `social-login-usecase.js` |
| `social-login-usecase.js` | Đọc `getActiveOwner` đúng · không wired |
| Revert Production | §0 |

---

*Audit đóng vòng chứng minh outcome + wiring + orphan identity. Payload HTTP body của POST 20:01:12 để trống có chủ đích (log không lưu) — ghi rõ ở RC-C.*

---

## 9. Retest sạch 2026-08-08 20:16 VN — RC-C / RC-B LOCKED

**Owner path:** [`/IFL1TQGM/cong-dong`](https://iflux.vn/IFL1TQGM/cong-dong) → Google → [`/IFLJAIXO/cong-dong`](https://iflux.vn/IFLJAIXO/cong-dong) · introducer vẫn 0.

| Evidence | Giá trị |
|----------|---------|
| Nginx | `20:16:00` `GET /IFL1TQGM/cong-dong` → `GET /dang-nhap?return=%2Fcong-dong` → `20:16:10` `POST /api/auth/social` referer dang-nhap → `GET /IFLJAIXO/cong-dong` |
| DB `IFLJAIXO` | `hoadon.odc@gmail.com` · google · **`referred_by = null`** · created `13:16:10Z` |
| Inbox | vẫn `[]` |
| Client lúc retest | đã **revert** → `auth-social` gọi `getCodeForIdentityCreation` (**không tồn tại trên AR**) |

**Kết luận khóa:** Trên path Login page Google hiện tại, `referral_code` **không được gửi** (dead API). Server tạo user mới đúng nhưng không có referrer → không notif / không Affiliate. Không còn phụ thuộc orphan `IFL1QIF9`.
