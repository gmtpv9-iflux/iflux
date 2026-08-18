# Phase C — NO_EP-2 · `users.list`

**Trạng thái:** ✅ **PASS / ĐÓNG** (2026-07-26) — [`PhaseC-NOEP2-PASS.md`](./PhaseC-NOEP2-PASS.md)  
**Cụm:** `users.list`  
**Mục tiêu:** 5 key NO_EP → 0 (Server enforce + UI gate) — **đã đạt**  
**Mẫu báo cáo:** [`PhaseC-Report-Template.md`](./PhaseC-Report-Template.md)  
**SoT:** Không bỏ/ẩn checkbox Matrix · xây endpoint + `requirePermission`

## Keys trong cụm (NO_EP)

| Key | Việc |
|-----|------|
| `users.list.create` | POST tạo khách hàng (DB `users`) |
| `users.list.edit` | PATCH sửa tên / SĐT / trạng thái tài khoản |
| `users.list.export` | GET xuất CSV |
| `users.list.grant_premium` | POST cấp Premium/Elite |
| `users.list.reset_password` | POST ghi đè mật khẩu KH |

Đã enforce từ trước: `users.list.view` (GET danh sách).

## Exit

- 5 endpoint + MW khớp Matrix  
- UI gate + gọi API (không chỉ localStorage)  
- Coverage / Route / Permission / Regression / Issue (5 phần)  
- Evidence 200/403 theo Role
