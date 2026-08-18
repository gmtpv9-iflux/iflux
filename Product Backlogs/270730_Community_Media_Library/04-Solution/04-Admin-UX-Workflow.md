# 04 — Editor Workflow (Admin UX)  
## Nội địa hóa hình ảnh · một nút · không đụng HTML

| | |
|--|--|
| **Document ID** | SOL-COM-MEDIA-04 |
| **Version** | 1.1 |
| **Status** | 🟡 Draft → Owner Review |
| **Date** | 2026-07-30 |
| **Audience** | Product Owner · Editor UX |
| **System Workflow (Dev)** | [`02-Media-Import-Pipeline.md`](02-Media-Import-Pipeline.md) |

> **File này = Workflow 1 — Editor.**  
> Mô tả thao tác nghiệp vụ. Editor **không** làm việc với HTML · không biết download / optimize / AVIF / WebP / replace.  
> Toàn bộ kỹ thuật chạy phía sau → **Workflow 2** = file `02`.

---

# 0. Mong muốn nghiệp vụ (LOCKED intent UX)

```text
RSS
  ↓
Tự động tạo bài viết (hotlink ảnh ngoài — MVP)
  ↓
Editor mở bài để sửa
  ↓
Nhấn MỘT nút nghiệp vụ
  ↓
Hệ thống (ẩn): scan → download → Library → Variant → replace URL → lưu bài
  ↓
Editor tiếp tục biên tập
  ↓
Publish
```

**Đúng:** `1 Click → Done`  
**Sai:** Copy HTML → Replace tay → Save · hoặc 2 nút “Lưu ảnh” rồi “Replace”.

---

# 1. Ngôn ngữ nút (Business)

| Không dùng (implementation) | Dùng (nghiệp vụ) |
|----------------------------|------------------|
| Lưu hình ảnh | |
| Replace hình ảnh | |
| Download / WebP / Optimize | |
| | **Nhập vào Thư viện** |
| | hoặc **Nội địa hóa hình ảnh** |

**Đề xuất nhãn MVP (chốt Owner):** **「Nhập vào Thư viện」**  
Tooltip: “Tải toàn bộ ảnh ngoài vào Thư viện media và cập nhật bài viết — một thao tác.”

Một nút · một workflow · pipeline phía sau.

---

# 2. Editor Workflow (sequence đầy đủ)

```text
Danh sách bài viết
        ↓
Sửa bài viết
        ↓
Bài từ RSS / có ảnh ngoài?
        ↓
   ┌──── YES ────────────────────────────┐
   │  Banner cảnh báo                     │
   │  “Có 18 hình ảnh ngoài”              │
   │  [Nhập vào Thư viện]                 │
   │                                      │
   │  Góc phải (trạng thái ảnh):          │
   │  ⚠ Ảnh · 18 ảnh ngoài                │
   └────────────┬─────────────────────────┘
                ↓
        Editor bấm [Nhập vào Thư viện]
                ↓
        Progress
          18 / 18
          (hệ thống: reuse + import mới — Editor không cấu hình)
                ↓
        Done
                ↓
        “Đã xử lý 18 ảnh (13 mới, 5 tái sử dụng)”
        HTML / cover / SEO image đã cập nhật (tự động)
                ↓
        Trạng thái:
        ✓ Ảnh · Đã nội địa hóa
                ↓
        Editor tiếp tục chỉnh sửa nội dung
                ↓
        Publish
```

Khi **không** còn ảnh ngoài:

```text
Banner ẩn
Trạng thái: ✓ Ảnh · Đã nội địa hóa
Nút [Nhập vào Thư viện] vẫn có (idempotent → “Không còn ảnh ngoài”)
```

---

# 3. Trạng thái ảnh trên Editor (góc phải / status chip)

| Trạng thái | Hiển thị | Khi nào |
|------------|----------|---------|
| **Cần nội địa hóa** | `⚠ Ảnh · N ảnh ngoài` | Scan thấy External Image trong scope (body · cover · seo) |
| **Đang xử lý** | `⏳ Ảnh · Đang nhập… k/N` | Job Import chạy |
| **Đã nội địa hóa** | `✓ Ảnh · Đã nội địa hóa` | 0 External Image trong scope |
| **Một phần** | `⚠ Ảnh · N lỗi` | Partial — còn URL lỗi |

