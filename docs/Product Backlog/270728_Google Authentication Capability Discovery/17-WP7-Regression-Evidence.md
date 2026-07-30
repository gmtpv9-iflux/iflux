# 17 — WP7 Regression Evidence (Runtime)

**Date:** 2026-07-28 (ICT)  
**Commit under test:** `9df7509` (`feature/google-login-rebuild`)  
**Stack:** Frontend `http://127.0.0.1:8777` (feature tree) · API `http://127.0.0.1:3001` (feature backend + DB tunnel to prod `iflux`)  
**Mindset:** QA nghiệm thu runtime — **không** dùng grep làm proof.  
**Artifacts:** [`runtime-wp7-artifacts/`](runtime-wp7-artifacts/)

---

## Executive Summary

| Priority | Result |
|----------|--------|
| **P0** | **NOT PASS** — T1/T2/T3 Google browser còn **OWNER PENDING** (OAuth không automate; GIS click → `Provider's accounts list is empty`) |
| P0 đã có runtime | T4 (password path) · T6 (absolute `return=`) · T7 · T9 · T12 **PASS** |
| P1 | T5 · T10 **PASS** |
| P2 | T8 **PASS** · T11 **SKIPPED** (disabled) · T13 **SKIPPED** (local thiếu rewrite `/IFL…`) |
| **WP7 Gate** | ❌ **FAIL / chờ Owner** — thiếu P0 Google |

**Không ký WP7 PASS** cho đến khi Owner hoàn tất T1, T2, T3 (Google Path C) trên stack feature (hoặc waiver có chữ ký).

---

## Environment

| Item | Value |
|------|-------|
| Feature commit | `9df7509a1274dc861174884198985de7ec152853` |
| Freeze compare | `AFFILIATE_GOLDEN^{}` = `b539a95` |
| Frontend | `python3 tools/iflux-dev-server.py` PORT **8777** |
| Backend | `npm start` PORT **3001**, `GOOGLE_CLIENT_ID` từ public config, storage local |
| DB | SSH tunnel → prod DB `iflux` (credentials không ghi trong báo cáo) |
| Production deploy | **Không** (Plan cấm) |

---

## Matrix results

### T1 — Google login user mới · P0

| Mục | Nội dung |
|-----|----------|
| Test case | T1 Google login user mới |
| Priority | P0 |
| Preconditions | Stack feature; Google enabled; GIS authorized cho origin |
| Steps | 1) Mở `/User_Web/auth/login.html?dataMode=api` 2) Click `#btn-google` 3) Hoàn tất OAuth account mới 4) Kiểm tra session + DB user |
| Expected | Session + user mới; `POST /auth/social` 200 |
| Actual | Click Google chạy GIS (`GSI_LOGGER` FedCM warning). Console: `Provider's accounts list is empty.` — **không** hoàn tất OAuth trong automation. |
| PASS/FAIL | ❌ **BLOCKED — Owner** |
| Evidence | `runtime-wp7-artifacts/t1-google-click-attempt.png` · `t1-google-click-console.txt` · `t1-google-frames.json` |

**Owner script:** Incognito → `http://127.0.0.1:8777/User_Web/auth/login.html?dataMode=api` → Google account **mới** → screenshot + Network `POST localhost:3001/api/auth/social` + SQL user.

---

### T2 — Google login user cũ · P0

| Mục | Nội dung |
|-----|----------|
| Test case | T2 Google login user cũ |
| Priority | P0 |
| Preconditions | Google account đã có user trên DB |
| Steps | Login Google existing → session |
| Expected | Session; không tạo user mới |
| Actual | Chưa chạy OAuth đủ (cùng blocker T1) |
| PASS/FAIL | ❌ **BLOCKED — Owner** |
| Evidence | — (chờ Owner screenshot + network) |

---

### T3 — Affiliate Path C · P0

