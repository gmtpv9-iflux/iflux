# 01 — Business Requirement Document

# iFlux Site Metadata, Asset & Dynamic Configuration Foundation

| Field                 | Value                                                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task ID**           | `090826_Site_Metadata_Asset_Dynamic_Configuration_Foundation`                                                                                                    |
| **Document**          | `01 - Business Requirement.md`                                                                                                                                   |
| **Document Type**     | Business Requirement Document                                                                                                                                    |
| **Authority**         | **OWNER LOCKED**                                                                                                                                                 |
| **Status**            | 🔒 **OWNER LOCKED** (2026-08-09) · §8 IA amended: **Thiết lập SEO** (hệ thống + từng trang) · Audit ✅ · SoT 🔒 · Solution A.2 |
| **Priority**          | P0 — Foundation / Prerequisite                                                                                                                                   |
| **Dependency**        | Prerequisite cho các SEO / Metadata optimization task downstream                                                                                                 |
| **Governance**        | Product Backlogs Governance — BR → Audit → SoT → Solution → Plan → Implementation                                                                                |
| **Primary Objective** | Thiết lập nền tảng dữ liệu, asset và Admin dynamic configuration để Global / Page / Article có thể được cấu hình độc lập và được runtime tiêu thụ đúng authority |

---

# 1. Problem Statement

iFlux cần có một nền tảng cấu hình tập trung để Admin có thể quản lý các thông tin nhận diện, asset, metadata và SEO-related configuration ở nhiều scope khác nhau.

Hiện tại, việc xử lý metadata / asset có nguy cơ bị phân tán giữa:

* hard-coded HTML;
* template;
* page-specific code;
* article data;
* runtime configuration;
* static asset;
* các SEO task riêng lẻ.

Điều này tạo ra rủi ro:

1. Admin không thể tự cấu hình đầy đủ.
2. Các trang khác nhau có thể sử dụng metadata khác nhau nhưng không có authority rõ ràng.
3. Asset như favicon, logo, OG image có thể bị hard-code.
4. SEO task phải đồng thời xây infrastructure.
5. Page-level và Article-level metadata không có foundation thống nhất.
6. Có nguy cơ tạo nhiều nguồn dữ liệu cùng authority.
7. Metadata có thể tồn tại trong database nhưng không được runtime xuất ra HTML.
8. Metadata của crawler/bot có thể khác với metadata mà Admin đã cấu hình.
9. Các task SEO downstream có thể phải tự xây lại cùng capability.

Do đó cần xây **Foundation Layer trước**, sau đó các task SEO / optimization downstream chỉ sử dụng foundation đã được thiết lập.

---

# 2. Objective

## 2.1. Primary Objective

Xây dựng một foundation thống nhất cho:

```text
Site / Global
      ↓
Page
      ↓
Article
```

cho phép Admin:

* thiết lập thông tin site;
* quản lý asset;
* thiết lập metadata;
* thiết lập page-specific configuration;
* thiết lập article-specific configuration;
* lưu dữ liệu một cách persistent;
* thay đổi dynamic thông qua Admin;
* runtime tiêu thụ đúng dữ liệu;
* có fallback/inheritance rõ ràng;
* không cần sửa source code cho các thay đổi thuộc configuration.

---

# 3. Scope

## 3.1. In Scope

### A. Global / Site Configuration

Bao gồm capability để Admin quản lý các giá trị dùng ở cấp toàn hệ thống, bao gồm nhưng không giới hạn:

* Site name;
* Site description;
* favicon;
* site logo;
* default metadata;
* default SEO title;
* default meta description;
* default Open Graph image;
* default social/share image;
* các default metadata khác được Solution xác định nhưng không được trái BRD.

### B. Asset Foundation

Hệ thống phải có capability để quản lý các asset phục vụ configuration, bao gồm:

* upload;
* lưu trữ;
* reference;
* URL;
* MIME/type validation;
* size validation;
* replacement/update;
* sử dụng lại asset đã tồn tại;
* xác định asset nào đang được configuration sử dụng.

### C. Page-level Configuration

Mỗi public page có khả năng có configuration riêng.

Admin phải có capability để thiết lập page-specific values khi cần.

Page-specific configuration phải có thể override default Global configuration theo semantics được quy định trong BRD này.

### D. Article-level Configuration

Mỗi article phải có khu vực/configuration riêng.

