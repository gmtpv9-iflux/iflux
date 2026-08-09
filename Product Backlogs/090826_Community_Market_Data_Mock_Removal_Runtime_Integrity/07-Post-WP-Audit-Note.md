# 07 — Post WP-0…7 Audit Note (Read-only)

# Community Market Data — Mock Removal · Network Follow-up

| | |
|--|--|
| **Task ID** | `090826_Community_Market_Data_Mock_Removal_Runtime_Integrity` |
| **Date** | 2026-08-09 |
| **Mode** | **AUDIT ONLY** — không sửa/xóa code |
| **Trigger** | Production Network còn `flow-score-top-mock.js` + duplicate `legacy-bridge.js` |

---

## Verdict (câu “task xong”)

### **PASS nhưng còn Performance Debt + Out-of-scope Mock Producer**

| Gate (WP-0…7 / `IfluxMockMarket` market-value) | Status |
|-----------------------------------------------|--------|
| `mock-market.js` Production | **404** (DELETED) |
| `IfluxMockMarket` live consumer User Web | **0** (chỉ comment / blocklist defensive) |
| Stock quote authority | `GET /api/market/runtime/quotes` → `IfluxMarketQuotes` |
| Mock fallback price/% từ `IfluxMockMarket` | **Không còn** |
| Fake zero `perf:0` từ path mock market | **Đã cắt** trên WP-1…5 surfaces trong Plan |

| Phát hiện Network mới | Classification |
|------------------------|----------------|
| `flow-score-top-mock.js` vẫn load Prod | **Mock producer thật** cho **Flow Score ranking** — **không** phải `IfluxMockMarket` / stock price/% |
| Duplicate `legacy-bridge.js?v=…` | **Performance / module-graph debt** — byte-identical |

**Không FAIL** theo exit WP-6 (`rg IfluxMockMarket` Prod FE = 0 · DELETE `mock-market.js`).  
**Không PASS sạch tuyệt đối** nếu diễn giải BR-16/19 theo nghĩa “mọi mock-data producer trên Prod”.

→ Khuyến nghị Owner: giữ **PASS (market-value scope)** + mở **FOLLOW-UP** riêng cho Flow Score mock + runtime pin debt.

---

## 1. Tại sao `flow-score-top-mock.js` vẫn xuất hiện sau WP-6?

### Finding

WP-6 xóa **`mock-market.js` / `IfluxMockMarket`**.  
`flow-score-top-mock.js` là **module khác**, export **`IfluxFlowScoreMock`**, vẫn là dependency **đang mount** của widget Flow Score trên Production.

### Evidence — semantics (không kết luận từ filename)

| Check | Result |
|-------|--------|
| File header | `/* Mock data — Top 10 score blocks (view-only, thay bằng API sau) */` |
| Global | `window.IfluxFlowScoreMock` |
| Có `IfluxMockMarket`? | **Không** (Prod body scan) |
| Có price / change_pct / quote? | **Không** |
| Dữ liệu tạo ra | Hardcoded pools `STOCKS`/`SECTORS`/`HST`/`STORIES` + `seeded()` → `score`, `riskScore`, `recommendation` (Cơ hội/Rủi ro/Mua/Bán) |
| Authority path stock Q? | **Không** — không đụng `IfluxMarketQuotes` / `runtime/quotes` |

### Call graph (Production)

```text
/dong-tien (hoặc /flow)
  → bootstrap.js
  → page manifest flow → WGT-FLW-PAGE
  → mount-published-widgets
  → widgets/flow-score-board/index.js   (lazyModule catalog WGT-FLW-STAT_* / WGT-FLW-EX_*)
       ensureSequence([
         ApexCharts,
         { global: 'IfluxFlowScoreMock', src: '.../flow-score-top-mock.js' },  ← LOAD
         { global: 'IfluxFlowScoreTop', src: '.../flow-score-top.js' }
       ])
       → blocksForWidgetId() → IfluxFlowScoreMock.getBasic/getBlock(...)
       → IfluxFlowScoreTop.mount(el, blocks)  ← RENDER fake scores
```

Consumers khác (cùng producer):

| Consumer | Role |
|----------|------|
| `widgets/flow-score-board/index.js` | **Primary Prod** — load + đọc blocks |
| `widgets/flow-rank-duo/index.js` | load mock + `getBlock(stat-stock-*)` |
| `widgets/flow-rank-signal/index.js` | load mock + `getBlock` |
| `widget-renderers.js` `WGT-FLW-SCORE` | dashboard/renderer path — `IfluxFlowScoreMock.getBlock` |
| `flow-score-top.js` `blocksForTab` | đọc `IfluxFlowScoreMock.getBasic/Advanced/Exclusive` |
| `widget-module-catalog.js` `WGT-FLW-SCORE` | dep `flow-score-top-mock.js` (**global name sai**: `IfluxFlowScoreTopMock` ≠ `IfluxFlowScoreMock`) |
| Admin `templates.html` / `platform-layers.html` | Admin preview — ngoài User Web shell |

### Severity / BR impact

