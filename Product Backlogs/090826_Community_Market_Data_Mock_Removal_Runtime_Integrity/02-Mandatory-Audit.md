# 02 — Mandatory Audit

# Community Market Data — Remove Mock Data & Runtime Market Data Integrity

| | |
|--|--|
| **Task ID** | `090826_Community_Market_Data_Mock_Removal_Runtime_Integrity` |
| **BRD** | [`01-BRD.md`](01-BRD.md) · §6 **BR-01…BR-20** · **28 Req ID** · BR-19/20 AMENDED 2026-08-09 |
| **Document** | Mandatory Audit — sinh từ **BR Checklist** (README §2.1/§2.3) + slices **AUD-MM-01…16** |
| **Date** | 2026-08-09 |
| **Evidence** | Repo `User_Web/iflux-web-ui` · Production API `iflux.vn` · DOM evidence Article sidebar · CSS spot-check |
| **Audit status** | ✅ **OWNER APPROVED** · rev. B · checklist **28/28** · AUD-MM-15/16 PARTIAL = **SoT input** (không sửa Audit để “đóng GAP”) |
| **Implementation** | ❌ **NOT AUTHORIZED** |
| **Next gate** | Solution **LOCKED** · [`05-Plan.md`](05-Plan.md) OPEN/DRAFT · Implementation NOT AUTHORIZED |

> Audit trả lời: **hiện trạng đối với từng BR / atomic là gì?**  
> Audit **không** thay đổi requirement BRD và **không** khóa Solution.  
> Form checklist: [`Product Backlogs Governance.md`](../Product%20Backlogs%20Governance.md) **§2.3**.

### Changelog rev. A → rev. B

| Thay đổi | Chi tiết |
|----------|----------|
| BR-19 / BR-20 | Đồng bộ BRD AMEND — Mock Asset Dead-Code + Reuse→Promote DS |
| Checklist | **18 → 28** hàng atomic |
| AUD-MM-15 / 16 | Thêm CSS/class inventory + DS equivalent (PARTIAL — thiếu full matrix) |
| Verdict V13–V15 | Ownership CSS ≠ mock data; không có `mock-market.css`; class runtime nằm `stock.css` / `community.css` / Admin DS |

---

## 0. Executive Verdict

| # | Finding | Severity | BR / AUD |
|---|---------|----------|----------|
| V1 | `IfluxMockMarket` / `mock-market.js` **vẫn load trên Production shell** (MARKET_CORE + MARKET_PLATFORM) — singleton global | 🔴 Critical | BR-08,14,15 · AUD-MM-01,08 |
| V2 | **≥35 FE files** reference `IfluxMockMarket` — mock vẫn là production market-value authority trên nhiều surface | 🔴 Critical | BR-14,15 · AUD-MM-02,13 |
| V3 | Community **stock chip/sidebar** (hotfix 2026-08-09): đã **cắt Mock fallback** → runtime `IfluxMarketQuotes` only — **PARTIAL** vs BR-15 (không đủ đóng toàn hệ thống) | 🟠 High | BR-01,02,09 · AUD-MM-03,04 |
| V4 | Community **Sector / Ecosystem / story perf** vẫn `getGroupPerformance` → Mock `getSectorPerf` / mock stock `change_pct` | 🔴 Critical | BR-03,04,13 · AUD-MM-05,06,09 |
| V5 | Community **Trending heatmap** vẫn `m.getStock` / Mock; missing → **`perf: 0`** (fake zero) | 🔴 Critical | BR-01,02,07 · AUD-MM-03,07 |
| V6 | Evidence DOM trước hotfix: TCB/VCB = **đúng Mock seed** (28.9/+2.15 · 92.1/+1.82); HDB/CMC trống — **CONFIRMED** mock authority | 🔴 Critical | BR-01,02,06 · AUD-MM-04 |
| V7 | Runtime stock quotes API **READY** (`GET /api/market/runtime/quotes`) — fields price/pctChange/change/state | 🟢 Ready | BR-05,11 · AUD-MM-10 |
| V8 | **Không** có runtime Sector/Ecosystem performance API (`/runtime/sectors` 404) — group perf hôm nay = Mock hoặc `pg:0` fake | 🔴 Critical | BR-03,04,05,13 · AUD-MM-09,10 |
| V9 | Stock page: **first paint Mock** `getStockDetail` → sau đó `enrichRealtime` runtime — dual source flash | 🟠 High | BR-01,02,06,14 · AUD-MM-07 |
| V10 | Prod `buildSectorSnapshot`: khi Master sectors load → **`ig:0, pg:0` hardcode** (fake zero), không aggregate runtime | 🔴 Critical | BR-03,07,13 · AUD-MM-05,09 |
| V11 | `buildStockCatalog`: mã Master không có seed → **invent `change_pct` từ hash**; seed ~32 mã hardcode price | 🔴 Critical | BR-01,02,08 · AUD-MM-01 |
| V12 | Test/demo isolation: mock **không** cô lập — load trực tiếp Prod host | 🔴 Critical | BR-16 · AUD-MM-08,11 |
| V13 | **Không** tồn tại file `mock-market.css` / class `.mock-stock-*` riêng — mock gắn **JS data**; UI class nằm `stock.css` / `community.css` / Admin DS | 🟠 High | BR-19 · AUD-MM-15 |
| V14 | Class runtime (vd `.ifx-stock-head*`, `.ifx-com-side-row*`, `.ix-stat-trend`) = **UI ownership ≠ mock data** — xóa theo tên “mock” sẽ **sai** | 🔴 Critical | BR-19.KEEP · BR-19.NONAME · BR-20.OWNER |
| V15 | **Full** consumer→DOM→CSS matrix + DS-equivalent map cho mọi market surface = **CHƯA ĐỦ** (AUDIT-15/16 PARTIAL) — SoT/Solution **không** được soft-pass DELETE CSS | 🔴 Critical | BR-19.TRACE · BR-20 · AUD-MM-15/16 |

