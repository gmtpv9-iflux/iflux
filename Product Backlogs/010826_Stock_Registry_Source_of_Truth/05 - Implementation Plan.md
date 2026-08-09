# 05 — Implementation Plan: Stock Registry Business Source of Truth Standardization

**Task ID:** `010826_Stock_Registry_Source_of_Truth`  
**Trạng thái Toàn Dự án:** `📋 APPROVED FOR RE-EXECUTION (Đã Rollback Lần 1 — Tài Liệu Bổ Sung Design System Contract)`  
**Ngày Cập nhật:** `2026-08-03`  
**Lần Implementation:** `#2 (Lần 1 rolled back do vi phạm Design System layout)`

**Căn Cứ Thượng Nguồn (LOCKED - Khóa Cố Định):**
- [`01 - Business Requirement.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Stock_Registry_Source_of_Truth/01%20-%20Business%20Requirement.md) `[LOCKED]`
- [`02 - Context Audit.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Stock_Registry_Source_of_Truth/02%20-%20Context%20Audit.md) `[PASSED & LOCKED]`
- [`03 - Governing SoT.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Stock_Registry_Source_of_Truth/03%20-%20Governing%20SoT.md) `[LOCKED — incl. MUST-06 Design System]`
- [`04 - Solution Design.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/010826_Stock_Registry_Source_of_Truth/04%20-%20Solution%20Design.md) `[PASSED & LOCKED — incl. Section 3.5 DOM Contract]`

---

## Scope & Boundary Clarification

> [!NOTE]
> **PHẠM VI THI CÔNG TASK NÀY (TASK SCOPE BOUNDARY):**  
> Task `010826_Stock_Registry_Source_of_Truth` tập trung thi công chuẩn hóa **Business SSoT cho Stock Registry** bao gồm:
> 1. Database Table PostgreSQL `stocks` (Thêm cột, sync legacy data, indexes).
> 2. Backend Stock Service & API Gateway (`market-wave-f.service.js` & `routes.js`).
> 3. Admin Stock Registry UI (`stocks.html` & `market-stocks-page.js`).
> 4. Provider Boundary Audit & Sample Stock Seed into `stocks` SSoT.
> 5. Post-Implementation SoT Validation, Traceability Audit & Producer Flow Map.
> 
> *Việc migrate các Consumer bên ngoài (Search, Watchlist, Community, Story) sang Stock SSoT sẽ được thực thi theo các Backlog độc lập nối tiếp.*

---

## File Scope Boundary (Ranh Giới File Được Phép Thay Đổi)

> [!WARNING]
> **RÀNG BUỘC BẮT BUỘC — Chỉ được sửa đổi các file sau:**

### ✅ ALLOWED FILES (Được phép sửa):
| File | Lý do |
|------|-------|
| `Admin_Design_system/app/market/stocks.html` | Frontend UI page — gỡ mock, đấu nối API |
| `Admin_Design_system/app/market/market-stocks-page.js` | Frontend controller — chuyển từ Store sang REST API |
| `backend/src/modules/market/market-wave-f.service.js` | Backend service — chuyển truy vấn sang table `stocks` |
| `backend/src/modules/market/market-wave-f.routes.js` | Backend router — mở rộng Zod validation schema |
| `backend/migrations/037_stock_registry_sot.sql` | Database migration — đã chạy, chỉ verify |

### ❌ FORBIDDEN FILES (Cấm sửa):
| File | Lý do |
|------|-------|
| `iflux-admin-ui.css` / `components.css` | Design System CSS — không thuộc scope task |
| `iflux-admin-app-shell*.js` | Admin Shell infrastructure — ổn định |
| `iflux-admin-routes.js` / `iflux-admin-nav-registry.js` | Routing & navigation — ổn định |
| `sectors.html` / `ecosystems.html` | Reference implementations — CẤM sửa |
| `nginx.conf` / backend `app.js` | Infrastructure — routes already mounted |

