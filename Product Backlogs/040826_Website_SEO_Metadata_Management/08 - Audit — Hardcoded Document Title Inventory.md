CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# 08 — Audit — Hardcoded Document Title Inventory

| | |
|--|--|
| **Task** | `040826_Website_SEO_Metadata_Management` |
| **Date** | 2026-08-10 |
| **Trigger** | Owner: Google Search vẫn hiện `Cộng đồng · iFlux` dù đã có **Thiết lập SEO** |
| **Scope** | User Web public/runtime titles — HTML static · page manifests · bot first-HTML · human SPA |
| **Authority** | Evidence only — **không** khóa Solution/Plan mới trong file này |
| **Status** | ✅ AUDIT COMPLETE |

---

## 0. Executive finding

Owner đúng về **hardcode còn tồn tại** trong source (HTML + manifest).

Nhưng **Googlebot first-HTML hiện tại của `/cong-dong` đã lấy title từ SEO Platform**:

```text
Bot first-HTML  =  iFlux | Cộng đồng chứng khoán
Human SPA HTML  =  Cộng đồng · iFlux   ← hardcode trong community/index.html
API effective   =  iFlux | Cộng đồng chứng khoán  (xác nhận trước đó)
```

→ Snippet Google Search `Cộng đồng · iFlux` rất có thể là **index cũ** (crawl trước khi bot shell/SEO page config live), **không** chứng minh bot path hiện tại còn hardcode.

Vấn đề governance thật:

```text
1) Hardcode vẫn là fallback / first paint cho HUMAN + nhiều route chưa có bot shell
2) Manifest documentTitle vẫn hardcode — bootstrap chỉ override sau /seo/effective
3) Một nhóm page public/app vẫn BOT = hardcode (chưa wire seo_shell)
```

---

## 1. Dual-path model (hiện trạng)

```text
Bot / social crawler
  → nginx @seo_shell_* (một số route)
  → first-HTML title từ SEO Platform / Contract

Human browser
  → static HTML <title> hardcode
  → JS bootstrap.enrichManifestWithSiteSeo()
  → document.title = effective.title (nếu API OK)
```

Evidence nginx: `infra/nginx-iflux-production-locations.conf` — comment Plan P4; `/cong-dong` có `@seo_shell_community`.

---

## 2. Production first-HTML matrix (2026-08-10)

UA bot = Googlebot · UA human = Chrome.

| Route | pageKey | Bot `<title>` | Human static `<title>` | Bot status |
|-------|---------|---------------|------------------------|------------|
| `/cong-dong` | community | `iFlux \| Cộng đồng chứng khoán` | `Cộng đồng · iFlux` | **SEO OK** (bot) · hardcode human |
| `/nha-cua-toi` | home | `iFlux \| Nhà của tôi` | `Nhà của tôi · iFlux` | SEO OK (bot) |
| `/thi-truong` | market | `iFlux \| Thị trường chứng khoán` | `Thị trường · iFlux` | SEO OK (bot) |
| `/dong-tien` | flow | `iFlux \| Dòng tiền chứng khoán` | `Dòng tiền · iFlux` | SEO OK (bot) |
| `/hoi-dap` | faq | `iFlux \| Câu hỏi thường gặp` | `Hỏi đáp · iFlux` | SEO OK (bot) |
| `/thanh-vien` | loyalty | `iFlux \| Membership - Quyền lợi thành viên` | `Chương trình thành viên · iFlux` | SEO OK (bot) |
| `/co-phieu` | stocks | `iFlux \| Danh sách cổ phiếu` | `Danh sách cổ phiếu · iFlux` | SEO OK (bot) |
| `/nganh` | sectors | `iFlux \| Ngành chứng khoán` | `Danh sách ngành · iFlux` | SEO OK (bot) |
| `/he-sinh-thai` | ecosystems | `iFlux \| Hệ sinh thái doanh nghiệp` | `Danh sách hệ sinh thái · iFlux` | SEO OK (bot) |
| `/cau-chuyen` | cauChuyen | `iFlux \| Câu chuyện thị trường` | `Danh sách câu chuyện · iFlux` | SEO OK (bot) |
| `/goi-cuoc` | pricing | `Gói cước · iFlux` | `Gói cước · iFlux` | **BOT HARDCODE** — không seo_shell |
| `/theo-doi` | watchlist | `Theo dõi · iFlux` | `Theo dõi · iFlux` | **BOT HARDCODE** |
| `/tim-kiem` | search | `Tìm kiếm · iFlux` | `Tìm kiếm · iFlux` | **BOT HARDCODE** |
| `/tin-nhan` | messages | `Tin nhắn · iFlux` | `Tin nhắn · iFlux` | **BOT HARDCODE** |
| `/tai-khoan` | account | `Tài khoản · iFlux` | `Tài khoản · iFlux` | **BOT HARDCODE** (thường noindex) |
| `/dang-nhap` | auth.login | `Đăng nhập · iFlux` | `Đăng nhập · iFlux` | **BOT HARDCODE** (auth) |
| `/binh-luan` | comments | `Bình luận · iFlux` | `Bình luận · iFlux` | **BOT HARDCODE** |
| `/cong-dong/viet-bai` | communityWrite | `Viết bài · Cộng đồng iFlux` | `Viết bài · Cộng đồng iFlux` | **BOT HARDCODE** |

