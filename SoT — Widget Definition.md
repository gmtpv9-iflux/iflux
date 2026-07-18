Phiên bản này có thể xem là **SoT cuối cùng** cho Widget của iFLUX

---

# SoT — Widget Definition

## Mục tiêu

Widget là **đơn vị nội dung (Content Unit) độc lập** của nền tảng iFlux.

Widget không phải là giao diện, không phải một Component, không phải một Template và cũng không thuộc về bất kỳ Page nào.

Widget đại diện cho **một nội dung có ý nghĩa nghiệp vụ hoàn chỉnh**, có thể được phân phối, hiển thị và sử dụng trên nhiều Runtime khác nhau nhưng vẫn chỉ có **một định nghĩa duy nhất**.

Toàn bộ nền tảng iFlux được xây dựng theo tư duy **Widget-first**, trong đó mọi Runtime chỉ là nơi tiêu thụ (consume) Widget.

---

# Triết lý kiến trúc

Trong iFlux:

* Widget là nội dung.
* Template là cách trình bày.
* Page là nơi tập hợp Widget.
* Runtime là nơi hiển thị Widget.

Điều này có nghĩa:

* Web App chỉ là một Runtime.
* Mobile App chỉ là một Runtime.
* Insight chỉ là một Runtime.
* Link chia sẻ chỉ là một Runtime.
* AI cũng chỉ là một Runtime.
* API cũng chỉ là một Runtime.

Widget tồn tại độc lập với tất cả các Runtime.

Nếu toàn bộ Web App bị thay thế, Widget vẫn giữ nguyên.

---

# Widget là gì?

Widget là một đơn vị nội dung hoàn chỉnh, mô tả một giá trị mà người dùng có thể xem, chia sẻ hoặc sử dụng.

Ví dụ:

* Top 10 Dòng tiền
* Heatmap ngành
* Độ rộng thị trường
* Chủ đề nổi bật
* Watchlist
* Danh mục của tôi
* Cổ phiếu được quan tâm nhiều nhất

Đây đều là Widget.

Không phụ thuộc chúng đang được hiển thị ở đâu.

---

# Một Widget chỉ tồn tại một lần

Mỗi Widget chỉ có một mã định danh duy nhất.

Ví dụ:

```
WGT-MKT-001
```

Widget này chỉ được định nghĩa một lần.

Nhưng có thể được sử dụng đồng thời tại:

* Trang Thị trường
* Trang Nhà của tôi
* Dashboard
* Insight
* Trang HTML chia sẻ
* AI
* API
* Mobile
* Email
* Các Runtime trong tương lai

Tất cả đều là cùng một Widget.

---

# Widget không thuộc về Page

Page không sở hữu Widget.

Page chỉ tham chiếu đến Widget.

Một Widget có thể xuất hiện trên nhiều Page khác nhau.

Một Page có thể chứa nhiều Widget khác nhau.

Giữa Widget và Page là quan hệ tham chiếu, không phải quan hệ sở hữu.

---

### Page Published

Sau khi Publish, mỗi Page sinh ra một **Page Published Artifact** dành cho Runtime.

Page Published chỉ chứa:

- Thông tin của Page.
- Danh sách Placement.
- Danh sách Widget Reference.

Page Published không phải là nơi lưu trữ (canonical storage) của Widget.

Trong quá trình phân phối dữ liệu, Runtime có thể nhận kèm Widget Published đã được embed để tối ưu việc tải dữ liệu. Đây chỉ là response artifact, không phải canonical persistence.

---

# Widget không chứa giao diện

Widget không biết:

* đang nằm ở Page nào
* đang ở vị trí nào
* đang dùng Template nào
* đang hiển thị trên Web hay Mobile
* đang hiển thị dưới dạng Insight hay Share

Widget chỉ định nghĩa nội dung.

Mọi quyết định về giao diện đều thuộc Template.

---

# Widget không chứa Business Logic

Widget không tính toán dữ liệu.

Widget chỉ định nghĩa:

* dữ liệu nào cần hiển thị
* dữ liệu có ý nghĩa gì
* cấu trúc dữ liệu cần có

Business Logic luôn thuộc Kiến trúc 4 tầng (Tầng tính toán).

Sau khi Business Logic tính xong, Runtime chỉ nhận ViewModel để hiển thị.

---

# Widget là Source of Truth của nội dung

Widget là nơi duy nhất định nghĩa:

* tiêu đề
* mô tả
* bài toán
* dữ liệu cần hiển thị
* dữ liệu mẫu
* metadata
* khả năng chia sẻ
* khả năng xuất Insight

