# 02_Audit — User Web Identity Migration: `community` → `news`

| Field | Value |
|---|---|
| Date | 2026-08-20 |
| Task | `05_0826_User_Web_Identity_Migration_Community_to_News` |
| Status | **Owner chốt A · implement wave page/folder đã mở — xem 04_Solution / 05_Plan** |
| Request | `01_Request.md` |
| Scope | Mọi dấu tích `community` / `Community` / `COMMUNITY` liên quan User Web Page Tin tức |
| Không làm | Implementation · rename · migration · commit · push · deploy · Production · Solution · Plan |

Wave 1 (`community.news[]` → `block.news[]`) **tạm dừng**. Audit này không giả định Wave 1 đã implement.

---

## 0. Kết luận ngắn

Hệ thống **không có một identity `community`**. Có **nhiều domain cùng chữ**, chỉ một phần là User Web Page Tin tức.

```text
Display + URL đã chuẩn (task 04):
  Cộng đồng → Tin tức
  /cong-dong → /tin-tuc

Technical identity Page Tin tức VẪN LÀ:
  pageKey / route / detect / SEO / entitlement / publish / folder
  = community
```

**Target mặc định Request (`community` → `news`) không thể áp hàng loạt.**  
`news` **đã chiếm** ở 3 chỗ sống:

| Occupier | Vai trò | Owner đã khóa (task 04 / Wave 1) |
|---|---|---|
| Entity Tab `key: 'news'` | Tab “Tin tức” trên CP / Ngành / HST / Câu chuyện | **GIỮ** |
| `content_type` `news` / FE remap `article`→`news` | Discriminator bài trên `community_posts` | **GIỮ** đến khi mở rename bảng |
| `BLK-COM-NEWS` | Block feed trên page `community` | Chưa chốt đổi id |

Đặt pageKey Tin tức = `news` = **cùng key** với tab Entity + content type + một nửa block id. Detect / entitlement / composition / SEO **không phân biệt** các lớp này nếu dùng chung một string.

Audit PASS inventory. Implementation **không được mở** cho đến khi Owner chốt Stop List (§F).

---

## A. Identity Inventory

Không dump từng dòng backlog. Gom theo **token sống**. Mỗi token = một identity có producer + consumer.

### A1. Page Identity — User Web Tin tức (ĐÚNG scope Request)

| Token | File / chỗ | Variant |
|---|---|---|
| `PAGE-COM` `key: 'community'` | `Admin_Design_system/app/system/page-settings-catalog.js` | `community` |
| `pageKey: 'community'` | `Admin_Design_system/data/page-composition.json` · `backend/scripts/data/page-composition.json` | `community` |
| `pageKey: 'community'` | `User_Web/iflux-web-ui/pages/community.manifest.js` | `community` |
| `id: 'PF-community'` + `pageKey` | `User_Web/iflux-web-ui/features/community.manifest.js` | `community` |
| Route key `community` | `User_Web/iflux-web-ui/iflux-routes.js` · `iflux-platform-boot.js` (×2) | `community` |
| Detect path → `'community'` | `runtime/bootstrap.js` · `bootstrap.js` · `iflux-platform-boot.js` | `community` |
| Nav `{ key: 'community', label: 'Tin tức' }` | `iflux-platform-boot.js` | `community` |
| Entitlement page `{ key: 'community', label: 'Tin tức' }` | `entitlement-catalog.js` · `iflux-entitlements.js` · `plan-normalize-publish.js` | `community` |
| `pages.community` | `iflux-entitlements.js` guest/plan map | `community` |
| `PAGE_REGIONS.community` | `page-settings-catalog.js` | `community` |
| SEO `page_key = 'community'` | `seo-contract.js` · `seo-platform.service.js` · `breadcrumb.js` · nginx SSI `pageKey=community` · `055_seed_page_seo_baseline.sql` · `061_page_seo_community_tin_tuc.sql` | `community` |
| Sitemap `{ pageKey: 'community', path: '/tin-tuc' }` | `seo-platform.service.js` | `community` |
| Onboarding `target_key: 'community'` | `iflux-onboarding.js` · `061` UPDATE · `onboarding.service.js` | `community` |
| Post-login `to('community')` | `auth.js` | `community` |
| Folder vật lý | `User_Web/community/` (`index.html`, `write.html`, `post.html`, leftover HTML) | `community` |
| Nginx rewrite | `infra/staging-1/iflux-staging-app.conf` · `infra/nginx-iflux-production-locations.conf` → `/User_Web/community/index.html` | `community` |
| `WGT-COM-*` `pages` / `group: 'community'` | `widget-registry.js` (User Web + Admin) · `plan-normalize-publish.js` (`/^WGT-COM/` → `['community']`) | `community` |
| Blocks `page: 'community'` | `BLK-COM-NEWS` (+ siblings) catalog · entitlement · plans-runtime | `community` |
| Composite widget | `widgets/community-page/index.js` · `WGT-COM-PAGE` | `Community` / `community` |
| Notification `menuKey: 'community'` | `inapp-notifications.js` | `community` |
| Allowlist | `User_Web/data/iflux-staging-allowlist.json` | `community` |

