# 04 — Variable Contract Audit · Notification Platform Foundation

**Date:** 2026-07-28  
**Loại:** Architecture audit — **Variable / merge tag contract**  
**Mục đích:** Tránh loạn `{user}` · `{member}` · `{memberName}` · `{customer}` sau 5–10 năm.  
**Legacy evidence:** Catalog MERGE_TAGS (`system-notification-catalog.js`) — **migrate**, không làm authority.

---

## 1. Nguyên tắc contract

| # | Nguyên tắc |
|---|------------|
| V1 | **Canonical key** = `snake_case` tiếng Anh — một concept = **một key** |
| V2 | Mỗi **Notification Type** khai báo `variables[]` — dispatch **cấm** key ngoài schema |
| V3 | Template placeholder = `{canonical_key}` — Renderer chuẩn hóa trước khi substitute |
| V4 | **Legacy alias** (tiếng Việt catalog cũ) chỉ tồn tại trong **alias map migrate** — không thêm alias mới |
| V5 | Domain **không** tự đặt tên biến tùy ý — đăng ký trong Type registry |

---

## 2. Reserved keywords (Platform — cấm domain dùng)

| Key | Ý nghĩa | Ai inject |
|-----|---------|-----------|
| `recipient_name` | Tên hiển thị người nhận | Platform (optional auto) |
| `recipient_email` | Email người nhận | Platform (optional auto) |
| `_type_code` | Internal | Platform |
| `_channel` | Internal | Platform |

**Cấm làm variable domain:** `user`, `username`, `customer`, `memberName`, `member_name` (dùng `member` hoặc `actor` theo bảng §4).

---

## 3. Canonical vocabulary — shared cross-domain

Dùng chung nhiều Type:

| Canonical key | Ý nghĩa | Dùng khi |
|---------------|---------|----------|
| `actor` | Người **thực hiện** hành động (like, comment, follow, post) | Community · Interaction · Follow |
| `member` | Thành viên **mới / được giới thiệu** (referral target) | Affiliate only |
| `post_title` | Tiêu đề bài viết | Community · Follow |
| `comment_preview` | Preview bình luận (truncated) | Interaction |
| `entity_name` | Tên/mã thực thể (ticker, ngành…) | Follow · Watchlist · Alert |
| `entity_type` | Loại thực thể (human label Việt) | Follow · Watchlist |

**Phân biệt quan trọng:**

| Key | Không nhầm với |
|-----|----------------|
| `actor` | `member` — actor = người gây ra event; member = referral signup |
| `member` | `buyer_name` — buyer = người mua qua affiliate link |

---

## 4. Canonical vocabulary — per domain

### 4.1 Affiliate / Membership

| Canonical key | Legacy catalog tag | Ví dụ |
|---------------|-------------------|-------|
| `member` | `{Tên thành viên mới}` | Phạm Minh Tuấn |
| `commission_amount` | `{Số tiền hoa hồng}` | ₫83.000 |
| `affiliate_tier` | `{Tầng affiliate}` | F0 |
| `commission_percent` | `{Phần trăm hoa hồng}` | 10 |
| `buyer_name` | `{Tên người mua}` | Trần Thị B |
| `product_name` | `{Sản phẩm}` | Premium / 1 tháng |

### 4.2 Orders / Subscription

| Canonical key | Legacy catalog tag |
|---------------|-------------------|
| `plan_name` | `{Tên gói}` |
| `amount` | `{Số tiền}` |
| `order_id` | `{Mã đơn hàng}` |
| `transfer_ref` | `{Mã chuyển khoản}` |
| `payment_method` | `{Phương thức thanh toán}` |
| `order_status` | `{Trạng thái đơn}` |
| `rejection_reason` | `{Lý do từ chối}` |
| `expiry_date` | `{Ngày hết hạn gói}` |

### 4.3 Community / Interaction

| Canonical key | Legacy catalog tag |
|---------------|-------------------|
| `actor` | `{Tên tác giả}` · `{Tên người gửi}` · `{Tên người tương tác}` |
| `post_title` | `{Tiêu đề bài viết}` |
| `message_preview` | `{Nội dung tin nhắn}` |
| `comment_preview` | `{Nội dung bình luận}` |

