# ABH-TD-E5-001 — Single Rule Provenance (BLOCK E6 close · BLOCK ABH track complete)

**Status:** **CLOSED — E6 2026-07-27**  
**Ngày mở:** 2026-07-27  
**Owner ack solution priority:** 2026-07-27  
**Owner verdict:** E5 = **PASS WITH ARCHITECTURAL CONDITION** — boundary đạt · ownership cuối chưa đạt  
**SoT:** Product Architecture V2 — Runtime **consume**, không **interpret** business rules  
**ECG:** CG-002 · CG-020 · ECG §12 Final Principle

---

## 0. Vấn đề (không phải “technical debt nhỏ”)

**Architecture Incomplete** — nợ **ownership**, không chỉ nợ code.

Hiện trạng sau E5:

```text
GET /api/plans/runtime          ← 1 source data (matrix overrides)
        │
        ├─ Admin EntitlementCatalog.normalizePlan()     ← interpreter #1
        └─ Runtime IfluxPlanNormalize.normalizePlan()   ← interpreter #2
```

Cùng diễn giải:

- `normalizePlan`
- `resolveBlockEnabled`
- `defaultForTier` / `default*ForTier`
- `defaultBlockState` (via `defaultBlocksForTier`, `applyPageBlockDefaults`)

→ **Dual logic** — vi phạm hướng SoT: Permission owns rules · Runtime consumes.

---

## 1. Goal (trạng thái cuối — không nói cách làm)

**Eliminate duplicated entitlement normalization rules.**

Sau khi đóng ticket:

> **There is exactly ONE provenance of entitlement rules.**

**Provenance ≠ implementation.** Ba hướng khác nhau có thể đạt cùng một provenance:

| Hướng | Provenance | Runtime có `normalizePlan()`? |
|-------|------------|-------------------------------|
| Generated Artifact | Admin Publish → artifact | **Không** |
| Server-side normalize | Backend publish/projection | **Không** |
| Shared pure core | `shared/plan-normalize-core.js` | **Có** (execute shared) — chỉ khi bắt buộc |

Runtime **MUST NOT** maintain an **independent interpreter** (fork riêng Admin).

Runtime **MUST NOT** **interpret** business rules — chỉ **consume** artifact/JSON đã resolve.

---

## 2. Acceptance (Owner — bắt buộc để đóng)

### 2.1 ONE Rule Provenance

Mọi entitlement rule (guest/free/premium/elite · page access · block enabled · default limits/capabilities) — câu trả lời **ONE place**:

| Rule class | Provenance hợp lệ (sau close) |
|------------|-------------------------------|
| Tier matrix overrides | Admin publish → Plans Runtime Artifact / `GET /api/plans/runtime` |
| Default tier pages/blocks/limits/capabilities | **Publish pipeline** hoặc **backend projection** — không Runtime fork |
| Block enabled resolution | Cùng provenance với plan artifact — không Runtime `resolveBlockEnabled` |
| Widget permission scope | L4 published index / artifact metadata |

**Forbidden answer:** “Admin entitlement-catalog.js **và** User Web plan-normalize-runtime.js”.

**Forbidden state:** Runtime tự suy luận default khi thiếu field trong payload.

### 2.2 Runtime MUST NOT interpret

User Web **cấm** local business-rule interpreter:

- `normalizePlan` / `resolveBlockEnabled`
- `defaultPagesForTier` / `defaultBlocksForTier` / `defaultLimitsForTier` / `defaultCapabilitiesForTier` / `defaultActionsForTier`

Target:

```text
PlansRuntimeReader.getPlan()  →  JSON đã normalize từ single provenance
IfluxEntitlements             →  consume plan.blocks / plan.pages / hasBlock lookup
```

Verification:

```bash
# Runtime không define business rules (target)
rg "function normalizePlan\(" User_Web/ --glob "*.js"
# → 0

rg "function resolveBlockEnabled\(" User_Web/ --glob "*.js"
# → 0

rg "function defaultBlocksForTier\(" User_Web/ --glob "*.js"
# → 0
```

File `plan-normalize-runtime.js` → **deleted** (preferred) hoặc Owner review nếu còn delegate tạm (shared core only — see §3).

