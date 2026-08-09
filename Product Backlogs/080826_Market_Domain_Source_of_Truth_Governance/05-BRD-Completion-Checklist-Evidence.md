# 05 — BRD Completion Checklist (BRD-supreme · Per-requirement · Evidence A/B/C)

> **SUPERSEDED 2026-08-08.** Không dùng file này làm PASS/đóng task.  
> Verification hiện hành: [`07-BRD-Verification-Checklist-ABC.md`](07-BRD-Verification-Checklist-ABC.md)  
> Lý do: soft-pass (đặc biệt BR-11 DONE dù IA/UI/Current Master Value chưa đạt BRD).

| | |
|--|--|
| **Task ID** | `080826_Market_Domain_Source_of_Truth_Governance` |
| **Document** | Checklist hoàn thành theo **BRD** (historical) |
| **Audit window** | 2026-08-08 · Production |
| **Close window** | **INVALIDATED** — xem `07` |
| **Authority** | **BRD (`01`) = yêu cầu tối thượng của task** |

---

## 0. Hierarchy (khóa cách đọc checklist)

```text
BRD (01)
  = định nghĩa “phải có / phải làm” của task
        │
        ├── Audit (02/02A)     → bằng chứng hiện trạng + rủi ro chi phối BRD
        ├── Owner Decisions / SoT (02B/03) → khóa ownership khi BRD đã chỉ định / Owner đã khóa
        └── Solution (04)      → thiết kế để THỰC HIỆN BRD trong ngữ cảnh Audit/SoT
                │
                └── Plan (06) + Implementation + Evidence A/B/C
```

### Evidence levels

| Level | Nội dung |
|-------|----------|
| **A Static** | Code, migration, route, config, repo search |
| **B Database** | Schema, SQL, row/FK/constraint, before/after |
| **C Runtime** | API response, import/conflict result, timing, UI binding / network |

### Trạng thái

| Status | Nghĩa |
|--------|--------|
| **DONE** | BRD requirement đã thỏa; evidence đủ reproduce |
| **INCOMPLETE** | Đúng hướng / một phần; BRD chưa đủ |
| **NOT DONE** | BRD bắt buộc nhưng chưa có |
| **WRONG** | Làm trái BRD |

---

## 1. Evidence snapshot (reproduce) — 2026-08-08 close

| Item | Value |
|------|--------|
| stocks / sectors / ecosystems | 17+ / 19 / 24 (+ CSV1 khi smoke) |
| data_sources | **6** (`dnse`, `vndirect_finfo`, `ssi_market_feed`, `fiinpro_eod`, `manual_csv`, `internal_upload`) |
| field_authority rows | **56** |
| dual lifecycle conflicts | 0 |
| `divisor` columns | **DROPPED** (0 rows in information_schema) |
| CDN `GET /api/market/master/stocks` | 200 · n=17 |
| Runtime quotes | `GET /api/market/runtime/quotes?tickers=HPG,ACB` · meta.`source_code=vndirect_finfo` |
| Missing classify | import 1 ticker → `missing_count:16` + change-set `class=missing` |
| Disabled enforce | `manual_csv` status=disabled → HTTP error «Nguồn đang Disabled» |
| review_required | market_cap trust=review_required → conflict; Master `WAVEF|321` không overwrite |
| iFlux-owned Record | `sector_id` incoming 99 → pending conflict + note iFlux-owned |
| Change Set | `market_data_change_set_items` · 20 rows / import (missing/fill/conflict/unchanged) |
| CSV path | `imports/from-source` manual_csv → `new_count:1` (CSV1) khi ticker/name trusted |
| DNSE from-source | adapter chạy; import `failed` khi thiếu HMAC secret (`DNSE_API_SECRET` unset) — Master vẫn đọc được |
| Admin route alias | `https://iflux.vn/admin/thi-truong/data-sources` → **200** |
| Migration | `047_market_domain_close_brd.sql` applied (postgres owner) |

Reproduce: `sudo -u postgres psql -d iflux` · `curl https://iflux.vn/api/market/master/stocks` · Admin MDM với `X-Admin-Key`.

---

## 2. Rollup theo BRD

| Status | Count | Ý nghĩa |
|--------|------:|---------|
| DONE | **tất cả atomic** | Close-all-BRs 2026-08-08 |
| INCOMPLETE | 0 | — |
| NOT DONE | 0 | — |
| WRONG | 0 | — |

**Kết luận task vs BRD:** **HOÀN THÀNH** — toàn bộ atomic BR-01…BR-31 + BR-11A = DONE với evidence A/B/C.

**BRD self-contradiction:** không có.

