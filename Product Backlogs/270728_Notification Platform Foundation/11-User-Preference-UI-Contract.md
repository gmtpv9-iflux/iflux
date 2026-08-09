# 11 — User Preference UI Contract · Quyền riêng tư

**Date:** 2026-07-28  
**Page:** User Web · Tài khoản → **Quyền riêng tư** · section **Thông báo**  
**Platform SoT:** [`06-Platform-SoT.md`](06-Platform-SoT.md) §3.5 (D1-rev)  
**Trạng thái:** ✅ **LOCKED 2026-07-28** — Owner sign-off D1-rev

---

## 1. Mục đích

User bật/tắt **từng notification type** — không bật/tắt cả nhóm.

Group (`group_label`) chỉ để **phân loại · sắp xếp UI** — **không có switch** trên group header. Admin filter và User section dùng **cùng** `group_label` (D6).

Toggle label = **Tên mẫu** (`notification_types.name`) — cùng ngôn ngữ với Admin ADM-SYS-003.

---

## 2. Layout (LOCKED đề xuất)

```text
Thông báo theo loại
Bật/tắt từng thông báo in-app. Nhóm chỉ để dễ đọc.

── Affiliate ──────────────────────────────
  (không có switch ở dòng này)

  ☑ Thành viên mới đăng ký qua link giới thiệu
  ☐ Nhận hoa hồng Affiliate

── Cộng đồng ──────────────────────────────

  ☑ Bài viết mới từ người theo dõi
  ☑ Tin nhắn mới
  ...
```

**Cấm UI:**

```text
☑ Thông báo Affiliate          ← bucket toggle — RETIRED
    (ẩn/hiện mọi type affiliate)
```

```text
☑ Type A
☐ Type B                         ← OK — mỗi dòng = 1 type_code
```

---

## 3. Data source (LOCKED)

| UI element | Source | Hardcode? |
|------------|--------|-----------|
| Group header label | `group_label` via API (pass-through) | ❌ |
| Toggle label | `notification_types.name` | ❌ |
| Toggle state | `user_notification_type_preferences.enabled` | ❌ |
| `admin_code` / `type_code` | API metadata · không hiển thị user thường | — |

**Load:** `GET /users/me/notification-preferences` — structure §4.

**Save:** `PATCH /users/me/notification-preferences` — `{ items: [{ type_code, enabled }] }`.

**Cấm:** `notification-preference-store.js` hardcode 5 bucket labels.

---

## 4. API binding

### GET response (consumer)

```json
{
  "groups": [
    {
      "key": "affiliate",
      "label": "Affiliate",
      "types": [
        {
          "type_code": "AFFILIATE_REFERRAL_SUCCESS",
          "name": "Thành viên mới đăng ký qua link giới thiệu",
          "enabled": true
        }
      ]
    }
  ]
}
```

**Render rule:**

- Mỗi `types[]` → 1 row + 1 switch.
- `data-ifx-notif-type="AFFILIATE_REFERRAL_SUCCESS"` — **không** `data-ifx-notif-bucket`.

### PATCH payload

```json
{
  "items": [
    { "type_code": "AFFILIATE_REFERRAL_SUCCESS", "enabled": false }
  ]
}
```

**Reject client-side** nếu payload chứa `bucket` — server cũng reject 400.

---

## 5. Naming alignment với Admin (TRACK A)

| Admin ADM-SYS-003 | User Quyền riêng tư |
|-------------------|---------------------|
| Mã: NOTIF-USER-007 | *(không hiển thị)* |
| Tên mẫu: *Thành viên mới đăng ký qua link giới thiệu* | Toggle label: *cùng string `name`* |
| Tiêu đề mẫu: *Bạn có thành viên mới!* | Chỉ thấy trong inbox sau dispatch |
| Nội dung mẫu: *Chào mừng {…}* | Chỉ thấy trong inbox sau dispatch |

Admin đổi **Tên mẫu** → User toggle label cập nhật sau reload/API fetch.

Admin đổi **Tiêu đề/Nội dung mẫu** → **không** đổi User toggle label.

---

## 6. Independence invariant (TRACK B)

**PASS example:**

```text
User A:
  AFFILIATE_REFERRAL_SUCCESS = ON
  AFFILIATE_COMMISSION_EARNED = OFF

Referral event  → inbox +1
Commission event → inbox 0
```

**FAIL:**

```text
Commission OFF → Referral cũng không dispatch (group coupling)
```

---

## 7. Multi-tab sync (R6)

Tab A toggle type OFF → Tab B reload → cùng state cho **type_code** đó.

---

## 8. Out of scope v1

| Cấm | Lý do |
|-----|--------|
| User sửa Tên mẫu / template | Admin only |
| Per-channel toggle (push/email) | v2 |
| Quiet hours · digest | v2 |
| Trang Cài đặt thông báo riêng | v2 — v1 trong Quyền riêng tư |

---

## 9. Agent checklist (trước ship)

- [ ] Không bucket toggle
- [ ] Mỗi switch bind `type_code`
- [ ] Label = `name` từ API
- [ ] Group header không có switch
- [ ] PATCH payload không có `bucket`
- [ ] Admin/User cùng Tên mẫu đối chiếu được

---

*User Preference UI Contract v1 — D1-rev — pending Owner sign-off 2026-07-28.*
