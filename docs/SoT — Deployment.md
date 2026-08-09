# SoT — Deployment

| | |
|--|--|
| **Document ID** | SoT-DEPLOY-001 |
| **Version** | 1.2 |
| **Status** | 🔒 **LOCKED as current-state Source of Truth** (as-is + Owner ops lock) |
| **Date** | 2026-08-02 |
| **Nature** | Mô tả **quy trình deploy thực tế đang dùng** — **không** thiết kế quy trình mới |
| **Audience** | Owner · Agent Cursor · Operator |
| **v1.1** | Deploy Units · Rollback decision tree · Forbidden · Deployment Principles (Owner) |
| **v1.2** | Định nghĩa Deploy · Git ≠ Production · bảng phân biệt thao tác (Owner-LOCK) |

> **Một file SoT duy nhất** cho triển khai iFlux.  
> Mọi khẳng định gắn nhãn bằng chứng:  
> - ✅ **Verified** — đã xác minh bằng code/config/server/log deploy  
> - 🟡 **Inferred** — suy ra từ bằng chứng gián tiếp (không quan sát trực tiếp đủ)  
> - 🔴 **Unknown** — chưa xác minh · Needs Owner Confirmation · **cấm suy đoán thành policy**  
> - 🔒 **Owner-LOCK** — Owner khóa vận hành trên nền as-is (không phải quy trình greenfield)

### Definition — Deploy (Owner-LOCK)

🔒 Trong toàn bộ tài liệu / hội thoại iFlux, khi nói **Deploy** mà **không** ghi rõ thêm, mặc định hiểu là:

> **Đưa mã/file đang có (thường từ local working tree) lên Production Server** theo **Deploy Unit** của SoT này, đủ bước unit tương ứng (rsync · restart/migrate/nginx nếu cần · Cloudflare purge khi FE/Admin · smoke), để **người dùng thực sự dùng được**.

**Deploy không đồng nghĩa với** (và **không** được diễn giải thành):

- Commit Git  
- Push Git  
- Merge Merge Request  
- Đồng bộ Repository / “phát hành mã nguồn lên GitLab”  
- Chỉ lưu / backup mã nguồn  

**Ngược lại:** Commit / Push / Merge chỉ là **Source Code Management (SCM)** — quản lý mã nguồn.  
Chúng **không** làm thay đổi Production. Production chỉ đổi khi có thao tác deploy server (rsync / pm2 / nginx / migrate / purge…).

**Cấm suy luận:** `Deploy = phát hành mã nguồn` · `Deploy = merge git` · `Đã lên GitLab = đã lên Production`.

**Trước mọi task deploy:** đọc Definition trên → xác định **Deploy Unit** (§1) → checklist unit → không đụng unit khác trừ khi task yêu cầu rõ.

---

## 0. Evidence legend & sources

| Source type | Examples |
|-------------|----------|
| Config repo | `infra/staging/staging.env` (keys only trong SoT — **không** ghi secret), `infra/nginx-iflux-production*.conf`, `infra/staging/iflux-api.service`, `infra/staging/nginx-iflux-api.conf` |
| Backend | `backend/package.json` (`start`, `migrate`), `backend/scripts/migrate.js`, `backend/src/server.js`, `backend/Dockerfile`, `backend/docker-compose.yml` |
| Live Production (2026-08-01 audit SSH) | PM2 `iflux-api`, paths `/var/www/iflux/production`, `/var/iflux/backend`, `/var/iflux/storage`, nginx snippets, Postgres 14 + Redis native, `/health` |
| Deploy practice | Cursor Agent rsync/SSH/CF purge (Owner rules + repeated phase deploy evidence, e.g. ABH E2/E3, Affiliate P7, Media Library 2026-07-30) |
| Verification docs | `docs/Architecture-Boundary-Hardening/E2-Deploy-Verification.md`, `E3-Deploy-Verification.md`, Affiliate P7 Verification |

**Cấm trong tài liệu này:** in IP origin, password, token, connection string.

Secrets / SSH / CF token: đọc từ `infra/staging/staging.env` lúc vận hành — **không** copy vào SoT.

---

## 1. Deploy Units

🔒 **Owner-LOCK** — Agent/Operator phải gắn mọi thay đổi triển khai vào **đúng một (hoặc nhiều, liệt kê rõ) Deploy Unit** trước khi rsync/restart.

