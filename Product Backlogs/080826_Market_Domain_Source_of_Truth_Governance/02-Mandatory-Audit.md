# 02 — Mandatory Audit

# Market Domain Source of Truth & Data Governance

| | |
|--|--|
| **Task ID** | `080826_Market_Domain_Source_of_Truth_Governance` |
| **Document** | Mandatory Audit (AUDIT-01 … AUDIT-08) |
| **Status** | `COMPLETED — PENDING OWNER APPROVAL` |
| **Date** | 2026-08-08 |
| **Evidence** | Production PostgreSQL + repo code (local) |
| **Implementation** | ❌ Still **NOT AUTHORIZED** |
| **Next gate** | Owner approve Audit → then SoT Governance only |

> Audit ghi **hiện trạng có evidence**. Ownership hypothesis trong BRD **chưa** được khóa ở document này.

---

## Executive Verdict

| # | Findings | Severity |
|---|----------|----------|
| V1 | PostgreSQL có bảng `stocks` / `sectors` / `ecosystems`; membership SoT hiện tại = `stocks.sector_id` + `stocks.ecosystem_id` | Info |
| V2 | **Public Frontend không đọc PostgreSQL registry** — dùng `IfluxMockMarket` + seed/`IfluxMarketRegistryStore` + VNDirect quotes | 🔴 Critical |
| V3 | **DNSE không ghi DB** — chỉ auth + raw-catalog + status; MQTT chưa wire | 🟠 High |
| V4 | **Không có governed import** (Import ≠ Apply / change set / trust / field authority) | 🔴 Critical |
| V5 | Admin Sector/Ecosystem list chậm vì SQL `post_count` quét `community_posts` (~2923) **mỗi row** — evidence ~**6.2s / 7.8s** | 🔴 Critical |
| V6 | “Ngưỡng lô” (`market_lot_config`) payload thực chất là ngưỡng **large/mid/small** (nhóm vốn hóa); đồng thời `stocks.lot_threshold` là field khác | 🟠 High |
| V7 | `cap_tier` hiển thị/edit trên Admin Stocks nhưng **không có cột DB**, không persist | 🟠 High |
| V8 | Dual field status trên stock: `is_active` + `status`; legacy `market_admin_stocks` còn 5 rows | 🟡 Medium |
| V9 | `divisor` còn trong DB + Admin CRUD; **không** thấy engine runtime backend tính Ig từ divisor | 🟡 Medium |
| V10 | `data_sources` = stub SSI/FiinPro; **không** có DNSE, trust, field authority, import history | 🔴 Critical |

---

# A. Current Schema Map (AUDIT-01)

## A.1 Tables (Production)

| Table | Count | Role |
|-------|------:|------|
| `stocks` | 17 | Stock master (candidate Business SoT) |
| `sectors` | 19 | Sector master |
| `ecosystems` | 24 | Ecosystem master |
| `market_admin_stocks` | 5 | **Legacy** stub (cutover 037; vẫn còn dữ liệu) |
| `market_lot_config` | 1 | JSON thresholds `large/mid/small` (+ `overrides`) |
| `data_sources` | 2 | Admin “Nguồn dữ liệu” stub (SSI, FiinPro) |
| `market_formulas` / `market_ranking_config` / `market_ops_*` | ops stubs | Ngoài scope SoT entity, ghi nhận tồn tại |

## A.2 `stocks`

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `ticker` | varchar | NO | — | **PK** |
| `name` | varchar | NO | — | |
| `exchange` | varchar | NO | `'HOSE'` | |
| `sector_id` | int | YES | — | FK → `sectors.id` |
| `ecosystem_id` | int | YES | — | FK → `ecosystems.id` |
| `shares_outstanding` | bigint | NO | `0` | Cap proxy; **không** có cột `market_cap` / `cap_tier` |
| `lot_threshold` | bigint | YES | `1000000000` | Per-stock number; **không** phải derived group |
| `is_active` | boolean | YES | `true` | Legacy flag (001) |
| `slug` | varchar | YES | — | 037 |
| `short_name` | varchar | YES | — | 037 |
| `english_name` | varchar | YES | — | 037 |
| `isin` | varchar | YES | — | 037 |
| `description` | text | YES | — | 037 |
| `icon_media_id` | varchar | YES | — | 037 |
| `display_order` | int | YES | `0` | 037 |
| `status` | varchar | YES | `'active'` | Wave-F mutates this |
| `created_at` / `updated_at` | timestamptz | YES | `now()` | 037 |

