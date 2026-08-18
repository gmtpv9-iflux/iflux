# 02 — Source of Truth · Public Identity Platform (Affiliate V2)

**Date:** 2026-07-29  
**Status:** **LOCKED v1.4** — E.7 BD-00…08 (BD-06 Guest replace · BD-08 Authenticated Self precedence) · Solution sync · Plan  
**Layer:** Product / Business SoT  
**Business Intent (cao nhất):** [`Business requirement brief.md`](Business%20requirement%20brief.md) — LOCKED  
**Basis:** Business Requirement Brief · Documentary Audit (§A–C) · Runtime (§D) · Business Model Audit (§E) — *không copy runtime · không vá theo code · không gán Public Identity = referral_code / IFL path*

**Program artifacts (LOCKED numbering):**  
`00-Audit-Context.md` · `01-Task-Objective.md` · `02-SoT.md` · `03-Acceptance-Criteria.md` · `04-Solution.md`

---

# 1. Product Motivation

Affiliate V2 **không** được tạo ra để thay đổi cách ghi nhận hoa hồng.

Mục tiêu của chương trình là đưa **Public Identity** trở thành một năng lực nền tảng của toàn hệ thống.

Affiliate chỉ là **một capability** sử dụng năng lực đó.

Nếu mỗi capability tự xây cơ chế định danh riêng, sản phẩm sẽ tạo ra nhiều nguồn authority khác nhau, gây mâu thuẫn business, tăng chi phí mở rộng và làm mất tính nhất quán của trải nghiệm.

Public Identity được tạo ra để toàn bộ nền tảng tham chiếu tới **cùng một định danh công khai duy nhất**.

---

# 2. Business Goal

Mỗi người dùng sở hữu **một Public Identity duy nhất** trên toàn nền tảng.

**Public Identity là Public Address** của người dùng trên nền tảng.

Nó **không chỉ** là định danh kỹ thuật, mà là địa chỉ công khai được dùng trong:

* Share
* Referral (một use-case)
* Branding
* Ads
* QR
* Navigation / Application URL khi Owner Context active
* các capability công khai khác

Mọi capability cần định danh chủ sở hữu trải nghiệm phải tham chiếu cùng Public Identity này.

Affiliate không sở hữu Identity.

Affiliate chỉ sử dụng Identity.

---

# 3. Business Vision

Một thời điểm chỉ tồn tại **một Public Identity đang hiệu lực** đối với trải nghiệm của người dùng.

Toàn bộ trải nghiệm trên nền tảng phải nhất quán với Public Identity đó cho đến khi quyền sở hữu trải nghiệm thay đổi theo Business Event được Product cho phép.

Việc thay đổi Public Identity là một sự kiện Business, không phải quyết định của từng capability.

---

# 4. Business Concepts

## Public Identity

Định danh công khai duy nhất của một người dùng trên nền tảng — **Public Address** (Brief).

Public Identity là **Business Source of Truth** dùng để xác định chủ sở hữu của trải nghiệm hiện tại.

| | |
|--|--|
| **Subject Owner** | **User** — chủ thể sở hữu Public Identity |
| **Lifecycle Authority** | **Platform Identity** — tạo · validate · transition · consistency theo Business Event |

Không capability nào khác được phép trở thành Business Source of Truth của Identity, và không capability nào (kể cả Platform Identity) được hiểu là “sở hữu User”.

**Không đồng nhất với URL:**

```text
Đúng:  User → Public Identity → Owner URL (Representation)
Sai:   User → Owner URL → Public Identity
```

**Boundary với Referral / Affiliate:**

* Public Identity **không** đồng nghĩa với “Affiliate Code”.
* Một giá trị có thể được dùng trong Affiliate Attribution, nhưng **business meaning** thuộc Public Identity của User.
* Affiliate là **use case / capability** — không phải Subject Owner của Identity.
* Cấm suy luận SoT: `Public Identity = referral_code` hoặc `Public Identity = chuỗi IFL trên path`.

---

## Owner

Người đang sở hữu Public Identity có hiệu lực đối với trải nghiệm hiện tại.

Một thời điểm chỉ có một Owner.

---

## Navigation Context

**Runtime projection** của Public Identity đang hiệu lực — tồn tại để runtime tiêu thụ Product SoT.

