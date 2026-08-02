# 05 - Implementation Plan: Kế Hoạch Triển Khai Chuẩn Hóa Kiến Trúc Trang Admin

|                 |                                                              |
| --------------- | ------------------------------------------------------------ |
| **Task ID**     | `020826_Admin_Page_Architecture_Standardization`             |
| **Document ID** | PLAN-ADMIN-ARCH-001                                          |
| **Version**     | 1.2                                                          |
| **Status**      | 🔒 **APPROVED & LOCKED (Phê duyệt bởi Product Owner)**       |
| **Date**        | 2026-08-02                                                   |
| **Căn cứ BR**   | [`01 - Business Requirement.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/020826_Admin_Page_Architecture_Standardization/01%20-%20Business%20Requirement.md) `[🔒 LOCKED]` |
| **Căn cứ Audit** | [`02 - Context Audit.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/020826_Admin_Page_Architecture_Standardization/02%20-%20Context%20Audit.md) `[🔒 LOCKED]` |
| **Căn cứ SoT**  | [`03 - Governing SoT.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/020826_Admin_Page_Architecture_Standardization/03%20-%20Governing%20SoT.md) `[🔒 APPROVED & LOCKED]` |
| **Căn cứ Solution** | [`04 - Solution Design.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/020826_Admin_Page_Architecture_Standardization/04%20-%20Solution%20Design.md) `[🔒 APPROVED & LOCKED]` |

---

## 1. Plan Overview (Tổng Quan Kế Hoạch)
Kế hoạch triển khai kỹ thuật nhằm đưa 2 trang Admin (`sectors` và `ecosystems`) đang bị lệch kiến trúc về chuẩn **Admin Page Architecture SoT (`SOT-ADMIN-ARCH-001`)**:
- Không sửa mã nguồn Business Logic Backend hay API.
- Không sửa quy tắc Nginx Rewrite trên Server Production.
- Thực hiện chuyển đổi tệp vật lý local $\rightarrow$ đồng bộ Router JS $\rightarrow$ Deploy static resource theo Deployment SoT $\rightarrow$ Verify Production behavior.

---

## 2. Work Packages (Các Gói Thao Tác Kỹ Thuật)

### 📦 Work Package 1: Local File Migration & Relative Asset Refactoring (WP-01)
- **Objective:** Di chuyển 2 tệp vật lý về đúng vị trí chuẩn Convention A và điều chỉnh độ sâu đường dẫn tương đối CSS/JS trong HTML.
- **Entry Criteria:** `04 - Solution Design.md` đã được duyệt `🔒 APPROVED & LOCKED`.
- **Tasks Detail:**
  1. Verify pre-condition: Kiểm tra thực tế toàn bộ đường dẫn tài nguyên trong `Admin_Design_system/app/market/sectors/index.html` và `Admin_Design_system/app/market/ecosystems/index.html`.
  2. Tạo/Di chuyển `sectors/index.html` $\rightarrow$ `Admin_Design_system/app/market/sectors.html`.
  3. Tạo/Di chuyển `ecosystems/index.html` $\rightarrow$ `Admin_Design_system/app/market/ecosystems.html`.
  4. Refactor đường dẫn tương đối từ `../../iflux-admin-ui/` thành `../iflux-admin-ui/` trong 2 file HTML.
  5. **Guard trước khi refactor controller path:** Verify vị trí thực tế của file JS controller và verify browser loading behavior trước khi cập nhật đường dẫn script controller.
  6. Cleanup physical directory sau khi migration và kiểm thử thành công.
- **Deliverable:** 2 tệp HTML phẳng `sectors.html` và `ecosystems.html` đặt chuẩn tại `Admin_Design_system/app/market/`.
- **Exit Criteria:** Nạp trang local tĩnh sạch sẽ, không có lỗi 404 tệp tĩnh.

---

### 📦 Work Package 2: Router Alignment & Local Verification (WP-02)
- **Objective:** Cập nhật tệp đăng ký đường dẫn Router JS để resolve đúng tệp HTML mới.
- **Entry Criteria:** WP-01 hoàn thành.
- **Tasks Detail:**
  1. Cập nhật `PAGES` registry trong [`iflux-admin-routes.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/iflux-admin-ui/iflux-admin-routes.js):
     - `market-ecosystems-index` $\rightarrow$ `file: "market/ecosystems.html"`
     - `market-sectors-index` $\rightarrow$ `file: "market/sectors.html"`
  2. Static syntax validation phù hợp môi trường thực thi (`node -c` chỉ kiểm tra cú pháp JS). Browser runtime verification là tiêu chí bắt buộc.
  3. Xác minh tính đúng đắn của hàm `detectActiveKey()` và `fileFromAdminPath('/admin/thi-truong/sectors')`.
- **Deliverable:** Tệp [`iflux-admin-routes.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/iflux-admin-ui/iflux-admin-routes.js) đã đồng bộ.
- **Exit Criteria:** Router JS trả về đúng tệp `market/sectors.html` và `market/ecosystems.html`.

