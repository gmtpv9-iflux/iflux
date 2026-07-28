# Post-Implementation Audit & Exit Evidence — Affiliate Attribution

**Date:** 2026-07-28  
**Trạng thái:** ⏳ **CHƯA PASS tổng thể** — G2/G3/G4–G10 ✅ · **G1 Path C Google browser** còn 1 bước Owner  
**Scope:** Sau deploy Path C fix + S6 cleanup + MINH10 migration · Production `https://iflux.vn`  
**Input:** [05-Solution-Design](05-Solution-Design-Identity-Creation.md) · [01-Owner-Decisions-LOCK](01-Owner-Decisions-LOCK.md) · [06-Regression-Checklist](06-Regression-Checklist.md)

---

## Executive summary (Reviewer)

| Hạng mục | Verdict |
|----------|---------|
| **Kiến trúc (Boundary)** | ✅ **Đạt** — AR sole owner · server single write module |
| **Cleanup / Replacement** | ✅ **Đạt** — grep G4–G6 · G9–G10 PASS (2026-07-28) |
| **Capability Independence (AC-17 / G7–G8)** | ✅ **Đạt** — forbidden grep AR = 0 · T16–T18 |
| **Regression E2E (controlled API + SQL)** | ✅ **Đạt** — new identity · dedupe · existing baseline |
| **G1 Path C Google browser** | ⏳ **Chưa** — OAuth không automate được; client wiring ✅ · server path ✅ |
| **Overall Task** | ⏳ **Chưa PASS** — chờ Owner chạy Path C §8 script (Google account mới) |

**Kết luận:** Reviewer có thể ký architecture + cleanup. **Không ký PASS task** cho đến khi Path C Google browser After evidence được ghi.

---

## 1. Authority audit (code trace)

### 1.1 Target chain (SoT)

```text
affiliate-resolver.js (capture + read + clear)
        │ getCodeForIdentityCreation()
        ▼
Thin wiring: auth-login-init · auth-register-init · google-onetap · auth-social · auth.js
        │ POST body referral_code (optional)
        ▼
Backend legacy-auth/auth.service.js
        │ resolveReferrer(code) — chỉ khi INSERT identity mới
        ▼
users.referred_by (INSERT only — no UPDATE path found)
        ▼
notifyReferralSignupF0Safe (referral-signup.consumer.js)
        │ dedupeKey: affiliate_referral:{newUserId}
        ▼
user_inbox_notifications (AFFILIATE_REFERRAL_SUCCESS)
        ▼
Consumers: Notification · getAffiliateSync · Commission (read server)
```

### 1.2 Server write authority — **PASS (single module)**

| Operation | Owner | File | Evidence |
|-----------|-------|------|----------|
| INSERT `referred_by` (email) | `createUserFromPending` | `auth.service.js` L124–134 | OTP payload `referred_by` at verify |
| INSERT `referred_by` (social) | `createSocialUser` | `auth.service.js` L545–557 | `referredBy \|\| null` at INSERT |
| UPDATE `referred_by` | **None** | grep `UPDATE users SET.*referred_by` → **0 matches** | Immutable post-create |
| Notification F0 | `notifyReferralSignupF0Safe` | `referral-signup.consumer.js` | 2 **call sites** trong cùng `auth.service.js` (verify + social) |

### 1.3 Client — không ghi server authority (Production)

| Path | Ghi `referred_by` server? | Evidence |
|------|----------------------------|----------|
| `loginWithSocial` API | ❌ | Chỉ POST `referral_code`; server quyết định |
| `applyReferrerToUser` | ❌ khi `useApi()` | `auth.js` L551–552: `if (useApi()) return;` |
| `linkNewUserToReferrer` | ❌ Production | Chỉ gọi từ `applyReferrerToUser` (sandbox) |

### 1.4 Capture write authority

| Writer | File | Status |
|--------|------|--------|
| **Primary** | `affiliate-resolver.js` `storeAttribution()` | ✅ Sole cookie/LS writer |
| Delegate | `loyalty-affiliate-store.captureRefFromUrl` → `AR.resolve()` | Thin delegate |
| Delegate | `share-action-store.registerUrlAttribution` → LAS → AR | Thin delegate |
| Dead | `loyalty-affiliate-store.storeRefCode` | ⚠️ Defined + exported · **0 call sites** (grep) |