Editor nhìn một phát biết — không cần mở HTML.

---

# 4. Banner (khi còn ảnh ngoài)

```text
┌──────────────────────────────────────────────────────────┐
│ Có 18 hình ảnh ngoài · Chưa thuộc Thư viện media         │
│ [Nhập vào Thư viện]                                      │
└──────────────────────────────────────────────────────────┘
```

* Hiện khi mở bài / sau khi nội dung đổi và scan nhẹ phát hiện external.  
* Ẩn khi đã nội địa hóa hết.  
* Không chặn biên tập chữ — chỉ chặn **Publish** nếu còn external (Publish Contract).

---

# 5. Progress & kết quả (một panel)

Trong lúc chạy — Editor chỉ thấy:

```text
Đang nhập vào Thư viện…
████████░░  12 / 18
```

Khi xong — **succeeded**:

```text
Đã xử lý 18 ảnh
(13 mới · 5 tái sử dụng)
```

Khi **partial**:

```text
Đã xử lý 15 / 18 ảnh
(12 mới · 3 tái sử dụng · 3 lỗi)
[Thử lại ảnh lỗi]   [Xem chi tiết]
```

Editor **không** thấy: Scanner · Downloader · Variant · fingerprint · path file.

---

# 6. Sau Import — tiếp tục biên tập

* Preview body / cover đã dùng Media URL.  
* Có thể sửa chữ · Alt trên ảnh (nếu UI TipTap hỗ trợ) · metadata cover.  
* Có thể [Chèn từ Thư viện] / [Tải ảnh lên] cho ảnh mới (cũng vào Library).  
* Publish khi status `✓ Đã nội địa hóa` (+ Alt đủ).

---

# 7. Publish (Editor)

```text
[Xuất bản]
    ↓
Còn ảnh ngoài? ── YES → FAIL
    “Không xuất bản được: còn N ảnh ngoài.”
    [Nhập vào Thư viện]
    ↓ NO
Thiếu Alt? ── YES → FAIL + hướng dẫn
    ↓ NO
PASS → published
```

---

# 8. Bổ sung UX (không phá flow chính)

| Hành động | Vai trò |
|-----------|---------|
| **Chèn từ Thư viện** | Reuse Asset đã có — không phải bước bắt buộc của RSS |
| **Tải ảnh lên** | Ảnh mới không từ hotlink |
| Mở **Thư viện media** (nav) | Admin tìm / usage / soft delete |

Các hành động này **không** thay thế nút **Nhập vào Thư viện**.

---

# 9. Phân tách 2 Workflow (review)

| | Workflow 1 — Editor (file này) | Workflow 2 — System (`02`) |
|--|-------------------------------|----------------------------|
| Ai review | Product Owner · Editor | Dev · Implementer |
| Ngôn ngữ | Nhập vào Thư viện · N ảnh ngoài · tái sử dụng | Scan · Download · Variant · Dedup · Replace |
| Trigger | 1 click | Job API |
| Thành công | Banner/status xanh · tiếp tục sửa | Article saved · Usages · Assets |

```text
[Nhập vào Thư viện]  ──trigger──►  System Workflow (02)
```

---

# 10. Acceptance (Editor UX)

| ID | Tiêu chí |
|----|----------|
| **UX-E-01** | Một nút nghiệp vụ hoàn tất localize — không sửa HTML |
| **UX-E-02** | Banner + chip trạng thái hiện số ảnh ngoài |
| **UX-E-03** | Progress + kết quả có “mới / tái sử dụng” |
| **UX-E-04** | Partial có thử lại ảnh lỗi |
| **UX-E-05** | Publish FAIL hướng về cùng một nút Import |
| **UX-E-06** | Không lộ thuật ngữ AVIF/WebP/Replace cho Editor |

---

# 11. Phiên bản

| Ver | Thay đổi |
|-----|----------|
| 1.0 | Draft chung (chưa đủ banner/status/reuse copy) |
| **1.1** | Khớp mong đợi: 1-click · nhãn nghiệp vụ · banner · chip · reuse stats · tách Editor vs System |

---

*SOL-COM-MEDIA-04 v1.1 · Editor Workflow · 2026-07-30*
