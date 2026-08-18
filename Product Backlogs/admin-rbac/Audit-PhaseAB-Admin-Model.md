# Audit vòng — Phase A/B + mô hình Admin (Human Control)

**Ngày audit:** 2026-07-26  
**Neo SoT:** [`Owner-Decision-Matrix-SoT.md`](./Owner-Decision-Matrix-SoT.md)  
**Phạm vi:** Kết quả Phase A (đã PASS), Phase B (đang mở), docs + Production DB + code Admin RBAC  
**Không gồm:** Phân quyền sử dụng / Affiliate / Runtime-opt phases khác

---

## 1. Verdict ngắn

| Trục | Kết luận |
|------|----------|
| **Phase A (server enforce)** | **Đúng lộ trình / đạt mục tiêu A–G.** Residual hygiene đã làm sau. H đã xử lý một phần (H2 `content.*`). |
| **Phase B (governance / Human Control)** | **Đúng hướng SoT**, chưa xong — đang chờ Owner chốt gói (DEAD / NO_EP / Role dynamic / dọn fixture). |
| **Mô hình Admin (Owner duy nhất)** | **SoT đúng.** Implementation **gần đúng về dữ liệu Production** (1 account `is_super`), nhưng **còn lệch thuật ngữ + lỗ hổng API + seed Role hệ thống**. |

---

## 2. Lộ trình & mục tiêu từng phase

### 2.1 Phase A — Server Enforce (đã đóng PASS)

| Mục tiêu khóa | Trạng thái thực tế | Ghi chú |
|---------------|--------------------|---------|
| Route FAIL → 0 + `requirePermission` | ✅ Đạt | Owner đã PASS |
| 18 key CHƯA ĐÚNG có MW | ✅ Đạt | |
| Security / regression role | ✅ Đạt | |
| UI ↔ API + fail-closed | ✅ Đạt (SoT chính) | |
| Criterion H (không thêm key) | ⚠️ HOLD khi đóng A → sau đó H2 `content.*` | `content.*` DB = **0**; `transactions.create/edit` **giữ** (trên Matrix) |
| Hygiene residual (dashboard / users create) | ✅ Đã làm sau PASS | Phase A report §8 vẫn ghi “còn làm” → **doc lỗi thời** |

**Sót doc (không sót hành vi Phase A):**

- `PhaseA-PASS-Report.md` §3 H vẫn nói “DB còn `content.*`” → **sai so với Production hiện tại**.
- §8 “Tiếp theo” vẫn liệt kê hygiene / quyết H như chưa làm.

**Không lệch lộ trình Phase A:** mục tiêu bảo mật server đã đạt; phần H/governance đúng là Phase B.

### 2.2 Phase B — Governance + Human Control (đang mở)

| Mục tiêu | Trạng thái |
|----------|------------|
| Neo SoT Human Control (không nhầm Catalog) | ✅ Tài liệu + rule đã chỉnh |
| H2 theo quyết định Owner (`content.*`) | ✅ Code + Production |
| Đồng bộ trong phạm vi Human Control Owner xác nhận | 🟡 Một phần |
| DEAD / NO_EP / H3 | ⏳ Chờ Owner — Agent chưa (và không được) tự cắt |
| Role dynamic hoàn toàn (không seed bắt buộc) | ⏳ Chưa thi công — **implementation còn lệch** (mục 3) |
| Dọn fixture audit Phase A trên Production | ⏳ Chưa |

**Không lệch lộ trình:** Phase B chưa “fail” — đang đúng chỗ chờ quyết định; không nên tự D1/H3.

---

## 3. Audit mô hình Admin (SoT vs thực tế)

### 3.1 SoT yêu cầu (chuẩn)

1. Chỉ **một người** dùng **tài khoản Admin** = **Owner**.  
2. Owner duy nhất cấu hình hệ thống phân quyền, tạo Role, phân bổ quyền cho **tài khoản nhân viên**.  
3. Nhân viên **không** có tài khoản Admin — chỉ tài khoản nhân viên + Role.  
4. Role **dynamic** bởi Admin — không bắt buộc seed sẵn gói quyền/role.  
5. Không dùng nhãn “Super Admin” trong SoT Human Control.

### 3.2 Production DB (đo được)

| Kiểm tra | Kết quả | Khớp SoT? |
|----------|---------|-----------|
| Số account `is_super = true` | **1** (`gm.tpv9@gmail.com`) | ✅ Thực tế đúng “một Admin” |
| Account khác | `is_super = false` + Role (Marketing, Visitor, fixture…) | ✅ Đúng hướng “nhân viên + Role” |
| Role `admin` (`is_super`, `is_system`) | Có — seed migration | ⚠️ Cơ chế kỹ thuật OK; nhãn/UI còn “Super admin” |
| Role `sub_admin` (`is_system`) | Seed sẵn trong migration | ⚠️ Lệch “không cần seed sẵn Role” |
| Role Marketing / Visitor / phasea_* | Có trên DB | ⚠️ Fixture + role tạo tay — dynamic được, nhưng **rác audit còn lại** |
| `content.*` permissions | **0** | ✅ H2 đã xong |

### 3.3 Code / UI — chỗ sai định nghĩa hoặc mâu thuẫn

