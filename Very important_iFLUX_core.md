---

## TẦNG I: DỮ LIỆU THÔ

Hệ thống Stock Symbols sẽ được quản lý danh sách bởi Admin. Admin có thể thêm/sửa/xóa một Symbols, sau đó hệ thống sẽ gửi yêu cầu đến DNSE để lấy dữ liệu.
Hệ thống sẽ kiểm tra toàn bộ các thông tin sau đây của các mã có trên thị trường (lấy từ API) hoặc trong hệ thống Stock Symbols của database ứng dụng (Ưu tiên API các mã trên thị trường nếu có):

- Lệnh mua chủ động
- Lệnh bán chủ động
- Khối lượng giao dịch từng tick
- Giá trị giao dịch từng tick
- Khối lượng giao dịch hiện tại
- Giá trị giao dịch hiện tại

## Logic lưu dữ liệu: Hệ thống lấy realtime liên tục và lưu lũy kế vào RAM tất cả các dữ liệu trên

CÁC ĐỐI TƯỢNG ĐƯỢC TÍNH VÀ LƯU TẦNG THÔ

a. TICK_Count: đếm số lần giao dịch (cứ mỗi 1 tick xuất hiện thì giá trị này lại cộng thêm 1). 
=> TICK_Count (n_ -1): tổng số lần giao dịch của CP cho đến kết phiên trước đó 
=> KLGD trung bình của 1 lệnh AVG_Vol = KLGD (n_ -1) / TICK_Count (n_ -1)  
=> Ngưỡng khối lượng (NKL) = m x AVG_Vol (m là thiết lập do admin nhập)   

Lưu ý: KLGD (n_ -1) chính là KLGD (n_) của phiên trước đó. 
Tức là AVG_Vol chỉ tính được khi có dữ liệu KLGD kết phiên trước đó.   
Nếu không có (n_-1)→ Không phân loại TM/FM

LOGIC LƯU RAM: mỗi khi 1 tick giao dịch xuất hiện, sẽ ngay lập tức được lọc qua "lưới" Ngưỡng khối lượng (NKL), nếu:

- Giao dịch đó có khối lượng cổ phiếu (TICK_Volume) >= Ngưỡng khối lượng (NKL) => Đây là lệnh lô lớn: TICK_Volume_TM
=> TICK_Volume_TM được cộng dồn vào KLGD_TM (r) trên RAM // Khối lượng giao dịch của lệnh lô lớn trên RAM
=> Giá trị giao dịch của TICK_Volume_TM đó được gọi là TICK_Value_TM
=> Nếu đây là lệnh mua: TICK_Value_TM được cộng dồn vào GTM_TM (r) trên RAM //bổ sung
=> Nếu đây là lệnh bán: TICK_Value_TM được cộng dồn vào GTB_TM (r) trên RAM //bổ sung
=> TICK_Value_TM được cộng dồn vào GTGD_TM (r) trên RAM // Giá trị giao dịch của lệnh lô lớn trên RAM
- Giao dịch đó có khối lượng cổ phiếu (TICK_Volume) < Ngưỡng khối lượng (NKL) => Đây là lệnh lô nhỏ: TICK_Volume_FM
=> TICK_Volume_FM được cộng dồn vào KLGD_FM (r) trên RAM // Khối lượng giao dịch của lệnh lô nhỏ trên RAM
=> Giá trị giao dịch của TICK_Volume_FM đó được gọi là TICK_Value_FM
=> Nếu đây là lệnh mua: TICK_Value_FM được cộng dồn vào GTM_FM (r) trên RAM //bổ sung
=> Nếu đây là lệnh bán: TICK_Value_FM được cộng dồn vào GTB_FM (r) trên RAM //bổ sung
=> TICK_Value_FM được cộng dồn vào GTGD_FM (r) trên RAM // Giá trị giao dịch của lệnh lô nhỏ trên RAM

b. TICK_Value_Total: Tính lũy kế giá trị giao dịch của tất cả các tick giao dịch xuất hiện của tất cả các cổ phiếu trên thị trường
LOGIC LƯU RAM: Mỗi khi 1 tick giao dịch xuất hiện, hệ thống sẽ cộng dồn dữ liệu đó vào TICK_Value_Total (r), 

---

## TẦNG II: DỮ LIỆU CHUẨN HÓA

LOGIC LƯU DATABASE: Hệ thống sẽ snapshot dữ liệu của tầng thô (từ RAM) về database ở tầng 2 sau thời gian của mỗi nhịp do Admin thiết lập theo nguyên tắc tròn số. 
Ví dụ: admin nhập 30 giây => cứ 30 giây 1 lần và các thời điểm thời gian là bội số của 30 giây (ví dụ: 9:15:00, 9:15:30, 9:16:00...), hệ thống sẽ lưu về database 1 lần để tính các dữ liệu chuẩn hóa sau đây:

RỔ UNIVERSE: Các cổ phiếu phải thỏa cùng lúc cả 2 điều kiện mới có trong rổ UNIVERSE:

- "u" cổ phiếu có KLGD (n_ - 1) cao nhất thị trường, "u" do admin nhập. Tức là số lượng "u" cổ phiếu có KLGD kết phiên trước đó cao nhất toàn thị trường.
- Cổ phiếu có GTGD (n_ - 1) tối thiểu "x" triệu VND. Tức là các cổ phiếu có GTGD kết phiên trước đó đạt ít nhất "x" triệu VND
=>  Admin sẽ nhập số lượng "u", và giá trị "x", rồi bấm nút Update Các cổ phiếu thỏa cả 2 điều kiện này sẽ được đưa vào áp dụng cho các tính toán dưới đây:

A. CÁC DỮ LIỆU ĐƯỢC LƯU DATABASE MÀ KHÔNG CẦN PHẢI LÀ CỔ PHIẾU TRONG RỔ UNIVERSE

- GTGD_Total (t) là Snapshot của TICK_Value_Total (r) khi lưu vào Database. Nghĩa là tổng lũy kế giá trị giao dịch của toàn thị trường cho đến hiện tại //bổ sung
- GTGD_Total (t_): GTGD_Total (t) tại thời điểm ngay sau cuối phiên (15:00) cho đến trước khi bắt đầu phiên tiếp theo
- GTGD_Total (n): GTGD_Total trung bình trong n phiên cùng thời điểm (trung bình cộng n phiên của GTGD_Total (t))

B. CÁC DỮ LIỆU ĐƯỢC LƯU DATABASE MÀ PHẢI LÀ CỔ PHIẾU TRONG RỔ UNIVERSE:

1. DỮ LIỆU THEO GIAO DỊCH

a. Giá trị mua chủ động (GTM) & giá trị bán chủ động (GTB)

