# 03 — Source of Truth Governance

## Market Domain — Source of Truth & Data Governance

| | |
|--|--|
| **Task ID** | `080826_Market_Domain_Source_of_Truth_Governance` |
| **Document** | `03 — Source of Truth Governance` |
| **Status** | `APPROVED FOR BUILD` (Owner 2026-08-08) |
| **Date** | 2026-08-08 |
| **Predecessors** | `01 — Business Requirements` · `02 — Mandatory Audit` · `02A — Pre-SoT Readiness` · `02B — Owner Decisions` |
| **Implementation** | ❌ NOT AUTHORIZED |
| **Solution** | ❌ NOT AUTHORIZED |
| **Purpose** | Khóa Source of Truth, Ownership và Authority Model cho Market Domain |

> [!IMPORTANT]
> **Đây là tài liệu Governance, không phải Solution và không phải Implementation Plan.**
>
> Tài liệu này xác định **dữ liệu nào là authoritative, entity nào sở hữu dữ liệu, relationship nằm ở đâu, External Source có vai trò gì và Admin có quyền quyết định gì**.
>
> Chưa xác định cách triển khai kỹ thuật cụ thể.

### Completeness note (review vs Audit / BRD / OD)

Tài liệu này khóa governance theo Owner Decisions (`02B`) và evidence Audit (`02` / `02A`).  
Bổ sung khóa: Cap Group Admin select; Ngưỡng lô riêng; Missing ≠ Delete; **OD-08 Trusted Source Auto-Apply / Conflict-only Review**; **Market Data Management = Control Plane** + field mapping visibility; legacy non-SoT; Stock `status` vs Sector/Eco `is_active`.

---

# 1. Governance Objective

Market Domain phải có một **Source of Truth duy nhất ở cấp hệ thống**, tránh tình trạng cùng một business data tồn tại ở nhiều nơi với nhiều nguồn authority khác nhau.

Phạm vi gồm:

```text
Stock
Sector
Ecosystem
Stock ↔ Sector
Stock ↔ Ecosystem
Market Master Data
External Data Sources
Source Authority
Data Import / Synchronization
Conflict / Comparison
Public Market Data Consumption
```

Mục tiêu cuối cùng:

```text
External Providers
        ↓
Candidate Data
        ↓
Source Governance
        ↓
Comparison / Review
        ↓
Admin Decision
        ↓
iFlux Market Master
        ↓
Public / Admin Consumers
```

**iFlux Market Master là Source of Truth cuối cùng.**

External Provider **không** phải Source of Truth của iFlux.

---

# 2. Core SoT Principles

## 2.1 — iFlux Market Master is the System SoT

PostgreSQL Market Master là nguồn sự thật cuối cùng của iFlux đối với Master Data.

Các entity chính:

```text
stocks
sectors
ecosystems
```

được sử dụng làm authoritative system records.

Mandatory Audit xác nhận ba bảng này đang tồn tại trong Production PostgreSQL.

---

## 2.2 — External Provider is NOT SoT

DNSE, VNDirect, SSI, FiinPro hoặc bất kỳ provider nào khác đều được xem là:

> **External Data Provider**

Provider chỉ cung cấp dữ liệu đầu vào / candidate data.

Không provider nào mặc định có quyền:

```text
External Provider
→ overwrite
→ iFlux Market Master
```

mà không đi qua Source Governance.

---

## 2.3 — Authority is Field-Level

Không áp dụng mô hình:

```text
DNSE = Trusted
VNDirect = Untrusted
```

ở cấp toàn bộ provider.

Thay vào đó:

```text
Provider
+
Field
+
Current Authority
```

được quản trị độc lập.

Ví dụ (minh họa — không khóa Provider cụ thể):

| Entity | Field | Trusted Source |
| ------ | ----- | -------------- |
| Stock | ticker | Provider A |
| Stock | company_name | Provider B |
| Stock | exchange | Provider A |
| Stock | market_cap | Provider A |
| Stock | capitalization_group | Provider A |
| Stock | sector | iFlux Admin |
| Stock | ecosystem | iFlux Admin |
| Stock | status | iFlux Admin |

Một provider có thể là Trusted Source cho một field nhưng không phải Trusted Source cho field khác.

---

## 2.4 — Missing ≠ Delete

Khi External Source không còn chứa một Stock (hoặc thiếu field) so với Market Master:

> **Không mặc định Delete** bản ghi Master hoặc clear field iFlux-owned.