| Deploy Unit | Phạm vi path / artifact | Target Production | Restart / side-effect thường lệ | Tag |
|-------------|-------------------------|-------------------|----------------------------------|-----|
| **Frontend** | `User_Web/**` | `$DEPLOY_WEB_PRODUCTION/User_Web/` | CF purge · hard refresh · **không** PM2 | ✅ |
| **Admin** | `Admin_Design_system/**` | `$DEPLOY_WEB_PRODUCTION/Admin_Design_system/` | CF purge · hard refresh · **không** PM2 | ✅ |
| **Backend** | `backend/src/**`, `backend/package.json`, `package-lock.json`, scripts runtime (không SQL) | `$DEPLOY_BACKEND/` | `npm install` nếu đổi dep · **`pm2 restart iflux-api`** | ✅ |
| **Migration** | `backend/migrations/*.sql` (+ runner nếu đổi) | Apply trên DB Production qua migrate/SQL | Theo §7 · **không** coi là “chỉ rsync file” là xong | ✅ |
| **Infrastructure** | `infra/nginx-*.conf`, nginx snippets/sites trên server, proxy `/api` `/media`, (hiếm) PM2/systemd unit files | `/etc/nginx/...` · không đổi layout path SoT | Backup `.bak*` · `nginx -t` · `systemctl reload nginx` | ✅ |

### 1.1 Mapping nhanh (AI nhìn là biết unit)

| Đổi gì | Deploy Unit |
|--------|-------------|
| HTML/JS/CSS User Web, shell, widget User | **Frontend** |
| HTML/JS/CSS Admin, admin-ui, app Admin | **Admin** |
| Express routes, services, `app.js`, PM2 process code | **Backend** |
| File `NNN_*.sql` / schema | **Migration** |
| Nginx location, SSL server block, proxy | **Infrastructure** |
| Chỉ tài liệu `docs/**` SoT/Plan | **Không deploy Production** (trừ Owner yêu cầu sync doc lên server — 🔴 hiếm) |

### 1.2 Quy tắc unit

| Rule | Tag |
|------|-----|
| Task báo cáo phải ghi: `Deploy Unit: Frontend | Admin | Backend | Migration | Infrastructure` (multi-ok) | 🔒 |
| Không “deploy cả repo” mặc định — chỉ file thuộc unit đã khai | ✅ practice rsync chọn file |
| Frontend/Admin cùng web root nhưng **unit tách** (checklist & rollback khác nhau về verify URL) | 🔒 |
| Migration **không** gộp im lặng vào Backend — phải gọi tên unit Migration | 🔒 |
| Infrastructure **cấm** đổi path SoT (`/var/www/iflux/production`, `/var/iflux/backend`, …) trừ Owner mở OQ | 🔒 + ✅ layout verified |

### 1.3 Multi-unit task

Ví dụ Media Library: Backend + Migration + Infrastructure (`/media/`) + (tuỳ) Admin editor → liệt kê đủ unit · deploy/verify theo từng unit · rollback theo decision tree §10 theo unit lỗi.

---

## 2. Kiến trúc môi trường triển khai

### 2.1 Môi trường

| Env | Public URL (tên miền) | Web root | API | Evidence |
|-----|------------------------|----------|-----|----------|
| **Production** (mặc định thi công) | User Web `https://iflux.vn` · Admin qua cùng domain (`/Admin_Design_system/…`, clean `/admin/…`) · API `https://iflux.vn/api` | `DEPLOY_WEB_PRODUCTION` = `/var/www/iflux/production` | Node listen `127.0.0.1:3001`, nginx proxy `/api/` | ✅ `staging.env` keys · ✅ live nginx `root` · ✅ `curl /health` → `env":"production"` · ✅ Owner rules |
| **Staging** | `https://staging.iflux.vn` (HTTPS public) | `DEPLOY_WEB_STAGING` = `/var/www/iflux/staging` | Cùng origin pattern `/api/` (config staging) | ✅ `staging.env` · ✅ dir tồn tại trên server · 🟡 **không** phải target mặc định (Owner rule: không deploy Staging trừ khi yêu cầu rõ) |
| **Local / Agent workspace** | N/A | Mac repo `iFLUX_P1` | Dev optional | ✅ repo |

### 2.2 Topology Production (verified)

```text
Client (browser)
    │ HTTPS
    ▼
Cloudflare CDN  ─── cache HTML/JS/CSS static (iflux.vn)
    │ origin (SSH không qua CDN proxy — chi tiết trong staging.env)
    ▼
Nginx (80/443)
    ├─ static: /var/www/iflux/production/{User_Web,Admin_Design_system,…}
    ├─ location /api/   → http://127.0.0.1:3001/api/
    └─ location /media/ → http://127.0.0.1:3001/media/   ✅ live snippet 2026-08-01
    ▼
PM2 process name: iflux-api
    script: /var/iflux/backend/src/server.js
    cwd:    /var/iflux/backend
    node:   20.x
    ▼
PostgreSQL 14 (native, 127.0.0.1:5432)     ✅
Redis (native, 127.0.0.1:6379)             ✅
Files: STORAGE_LOCAL_PATH=/var/iflux/storage  ✅ backend .env
```