---

## 2. Grep gate (evidence 2026-07-28)

Command: `rg` trên `User_Web` + `Admin_Design_system` + `backend`, exclude `_bak/`.

### 2.1 `referred_by` assignment

| Location | Layer | Authority? |
|----------|-------|------------|
| `auth.service.js` INSERT | Server | ✅ |
| `auth.js` L498, L532 | Client profile projection | ❌ sandbox/local only |
| `subscription-orders-store.js` L290 | Client order meta | ❌ not signup |

**Server INSERT owners:** 2 functions, **1 module** (`legacy-auth/auth.service.js`).

### 2.2 `notifyReferralSignup` / ReferralCreated producer

| Call site | Trigger |
|-----------|---------|
| `auth.service.js` L333 | Email verify → `createUserFromPending` |
| `auth.service.js` L617 | Social → `createSocialUser` (isNew only) |
| `referral-signup.consumer.js` L22 | **Single implementation** |

**Strict reviewer "1 call site":** ❌ FAIL (2 call sites).  
**Semantic "1 producer module":** ✅ PASS (`referral-signup.consumer.js` + dedupe key).

### 2.3 `applyReferrerToUser`

```
User_Web/iflux-web-ui/auth.js:551  function applyReferrerToUser
User_Web/iflux-web-ui/auth.js:556  linkNewUserToReferrer
User_Web/iflux-web-ui/auth.js:1294 loginWithEmailLocal path
User_Web/iflux-web-ui/auth.js:1354 loginWithPhone local path
```

**Strict expected 0:** ❌ FAIL — symbol còn.  
**Production API (`useApi()`):** ✅ Early return L552 — **0 authority runtime**.

### 2.4 `linkNewUserToReferrer`

```
loyalty-affiliate-store.js:674  definition
loyalty-affiliate-store.js:908  export
auth.js:556                     caller (sandbox only)
```

**Strict expected 0 authority:** ❌ FAIL — chưa DELETE.  
**Production:** ⚠️ Unreachable via API guard.

### 2.5 `captureRefFromUrl`

| File | Role |
|------|------|
| `loyalty-affiliate-store.js:466` | Delegate → `AR.resolve()` |
| `share-action-store.js:231–232` | Calls LAS delegate |
| `affiliate-resolver.js` | **Actual capture** via `resolve()` / `storeAttribution` |

**Strict "1 grep hit":** ❌ FAIL (3 symbols).  
**Write owner:** ✅ PASS (1 writer `storeAttribution`).

---

## 3. Journey audit — existing account vs new (Reviewer §4–5)

### 3.1 Client: `referral_code` gửi khi nào?

Login page (`auth-login-init.js` L137–149): đọc Context **một lần lúc init** → truyền vào `IfluxAuthSocial.initPage`.

OAuth click (`auth-social.js` L260–272): **re-read** `getCodeForIdentityCreation()` lúc bấm nút.

`auth.js` `loginWithSocial` API (L1301–1305): inject Context nếu opts thiếu.

→ **Account cũ vẫn có thể gửi `referral_code` trong POST** nếu Context còn active.

### 3.2 Backend: account đã tồn tại — evidence

```610:627:backend/src/modules/legacy-auth/auth.service.js
  if (!user) {
    const referredBy = await resolveReferrer(payload.referral_code);
    user = await createSocialUser(provider, profile, referredBy);
    isNew = true;
    ...
    await notifyReferralSignupF0Safe({ ... referredById: referredBy });
  }

  return { user, isNew };
```

| Case | `referral_code` in POST | `referred_by` DB | Notification |
|------|-------------------------|------------------|--------------|
| **User mới** (Google lần đầu) | Có (nếu Context active) | Set tại INSERT | ✅ 1 lần (nếu referredBy truthy) |
| **User đã tồn tại** | Có thể vẫn gửi | **Không đổi** — block `if (!user)` skip | ❌ Không gọi hook |
| **Login lại** (refresh session) | N/A | Không đổi | ❌ |

