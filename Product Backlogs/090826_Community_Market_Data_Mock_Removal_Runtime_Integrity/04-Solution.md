# 04 — Solution

# Community Market Data — Remove Mock Data & Runtime Market Data Integrity

| | |
|--|--|
| **Task ID** | `090826_Community_Market_Data_Mock_Removal_Runtime_Integrity` |
| **BRD** | [`01-BRD.md`](01-BRD.md) · 🔒 LOCKED |
| **Audit** | [`02-Mandatory-Audit.md`](02-Mandatory-Audit.md) · ✅ APPROVED |
| **SoT** | [`03-SoT.md`](03-SoT.md) · 🔒 OWNER LOCKED — **không mở lại** |
| **Document** | Solution — L1–L5 PASS (Owner Decision 2026-08-09) |
| **Date** | 2026-08-09 |
| **Status** | 🔒 **OWNER LOCKED** · L1–L5 PASS · Owner 2026-08-09 |
| **Governance** | [`Product Backlogs Governance.md`](../Product%20Backlogs%20Governance.md) §2.5 |
| **Implementation** | ✅ **AUTHORIZED** — WP-0…7 |
| **Next** | [`05-Plan.md`](05-Plan.md) 🔒 LOCKED · Implementation WP-0…7 |

> **Owner LOCK Solution (2026-08-09):** L1–L5 PASS. Cho phép mở Plan.  
> **Không** = Implementation Authorization.  
> **Reuse SOL-* được · merge BR ID = CẤM.**

---

## 0. Owner Decision — Final Gate Direction (tóm tắt)

| Gate | Decision owner | Status |
|------|----------------|--------|
| **L1** | AI | ✅ **PASS** |
| **L2** | AI theo BR/SoT | ✅ **PASS** |
| **L3** | AI theo business semantic | ✅ **PASS** |
| **L4** | AI từ inventory | ✅ **PASS** |
| **L5** | AI | ✅ **PASS** |

```text
L1–L5 PASS
    ↓
Owner review Solution
    ↓
LOCK 04-Solution
    ↓
mở 05-Plan
```

---

## 1. SoT constraints (không mở lại)

| ID | Constraint |
|----|------------|
| D1 | Non-authority performance → UNAVAILABLE; không FE aggregate / API mới / mock |
| D2 | Remove `IfluxMockMarket` sau migrate; identity = Master/DB |
| D3 | Schedule → Sync → DB → Runtime/API → UI; không Freshness Contract |
| D4 | REAL \| UNAVAILABLE; không `0` / mock |
| D5 | Phased OK; boundary từ inventory |
| D6/D7 | Equivalence trước tạo mới; matrix = evidence không bulk migrate |

### Data rule

```text
Có authority + có data thật → REAL
Không có authority / chưa có data thật → UNAVAILABLE
CẤM: mock · fake 0 · FE aggregate · API seed giả làm runtime authority
```

### Authority đã chốt (L2)

```text
Stock identity     → /api/market/master/*
Stock price/change → stock_prices → /api/market/runtime/quotes → IfluxMarketQuotes
Non-quote metrics không runtime authority → UNAVAILABLE

/api/snapshot/market · /api/market/overview
  → seed (market-snapshot-seed.json)
  → KHÔNG runtime authority
```

---

## 2. L2 — Authority flows ✅ PASS

### 2.1 Stock quote

```text
Cấu hình thời gian → price-sync → stock_prices
  → GET /api/market/runtime/quotes → IfluxMarketQuotes → UI
```

(+ OHLC: `GET /api/market/runtime/ohlc/:ticker` khi consumer cần chart thật.)

### 2.2 Identity

```text
GET /api/market/master/stocks|sectors|ecosystems → Master client (tách khỏi mock)
```

### 2.3 Non-quote → UNAVAILABLE

Breadth · liquidity · flow top net · market zone · index grid · heatmap GTGD · top10 mock · SR% · sector/eco/family/story **aggregate performance** → **UNAVAILABLE** trong task này.  
**Cấm** dùng seed snapshot API như thay thế.

---

## 3. L1 — Consumer classification ✅ PASS

**Quy trình:** Classify → Migrate → Verify 0 Prod consumer → DELETE mock.

**Legend:** **Q** quote · **I** identity · **G** group perf (no authority) · **V** other value (no authority) · **H** helper/timing · **L** loader · **T** test-only (N/A — không cô lập).