---

## Pre-Implementation Checklist (PHẢI PASS Trước Khi Bắt Đầu Code)

> [!IMPORTANT]
> **Tất cả mục dưới đây PHẢI được verify PASS trước khi bắt đầu Phase 1.**

- [x] `curl -I https://iflux.vn/admin/thi-truong/sectors` → HTTP 200
- [x] `curl -I https://iflux.vn/admin/thi-truong/ecosystems` → HTTP 200
- [x] Verify `sectors.html` layout renders: sidebar + header + content + table
- [x] Verify `ecosystems.html` layout renders: sidebar + header + content + table
- [x] Verify `stocks.html` baseline loads without JS console errors
- [x] Confirm database table `stocks` exists with baseline columns (`ticker`, `name`, `exchange`, `sector_id`, `ecosystem_id`, `shares_outstanding`, `lot_threshold`, `is_active`)
- [x] Confirm migration `037_stock_registry_sot.sql` extended columns đã tồn tại (`slug`, `status`, `created_at`, `updated_at`...)

---

## Proposed Changes & Execution Plan

---

### Phase 1: Database Migration & Schema Extension [✅ VERIFIED]

#### [VERIFY] [`037_stock_registry_sot.sql`](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/migrations/037_stock_registry_sot.sql)
- Migration đã chạy ở lần implementation #1 và KHÔNG bị rollback (idempotent).
- Cần **VERIFY** (không chạy lại):
  ```sql
  -- Verify columns exist:
  SELECT column_name FROM information_schema.columns WHERE table_name = 'stocks';
  -- Expected: ticker, name, exchange, sector_id, ecosystem_id, shares_outstanding,
  --           lot_threshold, is_active, slug, short_name, english_name, isin,
  --           description, icon_media_id, display_order, status, created_at, updated_at

  -- Verify indexes exist:
  SELECT indexname FROM pg_indexes WHERE tablename = 'stocks';
  -- Expected: idx_stocks_sector_id, idx_stocks_ecosystem_id, idx_stocks_status
  ```
- **Exit Criteria Phase 1:** Schema và indexes confirmed. ✅

---

### Phase 2: Backend Service & Router Refactoring [✅ COMPLETED]

#### [MODIFY] [`market-wave-f.service.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/market/market-wave-f.service.js)
- Chuyển đổi toàn bộ 7 câu SQL query từ bảng legacy `market_admin_stocks` sang bảng PostgreSQL **`stocks`** SSoT.
- Thêm `LEFT JOIN sectors` và `LEFT JOIN ecosystems` để trả về `sector_name` và `ecosystem_name`.
- Cập nhật các hàm `listStocks`, `createStock`, `updateStock`, `setStatus`, `importStocks` hỗ trợ đầy đủ `sector_id`, `ecosystem_id`, `description`, `shares_outstanding`, `lot_threshold`.

#### [MODIFY] [`market-wave-f.routes.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/backend/src/modules/market/market-wave-f.routes.js)
- Cập nhật Zod Validation Schema cho `POST /` và `PATCH /:id`:
  Accept: `sector_id` (nullable int), `ecosystem_id` (nullable int), `shares_outstanding` (number), `lot_threshold` (number), `status` (enum active/suspended/delisted/archived), `description` (string).

- **Exit Criteria Phase 2:**
  - `node --check market-wave-f.service.js` → no syntax errors ✅
  - `node --check market-wave-f.routes.js` → no syntax errors ✅
  - `grep -c "market_admin_stocks" market-wave-f.service.js` → 0 (zero legacy references) ✅

---

### Phase 3: Frontend Admin Stocks UI Integration [✅ COMPLETED]

> [!IMPORTANT]
> **DESIGN SYSTEM COMPLIANCE CONTRACT (RÀNG BUỘC BẮT BUỘC):**  
> Mọi thay đổi trong Phase 3 phải tuân thủ 04 - Solution Design Section 3.5.  
> Reference implementation: [`ecosystems.html`](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/app/market/ecosystems.html)

