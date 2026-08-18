# 05 — Plan (Execution Index)

# Community Market Data — Remove Mock Data & Runtime Market Data Integrity

| | |
|--|--|
| **Task ID** | `090826_Community_Market_Data_Mock_Removal_Runtime_Integrity` |
| **BRD** | [`01-BRD.md`](01-BRD.md) — 🔒 LOCKED · **28 Req** |
| **Audit** | [`02-Mandatory-Audit.md`](02-Mandatory-Audit.md) — ✅ APPROVED |
| **SoT** | [`03-SoT.md`](03-SoT.md) — 🔒 OWNER LOCKED · D1–D7 |
| **Solution** | [`04-Solution.md`](04-Solution.md) — 🔒 **OWNER LOCKED** · L1–L5 PASS |
| **Document** | Plan — execution index ([Governance](../Product%20Backlogs%20Governance.md) §2.6) |
| **Date** | 2026-08-09 |
| **Status** | 🔒 **OWNER LOCKED** · 2026-08-09 |
| **Implementation** | ✅ **AUTHORIZED** — đúng WP-0…7 · cấm redesign Solution |

> Plan = **index + WP + file + verify + rollback**. Không redesign SoT/Solution.  
> **Cấm** gộp atomic Req. Checklist = **28/28** hàng.  
> Presentation L3: REAL → giá / `.ix-stat-trend` · UNAVAIL → `—` · block → empty hiện hữu.  
> **Cấm** đổi Entity Matching. **Cấm** seed `/snapshot/market` làm authority.  
> **Owner LOCK Plan:** Implementation AUTHORIZED theo WP-0…7.

---

## 0. Impact Analysis (CG-005)

| | |
|--|--|
| **Feature** | Remove mock market-value authority; REAL / UNAVAILABLE |
| **Current owners** | FE `User_Web/iflux-web-ui` · BE `market-runtime-quotes` / `market-master` / price-sync |
| **Consumers** | 39 files ref `IfluxMockMarket` (Solution L1) |
| **Storage / API** | `stock_prices` · `GET /api/market/runtime/quotes` · `GET /api/market/master/*` · Admin Cấu hình thời gian → price-sync |
| **Decision** | **Modify** consumers · **Reuse** `IfluxMarketQuotes` + Master APIs · **Extract/Modify** Master thin client từ `ensureMasterReady` · **Delete** `mock-market.js` sau 0 Prod consumer |
| **Cấm** | Seed snapshot authority · FE aggregate · Freshness Contract mới · bulk CSS · API vá UI · đổi Entity Matching |

---

## 1. Work packages (thứ tự)

```text
WP-0 Master client
   ├→ WP-1 Community
   ├→ WP-2 Stock/Entity/Group
   └→ WP-3 Watchlist/Alerts
WP-1 / WP-2 → WP-4 Widgets (sau khi quote/identity patterns ổn)
WP-2 → WP-5 Flow/Shell
WP-1…WP-5 → WP-6 Delete mock producer
WP-6 → WP-7 Verify/Deploy (chỉ sau Owner LOCK Plan + authorize impl)
```

