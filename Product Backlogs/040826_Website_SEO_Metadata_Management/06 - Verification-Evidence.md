CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# 06 — Verification Evidence

**Task:** `040826_Website_SEO_Metadata_Management`  
**Doc role:** Verification Evidence — **không** tuyên bố BR PASS / đóng epic.  
**Gate:** Owner mở Wave B · 2026-08-10 ~20:25 +07 (public robots PASS + favicon PASS — Plan §12).  
**Plan:** [`05 - Plan.md`](05%20-%20Plan.md) · PD-10 · §11 · §12.5  
**Probe:** Agent public curl 2026-08-10 (Googlebot + human) · Production `https://iflux.vn`

---

## 0. Wave status

| Wave | Scope (PD-10) | Status |
|------|---------------|--------|
| **A** | Home · Community hub · Article · Stock list · 404/410 · Affiliate variants | **Shipped** (Impl 2026-08-09) · verify matrix §2 |
| **B** | Remaining BR-07 types + gate Verification | **OPENED** 2026-08-10 — evidence §2–§4 |
| **C** | Polish SERP / preview / health | **Chưa mở** |

```text
Owner tắt CF Manage robots.txt
+ favicon PASS
        ↓
Owner: mở Wave B
        ↓
06 Verification-Evidence (file này) — IN PROGRESS
        ↓
Owner acceptance từng BR → mới PASS / Closure
```

---

## 1. Gate prerequisites (đóng blocker §12)

| Check | URL | Result |
|-------|-----|--------|
| Public robots = SEO Platform | `https://iflux.vn/robots.txt` | **PASS** — `Content-Signal: search=yes,ai-train=no,use=reference` · không `# BEGIN Cloudflare Managed content` · GPTBot Allow · `Sitemap: https://iflux.vn/sitemap.xml` |
| Favicon | `https://iflux.vn/favicon.ico` | **PASS** — HTTP 200 `image/webp` (~30KB) |
| Sitemap live | `https://iflux.vn/sitemap.xml` | **PASS** — `application/xml` · **3374** `<loc>` · **3365** articles · **0** `?ref=` |

---

## 2. Live matrix — bot First HTML (Googlebot)

Human SPA: title rỗng rồi JS lấy Thiết lập SEO = **đúng Option A** (đã dọn hardcode). Bot hub = `seo_shell` từ SEO Platform.

| Req ID | URL mẫu | Bot title | Canonical / robots | Verdict |
|--------|---------|-----------|--------------------|---------|
| BR-07.HOME | `/nha-cua-toi` | `iFlux \| Nhà của tôi` | canon self · `noindex,nofollow` (+ X-Robots-Tag) | **PASS** (utility noindex) |
| BR-07.COM | `/cong-dong` | `iFlux \| Cộng đồng chứng khoán` | self · `index,follow` | **PASS** |
| BR-07.ARTICLE | `/cong-dong/bai-viet/goc-nhin-11-08-…-dyj2` | article title + `\| Cộng đồng iFlux` | self canon | **PASS** |
| BR-07.MARKET | `/thi-truong` | `iFlux \| Thị trường chứng khoán` | self · index | **PASS** |
| BR-07.FLOW | `/dong-tien` | `iFlux \| Dòng tiền chứng khoán` | self · index | **PASS** |
| BR-07.MEMBER | `/thanh-vien` | `iFlux \| Membership - Quyền lợi thành viên` | self · index | **PASS** |
| BR-07.FAQ | `/hoi-dap` | `iFlux \| Câu hỏi thường gặp` | self · index | **PASS** |
| BR-07.STATIC | `/goi-cuoc` | `iFlux \| Gói cước Membership` | self · index | **PASS** |
| BR-07.STOCK (list) | `/co-phieu` | `iFlux \| Danh sách cổ phiếu` | self · index | **PASS** |
| BR-07.STOCK (detail) | `/co-phieu/HPG` | `iFlux \| HPG - Công ty Cổ phần Tập đoàn Hòa Phát` | self · index | **PASS** (bot shell + Admin template 2026-08-10) |
| BR-07.SECTOR (list) | `/nganh` | `iFlux \| Ngành chứng khoán` | self · index | **PASS** |
| BR-07.SECTOR (detail) | `/nganh/ngan-hang` | `iFlux \| Ngân hàng` | self · index | **PASS** (bot shell 2026-08-10) |
| BR-07.ECO (list) | `/he-sinh-thai` | `iFlux \| Hệ sinh thái doanh nghiệp` | self · index | **PASS** |
| BR-07.ECO (detail) | `/he-sinh-thai/vingroup` | `iFlux \| Họ Vingroup` | self · index | **PASS** (bot shell 2026-08-10) |
| Stories list | `/cau-chuyen` | `iFlux \| Câu chuyện thị trường` | self · index | **PASS** |
| Stories detail | `/cau-chuyen/dau-tu-cong` | `iFlux \| Đầu tư công` | self · index | **PASS** (bot shell 2026-08-10) |
| BR-07.REDIR | `/home` → `/nha-cua-toi` | shell Nhà của tôi | final `/nha-cua-toi` | **PASS** |
| BR-07.REDIR | `/pricing` → `/goi-cuoc` | shell Gói cước | final `/goi-cuoc` | **PASS** |
| BR-07.REF | `/cong-dong?ref=testverify` | title Clean Cộng đồng | canon Clean · `noindex` + X-Robots-Tag | **PASS** (D-SEO-09) |
| BR-07.WATCH | `/theo-doi` | hardcode `Theo dõi · iFlux` | — | **NOTE** — utility; còn hardcode; index intent TBD |
| BR-07.SEARCH | `/tim-kiem` | hardcode `Tìm kiếm · iFlux` | — | **NOTE** — idem |