### Root Cause (khóa cho BR-01…20)

```text
Ownership hiện tại (Production FE)

  Shell boot (MARKET_CORE | MARKET_PLATFORM)
        ↓
  mock-market.js → window.IfluxMockMarket
        ↓
  SNAPSHOT = hardcode seeds + (optional) Master identity merge
        ↓
  price / change_pct / sector.pg / index / breadth / flow …
        ↓
  Consumers (Community trending · Market widgets · Watchlist · …)
        ↓
  UI hiển thị số liệu giả hoặc lệch runtime

Song song (chỉ một phần surface):

  IfluxMarketQuotes → GET /api/market/runtime/quotes → stock_prices
        ↓
  Community stock chip/sidebar (sau hotfix) · Stock page header enrich · entity-list enrich

→ DUAL AUTHORITY cho cùng market fact (BR-14 GAP).
→ Sector/Eco: chỉ có Master identity API; không có runtime aggregate → Mock/`0` (BR-03/04/13 GAP).
→ CSS: không file mock-css riêng; dead-code = chủ yếu JS mock + class runtime ngoài DS chưa promote (BR-19/20).
```

---

## 0.1 BR Checklist Registry (xương sống — từ BRD §14)

| BR | Req ID | Requirement (chữ BRD) |
|----|--------|------------------------|
| BR-01 | BR-01 | No Mock Market Price in Production Runtime |
| BR-02 | BR-02 | No Mock Stock Change |
| BR-03 | BR-03 | No Mock Sector Performance |
| BR-04 | BR-04 | No Mock Ecosystem Performance |
| BR-05 | BR-05 | Runtime Authority (stock / sector / eco) |
| BR-06 | BR-06 | No Mock Fallback |
| BR-07 | BR-07 | No Fake Zero |
| BR-08 | BR-08 | No Hard-coded Production Market Catalog (quote ≠ identity) |
| BR-09 | BR-09 | Community Consumer Only |
| BR-10 | BR-10 | Source Consistency (cross Community surfaces) |
| BR-11 | BR-11 | Freshness contract |
| BR-12 | BR-12 | Market Data Availability State (REAL / UNAVAILABLE) |
| BR-13 | BR-13 | Sector/Ecosystem Aggregation Integrity |
| BR-14 | BR-14 | No Consumer-Specific Mock Authority |
| BR-15 | BR-15 | Mock Removal Completeness (toàn hệ thống) |
| BR-16 | BR-16 | Test/Demo Isolation |
| BR-17 | BR-17 | No Silent Regression |
| BR-18 | BR-18 | Data Integrity Over Visual Completeness |
| BR-19 | BR-19.TRACE | Trace consumer→DOM/class→CSS trước DELETE\|REUSE\|KEEP |
| BR-19 | BR-19.DEL | DELETE artifact chỉ phục vụ mock |
| BR-19 | BR-19.KEEP | KEEP/REUSE class còn runtime consumer |
| BR-19 | BR-19.NONAME | Cấm xóa CSS chỉ vì tên “mock” |
| BR-19 | BR-19.NOFALL | Cấm mock fallback ngầm sau chuyển runtime |
| BR-20 | BR-20.OWNER | Mock-data ownership ≠ UI-component ownership |
| BR-20 | BR-20.PROMOTE | Reuse → Promote ownership vào Design System |
| BR-20 | BR-20.REUSE-DS | Có DS equivalent → REUSE DS |
| BR-20 | BR-20.NOBULK | Cấm bulk-migrate mock CSS sang DS |
| BR-20 | BR-20.MIGRATE | Migrate consumers → DELETE legacy |

**Coverage:** **28/28** Req ID · không gộp · không sinh checklist từ code inventory.

---

# 1. Audit Checklist (form README §2.3)

> **Status** = hiện trạng vs Req: `MATCH` / `PARTIAL` / `GAP` — **không** = Implementation DONE.  
> Evidence A = Static code · B = DB/API contract · C = Runtime/UI.  
> Shared slice (AUD-MM-*) reference nhiều BR — mỗi BR Status riêng.

