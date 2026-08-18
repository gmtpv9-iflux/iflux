# 03 — Governing SoT · Tối ưu hóa Danh sách bài viết Admin

**Date:** 2026-08-01  
**Folder:** `docs/Product Backlog/010826_Optimize_Admin_Article_List/`  

---

## 1. SoT 1: Quản lý Thay đổi Kỹ thuật (Engineering Change Governance)

*Nguồn gốc: [`docs/SoT — Engineering Change Governance.md`](../../SoT%20—%20Engineering%20Change%20Governance.md)*

### Các quy tắc chi phối:
- **CG-001 — Reuse Before Create (Tái sử dụng trước khi Tạo mới):**
  * Ưu tiên chỉnh sửa, tối ưu hóa các hàm và UI hiện tại. 
  * Không tạo thêm các module, helpers hay file CSS/JS song song để né việc refactor.
- **CG-002 — No Duplicate Responsibility (Không trùng lặp trách nhiệm):**
  * Logic hiển thị nguồn bài viết chỉ có một vị trí duy nhất kiểm soát là hàm `nguonLabel(a)` trong `article-list-page.js`. Không tạo thêm hàm hoặc layer mới để xử lý cột Nguồn.
- **CG-010 — Cấm che code cũ (No Shadow Implementation):**
  * Không sử dụng `display:none` hay các thủ thuật CSS/DOM để che giấu giao diện cũ rồi dựng giao diện mới bên cạnh (ví dụ: đối với thanh phân trang).
- **CG-020 — Migration Must End With Cleanup (Hoàn thành phải đi kèm Dọn dẹp):**
  * Mọi thay đổi về kiểu dữ liệu trả về của API `/community/admin/articles` phải được cập nhật đồng bộ ở tất cả các consumer (route public, route admin, và route story posts) để không để lại code chết hoặc legacy flow lỗi thời.

---

## 2. SoT 2: Kiến trúc Sản phẩm iFlux (iFlux Product Architecture)

*Nguồn gốc: [`docs/SoT — iFlux Product Architecture (V2).md`](../../SoT%20—%20iFlux%20Product%20Architecture%20(V2).md)*

### Các quy tắc chi phối:
- **Community Post Metadata & Chuyển giao Bản quyền Nguồn bài viết RSS:**
  * **Trạng thái cào tự động (`Xuất bản RSS` / Ingested RSS):** Bài viết giữ metadata nhà cung cấp gốc (`rss:cafef`, `rss:vietstock`...) để bảo đảm tuân thủ tác quyền nguồn cào ban đầu từ bên thứ ba.
  * **Trạng thái Admin Biên tập & Xuất bản (`Xuất bản` / Edited & Published):** Khi Admin/Biên tập viên chỉnh sửa, thiết kế lại toàn bộ nội dung bài viết RSS và chuyển trạng thái sang `Xuất bản`, **bản quyền của bài viết chính thức chuyển giao hoàn toàn sang iFlux (bản quyền thuộc về iFlux)**. Bài viết lúc này trở thành nội dung nguyên bản thuộc sở hữu iFlux, không còn bị ràng buộc tuân thủ tác quyền với nguồn RSS gốc ban đầu, và metadata nguồn/tác giả hiển thị đại diện tương ứng cho iFlux / Admin biên tập.
- **Tính nhất quán của Admin UI Panel (Admin Design System):**
  * Mọi thành phần UI được thêm vào (như các nút bấm phân trang) phải tuân thủ chuẩn giao diện và hệ thống CSS biến số (Design tokens) của `Admin_Design_system` (như class `ix-btn`, `ix-btn-outline`, `ix-chip`, các biến màu CSS `--ix-text-primary`, `--ix-border-color`).