Xử lý theo Comparison / Review (BR Rule 06). Chi tiết cơ chế → Solution.

---

## 2.5 — Trusted Source Apply Policy (OD-08) — LOCK

> **Trusted Source → Auto-Apply for New / Non-Conflicting Data; Admin Approval Required Only for Conflicts.**

Đây là **Governance Principle toàn cục** của Market Data Management Import/Sync — áp dụng mọi field được Trusted Source cung cấp (không chỉ Cap Group).

### Phân biệt “mới” và “mâu thuẫn”

```text
External Provider (Trusted for field)
       ↓
     Import
       ↓
   Compare với Market Master
       │
       ├── Entity/Field chưa tồn tại (hoặc field Master đang trống)
       │       ↓
       │   AUTO APPLY
       │
       ├── Đã tồn tại + giá trị giống nhau
       │       ↓
       │   NO ACTION
       │
       └── Đã tồn tại + giá trị khác nhau (conflict)
               ↓
          ADMIN REVIEW
               ↓
          Apply / Reject
```

### Trusted ≠ “mọi dòng phải hỏi Admin”

Trusted Source **được phép** tự động bổ sung dữ liệu mới / điền field trống vào Market Master.

Chỉ khi incoming **mâu thuẫn** với giá trị Master **đang tồn tại** (non-empty và khác) thì bắt buộc Admin Review trước khi Override.

### Ví dụ chuẩn

| Tình huống | Xử lý |
|------------|--------|
| DNSE trả mã ABC chưa có trong `stocks` | **Auto Add** |
| DNSE trả `ABC.company_name` và field Master đang trống | **Auto Fill** |
| DNSE trả `ABC.exchange = HOSE`, Master cũng `HOSE` | **No Action** |
| DNSE trả `ABC.market_cap = 105T`, Master `= 100T` | **Admin Review** |
| DNSE trả `ABC.sector = Banking`, Master `= Technology` | **Admin Review** |
| DNSE không trả Ecosystem | **Không xóa** Ecosystem hiện tại (Missing ≠ Delete) |
| DNSE trả Ecosystem khác Ecosystem hiện tại | **Admin Review** |
| Cap Group mã mới từ Trusted Source | **Auto Add** |
| Cap Group mã cũ + giống | **No Action** |
| Cap Group mã cũ + khác | **Admin Review** → Override chỉ nếu Admin xác nhận |

Admin vẫn có thể sửa trực tiếp Master (vd. Cap Group trên Stocks). Import hàng nghìn mã từ Trusted Source **không** bắt Admin xác nhận từng mã khi không có conflict.

### Phạm vi Trust

Auto-Apply chỉ áp dụng khi source là **Trusted cho đúng field** đó (field-level).  
Source Untrusted / Review Required / Disabled: không Auto-Apply vào Master (candidate + review theo Solution rules).

Chi tiết flow đầy đủ: §16 · §17.

---

# 3. Market Master Entity SoT

## 3.1 — Stock

### SoT

```text
stocks
```

là authoritative entity store cho Stock Master.

### Stock Master bao gồm các nhóm dữ liệu:

```text
Identity
    ticker
    company_name / name

Market Identity
    exchange

Classification
    sector          → stocks.sector_id
    ecosystem       → stocks.ecosystem_id
    capitalization group

Lifecycle
    status          → canonical (OD-01)

Description
    description

Market Attributes
    market_cap
    ...
```

> Danh sách column vật lý cuối cùng tuân schema/BR được khóa trong Solution; SoT xác định **ownership**, không tự tạo database field mới tại đây.

### Non-authoritative / separate

| Item | Governance |
|------|------------|
| `stocks.is_active` | Legacy / non-authoritative lifecycle (OD-01) |
| `stocks.lot_threshold` | **Ngưỡng lô** — concept riêng (§10.4), không phải Cap Group |
| `market_admin_stocks` | Legacy table — **không** phải Stock Master SoT |
| Mock / Registry Store | Non-SoT (§26) |

---

# 4. Sector SoT

## 4.1 — Entity

```text
sectors
```

là authoritative entity store cho Sector.

Sector sở hữu các thuộc tính của chính Sector:

```text
name / name_vi
code
slug
description
lifecycle representation   → hiện tại DB: is_active (map API status)
...
```

### Divisor

`divisor` **không** thuộc Market Master SoT (OD-05 / §12).

### Derived (không authoritative)

```text
stock_count
post_count
```