Admin/editor phải có capability để thiết lập các giá trị article-specific.

Article configuration phải có thể override Page/Global default theo precedence đã khóa.

### E. Admin Dynamic Management

Admin phải có UI để:

* xem;
* tạo;
* chỉnh sửa;
* thay thế;
* lưu;
* kiểm tra;
* quản lý

các configuration thuộc scope được phép.

Không được coi việc có API/database là hoàn thành nếu Admin không có surface cần thiết.

### F. Persistent Data Foundation

Configuration phải được lưu persistent.

Không được phụ thuộc vào:

* browser local storage;
* runtime memory;
* hard-coded HTML;
* hard-coded JavaScript;
* temporary state

làm authority chính.

### G. Runtime Consumption

Runtime phải có capability tiêu thụ configuration đã lưu.

Configuration phải có khả năng ảnh hưởng đến public output tương ứng.

### H. SEO / Metadata Foundation

Foundation phải cung cấp dữ liệu đầu vào cho các downstream SEO task.

Foundation không thay thế toàn bộ SEO optimization.

---

# 4. Non-Goals

Task này **không** nhằm hoàn thành toàn bộ SEO optimization của iFlux.

Không thuộc scope nếu chưa được BR khác quy định:

* SEO keyword strategy;
* content optimization;
* backlink strategy;
* Google Search Console optimization;
* ranking optimization;
* comprehensive structured-data redesign;
* entity SEO optimization;
* article internal-link strategy;
* sitemap strategy redesign;
* robots.txt strategy redesign;
* SEO analytics;
* SEO reporting.

Các capability cần thiết để **lưu và cung cấp metadata** thuộc scope foundation.

Các optimization sử dụng foundation sẽ thuộc downstream tasks.

---

# 5. Terminology

## 5.1. Global Configuration

Configuration áp dụng mặc định cho toàn site.

```text
GLOBAL
```

## 5.2. Page Configuration

Configuration thuộc một public page cụ thể.

```text
PAGE
```

## 5.3. Article Configuration

Configuration thuộc một article cụ thể.

```text
ARTICLE
```

## 5.4. Asset

File/resource được hệ thống quản lý và có thể được reference bởi configuration.

Ví dụ:

* favicon;
* logo;
* OG image;
* social image;
* page image;
* article image.

## 5.5. Effective Configuration

Giá trị cuối cùng mà runtime sử dụng sau khi áp dụng:

```text
Global
→ Page
→ Article
```

và các rule override tương ứng.

---

# 6. Configuration Precedence

BRD này khóa precedence ở cấp business requirement:

```text
Global
   ↓ default
Page
   ↓ override
Article
```

Do đó:

```text
Article value exists
    → use Article

otherwise Page value exists
    → use Page

otherwise Global value exists
    → use Global

otherwise
    → system fallback / N/A
```

Không được hiểu ngược thành:

```text
Global override Article
```

hoặc:

```text
Page luôn bắt buộc phải có giá trị riêng
```

Page và Article có thể sử dụng inherited/default value nếu không có override.

---

# 7. Business Requirements

---

## BR-01 — Global Site Configuration

Hệ thống phải cung cấp capability để Admin cấu hình các thông tin mặc định ở cấp toàn site.

### Atomic Requirements

| Req ID       | Requirement                                       |
| ------------ | ------------------------------------------------- |
| **BR-01.1**  | Admin có thể thiết lập Site Name                  |
| **BR-01.2**  | Admin có thể thiết lập Site Description           |
| **BR-01.3**  | Admin có thể thiết lập favicon                    |
| **BR-01.4**  | Admin có thể thiết lập site logo                  |
| **BR-01.5**  | Admin có thể thiết lập default SEO title          |
| **BR-01.6**  | Admin có thể thiết lập default meta description   |
| **BR-01.7**  | Admin có thể thiết lập default Open Graph image   |
| **BR-01.8**  | Admin có thể thiết lập default social/share image |
| **BR-01.9**  | Global configuration được lưu persistent          |
| **BR-01.10** | Global configuration có thể được runtime tiêu thụ |

---

# BR-02 — Asset Management Foundation

Hệ thống phải có capability quản lý asset được sử dụng bởi configuration.