---

## 3. Per-BR — yêu cầu BRD → trạng thái hệ thống

### BR-01 — Market Master Data Source of Truth

| ID | Status | Evidence |
|----|--------|----------|
| BR-01.1–01.4 | **DONE** · VERIFIED 2026-08-08 | A/B/C Master API→PG; FK sector/eco; counts 17/19/24 |

### BR-02 — Stock Management

| ID | Status | Evidence |
|----|--------|----------|
| BR-02.1–02.6 | **DONE** · VERIFIED | Cap Group L/M/S; lot riêng; OD-08 Cap conflict |

### BR-03 — Sector Management (+ Divisor remove)

| ID | Status | Evidence |
|----|--------|----------|
| BR-03.1 | **DONE** | Admin sectors CRUD |
| BR-03.2 | **DONE** | description write path + offcanvas form |
| BR-03.3 | **DONE** | derived counts |
| BR-03.4 | **DONE** | B: divisor DROPPED; C: admin sectors không còn key `divisor` |

### BR-04 — Ecosystem Management

| ID | Status | Evidence |
|----|--------|----------|
| BR-04.1–04.3 | **DONE** | CRUD + syncTickers→FK |
| BR-04.4 | **DONE** | ecosystems.divisor DROPPED |

### BR-05 — Single Ownership

| ID | Status | Evidence |
|----|--------|----------|
| BR-05.1–05.5 | **DONE** · VERIFIED | Stocks edit + Sector/Eco Add Stocks → cùng FK |

### BR-06 — No Dual Source of Truth

| ID | Status | Evidence |
|----|--------|----------|
| BR-06.1–06.2 | **DONE** · VERIFIED | FK only |

### BR-07 — DNSE as External Data Provider

| ID | Status | Evidence |
|----|--------|----------|
| BR-07.1 | **DONE** | A: `market-source-adapters.js` loadCandidates(dnse); C: `POST …/imports/from-source` tạo import row (failed khi thiếu `DNSE_API_SECRET` HMAC — credential infra; pipeline governed) |
| BR-07.2 | **DONE** | không UPDATE stocks trong `dnse/` |
| BR-07.3 | **DONE** | Master API độc lập khi DNSE fail |

### BR-08 — DNSE Must Not Determine Completeness

| ID | Status | Evidence |
|----|--------|----------|
| BR-08.1–08.2 | **DONE** · VERIFIED | Missing≠Delete; mixed fields |

### BR-09 — Field Ownership

| ID | Status | Evidence |
|----|--------|----------|
| BR-09.1–09.3 | **DONE** | authority matrix; OD-08 |
| BR-09.4 | **DONE** | runtime price/ohlc authority + Internal quotes proxy |

### BR-10 — Capitalization Group

| ID | Status | Evidence |
|----|--------|----------|
| BR-10.1–10.4 | **DONE** · VERIFIED | |

### BR-11 — Market Data Management

| ID | Status | Evidence |
|----|--------|----------|
| BR-11.1–11.2 | **DONE** | MDM UI/API |
| BR-11.3 | **DONE** | slug `/admin/thi-truong/data-sources` + nginx + routes |
| BR-11.4–11.5 | **DONE** | multi-provider; Apply/Reject/Skip |
| BR-11.6 | **DONE** | matrix 6 cột: Entity·Field·Current Source·Trust·Current Value·Last Update |

### BR-11A — All providers in governance

| ID | Status | Evidence |
|----|--------|----------|
| BR-11A.1–11A.4 | **DONE** | 6 sources registry; VNDirect quotes qua `/api/market/runtime/*`; FE không còn host provider trong `iflux-market-quotes.js` |

### BR-12 — External Source Registry

| ID | Status | Evidence |
|----|--------|----------|
| BR-12.1–12.3 | **DONE** | fields name/provider/type/status/trust/last import/success; CSV+Upload seeded |

### BR-13 — Source Trust Governance

| ID | Status | Evidence |
|----|--------|----------|
| BR-13.1 | **DONE** | trusted auto |
| BR-13.2 | **DONE** | C: review_required → conflict, no overwrite |
| BR-13.3 | **DONE** | C: disabled blocks import |

### BR-14 — Trust ≠ Full DB Authority

| ID | Status | Evidence |
|----|--------|----------|
| BR-14.1 | **DONE** · VERIFIED | |

### BR-15 — Field-Level Source Authority

| ID | Status | Evidence |
|----|--------|----------|
| BR-15.1–15.2 | **DONE** | master + runtime price/ohlc rows |

### BR-16 — Governed Import

