# Phase B — B0 Discovery Audit (+ Impact Analysis)

**Date:** 2026-07-28  
**Phase:** B — Template System  
**Trạng thái:** ✅ **B0 PASS** — sẵn sàng B1 Solution Proposal  
**Workflow:** B0 → B1 → B2 → B3 → B4 → B5 → PASS

---

## 1. Mục tiêu B0

Xác nhận evidence Phase A đủ cho slice Template System · lập **Impact Analysis** (CG-005) · **không code**.

---

## 2. Discovery checklist

| Hạng mục | Câu hỏi | Kết quả | Evidence |
|----------|---------|---------|----------|
| **Ownership template SoT** | Ai own hôm nay? | ❌ 3 owner song song | [`01-Audit`](01-Audit-Current-State.md) §2–3 · [`02-Ownership-Audit`](02-Ownership-Audit.md) |
| **Dependency graph** | Admin/User/catalog/Wave C gọi ai? | Admin: catalog+localStorage+Wave C table · User: client render | §2 diagram |
| **Duplicate systems** | Merge path? | DB Platform mới · retire 2 legacy runtime | §8.5 [`06-Platform-SoT`](06-Platform-SoT.md) |
| **Data migration** | localStorage override? | Production **404** → override thực tế = 0 · seed từ catalog | §3.2 · AP-6 |
| **Admin contract** | Save/Restore/Preview? | ✅ LOCKED [`08-Admin-UX-Contract`](08-Admin-UX-Contract.md) | §5–§8 |
| **Scope guard** | Phase B build gì? | Template DB + Admin API + wire ADM-SYS-003 · **không** Dispatcher full · **không** preference | [`09-Plan-Roadmap`](09-Plan-Roadmap.md) §7 · [`06`](06-Platform-SoT.md) §8 |
| **Blocker PF-6** | announcements-page.js 404? | ✅ Xác nhận — relative path trên pretty URL | `announcements.html` L132 |

---

## 3. As-is inventory (slice Template)

### 3.1 Admin ADM-SYS-003

| File | Runtime role | Phase B fate |
|------|--------------|--------------|
| `announcements.html` | UX shell | **Modify** — wire API · fix script path · xóa Wave C table block |
| `announcements-page.js` | Bind catalog + localStorage | **Modify** — fetch API · PATCH save/restore |
| `system-notification-catalog.js` | 23 CASES + MERGE_TAGS | **Migrate seed** → **retire CASES runtime** · giữ MERGE_TAGS read-only tạm B |
| `system-notification-templates-store.js` | localStorage SoT | **Delete** runtime (B4) |
| `admin-wave-c-pages.js` `initTemplates()` | Wave C stub table | **Delete** call + HTML block (B4) |

### 3.2 Backend hiện có

| File | Role | Phase B fate |
|------|------|--------------|
| `inbox.service.js` | Inbox push/list | **Reuse** — không đổi contract Phase B |
| `ai-notif-admin.service.js` | CRUD `notif_templates` (2 row stub) | **Modify/retire** template routes |
| `ai-notif-admin.routes.js` | `GET/PATCH /admin/notifications/templates` | **Replace** handler → Platform module |
| `033_wave_c_ai_notif.sql` | `notif_templates` table | **Deprecate** runtime — không drop table B |

### 3.3 User Web (ngoài scope wire B — không dual-write)

| File | Ghi chú Phase B |
|------|-----------------|
| `system-notification-catalog.js` | Không đổi runtime Phase B — retire Phase D |
| `system-notification-templates-store.js` | Không đổi Phase B — retire Phase D |
| `inapp-notifications.js` | Không đổi Phase B |

> Phase B **chỉ** đảm bảo Admin template = DB SoT. User Web client path retire ở Phase D (CG-020).

---

## 4. Impact Analysis (CG-005)

| Component | Decision | Ghi chú |
|-----------|----------|---------|
| `backend/src/modules/notifications/` | **Reuse + extend** | Thêm `template.service.js` · `platform-admin.routes.js` |
| DB `notification_types` | **Create** (migration) | Entity mới theo [`06`](06-Platform-SoT.md) §3.2 |
| DB `notification_templates` | **Create** (migration) | FK type · seed_title/body · version |
| DB `notif_templates` (Wave C) | **Deprecate runtime** | Không read/write Phase B+ · table giữ (no drop) |
| `catalog.js` CASES (23) | **Migrate** | Seed script one-time |
| `catalog.js` MERGE_TAGS | **Reuse read-only** | Panel tag Phase B · API variables Phase C |
| `templates-store.js` Admin | **Delete** | B4 cleanup |
| `templates-store.js` User Web | **Defer delete** | Phase D |
| `announcements-page.js` | **Modify** | API bind + absolute script path |
| Wave C table UI announcements | **Delete** | B4 |
| `ai-notif-admin` template handlers | **Delete/replace** | Platform owns `/admin/notifications/platform/*` hoặc replace `/templates` |
| Dispatcher full | **Defer** | B3.5 skeleton `getTemplate()` only — no Rule/Preference |
| Preference API/UI | **Defer** | Phase D |
| Canonical variable migrate `{Tên thành viên mới}`→`{member}` | **Defer seed body** | Seed giữ catalog copy Phase B · alias renderer Phase D |

---

## 5. Gap / risk phát hiện B0

| # | Gap | Severity | Mitigation đề xuất (→ B1) |
|---|-----|----------|---------------------------|
| G1 | Pretty URL 404 `announcements-page.js` | P0 | Absolute path B3.4 |
| G2 | `data-ix-view-api="/admin/notifications/templates"` trỏ Wave C stub | P1 | Replace API contract — giữ path hoặc đổi + update gate |
| G3 | 23 CASES dùng `caseId` ≠ platform `type_code` | P1 | Seed map table trong migration |
| G4 | Merge tags tiếng Việt vs canonical keys | P2 | Seed catalog text Phase B · canonical Phase C/D |
| G5 | Không có admin override production (404) | Low | Skip localStorage import |

---

## 6. Out of scope B0/B3 (xác nhận)

- Notification Dispatcher Rule Engine full
- User preference buckets
- Consumer slices (Affiliate · FN-001)
- Push/Email adapters
- Admin UI create Type
- `notification_template_revisions`
- Retire User Web catalog runtime (Phase D)

---

## 7. Exit B0

| Tiêu chí | PASS |
|----------|------|
| Impact Analysis complete | ✅ §4 |
| Evidence không cần grep mở rộng | ✅ [`01`](01-Audit-Current-State.md) đủ |
| Blockers documented | ✅ G1–G5 |
| Không code | ✅ |

**→ Chuyển B1:** [`PhaseB-Solution-Proposal.md`](PhaseB-Solution-Proposal.md)

---

*Phase B B0 — Discovery Audit — 2026-07-28.*
