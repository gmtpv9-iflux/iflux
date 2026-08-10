# Close — Persistent App Shell Soft Navigation · P1

| | |
| --- | --- |
| **Epic** | `100826_Persistent_App_Shell_Soft_Navigation` |
| **Status** | 🔒 **CLOSED** (Owner: đóng task — 2026-08-10) |
| **Phase đóng** | P1 Soft Navigation (allowlist) + layout residue fix |

---

## Delivered

| Item | Evidence |
| --- | --- |
| Soft-nav coordinator | `User_Web/iflux-web-ui/runtime/soft-navigation.js` |
| Allowlist | Nhà / Thị trường / Dòng tiền / Cộng đồng (index) / Gói cước |
| Persistent Header/Logo | Soft: `bindLogo: false`; không remount shell |
| Writer soft path | `shell-url-writer.js` `opts.soft` |
| GuestShell idempotent | `iflux-guest-shell.js` |
| Layout residue fix | `page-runtime.js` clear `ifx-mkt-layout` / `ifx-hub-grid` trước remount |
| Deploy | Production + Cloudflare purge · cache `softNavLayoutFix20260810` |

---

## Explicitly out of closed scope (không mở lại trong close này)

- Soft-nav Account / Write / Comments / Share / entity detail (P2+)
- Gộp 25 HTML thành 1 shell host (P4)
- Admin soft-nav
- Animation chuyển trang

---

## Next

Task mới độc lập: `100826_AppShell_Sidebar_Scroll_Behavior` (BRD → Mandatory Audit).
