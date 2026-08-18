# 04 — Solution Design

# Stock Registry Business Source of Truth Technical Solution Design

|                 |                                                              |
| --------------- | ------------------------------------------------------------ |
| **Task ID**     | `010826_Stock_Registry_Source_of_Truth`                      |
| **Document ID** | SOL-STOCK-SOT-004                                            |
| **Version**     | 2.0 (Chuẩn Hóa Tầng Architectural Solution Level)           |
| **Status**      | 🔒 **PASSED & LOCKED (Đã Phê Duyệt Bởi Product Owner)**      |
| **Date**        | 2026-08-03                                                   |
| **Căn Cứ BRD**  | [`01 - Business Requirement.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Stock_Registry_Source_of_Truth/01%20-%20Business%20Requirement.md) `[LOCKED]` |
| **Căn Cứ Audit**| [`02 - Context Audit.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Stock_Registry_Source_of_Truth/02%20-%20Context%20Audit.md) `[PASSED & LOCKED]` |
| **Căn Cứ SoT**  | [`03 - Governing SoT.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Stock_Registry_Source_of_Truth/03%20-%20Governing%20SoT.md) `[LOCKED]` |

---

# 1. Architectural Solution & System Vision

Giải pháp kiến trúc chuẩn hóa toàn diện Capability **Stock Registry** nhằm xây dựng mô hình dữ liệu tập trung, xóa bỏ sự phụ thuộc vào các nguồn dữ liệu thứ hai (Client Sandbox Stores, localStorage, static seeds, legacy DB tables) và đấu nối 100% hệ thống về **Business Source of Truth (SSoT)** duy nhất tại **PostgreSQL Database Table `stocks`**.

### Các Trụ Cột Kiến Trúc Chính:
1. **Database SSoT Standardization:** Mở rộng và hợp nhất schema bảng `stocks` tại cơ sở dữ liệu PostgreSQL để sở hữu 100% Business Entity Metadata.
2. **Backend API Gateway & Service Layer Integration:** Chuyển đổi toàn bộ Backend Service từ bảng legacy cũ sang bảng `stocks` SSoT, mở rộng API Contract chấp nhận đầy đủ thuộc tính metadata (`sector_id`, `ecosystem_id`, status).
3. **Frontend Client Store Decoupling:** Loại bỏ hoàn toàn các Mock Client Stores và localStorage persistence. Đấu nối giao diện Admin Stocks về Backend REST API chính thức.
4. **Clean Data Provider Boundary:** Tách bạch ranh giới giữa Business Entity Metadata (Stateful tại PostgreSQL) và Market Realtime Quotes (Stateless Read-Only từ Provider).

---

# 2. Target System Architecture & End-to-End Data Flow

```text
[ Admin UI Layer ] (Stock Registry UI Shell)
  │
  ├─► [ Business CRUD Flow ] (HTTP REST API: Standard Admin Stock Endpoints)
  │     │
  │     ▼
  │   [ Backend API Gateway & Validation Layer ] (RBAC Guard & Contract Validator)
  │     │
  │     ▼
  │   [ Stock Registry Business Service ] (Domain Logic & Transaction Manager)
  │     │
  │     ▼
  │   [ PostgreSQL Database ] ──► Table `stocks` (Business SSoT Duy Nhất)
  │
  └─► [ Market Data Flow ] (Read-Only Realtime Quotes & OHLC Charts)
        │
        ▼
      [ Market Quote Adapter Layer ] ──► External Data Provider (DNSE / FinFo API)
```

---

# 3. High-Level Component Solution Specifications

### 3.1 Tầng Cơ Sở Dữ Liệu (Database Layer Solution)
- **Mục tiêu:** Đảm bảo bảng PostgreSQL `stocks` đóng vai trò SSoT kiên cố duy nhất.
- **Phương án kiến trúc:**
  - Bảng `stocks` được mở rộng để lưu trữ đầy đủ thuộc tính định danh, phân loại ngành (`sector_id`), phân loại hệ sinh thái (`ecosystem_id`), chỉ số niêm yết, và các trường metadata quản trị.
  - Thiết lập các chỉ mục (Indexes) tại tầng Database để tối ưu hiệu năng truy vấn cho các thao tác tìm kiếm, lọc theo ngành và hệ sinh thái.

### 3.2 Tầng Backend Service & API Gateway (Backend Layer Solution)
- **Mục tiêu:** Chuyển đổi toàn bộ truy vấn dữ liệu từ bảng legacy sang bảng `stocks` SSoT.
- **Phương án kiến trúc:**
  - Backend Stock Service thực thi toàn bộ thao tác đọc/ghi trực tiếp trên bảng `stocks` (bao gồm JOIN dữ liệu danh mục Ngành và Hệ sinh thái).
  - API Gateway & Validation Schema được mở rộng để tiếp nhận và kiểm soát tính hợp lệ của toàn bộ thuộc tính metadata từ Admin Client.
  - Đảm bảo tính toàn vẹn dữ liệu qua giao dịch SQL Transaction khi khởi tạo hoặc cập nhật mã chứng khoán.

### 3.3 Tầng Giao Diện Admin UI (Frontend Layer Solution)
- **Mục tiêu:** Loại bỏ sự phụ thuộc vào Client Store giả lập và đấu nối trực tiếp REST API.
- **Phương án kiến trúc:**
  - Admin UI Shell bổ sung thành phần hiển thị và quản lý thông tin Hệ sinh thái song song với Ngành.
  - Loại bỏ hoàn toàn script nạp Mock Store và cơ chế ghi đè `localStorage` Client Browser.
  - Chuyển đổi các luồng nạp và lưu dữ liệu trên UI sang giao thức HTTP REST API bất đồng bộ kết nối Backend SSoT Gateway.

### 3.4 Tầng Tương Tác Data Provider (Provider Boundary Solution)
- **Mục tiêu:** Bảo vệ tính kiên cố của Business SSoT trước các biến động từ Data Provider bên ngoài.
- **Phương án kiến trúc:**
  - Giữ nguyên Market Quote Adapter đóng vai trò Read-Only Provider cho thông tin giá realtime và biểu đồ kỹ thuật.
  - Mọi dữ liệu biến động thị trường chỉ phục vụ hiển thị Client (Stateless), không ghi vào bảng PostgreSQL `stocks` Business Metadata.

### 3.5 Admin Design System Compliance Contract (Ràng Buộc Tuân Thủ Design System)
- **Mục tiêu:** Đảm bảo mọi thay đổi trên `stocks.html` tuân thủ Admin Design System Shell hiện hành, không phá vỡ layout.
- **Reference Implementation:** [`ecosystems.html`](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/app/market/ecosystems.html) (commit `3c6c89d`).

#### 3.5.1 DOM Structure Contract (Cấu Trúc DOM Bắt Buộc):
```text
ix-root
  └─ ix-layout
       ├─ aside.ix-sidebar[data-ix-admin-shell="sidebar"]
       │    ├─ div.ix-brand
       │    └─ nav.ix-menu[data-ix-admin-nav]
       └─ main.ix-main
            ├─ header.ix-navbar[data-ix-admin-shell="header"]
            └─ div.ix-content
                 ├─ h1.ix-page-title
                 ├─ div.ix-breadcrumb.ix-mb-24
                 ├─ p.ix-caption (mô tả trang)
                 └─ div.ix-card (nội dung chính)
```
- **CẤM tạo hoặc sử dụng:** `ix-app-layout`, `ix-app-main`, `ix-page-content`, `ix-sidebar-target`, `ix-header-target`, `ix-page-header`, `ix-page-header-main`, `ix-page-desc`, `ix-stats-row`.

#### 3.5.2 Page Header Contract:
```html
<!-- Theo đúng ecosystems.html:34-40 -->
<h1 class="ix-page-title">Tiêu đề trang</h1>
<div class="ix-breadcrumb ix-mb-24">
  <a href="../../hub.html">Admin</a><i class="ti ti-chevron-right" style="font-size:12px"></i>
  <span>Thị trường</span><i class="ti ti-chevron-right" style="font-size:12px"></i>
  <span>Danh mục mã</span>
</div>
<p class="ix-caption" style="margin:-8px 0 20px">Mô tả ngắn gọn về trang.</p>
```

#### 3.5.3 Script Loading Order Contract (Thứ Tự Nạp Script Bắt Buộc):
```text
1. iflux-admin-routes.js        ← Routing definitions
2. iflux-admin-nav-registry.js  ← Navigation menu registry
3. iflux-admin-app-shell.js     ← App shell initialization
4. iflux-admin-app-shell-sidebar.js ← Sidebar rendering
5. iflux-admin-app-shell-header.js  ← Header rendering
6. iflux-admin-ui.js            ← UI utilities & component behaviors
7. admin-auth.js                ← Authentication guard
8. iflux-theme.js               ← Theme switcher
9. market-stocks-page.js        ← Page-specific controller
10. [inline] Init call           ← AdmMarketStocks.init()
```
- Script tags đặt **SAU** `</div>` đóng `ix-root`, **TRƯỚC** `</body>`.
- Modal / Offcanvas markup đặt **SAU** `</div>` đóng `ix-root`.

---

# 4. Conceptual Migration Strategy

- **Khái niệm chuyển đổi (Migration Concept):**
  1. **Schema Expansion:** Khởi tạo script migration mở rộng schema bảng `stocks` tại PostgreSQL Database.
  2. **Data Consolidation:** Hợp nhất dữ liệu mã chứng khoán từ bảng legacy cũ sang bảng `stocks` SSoT, đảm bảo không thất thoát dữ liệu hiện có.
  3. **Service Redirection:** Chuyển đổi hướng truy vấn của Backend Service trỏ thẳng vào bảng `stocks`.
  4. **Frontend API Switch:** Đấu nối Frontend Admin UI sang REST API mới và gỡ bỏ hoàn toàn Client Sandbox Store.

- **Chiến lược Rollback (Rollback Strategy):**
  - Restore 4 file (`stocks.html`, `market-stocks-page.js`, `market-wave-f.service.js`, `market-wave-f.routes.js`) về commit baseline `3c6c89d`.
  - Database migration KHÔNG rollback (idempotent, backward-compatible — chỉ `ADD COLUMN IF NOT EXISTS`).

---

# 5. Architectural Verification Strategy

- **Mục tiêu kiểm thử kiến trúc (Architectural Verification Goals):**
  1. **Data Integrity:** Xác minh 100% dữ liệu thay đổi từ Admin UI được lưu kiên cố vào bảng PostgreSQL `stocks`.
  2. **Boundary Protection:** Xác minh sự cố ngắt kết nối Market Provider không gây ảnh hưởng đến dữ liệu Business Metadata trong DB.
  3. **Zero Second Source:** Xác minh hệ thống không còn lưu vết hay ghi đọc dữ liệu Stock từ `localStorage` hay tệp seed tĩnh nào.
  4. **UI Visual Integrity:** Xác minh `stocks.html` hiển thị đúng layout (sidebar, header, content, table) theo Design System Contract (Section 3.5). Xác minh `sectors.html` và `ecosystems.html` không bị regression sau deployment.
