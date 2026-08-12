# 05 — Plan: Sidebar/Section Canonical Migration (Wave 0–5)

| | |
|---|---|
| **Status** | DRAFT — chờ Owner xác nhận trước khi bắt đầu Wave 0 trên Production |
| **Authority** | `01 - BRD.md` 🔒 → `02 - Audit.md` 🔒 → `03 - SoT.md` 🔒 → `04 - Solution.md` 🔒 (VR-01..06/CP/04 đều đã locked, xem `04` §4A + §9) |
| **Scope** | User Web only. Admin OUT OF SCOPE |
| **Trigger** | Owner directive 2026-08-11 "Sidebar Ownership Refactor" — reuse task này, không mở BRD/Audit/SoT mới |
| **Governance** | Không refactor "copy sidebar mới rồi xoá sidebar cũ" mù quáng — mỗi sidebar đi qua đúng: **Discover → Classify → Lock → Build canonical → Migrate → Verify → Remove legacy → Regression** |
| **Next** | Implementation theo đúng thứ tự Wave dưới, mỗi Wave có Exit Gate riêng — không bung nhiều Wave cùng lúc (vết dầu loang, `04` §28B) |

---

# 1. Nguyên tắc thực thi (áp dụng cho mọi Wave)

```text
Discover (đã làm — 8-agent 2026-08-11, evidence trong 04 §4A/§6-11)
   ↓
Classify (Widget Host | Page-specific data | Residual/dead — đã khoá trong 04 §4A)
   ↓
Lock (Freeze contract: Widget Host + Page-specific data + thứ tự + vị trí — KHÔNG mang residual sang nhà mới)
   ↓
Build canonical (ensureSections() theo 04 §12B — Section mới, chưa migrate nội dung)
   ↓
Migrate (chuyển Widget Host + page-specific data vào Section mới, giữ nguyên host identity theo 04 §14-16)
   ↓
Verify (Layer 1-6 theo 04 §23 — Architecture / Host / Widget behavior / Lifecycle / Responsive / Performance)
   ↓
Dual verification gate:
   Owner UI test (Admin Widget Placement bật/tắt widget + xem đúng vị trí + page-specific data còn đủ)
   +
   Agent source verification (không bypass, không duplicate owner, không dead reference)
   ↓
PASS cả 2 → Remove legacy implementation cũ
   ↓
Regression (soft-nav, hard-nav, Widget Placement, page-specific data, page liên quan)
   ↓
Chỉ sau Regression PASS mới mở Wave/sidebar tiếp theo
```

**Không tự sửa nếu dependency chưa rõ** — STOP, báo Owner, không suy diễn (CG-030).

**Mỗi Wave chỉ đổi 1 surface** (một page hoặc một pilot trong nhóm cùng pattern) — không đổi 2 page cùng lúc trừ khi cùng module (`group-page.js` dùng chung 3 publishKey → coi là 1 unit vì cùng code path).

---

# 2. Wave 0 — Safety Baseline

**Mục tiêu:** Freeze host inventory / contracts / lifecycle / network baseline. **Không đổi architecture.**

| # | Task | Evidence nguồn |
|---|---|---|
| 0.1 | Chụp baseline DOM + network cho từng page sẽ migrate: Flow, Community, Stock list (`/co-phieu`), Stock detail (`/co-phieu/{symbol}`), Sector/Family/Article detail (qua `group-page.js`) — trước khi đổi bất kỳ dòng code | Production hiện tại |
| 0.2 | Xác nhận danh sách Widget đang publish qua Admin Widget Placement cho từng publishKey liên quan: `flow`, `community`, `stocks`, `stock-detail`, `sector-detail`, `eco-detail`, `cau-chuyen-detail` | `backend/src/modules/widget-publish/` |
| 0.3 | Ghi lại đúng host identity hiện tại (class/selector/data-attr) cho mỗi Widget Host — làm baseline so sánh sau migrate (theo `04` §15 Host Identity Preservation) | Bảng dưới §3 |
| 0.4 | Xác nhận `ensureSections()` + `ensureSection()` fallback hiện hoạt động đúng cho Home/Market (2 consumer canonical hiện có) — làm reference implementation cho các Wave sau | `runtime/app-shell.js:29-50`, `runtime/page-layout-engine.js:88-98` |

**Exit Gate 0:** Baseline đã chụp đủ cho toàn bộ surface Wave 2-3b, không có đổi code nào ở Wave này.

---

# 3. Wave 1 — Canonical Section Enablement

**Mục tiêu:** Xác nhận API `ensureSections()` đủ năng lực cho `sidebar` (Left) + `sidebar-right` (Right) + `main` trước khi migrate bất kỳ page nào (`04` §12B).

