# ABH E5 — Engineering Change Governance Compliance Audit

**Ngày:** 2026-07-27  
**SoT:** [`SoT — Engineering Change Governance.md`](../SoT%20—%20Engineering%20Change%20Governance.md) v1.1.1  
**Phase:** E5 — Runtime Entitlement stack  
**Liên kết:** [`E5-Evidence-Report.md`](E5-Evidence-Report.md) · [`E5-Semantic-Ownership-Audit.md`](E5-Semantic-Ownership-Audit.md) · [`E5-Acceptance-Criteria.md`](E5-Acceptance-Criteria.md)

---

## 0. Mục tiêu E5 (ABH Plan) vs kết quả

| Mục tiêu ABH E5 (WS-4) | Kết quả | Evidence |
|------------------------|---------|----------|
| User Web shell **không** load Admin `app/subscription/*.js` | ✅ Đạt | §2 CG-020 · grep E5-A |
| `IfluxEntitlements` đọc Readers + pure normalize (không Admin catalog) | ✅ Đạt | `iflux-entitlements.js` → `IfluxPlanNormalize` |
| **Không đổi** hành vi guest/free/premium/elite | ⏳ Owner verify runtime | DevTools §9 |
| Tách `normalizePlan` pure function (no store) | ✅ Đạt (runtime path) | `plan-normalize-runtime.js` grep purity §4 |
| ABH-09 không mở Reader/Facade API | ✅ Đạt | whitelist unchanged |
| Single SoT entitlement **rules** (ECG CG-002) | ⚠️ **Chưa** | ABH-TD-E5-001 · [`E5-Semantic-Ownership-Audit.md`](E5-Semantic-Ownership-Audit.md) |

**Verdict mục tiêu:** Boundary + migration **đạt** · SoT rules **partial** (ack debt E6).

---

## 1. CG-005 — Mandatory Impact Analysis

### Template (Plan E5 §7 + thực thi)

```
Feature: Runtime Entitlement stack decouple (E5)
Current owner: Admin EntitlementCatalog (790 LOC) on User Web shell
Files:
  - shell-boot.js, iflux-entitlements.js, iflux-block-gate.js,
    iflux-plans-catalog.js, plans-runtime-reader.js
Functions:
  - normalizePlan, resolveBlockEnabled, blocksForPage,
    isPermissionScopedWidget, visibleMenus, hasBlock
Consumers:
  - shell-boot, IfluxEntitlements, IfluxBlockGate, IfluxPlansCatalog,
    PlansRuntimeReader, auth (via getPlan), guest-shell, pricing
Storage-API:
  - GET /api/plans/runtime (read) · L4RuntimeReader · no Admin PATCH
Decision: Migrate (Type B — Refactor Ownership)
  - Eliminate: EntitlementCatalog load on Runtime
  - Introduce: IfluxPlanNormalize (User Web pure projection)
  - Defer: shared single normalize SoT → E6 (ABH-TD-E5-001)
```

| CG-005 yêu cầu | Có? | Evidence |
|----------------|-----|----------|
| Existing implementation | ✅ | [`E5-Evidence-Report.md`](E5-Evidence-Report.md) §3 consumer table |
| Existing owner | ✅ | Admin Permission WGS / `entitlement-catalog.js` |
| Consumers listed | ✅ | 5 files + PlansRuntimeReader |
| Storage/API | ✅ | GET runtime only |
| Decision Reuse\|Modify\|Migrate\|Delete | ✅ | **Migrate** + Eliminate shell load |

**CG-005:** ✅ **PASS** (documented pre/post impl in acceptance + evidence docs).

---

## 2. Change classification (§3)

| Loại | E5 |
|------|-----|
| **Type B — Refactor Ownership** | ✅ Đúng — Runtime entitlement projection chuyển khỏi Admin module load |
| Type A Modify | Một phần — sửa consumers |
| Type C New Capability | ❌ Không — không capability mới |

**CG-006:** Decision theo SoT + Ownership (ABH WS-4), không giữ Admin on Runtime vì “đã có sẵn”. ✅

---

## 3. CG-001 / CG-002 — Reuse & No Duplicate Responsibility

| Rule | Verdict | Evidence |
|------|---------|----------|
| **CG-001** Reuse before create | ⚠️ **PARTIAL** | Không reuse `entitlement-catalog.js` trên Runtime (đúng boundary) · **không** extract shared module — tạo fork [`plan-normalize-runtime.js`](../../User_Web/iflux-web-ui/plan-normalize-runtime.js) |
| **CG-002** One owner per responsibility | ⚠️ **PARTIAL** | **Matrix overrides:** 1 SoT = API ✅ · **Default normalize rules:** 2 implement (Admin + Runtime) ⚠️ |

