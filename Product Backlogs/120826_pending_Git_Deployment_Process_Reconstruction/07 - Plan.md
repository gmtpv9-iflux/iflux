# 07 — Plan (Gate 1 → Gate 5 Execution Roadmap)

| | |
|--|--|
| **Input** | `04` (Owner Architecture Decisions), `05` (Audit A→G), `06` (Gate 1 SoT + Solution — CLOSED) |
| **Gate hiện tại** | Gate 1 ✅ CLOSED → chuẩn bị Gate 2 (Staging Implementation) |
| **Implementation** | **`NOT AUTHORIZED`** — tài liệu này là **kế hoạch**, chưa phải lệnh thực thi. Mỗi Phase dưới đây cần Owner nói "bắt đầu Phase N" mới được thực hiện (trừ khi Owner chỉ định chạy liên tục nhiều Phase). |
| **Nguyên tắc bao trùm** | Legacy SSH/manual deployment **chỉ decommission tại Production Cutover (Phase 8)**, sau khi pipeline mới đã PASS đầy đủ ở Staging và Production dry-run. Trong suốt Phase 1→7, quy trình cũ (`Deployment.md` v1.2) **vẫn là con đường hợp lệ duy nhất** nếu cần fix gấp Production. |

---

## Phase 0 — Prerequisites (cần Owner cung cấp trước khi Phase 1 có thể chạy phần liên quan GitHub)

Agent hiện tại **không có** quyền truy cập GitHub của Owner (đã kiểm tra: `gh` CLI chưa cài, không có token nào cấu hình sẵn trên máy).

| # | Cần gì từ Owner | Dùng cho Phase nào |
|---|---|---|
| P0-1 | Xác nhận **tên chính xác** GitHub repo đích (org/user + repo name) — Owner nói "đã có GitHub account/repository iFlux rồi" nhưng Agent cần tên cụ thể để trỏ remote | Phase 3 |
| P0-2 | Cấp quyền cho Agent thao tác trên repo đó — **1 trong 2 cách**: (a) Owner tạo **Personal Access Token (fine-grained, scope: repo — Contents, Pull requests, Administration để set branch protection/environment)** và cung cấp cho Agent qua kênh an toàn (không dán vào file repo); hoặc (b) Owner tự thực hiện các bước "GitHub-side" (tạo branch protection, Environment, Required Reviewer) theo hướng dẫn chính xác Agent cung cấp, Agent chỉ làm phần local (`git push`) | Phase 3, 5, 6 |
| P0-3 | Xác nhận: Runner sẽ cài trên **server hiện tại (103.x)** hay Owner muốn máy khác — mặc định theo audit `05.D` là server hiện tại (đã xác minh outbound thông suốt) | Phase 4 |
| P0-4 | Đặt tên deployment identity — mặc định đề xuất `iflux-deploy` (Owner có thể đổi tên) | Phase 4 |
| P0-5 | Retention policy cụ thể cho `/releases/` — mặc định đề xuất **giữ 5 release gần nhất** (đủ để rollback vài bước, không tích lũy vô hạn) — Owner xác nhận số hoặc chỉnh | Phase 3 |

**Agent sẽ dùng mặc định ở P0-3/P0-4/P0-5 nếu Owner không phản hồi khác trước khi Phase liên quan bắt đầu — nhưng KHÔNG tự quyết P0-1/P0-2** (bắt buộc chờ, vì đây là quyền truy cập thật của Owner).

---

## Sequencing tổng quan

```text
Phase 1 — Reconciliation Audit (C.5)              [W3]
Phase 2 — GitHub Migration (mirror + verify)       [W2]
Phase 3 — Branch Model + Protection + Environment  [W2/W4]
Phase 4 — Staging Isolation (BR-23)                [W6]   ◄── PHẢI PASS trước Phase 5
Phase 5 — Staging CI/CD (Runner + Workflow)        [W6]
Phase 6 — Production CI/CD (build + dry-run, KHÔNG cutover) [W4/W7]
Phase 7 — Production Migration Plan (Owner approve) [Gate 3]
Phase 8 — Production Cutover (decommission legacy TẠI ĐÂY) [Gate 4/W5/W7]
Phase 9 — Final Security/Deployment Audit           [W8/Gate 5]
```

