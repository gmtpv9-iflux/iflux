# Reviewer Response — Solution Scope Confirmation

**Nguồn:** phản hồi reviewer cho tài liệu `01 - Architecture Audit`.
**Mục đích:** đối chiếu khuyến nghị reviewer, chỉ ra phần đúng / phần cần chỉnh, đề xuất scope trọn vẹn.
**Trạng thái:** Thảo luận — **chưa** implement. Chờ Owner chốt.

---

## 1. Điểm reviewer ĐÚNG — đồng ý toàn bộ

| # | Nhận định reviewer | Đánh giá |
|---|---|---|
| 1 | Root cause là **ownership/lifecycle không nhất quán trong 1 Persistent Shell thật**, không phải "shell giả lập" | ✅ Đúng, và diễn giải này **sắc hơn** cách tôi viết trong audit 01. Header thật sự persistent (đã trace); vấn đề là 6/7 thành phần theo lifecycle JS, riêng logo theo lifecycle HTML hard-load. |
| 2 | "Authoritative runtime source ≠ architectural SoT" — 21 HTML đang có quyền lực **do implementation vô tình tạo ra**, không phải do kiến trúc **muốn** như vậy | ✅ Đúng. SoT **đúng nghĩa kiến trúc** phải là chuỗi `Admin → Global SEO → getPublicEffective() → logo_url → App Shell → <img>`, không phải "route nào load trước thì logo đó thắng". |
| 3 | `logo_url` nên khoá **GLOBAL-only** giống `faviconUrl` | ✅ Đúng, và đây đúng là gap tôi tìm thấy ở audit 01 (mục 7): resolver + API `PUT /pages/:pageKey` hiện vẫn kỹ thuật nhận `logoUrl` cấp trang, chỉ là chưa ai dùng UI để bật nó lên. Khoá cứng = biến "de facto single owner" thành "contract single owner" — đúng với business intent đã có trong Owner rule ("Logo được thiết lập bởi Thiết lập SEO hệ thống"). |
| 4 | **Không** trộn dọn orphan duplicate (`home/home/`, `stocks/stocks/`, …) vào task này | ✅ Đúng — đúng governance "Modify-First": chỉ sửa đúng chỗ hỏng, không mở rộng scope. Orphan cleanup cần audit riêng (khác rủi ro: xoá nhầm file đang được route trỏ vào). |
| 5 | **Không** mở rộng scope sang refactor `syncBrandHref()` / `renderNav()` set href trùng nhau | ✅ Đúng — đây là redundancy vô hại, không phải nguyên nhân regression, không cần đụng trong task này. |
| 6 | Task xoá-title hôm qua **không tạo ra** SVG legacy — chỉ re-ship migration dở dang qua `rsync` full-file; nhưng **local→rsync→Production** là process violation cần ghi action item riêng | ✅ Đúng, khớp 100% với bằng chứng ở audit 01 mục 4. |

---

## 2. Điểm cần CHỈNH lại — reviewer nói chưa đủ chính xác

### 2.1 "Rebind logo khi soft-nav" (Phần A) — **không tự nó sửa được bug đang xảy ra**

Reviewer trình bày Phần A (rebind logo mỗi soft-nav) như thể đây là **fix cho root cause của bug đang report**. Điều này **không chính xác về mặt kỹ thuật**, cần tách rõ 2 việc:

**Sự thật kỹ thuật (đã trace ở audit 01 mục 2):** khi soft-nav, `<header>` **không bị thay** — `teardownOutlet()` chỉ xoá `[data-ifx-page-runtime]` (nội dung MAIN), không đụng `<header>`. Vậy DOM logo (dù đúng `<img data-ifx-seo-logo>` hay sai `<div><svg>`) **giữ nguyên xuyên suốt session**, không phụ thuộc soft-nav có "rebind" hay không.

**Hệ quả:** nếu bật `bindLogo = true` khi soft (bỏ gate `!soft`), code vẫn chạy đúng dòng này mỗi lần nav:

```js
var logoEl =
  document.querySelector('.ifx-topnav-brand [data-ifx-seo-logo]') ||
  document.querySelector('.ifx-topnav-brand img.ix-brand-logo');
if (logoEl) { ... }
```

Nếu session bắt đầu (hard-load) ở 1 trong 8 trang legacy (`<div><svg>`, không có `img`, không có `data-ifx-seo-logo`) → `logoEl` **vẫn là `null`** ở MỌI lần soft-nav sau đó, **bất kể có rebind hay không**. → **Phần A một mình KHÔNG giải quyết được bug đang report.** Chỉ Phần B (migrate 8 file → canonical `<img>`) mới trực tiếp giải quyết bug này.

**Vậy Phần A dùng để làm gì?** Giá trị thật của Phần A là một vấn đề **KHÁC**, chưa được report nhưng có thật:

> Nếu Admin đổi `logo_url` trong "Thiết lập SEO hệ thống" **trong lúc user đang có 1 session SPA đang mở** (không hard-reload) — với `bindLogo=false` hiện tại, session đó sẽ **không bao giờ thấy logo mới** cho tới khi user tự F5. Với `bindLogo=true` mọi lúc, logo mới sẽ áp dụng ngay ở lần soft-nav kế tiếp (vì `/api/seo/effective` đã được fetch lại mỗi lần nav sẵn — không tốn thêm network call).

→ Đây là lý do **thật, độc lập, đáng làm** — nhưng nó là "logo phải fresh theo session dài", không phải "sửa bug logo sai trên 8 trang". Cần tách 2 lý do này ra để scope rõ ràng, tránh Owner hiểu nhầm là "chỉ cần đổi 1 dòng code A là hết bug" — **không đúng, bug chỉ hết khi có B**.

