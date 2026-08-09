# 02 — Báo cáo Audit Hiện trạng & Nguyên nhân Tải Chậm Icon Google

**Ngày thực hiện**: 31/07/2026  
**Thuộc Task**: `270731_Google_Login_Button_Render_Optimization`  

---

### 1. Hiện trạng Quan sát được (User Reality)
Khi người dùng truy cập trang Đăng nhập (`/dang-nhap`):
* Các nút mạng xã hội khác như **Apple**, **Facebook**, **Zalo** hiển thị icon ngay lập tức vì icon được viết sẵn trực tiếp trong giao diện HTML.
* Nút **Google** xuất hiện dưới dạng **vòng tròn màu trắng rỗng**.
* Sau khoảng **1 đến 2 giây**, icon chữ G mới đột ngột xuất hiện bên trong vòng tròn màu trắng đó.

---

### 2. Phân tích Nguyên nhân Kỹ thuật (Root Cause Audit)

Qua rà soát mã nguồn dự án, tôi đã phát hiện **3 nguyên nhân chính** kết hợp gây ra độ trễ này:

#### 🔴 Nguyên nhân 1: File HTML ban đầu để khung hình rỗng (Không có Icon dự phòng)
* Trong file giao diện [login.html](file:///Users/mac/Documents/Productions/iFLUX_P1/User_Web/auth/login.html#L78):
  * Thẻ của nút Google được khai báo: `<div id="ifx-google-signin-btn" class="ix-social-btn google" ...></div>` -> **Hoàn toàn trống rỗng bên trong**.
  * Trong khi các nút khác có sẵn icon: `<i class="ti ti-brand-apple-filled"></i>`.
* **Hậu quả**: Trình duyệt vẽ ra giao diện ngay lập tức sẽ chỉ thấy một ô tròn màu trắng rỗng tuếch.

#### 🔴 Nguyên nhân 2: Mã nguồn bị xếp hàng nạp nối đuôi quá dài (Sequential Boot Queue)
* Trong file khởi tạo [auth-login-boot.js](file:///Users/mac/Documents/Productions/iFLUX_P1/User_Web/iflux-web-ui/runtime/auth-login-boot.js#L15-L24):
  * Trình duyệt bị bắt phải tải nối đuôi nhau (tải xong file này mới được tải file tiếp theo) một danh sách gồm **11 tệp mã nguồn JS** (`iflux-platform-boot`, `iflux-api-bundle`, `auth`, `iflux-customers-store`, `iflux-credentials-store`, `loyalty-affiliate-store`, `auth-social`, `iflux-user-data-sync`, `iflux-admin-ui`, `iflux-web-ui`, `auth-login-init`).
* **Hậu quả**: Mã nguồn vẽ nút Google (`auth-social.js`) nằm ở vị trí thứ 7, và mã gọi vẽ nút (`auth-login-init.js`) nằm tận vị trí số 11. Trình duyệt phải chờ 10 file kia tải xong mới bắt đầu xử lý nút Google.

#### 🔴 Nguyên nhân 3: Phụ thuộc vào tốc độ tải bộ thư viện Google qua Internet
* Mã nguồn `auth-social.js` sử dụng cơ chế nạp động thư viện Google Sign-In (`https://accounts.google.com/gsi/client`).
* Khi thư viện Google tải xong về máy người dùng, nó mới chạy hàm `google.accounts.id.renderButton()` để sinh ra một thẻ nhúng (`<iframe>`) chứa hình chữ G và nhét vào ô tròn rỗng.
* **Hậu quả**: Toàn bộ thời gian tải file từ máy chủ Google + thời gian vẽ iframe mất từ 1 đến 2 giây, tạo ra cảm giác lag khựng.

---

### 3. Đánh giá Tác động & Hướng xử lý (Impact & Remedy)

* **Về tính năng**: Luồng xử lý đăng nhập Google (OAuth GIS) hoạt động hoàn toàn chính xác và an toàn.
* **Về giao diện**: Cần áp dụng giải pháp **Kép (Dual-Layer)**:
  1. **Tầng 1 (Giao diện tức thì - Immediate Fallback)**: Đặt sẵn Icon Google chuẩn (`<i class="ti ti-brand-google-filled"></i>`) trực tiếp trong HTML gốc. Ngay khi mở trang, icon chữ G hiển thị tức thì 0ms mà không cần chờ JS.
  2. **Tầng 2 (Tải ngầm thông minh - Smart SDK Preload & Seamless Swap)**: Cho phép bộ thư viện Google nạp trước (preload) hoặc nạp ngầm. Khi bộ SDK Google sẵn sàng, nó sẽ thay thế mượt mà hoặc đè lên mà người dùng không hề nhận ra sự ngắt quãng nào.