- GTM_TM (t) là Snapshot của GTM_TM (r) khi lưu vào Database. Nghĩa là giá trị lũy kế của lệnh mua chủ động CỦA LỆNH LÔ LỚN cho đến hiện tại //bổ sung
- GTB_TM (t) là Snapshot của GTB_TM (r) khi lưu vào Database. Nghĩa là giá trị lũy kế của lệnh bán chủ động CỦA LỆNH LÔ LỚN cho đến hiện tại //bổ sung 
- GTM_FM (t) là Snapshot của GTM_FM (r) khi lưu vào Database. Nghĩa là giá trị lũy kế của lệnh mua chủ động CỦA LỆNH LÔ NHỎ cho đến hiện tại //bổ sung
- GTB_FM (t) là Snapshot của GTB_FM (r) khi lưu vào Database. Nghĩa là giá trị lũy kế của lệnh bán chủ động CỦA LỆNH LÔ NHỎ cho đến hiện tại //bổ sung
- GTM (t) = GTM_TM (t) + GTM_FM (t)
- GTB (t) = GTB_TM (t) + GTB_FM (t)
- GTB_N (t): Giá trị lũy kế của lệnh bán chủ động CỦA TẤT CẢ CÁC MÃ CÙNG NGÀNH CỘNG LẠI cho đến hiện tại //bổ sung
- GTM_N (t): Giá trị lũy kế của lệnh mua chủ động CỦA TẤT CẢ CÁC MÃ CÙNG NGÀNH CỘNG LẠI cho đến hiện tại //bổ sung
- GTB_HST (t): Giá trị lũy kế của lệnh bán chủ động CỦA TẤT CẢ CÁC MÃ CÙNG HỆ SINH THÁI CỘNG LẠI cho đến hiện tại //bổ sung
- GTM_HST (t): Giá trị lũy kế của lệnh mua chủ động CỦA TẤT CẢ CÁC MÃ CÙNG HỆ SINH THÁI CỘNG LẠI cho đến hiện tại //bổ sung

b. Khối lượng giao dịch (KLGD) và Giá trị giao dịch (GTGD)

- GTGD_TM (t) là Snapshot của GTGD_TM (r) khi lưu vào Database. Nghĩa là giá trị giao dịch của lệnh lô lớn CỦA LỆNH LÔ LỚN cho đến hiện tại
- KLGD_TM (t) là Snapshot của KLGD_TM (r) khi lưu vào Database. Nghĩa là khối lượng giao dịch của lệnh lô lớn CỦA LỆNH LÔ LỚN cho đến hiện tại
- GTGD_FM (t) là Snapshot của GTGD_FM (r) khi lưu vào Database. Nghĩa là giá trị giao dịch của lệnh lô nhỏ CỦA LỆNH LÔ NHỎ cho đến hiện tại
- KLGD_FM (t) là Snapshot của KLGD_FM (r) khi lưu vào Database. Nghĩa là khối lượng giao dịch của lệnh lô nhỏ CỦA LỆNH LÔ NHỎ cho đến hiện tại
Ghi chú: "TM" ý nói là thông minh, "FM" ý nói là FOMO

---

- KLGD (t) = KLGD_TM (t) + KLGD_FM (t). Nghĩa là Tổng khối lượng giao dịch của cổ phiếu hiện tại cho đến hiện tại
- GTGD (t) = GTGD_TM (t) + GTGD_FM (t). Nghĩa là Tổng giá trị giao dịch của cổ phiếu hiện tại cho đến hiện tại
- KLGD (t_): KLGD (t) tại thời điểm ngay sau cuối phiên (15:00) cho đến trước khi bắt đầu phiên tiếp theo
- GTGD (t_): GTGD (t) tại thời điểm ngay sau cuối phiên (15:00) cho đến trước khi bắt đầu phiên tiếp theo
- KLGD (ts): Tổng khối lượng giao dịch của cổ phiếu hiện tại lấy từ DNSE
- GTGD (ts): Tổng giá trị giao dịch của cổ phiếu hiện tại lấy từ DNSE
- KLGD (ts_): Tổng khối lượng giao dịch kết phiên (15:00 - tức là KLGD (ts) tại thời điểm cuối phiên được lấy từ DNSE)
- GTGD (ts_): Tổng giá trị giao dịch kết phiên (15:00 - ức là GTGD (ts) tại thời điểm cuối phiên được lấy từ DNSE)

Quy tắc đối chiếu: (Mục đích để gắn cờ trên dữ liệu chênh lệch)

- Nếu KLGD (t) = KLGD (ts) => Hệ thống lấy KLGD (t) 
- Nếu KLGD (t) ≠ KLGD (ts) => Hệ thống lấy KLGD (t) nhưng sẽ gắn cờ "s" trên bất kì kết quả nào sử dụng giá trị này để tính toán khi hiển thị
- Nếu GTGD (t) = GTGD (ts) => Hệ thống lấy GTGD (t)
- Nếu GTGD (t) ≠ GTGD (ts) => Hệ thống lấy GTGD (t) nhưng sẽ gắn cờ "s" trên bất kì kết quả nào sử dụng giá trị này để tính toán khi hiển thị
=> LƯU Ý QUAN TRỌNG: Hệ thống ưu tiên sử dụng dữ liệu tự chuẩn hóa. Nếu dữ liệu tự chuẩn hóa ở tầng này không có thì sẽ hiển thị lỗi

---

- KLGD_N (t): KLGD (t) của tất cả các mã cùng ngành cộng lại //bổ sung
- KLGD_HST (t): KLGD (t) của tất cả các mã cùng hệ sinh thái cộng lại //bổ sung
- GTGD_N (t): GTGD (t) của tất cả các mã cùng ngành cộng lại //bổ sung
- GTGD_HST (t): GTGD (t) của tất cả các mã cùng hệ sinh thái cộng lại //bổ sung
LƯU Ý: Một mã được gọi là cùng ngành khi có cùng 1 Danh mục ngành, được thêm bởi admin.
LƯU Ý: Một mã được gọi là cùng hệ sinh thái khi có cùng 1 Tag hệ sinh thái, được thêm bởi admin.

## c. Khối lượng giao dịch trung bình n phiên & Giá trị giao dịch trung bình n phiên

- KLGD (n): KLGD trung bình trong n phiên cùng thời điểm (trung bình cộng n phiên của KLGD (t))
- GTGD (n): GTGD trung bình trong n phiên cùng thời điểm (trung bình cộng n phiên của GTGD (t))
- KLGD (n_): KLGD cả phiên của trung bình của n phiên (trung bình cộng n phiên của KLGD (t_)) //bổ sung 
Lưu ý: Khi có dữ liệu này cũng là bắt đầu có thể tính được AVG_Vol
- GTGD (n_): GTGD cả phiên trung bình của n phiên (trung bình cộng n phiên của  GTGD (t_)) //bổ sung

