# Phase 4 — Implementation Plan (= Phase 5 master playbook)

**Date:** 2026-07-28  
**Rev:** 1.2 — execution rule: file này = điều phối duy nhất  
**Status:** 🔒 **PLAN LOCKED** · OD-PLAN-01…07 APPROVE · **Phase 5 CODE được phép** trên `feature/google-login-rebuild`  
**Prerequisites:** Discovery 🔒 · Solution 🔒 · Delete Inventory 🔒 (OD-DEL-01…08)  
**Forbidden:** đụng `release/affiliate-golden` · Production deploy trước WP7 PASS  
**Rollback:** `AFFILIATE_GOLDEN^{}` = `b539a959350bceeedb75f1c831a2c20227e042db` · `baseline-fingerprints/`

**WP standard (OD-PLAN-06):** Entry → Tasks → Exit Criteria → Evidence → Gate  
**Rollback (OD-PLAN-07):** RV-0 ✅ · RV-1 sau WP6

---

## Phase 5 execution rule (OWNER)

```text
FILE NÀY = tài liệu điều phối DUY NHẤT khi implement.
Doc khác = REFERENCE — chỉ mở khi cần đối chiếu / evidence.
Không nạp toàn bộ Discovery→Baseline vào context cùng lúc.
Thực hiện tuần tự: Entry → Tasks → Exit Criteria → Evidence → Gate.
```

| Doc | Khi mở |
|-----|--------|
| **03 (this)** | **Luôn** — playbook |
| 00 Discovery | Nghi ngờ hiện trạng AS-IS |
| 01 Solution | Quên kiến trúc / contract |
| 02 Delete Inventory | Cần list xóa/MOVE chi tiết |
| 04–09 / greps / fingerprints | So Before/After · Gate evidence |
| 07 Regression + §6 matrix | Chủ yếu **WP7** |

---

## 0. Mục tiêu Plan

```text
HOW = work packages + delete/ownership + regression + rollback proof
không tranh luận lại architecture
```

**Cutover DoD:** Architecture Diff AFTER · Google BEFORE = 0 (OD-DEL-07) · Regression Matrix PASS · Rollback Validation PASS.

---

## 1. Impact Analysis (CG-005)

| Area | Current owner | Decision |
|------|---------------|----------|
| GIS client (`auth-social` + onetap) | Mixed god | **Migrate** → GoogleProvider + **Delete** old |
| Social orchestration | `finishSocialLogin` / `loginWithSocial` | **Modify** → SocialLoginUseCase |
| AR call-sites social | Many | **Modify** → UseCase only |
| Redirect | Auth + onetap | **Modify** → AuthRedirectPolicy; **Delete** onetap navigate |
| Backend verify switch | `social-auth.service` | **Migrate** → VerifierRegistry + VerifiedIdentity |
| Affiliate SoT / AR | Affiliate | **Reuse** |
| Password / OTP | Auth | **Reuse** — regression |
| Apple/FB/Zalo | auth-social residual | **Defer** (OD-DEL-03) |

---

## 2. Rollback Validation (OD-PLAN-07) — bắt buộc

Rollback chỉ có nghĩa khi **chạy được**, không chỉ tồn tại tag.

### RV-0 — Preflight (trước hoặc song song WP1)

| Step | Action | PASS |
|------|--------|------|
| RV-0.1 | `git fetch --tags` · xác nhận tag `AFFILIATE_GOLDEN` trỏ commit freeze | ☐ |
| RV-0.2 | Worktree hoặc checkout tạm tag (không phá branch feature) | ☐ |
| RV-0.3 | Smoke static: `auth-social.js` Affiliate-era có `loginGoogle` + `affiliateCodeForSocial` · **không** googleProxy | ☐ |
| RV-0.4 | Smoke path: login page assets load · social config endpoint reachable (staging/local hoặc Production read-only check theo Owner) | ☐ |
| RV-0.5 | Ghi evidence vào `04-Rollback-Validation-Evidence.md` (khi chạy) | ☐ |