#### Phase 3 Constraints (Ràng Buộc Trước Khi Code):

**3.A — DOM Structure: GIỮ NGUYÊN 100%**
```text
ix-root > ix-layout > [ix-sidebar + ix-main > [ix-navbar + ix-content]]
```
- Không được thêm, xóa, hoặc đổi tên bất kỳ wrapper class nào.
- Không được tạo: `ix-app-layout`, `ix-app-main`, `ix-page-content`, `ix-sidebar-target`, `ix-header-target`.

**3.B — Page Header: Giữ Đúng Cấu Trúc**
```html
<h1 class="ix-page-title">Mã cổ phiếu</h1>
<div class="ix-breadcrumb ix-mb-24">
  <a href="../../hub.html">Admin</a><i class="ti ti-chevron-right" style="font-size:12px"></i>
  <span>Thị trường</span><i class="ti ti-chevron-right" style="font-size:12px"></i>
  <span>Danh mục mã</span>
</div>
<p class="ix-caption" style="margin:-8px 0 20px">Ticker là khóa bất biến — quản lý metadata từng mã cổ phiếu.</p>
```
- Không được dùng: `ix-page-header`, `ix-page-header-main`, `ix-page-desc`.

**3.C — Stats Cards (nếu giữ): Giữ Đúng Container**
```html
<div class="ix-grid ix-grid-3 ix-mb-24">
  <div class="ix-stat-card-h">...</div>
  ...
</div>
```
- Không được dùng: `ix-stats-row`.

**3.D — Script Loading Order: Theo Chuẩn ecosystems.html**
```text
1. iflux-admin-routes.js
2. iflux-admin-nav-registry.js
3. iflux-admin-app-shell.js
4. iflux-admin-app-shell-sidebar.js
5. iflux-admin-app-shell-header.js
6. iflux-admin-ui.js
7. admin-auth.js
8. iflux-theme.js
9. market-stocks-page.js
10. [inline] AdmMarketStocks.init()
```
- Gỡ 3 mock scripts: `iflux-market-seed-data.js`, `iflux-market-ecosystem-seeds.js`, `iflux-market-registry-store.js`.
- Giữ hoặc gỡ `iflux-market-quotes.js` tùy thuộc vào việc trang stocks có cần hiển thị giá realtime hay không.
- Gỡ `admin-view-gate.js` nếu không cần thiết (sectors/ecosystems không dùng).

#### [MODIFY] [`stocks.html`](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/app/market/stocks.html)
- Thêm `<script>` inline theme detection ở `<head>` (theo chuẩn ecosystems.html:4).
- Thêm cột `<th>Hệ sinh thái</th>` vào bảng `<thead>`.
- Thêm `<select id="adm-mkt-edit-ecosystem">` vào Offcanvas form edit.
- Thêm `<select id="adm-mkt-filter-ecosystem">` vào filter bar.
- Gỡ 3 mock script tags.
- Sắp xếp lại script loading order theo chuẩn 3.D.

#### [MODIFY] [`market-stocks-page.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/app/market/market-stocks-page.js)
- Nạp dữ liệu từ 3 REST APIs: `GET /api/admin/sectors`, `GET /api/admin/ecosystems`, `GET /api/admin/market/stocks`.
- Populate danh sách Ngành & Hệ sinh thái cho Filter và Form Edit Dropdowns.
- Render cột Hệ sinh thái trong hàm `renderTable()`.
- Cập nhật `saveEdit()` gửi `PATCH /api/admin/market/stocks/:ticker` trực tiếp về Server.
- Xóa toàn bộ reference đến `IfluxMarketRegistryStore`, `localStorage`, mock seeds.

