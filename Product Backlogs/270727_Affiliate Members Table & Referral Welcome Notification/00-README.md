# 00 — README · Affiliate Members Table & Referral Welcome Notification

**Date:** 2026-07-27 (rev.2 · 2026-07-28)  
**Folder:** `docs/Product Backlog/270727_Affiliate Members Table & Referral Welcome Notification/`  
**Trạng thái:** 🔄 Owner decisions LOCKED — **chờ Notification Platform Phase B/C**

---

## Vai trò task này

**Phase D consumer** — tích hợp domain Affiliate sau khi có Platform Foundation.

```text
Notification Platform (270728)
  Phase A–C: SoT · Template DB · Type Registry
        ↓
Phase D — task này: bảng thành viên + preference + emit AFFILIATE_REFERRAL_SUCCESS
```

**Không** thiết kế platform trong folder này.

---

## Mục tiêu (Phase D)

1. Bảng **Danh sách thành viên** — cột Trạng thái hoạt động (sync Admin `account_status`)
2. Toggle **「Nhận thông báo」** — preference server (P0-H1)
3. Signup thành công → emit `AFFILIATE_REFERRAL_SUCCESS` cho uplines F0/F1/F2 (P0-H2)
4. Runtime qua **Dispatcher** — không gọi template localStorage trực tiếp

---

## Danh mục

| # | File | Mô tả |
|---|------|--------|
| 00 | [`00-README.md`](00-README.md) | Index |
| 01 | [`01-Task-Spec.md`](01-Task-Spec.md) | Yêu cầu Affiliate UI + AC |
| 02 | [`02-Impact-Analysis.md`](02-Impact-Analysis.md) | File · API |
| 03 | [`03-Owner-Decisions.md`](03-Owner-Decisions.md) | LOCKED P0-H1 · H2 · H3 |
| 04 | [`04-Template-SoT-Audit.md`](04-Template-SoT-Audit.md) | **Evidence only** — legacy 3 hệ |

---

## Phụ thuộc bắt buộc

| Phụ thuộc | Link |
|-----------|------|
| **Notification Platform** | [`270728_Notification Platform Foundation`](../270728_Notification%20Platform%20Foundation/00-README.md) |
| Type `AFFILIATE_REFERRAL_SUCCESS` | Phase C registry |
| Template NOTIF-USER-007 | Phase B DB |
| Admin UX | [`08-Admin-UX-Contract.md`](../270728_Notification%20Platform%20Foundation/08-Admin-UX-Contract.md) |

---

## Thứ tự triển khai (cập nhật)

```text
Platform Phase A → B → C   (folder 270728)
        ↓
Affiliate Phase D:
  · Bảng + account_status
  · Preference server
  · emit AFFILIATE_REFERRAL_SUCCESS @ signup
  · Regression
```

---

*rev.2 — platform-first dependency 2026-07-28.*