**Dedupe notification:** `dedupeKey: 'affiliate_referral:' + newUserId` — không duplicate cho cùng user mới.

### 3.3 Journey matrix

| Journey | Code path wired? | E2E post-deploy | Verdict |
|---------|------------------|-----------------|---------|
| Affiliate → Register Email | ✅ `registerApi` + OTP | ❌ Not run | ⏳ Pending |
| Affiliate → Register Google | ✅ register-init + social | ❌ Not run | ⏳ Pending |
| **Affiliate → Login Google (new)** Path C | ✅ auth-login-init fix | ❌ Not run | ⏳ **Gate** |
| Affiliate → One Tap | ✅ google-onetap.js | ❌ Not run | ⏳ Pending |
| Affiliate → Apple / Facebook | ✅ auth-social click read | ❌ Not run | ⏳ Pending |
| Affiliate → Zalo | ✅ callback + AR fallback | ❌ Not run | ⏳ Pending |
| Existing account login | ✅ Backend skip INSERT | ❌ Not run | ⏳ Code-only PASS |
| Expired context | ✅ `readActive()` null | ❌ Not run | ⏳ Pending |

---

## 4. Exit evidence — DB Production (2026-07-28 post-deploy)

### 4.1 Before (audit — locked)

| Metric | Value |
|--------|-------|
| Path C test user | `trungpv.gpg@gmail.com` |
| `referred_by` | **NULL** |
| `created_at` | 2026-07-28 12:41 |
| `AFFILIATE_REFERRAL_SUCCESS` inbox rows (ever) | **0** |
| Users with referrer | **1 / 15** |

### 4.2 After (controlled E2E — 2026-07-28 ~13:47 ICT)

**Test run:** API controlled regression trên Production (`POST /api/auth/register` + `verify-email` với `referral_code=IFL9552M`).  
**User A (referrer):** `phamvan@gmail.com` · `IFL9552M` · id `7a96f605-d563-4ada-bf5c-4dd82fe9fd03`  
**User B (new identity):** `e2e-aff-pathc-test-20260728@iflux.vn` · id `043fb6ed-3a1e-43b0-b895-afeedfba2aa1`

| Metric | Before | After | Verdict |
|--------|--------|-------|---------|
| Users total | 15 | **16** | +1 new identity |
| Users with `referred_by` | 1 | **2** | +1 attributed |
| `AFFILIATE_REFERRAL_SUCCESS` inbox (ever) | **0** | **1** | ✅ first referral notification |
| F0 members under `phamvan@gmail.com` | 1 (`phamvan3`) | **2** (+ e2e test user) | ✅ server authority |
| `trungpv.gpg@gmail.com` `referred_by` | NULL | **NULL** | ✅ unchanged baseline |
| `phamvan3@gmail.com` `referred_by` | `7a96f605…` | **`7a96f605…`** | ✅ unchanged baseline |
| Login B ×2 after create | — | notification count **still 1** | ✅ dedupe |

```sql
-- AFTER (Production Postgres 2026-07-28 13:47 ICT)
SELECT COUNT(*) AS total, COUNT(referred_by) AS with_referrer FROM users;
-- total=16, with_referrer=2

SELECT COUNT(*) FROM user_inbox_notifications
WHERE template_code = 'AFFILIATE_REFERRAL_SUCCESS';
-- 1

SELECT u.email, u.referred_by, r.email AS referrer
FROM users u LEFT JOIN users r ON u.referred_by = r.id
WHERE u.email = 'e2e-aff-pathc-test-20260728@iflux.vn';
-- referred_by = 7a96f605… (phamvan@gmail.com)

SELECT c.email FROM users c
WHERE c.referred_by = '7a96f605-d563-4ada-bf5c-4dd82fe9fd03' ORDER BY c.created_at;
-- phamvan3@gmail.com · e2e-aff-pathc-test-20260728@iflux.vn
```

**Event log (notification inbox = ReferralCreated consumer output):**

