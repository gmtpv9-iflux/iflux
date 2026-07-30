# Owner Decisions — Affiliate Attribution Capability (OD-AFF)

**Date:** 2026-07-28  
**Trạng thái:** 🔒 **LOCKED** — Owner approve thi công 2026-07-28  
**Plan:** [00-Plan-Owner-Review.md](00-Plan-Owner-Review.md) rev-2

---

## OD-AFF-01 … OD-AFF-09

| ID | Quyết định | Status |
|----|------------|--------|
| **OD-AFF-01** | **Affiliate Attribution là Business Capability** — không thuộc Register, Login, OAuth | ✅ APPROVED |
| **OD-AFF-02** | **Affiliate Context có một capability owner duy nhất** | ✅ APPROVED |
| **OD-AFF-03** | Capture ngay khi visitor truy cập **Affiliate URL** lần đầu (first-touch) | ✅ APPROVED |
| **OD-AFF-04** | Context tồn tại độc lập UI · sống đến **Identity Created** hoặc **Expired** | ✅ APPROVED |
| **OD-AFF-05** | Mọi **Identity Creation** đi qua cùng **Identity Creation Contract** + Attribution | ✅ APPROVED |
| **OD-AFF-06** | **`users.referred_by`** = server Source of Truth cuối cùng | ✅ APPROVED |
| **OD-AFF-07** | Notification · Commission · History · Dashboard **chỉ đọc kết quả server** | ✅ APPROVED |
| **OD-AFF-08** | **Cấm** logic kiểu "Register mới có referral" · provider riêng · page riêng | ✅ APPROVED |
| **OD-AFF-09** | Thêm login/register provider mới **không** sửa Affiliate Logic | ✅ APPROVED |

---

## OD-AFF-10 — Legacy publicId `/MINH10` (2026-07-28)

| ID | Quyết định | Status |
|----|------------|--------|
| **OD-AFF-10** | **Option A — Accept 404** cho `/MINH10` · **không** nginx redirect · **không** compatibility layer legacy sandbox IDs | 🔒 **LOCKED** |

**Lý do Owner:**

1. Không duy trì backward compatibility cho legacy sandbox IDs.
2. Toàn bộ dữ liệu test đã migrate sang rule mới (`IFLMVN10`).
3. Không còn user production thực tế sử dụng `MINH10`.
4. Không thêm nginx redirect hoặc compatibility layer chỉ để phục vụ dữ liệu test cũ.

**Hành vi mong muốn sau migration:**

- `/MINH10` → **404** (permanent).
- Chỉ hỗ trợ publicId theo rule `^IFL[A-Z0-9]{5,17}$` (nginx gate + AR + `buildReferralLink`).

**Evidence:** [07-Post-Implementation-Audit-Exit-Evidence.md](07-Post-Implementation-Audit-Exit-Evidence.md) §11.B–D

| Principle | Tóm tắt |
|-----------|---------|
| **Human Journey First** | Nghiệp vụ theo hành trình người dùng — không ép một luồng UI kỹ thuật |
| **Journey Independence Law** | Attribution theo semantic journey · FAIL nếu provider/page tạo pipeline mới |
| **REPLACE not EXTEND** | Xóa multi-owner capture/consume · không adapter/dual-read |

---

## Out of scope (Owner — không block G0)

| Item | Ghi chú |
|------|---------|
| Legacy `MINH10` publicId | ✅ Done — migration `IFLMVN10` · **OD-AFF-10** Accept 404 |
| F1/F2 referral notification upline | Consumer sau Foundation |
| PNC navigation URL bar | Capability khác — không owner attribution |
| Outgoing Share URL decorate | Không đổi trong task này |

---

## Sign-off G0

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Owner | | | ✅ APPROVED |

*Khi APPROVED → đổi trạng thái file này thành 🔒 LOCKED.*