---

## 3. BR-07 coverage backlog (Wave B remaining)

| Req ID | Live verify | Gap / next |
|--------|-------------|------------|
| BR-07.AUTHOR | `/cong-dong/tac-gia/cafef` | `iFlux \| CafeF` | self | **PASS** (bot shell 2026-08-10 #3) |
| BR-07.COLL (cat) | `/cong-dong/danh-muc/tin-thi-truong` | `iFlux \| Tin thị trường` | self | **PASS** (bot shell `com-cat`) |
| BR-07.COLL (topic) | `/cong-dong/chu-de/dau-tu-cong` | `iFlux \| Chủ đề Cộng đồng` | self | **PASS** (bot shell `com-topic` — title static theo Admin seed; đổi template trong Thiết lập SEO nếu muốn có tên chủ đề) |
| BR-07.PAGE | Chưa | Pagination SEO policy |
| BR-07.FUTURE | N/A | Pattern only |
| BR-07.404 / .410 | 404: **PASS** sau fix Contract shell 2026-08-10 · 410: policy PARTIAL (xem `09 - Audit`) |
| BR-07.QUERY | UTM → canon Clean · **PASS** (sample) |
| BR-07.PID | `/IFLTEST1/cong-dong` noindex + Clean canon · **PASS** |
| Entity details (STOCK/SECTOR/ECO/STORIES) | **PASS** bot shell 2026-08-10 | Owner #1 DONE · next: #3 AUTHOR/COLL |

**Không** PASS BR tại file này. PARTIAL ≠ FAIL architecture nếu human path đã nối Thiết lập SEO.

---

## 4. Evidence A / B / C (P9 handoff)

### Evidence A — Contract / Index Boundary

- Sitemap eligibility: không `?ref=` trong 3374 locs.
- Decorated `?ref=`: canon Clean + `noindex` (sample Cộng đồng).
- robots.txt AI policy LOCKED (Plan §12.2) trên public.

### Evidence B — Singleton / First HTML hubs

- Hubs có bot shell title từ Foundation page SEO (không hardcode `· iFlux` trên các hub đã dọn).
- Human HTML `<title></title>` rỗng trên hubs đã clean — runtime Admin.

### Evidence C — Foundation consume

- Thiết lập SEO từng trang: đã thêm **Gói cước (`pricing`)** vào selection (2026-08-10).
- Entity templates: `stock-detail` · `sector-detail` · `eco-detail` · `cau-chuyen-detail` đã có trong Admin + seed.

---

## 5. Explicit non-claims

- **Không** BR PASS / epic complete.
- **Không** Wave C.
- Entity detail bot First HTML = **PASS** (Owner #1 · 2026-08-10).
- Utility pages (watch/search) — Owner #2 **không đụng**.
- AUTHOR / COLL — Owner #3 **DONE** 2026-08-10 (bot shell + human IfluxSeoTitle).

---

## 6. Owner quyết định (2026-08-10) — LOCKED

| # | Chủ đề | Quyết định |
|---|--------|------------|
| 1 | Bot shell First HTML cho chi tiết mã / ngành / HST / câu chuyện | **Có làm** (Wave B ngay) |
| 2 | Theo dõi / Tìm kiếm | **Không đụng** |
| 3 | Tác giả / chủ đề / danh mục Cộng đồng | **Có**, làm **sau** entity |

Agent triển khai #1 **DONE** · #3 **DONE** (2026-08-10) · #2 không đụng.