**Child page keys (cùng cây, không phải pageKey gốc):**

| Token | Ý nghĩa | Path hiện tại |
|---|---|---|
| `com-topic` | Collection chủ đề | `/tin-tuc/chu-de/:slug` |
| `com-cat` | Collection danh mục | `/tin-tuc/danh-muc/:slug` |
| `com-author` | Collection tác giả | `/tin-tuc/tac-gia/:username` |
| `com-post-detail` | Chi tiết bài | `/tin-tuc/bai-viet/:id` |
| `com-write` | Viết bài (inactive) | `/tin-tuc/viet-bai` |
| `communityPost` | Runtime detect chi tiết bài | bootstrap |
| `communityWrite` | Runtime detect viết bài | routes + bootstrap |
| `communitypost` / `comments` → `community` | Alias entitlement | `iflux-entitlements.js` |

`PAGE_KEY_PARENT` map: `com-topic|com-cat|com-author|com-post-detail` → parent `'community'`.

### A2. Runtime / file / global (cùng page, khác token)

| Token | File |
|---|---|
| `IfluxCommunityStore` | `community-store.js` |
| `IfluxCommunityApiBridge` / `IfluxCommunityProvider` | `iflux-community-api-bridge.js` |
| `IfluxCommunityUI` | `community-ui.js` |
| `IfluxCommunityPage` (implied boot) | `community-page.js` |
| `community-daily-feed.js` · `community-trending.js` · `community.css` | cùng folder `iflux-web-ui/` |
| Widgets folder | `widgets/community-page/` · `community-list/` · `community-stock-heat/` · `community-story-top/` · `community-active/` · `community-post-page/` |
| Event `iflux-community-change` | `entity-timeline-feed.js` (consumer Entity — **không** phải page key) |
| Storage leftover | `iflux_community_v1` / `v2` (store cấm ghi nghiệp vụ; `storage-keys.json` còn key) |

### A3. Widget / Block / Algorithm prefix `COM`

| ID | Label / vai | `page` |
|---|---|---|
| `WGT-COM-PAGE` | Composite trang Tin tức | community |
| `WGT-COM-001` | Heatmap cổ phiếu | community |
| `WGT-COM-CHUDE-TOP` | Chủ đề tích cực | community |
| `WGT-COM-002` | Thành viên tích cực | community |
| `WGT-COM-003` | Chuyên gia | community |
| `WGT-COM-004` | Top watchlist | community |
| `BLK-COM-NEWS` | Block Tin tức / Daily Feed | community |
| `BLK-COM-TRENDING` · `BLK-COM-CHUDE-TOP` · `BLK-COM-EXPERTS` · `BLK-COM-ACTIVE` · `BLK-COM-OVERVIEW` · `BLK-COM-BREADTH` · `BLK-COM-TOPWL` | Block siblings | community / shared |
| `ALG-COM-FEED` · `ALG-COM-MEMBERS` · `ALG-TOPIC-TREND` | Algorithm | — |
| `NORM-COMMUNITY` | Normalized entity L2 | — |
| Resolver keys | `community_news` · `community_trending` · `community_active` · `community_experts` · `community_topwl` · `community_story_top` | — |
| Field path | `community.news[]` | resolver only |

