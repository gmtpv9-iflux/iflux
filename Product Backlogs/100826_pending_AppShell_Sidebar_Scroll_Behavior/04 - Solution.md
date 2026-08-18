# 04 — Solution — AppShell Sidebar Scroll Behavior

| | |
| --- | --- |
| **Task ID** | `100826_AppShell_Sidebar_Scroll_Behavior` |
| **Status** | ⛔ **ABANDONED (Owner, 2026-08-11)** — Owner dừng task, không tiếp tục theo đuổi cơ chế viewport-following cho Sidebar (cả JS dual-rail v1 và CSS `position:sticky` v2). Toàn bộ code/CSS đã được revert về trạng thái trước khi task này mở (baseline: sau Foundation Wave 5 — widgets đã đồng bộ). Xem `05 - Plan` §0c cho chi tiết rollback. |
| **Input** | `01 - BRD` (LOCKED) · `02`+`02a`+`02b` Audit · `03 - SoT` (LOCKED) · `03a` SoT Amendment (PROPOSED) |
| **Authority** | Solution phải reconcile với SoT; nếu invariant không đáp ứng được → quay lại SoT governance, không tự đổi |
| **Next Phase** | **Không có** — task đóng lại ở trạng thái ABANDONED. Nếu Owner mở lại trong tương lai, phải đánh giá lại từ đầu (Audit/SoT có thể đã lỗi thời). |

---

## 0b. Owner Decision — Mechanism Override (2026-08-11, sau khi Wave 1/4.3 live)

**Bối cảnh:** Sau khi mechanism v1 (JS dual-rail `transform: translateY()`) được deploy lên Market + Community và Owner test trực tiếp trên `/cong-dong`, Owner đánh giá **trải nghiệm cuộn không mượt** dù đã tối ưu (gỡ forced-reflow, cache geometry — xem `sidebar-scroll.js` lịch sử git). Nguyên nhân gốc **không phải bug code** mà là **giới hạn vật lý của cơ chế**: JS-driven `transform` luôn có độ trễ tối thiểu 1 animation frame sau `scroll` event, trong khi `position: sticky` được compositor thread của trình duyệt xử lý — không qua JS, không có độ trễ.

**Quyết định Owner:** Đổi requirement nền để đơn giản hoá triệt để:

> **Không cần "Delayed Reverse" / "bottom-pin reveal" (Case C dual-rail) nữa — chỉ cần: khi Sidebar cách top viewport (dưới Header) 24px thì giữ nguyên ở đó trong lúc Main tiếp tục scroll; cuộn ngược lên thì tự nhả về vị trí tự nhiên.**

Đây là behavior **chuẩn của CSS `position: sticky`** — không cần đo geometry, không cần rAF loop, không cần JS trong scroll path.

**Vì sao sticky vẫn đáp ứng đúng semantic khoá ở BRD §5 (Delayed Reverse/INV-11/12) cho Case A/B:** `position:sticky` tự thân **là** một pure-function-của-scrollY y hệt dual-rail top-pin rail (§3 v1, xem lịch sử) — nó "dính" tại `top` offset khi natural position vượt qua ngưỡng đó, và "nhả" đúng tại **cùng ngưỡng đó theo chiều ngược lại** (browser tính bằng compositor, cùng công thức toán, không có state rời rạc) → tại `scrollY` bất kỳ luôn cho cùng kết quả, không drift, full-cycle return đúng — thoả INV-11/12 **bằng browser-native primitive**, không cần JS chứng minh lại.

**Đánh đổi được Owner chấp nhận:** Case C (Sidebar cao hơn viewport khả dụng — BRD §6) không còn dùng "bottom-pin reveal-by-page-scroll" nữa. Thay vào đó (bổ sung kỹ thuật, vẫn 0 JS, cùng khối CSS): `max-height: calc(100vh - header - 48px); overflow-y: auto;` trên cùng phần tử sticky — nếu nội dung cao hơn khung nhìn, Sidebar tự có **thanh cuộn nội bộ** để tiếp cận phần còn lại (đáp ứng đúng câu chữ BRD §6 "phải cho phép User tiếp cận các phần khác nhau của Sidebar... không được tạo clipping" — chỉ đổi cơ chế tiếp cận từ "cuộn trang" sang "cuộn trong Sidebar", không mất khả năng truy cập).

