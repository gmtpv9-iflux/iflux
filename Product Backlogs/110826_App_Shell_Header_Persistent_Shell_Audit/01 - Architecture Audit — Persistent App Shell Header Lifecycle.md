# Architecture Audit — Persistent App Shell & Header Lifecycle

**Loại:** Audit only — KHÔNG sửa code trong round này.
**Phạm vi:** App Shell / Header ownership, Soft Navigation (Persistent Shell) lifecycle, 21 HTML copies, logo_url single-owner.
**Ngày:** 2026-08-11

---

## 0. Kết luận nhanh (trả lời câu hỏi lớn của Owner)

> **App Shell hiện tại có một Source of Truth duy nhất, hay chỉ đang giả lập persistent shell bằng cách giữ lại DOM của từng HTML page?**

**Trả lời: CẢ HAI, tùy thành phần — và đây chính là root cause.**

Header **không phải một khối duy nhất**. Nó là **7 thành phần độc lập**, mỗi thành phần có cơ chế đồng bộ khác nhau:

| Thành phần | Có SoT JS thật (re-render mọi lần nav)? |
|---|---|
| Nav menu | ✅ Có — `IfluxAppShellHeader.renderNav()` đọc `IfluxAppShell.getPrimaryNav()` |
| CTA / user actions | ✅ Có — `renderGuestActions()` mỗi lần `bootstrapPage()` |
| User/account menu, dropdown | ✅ Có — `patchUserMenu()` mỗi lần `syncTopnav()` |
| Mobile controls (tabbar) | ✅ Có — `syncMobileTabbar()` mỗi lần nav |
| Brand **href** | ✅ Có — `syncBrandHref()` / `renderNav()` set lại href mỗi lần |
| Search | ⚠️ Lazy-init 1 lần, sau đó là UI tĩnh (không phụ thuộc trang) |
| **Brand LOGO (ảnh)** | ❌ **KHÔNG** — chỉ set 1 lần lúc hard-load đầu tiên (`bindLogo = !soft`), never lại trong suốt session |

→ 6/7 thành phần đúng nghĩa "App Shell chuẩn hóa" (JS là chủ, HTML tĩnh chỉ là khung chờ). **Riêng logo là ngoại lệ bị "khoá cứng" vào DOM ban đầu** — đây là chỗ duy nhất mà "persistent shell" suy biến thành "giữ DOM tĩnh của trang vào đầu tiên" thay vì "một SoT chạy lại mỗi lần".

Vì vậy: **21 bản HTML KHÔNG còn là fallback/bootstrap vô hại — chúng là authoritative runtime source cho riêng phần logo**, trong toàn bộ session, cho tới khi reload trang.

---

## 1. Danh sách file runtime liên quan Persistent Shell

| File | Vai trò |
|---|---|
| `User_Web/iflux-web-ui/runtime/bootstrap.js` | Entry point; `start()`; `enrichManifestWithSiteSeo()` (bind logo + SEO); gọi `installSoftNavigation` |
| `User_Web/iflux-web-ui/runtime/soft-navigation.js` | Chặn click `<a>`, `pushState`, `teardownOutlet()`, `syncActiveChrome()` |
| `User_Web/iflux-web-ui/runtime/shell-boot.js` | `bootShell()` — nhánh **soft** ("không re-chrome") vs nhánh **hard** (paint chrome) |
| `User_Web/iflux-web-ui/iflux-guest-shell.js` | `bootstrapPage()` — renderGuestNav/renderGuestActions/syncBrandHref mỗi lần nav |
| `User_Web/iflux-web-ui/iflux-platform-boot.js` (dòng ~1010-1075) | `IfluxAppShellHeader.render()/.renderNav()` — SoT nav-menu duy nhất |
| `User_Web/iflux-web-ui/iflux-web-ui.js` | `syncTopnav()`, `syncMobileTabbar()`, `patchUserMenu()` |
| `backend/.../site-seo/site-seo.service.js` + `site-seo-resolver.js` | Nguồn dữ liệu `logo_url` (Foundation) |
| 21 file `User_Web/**/index.html` (+ biến thể) | **Điểm hard-load đầu tiên của session** — hình dạng DOM ban đầu của header |

---

## 2. Trace navigation: `/co-phieu/HPG` → `/cong-dong`

Khi click link nội bộ (soft nav):

