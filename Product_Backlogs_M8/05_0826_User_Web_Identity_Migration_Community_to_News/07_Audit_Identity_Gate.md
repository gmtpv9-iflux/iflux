# 07 — Audit Identity Gate (Task 05)

| Field | Value |
|---|---|
| Date | 2026-08-20 |
| Task | 05 Identity Migration `community` → `news` |
| Status | **PASS — Owner verdict 2 mục chặn đã migrate. Sẵn sàng commit.** |
| Lock | `04_Solution.md` · Owner Gate Decision (entitlement + `item.community.*`) |

```text
Không còn community là technical identity của Tin tức trong:
pageKey · route/runtime · backend module · API canonical · DB bảng bài
store · Admin module · RBAC · entitlement · registry IDs item.news.*

Chỉ còn community ở:
1. Leftover URL User Web (/cong-dong, /community) — window
2. SoT Community Layer (placeholder)
3. CSS / historical / media / notification / documentation — task riêng
```

---

## 1. Hai mục chặn commit — đã xong

| Mục | Trước | Sau | Persist |
|---|---|---|---|
| Entitlement | `communityRead` · `communityWrite` · `communityComment` | `newsRead` · `newsWrite` · `newsComment` | `plans-runtime.json` + SQL `065` |
| Registry ID | `item.community.*` | `item.news.*` | DS catalogs (items + composition refs) |

Cùng họ registry (dotted ID trong cùng catalog): `card.community.*` → `card.news.*`, `block.community.*` → `block.news.*`.

Nhãn catalog entitlement: group **Tin tức**. Không tạo `community.*` cho sản phẩm Community.

---

## 2. Identity đã migrate (tóm tắt)

| Surface | After |
|---|---|
| Backend module | `backend/src/modules/news` |
| Admin HTML | `Admin_Design_system/app/news` |
| RBAC | `news.articles.*` … · SQL `064` |
| Store | `IfluxNewsStore` · `news-store.js` |
| pageKey | `news` · `article` · `newsWrite` |
| API canonical | `/api/news` · leftover `/api/community` **window** |
| DB bài | `news_posts` · VIEW leftover **window** |
| Admin URL | `/admin/news/*` · leftover 301 **window** (retire sau Staging+Production PASS) |

---

## 3. Được phép còn lại (Owner: không chặn)

| Loại | Ví dụ |
|---|---|
| Leftover URL User Web | `/cong-dong` · `/community` 301 `/tin-tuc` · detect path → `news` |
| SoT Community Layer | Tên layer placeholder — chưa implement |
| CSS | `.ifx-com-*` · `.ifx-main--community` |
| DOM hook | `data-ifx-community-feed` |
| Notification type | `COMMUNITY_POST_FROM_FOLLOWING` · `community_message` |
| Media path | Canonical `news/yyyy/mm/` · leftover URL `/media/community/` 301 `/media/news/` |
| Comment / historical | comment JS, Product Backlogs cũ, Coverage json |
| Admin leftover 301 | `/admin/cong-dong` · `/admin/community` — **migration-only**, không leftover vĩnh viễn |

---

## 4. Verify tối thiểu (Staging khi Owner mở)

```text
/tin-tuc                    200 · pageKey news
/cong-dong · /community     301 /tin-tuc
plan.ent.newsRead           artifact + matrix
item.news.author            DS Studio items
RBAC news.articles.view     không còn community.articles
/admin/news/articles        canonical
/admin/cong-dong            301 window
Production                  không push trừ Owner mở
```

Thứ tự migrate DB: `064` (RBAC) → `065` (entitlement) → start backend.

---

## 5. Kết luận

**Gate PASS** theo Owner Decision: hai mục chặn đã migrate. CSS / notif / media / docs = task riêng.

Commit Task 05 trên branch `staging`. Không push Production.
