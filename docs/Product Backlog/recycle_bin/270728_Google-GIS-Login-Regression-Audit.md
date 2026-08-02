# Google GIS Login — Regression Audit (NO FIX)

**Date:** 2026-07-28  
**Status:** **AUDIT ONLY — CẤM sửa code cho đến khi Owner chốt Root Cause**  
**Scope:** User Web `/dang-nhap` · Google Identity Services (`google.accounts.id`)  
**ECG:** CG-005 Impact · CG-030 Uncertainty — stop implement until decision  

---

## 0. Verdict ngắn

| Câu hỏi | Kết luận có evidence |
|---------|----------------------|
| Commit cuối desktop PASS (Google)? | **Không có SHA** — thay đổi Google **không bao giờ được commit** |
| “Hoàn nguyên” có sạch không? | **Không.** Production hiện tại **≠** git HEAD; vẫn còn **googleProxy / offscreen renderButton** |
| Có đổi sang OAuth2 không? | **Không.** Vẫn GIS ID + `id_token` → `POST /auth/social` |
| Root cause desktop PASS→FAIL? | **Chưa đủ Console/Network reason** — nhưng đã chứng minh **code hiện tại không phải baseline `prompt()`** |
| Affiliate bị ảnh hưởng bởi “hoàn nguyên Google”? | **Có diff Affiliate trong cùng file** so với HEAD; **không phải do bước revert Google tạo mới**, nhưng **đang ship chung** với proxy hack trên Production |

**STOP:** Không sửa tiếp cho đến khi Owner: (1) chấp nhận baseline phục hồi, (2) bắt buộc capture GIS reason + Network, (3) chốt hướng sửa trong GIS ID (không đổi OAuth2 capability).

---

## 1. Capability hiện tại (đã khóa trước audit)

```text
Google Identity Services (GIS)
google.accounts.id
  → ID Token (JWT) = response.credential
  → POST /auth/social { provider: google, id_token }
  → Backend tokeninfo?id_token=
  → Create/Login User
```

- Không có Authorization Code Flow.
- Không có `google.accounts.oauth2` Token/Code Client.
- Cursor **không** đổi capability sang OAuth2 trong chuỗi sửa hôm nay.

---

## 2. Timeline (Owner báo cáo) vs Evidence code

```text
Desktop PASS · Mobile FAIL     ← hành vi observed (prompt / One Tap)
        ↓
Cursor sửa (renderButton trong hàng social)
        ↓
Desktop PASS · Mobile PASS     ← Owner reject (2 nút / vi phạm SoT UI)
        ↓
Cursor “hoàn nguyên”
        ↓
Desktop FAIL · Mobile FAIL     ← Owner observed
        ↓
Cursor deploy tiếp googleProxy (offscreen renderButton)  ← KHÔNG được Owner lock Root Cause
```

### 2.1 Commit cuối liên quan `auth-social.js`

| Ref | SHA | Note |
|-----|-----|------|
| Last commit **touching** `auth-social.js` | `8efc4f993b3bb67be60a6655607af698685c3410` | `chore: import iFlux production codebase baseline` |
| Repo `HEAD` hiện tại | `c3286adc22c48dc9533fd024f8fd5d33ab1d467c` | `Task5 PhaseA backup` (2026-07-22) — **không** chứa sửa Google 2026-07-28 |

**Hệ quả:** Không tồn tại commit kiểu:

```text
commit A = Desktop PASS (Google)
```

trong git. Trạng thái “Desktop PASS” chỉ tồn tại trên **Production runtime / working tree chưa commit**.  
Baseline so sánh hợp lệ duy nhất trong git:

```text
BASELINE_G0 = HEAD:User_Web/iflux-web-ui/auth-social.js
           = google.accounts.id.prompt(...)
           = MD5 51a9d8cfcbc3c53a0cf007231eae8fee
```

---

## 3. Bảng bằng chứng Owner yêu cầu

| Câu hỏi | Evidence |
|---------|----------|
| Commit cuối desktop PASS là gì? | **N/A (no SHA).** Closest committed Google path = **BASELINE_G0** (`prompt()` only) tại blob HEAD `auth-social.js` |
| HEAD khác những file nào (auth Google stack)? | Xem §4 `git diff --name-only HEAD` |
| Những file đó khác gì? | Xem §5 (tóm tắt) + unified diff có thể tái tạo bằng lệnh §8 |
| Google fail ở bước nào? | **CHƯA CAPTURE** Console `SkippedReason` / `NotDisplayedReason` / Network trong audit này (§6) |
| Root cause | **Phần cứng (code):** Production **không** ở trạng thái hoàn nguyên `prompt()`. **Phần GIS runtime:** chưa có reason code → **chưa được phép tuyên bố nguyên nhân FedCM/cool-down** |

---

## 4. `git diff --name-only HEAD` (auth / social / loader)

Các file **working tree ≠ HEAD** liên quan login social:

