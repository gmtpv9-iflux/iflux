CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# 10 — Audit OG / Social Preview (READ-ONLY)

**Date:** 2026-08-10 ~21:20 +07  
**Scope:** Social Share / OG Preview regression (Zalo + general)  
**Mode:** READ-ONLY — không sửa code · không sửa config · không purge · không workaround Zalo  
**Status:** **Wave B KHÔNG đóng** · chờ Owner duyệt solution  
**Không dùng làm bằng chứng:** `/api/seo/platform/preview` · `og:title/url` đơn lẻ

**Probe URLs**

| # | Role | URL |
|---|------|-----|
| 1 | Homepage | `https://iflux.vn/` |
| 2 | Community article | `https://iflux.vn/cong-dong/bai-viet/xuat-hien-co-so-nam-o-khu-vuc-rong-80-ha-cua-trung-quoc-dang-am-tham-thay-doi-nganh-nang-luong-toan-cau-6yed` |
| 3 | Indexable hub | `https://iflux.vn/thi-truong` (+ đối chiếu `/cong-dong`) |

**UA dùng:** `Zalo` / `ZaloShare` · `facebookexternalhit/1.1` · `Googlebot` · Human

---

## 0. Kết luận Owner (1 đoạn)

Social preview Zalo fail **không phải** vì Cloudflare chặn image hay Admin thiếu OG mặc định.  
Root cause là **chuỗi delivery First HTML + hình thức `og:image`**:

1. **`/` không có bot `seo_shell`** → mọi crawler (kể cả FB/Googlebot/Zalo) nhận SPA với `<title></title>` và **không có** meta OG.  
2. **Zalo không nằm trong nginx bot UA** của hub → hub trả SPA rỗng meta (trong khi FB/Googlebot nhận shell). Comment nginx **cố ý cấm** Zalo khỏi article `open-graph` pipe.  
3. Khi shell/article **có** `og:image`, giá trị là **path tương đối** `/media/…/*.webp` — **không** `https://iflux.vn/…` → không đạt chuẩn social crawler absolute URL (SEO Contract emit relative; legacy `absoluteAssetUrl` không được dùng trên Contract path).  
4. Image resource **tự nó OK** (HTTP 200, `image/webp`, public, CF HIT/MISS, không cookie/auth). Risk phụ: **chỉ WebP** (PNG sibling public 404).  
5. Title/desc “chậm” trên một số URL = **SPA human path** (title rỗng → JS + `/api/seo/effective`), không phải CDN.

→ Đây **là SEO Platform / nginx delivery regression (và gap homepage)**, **không** phải CF/WAF chặn resource, **không** chỉ “social cache” (cache chỉ là lớp sau khi đã scrape sai/rỗng).

---

## 1. Ma trận First HTML (raw)

Ký hiệu: `∅` = thiếu / rỗng · `SPA` = HTML App Shell + bootstrap · `SHELL` = `@seo_shell_*` · `OG` = article `open-graph` · `SPA+META` = article `spa` nhưng đã inject head SEO server-side.

### 1.1 Homepage `https://iflux.vn/`

| Field | Zalo / ZaloShare | facebookexternalhit | Googlebot | Human |
|-------|------------------|---------------------|-----------|-------|
| HTTP | 200 | 200 | 200 | 200 |
| Pipeline | **SPA** | **SPA** | **SPA** | **SPA** |
| `<title>` | `∅` (`<title></title>`) | `∅` | `∅` | `∅` |
| `meta description` | `∅` | `∅` | `∅` | `∅` |
| `og:title` | `∅` | `∅` | `∅` | `∅` |
| `og:description` | `∅` | `∅` | `∅` | `∅` |
| `og:image` | `∅` | `∅` | `∅` | `∅` |
| `og:url` | `∅` | `∅` | `∅` | `∅` |
| canonical | `∅` | `∅` | `∅` | `∅` |
| robots | `∅` | `∅` | `∅` | `∅` |

**Nginx live:** `location = / { rewrite ^ /User_Web/community/index.html break; … }` — **không** `error_page 418` / `@seo_shell_*`.

Giải thích symptom Owner: Zalo share `/` → không image, không title, không description.

### 1.2 Hub `https://iflux.vn/thi-truong`

| Field | Zalo / ZaloShare | facebookexternalhit / Googlebot | Human |
|-------|------------------|----------------------------------|-------|
| Pipeline | **SPA** (empty meta) | **SHELL** | **SPA** |
| `<title>` | `∅` | `iFlux \| Thị trường chứng khoán` | `∅` |
| description | `∅` | có (Admin effective) | `∅` |
| `og:title` | `∅` | = title | `∅` |
| `og:description` | `∅` | = description | `∅` |
| `og:image` | `∅` | **`/media/community/2026/08/mas_msn0j4fg_957d4531/img-001.webp`** (relative) | `∅` |
| `og:url` | `∅` | `https://iflux.vn/thi-truong` | `∅` |
| canonical | `∅` | `https://iflux.vn/thi-truong` | `∅` |
| robots | `∅` | `index,follow` | `∅` |

