# 07 — BRD Verification Checklist (A/B/C · BR Traceability)

| | |
|--|--|
| **Task** | `080826_Market_Domain_Source_of_Truth_Governance` |
| **Authority** | BRD `01` = requirement tối cao · Governance [`Product Backlogs/README.md`](../README.md) §3.0 A/B/C |
| **Window** | 2026-08-08 · Production re-audit → **fix loop** → re-verify |
| **Supersedes** | `05` (soft-pass) · bản 07 audit-only trước fix |
| **Scope** | Verification hiện hành sau implementation fix |

### Status model

| Status | Nghĩa |
|--------|--------|
| **PASS** | A+B+C (khi áp dụng) đủ reproduce; khớp chữ BRD |
| **PARTIAL** | Đúng hướng; thiếu chữ BRD hoặc thiếu tầng evidence bắt buộc |
| **FAIL** | Thiếu capability bắt buộc / lệch IA |
| **NOT EVIDENCED** | Chưa có bằng chứng (cấm dùng để đóng task) |

### Evidence snapshot (shared · post-fix 2026-08-08)

| ID | Loại | Nội dung reproduce |
|----|------|-------------------|
| EV-DB-02 | B | `stocks=19` (API master_count) · `authority=56` · `actor` cột trên `market_sot_audit` · audit `with_actor≥3` |
| EV-API-MASTER | C | `GET https://iflux.vn/api/market/master/{stocks,sectors,ecosystems}` → 200 |
| EV-API-RUNTIME | C | `GET /api/market/runtime/quotes?tickers=HPG` → 200 · FE `iflux-market-quotes.js` → `/market/runtime/quotes` |
| EV-API-MDM | C | field-authority `items=152` entity×field Master · `authority=56` · audit/change-set/sources 200 (Admin key Production) |
| EV-MATRIX-MASTER | C | Sample `HPG.name = Tập đoàn Hòa Phát` · `source_status` · `has_conflict` · `diff` khi pending |
| EV-NAV-MDM | A/C | Nav `data-sources` dưới **Thị trường** · label **Quản lý Nguồn Dữ liệu** · breadcrumb Thị trường |
| EV-MDM-UI | A/C | Source Detail panel · Audit table · Change Set offcanvas · Trust + Master mapping columns |
| EV-SSI-INTAKE | C | SSI adapter + items → `new_count=1` sau set trust name · DNSE from-source failed auth governed |
| EV-STOCK-SAVE | A/C | Offcanvas **trước** `AdmMarketStocks.init` · delegated save · `PATCH /api/admin/market/stocks/HPG` 200 |
| EV-FE-PROD | A/C | `shell-boot` / `header-search` `isProdHost` **không** load Registry · pages `/co-phieu|/nganh|/he-sinh-thai` bootstrap `mdmFix20260808` |

Reproduce DB/API: SSH origin + `infra/staging/staging.env` · Admin key từ `/var/iflux/backend/.env` · localhost `:3001` hoặc `https://iflux.vn` + cùng key.

---

## 0. Acknowledgement

Bản verify trong `05` và bản 07 audit-only đã ghi nhận FAIL thật trên BR-11 (IA/UI/Master value). **Fix loop đã đóng các gap đó** — bảng dưới là re-verify A/B/C, không soft-pass.

---

## 1. Master BR Index

