# 05_Plan — Identity Migration `community` → `news` (toàn hệ thống)

| Field | Value |
|---|---|
| Date | 2026-08-20 |
| Status | **OWNER LOCKED — Plan** |
| Restore | Staging `373e821` · Production không đụng |
| Lock | `04_Solution.md` §2 — không A/B; Community mới chỉ sau PASS |

```text
Hiện tại     community = Tin tức (legacy)
Task này     community → news  (toàn hệ thống)
PASS         news = Tin tức · community = FREE
Sau PASS     mới được mở task sản phẩm Community
```

Collision = inventory migrate. Không dừng vì collision.

## P0 — Recovery

`00_Restore_Baseline.md` khóa SHA.

## P1 — SoT + authority key

SoT V2: Post → News Layer. Community Layer **giữ tên**, để trống.  
Catalog / composition / entitlement / SEO / manifests: `community` → `news`.

## P2 — Runtime detect / route / auth / nav

`to('news')`. Detect `/tin-tuc` → `news`. Trong window: leftover path vẫn resolve Tin tức. **PASS:** hết dual-read `community` → `news`.

## P3 — Folder User Web

`User_Web/community/` → `User_Web/news/`. Nginx + path-base + slugs. Leftover physical 301 trong window.

## P4 — Entity tab + article runtime

Tab `news` → `articles`. `communityPost` → `article`. Dual-read content_type trong window.

## P5 — SQL persist page identity

`page_seo_configs` · `onboarding_steps`.

## P6 — Admin URL module Tin tức

Canonical `/admin/news/*` (bài, RSS, kiểm duyệt bài).

`/admin/cong-dong` · `/admin/community/*` = **migration window rất ngắn** (tránh gãy link nội bộ). **Không** gọi leftover Admin là leftover vĩnh viễn. Sau Staging PASS + Production PASS → retire hoàn toàn.

Audit URL Admin VI còn lại (`tong-quan`, `khach-hang`, …) = `06_Audit_Admin_URL_Architecture.md` — **không** gộp vào PASS identity này.

## P7 — API

`/api/community` → `/api/news`. Module `backend/.../community/` → news. Compat alias trong window.

## P8 — DB

`community_posts` → `news_posts` (+ bảng comments/RSS thuộc bài). Compat trong window.

## P9 — Store + widget namespace

`IfluxCommunityStore` → `IfluxNewsStore`. `BLK-COM-*` / `WGT-COM-*` / `ALG-COM-*` của Tin tức → namespace News.

## P10 — Gate identity + PASS

**Gate cuối trước commit:** không còn technical identity `community` = Tin tức.

Được phép còn lại:

1. Leftover URL User Web `/cong-dong` · `/community` (redirect window).
2. Community product placeholder (SoT/IA), chưa implement.

Admin leftover 301 retire sau Staging PASS + Production PASS — không giữ lâu dài.

**Không** mở task Community trước P10 PASS.  
**Không** commit cho đến khi `07_Audit_Identity_Gate.md` PASS.  
**Không** Production trừ Owner mở push.  
**Không** gộp Wave 1 `community.news[]` / `block_news`.

---

## Đã làm (2026-08-20, chưa commit / chưa push)

- P0–P9 page / folder User Web / Admin URL `/admin/news/*` / API / DB / store / widget id.
- P10 `to('community')` không alias Tin tức. User Web leftover `/cong-dong` 301 `/tin-tuc`.

## Gate-blocking (phải xong trước commit)

- `git mv` `backend/src/modules/community` → `news`. **Xong.**
- `git mv` `Admin_Design_system/app/community` → `app/news`. **Xong.**
- Đổi tên `community-*.js` của Tin tức. **Xong.**
- RBAC Tin tức `community.*` → `news.*` (không tạo `community.*` cho sản phẩm Community). **Xong** · SQL `064`.
- `07_Audit_Identity_Gate.md` — **PASS** (entitlement `newsRead`/`newsWrite` · `item.news.*`). Sẵn sàng commit.
