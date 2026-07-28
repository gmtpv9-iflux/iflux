# P4 — Backward Compatibility + Preview Evidence Report

**Phase:** P4 — Backward Compatibility (+ Preview)  
**Date:** 2026-07-27  
**Owner:** Web Runtime  
**Prerequisite:** P3 PASS  
**Scope lock:** Verify legacy compat + preview; sửa tối thiểu `share-feature-boot.js` redirect query→path.

---

## 1. Change summary

| Item | Detail |
|------|--------|
| **Code change** | `User_Web/iflux-web-ui/runtime/share-feature-boot.js` — `/chia-se?ref=` redirect → path qua Share Foundation |
| **Không sửa** | `loyalty-affiliate-store.js`, `affiliate-resolver.js`, `share-action-store.js`, nginx |
| **Cache bust** | `shareAffP4_20260727` (`share/index.html`, `share-feature-boot.js`) |

### Redirect behavior (P4)

```
/chia-se?ref=IFL9552M
  → captureRefFromUrl() (incoming)
  → redirect /IFL9552M/nha-cua-toi   (Foundation buildShareUrl)
```

Fallback mỏng: publicId invalid → giữ `?ref=` (compat edge).

---

## 2. Legacy query capture — evidence

**Owner:** `loyalty-affiliate-store.js` `captureRefFromUrl()` L518–522

```javascript
var ref = parseRefFromLocation() || parseRefFromReturnParam() || parsePublicIdFromPath();
```

| Input URL | Capture source | Expected | Result |
|-----------|----------------|----------|--------|
| `/cong-dong?ref=IFL9552M` | query | cookie `IFL9552M` | **PASS** (code path) |
| `/cong-dong?r=IFL9552M` | query alias | cookie | **PASS** |
| `/IFL9552M/cong-dong` | path (P2 resolver + loyalty) | cookie | **PASS** |
| `/cong-dong` (sạch) | none | no write | **PASS** |

**Attribution rule (O3):** không đổi — first-touch / `referred_by` logic untouched.

---

## 3. SEO / canonical — Pipeline A/B

Article mẫu: `hpg-tri-vong-thep-dau-tu-cong-2026`  
Canonical sạch: `https://iflux.vn/cong-dong/bai-viet/hpg-tri-vong-thep-dau-tu-cong-2026`

| Request URL | HTTP | `link[rel=canonical]` | `og:url` | publicId/ref in meta |
|-------------|------|----------------------|----------|----------------------|
| `/cong-dong/bai-viet/hpg-…` | 200 | sạch | sạch | ❌ |
| `/IFL9552M/cong-dong/bai-viet/hpg-…` | 200 | sạch | sạch | ❌ |
| `…?ref=IFL9552M` | 200 | sạch | sạch | ❌ |

Community list `/IFL9552M/cong-dong`: HTTP 200 · HTML tĩnh **không** chứa `IFL9552M` / `ref=` trong meta tags.

---

## 4. Preview minimum matrix (Plan § P4)

UA crawl simulation — Production `https://iflux.vn` · 2026-07-27

| # | Mẫu | UA | HTTP | Meta / notes | Result |
|---|-----|-----|------|--------------|--------|
| 1 | `/IFL9552M/cong-dong` | `facebookexternalhit/1.1` | 200 | Không og:url/ref tĩnh bẩn | **PASS** |
| 2 | `/IFL9552M/cong-dong/bai-viet/hpg-tri-vong-thep-dau-tu-cong-2026` | `facebookexternalhit/1.1` | 200 | canonical + og:url sạch | **PASS** |
| 3 | `/IFL9552M/cong-dong/bai-viet/hpg-tri-vong-thep-dau-tu-cong-2026` | `ZaloBot/1.0` | 200 | canonical + og:url sạch | **PASS** |
| 4 | `/IFL9552M/cong-dong` | `ZaloBot/1.0` | 200 | Không meta bẩn tĩnh | **PASS** |

**Không có HTTP 301** strip affiliate prefix (nginx internal rewrite only — khớp P2).

---

## 5. Grep outgoing `?ref=` (post-P4)

| Location | Classification | Status |
|----------|----------------|--------|
| `share-action-store.js` | Outgoing decorate | Path only (P3) |
| `share-feature-boot.js` | Redirect compat | **Path primary** · `?ref=` chỉ invalid-id fallback |
| `loyalty-affiliate-store.js` L96 | Boot fallback | **P5** — giữ |

---

## 6. Files changed

| File | Change |
|------|--------|
| `User_Web/iflux-web-ui/runtime/share-feature-boot.js` | Redirect query→path via Foundation |
| `User_Web/share/index.html` | cache bust `shareAffP4_20260727` |

---

## 7. Status

| Gate | Result |
|------|--------|
| Legacy `?ref=` capture | **PASS** |
| Path capture regression (P2) | **PASS** |
| Canonical không chứa publicId | **PASS** |
| OG `og:url` sạch (article) | **PASS** |
| Preview matrix 4/4 | **PASS** |
| Attribution rule unchanged (O3) | **PASS** |
| Scope lock | **PASS** |
| Deploy Production | **PASS** — 2026-07-27 · CDN purge |

**P4: PASS** — Owner sign-off 2026-07-27.

---

## 8. Owner sign-off

| Phase | Result |
|-------|--------|
| P0 | ✅ PASS |
| P1 | ✅ PASS |
| P2 | ✅ PASS |
| P3 | ✅ PASS |
| P4 | ✅ **PASS — Owner review complete** (2026-07-27) |

**Execution track P0–P4: CLOSED.**  
**P5:** BACKLOG — chờ **Query Referral Deprecation Policy** (product policy, không phải verification phase).

---

## 9. Production monitors (Owner — không sửa code)

Chạy song song vài ngày trước khi mở P5.

### A — Incoming analytics

Theo dõi mix:

```
?ref=   (legacy query)
?r=     (legacy alias)
/IFL…/  (path — chuẩn mới)
```

Nếu legacy query **< 1%** → P5 gần như không rủi ro regression.

### B — Affiliate path 404 / health

Theo dõi `/IFLxxxx/…`:

| Signal | Nghi ngờ |
|--------|----------|
| 404 | nginx rewrite hoặc route miss |
| 500 | asset / backend |
| loop | resolver + redirect interaction |

Sạch trong window monitor → mới retire query support (P5 + policy).
