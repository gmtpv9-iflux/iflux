# Plan — Single Author Attribution SoT (DB → Admin → User Web)

**Date:** 2026-08-10  
**Status:** WAVE C DONE · Single Author Attribution SoT hoàn tất A→B→C · chờ Owner GATE C confirm  
**Input LOCK:** [`07 - Owner-LOCK-Single-Author-Attribution-DB-Audit.md`](07%20-%20Owner-LOCK-Single-Author-Attribution-DB-Audit.md)  
**Epic liên quan:** `090826` (BR-AD-03 attribution) · `010826` (Admin Nguồn / publish)  
**Thứ tự thi công (Owner bắt buộc):**

```text
WAVE A — Database (+ ingest write)
        ↓
   Owner test DB → PASS
        ↓
WAVE B — Admin UI/API consumer
        ↓
   Owner test Admin → PASS
        ↓
WAVE C — User Web (+ SEO authors)
```

**Cấm:** làm User Web trước khi Admin PASS.  
**Cấm:** chỉ sửa UI mà DB vẫn VCCorp / `rss:cafef` / byline người VietStock.

---

## 0. Mục tiêu

Một SoT attribution trên toàn hệ thống:

| Trạng thái | `author.id` | `author.display_name` |
|------------|-------------|------------------------|
| `published_rss` | `cafef` \| `baodautu` \| `vietstock` | CafeF \| Báo Đầu Tư \| VietStock |
| `published` | Admin/Sub account id | Admin/Sub `name` (vd. Bảo Long) |

- Xóa **VCCorp.vn** khỏi attribution hiển thị.  
- Admin list “Nguồn”, User Web byline, `/community/authors`, SEO `{Tên tác giả}` **chỉ đọc** `payload.author.id` + `payload.author.display_name`.

---

## 1. BR / SoT coverage

| BR / SoT | Yêu cầu | Wave giải quyết |
|----------|---------|-----------------|
| Owner LOCK 2026-08-10 | 1 cặp id + display_name; 3 RSS brand; publish → Admin | A+B+C |
| BR-AD-03.1 / SOT-AD-14 | Không VCCorp fixed/default author | A (purge) + B/C (không đọc lại) |
| BR-AD-03.2 / SOT-AD-02 | Attribution trên Article record (`community_posts`) | A |
| BR-AD-03.3–03.4 / SOT-AD-15 | Không fallback publisher→author | A dừng ghi vendor/publisher-as-author; B/C không bind |
| BR-AD-03.6 | API = DB (không drift) | A contract + B/C consumer |
| BR-AD-03 / SOT-AD-16 | `tier_label` ≠ publisher byline | A: tier_label không dùng làm tên nguồn; B/C bỏ fallback tier_label→Nguồn |
| 010826 Nguồn Admin | RSS vs iFlux theo trạng thái | B: `nguonLabel` = `author.display_name` (SoT mới thắng plan cũ dùng `source_name`) |

**Override có chủ đích (Owner LOCK > SoT cũ hiển thị đa field):**  
SOT-AD-13 “Author ≠ Publisher ≠ Vendor” vẫn đúng **kỹ thuật provenance** (có thể giữ `source_id` / `external_url` nội bộ).  
**Hiển thị sản phẩm** (Nguồn / byline / authors / SEO) = **chỉ** `author.*` — Owner LOCK 2026-08-10.

---

## 2. Kiến trúc SoT (sau tái cấu trúc)

### 2.1 Canonical field (duy nhất cho hiển thị)

```text
community_posts.payload.author = {
  id: string,            // cafef | baodautu | vietstock | <admin_accounts.id UUID>
  display_name: string   // CafeF | Báo Đầu Tư | VietStock | <admin name>
}
```

Optional (không dùng làm byline): `tier` = `rss` | `admin` (machine only).

### 2.2 Provider map (1 nguồn catalog)

Từ `community_rss_providers` (đã có trên Prod):

| id | display_name |
|----|--------------|
| `cafef` | CafeF |
| `vietstock` | VietStock |
| `baodautu` | Báo Đầu Tư |

