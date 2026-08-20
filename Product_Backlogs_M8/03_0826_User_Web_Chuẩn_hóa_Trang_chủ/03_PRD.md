# 03_PRD — User Web “Nhà của tôi” → “Trang chủ”

- **Platform:** User Web · Admin · Database · Routing · SEO
- **Module:** User Web Page Identity
- **Task:** `03_0826_User_Web_Chuẩn_hóa_Trang_chủ`
- **Tên tài liệu:** `03_PRD.md`
- **Status:** **OWNER LOCKED — PRD**
- **Owner:** Requester + Product/Architecture Owner
- **Authority:**
  - `01_Request.md`
  - `02_Audit.md`
  - `Governance_URL_Architecture.md`
  - `SoT — iFlux Product Architecture (V2)`

> Đây là **Business Requirement & Governance Contract** của task.
> PRD định nghĩa **WHAT** và **RULES**.
> PRD **không định nghĩa HOW (Solution)** hoặc **WHEN (Plan)**.

---

### 1. Business Objective



### 1.1 Objective

Chuẩn hóa page hiện tại “Nhà của tôi” thành “Trang chủ” trên toàn bộ Product.

Đây là cùng một Page Identity, không tạo page mới, không thay đổi chức năng, dữ liệu hoặc business behavior của page.

Target business state:

Display Name

Nhà của tôi

↓

Trang chủ

User Web URL

/nha-cua-toi/

↓

/trang-chu/

Root Landing

/

↓

Trang chủ

### 1.2 Expected Outcome

Sau khi hoàn thành task:

- User Web nhận diện page bằng Trang chủ.
- Canonical URL tiếng Việt là `/trang-chu/`.
- Root `/` mở đúng page này.
- Mọi representation trực tiếp của page được đồng bộ.
- Community và Market không thay đổi identity hoặc behavior.



### 2. Governance Contract

Governance trong mục này là contract bắt buộc cho Solution, Plan, Implementation và Verify.

Không được override bởi tài liệu cấp thấp hơn.

### GOV-01 — Page Identity Governance



### Authority

- Request.
- Audit §2.1.
- Product URL Architecture §3.
- SoT V2.



### Identity Contract

Page hiện tại có hai technical identity đại diện cùng một page.

| No rows |

Hai identity trên không được thay đổi.

### Rules

Giữ nguyên Technical Page Identity

Không tạo identity mới:

trang-chu

homepage

home-page

home_v2

dashboard-home

Display Name không phải Page Identity

Display Name chỉ là representation của Page Identity.

home/dashboard

↓

Trang chủ

Một Page Identity duy nhất

Không được tạo page bản sao chỉ vì đổi tên hoặc đổi URL.

### GOV-02 — User Web URL Governance



### Authority

`Governance_URL_Architecture.md`

- §2.1 User Web localized URL.
- §3 URL ≠ Page Identity.
- §5 Route resolve theo Identity.
- §6 Không nhân bản Route/Page.



### URL Representation Contract

User Web URL là localized representation của Page Identity.

| No rows |

Hai URL trên cùng resolve tới Page Identity `home/dashboard`.

### Rules

URL không phải Page Identity

home/dashboard

↓

Localized URL

Canonical URL của task

Trong phạm vi task này:

| No rows |

Locale EN chỉ được định nghĩa ở mức governance, không triển khai trong task này.

Không dùng technical identity làm User URL

Không được public User Web bằng:

/dashboard/

/dashboard/home/

/home-dashboard/

Không nhân bản URL

Đổi locale không tạo page mới hoặc route mới.

### GOV-03 — Routing Governance



### Authority

- Request.
- Audit §2.5.
- Product URL Architecture §5.



### Routing Contract

Root của User Web luôn resolve tới Page Identity `home/dashboard`.

| No rows |

### Rules

Business Request thắng implementation hiện trạng

Audit phát hiện hiện trạng root đang resolve sang `community` hoặc `market`.

PRD khóa:

> Root `/` phải resolve tới Page Identity `home/dashboard`.

Locale không thay đổi destination

Locale chỉ thay đổi URL representation.

Không thay đổi Page Identity.

Không đổi Community / Market

Không được chuyển landing bằng cách đổi identity của Community hoặc Market.

### GOV-04 — Legacy URL Governance



### Authority

- Audit §2.5.
- Product URL Architecture §5.
- Product URL Architecture §6.



### Legacy Contract

`/nha-cua-toi/` không còn là canonical URL.

Legacy URL phải tiếp tục resolve đúng Page Identity và không được tạo broken link.

### Rules

- Không xóa legacy URL theo cách làm hỏng link hiện hữu.
- Không tự phát minh redirect policy.
- Legacy URL phải tuân theo routing convention hiện hành.
- Cơ chế xử lý legacy URL thuộc Solution.



### GOV-05 — Display Representation Governance



### Authority

- Request.
- Audit §2.2.
- Product URL Architecture §2.



### Display Contract