| BR | Req ID | BR Requirement | Audit ID | Audit Check | Evidence A (Static) | Evidence B (DB/API) | Evidence C (Runtime/UI) | Current vs Req | Status |
|----|--------|----------------|----------|-------------|---------------------|---------------------|-------------------------|-----------------|--------|
| BR-01 | BR-01 | No mock stock price | AUD-MM-01 · AUD-MM-02 · AUD-MM-04 | Price từ mock seed/catalog? | A: `buildStockCatalog` seeds price; nhiều consumer `getStock`/`getSnapshot` | B: runtime quotes ≠ mock seeds | C: DOM TCB 28.9 = mock (pre-fix); nhiều widget vẫn mock | Mock vẫn authority ngoài Community stock path | **GAP** |
| BR-02 | BR-02 | No mock stock change | AUD-MM-01 · AUD-MM-02 · AUD-MM-04 | change_pct từ mock? | A: seeds `change_pct`; hash invent khi thiếu seed | B: runtime `pctChange` khác mock | C: TCB +2.15% = mock seed | Mock change còn trên trending/widgets | **GAP** |
| BR-03 | BR-03 | No mock sector performance | AUD-MM-05 · AUD-MM-09 | Sector perf từ mock? | A: `getSectorPerf` / `buildSectorSnapshot`; Community `getGroupPerformance('sector')` | B: không `/runtime/sector*` | C: Prod sector `pg:0` hardcode khi Master load | Mock / fake-0 | **GAP** |
| BR-04 | BR-04 | No mock ecosystem performance | AUD-MM-06 · AUD-MM-09 | Eco perf từ mock? | A: `getGroupPerformance('family')` aggregate mock stocks; `getGroupDetail` | B: master ecosystems identity only | C: sidebar eco % từ mock avg | Mock-derived | **GAP** |
| BR-05 | BR-05 | Runtime authority rõ từng loại | AUD-MM-10 · AUD-MM-14 | Authority đã SoT? | A: dual `IfluxMockMarket` + `IfluxMarketQuotes`; không SoT task này | B: quotes OK; sector/eco runtime **thiếu** | C: N/A SoT chưa mở | Stock runtime sẵn; group **chưa** | **GAP** |
| BR-06 | BR-06 | No real→mock fallback | AUD-MM-07 | Fallback matrix? | A: Community stock: đã cấm mock fallback; Stock page first-paint mock; trending mock primary | B: N/A | C: pre-fix Community = mock khi cache trống | Fallback vẫn tồn tại ngoài path đã cắt | **GAP** |
| BR-07 | BR-07 | No fake zero | AUD-MM-07 · AUD-MM-05 | unknown→0? | A: trending `perf: 0`; sector snapshot `pg:0`/`ig:0` | B: HDB runtime pct=0 là giá trị thật (khác fake) | C: heatmap missing→0 | Fake zero CONFIRMED | **GAP** |
| BR-08 | BR-08 | No hard-coded market catalog authority | AUD-MM-01 · AUD-MM-08 | Catalog seed authority? | A: ~32 ticker price seeds; index/breadth hardcode trong snapshot | B: Master stocks identity riêng | C: seed prices hiển thị Prod | Quote catalog hardcode | **GAP** |
| BR-09 | BR-09 | Community consume only | AUD-MM-03 | Community seed/override? | A: stock path runtime-only sau hotfix; trending/overview/group perf vẫn mock; manifest `requiresShell: IfluxMockMarket` | B: N/A | C: Community vẫn boot mock module | Partial — vẫn phụ thuộc mock module + group/trending | **PARTIAL** |
| BR-10 | BR-10 | Cross-surface consistency | AUD-MM-03 · AUD-MM-13 | Cùng ticker cùng source? | A: Article chip→quotes; Trending→mock; Stock page→mock then quotes | B: cùng API quotes | C: có thể lệch giữa surfaces | Dual source | **GAP** |
| BR-11 | BR-11 | Freshness | AUD-MM-10 | Freshness contract? | A: quotes TTL 5 phút trong `iflux-market-quotes.js`; mock snapshot tĩnh + `tickRealtime` giả | B: quote `date` = trading day (vd 2026-08-06) | C: N/A formal contract | Runtime có TTL; mock không freshness thật | **PARTIAL** |
| BR-12 | BR-12 | REAL vs UNAVAILABLE | AUD-MM-07 · AUD-MM-12 | Explicit unavailable? | A: Community stock: empty/`—` khi không quote; nhiều widget không có state UNAVAILABLE rõ | B: N/A | C: HDB trống (pre-fix) trông như “không có” nhưng TCB hiện số giả | Không đồng nhất | **GAP** |
| BR-13 | BR-13 | Group aggregation từ constituent thật | AUD-MM-09 | Aggregate real? | A: avg mock `change_pct`; sector `pg:0` | B: không API aggregate | C: N/A real aggregate | Không | **GAP** |
| BR-14 | BR-14 | No consumer-specific mock authority | AUD-MM-02 · AUD-MM-13 | Community≠Market authority? | A: Community stock→runtime; Market widgets→mock; Stock page dual | B: N/A | C: cùng FPT khác số theo surface | Vi phạm | **GAP** |
| BR-15 | BR-15 | Mock removal completeness | AUD-MM-02 · AUD-MM-11 | Toàn consumer sạch? | A: 39 files còn reference; shell vẫn load mock | B: N/A | C: Prod vẫn serve `mock-market.js` | Không hoàn tất | **GAP** |
| BR-16 | BR-16 | Test/demo isolation | AUD-MM-08 · AUD-MM-11 | Mock chỉ test? | A: load trên `iflux.vn` shell-boot; không gate test-only | B: N/A | C: Prod bundle có mock | Leak Prod | **GAP** |
| BR-17 | BR-17 | No silent regression | AUD-MM-08 | Boundary ngăn import mới? | A: không lint/CI cấm `IfluxMockMarket`; widgets vẫn declare dep mock | B: N/A | C: N/A | Không boundary | **GAP** |
| BR-18 | BR-18 | Integrity > visual completeness | AUD-MM-04 · AUD-MM-14 | Ưu tiên số giả? | A: mock fallback từng tồn tại để “đủ số”; trending `perf:0` để tile đầy | B: N/A | C: UI từng hiện mock trông như thật | Vi phạm tinh thần BR | **GAP** |
| BR-19 | BR-19.TRACE | Trace trước DELETE | AUD-MM-15 | Có full consumer→class→CSS matrix? | A: spot-check một phần; **chưa** matrix toàn surface | B: N/A | C: N/A | Thiếu matrix đủ | **GAP** |
| BR-19 | BR-19.DEL | DELETE mock-only artifacts | AUD-MM-15 · AUD-MM-01 | Mock-only CSS/JS đã xóa? | A: `mock-market.js` còn; không file mock-css riêng | B: N/A | C: Prod vẫn load mock JS | Chưa DELETE | **GAP** |
| BR-19 | BR-19.KEEP | KEEP runtime class | AUD-MM-15 | Class runtime bị đe dọa xóa mù? | A: `.ifx-stock-head*`, `.ifx-com-side-row*`, `.ix-stat-trend` còn consumer | B: N/A | C: UI thật dùng | Phải KEEP — risk nếu DELETE theo tên | **PARTIAL** (rule rõ; chưa có gate impl) |
| BR-19 | BR-19.NONAME | Cấm xóa theo tên mock | AUD-MM-15 | Có policy/evidence chống xóa-theo-tên? | A: BRD Rule 6; Audit ghi nhận; chưa có CI | B: N/A | C: N/A | Policy ở BRD; chưa enforce | **PARTIAL** |
| BR-19 | BR-19.NOFALL | Không mock fallback ngầm | AUD-MM-07 · AUD-MM-03 | Fallback mock còn? | A: Community stock cắt; nhiều surface vẫn mock primary | B: N/A | C: trending/widgets mock | Còn fallback/primary mock | **GAP** |
| BR-20 | BR-20.OWNER | Ownership data ≠ UI | AUD-MM-15 · AUD-MM-16 | Phân biệt được? | A: V13–V14 — mock = JS data; UI class ở CSS khác | B: N/A | C: N/A | Audit hiểu; chưa catalog đủ | **PARTIAL** |
| BR-20 | BR-20.PROMOTE | Promote vào DS | AUD-MM-16 | Class runtime ngoài DS đã promote? | A: market UI class nằm `stock.css`/`community.css` — ngoài DS Studio catalog | B: N/A | C: N/A | Chưa promote | **GAP** |
| BR-20 | BR-20.REUSE-DS | Reuse DS equivalent | AUD-MM-16 | Chip/price/change dùng DS? | A: `.ix-chip` / `.ix-stat-trend` = Admin DS; User Web còn `.ifx-*` ad-hoc | B: N/A | C: mixed | Partial reuse DS atoms | **PARTIAL** |
| BR-20 | BR-20.NOBULK | Cấm bulk mock→DS | AUD-MM-16 | Có bulk migrate sai? | A: chưa migrate — baseline không vi phạm bulk | B: N/A | C: N/A | Chưa vi phạm (pre-impl) | **MATCH** |
| BR-20 | BR-20.MIGRATE | Migrate + xóa legacy | AUD-MM-16 | Legacy dual-owner? | A: chưa promote → chưa migrate | B: N/A | C: N/A | Chưa thực hiện | **GAP** |