| # | Task | Trạng thái |
|---|---|---|
| 1.1 | Verify `ensureSections('sidebar')` hoạt động đúng ngoài Home/Market | ✅ DONE trực tiếp bằng Wave 2a Flow thật (mạnh hơn test mount tạm) — xem Evidence 2a.4 |
| 1.2 | Verify `ensureSections('sidebar-right')` sẵn sàng cho Community (Right Sidebar capability đã lock ở SoT §8, chỉ thiếu consumer) | ⏳ Verify khi thực hiện Wave 2b |
| 1.3 | Xác nhận Layout Engine (`page-layout-engine.js`) + `mount-published-widgets.js` không phân biệt "page tự fetch PagePublished" (Flow/Community/Stock/Group) vs "bootstrap resolve" (Home/Market) — cùng 1 contract | ✅ DONE — `buildHostTree` dùng `querySelectorAll('[data-ifx-section],[data-section]')` generic trên toàn subtree, không phân biệt nguồn tạo section |
| 1.4 | Không rewrite Widget Host nội bộ ở Wave này — chỉ verify Section API, chưa migrate | ✅ Đúng — Wave 2a chỉ đổi cách tạo Section (aside), không đổi Widget Host mounting logic |

**Exit Gate 1:** Section API xác nhận đủ cho Left (qua Flow). Right (`sidebar-right`) verify tiếp ở Wave 2b. Không phát hiện thiếu năng lực → tiếp tục Wave 2b theo kế hoạch.

---

# 4. Wave 2a — Flow (VR-01)

**Widget Host (giữ + khoá):** `<aside data-ifx-section="sidebar">` trong `widgets/flow-page/index.js`, tự fetch `PagePublished` publishKey `flow`, mount qua `IfluxPageLayoutEngine.buildHostTree(root, 'flow')`. Widget hiện tại: `WGT-FLW-SUBJ-STOCK`, `WGT-FLW-SUBJ-SECTOR`.

**Page-specific data:** Owner xác nhận **không có** (Discover 2026-08-11 xác nhận đúng).

**Residual/legacy — CORRECTED 2026-08-11 sau khi trace lại caller chain trước khi xoá (Owner rule: không xoá nếu còn caller/consumer/runtime dependency):**
- ✅ **Xoá (đã xác nhận chết, không producer/consumer nào):**
  - `#ifx-flow-market-sidebar` — CSS id rule (`flow.css`), HTML chỉ có `class`, chưa từng có `id`
  - `.ifx-flow-card--zone` / `--risk` / `--subject` — 3 modifier class không JS nào gán
  - `.ifx-flow-summary--sidebar` — modifier class không JS nào gán (chỉ base `.ifx-flow-summary` có producer, giữ nguyên)
- ❌ **KHÔNG xoá — corrected (Plan cũ ghi sai là dead, thực tế có caller sống):**
  - `flow-market-sidebar.js` (`IfluxFlowMarketSidebar`) — có chain sống: `widget-registry.js` (`WGT-FLW-CTX` → `renderAs: WGT-FLW-MKT-SIDE`) → `widget-renderers.js:181-183` → `widget-module-catalog.js:157-159`. Đây là **Widget Catalog hợp lệ, chỉ đang chưa được Admin publish vào Flow sidebar** — không phải residual Sidebar Ownership. Xoá sẽ giảm danh mục Widget của Admin → thuộc quyết định Product/Widget Catalog, **không** thuộc scope Sidebar migration này.
  - `SIDEBAR_DEDICATED` (`#ifx-flow-subj-stock/sector`, `flow-page.js:7-22`) — DOM target không tồn tại (dead target) nhưng **có caller sống** (`refreshSidebar` bind vào event `iflux-market-tick` trong `init()`, gọi trên mọi tick). Không đủ điều kiện xoá theo 4 điều kiện Owner (thiếu "no caller"). Để lại, ghi nhận riêng cho review sau, không xử lý trong Wave này để tránh mở rộng scope.

| # | Task | Trạng thái |
|---|---|---|
| 2a.1 | Build canonical Left Sidebar Section cho Flow theo `ensureSections()` — thay `<aside>` HTML cứng bằng lệnh gọi `ensureSections(layoutRoot, {sections:[{key:'sidebar'}]})` trong `widgets/flow-page/index.js` (giữ class `ifx-flow-market-sidebar` cộng thêm trên section, cùng pattern `applyMarketLayout`/`applyHubLayout`) | ✅ DONE — deploy Production 2026-08-11 |
| 2a.2 | Migrate Widget Host — **không cần đổi**: `buildHostTree(root,'flow')` đã tìm section bằng `[data-ifx-section]/[data-section]` generic, hoạt động y nguyên với section mới do `ensureSections()` tạo, cùng publishKey `flow` | ✅ DONE — không có thay đổi runtime cần thiết, chỉ xác nhận |
| 2a.3 | Xoá 5 dòng CSS chết đã xác nhận (`#ifx-flow-market-sidebar` + 3 modifier zone/risk/subject + `--sidebar` orphan) | ✅ DONE — deploy Production 2026-08-11 |
| 2a.4 | Verify Layer 1-6 (`04` §23) trên Flow | ✅ Source/runtime PASS — xem Evidence dưới |
| 2a.5 | **Dual verification:** Owner xác nhận UI qua Admin Widget Placement cho page Flow; Agent xác nhận source không còn bypass | ✅ **Owner PASS 2026-08-11** — "UI đúng vị trí, widget hiển thị bình thường, layout desktop/mobile không lỗi" |
| 2a.6 | PASS cả 2 → coi Flow migration CLOSED, mở Wave 2b | ✅ CLOSED |

