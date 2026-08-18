# 00 — README · Danh mục nổi bật trên trang Cộng đồng

| | |
|--|--|
| **Task ID** | `080826_Community_Featured_Categories_Home` |
| **Status** | 📝 **BRD sẵn sàng** — chờ Owner mở Audit / Plan thi công |
| **BRD** | [`01-BRD.md`](01-BRD.md) |
| **Governance** | [`Product Backlogs/README.md`](../README.md) · Engineering Change · UR-001 · Design System User Web |

## Mục tiêu

Trên User Web `/cong-dong`: hiển thị **Danh mục chính** (các danh mục Admin đánh dấu **Nổi bật**) ngay dưới Widget host / trên danh sách bài viết; mặc định load feed danh mục Nổi bật đầu theo `sort_order`. Cùng vị trí desktop · tablet · mobile.

## Phạm vi khóa (Owner)

| Trong | Ngoài |
|-------|--------|
| Rail icon + tên · nguồn `is_featured` + `sort_order` | Thay App Shell bottom tabbar |
| Default feed = featured đầu · route `/cong-dong/danh-muc/{slug}` | Mode / manager shell mới |
| Design System User Web = SoT UI duy nhất | File CSS mới · class ad-hoc · hardcode danh mục |

## Tài liệu

| # | File | Status |
|---|------|--------|
| 00 | README | ✅ |
| 01 | [`01-BRD.md`](01-BRD.md) | ✅ — đủ để mở Plan xử lý |

## Thứ tự sau BRD

```text
01 BRD (khóa)
 → 02 Audit (khi Owner mở)
 → SoT / Solution / Plan / Implementation
```

**Không code** trước Impact Analysis trong Plan + Owner GO thi công.
