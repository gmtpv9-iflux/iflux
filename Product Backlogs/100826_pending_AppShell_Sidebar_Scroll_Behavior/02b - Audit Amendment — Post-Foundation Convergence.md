# 02b — Audit Amendment — Post-Foundation Convergence

| | |
| --- | --- |
| **Task ID** | `100826_AppShell_Sidebar_Scroll_Behavior` |
| **Document** | Mandatory Audit **Amendment** (Foundation dependency resolved) |
| **Status** | 🔒 **AMENDMENT COMPLETE** (2026-08-11) |
| **Amends** | [`02 - Audit`](02%20-%20Audit%20—%20AppShell%20Sidebar%20Scroll%20Behavior.md) §2 Audit A · §5 Audit D · §8 Audit G · §9 BR Checklist · §10 · §11 |
| **Trigger** | Blocking dependency [`100826_pending_AppShell_Architecture_Standardization_Reuse_Foundation`](../100826_pending_AppShell_Architecture_Standardization_Reuse_Foundation/) đã **CLOSED** (Wave 0–5 PASS, 2026-08-11) |
| **Authority** | Audit không đổi BRD · không khóa Solution / mechanism |
| **Evidence date** | 2026-08-11 · source-code evidence (`grep`/read) + Owner UI confirm từng Wave (xem Foundation `05 - Plan.md`) |

---

## 0. Why this amendment

`02 - Audit` (2026-08-10) và `03 - SoT` (LOCKED) ghi nhận **"Next Phase: Solution — PENDING, blocked by Foundation"**. Lý do: Foundation task đang chạy song song và **sẽ đổi chính hiện trạng renderer/ownership** mà `02` vừa audit — nếu mở Solution trên `02` gốc, Solution sẽ dựa trên facts đã lỗi thời ngay khi Foundation đóng.

Foundation đã đóng (Wave 0→5, xem `100826_pending_AppShell_Architecture_Standardization_Reuse_Foundation/05 - Plan.md`) và đã **converge 5/7 Sidebar surface** trong `02` §2 Inventory sang canonical `ensureSections()`. Amendment này cập nhật đúng các bảng bị ảnh hưởng — **không** đổi BR Checklist, **không** đổi SoT, **không** chọn mechanism cho Sidebar Scroll behavior.

```text
02 (2026-08-10): Left/Right Sidebar phân mảnh AppShell / Widget / Page
        ↓
Foundation Wave 2a–3b (2026-08-11): Flow / Community-right / ELP×4 / Stock Detail / Group×3
        → converge sang ensureSections() canonical
        ↓
02b: cập nhật Audit A/D/G + BR Checklist rows bị ảnh hưởng
        ↓
Solution có thể mở trên facts hiện tại (không lỗi thời)
```

---

## 1. Nguồn evidence

Amendment này dùng **evidence từ Foundation task đã CLOSED**, không tự audit lại từ đầu:

* `100826_pending_AppShell_Architecture_Standardization_Reuse_Foundation/04 - Solution.md` §4A (Ownership Decision Register — VR-01/02/03/04/05/06/CP)
* `100826_pending_AppShell_Architecture_Standardization_Reuse_Foundation/05 - Plan.md` Wave 2a/2b/2c/3a/3b (Owner UI PASS evidence từng surface)
* Source hiện tại (2026-08-11): `runtime/app-shell.js`, `widgets/flow-page/index.js`, `community-page.js` + `widgets/community-page/index.js`, `widgets/entity-list-page/index.js`, `stock-page.js` + `widgets/stock-page/index.js`, `group-page.js` + `widgets/group-page/index.js`, `stock.css`

---

## 2. Audit A — Inventory diff (BEFORE `02` → AFTER Foundation)

