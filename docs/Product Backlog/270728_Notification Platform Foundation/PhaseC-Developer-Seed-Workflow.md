# Phase C — Developer Seed Workflow

**Date:** 2026-07-28  
**Phase:** C — Type Registry  
**Trạng thái:** ✅ LOCKED (OD-C2 · C2 Owner Decision)

---

## Workflow bắt buộc

```text
1. Edit notification-platform-seed-data.js
        ↓
2. node backend/scripts/validate-notification-seed.js   ← exit 1 nếu fail · không --force
        ↓
3. node backend/scripts/seed-notification-platform-types.js
        ↓
4. Architecture test (C5 grep / local)
        ↓
5. Production verify (C6)
        ↓
6. Commit
```

**Cấm:** seed khi validate fail · `ON CONFLICT DO NOTHING` trên notification types/templates.

---

## Single Source of Truth

| Artifact | Owner | Ghi chú |
|----------|-------|---------|
| `notification-platform-seed-data.js` | Platform | **Duy nhất** nơi khai báo Type mới |
| `variable-alias.js` | Platform | Legacy tag → canonical · **OD-C8: compatibility ONLY** |
| `notification_types` (DB) | Platform | Sync metadata qua seed upsert |
| `notification_templates` (DB) | Platform + Admin | Seed chỉ update `seed_*` · Admin `title`/`body` được preserve |

Admin **không** tạo Type · **không** định nghĩa merge tag riêng (OD-C7).

---

## Anti-drift seed (OD-C6)

```sql
-- notification_types: full metadata sync
ON CONFLICT (code) DO UPDATE SET …

-- notification_templates: chỉ seed columns
ON CONFLICT (type_code, channel) DO UPDATE SET
  seed_title = EXCLUDED.seed_title,
  seed_body = EXCLUDED.seed_body
-- KHÔNG ghi đè title/body Admin đã save
```

---

## Thêm Type mới (checklist)

1. Thêm entry vào `CATALOG_CASES` trong seed-data (DOMAIN_EVENT code · NOTIF-* admin_code).
2. Khai báo `tags[]` + `sampleVars` — variables = **Platform Contract** (OD-C7).
3. Nếu dùng legacy tag tiếng Việt mới → **không** thêm vào `variable-alias.js` trừ khi backward compat thật sự cần (OD-C8).
4. Chạy validate → seed → verify Admin list (không cần deploy FE).
5. Consumer slice = **Phase D** (dispatch) — không thêm vào catalog.js.

---

## Validate rules (OD-C9)

Script `validate-notification-seed.js` kiểm tra:

- Duplicate `code` · `admin_code` · `legacy_case_id` · variable key
- Regex `TYPE_CODE` (DOMAIN_EVENT) · `ADMIN_CODE` · canonical key
- Template block · placeholders ⊆ `Type.variables[]`
- Unknown legacy tag (không có trong alias map)
- `enabled` boolean · `supported_channels` includes `in_app`
- `PLATFORM_SMOKE_TEST` có `enabled=false` (OD-C10)

---

## Smoke type (OD-C10)

| Field | Value |
|-------|-------|
| `code` | `PLATFORM_SMOKE_TEST` |
| `admin_code` | `NOTIF-PLT-000` |
| `enabled` | `false` |
| Dispatch | **Cấm** (`dispatcher.js` · `isDispatchableTypeCode`) |
| Mục đích | Health check / seed proof only |

---

*Phase C Developer Seed Workflow — LOCKED 2026-07-28.*
