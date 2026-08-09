# Audit bổ sung — Admin · Role · Profile

**Ngày:** 2026-07-26  
**Neo:** [`Owner-Decision-Matrix-SoT.md`](./Owner-Decision-Matrix-SoT.md)  
**Liên quan:** [`Audit-PhaseAB-Admin-Model.md`](./Audit-PhaseAB-Admin-Model.md)

---

## Chuẩn Owner (vừa chốt)

| Thành phần | Quy tắc |
|------------|---------|
| **Admin** | Tối cao · mặc định **full quyền** · chỉ **Owner** dùng · **không** hiện trong danh sách Phân quyền (Matrix) |
| **Quyền Admin** | (1) Tạo Role bất kỳ + set quyền bất kỳ · (2) Tạo profile bất kỳ + gán Role bất kỳ |
| **Role** | **Không giới hạn số lượng** · mọi Role do Admin tạo · **không** Role mặc định / tự có / seed sẵn cho nhân viên |
| **Profile** | Tài khoản nhân viên · không phải Admin · được gán Role sau khi Admin tạo |

> Làm rõ câu trước: “Nhân viên = Role — khớp số lượng” **không** có nghĩa giới hạn số Role. Ý đúng: mỗi nhân viên gắn Role; **số Role không giới hạn**.

---

## Kiểm tra thực tế vs chuẩn

### A. Admin full quyền · không trong Matrix

| Kiểm tra | Kết quả | Khớp? |
|----------|---------|-------|
| Account Owner `is_super` → bypass mọi permission | Có | ✅ Cơ chế full quyền |
| Matrix chỉ list role `!isSuper` | Có (`editableRoles` / select role) | ✅ Admin **không** nằm trong danh sách phân quyền |
| UI chip vẫn “Super admin” | Còn | ❌ Thuật ngữ |

### B. Tạo Role bất kỳ · set quyền bất kỳ · không giới hạn số lượng

| Kiểm tra | Kết quả | Khớp? |
|----------|---------|-------|
| API/UI tạo Role mới (`createRole`) | Có — không trần số lượng | ✅ |
| Set permission cho Role (trừ role Admin) | Có | ✅ |
| Role seed sẵn khi cài DB | **`admin` + `sub_admin`** (migration `is_system`) | ❌ `sub_admin` = Role mặc định không do Owner tạo |
| Role `is_system` không xóa được | `sub_admin` kẹt lại | ❌ Lệch “mọi Role do Admin tạo / không tự có” |
| Role Marketing / Visitor / phasea_* trên Production | Đã tồn tại (tạo tay hoặc fixture) | ⚠️ Không vi phạm “không giới hạn”; fixture không phải nhu cầu Product |

### C. Tạo profile · gán Role

| Kiểm tra | Kết quả | Khớp? |
|----------|---------|-------|
| Tạo account với `is_super=FALSE` | Có | ✅ Profile nhân viên |
| UI gán Role: ẩn role Admin (`isSuper`) | Có | ✅ Không gán nhầm Role Admin qua UI |
| API `setAccountRoles` chặn gán role Admin? | **Chưa** | ❌ Lỗ hổng (đã ghi P0 audit trước) |
| Copy UI “Thêm quản trị viên” | Còn | ❌ Nên là profile / tài khoản nhân viên |
| Luồng: tạo Role → set quyền → tạo profile → gán Role | UI hỗ trợ đủ các bước | ✅ Khả năng có; copy/seed chưa sạch |

### D. Production snapshot (cùng ngày)

| Role | Nguồn | Theo SoT |
|------|-------|----------|
| `admin` | Seed hệ thống (`is_super`) | Chấp nhận như neo tài khoản Admin — **không** chỉnh trên Matrix |
| `sub_admin` | Seed hệ thống | **Không đạt** — Role mặc định / tự có |
| `marketing`, `visitor`, `phasea_*`, `rbac_audit_viewer` | Tạo sau / fixture | Không giới hạn số lượng ✅; dọn fixture khi Owner chốt |

---

## Verdict

| Ý Owner | Hệ thống hiện tại (sau P0 2026-07-26) |
|---------|----------------------------------------|
| Admin tối cao, full quyền, chỉ Owner | ✅ Production 1 account `is_super` |
| Admin không trong Matrix | ✅ |
| Role không giới hạn số lượng | ✅ |
| Mọi Role do Admin tạo, không seed sẵn | ✅ Đã gỡ `sub_admin`; neo `admin` giữ |
| Tạo profile + gán Role tùy ý | ✅ UX + API cấm gán Role Admin |

**P0 đã deploy.** Fixture `phasea_*` / `rbac_audit*` — **đã dọn** (2026-07-26). Giữ Role **Marketing** / **Visitor** (do Admin tạo).
