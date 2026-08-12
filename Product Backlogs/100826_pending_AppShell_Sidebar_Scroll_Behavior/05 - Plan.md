# 05 — Implementation Plan — AppShell Sidebar Scroll Behavior

| | |
| --- | --- |
| **Task ID** | `100826_AppShell_Sidebar_Scroll_Behavior` |
| **Status** | ⛔ **ABANDONED — v2 ROLLED BACK (2026-08-11)** — xem §0c. Cả v1 (JS dual-rail) và v2 (CSS `position:sticky`) đã bị revert hoàn toàn. |
| **Input** | `04 - Solution` v2 (APPROVED, sau đó ABANDONED) |
| **Rule** | Mỗi Wave có Exit Gate — PASS mới mở Wave kế, giống mô hình Foundation task |

---

## 0c. Owner Decision — Abandon + Rollback (2026-08-11, sau khi v2 vẫn không hoạt động đúng trên Production)

**Bối cảnh:** Sau khi triển khai v2 (CSS `position:sticky`), Owner báo "không thấy nó hoạt động" trên Production nhiều lần. Agent audit sâu và tìm ra 2 nguyên nhân thật:

1. `legacy-bridge.js` được import ở ~46 file với query string cache-bust **không bao giờ được bump** (`?v=cssPin20260808`, `?v=phaseCW420260721`...) trong khi nội dung file đổi nhiều lần → Cloudflare edge cache phục vụ bản cũ không nhất quán giữa các request, khiến `normalizeStyleHref()` (hàm ép version cho `community.css`) trả về version cũ, làm sai lệch CSS nạp cho Sidebar.
2. Ngay cả sau khi sửa cache-bust, kiểm chứng bằng Chrome headless (CDP) trực tiếp trên Production cho thấy `position: sticky` được set đúng qua `getComputedStyle` nhưng **hành vi thực tế khi scroll vẫn y như `position: static`** (di chuyển 1:1 theo scrollY, không dừng lại ở `top`) — tái hiện được cả trong file test cách ly (`file://`) với đúng tổ hợp `html`/`body` đều `overflow-y: auto !important` (rule sẵn có từ trước, không phải do task này tạo ra). Nguyên nhân sâu hơn (browser sticky + containing block trong tổ hợp CSS hiện tại của AppShell) **chưa được xác định dứt điểm** khi Owner quyết định dừng.

**Quyết định Owner:** Dừng toàn bộ task, không tiếp tục điều tra/implement viewport-following cho Sidebar. Rollback về đúng trạng thái trước khi task này mở (baseline: sau khi Sidebar Ownership Foundation Wave 5 hoàn tất — widgets đã đồng bộ).

**Rollback đã thực hiện:**

| Thay đổi (task này) | Hành động rollback |
| --- | --- |
| `runtime/sidebar-scroll.js` (JS dual-rail) | Đã xoá trong quá trình switch sang CSS — giữ nguyên đã xoá |
| Wiring `attachSidebarScroll` (`page-runtime.js`, `community-page.js`, bridge) | Đã xoá trong quá trình switch sang CSS — giữ nguyên đã xoá |
| CSS `position:sticky` + mobile reset trên `.ifx-mkt-sidebar` (`market.css`), `.ifx-hub-sidebar` (`hub.css`), `.ifx-flow-market-sidebar` (`flow.css`), `.ifx-com-feed-sidebar` (`community.css`) | **Revert** — trả về đúng rule gốc trước task, không còn `position: sticky`/`top`/`max-height`/`overflow-y:auto` |
| `app-shell.css` `.ifx-app` bỏ `overflow-x: hidden` (sửa để debug sticky) | **Revert** — trả lại `overflow-x: hidden;` như nguyên bản |
| `legacy-bridge.js` cache-bust version (~46 file, `?v=cssPin20260808`/`phaseCW420260721`/`shareAffP5_20260727` → `?v=stickyFix20260811`) | **GIỮ LẠI** — đây là fix cho bug CDN cache-staleness thật (không liên quan hành vi sticky), revert lại sẽ tái tạo bug cũ cho `community.css` version bị lệch trên các widget khác. Đã báo riêng cho Owner. |
| Widget Host cho "Chi tiết bài viết" (`com-post-detail`) — Admin catalog + `mountSidebarWidgetHost()` | **GIỮ LẠI** — yêu cầu riêng của Owner, đã xác nhận PASS trên Widget Placement, không phải "sticky code". |

