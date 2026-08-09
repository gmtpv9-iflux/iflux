# Task: Tối ưu Tốc độ Hiển thị (Render) Nút Google Login

**Mã Task**: `270731_Google_Login_Button_Render_Optimization`  
**Ngày khởi tạo**: 31/07/2026  
**Trạng thái**: Đang Audit & Lập Kế Hoạch (Phase 0: Planning)  
**Người thực hiện (Developer & Engineer)**: Antigravity  
**Người duyệt (Reviewer)**: ChatGPT  
**Chủ dự án (Owner)**: User  

---

## 1. Mô tả Bài toán & Hiện trạng (Problem Statement)
* **Hiện tượng**: Sau khi trang Đăng nhập (`/dang-nhap` hoặc `/User_Web/auth/login.html`) tải xong hoặc bấm Refresh, nút đăng nhập bằng Google bị hiện tượng "chậm hiển thị icon G".
* **Luồng quan sát**:
  1. Trang vừa load -> Nút Google xuất hiện dưới dạng **khung hình tròn màu trắng rỗng** (chưa có icon).
  2. Khoảng 1 - 2 giây sau -> Icon chữ **G** màu sắc của Google mới được vẽ đè lên khung trắng đó.
* **Mục tiêu**: Tìm đúng nguyên nhân cản trở, cắt giảm các đoạn code rác/chờ đợi không cần thiết, làm cho icon Google hiển thị **tức thì (ngay từ khung hình đầu tiên)** mà không làm hỏng tính năng đăng nhập Google sẵn có.

---

## 2. Structure Tài liệu Task (Task Index)
* [00-README.md](file:///Users/mac/Documents/Productions/iFLUX_P1/docs/Product%20Backlog/270731_Google_Login_Button_Render_Optimization/00-README.md): Tổng quan task, cấu trúc tài liệu.
* [01-BRD-Google-Login-Button-Optimization.md](file:///Users/mac/Documents/Productions/iFLUX_P1/docs/Product%20Backlog/270731_Google_Login_Button_Render_Optimization/01-BRD-Google-Login-Button-Optimization.md): Yêu cầu nghiệp vụ & Tiêu chuẩn trải nghiệm người dùng.
* [02-Audit-Google-Login-Button-Render.md](file:///Users/mac/Documents/Productions/iFLUX_P1/docs/Product%20Backlog/270731_Google_Login_Button_Render_Optimization/02-Audit-Google-Login-Button-Render.md): Phân tích chi tiết nguyên nhân kỹ thuật khiến icon bị trễ 1-2 giây.
* [03-SoT-Google-Login-Button-Optimization.md](file:///Users/mac/Documents/Productions/iFLUX_P1/docs/Product%20Backlog/270731_Google_Login_Button_Render_Optimization/03-SoT-Google-Login-Button-Optimization.md): Quy chuẩn Single Source of Truth trích xuất từ nền tảng `docs/` chi phối task này.
* [04-Solution/01-Solution-Google-Button-Instant-Render.md](file:///Users/mac/Documents/Productions/iFLUX_P1/docs/Product%20Backlog/270731_Google_Login_Button_Render_Optimization/04-Solution/01-Solution-Google-Button-Instant-Render.md): Phương án thiết kế kỹ thuật giải quyết dứt điểm độ trễ hiển thị.
* [05-Plan-Google-Login-Button-Optimization.md](file:///Users/mac/Documents/Productions/iFLUX_P1/docs/Product%20Backlog/270731_Google_Login_Button_Render_Optimization/05-Plan-Google-Login-Button-Optimization.md): Kế hoạch thực thi chi tiết từng phase kèm điều kiện nghiệm thu.