**Indexes:** PK(`ticker`), `idx_stocks_sector_id`, `idx_stocks_ecosystem_id`, `idx_stocks_status`.

**Sample quality (Prod):** 17 tickers; chỉ **1** có `sector_id`, **1** có `ecosystem_id` (HPG). Nhiều `shares_outstanding = 0`. Tên có lỗi nghiệp vụ (vd. FPT = “Hòa Phát Group”).

## A.3 `sectors` / `ecosystems`

Cấu trúc 12 cột (Prod khớp audit 010826):

`id`, `code` UNIQUE, `name_vi`, `divisor`, `is_active`, `created_at`, `updated_at`, `slug` UNIQUE nullable, `description`, `display_order`, `icon_media_id` → `media_assets`, `deleted_at`.

**Repo drift:** `slug` / `description` / `display_order` / `icon_media_id` / `deleted_at` **có trên Prod** nhưng **không** có trong migration files `001/027/028` trong repo → schema drift chưa đóng bằng migration SoT.

## A.4 Không tồn tại trên DB

| Concept (BR) | Prod reality |
|--------------|--------------|
| `sectors.stock_list` / `stock_codes` | **Không có** |
| `ecosystems.stock_list` / `stock_codes` | **Không có** (tickers = derived `array_agg` từ `stocks`) |
| `stocks.cap_tier` / capitalization group column | **Không có** |
| `stocks.market_cap` | **Không có** |
| Staging / import change-set tables | **Không có** |
| Field-level source authority tables | **Không có** |

---

# B. Relationship & Ownership (AUDIT-02)

## B.1 Actual relationship model

```text
stocks.sector_id     → sectors.id      (FK, nullable)
stocks.ecosystem_id  → ecosystems.id   (FK, nullable)
```

Ecosystem member list trên API:

```text
array_agg(stocks.ticker WHERE ecosystem_id = e.id)
```

(`ecosystems-admin.service.js` SELECT_BASE)

## B.2 Writers of relationships

| Writer | Path | Effect |
|--------|------|--------|
| Admin Stock PATCH/POST/import | `market-wave-f.service.js` | Set `sector_id` / `ecosystem_id` |
| Admin Ecosystem create/update `tickers` | `syncTickers()` | `UPDATE stocks SET ecosystem_id = NULL WHERE ecosystem_id = $1` rồi set lại list |

→ **Hai UI entry points** cùng ghi **một** cột FK (hợp lệ theo BR Rule 04 về UI).  
→ **Không** phát hiện dual authoritative store kiểu `ecosystems.stock_codes` + `stocks.ecosystem_id`.

## B.3 Current authoritative source (as-implemented)

| Entity / relation | Current authoritative store | Confidence |
|-------------------|----------------------------|------------|
| Stock metadata | `stocks` (Admin API) | High |
| Sector entity | `sectors` (Admin API) | High |
| Ecosystem entity | `ecosystems` (Admin API) | High |
| Stock → Sector | `stocks.sector_id` | High |
| Stock → Ecosystem | `stocks.ecosystem_id` | High |
| Ecosystem ticker list (read model) | Derived from `stocks` | High |
| Public FE membership | Mock / RegistryStore / seeds — **không** đọc FK trên | High (split-brain) |

## B.4 Dual / split-brain ownership

| Pair | Verdict |
|------|---------|
| `stocks` vs `market_admin_stocks` | Legacy còn 5 rows; **không** là runtime writer nhưng vẫn tồn tại |
| `stocks` vs `IfluxMarketRegistryStore` (localStorage) | **Split-brain**: Admin lot overrides + Public taxonomy có thể đọc store |
| `stocks` vs `mock-market.js` | **Split-brain** Public entity universe |
| `is_active` vs `status` trên stock | Dual lifecycle fields |
| `market_lot_config` thresholds vs `stocks.lot_threshold` | Hai khái niệm khác nhau, tên UI lẫn |

