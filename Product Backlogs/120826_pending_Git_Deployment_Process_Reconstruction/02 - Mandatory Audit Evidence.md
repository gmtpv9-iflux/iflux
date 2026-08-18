# 02 — Mandatory Audit Evidence (Gate 0)

| | |
|--|--|
| **Task** | Git & Deployment Process Reconstruction |
| **Gate** | Gate 0 — Mandatory Audit |
| **Implementation** | `NOT AUTHORIZED` (không có thay đổi nào được thực hiện trong audit này) |
| **Ngày audit** | 2026-08-12 |
| **Phương pháp** | Read-only: `git` local, `git ls-remote`, SSH read-only vào server hiện tại (không sửa file/service/DB) |
| **Tài liệu liên quan đã tồn tại** | [`docs/SoT — Deployment.md`](../../docs/SoT%20%E2%80%94%20Deployment.md) v1.2 (🔒 LOCKED as-is, 2026-08-02) — audit này **đối chiếu** với SoT cũ, không thay thế nó. Việc supersede SoT cũ chỉ xảy ra sau khi Owner chốt ở Gate 1. |

Chú thích nhãn bằng chứng (theo đúng convention của `SoT — Deployment.md`):

- ✅ **Verified** — quan sát trực tiếp bằng lệnh trong audit này (log đầy đủ, có thể tái chạy)
- 🟡 **Inferred** — suy ra từ bằng chứng gián tiếp
- 🔴 **Unknown** — cần Owner xác nhận hoặc cần quyền truy cập GitLab UI/API mà agent hiện chưa có

---

## AU-01 — Git Governance Baseline

### A. Repository / remote

| Fact | Value | Tag |
|---|---|---|
| Remote | GitLab — `git@gitlab.com:gm.tpv9/iflux.git` (SSH) | ✅ `git remote -v` |
| Remote reachable | Có — `git ls-remote --heads origin` trả kết quả | ✅ |
| Local git identity dùng SSH key (không phải password) để push/pull GitLab | ✅ (`git@gitlab.com:...`) — **khác hoàn toàn** với SSH password vào server Production | ✅ |

### B. Branch hiện tại — phát hiện quan trọng

| Fact | Value | Tag |
|---|---|---|
| HEAD hiện tại | `backup/100826-appshell-foundation-20260810` — **không phải `main`** | ✅ `git branch --show-current` |
| Commit ahead của `main` | 6 commit chỉ có trên HEAD, chưa có trên `main` | ✅ `git log --oneline main..HEAD` |
| Commit ahead của HEAD | 4 commit chỉ có trên `main`, chưa có trên HEAD hiện tại (gồm merge "docs: add Merge Request standard SoT") | ✅ `git log --oneline HEAD..main` |
| → Kết luận | **Hai nhánh phân kỳ hai chiều.** Không có branch nào đang là "nguồn duy nhất" phản ánh code thực tế đang chạy Production | ✅ |

### C. Branch list (local + remote)

**Remote (`git ls-remote --heads origin` — nguồn chính xác nhất, 8 branch):**

```text
feat/task2-flw-subj-net-subject
feat/task2-wgt-mkt-007-008-top-001
feat/template-tabs-segmented-sot
feature/google-login-rebuild
fix/affiliate-google-active-owner
main
milestone/safe-baseline-20260730
release/affiliate-golden
```

**Local remote-tracking refs (`git branch -a`) có 21 branch** — bao gồm cả các remote-tracking ref **đã stale** (branch đã xoá trên GitLab nhưng local chưa `fetch --prune`), ví dụ `remotes/origin/docs/mr-standard`, `remotes/origin/rescue/20260806-before-gitflow`, `remotes/origin/fix/cg-1.0-wave1-ownership-cleanup`, `remotes/origin/feat/runtime-opt-task3`, `remotes/origin/feat/preview-viewport-*`, `remotes/origin/feat/task2-ranking-widgets-v2` — 6 remote-tracking ref không còn tồn tại trên remote thật.

| Fact | Tag |
|---|---|
| Không có branch nào tên `staging` hoặc `production` tồn tại (local hoặc remote) | ✅ |
| Naming pattern hiện tại: `feat/*`, `fix/*`, `milestone/*`, `release/*`, `backup/*`, `wip/*`, `rescue/*`, `docs/*` — **không theo mô hình Staging/Production branch** | ✅ |
| `.git` remote-tracking refs không đồng bộ với remote thật (stale refs) | ✅ |