Display Name tiếng Việt của page trở thành:

Trang chủ

### Rules

Reconcile toàn bộ representation

Mọi representation của page phải dùng Trang chủ.

Không tồn tại dual representation

home/dashboard → Nhà của tôi

home/dashboard → Trang chủ

không được cùng tồn tại.

Localized Display

Product cho phép localized Display Name.

| No rows |

Locale EN nằm ngoài phạm vi implementation của task.

### Exception

Không đổi mọi chuỗi "Nhà của tôi" nếu đó không phải representation của Page Identity này.

### GOV-06 — Registry & Source of Truth Governance



### Authority

Audit §2.7.

### Source-of-Truth Contract

Audit xác nhận nhiều nguồn cùng lưu representation.

| No rows |

### Rules

- Không chọn tùy tiện một SoT.
- Sửa representation tại canonical authority của từng layer.
- Không sửa generated artifact nếu artifact sinh từ registry.

Nếu phát hiện discrepancy mới ngoài Audit:

> STOP → báo Owner.



### GOV-07 — Database Governance



### Authority

Audit §2.4.

### Database Contract

Database không phải Page Identity SoT.

### Rules

Nếu database lưu Display Name hoặc URL representation:

> phải reconcile.

Nhưng các technical key giữ nguyên.

| No rows |

Không đổi data semantics.

Không migration nếu không có dependency trực tiếp.

### GOV-08 — SEO Governance



### Authority

Audit §2.6.

### SEO Contract

SEO representation phải phản ánh Display Name và Canonical URL mới.

| No rows |

### Rules

- Không còn canonical `/nha-cua-toi/`.
- Không thay đổi SEO strategy.
- Không thay đổi keyword strategy.
- Không thay đổi robots/index policy.
- Không thay đổi sitemap policy ngoài scope.

Locale EN chỉ là governance contract.

### GOV-09 — Breadcrumb Governance



### Authority

Audit §2.6.

### Breadcrumb Contract

Breadcrumb mang semantic User Web Home phải trỏ về Page Identity `home/dashboard`.

| No rows |

### Rules

Không để breadcrumb:

Trang chủ

→ /cong-dong/

nếu semantic là User Home.

Không đổi breadcrumb của Community nếu semantic là Community.

### GOV-10 — Content Integrity Governance



### Authority

Request.

### Integrity Contract

Đây là rename identity representation.

Không phải content migration.

### Preserve

- Content.
- Widget composition.
- Widget host.
- Widget data.
- Business logic.
- User layout.
- API semantics.



### Forbidden

- Copy page.
- Tạo page mới.
- Di chuyển widget.
- Đổi data model.



### GOV-11 — Scope Governance



### Authority

Request.

### Out of Scope

Task này không thực hiện:

- Locale EN implementation.
- Public/Private behavior.
- Community redesign.
- Market redesign.
- SEO redesign.
- AppShell redesign.
- Architecture refactor.
- Database redesign.



### Scope Expansion Rule

Nếu Solution phát hiện dependency mới ngoài Request và Governance:

STOP

↓

Owner Decision

↓

PRD Update

Không tự mở rộng implementation.

### 3. Functional Requirements



### FR-01 — Rename Existing Page

Page `home/dashboard` đổi Display Name:

Nhà của tôi

↓

Trang chủ

Không tạo page mới.

### FR-02 — Canonical User Web URL

Canonical URL tiếng Việt của page:

/trang-chu/

### FR-03 — Root Landing

Root User Web:

/

resolve tới Page Identity `home/dashboard`.

### FR-04 — Representation Reconciliation

Reconcile representation trực tiếp của page trên:

- Navigation.
- Manifest.
- Registry.
- Routing.
- Publish.
- SEO.
- Metadata.
- Breadcrumb.
- Internal Links.
- Admin configuration.
- Database representation nếu có.



### FR-05 — Legacy URL Compatibility

Legacy URL của page không còn canonical nhưng vẫn resolve đúng Page Identity theo Governance.

### FR-06 — Preserve Existing Page

Giữ nguyên content, widgets, data, behavior và technical identity.

### 4. Explicit Non-Goals

Task này không phải:

- tạo page Trang chủ mới;
- tạo page Home mới;
- đổi Community;
- đổi Market;
- đổi Admin module;
- đổi Page Identity;
- đổi data semantics;
- đổi widget composition;
- đổi routing architecture;
- triển khai locale EN;
- triển khai public/private landing.



### 5. Acceptance Criteria



### Identity

|
AC

|

Requirement

|
| --- | --- |
|

AC-01

|

`home/dashboard` vẫn là cùng một Page Identity.

|
|

AC-02

|

Display Name của page là Trang chủ.

|
|

AC-03

|

Không còn active representation "Nhà của tôi" cho chính page này.

|
|

AC-04

|

Không tạo Page Identity mới.

|

### URL & Routing

|
AC

|

Requirement

|
| --- | --- |
|

AC-05

|

