# 02 — Mandatory Audit

# Community Article Detail Optimization & Entity Auto-Linking

| | |
|--|--|
| **Task ID** | `090826_Community_Article_Detail_Optimization_Entity_Auto_Linking` |
| **BRD** | [`01-BRD.md`](01-BRD.md) 🔒 OWNER LOCKED · **BR-AD-12/13 AMENDED** |
| **Document** | Mandatory Audit — sinh từ **BR Checklist** `BR-AD-01`…`BR-AD-16` + **AUD-AD-01`…`14** |
| **Date** | 2026-08-09 |
| **Evidence** | Repo local + Production DB (`stocks`/`sectors`/`ecosystems`/`community_posts`) + Article API + code path Article Detail |
| **Audit status** | 🔍 **COMPLETE (rev. B++ — atomic checklist 46/46 sau BR-AD-12/13 AMEND)** |
| **Implementation** | ❌ **NOT AUTHORIZED** (cấm code đến khi SoT + Solution + Plan khóa) |
| **Next gate** | [`03-SoT.md`](03-SoT.md) 🔒 OWNER LOCKED → mở [`04-Solution.md`](04-Solution.md) khi Owner authorize |

> Audit trả lời: **hiện trạng đối với từng BR là gì?**  
> Audit **không** thay đổi requirement BRD và **không** khóa Solution.  
> Open decision (backfill bài cũ) → **không chốt** ở Audit.

---

## Changelog vs phiên bản Audit trước (rev. A → rev. B)

| Thay đổi | Chi tiết |
|----------|----------|
| **BR-AD-03** | Thu hồi “xóa toàn bộ byline”; chuyển sang **attribution lineage / no fixed fallback** (theo Owner AMEND) |
| **V3** | Viết lại — không còn “Byline cần xóa” |
| **AUD-AD-13** | Thêm — Attribution / Byline Source-of-Truth (field matrix + ≥3 Prod samples) |
| **AUD-AD-14** | Thêm — Article Detail Runtime/Data SoT Integrity + Field Lineage Matrix |
| **Open Decision #4** | Bỏ “chỉ bỏ dates?” theo BRD cũ; thay bằng quyết định giữ/sửa/omit từng attribution field sau lineage |
| **Giữ nguyên** | V1–V2, V4–V12, Root Cause entity/Related, AUD-AD-01…12 entity findings |
| **rev. B+** | Audit Checklist §1 nâng lên **45 atomic Req ID** (README §2.1/§2.3); đồng bộ BRD §10.1 + SoT §1B |
| **rev. B++** | Đồng bộ **BR-AD-12/13 AMEND** (Sector OUT · Eco ≥3 · +`BR-AD-13.THRESH`) → checklist **46/46**; evidence hiện trạng giữ nguyên, Status/Note đối chiếu BR mới |

> Audit **không** đổi code. Evidence dưới đây vẫn mô tả hiện trạng; Status/Note cập nhật theo BR đã amend để đối chứng.

---

## Executive Verdict

