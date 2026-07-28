# Regression Checklist — Affiliate Attribution (T1–T18)

**Date:** 2026-07-28  
**Gates:** [08-Acceptance-Gates-G1-G10.md](08-Acceptance-Gates-G1-G10.md)  
**E2E evidence:** [07-Post-Implementation-Audit-Exit-Evidence.md](07-Post-Implementation-Audit-Exit-Evidence.md) §9

---

## T1–T15 (Journey + AC)

| ID | Journey | AC | Result | Evidence |
|----|---------|-----|--------|----------|
| T1 | Affiliate URL → capture | AC-1 | ☐ | Browser manual |
| T2 | Navigate away → context persist | AC-2 | ☐ | Browser manual |
| **T3** | **Affiliate → Login Google → new user (Path C)** | **AC-6, AC-16, G1** | ⏳ | 07 §10 · client wiring ✅ |
| T4 | Affiliate → Register email | AC-4 | ✅ | 07 §9 · `e2e-aff-pathc-test-20260728@iflux.vn` |
| T5 | Affiliate → Register Google | AC-5 | ☐ | Browser manual |
| T6 | Affiliate → One Tap | AC-7 | ☐ | Browser manual |
| T7 | Affiliate → Apple | AC-8 | ☐ | Browser manual |
| T8 | Affiliate → Facebook / Zalo | AC-8 | ☐ | Browser manual |
| T9 | Context expiry | AC-3 | ☐ | Browser manual |
| T10 | Post-attribute context clear | AC-13 | ☐ | Browser manual |
| T11 | Dashboard sync server | AC-12, G3 | ✅ | 07 §9.5 SQL members |
| T12 | Commission smoke server | AC-11 | ☐ | No paid order in test |
| T13 | Invalid code negative | — | ☐ | |
| T14 | Existing user login — no re-attribute | AC-14, G2 | ✅ | 07 §9 · phamvan3 · trungpv baseline |
| T15 | Admin create (future) | AC-15 | ☐ N/A | |

---

## T16–T18 (Provider Independence — G8)

| ID | Test | Result | Evidence |
|----|------|--------|----------|
| **T16** | Thêm provider mock — **không sửa** `affiliate-resolver.js` | ✅ | AC-17 design · wiring-only in auth-* |
| **T17** | Forbidden grep AR = 0 | ✅ | 08 §G10 · 07 §7 |
| **T18** | Dual-read grep outside AR = 0 | ✅ | 08 §G10 · 07 §7 |

---

## Regression negatives (G2 / G3)

| Scenario | Expected | Result | Evidence |
|----------|----------|--------|----------|
| Affiliate → Google Login → **account existed** | `referred_by` unchanged | ⏳ | SQL baseline trungpv · code path §3.2 |
| Same | No notification | ✅ | inbox still 0 for trungpv referrer |
| Affiliate → Register → **new account** | `referred_by` set once | ✅ | 07 §9 row 1 |
| Same | Notification ×1 | ✅ | 07 §9.3 |
| Login lại | No 2nd notification | ✅ | 07 §9 row 2 · dedupe |

---

## Path C E2E script (G1 — bắt buộc)

1. User A: link `https://iflux.vn/IFL9552M` (phamvan@gmail.com).
2. User B incognito: link →「Đăng nhập」→ Google **account mới**.
3. Verify SQL + inbox A + Affiliate table A.
4. User B login lại → no new notification.
5. User C (existing Google, e.g. `trungpv.gpg@gmail.com`) via link → `referred_by` unchanged.

**Controlled proxy đã chạy (T4/G2/G3):** register email + OTP demo · xem 07 §9.
