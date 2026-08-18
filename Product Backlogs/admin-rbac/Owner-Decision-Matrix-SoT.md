# Owner SoT — Human Control Model (Phân quyền quản trị)

**Trạng thái:** 🔒 **LOCKED** (2026-07-26) — Owner đã khóa; Agent không được suy diễn lệch SoT này.  
**Ngày:** 2026-07-26  
**Phạm vi:** Mô hình kiểm soát của Owner trên Admin RBAC  
**Không phải:** SoT về toàn bộ Permission Catalog của hệ thống

---

## Owner Correction (cốt lõi)

**Đừng** đồng nhất **UI Permission Matrix** với **toàn bộ Permission Catalog** của hệ thống.

- UI Matrix chỉ là **Source of Truth cho phạm vi Human Control hiện tại**.
- Permission **không** xuất hiện trên UI **không** đồng nghĩa với: “không chính thức”, “không tồn tại”, “phải cắt”, hay “cấm H3”.
- Chúng chỉ **nằm ngoài phạm vi Human Control** tại thời điểm hiện tại → chuyển sang **nhóm xử lý sau**.
- Chỉ sau khi Owner có **quyết định cụ thể** trong các phase tiếp theo mới được cắt, stash, hay chuẩn hóa.

---

## Owner SoT

Hệ thống có thể tồn tại **nhiều permission / capability hơn** phạm vi Human đang kiểm soát tại một thời điểm.

```text
Toàn bộ hệ thống
  → nhiều capability (catalog / server / code…)

Tại một thời điểm
  → Human (Owner) chỉ kiểm soát được
    những capability đã được đưa lên UI

Capability chưa có UI
  ≠ không tồn tại
  ≠ không chính thức
  = Owner chưa kiểm soát được (chờ xử lý sau)
```

**UI Permission Matrix không phải toàn bộ Permission Catalog của hệ thống.**  
UI chỉ là **cửa sổ điều khiển** — phạm vi quản trị mà Owner **hiện có thể quan sát và kiểm soát** qua giao diện.

```text
Đúng:   System  →  UI (cửa sổ điều khiển)
Sai:    UI      →  Catalog  →  System
```

---

## Principle — không suy diễn Product Intent

> **Agent không được suy diễn Product Intent từ trạng thái implementation.**
>
> Việc một capability tồn tại trong code, catalog hay server **không có nghĩa** Owner muốn expose lên UI.
>
> Ngược lại, việc chưa có UI **không có nghĩa** capability phải bị loại bỏ.
>
> Chỉ Owner quyết định khi nào một capability trở thành Human Control.

---

## Capability States

| Trạng thái | Ý nghĩa |
|------------|---------|
| **Trên UI Matrix** | Owner **đang kiểm soát được** (quan sát + gán quyền qua giao diện) |
| **Chưa có UI** | Ngoài Human Control hiện tại → **nhóm chờ xử lý sau** (Product / Owner quyết sau). **Không được Agent tự ý thay đổi trạng thái của nhóm này nếu chưa có quyết định Owner.** |
| **Bổ sung sau** | Khi Product thêm UI → capability đó **trở thành** phạm vi kiểm soát |

H1 / H2 / H3 vẫn có thể tồn tại như **nhãn kỹ thuật** — chỉ áp dụng đúng bảng quyết định Owner bên dưới. **Không** tự suy “cấm”, “cắt”, hay “không chính thức”.

---

## Owner Decision — H / DEAD / NO_EP (🔒 khóa)

Nhất quán với Human Control: DEAD chưa đủ cơ sở để xóa; NO_EP là nhu cầu Product đã lên UI — thiếu phần implementation, không phải thiết kế quyền sai.

| Nhóm | Quyết định Owner | Agent được phép | Agent **cấm** |
|------|------------------|-----------------|---------------|
| **H1** | Theo **từng** quyết định của Owner | Chỉ khi Owner chốt hạng mục cụ thể | Tự giữ / tự approve key mới |
| **H2** | Chỉ khi implementation **tự sinh** permission ngoài phạm vi Owner đã quyết | Map về permission catalog/Matrix đã có **khi Owner/phase yêu cầu** | Tự H2 mọi thứ ngoài UI |
| **H3** | Chỉ khi Owner quyết định | — | Tự stash / tự cấm H3 |
| **DEAD** | **Giữ nguyên.** Không cắt. Không stash. Không đổi trạng thái. Chỉ duy trì danh sách audit để theo dõi. Chỉ xử lý khi Owner **mở phase riêng**. | Giữ danh sách audit / theo dõi | Cắt, stash, “dọn Catalog”, đổi trạng thái |
| **NO_EP** | **Nhu cầu nghiệp vụ chính thức** (đã trên UI Matrix = Owner đang kiểm soát). Khi phase phù hợp: **xây API/endpoint + enforce** permission tương ứng để hoàn thiện vòng đời quyền. | Xây endpoint/enforce trong phase Owner mở | Bỏ checkbox, ẩn Matrix, map sang permission khác chỉ vì chưa có endpoint |