| Component | Production reality | Evidence |
|-----------|-------------------|----------|
| API process manager | **PM2** app `iflux-api` · **online** | ✅ `pm2 describe iflux-api` |
| systemd `iflux-api` | Unit file **có trong repo** (`infra/staging/iflux-api.service`) nhưng trên host Production: **inactive** | ✅ repo + ✅ `systemctl is-active` inactive |
| Docker for API/DB on Production | **Không chạy** container iFlux API/DB | ✅ `docker` empty / no containers · ✅ native postgres/redis processes |
| `backend/docker-compose.yml` | Postgres+Redis **local-dev** (port 5433) | ✅ file — **không** chứng minh Production dùng Docker |
| Git working tree trên server web/backend | **Không** phải git checkout để release | ✅ `git rev-parse` fail trên `/var/www/iflux/production` và `/var/iflux/backend` |
| Deploy transport | **rsync over SSH** từ máy Agent/local → server paths | ✅ repeated practice + `DEPLOY_RSYNC_SSH` / SSH keys trong `staging.env` |

### 2.3 Path map (Verified)

| Role | Path / URL | Tag |
|------|------------|-----|
| Production web | `/var/www/iflux/production` | ✅ |
| Staging web | `/var/www/iflux/staging` | ✅ |
| Backend | `/var/iflux/backend` | ✅ |
| Storage | `/var/iflux/storage` | ✅ |
| Backend env file | `/var/iflux/backend/.env` | ✅ |
| Nginx sites | `/etc/nginx/sites-enabled/` (`iflux-production.conf`, `iflux-staging.conf`) | ✅ |
| Nginx app snippet | `/etc/nginx/snippets/iflux-prod-app.conf` (+ locations snippet) | ✅ |
| Repo mirror nginx | `infra/nginx-iflux-production.conf`, `infra/nginx-iflux-production-locations.conf` | ✅ |
| Credentials file (local) | `infra/staging/staging.env` | ✅ |

### 2.4 Public surfaces

| Surface | Entry (domain) | Files under web root | Tag |
|---------|----------------|----------------------|-----|
| User Web | `https://iflux.vn/…` (slug Việt) | `User_Web/` | ✅ |
| Admin | `https://iflux.vn/Admin_Design_system/app/dashboard/index.html` (+ clean `/admin/…`) | `Admin_Design_system/` | ✅ |
| API | `https://iflux.vn/api/…` | proxied to Node | ✅ |
| Media public | `https://iflux.vn/media/…` | proxied to Node static | ✅ |

---

## 3. Branch & Release Strategy

### 3.1 Git remote

| Fact | Value | Tag |
|------|-------|-----|
| Remote | GitLab `git@gitlab.com:gm.tpv9/iflux.git` | ✅ `git remote -v` |
| CI pipeline deploy | **Không** có `.gitlab-ci.yml` trong workspace audit | ✅ absent |
| Automated CD | **Không** thấy | ✅ |

### 3.2 Observed branch practice

| Observation | Tag |
|-------------|-----|
| Nhiều nhánh feature / milestone (`feat/*`, `milestone/safe-baseline-20260730`, `release/affiliate-golden`, …) | ✅ local/remotes |
| `main` tồn tại; tại thời điểm audit local `main` **behind** remote | ✅ |
| Có MR trên GitLab (ví dụ Safe Baseline MR trong lịch sử làm việc) | 🟡 lịch sử Agent/Owner — không phải gate bắt buộc mọi deploy |
| **Deploy Production thường từ working tree local (Agent)** qua rsync file cụ thể — **không** bắt buộc `git pull` trên server | ✅ server không phải git tree + practice |

### 3.3 Release strategy (as-is)

```text
Edit local (Cursor Agent / developer)
    → (optional) commit / MR trên GitLab     ← chỉ SCM; không = Deploy
    → rsync changed files → Production paths ← bắt đầu Deploy
    → (if backend) npm install / migrate / pm2 restart
    → (if nginx) nginx -t && reload
    → Cloudflare purge
    → smoke / Owner hard refresh
```

| Statement | Tag |
|-----------|-----|
| Không có “release train” tuần / tag bắt buộc trong repo | 🔴 Unknown formal policy — Needs Owner Confirmation |
| Merge vào `main` **trước** mọi Production deploy | 🔴 Unknown — hiện thực quan sát được cho phép deploy file trước/không qua merge |
| Staging bắt buộc trước Production | ❌ **Không** — Owner rule + practice: Production mặc định | ✅ |
| Commit/MR **optional** so với Deploy | ✅ practice + 🔒 Definition § đầu tài liệu · §3.4 |

---

### 3.4 Git Repository vs Production Deployment

🔒 **Owner-LOCK**

**Git và Production là hai hoạt động hoàn toàn khác nhau.** Không được đồng nhất.

#### Git Repository (SCM)

| | |
|--|--|
| **Mục đích** | Lưu lịch sử · review · merge · backup · collaboration |
| **Kết quả khi commit/push/merge** | ✔ Mã xuất hiện trên GitLab |
| | ❌ **Không** có nghĩa Production đã thay đổi |