| WP | Tên | Solution | Owner files | Depends | Exit criteria |
|----|-----|----------|-------------|---------|---------------|
| **WP-0** | Master thin client | SOL-IDENTITY | Extract/modify logic `ensureMasterReady` từ [`mock-market.js`](../../User_Web/iflux-web-ui/mock-market.js) → module client riêng (Modify existing / extract — không API Master mới). Callers: [`watchlist-taxonomy.js`](../../User_Web/iflux-web-ui/watchlist-taxonomy.js), [`entity-list-page.js`](../../User_Web/iflux-web-ui/entity-list-page.js) | — | Identity không qua `IfluxMockMarket` |
| **WP-1** | Community market values (P1) | SOL-QUOTE · SOL-UNAVAIL · SOL-PHASES | [`community-ui.js`](../../User_Web/iflux-web-ui/community-ui.js) (G→`—`), [`community-trending.js`](../../User_Web/iflux-web-ui/community-trending.js) (cấm `perf:0`), [`community-market-overview.js`](../../User_Web/iflux-web-ui/community-market-overview.js), [`community-top-watchlist-store.js`](../../User_Web/iflux-web-ui/community-top-watchlist-store.js), widget `community-stock-heat` | WP-0 (name/I nếu cần) | Q=runtime/UNAVAIL; G/V=`—`; không mock authority |
| **WP-2** | Stock / Entity / Group (P2) | SOL-QUOTE · SOL-IDENTITY · SOL-UNAVAIL | [`stock-page.js`](../../User_Web/iflux-web-ui/stock-page.js), [`entity-list-page.js`](../../User_Web/iflux-web-ui/entity-list-page.js), [`entity-detail-center.js`](../../User_Web/iflux-web-ui/entity-detail-center.js), [`group-page.js`](../../User_Web/iflux-web-ui/group-page.js) | WP-0 | Không mock first paint; I=Master; V/G=UNAVAIL |
| **WP-3** | Watchlist + Alerts (P3) | SOL-IDENTITY · SOL-QUOTE · SOL-UNAVAIL | `watchlist-*.js`, [`alert-ui.js`](../../User_Web/iflux-web-ui/alert-ui.js), [`alert-store.js`](../../User_Web/iflux-web-ui/alert-store.js) (SR LIVE→UNAVAIL) | WP-0 | I=Master; Q=runtime; SR không mock |
| **WP-4** | Market widgets + dashboard (P4) | SOL-QUOTE · SOL-UNAVAIL | `market-heatmap.js`, `market-rankings.js`, `market-liquidity.js`, `breadth-block.js`, widgets overview/heatmap/breadth/trend-line, [`widget-renderers.js`](../../User_Web/iflux-web-ui/widget-renderers.js), [`dashboard-engine.js`](../../User_Web/iflux-web-ui/dashboard-engine.js) | WP-1 patterns | Stock Q=runtime; non-quote UNAVAIL; không seed API |
| **WP-5** | Flow + shell chrome (P5) | SOL-UNAVAIL · SOL-IDENTITY | `flow-net-top.js`, `flow-market-sidebar.js`, `market-status-bar.js`, [`iflux-header-search.js`](../../User_Web/iflux-web-ui/iflux-header-search.js), `search-page-inline.js`, `stock-mentions.js` | WP-0 · WP-2 | I migrate / V UNAVAIL; bỏ load mock ở search |
| **WP-6** | Remove producer (P6) | SOL-REMOVE-MOCK | [`shell-boot.js`](../../User_Web/iflux-web-ui/runtime/shell-boot.js), `features/*.manifest.js`, widget `index.js` deps, [`legacy-bridge.js`](../../User_Web/iflux-web-ui/runtime/legacy-bridge.js), [`mock-market.js`](../../User_Web/iflux-web-ui/mock-market.js) | WP-1…WP-5 | `rg IfluxMockMarket` Prod FE = 0 → DELETE module |
| **WP-7** | Verify + deploy | All | Production + Evidence A/B/C | WP-6 + **Owner LOCK Plan** | BR checklist verify; CF purge |

### Presentation / CSS (mọi WP value)

| | |
|--|--|
| REAL inline | giá thật · `.ix-stat-trend` (+up/down) |
| UNAVAIL inline | `—` |
| UNAVAIL block | reuse `.ifx-*-empty` / muted caption |
| CSS | Matrix trước DELETE; REUSE/KEEP LOCAL per Solution L5; **cấm** bulk rename |
| Entity | No Match ≠ Market UNAVAILABLE — không đụng matching |

### Rollback (implementation safety — không đổi BR)