```text
Product
  → Public Identity          (Business SoT)
  → Runtime projection
  → Navigation Context
```

Navigation Context **không** phải Business Source of Truth.

Navigation Context mang Public Identity đang hiệu lực để Navigation và các consumer điều hướng tiêu thụ nhất quán.

---

## Owner URL

**Biểu diễn (Public Representation)** công khai của Public Identity — User Public Address trên URL.

Owner URL giúp người khác truy cập đúng trải nghiệm gắn với Owner đó.

Owner URL **không** phải nguồn xác định Business Authority và **không** phải Identity Source.

Public Identity được biểu diễn thông qua Owner URL — không phải ngược lại.

**Định dạng URL có thể thay đổi** mà business meaning không đổi. Ví dụ `/IFL…`, `/u/IFL…`, `/profile/IFL…` — đều chỉ là Representation của cùng Public Identity. Product SoT khóa Identity, **không** khóa path format.

---

## URL Class (Product)

Product khóa **hai URL Class** chính thức — cùng một resource, khác mục đích business:

| URL Class | Tên khác trong SoT | Mục đích business |
|-----------|--------------------|-------------------|
| **Product URL** | Company Canonical (khi dùng làm canonical) | SEO · sitemap · canonical · marketing công ty |
| **Owner URL** | User Public Address Representation | Distribution · Share · Ads · QR · branding · Application navigation khi Owner active |

Owner URL **không bao giờ** trở thành Canonical / SEO Authority.

---

## Company Canonical / Product URL (SEO)

Địa chỉ chuẩn của nền tảng phục vụ SEO và tìm kiếm — thuộc **Product URL** class.

Canonical luôn **sạch** — đại diện cho tài nguyên của công ty, không đại diện cho Owner.

Owner URL và Company Canonical / Product URL là **hai biểu diễn cùng một resource**, phục vụ hai mục đích business khác nhau và không thay thế nhau.

---

## Affiliate Attribution

Kết quả business phát sinh khi Public Identity được sử dụng trong quá trình giới thiệu.

Affiliate Attribution không phải mục tiêu của Public Identity.

Affiliate chỉ là một capability khai thác Public Identity.

Kết quả Attribution được ghi nhận chính thức theo Business Rule là **kết quả business cuối** của quá trình attribution — không bị thay đổi bởi hành vi phía client sau khi đã xác lập.

---

# 5. Identity Concept Relationship

Đây là quan hệ khái niệm Product — **không** phải pipeline Architecture. Dependency · lifecycle · owner runtime thuộc `04-Solution.md`.

## 5.1 Quan hệ chuẩn

* **Public Identity** là Business Source of Truth (Public Address).
* **Navigation Context** là runtime projection của Public Identity đang hiệu lực.
* **Owner URL** / **Product URL** là hai URL Class — Representation; không phải Identity Source.
* **Capabilities** tiêu thụ Public Identity (trực tiếp hoặc qua Navigation Context / Representation) theo quyền hạn Product.

**Cấm quan hệ V1:**

* Affiliate Context **không** là trung tâm.
* Affiliate Context **không** là Business Source of Truth của Identity.
* Cấm đồng nhất Public Identity với Affiliate Code / path IFL.

## 5.2 Phân tầng khái niệm

| Khái niệm | Vai trò Product | Được / Không được |
|-----------|-----------------|-------------------|
| **Public Identity** | Business SoT | Xác định Owner của trải nghiệm |
| **Navigation Context** | Runtime projection của Identity đang hiệu lực | Tiêu thụ bởi Navigation; **không** thay Public Identity làm Business SoT |
| **Owner URL** | URL Class — Public Representation | Biểu diễn Identity; **không** Canonical; **không** Business Authority |
| **Product URL / Canonical** | URL Class — SEO Representation | SEO Authority; luôn sạch |
| **Capabilities** | Consumers | Đọc / biểu diễn theo Responsibility; **không** tự phong Identity riêng |
| **Attribution result** | Kết quả business cuối của attribution | Chỉ xác lập theo Business Event / Business Rule được Product cho phép |

## 5.3 Câu hỏi nguyên tắc