| created_at | template_code | dedupe_key | recipient |
|------------|---------------|------------|-----------|
| 2026-07-28 13:47:38+07 | AFFILIATE_REFERRAL_SUCCESS | `affiliate_referral:043fb6ed-3a1e-43b0-b895-afeedfba2aa1` | phamvan@gmail.com |

**pm2 log:** `Demo OTP mode` → user created via `verifyEmailCode` → referral hook fired.

**Path C Google browser After:** ⏳ **Chưa chạy** — §9 row T3 · §8 script bước 2–5 vẫn cần Owner incognito + Google account mới.

---

## 5. Regression expectations (code-backed)

| Scenario | Expected | Code evidence |
|----------|----------|---------------|
| Affiliate → Google Login → **account existed** | `referred_by` unchanged | `socialLoginOrRegister` skip `if (!user)` block |
| Same | No notification | Hook inside `if (!user)` only |
| Affiliate → Google Login → **account new** | `referred_by` set | `createSocialUser(..., referredBy)` |
| Same | Notification ×1 | `notifyReferralSignupF0Safe` + dedupeKey |
| Refresh / login again | No 2nd notification | No hook on existing user path |

**E2E proof:** ✅ Controlled API + SQL (§9) · ⏳ Path C Google browser (§10)

---

## 9. E2E Regression Audit Matrix (Reviewer evidence)

**Run date:** 2026-07-28 ~13:47 ICT · **Environment:** Production `https://iflux.vn`  
**Referrer A:** `phamvan@gmail.com` / `IFL9552M` / id `7a96f605-d563-4ada-bf5c-4dd82fe9fd03`

### 9.1 Scenario table

| Scenario | User existed | `referred_by` trước | `referred_by` sau | Notification Δ | PASS |
|----------|--------------|---------------------|-------------------|----------------|------|
| **Register email · new account** (G2 proxy) | No | NULL | `7a96f605…` | 0 → **1** | ✅ |
| **Password login · new account ×2** (dedupe) | Yes | `7a96f605…` | `7a96f605…` | **0** (vẫn 1 total) | ✅ |
| **Existing · phamvan3** (baseline SQL) | Yes | `7a96f605…` | `7a96f605…` | 0 | ✅ |
| **Existing · trungpv Google** (baseline SQL) | Yes | NULL | NULL | 0 | ✅ |
| **Path C · Affiliate → Login Google · new** | No | — | — | — | ⏳ §10 |
| **Path C · Affiliate → Login Google · existing** | Yes | NULL | NULL (baseline) | 0 | ⏳ §10 |

### 9.2 DB before / after (aggregate)

| Snapshot | users | with_referrer | AFFILIATE_REFERRAL_SUCCESS |
|----------|-------|---------------|----------------------------|
| **Before** (§4.1 · pre-E2E) | 15 | 1 | **0** |
| **After** (§4.2 · post-E2E) | 16 | 2 | **1** |

### 9.3 Notification before / after (referrer A)

| Snapshot | COUNT |
|----------|-------|
| Before | **0** |
| After | **1** (`dedupe_key=affiliate_referral:043fb6ed-…`) |

### 9.4 Event log (ReferralCreated consumer)

Không có bảng event log riêng — **inbox row = event evidence**:

```text
2026-07-28 13:47:38+07 | AFFILIATE_REFERRAL_SUCCESS | phamvan@gmail.com
  dedupe_key: affiliate_referral:043fb6ed-3a1e-43b0-b895-afeedfba2aa1
  body: E2E PathC Test đã đăng ký thành công thông qua nhánh giới thiệu của bạn!
```

### 9.5 Affiliate Dashboard (server authority · G3)

SQL equivalent `getAffiliateSync('7a96f605…')` members F0:

| email | referral_code | joined |
|-------|---------------|--------|
| phamvan3@gmail.com | IFLKY71C | 2026-07-06 |
| e2e-aff-pathc-test-20260728@iflux.vn | IFL7OD7M | 2026-07-28 |

### 9.6 Path C client wiring (Production verify)

```bash
curl -s https://iflux.vn/User_Web/iflux-web-ui/auth-login-init.js | rg getCodeForIdentityCreation
# L139–149: affiliateReferralCodeForIdentity() → AR.getCodeForIdentityCreation()
```