Được tính từ entities liên quan — không phải Master fields độc lập.

---

# 5. Ecosystem SoT

## 5.1 — Entity

```text
ecosystems
```

là authoritative entity store cho Ecosystem.

Ecosystem sở hữu:

```text
name / name_vi
code
slug
description
lifecycle representation   → hiện tại DB: is_active (map API status)
...
```

`divisor` **không** thuộc Market Master SoT.

Danh sách Stock thuộc Ecosystem **không** là Source of Truth độc lập trong bảng Ecosystem.

---

# 6. Stock ↔ Sector Relationship SoT

## 6.1 — Authoritative Relationship

```text
Stock → Sector
```

sở hữu bởi:

```text
stocks.sector_id
```

Mandatory Audit: không phát hiện authoritative stock-list table thứ hai.

---

## 6.2 — Multiple Admin Entry Points

```text
Stocks → Chọn Sector
Sectors → Thêm Stocks
```

Cả hai **phải** converge về `stocks.sector_id`.

### Governance Rule

> **Stock membership của Sector chỉ có một authoritative representation: `stocks.sector_id`.**

Không tạo thêm `sector.stock_codes` / `sector.tickers` / `sector_stocks` làm membership SoT song song.

### Implementation gap (không đổi SoT)

Audit: Sector → Add Stocks **chưa có** = gap so với BR-05 / OD-06.  
SoT vẫn LOCK relationship tại `stocks.sector_id`; Solution **bắt buộc** bổ sung entry point Sector.

---

# 7. Stock ↔ Ecosystem Relationship SoT

## 7.1 — Authoritative Relationship

```text
stocks.ecosystem_id
```

---

## 7.2 — Multiple Admin Entry Points

```text
Stocks → Chọn Ecosystem
Ecosystems → Thêm Stocks
```

Cả hai converge về `stocks.ecosystem_id`.

Audit: Ecosystem syncTickers đã ghi FK này.

---

## 7.3 — Ecosystem Stock List

> **Derived / Read Model** từ `stocks WHERE ecosystem_id = …`

Không phải Membership SoT riêng.

---

# 8. Sector / Ecosystem Derived Data

```text
stock_count
post_count
```

là **Derived Data**. Nguồn tính từ authoritative entities (vd. COUNT stocks theo FK).

Không lưu Stock Count độc lập làm authority nếu không có BR riêng.

Performance của cách tính derived (vd. `post_count`) là Solution concern — không đổi SoT classification.

---

# 9. Stock Lifecycle Authority

## 9.1 — Canonical Lifecycle Field

```text
stocks.status
```

Evidence (02A): writers Wave-F mutate `status`; Admin Stocks filter/stats dùng `status`.

---

## 9.2 — `stocks.is_active`

> **Legacy / conflicting field** — non-authoritative.

Production conflict đã quan sát:

```text
SSI: status = active · is_active = false
```

### Governance Decision (OD-01)

> **`status` là canonical Stock lifecycle authority.**

`is_active` không được tồn tại như lifecycle authority song song.

Reconcile / migrate / deprecate / remove → Solution / Implementation.

---

## 9.3 — Sector / Ecosystem lifecycle (không nhầm với Stock)

Sector và Ecosystem hiện dùng `is_active` (boolean) làm lifecycle DB, map API `status` active/inactive.

Đây **không** làm thay đổi quyết định Stock: Stock canonical vẫn là `stocks.status`.

SoT không bắt Sector/Ecosystem đổi sang cột `status` tại document này — Solution có thể chuẩn hóa naming nếu cần, miễn một authority per entity.

---

# 10. Capitalization Group Governance

## 10.1 — Distinguish Two Concepts

```text
Capitalization Group   ≠   Lot / Trade-Value Threshold (Ngưỡng lô)
```

Không dùng `lot_threshold` / `market_lot_config` để biểu diễn Large / Medium / Small Cap Group.

---

## 10.2 — Capitalization Group Authority (OD-03)

> iFlux **không** xây Capitalization Classification Engine trong phạm vi hiện tại.

Cap Group là **Market Master attribute**.

Giá trị có thể đến từ:

1. **Trusted External Source** cho field này — tuân **§2.5 Trusted Source Apply Policy**; và/hoặc  
2. **Admin select** trên Stocks Create/Edit: `Large` / `Medium` / `Small`  
   (`Small` bao gồm Small và nhỏ hơn nếu nguồn có — vd. Micro).

Áp dụng §2.5:

| Cap Group situation | Xử lý |
|---------------------|--------|
| Mã mới | Auto Add Cap Group từ Trusted Source |
| Mã cũ + giống | No Action |
| Mã cũ + khác | Admin Review → Override chỉ khi Admin xác nhận |

Admin vẫn sửa trực tiếp Cap Group trên Stocks khi cần.

---

## 10.3 — No Provider Lock

SoT **không** khóa Cap Group → VNDirect hoặc → DNSE.  
Authority qua **field-level Source Governance**.

---

## 10.4 — Ngưỡng lô (Lot / Trade-Value Threshold) — LOCK riêng

| Item | Role |
|------|------|
| `stocks.lot_threshold` | Per-stock lot / trade-value threshold (large-lot logic) |
| `market_lot_config` | Default thresholds theo tier (large/mid/small **lot** defaults) |

Đây là **business concept riêng** phục vụ large-lot / trade-value — **không** phải Cap Group SoT.

Chi tiết schema/UI rename → Solution (không đổi semantic SoT ở đây).

---

# 11. Market Cap Governance

Market Cap là Market Master attribute (khi được lưu trong Master).

SoT **không** khóa Provider cụ thể.

```text
External Provider
→ candidate Market Cap
→ Source Governance
→ Trusted Source (field-level)
→ Comparison nếu khác Current
→ Admin Apply/Reject
→ Market Master
```

---

# 12. Divisor Governance (OD-05)

Audit: `divisor` còn trong DB/Admin CRUD; không có runtime index engine dùng divisor.

Owner Decision:

> **Không có BR hiện tại yêu cầu `divisor` trong Market Master.**

```text
divisor → NOT Market Master SoT
```

Remove column / API / Admin UI / migration → Solution / Implementation.  
**Cấm DROP trước Solution & Plan APPROVED.**

---

# 13. External Data Source Governance

Hệ thống hỗ trợ **nhiều** External Data Providers.

Không giới hạn kiến trúc vào DNSE.

Có thể gồm: DNSE · VNDirect · SSI · FiinPro · nguồn mới.

Số lượng provider **không** đổi SoT architecture.

---

# 14. Market Data Management — Official Control Plane

> **LOCK:** Market Data Management là **Control Plane chính thức** của External Data / Import governance cho Market Domain.

**Không** phải trang “Quản lý DNSE”.

Tên capability:

```text
Market Data Management
(= External Data Source Management / Quản lý Nguồn Dữ liệu)
```

### 14.1 — Scope của Control Plane (ba lớp — LOCK theo BR-11)

Admin quản lý tối thiểu — **phải tách**:

```text
1. Source Registry          ← nguồn CÓ THỂ kết nối
2. Field Authority Config   ← nguồn ĐANG CHỌN cho Entity×Field (+ Trust)
3. Import / Sync Operation  ← thực thi cấu hình; KHÔNG chọn Source lúc bấm
+ Comparison / Conflict Review / Apply|Reject
+ Import History / Audit Trail
```

**CẤM:** Import form yêu cầu Admin chọn Source / Entity / Field tại runtime.  
**BẮT BUỘC:** Source resolve từ Field Authority Configuration hiện tại (BR-11 §B).

### 14.2 — Source Registry

```text
Source
Status
Connection / Availability
Supported Data
Last Sync / Import
```

Registry = khả năng kết nối. **Không** đồng nghĩa “đang là Current Source cho field”.

Provider không được hardcode thành architectural assumption duy nhất.

### 14.3 — Field Authority Visibility (Admin must see)

Admin phải nhìn được mapping kiểu (columns tối thiểu) — đây là **configuration**:

| Entity | Field | Current Source | Trust | Current Value | Last Update |
| ------ | ----- | -------------- | ----- | ------------- | ----------- |
| Stock | Exchange | VNDirect | Trusted | HOSE | … |
| Stock | Market Cap | DNSE | Trusted | … | … |
| Stock | Capitalization Group | DNSE | Trusted | Large | … |
| Stock | Ecosystem | iFlux Admin | Authoritative | … | … |
| Stock | Sector | iFlux Admin | Authoritative | … | … |

Admin **đổi Current Source / Trust tại đây** — không đổi lúc Import.

Đây là **Source Governance UI requirement** — schema/table cụ thể → Solution.

### 14.4 — Import / Sync Operation (LOCK theo BR-11 §B)