#### Production Deployment

| | |
|--|--|
| **Mục đích** | Đưa code/file đang có lên Production Server để người dùng thực sự sử dụng |
| **Kết quả khi Deploy PASS** | ✔ File đã rsync lên server |
| | ✔ Backend đã restart (nếu unit Backend cần) |
| | ✔ Migration đã chạy (nếu unit Migration) |
| | ✔ Cloudflare đã purge (nếu Frontend/Admin) |
| | ✔ Smoke test PASS |
| | ✔ Người dùng truy cập được tính năng mới |

#### Quan hệ

```text
Git không deploy.
Production không commit.
Hai việc độc lập.
```

| Case | Chuỗi | GitLab | Production |
|------|-------|--------|------------|
| **A** | Local → Commit → GitLab | Đổi | **Không đổi** — chưa Deploy |
| **B** | Local → Deploy Production | Có thể **chưa** có commit | **Đã đổi** |
| **C** | Local → Commit Git → Deploy Production | Đổi | Đổi — cả hai cập nhật |
| **D** | Deploy Production → sau đó mới commit | Đổi sau | Đổi trước — **được phép** nếu Owner quyết |

#### Bảng phân biệt thao tác

| Hành động | Git thay đổi | Production thay đổi |
|-----------|:------------:|:-------------------:|
| Commit | ✅ | ❌ |
| Push | ✅ | ❌ |
| Merge MR | ✅ | ❌ |
| rsync lên server | ❌ | ✅ |
| `pm2 restart` | ❌ | ✅ |
| `nginx reload` | ❌ | ✅ |
| Cloudflare purge | ❌ | ✅ |
| Smoke test trên domain | ❌ | ✅ (xác minh) |
| `git pull` / `git init` trên server | — | **Cấm** (F-04 · F-05) |

**Agent rule:** Khi Owner nói “deploy” → làm § Deploy Unit trên Production.  
Khi Owner nói “commit / push / MR” → chỉ SCM.  
**Không** trả lời “đã deploy” nếu mới chỉ commit/push/merge.  
**Không** trả lời “cần merge trước” như điều kiện bắt buộc của Deploy trừ khi Owner khóa OQ-01.

---

## 4. Quy trình deploy User Web (**Deploy Unit: Frontend**)

**Mặc định Production.** Staging chỉ khi Owner yêu cầu rõ.

### 4.1 Steps (as practiced)

| # | Step | How | Tag |
|---|------|-----|-----|
| 1 | Xác định file đổi dưới `User_Web/` | Diff local | ✅ |
| 2 | Đọc `infra/staging/staging.env` → `DEPLOY_*`, `CF_*` | Python parse (không `source` cả file nếu có ký tự đặc biệt) | ✅ practice |
| 3 | `rsync -az -e "$DEPLOY_RSYNC_SSH"` file/thư mục → `$DEPLOY_WEB_PRODUCTION/User_Web/...` | SSH + rsync | ✅ |
| 4 | Cache-bust static nếu cần | Query `?v=…` trên script tags (pattern phổ biến) | ✅ verification docs / HTML |
| 5 | Cloudflare purge | `POST /zones/{CF_ZONE_ID}/purge_cache` body `{"purge_everything": true}` + `CF_API_TOKEN` | ✅ |
| 6 | Verify | Mở URL domain `https://iflux.vn/…` · hard refresh | ✅ Owner/Agent practice |

### 4.2 Không làm (observed)

| Item | Tag |
|------|-----|
| Không build bundler bắt buộc (static JS/HTML) | ✅ tree User_Web |
| Không restart PM2 khi chỉ đổi User Web | ✅ practice |
| Không ghi IP trong hội thoại/báo cáo | ✅ Owner rule |

---

## 5. Quy trình deploy Admin (**Deploy Unit: Admin**)

Cùng web root Production với User Web.

| # | Step | How | Tag |
|---|------|-----|-----|
| 1 | File dưới `Admin_Design_system/` | Diff local | ✅ |
| 2 | rsync → `$DEPLOY_WEB_PRODUCTION/Admin_Design_system/...` | SSH + rsync | ✅ |
| 3 | Cloudflare purge | Giống §3 | ✅ |
| 4 | Verify | `https://iflux.vn/Admin_Design_system/app/dashboard/index.html` hoặc clean `/admin/…` | ✅ |

**Nginx Admin routing:** rewrite/clean URL nằm trong nginx locations snippet.  
Đổi routing nginx → deploy thêm file nginx + `nginx -t` + reload (§8).

---

## 6. Quy trình deploy Backend/API (**Deploy Unit: Backend**)

### 6.1 Steps (as practiced)