| ID | Position | `02` AppShell ownership (2026-08-10) | **AFTER Foundation (2026-08-11)** | Renderer hiện tại | Selector hiện tại |
| --- | --- | --- | --- | --- | --- |
| **SB-AS-MKT** | Left | YES | **YES — không đổi** | `page-runtime.js` `ensureSections` + `applyMarketLayout` | `aside[data-ifx-section=sidebar].ifx-rt-section--sidebar.ifx-mkt-sidebar` |
| **SB-AS-HUB** | Left | YES | **YES — không đổi** | `page-runtime.js` `ensureSections` + `applyHubLayout` | `aside[data-ifx-section=sidebar].ifx-hub-sidebar` |
| **SB-WGT-FLW** | Left | **NO** (widget outlet, tự dựng `<aside>` HTML cứng) | **YES** — converge Wave 2a | `widgets/flow-page/index.js` `ensureSections()` | `aside[data-ifx-section=sidebar][aria-label].ifx-rt-section--sidebar.ifx-flow-market-sidebar` |
| **SB-WGT-ELP** | Left | **NO** (tự dựng, reuse CSS class only) | **YES** — converge Wave 2c (áp dụng đồng thời 4 page: stocks/sectors/ecosystems/cau-chuyen) | `widgets/entity-list-page/index.js` `ensureSections()` | `aside[data-ifx-section=sidebar][aria-label].ifx-rt-section--sidebar.ifx-mkt-sidebar` |
| **SB-PG-COM-R** | Right | **NO** (dùng attr `sidebar-right` nhưng không qua `ensureSections`) | **YES** — converge Wave 2b; đồng thời **`ensureSections()` được mở rộng** để hỗ trợ `sidebar-right` (`<aside>` + `aria-label`, trước đó chỉ có `sidebar`) | `community-page.js` gọi qua bridge ESM `widgets/community-page/index.js` | `aside[data-ifx-section=sidebar-right][aria-label].ifx-rt-section--sidebar-right.ifx-com-feed-sidebar` |
| **SB-PG-POST-R** | Right | NO | **Không đổi — vẫn PAGE_OWNED, KHÔNG migrate** (Foundation Wave 3a xác nhận: `community-post-page.js` không có Widget Host, aside chứa 6 block đặc thù trang) | `community-post-page.js` (không đổi) | `aside.ifx-com-story-aside` (không có `data-ifx-section`) — **giữ nguyên** |
| **SB-PG-STOCK-L** | Left col | **NO** (bare `<div data-ifx-section=sidebar>` không class, có thể rỗng) | **YES** — converge Wave 3b (VR-04 Section-only; candlestick/header vẫn PAGE_OWNED, không promote) | `stock-page.js` + `group-page.js` qua bridge ESM tương ứng | `aside[data-ifx-section=sidebar][aria-label].ifx-rt-section--sidebar` — **tag đổi `<div>` → `<aside>`, không có class layout riêng (khác Flow/ELP có class page-family)** |
| **SB-PG-STOCK-R** | Right col | NO — `.ifx-stock-col--right` | **XÁC NHẬN KHÔNG TỒN TẠI** — Foundation Wave 3b grep xác nhận **0 JS nào từng tạo class này**; đã xoá dead CSS (`stock.css`). **Xoá khỏi inventory**, không phải Sidebar thật | — | — |
| **SB-PG-PRICE** | N/A | NO | **Không đổi** — ngoài scope Foundation, vẫn `.ix-order-summary` page card | `pricing.css` | không đổi |
| **SB-AS-RIGHT** | Right (API) | "Capability stub/unused" | **KHÔNG còn stub** — `sidebar-right` key đang được **Community tiêu thụ thật** qua `ensureSections()` (Wave 2b) | `runtime/app-shell.js` | đã có consumer |

**Route coverage bổ sung cho SB-PG-STOCK-L:** ngoài `stock` (`/co-phieu/:ticker`), Foundation xác nhận cùng module/cơ chế áp dụng cho **`sector` (`/nganh`), `family` (`/he-sinh-thai`), `cauChuyenDetail`/`chuDeDetail` (`/cau-chuyen`)** qua `group-page.js` (1 module, 3 publishKey). `02` gốc đã gộp các route này vào 1 dòng ("stock / sector / family / detail") — vẫn đúng, chỉ đổi cột ownership.

