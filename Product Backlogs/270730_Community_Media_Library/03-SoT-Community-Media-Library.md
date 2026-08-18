# SoT — Community Media Library

**Document ID:** SoT-COM-MEDIA-001  
**Version:** 1.0  
**Status:** 🟡 **Proposed → Owner Review**  
**Date:** 2026-07-30  
**Folder:** `docs/Product Backlog/270730_Community_Media_Library/`  
**Neo:** [`01-BRD-COM-MEDIA-001.md`](01-BRD-COM-MEDIA-001.md) · [`02-Discovery-Audit-Admin-Media-Current-State.md`](02-Discovery-Audit-Admin-Media-Current-State.md)

> **Loại tài liệu:** Business Contract (hợp đồng nghiệp vụ).  
> **Cấm trong SoT này:** API · DB schema · đường dẫn file · định dạng encode · thư viện download · chi tiết UI component.  
> Những thứ đó thuộc **Solution**.

---

## Hierarchy trong chuỗi tài liệu

| Tài liệu | Trả lời |
|----------|---------|
| **BRD** | Tại sao cần Media Library? |
| **SoT (file này)** | Media Library là gì · sở hữu gì · quy tắc bất biến là gì? |
| **Solution** | Xây như thế nào? |
| **Impact → Plan → Impl** | Đụng gì · làm theo bước nào · ship |

---

# 0. Governing SoT / Documents (chi phối)

Các tài liệu sau **chi phối** hoặc **giao diện** với Community Media Library. SoT này **không thay thế** chúng; khi xung đột về Media Asset / Publish ảnh → **SoT-COM-MEDIA-001** thắng trong phạm vi Community Media (sau Owner LOCK).

| Tài liệu | Quan hệ với Media Library |
|----------|---------------------------|
| [`SoT — iFlux Product Architecture (V2)`](../../SoT%20—%20iFlux%20Product%20Architecture%20(V2).md) | Community sở hữu **Bài viết** + metadata; cấu trúc bài theo `Content_Entity`. Media Library **không** thay Community sở hữu Article — Article **tham chiếu** Media Asset. |
| [`Content_Entity.md`](../../../Content_Entity.md) | Bài viết có trường SEO / cover / nội dung — sau LOCK, cover và ảnh trong nội dung **chỉ** được phép tham chiếu Media Asset hợp lệ. |
| [`SoT — Engineering Change Governance`](../../SoT%20—%20Engineering%20Change%20Governance.md) | Greenfield = Create new capability; bắt buộc Impact · Ownership · Cleanup dual policy (IMG-A → iFlux-only). |
| [`SoT — Plan Phase Governance`](../../SoT%20—%20Plan%20Phase%20Governance.md) | Plan Implementation sau SoT LOCK + Impact. |
| [`SoT — Persistence & Client Storage (PS-1.0)`](../../SoT%20—%20Persistence%20%26%20Client%20Storage%20Architecture%20(PS-1.0).md) | Media Asset = **Business data** → authoritative SoT ở **API/Server**; cấm coi localStorage / mock store là Media Library. |
| [`Plan — CMS Article Editor TipTap (FN-CMS-ED-001)`](../../Plan%20—%20CMS%20Article%20Editor%20TipTap%20(FN-CMS-ED-001).md) | **IMG-A** (URL ngoài) là quyết định Plan editor **tạm thời**. Sau SoT LOCK + transition: Publish Contract của SoT này **thắng** IMG-A đối với bài đã Publish. |
| [`SoT — UI Relocation Governance (UR-001)`](../../SoT%20—%20UI%20Relocation%20Governance%20(UR-001).md) | Nếu chỉ đổi chỗ UI Library/Import → Modify Existing / không abstraction thừa. |
| Product Architecture V2 · SEO / sitemap (Experience·Knowledge·Community·Platform) | Media Library là **SEO Asset Repository cho hình ảnh Community** (BG-SEO-01) — **khác** Owner URL Representation (Affiliate). Không nhầm Media URL với Owner path `/IFL…`. |
| BRD-COM-MEDIA-001 | Business intent · FR · BR · SEO Requirements — SoT khóa contract vận hành. |
| Discovery Audit 02 | Evidence greenfield — Decision Log D-001. |
| SoT draft 270728 | **Superseded as authority** bởi file này (có chi tiết implementation — không dùng làm LOCK). |

