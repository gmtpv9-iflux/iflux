# Runtime Baseline Capture — trước Phase 5

**Date:** 2026-07-28  
**HEAD / `AFFILIATE_GOLDEN^{}`:** `b539a959350bceeedb75f1c831a2c20227e042db`  
**Fingerprints:** [baseline-fingerprints/](baseline-fingerprints/)  
**Purpose:** Chứng minh **runtime đang sống** (không chỉ symbol) — để WP7 Before/After.  
**Không phải:** Architecture audit.

---

## 1. Capture protocol

| Flow | Evidence tối thiểu | Ai capture |
|------|-------------------|------------|
| Google Login existing user | Screenshot success + Network `POST /api/auth/social` + `GET .../auth/me` | Owner browser (OAuth) |
| Google Login new user | Screenshot + Network + DB `users` row nếu Path C | Owner |
| Password Login | Screenshot success hoặc Network login | Owner hoặc agent nếu có test account |
| OTP/Register | Screenshot bước verify hoặc Network OTP | Owner |
| Affiliate Path C | DB `referred_by` before/after + Network social body `referral_code` | Owner + prior controlled E2E |
| Redirect | URL before (`/dang-nhap?return=…`) → after | Owner |
| authMe | JSON response (id, email, …) — **không** paste token dài | Owner / DevTools |

**Artifact folder (Owner thả file):**  
`docs/Product Backlog/270728_Google Authentication Capability Discovery/runtime-baseline-artifacts/`  
(tên gợi ý: `google-existing-network.png`, `path-c-db.txt`, …)

---

## 2. Agent-captured runtime (2026-07-28) — không cần Google account

| Check | Result | Evidence |
|-------|--------|----------|
| `GET https://iflux.vn/api/auth/social/config` | **HTTP 200** | google.enabled=true · clientId present · apple/fb/zalo disabled |
| `GET https://iflux.vn/dang-nhap` | **HTTP 200** | HTML chứa `auth-social`, `btn-google` |
| `GET https://iflux.vn/home` | HTTP 301 (redirect chain OK) | CDN/route alive |

**Social config body (public client id — OK log):**

```json
{"google":{"enabled":true,"clientId":"642927266497-o04c7abj4rbj1lobf906342ivhaoecse.apps.googleusercontent.com"},"apple":{"enabled":false},"facebook":{"enabled":false},"zalo":{"enabled":false}}
```

Saved: `runtime-baseline-artifacts/social-config-20260728.json` (nếu ghi được).

---

## 3. Matrix — runtime status

| Flow | Status | Evidence now | WP7 compare |
|------|--------|--------------|-------------|
| Google Login existing | ⏳ **OWNER CAPTURE** | Page+config live; OAuth cần browser | Must PASS after rebuild |
| Google Login new | ⏳ **OWNER CAPTURE** | Wiring code ✅ | Prefer PASS |
| Password Login | ⏳ **OWNER CAPTURE** (path code ✅) | — | No regress |
| OTP/Register | ⏳ **OWNER CAPTURE** (path code ✅) | — | No regress |
| Affiliate Path C (controlled API+SQL) | ✅ **PRIOR EVIDENCE** | Affiliate `07-…Exit-Evidence` E2E controlled PASS | No regress |
| Affiliate Path C (Google browser) | ⚠️ **KNOWN GAP** | Doc 07 G1 ⏳ · wiring ✅ | PASS or waiver |
| Redirect (login page) | ⏳ **OWNER CAPTURE** | Code `redirectAfterAuth` | Keep |
| Redirect (One Tap) | ✅ present (non-policy) | Code navigate in onetap | Expect **gone** after WP3 |
| Session / authMe after social | ⏳ **OWNER CAPTURE** | Code path establishSession+authMe | Keep |
| Remember me | ⏳ **OWNER CAPTURE** | Wiring opts | Keep |

---

## 4. Owner capture checklist (bắt buộc trước khi tuyên bố Runtime Baseline complete)

```text
[ ] R1 Google existing — screenshot + HAR/network POST /auth/social (200) + auth/me
[ ] R2 Google new — screenshot + network (+ DB nếu Path C)
[ ] R3 Password — screenshot hoặc network login 200
[ ] R4 OTP/Register — một bước chứng minh flow sống
[ ] R5 Redirect — URL before/after với ?return=
[ ] R6 authMe — JSON (redact token)
[ ] R7 Path C — chấp nhận prior controlled E2E + optional browser shot
```

**Gate:** Agent phần §2 PASS. Owner R1–R6 nên hoàn thành **trước WP7** (có thể song song WP1–6).  
**Không block WP1** nếu Owner chưa kịp screenshot — nhưng **block tuyên bố WP7 Regression PASS** nếu thiếu R1/R3/R5 tối thiểu.

---

## 5. Liên kết evidence có sẵn

| Topic | Doc |
|-------|-----|
| Affiliate controlled E2E | `../Affiliate Attribution Capability/07-Post-Implementation-Audit-Exit-Evidence.md` |
| Google/Affiliate runtime trace | `../Affiliate Attribution Capability/10-Google-Login-Affiliate-Runtime-Trace-Audit.md` |
| Regression matrix (status) | [07-Regression-Baseline-Evidence.md](07-Regression-Baseline-Evidence.md) |

---

*Runtime baseline — partial agent + Owner checklist. Không architecture.*