| Req ID       | Requirement                                                      |
| ------------ | ---------------------------------------------------------------- |
| **BR-02.1**  | Admin có thể upload asset                                        |
| **BR-02.2**  | Hệ thống lưu reference tới asset persistent                      |
| **BR-02.3**  | Hệ thống xác định được asset URL/reference                       |
| **BR-02.4**  | Hệ thống validate asset type/MIME phù hợp                        |
| **BR-02.5**  | Hệ thống validate asset size theo policy                         |
| **BR-02.6**  | Admin có thể thay thế asset configuration                        |
| **BR-02.7**  | Asset đã tồn tại có thể được reuse khi phù hợp                   |
| **BR-02.8**  | Configuration không phụ thuộc vào local browser file state       |
| **BR-02.9**  | Runtime có thể resolve asset reference thành resource thực tế    |
| **BR-02.10** | Asset management không tạo duplicate authority giữa nhiều module |

---

# BR-03 — Page-level Configuration

Mỗi public page phải có khả năng có configuration riêng.

| Req ID       | Requirement                                                     |
| ------------ | --------------------------------------------------------------- |
| **BR-03.1**  | Hệ thống nhận diện được configuration của từng public page      |
| **BR-03.2**  | Admin có thể mở khu vực configuration của từng public page      |
| **BR-03.3**  | Admin có thể thiết lập page title                               |
| **BR-03.4**  | Admin có thể thiết lập page description                         |
| **BR-03.5**  | Admin có thể thiết lập page-specific OG image khi cần           |
| **BR-03.6**  | Admin có thể thiết lập page-specific social/share image khi cần |
| **BR-03.7**  | Page configuration được lưu persistent                          |
| **BR-03.8**  | Page configuration có thể override Global default               |
| **BR-03.9**  | Page không bắt buộc phải duplicate toàn bộ Global configuration |
| **BR-03.10** | Runtime có thể resolve effective configuration của page         |

---

# BR-04 — Article-level Configuration

Mỗi article phải có khu vực configuration riêng.

| Req ID       | Requirement                                                           |
| ------------ | --------------------------------------------------------------------- |
| **BR-04.1**  | Mỗi article có thể có configuration riêng                             |
| **BR-04.2**  | Admin/editor có thể truy cập article configuration                    |
| **BR-04.3**  | Admin/editor có thể thiết lập article SEO title                       |
| **BR-04.4**  | Admin/editor có thể thiết lập article meta description                |
| **BR-04.5**  | Admin/editor có thể thiết lập article OG image                        |
| **BR-04.6**  | Admin/editor có thể thiết lập article social/share image              |
| **BR-04.7**  | Article configuration được lưu persistent                             |
| **BR-04.8**  | Article configuration có thể override Page/Global default             |
| **BR-04.9**  | Article không bắt buộc phải duplicate toàn bộ inherited configuration |
| **BR-04.10** | Runtime có thể resolve effective configuration của article            |

---

# BR-05 — Admin Dynamic Configuration Surface

Các configuration thuộc scope phải được quản lý dynamic từ Admin.

| Req ID       | Requirement                                                        |
| ------------ | ------------------------------------------------------------------ |
| **BR-05.1**  | Global configuration có Admin surface riêng                        |
| **BR-05.2**  | Page configuration có Admin surface riêng                          |
| **BR-05.3**  | Article configuration có Admin surface riêng                       |
| **BR-05.4**  | Admin có thể xem giá trị hiện tại                                  |
| **BR-05.5**  | Admin có thể chỉnh sửa giá trị                                     |
| **BR-05.6**  | Admin có thể lưu thay đổi                                          |
| **BR-05.7**  | Admin có thể thay thế asset                                        |
| **BR-05.8**  | UI phải phản ánh trạng thái configuration thực tế                  |
| **BR-05.9**  | Không được coi API-only capability là hoàn thành Admin requirement |
| **BR-05.10** | Admin surface phải phù hợp với Admin IA/permission model hiện hành |

---

# BR-06 — Configuration Persistence & Authority

Hệ thống phải có một authority persistent rõ ràng cho configuration.

| Req ID       | Requirement                                                                  |
| ------------ | ---------------------------------------------------------------------------- |
| **BR-06.1**  | Global configuration có persistent storage                                   |
| **BR-06.2**  | Page configuration có persistent storage                                     |
| **BR-06.3**  | Article configuration có persistent storage                                  |
| **BR-06.4**  | Asset reference có persistent storage                                        |
| **BR-06.5**  | Mỗi configuration value phải có authority rõ ràng                            |
| **BR-06.6**  | Không được tồn tại dual authority cho cùng một configuration value           |
| **BR-06.7**  | Runtime phải đọc từ authority đã xác lập                                     |
| **BR-06.8**  | Admin UI phải đọc/ghi cùng authority                                         |
| **BR-06.9**  | Schema phải hỗ trợ scope Global/Page/Article                                 |
| **BR-06.10** | Configuration không được phụ thuộc vào hard-coded source làm authority chính |

