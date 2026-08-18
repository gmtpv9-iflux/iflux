# Hình thành Trạng thái của Topic

## Mục tiêu

Trong iFlux, **Topic** là thực thể duy nhất đại diện cho một chủ đề đầu tư.

**Story không còn là một thực thể (Entity) riêng**, mà chỉ là **một trạng thái trưởng thành của Topic**.

Điều này có nghĩa là:

* Mỗi Topic luôn tồn tại xuyên suốt vòng đời.
* Hệ thống chỉ đánh giá và cập nhật **Trạng thái (Status)** của Topic theo thời gian.
* Không tồn tại quá trình "tạo Story" hay "chuyển Topic thành Story". Thực chất chỉ là **Topic đạt đến trạng thái trưởng thành**.

---

# Nguyên tắc hình thành Trạng thái

Trạng thái của Topic không được tạo thủ công.

Trạng thái được hình thành hoàn toàn từ dữ liệu của Community.

Quy trình như sau:

```text
Bài viết
        │
        ▼
Topic
        │
        ▼
Thống kê dữ liệu Community
        │
        ├── Nội dung
        ├── Hành vi người dùng
        ├── Tìm kiếm
        ├── Tăng trưởng
        └── Cổ phiếu được nhắc đến
        │
        ▼
Topic Score
        │
        ▼
Topic Status
```

Như vậy, **Status không phải dữ liệu do người dùng nhập**, mà là kết quả được hệ thống phát hiện từ sự hội tụ giữa:

* Nội dung
* Hành vi cộng đồng
* Nhu cầu tìm kiếm
* Mức độ tăng trưởng
* Các cổ phiếu được nhắc đến

Điều này giúp Topic luôn phản ánh đúng những câu chuyện đầu tư đang diễn ra trên thị trường.

---

# Vòng đời của Topic

Mỗi Topic luôn tồn tại một trong số các trạng thái sau:

| Trạng thái          | Điều kiện đạt được                                                                                                                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mới**             | Ngay sau khi được khởi tạo, Topic bắt đầu được xuất hiện các hoạt động tương tác (số bài viết, số tác giả, số lượt tương tác... mới) để hệ thống bắt đầu tính **Topic Score**. Topic chỉ được ghi nhận dữ liệu, chưa tham gia xếp hạng.|
| **Đang phát triển** | Trong **W ngày gần nhất** tính đến ngày hiện hành, **Topic Score trung bình W ngày** lọt vào **Top X%** Topic có Topic Score cao nhất toàn hệ thống và duy trì trong D ngày tiếp theo. W, D và X% được Admin thiết lập và mặc định là W = 3, D = 3 và X% = 80% |
| **Đã trưởng thành** | Trong **W ngày gần nhất** tính đến ngày hiện hành, **Topic Score trung bình W ngày** lọt vào **Top X%** Topic có Topic Score cao nhất toàn hệ thống và duy trì trong D ngày tiếp theo. W, D và X% được Admin thiết lập và mặc định là  W = 3, D = 3 và X% = 80% |
| **Đang suy giảm**   | Trong **W ngày gần nhất** tính đến ngày hiện hành, **Topic Score trung bình W ngày** rời khỏi **Top X%** Topic có Topic Score cao nhất toàn hệ thống và duy trì trong D ngày tiếp theo. W, D và X% được Admin thiết lập và mặc định là  W = 3, D = 3 và X% = 80% |
| **Lưu trữ**         | Trong **W ngày gần nhất** tính đến ngày hiện hành,  **Topic Score trung bình W ngày** rời khỏi **Top X%** Topic có Topic Score cao nhất toàn hệ thống và duy trì trong D ngày tiếp theo.  W, D và X% được Admin thiết lập và mặc định là W = 3, D = 7 và X% = 80% |

