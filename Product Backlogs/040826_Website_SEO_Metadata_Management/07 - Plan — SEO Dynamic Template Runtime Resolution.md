CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# Plan — SEO Dynamic Template Runtime Resolution & Page Title Ownership

**Epic:** `040826_Website_SEO_Metadata_Management`  
**Status:** IMPLEMENTED (Owner chốt S1–S5 2026-08-10) · Production deployed  
**Date:** 2026-08-10  
**Input:** Owner task (SEO Dynamic Template Runtime) + Production audit (API/DB/runtime)  
**Phase 0 lock:** S1 title_template YES · S2 server-resolve YES · S3 com-author YES · S4 scope 5 detail YES · S5 Admin VI SoT YES

---

## 0. Verdict (1 câu)

Admin đã lưu đúng template (`iFlux | {Mã} | …`), nhưng **không có bước resolve entity → placeholder**; public API/`live()` **xóa** template; page JS **hardcode** `document.title` sau bootstrap → SEO từng trang **không bao giờ thắng**.

---

## 1. Audit Report (bắt buộc trước sửa)

### 1.A SEO configuration

| Item | Evidence | Kết luận |
|------|----------|----------|
| Lưu `seoTitle` | DB `page_seo_configs.payload.seoTitle` · Admin `PUT /api/admin/seo/pages/:pageKey` | SoT Admin đúng |
| Global | Brand / `GET·PATCH /api/admin/seo/global` → `defaultSeoTitle` | Không chứa placeholder entity |
| Public API | `GET /api/seo/effective?pageKey=` → `data.effective.title` | Merge PAGE > GLOBAL |
| Strip unresolved | `site-seo-resolver.js` `live()`: `/\{[^}]+\}/` → `''` | **Cố ý** không publish `{…}` |
| Client strip | `bootstrap.js` `enrichManifestWithSiteSeo` cùng regex | Defense-in-depth |
| Alias | `SEO_KEY_ALIAS`: `stock`→`stock-detail`, `sector`→`sector-detail`, `family`→`eco-detail`, `cauChuyenDetail`→`cau-chuyen-detail` | Detail keys **đúng** (trừ author — mục 1.B) |
| Precedence hiện tại (thực tế) | HTML static → early entity → `/seo/effective` (title='') → **feature hardcode** | Hardcode **thắng** |

**Production DB (đã confirm):**

| `page_key` | `seoTitle` |
|------------|------------|
| `stock-detail` | `iFlux \| {Mã} \| {Tên cổ phiếu}` |
| `sector-detail` | `iFlux \| {Tên ngành}` |
| `eco-detail` | `iFlux \| {Tên hệ sinh thái}` |
| `cau-chuyen-detail` | `iFlux \| {Tên câu chuyện}` |
| `com-author` | `iFlux \| {Tên tác giả}` |

### 1.B Dynamic title ownership (`document.title` / OG)

**Pipeline thực tế:**

```text
HTML <title>
  → entity-definition.applyEarlyDocumentTitle (stock)
  → bootstrap enrichManifestWithSiteSeo (/seo/effective → title thường rỗng với detail)
  → applyDefinitionToDocument
  → feature mount: applyPatch / document.title / seo-url  ← OVERWRITE
```

| Source | Pattern | Pages | Overwrite SEO sau bootstrap? |
|--------|---------|-------|------------------------------|
| `pages/*.manifest.js` `documentTitle` | `Chi tiết mã · iFlux`, `Ngành · iFlux`, … | Detail shells | Fallback sớm |
| `entity-definition.js` | `{TICKER} - {Company map\|ticker}` | Stock | Có (sớm + enrich) |
| `seo-url.js` `applyStockSeoToDocument` | `{TICKER} - {company}` + og | Stock | **Có** |
| `stock-page.js` | gọi seo-url / patch | Stock | **Có** |
| `group-page.js` | `{name} · {typeLabel} · iFlux` | Sector / Eco / Story | **Có** |
| `community-ui.js` / post | metadata title | Community post | Có (ngoài scope placeholder VI này nhưng cùng ownership) |
| `comments-page.js` | `document.title` trực tiếp | Bình luận | Có (tab only) |
| `entity-list-page.js` / list pages | `Danh sách … · iFlux` | Lists | Title-only |
| `profile-view.js` | `{display_name} · iFlux` | Profile | Title-only |

**Author gap:** `com-author` có trong `page_seo_configs`, nhưng runtime `/cong-dong/tac-gia/...` detect → `community` — **không alias** sang `com-author` → SEO từng trang author **không được fetch**.

