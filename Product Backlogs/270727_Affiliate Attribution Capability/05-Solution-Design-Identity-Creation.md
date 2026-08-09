# Solution Design — Identity Creation & Affiliate Wiring

**Date:** 2026-07-28  
**Trạng thái:** 📝 **DRAFT** — chờ G1 SoT + Owner Solution Design sign-off · **CHƯA CODE**  
**SoT:** [02](02-SoT-Affiliate-Attribution.md) · [03](03-SoT-Affiliate-Context-Contract.md) · [04](04-SoT-Identity-And-Event-Contract.md)  
**Audit:** [00-Audit-Architecture-Production.md](00-Audit-Architecture-Production.md) · [00-Audit-D5-R1-Referral-Failure.md](00-Audit-D5-R1-Referral-Failure.md)

---

## 0. Scope

Tài liệu này mô tả **implementation proposal** — được phép nêu module, transport, API field. Thay đổi business rule phải quay lại SoT + Owner.

**Mục tiêu:** Fix Path C và Journey Independence bằng REPLACE not EXTEND.

---

## 1. Target architecture

```text
[Browser]
  affiliate-context.js (SOLE capture owner)
       │ capture/read/clear
       ▼
  auth-*-init.js / onetap / oauth callbacks
       │ thin wiring: getContextForIdentityCreation()
       ▼
  POST /auth/social | /auth/register | …
       │ body carries referral_code WHEN context active
       ▼
[Server]
  auth.service.js — identityCreationHandler()
       │ resolveReferrer(referral_code)
       │ INSERT users.referred_by
       │ emit ReferralCreated → notification.service
       ▼
  consumers (read server only)
```

---

## 2. Slice mapping

| Slice | Deliverable |
|-------|-------------|
| **S1** | Sole `affiliate-context` module · DELETE capture trong AR/LAS/register-init duplicates |
| **S2** | `identityCreationHandler` unified · all providers call it |
| **S3** | Attribution + ReferralCreated single producer |
| **S4** | Login init · One Tap · Zalo · Admin wiring |
| **S5** | Notification/Commission/Dashboard consume only ReferralCreated |
| **S6** | DELETE sweep + grep gates |

---

## 3. Affiliate Context — implementation proposal

### 3.1 Sole owner module

**Modify existing:** consolidate into `User_Web/iflux-web-ui/runtime/affiliate-resolver.js` **OR** extract `affiliate-context.js` — **decision at S1:** prefer **modify affiliate-resolver** (minimize new file per CG-012).

**DELETE capture calls from:**

| File | Action |
|------|--------|
| `loyalty-affiliate-store.js` `captureRefFromUrl` | Remove · delegate read API |
| `auth.js` L439–442 boot capture | Remove |
| `auth-register-init.js` L48–49 | Remove |

**Keep:** nginx `sub_filter` inject early — ensures capture before any auth init.

### 3.2 Transport (proposal — Owner confirm at SD sign-off)

| Mechanism | Role |
|-----------|------|
| Cookie `iflux_ref_code` | Primary transport cross-page (existing 30d) |
| localStorage mirror | Fallback if cookie blocked |
| `iflux_aff_context_v1` | **REPLACE** with structured context `{ code, captured_at, expires_at }` |

**API surface (client):**

```javascript
// Proposal — names final at S1
AffiliateContext.captureFromLocation()
AffiliateContext.readActive()      // null if expired
AffiliateContext.clear()
AffiliateContext.getCodeForIdentityCreation()  // thin helper for auth inits
```

### 3.3 Lifetime

Implement **Option A** (30 days) initially — align R2 with existing `COOKIE_DAYS`. Add `expires_at` in structured context for explicit read() null.

---

## 4. Identity Creation — server proposal

### 4.1 Unified handler

**Modify:** `legacy-auth/auth.service.js`

Extract semantic steps (no new parallel service unless required):

```text
async function identityCreationHandler({ provider, profile, referral_code, ... }) {
  const referrerId = referral_code ? await resolveReferrer(referral_code) : null;
  const user = await insertUser({ ...profile, referred_by: referrerId });
  if (referrerId && isNewUser) {
    await emitReferralCreated({ referrerId, refereeId: user.id, referral_code });
    // notification.service — AFFILIATE_REFERRAL_SUCCESS
  }
  return user;
}
```