**Evidence 2a.4 (source/runtime):**
- Deployed file khớp 100% source local (`curl` production == file local sau edit).
- `ensureSections()` (`app-shell.js:29-51`) là hàm generic, không đổi để phục vụ Flow — Flow chỉ trở thành consumer thứ 3 (sau Home/Market).
- `page-layout-engine.js:buildHostTree` xác định section bằng `querySelectorAll('[data-ifx-section],[data-section]')` toàn subtree `root` — không phân biệt section được tạo bởi `ensureSections()` hay hardcoded HTML → Widget Host mounting **không có thay đổi hành vi**.
- Baseline Admin `GET /api/pages/flow` **không đổi** (không PUT/POST nào được gọi) — 15 placements y nguyên. Trong đó `WGT-CUS-002` (section=sidebar, **enabled=true**, "Test kháng cự/hỗ trợ") đang **sống thật trên Production** → đủ để Owner UI-test mà **không cần** tạm bật gì (baseline production đã sẵn có 1 widget enabled trong sidebar Flow).
- `WebFetch https://iflux.vn/dong-tien` trả về đúng nội dung render (title/tabs) → xác nhận `mount()`/`buildFlowLayout()` không throw lỗi runtime sau khi đổi.

**Exit Gate 2a:** ✅ **PASS — Wave 2a CLOSED 2026-08-11.** Layer 1-6 PASS + Owner UI PASS + Agent source PASS. Wave 2b mở theo đúng thứ tự.

---

# 5. Wave 2b — Community (VR-02)

**Widget Host (giữ + khoá):** trước đây `<aside class="ifx-com-feed-sidebar" data-ifx-section="sidebar-right">` viết tay trong `community-page.js` (`renderShell`), publishKey `community`. Widget hiện tại (baseline Production, không đổi): 9 placements, 2 đang `enabled=true` — `WGT-COM-003` ("Chuyên gia nổi bật") + `WGT-COM-002` ("Thành viên tích cực").

**Page-specific data:** Owner xác nhận **không có** (Discover xác nhận đúng).

**Residual/legacy — re-verify caller chain trước khi xoá (bài học từ Wave 2a):**
- ✅ `mountSidebar` / `mountTrending` — xác nhận no-op thật (`void root;`, comment tự ghi "Layout Engine tạo host"), không export ra `IfluxCommunityPage` public API → **đã xoá**.
- ✅ `mountFeaturedExperts` — xác nhận **không có call site nào** trong file (chỉ có definition), DOM target `[data-ifx-com-experts-mount]` không được tạo ở đâu, không export public API → **đã xoá**. (`IfluxCommunityFeaturedExperts` global vẫn sống qua 2 đường khác — `widgets/community-list/index.js`, `widget-renderers.js` — không đụng.)

**Gap phát hiện khi thực thi (không có trong Plan gốc):** `ensureSections()` (`app-shell.js`) chỉ special-case tag `<aside>` + `aria-label` cho `key === 'sidebar'`, chưa xử lý `sidebar-right` → nếu dùng thẳng sẽ tạo `<div>` mất `aria-label`. Đã **sửa trực tiếp trong hàm canonical hiện có** (không tạo hàm mới): `isSidebar = key === 'sidebar' || key === 'sidebar-right'`.

**Gap kỹ thuật thứ 2:** `community-page.js` là legacy IIFE (`(function(global){...})(window)`), không phải ESM — không thể `import` trực tiếp `ensureSections` từ `app-shell.js`. Giải quyết bằng bridge tối thiểu: `widgets/community-page/index.js` (ESM wrapper đã có) import `ensureSections` rồi gán `window.IfluxRuntimeSections = { ensureSections }` trước khi gọi `IfluxCommunityPage.init()` — cùng nguyên tắc `IfluxPageLayoutEngine` (global bridge cho cả ESM + legacy dùng chung), không phải abstraction mới.