**Container-End Release (D2) bằng CSS, không cần đo Footer/Main runtime:** `.ifx-mkt-layout`/`.ifx-hub-grid`/`.ifx-flow-page-layout`/`.ifx-com-feed-layout` đều đã có sẵn `align-items: start` (không phải thêm mới). Trong CSS Grid, kích thước **grid area** (dùng làm containing-block cho phần tử sticky) luôn bằng track-height của row (= chiều cao Main, vì Main cao hơn) **bất kể `align-items`** — `align-items:start` chỉ chi phối vị trí box của item bên trong area đó, không thu nhỏ area. Kết quả: Sidebar sticky tự "hết chỗ để dính" và nhả về đúng lúc đáy Main kết thúc — **native tương đương Release Cap v1 §5**, không cần `endRefEl`/`containerEndTop` đo bằng JS. Áp dụng đúng D2 (mốc tạm = đáy Main vì Footer chrome "Reserved — not active", giữ nguyên rationale v1).

**Mobile (D3) không đổi bản chất — chỉ đổi cách tắt:** thay `matchMedia` JS bằng `@media (max-width: <breakpoint hiện có từng surface>) { position: static; }` trên cùng selector — Sidebar về đúng "nội dung bình thường" theo D3, 0 JS.

**Implementation Surface v2 — XOÁ, không giữ song song:**

* Xoá `runtime/sidebar-scroll.js` (module JS toàn bộ — không còn consumer).
* Xoá lệnh gọi `attachSidebarScroll(...)` tại `page-runtime.js` (Market) và `community-page.js`/`widgets/community-page/index.js` (Community-right) — 2 nơi duy nhất đã wiring JS.
* Thêm `position: sticky; top: calc(var(--ifx-topnav-h) + 24px); max-height: calc(100vh - var(--ifx-topnav-h) - 48px); overflow-y: auto;` trực tiếp vào **class CSS đã có sẵn** của từng Sidebar column (`.ifx-mkt-sidebar`, `.ifx-hub-sidebar`, `.ifx-flow-market-sidebar`, `.ifx-com-feed-sidebar`) — không tạo class/file CSS mới (đúng DS governance).
* Thêm reset `position: static; max-height: none; overflow-y: visible;` vào đúng `@media` breakpoint collapse-1-cột đã có của mỗi surface (768px Market/Home/Community, 1024px Flow) — không tạo breakpoint mới.
* Stock/Group Section: **không đổi** — `.ifx-stock-col--left` đã dùng `position: sticky` từ trước (tiền lệ đã đúng hướng này, chưa từng bị JS hoá), giữ nguyên.

**§1–§9 dưới đây (v1, dual-rail JS) giữ lại làm hồ sơ lịch sử quyết định — KHÔNG còn là mechanism đang chạy trên Production.** Xem `05 - Plan` §0b cho bảng ánh xạ Wave v1 → trạng thái thực tế sau override.

---

## 0. Owner Decisions — LOCKED 2026-08-11

| # | Quyết định | Owner |
| --- | --- | --- |
| **D1** | **Mở rộng scope** theo [`03a - SoT Amendment`](03a%20-%20SoT%20Amendment%20—%20Post-Foundation%20Scope%20Reconciliation.md) — 6 surface (Market, Nhà, Flow, ELP, Community-right, Stock/Group Section) | "có, mở rộng" |
| **D2** | **Footer = điểm cuối cùng chung** cho cả Main và Sidebar — Sidebar không được translate quá điểm mà rendered-bottom của nó vượt qua Footer's natural top | "Footer nên xem là điểm cuối cùng mà cả main lẫn sidebar có thể đi đến" |
| **D3** | **Mobile/responsive:** Sidebar trở về **nội dung bình thường** (tắt hoàn toàn viewport-following, không transform, document-flow thuần) | "trên mobile, sidebar sẽ trở thành nội dung bình thường" |

Chi tiết implementation của D2 → §5 (lịch sử v1, xem §0b cho cách CSS-native đạt cùng effect). D3 → §9 (lịch sử v1, xem §0b).

**(§1 trở xuống là Solution v1 — LỊCH SỬ, đã bị override bởi §0b)**

---

## 1. Executive Summary

**Mechanism đề xuất:** JS-driven, **`transform: translateY()`-based "dual-rail clamp"**, KHÔNG dùng `position: sticky`, KHÔNG dùng `position: fixed`.