1. `soft-navigation.js#onDocumentClick` chặn `<a>`, gọi `softNavigate()`.
2. `teardownOutlet()` — chỉ xoá **`[data-ifx-page-runtime]`** (nội dung MAIN) + unload widget. **Không đụng `<header>`.**
3. `syncMainClass()` — đổi class trên `<main>`, không đụng header.
4. `pushState` đổi URL (không reload).
5. `syncActiveChrome()` → gọi `IfluxAppShellHeader.renderNav()` (nav menu) + `syncMobileTabbar()`.
6. `startSoftFn()` → `bootstrap.js#start({soft:true})` → `bootShell(pageKey, {soft:true})`.
7. Trong `shell-boot.js`, vì `booted && soft && IfluxGuestShell` → nhánh **"Soft path: không re-chrome"** — chỉ nạp lib thiếu + `rebootstrapGuest()` (nav/CTA/brand-href) + `syncMobileTabbar()`. **Không gọi `IfluxAppShellHeader.render()` lần nữa qua nhánh này** (dù `rebootstrapGuest` bên trong vẫn gọi `renderGuestNav` nếu login — nav vẫn refresh qua đường guest-shell).
8. `resolveManifest(pageKey, {seo:{bindLogo: !soft}})` → **`bindLogo = false`** vì `soft = true` → khối set `logoEl.src` bị **skip hoàn toàn**.

**Kết luận:** DOM `<header>` (khung: `<a class="ifx-topnav-brand">…</a>`) **được tái sử dụng thật (persistent — không bị page mới thay thế)**. Đây đúng là Persistent Shell, không giả lập. Nhưng **nội dung logo bên trong** không được ghi lại — nó vẫn là bất cứ gì đã có từ lúc hard-load đầu session (dù đúng hay sai).

---

## 3. Cơ chế Soft Nav (P1) được implement thế nào

- Tên phiên bản trong code: `SOFT_VER = 'softNavP1_20260811'` (soft-navigation.js) — **đây là hôm nay (11/08)**, không phải "hôm qua" như Owner nghi vấn ban đầu. Bootstrap.js import `soft-navigation.js?v=softNavP1_20260811` và `shell-boot.js?v=softNavP1_20260810` (query version 10/08). Vậy cơ chế Soft Nav P1 được triển khai/tinh chỉnh trong khoảng **10–11/08**, cùng lúc với các thay đổi title/SEO.
- Cơ chế: allowlist page-key (`home, market, flow, community, pricing, stock, sector, family, communityPost`) → intercept click → `pushState` → gọi lại `bootstrap.js#start({soft:true})` **KHÔNG reload HTML**.
- Thiết kế **chủ đích không re-bind logo khi soft** (comment ghi rõ: *"Soft-nav: không clear/rebind logo (persistent shell)"*) — đây là quyết định kỹ thuật có chủ đích, không phải bug ngẫu nhiên. Nhưng quyết định này **giả định ngầm** rằng logo tại lần hard-load đầu tiên đã đúng — giả định này **sai** với 8/21 file (xem mục 5).

---

## 4. "Hôm qua có ghi đè / quay lại header legacy?" — Bằng chứng trực tiếp

Đã kiểm tra 3 nguồn: **git diff (uncommitted) của task title-hardcode**, **git HEAD (baseline trước task)**, **mtime file thật trên production**.

**Bằng chứng 1 — git diff của chính task xoá title hôm qua** (chỉ 2 dòng mỗi file):

```diff
- <title>Chi tiết mã · iFlux</title>
+ <title><!--#include virtual="/api/seo/platform/title-only?path=$request_uri" --></title>
...
- <script ... bootstrap.js?v=mdmShell20260808">
+ <script ... bootstrap.js?v=softNavP1_20260811">
```

→ Diff xoá-title **không đụng một byte nào** trong khối `<header>`/brand/logo. Task hôm qua **không tự viết ra** đoạn `<div class="ix-brand-logo"><svg>…</svg></div>`.

**Bằng chứng 2 — git HEAD (trước khi tôi sửa gì) đã sẵn có phân hoá**:
`stock/index.html`, `stocks/index.html`, `sector/index.html`, `sectors/index.html`, `ecosystems/index.html`, `family/index.html`, `community/post.html` → **HEAD đã là `<div><svg>` từ trước**.
`home/index.html`, `community/index.html`, `market/index.html`, `flow/index.html`, `pricing/index.html`, `search/index.html`, … → **HEAD đã là `<img data-ifx-seo-logo>` từ trước**.

**Bằng chứng 3 — mtime thật trên production**: toàn bộ nhóm trên (cả "đúng" và "sai") có **cùng mtime `2026-08-11 01:53:27`** — vì rsync hôm qua ghi đè **toàn bộ nội dung file** (không phải patch dòng), nên mọi file trong batch đều đổi mtime cùng lúc, **bất kể nội dung logo trong đó đúng hay sai**.