### 2.3 Traceability (ABH-12)

Mọi rule phải trace **ngược** từ Runtime về một SoT — không có bước “Runtime tự suy luận”.

Ví dụ:

```text
Runtime JSON (premium → BLK_X enabled)
    ↑ GET /api/plans/runtime (artifact)
    ↑ Publish / projection
    ↑ Permission Matrix (Admin)
```

Deliverable: [`E6-Rule-Provenance-Report.md`](E6-Rule-Provenance-Report.md) — cột **Trace chain**.

### 2.4 Evidence package

- [ ] [`E6-Rule-Provenance-Report.md`](E6-Rule-Provenance-Report.md) — rule → single provenance + trace chain
- [ ] `curl GET /api/plans/runtime` — payload đã chứa resolved `blocks`/`pages` per tier (không cần client normalize)
- [ ] Runtime boot: **0** download `plan-normalize-runtime.js` (hoặc deleted from shell-boot)
- [ ] Semantic diff: 0 duplicated function bodies Admin ↔ Runtime

---

## 3. Solution priority (Owner — E6 implement)

**Acceptance không chọn solution** — chỉ yêu cầu **ONE Rule Provenance**. Owner đã xếp hạng ưu tiên:

| Priority | Hướng | Đánh giá | Ghi chú |
|----------|-------|----------|---------|
| **1 — Khuyến nghị** | **Generated Artifact** | ⭐⭐⭐⭐⭐ | Gần SoT nhất: Template → Widget → Permission → **Publish** → Artifact → Runtime đọc |
| **2** | **Server-side normalize** (publish-time / stored projection) | ⭐⭐⭐⭐ | Runtime GET JSON đã normalize; governance lúc publish, không lúc read |
| **3 — Chỉ khi bắt buộc** | **Shared pure core** | ⭐⭐ | Giải duplication · Runtime vẫn execute business rule — chưa đẹp bằng artifact |

### 3.1 Generated Artifact (preferred)

```text
Admin Policy
    │
    ▼
Publish (Permission owns normalize)
    │
    ▼
Plans Runtime Artifact  (immutable contract)
    │
    ▼
GET /api/plans/runtime
    │
    ▼
Runtime consume JSON only
```

Runtime **không biết** `defaultForTier()` / `resolveBlockEnabled()` tồn tại.

Precedent SoT: Widget Artifact · Placement Index (Gate 2 ABH).

### 3.2 Server-side normalize

```text
Backend normalize (publish-time hoặc projection builder)
    │
    ▼
GET /api/plans/runtime → JSON resolved
    │
    ▼
Runtime render / gate
```

**Ưu tiên publish-time** stored artifact — tránh normalize mỗi request (governance at Publish, không at Runtime read).

### 3.3 Shared pure core (fallback only)

```text
shared/plan-normalize-core.js
    ├── Admin import
    └── Runtime import   ← vẫn execute rule trên client
```

Chỉ dùng nếu Generated Artifact / server projection **không khả thi trong E6 window**. Phải ghi **why cannot artifact** trong Impact Analysis (CG-012).

---

## 4. Blocks

| Gate | Blocked until ABH-TD-E5-001 closed |
|------|-------------------------------------|
| **E6 phase close** | ✅ |
| **Architecture Boundary Hardening COMPLETE** | ✅ |
| ECG full §12 “one SoT one path” sign-off | ✅ |

E5 remains: **PASS WITH ARCHITECTURAL CONDITION** — không revert.

---

## 5. Baseline (E5 — before close)

| Function | Admin `entitlement-catalog.js` | Runtime `plan-normalize-runtime.js` |
|----------|----------------------------------|-------------------------------------|
| `normalizePlan` | ✅ | ✅ duplicate |
| `resolveBlockEnabled` | ✅ | ✅ duplicate |
| `default*ForTier` (×5) | ✅ | ✅ duplicate |
| `applyPageBlockDefaults` | ✅ | ✅ duplicate |

**22** shared function names — see [`E5-Semantic-Ownership-Audit.md`](E5-Semantic-Ownership-Audit.md).

---

*Ticket này là điều kiện kiến trúc bắt buộc — không optional cleanup.*