**Đã deploy + purge Cloudflare cache** sau rollback — xem `06 - Verification-Evidence` (nếu cần) hoặc log hội thoại.

## 0b. Mechanism Override — Plan v1 (JS Wave 0–5) → v2 (CSS-only)

Sau Owner test JS dual-rail (Market pilot + Community pull-forward) và đánh giá **không mượt** (`04` §0b), toàn bộ Wave 1–5 JS bên dưới được **thay bằng 1 lần sửa CSS + xoá JS**, áp dụng đồng thời cho cả 6 surface D1 (không còn cần rollout tuần tự "dầu loang" — vì không có runtime risk/regression cần cách ly như JS, mỗi surface chỉ là 6 dòng CSS trên class đã có sẵn):

| Wave v1 (JS) | Trạng thái thực tế sau override |
| --- | --- |
| Wave 0 — Baseline | Giữ nguyên làm evidence lịch sử |
| Wave 1 — Build module + Market pilot | **Reverted** — `sidebar-scroll.js` xoá, wiring Market ở `page-runtime.js` xoá |
| Wave 4.3 pull-forward — Community | **Reverted** — wiring `attachSidebarScroll` ở `community-page.js`/bridge xoá |
| Wave 2 — Nhà (Home) | **DONE bằng CSS** — `.ifx-hub-sidebar` sticky trực tiếp, không cần chờ Wave riêng |
| Wave 3 — Container-End Release (D2) | **DONE bằng CSS Grid containing-block** — không cần đo `endRefEl` runtime |
| Wave 4 — Flow/ELP/Community/Stock/Group rollout | **DONE bằng CSS** cho Flow/ELP/Community (Market class reuse); Stock/Group **không đổi** (đã sticky sẵn, ngoài scope sửa) |
| Wave 5 — Full regression | Xem §Verification v2 dưới |

**File thay đổi thực tế (v2):**

* Xoá: `runtime/sidebar-scroll.js`.
* Sửa (xoá lệnh gọi JS): `runtime/page-runtime.js`, `community-page.js`, `widgets/community-page/index.js`.
* Sửa CSS (thêm sticky vào rule đã có, không tạo class mới): `market.css` (`.ifx-mkt-sidebar` — dùng chung cho Market + ELP), `hub.css` (`.ifx-hub-sidebar`), `flow.css` (`.ifx-flow-market-sidebar`), `community.css` (`.ifx-com-feed-sidebar`).
* Cache-bust: toàn bộ entry point/manifest import các file trên (`bootstrap.js` + mọi HTML `<script src=bootstrap.js?v=...>` + các `*.manifest.js` tham chiếu `hub.css`/`flow.css`/`community.css`).

**Verification v2 (thực hiện thay Wave 1.3–1.5 / 4.6 / 5.1–5.5):**

1. Nguồn: xác nhận đúng selector/class đã sửa, không còn import `sidebar-scroll.js` ở đâu (grep toàn repo).
2. Regression: `.ifx-mkt-main`/`.ifx-hub-main`/`.ifx-flow-main-col`/`.ifx-com-feed-main` không đổi vị trí/kích thước (sticky chỉ ảnh hưởng Sidebar, không tham gia layout của Main).
3. **Owner UI test** trên từng surface (desktop): cuộn xuống → Sidebar dính dưới Header 24px; cuộn tiếp → nhả đúng lúc đáy Main; cuộn lên → nhả về vị trí tự nhiên ngay tại đúng điểm đã dính (không "nhảy" sớm/muộn).
4. Mobile (≤768px Market/Home/Community, ≤1024px Flow): Sidebar về document-flow bình thường, không sticky.
5. Case C (nếu widget host dài hơn viewport khả dụng): xác nhận có thanh cuộn nội bộ trong Sidebar, không bị clip/mất nội dung.

---

## 0. Owner Decisions — LOCKED 2026-08-11