---

- KLGD_TM (n): KLGD trung bình của lệnh lô lớn trong n phiên cùng thời điểm (trung bình cộng n phiên của KLGD_TM (t))
- GTGD_TM (n): GTGD trung bình của lệnh lô lớn trong n phiên cùng thời điểm (trung bình cộng n phiên của GTGD_TM (t))
- KLGD_TM (n_): Trung bình KLGD_TM kết phiên của n phiên (trung bình cộng n phiên của KLGD_TM (t_)) //bổ sung
- GTGD_TM (n_): Trung bình GTGD_TM kết phiên của n phiên (trung bình cộng n phiên của  GTGD_TM (t_)) //bổ sung

---

- KLGD_FM (n): KLGD trung bình của lệnh lô nhỏ trong n phiên cùng thời điểm (trung bình cộng n phiên của KLGD_FM (t))
- GTGD_FM (n): GTGD trung bình của lệnh lô nhỏ trong n phiên cùng thời điểm (trung bình cộng n phiên của GTGD_FM (t))
- KLGD_FM (n_): Trung bình KLGD_FM kết phiên của n phiên (trung bình cộng n phiên của KLGD_FM (t_)) //bổ sung
- GTGD_FM (n_): Trung bình GTGD_FM kết phiên của n phiên (trung bình cộng n phiên của  GTGD_FM (t_)) //bổ sung

---

- KLGD_N (n): KLGD trung bình của tất cả các mã cùng ngành trong n phiên cùng thời điểm (trung bình cộng n phiên của KLGD_N (t))
- GTGD_N (n): GTGD trung bình của tất cả các mã cùng ngành trong n phiên cùng thời điểm (trung bình cộng n phiên của GTGD_N (t))
- KLGD_N (n_): KLGD cả phiên của trung bình của n phiên (trung bình cộng n phiên của KLGD_N (t_)) //bổ sung
- GTGD_N (n_): GTGD cả phiên trung bình của n phiên (trung bình cộng n phiên của  GTGD_N (t_)) //bổ sung

---

- KLGD_HST (n): KLGD trung bình của tất cả các mã cùng hệ sinh thái trong n phiên cùng thời điểm (trung bình cộng n phiên của KLGD_HST (t))
- GTGD_HST (n): GTGD trung bình của tất cả các mã cùng hệ sinh thái trong n phiên cùng thời điểm (trung bình cộng n phiên của GTGD_HST (t))
- KLGD_HST (n_): KLGD cả phiên của trung bình của n phiên (trung bình cộng n phiên của KLGD_HST (t_)) //bổ sung
- GTGD_HST (n_): GTGD cả phiên trung bình của n phiên (trung bình cộng n phiên của  GTGD_HST (t_)) //bổ sung

Lưu ý: "n" và "n_" đều là giá trị tối đa do admin nhập, nếu hệ thống đang lưu ít hơn số "n" thì sẽ dựa theo số phiên đang có trong hệ thống để tính. Ví dụ "n" là 20, nhưng server mới bắt đầu lấy được dữ liệu 9 ngày => "n" = 9.

## d. Phiên hiện tại so với trung bình n phiên trước đó trong cùng thời điểm

- KLGD (t/n) = KLGD (t) / KLGD (n). Nghĩa là KLGD trong phiên hiện tại so với trung bình KLGD trong n phiên trước đó trong cùng thời điểm
- GTGD (t/n) = GTGD (t) / GTGD (n). Nghĩa là GTGD trong phiên hiện tại so với trung bình GTGD trong n phiên trước đó trong cùng thời điểm
- KLGD (t/n_) = KLGD (t_) / KLGD (n_). Nghĩa là KLGD kết phiên hiện tại so với trung bình KLGD kết phiên của n phiên trước đó 
- GTGD (t/n_) = GTGD (t_) / GTGD (n_). Nghĩa là GTGD kết phiên hiện tại so với trung bình GTGD kết phiên của n phiên trước đó
Lưu ý: Để tránh trường hợp KLGD (n) = 0, khi 1 cổ phiếu mới được bổ sung vào Universe, hệ thống sẽ đồng thời lưu từ DNSE dữ liệu (chỉ 1 lần) KLGD (ts_) vào KLGD (t_) của cổ phiếu. Như vậy KLGD (n) sẽ có giá trị > 0. Kể từ phiên tiếp theo, hệ thống tiếp tục sử dụng KLGD (t_) từ kết quả tự tính toán.

---

- KLGD_TM (t/n) = KLGD_TM (t) / KLGD_TM (n). Nghĩa là KLGD của lệnh lô lớn trong phiên hiện tại so với trung bình KLGD của lệnh lô lớn trong n phiên trước đó trong cùng thời điểm
- GTGD_TM (t/n) = GTGD_TM (t) / GTGD_TM (n). Nghĩa là GTGD của lệnh lô lớn trong phiên hiện tại so với trung bình GTGD của lệnh lô lớn trong n phiên trước đó trong cùng thời điểm
- KLGD_FM (t/n) = KLGD_FM (t) / KLGD_FM (n). Nghĩa là KLGD của lệnh lô nhỏ trong phiên hiện tại so với trung bình KLGD của lệnh lô nhỏ trong n phiên trước đó trong cùng thời điểm
- GTGD_FM (t/n) = GTGD_FM (t) / GTGD_FM (n). Nghĩa là GTGD của lệnh lô nhỏ trong phiên hiện tại so với trung bình GTGD của lệnh lô nhỏ trong n phiên trước đó trong cùng thời điểm

---

- KLGD_N (t/n) = KLGD_N (t) / KLGD_N (n). Nghĩa là Tổng KLGD của cả ngành trong phiên hiện tại so với trung bình KLGD của cả ngành trong n phiên trước đó trong cùng thời điểm 
- GTGD_N (t/n) = GTGD_N (t) / GTGD_N (n). Nghĩa là Tổng GTGD của cả ngành trong phiên hiện tại so với trung bình GTGD của cả ngành trong n phiên trước đó trong cùng thời điểm 
- KLGD_HST (t/n) = KLGD_HST (t) / KLGD_HST (n). Nghĩa là Tổng GTGD của cả hệ sinh thái trong phiên hiện tại so với trung bình GTGD của cả hệ sinh thái trong n phiên trước đó trong cùng thời điểm 
- GTGD_HST (t/n) = GTGD_HST (t) / GTGD_HST (n). Nghĩa là Tổng GTGD của cả hệ sinh thái trong phiên hiện tại so với trung bình GTGD của cả hệ sinh thái trong n phiên trước đó trong cùng thời điểm

---

## TẦNG III: CORE TÍNH CỦA HỆ THỐNG