⏳ **Browser OAuth** (Google account mới qua Header「Đăng nhập」) chưa chạy — không thể automate trong agent session.

---

## 6. Gaps blocking PASS (action list)

### P0 — còn mở

| # | Gap | Gate | Status |
|---|-----|------|--------|
| G1 | Path C Google browser E2E (§10 script bước 2–5) | G1 | ⏳ Owner manual |
| D5 | R1 re-run sau G1 PASS | G3 | ⏳ |

### P1 — đã đóng (2026-07-28)

| # | Item | Status |
|---|------|--------|
| G2 | `referred_by` set once at Identity Created | ✅ §9 |
| G3 | Notification + Dashboard server authority | ✅ §9.3–9.5 |
| G4 | DELETE client authority symbols | ✅ grep 0 |
| G5 | Sole AR capture owner | ✅ grep |
| G6 | No dual-read outside AR | ✅ grep 0 |
| G7 | AC-17 Provider Independence | ✅ |
| G8 | T16–T18 | ✅ 06 §T16–T18 |
| G9 | Forbidden tokens in AR | ✅ 0 |
| G10 | Grep cleanup | ✅ §7 |
| MINH10 | Legacy publicId migration + OD-AFF-10 Accept 404 | ✅ |

---

## 7. G10 grep evidence (2026-07-28 post-S6)

```text
G4 applyReferrerToUser|linkNewUserToReferrer → 0 matches (User_Web)
G5 storeAttribution → affiliate-resolver.js only
G5 captureRefFromUrl|storeRefCode → 0 (removed from LAS)
G6 localStorage.getItem('iflux_ref_code') outside AR → 0
G9 forbidden tokens in affiliate-resolver.js → 0
UPDATE users SET referred_by → 0
emitReferralCreatedAfterIdentityCreated → 2 call sites via 1 wrapper
```

---

## 8. Reviewer sign-off matrix

| Gate | Status | Evidence |
|------|--------|----------|
| Kiến trúc (Boundary) | ✅ PASS | §1 |
| Cleanup / Replacement | ✅ PASS | §7 |
| Capability Independence | ✅ PASS | §7 · 08 G7–G9 |
| G2 · G3 Regression | ✅ PASS | §9 |
| G1 Path C Google browser | ⏳ Pending | §8 script |
| Overall Task | ⏳ **Chưa PASS** | G1 browser |

| Role | PASS? | Date |
|------|-------|------|
| Architecture Reviewer | ☐ | |
| Owner | ☐ | |

---

## 10. Path C E2E script (Owner — đóng G1)

**0. (Sau purge §12)** Đăng ký **User A** trên User Web → copy link `https://iflux.vn/IFLxxxxxx`.
1. User B incognito: mở link A →「Đăng nhập」→ Google **account chưa từng đăng ký iFlux**.
2. Verify SQL + inbox A + Affiliate members.
3. User B login lại → inbox A **không** thêm row.
4. User C (Google account **đã có** qua link) → `referred_by` C **không đổi**.
5. Ghi After vào §9 row T3 · tick G1.

---

## 11. MINH10 Migration Completeness Audit (Reviewer B · C · D)

**Run date:** 2026-07-28 · **Environment:** Production Postgres + `https://iflux.vn`

### 11.B — Identity fields: chỉ `referral_code` hay còn cột khác?

**Contract (AFF-ID-002 / migration 025):** `publicId := referral_code` — **một cột duy nhất**, không tách `public_id` · `share_url` · `cached_url` trong DB.

| Field (reviewer ví dụ) | Trong DB? | SoT / runtime |
|------------------------|-----------|---------------|
| `referral_code` | ✅ `users.referral_code` | Canonical identity · **đã migrate** `MINH10` → `IFLMVN10` |
| `public_id` | ❌ **Không có cột** | API alias: `publicId: user.referral_code` (`auth.routes.js` L144) |
| `share_url` | ❌ **Không persist** | Runtime: `buildReferralLink(referral_code)` · Share Foundation decorate |
| `cached_url` | ❌ **Không tồn tại** | — |
| `referred_by` | ✅ UUID FK | Không liên quan publicId · minh user = NULL (unchanged) |