### 4.4 Follow / Watchlist

| Canonical key | Legacy catalog tag |
|---------------|-------------------|
| `entity_name` | `{Tên thực thể}` · `{Mã cổ phiếu}` |
| `entity_type` | `{Loại thực thể}` |
| `actor` | `{Tên tác giả}` |

### 4.5 Alert

| Canonical key | Legacy catalog tag |
|---------------|-------------------|
| `stock_ticker` | `{Mã cổ phiếu}` |
| `alert_condition` | `{Điều kiện cảnh báo}` |

### 4.6 System broadcast

| Canonical key | Legacy catalog tag |
|---------------|-------------------|
| `broadcast_title` | `{Tiêu đề thông báo}` |
| `broadcast_body` | `{Nội dung thông báo}` |
| `maintenance_date` | `{Ngày bảo trì}` |
| `start_time` | `{Giờ bắt đầu}` |
| `end_time` | `{Giờ kết thúc}` |
| `app_version` | `{Phiên bản ứng dụng}` |

---

## 5. Alias policy

### 5.1 Giai đoạn migrate (Phase B)

Renderer **hỗ trợ đọc** legacy tag trong template DB seed từ catalog:

```text
{Tên thành viên mới}  →  alias of  member
{Tên tác giả}         →  alias of  actor
```

**Admin UI** có thể vẫn hiển thị/copy legacy tag từ panel merge — Phase B.  
**Admin save mới** khuyến nghị dùng `{member}` · `{actor}` (canonical).

### 5.2 Sau migrate (Phase C+)

| Policy | Quy tắc |
|--------|---------|
| Seed template mới | **Chỉ** canonical `{snake_case}` |
| Type registration | `variables[].key` = canonical only |
| Dispatch validation | Reject unknown keys · log warn on missing keys |
| Alias map | Read-only · không thêm alias mới without Platform review |

---

## 6. Trùng / không trùng — quyết định LOCKED

| Cặp dễ nhầm | Quyết định |
|-------------|------------|
| `user` vs `actor` vs `member` | **`actor`** = người hành động; **`member`** = referral; **cấm** `user` |
| `customer` vs `buyer_name` | Chỉ **`buyer_name`** (Orders/Affiliate commerce) |
| `username` vs `recipient_name` | **`recipient_name`** — Platform inject |
| `stock` vs `stock_ticker` vs `entity_name` | Alert: **`stock_ticker`**; Follow: **`entity_name`** (có thể cùng giá trị HPG) |
| `order` vs `order_id` | Chỉ **`order_id`** (string/display) |

---

## 7. Type → variables schema (ví dụ)

```json
{
  "code": "AFFILIATE_REFERRAL_SUCCESS",
  "variables": [
    { "key": "member", "label": "Tên thành viên mới", "required": true, "example": "Phạm Minh Tuấn" }
  ]
}
```

```json
{
  "code": "COMMUNITY_POST_FROM_FOLLOWING",
  "variables": [
    { "key": "actor", "required": true },
    { "key": "post_title", "required": true }
  ]
}
```

Admin panel **Thẻ merge** = projection của `variables[]` per Type (+ global catalog cho Admin edit comfort).

---

## 8. Validation rules (Platform render)

| Rule | Hành vi |
|------|---------|
| Unknown variable in template | Render empty string + log dev warn |
| Missing required variable at dispatch | Skip send **hoặc** fail dispatch (Owner chọn: **fail** recommended) |
| Extra variable in dispatch payload | Strip silently |
| HTML in variable value | Escape on render (XSS) |

---

## 9. Exit criteria Variable Contract Audit

- [ ] Owner LOCK canonical vocabulary §3–§4
- [ ] Owner LOCK collision decisions §6
- [ ] Alias migrate policy §5 accepted
- [ ] Seed migration plan: catalog tags → canonical in Type registry

---

*Variable Contract Audit v1 — 2026-07-28 — chờ Owner LOCK.*