| Mục | Nội dung |
|-----|----------|
| Test case | T3 Affiliate Path C (Google + `referral_code` → `referred_by`) |
| Priority | P0 |
| Preconditions | Referrer `IFLQVRZX` tồn tại |
| Steps (Google) | Capture context → Google signup mới → DB `referred_by` |
| Expected | `referred_by` = referrer id |
| Actual | **Google Path C chưa chạy** (OAuth). Verifier path sống: `POST /auth/social` id_token giả → **401** `Invalid Value` (`t3-social-invalid-token.json`). |
| PASS/FAIL | ❌ **BLOCKED — Owner** (Google Path C) |
| Evidence | `t3-social-invalid-token.json` · `t3-referrer-id.txt` |

**Supporting (không thay T3 Google):** Register+OTP với `referral_code=IFLQVRZX` → `referred_by=456ca07a-…` khớp referrer — `t3-attribution-db.txt` · `t8-verify.redacted.json`. Chứng minh attribution server khi có `referral_code`; **không** đủ thay Path C Google.

---

### T4 — Existing user không overwrite `referred_by` · P0

| Mục | Nội dung |
|-----|----------|
| Test case | T4 Existing + context không đổi `referred_by` |
| Priority | P0 |
| Preconditions | User `wp7.runtime…@iflux.test` đã có `referred_by` |
| Steps | Snapshot DB → `POST /auth/login` (kèm `referral_code` khác) → snapshot lại |
| Expected | `referred_by` không đổi |
| Actual | before = after = `456ca07a-2d4a-482f-947e-f4f982cf2dbf` |
| PASS/FAIL | ✅ **PASS** (password / existing identity path) |
| Evidence | `t4-referred-by-before.txt` · `t4-referred-by-after.txt` |

*Google existing + context:* vẫn cần Owner (cùng T2) để đóng đủ ý Matrix social.

---

### T5 — remember_me · P1

| Mục | Nội dung |
|-----|----------|
| Test case | T5 remember_me |
| Priority | P1 |
| Preconditions | Login page |
| Steps | Tick remember → submit password |
| Expected | Request có `remember_me: true` |
| Actual | Body `{"email":"…","password":"…","remember_me":true}` |
| PASS/FAIL | ✅ **PASS** |
| Evidence | `t5-remember-me-request.txt` |

---

### T6 — Redirect · P0

| Mục | Nội dung |
|-----|----------|
| Test case | T6 `redirectAfterAuth` / `?return=` |
| Priority | P0 |
| Preconditions | Password user |
| Steps | Login với `return=http://127.0.0.1:8777/User_Web/community/index.html` |
| Expected | URL after = community |
| Actual | after = `http://127.0.0.1:8777/User_Web/community/index.html` |
| PASS/FAIL | ✅ **PASS** |
| Evidence | `t6c-url-before.txt` · `t6c-url-after.txt` · `t6c-after-redirect.png` |

**Note local:** `return=/cong-dong` (clean URL) trên static server → rơi về `/` (thiếu nginx/SPA Production). Absolute `http` return **PASS**. Owner nên xác nhận `?return=/cong-dong` trên môi trường có rewrite Production sau cutover.

---

### T7 — Password login · P0

| Mục | Nội dung |
|-----|----------|
| Test case | T7 Password login |
| Priority | P0 |
| Preconditions | User đã verify |
| Steps | UI fill email/password → submit |
| Expected | `POST /auth/login` 200 + session |
| Actual | Network login 200 + auth/me 200; screenshot after |
| PASS/FAIL | ✅ **PASS** |
| Evidence | `t7-login.redacted.json` · `t7-t9-network.json` · `t7-password-before-submit.png` · `t6-t7-after-login.png` |

---

### T8 — OTP / Register · P2

| Mục | Nội dung |
|-----|----------|
| Test case | T8 OTP / Register |
| Priority | P2 |
| Preconditions | Local OTP demo |
| Steps | `POST /auth/register` → `POST /auth/verify-email` code `123456` |
| Expected | Token + user active |
| Actual | register 200 `demoCode=123456`; verify 200 |
| PASS/FAIL | ✅ **PASS** |
| Evidence | `t8-register-start.json` · `t8-verify.redacted.json` |

