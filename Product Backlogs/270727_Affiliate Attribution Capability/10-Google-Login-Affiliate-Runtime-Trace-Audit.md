# Google Login × Affiliate — Runtime Trace Audit (NO FIX)

**Date:** 2026-07-28 ~18:00 ICT  
**Status:** **RUNTIME NOT PROVEN PASS** · Wire path documented · Live Affiliate payload **GAP**  
**Constraint:** Không sửa code · chỉ thu thập evidence  
**Related:** [09-Code-Regression-Audit-After-Google-Login.md](./09-Code-Regression-Audit-After-Google-Login.md)

---

## 0. Verdict Owner hỏi

| Claim cần chứng minh | Kết quả |
|----------------------|---------|
| Click Google → `finishSocialLogin` → `POST /auth/social` **đang xảy ra sau googleProxy** | **KHÔNG chứng minh được PASS** — nginx: **0** `POST /api/auth/social` sau **17:20**; last POST = **17:03:57** · proxy file mtime **17:30** |
| Payload có `referral_code: IFL9552M` | **KHÔNG có evidence** — access log **không** ghi body · backend **không** log `referral_code` |
| `referred_by` + notification sau Google Login (post-proxy) | **KHÔNG có evidence** |
| Wire path *nếu* credential callback chạy | Có (control-flow Production JS) — **không** thay live runtime |

**Một câu:** Code Affiliate còn; **runtime Google→Affiliate sau googleProxy chưa được chứng minh** — và log cho thấy trang login vẫn load (`GET …/social/config`) nhưng **không** thấy `POST /auth/social`.

---

## 1. Trace Owner yêu cầu vs Evidence

```text
Click Google
  ↓
Google callback
  ↓
credential received
  ↓
finishSocialLogin()
  ↓
affiliateCodeForSocial()   ← (thực tế: chạy Ở CLICK, trước callback — xem §2)
  ↓
POST /auth/social { id_token, referral_code }
  ↓
createSocialUser()
  ↓
referred_by
  ↓
notification
  ↓
PASS
```

| Bước | Live evidence? | Ghi chú |
|------|----------------|---------|
| Click Google | Partial | User visits `/dang-nhap` → nhiều `GET /api/auth/social/config` sau 17:20 |
| Google callback / credential | **Không** | Không DevTools capture trong session agent |
| `finishSocialLogin` | **Không** | Suy từ POST; sau 17:20 **không** có POST |
| `affiliateCodeForSocial` | **Không** | Không console / không body log |
| `POST /auth/social` body | **Không** | nginx access không log body |
| Backend `referral_code=` | **Không** | `socialLoginOrRegister` chỉ log `'Social user created'` khi isNew — **không** log referral_code |
| `referred_by` / notification | **Không** (post-proxy) | DB đã purge §12; không E2E Google+ref sau proxy |

---

## 2. Wire trace (Production `auth-social.js` hiện tại — không phải live)

**Chỉ mô tả control-flow nếu mọi bước thành công.** Không phải bằng chứng runtime.

### 2.1 Thứ tự thực tế (quan trọng)

```text
[CLICK #btn-google]
  → affiliateCodeForSocial(opts.referral_code)     // L348–350 — CHẠY Ở ĐÂY
  → runOpts = { referral_code, remember_me }
  → nếu googleActivatorReady:
        startGoogleLoginFromUserGesture(runOpts)   // L353–354
          → gán __ifxOnGoogleCredential
          → clickOffscreenGoogleActivator()        // synthetic click GIS button
               ├─ FAIL → reject "Không mở được cửa sổ Google…"  ❌ KHÔNG finishSocialLogin
               └─ OK → (chờ GIS)
          → [CALLBACK] response.credential
               → finishSocialLogin('google', { id_token }, opts)  // L202 — opts = runOpts đã đóng sẵn
                    → IfluxAuth.loginWithSocial
                         → (nếu thiếu ref) getAffiliateContextCode() lại  // auth.js L1298–1300
                         → IfluxApiClient.authSocial → POST body:
                              { provider, id_token, referral_code, remember_me? }
```

**Hệ quả wire:**

- `affiliateCodeForSocial()` **không** chạy trong callback; chạy **lúc click**, đóng vào `opts`.
- Nếu proxy click **FAIL** sớm → **không bao giờ** `finishSocialLogin` → Affiliate **không** chạy — đúng lo ngại Owner.
- Nếu callback OK → `referral_code` trong `opts` được đưa vào POST (cộng fallback AR trong `loginWithSocial`).

### 2.2 API body construction (`iflux-api-bundle.js`)