```bash
rg "function normalizePlan\(" . --glob "*.js"
# Admin_Design_system/app/subscription/entitlement-catalog.js
# User_Web/iflux-web-ui/plan-normalize-runtime.js
```

**Remediation (bắt buộc E6):** ABH-TD-E5-001 — **ONE Rule Provenance**. Ưu tiên: Generated Artifact → Server-side normalize (publish-time) → Shared core (fallback only). See [`ABH-TD-E5-001`](ABH-TD-E5-001-Single-Rule-Provenance.md) §3.

**CG-001/002 boundary scope E5:** PASS (Runtime không dual-load Admin). **Full ECG:** CONDITIONAL until E6.

---

## 4. CG-010 / CG-011 — No shadow / cosmetic replacement

| Cấm | E5 có vi phạm? | Evidence |
|-----|----------------|----------|
| `display:none` / hide old + new visible | ❌ Không | Removed script load — không ẩn |
| Additive Admin catalog + runtime layer | ❌ Không | `EntitlementCatalog` **removed** from active `ensureParallel` |
| Comment-only thay xóa load | ⚠️ Comment block legacy paths | Active load **0** — comment là audit trail ABH (E4 lesson: nên xóa comment E6) |

```bash
rg -n "EntitlementCatalog" User_Web/iflux-web-ui/runtime/shell-boot.js
# 180-181: comment block only
```

**CG-010/011 (Runtime path):** ✅ **PASS**

---

## 5. CG-012 — New file justification

### File mới: `User_Web/iflux-web-ui/plan-normalize-runtime.js`

| CG-012 field | Trả lời |
|--------------|---------|
| **Why cannot modify existing?** | `entitlement-catalog.js` = **Admin WGS Owner** — load on User Web vi phạm ABH boundary; file 790 LOC chứa matrix UI (`buildAccessTree`, `setAccessValue`, `refreshBlocksCatalog`) không thuộc Runtime |
| **Existing owner** | Admin `entitlement-catalog.js` |
| **New owner** | User Web Runtime — **projection only** (`IfluxPlanNormalize`) |
| **Responsibility difference** | Runtime: read GET plans + L4 metadata → normalize for `IfluxEntitlements`. Admin: matrix edit + catalog refresh + tree UI |
| **Removal plan** | Merge logic vào `shared/` E6 (ABH-TD-E5-001) · xóa duplication |

**CG-012:** ✅ **PASS** (justified) · ⚠️ ghi nhận **trade-off duplication** (semantic audit).

---

## 6. CG-020 / CG-021 — Migration + Deletion

### CG-020 flow

| Bước | E5 |
|------|-----|
| 1. Create target | ✅ `IfluxPlanNormalize` / `plan-normalize-runtime.js` |
| 2. Migrate consumer | ✅ 5 consumers (table E5-Evidence §3) |
| 3. Verify behavior | ⏳ Owner DevTools §9 |
| 4. Remove source (Runtime path) | ✅ Admin catalog **off shell** |
| 5. Remove dead config | ✅ no new storage keys |
| 6. Remove dead JS imports | ✅ 0 active `EntitlementCatalog` User Web |

**Không** kết thúc `old + new coexist` **trên Runtime boot path**. ✅

### CG-021 Removed list

```
Removed (Runtime active path):
- shell-boot load: Admin app/subscription/entitlement-catalog.js (~790 LOC download)
- User Web active calls: EntitlementCatalog.* (grep → 0)

Added:
- plan-normalize-runtime.js (411 LOC User Web)

Not removed (correct — Admin still owns):
- Admin_Design_system/app/subscription/entitlement-catalog.js (Admin pages only)
```

**CG-020/021 (E5 scope):** ✅ **PASS**  
**CG-021 full track:** ⏳ ABH-TD-E5-001 (duplicate normalize logic) + E6 facade

---

## 7. CG-030 — Uncertainty / Owner decision

| Điểm | Xử lý |
|------|--------|
| Fork vs shared extract | Owner ack **E5 OPEN** + ABH-09/10/11 · debt **ABH-TD-E5-001** deferred E6 |
| Không tự bịa server-only normalize | ✅ Documented options in semantic audit |
| E5 CONDITIONAL PASS | ✅ Thành thật duplication — không che |

**CG-030:** ✅ **PASS**

---

## 8. §13 Review Evidence Package (ECG)