Mỗi Phase kết thúc bằng 1 **Exit Gate** — không sang Phase kế nếu Exit Gate chưa PASS (đúng tinh thần Layer Gate đã áp dụng ở task SEO trước đó).

---

## Phase 1 — Reconciliation Audit (C.5 Phase 1: Inventory + Classify, CHƯA commit)

**Mục tiêu:** trả lời chính xác divergence giữa Production ↔ Local ↔ Git HEAD, phân loại A/B/C/D, để Owner review trước khi cho phép tạo baseline commit.

### Bước thực hiện

1. Lấy đầy đủ danh sách 382 file Production đã đổi (đã có từ audit `05.B`, cần refresh lại vì thời gian đã trôi) + 339 file uncommitted Local (refresh).
2. Với mỗi file, agent tự phân loại **đề xuất** (không tự quyết):
   - **A (chắc chắn đang chạy Production)** — file có trên Production, nội dung khớp/không khớp Git, đã verify qua URL/API thật đang trả về đúng behavior này.
   - **B (chắc chắn là intended current work)** — file uncommitted Local có liên hệ rõ với 1 task đã hoàn thành có evidence (ví dụ: toàn bộ 3 gói SEO L0-L7, cleanup P0 code-version) — agent trích dẫn đúng Product Backlog task đã đóng làm bằng chứng.
   - **C (legacy/unwanted)** — ví dụ tàn dư Sidebar Scroll Behavior đã bị Owner quyết định bỏ ("xóa hết code rác liên quan tới sticky... phục hồi lại trước khi làm task này") — nếu vẫn còn sót trong uncommitted, đây là ứng viên C rõ ràng.
   - **D (chưa xác định)** — bất kỳ file agent không tìm được bằng chứng rõ ràng thuộc A/B/C.
3. Xuất báo cáo `08 - Reconciliation Inventory (Production vs Local vs Git HEAD).md` — bảng đầy đủ theo nhóm A/B/C/D, kèm evidence trích dẫn cho từng nhóm (không chỉ liệt kê tên file).
4. **STOP** — gửi Owner review, đặc biệt nhóm D và bất kỳ mục Owner muốn xem lại trong A/B/C.
5. **Nếu Owner không chấp nhận việc giữ nguyên D mặc định** (đã xảy ra 2026-08-12): Agent phải điều tra sâu từng item D — diff thật (fetch nội dung Production qua `ssh cat` + so bằng checksum trực tiếp, KHÔNG chỉ dựa vào 1 lượt `rsync --checksum` vì có thể có false positive — đã xảy ra thật ở lượt điều tra đầu, xem `08` mục 7.1), ảnh hưởng runtime, evidence (ưu tiên văn bản Plan/SoT đã approve hơn "cái gì đang chạy trên Production"), kết luận KEEP/DISCARD/MERGE/UNRESOLVED cho từng item — không dừng ở "giữ D".
6. Owner approve nội dung baseline (có thể approve từng phần, yêu cầu sửa 1 số mục) — **baseline chỉ gồm Nhóm A + B đã "accepted"** (xem bảng Final ở `08` mục 11); Nhóm C được Owner quyết định riêng (accept/defer); Nhóm D sau điều tra phải resolve về A/B/C hoặc bị Owner explicitly loại khỏi baseline (như case `logo iflux.png`, `shell-url-writer.js` bản Production, `sites-available/iflux-production.conf` — xem `08` mục 8, 7.2, 7.3).
7. **Chỉ sau approve** → tạo **1 commit duy nhất** `chore: establish Git deployment reconciliation baseline` trên nhánh làm việc hiện tại — commit message ghi rõ đây là điểm đồng bộ được Owner xác nhận, không phải lịch sử tái tạo. Commit này **chỉ phản ánh đúng Nhóm A+B đã accepted** — không phải "toàn bộ những gì đang có trên Production hiện tại" (xem `06` Phần H — Production hiện tại = reference, không phải SoT tự động).

### Exit Gate Phase 1

