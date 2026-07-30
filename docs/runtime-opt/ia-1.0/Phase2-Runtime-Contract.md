# Task 6 — Phase 2 — Runtime Contract

**Ngày:** 2026-07-24  
**SoT Governance:** PG-1.0 (§PG-001 + §PG-007 + **§PG-008 Contract Rule**)  
**Trạng thái:** **PASS (Runtime Contract)** — Owner 2026-07-24  
**Umbrella:** [`docs/SoT — Interaction Feature (IA-1.0).md`](../SoT%20—%20Interaction%20Feature%20(IA-1.0).md)  
**Baseline Architecture:** Phase 1 PASS — SoT con **LOCKED**

**Quy tắc ID:** mọi luật Runtime dùng `RC-<GROUP>-<nn>` (ví dụ `RC-IO-03`). Reviewer nói “vi phạm RC-IO-03” thay vì “đoạn Mount”.

---

## 1. Overview

### Task Objective

Chuẩn hóa toàn bộ **Interaction Feature** theo SoT: một Feature · một Component Catalog · nhiều Presentation Host · không hydrate Summary · tuân thủ PS-1.0 · sẵn sàng Runtime Implementation.

### Task Roadmap

| Phase | Objective | Status |
| --- | --- | --- |
| Phase 0 | Audit Baseline | **DONE** |
| Phase 1 | Khóa SoT (Architecture) | **PASS** |
| **Phase 2** | Runtime Contract hóa SoT | **PASS** |
| Phase 3 | Implementation (bám RC-*) | **OPEN** (sau PASS) |
| Phase 4 | Migration | Chưa |
| Phase 5 | Loading (+ Q1 KPI) | Chưa |
| Phase 6 | Exit | Chưa |

### Current Phase

**Phase 2 — PASS.** Artifact Contract khóa; bổ sung ID chuẩn · RC-IU presentation-agnostic · RC-API Refresh Contract theo Owner review.

### Phase Contribution

```text
Task 6
  → Phase 0 Audit
  → Phase 1 SoT LOCKED
  → Phase 2 Runtime Contract PASS
  → Phase 3 Implementation (bám RC-* only)
```

```text
SoT → Contract → Implementation
```

Đổi kiến trúc → sửa SoT → regenerate Contract → mới Impl tiếp. **Cấm** Impl tự sửa Contract / tự sinh rule.

---

## 2. Objective

> **Architecture đã khóa tại Phase 1. Phase 2 chỉ chuyển các quyết định SoT thành Runtime Contract; mọi thay đổi kiến trúc đều Out of Scope.**

---

## 3. Scope

| # | Scope | SoT | Contract group |
| --- | --- | --- | --- |
| S1 | Host / Resolver / Mount | IO-001 | RC-IO-* |
| S2 | Summary ≠ Interactive | IA-001 · IA-002 | RC-IA-* |
| S3 | Permission Gate | IP-001 | RC-IP-* |
| S4 | API + Store + Refresh | IA-003 | RC-API-* |
| S5 | Component Catalog | IU-001 | RC-IU-* |
| S6 | Loading | IR-001 | RC-IR-* |
| S7 | Persistence Adapter | PS-1.0 | RC-PS-* |

---

## 4. Evidence

Phase 1 SoT LOCKED · Phase 0 Inventory (cấm tái diễn) · Owner PASS Phase 2 + 3 điểm hoàn thiện (ID · presentation-agnostic · Refresh).

---

## 5. Deliverables — Runtime Contracts (`RC-*-nn`)

### 5.1 Index

| Group | SoT | Rules |
| --- | --- | --- |
| **RC-IO** | IO-001 | RC-IO-01 … RC-IO-08 |
| **RC-IA** | IA-001 · IA-002 | RC-IA-01 … RC-IA-05 |
| **RC-IP** | IP-001 | RC-IP-01 … RC-IP-03 |
| **RC-API** | IA-003 | RC-API-01 … RC-API-07 |
| **RC-IU** | IU-001 | RC-IU-01 … RC-IU-05 |
| **RC-IR** | IR-001 | RC-IR-01 … RC-IR-05 |
| **RC-PS** | PS-1.0 | RC-PS-01 … RC-PS-04 |

---

### 5.2 RC-IO — Host / Resolver / Mount  
**SoT:** IO-001

