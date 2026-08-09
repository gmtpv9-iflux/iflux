# 02 — Mandatory Audit

# Community Article List · Category Filter · Progressive Lazy Load

| | |
|--|--|
| **Task ID** | `080826_Community_Article_List_Category_LazyLoad` |
| **BRD** | [`01-BRD.md`](01-BRD.md) |
| **Document** | Mandatory Audit — sinh từ **BR Checklist** `BR-CAL-01`…`BR-CAL-16` |
| **Date** | 2026-08-08 |
| **Evidence** | Repo local + Production API `https://iflux.vn/api/community/*` |
| **Audit status** | ✅ **OWNER APPROVED** (2026-08-08) — reviewer lock-in dưới đây |
| **Implementation** | ❌ **NOT AUTHORIZED** (cấm code đến khi Solution & Plan khóa) |
| **Next gate** | [`03-SoT.md`](03-SoT.md) → Solution & Plan → Implementation |

> Audit trả lời: **hiện trạng đối với từng BR là gì?**  
> Audit **không** thay đổi requirement BRD và **không** đề xuất Solution chi tiết (chỉ ghi gap / dependency).

### Owner / Reviewer lock-in (post-Audit)

1. Category Filter = **constraint của Feed** (Feed Query Context), **không** renderer/layout riêng theo tab.
2. `Tất cả` = Filter State hợp lệ (`ALL`), cùng Composer + Progressive Acquisition.
3. Unit progressive load = **Batch = Section A + Section B** (không lazy theo ngày).
4. Partial data: Composer lấy tối đa 5 rồi tối đa 6; **cấm** placeholder ép đủ 11 (`ifx-com-side-empty` kiểu chiếm chỗ = trái BR-CAL-11).
5. Audit finding `total = cards.length` **giữ nguyên là hiện trạng** — **không** tự khóa ở SoT rằng phải đổi `total` thành COUNT; End-of-Data Authority do SoT khóa semantics, Solution chọn contract.
6. **Chưa implement** (limit / offset / DailyFeed / ALL tab / composer / CSS / dead code) trước SoT + Solution.

---

## Executive Verdict

| # | Finding | Severity | BR chính |
|---|---------|----------|----------|
| V1 | **Hard cap dữ liệu trên FE = 36**: hydrate + category reload chỉ gọi `loadFeed({ limit: 36 })` một lần; scroll **không** gọi API `offset` tiếp | 🔴 Critical | BR-CAL-05, 06, 15 |
| V2 | **Lazy-load hiện hữu ≠ progressive data acquisition**: `IfluxDailyFeed` chỉ reveal thêm **ngày lịch** từ Store đã hydrate; hết ngày trong Store → dừng dù API còn bài | 🔴 Critical | BR-CAL-05, 15 |
| V3 | **Section composition ≠ BRD A/B**: một `heroGridSection`/ngày = 1 featured + ≤4 side + **toàn bộ phần còn lại** trong grid 3 cột — không sequence A(5)→B(6)→… | 🔴 Critical | BR-CAL-01…04 |
| V4 | Backend `GET /community/feed` **có** `limit`/`offset` và còn dữ liệu sau offset 36/50…; `total` response = `cards.length` (**không** phải COUNT tổng) | 🟠 High | BR-CAL-06, 15 |
| V5 | Backend clamp `limit` ≤ **50**/request — hợp lệ cho batch; **không** phải root cause dừng UI ở 36 | 🟡 Medium | BR-CAL-06 |
| V6 | Category tabs nổi bật **có** · lọc UUID · common DailyFeed renderer · **không** có tab **Tất cả** · default = category nổi bật đầu | 🟠 High | BR-CAL-07, 10 |
| V7 | Category switch: `replace: true` + remount DailyFeed — **không leakage** dataset cũ; nhưng vẫn hard-cap 36 và không progressive API | 🟡 Medium | BR-CAL-09 |
| V8 | Partial section: khi thiếu tin side → HTML placeholder `ifx-com-side-empty` («Chưa có tin khác…») | 🟠 High | BR-CAL-11 |
| V9 | Legacy infinite scroll (`loadNewsPage` / `bindInfiniteScroll`, NEWS_HERO=5 / NEWS_PAGE=6) **còn trong file nhưng dead** — shell không còn `[data-ifx-com-news-grid]`; `bindInfiniteScroll` **không được gọi** | 🟠 High | BR-CAL-14, 15 |
| V10 | Ownership: card/section CSS trong `community.css` (DS User Web); tabs `.ix-tabs` (Admin UI đã load). Có vài hardcode px/rgba trong `community.css` (ngoài scope sửa lúc Audit) | Info | BR-CAL-13 |