**`users` schema (19 cột — identity-related):** `id` · `email` · `referral_code` · `referred_by` · `auth_provider` · `auth_provider_id` · profile fields.

**Row `minh@iflux.vn` sau migration:**

| Column | Value |
|--------|-------|
| `referral_code` / publicId | **IFLMVN10** |
| `referred_by` | NULL |
| `updated_at` | 2026-07-28 13:44:44+07 |

**Kết luận B:** Migration **đúng mô hình** — không có cột identity thứ hai cần sync. `share_url` / link affiliate = **derive** từ `referral_code` lúc runtime (`/IFLMVN10`).

---

### 11.C — Còn dữ liệu nào tham chiếu `MINH10`?

**Full-table scan** (85 bảng · text/jsonb/varchar · Production 2026-07-28):

| Location | MINH10 hits |
|----------|-------------|
| `users.referral_code` | **0** |
| `users` (email/display_name/…) | **0** |
| `user_inbox_notifications` (title/body/href/dedupe) | **0** |
| `community_posts.payload` | **0** |
| `email_verification_otps.payload` | **0** |
| `subscription_orders.transfer_ref` | **0** |
| `admin_audit_log` (full row JSON) | **0** |

**Codebase active (User_Web + backend, exclude `_bak/` + docs):** **0** runtime references.

**Kết luận C:** Migration DB **hoàn chỉnh** — không còn orphan `MINH10` trong Production data.

---

### 11.D — `/MINH10` → 404: 🔒 **OD-AFF-10 LOCKED — Option A Accept 404**

| URL | HTTP | Trước migration | Sau migration | Mong muốn (OD-AFF-10) |
|-----|------|-----------------|---------------|------------------------|
| `https://iflux.vn/MINH10` | **404** | **404** (audit E5) | **404** | ✅ **404** |
| `https://iflux.vn/IFLMVN10` | **200** | N/A | **200** | ✅ **200** |

**Nguyên nhân kỹ thuật:**

```text
nginx pattern gate: ^/IFL[A-Za-z0-9]{5,17}$  (infra/nginx-iflux-production-locations.conf L26–37)
MINH10 không match IFL gate → try_files → 404
Client AR: PUBLIC_ID_RE = /^IFL[A-Z0-9]{5,17}$/
```

**Owner Decision (LOCKED 2026-07-28):**

| Option | Quyết định |
|--------|------------|
| **A — Accept 404** | 🔒 **LOCKED** — hành vi mong muốn sau migration |
| B — 301 redirect | ❌ **Rejected** — không thêm nginx/compatibility layer |

**Lý do Owner (OD-AFF-10):** Không backward compat sandbox IDs · data test đã migrate · không user production dùng MINH10 · chỉ rule `^IFL[A-Z0-9]{5,17}$` từ thời điểm này.

**Kết luận D:** ✅ **PASS** — 404 là product intent · không action nginx.

---

## 12. Clean-slate user purge (G1 prep — Owner 2026-07-28)

**Script:** `backend/scripts/purge-test-users-production.sql`

| Metric | BEFORE | AFTER |
|--------|-------:|------:|
| `users` | 16 | **0** |
| `subscription_orders` | 5 | **0** |
| `user_inbox_notifications` | 8 | **0** |
| `affiliate_order_credits` | 1 | **0** |
| `admin_accounts` | 4 | **4** ✅ |

**Admin giữ nguyên:** `gm.tpv9@gmail.com` (is_super) · `hobaolongmedia@gmail.com` · `mrant.itcp@gmail.com` · `trankimloan83@gmail.com`

**Đã xóa kèm theo user:** orders · notifications · affiliate credits · comments (user-linked) · OTP pending · CASCADE tables.

**Có thể đăng ký lại** mọi email User Web (kể cả email trùng admin — bảng `admin_accounts` tách biệt).

---

*Post-implementation audit — G1 browser pending · clean-slate ready · MINH10 OD-AFF-10 PASS.*