`plans-runtime.json`: flag `BLK-COM-NEWS` (và block COM khác) trên **mọi plan**.

### A4. Backend / API — `community` là **module + path**, không phải pageKey

| Token | Vai |
|---|---|
| Mount | `app.use(.../community, createCommunityRouter)` |
| Admin ops | `.../admin/community-ops` |
| Public API | `/api/community/feed` · `/articles/:id` · `/categories` · `/chu-de` · `/authors` · comments · interaction |
| Admin API | `/api/community/admin/articles` · categories · rss-providers · chu-de · authors |
| Module folder | `backend/src/modules/community/` (13 file) |
| Job | `rss-community-ingest` |
| Nginx article SSI | `proxy_pass .../api/community/articles/$post_slug/...` |

Đổi pageKey **không** tự đổi API. Đổi API = breaking client User Web + Admin + nginx SSI.

### A5. Database

| Object | Vai |
|---|---|
| `community_posts` | SoT bài viết (Admin + RSS + feed User Web + Entity tab) |
| `community_comments` | Bình luận bài |
| `community_categories` | Danh mục |
| `community_rss_providers` | Nguồn RSS |
| `community_rss_schema` | Mapping field → `community_posts` |
| `community_rss_sync_jobs` | Job RSS |
| `community_admin_comments` · `community_admin_reports` | Wave D admin |
| `page_seo_configs.page_key = 'community'` | SEO persist |
| `onboarding_steps.target_key = 'community'` | Onboarding persist |

Cột `community_posts.content_type` giá trị sống: `news` (legacy/default user create) · `article` (Admin/RSS default) · `expert` · `insight`. FE gộp `article`/`insight` → `news`.

### A6. Admin Module — **không** phải User Web page identity

Hai nhóm menu cùng namespace `community` / folder `app/community/` / URL `/admin/cong-dong`:

| Nhóm display | Route key | Việc |
|---|---|---|
| **Quản lý Tin tức** | `community-content-*` · `community-categories` · `community-chu-de-list` · RSS | Viết/sửa/xóa bài → `community_posts` |
| **Quản lý Cộng đồng** | `community-comments` · `community-chu-de-moderation` · reports · experts | Kiểm duyệt |

RBAC module: `permission-catalog.js` `key: 'community'` → `community.articles.*` · `community.comments.*` · …

Task 04 **khóa** `/admin/cong-dong`. Leftover `/admin/community` → 301 `/admin/cong-dong`.

### A7. SoT Product Architecture — Community Layer

`docs/SoT — iFlux Product Architecture (V2).md` § Community Layer:

- Tầng kiến trúc sở hữu **Bài viết (Post)**, không sở hữu Entity Knowledge.
- URL Experience đã là `/tin-tuc`.
- Admin slug vẫn `/admin/cong-dong`.
- Chữ “Cộng đồng” còn trong mô tả layer / Topic vs Story.

Đây **không** phải pageKey. Đổi layer name = đổi SoT cấp cao, ngoài Request trừ khi Owner mở.

### A8. Historical / leftover / không migrate như identity sống

| Nơi | Ghi chú |
|---|---|
| Leftover URL `/community` · `/cong-dong` · `/User_Web/community/*.html` | **Phải giữ string** để 301. Xóa = gãy leftover |
| `User_Web/community/cong-dong/{ticker}/{slug}/` | HTML 301 sang `/tin-tuc/bai-viet/` |
| `IfluxContentStore` + `content-edit.js` | Sandbox GĐ1 localStorage — không phải writer live |
| `Coverage-20260722T164852.json` | Snapshot dump |
| `Product Backlogs/**` · login-surface-artifacts | Historical |
| SoT V1 | Archive |
| Comment đầu file `community-*.js` | “Cộng đồng” |

