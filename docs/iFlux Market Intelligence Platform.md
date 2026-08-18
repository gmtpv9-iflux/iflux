# iFlux Market Intelligence Platform

# Tài liệu định hướng kiến trúc dữ liệu và quy trình triển khai

## Mục tiêu

Chúng ta không xây dựng hệ thống theo tư duy "có dữ liệu gì thì hiển thị dữ liệu đó".

Chúng ta xây dựng theo tư duy:

> **Business Requirement → Widget → Data → Supplier**

Nói cách khác:

**Bắt đầu từ nhu cầu hiển thị của người dùng, sau đó truy ngược toàn bộ kiến trúc dữ liệu cho đến nguồn dữ liệu thô.**

Đây sẽ là nguyên tắc cốt lõi trong toàn bộ quá trình phát triển iFlux.

---

# Triết lý thiết kế

Mỗi Widget trên hệ thống phải trả lời được 3 câu hỏi:

1. Widget này giải quyết bài toán gì?
2. Widget này cần dữ liệu gì?
3. Dữ liệu đó được tạo ra như thế nào?

Nếu chưa trả lời được 3 câu hỏi trên thì chưa được phép triển khai Widget.

---

# Mô hình kiến trúc tổng thể

```
Business Requirement
        │
        ▼
Widget Requirement
        │
        ▼
Presentation Data
        │
        ▼
Intelligence Engine
        │
        ▼
Normalized Data
        │
        ▼
Raw Data
        │
        ▼
Supplier
```

Mọi thành phần trong hệ thống đều phải truy ngược được theo chuỗi này.

---

# Kiến trúc 4 tầng

## Tầng 1 - Raw Data Layer

Đây là tầng tiếp nhận dữ liệu gốc.

Không xử lý.

Không tính toán.

Không biến đổi nghiệp vụ.

Chỉ tiếp nhận và lưu dữ liệu từ các Supplier.

Ví dụ:

* Giá cổ phiếu
* Khớp lệnh
* Room ngoại
* Báo cáo tài chính
* Tin tức
* Công bố thông tin
* Vĩ mô
* Dữ liệu cộng đồng

Đây là tầng duy nhất làm việc với Supplier.

---

## Tầng 2 - Normalized Data Layer

Mục tiêu:

Chuẩn hóa toàn bộ dữ liệu về cùng một cấu trúc.

Ví dụ:

* Entity
* Symbol
* Sector
* Ecosystem
* Trạng thái Trạng thái Story
* Time
* Metadata

Sau tầng này:

Toàn bộ hệ thống chỉ còn làm việc với Entity.

Không còn quan tâm dữ liệu đến từ đâu.

---

## Tầng 3 - Intelligence Layer

Đây là trái tim của hệ thống.

Nhiệm vụ:

Từ dữ liệu chuẩn hóa sinh ra toàn bộ dữ liệu phân tích.

Ví dụ:

* Sector Index
* Trạng thái Trạng thái Story Index
* Ecosystem Index
* Money Flow
* Breadth
* Heat Score
* Ranking
* Technical Indicator
* Trend
* Alert
* AI Score

Đây là nơi đặt toàn bộ Business Logic.

---

## Tầng 4 - Widget Data Layer

Đây là đầu ra của toàn bộ hệ thống.

Không tính toán.

Không query dữ liệu phức tạp.

Chỉ chuẩn bị dữ liệu đúng format cho từng Widget.

Ví dụ:

Heatmap Data

Market Overview Data

Breadth Data

Ranking Data

Chart Data

Money Flow Data

Community Data

...

Widget chỉ đọc dữ liệu từ tầng này.

---

# Nguyên tắc thiết kế

Mỗi tầng chỉ được biết tầng liền kề với nó.

Widget

Không được truy cập trực tiếp:

* Raw Data
* Database
* Redis
* Intelligence Engine

Widget chỉ đọc Widget Data.

---

Intelligence Layer

Không được biết Widget.

Nó chỉ sinh dữ liệu.