**Vì sao không phải CSS `position:sticky` thuần:** `sticky` cho behavior symmetric/instant khi đảo hướng scroll — không thể tạo "Delayed Reverse" (SOt-10: Sidebar phải **giữ nguyên** viewport-following trong đoạn đầu reverse, không resume document-flow ngay). CSS-only không có khái niệm "Reverse Synchronization Boundary" tách biệt hướng lên/xuống.

**Vì sao không phải `position: fixed`:** `fixed` lấy element ra khỏi luồng layout (grid 2-cột), phá `align-items:start`, cần placeholder/spacer để Main không nhảy layout — thêm phức tạp, tăng regression risk (NFR-05), vi phạm SOt-19 (ưu tiên giải pháp đơn giản nhất trước).

**Vì sao `transform`:** `transform` không tham gia layout — `offsetTop`/`offsetParent` chain của Sidebar **không bị ảnh hưởng bởi transform của chính nó**. Điều này cho phép tính "vị trí document tự nhiên" (`naturalTop`) **mỗi frame, chính xác 100%, không tích lũy sai số** — đáp ứng INV-11/INV-12 **bằng cấu trúc toán học, không phải bằng bookkeeping state** (rủi ro bug thấp hơn nhiều so với state machine boolean `isFollowing`).

**Điểm mấu chốt:** hàm tính `translateY` là **hàm thuần túy (pure function) của `scrollY` hiện tại** — không phụ thuộc lịch sử/hướng scroll trước đó. Vì vậy scroll xuống rồi lên lại **luôn đi qua đúng các giá trị cũ theo đúng thứ tự ngược** — không jump, không drift, tự động "delayed reverse" mà không cần cờ trạng thái riêng.

---

## 2. Geometry Model

Đo tại runtime (không hardcode), theo đúng SOt-11/BR-AUD.C:

| Biến | Định nghĩa | Cách đo | Đo lại khi nào |
| --- | --- | --- | --- |
| `naturalTop(el)` | Vị trí document-relative TOP của Sidebar, **không tính transform hiện tại** | `Σ el.offsetTop` leo `offsetParent` chain (transform-independent by spec) | Mỗi scroll frame (rẻ, không gây reflow nếu đọc đúng cách — xem §7 performance) |
| `sidebarHeight` | `el.offsetHeight` | Đọc trực tiếp | Mỗi frame hoặc on `ResizeObserver` (đủ, vì `offsetHeight` rẻ) |
| `viewportH` | `window.innerHeight` | Đọc trực tiếp | Mỗi frame + `resize` event |
| `headerH` | Header rendered height | `document.querySelector('.ifx-topnav').getBoundingClientRect().height` | On mount + `resize` |
| `topBound` | Ngưỡng TOP tối thiểu (viewport-relative) mà Sidebar được phép "dừng" khi đang follow | = `naturalTop(el)` đo tại **scrollY=0 lúc mount** (= vị trí nghỉ tự nhiên ngay dưới header, đã có sẵn từ CSS layout hiện tại — KHÔNG cần công thức mới, chỉ đọc lại giá trị CSS đang có) | On mount + `resize` + khi Main phía trên Sidebar đổi chiều cao (hiếm — theo dõi qua `ResizeObserver` trên `.ifx-app` hoặc header) |
| `bottomBound` | Ngưỡng BOTTOM tối đa (viewport-relative) — **chính là 24px trigger của BRD** | `viewportH - 24` | Mỗi frame (rẻ) + `resize` |

**Không cần đo `headerH` riêng nếu `topBound` đo trực tiếp từ Sidebar's resting position** — đơn giản hơn, ít giả định hơn (đúng SOt-19: ưu tiên giá trị đo thật, không suy ra từ hằng số khác).

---

## 3. Algorithm — Dual-Rail Clamp

Mỗi scroll frame (rAF-throttled), với Sidebar **đang ở `position: static/relative` bình thường** (không đổi CSS position hiện có):