- **Exit Criteria Phase 3:**
  - `stocks.html` mở không lỗi JS console ✅
  - Sidebar renders đúng (navigation menu) ✅
  - Header renders đúng (search bar, avatar, chip) ✅
  - Page content renders đúng (page-title, breadcrumb, caption, stats, table) ✅
  - Table loads data từ REST API (không từ localStorage) ✅

---

### Phase 4: Cutover & Verification [✅ COMPLETED]

#### Cutover Steps:
1. **Backend Deploy:** SCP service + routes files → production server → `pm2 restart iflux-api`.
2. **Frontend Deploy:** SCP `stocks.html` + `market-stocks-page.js` → production server.
3. **Cache Purge:** Cloudflare cache purge.
4. **Functional Test:**
   - `curl -s https://iflux.vn/api/admin/market/stocks -H "Authorization: ..."` → JSON response từ table `stocks`
   - Cập nhật mã `HPG` qua UI → verify database trực tiếp: `SELECT sector_id, ecosystem_id FROM stocks WHERE ticker='HPG'`

- **Exit Criteria Phase 4:** Admin có thể đọc/ghi stock metadata qua UI → data lưu kiên cố vào PostgreSQL `stocks`. ✅

---

### Phase 5: Provider Boundary Audit & Sample Stock Seed [📋 PLANNED]

#### Provider Boundary Verification:
- Verify DNSE adapter (`iflux-market-quotes.js`) chỉ đọc realtime quotes, không ghi vào table `stocks`.
- Verify không còn mock data source nào active.

#### Sample Stock Seed (nếu cần):
- Nếu table `stocks` đã có dữ liệu từ lần implementation #1, verify data integrity.
- Nếu cần bổ sung, sử dụng `INSERT ... ON CONFLICT DO UPDATE` (idempotent).

- **Exit Criteria Phase 5:** Provider boundary verified, sample data confirmed.

---

### Phase 6: Post-Implementation SoT Validation & Re-Audit [📋 PLANNED]

#### 1. Re-Audit Duplicate Sources:
- Admin UI `stocks.html`: 0% mock script tags.
- Client controller `market-stocks-page.js`: 0% `localStorage` or mock store calls.
- Backend service: 0% references to `market_admin_stocks`.

#### 2. Consumer Traceability Audit Matrix:

$$\begin{array}{|l|l|l|l|l|}
\hline
\textbf{Tên Consumer} & \textbf{Vị Trí Mã Nguồn Truy Vết} & \textbf{Nguồn Hiện Tại} & \textbf{Nguồn Đích SSoT} & \textbf{Trạng Thái Triển Khai} \\
\hline
\text{Admin Stock Registry UI} & \texttt{Admin\_Design\_system/app/market/stocks.html} & \text{REST API Gateway} & \text{PostgreSQL } \texttt{stocks} & \text{📋 Pending (Task 010826 Re-Exec)} \\
\text{Backend Admin REST API} & \texttt{backend/src/modules/market/market-wave-f.service.js} & \text{Direct DB Driver} & \text{PostgreSQL } \texttt{stocks} & \text{📋 Pending (Task 010826 Re-Exec)} \\
\text{Global Search Capability} & \texttt{User\_Web/iflux-web-ui/runtime/entity-definition.js} & \text{Static Mock / localJSON} & \text{PostgreSQL } \texttt{stocks} & \text{📋 Pending Backlog (Target SSoT)} \\
\text{Community Post / Story} & \texttt{backend/scripts/seed-phase3-community-pilots.js} & \text{Reference Ticker Tag} & \text{PostgreSQL } \texttt{stocks} & \text{📋 Pending Backlog (Target SSoT)} \\
\text{Watchlist / User Alert} & \texttt{backend/src/modules/user-data/user-data.service.js} & \text{Table } \texttt{user\_watchlists} & \text{PostgreSQL } \texttt{stocks} & \text{📋 Pending Backlog (Target SSoT)} \\
\text{Market Scanner / Screener} & \texttt{backend/src/modules/widget-publish/seed/...} & \text{DNSE Quotes Feed} & \text{Quotes + } \texttt{stocks} & \text{📋 Pending Backlog (Target SSoT)} \\
\hline
\end{array}$$

