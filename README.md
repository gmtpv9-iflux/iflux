# iFlux — `production.iflux.vn` (Clean Rebuild Target)

Đây là branch **`production-clean`** — nền tảng Git deployment rỗng cho `production.iflux.vn`, theo quyết định Owner (14/08/2026):

> Sau `13 - Production ↔ Staging Baseline Verification Report.md` (PARTIALLY VERIFIED), task migration "Production cũ → Staging" đã CLOSED. `production.iflux.vn` là **clean rebuild target** — KHÔNG copy nguyên trạng Production cũ (`iflux.vn`), KHÔNG copy nguyên trạng Staging (`staging.iflux.vn`), KHÔNG restore database cũ, KHÔNG copy `.env`/secrets/PM2 ecosystem/Nginx config cũ.

## Trạng thái hiện tại

- Application: **rỗng** — chỉ có 1 trang tĩnh placeholder (`web/index.html`), không phải sản phẩm thật.
- Database: **rỗng** — `iflux_newprod`, 0 bảng, chưa chạy migration nào.
- Runtime: **chưa có** — chưa có PM2 process, chưa có backend nào chạy trên `production.iflux.vn`.
- Configuration: **chưa có** — chưa có `.env`/secrets nào được cấu hình cho môi trường này ngoài credential DB rỗng lưu riêng trên server (không có trong Git).

## Deploy path

`.github/workflows/deploy-production-new.yml` — trigger khi push vào branch `production-clean`, chạy trên self-hosted runner (label `staging`, cùng máy vật lý phục vụ cả Staging và Production-new), atomic release qua `iflux-newprod-deploy-switch.sh` (sudo scoped hẹp, chỉ đụng `/var/www/iflux/newprod` + `/var/iflux/backend-newprod/current`, không bao giờ chạm Production cũ hoặc Staging).

## Rebuild tiếp theo (Phase 5)

Mỗi capability trước khi đưa vào đây phải qua: `SoT → Contract → Implementation trên Staging → Audit → Test → PASS → Promote`. Không copy cả hệ thống từ Staging hoặc Production cũ vào đây để tiết kiệm thời gian.

Chi tiết đầy đủ: xem `Product Backlogs/120826_pending_Git_Deployment_Process_Reconstruction/` trong branch `staging` (repo Git đầy đủ history nằm ở đó — branch này (`production-clean`) chỉ chứa chính xác những gì được deploy tới `production.iflux.vn`).
