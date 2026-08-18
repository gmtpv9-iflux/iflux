# 22 — L1 Execution: Architecture / Foundation

**Layer:** L1 (theo `20 - Master Verification Specification.md` v1.1)
**Gate trước:** L0 = PASS (xem `21`).
**Nguyên tắc thực thi:** chạy đủ L1-TC-01…12 theo dependency; FAIL nào tự sửa được an toàn (xóa dead code/orphan đã 100% confirm không route nào dùng) → sửa + retest ngay; FAIL nào cần refactor lớn/rủi ro regression → KHÔNG tự sửa, dừng tại L1 chờ Owner quyết (đúng CG-030 + Stop-the-Line).

---

## L1-A — Ownership

### L1-TC-01 — Single Owner (component/metadata/shell/runtime/SEO/navigation/sidebar/API)

| Thành phần | Kết quả | Evidence |
|---|---|---|
| Nav menu | ✅ PASS | `IfluxAppShellHeader.renderNav()` — 1 owner, chạy lại mọi soft-nav (audit 110826 §6) |
| CTA / user actions | ✅ PASS | `iflux-guest-shell.js#renderGuestActions` |
| User/account menu | ✅ PASS | `iflux-web-ui.js#patchUserMenu/syncTopnav` |
| Mobile tabbar | ✅ PASS | `iflux-web-ui.js#syncMobileTabbar` |
| Brand href | ⚠️ WARNING (non-blocking) | Set bởi **2 hàm** (`syncBrandHref` + `renderNav()`), cùng giá trị, không gây sai — duplicate benign, đã ghi nhận từ audit 110826, không block |
| **Brand Logo** | ✅ PASS (đã fix hôm nay) | P0+P1+P2 — xem L1-TC-04 |
| Bootstrap/Runtime (shell vs page) | ✅ PASS | `bootstrap.js#start` là orchestrator duy nhất; `bootShell`/`bootPage` chỉ gọi từ đây (evidence L1-TC-07) |
| SEO metadata resolver | ✅ PASS | 1 chain `site-seo.service.getPublicEffective()` → `site-seo-resolver.js`, dùng chung Bot Contract + Human bootstrap |
| API contract (SEO) | ✅ PASS | Xem L1-TC-09 |
| **Sidebar (Left/Right)** | ⚠️ **ACCEPTED EXCEPTION** (Owner 2026-08-11) | Không phải BR của SEO (`01 - Business Requirement.md` không có Sidebar Ownership) — xem L1-TC-06 |

**Kết luận L1-TC-01: PASS** (mọi thành phần trong scope SEO PASS). Sidebar = generic App-Shell hygiene, **không** thuộc BR nào của `01 - Business Requirement.md` → tách khỏi Exit Gate của epic SEO, xử lý ở Foundation task riêng (xem L1-TC-06).

---

### L1-TC-02 — Duplicate implementation detection

| Finding | Trạng thái | Hành động |
|---|---|---|
| **5 orphan self-nested dirs** publicly reachable, HTTP 200, không route/nginx/backend nào tham chiếu, còn markup legacy: `User_Web/community/community/`, `flow/flow/`, `home/home/`, `stock/stock/`, `stocks/stocks/` | ❌ **FAIL (đã xác nhận)** | ✅ **ĐÃ FIX**: backup → `/root/orphan-backup-20260811/` trên production, xoá cả 5 dir, retest qua CDN thật → cả 5 path trả **404**. Không có route/nginx-config/backend-code nào tham chiếu (đã grep toàn bộ `/etc/nginx/` + `/var/iflux/backend/` trước khi xoá) |
| Dead Dashboard Engine sidebar logic (`ensureSidebarDefaults`, `renderSidebarStack`, query `[data-ifx-hub-sidebar-canvas]`) — DOM target không còn tồn tại ở đâu trong repo | ⚠️ **ACCEPTED EXCEPTION** (Owner 2026-08-11) | Cùng nhóm Sidebar Foundation (L1-TC-06) — không phải BR của SEO. Discover 2026-08-11 xác nhận: DOM target không tồn tại (đạt 1/4 điều kiện dead-code) nhưng `ensureSidebarDefaults`/`renderSidebarStack` **vẫn có caller sống** (`repairLayout`, `IfluxDashboardEngine.init/refreshSidebar`) và vẫn đụng layout storage → **chưa đủ 4/4 điều kiện để xoá**. Xử lý trong `100826_pending_AppShell_Architecture_Standardization_Reuse_Foundation`, không xoá vội trong epic SEO |
| Brand href duplicate write (2 hàm, cùng giá trị) | ⚠️ WARNING | Không block — benign |

