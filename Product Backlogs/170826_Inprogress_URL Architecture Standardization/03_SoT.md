# SoT — Product URL Architecture

**Scope:** Product-wide
**Status:** Owner Locked
**Authority:** Product SoT
**Task lock:** `170826_Inprogress_URL Architecture Standardization` — Owner khóa cùng 01/02/03b/04 ngày 17/08/2026. Không đổi rule.
**Replaces:** QĐ-4 — URL Structure (Task 03 §10 — đã xóa; Task 01–03 chỉ còn `EVIDENCE`, không ràng buộc Task 04)

---

## 1. URL phản ánh đầy đủ cấu trúc IA

URL được phép và có thể phản ánh đầy đủ cấu trúc:

Module → Page → Sub-page

hoặc cấu trúc tương ứng của IA thực tế.

Ví dụ:

/admin/system-settings/administrators/permissions

Trong đó:

- `system-settings` = Module
- `administrators` = Page/Menu
- `permissions` = Sub-page

Không có quy tắc cấm tên Module xuất hiện trong URL.

Tên các cấp trong URL phải phản ánh đúng vị trí hiện tại của trang
trong IA.

---

## 2. Ngôn ngữ URL

### 2.1. User App / User Web

Chỉ URL của các surface dành cho User và có yêu cầu SEO mới được
localized theo ngôn ngữ của trang.

Ví dụ:

VI:

/thi-truong/dong-tien

EN:

/market/money-flow

Slug thay đổi theo locale nhưng vẫn phải resolve về cùng một
technical Page Identity.

### 2.2. Các surface còn lại

Toàn bộ URL ngoài User App / User Web sử dụng tiếng Anh.

Bao gồm:

- Admin
- API
- Internal tools
- các surface hệ thống khác

Ví dụ Admin:

/admin/system-settings/administrators/permissions

Không localized URL Admin theo ngôn ngữ giao diện.

---

## 3. URL không phải Page Identity

URL chỉ là representation của vị trí trang.

Mỗi Page phải có technical identity ổn định, độc lập với:

- URL
- Module
- Menu
- Sub-menu
- locale

Không được dùng URL hiện tại làm identity của Page.

---

## 4. Di chuyển Page không được phá vỡ hệ thống

Khi một Page được di chuyển sang Module/Menu/Sub-menu khác:

- Page Identity không đổi.
- Feature Identity không đổi.
- Permission không đổi.
- Database identity không đổi.
- Không tạo Page bản sao.
- Không tạo Menu bản sao chỉ để giữ URL cũ.
- Navigation tự cập nhật.
- Breadcrumb tự cập nhật.
- URL mới tự phản ánh vị trí mới.

Ví dụ:

Ban đầu:

/admin/system-settings/administrators/permissions

Sau khi chuyển Page:

/admin/administrators/permissions

Page vẫn là cùng một Page Identity.

---

## 5. Route phải resolve theo Identity

Route resolution phải có khả năng ánh xạ:

URL → Page Identity

và không được phụ thuộc vào việc URL đó có đúng vị trí cũ hay không.

Việc thay đổi IA phải cập nhật Route Registry một cách canonical,
không yêu cầu sửa thủ công nhiều nơi.

---

## 6. Không nhân bản cấu trúc điều hướng

Mỗi Page chỉ có một canonical identity.

Mỗi Module/Menu/Sub-menu chỉ có một canonical ownership.

Không được tạo bản sao Page/Menu/Route chỉ vì:

- thay đổi vị trí;
- thay đổi URL;
- thay đổi locale;
- thay đổi navigation.

---

## 7. Phạm vi áp dụng

SoT này áp dụng cho toàn bộ Product.

Mọi:

- BRD
- Governance
- Migration
- Solution
- Implementation

đều phải tuân thủ tài liệu này.

Đây là Product-level SoT và không được override cục bộ
ở từng Phase.

---

## 8. Acceptance

Một implementation đạt SoT khi chứng minh được:

1. URL có thể chứa Module → Page → Sub-page.
2. Chỉ User App / User Web localized URL theo locale.
3. Admin và các surface còn lại dùng URL tiếng Anh.
4. Di chuyển Page trong IA không làm thay đổi Page Identity.
5. Navigation, Breadcrumb và URL tự phản ánh vị trí mới.
6. Không phải sửa nhiều nơi hoặc nhân bản Page/Menu/Route khi di chuyển.