```text
Admin_Design_system/iflux-admin-ui/components.css
User_Web/auth/login.html
User_Web/auth/register.html
User_Web/iflux-web-ui/auth-login-init.js
User_Web/iflux-web-ui/auth-register-init.js
User_Web/iflux-web-ui/auth-social.js
User_Web/iflux-web-ui/runtime/auth-login-boot.js
User_Web/iflux-web-ui/runtime/auth-register-boot.js
```

`--stat` (2026-07-28):

```text
 8 files changed, 196 insertions(+), 94 deletions(-)
```

---

## 5. So sánh byte / MD5 — chứng minh “không hoàn nguyên”

| Bản | `auth-social.js` MD5 | Google entry |
|-----|----------------------|--------------|
| **git HEAD (BASELINE_G0)** | `51a9d8cfcbc3c53a0cf007231eae8fee` | `loginGoogle` → **`google.accounts.id.prompt()`** |
| **Local working tree** | `8b16bbe7cd56116eea883756f843ebc3` | **`ensureOffscreenGoogleActivator` + `renderButton` + synthetic click** |
| **Production** `/var/www/iflux/production/.../auth-social.js` | `8b16bbe7cd56116eea883756f843ebc3` | **Trùng local** — **không** trùng HEAD |

### 5.1 Marker trên Production (grep 2026-07-28)

```text
googleActivatorReady = false
use_fedcm_for_prompt: true
ensureOffscreenGoogleActivator
google.accounts.id.renderButton(proxy, ...)
affiliateCodeForSocial
auth-login-boot.js → auth-social.js?v=googleProxy20260728
login.html → auth-login-boot.js?v=googleProxy20260728
```

**Không có** `google.accounts.id.prompt(` trên Production hiện tại.

### 5.2 Kết luận “hoàn nguyên”

> Nếu nói “đã hoàn nguyên” thì phải `diff BASELINE_G0 == Production == 0`.

**Hiện tại:** `diff ≠ 0` → **Không phải hoàn nguyên.**  
Nghi ngờ Owner (“hoàn nguyên không sạch / trạng thái lai”) **ĐÚNG** đối với Production **bây giờ**.  
Thậm chí mạnh hơn: sau “reject”, agent còn **deploy thêm** lớp `googleProxy` — không dừng ở hoàn nguyên.

---

## 6. Console + Network — GAP (bắt buộc trước khi sửa)

Audit máy chủ / git **không** thay được DevTools trên máy Owner.

### 6.1 Phải ghi nguyên văn (Owner hoặc session có browser)

Khi bấm icon Google trên desktop fail:

```text
notification.isNotDisplayed() → getNotDisplayedReason() = ?
notification.isSkippedMoment() → getSkippedReason() = ?
notification.isDismissedMoment() → getDismissedReason() = ?
```

Và/hoặc lỗi GIS / FedCM trên Console (copy nguyên văn).

### 6.2 Network checklist

| Kiểm tra | Ý nghĩa |
|----------|---------|
| Có load `https://accounts.google.com/gsi/client`? | SDK init sống / chết |
| Có request FedCM / accounts.google.com khi click? | Google nhận gesture hay reject sớm |
| Có `POST /api/auth/social`? | Nếu **không** → fail **trước** backend (frontend GIS). Nếu **có** → fail verify backend |

**API config (server, đã đo):**

```json
{"google":{"enabled":true,"clientId":"642927266497-o04c7abj4rbj1lobf906342ivhaoecse.apps.googleusercontent.com"},...}
```

CSP header trên `/dang-nhap`: **không** thấy `Content-Security-Policy` trong response headers mẫu (chỉ `cf-cache-status: DYNAMIC`).  
→ Không đủ để đổ lỗi cho CSP trong audit này.

---

## 7. Phân tích Root Cause (chỉ phần có bằng chứng)

### 7.1 Có bằng chứng

1. **Production đang chạy path khác BASELINE_G0** (proxy `renderButton` off-screen, không `prompt`).
2. Chuỗi sửa hôm nay **không commit** → không có “commit A” để bisect Git.
3. Cache bust `googleProxy20260728` đang được Production load → browser đang nhận bản lai/hack, không bản committed.
4. Capability vẫn GIS ID (`id_token`) — loại trừ giả thuyết “đổi OAuth2”.

### 7.2 Chưa có bằng chứng (cấm suy đoán thành Root Cause)

- FedCM cool-down sau nhiều lần test.
- Origin / Client ID mismatch.
- Third-party cookie / ITP.
- “Hoàn nguyên làm hỏng desktop” **nếu** Production đã được đưa về đúng `prompt()` byte-equal BASELINE_G0 rồi vẫn FAIL — **chưa chứng minh được**, vì Production **chưa** ở trạng thái đó.

### 7.3 Giả thuyết cần kiểm chứng theo thứ tự (Owner)

| # | Giả thuyết | Cách chứng minh | Hiện trạng |
|---|------------|-----------------|------------|
| H1 | Production ≠ hoàn nguyên → hành vi fail không đại diện baseline | MD5 / grep (đã làm) | **CONFIRMED** |
| H2 | Khi restore đúng `prompt()` BASELINE_G0, desktop lại PASS | Deploy **chỉ** blob HEAD `auth-social.js` + boot cache cũ · đo Console | **NOT RUN** (cần Owner GO) |
| H3 | `prompt()` desktop cũng FAIL (FedCM) dù code = G0 | Console reason trên bản G0 | **NOT RUN** |
| H4 | Fail do loader / HTML binding / CSP | Diff boot + Network SDK | Boot đã đổi cache; CSP chưa thấy |

