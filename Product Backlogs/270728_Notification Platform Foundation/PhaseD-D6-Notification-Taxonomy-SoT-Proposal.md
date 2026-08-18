# Phase D — D6 Notification Taxonomy SoT Proposal

**Date:** 2026-07-28  
**Trạng thái:** ✅ **SHIPPED 2026-07-28** — [`PhaseD-D6-Exit-Evidence.md`](PhaseD-D6-Exit-Evidence.md)  
**Trigger:** Human Consistency violation — Admin filter nhóm ≠ User Web section nhóm  
**Principle:** Human concept → Single SoT → Admin UI + User UI consume (cùng rule Widget / Layout / Data Pipeline)

---

## ⚠️ Điều khoản bắt buộc — Taxonomy Unification Refactor

> Đây là **taxonomy unification refactor**.
>
> Mục tiêu là **giảm số nguồn dữ liệu**, không phải tăng.
>
> Mọi implementation làm tăng adapter, mapper, compatibility layer, alias hoặc dual-read đều bị xem là **FAIL**.

**Đây là REPLACE, không phải EXTEND.**

Migration SQL (040) chỉ phục vụ **normalize + DROP artifact trùng** trong cùng task — **không** phải compatibility migration · **không** bridge period · **không** dual-read window.

---

## Implementation Constraint (LOCKED — nguyên văn Owner)

> **Implementation Constraint**
>
> This task is a **replacement refactor**, not an extension.
>
> The implementation **MUST reduce** duplicated responsibilities.
>
> It is **forbidden** to introduce:
>
> * new fields for the same Product concept;
> * mapping layers;
> * adapter layers;
> * translation tables;
> * compatibility wrappers;
> * alias DTOs;
> * dual-read logic;
> * fallback logic.
>
> Existing duplicated artifacts must be **removed within the same implementation**.
>
> The implementation is considered successful only if the number of Product SoTs is reduced to exactly one.

---

## Ownership Constraint (LOCKED)

> **`group_label` is the sole owner of the Product concept "Nhóm thông báo".**
>
> No other module, service, API, seed, migration, cache, frontend store, helper, or constant may derive, redefine, or reinterpret this concept.

**Cấm:**

- Seed tự suy luận group (vd. `bucketForGroup`)
- Service tự map group (vd. `GROUP_LABELS`)
- Frontend tự gom nhóm / hardcode label nhóm
- Helper tự dịch nhóm

**Bắt buộc:** mọi consumer **đọc đúng một owner** — `notification_types.group_label`.

---

## Data Flow Constraint (LOCKED)

> **Data Flow Constraint**
>
> Human concept → Database → API → UI
>
> Reverse derivation is prohibited.

| Layer | Allowed | Forbidden |
|-------|---------|-----------|
| **DB (`group_label`)** | Define group | — |
| **API** | Pass through `group_label` | Suy luận · map · rebuild group |
| **Service** | Read `group_label` · group rows | `GROUP_LABELS` · `preference_group` |
| **UI** | Render API value | Tạo group · đổi label · gom nhóm local |

---

## Implementation Rules (LOCKED)

### Reuse Before Create

```text
Reuse existing field before creating any new field.

If an existing field can represent the Product concept,
that field MUST become the sole Source of Truth.

Creating another field representing the same concept is prohibited.
```

**Cấm tuyệt đối** thêm field cùng concept:

```text
group_label
preference_group   ← DELETE, không giữ song song
group_name         ← CẤM tạo mới
display_group      ← CẤM tạo mới
group_display_name ← CẤM tạo mới
human_group        ← CẤM tạo mới
```

### Forbidden — Adapter / Map / Translate

```text
Forbidden

- Adapter layer
- Mapping table
- Translation layer
- Compatibility wrapper
- Alias field
- Shadow DTO

between Admin and User taxonomy.
```

**Anti-pattern cấm (FAIL ngay):**

```text
group_label → map → GROUP_LABELS → Preference DTO → Frontend
```

### Forbidden — Dual Read

```text
Forbidden

Read from two fields representing the same Product concept.

Only one field is allowed.

No fallback.
```

**Anti-pattern cấm (FAIL ngay):**

```javascript
if (group_label) use group_label;
else use preference_group;  // ← FAIL
```

### Forbidden — Compatibility Mode

```text
No compatibility mode.
No temporary bridge.
No legacy fallback.
Deprecated support.

Old implementation must be deleted in the same task.
```

**Cấm từ khóa trong code/comments deliverable:**

- `temporary compatibility`
- `legacy support`
- `fallback support`
- `deprecated support` *(trừ header DEPRECATED trên file sẽ xóa ngay trong task)*

### Forbidden — Rename While Keeping Old

```text
Do not rename while keeping the old concept alive.

Replace.
Delete.
Reuse.
```