| Câu hỏi | Trả lời SoT |
|---------|-------------|
| Identity là gì? | Public Identity — Public Address công khai duy nhất của user trên nền tảng. |
| Navigation Context là gì? | Runtime projection của Public Identity đang hiệu lực — để runtime tiêu thụ Product SoT. |
| URL mang ý nghĩa gì? | Hai URL Class: Product URL (SEO) và Owner URL (distribution / Public Address Representation) — không phải nguồn Identity. |
| Capability nào được tiêu thụ Identity? | Mọi capability trong Scope (§7) khi cần định danh Owner của trải nghiệm. |
| Capability nào được phép biểu diễn Identity? | Các capability Product cho phép tạo Representation (Share tạo Owner URL; Application navigation theo URL Composition policy) — cơ chế cụ thể thuộc Solution. |
| Capability nào **không** được trở thành Business Source of Truth? | Affiliate Attribution, Register, Share, URL, storage tạm, và mọi capability khác ngoài Public Identity. |

## 5.4 Capability tiêu thụ Identity (Product)

| Capability | Tiêu thụ |
|------------|----------|
| **Business / mọi capability cần Owner** | Public Identity đang hiệu lực |
| **Navigation** | Public Identity đang hiệu lực qua Navigation Context |
| **Register** | Tiêu thụ **Owner Context / Public Identity đang hiệu lực** theo Business Rule. **Không** tự đọc URL làm Authority. **Không** lấy Attribution storage (cookie/LS/CTX) làm Authority để quyết định Identity. |
| **Share** | Public Identity của người chia sẻ để tạo Owner URL (Share artifact — không phải Application URL authority) |
| **SEO** | Product URL / Company Canonical |
| **Affiliate Attribution** | Public Identity theo Business Rule → kết quả Attribution chính thức (use case — không own Identity) |

---

# 6. Identity Lifecycle Principles

Public Identity đang hiệu lực **chỉ** được thay đổi bởi **Business Event** được Product cho phép.

Không capability · không consumer · không Representation được tự ý đổi Owner.

## 6.0 Ownership của Identity Transition — Owner Decision (E.7 BD-00)

**Identity Transition** (mọi Business Event làm thay đổi Public Identity đang hiệu lực) thuộc **Lifecycle Authority: Platform Identity**.

User vẫn là **Subject Owner** của Public Identity sau transition (vd. Identity Created → User mới sở hữu Identity mới; Platform áp dụng rule đổi Active Owner).

| Không được tự ý Transition | |
|----------------------------|--|
| Navigation | |
| Affiliate | |
| Auth (như capability UI/session) | |
| Share | |
| Register (như page) — chỉ được **kích hoạt** Business Event | |
| bất kỳ consumer nào | |

Navigation / Auth / Affiliate / Share chỉ **quan sát hoặc kích hoạt** sự kiện theo Rule — **không** sở hữu Lifecycle Authority.

---

## 6.1 Chuỗi sự kiện Business (khái niệm)

```text
Guest / chưa gắn Owner
        │
        ├──► Product URL (vd. /cong-dong)
        │         │
        │         └──► Không có Owner Context
        │              (Product URL vẫn sống — Brief §8)
        │
        └──► Owner URL (vd. /IFL…/…)
                  │
                  ▼
            Gắn Owner hiện hành (Navigation Context = projection)
                  │
                  ▼
            Identity Created (user mới trên nền tảng)
                  │
                  ▼
            Transfer Ownership → Public Identity của user mới
                  │
                  ▼
            Logout / kết thúc phiên gắn Owner
                  │
                  ▼
            Không còn Owner hiệu lực (theo Business Rule)
```

Không phải mọi Guest đều có Owner. Product URL không bị loại bỏ khi áp dụng Public Identity.
## 6.2 Business Event được phép thay đổi Owner

| Business Event | Được phép làm gì với Public Identity đang hiệu lực |
|----------------|-----------------------------------------------------|
| **Open / enter qua Owner URL** | **Guest** (chưa Authenticated Self): gắn Owner của URL; nếu đang có Owner Guest khác → **replace** (BD-06). **Logged in (Self đã xác lập):** **không** đổi Active Owner vì enter Owner URL khác (BD-08) — Attribution riêng |
| **Identity Created** | Sau khi user mới được tạo: chuyển trải nghiệm sang Public Identity của user đó (Transfer Ownership) theo Business Rule |
| **Transfer Ownership** | Đổi Owner hiệu lực theo Rule Product (ví dụ guest → self sau đăng ký) |
| **Logout / kết thúc phiên gắn Owner** | Gỡ Owner hiệu lực theo Business Rule |
| **Business Event khác do Product bổ sung sau** | Chỉ khi được ghi vào SoT này — không tự phát sinh từ capability |

