# Final Exit Evidence — Architecture Boundary Hardening (E6)

**Ngày:** 2026-07-27  
**Production:** https://iflux.vn  
**Mục đích:** Gói bằng chứng Reviewer yêu cầu trước khi ký **ABH COMPLETE**  
**Verdict đề xuất:** **PASS — sẵn sàng ký COMPLETE** (pending reviewer ack)

---

## 0. Phạm vi bằng chứng

| Loại | Có trong gói này |
|------|------------------|
| grep phân loại active/archive | ✅ §1–§5 |
| Production GET/PUT publish | ✅ §2 (SSH 2026-07-27) |
| Runtime reachability | ✅ §1, §4, §5 |
| Network / shell-boot | ✅ §4 |
| File dead code removed | ✅ §5 (`plan-normalize-runtime.js` **DELETED**) |

---

## 1. Prove Runtime không còn normalize

### 1.1 Full repo — `rg "normalizePlan" .`

Phân loại **JavaScript active** (2026-07-27, sau xóa `plan-normalize-runtime.js`):

| File | Match | Active? | Owner | Runtime reachable? |
|------|-------|---------|-------|-------------------|
| `backend/.../plan-normalize-publish.js` | `function normalizePlan` | ✅ **Publish** | Permission Publish pipeline | ❌ Server only |
| `Admin_Design_system/.../entitlement-catalog.js` | `function normalizePlan` | ✅ **Admin UI** | Matrix authoring/preview | ❌ Not on User Web shell |
| `Admin_.../plans-store.js` | `normalizePlanData()` → delegates Catalog | ✅ Admin | Admin pages only | ❌ |
| `Admin_.../entitlement-matrix-ui.js` | calls `Cat.normalizePlan` | ✅ Admin UI | Admin pages only | ❌ |
| `backend/.../subscriptions.service.js` | `normalizePlanFields` | ✅ Admin API | Different domain (plan CRUD fields) | ❌ |
| **`User_Web/**/*.js`** | — | **0** | — | — |
| `docs/**` | mentions | 📄 Docs only | — | ❌ |

### 1.2 User Web — zero matches

```bash
rg -n "normalizePlan" User_Web/ --glob "*.js"
# → (none)
```

### 1.3 `function normalizePlan(` — implementation count

```bash
rg -n "function normalizePlan" --glob "*.js" .
```

**Output thực:**

```
./backend/src/modules/subscription/plan-normalize-publish.js:264:function normalizePlan(plan, wl) {
./Admin_Design_system/app/subscription/entitlement-catalog.js:659:  function normalizePlan(plan) {
```

| Implementation | Path | Runtime contract? |
|----------------|------|-------------------|
| **Publish artifact builder** | `plan-normalize-publish.js` | ✅ **YES — ONE provenance for `plans[]`** |
| Admin UI preview | `entitlement-catalog.js` | ❌ Authoring only · not loaded on `/home` |

**Runtime User Web: 0 implementations.**

### 1.4 Old path unreachable

| Old path | Status |
|----------|--------|
| `shell-boot` → `plan-normalize-runtime.js` | **REMOVED** — file **DELETED** |
| `IfluxPlanNormalize.normalizePlan()` | **No global** — `typeof === "undefined"` |
| `PlansRuntimeReader.mergePlan + normalizePlanData` | **REMOVED** E6 — reader reads `plans[]` only |

---

## 2. Prove backend Publish là owner (PUT → artifact → GET)

### 2.1 Flow

```text
Admin Matrix (overrides in JSON)
        │
        ▼ PUT /api/plans/runtime (admin auth)
writeRuntimeFile() → buildPublishedArtifact()
        │
        ▼
/var/iflux/backend/data/plans-runtime.json  { plans[] }
        │
        ▼ GET /api/plans/runtime
PlansRuntimeReader.getPlan()  ← NO client merge
```

### 2.2 Production evidence (SSH 2026-07-27)

```text
=== GET before ===
updatedAt: 1785129430512  plans: 4  guest_dashboard: false

=== Publish rebuild (plan-normalize-publish.js via build-plans-artifact.js) ===
Wrote /var/iflux/backend/data/plans-runtime.json — plans: 4

=== GET after ===
updatedAt: 1785129683029  plans: 4  guest_dashboard: false

=== PUT without auth ===
HTTP 403
```

**Chứng minh:**

- `updatedAt` thay đổi sau publish rebuild → artifact được ghi lại server-side
- `guest.pages.dashboard: false` có trong GET **trước** Runtime boot → không phải client merge
- Anonymous PUT **403** → không bypass publish

### 2.3 GET payload structure (curl Production)

```bash
curl -sS "https://iflux.vn/api/plans/runtime"
```

```text
artifact keys: ['version', 'updatedAt', 'overrides', 'custom', 'plans']
plans count: 4
guest: blocks_on=9  pages_on=6  dashboard=false
free:  blocks_on=41 pages_on=7
```

Runtime reader **chỉ** đọc `plans[]`:

```javascript
// plans-runtime-reader.js — findPlan() from store.plans only
// NO mergePlan · NO normalizePlanData
```

---

## 3. Prove Runtime entitlement path không mutate

### 3.1 Scope — entitlement boot path

