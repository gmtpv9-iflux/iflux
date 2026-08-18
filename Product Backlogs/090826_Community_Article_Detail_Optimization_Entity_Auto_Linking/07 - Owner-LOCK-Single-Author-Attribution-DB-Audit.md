# Owner LOCK + DB Audit — Single Author Attribution SoT

**Date:** 2026-08-10  
**Status:** 🔒 OWNER REQUEST LOCKED · Audit DB only · **chưa tái cấu trúc / chưa code**

---

## 1. Khóa yêu cầu (Owner SoT)

### 1.1 Một nguồn duy nhất toàn hệ thống

Đối tượng **người/nguồn hiển thị của bài viết** (Admin list, User Web byline, SEO `{Tên tác giả}`, authors index):

| Field (duy nhất) | Ý nghĩa |
|------------------|---------|
| **`id` / `username`** | Một định danh |
| **`display_name`** | Một tên hiển thị |

- Database / payload bài viết chỉ có **một** chỗ mang hai field này cho đối tượng đó.
- **Cấm** song song: `vendor.name`, `publisher.name`, `provider.name`, `source_name`, `tier_label`… dùng như “tên tác giả / nguồn hiển thị” thay thế hoặc cạnh tranh.
- Admin · User Web · API · SEO **chỉ đọc** hai field trên từ DB (qua `payload.author` hoặc cột chuẩn hóa sau tái cấu trúc — một SoT).

### 1.2 Hai trạng thái nghiệp vụ

#### A. Trạng thái **Xuất bản RSS** (`published_rss`) — chưa Admin sửa xong

| Field | Giá trị cho phép |
|-------|------------------|
| `id` / `username` | `cafef` \| `baodautu` \| `vietstock` |
| `display_name` | **CafeF** \| **Báo Đầu Tư** \| **VietStock** (đúng 3 — map 1–1 với id) |

#### B. Trạng thái **Xuất bản** (`published`) — Admin/Sub đã chỉnh và xuất bản

| Field | Giá trị |
|-------|---------|
| `id` / `username` | id/username của Admin hoặc Sub-admin đang lưu |
| `display_name` | display_name của Admin/Sub đó (vd. Bảo Long) |

### 1.3 Xóa VCCorp.vn

- **VCCorp.vn không phải nguồn RSS sản phẩm.**
- Cấm tồn tại như `display_name` / author / vendor-as-author trên toàn hệ thống (DB + API + UI).
- Chỉ còn 3 `display_name` RSS: CafeF · Báo Đầu Tư · VietStock.

### 1.4 Phạm vi

Áp dụng **toàn hệ thống** cho attribution bài viết Community: ingest · Admin list/edit · User Web detail/feed · `/community/authors` · SEO `com-author`.

**Chưa chốt trong LOCK này (cần Owner khi mở thi công):** schema cụ thể (giữ JSON `payload.author` vs cột riêng), nhãn chính tả “Báo Đầu Tư” vs “Báo đầu tư”, backfill batch.

---

## 2. Agent hiểu đúng?

| # | Hiểu | Khớp Owner? |
|---|------|-------------|
| 1 | Một cặp `id` + `display_name` duy nhất cho attribution bài | ✓ |
| 2 | RSS live → id = provider code, name = 3 brand cố định | ✓ |
| 3 | Admin publish → id + name = nhân sự Admin/Sub | ✓ |
| 4 | Xóa VCCorp khỏi hệ thống | ✓ |
| 5 | UI không suy diễn từ nguồn khác ngoài SoT đó | ✓ |

---

## 3. Audit Database (Production) — trước tái cấu trúc

### 3.1 Bảng liên quan (inventory)

| Bảng | Liên quan attribution bài? | Ghi chú |
|------|---------------------------|---------|
| **`community_posts`** | **CHÍNH (User Web / Admin bài viết hiện tại)** | Attribution trong `payload` JSONB |
| **`content_articles`** | **CÓ — kho RSS/normalize song song** | Cột SQL `author_name` + `source_id` + `raw_payload` (~3244 rows) — **nguồn thứ hai** cần gom hoặc deprecate khi tái cấu trúc |
| `community_rss_providers` | Catalog nguồn | `id` + `name` (cấu hình provider) |
| `admin_accounts` | Identity Admin/Sub khi publish | Nguồn `id` / `display_name` sau khi `published` |

**Kết luận bảng:** SoT attribution bài viết hiện **gom trong `community_posts.payload`**, không có bảng `authors` riêng. `/community/authors` = **aggregate** `GROUP BY payload->'author'`.