### RV-1 — Emergency rollback drill (sau WP6, trước Production cutover)

| Step | Action | PASS |
|------|--------|------|
| RV-1.1 | Checkout / restore từ `AFFILIATE_GOLDEN` (hoặc `release/affiliate-golden`) theo runbook | ☐ |
| RV-1.2 | Build / asset path OK (không 404 script auth) | ☐ |
| RV-1.3 | Smoke: Password login **hoặc** session check | ☐ |
| RV-1.4 | Smoke: Affiliate Context capture `/IFL…` vẫn đọc được (AR) | ☐ |
| RV-1.5 | Owner ký Rollback Validation PASS | ☐ |

**Rule:** Không Production deploy rebuild nếu RV-0 chưa PASS. Không tuyên bố “có rollback” nếu RV-1 chưa từng chạy thành công ít nhất một lần trên môi trường kiểm soát.

---

## 3. Work packages (OD-PLAN-06 format)

Thứ tự: **WP1 → WP2 → WP3 → WP4 → WP5 → WP6 → WP7** (+ RV-0 trước WP1).

---

### WP1 — ProviderRegistry + GoogleProvider (MOVE GIS)

| Stage | Nội dung |
|-------|----------|
| **Entry** | Branch `feature/google-login-rebuild` sạch · RV-0 PASS · baseline so sánh `AFFILIATE_GOLDEN` · Plan LOCKED |
| **Tasks** | Tạo ProviderRegistry · GoogleProvider · MOVE GIS (`initGoogle` / `loginGoogle` / GSI load) · wire tạm để proof chạy · **không** để dual owner lâu |
| **Delete Checklist** | ☐ `loginGoogle` / `initGoogle` / `__ifxOnGoogleCredential` khỏi auth-social · ☐ no dual GIS |
| **Ownership Checklist** | ☐ GoogleProvider = Social Auth · ☐ auth-social không còn claim GIS · ☐ OD-DEL-08 |
| **Exit Criteria** | (1) `GoogleProvider.getProof()` → immutable `IdentityProof` only · (2) auth-social **không** còn logic GIS · (3) Provider ↛ UseCase/AR/Session/Redirect · (4) D1 partial hoặc full theo scope WP1 |
| **Evidence** | diff files · `rg loginGoogle|initGoogle|accounts.google` trên auth-social = 0 (GIS) · `rg affiliate` trên GoogleProvider = 0 · sample IdentityProof shape |
| **Gate** | WP1 Delete+Ownership ☐ → Owner/agent sign Exit · mới WP2 |

---

### WP2 — SocialLoginUseCase

| Stage | Nội dung |
|-------|----------|
| **Entry** | WP1 Gate PASS |
| **Tasks** | SocialLoginUseCase: Registry → proof → AR **một lần** → Identity API → Session → RedirectPolicy · `remember_me` từ Page · gỡ dual inject |
| **Delete Checklist** | ☐ `affiliateCodeForSocial` gone · ☐ dual `referral_code` inject removed · ☐ Page không pass referral cho Google |
| **Ownership Checklist** | ☐ UseCase = sole social AR reader · ☐ Page ↛ AR (social) |
| **Exit Criteria** | (1) AC-SOC-02 · (2) UseCase thin (không GIS/verify/Attribution write) · (3) Google path không đọc AR trong Provider · (4) D3/D4 PASS |
| **Evidence** | call-site inventory AR · flow trace · rg GoogleProvider không chứa referral |
| **Gate** | Exit Criteria + Evidence reviewed → WP3 |

---

### WP3 — DELETE One Tap

| Stage | Nội dung |
|-------|----------|
| **Entry** | WP2 Gate PASS |
| **Tasks** | DELETE `google-onetap.js` · DELETE inject trong `iflux-web-ui.js` · xóa dismiss key usage |
| **Delete Checklist** | ☐ file gone · ☐ script include gone · ☐ `rg onetap|gonetap` = 0 |
| **Ownership Checklist** | ☐ no residual One Tap owner |
| **Exit Criteria** | (1) OD-DEL-02 · (2) không còn surface One Tap · (3) D2 PASS |
| **Evidence** | `rg` output empty · boot bundle diff |
| **Gate** | Evidence PASS → WP4 |

