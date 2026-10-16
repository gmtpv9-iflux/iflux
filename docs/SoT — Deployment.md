# SoT — Deployment

| | |
|--|--|
| **Document ID** | SoT-DEPLOY-001 |
| **Version** | 3.0 — rewrite toàn bộ, bỏ hẳn mô hình rsync/SSH-era + GitLab (lỗi thời từ trước 2026-08-16) |
| **Status** | 🔒 Current Source of Truth |
| **Ngày** | 2026-10-16 — rewrite theo yêu cầu Owner: tài liệu chỉ phản ánh đúng thực tế đang chạy, xoá hẳn phần ngoài phạm vi thay vì đánh dấu lỗi thời |
| **Nguồn** | Owner directive 2026-10-16: chỉ 2 môi trường — Staging (`staging.iflux.vn`) · Production (`iflux.vn`) — cả hai chạy qua GitHub CI/CD. Không còn GitLab, không còn rsync/SSH deploy tay, không còn "Staging 1/2"/"Live Production". |
| **Đọc cùng** | `docs/SoT — Environment Map.md` (bảng facts 2 môi trường) · `.cursor/rules/ssh-deployment-boundary.mdc` (ranh giới SSH) |

---

## 1. Mô hình deploy duy nhất

```text
Local (Agent/Owner) → commit → push GitHub branch
   ├─ push "staging"    → .github/workflows/deploy-staging.yml    → staging.iflux.vn
   └─ push "production" → .github/workflows/deploy-production.yml → iflux.vn
```

**Deploy = push đúng branch GitHub, để CI/CD tự chạy.** Không có cách deploy nào khác. Không rsync, không scp, không sửa file trực tiếp trên server để đổi code chạy thật.

Push lên bất kỳ branch khác (`main`, `feat/*`, …) **không** trigger deploy gì cả — `main` hiện là nhánh lưu trữ cũ, không còn được CI theo dõi, không phải điều kiện hay đại diện cho trạng thái Production.

---

## 2. CI/CD pipeline thật (đọc trực tiếp từ workflow)

Cả `deploy-staging.yml` và `deploy-production.yml` chạy trên self-hosted runner (label `staging`), theo đúng 1 mô hình atomic release:

| Bước | Staging | Production |
|---|---|---|
| 1. Kiểm tra trước deploy | `build-web-bundle.mjs --check` + `sync-js-versions.mjs --check` (chặn deploy nếu CSS bundle/version cache lệch) | giống Staging |
| 2. Build frontend release mới | `cp -a` toàn bộ `User_Web, Admin_Design_system, design_system, platform, modules, adapters, ui_tooling, vendor, patterns` → `/var/www/iflux/releases-staging/<release-id>/` | giống, nhưng **không copy `patterns/`** (Production chỉ giữ code chạy thật — Owner 2026-10-16) → `/var/www/iflux/releases-production/<release-id>/` |
| 3. Build backend release mới | `cp -a backend/.` + `npm install --omit=dev` → `/var/iflux/backend-staging/releases/<release-id>/` | → `/var/iflux/backend-production/releases/<release-id>/` |
| 4. Atomic switch (script riêng, chạy `sudo -n`) | `iflux-staging-deploy-switch.sh` | `iflux-production-deploy-switch.sh` |
| 5. Migrate (062+ only) | cùng script, cờ `--migrate-only` | cùng script, cờ `--migrate-only` |
| 6. Health check | `curl :3002/health` + `https://staging.iflux.vn/admin/login` | `curl :3003/health` + `https://iflux.vn/admin/login`, `/tin-tuc`, `/design_system/05_templates/templates.json` |
| 7. Dọn release cũ | giữ 5 bản gần nhất, xoá phần còn lại | giữ 5 bản gần nhất |

`release-id` = `<timestamp>-<12 ký tự đầu SHA commit>` — luôn truy được chính xác release nào tương ứng commit nào.

### 2.1 Switch script làm gì (đọc trực tiếp `infra/staging-1/` + `infra/production/`)

- **Migration tự động chỉ áp dụng file `062_*` trở lên** (`06[2-9]_*|0[7-9][0-9]_*|[1-9][0-9][0-9]_*`). File `001`–`061` **không bao giờ** được replay qua pipeline — đây là chủ ý (baseline snapshot cũ), không phải thiếu sót. Mỗi file mới apply được ghi vào `schema_migrations`.
- **Symlink switch, không rsync-in-place:** `ln -sfn <release-dir> /var/www/iflux/staging|production` và tương tự cho backend `current`/live — mỗi lần deploy là **thư mục mới hoàn toàn**, không ghi đè release cũ.
- **PM2:**
  - Staging: `pm2 restart iflux-api-staging` (tiến trình PM2 được tạo 1 lần, biến môi trường nằm trong `ecosystem.staging.config.js` tại `/home/iflux-app/` — **không** nạp qua file `.env`, restart không đọc lại gì mới ngoài code).
  - Production: **xoá rồi tạo lại** tiến trình (`pm2 delete` + `pm2 start src/server.js --name iflux-api-production --cwd <release>`) — vì vậy Production **luôn** load `.env` thật qua `dotenv` ở mỗi lần deploy.