---

## 3. Audit D — Existing Behavior (cập nhật)

| Mechanism | `02` | **Sau Foundation** |
| --- | --- | --- |
| sticky trên `.ifx-mkt-sidebar` / `.ifx-hub-sidebar` / `.ifx-flow-market-sidebar` / `.ifx-com-feed-sidebar` | None | **Không đổi — vẫn None.** Foundation chỉ đổi renderer tạo host (`ensureSections`), **không** thêm sticky/fixed/observer nào. Đúng nguyên tắc BRD §21 (BRD không khóa mechanism) |
| `position: sticky` trên `.ifx-stock-col--left` | Có (page-level, page column, không phải Section host) | **Không đổi** — sticky vẫn nằm trên `.ifx-stock-col--left` (page column), Section `<aside data-ifx-section=sidebar>` là con bên trong, **không tự sticky** |
| `position: sticky` trên `.ifx-stock-col--right` | Có (ghi nhận ở `02`) | **Xoá — dead CSS, không có element nào dùng.** (đã xoá khỏi `stock.css` trong Foundation Wave 3b) |
| Scroll listener / IO / RO trên AppShell Sidebar | None | **Không đổi — vẫn None** |

**Kết luận:** Foundation **không** đưa vào bất kỳ scroll behavior nào (đúng ranh giới UR-001/CG-011 — Foundation chỉ đổi ownership/renderer, không đụng behavior). BR-01.1/BR-01.2 GAP ở `02` **vẫn còn GAP** — đây vẫn là lý do Solution/Implementation của task Scroll cần tồn tại.

---

## 4. Audit G — Route Compatibility Matrix (cập nhật cột AppShell ownership)

| Route / pageKey | `02` compatibility | **Sau Foundation** |
| --- | --- | --- |
| `/dong-tien` `flow` | **FAIL** — not AppShell sidebar owner | **Host đã AppShell-owned** (Section); scroll behavior **vẫn FAIL/GAP** (chưa có capability — không đổi ở BR-01/03/04) |
| `/cong-dong` `community` | **FAIL** — right page-owned | **Host đã AppShell-owned** (Section `sidebar-right`); scroll behavior **vẫn GAP** |
| `/co-phieu` list ELP (stocks/sectors/ecosystems/cau-chuyen) | **FAIL** — widget-built, mimics market CSS | **Host đã AppShell-owned** (Section, cùng renderer với Market); scroll behavior **vẫn GAP** |
| `/co-phieu/:ticker` · `/nganh/:id` · `/he-sinh-thai/:id` · `/cau-chuyen/:slug` | **FINDING** — page sticky ≠ AppShell capability | **Host Section đã AppShell-owned** (VR-04 Section-only); candlestick/header vẫn PAGE_OWNED (đúng, không đổi); page sticky trên `.ifx-stock-col--left` **vẫn** không phải AppShell Sidebar Scroll capability — **finding F-03 (`02`) vẫn đúng, chưa resolve** |
| `/cong-dong/...` post (communityPost) | **FAIL** | **Không đổi** — vẫn PAGE_OWNED, không có Widget Host, không migrate |

**Ý nghĩa cho Solution:** "AppShell ownership của **host**" đã đồng nhất (9/9 Left/Right Sidebar surface dùng chung `ensureSections()`), nhưng **"AppShell ownership của scroll behavior"** (mục tiêu thật của task này) **vẫn là GAP toàn bộ** — không có route nào đã có viewport-following. Điều này thực ra **đơn giản hoá** Solution: giờ chỉ cần viết **1 shared behavior module** áp lên `[data-ifx-section="sidebar"], [data-ifx-section="sidebar-right"]` là phủ được toàn bộ 9 surface, không cần xử lý case-by-case renderer khác nhau như `02` từng lo ngại (F-01/F-02).

---

## 5. BR Checklist rows bị ảnh hưởng (chỉ các dòng đổi Status/Evidence)

