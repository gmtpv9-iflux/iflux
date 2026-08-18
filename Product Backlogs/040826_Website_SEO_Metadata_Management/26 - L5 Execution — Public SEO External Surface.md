# 26 — L5 Execution: Public / SEO / External Surface

**Layer:** L5 (theo `20 - Master Verification Specification.md` §26-39). Lớp quan trọng nhất vì UI PASS không chứng minh crawler PASS.
**Gate trước:** L4 = ✅ PASS (`25`).
**Phương pháp:** `curl` với UA thật (Zalo 1.0, Googlebot khi cần) lấy **raw first HTML** trên Production + Playwright/Chrome thật cho DOM-sau-JS (Human pipeline) — đúng yêu cầu spec "không chỉ kiểm tra DOM sau JS" cho bot, và đối chiếu 2 pipeline cho L5-TC-12.

---

## L5-TC-01 — Human HTML

Đã verify qua Chrome thật (Playwright) ở `25` (L4) + bổ sung tại đây. `document.title`, meta description, OG, Twitter, favicon đều có trong DOM sau khi JS chạy xong, cho các trang generic (`/thi-truong`, `/cong-dong`, `/`, `/dong-tien`) và trang entity (`/cong-dong/bai-viet/...`).

**Verdict: PASS** (sau khi fix canonical/og:url — xem L5-TC-12).

---

## L5-TC-02 — First HTML / Bot (raw response, không phải DOM sau JS)

`curl -A "Zalo 1.0"` — raw response thật trên Production:

| Surface | HTTP | title | description | canonical | og:image |
|---|---|---|---|---|---|
| `/co-phieu/HPG` (stock) | 200 | ✅ có mã HPG | ✅ | ✅ `= chính nó` | ✅ `.social.jpg` |
| `/nganh` (sectors list) | 200 | ✅ | ✅ | ✅ | ✅ `.social.jpg` |
| `/he-sinh-thai` (ecosystems list) | 200 | ✅ | ✅ | ✅ | ✅ `.social.jpg` |
| `/cau-chuyen` (story list) | 200 | ✅ | ✅ | ✅ | ✅ `.social.jpg` |
| `/cong-dong/bai-viet/{slug}` (article) | 200 | ✅ | ✅ | ✅ | ✅ |

Không có raw token `{xxx}` leak, không thiếu field bắt buộc.

**Verdict: PASS.**

---

## L5-TC-03 — Canonical

Verify không có `?ref=`, `?r=`, tracking params, publicId làm canonical — xem chi tiết đầy đủ ở **L5-TC-10** (URL Variant Matrix). Tất cả canonical quan sát được đều là Clean Public URL.

**Verdict: PASS.**

---

## L5-TC-04 — Robots

| Test | Kết quả |
|---|---|
| `/thi-truong` (indexable) | `meta robots: index,follow` ✅ |
| `robots.txt` | HTTP 200, syntax hợp lệ, `Disallow: /tai-khoan`, `/tin-nhan`, `/cong-dong/viet-bai`, `/api/`; `Sitemap:` directive có; Content-Signal AI (search=yes, ai-train=no) theo policy đã khóa |
| `/tai-khoan`, `/tin-nhan` (private, có trong robots.txt Disallow) | **GAP phát hiện:** không có `X-Robots-Tag` header dù đã Disallow ở robots.txt (thiếu defense-in-depth nếu bot bỏ qua robots.txt) |
| `/{publicId}/...`, `?ref=`, `?r=` | `X-Robots-Tag: noindex, nofollow` ✅ (đã verify ở L5-TC-10) |
| Googlebot / Bingbot riêng biệt | Không phát hiện policy khác nhau cần thiết theo BR hiện tại |

**Fix đã áp dụng (P0, minimal, an toàn — chỉ `add_header`, không đổi routing):**
Thêm `add_header X-Robots-Tag "noindex, nofollow" always;` cho 9 location block `/tai-khoan*` + `/tin-nhan*` trong `/etc/nginx/snippets/iflux-prod-app.conf` (Production) + đồng bộ `infra/nginx-iflux-production-locations.conf` (local mirror). Test `nginx -t` PASS, reload thành công, verify lại:

```text
GET /tai-khoan            → x-robots-tag: noindex, nofollow ✅
GET /tin-nhan             → x-robots-tag: noindex, nofollow ✅
GET /tai-khoan/security   → x-robots-tag: noindex, nofollow ✅
GET /tin-nhan/following   → x-robots-tag: noindex, nofollow ✅
```

