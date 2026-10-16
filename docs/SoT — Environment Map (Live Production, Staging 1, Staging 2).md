# SoT — Environment Map (Staging and Production)

| | |
|--|--|
| **Document ID** | SoT-ENVMAP-001 |
| **Version** | 1.3 |
| **Status** | 🔒 Current environment map — Owner correction 2026-10-14 |
| **Ngày** | 2026-08-14 · amend 2026-08-17 · amend 2026-08-19 · amend 2026-10-14 |
| **Nguồn** | Owner directive — xem đầy đủ tại `Product Backlogs/120826_pending_Git_Deployment_Process_Reconstruction/14 - SSH ↔ Deployment Boundary Policy (Owner Directive).md` |

> **OWNER CORRECTION 2026-10-14 — current:** There are two active environments: Staging `staging.iflux.vn` (GitHub `staging`, `.github/workflows/deploy-staging.yml`) and Production `iflux.vn` (GitHub `production`, `.github/workflows/deploy-production.yml`). Both deploy through GitHub CI/CD. “Staging 1” is an old internal label for Staging, not a separate environment. Statements below that deny the Production CI/CD path or say its gate is closed are outdated and superseded.

> **AMENDMENT 2026-08-19:** Canonical Staging = GitHub `staging` → `:3002`. Canonical Production = GitHub `production` → `:3003` / newprod. The branch/host mapping remains valid.

> Sections §1–§3 below are historical where they conflict with the 2026-10-14 Owner correction above.

## Current environment table — 2026-10-14

| | Staging | Production |
|---|---|---|
| Host | `staging.iflux.vn` | `iflux.vn` |
| GitHub branch | `staging` | `production` |
| CI/CD workflow | `.github/workflows/deploy-staging.yml` | `.github/workflows/deploy-production.yml` |
| API runtime | `:3002` | `:3003` |
| Database | `iflux_staging` | `iflux_production_next` |

The remaining old diagrams, tables and rules in this document are kept as history. Treat every statement that says Production cannot be deployed, that only Staging is active, or that `production.iflux.vn` is the active Production target as **OUTDATED**.

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

Owner Worktree (iFLUX_P1 · staging)
              │
              ▼
          GitHub / staging
              │
              ▼
              CI
              │
              ▼
┌───────────────────────────┐
│  staging.iflux.vn          │
│  STAGING 1 — kênh duy nhất │
│  Verification → Production │
│  Gate (chưa mở)            │
└───────────────────────────┘

production.iflux.vn (Staging 2): đã đóng kênh triển khai 17/08/2026.
Không còn trong sơ đồ deploy.
```

## 2. Bảng phân biệt nhanh

| | `iflux.vn` | `staging.iflux.vn` | `production.iflux.vn` |
|---|---|---|---|
| Tên gọi | **Live Production** | Staging 1 | Staging 2 |
| Có phải Production thật? | ✅ CÓ — user thật đang dùng | ❌ Không | ❌ Không (dù tên miền có chữ "production") |
| Được SSH/deploy? | 🔒 **CẤM** (chỉ đọc/audit) | ✅ Được — kênh duy nhất | ❌ Đóng kênh (17/08/2026) |
| Nguồn code | Filesystem trực tiếp, KHÔNG qua Git (rsync tay lịch sử) | GitHub branch `staging` → CI/CD atomic release | Kênh `staging-2` đã đóng — không deploy tiếp |
| Database | `iflux` (dữ liệu thật) | `iflux_staging` (snapshot 1 lần từ Production 14/08, KHÔNG sync liên tục) | `staging_2` (đổi tên từ `iflux_newprod` ngày 16/08; 8 bảng: định danh quản trị + người dùng) |
| Trạng thái hiện tại | LIVE, ổn định | PARTIALLY VERIFIED (xem doc `13`) | Kênh đóng — không triển khai tiếp |
| Vai trò tiếp theo | Giữ nguyên tới Production Gate | Nơi làm việc + verify trước Production | Không còn mục tiêu triển khai |

## 3. Quy tắc bắt buộc (không có ngoại lệ)

1. **`iflux.vn` = Protected Live Environment.** SSH vào server vẫn kỹ thuật CÓ THỂ chạm được path Production (`/var/www/iflux/production`, `/var/iflux/backend`) vì hiện tại 3 môi trường chung 1 server — nhưng đây là **giới hạn kỹ thuật**, không phải cho phép. Quy tắc hành vi là: **không bao giờ chủ động ghi/thay đổi path đó.**
2. Deploy/dev/test **chỉ** trên Staging 1 (`staging.iflux.vn`). Worktree: `iFLUX_P1` · branch `staging`.
3. `production.iflux.vn` là hostname lịch sử của Staging 2 — **đừng nhầm với Production thật**. Không phải kênh deploy.
4. Muốn biết chi tiết kỹ thuật (path, credential, sudoers, CI/CD workflow) — đọc `14 - SSH ↔ Deployment Boundary Policy.md`.
5. Muốn biết Production cũ khác Staging 1 ở đâu — đọc `13 - Production ↔ Staging Baseline Verification Report.md`.
6. Muốn deploy vào Production thật (sau này) — phải qua **Production deployment flow riêng + Production Gate riêng** (chưa mở, chưa có SoT).
7. 🔒 **GitHub là kênh duy nhất** (16/08/2026). Deploy = đẩy commit lên branch `staging` (v1.5, 17/08). Không `staging-2`. Chi tiết: `docs/SoT — Deployment.md` AMENDMENT v1.5.

## Liên quan

- `docs/SoT — Deployment.md` — quy trình deploy (v1.5: chỉ Staging 1).
- `.cursor/rules/ssh-deployment-boundary.mdc` — rule tự động nhắc Agent mỗi session.
- `Product Backlogs/120826_pending_Git_Deployment_Process_Reconstruction/` — toàn bộ lịch sử quyết định (Plan 07, Reconstruction Plan 12, Verification Report 13, Boundary Policy 14).
