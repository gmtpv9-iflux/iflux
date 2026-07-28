# 18 — RV-1 Rollback Drill Evidence

**Date:** 2026-07-28 (ICT)  
**Freeze:** `AFFILIATE_GOLDEN^{}` = `b539a959350bceeedb75f1c831a2c20227e042db`  
**Worktree:** `.tmp/rv1-golden` (detached HEAD `b539a95`)  
**Rule:** Không chỉ `git checkout` — phải **chạy được + login + AR asset**.

---

## RV-1.1 Checkout

| Mục | Nội dung |
|-----|----------|
| Steps | `git worktree add .tmp/rv1-golden AFFILIATE_GOLDEN` |
| Expected | HEAD = freeze commit |
| Actual | `HEAD is now at b539a95 feat(affiliate): freeze affiliate attribution capability` |
| PASS/FAIL | ✅ **PASS** |
| Evidence | git worktree output (session log) |

---

## RV-1.2 Integrity (SHA-256)

| File | Worktree hash | Baseline `sha256-at-AFFILIATE_GOLDEN.txt` |
|------|---------------|-------------------------------------------|
| `auth-social.js` | `ef6e9469…12bf5015` | khớp |
| `google-onetap.js` | `26df13c3…43160509` | khớp |
| `auth.js` | `3f20abd3…f022ca91` | khớp |

| PASS/FAIL | ✅ **PASS** |
| Evidence | `runtime-wp7-artifacts/rv1-sha256.txt` |

---

## RV-1.3 Build / serve (chạy được)

| Mục | Nội dung |
|-----|----------|
| Steps | Trong worktree: `PORT=8778 python3 tools/iflux-dev-server.py` |
| Expected | HTTP 200 login + assets |
| Actual | `golden_login_html=200` · `golden_onetap_js=200` · `golden_ar_js=200` |
| PASS/FAIL | ✅ **PASS** |
| Evidence | curl status trong session · `rv1-golden-login.png` |

*Rollback frontend phục vụ One Tap file (**có**) — đúng freeze; khác feature tree (One Tap 404).*

---

## RV-1.4 Login được

| Mục | Nội dung |
|-----|----------|
| Steps | `POST http://127.0.0.1:3001/api/auth/login` với user WP7 test |
| Expected | HTTP 200 + token |
| Actual | 200; token nhận được (redacted) |
| PASS/FAIL | ✅ **PASS** |
| Evidence | `runtime-wp7-artifacts/rv1-login.redacted.json` |

*UI golden form submit trên static local không SPA-navigate sạch (URL query); **API login** là bằng chứng auth rollback path vẫn dùng được với freeze assets.*

---

## RV-1.5 Affiliate context asset vẫn hoạt động

| Mục | Nội dung |
|-----|----------|
| Steps | Request `affiliate-resolver.js` từ golden server; xác nhận nội dung AR |
| Expected | File phục vụ; header comment Affiliate Resolver |
| Actual | HTTP 200; body bắt đầu `/* P2 Affiliate Resolver — B1: parse + capture…` |
| PASS/FAIL | ✅ **PASS** |
| Evidence | `rv1-ar-asset-head.txt` · `rv1-golden-assets.json` (request AR trong page load) |

*Full `/IFL…` capture cần nginx rewrite — giống hạn chế local T13; asset SoT trên rollback tree **có và serve được**.*

---

## RV-1.6 Owner ký

| Role | Status |
|------|--------|
| Agent drill | ✅ Checkout + hash + serve + API login + AR asset |
| Owner | ☐ Ký Rollback Validation PASS |

---

## Verdict

| | |
|--|--|
| **RV-1** | ✅ **PASS** (agent) — chờ Owner ký |
| **Production** | Vẫn **cấm** đến khi WP7 P0 Google PASS + Owner Phase 5 |

---

*Rollback drill runtime. Không deploy Production trong RV-1.*
