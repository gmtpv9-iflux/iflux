# 06 — Verification Evidence A/B/C · BR-CAL-01…16

| | |
|--|--|
| **Task** | [`00-README.md`](00-README.md) |
| **BRD** | [`01-BRD.md`](01-BRD.md) |
| **Date verified** | 2026-08-08 (UTC+7) |
| **Environment** | Production · `https://iflux.vn/cong-dong` |
| **Governance** | Product Backlogs README §3.0 — ba lớp A/B/C; cấm soft-pass |
| **Verdict tổng** | **14 PASS · 2 PARTIAL · 0 FAIL** — chưa Final Acceptance (BR-04, BR-11 còn gap chữ BRD) |

---

## 0. Cách lấy bằng chứng (reproduce)

| Lớp | Cách làm (session này) |
|-----|------------------------|
| **A — Static** | `rg`/đọc repo local + `grep` webroot Production `/var/www/iflux/production/...` và backend `/var/iflux/backend/...` |
| **B — Database** | SSH origin (`infra/staging/staging.env`) → `sudo -u postgres psql -d iflux` |
| **C — Runtime** | `curl`/`python` API `https://iflux.vn/api/community/feed` · Chrome headless CDP dump DOM · leave/re-enter sentinel · Emulation viewport |

**Artifact snapshot (không chứa IP/credential):**

- DOM dump: `.tmp/cal-verify-dom.html`
- Bundle live: `community-daily-feed.js?v=calFeedFix20260808` → HTTP 200
- Category UUID dùng probe: Tin thị trường = `354fd55b-6800-4273-8b16-3a96d2a6739a`

---

## 1. Shared evidence (tham chiếu nhiều BR)

### A — Static (shared)

| Ref | Evidence |
|-----|----------|
| A-S1 | `User_Web/iflux-web-ui/community-daily-feed.js` L6–8: `FEED_PAGE_SIZE=50`, `BATCH_A=5`, `BATCH_B=6` |
| A-S2 | Cùng file L51–80: `sectionAHtml` / `sectionBHtml` · `data-ifx-com-section="A"|"B"` · không empty placeholder |
| A-S3 | Cùng file L232–255 `composeOneBatch` · L357–409 `loadNextBatch` + `IntersectionObserver` · L189 `batchLoading` · L182 `generation` |
| A-S4 | `community-page.js` L5 `FILTER_ALL='ALL'` · L314–315 tab «Tất cả» · L508–517 `IfluxDailyFeed.mount` · **0** match `loadNewsPage` |
| A-S5 | `iflux-community-api-bridge.js` L11 `FEED_PAGE_SIZE=50` · offset/has_more |
| A-S6 | `backend/.../community-feed.service.js` L198 `ORDER BY COALESCE(...)` · L330–366 L+1 → `has_more` |
| A-S7 | `community.css` L1715–1717 hero `1fr 1fr` · L1768–1770 grid `repeat(3,…)` · L2008–2022 media ≤1024/≤768 |
| A-S8 | Production webroot khớp: `BATCH_A` L7 · `has_more` L311 · `community-page.js` `loadNewsPage` count **0** |
| A-S9 | [`02-Mandatory-Audit.md`](02-Mandatory-Audit.md) Root Cause khóa (limit=36 hydrate + Day Reveal ≠ progressive API) |

### B — Database (shared)

| Ref | Query / result |
|-----|----------------|
| B-D1 | `community_posts` status `published`/`published_rss` → **3048** rows |
| B-D2 | `community_categories` `is_featured=true AND is_visible=true` → **4** (Tin thị trường, Doanh nghiệp, Kinh tế vĩ mô, Phân tích & Nhận định) |
| B-D3 | Posts mapped Tin thị trường (payload category) → **443** |

### C — Runtime (shared)