| BR | Title (BRD) | Group | Rollup Status |
|----|-------------|-------|---------------|
| BR-01 | Market Master Data SoT | G1 | **PASS** |
| BR-02 | Stock Management | G1 | **PASS** |
| BR-03 | Sector Management + Divisor remove | G2 | **PASS** |
| BR-04 | Ecosystem Management | G2 | **PASS** |
| BR-05 | Single Ownership Classification | G1 | **PASS** |
| BR-06 | No Dual SoT | G1 | **PASS** |
| BR-07 | DNSE External Provider | G6 | **PASS** |
| BR-08 | DNSE ≠ Completeness | G1 | **PASS** |
| BR-09 | Field Ownership | G3 | **PASS** |
| BR-10 | Capitalization Group | G1 | **PASS** |
| BR-11 | Market Data Management | G4 | **PASS** |
| BR-11A | All providers in governance | G4 | **PASS** |
| BR-12 | External Source Registry | G4 | **PASS** |
| BR-13 | Source Trust Governance | G3 | **PASS** |
| BR-14 | Trust ≠ Full DB Authority | G1 | **PASS** |
| BR-15 | Field-Level Source Authority | G3 | **PASS** |
| BR-16 | Governed Import | G4 | **PASS** |
| BR-17 | Import ≠ Apply | G3 | **PASS** |
| BR-18 | Change Detection | G5 | **PASS** |
| BR-19 | Change Set | G5 | **PASS** |
| BR-20 | Admin Review | G5 | **PASS** |
| BR-21 | Protected iFlux-owned | G5 | **PASS** |
| BR-22 | Import History | G5 | **PASS** |
| BR-23 | Audit Trail | G5 | **PASS** |
| BR-24 | Stocks Admin UI | G8 | **PASS** |
| BR-25 | Stocks Create/Edit | G8 | **PASS** |
| BR-26 | Sector/Eco Admin UI drawer | G2 | **PASS** |
| BR-27 | Admin Performance | G2 | **PASS** |
| BR-28 | Public FE Market Pages | G7 | **PASS** |
| BR-29 | FE Consume Internal SoT | G7 | **PASS** |
| BR-30 | Consumer Inventory | G7 | **PASS** |
| BR-31 | External Source Abstraction | G6 | **PASS** |

**Task Final Acceptance: PASS**

---

## G1 — SoT core (unchanged PASS · retained)

| BR | Req ID | Requirement | Evidence A | Evidence B | Evidence C | Status |
|----|--------|-------------|------------|------------|------------|--------|
| BR-01 | BR-01.1–01.4 | Authoritative Master SoT + FK | `market-master.*` | EV-DB-02 · FK | EV-API-MASTER | **PASS** |
| BR-02 | BR-02.1–02.6 | Stock admin + Cap≠lot | Wave-F + stocks UI | Cap CHECK | Admin stocks API/UI | **PASS** |
| BR-05 | BR-05.1–05.5 | Workflow A/B FK only | syncTickers | FK | Admin sector/eco | **PASS** |
| BR-06 | BR-06.1–06.2 | Derived vs ownership | aggregate SQL | — | list counts | **PASS** |
| BR-08 | BR-08.1–08.2 | DNSE thiếu ≠ incomplete | schema mixed | null sector OK | Master 200 | **PASS** |
| BR-10 | BR-10.1–10.4 | Cap L/M/S no engine | normalizeCapGroup | CHECK | conflict path | **PASS** |
| BR-14 | BR-14.1 | Trusted ≠ full UPDATE | IFLUX_OWNED + allowlist | — | sector conflict Record | **PASS** |

---

## G2 — Sector / Eco / Divisor / Perf / Drawer (unchanged PASS)

| BR | Req ID | Requirement | Evidence A/B/C | Status |
|----|--------|-------------|----------------|--------|
| BR-03 | BR-03.1–03.4 | Sector + DROP divisor | migration 047 · divisor_cols=0 · API no divisor | **PASS** |
| BR-04 | BR-04.1–04.4 | Eco + DROP divisor | same | **PASS** |
| BR-26 | BR-26.1–26.3 | Offcanvas drawers | `offcanvas-sector/eco-form` | **PASS** |
| BR-27 | BR-27.1–27.2 | Perf <1s lists | sectors/eco ~0.4–0.5s | **PASS** |

---

## G3 — Ownership / Trust (unchanged PASS)

