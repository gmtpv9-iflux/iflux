# 00 — README · Quản lý bài viết trên trang Cộng đồng

**Date:** 2026-07-30  
**Folder:** `docs/Product Backlog/270730_Community_Post_List_Management/`  
**Trạng thái:** 🟡 **Discovery mở** — Audit rule hiển thị danh sách (User Web) đã có · chờ Owner định hướng Quản lý bài viết

---

## Mục đích

Task Product về **Quản lý bài viết trên trang Cộng đồng** (`/cong-dong`): làm rõ luật hiển thị danh sách hiện tại, sau đó (khi Owner mở) thiết kế / thi công quản lý (Admin + User Web) theo Engineering Change Governance.

**Business outcome (dự kiến):** Owner kiểm soát được bài nào xuất hiện trên Cộng đồng, theo thứ tự / bộ lọc nào — không suy diễn từ implementation.

---

## Thứ tự tài liệu

```text
00 README                         ← ✅
01 Audit — Rule hiển thị danh sách (User Web /cong-dong)  ← ✅
02 Task Objective / Scope         ← sau Owner định hướng
03 Impact Analysis                ← trước khi code
04 Owner Decisions / SoT          ← khi chốt
05 Plan / Implementation …
```

**Governance:** [`docs/SoT — Engineering Change Governance.md`](../../SoT%20—%20Engineering%20Change%20Governance.md) · Audit-first · không code trước Impact + Owner chốt.

---

## Phạm vi neo (ban đầu)

| Trong | Ngoài (chưa mở) |
|-------|-----------------|
| Rule list bài User Web `/cong-dong` | Chi tiết bài `/cong-dong/bai-viet/…` (trừ khi Owner mở) |
| Feed API + Daily Feed + entitlement block | Admin CMS đầy đủ (mở phase riêng nếu cần) |
| Rủi ro filter FE / pin-featured | Program Affiliate Gate |

---

## Liên kết nhanh

- Audit hiện tại: [`01-Audit-Community-Feed-Display-Rules.md`](01-Audit-Community-Feed-Display-Rules.md)
- Page: https://iflux.vn/cong-dong

---

*Task mở 2026-07-30 · chưa Implementation*
