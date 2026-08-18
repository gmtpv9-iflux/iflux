# 01 — Task Objective · Affiliate V2 Architecture Re-baseline

**Date:** 2026-07-29  
**Status:** **LOCKED** · **v1.1** — align Brief + §E · Foundation đóng → Plan  
**Program:** Affiliate V2 Architecture Re-baseline  

**Program artifacts:**  
`00-Audit-Context.md` · `01-Task-Objective.md` · `02-SoT.md` · `03-Acceptance-Criteria.md` · `04-Solution.md` · [`05-Plan.md`](05-Plan.md)

**Business Intent (cao nhất):** [`Business requirement brief.md`](Business%20requirement%20brief.md) — LOCKED  
**Parent SoT:** [`02-SoT.md`](02-SoT.md)  
**Audit neo:** `00-Audit-Context.md` §D · §E · E.7 BD-00…07 **Owner Accepted** 2026-07-29

---

# 1. Tại sao mở task này

Affiliate hiện tại được xây dựng trên tư duy:

> Affiliate là một capability độc lập.

Trong khi định hướng sản phẩm mới là:

> Public Identity là nền tảng.

Affiliate chỉ là một capability sử dụng nền tảng đó.

Audit §E xác nhận: Business Model đã nâng cấp (Public Address · Product URL vs Owner URL) trong khi Architecture Contract / semantic runtime vẫn neo referral — đây là **Re-baseline**, không phải bug-fix Affiliate/Register/cookie.

Task này được mở để **Re-baseline Public Identity Platform** (Affiliate V2 là tên chương trình; Identity là đối tượng kiến trúc), trước khi bất kỳ implementation nào được thực hiện.

---

# 2. Mục tiêu tổng thể

Xây dựng lại nền tảng kiến trúc **Public Identity** của sản phẩm để trở thành một capability dùng chung cho toàn platform.

Trong đó **Affiliate được tách khỏi Identity**: Attribution / Commission / Share là consumers — không sở hữu Public Identity.

Kết quả cuối cùng không phải là sửa Affiliate.

Kết quả cuối cùng là Product Architecture mới có thể phục vụ:

* Affiliate (Attribution · Commission)
* Community
* Navigation
* Register
* Login
* Share
* QR
* Ads
* Deep Link
* các capability tương lai

mà không phải thiết kế lại Identity thêm lần nữa.

---

# 3. Mục tiêu kinh doanh

Đảm bảo mỗi người dùng chỉ có một Public Identity duy nhất trên toàn nền tảng.

**Public Identity không chỉ là định danh kỹ thuật.**

Nó là **Public Address** của người dùng trên nền tảng — được biểu diễn qua **Owner URL** và được sử dụng cho:

* share
* branding
* referral (một use-case)
* ads
* QR
* navigation / Application URL khi Owner Context active

Affiliate Attribution chỉ là một nghiệp vụ **sử dụng** Public Identity — không đồng nhất với Identity.

Không còn tư duy:

```text
Affiliate
    ↓
Public Identity
```

Mà chuyển thành:

```text
Public Identity          ← Public Address (platform)
        ↓
Owner URL Representation
        ↓
Affiliate · Navigation · Community · Register · Share · QR · Ads · …
```

---

# 4. Mục tiêu kiến trúc

Sau khi chương trình hoàn thành phải đạt được:

## 4.1 Product Architecture

Product Architecture phản ánh đúng Business Requirement Brief + Product Vision.

Public Identity trở thành capability nền tảng (Public Address).

Không còn mô hình Affiliate Context là trung tâm / sở hữu Identity.

---

## 4.2 Architecture

Kiến trúc phải xác định **một Business Authority duy nhất** cho Public Identity và phân biệt rõ:

* **Authority** — Public Identity (business)
* **Representation** — Product URL vs Owner URL (hai biểu diễn cùng một resource)
* **Transport / recovery** — cookie · localStorage · session (không phải Business Authority)

Không yêu cầu Objective này quyết định merge artifact kỹ thuật ngay (`referral_code` field · `ownerPublicId` · URL `/IFL…` · attribution transport) — việc đó thuộc SoT sync / Solution sau khi E.7 Accepted.

Không tồn tại nhiều **Business Authority** Owner song song cho cùng một trải nghiệm.

---

## 4.3 Capability

Toàn bộ capability trong Scope đều sử dụng cùng một Public Identity (platform).

Không capability nào tự định nghĩa Identity riêng.

**Semantic boundary:** Referral / Attribution ≠ Public Identity (liên quan nhưng không đồng nhất) — BD-AFF-V2-04.

---

## 4.4 URL Class (bắt buộc sau §E)

Architecture Objective bao gồm hai URL class:

| Class | Vai trò business |
|-------|------------------|
| **Product URL** | SEO Authority · sitemap · canonical · marketing công ty |
| **Owner URL** | Distribution · Share · Ads · QR · branding · Application navigation khi Owner active |