### A9. Chữ `news` đã sống (collision target)

| Token | Domain | Được phép lấy làm pageKey? |
|---|---|---|
| Entity `GROUP_TABS` / `STOCK_TABS` `{ key: 'news' }` | Knowledge Entity tab | **Không** — Owner GIỮ |
| `CONTENT_TYPE_NEWS = 'news'` | Domain bài | **Không** trừ khi mở Wave bảng |
| `BLK-COM-NEWS` | Block id | Chưa chốt |
| `icon("news")` · `.ifx-stock-news-*` | Icon / CSS Entity | Không liên quan page |
| `showNews` · `listNewsHero` · `demoCommunityNews` | Option / helper | Không phải pageKey |

---

## B. Classification

| Cluster | Classification | Có phải Page Identity Tin tức? |
|---|---|---|
| A1 pageKey / route / detect / SEO / entitlement page / composition / nginx pageKey | **Page Identity** | Có — đây là object Request muốn migrate |
| A1 child `com-*` / `communityPost` / `communityWrite` | **Runtime Identity** (cây page) | Cùng cây — target riêng |
| A2 store / bridge / CSS / folder / widgets path | **Runtime Identity** + file identity | Binding page; đổi tên file ≠ bắt buộc đổi pageKey |
| A3 `WGT-COM` / `BLK-COM` / `ALG-COM` / `NORM-COMMUNITY` | **Widget Identity** | `page: 'community'` là page; prefix `COM` là convention |
| A4 `/api/community` + module | **API Contract** + **Backend Identity** | Không. Là Community Layer / content domain |
| A5 tables | **Database Identity** + **Domain Model** | Không. Cùng corpus với Admin + Entity tab |
| A6 Admin `/admin/cong-dong` + RBAC `community.*` | **Admin Module** | Không. Task 04 giữ URL Admin |
| A7 SoT Community Layer | **Domain Model** (architecture) | Không |
| Notification `category: community` | **Khác** (notification taxonomy) | `menuKey` trỏ page; label còn “Cộng đồng” |
| A8 leftover / docs | **Historical** | Giữ detector |
| Entity tab `news` · content_type | **Domain khác** | Cấm gộp vào pageKey |

---

## C. Migration Target

Target mặc định Request chỉ áp **khi usage = User Web Page Identity**.