**Verdict: PASS (sau fix).**

---

## L5-TC-05 — Sitemap

| Field | Kết quả |
|---|---|
| Tồn tại | ✅ HTTP 200, `content-type: application/xml` |
| Valid XML | ✅ parse thành công bằng `xml.etree.ElementTree` |
| Tổng `<url>` | 3691 |
| Duplicate URL | **0** |
| URL chứa `?ref=`/`?r=`/`/IFLxxxxx/` (BR-45.3) | **0** — không có leak |

**Verdict: PASS.**

---

## L5-TC-06 — OpenGraph

Verify trên `/co-phieu/HPG` (đại diện):

```text
og:title        = iFlux | HPG - Công ty Cổ phần Tập đoàn Hòa Phát
og:description  = Xem thông tin, diễn biến...
og:url           = https://iflux.vn/co-phieu/HPG   (Clean Public URL, đúng BR-45.5)
og:image        = .../img-001.social.jpg  (P0 fix trước đó — JPEG, không WebP)
og:image:type / width / height  = có (P0 fix trước đó)
```

**Verdict: PASS** (bao gồm cả field human-DOM sau fix L5-TC-12).

---

## L5-TC-07 — Twitter/X

```text
twitter:card         = summary_large_image
twitter:title        = iFlux | HPG - Công ty Cổ phần Tập đoàn Hòa Phát
twitter:description  = Xem thông tin, diễn biến...
twitter:image        = .../img-001.social.jpg
```

**Verdict: PASS.**

---

## L5-TC-08 — Structured Data

`/co-phieu/HPG` có 2 JSON-LD block:

1. `WebPage` — `url: https://iflux.vn/co-phieu/HPG` (Clean Public URL, khớp canonical/og:url — BR-45.5) ✅
2. `BreadcrumbList` — 4 item, tất cả `item` URL đều Clean Public URL:
   ```text
   1. Trang chủ  → https://iflux.vn/cong-dong
   2. Thị trường → https://iflux.vn/thi-truong
   3. Cổ phiếu   → https://iflux.vn/co-phieu
   4. HPG        → https://iflux.vn/co-phieu/HPG
   ```
   Khớp breadcrumb UI (đã verify hierarchy tương tự ở L3).

**Verdict: PASS.**

---

## L5-TC-09 — Google-facing verification

**N/A / Manual** — Agent không có quyền truy cập Google Search Console của Owner (cần đăng nhập cá nhân). Theo spec §35: "Google indexing itself is not treated as the only correctness signal; source/runtime evidence remains authoritative" — L5-TC-01/02/05 đã cung cấp đủ evidence source/runtime. Khuyến nghị Owner tự chạy Request Indexing cho các URL vừa fix (`/`, `/cong-dong`, `/co-phieu/*`) sau khi L5 PASS.

**Verdict: N/A (không blocking — theo đúng ghi chú spec).**

---

## L5-TC-10 — URL Variant Matrix (BR-45, BLOCKING)

Test với 1 bài viết Community thật (`co-dong-nha-nuoc-tai-vinamilk-sabeco-fpt-vua-tang-von-dieu-le-len-50-000-ty`), UA Zalo 1.0, đủ 4 variant:

| Variant | HTTP | Canonical | og:url | Structured-data URL | Robots | Sitemap |
|---|---|---|---|---|---|---|
| **Clean** `/cong-dong/bai-viet/{slug}` | 200 | `= chính nó` | `= chính nó` | `= chính nó` | `index,follow` | Có (loại trừ được từ TC-05: 0 leak) |
| **PublicId** `/IFLTEST01/cong-dong/bai-viet/{slug}` | 200 | → Clean URL | → Clean URL | KHÔNG có (0 JSON-LD — noindex nên không cần rich data) | `noindex,nofollow` (header + meta) | Không có |
| **`?ref=IFLTEST01`** | 200 | → Clean URL | → Clean URL | (đồng nhất) | `noindex,nofollow` | Không có |
| **`?r=IFLTEST01`** | 200 | → Clean URL | → Clean URL | (đồng nhất) | `noindex,nofollow` | Không có |

**Root cause xác nhận (source):** nginx `rewrite "(?i)^/IFL[A-Za-z0-9]{5,17}/(.+)$" /$1 last;` (`/etc/nginx/snippets/iflux-prod-app.conf:70-71`) — strip publicId **trước khi** request tới backend/SSR, nên canonical/og:url luôn được tính từ path sạch **by construction** (không phụ thuộc logic phụ). `?ref=`/`?r=` không đổi path nên canonical tự nhiên giữ nguyên.

