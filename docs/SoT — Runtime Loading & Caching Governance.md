# SoT — Runtime Loading & Caching Governance (2026-10-03)

**Nguồn:** Owner yêu cầu sau khi phát hiện bug "bấm nav đang active → reload toàn trang" (Network
panel cho thấy `bootstrap.js`/`shell-boot.js`/`page-keys.js`/`legacy-bridge.js`/
`iflux-platform-boot.js` bị tải lại dù đã có sẵn). Tài liệu này ghi lại **kiến trúc ĐÚNG đã có sẵn**
(không phải thiết kế mới) + case study bug vừa fix, để các phiên sau coi bất kỳ sai lệch nào khỏi
đây là BUG cần sửa ngay, không phải "chuyện bình thường".

## 1. Mô hình tải đúng (đã xác nhận hoạt động qua test thật)

```
Lần đầu vào site (vd /tin-tuc):      ~70 request — toàn bộ runtime lõi + CSS/JS/API trang đó.
Soft-nav sang trang MỚI (Thị trường): ~6 request  — CHỈ JS/CSS/API riêng của Thị trường.
                                       0 request cho bootstrap/shell-boot/platform-boot/page-keys.
Soft-nav QUAY LẠI trang đã ghé:        3 request  — TOÀN BỘ là API data, KHÔNG 1 JS/CSS nào tải lại.
```

