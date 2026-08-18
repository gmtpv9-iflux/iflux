# iFlux

Repository chính thức: **`github.com/gmtpv9-iflux/iflux`** — GitHub là nơi duy nhất. GitLab đã bị cắt khỏi quy trình ngày 16/08/2026 và bị chặn ở tầng git config lẫn SSH; không nối lại.

## Branch và môi trường

| Branch | Môi trường | Deploy |
|---|---|---|
| `staging` | Canonical Staging — `staging.iflux.vn` · `:3002` | `.github/workflows/deploy-staging.yml` |
| `production` | Canonical Production — `iflux.vn` / `production.iflux.vn` · `:3003` | `.github/workflows/deploy-production-new.yml` |

Branch `staging` giữ mã nguồn Staging **và toàn bộ tài liệu** (`docs/`, `Product Backlogs/`). Branch `production` là kênh Git của Production Runtime (worktree `Staging_2/`). Không còn branch `staging-2`.

## Production

`iflux.vn` là Canonical Production Runtime (`:3003` / `iflux_production_next` / `storage-newprod`). Deploy = push `production` → CI. Không rsync, không SSH đẩy mã.

`/var/www/iflux/production` + `/var/iflux/backend` + `/var/iflux/storage` + DB `iflux` = **Legacy backup footprint** (process `:3001` đã retire) — không phải Production đang chạy.

Chi tiết: [`docs/SoT — Deployment.md`](docs/SoT%20—%20Deployment.md) và [`docs/SoT — Environment Map (Live Production, Staging 1, Staging 2).md`](docs/SoT%20—%20Environment%20Map%20(Live%20Production,%20Staging%201,%20Staging%202).md).

## Deploy nghĩa là gì

Đẩy commit lên đúng branch trên GitHub rồi để CI/CD chạy. Không còn nghĩa nào khác.
