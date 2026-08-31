# Gate P2 — RESTORE (không triển khai lại)

| Field | Value |
| --- | --- |
| Ngày | 2026-08-31 |
| Lệnh Owner | P2 IMPLEMENTATION = REJECTED. Restore về trước P2. Giữ P0/P1 PASS. Không fix chồng. Không P3. |
| Kết luận | **P2 = NOT IMPLEMENTED.** P2 delta runtime = 0. P0/P1 giữ nguyên. |

## 1. Baseline trước P2

P1 và P2 bị gộp một commit — không `git revert 9ef3dff` được (sẽ mất P1).

| Commit | Vai trò |
| --- | --- |
| `1c0e3fa5abc6df6fd4ac844350ccb2f983230e60` | **Baseline trước mọi runtime Sub-02.** Message: Revert Form field anatomy / Drawer form surface. |
| `9ef3dff05a0b8f4a3dac2a755ac53f6a3eb8d258` | First Sub-02 deploy — **P1 infra + P2 layout lẫn**. Không revert nguyên commit. |
| `8ce57272511a6bf23e2475306fa4c9362cf47594` | P2 “theme fix” — overlay thêm (`entry.css`, `@import` ui.css, cache-bust). **Loại hết.** |

Trạng thái sạch = working tree runtime **= `1c0e3fa` + chỉ phần P0/P1** từ `9ef3dff`.

## 2. Cách restore (không code mới mô phỏng cũ)

1. `git checkout 1c0e3fa --` Header / Sidebar / `iflux-admin-ui.css` / `hub.html` / `Admin_Design_system/app` / auth+patterns+sandbox bị cache-bust P2.
2. Xóa file P2-only: `platform/admin/shell/layout.css`, `platform/admin/shell/entry.css`.
3. Cắt hàm P2 khỏi `iflux-admin-app-shell.js` (`ensureCanonicalAssets`, `ensureLayoutFrame` + gọi trong `bootHost`). **Giữ** resolver/guard/allowlist P1.
4. `document.html` không có ở `1c0e3fa`; bản đầu trong `9ef3dff` đã là P2. Strip về persist P1: marker + `.ix-root` / `.ix-layout` / sidebar / `main.ix-main` / `.ix-navbar` / host trống. Không `data-theme`, không DS link, không `layout.css`, không `ifx-*`, không header-region.
5. Không đụng `backend/src/app.js`, allowlist JSON, `admin-canonical-rewrite.inc`, [`gates/P0.md`](P0.md), [`gates/P1.md`](P1.md), [`05_Plan.md`](../05_Plan.md).

## 3. File trở về baseline `1c0e3fa` (P2 delta = 0)

| Path | Hành động |
| --- | --- |
| `Admin_Design_system/iflux-admin-ui/iflux-admin-app-shell-header.js` | checkout `1c0e3fa` |
| `Admin_Design_system/iflux-admin-ui/iflux-admin-app-shell-sidebar.js` | checkout `1c0e3fa` |
| `Admin_Design_system/iflux-admin-ui/iflux-admin-ui.css` | checkout `1c0e3fa` (hết `@import entry.css`) |
| `Admin_Design_system/app/**/*.html` + `hub.html` | checkout `1c0e3fa` (hết `?v=sub02p2*`) |
| `Admin_Design_system/auth/*.html` | checkout `1c0e3fa` (cache-bust P2-fix, chưa commit) |
| `Admin_Design_system/patterns/*.html` | checkout `1c0e3fa` |
| `Admin_Design_system/design-system.html` · `design-sandbox.html` | checkout `1c0e3fa` |
| `Admin_Design_system/files (3)/checkout.html` · `pricing.html` | checkout `1c0e3fa` |
| `platform/admin/shell/layout.css` | **xóa** |
| `platform/admin/shell/entry.css` | **xóa** |

`git diff --stat 1c0e3fa --` các path trên = **rỗng**. `rg sub02p2` trên `*.{html,css,js}` = **0**.

## 4. File còn khác `1c0e3fa` — chỉ P0/P1

| Path | Thuộc |
| --- | --- |
| `Admin_Design_system/iflux-admin-ui/iflux-admin-app-shell.js` | P1: allowlist `[]`, resolver, guard nhánh `useCanonical` (chết khi list rỗng), export 4 hàm. **0** inject DS / `data-theme` / layout frame |
| `backend/src/app.js` | P1: skip login; `sendFile` shell **chỉ** khi key ∈ allowlist |
| `platform/admin/shell/canonical-route-allowlist.json` | P1: `[]` |
| `platform/admin/shell/document.html` | P1 persist template — **không serve** (allowlist rỗng) |
| `infra/staging-1/admin-canonical-rewrite.inc` | P1 stub; **không** include nginx |
| [`05_Plan.md`](../05_Plan.md) · [`gates/P0.md`](P0.md) · [`gates/P1.md`](P1.md) | docs P0/P1 đã PASS |

## 5. Verify sau restore

### P0/P1 còn nguyên

| Check | Kết quả |
| --- | --- |
| `IfluxAdminAppShell` = 1 | `global.IfluxAdminAppShell =` **1** chỗ (`iflux-admin-app-shell.js`) |
| V2 = 0 | `IfluxAdminAppShellV2` **0** match JS/HTML |
| ALLOWLIST = `[]` | JSON `[]` · `CANONICAL_ROUTE_ALLOWLIST = []` |
| 0 canonical rewrite PAGES | Express chỉ shell khi key ∈ allowlist. Nginx **không** include `admin-canonical-rewrite.inc` |
| AS-IS pages vẫn mount | `users/list.html` + `dashboard/index.html` = full document + `main.ix-main`. **0** `[data-admin-page]` |
| Auth ngoài AppShell | `login.html` = `.ix-auth-root`. Express skip `/admin/login`. 0 sidebar |
| Resolver/guard P1 tồn tại, chưa active | `fragmentHref` / `isShellDocument` / `collectCanonicalPage` / nhánh `useCanonical` còn. List rỗng → AS-IS `collectPageOwned` |
| Không fallback `.ix-content` | app-shell **0** `querySelector` `.ix-content` |

### P2 trở về NOT IMPLEMENTED

| Check | Kết quả |
| --- | --- |
| Không platform/admin shell layout P2 | `layout.css` / `entry.css` **không còn** |
| Không canonical Header/Sidebar visual P2 | header.js / sidebar.js = `1c0e3fa`. **0** `ifx-nav-*` / `ifx-chip` / `ifx-avatar` / `ifx-btn` |
| Không P2 theme | app-shell **0** `data-theme` / `ensureCanonicalAssets`. `document.html` **0** `data-theme` |
| Không P2 override/debt | **0** `sub02p2` cache-bust. ui.css không import `entry.css`. **0** `data-admin-header-region` / `data-admin-chrome` trong runtime |

## 6. P2 delta = 0

Diff runtime+infra `1c0e3fa` → working tree:

```text
M  Admin_Design_system/iflux-admin-ui/iflux-admin-app-shell.js   (P1 only)
M  backend/src/app.js                                           (P1 only)
A  infra/staging-1/admin-canonical-rewrite.inc                  (P1 stub)
A  platform/admin/shell/canonical-route-allowlist.json          (P1 [])
A  platform/admin/shell/document.html                           (P1 persist, inactive)
```

Không còn `layout.css`, `entry.css`, DS inject, Header/Sidebar `ifx-*`, neutralize CSS, composition P2.

## 7. STOP

Không triển khai lại P2 trong lượt này. Chờ Owner review trạng thái sạch.

Chi tiết gate cũ (REJECTED): [`gates/P2.md`](P2.md).
