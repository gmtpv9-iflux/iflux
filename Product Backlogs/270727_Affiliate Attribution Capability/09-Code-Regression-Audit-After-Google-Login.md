# Affiliate Capability — CODE Regression Audit (vs Google Login edits)

**Date:** 2026-07-28 ~17:50 ICT  
**Scope:** CODE only — không audit docs  
**Baseline Owner hỏi:** “ngay sau Affiliate E2E PASS”  
**E2E controlled API+SQL:** 2026-07-28 ~13:47 ICT ([07-Post-Implementation-Audit-Exit-Evidence.md](./07-Post-Implementation-Audit-Exit-Evidence.md) §9)  
**Google Login edits trên Production:** `auth-social.js` mtime **17:30** · `auth-login-boot.js` **17:29**

---

## 0. Giới hạn bằng chứng (bắt buộc nói rõ)

| Hạng mục | Evidence |
|----------|----------|
| Git SHA “sau Affiliate E2E PASS” | **KHÔNG CÓ** — `git ls-files` task pack trống · thay đổi Affiliate code **uncommitted** |
| Backup file `auth-social.js` lúc 13:47 | **KHÔNG CÓ** trong `_bak/` / git |
| Live E2E referral DB rows | **KHÔNG CÒN** — Exit Evidence §12 purge users `16 → 0` sau E2E |
| So sánh byte-to-byte `auth-social.js` ↔ file E2E | **KHÔNG THỰC HIỆN ĐƯỢC** (thiếu artifact) |

**Baseline thay thế dùng trong báo cáo này (có bằng chứng):**

| Label | Định nghĩa | Evidence |
|-------|------------|----------|
| **FROZEN_E2E_CLIENT** | File Production có **mtime ≤ 13:39** và **không** redeploy trong phiên Google | `ls --time-style=long-iso` trên Production |
| **AFF_ERA_RECON** | Bản `auth-social.js` suy ra bằng cách **gỡ** các hunk Google proxy khỏi bản hiện tại | Diff §4 — mọi dòng thêm/bớt so với current đều mang marker Google |
| **HEAD** | `git show HEAD:User_Web/iflux-web-ui/auth-social.js` | Commit baseline import — **trước** Affiliate wiring |

---

## 1. Inventory code Affiliate (từ Exit Evidence §1.1 chain)

| File | Vai trò | Tồn tại Local? | MD5 Local = Prod? | Prod mtime | Bị Google session đụng? |
|------|---------|----------------|-------------------|------------|-------------------------|
| `User_Web/iflux-web-ui/runtime/affiliate-resolver.js` | Capture + `getCodeForIdentityCreation` | Có | **Có** `d2dcd7ea…` | **2026-07-28 13:23** | **Không** (mtime trước Google) |
| `User_Web/iflux-web-ui/auth-login-init.js` | Thin wiring login → AR | Có | **Có** `4d3a5bc3…` | **13:23** | **Không** |
| `User_Web/iflux-web-ui/auth-register-init.js` | Thin wiring register → AR | Có | **Có** `bd7741f7…` | **13:39** | **Không** |
| `User_Web/iflux-web-ui/google-onetap.js` | Thin wiring One Tap → AR | Có | **Có** `44aa6a1a…` | **13:23** | **Không** |
| `User_Web/iflux-web-ui/auth-social.js` | OAuth click re-read AR | Có | **Có** `8b16bbe7…` | **17:30** | **Có** |
| `User_Web/iflux-web-ui/auth.js` | Inject `referral_code` nếu thiếu | Có | **Có** `94d756bc…` | **16:00** | **Không trong Google deploy list**; mtime sau E2E — **ngoài phiên Google Login đã liệt kê** |
| `User_Web/iflux-web-ui/loyalty-affiliate-store.js` | Delegate → AR | Có | **Có** `611d1ace…` | **15:44** | **Không trong Google deploy list** |
| `User_Web/iflux-web-ui/runtime/auth-login-boot.js` | Loader cache-bust | Có | **Có** `6bfb1c9f…` | **17:29** | **Có** (cache `googleProxy20260728`) |
| `User_Web/iflux-web-ui/runtime/auth-register-boot.js` | Loader cache-bust | Có | **Có** `34755210…` | (deploy cùng phiên) | **Có** |
| `backend/.../legacy-auth/auth.service.js` | INSERT `referred_by` + emit | Có | **Có** `0fc4fa0e…` | (backend path) | **Không** (Google session chỉ frontend) |
| `backend/.../notifications/referral-signup.consumer.js` | F0 notify | Có | **Có** `2d0c01e7…` | — | **Không** |

**Deploy list phiên Google Login (agent transcript / rsync):**  
`auth-social.js` · `auth-login-boot.js` · `auth-register-boot.js` · `login.html` · `register.html` · `components.css`  
→ **Không** gồm `affiliate-resolver.js` · `auth-login-init.js` · `auth-register-init.js` · `google-onetap.js` · `auth.service.js`.