### Google Search snippet Owner thấy

```text
Cộng đồng · iFlux
```

= đúng chuỗi hardcode human/static · **không** khớp bot first-HTML hiện tại.  
Khuyến nghị: Search Console URL Inspection / Request indexing cho `https://iflux.vn/cong-dong` sau khi Wave B verify — **không** kết luận “SEO Admin không chạy” chỉ từ snippet cũ.

---

## 3. Source inventory — HTML `<title>` hardcode (`· iFlux` / brand)

Loại trừ: redirect stubs (`Chuyển hướng…`), Playwright `node_modules`, empty article shells.

| Static title | File |
|--------------|------|
| Cộng đồng · iFlux | `User_Web/community/index.html` |
| Nhà của tôi · iFlux | `User_Web/home/index.html` |
| Thị trường · iFlux | `User_Web/market/index.html` |
| Dòng tiền · iFlux | `User_Web/flow/index.html` |
| Gói cước · iFlux | `User_Web/pricing/index.html` |
| Hỏi đáp · iFlux | `User_Web/faq/index.html` |
| Chương trình thành viên · iFlux | `User_Web/loyalty/index.html` |
| Danh sách cổ phiếu · iFlux | `User_Web/stocks/index.html` |
| Danh sách ngành · iFlux | `User_Web/sectors/index.html` |
| Danh sách hệ sinh thái · iFlux | `User_Web/ecosystems/index.html` |
| Danh sách câu chuyện · iFlux | `User_Web/cau-chuyen/index.html` |
| Câu chuyện · iFlux | `User_Web/cau-chuyen/chi-tiet.html` |
| Hệ sinh thái · iFlux | `User_Web/family/index.html` |
| Ngành · iFlux | `User_Web/sector/index.html` |
| Chi tiết mã · iFlux | `User_Web/stock/index.html` |
| Theo dõi · iFlux | `User_Web/watchlist/index.html` |
| Tìm kiếm · iFlux | `User_Web/search/index.html` |
| Tin nhắn · iFlux | `User_Web/messages/index.html` |
| Tài khoản · iFlux | `User_Web/account/profile.html` |
| Thanh toán · iFlux | `User_Web/account/checkout.html` |
| Bình luận · iFlux | `User_Web/comments/index.html` |
| Bình luận cổ phiếu · iFlux | `User_Web/stock/comment.html` |
| Viết bài · Cộng đồng iFlux | `User_Web/community/write.html` |
| Chia sẻ insight · iFlux | `User_Web/share/index.html` |
| Cảnh báo · iFlux | `User_Web/alerts/index.html` |
| Đăng nhập / Đăng ký / Quên MK / OTP · iFlux | `User_Web/auth/*` |
| Cổ phiếu · iFlux | `User_Web/community/stocks/index.html` (legacy surface) |

**Count (product HTML hardcode):** ~30 surfaces (không tính redirect / test tooling).

---

## 4. Source inventory — `documentTitle` trong page manifests