```text
naturalTop    = naturalTop(sidebarEl)  [tính live, transform-independent]
naturalBottom = naturalTop + sidebarHeight

// "top-pin": giữ TOP tại topBound (dùng khi Sidebar vừa/ngắn hơn kênh [topBound, bottomBound])
topPinTranslate    = topBound - (naturalTop - scrollY)

// "bottom-pin": giữ BOTTOM tại bottomBound (dùng khi Sidebar cao hơn kênh — Case C,
// cho phép "cuộn nội bộ" lộ dần các phần khác nhau của Sidebar — đúng BR-05.2)
bottomPinTranslate = bottomBound - (naturalBottom - scrollY)

// translateY cuối = giá trị nào giữ Sidebar gần nhất với vị trí tự nhiên (0)
// nhưng KHÔNG để top vượt lên trên topBound, KHÔNG để bottom vượt xuống dưới bottomBound
translateY = clamp(
  0,                                    // không bao giờ đẩy xa hơn cần thiết
  min(topPinTranslate, bottomPinTranslate),
  max(topPinTranslate, bottomPinTranslate)
)

apply: sidebarEl.style.transform = 'translateY(' + translateY + 'px)'
```

**Vì sao formula này tự động đúng cho cả 3 Case (A/B/C) mà không cần rẽ nhánh code riêng:**

* **Case A/B (Sidebar ≤ kênh khả dụng):** `topPinTranslate` và `bottomPinTranslate` hội tụ về cùng hướng — kết quả tương đương "dính top" (giống sticky-top cổ điển) khi cuộn xuống, và tự nhả về `0` khi cuộn lên đủ cao (Reverse Sync Boundary tự nhiên = điểm mà `naturalTop` viewport-relative ≥ `topBound`).
* **Case C (Sidebar > kênh khả dụng):** ban đầu bottom-pin thắng (giữ đáy tại `bottomBound`, để lộ dần phần dưới Sidebar khi cuộn — đúng §6 Case C yêu cầu "không được clip/jump, cho tiếp cận các phần khác nhau"), sau đó khi `naturalTop` "đuổi kịp" `topBound`, top-pin thắng (chuyển mượt, không nhánh rẽ code riêng — chỉ là `clamp` đổi biên đang active).

**Vì sao đây là "Delayed Reverse" đúng nghĩa SOt-10 mà không cần state riêng:** khi user đảo hướng (scroll up), `naturalTop`/`naturalBottom` thay đổi liên tục theo `scrollY`, nhưng `translateY` **vẫn tiếp tục bị clamp bởi đúng rail đang active** cho đến khi hình học tự nhiên không còn cần clamp nữa — đây **chính là** Reverse Synchronization Boundary (SOt-11), được suy ra từ geometry, **không hardcode**.

**Vì sao không drift (INV-11/12):** `translateY` là hàm của `(naturalTop, naturalBottom, topBound, bottomBound)` tại **scrollY hiện tại** — không có biến trạng thái tích lũy qua thời gian. Cùng một `scrollY` luôn cho cùng một `translateY`, bất kể lịch sử scroll trước đó. Về đầu trang (`scrollY=0`) → `translateY=0` **luôn đúng, mọi lúc** — không thể drift.

---

## 4. Height Matrix (BR-AUD.F / SOt-14) — cùng 1 formula

| Case | `sidebarHeight` vs kênh `[topBound, bottomBound]` | Behavior tạo ra |
| --- | --- | --- |
| A — Ngắn hơn | `sidebarHeight < bottomBound - topBound` | Top-pin sớm, dính dưới header, giống sticky-top cổ điển |
| B — Gần bằng | `sidebarHeight ≈ bottomBound - topBound` | Chuyển tiếp top-pin/bottom-pin gần như đồng thời — không jump vì cả 2 rail gần bằng nhau |
| C — Cao hơn | `sidebarHeight > bottomBound - topBound` | Bottom-pin trước (lộ dần phần dưới), rồi top-pin sau khi đã cuộn hết — không cần biết trước Case nào, code không rẽ nhánh |

---

## 5. Container-End Release (D2 — LOCKED: Footer là điểm cuối cùng chung)

**Quyết định Owner:** Footer là điểm cuối cùng mà **cả Main lẫn Sidebar** có thể đi đến — nghĩa là 2 column (Sidebar + Main) dùng **chung 1 mốc kết thúc**, không phải Sidebar tự "nhả" theo chiều cao riêng của Main.

