# Grep Baseline Report — trước Phase 5

**Date:** 2026-07-28  
**HEAD:** `b539a95` @ `feature/google-login-rebuild`  
**Raw outputs:** [`baseline-greps/`](baseline-greps/)  
**Cách dùng sau WP:** chạy lại cùng lệnh → `diff` với file trong `baseline-greps/`.

---

## 1. Lệnh chuẩn (copy-paste)

```bash
cd /path/to/iFLUX_P1
OUT="docs/Product Backlog/270728_Google Authentication Capability Discovery/baseline-greps"

rg -n "loginGoogle" User_Web backend --glob '!**/node_modules/**' --glob '!**/*.md'
rg -n "initGoogle" User_Web backend --glob '!**/node_modules/**' --glob '!**/*.md'
rg -n "__ifxOnGoogleCredential" User_Web
rg -n "google\.accounts|accounts\.google\.com/gsi" User_Web backend --glob '!**/node_modules/**' --glob '!**/*.md'
rg -n "google-onetap|gonetap|iflux_gonetap" User_Web backend --glob '!**/node_modules/**' --glob '!**/*.md'
rg -n "affiliateCodeForSocial" User_Web
rg -n "getCodeForIdentityCreation" User_Web backend --glob '!**/node_modules/**' --glob '!**/*.md'
rg -n "switch\s*\(|case ['\"]google|verifySocialToken|verifyGoogleIdToken" backend/src/modules/legacy-auth
rg -n "IfluxAuthSocial" User_Web --glob '!**/*.md'
rg -n "loginWithSocial" User_Web --glob '!**/*.md'
rg -n "redirectAfterAuth" User_Web --glob '!**/*.md'
rg -n "googleProxy" User_Web/iflux-web-ui/auth-social.js User_Web/iflux-web-ui/google-onetap.js
rg -n "GoogleProvider|SocialLoginUseCase|ProviderRegistry|VerifierRegistry|IdentityProof|VerifiedIdentity" User_Web backend --glob '!**/*.md'
```

---

## 2. Baseline counts (2026-07-28)

| Pattern | Hits (code) | File snapshot | After cutover expect |
|---------|------------:|---------------|----------------------|
| `loginGoogle` | 3 | `loginGoogle.txt` | **0** (WP1/6) |
| `initGoogle` | 3 | `initGoogle.txt` | **0** |
| `__ifxOnGoogleCredential` | 4 | `__ifxOnGoogleCredential.txt` | **0** |
| `google.accounts` / gsi | 10 | `google.accounts.txt` | Chỉ trong **GoogleProvider** (không auth-social/onetap) |
| `google-onetap` / gonetap | 2 | `google-onetap.txt` | **0** |
| `affiliateCodeForSocial` | 2 | `affiliateCodeForSocial.txt` | **0** |
| `getCodeForIdentityCreation` | 16 | `getCodeForIdentityCreation.txt` | AR + UseCase (+ non-Google residual tạm); **0** trong GoogleProvider/onetap |
| `switch` / case google (legacy-auth) | see file | `switch-provider-legacy-auth.txt` | Không trong IdentityService/UseCase; registry bootstrap OK |
| `IfluxAuthSocial` | 3 | `IfluxAuthSocial.txt` | Surface thay / deprecate |
| `loginWithSocial` | 7 | `loginWithSocial.txt` | Giữ API; bỏ dual inject |
| `redirectAfterAuth` | 8 | `redirectAfterAuth.txt` | Giữ; onetap không thay bằng navigate riêng |
| `googleProxy` | **0** | — | Giữ **0** |
| TO-BE names | **0** | — | Xuất hiện sau WP (expected) |

Combined dump: [`baseline-greps/00-all-greps.txt`](baseline-greps/00-all-greps.txt)

---

## 3. Call-site highlights (baseline narrative)

### Must DELETE / MOVE (Google)

- `auth-social.js`: `loginGoogle`, `initGoogle`, `__ifxOnGoogleCredential`, GIS `prompt`
- `google-onetap.js` toàn bộ + inject `iflux-web-ui.js:1675`
- `affiliateCodeForSocial` + Google bind path referral

### Must NOT vanish (Affiliate SoT)

- `affiliate-resolver.js` `getCodeForIdentityCreation` definition
- Server attribution path (not in these greps as GIS)

### Dual AR readers (baseline — gom về UseCase)

| File | Notes |
|------|-------|
| auth-social.js | Zalo + affiliateCodeForSocial |
| google-onetap.js | onCredential |
| auth.js | loginWithSocial inject |
| auth-login-init.js | affiliateReferralCodeForIdentity → initPage |
| auth-register-init.js | getEffectiveRefCode |
| loyalty-affiliate-store.js | unrelated loyalty helper — **không** xóa nhầm |

---

## 4. Diff protocol (sau mỗi WP)

```bash
rg -n "loginGoogle" ... > /tmp/loginGoogle.after.txt
diff -u "docs/.../baseline-greps/loginGoogle.txt" /tmp/loginGoogle.after.txt
```

WP Gate chỉ PASS khi after khớp **After cutover expect** cột §2.

---

*Grep baseline frozen. Không architecture.*