```text
[ Import / Sync Market Data ]
 → đọc Field Authority
 → resolve Sources được cấu hình
 → adapter(s) → candidate theo field gán Source
 → Compare Master → OD-08 → Change Set / Conflict / Audit
```

Import là **execution command**, không phải configuration form.

---

# 15. Field-Level Trusted Source

| Entity | Field | Source | Authority |
| ------ | ----- | ------ | --------- |
| Stock | ticker | Provider A | Trusted (example) |
| Stock | company_name | Provider B | Trusted (example) |
| Stock | market_cap | Provider A | Trusted (example) |
| Stock | capitalization_group | Provider A | Trusted (example) |
| Stock | sector | iFlux Admin | Trusted |
| Stock | ecosystem | iFlux Admin | Trusted |
| Stock | status | iFlux Admin | Trusted |

Đây là **Source Governance**, không phải External Provider SoT.

Admin có thể đổi Trusted Source theo field qua Market Data Management.

Trusted cho field → quyền **Auto-Apply New/Empty** theo §2.5; **không** quyền silent Override khi conflict.

---

# 16. Import Governance

## 16.1 — Import ≠ Apply (refined)

> Import tạo **candidate / change set**.  
> Apply vào Market Master chỉ xảy ra theo §2.5 (Auto) hoặc Admin decision (Conflict).

```text
Sync từ Trusted Source (field-level)
        ↓
So sánh với Market Master
        ↓
 ┌──────────────────────────────────┐
 │ Conflict với giá trị Master hiện │
 │ tại (non-empty và khác)?         │
 └──────────────────────────────────┘
        │
   ┌────┴────┐
   │         │
  Không      Có
   │         │
 Auto Apply  Admin Review
 (new /      │
  empty /    Apply / Reject
  identical→
  no-op)
        ↓
 Market Master
```

## 16.2 — Change classification

Mỗi import phải phân loại tối thiểu:

| Class | Meaning | Trusted Source default |
|-------|---------|------------------------|
| **New entity** | Chưa có trong Master | Auto Apply |
| **Fill empty** | Field Master trống / null | Auto Apply |
| **Unchanged** | Giống Master | No Action |
| **Conflict** | Master có giá trị khác | Admin Review |
| **Missing** | Có trên Master, không còn trên source | **Không** auto-delete (§2.4) |

Untrusted / Review Required / Disabled sources: không Auto-Apply (Solution định chi tiết queue review).

---

# 17. Conflict / Comparison Governance

Khi **Conflict** (incoming ≠ current non-empty):

```text
Stock · Field · Current · Incoming · Source · Change
```

| Stock | Field | Current | Incoming | Source | Path |
| ----- | ----- | ------- | -------- | ------ | ---- |
| ABC | Market Cap | 100T | 105T | DNSE | Admin Review |
| ABC | Capitalization Group | Large | Medium | DNSE | Admin Review |
| ABC | Exchange | HOSE | HOSE | DNSE | No Action |
| XYZ | (new ticker) | — | … | DNSE | Auto Add |

## 17.1 — No Silent Override (refined)

> **Không** tự động **Override** giá trị Master đang tồn tại khi incoming **mâu thuẫn** với giá trị hiện tại.

Được phép (Trusted Source, field-level):

* Auto-Apply **dữ liệu mới** (entity mới);
* Auto-Apply **bổ sung field đang trống**;
* No-op khi identical.

Mọi Override conflict phải qua Admin Apply/Reject và để lại Audit Trail.

---

# 18. Admin as Data Authority

Admin quản trị:

```text
Master Data
Relationship
Source Authority
Import Decision
Conflict Resolution
```

Đặc biệt với field External không cung cấp (vd. **Ecosystem**): Admin cấu hình thủ công; Provider không có quyền quyết định iFlux Ecosystem chỉ vì cung cấp ticker/name/exchange.

---

# 19. Stock Master Write Authority

Entry points:

```text
Admin Stocks
Admin Sectors
Admin Ecosystems
Market Data Management
```

Tất cả converge về cùng Market Master authority (`stocks` / `sectors` / `ecosystems` + FK relationships).

Không tạo relationship store authoritative thứ hai.

---

# 20. DNSE Governance

DNSE **không** phải Market Master SoT.

Audit: pipeline dừng auth / catalog / status — chưa ghi PG Master.

Khi dùng để import:

```text
DNSE → Candidate → Comparison → Admin Review → Apply → Market Master
```

Không: `DNSE → Direct Master Overwrite`.

---

# 21. VNDirect Governance