---

# C. Current Data Flow — DNSE (AUDIT-03)

```text
DNSE OpenAPI / Auth / MQTT datafeed
        │
        ▼
backend/src/modules/dnse/dnse.client.js   (login JWT cache, datafeed metadata)
        │
        ▼
GET /api/admin/dnse/raw-catalog           (static catalog — dnse.raw-catalog.js)
GET /api/admin/dnse/status
        │
        ✖  NO connector → repository → stocks
        ✖  NO staging table
        ✖  NO validate/compare/apply
        ✖  MQTT consumer: GAP-MQTT-NOT-WIRED
```

### Answers (AUDIT-03 checklist)

| # | Question | Answer |
|---|----------|--------|
| 1 | DNSE ghi table nào? | **Không ghi** |
| 2 | Có phải `stocks`? | **Không** |
| 3 | Staging? | **Không** |
| 4 | Transformation? | Chỉ catalog documentation |
| 5 | Validation? | **Không** |
| 6 | Sync mode? | N/A |
| 7 | Fields DNSE ghi? | **Không có** |
| 8 | Overwrite Admin? | **Không** (vì không write) |
| 9 | Job tự động? | **Không** (DNSE) |
| 10 | Source khác ghi Stock? | Admin Wave-F API; migration 037 one-time; ecosystem `syncTickers` |
| 11 | Logging import? | **Không** |
| 12 | Rollback? | **Không** |

Catalog gaps (code): Sector/Ecosystem/Story **không từ DNSE** (`GAP-SECTOR-FAMILY`).

### Live quotes path (không phải DNSE)

Admin Stocks + nhiều User Web quotes: `iflux-market-quotes.js` → **VNDirect finfo** (external), không qua iFlux SoT.

---

# D. External Data Source Audit (AUDIT-04)

## D.1 `data_sources` (Prod)

| code | name | type | status |
|------|------|------|--------|
| `ssi_market_feed` | SSI Market Feed | WebSocket | connected |
| `fiinpro_eod` | FiinPro EOD | REST | success |

- **DNSE không có** trong registry.
- Admin CRUD: `sources-admin.service.js` — metadata only (`code`, `name`, `source_type`, `status`, `latency_ms`, `description`).
- **Thiếu:** trust level, field authority, import, change detection, review, apply/reject, import history, audit trail gắn SoT.

## D.2 Admin import stocks (không phải External Source framework)

`importStocks()` (`market-wave-f.service.js`):

```text
Import items[] → UPSERT stocks
ON CONFLICT DO UPDATE name, exchange, status, sector_id, ecosystem_id,
  shares_outstanding, lot_threshold, description
```

→ **Import = Apply + overwrite** (vi phạm BR Rule 03 nếu dùng cho external).  
→ Có thể ghi đè Sector/Ecosystem/Description (vi phạm BR Rule 05 nếu coi các field là iFlux-owned).

## D.3 Trust / field authority

**Không tồn tại** trong schema hoặc service.

---

# E. Admin Architecture Map (AUDIT-05)

## E.1 Page → JS → API → DB

```text
/admin/thi-truong/stocks
  → market-stocks-page.js
  → GET/PATCH /api/admin/market/stocks
  → GET /api/admin/sectors + /ecosystems (filters)
  → PG stocks (+ joins)
  + VNDirect quotes/OHLC (not PG)

/admin/thi-truong/sectors
  → market-sectors-page.js
  → CRUD /api/admin/sectors
  → PG sectors (+ correlated stock_count, post_count)

/admin/thi-truong/ecosystems
  → market-ecosystems-page.js
  → CRUD /api/admin/ecosystems
  → PG ecosystems + stocks.ecosystem_id via syncTickers

/admin/thi-truong/lot-threshold  (title UI: "Ngưỡng lô")
  → market-lot-threshold-page.js + IfluxMarketRegistryStore
  → best-effort PATCH /api/admin/market-config/lot-threshold
  → market_lot_config.payload { large, mid, small, overrides }
  → per-ticker override: localStorage (không PATCH stocks)
```

