# 01 — Solution · Community Media Library — External Image Import Pipeline

**Version:** 1.0  
**Date:** 2026-07-28  
**Status:** Proposed → Ready for Review  
**SoT:** [`02-SoT.md`](02-SoT.md) — Proposed (Owner 2026-07-28)  
**README:** [`00-README.md`](00-README.md)

---

# 1. Mục tiêu

Xây dựng **Media Import Pipeline** cho Community nhằm chuyển toàn bộ hình ảnh bên ngoài (RSS, Website, AI...) thành tài sản (Asset) thuộc iFlux.

Sau khi hoàn thành:

* Không còn phụ thuộc hotlink tới website khác.
* Toàn bộ bài viết sử dụng media nội bộ.
* Media được quản lý tập trung.
* Có khả năng tái sử dụng, audit và tối ưu SEO.

---

# 2. Phạm vi

Module:

```text
Quản lý cộng đồng
    └── Bài viết
            └── Sửa bài viết

Quản lý cộng đồng
    └── Thư viện Media
```

Nguồn ảnh hỗ trợ:

* RSS
* HTML Import
* AI Generated HTML
* Paste HTML

Không áp dụng cho upload thủ công (đã có flow riêng).

---

# 3. Mục tiêu UX

Editor không cần:

* mở HTML
* copy link
* download ảnh
* upload ảnh
* replace thủ công

Editor chỉ thực hiện đúng **một thao tác**.

```text
Mở bài viết

↓

Nhấn

Import hình ảnh

↓

Hoàn tất
```

---

# 4. Luồng nghiệp vụ

## Bước 1

Editor mở trang sửa bài viết.

Hệ thống đọc HTML hiện tại.

↓

Quét toàn bộ

```html
<img src="">
```

↓

Thống kê

```text
Có 18 hình ảnh

18 hình ngoài

0 hình nội bộ
```

---

## Bước 2

Editor bấm

```text
Import hình ảnh
```

Pipeline bắt đầu.

---

## Bước 3

Hệ thống tự động

```text
Scan HTML

↓

Lấy toàn bộ src

↓

Download

↓

Validate

↓

Optimize

↓

Deduplicate

↓

Lưu Media Library

↓

Replace HTML

↓

Lưu lại nội dung bài viết

↓

Refresh Preview
```

Không có bất kỳ thao tác thủ công nào.

---

# 5. Media Import Pipeline

Pipeline chuẩn của hệ thống

```text
Article HTML

↓

Image Scanner

↓

Image Downloader

↓

Image Validator

↓

Image Optimizer

↓

Media Deduplicator

↓

Media Storage

↓

HTML Replacer

↓

Article Update
```

Mỗi bước chỉ chịu trách nhiệm duy nhất một việc.

---

# 6. Image Scanner

**Input**

```text
Article HTML
```

**Nhiệm vụ**

* Parse HTML
* Tìm tất cả thẻ img
* Đọc thuộc tính src
* Bỏ qua ảnh đã thuộc domain iFlux

**Output**

```text
Danh sách ảnh ngoài
```

Không download.

Không sửa HTML.

---

# 7. Image Downloader

Download từng ảnh.

**Yêu cầu**

* timeout
* retry
* giới hạn dung lượng
* kiểm tra mime type
* kiểm tra response

Nếu lỗi

```text
404

403

Timeout

Unsupported
```

Pipeline ghi log và chuyển sang ảnh tiếp theo.

Không dừng toàn bộ pipeline.

---

# 8. Image Optimizer

Sau khi download thành công

Pipeline thực hiện

```text
Đọc metadata

↓

Resize nếu vượt giới hạn

↓

Convert WebP

↓

Compress

↓

Sinh thumbnail

↓

Lưu metadata
```

Định dạng chuẩn sau cùng

```text
WebP
```

Không lưu định dạng gốc.

---

# 9. Deduplicate

Sau khi optimize

Sinh checksum (SHA-256).

Nếu checksum đã tồn tại

↓

Không tạo file mới.

↓

Tái sử dụng Media Asset hiện có.

**Mục tiêu**

* tiết kiệm dung lượng
* tránh trùng ảnh
* giảm backup

---

# 10. Media Storage

Media chỉ có một nơi lưu duy nhất.

```text
/media/community/

YYYY/

MM/

filename.webp
```

Ví dụ

```text
/media/community/

2026/

07/

co-phieu-vic-vuot-dinh-001.webp
```

Không lưu lẫn với upload khác.

---

# 11. Quy tắc đặt tên file

