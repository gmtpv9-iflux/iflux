# 03a — SoT Amendment — Post-Foundation Scope Reconciliation

| | |
| --- | --- |
| **Task ID** | `100826_AppShell_Sidebar_Scroll_Behavior` |
| **Document** | SoT **Amendment proposal** — chưa Owner-lock |
| **Status** | 🔒 **OWNER APPROVED (2026-08-11)** — D1: mở rộng scope theo đề xuất §2/§3 dưới đây |
| **Amends** | [`03 - SoT`](03%20-%20SoT.md) §4 Sidebar Ownership Matrix · §24 Scope Boundary |
| **Trigger** | [`02b - Audit Amendment`](02b%20-%20Audit%20Amendment%20—%20Post-Foundation%20Convergence.md) — facts renderer/ownership đã đổi sau Foundation CLOSED |
| **Authority** | Agent **không tự lock** SoT (SOt-21 cấm implementation leakage / tự sửa SoT) — đây là **đề xuất**, cần Owner xác nhận trước khi Solution/Plan được coi là final |

---

## 1. Vấn đề

`03 - SoT` (khoá 2026-08-10) §4 Ownership Matrix + §24 Scope Boundary ghi:

* **IN SCOPE:** Thị trường Left Sidebar, Nhà Left Sidebar (2 surface duy nhất — cả 2 dùng `ensureSections()`).
* **OUT OF SCOPE:** Community Right Sidebar (Page-owned tại thời điểm đó), Stock sticky, Pricing sticky.
* **Không đề cập:** Flow Left, ELP Left (stocks/sectors/ecosystems/cau-chuyen), Stock Detail Section, Group Section (sector/eco/cau-chuyen-detail) — vì tại thời điểm Audit `02` (2026-08-10), các surface này **chưa** dùng `ensureSections()` (bị audit là "tự dựng riêng", xem `02` §2).

**Sau khi Foundation `100826_..._Reuse_Foundation` CLOSED (2026-08-11):** 5/7 surface trên đã **converge sang chính renderer AppShell `ensureSections()`** mà Market/Nhà đang dùng (evidence: `02b` §2, đã Owner PASS từng Wave trong Foundation `05 - Plan.md`).

Theo SOt-20 ("No Scope Expansion by Similarity"): việc converge renderer **không tự động** đưa các surface này vào scope — nhưng theo chính định nghĩa SoT §12 (SOt-08: "Capability phải áp dụng cho AppShell-owned Sidebar → Shared behavior → All valid AppShell consumers") và §6 (SOt-02: "Bất kỳ Page mới nào sử dụng cùng AppShell Left Sidebar architecture đều phải consume capability này") — **một khi renderer đã thực sự là AppShell `ensureSections()` (không còn "tương tự" mà là "chính nó"), các surface đó đúng theo định nghĩa đã trở thành AppShell Sidebar consumer**, không phải "trông giống" nữa.

---

## 2. Đề xuất cập nhật §4 Ownership Matrix

| Sidebar / Surface | Current Owner (`03` 2026-08-10) | **Đề xuất Owner (2026-08-11)** | Renderer evidence (`02b`) | Đề xuất Task Scope |
| --- | --- | --- | --- | --- |
| Thị trường Left Sidebar | AppShell | AppShell — không đổi | `ensureSections()` | **IN SCOPE** (không đổi) |
| Nhà Left Sidebar | AppShell | AppShell — không đổi | `ensureSections()` | **IN SCOPE** (không đổi) |
| **Flow (Dòng tiền) Left Sidebar** | *(chưa có trong matrix)* | **AppShell** (mới) | `widgets/flow-page/index.js` `ensureSections()` — Foundation Wave 2a CONVERGE | **Đề xuất IN SCOPE** |
| **ELP Left Sidebar** (co-phieu/nganh/he-sinh-thai/cau-chuyen list) | *(chưa có)* | **AppShell** (mới) | `widgets/entity-list-page/index.js` `ensureSections()` — Wave 2c CONVERGE (4 route, 1 module) | **Đề xuất IN SCOPE** |
| **Community Right Sidebar** | Community Page (Page-owned) | **AppShell** (đổi) | `community-page.js` qua bridge `ensureSections('sidebar-right')` — Wave 2b CONVERGE | **Đề xuất IN SCOPE** (đổi từ OUT) |
| **Stock Detail Left Section** (candlestick vẫn PAGE_OWNED riêng) | *(chưa có)* | **AppShell** (Section only, mới) | `stock-page.js` qua bridge — Wave 3b CONVERGE (Section); candlestick/header vẫn PAGE_OWNED | **Đề xuất IN SCOPE** (chỉ phần Section host) |
| **Group Section** (sector/eco/cau-chuyen-detail, share module) | *(chưa có)* | **AppShell** (Section only, mới) | `group-page.js` qua bridge — Wave 3b CONVERGE | **Đề xuất IN SCOPE** (chỉ phần Section host) |
| Stock sticky (`.ifx-stock-col--left` page column, KHÔNG phải Section host) | Stock Page (Page-owned) | Page-owned — không đổi | Sticky vẫn ở page column, ngoài Section | **OUT OF SCOPE — không đổi** (F-03 vẫn đúng) |
| Pricing sticky | Pricing Page | Page-owned — không đổi | — | **OUT OF SCOPE — không đổi** |
| CommunityPost aside (story) | Page-owned | Page-owned — không đổi | Foundation VR-CP: PAGE_OWNED, không có Widget Host | **OUT OF SCOPE — không đổi** |