| # | Item | Path / evidence |
|---|------|-----------------|
| 1 | Applicable SoT | Product Arch V2 · ABH Plan E5 · ECG v1.1.1 · ABH-09/10/11 |
| 2 | Requirement | [`E5-Acceptance-Criteria.md`](E5-Acceptance-Criteria.md) §0 |
| 3 | Impact Analysis | §1 doc này · Plan E5 §7 |
| 4 | Change plan | Migrate Admin catalog off shell → IfluxPlanNormalize |
| 5 | Changed files | `shell-boot.js`, `iflux-entitlements.js`, `iflux-block-gate.js`, `iflux-plans-catalog.js`, `plans-runtime-reader.js`, `bootstrap.js` |
| 6 | Added files | `plan-normalize-runtime.js` (CG-012 §5) |
| 7 | Deleted files | none (Admin source giữ — Admin-only) |
| 8 | Migration evidence | [`E5-Evidence-Report.md`](E5-Evidence-Report.md) · grep §10 |
| 9 | Test evidence | ⏳ Owner runtime §9 · Production deploy + CDN purge |

---

## 9. §10 Definition of Done — checklist ECG

| DoD item (ECG §10) | E5 |
|--------------------|-----|
| Impact Analysis (CG-005) | ✅ §1 |
| Existing implementation identified | ✅ |
| Owner identified | ✅ Admin vs Runtime |
| No duplicate responsibility | ⚠️ dual defaults — ABH-TD-E5-001 |
| New file CG-012 | ✅ §5 |
| Old code removed (Runtime path) (CG-021) | ✅ |
| No hidden legacy (CG-010/011) | ✅ |
| No workaround vs fix owner | ✅ boundary fix real |
| Evidence grep/test | ✅ §10 |
| Review Evidence Package (§13) | ✅ doc này |

**ECG Definition of Done:** **PASS WITH ARCHITECTURAL CONDITION** — boundary ✅ · ABH-TD-E5-001 blocks ABH complete.

---

## 10. Grep evidence (reproduce)

```bash
# Active EntitlementCatalog on User Web
rg "EntitlementCatalog\.|window\.EntitlementCatalog" User_Web/ --glob "*.{js,html}"
# → 0 active

# Shell load
rg "global: 'EntitlementCatalog'" User_Web/iflux-web-ui/runtime/shell-boot.js
# → 0 active (comment only)

# Admin subscription on shell path
rg "app/subscription/" User_Web/ --glob "*.js"
# → shell-boot comment only

# Dynamic loader blocklist (feature-runtime)
rg "entitlement-catalog" User_Web/iflux-web-ui/runtime/feature-runtime.js
# → SHELL_SRC_BLOCKLIST entry

# ABH-09 readers unchanged
rg "\.(save|publish|hydrate|sync|refresh)\(" User_Web/iflux-web-ui/readers/
# → 0

# Purity plan-normalize
rg "fetch\(|localStorage|PageSettings|PlatformLayers" User_Web/iflux-web-ui/plan-normalize-runtime.js
# → 0
```

### Production (post-deploy)

```bash
curl -sS "https://iflux.vn/User_Web/iflux-web-ui/runtime/shell-boot.js?v=abhE520260727" \
  | rg "IfluxPlanNormalize|global: 'EntitlementCatalog'"
# IfluxPlanNormalize active · EntitlementCatalog chỉ comment
```

---

## 11. Ma trận tuân thủ ECG — tóm tắt Owner

| CG Rule | E5 verdict | Ghi chú |
|---------|------------|---------|
| CG-005 Impact Analysis | ✅ PASS | §1 |
| CG-001 Reuse | ⚠️ PARTIAL | fork thay shared — E6 |
| CG-002 No duplicate | ⚠️ PARTIAL | dual normalize defaults |
| CG-006 Decision by SoT | ✅ PASS | |
| CG-010 No hide | ✅ PASS | |
| CG-011 No cosmetic | ✅ PASS | |
| CG-012 New file | ✅ PASS | §5 |
| CG-020 Migration cleanup | ✅ PASS (Runtime path) | |
| CG-021 Deletion | ✅ PASS (Runtime path) | |
| CG-030 Uncertainty | ✅ PASS | Owner ack + debt ticket |
| ECG §10 DoD | **PASS WITH CONDITION** | ABH-TD-E5-001 |

---

## 12. Kết luận cho Owner (2026-07-27)

| Label | Verdict |
|-------|---------|
| E5 ECG — Boundary compliance (CG-010–021) | ✅ PASS |
| E5 ECG — Full SoT (CG-002 / §12 Final Principle) | ⏳ **Architecture Incomplete** |
| **E5 overall** | **PASS WITH ARCHITECTURAL CONDITION** |
| ABH track complete | ⏳ BLOCK until [`ABH-TD-E5-001`](ABH-TD-E5-001-Single-Rule-Provenance.md) + [`ABH-12`](ABH-12-Rule-Provenance-Gate.md) |

Default normalize rules vẫn 2 interpreter — **không** ký ABH complete cho đến **single rule provenance**.

---

*Audit này map trực tiếp [`SoT — Engineering Change Governance.md`](../SoT%20—%20Engineering%20Change%20Governance.md) §0–§13 với deliverable E5.*
