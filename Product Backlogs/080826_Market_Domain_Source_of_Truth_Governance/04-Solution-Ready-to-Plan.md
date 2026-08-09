# 04 — Solution — Ready to Plan

## Market Domain — Source of Truth & Data Governance

| | |
|--|--|
| **Task ID** | `080826_Market_Domain_Source_of_Truth_Governance` |
| **Document** | `04 — Solution — Ready to Plan` |
| **Status** | `APPROVED FOR BUILD` (Owner 2026-08-08) — Architecture Decision Complete |
| **Date** | 2026-08-08 |
| **Predecessors** | `01` · `02` · `02A` · `02B` · `03` |
| **Purpose** | Architecture Decision Complete; Implementation Detail Open — Cursor tự WP + build |
| **Implementation Plan** | **Không** bắt buộc file Plan riêng — Cursor tự lập WP nội bộ từ `01→04` |
| **Implementation** | ✅ AUTHORIZED — không đổi Governance/SoT/Architecture Decision; thiếu quyết định kiến trúc → STOP báo Owner |

> [!IMPORTANT]
> **Architecture Decision Complete, Implementation Detail Open.**
>
> Solution **khóa** quyết định kiến trúc / nghiệp vụ.  
> Solution **không** khóa DDL chi tiết, tên bảng vật lý (trừ khi nêu rõ), endpoint path cụ thể, index, UI pixel.
>
> Align **OD-08 / SoT §2.5**: Trusted Auto-Apply **New / Empty**; **Identical = No-op**; **Conflict = Admin Review**.
>
> Khi lập WP/build: đọc `01→04`. **Không** tự thay đổi Governance/SoT/Architecture Decision. Nếu phát hiện quyết định kiến trúc chưa đủ → **STOP** báo Owner.

---

# 0. Solution Technical Decision Matrix (LOCKED)

| Decision Area | Solution **KHÓA** (Architecture) | Implementation **MỞ** (Plan/Build) |
| ------------- | -------------------------------- | ---------------------------------- |
| Market Master | PostgreSQL là SoT; entities `stocks` / `sectors` / `ecosystems` | Schema drift fix, indexes, migrations |
| Cap Group | **Master attribute** trên Stock; enum business `Large` / `Medium` / `Small`; **không** engine; **≠** lot threshold; Admin select + Trusted intake | Tên cột vật lý, type, check constraint, UI binding |
| Cap Group normalize | Chỉ 3 nhóm; mọi classification nhỏ hơn Small (vd. Micro) **map → Small** | Mapping table chi tiết từ từng provider payload |
| Market Cap | Master attribute; **field-level** Trusted Source authority; conflict → Review | Column/type/precision, API field name |
| Provider Registry | Multi-provider; **centralized MDM** capability; **không** trang “Quản lý DNSE” | Reuse/extend `data_sources` **ưu tiên**; bảng phụ nếu Impact Analysis bắt buộc |
| Trust | **Field-level** (Entity+Field → Trusted Source); Active ≠ Trusted mọi field | Config schema, seed defaults, Admin screens |
| Import | Candidate ≠ Master; Fetch→Normalize→Validate→Compare→Apply/Conflict | Staging storage, job runner, batching |
| New trusted data | **Auto Create** | Upsert SQL, defaults cho iFlux-owned null |
| Existing = empty | **Auto Fill** | NULL/empty definition |
| Existing = same | **No Action** | Skip write / metrics |
| Existing ≠ incoming | **Conflict → Admin Review** (Apply/Reject); **không** silent Override | Conflict store schema, API, UI |
| Missing external | **No Delete** / no clear iFlux-owned | Soft-flag optional later — không trong scope bắt buộc |
| Conflict Management | Phải có Change Set/Conflict **truy nguyên** với tối thiểu: entity, field, current, incoming, source, detected time, review state, Admin decision | Table name, indexes, retention |
| Public Master | **Internal API → PG**; Public **không** đọc provider/mock/registry làm Master authority | Endpoint paths, pagination, cache headers |
| Runtime data | Tách khỏi Master (Price/OHLC…) | Adapter/proxy timing |
| DNSE | Provider **không** SoT; flow **DNSE → Candidate → Compare → Apply/Conflict** | Adapter impl, auth, rate limit |
| VNDirect / SSI / FiinPro | Cùng model multi-provider; registry + adapters khi bật | Wire order theo WP |
| RBAC | MDM là control plane → **phải** có Admin permission boundary | Permission key names, matrix rows |
| `post_count` | **Derived**; **không** được làm list Admin/Public chậm bất thường | Query/index/aggregate strategy — **không** khóa cache/MV ở Solution |
| Sector/Eco membership | Chỉ `stocks.sector_id` / `stocks.ecosystem_id`; Sector→Add Stocks bắt buộc | UI drawer, sync API |
| Lifecycle | `stocks.status` canonical; `is_active` non-authoritative → reconcile/deprecate | Migration SQL, backfill SSI |
| Divisor | **Không** còn Market Master SoT → remove path | Drop order after dependency sweep |
| Legacy | `market_admin_stocks` / Mock / Registry **không** còn production Master authority | Consumer migrate rồi deprecate |
| Redis | Không phải Master SoT | Không dùng Redis che query lỗi nếu chưa evidence |