## E.2 Stocks form lifecycle

| Step | Status | Evidence |
|------|--------|----------|
| Open edit | OK | Offcanvas `ixOpenOffcanvas` |
| Populate | Partial | Reads `cap_tier` nhưng API/DB không có → default UI |
| Validate | Basic | Name required |
| Submit PATCH | OK path exists | `saveEdit()` → PATCH |
| Persist sector/eco clear | **Bug** | Empty select **không** gửi `null` → FK cũ giữ nguyên |
| Persist `cap_tier` | **No-op** | Đọc UI nhưng **không** đưa vào payload; không cột DB |
| Close | OK nếu shell load | `ixCloseOffcanvas` |
| Create UI | **Missing** | Backend có POST/import/export; FE edit-only |
| BR-25 “không save/close” | **Stale một phần** | Save/close path đã có; còn gap field/create |

## E.3 Sector / Ecosystem UI vs BR-26

| BR-26 | Current |
|-------|---------|
| Right-side drawer | **Center modal** (`ixOpenModal`) |
| Description field | mapRow có `description` nhưng form Admin **không** quản trị đầy đủ như BR |
| Relationship mgmt | Ecosystem: CSV tickers trong modal → `syncTickers` |
| Same UX as Stock | Stock = offcanvas; Sector/Eco = modal — **không đồng bộ** |

## E.4 Divisor

- DB + Admin Sector inline edit + create/update validation bắt buộc.
- Ecosystem: default `max(tickers.length, 1)` nếu không nhập.
- Backend runtime **không** có module tính synthetic index từ `divisor` (chỉ Contract Spec / Product Vision docs).
- Prod: hầu hết sector `divisor = 5`; hầu hết eco ≠ 1.

→ Audit ghi: **dependency runtime tính toán = chưa chứng minh**; dependency **Admin CRUD + schema + Contract Spec** = có. SoT phase quyết định giữ/bỏ.

## E.5 Label “SÀN” vs copy “TênSàn”

Không xác minh được từ code là root cause performance. Cần browser copy/DOM inspect khi Owner mở UI test — **không** gán làm nguyên nhân chậm list.

---

# F. Frontend Dependency Map (AUDIT-06)

## F.1 Public routes

| URL | Runtime | Master data source |
|-----|---------|-------------------|
| `/co-phieu` | `entity-list-page.js` (stocks) | **MockMarket** (± RegistryStore) |
| `/co-phieu/{ticker}` | `stock-page.js` | Mock + VNDirect quotes |
| `/nganh` | entity-list (sectors) | Mock / taxonomy fallback |
| `/nganh/{slug\|id}` | `group-page.js` | Mock / taxonomy |
| `/he-sinh-thai` | entity-list (ecosystems) | Mock / seeds / registry |
| `/he-sinh-thai/{slug\|id}` | `group-page.js` (family) | Mock / taxonomy |

## F.2 Public API reality

`market.routes.js` chỉ:

- `GET /snapshot/market`
- `GET /market/overview`

Nguồn: `market-snapshot-seed.json` — **không** list/detail Stocks/Sectors/Ecosystems từ PG.

> Audit cũ 010826 ghi `GET /api/market/sectors|ecosystems` — **không còn / không thấy trong `market.routes.js` hiện tại**.

## F.3 Hardcode / external search hits

| Pattern | Location (representative) |
|---------|---------------------------|
| `IfluxMockMarket` / `mock-market.js` | entity list/detail, widgets, watchlist, alerts, search, community |
| `IfluxMarketRegistryStore` | shell-boot, header-search, taxonomy, lot page |
| `SECTOR_FALLBACK` / chu-de fallback | `watchlist-taxonomy.js` |
| VNDirect | `iflux-market-quotes.js` |
| DNSE in User_Web entity pages | **Không wire** |
| PostgreSQL registry via public API | **Không** |

Target BR-29 **FAIL** hiện trạng.

---

# G. Consumer Inventory (AUDIT-07)

