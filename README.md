# iFlux — branch `staging-2`

Branch này chứa **chính xác những gì được deploy tới `production.iflux.vn`** (hostname hiện tại của môi trường Staging 2). Không chứa tài liệu, backlog hay lịch sử phân tích — những thứ đó nằm ở branch `staging`.

## Cấu trúc

```
apps/            ứng dụng — mỗi ứng dụng sở hữu trang và CSS của riêng nó
  web/admin/       Admin: App Shell, Đăng nhập, Quản lý người dùng, Thư viện Widget
packages/        mã dùng chung giữa nhiều ứng dụng
  design-system/   token, foundation, layout, component — nguồn sự thật về giao diện
services/        dịch vụ chạy nền
  api/             REST API quản trị (Node/Express)
database/        migration, đánh số tuần tự, chạy theo thứ tự
scripts/         công cụ dựng + deploy-switch Staging 2
infra/staging-2/   vhost nginx Staging 2 (CI áp, không SSH sửa tay)
```

Ranh giới quan trọng: `packages/design-system/` chỉ chứa thứ **nhiều màn hình** dùng chung. CSS của một module hay một trang nằm cạnh chính trang đó trong `apps/`. Đây là thứ giữ cho bundle chung không phình theo số module.

## Dựng và chạy

```bash
bash scripts/build-web.sh     # apps/ + packages/  →  dist/
```

`dist/` là sản phẩm dựng, không commit, CI dựng lại mỗi lần deploy. Bước này nội tuyến toàn bộ `@import` của `packages/design-system/index.css` thành một file `/assets/ds.css`, nên mỗi trang chỉ nạp 1–2 file CSS thay vì kéo cả cây import.

Backend:

```bash
cd services/api && npm install && npm start
```

## Deploy

Push vào `staging-2` kích hoạt `.github/workflows/deploy-production-new.yml` trên self-hosted runner: dựng `dist/`, tạo release theo timestamp, atomic switch qua `iflux-newprod-deploy-switch.sh` (frontend + backend + vhost `infra/staging-2/nginx.conf`).

Workflow chỉ đụng `/var/www/iflux/newprod`, `/var/iflux/backend-newprod/current`, và `/etc/nginx/sites-available/production.iflux.vn.conf`. **Không bao giờ** chạm Production cũ (`/var/www/iflux/production`, `/var/iflux/backend`, `iflux-production.conf`, `iflux-prod-app.conf`) hay Staging 1 (`/var/www/iflux/staging`).

Database: `staging_2` (đổi tên từ `iflux_newprod` ngày 16/08/2026).

## Nguyên tắc

Mỗi capability trước khi vào đây phải qua: SoT → Contract → Implementation → Audit → Test → PASS. Không copy nguyên khối từ Staging 1 hay Production cũ để tiết kiệm thời gian — mã chết, mã nhân bản và hardcode không được mang sang.

Tài liệu đầy đủ (BRD, SoT, audit, kế hoạch triển khai) nằm ở branch `staging`, thư mục `Product_Backlogs_New/` và `docs/`.