| # | Step | How | Tag |
|---|------|-----|-----|
| 1 | Đổi code dưới `backend/` (thường `src/`, `migrations/`, `package.json`/`package-lock.json`) | Local | ✅ |
| 2 | rsync → `$DEPLOY_BACKEND/` (`/var/iflux/backend`) | SSH + rsync | ✅ |
| 3 | Trên server: `cd /var/iflux/backend && npm install …` khi thêm dependency | SSH | ✅ (vd Media: multer/sharp) |
| 4 | Migration nếu có SQL mới | §7 | ✅ |
| 5 | Restart API | `pm2 restart iflux-api` (hoặc `pm2 restart all` đã dùng) | ✅ live + practice |
| 6 | Health | `curl http://127.0.0.1:3001/health` và/hoặc `https://iflux.vn/api/...` | ✅ |
| 7 | CF purge | Nếu response/API HTML bị CDN ảnh hưởng; static admin/user liên quan | ✅ practice thường kèm |

### 6.2 Process facts

| Fact | Tag |
|------|-----|
| Start script package: `node src/server.js` (`npm start`) | ✅ `package.json` |
| Live PM2 script path: `/var/iflux/backend/src/server.js` | ✅ |
| Env: `/var/iflux/backend/.env` với `APP_ENV=production`, `PORT=3001`, `STORAGE_LOCAL_PATH=/var/iflux/storage` | ✅ |
| `infra/staging/iflux-api.service` (systemd) **không** phải process đang chạy Production | ✅ inactive |
| PM2 dump file có thể còn path cũ `/var/www/iflux-api` — **stale vs live describe** | ✅ dump vs describe lệch · 🟡 ý nghĩa lịch sử migrate path |

### 6.3 Docker

| Fact | Tag |
|------|-----|
| `backend/Dockerfile` tồn tại (Node 20, `CMD node src/server.js`) | ✅ |
| Production API **không** chạy bằng Docker container tại audit | ✅ |
| `docker-compose.yml` = local Postgres/Redis | ✅ |

---

## 7. Database Migration (**Deploy Unit: Migration**)

### 7.1 Mechanism

| Item | Detail | Tag |
|------|--------|-----|
| Command | `npm run migrate` → `node scripts/migrate.js` | ✅ |
| Tracking table | `schema_migrations (filename UNIQUE)` | ✅ `migration-runner.js` |
| Migrations dir | `backend/migrations/*.sql` (sorted filename) | ✅ |
| `ensureDatabase()` | Dùng `DATABASE_ADMIN_URL` / user-password tách — **có thể fail** nếu env Production chỉ có `DATABASE_URL` | ✅ code + ✅ fail quan sát 2026-07-30 (`SASL … password must be a string`) |

### 7.2 Production practice khi `npm run migrate` fail

| Step | Detail | Tag |
|------|--------|-----|
| Workaround đã dùng | Apply SQL bằng Node `pg` + `DATABASE_URL` + insert `schema_migrations` | ✅ Media Library deploy 2026-07-30 |
| Formal “chỉ được dùng workaround” | 🔴 Needs Owner Confirmation |

### 7.3 Audit snapshot 2026-08-01

| Fact | Tag |
|------|-----|
| `schema_migrations` row count = **13** | ✅ |
| File `043_community_media_library.sql` đã apply | ✅ |
| File `044_post_media_status.sql` **có trên disk** backend migrations | ✅ |
| `044` **không** có trong `schema_migrations` filter `04%` | ✅ → **drift** local/server disk vs applied set |
| Full history: mọi file `00x–042` đã apply qua runner hay bootstrap khác? | 🔴 Unknown — chỉ biết bảng hiện có 13 rows |

---

## 8. Restart Services

| Service | How (Production as-is) | When | Deploy Unit | Tag |
|---------|------------------------|------|-------------|-----|
| **API** | `pm2 restart iflux-api` | Sau đổi backend / env cần reload process | Backend | ✅ |
| **Nginx** | `nginx -t` rồi `systemctl reload nginx` | Sau sửa conf/snippet | Infrastructure | ✅ |
| **Postgres / Redis** | Không restart trong quy trình deploy app thường lệ | — | — | ✅ không thấy trong deploy app |
| **systemd iflux-api** | Không dùng trên Production hiện tại | — | — | ✅ |
| **Docker** | N/A Production API | — | — | ✅ |

**PM2 logs:** `/root/.pm2/logs/iflux-api-out.log`, `…-error.log` ✅.

---

## 9. Post-deployment Verification & Smoke Test

### 9.1 Minimum smoke (observed patterns)

| Check | Command / action | Tag |
|-------|------------------|-----|
| API health | `GET https://iflux.vn/api/…` hoặc origin `http://127.0.0.1:3001/health` → `ok: true`, `service: iflux-api` | ✅ |
| User page | Mở route Việt trên `https://iflux.vn` + hard refresh sau CF purge | ✅ |
| Admin page | Dashboard / page vừa sửa | ✅ |
| Static grep on Production | `grep`/`test -f` dưới `/var/www/iflux/production/...` | ✅ P7 / ABH docs |
| Feature-specific | Theo checklist phase (Owner smoke) | ✅ E2/E3/P7 |