**Không đổi:** Stock/Pricing sticky, CommunityPost aside — Foundation **không** converge các surface này (đúng theo Foundation `04 - Solution.md` §4A: VR-05/06/CP vẫn PAGE_OWNED).

---

## 3. Đề xuất cập nhật §24 Scope Boundary

```text
ĐỀ XUẤT IN SCOPE (thay 2 → 6 surface):
AppShell
├── Left Sidebar
│   ├── Thị trường
│   ├── Nhà
│   ├── Flow (Dòng tiền)
│   ├── ELP (co-phieu / nganh / he-sinh-thai / cau-chuyen)
│   ├── Stock Detail (chỉ Section host — candlestick/header vẫn PAGE_OWNED, KHÔNG áp behavior lên candlestick)
│   └── Group (sector / eco / cau-chuyen-detail — chỉ Section host)
│
├── Right Sidebar
│   └── Community (Section `sidebar-right`)
│
├── Shared Sidebar scroll behavior (1 module, áp dụng đồng nhất qua contract `[data-ifx-section]`)
├── Sidebar geometry (per-surface, height khác nhau — đã đo 1 phần ở `02` §4)
├── Bidirectional scroll behavior
├── Reverse synchronization
├── 24px trigger
├── Main/Sidebar synchronization
└── Responsive AppShell compatibility

KHÔNG ĐỔI — VẪN OUT OF SCOPE:
Stock/Pricing page sticky (ngoài Section host)
CommunityPost aside
Sidebar content redesign / Navigation / Header / Routing
```

---

## 4. Vì sao đề xuất mở rộng (không giữ nguyên 2 surface)

1. **SOt-19 (Reuse before new implementation):** nếu chỉ áp dụng cho Market/Nhà, và sau này mở rộng riêng cho Flow/ELP/Stock/Group từng lần, sẽ phải audit + Solution + Plan **lại từ đầu cho từng surface** — trái nguyên tắc "shared behavior once" mà cả 2 task (Foundation §30 + Scroll SoT §12) cùng theo đuổi.
2. **Foundation đã trả giá đúng loại evidence mà SoT §26 Q9 yêu cầu** ("Làm thế nào dùng chung cho AppShell Sidebar consumers?") — câu trả lời tốt nhất bây giờ là: **9 surface đã dùng đúng 1 contract**, viết 1 module áp lên contract đó là đủ, không cần biết renderer gốc của từng page.
3. **Rủi ro nếu KHÔNG mở rộng:** Solution phải viết mã "chỉ áp dụng cho 2 selector cụ thể của Market/Nhà" — 5 route còn lại (Flow/ELP×4/Community/Stock/Group×3 = 9 route) tiếp tục có pain đúng như BRD mô tả (`02b` §4 xác nhận Flow/Community đã đo geometry Case C — pain **có thật, đã đo**), nhưng không được fix, dù hạ tầng đã sẵn 100%.
4. **Rủi ro nếu mở rộng nhưng KHÔNG xin Owner duyệt trước:** vi phạm SOt-20/21/CG-030 — đây là lý do tài liệu này tồn tại (để Owner tự quyết, không phải Agent tự suy diễn).

---

## 5. Nếu Owner KHÔNG đồng ý mở rộng

Solution/Plan vẫn **valid** với scope hẹp — chỉ cần đổi 1 tham số (danh sách selector áp dụng) ở bước wiring cuối, kiến trúc module không đổi. Tài liệu `04 - Solution` được viết theo hướng **generic-by-contract** đúng vì lý do này — không phụ thuộc vào quyết định scope này để mô tả cơ chế.

---

## 6. Amendment DoD

* [x] Xác định đúng 7 surface đổi renderer sau Foundation (Flow/ELP/Community-right/Stock/Group — 5 dòng mới/đổi trong Matrix)
* [x] Không đổi surface vẫn PAGE_OWNED (Stock/Pricing sticky, CommunityPost)
* [x] Trình bày rõ trade-off / rationale, không tự quyết
* [x] **Owner xác nhận scope (D1 = mở rộng)** — 2026-08-11

**Trạng thái: LOCKED.** §2/§3 (Ownership Matrix + Scope Boundary mở rộng) chính thức thay thế `03` §4/§24 cho task này. `03` gốc giữ nguyên làm lịch sử, không sửa trực tiếp — `03a` là amendment layer đè lên.