---

### T9 — auth/me + session · P0

| Mục | Nội dung |
|-----|----------|
| Test case | T9 Session + authMe |
| Priority | P0 |
| Preconditions | Sau login |
| Steps | `GET /auth/me` + localStorage session |
| Expected | Profile JSON; session keys |
| Actual | me 200; `iflux_user_session` / `iflux_active_session` present |
| PASS/FAIL | ✅ **PASS** |
| Evidence | `t9-auth-me.redacted.json` · `t9-session-storage.redacted.json` · `t7-t9-network.json` |

---

### T10 — Social config · P1

| Mục | Nội dung |
|-----|----------|
| Test case | T10 Social config |
| Priority | P1 |
| Preconditions | Backend feature |
| Steps | `GET /api/auth/social/config` |
| Expected | google.enabled=true + clientId |
| Actual | 200; google enabled; apple/fb/zalo disabled |
| PASS/FAIL | ✅ **PASS** |
| Evidence | `t10-social-config.json` |

---

### T11 — Apple / Facebook / Zalo · P2

| Mục | Nội dung |
|-----|----------|
| Test case | T11 Apple/FB/Zalo smoke |
| Priority | P2 |
| Preconditions | Config |
| Steps | Đọc config |
| Expected | Smoke hoặc SKIPPED nếu disabled |
| Actual | apple/facebook/zalo `enabled:false` |
| PASS/FAIL | ⏭️ **SKIPPED** — disabled trên config runtime |
| Evidence | `t10-social-config.json` |

---

### T12 — One Tap absent · P0

| Mục | Nội dung |
|-----|----------|
| Test case | T12 One Tap absent |
| Priority | P0 |
| Preconditions | Feature frontend |
| Steps | Load login; quan sát network script |
| Expected | Không load `google-onetap`; có `social-auth/*` |
| Actual | `onetapScripts=[]`; `google-onetap.js` HTTP **404**; boot loads UseCase/Provider; `#btn-google` visible |
| PASS/FAIL | ✅ **PASS** |
| Evidence | `t12-login-page.png` · `t12-runtime-network.json` · `t12-onetap-runtime-check.json` |

---

### T13 — AR SoT capture `/IFL…` · P2

| Mục | Nội dung |
|-----|----------|
| Test case | T13 AR capture |
| Priority | P2 |
| Preconditions | Route `/IFL…` rewrite |
| Steps | Mở `/IFLQVRZX` |
| Expected | `IfluxAffiliateResolver.getCodeForIdentityCreation()` có code |
| Actual | Local static **404** `/IFLQVRZX` — không load AR (thiếu nginx rewrite Production) |
| PASS/FAIL | ⏭️ **SKIPPED** — local stack không có rewrite `/IFL…` |
| Evidence | `t13-ar-capture.json` |

---

## P0 scoreboard

| ID | Status |
|----|--------|
| T1 | ❌ Owner |
| T2 | ❌ Owner |
| T3 | ❌ Owner (Google Path C) |
| T4 | ✅ |
| T6 | ✅ |
| T7 | ✅ |
| T9 | ✅ |
| T12 | ✅ |

---

## Ready for WP7 sign-off?

| | |
|--|--|
| **Verdict** | ❌ **NOT PASS** |
| **Blocking** | Owner runtime: **T1, T2, T3** (Google OAuth trên feature stack) |
| **Non-blocking** | T13 local rewrite; T6 clean-URL `/cong-dong` trên Production sau cutover |

Sau Owner PASS T1–T3 → cập nhật file này → xét ký WP7 cùng [`18-RV1-Rollback-Drill-Evidence.md`](18-RV1-Rollback-Drill-Evidence.md).

---

*QA runtime only. Implementation audit = doc 16 (đã đóng).*