| ID | Contract |
| --- | --- |
| **RC-IO-01** | Neo Resolver = `IfluxInteractionPresentationResolver` · path `…/interaction/presentation-resolver.js` |
| **RC-IO-02** | Neo Host = `IfluxInteractionHost` · path `…/interaction/interaction-host.js` |
| **RC-IO-03** | `mountInteraction` chỉ export từ Host — **không** từ Widget / Page boot / Composer |
| **RC-IO-04** | `resolve({ pageDefinition, viewport, productRules? }) → presentation` — chỉ Layout/Host path gọi |
| **RC-IO-05** | Component **CẤM** `resolve()` và **CẤM** `matchMedia` để chọn host |
| **RC-IO-06** | Caller table: Host YES · Page bootstrap NO · Widget NO · Composer NO · Feed NO |
| **RC-IO-07** | Host nhận `mode` từ Page Definition; `presentation` từ Resolver (một lần ở Layout/Host) |
| **RC-IO-08** | Host duties: summary → Summary surface only; interactive → Panel+Catalog+IR load; unmount sạch (không Store dính trái IR) |

```text
resolve API (RC-IO-04):
IfluxInteractionPresentationResolver.resolve({
  pageDefinition,
  viewport,       // Layout cung cấp — không từ Component
  productRules?   // default = IU-001 §7.1
}) → 'inline' | 'sidebar' | 'bottom-bar' | 'bottom-sheet' | 'page'

mountInteraction (RC-IO-03):
mountInteraction({
  target: { type, id },
  mode: 'summary' | 'interactive',
  presentation,   // đã resolve
  permissionContext?
}) → { unmount() }
```

---

### 5.3 RC-IA — Summary ≠ Interactive Runtime  
**SoT:** IA-001 · IA-002

| ID | Contract |
| --- | --- |
| **RC-IA-01** | `mode: 'summary'` ⇒ **0** Store init · **0** Interactive bundle · **0** thread hydrate |
| **RC-IA-02** | `mode: 'interactive'` ⇒ được Store + Catalog Interactive + thread API **scoped** `target` |
| **RC-IA-03** | Action semantics (`like`, `comment`…) **không** đổi theo `presentation` |
| **RC-IA-04** | Counter authoritative **chỉ** Summary projection — cấm UI / `CommunityStore` `stats++` làm SoT |
| **RC-IA-05** | Domain Event (nếu có) sau API success; consumer không subscribe Store nội bộ lấy thread |

```text
Summary:  Host(summary) → SummaryBar → projection / Summary API
Interactive: Host → RC-IP gate → Panel → Action → API → Store → RC-API Refresh
```

---

### 5.4 RC-IP — Permission Runtime Gate  
**SoT:** IP-001

| ID | Contract |
| --- | --- |
| **RC-IP-01** | Trước mọi mutating Action / Composer submit: `Permission.resolve(...)` — Runtime **không** tự quyết policy |
| **RC-IP-02** | `result !== Allow` → UI state LoginRequired \| NoPermission \| ReadOnly — **KHÔNG** gọi API |
| **RC-IP-03** | Map matrix IP LOCKED: Guest `share_url` Allow; Guest mutating / `share_bump` LoginRequired — Contract **không** sửa ô matrix |

---

### 5.5 RC-API — API + Store + Refresh  
**SoT:** IA-003

| ID | Contract |
| --- | --- |
| **RC-API-01** | Summary API = **counts-only** — **CẤM** `comments:[]` trong Summary payload |
| **RC-API-02** | Thread API (`GET/POST …/comments` + reply) = Interactive only |
| **RC-API-03** | Mutation (like / bookmark / share_bump / reaction / comment) qua API — không mem SoT |
| **RC-API-04** | `InteractionStore` — UI không gọi LS/API trực tiếp |
| **RC-API-05** | Persistence chỉ qua Adapter (**RC-PS**) |
| **RC-API-06** | Analytics interest/relevance ≠ Like / Counter Owner |
| **RC-API-07** | **Refresh Contract (KHÓA):** |

```text
RC-API-07 — Refresh Contract

Mutation Success
        ↓
Projection Refresh   (Counter Owner = Summary projection)
        ↓
Summary Refresh       (counts surfaces / badges đọc lại projection)
        ↓
KHÔNG UI++
KHÔNG CommunityStore.stats++
KHÔNG client tự authoritative increment
```

OpenAPI chi tiết path = Phase 3 Impl — không đổi shape trên.

| ID | Contract | Neo SoT |
| --- | --- | --- |
| **RC-API-08** | Thread keyed `(entityType, entityId)`; type ∈ **IA-001 §6b registry ĐÓNG** (+ alias `article`→`post`, `ecosystem`→`family`). Type mới = Update SoT + RC | Q-4.4-A |
| **RC-API-09** | Canonical path: `/api/interaction/v1/threads/{type}/{id}/comments` (+ Summary `/api/interaction/v1/summary?type=&id=`). Alias post `/community/articles|posts/.../comments` **bắt buộc** tới cutover | Q-4.4-B · IA-003 §3b |
| **RC-API-10** | Comment payload Interaction-only: `body`, `image?`; `parentId` **optional** (không DoD 4.4). **CẤM** business metadata trong payload | Q-4.4-B |
| **RC-API-11** | Summary v1 counts: `likes`, `comments`, `shares` (+ `favorites`/`views` nếu target hỗ trợ). **Không** `participantCount` DoD 4.4. Vẫn **RC-API-01** | Q-4.4-C |
| **RC-API-12** | Cutover LS: từ Impl 4.4 **WRITE chỉ API**; dual-**read** API→LS; migrate one-shot; **purge** `iflux_stock_comments_v6` sau Phase 4 Exit PASS | Q-4.4-D · RC-PS-04 |

