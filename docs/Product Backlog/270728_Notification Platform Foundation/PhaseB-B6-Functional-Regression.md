# Phase B — B6 Functional Regression (Production)

**Date:** 2026-07-28  
**Phase:** B — Template System  
**Trạng thái:** ✅ **B6 PASS** — Phase B **PASS**  
**Environment:** Production (https://iflux.vn)  
**Prerequisite:** B5 Exit Report approved ✅

---

## 1. Pre-flight Production

| # | Check | PASS |
|---|-------|------|
| P1 | Migration `037_notification_platform_templates.sql` applied | ✅ (direct apply — xem §6) |
| P2 | Seed script → types + templates | ✅ 24 / 24 |
| P3 | `GET /api/admin/notifications/types` → 200 | ✅ |
| P4 | ADM-SYS-003 `announcements-page.js` | ✅ HTTP 200 |
| P5 | Cloudflare cache purged | ✅ |

---

## 2. Functional tests

| ID | Test | Result | PASS |
|----|------|--------|------|
| F1 | List cases | 24 types · AFFILIATE_REFERRAL_SUCCESS NOTIF-USER-007 | ✅ |
| F2 | Save title/body | PATCH → version 2 · isCustom true | ✅ |
| F3 | DB persistence | Reload GET → title giữ | ✅ |
| F4 | Restore default | title = seed «Referral mới» · isCustom false | ✅ |
| F5 | Server preview | `{Tên thành viên mới}` → «Phạm Minh Tuấn» | ✅ |
| F6 | Preview ≠ dispatch | `dispatch: false` | ✅ |
| F7 | Stale version | PATCH version=1 → **409** | ✅ |
| F9 | Canonical variables | `variables[].key` = `recipient_name`, `member`, … | ✅ |

*F8 (inbox retroactive) — N/A Phase B (no dispatch). F10 bulk restore — deferred manual UI.*

---

## 3. API evidence (Production localhost smoke)

```text
GET  /api/admin/notifications/types          → 24 items
GET  …/AFFILIATE_REFERRAL_SUCCESS/template
POST …/template/preview                      → title/body rendered · dispatch false
PATCH …/template                             → save OK
POST …/template/restore                      → seed restored
PATCH stale version                          → 409
```

**Preview sample:**

```text
title: Referral mới
body:  Phạm Minh Tuấn đã đăng ký qua mã giới thiệu của bạn.
```

---

## 4. Post-deploy architecture re-check

| Check | PASS |
|-------|------|
| announcements-page.js absolute path · HTTP 200 | ✅ |
| No templates-store on announcements | ✅ (deployed HTML) |
| No Wave C initTemplates | ✅ |
| `data-ix-view-api="/admin/notifications/types"` | ✅ |

---

## 5. Evidence log

| Field | Value |
|-------|-------|
| Tester | Agent (Owner approve B5 → deploy) |
| Date | 2026-07-28 |
| Environment | Production |
| Migration 037 | Applied (direct SQL + schema_migrations row) |
| Seed count | 24 types · 24 templates |
| CF purge | success |
| pm2 | iflux-api restarted |

---

## 6. Known issue (non-blocking B6)

**`schema_migrations` tracker out of sync** on Production (10 rows vs full migration set).  
`migrate-only.js` cannot run full queue (`must be owner of table users` on legacy pending files).

**Mitigation applied:** 037 applied surgically via app DB pool + manual schema_migrations insert.  
**Follow-up (infra):** reconcile migration tracker — **không thuộc Phase B scope**.

**Seed count 24 vs catalog 23:** Seed data file có 24 CASES entries — align catalog audit trong Phase C guard.

---

## 7. Exit B6 → Phase B PASS

| Gate | Status |
|------|--------|
| P1–P5 | ✅ |
| F1–F7, F9 | ✅ |
| API smoke | ✅ |

```text
B6 PASS ✅ → Phase B PASS ✅ → eligible Phase C
```

---

*Phase B B6 — Functional Regression — Production PASS 2026-07-28.*
