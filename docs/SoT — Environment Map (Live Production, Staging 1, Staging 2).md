# SoT — Environment Map (Live Production, Staging 1, Staging 2)

| | |
|--|--|
| **Document ID** | SoT-ENVMAP-001 |
| **Version** | 1.0 |
| **Status** | 🔒 LOCKED — đọc file này TRƯỚC KHI SSH/deploy bất cứ thứ gì |
| **Ngày** | 2026-08-14 |
| **Nguồn** | Owner directive — xem đầy đủ tại `Product Backlogs/120826_pending_Git_Deployment_Process_Reconstruction/14 - SSH ↔ Deployment Boundary Policy (Owner Directive).md` |

> **Đọc file này nếu bạn là người mới (hoặc Agent mới) vừa vào project.** Chỉ cần nhớ 1 câu: **`iflux.vn` không được đụng vào.** Mọi việc code/deploy/test hiện tại làm trên 2 domain khác.

---

## 1. Bức tranh tổng quan

```text
┌─────────────────────────────────────────────────────────────┐
│  iflux.vn                                                    │
│  LIVE PRODUCTION — phục vụ user thật                          │
│                                                                │
│  🔒 PROTECTED — KHÔNG SSH deploy / sửa code / reset / migrate │
│     Chỉ đọc (audit, evidence). Mọi write đều CẤM.             │
└─────────────────────────────────────────────────────────────┘

┌───────────────────────────┐     ┌───────────────────────────┐
│  staging.iflux.vn          │     │  production.iflux.vn       │
│  STAGING 1                 │     │  STAGING 2                 │
│                             │     │  (hostname — KHÔNG phải     │
│  Vai trò: Reference /      │     │   Production thật)          │
│  Development / Verification│     │                             │
│                             │     │  Vai trò: CLEAN REBUILD     │
│  Đồng bộ với baseline       │     │  TARGET — trắng tinh, xây   │
│  Production cũ (partial —   │     │  lại từ đầu, có thể lấy     │
│  xem "13 - Verification     │     │  từng phần đã audit/PASS    │
│  Report", PARTIALLY         │     │  từ Staging 1               │
│  VERIFIED)                  │     │                             │
└───────────────────────────┘     └───────────────────────────┘
              ▲                                 ▲
              │                                 │
              └──────────────┬──────────────────┘
                              │
                          GitHub
                    (gmtpv9-iflux/iflux)
                              │
                    ┌─────────┴─────────┐
                    │  branch: staging   │→ CI/CD → Staging 1
                    │  branch: production-clean │→ CI/CD → Staging 2
                    └────────────────────┘
```

## 2. Bảng phân biệt nhanh

| | `iflux.vn` | `staging.iflux.vn` | `production.iflux.vn` |
|---|---|---|---|
| Tên gọi | **Live Production** | Staging 1 | Staging 2 |
| Có phải Production thật? | ✅ CÓ — user thật đang dùng | ❌ Không | ❌ Không (dù tên miền có chữ "production") |
| Được SSH/deploy? | 🔒 **CẤM** (chỉ đọc/audit) | ✅ Được | ✅ Được |
| Nguồn code | Filesystem trực tiếp, KHÔNG qua Git (rsync tay lịch sử) | GitHub branch `staging` → CI/CD atomic release | GitHub branch `production-clean` → CI/CD atomic release |
| Database | `iflux` (dữ liệu thật) | `iflux_staging` (snapshot 1 lần từ Production 14/08, KHÔNG sync liên tục) | `iflux_newprod` (rỗng, 0 bảng — clean rebuild) |
| Trạng thái hiện tại | LIVE, ổn định | PARTIALLY VERIFIED (xem doc `13`) | Vừa dựng hạ tầng xong (Phase 3), application còn rỗng |
| Vai trò tiếp theo | Giữ nguyên, phục vụ user tới khi có Cutover Gate | Reference/Dev — nơi audit lấy implementation đã PASS | Nơi rebuild từng capability, sẽ dần thành Production chính thức |

## 3. Quy tắc bắt buộc (không có ngoại lệ)

1. **`iflux.vn` = Protected Live Environment.** SSH vào server vẫn kỹ thuật CÓ THỂ chạm được path Production (`/var/www/iflux/production`, `/var/iflux/backend`) vì hiện tại 3 môi trường chung 1 server — nhưng đây là **giới hạn kỹ thuật**, không phải cho phép. Quy tắc hành vi là: **không bao giờ chủ động ghi/thay đổi path đó.**
2. Deploy/dev/test **chỉ** trên Staging 1 và Staging 2.
3. `production.iflux.vn` là hostname của Staging 2 — **đừng nhầm với Production thật** khi đọc log/báo cáo/domain.
4. Muốn biết chi tiết kỹ thuật (path, credential, sudoers, CI/CD workflow) — đọc `14 - SSH ↔ Deployment Boundary Policy.md`.
5. Muốn biết Production cũ khác Staging 1 ở đâu — đọc `13 - Production ↔ Staging Baseline Verification Report.md`.
6. Muốn deploy vào Production thật (sau này) — phải qua **Production deployment flow riêng + Production Gate riêng** (chưa mở, chưa có SoT).

## Liên quan

- `docs/SoT — Deployment.md` — quy trình deploy kỹ thuật đầy đủ (v1.3, đã amend theo boundary này).
- `.cursor/rules/ssh-deployment-boundary.mdc` — rule tự động nhắc Agent mỗi session.
- `Product Backlogs/120826_pending_Git_Deployment_Process_Reconstruction/` — toàn bộ lịch sử quyết định (Plan 07, Reconstruction Plan 12, Verification Report 13, Boundary Policy 14).