---

# 1. Purpose

Định nghĩa **Media Library** như capability quản lý hình ảnh của Module Quản lý cộng đồng.

Mọi hình ảnh xuất hiện trong bài viết Community phải là **Media Asset** do iFlux quản lý trước khi bài viết được coi là hoàn tất import (và trước khi Publish theo Publish Contract).

Media Library đồng thời là **SEO Asset Repository** cho hình ảnh Community (**BG-SEO-01**): URL nội bộ · tên file chuẩn hóa · Alt Text · metadata · tái sử dụng.

---

# 2. Scope

## In scope

* Media Asset · Media Library · Media Usage · Media Source · Media URL.
* Import / localize hình ảnh ngoài → Media Asset.
* Tham chiếu Media Asset từ bài viết Community (body · cover · SEO image liên quan bài).
* Metadata quản trị + SEO tối thiểu (tên file · Alt Text · URL nội bộ · nguồn gốc).
* Quy tắc Publish liên quan hình ảnh.

## Out of scope (Non-goals — chi tiết §14)

* Video · tài liệu · CDN đa vùng · AI / crop / watermark / OCR · versioning Media Asset.
* Content Engine / comment image (trừ khi Owner mở phase riêng).

---

# 3. Capability Ownership

| Capability | Owner |
|------------|-------|
| Media Asset | **Media Library** |
| File Naming | **Media Library** |
| Metadata (quản trị + SEO) | **Media Library** |
| Usage (bài nào đang dùng) | **Media Library** |
| Storage (nơi lưu file vật lý / object) | **Media Library** |
| Media URL (cấp phát & ổn định) | **Media Library** |
| SEO Metadata trên asset | **Media Library** |
| Detect / Import / Localize / Replace tham chiếu trong bài | **Media Import Pipeline** |
| Nội dung nghiệp vụ bài viết (text, taxonomy, status bài) | **Community Article** |
| Quyết định Publish bài viết | **Community Article** (phải thỏa Publish Contract hình ảnh) |
| Render bài trên User Web | **Community / User Web** (chỉ tiêu thụ Media URL hợp lệ) |

**Hệ quả:** Không module nào được tự ghi file hình · tự cấp Media URL · tự đặt tên file Media Asset ngoài Media Library / Import Pipeline đã định.

---

# 4. Core Business Objects

| Object | Định nghĩa nghiệp vụ |
|--------|----------------------|
| **Media Asset** | Đơn vị tài sản hình ảnh độc lập do iFlux sở hữu; có định danh duy nhất; có metadata và Media URL. |
| **Media Library** | Nơi quản lý duy nhất tập hợp Media Asset. |
| **Media Usage** | Quan hệ tham chiếu: bài viết (hoặc bề mặt được phép) **đang dùng** Media Asset nào. |
| **Media Source** | Nguồn gốc ban đầu của hình (URL ngoài, RSS provider, upload thủ công…) — chỉ phục vụ audit / truy vết, **không** là runtime hiển thị. |
| **Media URL** | URL hình thuộc domain do iFlux quản lý, gắn với Media Asset; là URL duy nhất được phép dùng khi Publish. |

**Ngôn ngữ cấm (sau LOCK):** coi “ảnh trong bài” như file thuộc Article; hotlink ngoài như nguồn hiển thị hợp lệ khi đã Publish.

---

# 5. Source of Truth

### SoT-01 — Media Library là SoT duy nhất của Media Asset