---

# 0.1 — Architecture locks (nhóm “khóa ngay”)

### A. Cap Group / Market Cap (KHÓA cấu trúc Master)

* Stock Master **phải** lưu được **Capitalization Group** và **Market Cap** (khi có) như attributes của Master — không chỉ UI phantom / localStorage.  
* Cap Group business values: `Large` | `Medium` | `Small` only.  
* Normalize inbound “Micro” / nhỏ hơn Small → **Small**.  
* Không Classification Engine. Không dùng `lot_threshold` / `market_lot_config` làm Cap Group.  
* **Implementation mở:** tên cột (`cap_group` vs khác), NUMERIC precision cho market_cap.

### B. Source Registry (KHÓA nguyên tắc)

* Một capability MDM thống nhất cho mọi provider.  
* **Ưu tiên reuse/extend** registry hiện có (`data_sources`) thay vì silo DNSE.  
* **Implementation mở:** có cần bảng satellite `*_field_authority` hay JSON trên `data_sources` — sau audit schema + Impact Analysis.

### C. Conflict Store (KHÓA mô hình nghiệp vụ)

Mọi conflict Trusted Incoming vs Current Master phải tạo Change Set/Conflict **truy nguyên**, tối thiểu:

```text
entity · field · current value · incoming value
· source · detected time · review state · Admin decision
```

Không silent overwrite.  
**Implementation mở:** tên bảng/column (có thể bảng mới hoặc reuse cấu trúc gần — Impact Analysis).

### D. Public Market API (KHÓA boundary)

```text
Public FE Master Data → iFlux Internal API → PostgreSQL
```

Cấm Master từ DNSE/VNDirect/Mock/Registry trực tiếp.  
**Implementation mở:** path `/api/market/...` vs reuse khác.

### E. DNSE Adapter (KHÓA flow)

```text
DNSE → Candidate → Compare → Auto Apply | Conflict → Master
```

Adapter không `UPDATE stocks` trực tiếp.  
**Implementation mở:** client/module files, polling.

### F. RBAC MDM (KHÓA requirement)

MDM (sources, authority, import, conflicts) nằm trong Admin RBAC hiện hữu.  
**Implementation mở:** key strings (`market.data_sources.*` vs extend catalog).

### G. post_count (KHÔNG khóa kỹ thuật)

Derived; Implementation Plan/build phải bảo đảm không gây degradation. Không bắt buộc cache/MV/Redis trong Solution.

---

# 1. Solution Objective

Xây **Market Data Governance System**:

```text
External Providers
        ↓
   Source Registry + Field Authority
        ↓
     Import (Trusted for field)
        ↓
 Normalize / Validate
        ↓
 Compare với Market Master
        ↓
 ┌────────────────┬──────────────────┬─────────────────┐
 │ New entity /   │ Identical        │ Conflict        │
 │ Empty field    │ (same value)     │ (≠ current)     │
 │                │                  │                 │
 │ AUTO APPLY     │ NO ACTION        │ ADMIN REVIEW    │
 │ Create / Fill  │                  │ Apply / Reject  │
 └────────────────┴──────────────────┴─────────────────┘
                       ↓
               Market Master PostgreSQL
                       ↓
                Internal API
                       ↓
            Admin / Public Frontend
```

Mục tiêu:

1. PostgreSQL Market Master = SoT.  
2. External provider = candidate input only.  
3. Không kiến trúc DNSE-only.  
4. Admin quản trị provider + field authority (Control Plane).  
5. Không bắt Admin duyệt từng mã mới (hàng nghìn mã).  
6. Chỉ **conflict** mới cần Admin quyết định Override.  
7. Không silent Override giá trị Master đang tồn tại khi khác.  
8. Relationship chỉ `stocks.sector_id` / `stocks.ecosystem_id`.  
9. Frontend không lấy Master Data trực tiếp từ external/mock/registry.  
10. Đủ để Cursor tự lập Implementation Plan sau APPROVE.

---

# 2. Solution Architecture

## 2.1 — Logical Architecture

```text
                    ┌───────────────────────┐
                    │   External Providers  │
                    │ DNSE · VNDirect       │
                    │ SSI · FiinPro · …     │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │ Source Registry       │
                    │ + Field Authority     │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │ Provider Adapters     │
                    │ Fetch / Normalize     │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │ Import + Comparison   │
                    │ New · Empty · Same    │
                    │ Conflict · Missing    │
                    └──────┬─────────┬──────┘
                 Auto path │         │ Conflict path
                           ▼         ▼
                  ┌────────────┐  ┌──────────────┐
                  │ Auto Apply │  │ Admin Review │
                  └─────┬──────┘  └──────┬───────┘
                        └───────┬────────┘
                                ▼
                    ┌───────────────────────┐
                    │ Market Master (PG)    │
                    │ stocks / sectors /    │
                    │ ecosystems            │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │ Internal API          │
                    └─────┬───────────┬─────┘
                          ▼           ▼
                       Admin       Public FE
```

---

# 3. Core Technical Design

## 3.1 — Authoritative Tables

| Entity | Table | Authority |
|--------|-------|-----------|
| Stock | `stocks` | Authoritative |
| Sector | `sectors` | Authoritative |
| Ecosystem | `ecosystems` | Authoritative |
| Stock → Sector | `stocks.sector_id` | Relationship SoT |
| Stock → Ecosystem | `stocks.ecosystem_id` | Relationship SoT |

**Không tạo** authoritative song song: `sector_stocks`, `ecosystem_stocks`, `stock_registry`, revive `market_admin_stocks` as SoT.

Legacy chỉ giữ cho migration/compatibility đến khi consumer migrate xong.

---

# 4. Market Master Data Model

## 4.1 — Stock

| Group | Examples | Authority |
|-------|----------|-----------|
| Identity | ticker, name/company | Field-level Trusted |
| Exchange | exchange | Field-level Trusted |
| Sector | `sector_id` | **iFlux-owned** |
| Ecosystem | `ecosystem_id` | **iFlux-owned** |
| Market Cap | market_cap (column/storage per Plan audit) | Field-level Trusted |
| Cap Group | Large / Medium / Small | Field-level Trusted **và/hoặc** Admin |
| Lifecycle | `status` | **iFlux-owned** |
| Description | description | **iFlux-owned** |
| Lot threshold | `lot_threshold` | iFlux lot config — **≠ Cap Group** |
| Runtime | Price / OHLC | Runtime Market Data (không Master SoT) |

Canonical lifecycle: **`stocks.status`**.  
`stocks.is_active` = legacy non-authoritative → reconcile/deprecate (Plan).

Exact physical column cho Cap Group / Market Cap: Plan phải audit schema hiện tại rồi chọn **reuse/add** — không invent ngoài governance.

---

# 5. Capitalization Group (**LOCKED**)

```text
Capitalization Group  ≠  Lot / Trade-Value Threshold
```

Cap Group = **Master attribute** (persist trên Stock Master):

```text
Large | Medium | Small
```

**Normalize (LOCKED):** mọi classification nhỏ hơn Small từ provider (vd. Micro) → map **Small**. Không tạo nhóm thứ 4 trên iFlux.

* Admin select trên Stocks Create/Edit.  
* Trusted source → Apply rules §11.  
* **Không** Classification Engine.  
* **Không** derive từ `lot_threshold` / `market_lot_config`.  
* Implementation mở: tên cột / CHECK constraint.

---

# 6. Lot Threshold (riêng)

Giữ:

```text
stocks.lot_threshold
market_lot_config
```

Cho large-lot / trade-value logic.

UI: trang hiện tên **“Ngưỡng lô”** đang quản lý **lot thresholds** (Audit) — **giữ đúng concept lot**, không đổi nhãn thành “Nhóm vốn hóa”.  
**Nhóm vốn hóa** hiển thị trên Stocks (và field Master), không trên màn lot-threshold.