| Ref | Evidence |
|-----|----------|
| C-R1 | `GET /api/community/feed?limit=50&offset=0` → HTTP 200 · `data.has_more=true` · `data.total=50` (page length, không phải COUNT) · 50 cards |
| C-R2 | `offset=50` → 50 cards · overlap id với page0 = **0** · `has_more=true` |
| C-R3 | `category_id=354fd55b-…` offset 0/50 → 50+50 · overlap **0** · mọi card `category_id` khớp · offset 400 → 43 · `has_more=false` · offset 450 → 0 |
| C-R4 | Headless DOM `/cong-dong`: tab «Tất cả» active · 4 featured tabs · `calFeedFix20260808` loaded · `ifx-com-side-empty` **absent** |
| C-R5 | Section counts: mỗi A = **5** (1 featured + 4 compact) · mỗi B = **6** · sequence `AB…` |
| C-R6 | CDP state trên `[data-ifx-com-daily-feed]._ifxFeed`: `composed/buffer/hasMore` |
| C-R7 | Leave→re-enter sentinel: `composed` 22→33→44→55→66 · `secs` `AB`×N · `uniq===arts` · feed network `offset=0` rồi `offset=50` |
| C-R8 | Đổi tab Tin thị trường: `activeId` UUID · first3 slug khác ALL · slug overlap với ALL = **0** · vẫn `ABAB` |
| C-R9 | Viewport: mobile 390 `overflowX=false` grid 1 col · tablet 900 grid 3 col · desktop probe `overflowX=false` |

---

## 2. Checklist từng BR (atomic)

| BR | Requirement (tóm tắt) | Evidence A | Evidence B | Evidence C | Gap | Status |
|----|----------------------|------------|------------|------------|-----|--------|
| **BR-CAL-01** | Section A đủ data: 5 = 1 large + 4 small | **OK** A-S1/A-S2 | **N/A** (layout presentation) | **OK** C-R5 mỗi A: n=5, feat=1, compact=4 | — | **PASS** |
| **BR-CAL-02** | Section B đủ data: 6 · lưới 3×2 | **OK** A-S1/A-S2/A-S7 | **N/A** | **OK** C-R5 B n=6 · C-R9 tablet `grid` 3 tracks | Desktop headless mặc định hẹp → computed 1 track; ≥900px = 3 col | **PASS** |
| **BR-CAL-03** | Sequence cố định A→B→A→B… | **OK** A-S3 compose A rồi B | **N/A** | **OK** C-R7 `secs` luôn `AB` lặp | — | **PASS** |
| **BR-CAL-04** | Initial = đúng A+B (=11) | **OK** `resetAndInitial` compose 1 batch | **OK** B-D1 ≫ 11 | **PARTIAL** C-R6/C-R7 lần sẵn sàng đầu = **22** (`ABAB`) vì sentinel đã intersecting → IO nổ batch 2 trước tương tác user | Chưa chứng minh “đúng 11 bài” trên first paint khi sentinel trong viewport | **PARTIAL** |
| **BR-CAL-05** | Progressive lazy: mỗi batch A+B; dừng khi hết data | **OK** A-S3 | **OK** B-D1/B-D3 còn data sau page đầu | **OK** C-R7 22→66 · API page2 `offset=50` · C-R3 `has_more=false` khi hết | Scroll một chiều liên tục không leave viewport có thể không re-fire IO (cần leave/re-enter) — vẫn chứng minh được progressive khi sentinel cắt ngưỡng lại | **PASS** |
| **BR-CAL-06** | Không artificial total hard limit UI | **OK** A-S1/A-S4/A-S8 không cap 36; page size 50 | **OK** B-D1 **3048** ≫ 36 | **OK** C-R1/C-R2/C-R7 vượt 36 bài trên UI+API | — | **PASS** |
| **BR-CAL-07** | Featured filter chỉ lọc dataset; common composer | **OK** A-S4 tabs + `listFilterParams` | **OK** B-D2 4 featured | **OK** C-R4 tabs · C-R3/C-R8 filter đúng | — | **PASS** |
| **BR-CAL-08** | Không layout/renderer riêng theo category | **OK** một `IfluxDailyFeed` / sectionA/B | **N/A** | **OK** C-R8 sau đổi cat vẫn `data-ifx-com-section` A/B cùng pattern | — | **PASS** |
| **BR-CAL-09** | Đổi category: reset state + A+B mới; không leakage | **OK** A-S3 `generation` · remount mountDailyFeed | **N/A** | **OK** C-R8 overlap slug ALL↔cat = **0** · activeId đổi · sequence reset `AB…` | — | **PASS** |
| **BR-CAL-10** | Tab/state **Tất cả** (`ALL`) | **OK** A-S4 `FILTER_ALL` + label «Tất cả» | **N/A** | **OK** C-R4/C-R8 `activeId=ALL` mặc định; quay lại ALL khôi phục first3 ALL | — | **PASS** |
| **BR-CAL-11** | Partial section: không empty/placeholder phá grid | **OK** A-S2 comment + không render side rỗng / không `side-empty` | **N/A** (không có featured cat <5 bài để buộc partial) | **NOT EVIDENCED** chưa ép UI với buffer &lt;5 trên Production | Thiếu runtime partial-section | **PARTIAL** |
| **BR-CAL-12** | Responsive; append không phá section cũ | **OK** A-S7 | **N/A** | **OK** C-R9 `overflowX=false` · mobile 1col · tablet 3col · C-R7 append thêm section, section cũ giữ n=5/6 | Visual pixel-perfect không chụp ảnh | **PASS** |
| **BR-CAL-13** | Ownership đã Audit; không global CSS regression ngoài scope | **OK** A-S9 Audit + đổi file đúng owner DailyFeed/Page/ApiBridge/BE feed | **N/A** | **OK** C-R4 bundle pin `calFeedFix` / `community.css?v=cssPin20260808` | Regression toàn site ngoài `/cong-dong` không full crawl | **PASS** |
| **BR-CAL-14** | Reuse hiện hữu; không duplicate mechanism | **OK** A-S4 DELETE legacy `loadNewsPage` · reuse `.ifx-com-hero` / `.ifx-com-feed-grid` | **N/A** | **OK** C-R4 không `side-empty` · một `[data-ifx-daily]` | — | **PASS** |
| **BR-CAL-15** | Mandatory Audit trước SoT/Solution/Code | **OK** A-S9 file Audit + RC khóa BR-CAL-15/AC-13 | **OK** Audit đã dùng count/API (B-D1 khớp hướng “còn data”) | **N/A** (deliverable tài liệu, không phải runtime feature) | — | **PASS** |
| **BR-CAL-16** | NFR: không load-all · no infinite loop · no dup · isolation · error không phá list | **OK** A-S3 `batchLoading`/`acquiring`/`generation`/`emptyAcquireStreak` · error retry UI | **N/A** | **OK** C-R7 `uniq===arts` · chỉ 2 request feed cho 66 bài · C-R8 isolation cat · sentinel idle «Cuộn để xem thêm» (không kẹt spinner) · error node `[data-ifx-daily-error]` present hidden | Loop vô hạn không quan sát được trong probe | **PASS** |