### 1.C Placeholder engine

| Engine | Path | Tokens | Dùng cho Admin `seoTitle`? |
|--------|------|--------|----------------------------|
| `live()` strip | `site-seo-resolver.js` | — | Chỉ **xóa**, không resolve |
| P3 `applyTemplate` | `seo-platform/entity-templates.js` | English `{name}` `{ticker}` `{title}` | **Có thể reuse hàm**; TITLE_TEMPLATES P3 **không** phải SoT Admin |
| Notification renderer | `notifications/renderer.js` | VI tokens (domain khác) | Pattern cousin — **không** ownership SEO |
| Client | Không | — | **Chưa có** resolver |

**Placeholder Admin seed (SoT lưu trữ):** `{Mã}`, `{Tên cổ phiếu}`, `{Tên ngành}`, `{Tên hệ sinh thái}`, `{Tên tác giả}`, `{Tên câu chuyện}` (+ `{Tên danh mục}` trên `com-cat`).

**P3 TITLE_TEMPLATES** (`{name} ({ticker}) | iFlux` …) = template **nội bộ Platform**, **không** đọc `page_seo_configs` — **cấm** dùng thay Admin SoT.

---

## 2. Root cause (chuỗi)

```text
① Admin lưu template VI đúng
② Không có bước: template + entity → resolved title
③ live() + bootstrap blank title khi còn {…}
④ Feature hardcode set document.title sau bootstrap
→ User thấy hardcode; Admin SEO “không có tác dụng”
```

→ **Cả Case 1 (hardcode) và Case 2 (template vô hiệu)** đều đúng — nhân quả xếp tầng.

---

## 3. Solution Architecture (đề xuất)

### 3.1 Contract (SoT runtime)

```text
Admin page_seo_configs.seoTitle          ← Source of Truth (template)
        ↓
pageKey (alias đúng)
        ↓
title_template (public, khi còn placeholder)
        ↓
Runtime entity context (ticker/name/…)
        ↓
Shared applyTemplate + VI token map     ← reuse P3 applyTemplate, không SoT mới
        ↓
Resolved title (không còn {…})
        ↓
IfluxSeoTitle.apply → document.title + og:title + twitter:title
```

**Precedence (khóa):**

```text
Resolved SEO template (Admin)
  > dynamic runtime fallback (entity-derived, không hardcode brand pattern cũ)
  > generic page / manifest fallback
```

Nếu resolve thành công → **cấm** feature hardcode overwrite.

### 3.2 Reuse — không tạo resolver “thứ hai”

| Làm | Không làm |
|-----|-----------|
| Reuse `entity-templates.applyTemplate` (backend) | Không invent TITLE_TEMPLATES song song thay Admin |
| Thêm **VI token alias map** một chỗ (SoT tokens Admin) | Không resolver riêng stock/sector/eco |
| Client: thin `applyTemplate` + **cùng map** (contract test chung) | Không hardcode “Họ Vingroup” / “HPG” |
| Một writer: `IfluxSeoTitle.apply` | Không để group-page/seo-url tự `document.title` sau SEO |

**Token map (đề xuất — Owner SoT = seed Admin):**

| Placeholder Admin | Runtime var |
|-------------------|-------------|
| `{Mã}` | `ticker` |
| `{Tên cổ phiếu}` | `stockName` |
| `{Tên ngành}` | `sectorName` |
| `{Tên hệ sinh thái}` | `ecoName` |
| `{Tên tác giả}` | `authorName` |
| `{Tên câu chuyện}` | `storyName` |
| `{Tên danh mục}` | `categoryName` (cùng engine; verify nếu trong scope) |

English P3 keys (`{name}`, `{ticker}`) có thể **alias phụ** vào cùng map để Platform article/stock tests không gãy — **Admin VI tokens thắng** khi cả hai xuất hiện trong cùng template.

### 3.3 Public API — bắt buộc đổi shape (không phá strip)

Hiện: `title: live(seoTitle)` → `''` khi có `{…}` → client **mất template**.

**Đề xuất (minimal):**

```json
{
  "title": "<resolved hoặc '' — tuyệt đối không chứa { }>",
  "title_template": "<raw seoTitle nếu còn placeholder, else null>",
  "description": "...",
  "description_template": "..."
}
```

- `live()` **giữ** cho `title` / `description` (không publish unresolved).
- Thêm `*_template` từ raw field **trước** `live()` — client/bot mới resolve được.
- Canonical / robots / affiliate: **không đụng** (PD hiện hữu).

