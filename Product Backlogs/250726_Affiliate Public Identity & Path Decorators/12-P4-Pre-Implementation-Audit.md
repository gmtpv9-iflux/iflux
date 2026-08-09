# P4 — Pre-Implementation Audit

**Date:** 2026-07-27  
**Phase:** P4 — Backward Compatibility + Preview  
**Prerequisite:** P3 PASS (Owner sign-off)

---

## Scope lock

> **P4 chỉ verify legacy compat + preview; sửa tối thiểu `share-feature-boot.js` redirect query→path. Không đụng Share Foundation decorate, resolver, auth, signup logic, loyalty capture rule, nginx, P5 cleanup fallback `?ref=`.**

| Được phép | Cấm |
|-----------|-----|
| Verify `captureRefFromUrl` query + path | Đổi `decorateAffiliateRef()` (P3 owner) |
| Sửa `/chia-se` redirect → path qua Foundation | Xóa capture `?ref=` (P5 + Owner policy) |
| Preview matrix HTTP (FB/Zalo UA) | OG/canonical inject publicId |
| Evidence report | Route explosion / Page mới |

---

## Audit 1 — Legacy query capture

| Check | Owner | Status |
|-------|-------|--------|
| `parseRefFromLocation()` — `?ref=` / `?r=` | `loyalty-affiliate-store.js` | ✅ ACTIVE |
| `captureRefFromUrl()` gọi query **trước** path | L518–522 | ✅ |
| Path capture `parsePublicIdFromPath()` | P2 resolver delegate | ✅ |
| Signup `captureRefFromUrl` on register | `auth-register-init.js` | ✅ |

**Verdict:** Legacy `?ref=IFL…` vẫn capture — **không cần sửa Loyalty trong P4**.

---

## Audit 2 — Outgoing ad-hoc còn sót

| File | Trước P4 | P4 action |
|------|----------|-----------|
| `share-feature-boot.js` L37 | `?ref=` redirect | **MODIFY** → path qua Foundation |
| `loyalty-affiliate-store.js` L96 | fallback `?ref=` boot sớm | **P5** — giữ nguyên |

---

## Audit 3 — SEO / Preview (Pipeline A/B)

| URL mẫu | HTTP | canonical / og:url | publicId trong meta |
|---------|------|-------------------|---------------------|
| `/cong-dong/bai-viet/hpg-…` | 200 | sạch | ❌ không |
| `/IFL9552M/cong-dong/bai-viet/hpg-…` | 200 | sạch (nginx rewrite) | ❌ không |
| `…?ref=IFL9552M` | 200 | sạch | ❌ không |
| `/IFL9552M/cong-dong` (list) | 200 | không có og tĩnh | ❌ không IFL/ref trong HTML |

**Verdict:** Article entity meta **PASS** · Community list lean client meta (awareness — không blocker P4 minimum matrix).

---

## Audit 4 — Preview minimum matrix (Plan § P4)

| # | Mẫu | UA | PASS khi |
|---|-----|-----|----------|
| 1 | Community `/IFL9552M/cong-dong` | FB | HTTP 200 · không meta bẩn tĩnh |
| 2 | Article deep link affiliate path | FB | canonical/og sạch |
| 3 | Article affiliate path | Zalo | canonical/og sạch |
| 4 | Community affiliate path | Zalo | HTTP 200 |

---

## GO decision

| Gate | Result |
|------|--------|
| P3 PASS | ✅ |
| Legacy capture intact | ✅ |
| SEO article meta sạch | ✅ |
| Scope bounded (1 file code) | ✅ |

**GO P4** — thi công redirect compat + evidence.