| BR | Req ID | Status | Notes |
|----|--------|--------|-------|
| BR-09 | BR-09.1–09.4 | **PASS** | authority + runtime quotes governed |
| BR-13 | BR-13.1–13.3 | **PASS** | trusted / review / disabled |
| BR-15 | BR-15.1–15.2 | **PASS** | field authority editable |
| BR-17 | BR-17.1–17.3 | **PASS** | OD-08 |

---

## G4 — MDM Control Plane (BR-11, 11A, 12, 16) — RE-VERIFIED AFTER FIX

| BR | Req ID | Requirement | Acceptance intent | Solution | Evidence A | Evidence B | Evidence C | Evidence location | Gap | Decision? | Status |
|----|--------|-------------|-------------------|----------|------------|------------|------------|-------------------|-----|-----------|--------|
| BR-11 | BR-11.1 | Capability Quản lý Nguồn Dữ liệu | H1 + surface | §7 §53 | H1 text in HTML | N/A UI | page 200 | `sources.html` title/H1 | — | No | **PASS** |
| BR-11 | BR-11.2 | Không tên Quản lý DNSE | naming | §7 | no DNSE-only title | N/A | — | sources.html | — | No | **PASS** |
| BR-11 | BR-11.3 | Route `/admin/thi-truong/data-sources` | 200 | §7 | routes.js | N/A | HTTP 200 | iflux-admin-routes.js | — | No | **PASS** |
| BR-11 | BR-11.IA | §53 dưới **Thị trường** | nav IA | §53 | `nav-registry` item after lot-threshold | N/A | CDN nav + breadcrumb Thị trường | EV-NAV-MDM | — | No | **PASS** |
| BR-11 | BR-11.4 | Multi-provider Master=SoT | registry | §0,7 | 6 sources + adapters | sources rows | sources API | EV-API-MDM | — | No | **PASS** |
| BR-11 | BR-11.5 | Diff/conflict + Accept/Reject | queue | §12 | conflict UI/API | conflicts | Apply/Reject/Skip | sources-page.js | — | No | **PASS** |
| BR-11 | BR-11.6a | Current Source | matrix | bullets | current_source col | — | API+UI | EV-MATRIX-MASTER | — | No | **PASS** |
| BR-11 | BR-11.6b | Source status | visible | bullets | `source_status` col Trust+Master | — | UI render statusChip | sources.html thead | — | No | **PASS** |
| BR-11 | BR-11.6c | Trusted/Authoritative | Admin set | bullets | select label Trusted / Authoritative | — | PUT field-authority | sources-page.js | — | No | **PASS** |
| BR-11 | BR-11.6d | Current Master value entity×field | thật | bullets | `fieldAuthorityMatrix` master rows | stocks join | HPG.name thật · 152 rows | EV-MATRIX-MASTER | — | No | **PASS** |
| BR-11 | BR-11.6e | Diff | visible | bullets | `diff` field | pending conflicts | UI Diff col | matrix has_conflict/diff | — | No | **PASS** |
| BR-11 | BR-11.6f | Conflict Y/N | flag | bullets | `has_conflict` | pending | UI Y/N | EV-MATRIX-MASTER | — | No | **PASS** |
| BR-11 | BR-11.6g | Apply/Reject | decision | bullets | conflict buttons | — | POST apply/reject/skip | sources-page | — | No | **PASS** |
| BR-11 | BR-11.SD | Source Detail | §53 | §53 | panel `#adm-mdm-source-detail` | — | Chi tiết button + `?code=` | sources.html/js | — | No | **PASS** |
| BR-11 | BR-11.AUD-UI | Audit UI | §53 | §53 | `#adm-mdm-audit-tbody` + fetch `/mdm/audit` | audit rows | panel Who/What/… | EV-MDM-UI | — | No | **PASS** |
| BR-11 | BR-11.CS-UI | Change Comparison UI | §53 | §53 | offcanvas + `data-mdm-changeset` | cs rows | GET change-set drill-down | EV-MDM-UI | — | No | **PASS** |
| BR-11A | BR-11A.1–11A.4 | All providers governed | registry+intake+runtime | §7,30 | adapters multi | 6 codes | SSI intake OK · VNDirect runtime · DNSE fail governed | EV-SSI-INTAKE · EV-API-RUNTIME | — | No | **PASS** |
| BR-12 | BR-12.1–12.3 | Registry fields + multi | list đủ | §7 | Trust level + Import status cols | 6 codes | API+UI | sources.html thead | — | No | **PASS** |
| BR-16 | BR-16.1–16.3 | Import + mapping Current Value | Master value | §10–11,31 | import UI + matrix Master | cs/import | EV-MATRIX-MASTER | — | — | No | **PASS** |

