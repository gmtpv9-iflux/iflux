# Acceptance Gates G1–G10 — Affiliate Attribution Capability

**Date:** 2026-07-28  
**Trạng thái:** ⏳ **G1 browser pending** · G2–G3 · G4–G10 ✅  
**SoT:** [02-SoT-Affiliate-Attribution.md](02-SoT-Affiliate-Attribution.md) · AC-17 · T16–T18

---

## Nguyên tắc nghiệm thu (Owner)

> Nếu **Affiliate Capability** còn biết đến Journey (google, login, register, …) → **vi phạm kiến trúc**.  
> Provider wiring thuộc **Identity Creation Contract** — **ngoài** phạm vi Affiliate Context Capability.

**Phạm vi Forbidden Dependency Gate (G9):**

| In scope (strict grep) | Out of scope (Identity wiring) |
|------------------------|--------------------------------|
| `User_Web/iflux-web-ui/runtime/affiliate-resolver.js` | `auth-login-init.js` |
| | `auth-register-init.js` |
| | `google-onetap.js` |
| | `auth-social.js` |
| | `auth.js` (Identity Creation client) |

---

## Gate matrix

| Gate | Điều kiện PASS | Evidence type |
|------|----------------|---------------|
| **G1** | E2E Path C PASS | DB + inbox + Affiliate row |
| **G2** | `referred_by` set **đúng 1 lần** tại Identity Created | SQL + no UPDATE path |
| **G3** | Notification + Dashboard **chỉ đọc server** | Consumer trace + D5 |
| **G4** | **Không còn client authority** ghi referral | grep `applyReferrerToUser` = 0 · `linkNewUserToReferrer` = 0 |
| **G5** | **Một Affiliate Context owner** | grep `storeAttribution` 1 file · capture delegate → AR only |
| **G6** | **Không dual-read** cookie/LS ngoài AR | grep `iflux_ref_code` read outside AR = 0 (User_Web runtime) |
| **G7** | **AC-17 Provider Independence** | Journey matrix + semantic |
| **G8** | **T16–T18 PASS** | Checklist §3 |
| **G9** | **Forbidden Dependency Gate** | grep provider tokens in `affiliate-resolver.js` = 0 |
| **G10** | **Grep cleanup** — no dead authority | §4 command output |

---

## AC-17 — Provider Independence

> Affiliate Context Capability **không** chứa logic, branch, hay reference theo authentication provider hay UI page.  
> Mọi provider chỉ **đọc** `getCodeForIdentityCreation()` tại Identity Creation boundary — **không** sửa Affiliate module khi thêm provider.

| Criterion | Verify |
|-----------|--------|
| AC-17a | `affiliate-resolver.js` grep forbidden tokens = 0 | G9 |
| AC-17b | Thêm provider mới không edit AR | T16 |
| AC-17c | Mọi journey → cùng `referral_code` contract | AC-16 matrix |

---

## T16–T18 — Provider add regression

| ID | Test | Steps | Expected |
|----|------|-------|----------|
| **T16** | Mock provider add | Thêm wiring giả `auth-mock-provider-init.js` gọi `getCodeForIdentityCreation()` only | `affiliate-resolver.js` **diff = 0** |
| **T17** | Forbidden grep | `rg -i 'google\|login\|register\|facebook\|apple' affiliate-resolver.js` | **0 matches** |
| **T18** | Dual-read grep | `rg 'iflux_ref_code' User_Web --glob '*.js'` excluding `affiliate-resolver.js` | **0 direct localStorage/cookie read** for context |

Chi tiết steps: [06-Regression-Checklist.md](06-Regression-Checklist.md)

---

## G10 — Grep commands (bắt buộc chạy trước sign-off)

```bash
# G4 — client authority removed
rg 'applyReferrerToUser|linkNewUserToReferrer' User_Web --glob '*.js' | rg -v '_bak'

# G5 — sole capture writer
rg 'storeAttribution|function captureRefFromUrl|storeRefCode' User_Web Admin_Design_system --glob '*.js' | rg -v '_bak'

# G6 — dual-read
rg "localStorage\.getItem\('iflux_ref_code" User_Web --glob '*.js' | rg -v '_bak|affiliate-resolver'

# G9 — forbidden journey in capability
rg -i 'google|login|register|facebook|apple|onetap|zalo' User_Web/iflux-web-ui/runtime/affiliate-resolver.js

# Server — single notification emitter function
rg 'notifyReferralSignupF0Safe|emitReferralCreatedAfterIdentityCreated' backend/src/modules/legacy-auth/auth.service.js

# Server — no UPDATE referred_by
rg 'UPDATE users SET.*referred_by' backend --glob '*.js'
```

---

## Sign-off

| Gate | PASS | Date | Evidence ref |
|------|------|------|--------------|
| G1 | ☐ | | 07 §10 Path C browser |
| G2 | ✅ | 2026-07-28 | 07 §9 |
| G3 | ✅ | 2026-07-28 | 07 §9.3–9.5 |
| G4 | ✅ | 2026-07-28 | G10 grep |
| G5 | ✅ | 2026-07-28 | G10 grep |
| G6 | ✅ | 2026-07-28 | G10 grep |
| G7 | ✅ | 2026-07-28 | AC-17 |
| G8 | ✅ | 2026-07-28 | 06 T16–T18 |
| G9 | ✅ | 2026-07-28 | G10 grep |
| G10 | ✅ | 2026-07-28 | 07 §7 |

**Task đóng khi:** G1–G10 tất cả PASS + Owner sign · **còn G1 browser**