### 9.2 Cloudflare

| Fact | Tag |
|------|-----|
| Production đi CDN → **purge sau deploy frontend** là bước thực tế bắt buộc để thấy bản mới kịp | ✅ Owner rules + API purge success logs |
| Method quan sát | `purge_everything: true` | ✅ |
| TTL nếu không purge | Owner note ~1h | 🟡 rule text — không đo trong audit này |

---

## 10. Rollback Procedure

### 10.1 Verified fragments (công cụ sẵn có)

| Mechanism | Evidence | Tag |
|-----------|----------|-----|
| Nginx snippet backups | Nhiều file `iflux-prod-app.conf.bak*` / `iflux-production-locations.conf.bak*` trên server | ✅ |
| Re-rsync phiên bản file cũ từ git local / máy Agent | Practice đảo chiều rsync | 🟡 |
| `pm2 restart` sau rollback Backend code | Live PM2 | ✅ |
| CF purge sau rollback Frontend/Admin | Cùng cơ chế deploy | ✅ |
| Down-migration SQL trong runner | **Không có** | ✅ code |

### 10.2 Decision tree (Production đang lỗi) — 🔒 Owner-LOCK

**Bước 0 — Phân loại Deploy Unit bị cháy** (không đoán): nhìn URL lỗi · log PM2 · nginx error · hay `schema_migrations`/SQL vừa chạy.

```text
Production sự cố sau deploy
        │
        ▼
Xác định Deploy Unit lỗi?
   │
   ├─ Frontend (User Web UI/JS/CSS)
   │        ▼
   │     ROLLBACK FRONTEND  (§10.3)
   │
   ├─ Admin (Admin UI)
   │        ▼
   │     ROLLBACK ADMIN  (§10.4)
   │
   ├─ Backend (API 5xx / health fail / logic API)
   │        ▼
   │     ROLLBACK BACKEND  (§10.5)
   │
   ├─ Migration (migrate fail / schema broken / data path)
   │        ▼
   │     FORWARD FIX  (§10.6)  ← không down-migrate
   │
   └─ Infrastructure (nginx 502 routing / SSL / proxy)
            ▼
         ROLLBACK INFRASTRUCTURE  (§10.7)
```

**Multi-unit:** rollback **unit đang gây cháy trước**; không “revert cả repo” trừ Owner lệnh.

### 10.3 Rollback Frontend

```text
Frontend lỗi
  → Xác định file/revision trước (git local / bản đã biết tốt)
  → rsync lại file Frontend cũ → $DEPLOY_WEB_PRODUCTION/User_Web/...
  → Cloudflare purge
  → Hard refresh smoke https://iflux.vn/...
  → Không pm2 restart
```

Tag: 🔒 + ✅ công cụ (rsync/CF).

### 10.4 Rollback Admin

```text
Admin lỗi
  → rsync lại file Admin cũ → $DEPLOY_WEB_PRODUCTION/Admin_Design_system/...
  → Cloudflare purge
  → Smoke Admin dashboard / page lỗi
  → Không pm2 restart
```

Tag: 🔒 + ✅.

### 10.5 Rollback Backend

```text
Backend lỗi
  → rsync lại src/package* revision trước → $DEPLOY_BACKEND/
  → Nếu vừa đổi dependency: npm install khớp lockfile cũ
  → pm2 restart iflux-api
  → curl health + smoke API
  → Nếu lỗi kèm Migration vừa apply → xem §10.6 (không chỉ restart)
```

Tag: 🔒 + ✅.

### 10.6 Migration lỗi → Forward Fix (không rollback schema)

🔒 **Owner-LOCK:** runner **không** có down-migration ✅ → sự cố Migration **không** “rollback SQL tự động”.

```text
Migration lỗi
  → Dừng deploy thêm / không chạy migrate lặp mù
  → Giữ API ở trạng thái an toàn nhất có thể
       (rollback Backend code nếu binary/app không tương thích schema mới
        — chỉ khi đó là unit Backend; schema vẫn forward)
  → Forward Fix:
       • sửa migration / thêm migration sửa chữa trong repo
       • apply forward trên Production
       • verify schema_migrations + smoke nghiệp vụ
  → Báo Owner nếu data đã ghi một phần
```

| Cấm lúc cháy Migration | Tag |
|------------------------|-----|
| Tự viết `DROP`/`DOWN` trên Production khi chưa có SoT down | 🔒 |
| `git` init / pull trên server để “vá” | 🔒 Forbidden §11 |
| Sửa schema bằng tay trên DB rồi quên file migration trong repo | 🔒 |

### 10.7 Rollback Infrastructure

