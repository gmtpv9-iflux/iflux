# Phase D — D5 Production Regression Checklist

**Date:** 2026-07-28 (rev D1-rev)  
**Phase:** D5 — Functional Regression (Production)  
**Trạng thái:** ✅ **Authorized** — D1-rev shipped 2026-07-28 · chạy trên https://iflux.vn  
**Blocker:** [`PhaseD-D1-rev-Preference-Model-Owner-Decision.md`](PhaseD-D1-rev-Preference-Model-Owner-Decision.md)  
**Contracts:** [`08-Admin-UX-Contract.md`](08-Admin-UX-Contract.md) · [`11-User-Preference-UI-Contract.md`](11-User-Preference-UI-Contract.md)  
**Input:** [`PhaseD-D4-Architecture-Verification.md`](PhaseD-D4-Architecture-Verification.md) ✅ (dispatcher/delivery gates)

---

## 1. Mục tiêu D5 (OD-D8)

| # | Case | PASS khi |
|---|------|----------|
| **R0** | Naming alignment Admin ↔ User | Admin list + User toggle = cùng **Tên mẫu** (`name`) |
| R1 | Admin sửa **Tiêu đề/Nội dung mẫu** | Chỉ notification **mới** dùng copy mới · Tên mẫu không đổi trừ khi Admin sửa name |
| **R2** | **Type-level preference independence** | Tắt type A **không** block type B cùng group |
| R3 | Double-send — Affiliate signup | **1** server inbox · **0** client local referral |
| R4 | Double-send — Community follower post | **1** server · **0** client community_post |
| R5 | Bell badge | Summary từ `GET /api/notifications/summary` |
| R6 | Quyền riêng tư UI | Toggle **type_code** sync server · multi-tab |

**FAIL → Phase D không PASS.**

**Không chạy R2 kiểu cũ:** *"Affiliate OFF → không nhận Affiliate"* — **không** chứng minh type independence.

---

## 2. R0 — Naming alignment (NEW)

### Setup

1. Admin → `NOTIF-USER-007` → ghi **Tên mẫu** (vd. *Thành viên mới đăng ký qua link giới thiệu*)
2. User A → Quyền riêng tư → section Thông báo

### Expected

| Admin | User Web |
|-------|----------|
| Header list = **Tên mẫu** (không phải tiêu đề mẫu) | Toggle label = **cùng Tên mẫu** |
| Expand: Tiêu đề mẫu ≠ Tên mẫu | User **không** thấy tiêu đề mẫu ở toggle |

### FAIL nếu

- List Admin hiển thị `template.title` làm tên
- User thấy "Thông báo Affiliate" bucket label thay vì Tên mẫu

---

## 3. R2 — Type-level preference independence — BẮT BUỘC

### Setup

User A → Quyền riêng tư:

```text
AFFILIATE_REFERRAL_SUCCESS     = ON
AFFILIATE_COMMISSION_EARNED    = OFF
```

*(UI: 2 toggle riêng dưới group Affiliate — không switch group)*

### Test 2a — Referral (type ON)

1. User B signup qua mã giới thiệu A  
2. **Expected:** Postgres inbox User A +1 row `AFFILIATE_REFERRAL_SUCCESS`

```sql
SELECT template_code, title, created_at
FROM user_inbox_notifications
WHERE user_id = :user_a
  AND template_code = 'AFFILIATE_REFERRAL_SUCCESS'
ORDER BY created_at DESC LIMIT 3;
-- Expected: 1 row mới
```

### Test 2b — Commission (type OFF)

1. Trigger commission event cho User A *(khi consumer `AFFILIATE_COMMISSION_EARNED` active)*  
2. **Expected:** inbox **0** row mới `AFFILIATE_COMMISSION_EARNED`

```sql
SELECT COUNT(*) FROM user_inbox_notifications
WHERE user_id = :user_a
  AND template_code = 'AFFILIATE_COMMISSION_EARNED'
  AND created_at > :test_start;
-- Expected: 0
```

### Test 2c — Negative (group coupling — phải FAIL test)

1. Chỉ tắt `AFFILIATE_COMMISSION_EARNED`  
2. Trigger referral  
3. **FAIL nếu:** referral không vào inbox (chứng tỏ group/bucket vẫn coupling)

### PASS khi

- Referral ON → dispatch dù Commission OFF  
- Commission OFF → skip dispatch dù Referral ON  
- Affiliate members table vẫn update bình thường khi skip notification

---

## 4. R3 — Affiliate signup (double-send)

*(Giữ nguyên — User A referral type ON)*

1. User A — `AFFILIATE_REFERRAL_SUCCESS` ON  
2. User B signup referral  
3. **Expected:** 1 server row · 0 client `referral_signup` mới · bell +1

Chi tiết SQL/DevTools: §2 cũ (R3) — không lặp bucket toggle setup.

---

## 5. R4 — Community follower post (double-send)

*(Giữ nguyên)*

1. User C follow User D · `COMMUNITY_POST_FROM_FOLLOWING` ON  
2. D đăng bài  
3. **Expected:** 1 server row · 0 local `community_post`

---

## 6. R1 — Admin template new-only

1. Admin `NOTIF-USER-007` — đổi **Tiêu đề mẫu** (không đổi Tên mẫu)  
2. Referral mới → inbox title mới  
3. Inbox cũ giữ title snapshot  
4. User toggle label (**Tên mẫu**) **không** đổi khi chỉ sửa tiêu đề

---

## 7. R5 — Bell summary

Reload → Network `GET /api/notifications/summary` → badge theo API.

---

## 8. R6 — Multi-tab type sync

Tab A: toggle `AFFILIATE_COMMISSION_EARNED` OFF → Tab B reload → vẫn OFF · Referral type không bị ảnh hưởng.

---

## 9. Evidence template

| Case | Tester | Date | Env | Result | Notes |
|------|--------|------|-----|--------|-------|
| R0 Naming | | | prod | ☐ PASS ☐ FAIL | |
| R2a Referral ON | | | prod | ☐ PASS ☐ FAIL | |
| R2b Commission OFF | | | prod | ☐ PASS ☐ FAIL | |
| R2c No group coupling | | | prod | ☐ PASS ☐ FAIL | |
| R3 Double-send | | | prod | ☐ PASS ☐ FAIL | |
| R4 Community | | | prod | ☐ PASS ☐ FAIL | |
| R1 Template | | | prod | ☐ PASS ☐ FAIL | |
| R5 Bell | | | prod | ☐ PASS ☐ FAIL | |
| R6 Multi-tab | | | prod | ☐ PASS ☐ FAIL | |

---

## 10. Exit D5

```text
D5 PASS when R0–R6 PASS on Production (D1-rev model)
  → Phase D Foundation COMPLETE
```

---

*Phase D D5 Regression — D1-rev model — BLOCKED pending implement 2026-07-28.*
