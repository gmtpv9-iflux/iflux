# Final Verification Report — Admin Menu AppShell Behavior Standardization

**Task:** `180826_Admin Menu AppShell Behavior Standardization`  
**Ngày:** 18/08/2026  
**Status:** **Implementation Verified / Ready for Closure**  
**Authority:** BRD → SoT → D-01…D-04 → Solution Rev 2 → Plan LOCK  
**Lệnh Owner:** Staging Verification & Closure — không sửa architecture, không refactor

---

# 1. Deploy

| Hạng | Giá trị |
|---|---|
| Worktree | `iFLUX_P1` · branch `staging` |
| Commit | `7ce55f9` — `feat(admin): persist AppShell across internal Admin navigation` |
| Kênh | GitHub `staging` → `deploy-staging.yml` → Staging 1 |
| Live release | `20260818171337-7ce55f99eb3c` |
| Frontend live | symlink Staging 1 trỏ đúng release trên |
| Backend live | cùng release id · health `env=staging` |
| Runtime | https://staging.iflux.vn |

**Không đụng:** Express · `PAGES` · Route Registry · IA · Permission Identity · file/registry/router mới · Solution · D-01…D-04.

---

# 2. Cách đo persistence (runtime, không suy từ code)

Trên Chrome headless, session Admin hợp lệ, cùng một document:

```text
document.documentElement[data-ix-admin-shell-boot]
header [data-ix-admin-shell=header][data-ix-admin-instance]
aside  [data-ix-admin-shell=sidebar][data-ix-admin-instance]
[data-ix-admin-page-host]  → path + H1
window.__persist.header / .menu  = cùng node DOM sau mỗi bước
```

Nếu AppShell boot lại, `window.__persist` mất và boot id đổi.

---

# 3. T-03 — Long Navigation Persistence · **PASS**

Chuỗi Menu thật (click `a.ix-menu-item[data-ix-route]`):

```text
A  /admin/overview                 Tổng quan
→ B  /admin/orders/list            Danh sách đơn hàng
→ C  /admin/administrators/list    Danh sách Quản trị viên
→ D  /admin/requests/partnership   Yêu cầu hợp tác
→ A  /admin/overview               Tổng quan
```

| Đo | Expected | Actual |
|---|---|---|
| AppShell boot id | không đổi | `ix1787048371083` × 5 |
| Header instance | không đổi | `ix1787048371083` × 5 · cùng node |
| Menu instance | không đổi | `ix1787048371083` × 5 · cùng node |
| Page Host | đổi theo Page | 5 H1 khác nhau đúng Page · path khớp |
| `__persist` | còn sống | còn |

Không dùng kết luận “code cho thấy navigate không reload”. Đây là evidence runtime trên Staging.

---

# 4. T-10 — Browser Back / Forward · **PASS**

Cùng session, sau T-03 (đang ở Overview):

```text
A  /admin/overview
→ B  /admin/orders/list
→ C  /admin/administrators/list
→ Back     /admin/orders/list      Danh sách đơn hàng
→ Back     /admin/overview         Tổng quan
→ Forward  /admin/orders/list      Danh sách đơn hàng
→ Forward  /admin/administrators/list  Danh sách Quản trị viên
```

| Đo | Expected | Actual |
|---|---|---|
| `popstate` | 4 lần (Back×2 + Forward×2) | `popCount` 0 → 4 |
| Path | khớp chuỗi trên | khớp |
| Host H1 sau settle | khớp Page | khớp (đo lại +2s sau mỗi popstate) |
| Boot id | giữ nguyên | `ix1787048403392` suốt chuỗi (session đo lại) |
| Header / Menu node | không recreate | `headerSame` / `menuSame` = true |

`popstate` → canonical path → Host đổi. AppShell không boot lại.

Ghi chú đo: URL đổi trước, Host H1 cập nhật sau fetch Page. Đo title ngay khi path đổi có thể thấy title cũ; sau ~2s title đúng. Không phải reload document.

---

# 5. Bổ sung cùng session · **PASS**

### Disclosure persistence

```text
Expand Parent A = Khách hàng (users-list)
→ Navigate /admin/orders/list
→ Parent A vẫn Expanded
```

```text
Expand Parent B = Cấu hình thị trường (cùng module Thị trường với Quản lý Thực thể)
→ Parent A (Thực thể) Collapsed
→ Parent B Expanded
```

`users-list` (module khác) vẫn Expanded — accordion chỉ trong cùng Module.

### Active Page không tự mở Parent

```text
Navigate /admin/users/list khi mọi Parent đang đóng
→ path = /admin/users/list
→ openParents = []
```

### RBAC / `gateMenu`

```text
Expand Khách hàng
→ IfluxAdminRbac.refresh() → applyGates → gateMenu
→ Parent vẫn Expanded  [users-list]
```

---

# 6. Completion Gate

| Cổng | Kết quả |
|---|---|
| T-01 … T-22 | T-03 / T-10 **Staging runtime PASS**. T-01/T-02/T-04 + T-07/T-08/T-09/T-15 có evidence Staging trong cùng session. Các T còn lại giữ kết quả Implementation Completion (`06`) — contract + local Chrome |
| AC-01 … AC-20 | AC-19 đóng bởi T-03 + T-10 Staging. AC-01…AC-18 / AC-20 giữ `06` |
| Staging runtime evidence | Có — commit `7ce55f9` trên https://staging.iflux.vn |
| T-03 PASS | **PASS** |
| T-10 PASS | **PASS** |
| Scope audit | **PASS** — không sửa Express / PAGES / Registry / IA / Permission Identity |
| No regression | Không thấy reload AppShell, không mất disclosure, không reset RBAC |
| Không refactor sau PASS | Đúng — không có diff code sau deploy |

```text
BRD = không đổi
SoT = không đổi
D-01…D-04 = không đổi
Solution = không đổi
PAGES = không đổi
Route Registry = không đổi
Express = không đổi
IA = không đổi
Permission Identity = không đổi
```

---

# 7. Đề xuất

**Đóng Task** `180826_Admin Menu AppShell Behavior Standardization`.

Implementation Scope đã được Owner chấp nhận. T-03 và T-10 đã có runtime evidence trên Staging với session Admin. Không còn hạng verification bắt buộc của lệnh này.
