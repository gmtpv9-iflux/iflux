# Phase B — B1 Solution Proposal

**Date:** 2026-07-28  
**Phase:** B — Template System  
**Trạng thái:** ⏳ **Chờ Owner approve (B2)**  
**Input:** [`PhaseB-B0-Discovery-Audit.md`](PhaseB-B0-Discovery-Audit.md)  
**SoT:** [`06-Platform-SoT.md`](06-Platform-SoT.md) · [`08-Admin-UX-Contract.md`](08-Admin-UX-Contract.md)

---

## 1. Tóm tắt hướng xử lý

**Một SoT template = PostgreSQL.** Admin ADM-SYS-003 giữ UX · wire API Save/Restore/Preview. Retire localStorage runtime + Wave C duplicate table **trong cùng phase (B4)**.

**Không** tạo module shadow · **không** dual-write catalog + DB runtime.

---

## 2. Reuse

| Target | Cách reuse |
|--------|------------|
| `backend/src/modules/notifications/inbox.service.js` | Giữ nguyên — Phase B không đổi inbox contract |
| `backend/src/modules/notifications/` module folder | Extend — thêm template + admin routes |
| `Admin_Design_system/app/system/announcements.html` | Giữ layout · đổi data binding |
| `system-notification-catalog.js` `MERGE_TAGS` | Panel copy tag read-only Phase B (36 tags) |
| RBAC `notifications.templates.view` · `.edit` | Giữ perm cluster |
| `user_inbox_notifications` schema | Không đổi Phase B |

---

## 3. Modify

| Target | Thay đổi |
|--------|----------|
| `announcements.html` | Script absolute path · xóa block Wave C table (L118–128) · xóa `AdmWaveC.initTemplates()` |
| `announcements-page.js` | `GET` types+templates từ API · `PATCH` save (title, body, version) · restore · preview client-side |
| `backend` router mount | Platform admin routes thay Wave C template handlers |
| `announcements-page.js` path | `/Admin_Design_system/app/system/announcements-page.js` |

---

## 4. Migrate

### 4.1 Schema mới (migration `034_notification_platform_templates.sql`)

**`notification_types`**

```sql
code VARCHAR(80) PRIMARY KEY          -- AFFILIATE_REFERRAL_SUCCESS
legacy_case_id VARCHAR(80) UNIQUE     -- USER_AFF_REFERRAL (map catalog)
admin_code VARCHAR(20) NOT NULL       -- NOTIF-USER-007
name VARCHAR(200) NOT NULL
description TEXT NOT NULL DEFAULT ''  -- trigger read-only Admin
category VARCHAR(40) NOT NULL
variables JSONB NOT NULL DEFAULT '[]' -- schema Phase C; seed tags list Phase B
preference_bucket VARCHAR(80) NULL
supported_channels JSONB NOT NULL DEFAULT '["in_app"]'
enabled BOOLEAN NOT NULL DEFAULT true
icon VARCHAR(40) NULL
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

**`notification_templates`**

```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
type_code VARCHAR(80) NOT NULL REFERENCES notification_types(code)
channel VARCHAR(20) NOT NULL DEFAULT 'in_app'
title TEXT NOT NULL
body TEXT NOT NULL DEFAULT ''
seed_title TEXT NOT NULL              -- Restore contract §7
seed_body TEXT NOT NULL
enabled BOOLEAN NOT NULL DEFAULT true
version INT NOT NULL DEFAULT 1
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_by UUID NULL
UNIQUE (type_code, channel)
```

### 4.2 Seed source

- **Nguồn:** `Admin_Design_system/iflux-admin-ui/system-notification-catalog.js` — 23 CASES
- **Map `type_code`:** convention `DOMAIN_EVENT` — ví dụ `USER_AFF_REFERRAL` → `AFFILIATE_REFERRAL_SUCCESS` (bảng map trong seed script)
- **Template body:** `defaultTitle` / `defaultMessage` từ catalog (placeholder tiếng Việt `{Tên thành viên mới}`) — canonical migrate Phase D
- **ON CONFLICT DO NOTHING** trên `notification_types.code` — deploy không ghi đè Admin override

### 4.3 `preference_bucket` seed (metadata only Phase B)

| Category group | `preference_bucket` |
|----------------|---------------------|
| Membership · Affiliate cases | `affiliate_notifications` |
| Cộng đồng | `community_notifications` |
| Theo dõi | `follow_notifications` |
| Cảnh báo | `alert_notifications` |
| Alert Hệ thống | `system_notifications` |
| Gói đăng ký / Orders | `NULL` (Phase D orders bucket) |
| Admin ops | `NULL` |

> Preference **enforce** Phase D — Phase B chỉ seed metadata.

### 4.4 localStorage import

**Khuyến nghị: SKIP** — Production ADM-SYS-003 404 → không có override thật. Không script import.

---

## 5. Delete (B4 cleanup — PASS condition)

| Retire | Timing |
|--------|--------|
| Runtime read/write `iflux_sys_notif_templates_v1` Admin | B4 |
| `IfluxSystemNotificationTemplates` save/load Admin | B4 |
| `announcements-page.js` đọc `catalog.CASES` làm list SoT | B4 — list từ API |
| HTML `#adm-notif-tpl-tbody` + Wave C table block | B4 |
| `AdmWaveC.initTemplates()` on announcements page | B4 |
| `ai-notif-admin` GET/PATCH `/templates` → `notif_templates` | B4 — replace handler |
| Dual API template (stub 2 row vs Platform 23 row) | B4 |