## 6.3 Không được phép

| Hành vi | Cấm |
|---------|-----|
| Consumer tự đổi Public Identity đang hiệu lực | Cấm |
| Capability tự phong Identity riêng | Cấm |
| Đổi Owner chỉ vì thay đổi URL Representation / parse ad-hoc | Cấm coi URL là Authority |
| Client đổi Attribution đã xác lập | Cấm (xem BR-08) |

Chi tiết cơ chế kỹ thuật thuộc Solution — SoT chỉ khóa **event nào được phép**.

---

# 7. Capability Scope

Public Identity là capability nền tảng.

Các capability **sử dụng** Public Identity bao gồm nhưng không giới hạn:

* Navigation
* Community
* Stock
* Article
* Share
* Register
* Login (khi phù hợp)
* QR
* Ads
* Deep Link
* Affiliate Attribution
* Các capability được phát triển trong tương lai

Mọi capability mới cần định danh chủ sở hữu trải nghiệm phải sử dụng Public Identity hiện có, **không** được tạo cơ chế định danh riêng và **không** được đặt Affiliate Context làm trung tâm.

---

# 8. Business Rules

### BR-01

Một người dùng chỉ có một Public Identity.

---

### BR-02

Một thời điểm chỉ có một Public Identity đang hiệu lực đối với một trải nghiệm.

---

### BR-03

Mọi capability phải sử dụng cùng Public Identity đang hiệu lực.

---

### BR-04

Affiliate không được tạo ra một Identity riêng.

Affiliate không được mô tả là owner của mô hình Identity.

---

### BR-05

Canonical luôn đại diện cho tài nguyên của nền tảng.

Canonical không đại diện cho Owner.

Canonical luôn sạch.

---

### BR-06

Owner URL là **User Public Address Representation**.

Owner URL thuộc **URL Class** riêng, khác Product URL / Company Canonical.

Owner URL **không bao giờ** trở thành Canonical / SEO Authority.

Định dạng path của Owner URL **có thể thay đổi**; business meaning (Public Identity) không đổi theo format.

---

### BR-07

Affiliate Attribution được hình thành từ Public Identity theo Business Rule.

---

### BR-08

Sau khi Attribution được ghi nhận chính thức, kết quả business đó không được thay đổi bởi hành vi phía client.

---

### BR-09

Navigation tiêu thụ Navigation Context; Navigation Context là runtime projection của Public Identity đang hiệu lực.

---

### BR-10

Application URL / Owner URL không được dùng làm Business Source of Truth của Identity.

---

### BR-11

Ở mức **Product Principle**: việc sinh Application URL khi đã có Owner Context **không được có nhiều business owner**.

Cơ chế Writer / composition cụ thể thuộc **Solution** — SoT không khóa implementation Writer.

---

### BR-12

Share được phép tạo **Share artifact** (Owner URL) từ Public Identity của **người chia sẻ (Self)**.

Share **không** phải Application URL authority và **không** trở thành Business Source of Truth của Identity.

**Owner LOCK 2026-07-30 (Phase 7):**

* Artifact **luôn Self** khi logged-in — không Active Owner / Incoming URL Owner.  
* Guest **không** tạo Share artifact qua Share Foundation; chỉ Copy link URL đang xem.  
* Nút Share (Business) = mở **Native Share Sheet** với URL Self (Brief §6B).  
* Share **không** gọi Application URL Writer (R-URL-02).

---

### BR-13

Public Identity đang hiệu lực **chỉ** được thay đổi bởi Business Event được Product cho phép (§6).

---

### BR-14

Không consumer nào được phép tự thay đổi Public Identity đang hiệu lực.

---

### BR-15

Mọi thay đổi Owner phải là Identity Transition theo Business Event — không phải quyết định cục bộ của capability.