**FAIL ví dụ:**

```text
group_label → display_group (mới) + group_label vẫn còn
preference_group → human_group (mới) + preference_group vẫn còn
```

---

## Net Responsibility — MUST Decrease

Sau implementation **bắt buộc** chứng minh số owner giảm. Nếu không giảm → **FAIL**.

### Before (4 owners cho human group)

```text
group_label          ← Admin filter
preference_group     ← User grouping logic
GROUP_LABELS         ← backend label map
bucketForGroup()     ← seed adapter
```

### After (1 owner only)

```text
group_label          ← Admin + User + API + seed
Only.
```

| Metric | Before | After | PASS? |
|--------|--------|-------|-------|
| DB columns for human group | 2 (`group_label`, `preference_group`) | 1 (`group_label`) | Must be 1 |
| Backend label maps | 1 (`GROUP_LABELS`) | 0 | Must be 0 |
| Seed adapters | 1 (`bucketForGroup`) | 0 | Must be 0 |
| API shadow fields | 1 (`preferenceGroup` DTO) | 0 | Must be 0 |
| **Total Product SoT owners** | **4** | **1** | **Must decrease to 1** |

---

## 0. Executive summary

| | |
|---|---|
| **Finding** | Admin và User Web đang nhìn **hai hệ taxonomy khác nhau** cho cùng human concept「Nhóm thông báo」 |
| **Root cause** | Schema lịch sử: `group_label` song song `preference_group` + `GROUP_LABELS` + `bucketForGroup()` |
| **Không phải** | Bug sync frontend · thiếu adapter · thiếu field mới |
| **Đề xuất** | **Reuse** `group_label` làm sole SoT · **DELETE** mọi artifact trùng trong cùng task |
| **Loại task** | **Replacement refactor** — không extension · không compatibility |

---

## 1. Human concept (khóa trước schema)

### 1.1 Business concept

```text
Nhóm thông báo
  = cách Admin và User cùng gọi một nhóm loại thông báo
  = section header User Web「Thiết lập thông báo」
  = filter「Chọn nhóm」Admin ADM-SYS-003
```

**Không phải human group:**

| Concept | Vai trò |
|---------|---------|
| `type_code` | Developer stable key |
| `admin_code` | Legacy NOTIF-* |
| `name` | Tên mẫu — D1-rev A1 (concept khác) |
| `category` | Developer slug — **giữ, không UI group** |
| `channel_label` | Delivery metadata |
| Catalog suffix `· User` / `· Admin` | Artifact — **normalize away** |

### 1.2 Human language (v1 canonical labels)

Admin filter và User section header **cùng chuỗi API** (`group_label`):

| Nhóm | User configurable v1 |
|------|----------------------|
| Affiliate | ✅ |
| Cộng đồng | ✅ |
| Theo dõi | ✅ |
| Cảnh báo thông minh | ✅ |
| Hệ thống | ✅ |
| `NULL` | ❌ always ON · ẩn User UI (B5) |

Non-configurable: Gói đăng ký · Vận hành Admin · Platform internal.

---

## 2. Audit hiện trạng

### 2.1 Field inventory

| Field / artifact | Consumer | Action |
|------------------|----------|--------|
| `group_label` | Admin `t.group` | **KEEP — become sole SoT** |
| `preference_group` | User `preference.service.js` | **DELETE column** |
| `GROUP_LABELS` | User API label | **DELETE code** |
| `GROUP_ORDER` | User API sort | **DELETE code** — sort by `group_label, admin_code` |
| `bucketForGroup()` | Seed | **DELETE function** |
| `preferenceGroup` DTO | Admin API | **DELETE field** |
| `category` | Developer only | **KEEP — not human group** |

### 2.2 Mapping drift (evidence)

| Admin thấy (`group_label`) | User logic (`preference_group`) | User label (`GROUP_LABELS`) |
|-----------------------------|----------------------------------|----------------------------|
| `Membership · User` | `affiliate_notifications` | Affiliate |
| `Cộng đồng · User` | `community_notifications` | Cộng đồng |
| `Tương tác · User` | `community_notifications` | Cộng đồng |
| `Gói đăng ký · User` | `NULL` | *(ẩn)* |

→ **3 lớp tên** = Human Consistency violation.

---

## 3. Proposal — Single SoT (`group_label`)

### 3.1 Canonical ownership

| Human concept | SoT | Owner |
|---------------|-----|-------|
| Nhóm thông báo | `notification_types.group_label` | Notification Platform · Type Registry |
| Tên mẫu | `notification_types.name` | Platform + Admin PATCH |
| Preference ON/OFF | `user_notification_type_preferences(type_code)` | User |