## Nguyên tắc

Tên file phải

* thân thiện SEO
* dễ đọc
* dễ tìm
* ổn định
* không phụ thuộc URL nguồn

**Quy tắc**

```text
{article-slug}-{index}.webp
```

Ví dụ

```text
co-phieu-vic-vuot-dinh-001.webp

co-phieu-vic-vuot-dinh-002.webp

co-phieu-vic-vuot-dinh-003.webp
```

Trong đó

* article-slug lấy từ slug bài viết
* index đánh số theo thứ tự xuất hiện trong HTML (001, 002, 003...)

Sau khi tên được cấp phát, tên file không thay đổi.

---

# 12. HTML Replacement

Sau khi Media Library trả về URL mới

Ví dụ

```text
https://abc.com/image.jpg
```

↓

```text
https://cdn.iflux.vn/media/community/2026/07/co-phieu-vic-vuot-dinh-001.webp
```

Pipeline thay toàn bộ HTML.

Sau bước này

HTML không còn bất kỳ ảnh ngoài nào.

---

# 13. Media Library

Mỗi Media Asset lưu

| Trường       | Mô tả                     |
| ------------ | ------------------------- |
| ID           | Khóa chính                |
| File Name    | Tên file SEO              |
| Storage Path | Đường dẫn vật lý          |
| Public URL   | URL truy cập              |
| Width        | Chiều rộng                |
| Height       | Chiều cao                 |
| File Size    | Dung lượng                |
| MIME Type    | webp                      |
| SHA-256      | chống trùng               |
| Source URL   | URL ảnh gốc               |
| Article ID   | Bài viết đầu tiên sử dụng |
| Created By   | Người import              |
| Created At   | Thời gian                 |
| Status       | Active / Deleted          |

---

# 14. Giao diện Editor

Trong trang sửa bài viết

```text
────────────────────────

Hình ảnh

18 hình phát hiện

18 hình ngoài

0 hình nội bộ

[ Import hình ảnh ]

────────────────────────
```

Sau khi hoàn tất

```text
────────────────────────

Hình ảnh

18 hình phát hiện

18 hình nội bộ

Import thành công

────────────────────────
```

Không có nút

* Save Image
* Replace Image

Toàn bộ được thực hiện trong một lần.

---

# 15. Giao diện Media Library

Danh sách

| Thumbnail | Tên file | Kích thước | Resolution | Nguồn | Bài viết | Ngày tạo |
| --------- | -------- | ---------- | ---------- | ----- | -------- | -------- |

Tìm kiếm theo

* tên file
* slug
* bài viết
* nguồn
* ngày tạo

---

# 16. Logging

Pipeline ghi log toàn bộ

Ví dụ

```text
Scan

↓

18 ảnh

↓

Download

18 thành công

↓

Optimize

18 thành công

↓

Deduplicate

2 ảnh tái sử dụng

↓

Replace

18 ảnh

↓

Done
```

Nếu lỗi

```text
Ảnh số 7

Download Failed

Reason

403 Forbidden
```

Không ảnh hưởng các ảnh khác.

---

# 17. Source of Truth

| Thành phần   | Owner            |
| ------------ | ---------------- |
| HTML Scan    | Image Scanner    |
| Download     | Image Downloader |
| Optimize     | Image Optimizer  |
| Deduplicate  | Media Service    |
| File Naming  | Media Service    |
| Storage      | Media Library    |
| HTML Replace | HTML Replacer    |

Mỗi capability chỉ có một owner, tuân thủ nguyên tắc Single Ownership.

---

# 18. Tiêu chí hoàn thành (Definition of Done)

* Phát hiện 100% ảnh ngoài trong HTML.
* Import toàn bộ chỉ với một thao tác.
* Chuyển toàn bộ ảnh sang WebP.
* Lưu toàn bộ ảnh vào Media Library.
* Không tạo bản sao nếu ảnh đã tồn tại.
* Thay thế 100% URL ngoài bằng URL nội bộ.
* HTML sau khi xử lý không còn tham chiếu tới domain ngoài.
* Tên file tuân thủ quy tắc SEO `{article-slug}-{index}.webp`.
* Toàn bộ quá trình được ghi log và có thể audit.

---

## Bước tiếp theo (governance)

1. Owner **LOCK** [`02-SoT.md`](02-SoT.md) (nếu cần chỉnh)
2. **Impact Analysis** — đối chiếu Admin sửa bài · RSS · storage hiện trạng
3. **Owner Decisions** → Plan / Roadmap → Implementation
