# SoT — Environment Map

| | |
|--|--|
| **Document ID** | SoT-ENVMAP-001 |
| **Version** | 2.0 — rewrite, bỏ toàn bộ khung Gitlab/SSH-era cũ |
| **Status** | 🔒 Current — Owner correction 2026-10-16 |
| **Ngày** | 2026-08-14 · amend 2026-08-17 · amend 2026-08-19 · amend 2026-10-09 · amend 2026-10-14 · **rewrite 2026-10-16** |
| **Nguồn** | Owner directive 2026-10-16: chỉ còn 2 môi trường (Production, Staging), tất cả qua GitHub CI/CD. Các khái niệm "Staging 1"/"Staging 2"/"Live Production" và luồng GitLab là lịch sử, không còn áp dụng — xoá hẳn khỏi tài liệu thay vì chỉ đánh dấu lỗi thời, để tránh nhầm lẫn về sau. |

## Mô hình hiện tại

```text
GitHub (duy nhất — không còn GitLab)
   │
   ├─ branch `staging`    → CI/CD (.github/workflows/deploy-staging.yml)    → Staging
   └─ branch `production` → CI/CD (.github/workflows/deploy-production.yml) → Production
```

Chỉ có **2 môi trường**, không hơn không kém. Không có "Staging 1", "Staging 2", hay "Live Production" — những tên đó thuộc 1 giai đoạn cũ (trước 2026-08-16) khi hệ thống còn chạy qua GitLab + SSH rsync tay và từng có 3 môi trường chung 1 server. Giai đoạn đó đã chấm dứt hoàn toàn; không còn kênh GitLab nào tồn tại (remote đã gỡ khỏi repo, URL `gitlab.com` bị chặn ở tầng git config máy).

## Bảng kỹ thuật

| | Staging | Production |
|---|---|---|
| Host | `staging.iflux.vn` | `iflux.vn` |
| GitHub branch | `staging` | `production` |
| CI/CD workflow | `.github/workflows/deploy-staging.yml` | `.github/workflows/deploy-production.yml` |
| API runtime | `:3002` | `:3003` |
| Database | `iflux_staging` | `iflux_production_next` |
| Ai dùng | Dev/test, verify trước khi lên Production | User thật |

## Quy tắc

1. **Mọi thay đổi code chạy trên 2 môi trường này đều qua Git → CI/CD.** Không SSH/rsync/sửa file trực tiếp trên server để deploy code.
2. Luồng chuẩn: làm việc trên `staging` → verify trên Staging → merge/promote sang `production` → CI tự deploy Production.
3. **Ngoại lệ duy nhất cho SSH trên Production** (Owner Directive 2026-10-09, chi tiết đầy đủ ở `.cursor/rules/ssh-deployment-boundary.mdc`): chỉ cho tác vụ AN TOÀN — chẩn đoán/đọc (log, process, disk/CPU, health check), cache purge, restart 1 service đang treo/crash. "An toàn" = không ghi code, không đổi DB, không đụng file deploy runtime. Mọi thay đổi RUNTIME CODE vẫn chỉ qua CI.
4. Worktree làm việc: `/Users/mac/Documents/Productions/iFLUX_P1`, branch `staging` cho công việc thường ngày.

## Liên quan

- `docs/SoT — Deployment.md` — quy trình deploy chi tiết (rewrite v3.0 ngày 2026-10-16, đồng bộ hoàn toàn với bảng trên — không còn "Staging 1/2"/GitLab/rsync).
- `.cursor/rules/ssh-deployment-boundary.mdc` — rule tự động nhắc Agent mỗi session về ranh giới SSH/deploy.
- `Product Backlogs/120826_pending_Git_Deployment_Process_Reconstruction/` — lịch sử quyết định đầy đủ (giữ để tham khảo, không phải SoT hiện hành).