**Tổng hợp:** **28/28** · **MATCH** 1 (`BR-20.NOBULK`) · **PARTIAL** 5 · **GAP** 22.  
**Không** = BR Implementation PASS.

### Audit gaps còn thiếu (phải đóng trước Solution soft-pass CSS)

| Gap ID | Thiếu gì | Blocks |
|--------|----------|--------|
| G-CSS-01 | Full matrix class×CSS file×renderer×surface (AUD-MM-15) | BR-19.TRACE · BR-19.DEL · BR-19.KEEP |
| G-CSS-02 | DS equivalent map cho từng REUSE candidate (AUD-MM-16) | BR-20.PROMOTE · BR-20.REUSE-DS |
| G-CSS-03 | Quyết định Admin DS vs User Web DS owner cho market primitives | BR-20 · SoT |
| G-AGG-01 | Sector/Eco runtime aggregate authority (đã ghi AUD-MM-10) | BR-03,04,05,13 |

---

## 1.1 Supporting Audit slices (AUD-MM-01…16) — index (= BRD §8)

| Audit ID | BRD AUDIT | Primary BR served | Status |
|----------|-----------|-------------------|--------|
| AUD-MM-01 | AUDIT-01 Mock Inventory | BR-01,02,08 | COMPLETE |
| AUD-MM-02 | AUDIT-02 Consumer Inventory | BR-14,15 | COMPLETE |
| AUD-MM-03 | AUDIT-03 Community Runtime Path | BR-09,10 | COMPLETE |
| AUD-MM-04 | AUDIT-04 Stock Quote Evidence | BR-01,02,06 | COMPLETE |
| AUD-MM-05 | AUDIT-05 Sector Path | BR-03,13 | COMPLETE |
| AUD-MM-06 | AUDIT-06 Ecosystem Path | BR-04,13 | COMPLETE |
| AUD-MM-07 | AUDIT-07 Fallback Matrix | BR-06,07,12 | COMPLETE |
| AUD-MM-08 | AUDIT-08 Production Boundary | BR-15,16,17 | COMPLETE |
| AUD-MM-09 | AUDIT-09 Group Aggregation | BR-13 | COMPLETE |
| AUD-MM-10 | AUDIT-10 Real Data Readiness | BR-05,11 | COMPLETE |
| AUD-MM-11 | AUDIT-11 Existing Mock Dependency | BR-15,16 | COMPLETE |
| AUD-MM-12 | AUDIT-12 Mock Data Leakage | BR-12,16 | COMPLETE |
| AUD-MM-13 | AUDIT-13 Regression Surface | BR-14,15 | COMPLETE |
| AUD-MM-14 | AUDIT-14 Data Integrity Verdict | BR-01…18 | COMPLETE |
| AUD-MM-15 | AUDIT-15 CSS/Class/DOM Inventory | BR-19 | **PARTIAL** — spot-check; thiếu full matrix |
| AUD-MM-16 | AUDIT-16 DS Equivalent & Promote | BR-20 | **PARTIAL** — samples; thiếu map đủ |