| # | Task | Trạng thái |
|---|---|---|
| 2b.1 | Build canonical Right Sidebar Section cho Community theo `ensureSections('sidebar-right')` — sửa `renderShell()` trong `community-page.js` để gọi qua bridge `window.IfluxRuntimeSections.ensureSections()` thay vì viết `<aside>` tay | ✅ DONE — deploy Production 2026-08-11 |
| 2b.2 | Migrate Widget Host — **không cần đổi**: `buildHostTree(root,'community')` (gọi từ `widgets/community-page/index.js:mountFromHostTree`) đã generic theo `[data-ifx-section]`, hoạt động y nguyên với section mới | ✅ DONE — xác nhận không cần thay runtime mounting |
| 2b.3 | Xoá `mountSidebar`/`mountTrending`/`mountFeaturedExperts` (đã re-verify không caller/consumer) | ✅ DONE |
| 2b.4 | Verify Layer 1-6 trên Community | ✅ Source/runtime PASS — xem Evidence dưới |
| 2b.5 | **Dual verification:** Owner test UI qua `/cong-dong` (2 widget baseline đã enabled sẵn — không cần bật/tắt); Agent xác nhận Right Section không có consumer bypass khác | ✅ **Owner PASS 2026-08-11** |
| 2b.6 | PASS → CLOSED, mở Wave 2c | ✅ CLOSED |

**Evidence 2b.4 (source/runtime):**
- Deployed file khớp 100% source local (curl production == file local sau edit) cho cả 8 file thay đổi (`app-shell.js`, `page-runtime.js`, `flow-page/index.js`, `community-page/index.js`, `community-page.js`, `features/community.manifest.js`, `pages/community.manifest.js`, `bootstrap.js`).
- CSS `.ifx-com-feed-sidebar`/`.ifx-com-feed-layout` (`community.css:772-790`) không đổi — DOM order giữ nguyên (main = column 1 `1fr`, sidebar-right = column 2 `300px`, khớp thứ tự `insertAdjacentHTML` main trước → `ensureSections` append sidebar sau).
- `.ifx-rt-section`/`.ifx-rt-section--sidebar-right` xác nhận **không có CSS rule nào** trong repo → thêm class này lên section không có side-effect hình ảnh, toàn bộ style vẫn từ `.ifx-com-feed-sidebar` giữ nguyên.
- Baseline Admin `GET /api/pages/community` **không đổi** (không PUT/POST) — 9 placements y nguyên, 2 `enabled=true` sẵn có (`WGT-COM-003`, `WGT-COM-002`) → Owner UI-test không cần tạm bật gì.
- `WebFetch https://iflux.vn/cong-dong` trả về nội dung render ("Tổng quan") sau khi purge cache → xác nhận `renderShell()`/`mount()` không throw lỗi runtime sau khi đổi.

**Exit Gate 2b:** ✅ **PASS — Wave 2b CLOSED 2026-08-11.** Layer 1-6 PASS + Owner UI PASS + Agent source PASS. Wave 2c mở theo đúng thứ tự.

---

# 6. Wave 2c — Entity List Pages (VR-03)

**Phạm vi:** `stocks · sectors · ecosystems · cauChuyen/chuDe` (4 pageKey cùng dùng **1 composite widget module duy nhất** `widgets/entity-list-page/index.js` + `entity-list-page.js`).

**Điều chỉnh so với Plan gốc (ghi rõ lý do — không tự ý mở rộng scope):** Plan gốc đề xuất pilot `stocks` trước rồi roll 3 page còn lại **1 page/lần**. Thực tế trace source cho thấy cả 4 page KHÔNG có 4 implementation riêng để tách pilot — chúng share **cùng một** `LAYOUT_HTML`/`buildElpLayout()`/`entity-list-page.js`, chỉ khác `config.kind` truyền vào lúc mount. Sửa 1 lần trong file chung = tự động áp dụng cho cả 4 pageKey, không có cách "chỉ deploy cho stocks". Vì vậy 2c.1-2c.4 chạy chung 1 lượt cho cả 4; 2c.5 Owner UI test làm trên toàn bộ 4 URL (không phải chỉ pilot).

**Widget Host (giữ + khoá):** section `sidebar` trong `.ifx-mkt-layout`, tự fetch `PagePublished` publishKey theo page (`stocks`/`sectors`/`ecosystems`/`cau-chuyen`).

**Page-specific data:** Owner xác nhận Stock list **không có** — chỉ Widget Host.

**Residual/legacy — đã re-verify trước khi xoá (không có caller nào khác ngoài định nghĩa):**
- `data-elp-sidebar` dead query (`entity-list-page.js:381` cũ) — biến `sidebar` gán rồi không dùng ở đâu, DOM target không tồn tại → **đã xoá**.
- `heatIcon`/`top10Icon`/`top10Title` trong `META` (4 kind) — định nghĩa nhưng không đọc ở đâu trong repo (tàn dư thiết kế Heatmap+Top10 sidebar chưa từng build) → **đã xoá**. Comment đầu file mô tả sai kiến trúc cũ ("Sidebar 1/4: Heatmap...") cũng đã sửa lại đúng thực tế (Widget Host canonical).