| # | Finding | Severity | BR / AUD |
|---|---------|----------|----------|
| V1 | Sidebar Stock/Sector/Ecosystem/**Chủ đề** **luôn mount** card + title; empty → `.ifx-com-side-empty` placeholder — trái BR-AD-01 | 🔴 Critical | BR-AD-01 |
| V2 | Desktop content: `max-width: 72ch` + cột aside **320px** luôn chiếm chỗ kể cả khi entity empty | 🟠 High | BR-AD-02 |
| V3 | **Attribution/byline có source-lineage/fallback inconsistency.** UI đang hiển thị publisher/author metadata nhưng cần lineage rõ. Có dấu hiệu `VCCorp.vn` / `CafeF` đang được dùng như giá trị mặc định/fallback hoặc mapping sai (CafeF scrape → `author.display_name=VCCorp.vn`; ingest fallback `providerName`; `tier_label` = publisher name ghép vào byline). Audit xác định source trước khi Solution quyết định giữ / sửa / omit từng field — **không** kết luận “xóa byline”. | 🟠 High | BR-AD-03, AUD-AD-13 |
| V4 | Related DailyFeed **không** map `excludeId`/`relatedTo` → API category feed; **current article có thể xuất hiện** trong Related | 🔴 Critical | BR-AD-04 |
| V5 | Stock auto-link / detect = **DUAL SOURCE**: RSS hardcoded dict · FE `FALLBACK_TICKERS`+MockMarket · **không** đọc `stocks` table (1394 rows) | 🔴 Critical | BR-AD-05,11, AUD-AD-04/05/06 |
| V6 | Entity detection **chính tại FE normalize/render** (`linkifyTickersInHtml`) — trái BR-AD-11 (ingestion-time) | 🔴 Critical | BR-AD-06,11 |
| V7 | Company-name → `(TICKER)` rewrite **không tồn tại** ở ingest; chỉ ticker regex | 🟠 High | BR-AD-07 |
| V8 | RSS `sectors: []`, `ecosystems: []` luôn; sidebar Ngành/HST = **taxonomy membership từ tickers** lúc render. **Sau BR-AD-12 AMEND:** thiếu Sector persist **không còn là GAP** (OUT OF SCOPE). **Sau BR-AD-13 AMEND:** Eco derive từ ticker lúc render **vẫn GAP** + thiếu gate ≥3 | 🟠 High | BR-AD-12 OUT · BR-AD-13 |
| V9 | `FALLBACK_TICKERS` gồm **VND** và **HCM** — **không** có currency/TP.HCM false-positive rules | 🔴 Critical | BR-AD-09,10,15 |
| V10 | Sample Prod article `lai-dot-bien-gvr-…`: DB `tickers=[]` `sectors=[]` `ecosystems=[]` — sidebar/linkify phụ thuộc FE extract | 🟠 High | AUD-AD-03,11 |
| V11 | Admin Market Master (`stocks`/`sectors`/`ecosystems`) ≠ Community article entity path — **CONSISTENCY GAP** | 🔴 Critical | AUD-AD-02,11,12 |
| V12 | Ownership: Article Detail UI = `community-post-page` + `community-ui` + `community.css`; ingest = `rss-ingest.service`; Master = `market-master` — **MULTIPLE OWNERS / MIXED** cho entity links | 🟡 Medium | AUD-AD-08 |

### Root Cause (khóa cho chuỗi entity — BR-AD-05…15 / AUD-AD-05)

```text
Entity auto-link trên Article Detail HIỆN TẠI
KHÔNG đi theo:
  RSS → Ingestion → Authority Lookup (stocks) → Persist → Render

Mà đang là:
  RSS → raw body_html + heuristic tickers (hardcoded dict, optional)
       → DB payload
       → API
       → FE normalizePostRecord:
            extractTickers (MockMarket | FALLBACK incl. VND/HCM)
            linkifyTickersInHtml → /co-phieu/{T}
       → Sidebar: tickers + taxonomy memberships (không đọc payload.sectors/ecosystems)

RSS = input (đúng)
Database payload = lưu raw + weak tags
Domain Stocks SoT (table stocks) = BYPASS trên path Article Detail
Frontend Store transform = cơ chế chính (trái BR-AD-11)
```

### Root Cause (Related — BR-AD-04)

```text
relatedFilterFor set excludeId
  → DailyFeed.feedQueryFromFilter BỎ QUA excludeId / relatedTo
  → loadFeed(?category_id=…) không exclude current
  → current article có thể nằm trong Related

(Store.getPosts có excludeId nhưng Related UI không dùng path đó.)
```

---

## Trace Map — Article Detail Runtime (AUD-AD-01)

```text
User_Web/community/post.html
  └── bootstrap.js?v=…  detectPageKey → communityPost
        └── bootShell (MARKET_CORE: taxonomy + mock-market + seo)
        └── community-post.manifest → WGT-COM-POST-PAGE
              └── widgets/community-post-page/index.js mount
                    ├── loadScriptTiers (store, api-bridge, ui, daily-feed, post-page, ix boot)
                    ├── IfluxCommunityApiBridge.loadPostPage(ref)
                    │     ├── GET /api/community/articles/:idOrSlug
                    │     └── GET /api/community/feed?related_to=…  (merge store; UI Related không dùng lại)
                    └── IfluxCommunityPostPage.init → render
                          ├── renderArticleMain (hero, byline, body)
                          ├── renderSidebar (4 entity cards ALWAYS + TOC + comments)
                          ├── mountRelatedFeed → DailyFeed (categoryId, excludeId DEAD)
                          └── mountInteractionHosts
```

| Node | Owner (file) | Notes |
|------|--------------|-------|
| Shell HTML | `User_Web/community/post.html` | `ifx-main--community-post` |
| Runtime boot | `runtime/bootstrap.js`, `shell-boot.js`, `page-runtime.js` | |
| Composite widget | `widgets/community-post-page/index.js` | |
| Page renderer | `community-post-page.js` | |
| Sidebar/entity rows | `community-ui.js` | |
| Store + linkify | `community-store.js` | **runtime entity authority hôm nay** |
| Related UI | `community-daily-feed.js` + post-page filter | |
| CSS | `community.css` (+ `app-shell.css` max-width 1280) | |
| Article API | `community-articles.service.js` | |
| RSS ingest | `rss-ingest.service.js` | |
| Market Master | `market-master.service.js` / table `stocks` | **không** trên Article Detail link path |

---

## Production DB Snapshot (AUD-AD-02 / 11) — 2026-08-09

| Domain | Table | Count (Prod) |
|--------|-------|--------------|
| Stocks | `stocks` | **1394** |
| Sectors | `sectors` | **19** |
| Ecosystems | `ecosystems` | **23** |
| Community posts (RSS-ish) | `community_posts` published/rss origin | **3053** |
| Posts with `payload.tickers` non-empty | | **144** |

Sample Article Detail URL article:

| slug | tickers | sectors | ecosystems |
|------|---------|---------|------------|
| `lai-dot-bien-gvr-rot-nghin-ty-dong-vao-quy-khoa-hoc-cong-nghe-kn5m` | `[]` | `[]` | `[]` |

→ UI entity/sidebar/linkify (nếu có) **không** phản ánh DB membership đã persist cho bài này.

---

# 1. Audit Checklist (sinh từ BR Checklist atomic — form [`README.md`](../README.md) §2.3)

> **Khóa:** mỗi hàng = một **Req ID** từ BRD §10.1 (**46 atomic** sau BR-AD-12/13 AMEND). Không gộp atomic.  
> **Status** = hiện trạng vs Req (`MATCH` / `PARTIAL` / `GAP`) — **không** = Implementation DONE.  
> Shared Audit slice (AUD-AD-*) được reference nhiều Req — mỗi Req vẫn Status riêng.  
> Evidence A/B/C theo README §3.0; `N/A` khi lớp không áp dụng.

| BR | Req ID | BR Requirement | Audit ID | Audit Check | Evidence A (Static) | Evidence B (DB) | Evidence C (Runtime) | Current vs Req | Status |
|----|--------|----------------|----------|-------------|---------------------|-----------------|----------------------|-----------------|--------|
| BR-AD-01 | BR-AD-01.STOCK | Stock block chỉ khi ≥1 | AUD-AD-01 · AUD-AD-08 | Stock card omit khi 0? | A: luôn mount 4 cards | B: sample tickers=`[]` | C: empty stock card vẫn hiện | Always mount | **GAP** |
| BR-AD-01 | BR-AD-01.SECTOR | Sector omit khi 0; pipeline **không** sinh Sector (BR-AD-12 OUT) | AUD-AD-01 · AUD-AD-08 | Empty sector card? | A: luôn mount | B: sectors=`[]` | C: empty card | Always mount; BR mới không yêu cầu auto Sector | **GAP** (omit UI) / N/A (auto Sector) |
| BR-AD-01 | BR-AD-01.ECO | Eco block chỉ khi ≥1 membership (sau THRESH) | AUD-AD-01 · AUD-AD-08 | Eco card omit khi 0? | A: luôn mount | B: ecosystems=`[]` | C: empty eco card | Always mount | **GAP** |
| BR-AD-01 | BR-AD-01.EMPTY | Cấm empty/placeholder | AUD-AD-01 · AUD-AD-08 | Có `.ifx-com-side-empty`? | A: empty row HTML | B: N/A | C: placeholder text hiện | Có placeholder | **GAP** |
| BR-AD-02 | BR-AD-02.WIDTH | Content width hợp lý | AUD-AD-01 · AUD-AD-10 | Body max-width? | A: `72ch` | B: N/A | C: N/A (code) | Hẹp cứng | **GAP** |
| BR-AD-02 | BR-AD-02.IMG | Ảnh theo content width | AUD-AD-01 | Image CSS trong article? | A: article/body image rules `community.css` | B: N/A | C: N/A visual tại Audit | Phụ thuộc container hẹp | **PARTIAL** |
| BR-AD-02 | BR-AD-02.ASIDE | Không vùng phải vô lý | AUD-AD-01 · AUD-AD-10 | Aside 320px khi empty? | A: story-layout 320px | B: N/A | C: N/A | Aside luôn chiếm chỗ | **GAP** |
| BR-AD-02 | BR-AD-02.RWD | RWD ổn định | AUD-AD-10 | Breakpoints? | A: aside hide ≤1024 | B: N/A | C: **NOT EVIDENCED** visual | Có CSS; thiếu Evidence C | **PARTIAL** |
| BR-AD-02 | BR-AD-02.SCOPE | CSS scope; không phá global | AUD-AD-08 | Ownership CSS? | A: `community.css` scoped | B: N/A | C: N/A | Scope OK hiện trạng | **MATCH** |
| BR-AD-03 | BR-AD-03.1 | Không hard-code publisher/author trong renderer | AUD-AD-13 · AUD-AD-06 | Literal CafeF/VCCorp trong FE Detail? | A: không literal trong post-page/ui | B: N/A | C: N/A | FE không hard-code chuỗi | **MATCH** |
| BR-AD-03 | BR-AD-03.2 | Lineage RSS→…→UI | AUD-AD-13 · AUD-AD-03 | Trace đủ tầng? | A: ingest→payload→API→byline | B: payload author/source | C: API khớp DB | Lineage có; semantic conflict | **PARTIAL** |
| BR-AD-03 | BR-AD-03.3 | Source/author hợp lệ → hiển thị đúng | AUD-AD-13 | VietStock author thật? | A: byline = display_name | B: VietStock authors đa dạng | C: API sample Thu Minh | VietStock OK; CafeF vendor meta | **PARTIAL** |
| BR-AD-03 | BR-AD-03.4 | Missing → không fixed fallback | AUD-AD-13 | Fallback `providerName`? | A: `\|\| providerName`; FE `Thành viên` | B: 4× CafeF=CafeF | C: API fallback sample | Ingest+FE invent fallback | **GAP** |
| BR-AD-03 | BR-AD-03.5 | Dates tách attribution | AUD-AD-13 · AUD-AD-03 | Dates vs publisher? | A: Đăng/Cập nhật trong byline | B: published/updated | C: API timestamps | Data độc lập; UI ghép byline | **PARTIAL** |
| BR-AD-03 | BR-AD-03.6 | Không xóa DB để fix UI | AUD-AD-13 | Audit đề xuất xóa DB? | A: Audit cấm xóa byline/DB | B: data giữ nguyên | C: N/A | Baseline tuân thủ | **MATCH** |
| BR-AD-03 | BR-AD-03.7 | Không FE source/fallback riêng | AUD-AD-13 · AUD-AD-06 | FE invent author/publisher? | A: FE fallback Thành viên/Premium | B: N/A | C: N/A | FE có fallback generic | **GAP** |
| BR-AD-04 | BR-AD-04.1 | Exclude trước render | AUD-AD-01 · AUD-AD-09 | excludeId mapped? | A: set nhưng DailyFeed bỏ qua | B: N/A | C: feed có thể gồm self | Dead param | **GAP** |
| BR-AD-04 | BR-AD-04.2 | Không chỉ CSS-hide | AUD-AD-09 | Có post-filter CSS? | A: không CSS hide self | B: N/A | C: N/A | Không CSS-hide; cũng không exclude | **GAP** |
| BR-AD-04 | BR-AD-04.ACC | `current ∉ related` | AUD-AD-01 | Invariant enforce? | A: không enforce | B: N/A | C: có thể vi phạm | Vi phạm khả thi | **GAP** |
| BR-AD-05 | BR-AD-05.AUTH | Authority = stocks | AUD-AD-02 · AUD-AD-05 · AUD-AD-11 · AUD-AD-12 | Detail dùng Master? | A: không gọi master stocks | B: stocks=1394 | C: N/A trên path | BYPASS | **GAP** |
| BR-AD-05 | BR-AD-05.BAN | Cấm RSS/FE dict làm authority | AUD-AD-04 · AUD-AD-06 | DUAL SOURCE? | A: FALLBACK+Mock+RSS dict | B: N/A | C: N/A | Đang dùng forbidden sources | **GAP** |
| BR-AD-06 | BR-AD-06.1 | Verify ticker ∈ Stocks | AUD-AD-05 | Ingest check Master? | A: dict ~26; không Master | B: N/A | C: N/A | Không | **GAP** |
| BR-AD-06 | BR-AD-06.2 | Verify occurrence | AUD-AD-05 | Occurrence check? | A: title/keywords heuristic | B: N/A | C: N/A | Weak | **GAP** |
| BR-AD-06 | BR-AD-06.3 | Tạo entity/link | AUD-AD-05 | Ai tạo `/co-phieu/`? | A: FE linkify | B: N/A | C: sau API load | FE tạo | **GAP** |
| BR-AD-06 | BR-AD-06.4 | Persist kết quả | AUD-AD-05 · AUD-AD-03 | Persist links/refs? | A: không persist linkified | B: tickers yếu/`[]` | C: N/A | Không persist đủ | **GAP** |
| BR-AD-06 | BR-AD-06.5 | Detail dùng persisted | AUD-AD-05 · AUD-AD-07 | FE guess lại? | A: normalize+linkify primary | B: empty entities sample | C: FE rewrite body | FE = primary | **GAP** |
| BR-AD-07 | BR-AD-07.1 | Company name → (TICKER) từ Stocks | AUD-AD-05 | Có rewrite? | A: không path | B: stocks có name | C: N/A | Missing | **GAP** |
| BR-AD-07 | BR-AD-07.2 | Cấm hardcoded company dict authority | AUD-AD-04 · AUD-AD-06 | Company dict FE/ingest? | A: không company dict; ticker dict có | B: N/A | C: N/A | Chưa vi phạm company dict; thiếu capability | **PARTIAL** |
| BR-AD-08 | BR-AD-08.1 | Link tất cả; không cap=1 | AUD-AD-05 · AUD-AD-04 | Cap=1? | A: FE nhiều; ingest~5 | B: N/A | C: N/A | Không cap UI=1; authority sai | **PARTIAL** |
| BR-AD-09 | BR-AD-09.CUR | Currency VND không link | AUD-AD-04 · AUD-AD-06 | Rule number+VND? | A: không rule; VND∈FALLBACK | B: VND∈stocks | C: N/A | Risk | **GAP** |
| BR-AD-09 | BR-AD-09.TK | Ticker VND chỉ khi đủ context | AUD-AD-04 | Context rule? | A: không | B: N/A | C: N/A | Missing | **GAP** |
| BR-AD-10 | BR-AD-10.GEO | TP.HCM… không link | AUD-AD-04 · AUD-AD-06 | Geo rule? | A: không; HCM∈FALLBACK | B: HCM∈stocks | C: N/A | Risk | **GAP** |
| BR-AD-10 | BR-AD-10.TK | Ticker HCM chỉ khi đủ context | AUD-AD-04 | Context rule? | A: không | B: N/A | C: N/A | Missing | **GAP** |
| BR-AD-11 | BR-AD-11.INGEST | Detection tại ingestion | AUD-AD-05 · AUD-AD-14 | Ingest primary? | A: ingest weak; FE primary | B: N/A | C: N/A | Không | **GAP** |
| BR-AD-11 | BR-AD-11.BAN | Cấm FE là cơ chế chính | AUD-AD-07 · AUD-AD-05 | FE primary? | A: linkify in normalize | B: N/A | C: Detail phụ thuộc FE | Vi phạm | **GAP** |
| BR-AD-12 | BR-AD-12.MODEL | **OUT OF SCOPE** — không auto Sector | AUD-AD-12 · AUD-AD-14 | Có pipeline Sector auto? | A: không persist Sector | B: sectors=[] RSS | C: N/A | Không auto Sector — **khớp BR OUT** | **OUT OF SCOPE** (BR AMEND) |
| BR-AD-12 | BR-AD-12.AUTH | Sector Master ngoài task; cấm auto-membership | AUD-AD-02 · AUD-AD-11 | Sidebar taxonomy←tickers? | A: derive lúc render | B: sectors=19 Master | C: N/A | Runtime derive ≠ BR OUT intent | **GAP** vs OUT (cần ngừng derive/persist Sector) |
| BR-AD-13 | BR-AD-13.MODEL | Model Eco detect→Master→persist | AUD-AD-12 · AUD-AD-14 | Pipeline Eco persist? | A: không | B: ecosystems=[] | C: N/A | Missing | **GAP** |
| BR-AD-13 | BR-AD-13.AUTH | Authority = ecosystems master | AUD-AD-02 · AUD-AD-11 | Sidebar từ Master membership? | A: taxonomy←tickers | B: ecosystems=23 | C: N/A | DERIVED at render | **GAP** |
| BR-AD-13 | BR-AD-13.THRESH | Eco ≥3 constituent; 1 mã ≠ Eco | AUD-AD-14 · AUD-AD-12 | Có gate ≥3? | A: không; taxonomy 1 ticker có thể suy Eco | B: N/A | C: N/A | Missing threshold | **GAP** |
| BR-AD-14 | BR-AD-14.PIPE | Common pipeline Stock+Eco | AUD-AD-04 · AUD-AD-14 | Có common service? | A: paths tách | B: N/A | C: N/A | Không | **GAP** |
| BR-AD-14 | BR-AD-14.BAN | Không Stock vs Eco độc lập hoàn toàn | AUD-AD-08 · AUD-AD-04 | Multiple owners? | A: MIXED | B: N/A | C: N/A | Độc lập / mixed | **GAP** |
| BR-AD-15 | BR-AD-15.PREC | Precision > recall | AUD-AD-04 · AUD-AD-06 | Enforce? | A: FALLBACK gồm VND/HCM | B: N/A | C: N/A | Trái | **GAP** |
| BR-AD-15 | BR-AD-15.SCOPE | VND/HCM/tên thường… | AUD-AD-04 | Scope rules? | A: không false-positive rules | B: N/A | C: N/A | Missing | **GAP** |
| BR-AD-16 | BR-AD-16.SAFE | Không phá HTML/media/metadata | AUD-AD-09 | Baseline trước Impl? | A: Audit-only; chưa đổi | B: N/A | C: N/A | Baseline OK | **MATCH** |
| BR-AD-16 | BR-AD-16.SEO | Không phá SEO/affiliate/URL | AUD-AD-09 | Baseline? | A: chưa đụng canonical/share | B: N/A | C: N/A | Baseline OK | **MATCH** |

**Tổng hợp atomic:** **46/46** · **MATCH** 5 · **PARTIAL** 6 · **GAP** ~33 · **OUT OF SCOPE** 1 (`BR-AD-12.MODEL`) + note GAP vs OUT trên `BR-AD-12.AUTH`.  
**Governance:** sinh từ BRD §10.1 (đã AMEND) — không từ code inventory. Evidence chi tiết: Trace Map + AUD-AD Results.  
**Không** = BR Implementation PASS.

### 1.1 Supporting Audit slices (AUD-AD-01…14) — index

| Audit ID | Primary BR served | Evidence section status |
|----------|-------------------|-------------------------|
| AUD-AD-01 | BR-AD-01…04, runtime | COMPLETE — Trace Map |
| AUD-AD-02 | BR-AD-05,12,13 | COMPLETE |
| AUD-AD-03 | BR-AD-03,05…13 | COMPLETE |
| AUD-AD-04 | BR-AD-05,14,15 | COMPLETE |
| AUD-AD-05 | BR-AD-05…11 | COMPLETE |
| AUD-AD-06 | BR-AD-02,03,11 | COMPLETE |
| AUD-AD-07 | BR-AD-11 | COMPLETE |
| AUD-AD-08 | BR-AD-01…04,14 | COMPLETE |
| AUD-AD-09 | BR-AD-16 | COMPLETE (IDENTIFY only) |
| AUD-AD-10 | BR-AD-02 | COMPLETE (needs Timing nếu Owner mở) |
| AUD-AD-11 | BR-AD-05,12,13 | COMPLETE |
| AUD-AD-12 | All domains | COMPLETE |
| AUD-AD-13 | BR-AD-03 | COMPLETE (rev. B) |
| AUD-AD-14 | All + integrity | COMPLETE (rev. B) |

---

## AUD-AD Checklist Results (evidence chi tiết)

### AUD-AD-01 — Runtime Source Map

**PASS (mapped).** Xem Trace Map trên. Owners xác định.  
Duplicate concern: `loadPostPage` related_to merge **và** DailyFeed category fetch — 2 path related.

### AUD-AD-02 — Database / Admin Authority Trace

| Domain | Admin | DB | Service | Article Detail consumes? |
|--------|-------|-----|---------|--------------------------|
| Article | Content edit | `community_posts.payload` | `community-articles` | **Yes** (API) |
| Stock master | Market Wave F | `stocks` (1394) | `market-master` | **No** (bypass) |
| Industry | Market sectors | `sectors` (19) | `market-master` | **No** direct |
| Ecosystem | Market ecosystems | `ecosystems` (23) | `market-master` | **No** direct |
| Article↔Entity | Free-text XOR on edit | `payload.tickers|sectors|ecosystems` | normalize XOR | Partial (tickers only if set) |
| Related | — | query-time | `community-feed` | UI path broken exclude |

### AUD-AD-03 — Field Lineage

| UI field | Renderer | API | DB | Lineage verdict |
|----------|----------|-----|-----|-----------------|
| title | `renderArticleMain` | article | `payload.title` | OK |
| body | `prepareArticleBody` + Store linkify | `body_html` | `payload.body_html` | **CONFLICT**: raw DB + FE rewrite |
| author / publisher chip | byline `author.display_name` + `tier_label` | payload.author | RSS ingest + scrape + `PROVIDER_NAMES` | **CONFLICT** — xem AUD-AD-13 |
| Đăng / Cập nhật | byline times | published_at / updated | payload timestamps | OK lineage; **tách** khỏi publisher (BR-AD-03.5) |
| tickers sidebar | `sidebarTickerRowsHtml` | payload.tickers **+ FE extract** | payload.tickers | **CONFLICT** |
| sectors sidebar | taxonomy←tickers | — | payload.sectors=`[]` RSS | **CONFLICT / DERIVED** |
| ecosystems sidebar | taxonomy←tickers | — | payload.ecosystems=`[]` | **CONFLICT / DERIVED** |
| Related list | DailyFeed | feed category | posts | **GAP exclude** |

### AUD-AD-04 — Duplicate / Conflict

| Source | Role | Classification |
|--------|------|----------------|
| `stocks` table + `/market/master/stocks` | Domain SoT | AUTHORITY (unused by Article Detail links) |
| `IfluxMockMarket` | FE known tickers + quotes | **DUAL SOURCE** |
| `FALLBACK_TICKERS` (incl. VND, HCM) | FE fallback dict | **DUAL SOURCE / HARD-CODE** |
| RSS ingest `dict` (~26 tickers) | Ingest heuristic | **DUAL SOURCE / HARD-CODE** |
| Content Engine `linkEntity` | Parallel domain (`content_articles`) | **SEPARATE** — not Community RSS |
| Vendor HTML `<a>` in body | Possible raw | INPUT noise |

### AUD-AD-05 — RSS vs Database

```text
RSS HTML page
  → enrichFromHtml (raw body, no /co-phieu rewrite)
  → community_posts.payload
  → GET /community/articles/:id
  → FE linkifyTickersInHtml  ← creates /co-phieu/ AFTER load
```

| Question | Answer |
|----------|--------|
| Ingest tạo `/co-phieu/`? | **No** |
| Ai tạo `/co-phieu/`? | **FE** `community-store.js` |
| Trước/sau DB? | **Sau** API load |
| Resolve vs `stocks`? | **No** |
| RSS invent ticker ngoài Master? | **Yes** (dict / MockMarket / free-text Admin) |

### AUD-AD-06 — Bypass Domain SoT

Evidence bypass:

- Hardcoded RSS dict (`rss-ingest.service.js` ~246–249)
- `FALLBACK_TICKERS` (`community-store.js:46`)
- MockMarket for extract/linkify
- Raw RSS HTML + client rewrite

Desired Admin→DB→API→UI path **exists for Market Master** nhưng **không** gắn Article Detail entity links.

### AUD-AD-07 — Store / Cache

`IfluxCommunityStore` = in-memory session store (API hydrate).  
`normalizePostRecord` **mutate** `body_html` (linkify) trong mem — UI có thể coi Store đã linkify là “sự thật hiển thị” ≠ DB raw.  
Classification: **CACHE + TRANSFORM** — không được SoT.

### AUD-AD-08 — Code Ownership

| Concern | Owner(s) | Flag |
|---------|----------|------|
| Article shell | `post.html` + bootstrap | OK |
| Article content/header | `community-post-page.js` | OK |
| Sidebar cards | `community-post-page` + `community-ui` | OK |
| Entity link in body | `community-store` (FE) | **MIXED** vs ingest |
| Related | `community-post-page` + `daily-feed` + feed service | **MULTIPLE** |
| RSS transform | `rss-ingest.service` | OK |
| Stocks authority | `market-master` | **NOT WIRED** |
| CSS | `community.css` | OK |

### AUD-AD-09 — Dead / Legacy (IDENTIFY only)

| Item | Evidence | Classify |
|------|----------|----------|
| `excludeId` on related filter | Set but unused by DailyFeed | **DEAD PARAM** → DELETE/MERGE in Plan |
| `relatedTo` filter branch when no category | Not sent to API by DailyFeed | **DEAD PATH** |
| `payload.sectors` / `ecosystems` on RSS | Always `[]` | **UNUSED FIELD** for RSS path |
| Content Engine entity link | Parallel product | **KEEP** (out of Community RSS) — không xóa ở Audit |
| FE linkify | Active | Disposition → Solution (migrate to ingest vs keep) |

### AUD-AD-10 — Runtime Loading Integrity

| Observation | Evidence |
|-------------|----------|
| Critical path loads MockMarket on communityPost | `shell-boot` MARKET_CORE |
| Article + related_to at boot | `loadPostPage` |
| Related UI fetches again via DailyFeed category | Second acquisition path |
| Prior comment remount loop | Fixed `cmtLoopFix20260808` (related: community-change) — outside BR-AD nhưng runtime integrity |

Không kết luận “chậm” mà không có Timing trong session này — ghi **needs Verification Timing** nếu Owner yêu cầu perf slice.

### AUD-AD-11 — Admin → DB → API → UI Consistency

| Chain | Result |
|-------|--------|
| Admin article tickers CSV → payload → API → UI chips | **Consistent** khi Admin set |
| Admin Market Stocks → Article body links | **CONSISTENCY GAP** |
| RSS heuristic tickers (144 posts) vs Master 1394 | Subset / dict — không sync |
| Sample GVR article DB empty entities vs possible FE extract | Gap |

### AUD-AD-12 — Single Source of Truth Verdict

| Domain | Admin | DB | API | Runtime | Article Detail | Verdict |
|--------|-------|----|-----|---------|----------------|---------|
| Article | Content Admin | `community_posts` | `/community/articles` | Store | Render | **DB SoT OK** |
| Stocks (master) | Market Admin | `stocks` | `/market/master/stocks` | MockMarket **parallel** | Linkify/sidebar | **BYPASS / DUAL** |
| Industry | Market Admin | `sectors` | master API | Taxonomy←ticker | Sidebar derived | **DERIVED ≠ DB membership** |
| Ecosystem | Market Admin | `ecosystems` | master API | Taxonomy←ticker | Sidebar derived | **DERIVED ≠ DB membership** |
| Article Entity Links | Partial Admin XOR | payload arrays | article API | **FE linkify primary** | Body + sidebar | **RUNTIME PRIMARY — FAIL BR-AD-11** |
| Related Articles | — | feed query | `/community/feed` | DailyFeed | Related section | **EXCLUDE BROKEN** |
| Attribution / Byline | — | payload.author / source_* | article API | byline renderer | Header under hero | **LINEAGE CONFLICT — AUD-AD-13** (không = xóa byline) |

---

### AUD-AD-13 — Attribution / Byline Source-of-Truth Audit

#### Literal / string inventory

| Literal / pattern | Where | Classification |
|-------------------|-------|----------------|
| `CafeF` / `VietStock` / `Báo Đầu Tư` | `rss-mappings.js` `PROVIDER_NAMES` | **INGEST CONSTANT** (provider display name) |
| `VCCorp` / `VCCorp.vn` | **Không** hard-code trong FE Article Detail; **không** hard-code trong ingest assign | **VENDOR META → DB** (CafeF scrape `article:author` / meta author) |
| `display_name: enriched.author_name \|\| providerName` | `rss-ingest.service.js` ~434 | **FALLBACK** → provider name khi thiếu author scrape |
| `tier_label: providerName` | `rss-ingest.service.js` ~436 | **TRANSFORM** — publisher name ghi vào field tên “tier” |
| `tierBadge(author.tier_label)` | `community-ui.js` ~61–68 | **RENDER** — chip byline |
| `Đăng` / `Cập nhật` | `community-post-page.js` ~129–131 | **RENDER labels** trên `published_at` / `updated_at` |
| FE thiếu `author` → `Thành viên` / `Premium` | `community-store.js` ~139 | **FE FALLBACK** (không phải CafeF/VCCorp) |
| FE Expert/Admin paths `tier_label: 'Elite'/'Admin'` | `community-store.js` | **FE FALLBACK / HARD-CODE** (path khác RSS Detail chính) |

**Kết luận nguồn `VCCorp.vn / CafeF` trên UI:**

```text
CafeF HTML meta author (thường "VCCorp.vn")
  → enrichFromHtml.author_name
  → payload.author.display_name   (= VCCorp.vn nếu scrape có)
  → API data.article.author.display_name
  → byline text

PROVIDER_NAMES.cafef = "CafeF"
  → payload.author.tier_label
  → payload.source_name / source.name
  → tierBadge chip "CafeF"
  → (fallback) display_name = "CafeF" khi scrape không có author

FE Article Detail: KHÔNG hard-code chuỗi "VCCorp.vn" hay "CafeF"
```

#### Field matrix (byline dưới hero)

| Field | UI hiển thị | Source hiện tại | DB field | Ingest owner | FE transform | Hard-code/fallback | SoT (pending) |
|-------|-------------|-----------------|----------|--------------|--------------|--------------------|---------------|
| Publisher/source | Chip `tier_label` (+ `source_name` trong payload, **không** render riêng) | `PROVIDER_NAMES[providerId]` | `author.tier_label`, `source_name`, `source.name` | `rss-ingest` + `rss-mappings` | `tierBadge` only | Ingest constant map | **CONFLICT** — 3 field cùng publisher |
| Author | `author.display_name` | Vendor meta scrape **hoặc** `providerName` | `author.display_name` | `enrichFromHtml` + fallback | `\|\| 'Thành viên'` nếu thiếu object | Vendor + ingest fallback + FE fallback | **CONFLICT** |
| Tier label | Chip cạnh tên | = provider display name (RSS) | `author.tier_label` | set = `providerName` | chip CSS by `tier` | Semantic reuse “tier” = publisher | **CONFLICT** — không phải membership tier |
| Published date | `Đăng {fmt}` | RSS/enriched published | `published_at` | ingest | `fmtDate` | — | **AUTHORITATIVE candidate** (tách publisher) |
| Updated date | `Cập nhật {fmt}` | ingest/update time | `updated_at` | ingest/row | `fmtDate` | — | **AUTHORITATIVE candidate** (tách publisher) |

#### Production samples (≥3 source/author khác nhau) — 2026-08-09

| # | slug | RSS/source thực tế | DB `display_name` | DB `tier_label` / `source_name` | API (`/api/community/articles/:slug` → `data.article`) | Final byline intent (DOM = client render cùng fields) |
|---|------|--------------------|-------------------|----------------------------------|------------------------------------------------------|--------------------------------------------------------|
| A | `lai-dot-bien-gvr-…-kn5m` | CafeF | `VCCorp.vn` | `CafeF` / `CafeF` | khớp DB | `VCCorp.vn` + chip `CafeF` + Đăng/Cập nhật |
| B | `thanh-tra-chinh-phu-…-vietstock-gd5o` | VietStock | `Thu Minh` | `VietStock` / `VietStock` | khớp DB | `Thu Minh` + chip `VietStock` + dates |
| C | `my-nham-nhe-do-quan-…-fz52` | CafeF (thiếu author scrape) | `CafeF` | `CafeF` / `CafeF` | khớp DB | `CafeF` + chip `CafeF` (fallback provider) |

**CafeF author distribution (Prod):** `VCCorp.vn` = **2705** · `CafeF` = **4**.  
**VietStock:** nhiều author thật (Thu Minh, Trí Nhân, …) — chứng minh UI **không** luôn cố định VCCorp; vấn đề = **CafeF vendor meta + ingest fallback + tier_label semantic**.  
**baodautu:** 0 bài published trong snapshot — không có sample DOM thứ 3 từ provider này.

| Check | Result |
|-------|--------|
| DB đúng / UI sai? | **Không** trên samples — API/UI phản ánh DB |
| DB sai từ ingestion? | **Một phần**: `VCCorp.vn` đến từ vendor HTML meta (không phải FE invent); `tier_label`/`display_name` fallback = `PROVIDER_NAMES` |
| RSS thiếu author? | Fallback **`providerName`** tại ingest (`\|\| providerName`) |
| Overlap fields? | `source_name` ≈ `source.name` ≈ `tier_label` (publisher); `display_name` có thể = vendor holding **hoặc** provider |
| `tier_label` thuộc attribution? | **Đang bị ghép vào byline như publisher chip** — **không** phải membership tier trên path RSS |
| Kết luận “xóa byline”? | **CẤM** — chỉ escalate SoT: canonical field + khi nào omit |

---

### AUD-AD-14 — Article Detail Runtime/Data SoT Integrity

#### Nguyên tắc kiểm tra

```text
Admin / Domain DB → API → Article Detail Runtime → UI
Không được có runtime source thứ hai thay thế DB.
```

#### Inventory + classification (Article Detail)

| Source / mechanism | Role hôm nay | Classification |
|--------------------|--------------|----------------|
| `community_posts.payload` via Article API | Article body, author, dates, weak tickers | **AUTHORITATIVE** (article record) |
| `stocks` / `sectors` / `ecosystems` Master | Domain entity SoT | **AUTHORITATIVE** nhưng **BYPASS** trên link path |
| `PROVIDER_NAMES` / RSS scrape author | Attribution ingest | **TRANSFORM / FALLBACK** |
| `IfluxMockMarket` | Ticker extract/linkify | **DUPLICATE** vs Master |
| `FALLBACK_TICKERS` (incl. VND, HCM) | FE dict | **FALLBACK / HARD-CODE** |
| RSS ingest ticker `dict` (~26) | Ingest tags | **FALLBACK / HARD-CODE** |
| `normalizePostRecord` linkify | Mutate `body_html` in Store | **TRANSFORM** (runtime primary for links) |
| Taxonomy←tickers sidebar | Sector/Ecosystem rows | **DERIVED** ≠ payload membership |
| DailyFeed category + dead `excludeId` | Related | **DUPLICATE** acquisition + **LEGACY** param |
| FE author defaults (`Thành viên`/`Premium`/`Elite`) | Missing author object | **FALLBACK** |
| Vendor HTML in `body_html` | May contain vendor `<a>` | **LEGACY / INPUT noise** |
| Content Engine `linkEntity` | Parallel product | **SEPARATE** (không Community RSS) |

#### Field Lineage Matrix (field chính Article Detail)

| UI Field | Renderer | Runtime object | API response | DB field | DB table | Admin owner | Classification |
|----------|----------|----------------|--------------|----------|----------|-------------|----------------|
| Title | `renderArticleMain` | `post.title` | `article.title` | `payload.title` | `community_posts` | Content Admin | **AUTHORITATIVE** |
| Body HTML | `prepareArticleBody` + Store linkify | `post.body_html` (mutated) | `article.body_html` | `payload.body_html` | `community_posts` | Content / RSS ingest | **CONFLICT**: AUTHORITATIVE raw + **TRANSFORM** FE |
| Author name | byline | `post.author.display_name` | `article.author.display_name` | `payload.author.display_name` | `community_posts` | RSS ingest / vendor | **TRANSFORM/FALLBACK** chain — SoT pending |
| Publisher chip | `tierBadge` | `post.author.tier_label` | `article.author.tier_label` | `payload.author.tier_label` | `community_posts` | `PROVIDER_NAMES` | **TRANSFORM** (semantic conflict) |
| Source name (payload) | *không render riêng* | `post.source_name` | same | `payload.source_name` | `community_posts` | `PROVIDER_NAMES` | **AUTHORITATIVE candidate** (unused in byline) |
| Published | byline `Đăng` | `post.published_at` | same | `payload.published_at` | `community_posts` | ingest | **AUTHORITATIVE** |
| Updated | byline `Cập nhật` | `post.updated_at` | same | `payload.updated_at` | `community_posts` | ingest | **AUTHORITATIVE** |
| Tickers sidebar | `sidebarTickerRowsHtml` | `post.tickers` (+ extract) | `article.tickers` | `payload.tickers` | `community_posts` | Admin XOR / RSS weak | **CONFLICT** + FE extract |
| Body stock links | linkify | Store body | body_html | body_html | `community_posts` | — | **RUNTIME PRIMARY / DUPLICATE** vs Master |
| Sectors sidebar | taxonomy←tickers | derived | — | `payload.sectors`=`[]` RSS | `community_posts` / `sectors` | Market Admin unused | **DERIVED** |
| Ecosystems sidebar | taxonomy←tickers | derived | — | `payload.ecosystems`=`[]` | `community_posts` / `ecosystems` | Market Admin unused | **DERIVED** |
| Related list | DailyFeed | feed items | `/community/feed` | query-time | `community_posts` | — | **DUPLICATE** path; exclude **LEGACY** |

#### Acceptance note AUD-AD-14

Matrix đã lập. Sau SoT, mỗi field quan trọng phải còn **một** authoritative source — hiện **FAIL** trên entity links + attribution semantics; Article title/dates/body-raw **OK** trên path Admin/DB→API.

**Câu hỏi đặc biệt:** Admin cấu hình entity/source trong DB → Article Detail có lấy đúng qua API?

| Domain | Answer |
|--------|--------|
| Article fields (title, body raw, author payload) | **Yes** qua API |
| Market Stocks/Sectors/Ecosystems | **No** — runtime suy diễn MockMarket / FALLBACK / taxonomy |
| Attribution publisher chip | **Partial** — lấy API nhưng giá trị do ingest map/`tier_label` semantic, không phải Admin “publisher SoT” riêng |

---

## Answers to BRD Audit Questions (§5)

| # | Question | Answer |
|---|----------|--------|
| 1 | Sidebar blocks decided where? | `community-post-page.renderSidebar` — always; rows via `community-ui.sidebar*RowsHtml` |
| 2 | Content width owner? | `community.css` `.ifx-com-article__body` 72ch + `.ifx-com-story-layout` 1fr/320px; shell `app-shell.css` 1280 |
| 3 | Attribution / VCCorp / CafeF / Đăng / Cập nhật? | Xem **AUD-AD-13**: FE không hard-code CafeF/VCCorp; `VCCorp.vn` = CafeF vendor meta → DB; `CafeF` chip = `PROVIDER_NAMES` → `tier_label`; dates = timestamps riêng |
| 4 | Related current article? | `excludeId` dead in DailyFeed; category feed can include self |
| 5 | RSS auto-link HCM/VND/ticker/name? | Heuristic dict at ingest (tickers only); FE linkify; **no** company-name rewrite; **no** VND/HCM rules |
| 6 | Entity/link stored vs render? | Weak `payload.tickers`; **links created at FE normalize**; sectors/ecosystems empty on RSS |
| 7 | Authority fields Stocks/Sectors/Ecosystems? | Master tables exist (`stocks` name/ticker, sectors, ecosystems) — **sufficient as authority**; Community không dùng |
| 8 | Existing resolution to reuse? | Content Engine `linkEntity` (parallel); Market Master list APIs; **no** Community ingestion resolver |
| 9 | Auto-link from where? | Primarily **frontend**; ingest heuristic tags only; RSS provider HTML may keep vendor links |
| 10 | Old articles backfill? | **OPEN** — không chốt ở Audit (BRD) |

---

## BR → Audit conflict check (rev. B)

| Pair | Conflict? | Note |
|------|-----------|------|
| BR-AD-03 (amended) ↔ AUD-AD-13 | **None** | Audit xác định lineage; không bắt Solution “xóa byline” |
| BR-AD-03 ↔ BR-AD-05…15 (entity) | **None** | Attribution ≠ entity resolution; cùng nguyên tắc SoT |
| AUD-AD-14 ↔ AUD-AD-04/05/06 | **None** | AUD-AD-14 mở rộng / củng cố; entity DUAL SOURCE vẫn đứng |
| BR-AD-03.5 dates ↔ V3 | **None** | Dates tách publisher; giữ/omit dates = SoT open |
| Cũ “xóa byline” ↔ entity omit sidebar | N/A | Requirement cũ đã thu hồi — không còn xung đột giả |

---

## Open Decisions (escalate → SoT / Solution — không chốt Audit)

1. **Backfill** bài cũ: re-process ingest vs lazy migration job vs only new RSS.
2. **Body HTML**: persist linkified HTML vào DB vs persist entity refs + render links từ refs (precision/safety BR-AD-16).
3. **Sidebar Chủ đề**: BR-AD-01 chỉ nêu Stock/Sector/Ecosystem — Chủ đề empty card có cùng rule omit không? (Owner)
4. **BR-AD-03 attribution fields (sau AUD-AD-13):** canonical field cho publisher vs author; xử lý `VCCorp.vn` (vendor holding); `tier_label` còn ghép byline không; khi thiếu author → omit hay hiển thị gì (**không** fixed publisher); `Đăng`/`Cập nhật` giữ khi timestamp hợp lệ?
5. **MockMarket on Article Detail**: còn cần cho quotes trên sidebar sau khi entity SoT = Master không?

---

## Disposition Hints (không phải Solution)

| Item | Hint for Solution/Plan |
|------|------------------------|
| Empty sidebar cards | Conditional render omit section |
| excludeId wiring | Map to API `exclude_id` / filter before compose |
| FE linkify as primary | Migrate to ingestion + Stocks authority |
| FALLBACK VND/HCM | Remove as authority; add false-positive rules |
| RSS sectors/ecosystems `[]` | Populate via common pipeline or stop deriving from taxonomy-only |
| Dead relatedTo path | Align DailyFeed query with related_to OR category+exclude |
| Attribution lineage | SoT chọn canonical publisher/author; bỏ semantic `tier_label`=provider nếu conflict; **không** xóa DB chỉ để UI đẹp; **không** FE invent publisher |

---

## Owner / Reviewer lock-in (điền khi Approve)

- [ ] Approve Executive Verdict V1–V12 (gồm **V3 amended**)
- [ ] Approve Root Cause entity + Related
- [ ] Approve AUD-AD-13 / AUD-AD-14 evidence
- [ ] Confirm Open Decisions #3 (Chủ đề) và #4 (attribution field policy) nếu muốn khóa sớm
- [ ] Authorize mở [`03-SoT.md`](03-SoT.md)

| | |
|--|--|
| **Owner Approve** | ________________ |
| **Date** | ________________ |

---

*Mandatory Audit COMPLETE rev. B 2026-08-09 (BR-AD-03 amend + AUD-AD-13/14). Cấm Implementation. Không mở SoT/Solution ở bước này.*