- [ ] Báo cáo `08` đã hoàn thành, mọi file uncommitted + mọi file Production-drift đã được phân loại A/B/C/D có evidence.
- [ ] Mọi item D đã được điều tra sâu (không dừng ở "giữ D") và resolve thành KEEP/DISCARD/MERGE, hoặc Owner explicitly quyết định loại khỏi baseline.
- [ ] Bảng Final A/B/C/D (`08` mục 11) không còn item UNRESOLVED có khả năng ảnh hưởng runtime/deployment correctness.
- [ ] Owner đã review và approve rõ ràng (bằng lời, không suy đoán) — cả bảng Final và Target State (`06` Phần H).
- [ ] Baseline commit đã tạo đúng 1 lần, đúng nội dung đã approve (chỉ Nhóm A+B accepted) — **không có commit nào khác được tạo tự động ngoài commit này**.
- [ ] Working tree sau commit: `git status` sạch (không còn uncommitted ngoài dự kiến).

---

## Phase 2 — GitHub Migration (mirror, giữ history)

**Điều kiện vào:** Phase 1 Exit Gate PASS + Owner đã cung cấp P0-1/P0-2.

### Bước thực hiện

1. `git clone --mirror git@gitlab.com:gm.tpv9/iflux.git iflux-mirror.git` (local, tạm, không đụng working repo).
2. Thêm remote GitHub: `git remote add github git@github.com:<owner>/<repo>.git` (hoặc dùng token HTTPS nếu Owner chọn P0-2 phương án token).
3. `git push --mirror github` — đẩy toàn bộ branch/tag/history (bao gồm baseline commit Phase 1) sang GitHub.
4. **Verify song song, không suy đoán:**
   - Số lượng branch GitHub == số lượng branch GitLab (đối chiếu `git ls-remote --heads` cả hai bên).
   - Số lượng tag GitHub == GitLab.
   - `git log --oneline | wc -l` trên GitHub == GitLab (tính cả baseline commit mới).
   - SHA của commit mới nhất mỗi branch quan trọng (`main`, nhánh hiện tại có baseline) khớp giữa 2 remote.
5. **Không xoá GitLab.** Giữ nguyên, chỉ dùng làm nguồn migrate.

### Exit Gate Phase 2

- [ ] GitHub repo có đầy đủ branch/tag/history — verify bằng số liệu, không suy đoán.
- [ ] GitLab vẫn còn nguyên, chưa bị archive/read-only (chỉ làm ở Phase 8).
- [ ] Chưa có bất kỳ CI/CD nào chạy trên GitHub (chưa thêm workflow) — tránh trigger ngoài ý muốn ngay khi vừa mirror.

---

## Phase 3 — Branch Model + Protection + GitHub Environments

**Điều kiện vào:** Phase 2 Exit Gate PASS.

### Bước thực hiện

1. Tạo 2 branch trên GitHub: `staging` (từ baseline commit), `production` (từ baseline commit — điểm khởi đầu giống nhau, sẽ phân kỳ theo promotion sau này).
2. **Branch protection cho `production`:**
   - Require pull request before merging.
   - Require Owner approval (1 reviewer tối thiểu — chính là Owner).
   - **Không** cho phép force-push, **không** cho phép merge trực tiếp không qua PR.
   - **Không** bật auto-merge.
3. **GitHub Environment `staging`:** không yêu cầu Required Reviewer (auto-deploy khi CI pass).
4. **GitHub Environment `production`:** **có** Required Reviewer = Owner. Đây là lớp bảo vệ thứ 2, độc lập với branch protection (đúng chỉ đạo C.4 "2 lớp").
5. Environment Secrets: tạo 2 bộ secret riêng (Staging/Production) — chưa điền giá trị thật ở bước này (chỉ tạo khung), giá trị thật điền ở Phase 4/6 khi có credential deploy thật.

### Exit Gate Phase 3 — ✅ PASS (2026-08-12)