---

### WP4 — Redirect Policy callers

| Stage | Nội dung |
|-------|----------|
| **Entry** | WP3 Gate PASS |
| **Tasks** | Mọi social success → `redirectAfterAuth` only · xác nhận Authentication ownership · Session không gọi redirect |
| **Delete Checklist** | ☐ no provider self-navigate |
| **Ownership Checklist** | ☐ Redirect = Authentication · ☐ Session ↛ RedirectPolicy |
| **Exit Criteria** | (1) OD-SOL-12 · (2) một policy cho Google path · (3) D5 PASS |
| **Evidence** | caller list `redirectAfterAuth` · rg navigate trong provider = 0 |
| **Gate** | Evidence PASS → WP5 |

---

### WP5 — VerifierRegistry + GoogleVerifier → VerifiedIdentity

| Stage | Nội dung |
|-------|----------|
| **Entry** | WP4 Gate PASS |
| **Tasks** | VerifierRegistry · GoogleVerifier returns VerifiedIdentity · IdentityService find/create/merge · REPLACE switch trong orchestration · wrap Apple/FB/Zalo register tối thiểu |
| **Delete Checklist** | ☐ `switch(provider)` không trong UseCase/IdentityService/Provider · ☐ chỉ registry bootstrap |
| **Ownership Checklist** | ☐ Verifier ↛ DB · ☐ VerifierRegistry = Identity |
| **Exit Criteria** | (1) OD-SOL-11/13 · (2) Verifier output = VerifiedIdentity only · (3) D6 PASS · (4) Attribution vẫn sau IdentityCreated |
| **Evidence** | verifier unit/smoke · rg switch trong forbidden layers = 0 · social login API still works |
| **Gate** | Evidence PASS → WP6 |

---

### WP6 — Dead Google symbols + auth-social shrink

| Stage | Nội dung |
|-------|----------|
| **Entry** | WP5 Gate PASS |
| **Tasks** | DELETE hết Google dead paths · KEEP Apple/FB/Zalo tạm · bump boot assets · Architecture Diff AFTER |
| **Delete Checklist** | ☐ OD-DEL-07 full · ☐ D7/D8 · ☐ no deprecated stubs |
| **Ownership Checklist** | ☐ auth-social ≠ Google owner · ☐ Matrix khớp repo |
| **Exit Criteria** | (1) BEFORE Google paths = 0 · (2) AFTER imports khớp Solution · (3) O1–O6 PASS |
| **Evidence** | full rg gates · file tree · Ownership Matrix check |
| **Gate** | Evidence PASS → WP7 + RV-1 |

---

### WP7 — Regression Matrix

| Stage | Nội dung |
|-------|----------|
| **Entry** | WP6 Gate PASS · RV-1 scheduled/done |
| **Tasks** | Chạy toàn bộ Regression Matrix §5 · ghi evidence · so golden |
| **Delete Checklist** | ☐ final rg PASS |
| **Ownership Checklist** | ☐ Matrix files match repo |
| **Exit Criteria** | (1) Mọi hàng §5 PASS hoặc Owner waiver có chữ ký · (2) Affiliate Path C không regress · (3) Password/OTP/Session/Redirect/Config PASS |
| **Evidence** | bảng §5 điền đủ · screenshot/API/DB logs · link commit |
| **Gate** | Owner ký WP7 PASS → mới xét Production deploy (phase riêng) |

---

## 4. Deliverable A — Delete Checklist (rollup)

| ID | Item | WP | PASS |
|----|------|----|------|
| D1 | GIS moved; `loginGoogle`/`initGoogle` deleted | WP1/6 | ☐ |
| D2 | One Tap file + inject deleted | WP3 | ☐ |
| D3 | Affiliate helpers removed from Google path | WP2/6 | ☐ |
| D4 | Dual AR inject removed | WP2 | ☐ |
| D5 | Provider self-redirect deleted | WP3/4 | ☐ |
| D6 | `switch(provider)` only registry bootstrap | WP5 | ☐ |
| D7 | No deprecated stubs / legacy exports | WP6 | ☐ |
| D8 | `rg` gates PASS | WP6/7 | ☐ |