- Git revert WP commit / restore prior asset version trên Prod nếu phase **FAIL**.
- Không để consumer đã migrate quay lại phụ thuộc mock như **authority** trong trạng thái **PASS**.
- Nếu rollback một WP làm consumer mất dependency: rollback phải khôi phục **toàn bộ dependency** cần thiết của version trước đó, **hoặc** đưa consumer về **UNAVAILABLE an toàn**.
- WP-6 chỉ DELETE `mock-market.js` khi `IfluxMockMarket` = **0 Production consumer**.

---

## 2. Plan Checklist — 28/28 (Governance §2.6)

| BR | Req ID | Audit | SoT | Solution | Plan / Action | Status |
|----|--------|-------|-----|----------|---------------|--------|
| BR-01 | BR-01 | AUD-MM-01,04 | D2/D3 | SOL-QUOTE | WP-1/2/3/4: stock price chỉ `IfluxMarketQuotes`→`/api/market/runtime/quotes`. Verify A path + C giá ≠ mock seed | PENDING |
| BR-02 | BR-02 | AUD-MM-01,04 | D2/D3 | SOL-QUOTE | WP-1/2/3/4: stock change/pct cùng runtime path; cấm `getStock().change_pct` mock. Verify C | PENDING |
| BR-03 | BR-03 | AUD-MM-05,09 | D1 | SOL-UNAVAIL | WP-1+: sector perf → `—`; cấm `getSectorPerf`/avg mock. Verify C | PENDING |
| BR-04 | BR-04 | AUD-MM-06,09 | D1 | SOL-UNAVAIL | WP-1+: eco/family perf → `—`; cấm mean mock constituents. Verify C | PENDING |
| BR-05 | BR-05 | AUD-MM-10 | D1 | SOL-QUOTE + SOL-UNAVAIL | WP-1…5: stock REAL khi có quote; sector/eco UNAVAIL. Verify C mixed surface | PENDING |
| BR-06 | BR-06 | AUD-MM-07 | D2/D4 | SOL-REMOVE-MOCK + SOL-UNAVAIL | WP-1…6: cắt mọi fallback runtime→mock. Verify A: không fallback call | PENDING |
| BR-07 | BR-07 | AUD-MM-07 | D1/D4 | SOL-UNAVAIL | WP-1: xóa `perf:0` / `pg:0` as performance. Verify A rg + C | PENDING |
| BR-08 | BR-08 | AUD-MM-01,11 | D2 | SOL-IDENTITY + SOL-REMOVE-MOCK | WP-0+WP-6: Master API client; không mock catalog quote. Verify A | PENDING |
| BR-09 | BR-09 | AUD-MM-03 | P3 | SOL-PHASES P1 + SOL-QUOTE/UNAVAIL | WP-1: Community consumer-only paths. Verify C Article/feed/trending | PENDING |
| BR-10 | BR-10 | AUD-MM-03 | D5 | SOL-QUOTE / SOL-UNAVAIL | WP-1…5: cùng authority cross-surface. Verify C cùng ticker | PENDING |
| BR-11 | BR-11 | AUD-MM-10 | D3 | SOL-SYNC-ALIGN | WP-1…5: đọc quotes path sync→DB; không freshness engine mới. Verify A: chỉ runtime quotes client | PENDING |
| BR-12 | BR-12 | AUD-MM-07 | D4 | SOL-UNAVAIL + L3 | WP-1…5: REAL\|UNAVAIL presentation (`—` / empty). Verify C | PENDING |
| BR-13 | BR-13 | AUD-MM-09 | D1 | SOL-UNAVAIL | WP-1/2: cấm FE aggregate group perf. Verify A | PENDING |
| BR-14 | BR-14 | AUD-MM-02 | D2 | SOL-REMOVE-MOCK | WP-1…6: không consumer-specific mock authority. Verify inventory L1 clear | PENDING |
| BR-15 | BR-15 | AUD-MM-02 | D5 | SOL-PHASES + SOL-REMOVE-MOCK | WP-1…6 phase exits + WP-6 completeness. Verify 0 Prod mock ref | PENDING |
| BR-16 | BR-16 | AUD-MM-08 | D2 | SOL-REMOVE-MOCK | WP-6: shell/manifest không load mock Prod. Verify A shell-boot | PENDING |
| BR-17 | BR-17 | AUD-MM-08 | D5 | SOL-PHASES | WP-1…6: phase gate không re-introduce mock. Verify checklist | PENDING |
| BR-18 | BR-18 | AUD-MM-14 | D4 | SOL-UNAVAIL + L3 | WP-1…5: integrity > visual (UNAVAIL thay số giả). Verify C | PENDING |
| BR-19 | BR-19.TRACE | AUD-MM-15 | D7 | SOL-CSS-INV | WP-1…6: trước DELETE CSS — consumer→DOM→CSS note trong PR/evidence | PENDING |
| BR-19 | BR-19.DEL | AUD-MM-15 | D7 | SOL-CSS-INV + SOL-REMOVE-MOCK | WP-6: DELETE mock-only artifacts khi 0 consumer. Verify A | PENDING |
| BR-19 | BR-19.KEEP | AUD-MM-15 | D7 | SOL-CSS-INV / SOL-DS-EQ | WP-*: KEEP LOCAL `.ifx-com-side-row*` / stock-head per Solution L5. Verify không xóa nhầm | PENDING |
| BR-19 | BR-19.NONAME | AUD-MM-15 | P6 | SOL-CSS-INV | WP-*: cấm xóa CSS chỉ vì tên mock. Verify review | PENDING |
| BR-19 | BR-19.NOFALL | AUD-MM-07 | D2/D4 | SOL-REMOVE-MOCK + SOL-UNAVAIL | WP-1…6: không mock fallback authority. Verify A | PENDING |
| BR-20 | BR-20.OWNER | AUD-MM-16 | D6 | SOL-DS-EQ | WP-*: mock-data ≠ UI ownership khi classify CSS. Verify L5 | PENDING |
| BR-20 | BR-20.PROMOTE | AUD-MM-16 | D6 | SOL-DS-EQ | WP-*: chỉ promote khi reusable + không DS equivalent. Verify không promote phòng thủ | PENDING |
| BR-20 | BR-20.REUSE-DS | AUD-MM-16 | D6 | SOL-DS-EQ | WP-1+: REUSE `.ix-stat-trend` cho REAL %. Verify C chips | PENDING |
| BR-20 | BR-20.NOBULK | AUD-MM-16 | D6 | SOL-CSS-INV | WP-*: cấm bulk migrate/rename CSS. Verify diff review | PENDING |
| BR-20 | BR-20.MIGRATE | AUD-MM-16 | D7 | SOL-DS-EQ + SOL-CSS-INV | WP-6: sau REUSE/PROMOTE — xóa legacy chỉ khi 0 consumer. Verify A | PENDING |

**28/28.** Shared WP reference · không merge BR rows.

---

## 3. Verification evidence (sau impl — WP-7)

| Kind | Nội dung |
|------|----------|
| **A** | `rg IfluxMockMarket` / `mock-market` Prod FE; call-graph quote path; không fallback |
| **B** | API `runtime/quotes` + Master vs UI sample tickers |
| **C** | DOM Community/Stock/Watchlist: REAL vs `—`; không `0` giả; Entity matching không đổi |

---

## 4. Governance

| Phase | Status |
|-------|--------|
| 01–04 | BRD LOCKED · Audit APPROVED · SoT LOCKED · Solution LOCKED |
| **05 — Plan** | 🔒 **OWNER LOCKED** · 2026-08-09 |
| Implementation | ✅ **AUTHORIZED** — WP-0…7 |

### Owner LOCK Plan (2026-08-09)

> **LOCK 05-Plan.** Cho phép Implementation đúng WP-0…7. Cấm redesign Solution. Cấm soft-pass BR. Sau mỗi phase: verify exit criteria trước phase sau trên Production.

---

*05-Plan OWNER LOCKED 2026-08-09 · Implementation AUTHORIZED · WP-0…7.*
