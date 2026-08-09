# 03 — Single Source of Truth (SoT) Nội bộ Task
## Task: Tối ưu Tốc độ Hiển thị Nút Đăng Nhập Google

**Mã Task**: `270731_Google_Login_Button_Render_Optimization`  
**Căn cứ pháp lý & Kiến trúc**: Trích xuất từ các SoT nền tảng tại thư mục gốc `docs/`:
* [SoT — iFlux Product Architecture (V2).md](file:///Users/mac/Documents/Productions/iFLUX_P1/docs/SoT%20%E2%80%94%20iFlux%20Product%20Architecture%20(V2).md)
* [SoT — Engineering Change Governance.md](file:///Users/mac/Documents/Productions/iFLUX_P1/docs/SoT%20%E2%80%94%20Engineering%20Change%20Governance.md)
* [SoT — Trình tự tối ưu Runtime (3 Phase + Gate).md](file:///Users/mac/Documents/Productions/iFLUX_P1/docs/SoT%20%E2%80%94%20Tr%C3%ACnh%20t%E1%BB%B1%20t%E1%BB%91i%20%C6%B0u%20Runtime%20(3%20Phase%20%2B%20Gate).md)

---

### 1. Quy tắc Vàng về Sở hữu Code & Chống Code Rác (Ownership & Non-Duplication)

1. **Nguyên tắc 1 Owner (Single Ownership)**:
   * File [auth-social.js](file:///Users/mac/Documents/Productions/iFLUX_P1/User_Web/iflux-web-ui/auth-social.js) tiếp tục là **Owner duy nhất** chịu trách nhiệm quản lý kết nối và nạp thư viện Google Sign-In (GIS).
   * **TUYỆT ĐỐI CẤM**: Không tạo thêm file JS mới dạng `auth-social-v2.js` hay `google-fix.js`. Mọi chỉnh sửa phải thực hiện trực tiếp, có cấu trúc trên file Owner hiện có.

2. **Cấm Nhân bản & Viết đè bừa bãi**:
   * Giữ nguyên các hàm xử lý xác thực tài khoản Google (`onGoogleCredential`, `finishSocialLogin`, `loginWithSocial`).
   * Không thay đổi luồng API Backend `/api/auth/social`.

---

### 2. Quy chuẩn Kỹ thuật Hiển thị Giao diện (UI & Performance Governance)

1. **Chuẩn hiển thị Icon HTML (HTML First Rule)**:
   * Thẻ chứa nút Google trong HTML phải khai báo lớp `ix-social-btn google` và chứa sẵn icon biểu tượng Google `ti-brand-google-filled`.
   * Đảm bảo nút Google trông đồng bộ 100% với các nút Apple, Facebook, Zalo ngay từ khi trình duyệt render thẻ HTML.

2. **Chuẩn nạp ngầm thư viện (Non-blocking SDK Load)**:
   * Thư viện `https://accounts.google.com/gsi/client` được cho phép nạp song song/bất đồng bộ.
   * Khi SDK nạp xong, việc thay thế hoặc kích hoạt nút phải diễn ra êm mượt, không làm nảy (shift layout) hay nhấp nháy giao diện.

3. **Bảo tồn tính tương thích (Backward Compatibility)**:
   * Đảm bảo áp dụng đồng bộ trên cả trang Đăng nhập [login.html](file:///Users/mac/Documents/Productions/iFLUX_P1/User_Web/auth/login.html) lẫn trang Đăng ký [register.html](file:///Users/mac/Documents/Productions/iFLUX_P1/User_Web/auth/register.html).