| Vị trí | Hiện tượng | Mức | Ghi chú |
|--------|------------|-----|---------|
| DB/API field `is_super` + client `isSuper` | Cờ kỹ thuật “bypass mọi permission” | Trung bình | **Hợp lệ nội bộ** nếu map = tài khoản Admin (Owner). Tên dễ gợi “Super Admin”. |
| UI chip **“Super admin”** (`admin-governance.js`, `system-roles.js`) | Hiển thị cho Human | **Cao (thuật ngữ)** | Trái SoT — nên là **Admin** |
| `admin-permissions.html` / toast “Admin toàn quyền” | OK hơn “Super” | Thấp | Giữ “Admin” là đúng |
| `auth/register.html`: “phê duyệt từ **Super Admin**” | Copy UI | **Cao** | Đổi → Admin |
| `admin-screens-gd1.js` demo “Super Admin” | Demo/legacy | Thấp–TB | Không phải SoT Product |
| Modal **“Thêm quản trị viên”** | Gọi nhân viên là quản trị viên | **TB** | SoT: **tài khoản nhân viên** |
| Migration seed `admin` + `sub_admin` | Role hệ thống cố định | **TB** | `sub_admin` = seed sẵn — lệch “dynamic hoàn toàn” |
| `createAccount` luôn `is_super=FALSE` | Không tạo thêm Admin qua form thường | ✅ | Khớp SoT |
| UI gán Role: **ẩn** role `isSuper` | Không chọn Role Admin trên UI | ✅ UX | |
| API `setAccountRoles` | **Không chặn** gán role `is_super` nếu gọi API trực tiếp | **Cao (lỗ hổng)** | Có thể biến nhân viên thành Admin qua role — **trái SoT** |
| `ADMIN_ALLOWED_EMAILS` bootstrap | Có thể gắn `is_super=TRUE` cho **nhiều** email trong env | **TB** | Schema/env **cho phép** nhiều Admin; Production hiện chỉ 1 |

### 3.4 Kết luận mô hình Admin

```text
SoT (đúng)     → 1 Owner · 1 tài khoản Admin · nhân viên = Role
Production DB  → đang khớp số lượng (1 is_super)
Code/UI        → còn “Super admin”, seed sub_admin, API chưa khóa gán role Admin
```

**Chưa thấy** bằng chứng Production đang có nhiều tài khoản Admin.  
**Có** rủi ro/model lệch nếu: (a) thêm email vào `ADMIN_ALLOWED_EMAILS`, hoặc (b) gọi API gán role `admin` cho nhân viên.

---

## 4. Việc đã làm đúng (giữ)

- Phase A: server `requirePermission` / fail-closed / evidence 403.  
- H2 `content.*` → `community.articles.*` / `stories.registry.edit`.  
- Giữ `subscription.transactions.create|edit` trên Matrix.  
- Hygiene dashboard / users create có `data-ix-perm`.  
- SoT Human Control đã tách Matrix ≠ Catalog; ngoài UI = chờ xử lý sau.

---

## 5. Việc còn sót / lệch lộ trình (ưu tiên)

### P0 — An toàn mô hình Admin (nên Owner chốt rồi làm)

1. **API cấm** gán role `is_super` / gắn `is_super` cho account nhân viên (server enforce, không chỉ ẩn UI).  
2. **UI copy:** bỏ mọi chữ “Super admin” / “Super Admin” → **Admin**; modal nhân viên → “tài khoản nhân viên” (không “quản trị viên” nếu SoT yêu cầu).  
3. (Tùy Owner) Siết bootstrap: chỉ **một** email Owner được `is_super`.

### P1 — Phase B còn mở (chờ Owner, không tự làm)

4. DEAD / NO_EP / H3 — chỉ khi Owner chốt.  
5. Role dynamic: xử lý seed `sub_admin` / chính sách role hệ thống.  
6. Dọn fixture `phasea_*` / `rbac-audit*` trên Production (nếu Owner đồng ý).

### P2 — Doc hygiene

7. Cập nhật `PhaseA-PASS-Report.md` (H/`content.*`, §8) cho khớp hiện trạng — tránh reviewer đọc lệch.

---

## 6. Ma trận “đạt phase?” tổng hợp

| Phase | Mục tiêu cốt lõi | Đạt? | Blocker còn lại |
|-------|------------------|------|-----------------|
| A | Server RBAC enforce | **Có** | Doc lỗi thời; fixture audit còn trên DB |
| B | Governance + Human Control | **Chưa xong** (đúng tiến độ chờ) | Owner quyết DEAD/NO_EP/Role; P0 Admin API/UI |
| Human Control SoT | Định nghĩa kiểm soát Owner | **Docs đúng** | Implementation thuật ngữ + lỗ hổng API |

---

## 7. Đề xuất bước tiếp (không tự thi công ngoài P0 nếu Owner chưa chốt)

1. Owner xác nhận: có làm **P0** (khóa API + đổi copy UI) ngay không?  
2. Owner chọn gói Phase B: DEAD / NO_EP / Role seed / dọn fixture.  
3. Agent cập nhật Phase A report (P2) khi Owner OK.

---

*Audit này là bằng chứng Markdown cho reviewer — không suy diễn cắt Catalog từ “ngoài UI”.*