Ingest **chỉ** được set `author` theo map này — không scrape meta author vào `display_name`.

### 2.3 Field bị hạ quyền (không còn SoT hiển thị)

| Field | Sau Wave A |
|-------|------------|
| `vendor` | **Xóa khỏi payload** (hoặc không ghi mới + backfill xóa) |
| `publisher` / `provider` as byline | Không ghi mới; UI không đọc |
| `author.id` dạng `rss:cafef` / `rss-author` | Migrate → `cafef` / provider id |
| `author.display_name` = VCCorp.vn / byline người | Migrate → 3 brand |
| `source_name` / `tier_label` | Có thể giữ kỹ thuật; **cấm** làm Nguồn/byline |

`source_id` / `from_rss` / `external_url`: giữ provenance kỹ thuật (RSS sync, dedupe) — **không** hiển thị thay `author`.

### 2.4 `content_articles.author_name`

Kho Content Engine **song song** (~3244) — **không** phải SoT byline Admin/User Web.  
Owner chốt (§10): Wave A **chỉ** sửa `community_posts`. Không sync `content_articles.author_name` trong epic này.

Trang [`Đồng bộ cấu trúc bài viết`](https://iflux.vn/admin/cong-dong/dong-bo-cau-truc-bai-viet) = **spec map trường RSS → schema iFlux** (`IfluxRssCatalog.ARTICLE_FIELD_MAP`, ví dụ `author_display`) — **không** đọc/ghi bảng bài viết. Không liệt kê cột SQL `content_articles.*`.

---

## 3. WAVE A — Database (+ ingest write)

**Mục tiêu:** DB đúng SoT; Owner test bằng SQL / API raw — **chưa** phụ thuộc UI mới.

### A1. Contract helper (backend)

File mới hoặc modify `community-entity-resolve.service.js`:

```text
resolveRssAuthor(providerId) → { id, display_name }  // chỉ 3 id
resolveAdminAuthor(actor) → { id: actor.id, display_name: actor.name || email }
assertNoVccorp(payload)
```

Cấm: `normalizeAttribution` map VCCorp → author/vendor hiển thị.

### A2. Ingest write path

`rss-ingest.service.js` / `upsertRssArticle`:

- Khi tạo/cập nhật RSS → `status` ready = `published_rss`:
  - `author = resolveRssAuthor(mapping.providerId)`
  - **Không** ghi `vendor` / không lấy CafeF meta author làm display_name
- Giữ `source_id` = providerId (kỹ thuật)

### A3. Admin publish write path (API — chưa UI)

`community-articles.service.js` `updateArticle` / `normalizeArticleInput`:

- Khi `status === 'published'`:
  - **Luôn** `author = resolveAdminAuthor(actor)` (đè RSS/VCCorp/rss-author)
- Khi `status === 'published_rss'` (nếu còn đường ghi): chỉ `resolveRssAuthor`
- Plain save giữ status cũ: nếu đã `published` → vẫn enforce admin author mỗi lần lưu (tránh regress)

### A4. Migration / backfill Production

Một migration SQL (hoặc script chạy 1 lần trên Prod, có transaction + đếm trước/sau):

1. **CafeF / VCCorp → SoT RSS**
   - `author.id IN ('rss:cafef','rss-author')` OR display_name ILIKE vccorp OR (source_id=cafef AND status=published_rss)
   - → `author = { id: 'cafef', display_name: 'CafeF' }`  
   - **Ngoại lệ:** `status = published` → **không** set CafeF; set theo A5.

2. **VietStock published_rss** (mọi byline)
   - `source_id = vietstock` AND `status = published_rss`
   - → `{ id: 'vietstock', display_name: 'VietStock' }`

3. **baodautu** (nếu có)
   - → `{ id: 'baodautu', display_name: 'Báo Đầu Tư' }`

4. **status = published** (đã Admin xuất bản nhưng author vẫn RSS/VCCorp)
   - Không bịa tên NV nếu không biết actor  
   - **Policy A (khuyến nghị):** `author = { id: 'admin', display_name: 'Admin' }` tạm + flag `attribution_needs_review: true`  
   - **Policy B:** giữ nguyên chờ Admin mở lại bài → save publish (Owner chốt)  
   - Đề xuất mặc định trong plan: **Policy A** để hết VCCorp ngay; Admin PASS wave B sẽ thấy “Admin” rồi sửa bằng lưu lại nếu cần tên thật.

5. **Xóa `vendor` / publisher/provider objects** khỏi payload (hoặc set null) mọi bài.

6. **Assert:** `payload::text ILIKE '%vccorp%'` → 0 (hoặc chỉ còn trong body_html nếu bài trích dẫn — tách: chỉ purge attribution paths, không rewrite body).

### A5. API read contract (không đổi URL)

- Article API trả `author.id` + `author.display_name` đã chuẩn.  
- `/community/authors` aggregate tự đúng sau backfill (GROUP BY author).

### A6. DoD Wave A (Owner test DB)

```sql
-- 0 VCCorp trong author/vendor
-- author.id chỉ cafef|vietstock|baodautu|uuid|admin (không rss:cafef)
-- published_rss + cafef → display_name = CafeF
-- published_rss + vietstock → VietStock
SELECT ...
```

API: `GET /api/community/authors` — không còn `VCCorp.vn` / `rss:cafef`.

**GATE A:** Owner PASS → mở Wave B.

---

## 4. WAVE B — Admin (sau GATE A)

**Mục tiêu:** Admin chỉ hiển thị/ghi theo SoT; dễ test tay trên Danh sách + Sửa bài.

### B1. List — cột Nguồn

`article-list-page.js` `nguonLabel(a)`:

```text
return (a.author && a.author.display_name) || '—'
```

Xóa nhánh `source_name` / `provider` / `from_rss` / `tier_label` làm Nguồn.

### B2. Edit — publish

- Nút **Xuất bản** → API đã force admin author (A3).  
- Verify payload sau save: id = UUID admin, display_name = tên NV đăng nhập.

### B3. Không thêm form author thủ công (tránh SoT thứ hai)

Trừ khi Owner yêu cầu override — mặc định **không**.

### B4. DoD Wave B (Owner test)

| Bước | Expect |
|------|--------|
| List bài `published_rss` CafeF | Nguồn = **CafeF** (không VCCorp) |
| List VietStock RSS | Nguồn = **VietStock** |
| Mở bài RSS → Xuất bản | Status = Xuất bản; Nguồn = **tên Admin/Sub** |
| Refresh list | Không regress về CafeF |
| SQL spot-check 1 id | `author` khớp UI |

**GATE B:** Owner PASS → mở Wave C.

---

## 5. WAVE C — User Web (sau GATE B)

**Mục tiêu:** Byline / authors / SEO chỉ consume `author.*`.

### C1. Article detail / feed cards

`community-post-page.js` / normalize store:

- Byline = `author.display_name` (+ link theo `author.id` nếu có).  
- Bỏ fallback publisher/provider/vendor/tier_label → tên.

### C2. `/cong-dong/tac-gia` + SEO

- Index từ API authors (đã sạch sau A).  
- SEO `{Tên tác giả}` = `display_name` từ SoT (CafeF / VietStock / tên Admin) — **không** VCCorp.

### C3. DoD Wave C

| Surface | Expect |
|---------|--------|
| Chi tiết bài RSS | Byline CafeF / VietStock / Báo Đầu Tư |
| Chi tiết bài đã Admin xuất bản | Byline tên NV |
| Authors list | Không VCCorp; có cafef / vietstock / admin ids |
| SEO title author page | `iFlux \| <display_name SoT>` |

---

## 6. Trình tự test Owner (checklist)

### Sau Wave A

- [ ] SQL: 0 `author.display_name` / `vendor` chứa VCCorp  
- [ ] SQL: `published_rss` + source cafef → author.id=`cafef`, display_name=`CafeF`  
- [ ] SQL: không còn `rss:cafef`  
- [ ] `GET /api/community/authors` không VCCorp / rss:cafef  

→ **Owner duyệt PASS A**

### Sau Wave B

- [ ] Admin list Nguồn đúng 3 brand RSS  
- [ ] Publish → Nguồn = tên tài khoản đang login  
- [ ] Không còn phụ thuộc cột source_name trên UI  

→ **Owner duyệt PASS B**

### Sau Wave C

- [ ] User Web byline = DB author  
- [ ] SEO author không VCCorp  

→ **Done**

---

## 7. Impact Analysis (CG-005)

| Feature | Owner hiện tại | Decision |
|---------|----------------|----------|
| Attribution payload | `community-entity-resolve` + ingest + articles.service | **Modify** |
| Backfill | DB `community_posts.payload` | **Migrate** |
| Admin Nguồn | `article-list-page.js` | **Modify** (sau GATE A) |
| Admin publish author | `community-articles.service` | **Modify** (Wave A API; B verify) |
| User Web byline | `community-post-page` / store | **Modify** (Wave C only) |
| SEO com-author | bootstrap + community-page | **Modify** (Wave C; data đã đúng từ A) |
| `content_articles.author_name` | content pipeline | **Out of scope Wave A** (Owner: chỉ `community_posts`) |
| `vendor`/`publisher` | ingest | **Delete write** + backfill remove |

**File mới?** Chỉ helper resolve author nếu không nhét sạch vào `community-entity-resolve` — ưu tiên **Modify existing**.

---

## 8. Rủi ro & mitigations

| Risk | Mitigation |
|------|------------|
| Mất byline người VietStock (Thu Minh…) trên RSS | Owner LOCK cố ý: RSS chỉ 3 brand — chấp nhận |
| `published` cũ không biết Admin nào | Policy A placeholder `Admin` + review flag |
| Body HTML vẫn chữ “VCCorp” | Không rewrite body; chỉ attribution fields |
| Wave C sớm | Gate cứng trong plan — không deploy UW trước PASS B |
| 010826 nguonLabel cũ | Thay bằng đọc `author.display_name` |

---

## 9. Non-goals (wave này)

- Đổi RBAC / tạo Role mới  
- Redesign form biên tập  
- Affiliate / canonical  
- Comment author (`community_comments`)  
- Market Master  

---

## 10. Quyết định Owner (LOCKED 2026-08-10)

1. **`published` + còn VCCorp:** **gán lại CafeF** (`id=cafef`, `display_name=CafeF`) — **không** gán tạm Admin. VCCorp = nhầm vào bài CafeF.  
2. **Báo Đầu Tư:** giữ đúng `display_name` catalog (`community_rss_providers.name`). 0 bài ≠ đổi tên.  
3. **`content_articles`:** Wave A **chỉ** `community_posts` — không sync `author_name`.

### 10b. SoT — đâu là nguồn sự thật?

| Surface | Vai trò |
|---------|---------|
| [Đồng bộ cấu trúc bài viết](https://iflux.vn/admin/cong-dong/dong-bo-cau-truc-bai-viet) | **SoT mapping** External RSS field → field iFlux (catalog JS). Không phải kho bài. |
| **`community_posts.payload.author`** | **SoT persistence + byline** Admin list/edit, User Web, authors, SEO. |
| **`content_articles`** | Content Engine song song (boundary) — không phải SoT byline hiện tại. |

---

## 11. Definition of Done (toàn bộ)

1. DB: không VCCorp trong attribution; RSS author ∈ 3 cặp id/name.  
2. Backfill VCCorp (kể cả `published`) → CafeF theo §10.1; bài `published` **mới** sau publish flow → Admin/Sub theo LOCK gốc.  
3. Admin Nguồn = `author.display_name` only.  
4. User Web byline / authors / SEO = cùng SoT (`community_posts`).  
5. Đủ GATE A → B → C với Owner PASS từng bước.  
6. Không còn UI đọc `source_name` / `vendor` / `tier_label` làm tên nguồn hiển thị.

---

**Done:** Wave A (DB) → B (Admin) → C (User Web). Owner xác nhận GATE C trên byline / authors / SEO.