**Kết luận:** Task xoá-title hôm qua **không tạo ra** lỗi logo. Sự phân hoá "8 file sai / 13 file đúng" **đã tồn tại từ trước** (một lần migrate div→img từng làm nhưng **không làm hết cả 21 file** — dở dang). Task xoá-title chỉ **vô tình tái phát hành (re-ship) đúng nguyên trạng dở dang đó lên production** qua rsync full-file.

**Rủi ro còn treo (không thể loại trừ 100%):** vì `rsync` đẩy **local → production** (không có backup trước khi ghi), nếu production từng được sửa **trực tiếp qua SSH** (đúng theo rule "sửa trực tiếp trên Production") mà **không backport về local**, thì lần rsync đó có thể đã đè mất bản sửa đó. Không tìm được snapshot production từ đúng thời điểm để loại trừ hoàn toàn khả năng này — nhưng bằng chứng 1+2 xác nhận **nguyên nhân chính là migration dở dang có sẵn trong git**, không phải "logic mới hôm qua tạo ra bug logo".

**Vi phạm quy trình cần ghi nhận:** dùng `rsync` lấy **local làm nguồn đẩy lên production** cho task title đã đi ngược rule đã khoá ("KHÔNG lấy local làm nguồn — chỉ tải Production→local khi yêu cầu backup"). Đây là gap quy trình thật, độc lập với việc có gây thiệt hại lần này hay không.

---

## 5. 21 bản HTML copy — authoritative runtime source hay chỉ fallback?

**Trả lời: Authoritative runtime source cho phần logo. Không phải fallback vô hại.**

Vì soft-nav không rebuild header, **DOM ban đầu (do file HTML nào được load lúc hard-refresh đầu session quyết định) sẽ tồn tại nguyên trạng cho toàn bộ session**, bất kể user sau đó soft-nav qua bao nhiêu trang khác. Nếu session bắt đầu ở 1 trong 8 trang "sai", header sai sẽ theo user đi khắp nơi (đúng như Owner nghi ngờ).

**Kiểm thực tế trên production (đường dẫn thật đang serve, không tính bản dupe orphan):**

| File (thật, đang serve) | Header logo markup |
|---|---|
| `User_Web/home/index.html` | ✅ `<img data-ifx-seo-logo>` |
| `User_Web/community/index.html` | ✅ `<img data-ifx-seo-logo>` |
| `User_Web/market/index.html` | ✅ `<img data-ifx-seo-logo>` |
| `User_Web/flow/index.html` | ✅ `<img data-ifx-seo-logo>` |
| `User_Web/pricing/index.html` | ✅ |
| `User_Web/search/index.html` | ✅ |
| `User_Web/messages/index.html` | ✅ |
| `User_Web/loyalty/index.html` | ✅ |
| `User_Web/comments/index.html` | ✅ |
| `User_Web/watchlist/index.html` | ✅ |
| `User_Web/faq/index.html` | ✅ |
| `User_Web/share/index.html` | ✅ |
| `User_Web/community/write.html` | ✅ |
| `User_Web/cau-chuyen/index.html` | ✅ |
| `User_Web/cau-chuyen/chi-tiet.html` | ✅ |
| `User_Web/stock/comment.html` | ✅ |
| `User_Web/stock/index.html` | ❌ `<div class="ix-brand-logo"><svg>…` + `<span>iFlux</span>` |
| `User_Web/stocks/index.html` | ❌ |
| `User_Web/sector/index.html` | ❌ |
| `User_Web/sectors/index.html` | ❌ |
| `User_Web/ecosystems/index.html` | ❌ |
| `User_Web/family/index.html` | ❌ |
| `User_Web/community/post.html` | ❌ |
| `profile.html` (root, ngoài `User_Web/`) | ❌ |

→ **8 điểm entry vẫn phát legacy header trực tiếp**, kể cả `stock/index.html` — chính là trang chi tiết mã cổ phiếu, một trong những entry point phổ biến nhất (từ search, từ link chia sẻ, từ Google).

**Phát hiện phụ (hygiene, không phải nguyên nhân chính):** production còn tồn tại nhiều **bản dupe orphan lồng thư mục** (`User_Web/home/home/index.html`, `User_Web/community/community/*.html`, `User_Web/stocks/stocks/index.html`, `User_Web/stock/stock/*.html`, `User_Web/flow/flow/index.html`) — các file này **có vẻ không phải route thật** (nginx rewrite không trỏ vào path lồng 2 cấp), nhưng vẫn tồn tại trên production, hầu hết giữ markup `<div><svg>` cũ. Đây là rác cần dọn ở phase khác (không đụng trong audit này theo yêu cầu Owner).

