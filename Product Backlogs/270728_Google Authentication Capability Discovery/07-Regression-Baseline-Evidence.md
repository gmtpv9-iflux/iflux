# Regression Baseline Evidence — trước Phase 5

**Date:** 2026-07-28  
**HEAD / freeze family:** `b539a95` · tag `AFFILIATE_GOLDEN`  
**Mục đích:** Chụp **trạng thái kỳ vọng hiện tại** để WP7 đối chiếu — không chạy lại full E2E trong audit này.  
**Nguồn:** Freeze commit · Affiliate exit docs · code presence · Plan Regression Matrix.

---

## 1. Cách đọc baseline

| Ký hiệu | Nghĩa |
|---------|--------|
| **PASS (evidence)** | Đã có bằng chứng trước (doc/API/SQL/freeze) |
| **PASS (code wiring)** | Code path tồn tại đúng freeze; browser E2E chưa ký |
| **KNOWN GAP** | Đã biết — không block Phase 5 start; WP7 phải xử lý/waiver |
| **N/A pre-WP** | TO-BE chưa có |

---

## 2. Matrix baseline (Authentication + Affiliate)

| Area | Baseline status | Evidence pointer | WP7 expect |
|------|-----------------|------------------|------------|
| **Affiliate Context capture `/IFL…`** | PASS (evidence) | Affiliate SoT · AR `affiliate-resolver.js` · freeze | Không regress |
| **Affiliate attribution (API/SQL controlled)** | PASS (evidence) | `07-Post-Implementation-Audit-Exit-Evidence.md` E2E controlled | Không regress |
| **Affiliate Path C Google browser** | KNOWN GAP / PASS wiring | 07: G1 browser ⏳; client `referral_code` wiring ✅; runtime audit 10 | WP7: Prefer PASS browser hoặc Owner waiver |
| **Affiliate existing user + context** | PASS (rule+code) | Server ignore referral on existing | Không overwrite `referred_by` |
| **Google login icon (desktop GIS prompt)** | PASS (code wiring) | `loginGoogle` + prompt Affiliate-era; UX mobile historically fragile | Must work after rebuild (WP1–2) |
| **Google One Tap** | PASS (code present) | `google-onetap.js` loaded | **Expect ABSENT** after WP3 (product change OD-SOL-02) |
| **Redirect after login page social** | PASS (code) | `redirectAfterAuth` via login-init | Keep |
| **Redirect One Tap** | PASS but **non-policy** | Self navigate in onetap | Deleted with One Tap |
| **Session after social** | PASS (code) | `establishSession` + authMe in `loginWithSocial` | Keep |
| **Remember me social** | PASS (wiring) | opts `remember_me` bindSocialButtons → API | Keep via Page→UseCase |
| **Password login** | PASS (code path) | auth-login-init password → `loginWithEmail` | Không regress |
| **OTP / register verify** | PASS (code path) | register/OTP boots + auth.service | Không regress |
| **Social config endpoint** | PASS (code) | `/auth/social/config` · getPublicSocialConfig | Keep Google clientId |
| **Apple/FB/Zalo** | PASS (code present) | auth-social KEEP tạm | Smoke OK or defer note |
| **googleProxy absent** | PASS | rg = 0 on freeze | Must stay 0 |
| **AR SoT file** | PASS | `affiliate-resolver.js` sole context owner | Diff behavior = 0 |

---

## 3. Freeze integrity snapshot

| Item | Value |
|------|-------|
| Branch | `feature/google-login-rebuild` |
| `HEAD` / `AFFILIATE_GOLDEN^{}` | `b539a959350bceeedb75f1c831a2c20227e042db` |
| `AFFILIATE_GOLDEN` tag object | `b51940cbbf3f39ed1333b48f90eacefee26ca3f2` |
| File SHA-256 | [baseline-fingerprints/](baseline-fingerprints/) |
| auth-social | 322 lines · sha256 `ef6e9469…12bf5015` · no googleProxy |
| google-onetap | 147 lines · sha256 `26df13c3…43160509` |
| Rollback | checkout peel + verify sha256 == fingerprint table |

---

## 4. WP7 comparison protocol

1. Điền lại ma trận [03-Implementation-Plan §6](03-Implementation-Plan.md) cột PASS.  
2. So từng hàng với §2 bảng này.  
3. One Tap: baseline PRESENT → after ABSENT = **expected PASS** (không phải regress).  
4. Path C browser: nếu vẫn GAP → Owner waiver ghi rõ; không im lặng.

---

## 5. Sign-off baseline

| Role | Status |
|------|--------|
| Agent (capture) | ✅ Baseline recorded 2026-07-28 |
| Owner | Chờ xác nhận “baseline OK → RV-0/WP1” |

---

*Regression baseline only. Không architecture. Không code change.*