Không quan tâm ai sử dụng.

---

Normalized Layer

Không được biết Business Logic.

Chỉ chịu trách nhiệm chuẩn hóa.

---

Raw Layer

Không được biết Product.

Chỉ tiếp nhận dữ liệu.

---

# Quy trình phát triển tính năng

Mỗi tính năng đều phải phát triển từ trên xuống dưới.

Không phát triển từ dưới lên.

---

## Bước 1

Xác định Business Requirement

Ví dụ:

Người dùng muốn xem:

Heatmap ngành.

---

## Bước 2

Xác định Widget

Ví dụ:

Sector Heatmap Widget.

---

## Bước 3

Xác định đầu ra Widget

Ví dụ:

```
Sector Name

Change %

Market Cap

Money Flow

Heat Color

Heat Size
```

Đây chính là Output của tầng 4.

---

## Bước 4

Xác định dữ liệu cần thiết

Ví dụ:

Sector Index

Sector Money Flow

Sector Members

Sector Market Cap

Sector Performance

Đây là Input của tầng 4.

---

## Bước 5

Xác định Intelligence cần tính

Ví dụ:

Sector Index Engine

Money Flow Engine

Sector Ranking

Heat Score

Đây là tầng 3.

---

## Bước 6

Xác định dữ liệu chuẩn hóa cần có

Ví dụ:

Danh sách cổ phiếu

Quan hệ ngành

Quan hệ hệ sinh thái

Quan hệ Trạng thái Trạng thái Story

Market Cap

Volume

OHLC

Đây là tầng 2.

---

## Bước 7

Xác định Raw Data cần thu thập

Ví dụ:

Giá

Volume

Bid

Ask

Foreign

Financial

News

Corporate Action

Đây là tầng 1.

---

## Bước 8

Xác định Supplier

Ví dụ:

CTCK

HOSE

HNX

DNSE

FireAnt

CafeF

FiinTrade

Tin tức

API nội bộ

...

Sau bước này chúng ta mới quyết định cần tích hợp nguồn dữ liệu nào.

---

# Quy trình chuẩn

```
Business
      │
      ▼
Widget
      │
      ▼
Widget Output
      │
      ▼
Widget Input
      │
      ▼
Business Engine
      │
      ▼
Normalized Data
      │
      ▼
Raw Data
      │
      ▼
Supplier
```

Đây là quy trình chuẩn để triển khai mọi tính năng của iFlux.

---

# Vai trò của Cursor

Cursor không được bắt đầu từ Database.

Cursor phải bắt đầu từ Widget.

Quy trình làm việc của Cursor:

## Giai đoạn 1

Thống kê toàn bộ Widget hiện có.

Ví dụ:

* Dashboard
* Heatmap
* Market Overview
* Breadth
* Ranking
* Money Flow
* Chart
* Community
* ...

---

## Giai đoạn 2

Đối với từng Widget.

Cursor phải mô tả:

* Mục tiêu Business
* Input
* Output

---

## Giai đoạn 3

Từ Input của Widget.

Cursor truy ngược:

* Intelligence cần có
* Dữ liệu chuẩn hóa cần có
* Raw Data cần có

---

## Giai đoạn 4

Từ Raw Data.

Cursor lập danh sách Supplier cần tích hợp.

---

# Kết quả cuối cùng

Sau khi hoàn thành toàn bộ quá trình.

Chúng ta sẽ có:

* Danh mục toàn bộ Widget.
* Chuẩn dữ liệu đầu vào và đầu ra của từng Widget.
* Danh sách Business Engine cần xây dựng.
* Chuẩn dữ liệu của Normalized Layer.
* Danh sách Raw Data cần thu thập.
* Danh sách Supplier cần tích hợp.

Đây sẽ là Blueprint dữ liệu của toàn bộ nền tảng iFlux.

Từ Blueprint này, toàn bộ Backend, Frontend, AI, Realtime Engine và Data Pipeline đều có thể được triển khai theo cùng một chuẩn kiến trúc thống nhất.
