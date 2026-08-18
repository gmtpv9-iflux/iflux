# Đối chiếu Audit ↔ SoT — Product URL Architecture

**Task:** `170826_Inprogress_URL Architecture Standardization`  
**Căn cứ:** [`02_Audit.md`](02_Audit.md) F-01…F-15 · [`03_SoT.md`](03_SoT.md) (Owner Locked)  
**Ngày:** 17/08/2026  
**Status:** Owner Locked — Comparison  
**Solution:** [`04_Solution.md`](04_Solution.md) — chưa khóa  
**Implementation:** Dispatcher + V5 — chứng minh constraint SoT. Wave 2 English chưa ủy quyền

Luồng tài liệu:

```text
Comparison
    ↓
Solution
    ↓
Implementation
```

`03_SoT.md` không bị sửa bởi file này. File này chỉ chấm hiện trạng S1 Admin (và dependency User Web / API) so với SoT đã khóa. Không khóa Solution. Không ủy quyền implement.

---

# 0. Cách chấm

| Ký hiệu | Nghĩa |
|---|---|
| **FAIL** | Hiện trạng trái SoT |
| **PARTIAL** | Một phần đúng, phần còn lại trái hoặc chưa đủ |
| **PASS** | Hiện trạng khớp SoT |
| **OUT** | Ngoài implementation scope đầu tiên (Admin S1); ghi dependency |
| **N/A** | SoT không đòi hỏi hạng này như một rule độc lập; gắn vào rule khác |

Không suy diễn slug / identity mới trong file này. Gap G-01…G-06 vẫn mở cho Solution.

---

# 1. SoT § → hiện trạng

| SoT | Rule | Hiện trạng S1 (Audit) | Chấm |
|---|---|---|---|
| §1 | URL được phép / phải phản ánh Module → Page → Sub-page theo IA thực tế | IA 4 trang Quản trị viên = 3 cấp. URL = 2 cấp (`/admin/he-thong/admin-permissions`). Parent **Quản trị viên** không có trong URL. Ví dụ SoT **404** (F-02, F-03) | **FAIL** |
| §2.1 | User App / User Web mới localized SEO; nhiều slug locale → một Page Identity | Canonical User Web = VI. Cây EN kiểu `/market/money-flow` chưa thấy sống. Chưa chứng minh hai locale → một identity (F-14, G-04) | **OUT** / **PARTIAL** |
| §2.2 | Admin, API, internal, system = URL tiếng Anh | API Admin = English (**PASS** riêng). Admin UI canonical = **tiếng Việt**; English 301 về VI (F-01, F-13) | **FAIL** (Admin UI) · **PASS** (API) |
| §3 | URL không phải Page Identity; mỗi Page có identity ổn định | Không có Page Identity chính thức. Permission gắn href. `pageKey` chỉ là ứng viên (F-04, F-05, G-01) | **FAIL** |
| §4 | Relocation: identity/permission/DB không đổi; Nav + Breadcrumb + URL tự theo IA mới; không nhân bản Page/Menu | Precedent `core-setup` để lại key + file + URL. Đổi nav không đổi URL/breadcrumb. Scenario BRD/SoT chưa chạy được (F-08, F-09, F-10, F-11) | **FAIL** |
| §5 | URL → Page Identity; đổi IA cập nhật Route Registry một chỗ | `matchPath` → object key (không ổn định). Không có identity → URL ngoài `hrefFor`. Đổi URL phải sửa `PAGES` + nginx + `HREF_PERM` + HTML (F-06, F-07, F-11, F-15) | **FAIL** |
| §6 | Một Page / một Module-Menu / một Route canonical; không nhân bản vì đổi chỗ / URL / locale / nav | Nhiều key cùng slug/file; 21 HTML chết; 18 route ngoài nav; alias chưa là redirect-only (F-10, F-12) | **FAIL** |
| §8.1 | URL có thể chứa Module → Page → Sub-page | Cơ chế 2 cấp + 404 URL 3 cấp SoT | **FAIL** |
| §8.2 | Chỉ User localized | Admin đang localized; User VI-only | **PARTIAL** |
| §8.3 | Admin + system English | Admin UI VI | **FAIL** |
| §8.4 | Relocation không đổi Page Identity | Chưa có Page Identity để giữ | **FAIL** |
| §8.5 | Nav, Breadcrumb, URL tự theo IA mới | Không | **FAIL** |
| §8.6 | Không sửa nhiều nơi / không nhân bản khi relocate | Phải sửa nhiều lớp; precedent nhân bản | **FAIL** |

---

# 2. Findings F-01…F-15 → SoT