```mermaid
flowchart TD

    A[Khởi tạo Topic] --> B[Mới]

    B -->|Đủ điều kiện bắt đầu tính Topic Score| C[Đang phát triển]

    C -->|Duy trì Top X% trong D ngày| D[Đã trưởng thành<br/>(Story)]

    D -->|Rời khỏi Top X% trong D ngày| E[Đang suy giảm]

    E -->|Không còn đáp ứng điều kiện hoạt động tối thiểu trong D ngày| F[Lưu trữ]

    %% Re-evaluate
    E -->|Đạt lại điều kiện Story| D
    F -->|Topic hoạt động trở lại| C

    %% Manual Override
    G[Admin Override] -.-> B
    G -.-> C
    G -.-> D
    G -.-> E
    G -.-> F
```

## Lưu ý:

Admin có thể ghi đè (override) Trạng thái của Topic bằng thiết lập thủ công. Sau khi admin thiết lập, hệ thống vẫn duy trì các thuật toán đánh giá nhưng Thiết lập thủ công của Admin luôn có ưu tiên cao hơn cho đến khi chế độ Override được hủy bỏ và hệ thống quay trở lại áp dụng theo đánh giá hệ thống.

Topic ở mọi trạng thái đều tiếp tục được hệ thống theo dõi. Khi đáp ứng điều kiện của trạng thái cao hơn, Topic sẽ được đánh giá lại và chuyển sang trạng thái tương ứng.

> **Lưu ý:** "Story" chỉ là cách gọi đối với những Topic đang ở trạng thái **Đã trưởng thành**.

--- 
# Chu kỳ đánh giá
Hệ thống thực hiện đánh giá và cập nhật Trạng thái Topic 01 lần mỗi ngày vào 00:00.

Đối với bài viết mới:

Bài viết được xuất bản trước 12:00 được tính là dữ liệu của ngày hiện tại.
Bài viết được xuất bản từ 12:00 trở đi được tính là dữ liệu của ngày kế tiếp.

Quy tắc này được áp dụng cho toàn bộ dữ liệu dùng để tính Topic Score.

---
# Hiển thị

## Topic chưa trưởng thành: Mới & đang phát triển

Topic chỉ là nơi tập hợp nội dung liên quan.

Khi người dùng truy cập một Topic, hệ thống hiển thị giao diện giống trang Cộng đồng, bao gồm:

Các Widget đặc thù / Widget tùy chỉnh (Bởi admin)
Danh sách bài viết liên quan topic
Danh sách bài phân tích của chuyên gia liên quan topic
Sidebar

Topic ở giai đoạn này chưa có dữ liệu phân tích riêng.

## Topic trưởng thành (Story): Đã trưởng thành, Đang suy giảm

Khi Topic đạt trạng thái Đã trưởng thành trở đi, hệ thống tự động kích hoạt Trang phân tích Topic.

Khi đạt trạng thái Đã trưởng thành, Topic được hệ thống kích hoạt toàn bộ khả năng phân tích và hiển thị như một Market Entity, tương tự Cổ phiếu, Ngành và Hệ sinh thái.

Người dùng khi truy cập Topic sẽ thấy đầy đủ dữ liệu phân tích như:
- Sidebar: Các Widget Biểu đồ nến, biểu đồ thực...
**Do Topic không có giá giao dịch riêng, hệ thống xây dựng Chỉ số Topic (Topic Index) dựa trên nhóm cổ phiếu đại diện. data của các biểu đồ sẽ có thể tính được hoàn toàn dựa trên các cổ phiếu đại diện và hiển thị kết quả trên các Widget đã được quy định sẵn cả về cách hiển thị, vị trí, kích thước, quyền...**
- Bộ dữ liệu riêng: Tin tức | Thông tin | Thống kê | Bình luận
---

# Dữ liệu đầu vào

Đối với mỗi Topic, hệ thống thống kê các nhóm dữ liệu sau.

## 1. Chỉ số nội dung

Ví dụ:

* Tổng số bài viết
* Tổng số tác giả
* Tổng số cổ phiếu được gắn
* Tần suất xuất hiện của từng cổ phiếu

---

## 2. Chỉ số hành vi

Ví dụ:

* Lượt xem
* Lượt thích
* Bình luận
* Chia sẻ
* Lưu bài viết
* Theo dõi Topic

---

## 3. Chỉ số tìm kiếm

Ví dụ:

* Lượt tìm kiếm
* Tốc độ tăng trưởng lượt tìm kiếm