| Current | Target (nếu Owner chốt pageKey=`news`) | Layer | Impact |
|---|---|---|---|
| `pageKey` / catalog `community` | `news` | Page Identity | Cài đặt Trang · composition object key · mọi reader |
| Composition JSON key `"community"` | `"news"` | Publish | Phải migrate persist + dual-read |
| Entitlement `key: 'community'` (page) | `news` | Entitlement | Mọi plan `pages.community` |
| Route `community` | `news` | Runtime | `to('news')` · leftover map giữ `/community`→news |
| Detect `'community'` | `'news'` | Runtime | bootstrap + boot + nginx SSI `pageKey=` |
| SEO `page_key=community` | `news` | SEO / persist | Migration SQL `page_seo_configs` · tests |
| Onboarding `target_key` | `news` | Persist | `onboarding_steps` |
| `PAGE-COM` id | `PAGE-NEWS`? | Catalog | Owner — id ≠ key |
| `PF-community` | `PF-news` | Feature | Manifest id |
| `WGT-COM-PAGE` `page: community` | `page: news` | Widget | Binding |
| `BLK-COM-*` `page: community` | `page: news` | Entitlement | Flag plan không đổi nếu chỉ đổi field `page` |
| Notification `menuKey: community` | `news` | Notification | Deep-link nav |
| Child `com-topic` … | `news-topic`? hoặc giữ `com-*` | Runtime | **Stop** |
| `communityWrite` / `communityPost` | `newsWrite` / `newsPost`? | Runtime | **Stop** |
| Folder `User_Web/community/` | `User_Web/news/`? | File | Nginx + SSI + leftover HTML — **Stop** (không bắt buộc nếu chỉ đổi key) |
| `IfluxCommunityStore` | `IfluxNewsStore`? | Runtime | **Stop** — không phải pageKey |
| `/api/community/*` | `/api/news/*`? | API | Breaking — **Stop** |
| `community_posts` | `news_posts`? | DB | Breaking + Entity tab + RSS — Owner từng nói Wave 2 |
| Admin `/admin/cong-dong` | `/admin/tin-tuc`? | Admin | Task 04 **cấm** trừ khi mở lại |
| RBAC `community.*` | `news.*`? | Admin | Mọi role persist — **Stop** |
| `BLK-COM-NEWS` | `BLK-NEWS-NEWS` / `BLK-NEWS-FEED`? | Widget | Collision chữ NEWS — **Stop** |
| `community_news` / `community.news[]` | `block_news` / `block.news[]` | Resolver | Wave 1 đã chốt mapping — **không** thành pageKey |
| Leftover `/community` string trong detect/nginx | **GIỮ** | Historical | Xóa = gãy 301 |
| Entity tab `news` | **KHÔNG ĐỔI** | Domain khác | Semantics đúng |
| `content_type=news` | **KHÔNG ĐỔI** trong page migration | Domain khác | Wave bảng riêng |
| SoT “Community Layer” | **KHÔNG ĐỔI** trừ Owner | Architecture | Layer ≠ page |
| `NORM-COMMUNITY` | `NORM-NEWS`? | Widget/L2 | **Stop** — data shape feed |
| Admin “Quản lý Cộng đồng” | **KHÔNG ĐỔI** | Admin social | Domain kiểm duyệt |

**Nếu Owner muốn hết chữ `community` trên page nhưng tránh collision `news`:**  
pageKey hợp lệ phải **≠ `news`** (vd. `articles`) — trái default Request. Ghi vào Stop List, không tự đề xuất implement.

---

## D. Dependency Graph

### D1. Page Identity `community` (một chuỗi)

```text
PRODUCER (authority)
  page-settings-catalog.js     PAGE-COM.key = community
  page-composition.json        "community" { pageKey, path /tin-tuc, widgets }
  pages/community.manifest.js  pageKey + WGT-COM-PAGE
  entitlement-catalog.js       PAGES.key = community
  seo-contract / page_seo_configs.page_key = community
  nginx                        rewrite /tin-tuc → User_Web/community/ + SSI pageKey=community

CONSUMER
  Cài đặt Trang Admin          đọc catalog + composition
  bootstrap.js                 detect /tin-tuc|/cong-dong|/community → community
  iflux-routes.js              to('community') → /tin-tuc
  auth.js                      post-login → community
  iflux-entitlements           canShow page / alias communitypost
  IfluxBlockGate.apply('community')
  widget-registry              group + pages[]
  plan-normalize-publish       WGT-COM* → page community
  plans-runtime.json           block flags
  seo-platform.service         map path → pageKey · sitemap · OG foundation
  breadcrumb                   community → Tin tức /tin-tuc
  onboarding                   target_key
  inapp-notifications          menuKey
  User Web composite           widgets/community-page → community-page.js → DailyFeed
```

### D2. Content domain (cùng chữ, khác identity)

```text
PRODUCER
  Admin article-edit-page  →  PUT /community/admin/articles  →  community_posts
  RSS job rss-community-ingest → community_posts (content_type article)
  (legacy) POST /community/posts → content_type default news

CONSUMER
  GET /community/feed            → ApiBridge.setFeed → IfluxCommunityStore
  Page Tin tức DailyFeed         (BLK-COM-NEWS gate)
  Entity tab news                getPosts({ contentType:'news', ticker|taxonomy })
  SEO / sitemap posts            FROM community_posts
  Media worker                   community_posts.media_status
```