Cùng một resource; không hai bản nội dung độc lập (Brief §3 · BD-AFF-V2-02).

```text
Public Identity
        ↓
Owner URL Representation
        ↓
Navigation · Share · Ads · QR · …
```

---

## 4.5 Runtime

Runtime chỉ tồn tại **một Owner Context** hiệu lực tại một thời điểm.

Mọi capability phải đọc cùng một **Public Identity source** (qua Owner Context / contract platform) — không tự duy trì Identity riêng (tránh dual PNC vs attribution `readActive` như Authority).

**Owner URL** là **Public Representation** của Owner Context — không phải Business Authority, cũng không phải “UI decoration”.

Khi Owner Context active: các link hệ thống sinh ra mà **cần duy trì Owner Context** phải preserve Owner (BD-AFF-V2-03). **Không** bắt buộc mọi URL có prefix — **Product URL vẫn tồn tại**. Exception kỹ thuật (OAuth/callback/payment) có thể tạm tách bar nhưng phải restore Context.

---

## 4.6 Implementation

Implementation được phép thay đổi sau.

Không được thiết kế / ship implementation trước khi Product Architecture + Solution được khóa theo chuỗi governance.

---

# 5. Mục tiêu tài liệu

Hoàn thành bộ tài liệu chuẩn cho Product Architecture mới.

Bao gồm tối thiểu:

* Product SoT (sync Brief · E.7)
* Capability Impact
* Architecture Solution
* ADR cần rewrite
* Migration Strategy
* Implementation Plan

---

# 6. Mục tiêu chương trình

Chương trình Foundation **không nhằm sửa code**.

Mục tiêu là xây dựng đủ cơ sở để:

```text
Business Requirement Brief
        ↓
Audit (§A–E · E.7 Accepted)
        ↓
Product SoT
        ↓
Acceptance
        ↓
Architecture Solution
        ↓
Plan
        ↓
Implementation
```

Mọi implementation sau này phải đi theo chuỗi trên.

---

# 7. Không thuộc phạm vi task (Foundation)

Task Foundation này **không nhằm**:

* sửa bug Affiliate / Register / cookie như đích
* tối ưu code
* migrate cookie như đích business
* sửa Register · Share · Auth như hotfix
* refactor implementation trước Solution
* audit performance

**Cũng không lấy làm đích Foundation** (thuộc Plan / Migration sau Solution — nếu Owner mở):

* đổi tên code symbol / rename `referral_code` column
* rename module `affiliate-*` / `decorateAffiliateRef`
* cleanup naming hàng loạt

Lý do: Audit E.5 / B-SEM-01 đã chứng minh semantic drift; **rename là migration**, không phải mục tiêu khóa Architecture. Foundation khóa **nghĩa business + authority**; Plan mới map rename nếu cần.

Các nội dung trên chỉ được thực hiện sau khi Architecture Re-baseline (Solution) hoàn tất và Plan mở phase tương ứng.

---

# 8. Kết quả mong đợi

Sau khi kết thúc chương trình phải có thể trả lời rõ ràng:

* Public Identity là gì — kể cả với tư cách **Public Address**.
* Public Identity được biểu diễn ra sao trên URL.
* Phân biệt **Product URL** vs **Owner URL**; boundary **SEO Authority** vs **User public address / distribution**.
* Capability nào sử dụng Public Identity; capability nào **không** sở hữu Identity.
* Boundary Attribution / Referral vs Identity.
* Kiến trúc Identity của toàn platform (Authority · Representation · Transport).
* Runtime: một Owner Context · ai đọc · Representation ở đâu.
* Boundary giữa các capability ở đâu.
* Implementation / migration phải thay đổi những gì (kể cả semantic rename nếu Plan mở).

Nếu còn một câu hỏi trên chưa trả lời được thì chương trình chưa hoàn thành.

---

# 9. Điều kiện hoàn thành Task

Task chỉ được xem là hoàn thành khi:

* Business Requirement Brief được phản ánh đầy đủ trong Product SoT.
* E.7 Business Intent Decisions được Owner Accept (hoặc supersede tường minh).
* Capability Impact được xác nhận.
* Architecture Solution được thống nhất và khóa.
* Product Architecture được Re-baseline.
* ADR liên quan được cập nhật.
* Có Migration Strategy.
* Có Implementation Plan.
* Owner và Reviewer ký PASS.

---

## Changelog v1.1

* Align scope: Public Identity Platform Re-baseline; Affiliate = consumer tách khỏi Identity.
* Thêm Public Address · Product URL vs Owner URL · Semantic Referral ≠ Identity.
* Architecture: một Business Authority + phân biệt Representation/Transport (không imply merge artifact ngay).
* Runtime: Owner Context + Public Representation; dual-read Authority là vấn đề cần giải.
* Out of scope: rename symbol = migration sau Solution, không phải đích Foundation.
* Chuỗi governance: Brief → Audit E.7 → SoT → Solution.

---

*Objective v1.1 · khung xương giữ · align Brief + §E.*