Hiện dùng cho Runtime: Price / OHLC (Audit).

> VNDirect **không** phải Market Master SoT.

Nếu sau này dùng cho Master field (vd. Cap Group / Market Cap): authority qua Market Data Management + conflict review.

---

# 22. SSI / FiinPro Governance

Hiện: registry stub (`data_sources`), chưa intake thực tế.

Nếu kích hoạt: Register → Configure → Import → Compare → Trust → Apply — cùng model.

---

# 23. Redis / Cache Boundary

Redis **không** phải Market Master SoT.

Audit: không trên path Market Master hiện tại.

```text
PostgreSQL Market Master
        ↓
Cache / Runtime Layer (optional)
```

Cache không được thành authoritative copy của Master Data.

---

# 24. Public Frontend SoT

Current (non-compliant):

```text
Public Frontend → Mock / Registry Seed / VNDirect (quotes)
```

## 24.1 — Target — Market Master

```text
PostgreSQL Market Master
        ↓
Internal API
        ↓
Public Frontend
```

Không: Public Frontend → External Provider cho **Master Data**.

## 24.2 — Runtime Market Data Exception

| Class | Examples |
|-------|----------|
| **Market Master** | Name, Sector, Ecosystem, Exchange, Description, Cap Group, Status |
| **Runtime Market Data** | Price, OHLC, Intraday, Streaming |

Không đồng nhất hai class.

---

# 25. Frontend Entity Mapping

| Page | Entity | SoT |
| ---- | ------ | --- |
| `/co-phieu` | Stock | `stocks` |
| `/he-sinh-thai` | Ecosystem | `ecosystems` |
| `/nganh` | Sector | `sectors` |
| `/co-phieu/{ticker}` | Stock | `stocks` |
| `/he-sinh-thai/{slug}` | Ecosystem + derived Stocks | `ecosystems` + `stocks.ecosystem_id` |
| `/nganh/{slug}` | Sector + derived Stocks | `sectors` + `stocks.sector_id` |

---

# 26. Hardcode / Mock / Legacy Client Governance

Không authoritative:

```text
Mock Market
Seed Registry
IfluxMarketRegistryStore (localStorage)
Hardcoded Stock / Sector / Ecosystem
market_admin_stocks (legacy table)
```

Chỉ được coi: Development Fixture / Fallback / Test / Legacy — **không** production Market Master authority.

---

# 27. SoT Decision Matrix

| Domain | Authoritative Source | Authority Type | Status |
| ------ | -------------------- | -------------- | ------ |
| Stock Entity | `stocks` | System SoT | **LOCK** |
| Sector Entity | `sectors` | System SoT | **LOCK** |
| Ecosystem Entity | `ecosystems` | System SoT | **LOCK** |
| Stock → Sector | `stocks.sector_id` | Relationship SoT | **LOCK** |
| Stock → Ecosystem | `stocks.ecosystem_id` | Relationship SoT | **LOCK** |
| Sector stock list | Derived from `stocks.sector_id` | Derived | **LOCK** |
| Ecosystem stock list | Derived from `stocks.ecosystem_id` | Derived | **LOCK** |
| Stock lifecycle | `stocks.status` | Field SoT | **LOCK** |
| `stocks.is_active` | Legacy/conflicting | Non-authoritative | **LOCK PRINCIPLE** |
| Capitalization Group | Trusted source value và/hoặc Admin select | Field-level + Admin | **LOCK** |
| Market Cap | Trusted source value → Master sau Apply | Field-level source governance | **LOCK** |
| Ngưỡng lô (`lot_threshold` / `market_lot_config`) | iFlux lot config (riêng Cap Group) | Separate concept | **LOCK PRINCIPLE** |
| Sector / Ecosystem assignment | Admin (iFlux-owned); conflict → review | Field-level | **LOCK** |
| Trusted Source Apply Policy | Auto new/empty; Review on conflict | Import governance | **LOCK** (OD-08 / §2.5) |
| Market Data Management | Official Control Plane | Capability SoT | **LOCK** (§14) |
| `divisor` | None | Not Market Master SoT | **LOCK** |
| External Provider | Candidate data | Not SoT | **LOCK** |
| Redis | Cache/runtime only | Not SoT | **LOCK** |
| Public Master Data | iFlux Market Master via Internal API | Consumer rule | **LOCK** |
| `market_admin_stocks` | Legacy | Not SoT | **LOCK PRINCIPLE** |

---

# 28. Data Authority Model