---

### 📦 Work Package 3: Production Deployment & Infrastructure Compatibility Verification (WP-03)
- **Objective:** Triển khai mã nguồn Admin mới lên Server Production theo đúng quy trình [`Docs/SoT — Deployment.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Docs/SoT%20%E2%80%94%20Deployment.md) và xác minh tính tương thích của Nginx hạ tầng hiện tại.
- **Entry Criteria:** WP-02 hoàn thành & được nghiệm thu local.
- **Tasks Detail:**
  1. Đọc tham số `infra/staging/staging.env`.
  2. Deploy static resource theo Deployment SoT (`rsync` Deploy Unit Admin từ local `Admin_Design_system/app/market/` lên Production path `/var/www/iflux/production/Admin_Design_system/app/market/`).
  3. Nếu cần cache invalidation thì thực hiện theo Deployment SoT (Purge Cloudflare CDN Cache).
  4. Thực thi kiểm thử thực nghiệm bằng `curl -i`:
     - `curl -i -s https://iflux.vn/admin/thi-truong/sectors`
     - `curl -i -s https://iflux.vn/admin/thi-truong/ecosystems`
- **Deliverable:** Bằng chứng thực nghiệm HTTP `200 OK` trên cả 2 Clean URL trên Production.
- **Exit Criteria:** Cả 2 Clean URL Production đều trả về `HTTP/2 200 OK` và hiển thị giao diện Admin hoàn hảo.

---

## 3. Verification Criteria Matrix (Ma Trận Tiêu Chí Xác Minh)

| Ma Trận VC | Tiêu Chí Kiểm Thử | Phương Pháp Kiểm Thử | Kết Quả Kỳ Vọng | Status |
| :--- | :--- | :--- | :--- | :---: |
| **VC-01** | Kiểm tra cú pháp tệp HTML mới | HTML Validator / File Inspect | Không lỗi cú pháp thẻ head/body | ✅ **PASS** |
| **VC-02** | Đường dẫn tương đối CSS & JS | Static Inspection | `../../iflux-admin-ui/iflux-admin-ui.css` nạp thành công | ✅ **PASS** |
| **VC-03** | Router JS Mapping | Node check & Router Evaluation | `fileFromAdminPath` trả đúng `market/sectors.html` | ✅ **PASS** |
| **VC-04** | Deploy Unit Admin Sync | `rsync over SSH` command | Tệp `sectors.html` có mặt trên đĩa Production | ✅ **PASS** |
| **VC-05** | Cache Invalidation | Cloudflare API Call theo Deployment SoT | Response `{"success":true}` | ✅ **PASS** |
| **VC-06** | Production Clean URL Verification | `curl -i https://iflux.vn/admin/thi-truong/sectors` | Response `HTTP/2 200 OK` | ✅ **PASS** |

---

## 4. Change Boundary (Ranh Giới Thay Đổi)

| Scope Category | Status | Detail / Boundary Rule |
| :--- | :---: | :--- |
| **Allowed Changes (Được phép)** | **YES** | Move 2 HTML files, update relative asset paths, update router file mapping |
| **Forbidden Changes (Cấm thực hiện)** | **NO** | Cấm sửa API Backend, cấm sửa Database, cấm sửa phân quyền RBAC, cấm sửa Nginx rewrite rules, cấm thiết kế lại Admin routing |

---

## 5. Definition of Done (DoD)

Task được coi là hoàn thành khi:
1. Clean URL Production (`/admin/thi-truong/sectors` và `/admin/thi-truong/ecosystems`) resolve đúng tài nguyên HTML vật lý mới.
2. Browser runtime verification: HTML, CSS, JS dependency load thành công, không phát sinh lỗi resource loading hoặc runtime error do việc thay đổi vị trí file.
3. Nginx Infrastructure giữ nguyên 100% quy tắc nguyên bản, **không chứa bất kỳ special-case rule nào**.
4. Toàn bộ bằng chứng (Evidence) được ghi nhận đầy đủ trong tài liệu `walkthrough.md`.
