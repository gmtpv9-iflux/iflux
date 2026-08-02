# 04 - Solution Design: Thiết Kế Phương Án Chuẩn Hóa Kiến Trúc Trang Admin

|                 |                                                              |
| --------------- | ------------------------------------------------------------ |
| **Document ID** | SOL-ADMIN-ARCH-001                                           |
| **Version**     | 1.1                                                          |
| **Status**      | 🔒 **APPROVED & LOCKED (Phê duyệt bởi Product Owner)**       |
| **Date**        | 2026-08-02                                                   |
| **Target Task** | `020826_Admin_Page_Architecture_Standardization`             |

| **Căn cứ BR**   | [`01 - Business Requirement.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/020826_Admin_Page_Architecture_Standardization/01%20-%20Business%20Requirement.md) `[🔒 LOCKED]` |
| **Căn cứ Audit** | [`02 - Context Audit.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/020826_Admin_Page_Architecture_Standardization/02%20-%20Context%20Audit.md) `[🔒 LOCKED]` |
| **Căn cứ SoT**  | [`03 - Governing SoT.md`](file:///Users/mac/Documents/Productions/iFLUX_P1/Product%20Backlogs/020826_Admin_Page_Architecture_Standardization/03%20-%20Governing%20SoT.md) `[🔒 APPROVED & LOCKED]` |

---

## 1. Solution Objective (Mục Tiêu Giải Pháp)
Thiết kế phương án kỹ thuật để đưa các Admin Pages đã được xác định là deviation trong Audit về đúng **Admin Page Architecture SoT (`SOT-ADMIN-ARCH-001`)**:
- Chuẩn hóa cấu trúc tệp tin vật lý của 2 trang `sectors` và `ecosystems` về chuẩn Convention A (`app/market/sectors.html` và `app/market/ecosystems.html`).
- Đảm bảo an toàn đối với các đường dẫn tương đối (Asset & Relative Path Safety) trong HTML.
- Đồng bộ Router JS đăng ký tệp tin vật lý mới.
- Xác minh tính tương thích đối với Quy tắc Nginx Rewrite Regex nguyên bản trên Production Server mà **không bổ sung bất kỳ câu lệnh special-case Nginx nào**.

---

## 2. Current State vs Target Architecture (Trạng Thái Hiện Tại & Mục Tiêu)

### 2.1 Current State (Trạng Thái Bị Lệch Cần Chuyển Đổi):
```text
Admin_Design_system/app/market/
├── sectors/
│   └── index.html               <-- Deviation (Convention B)
├── ecosystems/
│   └── index.html               <-- Deviation (Convention B)
├── stocks.html                  <-- Standard (Convention A)
├── lot-threshold.html           <-- Standard (Convention A)
└── index.html                   <-- Standard (Convention C - Root Overview)
```

### 2.2 Target Architecture (Kiến Trúc Mục Tiêu Tuân Thủ SoT 100%):
```text
Admin_Design_system/app/market/
├── sectors.html                 <-- [TARGET LOCATION] Đưa về Convention A
├── ecosystems.html              <-- [TARGET LOCATION] Đưa về Convention A
├── stocks.html                  <-- Standard (Convention A)
├── lot-threshold.html           <-- Standard (Convention A)
└── index.html                   <-- Standard (Convention C - Root Overview)
```

> **📌 Nguyên tắc Controller JS:** Controller Javascript (`market-sectors-page.js`, `market-ecosystems-page.js`) không thuộc phạm vi migration nếu không có rủi ro đường dẫn phụ thuộc (dependency path issue); giữ nguyên vị trí hiện tại.

---

## 3. Migration Strategy (Chiến Lược Chuyển Đổi Safety-First)

Quá trình chuyển đổi được thực hiện theo 3 giai đoạn:
1. **Giai đoạn 1: Refactor Tệp Vật Lý & Điều Chỉnh Đường Dẫn Tương Đối (File Relocation & Asset Adjustment)**
   - Di chuyển `sectors/index.html` $\rightarrow$ `sectors.html`.
   - Di chuyển `ecosystems/index.html` $\rightarrow$ `ecosystems.html`.
   - Điều chỉnh độ sâu đường dẫn tương đối từ 2 cấp (`../../`) về 1 cấp (`../`) trong HTML head/scripts.
2. **Giai đoạn 2: Cập Nhật Router Mapping (Router Alignment)**
   - Cập nhật khai báo `PAGES` trong [`iflux-admin-routes.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/iflux-admin-ui/iflux-admin-routes.js) trỏ đúng tệp `.html` mới.
3. **Giai đoạn 3: Dọn Đẹp Thư Mục Cũ & Xác Minh Hạ Tầng (Cleanup & Validation)**
   - Cleanup physical directory sau khi migration và kiểm thử thành công.
   - Xác minh Nginx Regex Rewrite trả về `200 OK` trên Clean URL `/admin/thi-truong/sectors`.

---

## 4. File Migration Design & Asset Path Safety (Thiết Kế Chuyển Đổi Tệp & An Toàn Asset)

### ⚠️ Pre-condition Bắt Buộc:
Trước Implementation, **bắt buộc verify tất cả relative reference trong HTML thực tế**. Không được phép replace path theo pattern giả định mà không kiểm tra tệp tin nguồn.

### 4.1 Phân Tích Sự Thay Đổi Độ Sâu Đường Dẫn (Path Depth Analysis):
- **Trạng thái cũ (`app/market/sectors/index.html`):** Tệp nằm ở độ sâu **3 cấp thư mục** (`app` $\rightarrow$ `market` $\rightarrow$ `sectors`). Muốn truy cập `iflux-admin-ui/` phải đi ngược **2 cấp** (`../../iflux-admin-ui/`).
- **Trạng thái mới (`app/market/sectors.html`):** Tệp nằm ở độ sâu **2 cấp thư mục** (`app` $\rightarrow$ `market`). Muốn truy cập `iflux-admin-ui/` chỉ đi ngược **1 cấp** (`../iflux-admin-ui/`).

### 4.2 Chi Tiết Refactor HTML Head & Script Tags:

#### A. Đối với `sectors.html` (chuyển từ `sectors/index.html`):
```diff
- <link rel="stylesheet" href="../../iflux-admin-ui/iflux-admin-ui.css" />
+ <link rel="stylesheet" href="../iflux-admin-ui/iflux-admin-ui.css" />

- <script src="../../iflux-admin-ui/iflux-market-seed-data.js"></script>
- <script src="../../iflux-admin-ui/iflux-market-ecosystem-seeds.js"></script>
- <script src="../../iflux-admin-ui/iflux-market-registry-store.js"></script>
- <script src="../../iflux-admin-ui/iflux-admin-ui.js"></script>
+ <script src="../iflux-admin-ui/iflux-market-seed-data.js"></script>
+ <script src="../iflux-admin-ui/iflux-market-ecosystem-seeds.js"></script>
+ <script src="../iflux-admin-ui/iflux-market-registry-store.js"></script>
+ <script src="../iflux-admin-ui/iflux-admin-ui.js"></script>

- <script src="../market-sectors-page.js"></script>
+ <script src="market-sectors-page.js"></script>
```

#### B. Đối với `ecosystems.html` (chuyển từ `ecosystems/index.html`):
```diff
- <link rel="stylesheet" href="../../iflux-admin-ui/iflux-admin-ui.css" />
+ <link rel="stylesheet" href="../iflux-admin-ui/iflux-admin-ui.css" />

- <script src="../../iflux-admin-ui/iflux-market-seed-data.js"></script>
- <script src="../../iflux-admin-ui/iflux-market-ecosystem-seeds.js"></script>
- <script src="../../iflux-admin-ui/iflux-market-registry-store.js"></script>
- <script src="../../iflux-admin-ui/iflux-admin-ui.js"></script>
+ <script src="../iflux-admin-ui/iflux-market-seed-data.js"></script>
+ <script src="../iflux-admin-ui/iflux-market-ecosystem-seeds.js"></script>
+ <script src="../iflux-admin-ui/iflux-market-registry-store.js"></script>
+ <script src="../iflux-admin-ui/iflux-admin-ui.js"></script>

- <script src="../market-ecosystems-page.js"></script>
+ <script src="market-ecosystems-page.js"></script>
```

---

## 5. Router & Navigation Alignment (Đồng Bộ Router & Navigation)

### 5.1 Cập Nhật [`iflux-admin-routes.js`](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/iflux-admin-ui/iflux-admin-routes.js):
Chỉnh sửa registry `PAGES` để trỏ trực tiếp về tệp `.html` mới:
```javascript
// Trước khi sửa:
"market-ecosystems-index": { key: "market-ecosystems-index", slug: "/admin/thi-truong/ecosystems", file: "market/ecosystems/index.html" },
"market-sectors-index": { key: "market-sectors-index", slug: "/admin/thi-truong/sectors", file: "market/sectors/index.html" },

// Sau khi sửa (Chuẩn SoT):
"market-ecosystems-index": { key: "market-ecosystems-index", slug: "/admin/thi-truong/ecosystems", file: "market/ecosystems.html" },
"market-sectors-index": { key: "market-sectors-index", slug: "/admin/thi-truong/sectors", file: "market/sectors.html" },
```

### 5.2 Navigation Registry Status:
Theo Audit hiện tại, Navigation URL (`/admin/thi-truong/sectors` và `/admin/thi-truong/ecosystems`) không cần thay đổi. Implementation phải verify lại toàn bộ menu link sau khi migration.

---

## 6. Infrastructure Validation (Xác Minh Hạ Tầng Nginx)

Quy tắc Nginx Rewrite Regex nguyên bản trên Production Server:
```nginx
location ~ ^/admin/thi-truong/(?<admPage>[^/]+)/?$ {
    rewrite ^ /Admin_Design_system/app/market/$admPage.html break;
    root /var/www/iflux/production;
}
```

### 🎯 Expected Result (Kết Quả Kỳ Vọng Sau Migration):
1. Request: `GET /admin/thi-truong/sectors`
2. Nginx khớp Regex `location ~ ^/admin/thi-truong/(?<admPage>[^/]+)/?$` $\rightarrow$ gán `$admPage = sectors`.
3. Nginx rewrite thành: `/Admin_Design_system/app/market/sectors.html`.
4. Clean URL phải resolve thành công tới tệp vật lý mới `/var/www/iflux/production/Admin_Design_system/app/market/sectors.html` và **trả HTTP/2 200 OK**.

---

## 7. Deployment Impact (Tác Động Triển Khai)

* **Không thay đổi API Backend:** Tất cả các endpoint Admin API (`/api/admin/sectors`, `/api/admin/ecosystems`) giữ nguyên.
* **Không thay đổi Database:** Không tác động tới cơ sở dữ liệu.
* **Không thay đổi Business Logic:** Logic xử lý dữ liệu của Javascript Controller giữ nguyên.
* **Chỉ thay đổi Static Resource Mapping:** Chỉ thay đổi vị trí file HTML và mapping tài nguyên tĩnh.

---

## 8. Verification Strategy (Chiến Lược Xác Minh Kiểm Thử)

Chiến lược xác minh gồm 2 tầng bắt buộc:

1. **Static Syntax Validation (Kiểm tra cú pháp tĩnh):**
   - Thực thi static syntax check phù hợp với loại file (ví dụ: `node -c` đối với file JS phù hợp).
2. **Browser Runtime Verification (Xác minh trên Trình duyệt):**
   - **Browser Runtime Verification bắt buộc:** Mở trang Admin trên browser runtime thật, xác minh 100% không có lỗi nạp tài nguyên (CSS/JS 404), console log sạch, và tính năng UI hoạt động hoàn hảo.
3. **Empirical Production URL Verification (Xác minh URL Production):**
   - Thực thi `curl -i -s https://iflux.vn/admin/thi-truong/sectors` $\rightarrow$ Kết quả kỳ vọng `HTTP/2 200 OK`.
   - Thực thi `curl -i -s https://iflux.vn/admin/thi-truong/ecosystems` $\rightarrow$ Kết quả kỳ vọng `HTTP/2 200 OK`.

---

## 9. Rollback Strategy (Kế Hoạch Hoàn Tác Khi Có Sự Cố)

Nếu phát sinh sự cố trên Production, quy trình rollback không phụ thuộc vào `git reset` mà tuân thủ:
1. Restore previous deployed artifact / static files (Khôi phục tệp tĩnh cũ `sectors/index.html` và `ecosystems/index.html`).
2. Restore previous router mapping (`iflux-admin-routes.js`).
3. Re-rsync và Purge Cloudflare CDN Cache.

---

## 10. Impact Analysis (Bảng Phân Tích Tác Động Chi Tiết)

| Component | Impact Status | Detail / Scope of Impact |
| :--- | :---: | :--- |
| **HTML Pages** | **YES** | Di chuyển vị trí 2 tệp vật lý & điều chỉnh đường dẫn tương đối CSS/JS |
| **Router Registry** | **YES** | Cập nhật tên tệp tin mục tiêu trong `iflux-admin-routes.js` |
| **Navigation Menu** | **VERIFY ONLY** | Không đổi đường dẫn Clean URL; kiểm thử lại sau migration |
| **Nginx Infrastructure** | **NO CHANGE** | Giữ nguyên 100% quy tắc Regex nguyên bản |
| **Backend API** | **NO IMPACT** | Không tác động tới các endpoint `/api/admin/...` |
| **Database** | **NO IMPACT** | Không tác động tới cơ sở dữ liệu |
| **Permissions / RBAC** | **NO IMPACT** | Không tác động tới phân quyền |
