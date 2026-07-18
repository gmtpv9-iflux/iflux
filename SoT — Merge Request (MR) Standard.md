# SoT — Merge Request (MR) Standard

## 1. Mục tiêu

Merge Request (MR) là tài liệu mô tả **một thay đổi duy nhất (Single Change)** để reviewer có thể:

- Hiểu vấn đề trong vòng 1 phút.
- Hiểu giải pháp trong vòng 3 phút.
- Quyết định **Merge / Request Changes** mà không cần đọc toàn bộ source code.

MR **không phải** nhật ký làm việc, nhật ký commit hay lịch sử suy nghĩ của AI.

---

## 2. Một MR chỉ có một mục tiêu

**Đúng**

```
MR: Fix CSS Scope Leak trong Preview Runtime
```

hoặc

```
MR: Thêm Viewport Registry
```

hoặc

```
MR: Chuyển Widget Definition sang V2
```

**Sai**

```
MR: Viewport + Widget + Cache + Template + Refactor + Cleanup
```

Nếu có nhiều mục tiêu **phải tách thành nhiều MR**.

---

## 3. Cấu trúc bắt buộc

Mọi MR đều phải theo đúng thứ tự sau.

### 1. Mục tiêu (Objective)

Trả lời: **MR này dùng để làm gì?**

Ví dụ:

> Khắc phục hiện tượng Preview Layer 4 bị CSS của Authoring ghi đè làm tràn layout.

Chỉ 2–3 câu.

### 2. Vấn đề (Problem)

Trả lời: **Người dùng đang gặp gì?**

Ví dụ:

- Preview của Widget bị tràn ngang.
- Select filter bị kéo full-width.
- Runtime hiển thị sai.

Không nói commit. Không nói file. Không nói code.

### 3. Root Cause

Trả lời: **Tại sao xảy ra?**

Ví dụ:

> Rule `.l4-edit select.ix-input` được áp dụng cho toàn bộ Authoring Page. Preview cũng nằm trong `.l4-edit` ⇒ CSS bleed từ Config sang Preview Runtime.

Đây là phần kỹ thuật.

### 4. Giải pháp

Trả lời: **Tôi sửa gì?**

Ví dụ:

> Thu hẹp scope `.l4-edit` → `.l4-authoring__config`.

Không kể quá trình làm. Không kể đã thử gì. Không kể suy nghĩ.

### 5. Phạm vi ảnh hưởng

Reviewer luôn quan tâm: **Merge vào có vỡ gì không?**

Ví dụ:

Ảnh hưởng:
- ✔ Authoring
- ✔ Preview

Không ảnh hưởng:
- ✘ Runtime
- ✘ Design System
- ✘ Widget
- ✘ API

### 6. Kiểm thử

Không ghi "Đã test OK". **Phải ghi bằng chứng.**

Ví dụ:

| | Trước | Sau |
|---|---|---|
| Select | 343px | 108px |
| Overflow | Có | Không |

Chrome · Firefox · Mobile Preview → **PASS**

### 7. Checklist Merge

Ví dụ:

- ✔ Không đổi contract
- ✔ Không đổi API
- ✔ Không đổi Database
- ✔ Không đổi Runtime
- ✔ Có rollback
- ✔ Build PASS
- ✔ Smoke test PASS

Reviewer nhìn 5 giây là biết.

---

## 4. Những thứ KHÔNG được xuất hiện

### Không được kể lịch sử

Sai:

> Ban đầu tôi thử A → Sau đó thử B → Rồi chuyển sang C → Cuối cùng dùng D

Reviewer không cần.

### Không được liệt kê commit

Sai:

> Commit 1 · Commit 2 · Commit 3

Reviewer đọc commit trên GitLab. MR không cần lặp lại.

### Không được kể quá trình AI

Sai:

> Đã push · Đã deploy · Đã purge · Đã tạo branch · Đã tạo MR

Đó là log. Không phải nội dung MR.

---

## 5. Nguyên tắc viết

MR luôn trả lời theo đúng thứ tự:

```
Tại sao?
   ↓
Lỗi gì?
   ↓
Nguyên nhân?
   ↓
Sửa gì?
   ↓
Ảnh hưởng gì?
   ↓
Đã kiểm thử chưa?
```

Không được viết theo thứ tự:

```
Tôi làm gì?
   ↓
Tôi commit gì?
   ↓
Tôi push gì?
   ↓
Tôi deploy gì?
```

---

## 6. Tiêu chuẩn "1 phút"

Một reviewer phải trả lời được 5 câu sau chỉ sau khoảng 1 phút đọc MR:

1. MR này giải quyết vấn đề gì?
2. Nguyên nhân gốc là gì?
3. Thay đổi chính là gì?
4. Có ảnh hưởng đến module khác không?
5. Tôi có đủ tự tin để merge chưa?

Nếu sau 1 phút vẫn phải đọc commit, mở source hoặc hỏi lại tác giả thì MR **chưa đạt chuẩn**.

---

## 7. Template chuẩn

```markdown
# Mục tiêu

...

# Vấn đề

...

# Root Cause

...

# Giải pháp

...

# Phạm vi ảnh hưởng

...

# Kiểm thử

...

# Checklist Merge

☑ Build PASS
☑ Smoke Test PASS
☑ Không đổi API
☑ Không đổi Contract
☑ Rollback được
```

---

## Quy tắc vàng

Merge Request **không phải nhật ký công việc**. Merge Request là tài liệu thuyết phục reviewer rằng thay đổi này **đúng, an toàn và đáng để merge**.

Nếu AI luôn tuân thủ cấu trúc này, mỗi MR sẽ có cùng một "ngôn ngữ", giúp việc review nhanh, nhất quán và giảm đáng kể thời gian đọc.
