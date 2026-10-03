# SoT — Di dời Trang chủ ↔ Cộng đồng ↔ Cá nhân (2026-10-03)

**Nguồn:** chỉ thị trực tiếp Owner trong hội thoại 2026-10-03, sau khi trang Cộng đồng (SoT riêng:
`docs/SoT — Community (Cộng đồng) Architecture V1.md`) đã hoạt động ổn định ở `/cong-dong`.
**Owner đã uỷ quyền tự dựng dependency, không cần hỏi lại từng bước** — tài liệu này là kế hoạch
thực thi, không phải câu hỏi chờ duyệt. Chỉ các mục đánh dấu **⚠️ CẦN OWNER XÁC NHẬN** là thật sự
chặn lại chờ quyết định; phần còn lại cứ theo đúng thứ tự Phase mà làm.

## 1. Mục tiêu cuối cùng

- **`iflux.vn` (path gốc `/`) = Cộng đồng.** Nav "Cộng đồng" đứng ĐẦU danh sách (desktop lẫn mobile).
  Không cần gõ `/cong-dong` nữa — nhưng URL `/cong-dong` vẫn phải hoạt động (alias), vì đã dùng làm
  canonical suốt Phase 0 Community.
- **"Trang chủ" cũ đổi tên thành "Cá nhân", chuyển xuống CUỐI danh sách nav** (desktop lẫn mobile).
- **Trang Cá nhân mới = Trang chủ cũ (Dashboard/Watchlist) MERGE với Tài khoản cũ (`/tai-khoan`,
  Affiliate/Liên kết thẻ/Riêng tư/Mật khẩu).** Tài khoản cũ (`/tai-khoan`) không còn là trang độc lập
  sau khi merge xong.
- **Trang Cá nhân chỉ 1 phiên bản — luôn yêu cầu đăng nhập** (giống `/tai-khoan` cũ, KHÔNG như
  Trang chủ cũ vốn có bản vãng lai phẳng). Khách vãng lai bấm vào thì được mời đăng nhập
  (giống hành vi `AUTH_PAGES` đã có cho watchlist/messages) — không giữ lại code "landing vãng lai"
  của Trang chủ cũ, xoá hẳn để tránh rác.

## 2. Bố cục trang Cá nhân mới

```
┌─────────────┬─────────────────────────────────────┬───────────┐
│ Sidebar trái│ Main (7/12)                          │ Sidebar   │
│ (3/12)      │ Tabs: Dashboard | Affiliate |         │ phải      │
│             │       Liên kết thẻ | Riêng tư | Mật khẩu│ (2/12)   │
│ Watchlist   │                                       │ Profile   │
│ ────────────│ Dashboard: canvas tự tùy chỉnh widget │ Hoạt động │
│ Widget host │   (KHÔNG mặc định Watchlist nữa —     │ gần đây   │
│ (user tự    │   Watchlist đã có riêng ở sidebar trái)│ ──────────│
│ tùy chỉnh)  │ 4 tab còn lại = y nguyên nội dung từ   │ Widget    │
│             │   /tai-khoan cũ (tab-affiliate/        │ host      │
│             │   tab-payment/tab-privacy/tab-security)│ (ADMIN đặt│
│             │   — KHÔNG user-customizable.           │ placement,│
│             │                                       │ user KHÔNG│
│             │                                       │ tự chỉnh) │
└─────────────┴─────────────────────────────────────┴───────────┘
```

- Sidebar trái + tab Dashboard: **cả 2 đều user-customizable độc lập** (xem §4 — cần mở rộng
  dashboard-engine hỗ trợ nhiều canvas).
- Sidebar phải: **Widget Placement kiểu Admin** (giống Market/News — 1 cấu hình, hiện cho mọi user),
  KHÔNG qua dashboard-engine. Cần Template "Promotion" cho Admin tự tạo Widget quảng cáo gói/ưu đãi
  rồi đặt Placement vào đây (xem §5 — **chưa tồn tại, phải dựng mới**).
- Ô trống (chưa đặt widget nào) ở Sidebar trái / tab Dashboard: hiện khung `[+]` ngay — không bắt
  buộc bấm "Tùy chỉnh" trước mới thấy được chỗ thêm (xem §6).
- Giới hạn số lượng widget đặt được theo cấp quyền (entitlement) — xem §7.

## 3. Phát hiện kiến trúc quan trọng (từ audit code thật, không suy đoán)

| Hệ thống | Dùng cho | Lưu ở đâu |
|---|---|---|
| `mountPageWidgets` + Admin "Cài đặt trang" (PagePublished, `page-composition`) | Market/News/Sidebar-phải-Cá-nhân-mới — **1 cấu hình, giống nhau cho mọi người xem** | DB server, Admin toàn quyền |
| `IfluxDashboardEngine` (`dashboard-engine.js`) | Dashboard tab hiện tại — **mỗi user tự sắp xếp riêng** | `IfluxUserStorage`, key cứng `iflux_web_dashboard_layout_v2` |

