CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# Audit — Production Sitemap Eligibility (narrow)

| | |
|--|--|
| **Task** | `040826_Website_SEO_Metadata_Management` |
| **Scope** | Production sitemap **eligibility only** — không sửa code |
| **Date** | 2026-08-09 |
| **Environment** | Production origin `iflux-api` + public `https://iflux.vn/sitemap.xml` |
| **Code SoT** | `backend/src/modules/seo-platform/seo-platform.service.js` → `buildSitemapXml()` |
| **Status** | ✅ AUDIT COMPLETE · Option A **implemented** (see §9) |

> Mục tiêu: trả lời sitemap đang lấy record nào, điều kiện nào, có loại trừ draft/private/deleted/noindex/decorated không, tổng URL hiện tại, và scale tới ~20.000 bài.

---

## 1. Executive verdict

| Câu hỏi | Kết luận |
|---------|----------|
| Nhiều bài trong sitemap có sai không? | **Không tự thân.** ~3.176 URL bài = đúng bằng số `published` / `published_rss` có slug. |
| Eligibility đã “đủ SEO Contract”? | **Chưa.** Article path **không** qua SEO Contract / Index Universe / robots / noindex. Chỉ filter **status + slug**. |
| Draft / pending / scheduled? | **Hiện table Production không có** các status đó (chỉ `published` + `published_rss`). Code **có** loại chúng nếu xuất hiện. |
| Private / deleted / noindex? | **Không có logic loại trừ** trong sitemap. Payload cũng **không** có `visibility` / `robots` / `noindex` fields đang dùng. |
| Decorated / Affiliate URL? | **OK.** Sitemap chỉ emit Clean `/cong-dong/bai-viet/{slug}` — 0 URL `/IFL…` hay `?ref=` / `?r=`. |
| Scale 20.000 bài? | **Hard `LIMIT 5000` sẽ cắt** — khi eligible > 5000, bài cũ hơn theo `updated_at` **biến mất khỏi sitemap**. Đây là gap scale chính **trước** khi chạm 20k. Google cho phép tới 50.000 URL / file; `LIMIT 5000` mới là bottleneck. |

---

## 2. Code path (evidence)

```text
buildSitemapXml()
  ├── SITEMAP_STATIC (hubs) — mỗi URL qua resolveContract()
  │     └── require: indexability.sitemapEligible && indexability.indexUniverse
  └── community_posts articles — SQL trực tiếp, KHÔNG qua Contract
        SELECT payload->>'slug', updated_at
        FROM community_posts
        WHERE status IN ('published', 'published_rss')
          AND COALESCE(payload->>'slug', '') <> ''
        ORDER BY updated_at DESC NULLS LAST
        LIMIT 5000
        → loc = https://iflux.vn/cong-dong/bai-viet/{encodeURIComponent(slug)}
```

**Không kiểm tra:** `content_type`, `payload.seo.robots`, noindex, visibility, soft-delete, Contract HTTP class, Index Universe entity rules.

---

## 3. Production counts (2026-08-09)

### 3.1 Sitemap XML (origin)

| Metric | Value |
|--------|------:|
| Bytes | 843 073 |
| **Total `<loc>`** | **3 185** |
| Static hubs | **9** |
| Article URLs | **3 176** |
| Decorated / `?ref=` / `?r=` trong sitemap | **0** |

Static hubs present:

```text
/thi-truong · /cong-dong · /dong-tien · /co-phieu · /nganh
/he-sinh-thai · /chu-de · /hoi-dap · /thanh-vien
```

(Note: `/nha-cua-toi` = utility noindex → Contract loại khỏi static list — đúng.)

### 3.2 Public CDN

| Metric | Value |
|--------|------:|
| Origin `sitemap.xml` | **3 185** URL · ~843 KB |
| Public `https://iflux.vn/sitemap.xml` | Trước đó HEAD `200` · `content-length≈842796` (khớp origin). Agent curl body lúc audit có thể bị CF 403 — **counts lấy từ origin + DB**. |

### 3.3 `community_posts` status (toàn bảng Production)

| status | n |
|--------|--:|
| `published_rss` | 3 115 |
| `published` | 61 |
| **Tổng** | **3 176** |

Không có row `draft` / `pending` / `scheduled` / `deleted` trên Production lúc audit.

### 3.4 Eligibility SQL vs sitemap