---

# 2. AUD-MM Results (evidence)

## AUD-MM-01 — Mock Inventory

| Asset | Location | Market-value fields |
|-------|----------|---------------------|
| Provider module | `User_Web/iflux-web-ui/mock-market.js` → `window.IfluxMockMarket` | price, change_pct, sector ig/pg, index, breadth, flow, heatmap, charts (synthetic) |
| Stock seed catalog | `buildStockCatalog` ~32 tickers hardcode price/change | FPT 128.5, HPG 28.45, VCB 92.1, TCB 28.9, … |
| Invented change | `buildStock` khi thiếu seed: `change_pct` từ hash | Fake % cho mã Master không seed |
| Sector snapshot | `buildSectorSnapshot` | Non-prod hardcode ig/pg; **Prod Master path → ig/pg = 0** |
| Index / exchanges | snapshot `vnindex`/`hose`/`hnx`/`upcom` | Hardcode value + change_pct |
| Runtime quotes client (không phải mock) | `iflux-market-quotes.js` | `/api/market/runtime/quotes` — **authoritative candidate cho stock** |

---

## AUD-MM-02 — Consumer Inventory (Production FE)

> Mapping: Mock source → Consumer → Data used → Production? → Replacement candidate *(không khóa Solution)*.

| Mock source | Consumer (file) | Data used | Production? | Replacement candidate (Audit only) |
|-------------|-----------------|-----------|-------------|-------------------------------------|
| `getSnapshot` / `getStock` | `community-trending.js` | change_pct, heatmap | Yes | Runtime quotes + unavailable |
| `getSectorPerf` / snapshot stocks | `community-ui.js` `getGroupPerformance` | sector/eco/story % | Yes | SoT aggregate TBD |
| `getSnapshot` | `community-market-overview.js` | overview metrics | Yes | Runtime / Master |
| `getSnapshot` | `widgets/community-stock-heat` | heat | Yes | Runtime |
| `getStock` / detail | `stock-page.js` (first paint) | price, change | Yes | Quotes (đã có enrich) |
| `getSnapshot` + quotes | `entity-list-page.js` | list + enrich quotes | Yes | Quotes primary |
| `getStock` / `getStockInfo` / `getGroupDetail` | `entity-detail-center.js`, `group-page.js` | member %, group % | Yes | Quotes + SoT aggregate |
| `getSnapshot` | `watchlist-store.js`, `watchlist-ui.js`, `watchlist-block.js` | price/chg | Yes | Quotes |
| `getSnapshot` | `widget-renderers.js`, `dashboard-engine.js` | widget metrics | Yes | Quotes / SoT |
| `getBreadth` / exchanges | `breadth-block.js`, `market-status-bar.js` | breadth, session | Yes | Runtime status TBD |
| `getHeatmapGroups` | `market-heatmap.js` | heat | Yes | Runtime TBD |
| `getFlowTopNetList` | `flow-net-top.js`, flow widgets | flow | Yes | Runtime TBD |
| liquidity / rankings | `market-liquidity.js`, `market-rankings.js` | series/ranks | Yes | Runtime TBD |
| `getSnapshot` | `alert-ui.js`, `alert-store.js` | price triggers UI | Yes | Quotes |
| deps / load | `shell-boot.js`, manifests, widgets `index.js` | module load | Yes | Remove/replace load |
| taxonomy bridge | `watchlist-taxonomy.js` | group tickers via mock | Yes | Master/taxonomy only (identity) |
| search | `iflux-header-search.js`, `search-page-inline.js`, `stock-mentions.js` | snapshot/search | Yes | Master + quotes |

**Count:** ~**39** `.js` paths reference `IfluxMockMarket` under `User_Web` (kể cả provider + bridge).

---

## AUD-MM-03 — Community Runtime Path

```text
Shell boot MARKET_CORE
  → load mock-market.js + taxonomy + seo
Feature PF-community
  → requiresShell: IfluxMockMarket
  → modules: iflux-market-quotes.js + community-ui.js + daily-feed…

Article Detail (WGT-COM-POST-PAGE)
  → prefetchTickerQuotes / hydrateTickerQuotes
  → getStockQuote = peekQuote ONLY (no Mock)   ← hotfix 2026-08-09
  → sidebarTickerRows / tickerTagHtml
  → getGroupPerformance (sector/eco/story) = Mock  ← STILL

Article List / Feed
  → postTagsHtml → tickerTagHtml → runtime after hydrate
  → trending widget → Mock getStock / fake 0

Community still boots Mock module even when stock chips use quotes.
```

| Node | Owner | Market value source today |
|------|-------|---------------------------|
| Stock chip / sidebar rows | `community-ui.js` | **Runtime quotes** (post-hotfix) |
| Sector / Eco / story sidebar % | `community-ui.js` `getGroupPerformance` | **Mock** |
| Trending / stock heat | `community-trending.js` | **Mock** (+ fake 0) |
| Market overview widget | `community-market-overview.js` | **Mock** |