Page migration **không** cắt chuỗi này trừ khi Owner mở API/DB.

### D3. Producer / consumer theo lớp

| Identity | Producer | Consumer |
|---|---|---|
| pageKey `community` | Catalog · composition · manifest | Detect · nav · entitlement · SEO · publish · gate |
| folder `User_Web/community/` | Git tree | Nginx rewrite · leftover 301 · `file:` routes |
| API `/community` | `community.routes.js` | ApiBridge · Admin article-list/edit · nginx SSI article |
| `community_posts` | articles.service · rss-ingest · community.service | feed · SEO · Entity · media · follow counts |
| `BLK-COM-NEWS` | catalog + plans-runtime | `community-page.js` `showNews` |
| `community_news` | catalog BLOCK_RESOLVER | `platform-layers-resolver.js` |
| RBAC `community.*` | permission-catalog | Admin routes · matrix |
| leftover `/community` | nginx + slug map | Browser cũ / bookmark |

---

## E. Collision / Risk

| Đổi | Runtime | Publish | Widget | API | DB | Cache | Persist | Admin |
|---|---|---|---|---|---|---|---|---|
| Chỉ pageKey catalog `community`→`news` | Vỡ detect/entitlement nếu không đồng bộ | Composition miss key | `pages:['community']` mồ côi | Không | Không | SSI pageKey sai | `page_seo_configs` miss | Cài đặt Trang trống |
| pageKey + composition + SEO + entitlement đồng bộ → `news` | **Va Entity tab `news`** + alias `communitypost` | Dual-read bắt buộc | Đổi `page:` field | Không | SEO + onboarding rows | Cloudflare + SSI | Có | Label ok |
| Folder `User_Web/community/` → `news/` | Mọi rewrite nginx + leftover HTML | Module path widget | Mọi `lazyModule` | SSI article template path | Không | Cache path | Không | Admin không |
| `/api/community` → `/api/news` | User Web + Admin + SSI gãy | Không | Không | **Breaking** | Không | API cache | Client | article-list |
| `community_posts` → `news_posts` | Feed + Entity + SEO | Không | Không | SQL mọi module | **Migration nặng** | Không | Mọi row | RSS schema |
| RBAC `community.*` → `news.*` | Admin 403 | Không | Không | Perm check | Role JSON | Không | Mọi role | Matrix |
| `BLK-COM-NEWS` rename | `blockVisible` false → ẩn feed | plans-runtime miss | Catalog + ALG | Không | Không | Không | Mọi plan flag | Phân quyền |
| Xóa string leftover `/community` | Bookmark 404 | Không | Không | Nhầm `/api/community` nếu xóa nhầm | Không | Không | Không | `/admin/community` 301 gãy |
| Gộp pageKey với Entity `news` | Tab Entity + page cùng key trong detect/nav | Publish nhầm host | Widget `pages` ambiguous | Không | Không | Không | Không | Cài đặt Trang vs Entity |

**Rủi ro cao nhất:** coi `community` là một token duy nhất rồi rename hàng loạt → gãy API, Admin moderation, leftover 301, Entity tab.

**Rủi ro cao thứ hai:** chọn target `news` khi `news` đã là tab Entity + content type.

---

## F. Stop List — Owner quyết trước Solution

**Owner 2026-08-20 — ĐÓNG:** F1-A (pageKey `news` + tab Entity → `articles`). F2 toàn hệ thống **Có migrate** (bảng §2 Solution). F2-8 Wave 1 block mapping **không gộp**. F2-12 giữ tên Community Layer (trống). F2-13 leftover URL giữ trong window rồi retire. Không A/B. Task Community chỉ sau PASS.

Không Solution / Plan / code cho đến khi có câu trả lời. *(Đoạn dưới = inventory lúc audit; superseded bởi lock trên.)*

