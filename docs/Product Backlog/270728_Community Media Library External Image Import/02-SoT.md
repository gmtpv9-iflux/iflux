# 02 — SoT · Community Media Asset Management

**Date:** 2026-07-28  
**Status:** **Proposed — Owner 2026-07-28**  
**Solution:** [`01-Solution.md`](01-Solution.md)  
**README:** [`00-README.md`](00-README.md)

---

## 0. Nguyên tắc gốc (LOCKED intent — chi phối mọi quyết định sau)

> **Mọi hình ảnh được sử dụng trong Community đều phải trở thành Media Asset do iFlux sở hữu trước khi được phép xuất hiện trong bài viết đã lưu hoặc đã publish.**

Hệ quả:

* RSS · AI · HTML Import · upload thủ công · mọi nguồn khác **hội tụ** về một Source of Truth duy nhất: **Media Library**.
* Thiết kế theo hướng CMS hiện đại: nhất quán · audit · mở rộng · không hotlink runtime.

---

## 1. Mục đích

Định nghĩa nguồn dữ liệu chuẩn (Source of Truth) cho toàn bộ hình ảnh được sử dụng trong Module **Quản lý cộng đồng**.

Mọi hình ảnh xuất hiện trong bài viết đều phải được quản lý thông qua **Media Library**.

---

## 2. SoT rules

### SoT-001 — Media Library là Source of Truth duy nhất

Mọi hình ảnh thuộc Community chỉ được xem là **hợp lệ** khi tồn tại trong Media Library.

**Không cho phép** bài viết phụ thuộc trực tiếp vào:

* RSS Image URL
* Website bên ngoài
* CDN bên ngoài
* Hotlink

Sau khi import hoàn tất, bài viết **chỉ** tham chiếu tới Media Asset nội bộ.

---

### SoT-002 — Article chỉ lưu Media URL

Article HTML chỉ lưu:

```html
<img src="/media/community/2026/07/co-phieu-vic-vuot-dinh-001.webp">
```

**Không lưu:**

```html
<img src="https://cafefcdn.com/...">
```

RSS URL chỉ tồn tại trong **metadata** của Media Asset để phục vụ audit.

---

### SoT-003 — Media Asset là thực thể độc lập

Media Asset **không** thuộc sở hữu của Article.

Quan hệ đúng:

```text
Article
    ↓ references
Media Asset
```

**Không phải:**

```text
Article
    ↓ contains
Image
```

Cho phép:

* nhiều bài dùng chung một ảnh
* thay đổi metadata ảnh mà không sửa bài viết
* mở rộng tái sử dụng sau này

---

### SoT-004 — Media Library quản lý toàn bộ vòng đời

Media Library là **owner** của:

* lưu file
* tên file
* đường dẫn
* checksum
* thumbnail
* metadata
* source URL
* mime
* kích thước
* trạng thái

Các module khác **không được** tự ghi file trực tiếp.

---

### SoT-005 — Import Pipeline là đường duy nhất đưa ảnh vào hệ thống

**Không** module nào được phép:

```text
download → ghi file → replace HTML
```

(tách rời, bypass pipeline)

Pipeline chuẩn **luôn** là:

```text
HTML
    ↓
Image Scanner
    ↓
Downloader
    ↓
Optimizer
    ↓
Deduplicator
    ↓
Media Library
    ↓
HTML Replace
```

Mọi nguồn (RSS, AI, HTML Import…) đi qua **cùng một** quy trình.

---

### SoT-006 — Media Service là Owner duy nhất của File Naming

Tên file **chỉ** được sinh bởi **Media Service**.

**Không cho phép:**

* RSS quyết định tên
* Editor nhập tên
* Frontend tự đặt tên

Rule duy nhất:

```text
{article-slug}-{index}.webp
```

---

### SoT-007 — Deduplication dựa trên nội dung

Một Media Asset được định danh bằng **checksum** (SHA-256 nội dung file), **không phải** URL nguồn hay tên file.

Nếu hai URL khác nhau nhưng nội dung giống nhau → **một** Media Asset.

---

### SoT-008 — Source URL chỉ phục vụ truy vết

Source URL **không phải** dữ liệu runtime.

Chỉ dùng cho:

* audit
* trace nguồn
* debug
* kiểm tra bản quyền

Article **không** đọc Source URL để hiển thị.

---

### SoT-009 — Editor không thao tác trên HTML

Editor **không** thực hiện:

* tìm `<img>`
* sửa `src`
* replace URL

Editor **chỉ** kích hoạt capability:

```text
Import hình ảnh
```

Toàn bộ xử lý còn lại thuộc **Media Import Pipeline**.

---

### SoT-010 — Runtime chỉ đọc Media URL

Frontend chỉ render **Media URL**.

Frontend **không**:

* download lại ảnh
* convert
* resize
* tối ưu
* đổi URL

Mọi xử lý xảy ra **trước** khi bài viết được publish.

---

## 3. Sơ đồ SoT

```text
                RSS / AI / HTML Import
                         │
                         ▼
               Media Import Pipeline
                         │
      ┌──────────────────┼──────────────────┐
      ▼                  ▼                  ▼
 Image Scanner     Optimizer        Deduplicator
                         │
                         ▼
                 Media Library (SoT)
                         │
             sinh URL nội bộ duy nhất
                         │
                         ▼
                  Article HTML
                         │
                         ▼
                 Community Runtime
```

---

## 4. Tóm tắt Owner

| Capability        | Source of Truth / Owner                     |
| ----------------- | ------------------------------------------- |
| Danh mục media    | **Media Library**                           |
| File vật lý       | **Media Storage**                           |
| Metadata ảnh      | **Media Library**                           |
| Tên file          | **Media Service**                           |
| URL hiển thị      | **Media Library**                           |
| Source URL        | **Media Library**                           |
| Deduplication     | **Media Service**                           |
| Replace HTML      | **Media Import Pipeline**                   |
| Hiển thị bài viết | **Article HTML** (chỉ tham chiếu Media URL) |

---

## 5. Liên kết Solution

| SoT | Solution § |
|-----|------------|
| SoT-001 … SoT-010 | [`01-Solution.md`](01-Solution.md) §5–§17 |
| Pipeline steps | Solution §5, §6–§12 |
| Media Asset schema | Solution §13 |
| Editor UX | Solution §14 |
| DoD | Solution §18 |

---

## 6. Bước tiếp theo (governance)

1. **Impact Analysis** — đối chiếu Admin sửa bài · RSS · storage hiện trạng
2. **Owner Decisions** — upload thủ công hội tụ SoT-005 (ngoài phạm vi v1 Solution) · CDN path · publish gate
3. **Plan / Roadmap** — sau Owner chốt

**Chưa mở implementation** cho đến khi Impact + Owner Decisions đóng.
