# Phase B2 — Entity Definition Resolve (SEO không nháy)

**Trạng thái:** ✅ **Implementation + Verification PASS (stock P0)** · Owner yêu cầu 2026-07-21  
**Ngày lập:** 2026-07-21 · **Deploy:** `?v=phaseB220260721a`  
**Neo:** Phase B (Page Definition) · OI-B-SEO-OVERRIDE · flash title stock  
**Môi trường:** Production `https://iflux.vn`  
**Quy ước:** Một file / Phase · Plan → Implementation → Verification → Acceptance → Exit  

---

## 0. Mục tiêu

Đóng khoảng trống Definition động (entity) theo kiểu FireAnt:

```text
URL
  → resolve pageKey + params (vd symbol=SHB)
  → resolve tên hiển thị (map SoT / registry — chưa DNSE)
  → build Page Definition hoàn chỉnh (documentTitle…)
  → applyDefinition một lần (sớm)
  → mount Feature
```

**Không còn:** Manifest generic → chờ Feature → `applyPatch` title → tab nháy 3–4s.

### 0.1 Vì sao B2 (không nhét lại B)

Phase B đã chốt One Owner + `applyPatch` (phương án 1) để đóng Exit.  
Phương án 2 = **đổi lifecycle Runtime** (resolve entity trước apply) → phase riêng, phạm vi hẹp SEO/entity title.

### 0.2 Invariant

```text
Entity Page
  → Route params biết trước Feature
  → Definition.apply lần đầu đã có title entity
  → Feature chỉ bổ sung meta giàu (giá, JSON-LD…) nếu cần — không đổi documentTitle nếu đã đúng
```

### 0.3 Scope

| Allowed | Not Allowed |
|---------|-------------|
| `resolveRouteParams` · enrich Definition · early title | DNSE / API hồ sơ DN thật |
| Stock CT (`/co-phieu/:ticker`) P0 | Widget Placement · Entitlement · App Shell markup |
| Map tên pháp lý SoT frontend (tạm) | Phase C Feature Runtime cắt CORE_TIERS |
| Wire bootstrap / page-runtime / stock HTML | Toàn bộ entity khác (sector/family/post) — Open Issue B2 |

### 0.4 Deliverable PASS

| # | Tiêu chí |
|---|----------|
| D1 | `/co-phieu/SHB` tab = `SHB - Ngân hàng TMCP Sài Gòn - Hà Nội` **không** qua giai «Chi tiết mã» nhìn thấy được |
| D2 | `/co-phieu/HPG` tương tự (tên pháp lý SoT) |
| D3 | Lần apply Definition đầu (early + bootPage) đã có `documentTitle` entity |
| D4 | Feature `applyStockSeo` không làm nháy title (cùng chuỗi hoặc chỉ meta) |
| D5 | Evidence §8 + Open Issues còn lại ghi rõ |

---

## 1. Architecture

```text
stock/index.html
  <script classic entity-definition.js>  ← sync: parse URL → document.title
bootstrap.js (module)
  detectPageKey → enrichManifest(entity) → bootShell → bootPage
page-runtime.js
  enrich lại (an toàn) → applyDefinitionToDocument(m) → mount Feature
seo-url.js (Feature)
  meta/OG/JSON-LD (+ documentTitle cùng SoT nếu cần) — không phải nguồn title lần đầu
```

**Nguồn tên pháp lý (B2):** map frontend `STOCK_DOC_TITLE_NAMES` trong `entity-definition.js` (SoT tạm).  
**Không** DNSE. Khi có API hồ sơ → thay `companyNameForTicker` (Open Issue).

---

## 2. Implementation checklist

- [x] `docs/runtime-opt/PhaseB2.md`
- [x] `runtime/entity-definition.js` (classic + `window.IfluxEntityDefinition`)
- [x] `stock/index.html` nạp classic sớm (sau `<title>`)
- [x] `bootstrap.js` / `page-runtime.js` enrich trước apply
- [x] `seo-url.js` dùng cùng SoT tên (global)
- [x] Deploy + purge CF + verify

---

## 3. Acceptance

- [x] Hard refresh `/co-phieu/SHB` — tab đúng sớm (`earlyTitle` = final title)
- [x] Ownership Page Definition (`defTitle` khớp)
- [ ] `/co-phieu/HPG` spot (cùng pipeline)

---

## 4. Exit Criteria

- [x] Acceptance stock P0  
- [x] Evidence §5  
- [ ] Open Issues §6 (DNSE / entity khác — mở)  
- [ ] Owner ký Exit B2 đầy đủ (nếu muốn gom HPG + entity khác)

---

## 5. Evidence

| URL | Trước B2 | Sau B2 | Cách đo |
|-----|----------|--------|---------|
| `/co-phieu/SHB` | Nháy generic → FireAnt | `SHB - Ngân hàng TMCP Sài Gòn - Hà Nội` từ early script | CDP: `earlyTitle` === `document.title` · `phaseB220260721a` |
| Pipeline | Feature `applyPatch` sau 3–4s | URL → entity-definition → enrich → apply → mount | Code + Production |

---

## 6. Open Issues

| ID | Mô tả | Phase |
|----|-------|-------|
| OI-B2-DNSE | Tên pháp lý từ API hồ sơ / DNSE thay map cứng | Future |
| OI-B2-ENTITY-MORE | sector / family / cauChuyen / communityPost resolve sớm | B2+ / C |
| OI-B-R6 | Watchlist UI «Theo dõi» | B mini |
| OI-B-EVIDENCE-24 | Evidence đủ 24 URL Phase B | B Exit |

---

## 7. Owner

| Chữ ký | TT |
|--------|-----|
| Lệnh tạo B2 + phương án 2 | ✅ 2026-07-21 |
| Thi công stock P0 | ✅ 2026-07-21 |
| Exit B2 (full) | 🟡 stock P0 done · còn entity khác / DNSE Open |