WP không đóng nếu Delete Checklist WP còn ☐.

---

## 5. Deliverable B — Ownership Checklist (rollup)

| ID | Check | PASS |
|----|-------|------|
| O1 | Every new module in Ownership Matrix | ☐ |
| O2 | MOVE: new owner + old removed (OD-DEL-08) | ☐ |
| O3 | No dual ownership GIS | ☐ |
| O4 | Dependency Direction ALLOWED only | ☐ |
| O5 | Redirect owned by Authentication only | ☐ |
| O6 | GoogleProvider not imported by Shell/Page directly | ☐ |

---

## 6. Deliverable C — Regression Matrix

| Area | Gate | Evidence | PASS |
|------|------|----------|------|
| Affiliate attribution (Path C) | vs `AFFILIATE_GOLDEN` | DB + event | ☐ |
| Affiliate existing user + context | no overwrite `referred_by` | DB | ☐ |
| Google login (new) | IdentityCreated + session | API + UI | ☐ |
| Google login (existing) | session | API + UI | ☐ |
| Redirect after Google | `redirectAfterAuth` / `?return=` | UI | ☐ |
| Session | token + authMe | API | ☐ |
| Remember me (social) | policy | API | ☐ |
| Password login | unchanged | UI | ☐ |
| OTP / register verify | unchanged | UI/API | ☐ |
| Social config | client_id serves | API | ☐ |
| Apple/FB/Zalo smoke | KEEP tạm OK | UI | ☐ |
| One Tap absent | no script | UI + rg | ☐ |
| AR SoT untouched | behavior | review | ☐ |
| Provider ↛ Affiliate | grep | static | ☐ |

---

## 7. Branch / deploy policy

| Rule | |
|------|--|
| Code only on | `feature/google-login-rebuild` |
| Forbidden | `release/affiliate-golden` · Prod deploy trước WP7 + RV-1 |
| Rollback | tag `AFFILIATE_GOLDEN` — **chỉ sau khi RV PASS** |
| ECG | REPLACE not EXTEND · CG-020 trong cùng WP |

---

## 8. Stop / escalate Owner

- Đụng `affiliate-resolver` behavior  
- Giữ One Tap  
- Verifier cần DB  
- Không DELETE được symbol (consumer ngoài matrix)  

---

## 9. Gate Phase 4 — LOCKED

| ID | Quyết định | Status |
|----|------------|--------|
| **OD-PLAN-01** | Impact + WP1–7 | ✅ APPROVE |
| **OD-PLAN-02** | Delete Checklist bắt buộc | ✅ APPROVE |
| **OD-PLAN-03** | Ownership Checklist bắt buộc | ✅ APPROVE |
| **OD-PLAN-04** | Regression Matrix đầy đủ | ✅ APPROVE |
| **OD-PLAN-05** | Cho phép CODE trên `feature/google-login-rebuild` | ✅ APPROVE (sau OD-PLAN-06/07) |
| **OD-PLAN-06** | Mỗi WP: Entry → Tasks → Exit Criteria → Evidence → Gate | ✅ APPROVE |
| **OD-PLAN-07** | Rollback Validation (checkout → build/smoke → PASS) | ✅ APPROVE |

**PASS Plan:** 🔒 LOCKED. **Phase 5 Implementation được mở.**  
Giữ REPLACE not EXTEND + mọi gate phase trước.

---

## 10. Phase 5 start order

```text
1. RV-0 Rollback Validation preflight
2. WP1 … WP7 theo Gate từng gói
3. RV-1 rollback drill trước Production
4. Owner ký WP7 + Regression Matrix
```

---

*Implementation Plan rev 1.1 — LOCKED. Phase 5 CODE allowed on feature branch only.*