---

# BR-07 — Inheritance & Override

Configuration phải tuân thủ precedence đã xác lập.

| Req ID       | Requirement                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------ |
| **BR-07.1**  | Global là default configuration                                                                  |
| **BR-07.2**  | Page có thể override Global                                                                      |
| **BR-07.3**  | Article có thể override Page                                                                     |
| **BR-07.4**  | Article có thể sử dụng Page value khi không có override                                          |
| **BR-07.5**  | Page có thể sử dụng Global value khi không có override                                           |
| **BR-07.6**  | Runtime phải resolve effective value theo precedence                                             |
| **BR-07.7**  | Empty/missing override không được vô tình xóa inherited value nếu policy xác định là inheritance |
| **BR-07.8**  | Admin phải có khả năng nhận biết configuration đang dùng giá trị riêng hay inherited value       |
| **BR-07.9**  | Override semantics phải nhất quán giữa các scope                                                 |
| **BR-07.10** | Không được để từng module tự định nghĩa precedence riêng                                         |

---

# BR-08 — Runtime Metadata Consumption

Configuration phải thực sự được sử dụng bởi public runtime.

| Req ID       | Requirement                                                                  |
| ------------ | ---------------------------------------------------------------------------- |
| **BR-08.1**  | Runtime có thể resolve effective Global configuration                        |
| **BR-08.2**  | Runtime có thể resolve effective Page configuration                          |
| **BR-08.3**  | Runtime có thể resolve effective Article configuration                       |
| **BR-08.4**  | Page title được phản ánh từ effective configuration khi thuộc scope          |
| **BR-08.5**  | Meta description được phản ánh từ effective configuration khi thuộc scope    |
| **BR-08.6**  | OG image được phản ánh từ effective configuration khi thuộc scope            |
| **BR-08.7**  | Social/share image được phản ánh từ effective configuration khi thuộc scope  |
| **BR-08.8**  | Favicon/logo configuration được runtime sử dụng đúng scope                   |
| **BR-08.9**  | Runtime output phải sử dụng cùng authority với Admin configuration           |
| **BR-08.10** | Metadata không được chỉ tồn tại trong database mà không được runtime consume |

---

# BR-09 — Crawler / Public HTML Readiness

Metadata thuộc foundation phải có khả năng xuất hiện trong public HTML phù hợp với downstream SEO consumption.

| Req ID      | Requirement                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **BR-09.1** | Public page có thể expose effective title trong HTML                                                                            |
| **BR-09.2** | Public page có thể expose effective description trong HTML                                                                      |
| **BR-09.3** | Public page có thể expose effective OG metadata trong HTML                                                                      |
| **BR-09.4** | Article có thể expose effective metadata trong HTML                                                                             |
| **BR-09.5** | Metadata output phải nhất quán với configuration authority                                                                      |
| **BR-09.6** | Foundation không được chỉ cung cấp metadata cho client-side state mà bỏ public HTML requirement khi crawler consumption áp dụng |

---

# BR-10 — Validation & Configuration Integrity

| Req ID      | Requirement                                                                 |
| ----------- | --------------------------------------------------------------------------- |
| **BR-10.1** | Configuration input phải được validate                                      |
| **BR-10.2** | Asset input phải được validate                                              |
| **BR-10.3** | Invalid configuration không được trở thành authoritative value ngoài policy |
| **BR-10.4** | Configuration phải có handling rõ ràng cho missing value                    |
| **BR-10.5** | Configuration phải có handling rõ ràng cho invalid asset                    |
| **BR-10.6** | Runtime phải có fallback behavior khi configuration không tồn tại           |
| **BR-10.7** | Fallback không được phá vỡ Global/Page/Article precedence                   |
| **BR-10.8** | Admin phải nhận được trạng thái validation phù hợp                          |

---

# BR-11 — Existing Page Compatibility

Foundation không được làm mất hoặc phá vỡ các public page hiện tại.