---

## AUD-MM-04 — Stock Quote Evidence (Mock vs Runtime vs Displayed)

| Ticker | Mock seed | Runtime API (2026-08-09) | Displayed (Article sidebar — evidence pre-hotfix) |
|--------|-----------|---------------------------|-----------------------------------------------------|
| FPT | 128.5 · +1.45% | 70.8 · +0.14% | (pattern) mock khi fallback |
| HPG | 28.45 · +2.57% | 22 · +0.69% | (pattern) mock khi fallback |
| VHM | 42.8 · +0.71% | 73 · −5.32% | (pattern) mock khi fallback |
| TCB | **28.9 · +2.15%** | 29.7 · +1.71% | **28.9 · +2.15%** = Mock |
| VCB | **92.1 · +1.82%** | 59.7 · +1.19% | **92.1 · +1.82%** = Mock |
| HDB | *(không seed)* | 26.55 · 0% | **trống** |
| CMC | *(không seed; seed là CMG)* | 8.7 · 0% | **trống** |

**Verdict:** Displayed TCB/VCB **= Mock authority** (CONFIRMED). HDB/CMC empty vì ngoài seed + chưa hydrate runtime (pre-fix).

---

## AUD-MM-05 — Sector Path

```text
Sector UI / Community sector row
  → getGroupPerformance('sector'|…)
  → IfluxMockMarket.getSectorPerf(id) → { pg, ig, … }
  → OR average of mock stocks in taxonomy group
```

Prod `buildSectorSnapshot` khi có `_masterSectors`:

```text
ig: 0, pg: 0, breadth_up: 0, breadth_down: 0
```

→ **Fake zero performance** gắn identity Master (BR-07 + BR-03).

API: `GET /api/market/master/sectors` = identity · **không** performance.  
`GET /api/market/runtime/sectors` → **404**.

---

## AUD-MM-06 — Ecosystem Path

```text
Ecosystem / family sidebar
  → getGroupPerformance('family', id)
  → taxonomy.getGroupTickers
  → average mock snapshot stocks[].change_pct
```

Master ecosystems API = identity + ticker list · **không** performance field runtime.

---

## AUD-MM-07 — Fallback Matrix

| When runtime missing | What happens today | Classification |
|----------------------|--------------------|----------------|
| Community stock chip (post-hotfix) | empty / no % ; sidebar `—` | empty / unavailable *(đúng hướng BR-06)* |
| Community stock (pre-hotfix) | Mock seed if ticker∈seed else empty | **mock** |
| Community trending missing stock | `perf: 0` | **fake zero** |
| Sector Master path | `pg: 0` | **fake zero** |
| Stock page before enrich | Mock `getStockDetail` | **mock** |
| Quotes API fail (Community hydrate) | silent catch → empty | empty |
| Watchlist / widgets | Mock snapshot primary | **mock** |
| Hash invent change for non-seed Master stock | synthetic % | **hard-coded invent** |

---

## AUD-MM-08 — Production Boundary

| Mechanism | Evidence |
|-----------|----------|
| Shell load | `runtime/shell-boot.js` MARKET_CORE + MARKET_PLATFORM → `mock-market.js` trên **iflux.vn** |
| Feature require | `features/community.manifest.js`, `stock.manifest.js`, `flow.manifest.js` → `requiresShell: IfluxMockMarket` |
| Widget deps | watchlist, heatmap, breadth, overview, flow-subj-net, community-stock-heat, trend-line… |
| Skip duplicate | `legacy-bridge.js` SHELL_PLATFORM_SKIP `/mock-market.js` |
| Test isolation | **Không** — cùng module Prod |

---

## AUD-MM-09 — Group Aggregation

| Group | How performance is produced today | Real constituent quotes? |
|-------|-----------------------------------|--------------------------|
| Sector | `getSectorPerf` → hardcoded 0 on Prod Master path; or mock fallback non-prod | **No** |
| Ecosystem/family | Mean of mock `change_pct` for taxonomy tickers | **No** (mock constituents) |
| Story | Mean mock stocks in story group | **No** |

**Không** có DB/cached real aggregation API evidence trên Prod.

---

## AUD-MM-10 — Real Data Readiness

| Capability | Status | Notes |
|------------|--------|-------|
| Stock quotes | **READY** | `GET /api/market/runtime/quotes?tickers=` → price, pctChange, change, state, OHLC fields; source `stock_prices` / vndirect_finfo |
| Stock OHLC | READY (client exists) | `getOHLC` trên `IfluxMarketQuotes` |
| Sector performance runtime | **NOT READY** | 404 |
| Ecosystem performance runtime | **NOT READY** | no endpoint found |
| Coverage | Stock samples FPT/HPG/VHM/TCB/HDB/CMC OK | date = last trading session in meta |
| Missing ticker | map omit key | FE phải UNAVAILABLE — không mock |

→ Stock consumers **có thể** chuyển runtime ngay (Audit). Sector/Eco **cần SoT** định nghĩa aggregation trước Solution.

---

## AUD-MM-11 — Existing Mock Dependency (classify)