### Root Cause (khóa — AC-13 / BR-CAL-15)

```text
Nguyên nhân giới hạn số bài trên /cong-dong hiện tại
KHÔNG phải vì DB hết bài, cũng không phải vì API không hỗ trợ offset.

Root cause chính (chuỗi):
1) Data Provider / Page chỉ hydrate Store một lần với limit=36 (replace).
2) Daily Feed lazy-load chỉ render tuần tự các “ngày” đã có trong Store — không fetch batch tiếp.
3) Khi hết ngày trong 36 bài đã load → UI báo hết, dù API offset tiếp vẫn trả cards.

Lazy-load “có tồn tại” ở IfluxDailyFeed.bindScroll → renderNextDay,
nhưng là Day Reveal Lazy UI, không phải Progressive Article Acquisition theo BRD.
```

---

## Trace Map (Current Flow)

```text
[WGT-COM-PAGE] loadFeed({ limit: 36 })
        ↓
IfluxCommunityApiBridge → GET /api/community/feed?limit=36&offset=0
        ↓
IfluxCommunityStore.setFeed(cards, replace)
        ↓
community-page boot → renderShell → IfluxDailyFeed.mount(filter)
        ↓
(optional) Featured tabs → loadFeed({ limit: 36, category_id, replace:true })
        ↓ remount DailyFeed
buildDays(filter) từ Store.getPosts  →  s.days[]
        ↓
Initial: renderNextDay × 1  (1 calendar day block)
        ↓ scroll gần [data-ifx-daily-more]
renderNextDay tiếp  (ngày kế trong s.days)  —— KHÔNG gọi API
        ↓
s.rendered >= s.days.length → "Đã xem hết…"
```

**Dead path (không chạy trên shell hiện tại):**

```text
loadNewsPage / bindInfiniteScroll / [data-ifx-com-news-grid]
→ ensureMounts() = false vì DOM không có news-grid
→ bindInfiniteScroll không được boot() gọi
```

---

# 1. Audit Checklist (sinh từ BR Checklist — form README §2.3)

> **Status** = kết luận hiện trạng vs BR (`MATCH` / `PARTIAL` / `GAP`), kèm audit row đã thu thập evidence.  
> **Không** = Implementation DONE. Evidence A/B/C theo README §3.0; `N/A` khi lớp không áp dụng cho check hiện trạng.