**Kết luận L1-TC-02: PASS** (5 orphan dir đã fix + retest 404). Dashboard Engine dead-code candidate = Accepted Exception, theo dõi ở Foundation task riêng — không block SEO.

---

## L1-B — App Shell

### L1-TC-03 — Canonical AppShell

**PASS.** Page → AppShell → Section → Widget Host đúng chain (audit 110826 §6, §8). HTML chỉ là mount rỗng cho content; chrome (header/nav/footer) không bị page tự tạo lại — comment tường minh trong `app-shell.js:21-25`: *"Vùng chrome App Shell (đã có sẵn trong HTML tĩnh)... KHÔNG render lại trong vùng nội dung page-runtime."*

### L1-TC-04 — Header ownership

**PASS** (đã fix P0+P1+P2, tôi tự retest lại hôm nay qua CDN thật):

```
/co-phieu/HPG, /nganh/1, /he-sinh-thai/1, /cong-dong
→ <img class="ix-brand-logo" data-ifx-seo-logo alt="iFlux" width="120" height="32" hidden />
```

Đồng nhất trên mọi entry, không còn `<div><svg>iFlux</span>` legacy nào ở 8 điểm đã migrate.

### L1-TC-05 — Persistent shell behavior

**PASS (có 1 điểm cần Owner tự click-through xác nhận — không blocking).**

- `teardownOutlet()` chỉ xoá `[data-ifx-page-runtime]` (main content), không đụng `<header>` — code-evidence mạnh (audit 110826 §2).
- `enrichManifestWithSiteSeo` giờ chạy **mọi lần nav** (P1 fix — gate `bindLogo:!soft` đã bỏ), nên bất kỳ DOM logo nào đang tồn tại đều được set `src` lại đúng.
- Vì toàn bộ entry giờ cùng markup (`<img data-ifx-seo-logo>`), soft-nav từ bất kỳ entry nào cũng phải ra cùng kết quả — đây là suy luận cấu trúc, không phải browser click-through thật (agent không có browser automation tool trong phiên này).

**Đề nghị Owner (không block L2):** mở `/co-phieu/HPG`, chờ JS load xong, bấm menu "Cộng đồng" (không F5) → xác nhận logo không đổi/không vỡ. Nếu Owner xác nhận OK, item này đóng hoàn toàn; nếu phát hiện sai → báo lại, tôi sẽ coi đây là regression mới và mở lại L1-TC-05.

### L1-TC-06 — Sidebar ownership

**✅ RESOLVED (Update 2026-08-11, sau khi ghi nhận ban đầu):** Foundation task `100826_pending_AppShell_Architecture_Standardization_Reuse_Foundation` đã **CLOSED toàn bộ Wave 0→5 (PASS)** — 9/9 surface (Home/Market baseline + Flow + Community + ELP×4 + Stock Detail + Group×3) đều đã migrate về canonical `ensureSections()`, không còn page nào tự dựng sidebar host riêng. Item này không còn là "pending" — nâng từ Accepted Exception lên **PASS thật**. Giữ nguyên phần Evidence gốc dưới đây làm lịch sử/tham chiếu (không đổi nội dung), không phải vì vẫn còn tồn đọng.

**Owner decision (2026-08-11):**
1. Sidebar Ownership **không phải BR** của `01 - Business Requirement.md` (SEO Metadata Management) — đây là generic App-Shell hygiene finding, phát sinh khi audit L1 dùng model rộng "Architecture/Foundation" chứ không phải yêu cầu nghiệp vụ SEO.
2. Task chuẩn hoá Sidebar **đã tồn tại từ trước** (2026-08-10): `Product Backlogs/100826_pending_AppShell_Architecture_Standardization_Reuse_Foundation/` — đã có BRD 🔒 → Audit 🔒 → SoT 🔒 → Solution 🔒 (Owner-locked). VR-04 (Stock/Group columns) đã được gỡ UNRESOLVED bằng evidence Discover 2026-08-11 (xem `100826_.../04 - Solution.md` §9) và Plan đã có (`100826_.../05 - Plan.md`) — Foundation đang chạy Wave 0→5 độc lập, **không** trong phạm vi epic SEO này.
3. Owner chốt: **không** dùng Sidebar Foundation làm lý do block SEO L2. Ghi nhận **KNOWN PENDING FOUNDATION DEPENDENCY**, cho L2 UNLOCK.
4. Foundation task là task chính thức để chuẩn hoá Sidebar/AppShell — theo đúng quy trình riêng (Discover → Classify → Lock → Build canonical → Migrate → Owner UI test → Source/evidence verify → Remove legacy → Regression), tách hoàn toàn khỏi epic SEO này.

