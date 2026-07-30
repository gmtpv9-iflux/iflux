# Phase B — B5 Exit Report (Architecture Verification)

**Date:** 2026-07-28  
**Phase:** B — Template System  
**Trạng thái:** ✅ **B5 PASS (local/repo)** — **Implementation complete · awaiting B6 Production**  
**Không phải:** Phase B PASS — chỉ PASS sau **B6 Functional Regression** trên Production.

**Workflow:**

```text
B0 ✅  B1 ✅  B2 ✅  B3 ✅  B4 ✅  B5 ✅ (local)
                                    ↓
                              B6 ⏳ Production
                                    ↓
                              Phase B PASS
```

---

## 1. Executive summary

Phase B **implementation + cleanup** hoàn tất trong repo. Template SoT chuyển sang **`notification_types` + `notification_templates`** (Platform module). ADM-SYS-003 wire API-only · server preview · không dual ownership runtime trên announcements page.

**Chưa deploy Production** — Owner yêu cầu Exit Report trước deploy. Functional regression = **B6** (sau migrate + seed + deploy).

---

## 2. Evidence — Architecture PASS (local)

### 2.1 Grep gate — Admin announcements (ADM-SYS-003)

| Check | Command / scope | Result |
|-------|-----------------|--------|
| No localStorage template | `rg iflux_sys_notif\|templates-store\|IfluxSystemNotificationTemplates` `Admin_Design_system/app/system/announcements*` | ✅ **0 match** |
| No Wave C duplicate UI | `rg initTemplates\|adm-notif-tpl` announcements.html | ✅ **0 match** |
| No catalog CASES runtime | `rg 'cat\(\)\.CASES\|catalog\.CASES'` announcements-page.js | ✅ **0 match** |
| Absolute page script | announcements.html → `/Admin_Design_system/app/system/announcements-page.js` | ✅ |

*Note:* `templates-store.js` trên `templates.html` / `platform-layers.html` = **page composition khác** — không thuộc notification template SoT Phase B.

### 2.2 Grep gate — Boundary ownership (Platform ONLY)

| Table / concept | Owner module | Other modules read/write? |
|-----------------|--------------|---------------------------|
| `notification_types` | `backend/src/modules/notifications/` | ✅ **Chỉ** template.service · seed script · migration |
| `notification_templates` | `backend/src/modules/notifications/` | ✅ **Chỉ** template.service · seed script · migration |
| `notif_templates` (Wave C legacy) | Deprecated | ✅ **Không** runtime read sau B4 (removed `listTemplates`/`updateTemplate` + routes) |

**Grep evidence:**

```text
notification_types|notification_templates
  → migrations/037_*.sql
  → modules/notifications/template.service.js
  → modules/notifications/notification-platform-seed-data.js
  → scripts/seed-notification-platform-types.js
  (không module ai/ · không Admin FE runtime)
```

```text
notif_templates runtime
  → chỉ còn migrations/033 (DDL seed) — không service read
```

### 2.3 Dual API / dual owner

| Before | After B4 |
|--------|----------|
| `GET/PATCH /admin/notifications/templates` (Wave C stub) | ✅ **Removed** |
| Platform `GET /admin/notifications/types` … | ✅ **Only** template admin API |

### 2.4 Architecture Drift Audit

| Drift check | PASS |
|-------------|------|
| localStorage template runtime (Admin ADM-SYS-003) | ✅ |
| catalog.CASES as Admin list SoT | ✅ |
| Dual template API | ✅ |
| Shadow module v2/new | ✅ |
| Preview = server renderer (same as runtime path) | ✅ `template.service.renderPreview` |

**Verdict:** **Architecture Verification PASS (repo/local).**

---

## 3. Evidence — Cleanup PASS (B4)

| Retired | Verified |
|---------|----------|
| `system-notification-templates-store.js` on announcements | ✅ script removed |
| Wave C table + `AdmWaveC.initTemplates()` | ✅ HTML + script removed |
| Wave C `/templates` routes | ✅ removed from `ai-notif-admin.routes.js` |
| `listTemplates` / `updateTemplate` dead service | ✅ removed from `ai-notif-admin.service.js` |
| Admin save via localStorage | ✅ PATCH API only |

---