Overrides lot đang kẹt localStorage → migrate về Master/API trong Plan (GAP Audit).

---

# 7. Market Data Management (Control Plane)

**Không** trang “Quản lý DNSE”.

Capability:

```text
Market Data Management
```

Route đề xuất (khớp convention Admin đã có — Plan verify nav registry):

```text
/admin/thi-truong/data-sources
```

### 7.0 — Ba lớp UI/behavior (BR-11 LOCK)

| Lớp | Vai trò | Admin làm gì |
|-----|---------|--------------|
| **A. Source Registry** | Nguồn có thể kết nối | Xem status / health / history; **không** chọn lúc Import |
| **B. Field Authority Matrix** | Entity×Field → Current Source + Trust | **Cấu hình** (đổi Source / Trust) |
| **C. Import / Sync** | Execution command | **Một nút** — không form chọn Source |

**CẤM UX:** dropdown “Chọn nguồn” + textarea payload trên card Import như bước bắt buộc mỗi lần sync.  
**Cho phép:** staging/upload buffer gắn với Source trong Registry/Detail (cấu hình sẵn) nếu adapter cần payload (CSV) — vẫn **không** chọn Source lúc bấm Import.

### 7.1 — Source Registry

Providers: DNSE · VNDirect · SSI · FiinPro · Manual CSV · Internal Upload · Future — không hardcode count.

| Attribute | Purpose |
|-----------|---------|
| Provider | Tên |
| Status | Active / Inactive / Disabled |
| Availability | Health |
| Supported Data | Capabilities |
| Last Import / Last Success | Ops |
| Import Status | Running / Success / Failed |
| Import History | Trace |

### 7.2 — Field Authority Matrix (configuration)

Một hàng = **Entity × Field** (không phải Source × Field multi-trust lẫn lộn lúc Import).

| Entity | Field | Current Source | Trust | Source Status | Current Master Value | Diff | Conflict |
|--------|-------|----------------|-------|---------------|----------------------|------|----------|
| Stock | name | DNSE | Trusted | … | … | — | No |
| Stock | exchange | VNDirect | Trusted | … | … | — | No |
| Stock | market_cap | DNSE | Trusted | … | … | … | … |
| Stock | sector | iFlux | Authoritative | Protected | … | — | No |

Admin **Edit Current Source** (dropdown từ Registry, trừ iFlux-owned) + Trust tại đây.

### 7.3 — Import / Sync Operation (execution)

```text
[ IMPORT / SYNC MARKET DATA ]
 → đọc Field Authority (Entity×Field → Source)
 → group fields theo Source
 → gọi adapter từng Source (chỉ field thuộc Source đó)
 → Compare Master → OD-08 → một Import batch / Change Set / Conflicts / Audit
 → trả summary: Sources used ✓/— · New/Fill/Unchanged/Missing/Conflicts
```

Admin sau đó chỉ vào **Change Set / Conflict Review**.

---

# 8. Field-Level Authority

Không: `DNSE = Trusted` toàn provider.

Có: `Entity + Field + Current Source + Trust` (động, cấu hình được) — **một Current Source active mỗi field**.

Ví dụ minh họa:

| Entity | Field | Current Source |
|--------|-------|----------------|
| Stock | name | DNSE |
| Stock | exchange | VNDirect |
| Stock | market_cap | DNSE |
| Stock | capitalization_group | DNSE |
| Stock | sector | iFlux |
| Stock | ecosystem | iFlux |
| Stock | status | iFlux |

Không hardcode `if (provider === 'DNSE')` để quyết authority.  
Import **không** hỏi lại Source — resolve từ bảng này.

---

# 9. iFlux-Owned Fields

Mặc định iFlux-owned (external **không** Auto-Override khi conflict; Not Trusted cho external):

```text
sector_id
ecosystem_id
status
description
```

(+ field Owner bổ sung sau nếu cần — không tự mở rộng Plan).

Admin sửa qua Stocks / Sectors / Ecosystems — converge Master.

Nếu external gửi giá trị cho iFlux-owned: **không** Auto-Apply override; có thể log/detect nhưng **không** silent write (SoT). Plan có thể đưa vào Conflict chỉ khi Owner/SoT cho phép “reviewable”; mặc định: ignore mutation path cho Not Trusted fields.

---

# 10. Import Architecture