---

## 2. Bảng Owner yêu cầu (CODE)

| Capability | Kết quả | Evidence |
|------------|---------|----------|
| `affiliate-resolver.js` | **Còn · MD5 ổn định từ 13:23** | Prod mtime 13:23 · MD5 `d2dcd7ea…` Local=Prod · **không** có SHA E2E vì uncommitted |
| `auth-social.js` (Affiliate section) | **Affiliate hunks còn** · file **khác** bản `prompt()`-only vì Google proxy | §3–§4 |
| `auth-login-init.js` | **Diff vs Prod E2E-era = 0** (file không redeploy) | mtime 13:23 · MD5 match · vẫn gọi `getCodeForIdentityCreation` L139–149 |
| `auth-register-init.js` | **Diff vs Prod E2E-era = 0** | mtime 13:39 · MD5 match · L3–4 `getCodeForIdentityCreation` |
| `getCodeForIdentityCreation` | **Grep PASS** — còn định nghĩa + call sites | §5 |
| `applyReferrerToUser` | **0** matches `User_Web` | `rg` → COUNT=0 |
| `storeRefCode` | **0** matches `User_Web` | `rg` → COUNT=0 |
| `ifx_zalo_ref` | **0** matches `User_Web`+`backend` | `rg` → COUNT=0 |
| E2E referral live DB | **Không chứng minh được hôm nay** | §12 purge · users = 0 |

---

## 3. `auth-social.js` — so với HEAD vs Google vs Affiliate

### 3.1 Marker counts

| Marker | HEAD (git) | Current / Prod |
|--------|------------|----------------|
| `ifx_zalo_ref` | **3** | **0** |
| `affiliateCodeForSocial` | **0** | **2** |
| `IfluxAffiliateResolver` | **0** | **6** |
| `getCodeForIdentityCreation` | **0** | **4** |
| `googleActivatorReady` / `ensureOffscreen…` / `ifx-google-auth-proxy` | **0** | **>0** |
| `google.accounts.id.prompt` | **có** | **không** (đã thay bằng proxy path) |
| `google.accounts.id.renderButton` | **0** | **có** (off-screen proxy) |

### 3.2 Phân loại hunk: HEAD → AFF_ERA_RECON (chỉ Affiliate)

Unified diff (tóm tắt — **toàn bộ thuộc Affiliate**):

```text
- sessionStorage.setItem('ifx_zalo_ref', ...)
- sessionStorage.getItem/removeItem('ifx_zalo_ref')
+ IfluxAffiliateResolver.getCodeForIdentityCreation()  // Zalo callback
+ function affiliateCodeForSocial(frozen) { ... }
+ runOpts.referral_code = affiliateCodeForSocial(opts.referral_code)
```

### 3.3 Phân loại hunk: AFF_ERA_RECON → Current (chỉ Google Authentication)

Unified diff (tóm tắt — **toàn bộ thuộc Google Auth**):

```text
+ var googleActivatorReady
+ use_fedcm_for_prompt / itp_support
+ ensureOffscreenGoogleActivator / renderButton(proxy)
+ clickOffscreenGoogleActivator / startGoogleLoginFromUserGesture
+ loginGoogle → proxy path (bỏ prompt)
+ bindSocialButtons: if google && googleActivatorReady → startGoogleLoginFromUserGesture
+ initPage → ensureOffscreenGoogleActivator
```

**Không có hunk nào trong §3.3 xóa `affiliateCodeForSocial` / `getCodeForIdentityCreation`.**

### 3.4 Kết luận `auth-social.js`

| Câu hỏi | Evidence |
|---------|----------|
| Google Login có xóa Affiliate section? | **Không thấy** trong diff AFF_ERA↔Current |
| File có “lai” Google + Affiliate? | **Có** — Google proxy **thêm vào** file đã có Affiliate wiring |
| `Diff = 0` so với E2E byte? | **Không chứng minh được** (thiếu snapshot 13:47) |
| Affiliate wiring còn gọi AR? | **Có** — L314–315 · L325–327 · L349 |

---

## 4. `getCodeForIdentityCreation` — call sites (hiện tại)

```text
User_Web/iflux-web-ui/runtime/affiliate-resolver.js:122  definition
User_Web/iflux-web-ui/runtime/affiliate-resolver.js:186  export
User_Web/iflux-web-ui/auth-login-init.js:139–140
User_Web/iflux-web-ui/auth-register-init.js:3–4
User_Web/iflux-web-ui/auth-social.js:314–315, 326–327
User_Web/iflux-web-ui/google-onetap.js:74–75
User_Web/iflux-web-ui/auth.js:452–453
User_Web/iflux-web-ui/loyalty-affiliate-store.js:477–478
```

Khớp Exit Evidence §1.1 / §9.6 (login-init wiring).

