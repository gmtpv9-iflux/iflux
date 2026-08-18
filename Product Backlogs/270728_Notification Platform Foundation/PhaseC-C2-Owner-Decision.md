# Phase C — C2 Owner Decision

**Date:** 2026-07-28  
**Phase:** C — Type Registry  
**Trạng thái:** ✅ **C2 PASS** — Owner sign-off có điều kiện (OD-C6–OD-C10) · 2026-07-28  
**Input:** [`PhaseC-Solution-Proposal.md`](PhaseC-Solution-Proposal.md) (rev Owner)

---

## 1. Approve Solution Proposal

| | Owner |
|---|-------|
| ✅ **APPROVE** hướng xử lý C1 + revisions OD-C6–OD-C10 | 2026-07-28 |

---

## 2. Quyết định mở — LOCKED

| ID | Quyết định | Owner chốt |
|----|------------|------------|
| **OD-C1** | Tag panel = aggregate client-side từ GET `/types` | ✅ Approve |
| **OD-C2** | Guard = local `validate-notification-seed.js` + checklist pre-deploy | ✅ Approve |
| **OD-C3** | Admin `catalog.js` sau C4 = comment block CASES/MERGE_TAGS · file giữ đến Phase D | ✅ Approve |
| **OD-C4** | `PLATFORM_SMOKE_TEST` seed Production · C6 proof | ✅ Approve (see OD-C10) |
| **OD-C5** | Validate fail = exit 1 · block seed · **no `--force` v1** | ✅ Approve |

### Revisions Owner (bắt buộc C3)

| ID | Quyết định | Owner chốt |
|----|------------|------------|
| **OD-C6** | **Anti-drift seed:** `notification_types` → `ON CONFLICT DO UPDATE` metadata từ seed. `notification_templates` → `DO UPDATE` chỉ `seed_title`/`seed_body` · **không** ghi đè `title`/`body` Admin đã save | ✅ **Option A (split)** |
| **OD-C7** | **`Type.code` + `Type.variables[]` = Platform Contract** — template chỉ consume · Admin không tạo merge tag · template không thêm variable ngoài contract | ✅ LOCKED |
| **OD-C8** | **`variable-alias.js` = legacy compatibility ONLY** — cấm thêm business variable mới vào alias map | ✅ LOCKED |
| **OD-C9** | **Validate đầy đủ:** duplicate code/admin_code/variable · regex DOMAIN_EVENT · template exists · alias unknown · enabled boolean · channel defaults | ✅ LOCKED |
| **OD-C10** | **`PLATFORM_SMOKE_TEST`:** category `system` · `enabled=false` · hidden internal · **dispatcher cấm dispatch** · health-check only | ✅ LOCKED |

---

## 3. Developer workflow (LOCKED)

```text
1. Edit notification-platform-seed-data.js
2. node scripts/validate-notification-seed.js   ← bắt buộc · exit 1 nếu fail
3. node scripts/seed-notification-platform-types.js
4. Architecture test (C5 grep / local)
5. Production verify (C6)
6. Commit
```

---

## 4. Locked từ SoT

| Hạng mục | SoT |
|----------|-----|
| Developer seed Type · Admin không tạo Type | [`06`](06-Platform-SoT.md) P5 |
| Variables canonical | [`04`](04-Variable-Contract-Audit.md) |
| User Web catalog | **Phase D** |
| Admin template title/body preserve on seed | [`08`](08-Admin-UX-Contract.md) §6 |

---

## 5. Cleanup commitment (C4 PASS)

| | Owner |
|---|-------|
| ✅ Retire Admin catalog runtime ADM-SYS-003 | |
| ✅ Single seed SoT = `notification-platform-seed-data.js` | |

---

## 6. Exit C2 → C3

```text
C2 PASS ✅ → C3 Implementation authorized
```

**Owner sign-off:** 2026-07-28 · Approve có điều kiện OD-C6–OD-C10.

---

*Phase C C2 — Owner Decision — LOCKED 2026-07-28.*