Media Library là nguồn dữ liệu duy nhất quản lý Media Asset của Community.

### SoT-02 — Article không sở hữu Image

Article **không** sở hữu hình ảnh.  
Article **chỉ tham chiếu** Media Asset (qua Media URL / định danh asset theo Solution).

### SoT-03 — Media Asset không phụ thuộc Article

Media Asset tồn tại độc lập với Article.  
Một Media Asset có thể được nhiều bài tham chiếu.  
Xóa / đổi bài không đương nhiên xóa Media Asset (xem Lifecycle · Usage).

### SoT-04 — Media Source không phải runtime

Media Source chỉ để audit / truy vết.  
Runtime Community (User Web · feed · detail · OG image bài) **không** dùng Media Source làm URL hiển thị khi bài đã Publish.

### SoT-05 — Media URL là URL hiển thị hợp lệ duy nhất (sau Publish)

Với bài viết đã Publish: mọi URL hình hiển thị phải là Media URL thuộc Media Library.

---

# 6. Lifecycle

Trạng thái nghiệp vụ (không phải trạng thái kỹ thuật lưu trữ):

```text
External Image          ← còn nằm ngoài hệ thống / hotlink
        ↓
Detected                ← đã phát hiện trong nội dung bài (chưa thành Asset)
        ↓
Imported                ← đã qua Media Import Pipeline
        ↓
Media Asset             ← tồn tại trong Media Library
        ↓
Referenced              ← có Media Usage từ Article (≥1)
        ↓
Published Context       ← Article chứa tham chiếu đã Publish (Publish Contract PASS)
        ↓
Unused                  ← không còn Media Usage
        ↓
Archived                ← ngừng dùng mới; vẫn có thể giữ lịch sử
        ↓
Deleted                 ← chỉ khi thỏa quy tắc xóa (không còn usage bắt buộc / Owner policy)
```

**Rule:** Không nhảy từ External Image → Published Context mà bỏ qua Media Asset.

---

# 7. Business Rules

### BR-M-01

Một bài đã hoàn tất Import không được tham chiếu hình ảnh bên ngoài trong phạm vi đã import (body và các vùng thuộc Import).

### BR-M-02

Mỗi Media Asset có định danh duy nhất trong hệ thống.

### BR-M-03

Media Asset phải tồn tại trong Media Library trước khi được dùng trong bài viết như tài sản hợp lệ.

### BR-M-04

Mỗi Media Asset phải lưu Media Source (nguồn gốc) để truy vết — khi nguồn có thể xác định.

### BR-M-05

Media Library là nơi quản lý duy nhất của Media Asset.

### BR-M-06

Không tạo Media Asset trùng khi **cùng một nội dung hình ảnh** đã có trong Library (một Asset · nhiều Usage).

### BR-M-07

Chỉ Media Library được cấp phát tên file và Media URL.

### BR-M-08

Module khác (RSS · Editor · Frontend · script ad-hoc) **cấm** bypass Import Pipeline để “tự tải · tự ghi · tự thay HTML”.

---

# 8. Naming Rules

### NR-01

Tên file Media Asset do **Media Library** cấp phát theo quy tắc thống nhất của hệ thống.

### NR-02

Tên file phản ánh nội dung bài / ngữ cảnh nghiệp vụ đủ để hỗ trợ SEO và quản trị (chi tiết template → Solution).

### NR-03

Tên file được cấp phát **một lần** cho Media Asset và **không đổi** trong toàn bộ vòng đời Asset (ổn định SEO · ổn định tham chiếu).

### NR-04

RSS · Editor · nguồn ngoài **không** quyết định tên file cuối cùng của Media Asset.

---

# 9. SEO Rules

### SEO-M-01

Mọi hình ảnh trong ngữ cảnh Publish phải dùng Media URL thuộc domain iFlux.

### SEO-M-02

Mọi Media Asset phải có tên file chuẩn hóa (NR-*).