### D. Commit history

| Fact | Value | Tag |
|---|---|---|
| Tổng số commit trên HEAD hiện tại | 43 | ✅ `git log --oneline \| wc -l` |
| Commit gần nhất | `997c2cf` — 2026-08-10 17:19:11 +0700 | ✅ |
| Khoảng cách tới thời điểm audit (2026-08-12) | ~2 ngày | ✅ |
| Uncommitted changes tại thời điểm audit | **339 file** | ✅ `git status --short \| wc -l` |
| Phân bổ uncommitted theo folder | `Admin_Design_system` 125 · `User_Web` 124 · `Product Backlogs` 53 · `backend` 23 · `Admin_Design_system` (quoted path variant) 11 · `infra` 2 · `logo` 1 | ✅ |

**Ý nghĩa:** trong 2 ngày qua (SEO Metadata Management epic: L0→L7, P0 code-version cleanup, nginx X-Robots-Tag fix, backend site-seo/media/seo-platform changes…) đã có rất nhiều thay đổi triển khai thẳng lên Production (xem AU-07) **nhưng chưa có commit Git tương ứng nào**. Điều này khớp hoàn toàn với chính sách hiện hành đã được Owner-lock trong `SoT — Deployment.md` §3.4: *"Deploy ≠ Commit/Push/Merge — hai hoạt động độc lập"*. Đây không phải lỗi thực thi — đây là **hệ quả trực tiếp của chính chính sách as-is đang áp dụng**, và chính là gốc rễ mà BRD mới muốn thay thế.

### E. Tags

| Tag | Tag-loại | Ghi chú |
|---|---|---|
| `AFFILIATE_GOLDEN` | ad-hoc | Không theo semver, không gắn với release Production cụ thể có ngày/SHA công khai |
| `affiliate-e2e-pass-20260728` | ad-hoc | Đánh dấu một lần test pass, không phải release tag |

→ **Không có tagging convention cho release** (ví dụ `prod-2026-08-12`, `v1.4.0`). Không thể dùng tag hiện có để trả lời "Production đang chạy tag nào".

### F. CI/CD hiện có

| Kiểm tra | Kết quả | Tag |
|---|---|---|
| `.gitlab-ci.yml` tại working tree hiện tại | Không tồn tại | ✅ `find` |
| `.gitlab-ci.yml` trên `origin/main` | Không tồn tại | ✅ `git show origin/main:.gitlab-ci.yml` → fatal: path does not exist |
| `.gitlab-ci.yml` trên **bất kỳ branch nào** (21 local + remote-tracking, loop toàn bộ) | Không tìm thấy ở branch nào | ✅ loop `git show <branch>:.gitlab-ci.yml` |
| GitLab CI/CD Runner, Pipeline schedule, Protected branch rules (qua GitLab Settings/API) | 🔴 Unknown — GitLab MCP server hiện ở trạng thái `error` (tool discovery fail), không truy vấn được qua API trong audit này | 🔴 |

**Kết luận AU-01 → Git Governance Baseline:**

> Git hiện tại chỉ đóng vai trò **lưu trữ mã nguồn thủ công, không đầy đủ, không đồng bộ với Production**. Không có CI/CD nào tồn tại ở bất kỳ tầng nào của repo. Không có branch Staging/Production. Nhánh `main` không phản ánh trạng thái code đang chạy thật. Cần Owner/GitLab Admin xác nhận thêm trạng thái Branch Protection Rules và Runner (agent không truy cập được GitLab Settings UI/API ở thời điểm audit).

---

## AU-02 — Deployment Entry Point Inventory

### A. Trong repository