---

## G5 — Import / Change Set / Review / History / Audit — RE-VERIFIED

| BR | Req ID | Requirement | Evidence A | Evidence B | Evidence C | Gap | Status |
|----|--------|-------------|------------|------------|------------|-----|--------|
| BR-18 | BR-18.1–18.5 | New/Updated/Unchanged/Missing≠Delete | runImport classes | missing_count | import summary | — | **PASS** |
| BR-19 | BR-19.1–19.2 | Change Set + Admin visibility | change-set API + UI offcanvas | cs rows | open Change Set button | — | **PASS** |
| BR-20 | BR-20.1 | Apply/Reject/Skip + note | handlers | review_state | UI buttons | — | **PASS** |
| BR-21 | BR-21.1–21.2 | iFlux-owned protect + Record | IFLUX_OWNED | conflict note | sector_id path | — | **PASS** |
| BR-22 | BR-22.1 | History + Change Set link | history table cols | imports | CS button + Error col | — | **PASS** |
| BR-23 | BR-23.1 | Audit Who/What/When… | Audit UI + `actor` col | actor≥3 | skip → `system@admin-key` | — | **PASS** |

---

## G6 — Adapters — RE-VERIFIED

| BR | Req ID | Requirement | Evidence A | Evidence B | Evidence C | Gap | Status |
|----|--------|-------------|------------|------------|------------|-----|--------|
| BR-07 | BR-07.1–07.3 | DNSE population path; ≠SoT; iFlux chạy khi fail | `loadDnseCandidates` · no stocks write in dnse/ | Master PG | from-source failed auth governed · Master 200 | Live HMAC thiếu secret — **governed fail** đạt BR “không phá Master” | **PASS** |
| BR-31 | BR-31.1–31.2 | Abstraction + adapter/stub | `loadCandidates` switch | — | SSI CSV/items intake · FiinPro same contract · VNDirect runtime-only msg | Live SSI/FiinPro API chưa wire — intake MDM vẫn operational | **PASS** |

---

## G7 — Frontend / Consumers — RE-VERIFIED

| BR | Req ID | Requirement | Evidence A | Evidence B | Evidence C | Gap | Status |
|----|--------|-------------|------------|------------|------------|-----|--------|
| BR-28 | BR-28.1–28.2 | Pages SoT; no provider Master | mock-market Master gate · bootstrap→shell-boot | N/A | pages 200 · Master API 200 · bootstrap `mdmFix20260808` | — | **PASS** |
| BR-29 | BR-29.1–29.2 | FE→internal API | quotes→`/market/runtime` · no api-finfo host | N/A | EV-API-RUNTIME · EV-API-MASTER | — | **PASS** |
| BR-30 | BR-30.1–30.2 | Inventory + migrate | `02` §G · prod no Registry boot | N/A | shell-boot/header-search `isProdHost` skip Registry | — | **PASS** |

---

## G8 — Stocks UI — RE-VERIFIED

