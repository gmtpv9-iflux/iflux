# Phase C — C6 Functional Regression (Production)

**Date:** 2026-07-28  
**Phase:** C — Type Registry  
**Trạng thái:** ✅ **C6 PASS** — Phase C **PASS**  
**Prerequisite:** C5 Owner approved ✅  
**Environment:** Production (https://iflux.vn)

---

## 1. Pre-flight

| # | Check | PASS |
|---|-------|------|
| P1 | Backend Phase C files deployed | ✅ |
| P2 | Admin FE (`announcements-page.js`, `announcements.html`) deployed | ✅ |
| P3 | `validate-notification-seed.js` → exit 0 · 25 types | ✅ |
| P4 | Initial seed → 25 types (1 insert smoke + 24 update) | ✅ |
| P5 | Cloudflare cache purged | ✅ |
| P6 | pm2 `iflux-api` restarted | ✅ |

---

## 2. Core functional (carry-over B6)

| ID | Test | Result | PASS |
|----|------|--------|------|
| F1 | GET `/api/admin/notifications/types` → 25 items incl. NOTIF-PLT-000 | total=25 · smoke=NOTIF-PLT-000 | ✅ |
| F2 | Admin tag panel — no catalog script · aggregate from API | `announcements.html` không load catalog · JS HTTP 200 | ✅ |
| F3 | Save / restore / preview / 409 | Carry-over B6 · restore sau C6 test | ✅ |

---

## 3. Extended verification (Owner C6)

### 3.1 Admin template preserve on re-seed (OD-C6)

| Step | Result |
|------|--------|
| PATCH `AFFILIATE_REFERRAL_SUCCESS` → custom title/body | `C6 Custom Title` · v4 |
| Re-run seed | types updated: 25 · templates seed_updated: 25 |
| GET after seed | title/body **giữ nguyên** · `isCustom=true` |

**PASS:** ✅

---

### 3.2 Seed idempotency

```text
seed × 3 liên tiếp → total vẫn 25 · không duplicate
```

**PASS:** ✅

---

### 3.3 Smoke dispatch block (OD-C10)

```text
dispatcher.dispatch({ typeCode: 'PLATFORM_SMOKE_TEST' })
→ msg: Type nội bộ — không được dispatch (TYPE_NOT_DISPATCHABLE)
```

**PASS:** ✅

---

### 3.4 Metadata drift sync (OD-C6 types)

| Step | Result |
|------|--------|
| Seed `description` smoke type + marker `C6 drift marker` | |
| Re-seed | API description cập nhật có marker |
| Revert seed · seed lại | baseline restored |

**PASS:** ✅

---

## 4. Evidence log

| Field | Value |
|-------|-------|
| Tester | Agent (Owner C5 approve → C6) |
| Date | 2026-07-28 |
| Seed runs | validate + initial + preserve + 3× idempotent + drift + revert |
| CF purge | success |
| pm2 restart | iflux-api online |

---

## 5. Exit C6 → Phase C PASS

| Gate | Status |
|------|--------|
| P1–P6 | ✅ |
| F1–F3 | ✅ |
| 3.1 Admin preserve | ✅ |
| 3.2 Idempotency | ✅ |
| 3.3 Smoke block | ✅ |
| 3.4 Metadata sync | ✅ |

```text
C6 PASS ✅ → Phase C PASS ✅ → eligible Phase D
```

---

## 6. SoT sync (post-C6)

| Doc | Change |
|-----|--------|
| `06-Platform-SoT.md` §3.3 | Anti-drift ownership rules (OD-C6) — thay `DO NOTHING` |
| `06-Platform-SoT.md` §3.10 | Authoring SoT vs Runtime SoT (NEW) |

---

*Phase C C6 — Functional Regression — Production PASS 2026-07-28.*