## 4. Evidence — Implementation inventory (B3)

| Deliverable | Path |
|-------------|------|
| Migration | `backend/migrations/037_notification_platform_templates.sql` |
| Seed data | `notification-platform-seed-data.js` (23 types · canonical `variables[]`) |
| Seed runner | `backend/scripts/seed-notification-platform-types.js` |
| Template service + renderer | `template.service.js` |
| Dispatcher skeleton | `dispatcher.js` (`loadTemplate` only) |
| Admin API | `platform-admin.routes.js` → mounted via `ai-notif-admin.routes.js` |
| Admin FE | `announcements.html` · `announcements-page.js` |

**API surface (locked B2):**

- `GET /admin/notifications/types`
- `GET /admin/notifications/types/:code/template`
- `PATCH /admin/notifications/types/:code/template` (version 409)
- `POST /admin/notifications/types/:code/template/restore`
- `POST /admin/notifications/types/:code/template/preview` (`dispatch: false`)

---

## 5. Migration PASS (schema — pre-production)

| Item | Status |
|------|--------|
| `notification_types` + audit columns | ✅ in 037 |
| `notification_templates` + seed_title/body + version | ✅ in 037 |
| Seed 23 CASES ON CONFLICT DO NOTHING | ✅ script ready |
| `variables[]` canonical + `legacy_tag` (OD-B3) | ✅ seed-data |
| Production migration applied | ⏳ **B6 prerequisite** |

---

## 6. Known risks

| Risk | Mitigation |
|------|------------|
| Migration 037 chưa chạy Production | B6 blocked until `migrate-only` + seed |
| `catalog.js` MERGE_TAGS tạm Phase B (OD-B4) | Phase C retire · variables from API |
| `notif_templates` table còn DDL (OD-B1) | Deprecate · drop sau production stable |
| User Web vẫn client template path | **Out of Phase B** — Phase D retire |
| Node seed/migrate chưa verify trên origin | Chạy trong deploy checklist B6 |

---

## 7. Rollback plan

| Step | Action |
|------|--------|
| 1 | Revert frontend `announcements.html` + `announcements-page.js` to prior deploy tag |
| 2 | Revert backend routes (restore stub `/templates` nếu cần emergency — **không khuyến nghị**) |
| 3 | Platform tables **giữ** — ON CONFLICT seed không ghi đè Admin; rollback FE đủ cho Admin UX |
| 4 | Nếu migration gây lỗi nghiêm trọng: restore DB snapshot trước 037 (infra Owner) |

**Không** drop `notification_*` tables trong rollback Phase B.

---

## 8. Deploy checklist (trước B6 — Owner approve)

- [ ] Owner approve **B5 Exit Report** này
- [ ] Deploy backend (modules/notifications + migration runner)
- [ ] `node scripts/migrate-only.js` → apply **037**
- [ ] `node scripts/seed-notification-platform-types.js` → 23 types
- [ ] Deploy Admin frontend (announcements)
- [ ] Purge Cloudflare cache
- [ ] Chạy **[`PhaseB-B6-Functional-Regression.md`](PhaseB-B6-Functional-Regression.md)**
- [ ] B6 PASS → ghi **Phase B PASS**

---

## 9. Owner After Phase B (repo state)

| Component | Owner |
|-----------|-------|
| Template SoT | Notification Platform · DB |
| Type registry (seed) | Notification Platform · DB |
| Admin ADM-SYS-003 | Platform API |
| Preview / render engine | `template.service.js` |
| catalog.js MERGE_TAGS | Temporary read-only · Phase C → API |
| Wave C `notif_templates` | Deprecated (no runtime) |
| Inbox / dispatch | Unchanged · Phase D |

---

## 10. Exit B5

| Gate | Status |
|------|--------|
| Architecture Verification (grep + boundary) | ✅ PASS local |
| Cleanup deliverable | ✅ PASS repo |
| API + schema implemented | ✅ PASS repo |
| Production functional test | ⏳ **B6** |
| Phase B PASS | ⏳ **Sau B6** |

**Next:** Owner approve deploy → B6 on https://iflux.vn Admin ADM-SYS-003.

---

*Phase B B5 Exit Report — 2026-07-28 · Implementation complete · awaiting production verification.*