| BR | BR Requirement | Audit ID | Audit Check | Required Evidence A (Static) | Required Evidence B (DB) | Required Evidence C (Runtime) | Current vs BR | Status |
|----|----------------|----------|-------------|------------------------------|--------------------------|-------------------------------|---------------|--------|
| BR-CAL-01 | Section A = 5 · 1×6/12 + 4 small | AUD-CAL-01 | Có section đúng 5 bài tách biệt A không? | A: `heroGridSection` + `.ifx-com-hero` | B: N/A (layout) | C: N/A tại Audit (layout BRD chưa có trên Prod) | **GAP** — 1+≤4 rồi đổ rest vào grid cùng section | GAP |
| BR-CAL-02 | Section B = 6 · 3×2 · 4/12 | AUD-CAL-02 | Có section đúng 6 bài 3×2 không? | A: `.ifx-com-feed-grid` = 3 cột, chứa rest | B: N/A | C: N/A tại Audit | **GAP** — grid = phần dư ngày, không B cố định 6 | GAP |
| BR-CAL-03 | Sequence A→B→A→B… | AUD-CAL-03 | Composer có chu kỳ A/B không? | A: `dayBlockHtml` / day sequence | B: N/A | C: N/A tại Audit | **GAP** — sequence theo ngày lịch | GAP |
| BR-CAL-04 | Initial = A+B (=11 khi đủ) | AUD-CAL-04 | Initial render cấu trúc nào? | A: `renderReset` → `renderNextDay` ×1 | B: N/A | C: N/A tại Audit | **GAP** — initial = 1 day block | GAP |
| BR-CAL-05 | Progressive A+B; tiếp khi còn data | AUD-CAL-05 | Scroll fetch/compose A+B? | A: `bindScroll` → `renderNextDay` | B: N/A | C: API `offset>0` vẫn trả cards (Prod curl) trong khi UI không gọi tiếp | **GAP** — day-reveal Store only | GAP |
| BR-CAL-06 | Không artificial total hard limit | AUD-CAL-06 | Hard cap nào chặn khi source còn bài? | A: FE `limit:36`; BE clamp ≤50; `total=cards.length` | B: N/A tại Audit (không psql COUNT; dùng API multi-page) | C: Prod feed offset 0/50/100/… vẫn có cards | **GAP** — FE 36 + không paging | GAP |
| BR-CAL-07 | Category filter; common renderer | AUD-CAL-07 | Tabs + filter + renderer chung? | A: `injectFeaturedTabs`, `loadFeedForCategory`, DailyFeed | B: N/A | C: `GET …/categories?featured=1`; feed `category_id` | **PARTIAL** — có tabs/UUID/common; thiếu ALL + separation concern | PARTIAL |
| BR-CAL-08 | Không layout/renderer riêng theo category | AUD-CAL-08 | Renderer riêng theo cat? | A: `applyFeaturedTab` → cùng `mountDailyFeed` | B: N/A | C: N/A (cùng code path) | **MATCH** | MATCH |
| BR-CAL-09 | Category change reset đầy đủ | AUD-CAL-09 | Reset dataset/lazy/cursor? | A: `setFeed(replace)` + remount | B: N/A | C: N/A progressive cursor (không tồn tại) | **PARTIAL** — replace OK; không có continuation state | PARTIAL |
| BR-CAL-10 | Tab **Tất cả** (`ALL`) | AUD-CAL-10 | Có tab Tất cả? | A: `featuredCatsTabsHtml` chỉ map cats | B: N/A | C: featured list không gồm ALL | **GAP** | GAP |
| BR-CAL-11 | Partial: không empty/placeholder phá layout | AUD-CAL-11 | Partial section behavior? | A: `ifx-com-side-empty` trong `heroGridSection` | B: N/A | C: N/A tại Audit | **GAP** — có placeholder side | GAP |
| BR-CAL-12 | Responsive an toàn | AUD-CAL-12 | Breakpoints hero/grid? | A: `community.css` media hero/grid | B: N/A | C: **NOT EVIDENCED** visual Prod viewport tại Audit | **PARTIAL** — có CSS; thiếu Evidence C visual | PARTIAL |
| BR-CAL-13 | Ownership; không global regression | AUD-CAL-13 | Ownership map? | A: page / DailyFeed / community.css / ix-tabs | B: N/A | C: N/A | **MATCH** (map) | MATCH |
| BR-CAL-14 | Reuse; không duplicate | AUD-CAL-14 | Inventory + dead path? | A: DailyFeed + dead `loadNewsPage*` | B: N/A | C: N/A | **PARTIAL** — building blocks + dead duplicate | PARTIAL |
| BR-CAL-15 | Audit RC limit + lazy | AUD-CAL-15 | Full flow + root cause? | A: Trace Map + V1–V3 | B: N/A | C: Prod API multi-offset | **MATCH** (audit duty) | MATCH |
| BR-CAL-16 | NFR isolation / error / no loop / no dup | AUD-CAL-16 | Hiện trạng NFR? | A: scroll gate; replace; bridge catch | B: N/A | C: không thấy API loop (không re-fetch) | **PARTIAL** | PARTIAL |

**Tổng hợp:** 16/16 hàng · MATCH 3 · PARTIAL 5 · GAP 8.  
**Audit governance:** đủ evidence hiện trạng theo BR → Owner Approved. **Không** = BR Implementation PASS.

---

# 2. Evidence chi tiết theo lớp

## 2.A UI / Presentation

### A1. DOM ownership (shell `/cong-dong`)

Owner file: `User_Web/iflux-web-ui/community-page.js` → `renderShell`.

Thứ tự Main (evidence code):

1. Section widgets `[data-ifx-section="main"]`
2. Slot tabs `[data-ifx-com-featured-cats-slot]` → `[data-ifx-com-featured-cats].ix-tabs`
3. Daily feed `[data-ifx-com-daily-feed]`

### A2. Article list structure (Daily Feed)

Owner: `User_Web/iflux-web-ui/community-daily-feed.js`.

| Khối | Hành vi hiện tại |
|------|------------------|
| `buildDays` | Gom posts Store theo **ngày đăng** (news + expert) |
| `heroGridSection` | featured + side(≤4) + grid(rest) trong **một** `<section>` |
| `dayBlockHtml` | day head (nếu không first) + news section + (first: experts leaderboard) + expert posts section |
| Lazy UI | `renderNextDay` theo `s.days` |
| End copy | «Đã xem hết tin tức & bài viết chuyên gia» khi hết ngày trong Store |

### A3. Section vs BRD A/B