| Req ID      | Requirement                                                                   |
| ----------- | ----------------------------------------------------------------------------- |
| **BR-11.1** | Các public page hiện tại phải tiếp tục render                                 |
| **BR-11.2** | Các article hiện tại phải tiếp tục render                                     |
| **BR-11.3** | Page chưa có configuration riêng phải sử dụng fallback/inheritance            |
| **BR-11.4** | Article chưa có configuration riêng phải sử dụng fallback/inheritance         |
| **BR-11.5** | Existing metadata không được bị mất ngoài phạm vi migration đã được phê duyệt |
| **BR-11.6** | Foundation không được tạo regression cho public runtime                       |
| **BR-11.7** | Foundation không được tạo regression cho Admin runtime                        |

---

# BR-12 — Separation of Foundation and SEO Optimization

| Req ID      | Requirement                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------- |
| **BR-12.1** | Foundation phải cung cấp capability để downstream SEO task sử dụng                           |
| **BR-12.2** | SEO optimization task không phải tự tạo lại Global/Page/Article configuration infrastructure |
| **BR-12.3** | SEO downstream phải sử dụng authority được foundation xác lập                                |
| **BR-12.4** | Foundation không được tự ý mở rộng thành toàn bộ SEO strategy                                |
| **BR-12.5** | Metadata capability phải có thể reuse bởi các public page mới trong tương lai                |

---

# 8. Admin Information Architecture Requirement

Admin phải có khả năng tìm và cấu hình đúng scope.

Requirement ở cấp business (capability — không mất scope):

```text
Admin
├── Global Configuration capability
├── Page Configuration capability
└── Article Configuration capability
```

### Owner Amendment — Admin IA labels (2026-08-09 · LOCK)

Exact Admin navigation **được Owner khóa** như sau (Solution/Plan phải tuân; không nhét vào surface sai domain):

```text
Admin
├── Nhận diện thương hiệu          ← marketing brand (KHÔNG phải Global SEO surface)
│
├── Thiết lập SEO                  ← mục riêng, cùng cấp với Nhận diện thương hiệu
│   ├── Thiết lập SEO hệ thống     ← Global / site defaults (SEO + identity assets phục vụ public)
│   └── Thiết lập SEO từng trang   ← Page configuration / metadata theo từng public page
│
└── Article Configuration
    └── khu vực SEO trên từng article (Community article edit — reuse)
```

**Cấm:**

* đưa Global SEO / default metadata / favicon·logo phục vụ public head vào **Nhận diện thương hiệu**;
* đưa Page SEO/metadata vào **Cài đặt Trang** (Page Settings = Giao diện / widget placement).

**Cài đặt Trang** tiếp tục chỉ thuộc domain giao diện / placement / publish.

Solution/Plan xác định exact route/file/perm, nhưng **không được** loại bỏ ba capability Global / Page / Article và **không được** trái IA labels Owner đã khóa ở trên.

---

# 9. Asset Requirements

Asset foundation phải hỗ trợ tối thiểu các loại asset thuộc scope:

```text
Favicon
Logo
Default OG Image
Default Social Image
Page Image
Article OG Image
Article Social Image
```

Asset system phải bảo đảm:

```text
Upload
 ↓
Validate
 ↓
Persist
 ↓
Reference
 ↓
Configure
 ↓
Runtime Consume
```

Không được coi:

```text
Upload thành công
```

là hoàn thành nếu:

```text
Configuration → Runtime
```

không hoạt động.

---

# 10. Data Requirements

Database design phải hỗ trợ ít nhất ba scope:

```text
GLOBAL
PAGE
ARTICLE
```

Database phải cho phép xác định:

* scope;
* owner/entity;
* configuration value;
* asset reference;
* persistence state;
* authority.

Schema cụ thể, table name, column name và indexing là **Solution/SoT concern**, không được BRD này tự khóa implementation detail nếu chưa cần thiết.

Tuy nhiên, Solution không được tạo schema trái với:

* single authority;
* scope separation;
* inheritance;
* persistence;
* Admin/runtime shared authority.

---

# 11. Security & Permission Requirements

| Req ID      | Requirement                                                       |
| ----------- | ----------------------------------------------------------------- |
| **BR-13.1** | Configuration management phải tuân thủ Admin authentication       |
| **BR-13.2** | Configuration management phải tuân thủ RBAC hiện hành             |
| **BR-13.3** | Upload phải tuân thủ security policy                              |
| **BR-13.4** | Asset input phải được validate                                    |
| **BR-13.5** | Public runtime chỉ được consume configuration đã được phép public |
| **BR-13.6** | Configuration API không được bypass permission boundary           |