```text
Field Authority Config
 → Resolve Sources
 → Fetch (per Source adapter) → Normalize → Validate
 → Compare (chỉ field gán Source đó) → Auto Apply | Conflict Review
```

Cấm: `Provider → Direct overwrite PostgreSQL`.  
Cấm: Import UI bắt chọn Source mỗi lần chạy.

Adapter → normalized candidate → Import/Comparison → Market Master Service  
(candidate field chỉ apply khi Source = Current Source của field trong config).

---

# 11. Import Processing Rules (OD-08)

## 11.1 — New Stock

Trusted + valid + ticker chưa có → **AUTO CREATE**. Không hỏi Admin.

## 11.2 — Fill empty

Stock tồn tại, field Master trống/null, field Trusted cho provider → **AUTO FILL**.

## 11.3 — Identical

`Current == Incoming` → **NO ACTION** (không Conflict Record bắt buộc).

## 11.4 — Conflict

`Current` non-empty **≠** Incoming, field Trusted → **CONFLICT** → Admin Apply / Reject.  
**Không** overwrite ngay.

## 11.5 — Untrusted / Disabled

Không Auto-Apply; không tạo conflict authority để ghi Master.

## 11.6 — Missing

Không DELETE entity; không CLEAR field iFlux-owned / Master chỉ vì missing trên source.

---

# 12–13. Conflict UX & State

Admin xem tập trung:

| Field | Current | Incoming | Source | Action |
|-------|---------|----------|--------|--------|
| … | … | … | … | Apply / Reject |

Conflict fields tối thiểu: Stock, Field, Current, Incoming, Provider, Import ID, Detected At, Status.

States: `pending` | `applied` | `rejected`.

Reject một change **không** untrust toàn provider.

---

# 14. Core Import Algorithm

```text
Incoming
   ↓
Stock exists?
  NO → AUTO CREATE (trusted fields populate)
  YES → per trusted field:
          empty → AUTO FILL
          same  → NO ACTION
          diff  → CONFLICT → Admin Apply/Reject
Missing on source → no auto delete/clear
```

---

# 15. Import Result & History

Mỗi import có summary (New / Updated-or-Filled / Unchanged / Conflicts / Missing / Invalid / Auto Applied / Pending Review) + Import History table (ID, Provider, times, status, counts).  
Schema vật lý: Plan reuse/extend `data_sources` hoặc bảng mới sau audit — **Reuse before Create**.

---

# 16. Comparison Engine

So sánh theo Entity + Field + Current vs Incoming + Trusted Source.  
Chỉ field trong Source Governance của provider mới vào Auto/Conflict path.

---

# 17. Provider Status vs Field Trust

Tách: Provider Active ≠ Trusted mọi field.

---

# 18. Stock Admin

`/admin/thi-truong/stocks`

List: Ticker, Sàn, Ngành, HST, Thị giá, Tăng/Giảm, OHLC, Vốn hóa, **Nhóm vốn hóa**, Trạng thái, Cập nhật.  
Runtime price/OHLC có thể từ Runtime path; Master columns từ API Master.

Create/Edit (drawer): Ticker, Tên, Sàn, Ngành, HST, **Nhóm vốn hóa** L/M/S, Status, Mô tả.  
Save/Close/Validate/Refresh đầy đủ; clear sector/eco gửi null khi bỏ chọn (fix Audit bug).  
Create UI nếu API đã có POST — hoàn thiện FE.

---

# 19. Sector / Ecosystem Admin

* List: Tên, Số CP, Số bài viết, Trạng thái — **không Divisor**.  
* Create/Edit drawer (không center modal): Tên, Code, Slug, Description, Status, **Stocks**.  
* Sector → Add Stocks → `stocks.sector_id` (**bắt buộc** — BR gap).  
* Ecosystem → Add Stocks → `stocks.ecosystem_id` (đã có — chuẩn hóa UX drawer).  
* `post_count` / `stock_count`: fix query root cause (Audit ~6–8s) trước khi nghĩ Redis.

---

# 20. Admin Form UX

Right-side drawer thống nhất Stock / Sector / Ecosystem. Reuse pattern hiện có (`ixOpenOffcanvas` / tương đương) — không invent pattern thứ hai.

---

# 21. Performance

Ưu tiên: SQL/index/aggregation → API payload → FE.  
Không spinner-only; không Redis che N+1 `post_count` nếu chưa evidence.

---

# 22. Divisor Removal