- [x] `production` branch có branch protection rule hiển thị đúng trên GitHub Settings — Agent không có quyền Administration/API (không dùng PAT theo quyết định Owner) nên verify theo đúng dự phòng của Plan: Owner xác nhận trực tiếp qua UI (Require PR + 1 approval, block force-push).
- [x] `production` Environment có Required Reviewer = Owner (`gmtpv9-iflux`) — Owner xác nhận qua UI, kèm Prevent self-review = ON, Allow administrators to bypass = OFF (tăng cường thêm, không mâu thuẫn Plan).
- [x] `staging` Environment không có Required Reviewer (đúng thiết kế auto-deploy) — Owner xác nhận qua UI, scope đúng branch `staging`.
- [x] Chưa deploy gì thật — vẫn chỉ là cấu hình khung. Environment Secrets/Variables chưa tạo (đúng Plan — giá trị thật điền ở Phase 4/6).
- [x] `Allow auto-merge` = OFF — Owner xác nhận qua UI (2026-08-12).
- [x] SHA `staging` và `production` trên GitHub == baseline `bb9512acc8e8d3746e863d565050abd773851c25` — Agent tự verify qua `git ls-remote` (read-only).
- [x] GitLab không bị đụng, không tạo workflow, không deploy, không đổi runtime trong suốt Phase 3.

---

## Phase 4 — Staging Isolation (BR-23) — **PHẢI PASS trước khi Staging được công nhận là release gate**

**Điều kiện vào:** Phase 3 Exit Gate PASS. **Đây là Phase nặng nhất và bắt buộc theo BR-23 — không được bỏ qua hoặc làm sau CI/CD.**

> **STATUS: ⏸ BLOCKED (2026-08-12) tại bước 1 (migration schema-only)** — `npm run migrate` trên `iflux_staging` fail ở `053_sectors_vnd_l2_catalog.sql` (thiếu cột `sectors.display_order`). Audit schema reconciliation đầy đủ + Owner Decision: [`09 - Schema Reconciliation Audit (Production vs Migrations).md`](09%20-%20Schema%20Reconciliation%20Audit%20%28Production%20vs%20Migrations%29.md).
>
> **STATUS: ✅ Migration schema reconciliation HOÀN TẤT (2026-08-12).** `057` (sectors/ecosystems) + `054/055/056` (page_seo_configs, media_usages, community_rss_schema) đã chạy PASS trên `iflux_staging` qua one-off controlled procedure (không dùng `npm run migrate` trực tiếp — đã audit `migration-runner.js` xác nhận runner sort theo tên file sẽ chạm `053_sectors_vnd_l2_catalog.sql` chưa tracking trước, nên dùng transaction targeted đúng semantics thay thế). `053_sectors_vnd_l2_catalog.sql` **chủ động SKIP** (Owner quyết định defer seed 19 ngành). Full schema diff cuối: **Production 461 object / Staging 461 object — 0 khác biệt; 100/100 bảng khớp cột hoàn toàn.** Chi tiết đầy đủ: [`09 - Schema Reconciliation Audit (Production vs Migrations).md`](09%20-%20Schema%20Reconciliation%20Audit%20%28Production%20vs%20Migrations%29.md).
>
> Còn lại của Phase 4: PM2 `iflux-api-staging` + nginx staging + dual verification (agent + Owner). Seed 19 ngành (`053`) và `schema_migrations` 16/56 tracking debt trên Production: **deferred**, xử lý ở quyết định/task riêng, không block phần còn lại của Phase 4.
>
> **STATUS: ✅ PM2 + Nginx staging runtime HOÀN TẤT (2026-08-12).** `iflux-api-staging` chạy bằng user `iflux-app` (không root, không `iflux-deploy`), port `3002`, PM2 riêng (`pm2_home=/home/iflux-app/.pm2`, tách hoàn toàn khỏi PM2 root của Production). Root cause 1 lỗi runtime đã fix tại chỗ, không phải vấn đề bảo mật: (1) PM2 daemon fork kế thừa `cwd` phiên gọi — nếu gọi từ `/root` (không có quyền cho `iflux-app`) daemon spawn fail `EACCES`; fix = luôn `cd` vào thư mục `iflux-app` có quyền trước khi chạy lệnh bằng user này. (2) Ecosystem config đặt `EMAIL_PROVIDER=''` để cách ly email thật nhưng schema Zod (`z.enum(['resend','smtp']).optional()`) không nhận `''`; fix = bỏ hẳn key này khỏi env (undefined hợp lệ, không phải thêm code mới).
> Nginx: sửa `proxy_pass` `/api/`, `/media/` từ `127.0.0.1:3001` → `127.0.0.1:3002` trong đúng file `iflux-staging.conf` hiện có (không tạo file mới). Phát hiện thêm 1 lỗ hổng routing thật cần sửa trong cùng phạm vi: domain `staging.iflux.vn` (qua Cloudflare) trước đó **chưa có server block khớp tên** ở port 80/443 nên fallback về đúng nội dung Production — đã vá bằng cách thêm `listen 80` / `listen 443 ssl` (cert riêng `certbot --webroot -d staging.iflux.vn`, không đụng cert `iflux.vn`) vào **cùng** server block `staging.iflux.vn` sẵn có (không tạo block song song). Đã verify qua domain thật: `https://staging.iflux.vn` trả `X-IFlux-Env: staging` + data từ `iflux_staging` (19 ngành, `slug=null`, `stock_count=0` — baseline chưa enrich), còn `https://iflux.vn` (Production) không đổi, vẫn trả data thật, PM2 `iflux-api` (pid root, uptime 6h+) không restart trong suốt quá trình.

