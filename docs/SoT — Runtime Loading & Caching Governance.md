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

## 5. Version hash tự động cho JS/CSS User Web (`sync-js-versions.mjs`) — bắt buộc dùng, không
   gõ tay `?v=` nữa (2026-10-09)

**Case study dẫn tới công cụ này**: 1 bug "Invalid token" khi Like/Dislike (nguyên nhân thật —
`iflux-platform-boot.js` có `dataMode` Staging sai, xem commit cùng ngày) mất cả buổi để fix dứt
điểm, không phải vì bug chính khó — vì **mỗi lần sửa 1 file, phải nhớ bump `?v=` tay ở TẤT CẢ nơi
tham chiếu file đó**, và chuỗi loader nhiều lớp (file lá → widget wrapper → page manifest →
`bootstrap.js` → `shell-boot.js`) khiến rất dễ sót 1 lớp — mỗi lần sót là 1 vòng
sửa-deploy-test-lại tốn ~10-15 phút. Sót xảy ra **nhiều lần liên tiếp trong cùng 1 buổi**, kể cả
sau khi đã "quét kỹ" bằng tay — chứng minh gõ tay version là KHÔNG BỀN, không phải lỗi cẩn thận.

**Giải pháp — tự động hoá hoàn toàn, theo đúng mô hình `build-web-bundle.mjs` đã dùng cho
`platform/web/generated/web.css`** (hash nội dung, không ai gõ tay): mọi `.js`/`.css` riêng của
User Web (`User_Web/iflux-web-ui/**`, KHÔNG gồm `platform/web/generated/web.css` — đã có cơ chế
hash riêng, và KHÔNG gồm `design_system/`/`Admin_Design_system/` — hệ version riêng chia sẻ với
Admin, ngoài phạm vi case study này) được tính `sha256(nội_dung).slice(0,10)` làm version, và
**mọi nơi tham chiếu được tool tự rewrite** — không còn version gõ tay nào trong phạm vi này.

### 5.1 Dùng thế nào

```bash
node ui_tooling/scripts/sync-js-versions.mjs          # rewrite tại chỗ — chạy sau khi sửa BẤT KỲ
                                                        # file .js/.css nào dưới User_Web/iflux-web-ui/
node ui_tooling/scripts/sync-js-versions.mjs --check   # chỉ kiểm tra, exit 1 nếu lệch — CI đã gắn
                                                        # vào deploy-staging.yml/deploy-production.yml
                                                        # (ngay sau bước kiểm tra gói CSS global)
```

**Quy tắc từ nay**: sau khi sửa nội dung bất kỳ file `.js`/`.css` nào dưới `User_Web/iflux-web-ui/`
(hoặc thêm 1 tham chiếu MỚI tới 1 file đã có — viết path có `?v=` hay không đều được, tool tự
chèn/sửa đúng hash), **luôn chạy `sync-js-versions.mjs` trước khi commit** — đừng tự gõ `?v=xxx`
tay nữa, CI sẽ chặn deploy nếu quên (`--check` fail). Không cần nhớ "file này có bao nhiêu nơi
tham chiếu" — tool tự tìm hết.

### 5.2 Cách viết tham chiếu để tool nhận ra được (4 dạng, khớp mọi pattern hiện có trong repo)

| Dạng | Ví dụ | Khi nào dùng |
|---|---|---|
| Path có tiền tố rõ (`/`, `./`, `../`) | `import('../pages/x.manifest.js?v=...')`, `lazyModule: '/User_Web/iflux-web-ui/widgets/x/index.js?v=...'` | ESM import, `lazyModule`, `loadScript('/User_Web/...')` — đa số trường hợp |
| Path có tiền tố + nối biến cũ | `import('../pages/x.manifest.js' + PF)` | Code CŨ còn kiểu `+ VER`/`+ PF` — tool tự gộp về `?v=<hash>` **và xoá luôn khai báo biến nếu không còn ai dùng** |
| Bare (không tiền tố) sau `ASSET +` / `A +` | `ASSET + 'runtime/x.js?v=...'` | Quy ước loader dùng chung (`var ASSET = '/User_Web/iflux-web-ui/';`) — **chỉ nhận đúng 2 tên biến `ASSET`/`A`**, KHÔNG nhận `BASE` (giá trị `BASE` không cố định giữa các file, tool không tự đoán) |
| Bare sau `file:` | `{ file: 'feature-suggestions-ui.js?v=...' }` | Object property kiểu `loadChainThen()` (`iflux-web-ui.js`) |