---

# 12. Non-Functional Requirements

## 12.1. Consistency

Admin và Runtime phải sử dụng cùng authority.

```text
Admin
  ↓
Authority
  ↓
Runtime
```

Không được:

```text
Admin → DB-A
Runtime → hard-code / DB-B
```

---

## 12.2. Reusability

Foundation phải có khả năng được sử dụng bởi:

* public pages hiện tại;
* public pages mới;
* articles hiện tại;
* articles mới;
* SEO tasks downstream.

---

## 12.3. Maintainability

Configuration không được yêu cầu developer sửa source code cho các thay đổi dữ liệu thông thường thuộc scope Admin.

---

# 13. Constraints

1. Không xây foundation bằng cách tạo thêm một authority song song với authority hiện hữu mà chưa audit.
2. Không được tự tạo metadata table chỉ vì thuận tiện trước khi Audit xác định existing authority.
3. Không được hard-code configuration nếu requirement yêu cầu Admin dynamic.
4. Không được để Page và Article tự định nghĩa metadata semantics riêng.
5. Không được để mỗi module có một asset storage/authority riêng nếu cùng một asset domain.
6. Không được thay đổi downstream SEO requirement trong task foundation này.
7. Không được coi API-only implementation là hoàn thành Admin requirement.
8. Không được coi database-only implementation là hoàn thành Runtime requirement.

---

# 14. Dependencies

Task này là **prerequisite** cho các task downstream có requirement về:

* Global SEO metadata;
* Page SEO metadata;
* Article SEO metadata;
* OG metadata;
* social/share metadata;
* favicon/logo dynamic configuration;
* metadata automation.

Dependency chain:

```text
THIS TASK
Foundation
   ↓
SEO / Metadata Audit
   ↓
SEO / Metadata Solution
   ↓
SEO Optimization
```

---

# 15. Explicit Acceptance Model

Task không được PASS chỉ vì:

* database đã có;
* API đã có;
* Admin route đã có;
* upload endpoint đã có;
* agent xác nhận đã implement.

Acceptance phải chứng minh:

```text
Admin
 ↓
Persistent Authority
 ↓
Configuration
 ↓
Runtime
 ↓
Public Output
```

và phải kiểm tra từng atomic BR.

---

# 16. BR Checklist Registry — IMMUTABLE

Đây là **BR Checklist Backbone**.

Audit phải được sinh từ bảng này.

SoT / Solution / Plan / Verification không được bỏ hoặc gộp dòng.