| # | Task | Trạng thái |
|---|---|---|
| 2c.1-2c.3 | Build canonical Left Sidebar Section qua `ensureSections()` (thay `<aside>` HTML cứng trong `LAYOUT_HTML`) áp dụng chung 4 pageKey; xoá residual đã xác nhận | ✅ DONE — deploy Production 2026-08-11 |
| 2c.4 | Verify Layer 1-6 trên cả 4 page | ✅ Source/runtime PASS — xem Evidence dưới |
| 2c.5 | **Dual verification:** Owner UI test trên cả 4 URL; Agent xác nhận source không còn bypass | ✅ **Owner PASS 2026-08-11** |
| 2c.6 | PASS cả 4 → CLOSED, mở Wave 3a/3b | ✅ CLOSED |

**Evidence 2c.4 (source/runtime):**
- Deployed file khớp 100% source local cho 7 file thay đổi (`widgets/entity-list-page/index.js`, `entity-list-page.js`, `pages/stocks|sectors|ecosystems|cau-chuyen.manifest.js`, `bootstrap.js`).
- Baseline Admin `GET /api/pages/{key}` **không đổi** (không PUT/POST):
  - `stocks`, `cau-chuyen`: **chưa có PagePublished record** — theo đúng nguyên tắc Owner (không tự tạo dữ liệu), chỉ verify structural: `ensureSections()` tạo đúng `<aside data-ifx-section="sidebar" data-section="sidebar" class="ifx-rt-section ifx-rt-section--sidebar ifx-mkt-sidebar">`, sẵn sàng nhận placement khi Admin publish sau này.
  - `sectors` (`WGT-MKT-004`, disabled), `ecosystems` (`WGT-MKT-005`, disabled) — có placement thật nhưng đang tắt, đúng baseline Wave 0, không đổi.
- CSS `.ifx-mkt-layout`/`.ifx-mkt-sidebar` (`market.css:17-47`) không đổi, DOM order (sidebar cột 1, main cột 2) khớp thứ tự `ensureSections()` tạo trước → `insertAdjacentHTML` main sau.
- `/co-phieu` xác nhận qua `curl` HTTP 200 + đúng `<title>`; trang yêu cầu đăng nhập (`IfluxAuth.requireAuth()` — hành vi có từ trước, không liên quan thay đổi) nên chỉ verify tới auth gate, không chặn do lỗi runtime.
- `/nganh`, `/he-sinh-thai` xác nhận `curl` HTTP 200 + đúng `<title>` cho static shell.

**Exit Gate 2c:** ✅ **PASS — Wave 2c CLOSED 2026-08-11.** Cả 4 pageKey Layer 1-6 PASS + Owner UI PASS + Agent source PASS. Wave 3a/3b mở theo đúng thứ tự.

---

# 7. Wave 3a — PAGE_OWNED Confirmation (VR-05 / VR-06 / VR-CP)

**Mục tiêu:** Xác nhận các sidebar này **giữ nguyên PAGE_OWNED**, không bị promote nhầm lên AppShell Section — không di chuyển code, chỉ khoá + audit.

| Page | Nội dung PAGE_OWNED (giữ nguyên) | Widget Host? | Hành động |
|---|---|---|---|
| Profile (`account/profile.html:80-84`) | Profile block (avatar/stats/plan promo) qua `IfluxProfileSidebar` | **Không** — không fetch `PagePublished` | Giữ nguyên, khoá là PAGE_OWNED, không migrate |
| Checkout | Order summary trong Main | Không | Giữ nguyên, khoá PAGE_OWNED |
| Article detail (`community-post-page.js:233-246, 528-541`) | 6 block: Topic, Sector, Ecosystem, Stock, TOC, Comments (Interaction Host) | **Không** — không có Widget Host riêng | Giữ nguyên toàn bộ 6 block, khoá PAGE_OWNED, **không** tách/gộp |

**Loại khỏi scope migration (không phải Sidebar hệ thống):**
- Messages (`widgets/messages-page/index.js:54-55`, `.ix-chat-sidebar`) — cột danh sách hội thoại của layout chat nội bộ 3 cột, **không** phải AppShell Section. Owner đã xác nhận. Không đưa vào bất kỳ Wave nào.

| # | Task |
|---|---|
| # | Task | Trạng thái |
|---|---|---|
| 3a.1 | Xác nhận Profile/Checkout/Article không có Widget Host bị bỏ sót | ✅ Re-verify 2026-08-11 — `grep PagePublished\|buildHostTree\|data-ifx-section` trên `account/profile.html` và `community-post-page.js`: **0 match cả hai** → xác nhận không có Widget Host, PAGE_OWNED đúng |
| 3a.2 | Ghi nhận chính thức trong `04` §4A (đã khoá) — không cần hành động code | ✅ Đã khoá từ trước, không đổi |
| 3a.3 | Xác nhận Messages bị loại khỏi migration scope | ✅ Re-verify — `.ix-chat-sidebar` (`widgets/messages-page/index.js:54`) không có `data-ifx-section`/`data-section` nào → thuần layout column, không phải AppShell Section |
| 3a.4 | Ghi nhận riêng (không hành động code trong Wave này): naming confusion ở Profile — `profile-bind.js:287-288` comment gọi `IfluxProfileSidebar` là "Widget/dashboard legacy alias", và `profile-sidebar-widgets.js` + `widget-registry.js:412-459` (`PRF-001`) gợi ý Profile có Widget Host nhưng **không** gắn vào `/tai-khoan` (chỉ dùng cho sidebar Nhà của tôi/Home). Rủi ro nhầm lẫn khi đọc code sau — nếu muốn dọn triệt để, cần task riêng đổi tên/alias, không phải Sidebar migration này | Ghi nhận, không xử lý trong Wave này |

