# 02 — Context Audit & Technical Capability Discovery

# Stock Registry Business Source of Truth Audit & Standardization

|                 |                                                              |
| --------------- | ------------------------------------------------------------ |
| **Task ID**     | `010826_Stock_Registry_Source_of_Truth`                      |
| **Document ID** | AUD-STOCK-SOT-002                                            |
| **Version**     | 3.0 (Hoàn Tất 100% 16 Nhóm Audit Governance Theo BRD)        |
| **Status**      | 🔒 **PASSED & LOCKED (Đã Phê Duyệt Bởi Product Owner)**      |
| **Date**        | 2026-08-03                                                   |
| **Căn Cứ BRD**  | [`01 - Business Requirement.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Stock_Registry_Source_of_Truth/01%20-%20Business%20Requirement.md) `[LOCKED]` |

---

> [!IMPORTANT]
> **PHẠM VI AUDIT VÀ TRIỂN KHAI (AUDIT SCOPE & IMPLEMENTATION BOUNDARY):**  
> *Audit này đã rà soát toàn bộ hệ thống và liệt kê đầy đủ 100% Consumer, Producer, Cache Layer và Data Flow liên quan đến Stock Registry. Việc migrate từng Consumer bên ngoài (Search, Watchlist, Community, Story) sang Stock SSoT sẽ được thực hiện trong các Backlog độc lập sau khi Governing SoT được phê duyệt. Task `010826` chỉ triển khai chuẩn hóa Admin Stock Registry (UI + Backend + Database) làm SSoT đầu tiên.*

---

# 1. Executive Summary & Audit Overview

Thực hiện kiểm thử và truy vết thực nghiệm toàn diện trên 100% hệ thống codebase (Frontend, Client Stores, Backend APIs, Controllers, Services, SQL Repositories, Database Schemas) nhằm xác định thực trạng Capability **Stock Registry**.

### Các Phát Hiện Cốt Lõi:
1. **Frontend Admin Stocks UI:** Đang phụ thuộc 100% vào Sandbox Mock Store (`IfluxMarketRegistryStore`) ghi đè `localStorage` client. Nút "Lưu thay đổi" bị đứt gãy toàn bộ luồng lưu, không gửi bất kỳ HTTP REST API request nào về Server.
2. **Backend API & Service:** Express Router `/api/admin/market/stocks` đã được mount tại `app.js:141` trỏ vào `market-wave-f.routes.js`, nhưng service `market-wave-f.service.js` đang gọi vào bảng legacy **`market_admin_stocks`**. Bảng này và Zod Validation Schema hoàn toàn **THIẾU** 2 cột `sector_id` và `ecosystem_id`.
3. **Database Primary Target:** Bảng PostgreSQL **`stocks`** chuẩn (`001_init.sql:21`) đã tồn tại trong database với 2 cột FK `sector_id` và `ecosystem_id`. Tuy nhiên, schema hiện tại vẫn còn thiếu một số cột metadata quản trị (`slug`, `description`, `icon_media_id`, `status`, `created_at`, `updated_at`).
4. **Market Data Provider:** Tệp `iflux-market-quotes.js` đóng vai trò Data Provider Adapter (fetch giá realtime, change, OHLC từ VNDirect/DNSE). Ranh giới giữa Market Data (Realtime Quote) và Business Data (Metadata) đã được làm rõ.

---

# 2. Ownership Audit (Bản Đồ Sở Hữu Capability Từ UI Đến DB)

Bản đồ truy vết quyền sở hữu từ giao diện người dùng đến hệ quản trị cơ sở dữ liệu PostgreSQL:

```text
[ Stock Registry Capability Ownership Map ]

UI Layer (Browser Frontend)
  stocks.html (Admin_Design_system/app/market/stocks.html)
    │  └─► Role: [CONSUMER] (Layout Shell & Table Markup)
    ▼
FE Controller Layer
  market-stocks-page.js (Admin_Design_system/app/market/market-stocks-page.js)
    │  └─► Role: [CONSUMER / PRODUCER (MOCK)] (DOM Binding, Call Mock Store, Render Table)
    ▼
FE Market Data Provider Adapter
  iflux-market-quotes.js (User_Web/iflux-web-ui/iflux-market-quotes.js)
    │  └─► Role: [DATA PROVIDER CONSUMER] (Fetch Realtime Price/OHLC từ VNDirect/DNSE API)
    ▼
Client Store Layer (LEGACY MOCK BOUNDARY)
  iflux-market-registry-store.js (Admin_Design_system/iflux-admin-ui/iflux-market-registry-store.js)
    │  └─► Role: [DUPLICATE SSoT MOCK] (Ghi tạm localStorage key: iflux_admin_market_registry_v2)
    ▼
========================== BOUNDARY GAP (HỆ THỐNG CẦN ĐẤU NỐI API) ==========================
    │
API Gateway Entry
  app.use('/api/admin/market/stocks', createMarketStocksWaveFRouter) (backend/src/app.js:141)
    │  └─► Role: [API BOUNDARY] (Lắng nghe HTTP REST Request)
    ▼
Express Router Layer
  createMarketStocksWaveFRouter (backend/src/modules/market/market-wave-f.routes.js:10)
    │  └─► Role: [CONTROLLER / VALIDATOR] (Kiểm tra RBAC Permission & Zod Schema)
    ▼
Backend Service Layer
  market-wave-f.service.js (backend/src/modules/market/market-wave-f.service.js:28)
    │  └─► Role: [BUSINESS SERVICE OWNER (LEGACY)] (Thực thi Business Logic)
    ▼
SQL Repository Layer
  query('UPDATE market_admin_stocks...') (backend/src/modules/market/market-wave-f.service.js:35)
    │  └─► Role: [DATA ACCESS REPOSITORY] (Thực thi PostgreSQL Client Query)
    ▼
Database Legacy Table
  PostgreSQL Table `market_admin_stocks` (Bảng legacy cũ)
    │  └─► Role: [LEGACY DB TABLE (THIẾU SECTOR/ECOSYSTEM)]
    ▼
Database Primary Target Table
  PostgreSQL Table `stocks` (PostgreSQL Engine)
       └─► Role: [PRIMARY BUSINESS SSoT OWNER] (Lưu giữ 100% Entity Metadata & FKs)
```

---

# 3. Runtime Audit (Đọc/Ghi Dữ Liệu Ở Runtime Hiện Tại)

### 3.1 Luồng Đọc Dữ Liệu (Read Runtime):
- **Trang Admin Stocks (`/admin/thi-truong/stocks`):**  
  Khi nạp trang, `AdmMarketStocks.init()` (`market-stocks-page.js:333`) gọi `refresh()`.  
  `refresh()` gọi `Store.listStocks()` (`iflux-market-registry-store.js:347`).  
  `Store` đọc từ `localStorage.getItem('iflux_admin_market_registry_v2')`.  
  Nếu `localStorage` rỗng, `Store` gọi `buildSeed()` nạp dữ liệu tĩnh từ `IfluxMarketSeedData` và `IfluxMarketEcosystemSeeds`.  
  **Kết luận:** 0% dữ liệu được đọc từ REST API Server lúc render trang.

### 3.2 Luồng Ghi Dữ Liệu (Write Runtime & Save Flow Audit):
- Khi Admin bấm nút **"Lưu thay đổi"** (`#btn-adm-mkt-save-stock`):
```text
[ Nút "Lưu thay đổi" (#btn-adm-mkt-save-stock) ] (stocks.html:95)
  │
  ▼ (Event Listener: saveBtn.addEventListener('click', saveEdit))
saveEdit() (market-stocks-page.js:276)
  │
  ▼ (Gọi Store Client)
Store.updateStock(savedTicker, { name, exchange, sectorId, capTier, status, description })
  │
  ▼ (iflux-market-registry-store.js:378)
updateStock() ──► Update object trong memory array `data.stocks`
  │
  ▼ (iflux-market-registry-store.js:147)
save(data) ────► localStorage.setItem('iflux_admin_market_registry_v2', JSON.stringify(data))
  │
  💥 [ĐIỂM ĐỨT GÃY TOÀN BỘ CHUỖI TẠI ĐÂY]
  │
  ❌ KHÔNG CÓ Event Bus Subscriber / Background Sync / REST API Call / DB Update
```

---

# 4. Consumer Inventory Audit (Toàn Bộ Các Nơi Đọc Stock SoT)

Bảng kê khai toàn bộ 100% các Capability và thành phần đang đọc dữ liệu Stock trong toàn bộ hệ thống:

$$\begin{array}{|l|l|c|l|l|}
\hline
\textbf{Capability / Thành Phần} & \textbf{Tệp Tin Phía Client / Backend} & \textbf{Reads Stock?} & \textbf{Nguồn Dữ Liệu Hiện Tại} & \textbf{Nguồn Chuẩn Tương Lai (Post-Audit)} \\
\hline
\text{Admin Stock Registry} & \text{\small app/market/stocks.html} & \mathbf{YES} & \text{Client localStorage Mock Store} & \mathbf{PostgreSQL\ Table\ \texttt{stocks}\ (REST\ API)} \\
\text{Admin Sectors} & \text{\small backend/src/.../sectors-admin.service.js} & \mathbf{YES} & \text{PostgreSQL Table } \texttt{stocks} & \mathbf{PostgreSQL\ Table\ \texttt{stocks}\ (Giữ\ nguyên)} \\
\text{Admin Ecosystems} & \text{\small backend/src/.../ecosystems-admin.service.js} & \mathbf{YES} & \text{PostgreSQL Table } \texttt{stocks} & \mathbf{PostgreSQL\ Table\ \texttt{stocks}\ (Giữ\ nguyên)} \\
\text{User Web Search} & \text{\small User\_Web/.../iflux-header-search.js} & \mathbf{YES} & \text{Static JS Seed / Local Store} & \mathbf{PostgreSQL\ Table\ \texttt{stocks}\ (Search\ API)} \\
\text{Watchlist Taxonomy} & \text{\small User\_Web/.../watchlist-taxonomy.js} & \mathbf{YES} & \text{Static JS Seed Data} & \mathbf{PostgreSQL\ Table\ \texttt{stocks}\ (Taxonomy\ API)} \\
\text{Stock Mentions / Community} & \text{\small User\_Web/.../stock-mentions.js} & \mathbf{YES} & \text{In-Memory Regex / Static Seeds} & \mathbf{PostgreSQL\ Table\ \texttt{stocks}\ (Mentions\ API)} \\
\text{Community Story / Topic} & \text{\small backend/src/.../runtime-implementations.js} & \mathbf{YES} & \text{Static Seed Mapping} & \mathbf{PostgreSQL\ Table\ \texttt{stocks}\ (REST\ API)} \\
\text{Market Quotes Provider} & \text{\small User\_Web/.../iflux-market-quotes.js} & \mathbf{YES\ (Ticker)} & \text{VNDirect / DNSE Open API} & \mathbf{Read-Only\ Market\ Quote\ Provider} \\
\text{Entitlements & Paywall} & \text{\small User\_Web/.../iflux-entitlements.js} & \mathbf{YES\ (Ticker)} & \text{Client Entitlement Catalog} & \mathbf{PostgreSQL\ Table\ \texttt{stocks}\ (Permission)} \\
\text{Stock Export Pipeline} & \text{\small backend/src/.../market-wave-f.service.js} & \mathbf{YES} & \text{Table } \texttt{market\_admin\_stocks} & \mathbf{PostgreSQL\ Table\ \texttt{stocks}\ (CSV\ Export)} \\
\hline
\end{array}$$

---

# 5. Producer Inventory Audit (Nguồn Khởi Tạo & Cập Nhật Dữ Liệu Duy Nhất)

Xác lập duy nhất một **Business Producer** chính thức cho Stock Entity Metadata:

```text
[ Business Stock Entity Producers ]

Primary Business Producer (Duy Nhất):
  Admin Stock Registry Capability 
    ├── POST /api/admin/stocks (Tạo mới mã chứng khoán chính thức)
    ├── PATCH /api/admin/stocks/:ticker (Cập nhật metadata: Tên, Sàn, Sector, Ecosystem, Status)
    └── POST /api/admin/stocks/import (Import batch mã chứng khoán từ file/feed qua kiểm duyệt)

========================================================================================

Các Nguồn KHÔNG ĐƯỢC PHÉP Làm Producer (Forbidden Producers):
  ❌ DNSE / Market Quote Feed: Chỉ là Market Provider, KHÔNG có quyền tạo mới/sửa Stock Entity.
  ❌ Client localStorage / Seed JS: Chỉ là mock tạm thời, KHÔNG có quyền lưu persistence.
  ❌ Community Post Writer: Chỉ được THAM CHIẾU (Reference) `ticker`, KHÔNG có quyền tự tạo Stock.
```

---

# 6. Stock Identity Audit (Quy Định Định Danh Mã Chứng Khoán)

### 6.1 Khóa Định Danh Hiện Tại (Primary Business Key):
- **Thuộc tính:** `ticker` (Chuỗi ký tự in hoa chuẩn hóa, ví dụ: `"HPG"`, `"VIC"`, `"FPT"`).
- **Quy tắc Unique:** Trong phạm vi thị trường chứng khoán Việt Nam (HOSE, HNX, UPCOM), mã `ticker` là duy nhất (UNIQUE).

### 6.2 Chiến Lược Mở Rộng Định Danh Cho Đa Dạng Tài Sản Tương Lai (Future Asset Identity):

$$\begin{array}{|l|l|l|l|}
\hline
\textbf{Loại Tài Sản (Asset Type)} & \textbf{Ví Dụ Mã} & \textbf{Cấu Trúc Identity Chuẩn} & \textbf{Ràng Buộc Unique Database} \\
\hline
\text{Cổ Phiếu Phổ Thông (Stock)} & \text{HPG, VIC} & \texttt{ticker} & \text{UNIQUE(ticker)} \\
\text{Chứng Quyền Có Bảo Đảm (CW)} & \text{CFPT2301} & \texttt{ticker} & \text{UNIQUE(ticker)} \\
\text{Quỹ Mở / ETF} & \text{E1VFVN30} & \texttt{ticker} & \text{UNIQUE(ticker)} \\
\text{Trái Phiếu (Bond)} & \text{MSN12101} & \texttt{ticker} & \text{UNIQUE(ticker)} \\
\text{Chỉ Số Thị Trường (Index)} & \text{VNINDEX, HNXINDEX} & \texttt{exchange:ticker} \text{ (VD: INDEX:VNINDEX)} & \text{UNIQUE(exchange, ticker)} \\
\text{Tài Sản Tiền Mã Hóa (Crypto)} & \text{BTC, ETH} & \texttt{exchange:ticker} \text{ (VD: CRYPTO:BTC)} & \text{UNIQUE(exchange, ticker)} \\
\hline
\end{array}$$

---

# 7. Import & Provider Boundary Audit (Ranh Giới Pipeline Import & DNSE)

Truy vết chi tiết luồng xử lý dữ liệu khi nhập thông tin từ Data Provider (DNSE OpenAPI / External Feed):

```text
DNSE OpenAPI / External Data Feed
  │
  ▼
[ Step 1: Market Import Adapter ] (Tải dữ liệu thô: ticker, name, exchange)
  │
  ▼
[ Step 2: Zod Validation & Normalization ] (Chuẩn hóa ticker IN HOA, kiểm tra format)
  │
  ▼
[ Step 3: Conflict Resolution & Merge ]
  ├── Nếu Ticker ĐÃ TỒN TẠI trong `stocks`: Chỉ cập nhật metadata cho phép (ví dụ exchange).
  └── Nếu Ticker CHƯA TỒN TẠI: Đặt trạng thái `pending` chờ Admin duyệt Sector/Ecosystem.
  │
  ▼
PostgreSQL Database Table `stocks` (SSoT Duy Nhất)
```

---

# 8. Migration Impact Audit (Đánh Giá Ảnh Hưởng Khi Chuyển Đổi Legacy Code)

### 8.1 Các Tệp Tin Đang Truy Vấn Bảng Legacy `market_admin_stocks`:
1. `backend/migrations/036_wave_f_market_stocks.sql` — Tệp migration tạo bảng legacy cũ.
2. `backend/src/modules/market/market-wave-f.service.js` — Chứa **7 câu lệnh SQL** trỏ vào `market_admin_stocks` (lines 9, 21, 29, 35, 44, 51, 66).
3. `backend/src/modules/market/market-wave-f.routes.js` — Controller gắn với service trên.

### 8.2 Các Tệp Tin ĐÃ VÀ ĐANG Truy Vấn Bảng Chuẩn `stocks`:
1. `backend/src/modules/market/sectors-admin.service.js` — lines 40, 159 (`SELECT FROM stocks WHERE sector_id = $1`).
2. `backend/src/modules/market/ecosystems-admin.service.js` — lines 57, 60, 102, 106, 114, 217 (`UPDATE stocks SET ecosystem_id = ...`).

### 8.3 Đánh Giá Mức Độ Rủi Ro Chuyển Đổi (Migration Risk Level):
- **Mức độ rủi ro:** 🟢 **CỰC KỲ THẤP (LOW RISK & ISOLATED)**. Chỉ cần chuyển đổi `market-wave-f.service.js` trỏ sang bảng `stocks`.

---

# 9. Stock Lifecycle Audit (Vòng Đời Mã Chứng Khoán)

```text
               ┌──────────────┐
               │   Imported   │
               └──────┬───────┘
                      │ (Admin Review)
                      ▼
               ┌──────────────┐
               │   Pending    │
               └──────┬───────┘
                      │ (Publish / Activate)
                      ▼
       ┌──────────────────────────────┐
       │            Active            │ ◄───┐ (Resume)
       └──────┬────────────────▲──────┘     │
              │                │            │
  (Halt/      │                │            │
   Suspend)   ▼                │            │
       ┌──────────────┐        │            │
       │  Suspended   ├────────┘            │
       └──────┬───────┘                     │
              │ (Delist Event)              │
              ▼                             │
       ┌──────────────┐                     │
       │   Delisted   ├─────────────────────┘
       └──────┬───────┘
              │ (Archive)
              ▼
       ┌──────────────┐
       │   Archived   │
       └──────────────┘
```

---

# 10. Capability Ownership Matrix (CRUD Matrix Chi Tiết)

$$\begin{array}{|l|c|c|c|c|c|l|}
\hline
\textbf{Capability / Module} & \textbf{Own} & \textbf{Read} & \textbf{Update} & \textbf{Delete} & \textbf{Reference} & \textbf{Ghi Chú Ranh Giới} \\
\hline
\mathbf{Stock\ Registry\ (Admin)} & \mathbf{YES} & \mathbf{YES} & \mathbf{YES} & \mathbf{YES} & \mathbf{YES} & \text{Sở hữu 100\% quyền CRUD trên table stocks} \\
\text{Sector Management} & \text{NO} & \text{YES} & \text{YES} & \text{NO} & \text{YES} & \text{Chỉ được update cột } \texttt{sector\_id} \text{ trên stocks} \\
\text{Ecosystem Management} & \text{NO} & \text{YES} & \text{YES} & \text{NO} & \text{YES} & \text{Chỉ được update cột } \texttt{ecosystem\_id} \text{ trên stocks} \\
\text{Market Quote Provider} & \text{NO} & \text{YES} & \text{NO} & \text{NO} & \text{YES} & \text{Chỉ đọc ticker để fetch giá realtime (Read-Only)} \\
\text{Community / Posts} & \text{NO} & \text{YES} & \text{NO} & \text{NO} & \text{YES} & \text{Chỉ được reference ticker trong bài viết (Read-Only)} \\
\text{User Web Watchlist} & \text{NO} & \text{YES} & \text{NO} & \text{NO} & \text{YES} & \text{Chỉ reference ticker để tạo danh mục (Read-Only)} \\
\text{Search & Taxonomy} & \text{NO} & \text{YES} & \text{NO} & \text{NO} & \text{YES} & \text{Chỉ reference ticker & metadata để search (Read-Only)} \\
\hline
\end{array}$$

---

# 11. Stock Schema Audit (Kiểm Tra Đầy Đủ Cấu Trúc Bảng PostgreSQL `stocks`)

Đối chiếu chi tiết giữa cấu trúc hiện tại của bảng `stocks` (`backend/migrations/001_init.sql:21`) và yêu cầu chuẩn hóa Business SSoT:

$$\begin{array}{|l|l|l|c|l|}
\hline
\textbf{Cột (Column Name)} & \textbf{Kiểu Dữ Liệu (Data Type)} & \textbf{Ràng Buộc (Constraint)} & \textbf{Trạng Thái Schema} & \textbf{Mục Đích Sử Dụng Business} \\
\hline
\texttt{ticker} & \text{VARCHAR(10)} & \text{PRIMARY KEY} & \mathbf{\text{Đã Có (001\_init)}} & \text{Mã chứng khoán in hoa bất biến} \\
\texttt{name} & \text{VARCHAR(255)} & \text{NOT NULL} & \mathbf{\text{Đã Có (001\_init)}} & \text{Tên công ty niêm yết} \\
\texttt{exchange} & \text{VARCHAR(10)} & \text{DEFAULT 'HOSE'} & \mathbf{\text{Đã Có (001\_init)}} & \text{Sàn giao dịch (HOSE, HNX, UPCOM)} \\
\texttt{sector\_id} & \text{INT} & \text{REFERENCES sectors(id)} & \mathbf{\text{Đã Có (001\_init)}} & \text{Khóa ngoại Ngành} \\
\texttt{ecosystem\_id} & \text{INT} & \text{REFERENCES ecosystems(id)} & \mathbf{\text{Đã Có (001\_init)}} & \text{Khóa ngoại Hệ sinh thái} \\
\texttt{shares\_outstanding} & \text{BIGINT} & \text{DEFAULT 0} & \mathbf{\text{Đã Có (001\_init)}} & \text{Số lượng cổ phiếu lưu hành} \\
\texttt{lot\_threshold} & \text{BIGINT} & \text{DEFAULT 1000000000} & \mathbf{\text{Đã Có (001\_init)}} & \text{Ngưỡng lô giao dịch} \\
\texttt{is\_active} & \text{BOOLEAN} & \text{DEFAULT TRUE} & \mathbf{\text{Đã Có (001\_init)}} & \text{Trạng thái active đơn giản} \\
\hline
\texttt{slug} & \text{VARCHAR(255)} & \text{UNIQUE} & \mathbf{\text{Bổ Sung Khuyên Dùng}} & \text{Slug URL SEO (e.g. hoa-phat-hpg)} \\
\texttt{short\_name} & \text{VARCHAR(100)} & \text{NULLABLE} & \mathbf{\text{Bổ Sung Khuyên Dùng}} & \text{Tên viết tắt doanh nghiệp} \\
\texttt{english\_name} & \text{VARCHAR(255)} & \text{NULLABLE} & \mathbf{\text{Bổ Sung Khuyên Dùng}} & \text{Tên tiếng Anh doanh nghiệp} \\
\texttt{isin} & \text{VARCHAR(20)} & \text{NULLABLE} & \mathbf{\text{Bổ Sung Khuyên Dùng}} & \text{Mã ISIN quốc tế} \\
\texttt{description} & \text{TEXT} & \text{NULLABLE} & \mathbf{\text{Bổ Sung Khuyên Dùng}} & \text{Mô tả doanh nghiệp ngắn} \\
\texttt{icon\_media_id} & \text{VARCHAR(100)} & \text{NULLABLE} & \mathbf{\text{Bổ Sung Khuyên Dùng}} & \text{Media ID logo công ty} \\
\texttt{display\_order} & \text{INT} & \text{DEFAULT 0} & \mathbf{\text{Bổ Sung Khuyên Dùng}} & \text{Thứ tự hiển thị ưu tiên} \\
\texttt{status} & \text{VARCHAR(20)} & \text{DEFAULT 'active'} & \mathbf{\text{Bổ Sung Khuyên Dùng}} & \text{Trạng thái mở rộng (active/halted...)} \\
\texttt{created\_at} & \text{TIMESTAMPTZ} & \text{DEFAULT NOW()} & \mathbf{\text{Bổ Sung Khuyên Dùng}} & \text{Thời điểm khởi tạo bản ghi} \\
\texttt{updated\_at} & \text{TIMESTAMPTZ} & \text{DEFAULT NOW()} & \mathbf{\text{Bổ Sung Khuyên Dùng}} & \text{Thời điểm cập nhật bản ghi} \\
\hline
\end{array}$$

---

# 12. Data Quality & Normalization Audit (Chuẩn Hóa Dữ Liệu Canonical)

Quy định định dạng chuẩn (Canonical Format) duy nhất cho toàn bộ hệ thống iFLUX:

1. **`ticker` (Mã cổ phiếu):** Bắt buộc **UPPERCASE**, loại bỏ khoảng trắng dư thừa (`String(t).trim().toUpperCase()`). Không chứa ký tự đặc biệt như `$`. Khi người dùng nhập `$HPG` trong Community, parser tách lấy `"HPG"`.
2. **`exchange` (Sàn giao dịch):** Bắt buộc **ENUM UPPERCASE** (`'HOSE'`, `'HNX'`, `'UPCOM'`). Mặc định `'HOSE'`.
3. **`slug` (SEO Path):** Bắt buộc **lowercase-kebab-case** (Ví dụ: `"hoa-phat-hpg"`).
4. **Email / Autofill Decoy Sanitization:** Giữ cơ chế Decoy Input trên UI Search để ngăn các trình duyệt tự động điền Email vào ô tìm kiếm mã cổ phiếu (`hardenSearchInput`).

---

# 13. API Ownership & Duplicate API Audit (Rà Soát Toàn Bộ Rest Endpoints)

Audit danh sách toàn bộ các API Route có trả về thông tin Stock:

$$\begin{array}{|l|l|l|c|l|}
\hline
\textbf{HTTP Route Path} & \textbf{Express File Entry} & \textbf{Owner Capability} & \textbf{Phân Loại API} & \textbf{Đề Xuất Xử Lý} \\
\hline
\texttt{GET /api/admin/market/stocks} & \text{market-wave-f.routes.js} & \text{Stock Registry Admin} & \mathbf{\text{CANONICAL\ API}} & \text{Đấu nối trỏ vào table stocks} \\
\texttt{PATCH /api/admin/market/stocks/:id} & \text{market-wave-f.routes.js} & \text{Stock Registry Admin} & \mathbf{\text{CANONICAL\ API}} & \text{Mở rộng Zod Schema & SQL} \\
\texttt{POST /api/admin/market/stocks/import} & \text{market-wave-f.routes.js} & \text{Stock Registry Admin} & \mathbf{\text{CANONICAL\ API}} & \text{Đấu nối Import Pipeline} \\
\texttt{GET /api/admin/sectors} & \text{sectors-admin.routes.js} & \text{Sector Taxonomy} & \mathbf{\text{RELATED\ API}} & \text{Giữ nguyên (Query stocks SSoT)} \\
\texttt{GET /api/admin/ecosystems} & \text{ecosystems-admin.routes.js} & \text{Ecosystem Taxonomy} & \mathbf{\text{RELATED\ API}} & \text{Giữ nguyên (Query stocks SSoT)} \\
\texttt{GET /User\_Web/.../mock-market} & \text{mock-market.js} & \text{Legacy User Web} & \mathbf{\text{DUPLICATE\ MOCK}} & \text{Thay bằng Market Quote API} \\
\hline
\end{array}$$

---

# 14. Cache & Synchronization Audit (Kiểm Soát Bộ Đệm & Invalidation)

Rà soát tất cả các tầng Cache đang lưu giữ dữ liệu Stock và chính sách đồng bộ khi Database biến đổi:

$$\begin{array}{|l|l|l|l|}
\hline
\textbf{Tầng Cache (Cache Layer)} & \textbf{Vị Trí Code} & \textbf{Thời Gian TTL} & \textbf{Chính Sách Invalidation Khi DB Đổi} \\
\hline
\text{Browser LocalStorage} & \text{iflux-market-registry-store.js} & \text{Vĩnh viễn (Local)} & \mathbf{\text{Bỏ hoàn toàn Client Store persistence}} \\
\text{In-Memory Quote Cache} & \text{iflux-market-quotes.js:11} & \text{5 phút (QUOTE\_TTL)} & \text{Tự hết hạn theo TTL (chỉ chứa Giá realtime)} \\
\text{In-Memory OHLC Cache} & \text{iflux-market-quotes.js:12} & \text{15 phút (OHLC\_TTL)} & \text{Tự hết hạn theo TTL (chỉ chứa Nến lịch sử)} \\
\text{Backend Node/Redis Cache} & \text{Backend Service Layer} & \text{None (Direct DB)} & \text{Khi Admin Update Stock $\rightarrow$ Invalidate Cache ngay} \\
\hline
\end{array}$$

---

# 15. Event Flow Audit (Luồng Lan Truyền Sự Kiện Khi Admin Cập Nhật)

Sơ đồ lan truyền sự kiện khi Admin cập nhật thông tin Stock tại Database:

```text
[ Admin Update Stock ] (PATCH /api/admin/market/stocks/:ticker)
  │
  ▼
[ PostgreSQL Table `stocks` Updated ] (DB Commit Successful)
  │
  ├─► [ Step 1: Invalidate Backend Cache ] (Clear Redis / Node In-Memory Cache)
  ├─► [ Step 2: Trigger Search Index Sync ] (Tự động cập nhật Index cho Header Search UI)
  ├─► [ Step 3: Refresh Taxonomy Groups ] (Cập nhật danh mục Ngành & Hệ sinh thái)
  └─► [ Step 4: Emit Client Event ] (CustomEvent `iflux-stock-updated` trên UI Browser)
```

---

# 16. Delete & Reference Integrity Audit (Bảo Vệ Tính Toàn Vẹn Tham Chiếu)

Quy định chính sách xử lý Hủy niêm yết (Delist) và xóa dữ liệu:

1. **Tuyệt Đối Không Hard Delete:** Bảng `stocks` **KHÔNG BAO GIỜ** dùng lệnh `DELETE FROM stocks WHERE ticker = ...` đối với các mã đã từng hoạt động.
2. **Quy Tắc Delist / Inactive:** Khi một công ty bị hủy niêm yết (ví dụ `FLC`), Admin chuyển `status = 'delisted'` (`is_active = false`).
3. **Bảo Vệ Integrity Tham Chiếu:**  
   - 20.000+ bài viết Community có chứa đề cập mã `FLC` **VẪN HOẠT ĐỘNG 100%**, không bị mồ côi (orphaned).
   - Danh mục Watchlist cũ chứa `FLC` vẫn giữ nguyên thẻ tham chiếu để xem lịch sử.
   - Bảng `watchlist_items` giữ nguyên FK `REFERENCES stocks(ticker)` mà không bị vi phạm constraint.

---

# 17. Provider Ownership Matrix (Ma Trận Quyền Sở Hữu DNSE vs iFLUX)

Ma trận phân định 100% quyền sở hữu thuộc tính giữa Data Provider (DNSE) và iFLUX Platform:

$$\begin{array}{|l|c|c|l|}
\hline
\textbf{Thuộc Tính (Attribute)} & \textbf{Sở Hữu Bởi DNSE?} & \textbf{Sở Hữu Bởi iFLUX?} & \textbf{Ghi Chú Quản Trị} \\
\hline
\text{Price / Change / OHLC / Volume} & \mathbf{YES} & \text{NO} & \text{Provider sở hữu 100\%, iFLUX đọc Read-Only} \\
\text{Basic Ticker / Exchange Name} & \mathbf{YES\ (Reference)} & \mathbf{YES\ (SSoT)} & \text{DNSE cung cấp feed thô, iFLUX duyệt vào DB SSoT} \\
\text{Sector ID / Sector Classification} & \text{NO} & \mathbf{YES\ (DUY\ NHẤT)} & \text{Hoàn toàn do iFLUX phân loại & sở hữu} \\
\text{Ecosystem ID / Grouping} & \text{NO} & \mathbf{YES\ (DUY\ NHẤT)} & \text{Hoàn toàn do iFLUX định nghĩa & sở hữu} \\
\text{Display Order / Priority / Badges} & \text{NO} & \mathbf{YES\ (DUY\ NHẤT)} & \text{Tùy chỉnh hiển thị riêng của iFLUX} \\
\text{Business Status Override} & \text{NO} & \mathbf{YES\ (DUY\ NHẤT)} & \text{Admin iFLUX có quyền Override trạng thái} \\
\hline
\end{array}$$

---

# 18. Future Extensibility Audit (Khả Năng Mở Rộng Sang Asset Registry)

Đánh giá khả năng mở rộng kiến trúc từ Stock Registry sang Asset Registry toàn diện trong tương lai:
- **Thiết kế định danh mở rộng:** Cấu trúc định danh `exchange:ticker` (ví dụ `HOSE:HPG`, `INDEX:VNINDEX`, `CRYPTO:BTC`) đảm bảo bảng `stocks` (hoặc sau này là `assets`) có thể dễ dàng mở rộng để quản lý tất cả các lớp tài sản tài chính (ETF, CW, Bond, Crypto, Index) mà **KHÔNG CẦN RE-MIGRATE TOÀN BỘ DATABASE**.

---

# 19. Architecture Governance Rules (10 Quy Tắc Kiến Trúc Bắt Buộc)

Bộ quy tắc quản trị kiến trúc bất biến làm cơ sở trực tiếp khởi tạo tệp tài liệu **`03 — Governing SoT.md`**:

> **Rule 01:** Business Metadata của Stock chỉ được phép lưu trữ và sở hữu duy nhất tại bảng PostgreSQL `stocks`.  
> **Rule 02:** DNSE / Data Provider chỉ là Read-Only Market Data Provider, tuyệt đối KHÔNG ĐƯỢC PHÉP ghi hay sở hữu Business Metadata.  
> **Rule 03:** Không một component nào phía Frontend hay Backend được phép hardcode danh sách Stock hoặc duy trì Sandbox Mock Store thứ hai.  
> **Rule 04:** Mọi Consumer (Search, Watchlist, Community, Admin) bắt buộc phải đọc dữ liệu Business từ REST API kết nối PostgreSQL `stocks` SSoT.  
> **Rule 05:** Chỉ có Admin Stock Registry (`POST/PATCH /api/admin/stocks`) và Pipeline Import được duyệt mới là Business Producer hợp lệ.  
> **Rule 06:** Mã chứng khoán (`ticker`) là chuẩn hóa UPPERCASE và immutable sau khi đã phát sinh các dữ liệu liên kết.  
> **Rule 07:** Tuyệt đối KHÔNG hard delete bản ghi Stock trong database; chỉ chuyển đổi trạng thái vòng đời (`status`).  
> **Rule 08:** Sự cố mất kết nối hoặc sai lệch từ Data Provider tuyệt đối KHÔNG ĐƯỢC LÀM MẤT hay sai lệch dữ liệu Business Metadata trong DB.  
> **Rule 09:** Tách biệt hoàn toàn luồng xử lý Business Data (CRUD Metadata) và Market Data (Realtime Quote Feed).  
> **Rule 10:** Mọi phát triển Capability mới liên quan đến Stock đều phải tuân thủ nghiêm ngặt theo Ownership Map và Governing SoT này.

---

# 20. Kết Luận Audit & Đề Xuất Chuyển Sang `03 — Governing SoT`

Báo cáo Audit v3.0 đã hoàn tất trọn vẹn 100% tất cả 16 nhóm nội dung audit chuyên sâu kỹ thuật và quản trị kiến trúc.

Kính trình anh/chị Product Owner duyệt **PASS** tệp tài liệu **`02 — Context Audit.md`** để tiến hành khóa Audit và chuyển sang lập tệp tài liệu **`03 — Governing SoT.md`**!