### DEAD (khóa)

> Giữ nguyên. Không cắt. Không stash. Không đổi trạng thái.  
> Chỉ duy trì danh sách audit để theo dõi.  
> Chỉ xử lý khi Owner mở phase riêng.

### NO_EP (khóa)

> Đây là nhu cầu nghiệp vụ chính thức vì đã xuất hiện trên UI Permission Matrix (Owner đang kiểm soát được).  
> Không bỏ checkbox. Không ẩn. Không map sang permission khác chỉ vì chưa có endpoint.  
> Khi đến phase phù hợp thì xây dựng API/endpoint và enforce permission tương ứng.

---

## Admin · Role · Profile (chuẩn Owner)

### Admin (tài khoản)

- **Admin** = tối cao, **mặc định full quyền**.
- **Chỉ Owner** sử dụng tài khoản Admin.
- Admin **không nằm trong danh sách Phân quyền quản trị (Matrix)** — vì đã mặc định full quyền, không cần gán từng ô.
- Quyền của Admin:
  1. **Tạo Role bất kỳ**, set quyền bất kỳ cho Role đó.
  2. **Tạo profile (tài khoản nhân viên) bất kỳ**, rồi **gán Role bất kỳ** cho profile đó.

### Role (không giới hạn số lượng)

- Role nhân viên **không giới hạn số lượng**.
- **Mọi Role** trong hệ thống (ngoài cơ chế tài khoản Admin) đều do **Admin khởi tạo**.
- **Không** có Role mặc định / Role tự có / Role seed sẵn cho nhân viên.
- Luồng đúng: Admin **tạo Role** → set quyền → Admin **tạo profile** → **gán Role** cho profile mong muốn.

### Profile (tài khoản nhân viên)

- Nhân viên **không** có tài khoản Admin — chỉ có **profile / tài khoản nhân viên** được gán Role.
- Owner là người duy nhất sử dụng tài khoản Admin và là người duy nhất có quyền cấu hình hệ thống phân quyền quản trị, tạo Role và phân bổ quyền quản trị cho các tài khoản nhân viên.

---

## Định nghĩa Control (Human Control)

**Control** nghĩa là:

1. Admin (Owner) **nhìn thấy** capability trên UI Matrix (phạm vi đang kiểm soát).
2. Có thể **tạo Role** bất kỳ và **set quyền** bất kỳ (dynamic — không Role seed sẵn cho nhân viên).
3. Có thể **tạo profile nhân viên** bất kỳ và **gán Role** bất kỳ.
4. Có thể **cấp toàn quyền thao tác** cho một nhân viên (qua Role đủ quyền) nếu Owner muốn — nhân viên đó vẫn **không** phải tài khoản Admin.

---

## Hệ quả cho Agent / Phase

| Khái niệm | Đọc đúng | Không được đọc thành |
|-----------|----------|----------------------|
| UI Matrix | SoT **Human Control hiện tại** | Toàn bộ permission hệ thống cần hỗ trợ |
| Ngoài UI | Chờ xử lý sau — Agent **không tự đổi trạng thái** | Không chính thức / phải H2 hết / phải cắt |
| H1 | Từng quyết định Owner | Tự approve key mới |
| H2 | Chỉ khi impl tự sinh perm ngoài phạm vi đã quyết | Tự map mọi thứ ngoài UI |
| H3 | Chỉ khi Owner quyết | Cấm H3 / tự stash |
| **DEAD** | **Giữ nguyên** — chỉ audit theo dõi; xử lý khi Owner mở phase riêng | Cắt / stash / dọn Catalog |
| **NO_EP** | **Chính thức trên Matrix** — phase sau xây API + enforce | Bỏ checkbox / ẩn / map vì chưa có EP |
| Role | Dynamic do Admin (Owner) cho **tài khoản nhân viên** | Seed sẵn Role nhân viên; nhân viên = tài khoản Admin |

**SoT này là về khả năng kiểm soát (Human Control Model) — không phải SoT về Permission Catalog.**

Hai thứ liên quan nhưng **không phải một**. Quyết định H1/H2/H3 chỉ hợp lệ theo bảng Owner Decision đã khóa. **DEAD** và **NO_EP** đã khóa như trên — không mở lại bằng suy diễn Agent.

---

Xem kế hoạch phase: [`PhaseB-Plan.md`](./PhaseB-Plan.md)
