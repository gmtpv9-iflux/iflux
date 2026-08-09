# 03 — Governing Source of Truth (Governing SoT)

# Stock Registry Business Source of Truth Governance Specification

|                 |                                                              |
| --------------- | ------------------------------------------------------------ |
| **Task ID**     | `010826_Stock_Registry_Source_of_Truth`                      |
| **Document ID** | SOT-STOCK-GOV-003                                            |
| **Version**     | 1.0                                                          |
| **Status**      | 🔒 **LOCKED (Khóa Cố Định — Quy Chuẩn Quản Trị Hệ Thống)**   |
| **Date**        | 2026-08-03                                                   |
| **Căn Cứ BRD**  | [`01 - Business Requirement.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Stock_Registry_Source_of_Truth/01%20-%20Business%20Requirement.md) `[LOCKED]` |
| **Căn Cứ Audit**| [`02 - Context Audit.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Stock_Registry_Source_of_Truth/02%20-%20Context%20Audit.md) `[PASSED & LOCKED]` |

---

# 1. Primary Business Source of Truth Specification

Xác lập chuẩn hóa hệ quản trị cơ sở dữ liệu và bảng lưu trữ duy nhất làm **Business Source of Truth (SSoT)** cho Capability Stock Registry:

### 1.1 Khái Niệm SSoT Duy Nhất
* **Business Source of Truth Duy Nhất:** **PostgreSQL Database — Table `stocks`**.
* Bảng `stocks` sở hữu 100% quyền thống trị đối với Business Entity Metadata của cổ phiếu trên toàn hệ thống iFLUX.
* Tuyệt đối không tồn tại bảng cơ sở dữ liệu thứ hai (như `market_admin_stocks`), Client Memory Store (như `IfluxMarketRegistryStore`), hay tệp tin JSON/JS Seed nào được phép đóng vai trò Business SoT.

### 1.2 Phạm Vi Thuộc Tính Sở Hữu Của Business SSoT (Owned Attributes):
Bảng `stocks` là cơ quan thẩm quyền duy nhất lưu trữ các thuộc tính sau:
- `ticker` (Khóa chính định danh mã chứng khoán)
- `name` / `company_name` (Tên doanh nghiệp niêm yết)
- `short_name` (Tên viết tắt doanh nghiệp)
- `english_name` (Tên tiếng Anh doanh nghiệp)
- `exchange` (Sàn giao dịch: `HOSE`, `HNX`, `UPCOM`)
- `sector_id` (Khóa ngoại tham chiếu `sectors.id`)
- `ecosystem_id` (Khóa ngoại tham chiếu `ecosystems.id`)
- `shares_outstanding` (Số lượng cổ phiếu lưu hành)
- `lot_threshold` (Ngưỡng lô giao dịch)
- `is_active` / `status` (Trạng thái vòng đời: `imported`, `pending`, `active`, `suspended`, `delisted`, `archived`)
- `slug` (Slug URL chuẩn hóa SEO)
- `description` (Mô tả thông tin doanh nghiệp)
- `icon_media_id` (Media ID logo công ty)
- `display_order` (Thứ tự ưu tiên hiển thị)
- `created_at` & `updated_at` (Timestamps quản trị).

---

# 2. Ownership & Capability Boundary Rules

Quy tắc phân định ranh giới quyền sở hữu giữa Business Capability và Market Data Provider Capability:

### 2.1 Quyền Sở Hữu Của Business Owner (iFLUX Stock Registry):
- iFLUX Stock Registry sở hữu 100% Business Entity Metadata, phân loại Ngành (`sector_id`), phân loại Hệ sinh thái (`ecosystem_id`), thứ tự hiển thị (`display_order`), badge nổi bật, và trạng thái quản trị (`status`).

### 2.2 Quyền Sở Hữu Của Market Data Provider (DNSE / FinFo):
- DNSE / Market Quote Provider sở hữu 100% dữ liệu thị trường biến động theo thời gian thực (Realtime Market Snapshot): `price`, `change`, `pctChange`, `OHLC`, `volume`, `bid/ask`, `market_cap`.
- DNSE chỉ đóng vai trò **Read-Only Data Provider**, tuyệt đối KHÔNG sở hữu Business Entity Metadata.

