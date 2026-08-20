# 04_Solution — Vacate `community` → News / Article

| Field | Value |
|---|---|
| Date | 2026-08-20 |
| Status | **OWNER LOCKED — phương án A** |
| Audit | `02_Audit.md` |
| Restore | `00_Restore_Baseline.md` · SHA Staging `373e821` |

---

## 1. `/admin/cong-dong` — task 04 khóa gì?

**Không khóa Admin module. Khóa URL Admin.**

Task 04 chỉ đổi User Web: display Cộng đồng → Tin tức, URL `/cong-dong` → `/tin-tuc`. Câu trong Request 04:

```text
Giữ … Admin /admin/cong-dong
```

Nghĩa cụ thể:

| Được / không | Việc |
|---|---|
| Được | Đổi nhãn menu “Quản lý Tin tức” (đã làm) |
| **Không** | Đổi path `/admin/cong-dong` → `/admin/tin-tuc` |
| **Không** | Đổi leftover 301 `/admin/community` → `/admin/cong-dong` |
| **Không** | Đổi folder `Admin_Design_system/app/community/` |
| **Không** | Đổi RBAC `community.articles.*` |

Admin đang sống ở `/admin/cong-dong` vẫn là **Quản lý Tin tức** (bài) + **Quản lý Cộng đồng** (kiểm duyệt). Chữ `cong-dong` trên URL Admin là leftover, không phải User Web page.

Câu “Cộng đồng mới nên có Admin khác” = khi dựng sản phẩm Community mới, **không** dùng `/admin/cong-dong` (đang là Admin Tin tức). Page mới cần path riêng (vd. `/admin/cong-dong-xh` — Owner đặt sau).

**Owner 2026-08-20 (Task 05 change request):** khóa Task 04 chỉ khóa path trong phạm vi Task 04. Task này đồng cấp — Admin **module Tin tức** (bài + RSS + kiểm duyệt bài) → `/admin/news`. Không dùng `/admin/tin-tuc`.

**Owner verdict (Admin ≠ User Web):** leftover Admin **không** phải leftover vĩnh viễn.

* User Web: `/cong-dong` · `/community` → 301 `/tin-tuc` là leftover URL hợp lệ trong migration window.
* Admin: không duy trì 301 compatibility lâu dài (không phải public URL). `/admin/community/*` · `/admin/cong-dong/*` chỉ tồn tại **migration window rất ngắn** để tránh gãy link nội bộ. Sau Staging PASS **và** Production PASS → retire hoàn toàn.

Sau PASS, `/admin/community` = **FREE** cho sản phẩm Community — không tạo sản phẩm đó trong task này.

| Canonical (Tin tức) | Leftover 301 (window) |
|---|---|
| `/admin/news/articles` | `/admin/cong-dong`, `/admin/cong-dong/danh-sach-bai-viet`, `/admin/community/articles` |
| `/admin/news/categories` | `/admin/cong-dong/categories` |
| `/admin/news/topics` | `/admin/cong-dong/danh-sach-chu-de` |
| `/admin/news/edit` | `/admin/cong-dong/content/edit` |
| `/admin/news/comments` (kiểm duyệt bài — target PASS) | `/admin/community/comments`, `/admin/cong-dong/comments` |

---

## 2. Owner lock A — Identity Migration toàn hệ thống (2026-08-20, diễn đạt lại)

**Không có lựa chọn A/B.** Không “vacate rồi mới đẻ page” trong cùng lúc. Không mở task sản phẩm Community trên namespace còn chiếm.

```text
Hiện tại          community = Tin tức (legacy identity)
Task này          community → news   (toàn hệ thống)
Kết quả PASS      news = Tin tức
                  community = FREE
Task Community    chỉ được mở SAU khi migration PASS
```

Collision (alias, API, DB, store, folder, Admin, widget id) = **danh sách phải migrate**, không phải lý do dừng.

| Collision (inventory) | Target Owner |
|---|---|
| `to('community')` · detect · entitlement | `news` (hết dual-read `community` → news khi PASS) |
| `/api/community` | `/api/news` — compat 301/alias trong migration window |
| `community_posts` (+ comments / RSS thuộc bài) | `news_posts` |
| `IfluxCommunityStore` | `IfluxNewsStore` |
| `User_Web/community/` | `User_Web/news/` |
| `/admin/community/*` của **module Tin tức** (bài, RSS, kiểm duyệt bài) | `/admin/news/*` |
| `BLK-COM-*` / `WGT-COM-*` / `ALG-COM-*` của Tin tức | namespace News |
| Leftover User Web `/cong-dong` · `/community` | Redirect trong window — leftover URL hợp lệ |
| `backend/src/modules/community` | `modules/news` — giữ tạm trong window thì **không đủ**; đổi trước gate |
| `Admin_Design_system/app/community` | `app/news` — đổi **trước** retire leftover |
| `community-*.js` của Tin tức | Đổi tên trong task này |
| RBAC `community.*` của Tin tức | Đổi `news.*`. `community.*` của sản phẩm Community tương lai — **không tạo** |
| RBAC `community.*` nếu đúng là Community product | Để dành, không đụng |