| BR    | Atomic Req ID    | Requirement                     |
| ----- | ---------------- | ------------------------------- |
| BR-01 | BR-01.1          | Site Name                       |
| BR-01 | BR-01.2          | Site Description                |
| BR-01 | BR-01.3          | Favicon                         |
| BR-01 | BR-01.4          | Site Logo                       |
| BR-01 | BR-01.5          | Default SEO Title               |
| BR-01 | BR-01.6          | Default Meta Description        |
| BR-01 | BR-01.7          | Default OG Image                |
| BR-01 | BR-01.8          | Default Social Image            |
| BR-01 | BR-01.9          | Persistent Global Configuration |
| BR-01 | BR-01.10         | Runtime Global Consumption      |
| BR-02 | BR-02.1          | Asset Upload                    |
| BR-02 | BR-02.2          | Persistent Asset Reference      |
| BR-02 | BR-02.3          | Asset URL/Reference             |
| BR-02 | BR-02.4          | MIME Validation                 |
| BR-02 | BR-02.5          | Size Validation                 |
| BR-02 | BR-02.6          | Asset Replacement               |
| BR-02 | BR-02.7          | Asset Reuse                     |
| BR-02 | BR-02.8          | No Browser-State Authority      |
| BR-02 | BR-02.9          | Runtime Asset Resolution        |
| BR-02 | BR-02.10         | Single Asset Authority          |
| BR-03 | BR-03.1          | Page Identification             |
| BR-03 | BR-03.2          | Page Admin Surface              |
| BR-03 | BR-03.3          | Page Title                      |
| BR-03 | BR-03.4          | Page Description                |
| BR-03 | BR-03.5          | Page OG Image                   |
| BR-03 | BR-03.6          | Page Social Image               |
| BR-03 | BR-03.7          | Page Persistence                |
| BR-03 | BR-03.8          | Page Override                   |
| BR-03 | BR-03.9          | Page Inheritance                |
| BR-03 | BR-03.10         | Page Runtime Resolution         |
| BR-04 | BR-04.1          | Article Configuration           |
| BR-04 | BR-04.2          | Article Admin Surface           |
| BR-04 | BR-04.3          | Article SEO Title               |
| BR-04 | BR-04.4          | Article Description             |
| BR-04 | BR-04.5          | Article OG Image                |
| BR-04 | BR-04.6          | Article Social Image            |
| BR-04 | BR-04.7          | Article Persistence             |
| BR-04 | BR-04.8          | Article Override                |
| BR-04 | BR-04.9          | Article Inheritance             |
| BR-04 | BR-04.10         | Article Runtime Resolution      |
| BR-05 | BR-05.1–BR-05.10 | Admin Dynamic Configuration     |
| BR-06 | BR-06.1–BR-06.10 | Persistence & Authority         |
| BR-07 | BR-07.1–BR-07.10 | Inheritance & Override          |
| BR-08 | BR-08.1–BR-08.10 | Runtime Consumption             |
| BR-09 | BR-09.1–BR-09.6  | Public HTML / Crawler Readiness |
| BR-10 | BR-10.1–BR-10.8  | Validation & Integrity          |
| BR-11 | BR-11.1–BR-11.7  | Existing Page Compatibility     |
| BR-12 | BR-12.1–BR-12.5  | Foundation / SEO Separation     |
| BR-13 | BR-13.1–BR-13.6  | Security & Permission           |

> **Governance note:** Các nhóm `BR-05.1–BR-05.10`, v.v. là shorthand trong bảng hiển thị. Audit/SoT/Solution/Plan phải expand thành **từng atomic row**, không được coi nhóm là một requirement duy nhất.

---

# 17. Traceability Contract

Mọi downstream artifact phải duy trì chain:

```text
BR / Req ID
    ↓
Audit
    ↓
SoT
    ↓
Solution
    ↓
Plan
    ↓
Implementation
    ↓
Evidence A/B/C
    ↓
Final Verification
```

Ví dụ:

```text
BR-04.5
Article OG Image
    ↓
AUD-04.5
    ↓
SOT-04.5
    ↓
SOL-04.5
    ↓
PLAN-04.5
    ↓
EV-04.5
    ↓
FINAL-04.5
```

Shared artifact được phép:

```text
EV-ASSET-01
 ├── BR-02.1
 ├── BR-02.2
 ├── BR-03.5
 ├── BR-04.5
 └── BR-08.6
```

nhưng **không được gộp các BR thành một row**.

---

# 18. Audit Requirement

Audit tiếp theo phải được tạo **chỉ từ BR Checklist Registry tại §16**.

Audit phải trả lời:

> Hệ thống hiện tại đã có capability nào, authority nào, UI nào, database nào và runtime behavior nào cho từng atomic BR?

Audit **không được bắt đầu bằng code inventory rồi map ngược vào BRD**.

Đối với mỗi atomic BR, Audit phải xác định:

* Current State;
* Evidence;
* Gap;
* Status;
* Impact.

---

# 19. Evidence Requirement

Final Verification phải sử dụng:

### A — Static

Code/config/schema:

* repository;
* deployed files;
* routes;
* templates;
* configuration;
* migration;
* selectors.

### B — Database

Database state:

* schema;
* constraints;
* rows;
* references;
* persistence;
* authority.

### C — Runtime

Runtime behavior:

* Admin UI;
* API;
* browser;
* public HTML;
* network;
* actual asset;
* actual metadata.

Nếu lớp evidence áp dụng nhưng chưa chứng minh được:

```text
NOT EVIDENCED
```

Không được PASS.

---

# 20. Definition of Done

Task chỉ được coi là hoàn thành khi:

```text
BR Checklist
      ↓
ALL atomic BR
      ↓
Audit completed
      ↓
SoT established
      ↓
Solution approved
      ↓
Plan completed
      ↓
Implementation completed
      ↓
Evidence A/B/C
      ↓
Final Verification
      ↓
ALL BR = PASS
      ↓
Final Acceptance = PASS
```

Không được đóng task với:

```text
Plan = DONE
```

