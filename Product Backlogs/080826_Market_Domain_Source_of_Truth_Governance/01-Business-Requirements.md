# M01 — Business Requirements

# Market Domain Source of Truth & Data Governance


|                                         |                                                                                                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task ID**                             | `080826_Market_Domain_Source_of_Truth_Governance`                                                                                                                                             |
| **Domain**                              | Market                                                                                                                                                                                        |
| **Type**                                | Business Requirement / Governance / Architecture                                                                                                                                              |
| **Status**                              | `DRAFT`                                                                                                                                                                                       |
| **Priority**                            | High                                                                                                                                                                                          |
| **Scope**                               | Stocks / Sectors / Ecosystems / External Data Sources / Admin / Public Frontend                                                                                                               |
| **Primary External Source (priority)**  | DNSE — **không** đồng nghĩa “chỉ DNSE”                                                                                                                                                        |
| **Known External Providers (in scope)** | DNSE · VNDirect (quotes/OHLC — Audit) · SSI / FiinPro (`data_sources` — Audit) · + nguồn mới sau này                                                                                          |
| **System of Record Target**             | iFlux PostgreSQL                                                                                                                                                                              |
| **Implementation Status**               | **NOT AUTHORIZED**                                                                                                                                                                            |
| **Mandatory Process**                   | Business Requirement → Mandatory Audit → SoT Governance → Solution & Plan → Implementation                                                                                                    |
| **Date**                                | 2026-08-08                                                                                                                                                                                    |
| **BRD Revision**                        | 2026-08-08 — BR-11A; Owner Decisions 02B (status canonical; Cap Group ≠ Ngưỡng lô; field-level source governance; bỏ divisor; Cap Group từ provider + Admin select). Không yêu cầu Audit lại. |


---



# 1. Purpose

Thiết lập **nguồn sự thật duy nhất (Source of Truth)** và mô hình quản trị dữ liệu thống nhất cho toàn bộ **Market Domain** của iFlux.

Phạm vi bao gồm:

- Cổ phiếu (Stocks)
- Ngành (Sectors)
- Hệ sinh thái (Ecosystems)
- Quan hệ giữa Stocks ↔ Sectors
- Quan hệ giữa Stocks ↔ Ecosystems
- Nguồn dữ liệu bên ngoài (External Data Providers) — DNSE là ưu tiên đầu, **không** phải phạm vi duy nhất
- Cơ chế import/sync / feed consumption từ nguồn bên ngoài (governed)
- Quyền sở hữu dữ liệu theo field
- Admin Market Management
- Public Frontend Market pages
- Các consumer khác đang sử dụng Market Master Data

Mục tiêu cuối cùng:

> **iFlux phải sở hữu và kiểm soát Source of Truth của Market Domain; các nguồn bên ngoài như DNSE chỉ là External Data Provider, không phải Source of Truth của iFlux.**

---



# 2. Business Context

Hiện tại Market Domain đang tồn tại nhiều điểm cần được xác định và chuẩn hóa:

1. Stocks có thể được cập nhật từ DNSE.
2. Admin có thể cấu hình Sector/Ecosystem từ Stocks.
3. Admin đồng thời có thể cấu hình Stocks từ trang Sector/Ecosystem.
4. Chưa xác định chắc chắn ownership của dữ liệu giữa ba bảng.
5. Có nguy cơ tồn tại nhiều nguồn lưu trữ cùng một thông tin.
6. DNSE có thể không cung cấp đầy đủ các dữ liệu đặc thù của iFlux, đặc biệt là Ecosystem.
7. Một số Public Frontend pages có khả năng vẫn phụ thuộc vào hardcode hoặc external source.
8. Admin Stocks/Sectors/Ecosystems đang có các vấn đề về CRUD/form lifecycle.
9. Một số trang Admin load chậm bất thường dù dữ liệu rất ít.
10. "Ngưỡng lô" (`lot_threshold` / `market_lot_config`) và "Nhóm vốn hóa" đang bị lẫn khái niệm — Audit xác nhận đây là **hai concept khác nhau**.
11. Capitalization Group (`cap_tier`) chưa có trên DB; UI phantom; chưa có field-level intake từ External Source.
12. Chưa có capability **Market Data Management** (External Data Source Management) với trust/conflict review ở cấp field.

Do đó không nên tiếp tục xử lý từng trang riêng lẻ.

Cần xử lý ở cấp:

> **Market Domain Data Governance**

---



# 3. Business Objectives

Task phải đạt các mục tiêu sau.

## BO-01 — Establish Market Domain SoT

Thiết lập nguồn sự thật duy nhất cho:

- Stocks
- Sectors
- Ecosystems
- Stock ↔ Sector relationship
- Stock ↔ Ecosystem relationship

---



## BO-02 — Establish Data Ownership

Xác định rõ:

- Entity nào thuộc quyền sở hữu của iFlux.
- Field nào do iFlux quản trị.
- Field nào có thể nhận từ external source.
- Field nào được external source cập nhật.
- Field nào là derived/computed.
- Field nào không được external source overwrite.

---



## BO-03 — Separate External Provider from iFlux SoT

DNSE phải được coi là:

> **External Data Provider / Upstream Source**

không phải:

> **Source of Truth của iFlux.**

---



## BO-04 — Establish Governed Import

Import dữ liệu từ DNSE phải có:

```text
Import
→ Validate
→ Compare
→ Change Detection
→ Review
→ Apply / Reject
```

Không được mặc định:

```text
Import
→ Overwrite Database
```

---



## BO-05 — Establish Admin Management Capability

Admin phải có khả năng quản trị Market Master Data từ một mô hình thống nhất.

---



## BO-06 — Release Frontend from Hardcode / Direct External Dependency

Public Frontend phải lấy Market Master Data từ nguồn nội bộ được governance.

Không được phụ thuộc trực tiếp vào:

- DNSE
- hardcoded arrays
- static JSON không có ownership
- legacy source
- duplicate data source

---



# 4. Scope



## 4.1 In Scope



### Market Master Data

- Stocks
- Sectors
- Ecosystems
- Relationships



### External Data

- **Tất cả** external market-data providers hiện hữu và sẽ thêm sau (không chỉ DNSE)
- DNSE (master / enrichment — priority adapter)
- VNDirect và mọi quote/OHLC provider đang được Frontend/Admin gọi trực tiếp
- Các nguồn đã đăng ký hoặc stub trong `data_sources` (vd. SSI, FiinPro) và nguồn tương đương
- Manual CSV / Internal Upload (khi mở)
- External source registry
- Source trust
- Field-level authority
- Import / sync / feed intake (theo loại nguồn)
- Change detection
- Review
- Apply
- Reject
- Import history
- Audit trail



### Admin

- Stocks
- Sectors
- Ecosystems
- External Data Sources / **Market Data Management**
- Capitalization Group (Market Master attribute — intake + Admin select)
- Ngưỡng lô / lot trade-value config (**riêng** với Cap Group)



### Public Frontend