| Finding | SoT bị lệch | Chấm | Ghi chú |
|---|---|---|---|
| F-01 Canonical Admin = VI; EN 301 → VI | §2.2, §8.3 | **FAIL** | Hướng 301 **ngược** SoT |
| F-02 URL 2 cấp bỏ Page/Menu | §1, §8.1 | **FAIL** | IA có parent thì URL phải có cấp đó |
| F-03 URL ví dụ SoT 404 | §1, §2.2 | **FAIL** | Evidence của F-01 + F-02 |
| F-04 Không có Page Identity chính thức | §3, §8.4 | **FAIL** | G-01: chọn identity ở Solution |
| F-05 Permission từ href | §3, §5 | **FAIL** | Permission key có thể giữ; **binding** phải là Identity |
| F-06 Không Identity → canonical URL | §5, §8.6 | **FAIL** | `hrefFor` chưa đủ vì không phải nguồn duy nhất |
| F-07 `PAGES` thiếu IA / alias / canonical | §5, §7 | **FAIL** | File đúng chỗ; **nội dung** chưa đủ làm Route Registry |
| F-08 Nav theo routeKey; URL/BC không theo IA | §4, §8.5 | **FAIL** | Nửa đúng (nav không hardcode URL) |
| F-09 83 HTML hardcode breadcrumb | §4, §8.5 | **FAIL** | |
| F-10 Nhiều key/file/slug một trang | §6 | **FAIL** | Alias phải là redirect, không phải identity thứ hai |
| F-11 Đổi IA sửa nhiều lớp | §5, §8.6 | **FAIL** | |
| F-12 21 HTML ngoài registry; 18 route ngoài nav | §6 | **FAIL** | Dead file ≠ Page mới; route mồ côi = Route thừa |
| F-13 API EN, UI Admin VI | §2.2 | **PARTIAL** | API không phải vấn đề. UI là lệch |
| F-14 User Web VI; chưa có cây EN SEO | §2.1, §8.2 | **OUT** | Admin-first. Không chặn architecture Admin. G-04 |
| F-15 Nginx Admin: runtime S1 chưa chứng minh reproducible từ Git | §5, §8.6 | **FAIL** (maintainability) | Audit F-15 A/B/C · G-05. Không suy “runtime = file Git” |

---

# 3. Thứ tự lệch (để Solution xử lý)

Lệch gốc — sửa trước, các F còn lại theo:

```text
1. Chốt Page Identity          (§3)     ← F-04, G-01
2. Một Route Registry          (§5)     ← F-07, F-06, F-11
3. URL = projection của IA     (§1)     ← F-02, F-03
4. Admin URL tiếng Anh         (§2.2)   ← F-01, F-13
5. Perm / Nav / BC từ Identity (§3–4)   ← F-05, F-08, F-09
6. Alias = redirect only       (§6)     ← F-10, F-12
7. Nginx cùng nguồn / cùng wave (§5)    ← F-15, G-05
```

F-14 không vào chuỗi Admin. G-02, G-03, G-06 là quyết định dữ liệu IA — không chấm thêm SoT ở đây.

---

# 4. Cái đã khớp SoT (giữ)

| Hạng | Evidence | Giữ |
|---|---|---|
| API Admin English | `/api/admin/access`, `/api/admin/auth`, … | Không đổi prefix API vì URL UI |
| Nav không hardcode href | `routeKey` → `hrefFor` | Giữ hướng này |
| Permission **tên khóa** độc lập URL | `access.permissions.view` | Giữ khóa; đổi chỗ bind |
| File HTML Convention A | `app/{folder}/{page}.html` | URL public ≠ path file |
| Một parent Quản trị viên | không nhân bản menu để giữ URL | Giữ |

---

# 5. Kết luận comparison

S1 Admin **không đạt** Product URL Architecture SoT.

Không có hạng mục **Admin UI** nào ở §8 đạt PASS.

Các điểm đang khớp SoT chỉ là các thành phần cục bộ:

- Admin API dùng English;
- Nav dùng `routeKey` thay vì hardcode URL;
- permission key độc lập với tên URL;
- HTML đang theo Convention A;
- không nhân bản parent menu để giữ URL cũ.

Các điểm này **không đủ** để tạo thành Canonical Product URL Architecture.

Architecture mục tiêu của Solution phải đảo:

```text
Hiện tại:
URL (VI, 2 cấp)
    ↓
nhiều implementation
    ↓
pageKey / permission / file / URL chồng nhau

Mục tiêu:
Page Identity
    ↓
IA
    ↓
Canonical Route Registry
    ↓
URL
    ├── Nav
    ├── Breadcrumb
    └── Permission binding
```

Bước tiếp: [`04_Solution.md`](04_Solution.md) — chưa được Owner khóa, chưa được implement.