#### 3. Complete Ownership & Data Flow Map:

```
  ┌─────────────────────────────────────────────────┐
  │         DNSE Market Data Feed (Provider)        │
  │ (symbol, marketId, realtime price/OHLC/volume)  │
  └────────────────────────┬────────────────────────┘
                           │ (Stateless Feed)
                           ▼
  ┌─────────────────────────────────────────────────┐
  │        DNSE Market Data Adapter / Client        │
  │     (backend/src/modules/dnse/dnse.client.js)   │
  └────────────────────────┬────────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────────┐
  │    Data Import Pipeline / REST API (PRODUCER)   │
  │ (backend/src/modules/market/market-wave-f.service.js) │
  └────────────────────────┬────────────────────────┘
                           │ (Write SSoT)
                           ▼
  ┌─────────────────────────────────────────────────┐
  │       PostgreSQL Database: Table `stocks`       │
  │    ★ SINGLE BUSINESS SOURCE OF TRUTH (OWNER)    │
  │  (ticker, name, sector_id, ecosystem_id, status)│
  └────────────────────────┬────────────────────────┘
                           │ (Read SSoT)
             ┌─────────────┴─────────────┐
             ▼                           ▼
  ┌──────────────────────┐   ┌──────────────────────┐
  │ Admin Stock Registry │   │ External Consumers   │
  │ (Scope Task 010826)  │   │ (Search, Watchlist,  │
  │ 📋 RE-EXECUTING      │   │  Community, Story)   │
  └──────────────────────┘   │ 📋 Nối Tiếp Backlog  │
                             └──────────────────────┘
```

---

## Go-Live Exit Criteria Verification (Tiêu Chí Hoàn Thành)

### Data & API Criteria:

| Tiêu Chí | Trạng Thái | Phương Pháp Kiểm Tra |
|-----------|-----------|---------------------|
| Admin Stock Registry SSoT | 📋 PENDING | Bảng PostgreSQL `stocks` sở hữu 100% Business Metadata |
| Admin Capability Zero Second Source | 📋 PENDING | 0% query trỏ về `market_admin_stocks`; 0% mock store |
| Admin Registry CRUD Capability | 📋 PENDING | Admin UI đọc/ghi trực tiếp REST APIs `GET/POST/PATCH` |
| Provider Boundary Verified | 📋 PENDING | Business Data lưu DB; Quotes nạp từ DNSE Provider |
| Seeded Sample Stocks Verified | 📋 PENDING | Bản ghi mẫu trong DB; Metadata HPG bảo vệ 100% |
| Post-Implementation SoT Audit | 📋 PENDING | Re-audit Duplicate Sources, Producer, Consumer Inventory |

### UI Visual Criteria (BỔ SUNG — Ngăn Regression):

| Tiêu Chí | Trạng Thái | Phương Pháp Kiểm Tra |
|-----------|-----------|---------------------|
| stocks.html sidebar renders đúng | 📋 PENDING | Navigation menu hiển thị, active item highlighted |
| stocks.html header renders đúng | 📋 PENDING | Search bar, avatar, environment chip visible |
| stocks.html page content renders đúng | 📋 PENDING | page-title, breadcrumb, caption, stats, table hiển thị |
| stocks.html table loads từ REST API | 📋 PENDING | Network tab shows `GET /api/admin/market/stocks` |
| sectors.html không bị regression | 📋 PENDING | `curl -I .../sectors` → HTTP 200, layout unchanged |
| ecosystems.html không bị regression | 📋 PENDING | `curl -I .../ecosystems` → HTTP 200, layout unchanged |
