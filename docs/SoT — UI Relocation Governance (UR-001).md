# SoT — UI Relocation Governance (UR-001)

**Mã:** UR-001  
**Tầng:** Governance / Frontend Refactor  
**Trạng thái:** **KHÓA** — Owner 2026-07-24  
**Áp dụng:** User Web · Admin · mọi agent (Cursor) sửa UI  
**Neo Product:** `SoT — iFlux Product Architecture` (App Shell = khung dùng chung; Page chỉ consume)

> Khi yêu cầu chỉ là **đổi vị trí hiển thị** của một thành phần UI:  
> **di chuyển (move)**, không **thiết kế framework / mode / manager mới**.

---

## 0. Mục đích

Chặn over-engineering kiểu: thấy yêu cầu UI → tạo abstraction, mode, lifecycle, helper manager “cho chắc”.

Bài toán relocation **không** đổi ownership và **không** đổi business logic.  
Diff phải chứng minh **xóa chỗ cũ**, không chứng minh **kiến trúc mới**.

---

## UR-001 — UI Relocation Rule (bắt buộc)

Khi yêu cầu chỉ là thay đổi vị trí hiển thị của một thành phần:

1. **Ưu tiên reuse** App Shell / slot / class / API **đã có**.
2. **Cấm** tạo mode, manager, helper, lifecycle, state máy mới nếu **không** đổi ownership và **không** đổi business logic.
3. **Mục tiêu diff:** **xóa nhiều hơn thêm**. Nếu số dòng thêm vượt đáng kể số dòng xóa → **bắt buộc giải trình** vì sao mở rộng kiến trúc là bắt buộc; không giải trình được → **rollback** phần abstraction thừa.

---

## UR-002 — Câu hỏi review bắt buộc (trước khi viết code)

Agent / reviewer **phải** trả lời trước khi implement:

> **Đang thêm abstraction hay đang di chuyển ownership?**

| Trả lời | Hành vi được phép |
| --- | --- |
| Ownership **không** đổi (vd. vẫn App Shell header, chỉ đổi dữ liệu hiển thị) | Chỉ: đổi node · đổi selector · đổi binding · **xóa** HTML/CSS/JS chỗ cũ |
| Ownership **đổi** (vd. Page → App Shell; Feature A → Feature B; Owner mới có SoT) | Được mở rộng tối thiểu theo SoT Owner mới — vẫn ưu tiên reuse slot sẵn có |

Nếu ownership không đổi thì:

- **không** được thêm mode
- **không** được thêm lifecycle
- **không** được thêm state máy
- **không** được thêm helper manager / API public chỉ phục vụ một call-site

chỉ được:

- đổi node
- đổi selector
- đổi binding
- xóa chỗ cũ

---

## UR-003 — Ba mức (chuẩn / lệch / cấm)

### ✅ Mức đúng — Relocation

```text
Chỗ cũ (Page / chrome local)
    ↓
XÓA

Chỗ mới đã có (App Shell slot / class / API)
    ↓
Đổ dữ liệu vào node đã tồn tại
```

Thay đổi chủ yếu:

- bỏ HTML cũ
- đổi selector
- bind dữ liệu vào node đã tồn tại

**Kỳ vọng diff (hướng):** nghiêng về xóa (ví dụ −300 / +50), không +235 / −88.

### ⚠️ Mức lệch — Over-engineering (cấm khi ownership không đổi)

```text
App Shell
        │
        ├── Normal Mode
        └── Xxx Mode          ← mới
                │
                ├── API mới
                ├── CSS mới
                ├── state mới
                └── helper mới
```

Chức năng có thể vẫn chạy — nhưng đã tạo mode / state / helper / CSS / lifecycle chỉ để giải bài toán **thay chỗ hiển thị**.

### ❌ Mùi kiến trúc — helper một chỗ

Hàm chỉ phục vụ đúng một nơi (hoặc không được gọi) là mùi:

- `isXxxPage` tách riêng khi đã có selector/path
- `clearXxx` / `syncXxx` / `bindXxx` chỉ wrap một dòng binding
- API public (`window.Iflux….clear…`) không có consumer

Đáng lẽ: cập nhật node tại chỗ (`textContent`, `href`, `onclick`) hoặc một hàm render/update tối thiểu — **không** sinh API mới.

---

## UR-004 — Checklist trước khi coi task Relocation xong

- [ ] Đã **xóa** HTML/CSS/JS của chrome cũ (không để hai chỗ cùng hiển thị cùng dữ liệu).
- [ ] Dữ liệu đổ vào **slot App Shell / DS đã có** — không khung page song song.
- [ ] Không thêm `*Mode` / `*Manager` / `clear*` / `sync*` / `bind*` chỉ cho một call-site.
- [ ] Diff: dòng xóa ≥ dòng thêm, **hoặc** có giải trình Ownership/Business bắt buộc trong PR/tóm tắt (Owner duyệt).
- [ ] Self-audit: liệt kê hàm mới — nếu hàm nào “chỉ phục vụ đúng một nơi” mà không bắt buộc → **xóa trước khi merge**.

---

## UR-005 — Ví dụ neo (Comments header · 2026-07-24)

**Yêu cầu đúng:**

- Trang chi tiết bài viết: Header = SoT App Shell (sửa markup/shell sẵn có).
- Trang bình luận: nội dung back | title | likes nằm **trong** App Shell header; **xóa** chrome page cũ.

**Sai (đã xảy ra):** tạo Comments Mode + API/CSS/helper/lifecycle song song với shell sẵn có → net + nhiều / − ít.

**Đúng:** reuse `.ifx-topnav` + `[data-ifx-context-back]` + actions; xóa `ifx-cmt-page__head` (post); không framework header mới.

---

## UR-006 — Quan hệ SoT khác

| SoT | Quan hệ |
| --- | --- |
| Product Architecture | App Shell = khung dùng chung; Page không ôm chrome Shell |
| PG-1.0 | Plan Phase không được “nâng cấp kiến trúc” ngoài scope Phase |
| DS rules (User) | Chỉ class/token DS; relocation không invent CSS framework |

UR-001 **không** thay Product Architecture — chỉ khóa hành vi **refactor di chuyển UI**.

---

## UR-007 — Enforcement

- File SoT này = nguồn sự thật Governance.
- Cursor rule: `.cursor/rules/ui-relocation-governance.mdc` (`alwaysApply: true`) — agent **bắt buộc** tuân UR-001 trước mọi task đổi vị trí UI.
- Xung đột với habit agent (“viết framework cho chắc”) → **SoT này thắng**.