### SEO-M-03

Mọi Media Asset phải có Alt Text (có thể kế thừa từ bài hoặc Editor chỉnh).

### SEO-M-04

Media URL **ổn định** sau khi bài chứa tham chiếu đã Publish — không đổi URL chỉ vì chỉnh metadata không phá vỡ hợp đồng ổn định (rename file sau Publish = **cấm** theo NR-03).

### SEO-M-05

Không Publish bài còn External Image trong phạm vi hình ảnh bắt buộc (xem Publish Contract).

### SEO-M-06

Media Library là nguồn dữ liệu duy nhất phục vụ hình ảnh Community đã chuẩn hóa (SEO Asset Repository — BG-SEO-01).

---

# 10. Usage Rules

### UR-01

Mọi lần Article (hoặc bề mặt được phép) dùng Media Asset phải ghi nhận **Media Usage**.

### UR-02

Không xóa Media Asset khi vẫn còn Media Usage bắt buộc (tránh gãy nội dung).

### UR-03

Cho phép nhiều Article tham chiếu cùng một Media Asset.

### UR-04

Editor / Administrator phải có khả năng biết Media Asset đang được bài nào sử dụng (nhìn từ Library).

---

# 11. Ownership Rules

### OR-01

Community Article sở hữu: nội dung chữ · taxonomy · trạng thái bài · quyết định Publish bài.

### OR-02

Media Library sở hữu: file · tên · URL · metadata · usage ledger · vòng đời Asset.

### OR-03

Media Import Pipeline sở hữu: phát hiện External Image · import · tạo/gắn Asset · thay tham chiếu trong bài sau import thành công.

### OR-04

User Web / Community Render chỉ **tiêu thụ** Media URL — không tạo Asset.

---

# 12. Publish Contract

### PC-01 — PASS

Publish bài viết Community **chỉ PASS** khi:

* 100% URL hình trong phạm vi bắt buộc (body hình ảnh · cover · SEO image của bài — theo Scope Owner chốt) là **Media URL** nội bộ; và  
* Mỗi Media URL đó trỏ tới Media Asset hợp lệ trong Media Library; và  
* Mỗi Media Asset liên quan có Alt Text (SEO-M-03).

### PC-02 — FAIL

Publish **FAIL** nếu còn External Image trong phạm vi bắt buộc.

### PC-03 — Draft / đang biên tập

Được phép tạm giữ External Image trong quá trình biên tập **cho đến khi** Import hoàn tất và/hoặc Publish — miễn là PC-01 được enforce tại Publish (và tại “hoàn tất Import” theo BR-M-01).

### PC-04 — Quan hệ với IMG-A

Chính sách editor cho phép dán URL ngoài (**IMG-A**, Plan TipTap) **không** miễn Publish Contract.  
IMG-A chỉ là lối vào tạm thời trước Import — không phải trạng thái Publish hợp lệ.

---

# 13. Boundary

## Capability Boundary

| Hành vi | Thuộc |
|---------|--------|
| Upload (khi Owner mở) | Media Library |
| Localize / Import từ HTML | Media Import Pipeline |
| Storage | Media Library |
| SEO Filename · Alt · Media URL | Media Library |
| Replace tham chiếu hình trong bài sau import | Media Import Pipeline |
| Render bài | Community / User Web |
| Publish bài | Community Article (+ enforce PC-*) |
| Danh mục / chủ đề / feed list | Community (ngoài Media) |

## Media Library **không** chịu trách nhiệm

* Chỉnh sửa / cắt ảnh · watermark · AI tạo ảnh · OCR  
* CDN đa vùng · video · tài liệu  
* Versioning Media Asset  
* Nội dung chữ / taxonomy bài viết  

---

# 14. Non-goals