| Class | Consumers (examples) |
|-------|----------------------|
| **REPLACE** (market value) | trending, heatmap, breadth, rankings, watchlist quotes, widget-renderers, stock-page first paint, group/entity %, community overview/heat, flow net, liquidity, alerts price UI, market-status-bar |
| **REPLACE** (Community group %) | `getGroupPerformance` |
| **KEEP — NON-MARKET IDENTITY ONLY** (candidate) | `ensureMasterReady` / `getMasterStocks|Sectors|Ecosystems` *nếu* tách khỏi quote API — **SoT quyết định**; hôm nay gói chung trong `IfluxMockMarket` |
| **KEEP — TEST ONLY** | *không tồn tại hôm nay* — cần tạo isolation |
| **REMOVE** (production authority) | hardcode seeds price/change; invent hash %; index hardcode; sector pg:0 as “performance” |

---

## AUD-MM-12 — Mock Data Leakage

| Sink | Leak? |
|------|-------|
| DOM | **Yes** — price/chg/index/breadth/heatmap from mock |
| FE store/cache | Mock snapshot singleton; quotes cache riêng |
| Global | `window.IfluxMockMarket` |
| API response (backend) | **Not evidenced** as mock — backend quotes real |
| Generated payload to server | Not primary path for mock prices |

---

## AUD-MM-13 — Regression Surface (code-evidence)

Phải verify sau removal (danh sách từ consumer inventory):

```text
Community: article detail, feed chips, trending, market overview, stock heat
Market: stock page, entity list/detail, group/sector/eco pages
Dashboard / Nhà: dashboard-engine, widget-renderers
Watchlist: store, ui, block, widget
Heatmap / Breadth / Rankings / Liquidity / Status bar
Flow: flow-net-top, flow-market-sidebar, flow widgets
Search / Header search / stock-mentions
Alerts UI
Shell boot / feature manifests
```

---

## AUD-MM-14 — Data Integrity Verdict

| Finding | Verdict |
|---------|---------|
| Community dùng mock price | **CONFIRMED** (pre-hotfix path + trending/overview); stock chip/sidebar **PARTIAL fixed** post-hotfix |
| Community dùng mock change | **CONFIRMED** (cùng) |
| Sector dùng mock performance | **CONFIRMED** (Mock `getSectorPerf` / `pg:0`) |
| Ecosystem dùng mock performance | **CONFIRMED** (avg mock constituents) |
| Mock fallback tồn tại | **CONFIRMED** (nhiều surface; Community stock fallback **removed**) |
| Runtime authority đã đủ | **PARTIAL** — stock quotes **đủ**; sector/eco runtime aggregate **thiếu** |
| Production mock dependency | **CONFIRMED** |
| Test-only mock isolation | **NOT CONFIRMED** (không cô lập) |

---

## AUD-MM-15 — CSS / Class / DOM Artifact Inventory (BR-19) · PARTIAL

**Mục tiêu BRD AUDIT-15:** mapping từng hàng `Class → CSS owner → DOM/renderer → runtime còn dùng? → DELETE|REUSE|PROMOTE|KEEP|NOT EVIDENCED`.

### 15.1 Spot-check evidence (A = repo)

| Finding | Evidence |
|---------|----------|
| **Không** có `mock-market.css` | `ls User_Web/iflux-web-ui/*mock*` → chỉ `mock-market.js`, `flow-score-top-mock.js` |
| **Không** thấy selector `.mock-stock-*` / `.mock-market-*` trong CSS | rg CSS: empty; mock gắn **JS data** (`IfluxMockMarket`) |
| Mock JS vẫn Prod authority | `shell-boot` + manifests require `IfluxMockMarket` (AUD-MM-01/08) |
| UI class market/community nằm file feature CSS | `stock.css`, `community.css`, `market-components.css`, `app-shell.css` |
| Một phần atom đã ở Admin DS | `.ix-stat-trend` trong `Admin_Design_system/iflux-admin-ui/typography.css` + `components.css`; Community tags cũng reference |

### 15.2 Sample matrix (KHÔNG đủ đóng BR-19.TRACE)

| Class / selector | CSS file (owner hôm nay) | DOM / renderer consumer | Production runtime còn dùng? | Decision candidate |
|------------------|--------------------------|-------------------------|------------------------------|--------------------|
| *(n/a — không có `.mock-stock-*`)* | — | — | — | **NOT EVIDENCED** as CSS artifact |
| `window.IfluxMockMarket` / `mock-market.js` | JS module | shell + ~39 FE consumers | **Yes** (value authority) | **DELETE** authority path (BR-19.DEL / BR-15) — identity bridge = SoT D2 |
| `.ifx-stock-head*` / `__price` / `__chg` | `User_Web/iflux-web-ui/stock.css` | stock page head quote | **Yes** | **REUSE** → BR-20 evaluate promote |
| `.ifx-com-side-row*` / `__val` | `community.css` | Article sidebar entity rows | **Yes** | **REUSE** → BR-20 |
| `.ix-stat-trend` (+ `.up`/`.down`) | Admin DS `typography.css` / `components.css`; also used in `community.css` tags | chips / stat trend | **Yes** | **REUSE-DS** (đã trong DS) |
| `.ifx-market-header*` / `__val` | `market-components.css` | market header metrics | **Yes** | **REUSE** → BR-20 |
| `.ifx-market-status*` | `app-shell.css` | shell market status | **Yes** | **REUSE** → BR-20 |
| Hardcoded hex in `stock.css` ceiling/floor | `stock.css` L119–122 | stock quote states | **Yes** | **NOT EVIDENCED** for DELETE; DS token gap (escalate — không tự chế) |

### 15.3 Verdict BR-19 (Audit)