### 2.2 `bindLogo = !soft` là một quyết định đã **Owner lock trước đó** — không phải "1 dòng code tự do sửa"

Đọc lại đúng comment trong code hiện tại:

```js
/* Soft-nav: bindLogo=false — giữ DOM logo (Owner lock). */
```

Dòng này được đánh dấu **Owner lock** ngay trong code — nghĩa là **đã có một quyết định Owner từ trước** chọn "không rebind logo khi soft" (rất có thể để tránh flicker/re-render không cần thiết khi triển khai Soft Nav P1 hôm 10-11/08). Theo Engineering Change Governance (CG-030), **đảo lại một quyết định đã Owner-lock cần Owner xác nhận lại rõ ràng**, không thể coi là "sửa bug hiển nhiên" rồi tự đổi.

**Đây là điểm reviewer bỏ sót** — họ đề xuất "flip bindLogo" như một fix kỹ thuật thuần, nhưng về governance, cần Owner **tái xác nhận** việc mở lại quyết định này, kèm lý do mới (logo-freshness, không phải bug-fix).

May mắn là rủi ro kỹ thuật của việc mở lại rất thấp: giá trị `logo_url` là GLOBAL (không đổi theo trang), set lại đúng giá trị cũ vào `src` là no-op thị giác (không flicker, không tải lại ảnh vì URL không đổi). Nhưng "rủi ro thấp" không thay thế được việc cần Owner confirm lại lock.

---

## 3. Scope trọn vẹn tôi đề xuất

Giữ đúng 3 khối reviewer đề xuất, nhưng **tách rõ mức độ bắt buộc và thứ tự**, vì B là fix duy nhất giải quyết bug đang report, A+C là hardening kèm theo:

```text
110826 Persistent App Shell Header
│
├── P0 (BẮT BUỘC, giải quyết đúng bug đang report)
│    └── Migrate 8 entry point HTML: <div><svg>+<span>iFlux</span></div>
│         → <img class="ix-brand-logo" data-ifx-seo-logo alt="iFlux" hidden />
│         Áp dụng: stock, stocks, sector, sectors, ecosystems,
│         family, community/post, profile.html
│
├── P1 (Cần Owner tái xác nhận — đảo 1 quyết định đã Owner-lock)
│    └── Bỏ gate `bindLogo: !soft` → luôn resolve + bind logo mỗi nav
│         Lý do thật: logo tự làm mới khi Admin đổi logo_url giữa session dài
│         KHÔNG phải điều kiện để P0 hoạt động (P0 tự đủ)
│
├── P2 (Chính sách contract — cần Owner chốt YES/NO)
│    └── logoUrl = GLOBAL-only, giống faviconUrl:
│         - site-seo-resolver.js: normalizePage() bỏ pass-through logoUrl
│         - site-seo.routes.js PUT /pages/:pageKey: xoá patch.logoUrl
│           trước khi lưu (giống cách đang xoá patch.faviconUrl)
│
├── P3 Verification (bổ sung so với đề xuất reviewer)
│    ├── Hard-load riêng lẻ cả 8 trang cũ + 13 trang đã đúng → cùng 1 logo
│    ├── Soft-nav 2 chiều: co-phieu↔cong-dong (reviewer đã đề)
│    ├── Soft-nav xuất phát từ TỪNG entry cũ (8 trang) → các trang khác
│    │    (không chỉ mẫu 1 cặp — vì bug chỉ lộ khi session BẮT ĐẦU ở trang xấu)
│    ├── [Test riêng cho P1] Đổi logo_url trong Admin khi session đang mở
│    │    (không reload) → soft-nav kế tiếp phải thấy logo mới
│    ├── [Test riêng cho P1] Không có flicker/nhấp nháy logo khi soft-nav
│    │    liên tục (regression check — set lại cùng giá trị không gây tải lại ảnh)
│    └── [Test riêng cho P2] Gọi thẳng API PUT /site-seo/pages/:pageKey với
│         logoUrl → xác nhận bị strip / không ảnh hưởng effective logo
│
└── Riêng, KHÔNG gộp vào task này
     ├── Dọn orphan duplicate (home/home, stocks/stocks, stock/stock, flow/flow, community/community)
     └── Refactor gộp syncBrandHref()/renderNav() (redundancy vô hại)
```

---

## 4. Câu hỏi cần Owner chốt trước khi mở Implementation

1. **P0** (migrate 8 file) — mặc định làm, vì đây là fix trực tiếp cho bug đang report, rủi ro thấp, không đụng lock nào. Owner có đồng ý làm ngay không, hay cần xem trước danh sách 8 file cụ thể?
2. **P1** (bỏ gate `bindLogo:!soft`) — đây là mở lại 1 quyết định đã Owner-lock trước đó. Owner có xác nhận muốn đổi lock này (đổi lý do: logo phải fresh theo session dài) không, hay giữ nguyên lock cũ (chấp nhận logo chỉ cập nhật sau hard-reload)?
3. **P2** (khoá `logo_url` GLOBAL-only ở contract, chặn `PUT /pages/:pageKey` nhận `logoUrl`) — Owner chốt YES (khoá cứng như favicon) hay giữ nguyên (không khoá, chỉ dựa vào việc chưa có UI lộ field)?
4. Có gộp cả P0+P1+P2 vào **1 lần implement + verify**, hay tách P0 ra làm/verify/deploy riêng trước (fix bug ngay), rồi P1+P2 làm sau như một cải tiến kiến trúc riêng?

Tài liệu này **chưa implement gì** — chờ Owner trả lời 4 câu trên rồi mới mở Plan chi tiết theo Engineering Change Governance.