**Interim reference (Owner xác nhận 2026-08-11):** Foundation SoT (`03 - SoT.md` dòng 217) ghi rõ Footer hiện là **"Reserved — not active"** — chưa có `<footer>` DOM nào được render trên User Web. Vì vậy mốc cuối dùng ngay bây giờ = **đáy Main content** (`mainEl` — sibling của Sidebar trong layout row), không phải `<footer>` thật.

```text
containerEndTop = naturalTop(endRefEl)   [endRefEl = Main content column hiện tại; đổi sang <footer> khi Footer chrome được xây, không đổi công thức]
```

`endRefEl` phải trỏ đúng Main column sibling của từng surface (`.ifx-mkt-main` / `.ifx-flow-main-col` / `.ifx-com-feed-main` / `.ifx-mkt-main` (ELP) / `.ifx-stock-col--center`+`.ifx-stock-col--right` bao ngoài) — **không phải `<footer>`** cho đến khi Footer chrome tồn tại. Khi Footer được xây (task riêng, ngoài scope này), chỉ cần đổi `endRefEl` sang `<footer>`, không đổi thuật toán §5.

**Rail thứ 3 — Release Cap:**

```text
// Rendered document-bottom của Sidebar (quy đổi translateY viewport-px sang document-coord):
renderedDocBottom = naturalDocBottom + translateY

// Không cho phép renderedDocBottom vượt qua containerEndTop:
releaseCap = containerEndTop - naturalDocBottom

translateY_final = clamp(0, min(dualRailTranslate, releaseCap), max(dualRailTranslate, releaseCap))
```

Trong đó `dualRailTranslate` = kết quả `translateY` từ dual-rail clamp ở §3 (chưa áp Footer cap).

**Ý nghĩa vật lý:** khi user cuộn đến gần cuối Main content, `releaseCap` giảm dần về 0 — ép `translateY_final` giảm theo, khiến Sidebar "buông" dần và về đúng vị trí tự nhiên đúng lúc đáy Main chạm đáy Sidebar — không có bước nhảy rời rạc (vẫn là 1 hàm liên tục của `scrollY`, giữ đúng tính chất "no-jump" ở §3).

**Vì Main không cần xử lý riêng:** Main vẫn document-flow thuần (SOt-15, không đổi) — Main tự nhiên "đi đến" Footer đúng bằng cách cuộn hết, không cần JS. Chỉ Sidebar cần rail bổ sung vì nó là thành phần duy nhất bị dịch khỏi vị trí tự nhiên bằng `transform`.

**Bổ sung Test Matrix (Plan Wave 3):** cuộn hết trang (qua cả Footer) trên surface có Main dài hơn Sidebar nhiều (Flow/Community — đã đo Case C) — xác nhận Sidebar dừng đúng trước Footer, không đè, không giật.

---

## 6. Trả lời SoT §26 — Solution Decision Gate (12 câu)

| # | Câu hỏi | Trả lời |
| --- | --- | --- |
| 1 | Kích hoạt viewport-following tại 24px? | `bottomPinTranslate` rail kích hoạt đúng lúc `naturalBottom` (viewport-relative) chạm `bottomBound = viewportH-24` — xem §3 |
| 2 | Preserve original document position? | `translateY` là pure function của `scrollY` hiện tại, không tích lũy — tại `scrollY` gốc luôn cho cùng kết quả (§3, §7.3) |
| 3 | Reverse Sync Boundary xác định thế nào? | = điểm hình học mà `clamp()` không còn active (natural position tự nằm trong kênh) — suy ra từ `topBound`/`bottomBound`/`naturalTop`/`naturalBottom`, không magic number (§3) |
| 4 | Xử lý height dynamic? | Đọc `offsetHeight` mỗi frame (rẻ) — không cache cứng, tự thích ứng nếu content đổi |
| 5 | Sidebar > viewport? | Bottom-pin rail xử lý — lộ dần nội dung khi cuộn (§4 Case C) |
| 6 | Main Content tiếp tục scroll? | Có — Main **không đổi position**, chỉ Sidebar dùng `transform`; Main vẫn document-flow bình thường (SOt-15) |
| 7 | Ngăn positional jump? | `clamp()` liên tục theo `scrollY` — không có bước nhảy rời rạc giữa 2 state (§3) |
| 8 | Không drift qua full cycle? | Pure function property — §3 cuối |
| 9 | Dùng chung cho nhiều AppShell Sidebar consumer? | 1 module áp lên contract `[data-ifx-section="sidebar"]`/`[data-ifx-section="sidebar-right"]` — generic, không biết renderer gốc của page (§8) |
| 10 | Cần page compatibility changes? | Không cần đổi page code — chỉ cần Section host tồn tại đúng contract (đã có sau Foundation) |
| 11 | Reuse infra nào? | Reuse contract `ensureSections()` (Foundation) làm điểm neo duy nhất — không tạo API/attribute mới (§8) |
| 12 | Regression risk với Header/AppShell layout? | Thấp — `transform` trên Sidebar không ảnh hưởng Header (fixed, ngoài) hoặc Main (sibling grid column không đổi) — xem §9 |