**Exit Gate 3a:** ✅ **PASS — Wave 3a CLOSED 2026-08-11.** Không có code change — chỉ audit confirm.

---

# 8. Wave 3b — VR-04: Stock Detail + Group Pages (Section-only convergence)

**Đã resolved 2026-08-11** (xem `04` §9). Đây là **SPLIT decision** — không gộp cả cột trái thành 1 sidebar owner.

### 8.1 Stock Detail (`stock-page.js:242-245`)

| Thành phần | Phân loại | Hành động |
|---|---|---|
| `[data-ifx-section="sidebar"]` — fetch `PagePublished` publishKey `stock-detail` | **Widget Host** | Migrate vào canonical Left Sidebar Section |
| `section.ifx-stock-panel` (candlestick chart + stock header) — **sibling** của Widget Host, không nằm trong host | **Page-specific data** | **Giữ nguyên trong Main**, không promote vào Sidebar Section |

### 8.2 Group Pages qua `group-page.js` (shared module — Sector / Family / Article-family detail)

| publishKey | Page | Widget Host |
|---|---|---|
| `sector-detail` | Ngành | `[data-ifx-section="sidebar"]`, `group-page.js:111-114` |
| `eco-detail` | Hệ sinh thái | cùng mechanism |
| `cau-chuyen-detail` | Câu chuyện (Article family) | cùng mechanism |

Vì `group-page.js` là **1 module dùng chung 3 publishKey** → migrate 1 lần, verify cả 3 publishKey trong cùng sub-wave (không tách 3 unit riêng vì cùng code path — tránh 3 lần regression trùng lặp không cần thiết).

| # | Task | Trạng thái |
|---|---|---|
| 3b.1 | Build canonical Left Sidebar Section cho `stock-page.js` (publishKey `stock-detail`) | ✅ DONE — `mountSidebarHost()` gọi `ensureSections()` qua bridge `window.IfluxRuntimeSections` (ESM `widgets/stock-page/index.js`), thay `<div data-ifx-section="sidebar">` cứng |
| 3b.2 | Migrate Widget Host, **giữ `section.ifx-stock-panel` (candlestick + header) nguyên vị trí trong Main**, không lồng vào Section | ✅ DONE — `.ifx-stock-panel` vẫn là sibling của `<aside data-ifx-section="sidebar">` trong `.ifx-stock-col--left`, dùng `insertBefore` để giữ đúng thứ tự (sidebar trước, panel sau) như markup cũ |
| 3b.3 | Verify Layer 1-6 trên Stock Detail — đặc biệt Layer 3 (Widget behavior) phải xác nhận candlestick không bị ảnh hưởng | ✅ Source PASS — `renderHeader`/`data-ifx-ohlc-chart` không đổi; `mountSidebarHost` chạy trước event `iflux-knowledge-remount-widgets` nên không đổi race hiện có |
| 3b.4 | Build canonical Sidebar Section cho `group-page.js` (áp dụng đồng thời cho 3 publishKey vì cùng module) | ✅ DONE — cùng pattern, bridge qua `widgets/group-page/index.js` |
| 3b.5 | Migrate Widget Host cho `group-page.js`, giữ nguyên 3 publishKey (`sector-detail`/`eco-detail`/`cau-chuyen-detail`) | ✅ DONE — 1 module dùng chung, không tách 3 unit |
| 3b.6 | Verify Layer 1-6 trên cả 3 page family (Sector/Ecosystem/Article-family) | ✅ Source PASS + HTTP 200 cả 4 URL (`/co-phieu/HPG`, `/nganh/1`, `/he-sinh-thai/1`, `/cau-chuyen/1`) |
| 3b.7 | Dọn sticky CSS `.ifx-stock-col--*`; dọn field `detail.chart`/`detail.net_flow` | ✅ DONE — xoá `.ifx-stock-col--right` (3 chỗ trong `stock.css`, xác nhận dead: không JS nào tạo class này, `entity-detail-center.js` chỉ tạo `--center`); xoá `chart:null`/`net_flow:null` trong `stock-page.js` + `group-page.js` (xác nhận không đọc ở đâu) |
| 3b.8 | **Dual verification:** Owner test Admin Widget Placement cho `stock-detail` + 3 group publishKey; xác nhận candlestick/page-specific content còn đủ, đúng vị trí; Agent xác nhận source không bypass | ✅ **Owner PASS 2026-08-11** — baseline cả 4 publishKey chưa có `PagePublished` (structural-only), Owner xác nhận UI đúng trên `/co-phieu`, `/nganh`, `/he-sinh-thai`, `/cau-chuyen`. Agent source PASS |
| 3b.9 | PASS → CLOSED | ✅ CLOSED |