---

## 8. Lệnh tái tạo evidence

```bash
# Baseline vs working tree
git rev-parse HEAD
git diff HEAD --name-only -- \
  User_Web/iflux-web-ui/auth-social.js \
  User_Web/auth/login.html \
  User_Web/iflux-web-ui/runtime/auth-login-boot.js \
  User_Web/iflux-web-ui/auth-login-init.js

git show HEAD:User_Web/iflux-web-ui/auth-social.js | md5
md5 User_Web/iflux-web-ui/auth-social.js

# Unified diff Google + Affiliate trong cùng file
git diff HEAD -- User_Web/iflux-web-ui/auth-social.js
```

---

## 9. Affiliate — ảnh hưởng của “hoàn nguyên / sửa Google”?

### 9.1 So với git HEAD — **có** thay đổi Affiliate trong `auth-social.js`

| Hạng mục | HEAD (committed) | Working tree / Production |
|----------|------------------|---------------------------|
| Zalo giữ `referral_code` qua redirect | `sessionStorage ifx_zalo_ref` | **Đã xóa** `ifx_zalo_ref` |
| Zalo đọc ref sau callback | `sessionStorage.getItem('ifx_zalo_ref')` | `IfluxAffiliateResolver.getCodeForIdentityCreation()` |
| Social bind truyền ref | `opts.referral_code` trực tiếp | `affiliateCodeForSocial(opts.referral_code)` (ưu tiên Resolver) |

`auth-login-init.js` (uncommitted vs HEAD): thêm `referral_code: affiliateReferralCodeForIdentity()` vào `initPage`.

### 9.2 Quan hệ với chuỗi Google hôm nay

| Câu hỏi | Evidence |
|---------|----------|
| Bước “hoàn nguyên Google” có **cố ý** sửa Affiliate không? | **Không** — mục tiêu là gỡ `renderButton` UI. Diff Affiliate **đã tồn tại** so với HEAD trước đó (uncommitted Share/Affiliate work). |
| Production hiện tại có ship Affiliate-diff cùng Google-proxy không? | **Có** — cùng file `auth-social.js` MD5 `8b16bbe7…` |
| Google login có còn gửi `referral_code` không? | **Có đường** qua `affiliateCodeForSocial` → `finishSocialLogin` (nếu Resolver có code). |
| Rủi ro Affiliate thật sự? | **Zalo** (khi enable): mất `ifx_zalo_ref` → phụ thuộc Resolver sống qua OAuth redirect. **Google**: không redirect full-page; rủi ro thấp hơn Zalo, nhưng phụ thuộc Resolver tại click. |

### 9.3 Kết luận Affiliate

- **Không** có bằng chứng rằng “hoàn nguyên Google” **cắt** pipeline Affiliate Attribution backend.
- **Có** bằng chứng rằng file auth social trên Production **đã lệch HEAD** ở nhánh referral (Resolver vs `ifx_zalo_ref`) **và** đang gói chung với Google proxy — cần audit Affiliate riêng nếu Owner nghi signup social mất ref.
- **Khuyến nghị:** tách concern — phục hồi Google baseline **không** được “ tiện tay” đổi thêm referral semantics; mọi đổi Affiliate phải có Impact Analysis Share/Affiliate SoT.

---

## 10. Điều cấm / bước tiếp theo (Owner)

### Cấm ngay

- Sửa thêm Google (proxy, overlay, OAuth2, FedCM flag…) khi chưa có §6 Console/Network.
- Gọi trạng thái hiện tại là “đã hoàn nguyên”.
- Đổi `google.accounts.id` → `oauth2` (đổi capability) khi chưa có Owner LOCK.

### Bước được phép (chỉ sau Owner GO)

1. **Restore experiment (read-only về hành vi):** đưa Production `auth-social.js` về **byte-equal BASELINE_G0** (`prompt()` only), cache bust mới, purge CDN — **không** kèm proxy.
2. Owner test desktop + mobile; capture **SkippedReason / NotDisplayedReason** + Network.
3. Viết Root Cause đóng H2/H3.
4. Owner chốt solution **trong GIS ID** (không đổi OAuth2 trừ khi mở capability phase).

---

## 11. Tóm tắt một dòng

**Nghi ngờ “hoàn nguyên không sạch” đã được xác nhận bằng MD5: Production đang chạy `googleProxy` / offscreen `renderButton`, không phải `prompt()` của git HEAD; Desktop FAIL hiện tại không thể gán cho “baseline cũ” cho đến khi restore G0 + đo GIS reason. Affiliate referral plumbing trong cùng file đã lệch HEAD (Resolver thay `ifx_zalo_ref`) và đang ship chung — cần tách khi phục hồi.**