**Attribution capture (real browser, Chrome thật — không phải chỉ curl):**

```text
Navigate → https://iflux.vn/IFLTEST01/cong-dong/bai-viet/{slug}
Cookie iflux_ref_code       = IFLTEST01   ✅
localStorage iflux_ref_code = IFLTEST01   ✅
Browser URL bar             = giữ nguyên /IFLTEST01/... (không redirect — đúng thiết kế)
canonical (DOM, sau JS)      = Clean URL   ✅
```

→ Xác nhận: **attribution vẫn hoạt động đúng** trong khi SEO identity (canonical/og:url/sitemap) không bị publicId/ref chi phối — đúng boundary BR-45.

**Verdict: PASS (BLOCKING gate cleared).**

---

## L5-TC-11 — Singleton Tag Audit (§38.1, BLOCKING — Reviewer MUST)

Đếm tag trên raw HTML, 4 page type:

| Page type | `<title>` | `meta description` | `canonical` | `og:url` | `og:title` | `og:description` |
|---|---|---|---|---|---|---|
| Market (`/thi-truong`) | 1 | 1 | 1 | 1 | 1 | 1 |
| Community (`/cong-dong`) | 1 | 1 | 1 | 1 | 1 | 1 |
| Stock (`/co-phieu/HPG`) | 1 | 1 | 1 | 1 | 1 | 1 |
| Article (`/cong-dong/bai-viet/...`) | 1 | 1 | 1 | 1 | 1 | 1 |

Không có trường hợp 2 `<title>` hoặc 2 `meta description` cùng render.

**Verdict: PASS (BLOCKING gate cleared).**

---

## L5-TC-12 — Human vs Crawler Consistency Diff (BR-35, §39)

**Phát hiện (trước fix):** So sánh Human DOM (Chrome thật, sau JS) vs Bot raw HTML (Zalo UA) cho cùng URL (`/thi-truong`, `/cong-dong`, `/`, `/dong-tien`, …):

| Field | Bot pipeline | Human pipeline (trước fix) | Khớp? |
|---|---|---|---|
| title | ✅ | ✅ | ✅ |
| description | ✅ | ✅ | ✅ |
| og:title/description/image | ✅ | ✅ | ✅ |
| twitter:* | ✅ | ✅ | ✅ |
| favicon | ✅ | ✅ | ✅ |
| **canonical** | ✅ | **❌ HOÀN TOÀN KHÔNG CÓ trong DOM** | **❌ FAIL** |
| **og:url** | ✅ | **❌ KHÔNG CÓ** | **❌ FAIL** |

**Root cause (source-level, xác nhận qua code):**
- `runtime/page-definition.js` (`applySeo`/`setCanonical`) **có hỗ trợ** canonical/`og:url` — key đã tồn tại trong `META_FIELDS`.
- `runtime/bootstrap.js` (`enrichManifestWithSiteSeo`) — hàm enrich manifest từ `/api/seo/effective` cho pipeline Human/SPA — **không bao giờ set `seo.canonical`/`seo['og:url']`**, nên `setCanonical(seo.canonical || null)` luôn nhận `null` → **luôn xóa canonical nếu có**.
- `/api/seo/effective` (site-seo module, public projection) **không có field `canonical`** — khác Contract đầy đủ (`resolveContract()`, seo-platform module) dùng riêng cho bot/SSR.
- Trang Entity/Article (stock/sector/story/post) **không bị ảnh hưởng** — đã có canonical riêng qua `IfluxSeoUrl.setCanonical()` (cơ chế cũ, hoạt động đúng, verify độc lập).

**Đánh giá rủi ro thực tế:** Bot/crawler (nguồn xác định index/SERP) luôn nhận canonical đúng qua pipeline riêng — **không ảnh hưởng kết quả index thực tế**. Nhưng đây là gap thật theo đúng yêu cầu tường minh của L5-TC-12 ("phải khớp giữa 2 pipeline trừ khác biệt được BR cho phép" — không có BR nào cho phép khác biệt này), và là chính xác loại discrepancy gây ra STOP-THE-LINE trước đó (Owner tự "View Source" thấy thiếu canonical).

**Fix đã áp dụng (modify existing, không thêm capability mới):**