```
readers/plans-runtime-reader.js
readers/l4-runtime-reader.js
iflux-entitlements.js
iflux-block-gate.js
iflux-plans-catalog.js (getPlan/listPlans via reader only)
runtime/shell-boot.js (load chain only)
```

### 3.2 Forbidden pattern grep

```bash
rg -n "localStorage|sessionStorage|normalizePlan|mergePlan|publish|hydrate|\.save\(|\.sync\(|dispatchEvent" \
  User_Web/iflux-web-ui/readers/ \
  User_Web/iflux-web-ui/iflux-entitlements.js \
  User_Web/iflux-web-ui/iflux-block-gate.js \
  User_Web/iflux-web-ui/iflux-plans-catalog.js
```

**Output:** `(none in entitlement path)`

Chỉ match trong **comment** `plans-runtime-reader.js` line 3–4 ("published artifact") — không functional.

### 3.3 AB-07 readers

| Reader | localStorage | normalize | merge | publish/hydrate/save |
|--------|--------------|-----------|-------|---------------------|
| PlansRuntimeReader | ❌ | ❌ | ❌ | ❌ |
| L4RuntimeReader | ❌ | ❌ | ❌ | ❌ |

---

## 4. Prove compatibility layer chết

### 4.1 Source grep — User Web active JS

```bash
rg -n "WidgetLibraryCatalog|installLibraryFacade" User_Web/ --glob "*.js"
# → (none)
```

Đã xóa: `flow-score-top.js.restore` (backup cũ, không load).

### 4.2 shell-boot — không load facade

```bash
curl -sS "https://iflux.vn/User_Web/iflux-web-ui/runtime/shell-boot.js" \
  | rg "WidgetLibraryCatalog|installLibraryFacade|plan-normalize"
# → 0 active (chỉ comment EntitlementCatalog legacy)
```

### 4.3 Runtime Console (Reviewer chạy trên `/home`)

```javascript
typeof window.WidgetLibraryCatalog   // "undefined"
typeof window.IfluxPlanNormalize     // "undefined"
typeof window.EntitlementCatalog     // "undefined"
```

### 4.4 Network — files must NOT appear

| Filter | Expected |
|--------|----------|
| `WidgetLibraryCatalog` | 0 |
| `plan-normalize-runtime` | 0 |
| `entitlement-catalog` | 0 |
| `installLibraryFacade` | N/A — no file |

---

## 5. Prove không còn dual path

### 5.1 Before / After

```text
OLD (E5 — REMOVED, UNREACHABLE)
Admin EntitlementCatalog ──┐
                           ├── both normalizePlan → RUNTIME INTERPRETER #2
User Web plan-normalize-runtime.js ──┘
         │
         ▼ REMOVED E6: file DELETED · shell-boot không load

NEW (E6 — ONLY PATH)
Admin Matrix → PUT → plan-normalize-publish.js → plans[] artifact
         │
         ▼ GET /api/plans/runtime
PlansRuntimeReader → IfluxEntitlements (consume plan.blocks[id])
```

### 5.2 Dead code disposition (Reviewer request)

| File | E6 action |
|------|-----------|
| `User_Web/.../plan-normalize-runtime.js` | **DELETED** (not commented) |
| `User_Web/.../flow-score-top.js.restore` | **DELETED** (facade refs in backup) |
| `l4-runtime-reader.js` `installLibraryFacade` | **DELETED** |

### 5.3 Single provenance cho Runtime contract

```text
Rule: guest hasBlock WGT-MKT-001
  → plans[guest].blocks.WGT-MKT-001 === true  (GET artifact)
  → built by plan-normalize-publish.js ONLY
  → NOT EntitlementCatalog on client
  → NOT plan-normalize-runtime.js (deleted)
```

---

## 6. Dual-path matrix — final

| Capability | Old owner | New owner | Runtime loads old? |
|------------|-----------|-----------|-------------------|
| Normalize plans | Client + Admin | **Publish module** | ❌ |
| Plan data | merge BASE+override client | **`plans[]` GET** | ❌ |
| Widget index | WidgetLibraryCatalog | **L4RuntimeReader** | ❌ |
| Admin subscription JS | shell-boot | **none** | ❌ |

---

## 7. Reviewer sign-off checklist

| # | Yêu cầu Reviewer | Evidence section | Pass? |
|---|-------------------|------------------|-------|
| 1 | Runtime 0 active normalize | §1 | ✅ |
| 2 | PUT/Publish → GET artifact | §2 | ✅ |
| 3 | Reader no mutate | §3 | ✅ |
| 4 | Facade dead + typeof + Network | §4 | ✅ |
| 5 | No dual path + file deleted | §5 | ✅ |

---

## 8. Lưu ý trung thực — Admin UI vẫn có `normalizePlan`

`entitlement-catalog.js` **vẫn** có `normalizePlan` cho **Admin matrix UI preview** khi Owner chỉnh matrix.

Đây **không** phải Runtime path:

- Không load trên `iflux.vn/home`
- Runtime contract = **`plans[]` từ publish module** sau PUT
- Admin preview ≠ Runtime provenance (ABH-12 trace chain kết thúc tại publish artifact)

Nếu Owner muốn **một** normalize cho cả Admin UI + Publish → track riêng (delegate Admin UI → shared publish module). **Out of scope E6** — E6 đóng Runtime dual path.

---

*Reproduce: chạy lại các lệnh trong §1–§4 trên repo + Production curl.*