**Owner PASS delta RC-API-08…12:** 2026-07-24 (Q-4.4).

---

### 5.6 RC-IU — Component Runtime Contract  
**SoT:** IU-001

| ID | Contract |
| --- | --- |
| **RC-IU-01** | **Runtime Component MUST be presentation-agnostic.** Component **không biết** / **không nhánh** `sidebar` \| `sheet` \| `page` \| `inline`. Chỉ render. Presentation = việc của Host. |
| **RC-IU-02** | **CẤM** trong Component: `if (presentation === …)`, `matchMedia`, `resolve()` |
| **RC-IU-03** | Một Catalog — không fork Mobile/Desktop Component |
| **RC-IU-04** | Catalog tối thiểu: SummaryBar · ActionBar · CommentList · CommentComposer · ReactionControl (optional) — duties: emit Action / đọc projection; không fetch/LS |
| **RC-IU-05** | Icon/semantics: phân biệt `like` vs Watchlist Follow Heart |

Host set attribute/CSS theo `presentation`; Component chỉ consume token/class Host gắn — không đọc `presentation` để đổi logic nghiệp vụ.

---

### 5.7 RC-IR — Loading Contract  
**SoT:** IR-001

| ID | Contract |
| --- | --- |
| **RC-IR-01** | Summary = **0** Interactive bundle |
| **RC-IR-02** | Summary = **0** Store init |
| **RC-IR-03** | Summary = **0** thread/feed bulk hydrate |
| **RC-IR-04** | Interactive = load on Host mount; thread hydrate **scoped** `target` |
| **RC-IR-05** | CẤM tái diễn Phase 0: `comments ∈ MARKET_PLATFORM_PAGES` market seed thừa · `hydrateFromApi(100)` mù · collateral account/messages kéo stock-comments khi không có surface |

Q1 KPI → Phase 5 (không khóa tại đây).

---

### 5.8 RC-PS — Persistence Adapter Contract  
**SoT:** PS-1.0

| ID | Contract |
| --- | --- |
| **RC-PS-01** | `UI → Store → PersistenceAdapter → memory \| LS(cache/draft/queue) \| session` |
| **RC-PS-02** | Business SoT = API; LS không authoritative Comment/Like/Bookmark/share counter |
| **RC-PS-03** | Summary cache TTL **30s** (PS-007 LOCKED) |
| **RC-PS-04** | CẤM ghi mới authoritative `iflux_stock_comments_v6` — migrate Phase 4 |

---

## 6. Gap

| Gap | Phase |
| --- | --- |
| OpenAPI + Store skeleton | Phase 3 |
| Host/Resolver modules file | Phase 3+ |
| DS sheet/ActionBar atoms | Impl + DS |
| AS-IS bar→page / matchMedia | Impl tuân RC-IO / RC-IU — không hợp thức hóa trong Contract |
| KPI Q1 | Phase 5 |

---

## 7. Out of Scope

- Mọi redesign kiến trúc (Ownership, Permission, §7.1, Domain, PS)  
- Impl tự sửa Contract / tự sinh rule (**PG-008**)  
- Migrate LS / đo KPI trong Phase 2  

Nếu SoT thiếu/sai: **STOP → Update SoT → Regenerate Contract → mới Impl**.

---

## 8. Exit

| Tiêu chí | Status |
| --- | --- |
| Architecture-locked statement | Đạt |
| Contract ID chuẩn `RC-*-nn` | Đạt |
| RC-IU presentation-agnostic | Đạt (**RC-IU-01**) |
| RC-API Refresh Contract | Đạt (**RC-API-07**) |
| Traceability SoT → RC | Đạt |
| Owner PASS Phase 2 | **PASS** 2026-07-24 |

- [x] Runtime Contract pack  
- [x] Owner PASS  
- [x] Mở Phase 3 với điều kiện Impl-only-RC  

---

## 9. Open Items

1. Phase 3 Impl theo RC-* (xem `Phase3-Implementation.md`)  
2. Q1 KPI — Phase 5  
3. Mọi lệch Contract khi Impl → truy SoT trước (PG-008)  

---

## 10. Phase Verdict

**Phase 2: PASS (Runtime Contract).**

Chuỗi Task 6 đã khép: Audit → SoT → Contract → (mở) Implementation.  

**Next:** Phase 3 — Impl **chỉ** theo RC-*; không tự sửa Contract; thiếu SoT thì quay lại SoT trước.