**Evidence gốc (giữ lại để tham chiếu — không đổi):**

**Có API chuẩn:**
- `ensureSections(root, manifest)` — `User_Web/iflux-web-ui/runtime/app-shell.js:29-50`, gọi từ `page-runtime.js:52`.
- Fallback `ensureSection()` — `runtime/page-layout-engine.js:88-98`.
- Chỉ 2 page dùng đúng đường canonical: **Nhà** (`home.manifest.js:27-29`, class `.ifx-hub-sidebar`) và **Thị trường** (`market.manifest.js:12-14`, class `.ifx-mkt-sidebar`).

**Nhiều page/widget bypass — tự dựng sidebar host riêng, không qua manifest `sections[]`:**

| Owner | File:dòng | Class |
|---|---|---|
| Flow | `widgets/flow-page/index.js:19-20` | `.ifx-flow-market-sidebar` |
| Entity list (Sector/Ecosystem...) | `widgets/entity-list-page/index.js:51-52` | `.ifx-mkt-sidebar` |
| Community feed (right rail) | `community-page.js:472-488` | `.ifx-com-feed-sidebar` |
| Stock detail | `stock-page.js:242-245` | host riêng |
| Group detail | `group-page.js:111-114` | tương tự stock |
| Article detail | `community-post-page.js:233-246, 528-541` | `.ifx-com-story-aside` |
| Account profile | `account/profile.html:80-84` | `.ix-profile-sidebar` |
| Messages | `widgets/messages-page/index.js:54-55` | `.ix-chat-sidebar` |

**Dead code (owner "ma" — logic tồn tại, DOM target đã biến mất):**
- `dashboard-engine.js:41` (scope `'sidebar'`), `ensureSidebarDefaults` (529-563), `renderSidebarStack` (866+), query `[data-ifx-hub-sidebar-canvas]` (1304, 1479) — **không có bất kỳ HTML/JS nào trong repo tạo ra `data-ifx-hub-sidebar-canvas`** để logic này nhắm tới.
- `widget-registry.js:460-461` còn `SIDEBAR_DEFAULT` liên quan.

**Không persistent qua soft-nav** (khác Header): sidebar nằm trong `[data-ifx-page-runtime]` → `teardownOutlet()` xoá + remount mỗi lần chuyển trang (`soft-navigation.js:152-162`, `page-runtime.js:45-49`).

**Root cause:** Sidebar KHÔNG phải một App Shell chrome persistent như Header — nó là 1 **section trong page runtime**, nhưng chỉ 2/9+ page dùng đúng section-registration API; phần còn lại tự chế UI tương tự (cùng ý niệm "cột sidebar 2 cột") bằng class/markup riêng theo từng "họ" page (`ifx-mkt-*`, `ifx-com-*`, `ifx-flow-*`...).

---

## L1-C — Runtime Foundation

### L1-TC-07 — Bootstrap ownership

**PASS.** 1 orchestrator duy nhất: `bootstrap.js#start()` → gọi `bootShell()` (`shell-boot.js:182`) rồi `bootPage()` (`page-runtime.js:37`). Không file nào khác tự gọi `bootShell`/`bootPage` độc lập. Soft-nav cũng gọi lại qua `start({soft:true})`, không có entry thứ 2.

### L1-TC-08 — SHELL_ONLY pages

**PASS.** Constant rõ ràng tại `bootstrap.js:386`:

```js
var SHELL_ONLY = { account: 1, checkout: 1, communityWrite: 1, share: 1, stockComment: 1, comments: 1 };
```

6 page này: chạy `bootShell` + `resolveManifest`/SEO, nhưng **early-return trước `bootPage`** (dòng 386-392 vs 394-400) — không bị đánh đồng page runtime đầy đủ. Feature riêng (`account-feature-boot.js`, `checkout-feature-boot.js`...) chờ event `iflux-shell-ready` mới init, không tự boot song song.

---

## L1-D — API / Security Foundation

### L1-TC-09 — API contract

**PASS** (2 finding non-blocking: JSON envelope của `seo-platform` routes thiếu `meta` so với `site-seo`; `title-only` nuốt lỗi thành HTTP 200 thay vì 5xx — không ảnh hưởng đúng/sai dữ liệu, chỉ ảnh hưởng độ nhất quán format, ghi nhận cho lần dọn kỹ thuật sau).

Route ghi (PUT `/api/admin/seo/pages/:pageKey`, PATCH `/api/admin/seo/global`) đều có method/auth/validate/response contract rõ; route đọc public (`/api/seo/effective`) đúng không auth.

