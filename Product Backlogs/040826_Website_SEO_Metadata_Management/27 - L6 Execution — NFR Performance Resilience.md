# 27 — L6 Execution: NFR / Performance / Resilience

**Layer:** L6 (theo `20 - Master Verification Specification.md` §40). Chỉ test sau khi functional correctness (L0-L5) đã PASS.
**Gate trước:** L5 = ✅ PASS (`26`).
**Ghi chú phạm vi:** Epic này không có NFR threshold chính thức trong BRD (`01`) — theo đúng L6 Exit Gate spec: "Không dùng 'nhanh hơn trước' làm acceptance criterion nếu chưa có threshold". Do đó L6 ở đây là **đo lường + phát hiện bất thường** (regression/resilience), không phải so KPI với target số cụ thể.

---

## L6-TC-01 — Initial load

`curl -w` trên Production (raw first HTML, không đo full JS render — đúng phạm vi "network/server" của layer này):

| URL | TTFB | Total | Size (shell HTML) | HTTP |
|---|---|---|---|---|
| `/thi-truong` | 0.196s | 0.196s | 2830 bytes | 200 |
| `/cong-dong` | 0.169s | 0.169s | 2832 bytes | 200 |
| `/co-phieu/HPG` | 0.197s | 0.197s | 2922 bytes | 200 |

TTFB < 200ms cho SSR shell — không có bất thường. Không đánh giá full-page JS/asset weight (ngoài phạm vi thay đổi của epic SEO Metadata Management; kiến trúc App Shell/asset loading là phạm vi Foundation task khác).

**Verdict: PASS (observational, không có threshold chính thức để so).**

---

## L6-TC-02 — Navigation cost

Đã verify trực tiếp ở L4-TC-03/04 (`25`, Chrome thật):

```text
Soft-nav /thi-truong → /cong-dong:
  bootstrap.js reload      = 0 lần   ✅ (không load lại shell)
  /api/seo/effective       = 1 lần / trang (không duplicate)  ✅
  Duplicate API khác       = market/runtime/quotes (2 lần) — ngoài scope SEO, đã ghi nhận ở L4
```

**Verdict: PASS cho phần SEO/Shell.**

---

## L6-TC-03 — AppShell efficiency

Đã audit toàn diện ở phần đầu epic (Header Logo Ownership — P0/P1/P2, xem lịch sử task): migrate 8 HTML legacy về canonical `<img data-ifx-seo-logo>`, logo rebind mọi lần nav (hard + soft) từ đúng 1 nguồn (Global `/seo/effective`), không còn `syncBrandHref()` song song. Không phát hiện regression mới ở L4/L5 (header/shell chỉ có 1 lần load, 1 lần bootstrap, không có implementation song song).

**Verdict: PASS (kế thừa evidence từ P0-P2 đầu epic + xác nhận lại không regression ở L4).**

---

## L6-TC-04 — SEO runtime cost

Verify metadata resolution không tạo cost dư:

```text
/api/seo/effective  → 1 request/trang, không blocking render (fetch async trong enrichManifestWithSiteSeo)
Không phát hiện duplicate API SEO
Không phát hiện client-side work thừa (canonical/og:url fix mới chỉ thêm 1 string concat + 1 DOM write — không thêm network call)
```

**Verdict: PASS.**

---

## L6-TC-05 — Failure resilience

| Test | Kết quả |
|---|---|
| `pageKey` không tồn tại | API trả `200` + fallback GLOBAL default (site_name/title/description Global), không 500, `canonical_path: null` → client fallback `IfluxNormalizePath` |
| `pageKey` trống | Tương tự — fallback GLOBAL, không lỗi |
| API lỗi/timeout (code-level) | `enrichManifestWithSiteSeo()` bọc `try/catch` toàn bộ fetch — lỗi network/timeout/non-200 đều fallback im lặng, giữ `manifest` hardcode cũ (không crash, không trắng trang) |
| Partial response (JSON thiếu field) | Toàn bộ field đọc qua `String(eff.xxx || '').trim()` — không throw nếu field null/undefined |

**Verdict: PASS** (fallback graceful, không phát hiện điểm crash).

---

## L6-TC-06 — Consistency & Determinism (BR-48.CONSIST/DETERM)

**Determinism:** Gọi `/thi-truong` 3 lần liên tiếp (bot UA) — `<title>` và `canonical` **giống nhau tuyệt đối** cả 3 lần.

**Consistency (Clean vs Affiliate/publicId variant → cùng canonical):** Đã verify đầy đủ ở L5-TC-10 (URL Variant Matrix) — Clean/PublicId/`?ref=`/`?r=` của cùng 1 bài viết đều resolve về **cùng 1 canonical**, không tạo SEO identity thứ hai.

**Verdict: PASS.**

---

## L6-TC-07 — Observability (BR-48.OBS)

Xác nhận qua source (`seo-platform/seo-contract.js:325-334`) — Contract có `trace` object đầy đủ:

```text
trace.source           = 'seo-platform.contract'
trace.foundation        = '090826.effective'
trace.mode              = 'entity_override' | 'automatic'
trace.templateVersion   = entityTemplates.TEMPLATE_VERSION
entity.fields / ownership.rejectedOverrides  → observability tầng entity/override
```

Truy được chuỗi: `URL → pageKey/entityType (contract.identity) → Template (trace.templateVersion) → Rule (trace.mode) → Resolved Metadata (contract fields) → Renderer (head-renderer.js)`.

Với Affiliate/Public Identity variant: `classification.variant` (CLEAN/DECORATED) + `isContractSitemapEligible()` cho biết chính xác lý do loại 1 URL khỏi sitemap (dựa trên `indexability`, `http.httpClass`, `classification.variant`, `robots`) — khớp evidence L5-TC-10 + L2-TC-09 (Source Traceability, đã PARTIAL PASS non-blocking từ L2).

**Verdict: PASS** (observability tồn tại và nhất quán với evidence L2/L5 đã có).

---

## L6 Exit Gate

```text
L6-TC-01 Initial load          PASS (observational — không có threshold chính thức)
L6-TC-02 Navigation cost       PASS
L6-TC-03 AppShell efficiency   PASS
L6-TC-04 SEO runtime cost      PASS
L6-TC-05 Failure resilience    PASS
L6-TC-06 Consistency/Determ.   PASS
L6-TC-07 Observability         PASS
```

**L6 Exit Gate: ✅ PASS.** Không phát hiện regression performance/resilience do các thay đổi trong epic (bao gồm 2 fix ở L5). **L7 UNLOCKED.**