- `/co-phieu`
- `/he-sinh-thai`
- `/nganh`
- `/co-phieu/{ticker}`
- `/he-sinh-thai/{slug}`
- `/nganh/{slug}`



### Architecture

- Database
- API
- Service
- Import pipeline
- Data ownership
- Consumer mapping

---



# 5. Out of Scope

Không mặc định mở rộng task sang:

- Xây dựng lại toàn bộ Market Data engine.
- Thay thế DNSE bằng provider khác.
- Xây dựng hệ thống real-time market feed mới.
- Refactor toàn bộ Frontend.
- Refactor toàn bộ Admin architecture ngoài phạm vi cần thiết.
- Thay đổi business logic không liên quan đến Market Master Data.
- Xóa dữ liệu production mà chưa có governance/approval.

Nếu Audit phát hiện dependency bắt buộc phải xử lý để đạt SoT, dependency đó phải được ghi nhận trong Audit và Solution trước khi mở rộng scope.

---



# 6. Current Business Requirements



## BR-01 — Market Master Data Source of Truth

Hệ thống phải có một authoritative Source of Truth cho Market Domain.

Bao gồm tối thiểu:

```text
Stocks
Sectors
Ecosystems
Stock → Sector
Stock → Ecosystem
```

Không được tồn tại hai nguồn cùng có quyền authoritative đối với cùng một dữ liệu.

---



# 7. BR-02 — Stock Management

Admin phải có khả năng quản trị Stock.

Các thông tin business cần quản lý tối thiểu:

- Ticker
- Tên công ty
- Sàn
- Ngành
- Hệ sinh thái
- Nhóm vốn hóa (`Large` / `Medium` / `Small`)
- Trạng thái (`status` — canonical lifecycle; xem Owner Decision OD-01)
- Mô tả



### Quy tắc — Nhóm vốn hóa (Owner LOCK — OD-03)

`Nhóm vốn hóa` là **Market Master Data Attribute**, **không** phải:

- kết quả tự tính từ Market Cap + threshold của iFlux;
- đồng nghĩa với **Ngưỡng lô**.

Trong phạm vi task này:

- **Không** xây Capitalization Classification Engine.
- Giá trị có thể được **tiếp nhận từ External Data Source** đang Trusted cho field này (qua Market Data Management / sync).
- Khi sync source khác và phát hiện khác biệt → Comparison / Conflict Review → Admin Apply/Reject (**không** auto-overwrite).
- Admin Stocks Create/Edit **được phép chọn** `Large` / `Medium` / `Small`.  
`Small` bao gồm Small và nhỏ hơn nếu nguồn có (vd. Micro).



### Quy tắc — Ngưỡng lô (riêng — OD-02)

`lot_threshold` / `market_lot_config` phục vụ **large-lot / trade-value logic**.

```text
Ngưỡng lô  ≠  Nhóm vốn hóa
```

Không dùng cấu hình ngưỡng lô để đại diện Cap Group.

---



# 8. BR-03 — Sector Management

Admin phải có khả năng quản trị Sector.

Thông tin tối thiểu:

- Tên ngành
- Mô tả
- Trạng thái
- Số cổ phiếu
- Số bài viết

`Số cổ phiếu` và `Số bài viết` được xem là các giá trị hiển thị/derived metrics, không mặc định là authoritative source.

### Divisor — Owner LOCK: Bỏ (OD-05)

Field:

> `Divisor`

**Bắt buộc loại bỏ** khỏi Market Master SoT / database và các consumer Admin liên quan.

Audit đã xác nhận: không có runtime calculation engine dùng `divisor` (chỉ Admin CRUD + schema + docs).

Solution phải lập removal/migration plan. **Cấm DROP trước khi Solution & Plan được APPROVED.**

---



# 9. BR-04 — Ecosystem Management

Admin phải có khả năng quản trị Ecosystem.

Thông tin tối thiểu:

- Tên hệ sinh thái
- Mô tả
- Trạng thái
- Số cổ phiếu
- Số bài viết

Danh sách mã cổ phiếu được Admin thao tác trên UI phải được hiểu là:

> **một cách quản trị relationship**

không mặc định là một Source of Truth thứ hai.

---



# 10. BR-05 — Single Ownership of Stock Classification

Admin phải có thể thực hiện hai workflow:

### Workflow A — từ Stocks

```text
Stocks
→ Edit Stock
→ Select Sector
→ Select Ecosystem
→ Save
```



### Workflow B — từ Sector/Ecosystem

```text
Sector
→ Add Stocks
→ Save
```

hoặc:

```text
Ecosystem
→ Add Stocks
→ Save
```

Hai workflow này phải cùng tác động đến **một authoritative relationship**.

> **Lưu ý Audit:** Ecosystem → Add Stocks đã có (`syncTickers` → `stocks.ecosystem_id`).  
> Sector → Add Stocks **chưa có** = **implementation gap** so với BR này — **không** phải Owner decision mới; Solution/Implementation **bắt buộc** bổ sung (OD-06).

Không được thiết kế:

```text
stocks.sector_id
+
sectors.stock_list
```

và coi cả hai là authoritative.

Tương tự:

```text
stocks.ecosystem_id
+
ecosystems.stock_list
```

Không được coi cả hai là Source of Truth.

### Governance Rule

> **Multiple UI entry points are allowed. Multiple authoritative data stores are not allowed.**

---



# 11. BR-06 — No Dual Source of Truth

Dữ liệu có thể được materialize hoặc hiển thị ở nhiều nơi nếu cần performance hoặc read model.

Tuy nhiên chỉ được có **một authoritative owner**.

Ví dụ:

```text
stocks.ecosystem_id
```

là SoT.

Trong khi:

```text
ecosystem.stock_count
```

có thể là derived value.

Đây là hợp lệ.

Ngược lại:

```text
stocks.ecosystem_id
+
ecosystems.stock_codes
```

cùng có quyền quyết định relationship là không hợp lệ.

---



# 12. BR-07 — DNSE as External Data Provider

DNSE được sử dụng như nguồn dữ liệu bên ngoài để hỗ trợ:

- Initial population
- Periodic synchronization
- Market data update
- Stock master data enrichment

Tuy nhiên:

> DNSE không phải Source of Truth của iFlux.

iFlux phải có khả năng tiếp tục hoạt động với dữ liệu đã được lưu trong hệ thống ngay cả khi DNSE không cung cấp một số field.

---



# 13. BR-08 — DNSE Must Not Determine iFlux Completeness

DNSE có thể không cung cấp:

- Ecosystem
- iFlux Sector
- Description
- Internal status
- iFlux classification

Do đó:

> Một Stock không được coi là incomplete chỉ vì DNSE thiếu dữ liệu mà iFlux tự sở hữu.

Mô hình phải hỗ trợ:

```text
External Data
+
Internal Data
+
Derived Data
```

cùng tồn tại trong một Stock record.

---



# 14. BR-09 — Field Ownership

Mỗi field phải được xác định ownership.

Ví dụ business hypothesis:


| Field                | Expected Ownership                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Ticker               | External input + iFlux SoT                                                                |
| Company Name         | External input + iFlux SoT                                                                |
| Exchange             | External input + iFlux SoT                                                                |
| Price                | Market Data Provider (field-level Trusted)                                                |
| OHLC                 | Market Data Provider (field-level Trusted)                                                |
| Market Cap           | Market Data Provider (field-level Trusted) → Master sau Apply                             |
| Sector               | iFlux                                                                                     |
| Ecosystem            | iFlux                                                                                     |
| Description          | iFlux                                                                                     |
| Status               | iFlux — canonical `status` (OD-01)                                                        |
| Capitalization Group | External intake và/hoặc Admin select → Master sau Apply (OD-03); **không** derived engine |


**Authority model (Owner LOCK — OD-04):** không khóa một Provider duy nhất cho toàn domain.  
**iFlux Market Master Database = SoT.** External Provider = candidate data. Trust ở **cấp field** qua Market Data Management.

Khóa chi tiết: `[02B-Owner-Decisions.md](02B-Owner-Decisions.md)` → `03 — SoT Governance`.

---



# 15. BR-10 — Capitalization Group (Owner LOCK — OD-02 / OD-03)

```text
Nhóm vốn hóa  ≠  Ngưỡng lô
```



### Nhóm vốn hóa (Capitalization Group)

Market Master attribute với giá trị chuẩn UI:

```text
Large
Medium
Small
```

(`Small` bao gồm Small và nhỏ hơn nếu nguồn có — vd. Micro.)

**Trong phạm vi task này:**

- **Không** xây classification engine (Market Cap + threshold → L/M/S).
- Có thể **tiếp nhận từ External Data Source** đang Trusted cho field này (qua Market Data Management).
- Admin Stocks Create/Edit **cho phép chọn** Large / Medium / Small.
- Conflict khi sync source khác → Comparison / Review → Admin quyết định Apply/Reject — **không** auto-overwrite.



### Ngưỡng lô (riêng)

`lot_threshold` / `market_lot_config` = large-lot / trade-value logic.  
**Không** dùng để đại diện hoặc derive Nhóm vốn hóa.

---



# 16. BR-11 — Market Data Management / External Data Source Management

Hệ thống phải có Admin capability:

> **Market Data Management**  
> (= External Data Source Management / Quản lý Nguồn Dữ liệu)

**Không** đặt tên / thu hẹp thành “Quản lý DNSE”.

**BRD Revision (Owner LOCK — 2026-08-08 reopen):** IA giống Quản lý RSS (không có Đồng bộ danh mục); đối tượng cấu trúc = **Cổ phiếu**; **Import ≠ Apply**; Conflict Review = popup sau Import; History + Audit chỉ sau Apply thành công.

### Information Architecture (Owner LOCK)

```text
Thị trường → Quản lý Nguồn Dữ liệu
 ├── Nguồn Market data              ← Source Registry (+ Source Detail / staging)
 ├── Đồng bộ cấu trúc cổ phiếu      ← Field Authority (Stock) + nút Import/Sync
 └── Lịch sử đồng bộ                ← Import History + Audit (chỉ sau Apply)
```

**CẤM** trang / mục “Đồng bộ danh mục” trong capability này.

Routes đề xuất:

```text
/admin/thi-truong/data-sources
/admin/thi-truong/dong-bo-cau-truc-co-phieu
/admin/thi-truong/lich-su-dong-bo
```

### Ba lớp Control Plane (Owner LOCK — bắt buộc tách)

```text
1. Source Registry (= trang Nguồn Market data)
   → Nguồn hệ thống CÓ KHẢ NĂNG kết nối (DNSE, VNDirect, SSI, …)

2. Field Authority Configuration (= trang Đồng bộ cấu trúc cổ phiếu)
   → Nguồn nào ĐANG ĐƯỢC CHỌN cho từng Entity Stock × Field (+ Trust)
   → Nút Import / Sync góc trên phải tiêu đề trang

3. Import / Sync Operation + Apply
   → Import: lấy candidate · so sánh · phân loại — KHÔNG ghi Market Master
   → Conflict Review (offcanvas phải) chỉ xuất hiện SAU Import
   → Apply: ghi các thay đổi còn lại vào Market Master
   → History + Audit chỉ tạo / hoàn tất SAU Apply thành công
```

**CẤM** mô hình vận hành:

```text
Admin → chọn Source → chọn Entity/Field → Import
Import = ghi thẳng Market Master
Conflict Review / History / Audit chiếm chỗ thường trực trên trang cấu trúc
```

**BẮT BUỘC** mô hình:

```text
Admin cấu hình Current Source (Stock × Field) trên Đồng bộ cấu trúc cổ phiếu
        ↓
Admin bấm Import / Sync (góc trên phải)
        ↓
Hệ thống resolve Source theo Field Authority → adapter → Candidate → Compare → Classify (OD-08)
        ↓
Mở Conflict Review (popup/offcanvas phải) — CHƯA ghi Master — CHƯA History/Audit hoàn tất
        ↓
Admin Reject selected (các thay đổi không muốn)
        ↓
Admin Apply
        ↓
Ghi Market Master + hoàn tất Import History (IMP-00x) + Audit
```

### Nguyên tắc bắt buộc (Owner LOCK — OD-04 + Import≠Apply)

1. Hệ thống **không** bị giới hạn bởi một External Data Provider cụ thể. Admin quản lý **nhiều** nguồn và xác định nguồn đáng tin cậy ở **cấp field / data attribute**.
2. **Market Master Database là SoT cuối cùng của iFlux.** External Provider **không** phải SoT — chỉ cung cấp **candidate data**.
3. **Import ≠ Apply.** Import = lấy và phân loại candidate. Apply = quyết định ghi vào Market Master.
4. Khi candidate **khác** Master: **phải** qua Conflict Review trước Apply; Admin Reject những dòng không muốn, rồi Apply phần còn lại.
5. Source chọn ở **Entity × Field** — **không** chọn lúc Import.
6. Chuỗi: `Provider → Candidate → Comparison → Conflict Review → (Reject) → Apply → Market Master`.
7. **Trước Apply thành công:** Lịch sử Import chưa có record hoàn tất; Audit chưa ghi operation Apply. **Sau Apply:** sinh History + Audit; lần sau = IMP-002 / append Audit.
8. Entity cấu trúc phase này: **Cổ phiếu (Stock)** — không bài viết, không danh mục.

### A. Field Authority Configuration (trang Đồng bộ cấu trúc cổ phiếu)

Admin thiết lập / sửa (một hàng = Stock × Field):

| Entity | Field | Current Source | Trust | Source Status | Current Master Value | Diff | Conflict | Có thể đổi Source |
| ------ | ----- | -------------- | ----- | ------------- | -------------------- | ---- | -------- | ----------------- |
| Stock  | Name  | DNSE           | Trusted | Active      | …                    | —    | No       | ✓                 |
| Stock  | Sector| iFlux          | Authoritative | Protected | …              | —    | No       | ✗ (iFlux-owned)   |