---

## 4. Chỉ số tăng trưởng

Ví dụ:

* Tăng trưởng số bài viết
* Tăng trưởng tương tác

---

## 5. Chỉ số cổ phiếu

Đối với từng Topic, hệ thống thống kê:

* Số lần từng mã cổ phiếu được nhắc đến
* Tỷ trọng của từng mã
* Xu hướng thay đổi theo thời gian

Đây là cơ sở để xác định các cổ phiếu đại diện cho Topic.

---

# Công thức tính Topic Score

## Định nghĩa

Topic Score là chỉ số tổng hợp phản ánh mức độ quan tâm và phát triển của một Topic tại thời điểm đánh giá.

Topic Score không phải là dữ liệu được lưu trữ cố định, mà được hệ thống tính toán lại theo từng chu kỳ đánh giá dựa trên toàn bộ dữ liệu Community.

## Topic Score được sử dụng để:

- Xếp hạng Topic trên toàn hệ thống.
- Xác định Trạng thái của Topic.
- Đề xuất Topic nổi bật.
- Đánh giá xu hướng phát triển của Topic

```text
Topic Score =
(Content Score × W1)
+
(Interaction Score × W2)
+
(Search Score × W3)
+
(Growth Score × W4)
```

Trong đó:

### Content Score: 
Đánh giá mức độ hình thành nội dung.

Ví dụ:

- Số lượng bài viết
- Số lượng tác giả

---

### Interaction Score

Đánh giá mức độ tương tác. Được tính từ các chỉ số tương tác như:

- View
- Like
- Comment
- Share
- Follow

---
 
### Search Score

Đánh giá nhu cầu thực tế của cộng đồng. Được tính từ các chỉ số như:

- Lượt tìm kiếm
- Tăng trưởng lượt tìm kiếm

---

### Growth Score

Đánh giá tốc độ phát triển của Topic. Được tính từ các chỉ số như:
- Tăng trưởng bài viết
- Tăng trưởng tương tác

---

Trọng số mặc định:

```text
Topic Score = X% Content + Y% Interaction + Z% Search + W% Growth
```
// Công thức tính cụ thể và giá trị từng trọng số sẽ được thiết lập bởi Admin trong Core 4 tầng Content Engine (Tương tự Core 4 tầng Market Engine)

---

# Xác định cổ phiếu đại diện

Ý này rất quan trọng. Nó làm rõ khái niệm **Leader Stock** của một Topic, thay vì chỉ có "danh sách cổ phiếu đại diện".

Mình sẽ viết lại cả mục này như sau:

---

# Xác định các cổ phiếu đại diện

Đối với từng Topic, hệ thống thống kê số lần xuất hiện của từng mã cổ phiếu trong tất cả các bài viết thuộc Topic đó.

Ví dụ:

| Mã   | Số lần được gắn | Tỷ trọng |
| ---- | --------------: | -------: |
| VCG  |           1.145 |      28% |
| HHV  |             965 |      24% |
| C4G  |             812 |      20% |
| LCG  |             650 |      16% |
| FCN  |             410 |      10% |
| Khác |             120 |       2% |

Sau khi tính tỷ trọng, hệ thống sắp xếp các mã theo **thứ tự giảm dần của tỷ trọng xuất hiện**.

Ví dụ:

| Thứ hạng | Mã  | Tỷ trọng | Tỷ trọng cộng dồn |
| -------: | --- | -------: | ----------------: |
|        1 | VCG |      28% |               28% |
|        2 | HHV |      24% |               52% |
|        3 | C4G |      20% |               72% |
|        4 | LCG |      16% |               88% |
|        5 | FCN |      10% |               98% |

Hệ thống sẽ lần lượt chọn các mã từ trên xuống cho đến khi **tổng tỷ trọng cộng dồn đạt tối thiểu 80%**.

Trong ví dụ trên, các cổ phiếu đại diện của Topic sẽ là:

1. VCG
2. HHV
3. C4G
4. LCG

---

## Cổ phiếu dẫn dắt (Leader)