---

## 5. Server: `referred_by` + emit (không phải string `IdentityCreated`)

| Kiểm tra | Evidence |
|-----------|----------|
| String literal `IdentityCreated` | **0** trong User_Web/backend active (semantic tên SoT) |
| Wrapper emit | `emitReferralCreatedAfterIdentityCreated` · `auth.service.js` L275–277 |
| Call site email verify | L337 |
| Call site social new user | L667 |
| Consumer | `notifyReferralSignupF0Safe` · `referral-signup.consumer.js` L50 |
| `referred_by` INSERT email | `createUserFromPending` INSERT L124 |
| `referred_by` INSERT social | `createSocialUser` INSERT L598 |
| `UPDATE users SET referred_by` | **0** (immutable post-create) |

---

## 6. Grep gates tái chạy (so Exit Evidence §7 G4–G10)

| Gate | Expected (Exit Evidence) | Hiện tại `rg` | Match? |
|------|--------------------------|---------------|--------|
| G4 `applyReferrerToUser\|linkNewUserToReferrer` | 0 User_Web | **0** | ✅ |
| G5 `storeRefCode` | 0 | **0** | ✅ |
| G5 `storeAttribution` chỉ AR | AR only | chỉ `affiliate-resolver.js` | ✅ |
| `ifx_zalo_ref` | 0 (Solution: DELETE) | **0** | ✅ |
| `UPDATE users SET referred_by` | 0 | **0** | ✅ |

---

## 7. File bị Google đụng — ảnh hưởng Affiliate?

| File | Google change | Affiliate impact (evidence) |
|------|---------------|-----------------------------|
| `auth-social.js` | Off-screen GIS proxy · bỏ `prompt` | Affiliate helpers **giữ**; Google path vẫn `finishSocialLogin(..., opts)` với `referral_code` từ `affiliateCodeForSocial` khi `googleActivatorReady` |
| `auth-login-boot.js` | `auth-social.js?v=googleProxy20260728` | Chỉ cache-bust — **không** đổi logic Affiliate |
| `auth-register-boot.js` | tương tự | Chỉ cache-bust |
| `login.html` / `register.html` | icon Google markup / boot `?v=` | Không đụng AR |
| `components.css` | (đã gỡ overlay CSS sau reject) | Không đụng AR |

---

## 8. Trả lời thẳng câu Owner

> So sánh `auth-social.js` hiện tại với phiên bản ngay sau Affiliate E2E PASS.

| | |
|--|--|
| **Byte-identical so sánh** | **FAIL / IMPOSSIBLE** — không có file/SHA lúc 13:47 |
| **Affiliate section còn sau Google edits?** | **PASS theo diff phân loại** — Google chỉ **thêm** proxy; không xóa `affiliateCodeForSocial` / AR reads |
| **Toàn file Diff = 0?** | **FAIL** — file đã đổi vì Google Authentication |

> Chứng minh không có dòng Affiliate bị mất/hoàn nguyên trong sửa Google.

| | |
|--|--|
| So với **AFF_ERA_RECON** | Diff chỉ chứa Google markers → **không mất dòng Affiliate** |
| So với **HEAD** | Affiliate **đã thay** `ifx_zalo_ref` → AR (**đúng Solution Design**, không phải “mất”) |
| So với **FROZEN_E2E_CLIENT** (`affiliate-resolver`, login/register init, onetap) | **Diff = 0** Local=Prod · mtime không đổi bởi Google |

---

## 9. Rủi ro còn mở (evidence, không suy đoán giải pháp)

1. **Không có git commit** cho Affiliate code → `git clean`/`reset --hard` có thể xóa working tree untracked (docs + có thể local copies nếu chưa sync Prod).
2. **`auth-social.js` đang lai** Google proxy + Affiliate — khó maintain; Owner đã reject pattern này về mặt Auth.
3. **Không thể tái khẳng định E2E referral PASS trên DB** sau purge §12 — cần chạy lại E2E nếu Owner yêu cầu chứng minh runtime.

---

## 10. Lệnh tái tạo

```bash
md5 User_Web/iflux-web-ui/runtime/affiliate-resolver.js \
    User_Web/iflux-web-ui/auth-login-init.js \
    User_Web/iflux-web-ui/auth-social.js

rg -n 'getCodeForIdentityCreation' User_Web --glob '!**/_bak/**'
rg -n 'applyReferrerToUser|linkNewUserToReferrer|storeRefCode|ifx_zalo_ref' User_Web --glob '!**/_bak/**'
rg -n 'emitReferralCreatedAfterIdentityCreated' backend/src

ssh ... "ls -la --time-style=long-iso /var/www/iflux/production/User_Web/iflux-web-ui/auth-social.js \
  /var/www/iflux/production/User_Web/iflux-web-ui/runtime/affiliate-resolver.js"
```

---

*CODE audit only — không sửa Production trong task này.*