**Exit Gate 3b:** ✅ **PASS — Wave 3b CLOSED 2026-08-11.** Layer 1-6 Agent source PASS + Owner UI PASS. Mở Wave 4.

---

# 9. Wave 4 — Compliance Closure

**Mục tiêu:** Re-audit composition `Page → AppShell → Section → Widget Host` trên toàn bộ surface đã migrate (2a, 2b, 2c, 3b).

| # | Task | Trạng thái |
|---|---|---|
| 4.1 | Xác nhận không còn AppShell-semantic drift trên Flow/Community/ELP(4 page)/Stock Detail/Group(3 page) | ✅ PASS — `grep 'data-ifx-section=\"sidebar\|sidebar-right\"'` toàn `User_Web`: **chỉ 1 match**, là `querySelector` đọc (`community-page.js:441`), **0 match** là tạo hardcode string. Mọi host hiện tại đều do `ensureSections()` sinh ra |
| 4.2 | Xác nhận không còn duplicate shell/sidebar capability nào bypass `ensureSections()` | ✅ PASS — `grep 'ensureSections('` xác nhận đúng **6 call site** dùng canonical API: `page-runtime.js` (Home/Market baseline), `widgets/flow-page/index.js` (VR-01), `community-page.js` (VR-02, qua bridge), `widgets/entity-list-page/index.js` (VR-03, dùng chung 4 page), `stock-page.js` + `group-page.js` (VR-04, qua bridge). Không còn implementation nào tự dựng `<div data-ifx-section>`/`<aside>` bằng HTML cứng |
| 4.3 | Re-check Dashboard Engine dead-code candidate (`dashboard-engine.js` — `ensureSidebarDefaults`, `renderSidebarStack`, `[data-ifx-hub-sidebar-canvas]`) | ✅ Re-verify 2026-08-11 — `data-ifx-hub-sidebar-canvas` vẫn **0 DOM target** (chỉ 2 `querySelector` đọc, không nơi nào tạo attribute này), nhưng `refreshSidebar()` vẫn có **caller sống**: `hub-page.js:158-159` gọi `IfluxDashboardEngine.refreshSidebar()` trực tiếp. **Chưa đủ 4 điều kiện xoá** (thiếu điều kiện "không caller") → giữ nguyên, tiếp tục là **accepted residual**, không block Foundation DoD |
| 4.4 | Thu thập evidence AC-05 (Compliance classify) trên toàn bộ CONVERGE surfaces | ✅ CLOSED by Plan evidence — xem bảng dưới |

### AC-05 Compliance Evidence (Wave 4 re-audit)

| Surface | VR | Ownership decision (`04` §4A) | Canonical Section evidence | Wave đóng |
|---|---|---|---|---|
| Flow Left Sidebar | VR-01 | CONVERGE | `widgets/flow-page/index.js:50` `ensureSections()` | 2a — Owner PASS |
| Community Right Sidebar | VR-02 | CONVERGE | `community-page.js:476` qua bridge `widgets/community-page/index.js` | 2b — Owner PASS |
| ELP (stocks/sectors/ecosystems/cau-chuyen) | VR-03 | CONVERGE | `widgets/entity-list-page/index.js:65` `ensureSections()` (module dùng chung 4 page) | 2c — Owner PASS |
| Stock Detail Section (candlestick/header giữ PAGE_OWNED) | VR-04 | CONVERGE (Section) / PAGE_OWNED (content) | `stock-page.js:260` qua bridge `widgets/stock-page/index.js` | 3b — Owner PASS |
| Group Section (sector/eco/cau-chuyen-detail, 3 publishKey chung module) | VR-04 | CONVERGE (Section) / PAGE_OWNED (content) | `group-page.js:129` qua bridge `widgets/group-page/index.js` | 3b — Owner PASS |
| Profile Sidebar | VR-05 | PAGE_OWNED (không Widget Host) | `account/profile.html` — 0 match `PagePublished`/`data-ifx-section` | 3a — audit confirm |
| Checkout order summary | VR-06 | PAGE_OWNED | Giữ nguyên trong Main | 3a — audit confirm |
| Article detail aside (6 block) | VR-CP | PAGE_OWNED | `community-post-page.js` — 0 match `PagePublished`/`data-ifx-section` | 3a — audit confirm |
| Messages chat column | (loại khỏi scope) | Không phải AppShell Section | `.ix-chat-sidebar` không có `data-ifx-section` | 3a — audit confirm |

**Exit Gate 4:** ✅ **PASS — Wave 4 CLOSED 2026-08-11.** AC-01 → AC-11 đều SATISFIED/LOCKED (theo `04` §28A); AC-12 (Downstream readiness) dời sang Wave 5 theo đúng thiết kế Solution.

