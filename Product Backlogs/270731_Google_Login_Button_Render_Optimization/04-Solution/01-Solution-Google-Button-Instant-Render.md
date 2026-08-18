# 04 — Giải pháp Kỹ thuật: Hiển thị Tức thì Nút Google Login

**Mã Task**: `270731_Google_Login_Button_Render_Optimization`  
**Ngày lập**: 31/07/2026  

---

### 1. Hướng tiếp cận Giải pháp (Solution Overview)

Để giải quyết triệt để hiện tượng "nút trắng rỗng 1-2 giây", chúng ta triển khai **Giải pháp hiển thị lớp kép (Dual-Layer Render)**:

```
[Mở trang / Dang-nhap] 
        │
        ├── (0ms): Khung HTML đã có sẵn Icon chữ G mặc định -> Hiển thị TỨC THÌ ngay lập tức!
        │
        └── (Song song): SDK Google nạp ngầm -> Khi nạp xong, gắn bộ lắng nghe sự kiện GIS 
                                                hoặc thay thế mượt mà không nhấp nháy.
```

---

### 2. Chi tiết các Bước Thay đổi (Implementation Details)

#### Bước 1: Bổ sung Icon Google sẵn có vào HTML (HTML Fallback)
* Cập nhật file giao diện [login.html](file:///Users/mac/Documents/Productions/iFLUX_P1/User_Web/auth/login.html) & [register.html](file:///Users/mac/Documents/Productions/iFLUX_P1/User_Web/auth/register.html):
  * **Trước đây (Bị rỗng)**:
    ```html
    <div id="ifx-google-signin-btn" class="ix-social-btn google" title="Google" aria-label="Đăng nhập bằng Google"></div>
    ```
  * **Cải tiến (Có sẵn Icon)**:
    ```html
    <div id="ifx-google-signin-btn" class="ix-social-btn google" title="Google" aria-label="Đăng nhập bằng Google">
      <i class="ti ti-brand-google-filled" aria-hidden="true"></i>
    </div>
    ```

#### Bước 2: Tối ưu CSS để Icon căn giữa hoàn hảo
* Cập nhật file kiểu dáng [components.css](file:///Users/mac/Documents/Productions/iFLUX_P1/Admin_Design_system/iflux-admin-ui/components.css#L1899):
  * Đảm bảo thẻ `<i class="ti ti-brand-google-filled"></i>` nằm chính giữa ô tròn màu đỏ-trắng của Google, màu sắc và kích thước trùng khớp 100% với chuẩn thiết kế (Design System).

#### Bước 3: Tối ưu Luồng nạp trong `auth-social.js`
* Cập nhật file xử lý [auth-social.js](file:///Users/mac/Documents/Productions/iFLUX_P1/User_Web/iflux-web-ui/auth-social.js):
  * Gắn sự kiện click dự phòng (Fallback Click Handler) cho nút HTML. Nếu người dùng bấm vào nút ngay trong 1 giây đầu tiên (khi thư viện Google chưa kịp tải xong), hệ thống sẽ hiển thị trạng thái chờ nhẹ nhàng và tự động kích hoạt Đăng nhập Google ngay khi thư viện vừa nạp xong, tránh tình trạng click bị ngó lơ hoặc trôi trang.
  * Khi thư viện Google nạp thành công, `renderButton` sẽ thế chỗ icon mượt mà.

---

### 3. Đánh giá Lợi ích & An toàn (Benefits & Risk Assessment)

* **Lợi ích**:
  * Tốc độ hiển thị icon Google giảm từ **1500ms xuống còn 0ms** (hiển thị ngay từ khung hình đầu tiên).
  * Trải nghiệm người dùng đồng nhất với các nút Apple, Facebook, Zalo.
* **Rủi ro**: 0% rủi ro với luồng backend vì không chạm vào bất kỳ mã nguồn xử lý logic hay API nào.