| BR | Atomic | `02` Evidence/Status | **02b Evidence/Status (2026-08-11)** |
| --- | --- | --- | --- |
| BR-01 | BR-01.2 | "Flow/Com side columns tự build" → FINDING/GAP | Flow/Com/ELP/Stock/Group **không còn tự build** — cùng `ensureSections()`. **BR-01.2 (ownership AppShell) nay PASS-AS-IS ở layer host**; behavior (following) **vẫn GAP** — 2 layer khác nhau, không gộp |
| BR-02 | BR-02.1 | "Right AppShell section: unused" → PARTIAL | Right AppShell section (`sidebar-right`) **đang có consumer thật** (Community). PARTIAL → **vẫn PARTIAL** vì chỉ 1/2 page-family dùng Right (`communityPost` vẫn PAGE_OWNED aside riêng, không qua Section) — Solution phải quyết định `communityPost` aside có trong scope BR hay không (nó **không** phải AppShell Sidebar theo Foundation VR-CP classification) |
| BR-10 | BR-10.1 | "Flow/ELP/Com/Stock side columns = compatibility surfaces" → FINDING | **Surfaces đã hết là "compatibility surfaces cần phân loại"** — Foundation đã phân loại xong (VR-01/02/03/04 CONVERGE Section; VR-05/06/CP PAGE_OWNED). Solution **không cần tự classify lại**, chỉ tiêu thụ kết quả |
| BR-11 | BR-11.1 | "`ensureSections`, layout classes... candidates; Solution quyết" → PASS-AS-IS | `ensureSections()` **đã là canonical single API cho 9/9 surface** — reuse candidate **mạnh hơn nhiều** so với `02` (khi đó chỉ 2/7 dùng). Solution nên hook behavior trực tiếp lên contract `[data-ifx-section]` do `ensureSections()` sinh ra, **không** cần viết lại theo từng renderer |

**Không đổi (ngoài phạm vi Foundation):** BR-03, BR-04.*, BR-05, BR-06, BR-07, BR-08, BR-09, BR-12, INV-11/12, §16.H matrix — Foundation **không** đụng behavior/scroll/geometry, chỉ đụng ownership của **host**.

---

## 6. Cập nhật câu trả lời BRD §20 (chỉ câu 1–4, Audit-layer)

| # | Question | `02` Audit answer | **02b Audit answer** |
| --- | --- | --- | --- |
| 1 | Sidebar render ở đâu? | AppShell sections (2 surface) + widget/page HTML rời rạc (5 surface) | **9/9 Left/Right Sidebar surface đều render qua `runtime/app-shell.js` `ensureSections()`** (trừ `communityPost` aside — xác nhận PAGE_OWNED, ngoài scope AppShell Sidebar) |
| 2 | Bao nhiêu Left? | 2 AppShell + nhiều widget/page left | **7 Left Sidebar, tất cả đều AppShell `ensureSections()`** (Market, Home, Flow, ELP×1 module/4 route, Stock, Group×1 module/3 route) |
| 3 | Bao nhiêu Right? | 0 AppShell active + ≥2 page right | **1 AppShell Right (`sidebar-right`) đang active = Community.** `communityPost` aside vẫn PAGE_OWNED riêng (không phải AppShell Sidebar) |
| 4 | Cùng renderer/owner? | **Không** — phân mảnh AppShell/Widget/Page | **Có — 1 renderer duy nhất (`ensureSections()`) cho toàn bộ AppShell Sidebar surface.** Đây là thay đổi facts quan trọng nhất so với `02` |

Câu 5–14 (mechanism/geometry/tall/wrapper/remediation/reuse/regression/test-matrix) **vẫn thuộc Solution phase**, không đổi ở Audit layer — xem `02` §10 + BRD §20.

---

## 7. Findings — resolved / superseded / new