Đây CHÍNH LÀ mô hình owner mô tả ("trang 1 tải A-E, trang 2 trùng C-D-E chỉ tải F-G, trang 3 trùng
hết thì chỉ còn tải API") — **đã được dựng đúng từ trước**, nhờ 2 cơ chế có sẵn, không cần thêm gì:

- **ES Module cache (trình duyệt)**: `import('<url>')`/`<script type="module" src="<url>">` với
  CÙNG URL (cùng query `?v=`) chỉ được trình duyệt fetch + execute **một lần cho cả phiên tab**,
  các lần sau trả thẳng module instance đã có trong bộ nhớ — không qua lại network. Đây là lý do
  core runtime (`bootstrap.js`, `shell-boot.js`, `page-keys.js`, `iflux-platform-boot.js`,
  `legacy-bridge.js`...) chỉ tải đúng 1 lần/tab bất kể soft-nav bao nhiêu trang.
- **Soft-navigation (`runtime/soft-navigation.js`)**: chặn click `<a href>` nội bộ, gọi
  `history.pushState` + re-run `start({soft:true})` thay vì để trình duyệt tải lại HTML document
  thật — nhờ vậy `<script type="module">` trong `<head>`/`<body>` KHÔNG re-execute, giữ nguyên
  module cache ở trên.
- **HTTP cache `?v=<version>`**: mọi file JS/CSS/manifest đều có query version cố định theo nội
  dung (`cache-control: public, max-age=14400` — 4 tiếng ở Cloudflare + trình duyệt). Lần RELOAD
  THẬT (F5, mở tab mới) vẫn re-execute module nhưng BYTE không tải lại qua mạng nếu cache còn hạn
  — module parse lại (CPU, rất nhanh) nhưng không tốn băng thông/round-trip mạng.

## 2. Case study bug — "bấm nav đang active gây reload thật" (tìm + fix 2026-10-03)

**Triệu chứng**: Network panel cho thấy core runtime file bị tải lại (status 200, thời gian thật,
không phải cache hit) khi bấm vào 1 trang **đang đứng sẵn** (vd đang ở Cộng đồng, bấm lại
"Cộng đồng"; đang ở Tin tức, bấm lại "Tin tức").

**Nguyên nhân** (`runtime/soft-navigation.js`): `canSoftNavigate(href)` cố tình trả `false` khi href
trùng URL hiện tại (đúng ý định — tránh remount vô ích). Nhưng `onDocumentClick()` dùng CHUNG kết
quả đó để quyết định `e.preventDefault()`:
```js
if (!canSoftNavigate(href)) return;   // false → return SỚM, KHÔNG preventDefault()
e.preventDefault();
softNavigate(href, { replace: false });
```
Khi `canSoftNavigate` trả `false` vì "cùng trang", code **rơi thẳng ra ngoài mà không
`preventDefault()`** — trình duyệt coi click vào `<a href>` là điều hướng thật (dù href trùng URL
hiện tại, HẦU HẾT trình duyệt vẫn tải lại full document) → toàn bộ `<script type="module">` bị
re-fetch + re-execute từ đầu, kể cả đã có trong module cache (vì document mới = execution context
mới, module cache theo DOCUMENT, không theo origin).

**Fix**: tách riêng `isSamePage(href)`; `onDocumentClick()` giờ `e.preventDefault()` NGAY và
**không làm gì thêm** khi phát hiện link trỏ đúng trang đang xem — thay vì rơi qua nhánh để trình
duyệt tự xử lý.

**Bài học cho các phiên sau** — nếu thấy lại đúng pattern này (1 hàm quyết định "có nên làm X" bị
dùng luôn làm điều kiện "có nên preventDefault" ở chỗ khác), coi đó là bug: **"không nên làm X" và
"nên để trình duyệt tự xử lý (preventDefault=false)" là 2 quyết định ĐỘC LẬP**, không được gộp làm
một — "không nên soft-nav" có thể vẫn cần `preventDefault()` + tự xử lý im lặng (no-op), KHÔNG mặc
định rơi về hard-nav.

## 3. Về đề xuất dùng LocalStorage cache cho static JS/CSS (owner hỏi, KHÔNG áp dụng)

Owner nhắc lại ý tưởng từ Agent cũ: lưu JS/CSS/HTML tĩnh vào LocalStorage, chỉ tải API data sau khi
đã có cache. **Đánh giá: KHÔNG áp dụng — mô hình hiện tại (ES module cache + HTTP cache 4h) đã đạt
đúng mục tiêu đó, và LocalStorage cho mục đích này là lựa chọn KÉM HƠN**, vì:

- LocalStorage giới hạn ~5–10MB/origin (tuỳ trình duyệt) — bundle CSS/JS hiện ~364KB (web.css) +
  hàng chục file JS trang/widget sẽ sớm chạm trần, phải tự viết logic LRU/eviction (phức tạp, dễ
  lỗi) mà HTTP cache của trình duyệt đã làm sẵn, tốt hơn, miễn phí.
- LocalStorage là **đồng bộ (synchronous)** — đọc/ghi chặn main thread; đọc hàng trăm KB JS từ đó
  mỗi lần dùng sẽ CHẬM HƠN đọc từ HTTP cache (bất đồng bộ, tối ưu ở tầng OS/disk).
- Phải tự `eval()`/tạo `<script>` từ string lưu trong LocalStorage để "chạy lại" code — mất hết lợi
  ích của `<script type="module">` cache gốc (dedupe theo URL, dependency graph, source map...).
- HTTP cache + Cloudflare edge **đã cho đúng hiệu quả mong muốn** (xem §1 — lần quay lại trang chỉ
  còn gọi API) mà không cần thêm tầng cache thủ công nào — thêm LocalStorage vào đây là cache 2 tầng
  cho CÙNG 1 dữ liệu, tăng rủi ro (asset mới deploy nhưng LocalStorage cũ chưa bị invalidate đúng
  lúc), tăng code phải bảo trì, không tăng tốc độ thực tế.

**Khi nào LocalStorage mới hợp lý**: lưu DỮ LIỆU ĐỘNG nhỏ, per-user, không cần tải lại mỗi phiên
(nháp form chưa gửi, trạng thái UI đã mở/đóng, theo đúng pattern đã dùng ở `dashboard-engine.js`
cho layout widget cá nhân) — KHÔNG phải để cache JS/CSS/HTML tĩnh, việc đó đã có HTTP cache lo.

## 4. Checklist cho phiên sau — nghi ngờ gì thì coi là bug

- Thấy core runtime (`bootstrap.js`/`shell-boot.js`/`page-keys.js`/`iflux-platform-boot.js`/
  `legacy-bridge.js`) bị request lại khi soft-nav sang trang KHÁC (không phải lần đầu) → BUG, báo
  ngay — không phải "bình thường".
- Thấy JS/CSS của 1 trang ĐÃ GHÉ bị tải lại khi quay lại trang đó trong CÙNG phiên tab (không phải
  version tag mới) → BUG.
- Thấy `navCount`/network request tăng khi bấm vào chính trang đang đứng → BUG (đúng pattern §2).
- RELOAD THẬT (F5, mở tab mới, gõ URL) vẫn hiện core runtime trong Network panel — **đây là BÌNH
  THƯỜNG** (module cache theo document, F5 luôn tạo document mới) — chỉ bất thường nếu KHÔNG phải
  cache-hit (status không phải from-cache/304 dù còn hạn `?v=`).