Dependency sweep: DB → model → API → Admin UI → validation → tests.  
Không DROP trước khi dependency clear.

---

# 23. Lifecycle Cleanup

`status` canonical; reconcile `is_active` (SSI conflict). Plan: backfill + stop dual writes + deprecate.

---

# 24. Legacy Cleanup

`market_admin_stocks`, `IfluxMarketRegistryStore`, Mock/seeds, hardcoded registries: identify consumers → migrate Internal API → remove pseudo-authority. Không xóa khi còn consumer.

---

# 25. Public Frontend

Master: `PG → Internal API → Public FE` cho Stock/Sector/Eco/name/exchange/assignments/Cap Group/status.  

Runtime Price/OHLC: có thể provider runtime — **không** đồng nhất Master.  
Plan: dần bỏ browser direct Master dependency; quotes path govern riêng (có thể proxy sau — không bắt buộc cùng WP Master).

Pages: `/co-phieu`, `/nganh`, `/he-sinh-thai` (+ detail) — trace field map trước code (đã có baseline `02`/`02A`; Plan cập nhật delta).

---

# 26. API Boundary

```text
Provider Adapter → Import Service → Comparison → Master Service → Internal API
```

FE không gọi provider cho Master.  
Endpoint names: audit reuse/extend trước khi tạo mới (`/api/admin/market/stocks`, sectors, ecosystems, data sources…).

Canonical identity: default `ticker` — verify UNIQUE/PK (Audit: PK ticker) trước khi Plan.

---

# 27. Auto-Create populate

Trusted fields từ provider; iFlux-owned thiếu → null/default; Admin hoàn thiện sau. Không bắt nhập lại toàn bộ.

---

# 28. Auditability

Who / What / When / From / Previous / New / Auto vs Admin decision — phân biệt Auto-created, Auto-filled, Admin-applied, Admin-rejected.

---

# 29. Technical Component Matrix

| Component | Responsibility | Authority |
|-----------|----------------|-----------|
| `stocks` / `sectors` / `ecosystems` | Master | SoT |
| Stock FKs | Membership | SoT |
| Source Registry | Provider config | Governance |
| Field Authority | Trusted per field | Governance |
| Import Service | Fetch/normalize/validate | Processing |
| Comparison | Current vs Incoming | Governance |
| Conflict Store | Pending decisions | Workflow |
| Import History | Trace | Audit |
| Master Service | Writes | Write boundary |
| Internal API | Consumers | Read boundary |
| Market Data Admin UI | Control plane | Operator |
| Public UI | Consumer | Read Master |

Logical concepts (không bắt buộc 1:1 bảng): Source, Field Authority, Import, Candidate/Record, Conflict, Decision, Audit Event.  
**Reuse `data_sources` nếu phù hợp; chỉ CREATE khi Impact Analysis “why cannot modify?” đạt.**

---

# 30. Provider Adapters

`DNSE` · `VNDirect` · `SSI` · `FiinPro` adapters cô lập auth/payload/normalize.  
Business authority **ngoài** adapter. Cấm adapter `UPDATE stocks` trực tiếp.

DNSE hiện catalog-only — Plan: wire fetch instruments khi WP Import; không giả pipeline đã có.

VNDirect hiện browser quotes — Master fields (nếu Trusted) phải server-side adapter khi đưa vào Import path.

---

# 31. MDM UI Areas

1. Data Sources  
2. Field Authority  
3. Import  
4. Import History  
5. Conflicts (Pending / filters / Apply-Reject / detail)

---

# 32. Security

Credentials server-side only.  
Reuse Admin RBAC (`market.*`, data sources perms — extend catalog nếu thiếu, không invent RBAC song song).

---

# 33. Observability

Import ID, provider, duration, counts, conflict count; phân biệt validation / provider / DB / auth errors.

---

# 34. Testing Strategy (minimum)

A New auto-create · B Identical no-op · C Conflict no silent overwrite · D Apply · E Reject · F Untrusted no mutation · G Missing no delete · H iFlux-owned protected · I–L Sector/Eco assignment both entry points · Cap Group L/M/S admin + trusted intake · Drawer UX · post_count perf regression · Public Master from Internal API (smoke).

---

# 35. Acceptance Matrix