### Bước thực hiện (theo đúng bảng B.1 trong `06`)

1. Tạo database `iflux_staging` trên Postgres hiện có — **schema-only**, apply qua `npm run migrate` (không clone dữ liệu Production thật).
2. Tạo user Postgres riêng cho `iflux_staging`, quyền giới hạn đúng DB đó.
3. Tạo path storage riêng: `/var/iflux/storage-staging/`.
4. Tạo `.env` Staging riêng (dựa trên `.env.staging.example` đã có sẵn trong repo) — trỏ đúng DB mới, storage mới, **PORT riêng** (không đụng 3001 của Production).
5. Email: cấu hình Staging ở **log-only / không gửi thật** (tuỳ khả năng provider — SMTP có thể trỏ tới dịch vụ test/log; Resend nếu có sandbox key thì dùng, nếu không thì tắt gửi thật bằng flag/provider log-only).
6. DNSE: để trống credential ở Staging (code đã tự tắt qua `isConfigured()`, không cần code mới).
7. Scheduler: quyết định `SCHEDULER_ENABLED` cho Staging (khuyến nghị tắt ban đầu, giảm side-effect ngoài trùng lặp — Owner có thể bật lại nếu cần test ingest).
8. [x] Khởi tạo PM2 process thứ 2: `iflux-api-staging`, chạy bằng deployment identity/runtime user theo quyết định C.2 (KHÔNG chạy bằng root, KHÔNG tự động dùng chung user `iflux-deploy` cho runtime). **User runtime riêng đã dùng: `iflux-app`** (uid 998, `nologin` shell, đã tồn tại sẵn từ chuẩn bị trước đó) — khác cả `root` (chạy `iflux-api` Production) và `iflux-deploy` (uid 997, dành cho CI/CD Phase 5). PM2 daemon riêng theo user (`pm2_home=/home/iflux-app/.pm2`), `pm2 save` đã chạy để lưu process list.
9. [x] Sửa nginx `iflux-staging.conf`: `/api/` và `/media/` trỏ `http://127.0.0.1:3002` thay vì `127.0.0.1:3001`. Bổ sung `listen 80` / `listen 443 ssl` (cert riêng) cho `server_name staging.iflux.vn` trong cùng file — không tạo file/block song song — để domain thật route đúng vào Staging thay vì fallback về Production.

### Dual Verification (bắt buộc, theo đúng khuôn mẫu Sidebar Foundation trước đây)

- [x] **Agent verify (source/evidence):** curl trực tiếp `https://staging.iflux.vn/api/market/master/sectors` → trả 19 ngành baseline (`slug=null`, `stock_count=0`, đúng data `iflux_staging` sau migration reconciliation, KHÁC hoàn toàn data thật của `https://iflux.vn` cùng route — chứng minh Staging đọc đúng DB riêng, không chạm `iflux` Production). Header `X-IFlux-Env: staging` xác nhận đúng nginx block. PM2 `iflux-api` (Production, pid root) giữ nguyên uptime/pid suốt quá trình test — không restart, không log lỗi liên quan.
- [ ] **Owner verify (UI thật):** Owner tự thao tác 1 luồng có side-effect trên `https://staging.iflux.vn` (ví dụ đăng ký test, tạo payout request test) → xác nhận **không** nhận được email thật, và Admin Production **không** thấy payout request giả xuất hiện trong hàng đợi thật. **PENDING — chờ Owner tự thực hiện.**

