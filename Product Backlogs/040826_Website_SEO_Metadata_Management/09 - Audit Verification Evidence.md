CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

tự # 09 — Audit Verification Evidence (Wave B close-check)

**Task:** `040826_Website_SEO_Metadata_Management`  
**Date:** 2026-08-10 ~20:55 +07  
**Role:** Audit + live evidence — **không** tuyên bố epic BR PASS / Closure trừ khi Owner accept từng cụm.  
**Probe:** Production `https://iflux.vn` · Googlebot + human · API Contract/Health  
**Fixes cùng đợt (vết loang):** sitemap `/goi-cuoc` + hub `/cau-chuyen` · article **404** Contract shell + `X-Robots-Tag`/`meta robots` noindex.

---

## 0. Verdict tổng

| | |
|--|--|
| **Có thể claim “toàn bộ BR DONE”?** | **Không.** Core SEO Platform + coverage Wave A/B indexable **PASS có bằng chứng**. Một số BR **PARTIAL / N/A / OUT_OF_SCOPE Owner**. |
| **Wave B gate (robots + favicon)?** | **PASS** |
| **Sau fix loang tối nay** | Sitemap pricing **PASS** · Article 404 SEO-coherent **PASS** |
| **Đóng epic?** | Chỉ khi Owner accept residual (§3) hoặc mở Wave C / phase riêng |
| **Wave B đóng?** | **Chưa.** Owner chưa accept residual · **OG/Social preview chưa phân loại xong trước audit `10`** |
| **BR-15…16 OG?** | **KHÔNG PASS** — `og:title/url` ≠ bằng chứng social preview · xem [`10 - Audit OG Social Preview Evidence.md`](10%20-%20Audit%20OG%20Social%20Preview%20Evidence.md) |

```text
PASS evidence (hubs/entities/affiliate/discovery/health)
        +
PARTIAL / N/A / Owner-lock residual (§3)
        ≠
“100% BR DONE”
```

---

## 1. Discovery & Foundation (BR-03…05 · BR-13…14 · SC)

| Check | Evidence | Verdict |
|-------|----------|---------|
| robots.txt SEO Platform | `Content-Signal: search=yes,ai-train=no,use=reference` · không CF Managed · GPTBot Allow · Sitemap pointer | **PASS** |
| favicon.ico | HTTP 200 `image/webp` ~32KB | **PASS** |
| sitemap.xml | XML live · **0** `?ref=` · hubs + articles | **PASS** |
| sitemap có `/goi-cuoc` | Trước audit: **thiếu** → loang từ seed pricing · **đã fix** `SITEMAP_STATIC` + verify origin `<loc>https://iflux.vn/goi-cuoc</loc>` | **PASS** (sau fix) |
| sitemap hub câu chuyện | Đổi `/chu-de` → `/cau-chuyen` trong static list · origin có `<loc>…/cau-chuyen</loc>` | **PASS** (sau fix) |
| `/api/seo/effective?pageKey=community` | title Admin | **PASS** |
| stock template resolve | `title_template` + resolved title với vars | **PASS** |

---

## 2. Coverage BR-07 — bot First HTML (bằng chứng title)

| Req ID | URL | Bot title / signal | Verdict |
|--------|-----|--------------------|---------|
| HOME | `/nha-cua-toi` | `iFlux \| Nhà của tôi` · noindex | **PASS** (utility) |
| COM | `/cong-dong` | `iFlux \| Cộng đồng chứng khoán` · index | **PASS** |
| ARTICLE | `/cong-dong/bai-viet/…` | title bài + `\| Cộng đồng iFlux` · canon self | **PASS** |
| MARKET / FLOW / MEMBER / FAQ | hubs | Admin titles · index | **PASS** |
| STATIC | `/goi-cuoc` | `iFlux \| Gói cước Membership` | **PASS** |
| STOCK list + detail | `/co-phieu` · `/co-phieu/HPG` | list + `iFlux \| HPG - …` | **PASS** |
| SECTOR / ECO / STORIES detail | ngan-hang · vingroup · dau-tu-cong | Admin templates | **PASS** |
| AUTHOR / COLL | tac-gia/cafef · danh-muc · chu-de | CafeF · Tin thị trường · Chủ đề Cộng đồng | **PASS** |
| REDIR | `/home` → `/nha-cua-toi` | final + shell | **PASS** |
| REF | `/cong-dong?ref=…` | canon Clean · **noindex** + X-Robots-Tag · og:url Clean | **PASS** |
| PID | `/IFLTEST1/cong-dong` | X-Robots-Tag noindex · canon `https://iflux.vn/cong-dong` | **PASS** |
| QUERY (UTM) | `/cong-dong?utm_source=audit` | canon Clean · index (UTM không phải Affiliate) | **PASS** (policy: Clean identity) |
| 404 | missing article | HTTP **404** · title `Không tìm thấy · iFlux` · **meta robots noindex** · **X-Robots-Tag** (sau fix) | **PASS** |
| 410 | — | Contract `httpStatus=410` → noindex · không sitemap (API) · **chưa có emitter sản phẩm 410** | **PARTIAL** (policy PASS · runtime emitter N/A) |
| TAG | `/community/tag/foo` | **301** → `/cau-chuyen/foo` | **PASS** (redirect coverage; không tag SEO page riêng) |
| WATCH / SEARCH | `/theo-doi` · `/tim-kiem` | hardcode `· iFlux` | **OUT_OF_SCOPE** — Owner #2 **không đụng** |
| PAGE | pagination SEO | không engine riêng | **N/A / GAP** — chưa có URL paginated SEO bắt buộc trên Prod |
| FUTURE | future entity | pattern only | **N/A** |

