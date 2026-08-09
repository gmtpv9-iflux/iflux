# Phase C — C0 Discovery Audit (+ Impact Analysis)

**Date:** 2026-07-28  
**Phase:** C — Type Registry  
**Trạng thái:** ✅ **C0 PASS** — sẵn sàng C1 Solution Proposal  
**Workflow:** C0 → C1 → C2 → C3 → C4 → C5 → C6 → PASS  
**Input Phase B:** [`PhaseB-B6-Functional-Regression.md`](PhaseB-B6-Functional-Regression.md) ✅

---

## 1. Mục tiêu C0

Xác nhận hiện trạng **Type Registry** sau Phase B · lập Impact Analysis · **không code**.

**Phase C focus:** Developer workflow thêm Type · Admin auto-list từ DB · retire **Admin** catalog runtime · guard type↔template.

**Out of scope C0/C cleanup:** User Web `system-notification-catalog.js` runtime → **Phase D** (consumer retire).

---

## 2. Discovery checklist

| Hạng mục | Câu hỏi | Kết quả | Evidence |
|----------|---------|---------|----------|
| **Type SoT sau B** | DB là authority? | ✅ Production 24 types | B6 · `notification_types` |
| **Duplicate definition** | JS catalog + seed-data + DB? | ❌ **Dual** — 2 JS sources | grep below |
| **Admin MERGE_TAGS** | SoT? | ❌ vẫn `catalog.js` (OD-B4 temp) | announcements.html L118 |
| **Admin list cases** | SoT? | ✅ API `GET /types` | announcements-page.js |
| **Seed workflow** | Documented? | ⚠️ script only | `seed-notification-platform-types.js` |
| **CI guard** | type without template? | ❌ none | no `.gitlab-ci` seed check |
| **Naming convention** | Locked? | ✅ `DOMAIN_EVENT` slug | seed-data · SoT §3.2 |
| **Smoke type** | PLATFORM_SMOKE_TEST? | ❌ chưa seed | Plan §8 C3 |
| **Developer Guide** | Add consumer workflow? | ⏳ Phase D deliverable `10-…` | Plan D3.5 |

---

## 3. As-is inventory

### 3.1 Type definition sources (duplicate)

| Source | Location | Role today | Phase C fate |
|--------|----------|------------|--------------|
| **A — Platform seed (authoritative)** | `notification-platform-seed-data.js` | DB seed · alias map | **Keep — single seed SoT** |
| **B — Admin catalog** | `iflux-admin-ui/system-notification-catalog.js` | CASES + MERGE_TAGS | **Retire CASES + MERGE_TAGS runtime** |
| **C — User Web catalog** | `User_Web/.../system-notification-catalog.js` | Client render legacy | **Defer Phase D** |
| **D — PostgreSQL** | `notification_types` | Runtime SoT | **Keep** |

**Drift risk:** Sửa catalog.js mà không sửa seed-data → DB lệch seed (ON CONFLICT che deploy nhưng developer confused).

### 3.2 Admin ADM-SYS-003 (post-B)

| Component | Bind | SoT |
|-----------|------|-----|
| Case list | `GET /admin/notifications/types` | ✅ DB |
| Save/Restore/Preview | Platform API | ✅ DB |
| Side panel «Thẻ merge» | `catalog.js` MERGE_TAGS | ❌ **temp B** |
| Per-case tag chips | `type.variables[]` from API | ✅ DB |

### 3.3 Seed pipeline (as-is)

```text
Developer edits notification-platform-seed-data.js (CATALOG_CASES)
        ↓
node scripts/seed-notification-platform-types.js
        ↓
INSERT notification_types + notification_templates ON CONFLICT DO NOTHING
        ↓
Admin GET /types → new row (no FE deploy)  ← Phase C must prove (C6)
```

**Gaps:**

- Không validate script pre-seed (missing template row · bad code · duplicate admin_code)
- `LEGACY_TAG_TO_CANONICAL` coupled in seed-data + imported by `template.service.js`
- Không có `PLATFORM_SMOKE_TEST` proof type

### 3.4 Production state (B6)

| Metric | Value |
|--------|-------|
| `notification_types` | 24 |
| `notification_templates` | 24 |
| Admin API | ✅ |
| catalog.js on announcements | Chỉ MERGE_TAGS panel |

---

## 4. Impact Analysis (CG-005)

| Component | Decision | Owner After C | Ghi chú |
|-----------|----------|---------------|---------|
| `notification-platform-seed-data.js` | **Reuse + extend** | Notification Platform | Single seed SoT |
| `seed-notification-platform-types.js` | **Modify** | Platform | Pre-seed validate hook |
| `system-notification-catalog.js` (Admin) | **Delete runtime** / comment CASES+MERGE_TAGS | — | C4 cleanup |
| `announcements.html` | **Modify** | Platform | Remove catalog script |
| `announcements-page.js` | **Modify** | Platform | Tags from API aggregate |
| `template.service.js` | **Modify** | Platform | Move alias map to `variable-alias.js` |
| New `GET …/variables/catalog` (optional) | **Create** | Platform | Side panel tags — or aggregate client-side from GET types |
| `scripts/validate-notification-seed.js` | **Create** | Platform | CI/local guard |
| `PLATFORM_SMOKE_TEST` seed row | **Create** | Platform | C6 proof · `enabled: false` |
| User Web catalog | **Defer** | Phase D | Not C cleanup |
| Admin UI create Type | **Forbidden** | — | SoT P5 |

---

## 5. Gaps / risks

| # | Gap | Severity | → C1 |
|---|-----|----------|------|
| G1 | Dual CASES in catalog + seed-data | P1 | Single seed file · retire catalog |
| G2 | MERGE_TAGS not from DB | P1 | API aggregate `variables[]` |
| G3 | No seed validation | P1 | validate script |
| G4 | No smoke type | P2 | PLATFORM_SMOKE_TEST |
| G5 | Developer workflow undocumented in C | P2 | `PhaseC-Developer-Seed-Workflow.md` slice (full guide = Phase D) |
| G6 | 24 vs audit «23» | Low | Align count · document |

---

## 6. Out of scope Phase C

- User Web catalog/templates-store retire
- Dispatcher full · preference · consumers
- Admin UI create Type
- Per-type user preference
- `notification_template_revisions`

---

## 7. Exit C0

| Tiêu chí | PASS |
|----------|------|
| Impact Analysis + Owner After C | ✅ §4 |
| Duplicate sources documented | ✅ §3.1 |
| Phase D boundary clear | ✅ |
| Không code | ✅ |

**→ C1:** [`PhaseC-Solution-Proposal.md`](PhaseC-Solution-Proposal.md)

---

*Phase C C0 — Discovery Audit — 2026-07-28.*