### 2.3 Ranh Giới Tách Biệt (Strict Boundary Separation):
- **Business Data:** Quản lý stateful, lưu trữ kiên cố tại PostgreSQL `stocks` SSoT.
- **Market Data:** Đọc stateless qua HTTP/WebSocket Provider Feed, hiển thị Read-Only lên giao diện Client qua thuộc tính `data-mkt-*`.
- **Ràng buộc:** Không lưu biến động giá thị trường vào bảng PostgreSQL `stocks`; ngược lại, Provider không được ghi đè metadata quản trị.

---

# 3. Producer & Consumer Governance Rules

Quy tắc quản trị đối với các tác nhân Khởi tạo (Producer) và Tiêu thụ (Consumer) dữ liệu:

### 3.1 Quy Tắc Tác Nhân Khởi Tạo (Producer Rules):
- **Single Business Producer:** Chỉ có **Admin Stock Registry Capability** (`POST/PATCH /api/admin/stocks`) và **Import Pipeline** được kiểm duyệt chính thức mới được phép làm Business Producer khởi tạo hoặc cập nhật bản ghi trong bảng `stocks`.
- **Cấm Provider làm Producer:** DNSE hoặc Data Provider bên ngoài KHÔNG ĐƯỢC PHÉP tự động tạo hay sửa đổi thuộc tính Business Entity trong DB.
- **Cấm Client Store làm Producer:** Client Browser Sandbox (`localStorage`, Local Stores) KHÔNG ĐƯỢC PHÉP làm Producer lưu dữ liệu kiên cố.
- **Cấm User Web làm Producer:** Người dùng viết bài trên Community chỉ được THAM CHIẾU (`Reference`), không được phép tự tạo mã chứng khoán mới.

### 3.2 Quy Tắc Tác Nhân Tiêu Thụ (Consumer Rules):
- **Single Source Consumption:** 100% các Consumer (Admin UI, User Web Search, Watchlist Taxonomy, Stock Mentions, Story/Topic Mappings, Notifications) bắt buộc phải tiêu thụ Business Data từ PostgreSQL `stocks` SSoT thông qua REST API chuẩn.
- **Cấm Đọc Nguồn Thứ Hai:** Không Consumer nào được phép đọc Business Data từ tệp seed tĩnh (`iflux-market-seed-data.js`), `localStorage`, hay bảng legacy `market_admin_stocks`.

---

# 4. Identity & Canonical Data Quality Rules

Quy tắc định danh và chuẩn hóa chất lượng dữ liệu:

### 4.1 Quy Tắc Định Danh Mã (Ticker Identity):
- `ticker` là thuộc tính định danh chính (Primary Key). Format bắt buộc: **UPPERCASE**, loại bỏ khoảng trắng (`String(t).trim().toUpperCase()`).
- Tính bất biến (Immutability): Mã `ticker` là bất biến sau khi đã phát sinh các dữ liệu liên quan (bài viết, watchlist, lịch sử).

### 4.2 Quy Tắc Chuẩn Hóa Canonical (Canonical Quality Rules):
- `exchange`: Enum **UPPERCASE** (`'HOSE'`, `'HNX'`, `'UPCOM'`).
- `slug`: Chuỗi **lowercase-kebab-case** duy nhất (ví dụ: `"hoa-phat-hpg"`).
- Normalization tại Ranh Giới Input: Mọi dữ liệu đi vào từ UI Search hay Community Mentions (ví dụ `$HPG`, `hpg`, `Hpg`) đều phải qua hàm Normalizer chuẩn hóa thành `"HPG"` trước khi truy vấn SSoT.

### 4.3 Định Hướng Mở Rộng Định Danh Tương Lai (Future Asset Identity):
- Hệ thống thiết kế sẵn chiến lược mở rộng định danh `exchange:ticker` (ví dụ `HOSE:HPG`, `INDEX:VNINDEX`, `CRYPTO:BTC`) đảm bảo sẵn sàng nâng cấp từ Stock Registry lên Asset Registry toàn diện mà không phá vỡ SSoT.

---

# 5. CRUD & Lifecycle Governance Rules

Quy tắc quản trị các thao tác Thêm, Đọc, Sửa, Xóa và Vòng đời bản ghi:

### 5.1 Ma Trận Phân Quyền CRUD (CRUD Governance Matrix):

