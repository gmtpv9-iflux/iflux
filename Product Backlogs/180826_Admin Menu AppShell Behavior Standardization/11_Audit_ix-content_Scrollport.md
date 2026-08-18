# Audit — `.ix-content` không phải scrollport

**Task:** `180826_Admin Menu AppShell Behavior Standardization`  
**Ngày:** 18/08/2026  
**Status:** Audit only — **không fix · NOT PASS**  
**Owner:** thân trang không rê chuột được; không phải Header  

Runtime: https://staging.iflux.vn · viewport 1280×800 · wheel +600px  

---

# 1. Kết luận

Lỗi nằm ở **cụm Host → `.ix-content`**, không ở Header.

Trước task, `.ix-content` là **con flex trực tiếp của `main`**: `flex: 1; min-height: 0; overflow-y: auto` — đây là **ô cuộn duy nhất**. `html/body/main` đều `overflow: hidden`.

Sau `ensurePageHost`, `.ix-content` bị bọc:

```text
main.ix-main          overflow: hidden; height: 100vh
  header.ix-navbar
  [data-ix-admin-page-host]   display: block; overflow: visible; cao = content
    .ix-content               overflow-y: auto  nhưng cao = content
    (node sau .ix-content)
```

`.ix-content` **phồng theo nội dung** → `clientHeight === scrollHeight` → `overflow-y: auto` **không tạo thanh cuộn**.  
Phần thừa bị `main` cắt. `html/body` cũng `overflow: hidden`. Wheel **không đi đâu được**.

---

# 2. Đo Staging — Overview (Page cao, không cuộn)

| Ô | overflow | clientH | scrollH | canScroll |
|---|---|---|---|---|
| `html` / `body` | hidden | — | — | không (window.scrollY=0) |
| `main.ix-main` | **hidden** | 800 | **1152** | có nội dung thừa, **bị cắt** |
| `[HOST]` | visible | 1115 | 1115 | không |
| `.ix-content` | auto | **1115** | **1115** | **không** |

Wheel +600 trên thân trang:

```text
window.scrollY     0 → 0
.ix-content.scrollTop  0 → 0
Host.scrollTop     0 → 0
moved = false
```

`.ix-content.parent` = `DIV[HOST]`, không còn là `MAIN.ix-main`.

---

# 3. Cụm sau `</div>` của `.ix-content` (bên trong Host)

| Page | Sau `.ix-content` | Ảnh hưởng scroll? |
|---|---|---|
| Overview | `svg#SvgjsSvg1001` (Apex leftover, `position:absolute`, h=0) | Không chặn pointer. Không phải nguyên nhân. |
| Partnership | `#req-modal.ix-modal-overlay` `display:none` | Không. |
| Withdrawals | **không có** sibling | — |

`pointer-events` trên `.ix-content` = `auto`. Không bị overlay che.

---

# 4. Vì sao Withdrawals “bình thường”

Host / `.ix-content` ≈ **495px** < 800px. Không cần cuộn → không phát hiện kẹt. Cùng contract hỏng.

Partnership trên viewport 800: Host 532 — cũng vừa. Owner thấy kẹt khi nội dung/viewport vượt.

---

# 5. Nguyên lý

```text
Scroll AppShell = CHỈ .ix-content
điều kiện: .ix-content phải bị giới hạn chiều cao (flex item của main)

sau wrap:
  Host không giới hạn chiều cao (block, min-height:auto)
  .ix-content flex:1 vô hiệu (cha không phải flex / Host không phải flex slot)
  .ix-content cao = hết bài
  overflow-y:auto không kích hoạt
  main overflow:hidden cắt phần dưới
  rê chuột = không-op
```

Header co (Audit 08/10) và thân không cuộn là **cùng một chỗ**: Host cắt flex slot của `.ix-content`. Header chỉ là triệu chứng.

Rule Host flex (`55e45b7`) **vẫn chưa vào cascade Staging** (Audit 10 — Cloudflare giữ `iflux-admin-ui.css` cũ).

---

# 6. Không làm

Không sửa Header. Không đoán CSS mới. Không implement trong audit này.