### Exit Gate Phase 4 (= Exit Gate cho BR-23)

- [x] Staging có DB, credential, storage, PM2 process hoàn toàn riêng — verify bằng bằng chứng cụ thể (không suy đoán).
- [ ] Test side-effect trên Staging **không** chạm Production (DB, email, storage) — có bằng chứng cả 2 phía (Agent ✅ + Owner ⏳ pending).
- [ ] **Chỉ sau khi Exit Gate này PASS, Staging mới được coi là "release gate hợp lệ"** cho các Phase sau.

---

## Phase 5 — Staging CI/CD (Self-hosted Runner + GitHub Actions Workflow)

**Điều kiện vào:** Phase 4 Exit Gate PASS (Staging Isolation xong) — **không làm Phase 5 trước Phase 4**, đúng nguyên tắc Owner đã khoá ("CI/CD có thể làm trước, nhưng Staging chưa được công nhận là release gate hoàn chỉnh cho đến khi isolation được giải quyết" — ở đây chọn thứ tự an toàn nhất: Isolation xong rồi mới nối CI/CD, để không bao giờ có 1 khoảnh khắc CI/CD tự động deploy vào môi trường chưa cách ly).

### Bước thực hiện

1. Tạo user Linux `iflux-deploy` (không root, không sudo, không SSH password) trên server hiện tại.
2. Cấp quyền `iflux-deploy` **chỉ** ghi vào đúng path Deploy Unit đã khai (ví dụ `/var/www/iflux/releases-staging/`, `/var/iflux/backend-releases-staging/`) — không có quyền ở path Production tương ứng.
3. Cài GitHub Actions self-hosted runner, đăng ký với label `staging` (identity tách biệt theo C.2), chạy bằng user `iflux-deploy`.
4. Viết workflow `.github/workflows/deploy-staging.yml`: trigger `on: push` tới nhánh `staging` → job chạy trên runner label `staging` → build/prepare release → tạo `/releases-staging/<SHA>/` → verify (health check nội bộ) → atomic switch `current` → health check qua HTTP → báo kết quả (GitHub Deployments API: SHA, timestamp, run ID).
5. Test: push 1 thay đổi nhỏ (ví dụ đổi 1 dòng comment không ảnh hưởng hành vi) lên `staging` → xác nhận tự động deploy, atomic switch đúng, health check pass.
6. **Test rollback trên Staging trước** (rủi ro thấp hơn Production) — deploy 2 release liên tiếp, rollback `current` về release trước, verify đúng nội dung khôi phục.

### Exit Gate Phase 5

- [ ] Push `staging` → tự động deploy, không cần SSH tay.
- [ ] Atomic switch + health check hoạt động đúng.
- [ ] Rollback trên Staging đã test PASS.
- [ ] `iflux-deploy` xác nhận **không có quyền gì trên Production path**.

---

## Phase 6 — Production CI/CD (build + dry-run, KHÔNG cutover thật)

**Điều kiện vào:** Phase 5 Exit Gate PASS.

**Ranh giới bắt buộc (theo `06` Phần H — Target State Architecture 4 lớp):** Deploy Unit mà workflow Production ghi vào **chỉ là tầng Application**. 3 tầng còn lại — Environment config/secrets, Database, Persistent storage (media/uploads) — **không nằm trong `/releases/<SHA>/`, không bị workflow tạo/xoá/overwrite**. Cụ thể:

```text
/releases/<SHA>/            ← Application (code) — DUY NHẤT tầng workflow ghi vào
/var/iflux/backend/.env     ← Environment config — workflow ĐỌC (nếu cần symlink vào release) nhưng KHÔNG tạo/sửa nội dung
DB Postgres `iflux`         ← KHÔNG chạm — migration schema (nếu có) chạy như 1 step riêng, có kiểm soát, KHÔNG phải "reset"
/var/iflux/storage/         ← KHÔNG chạm — persistent storage nằm ngoài path release hoàn toàn
```

### Bước thực hiện

