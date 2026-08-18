# 05 — Kế hoạch Thực thi (Execution Plan) & Tiêu chí Nghiệm thu

**Mã Task**: `270731_Google_Login_Button_Render_Optimization`  
**Ngày lập**: 31/07/2026  
**Trạng thái**: Chờ duyệt Kế hoạch (Awaiting Owner Approval)  

---

## Các Phase Thực thi (Phased Plan)

### 📍 Phase 1: Cập nhật HTML Mặc định & Kiểu dáng CSS (0ms Render)
* **Mục tiêu**: Làm cho nút Google có sẵn Icon chữ G hiển thị ngay từ khung hình đầu tiên (0ms).
* **Công việc thực hiện**:
  1. Thêm thẻ icon `<i class="ti ti-brand-google-filled"></i>` vào nút `#ifx-google-signin-btn` trong 2 file [login.html](file:///Users/mac/Documents/Productions/iFLUX_P1/User_Web/auth/login.html) và [register.html](file:///Users/mac/Documents/Productions/iFLUX_P1/User_Web/auth/register.html).
  2. Căn chỉnh CSS trong [components.css](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/iflux-admin-ui/components.css) để icon hiển thị sắc nét, chuẩn kích thước và màu sắc.
* **Điều kiện chấp nhận (Acceptance Criteria)**:
  * Khi mở trang Đăng nhập hoặc Đăng ký, icon Google hiển thị tức thì cùng lúc với các nút Apple, Facebook. Không còn ô tròn rỗng.

---

### 📍 Phase 2: Tối ưu Xử lý Sự kiện & Nạp ngầm SDK trong JS
* **Mục tiêu**: Đảm bảo sự mượt mà khi nạp SDK Google và xử lý trường hợp người dùng bấm nút cực nhanh.
* **Công việc thực hiện**:
  1. Cập nhật [auth-social.js](file:///Users/mac/Documents/Productions/iFLUX_P1/User_Web/iflux-web-ui/auth-social.js) để hỗ trợ bắt sự kiện bấm nút tức thì (Fast-click Handler).
  2. Tối ưu hàm `renderVisibleGoogleButton()` để chuyển đổi mượt mà từ Icon HTML sang SDK Google mà không bị giật trang.
* **Điều kiện chấp nhận (Acceptance Criteria)**:
  * Bấm nút Google ở bất kỳ thời điểm nào (ngay khi mở trang hoặc sau khi trang nạp xong) đều kích hoạt luồng Đăng nhập Google thành công.

---

### 📍 Phase 3: Audit Kỹ thuật & Tự Kiểm thử (Developer Audit & Testing)
* **Mục tiêu**: Kiểm tra độ ổn định, hiệu năng và đảm bảo không có lỗi phát sinh.
* **Công việc thực hiện**:
  1. Chạy thử nghiệm kiểm thử hiển thị (Browser visual test) qua việc tải lại trang nhiều lần (Hard Refresh / Cache Clear).
  2. Kiểm tra Console xem có bất kỳ cảnh báo hoặc lỗi đỏ nào không.
* **Điều kiện chấp nhận (Acceptance Criteria)**:
  * Console hoàn toàn sạch sẽ (0 Error).
  * Tốc độ hiển thị icon đạt 0ms.

---

### 📍 Phase 4: Nghiệm thu cùng Chủ dự án (Owner Co-Testing & Verification)
* **Mục tiêu**: Phối hợp cùng Owner (Bạn) kiểm tra thực tế trên giao diện.
* **Công việc thực hiện**:
  1. Báo cáo kết quả công việc đã hoàn thành bằng ngôn ngữ trực quan, dễ hiểu.
  2. Hướng dẫn Owner test lại trên trình duyệt.
  3. Nhận xác nhận **PASS** từ Owner để chính thức khép lại Task.

---

## Bảng Tổng hợp File Sửa đổi (Files to Modify)

| Loại thay đổi | Tệp tin (File Path) | Diễn giải bằng ngôn ngữ bình dân |
| :--- | :--- | :--- |
| **Chỉnh sửa** | [User_Web/auth/login.html](file:///Users/mac/Documents/Productions/iFLUX_P1/User_Web/auth/login.html) | Chèn sẵn icon Google chữ G vào giao diện HTML trang Đăng nhập |
| **Chỉnh sửa** | [User_Web/auth/register.html](file:///Users/mac/Documents/Productions/iFLUX_P1/User_Web/auth/register.html) | Chèn sẵn icon Google chữ G vào giao diện HTML trang Đăng ký |
| **Chỉnh sửa** | [Admin_Design_system/iflux-admin-ui/components.css](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/iflux-admin-ui/components.css) | Canh lề và định dạng icon Google nằm chính giữa hình tròn |
| **Chỉnh sửa** | [User_Web/iflux-web-ui/auth-social.js](file:///Users/mac/Documents/Productions/iFLUX_P1/User_Web/iflux-web-ui/auth-social.js) | Tối ưu luồng nạp SDK ngầm và xử lý sự kiện bấm nút nhanh |