Field iFlux-owned: Current Source = iFlux; External **không** overwrite qua Apply conflict.

Nút **Import / Sync** nằm góc trên, bên phải tiêu đề trang — **không** phải form chọn Source.

### B. BR-11 — Import Operation rồi Apply (Owner LOCK)

> **Import** và **Apply** là hai bước tách biệt.

#### B1. Import (execution — không ghi Master)

1. Admin **không chọn Source** tại Import.
2. Hệ thống dùng Field Authority hiện tại → resolve adapter → fetch candidate → normalize → compare Master.
3. Phân loại OD-08: New | Fill | Unchanged | Updated | Conflict | Missing.
4. Tạo Change Set / hàng chờ Conflict Review (session Import đang mở).
5. **Không** auto-ghi Market Master. **Không** hoàn tất History/Audit Apply.
6. UI: mở **Conflict Review** (offcanvas phải) với cột tối thiểu: Mã · Field · Current Master · Incoming · Source · Decision.

#### B2. Conflict Review → Apply

1. Admin **Reject selected** các dòng không muốn.
2. Admin bấm **Apply** → ghi các thay đổi còn lại vào Market Master.
3. **Chỉ sau Apply thành công:** hoàn tất Import History + ghi Audit (Who / Entity / Key / Field / From / To / Source / Why / Result).
4. Lần Import tiếp theo tạo IMP tiếp theo; Audit append.

#### B3. Trang Lịch sử đồng bộ

Chứa bảng **History** và bảng **Audit** (không gắn thường trực trên trang cấu trúc).

History (sau Apply), ví dụ cột: ID · Sources · Status · New · Updated · Unchanged · Missing · Conflict · Change Set · Time.

---


# 16A. BR-11A — Governance Covers All Existing External Market-Data Providers

**Bổ sung trước khóa BRD / trước APPROVE Audit** (không yêu cầu Audit lại).

External Data Source Governance **bắt buộc bao phủ tất cả** external market-data providers đang tồn tại trong hệ thống — không được thu hẹp Solution thành chỉ “DNSE Governance”.

### Lý do (từ Mandatory Audit — hiện trạng)


| Provider / nguồn                         | Vai trò hiện tại (Audit)                                       | Phải nằm trong Governance? |
| ---------------------------------------- | -------------------------------------------------------------- | -------------------------- |
| **DNSE**                                 | Catalog / auth / intended market feed; chưa ghi SoT            | **Có** (priority adapter)  |
| **VNDirect**                             | Quotes / OHLC đang được Admin Stocks + Public FE gọi trực tiếp | **Có**                     |
| **SSI**                                  | Có trong `data_sources` (stub)                                 | **Có**                     |
| **FiinPro**                              | Có trong `data_sources` (stub)                                 | **Có**                     |
| Manual CSV / Internal Upload / nguồn mới | Khi mở                                                         | **Có** (cùng abstraction)  |




### Quy tắc

```text
CẤM Solution chỉ thiết kế:
  DNSE Governance

BẮT BUỘC Solution thiết kế:
  External Data Source Governance
        │
        ├── DNSE adapter
        ├── VNDirect adapter (hoặc tương đương quote provider)
        ├── SSI / FiinPro (và mọi entry trong source registry)
        └── … adapters mới sau này
```

DNSE là **Primary / priority external source** cho một số use case (master enrichment, intended feed) — **không** phải định nghĩa phạm vi duy nhất của capability.

Mọi provider hiện hữu phải được đưa vào:

- Source registry
- Trust model
- Field-level authority (theo data domain phù hợp — master vs quotes/OHLC)
- Intake path có governance (import / sync / live feed — tùy loại nguồn)
- Traceability (biết consumer đang lấy từ provider nào)

Provider đang được Frontend/Admin gọi **trực tiếp** (vd. VNDirect) phải được ghi nhận trong SoT Governance / Solution như **ungoverned external dependency** cần đưa vào mô hình — không được bỏ qua vì “không phải DNSE”.

---



# 17. BR-12 — External Source Registry

Admin phải xem được danh sách external sources.

Mỗi source tối thiểu có:

- Source name
- Provider
- Type
- Status
- Trust level
- Last import
- Last successful import
- Import status

Registry **tối thiểu** phải có chỗ cho các nguồn Audit đã phát hiện (và nguồn tương đương), ví dụ:

```text
DNSE
VNDirect
SSI Market Feed
FiinPro EOD
Manual CSV
Internal Upload
...
```

Không được thiết kế registry chỉ có một hàng DNSE cứng.

---



# 18. BR-13 — Source Trust Governance

Admin phải có khả năng cấu hình mức độ tin cậy của từng source.

Tối thiểu:

### Trusted

Source được phép cập nhật các field thuộc phạm vi authority đã cấp.

### Review Required / Untrusted

Source được phép cung cấp dữ liệu để:

- Compare
- Detect changes
- Generate review set

nhưng không được tự động overwrite authoritative data.

### Disabled

Source không được phép import/apply dữ liệu.

---



# 19. BR-14 — Trust Must Not Mean Full Database Authority

Không được thiết kế:

```text
DNSE = Trusted
→ DNSE có quyền UPDATE toàn bộ stocks
```

Trusted phải được hiểu:

> Source được tin cậy trong **phạm vi field/data domain đã được cấp quyền**.

---



# 20. BR-15 — Field-Level Source Authority

Hệ thống phải hỗ trợ xác định source nào được phép cập nhật field nào.

Ví dụ:

```text
DNSE
├── Ticker          → Trusted
├── Company Name    → Trusted
├── Exchange        → Trusted
├── Price           → Trusted
├── OHLC            → Trusted
├── Market Cap           → Trusted (example — Admin có thể đổi Trusted source)
├── Capitalization Group → Trusted (example — intake; conflict → review)
├── Sector               → Not Trusted (iFlux-owned)
├── Ecosystem            → Not Trusted (iFlux-owned)
├── Description          → Not Trusted
└── Status               → Not Trusted (iFlux-owned; field = status)
```

Trust là **field-level** (OD-04), không phải “toàn bộ DNSE = authority”. Ví dụ trên là minh họa — Admin cấu hình qua Market Data Management.

---



# 21. BR-16 — Governed Import

Tại trang **Market Data Management** (Control Plane — không phải “Quản lý DNSE”), Admin phải có thể import/sync dữ liệu.

**Phụ thuộc BR-11 Import/Sync Operation:** Admin **không** chọn Source lúc Import. Source đã được cấu hình tại Field Authority (Entity × Field). Import = thực thi cấu hình hiện tại (xem BR-11 §B).

Luồng (Owner LOCK — OD-08 + BR-11 Import Operation):

