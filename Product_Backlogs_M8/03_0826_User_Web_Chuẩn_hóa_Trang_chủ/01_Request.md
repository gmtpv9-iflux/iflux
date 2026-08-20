# Request — Chuẩn hóa “Nhà của tôi” → “Trang chủ”


| Field        | Value                                             |
| ------------ | ------------------------------------------------- |
| Platform     | User Web · Admin · Database · Routing · SEO       |
| Module       | User Web Page Identity                            |
| Task         | `03_0826_User_Web_Chuẩn_hóa_Trang_chủ`            |
| Tên tài liệu | `01_Request.md`                                   |
| Status       | **REQUESTED — Mandatory Audit Required**          |
| Owner        | Requester + Product/Architecture Owner            |
| Agent        | Audit / Solution / Plan / Implementation / Verify |


---

# 1. Business Request

Chuẩn hóa page hiện tại **“Nhà của tôi”** thành **“Trang chủ”** trên toàn hệ thống.

Đây vẫn là **page hiện tại**, không tạo page mới và không thay đổi nội dung hay chức năng của page.

Mục tiêu cuối cùng:

```text
Nhà của tôi
    ↓
Trang chủ
```

URL của page cũng phải được chuẩn hóa theo identity mới:

```text
/nha-cua-toi/
    ↓
/trang-chu/
```

Việc thay đổi phải được đồng bộ ở toàn bộ các nơi đang đại diện hoặc tham chiếu tới page này, bao gồm User Web, Admin, Database và các system reference liên quan nếu có.

User Web root phải trở thành default landing của page này:

```text
/
↓
/trang-chu/
```

**Không thay đổi:**

* Content hiện tại của page.
* Widget và chức năng hiện tại.
* Business logic.
* Data semantics.
* Các page khác, đặc biệt **Thị trường** và **Cộng đồng**.

---

# 2. Mandatory Audit (AD)

Trước khi xây dựng PRD, Agent phải thực hiện **Mandatory Audit** để xác định hiện trạng và cách đạt Business Request.

Audit phải xác định:

### 2.1 Page Identity

* Technical Page Identity hiện tại của “Nhà của tôi”.
* Các registry/manifest/configuration đang nhận diện page này.
* Display Name hiện được lưu/khai báo ở đâu.

### 2.2 User Web

Audit toàn bộ representation của page trên User Web:

* Display Name
* Navigation
* Placement
* Page Registry / Manifest
* Route
* URL
* Internal Links
* Breadcrumb
* Canonical
* Metadata

### 2.3 Admin

Xác định các representation của **chính User Web page này** trong Admin:

* Page Name
* Placement
* Navigation
* Page Registry
* Configuration
* Database-backed configuration
* Các reference liên quan

Không được đồng nhất các Admin business module có tên tương tự với User Web page nếu chúng không cùng Page Identity.

### 2.4 Database

Xác định:

* Database có lưu `Nhà của tôi` hay không.
* Bảng/record nào liên quan.
* Database có phải Source of Truth hay không.
* Các surface nào consume dữ liệu đó.

### 2.5 URL & Routing

Audit:

```text
/nha-cua-toi/
```

và toàn bộ routing/reference liên quan.

Xác định:

* canonical URL hiện tại;
* route registry;
* application routing;
* Nginx/routing layer;
* redirect hiện tại;
* internal URL references;
* root `/` hiện đang dẫn tới đâu.

### 2.6 SEO / Sitemap

Audit các representation liên quan:

* SEO title/name;
* canonical;
* Open Graph;
* sitemap;
* metadata;
* SEO registry/configuration.

### 2.7 Source of Truth & Dependency

Phải xác định:

> Nơi nào là nguồn quyết định Page Identity / Display Name / URL, và những system surface nào phụ thuộc vào nguồn đó.

Nếu có nhiều Source of Truth hoặc phát hiện discrepancy giữa implementation hiện tại và SoT đã khóa:

> **Không tự chọn. Ghi nhận discrepancy để Owner xử lý trong PRD.**

### 2.8 Scope Integrity

Audit phải xác nhận việc đạt Request này **không yêu cầu** thay đổi:

* content;
* widget;
* business logic;
* data semantics;
* identity/content của Thị trường;
* identity/content của Cộng đồng.

Nếu phát hiện dependency bắt buộc ngoài phạm vi trên, phải ghi rõ dependency và lý do cần thiết.

---

# 3. Audit Output

Audit phải trả về:

1. **Current State** của page “Nhà của tôi”.
2. **Page Identity / Source of Truth**.
3. **Reference Inventory** trên User Web, Admin và Database.
4. **URL / Routing Inventory**.
5. **SEO / Sitemap Inventory**.
6. **Dependency & Discrepancy**.
7. **Scope Impact**.
8. **Kết luận Audit** về khả năng thực hiện Business Request.

**Không implementation trong bước Audit.**

---

## Owner Intent

> **Chỉ một mục tiêu: đổi page hiện tại “Nhà của tôi” thành “Trang chủ” một cách nhất quán trên toàn hệ thống, bao gồm tên, URL và các reference/dependency liên quan; đồng thời đưa page này trở thành default landing `/ → /trang-chu/`. Content, widget, business logic và các page khác không thay đổi.**
>
> **Audit phải xác định chính xác hệ thống hiện tại và Source of Truth trước khi xây dựng PRD.**