---

## 7. Trả lời BRD §20 — Required Solution Deliverables (15 câu, phần chưa trả lời ở §26)

| # | Câu hỏi | Trả lời |
| --- | --- | --- |
| 1 | Sidebar hiện render ở đâu? | `runtime/app-shell.js` `ensureSections()` — canonical cho toàn bộ scope (`02b`) |
| 2–3 | Bao nhiêu Left/Right? | Theo scope đề xuất `03a`: 5 Left + 1 Right (Community) — hoặc 2 Left nếu Owner giữ scope hẹp |
| 4 | Cùng renderer/owner? | Có, sau Foundation (`02b` §6 Q4) |
| 5 | Scroll container? | `window`/`html`/`body` — không đổi (Audit `02` §3, không có nested scroller cần xử lý) |
| 6 | Geometry? | §2 bảng trên |
| 7 | Cơ chế phù hợp? | `transform` dual-rail clamp — §1, §3 |
| 8 | Reverse Sync Boundary? | §3 cuối, §6 Q3 |
| 9 | Sidebar > viewport? | §4 Case C |
| 10 | INV-11/12? | §3 cuối — bằng cấu trúc pure-function, không bookkeeping |
| 11 | Đổi shared layout wrapper? | **Không** — không đổi `ensureSections()`, không đổi CSS grid hiện có, chỉ thêm 1 module hành vi gắn ngoài (§8) |
| 12 | Cần page remediation? | Không (câu 10 §26) |
| 13 | Reuse infra nào? | Contract `[data-ifx-section]` (§8) |
| 14 | Regression risk? | §9 |
| 15 | Test matrix cuối? | §10 |

---

## 8. Implementation Surface — module mới, KHÔNG đổi code cũ

**1 file mới duy nhất theo kiến trúc:** `User_Web/iflux-web-ui/runtime/sidebar-scroll.js` (ESM), export 1 hàm `attachSidebarScroll(sectionMap)` hoặc tương tự — nhận map các Section element (`sidebar`, `sidebar-right`) do `ensureSections()` trả về, tự quản lý scroll/resize listener + rAF loop cho các element đó, gắn/gỡ khi page mount/unmount (theo lifecycle `page-runtime.js`/widget `mount()`/`unmount()` đã có).

**Điểm neo wiring duy nhất:** ngay sau mỗi lần `ensureSections()` được gọi (đã có 6 call site sau Foundation — Market/Nhà qua `page-runtime.js`, Flow/ELP/Stock/Group qua widget wrapper riêng, Community qua bridge) — gọi thêm `attachSidebarScroll(sections)`. **Không sửa logic bên trong `ensureSections()` chính nó** (giữ nguyên contract, chỉ observe kết quả).

**Vì sao không sửa `ensureSections()` trực tiếp:** giữ nguyên separation — `ensureSections()` là "tạo cấu trúc DOM" (Foundation ownership), Scroll Behavior là "hành vi runtime" (task này ownership) — 2 concern khác nhau, đúng nguyên tắc Engine Boundary (Component/Layout Engine/Behavior riêng biệt theo Product Architecture V2).

**Không đổi:** CSS grid layout hiện có (`ifx-mkt-layout`, `ifx-hub-grid`, `.ifx-flow-page-layout`, v.v.) — Sidebar vẫn `position: static` trong CSS, `transform` chỉ là runtime overlay không đổi khai báo CSS.

---

## 9. Regression Analysis (NFR-05)

