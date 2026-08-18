# Gate — Wave 2 vs mục tiêu “chuyển đổi linh hoạt”

**Task:** `170826_Inprogress_URL Architecture Standardization`  
**Ngày:** 17/08/2026 · **Amend 18/08/2026**  
**Quyết định thi công:** **DỪNG Wave 2 English**  
**Căn cứ:** [`03_SoT.md`](03_SoT.md) §4 §5 §8.5 §8.6 · [`04_Solution.md`](04_Solution.md) §4.2 · đo Wave 1 trên S1 · [`05_Audit_Menu_URL_Coverage.md`](05_Audit_Menu_URL_Coverage.md)

Owner 18/08: SoT §4 §5 §8.5 §8.6 là **implementation constraint**, không mở lại thành quyết định G-FLEX. Cơ chế: Dispatcher IA (`matchPath` + `pathFor` + `@admin_ia`).

---

# 0. Kết luận

| Mục tiêu | Trạng thái 18/08 |
|---|---|
| SoT §4 / §5 / §8.5 / §8.6 trên 4 trang Quản trị viên | **Constraint — thi công Dispatcher + V5.** Một edit IA (bỏ `urlSegment` module) → Nav + Breadcrumb + URL serve đổi; `pageKey` / perm / file không đổi; **không** thêm location nginx / `PAGES.file` / Route mới. |
| Phủ URL English toàn menu Admin (AC-03 / SoT §2.2) | **Dừng.** 94 item còn VI. Không invert hàng loạt. |

Wave 2 dừng vì **phủ English** chưa được Owner mở — **không** vì §8.6 còn chờ quyết định.

**G-FLEX-1** (serve URL khi relocate) = **SUPERSEDED** bởi Dispatcher. Không khóa lại.

---

# 1. “Linh hoạt” theo SoT (không bịa)

[`03_SoT.md`](03_SoT.md) Acceptance §8.5–§8.6:

5. Navigation, Breadcrumb và URL **tự** phản ánh vị trí mới.  
6. **Không phải sửa nhiều nơi** hoặc nhân bản Page/Menu/Route khi di chuyển.

§5: đổi IA cập nhật Route Registry một cách canonical, không sửa thủ công nhiều nơi.

§4: di chuyển Page → identity / permission / DB giữ; Nav + BC + URL mới theo IA.

Đó là **constraint thi công**, không phải backlog Owner.

---

# 2. Cơ chế đã chọn (04 §4.2)

```text
Sửa IA một lần (NavRegistry: urlSegment / vị trí node)
        ↓
pathFor / trailFor / hrefFor
        ↓
matchPath(pathFor + slug + legacy) → cùng pageKey
        ↓
Dispatcher (Express, đọc JS registry đã có)
  URL ≠ pathFor  → 301 canonical
  URL  = pathFor → sendFile PAGES[pageKey].file
        ↓
Nginx: path không có regex module sẵn → @admin_ia → :3002
```

Không invent Route Registry / nginx generator / file mapping mới.

V5 (ví dụ SoT §4): xóa `urlSegment: "system-settings"` trên group “Cài đặt hệ thống”. Menu order không đổi.

```text
Trước: /admin/system-settings/administrators/permissions
Sau:   /admin/administrators/permissions
pageKey = system-admin-permissions
```

---

# 3. Evidence Wave 1 — gap đã đóng bằng Dispatcher (không bằng pre-seed)

Trước Dispatcher: `/admin/administrators/permissions` 200 **chỉ** vì nginx viết tay hai prefix. `/admin/system-settings/sla` 404. Đó là coverage, không phải §8.6.

Sau Dispatcher + V5 (kỳ vọng S1):

| Thao tác | Kỳ vọng |
|---|---|
| Một edit IA (đã ship: bỏ segment module) | `pathFor` = `/admin/administrators/{leaf}` |
| Mở URL mới | 200, cùng file `system/admin-*.html`, cùng pageKey |
| Mở `/admin/system-settings/administrators/permissions` | 301 → URL mới — **không** thêm location |
| Mở `/admin/he-thong/admin-permissions` | 301 → URL mới |
| Menu + breadcrumb 4 trang | theo IA mới; group vẫn “Cài đặt hệ thống” |
| `/admin/he-thong/sla`, `/admin/goi-cuoc/entitlements` | 200 như cũ (regex VI giữ) |
| `/admin/login` | 200 (nginx exact) |

`hrefFor` ngoài 4 trang vẫn đọc `PAGES.slug` (94 mục VI) — đó là **coverage**, không phá §8.6 trên in-scope.

---

# 4. Wave 2 vẫn dừng — lý do còn lại

Không invert `goi-cuoc` / gắn `urlSegment` hàng loạt.

Còn lại khi Owner **mở phủ English** (không phải G-FLEX-1):

| Hạng | Việc |
|---|---|
| D-04 / §8 slug | Khóa segment EN từng module (`chu-de`, G-06 giao diện, leaf VI, 5 path Hướng dẫn) |
| Nhánh `PAGES.slug` | Xóa khi mọi item đã có `urlSegment` |
| HTML chết | Xóa khi hết link |

Đi hết wave English **không** thay Dispatcher. Architecture relocate đã có.

---

# 5. G-FLEX — trạng thái

| ID | Trước 18/08 | Sau Owner 18/08 |
|---|---|---|
| **G-FLEX-1** | Owner phải khóa cách serve URL | **SUPERSEDED** — Dispatcher |
| G-FLEX-2…5 | Slug / G-06 / xóa nhánh slug | Đổi tên: điều kiện **Wave 2 English**, không phải lock §8.6 |

---

# 6. Lệnh dừng

- Không invert `goi-cuoc`, `khach-hang`, `he-thong`, …  
- Không gắn `urlSegment` hàng loạt.  
- Không thêm `location` nginx theo từng URL mới.  
- Wave 2 English chỉ mở khi Owner yêu cầu phủ §2.2.