---

## 3. Residual — chưa “DONE” (Owner quyết)

| ID | Vấn đề | Đề xuất |
|----|--------|---------|
| BR-07.WATCH / SEARCH | Hardcode title; không shell | Giữ theo Owner lock **hoặc** mở phase noindex + SEO |
| BR-07.410 | Chỉ policy Contract | Emit 410 khi có nghiệp vụ “gone” (article archived?) |
| BR-07.PAGE | Pagination SEO | Chỉ mở khi Product có page `?page=` indexable |
| BR-30 / SC-18 | VERSION/rollback UX | Gap Foundation P8 (`inspect.gaps.rollbackUx=false`) — phase riêng |
| BR-22 / SC-09 | Breadcrumb | Contract field — cần sample UI evidence Wave C |
| BR-18 / SC-10 | Image ALT governance sâu | Wave C polish |
| BR-27 | Multi-language | Readiness only — chưa locale routes |
| BR-36 SERP icon cache | Google cache ngoài control | Process audit khi SERP lệch |
| HOME JSON-LD | Bot HOME không ld+json (noindex utility) | Chấp nhận hoặc bổ sung WebSite SD Wave C |

---

## 4. Platform BR clusters (Contract / Rule / Affiliate)

| Cluster | Evidence | Verdict |
|---------|----------|---------|
| BR-01…02 Auto + field ownership | Entity templates + Admin override + `title_template` public | **PASS** (core) |
| BR-06 Contract + HTTP | `/api/seo/platform/contract` · 200/404/410 classes · REF variant | **PASS** |
| BR-08…09 Dynamic templates | stock/sector/eco/author/story shells resolve Admin VI | **PASS** |
| BR-10 Conflict + Health | `/health?path=/cong-dong` → `status=OK` · `coherent=true` · 0 issues | **PASS** (sample) |
| BR-11…12 Canonical + edge | Clean canon trên REF/PID/UTM | **PASS** |
| BR-15…16 OG/Twitter | Trước: chỉ `og:title/url` · **rút** — thiếu `og:image` absolute + Zalo/home First HTML | **NOT PASS** → [`10`](10%20-%20Audit%20OG%20Social%20Preview%20Evidence.md) |
| BR-21 SD | Hubs/entities `ld+json` (trừ một số noindex) | **PASS** (phần lớn) |
| BR-25 Redirect | English→VI · tag→cau-chuyen · home→nha-cua-toi | **PASS** |
| BR-28 Preview | `/api/seo/platform/preview` has preview | **PASS** |
| BR-29 Health / singleton | Health OK; singleton detector wired | **PASS** (API) |
| BR-32…33 CMS + RBAC | Thiết lập SEO Admin + perms Foundation | **PASS** (consume) |
| BR-34 Singleton SoT | Bot shell / article Contract head; hardcode đã dọn Option A | **PASS** (indexable scope) |
| BR-35 Human vs bot | Human title rỗng → JS Admin; bot shell First HTML | **PASS** (design Option A) |
| BR-45 Affiliate boundary | REF + PID evidence §2 | **PASS** |
| BR-30 Versioning / Rollback | inspect gaps false | **PARTIAL** |
| BR-48 NFR | Determinism/obs via inspect chain | **PASS** (core) / rollback **PARTIAL** |

---

## 5. Vết loang đã xử lý trong audit này

| Loang | Root cause | Fix | Verify |
|-------|------------|-----|--------|
| Sitemap không có Gói cước dù SEO + bot shell đã ship | `SITEMAP_STATIC` quên `pricing` khi thêm `/goi-cuoc` | Thêm `{ pageKey:'pricing', path:'/goi-cuoc' }` | origin sitemap có loc |
| Hub câu chuyện trong sitemap là `/chu-de` (alias) | Static list cũ | Đổi path → `/cau-chuyen` | origin loc `/cau-chuyen` |
| Article 404 HTML hardcode không noindex | Pipeline spa/OG early return string | `renderHttpErrorShell(httpStatus:404)` + X-Robots-Tag | curl missing slug → 404 + robots noindex |

**Files:** `seo-platform.service.js` · `community.routes.js` · deploy Production · `pm2 restart iflux-api`.

---

## 6. Explicit non-claims

- **Không** “100% BR DONE / epic CLOSED”.
- **Không** PASS WATCH/SEARCH (Owner #2).
- **Không** claim Google SERP icon / ranking outcomes (BR-36 process).
- Wave C (SERP polish / preview UX) **chưa mở**.

---

## 7. Owner — chọn hướng đóng

1. **Accept residual §3** → coi Wave B Verification **đủ đóng phase** · residual backlog tách task.  
2. **Mở tiếp** WATCH/SEARCH noindex · hoặc 410 emitter · hoặc VERSION/rollback · hoặc Wave C.  
3. Giữ epic **OPEN** đến khi tick từng Req ID trên Matrix §2–§4.

---

## 8. Evidence artifacts

| Artifact | Path |
|----------|------|
| Live probe dump | `Product Backlogs/040826_Website_SEO_Metadata_Management/.tmp-audit-probe.json` |
| Wave B log | [`06 - Verification-Evidence.md`](06%20-%20Verification-Evidence.md) |
| OG / Social Preview audit (READ-ONLY) | [`10 - Audit OG Social Preview Evidence.md`](10%20-%20Audit%20OG%20Social%20Preview%20Evidence.md) |
| Plan gate | [`05 - Plan.md`](05%20-%20Plan.md) §12 |
