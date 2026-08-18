# 02 - Context Audit: Chuẩn hóa Kiến trúc Trang Admin (Admin Page Architecture Standardization)

|                 |                                                              |
| --------------- | ------------------------------------------------------------ |
| **Document ID** | AUDIT-ADMIN-ARCH-001                                         |
| **Version**     | 1.1                                                          |
| **Status**      | 🔒 **LOCKED (Audit Approved)**                               |
| **Date**        | 2026-08-02                                                   |
| **Target Task** | `020826_Admin_Page_Architecture_Standardization`             |
| **Căn cứ BR**   | [`01 - Business Requirement.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/020826_Admin_Page_Architecture_Standardization/01%20-%20Business%20Requirement.md) `[🔒 LOCKED]` |

---

## 1. Existing Architecture Inventory (Danh Mục Kiến Trúc Hiện Tại)

Kiểm kê thực tế toàn bộ cấu trúc file vật lý của trang Admin dưới thư mục `Admin_Design_system/app/` đối chiếu với Router JS, Menu Navigation và Nginx Rewrite Rule.

### 1.1 Tổng quan số lượng tệp vật lý (Physical File Count):
* **Tổng số trang HTML Admin trên đĩa cứng:** 87 tệp tin `.html`.
* **Phân bố thư mục module chính:**
  - `market/` (Thị trường): 7 tệp
  - `market-ops/` (Vận hành dữ liệu): 4 tệp
  - `data/` (Dữ liệu): 6 tệp
  - `subscription/` (Gói cước): 7 tệp
  - `system/` (Hệ thống): 20 tệp
  - `users/` (Khách hàng): 4 tệp
  - `community/` (Cộng đồng): 16 tệp
  - `ai/` (Trung tâm AI): 5 tệp
  - `analytics/` (Phân tích): 5 tệp
  - `metadata/` (Tham số): 5 tệp
  - `marketing/` (Tiếp thị): 2 tệp
  - `orders/` (Đơn hàng): 3 tệp
  - `loyalty/` (Thành viên): 3 tệp

---

## 2. Convention Inventory (Danh Mục Các Quy Chuẩn Đang Tồn Tại)

Thực tế kiểm tra cho thấy mã nguồn Admin đang tồn tại **3 Convention kiến trúc đường dẫn/tệp tin vật lý** song song:

### 🔹 Convention A: Flatted Subfolder File Pattern (`app/{module}/{page}.html`)
- **Đặc điểm:** Tệp HTML trang Admin được đặt thẳng trong thư mục module với tên tệp là tên trang (ví dụ: `market/stocks.html`).
- **Tỷ lệ hiện diện:** **> 85% toàn bộ hệ thống Admin** (hơn 75/87 trang HTML).
- **Ví dụ điển hình:**
  - `Admin_Design_system/app/market/stocks.html` $\rightarrow$ Clean URL `/admin/thi-truong/stocks`
  - `Admin_Design_system/app/market/lot-threshold.html` $\rightarrow$ Clean URL `/admin/thi-truong/lot-threshold`
  - `Admin_Design_system/app/market/ranking.html` $\rightarrow$ Clean URL `/admin/thi-truong/ranking`
  - `Admin_Design_system/app/data/etl-jobs.html` $\rightarrow$ Clean URL `/admin/du-lieu/etl-jobs`
  - `Admin_Design_system/app/data/sources.html` $\rightarrow$ Clean URL `/admin/du-lieu/sources`
  - `Admin_Design_system/app/subscription/plans.html` $\rightarrow$ Clean URL `/admin/goi-cuoc/plans`
  - `Admin_Design_system/app/system/admin-users.html` $\rightarrow$ Clean URL `/admin/he-thong/admin-list`

### 🔹 Convention B: Subdirectory Index Pattern (`app/{module}/{page}/index.html`)
- **Đặc điểm:** Mỗi trang Admin tạo ra một thư mục con riêng và đặt tệp `index.html` bên trong thư mục con đó (ví dụ: `market/sectors/index.html`).
- **Tỷ lệ hiện diện:** **< 5% hệ thống** (xuất hiện ở một số module mới phát triển gần đây).
- **Ví dụ điển hình:**
  - `Admin_Design_system/app/market/sectors/index.html` $\rightarrow$ Clean URL `/admin/thi-truong/sectors`
  - `Admin_Design_system/app/market/ecosystems/index.html` $\rightarrow$ Clean URL `/admin/thi-truong/ecosystems`
  - `Admin_Design_system/app/community/content/index.html` $\rightarrow$ Clean URL `/admin/cong-dong/content`

### 🔹 Convention C: Module Root Overview Pattern (`app/{module}/index.html`)
- **Đặc điểm:** Tệp `index.html` nằm ở gốc thư mục module đại diện cho trang Tổng quan/Dashboard của module đó (ví dụ: `market/index.html`).
- **Tỷ lệ hiện diện:** **100% các trang Module Root**.
- **Ví dụ điển hình:**
  - `Admin_Design_system/app/dashboard/index.html` $\rightarrow$ Clean URL `/admin/tong-quan`
  - `Admin_Design_system/app/market/index.html` $\rightarrow$ Clean URL `/admin/thi-truong`
  - `Admin_Design_system/app/system/index.html` $\rightarrow$ Clean URL `/admin/he-thong`

---

## 3. Consistency Matrix (Ma Trận Đánh Giá Mức Độ Thống Nhất Qua Các Tầng)

| Convention Pattern | Physical File Layer | Router JS (`iflux-admin-routes.js`) | Navigation Menu (`iflux-admin-nav-registry.js`) | Infrastructure Nginx (`/etc/nginx/snippets/iflux-prod-app.conf`) | Mức Độ Đồng Nhất (Consistency) |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Convention A** (`app/{module}/{page}.html`) | `market/stocks.html` | `{ slug: "/admin/thi-truong/stocks", file: "market/stocks.html" }` | Link `/admin/thi-truong/stocks` | `rewrite ^ /Admin_Design_system/app/market/$admPage.html break;` | **100% ĐỒNG NHẤT (HTTP 200 OK)** |
| **Convention B** (`app/{module}/{page}/index.html`) | `market/sectors/index.html` | `{ slug: "/admin/thi-truong/sectors", file: "market/sectors/index.html" }` | Link `/admin/thi-truong/sectors` | `rewrite ^ /Admin_Design_system/app/market/$admPage.html break;` $\rightarrow$ tìm `sectors.html` | **❌ BỊ LỆCH LAYER (HTTP 404 Not Found)** |
| **Convention C** (`app/{module}/index.html`) | `market/index.html` | `{ slug: "/admin/thi-truong", file: "market/index.html" }` | Link `/admin/thi-truong` | `location = /admin/thi-truong { rewrite ^ /Admin_Design_system/app/market/index.html break; }` | **100% ĐỒNG NHẤT (HTTP 200 OK)** |

---

## 4. Historical Analysis (Phân Tích Lịch Sử Thay Đổi)

* **Baseline ban đầu (`commit 8efc4f9` & `c416523` freeze baseline):**
  - Toàn bộ nền tảng Admin UI ban đầu được thiết kế theo **Convention A (`app/{module}/{page}.html`)**.
  - Quy tắc Nginx Rewrite tổng quát trên Production Server cũng được thiết kế chuẩn theo Convention A:
    `location ~ ^/admin/thi-truong/(?<admPage>[^/]+)/?$ { rewrite ^ /Admin_Design_system/app/market/$admPage.html break; root /var/www/iflux/production; }`
  - **Kết luận lịch sử:** Convention A là **kiến trúc nền (baseline architecture)** của hệ thống, được chứng minh đồng bộ qua cả 4 layer: Physical Files + Router JS + Navigation Menu + Infrastructure Nginx.
* **Sự xuất hiện của Convention B:**
  - Trong các phase phát triển gần đây (ví dụ: module Sectors & Ecosystems), mã nguồn được tạo dưới dạng thư mục con `market/sectors/index.html` và `market/ecosystems/index.html` (**Convention B**).
  - Thao tác này diễn ra cục bộ ở lớp File vật lý mà **không đồng bộ chuẩn hóa quy tắc Regex Nginx tổng thể của Infrastructure**, dẫn đến sự lệch tầng giữa Physical Files và Nginx Rewrite Rules.

---

## 5. Root Cause Analysis (Phân Tích Nguyên Nhân Gốc Lỗi 404)

```text
Chưa tồn tại Business Source of Truth cho Admin Architecture
        ↓
Module mới tự chọn Convention B (sub-directory index.html)
        ↓
Physical layer lệch với Infrastructure assumption ($admPage.html)
        ↓
HTTP 404 Not Found trên Production
```

1. **Nguyên nhân gốc (Root Cause):**
   - System chưa có một **Business Source of Truth (SoT)** duy nhất bắt buộc quy chuẩn Admin Page Architecture.
   - Infrastructure Nginx đang sử dụng một Quy tắc Rewrite tổng quát dạng Regex: `rewrite ^ /Admin_Design_system/app/market/$admPage.html break;`.
   - Quy tắc này mặc định rằng **mọi trang Admin con đều tuân theo Convention A (`$admPage.html`)**.
   - Khi tệp vật lý được tạo theo **Convention B (`$admPage/index.html`)**, Nginx biến request `/admin/thi-truong/sectors` thành `/Admin_Design_system/app/market/sectors.html`. File `sectors.html` **không tồn tại** trên đĩa cứng $\rightarrow$ Nginx ném lỗi `HTTP 404 Not Found`.

2. **Phạm vi & Mức độ ảnh hưởng (Impact Scope & Severity):**
   - **Mức độ:** `HIGH` (Gây gián đoạn trải nghiệm người dùng Admin từ Menu Sidebar chính thức).
   - **Phạm vi:** Tất cả các module Admin được tạo theo Convention B mà không có Special-case Rule trong Nginx.

---

## 6. Evidence Registry (Bảng Bằng Chứng Audit)

| Evidence Item | Source Path / Location | Purpose / Verification Target |
| :--- | :--- | :--- |
| **Admin HTML Inventory** | `Admin_Design_system/app/**` | Xác minh cấu trúc vật lý thực tế của 87 tệp HTML Admin |
| **Router Mapping** | [`Admin_Design_system/iflux-admin-ui/iflux-admin-routes.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/iflux-admin-ui/iflux-admin-routes.js) | Xác minh ánh xạ `key ↔ slug ↔ file` và hàm `fileFromAdminPath` |
| **Navigation Registry** | [`Admin_Design_system/iflux-admin-ui/iflux-admin-nav-registry.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/iflux-admin-ui/iflux-admin-nav-registry.js) | Xác minh đường dẫn URL menu rendered trên Sidebar |
| **Nginx Rewrite Assumption** | `/etc/nginx/snippets/iflux-prod-app.conf` (Production Server) | Xác minh quy tắc Rewrite Regex gốc của Infrastructure |
| **Git Baseline History** | `git log --follow -- Admin_Design_system/app/` | Trích xuất lịch sử hình thành từ commit `8efc4f9` và `c416523` |

---

## 7. Candidate Convention Analysis (Phân Tích Các Phương Án Chuẩn Hóa)

### 🟢 Phương Án 1: Chuẩn hóa 100% Admin theo Convention A (`app/{module}/{page}.html`) — `[RECOMMENDED]`
- **Mô tả:** Chuyển đổi toàn bộ các trang Admin dạng Convention B (`sectors/index.html`, `ecosystems/index.html`) về tệp tin đơn lẻ đúng chuẩn Convention A (`sectors.html`, `ecosystems.html`).
- **Ưu điểm:**
  - **Khớp 100% với hơn 85% số trang Admin hiện có trên toàn hệ thống.**
  - **Khớp 100% với Quy tắc Nginx Regex hiện tại**, loại bỏ hoàn toàn các rule special-case thừa trong Nginx.
  - Phù hợp với hàm tính toán đường dẫn `fileFromAdminPath` trong Router JS [`iflux-admin-routes.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/iflux-admin-ui/iflux-admin-routes.js).
  - Chi phí bảo trì lâu dài thấp nhất, quy trình deploy sạch sẽ nhất.
- **Nhược điểm:** Cần refactor vị trí tệp tin và đường dẫn import script của các trang đang dùng Convention B.

### 🟡 Phương Án 2: Giữ nguyên 2 Convention & Bổ sung Special-case Rewrite trong Nginx
- **Mô tả:** Giữ tệp tin vật lý `sectors/index.html` và thêm các câu lệnh rewrite thủ công cho từng tệp trong Nginx (ví dụ `location = /Admin_Design_system/app/market/sectors.html { rewrite ... }`).
- **Ưu điểm:** Không cần đổi tên hay di chuyển tệp HTML local.
- **Nhược điểm:** Vi phạm nghiêm trọng BR §3 & §9 (tạo ra nhiều special-case trong Infrastructure, phình to Nginx config, tăng nguy cơ lỗi khi thêm module mới).

### 🔴 Phương Án 3: Chuyển đổi 100% Admin sang Convention B (`app/{module}/{page}/index.html`)
- **Mô tả:** Di chuyển hơn 75 trang HTML hiện tại từ `page.html` thành `page/index.html`.
- **Ưu điểm:** Cấu trúc mỗi trang nằm trong thư mục riêng.
- **Nhược điểm:** Tốn chi phí refactor cực lớn (>85% hệ thống), phải viết lại toàn bộ Nginx Regex Rewrite Rules và Router JS.

---

## 8. Recommendation Report (Báo Cáo Khuyến Nghị Của Audit)

### 📌 Khuyến nghị Kỹ thuật (Technical Recommendation):
Đề xuất Convention A (`app/{module}/{page}.html`) trở thành **Admin Page Architecture SoT chính thức** sau khi được Product Owner phê duyệt.

### 📊 Bảng So Sánh Chi Phí & Rủi Ro:

| Tiêu Chí Đánh Giá | Phương Án 1 (Convention A) `[RECOMMENDED]` | Phương Án 2 (Nginx Special-case Workaround) | Phương Án 3 (Chuyển 100% sang Convention B) |
| :--- | :---: | :---: | :---: |
| **Độ khớp Kiến trúc Hiện tại** | **> 85%** (Chuẩn gốc hệ thống) | 0% (Duy trì nợ kỹ thuật) | < 5% |
| **Số tệp tin cần Migration** | **2 tệp** (`sectors`, `ecosystems`) | 0 tệp | > 75 tệp |
| **Mức độ phức tạp Nginx** | **Tối giản 100%** (1 Regex Rule chung) | Tăng phình (vi phạm Clean Infra) | Phức tạp (Cần Rewrite Try_Files mới) |
| **Rủi ro lỗi Production sau này** | **Cực thấp** | Rất cao (dễ quên thêm Special-case Rule) | Cao (nguy cơ vỡ link hàng loạt) |

---

## 9. Ranh Giới Quản Trị: Audit Conclusion vs Business Decision

* **Audit Conclusion (Kết luận Audit):** Đề xuất Convention A trở thành Admin Page Architecture SoT sau khi được Product Owner phê duyệt.
* **Business Decision (Quyết định Quản trị):** Sẽ được ban hành và khóa chính thức tại tài liệu [`03 - Governing SoT.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/020826_Admin_Page_Architecture_Standardization/03%20-%20Governing%20SoT.md).