---

### BR-16 — Owner Decision (E.7 BD-00)

**Subject Owner** của Public Identity = **User**.

**Lifecycle Authority** (tạo · validate · transition · consistency) = **Platform Identity**.

Identity Transition không thuộc Navigation, Affiliate, Auth, Share, hay Register.

---

### BR-17 — Owner Decision (E.7 BD-03 Accepted)

Khi trải nghiệm đang thuộc **Owner Context**, các link do hệ thống sinh ra mà **cần duy trì context đó** phải **preserve Owner**.

**Cấm hiểu:** mọi URL bắt buộc prefix Owner / IFL…

**Giữ:** Product URL vẫn tồn tại (SEO · canonical · guest · entry sạch).

Exception kỹ thuật (OAuth / callback / payment) có thể tạm không mang Owner trên bar nhưng phải restore Owner Context sau exception.

---

### BR-18 — Owner Decision (E.7 BD-06 Accepted · refined BD-08)

Khi **Guest** (hoặc trải nghiệm chưa có Authenticated Self) truy cập **Owner URL** của một Public Identity khác với Owner Context hiện hành, **Owner Context được thay thế** bởi Owner mới.

**Không** áp dụng replace vô điều kiện khi User đã login — xem BR-20 (BD-08).

Owner Context (Guest) = trải nghiệm hiện tại. Attribution history **không** đồng nghĩa Owner Context.

---

### BR-19 — Owner Decision (E.7 BD-07 Accepted)

**Owner URL** là Public Distribution Representation — **không** phải SEO Asset.

**SEO Authority duy nhất** thuộc **Product URL**.

Chính sách crawl/index kỹ thuật của Owner URL (noindex · canonical · robots · sitemap · …) thuộc quyết định kỹ thuật SEO — **không** khóa trong Business Rule này.

---

### BR-20 — Owner Decision (E.7 BD-08 Accepted)

Khi User **đã login** và Self Public Identity = A đã xác lập: mở Owner URL của B → **Active Owner Context vẫn = A** (**không** replace).

Public Identity của user đã đăng nhập ưu tiên. Owner URL xác lập Owner Context cho Guest / trước khi Self được xác lập — không chuyển toàn Application của A sang Owner B chỉ vì mở link B.

---

# 9. Business Invariants

| ID | Invariant |
|----|-----------|
| PI-01 | Một người dùng chỉ có một Public Identity. |
| PI-02 | Một thời điểm chỉ có một Public Identity đang hiệu lực đối với một trải nghiệm. |
| PI-03 | Public Identity là nguồn business duy nhất dùng để xác định Owner của trải nghiệm. |
| PI-04 | Affiliate không sở hữu Identity, chỉ sử dụng Identity. |
| PI-05 | Mọi capability cùng tham chiếu một Public Identity. |
| PI-06 | Owner URL và Product URL / Company Canonical là hai URL Class — cùng resource, khác mục đích; Owner URL không bao giờ là Canonical. |
| PI-07 | Mọi capability mới cần định danh Owner phải tái sử dụng Public Identity. |
| PI-08 | Attribution đã được xác lập không bị thay đổi bởi client. |
| PI-09 | URL là Public Representation — không phải Identity Source; format Owner URL có thể đổi mà business không đổi. |
| PI-10 | Navigation Context là runtime projection — không thay thế Public Identity làm Business SoT. |
| PI-11 | Không capability nào ngoài Public Identity được trở thành Business Source of Truth của Identity. |
| PI-12 | Public Identity không được thay đổi bởi consumer (Identity Transition chỉ theo Business Event được Product cho phép). |
| PI-13 | Identity Transition thuộc Lifecycle Authority Platform Identity — không thuộc Navigation / Affiliate / Auth / Share / Register. |
| PI-14 | Public Identity ≠ Affiliate Code; Affiliate là use case, không phải Subject Owner của Identity. |
| PI-15 | Register tiêu thụ Owner Context / Public Identity đang hiệu lực — không lấy URL hoặc Attribution storage làm Authority. |
| PI-16 | Subject Owner của Public Identity = User; Lifecycle Authority = Platform Identity (không đảo ngược; Platform không “sở hữu User”). |
| PI-17 | Owner URL là Representation của Public Identity — không đồng nhất Public Identity với URL. |
| PI-18 | Owner Context active ⇒ link cần duy trì context phải preserve Owner; không bắt buộc mọi URL có prefix; Product URL vẫn tồn tại (BD-03). |
| PI-19 | **Guest** enter Owner URL Identity khác ⇒ Active Owner **replace** (BD-06); Attribution ≠ Owner Context. |
| PI-20 | Owner URL không phải SEO Asset; SEO Authority duy nhất = Product URL (BD-07); kỹ thuật crawl/index deferred. |
| PI-21 | **Logged in Self = A** enter Owner URL B ⇒ Active Owner **vẫn = A** (BD-08); không kết luận bug chỉ vì `isLoggedIn` skip replace. |