| Metric | Value |
|--------|------:|
| `published`+`published_rss` có slug | **3 176** |
| `published*` slug rỗng | **0** |
| Duplicate slug trong eligible | **0** |
| `LIMIT 5000` có truncate hiện tại? | **Không** (3176 &lt; 5000) |
| Khớp article URLs trong sitemap | **3176 = 3176** ✅ |

### 3.5 `content_type` (trong published*)

| content_type | n |
|--------------|--:|
| `article` | 3 174 |
| `news` | 2 |

Sitemap **không** filter `content_type` — cả `news` cũng vào nếu status live + có slug.

---

## 4. Exclusion matrix

| Loại | Có loại trừ trong sitemap code? | Evidence Production |
|------|----------------------------------|---------------------|
| `draft` / `pending` / `scheduled` | **Có** (status not in IN list) | 0 row các status này |
| Soft-deleted row | **Không** (không có cột deleted; không status deleted) | Schema: id, user_id, content_type, status, payload, timestamps, media_* |
| Private / hidden visibility | **Không** | `has_visibility = 0` trên published* |
| Explicit noindex / robots | **Không** | `seo.robots` / top-level `robots` / `noindex` = **0** presence |
| Decorated Affiliate URL | **Có** (chỉ emit Clean path) | 0 decorated loc |
| Query referral `?ref=` / `?r=` | **Có** (không append query) | 0 |
| SEO Contract / Index Universe | **Không** (articles bypass Contract) | Code path |
| Utility / account pages as articles | N/A | — |

Payload `seo` keys hiện có (không có robots):  
`title`, `description`, `keywords`, `canonical`, `meta_title`, `meta_description`, `og_title`, `og_description`, `og_image`.

---

## 5. Scale to ~20.000 bài

| Constraint | Threshold | Effect |
|------------|-----------|--------|
| Code `LIMIT 5000` | > 5 000 eligible | Chỉ **5 000** bài `updated_at` mới nhất vào sitemap; phần còn lại **im lặng bị loại** |
| Google urlset soft cap | 50 000 URL / file | 20 000 bài + hubs **vẫn vừa một file** nếu bỏ/ nâng LIMIT |
| Current load | 3 176 | Chưa hit LIMIT |
| At 20 000 with current code | include 5 000 / exclude **15 000** | **FAIL scale intent** |

**Kết luận scale:** “Nhiều URL” không sai. Sai tiềm ẩn là **hard cap 5000 + thiếu eligibility SEO (noindex/private)** khi platform trưởng thành — không phải việc sitemap chứa nhiều bài published.

---

## 6. Gaps (audit only — không implement ở bước này)

1. **`LIMIT 5000`** — sẽ cắt sitemap trước mục tiêu 20k.  
2. **Article không consume SEO Contract eligibility** — không tôn trọng future noindex / Index Universe rules.  
3. **Không đọc `payload.seo.robots` / visibility** — hiện data chưa có; khi có override noindex sẽ vẫn vào sitemap.  
4. **Không filter `content_type`** — `news` đang vào cùng article.  
5. **Chưa sitemap index / sharding** — chưa cần ở 20k nếu bỏ LIMIT; cần khi vượt ~50k.  
6. **Static hubs qua Contract; articles không** — hai pipeline eligibility không đồng nhất.

---

## 7. Recommendation (cho Owner — chưa code)

Giữ nguyên Wave; **không mở P3** cho đến khi Owner chốt:

| Option | Ý |
|--------|---|
| **A** | Sửa scale/eligibility sitemap (bỏ LIMIT · Contract-aware · chunk/index) trước P3 — **CHỌN / DONE** |
| **B** | Chấp nhận tạm LIMIT 5000 — rejected by Owner |
| **C** | Chỉ document + monitor — rejected by Owner |

Audit này **không** khuyến nghị “giảm số bài trong sitemap” chỉ vì nhiều URL.

---

## 8. Evidence commands (reproducible)

```bash
curl -s http://127.0.0.1:3001/sitemap.xml | … count <loc>
# header: X-IFlux-Sitemap-Urls
```

---

## 9. Option A implementation (2026-08-09)

| | |
|--|--|
| Gate | `isContractSitemapEligible(contract)` — reuse Contract Wave A · **không** engine mới |
| Inventory | `community_posts` published* + slug · **batch 500** · **no LIMIT 5000** |
| Prod after | **3 185** URL (= before) · 9 hubs · 0 decorated |
| Fixture | 5 500 candidates → **5 445** included (>5000) · 55 noindex excluded · index mode when soft-cap |

**P5 Option A = PASS.** P3 chưa mở.

**End of audit + Option A closeout**
