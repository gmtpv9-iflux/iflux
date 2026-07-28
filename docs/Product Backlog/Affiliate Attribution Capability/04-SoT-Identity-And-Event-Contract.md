# SoT — Identity Creation & Event Contract

**Date:** 2026-07-28  
**Trạng thái:** 📝 **DRAFT** — chờ Gate G1  
**Parent SoT:** [02-SoT-Affiliate-Attribution.md](02-SoT-Affiliate-Attribution.md)  
**Owner Decisions:** OD-AFF-05, OD-AFF-06, OD-AFF-07, OD-AFF-09

---

## 1. Purpose

Chuẩn hóa **Identity Creation Contract** — điểm giao duy nhất giữa mọi authentication/register provider và **Affiliate Attribution Capability**.

SoT dùng **business semantics**. Tên event/module runtime = Solution Design.

---

## 2. Identity Creation Contract

### 2.1 Definition

**Identity Created** = semantic milestone khi hệ thống tạo **user record mới** lần đầu (INSERT) — bất kể provider (email OTP, Google, One Tap, Apple, Admin, …).

**Không được confound** với:

| Term | Khác biệt |
|------|-----------|
| Login | Identity đã tồn tại — không trigger attribution |
| Session established | Có thể sau Identity Created hoặc login |
| Account Created (UI) | Superset UX — attribution bind tại Identity Created |

### 2.2 Contract obligations

Mọi implementation path tạo identity **bắt buộc**:

| Step | Obligation |
|------|------------|
| 1 | Gọi **cùng** server entry (Identity Creation handler) |
| 2 | Handler **read Affiliate Context** (via Context Capability) |
| 3 | Nếu context active → truyền `referral_code` semantic vào **Affiliate Attribution** |
| 4 | Attribution set `users.referred_by` tại INSERT (hoặc atomic equivalent) |
| 5 | Emit **ReferralCreated** nếu attribution success |
| 6 | **clear** Affiliate Context |

**Provider wiring** (Google, One Tap, …) **chỉ** gọi contract — **không** chứa attribution logic.

### 2.3 Entry points (must converge)

| Entry point (hiện trạng) | Converge to contract |
|--------------------------|----------------------|
| Email register + OTP verify | ✅ partial today — extend |
| Register page social | ⚠️ partial — referral at page load only |
| **Login page social (Path C)** | ❌ today — **must fix** |
| Google One Tap | ❌ today — **must fix** |
| Zalo OAuth | ⚠️ sessionStorage branch — **REPLACE** |
| Admin create user | ❌ no attribution — **MODIFY** |
| Future providers | thin wiring only |

---

## 3. Semantic events

| Event | Producer | Consumers | Payload (semantic) |
|-------|----------|-----------|-------------------|
| **AffiliateContextCaptured** | Context Capability | Analytics (optional) | `referral_code`, `captured_at` |
| **IdentityCreated** | Identity Creation handler | Attribution, Audit | `user_id`, `provider`, `is_new` |
| **ReferralCreated** | Attribution Capability | Notification, Commission, Dashboard sync | `referrer_id`, `referee_id`, `referral_code` |

**Mapping runtime (Solution Design — không khóa trong SoT):**

| Semantic | Production candidate (audit) |
|----------|------------------------------|
| IdentityCreated | `auth.service` user INSERT success |
| ReferralCreated | Hook thay thế rải trong `auth.service` → single producer |
| Notification template | `AFFILIATE_REFERRAL_SUCCESS` |

---

## 4. Server Source of Truth

### 4.1 `users.referred_by`

| Property | Rule |
|----------|------|
| Type | FK → `users.id` (referrer) |
| Set when | Identity Created + active context + valid referral_code |
| Mutable | **No** (user-facing) after set |
| Authority | **Server only** — client graph is projection |

### 4.2 Dedupe

| Case | Behavior |
|------|----------|
| Retry same signup | Idempotent — không double ReferralCreated |
| Context + invalid code | No `referred_by` · clear context · no ReferralCreated |
| Existing user login | Ignore context for attribution |

---

## 5. Consumer matrix (read-only)

| Consumer | Input | Cấm |
|----------|-------|-----|
| **Notification** | ReferralCreated / `referred_by` | Đọc Affiliate Context · localStorage |
| **Commission** | `users.referred_by` at order time | Client graph authority |
| **Affiliate Dashboard** | `GET /auth/referrals/sync` (server) | `iflux_referral_parents_v1` as SoT |
| **History / Audit** | Server fields | — |

**S5 slice name:** Consumer Alignment — Notification **không** owner Affiliate.

---

## 6. DELETE targets (contract violations today)

| Violation | File (audit) | Fix |
|-----------|--------------|-----|
| Login social no referral | `auth-login-init.js` | Wire to contract |
| One Tap `{}` | `google-onetap.js` | Wire to contract |
| Client-only bind | `applyReferrerToUser`, `linkNewUserToReferrer` | DELETE as authority |
| OTP-only server path | `startRegistration` payload | Context → contract |
| Notification hook scatter | `auth.service.js` | Single ReferralCreated producer |

---

## 7. Admin & future providers

| Case | Rule |
|------|------|
| Admin create user | Same Identity Creation Contract · optional manual referrer (Owner policy) |
| New OAuth provider | Register handler only · AC-15 grep gate |
| Magic Link (future) | Contract before ship |

---

## 8. Verification

| Check | Method |
|-------|--------|
| All paths → one handler | Code audit / grep |
| Path C PASS | T3 + AC-16 |
| 0 inbox rows → >0 after fix | D5 R1 |
| DB google users referred_by | SQL after T3 |

---

## 9. G1 Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Owner | | | ☐ APPROVED ☐ REVISE |