1. Tạo runner thứ 2, label `production`, **identity riêng** theo C.2 (ví dụ user Linux riêng `iflux-deploy-prod`, hoặc cùng `iflux-deploy` nhưng label runner khác — Owner đã chốt "2 identity/label riêng"; đề xuất mặc định: **2 user Linux riêng** để triệt để nhất, tránh 1 user có quyền cả 2 path — Owner xác nhận nếu muốn đơn giản hơn).
2. Viết workflow `.github/workflows/deploy-production.yml`: trigger `on: push` tới nhánh `production` (chỉ xảy ra sau PR approve — đã chặn ở Phase 3) → job chạy trên runner label `production`, **GitHub Environment `production` chặn job chờ Owner approve** (2 lớp: PR approve + Environment approve, đúng C.4) → build/prepare release → `/releases/<SHA>/` (path Production thật, riêng biệt với path Staging) → verify → atomic switch → health check → GitHub Deployments API ghi nhận.
3. **Dry-run an toàn:** lần đầu tiên chạy thử, **không** cho nginx Production trỏ vào symlink mới — chỉ verify cơ chế `prepare → verify → atomic switch → health check` hoạt động đúng trên 1 path song song, KHÔNG ảnh hưởng traffic thật đang chạy qua `/var/www/iflux/production` hiện hữu.
4. Thiết kế **retention policy** cho `/releases/`: giữ N release gần nhất (mặc định 5 theo P0-5, hoặc theo Owner chỉnh), job dọn release cũ chạy sau mỗi deploy thành công (không xoá release đang là `current` hoặc N-1 gần nhất).
5. Test rollback trên cơ chế Production (vẫn ở path song song, chưa switch traffic thật) — verify chuyển đổi giữa 2 release giữ lại hoạt động đúng.

### Exit Gate Phase 6

- [ ] Workflow Production đã viết, đã test dry-run trên path song song — **chưa** đụng traffic thật.
- [ ] 2 lớp approval (PR + Environment) đã verify hoạt động đúng (thử 1 lần thật, Owner tự approve để xác nhận UX).
- [ ] Retention policy hoạt động đúng — release cũ bị dọn theo đúng số lượng giữ lại.
- [ ] Rollback mechanism Production đã test PASS (trên path song song).
- [ ] **Legacy rsync/SSH vẫn là con đường chính thức duy nhất cho traffic thật** — Phase 6 chỉ chuẩn bị, chưa cutover.

---

## Phase 7 — Production Migration Plan (Gate 3 — Owner approval bắt buộc)

**Điều kiện vào:** Phase 6 Exit Gate PASS.

Trước khi cutover thật, tổng hợp 1 tài liệu `09 - Production Cutover Plan.md` xác nhận:

- Thứ tự chính xác các bước cutover (nginx nào đổi trước, thời điểm switch symlink Production thật, thời điểm tắt hoàn toàn đường rsync cũ).
- Kế hoạch rollback nếu cutover thất bại (bao gồm rollback về đúng quy trình `Deployment.md` v1.2 cũ nếu cần — **giữ nguyên khả năng này cho tới khi Phase 8 xác nhận PASS hoàn toàn**).
- Cửa sổ thời gian thực hiện (Owner chọn giờ ít traffic nếu cần).
- Danh sách smoke test bắt buộc ngay sau cutover.

**Owner phải approve tài liệu này trước khi Phase 8 được thực hiện.**

### Exit Gate Phase 7

- [ ] `09 - Production Cutover Plan.md` đã viết đầy đủ.
- [ ] Owner approve rõ ràng bằng lời.

---

## Phase 8 — Production Cutover (Gate 4) — **decommission legacy CHÍNH XÁC tại đây**

**Điều kiện vào:** Phase 7 Exit Gate PASS (Owner đã approve Cutover Plan).

**Nguyên tắc bắt buộc (theo `06` Phần H):** Cutover chỉ thay **tầng Application** bằng luồng GitHub → Release SHA → atomic deploy. **KHÔNG reset/clone Database. KHÔNG xoá/động vào Persistent storage (media/uploads/user data). KHÔNG commit Environment config/secrets vào Git.** Production hiện tại (trước cutover) chỉ đóng vai trò legacy runtime/reference — evidence để đối chiếu (đã dùng ở `08`), không phải "bản đúng" tự động được giữ nguyên toàn bộ. Sau cutover PASS, hạ tầng Production hiện tại **chính thức trở thành Production của kiến trúc mới** (không phải server mới).