```text
body = {
  provider,
  referral_code: opts.referral_code || null,
  id_token: tokens.id_token   // nếu có
}
→ POST /auth/social
```

### 2.3 Backend (nếu body có `referral_code` và user **mới**)

```text
socialLoginOrRegister(body)
  → verifySocialToken(id_token)
  → if !user: resolveReferrer(payload.referral_code)
  → createSocialUser(..., referredBy)
  → emitReferralCreatedAfterIdentityCreated(...)
```

Account **đã tồn tại:** không INSERT `referred_by` — đúng SoT.

---

## 3. Live nginx evidence (2026-07-28)

### 3.1 Timeline

| Time (ICT) | Event |
|------------|-------|
| **17:03:57** | **Last** `POST /api/auth/social` **200** (desktop Chrome · referer `/dang-nhap?return=%2Fcong-dong`) |
| **17:20+** | Nhiều `GET /api/auth/social/config` từ `/dang-nhap`, `/dang-ky`, Zalo in-app… |
| **17:30** | Prod `auth-social.js` mtime = **googleProxy** deploy |
| **17:20 → ~18:00** | **`POST /api/auth/social` count = 0** |

### 3.2 Evidence commands (đã chạy)

```bash
# POST after 17:20 → empty
zgrep -h "POST /api/auth/social " /var/log/nginx/access.log \
  | awk -F'[][]' '$2 >= "28/Jul/2026:17:20:00" {print}'

# Last POSTs
... 17:02:50, 17:03:01, 17:03:57
```

### 3.3 Diễn giải (chỉ trong phạm vi log)

- Trước proxy (≤17:03): Google (hoặc social) **đã** hoàn tất tới `POST /auth/social` **200** ít nhất vài lần.
- Sau cửa sổ proxy / giai đoạn fail: user **vẫn vào** trang login (`GET config`) nhưng **không** quan sát thấy `POST /auth/social`.
- Log **không** chứng minh payload có/không `referral_code` ở các POST 200 trước đó.

**Không suy đoán nguyên nhân duy nhất** (proxy FAIL vs user hủy vs cool-down) — chỉ ghi **thiếu POST**.

---

## 4. Payload + backend log Owner yêu cầu

| Artifact | Status |
|----------|--------|
| `POST /auth/social` body `{ id_token, referral_code: "IFL9552M" }` | **MISSING** — không capture DevTools · nginx không lưu body |
| Backend log `referral_code=IFL9552M` | **MISSING** — code hiện tại **không** emit log field này |
| Referrer `IFL9552M` còn trong DB? | **Không xác minh trong session này** (purge §12 đã xóa users; cần Owner re-seed nếu test lại) |

→ **Không thể** tick PASS cho “Affiliate vẫn chạy qua Google Login” theo tiêu chuẩn Owner đưa.

---

## 5. Separation of Concern (quan sát — không sửa)

`auth-social.js` Production hiện chứa đồng thời:

| Concern | Có trong file? |
|---------|----------------|
| OAuth / GIS init | Có |
| Google workaround (offscreen `renderButton` + synthetic click) | Có |
| Affiliate (`affiliateCodeForSocial` · AR read) | Có |
| UI binding (`bindSocialButtons` · `#btn-*`) | Có |

Đây là **risk kiến trúc** (regression surface), không phải proof runtime fail — nhưng **khớp** lo ngại Owner: sửa Google dễ đụng Affiliate trong cùng file.

---

## 6. Cách đóng PASS (Owner / agent sau này — chưa làm)

Cần **một** lần live có đủ artifact:

1. Re-create User A với `referral_code` biết trước (vd. sau clean-slate).
2. Incognito: mở `https://iflux.vn/{publicId}/…` → Đăng nhập → Google **account mới**.
3. DevTools → Network → `POST /api/auth/social` → copy Request Payload (che `id_token`).
4. SQL: `users.referred_by` của B = id A · inbox A có `AFFILIATE_REFERRAL_SUCCESS`.
5. (Optional) Tạm thời log backend `referral_code` — **chỉ khi Owner mở** (đó là sửa code).

**PASS khi và chỉ khi** có file evidence:

```text
POST body.referral_code = <publicId A>
+ referred_by set
+ notification row
```

---

## 7. Tóm tắt

| Layer | Kết luận |
|-------|-----------|
| Code existence | Đã có (doc 09) — **không đủ** |
| Wire path nếu credential OK | Có `finishSocialLogin(opts)` với `referral_code` đóng từ click |
| Live POST sau googleProxy | **0 observed** |
| Live `referral_code` in body | **Unproven** |
| Affiliate via Google Login runtime | **NOT PASS** |

*Audit runtime — stop. Không implement.*
