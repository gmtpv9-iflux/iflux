# ABH-12 — Rule Provenance Gate (E6 · ABH exit)

**Status:** **LOCKED — bắt buộc trước E6 close và ABH track COMPLETE**  
**Ngày:** 2026-07-27  
**Owner ack traceability:** 2026-07-27  
**Trigger:** Owner review E5 — Runtime must **consume**, not **interpret** business rules  
**Blocks:** ABH-TD-E5-001 close · E6 exit · ABH track sign-off

---

## 0. Nguyên tắc

SoT Product:

```text
Permission / Layout / Template / Data  →  decide
Runtime                                 →  consume
```

Flow SoT:

```text
Template → Widget → Permission → Publish → Generated Runtime Artifact → Runtime đọc
```

Hai điều kiện bắt buộc:

1. **ONE Rule Provenance** — mọi câu hỏi “rule này sinh từ đâu?” trả lời **ONE place** — never “Admin và Runtime”.
2. **Provenance must be traceable** — Reviewer trace được **ngược** từ Runtime về đúng một SoT — không có bước “Runtime tự suy luận”.

---

## 1. ABH COMPLETE — năm điều kiện Owner ký

Architecture Boundary Hardening chỉ được ký **COMPLETE** khi **đồng thời** đúng cả năm:

| # | Điều kiện | Gate / phase |
|---|-----------|--------------|
| 1 | Không còn Admin module trên Runtime shell | E4/E5 Eliminate |
| 2 | Không còn compatibility layer (`WidgetLibraryCatalog` facade) | ABH-10 |
| 3 | Không còn second cache (`WIDGET_SPECS` / `_meta` duplicate) | ABH-TD-E4-001 |
| 4 | Chỉ còn **ONE Rule Provenance** entitlement | ABH-TD-E5-001 |
| 5 | Reviewer **trace được** mọi entitlement rule Runtime → Publish → Permission → Admin | ABH-12 (doc này) |

Thiếu **một** điều kiện → **không** ký ABH COMPLETE (dù E6 code refactor xong).

---

## 2. Rule inventory (bắt buộc điền trong E6-Rule-Provenance-Report)

| # | Rule / behavior | Câu hỏi provenance | Trace chain (bắt buộc) |
|---|-----------------|--------------------|-------------------------|
| R1 | Guest/free/premium/elite **page access** | Ai set `plan.pages` resolved? | Runtime JSON → … → Admin |
| R2 | **Block enabled** per tier (`hasBlock`) | Ai quyết định block on/off? | Runtime JSON → … → Admin |
| R3 | **Default blocks** khi thiếu override | Ai apply defaults? | **Không** Runtime fork |
| R4 | **Limits** (alerts, maxWidgets, …) | Ai set limits resolved? | |
| R5 | **Capabilities** (flowRt, candles, …) | Ai set capabilities resolved? | |
| R6 | **Tier matrix overrides** (Admin saved) | Nguồn publish? | Artifact → Publish → Matrix |
| R7 | Widget **permission scoped** (WGT-*) | Ai quyết định danh sách? | L4 index / published artifact |
| R8 | Static page blocks (BLK-FAQ-*, …) | Ai owns catalog? | |

**E6 FAIL** nếu:

- Bất kỳ row trả lời provenance = `Admin entitlement-catalog.js AND User Web plan-normalize-runtime.js`
- Trace chain có bước **Runtime tự suy luận** / client `defaultForTier` / client `resolveBlockEnabled`

### Ví dụ trace hợp lệ (R2)

```text
Premium user → hasBlock('BLK_PREMIUM_01') === true
    ↑ IfluxEntitlements reads plan.blocks from PlansRuntimeReader
    ↑ GET /api/plans/runtime → { tier: "premium", blocks: { BLK_PREMIUM_01: true, ... } }
    ↑ Plans Runtime Artifact (published)
    ↑ Permission Publish pipeline (normalize at publish)
    ↑ Admin Entitlement Matrix (Policy Owner)
```

**Không hợp lệ:** thêm bước `IfluxPlanNormalize.resolveBlockEnabled()` trên User Web.

---

## 3. Verification commands

```bash
# Runtime must NOT interpret (target state — ABH-TD-E5-001)
rg -n "function normalizePlan\(" User_Web/ --glob "*.js"
# → 0

rg -n "function resolveBlockEnabled\(" User_Web/ --glob "*.js"
# → 0

rg -n "function defaultBlocksForTier\(" User_Web/ --glob "*.js"
# → 0

# Provenance: payload already resolved (manual / curl)
curl -sS "https://iflux.vn/api/plans/runtime" | jq '.plans[0].blocks'
# → object with resolved boolean keys — no client merge required

# Shell boot — no normalize module (preferred)
rg "plan-normalize-runtime" User_Web/iflux-web-ui/runtime/shell-boot.js
# → 0 active load
```

**Lưu ý:** Grep “exactly 1 implementation repo-wide” là **proxy**, không phải acceptance. Acceptance = **ONE provenance** + **traceable chain**. Shared core có thể pass grep nhưng **fail** nếu Runtime vẫn execute rules without artifact.

---

## 4. Deliverable

**File bắt buộc:** `docs/Architecture-Boundary-Hardening/E6-Rule-Provenance-Report.md`

Template:

```markdown
| Rule ID | Rule | Single provenance | Trace chain (Runtime → … → Admin) | Evidence |
|---------|------|-------------------|-----------------------------------|----------|
| R1 | Page access defaults | Plans Runtime Artifact | GET JSON → Publish → Permission Matrix → Admin | curl + code cite |
| R2 | Block enabled | … | … | … |
```

Mỗi row phải có **Trace chain** đầy đủ — không chỉ tên file.

---

## 5. Relation to other gates

| Gate | Relation |
|------|----------|
| ABH-TD-E5-001 | Closes single provenance · solution priority Owner §3 |
| ABH-09 | Readers stay read-only |
| ABH-10 | Facade sunset |
| ABH-11 | Complexity metrics |
| **ABH-12** | **Rules have one origin + traceable** |

**E6 close checklist:**

- [ ] ABH-TD-E5-001 ✅ (ONE Rule Provenance)
- [ ] ABH-12 report ✅ (traceability)
- [ ] ABH-TD-E4-001 ✅ (no second cache)
- [ ] ABH-10 ✅ (no compatibility layer)
- [ ] §1 năm điều kiện COMPLETE ✅

---

*ABH track không “COMPLETE” nếu Rule Provenance Gate fail hoặc trace chain có Runtime interpreter.*