1. Thực hiện cutover theo đúng `09 - Production Cutover Plan.md` — nginx Production chuyển sang trỏ symlink `current` của cơ chế atomic release mới. **Chỉ tầng Application đổi; Database và Persistent storage giữ nguyên xuyên suốt cutover.**
2. Smoke test đầy đủ theo danh sách đã định.
3. Theo dõi (Owner + Agent) trong khoảng thời gian đã định trước khi tuyên bố PASS.
4. **Chỉ sau khi PASS**, thực hiện decommission:
   - Gỡ `staging.env`/`deploy-production.env` khỏi vai trò "entry point vận hành" (không xoá file ngay nhưng đánh dấu deprecated, cập nhật comment đầu file).
   - Xoay (rotate) SSH root password (không dùng lại cho mục đích deployment — SSH root chỉ còn cho break-glass theo đúng Owner Decision #6).
   - Cập nhật 6 workspace rule đang chỉ đạo Agent "đọc staging.env, SSH deploy" — sửa để phản ánh quy trình mới (KHÔNG xoá âm thầm, phải liệt kê rõ đã sửa gì).
   - GitLab → chuyển archive/read-only.
   - `Deployment.md` v1.2 → ARCHIVED/DEPRECATED, tạo `Deployment.md v2.0` mới làm SoT chính thức.

### Exit Gate Phase 8 (= Gate 4)

- [ ] Production chạy qua pipeline mới, traffic thật xác nhận ổn định qua thời gian theo dõi.
- [ ] Không còn đường Local→Production rsync/SSH chính thức.
- [ ] `Deployment.md v2.0` đã thay thế v1.2, có ghi rõ ngày cutover + evidence.
- [ ] GitLab ở trạng thái archive/read-only.
- [ ] **Database Production xác nhận KHÔNG bị reset/clone** — verify bằng cách so số liệu (ví dụ record count 1 vài bảng chính, hoặc timestamp bản ghi mới nhất trước/sau cutover) khớp liên tục, không có gián đoạn dữ liệu.
- [ ] **Persistent storage (media/uploads) xác nhận KHÔNG bị xoá/động vào** — verify 1 vài file media đã tồn tại từ trước cutover vẫn truy cập được đúng URL sau cutover.

---

## Phase 9 — Final Security / Deployment Audit (Gate 5)

Chạy lại toàn bộ **Acceptance Criteria (§33)** và **Negative Acceptance Tests NAT-01→NAT-05** từ BRD gốc (`01`) như bộ test case cuối:

- NAT-01: thử Local→Production kiểu cũ → phải KHÔNG khả thi/không hợp lệ.
- NAT-02: Staging PASS không tự promote Production → verify Production không đổi nếu không có human action.
- NAT-03: thử SSH Production để deploy tay → xác nhận không còn là method hợp lệ (credential đã rotate/revoke khỏi vai trò deploy).
- NAT-04: xoá 1 file ứng dụng ở release mới → xác nhận không tồn tại zombie ở release cũ/serving path.
- NAT-05: verify Production Git SHA == release đã approve == release đã Staging-verify.

### Exit Gate Phase 9 (= Gate 5, đóng toàn bộ task)

- [ ] Toàn bộ Acceptance Criteria (A/B/C/D/E trong `01`) verify PASS có evidence.
- [ ] Toàn bộ NAT-01→05 PASS.
- [ ] Báo cáo tổng kết cuối task.

---

## Ghi chú quan trọng khi thực thi (nhắc lại, không lặp lại toàn văn Owner decisions)

- Không đảo thứ tự Phase 4 (Staging Isolation) và Phase 5 (Staging CI/CD) — Isolation luôn trước.
- Không decommission bất kỳ phần nào của quy trình cũ trước Phase 8.
- Không tự commit baseline ở Phase 1 nếu chưa có Owner approve rõ ràng.
- Mỗi Phase cần Owner nói rõ "bắt đầu Phase N" (hoặc gộp nhiều Phase liên tục nếu Owner chỉ định) — Agent không tự chuyển Phase khi Exit Gate trước chưa PASS.

**Implementation vẫn `NOT AUTHORIZED` cho tới khi Owner xác nhận bắt đầu Phase 1.**