| Requirement | Expected |
|-------------|----------|
| Market Master | PostgreSQL |
| Relationships | `stocks.sector_id` / `ecosystem_id` |
| Provider authority | Field-level |
| New trusted Stock | Auto-create |
| Empty trusted field | Auto-fill |
| Identical | No-op |
| Conflict | Admin Apply/Reject |
| Missing | No auto delete/clear |
| Cap Group | Master attr; ≠ lot |
| Lot threshold | Separate |
| Divisor | Removed from target model |
| Lifecycle | `status` |
| Public Master | Internal API |
| Mock/Registry | Non-SoT production |
| MDM Control Plane | Multi-provider |
| Sector Add Stocks | Implemented → FK |
| Forms | Right drawer |
| Import/Conflict history | Traceable |
| RBAC | Existing system |

---

# 36. Implementation Planning Contract

Sau Owner APPROVE **03 + 04**:

Cursor đọc `01→04`, tự lập Implementation Plan (có thể inline trong session / checklist — không bắt buộc file Plan riêng trừ Owner yêu cầu).

Plan phải:

1. Không đổi BR / OD / SoT.  
2. Không tự thêm business rule.  
3. Không chọn global provider SoT.  
4. Không relationship store song song.  
5. Không silent Override conflict.  
6. Không bắt Admin approve từng Stock mới.  
7. Không auto-delete khi missing.  
8. Audit code/schema trước CREATE.  
9. Reuse trước Create.  
10. Task có dependency + verification.  
11. Stop nếu conflict SoT — hỏi Owner.

---

# 37. Implementation Ordering Constraint

```text
Current-State Code/DB Audit (delta)
        ↓
Target Data Model (status, cap group, drop divisor path)
        ↓
Source Governance (registry + field authority)
        ↓
Import / Comparison / Auto vs Conflict
        ↓
Conflict Management + History
        ↓
Admin MDM UI
        ↓
Stock / Sector / Ecosystem Admin completion
        ↓
Frontend Master migration
        ↓
Legacy cleanup
        ↓
Verification
```

Không Frontend-Master-first trước khi write authority đúng.

---

# 38. Definition of Solution Complete (checklist)

| Question | Answer in this Solution |
|----------|-------------------------|
| Market Master? | PostgreSQL |
| Stock/Sector/Eco SoT? | `stocks` / `sectors` / `ecosystems` |
| Relationships? | Stock FKs |
| Provider SoT? | No |
| Authority? | Field-level |
| New trusted? | Auto-create |
| Empty? | Auto-fill |
| Same? | No-op |
| Conflict? | Admin Apply/Reject |
| Missing? | No auto delete |
| DNSE-only? | No |
| MDM? | Yes Control Plane |
| Cap Group / Lot? | Separate; Cap = Master attr |
| Divisor / lifecycle? | Remove / `status` |
| Public Master? | Internal API |

---

# 39. Explicitly Out of Scope

Intraday/streaming trading engine · Index calc · Ranking/AI · **Cap classification engine** · Full market-data platform rewrite ngoài Master governance.

---

# 40. Final Solution Statement

> Market Data Management là Control Plane của External Sources và Field Authority.  
> Providers = candidate data.  
> Trusted Source (field-level): Auto-Apply New/Empty; No-op Identical; Admin Review only on Conflict.  
> Missing ≠ Delete. iFlux-owned fields không silent external overwrite.  
> Master = `stocks` / `sectors` / `ecosystems`; relationships = Stock FKs.  
> Public Master qua Internal API.  
> **Ready to Plan** sau Owner APPROVE `03` + `04`.

---

# 41. Approval Gate

| Gate | Status |
|------|--------|
| 01–02B | Basis locked / completed |
| 03 SoT | **APPROVED FOR BUILD** (Owner package 2026-08-08) |
| **04 Solution** | **APPROVED FOR BUILD** — Architecture Decision Complete |
| Implementation Plan file | **Không bắt buộc** — Cursor tự WP |
| Implementation | **AUTHORIZED** |

> Owner ủy quyền: đọc `01→04`, tự quyết số WP, build.  
> Không đổi Governance/SoT/Architecture Decision. Thiếu quyết định kiến trúc → STOP.

---

# Appendix R — Readiness (updated)

| | |
|--|--|
| Architecture Decision Complete | ✅ (§0 Matrix) |
| Implementation Detail Open | ✅ |
| READY TO PLAN / BUILD | ✅ |
| Self-WP + build authorized | ✅ |

Implementation Detail còn mở (đúng thiết kế): tên cột/bảng phụ, endpoint strings, post_count optimization technique, adapter internals.