| Lens | Assessment |
|------|------------|
| **WP-6 exit (`IfluxMockMarket`)** | **Không violation** — module khác, không trong inventory AUD-MM-02 (toàn hàng = `IfluxMockMarket`) |
| **BR-01/02/03/04 (price/change/sector/eco perf)** | **Không trực tiếp** — không paint giá/% runtime |
| **BR-06 fallback real→mock quote** | **Không** — không nằm quote path |
| **BR-14 “cùng market fact”** | Flow Score ≠ stock quote fact; **không** dual-authority giá |
| **BR-16 / BR-19 (mock producer trên Prod)** | **Có mock producer thật trên Prod** cho product Flow Score — **ngoài scope Plan WP-0…7** nhưng **integrity debt riêng** |
| **BR-18 tinh thần** | Có: UI hiện score/khuyến nghị **giả** trông như thật (“dữ liệu mẫu” trong footer renderer) |

### Current behavior

User vào **Dòng tiền** → widget Top 10 điểm dòng tiền **vẫn hiện số score / radar / KN từ seed deterministic** — không UNAVAILABLE.

### Recommended action

| Action | Scope |
|--------|-------|
| **Không reopen WP-6** như FAIL `IfluxMockMarket` | In-scope closed |
| Mở **FOLLOW-UP task**: Flow Score Runtime Integrity (UNAVAIL hoặc API thật; DELETE `flow-score-top-mock.js` khi 0 consumer) | **Follow-up** |
| Sửa catalog global typo `IfluxFlowScoreTopMock` → `IfluxFlowScoreMock` | Follow-up (bug debt) |

### In-scope / Follow-up

**Follow-up** (không thuộc Plan WP-0…7 file list).

---

## 2. Duplicate `legacy-bridge.js` versions

### Finding

Cùng một file vật lý được import ESM với **hai query `?v=` khác nhau** → trình duyệt tạo **hai module record** (Network hiện 2 request).

### Evidence

| Version | Who imports |
|---------|-------------|
| `?v=cssPin20260808` | `page-runtime.js`, `feature-runtime.js`, `widget-loader.js`, `mount-published-widgets.js` |
| `?v=phaseCW420260721` | `shell-boot.js` + hầu hết `widgets/*/index.js` |
| `?v=shareAffP5_20260727` | `share-feature-boot.js` (path khác — không luôn cùng page) |

Prod fetch:

| URL | Size | SHA256 (16) |
|-----|------|-------------|
| `legacy-bridge.js?v=cssPin20260808` | 7151 B | `b60da1d292acb3a1` |
| `legacy-bridge.js?v=phaseCW420260721` | 7151 B | `b60da1d292acb3a1` |

→ **Byte-identical.** Không phải hai implementation khác nhau.

### Execute vs artifact?

- **Cả hai đều execute** như ESM module riêng (import graph).
- Mỗi instance có **`scriptPromises` / `stylePromises` riêng** (closure per module URL).
- Dedup tải IIFE script vẫn chủ yếu qua DOM `script[data-rt-src]` → **không chứng minh double-init global IIFE** từ riêng việc này.
- **Không** tạo hai `window.IfluxMockMarket` (đã xóa).

### Canonical?

Không có pin “canonical” duy nhất trong repo — **pin phân mảnh theo thời điểm cache-bust**. Nội dung hiện **trùng**.

### Có thể bỏ một load?

**Có (follow-up):** unify mọi import về **một** `?v=` → một module instance. Cần Impact Analysis ownership Runtime — **không sửa trong audit này**.

### Severity

Performance / maintainability — **không** integrity FAIL market-value.

### In-scope / Follow-up

**FOLLOW-UP PERFORMANCE TASK** · Runtime module pin hygiene.

---

## 3. Waterfall / long-loading (phân loại)

> Network wall-clock ~200–875 ms trên DevTools **không** = “file nặng”. Cần tách wait / TTFB / download / evaluate / dependency blocking. Audit tĩnh dưới đây = ownership + initiator; **không** có HAR timing chi tiết từng phase từ Owner — ghi rõ giới hạn.

| Asset | ~Network (Owner) | Role trên graph | First-paint block? | Parallel? | Class |
|-------|------------------|-----------------|--------------------|-----------|-------|
| `pnc-lifecycle.js` | ~272 ms | HTML sync trước bootstrap | Có thể (shell PNC) | Với pnc siblings | Boot chrome |
| `bootstrap.js` | ~228 ms | ESM entry page | Có (entry) | Sau PNC | Boot |
| `shell-boot.js` → … | (trong graph) | Shell MARKET_* | Có (await chain) | `ensureParallel` nội bộ | Boot |
| `legacy-bridge.js` ×2 | ~552–568 ms | Helper loader | Gián tiếp (import) | 2 URL tuần tự theo import order | **Duplicate pin** |
| `app-shell.js` | ~557 ms | Layout sections | Có thể | Import từ page-runtime | Boot layout |
| `mount-published-widgets.js` | ~303–541 ms | Mount Host Tree | Sau shell | **Tuần tự** `for` từng widget | Waterfall by design |
| `flow-score-top-mock.js` | ~875 ms | **Lazy widget dep** | **Không** first paint page — sau mount WGT-FLW-SCORE | Seq trong `ensureSequence` trước `flow-score-top.js` | Mock producer (Flow) |
| `flow-score-top.js` | ~873 ms | Renderer radar/UI | Sau mock | Sau mock (seq) | Feature UI |

