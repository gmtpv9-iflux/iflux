# 08 — Admin UX Contract · Thiết lập mẫu thông báo

**Date:** 2026-07-28 (rev D1-rev 2026-07-28)  
**Page:** `/admin/he-thong/announcements` · ADM-SYS-003  
**Quyết định Owner:** Giữ layout · đổi **naming semantics** + thêm editable **Tên mẫu** (D1-rev)  
**Platform SoT:** [`06-Platform-SoT.md`](06-Platform-SoT.md)  
**Trạng thái:** ⏸ **REV D1-rev PENDING SIGN-OFF** → ✅ **LOCKED 2026-07-28** Owner sign-off

---

## 1. UI giữ nguyên (LOCKED)

| Thành phần | Giữ? | Ghi chú |
|------------|------|---------|
| Danh sách case (mã NOTIF + **Tên mẫu** + mô tả trigger) | ✅ | Header list = `name` — **không** `template.title` |
| Expand case → **Tên mẫu** + **Tiêu đề mẫu** + **Nội dung mẫu** | ✅ | 3 field (§4 · §5) |
| Panel **Thẻ merge** `{Tên thẻ}` bên phải | ✅ | Read-only copy từ `variables` — [`04-Variable-Contract-Audit.md`](04-Variable-Contract-Audit.md) |
| **Xem trước** | ✅ | Sample variables only — §8 |
| Nút **Lưu mẫu** / **Khôi phục mặc định** | ✅ | §6 · §7 |
| Bộ lọc nhóm + tìm kiếm | ✅ | |
| Summary cards (số thẻ, số case) | ✅ | |

**Không redesign** layout `announcements.html` trừ khi Owner yêu cầu riêng.

---

## 2. UI không có giai đoạn đầu (LOCKED)

| Thành phần | Lý do |
|------------|--------|
| Nút **「+ Thêm mẫu」** cho Admin | Template without Type = không biết khi nào gửi |
| Admin tạo / sửa Notification Type | Developer owns registry — §5 |
| Form sửa variables schema · category · channels | Read-only v1 — §5 |

Bảng Wave C `adm-notif-tpl-tbody` → **retire** — tránh 2 UI template song song.

---

## 3. Admin vs Developer vs Domain

| Vai trò | Việc |
|---------|------|
| **Admin** | Sửa **Tên mẫu** + **Tiêu đề mẫu** + **Nội dung mẫu** (§5 · §6) |
| **Developer** | Register Type + seed + consumer hook |
| **Domain** | **Không** sửa template — [`02-Ownership-Audit.md`](02-Ownership-Audit.md) |

---

## 4. Developer — thêm consumer mới

1. Notification Type + seed template
2. `Dispatcher.dispatch({ typeCode, … })` tại business event
3. Admin thấy case mới → chỉnh copy

**Ví dụ Affiliate (consumer):**

```text
Type: AFFILIATE_REFERRAL_SUCCESS
admin_code: NOTIF-USER-007
Seed body: {member} đã đăng ký qua mã giới thiệu của bạn.
```

---

## 4. Naming model — Tên mẫu vs content (D1-rev LOCKED đề xuất)

Phân biệt **4 lớp text** — không nhập nhằng:

| Field | Label UI | Vai trò | List header? |
|-------|----------|---------|:------------:|
| `admin_code` | **Mã** | Định danh kỹ thuật NOTIF-* | Hiển thị kèm Tên mẫu |
| `code` | *(ẩn user)* | `type_code` contract | ❌ |
| `name` | **Tên mẫu thông báo** | Label nghiệp vụ · đối chiếu User Web | **✅ duy nhất** |
| `template.title` | **Tiêu đề mẫu** | Copy title gửi inbox | ❌ |
| `template.body` | **Nội dung mẫu** | Copy body gửi user | ❌ |

**Ví dụ Owner:**

```text
Mã: NOTIF-USER-007
Tên mẫu: Thành viên mới đăng ký qua link giới thiệu

Tiêu đề mẫu: Bạn có thành viên mới!
Nội dung mẫu: Chào mừng {Tên thành viên mới} đã đăng ký thành công qua mã giới thiệu của bạn!
```

**Cấm:** `caseDisplayTitle()` ưu tiên `template.title` cho list header.

User Web toggle label = **`name`** — xem [`11-User-Preference-UI-Contract.md`](11-User-Preference-UI-Contract.md).

---

## 5. Read-only vs editable fields (D1-rev)

Admin sửa **Tên mẫu + tiêu đề + nội dung**. Metadata Type Registry khác **read-only** v1.