**Không đổi trong task này:** SoT **tên** Community Layer (layer để trống cho sản phẩm sau). Wave 1 `community.news[]` / `block_news` = task riêng, không gộp. Production = Owner mở push riêng.

**Gate cuối trước commit** (`07_Audit_Identity_Gate.md`): không còn technical identity `community` nào trỏ tới Tin tức.

Chỉ còn 2 loại `community` được phép:

1. Leftover URL User Web (`/cong-dong`, `/community`) — redirect trong window.
2. Community product placeholder (SoT/IA) — chưa implement.

Mọi `community` còn lại mà vẫn đại diện Tin tức → phải migrate trước commit. Admin leftover 301 = migration-only, không gọi là leftover vĩnh viễn.

---

## 3. Impact Analysis

| Feature | Owner hiện tại | Decision |
|---|---|---|
| User Web Page Tin tức | pageKey `community` | **Migrate** → `news` |
| Folder HTML | `User_Web/community/` | **Migrate** → `User_Web/news/` |
| Entity tab Tin tức | `news` | **Migrate** → `articles` (tránh va pageKey) |
| Bài lẻ runtime | `communityPost` | **Migrate** → `article` |
| Admin Tin tức URL | `/admin/news` | **Modify** (Owner mở 2026-08-20) |
| API / DB posts | `/api/community` · `community_posts` | **Migrate** → `/api/news` · `news_posts` (compat window) |
| Store | `IfluxCommunityStore` | **Migrate** → `IfluxNewsStore` |
| Widget / block id Tin tức | `BLK-COM-*` / `WGT-COM-*` | **Migrate** namespace News |
| Admin moderation bài | `/admin/community/comments` | **Migrate** → `/admin/news/…` |
| Community Layer SoT | sở hữu Post | **Modify** — Post về News Layer |

Existing: catalog, composition, boot, nginx, SEO. Why cannot modify only one file: identity nhân bản nhiều authority. Không tạo page/runtime song song.

---

## 4. HOW (modify-first)

1. Đổi authority key (catalog, composition ×2, entitlement, SEO contract, manifests).
2. Đổi detect / route / nav / auth `to('news')`.
3. `git mv User_Web/community User_Web/news` — cập nhật mọi `file:` / rewrite / lazyModule path.
4. Entity tab + default tab fallback `news` → `articles`.
5. Feed filter: `contentType` `news` **hoặc** `article` (không migrate cột).
6. Migration SQL: `page_seo_configs.page_key`, `onboarding_steps.target_key`.
7. Nginx Staging: rewrite `/User_Web/news/` · SSI `pageKey=news` · giữ 301 leftover.
8. SoT V2: News Layer sở hữu Post; Community Layer để trống cho sản phẩm sau (giữ **tên** layer).
9. API `/api/community` → `/api/news` · module folder; leftover alias trong window.
10. DB `community_posts` → `news_posts` (+ comments/RSS thuộc bài); leftover tên bảng trong window nếu cần.
11. `IfluxCommunityStore` → `IfluxNewsStore`. Widget/block id Tin tức → namespace News.
12. Admin còn `/admin/community/*` của Tin tức (kể cả kiểm duyệt bài) → `/admin/news/*`. Hết dual-read `community` → news.
13. Retire leftover `/cong-dong` `/community` theo kế hoạch sau window — không xóa string giữa chừng.

Không `display:none`. Không `v2_`. Không page song song. Không mở task Community trước PASS.

---

## 5. Verify

```text
/tin-tuc                    200 · pageKey news
/cong-dong · /community     301 /tin-tuc
Entity CP tab               key articles · nhãn Tin tức
Cài đặt Trang               key news · title Tin tức
to('news')                  /tin-tuc
BlockGate / entitlement     news
SEO page_key                news
/admin/news/*               module Tin tức (bài + RSS + kiểm duyệt bài)
/api/news                   feed bài · leftover /api/community trong window
news_posts                  bảng bài · leftover community_posts trong window
IfluxNewsStore              reader bài
community                   FREE — không dual-read về Tin tức
Production                  Owner mở push riêng
```

Rollback: `00_Restore_Baseline.md`.
