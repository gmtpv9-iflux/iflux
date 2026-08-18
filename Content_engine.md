Mình sẽ viết theo đúng **triết lý Source of Truth** mà bạn đang áp dụng cho Market Data. Quan trọng nhất là **Content Engine và Market Engine có cùng một ngôn ngữ kiến trúc**, chỉ khác domain.

---

# Content Engine Architecture

## Mục tiêu

Content Engine là nền tảng chịu trách nhiệm thu thập, chuẩn hóa, phân tích và cung cấp toàn bộ dữ liệu nội dung của iFlux.

Content Engine không chỉ quản lý bài viết mà còn chuyển đổi nội dung thành tri thức phục vụ Topic, Story và toàn bộ Community Intelligence của hệ thống.

Mọi Widget, API và tính năng liên quan đến nội dung đều chỉ được phép sử dụng dữ liệu do Content Engine cung cấp.

---

# Kiến trúc tổng thể

```text
Content Sources
        │
        ▼
Layer 1 — Raw Content
        │
        ▼
Layer 2 — Canonical Content
        │
        ▼
Layer 3 — Content Intelligence
        │
        ▼
Layer 4 — Presentation
```

---

# Layer 1 — Raw Content

## Mục tiêu

Thu thập dữ liệu từ nhiều nguồn khác nhau.

Layer này không thực hiện bất kỳ xử lý nghiệp vụ nào.

Chỉ chịu trách nhiệm tiếp nhận dữ liệu gốc và lưu trữ phục vụ các bước xử lý tiếp theo.

---

## Nguồn dữ liệu

### Editorial Sources

Nguồn nội dung do iFlux sở hữu.

Ví dụ

* Admin
* Cộng tác viên
* Biên tập viên

Đây là nguồn có chất lượng cao, đầy đủ metadata và tuân thủ quy chuẩn biên tập của iFlux.

---

### External Sources

Nguồn dữ liệu từ bên ngoài.

Ví dụ

* Vnstock
* RSS
* CafeF
* Vietstock
* Reuters
* Bloomberg
* API đối tác
* AI Generated Content

Đây thường là dữ liệu chưa chuẩn hóa và cần xử lý trước khi đưa vào hệ thống.

---

## Trách nhiệm

* Thu thập dữ liệu
* Đồng bộ dữ liệu
* Lưu dữ liệu gốc
* Theo dõi trạng thái đồng bộ
* Retry khi lỗi
* Audit nguồn dữ liệu

Layer này **không**:

* Không sinh Topic
* Không tính Score
* Không phân tích Story
* Không phục vụ Widget

---

# Layer 2 — Canonical Content

## Mục tiêu

Chuẩn hóa toàn bộ dữ liệu thành mô hình nội dung thống nhất của iFlux.

Sau Layer này, mọi nguồn dữ liệu đều trở thành **Article**.

Article là thực thể nội dung chuẩn (Canonical Content) của hệ thống.

Topic Engine và các Engine khác chỉ làm việc với Article.

---

## Chuẩn hóa dữ liệu

Ví dụ

* Chuẩn hóa tiêu đề
* Chuẩn hóa nội dung
* Chuẩn hóa thời gian
* Chuẩn hóa nguồn
* Chuẩn hóa tác giả
* Chuẩn hóa metadata

---

## Xử lý

* Deduplicate
* Canonical URL
* Metadata Extraction
* SEO Metadata
* Entity Extraction
* Keyword Extraction
* Language Detection
* Content Classification

---

## Entity Mapping

Ánh xạ nội dung tới các thực thể của iFlux.

Ví dụ

* Stock
* Sector
* Ecosystem
* Exchange
* Topic (gợi ý)
* Tag

---

## Kết quả

Đầu ra của Layer 2 là **Article**.

Article là nguồn dữ liệu chuẩn duy nhất cho toàn bộ Content Intelligence.

---

# Layer 3 — Content Intelligence

## Mục tiêu

Biến các Article thành tri thức phục vụ người dùng.

Đây là tầng cốt lõi tạo nên lợi thế cạnh tranh của iFlux.

Mọi thuật toán phân tích nội dung đều thuộc Layer này.