**Kết luận waterfall:**

1. Boot chain (PNC → bootstrap → shell → page-runtime) **tuần tự có chủ đích**.
2. `mount-published-widgets` mount widget **tuần tự** → mỗi widget kéo dep → waterfall dài trên `/dong-tien`.
3. `flow-score-top-mock` + `flow-score-top` **~875 ms** gần chắc = **latency/queue + TTFB** (file chỉ ~5.9 KB / ~29 KB) — không phải payload lớn.
4. Duplicate `legacy-bridge` = **extra module fetch** (7151 B × 2) — debt nhỏ so với widget waterfall.

---

## 4. Taxonomy asset tên chứa `mock` (semantics)

| Asset | Class | Evidence |
|-------|-------|----------|
| ~~`User_Web/.../mock-market.js`~~ | **E** dead (đã DELETE) | Prod 404 |
| `flow-score-top-mock.js` / `IfluxFlowScoreMock` | **A′** — mock **Flow Score** authority (không phải quote) | Seeded scores + Prod consumers |
| `Admin/.../mock-market.js` + platform-layers | **C** Admin sandbox | Không User Web shell path |
| Comment “CẤM fallback IfluxMockMarket” trong `community-ui.js` | **D** | Không load asset |
| `feature-runtime` blocklist `/mock-market\.js/` | **D** | Guard chống re-add |
| Filename `mockRmWp*` trong `?v=` cache | **D** | Version string only |

Chỉ **A (`IfluxMockMarket` quote/perf)** thuộc task đã đóng.  
**A′ (Flow Score mock)** = producer mock thật trên Prod nhưng **business fact khác** → follow-up.

---

## 5. Findings card (Owner format)

### F1 — `flow-score-top-mock.js` còn trên Prod Network

| | |
|--|--|
| **Finding** | File vẫn load và là authority của Top 10 điểm dòng tiền (fake score/KN) |
| **Evidence** | Call graph `flow-score-board` → `IfluxFlowScoreMock`; Prod 200 · 5890 B; không đụng `IfluxMockMarket` |
| **Severity** | 🟠 High cho **Flow product integrity** · ⚪ không fail WP-6 market-value exit |
| **BR/SoT impact** | BR-16/18/19 *tinh thần* (mock Prod) · **ngoài** BR-01/02/06 quote path · **ngoài** AUD-MM-02 inventory |
| **Current behavior** | `/dong-tien` vẫn hiện radar/score giả |
| **Recommended action** | FOLLOW-UP task: UNAVAIL hoặc runtime API; rồi DELETE producer |
| **In-scope / Follow-up** | **Follow-up** |

### F2 — Duplicate `legacy-bridge.js` pins

| | |
|--|--|
| **Finding** | Hai `?v=` → hai ESM module instance; nội dung identical |
| **Evidence** | Import map cssPin vs phaseCW; SHA256 trùng |
| **Severity** | 🟡 Low–Med performance / hygiene |
| **BR/SoT impact** | Không BR market-value |
| **Current behavior** | Network 2 request; cache `scriptPromises` tách đôi |
| **Recommended action** | Unify pin một version |
| **In-scope / Follow-up** | **FOLLOW-UP PERFORMANCE TASK** |

### F3 — Widget mount waterfall

| | |
|--|--|
| **Finding** | `mount-published-widgets` tuần tự + `ensureSequence` mock→renderer làm dài wall time |
| **Evidence** | Code `for` tuần tự; Owner Network ~800 ms+ cặp flow-score |
| **Severity** | 🟡 Performance |
| **BR/SoT impact** | Không |
| **Recommended action** | Task tối ưu lazy/parallel (cẩn thận entitlement) |
| **In-scope / Follow-up** | **FOLLOW-UP PERFORMANCE TASK** |

### F4 — Catalog global name mismatch

| | |
|--|--|
| **Finding** | `widget-module-catalog` chờ `IfluxFlowScoreTopMock` nhưng file export `IfluxFlowScoreMock` |
| **Evidence** | `widget-module-catalog.js` L164 vs `flow-score-top-mock.js` L97 |
| **Severity** | 🟡 Bug debt (dashboard dep path) |
| **Recommended action** | Align global name trong follow-up Flow Score |
| **In-scope / Follow-up** | **Follow-up** |

---

## 6. Giới hạn audit

- Không có HAR DevTools đầy đủ (TTFB vs Waiting vs CPU) từ session Owner — timing ~ms là **wall-clock Network**, không chứng minh execution cost.
- Không mở Entity Matching / Sector aggregate / Freshness / DS / API mới.
- Không sửa code trong pass này.

---

*07 — Post-impl audit · 2026-08-09 · READ-ONLY*