Viết tham chiếu theo **đúng 1 trong 4 dạng trên** (path tuyệt đối từ `/User_Web/...` luôn là lựa
chọn an toàn nhất, không phụ thuộc biến nào) — path bare đứng 1 mình (không `ASSET +`/`A +`/
`file:`) sẽ **không** được tool nhận diện, tự thêm 1 trong 2 biến quy ước đó thay vì bịa pattern
mới.

### 5.3 Vì sao KHÔNG đơn giản là "hash 1 lần, rewrite 1 lần" — fixed point

Một file vừa là **target** (được file khác tham chiếu, cần hash) vừa là **referrer** (tự nó tham
chiếu file khác, nội dung bị rewrite) — ví dụ `bootstrap.js` tham chiếu `shell-boot.js` (referrer),
và 25 trang HTML tham chiếu `bootstrap.js` (target). Rewrite nội dung `bootstrap.js` (vì
`shell-boot.js` đổi hash) làm **hash của chính `bootstrap.js` đổi theo** — nên phải tính hash lại,
rewrite lại, lặp tới khi 1 lượt không còn gì đổi (fixed point — thường hội tụ trong 2-9 lượt tuỳ
độ sâu chuỗi loader). Dependency trong repo là DAG (không có chu trình A→B→A thật), nên luôn hội
tụ; nếu 1 ngày nào đó không hội tụ sau `MAX_ITERATIONS` (20 lượt) — tool tự dừng + báo lỗi rõ,
**không treo vô hạn** — nghĩa là có chu trình tham chiếu thật mới xuất hiện, cần tách vòng lặp đó
ra (1 trong 2 file không nên tham chiếu phiên bản đã-hash của file kia nữa).

### 5.4 Bài học khi TỰ sửa tool này (không phải chỉ dùng) — 2 cái bẫy đã gặp, tránh lặp lại

1. **Regex path tuyệt đối** (`/User_Web/...`) dễ viết thiếu — `(?:\.\.?\/)*` (0 hoặc nhiều `./`
   hay `../`) KHÔNG khớp 1 dấu `/` đơn lẻ ở đầu; phải dùng `(?:\.{0,2}\/)+` (**bắt buộc ít nhất 1
   lần**, cho phép 0 dấu chấm + 1 gạch chéo = path tuyệt đối). Thiếu chữ này, tool "chạy được"
   nhưng IM LẶNG bỏ qua toàn bộ path tuyệt đối — nguy hiểm hơn lỗi crash vì không ai biết.
2. **Quét quá rộng "bất kỳ chuỗi trong dấu nháy kết thúc bằng .js/.css"** sẽ bắt nhầm chuỗi KHÔNG
   phải đường dẫn tải file — ví dụ `src.indexOf('iflux-web-ui.js')` (kiểm tra substring) hay
   `querySelector('script[src*="iflux-web-ui.js"]')` (CSS attribute selector) — tool hiểu nhầm
   thành tham chiếu, tự chèn `?v=<hash của chính file đó>` → file tự tham chiếu hash của mình →
   **dao động vô hạn, không bao giờ hội tụ** (phát hiện qua việc số file "còn đổi" mỗi lượt lặp
   tự ổn định ở 1 số dương thay vì giảm về 0 — dấu hiệu chắc chắn của chu trình, không phải bug
   vặt). Fix: path KHÔNG có tiền tố (`/`, `./`, `../`) chỉ được coi là tham chiếu hợp lệ khi đứng
   ngay sau 1 trong các ngữ cảnh đã biết chắc là loader (`ASSET +`, `A +`, `file:`) — không quét
   "bare path" đứng 1 mình, dù trông giống tên file thật.