| # | Quyết định | Ảnh hưởng lên Plan |
| --- | --- | --- |
| **D1** | **Mở rộng scope** theo `03a` — 6 surface | Wave 4 chạy đầy đủ (không SKIP) |
| **D2** | **Footer = điểm cuối chung** Main + Sidebar | Wave 3 chạy (không SKIP) — implement Release Cap `04` §5 |
| **D3** | **Mobile = nội dung bình thường** (tắt hoàn toàn) | Wave 2.2 implement `matchMedia` guard theo breakpoint từng surface |

---

## 1. Wave 0 — Baseline Freeze (audit-only, không code)

| # | Task |
| --- | --- |
| 0.1 | Xác nhận lại danh sách Section element hiện có qua `ensureSections()` tại thời điểm bắt đầu (6 call site theo `02b`) — chụp snapshot selector/class, không đổi gì |
| 0.2 | Đo `topBound`/`bottomBound`/`sidebarHeight` thực tế cho mỗi surface trong scope D1 (Playwright hoặc thủ công), ghi lại làm baseline so sánh sau implementation |
| 0.3 | Xác nhận `page-runtime.js`/widget `mount()`/`unmount()` đã có hook nào tái sử dụng được cho `attachSidebarScroll`/`detach()` (không tạo lifecycle mới — SOt-19) |

**Wave 0 — Evidence (2026-08-11):**

* 0.1 ✅ Xác nhận 6 call site `ensureSections()` còn nguyên trạng sau Foundation: `page-runtime.js` (Market/Nhà), `widgets/flow-page/index.js`, `widgets/entity-list-page/index.js`, `community-page.js` (bridge), `stock-page.js` (bridge), `group-page.js` (bridge). Không đổi.
* 0.2 ⚠️ **Giới hạn công cụ:** không có Playwright/browser automation trong phiên này để đo pixel `topBound`/`bottomBound`/`sidebarHeight` thực tế trước khi code. Vì thuật toán đo **live tại runtime** (không hardcode số đo — đúng SOt-11), việc thiếu số đo trước không chặn implementation — nhưng **không có bằng chứng "trước/sau" bằng số** để so sánh. Bù bằng: giữ nguyên `Main.getBoundingClientRect()` làm regression check (1.4) + Owner UI test trực tiếp (1.5) thay cho so sánh số liệu.
* 0.3 ✅ Xác nhận `soft-navigation.js:164` (`teardownOutlet()`) đã dispatch `document.dispatchEvent(new CustomEvent('iflux-page-teardown'))` — dùng làm hook detach() có sẵn, không tạo lifecycle mới. `sidebar-scroll.js` tự đăng ký/gỡ listener này (once).

**Exit Gate 0:** PASS (với ghi nhận giới hạn 0.2 ở trên, không phải blocker vì kiến trúc đo-live).

---

## 2. Wave 1 — Build Shared Module (1 surface pilot)

| # | Task |
| --- | --- |
| 1.1 | Tạo `runtime/sidebar-scroll.js` — implement dual-rail clamp (`04` §3) thuần, chưa wiring vào page nào |
| 1.2 | Pilot wiring vào **Thị trường** (Market) — surface đơn giản nhất, Case A, đã IN SCOPE ở cả 2 phương án D1 |
| 1.3 | Manual verify Layer: scroll down chậm/nhanh, scroll up ngay, scroll xuống sâu → lên hết — đối chiếu `01 - BRD` §16.H từng dòng cho riêng Market |
| 1.4 | Đo lại `Main.getBoundingClientRect()` không đổi qua toàn chu kỳ (regression check §9 `04`) |
| 1.5 | **Owner UI test** trên `/thi-truong` — xác nhận cảm giác scroll đúng, không giật, không lệch |

**Wave 1 — Evidence (2026-08-11):**

