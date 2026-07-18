# Tạo bài viết \(Article\)

## **Mục tiêu**

Bài viết trên iFlux không chỉ là nội dung để đọc mà còn là **nguồn dữ liệu đầu vào** để hệ thống hình thành các **Topic**, từ đó phát triển thành **Story**\.

Do đó, mọi trường dữ liệu khi tạo bài viết đều phải phục vụ 3 mục tiêu:

- Quản lý và phân loại nội dung\.

- Hỗ trợ SEO và tìm kiếm\.

- Tạo dữ liệu để hệ thống xây dựng Story trong tương lai\.

---

# Cấu trúc bài viết

## Tiêu đề

Bắt buộc\.

Đây là trường quan trọng nhất\.

Ngay khi người viết nhập tiêu đề, hệ thống sẽ bắt đầu phân tích để đề xuất Topic phù hợp\.

Ví dụ:

```Plain Text
Đầu tư công sẽ bùng nổ trong nửa cuối năm
```

---

## Danh mục

Bắt buộc\.

Chỉ được chọn **01 danh mục**\.

Danh mục chỉ dùng để phân loại bài viết ở mức cao, phục vụ quản lý nội dung và điều hướng\.

Ví dụ:

```Plain Text
Thị trường

Cổ phiếu

Doanh nghiệp

Kiến thức

Phân tích

Nhận định

Tin tức

Cộng đồng
```

Danh mục **không tham gia hình thành Story**\.

---

## Chủ đề \(Topic\)

Đây là trường quan trọng nhất\.

Một bài viết chỉ được chọn **01 Topic**\.

Mỗi bài chỉ nên phản ánh một chủ đề chính nhằm đảm bảo dữ liệu sạch và tránh việc một bài viết tác động tới nhiều Story khác nhau\.

---

## Cơ chế lựa chọn Topic

### Cách 1 \- Gợi ý ngay khi nhập tiêu đề

Ngay khi người viết nhập tiêu đề, hệ thống sẽ phân tích các từ khóa trong tiêu đề và tìm các Topic đã tồn tại\.

Ví dụ:

Tiêu đề

```Plain Text
Đầu tư công sẽ bùng nổ trong nửa cuối năm
```

Hệ thống gợi ý:

```Plain Text
Đầu tư công (2.356 bài)

Cao tốc Bắc Nam (562 bài)

Giải ngân vốn đầu tư công (189 bài)

...
```

Người viết chỉ cần chọn\.

---

### Cách 2 \- Tìm kiếm Topic

Người viết có thể nhập trực tiếp vào ô Topic\.

Ví dụ

```Plain Text
đầu tư
```

Hệ thống hiển thị

```Plain Text
Đầu tư công

Đầu tư nước ngoài

Đầu ngành
```

Kết quả được sắp xếp theo:

- Độ khớp từ khóa

- Mức độ phổ biến

- Số lượng bài viết

---

### Cách 3 \- Tạo Topic mới

Nếu không tìm thấy Topic phù hợp\.

Hệ thống hiển thị

```Plain Text
+ Tạo chủ đề mới

Chiến tranh Trung Đông
```

Sau khi tạo

- Topic được lưu vào hệ thống\.

- Topic tự động được chọn cho bài viết\.

- Topic bắt đầu với:

```Plain Text
Số bài viết = 1
```

Các bài viết sau \(của cả các tác giả khác\) sẽ có thể tìm được topic này khi viết bài mới

---

# Gắn mã cổ phiếu

Đây là trường dữ liệu quan trọng thứ hai\.

Một bài viết chỉ được gắn từ 0 \- **5 mã cổ phiếu** \(0 là để tránh trường hợp bài viết mang tính cộng đồng, ko có liên quan tới bất kì cổ phiếu nào\)
Hoặc có thể gắn từ 0 \- 3 ngành
Hoặc có thể gắn từ 0 \- 3 hệ sinh thái \(họ cổ phiếu\)
Hoặc có thể gắn từ 0 \- 1 sàn \(bao gồm VNIndex\)

Việc giới hạn nhằm đảm bảo mỗi bài viết tập trung vào một nhóm đối tượng cụ thể, tránh spam hàng loạt mã không liên quan\.