**REPLACE:** scattered notification calls · OTP-only `referred_by` path → context arrives via `referral_code` on **every** create path.

### 4.2 API contract (request body)

| Field | When |
|-------|------|
| `referral_code` | Optional · sent when `AffiliateContext.readActive()` non-null |

**Applies to:** `POST /auth/register`, social login/create endpoints used by Google/One Tap/Zalo.

**Server rule:** Ignore `referral_code` if user already exists (login path).

---

## 5. Provider wiring (thin — S4)

### 5.1 Path C fix (critical)

**Modify:** `User_Web/.../auth-login-init.js`

```javascript
// Today (FAIL):
IfluxAuthSocial.initPage({ /* no referral_code */ });

// Target:
IfluxAuthSocial.initPage({
  referral_code: AffiliateContext.getCodeForIdentityCreation() || undefined
});
```

Same pattern as register init — **no attribution logic in init** — only read context.

### 5.2 One Tap

**Modify:** `google-onetap.js` — pass `referral_code` from context into `loginWithSocial` payload.

### 5.3 Zalo

**DELETE:** `sessionStorage ifx_zalo_ref` branch · use Affiliate Context read at redirect return.

### 5.4 Register email

**Keep:** existing `referral_code` in register body · **source** changes from page-only resolve → Context Capability read (unified).

### 5.5 Admin create

**Modify:** admin user create API accepts optional `referral_code` → same handler.

---

## 6. Client DELETE list

| Artifact | Action |
|----------|--------|
| `applyReferrerToUser` as authority | DELETE — server sets referred_by |
| `linkNewUserToReferrer` post-login | DELETE or demote to UI projection after server sync |
| Duplicate `captureRefFromUrl` | DELETE |
| Client graph as SoT for members table | Demote — `syncFromServerAsync` only |

---

## 7. Consumer alignment (S5)

### 7.1 Notification

**Single producer:** ReferralCreated in attribution path.

**Verify:** `user_inbox_notifications` row template `AFFILIATE_REFERRAL_SUCCESS` after T3.

**DELETE:** any Notification trigger that reads client state.

### 7.2 Affiliate Dashboard

**Keep:** `GET /auth/referrals/sync` — server SoT.

**Modify:** stop writing members from client-only bind.

### 7.3 Commission

Smoke: order reconcile reads `buyer.referred_by` from server profile — no change to architecture in this task.

---

## 8. Migration / data

| Item | Action |
|------|--------|
| Existing users NULL referred_by | No retroactive fix in scope |
| `MINH10` codes | Separate slice |
| Production deploy | Standard prod deploy + CF purge |

---

## 9. Verification plan

| Gate | Evidence |
|------|----------|
| Grep single capture owner | `captureRefFromUrl` only in sole module |
| Grep no login empty referral | `auth-login-init` passes context |
| T3 manual | trungpv-style incognito path |
| SQL | new google user `referred_by NOT NULL` |
| D5 R1 | inbox notification + affiliate member row |

---

## 10. Risks & open decisions

| # | Risk | Mitigation |
|---|------|------------|
| SD-1 | Cookie blocked | localStorage mirror (existing pattern) |
| SD-2 | Incognito separate session | Product limit R4 — document in SoT |
| SD-3 | Race: capture after auth init | nginx early inject + capture on first paint |
| SD-4 | New file vs modify AR | Prefer modify per CG-012 — Owner confirm S1 |

---

## 11. Solution Design sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Owner | | | ☐ APPROVED ☐ REVISE |

*APPROVED → mới mở S1 implementation.*

---

## 12. Document index

| Phase | File |
|-------|------|
| Plan | [00-Plan-Owner-Review.md](00-Plan-Owner-Review.md) |
| Owner | [01-Owner-Decisions-LOCK.md](01-Owner-Decisions-LOCK.md) |
| SoT | [02](02-SoT-Affiliate-Attribution.md) · [03](03-SoT-Affiliate-Context-Contract.md) · [04](04-SoT-Identity-And-Event-Contract.md) |
| Regression (Phase 5) | `06-Regression-Checklist.md` (tạo khi mở P5) |
| Exit (Phase 6) | `07-Exit-Evidence.md` (tạo khi mở P6) |