1. **Backend** (`site-seo.service.js`, `getPublicEffective()`): thêm `canonical_path` vào response — tái dùng **chính** `contractBuilder.PAGE_KEY_TO_PATH` mà bot pipeline đã dùng (đảm bảo nhất quán by construction, xử lý đúng cả alias route như `/` → `/cong-dong`).
2. **Client** (`runtime/bootstrap.js`, `enrichManifestWithSiteSeo()`): set `seo.canonical`/`seo['og:url']` = `origin + eff.canonical_path` (ưu tiên), fallback `IfluxNormalizePath(location.pathname)` (utility đã có, cùng logic strip publicId mà nginx dùng) nếu API không trả `canonical_path`. Có guard `if (!seo.canonical)` — **không override** page Entity/Article đã tự set canonical riêng.

**Verify sau fix (Chrome thật, Production, sau deploy + Cloudflare purge):**

```text
/            → canonical: https://iflux.vn/cong-dong   | og:url: https://iflux.vn/cong-dong    ✅ (khớp bot, alias đúng)
/thi-truong  → canonical: https://iflux.vn/thi-truong  | og:url: https://iflux.vn/thi-truong    ✅
/cong-dong   → canonical: https://iflux.vn/cong-dong   | og:url: https://iflux.vn/cong-dong     ✅
/dong-tien   → canonical: https://iflux.vn/dong-tien   | og:url: https://iflux.vn/dong-tien      ✅
/goi-cuoc    → canonical: https://iflux.vn/goi-cuoc    | og:url: https://iflux.vn/goi-cuoc       ✅
/hoi-dap     → canonical: https://iflux.vn/hoi-dap     | og:url: https://iflux.vn/hoi-dap        ✅
/cong-dong/bai-viet/{slug} (Entity/Article — regression check) → canonical đúng, KHÔNG bị fix generic ghi đè ✅
```

**Verdict: PASS (sau fix).**

---

## L5 Exit Gate

```text
L5-TC-01 Human HTML              PASS (sau fix TC-12)
L5-TC-02 First HTML/Bot          PASS
L5-TC-03 Canonical               PASS
L5-TC-04 Robots                  PASS (sau fix X-Robots-Tag /tai-khoan, /tin-nhan)
L5-TC-05 Sitemap                 PASS
L5-TC-06 OpenGraph               PASS
L5-TC-07 Twitter/X                PASS
L5-TC-08 Structured Data         PASS
L5-TC-09 Google-facing           N/A (manual, Owner Search Console — không blocking theo spec)
L5-TC-10 URL Variant Matrix      PASS — BLOCKING gate cleared
L5-TC-11 Singleton Tag Audit     PASS — BLOCKING gate cleared
L5-TC-12 Human vs Crawler Diff   PASS (sau fix canonical/og:url)
```

**L5 Exit Gate: ✅ PASS.** Cả 2 BLOCKING gate (TC-10, TC-11) đều cleared bằng evidence thật. 2 gap phát hiện trong quá trình audit (canonical/og:url thiếu ở Human pipeline; X-Robots-Tag thiếu ở private surface) đã **fix + verify + không regression** trước khi đóng gate. **L6 UNLOCKED.**

### Danh sách thay đổi code trong L5 (đầy đủ, theo governance)

| File | Thay đổi | Lý do |
|---|---|---|
| `backend/src/modules/site-seo/site-seo.service.js` | `getPublicEffective()` thêm `canonical_path` (tái dùng `PAGE_KEY_TO_PATH` có sẵn) | Nguồn canonical nhất quán cho client, không tạo bảng mapping mới |
| `User_Web/iflux-web-ui/runtime/bootstrap.js` | `enrichManifestWithSiteSeo()` set `seo.canonical`/`seo['og:url']` (dùng field mới + `IfluxNormalizePath` đã có) | Đóng gap L5-TC-12 — human DOM thiếu canonical/og:url |
| `/etc/nginx/snippets/iflux-prod-app.conf` + `infra/nginx-iflux-production-locations.conf` | 9 location block `/tai-khoan*`, `/tin-nhan*` thêm `add_header X-Robots-Tag "noindex, nofollow" always;` | Đóng gap L5-TC-04 — defense-in-depth cho private surface |
| 25 file HTML entry point (`User_Web/*/index.html` + vài trang lẻ) | Bump `?v=` cho `runtime/bootstrap.js` | Cache-bust bắt buộc sau khi sửa `bootstrap.js` |

Không tạo file/module/abstraction mới. Không có capability song song. Đã deploy Production + purge Cloudflare + verify bằng Chrome thật (không chỉ curl).