```text
Infrastructure lỗi (nginx)
  → Khôi phục conf từ .bak* đã có trên server (hoặc rsync bản repo đã biết tốt)
  → nginx -t
  → systemctl reload nginx
  → Smoke /api / route User / Admin
```

Tag: 🔒 + ✅ `.bak*` tồn tại.

### 10.8 Unknown (vẫn mở)

| Topic | Tag |
|-------|-----|
| Blue/Green · symlink release | 🔴 |
| RTO/RPO số phút cam kết | 🔴 |
| Quy trình Owner approve trước mọi rollback | 🔴 OQ |

---

## 11. Forbidden — Không được làm

🔒 **Owner-LOCK** — Agent vi phạm = dừng task · báo Owner.

| ID | Forbidden | Lý do (neo as-is) |
|----|-----------|-------------------|
| **F-01** | ❌ Deploy / sửa code **trực tiếp trên Production bằng editor** (nano/vim trên server rồi coi là xong) | Nguồn sự thật là repo local + rsync; server **không** phải git worktree ✅ |
| **F-02** | ❌ Sửa file trên server rồi **quên** đưa ngược về repo / không commit khi Owner yêu cầu lịch sử | Drift Production ↔ git |
| **F-03** | ❌ Copy secret (`staging.env` password, `CF_API_TOKEN`, `.env` DB, JWT…) **vào repo / chat / SoT / MR** | SoT + Owner rule |
| **F-04** | ❌ `git init` trên Production web/backend | Host không dùng git release ✅ |
| **F-05** | ❌ `git pull` / `git checkout` trên Production để “deploy” | Không phải quy trình as-is ✅ |
| **F-06** | ❌ Deploy **Staging mặc định** khi Owner không yêu cầu | Owner rule + SoT env |
| **F-07** | ❌ Đổi server layout path (`/var/www/iflux/production`, `/var/iflux/backend`, `/var/iflux/storage`) ngoài Owner + cập nhật SoT | Topology verified |
| **F-08** | ❌ In **IP origin** trong hội thoại user-facing / tài liệu công khai | Owner rule — dùng tên miền |
| **F-09** | ❌ Coi Docker/`docker-compose` local là Production runtime | Production = PM2 + native PG/Redis ✅ |
| **F-10** | ❌ Down-migrate / xóa dữ liệu Production để “rollback cho nhanh” khi Migration lỗi | Owner decision tree = Forward Fix |
| **F-11** | ❌ Deploy ngoài SoT này (bịa pipeline, tự CD, tự systemd thay PM2…) | Principles §15 |
| **F-12** | ❌ Purge/skip CF tùy tiện rồi bảo FE “đã lên” khi User vẫn thấy bản CDN cũ | Practice bắt buộc purge FE |
| **F-13** | ❌ Đồng nhất **Deploy** với Commit / Push / Merge / “đẩy lên Git” — hoặc bảo “đã deploy” khi chỉ mới SCM | Definition + §3.4 |

---

## 12. Deployment Checklist

Dùng trước khi báo Owner “đã deploy Production”.

### 12.1 Chung

- [ ] **Deploy Unit** đã ghi rõ (§1)
- [ ] Phạm vi file khớp unit
- [ ] Đã đọc `infra/staging/staging.env` (không commit secret)
- [ ] Target = **Production** trừ khi Owner yêu cầu Staging
- [ ] Không vi phạm Forbidden (§11)
- [ ] Không nhắc IP trong báo cáo user-facing

### 12.2 Frontend / Admin

- [ ] rsync đúng `$DEPLOY_WEB_PRODUCTION/...`
- [ ] Cache-bust `?v=` nếu HTML giữ tên file cũ
- [ ] Cloudflare purge success
- [ ] Hard refresh smoke trên tên miền

### 12.3 Backend

- [ ] rsync `$DEPLOY_BACKEND`
- [ ] `npm install` nếu đổi dependency
- [ ] Migration (§7) nếu có — unit Migration tách checklist
- [ ] `pm2 restart iflux-api`
- [ ] `GET /health` OK (`env=production`)

### 12.4 Migration

- [ ] File SQL trong repo
- [ ] Apply + xác nhận `schema_migrations`
- [ ] Smoke nghiệp vụ phụ thuộc schema
- [ ] Có kế hoạch Forward Fix nếu fail (§10.6)

### 12.5 Infrastructure

- [ ] Backup conf trước khi sửa (`.bak-…`)
- [ ] `nginx -t` && `systemctl reload nginx`
- [ ] Không đổi path layout SoT

### 12.6 Ghi nhận

- [ ] Evidence path Production đã kiểm
- [ ] Open questions (§13) nếu phát sinh drift

---

## 13. Open Questions / Owner Confirmation

