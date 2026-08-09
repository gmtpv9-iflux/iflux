# Phase C — Mẫu báo cáo PASS (khóa)

**Trạng thái:** 🔒 Owner khóa 2026-07-26  
**Cập nhật:** Page Coverage · Permission Delta · Scope đầu report · Final Audit checklist  
**Mục đích:** Mỗi Phase C có bằng chứng độc lập · Final Audit chỉ **ghép**.

---

## Rule phạm vi — BẮT BUỘC (giữ đến Final Audit)

**Một Phase C chỉ được phép làm đúng 1 page/module Matrix.**

| Được | Không được |
|------|------------|
| Đóng NO_EP của **1** page | Tiện tay sửa page/module khác |
| API + `requirePermission` + UI gate của page đó | Cleanup / dọn code ngoài cụm |
| Re-audit + đủ phần mẫu | Refactor / rename / optimize “tiện thể” |

```text
1 page → đúng page đó → xong → PASS
```

Vi phạm → **không** PASS · tách phase hoặc revert phần ngoài phạm vi.

---

## Trình tự

```text
Owner mở Cn (1 page)
  → Implement chỉ page đó
  → Re-audit
  → Điền đủ phần bắt buộc
  → PASS
  → Mới mở C(n+1)
```

---

## Phần bắt buộc (mọi Phase C PASS)

### 0. Scope (đầu report — reviewer 10 giây)

```text
Page:        <module.page>
Permissions: view | … (list keys của page)
Routes:      n
Out of scope: mọi page/module khác (liệt kê nhóm nếu cần: market.* · …)
```

### 1. Progress tổng

| Metric | Giá trị |
|--------|---------|
| Matrix Coverage | **y%** |
| NO_EP còn lại | **n** |
| DEAD | **14** (giữ theo SoT) |

### 2. Page Coverage (tách riêng)

| Metric | Value |
|--------|------:|
| Matrix pages | **70** |
| Fully enforced | **p** |
| Remaining | **70 − p** |

### 3. Permission Delta (đối chiếu 211 keys)

```text
Matrix keys              211
Enforced permissions
  ↓ trước phase          a
  ↓ sau phase            b     (+Δ)
NO_EP
  ↓ trước                x
  ↓ sau                  y
```

### 4. Delta tổng (chuỗi nối Final Audit)

```text
211 keys → 56 (A/B) → 62 (C1) → 67 (C2) → 73 (C3) → …
```

### 5. Coverage delta (tóm tắt %)

- Matrix Coverage: **x% → y%**
- NO_EP: **x → y**

### 6. Route Coverage — FAIL = 0

### 7. Permission Coverage — n → 0 NO_EP (cụm) · **liệt kê từng key**

```text
Page:  <module.page>
NO_EP: n → 0

  view
  create
  …
```

*(Bắt buộc liệt kê đủ key của page — Final Audit chỉ ghép, không tự tính.)*

### 8. Regression — 200/403 theo role

### 9. Issue found — Có/Không (+ Evidence/Fix/Re-test)

---

## Final Audit (khi NO_EP = 0 · đóng task)

Chỉ **ghép** Progress/Delta/Page Coverage từ các Cn + bảng tổng:

| Tiêu chí | Kết quả |
|----------|---------|
| Matrix pages | 70/70 PASS |
| Permission keys | 211/211 PASS |
| Route Coverage | PASS |
| Permission Coverage | PASS |
| Regression Coverage | PASS |
| UI Gate Coverage | PASS |
| Server Enforce | PASS |
| Fail-open | PASS (không còn) |
| DEAD | Đúng quyết định Owner |
| NO_EP | **0** |
| Human Control SoT | PASS |
| Admin Model | PASS |
| Production Deploy | PASS |

→ Đây là báo cáo **đóng task** Admin RBAC.

---

## Tham chiếu

- C1 … C7 · C8 [`PhaseC-NOEP8-PASS.md`](./PhaseC-NOEP8-PASS.md)
- Backlog [`Audit-NOEP-DEAD-List.md`](./Audit-NOEP-DEAD-List.md)
- SoT [`Owner-Decision-Matrix-SoT.md`](./Owner-Decision-Matrix-SoT.md)

**Cụm kế tiếp (Owner mở):** C9 — gợi ý `ai.prompts` — **không** nhảy `market.stocks`.