**Optional Phase B (bot/curl first HTML):**  
`GET /seo/effective?pageKey=stock-detail&ticker=HPG` (hoặc `entityType`+`entityId`) → server resolve → `title` đã fill. SPA vẫn resolve client khi entity hydrate.  
→ Owner chốt có làm Phase B trong cùng wave hay chỉ SPA runtime trước.

### 3.4 Client ownership — `IfluxSeoTitle`

Module mới **mỏng** (hoặc mở rộng `seo-url.js` nếu ownership SEO URL đã là chỗ đúng — Impact: prefer **modify** `seo-url.js` / tạo `seo-title.js` cạnh đó nếu file đang quá rộng):

```text
IfluxSeoTitle.apply({
  pageKey,           // catalog key
  template,          // từ siteSeo.title_template | fetch
  vars,              // entity
  fallbackTitle      // Case B/C/D
})
→ resolve hoặc fallback
→ IfluxPageDefinition.applyPatch({ documentTitle, seo: { 'og:title', 'twitter:title' } })
```

**Lifecycle:**

```text
bootstrap: lưu title_template; nếu title đã resolved (static page) → apply ngay
entity ready (stock-page / group-page / author / story):
  → IfluxSeoTitle.apply(...)  // writer duy nhất cho SEO-managed detail
feature hardcode cũ:
  → đổi thành gọi apply với fallbackTitle = pattern cũ (hoặc pattern gọn)
  → nếu template resolve OK → fallback không chạy
```

**Case C (entity chưa sẵn):** giữ fallback manifest / early title; **không** ghi `{Tên…}` ra DOM; khi entity tới → apply lại.

**Case D (entity 404):** fallback type label (`Ngành · iFlux` …); không `undefined` / `{…}`.

### 3.5 Hardcode — ownership xử lý (không xóa mù)

| File | Quyết định |
|------|------------|
| `group-page.js` | **Modify:** sau có entity → `IfluxSeoTitle.apply`; bỏ `applyPatch({ documentTitle: name + ' · ' + …})` khi SEO resolve |
| `entity-definition.js` / early title | **Modify:** early chỉ fallback tạm; không phải SoT |
| `seo-url.js` `applyStockSeo*` | **Modify:** title/og qua `IfluxSeoTitle`; giữ canonical/OG image/URL rules |
| `stock-page.js` | **Modify:** gọi SEO title owner |
| Manifests `documentTitle` | **Giữ** làm Case B/C fallback shell — không SoT |
| `comments-page.js` | **Ngoài scope title SEO từng trang detail** trong wave này (ghi backlog) trừ khi Owner mở rộng |

### 3.6 Author / Story pageKey

| Page | Fix |
|------|-----|
| Story detail | Đã alias `cauChuyenDetail` → `cau-chuyen-detail` + group-page | Wire apply |
| Author detail | **Thêm** `detectPageKey` + `SEO_KEY_ALIAS` → `com-author` cho `/cong-dong/tac-gia/:id` (và path SoT tương đương) | Bắt buộc để template Admin có hiệu lực |

---

## 4. Plan thi công (phases)

### Phase 0 — Owner confirm (blocker)

Chốt trước khi code:

1. **SoT template** = Admin `page_seo_configs.seoTitle` (VI tokens) — **không** thay bằng P3 `TITLE_TEMPLATES`.  
2. **API:** thêm `title_template` / `description_template` như §3.3 — OK?  
3. **Phase B server resolve** cho curl/bot trong cùng wave hay **sau**?  
4. **Author route** alias `com-author` — OK mở detectPageKey?  
5. **Scope wave:** Stock / Sector / Eco / Author / Story = **in**; comments / profile / lists = **out** (fallback giữ nguyên) trừ khi Owner kéo vào.

### Phase 1 — Shared resolve + API (Foundation / Platform)

1. Token map VI (+ alias EN) cạnh `applyTemplate` (export từ `entity-templates.js` hoặc `site-seo` helper consume `applyTemplate`).  
2. `toPublic` / `getPublicEffective`: emit `title_template`, `description_template`.  
3. Unit tests: resolve HPG / Họ Vingroup / ngành / author / story; reject unresolved publish trên `title`.  
4. **Không** đổi canonical / affiliate.

### Phase 2 — Client SEO title owner

1. `IfluxSeoTitle` (modify/extend SEO runtime hiện có).  
2. Bootstrap: đọc `title_template`; không blank-and-forget.  
3. Wire: `stock-page` + `seo-url`, `group-page` (sector/family/cau-chuyen), author detail path.  
4. Regression: static pages (`dashboard`, `market`…) title vẫn từ `effective.title` resolved (không template).