→ Sidebar trái (Watchlist + user-customizable) và tab Dashboard phải dùng **cùng họ** với
`IfluxDashboardEngine` (không phải hệ Admin Widget Placement), vì đây là tùy chỉnh RIÊNG TỪNG USER.

## 4. KHÔNG phải gap — `dashboard-engine.js` đã có sẵn cơ chế 2 vùng kéo-thả chung 1 layout

**Đã sửa hiểu lầm ban đầu (owner xác nhận): đây không phải 2 canvas độc lập, mà 1 hệ thống kéo-thả
DUY NHẤT với 2 vùng (Dashboard + Sidebar trái) — widget đặt ở Dashboard kéo được sang Sidebar trái
và ngược lại, cùng chung 1 layout/1 lần lưu.**

Audit code xác nhận **engine đã dựng sẵn đầy đủ cơ chế này, chỉ chưa trang nào kích hoạt**:
- `SCOPES = { sidebar: 'sidebar', dashboard: 'dashboard' }` (dòng ~101) — model dữ liệu widget đã có
  trường `scope`, phân biệt widget thuộc Dashboard hay Sidebar, trong CÙNG 1 `layout.widgets` array,
  CÙNG 1 `STORAGE_KEY` (không tách riêng).
- `moveWidget(layout, id, targetCol, targetIndex, scope)` — đổi `scope` của 1 widget, tức kéo-thả
  giữa 2 vùng đã được hỗ trợ sẵn ở tầng dữ liệu.
- `renderSidebarStack(canvas, layout)` — hàm render riêng cho vùng Sidebar (dạng stack dọc, khác
  dạng lưới của Dashboard).
- Trong `init()`, engine tự tìm `document.querySelector('[data-ifx-hub-sidebar-canvas]')` — **nếu
  phần tử này tồn tại trên trang thì tự động render + kích hoạt kéo-thả vùng Sidebar luôn**, không
  cần sửa gì thêm ở engine.

**Xác nhận bằng grep: `[data-ifx-hub-sidebar-canvas]` CHƯA từng được dùng ở bất kỳ trang nào** — tức
tính năng đã được dựng sẵn từ trước (đón đầu đúng nhu cầu này) nhưng chưa trang nào gắn phần tử host
vào để kích hoạt. Việc cần làm ở Phase 3 chỉ là: đặt 1 `<div data-ifx-hub-sidebar-canvas>` vào đúng
vị trí Sidebar trái của trang Cá nhân mới (cạnh Watchlist), gọi `IfluxDashboardEngine.init()` như
bình thường — KHÔNG cần sửa `dashboard-engine.js`. Việc còn lại là **test kỹ** đường kéo-thả 2 chiều
này vì nhiều khả năng chưa từng được chạy thật end-to-end trước đây (code có nhưng chưa ai dùng).

## 5. Gap nghiệp vụ thật — chưa có Template "Promotion"

Owner xác nhận trước đây có yêu cầu dựng Template + Widget host "Promotion" để Admin tự tạo Widget
quảng cáo gói/ưu đãi rồi đặt Placement — audit `design_system/05_templates/templates.json` xác nhận
**chưa tồn tại** (chỉ có `Gói Promotion` là nhãn mô tả widget `plan-promo` cũ, không phải Template
Admin tự publish được). Cần dựng Template mới (`TMP-PROMOTION` hay tên tương đương) theo đúng pattern
Widget-Publish hiện có (xem `backend/src/modules/widget-publish/`) để Admin vào Cài đặt trang tự tạo
Widget từ Template này và đặt vào Sidebar-phải-Cá-nhân.

## 6. Khung `[+]` hiện sẵn khi canvas rỗng

Cần audit `dashboard-engine.js`'s `renderCanvas`/`renderSidebarStack` xem logic "rỗng → hiện khung
thêm" đã có sẵn cho trường hợp đã bấm "Tùy chỉnh" chưa, rồi mở rộng để hiện NGAY cả khi CHƯA bấm
"Tùy chỉnh" (tức editMode=false nhưng canvas rỗng vẫn hiện `[+]`) — khác hành vi mặc định hiện tại
(ẩn hẳn toolbar/canvas rỗng, chỉ hiện khi bấm Tùy chỉnh).

## 7. Giới hạn widget theo cấp quyền

Cần tìm cơ chế entitlement/tier hiện có (IfluxEntitlements hoặc tương đương) và áp dụng giới hạn số
widget tối đa có thể đặt trong canvas user-customizable (Dashboard + Sidebar trái), theo tier của
user — audit trước khi code, tránh trùng lặp cơ chế đã có.

## 8. ⚠️ CẦN OWNER XÁC NHẬN — 2 điểm có nhiều hơn 1 cách làm hợp lý

1. **URL của trang Cá nhân mới**: giữ `/trang-chu` (ít xáo trộn, nhưng tên URL không khớp nhãn nav
   "Cá nhân" mới) hay đổi thành `/ca-nhan` (khớp tên, nhưng cần 301 redirect `/trang-chu` →
   `/ca-nhan` để không vỡ link cũ — đúng pattern đã làm với Cộng đồng/Tin tức trước đây)?
   **Mặc định đang chọn: đổi thành `/ca-nhan`, giữ `/trang-chu` redirect 301** (nhất quán với cách
   codebase xử lý đổi tên trước giờ) — sẽ làm theo hướng này nếu Owner không phản hồi khác.