$$\begin{array}{|l|c|c|c|c|c|}
\hline
\textbf{Capability / Component} & \textbf{Create} & \textbf{Read} & \textbf{Update} & \textbf{Delete} & \textbf{Reference} \\
\hline
\mathbf{Admin\ Stock\ Registry} & \mathbf{YES} & \mathbf{YES} & \mathbf{YES} & \mathbf{NO\ (Delist\ only)} & \mathbf{YES} \\
\text{Admin Sectors} & \text{NO} & \text{YES} & \text{UPDATE(sector\_id)} & \text{NO} & \text{YES} \\
\text{Admin Ecosystems} & \text{NO} & \text{YES} & \text{UPDATE(ecosystem\_id)} & \text{NO} & \text{YES} \\
\text{Market Data Provider} & \text{NO} & \text{YES} & \text{NO} & \text{NO} & \text{YES} \\
\text{Community / User Web} & \text{NO} & \text{YES} & \text{NO} & \text{NO} & \text{YES} \\
\hline
\end{array}$$

### 5.2 Quy Tắc Vòng Đời & Cấm Hard Delete (No Hard Delete Rule):
- **Cấm Xóa Cứng (Hard Delete):** Bảng `stocks` **TUYỆT ĐỐI KHÔNG DÙNG LỆNH DELETE** để xóa các mã đã phát sinh dữ liệu.
- **Quản lý Delist:** Khi doanh nghiệp hủy niêm yết, Admin chuyển `status = 'delisted'` (`is_active = false`).
- **Bảo Vẹn Lịch Sử:** Bản ghi bị delist vẫn được duy trì Read-Only trong DB để bảo toàn tính tham chiếu toàn vẹn cho hàng ngàn bài viết Community và Watchlist lịch sử.

---

# 6. Architecture Governance Directives (Các Quy Định Được Phép & Cấm)

Bộ quy tắc hành vi bắt buộc cho toàn bộ đội ngũ phát triển và các bước thiết kế tiếp theo:

### 🟢 NHỮNG ĐIỀU BẮT BUỘC (MUST DIRECTIVES):
1. **MUST-01:** Bảng PostgreSQL `stocks` phải là nơi lưu trữ và sở hữu kiên cố duy nhất cho 100% Business Entity Metadata của Stock.
2. **MUST-02:** Tất cả các thao tác thay đổi thông tin Stock của Admin UI phải được thực thi qua REST API bảo mật kết nối trực tiếp PostgreSQL `stocks`.
3. **MUST-03:** Phải tách biệt tuyệt đối giữa luồng xử lý Business Data (CRUD Metadata) và Market Data (Realtime Quotes).
4. **MUST-04:** Mọi truy vấn đọc danh mục Stock từ Frontend phải được chuẩn hóa gọi qua REST API công khai kết nối PostgreSQL `stocks`.
5. **MUST-05:** Mã `ticker` phải luôn được xử lý qua hàm Normalizer (Upper-case, trim) tại ranh giới Input.
6. **MUST-06:** Mọi Admin page mới hoặc sửa đổi phải tuân thủ Admin Design System Shell layout. Reference implementation: `ecosystems.html` (commit `3c6c89d`). Cấm tạo mới hoặc thay đổi DOM wrapper structure (`ix-root`, `ix-layout`, `ix-sidebar`, `ix-main`, `ix-content`). Cấm thay đổi Script Loading Order của Admin Shell scripts.

### 🔴 NHỮNG ĐIỀU CẤM TUYỆT ĐỐI (FORBIDDEN DIRECTIVES):
1. **FORBIDDEN-01:** CẤM tuyệt đối việc trỏ backend service vào bảng legacy `market_admin_stocks` hoặc duy trì bảng này làm SoT thứ hai.
2. **FORBIDDEN-02:** CẤM tuyệt đối DNSE hoặc Data Provider bên ngoài ghi đè hay sở hữu các thuộc tính Business Entity Metadata (`sector_id`, `ecosystem_id`, status, metadata).
3. **FORBIDDEN-03:** CẤM tuyệt đối việc lưu trữ giá thị trường biến động realtime vào bảng PostgreSQL `stocks`.
4. **FORBIDDEN-04:** CẤM tuyệt đối việc tạo Sandbox Mock Store (`IfluxMarketRegistryStore`) hoặc ghi đè `localStorage` client để lưu Stock Data.
5. **FORBIDDEN-05:** CẤM tuyệt đối việc thực hiện Hard Delete (xóa cứng SQL) đối với các bản ghi Stock trong database.