Mã cổ phiếu có **tỷ trọng xuất hiện cao nhất** trong Topic được xác định là **Cổ phiếu dẫn dắt (Leader)** của Topic.

Trong ví dụ trên:

* **Leader:** VCG
* Các mã còn lại được xếp theo thứ tự ảnh hưởng giảm dần:

  1. VCG
  2. HHV
  3. C4G
  4. LCG

Danh sách này **không chỉ là tập hợp các mã đại diện**, mà còn phản ánh **mức độ liên quan của từng mã đối với Topic**.

---

## Nguyên tắc

* Không quy định trước số lượng cổ phiếu đại diện.
* Danh sách cổ phiếu đại diện được xác định dựa trên **tỷ trọng cộng dồn tối thiểu 80%**.
* Danh sách luôn được **sắp xếp theo thứ tự tỷ trọng giảm dần**.
* Mã đứng đầu danh sách luôn là **Cổ phiếu dẫn dắt (Leader)** của Topic.
* Khi dữ liệu Community thay đổi, thứ hạng và Leader có thể thay đổi theo.

---

Theo mình còn nên chuẩn hóa thêm thuật ngữ trong toàn bộ tài liệu:

* **Leader**: Cổ phiếu dẫn dắt Topic (hạng 1).
* **Representative Stocks**: Danh sách cổ phiếu đại diện của Topic (đạt ≥ 80% tỷ trọng cộng dồn).
* **Ranking**: Thứ hạng của từng cổ phiếu trong Topic.

Như vậy sau này sẽ rất dễ mở rộng các widget như:

* **Leader của Topic "Đầu tư công":** VCG.
* **Top cổ phiếu của Topic:** VCG → HHV → C4G → LCG.
* **Leader thay đổi theo thời gian:** khi HHV vượt VCG, hệ thống tự động đổi Leader mà không cần bất kỳ thao tác thủ công nào. Đây cũng là một tín hiệu rất có giá trị để phân tích sự dịch chuyển của dòng tiền và câu chuyện đầu tư.


Danh sách này luôn được cập nhật theo dữ liệu mới nhất.

---

# Cập nhật Trạng thái

Trạng thái của Topic không phải dữ liệu cố định.

Sau mỗi lần tính toán, hệ thống sẽ cập nhật lại:

* Topic Score
* Danh sách cổ phiếu đại diện
* Trạng thái hiện tại

Nếu Topic không còn đủ điều kiện duy trì trạng thái hiện tại, hệ thống sẽ tự động điều chỉnh theo vòng đời của Topic.

---

# Chế độ vận hành

Hệ thống hỗ trợ hai chế độ.

### Tự động

Hệ thống tự động cập nhật trạng thái của Topic ngay sau mỗi lần tính toán.

### Thủ công

Hệ thống chỉ đưa ra đề xuất thay đổi trạng thái.

Admin xem xét và phê duyệt trước khi áp dụng.

Chế độ này được khuyến nghị vì vẫn tận dụng được thuật toán nhưng giữ quyền kiểm soát cuối cùng cho đội ngũ vận hành.

---

# Trang admin > CỘNG ĐỒNG > Danh sách chủ đề (Tạo mới)

Admin quản lý danh sách Topic.

Danh sách hiển thị:

* Tên Topic
* Topic Score
* Trạng thái
* Tổng số bài viết
* Tổng lượt tìm kiếm
* Tổng lượt tương tác
* Tốc độ tăng trưởng
* Danh sách cổ phiếu đại diện
* Thời gian cập nhật gần nhất

---

# Sự thay đổi về cách gọi trên toàn hệ thống

Để thống nhất mô hình dữ liệu:

* **Topic** là duy nhất liên quan tới bài viết.
* Story chỉ được thêm mới khi xuất hiện **Topic đã trưởng thành**. Topic đó chính là 1 Story ở trạng thái Mới hình thành
* **Topic Score** là chỉ số đánh giá mức độ phát triển của Topic.
* **Topic Status** phản ánh giai đoạn hiện tại trong vòng đời của Topic.

Toàn bộ widget, thuật toán xếp hạng và các trang hiển thị đều sử dụng **Story** làm dữ liệu gốc. 

---