nếu:

```text
BR Checklist ≠ ALL PASS
```

---

# 21. Final Acceptance

Final Acceptance phải bắt đầu lại từ **BR Checklist §16**.

Mỗi atomic requirement phải có:

| BR    | Req ID  | Evidence A | Evidence B | Evidence C | Status |
| ----- | ------- | ---------- | ---------- | ---------- | ------ |
| BR-01 | BR-01.1 | …          | …          | …          | …      |
| BR-01 | BR-01.2 | …          | …          | …          | …      |
| BR-01 | BR-01.3 | …          | …          | …          | …      |
| …     | …       | …          | …          | …          | …      |
| BR-13 | BR-13.6 | …          | …          | …          | …      |

PASS chỉ khi:

```text
All applicable A/B/C evidence
+
Requirement matches BRD
+
Runtime behavior verified
+
No unresolved gap
```

---

# 22. Success Definition

Sau khi task này PASS, iFlux phải có một foundation trong đó:

```text
                    ┌───────────────────┐
                    │ Global Configuration│
                    │ Site / Logo / SEO  │
                    │ Favicon / OG / ... │
                    └─────────┬─────────┘
                              │
                    default / fallback
                              ↓
                    ┌───────────────────┐
                    │ Page Configuration │
                    │ Page-specific      │
                    │ metadata / assets  │
                    └─────────┬─────────┘
                              │
                    override / fallback
                              ↓
                    ┌───────────────────┐
                    │ Article Configuration│
                    │ Article-specific   │
                    │ metadata / assets  │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │ Runtime Resolver   │
                    └─────────┬─────────┘
                              │
                              ↓
                    ┌───────────────────┐
                    │ Public HTML / UI   │
                    │ Crawler / Sharing  │
                    └───────────────────┘
```

Admin là nơi cấu hình.

Database/persistent authority là nơi lưu.

Runtime resolver là nơi xác định effective value.

Public runtime là nơi tiêu thụ.

Không có scope nào tự tạo authority riêng.

---

# 23. Owner Decision Boundary

BRD này khóa các business requirements sau:

1. Có **Global configuration**.
2. Có **Page configuration**.
3. Có **Article configuration**.
4. Admin phải cấu hình được cả ba scope.
5. Có **Asset foundation**.
6. Configuration phải persistent.
7. Global → Page → Article là precedence.
8. Page/Article có thể override.
9. Runtime phải consume effective configuration.
10. Public HTML/crawler output phải sẵn sàng cho downstream SEO consumption.
11. Admin và Runtime phải dùng cùng authority.
12. Foundation phải là prerequisite cho SEO optimization downstream.

Các quyết định sau **không được tự suy diễn trong Plan/Implementation** nếu chưa được Solution/SoT xác định:

* exact database table name;
* exact column name;
* exact API route;
* exact Admin route;
* exact component architecture;
* exact asset storage implementation;
* exact caching implementation;
* exact resolver function;
* exact UI component.

Các quyết định đó thuộc các tầng:

```text
Audit → SoT → Solution → Plan
```

theo đúng authority của từng tầng.

---

# 24. Mandatory Next Step

**Governance flow (chuẩn — lần sau bắt buộc):**

```text
01 - Business Requirement.md  → OWNER LOCK  (trước)
    ↓
02 - Mandatory-Audit.md       → OWNER APPROVE
    ↓
03 - Governing SoT.md         → OWNER APPROVE
    ↓
04 — Solution → Plan → Implementation
```

> **Ghi chú 2026-08-09:** Owner cho phép **một lần** bỏ qua thứ tự (Audit APPROVE trước khi BRD LOCK). BRD nay đã **OWNER LOCKED**. Các task sau **không** lặp ngoại lệ này.

**Hiện tại:**

```text
01 - Business Requirement.md  ← 🔒 OWNER LOCKED
02 - Mandatory-Audit.md       ← ✅ OWNER APPROVED
03 - Governing SoT.md         ← 🔒 OWNER APPROVED / LOCKED
```

**Không được implementation trước Solution LOCK + Plan.**

Audit phải bắt đầu bằng:

> **BR Checklist Registry §16 của BRD này**

và tạo một dòng Audit cho **từng atomic Req ID**.

Sau Audit + SoT mới xác định:

```text
Current State
→ SoT
→ Solution
→ Plan
→ Implementation
```

---

# END OF BRD