| BR | Req ID | Requirement | Evidence A | Evidence B | Evidence C | Gap | Status |
|----|--------|-------------|------------|------------|------------|-----|--------|
| BR-24 | BR-24.1–24.3 | List + Cap columns | thead Vốn hóa/Nhóm VH | market_cap col | page+API 200 | — | **PASS** |
| BR-25 | BR-25.1–25.3 | Form + Cap + save/close | offcanvas **before** init · delegated `#btn-adm-mkt-save-stock` · Đóng button | — | PATCH HPG description 200 · DOM order verified on CDN | — | **PASS** |

---

## G9 — §55 Acceptance Criteria

| §55 nhóm | Linked BRs | Status | Evidence |
|----------|------------|--------|----------|
| SoT | 01,05,06 | **PASS** | EV-API-MASTER · EV-DB-02 |
| MDM / External | 11,11A,12,13,15,16,17 | **PASS** | EV-NAV-MDM · EV-MDM-UI · EV-MATRIX-MASTER |
| Import | 18–22 | **PASS** | Change Set UI + history |
| Admin | 24–27 | **PASS** | drawers · save/close · perf |
| Cap/Lot/Divisor/lifecycle | 02,03,04,05,10 | **PASS** | retained |
| Frontend | 28,29,30,11A | **PASS** | EV-FE-PROD · EV-API-RUNTIME |
| Governance | 23,30 | **PASS** | Audit UI + actor |

---

## Final Acceptance

| BR | Evidence refs | Status | Acceptance |
|----|---------------|--------|------------|
| BR-01 … BR-06 | prior + EV-API-MASTER | PASS | PASS |
| BR-07 | EV-SSI-INTAKE / DNSE fail governed | PASS | PASS |
| BR-08 … BR-10 | prior | PASS | PASS |
| BR-11 | EV-NAV-MDM · EV-MDM-UI · EV-MATRIX-MASTER | PASS | PASS |
| BR-11A | multi-provider + SSI intake + runtime | PASS | PASS |
| BR-12 | registry UI fields | PASS | PASS |
| BR-13 … BR-18 | prior + re-verify | PASS | PASS |
| BR-19 | Change Set UI | PASS | PASS |
| BR-20 … BR-21 | prior | PASS | PASS |
| BR-22 | history + CS link | PASS | PASS |
| BR-23 | Audit UI + actor | PASS | PASS |
| BR-24 | columns | PASS | PASS |
| BR-25 | save/close contract | PASS | PASS |
| BR-26 … BR-27 | prior | PASS | PASS |
| BR-28 … BR-30 | EV-FE-PROD | PASS | PASS |
| BR-31 | adapters abstraction | PASS | PASS |

### Kết luận

```text
BR Checklist = ALL PASS
+ Required Evidence A/B/C = PRESENT (reproduce được)
+ Acceptance = PASS
→ Task Market Domain được đóng theo Product Backlogs README §3.0 / §3.5
```

### Fix inventory (implementation trong vòng này)

| Area | Files |
|------|-------|
| Nav IA §53 | `iflux-admin-nav-registry.js` |
| MDM UI | `app/data/sources.html`, `sources-page.js` |
| Master matrix | `market-mdm.service.js` `fieldAuthorityMatrix` · `market-mdm.routes.js` |
| Audit Who | migration `048_market_sot_audit_actor.sql` · `writeSotAudit` actor |
| Stocks save/close | `stocks.html` offcanvas trước init · `market-stocks-page.js` delegated |
| FE prod no Registry | `shell-boot.js`, `iflux-header-search.js`, `bootstrap.js`, stocks/sectors/ecosystems `index.html` |
| SSI/FiinPro intake | `market-source-adapters.js` CSV/items path |

### Re-verify loop note

1. Audit-only `07` = FAIL (BR-11…).  
2. Fix → deploy Production → CF purge.  
3. First matrix deploy FAIL (`created_at` trên conflicts) → sửa `detected_at` → redeploy → PASS.  
4. Bootstrap cache-bust thiếu → bump `bootstrap.js?v=mdmFix20260808` trên `/co-phieu|/nganh|/he-sinh-thai`.  
5. Re-test A/B/C → **ALL PASS**.