| # | File | Tags | Migrate / disposition |
|---|------|------|------------------------|
| 1 | `mock-market.js` | producer | DELETE khi 0 Prod consumer |
| 2 | `runtime/shell-boot.js` | **L** | Bỏ load `mock-market.js` |
| 3 | `runtime/legacy-bridge.js` | **L** | Bỏ global map mock |
| 4 | `features/community.manifest.js` | **L** | Bỏ `requiresShell: IfluxMockMarket` |
| 5 | `features/stock.manifest.js` | **L** | Bỏ require |
| 6 | `features/flow.manifest.js` | **L** | Bỏ require |
| 7 | `widgets/watchlist/index.js` | **L** | Bỏ dep |
| 8 | `widgets/market-heatmap/index.js` | **L** | Bỏ dep |
| 9 | `widgets/market-breadth/index.js` | **L** | Bỏ dep |
| 10 | `widgets/market-overview/index.js` | **L** | Bỏ dep |
| 11 | `widgets/community-stock-heat/index.js` | **L** | Bỏ dep |
| 12 | `widgets/flow-subj-net/index.js` | **L** | Bỏ dep |
| 13 | `widgets/trend-line/index.js` | **L** | Bỏ dep |
| 14 | `iflux-header-search.js` | **L**/**I** | Readiness qua Master/taxonomy; bỏ load mock |
| 15 | `community-ui.js` | **Q**/**G** | Q→`IfluxMarketQuotes`; G→UNAVAIL (`—`) |
| 16 | `community-trending.js` | **Q**/**V** | Q→runtime; missing/`perf:0`→UNAVAIL |
| 17 | `community-market-overview.js` | **V** | Index/exchange mock→UNAVAIL |
| 18 | `community-top-watchlist-store.js` | **Q**/**I** | runtime + Master name |
| 19 | `stock-page.js` | **Q**/**I**/**V** | first paint runtime/UNAVAIL; identity Master; series không authority→UNAVAIL |
| 20 | `entity-list-page.js` | **I**/**Q**/**H** | Master API + runtime; bỏ mock tick |
| 21 | `entity-detail-center.js` | **I**/**Q**/**V** | Master + runtime; valuation/events→UNAVAIL |
| 22 | `group-page.js` | **I**/**G**/**V** | Master/tax identity; perf→UNAVAIL |
| 23 | `watchlist-taxonomy.js` | **I** | `ensureMasterReady` → Master API |
| 24 | `watchlist-store.js` | **I**/**Q** | Master + runtime |
| 25 | `watchlist-ui.js` | **I** | Master name |
| 26 | `watchlist-block.js` | **I**/**Q** | Master + runtime |
| 27 | `alert-ui.js` | **I** | Master name |
| 28 | `alert-store.js` | **V** | **LIVE Prod** — SR `getPriceVsSrPct`/`getSrLevels`→UNAVAIL (không dead) |
| 29 | `widget-renderers.js` | **Q**/**V**/**I** | per value: Q runtime / else UNAVAIL |
| 30 | `dashboard-engine.js` | **Q**/**V**/**I** | cùng |
| 31 | `market-heatmap.js` | **V**/**Q** | stock %→runtime; group mock metrics→UNAVAIL |
| 32 | `market-rankings.js` | **V** | UNAVAIL |
| 33 | `market-liquidity.js` | **V** | UNAVAIL |
| 34 | `breadth-block.js` | **V** | UNAVAIL |
| 35 | `market-status-bar.js` | **V**/**H** | UNAVAIL |
| 36 | `flow-market-sidebar.js` | **V**/**H** | UNAVAIL |
| 37 | `flow-net-top.js` | **V** | UNAVAIL |
| 38 | `search-page-inline.js` | **I** | Master |
| 39 | `stock-mentions.js` | **I** | Master |

**PASS:** 39/39 file có tag + migrate target. Không còn Prod consumer “không biết mục đích”.

---

## 4. L3 — UNAVAILABLE presentation ✅ PASS

### 4.1 Hai khái niệm — không được nhầm

```text
RSS → Stock Entity Matching → NO MATCH
  = No Stock Entity
  ≠ Market Data UNAVAILABLE
  → giữ business rule Entity Matching hiện hữu (task Article/Entity)
```

```text
RSS → Match FPT → Stock Entity = FPT → runtime quote thiếu
  = FPT exists + Market Data UNAVAILABLE
  → hiển thị UNAVAILABLE cho market value
```

Solution **không** dùng market-data UNAVAILABLE để đổi Entity Matching hay rule xuất hiện bài viết.

### 4.2 Semantic market value

```text
Có Stock Entity + có market data thật → REAL (giá / %)
Có Stock Entity + không có market data thật → UNAVAILABLE
Không có Stock Entity → không áp market UNAVAILABLE (Entity rule riêng)
```

### 4.3 Presentation (chốt)

| Surface | REAL | UNAVAILABLE |
|---------|------|-------------|
| Inline price / % | giá thật · `.ix-stat-trend` (+ up/down) khi có % | **`—`** |
| Block / panel | — | Reuse empty hiện hữu (`.ifx-*-empty` / muted caption tương đương) |

**Cấm:** `0` · `0%` · fake · FE tự tính · mock fallback.

---

## 5. L4 — Phase boundary ✅ PASS

Xuất phát từ L1 + dependency (loaders cuối; quote/identity trước value-heavy widgets).

| Phase | Scope | Exit criteria |
|-------|-------|---------------|
| **P1 — Community market values** | `community-ui` (G-path), `community-trending`, `community-market-overview`, `community-top-watchlist-store`, widget `community-stock-heat` (+ dep L khi xong) | Stock Q = runtime/UNAVAIL; G/V = UNAVAIL; không `perf:0`; không mock authority |
| **P2 — Stock / Entity / Group pages** | `stock-page`, `entity-list-page`, `entity-detail-center`, `group-page` | Không mock first paint; I=Master; Q=runtime; V/G=UNAVAIL |
| **P3 — Watchlist + Alerts + taxonomy** | `watchlist-*`, `alert-ui`, `alert-store` | I=Master; Q=runtime; SR V=UNAVAIL |
| **P4 — Market widgets + dashboard** | heatmap, rankings, liquidity, breadth, overview, trend-line, `widget-renderers`, `dashboard-engine` | Q where stock; else UNAVAIL; hết mock value |
| **P5 — Flow + shell chrome** | `flow-*`, `market-status-bar`, `iflux-header-search`, `search-page-inline`, `stock-mentions` | UNAVAIL/I migrate; bỏ load mock |
| **P6 — Remove producer** | `shell-boot`, manifests, widget deps, `legacy-bridge`, `mock-market.js` | **0 Prod consumer** → DELETE `IfluxMockMarket` / `mock-market.js` |

Mỗi phase PASS trước khi mở phase sau trên Production (Plan chi tiết file/order).  
Gộp/tách kỹ thuật được nếu không đổi BR — ghi evidence trong Plan.

---

## 6. L5 — CSS / DS equivalence ✅ PASS (process + decisions)

**Matrix = evidence · không = bulk migrate.**

| Class / pattern | CSS owner | Consumers | Equivalent? | Decision |
|-----------------|-----------|-----------|-------------|----------|
| `.ix-stat-trend` (+ `.up`/`.down`) | Admin DS | Community chips REAL % | DS primitive | **REUSE** |
| `—` (inline UNAVAIL) | content | Community missing already | Semantic L3 | **REUSE** |
| `.ifx-com-side-row*` | `community.css` | Article sidebar | Feature layout | **KEEP LOCAL** |
| `.ifx-stock-head__*` | `stock.css` | Stock page | Gần `.ix-stat-value`/trend — chưa chứng minh thiếu DS bắt buộc promote | **KEEP LOCAL** (REUSE trend cho % nếu gắn chip); không rename hàng loạt |
| `.ifx-market-header__*` | `market-components.css` | Market header | Feature | **KEEP LOCAL** |
| `.ifx-*-empty` / side-empty | feature CSS | Empty panels | Existing empty | **REUSE** cho block UNAVAIL |
| `.ix-text-muted` / `.ix-caption` | Admin DS | Empty text | DS | **REUSE** khi cần muted copy |
| `.mock-stock-*` / `mock-market.css` | — | không tồn tại | — | N/A |
| Dead CSS sau DELETE mock UI | — | consumer=0 | — | **DELETE** chỉ khi matrix chứng minh 0 consumer |

**PROMOTE:** chỉ khi phase chứng minh primitive reusable **và** không có DS equivalent — không promote phòng thủ.

---

## 7. Solution components

| ID | Hành động |
|----|-----------|
| **SOL-QUOTE** | Mọi stock price/change → path §2.1 |
| **SOL-IDENTITY** | Master `/api/market/master/*` — extract/modify thin client từ logic `ensureMasterReady` (không invent domain) |
| **SOL-REMOVE-MOCK** | L1 classify → migrate theo phase → 0 consumer → DELETE |
| **SOL-UNAVAIL** | Theo authority value + L3 presentation; tách Entity Matching |
| **SOL-SYNC-ALIGN** | Đảm bảo consumer đọc path sync→DB; không freshness engine |
| **SOL-PHASES** | P1…P6 §5 |
| **SOL-CSS-INV / SOL-DS-EQ** | L5 decisions; matrix khi đụng DELETE/PROMOTE |

---

## 8. Solution Checklist — một dòng mỗi Req ID

| BR | Req ID | Audit | SoT | Solution | Trạng thái |
|----|--------|-------|-----|----------|------------|
| BR-01 | BR-01 | AUD-MM-01,04 | D2/D3 | **SOL-QUOTE** | READY |
| BR-02 | BR-02 | AUD-MM-01,04 | D2/D3 | **SOL-QUOTE** | READY |
| BR-03 | BR-03 | AUD-MM-05,09 | D1 | **SOL-UNAVAIL** | READY |
| BR-04 | BR-04 | AUD-MM-06,09 | D1 | **SOL-UNAVAIL** | READY |
| BR-05 | BR-05 | AUD-MM-10 | D1 | **SOL-QUOTE** + **SOL-UNAVAIL** | READY |
| BR-06 | BR-06 | AUD-MM-07 | D2/D4 | **SOL-REMOVE-MOCK** + **SOL-UNAVAIL** | READY |
| BR-07 | BR-07 | AUD-MM-07 | D1/D4 | **SOL-UNAVAIL** | READY |
| BR-08 | BR-08 | AUD-MM-01,11 | D2 | **SOL-IDENTITY** + **SOL-REMOVE-MOCK** | READY |
| BR-09 | BR-09 | AUD-MM-03 | P3 | **SOL-PHASES** P1 + **SOL-QUOTE** / **SOL-UNAVAIL** | READY |
| BR-10 | BR-10 | AUD-MM-03 | D5 | **SOL-QUOTE** / **SOL-UNAVAIL** | READY |
| BR-11 | BR-11 | AUD-MM-10 | D3 | **SOL-SYNC-ALIGN** | READY |
| BR-12 | BR-12 | AUD-MM-07 | D4 | **SOL-UNAVAIL** + L3 | READY |
| BR-13 | BR-13 | AUD-MM-09 | D1 | **SOL-UNAVAIL** | READY |
| BR-14 | BR-14 | AUD-MM-02 | D2 | **SOL-REMOVE-MOCK** | READY |
| BR-15 | BR-15 | AUD-MM-02 | D5 | **SOL-PHASES** + **SOL-REMOVE-MOCK** | READY |
| BR-16 | BR-16 | AUD-MM-08 | D2 | **SOL-REMOVE-MOCK** | READY |
| BR-17 | BR-17 | AUD-MM-08 | D5 | **SOL-PHASES** | READY |
| BR-18 | BR-18 | AUD-MM-14 | D4 | **SOL-UNAVAIL** + L3 | READY |
| BR-19 | BR-19.TRACE | AUD-MM-15 | D7 | **SOL-CSS-INV** | READY |
| BR-19 | BR-19.DEL | AUD-MM-15 | D7 | **SOL-CSS-INV** + **SOL-REMOVE-MOCK** | READY |
| BR-19 | BR-19.KEEP | AUD-MM-15 | D7 | **SOL-CSS-INV** / **SOL-DS-EQ** | READY |
| BR-19 | BR-19.NONAME | AUD-MM-15 | P6 | **SOL-CSS-INV** | READY |
| BR-19 | BR-19.NOFALL | AUD-MM-07 | D2/D4 | **SOL-REMOVE-MOCK** + **SOL-UNAVAIL** | READY |
| BR-20 | BR-20.OWNER | AUD-MM-16 | D6 | **SOL-DS-EQ** | READY |
| BR-20 | BR-20.PROMOTE | AUD-MM-16 | D6 | **SOL-DS-EQ** | READY |
| BR-20 | BR-20.REUSE-DS | AUD-MM-16 | D6 | **SOL-DS-EQ** | READY |
| BR-20 | BR-20.NOBULK | AUD-MM-16 | D6 | **SOL-CSS-INV** | READY |
| BR-20 | BR-20.MIGRATE | AUD-MM-16 | D7 | **SOL-DS-EQ** + **SOL-CSS-INV** | READY |

**28/28.** Shared SOL reference · không merge BR rows.

---

## 9. Non-goals / escalate Owner

**Không làm trong task:** aggregation Sector/Eco API · Freshness Contract · DS thứ hai · bulk CSS · đổi Entity Matching · coi seed snapshot là runtime.

**Escalate Owner nếu:** phát hiện evidence đòi hỏi đổi BR / acceptance / business behavior / Entity Matching semantic.

---

## 10. Governance

| Phase | Status |
|-------|--------|
| 01 BRD | 🔒 LOCKED |
| 02 Audit | ✅ APPROVED |
| 03 SoT | 🔒 OWNER LOCKED |
| **04 Solution** | 🔒 **OWNER LOCKED** · L1–L5 PASS · 2026-08-09 |
| **05 Plan** | 🔒 **OWNER LOCKED** — [`05-Plan.md`](05-Plan.md) |
| Implementation | ✅ **AUTHORIZED** — WP-0…7 |

### Owner Approval (2026-08-09)

> **LOCK 04-Solution.** L1–L5 đã PASS theo Owner Decision 2026-08-09. Cho phép mở `05-Plan.md`. Implementation vẫn NOT AUTHORIZED đến khi Owner LOCK Plan.

---

*04-Solution · OWNER LOCKED 2026-08-09 · L1–L5 PASS · Implementation NOT AUTHORIZED.*