```text
[ Import / Sync Market Data ]   ← một nút; không chọn Source
      ↓
Đọc Field Authority Configuration
      ↓
Resolve Sources đang cấu hình → gọi adapter(s)
      ↓
Validate / Normalize (candidate theo field được gán Source)
      ↓
Compare with Market Master
      ↓
Classify: New | Fill empty | Unchanged | Conflict | Missing
      ↓
 ┌─────────────┬──────────────┬────────────────┐
 │ New / Empty │ Unchanged    │ Conflict       │
 │ (Trusted)   │              │                │
 │ Auto Apply  │ No Action    │ Admin Review   │
 └─────────────┴──────────────┴────────────────┘
```

Admin phải thấy field mapping (**configuration**, độc lập nút Import): Entity · Field · Current Source · Trust · Current Value · Last Update.

---



# 22. BR-17 — Import ≠ Apply · No Silent Override

> Import không đồng nghĩa mọi dòng đều vào Master ngay; Apply tuân Trusted Source Apply Policy.

**Trusted Source** (field-level):

- **Auto-Apply** entity mới và field Master đang trống;
- **No Action** khi identical;
- **Admin Review** trước khi Override khi conflict với giá trị Master hiện hữu.

**Không** silent Override giá trị Master đang tồn tại khi mâu thuẫn.

```text
Untrusted / Review Required / Disabled
```

không được Auto-Apply vào Source of Truth (chi tiết Solution).

---



# 23. BR-18 — Change Detection

Mỗi lần import phải xác định:

### New

Có trong external source nhưng chưa có trong iFlux.

### Updated

Đã tồn tại nhưng có field thay đổi.

### Unchanged

Không thay đổi.

### Missing

Có trong iFlux nhưng không còn xuất hiện trong external source.

`Missing` không được mặc định là:

> Delete.

---



# 24. BR-19 — Change Set

Mỗi import phải tạo được Change Set.

Ví dụ:


| Ticker | Field        | Current    | Incoming  | Source | Authority | Result |
| ------ | ------------ | ---------- | --------- | ------ | --------- | ------ |
| ABC    | Company Name | ABC Corp   | ABC Group | DNSE   | Trusted   | Apply  |
| ABC    | Exchange     | HOSE       | HNX       | DNSE   | Trusted   | Review |
| ABC    | Sector       | Technology | Finance   | DNSE   | iFlux     | Reject |
| XYZ    | Market Cap   | 10T        | 11T       | DNSE   | Trusted   | Apply  |


Admin phải biết chính xác:

> Dữ liệu nào thay đổi và tại sao thay đổi đó được hoặc không được áp dụng.

---



# 25. BR-20 — Admin Review

Admin phải có khả năng:

- Review change
- Approve
- Reject
- Apply
- Bỏ qua
- Xem lý do

đối với các thay đổi cần review.

---



# 26. BR-21 — Protected iFlux-owned Fields

Các field thuộc quyền sở hữu của iFlux không được external source tự động overwrite.

Ví dụ:

```text
DNSE:
Sector = Technology

iFlux:
Sector = Finance
```

Nếu Sector là iFlux-owned:

```text
DNSE change
→ Detect
→ Record
→ Review/Reject
```

không được:

```text
DNSE change
→ UPDATE stocks.sector_id
```

---



# 27. BR-22 — Import History

Hệ thống phải lưu lịch sử import.

Tối thiểu:

- Import ID
- Source
- Time
- Admin
- Records received
- New
- Updated
- Unchanged
- Missing
- Applied
- Rejected
- Failed
- Error details
- Change Set

---



# 28. BR-23 — Audit Trail

Mọi quyết định có ảnh hưởng đến SoT phải có khả năng truy nguyên.

Phải biết:

```text
Who
What
When
From
To
Source
Why
Result
```

Mục tiêu:

> Có thể truy nguyên dữ liệu hiện tại của iFlux đến nguồn dữ liệu và quyết định quản trị đã tạo ra nó.

---



# 29. BR-24 — Stocks Admin UI

Trang:

```text
/admin/thi-truong/stocks
```

Danh sách hiện tại:

- Ticker
- Sàn
- Ngành
- Hệ sinh thái
- Thị giá
- Tăng/giảm
- OHLC
- Vốn hóa
- Nhóm vốn hóa
- Trạng thái
- Cập nhật

Các trường được đánh giá là hợp lý về mặt business.

Cần xác minh lại mapping giữa:

> Display label

và:

> Database/API field.

Ví dụ UI hiển thị:

```text
SÀN
```

nhưng copy/paste có thể trả:

```text
TênSàn
```

Hiện tượng này **không được coi là nguyên nhân performance mặc định**.

Audit phải xác định đây là:

- display label
- accessibility label
- DOM text
- data field
- export/copy mapping

hay vấn đề khác.

---



# 30. BR-25 — Stocks Create/Edit

Form Stock phải hỗ trợ:

- Ticker
- Tên công ty
- Sàn
- Ngành
- Hệ sinh thái
- Trạng thái (`status`)
- Mô tả
- Nhóm vốn hóa — select `Large` / `Medium` / `Small` (OD-03)

Không dùng Ngưỡng lô / lot config để thay thế Nhóm vốn hóa.

Hiện trạng:

- Form chưa save được.
- Form không close được.
- Có lỗi JavaScript lifecycle.

Phải được Audit trước khi implementation.

---



# 31. BR-26 — Sector/Ecosystem Admin UI

Trang:

```text
/admin/thi-truong/sectors
/admin/thi-truong/ecosystems
```

phải có:

- List
- Create
- Edit
- Status
- Relationship management
- Description
- Metrics

Form phải sử dụng cùng UX pattern với Stock form.

Form phải được hiển thị dạng:

> **Right-side drawer / side panel**

thay vì form ở trung tâm màn hình.

---



# 32. BR-27 — Admin Performance

Hiện trạng:

> Danh sách Sector/Ecosystem load chậm dù số lượng record rất ít.

Không được giải quyết bằng workaround trước khi xác định root cause.

Audit phải xác định:

- Number of API calls
- Query count
- N+1
- Join
- Index
- Pagination
- Serialization
- Frontend waterfall
- JavaScript loading
- Duplicate requests
- Unnecessary computation
- Network latency
- Database latency

Sau Audit mới quyết định Solution.

---



# 33. BR-28 — Public Frontend Market Pages

Các trang:

```text
/co-phieu
/he-sinh-thai
/nganh

/co-phieu/{ticker}
/he-sinh-thai/{slug}
/nganh/{slug}
```

phải được Audit về:

- Database mapping
- API mapping
- hardcode
- static data
- DNSE dependency
- legacy source
- duplicate resolver
- data transformation

---



# 34. BR-29 — Frontend Must Consume Internal SoT

Target architecture:

```text
Public Frontend
      ↓
Internal API
      ↓
Market Domain Service
      ↓
iFlux PostgreSQL
```

Không được:

```text
Public Frontend
      ↓
DNSE
```

hoặc:

```text
Public Frontend
      ↓
Hardcoded Market Data
```

---



# 35. BR-30 — Consumer Inventory

Audit phải xác định tất cả consumer đang sử dụng:

- Stocks
- Sectors
- Ecosystems