* 1.1 ✅ Tạo `User_Web/iflux-web-ui/runtime/sidebar-scroll.js` — export `attachSidebarScroll(sidebarEl, opts)`, implement dual-rail clamp (`04` §3) + Release Cap rail (§5, `opts.endRefEl`) + mobile guard (§9, `opts.mobileBreakpoint`) trong 1 hàm. Tự cleanup qua `iflux-page-teardown` (0.3).
* 1.2 ✅ Wiring vào Market: `page-runtime.js` — sau `applyMarketLayout(mountEl)`, gọi `attachSidebarScroll(sectionMap.sidebar, { endRefEl: sectionMap.main, mobileBreakpoint: 768 })`. Comment tường minh ghi rõ đây là Wave 1 pilot, Nhà mở ở Wave 2. Cache-bust: `sidebar-scroll.js?v=scrollWave1_20260811`, `page-runtime.js?v=scrollWave1_20260811` (đổi trong `bootstrap.js`).
* Deploy Production: 3 file (`sidebar-scroll.js` mới, `page-runtime.js`, `bootstrap.js` sửa) rsync + Cloudflare purge — verify remote grep khớp nội dung local, `/thi-truong` HTTP 200.
* 1.3–1.4 ⏳ Cần Owner UI test trực tiếp (không có browser automation trong phiên) — xem 1.5.
* 1.5 ⏳ **Chờ Owner UI test trên `/thi-truong`** — cuộn xuống chậm/nhanh, cuộn lên ngay giữa chừng, cuộn xuống hết trang rồi lên hết, kiểm tra Main không nhảy/lệch, không giật hình.

**Exit Gate 1:** ⏳ PENDING Owner UI test. Không mở Wave 2 cho đến khi có xác nhận PASS.

**Pull-forward 2026-08-11 (theo yêu cầu Owner):** Market (`/thi-truong`) hiện chưa có nội dung hiển thị đủ để cảm nhận behavior → Owner yêu cầu làm sớm **Community (Wave 4.3)** để có nội dung test ngay. Đã wiring `attachSidebarScroll` vào Community Right Sidebar (`community-page.js` + bridge `widgets/community-page/index.js`), `endRefEl=.ifx-com-feed-main`, `mobileBreakpoint=768`. Deploy + purge xong. **Wave 4.3 coi như DONE sớm** — không cần làm lại ở Wave 4, chỉ cần Owner UI test trên `/cong-dong` cùng lúc với Market.

**Bổ sung ngoài scope Scroll (Owner request 2026-08-11, không thuộc D1/03a):** Owner yêu cầu thêm Widget Host cho Sidebar phải trang **Chi tiết bài viết Cộng đồng** (`/cong-dong/bai-viet/:id`, pageKey `com-post-detail`) — trang này trước đó là PAGE_OWNED thuần (audit `02b` xác nhận, không phải 1 trong 6 surface đã khoá). Đây là thay đổi kiểu **Foundation** (thêm Section + Widget Host convergence), KHÔNG phải Scroll Behavior — đã thực hiện riêng, tách bạch:
* Admin: `page-settings-catalog.js` — thêm `sections.sidebar-right` + `PAGE_REGIONS['com-post-detail']=['sidebar-right']` cho `com-post-detail`.
* Frontend: `community-post-page.js` (`mountSidebarWidgetHost()` chèn Section TRƯỚC 6 block đặc thù) + `widgets/community-post-page/index.js` (bridge `ensureSections()` + `mountFromHostTree()` qua `IfluxPageLayoutEngine`/`mountPublishedWidgets`, publishKey `com-post-detail`).
* **KHÔNG** wiring `attachSidebarScroll()` cho surface này — ngoài scope D1/03a đã khoá của task Scroll. Nếu Owner muốn cả scroll-follow ở đây, cần quyết định mở rộng scope riêng (giống D1).
* Deploy + purge xong. Owner có thể test qua Admin Widget Placement (page-settings.html → "Chi tiết bài viết" → tab Widget Placement → region "Sidebar phải") + xem trên 1 bài viết thật.

---

## 3. Wave 2 — Second Surface (Nhà) + Responsive Decision (D3)

| # | Task |
| --- | --- |
| 2.1 | Wiring vào **Nhà** (Home) — Case A/B tuỳ nội dung dashboard thực tế (Widget Placement động, có thể tạo Case B/C thật — cần đo lại tại runtime, không giả định) |
| 2.2 | Áp quyết định D3 (mobile tắt/giữ) — implement `matchMedia` guard nếu Owner chọn tắt |
| 2.3 | §16.H full matrix cho Nhà + responsive breakpoint check (≤768/1024px) |
| 2.4 | **Owner UI test** trên `/nha-cua-toi` (desktop + mobile viewport) |

**Exit Gate 2:** §16.H PASS trên Nhà + responsive theo D3 + Owner UI PASS.

---