### 28.1 — Source Data

Data từ external provider (DNSE, VNDirect, SSI, FiinPro, …).

### 28.2 — Candidate Data

Đã import, chưa là Master.

### 28.3 — Trusted Source Data

Từ source đang được chỉ định Trusted cho **field** đó.

### 28.4 — Market Master Data

Authoritative trong iFlux Market Master PostgreSQL.

```text
Source Data ≠ Candidate Data ≠ Trusted Source Data ≠ Market Master
```

---

# 29. Conflict Resolution Principle

Newest external value **không** mặc định đúng khi **conflict**.

```text
Compare
  → New / Empty (Trusted) → Auto Apply
  → Identical → No Action
  → Conflict → Present Evidence → Admin Decision → Apply / Reject
```

Scale: hàng nghìn mã — Admin chỉ review **conflicts**, không xác nhận từng auto-add.

---

# 30. Governance of Provider Count

Provider-agnostic. Không có rule “max 2 providers” / “DNSE luôn primary” / “VNDirect luôn primary”.

Câu hỏi SoT duy nhất:

> **For this entity + field, which source is currently trusted, and what is the current value in the iFlux Market Master?**

---

# 31. Authority Hierarchy

```text
                BUSINESS GOVERNANCE
                         ↓
                 iFlux SoT Policy
                         ↓
              Market Data Management
                         ↓
             Field-level Source Authority
                         ↓
             Comparison / Conflict Review
                         ↓
                  Admin Decision
                         ↓
               Market Master PostgreSQL
                         ↓
             Internal APIs / Consumers
```

```text
DNSE · VNDirect · SSI · FiinPro · Provider N
          ↓
     Candidate Data
          ↓
   Governance Boundary
```

---

# 32. What This SoT Does NOT Decide

* API endpoint design  
* Migration scripts  
* Exact Source Registry / Import History / Change Set tables  
* Conflict Review UI  
* Queue/event / Redis architecture  
* CI/CD · FE · Admin drawer · perf fix implementation  
* DNSE connector / provider adapters  

→ **04 — Solution & Plan**

---

# 33. Known Current-State Gaps

SoT đã định nghĩa dù implementation chưa tuân thủ.

| ID | Gap |
|----|-----|
| **GAP-01** | Public Frontend không consume PG Market Master |
| **GAP-02** | Chưa đủ Import → Compare → Auto (new/empty) / Review (conflict) → Apply |
| **GAP-03** | `data_sources` stub — thiếu trust / field authority / import history đầy đủ |
| **GAP-04** | Stock lifecycle dual `status` + `is_active` (conflict SSI) |
| **GAP-05** | `divisor` còn trong impl dù không còn SoT authority |
| **GAP-06** | Sector → Add Stocks missing (BR-05 gap); Sector/Eco UX drawer vs modal |
| **GAP-07** | Sector/Eco list `post_count` SQL đắt (evidence ~6–8s) |
| **GAP-08** | Cap Group chưa có Master field persist; UI phantom / Registry hardcode |
| **GAP-09** | Ngưỡng lô lẫn nhãn với Cap Group trên UI; dual store (PG + localStorage overrides) |
| **GAP-10** | VNDirect gọi trực tiếp từ browser (ungoverned runtime path) |
| **GAP-11** | Legacy `market_admin_stocks` + Mock/Registry vẫn ảnh hưởng pseudo-master |

---

# 34. SoT Compliance Target

Market Domain **SoT-compliant** khi:

```text
1. Market Master có một authoritative entity store per entity.
2. Stock → Sector: một relationship authoritative.
3. Stock → Ecosystem: một relationship authoritative.
4. Không silent Override khi conflict với Master hiện hữu.
5. Trusted Source Auto-Apply cho New / Empty; No Action khi identical.
6. Source authority governed ở field level.
7. Import tách khỏi Apply (Apply = Auto theo policy hoặc Admin).
8. Conflicts visible trước Override; Admin Apply/Reject.
9. Market Data Management là Control Plane (multi-provider).
10. Admin thấy Entity×Field×Source×Trust×Current Value.
11. Public Master Data consume iFlux Market Master.
12. Runtime Market Data không nhầm với Market Master.
13. Legacy / conflicting authority fields được reconcile.
14. Mock / hardcoded production Master dependencies được gỡ.
15. Cap Group ≠ Ngưỡng lô; không Cap classification engine trong scope.
16. divisor không còn trong Market Master SoT model.
17. stocks.status là lifecycle canonical.
18. Missing external ≠ Delete Master / clear iFlux-owned fields.
```