---

# 10. Wave 5 — Downstream Enablement

**Mục tiêu:** Foundation DoD đóng → mở `100826_AppShell_Sidebar_Scroll_Behavior` (downstream), consume canonical Left/Right Sidebar Section.

| # | Task | Trạng thái |
|---|---|---|
| 5.1 | Xác nhận canonical Left/Right Sidebar Section đã sẵn sàng làm structural shell cho downstream Scroll Behavior | ✅ PASS — 9 surface (Home/Market baseline + Flow + Community + ELP×4 + Stock Detail + Group×3) đều dùng chung 1 API `ensureSections()`, cùng contract `data-ifx-section`/`data-section`/`aria-label`. Downstream có thể consume 1 contract duy nhất, không cần xử lý riêng từng page |
| 5.2 | Nghiên cứu khả năng Section shell (không phải content) reuse qua soft-navigation tương tự Header | ✅ Research DONE — đọc `runtime/soft-navigation.js:152-166` (`teardownOutlet()`): mỗi lần soft-nav, `mount.innerHTML = ''` xoá **toàn bộ** `[data-ifx-page-runtime]` (bao gồm mọi Section vừa converge) trước khi mount page mới. Header/Nav/Footer **không** bị xoá vì nằm **ngoài** mount point này (static AppShell chrome). **Finding: Sidebar Section hiện KHÔNG persistent** — để đạt structural persistence như Header, Section host phải được hoist ra ngoài `[data-ifx-page-runtime]` vào static chrome, đây là quyết định kiến trúc **thuộc downstream task**, không tự làm ở Foundation này |
| 5.3 | Handoff downstream task — Sidebar Scroll KHÔNG tự discover ownership, không patch Page-local structure độc lập (`04` §25) | ✅ Handoff note ghi ngay trong Exit Gate 5 dưới đây; task downstream `100826_AppShell_Sidebar_Scroll_Behavior` chỉ mở khi Owner yêu cầu, không tạo trước |

**Exit Gate 5:** ✅ **PASS — Foundation task CLOSED 2026-08-11.** Bàn giao downstream `100826_AppShell_Sidebar_Scroll_Behavior` (task riêng, mở khi Owner yêu cầu) consume canonical Section contract đã chuẩn hoá ở Wave 0–4; downstream KHÔNG được tự phát sinh Section/Host mới hoặc tự quyết định persistence — phải dựa trên finding ở 5.2.

---

# 11. Rollback Safety

Mỗi sub-wave migrate code thật (2a, 2b, 2c, 3b) đều phải:
- Backup trạng thái trước khi đổi (đúng nguyên tắc "chỉ backup khi Owner yêu cầu backup" — ở đây backup là **safety net kỹ thuật nội bộ trong quá trình migrate**, không phải deliverable riêng cho Owner).
- Nếu Dual verification FAIL ở bất kỳ sub-wave → rollback sub-wave đó, **không tiếp tục sang sub-wave kế**, quay lại Classify/Lock để xác định lại root cause.

---

# 12. Exit Condition — Toàn bộ Task

Theo đúng 9 điều kiện Owner đã chốt (áp dụng lại nguyên văn):

1. Mỗi Sidebar có canonical owner rõ ràng.
2. Không còn page/widget tự dựng Sidebar bypass `ensureSections()`.
3. Widget Host được xác định và kết nối đúng Widget Runtime.
4. Admin Widget Placement vẫn điều khiển được Widget Host.
5. Page-specific data (candlestick, Profile block, Article 6-block, Checkout summary) vẫn tồn tại đúng page.
6. Residual/legacy Sidebar code đã loại bỏ an toàn (Flow/Community/ELP residual — đã xác nhận không consumer).
7. Messages không bị biến thành Sidebar giả.
8. Dashboard Engine dead-code candidate: xoá nếu đủ 4 điều kiện ở Wave 4, giữ nguyên + ghi nhận nếu chưa đủ.
9. Các Sidebar đã migrate đều có Owner UI PASS + Source PASS + Regression PASS.

**Task chỉ đóng khi cả 5 Wave (2a/2b/2c/3a/3b) đạt Exit Gate riêng + Wave 4 Compliance Closure PASS.**

---

# 13. Thứ tự thực thi tổng thể

```text
Wave 0 (Safety Baseline)
   ↓
Wave 1 (Section API verify)
   ↓
Wave 2a Flow → Exit Gate → Wave 2b Community → Exit Gate → Wave 2c ELP (pilot→roll) → Exit Gate
   ↓
Wave 3a (PAGE_OWNED confirm — có thể chạy song song, không code) 
   ↓
Wave 3b VR-04 (Stock Detail + Group 3-page) → Exit Gate
   ↓
Wave 4 Compliance Closure → Exit Gate
   ↓
Wave 5 Downstream handoff
```

**Chờ Owner xác nhận Plan này trước khi bắt đầu Wave 0 trên Production.**
