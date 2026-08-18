# 14 — SSH ↔ Deployment Boundary Policy (Owner Directive, 2026-08-14)

**Trạng thái: LOCKED — SoT cho mọi thao tác SSH/deploy kể từ ngày ban hành.**
**Nguồn:** Chỉ thị trực tiếp Owner trong chat, ngay sau `13 - Production ↔ Staging Baseline Verification Report.md` và khi bắt đầu Phase 3 (dựng `production.iflux.vn`).

---

## 1. Thay đổi cốt lõi

| | Trước đây | Từ giờ |
|---|---|---|
| Đường deploy vào `iflux.vn` | Local/Cursor → SSH → Production server → LIVE (sửa trực tiếp) | **Loại bỏ triệt để.** Không SSH deploy/sửa/reset/checkout/migrate trực tiếp vào Production nữa |
| Vai trò `iflux.vn` | Production đang chạy, vẫn là nơi sửa trực tiếp khi cần | **Protected Live Environment** — chỉ đọc/tham chiếu, không phải development target |
| Phạm vi SSH được phép | Toàn server (bao gồm Production) | **Chỉ Staging 1 (`staging.iflux.vn`) và Staging 2 (`production.iflux.vn`)** |

## 2. Định danh 2 môi trường được phép thao tác

- **Staging 1** — `staging.iflux.vn`: Reference / Development / Verification, giữ baseline đã dựng ở Plan 12 + `13 -...`.
- **Staging 2** — `production.iflux.vn`: Clean Rebuild target, trắng tinh, xây lại từ đầu. **Hostname `production.iflux.vn` hiện tại chỉ là tên miền của Staging 2 — KHÔNG phải Live Production.**

`iflux.vn` (Live Production) đứng ngoài cả 2 — không nằm trong phạm vi SSH/deploy được phép nữa.

## 3. Giới hạn kỹ thuật thật (phải nói rõ, không che giấu)

Staging 1, Staging 2 và Production hiện đang **chung 1 physical server** (`103.154.177.157`) và thao tác SSH hiện dùng **1 credential root duy nhất** — về mặt kỹ thuật, credential đó vẫn CÓ QUYỀN chạm vào path Production (`/var/www/iflux/production`, `/var/iflux/backend`, PM2 `iflux-api`).

- Ranh giới ở tài liệu này là **ranh giới hành vi/quy trình (procedural boundary)**, được Agent tự giới hạn: chỉ dùng credential SSH cho path Staging 1 (`/var/www/iflux/staging*`, `/var/iflux/backend-staging*`) và Staging 2 (`/var/www/iflux/newprod*`, `/var/iflux/backend-newprod*`, DB `iflux_newprod`), **tuyệt đối không dùng cho path Production** (`/var/www/iflux/production`, `/var/iflux/backend`, DB `iflux`, PM2 `iflux-api`).
- Đây **không phải** ranh giới hệ thống ép buộc bằng OS-level ACL/firewall — nếu Owner muốn tách credential thật (SSH key riêng chỉ có quyền trên path Staging, hoặc `command=` forced-command trong `authorized_keys`, hoặc user riêng không phải root), cần một hạng mục kỹ thuật riêng — **chưa thực hiện**, chờ Owner quyết định có cần hay không.
- Không có cơ chế tự động nào (cron/systemd/GitLab CI/webhook) từng được audit thấy deploy vào Production (xem `11 - Legacy GitLab-Staging Deployment Path Audit.md`) — đường duy nhất từng chạm Production là **SSH thao tác tay**, và đó chính là đường bị loại bỏ ở chỉ thị này.

## 4. Trạng thái tuân thủ hiện tại (đã verify)

| Kiểm tra | Kết quả |
|---|---|
| `deploy-staging.yml` (CI Staging 1) có path/credential nào trỏ vào Production? | Không — chỉ `releases-staging/`, `backend-staging/`, port 3002, `iflux-api-staging` |
| `deploy-production-new.yml` (CI Staging 2) có path/credential nào trỏ vào Production? | Không — chỉ `releases-newprod/`, `backend-newprod/`, `iflux-newprod-deploy-switch.sh` (scoped sudo, hardcode path Staging 2 only) |
| Sudoers scope (`iflux-deploy`) có quyền gì trên Production? | Không — 2 entry `/etc/sudoers.d/iflux-deploy-staging` và `/etc/sudoers.d/iflux-deploy-newprod`, mỗi entry chỉ NOPASSWD cho đúng 1 script riêng của từng môi trường, không có entry nào cho Production |
| Cron/systemd/webhook nào deploy vào Production? | Không (đã audit `11 -...`) |
| `staging.env` hiện tại có credential Production riêng biệt không? | Đang dùng chung 1 root credential cho cả server (giới hạn kỹ thuật đã nêu ở mục 3) — đã cập nhật comment đầu file xác nhận **chỉ dùng cho Staging 1/2** |

## 5. Sự cố liên quan (ghi nhận minh bạch)

Trong quá trình dựng Staging 2 (Phase 3), Agent vô tình xoá file `infra/staging/staging.env` qua `git clean -fdx` khi tạo orphan branch `production-clean`. Đã khôi phục `DEPLOY_HOST/PORT/USER/PASSWORD` từ context hội thoại; **không khôi phục được** `CF_API_TOKEN`/`CF_ZONE_ID` (Cloudflare). Owner xác nhận **không phải blocker** vì workflow SSH cũ (đường deploy Production) đã bị loại bỏ theo chỉ thị này — Owner sẽ cấp token Cloudflare mới khi cần.

## 6. Deployment architecture mục tiêu (giai đoạn rebuild hiện tại)

```text
Staging 1 (staging.iflux.vn)
      ↓
   GitHub
      ↓
   CI/CD
      ↓
Staging 2 (production.iflux.vn)
```

```text
Live Production (iflux.vn)
      ↓
     LIVE
      ↓
  KHÔNG ĐỤNG TỚI
```

Sau này khi Staging 2 đủ điều kiện trở thành Staging/Production chính thức (qua Cutover/Production Gate riêng — chưa mở):

```text
GitHub → Staging → Verification → Production deployment flow (riêng, có Gate) → Live Production
```

## 7. Invariant (áp dụng ngay, không cần nhắc lại mỗi lần)

> Không có thao tác development/deployment nào được SSH trực tiếp vào hoặc thay đổi Live Production `iflux.vn`.
> Mọi hoạt động hiện tại chỉ thực hiện trên Staging 1 và Staging 2.
> Nếu cần đọc thông tin Production để đối chiếu/audit (read-only, không sửa) — vẫn được phép, vì đây là hoạt động audit/evidence, không phải deployment/development. Bất kỳ lệnh nào có khả năng **thay đổi trạng thái** Production (write, delete, restart process, migration, checkout) đều bị chặn tuyệt đối kể từ chỉ thị này.

## Việc còn mở (không block, xử lý khi Owner rảnh)

- Owner cấp `CF_API_TOKEN` + `CF_ZONE_ID` mới cho Cloudflare (đã note ở mục 5).
- Xác nhận với Owner có cần tách SSH credential thật (key riêng chỉ có quyền trên path Staging) hay chấp nhận ranh giới procedural như hiện tại (mục 3).
- Rule tại cấp Cursor/user ("iFlux frontend: SỬA TRỰC TIẾP trên Production... KHÔNG làm Staging mặc định") hiện **xung đột** với chỉ thị này — đây là user-level rule Agent không có quyền tự sửa; Owner có thể cập nhật lại nếu muốn đồng bộ.