1. CƯỜNG ĐỘ LỰC CẦU // Điều chỉnh: chuyển từ tầng 2 trước đó sang tầng 3

Mục tiêu của chỉ số Cường độ lực cầu là đo lường mức độ áp đảo giữa dòng tiền mua chủ động và dòng tiền bán chủ động theo dạng logarit tự nhiên, nhằm:Cường độ lực cầu hiện tại CDLC (t) và Cường độ lực cầu n phiên cùng thời điểm CDLC (n): Tính dựa trên tỉ trọng của lũy kế GTM so với GTB của cổ phiếu

- Tránh lỗi chia cho 0
- Đảm bảo tính đối xứng giữa trạng thái mua mạnh và bán mạnh
- Giảm méo mó khi giá trị giao dịch lớn

---

a. Cường độ lực cầu hiện tại
Công thức: 
  CDLC (t) = ln( (GTM (t) + e) / (GTB (t) + e) )
Trong đó:
  e = số rất nhỏ theo scale hệ tiền (Quy ước Epsilon), ví dụ
    Nếu đơn vị là tỷ → e = 0.001
    Nếu đơn vị là triệu → e = 1
Tương tự: 

- CDLC_TM (t) = ln( (GTM_TM (t) + e) / (GTB_TM (t) + e) )
- CDLC_FM (t) = ln( (GTM_FM (t) + e) / (GTB_FM (t) + e) )
- CDLC_N (t) = ln( (GTM_N (t) + e) / (GTB_N (t) + e) )
- CDLC_HST (t) = ln( (GTM_HST (t) + e) / (GTB_HST (t) + e) )

---

b. Cường độ lực cầu trung bình n phiên cùng thời điểm

- CDLC (n): Trung bình CDLC (t) trong n phiên cùng 1 thời điểm.
- CDLC (n_): Trung bình CDLC (t_) trong n phiên cùng 1 thời điểm.
- CDLC (t/n) Cường độ lực cầu hiện tại so với Cường độ lực cầu trung bình n phiên cùng thời điểm. CDLC (t/n) = CDLC (t) / CDLC (n)

---

- CDLC_TM (n): Trung bình CDLC_TM (t) trong n phiên cùng 1 thời điểm.
- CDLC_TM (n_): Trung bình CDLC_TM (t_) trong n phiên cùng 1 thời điểm.
- CDLC_TM (t/n) Cường độ lực cầu hiện tại so với Cường độ lực cầu trung bình n phiên cùng thời điểm. CDLC_TM (t/n) = CDLC_TM (t) / CDLC_TM (n)

---

- CDLC_FM (n): Trung bình CDLC_FM (t) trong n phiên cùng 1 thời điểm.
- CDLC_FM (n_): Trung bình CDLC_FM (t_) trong n phiên cùng 1 thời điểm.
- CDLC_FM (t/n) Cường độ lực cầu hiện tại so với Cường độ lực cầu trung bình n phiên cùng thời điểm. CDLC_FM (t/n) = CDLC_FM (t) / CDLC_FM (n)

---

- CDLC_N (n): Trung bình CDLC_N (t) trong n phiên cùng 1 thời điểm.
- CDLC_N (n_): Trung bình CDLC_N (t_) trong n phiên cùng 1 thời điểm.
- CDLC_N (t/n) Cường độ lực cầu hiện tại so với Cường độ lực cầu trung bình n phiên cùng thời điểm. CDLC_N (t/n) = CDLC_N (t) / CDLC_N (n)

---

- CDLC_HST (n): Trung bình CDLC_HST (t) trong n phiên cùng 1 thời điểm.
- CDLC_HST (n_): Trung bình CDLC_HST (t_) trong n phiên cùng 1 thời điểm.
- CDLC_HST (t/n) Cường độ lực cầu hiện tại so với Cường độ lực cầu trung bình n phiên cùng thời điểm. CDLC_HST (t/n) = CDLC_HST (t) / CDLC_HST (n)

---

Lưu ý: n là giá trị tối đa do admin nhập, nếu hệ thống đang lưu ít hơn số n thì sẽ lấy max của số phiên đang có trong hệ thống để tính CDLC (n).

1. HỆ SỐ DÒNG TIỀN (HSDT)
  Mục tiêu của Hệ số dòng tiền là đo lường xung lực thực sự bằng cách kết hợp kết quả:

- Cường độ dòng tiền vào của cổ phiếu (CDLC)
- Giá trị giao dịch của cổ phiếu (GTGD)
- Trong số tương ứng của 2 giá trị CDLC và GTGD (Ws và Ds) là 2 trọng số dùng chung để tính cho cả HSDT, HSDT_TM, HSDT_FM, HSDT_N, HSDT_HST. 
Do admin thiết lập, giá trị mặc định là 0.5 cho cả 2.

a. Hệ số dòng tiền tại thời điểm hiện tại: HSDT (t)

CÔNG THỨC: 

- HSDT (t) = CDLC (t/n) x Ws + GTGD (t/n) x Ds
- SCORE_POSITIVE (Để tính TOP CỔ PHIẾU CÓ DÒNG TIỀN VÀO MẠNH NHẤT): = (HSDT (t) - AVG_HSDT_Market (t)) / (MAX_HSDT_Market (t) - AVG_HSDT_Market (t)) * 100
Trong đó:
  - AVG_HSDT_Market (t): Giá trị trung bình của HSDT (t) cả thị trường
  - MAX_HSDT_Market (t): Giá trị lớn nhất của HSDT (t) cả thị trường
  Quy tắc tính SCORE_POSITIVE:
  => Chỉ áp dụng cho các mã có HSDT (t) >= AVG_HSDT_Market (t). 
  => Hệ thống sẽ lấy giá trị trung bình của HSDT (t) cả thị trường (AVG_HSDT_Market (t)) làm tham chiếu tối thiểu (0 điểm)
  => Mã có HSDT (t) lớn nhất thị trường (MAX_HSDT_Market (t)) làm tham chiếu tối đa (100 điểm). 
  => Các mã còn lại sẽ dựa vào tỉ lệ giữa hiệu số AVG_HSDT_Market (t) - HSDT (t) của chính nó và hiệu số giữa AVG_HSDT_Market (t) - MAX_HSDT_Market (t) để tính toán SCORE.
  Ví dụ: Mã có HSDT (t) = 2, AVG_HSDT_Market (t) = 1 và MAX_HSDT_Market (t) = 3 
  => HSDT (t) >= AVG_HSDT_Market (t) => tính SCORE_POSITIVE, không tính SCORE_NEGATIVE
  => Hiệu số giữa HSDT (t) - AVG_HSDT_Market (t) là 1
  => Hiệu số giữa MAX_HSDT_Market (t) - AVG_HSDT_Market (t) là 2
  => SCORE_POSITIVE = 1 / 2 * 100 = 50 điểm (Điểm càng cao thì dòng tiền vào càng mạnh)