Bao gồm nhưng không giới hạn:

- Community
- Posts
- Stories
- Search
- Watchlist
- Alerts
- Reports
- SEO
- Market pages
- Other Market components

Mục tiêu là tránh phá vỡ consumer khi thay đổi SoT.

---



# 36. BR-31 — External Source Abstraction

Không được hardcode kiến trúc theo:

```text
if source == DNSE
```

ở mọi layer.

Mỗi provider (DNSE, VNDirect, SSI, FiinPro, …) phải là **implementation** của abstraction:

```text
ExternalDataSource
```

không phải một silo “DNSE-only” song song với Market Domain.

Phải hỗ trợ thêm / quản trị:

- DNSE
- VNDirect (và quote/OHLC providers khác)
- SSI / FiinPro (và các nguồn trong `data_sources`)
- Manual CSV
- Internal Upload
- Provider mới

mà không cần thiết kế lại Market Domain.

Xem thêm **BR-11A**.

---



# 37. Mandatory Audit

**Audit là phase bắt buộc nằm trong Business Requirement.**

Không được chuyển sang Solution hoặc Implementation khi Audit chưa hoàn thành và được chấp thuận.

---



# 38. AUDIT-01 — Database Schema Audit

Audit chính xác:

## Stocks

- Table name
- Columns
- Data type
- Nullable
- Default
- PK
- FK
- Unique
- Index
- Constraints
- Status
- Description
- Source fields
- DNSE-related fields
- Timestamp fields



## Sectors

Audit tương tự.

## Ecosystems

Audit tương tự.

---



# 39. AUDIT-02 — Relationship & Ownership Audit

Phải xác định hiện trạng thực tế của:

```text
Stock ↔ Sector
Stock ↔ Ecosystem
```

Kiểm tra các khả năng:

```text
stocks.sector_id
stocks.ecosystem_id
```

hoặc:

```text
stock_sectors
stock_ecosystems
```

hoặc:

```text
sectors.stock_codes
ecosystems.stock_codes
```

hoặc nhiều cơ chế cùng tồn tại.

Phải xác định:

> authoritative source hiện tại là gì?

và:

> Có duplicate ownership hay không?

---



# 40. AUDIT-03 — DNSE Pipeline Audit

Trace toàn bộ:

```text
DNSE
 ↓
Connector
 ↓
Sync / Import
 ↓
Service
 ↓
Repository
 ↓
Database
```

Phải trả lời:

1. DNSE đang ghi vào table nào?
2. Có phải `stocks` không?
3. Có staging table không?
4. Có transformation không?
5. Có validation không?
6. Sync là insert/upsert/update/replace?
7. Field nào được DNSE ghi?
8. DNSE có overwrite Admin data không?
9. Có job tự động không?
10. Có source khác ghi vào Stock không?
11. Có logging không?
12. Có rollback/recovery không?

---



# 41. AUDIT-04 — External Data Source Audit

Kiểm tra:

- External sources hiện có
- Credentials/configuration
- Source registry
- Connector
- Import mechanism
- Sync mechanism
- Trust model
- Field authority
- Change detection
- Import history
- Error handling
- Audit trail

---



# 42. AUDIT-05 — Admin Architecture Audit

Audit ba trang:

```text
/admin/thi-truong/stocks
/admin/thi-truong/sectors
/admin/thi-truong/ecosystems
```

Kiểm tra:

### List

- API
- Endpoint
- Query
- Pagination
- Join
- N+1
- Duplicate requests
- Loading waterfall



### Create

- Form
- Validation
- Event
- API
- Database
- Error



### Edit

Tương tự.

### Delete / Status

Tương tự.

### Form lifecycle

```text
Open
→ Populate
→ Validate
→ Submit
→ Save
→ Refresh
→ Close
```

Phải xác định chính xác bước đang lỗi.

---



# 43. AUDIT-06 — Frontend Source Audit

Audit:

```text
/co-phieu
/he-sinh-thai
/nganh

/co-phieu/{ticker}
/he-sinh-thai/{slug}
/nganh/{slug}
```

Search toàn bộ codebase cho:

- DNSE
- Hardcoded ticker
- Hardcoded sector
- Hardcoded ecosystem
- JSON data
- Static arrays
- Mock data
- Legacy API
- Direct external calls
- Duplicate resolvers

Trace:

```text
HTML
 ↓
JS
 ↓
API
 ↓
Service
 ↓
Database
```

---



# 44. AUDIT-07 — Consumer Inventory Audit

Xác định tất cả consumer của Market Master Data.

Output phải bao gồm:


| Consumer | Entity | Current Source | Access Path | Target Source | Migration Required |
| -------- | ------ | -------------- | ----------- | ------------- | ------------------ |


---



# 45. AUDIT-08 — Performance Root Cause Audit

Đặc biệt với Sectors/Ecosystems.

Không chấp nhận kết luận kiểu:

> "Load chậm do frontend."

Phải có evidence:

```text
Request timing
Query timing
Query count
Network waterfall
JS execution
Database execution
```

---



# 46. AUDIT Deliverables

Audit phải tạo ra tối thiểu:

### A. Current Schema Map

```text
Stocks
Sectors
Ecosystems
Relationships
```



### B. Current Data Flow

```text
DNSE
→ ...
→ Database
```



### C. Current Ownership Map

```text
Entity
Field
Current Owner
Current Writers
Current Readers
```



### D. Admin Architecture Map

```text
Page
→ JS
→ API
→ Service
→ DB
```



### E. Frontend Dependency Map

```text
Page
→ Source
→ API
→ Database
```



### F. Consumer Inventory

Danh sách tất cả consumer.

### G. Performance Evidence

Root cause có evidence.

---



# 47. Source of Truth Governance

Sau khi Audit hoàn thành, phải tạo **SoT Decision**.

Không được tự động sử dụng giả định trong BR làm quyết định cuối cùng.

SoT phải xác định:

## Entity Ownership


| Entity            | Authoritative Owner |
| ----------------- | ------------------- |
| Stock             | TBD by Audit        |
| Sector            | TBD by Audit        |
| Ecosystem         | TBD by Audit        |
| Stock → Sector    | TBD by Audit        |
| Stock → Ecosystem | TBD by Audit        |


---



# 48. Field Ownership Matrix

Phải tạo matrix:


| Entity     | Field                | Authoritative Owner            | External Source                          | Editable         | Derived               |
| ---------- | -------------------- | ------------------------------ | ---------------------------------------- | ---------------- | --------------------- |
| Stock      | Ticker               | TBD                            | DNSE                                     | TBD              | No                    |
| Stock      | Company Name         | TBD                            | DNSE                                     | TBD              | No                    |
| Stock      | Exchange             | TBD                            | DNSE                                     | TBD              | No                    |
| Stock      | Sector               | iFlux/TBD                      | DNSE                                     | Yes              | No                    |
| Stock      | Ecosystem            | iFlux/TBD                      | DNSE                                     | Yes              | No                    |
| Stock      | Market Cap           | iFlux Master sau Apply         | Field-level Trusted source               | No*              | No                    |
| Stock      | Capitalization Group | iFlux Master sau Apply         | Field-level Trusted source và/hoặc Admin | Yes (L/M/S)      | **No** (không engine) |
| Stock      | Description          | iFlux                          | No/TBD                                   | Yes              | No                    |
| Stock      | Status               | iFlux (`status`)               | No                                       | Yes              | No                    |
| Stock      | is_active            | Deprecated / reconcile (OD-01) | No                                       | No               | —                     |
| Stock      | lot_threshold        | iFlux (Ngưỡng lô — riêng)      | No as Cap Group                          | Yes (lot config) | No                    |
| Sector/Eco | divisor              | **Remove** (OD-05)             | —                                        | —                | —                     |


Market Cap editable policy chi tiết khóa ở SoT `03` nếu cần; mặc định intake từ Trusted source + conflict review.

---



# 49. Read Authority

Sau SoT decision, phải xác định một read path chuẩn:

```text
Consumer
 ↓
Internal API / Service
 ↓
Market Domain
 ↓
SoT
```

Không được tồn tại nhiều read paths không có governance.

---



# 50. Write Authority

Mọi write operation phải xác định:

```text
Who
→ Which Service
→ Which Entity
→ Which Field
→ Which Authority
```

Ví dụ:

```text
Admin Stock Edit
→ Market Domain API
→ Stock
→ Sector
→ iFlux authority
```

hoặc:

```text
DNSE Import
→ Import Service
→ Stock
→ Market Cap
→ External authority
```

---



# 51. Solution Requirements

Sau SoT Governance mới xây Solution.

Solution phải bao phủ:

1. Database
2. Relationship model
3. API
4. Market Domain service
5. DNSE adapter
6. Import pipeline
7. Change detection
8. Review mechanism
9. Admin
10. Frontend
11. Audit trail
12. Performance
13. Migration
14. Backward compatibility

---



# 52. Target Conceptual Architecture

Target conceptual model:

```text
                    External Data Sources
                   ┌──────────┬──────────┐
                   │          │          │
                 DNSE      Source B    Source C
                   │          │          │
                   └──────────┴──────────┘
                              │
                       External Source
                           Layer
                              │
                    Import / Validate
                              │
                       Change Detection
                              │
                    ┌─────────┴─────────┐
                    │                   │
                 Trusted             Review
                    │                   │
                    └─────────┬─────────┘
                              │
                         Apply Changes
                              │
                              ▼
                    ┌───────────────────┐
                    │  Market Domain SoT │
                    │   iFlux PostgreSQL │
                    ├───────────────────┤
                    │ Stocks             │
                    │ Sectors            │
                    │ Ecosystems         │
                    │ Relationships      │
                    └─────────┬─────────┘
                              │
                         Internal API
                              │
               ┌──────────────┼──────────────┐
               │              │              │
             Admin         Frontend       Consumers
```

Đây là **conceptual target**, chưa phải implementation decision.

---



# 53. Admin Capability Target

Market Admin dự kiến:

```text
Thị trường
│
├── Stocks
├── Sectors
├── Ecosystems
├── Ngưỡng lô          (lot trade-value — riêng với Cap Group)
└── Market Data Management / Nguồn dữ liệu
```

Nhóm vốn hóa **không** cần trang cấu hình threshold riêng trong scope này (OD-03) — là field trên Stock + intake sync.

### Market Data Management / Nguồn dữ liệu

```text
Nguồn Market data                    ← Source Registry + Detail/staging
Đồng bộ cấu trúc cổ phiếu            ← Field Authority (Stock) + Import/Sync (góc phải)
  └─ Conflict Review (offcanvas)     ← chỉ sau Import; Reject selected → Apply
Lịch sử đồng bộ                      ← History + Audit (chỉ sau Apply thành công)
```

**Import ≠ Apply.** Import/Sync **không** là form chọn Source — xem BR-11 §B.

---



# 54. Implementation Planning Requirements

Sau khi Solution được phê duyệt mới lập Implementation Plan.

Plan dự kiến có thể chia thành:

```text
WP-01 — Market Database / SoT
WP-02 — Relationship Governance
WP-03 — External Data Source Framework
WP-04 — DNSE Import
WP-05 — Change Detection / Review
WP-06 — Admin Stocks
WP-07 — Admin Sectors
WP-08 — Admin Ecosystems
WP-09 — Capitalization Group field + intake (no classification engine)
WP-09b — Divisor removal
WP-09c — Sector → Add Stocks (BR gap)
WP-10 — Public Frontend Migration (Internal API → PG SoT)
WP-11 — Consumer Migration
WP-12 — Performance Optimization
WP-13 — Audit / Verification
WP-14 — status canonical + is_active reconcile
```

Các work package này **chưa được coi là implementation approval**.

---



# 55. Acceptance Criteria

Task chỉ được coi là hoàn thành khi:

## SoT

- Có một authoritative Source of Truth.
- Không còn dual ownership.
- Stock/Sector/Ecosystem relationships được xác định rõ.



## External Source / Market Data Management

- Capability là **Market Data Management** (External Data Source Governance), không phải “DNSE Governance” (BR-11 / BR-11A / OD-04).
- **iFlux Market Master DB = SoT**; Provider chỉ cung cấp candidate data.
- Trust / authority ở **cấp field**, không khóa một provider duy nhất cho toàn domain.
- DNSE, VNDirect, SSI, FiinPro (và nguồn mới) nằm trong cùng registry/governance.
- Trusted Source: Auto-Apply New/Empty; No Action nếu identical; Conflict → Admin Review trước Override (OD-08).
- Không silent Override Master khi conflict; Missing ≠ Delete.
- Market Data Management = Control Plane; Admin thấy Entity×Field×Source×Trust×Current Value.
- Source registry + field trust + import history tồn tại.



## Import

- Import không đồng nghĩa Apply.
- Change detection hoạt động.
- Admin xem được thay đổi.
- Protected fields không bị overwrite.
- Import history được lưu.



## Admin

- Stocks CRUD hoạt động.
- Sectors CRUD hoạt động.
- Ecosystems CRUD hoạt động.
- Form sử dụng đúng drawer pattern.
- Save/Close lifecycle hoạt động.
- Performance root cause đã được xử lý.



## Capitalization / Lot

- Nhóm vốn hóa ≠ Ngưỡng lô (OD-02).
- Cap Group: intake từ Trusted source và/hoặc Admin select L/M/S — **không** classification engine (OD-03).
- Conflict Cap Group / Market Cap từ source khác → review trước Apply.
- `lot_threshold` / `market_lot_config` chỉ phục vụ large-lot logic.
- `divisor` đã được loại khỏi SoT theo plan removal (OD-05).
- Stock lifecycle canonical = `status`; `is_active` reconciled/deprecated (OD-01).
- Sector → Add Stocks đã implement và converge `stocks.sector_id` (OD-06 / BR-05).



## Frontend

