# 03 - Governing SoT: Admin Page Architecture Source of Truth

|                 |                                                              |
| --------------- | ------------------------------------------------------------ |
| **Document ID** | SOT-ADMIN-ARCH-001                                           |
| **Version**     | 1.1                                                          |
| **Status**      | 🔒 **APPROVED & LOCKED (Phê duyệt bởi Product Owner)**       |
| **Date**        | 2026-08-02                                                   |
| **Owner**       | Product Owner                                                |
| **Căn cứ BR**   | [`01 - Business Requirement.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/020826_Admin_Page_Architecture_Standardization/01%20-%20Business%20Requirement.md) `[🔒 LOCKED]` |
| **Căn cứ Audit** | [`02 - Context Audit.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/020826_Admin_Page_Architecture_Standardization/02%20-%20Context%20Audit.md) `[🔒 LOCKED]` |

---

## 1. Purpose (Mục Tiêu Ban Hành)
Ban hành **Business Source of Truth (SoT)** chuẩn hóa kiến trúc trang Admin trên toàn bộ hệ thống iFlux, nhằm loại bỏ hoàn toàn các convention tự phát, triệt tiêu các quy tắc special-case trong Nginx Infrastructure, và thiết lập tiêu chuẩn bắt buộc cho mọi module Admin hiện có và phát triển mới.

---

## 2. Official Architectural Conventions (Các Quy Chuẩn Chính Thức)

### 2.1 Physical File Convention (Quy Chuẩn Tệp Tin Vật Lý Trang Admin)
Mọi trang Admin con (trừ trang Overview Root của Module) **bắt buộc** phải là tệp `.html` đơn lẻ đặt trực tiếp trong thư mục module:
```text
app/{module}/{page}.html
```
- **Ví dụ chuẩn:**
  - `Admin_Design_system/app/market/stocks.html`
  - `Admin_Design_system/app/market/sectors.html`
  - `Admin_Design_system/app/market/ecosystems.html`
  - `Admin_Design_system/app/data/sources.html`

### 2.2 Module Overview Convention (Quy Chuẩn Trang Tổng Quan Module Root)
Tệp `index.html` nằm ở gốc thư mục module được quy định **độc quyền** cho trang Dashboard / Tổng quan của Module đó:
```text
app/{module}/index.html
```
- **Ví dụ chuẩn:**
  - `Admin_Design_system/app/market/index.html` (Tổng quan Thị trường)
  - `Admin_Design_system/app/subscription/index.html` (Tổng quan Gói cước)
  - `Admin_Design_system/app/system/index.html` (Tổng quan Hệ thống)

### 2.3 URL Convention (Quy Chuẩn URL Công Khai Clean URL)
URL hiển thị cho người dùng và trình duyệt **bắt buộc** theo định dạng tiếng Việt chuẩn hóa:
```text
/admin/{vi-module}/{page}
```
- **Ví dụ chuẩn:**
  - `/admin/thi-truong/stocks`
  - `/admin/thi-truong/sectors`
  - `/admin/thi-truong/ecosystems`

### 2.4 Router Convention (Quy Chuẩn Router Mapping)
Router Admin **bắt buộc** đảm bảo nguyên tắc ánh xạ hợp đồng (Contract Mapping):
```text
Clean URL (/admin/{vi-module}/{page})
        ↓
Admin Page Identifier
        ↓
Physical HTML Resource (app/{module}/{page}.html)
```
*Quy tắc mapping:* URL `/admin/{vi-module}/{page}` phải resolve tương ứng về tài nguyên vật lý `app/{module}/{page}.html`. Chi tiết implementation của Router thuộc tài liệu **Solution Design**.

### 2.5 Navigation Convention (Quy Chuẩn Menu Navigation Sidebar)
Menu Navigation Sidebar **bắt buộc** render link hiển thị cho người dùng theo Clean URL: `/admin/{vi-module}/{page}`.

### 2.6 Infrastructure Mapping (Quy Chuẩn Ánh Xạ Hạ Tầng Nginx)
Tầng hạ tầng (Infrastructure) **bắt buộc** phải hỗ trợ:
```text
/admin/{vi-module}/{page}  ──(Rewrite / Proxy)──>  app/{module}/{page}.html
```
- **Yêu cầu bắt buộc:** Không được phép yêu cầu special-case, page-specific rewrite, hoặc exception rule độc lập cho bất kỳ trang Admin riêng lẻ nào.

---

## 3. Forbidden Patterns (Các Pattern Cấm)

1. ❌ **CẤM TẠO:** `app/{module}/{page}/index.html` (Mỗi trang Admin tạo 1 thư mục con chứa `index.html`) — ngoại trừ trường hợp có **Decision Exception** bằng văn bản được ký bởi Product Owner.
2. ❌ **CẤM TẠO:** Nginx Special-case Rewrite rules (ví dụ `rewrite ... sectors/index.html break;`) để vá lỗi lệch kiến trúc file.
3. ❌ **CẤM DÙNG:** Đường dẫn vật lý nội bộ `Admin_Design_system/app/...` trên menu hiển thị hoặc tài liệu nghiệm thu.

---

## 4. Existing Deviation Registry (Danh Mục Các Trường Hợp Chưa Tuân Thủ SoT)

Các trường hợp trong hệ thống hiện đang không tuân thủ SoT:

| Physical Path | Current Violation | Required Resolution |
| :--- | :--- | :--- |
| `Admin_Design_system/app/market/sectors/index.html` | Convention B (Subdirectory Index) | Migration required $\rightarrow$ `app/market/sectors.html` |
| `Admin_Design_system/app/market/ecosystems/index.html` | Convention B (Subdirectory Index) | Migration required $\rightarrow$ `app/market/ecosystems.html` |

---

## 5. Governance & Review Rules (Quy Tắc Quản Trị & Nghiệm Thu)

1. **Tiêu chuẩn Review / Audit:** Mọi PR / Merge Request bổ sung trang Admin mới **bắt buộc** kiểm tra tính tuân thủ 100% đối với SoT này.
2. **Quyền Từ Chối (Reject Power):** Mọi PR tạo trang Admin dạng `app/{module}/{page}/index.html` hoặc yêu cầu sửa Nginx special-case rule sẽ bị **REJECT TỰ ĐỘNG** ở bước Code Review.