| BRD | Hiện trạng |
|-----|------------|
| A = đúng 5 | Không tách; 1+≤4 rồi **rest → grid** |
| B = đúng 6 · 3×2 | Grid 3 cột tồn tại nhưng N bài = `list.length - 5` (có thể 0, 1, … N) |
| A→B→… | Theo ngày, không A/B |
| Initial 11 | Initial 1 day |

### A4. Category UI

- HTML: `.ix-tabs` / `.ix-tab` / `.active` + `data-ifx-com-cat-id`
- Không có nút **Tất cả**
- Default: `featuredCats[0].id` khi không có URL filter
- Production featured (2026-08-08): 5 categories (Tin thị trường, Doanh nghiệp, …)

### A5. Partial / empty

```118:129:User_Web/iflux-web-ui/community-daily-feed.js
  function heroGridSection(opts) {
    var list = opts.list || [];
    // ...
    var side = rest.slice(0, 4);
    var grid = rest.slice(4);
    var sideHtml = side.length
      ? side.map(function (p) { return ui().compactPostHtml(p); }).join('')
      : '<div class="ifx-com-side-empty">Chưa có tin khác trong ngày.</div>';
```

### A6. Responsive (code)

`community.css`: desktop hero 2 cột; `@media` hero 1 cột; feed-grid 3→2→1.  
**Chưa** chạy Evidence C visual viewport trong Audit này (ghi dependency Verification sau Impl).

---

## 2.B Data / API / Backend

### B1. Endpoint

`GET /api/community/feed` — `backend/src/modules/community/community.routes.js` + `community-feed.service.js`.

Params: `limit`, `offset`, `type`/`content_type`, `ticker`, `category_id`, `chu_de_id`, `related_to`.

### B2. Limit / offset (BE)

```200:207:backend/src/modules/community/community-feed.service.js
  const limit = Math.min(Math.max(Number(filters.limit) || 30, 1), 50);
  const offset = Math.max(Number(filters.offset) || 0, 0);
  // ... LIMIT / OFFSET SQL
```

```359:359:backend/src/modules/community/community-feed.service.js
  return { cards: cards, total: cards.length, limit: limit, offset: offset };
```

**Finding:** `total` = số card **trong page hiện tại**, không phải tổng khớp filter → client **không** suy ra `hasMore` từ `total > limit` một cách đúng.

### B3. Production probes (2026-08-08)

| Request | cards | total field |
|---------|------:|------------:|
| `limit=36&offset=0` | 36 | 36 |
| `limit=50&offset=0` | 50 | 50 |
| `limit=50&offset=50` | 50 | 50 |
| `limit=50&offset=100` | 50 | 50 |
| `limit=50&offset=150` | 50 | 50 |
| `limit=50&offset=200` | 50 | 50 |
| `category_id=Tin thị trường` `limit=36` offset 0/36/72/108 | 36 mỗi page | 36 |

→ Source **còn bài** vượt xa 36. FE dừng vì không gọi tiếp.

### B4. Category filter (BE)

SQL filter `payload->>'category_id'` / `payload->'category'->>'id'`.  
Prod sample: cards cùng `category_id` khi query có filter — **OK**.

### B5. FE Data Provider hard cap

| Call site | limit | offset | replace |
|-----------|------:|--------|---------|
| `widgets/community-page/index.js` hydrate | **36** | 0 | default true |
| `community-page.js` `loadFeedForCategory` | **36** | 0 | true |
| Bridge default `DEFAULT_FEED_LIMIT` | **36** | — | — |

**Không** có call site Community home gọi `offset > 0` khi user scroll Daily Feed.

---

## 2.C Lazy Load

| Câu hỏi BRD | Kết luận evidence |
|-------------|-------------------|
| Lazy load có tồn tại? | **Có** — `IfluxDailyFeed.bindScroll` |
| Nằm đâu? | `community-daily-feed.js` `bindScroll` / `renderNextDay` |
| Đang hoạt động thế nào? | Reveal thêm **day block** từ `s.days` đã build từ Store |
| Batch size? | 1 calendar day / lần (không phải 2 section A+B) |
| Hard limit? | Gián tiếp = số bài đã hydrate (36) + số ngày trong tập đó |
| Duplicate request prevention? | Không có request scroll → N/A API; UI có thể gọi `renderNextDay` nhiều lần nếu scroll liên tục nhưng gated bởi `rendered >= days.length` |
| Concurrent? | Không có in-flight API lock trên Daily path |
| End-of-data? | Hết **ngày trong Store**, không phải hết **API dataset** |
| Legacy news infinite scroll? | **Dead code** trong `community-page.js` (`NEWS_HERO_COUNT=5`, `NEWS_PAGE_SIZE=6`) — không wire vào shell hiện tại |