## 4. Wave 3 — Container-End Release (D2 = có, Footer chung — chạy đầy đủ)

| # | Task |
| --- | --- |
| 3.1 | Implement Release Cap rail (`04` §5) — đo `containerEndTop` qua Main content sibling (Footer chrome "Reserved — not active" theo Foundation SoT, chưa có DOM; Owner xác nhận 2026-08-11 dùng đáy Main làm mốc tạm, đổi sang `<footer>` sau khi Footer được xây) |
| 3.2 | Test case bổ sung: cuộn qua hết Main → xác nhận Sidebar không đè Footer, chuyển tiếp không jump |
| 3.3 | **Owner UI test** — xác nhận cảm giác "nhả" tự nhiên ở cuối trang |

**Exit Gate 3:** §16.H bổ sung case Footer PASS + Owner UI PASS.

---

## 5. Wave 4 — Scope Rollout (D1 = mở rộng theo `03a` — chạy đầy đủ)

| # | Task |
| --- | --- |
| 4.1 | Wiring Flow Left Sidebar — Case đã đo ở `02b`/`02a` (Case C, tall) — verify đúng bottom-pin reveal behavior |
| 4.2 | Wiring ELP (4 route, 1 module `widgets/entity-list-page/index.js`) — 1 lần áp cho cả 4, giống Foundation Wave 2c |
| 4.3 | Wiring Community Right Sidebar (`sidebar-right`) — verify riêng vì là Right, không phải Left (đo lại `topBound`/`bottomBound` — công thức không đổi vì generic theo Left/Right) |
| 4.4 | Wiring Stock Detail Section — **chỉ áp lên `[data-ifx-section=sidebar]`**, **không** áp lên `.ifx-stock-panel` (candlestick, PAGE_OWNED, đã có sticky riêng theo `03a`/F-03 — 2 mechanism khác nhau tồn tại song song trên cùng cột, phải verify không xung đột) |
| 4.5 | Wiring Group Section (3 publishKey, 1 module) |
| 4.6 | §16.H full matrix cho từng surface mới + **Owner UI test riêng từng surface** (đúng mô hình dual verification Foundation) |

**Exit Gate 4:** Mỗi surface mở rộng phải PASS §16.H + Owner UI riêng trước khi tính surface kế — không migrate hàng loạt cùng lúc (đúng nguyên tắc "dầu loang" Foundation §29).

---

## 6. Wave 5 — Full Regression + Final Verification

| # | Task |
| --- | --- |
| 5.1 | Chạy lại toàn bộ AC-01 → AC-13 (`01 - BRD` §18) trên **mọi surface đã wiring** |
| 5.2 | Regression Header/Main/responsive trên toàn bộ route đã đổi (đúng NFR-05) |
| 5.3 | Soft-navigation regression: chuyển qua lại giữa 2 surface có Sidebar (vd Market ↔ Flow nếu D1=mở rộng) — xác nhận listener cũ được gỡ đúng, không leak (`04` §9) |
| 5.4 | Deploy Production + Cloudflare purge (theo quy trình chuẩn) |
| 5.5 | **Owner final UI sign-off** trên toàn bộ surface trong scope |

**Exit Gate 5:** AC-01→13 PASS toàn bộ + Owner sign-off → **CLOSE task**.

---

## 7. Rollback Safety

Toàn bộ thay đổi nằm trong **1 file mới** (`runtime/sidebar-scroll.js`) + **các điểm wiring 1 dòng gọi hàm** sau mỗi `ensureSections()` call site đã có. Rollback = gỡ dòng gọi `attachSidebarScroll(...)` + xoá file mới — không đổi CSS, không đổi `ensureSections()`, không đổi markup nào khác. Rủi ro rollback thấp.

---

## 8. Plan DoD

* [x] Wave 0→5 có Exit Gate rõ, theo đúng mô hình dual verification (Owner UI + Agent source) đã dùng ở Foundation
* [x] 3 Owner Decision (D1/D2/D3) đã khoá, phản ánh đúng vào Wave liên quan
* [x] Rollback plan tối thiểu, rõ ràng
* [x] **Owner duyệt D1/D2/D3 + toàn bộ Plan** — 2026-08-11

**Plan Status: APPROVED — bắt đầu Wave 0.**