| documentTitle | Manifest |
|---------------|----------|
| Cộng đồng · iFlux | `community.manifest.js` |
| Nhà của tôi · iFlux | `home.manifest.js` |
| Thị trường · iFlux | `market.manifest.js` |
| Dòng tiền · iFlux | `flow.manifest.js` |
| Gói cước · iFlux | `pricing.manifest.js` |
| Hỏi đáp · iFlux | `faq.manifest.js` |
| Chương trình thành viên · iFlux | `loyalty.manifest.js` |
| Danh sách cổ phiếu · iFlux | `stocks.manifest.js` |
| Danh sách ngành · iFlux | `sectors.manifest.js` |
| Danh sách hệ sinh thái · iFlux | `ecosystems.manifest.js` |
| Danh sách câu chuyện · iFlux | `cau-chuyen.manifest.js` |
| Câu chuyện · iFlux | `cau-chuyen-detail.manifest.js` |
| Hệ sinh thái · iFlux | `family.manifest.js` |
| Ngành · iFlux | `sector.manifest.js` |
| Chi tiết mã · iFlux | `stock.manifest.js` |
| Theo dõi · iFlux | `watchlist.manifest.js` |
| Tìm kiếm · iFlux | `search.manifest.js` |
| Tin nhắn · iFlux | `messages.manifest.js` |
| Tài khoản · iFlux | `account.manifest.js` |
| Thanh toán · iFlux | `checkout.manifest.js` |
| Bình luận · iFlux | `comments.manifest.js` |
| Bình luận cổ phiếu · iFlux | `stock-comment.manifest.js` |
| Viết bài · Cộng đồng iFlux | `community-write.manifest.js` |
| Chia sẻ insight · iFlux | `share.manifest.js` |
| *(empty — entity/article)* | `community-post.manifest.js` |

Runtime: `bootstrap.enrichManifestWithSiteSeo` **ghi đè** `documentTitle` bằng `effective.title` khi API trả title — hardcode manifest = **fallback** khi API trống/fail.

---

## 5. Runtime JS vẫn hardcode suffix (ngoài manifest)

| Location | Pattern |
|----------|---------|
| `community-page.js` | `documentTitle: meta.title + ' · iFlux'` (collection/author views) |
| `comments-page.js` | `document.title = titleFor(ctx) + ' · iFlux'` |
| `cau-chuyen-list-page.js` | `documentTitle: 'Danh sách câu chuyện · iFlux'` |

→ Collection/filter SEO có thể **bypass** Thiết lập SEO pageKey nếu không resolve qua Contract/template.

---

## 6. Classification (Audit)

| Class | Meaning | Surfaces |
|-------|---------|----------|
| **A — Bot SEO OK · Human hardcode residual** | seo_shell inject đúng; HTML/manifest vẫn `· iFlux` | community, home, market, flow, faq, loyalty, stocks, sectors, ecosystems, cauChuyen |
| **B — Bot + Human hardcode** | Chưa seo_shell (hoặc không index-critical) | pricing, watchlist, search, messages, comments, communityWrite, account, auth*, share, checkout, stock comment, alerts |
| **C — Entity / article** | Title động / empty shell | community post, stock/sector/family detail (entity pipeline riêng) |
| **D — Redirect stubs** | `Chuyển hướng` | ~47 HTML SEO stubs — N/A title SEO |

---

## 7. Map → epic `040826` (không mở Plan mới)

| Finding | Liên hệ Plan / SoT |
|---------|-------------------|
| Hardcode HTML/manifest còn khắp User Web | D-SEO-04 automatic · D-SEO-05 first-HTML · singleton — residual fallback chưa cleanup |
| Google snippet cũ community | Observability / re-index — không defect Admin SEO nếu bot title đã đúng |
| pricing / watchlist / search… bot hardcode | P4 seo_shell coverage **gap** hoặc intentional noindex — cần SoT/Plan classify indexability |
| JS `· iFlux` trong community-page / comments | Conflict với page SEO / template — Wave B residual |

**Cấm trong Audit này:** tự xóa hardcode / đổi nginx / claim BR PASS.

---

## 8. Recommended next (Owner chốt — không tự làm)

1. **Verify Google:** URL Inspection `https://iflux.vn/cong-dong` — Live title có phải `iFlux | Cộng đồng chứng khoán`?
2. **Wave residual (sau gate §12 robots nếu còn):** cleanup Class A hardcode → empty/`data-seo` placeholder; manifest `documentTitle` chỉ fallback.
3. **Class B:** Owner quyết page nào **phải** vào bot seo_shell vs noindex/app-only.
4. **JS hardcode** community collections / comments → consume Contract/template, cấm `+ ' · iFlux'`.

---

## 9. Evidence commands

```bash
# Bot vs human title
curl -A 'Googlebot/2.1' -sS https://iflux.vn/cong-dong | rg -o '<title>[^<]+'
curl -A 'Mozilla/5.0' -sS https://iflux.vn/cong-dong | rg -o '<title>[^<]+'

# Inventory
rg -n '<title>' User_Web --glob '*.html' | rg -v 'Chuyển hướng|node_modules'
rg -n "documentTitle:" User_Web/iflux-web-ui/pages/*.manifest.js
```

---

**End of Audit 08 — Hardcoded Document Title Inventory · 2026-08-10**