**Không xóa Phase B:**

- `notif_templates` table (Wave C) — deprecate only
- User Web catalog/store — Phase D
- `fn-subscriber.js` hardcode — Phase D

---

## 6. API surface (Platform Admin)

**Base:** `/admin/notifications` (giữ namespace hiện có)

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/admin/notifications/types` | List 23 types + template summary (group, admin_code, trigger…) |
| GET | `/admin/notifications/types/:code/template` | Template in_app (title, body, version, seed_*) |
| PATCH | `/admin/notifications/types/:code/template` | Save title+body · bump version · 409 if stale |
| POST | `/admin/notifications/types/:code/template/restore` | Reset title/body → seed_title/seed_body |

**Preview:** client-side trong `announcements-page.js` — substitute sampleVars từ type payload · **không dispatch** ([`08`](08-Admin-UX-Contract.md) §8).

**Wave C stub routes** (`GET/PATCH /admin/notifications/templates/:id`) → **remove** · redirect 410 hoặc xóa route.

**`data-ix-view-api`:** update `announcements.html` → `/admin/notifications/types` (align view gate).

---

## 7. Backend module layout

```text
backend/src/modules/notifications/
  inbox.service.js              (existing)
  template.service.js           (new — getType, getTemplate, patchTemplate, restoreTemplate, renderPreview)
  platform-admin.routes.js      (new — Admin API above)
  platform-admin.service.js     (optional thin — or merge template.service)
  dispatcher.js                 (skeleton B3.5 — getTemplate only, dispatch stub throws until Phase D)
```

**Không** tạo `notification-platform-v2/` · **không** file trong `modules/ai/` cho template SoT.

---

## 8. B3 Implementation slices

| # | Slice | Files |
|---|-------|-------|
| B3.1 | Migration + seed | `034_*.sql` · seed script hoặc SQL INSERT từ catalog map |
| B3.2 | Template service | `template.service.js` |
| B3.3 | Admin routes + mount | `platform-admin.routes.js` · app router |
| B3.4 | Admin FE wire + PF-6 | `announcements.html` · `announcements-page.js` |
| B3.5 | Dispatcher skeleton | `dispatcher.js` — `loadTemplate(typeCode)` only |

---

## 9. B5 Regression checklist

| Test | Expected |
|------|----------|
| Admin list 23 cases từ API | ✅ |
| Save title → browser khác giữ | ✅ DB SoT |
| Restore → seed template | ✅ không xóa Type |
| Preview → không dispatch / không inbox | ✅ |
| Save 8:05 → inbox 8:00 unchanged | ✅ (no dispatch in B) |
| Wave C table gone | ✅ |
| localStorage không còn write | ✅ |

---

## 10. Architecture Drift Audit (B5 gate)

| Check | PASS |
|-------|------|
| localStorage template runtime Admin | Không read/write |
| catalog.CASES runtime Admin list | Không — API only |
| Dual owner template API | Một Platform API |
| Shadow module v2/new | Không |
| User Web forced change Phase B | Không — defer D |

---

## 11. Owner decisions needed (→ B2)

| # | Quyết định | Đề xuất | Alt |
|---|------------|---------|-----|
| OD-B1 | Wave C `notif_templates` table | **Deprecate runtime** — giữ table empty | Drop table migration (rủi ro) |
| OD-B2 | API path | **`/admin/notifications/types`** mới · retire `/templates` stub | Giữ `/templates` path với contract mới (breaking stub) |
| OD-B3 | Seed placeholder language | **Giữ tiếng Việt catalog** Phase B | Rewrite canonical `{member}` ngay (scope+) |
| OD-B4 | MERGE_TAGS panel | **Giữ catalog.js read-only** Phase B | API trả merge tags từ `variables` (scope+) |
| OD-B5 | localStorage import | **SKIP** | One-time import script |
| OD-B6 | Dispatcher B3.5 | **Skeleton loadTemplate only** | Full dispatch Phase B (scope creep) |

**Locked từ SoT (không cần re-decide):** schema fields · Save/Restore/Preview contracts · optimistic `version` · in_app only · no Admin create Type.

---

## 12. Out of scope this proposal

- Full `NotificationDispatcher.dispatch()`
- Preference API + Quyền riêng tư UI
- Consumer migration (Affiliate · FN-001)
- Canonical variable renderer production
- CI type-without-template guard (Phase C)
- Retire User Web client template path

---

## 13. Exit B1

| Tiêu chí | Trạng thái |
|----------|------------|
| Reuse / Modify / Migrate / Delete documented | ✅ §2–§5 |
| API + schema proposed | ✅ §4 · §6 |
| Owner open items listed | ✅ §11 |
| Không code | ✅ |

**→ Chờ B2 Owner Decision:** [`PhaseB-B2-Owner-Decision.md`](PhaseB-B2-Owner-Decision.md)

---

*Phase B B1 — Solution Proposal — 2026-07-28.*