| Nguy cơ | Đánh giá | Biện pháp |
| --- | --- | --- |
| Header bị ảnh hưởng | **Không** — Header fixed, ngoài phạm vi `transform` áp lên Sidebar | N/A |
| Main layout bị đẩy/nhảy | **Không** — `transform` không tham gia layout, grid column width/height Main không đổi | Verify bằng đo `Main.getBoundingClientRect()` không đổi qua toàn chu kỳ scroll |
| Soft-navigation teardown | Section bị remount mỗi lần chuyển trang (`02b` F-05/F-11: `teardownOutlet()` xoá `[data-ifx-page-runtime]`) → listener cũ phải được gỡ đúng, không leak | `attachSidebarScroll` trả về `detach()`, gọi trong mọi `unmount()` hiện có (đã có lifecycle hook sẵn — không tạo lifecycle mới) |
| Responsive/mobile (D3 — LOCKED) | **Sidebar trở về nội dung bình thường trên mobile** — tắt hoàn toàn viewport-following | Guard bằng `window.matchMedia` đúng breakpoint hiện có của **từng surface** (Audit `02`/`02b`: Market/Community/ELP ≤768px, Flow ≤1024px — không dùng 1 breakpoint chung cho tất cả). Khi match: `attachSidebarScroll` **không attach listener**, hoặc nếu đã attach thì set `translateY=0` cố định và bỏ qua mọi tính toán — Sidebar render như collapse 1-col hiện có (không đổi CSS collapse đã có, chỉ đảm bảo JS không áp `transform` đè lên) |
| Performance (NFR-02) | `offsetTop`-chain mỗi frame có thể tốn nếu DOM sâu | rAF-throttle (tối đa 1 lần/frame), `passive: true` trên scroll listener, dùng `will-change: transform` chỉ khi đang active để tránh layer cost thường trực |

---

## 10. Test Matrix (phải cover §16.H BRD + AC-01→13)

Kế thừa toàn bộ bảng §16.H (`01 - BRD`) — không rút gọn. Bổ sung theo scope mở rộng (nếu Owner duyệt `03a`): lặp lại matrix cho **mỗi surface trong scope** (Market, Nhà, Flow, ELP×1 đại diện, Community-right, Stock Detail Section) × Case A/B/C tương ứng với chiều cao thực tế đo được. Chi tiết ở `05 - Plan` §Verification.

---

## 11. Solution DoD (v1 — lịch sử, xem §0b cho DoD hiện hành)

* [x] Mechanism chọn + lý do loại bỏ sticky/fixed thuần
* [x] Geometry model không magic number (SOt-11)
* [x] Algorithm chứng minh no-jump/no-drift bằng cấu trúc (không chỉ bằng test)
* [x] Height Matrix 1 formula, không rẽ nhánh code theo Case
* [x] Trả lời đủ SoT §26 (12) + BRD §20 (15)
* [x] Reuse-first xác nhận (SOt-19) — 1 module mới, không sửa `ensureSections()`
* [x] Regression risk liệt kê + biện pháp
* [x] **D1/D2/D3 Owner LOCKED** (§0) — 2026-08-11

**Solution v1 Status: SUPERSEDED 2026-08-11 — xem §0b (Mechanism Override).**

## 12. Solution DoD v2 (hiện hành)

* [x] Owner xác nhận trải nghiệm JS dual-rail không đạt (test trực tiếp `/cong-dong`)
* [x] Root cause: giới hạn vật lý JS-driven transform (1-frame latency), không phải bug
* [x] Requirement đơn giản hoá: bỏ Delayed Reverse/Case C reveal-by-scroll, còn lại = sticky-top chuẩn
* [x] Case C thay bằng `max-height` + `overflow-y:auto` nội bộ (0 JS, không mất khả năng tiếp cận — vẫn đúng câu chữ BRD §6)
* [x] Container-End Release (D2) đạt bằng CSS Grid containing-block (`align-items:start` đã có sẵn), không cần đo runtime
* [x] Mobile (D3) đạt bằng `@media` reset tại breakpoint đã có của mỗi surface
* [x] Không tạo class/file CSS mới — chỉ sửa rule đã có (DS governance)
* [x] Xoá `sidebar-scroll.js` + toàn bộ điểm wiring JS (Market, Community) — không giữ song song
* [x] Stock/Group Section không đổi (đã đúng hướng CSS sticky từ trước)

**Solution v2 Status: APPROVED & IMPLEMENTED — 2026-08-11.**
