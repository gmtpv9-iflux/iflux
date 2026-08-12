# 01a — BRD Amendment: BR-23 Staging Environment Isolation

| | |
|--|--|
| **Amends** | `01 - Business Requirement.md` |
| **Added by** | Owner, tại Gate 1 decision round (2026-08-12) |
| **Lý do amendment** | Owner nâng cấp "Staging DB gap" từ Solution Decision (SD-level, tuỳ chọn kỹ thuật) lên thành **Business Requirement bắt buộc** — để không ai (kể cả Agent) có thể hiểu lầm rằng "giữ nguyên Staging dùng chung DB, làm CI/CD trước, xử lý isolation sau" là một lựa chọn hợp lệ. |

---

## BR-23 — Staging Environment Isolation

> **Staging phải có data/storage boundary độc lập với Production, đủ để một release được test mà không thể làm thay đổi Production state ngoài các integration explicitly được kiểm soát.**

### Diễn giải bắt buộc

- CI/CD (GitHub Actions — xem SD-02) **có thể** được xây dựng trước.
- Nhưng **Staging KHÔNG được công nhận là một release gate hoàn chỉnh** cho tới khi isolation này được giải quyết.
- Nói cách khác: có Staging auto-deploy chưa đủ → phải có Staging **an toàn để test** (không đụng Production data) mới được coi là đã thoả BR-02/BR-03/BR-10 của BRD gốc.

### Minimum target (Owner-lock)

```text
Staging Application
       ↓
Staging DB / isolated data store

Production Application
       ↓
Production DB
```

- Physical server separation **không** phải yêu cầu bắt buộc (có thể tách trên cùng 1 server nếu kỹ thuật an toàn).
- Nhưng các thành phần sau **bắt buộc phải tách**:
  - database
  - database credentials
  - application environment configuration
  - cache (nếu liên quan)
  - queues/background jobs (nếu liên quan)
  - file/storage writes (nếu liên quan)
  - external side effects (nếu liên quan — ví dụ: affiliate/payment callback, email gửi thật, webhook ra ngoài)

### Cấm

- **Không** tự ý clone/migrate database ngay (`Do NOT immediately implement database cloning/migration`).
- **Không** coi CI/CD Staging tự động deploy là "đã xong Staging" nếu isolation chưa giải quyết.

### Trình tự bắt buộc

```text
Audit toàn diện side-effect Production
        ↓
STAGING ISOLATION PLAN (deliverable bắt buộc)
        ↓
Owner approve plan
        ↓
Implement isolation
        ↓
Staging mới được công nhận là release gate hợp lệ
```

### Output bắt buộc của Audit

`STAGING ISOLATION PLAN` — phải trả lời được: Staging có thể test một release mà **không** làm thay đổi Production state, ngoại trừ các integration đã được explicitly kiểm soát.

### Trạng thái

🔴 **BLOCKING ARCHITECTURE GAP** — cho tới khi `STAGING ISOLATION PLAN` được Owner approve và implement, mô hình "Staging dùng chung Production DB" hiện tại được đánh dấu chính thức là **gap chưa đóng**, không phải baseline chấp nhận được cho release-gate.

---

## Cập nhật Acceptance Criteria (bổ sung vào §33 của `01 - Business Requirement.md`)

- [ ] Staging có database/storage riêng, tách khỏi Production.
- [ ] Staging credentials tách khỏi Production credentials.
- [ ] Một release chạy trên Staging không tạo side-effect nào lên Production (trừ integration đã kiểm soát rõ, có danh sách).
- [ ] `STAGING ISOLATION PLAN` đã được Owner approve trước khi Staging được công nhận là release gate chính thức.
