# 06 — Verification Evidence

# Community Market Data — Remove Mock Data & Runtime Market Data Integrity

| | |
|--|--|
| **Task ID** | `090826_Community_Market_Data_Mock_Removal_Runtime_Integrity` |
| **Date** | 2026-08-09 |
| **Status** | WP-0…7 **IMPLEMENTED** · Production deployed · CF purged |
| **Plan** | [`05-Plan.md`](05-Plan.md) — OWNER LOCKED · AUTHORIZED |

---

## A — Call-graph / consumer inventory

| Check | Result |
|-------|--------|
| `User_Web/iflux-web-ui/mock-market.js` | **DELETED** (local + Production) |
| Production `HEAD /User_Web/iflux-web-ui/mock-market.js` | **404** |
| `runtime/shell-boot.js` load mock | **0** (Master + taxonomy only) |
| Live `IfluxMockMarket.*` calls in User_Web FE | **0** (chỉ còn comment cấm-fallback / blocklist defensive) |
| Admin `templates.html` | Trỏ `iflux-market-master.js` (không còn User_Web mock) |

**Authority path (stock Q):**

```text
Admin Cấu hình thời gian → price-sync → stock_prices
  → GET /api/market/runtime/quotes → IfluxMarketQuotes → UI
```

**Identity:**

```text
GET /api/market/master/{stocks|sectors|ecosystems} → IfluxMarketMaster
```

**Không authority:** seed `/snapshot/market`, `/api/market/overview`, FE aggregate sector/eco, mock fallback.

---

## B — API sample (Production · iflux.vn)

| API | Result |
|-----|--------|
| `GET /api/market/master/stocks` | OK · `items=1525` |
| `GET /api/market/runtime/quotes?tickers=TCB,HPG` | OK · tickers `HPG,TCB` |
| Asset `iflux-market-master.js?v=mockRmWp6_20260809` | 200 |
| Asset `runtime/shell-boot.js?v=mockRmWp6_20260809` | 200 |

---

## C — Surface presentation (by WP)

| Surface | REAL | UNAVAILABLE |
|---------|------|-------------|
| Community stock chips / heatmap % | runtime quote | `—` / empty khi thiếu quote |
| Community group/story/family perf | — | luôn `—` (D1) |
| Community market overview / breadth | — | empty hiện hữu |
| Stock page header | runtime + OHLC | `—` trước/không có quote |
| Entity list rows | Master + Quotes enrich | `—` first paint / missing |
| Group page perf/chart | — | `—` + empty chart |
| Entity detail fundamentals / events / group PE·PB | — | `—` / empty |
| Watchlist rows | Master + Quotes | `—` |
| Alert SR level/pct | — | `—` (SR create vẫn LIVE, eval không mock) |
| Heatmap / rankings / liquidity / breadth / flow net / status bar | — | empty / neutral chrome |
| Search / mentions | Master identity | giá `—` (I-only) |

Entity Matching **không đổi**.

---

## WP exit summary

| WP | Exit | Status |
|----|------|--------|
| WP-0 | Identity không qua Mock | PASS · `IfluxMarketMaster` |
| WP-1 | Community Q/G/V | PASS |
| WP-2 | Stock/Entity/Group | PASS |
| WP-3 | Watchlist + Alerts SR | PASS |
| WP-4 | Market widgets + dashboard | PASS |
| WP-5 | Flow + shell/search | PASS |
| WP-6 | 0 Prod mock consumer → DELETE | PASS |
| WP-7 | Deploy + CF purge | PASS · 2026-08-09 |

---

## Deploy

- Target: Production web root (`DEPLOY_WEB_PRODUCTION`)
- Sync: `User_Web/iflux-web-ui/` (+ `Admin …/templates.html`)
- Cloudflare: `purge_everything` → **success**
- User: hard refresh sau purge

---

## Note (ngoài scope User Web Prod FE)

- `Admin_Design_system/iflux-admin-ui/mock-market.js` + `platform-layers-resolver.js` vẫn dùng mock **Admin sandbox** (không phải User Web Prod authority). Không xóa trong WP-6 này.

---

*06-Verification-Evidence · WP-0…7 complete · 2026-08-09*