---

## 2.D Category + Lazy Load

| Bước | Hiện trạng |
|------|------------|
| Chọn tab | `applyFeaturedTab` → `category_id` API replace 36 → remount DailyFeed |
| Filter FE | `listFilterParams()` thêm `categoryId` → `buildDays` / `getPosts` lọc thêm trên Store |
| Reset cursor API | **Không có** offset state |
| Leakage | Không — `setFeed` replace |
| Scroll nhiều batch category | **Không** — vẫn tối đa ~36 bài Store |

---

## 2.E Regression / lịch sử (evidence code)

| Đổi gần đây (context) | Ảnh hưởng tới BR này |
|----------------------|----------------------|
| Featured category tabs (UUID filter, no navigate) | Thêm filter concern; **không** thêm progressive API |
| Daily Feed thay list cũ | Lazy chuyển sang **day-based**; infinite scroll Store-offset trở thành dead |
| FeedCard + limit 36 (Data Provider) | Cố định cứng dataset đầu vào list |
| `total: cards.length` trên feed service | Làm meta pagination không tin cậy |

---

# 3. Ownership Map (cho SoT sau)

| Concern | Current owner (file / surface) | Ghi chú |
|---------|--------------------------------|---------|
| Category Filter UI | `community-page.js` (`featuredCats*`) | DS classes `.ix-tabs` |
| Category Filter query | ApiBridge `category_id` + Store `categoryId` | Hai lớp (API replace + FE filter) |
| Data acquisition | `iflux-community-api-bridge.js` + WGT-COM-PAGE | Hard limit 36 |
| Feed API / SQL | `community-feed.service.js` | offset OK; total sai nghĩa; max 50/req |
| Article Store | `community-store.js` `setFeed` / `getPosts` | In-memory + persist local |
| Section composition | `community-daily-feed.js` `heroGridSection` | **Day-centric**, không A/B |
| Lazy UI | `community-daily-feed.js` scroll | Day reveal |
| Dead pagination UI | `community-page.js` `loadNewsPage*` | Không mount |
| Card render | `IfluxCommunityUI` (`featuredPostHtml` / `compactPostHtml` / `postCardHtml`) | Reuse candidate |
| CSS section/grid | `community.css` `.ifx-com-hero*` `.ifx-com-feed-grid` | DS User Web |

---

# 4. Gap Summary → input cho SoT (không phải Solution)

| Gap ID | Mô tả | BR |
|--------|-------|-----|
| GAP-CAL-COMPOSER | Thiếu Section Composer A(5)/B(6) + sequence | 01–04 |
| GAP-CAL-INITIAL | Initial không = A+B | 04 |
| GAP-CAL-PROG-IO | Lazy không acquire thêm data từ API | 05, 06 |
| GAP-CAL-HARD36 | Artificial FE total hydrate 36 | 06 |
| GAP-CAL-TOTAL-META | API `total` = page length → hasMore contract thiếu | 06, 16 |
| GAP-CAL-ALL-TAB | Không có category ALL | 10 |
| GAP-CAL-PARTIAL | Empty side placeholder | 11 |
| GAP-CAL-DEAD-NEWS | Dead infinite-scroll path còn trong page | 14 |
| GAP-CAL-CONCERNS | Filter / Loader / Composer chưa tách contract | 07, 16 |

**Ngoài scope trừ khi Owner mở:** đổi Article Metadata / SEO / Category data model — Audit **không** chứng minh cần đổi model category (UUID filter đã work).

---

# 5. Kết luận bắt buộc (AC-13)

1. **Lazy load hiện tại tồn tại tại** `User_Web/iflux-web-ui/community-daily-feed.js` (`bindScroll` → `renderNextDay`).  
2. **Hành vi:** progressive theo **ngày** trong dataset đã có trong Store.  
3. **Giới hạn số bài:** chủ yếu do **FE chỉ load 36 bài/lần và không page tiếp**; Daily lazy không vượt Store.  
4. **Backend** vẫn trả thêm ở `offset≥36/50` — không phải điểm dừng.  
5. **Section A/B + initial 11 + batch 2 sections** — **chưa có** trong hiện trạng.  
6. **Category filter** đã có (common renderer) nhưng thiếu **Tất cả** và thiếu gắn với progressive acquisition.

---

# 6. Governance note

- BRD vẫn ghi Draft tại thời điểm Audit; Owner đã **mở Mandatory Audit**.  
- Sau Owner **approve Audit** → mới được mở SoT.  
- **CẤM** sửa `limit` / lazy / CSS / API như “hotfix” trước SoT + Solution đã khóa.
