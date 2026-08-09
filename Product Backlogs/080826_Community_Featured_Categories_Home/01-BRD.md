# 01 — BRD · Danh mục nổi bật trên trang Cộng đồng

| | |
|--|--|
| **Task** | [`00-README.md`](00-README.md) |
| **Date** | 2026-08-08 |
| **Status** | 🔒 **BRD LOCK** — immutable backbone cho Audit / Plan / Implementation |
| **Surfaces** | User Web `/cong-dong` · Admin `/admin/cong-dong/categories` (nguồn cấu hình) |

---

## 1. Business outcome

Người dùng vào Cộng đồng thấy ngay các **danh mục chính** (Admin chọn Nổi bật), bấm để xem bài đúng danh mục; lần vào trang gốc mặc định đã là feed của danh mục Nổi bật **đầu tiên** theo thứ tự Admin — không cần tự tìm bộ lọc.

---

## 2. Owner locks (2026-08-08)

| ID | Quyết định |
|----|------------|
| OD-CFC-01 | Vị trí block: **dưới Widget host**, **trên** danh sách bài viết. |
| OD-CFC-02 | Desktop / tablet / **mobile cùng một block · cùng vị trí** — **không** đưa danh mục lên App Shell bottom menu. |
| OD-CFC-03 | UI item: **chỉ icon + tên**; không mô tả / không ảnh cover trong rail. |
| OD-CFC-04 | Nguồn: Admin **Nổi bật** (`is_featured`) + **Thứ tự** (`sort_order`). |
| OD-CFC-05 | `/cong-dong` (không slug danh mục): mặc định feed = danh mục Nổi bật **đầu** (`sort_order` ASC). |
| OD-CFC-06 | **Design System User Web = SoT giao diện duy nhất** — cấm CSS/class/JS UI thừa ngoài DS. |

---

## 3. BR Checklist (atomic — immutable)

| BR ID | Requirement | Priority |
|-------|-------------|----------|
| **BR-CFC-01** | Trang Cộng đồng hiển thị block **Danh mục chính** gồm mọi danh mục đang **Nổi bật** (Admin), theo `sort_order` tăng dần. | Must |
| **BR-CFC-02** | Mỗi mục chỉ hiện **icon** (Tabler đã cấu hình) + **tên** danh mục. | Must |
| **BR-CFC-03** | Bấm một mục → người dùng thấy **danh sách bài viết của đúng danh mục đó** (URL/route công khai tiếng Việt, nhất quán bookmark/share). | Must |
| **BR-CFC-04** | Vào `/cong-dong` không chỉ định danh mục → **tự load feed danh mục Nổi bật đầu tiên**; rail phản ánh đúng mục đang active (nếu DS có state sẵn). | Must |
| **BR-CFC-05** | Cùng composition / vị trí trên desktop, tablet và mobile. | Must |
| **BR-CFC-06** | **Không** thay thế hay nhân bản App Shell bottom navigation bằng danh mục. | Must |
| **BR-CFC-07** | UI **chỉ** dùng class / component / token Design System User Web đã có; **0** file CSS mới; **0** class ad-hoc; thiếu pattern DS → **STOP** bổ sung DS trước khi code UI. | Must |
| **BR-CFC-08** | Không hardcode danh sách tên/slug danh mục trong code — luôn đọc từ nguồn Admin/API. | Must |

---

## 4. Design System — SoT UI duy nhất

1. SoT: `User_Web/iflux-web-ui/` (`ifx-*`, block-templates, `--ifx-*`).
2. Cấm: file `.css` mới · class kiểu `.featured-cat-*` · style inline màu/spacing tùy ý · helper JS chỉ để trang trí.
3. Trước khi code UI: inventory pattern DS (chip / tab / icon+label). Không có → báo Owner mở bổ sung DS — không tự chế.
4. Diff ưu tiên: binding + markup reuse trong owner trang Cộng đồng hiện có.

---

## 5. Impact Analysis tối thiểu (CG-005 — input Plan)

```text
Feature: Featured category rail + default feed on /cong-dong
Current owner: community-page.js (+ Daily Feed filter)
Files (dự kiến modify): community-page.js · consumer listCommunityCategories
Consumers: User Web /cong-dong (+ /cong-dong/danh-muc/{slug} nếu reuse)
Storage-API: GET /api/community/categories?featured=1 (đã có) — Reuse
UI-SoT: User_Web DS — Reuse pattern | gap → STOP Create CSS/class
Decision: Reuse API + route danh-muc | Modify page bind | Không Create App Shell mode / CSS mới
```

### Neo audit hiện trạng (evidence, không phải SoT)

| Hạng mục | Hiện trạng |
|----------|------------|
| Admin Nổi bật | `is_featured` · `sort_order` · UI categories Admin |
| Public API | `GET /community/categories?featured=1` đã hỗ trợ; User Web **chưa** gọi featured |
| Route filter | `/cong-dong/danh-muc/{slug}` đã có |
| Bottom tabbar | `IfluxNavRegistry` + `initMobileTabbar` — **ngoài scope** |

---

## 6. Acceptance (đóng BR — khi Implementation)

| # | Tiêu chí | BR |
|---|----------|-----|
| A1 | Admin bật/tắt Nổi bật + đổi thứ tự → rail User Web khớp | BR-CFC-01, 08 |
| A2 | `/cong-dong` = feed featured đầu; rail active khớp (nếu DS hỗ trợ) | BR-CFC-04 |
| A3 | Click mục → feed đúng danh mục + URL VN ổn định | BR-CFC-03 |
| A4 | Mobile / tablet / desktop cùng vị trí dưới Widget host | BR-CFC-05 |
| A5 | Bottom tabbar primary không đổi | BR-CFC-06 |
| A6 | Diff: 0 CSS mới · 0 class ngoài DS · không helper chết | BR-CFC-07 |

---

## 7. Non-goals

- Bottom menu Cộng đồng riêng / thay 5 tab primary bằng danh mục.
- Redesign toàn bộ Community feed / Widget Catalog.
- Backfill hoặc đổi schema Admin categories (đã đủ field).

---

## 8. Done khi

```text
BR Checklist §3 còn đủ hàng
+ Plan/Implementation map từng BR-CFC-*
+ A1–A6 PASS trên Production
+ Không vi phạm OD-CFC-06 (DS SoT)
```