```text
group_label IS NULL     → non-configurable · always ON · ẩn User UI
group_label = 'Affiliate' → Admin filter + User section — same string
```

**Không** `group_key` riêng — human label = identity. Sort: `ORDER BY group_label, admin_code`.

### 3.2 DELETE List (checklist bắt buộc — same task)

Implementation **FAIL** nếu bất kỳ mục nào còn tồn tại sau merge:

```
DELETE — schema
□ preference_group column (notification_types)
□ idx_notification_types_preference_group

DELETE — backend code
□ GROUP_LABELS constant
□ GROUP_ORDER constant
□ groupLabel() function
□ exports GROUP_LABELS from preference.service.js
□ bucketForGroup() in notification-platform-seed-data.js
□ preference_group in buildTypeSeeds() / seed upsert
□ preferenceGroup field in template.service.js typeRowToDto()
□ preference_group fallback read (row.preference_bucket) in template.service.js
□ dual-read: preference_group in preference.service.js queries
□ reject-bucket comments referencing preference_group as active SoT

DELETE — API surface
□ preferenceGroup in Admin GET /admin/notifications/types response
□ Any User API field derived from preference_group

DELETE — docs (update or remove stale SoT)
□ 06-Platform-SoT.md preference_group as UI SoT
□ 11-User-Preference-UI-Contract.md preference_group source
□ 10-Developer-Guide bucketForGroup / preference_group
□ D1-rev B2 preference_group wording (superseded note)

DELETE — grep must be zero (runtime)
□ rg 'preference_group' backend/src/modules/notifications/
□ rg 'GROUP_LABELS|GROUP_ORDER|groupLabel' backend/
□ rg 'bucketForGroup' backend/
□ rg 'preferenceGroup' Admin_Design_system/ User_Web/
```

**Không chấp nhận:** "không dùng nữa" · comment out · `@deprecated` để lại runtime.

---

## 4. Refactor plan (Migration 040 = cleanup only)

**Prerequisite:** Owner sign-off §8 · D5 baseline.

### 4.1 Normalize `group_label` (reuse column — no new field)

```sql
UPDATE notification_types SET group_label = 'Affiliate'
  WHERE group_label LIKE '%Membership%';
UPDATE notification_types SET group_label = 'Cộng đồng'
  WHERE group_label LIKE '%Cộng đồng%' OR group_label LIKE '%Tương tác%';
UPDATE notification_types SET group_label = 'Theo dõi'
  WHERE group_label LIKE '%Theo dõi%';
UPDATE notification_types SET group_label = 'Cảnh báo thông minh'
  WHERE group_label LIKE '%Cảnh báo thông%';
UPDATE notification_types SET group_label = 'Hệ thống'
  WHERE group_label LIKE '%Alert Hệ thống%' OR group_label LIKE '%Broadcast%';
UPDATE notification_types SET group_label = NULL
  WHERE group_label LIKE '%Gói đăng ký%'
     OR group_label LIKE '%Vận hành%'
     OR group_label LIKE '%Platform%';
```

### 4.2 DROP redundant column (same task)

```sql
ALTER TABLE notification_types DROP COLUMN IF EXISTS preference_group;
DROP INDEX IF EXISTS idx_notification_types_preference_group;
```

### 4.3 Seed — direct canonical values

- `CATALOG_CASES[].group` = human label (`Affiliate`, not `Membership · User`)
- **DELETE** `bucketForGroup()` · **DELETE** `preference_group` from seed payload

### 4.4 Reuse · no bridge

- **Reuse** `group_label` — sole SoT
- **Reuse** `user_notification_type_preferences` — per `type_code` unchanged (D1-rev)
- **Cấm** compatibility view · alias column · dual-read period · fallback branch

---

## 5. API contract (post-refactor)

### Admin `GET /admin/notifications/types`

| Field | Source |
|-------|--------|
| `group` | `group_label` only |

**DELETE** `preferenceGroup` from response.

### User `GET /users/me/notification-preferences`

```json
{
  "groups": [
    {
      "key": "Affiliate",
      "label": "Affiliate",
      "types": [{ "type_code": "...", "name": "...", "enabled": true }]
    }
  ]
}
```

`key` = `label` = `group_label` — **read DB, no map**.

### `preference.service.js`

```text
SELECT code, name, group_label FROM notification_types
WHERE group_label IS NOT NULL ...
-- group in memory by group_label
-- NO GROUP_LABELS · NO preference_group · NO fallback
```

---

## 6. Files affected