---

## 6. Phân rã Header — 7 thành phần: SoT → Owner → Binder → Fallback → Hardcode

| # | Thành phần | SoT dữ liệu | Owner (module) | Runtime binder | Chạy lại khi soft-nav? | Fallback khi thiếu | Hardcode còn sót? |
|---|---|---|---|---|---|---|---|
| 1 | **Brand/Logo** | `logo_url` — Foundation `Thiết lập SEO hệ thống` (`site-seo.service.getPublicEffective`) | `bootstrap.js#enrichManifestWithSiteSeo` | `logoEl.setAttribute('src', logoUrl)` — chỉ khi `bindLogo` | ❌ **KHÔNG** (bindLogo=false khi soft) | Nếu `logoEl` null (selector không khớp) → **im lặng bỏ qua**, giữ nguyên HTML tĩnh ban đầu | ✅ **CÓ** — 8/21 file còn `<div><svg>iFlux</svg></div>` |
| 2 | **Nav menu** | `IfluxAppShell.getPrimaryNav()` (platform-boot.js, đọc entitlement + route) | `IfluxAppShellHeader.renderNav()` | `nav.innerHTML = items.map(itemHtml)` | ✅ CÓ (mọi soft-nav qua `bootstrapPage`) | `<nav class="ifx-topnav-menu"></nav>` trống → render full | Không — 100% JS-driven |
| 3 | **User/Account (dropdown, tên, avatar)** | `IfluxAuth` session + `IfluxAppShell.getUserHub()` | `iflux-web-ui.js#patchUserMenu/syncTopnav` | DOM patch trong `[data-ifx-user-menu]`-kiểu selector | ✅ CÓ | Ẩn nếu chưa login | Không phát hiện hardcode |
| 4 | **CTA (Đăng nhập / Đăng ký / app-only)** | `IfluxAuth.isLoggedIn()` + `IfluxEntitlements` | `iflux-guest-shell.js#renderGuestActions` | Replace children trong `[data-ifx-guest-actions]`, giữ riêng slot search | ✅ CÓ | HTML tĩnh có sẵn nút "Đăng nhập" mặc định (guest) | Không — chủ đích giữ 1 nút tĩnh làm fallback trước khi JS chạy, sau đó JS thay |
| 5 | **Mobile controls (tabbar)** | `IfluxAppShell.detectContext()/currentNavigationModel()` | `iflux-web-ui.js#syncMobileTabbar` | Toggle hidden + render article-actions/account theo context | ✅ CÓ | `hideMobileTabbar()` nếu không match | Không phát hiện |
| 6 | **Search** | Lazy module `iflux-header-search.js` | `shell-boot.js#installHeaderSearchLazy` | Init 1 lần khi `[data-ifx-header-search]` xuất hiện trong DOM lúc **hard boot** | ⚠️ Không cần — UI search là stateless, không phụ thuộc trang | Ô search ẩn/readonly nếu module chưa load | Không — nhưng **phụ thuộc hard-boot đầu tiên có đúng markup** (giống rủi ro logo, mức độ thấp hơn vì search không đổi theo trang) |
| 7 | **Brand href** | `IfluxRoutes.to('community')` | `syncBrandHref()` + `renderNav()` (2 nơi cùng set, cùng giá trị) | `brand.setAttribute('href', …)` | ✅ CÓ (2 lần, trùng nhưng không mâu thuẫn) | href tĩnh `/cong-dong` hoặc `/nha-cua-toi` trong HTML gốc | Không — luôn ghi đè đúng |

**Điểm bất thường kiến trúc phụ:** thành phần #7 (brand href) được set bởi **2 hàm khác nhau** (`syncBrandHref` trong guest-shell.js và trực tiếp trong `renderNav()` của platform-boot.js) — cùng chạy, cùng kết quả, không gây lỗi hiện tại nhưng là **trùng lặp nhẹ** (2 nơi cùng ghi 1 thuộc tính) — không thuộc phạm vi sửa của audit này, chỉ ghi nhận.

---

## 7. `logo_url` — có phải single owner duy nhất?

**Ở tầng DỮ LIỆU (backend): CÓ, nhưng KHÔNG bị khoá cứng bằng contract như `faviconUrl`.**