---

# 10. Ownership Principles

SoT mô tả **ownership ở mức nguyên tắc Product**. Không liệt kê file / module / storage key (thuộc Audit / Solution).

```text
URL Composition policy (Product Principle — một business owner cho Application URL generation)
        │
        ├── Application navigation URL generation   ← không nhiều business owner (BR-11)
        │
        └── Share artifact generation                 ← Share (BR-12) — không phải Application URL authority
```

| Concern | Subject Owner | Lifecycle / Policy Authority | Consumer | Writer / Generator |
|---------|---------------|------------------------------|----------|--------------------|
| **Public Identity (business)** | **User** | **Platform Identity** | Mọi capability cần Owner | Chỉ theo Business Event (§6) qua Lifecycle Authority |
| Navigation Context | — | Navigation Runtime (projection) | Navigation · consumer điều hướng | Chỉ theo Identity Transition do Platform Identity |
| **URL Composition policy** (Application URL) | — | Product Principle — một business owner | Routes / navigation consumers | Cơ chế → Solution |
| **Share artifact** (Owner URL) | — | Share capability (BR-12) | Share UI / channels | Share generator — không Application URL authority |
| Affiliate Attribution result | — | Affiliate Capability (ledger) | Admin · reporting · affiliate flows | Theo Business Rule |
| Product URL / Company Canonical | — | SEO / Metadata | Tìm kiếm · canonical input | Metadata |

**Nguyên tắc:** một concern — một Lifecycle/Policy Authority — nhiều reader — không nhiều writer ngang hàng.  
**Cấm hiểu:** Platform Identity sở hữu User; Share = Application URL authority; Public Identity = Owner URL.

---

# 11. Responsibility Principles

Invariant:

```text
Một capability / concern
        │
        ▼
một owner
        │
        ▼
nhiều consumer được phép
        │
        ▼
không nhiều writer ngang hàng
```

| Capability nhóm | Được phép (nguyên tắc) | Không được phép (nguyên tắc) |
|-----------------|------------------------|------------------------------|
| Gắn Owner khi vào trải nghiệm qua Owner URL | Theo Business Event §6 | Mọi capability tự parse URL thành Authority |
| Giữ Navigation Context phản ánh Owner | Owner của Navigation Context | Consumer tự mở Identity riêng |
| Biểu diễn Application URL | Theo URL Composition policy (một business owner) | Consumer tự ghép Owner URL như Authority |
| Share tạo Owner URL artifact | Share (theo BR-12) | Share trở thành Business SoT hoặc Application URL authority |
| Register | Đọc Owner Context / Public Identity đang hiệu lực | Tự đọc URL hoặc Attribution storage làm Authority; tự phong Affiliate Context làm Business SoT |
| Ghi nhận Attribution | Theo Business Rule chính thức | Client ghi đè sau khi đã xác lập |
| Đổi Public Identity đang hiệu lực | Chỉ Business Event §6 | Consumer / capability tự Transition |

Phân bổ responsibility cụ thể thuộc Solution — sau khi khóa trên invariant này.

---

# 12. Product Roles (taxonomy khóa)

Các vai trò sau là **taxonomy chính thức** của Product SoT. Solution **chỉ được gán** artifact vào đúng vai trò — **không** được định nghĩa lại boundary.