* Không biến Media Library thành CMS bài viết.  
* Không yêu cầu Editor thao tác HTML để localize.  
* Không giải quyết SEO Owner URL / Affiliate Representation (capability khác).  
* Không bắt buộc mở Media Library cho mọi module ngoài Community trong phase đầu (khả năng mở rộng giữ ở mức contract — Solution sau).

---

# 15. Acceptance Contract

SoT được coi là **đang được tuân thủ** khi:

| ID | Contract |
|----|----------|
| **AC-S-01** | Không module nào ngoài Media Library / Import Pipeline tự tạo Media Asset / Media URL. |
| **AC-S-02** | Article chỉ tham chiếu Media Asset — không “sở hữu file ảnh”. |
| **AC-S-03** | Publish FAIL khi còn External Image trong phạm vi bắt buộc. |
| **AC-S-04** | Mọi Media Asset có tên chuẩn hóa · Alt Text · Media URL nội bộ · Media Source (khi có). |
| **AC-S-05** | Có thể truy vết Usage: Asset → bài đang dùng. |
| **AC-S-06** | Không phát sinh Asset trùng cho cùng nội dung hình. |
| **AC-S-07** | Media Source không dùng làm URL hiển thị khi Publish. |

Ánh xạ BRD: AC-01…07 · SEO-01…06 · FR/BR tương ứng — Solution phải chứng minh; SoT không mô tả cách chứng minh kỹ thuật.

---

# 16. Decision Log

| ID | Decision | Reason |
|----|----------|--------|
| **D-001** | Media Library là **Greenfield Capability** | Discovery Audit 02: không tồn tại Library / upload / localize / bảng asset |
| **D-002** | Article **không** sở hữu hình ảnh | Tái sử dụng · audit · SEO Asset · vòng đời độc lập |
| **D-003** | Media URL là URL duy nhất được phép khi **Publish** | BRD SEO-01/05 · BG-SEO-01 · hết hotlink runtime |
| **D-004** | Media Library = **SEO Asset Repository** (không chỉ “thay link”) | BRD BO-07…09 · SEO-M-* · Success Metrics Alt/filename |
| **D-005** | Import Pipeline là đường duy nhất đưa External Image → Asset | Tránh bypass ghi file / thay HTML ad-hoc |
| **D-006** | Naming & URL ổn định sau cấp phát / sau Publish | SEO ổn định · không gãy tham chiếu |
| **D-007** | IMG-A (TipTap Plan) = biên tập tạm; **Publish Contract thắng** tại Publish | Discovery: IMG-A đang LOCK trong Plan editor nhưng xung đột BRD — SoT khóa điểm giao |
| **D-008** | SoT draft 270728 **không** còn authority | Có implementation detail (encode · hash · path mẫu); thay bằng SoT-COM-MEDIA-001 |
| **D-009** | Dedup theo **cùng nội dung hình** (một Asset) | BRD FR-09 / AC-07 — cơ chế kỹ thuật → Solution |
| **D-010** | PS-1.0: Media Asset là Business data (API SoT) | Cấm mock/localStorage làm Library |

---

# 17. Owner Review

| Check | Owner |
|-------|-------|
| ACCEPT Purpose · Scope · Ownership · Objects | ☐ |
| ACCEPT SoT-01…05 · BR-M-* · NR-* · SEO-M-* · UR-* · OR-* · PC-* | ☐ |
| ACCEPT Capability Boundary · Non-goals · Decision Log | ☐ |
| Chốt phạm vi Publish bắt buộc: body + cover + SEO image bài? (mặc định đề xuất: **cả ba**) | ☐ |
| Cho phép mở Solution (sau SoT LOCK) | ☐ |

| Vai trò | Quyết định | Ngày | Ký |
|---------|------------|------|-----|
| Product Owner | | | ☐ |

**PASS SoT LOCK →** Solution **OPEN** (align/supersede 270728) · rồi Impact Analysis theo CG.

---

*SoT-COM-MEDIA-001 v1.0 · Proposed 2026-07-30 · Business Contract · không implementation*
