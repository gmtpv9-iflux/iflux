# Tùy chọn ngôn ngữ của người dùng

- Dùng tiếng Việt khi suy nghĩ, lập kế hoạch và giao tiếp với người dùng.

# Phối hợp bắt buộc giữa Codex và Claude

Các quy tắc sau áp dụng cho **cả Codex lẫn Claude**, cùng với những hướng dẫn hiện có:

1. Trước mỗi nhiệm vụ, đọc `AI_Handoff.md` ở gốc repo, kiểm tra trạng thái Git và các commit mới nhất.
2. Ghi nhiệm vụ, trạng thái và phạm vi file/module đang làm vào `AI_Handoff.md` **trước khi sửa code**.
3. Cập nhật nhật ký khi bàn giao và **trước mỗi commit**; ghi thay đổi trước/sau, kết quả kiểm tra, việc còn lại và commit liên quan nếu đã có. Chỉ stage/commit thay đổi thuộc nhiệm vụ của mình; không gom thay đổi của bên kia hoặc người dùng vào commit.
4. Không ghi đè, hoàn tác hoặc xóa thay đổi của bên kia. Nếu cần sửa phần bên kia đang xử lý, **báo người dùng trước** để phối hợp phạm vi.
5. Khi cập nhật nhật ký, đọc lại bản hiện tại, thêm mục mới lên đầu timeline và giữ nguyên các mục khác. Không thay toàn bộ file bằng bản đã đọc từ trước.

Mỗi mục nhật ký phải có: thời gian và AI thực hiện; nhiệm vụ; trạng thái **đang làm / hoàn thành / bị chặn**; phạm vi; thay đổi trước/sau; kết quả kiểm tra; commit nếu có; việc còn lại và lưu ý cho AI tiếp theo.

Không đánh dấu hoàn thành khi kiểm chứng còn thiếu; không ghi secret/API key vào nhật ký. Việc bổ sung nhật ký không tự cấp quyền commit, push hoặc deploy.
