# 01 — Business Requirements · Tối ưu hóa Danh sách bài viết Admin

**Date:** 2026-08-01  
**Folder:** `docs/Product Backlog/010826_Optimize_Admin_Article_List/`  

---

## 1. Yêu cầu 1: Quản lý Nguồn & Bản quyền bài viết RSS sau khi Admin chỉnh sửa
- **Bối cảnh:** Trước đây bài viết tự động cào từ RSS mang trạng thái `Xuất bản RSS` nhằm duy trì tên nhà cung cấp gốc (CafeF, VietStock...) để tránh vi phạm bản quyền. Tuy nhiên, khi Admin điều chỉnh bài viết, nội dung bài viết được thiết kế và biên tập lại hoàn toàn mới.
- **Yêu cầu cốt lõi:**
  * **Bài viết cào thô chưa sửa (`Xuất bản RSS`):** Hiển thị Nguồn/Tác giả thuộc nguồn RSS gốc (ví dụ: CafeF, VietStock, Báo Đầu Tư) để bảo đảm tuân thủ tác quyền bên thứ ba.
  * **Bài viết đã Sửa & Xuất bản (`Xuất bản`):** Bản quyền bài viết chính thức chuyển sang iFlux (bản quyền thuộc về iFlux). Không còn áp dụng quy định tuân thủ bản quyền nguồn RSS gốc ban đầu; cột Nguồn / Tác giả hiển thị đại diện tương ứng cho iFlux / Admin biên tập.
- **Kỷ luật:** Ưu tiên chỉnh sửa logic hiện có, tuyệt đối không thêm code dư thừa nếu đã có cơ chế cấu hình sẵn.

## 2. Yêu cầu 2: Định dạng Ngày đăng nhỏ gọn
- **Bối cảnh:** Cột Ngày đăng hiện tại hiển thị hàng ngang khá dài, làm bảng danh sách bị rộng ra một cách không cần thiết.
- **Yêu cầu cốt lõi:** Định dạng ngày đăng hiển thị theo 2 dòng: Giờ đăng ở dòng trên, Ngày đăng xuống dòng ở dưới.
  * Ví dụ:
    ```text
    06:50
    01/08/2026
    ```

## 3. Yêu cầu 3: Phân trang danh sách bài viết
- **Bối cảnh:** Hiện tại hệ thống đang load danh sách bài viết theo giới hạn cứng (hữu hạn, load một lần 200 tin), không có phân trang. Khi lượng bài viết tăng lớn, điều này gây tải nặng cho database và hạn chế khả năng duyệt bài viết cũ.
- **Yêu cầu cốt lõi:**
  * Giới hạn mỗi trang chỉ tải tối đa 50 bản ghi.
  * Phải hiển thị phân trang (Pagination controls) ở phía dưới bảng để người dùng click chuyển trang.
  * Phân trang động, đảm bảo tải mượt mà và không giới hạn việc tìm kiếm/duyệt bài cũ.