### F1. Target pageKey (chặn mặc định Request)

`news` **không trống**. Chọn một:

| Option | Ý nghĩa |
|---|---|
| **F1-A** | Page Tin tức → `news`. Phải **mở lại** Entity tab `news` (đổi tab key) và/hoặc chấp nhận 2 domain cùng key. Trái khóa Owner Wave 1. |
| **F1-B** | Page Tin tức → key **khác** `news` (Owner đặt). Default Request không thỏa. Hết `community` trên page, không chiếm tab Entity. |
| **F1-C** | **Không** đổi pageKey. Task đóng hoặc thu hẹp (chỉ file/comment). |

### F2. Ranh giới “hết chữ community”

Mỗi dòng: **Có / Không** trong cùng task page identity.

| # | Usage | Mặc định audit |
|---|---|---|
| F2-1 | pageKey + composition + SEO + entitlement page + detect + route | Có — nếu F1 ≠ C |
| F2-2 | Child `com-*` / `communityPost` / `communityWrite` | Chờ |
| F2-3 | Folder `User_Web/community/` + `community-*.js` + widgets path | Không bắt buộc (Modify-first: đổi key, giữ folder) |
| F2-4 | `IfluxCommunityStore` / ApiBridge | Không — domain reader |
| F2-5 | `/api/community` + module folder | Không — API contract |
| F2-6 | `community_posts` (+ comments/categories/rss tables) | Không — trừ Owner mở Wave DB (từng nói `news_posts`) |
| F2-7 | `BLK-COM-*` / `WGT-COM-*` / `ALG-COM-*` / `NORM-COMMUNITY` | Chỉ field `page:`; không rename id |
| F2-8 | Wave 1 `community_news` / `community.news[]` | Task riêng đã chốt; không gộp |
| F2-9 | Admin `/admin/cong-dong` + folder `app/community/` | Không — task 04 khóa |
| F2-10 | RBAC module `community.*` | Không |
| F2-11 | Menu “Quản lý Cộng đồng” (moderation) | Không |
| F2-12 | SoT Community Layer name | Không — V2 architecture |
| F2-13 | Leftover detector `/community` `/cong-dong` | **Giữ** |
| F2-14 | Notification category + label “Cộng đồng” | Chờ |
| F2-15 | Entity tab `news` · content_type `news` | **Cấm** trong task này |

### F3. Phụ thuộc đã khóa từ trước (không tự mở)

- Entity Tab `news` GIỮ.
- Content type `news` GIỮ đến Wave bảng.
- Wave 1 block namespace: tạm dừng, không implement trong task 05.
- Không Production.
- Không đổi URL `/tin-tuc` (đã xong).
- Không đổi `home` / Dashboard / 4 Entity URL.

### F4. Persist phải migrate nếu F2-1 = Có

```text
page-composition.json (Admin + backend/scripts)
page_seo_configs.page_key
onboarding_steps.target_key
plans-runtime.json  (nếu đổi block id; không nếu chỉ page field)
widget publish placements (pageKey cột/payload)
```

Dual-read `community|news` trong một release — Owner có chấp nhận không?

---

## Acceptance

| Tiêu chí Request | Kết quả |
|---|---|
| Không bỏ sót usage `community` thuộc User Web Page Tin tức | **Đủ** — Cluster A1 + cây A1 child + binding A2/A3 `page:` |
| Inventory đầy đủ | §A (9 nhóm) |
| Dependency đầy đủ | §D |
| Migration target từng usage | §C — default `news` **bị chặn** cho pageKey |
| Risk map | §E |
| Stop list | §F |

Audit **PASS inventory**. Audit **chưa PASS để mở Solution** — thiếu quyết định F1 + F2.

---

## Việc tiếp theo (không tự làm)

1. Owner chốt Stop List §F.
2. Sau đó mới `04_Solution.md` + `05_Plan.md`.
3. Không implementation.
)
