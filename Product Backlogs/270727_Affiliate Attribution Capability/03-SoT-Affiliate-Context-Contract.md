# SoT — Affiliate Context Contract

**Date:** 2026-07-28  
**Trạng thái:** 📝 **DRAFT** — chờ Gate G1  
**Parent SoT:** [02-SoT-Affiliate-Attribution.md](02-SoT-Affiliate-Attribution.md)  
**Owner Decisions:** OD-AFF-02, OD-AFF-03, OD-AFF-04

---

## 1. Purpose

Định nghĩa **contract semantic** của **Affiliate Context Capability** — sole owner capture, persist, read, expire, clear cho referral context từ Anonymous Visitor lifecycle.

Contract này **không** mô tả storage mechanism (cookie / localStorage / session). Cơ chế lưu = [05-Solution-Design-Identity-Creation.md](05-Solution-Design-Identity-Creation.md).

---

## 2. Capability owner

| Property | Value |
|----------|-------|
| **Capability name** | Affiliate Context |
| **Owners (hiện trạng — DELETE)** | `affiliate-resolver.js`, `loyalty-affiliate-store.js`, `auth.js`, `auth-register-init.js` — multi-owner |
| **Owner (target — REPLACE)** | **Một module/capability duy nhất** — tên implementation = Solution Design |

**Governance:** Sau refactor, grep Production **không** còn capture logic ngoài sole owner.

---

## 3. Context data model (semantic)

| Field | Required | Semantics |
|-------|----------|-----------|
| `referral_code` | ✅ | Public affiliate code parsed từ Affiliate URL (`IFL…`) |
| `captured_at` | ✅ | Timestamp first-touch capture |
| `source` | optional | `affiliate_path` — audit/debug only |
| `expires_at` | ✅ | Theo product lifetime rule |

**Không** lưu user id · email · provider trong context — context thuộc **anonymous** lifecycle.

---

## 4. Operations contract

### 4.1 `capture(affiliateUrl)`

| Input | Affiliate URL hợp lệ (path segment IFL…) |
| Output | Context record created **chỉ nếu** chưa có context active (first-touch) |
| Side effect | Persist context |
| Errors | Invalid URL → no-op (không throw user-facing) |

**Rule:** Capture chạy **sớm nhất** trong page lifecycle khi visitor vào site với Affiliate path — không phụ thuộc page Register/Login.

### 4.2 `read()`

| Input | — |
| Output | Active context hoặc `null` |
| Rule | Trả expired context = `null` |

**Consumer duy nhất được gọi read tại Identity Created:** **Identity Creation Contract** (không phải Notification, Dashboard, Register page riêng lẻ).

### 4.3 `persist(context)`

| Rule | Context phải survive navigation trong cùng browser lifecycle (AC-2) |
| Limit | Cross-device / cross-browser = **out of product guarantee** unless Owner mở R4 |

### 4.4 `expire()`

Context không còn active khi:

| Condition | Behavior |
|-----------|----------|
| `now > expires_at` | read() → null |
| Successful attribution consume | clear() |
| Explicit invalid code (server reject) | clear() — Solution Design |

**Product lifetime (chờ Owner R2):**

| Option | Semantics |
|--------|-----------|
| A (hiện tại prod) | 30 ngày từ capture |
| B (đề xuất) | Min(30 ngày, until Identity Created) |

### 4.5 `clear()`

| Trigger | After successful attribution · manual invalid · logout policy (Solution Design) |
| Rule | Sau clear, read() → null · re-capture allowed on new Affiliate visit |

---

## 5. Lifecycle diagram

```text
Visitor hits /IFL…
       │
       ▼
  capture() ──first-touch──► persist
       │
       │  (navigation, browse, any page)
       │
       ▼
 Identity Creation Contract
       │
       read() ──if active──► pass to Attribution
       │
       ▼
 Attribution success ──► clear()
       │
       ▼
  context = null
```

---

## 6. Boundaries

### 6.1 PNC (Personal Navigation Context)

| Aspect | Affiliate Context | PNC |
|--------|-------------------|-----|
| Purpose | Referral attribution | URL bar / navigation UX |
| Owner | Affiliate Context Capability | PNC capability |
| Dual-read | ❌ Cấm | ❌ |

PNC có thể đọc `ownerPublicId` cho shell — **không** substitute cho Affiliate Context read tại Identity Created.

### 6.2 Client graph stores (legacy)

| Store | Status |
|-------|--------|
| `iflux_referral_parents_v1` | **Demote** — projection UI only · không authority |
| `iflux_aff_context_v1` | **REPLACE** — sole owner mới |

---

## 7. Forbidden patterns

| Pattern | Reason |
|---------|--------|
| Page Register-only capture | Violates Journey Independence |
| Login page không đọc context | Path C FAIL |
| Provider passes `{}` empty ref | One Tap FAIL |
| Notification reads context | OD-AFF-07 |
| Second capture overwrites first-touch | R-02 violation |

---

## 8. Verification (grep / test)

| Check | Expected |
|-------|----------|
| Single capture owner | 1 module owns capture/persist/read/expire/clear |
| No capture in auth-register-init only | Deleted or delegate to sole owner |
| read() at Identity Created only | Contract in 04-SoT |
| T1, T2, T9, T10 | Regression PASS |

---

## 9. G1 Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Owner | | | ☐ APPROVED ☐ REVISE |