| ID | Question | Why |
|----|----------|-----|
| **OQ-01** | Deploy Production có **bắt buộc** merge/MR GitLab trước rsync không? | Hiện **không** bắt buộc (§3.4 Case B/D). OQ chỉ hỏi Owner có muốn **siết thêm** gate SCM trước Deploy hay giữ độc lập |
| **OQ-02** | `main` vs `milestone/*` — nhánh nào là release SoT? | Nhiều nhánh; policy chưa khóa trong repo |
| **OQ-03** | Chuẩn hóa migration Production: sửa `.env` thêm `DATABASE_ADMIN_URL` để `npm run migrate` ổn định, hay luôn apply SQL thủ công? | `ensureDatabase` đã fail khi thiếu admin URL |
| **OQ-04** | Xử lý drift `044_post_media_status.sql` (có file, chưa thấy trong `schema_migrations`)? | Audit 2026-08-01 |
| **OQ-05** | Có nên xóa/ignore `pm2 dump` path cũ `/var/www/iflux-api` để tránh nhầm? | dump ≠ live describe |
| **OQ-06** | ~~Rollback DB down-migration?~~ → **Chốt incident: Forward Fix** (§10.6). Còn mở: có bao giờ cho phép down có kiểm soát không? | Owner tree v1.1 |
| **OQ-07** | Staging: ai được phép deploy, tần suất, parity với Production? | Dir + URL tồn tại; không phải mặc định |
| **OQ-08** | systemd unit trong repo — giữ cho Staging tương lai hay archive? | Production dùng PM2 |
| **OQ-09** | Cloudflare purge: luôn `purge_everything` hay chuyển purge URL cụ thể? | Chỉ thấy everything trong practice |
| **OQ-10** | Có SoT/MR standard branch `docs/mr-standard` — có áp làm gate deploy không? | Branch tồn tại; chưa neo vào SoT này |

---

## 14. Anti-patterns (quan sát — không phải thiết kế mới)

| Anti-pattern đã thấy | Risk | Tag |
|----------------------|------|-----|
| Deploy file không qua git server checkout | Khó audit “production = commit nào” | ✅ |
| `schema_migrations` count thấp vs nhiều file SQL trong repo | Drift schema history | ✅ |
| Stale PM2 dump path | Operator nhầm cwd cũ | ✅ |
| Nhiều nginx `.bak*` | Hữu ích rollback nhưng bẩn | ✅ |

---

## 15. Related documents (không thay SoT này)

| Doc | Role |
|-----|------|
| Owner Cursor rules (deploy Production, CF purge, domain-only) | Operational constraint Agent |
| `docs/Architecture-Boundary-Hardening/E2-Deploy-Verification.md` | Phase evidence mẫu |
| `docs/SoT — Engineering Change Governance.md` | Đổi code — không thay Deployment SoT |

---

## 16. Change control for this SoT

- Cập nhật SoT này **chỉ** khi quy trình thực tế đổi và có bằng chứng mới (Verified), **hoặc** Owner khóa ops (🔒) như v1.1.
- Không thêm bước “nên có” nếu chưa vận hành — ghi **OQ** / 🔴 Unknown.
- Khi Owner chốt OQ → sửa mục tương ứng + nâng Version.
- **Mọi thay đổi quy trình deploy phải cập nhật SoT này trước hoặc cùng lúc** (Principle P-05).

---

## 17. Deployment Principles

🔒 **Owner-LOCK — triết lý vận hành** (Agent thống nhất cách làm):

| ID | Principle |
|----|-----------|
| **P-01** | **Production là mặc định.** Staging chỉ khi Owner yêu cầu rõ. |
| **P-02** | **Không suy đoán.** Thiếu bằng chứng → 🔴 Unknown / hỏi Owner — không bịa bước deploy. |
| **P-03** | **Không thay đổi server layout** (path web/backend/storage/process model PM2) ngoài Owner + cập nhật SoT. |
| **P-04** | **Không deploy ngoài SoT.** Mọi deploy đi theo Deploy Unit + checklist + Forbidden. |
| **P-05** | **Mọi thay đổi quy trình phải cập nhật SoT trước hoặc cùng lúc** — không “làm tắt rồi viết sau”. |
| **P-06** | **Gắn Deploy Unit trước khi đụng server.** Không unit → không rsync. |
| **P-07** | **Secrets không vào repo / SoT / hội thoại.** Đọc `staging.env` / `.env` tại chỗ vận hành. |
| **P-08** | **User-facing chỉ tên miền** (`iflux.vn`, `staging.iflux.vn`) — không IP. |
| **P-09** | **Rollback theo decision tree §10** khi Production cháy — không improvise down-migrate. |
| **P-10** | **Nguồn sửa là repo local; Production là đích rsync** — không biến server thành nơi soạn thảo. |
| **P-11** | **Git ≠ Production.** Deploy ≠ commit/push/merge. Báo “đã deploy” chỉ khi server/user-facing đã đổi theo Definition. |

---

**End of SoT — Deployment v1.2**