`/cong-dong` cùng pattern: Zalo = SPA rỗng · FB/Googlebot = shell + `og:image` relative.

### 1.3 Article (sample trên)

| Field | Zalo / ZaloShare | facebookexternalhit | Googlebot | Human |
|-------|------------------|---------------------|-----------|-------|
| Pipeline | **SPA+META** (bootstrap có) | **OG** (không bootstrap) | **SPA+META** | **SPA+META** |
| `<title>` | title bài + `\| Cộng đồng iFlux` | cùng | cùng | cùng |
| description | có | có | có | có |
| `og:title` / `og:description` / `og:url` / canonical / robots | có / absolute URL sạch | có | có | có |
| `og:image` | **relative** `/media/…/…-003.webp` | **relative** cùng | **relative** | **relative** |

Nginx article (live + repo):

```text
# CẤM khớp Zalo|WhatsApp|FBAN — In-App Browser = Human (không phải crawler).
set $article_pipe spa;
if (UA ~ facebookexternalhit|Facebot|Twitterbot|… ) { open-graph }
# Googlebot article → spa (không open-graph); Zalo → spa
```

**Hệ quả:** Article **có** title/desc/image tags trong First HTML kể cả Zalo — nhưng `og:image` **không absolute** + **webp**. Symptom “mất image mọi nơi” khớp lớp image URL/format hơn là “thiếu tag” trên article.

---

## 2. `og:image` resource (độc lập)

| Check | Hub default OG | Article cover OG |
|-------|----------------|------------------|
| URL probed | `https://iflux.vn/media/community/2026/08/mas_msn0j4fg_957d4531/img-001.webp` | `https://iflux.vn/media/…/…-003.webp` |
| HTTP | **200** | **200** |
| Content-Type | `image/webp` | `image/webp` |
| HTTPS | yes | yes |
| Redirect chain | không | không |
| Public / auth | public · không `Set-Cookie` · không `WWW-Authenticate` | cùng |
| Cloudflare | `server: cloudflare` · `cf-cache-status: HIT/MISS` · không challenge | cùng |
| Sibling PNG public | `…/img-001.original.png` → **404** (file có trên disk storage, không expose cùng path public) | — |

**Verdict image layer:** resource **không** phải root cause “không fetch được”. Root cause nằm ở **meta emit** (relative / thiếu First HTML) + **format WebP** (rủi ro crawler).

---

## 3. Chuỗi ownership (đối chiếu)

```text
Admin SEO Configuration (global defaultOgImageUrl / page og)
    → site-seo-resolver / getPublicEffective  (og_image = "/media/….webp")
    → SEO Contract (seo-contract.js)          image giữ path tương đối
    → head-renderer.js                        emit og:image nếu có image
    → seo_shell / article open-graph|spa      First HTML
    → social crawler đọc First HTML
    → fetch og:image URL
    → Cloudflare/CDN serve /media
```

| Câu hỏi | Trả lời evidence |
|---------|------------------|
| Global OG mặc định có được runtime consume? | **Có** — shell hub/article effective có `og_image` từ Foundation; **không** phải “Admin set mà shell bỏ qua”. |
| Article OG image có resolve/render? | **Có tag** trong First HTML (spa + open-graph) — **FAIL tiêu chuẩn social** vì relative + webp. |
| `og:image` trong First HTML hay chỉ sau JS? | Hub bot shell / article: **trong First HTML**. Home `/` + hub Zalo: **không có** (SPA). Human hub/home: title/OG sau JS. |
| Vì sao title/desc một số URL chậm? | SPA `<title></title>` → client `IfluxSeoTitle` + `/api/seo/effective` — latency API/JS, **không** CF HTML cache miss cho bot shell. |
| Regression SEO gần đây? | **Có tín hiệu regression kiến trúc:** Contract + head-renderer emit relative; legacy `absoluteAssetUrl` (community-articles.service) **không** còn là authority trên Contract path. Homepage `/` **chưa bao giờ** gắn `seo_shell` trong nginx hiện tại. Zalo **cố ý** loại khỏi crawler list. |

---

## 4. Phân loại nguyên nhân

