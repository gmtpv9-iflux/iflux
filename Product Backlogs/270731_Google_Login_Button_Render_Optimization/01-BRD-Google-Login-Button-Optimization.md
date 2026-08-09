# 01 — Business Requirement Document (BRD)
## Task: Tối ưu Tốc độ Hiển thị Nút Đăng Nhập Google

**Ngày tạo**: 31/07/2026  
**Thuộc Task**: `270731_Google_Login_Button_Render_Optimization`  

---

### 1. Mục tiêu Nghiệp vụ (Business Goal)
* **Trải nghiệm mượt mà**: Khi người dùng vào trang Đăng nhập (`/dang-nhap`), toàn bộ các nút đăng nhập (Google, Apple, Facebook, Zalo) phải hiển thị đồng bộ, đẹp mắt và ngay lập tức.
* **Xóa bỏ cảm giác khựng/lag**: Không để người dùng nhìn thấy cảnh khung nút Google bị rỗng (vòng tròn màu trắng) trong 1–2 giây rồi mới hiện icon Google. Cảm giác này làm trang web trông như bị lỗi hoặc phản hồi chậm.
* **Giữ nguyên tính năng**: Việc tối ưu tốc độ hiển thị **tuyệt đối không làm ảnh hưởng** đến luồng đăng nhập Google sẵn có (sau khi bấm vào nút vẫn mở cửa sổ chọn tài khoản Google mượt mà).

---

### 2. Yêu cầu Cụ thể (Detailed Requirements)

1. **Hiển thị Tức thì (Instant Visual Display)**:
   * Ngay khi trang HTML vừa tải xong (chưa cần chờ tất cả các file mã nguồn phụ tải xong), khung nút Google **bắt buộc phải có sẵn Icon Google** giống như các nút Apple/Facebook/Zalo bên cạnh.
   * Không còn hiện tượng "vòng tròn màu trắng rỗng" chờ 1-2 giây.

2. **Dọn dẹp & Tối ưu Mã nguồn (Code Cleanup & Optimization)**:
   * Rà soát và loại bỏ các bước khởi tạo rườm rà, các file JS bị xếp hàng chờ đợi không cần thiết.
   * Nạp trước (Preload) bộ thư viện Google SDK một cách thông minh để không bắt giao diện người dùng phải đứng chờ.

3. **Tiêu chí Chấp nhận Nghiêm ngặt (Acceptance Criteria)**:
   * **Tiêu chí 1 (Trải nghiệm mắt nhìn)**: Khi bấm F5 / Refresh trang đăng nhập, nút Google xuất hiện có sẵn icon chữ G ngay từ frame đầu tiên.
   * **Tiêu chí 2 (Chức năng)**: Bấm vào nút Google vẫn thực hiện Đăng nhập Google bình thường, nhận diện tài khoản và đăng nhập thành công.
   * **Tiêu chí 3 (An toàn code)**: Không phát sinh bất kỳ lỗi đỏ nào trong Console của trình duyệt. Không tạo thêm code rác.
