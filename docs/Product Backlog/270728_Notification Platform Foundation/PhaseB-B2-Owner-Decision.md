# Phase B — B2 Owner Decision

**Date:** 2026-07-28  
**Phase:** B — Template System  
**Trạng thái:** ✅ **B2 PASS** — Owner sign-off 2026-07-28  
**Input:** [`PhaseB-Solution-Proposal.md`](PhaseB-Solution-Proposal.md) (rev Owner)

---

## 1. Approve Solution Proposal

| | Owner |
|---|-------|
| ✅ **APPROVE** hướng xử lý B1 (Reuse → Modify → Migrate → Delete) | 2026-07-28 |

---

## 2. Quyết định mở — LOCKED

| ID | Quyết định | Owner chốt |
|----|------------|------------|
| **OD-B1** | Wave C `notif_templates` — **deprecate runtime, giữ table** · drop sau production ổn | ✅ Approve |
| **OD-B2** | API **`/admin/notifications/types`** (+ child template/preview) | ✅ Approve |
| **OD-B3** | Seed **giữ copy tiếng Việt** trong title/body · **`variables` seed canonical ngay** (key + legacy_tag label) | ✅ **Modified approve** |
| **OD-B4** | `catalog.js` MERGE_TAGS — **temporary Phase B only** · SoT → `notification_types.variables` · **Phase C retire catalog** | ✅ Conditional approve |
| **OD-B5** | localStorage import | ✅ SKIP |
| **OD-B6** | Dispatcher skeleton `loadTemplate` only | ✅ Approve |

---

## 3. Bổ sung Owner (rev B2)

| ID | Quyết định |
|----|------------|
| **OD-B7** | Schema audit: `created_at` · `updated_at` · `created_by` · `updated_by` trên **`notification_types` và `notification_templates`** |
| **OD-B8** | Preview = **server renderer** (`POST …/template/preview`) · `dispatch=false` · không ghi inbox · cùng engine Phase D |
| **OD-B9** | B3 slice order: Migration → Service → **Dispatcher skeleton** → Routes → Frontend |
| **OD-B10** | B5 Architecture Verification = **grep gate** (catalog.CASES runtime · notif_templates read · localStorage save · hardcode) |
| **OD-B11** | `notif_templates` table drop — **defer** post-production stable cleanup (không Phase B) |

---

## 4. Locked từ SoT

| Hạng mục | SoT |
|----------|-----|
| Admin chỉ sửa title + body | [`08`](08-Admin-UX-Contract.md) §5 |
| Save / Restore / Preview contracts | [`08`](08-Admin-UX-Contract.md) §6–§8 |
| Canonical variables metadata | [`04`](04-Variable-Contract-Audit.md) §4–§5 |
| `preference_bucket` · `version` · in_app only | [`06`](06-Platform-SoT.md) §8 |

---

## 5. Schema sign-off

| | Owner |
|---|-------|
| ✅ Approve `notification_types` + `notification_templates` (+ audit columns OD-B7) | 2026-07-28 |
| ✅ Approve seed 23 CASES · ON CONFLICT DO NOTHING | |
| ✅ Approve `seed_title` / `seed_body` cho Restore | |

---

## 6. Cleanup commitment (B4 PASS)

| | Owner |
|---|-------|
| ✅ Acknowledged — cleanup = deliverable bắt buộc | 2026-07-28 |

---

## 7. Exit B2 → B3

```text
B2 PASS ✅ → B3 Implementation authorized
```

**Owner sign-off:** 2026-07-28 · Approve với OD-B3/B4/B7/B8/B9/B10 revisions.

---

*Phase B B2 — Owner Decision — LOCKED 2026-07-28.*