### L1-TC-10 — Authorization boundary

**PASS.** Enforce **server-side** qua `requireAdminPermission` (JWT Bearer + RBAC context + `requirePermission`) — `admin-perm-guard.js:31-54`. UI ẩn nút (`data-ix-perm`) chỉ là UX, không phải security boundary. Permission catalog dùng `marketing.seo_system.*` / `marketing.seo_pages.*` — không trùng/duplicate permission khác.

---

## L1-E — SEO / Affiliate-Public Identity Boundary (BR-45)

### L1-TC-11 — Resolution order (BR-45.4)

**PASS.** Nginx rewrite `/{IFL...}/...` là **internal `last`** (không 301/302) — `$request_uri` và query string giữ nguyên, browser address bar không đổi. SEO backend nhận `requestUri` gốc (còn `publicId`/`ref`) qua `X-Original-URI`/`$request_uri`, dùng để **classify DECORATED/QUERY_REF → loại khỏi index**, không hề "xoá" attribution. Client `affiliate-resolver.js` đọc `location.pathname` (vẫn còn `/{publicId}/...`) để capture — không bị SEO can thiệp trước.

### L1-TC-12 — Ownership separation

**PASS.** 2 owner tách biệt hoàn toàn về code:

| Concern | Owner | File |
|---|---|---|
| Path rewrite phục vụ serve | Nginx | `nginx-iflux-production-locations.conf:67-80` |
| Capture attribution | Client | `affiliate-resolver.js` |
| Index eligibility / Clean canonical | SEO Platform | `index-boundary.js`, `seo-contract.js` |

SEO chỉ **biết** pattern để loại trừ khỏi index (đúng boundary), không tự capture attribution — không lẫn logic.

**Gap ghi nhận (không phải SEO-boundary violation, không đổi verdict — finding cross-domain theo §41/§45.7, KHÔNG tự sửa trong epic SEO):** `affiliate-resolver.js` hiện chỉ capture `publicId` từ path, **không đọc** query `?ref=`/`?r=` để lưu attribution — dù SEO đã đúng khi loại 2 dạng này khỏi index. Đây là gap năng lực của Affiliate/Loyalty domain (nếu Owner từng kỳ vọng `?ref=` cũng phải attribute được), không phải lỗi SEO Platform. Ghi nhận riêng, chờ Owner nếu muốn mở task khác.

---

## L1 Exit Gate

```text
Single Owner (L1-TC-01)              PASS  (Sidebar = Accepted Exception, không phải BR-SEO)
Duplicate implementation (L1-TC-02)  PASS  — orphan dirs ĐÃ FIX; Dashboard dead code = Accepted Exception (Foundation riêng)
Canonical AppShell (L1-TC-03)        PASS
Header ownership (L1-TC-04)          PASS
Persistent shell (L1-TC-05)          PASS (1 click-through Owner nên làm, non-blocking)
Sidebar ownership (L1-TC-06)         PASS (RESOLVED — Foundation task 100826_... đã CLOSED toàn bộ Wave 0→5, 2026-08-11)
Bootstrap ownership (L1-TC-07)       PASS
SHELL_ONLY contract (L1-TC-08)       PASS
API contract (L1-TC-09)              PASS
Authorization boundary (L1-TC-10)    PASS
BR-45 Resolution order (L1-TC-11)    PASS
BR-45 Ownership separation (L1-TC-12) PASS
```

## **L1 Exit Gate: ✅ PASS (với 1 Accepted Exception đã ghi nhận) — L2 UNLOCKED.**

**Owner decision (2026-08-11):** Sidebar Ownership không phải BR của SEO Metadata Management → tách khỏi Exit Gate epic này, ghi nhận **Known Pending Foundation Dependency / Exception** (không coi là regression SEO), xử lý tiếp trong `100826_pending_AppShell_Architecture_Standardization_Reuse_Foundation` (đã có SoT/Solution Owner-lock từ trước, chỉ còn VR-04 mở — đang được gỡ bằng evidence Discover 2026-08-11 trong task đó, độc lập với epic SEO này).

**L2 được phép tiếp tục** theo đúng dependency của SEO (`20 - Master Verification Specification.md` §6 mapping), không chờ Foundation Sidebar hoàn tất.

**Non-blocking follow-up (không phải Exit Gate item):** L1-TC-05 vẫn còn 1 click-through Owner nên tự làm (`/co-phieu/HPG` → soft-nav "Cộng đồng" → xác nhận logo không đổi/không vỡ) — không block L2, chỉ là double-check UX.