Không Runtime nào được phép tự định nghĩa lại các thông tin này.

---

# Bốn Source of Truth điều khiển Widget

Widget được điều khiển bởi đúng bốn Source of Truth.

Không được phép tồn tại owner thứ năm.

---

## 1. Ai được xem?

Owner

```
Admin
└── Gói đăng ký
    └── Phân quyền sử dụng
```

Quyết định:

* User nào được xem
* Gói nào được xem
* Block quyền nào được xem
* Điều kiện hiển thị

Widget không biết người dùng thuộc gói nào.

---

## 2. Xem ở đâu?

Owner

```
Admin
└── Giao diện
    └── Cài đặt trang
```

Quyết định:

* Page
* Section
* Position
* Span
* Widget đặc thù
* Widget tùy chỉnh

Widget không biết mình đang ở đâu.

---

## 3. Hiển thị như thế nào?

Owner

```
Admin
└── Giao diện
    └── Mẫu giao diện
```

Template quyết định:

* bố cục
* biểu đồ
* bảng
* KPI
* Ranking
* Timeline
* Heatmap
* Card
* Danh sách
* Màu sắc
* Typography
* Responsive
* Animation

Một Widget có thể đổi Template mà không cần đổi Widget.

---

## 4. Hiển thị nội dung gì?

Owner

```
Admin
└── Kiến trúc 4 tầng
    └── Tầng 4
```

Đây là nơi duy nhất định nghĩa Widget.

Bao gồm:

* mã Widget
* tiêu đề
* mô tả
* bài toán
* Template được sử dụng
* dữ liệu cần hiển thị
* dữ liệu mẫu
* metadata
* Insight metadata
* Share metadata

Đây là Source of Truth duy nhất của nội dung Widget.

---

# Quan hệ giữa bốn Source of Truth

```
Ai được xem?
        │
        ▼

Xem ở đâu?
        │
        ▼

Hiển thị như thế nào?
        │
        ▼

Hiển thị nội dung gì?
```
## Publish Pipeline

Bốn Source of Truth chỉ tồn tại trong giai đoạn Authoring.

Sau khi Publish, hệ thống sẽ resolve toàn bộ:

- Permission
- Layout
- Template
- Capability
- Dependency

để sinh ra Published Artifact.

Published Artifact là đầu vào duy nhất của Runtime.

Runtime không được phép truy cập trực tiếp các Source of Truth này.
---

# Quy trình tạo Widget

## Bước 1

```
Admin

↓

Kiến trúc 4 tầng

↓

Tầng 4

↓

Thêm Widget
```

Nhập:

* Tiêu đề
* Mô tả
* Mô tả bài toán

Sau đó chọn Template.

---

## Sau khi chọn Template

Template khai báo:

* Input Schema
* Output Schema
* Dữ liệu bắt buộc
* Dữ liệu tùy chọn

Hệ thống tự sinh toàn bộ biểu mẫu nhập liệu.

Admin chỉ nhập dữ liệu.

Widget không cần biết Template hoạt động như thế nào.

---

## Dữ liệu

### Nếu chưa đồng bộ Business Logic (từ các tầng khác trong Kiến trúc 4 tầng)

Widget sử dụng dữ liệu mẫu.

Cho phép hoàn thiện nội dung trước khi có dữ liệu thật.

---

### Đã đồng bộ Business Logic

Widget tự động nhận dữ liệu từ Core.

Không cần sửa:

* Widget
* Template
* Runtime

---

# Đưa Widget lên giao diện

Sau khi Widget được tạo.

```
Admin

↓

Giao diện

↓

Cài đặt trang > Widget đặc thù / Widget tùy chỉnh 
```

Chọn:

* Widget
* Shell (Section)
* Vị trí
* Kích thước (Span)

Hoàn toàn không sửa Widget.

---

# Cấp quyền

Sau khi Widget được đặt lên giao diện.

```
Admin

↓

Gói đăng ký

↓

Phân quyền sử dụng
```

Chọn:

* Free
* Premium
* Elite

Hoặc từng Block quyền.

Widget không biết người dùng thuộc gói nào.

---

# Runtime của Widget

- Mọi Runtime trong hệ sinh thái iFlux đều hoạt động theo cùng một nguyên tắc.
- Runtime không tạo Widget.
- Runtime không chỉnh sửa Widget.
- Runtime chỉ đọc Published Artifact.
- Runtime không truy cập trực tiếp các Source of Truth trong Admin.

Quy trình Runtime:

```
Admin (4 Source of Truth)
        │
        ▼
Publish Pipeline
        │
        ▼
Published Artifact
        │
        ▼
Business Data
        │
        ▼
ViewModel
        │
        ▼
Runtime Render
```

### Runtime Principle

Runtime chỉ có hai trách nhiệm:

- Đọc Published Artifact.
- Render Published Artifact.

Runtime không được phép:

- resolve Template;
- resolve Layout;
- resolve Permission;
- resolve Dependency;
- suy diễn Business Logic;
- tạo cấu hình mặc định;
- sửa đổi Published Artifact;
- đổi tiêu đề;
- đổi Template;
- đổi dữ liệu;
- đổi Business Logic;
- đổi vị trí hiển thị;
- đổi quyền truy cập;
- tự sinh dữ liệu hoặc cấu hình thiếu.

---

# Khả năng của Widget

Sau khi được tạo, Widget có thể được sử dụng trên mọi Runtime.

## Web App

Có.

---

## Mobile

Có.

---

## Dashboard

Có.

---

## AI

Có.

AI không đọc Page.

AI đọc Widget.

---

## API

Có.

Ví dụ:

```
GET /api/widgets/WGT-MKT-001
```

---

## Insight

Có.

Insight chỉ là một Runtime khác của Widget.

Không phải một đối tượng mới.

---

## Download

Có.

Ví dụ:

* PNG
* PDF
* SVG
* Excel
* Các định dạng khác trong tương lai

---

## Share

Có.

Mỗi Widget có thể sinh một liên kết chia sẻ.

Ví dụ:

```
https://iflux.vn/widget/abcxyz
```

Liên kết này mở một trang HTML độc lập.

Trang HTML có giao diện landing page riêng và chỉ chứa duy nhất Widget được chia sẻ

Không mở toàn bộ Web App.

Runtime của Share dựng Widget từ cùng một Widget Definition.

---

## Phân quyền chia sẻ

Widget hỗ trợ chia sẻ theo quyền.

Người chia sẻ có thể cấp quyền xem.

Khi mở liên kết:

* nếu đủ quyền, Widget hiển thị đầy đủ;
* nếu không đủ quyền, Runtime chỉ hiển thị phần được phép hoặc yêu cầu xác thực.
* quyền được truy vấn dựa vào mã Affiliate của User có trên link.

Không tạo thêm Widget mới.

---

# Artifact Lifecycle

Mọi Artifact trong hệ thống đều trải qua cùng một vòng đời.

Draft

↓

Validated

↓

Resolved

↓

Frozen

↓

Published

↓

Deprecated

↓

Archived

Runtime chỉ được phép tiêu thụ Artifact ở trạng thái Published.

Quy tắc chuyển trạng thái giữa các giai đoạn sẽ được định nghĩa trong Publish Pipeline và Version Policy khi hệ thống mở rộng.

---

# Các nguyên tắc bất biến

1. Widget là đơn vị nội dung độc lập của iFlux.
2. Widget là trung tâm của toàn bộ hệ sinh thái iFlux.
3. Widget chỉ được định nghĩa một lần.
4. Widget không thuộc bất kỳ Page nào.
5. Widget không chứa giao diện.
6. Widget không chứa Business Logic.
7. Widget không chứa phân quyền.
8. Widget không chứa vị trí hiển thị.
9. Widget không tự quyết định cách trình bày.
10. Widget có thể sử dụng trên nhiều Runtime nhưng vẫn là cùng một Widget.
11. Mọi Runtime phải dựng Widget từ cùng một Widget Definition.
12. Runtime chỉ được phép đọc Widget, không được phép bổ sung, ghi đè hoặc suy diễn nội dung của Widget.
13. Mọi hình thức hiển thị (Web, Mobile, Insight, Share, AI, API...) đều phải tiêu thụ cùng một Widget Definition.
14. Widget phải có khả năng hoạt động độc lập bên ngoài Web App nếu quyền truy cập cho phép.
15. Không được phép tồn tại bất kỳ Source of Truth nào khác ngoài bốn Source of Truth đã được định nghĩa trong tài liệu này.

---

Đây mới là phiên bản có thể xem là **SoT cấp kiến trúc** (Architectural SoT), vì nó không còn mô tả Widget như một phần của Web App, mà định nghĩa Widget là **Content Unit trung tâm của toàn bộ nền tảng iFlux**. Với tư duy này, nếu sau này bạn phát triển Mobile, API công khai, AI Agent, Email Report hay thậm chí Desktop App, bạn sẽ không cần sửa lại tài liệu Widget nữa; chỉ cần bổ sung Runtime mới tiêu thụ cùng một Widget Definition.