| ID | `02` Finding | Trạng thái sau Foundation |
| --- | --- | --- |
| F-01 | Flow/ELP tự dựng sidebar trong composite widget → cần Owner/SoT phân loại promote hay exclude | **RESOLVED** — Foundation đã promote cả 2 vào AppShell Section (`04 - Solution.md` §4A VR-01/VR-03 CONVERGE). Solution task này **không cần tự quyết lại** |
| F-02 | Community right dùng attr `sidebar-right` nhưng không qua `ensureSections` | **RESOLVED** — đã qua `ensureSections()` thật (Wave 2b), kể cả mở rộng API hỗ trợ `<aside>` cho `sidebar-right` |
| F-03 | Stock sticky = page scroll-follow khác semantic, cấm nhầm đã đạt BR | **VẪN ĐÚNG, KHÔNG ĐỔI** — sticky vẫn ở `.ifx-stock-col--left` (page column), Section host bên trong không sticky. Cảnh báo F-03 tiếp tục áp dụng cho Solution |
| F-04 | Market guest Main ngắn → khó tái hiện pain | **Không đổi** — ngoài scope Foundation |
| F-05 | Soft-nav clear `ifx-mkt-layout`/`ifx-hub-grid` | **Không đổi**, nhưng mở rộng: Foundation xác nhận `runtime/soft-navigation.js` `teardownOutlet()` xoá **toàn bộ** `[data-ifx-page-runtime]` mỗi soft-nav (không riêng 2 class trên) — **mọi Section (không chỉ Market/Hub) đều bị remount mỗi lần chuyển trang.** Đây là finding quan trọng cho Solution: **không có Section nào persistent qua soft-nav hiện tại** — nếu Solution muốn giữ scroll state qua soft-nav, phải tự thiết kế lifecycle, không thể giả định DOM tồn tại liên tục |
| **F-10 (mới)** | Sau converge, `SB-PG-STOCK-L` là `<aside>` **không có class layout riêng** (khác Flow có `.ifx-flow-market-sidebar`, ELP có `.ifx-mkt-sidebar`, Community có `.ifx-com-feed-sidebar`) | Solution **không được giả định** mọi Sidebar Section có 1 class CSS riêng để hook style/behavior — phải hook trên attribute chung `[data-ifx-section]`, không hook trên class page-family (vốn không tồn tại đều) |
| **F-11 (mới)** | Foundation không re-run Geometry (Audit C — `02` §4) vì thay đổi là structural (tag/API), không phải visual (không đổi CSS position/size của cột/panel) | Số đo geometry ở `02` §4 (Header 56px, Market 355×303, Flow 889×300, Community-right 1020×300...) **vẫn dùng được làm baseline**, nhưng Solution/Verification **nên re-probe runtime** trước khi khoá Reverse Sync Boundary formula, đặc biệt do tag đổi `<div>`→`<aside>` ở Stock/Group có thể ảnh hưởng nhẹ đến `getBoundingClientRect()` nếu có default UA style khác nhau |

---

## 8. Amendment DoD

* [x] Diff Inventory (Audit A) — 9 dòng, xác nhận CONVERGE/PAGE_OWNED/removed theo Foundation `04 - Solution.md` §4A
* [x] Diff Existing Behavior (Audit D) — xác nhận Foundation không thêm sticky/fixed/observer
* [x] Diff Route Compatibility (Audit G) — tách rõ "host ownership" (đã PASS) vs "scroll behavior" (vẫn GAP)
* [x] Cập nhật BR Checklist rows bị ảnh hưởng (BR-01.2 · BR-02.1 · BR-10.1 · BR-11.1)
* [x] Cập nhật BRD §20 Q1–Q4
* [x] Findings resolved (F-01, F-02) + findings không đổi (F-03, F-04, F-05 mở rộng) + findings mới (F-10, F-11)
* [x] **Không** khóa implementation mechanism · **không** đổi BRD/SoT

**Audit (v1 + 02a + 02b) đủ để mở Solution phase.** SoT `03` không cần sửa nội dung (chỉ cần cập nhật "Next Phase" — xem README).
**Cấm** Implementation trước Solution + Plan.
