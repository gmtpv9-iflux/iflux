# iFlux — Admin Architecture Specification

**Mã tài liệu:** 10_ADMIN_ARCHITECTURE_SPEC  
**Phiên bản:** 1.0.0  
**Trạng thái:** Draft — GĐ1 + GĐ2 scope  
**Nguồn SoT:** BRD §20, BRD §21, IA §18, PRD §16  
**Đối tượng:** Product Owner, Backend Engineer, Frontend Engineer (Admin)

> File này là **tầng Architecture** — định nghĩa domain, entity, workflow, permission.  
> Không mô tả UI chi tiết. Không chứa tech stack hay implementation.  
> Tài liệu implementation → `11_ADMIN_IMPLEMENTATION_GUIDE` (viết sau).

---

## MỤC LỤC

1. [Mục tiêu & Phạm vi](#1-mục-tiêu--phạm-vi)
2. [Role & Permission Model](#2-role--permission-model)
3. [Information Architecture](#3-information-architecture)
4. [Module Definition](#4-module-definition)
5. [Screen Definition](#5-screen-definition)
6. [Entity Definition](#6-entity-definition)
7. [Workflow Definition](#7-workflow-definition)
8. [Business Rules](#8-business-rules)

---

## 1. Mục tiêu & Phạm vi

### 1.1 Định nghĩa

Admin Panel là **Control Center nội bộ duy nhất** của hệ sinh thái iFlux — nơi đội vận hành quản lý toàn bộ:

- **User & Subscription** — tài khoản, gói, thanh toán
- **Community** — nội dung, kiểm duyệt, báo cáo vi phạm
- **Story Intelligence** — Story chính thức, lifecycle, mapping
- **Market Intelligence** — Sector, Ecosystem, Ranking config
- **AI Operations** — Prompt, log, cost, quality
- **Data Governance** — Data source, ETL, pipeline health
- **Analytics** — Metrics kinh doanh và sản phẩm
- **System** — Role, permission, feature flags, audit

### 1.2 Nguyên tắc cốt lõi

- Admin **không thao tác trực tiếp DB** — mọi mutation đi qua Service Layer API
- Mọi mutation đều tạo **Audit Log** tự động ở backend
- Các action nhạy cảm yêu cầu **xác nhận lần 2 + lý do bắt buộc**
- UI hiển thị **theo role** — role không có quyền không thấy menu/button
- Truy cập **VPN-only + 2FA bắt buộc**

### 1.3 Phạm vi theo Giai đoạn

| Module | GĐ1 (MVP) | GĐ2 | GĐ3 |
|---|---|---|---|
| Dashboard | ✅ | Mở rộng | — |
| User Center | ✅ | — | — |
| Market Intelligence | ✅ | — | — |
| Data Governance | ✅ | Mở rộng | — |
| System | ✅ | — | — |
| Community Center | ⚠️ Skeleton | ✅ Full | — |
| Story Intelligence | ⚠️ Skeleton | ✅ Full | — |
| AI Center | ❌ | ✅ | Mở rộng |
| Analytics Center | ⚠️ Basic | ✅ Full | — |
| Subscription Center | ✅ Basic | ✅ Full | — |

---

## 2. Role & Permission Model

### 2.1 Role Hierarchy

```
Super Admin
    ↓ (kế thừa + thêm)
Admin
    ↓
Analyst
    ↓
Moderator
    ↓
Support
```

### 2.2 Permission Matrix

#### User Center

| Action | Super | Admin | Analyst | Moderator | Support |
|---|---|---|---|---|---|
| View list | ✅ | ✅ | ✅ | ✅ | ✅ |
| View detail | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit profile | ✅ | ✅ | ❌ | ❌ | ❌ |
| Override subscription | ✅ | ✅ | ❌ | ❌ | ❌ |
| Extend subscription | ✅ | ✅ | ❌ | ❌ | ✅ |
| Refund | ✅ | ✅ | ❌ | ❌ | ❌ |
| Suspend | ✅ | ✅ | ❌ | ✅ | ❌ |
| Ban | ✅ | ✅ | ❌ | ❌ | ❌ |
| Impersonate | ✅ | ❌ | ❌ | ❌ | ❌ |
| Export data | ✅ | ✅ | ❌ | ❌ | ✅ |

#### Community Center

| Action | Super | Admin | Analyst | Moderator | Support |
|---|---|---|---|---|---|
| View content | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve story | ✅ | ✅ | ❌ | ✅ | ❌ |
| Reject story | ✅ | ✅ | ❌ | ✅ | ❌ |
| Delete comment | ✅ | ✅ | ❌ | ✅ | ❌ |
| Hide comment | ✅ | ✅ | ❌ | ✅ | ❌ |
| Process report | ✅ | ✅ | ❌ | ✅ | ❌ |
| Grant expert badge | ✅ | ✅ | ❌ | ❌ | ❌ |

#### Story Intelligence

| Action | Super | Admin | Analyst | Moderator | Support |
|---|---|---|---|---|---|
| View registry | ✅ | ✅ | ✅ | ✅ | ❌ |
| Create story | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit story | ✅ | ✅ | ✅ | ❌ | ❌ |
| Archive story | ✅ | ✅ | ✅ | ❌ | ❌ |
| Merge stories | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit mapping | ✅ | ✅ | ✅ | ❌ | ❌ |
| Change lifecycle | ✅ | ✅ | ✅ | ❌ | ❌ |

#### Market Intelligence

| Action | Super | Admin | Analyst | Moderator | Support |
|---|---|---|---|---|---|
| View all | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Stock metadata | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Ecosystem | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Sector/Divisor | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Lot Threshold | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Ranking config | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Formula Registry | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Formula Registry | ✅ | ✅ | ✅ | ❌ | ❌ |

#### Market Data Operations

| Action | Super | Admin | Analyst | Moderator | Support |
|---|---|---|---|---|---|
| View Feed Health | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Market Sessions | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manual Correction (halt/rename/delist) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Trigger reconciliation | ✅ | ✅ | ❌ | ❌ | ❌ |
| Acknowledge feed alert | ✅ | ✅ | ✅ | ❌ | ❌ |

#### AI Center

| Action | Super | Admin | Analyst | Moderator | Support |
|---|---|---|---|---|---|
| View logs | ✅ | ✅ | ✅ | ❌ | ❌ |
| View cost | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit prompts | ✅ | ✅ | ❌ | ❌ | ❌ |
| Rollback prompt | ✅ | ✅ | ❌ | ❌ | ❌ |
| Review quality | ✅ | ✅ | ✅ | ❌ | ❌ |

#### Data Governance

| Action | Super | Admin | Analyst | Moderator | Support |
|---|---|---|---|---|---|
| View pipeline status | ✅ | ✅ | ✅ | ❌ | ❌ |
| Trigger rebuild | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit data sources | ✅ | ✅ | ❌ | ❌ | ❌ |
| View ETL logs | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Data Dictionary | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Data Dictionary | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Reconciliation | ✅ | ✅ | ✅ | ❌ | ❌ |
| Trigger Reconciliation | ✅ | ✅ | ❌ | ❌ | ❌ |

#### System

| Action | Super | Admin | Analyst | Moderator | Support |
|---|---|---|---|---|---|
| View audit log | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| Feature flags | ✅ | ✅ | ❌ | ❌ | ❌ |
| Maintenance mode | ✅ | ✅ | ❌ | ❌ | ❌ |
| System announcement | ✅ | ✅ | ❌ | ❌ | ❌ |
| View SLA dashboard | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 3. Information Architecture

### 3.1 Navigation Structure

```
iFlux Admin
│
├── Dashboard                          (ADM-DASH)
│
├── Users                              (ADM-USR)
│   ├── User List                      ADM-USR-001
│   ├── User Detail                    ADM-USR-002
│   ├── Subscription Actions           ADM-USR-003
│   └── Data Export                    ADM-USR-004
│
├── Community                          (ADM-COM) [GĐ2]
│   ├── Story Moderation               ADM-COM-001
│   ├── Comment Moderation             ADM-COM-002
│   ├── Report Center                  ADM-COM-003
│   └── Expert Management              ADM-COM-004
│
├── Story Intelligence                 (ADM-STR) [GĐ2]
│   ├── Story Registry                 ADM-STR-001
│   ├── Story Detail / Edit            ADM-STR-002
│   ├── Story Mapping                  ADM-STR-003
│   └── Story Analytics                ADM-STR-004
│
├── Market Intelligence                (ADM-MKT)
│   ├── Stock Registry                 ADM-MKT-000  ← MỚI
│   ├── Ecosystem CMS                  ADM-MKT-001
│   ├── Ecosystem Detail               ADM-MKT-002
│   ├── Sector Management              ADM-MKT-003
│   ├── Lot Threshold Config           ADM-MKT-004
│   ├── Ranking Configuration          ADM-MKT-005
│   └── Formula Registry               ADM-MKT-006  ← MỚI
│
├── Market Data Operations             (ADM-MDO)    ← MODULE MỚI
│   ├── Feed Health                    ADM-MDO-001
│   ├── Market Sessions                ADM-MDO-002
│   ├── Missing Tick Monitor           ADM-MDO-003
│   └── Manual Correction              ADM-MDO-004
│
├── AI Center                          (ADM-AI) [GĐ2]
│   ├── Prompt Registry                ADM-AI-001
│   ├── Prompt Detail / Version        ADM-AI-002
│   ├── AI Logs                        ADM-AI-003
│   ├── AI Cost Dashboard              ADM-AI-004
│   └── Quality Review Queue           ADM-AI-005
│
├── Data Governance                    (ADM-DATA)
│   ├── Data Sources                   ADM-DATA-001
│   ├── ETL Jobs                       ADM-DATA-002
│   ├── Pipeline Monitor               ADM-DATA-003
│   ├── Data Quality                   ADM-DATA-004
│   ├── Data Dictionary                ADM-DATA-005  ← MỚI
│   └── Reconciliation Center          ADM-DATA-006  ← MỚI
│
├── Subscription                       (ADM-SUB)
│   ├── Plan Registry                  ADM-SUB-001
│   ├── Active Subscribers             ADM-SUB-002
│   └── Transaction Log                ADM-SUB-003
│
├── Analytics                          (ADM-ANL)
│   ├── User Analytics                 ADM-ANL-001
│   ├── Story Analytics                ADM-ANL-002
│   ├── Revenue Analytics              ADM-ANL-003
│   └── Conversion Funnel              ADM-ANL-004
│
└── System                             (ADM-SYS)
    ├── SLA Dashboard                  ADM-SYS-001
    ├── Feature Flags                  ADM-SYS-002
    ├── Announcements                  ADM-SYS-003
    ├── Maintenance Mode               ADM-SYS-004
    ├── Role Management                ADM-SYS-005
    ├── Admin User Management          ADM-SYS-007  ← MỚI
    └── Audit Log                      ADM-SYS-006

├── Notification Center                (ADM-NOTIF)  ← MODULE MỚI
│   ├── Push Notifications             ADM-NOTIF-001
│   ├── In-App Notifications           ADM-NOTIF-002
│   ├── Email Campaigns                ADM-NOTIF-003
│   └── Broadcast History              ADM-NOTIF-004

└── Metadata Registry                  (ADM-META)   ← MODULE MỚI
    ├── Theme Registry                 ADM-META-001
    ├── Sector Types                   ADM-META-002
    ├── Story Lifecycle Config         ADM-META-003
    └── Enum Management                ADM-META-004
```

---

## 4. Module Definition

### 4.1 Dashboard (ADM-DASH)

**Mục đích:** Tổng quan vận hành — CEO và Admin mở đầu ngày làm việc.

**KPI Groups:**

| Group | Metrics |
|---|---|
| User | Total Users, DAU, New Users (7 ngày), Active Subscribers |
| Revenue | MRR, ARR, Conversion Rate (Free→Premium), Churn Rate |
| Community | Stories created, Comments, Reports pending |
| System | API Health, Data Provider status, Kafka lag, ETL last run |

**Refresh:** Auto-refresh mỗi 60 giây trong giờ giao dịch (9:00–15:30 ICT).

---

### 4.2 User Center (ADM-USR)

**Mục đích:** Quản lý tài khoản người dùng — lookup nhanh, xử lý support, thao tác subscription.

**Sub-modules:**

| Screen | Mục đích |
|---|---|
| User List | Tìm kiếm, filter, danh sách |
| User Detail | Profile + subscription + lịch sử |
| Subscription Actions | Override / Extend / Refund / Block |
| Data Export | Xuất dữ liệu theo yêu cầu GDPR |

---

### 4.3 Community Center (ADM-COM) — GĐ2

**Mục đích:** Kiểm duyệt nội dung do cộng đồng tạo ra.

**Sub-modules:**

| Screen | Mục đích |
|---|---|
| Story Moderation | Duyệt / Từ chối story do user đề xuất |
| Comment Moderation | Ẩn / Xóa comment vi phạm |
| Report Center | Xử lý báo cáo vi phạm từ user |
| Expert Management | Cấp / Thu hồi badge chuyên gia |

---

### 4.4 Story Intelligence Center (ADM-STR) — GĐ2

**Mục đích:** Quản lý toàn bộ Story chính thức của hệ thống — "trái tim vận hành" của iFlux.

**Sub-modules:**

| Screen | Mục đích |
|---|---|
| Story Registry | Danh sách Story chính thức, filter theo lifecycle/status |
| Story Detail / Edit | Sửa tên, mô tả, lifecycle, mapping |
| Story Mapping | Quản lý quan hệ Story ↔ Stock, Sector, User |
| Story Analytics | Engagement, trending, contribution metrics |

---

### 4.5 Market Intelligence (ADM-MKT)

**Mục đích:** Quản lý dữ liệu cốt lõi thị trường — Stock, Ecosystem, Sector, Ranking, Formula.

**Sub-modules:**

| Screen | Mục đích | GĐ |
|---|---|---|
| Stock Registry | CRUD metadata cổ phiếu — entity trung tâm của hệ thống | GĐ1 |
| Ecosystem CMS | CRUD Ecosystem, preview Ig trước khi lưu | GĐ1 |
| Ecosystem Detail | Sửa thành viên + xem Divisor | GĐ1 |
| Sector Management | CRUD Sector, chỉnh Divisor | GĐ1 |
| Lot Threshold Config | Ngưỡng Large Lot theo mã / market cap tier | GĐ1 |
| Ranking Configuration | Weight, threshold, lookback cho Ranking engine | GĐ1 |
| Formula Registry | Đặc tả và version control toàn bộ công thức tính điểm | GĐ1 |

---

### 4.5b Market Data Operations (ADM-MDO)

**Mục đích:** Giám sát và can thiệp thời gian thực vào luồng dữ liệu thị trường — "phòng điều khiển" khi có sự cố data.

**Sub-modules:**

| Screen | Mục đích | GĐ |
|---|---|---|
| Feed Health | Trạng thái kết nối từng data source, tick delay, disconnect alert | GĐ1 |
| Market Sessions | Lịch phiên giao dịch, trạng thái mở/đóng sàn | GĐ1 |
| Missing Tick Monitor | Phát hiện ticker bị missing tick so với kỳ vọng trong phiên | GĐ1 |
| Manual Correction | Xử lý halt, đổi tên mã, hủy niêm yết | GĐ1 |

---

### 4.6 AI Center (ADM-AI) — GĐ2

**Mục đích:** Vận hành AI Soul + AI Spine — prompt, cost, quality.

**Sub-modules:**

| Screen | Mục đích |
|---|---|
| Prompt Registry | Danh sách prompt versions theo workflow |
| Prompt Detail | Xem / Sửa / Rollback version |
| AI Logs | Request / Response / Latency / Cost theo request |
| AI Cost Dashboard | Tổng cost theo ngày/tuần/tháng, breakdown theo model |
| Quality Review Queue | Hallucination reports, bad responses cần review |

---

### 4.7 Data Governance (ADM-DATA)

**Mục đích:** Đảm bảo chất lượng và tính liên tục của data pipeline.

**Sub-modules:**

| Screen | Mục đích | GĐ |
|---|---|---|
| Data Sources | Trạng thái kết nối Provider (FireAnt, SSI...) | GĐ1 |
| ETL Jobs | Trạng thái job: Success / Failed / Running | GĐ1 |
| Pipeline Monitor | Kafka consumer lag, queue depth, throughput | GĐ1 |
| Data Quality | Missing data detection, outlier alerts, failed reconciliation | GĐ1 |
| Data Dictionary | Đặc tả định nghĩa, input, output của mọi metric iFlux tính | GĐ1 |
| Reconciliation Center | So sánh source vs DB vs cache — phát hiện lệch data | GĐ1 |

---

### 4.8 Subscription Center (ADM-SUB)

**Mục đích:** Quản lý plan, subscriber, transaction.

**Sub-modules:**

| Screen | Mục đích |
|---|---|
| Plan Registry | Danh sách plan (Free/Premium/Elite) + config |
| Active Subscribers | Danh sách đang active, sắp hết hạn |
| Transaction Log | Lịch sử payment, refund, chargeback |

---

### 4.9 Analytics Center (ADM-ANL)

**Mục đích:** Metrics sản phẩm và kinh doanh — không phải SLA kỹ thuật.

**Sub-modules:**

| Screen | Mục đích |
|---|---|
| User Analytics | DAU/WAU/MAU, Retention D1/D7/D30 |
| Story Analytics | Views, interactions, story growth rate |
| Revenue Analytics | MRR, ARR, Churn, LTV |
| Conversion Funnel | Free → Premium conversion at each touchpoint |

---

### 4.10 System (ADM-SYS)

**Mục đích:** Cấu hình hệ thống, SLA, audit, quản lý tài khoản Admin.

**Sub-modules:**

| Screen | Mục đích | GĐ |
|---|---|---|
| SLA Dashboard | Trạng thái real-time: latency, uptime, Kafka lag | GĐ1 |
| Feature Flags | Bật/tắt tính năng không cần deploy | GĐ1 |
| Announcements | Gửi thông báo hệ thống → app/web | GĐ1 |
| Maintenance Mode | Bật banner bảo trì, schedule downtime | GĐ1 |
| Role Management | CRUD roles, assign permissions | GĐ1 |
| Admin User Management | CRUD tài khoản Admin, phân role, reset 2FA | GĐ1 |
| Audit Log | Toàn bộ lịch sử thao tác trong Admin | GĐ1 |

---

### 4.11 Notification Center (ADM-NOTIF)

**Mục đích:** Quản lý toàn bộ kênh thông báo đi ra từ iFlux tới người dùng — tách biệt với Alert thông minh (do user tự tạo).

> **Phân biệt:**  
> `Alert thông minh` = user đặt, trigger từ market data (app/web)  
> `Notification Center` = Admin chủ động gửi broadcast, campaign, announcement

**Sub-modules:**

| Screen | Mục đích | GĐ |
|---|---|---|
| Push Notifications | Tạo + gửi push broadcast tới segment user | GĐ1 |
| In-App Notifications | Thông báo xuất hiện trong app (không push) | GĐ1 |
| Email Campaigns | Tạo + gửi email hàng loạt theo segment | GĐ2 |
| Broadcast History | Lịch sử toàn bộ thông báo đã gửi + open rate | GĐ1 |

---

### 4.12 Metadata Registry (ADM-META)

**Mục đích:** Quản lý tập trung mọi dữ liệu cấu hình dạng enum/lookup — không hardcode trong code.

> **Nguyên tắc:** Bất kỳ giá trị nào có thể thay đổi theo thời gian (thêm theme mới, điều chỉnh lifecycle label...) phải nằm ở đây, không nằm trong source code.

**Sub-modules:**

| Screen | Mục đích | GĐ |
|---|---|---|
| Theme Registry | CRUD theme macro (AI, Nâng hạng, Đầu tư công...) | GĐ2 |
| Sector Types | Tên hiển thị và metadata cho từng Sector | GĐ1 |
| Story Lifecycle Config | Label, màu sắc, mô tả cho từng lifecycle stage | GĐ2 |
| Enum Management | Các enum dùng chung: market cap tier, exchange list... | GĐ1 |

---

## 5. Screen Definition

### ADM-DASH: Dashboard

**List of widgets:**
```
User KPI Card       — Total / New 7d / DAU
Revenue KPI Card    — MRR / Conversion Rate
Community KPI Card  — Stories pending / Reports open
System Status       — API Health / Data Provider / ETL last run
```
**Chart:** Area chart DAU 30 ngày  
**Refresh:** 60s auto

---

### ADM-USR-001: User List

**Columns:** User ID · Avatar · Display Name · Email/Phone · Tier · Status · Created At · Last Login  
**Filters:** Keyword · Tier (Free/Premium/Elite) · Status (Active/Suspended/Banned) · Date range  
**Actions per row:** View Detail · Quick Suspend  
**Bulk actions:** Export selected

---

### ADM-USR-002: User Detail

**Sections:**

| Section | Nội dung |
|---|---|
| Profile | Avatar, tên, email, phone, ngày tạo |
| Subscription | Tier hiện tại, ngày hết hạn, lịch sử gói |
| Activity | Last login, devices, session count |
| Transactions | Lịch sử payment / refund |
| Audit trail | Lịch sử thao tác Admin trên account này |

**Action buttons (hiển thị theo role):**

| Action | Role tối thiểu | Destructive? |
|---|---|---|
| Override Subscription | Admin | ✅ yêu cầu lý do |
| Extend Subscription | Support | ❌ |
| Suspend | Moderator | ✅ yêu cầu lý do |
| Ban | Admin | ✅ yêu cầu lý do |
| Export Data | Support | ❌ |
| Impersonate | Super Admin | ✅ double confirm |

---

### ADM-MKT-001: Ecosystem CMS

**Columns:** Tên · Số mã · Divisor · Trạng thái · Updated At  
**Filters:** Trạng thái (Active/Inactive)  
**Actions:** Sửa thành viên · Bật/Tắt · Xem lịch sử

---

### ADM-MKT-002: Ecosystem Detail

**Layout 2 cột:**

```
TRÁI: Danh sách thành viên hiện tại
  - Search ticker để thêm
  - Xóa mã (click X)

PHẢI: Preview kết quả
  - Ig hiện tại
  - Ig sau thay đổi
  - Divisor mới
  - % thay đổi Ig
  - [Preview] [Lưu — disabled cho đến khi preview]
```

**Rule:** Nút Lưu bị disabled cho đến khi user click Preview ít nhất 1 lần.

---

### ADM-STR-001: Story Registry

**Columns:** Story Name · Lifecycle · Status · Stocks Count · Created By · Updated At  
**Filters:** Keyword · Lifecycle · Status  
**Actions:** Create · Edit · Archive · Merge

---

### ADM-STR-002: Story Detail

**Sections:**

| Section | Nội dung |
|---|---|
| Basic info | Tên, mô tả, category |
| Lifecycle | Badge trạng thái + nút chuyển lifecycle |
| Mapping | Danh sách Stocks, Sectors liên quan |
| Analytics | Views, interactions, trend score |
| History | Ai đổi gì, khi nào |

---

### ADM-STR-003: Story Mapping

**Layout:**

```
Story: Đầu tư công
│
├── Stocks (17 mã)
│   HPG, NKG, VCG, HHV...  [+ Thêm] [Xóa]
│
├── Sectors (3 ngành)
│   Thép, VLXD, Xây dựng   [+ Thêm] [Xóa]
│
└── Related Stories (2 story)
    Hạ tầng, Giải ngân vốn  [+ Thêm] [Xóa]
```

---

### ADM-AI-001: Prompt Registry

**Columns:** Prompt ID · Workflow · Version · Status · Updated By · Updated At  
**Actions:** View · Edit · Set Active · Rollback

---

### ADM-AI-003: AI Logs

**Columns:** Timestamp · Workflow · Latency (ms) · Tokens · Cost (USD) · Status · User  
**Filters:** Workflow · Status (success/error) · Date range  
**Detail view:** Full request/response JSON

---

### ADM-DATA-002: ETL Jobs

**Columns:** Job Name · Schedule · Last Run · Status · Duration · Records Processed  
**Status values:** `success` · `running` · `failed` · `skipped`  
**Actions:** View log · Trigger manual run (Super Admin only)

---

### ADM-DATA-004: Data Quality

**Sections:**

| Section | Hiển thị |
|---|---|
| Missing Data | Tickers/Sessions thiếu data so với kỳ vọng |
| Outlier Alerts | Giá trị bất thường vượt threshold |
| Failed Reconciliation | Kết quả lệch giữa Redis vs DB |
| Provider Health | Uptime, latency, last successful tick |

---

### ADM-MKT-000: Stock Registry

**Mục đích:** Quản lý metadata cổ phiếu — entity trung tâm của toàn bộ hệ thống iFlux.

**Columns:** Ticker · Tên · Sàn · Sector · Market Cap Tier · Trạng thái · Updated At  
**Filters:** Exchange (HOSE/HNX/UPCOM) · Sector · Market Cap Tier · Status (active/halted/delisted)  
**Actions per row:** View · Edit Metadata · Change Sector · Archive

**Edit form fields:**
```
Ticker          — readonly (không đổi được)
Tên công ty     — varchar
Exchange        — select: HOSE | HNX | UPCOM
Sector          — select từ Sector Registry
Market Cap Tier — select: large | mid | small
Lot Threshold   — number (VND) — link sang ADM-MKT-004
Status          — select: active | halted | delisted
Description     — textarea (optional)
```

**Note:** Ticker là immutable key — không được sửa sau khi tạo.

---

### ADM-MKT-006: Formula Registry

**Mục đích:** Version control toàn bộ công thức tính điểm iFlux — SoT cho mọi metric được tính.

**Columns:** Formula Key · Tên · Version · Status · Updated By · Updated At  
**Actions:** View · Edit · New Version · Set Active · View History

**Detail view per formula:**
```
Formula Key:    money_flow_score
Display Name:   Money Flow Score
Description:    Đo lường cường độ dòng tiền vào/ra theo 4 chủ thể

Version:        1.2.0 (active)

Inputs:
  active_buy_value    BIGINT   — giá trị mua chủ động (VND)
  active_sell_value   BIGINT   — giá trị bán chủ động (VND)
  net_flow_foreign    BIGINT   — dòng ròng khối ngoại (VND)
  net_flow_retail     BIGINT   — dòng ròng cá nhân (VND)

Formula:
  raw = (active_buy_value - active_sell_value) / total_value * 100
  weight_foreign = 0.4
  weight_retail  = 0.3
  ...
  score = weighted_sum normalized to 0–100

Output:
  money_flow_score    FLOAT    — 0 (sell pressure) to 100 (buy pressure)

Notes:
  Thay đổi từ v1.1: bổ sung weight cho retail (trước đây chỉ foreign)
  Effective from: 2026-01-15
```

**Version history table:** Version · Effective Date · Changed By · Summary of changes

---

### ADM-MDO-001: Feed Health

**Mục đích:** Real-time dashboard trạng thái từng data feed.

**Per-feed status card:**
```
SSI Feed
├── Status:       ● Connected
├── Last tick:    09:32:15 (2s ago)
├── Tick rate:    ~340 ticks/min
├── Avg latency:  48ms
└── Alerts:       0 open
```

**Alert table:** Feed · Alert type · Since · Duration · Status (open/acknowledged)  
**Alert types:** `disconnect` · `high_latency` · `low_tick_rate` · `missing_symbols`  
**Actions:** Acknowledge alert · Force reconnect (Super Admin only)

---

### ADM-MDO-003: Missing Tick Monitor

**Mục đích:** Phát hiện mã bị missing tick trong phiên giao dịch.

**Layout:**
```
Phiên: 21/06/2026 — đang mở (09:15–15:00)

EXPECTED: 1,842 mã có giao dịch hôm nay
RECEIVED: 1,839 mã

MISSING (3 mã):
│ Ticker │ Last tick    │ Missing since │ Expected vol │ Action       │
│ HPG    │ 10:23:45     │ 47 phút       │ 12.8M        │ [Investigate]│
│ VIC    │ 09:41:12     │ 1h 32m        │ 2.1M         │ [Investigate]│
│ SSI    │ Never today  │ Full session  │ —            │ [Investigate]│
```

**Actions:** Mark as investigated · Trigger manual data pull · Escalate

---

### ADM-DATA-005: Data Dictionary

**Mục đích:** Tra cứu định nghĩa chính xác của mọi metric iFlux tính — SoT cho team và cho tương lai.

**Columns:** Metric Key · Tên hiển thị · Category · Updated At  
**Filters:** Category (market_data / flow / ranking / story / ai)  
**Search:** Full-text search theo tên và mô tả

**Detail view per metric:**
```
Metric Key:       sector_flow_score
Display Name:     Điểm Dòng tiền Ngành
Category:         flow
Description:
  Đo lường mức độ dòng tiền ròng vào một Ngành trong phiên,
  được chuẩn hóa so với tổng thanh khoản ngành.

Data Source:
  Table: money_flow
  Aggregation: SUM(net_value) GROUP BY sector_id, session_date

Related Formula:  sector_flow_score (Formula Registry)

Output type:      FLOAT — đơn vị tỷ VND
Display format:   +125B / -32B

Used in:
  - Sector Ranking widget (SCR-006)
  - Sector card Pg% field
  - Alert condition: sector flow threshold
```

---

### ADM-DATA-006: Reconciliation Center

**Mục đích:** So sánh data giữa Source vs TimescaleDB vs Redis để phát hiện lệch.

**Reconciliation jobs:**

| Job | So sánh | Schedule | Kết quả |
|---|---|---|---|
| session-flow-reconcile | Redis flow accumulation vs DB flush | 17:00 daily | Diff report |
| ohlcv-completeness | Provider traded tickers vs DB records | 17:30 daily | Missing list |
| index-check | Computed Ig vs expected range | 16:10 daily | Outlier flag |
| large-lot-count | Provider large lot vs DB large_lots | 17:15 daily | Count diff |

**Per-run result view:**
```
session-flow-reconcile — 21/06/2026 17:00
Status: ⚠ WARNING

Issues found (2):
│ Ticker │ Redis net_flow │ DB net_flow │ Diff       │ Action          │
│ HPG    │ +125,432,000   │ +125,432,000│ 0          │ ✓ OK            │
│ TCB    │ -18,500,000    │ 0           │ -18.5M     │ [Investigate]   │
│ VCB    │ +44,200,000    │ +44,199,000 │ +1,000     │ Rounding — OK   │
```

**Actions per issue:** Mark as resolved · Trigger backfill · Escalate to engineering

**6 Status Cards:**

| Card | Metric | Xanh | Vàng | Đỏ |
|---|---|---|---|---|
| Real-time latency | p95 tick→app | < 3s | 3–5s | > 5s |
| API response | p95 latency | < 2s | 2–3s | > 3s |
| Alert delivery | p95 | < 5s | 5–8s | > 8s |
| Uptime | % giờ GD | ≥ 99.5% | 98–99.5% | < 98% |
| Kafka lag | ms | < 500 | 500–2000 | > 2000 |
| Data Provider | status | Connected | Degraded | Down |

**Chart:** Area chart 24h cho latency  
**Incidents table:** 5 sự cố gần nhất

---

### ADM-SYS-006: Audit Log

**Columns:** Timestamp · Actor · Action · Entity Type · Entity ID · Before → After · IP  
**Filters:** Actor · Action type · Entity type · Date range  
**Read-only.** Export CSV.

---

### ADM-SYS-007: Admin User Management

**Mục đích:** CRUD tài khoản nội bộ Admin — tách hoàn toàn khỏi User (người dùng cuối).

**Columns:** Email · Display Name · Role · Status · 2FA · Last Login · Created At  
**Actions:** Invite · Edit Role · Suspend · Reset 2FA · Revoke access

**Invite flow:**
```
Nhập email + chọn role
    ↓
Gửi email mời (có expiry 48h)
    ↓
Admin mới click link → set password + bật 2FA
    ↓
Account active
```

**Rule:** Không thể tạo tài khoản Admin mà không bật 2FA (BR-ADM-02).  
**Rule:** Super Admin không thể tự xóa tài khoản mình — phải có Super Admin khác thực hiện.

---

### ADM-NOTIF-001: Push Notifications

**Columns:** Title · Segment · Status · Sent At · Delivered · Opened  
**Filters:** Status (draft/sent/scheduled) · Date range

**Create form:**
```
Title:       [text — max 50 chars]
Body:        [text — max 120 chars]
Deep link:   [optional — iflux://...]
Segment:     All users | Premium only | Free only | Custom filter
Schedule:    Send now | Schedule time
Preview:     [button — test send to own device]
```

**Segment options:**
- All users
- Premium only / Free only / Elite only
- Active in last 7 days
- Users with Watchlist containing [ticker]

---

### ADM-NOTIF-002: In-App Notifications

**Columns:** Title · Type · Segment · Status · Created At  
**Types:** `info` · `warning` · `promo` · `system`  
**Create form:** Tương tự Push nhưng không có deep link — hiển thị trong notification center của app.

---

### ADM-NOTIF-004: Broadcast History

**Columns:** Type · Title · Segment · Sent At · Recipients · Delivered % · Opened %  
**Detail view:** Per-notification analytics — delivery timeline, open rate by hour  
**Read-only.**

---

### ADM-META-001: Theme Registry

**Columns:** Theme Slug · Tên hiển thị · Description · Story Count · Status  
**Actions:** Create · Edit · Deactivate  
**Create form:** `slug` (readonly sau khi tạo) · `display_name_vi` · `display_name_en` · `description` · `icon`

---

### ADM-META-003: Story Lifecycle Config

**Mục đích:** Quản lý label, màu và mô tả cho từng stage lifecycle — hiển thị nhất quán trên app/web/admin.

**Rows (fixed, không thêm/xóa — chỉ edit):**

| Stage | Label | Color token | Description |
|---|---|---|---|
| emerging | Đang nổi lên | `--yellow-400` | Mới xuất hiện, chưa rõ momentum |
| growing | Đang tăng trưởng | `--green-500` | Có tín hiệu rõ, momentum tích cực |
| trending | Đang trending | `--orange-500` | Hot, nhiều người theo dõi |
| peak | Đỉnh | `--red-500` | Đạt cực đại, có thể sắp fade |
| fading | Đang suy giảm | `--muted` | Momentum giảm |
| archived | Đã lưu trữ | `--gray-200` | Không còn active |

**Edit:** Chỉ được sửa `label_vi`, `label_en`, `description` — không thể sửa `stage` key và `color token`.

---

### ADM-META-004: Enum Management

**Mục đích:** Quản lý các lookup list dùng chung — thêm giá trị mới không cần deploy.

**Enum groups:**

| Group | Values | Ai sửa được |
|---|---|---|
| `exchange` | HOSE, HNX, UPCOM | Super Admin only |
| `market_cap_tier` | large, mid, small | Super Admin only |
| `notification_type` | info, warning, promo, system | Admin |
| `correction_type` | halt, resume, rename, delist | Super Admin only |

**Rule:** Xóa enum value bị cấm nếu đang được dùng — chỉ được deactivate.

---

## 6. Entity Definition

### User

```
User
 ├── id                UUID
 ├── phone             VARCHAR — nullable
 ├── email             VARCHAR — nullable
 ├── display_name      VARCHAR
 ├── auth_provider     ENUM: phone | google | apple
 ├── subscription_tier ENUM: free | premium | elite
 ├── subscription_expires_at  TIMESTAMPTZ
 ├── status            ENUM: active | suspended | banned
 ├── created_at        TIMESTAMPTZ
 └── last_login_at     TIMESTAMPTZ
```

### Story

```
Story
 ├── id               UUID
 ├── name             VARCHAR — tên chính thức
 ├── slug             VARCHAR — URL-friendly
 ├── description      TEXT
 ├── lifecycle        ENUM: emerging | growing | trending | peak | fading | archived
 ├── status           ENUM: draft | active | archived
 ├── created_by       UUID → Admin User
 ├── created_at       TIMESTAMPTZ
 └── updated_at       TIMESTAMPTZ
```

### Story Mapping

```
StoryMapping
 ├── story_id         UUID → Story
 ├── entity_type      ENUM: stock | sector | ecosystem | story | theme
 ├── entity_id        VARCHAR (ticker / sector_id / ecosystem_id / story_id / theme_slug)
 ├── weight           FLOAT — mức độ liên quan (0–1)
 ├── created_by       UUID → Admin User
 └── created_at       TIMESTAMPTZ
```

**entity_type mở rộng:**
- `stock` — mã cổ phiếu cụ thể (VD: HPG)
- `sector` — ngành (VD: Thép)
- `ecosystem` — họ cổ phiếu (VD: Họ Hoà Phát)
- `story` — story liên quan (VD: Hạ tầng → liên quan Đầu tư công)
- `theme` — chủ đề macro (VD: Government Spending, Green Energy)

### Stock

```
Stock
 ├── ticker           VARCHAR — immutable primary key (e.g. "HPG")
 ├── name             VARCHAR — tên công ty
 ├── exchange         ENUM: HOSE | HNX | UPCOM
 ├── sector_id        INT → Sector
 ├── market_cap_tier  ENUM: large | mid | small
 ├── shares_outstanding BIGINT
 ├── lot_threshold    BIGINT — ngưỡng Large Lot (VND)
 ├── status           ENUM: active | halted | delisted
 ├── description      TEXT — nullable
 ├── created_at       TIMESTAMPTZ
 └── updated_at       TIMESTAMPTZ
```

### Formula

```
Formula
 ├── id               UUID
 ├── key              VARCHAR — e.g. "money_flow_score" (unique per version)
 ├── display_name     VARCHAR
 ├── category         VARCHAR — market_data | flow | ranking | story | ai
 ├── version          SEMVER — e.g. "1.2.0"
 ├── description      TEXT
 ├── inputs           JSONB — [{ name, type, description }]
 ├── formula_text     TEXT — mô tả công thức (plain text / LaTeX)
 ├── output_type      VARCHAR — e.g. "FLOAT 0-100"
 ├── status           ENUM: active | inactive | deprecated
 ├── effective_from   DATE
 ├── notes            TEXT — changelog từ version trước
 ├── created_by       UUID → Admin User
 └── created_at       TIMESTAMPTZ
```

### DataDictionaryEntry

```
DataDictionaryEntry
 ├── id               UUID
 ├── metric_key       VARCHAR — e.g. "sector_flow_score"
 ├── display_name     VARCHAR
 ├── category         ENUM: market_data | flow | ranking | story | ai | user
 ├── description      TEXT — mô tả đầy đủ cho người mới
 ├── data_source      TEXT — bảng/query nguồn
 ├── formula_key      VARCHAR → Formula.key (nullable)
 ├── output_type      VARCHAR — e.g. "FLOAT tỷ VND"
 ├── display_format   VARCHAR — e.g. "+125B / -32B"
 ├── used_in          JSONB — [{ screen, field, context }]
 ├── created_by       UUID → Admin User
 └── updated_at       TIMESTAMPTZ
```

### FeedHealthEvent

```
FeedHealthEvent
 ├── id               UUID
 ├── source           VARCHAR — e.g. "ssi_feed" | "fireant_feed"
 ├── event_type       ENUM: disconnect | high_latency | low_tick_rate | missing_symbols
 ├── started_at       TIMESTAMPTZ
 ├── resolved_at      TIMESTAMPTZ — nullable
 ├── status           ENUM: open | acknowledged | resolved
 ├── acknowledged_by  UUID → Admin User (nullable)
 ├── details          JSONB — { latency_ms, tick_rate, affected_tickers[] }
 └── created_at       TIMESTAMPTZ
```

### MarketCorrection

```
MarketCorrection
 ├── id               UUID
 ├── ticker           VARCHAR → Stock
 ├── correction_type  ENUM: halt | resume | rename | delist
 ├── effective_date   DATE
 ├── old_value        VARCHAR — nullable (VD: tên cũ khi rename)
 ├── new_value        VARCHAR — nullable (VD: tên mới)
 ├── reason           TEXT
 ├── applied_by       UUID → Admin User
 ├── applied_at       TIMESTAMPTZ
 └── created_at       TIMESTAMPTZ
```

### Prompt

```
Prompt
 ├── id               UUID
 ├── workflow         VARCHAR — tên workflow (ai_soul_analysis, spine_query...)
 ├── version          SEMVER (e.g. "1.2.0")
 ├── content          TEXT — nội dung prompt
 ├── model            VARCHAR — e.g. "claude-opus-4-6"
 ├── temperature      FLOAT
 ├── status           ENUM: active | inactive | deprecated
 ├── created_by       UUID → Admin User
 └── created_at       TIMESTAMPTZ
```

### AI Log

```
AILog
 ├── id               UUID
 ├── workflow         VARCHAR
 ├── prompt_id        UUID → Prompt
 ├── user_id          UUID → User (nullable)
 ├── request          JSONB
 ├── response         JSONB
 ├── input_tokens     INT
 ├── output_tokens    INT
 ├── cost_usd         NUMERIC
 ├── latency_ms       INT
 ├── status           ENUM: success | error | timeout
 └── created_at       TIMESTAMPTZ
```

### ETL Job

```
ETLJob
 ├── id               UUID
 ├── name             VARCHAR — e.g. "session-ohlcv-flush"
 ├── schedule         VARCHAR — cron expression
 ├── last_run_at      TIMESTAMPTZ
 ├── last_status      ENUM: success | failed | running | skipped
 ├── last_duration_ms INT
 ├── records_processed INT
 └── error_message    TEXT — nullable
```

### Audit Log

```
AuditLog
 ├── id               BIGSERIAL
 ├── actor_id         UUID → Admin User
 ├── actor_role       VARCHAR
 ├── action           VARCHAR — e.g. "ecosystem.member.add"
 ├── entity_type      VARCHAR — e.g. "ecosystem"
 ├── entity_id        VARCHAR
 ├── before_state     JSONB
 ├── after_state      JSONB
 ├── reason           TEXT — nullable (bắt buộc cho destructive actions)
 ├── ip_address       VARCHAR
 └── created_at       TIMESTAMPTZ
```

### Feature Flag

```
FeatureFlag
 ├── key              VARCHAR — e.g. "enable_story_v2"
 ├── description      TEXT
 ├── enabled          BOOLEAN
 ├── rollout_pct      INT — 0–100, % user nhận feature
 ├── updated_by       UUID → Admin User
 └── updated_at       TIMESTAMPTZ
```

### Subscription Transaction

```
SubscriptionTransaction
 ├── id               UUID
 ├── user_id          UUID → User
 ├── type             ENUM: payment | refund | override | extend | chargeback
 ├── tier             ENUM: free | premium | elite
 ├── amount_vnd       BIGINT — 0 nếu là manual override
 ├── platform         ENUM: ios | android | web | manual
 ├── iap_transaction_id VARCHAR — nullable
 ├── started_at       TIMESTAMPTZ
 ├── expires_at       TIMESTAMPTZ
 ├── performed_by     UUID → AdminUser (nullable — null nếu tự thanh toán)
 ├── reason           TEXT — nullable
 └── created_at       TIMESTAMPTZ
```

### AdminUser

```
AdminUser
 ├── id               UUID
 ├── email            VARCHAR — unique, dùng để login
 ├── display_name     VARCHAR
 ├── role             ENUM: super_admin | admin | analyst | moderator | support
 ├── status           ENUM: active | suspended | revoked
 ├── 2fa_enabled      BOOLEAN — bắt buộc true trước khi active
 ├── 2fa_secret       VARCHAR — encrypted TOTP secret
 ├── last_login_at    TIMESTAMPTZ
 ├── invited_by       UUID → AdminUser (nullable — null nếu là user đầu tiên)
 ├── created_at       TIMESTAMPTZ
 └── updated_at       TIMESTAMPTZ
```

> `AdminUser` hoàn toàn tách biệt với `User` (người dùng cuối). Không share bảng, không share auth flow. `AuditLog.actor_id` → `AdminUser.id`.

### Notification

```
Notification
 ├── id               UUID
 ├── type             ENUM: push | in_app | email
 ├── title            VARCHAR
 ├── body             TEXT
 ├── deep_link        VARCHAR — nullable (iflux://...)
 ├── segment          JSONB — { type: "all" | "tier" | "custom", filters: {} }
 ├── status           ENUM: draft | scheduled | sent | failed
 ├── scheduled_at     TIMESTAMPTZ — nullable
 ├── sent_at          TIMESTAMPTZ — nullable
 ├── recipient_count  INT — sau khi gửi
 ├── delivered_count  INT
 ├── opened_count     INT
 ├── created_by       UUID → AdminUser
 └── created_at       TIMESTAMPTZ
```

### Theme

```
Theme
 ├── slug             VARCHAR — immutable primary key (e.g. "ai_revolution")
 ├── display_name_vi  VARCHAR — "AI Revolution"
 ├── display_name_en  VARCHAR
 ├── description      TEXT
 ├── icon             VARCHAR — emoji hoặc icon key
 ├── status           ENUM: active | inactive
 ├── story_count      INT — computed, không lưu
 ├── created_by       UUID → AdminUser
 └── created_at       TIMESTAMPTZ
```

### MetadataEnum

```
MetadataEnum
 ├── id               UUID
 ├── group            VARCHAR — e.g. "exchange" | "market_cap_tier"
 ├── value            VARCHAR — e.g. "HOSE" | "large"
 ├── label_vi         VARCHAR — tên hiển thị tiếng Việt
 ├── label_en         VARCHAR
 ├── sort_order       INT
 ├── is_active        BOOLEAN
 ├── updated_by       UUID → AdminUser
 └── updated_at       TIMESTAMPTZ
```

---

## 7. Workflow Definition

### 7.1 Story Approval Flow (GĐ2 Community)

```
User đề xuất Story
        ↓
status: candidate
        ↓
Moderator Review (ADM-COM-001)
        ↓
    ┌───┴───┐
  Reject  Approve
    ↓        ↓
rejected  status: active (chính thức)
             ↓
         Analyst bổ sung mapping
         (ADM-STR-003)
             ↓
         Lifecycle: emerging
```

**Actors:** User (tạo) → Moderator (duyệt) → Analyst (enrich)  
**Trigger notification:** User nhận in-app notification khi approve/reject

---

### 7.2 Story Merge Flow

```
Admin chọn 2+ Story cần merge
        ↓
Chọn Story chính (target)
        ↓
Preview: mapping sẽ consolidate
        ↓
Confirm merge
        ↓
- Story phụ: status = archived
- Mapping của story phụ → chuyển sang story chính
- Audit log ghi lại toàn bộ
```

**Rule:** Chỉ Super Admin và Admin có quyền merge.

---

### 7.3 User Subscription Override Flow

```
Admin tìm user (ADM-USR-001)
        ↓
Vào User Detail (ADM-USR-002)
        ↓
Click "Override Subscription"
        ↓
Form: Tier mới + Ngày hết hạn + Lý do (bắt buộc)
        ↓
Confirm dialog: "Thay đổi [user] từ [old] → [new]. Tiếp tục?"
        ↓
API call → backend update
        ↓
- User nhận JWT mới (tier mới) trong ≤ 60s (BR-PLAT-02)
- Audit log ghi lại
- Toast: "Đã cập nhật gói thành công"
```

---

### 7.4 Ecosystem Member Change Flow

```
Admin vào Ecosystem Detail (ADM-MKT-002)
        ↓
Thêm / Xóa mã thành viên
        ↓
Click [Preview]
        ↓
API call: /admin/ecosystems/:id/members/preview
  Response: { ig_before, ig_after, divisor_new, change_pct }
        ↓
Admin xem kết quả preview
        ↓
Click [Lưu] (enabled sau preview)
        ↓
API call: PUT /admin/ecosystems/:id/members
        ↓
- Backend cập nhật DB
- Publish kafka event: ecosystem-changed
- SVC-02 reload divisor + members
- Hiệu lực trong ≤ 5 phút
- Audit log ghi lại
```

**Rule:** Nút Lưu bị disabled cho đến khi preview thành công ít nhất 1 lần.

---

### 7.5 Report Processing Flow (GĐ2 Community)

```
User gửi report (app/web)
        ↓
Report status: open
        ↓
Moderator nhận (ADM-COM-003)
        ↓
Review content bị report
        ↓
    ┌────┴────────────┐
  Dismiss           Action
    ↓                 ↓
status: dismissed  Xóa/Ẩn nội dung
                      ↓
                   Cảnh cáo / Suspend user
                      ↓
                   status: resolved
                      ↓
                   Notification gửi user bị report
```

---

### 7.6 Feature Flag Toggle Flow

```
Admin vào Feature Flags (ADM-SYS-002)
        ↓
Click toggle trên flag
        ↓
Confirm dialog: "Bật/Tắt [flag_key]?"
        ↓
API call: PUT /admin/feature-flags/:key
        ↓
- Hiệu lực ngay (không cần deploy)
- Audit log ghi lại
- Toast: "Feature flag đã cập nhật"
```

---

### 7.7 Data Rebuild Flow

```
Admin phát hiện data bị lỗi (ADM-DATA-004)
        ↓
Vào Pipeline Monitor (ADM-DATA-003)
        ↓
Chọn: Rebuild cache / Re-run ETL job
        ↓
Confirm: "Job này sẽ tốn ~X phút, hệ thống tiếp tục serve data cũ trong thời gian chạy"
        ↓
API call: POST /admin/data/rebuild
        ↓
- Job chạy background
- Status bar hiển thị progress
- Notification khi hoàn thành
```

---

### 7.8 Maintenance Mode Flow

```
Admin vào Maintenance (ADM-SYS-004)
        ↓
Nhập: Lý do + Thời gian ước tính
Chọn: Áp dụng ngay hoặc Schedule (thời điểm)
        ↓
Confirm
        ↓
API call: PUT /admin/maintenance { enabled, message, scheduled_at }
        ↓
- Banner xuất hiện trên app/web
- Nếu scheduled: job tự bật đúng giờ
- Audit log ghi lại
```

---

### 7.9 Formula Version Update Flow

```
Analyst/Admin muốn cập nhật công thức
        ↓
Vào Formula Registry (ADM-MKT-006)
        ↓
Click "New Version" trên formula hiện tại
        ↓
Form: Clone từ version cũ, sửa inputs/formula/notes
        ↓
Set effective_from date (không thể là quá khứ)
        ↓
Confirm: "Version 1.3.0 sẽ thay thế 1.2.0 từ [date].
          Dữ liệu tính trước [date] vẫn dùng v1.2.0."
        ↓
Save → status = inactive (chưa active)
        ↓
Super Admin review → Set Active
        ↓
- Old version: status = deprecated
- New version: status = active
- Audit log ghi lại với full diff
```

**Rule:** Không thể edit version đang active — phải tạo version mới.

---

### 7.10 Missing Tick Investigation Flow

```
Admin vào Missing Tick Monitor (ADM-MDO-003)
        ↓
Phát hiện ticker bị missing
        ↓
Click [Investigate]
        ↓
System hiện: Last tick time, Feed source, Provider status
        ↓
      ┌────┴────────────────────────┐
  Feed issue                   Data issue
      ↓                             ↓
Acknowledge feed alert        Trigger manual data pull
      ↓                             ↓
Escalate to Engineering       Verify data in DB
      ↓                             ↓
Mark as resolved              Mark as resolved
        ↓
Audit log ghi lại action + resolution note
```

---

### 7.11 Manual Market Correction Flow

```
Admin phát hiện cần correction (halt/rename/delist)
        ↓
Vào Manual Correction (ADM-MDO-004)
        ↓
Chọn Ticker + Correction Type
        ↓
Form:
  - Type: halt | resume | rename | delist
  - Effective date
  - Reason (bắt buộc)
  - New value (nếu rename)
        ↓
Confirm: "Thao tác này sẽ ảnh hưởng đến
          toàn bộ display của [ticker] từ [date].
          Không thể hoàn tác tự động."
        ↓
API call → Service Layer apply correction
        ↓
- Nếu halt: ticker hiển thị trạng thái halt trên app
- Nếu delist: ticker ẩn khỏi search, watchlist vẫn giữ
- Audit log ghi lại
```

---

### 7.12 Admin User Invite Flow

```
Super Admin vào Admin User Management (ADM-SYS-007)
        ↓
Click "Invite Admin"
        ↓
Form: Email + Role
        ↓
Hệ thống gửi email invitation (có link, expiry 48h)
        ↓
Admin mới click link → set password
        ↓
Bắt buộc bật 2FA (scan QR TOTP)
        ↓
Account status: active
        ↓
Audit log: "AdminUser [email] created with role [role] by [actor]"
```

**Rule:** Link invitation chỉ dùng được 1 lần, hết hạn sau 48h.  
**Rule:** Tài khoản không thể active nếu chưa hoàn thành 2FA setup.

---

### 7.13 Notification Broadcast Flow

```
Admin vào Push Notifications (ADM-NOTIF-001)
        ↓
Tạo notification: Title + Body + Segment + Deep link
        ↓
Preview: [Test send to my device]
        ↓
Chọn: Send now / Schedule
        ↓
Nếu Schedule: chọn date/time
        ↓
Confirm: "Sẽ gửi tới ~[N] user. Tiếp tục?"
        ↓
API call → Notification Service
        ↓
- Status: sent / scheduled
- Audit log ghi lại
- Broadcast History cập nhật khi hoàn tất gửi
```

---

## 8. Business Rules

### BR-ADM-01 — Audit Log bắt buộc
Mọi mutation (POST/PUT/DELETE) trong Admin phải tạo Audit Log entry với: `actor_id`, `action`, `entity_type`, `entity_id`, `before_state`, `after_state`, `ip_address`, `timestamp`. Backend enforce — không phụ thuộc frontend.

### BR-ADM-02 — 2FA bắt buộc
Mọi tài khoản Admin phải bật TOTP 2FA trước khi được cấp access. Không có exception.

### BR-ADM-03 — Destructive actions yêu cầu lý do
Các action sau **bắt buộc có reason** trong Audit Log (frontend enforce bằng required field):
- Override subscription
- Suspend / Ban user
- Delete comment
- Reject story
- Merge stories
- Trigger data rebuild

### BR-ADM-04 — VPN-only
Admin API và Admin Panel không accessible từ public internet. Enforce ở network layer.

### BR-ADM-05 — Menu isolation theo role
Role không có permission cho module → không thấy menu item đó. Không chỉ disable, phải ẩn hoàn toàn.

### BR-ADM-06 — Ecosystem preview trước khi lưu
Mọi thay đổi thành viên Ecosystem phải qua bước Preview trả về `ig_before`, `ig_after`, `divisor_new`. Nút Save bị disabled cho đến khi preview thành công.

### BR-ADM-07 — Subscription override ≤ 60s propagation
Sau khi Admin override tier, user phải nhận JWT mới với tier đã cập nhật trong vòng 60 giây (BR-PLAT-02).

### BR-ADM-08 — Data Export ≤ 72h
Yêu cầu export dữ liệu user (Nghị định 13/2023) phải được xử lý và gửi trong vòng 72 giờ.

### BR-ADM-09 — AI Prompt rollback
Mỗi Prompt workflow phải giữ ít nhất 5 versions gần nhất. Admin có thể rollback về bất kỳ version nào trong 5 version đó.

### BR-ADM-10 — Feature Flag không cần deploy
Feature flags phải có hiệu lực mà không cần restart service hay deploy code mới.

### BR-ADM-11 — Story merge không mất mapping
Khi merge Story, toàn bộ mapping (Stock, Sector, User) của story phụ phải được consolidate vào story chính. Không được mất data.

### BR-ADM-12 — Impersonate chỉ Super Admin
Chức năng Impersonate (login as user) chỉ Super Admin có quyền, phải có double confirm, và **mọi action trong session impersonate được ghi rõ** "Performed by [admin] as [user]" trong audit log.

### BR-ADM-13 — Formula immutability
Version công thức đang active không thể edit trực tiếp. Mọi thay đổi phải tạo version mới với `effective_from` trong tương lai. Version cũ được giữ lại vĩnh viễn — không xóa.

### BR-ADM-14 — Data Dictionary là SoT cho metric definitions
Mọi metric iFlux tính (Money Flow Score, Sector Strength, Story Score...) phải có entry trong Data Dictionary trước khi được dùng trong production. Không có entry = metric chưa được phê duyệt.

### BR-ADM-15 — Ticker immutability
Sau khi tạo Stock entity, `ticker` không thể thay đổi. Nếu công ty đổi mã (hiếm nhưng có), phải dùng Manual Correction workflow với type `rename` — tạo correction record, không sửa trực tiếp field.

### BR-ADM-16 — AdminUser tách biệt hoàn toàn với User
`AdminUser` và `User` (người dùng cuối) là hai entity riêng, không share bảng, không share auth flow, không share JWT. `AuditLog.actor_id` chỉ trỏ tới `AdminUser.id` — không bao giờ trỏ tới `User.id`.

### BR-ADM-17 — Enum value không được xóa nếu đang được dùng
Trong Metadata Registry, không thể xóa một `MetadataEnum` value nếu value đó đang được reference bởi bất kỳ entity nào. Chỉ được set `is_active = false` (deactivate). Xóa vật lý chỉ được phép nếu value chưa từng được dùng.

### BR-ADM-18 — Notification phải có preview trước khi gửi
Trước khi gửi broadcast Notification tới user, Admin bắt buộc phải gửi test notification tới thiết bị của chính mình ít nhất 1 lần. Nút "Send" bị disabled cho đến khi preview được thực hiện.

---

## Phụ lục: Screen Count

| Module | GĐ1 | GĐ2 | Tổng |
|---|---|---|---|
| Dashboard | 1 | — | 1 |
| User Center | 4 | — | 4 |
| Community Center | — | 4 | 4 |
| Story Intelligence | — | 4 | 4 |
| Market Intelligence | 7 | — | 7 |
| Market Data Operations | 4 | — | 4 |
| AI Center | — | 5 | 5 |
| Data Governance | 6 | — | 6 |
| Subscription Center | 3 | — | 3 |
| Analytics Center | — | 4 | 4 |
| Notification Center | 4 | — | 4 |
| Metadata Registry | 3 | 1 | 4 |
| System | 7 | — | 7 |
| **Total** | **39** | **18** | **57** |

GĐ1: **39 màn hình** — đầy đủ để vận hành toàn bộ hệ thống thị trường + user + data + notification.  
GĐ2: thêm **18 màn hình** khi có Story Intelligence + Community + AI + Analytics + Theme đầy đủ.

---

*Tài liệu này là tài sản nội bộ của iFlux. Phạm vi: GĐ1 đầy đủ, GĐ2 skeleton. Không bao gồm GĐ3.*
