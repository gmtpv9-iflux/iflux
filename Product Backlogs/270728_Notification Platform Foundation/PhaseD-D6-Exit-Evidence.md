# Phase D — D6 Exit Evidence · Notification Taxonomy Single SoT

**Date:** 2026-07-28  
**Trạng thái:** ✅ **SHIPPED**  
**Proposal:** [`PhaseD-D6-Notification-Taxonomy-SoT-Proposal.md`](PhaseD-D6-Notification-Taxonomy-SoT-Proposal.md)  
**Owner sign-off:** OD-D6-0…8 ✅ 2026-07-28

---

## 1. Post-Implementation Evidence Table

| Artifact | Before | After | PASS |
|----------|-------:|------:|:----:|
| Human group DB fields | 2 (`group_label`, `preference_group`) | **1** (`group_label`) | ✅ |
| Mapping functions | 2 (`groupLabel`, `bucketForGroup`) | **0** | ✅ |
| Translation constants | 1 (`GROUP_LABELS` + `GROUP_ORDER`) | **0** | ✅ |
| Adapter layers (seed/API) | 2 (`bucketForGroup`, `preferenceGroup` DTO) | **0** | ✅ |
| Compatibility / dual-read code | 1 (read `preference_group` in preference.service) | **0** | ✅ |
| API shadow fields (`preferenceGroup`) | 1 | **0** | ✅ |
| **Total Product SoT owners** | **4** | **1** | ✅ |

---

## 2. Ownership & Data Flow

| Constraint | Evidence |
|------------|----------|
| **Ownership** | Sole owner = `notification_types.group_label` |
| **Data flow** | DB → API `group` / `groups[].label` → Admin filter + User section |
| **No reverse derivation** | UI/Service không map · không hardcode nhóm |

---

## 3. Migration 040 (Production)

```text
✅ ALTER group_label DROP NOT NULL (B5 non-configurable types)
✅ Normalize → Affiliate · Cộng đồng · Theo dõi · Cảnh báo thông minh · Hệ thống
✅ NULL → Gói đăng ký · Admin ops · Platform internal
✅ DROP preference_group column + indexes
```

Production distinct `group_label` after migrate:

```text
Affiliate · Cảnh báo thông minh · Cộng đồng · Hệ thống · Theo dõi · (NULL for orders/admin)
```

---

## 4. DELETE List (§3.2 proposal)

| Item | Status |
|------|--------|
| `preference_group` column | ✅ DROP 040 |
| `GROUP_LABELS` / `GROUP_ORDER` / `groupLabel()` | ✅ deleted |
| `bucketForGroup()` | ✅ deleted |
| `preferenceGroup` DTO | ✅ deleted |
| Seed `preference_group` upsert | ✅ deleted |
| Platform SoT docs updated | ✅ 06 · 08 · 10 · 11 |

---

## 5. Ship gate grep (2026-07-28)

```bash
rg 'preference_group|GROUP_LABELS|GROUP_ORDER|bucketForGroup|preferenceGroup' \
  backend/src/modules/notifications/ \
  Admin_Design_system/app/system/announcements-page.js \
  User_Web/iflux-web-ui/notification-preference-store.js \
  User_Web/iflux-web-ui/profile-privacy-page.js
```

**Result:** 1 match — `preference.service.js` **reject-only** legacy PATCH payload (`item.preference_group`) — không đọc SoT · B4 retire contract.

**Seed validate:** `[validate-notification-seed] PASS — 25 types`

---

## 6. Files changed

| File | Change |
|------|--------|
| `backend/migrations/040_notification_group_label_sot.sql` | NEW — normalize + DROP |
| `backend/src/modules/notifications/preference.service.js` | group_label only |
| `backend/src/modules/notifications/template.service.js` | remove preferenceGroup |
| `backend/src/modules/notifications/notification-platform-seed-data.js` | canonical groups · delete bucketForGroup |
| `backend/scripts/seed-notification-platform-types.js` | no preference_group |
| `06-Platform-SoT.md` · `08` · `10` · `11` | group_label SoT |

---

## 7. Regression (manual — Owner)

| ID | Verify |
|----|--------|
| **R-TAX-1** | Admin filter "Affiliate" = User section "Affiliate" (same string) |
| **R-TAX-2** | Gói đăng ký types không hiện User toggle |
| D5 R0 · R2 | Unchanged (`name` · per-type preference) |

---

*Phase D D6 — Exit Evidence — 2026-07-28.*