### Phase 3 — Remove overwrite conflicts

1. Inventory callers `document.title` / `applyPatch(documentTitle)` trên 5 detail types → chuyển qua owner.  
2. Early stock title = fallback only.  
3. Search regression `document.title` ownership table (deliverable E).

### Phase 4 — Verify Production (DoD)

| Page | Template | Entity mẫu | Expect `document.title` |
|------|----------|------------|-------------------------|
| `/co-phieu/HPG` | `iFlux \| {Mã} \| {Tên cổ phiếu}` | HPG + tên thật từ data | `iFlux \| HPG \| <tên>` |
| `/nganh/<slug>` | `iFlux \| {Tên ngành}` | ngành thật | `iFlux \| <tên ngành>` |
| `/he-sinh-thai/<slug>` | `iFlux \| {Tên hệ sinh thái}` | Họ Vingroup | `iFlux \| Họ Vingroup` |
| Author detail | `iFlux \| {Tên tác giả}` | author thật | `iFlux \| <tên>` |
| Story detail | `iFlux \| {Tên câu chuyện}` | story thật | `iFlux \| <tên>` |

Evidence mỗi page: Configured template → entity → resolved → `document.title` → (optional) og:title.  
API: `title` không chứa `{`; `title_template` có khi cần.  
Canonical / `?ref=` không đổi.

### Phase 5 — Deliverables

A Audit (mục 1) · B Summary Before→After · C Placeholder Matrix · D Verification Evidence · E Regression ownership table.

---

## 5. Impact Analysis (CG-005)

| Feature | Current owner | Decision |
|---------|---------------|----------|
| Page SEO title template | Admin `page_seo_configs` | **Reuse** (SoT) |
| `applyTemplate` | `entity-templates.js` | **Reuse** + extend token map |
| Public effective | `site-seo-resolver.toPublic` | **Modify** (+ `*_template`) |
| Bootstrap SEO | `bootstrap.js` | **Modify** (consume template) |
| Stock title | `seo-url` / `entity-definition` / `stock-page` | **Modify** → SEO title owner |
| Sector/Eco/Story title | `group-page.js` | **Modify** → SEO title owner |
| Author SEO key | missing alias | **Modify** detectPageKey + alias |
| P3 TITLE_TEMPLATES | Platform internal | **Giữ** cho article/contract — **không** thay Admin |
| Canonical / affiliate | SEO Platform / Share | **Không đụng** |

**File mới?** Chỉ nếu không thể mở rộng `seo-url.js` sạch — khi đó:

```text
Existing owner: User_Web/.../seo-url.js + bootstrap.js
Why cannot modify alone: title ownership cần API rõ, tách khỏi URL/canonical helpers nếu file quá tải
New responsibility: resolve Admin template + apply title/og only
Removal: hardcode title branches trong group-page/stock paths
```

Ưu tiên **Modify existing** trước Create.

---

## 6. Risks / Non-goals

| Risk | Mitigation |
|------|------------|
| Flash title fallback → SEO | Accept short fallback; không publish `{…}` |
| Author URL không khớp alias | Phase 0 chốt path SoT |
| Curl first HTML vẫn manifest | Phase B server resolve hoặc bot shell (Owner) |
| P3 templates lệch Admin | Admin thắng; P3 chỉ reuse `applyTemplate` |

**Non-goals wave này:** comments title, profile title, list pages, đổi copy Admin UI, Cloudflare robots, favicon.

---

## 7. Definition of Done (map Owner §12)

1. Admin `seoTitle` có hiệu lực trên dynamic detail.  
2. 6 placeholder resolve từ entity thật.  
3. Không hardcode overwrite sau resolve.  
4. Không unresolved `{…}` public.  
5. Fallback A–D rõ.  
6. Stock / Sector / Eco / Author / Story verify.  
7. Canonical + affiliate không regression.  
8. Ownership table `document.title` / `<title>`.  
9. Evidence API + browser (+ curl nếu Phase B).  
10. Không PASS một URL.

---

## 8. Đề nghị Owner chốt

Trả lời **Phase 0** (5 câu §4) để mở implementation:

- **S1** API `title_template` — YES/NO  
- **S2** Phase B server-resolve trong cùng wave — YES/NO/LATER  
- **S3** Alias `com-author` — YES/NO  
- **S4** Scope 5 detail types only — YES/NO (+ lists?)  
- **S5** SoT = Admin VI templates (không P3 TITLE_TEMPLATES) — confirm YES  

Sau khi chốt → Implement Phase 1→4 → Deliverables A–E.