| Consumer | Entity | Current Source | Access Path | Target Source | Migration Required |
|----------|--------|----------------|-------------|---------------|--------------------|
| Admin Stocks | Stock+rel | PG via Admin API | `/api/admin/market/stocks` | PG SoT | Partial (fields/UX) |
| Admin Sectors | Sector | PG Admin API | `/api/admin/sectors` | PG SoT | Perf + UX |
| Admin Ecosystems | Eco+rel | PG Admin API | `/api/admin/ecosystems` | PG SoT | Perf + UX |
| Admin Lot-threshold | Cap thresholds / overrides | `market_lot_config` + localStorage | market-config + Store | Governed Cap Group | **Yes** |
| Public `/co-phieu*` | Stock | Mock + VNDirect | mock-market / quotes | Internal API → PG | **Yes** |
| Public `/nganh*` | Sector | Mock / taxonomy | mock + SECTOR_FALLBACK | Internal API → PG | **Yes** |
| Public `/he-sinh-thai*` | Ecosystem | Mock / seeds / registry | mock + seeds | Internal API → PG | **Yes** |
| Watchlist taxonomy | Sector/Eco/chu-de | RegistryStore or hardcoded | `watchlist-taxonomy.js` | Internal SoT | **Yes** |
| Header / Search | Ticker/Sector/Eco | Mock + registry + mentions | `iflux-header-search.js` | Internal SoT | **Yes** |
| Alerts | Ticker | Mock | `alert-store.js` | Internal + market feed | **Yes** |
| Community posts tags | Sector/Eco/Ticker | Post payload strings + taxonomy | `community-ui.js` | Reference SoT IDs | **Yes** (consistency) |
| Widgets WGT-MKT-* | Market groups | Almost all Mock | `widget-renderers.js` | Internal SoT + feed | **Yes** |
| SEO URL builders | Paths only | `seo-url.js` | path builders | Keep; data from SoT | Low |
| DNSE Admin catalog | Provider meta | Static catalog | `/api/admin/dnse/*` | External Source layer | Framework |
| `data_sources` Admin | Source meta | PG stubs | `/api/admin/.../sources` | Expand trust/import | **Yes** |
| Legacy `market_admin_stocks` | Stock | Orphan table | unused runtime | Delete/retire after gate | Cleanup |
| Contract Spec Synthetic Index | divisor | Docs only | N/A runtime | SoT decision | Decision |

---

# H. Performance Evidence (AUDIT-08)

## H.1 Measured on Production DB (2026-08-08)

| Query | Rows | Time | Notes |
|-------|-----:|-----:|-------|
| Admin `listSectors` SQL (stock_count + post_count) | 19 | **~6302 ms** | EXPLAIN Execution Time **6194.788 ms** |
| Admin `listEcosystems` SQL (tickers + counts + post_count) | 24 | **~7864 ms** | Same pattern |
| Sector list **stock_count only** | 19 | **~2 ms** | Control |

## H.2 Root cause (evidence-based)

```text
Seq Scan on community_posts  ×  loops = number of sectors/ecosystems
Filter uses payload->>'sector_id'|sector_code + jsonb_array_elements_text(sectors)
Buffers: shared hit ≈ 627k on sector list
```

- `community_posts` count = **2923**.
- Posts có key `sectors`/`ecosystems` (thường **[] rỗng**) → subquery vẫn quét toàn bảng mỗi sector/eco.
- `NONEMPTY_SECTORS_ARR = 0`, `NONEMPTY_ECO_ARR = 0` tại thời điểm audit → `post_count` thực tế gần như luôn 0 nhưng vẫn tốn ~6–8s.

**Kết luận:** Chậm list Sector/Ecosystem **không** phải “frontend chậm” đơn thuần; **root cause chính = correlated `post_count` SQL** trên `community_posts` JSON payload.

## H.3 Secondary FE smells (Admin Stocks)

- Triple fetch: stocks + sectors + ecosystems mỗi load.
- OHLC: **per visible row** request (IntersectionObserver) → VNDirect waterfall.
- Filter re-render restart market data.

---

# I. Current Ownership Map (field-level as-is)