---

# 35. Final SoT Statement

> **iFlux Market Master PostgreSQL is the single authoritative Source of Truth for Market Master Data.**

> `stocks`, `sectors`, and `ecosystems` are the authoritative Market Master entities.

> `stocks.sector_id` and `stocks.ecosystem_id` are the authoritative Stock classification relationships.

> Sector and Ecosystem stock lists are derived views of Stock relationships and must not become independent authoritative membership stores.

> External Data Providers (DNSE, VNDirect, SSI, FiinPro, future) are **data providers, not Sources of Truth**.

> Source authority is governed at **field/data-attribute level**.

> Imported data is compared to Market Master. **Trusted Source** may **Auto-Apply** new entities and empty-field fills; **identical** values are no-op; **conflicts** require Admin Review before Override (OD-08 / §2.5).

> Missing external data does not automatically mean Delete.

> **Market Data Management** is the official Control Plane for providers, field authority, import, comparison, conflict, and audit.

> Provider count is not an architectural constraint.

> `stocks.status` is the canonical Stock lifecycle field. `stocks.is_active` is non-authoritative legacy/conflicting state.

> Capitalization Group and Lot/Trade-Value Threshold are separate. No Cap Classification Engine in current scope; trusted provider classification and/or Admin L/M/S select may populate Cap Group under Source Governance.

> `divisor` is not part of the authoritative Market Master model under current BR.

> Redis, cache, Mock, Seed, Registry fixtures, External Providers, and `market_admin_stocks` are not Market Master SoT.

> Public consumers must consume Market Master through iFlux-controlled interfaces.

---

# 36. Approval Gate

| Gate | Status |
| ---- | ------ |
| Business Requirement | Refined + Owner Decisions incorporated — formal APPROVE with SoT |
| Mandatory Audit | Completed — PENDING formal APPROVE |
| Pre-SoT Verification | Completed |
| Owner Decisions (`02B`) | **LOCKED** |
| **SoT Governance** | **DRAFT — PENDING OWNER APPROVAL** |
| Solution & Plan | **BLOCKED** |
| Implementation | **BLOCKED** |

> **STOP CONDITION**
>
> Không được chuyển sang Solution hoặc Implementation chỉ vì tài liệu này đã được soạn.
>
> Chỉ khi Owner **APPROVE SoT Governance** mới mở:
>
> **04 — Solution & Plan**

---

# Appendix A — Traceability (OD → SoT)

| Owner Decision | SoT section |
|----------------|-------------|
| OD-01 status canonical | §9 |
| OD-02 Cap ≠ Lot | §10.1, §10.4 |
| OD-03 Cap Group intake + Admin L/M/S; no engine | §10.2 |
| OD-04 field-level governance | §2.3, §13–§17 |
| OD-05 bỏ divisor | §12 |
| OD-06 Sector Add Stocks = BR gap | §6.2 |
| OD-07 Public Internal API → PG | §24 |
| OD-08 Trusted Source Auto-Apply / Conflict-only Review | §2.5, §16, §17 |
| Market Data Management Control Plane | §14 |

---

# Appendix B — Completeness checklist vs BRD / Audit

| Topic | Covered? |
|-------|----------|
| Entity SoT stocks/sectors/ecosystems | ✅ |
| Relationship FK SoT | ✅ |
| Dual membership ban | ✅ |
| Field-level trust / Import ≠ Apply / Auto new vs Conflict review | ✅ §2.5 |
| Market Data Management Control Plane + field mapping UI | ✅ §14 |
| Multi-provider / không DNSE-only | ✅ |
| DNSE / VNDirect / SSI / FiinPro roles | ✅ |
| status vs is_active | ✅ |
| Cap Group vs Ngưỡng lô | ✅ |
| Cap Group no engine + Admin select | ✅ |
| Market Cap field governance | ✅ |
| divisor out of SoT | ✅ |
| Public Master vs Runtime | ✅ |
| Mock/hardcode non-SoT | ✅ |
| Redis non-SoT | ✅ |
| Missing ≠ Delete | ✅ |
| Sector → Add Stocks gap | ✅ |
| Performance gap recorded (not “solved” in SoT) | ✅ GAP-07 |
| Exact schema for Cap Group column name | ❌ deferred to Solution (intentional) |
| Live DNSE instruments field sample | ⚠️ optional; không chặn SoT LOCK principles |