- **`.env` Production là symlink bền, tự động:** script tạo `ln -sfn /var/iflux/backend-production/shared/.env <release>/.env` **trong chính switch script** — nghĩa là `.env` Production nằm ngoài cây release, sống sót qua mọi lần deploy. ✅ Verified bằng cách đọc trực tiếp `infra/production/iflux-production-deploy-switch.sh`.
- **`.env` Staging KHÔNG có cơ chế tương tự** — switch script Staging không có dòng nào tạo/symlink `.env`. 🔴 **Khoảng trống hạ tầng đã xác nhận (2026-10-16):** nếu cần thêm biến môi trường mới cho Staging (ví dụ `OPENAI_API_KEY`), phải sửa trực tiếp `/home/iflux-app/ecosystem.staging.config.js` trên server rồi `pm2 restart iflux-api-staging --update-env` (hoặc `pm2 reload`) — sửa `.env` trong release dir sẽ **mất ở lần deploy kế tiếp** vì release dir luôn là git checkout mới.
- **Guard chặn nhầm môi trường:** cả 2 script đều tự chặn (exit 1) nếu nginx/switch source trỏ nhầm sang path/port của môi trường kia (ví dụ Production refuse nếu thấy `127.0.0.1:3002` hoặc `/var/www/iflux/staging`).

---

## 3. Bảng path/port/DB (✅ verified qua SSH 2026-10-16 — xem thêm Environment Map)

| | Staging | Production |
|---|---|---|
| Domain | `staging.iflux.vn` | `iflux.vn` |
| Frontend live | `/var/www/iflux/staging` (symlink) | `/var/www/iflux/production` (symlink) |
| Frontend releases | `/var/www/iflux/releases-staging/<id>` | `/var/www/iflux/releases-production/<id>` |
| Backend live | `/var/iflux/backend-staging/current` (symlink) | `/var/iflux/backend-production/current` (symlink) |
| Backend releases | `/var/iflux/backend-staging/releases/<id>` | `/var/iflux/backend-production/releases/<id>` |
| `.env` thật | `ecosystem.staging.config.js` (`/home/iflux-app/`) — không dùng file `.env` | `/var/iflux/backend-production/shared/.env` (symlink vào mỗi release) |
| PM2 process | `iflux-api-staging` (user `iflux-app`) | `iflux-api-production` (user `root`) |
| API port | `:3002` | `:3003` |
| Database | `iflux_staging` | `iflux_production_next` |
| Storage | `/var/iflux/storage-staging` | theo `STORAGE_LOCAL_PATH` trong `.env` Production |

---

## 4. Forbidden — không được làm

| ID | Cấm | Vì sao |
|----|-----|--------|
| **F-01** | Deploy code bằng rsync/scp/sửa file trực tiếp trên server | Duy nhất 1 đường: push GitHub → CI |
| **F-02** | `git init`/`git pull`/`git checkout` trên server để "deploy" | Server không phải git worktree; release = `cp -a` từ CI runner |
| **F-03** | Thao tác với GitLab (remote, clone, MR...) | Đã gỡ hoàn toàn khỏi quy trình từ 2026-08-16, chặn ở tầng git config máy |
| **F-04** | Copy secret (`.env`, `staging.env`, token DB/CF...) vào repo/chat/SoT | Secret chỉ đọc tại chỗ vận hành, không log giá trị |
| **F-05** | Đổi path layout (`releases-*`, `backend-*`, `/var/iflux/storage*`) ngoài Owner + cập nhật SoT này | Switch script có guard cứng theo path, đổi path không đồng bộ = deploy fail hoặc ghi nhầm môi trường |
| **F-06** | Chạy `npm run migrate` tay (full queue) trên Staging/Production | Sẽ replay toàn bộ `001`–`061` và vỡ schema — chỉ dùng switch script `--migrate-only` (chỉ áp `062+`) |
| **F-07** | In IP origin server trong hội thoại/tài liệu công khai | Chỉ dùng tên miền (`iflux.vn`, `staging.iflux.vn`) |
| **F-08** | SSH ghi/đổi code, DB, hoặc file deploy runtime ngoài phạm vi "an toàn" (xem `.cursor/rules/ssh-deployment-boundary.mdc`) | SSH chỉ cho chẩn đoán/đọc, cache purge, restart 1 service treo — mọi thay đổi RUNTIME CODE vẫn chỉ qua CI |

---

## 5. Rollback (as-is — không có tooling tự động)

Không có script rollback riêng. Thực tế đang dùng:

1. **Rollback bằng release cũ còn giữ lại** (pipeline giữ 5 bản gần nhất ở cả frontend/backend): gọi lại switch script với `release-id` cũ còn trên đĩa — symlink trỏ lại thư mục đó, restart PM2. Chưa có wrapper tiện dụng cho việc này; làm tay qua SSH "an toàn" (đọc path, đổi symlink, restart) khi Owner xác nhận cần rollback khẩn.
2. **Rollback bằng revert commit:** `git revert` commit lỗi → push lại đúng branch (`staging`/`production`) → CI tự tạo release mới từ code đã revert. Đây là đường **chuẩn, nên dùng trước** vì giữ lịch sử Git sạch và đi đúng pipeline.
3. **Migration lỗi:** không có down-migration trong runner. Sự cố migration luôn xử lý bằng **Forward Fix** (viết migration mới sửa tiếp), không rollback schema bằng tay.

---

## 6. Lịch sử (không còn là quy trình hiện hành — giữ 1 dòng để biết gốc)

Trước 2026-08-16, hệ thống dùng GitLab + rsync/SSH tay thẳng vào 1 server production duy nhất (không atomic release, không CI). Toàn bộ mô hình đó đã ngừng hoàn toàn và được thay bằng GitHub Actions + atomic release như mô tả ở trên. Stack "production cũ" trước điểm cắt 2026-08-16 đã được retire hoàn toàn ngày 2026-10-03, không còn tồn tại trên server — không cần tránh nhầm với path nào nữa.

---

**Hết SoT — Deployment v3.0.**