| Finding | Verdict |
|---------|---------|
| Có file CSS riêng chỉ-mock (`mock-market.css`) | **NOT CONFIRMED** — không tồn tại |
| Class chỉ-mock (`.mock-stock-*`) trong CSS | **NOT CONFIRMED** |
| Dead mock **JS** producer còn load Prod | **CONFIRMED** |
| Class runtime còn consumer | **CONFIRMED** (samples trên) |
| Full consumer→DOM→CSS matrix đủ DELETE an toàn | **NOT CONFIRMED** — **G-CSS-01 mở** |
| Xóa theo tên “mock” sẽ an toàn? | **FAIL nếu làm** — vi phạm BR-19.NONAME / BR-19.KEEP |

**Status slice:** **PARTIAL** — đủ để khóa nguyên tắc + mẫu; **không** đủ soft-pass Solution DELETE CSS.

---

## AUD-MM-16 — Design System Equivalent & Promote Candidates (BR-20) · PARTIAL

**Mục tiêu BRD AUDIT-16:** với mọi REUSE từ AUD-MM-15 → DS equivalent? Gap? Promote path?

### 16.1 Sample map

| Class | Runtime consumer | DS equivalent tồn tại? | Gap | Promote / Reuse path |
|-------|------------------|------------------------|-----|----------------------|
| `.ix-stat-trend` | Community tags / Admin stats | **YES** — Admin DS | — | **REUSE DS** (BR-20.REUSE-DS) |
| `.ifx-stock-head__price` / `__chg` | Stock page | **PARTIAL** — pattern gần `.ix-stat-value` / `.ix-stat-trend`; chưa register User Web SoT | Ownership User Web vs Admin | **PROMOTE** candidate → User Web DS (`ifx-*`) *sau* Owner/SoT chốt |
| `.ifx-com-side-row*` | Article sidebar | **NO** clear DS card/row primitive mapped | Ad-hoc `community.css` | **PROMOTE** candidate hoặc map sang Block/Item DS — **SoT** |
| `.ifx-market-header__val` | Market header | **PARTIAL** — dùng token `--ix-success/danger` nhưng class ngoài DS Studio | Feature CSS | **PROMOTE** candidate |
| `.ifx-market-status*` | App shell | **NO** clear catalog entry | Shell CSS | **PROMOTE** candidate / KEEP shell ownership — **SoT** |
| Mock-only CSS bulk | — | — | — | **NOBULK** — **MATCH** (chưa migrate; cấm bulk) |

### 16.2 Verdict BR-20 (Audit)

| Finding | Verdict |
|---------|---------|
| Class runtime nằm ngoài DS SoT | **CONFIRMED** (`stock.css` / `community.css` / `market-components.css`) |
| DS equivalent cho chip/price/change | **PARTIAL** — `.ix-stat-trend` có; stock/community primitives chưa đủ |
| Promote candidates đã inventory đủ | **NOT CONFIRMED** — **G-CSS-02 mở** |
| Admin DS vs User Web DS owner cho market primitives | **NOT CONFIRMED** — **G-CSS-03 / D6** |
| Bulk mock→DS đã xảy ra? | **NOT CONFIRMED** (chưa) → checklist **BR-20.NOBULK = MATCH** baseline |

**Status slice:** **PARTIAL**.

---

# 3. Open Decisions → SoT inputs (Audit không chốt · không sửa Audit để PASS)

> Owner 2026-08-09: **không** quay lại Audit để biến GAP thành PASS.  
> Chi tiết agenda + blocker D1: [`03-SoT.md`](03-SoT.md).

| Gap / Decision | Xử lý tiếp |
|----------------|------------|
| **G-CSS-01** | SoT/Solution: full consumer→DOM→CSS matrix trước DELETE |
| **G-CSS-02** | SoT/Solution: DS-equivalent map trước REUSE/PROMOTE |
| **G-CSS-03** / **D6** | SoT: User Web DS / Admin DS / shared |
| **G-AGG-01** / **D1** | SoT: Sector/Eco authority + aggregation — **architecture blocker** |
| **D2…D5, D7** | SoT decisions (xem `03-SoT.md`) |

**Khóa Audit:** `Stock runtime READY ≠ Market runtime READY.`

---

# 4. Governance Status

| Phase | Status |
|-------|--------|
| 01 — BRD | 🔒 **LOCKED** |
| **02 — Mandatory Audit** | ✅ **APPROVED** · rev. B |
| 03 — SoT | 🔒 **OWNER LOCKED** · D1–D7 — [`03-SoT.md`](03-SoT.md) |
| 04 — Solution | 🔒 **OWNER LOCKED** — [`04-Solution.md`](04-Solution.md) |
| 05 — Plan | 🔒 **OWNER LOCKED** — [`05-Plan.md`](05-Plan.md) |
| Implementation | ✅ **AUTHORIZED** — WP-0…7 |

### Owner Approval (2026-08-09)

> **APPROVE Mandatory Audit rev. B.** Audit 28/28 Req đã hoàn tất và đủ evidence để mở Phase 03 — SoT. Các GAP còn lại (G-CSS-01/02/03, G-AGG-01) được giữ nguyên là **SoT/Solution inputs**, không được soft-pass hoặc tự diễn giải thành Implementation authorization. Đặc biệt, không DELETE CSS/class theo tên “mock”; mọi REUSE/PROMOTE phải qua ownership + consumer→DOM→CSS trace và DS-equivalent mapping theo BR-19/BR-20.

---

*Mandatory Audit rev. B · OWNER APPROVED 2026-08-09 · form Product Backlogs Governance §2.3 · 28 Req ID · Implementation NOT AUTHORIZED.*