| Loại entry point | Tìm thấy? | Chi tiết | Tag |
|---|---|---|---|
| Shell script deploy (`.sh`) đã commit | **Không** | `find . -iname "*deploy*"` không trả về script nào ngoài file `.env` | ✅ |
| npm script deploy | **Không** | `backend/package.json` chỉ có `start`, `start:legacy`, `start:python`, `dev`, `migrate`, `seed`, `test`, `test:integration` — không có `deploy` | ✅ |
| Makefile | **Không** | Không tìm thấy `Makefile` nào trong repo (ngoài `node_modules`) | ✅ |
| CI workflow (`.gitlab-ci.yml`, `.github/workflows`) | **Không** | Xem AU-01.F | ✅ |
| Cron job (repo-defined) | Không tìm thấy trong repo | — | ✅ |
| PM2 config file (`ecosystem.config.js`) | Không tìm thấy trong repo | Server chạy `pm2 start` bằng lệnh tay hoặc `pm2 dump`, không có file ecosystem trong git | 🟡 |

### B. File cấu hình vận hành (không phải code, nhưng là "entry point" thực tế)

| File | Vai trò | Tag |
|---|---|---|
| `infra/staging/staging.env` | **"Single source of truth (deploy + runtime)"** — chứa SSH host/port/user/**password**, rsync command mẫu, path Production/Staging, Cloudflare token | ✅ — bị `.gitignore` chặn commit (đúng), nhưng vẫn là **entry point vận hành thực tế**, không phải code |
| `infra/staging/deploy-production.env` | Bảng path cụ thể cho một đợt deploy (Wave F stocks) + **scp/ssh example command inline** | ✅ — cùng cơ chế credential như trên |
| `infra/staging/deploy-production.env.example` | Template không chứa secret | ✅ |
| `infra/staging/iflux-api.service` | systemd unit — **tồn tại trong repo nhưng KHÔNG active trên server** (server dùng PM2) | ✅ — xem AU-07 |
| `infra/staging/nginx-iflux-api.conf`, `infra/nginx-iflux-production*.conf` | Bản mirror local của nginx config đang chạy trên server | ✅ |
| `SoT — Deployment.md` (root, pointer) → `docs/SoT — Deployment.md` v1.2 | **Tài liệu hoá đầy đủ quy trình deploy hiện hành** (Deploy Unit, rollback decision tree, Forbidden F-01→F-13, Checklist, 10 Open Questions) | ✅ — đây là entry point "quy trình" quan trọng nhất hiện có, không phải script |

### C. Agent instructions (workspace rules — đã được liệt kê ở đầu hội thoại này)

6 always-applied / user rule khác nhau **lặp lại** cùng một hướng dẫn: *"SỬA TRỰC TIẾP trên Production... SSH deploy: ĐỌC `infra/staging/staging.env`... Sau deploy: PURGE Cloudflare cache"*. Đây chính là **entry point chỉ đạo hành vi Agent**, không phải code — nhưng theo BRD mới (BR-06, BR-19) đây là artifact **phải rà soát lại** vì đang khoá chính sách "Local → Production trực tiếp" mà BRD muốn decommission.

### D. Thao tác thực tế trên server (không phải file — chỉ là lệnh gõ tay qua SSH mỗi lần)

Không tìm thấy một **script duy nhất, tái sử dụng được** để deploy. Mọi lần deploy trong lịch sử hội thoại đều là:

```text
rsync -az -e "$DEPLOY_RSYNC_SSH" <file cụ thể> → path Production
[nếu Backend] npm install / pm2 restart iflux-api
[nếu Frontend/Admin] Cloudflare purge_cache API call
```

được Agent gõ trực tiếp mỗi lần theo Deploy Unit tương ứng (xem `docs/SoT — Deployment.md` §4–§8).

**Kết luận AU-02 → Deployment Entry Point Inventory:**

> **Không có một reusable deployment script/pipeline nào tồn tại** trong repo. Deploy = tổ hợp lệnh SSH/rsync/curl gõ tay mỗi lần, dựa trên một file credential plaintext (`staging.env`) và một tài liệu quy trình (`SoT — Deployment.md`) — không có automation, không có CI/CD entry point nào.

---

## AU-03 — SSH / Credential Security Risk Register

| # | Hạng mục | Bằng chứng | Rủi ro | Tag |
|---|---|---|---|---|
| 1 | **SSH deployment dùng password, không dùng key** | `sshpass -p '<password>' ssh -p 7878 root@<host>` là cơ chế duy nhất được dùng trong toàn bộ lịch sử deploy | Cao — password có thể bị lộ qua log/terminal/lịch sử chat | ✅ |
| 2 | **`/root/.ssh/authorized_keys` trên server = 0 byte (trống hoàn toàn)** | `wc -l /root/.ssh/authorized_keys` → `0` | Cao — **không có bất kỳ SSH key nào được đăng ký**; con đường vào server root **100% phụ thuộc password** | ✅ |
| 3 | **`PermitRootLogin yes` + `PasswordAuthentication yes`** trong `sshd_config` | grep trực tiếp trên server | Cao — root login qua password được phép ở tầng OS, không có MFA, không có bastion | ✅ |
| 4 | **Password SSH ở dạng plaintext trong file local** (`infra/staging/staging.env`, `infra/staging/deploy-production.env`) | Đọc trực tiếp 2 file — cả hai đều có `DEPLOY_SSH_PASSWORD=...` | Cao — dù đã `.gitignore`, file vẫn tồn tại vĩnh viễn trên máy local/agent workspace, không qua secret manager nào | ✅ |
| 5 | **Cloudflare API Token (quyền Cache Purge) ở dạng plaintext** cùng file | `CF_API_TOKEN=cfut_...` trong `staging.env` | Trung bình — token có scope hẹp (cache purge) nhưng vẫn là credential sống, plaintext, không rotate tự động | ✅ |
| 6 | **6 workspace rule / always-applied rule chỉ đạo Agent đọc trực tiếp file password này mỗi lần deploy** | Xem đầu hội thoại — nhiều rule lặp "ĐỌC `infra/staging/staging.env`... KHÔNG hỏi lại user" | Cao — quy trình vận hành **thiết kế sẵn** để phụ thuộc password, không phải lỗ hổng tạm thời | ✅ |
| 7 | `.gitignore` có chặn `staging.env`, `*.pem`, `*.key`, `*credentials*`, `*secret*` khỏi git | Đọc `.gitignore` | Tích cực — ít nhất **không có secret nào lộ trong Git repo/GitLab** hiện tại (cần xác nhận thêm bằng full-history scan, xem hạng mục 8) | ✅ (kiểm soát commit tương lai) |
| 8 | Secret có từng lộ trong **lịch sử commit Git** (trước khi `.gitignore` được thêm)? | Chưa full-scan `git log -p` toàn bộ 43 commit cho pattern password/token | 🔴 Cần quét thêm nếu Owner muốn khẳng định tuyệt đối "chưa từng lộ" | 🔴 |
| 9 | Break-glass / bastion / VPN riêng cho server administration | Không tìm thấy bằng chứng | 🔴 Unknown — hiện tại "server administration" và "application deployment" dùng **chung một con đường** (SSH password root) — vi phạm trực tiếp ý định BR-07 phân biệt hai loại truy cập | 🔴 |
| 10 | GitLab CI/CD Variables (secret management ở tầng CI) | Không kiểm tra được — GitLab MCP lỗi kết nối | 🔴 | 🔴 |

**Kết luận AU-03 → Deployment Security & Credential Risk Register:**

> **BR-07 (không SSH password) đang bị vi phạm 100% ở current-state.** Không tồn tại bất kỳ hình thức machine-to-machine credential nào ngoài SSH root password. Không có SSH key. Không có secret manager. Không có phân biệt giữa "application deployment" và "server administration" — cả hai đang dùng chung một con đường duy nhất.

---

## AU-06 — Staging Readiness Report

| Hạng mục | Trạng thái thực tế (Verified qua SSH 2026-08-12) | Tag |
|---|---|---|
| Web root | `/var/www/iflux/staging` tồn tại, 39M, 29 item, **mtime gần nhất 2026-07-06** (~5 tuần trước audit) | ✅ |
| Nginx site | `iflux-staging.conf` — `listen 8888`, `server_name staging.iflux.vn _`, static root `/var/www/iflux/staging` | ✅ |
| Public HTTPS | `https://staging.iflux.vn` (theo `staging.env`) — domain riêng | ✅ (định nghĩa), chưa re-verify HTTP status trong audit này |
| **Backend/API riêng cho Staging** | **KHÔNG CÓ.** Nginx staging proxy `location /api/` và `/media/` → `http://127.0.0.1:3001/` — **chính xác cùng port** mà Production cũng đang proxy tới | ✅ — phát hiện quan trọng nhất của AU-06 |
| **Database riêng cho Staging** | **KHÔNG TỒN TẠI.** `staging.env` khai `DATABASE_URL=...iflux_staging`, nhưng `psql -l` trên server chỉ có 2 database: `iflux` (production) và `iflux_legacy_pre202607`. **`iflux_staging` chưa từng được tạo.** | ✅ `sudo -u postgres psql -l` |
| PM2 process riêng cho Staging | **Không có.** Chỉ 1 process PM2 duy nhất (`iflux-api`), chạy với `.env` có `APP_ENV=production`, `DATABASE_URL` trỏ DB `iflux` (production) | ✅ `pm2 list` + `cat /var/iflux/backend/.env` |
| Secrets riêng cho Staging | `staging.env` có khai JWT/Redis riêng cho staging nhưng **không dùng được** vì không có backend riêng để nạp env đó | 🟡 tồn tại trên giấy, không active |
| Deployment capability tới Staging | Về lý thuyết `rsync` có thể đẩy file tới `/var/www/iflux/staging`; nhưng vì API dùng chung Production, **mọi test "staging" liên quan tới data/API thực chất đang test/ghi vào Production** | ✅ (suy ra trực tiếp từ 2 bằng chứng trên) |
| Environment parity với Production | **Không đạt.** Frontend riêng thư mục (nhưng stale ~5 tuần), Backend/DB **hoàn toàn chung** | ✅ |

**Kết luận AU-06 → Staging Readiness Report:**

> **"Staging" hiện tại KHÔNG phải một environment độc lập.** Nó chỉ là một thư mục static file (đã lỗi thời) được expose qua một port/domain riêng, nhưng **mọi request API/data đều chạm vào backend và database Production thật**. Nếu chạy test trên `staging.iflux.vn` ngày hôm nay mà tưởng là an toàn/isolated, thực chất Owner đang test trực tiếp trên Production data. Đây là gap nghiêm trọng nhất trong toàn bộ audit — Staging **không sẵn sàng** để đóng vai trò "Test/Audit gate trước Production" theo yêu cầu BR-02/BR-03 của BRD mới.
>
> Đây cũng chính xác là câu hỏi Owner đã tự đặt ra trước đó và chưa trả lời: `SoT — Deployment.md` **OQ-07** — *"Staging: ai được phép deploy, tần suất, parity với Production?"* — audit này xác nhận: **hiện tại parity = 0%** ở tầng backend/data.

---

## AU-07 — Production Deployment Baseline

| Hạng mục | Trạng thái thực tế (Verified qua SSH 2026-08-12) | Tag |
|---|---|---|
| PM2 | 1 process: `iflux-api`, version `0.2.0`, mode `fork`, status `online`, uptime **65 phút** (mới restart gần đây do các deploy Backend trong session SEO), **↺ 272 lần restart tích lũy** | ✅ |
| Nginx sites-enabled | `iflux-production.conf` (443/80, domain `iflux.vn`/`www.iflux.vn` + fallback IP), `iflux-staging.conf` | ✅ |
| Nginx sites-available | Có thêm **3 file backup `.bak.bodylimit.20260810*`** nằm cùng cấp với config sống (residue nhỏ còn sót sau lần P0 cleanup trước — P0 chỉ dọn 89 `.bak.*` trong `snippets/`, chưa dọn 3 file này trong `sites-available/`) | ✅ |
| Application directories | `/var/www/iflux/production` (29M, 7 item con), `/var/iflux/backend` (258M), `/var/iflux/Admin_Design_system` + `/var/iflux/User_Web` (chỉ chứa `data/` — file JSON cấu hình runtime nhỏ, KHÔNG phải code trùng lặp) | ✅ |
| **`/var/www/iflux/backups/` nằm NGAY TRONG web root cha** (`/var/www/iflux/`, cùng cấp `production/` và `staging/`) — 14 item (nhiều thư mục backup theo task: `admin-20260717-231507`, `task2-*`, `tmpDivBars_*`, `wgt-mkt-003-*`…) | **Vi phạm trực tiếp BR-15 của BRD mới** ("Backup không được nằm trong Live Deployment Scope") | ✅ |
| Persistent data | `/var/iflux/storage/media` = **5.1G** — tách biệt đúng khỏi app code tree (điểm tích cực, đã đúng boundary ngay từ đầu) | ✅ |
| Runtime-generated config data | `/var/iflux/Admin_Design_system/data/ds-sot-overrides.json`, `/var/iflux/User_Web/data/iflux-plans-v1.json` — nhỏ (36K/28K), tách khỏi git-deployed static tree | ✅ |
| Environment files | `/var/iflux/backend/.env` — `APP_ENV=production`, `DATABASE_URL` trỏ DB `iflux` | ✅ |
| SSH access | Password-only, root, không key (xem AU-03) | ✅ |
| **Current runtime identity (Git SHA)** | **Không xác định được.** `/var/www/iflux/production` và `/var/iflux/backend` đều KHÔNG phải git working tree (`git status` → `fatal: not a git repository`) | ✅ |
| Drift filesystem vs Git commit gần nhất | **361 file trong `/var/www/iflux/production`** có mtime sau 2026-08-10 (thời điểm commit Git cuối cùng) — toàn bộ output của epic SEO L0-L7 tuần này **chưa hề có commit tương ứng** | ✅ `find -newermt` |
| Docker | Không chạy container nào cho API/DB Production; `docker-compose.yml` trong repo chỉ dùng cho local dev (Postgres port 5433) | ✅ |
| systemd `iflux-api.service` | File tồn tại trong repo (`infra/staging/iflux-api.service`) nhưng **inactive** trên server — không được dùng | ✅ |
| Crontab | `crontab -l` (root) → trống, không có cron job nào | ✅ |
| Node runtime | `v20.20.0` | ✅ |
| Legacy `iflux_legacy_pre202607` DB | Vẫn tồn tại trên Postgres — DB cũ giữ lại (không active), cần Owner xác nhận lifecycle (Archive/xoá) | 🟡 |

**Kết luận AU-07 → Production Deployment Baseline:**

> Production hiện chạy ổn định (1 process, không multi-runtime — đúng như audit trước đã ghi nhận), nhưng **không có Git revision identity nào** — không thể trả lời câu hỏi BR-08 *"Production hiện đang chạy revision nào?"* bằng bất kỳ cách nào khác ngoài "xem mtime file gần nhất". Có thêm 1 vi phạm nhỏ về backup-in-live-scope (`/var/www/iflux/backups/`) và 3 file `.bak` sót lại trong `sites-available/` — cả hai chưa nằm trong phạm vi P0 cleanup trước đó.

---

## AU-04 — Deployment Boundary Matrix

Phân loại filesystem hiện tại (Production) theo đúng 9 category BRD yêu cầu:

| Category | Path thực tế | Ghi chú |
|---|---|---|
| **Git-owned (nên là)** | `User_Web/**`, `Admin_Design_system/**`, `backend/src/**`, `backend/package*.json`, `backend/migrations/*.sql`, `infra/nginx-*.conf` (mirror) | Hiện tại **có trong Git local nhưng KHÔNG phải nguồn của Production** — Production là bản rsync tay, không phải checkout |
| **Artifact-owned (nếu chọn kiến trúc artifact)** | *Chưa tồn tại* | Cần quyết định ở Gate 1 (SD-03) |
| **Environment configuration** | `/var/iflux/backend/.env` (server), `infra/staging/staging.env` (local, gitignored) | Đang trộn lẫn credential + path config + feature flag trong 1 file duy nhất — chưa tách theo environment thật |
| **Secrets** | SSH password, `CF_API_TOKEN`, `DATABASE_URL` password, `JWT_SECRET` (chỉ tồn tại trên server `.env`, đã "xoay" khỏi repo) | Không có secret manager; secrets nằm rải rác giữa local plaintext file và server `.env` |
| **Runtime-generated data** | `/var/iflux/storage/media` (5.1G), PM2 logs (`/root/.pm2/logs/`) | ✅ Đã tách đúng khỏi app code — **không nằm trong scope rsync hiện tại** (điểm tích cực, cần giữ nguyên nguyên tắc này khi thiết kế lại) |
| **Persistent data** | Postgres `iflux` DB, Redis, `/var/iflux/storage` | ✅ Ngoài phạm vi deploy app — đúng |
| **System configuration** | `/etc/nginx/**`, `/etc/letsencrypt/**`, `sshd_config` | Ngoài phạm vi Deploy Unit "Frontend/Admin/Backend"; đã có Deploy Unit "Infrastructure" riêng trong SoT cũ — hợp lý, giữ nguyên tinh thần |
| **Temporary** | `/var/www/iflux/backups/tmpDivBars_*`, `tmpZonePos_*` | **Đang nằm sai vị trí** — phải archive ngoài live tree (BR-15) |
| **Archive** | *Chưa có location chính thức* — hiện dùng `/var/www/iflux/backups/` (sai, nằm trong live tree) và một số lần dùng `/root/<task>-backup-<date>/` (đúng, ví dụ P0 cleanup gần đây) | Không nhất quán — cần 1 quy ước archive duy nhất ngoài live tree |

**Kết luận AU-04:** Boundary hiện tại **đã đúng một phần quan trọng** (persistent data/storage tách khỏi app code từ đầu — không cần sửa), nhưng **Application code, Environment config, Secrets, Backup/Archive đang không có ranh giới rõ ràng và không được Git quản lý**. Đây chính là input cho SD-03 (Deployment Mechanism) ở Gate 1.

---

## AU-05 — State Reconciliation Decision Input

Bằng chứng cho thấy **cơ chế reconciliation hiện tại = KHÔNG CÓ**:

| Bằng chứng | Ý nghĩa |
|---|---|
| Deploy = rsync **không có `--delete`** trong practice quan sát (SoT §4.1 bước 3 chỉ ghi rsync file/thư mục cụ thể, không phải toàn bộ tree với reconciliation) | File xoá ở nguồn **không tự động bị xoá** ở Production → đúng root cause đã xác nhận trong P0 cleanup gần đây (`_quarantine_zombie_*`, `backend/backend/` lồng nhau, `backend/app.js` cũ, 89 file `.bak.*`…) |
| Không có artifact/release directory versioned (không có kiểu `/releases/<sha>/` + symlink `current`) | Không thể "swap" giữa 2 version đã biết — mọi thay đổi là in-place overwrite |
| Migration không có down-script (`SoT — Deployment.md` §10.6 xác nhận "Forward Fix", không rollback schema) | Đúng nguyên tắc chung của ngành (an toàn hơn down-migrate ẩu), nhưng nghĩa là **rollback Production luôn là "asymmetric"** — code có thể rollback, schema thì không |
| `schema_migrations` có drift đã biết (`044_post_media_status.sql` trên đĩa nhưng chưa chắc trong bảng — theo `SoT — Deployment.md` OQ-04) | Xác nhận: kể cả tầng migration cũng chưa có reconciliation đầy đủ giữa "file trong repo" và "đã apply trên DB" |

**Kết luận AU-05:** Cần một cơ chế target-state reconciliation rõ ràng ở Gate 1 (ví dụ: atomic release directory + symlink, hoặc rsync `--delete` **chỉ sau khi** đã chứng minh đầy đủ 6 điều kiện BRD §30 mục SD-03). Audit này **không tự chọn** cơ chế — để ở Gate 1.

---

## AU-08 — Staging / Production Parity Audit

| Hạng mục | Production | Staging | Parity? |
|---|---|---|---|
| Web server | Nginx 443/80, domain `iflux.vn` | Nginx port 8888, domain `staging.iflux.vn` | 🟡 Khác cổng/domain (chấp nhận được cho 1 server dùng chung host) |
| Backend process | PM2 `iflux-api`, `APP_ENV=production` | **Dùng chung PM2 process với Production** | ❌ **Không có isolation** |
| Database | `iflux` (production data thật) | `iflux_staging` khai báo nhưng **không tồn tại** — thực chất Staging đang đọc/ghi **thẳng vào DB `iflux`** qua backend chung | ❌ **Không có isolation — rủi ro cao nhất trong toàn bộ audit** |
| Redis | `127.0.0.1:6379` (native, chung) | Cùng instance (theo `staging.env`, không có Redis riêng) | ❌ Chung |
| Storage/media | `/var/iflux/storage` (chung, vì backend chung) | Chung | ❌ Chung |
| Frontend static files | Cập nhật liên tục (mtime hôm nay) | mtime gần nhất ~5 tuần trước | ❌ Rất lệch (stale) |
| Secrets | `.env` server production | Khai trong `staging.env` local nhưng không active | 🟡 Tồn tại trên giấy, không dùng được |
| Infra (OS, Node version, PM2 version, nginx version) | Cùng 1 server vật lý | Cùng 1 server vật lý | ✅ Trùng 100% (vì literally same host) |

**Kết luận AU-08 → Staging/Production Parity Audit:**

> **Parity hiện tại ở mức 0% cho phần quan trọng nhất (backend + database + storage) và chỉ có "parity" ở phần ít quan trọng nhất (OS/runtime version — vì đây là cùng một máy vật lý).** Staging hiện tại **không đủ điều kiện** để đóng vai trò "environment hợp lệ để validate Production release" như BRD yêu cầu ở AU-08. Đây là gap kiến trúc lớn nhất cần Owner quyết định ở Gate 1 (có build Staging thật — server/process/DB riêng — hay chấp nhận một mô hình khác nhẹ hơn).

---

## Tổng hợp Evidence Legend — mọi lệnh đã chạy (tái lập được)

```text
# AU-01
git remote -v
git branch --show-current
git branch -a
git log --oneline -20
git log --oneline | wc -l
git tag
git ls-remote --heads origin
git status --short | wc -l
git log --oneline main..HEAD ; git log --oneline HEAD..main
find . -iname ".gitlab-ci.yml" (working tree + loop toàn bộ branch qua `git show <branch>:.gitlab-ci.yml`)

# AU-02
find . -iname "*deploy*" (excl. node_modules/.git)
cat backend/package.json
find infra -type f

# AU-03 / AU-06 / AU-07 (qua SSH read-only, không sửa gì)
pm2 list
cat /etc/nginx/sites-enabled/iflux-production.conf
cat /etc/nginx/sites-enabled/iflux-staging.conf
grep proxy_pass /etc/nginx/snippets/iflux-prod-app.conf
grep -E "^(NODE_ENV|APP_ENV|PORT|DATABASE_URL)=" /var/iflux/backend/.env
cd /var/iflux/backend && git status
sudo -u postgres psql -l
crontab -l
systemctl list-units | grep iflux
grep -i "PermitRootLogin\|PasswordAuthentication" /etc/ssh/sshd_config
wc -l /root/.ssh/authorized_keys
ls -la /var/www/iflux/ /var/iflux/ /etc/nginx/sites-enabled/ /etc/nginx/sites-available/
find /var/www/iflux/production -newermt "2026-08-10"
du -sh /var/www/iflux/production /var/www/iflux/staging /var/iflux/backend /var/iflux/storage
node --version ; pm2 --version
```

---

## Giới hạn của Audit này (đã minh bạch, không tự suy đoán thay)

| # | Giới hạn | Lý do |
|---|---|---|
| 1 | Không kiểm tra được GitLab Branch Protection Rules, CI/CD Runner availability, Merge Request approval rules | GitLab MCP server ở trạng thái `error` khi tool-discovery; không có quyền truy cập GitLab Settings UI trong audit này |
| 2 | Không full-scan lịch sử 43 commit để khẳng định tuyệt đối "chưa từng có secret nào từng bị commit rồi xoá" | Cần lệnh `git log -p` quét toàn bộ history theo pattern — có thể làm ở Gate 1 nếu Owner cần bằng chứng tuyệt đối |
| 3 | Không kiểm tra `https://staging.iflux.vn` bằng HTTP request thật (chỉ kiểm tra qua file config + SSH) | Audit tập trung vào filesystem/process/config; không cần thêm network call để kết luận (đã đủ evidence qua nginx conf + PM2 + DB list) |
| 4 | Không đề xuất kiến trúc CI/CD cụ thể (GitLab CI vs khác) | Đúng theo yêu cầu BRD — quyết định này thuộc Gate 1 (SD-02), audit chỉ cung cấp evidence |

---

**Không có bất kỳ thay đổi nào được thực hiện đối với Git, Production, Staging, DNS, Cloudflare, hay bất kỳ file cấu hình nào trong quá trình audit này.** Toàn bộ lệnh SSH đã chạy đều là read-only (`ls`, `cat`, `grep`, `find`, `du`, `pm2 list`, `crontab -l`, `psql -l`, `git status`, `node --version`).

**Gate 0 status: AUDIT COMPLETE. Implementation vẫn `NOT AUTHORIZED`. Tiếp theo → xem `03 - Gap Analysis, SoT Proposal, Solution Options.md`.**