| File | Action |
|------|--------|
| `backend/migrations/040_notification_group_label_sot.sql` | Normalize + DROP |
| `backend/src/modules/notifications/preference.service.js` | Replace reads · DELETE maps |
| `backend/src/modules/notifications/template.service.js` | DELETE preferenceGroup |
| `backend/src/modules/notifications/notification-platform-seed-data.js` | DELETE bucketForGroup |
| `backend/scripts/seed-notification-platform-types.js` | DELETE preference_group upsert |
| `06-Platform-SoT.md` · `08` · `11` · `10` · D1-rev | Update SoT |
| Admin / User UI | Consume same API value — **no new UI layer** |

---

## 7. Acceptance Criteria (measurable — PASS/FAIL)

Implementation **PASS** chỉ khi **tất cả** điều kiện:

| # | Criterion | Verify |
|---|-----------|--------|
| AC-1 | Human group tồn tại **đúng 1 DB field** | `\d notification_types` → only `group_label` |
| AC-2 | **Không** còn mapper | `rg GROUP_LABELS\|groupLabel\|bucketForGroup` backend → 0 |
| AC-3 | **Không** còn adapter DTO | `rg preferenceGroup` → 0 |
| AC-4 | **Không** còn `preference_group` column | SQL + grep → 0 |
| AC-5 | **Không** dual-read / fallback | `rg 'preference_group\|preference_bucket'` runtime code → 0 |
| AC-6 | Admin filter value = User section value | Manual R-TAX-1 same string |
| AC-7 | Net owners **4 → 1** | § Net Responsibility table |
| AC-8 | DELETE List §3.2 **100% checked** | PR checklist |
| AC-9 | **Không** field mới cùng concept | Schema diff review |
| AC-10 | D5 R0 · R2 still PASS | Regression |

**FAIL bất kỳ AC → không ship.**

---

## 8. Regression impact

| Case | Impact |
|------|--------|
| D5 R0 · R2 | ✅ Unchanged (`name` · `type_code` preference) |
| Admin filter labels | ⚠️ Expected change → canonical human labels |
| Migration 039 prefs | ✅ Preserved |
| Dispatcher | ✅ Unchanged |

**D6 regression:**

| ID | Verify |
|----|--------|
| R-TAX-1 | Admin filter text = User section text (same API field) |
| R-TAX-2 | DELETE List grep → 0 matches |
| R-TAX-3 | Net owners = 1 |
| R-TAX-4 | Seed re-run does not recreate deleted artifacts |

---

## 9. Owner decision checklist

| # | Quyết định | Status |
|---|------------|--------|
| **OD-D6-0** | Task type = **replacement refactor** · cấm compatibility | ✅ 2026-07-28 |
| **OD-D6-1** | Sole SoT = `group_label` (reuse, no new field) | ✅ 2026-07-28 |
| **OD-D6-2** | Canonical labels §1.2 | ✅ 2026-07-28 |
| **OD-D6-3** | DELETE List §3.2 mandatory same task | ✅ 2026-07-28 |
| **OD-D6-4** | `category` ≠ human group | ✅ 2026-07-28 |
| **OD-D6-5** | B5 → `group_label IS NULL` | ✅ 2026-07-28 |
| **OD-D6-6** | AC-1…10 = ship gate | ✅ 2026-07-28 |
| **OD-D6-7** | Ownership + Data Flow constraints | ✅ 2026-07-28 |
| **OD-D6-8** | Post-implementation Evidence Table required | ✅ 2026-07-28 |

---

## 10. Post-Implementation Evidence Table (required deliverable)

Implementation **FAIL** nếu thiếu bảng này trong [`PhaseD-D6-Exit-Evidence.md`](PhaseD-D6-Exit-Evidence.md).

| Artifact | Before | After | PASS |
|----------|-------:|------:|------|
| Human group DB fields | 2 | **1** | After = 1 |
| Mapping functions | 2 | **0** | After = 0 |
| Translation constants | 1 | **0** | After = 0 |
| Adapter layers (seed/API) | 2 | **0** | After = 0 |
| Compatibility / dual-read code | 1 | **0** | After = 0 |
| API shadow fields (`preferenceGroup`) | 1 | **0** | After = 0 |
| **Total Product SoT owners** | **4** | **1** | After = 1 |

---

## 11. Exit criteria

```text
Owner sign-off OD-D6-0…8 (2026-07-28)
  → Migration 040 (normalize + DROP only)
  → DELETE List 100%
  → AC-1…10 PASS
  → Evidence Table in PhaseD-D6-Exit-Evidence.md
  → D5 + R-TAX re-run
```

**Ship gate grep (must all pass):**

```bash
rg 'preference_group|GROUP_LABELS|GROUP_ORDER|bucketForGroup|preferenceGroup' \
  backend/src/modules/notifications/ \
  Admin_Design_system/app/system/announcements-page.js \
  User_Web/iflux-web-ui/
# → 0 matches in runtime code
```

---

*Phase D D6 — SHIPPED pending evidence — Owner approved 2026-07-28.*