---

## **Nếu Topic hoàn toàn mới**

Ví dụ

```Plain Text
Topic

Chiến tranh Trung Đông
```

Hệ thống chưa có dữ liệu\.

Người viết tự lựa chọn các mã cổ phiếu liên quan\.

Ví dụ

```Plain Text
PVS

GAS

BSR
```

---

## Nếu Topic đã tồn tại

Ví dụ

```Plain Text
Topic

Đầu tư công
```

Hệ thống thống kê toàn bộ bài viết trước đó và đề xuất các mã cổ phiếu thường xuyên được gắn với Topic này\.

Ví dụ

```Plain Text
VCG (1.145)

HHV (965)

C4G (812)

LCG (650)

FCN (410)
```

Người viết có thể:

- Chọn các mã được đề xuất\.

- Bỏ bớt\.

- Thêm mã mới\.

- Không bắt buộc phải giống các bài viết trước\.

Sau khi bài viết được lưu, thống kê sẽ tự động cập nhật\.

Nếu một mã mới xuất hiện ngày càng nhiều trong Topic này thì lần sau nó sẽ tự động được đưa vào danh sách đề xuất\.

Nhờ vậy dữ liệu luôn phản ánh đúng xu hướng cộng đồng\.

---

# Nội dung

Trình soạn thảo\.

Hỗ trợ:

- Heading

- Danh sách

- Quote

- Bảng

- Hình ảnh

- Video

- Link

- Code \(nếu cần\)

Khuyến nghị SEO:

- Có ít nhất một H1 \(chính là tiêu đề\)\.

- Nội dung có H2/H3 rõ ràng\.

- Hình ảnh có Alt Text\.

- Link nội bộ tới các bài viết khác\.

---

# Ảnh đại diện

Bao gồm:

- Upload

- Chọn từ thư viện

Thuộc tính SEO:

- Alt

- Caption

- Credit

---

# Thiết lập SEO

Ngoài tiêu đề hiển thị\.

Cho phép chỉnh riêng:

```Plain Text
SEO Title

SEO Description

SEO Keywords

Canonical URL
```

Nếu không nhập\.

Hệ thống tự sinh từ:

- Tiêu đề

- Đoạn mở đầu

- Topic

---

# URL

Slug\.

Ví dụ

```Plain Text
dau-tu-cong-bung-no-nua-cuoi-nam
```

---

# Trạng thái

```Plain Text
Nháp

Chờ duyệt

Đã xuất bản

Đã lên lịch
```

---

# Thiết lập hiển thị

Ví dụ

```Plain Text
Nổi bật

Ghim đầu trang

Cho phép bình luận

Cho phép chia sẻ
```

---

# Luồng dữ liệu

```Plain Text
Người viết

↓

Nhập tiêu đề

↓

Hệ thống gợi ý Topic

↓

Người viết chọn hoặc tạo Topic

↓

Nếu Topic cũ

↓

Hệ thống đề xuất các mã cổ phiếu phổ biến

↓

Người viết chọn 0 - 05 mã / 0 - 3 ngành / 0 - 3 hệ sinh thái / 1 sàn

↓

Viết nội dung

↓

Thiết lập SEO

↓

Xuất bản bài viết
```

---

# Dữ liệu được hình thành sau mỗi bài viết

Sau khi bài viết được xuất bản, hệ thống không chỉ lưu nội dung mà còn cập nhật các thống kê phục vụ phân tích\.

Đối với mỗi **Topic**, hệ thống sẽ ghi nhận:

- Tổng số bài viết

- Danh sách cổ phiếu được gắn

- Tần suất xuất hiện của từng cổ phiếu\.

- Lượt xem\.

- Lượt thích\.

- Bình luận\.

- Chia sẻ\.

- Theo dõi Topic\.

- Lượt tìm kiếm Topic\.

- Tốc độ tăng trưởng theo ngày/tuần/tháng\.

Đối với **Topic ↔ Cổ phiếu**, hệ thống sẽ ghi nhận:

- Số lần cổ phiếu được gắn trong Topic\.

- Số bài viết chứa cặp Topic–Cổ phiếu\.

- Mức độ tăng trưởng theo thời gian\.

---

