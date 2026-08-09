# 06 — Verification Evidence (A/B/C)

# Stock Master LISTED Sync Completeness

| | |
|--|--|
| **Task ID** | `090826_Market_Stock_Master_LISTED_Sync_Completeness` |
| **Date** | 2026-08-09 |
| **Environment** | Production |
| **Status** | 🟢 **PASS** (BR-MS-01…07) — stub còn ≤7 UPCOM do source thiếu shortName |

> KSF = evidence hàng, không phải scope fix one-off.

---

## Evidence A — Code

| Check | Result |
|-------|--------|
| Pagination `floorNamed` / per-floor break | PASS — `market-source-adapters.js` |
| Không còn `seen.length >= total` | PASS |
| Quote không `ensureStockRow(ticker, ticker)` | PASS — `quote_ensureStockRow false` |
| `syncInstrumentUniverse` luôn `listed_fill` | PASS |

---

## Evidence B — DB (sau listed_fill)

| Check | Result |
|-------|--------|
| KSF name | `Công ty cổ phần Tập đoàn Sunshine` |
| KSF short_name | `CTCP Tập đoàn Sunshine` |
| KSF english_name | `Sunshine Group JSC` |
| KSF exchange | **HNX** (không còn HOSE stub) |
| KSF isin | `VN000000KSF4` |

---

## Evidence C — Runtime reconcile (2 lần sync)

### Lần 1 (sau deploy listed_fill)

| Metric | Value |
|--------|------:|
| listed_identity | 1361 |
| filled | 27 |
| new_auto | 0 |
| missing_in_master HOSE/HNX/UPCOM | **0 / 0 / 0** |
| exchange_mismatch | **0** |
| stub_identity total | 5 (UPCOM samples: HHB, GPC, RGG, CK8, VLS — VNDirect cũng thiếu short) |

### Lần 2 (idempotent)

| Metric | Value |
|--------|------:|
| filled | 0 |
| new_auto | 0 |
| missing | 0 |
| exchange_mismatch | 0 |
| stub | 7 (dao động API / short null phía source) |

---

## BR status

| BR | Status |
|----|--------|
| BR-MS-01 Pagination | PASS |
| BR-MS-02 LISTED authority | PASS |
| BR-MS-03 Sector no name | PASS (skipped_sector_only, no stub create) |
| BR-MS-04 Metadata write | PASS (KSF + filled 27) |
| BR-MS-05 Quote no Master | PASS |
| BR-MS-06 Reconcile 3 sàn | PASS |
| BR-MS-07 Audit toàn sàn | PASS |

---

*Verification 2026-08-09 · Production.*