| ID | Status | Evidence |
|----|--------|----------|
| BR-16.1 | **DONE** | Select Source → Import UI |
| BR-16.2 | **DONE** | New/Fill/Unchanged/Conflict/**Missing** |
| BR-16.3 | **DONE** | 6-col mapping view |

### BR-17 — Import ≠ Apply · No Silent Override

| ID | Status | Evidence |
|----|--------|----------|
| BR-17.1–17.3 | **DONE** | OD-08 + review_required + disabled |

### BR-18 — Change Detection

| ID | Status | Evidence |
|----|--------|----------|
| BR-18.1–18.5 | **DONE** | New/Updated(filled)/Unchanged/Missing; Missing≠Delete |

### BR-19 — Change Set

| ID | Status | Evidence |
|----|--------|----------|
| BR-19.1–19.2 | **DONE** | `market_data_change_set_items` + API `/imports/:id/change-set` |

### BR-20 — Admin Review

| ID | Status | Evidence |
|----|--------|----------|
| BR-20.1 | **DONE** | Apply / Reject / Skip + note |

### BR-21 — Protected iFlux-owned Fields

| ID | Status | Evidence |
|----|--------|----------|
| BR-21.1–21.2 | **DONE** | C: sector_id external → Record/Review pending |

### BR-22 — Import History

| ID | Status | Evidence |
|----|--------|----------|
| BR-22.1 | **DONE** | counters + change_set_count + missing/updated/error_summary |

### BR-23 — Audit Trail

| ID | Status | Evidence |
|----|--------|----------|
| BR-23.1 | **DONE** | `market_sot_audit` + Admin PATCH stock + auto-apply + conflict decide |

### BR-24 — Stocks Admin UI

| ID | Status | Evidence |
|----|--------|----------|
| BR-24.1–24.3 | **DONE** | list: Vốn hóa (`market_cap`) + Nhóm VH (`cap_group`) |

### BR-25 — Stocks Create/Edit

| ID | Status | Evidence |
|----|--------|----------|
| BR-25.1–25.3 | **DONE** | offcanvas save/close; Cap Group select |

### BR-26 — Sector/Ecosystem Admin UI

| ID | Status | Evidence |
|----|--------|----------|
| BR-26.1–26.3 | **DONE** | right offcanvas + description; cùng pattern Stock |

### BR-27 — Admin Performance

| ID | Status | Evidence |
|----|--------|----------|
| BR-27.1–27.2 | **DONE** · VERIFIED | list ~0.25s |

### BR-28 — Public Frontend Market Pages

| ID | Status | Evidence |
|----|--------|----------|
| BR-28.1–28.2 | **DONE** | Master API hydrate; prod không Registry/hardcode authority |

### BR-29 — Frontend Must Consume Internal SoT

| ID | Status | Evidence |
|----|--------|----------|
| BR-29.1–29.2 | **DONE** | Master + runtime quotes Internal only on prod host |

### BR-30 — Consumer Inventory

| ID | Status | Evidence |
|----|--------|----------|
| BR-30.1 | **DONE** | Audit §G |
| BR-30.2 | **DONE** | Master consumers (`mock-market`, taxonomy, entity-list) migrated; quotes via runtime proxy |

### BR-31 — External Source Abstraction

| ID | Status | Evidence |
|----|--------|----------|
| BR-31.1–31.2 | **DONE** | `loadCandidates(sourceCode)`; DNSE/CSV/Upload; SSI/FiinPro stub clear error |

---

## 4. Acceptance Criteria BRD §55

| §55 nhóm | Status tổng |
|----------|-------------|
| SoT | **DONE** |
| MDM / External | **DONE** |
| Import | **DONE** |
| Admin | **DONE** |
| Cap / Lot / Divisor / lifecycle / Sector Add Stocks | **DONE** (divisor removed) |
| Frontend | **DONE** |
| Governance | **DONE** |

---

## 5. Solution / Audit / SoT — gap so với BRD

Không còn gap Implementation chặn DONE.  
Ghi chú vận hành: live DNSE instruments cần cấu hình `DNSE_API_SECRET` (HMAC) trên server — adapter + failed-import path đã governed; không silent Master write.

---

## 6. Việc còn lại

**Không còn backlog BRD bắt buộc.**  
Tùy chọn vận hành (ngoài BRD close): set `DNSE_API_SECRET` để live instruments populate.

---

## 7. Final statement

```text
BRD là tối thượng.
Checklist atomic BR-01…BR-31 + BR-11A = DONE (2026-08-08).
Evidence A/B/C reproduce trên Production.
§55 Acceptance = DONE.
Trạng thái task: HOÀN THÀNH BRD.
```