---

## 3. Acceptance Criteria map (AC ↔ evidence)

| AC | BR | Status |
|----|-----|--------|
| AC-01 | BR-CAL-01 | PASS |
| AC-02 | BR-CAL-02 | PASS |
| AC-03 | BR-CAL-04 | **PARTIAL** (first paint thường 22 khi sentinel in-view) |
| AC-04 | BR-CAL-05 | PASS |
| AC-05 | BR-CAL-06 | PASS |
| AC-06 | BR-CAL-07 | PASS |
| AC-07 | BR-CAL-05+07 | PASS |
| AC-08 | BR-CAL-09 | PASS |
| AC-09 | BR-CAL-09 | PASS |
| AC-10 | BR-CAL-11 | **PARTIAL** (A only) |
| AC-11 | BR-CAL-12 | PASS |
| AC-12 | BR-CAL-13+14 | PASS |
| AC-13 | BR-CAL-15 | PASS |

---

## 4. Gap đóng trước Final Acceptance

1. **BR-CAL-04 / AC-03** — Chốt Product: (a) chấp nhận “initial ≥ A+B khi IO auto-fire” hay (b) chặn compose batch 2 đến khi user scroll thật (sentinel không observe cho đến sau first paint / `root` khác).
2. **BR-CAL-11 / AC-10** — Runtime: mount filter/category có &lt;5 bài (hoặc stub) và chụp DOM không có placeholder/`side-empty`.

---

## 5. Quyết định đề xuất

| Hạng mục | Đề xuất |
|----------|---------|
| Impl WP-0…7 | Đã ship Production — **có bằng chứng vận hành** |
| Final Acceptance task | **CHƯA** — còn 2 PARTIAL |
| Soft-pass | **Không** — hai PARTIAL ghi rõ thiếu chữ BRD |

---

*Generated from live Production probes 2026-08-08. Không thay thế Owner sign-off.*