| # | Root cause | Affected layer | SEO Platform regression? | CF/CDN? | Image URL/resource? | Social crawler/cache? |
|---|------------|----------------|--------------------------|---------|---------------------|------------------------|
| **RC-1** | `/` không `seo_shell` → First HTML rỗng SEO/OG cho **mọi** bot | Nginx routing | Gap coverage (homepage) trong đợt bot-shell | Không (CF chỉ proxy SPA) | N/A (không có tag) | Cache chỉ phản ánh scrape rỗng |
| **RC-2** | Zalo **không** match bot UA hub; article **cấm** Zalo → `open-graph` | Nginx UA gate | Policy/delivery (cố ý + thiếu Zalo trên hub) | Không | N/A trên hub Zalo | Có thể giữ preview cũ sau khi đã scrape SPA |
| **RC-3** | `og:image` = **relative** `/media/…` | SEO Contract → head-renderer | **Có** — Contract path không absolutize (SoT Solution Design yêu cầu absolute cho identity URL; social image phải absolute để crawler) | Không | **Emit sai** (resource 200 nếu absolutize đúng) | Secondary |
| **RC-4** | `og:image` **WebP-only**; PNG public 404 | Media + SEO asset policy | Partial (chọn webp cho OG) | Không block | Format risk cho Zalo/FB | Secondary |

**Không phải:** CF Managed robots · WAF challenge trên probe · cookie gate image · Admin không có default OG · `/api/seo/platform/preview` “fail”.

---

## 5. Recommended solution (chờ Owner duyệt — **chưa thi công**)

### Option A — Minimum fix (khuyến nghị để khôi phục share)

1. **Absolutize `og:image` / `twitter:image` / `og:image:secure_url`** tại Contract hoặc `head-renderer` với `https://iflux.vn` (reuse tinh thần `absoluteAssetUrl`).  
2. **Gắn `seo_shell` cho `location = /`** (pageKey = community hoặc homepage key Owner chốt — hiện `/` rewrite community SPA).  
3. **Thêm Zalo crawler UA** (`ZaloShare`, pattern Zalobot/Zalo nếu Owner chốt) vào:
   - hub `return 418` bot list, **và**
   - article `$article_pipe open-graph` (đảo policy comment “CẤM Zalo” — Owner phải chốt: Share crawler ≠ In-App Browser).  
4. Sau deploy: **re-scrape Zalo/FB** (không purge CF làm thay preview Zalo).

### Option B — A + social-safe image

5. Policy OG image: ưu tiên **JPEG/PNG absolute** cho social (hoặc derive từ `.original.*` public), WebP giữ cho UI.  
6. Health/check: fail nếu `og:image` không `^https://`.

### Option C — không làm (không khuyến nghị)

Giữ nguyên · chấp nhận Zalo/home broken · chỉ dựa social cache thủ công.

---

## 6. Exact files / configs cần sửa (khi Owner approve)

| File / config | Việc |
|---------------|------|
| `infra/nginx-iflux-production-locations.conf` | `location = /` → bot `418` + `@seo_shell_…`; thêm Zalo UA vào hub list + article open-graph list (nếu Owner chốt) |
| Live nginx snippet | `/etc/nginx/snippets/iflux-prod-app.conf` (đồng bộ như mọi đợt trước) |
| `backend/src/modules/seo-platform/seo-contract.js` | Absolutize `social.og.image` / twitter image / assets.ogImageUrl |
| `backend/src/modules/seo-platform/head-renderer.js` | Defense-in-depth: absolutize trước emit (nếu không làm ở contract) |
| `backend/src/modules/community/community-articles.service.js` | Chỉ tham chiếu — `absoluteAssetUrl` đã có; Contract phải gọi / thay thế authority |
| Admin SEO global/page | Không bắt buộc nếu default đã có; chỉ nếu Owner muốn đổi asset sang PNG/JPG |
| Media public route | Nếu chọn Option B: expose/serve original PNG/JPEG cho OG |

**Không đụng:** Cloudflare purge làm “fix Zalo” · fake preview API · hardcode title trong SPA song song shell.

---

## 7. Impact lên Wave B / BR-15…16

| Trước | Sau audit này |
|-------|----------------|
| `09` ghi BR-15…16 **PASS** vì `og:title/url` | **RÚT** — thiếu bằng chứng `og:image` social-valid |
| Wave B | **VẪN MỞ** — không đóng tới khi Owner phân loại + duyệt fix OG |

---

## 8. Owner quyết định cần chốt

1. Accept phân loại RC-1…RC-4?  
2. Chọn Option **A** / **B** / **C**?  
3. Homepage `/`: shell theo **community** hay pageKey riêng?  
4. Zalo: coi là **social crawler** (open-graph/shell) hay giữ **Human-only** (như comment hiện tại)?  
5. OG image format: giữ WebP absolute hay bắt JPEG/PNG?

**STOP — chờ Owner duyệt. Không implement.**
