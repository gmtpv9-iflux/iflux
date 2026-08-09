# Phase C — C1 Solution Proposal

**Date:** 2026-07-28  
**Phase:** C — Type Registry  
**Trạng thái:** ⏳ **Chờ Owner approve (C2)**  
**Input:** [`PhaseC-C0-Discovery-Audit.md`](PhaseC-C0-Discovery-Audit.md)  
**SoT:** [`06-Platform-SoT.md`](06-Platform-SoT.md) §3.2 · [`04-Variable-Contract-Audit.md`](04-Variable-Contract-Audit.md)

---

## 1. Tóm tắt hướng xử lý

**Một nguồn seed Type:** `notification-platform-seed-data.js` → DB.  
**Retire Admin `catalog.js` runtime** (CASES + MERGE_TAGS) — panel thẻ merge đọc từ API.  
**Guard:** validate script trước seed · smoke type `PLATFORM_SMOKE_TEST`.  
**Không** Admin UI tạo Type · **không** User Web catalog trong Phase C.

---

## 2. Reuse

| Target | Cách reuse |
|--------|------------|
| `notification-platform-seed-data.js` | Giữ làm **single seed SoT** |
| `seed-notification-platform-types.js` | Extend với validate pre-flight |
| `GET /admin/notifications/types` | List + aggregate variables cho tag panel |
| `notification_types.variables[]` schema | Đã canonical từ Phase B |
| Naming `DOMAIN_EVENT` | Tiếp tục (`AFFILIATE_*`, `ORDER_*`, …) |

---

## 3. Modify

| Target | Thay đổi |
|--------|----------|
| `announcements-page.js` | Tag panel từ API (aggregate `variables[]` từ GET types) · **remove `cat()` dependency** |
| `announcements.html` | **Remove** `system-notification-catalog.js` script |
| `template.service.js` | Extract `LEGACY_TAG_TO_CANONICAL` → `variable-alias.js` (shared · không import seed-data) |
| Optional `GET /admin/notifications/variables/catalog` | Deduped merge-tag list server-side — **chỉ nếu aggregate FE quá nặng** |

**Đề xuất:** aggregate client-side từ GET types (24 rows) — **không thêm API** trừ khi Owner prefer server endpoint (OD-C2).

---

## 4. Migrate

### 4.1 Seed workflow (Developer — LOCKED convention)

```text
1. Edit notification-platform-seed-data.js
   - Add entry: code, admin_code, category, variables[], template defaults
2. node scripts/validate-notification-seed.js   ← NEW guard
3. node scripts/seed-notification-platform-types.js
4. Deploy backend only (no Admin FE)
5. Admin ADM-SYS-003 auto-lists new type
```

**Naming:** `^[A-Z][A-Z0-9_]+$` · prefix domain (`AFFILIATE_`, `ORDER_`, `COMMUNITY_`, …).

**Variables schema (per type):**

```json
{ "key": "member", "label": "Tên thành viên mới", "legacy_tag": "Tên thành viên mới", "required": true, "example": "…" }
```

### 4.2 Smoke type (C6 proof)

| Field | Value |
|-------|-------|
| `code` | `PLATFORM_SMOKE_TEST` |
| `admin_code` | `NOTIF-PLT-000` |
| `enabled` | `false` (không dispatch production) |
| `category` | `system` |
| Template | Minimal title/body |

Seed ON CONFLICT — xóa smoke row khỏi production dispatch paths Phase D.

### 4.3 catalog.js Admin — retire plan

| Step | Action |
|------|--------|
| C3 | announcements FE stops loading catalog.js |
| C4 | Comment/block `CASES` + `MERGE_TAGS` exports in Admin catalog.js với header «SEED MOVED — notification-platform-seed-data.js» |
| Later | Delete Admin catalog file when User Web migrated (Phase D) |

**Không** sync catalog ↔ seed-data nữa.

---

## 5. Delete (C4 cleanup — PASS condition)

| Retire | Timing |
|--------|--------|
| `<script catalog.js>` on announcements.html | C4 |
| `cat()` / `IfluxSystemNotificationCatalog` in announcements-page.js | C4 |
| Admin catalog CASES as editable source | C4 comment + grep gate |
| Duplicate type row chỉ trong catalog.js | C4 |

**Không xóa Phase C:** User Web catalog files.

---

## 6. Create

| Deliverable | Path |
|-------------|------|
| Seed validator | `backend/scripts/validate-notification-seed.js` |
| Variable alias module | `backend/src/modules/notifications/variable-alias.js` |
| Developer seed workflow doc | `PhaseC-Developer-Seed-Workflow.md` (slice — full consumer guide = Phase D) |
| Smoke type in seed-data | `PLATFORM_SMOKE_TEST` |

### 6.1 validate-notification-seed.js (guard rules)

| Rule | FAIL |
|------|------|
| Every type has `template` block | Missing template |
| Every type has ≥1 variable | Empty variables |
| `code` unique · regex | Collision / bad format |
| `admin_code` unique | Duplicate NOTIF-* |
| `variables[].key` canonical snake_case | Invalid key |
| No duplicate `legacy_tag` within type | Ambiguous alias |

Exit code 1 → block seed script (or warn + require `--force`).

---

## 7. C3 Implementation slices (order)

```text
C3.1  variable-alias.js extract + template.service import
C3.2  validate-notification-seed.js + wire seed script
C3.3  PLATFORM_SMOKE_TEST seed entry
C3.4  announcements-page tag panel from API · remove catalog
C3.5  PhaseC-Developer-Seed-Workflow.md
```

---

## 8. C5 / C6 gates (preview)

### C5 — Architecture Verification (local)

| Grep | PASS |
|------|------|
| announcements — no `system-notification-catalog.js` | |
| announcements-page — no `cat()` | |
| Admin catalog CASES not imported elsewhere Admin | |
| `notification_types` only Platform module | |

### C6 — Functional Regression (Production)

| Test | PASS |
|------|------|
| Deploy seed with PLATFORM_SMOKE_TEST only | Admin lists NOTIF-PLT-000 **without FE deploy** |
| validate script catches type without template | |
| Tag panel renders from API variables | |
| Existing 24 types unchanged | |

---

## 9. Owner decisions needed (→ C2)

| ID | Quyết định | Đề xuất |
|----|------------|---------|
| **OD-C1** | Tag panel data source | **Aggregate client-side** from GET types |
| **OD-C2** | CI guard level | **Local script** + documented pre-deploy checklist (no GitLab CI in repo) |
| **OD-C3** | Admin catalog.js after C4 | **Comment block CASES/MERGE_TAGS** — file remains until User Web Phase D |
| **OD-C4** | PLATFORM_SMOKE_TEST on Production | **Seed with enabled:false** · visible Admin · C6 then optional remove |
| **OD-C5** | validate fails | **Exit 1 block seed** (no `--force` v1) |

**Locked (no re-decide):** Developer seeds Type · Admin read-only metadata · no Admin create UI.

---

## 10. Out of scope this phase

- User Web catalog retire
- Dispatcher · preference · consumers
- Full `10-Developer-Guide-Add-Consumer.md` (Phase D)
- Auto-generate seed from catalog.js

---

## 11. Exit C1

| Tiêu chí | Status |
|----------|--------|
| Reuse/Modify/Delete/Create | ✅ §2–§6 |
| C3 slice order | ✅ §7 |
| Owner open items | ✅ §9 |
| Không code | ✅ |

**→ C2:** [`PhaseC-C2-Owner-Decision.md`](PhaseC-C2-Owner-Decision.md)

---

*Phase C C1 — Solution Proposal — 2026-07-28.*
