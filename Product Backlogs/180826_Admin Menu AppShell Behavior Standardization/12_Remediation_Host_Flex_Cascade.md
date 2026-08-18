# Remediation — Host flex cascade (55e45b7)

**Task:** `180826_Admin Menu AppShell Behavior Standardization`  
**Ngày:** 18/08/2026  
**Status:** Cascade đã mở trên Staging — **không tự PASS · chờ Owner R-01…R-06**  
**Authority:** BRD → SoT → Solution Rev 2 → Plan LOCK  

---

# 1. Phân biệt: fix sai vs chưa cascade

| | Audit 10 (Owner verify fail) | Sau bước này |
|---|---|---|
| Origin `55e45b7` | Đã có rule Host | Không đổi CSS |
| HTTPS `iflux-admin-ui.css` | CF HIT · import **`?v=seoBrandLogo36px20260810`** | import **`?v=hostFlex20260818`** |
| Host computed | `display:block; flex: 0 1 auto` | `display:flex; flex: 1 1 0%` |

**55e45b7 không sai.** Rule đúng, chưa vào cascade (bundle không cache-bust, CF `max-age=14400`).

Không thêm CSS Header. Không commit mới. Đã purge cache CDN cho 4 URL Admin UI CSS trên Staging.

---

# 2. Contract đã apply (Chrome Staging, viewport 1280×800)

```text
main.ix-main          height 800px; overflow hidden
  header.ix-navbar    getBoundingClientRect().height = 64
  [data-ix-admin-page-host]
    display        = flex
    flex           = 1 1 0%
    flex-direction = column
    min-height     = 0px
    overflow       = hidden
    clientHeight   = 736
    scrollHeight   = 736
    └── .ix-content
          display      = block
          flex         = 1 1 0%
          min-height   = 0px
          overflow-y   = auto
          parent       = Host
```

Stylesheet runtime: `iflux-admin-ui.css` → `./components.css?v=hostFlex20260818`

---

# 3. Evidence bắt buộc

## Overview (Page dài) — trước / sau wheel

| | Trước | Sau wheel +700 |
|---|---|---|
| Header height | **64** | **64** |
| `.ix-content.clientHeight` | 736 | 736 |
| `.ix-content.scrollHeight` | **1115** | 1115 |
| `.ix-content.scrollTop` | **0** | **379** |
| `window.scrollY` | **0** | **0** |

`clientHeight < scrollHeight` trên Overview. Scrollport = `.ix-content`. body/window không scroll.

## Withdrawals

Header **64**. Host 736. `.ix-content` 736/736 (bài ngắn — không cần cuộn).

## Nav (cùng document)

Overview → Orders → Withdrawals → Overview  
boot `ix1787052875585` · Header/Menu **cùng node** · Header luôn 64 · Host swap đúng title.

## Back/Forward

A Overview → B Orders → C Partnership → Back → Back → Forward → Forward  
cùng boot · Header 64 · path khớp.

## F5 `/admin/overview`

Document mới (đúng F5). Header **64**. Wheel: `scrollTop` 0 → **379**, `window.scrollY` = 0.

---

# 4. Owner phải test trên Staging

**Hard refresh** (Cmd+Shift+R) — bundle `iflux-admin-ui.css` không có `?v=` trên HTML.

| ID | Làm | Expected |
|---|---|---|
| **R-01** | `/admin/requests/withdrawals` | Header ≈ 64px |
| **R-02** | `/admin/overview` | Header ≈ 64px; `.ix-content` client < scroll nếu Page dài |
| **R-03** | Overview, wheel xuống | `scrollTop` tăng; `window.scrollY` = 0; Header ≈ 64 |
| **R-04** | Overview → Đơn hàng → Withdrawals → Overview | Header 64; Host đổi Page; AppShell/Menu không recreate |
| **R-05** | A→B→C Back Back Forward Forward | Header 64; cuộn được; không reload document |
| **R-06** | F5 `/admin/overview` | Header 64; cuộn được ngay sau load |

R-03 là test quan trọng nhất.

**Không kết luận Task PASS.**
