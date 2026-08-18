# Remediation — Page Host flex role (Header height)

**Task:** `180826_Admin Menu AppShell Behavior Standardization`  
**Ngày:** 18/08/2026  
**Status:** Remediation deployed — **chưa đóng Task · không PASS**  
**Audit:** `08_Audit_Header_Height_Regression.md`  
**Authority:** BRD → SoT → D-01…D-04 → Solution Rev 2 → Plan LOCK  

---

# 1. Diff

Chỉ 2 file:

| File | Thay đổi |
|---|---|
| `Admin_Design_system/iflux-admin-ui/components.css` | Thêm rule `[data-ix-admin-page-host]` đúng correction LOCK |
| `Admin_Design_system/iflux-admin-ui/iflux-admin-ui.css` | Cache-bust import `components.css?v=hostFlex20260818` |

Không sửa: Header CSS, extract/swap, Express, `PAGES`, Registry, IA, Permission Identity, Page HTML/JS.

Commit: `55e45b7`  
Staging live: `20260818175817-55e45b76a787` · https://staging.iflux.vn

---

# 2. Local runtime (không thay Staging Owner test)

Cùng document, local static + `navigate()`:

| Đo | Kết quả |
|---|---|
| Withdrawals Header | 64px |
| Overview Header (sau nav) | 64px (trước remediation: 37px) |
| Host | `flex: 1 1 0%` · `min-height: 0` · `overflow: hidden` |
| Page cao (content 2910px) | `.ix-content` scrollTop=400 · `window.scrollY=0` · Header vẫn 64 |
| Header / Menu node | cùng node · boot id không đổi |

Đây **không** phải Staging PASS.

---

# 3. Test Owner phải chạy trên Staging

Hard refresh (Cmd+Shift+R) trên https://staging.iflux.vn sau khi đã login Admin.

DevTools → chọn `header.ix-navbar` → xem **rendered box**, không chỉ hover rule `height: var(--ix-navbar-h)`.

### R-01 — Withdrawals vẫn đúng

```text
Mở /admin/requests/withdrawals
```

Expected: Header **975-class × 64px** (hoặc ~63–64, không ~43).

### R-02 — Overview không còn co

```text
Từ Withdrawals, click Menu → Tổng quan
(/admin/overview)
```

Expected:

```text
Header box = ~64px  (không 42.969 / không 37)
cùng Header node
cùng Menu node
AppShell không reload
```

### R-03 — Page cao: scroll trong .ix-content

Trên Overview (hoặc Page dài bất kỳ):

```text
Cuộn nội dung Page
```

Expected:

```text
Scroll xảy ra trong .ix-content
window / body không scroll
Header giữ ~64px khi đang cuộn
```

### R-04 — Chuỗi nav không unload

```text
Overview → Đơn hàng → Withdrawals → Overview
```

Expected: Header luôn ~64px; boot / Header / Menu không recreate.

### R-05 — F5 Overview

```text
Hard refresh /admin/overview
```

Expected: Header ~64px ngay document đầu (không chỉ sau nav).

---

# 4. Cách đo

```text
header.getBoundingClientRect().height   → ~64
computed --ix-navbar-h                  → 64px
parent Header                           → main.ix-main
Header không nằm trong [data-ix-admin-page-host]
```

Hover rule `height: 64px` **không đủ**. Phải đọc box overlay / getBoundingClientRect.

---

**Không kết luận Task PASS.** Chờ Owner xác nhận R-01…R-05 trên Staging.