| Field | Label UI | Admin editable | Ghi chú |
|-------|----------|:--------------:|---------|
| **Name** | **Tên mẫu thông báo** | ✅ | PATCH `notification_types.name` |
| **Title** | **Tiêu đề mẫu** | ✅ | PATCH template · copy gửi inbox |
| **Body** | **Nội dung mẫu** | ✅ | PATCH template |
| Admin Code | **Mã** | ❌ | NOTIF-USER-007 |
| Type Code | — | ❌ | Developer seed |
| Trigger description | — | ❌ | Read-only trong list |
| Variables schema | — | ❌ | Panel merge tags |
| Supported channels | — | ❌ v1 | Metadata |
| `group_label` | **Nhóm thông báo** | ❌ | Human SoT D6 · seed-only v1 |
| Type `enabled` kill switch | — | ❌ v1 | v2 |
| Icon | — | ❌ v1 | Seed |

**Cấm agent:** Thêm UI「Sửa loại thông báo」·「Quản lý biến」·「Thêm kênh Push」trên ADM-SYS-003.

---

## 6. Save contract — 「Lưu mẫu」(LOCKED)

**Hành vi:**

```text
Save (Lưu mẫu)
  → PATCH notification_types.name (nếu Tên mẫu đổi)
  → PATCH notification_templates (title, body)
  → tăng version (optimistic concurrency — §8.2 Platform SoT)
  → không ảnh hưởng notification đã phát
```

| Save **làm** | Save **không làm** |
|--------------|-------------------|
| Cập nhật template DB cho Type + channel | Phát lại notification cũ |
| Notification **mới** từ thời điểm save dùng copy mới | Re-render / sửa inbox đã gửi |
| | Dispatch thử |
| | Ghi inbox |
| | Đổi preference user |
| | Sửa Type registry |

**Ví dụ (LOCKED behavior):**

| Thời điểm | Sự kiện |
|-----------|---------|
| 8:00 | User nhận in-app title **「Referral mới」** (đã render snapshot) |
| 8:05 | Admin Save → **「Bạn vừa có thành viên mới」** |
| 8:00 notification | **Giữ nguyên** title/body đã lưu trong inbox |
| 8:06+ notification mới | Dùng template mới |

Inbox lưu **title/body đã render** tại dispatch — template edit **không** retroactive.

---

## 7. Restore contract — 「Khôi phục mặc định」(LOCKED)

**「Mặc định」= seed template** (giá trị migration/seed lần đầu cho row đó) — **không** phải xóa Type · **không** phải factory reset platform.

```text
Restore Default (Khôi phục mặc định)
  → reset title + body về seed template (DB seed row / seed script source)
  → không xóa Notification Type
  → không xóa preference user
  → không xóa inbox / notification đã gửi
  → không dispatch
  → không re-render notification cũ
```

| Restore **làm** | Restore **không làm** |
|-----------------|----------------------|
| Ghi đè title/body template về seed | Xóa case khỏi list |
| Admin có thể Save lại sau restore | Xóa `notification_types` |
| | Reset toàn bộ catalog |
| | Ảnh hưởng inbox history |

Nếu seed DB đã bị Admin override nhiều lần, restore = **seed default** stored server-side (column hoặc seed reference) — không đọc lại `catalog.js` runtime.

---

## 8. Preview contract — 「Xem trước」(LOCKED)

**Khóa behavior — không khóa implementation** (client hoặc server render đều được).

```text
Preview (Xem trước)
  → render title + body với sample variables của Type
  → chỉ hiển thị trên panel preview UI
  → không dispatch
  → không ghi inbox
  → không gửi notification thật cho bất kỳ user nào
  → không gọi Push / Email adapter
```

| Preview **dùng** | Preview **cấm** |
|------------------|-----------------|
| `sampleVars` / variables example từ Type | Recipient user thật |
| Placeholder substitution demo | `NotificationDispatcher.dispatch()` |
| | Test send ·「Gửi thử」|

Copy trong §1: *Preview sử dụng sample variables. Render có thể client hoặc server — không đổi runtime contract.*

---

## 9. Agent checklist (trước khi ship ADM-SYS-003 wire)

- [ ] List header = **Tên mẫu** (`name`) — không `template.title`
- [ ] 3 input editable: Tên mẫu · Tiêu đề mẫu · Nội dung mẫu
- [ ] Save không touch inbox rows
- [ ] Restore → seed template only
- [ ] Preview không dispatch
- [ ] Không thêm UI sửa Type / variables / channels

---

*Admin UX Contract v3 — D1-rev naming — pending Owner sign-off 2026-07-28.*