- SCORE_NEGATIVE (Để tính TOP CỔ PHIẾU CÓ DÒNG TIỀN RA MẠNH NHẤT): = (AVG_HSDT_Market (t) - HSDT (t)) / (AVG_HSDT_Market (t) - MIN_HSDT_Market (t)) * 100
Trong đó:
  - AVG_HSDT_Market (t): Giá trị trung bình của HSDT (t) cả thị trường
  - MIN_HSDT_Market (t): Giá trị thấp nhất của HSDT (t) cả thị trường
  Quy tắc tính SCORE_NEGATIVE:
  => Chỉ áp dụng cho các mã có HSDT (t) < AVG_HSDT_Market (t). 
  => Hệ thống sẽ lấy giá trị trung bình của HSDT (t) cả thị trường (AVG_HSDT_Market (t)) làm tham chiếu tối thiểu (0 điểm)
  => Mã có HSDT (t) thấp nhất thị trường (MIN_HSDT_Market (t)) làm tham chiếu tối đa (100 điểm). 
  => Các mã còn lại sẽ dựa vào tỉ lệ giữa hiệu số AVG_HSDT_Market (t) - HSDT (t) của chính nó và hiệu số giữa AVG_HSDT_Market (t) - MIN_HSDT_Market (t) để tính toán SCORE.
  Ví dụ: Mã có HSDT (t) = 0.75, AVG_HSDT_Market (t) = 1 và MIN_HSDT_Market (t) = 0.5 
  => HSDT (t) < AVG_HSDT_Market (t) => tính SCORE_NEGATIVE, không tính SCORE_POSITIVE
  => Hiệu số giữa AVG_HSDT_Market (t) - HSDT (t) của chính nó là 0.25
  => Hiệu số giữa AVG_HSDT_Market (t) - MIN_HSDT_Market (t) là 0.5
  => SCORE_NEGATIVE = 0.25 / 0.5 * 100 = 50 điểm (Điểm càng cao thì dòng tiền ra càng mạnh)

b. Hệ số dòng tiền thông minh thời điểm hiện tại: HSDT_TM (t)

CÔNG THỨC: 

- HSDT_TM (t) = CDLC_TM (t/n) x Ws + GTGD_TM (t/n) x Ds
- SCORE_TM_POSITIVE (Để tính TOP CỔ PHIẾU CÓ DÒNG TIỀN THÔNG MINH VÀO MẠNH NHẤT): = (HSDT_TM (t) - AVG_HSDT_Market_TM (t)) / (MAX_HSDT_Market_TM (t) - AVG_HSDT_Market_TM (t)) * 100
Trong đó:
  - AVG_HSDT_Market_TM (t): Giá trị trung bình của HSDT_TM (t) cả thị trường
  - MAX_HSDT_Market_TM (t): Giá trị lớn nhất của HSDT_TM (t) cả thị trường
  Quy tắc tính SCORE_TM_POSITIVE:
  => Chỉ áp dụng cho các mã có HSDT_TM (t) >= AVG_HSDT_Market_TM (t). 
  => Hệ thống sẽ lấy giá trị trung bình của HSDT_TM (t) cả thị trường (AVG_HSDT_Market_TM (t)) làm tham chiếu tối thiểu (0 điểm)
  => Mã có HSDT_TM (t) lớn nhất thị trường (MAX_HSDT_Market_TM (t)) làm tham chiếu tối đa (100 điểm). 
  => Các mã còn lại sẽ dựa vào tỉ lệ giữa hiệu số AVG_HSDT_Market_TM (t) - HSDT_TM (t) của chính nó và hiệu số giữa AVG_HSDT_Market_TM (t) - MAX_HSDT_Market_TM (t) để tính toán SCORE.
  Ví dụ: Mã có HSDT_TM (t) = 2, AVG_HSDT_Market_TM (t) = 1 và MAX_HSDT_Market_TM (t) = 3 
  => HSDT_TM (t) >= AVG_HSDT_Market_TM (t) => tính SCORE_TM_POSITIVE, không tính SCORE_TM_NEGATIVE
  => Hiệu số giữa HSDT_TM (t) - AVG_HSDT_Market_TM (t) là 1
  => Hiệu số giữa MAX_HSDT_Market_TM (t) - AVG_HSDT_Market_TM (t) là 2
  => SCORE_TM_POSITIVE = 1 / 2 * 100 = 50 điểm (Điểm càng cao thì dòng tiền vào càng mạnh)
- SCORE_TM_NEGATIVE (Để tính TOP CỔ PHIẾU CÓ DÒNG TIỀN THÔNG MINH RA MẠNH NHẤT): = (AVG_HSDT_Market_TM (t) - HSDT_TM (t)) / (AVG_HSDT_Market_TM (t) - MIN_HSDT_Market_TM (t)) * 100
Trong đó:
  - AVG_HSDT_Market_TM (t): Giá trị trung bình của HSDT_TM (t) cả thị trường
  - MIN_HSDT_Market_TM (t): Giá trị thấp nhất của HSDT_TM (t) cả thị trường
  Quy tắc tính SCORE_TM_NEGATIVE:
  => Chỉ áp dụng cho các mã có HSDT_TM (t) < AVG_HSDT_Market_TM (t). 
  => Hệ thống sẽ lấy giá trị trung bình của HSDT_TM (t) cả thị trường (AVG_HSDT_Market_TM (t)) làm tham chiếu tối thiểu (0 điểm)
  => Mã có HSDT_TM (t) thấp nhất thị trường (MIN_HSDT_Market_TM (t)) làm tham chiếu tối đa (100 điểm). 
  => Các mã còn lại sẽ dựa vào tỉ lệ giữa hiệu số AVG_HSDT_Market_TM (t) - HSDT_TM (t) của chính nó và hiệu số giữa AVG_HSDT_Market_TM (t) - MIN_HSDT_Market_TM (t) để tính toán SCORE.
  Ví dụ: Mã có HSDT_TM (t) = 0.75, AVG_HSDT_Market_TM (t) = 1 và MIN_HSDT_Market_TM (t) = 0.5 
  => HSDT_TM (t) < AVG_HSDT_Market_TM (t) => tính SCORE_TM_NEGATIVE, không tính SCORE_TM_POSITIVE
  => Hiệu số giữa AVG_HSDT_Market_TM (t) - HSDT_TM (t) của chính nó là 0.25
  => Hiệu số giữa AVG_HSDT_Market_TM (t) - MIN_HSDT_Market_TM (t) là 0.5
  => SCORE_TM_NEGATIVE = 0.25 / 0.5 * 100 = 50 điểm (Điểm càng cao thì dòng tiền ra càng mạnh)

