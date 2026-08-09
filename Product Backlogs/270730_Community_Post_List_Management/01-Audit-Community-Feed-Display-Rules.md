# 01 — Audit · Rule hiển thị danh sách bài viết Cộng đồng (User Web)

**Date:** 2026-07-30  
**Task:** [`00-README.md`](00-README.md)  
**Phạm vi:** Production User Web feed `/cong-dong` (Daily Feed) — **không** Admin CMS (trừ khi cùng API).  
**Status:** ✅ Audit snapshot (evidence code workspace)  
**Verdict ngắn:** Chỉ `published` / `published_rss` · sort mới→cũ · load **36** bài/API · UI theo **ngày** · Guest ẩn khối chuyên gia · pin/featured **chưa** điều khiển thứ tự list.

---

## 1. Surface

| Surface | URL | Ghi chú |
|---------|-----|---------|
| **Danh sách chính** | `/cong-dong` | Daily Feed |
| Collection index | `/cong-dong/chu-de` · `/tac-gia` · `/danh-muc` | Không phải list bài |
| Collection feed | `/cong-dong/chu-de/:slug` (và tương tự) | Cùng Daily Feed + **filter FE** |
| Query | `?ticker=` `?story=` `?author=` `?category=` … | Filter FE trên batch đã tải |
| Chi tiết | `/cong-dong/bai-viet/:ref` | Ngoài phạm vi list |

**Entry:** `User_Web/community/index.html` · manifest `pages/community.manifest.js` (`path: '/cong-dong'`).

---

## 2. Ownership (chuỗi hiện tại)

```text
WGT-COM-PAGE (widgets/community-page)
  → IfluxCommunityApiBridge.loadFeed({ limit: 36 })
  → IfluxCommunityStore.setFeed / getPosts
  → IfluxCommunityPage.boot → mountDailyFeed
  → IfluxDailyFeed (community-daily-feed.js)
  → GET /api/community/feed → community-feed.service.listFeed
```

| Vai trò | Module |
|---------|--------|
| Widget page | `User_Web/iflux-web-ui/widgets/community-page/index.js` |
| Page controller | `community-page.js` (`boot` · `mountDailyFeed`) |
| List UI | `community-daily-feed.js` |
| Store | `community-store.js` |
| Bridge | `iflux-community-api-bridge.js` |
| Backend | `backend/src/modules/community/community-feed.service.js` · `community.routes.js` `GET /feed` |

**SoT UI hiện tại:** Daily Feed. `loadNewsPage` / infinite news grid cũ **không** được `boot()` gọi (dead path trong file).

---

## 3. Current Rule (Owner)

| Quy tắc | Giá trị hiện tại | Lớp |
|---------|------------------|-----|
| Status lên feed | Chỉ `published` **hoặc** `published_rss` | BE + FE |
| Draft / pending / scheduled | **Không** vào feed | BE (+ FE trừ `includeDrafts`) |
| Sort mặc định | `published_at \|\| created_at` **DESC** (mới → cũ) | BE + FE |
| Pin / featured Admin | Có action Admin; FeedCard **strip `display`** → **không** đổi thứ tự list | BE |
| Featured “trong ngày” (UI) | Prefer flag featured rồi likes — flag thường **không** có vì API strip | FE |
| Nhóm hiển thị | Theo **ngày đăng**; scroll load ngày tiếp | FE |
| content_type | Tách `news` vs `expert` trong cùng ngày | FE |
| Limit API | FE **36**; BE clamp 1–50 (default 30) | FE+BE |
| Offset / page API tiếp | Page gọi **một lần** `offset: 0`; Daily **không** refetch page API | FE |
| Filter ticker / chủ đề / category / author | Chủ yếu **lọc FE** trên ≤36 bài đã tải (API có một phần filter nhưng page **không** truyền) | FE chính |
| Guest vs Login (dữ liệu) | Cùng feed công khai — **không** khác dataset | API |
| Guest vs Login (UI) | Guest: Tin tức **on**, Chuyên gia **off**; Free+: Experts on (plan) | Entitlement |
| Fail-closed entitlement | Không có `IfluxEntitlements` → ẩn block | FE |

### Entitlement blocks

| Block | Ảnh hưởng | Guest |
|-------|-----------|-------|
| `BLK-COM-NEWS` | Section Tin tức Daily Feed | Hiện |
| `BLK-COM-EXPERTS` | Chuyên gia nổi bật + bài chuyên gia | **Ẩn** |

---

## 4. Evidence (key)

| Rule | Evidence |
|------|----------|
| Status SQL | `community-feed.service.js` — `WHERE status IN ('published', 'published_rss')` |
| Store filter | `community-store.js` `getPosts` — cùng status |
| Boot → Daily Feed | `community-page.js` `boot` → `mountDailyFeed` (~L617–629) |
| Entitlement mount | `mountDailyFeed` — `BLK-COM-NEWS` / `BLK-COM-EXPERTS` (~L605–614) |
| Limit 36 | Widget / Bridge `loadFeed({ limit: 36 })` |

---

## 5. Empty / loading

| Trạng thái | UI |
|------------|-----|
| Empty Daily | “Chưa có tin tức hoặc bài viết chuyên gia.” |
| Hết ngày | “Đã xem hết tin tức & bài viết chuyên gia” |
| Feed API fail | Bridge trả cards rỗng — không throw → có thể empty |

---

## 6. Rủi ro Product (Owner cần biết)

1. **Filter path/query chỉ FE trên top-36 theo thời gian** → bài đúng filter nhưng ngoài batch có thể **trống giả**.  
2. **Author filter không có trên API feed** — chỉ match client.  
3. **Pin/featured không điều khiển thứ tự list** (strip `display`).  
4. Guest/Free khác **UI Experts**, không khác dataset API.  
5. Workspace = audit source; Production có thể lệch CDN nếu chưa purge.

---

## 7. Next (chờ Owner)

- Chốt mục tiêu **Quản lý bài viết** (Admin list? User list rule? Pin/order? Filter server-side?).  
- Impact Analysis trước khi code (CG-005).  
- Không implement trong bước này.

---

*Audit 01 · 2026-07-30 · Pass Phase / task khác không liên quan*