---

## Topic Engine

Chịu trách nhiệm:

* Hình thành Topic
* Gộp Article theo Topic
* Đề xuất Topic mới
* Phát hiện Topic mới nổi

---

## Topic Analytics

Bao gồm

* Topic Score
* Topic Heat
* Topic Momentum
* Topic Trend
* Topic Ranking

---

## Representative Stocks

Xác định các cổ phiếu đại diện cho Topic.

---

## Leader Stock

Xác định cổ phiếu dẫn dắt của Topic.

---

## Topic Index

Tính toán chỉ số đại diện cho toàn bộ Topic.

---

## Story Engine

Quản lý vòng đời của Topic.

Ví dụ

* New
* Developing
* Mature
* Declining
* Archived

Khi Topic đạt điều kiện trưởng thành sẽ trở thành Story.

---

## Recommendation

Bao gồm

* Related Topics
* Related Articles
* Related Stories
* Personalized Recommendation

---

## Analytics

Ví dụ

* Trending
* Growth
* Search Analytics
* Interaction Analytics
* Popularity
* Community Signals

---

## Đầu ra

Layer này tạo ra các dữ liệu phân tích phục vụ API và Widget.

---

# Layer 4 — Presentation

## Mục tiêu

Cung cấp dữ liệu cho giao diện người dùng.

Layer này không chứa Business Logic.

Mọi Widget chỉ hiển thị dữ liệu do Layer 3 cung cấp.

---

## Community Widgets

Ví dụ

* News Feed
* Trending Topics
* Stories
* Recommended Articles
* Following Topics
* Community Feed

---

## Entity Widgets

Ví dụ

Trang cổ phiếu

* News
* Related Stories
* Related Topics

---

## Dashboard Widgets

Ví dụ

* Hot Topics
* Trending Stories
* Community Highlights
* Editorial Picks

---

## API

Ví dụ

```
GET /content/articles

GET /content/topics

GET /content/stories

GET /content/feed

GET /content/trending
```

Frontend chỉ được phép gọi API của iFlux.

Không Widget nào được phép truy cập trực tiếp Vnstock, RSS hoặc bất kỳ nguồn dữ liệu bên ngoài nào.

---

# Kiến trúc tổng thể

```text
                    CONTENT ENGINE

                ┌─────────────────────┐
                │   CONTENT SOURCES   │
                └──────────┬──────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │ L1. RAW CONTENT                  │
        │ • Admin                          │
        │ • Contributors                   │
        │ • Vnstock                        │
        │ • RSS                            │
        │ • Reuters                        │
        │ • API                            │
        └──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │ L2. CANONICAL CONTENT            │
        │ • Normalize                      │
        │ • Deduplicate                    │
        │ • Entity Mapping                 │
        │ • Metadata                       │
        │ • Canonical Article              │
        └──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │ L3. CONTENT INTELLIGENCE         │
        │ • Topic Engine                   │
        │ • Topic Analytics                │
        │ • Representative Stocks          │
        │ • Leader Stock                   │
        │ • Topic Index                    │
        │ • Story Engine                   │
        │ • Recommendation                 │
        │ • Analytics                      │
        └──────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │ L4. PRESENTATION                 │
        │ • APIs                           │
        │ • Widgets                        │
        │ • Community                      │
        │ • Entity Pages                   │
        │ • Dashboard                      │
        └──────────────────────────────────┘
```

## Điểm mình đề xuất bổ sung

Mình sẽ **đổi tên Layer 2 từ "Canonical Content" thành "Article Layer"**.

Lý do là trong toàn bộ hệ thống của iFlux, **Article chính là thực thể trung tâm của Content Engine**, giống như **Stock** là thực thể trung tâm của Market Engine.

Khi đó kiến trúc sẽ dễ hiểu hơn:

* **L1 – Raw Content**: Thu thập dữ liệu.
* **L2 – Article Layer**: Chuẩn hóa thành **Article** (nguồn dữ liệu chuẩn duy nhất).
* **L3 – Content Intelligence**: Topic, Story, Ranking, Analytics...
* **L4 – Presentation**: API và Widgets.