2. **Tab "Timeline" (bài viết của tôi) trong Trang chủ cũ** — spec mới liệt kê tab Main chỉ còn
   Dashboard + 4 tab tài khoản, không nhắc Timeline. Hiểu là **bỏ hẳn tab Timeline** (nội dung tương
   đương nay thuộc về Cộng đồng — follow người khác xem bài họ, xem bài của mình có thể qua "Chủ đề
   của tôi"/"Bài viết đã lưu" ở Lối tắt nhanh Cộng đồng đã có sẵn). **Mặc định đang chọn: bỏ hẳn** —
   sẽ làm theo hướng này nếu Owner không phản hồi khác.

## 8b. Ràng buộc kỹ thuật phát hiện thêm (Phase 2) — `account-feature-boot.js`

Audit `/tai-khoan` cũ (`User_Web/account/profile.html`, 503 dòng) xác nhận: toàn bộ 4 tab
(Affiliate/Thanh toán/Riêng tư/Bảo mật) là HTML tĩnh với id/data-attribute cố định
(`#tab-affiliate`, `#ref-link`, `data-bind="..."`, `data-pay-field`, `data-sec-field`...), được
"bind" hành vi thật bởi `account-feature-boot.js` (classic script, ~352 dòng) — script này đã hoạt
động tốt, **không viết lại logic nghiệp vụ**, chỉ di chuyển nguyên markup + script.

**Ràng buộc chặn cần xử lý trước khi di chuyển**: `account-feature-boot.js`'s `main()` gọi
`await waitShellReady('account')` — chờ đúng sự kiện `iflux-shell-ready` với
`detail.pageKey === 'account'`, do `bootstrap.js` chỉ bắn sự kiện này cho `SHELL_ONLY` pages
(trang HTML tĩnh kiểu cũ). Trang Cá nhân mới là **composite page** (pageKey `home`, qua
`buildPageFrame`/page-runtime bình thường) — sự kiện `shell-ready` với pageKey `'account'` SẼ
KHÔNG BAO GIỜ bắn ra nữa, khiến `account-feature-boot.js` treo vĩnh viễn nếu giữ nguyên.
→ Cần sửa `waitShellReady()` thành tổng quát (không khoá cứng theo 1 pageKey, hoặc nhận pageKey
làm tham số) và bỏ dòng `mountPageWidgets(layout.parentElement, 'account')` cuối `main()` (sidebar
Admin Widget giờ do khung trang Cá nhân mới tự quản, không qua publishKey `'account'` cũ nữa).

## 9. Thứ tự Phase (dependency — làm đúng trình tự, không đảo)

- **Phase 1 — Routing + Nav (không đụng layout trang)**: `/` → pageKey community; nav "Cộng đồng" lên
  đầu, "Trang chủ"→"Cá nhân" xuống cuối; nginx `location = /` serve Community; `/trang-chu` 301 →
  `/ca-nhan`; mobile bottom-nav (dùng chung `primary` array — kiểm tra renderer có tự động ăn theo
  không hay cần sửa riêng). **KHÔNG xoá trang Trang chủ cũ ở bước này** — chỉ đổi route, trang Cá
  nhân mới làm ở Phase 2+ xong mới xoá code cũ.
- **Phase 2 — Khung trang Cá nhân mới** (3 cột, `buildPageFrame({rightSidebar:true})`, tabs Main) +
  gắn `[data-ifx-hub-sidebar-canvas]` vào Sidebar trái để kích hoạt kéo-thả 2 vùng có sẵn (xem §4,
  không cần sửa `dashboard-engine.js`) + audit đầy đủ nội dung 4 tab từ `/tai-khoan` cũ để chuyển
  nguyên vẹn (không rút gọn nghiệp vụ).
- **Phase 3 — Template "Promotion"** (xem §5) + Admin đặt Placement thật vào Sidebar phải.
- **Phase 4 — Khung `[+]` canvas rỗng** (xem §6) + **giới hạn widget theo tier** (xem §7).
- **Phase 5 — Dọn rác**: xoá `widgets/home-page` cũ (2 phiên bản), `User_Web/account/profile.html`
  cũ (sau khi nội dung đã chuyển hết sang trang Cá nhân mới), route/redirect cũ không còn dùng,
  comment/doc lỗi thời nhắc "Trang chủ"/"Tài khoản" theo nghĩa cũ.

## 10. Tiến độ

- [x] Phase 1 — Routing + Nav (commit `cc74dd1`, đã test local đầy đủ, đợi xác nhận staging)
- [ ] Phase 2 — Khung trang Cá nhân mới + kích hoạt Sidebar trái kéo-thả
- [ ] Phase 3 — Template Promotion + Placement Sidebar phải
- [ ] Phase 4 — Khung [+] rỗng + giới hạn theo tier
- [ ] Phase 5 — Dọn rác