c. Hệ số dòng tiền FOMO thời điểm hiện tại: HSDT_FM (t)

CÔNG THỨC: 

- HSDT_FM (t) = CDLC_FM (t/n) x Ws + GTGD_FM (t/n) x Ds
- SCORE_FM_POSITIVE (Để tính TOP CỔ PHIẾU CÓ DÒNG TIỀN FOMO VÀO MẠNH NHẤT): = (HSDT_FM (t) - AVG_HSDT_Market_FM (t)) / (MAX_HSDT_Market_FM (t) - AVG_HSDT_Market_FM (t)) * 100
Trong đó:
  - AVG_HSDT_Market_FM (t): Giá trị trung bình của HSDT_FM (t) cả thị trường
  - MAX_HSDT_Market_FM (t): Giá trị lớn nhất của HSDT_FM (t) cả thị trường
  Quy tắc tính SCORE_FM_POSITIVE:
  => Chỉ áp dụng cho các mã có HSDT_FM (t) >= AVG_HSDT_Market_FM (t). 
  => Hệ thống sẽ lấy giá trị trung bình của HSDT_FM (t) cả thị trường (AVG_HSDT_Market_FM (t)) làm tham chiếu tối thiểu (0 điểm)
  => Mã có HSDT_FM (t) lớn nhất thị trường (MAX_HSDT_Market_FM (t)) làm tham chiếu tối đa (100 điểm). 
  => Các mã còn lại sẽ dựa vào tỉ lệ giữa hiệu số AVG_HSDT_Market_FM (t) - HSDT_FM (t) của chính nó và hiệu số giữa AVG_HSDT_Market_FM (t) - MAX_HSDT_Market_FM (t) để tính toán SCORE.
  Ví dụ: Mã có HSDT_FM (t) = 2, AVG_HSDT_Market_FM (t) = 1 và MAX_HSDT_Market_FM (t) = 3 
  => HSDT_FM (t) >= AVG_HSDT_Market_FM (t) => tính SCORE_FM_POSITIVE, không tính SCORE_FM_NEGATIVE
  => Hiệu số giữa HSDT_FM (t) - AVG_HSDT_Market_FM (t) là 1
  => Hiệu số giữa MAX_HSDT_Market_FM (t) - AVG_HSDT_Market_FM (t) là 2
  => SCORE_FM_POSITIVE = 1 / 2 * 100 = 50 điểm (Điểm càng cao thì dòng tiền vào càng mạnh)