- `/co-phieu` dùng internal SoT.
- `/he-sinh-thai` dùng internal SoT.
- `/nganh` dùng internal SoT.
- Các detail pages dùng internal SoT.
- Không còn hardcode Market Master Data.
- Không còn **ungoverned** direct dependency tới external market-data providers trong Public Frontend (DNSE, VNDirect, và tương đương) — mọi intake phải qua Internal API / governed path theo SoT.



## Governance

- Audit trail tồn tại.
- Consumer inventory được xác định.
- Data ownership được document.
- Source/field authority được document.

---



# 56. Non-Functional Requirements



## NFR-01 — Data Integrity

Không được tạo ra hai authoritative values cho cùng một relationship.

## NFR-02 — Traceability

Mọi external change phải truy nguyên được.

## NFR-03 — Extensibility

Có thể thêm external source mới mà không phải thiết kế lại toàn bộ Market Domain.

## NFR-04 — Performance

Performance phải được đánh giá dựa trên evidence và root cause, không dùng workaround thay cho giải pháp kiến trúc.

## NFR-05 — Reliability

External provider unavailable không được làm mất khả năng đọc dữ liệu Market Master Data đã tồn tại trong iFlux.

## NFR-06 — Safety

Import không được tự động overwrite protected iFlux-owned data.

---



# 57. Governance Rules

Các nguyên tắc sau là **MANDATORY**:

### Rule 01

> External Source ≠ Source of Truth.



### Rule 02

> Trusted Source ≠ Full Database Authority.



### Rule 03

> Import ≠ Apply.



### Rule 04

> Multiple UI entry points are allowed; multiple authoritative data stores are not.



### Rule 05

> iFlux-owned fields must not be automatically overwritten by external providers.



### Rule 06

> Missing data from external provider does not automatically mean Delete.



### Rule 07

> Derived data must not be manually maintained as authoritative data.



### Rule 08

> Public Frontend must consume governed internal data.



### Rule 09

> No hardcoded external-provider dependency in Market Domain architecture.



### Rule 10

> No implementation before Audit and SoT Governance approval.

---



# 58. Mandatory Execution Gate

Task này phải được thực hiện theo đúng thứ tự:

```text
┌───────────────────────────────┐
│ 01 — BUSINESS REQUIREMENT     │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ 02 — MANDATORY AUDIT          │
│                               │
│ Schema                        │
│ Relationships                 │
│ DNSE Pipeline                 │
│ External Sources              │
│ Admin                         │
│ Frontend                      │
│ Consumers                     │
│ Performance                   │
└───────────────┬───────────────┘
                │
                ▼
         AUDIT APPROVAL
                │
                ▼
┌───────────────────────────────┐
│ 03 — SoT GOVERNANCE            │
│                               │
│ Entity Ownership              │
│ Field Ownership               │
│ Relationship Ownership        │
│ Source Authority              │
└───────────────┬───────────────┘
                │
                ▼
          SoT APPROVAL
                │
                ▼
┌───────────────────────────────┐
│ 04 — SOLUTION & PLAN          │
└───────────────┬───────────────┘
                │
                ▼
          PLAN APPROVAL
                │
                ▼
┌───────────────────────────────┐
│ 05 — IMPLEMENTATION           │
└───────────────────────────────┘
```

> **CẤM nhảy sang Phase 03 khi Audit chưa được APPROVED.**
>
> **CẤM nhảy sang Solution khi SoT Governance chưa được APPROVED.**
>
> **CẤM implementation khi Solution & Implementation Plan chưa được APPROVED.**

---



# 59. Definition of Done

Task chỉ được đóng khi:

```text
[✓] Business Requirement approved
[✓] Mandatory Audit completed
[✓] Current architecture documented
[✓] Current data ownership documented
[✓] DNSE pipeline documented
[✓] External source model approved
[✓] SoT approved
[✓] Field ownership approved
[✓] Relationship ownership approved
[✓] Solution approved
[✓] Implementation completed
[✓] Database verified
[✓] Admin verified
[✓] Import verified
[✓] Change detection verified
[✓] Frontend verified
[✓] Consumer migration verified
[✓] Performance verified
[✓] Audit trail verified
[✓] No unauthorized external dependency remains
[✓] No dual Source of Truth remains
```

---



# 60. Final Business Outcome

Sau khi hoàn thành, Market Domain của iFlux phải đạt mô hình:

```text
                         EXTERNAL WORLD
                              │
                  ┌───────────┴───────────┐
                  │                       │
                DNSE                 Other Sources
                  │                       │
                  └───────────┬───────────┘
                              │
                              ▼
                    External Data Layer
                              │
                    Validate / Compare
                              │
                    Change Detection
                              │
                 ┌────────────┴────────────┐
                 │                         │
              Trusted                  Review
                 │                         │
                 └────────────┬────────────┘
                              │
                         Apply Decision
                              │
                              ▼
                 ┌────────────────────────┐
                 │    iFlux Market SoT     │
                 │                        │
                 │ Stocks                 │
                 │ Sectors                │
                 │ Ecosystems             │
                 │ Relationships          │
                 │ Internal Metadata      │
                 └───────────┬────────────┘
                             │
                        Internal API
                             │
             ┌───────────────┼───────────────┐
             │               │               │
             ▼               ▼               ▼
           Admin          Frontend        Consumers
```

**Kết quả kinh doanh mong muốn:**

> iFlux không còn phụ thuộc vào DNSE để xác định "dữ liệu của iFlux là gì".

DNSE chỉ cung cấp dữ liệu.

iFlux quyết định:

- dữ liệu nào được tin cậy,
- field nào được nhận,
- field nào được bảo vệ,
- thay đổi nào được áp dụng,
- Sector nào thuộc Stock,
- Ecosystem nào thuộc Stock,
- dữ liệu nào là derived,
- và cuối cùng **giá trị nào là dữ liệu chính thức của iFlux**.

---



# 61. Phase Status


| Phase                | Status                                             | Gate                               |
| -------------------- | -------------------------------------------------- | ---------------------------------- |
| Business Requirement | **DRAFT** (BR-11A + Owner Decisions 02B reflected) | Pending Approval                   |
| Mandatory Audit      | **COMPLETED — PENDING APPROVAL**                   | Không làm lại                      |
| Pre-SoT Verification | **COMPLETED** (`02A`)                              | —                                  |
| Owner Decisions      | **LOCKED** (`02B`)                                 | Input cho SoT `03`                 |
| SoT Governance       | **NOT STARTED**                                    | Blocked until BRD + Audit APPROVED |
| Solution & Plan      | **NOT STARTED**                                    | Blocked                            |
| Implementation       | **NOT AUTHORIZED**                                 | Blocked                            |


> **Current authorized action:** APPROVE BRD (đã clarify OD) + APPROVE Audit → mở `03 — SoT Governance`.
>
> Owner Decisions đã khóa: xem `[02B-Owner-Decisions.md](02B-Owner-Decisions.md)`.
>
> **Không được** implementation trước SoT + Plan APPROVED.