- Cả hai đường **Bot Contract** (`seo-platform.service.resolveContract`) và **Human bootstrap** (`/api/site-seo/effective` gọi từ `bootstrap.js`) đều gọi **cùng một hàm** `site-seo.service.getPublicEffective()` → cùng một `site-seo-resolver.js`. **Không có 2 nguồn dữ liệu logo khác nhau.**
- Resolver có thứ tự lớp: `ARTICLE > PAGE > GLOBAL > FALLBACK`.
  - `faviconUrl` được **chốt cứng GLOBAL-only** — resolver code có dòng comment rõ: *"D-SEO-07 / PD-13: favicon = GLOBAL only — ignore PAGE override"*, và route `PUT /pages/:pageKey` **xoá tay** `patch.faviconUrl` trước khi lưu.
  - `logoUrl` **không có khoá tương tự ở tầng PAGE**: `normalizePage()` vẫn pass-through `p.logoUrl`, và route `PUT /site-seo/pages/:pageKey` **vẫn nhận `logoUrl` trong schema Zod**, không xoá trước khi lưu như favicon.
  - Ở tầng ARTICLE: `normalizeArticle()` **hardcode `logoUrl: undefined`** → article **không thể** override logo (an toàn).
- **Hiện trạng thực tế (de facto):** không có màn hình Admin "Thiết lập SEO từng trang" nào lộ field `logoUrl` (đã grep, không tìm thấy trong `thiet-lap-seo-tung-trang.html`) → **hiện tại chưa ai có cách set page-level logo qua UI** → trên thực tế, `Thiết lập SEO hệ thống` (GLOBAL) **đang** là nguồn duy nhất đang hoạt động.
- **Nhưng về mặt contract/thiết kế:** đây là **single-owner theo thói quen sử dụng hiện tại, không phải single-owner được khoá cứng bằng code** như favicon. Nếu sau này có ai gọi trực tiếp API `PUT /site-seo/pages/:pageKey` với `logoUrl`, hệ thống **sẽ chấp nhận** và tạo ra phân hoá logo theo trang — trái với chủ đích "No text brand / sole owner" đã ghi trong comment `bootstrap.js`.

**Kết luận mục 7:** `logo_url` **là single owner trên thực tế vận hành hiện tại**, nhưng **thiếu một dòng guard ở tầng contract** để nó chắc chắn *luôn luôn* là single-owner như đã làm với favicon. Đây là **gap chính sách cần Owner quyết** (giữ nguyên "chưa lộ ra UI = coi như an toàn" hay khoá cứng contract giống favicon) — không tự sửa vì đây là quyết định chính sách, không phải bug hiển nhiên.

---

## 8. Tổng hợp Verdict

1. **Đã sạch phần Nav/CTA/User-menu/Mobile/Href** — đúng nghĩa App Shell chuẩn hoá, JS là chủ, chạy lại mỗi lần soft-nav, không phát hiện hardcode.
2. **Chưa sạch phần Logo** — đây là **1 quyết định kiến trúc có chủ đích** ("không rebind logo khi soft nav") nhưng **giả định sai** rằng mọi entry-point HTML đều đã đúng hình dạng DOM. 8/21 file thật đang serve (và một số bản dupe orphan) chưa từng được migrate từ `<div><svg></div>` sang `<img data-ifx-seo-logo>`.
3. **Task xoá-title hôm qua không phải nguyên nhân tạo ra bug logo** — bằng chứng diff + git HEAD xác nhận markup logo sai đã có từ trước, task chỉ vô tình "ship lại" nguyên trạng dở dang đó lên production qua rsync full-file. Vẫn có 1 rủi ro lý thuyết chưa loại trừ hết (production sửa tay không backport), nhưng không phải nguyên nhân chính đã chứng minh được.
4. **21 bản HTML không còn là fallback/bootstrap trung tính** — chúng là **authoritative runtime source cho riêng phần logo** trong toàn bộ session persistent-shell. Phải coi chúng như 1 "template" cần đồng bộ tuyệt đối cho phần khung header, hoặc đổi chiến lược binding logo (bỏ giả định `bindLogo=false` khi soft — nhưng đây là quyết định kỹ thuật cần Owner chốt, không tự sửa trong audit này).
5. **`logo_url` là single-owner de facto, chưa single-owner theo contract** — thiếu guard giống favicon ở tầng PAGE-level API.
6. **Gap quy trình deploy**: dùng local làm nguồn rsync lên production cho task title đã đi ngược rule đã khoá sẵn ("Production là SoT, không lấy local làm nguồn"). Cần đổi cách deploy các task tương tự trong tương lai (patch trực tiếp trên production, hoặc đồng bộ 2 chiều trước khi ghi).

**Không đề xuất sửa code trong tài liệu này** — chờ Owner quyết hướng xử lý (sửa 8 file / đổi chiến lược bindLogo / khoá contract logo_url / dọn dupe orphan) trước khi mở phase implementation.
