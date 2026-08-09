# 01 — Business Requirement

# Stock Registry Business Source of Truth Audit & Standardization

|                 |                                                              |
| --------------- | ------------------------------------------------------------ |
| **Task ID**     | `010826_Stock_Registry_Source_of_Truth`                      |
| **Document ID** | BRD-STOCK-SOT-001                                            |
| **Version**     | 1.0                                                          |
| **Status**      | 🔒 **LOCKED (Khóa Cố Định — Phê Duyệt Bởi Product Owner)**    |
| **Date**        | 2026-08-03                                                   |

---

# 1. Business Objective

Hiện tại Capability **Stock Registry** có dấu hiệu tồn tại nhiều nguồn dữ liệu khác nhau trên cả Frontend và Backend.

Ví dụ (chưa giới hạn):

* PostgreSQL Database
* localStorage
* Hardcode
* Seed Data
* Mock Data
* Runtime Memory
* Static JSON
* Registry
* Cache
* DNSE Response
* các nguồn khác nếu Audit phát hiện

Hiện chưa có đủ bằng chứng để khẳng định đâu là Business Source of Truth thực sự.

Điều này tạo nguy cơ:

* nhiều nơi cùng sở hữu Business Data
* dữ liệu không đồng bộ
* ghi sai nơi
* đọc sai nơi
* rất khó mở rộng Capability
* rất khó thay thế Data Provider
* vi phạm nguyên tắc Single Source of Truth

---

# 2. Business Goal

Task này có mục tiêu:

**Audit toàn bộ Capability Stock Registry để xác lập duy nhất một Business Source of Truth.**

Sau khi hoàn thành Task:

* chỉ còn đúng một Business Source of Truth của Stock
* mọi Capability trong hệ thống đều phải đọc Business Data từ cùng một nguồn
* mọi thay đổi Business Data đều phải ghi vào cùng một nguồn
* không còn tồn tại Business Source thứ hai

---

# 3. Scope

Bao gồm toàn bộ hệ thống.

Không giới hạn:

* Frontend
* Backend
* Database
* API
* Adapter
* Registry
* Cache
* Runtime Memory
* Seed
* Mock
* Hardcode
* localStorage
* Background Job
* Integration Layer
* Import Pipeline
* Export Pipeline

Audit phải truy vết toàn bộ đường đi của dữ liệu Stock.

---

# 4. Audit Requirements

Audit bắt buộc phải trả lời đầy đủ các câu hỏi sau bằng bằng chứng.

## 4.1 Ownership Audit

Stock hiện đang được sở hữu ở đâu?

Liệt kê đầy đủ:

* Producer
* Consumer
* Owner
* Boundary

---

## 4.2 Runtime Audit

Trong Runtime hiện tại:

Stock đang được đọc từ đâu.

Stock đang được ghi vào đâu.

Có bao nhiêu nơi đang cùng sở hữu Business Data.

---

## 4.3 Duplicate Source Audit

Rà soát toàn bộ dự án.

Nếu phát hiện bất kỳ nguồn dữ liệu Stock nào ngoài Business Source of Truth phải báo cáo đầy đủ:

* file
* module
* capability
* runtime
* owner
* consumer
* bằng chứng
* mức độ ảnh hưởng

Không được bỏ sót bất kỳ Duplicate Source nào.

---

## 4.4 Capability Boundary Audit

Phân biệt rõ:

Business Data

và

Market Data.

Business Data thuộc Capability nào.

Market Data thuộc Capability nào.

Boundary phải rõ ràng.

---

## 4.5 Provider Audit

Đối với từng Data Provider (ví dụ DNSE):

Audit:

* dữ liệu nào Provider sở hữu
* dữ liệu nào Provider không được sở hữu
* dữ liệu nào chỉ được đồng bộ
* dữ liệu nào chỉ được tham chiếu

Không được để Provider trở thành Business Owner.

---

# 5. Expected Architecture

Sau khi hoàn thành Task:

Business Capability

```text
Stock Registry
        │
        ▼
Business Source of Truth
        │
        ▼
(Post-Audit: nguồn duy nhất được phê duyệt)
```

Market Capability

```text
Market Data Provider (DNSE hoặc Provider khác)
        │
        ▼
Adapter
        │
        ▼
Market Data
```

Business Capability và Market Data Capability phải tách biệt hoàn toàn.

---

# 6. Success Criteria

Task chỉ được coi là hoàn thành khi:

* xác định được duy nhất một Business Source of Truth cho Stock
* mọi Capability đều sử dụng cùng Business Source of Truth
* toàn bộ Duplicate Sources được Audit đầy đủ
* có Ownership Map hoàn chỉnh
* có Runtime Data Flow hoàn chỉnh
* Business Data và Market Data được phân tách rõ ràng
* Data Provider không còn đóng vai trò Business Owner
* chỉ sau khi Product Owner phê duyệt Audit mới được phép lập `04 — Technical Solution`

> **Quy Định Quản Trị Mới (Project Governance Directive):**  
> *Mọi Business Entity (Stock, Sector, Ecosystem, Company, User, Post...) đều phải có một Business Source of Truth được xác định trước khi phát triển Capability. Nếu Audit phát hiện nhiều hơn một Business Source thì phải dừng Implementation, hoàn thành Duplicate Source Audit và Ownership Audit trước khi được phép thiết kế Solution.*
