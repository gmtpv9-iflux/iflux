# Phase A — PASS Report · Admin RBAC Server Enforce

**Ngày:** 2026-07-26  
**Phạm vi:** Phân quyền quản trị (Admin RBAC) — không gồm Phân quyền sử dụng / Affiliate  
**Nhãn nghiệm thu:** `PASS Phase A – Admin RBAC Server Enforce (A–G)`  
**H (đóng A):** HOLD → sau đó Phase B **H2 `content.*`** (DB `content.*` = 0); giữ `subscription.transactions.create|edit`  
**SoT khóa:** [`Owner-Decision-Matrix-SoT.md`](./Owner-Decision-Matrix-SoT.md) 🔒

> **Thuật ngữ:** Trong bảng regression, dòng **Super** = lần đo bằng **tài khoản Admin (Owner)**. Nhân viên test = **tài khoản nhân viên + Role**.

---

## 1. Verdict

Phase A **đạt tiêu chí chấp nhận hành vi (A–G)**. Có thể ký đóng.

Định nghĩa đóng phase (Owner):

> Mọi hành động quản trị trong phạm vi phase đều được enforce ở Server bằng permission tương ứng; Route Coverage không còn FAIL; Permission Coverage không còn “CHƯA ĐÚNG”; Evidence chứng minh UI và API nhất quán.

| Lớp | Kết quả |
|-----|---------|
| Server enforce | Đạt |
| Route FAIL → 0 | Đạt |
| 18 key CHƯA ĐÚNG → có MW | Đạt |
| UI ↔ API (SoT chính) | Đạt |
| Client fail-closed | Đạt |
| Regression role thật | Đạt |
| Evidence | Đạt |
| Không thêm key mới (H) | HOLD — không rollback trong Phase A |

---

## 2. Mục tiêu đã khóa

| Lớp | Mục tiêu |
|-----|----------|
| Task | Chứng minh RBAC **Server** thật sự chạy; UI chỉ UX, không phải bảo mật |
| Phase A PASS | Server enforce · Route FAIL=0 · CHƯA ĐÚNG=0 · Evidence UI↔API |
| Ngoài scope | Không module mới · Không Catalog/Matrix refactor · Không User Entitlement / Affiliate · **H tạm dừng** |

---

## 3. Exit Criteria A–H

| # | Tiêu chí | Kết quả | Evidence |
|---|----------|---------|----------|
| A | Route Coverage FAIL 47→0 | **PASS** | Mounted Phase A: FAIL=0 (66 PASS + 2 SELF). Articles có `requirePermission`. |
| B | Permission 18→MW/consume | **PASS** | 18/18 key CHƯA ĐÚNG gốc có middleware trên Production. |
| C | Security test roles | **PASS** | Viewer / Editor / None / Super + Marketing / Visitor đo API. |
| D | UI ↔ API nhất quán | **PASS*** | Nút Tạo/Sửa/Xóa Phase A gate `hasPermission` / `data-ix-perm`; fail-open delete đã gỡ. |
| E | Client fail-closed | **PASS** | `hasPermission(!loaded)=false`; `gateCurrentPage` chặn khi chưa load; App Shell ẩn menu. |
| F | Regression roles thật | **PASS** | Super / Marketing / Visitor khớp matrix; VIEWER / NONE fixture đúng. |
| G | Coverage evidence | **PASS** | Báo cáo này + audit sau implementation. |
| H | Không thêm permission key | **HOLD→H2** | `content.*` đã map + gỡ catalog; `transactions.create/edit` giữ (Matrix) |

\*Residual hygiene (dashboard / users create `data-ix-perm`) — **đã làm** sau PASS.

---

## 4. Security / Regression (Production)

| Role | GET articles | POST articles | GET users |
|------|--------------|---------------|-----------|
| Super | 200 | 400 (validate, đã qua RBAC) | 200 |
| Marketing | 200 | 400 (có create trên matrix) | 200 |
| Visitor | 200 | **403** (không create) | 200 |
| Viewer (`view` only) | 200 | **403** | **403** |
| None | **403** | **403** | **403** |

→ Server là SoT bảo mật; UI chỉ phản ánh quyền.

---

## 5. Route Coverage (tóm tắt)

| Module | Actions | RBAC MW | Verdict |
|--------|---------|---------|---------|
| Community articles | GET/POST/PUT/DELETE | ✓ | PASS |
| Community categories | CRUD | ✓ | PASS |
| Subscriptions orders | view/create/edit/approve/reject/cancel | ✓ | PASS |
| Users list | GET | ✓ | PASS |
| Requests bugs/features/partnership | view + status | ✓ | PASS |
| Stories registry / content chu-de | view/create/edit/archive | ✓ | PASS |
| Publish / DNSE / Onboarding | edit/view | ✓ | PASS |
| access/* + /me SELF | — | ✓ | PASS / PASS·SELF |

---

## 6. UI gates đã gắn (D)

| Surface | Controls | Permission |
|---------|----------|------------|
| Articles | Tạo / Sửa / Xóa | create / edit / delete |
| Categories | Thêm / Sửa / Xóa | create / edit / delete |
| Orders / Transactions | Thêm / Sửa / Xóa / Duyệt / Từ chối | create / edit / cancel / approve / status_rejected |
| Chủ đề registry | Tạo / Sửa / Lưu trữ | create / edit / status_archived |
| Onboarding | Thêm / Sửa / Xóa | marketing.onboarding.edit |
| Page settings | Lưu / Publish | interface.page_settings.edit |
| Partnership / Bugs / Features | đổi trạng thái | status_* |

---

## 7. Kết luận gửi reviewer

Phase A được chấp nhận đóng vì hành vi hệ thống đã khớp RBAC:

1. Mọi route trong phạm vi qua `requirePermission`
2. 18 permission “CHƯA ĐÚNG” đã có middleware
3. Evidence 200/403 theo role
4. UI gate chính đã fail-closed và phản ánh cùng permission với API

Không coi là “PASS tuyệt đối mọi pixel Admin” — còn residual nút legacy/dashboard/users → hygiene follow-up (không mở Phase B catalog).

**H** đã xử lý sau đóng A (H2 content.*). Hygiene residual đã xong.

---

## 8. Tiếp theo (lịch sử — chuyển Phase B)

- Phase B: SoT Human Control 🔒 · Admin/Role/Profile · DEAD/NO_EP chờ Owner  
- Xem [`PhaseB-Plan.md`](./PhaseB-Plan.md) · [`Audit-Admin-Role-Profile.md`](./Audit-Admin-Role-Profile.md)
