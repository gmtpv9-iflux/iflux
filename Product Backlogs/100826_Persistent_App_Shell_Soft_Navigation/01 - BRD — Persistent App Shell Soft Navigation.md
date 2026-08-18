# BRD — Persistent App Shell & Soft Navigation (User Web)

**Epic:** `100826_Persistent_App_Shell_Soft_Navigation`  
**Date:** 2026-08-10  
**Status:** 🔒 **CLOSED** (2026-08-10) · P1 Soft Nav DONE · Close: [`04 - Close`](04%20-%20Close%20—%20Soft%20Navigation%20P1.md)  
**Gate:** P1 đã Implement + Verify + Close. P2+ không mở trong epic này.  
**Surface:** User Web App Shell (Header / Logo / Primary Navigation)  
**Constraint SoT:** Product Architecture V2 · Engineering Change Governance · UR-001  

## 1. Mục tiêu

Điều chỉnh trải nghiệm điều hướng User Web để người dùng cảm giác **App Shell (đặc biệt Header) luôn tồn tại**.

### Hiện tại (pain)

Khi click menu:

- Mỗi menu = document/page mới (MPA full reload).
- Browser destroy document → tạo Header mới.
- Logo resolve/bind lại từ SEO.
- Navigation khởi tạo lại.
- Cảm giác Header/logo “load lại” / nhảy vị trí.

### Trải nghiệm mục tiêu

Sau initial load:

> **Header phải có cảm giác luôn ở đó.**

Click `Nhà của tôi → Thị trường → Dòng tiền → Cộng đồng`:

- Header không biến mất.
- Logo không reload / không xuất hiện lại từ hidden.
- Navigation không remount.
- Header không nhảy vị trí.
- Chỉ nội dung bên dưới thay đổi.
- Active state menu đổi đúng.

**Header giữ nguyên trong cùng document/lifecycle.**

---

## 2. Solution định hướng (LOCKED hướng — chưa implement)

**Không** SPA hóa toàn bộ iFlux.  
**Không** React/Vue/Next.  
**Không** tự chế SPA framework / router nặng.

> **Persistent App Shell + Progressive Soft Navigation trên nền MPA hiện tại.**

- Direct URL / refresh / bookmark / SEO vẫn MPA.
- Internal link đủ điều kiện → soft navigation (progressive enhancement).
- `<a href>` semantic; JS off → full navigation fallback.

Flow mục tiêu soft-nav:

```text
User click internal link
  → intercept (nếu đủ điều kiện)
  → KEEP App Shell
  → Replace Page Outlet
  → Update URL/history
  → Update active nav
  → Init page-specific behavior
```

---

## 3–11. Ownership · Logo · Navigation · History · SEO · Perf · Code quality

(Xem chi tiết đầy đủ trong yêu cầu Owner — tóm tắt khóa:)

| # | Khóa |
|---|------|
| 3 | App Shell lifecycle > Page; Header/Logo/Nav persistent |
| 4 | Logo = Shell Asset; resolve 1 lần / session document; soft-nav không re-fetch/recreate logo |
| 5 | Giữ `<a href>`; soft-nav = progressive enhancement |
| 6 | Active từ canonical route; không hardcode từng page |
| 7 | `pushState` / Back-Forward; **không** routing framework mới |
| 8 | SEO + MPA coexist bắt buộc |
| 9 | Không preload mọi page / không bundle toàn hệ; chỉ load target page cần |
| 10 | Reuse · không nhân bản · net complexity không tăng vô lý |
| 11 | Mục tiêu = lifecycle Header persistent — **không** phải animation |

---

## 12–13. Audit (bắt buộc trước code)

Deliverable: [`02 - Audit — Persistent Shell Soft Navigation.md`](02%20-%20Audit%20—%20Persistent%20Shell%20Soft%20Navigation.md)

**Cấm code** cho đến khi Owner duyệt Proposed Architecture trong audit.

---

## 14. Implementation constraint (khi được mở)

```text
Existing architecture → Reuse → Minimal change
  → Remove obsolete duplication
  → Persistent Shell → Soft Navigation
  → MPA fallback preserved
```

Không mở rộng redesign toàn frontend.

---

## 15. Definition of Done (tóm tắt)

- UX: Header/logo/nav persistent; chỉ outlet + active đổi.
- Architecture: không SPA-only; không framework mới; reuse ownership.
- Perf: không reload shell assets / không SEO logo mỗi soft-nav; có evidence network.
- Reliability: direct URL, refresh, Back/Forward, new tab, JS-off fallback; không leak listener/timer.
- Code: không copy Header/nav; tối thiểu; xóa dead nếu an toàn.

---

## 16. Nguyên tắc cuối

> Load App Shell một lần; giữ sống trong session/document; internal nav chỉ đổi Page Content + URL + active navigation.

Solution đơn giản nhất, tận dụng code hiện hữu, không nhân bản, không framework, không tăng tải; nếu bắt buộc thêm nhiều code → **dừng và giải thích** blocker architecture.