Canonical URL tiếng Việt là `/trang-chu/`.

|
|

AC-06

|

Root `/` resolve đúng Page Identity `home/dashboard`.

|
|

AC-07

|

`/nha-cua-toi/` không còn là canonical URL.

|
|

AC-08

|

Legacy URL vẫn resolve đúng Page Identity, không broken link.

|

### Registry & Database

|
AC

|

Requirement

|
| --- | --- |
|

AC-09

|

Navigation, Manifest, Registry, Publish và Routing cùng nhận diện `home/dashboard → Trang chủ → /trang-chu/`.

|
|

AC-10

|

Admin representation vẫn dùng technical identity `dashboard`.

|
|

AC-11

|

Database technical keys (`home`, `dashboard`) giữ nguyên.

|

### SEO

|
AC

|

Requirement

|
| --- | --- |
|

AC-12

|

SEO Display Name là Trang chủ.

|
|

AC-13

|

Canonical URL không còn `/nha-cua-toi/`.

|
|

AC-14

|

Robots/index policy giữ nguyên ngoài scope.

|
|

AC-15

|

Sitemap không còn canonical reference tới `/nha-cua-toi/`.

|

### Breadcrumb

|
AC

|

Requirement

|
| --- | --- |
|

AC-16

|

Breadcrumb User Home trỏ `Trang chủ → /trang-chu/`.

|
|

AC-17

|

Không còn breadcrumb semantic Home trỏ `/cong-dong/`.

|

### Integrity

|
AC

|

Requirement

|
| --- | --- |
|

AC-18

|

Content không thay đổi.

|
|

AC-19

|

Widget composition, host và data không thay đổi.

|
|

AC-20

|

Business logic và data semantics không thay đổi.

|

### Scope Protection

|
AC

|

Requirement

|
| --- | --- |
|

AC-21

|

Community giữ nguyên identity, URL và behavior.

|
|

AC-22

|

Market giữ nguyên identity, URL và behavior.

|
|

AC-23

|

Không có thay đổi ngoài phạm vi Request và Governance.

|

### Final State

|
AC

|

Requirement

|
| --- | --- |
|

AC-24

|

Final reconciliation chứng minh `home/dashboard → Trang chủ → /trang-chu/` là cùng một page và Community/Market không thay đổi.

|

### 6. Traceability Matrix


| Request / Audit                              | Governance               | FR            | Acceptance                 |
| -------------------------------------------- | ------------------------ | ------------- | -------------------------- |
| Rename Nhà của tôi → Trang chủ               | GOV-01 + GOV-05          | FR-01         | AC-01 → AC-04              |
| Canonical URL /trang-chu                     | GOV-02 + GOV-08          | FR-02         | AC-05, AC-07, AC-12, AC-13 |
| Root landing /                               | GOV-03                   | FR-03         | AC-06                      |
| Representation reconciliation                | GOV-05 + GOV-06 + GOV-07 | FR-04         | AC-09 → AC-11              |
| Legacy URL compatibility                     | GOV-04                   | FR-05         | AC-08                      |
| Preserve existing page                       | GOV-10                   | FR-06         | AC-18 → AC-20              |
| Community/Market unchanged                   | GOV-11                   | FR-06         | AC-21 → AC-23              |
| Audit D1/D2 Landing & Breadcrumb discrepancy | GOV-03 + GOV-09          | FR-03 + FR-04 | AC-06, AC-16, AC-17        |




### 7. Solution & Plan Gate



### Solution Responsibilities

Solution phải mô tả HOW để đáp ứng toàn bộ Governance Contract, FR và AC.

Solution phải chỉ ra:

- Source of Truth cần sửa.
- Registry authority của từng representation.
- Dependency bắt buộc.
- Legacy URL handling strategy.
- Verify evidence cho từng AC.



### Plan Responsibilities

Plan phải ánh xạ:

Governance

↓

FR

↓

Implementation Step

↓

Acceptance Evidence

Mỗi implementation step phải truy vết được về FR và AC tương ứng.

### Decision Gate

Không được bắt đầu Implementation nếu:

- phát hiện conflict với Governance Contract;
- phát hiện dependency mới ngoài Audit;
- phát hiện mở rộng phạm vi Request.

Khi xảy ra các trường hợp trên:

STOP

↓

Owner Decision

↓

Update PRD (nếu được chấp thuận)

### 8. PRD Final Lock

> Business Goal duy nhất: Chuẩn hóa page hiện tại `home/dashboard` từ “Nhà của tôi” thành “Trang chủ”, với User Web canonical URL tiếng Việt là `/trang-chu/`, root `/` resolve tới chính Page Identity này, đồng bộ toàn bộ representation trực tiếp trên User Web, Admin, Database, Routing và SEO theo Product URL Architecture; giữ nguyên Technical Page Identity (`home/dashboard`), content, widgets, business logic và data semantics; không thay đổi Community, Market hoặc bất kỳ phạm vi nào ngoài Governance Contract của PRD.