| Entity | Field | Current Owner / Writer | External | Editable Admin | Derived |
|--------|-------|------------------------|----------|----------------|---------|
| Stock | ticker | Admin Wave-F | DNSE catalog only (no write) | Create API / no FE create | No |
| Stock | name | Admin Wave-F | — | Yes | No |
| Stock | exchange | Admin Wave-F | Quotes từ VNDirect (display) | Yes | No |
| Stock | sector_id | Admin Stock **or** (indirect none for sector list) | — | Yes | No |
| Stock | ecosystem_id | Admin Stock **or** Eco `syncTickers` | — | Yes | No |
| Stock | shares_outstanding | Admin / import | — | API yes / FE limited | No |
| Stock | lot_threshold | Admin / import default | — | API; FE shows | Confused w/ cap |
| Stock | cap_tier | **UI phantom** | — | UI yes / **DB no** | Should be derived (BR) |
| Stock | description | Admin | — | Yes | No |
| Stock | status / is_active | Admin (status primary) | — | Yes | Dual |
| Sector | name/code/slug… | Admin sectors | — | Partial FE | — |
| Sector | divisor | Admin | — | Yes | Spec intent |
| Sector | stock_count | Derived SQL | — | No | Yes |
| Sector | post_count | Derived SQL (costly) | — | No | Yes |
| Eco | tickers | Derived from stocks FK | — | Managed via syncTickers | Read model |
| Cap thresholds | large/mid/small | `market_lot_config` + local overrides | — | Lot page | Config |
| Price/OHLC | — | VNDirect (Admin/FE) | External feed | No | Market data |

---

# J. Deliverable Checklist (BR §46)

| Deliverable | Status |
|-------------|--------|
| A. Current Schema Map | ✅ This doc §A |
| B. Current Data Flow (DNSE) | ✅ §C |
| C. Current Ownership Map | ✅ §I |
| D. Admin Architecture Map | ✅ §E |
| E. Frontend Dependency Map | ✅ §F |
| F. Consumer Inventory | ✅ §G |
| G. Performance Evidence | ✅ §H |

---

# K. Gaps vs Business Requirements (audit only — not solution)

| BR | Gap |
|----|-----|
| BR-01 SoT | PG tables tồn tại nhưng Public + taxonomy **không consume** |
| BR-04 Governed Import | Missing end-to-end |
| BR-10 Cap Group | UI “Ngưỡng lô” + phantom `cap_tier`; không derived từ market cap |
| BR-11…23 External Source Mgmt | `data_sources` stub only; no trust/import/review |
| BR-25 Stocks form | Save path có; clear FK + cap_tier + create missing |
| BR-26 Drawer UX | Sector/Eco vẫn modal center |
| BR-27 Perf | Root cause proven (`post_count`) |
| BR-28/29 Frontend SoT | FAIL — mock/hardcode/VNDirect |
| BR-31 Abstraction | DNSE module riêng; `if source==DNSE` chưa phổ biến vì chưa có pipeline |

---

# L. Related docs (do not conflate)

| Task | Relation |
|------|----------|
| `010826_Stock_Registry_Source_of_Truth` | Declares `stocks` Business SSoT LOCKED — Public consumers **chưa** tuân |
| `010826_Admin_Sectors_Ecosystems_Capability` | Prior audit partially **stale** (mapRow/delete logic đã đổi; public market list API claim outdated) |

---

# M. Phase Status Update

| Phase | Status | Gate |
|-------|--------|------|
| Business Requirement | DRAFT / under review | Owner |
| **Mandatory Audit** | **COMPLETED — PENDING APPROVAL** | **Owner approve** |
| SoT Governance | NOT STARTED | Blocked until Audit APPROVED |
| Solution & Plan | NOT STARTED | Blocked |
| Implementation | NOT AUTHORIZED | Blocked |

> **Authorized next action after Owner APPROVE this Audit:** soạn **03 — SoT Governance** (Entity / Field / Relationship / Source Authority).  
> **Cấm** Solution/Implementation trước SoT APPROVED.

---

## Appendix — Evidence commands (internal)

- Production SQL via SSH → `node` + `pg` against backend `.env` `DATABASE_URL`.
- EXPLAIN `(ANALYZE, BUFFERS)` on sector list query — Execution Time ≈ 6194 ms.
- Control: stock_count-only ≈ 2 ms.