- SCORE_FM_NEGATIVE (Để tính TOP CỔ PHIẾU CÓ DÒNG TIỀN FOMO RA MẠNH NHẤT): = (AVG_HSDT_Market_FM (t) - HSDT_FM (t)) / (AVG_HSDT_Market_FM (t) - MIN_HSDT_Market
Trong đó:
  - AVG_HSDT_Market_FM (t): Giá trị trung bình của HSDT_FM (t) cả thị trường
  - MIN_HSDT_Market_FM (t): Giá trị thấp nhất của HSDT_FM (t) cả thị trường
  Quy tắc tính SCORE_FM_NEGATIVE:
  => Chỉ áp dụng cho các mã có HSDT_FM (t) < AVG_HSDT_Market_FM (t). 
  => Hệ thống sẽ lấy giá trị trung bình của HSDT_FM (t) cả thị trường (AVG_HSDT_Market_FM (t)) làm tham chiếu tối thiểu (0 điểm)
  => Mã có HSDT_FM (t) thấp nhất thị trường (MIN_HSDT_Market_FM (t)) làm tham chiếu tối đa (100 điểm). 
  => Các mã còn lại sẽ dựa vào tỉ lệ giữa hiệu số AVG_HSDT_Market_FM (t) - HSDT_FM (t) của chính nó và hiệu số giữa AVG_HSDT_Market_FM (t) - MIN_HSDT_Market_FM (t) để tính toán SCORE.
  Ví dụ: Mã có HSDT_FM (t) = 0.75, AVG_HSDT_Market_FM (t) = 1 và MIN_HSDT_Market_FM (t) = 0.5 
  => HSDT_FM (t) < AVG_HSDT_Market_FM (t) => tính SCORE_FM_NEGATIVE, không tính SCORE_FM_POSITIVE
  => Hiệu số giữa AVG_HSDT_Market_FM (t) - HSDT_FM (t) của chính nó là 0.25
  => Hiệu số giữa AVG_HSDT_Market_FM (t) - MIN_HSDT_Market_FM (t) là 0.5
  => SCORE_FM_NEGATIVE = 0.25 / 0.5 * 100 = 50 điểm (Điểm càng cao thì dòng tiền ra càng mạnh)

d. Hệ số dòng tiền ngành thời điểm hiện tại: HSDT_N (t)

CÔNG THỨC: 

- HSDT_N (t) = CDLC_N (t/n) x Ws + GTGD_N (t/n) x Ds
- SCORE_N_POSITIVE (Để tính TOP NGÀNH có DÒNG TIỀN VÀO MẠNH NHẤT): = (HSDT_N (t) - AVG_HSDT_Market_N (t)) / (MAX_HSDT_Market_N (t) - AVG_HSDT_Market_N (t)) * 100
Trong đó:
  - AVG_HSDT_Market_N (t): Giá trị trung bình của HSDT_N (t) cả thị trường
  - MAX_HSDT_Market_N (t): Giá trị lớn nhất của HSDT_N (t) cả thị trường
  Quy tắc tính SCORE_N_POSITIVE:
  => Chỉ áp dụng cho các mã có HSDT_N (t) >= AVG_HSDT_Market_N (t). 
  => Hệ thống sẽ lấy giá trị trung bình của HSDT_N (t) cả thị trường (AVG_HSDT_Market_N (t)) làm tham chiếu tối thiểu (0 điểm)
  => Mã có HSDT_N (t) lớn nhất thị trường (MAX_HSDT_Market_N (t)) làm tham chiếu tối đa (100 điểm). 
  => Các mã còn lại sẽ dựa vào tỉ lệ giữa hiệu số AVG_HSDT_Market_N (t) - HSDT_N (t) của chính nó và hiệu số giữa AVG_HSDT_Market_N (t) - MAX_HSDT_Market_N (t) để tính toán SCORE.
  Ví dụ: Mã có HSDT_N (t) = 2, AVG_HSDT_Market_N (t) = 1 và MAX_HSDT_Market_N (t) = 3 
  => HSDT_N (t) >= AVG_HSDT_Market_N (t) => tính SCORE_N_POSITIVE, không tính SCORE_N_NEGATIVE
  => Hiệu số giữa HSDT_N (t) - AVG_HSDT_Market_N (t) là 1
  => Hiệu số giữa MAX_HSDT_Market_N (t) - AVG_HSDT_Market_N (t) là 2
  => SCORE_N_POSITIVE = 1 / 2 * 100 = 50 điểm (Điểm càng cao thì dòng tiền vào càng mạnh)
- SCORE_N_NEGATIVE (Để tính TOP NGÀNH có DÒNG TIỀN RA MẠNH NHẤT): = (AVG_HSDT_Market_N (t) - HSDT_N (t)) / (AVG_HSDT_Market_N (t) - MIN_HSDT_Market_N (t)) * 100
Trong đó:
  - AVG_HSDT_Market_N (t): Giá trị trung bình của HSDT_N (t) cả thị trường
  - MIN_HSDT_Market_N (t): Giá trị thấp nhất của HSDT_N (t) cả thị trường
  Quy tắc tính SCORE_N_NEGATIVE:
  => Chỉ áp dụng cho các mã có HSDT_N (t) < AVG_HSDT_Market_N (t). 
  => Hệ thống sẽ lấy giá trị trung bình của HSDT_N (t) cả thị trường (AVG_HSDT_Market_N (t)) làm tham chiếu tối thiểu (0 điểm)
  => Mã có HSDT_N (t) thấp nhất thị trường (MIN_HSDT_Market_N (t)) làm tham chiếu tối đa (100 điểm). 
  => Các mã còn lại sẽ dựa vào tỉ lệ giữa hiệu số AVG_HSDT_Market_N (t) - HSDT_N (t) của chính nó và hiệu số giữa AVG_HSDT_Market_N (t) - MIN_HSDT_Market_N (t) để tính toán SCORE.
  Ví dụ: Mã có HSDT_N (t) = 0.75, AVG_HSDT_Market_N (t) = 1 và MIN_HSDT_Market_N (t) = 0.5 
  => HSDT_N (t) < AVG_HSDT_Market_N (t) => tính SCORE_N_NEGATIVE, không tính SCORE_N_POSITIVE
  => Hiệu số giữa AVG_HSDT_Market_N (t) - HSDT_N (t) của chính nó là 0.25
  => Hiệu số giữa AVG_HSDT_Market_N (t) - MIN_HSDT_Market_N (t) là 0.5
  => SCORE_N_NEGATIVE = 0.25 / 0.5 * 100 = 50 điểm (Điểm càng cao thì dòng tiền ra càng mạnh)

e. Hệ số dòng tiền Hệ sinh thái thời điểm hiện tại: HSDT_HST (t)

CÔNG THỨC: 

- HSDT_HST (t) = CDLC_HST (t/n) x Ws + GTGD_HST (t/n) x Ds
- SCORE_HST_POSITIVE (Để tính TOP HỆ SINH THÁI có DÒNG TIỀN VÀO MẠNH NHẤT): = (HSDT_HST (t) - AVG_HSDT_Market_HST (t)) / (MAX_HSDT_Market_HST (t) - AVG_HSDT_Market_HST (t)) * 100
Trong đó:
  - AVG_HSDT_Market_HST (t): Giá trị trung bình của HSDT_HST (t) cả thị trường
  - MAX_HSDT_Market_HST (t): Giá trị lớn nhất của HSDT_HST (t) cả thị trường
  Quy tắc tính SCORE_HST_POSITIVE:
  => Chỉ áp dụng cho các mã có HSDT_HST (t) >= AVG_HSDT_Market_HST (t). 
  => Hệ thống sẽ lấy giá trị trung bình của HSDT_HST (t) cả thị trường (AVG_HSDT_Market_HST (t)) làm tham chiếu tối thiểu (0 điểm)
  => Mã có HSDT_HST (t) lớn nhất thị trường (MAX_HSDT_Market_HST (t)) làm tham chiếu tối đa (100 điểm). 
  => Các mã còn lại sẽ dựa vào tỉ lệ giữa hiệu số AVG_HSDT_Market_HST (t) - HSDT_HST (t) của chính nó và hiệu số giữa AVG_HSDT_Market_HST (t) - MAX_HSDT_Market_HST (t) để tính toán SCORE.
  Ví dụ: Mã có HSDT_HST (t) = 2, AVG_HSDT_Market_HST (t) = 1 và MAX_HSDT_Market_HST (t) = 3 
  => HSDT_HST (t) >= AVG_HSDT_Market_HST (t) => tính SCORE_HST_POSITIVE, không tính SCORE_HST_NEGATIVE
  => Hiệu số giữa HSDT_HST (t) - AVG_HSDT_Market_HST (t) là 1
  => Hiệu số giữa MAX_HSDT_Market_HST (t) - AVG_HSDT_Market_HST (t) là 2
  => SCORE_HST_POSITIVE = 1 / 2 * 100 =
- SCORE_HST_NEGATIVE (Để tính TOP HỆ SINH THÁI có DÒNG TIỀN RA MẠNH NHẤT): = (AVG_HSDT_Market_HST (t) - HSDT_HST (t)) / (AVG_HSDT_Market_HST (t) - MIN_HSDT_Market_HST (t)) * 100
Trong đó:
  - AVG_HSDT_Market_HST (t): Giá trị trung bình của HSDT_HST (t) cả thị trường
  - MIN_HSDT_Market_HST (t): Giá trị thấp nhất của HSDT_HST (t) cả thị trường
  Quy tắc tính SCORE_HST_NEGATIVE:
  => Chỉ áp dụng cho các mã có HSDT_HST (t) < AVG_HSDT_Market_HST (t). 
  => Hệ thống sẽ lấy giá trị trung bình của HSDT_HST (t) cả thị trường (AVG_HSDT_Market_HST (t)) làm tham chiếu tối thiểu (0 điểm)
  => Mã có HSDT_HST (t) thấp nhất thị trường (MIN_HSDT_Market_HST (t)) làm tham chiếu tối đa (100 điểm). 
  => Các mã còn lại sẽ dựa vào tỉ lê̇ giữa hiệu số AVG_HSDT_Market_HST (t) - HSDT_HST (t) của chính nó và hiệu số giữa AVG_HSDT_Market_HST (t) - MIN_HSDT_Market_HST (t) để tính toán SCORE.
  Ví dụ: Mã có HSDT_HST (t) = 0.75, AVG_HSDT_Market_HST (t) = 1 và MIN_HSDT_Market_HST (t) = 0.5 
  => HSDT_HST (t) < AVG_HSDT_Market_HST (t) => tính SCORE_HST_NEGATIVE, không tính SCORE_HST_POSITIVE
  => Hiệu số giữa AVG_HSDT_Market_HST (t) - HSDT_HST (t) của chính nó là 0.25
  => Hiệu số giữa AVG_HSDT_Market_HST (t) - MIN_HSDT_Market_HST (t) là 0.5
  => SCORE_HST_NEGATIVE = 0.25 / 0.5 * 100 = 50 điểm (Điểm càng cao thì dòng tiền ra càng mạnh)

---

## TẦNG IV: XUẤT KẾT QUẢ LÊN NỀN TẢNG

A. TỔNG QUAN THỊ TRƯỜNG

1. VNINDEX HÔM NAY (4 SÀN LỚN: HSX, HNX, UPCOM)

- Điểm tăng/giảm (ts): Điểm tăng/giảm của VNINDEX hiện tại so với điểm tăng/giảm của VNINDEX ngày hôm trước được lấy từ DNSE
- % tăng/giảm (ts): % tăng/giảm của VNINDEX hiện tại so với % tăng/giảm của VNINDEX ngày hôm trước được lấy từ DNSE
- KLGD (ts): Tổng khối lượng giao dịch hiện tại của thị trường được lấy từ DNSE
- GTGD (ts): Tổng giá trị giao dịch hiện tại của thị trường được lấy từ DNSE

1. BIỂU ĐỒ THANH KHOẢN VN-INDEX

Biểu diễn dạng biểu đồ 2 đường:

- 1 đường kẻ Quá khứ thể hiện giá trị giao dịch trung bình n phiên của cả thị trường GTGD_Total (n). 
=> n là selection tùy chọn của user. 
=> Có 4 selection: Hôm qua, 5 phiên, 15 phiên, 30 phiên. Nếu user không chọn thì mặc định là Hôm qua (Có nghĩa là GTGD_Total (t) so với GTGD_Total (t-1)).
- 1 đường kẻ Hiện tại: thể hiện tổng giá trị giao dịch trong thời điểm hiện tại của cả thị trường GTGD_Total (t) sau mỗi nhịp update.
=> Sau mỗi nhịp update, dữ liệu GTGD_Total (t) mới nhất sẽ được biểu diễn lên biểu đồ.

B. IFLUX - TÍN HIỆU ĐỘC QUYỀN

 1a. TOP 10 CỔ PHIẾU CÓ DÒNG TIỀN THÔNG MINH VÀO MẠNH NHẤT

Sắp xếp Top 10 cổ phiếu có SCORE_TM_POSITIVE cao nhất thị trường dưới dạng vòng tròn đồng tâm là 0% và 100 điểm là 100%.

- Thanh Score: có 
- Tín hiệu rủi ro: Hiển thị SCORE_FM_POSITIVE của các cổ phiếu này dưới dạng cây năng lượng
- Khuyến nghị: Điểm mua/Nắm giữ/Bán dựa trên kết quả tính toán kết hợp giữa tất cả các tiêu chí chủ động (Dòng tiền thông minh, dòng tiền ngành, dòng tiền hệ sinh thái, dòng tiền FOMO rủi ro, Vị thế hiện tại của tổ chức đang nắm giữ trên cổ phiếu...)

1b. TOP 10 CỔ PHIẾU CÓ DÒNG TIỀN THÔNG MINH RA MẠNH NHẤT

Sắp xếp Top 10 cổ phiếu có SCORE_TM_NEGATIVE cao nhất thị trường dưới dạng vòng tròn đồng tâm là 0% và 100 điểm là 100%.

- Thanh Score: có 
- Tín hiệu rủi ro: không
- Khuyến nghị: không

## C. IFLUX - THỐNG KÊ

1a. TOP 10 CỔ PHIẾU CÓ DÒNG TIỀN VÀO MẠNH NHẤT 

Sắp xếp Top 10 cổ phiếu có SCORE_POSITIVE cao nhất thị trường dưới dạng vòng tròn đồng tâm với 0 điểm là 0% và 100 điểm là 100%.

- Thanh Score: có 
- Tín hiệu rủi ro: không
- Khuyến nghị: không

---

1b. TOP 10 CỔ PHIẾU CÓ DÒNG TIỀN RA MẠNH NHẤT 

Sắp xếp Top 10 cổ phiếu có SCORE_NEGATIVE cao nhất thị trường dưới dạng vòng tròn đồng tâm với 0 điểm là 0% và 100 điểm là 100%.

- Thanh Score: có 
- Tín hiệu rủi ro: không
- Khuyến nghị: không

---

2a. TOP 10 NGÀNH CÓ DÒNG TIỀN VÀO MẠNH NHẤT

Sắp xếp Top 10 ngành có SCORE_N_POSITIVE cao nhất thị trường dưới dạng vòng tròn đồng tâm với 0 điểmlà 0% và 100 điểm là 100%.

- Thanh Score: có 
- Tín hiệu rủi ro: không
- Khuyến nghị: không 

---

2b. TOP 10 NGÀNH CÓ DÒNG TIỀN RA MẠNH NHẤT

Sắp xếp Top 10 cổ phiếu có SCORE_N_NEGATIVE cao nhất thị trường dưới dạng vòng tròn đồng tâm với 0 điểmlà 0% và 100 điểm là 100%.

- Thanh Score: có 
- Tín hiệu rủi ro: không
- Khuyến nghị: không

3a. TOP 10 HỆ SINH THÁI CÓ DÒNG TIỀN VÀO MẠNH NHẤT 

Sắp xếp Top 10 Hệ sinh thái có SCORE_HST_POSITIVE cao nhất thị trường dưới dạng vòng tròn đồng tâm với 0 điểm là 0% và 100 điểm là 100%.

- Thanh Score: có 
- Tín hiệu rủi ro: không
- Khuyến nghị: không

---

3b. TOP 10 HỆ SINH THÁI CÓ DÒNG TIỀN RA MẠNH NHẤT 

Sắp xếp Top 10 cổ phiếu có SCORE_HST_NEGATIVE cao nhất thị trường dưới dạng vòng đồng tâm tròn với 0 điểm là 0% và 100 điểm là 100%.

- Thanh Score: có 
- Tín hiệu rủi ro: không
- Khuyến nghị: không
  ---

4a. TOP 10 CÂU CHUYỆN CÓ DÒNG TIỀN VÀO MẠNH NHẤT 

Sắp xếp Top 10 Hệ sinh thái có SCORE_ST_POSITIVE cao nhất thị trường dưới dạng vòng đồng tâm tròn với 0 điểm là 0% và 100 điểm là 100%.

- Thanh Score: có 
- Tín hiệu rủi ro: không
- Khuyến nghị: không

---

4b. TOP 10 CÂU CHUYỆN CÓ DÒNG TIỀN RA MẠNH NHẤT 

Sắp xếp Top 10 cổ phiếu có SCORE_ST_NEGATIVE cao nhất thị trường dưới dạng vòng tròn đồng tâm với 0 điểm là 0% và 100 điểm là 100%.

- Thanh Score: có 
- Tín hiệu rủi ro: không
- Khuyến nghị: không