| Role | Tiêu chí phân loại (khóa) | Boundary |
|------|---------------------------|----------|
| **Authority** | Được quyền **xác lập hoặc thay đổi** giá trị business của concern | Chỉ một Authority / concern / thời điểm |
| **Mirror** | Chỉ **phản ánh** Authority; không được quyết định ngược | Không nâng thành Authority |
| **Transport** | Chỉ **mang** dữ liệu giữa các bước; không giữ quyền quyết định | Không xác lập business value |
| **Public Representation** | Biểu diễn ra ngoài (Owner URL · Product URL · UI) — hình thức có thể đổi mà business meaning không đổi | Không phải Identity Source; **không** gọi “View” theo nghĩa UI decoration |
| **Temporary** | Trạng thái **tạm** phục vụ lifecycle; không phải nguồn business lâu dài | Hết hạn theo lifecycle |
| **Flag** | **Tín hiệu điều kiện**; không chứa authority | Không quyết định Identity |

**Invariant:** một concern tại một thời điểm chỉ có **một Authority**. Mirror / Transport / Public Representation / Temporary / Flag không được tự nâng thành Authority.

Assignment artifact → role thuộc Solution; Audit chỉ ghi *candidate*.

---

# 13. Out of Scope

Tài liệu này **không** quy định:

* Tên module / file / regex / call-site cụ thể
* Cookie key · localStorage key · sessionStorage key
* Resolver · OAuth · API · Database chi tiết
* Phase · Task · Fix Plan · Implementation Plan
* Quyết định merge/split module (thuộc Solution sau khi Audit được chấp nhận)
* Pipeline Architecture / dependency graph runtime

Những nội dung trên thuộc Audit (§D), Solution và Plan.

SoT **có** quy định: Concept Relationship, Identity Lifecycle Principles, Ownership/Responsibility Principles, Product Roles, Business Rules và Invariants.

---

# 14. Success Criteria

Chương trình (ở tầng Product SoT) được xem là đạt khi:

* Product mô tả được mọi capability trong Scope **chỉ bằng Public Identity (Public Address)** — không cần Identity riêng theo capability.
* Affiliate được mô tả như capability **sử dụng** Public Identity, không sở hữu Identity; Public Identity ≠ Affiliate Code.
* Không còn mô hình Product lấy Affiliate Context làm trung tâm.
* Product phân biệt rõ URL Class: **Product URL** (SEO) vs **Owner URL** (distribution) · Navigation Context · Canonical.
* Register khóa: tiêu thụ Owner Context — không URL/storage làm Authority.
* Product liệt kê được Business Event nào được phép thay đổi Public Identity đang hiệu lực — và khẳng định consumer không được tự Transition.
* Solution chỉ được phép **ánh xạ** từ SoT này — không được bổ sung Business Rule / Invariant mới ngoài SoT.

---

## Changelog v1.4 (E.7 BD-08 · refine BD-06)

* BR-20 · PI-21 — Logged in Self precedence: enter Owner URL B → Active Owner giữ Self.
* BR-18 · PI-19 · §6.2 — Replace chỉ phạm vi Guest / chưa Authenticated Self.
* `isLoggedIn` skip incoming **không** mặc định = bug.

## Changelog v1.3 (E.7 BD-06 · BD-07)

* BR-18 · PI-19 — Enter Owner URL khác ⇒ replace Active Owner Context ngay; Attribution riêng.
* BR-19 · PI-20 — Owner URL ≠ SEO Asset; SEO Authority = Product URL; crawl/index kỹ thuật deferred.
* §6.2 Open/enter Owner URL cập nhật theo BD-06.

## Changelog v1.2 (E.7 BD-00 Authority)

* **Subject Owner** Public Identity = User; **Lifecycle Authority** = Platform Identity.
* Tách Ownership / Authority trong §4 · §6.0 · §10 · BR-16 · PI-16 · PI-17.
* Cấm hiểu: Platform sở hữu User; Public Identity = Owner URL.

## Changelog v1.1 (sync §E)

* Public Address · semantic Public Identity ≠ Affiliate Code.
* URL Class chính thức (Product URL vs Owner URL).
* Register boundary · Lifecycle nhánh Product URL · Share vs Application URL · BR-11 Product Principle.

*Gate:* ✅ E.7 BD-00…08 Owner Accepted 2026-07-29.

---

*Product SoT v1.4 · không phải Runtime Audit · không phải Architecture Solution.*