### 3.2 Cột `community_posts`

| Column | Role |
|--------|------|
| `id`, `user_id`, `content_type`, `status` | Identity / lifecycle |
| **`payload` JSONB** | **Toàn bộ author + RSS provenance** |
| `media_*` | Media pipeline |

Không có cột SQL riêng `author_id` / `display_name`.

### 3.3 Field trong `payload` đang **cùng nói về “ai / nguồn”** (xung đột SoT)

| Field path | ~Số bài có key | Vai trò hiện tại | Xung đột với SoT mới? |
|------------|---------------:|------------------|----------------------|
| **`author.id`** | 3153 | Author id (`rss:cafef`, `admin`, `rss-author`…) | **SoT đích** (cần chuẩn hóa giá trị) |
| **`author.display_name`** | 3153 | Tên hiển thị (VCCorp.vn, Admin, byline…) | **SoT đích** (cần chuẩn hóa) |
| `author.tier` | 3153 | `rss` / `admin` | Phụ — không thay display_name |
| `author.tier_label` | 3153 | Chip (CafeF, Admin…) | **Cạnh tranh hiển thị** với display_name |
| **`source_id`** | 3255 | `cafef` / `vietstock` | Trùng ý với author.id RSS (Owner muốn id = cafef…) |
| **`source_name`** | 3255 | CafeF / VietStock | Trùng ý với display_name RSS |
| `from_rss` / `origin` / `external_url` / `rss_mapping_id` / `source` | ~3255 | Provenance kỹ thuật | Không phải display_name — có thể giữ kỹ thuật nếu không dùng làm byline |
| **`publisher.name`** | 319 | CafeF… | **Song song attribution** |
| **`provider.name`** | 319 | CafeF… | **Song song** |
| **`vendor.name`** | 286 | **VCCorp.vn** | **Cấm theo LOCK** |

### 3.4 VCCorp.vn trên Production (đếm)

| Vị trí | Count |
|--------|------:|
| `author.display_name` ILIKE vccorp | **2600** |
| `vendor.name` ILIKE vccorp | **286** |
| Toàn `payload` text chứa vccorp | **2886** |

### 3.5 Phân bố author hiện tại (top)

| author.id | display_name | status | count |
|-----------|--------------|--------|------:|
| `rss:cafef` | **VCCorp.vn** | published_rss | **2551** |
| `rss:cafef` | VCCorp.vn | published | 49 |
| `rss:cafef` | CafeF | published_rss | 4 |
| `admin` | Admin | published_rss / published | ~182 |
| `rss:vietstock` | (nhiều byline người / phòng ban) | published_rss | hàng trăm |
| `(null)` | — | published_rss | ~104 |

**`source_id`:** chủ yếu `cafef` + `vietstock`. **Chưa thấy `baodautu`** trong đếm Production hiện tại (provider có trong catalog code — có thể chưa ingest hoặc ít).

### 3.6 Lệch so với LOCK

| Owner LOCK | Hiện trạng DB |
|------------|---------------|
| id RSS = `cafef` (không `rss:cafef`) | Đa số `author.id = rss:cafef` |
| display_name RSS ∈ {CafeF, Báo Đầu Tư, VietStock} | CafeF: hầu hết **VCCorp.vn**; VietStock: byline người/phòng ban |
| published → Admin id + tên NV | Nhiều `published` vẫn `rss:cafef` + VCCorp; một phần `admin`/`Admin` |
| Một nguồn field | Nhiều: author + source_* + publisher + provider + vendor + tier_label |

---

## 4. Hệ quả cho tái cấu trúc (chưa làm)

Cần plan migrate (khi Owner mở):

1. Chuẩn hóa `payload.author` theo LOCK (RSS 3 provider / Admin publish).  
2. Xóa / ngừng đọc `vendor` (và không dùng publisher/provider/source_name làm byline).  
3. Backfill ~2600 VCCorp → CafeF + id `cafef`.  
4. VietStock byline → `vietstock` + display_name `VietStock` (khi `published_rss`).  
5. UI/API/SEO chỉ bind `author.id` + `author.display_name`.  
6. Quyết định: giữ `source_id` kỹ thuật trùng `cafef` hay gộp vào `author.id` duy nhất.

---

## 5. Chờ Owner

LOCK §1 đã ghi nhận.  
Audit §3 xong — **sẵn sàng** khi Owner mở Solution/Plan tái cấu trúc + chốt các điểm còn mở (§1.4).
