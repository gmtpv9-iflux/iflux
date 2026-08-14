# 13 — Production ↔ Staging Baseline Verification Report

**Ngày audit:** 14/08/2026 (10:44–11:15, UTC+7)
**Phạm vi:** Read-only. Không sửa Production, không sửa Staging trong suốt audit.
**Người thực hiện:** Agent, theo yêu cầu Owner "Verify Staging Baseline và chuyển chiến lược Production".
**Đối tượng so sánh:** `iflux.vn` (Production hiện tại, LIVE) ↔ `staging.iflux.vn` (Staging mới, deploy qua GitHub Actions từ ngày 12-14/08/2026).

> Quy tắc áp dụng: không suy diễn MATCH khi không có evidence. Mọi dòng dưới đây có lệnh/số liệu thật đứng sau, không dựa trên "đã migration trước đó nên coi như xong".

---

## 1. Application / Source

| Area | Production (`iflux.vn`) | Staging (`staging.iflux.vn`) | Status | Evidence | Gap |
|---|---|---|---|---|---|
| Deployment model | `/var/www/iflux/production` là **directory thật** (không symlink), sửa trực tiếp | `/var/www/iflux/staging` là **symlink** → `releases-staging/<release-id>` (atomic release) | MISMATCH | `readlink -f` production trả về chính nó; staging trả về `.../releases-staging/20260814094740-...` | Đúng như thiết kế Plan 12 (Staging dùng CI/CD atomic, Production vẫn quy trình cũ) — không phải lỗi, nhưng nghĩa là 2 bên **không cùng deployment mechanism**, nên "giống 100%" chỉ áp dụng ở tầng nội dung file, không áp dụng ở tầng vận hành deploy |
| Backend deployment model | `/var/iflux/backend` là directory thật | `/var/iflux/backend-staging/current` là symlink atomic release | MISMATCH (như trên) | `file /var/iflux/backend` → "directory"; staging release id khớp cùng lần deploy với frontend | Cùng lý do trên |
| Frontend file count (loại trừ `.git`) | 1270 file | 1030 file | MISMATCH | `find -type f` cả 2 phía | Chênh 240 file — cần audit chi tiết (có thể gồm file SEO/generate cũ trên Production chưa được đưa vào Git, xem mục "Reconciliation debt" bên dưới; đã biết từ audit trước có ~117 file Production thiếu trong Git) |
| Backend source file count (loại `.venv`, `node_modules`) | `src/`=197, `scripts/`=14, `migrations/`=61, `seeds/`=1, `tests/`=2, `data/`=2, `workers/`=3 (source thật, không tính `.venv`) | Cùng cấu trúc, cùng số file (`workers/`=3 file source khớp tên) | MATCH | `find` theo từng thư mục con, so tên file `workers/*.py .js .txt` khớp 1:1 | Không có gap ở source thật; chênh lệch tổng file trước đó là do `workers/.venv` (Python virtualenv — tương đương `node_modules`, generated, đúng là không nên có trên Staging/Git) |
| Node runtime version | v20.20.0 | v20.20.0 | MATCH | `node --version` cả 2 phía | — |
| PM2 process | `iflux-api` (root, fork, restart=272, uptime 46h) | `iflux-api-staging` (user `iflux-app`, fork, restart=18, uptime ~1h) | MATCH (kiến trúc) | `pm2 list` | Tên khác nhau đúng theo isolation, đúng thiết kế Plan 12 |
| Nginx routing (clean-URL Việt, proxy, static) | `iflux-prod-app.conf` — 612 dòng | `iflux-staging-app.conf` — 611 dòng | MATCH | `diff` 2 file: chỉ khác path (`/production` ↔ `/staging`), port (`3001` ↔ `3002`), và `robots.txt` (chủ ý trả `Disallow: /` tĩnh trên Staging) | Không có route logic nào khác biệt ngoài các thay thế có chủ đích |
| Scheduled jobs trong code (`node-cron`) | `core/scheduler/scheduler.js`, `market-price-sync.service.js` — cùng file trên cả 2 (cùng Git source) | Cùng file | MATCH (source) | `grep -rl "cron.schedule"` | Chạy thật hay không tuỳ `SCHEDULER_ENABLED` — xem mục Runtime/Config |
| OS-level cron / systemd timer cho worker ingest | Không có (không tìm thấy crontab root/iflux-app/iflux-deploy, không có file trong `/etc/cron.d` liên quan) | Không có (đồng nhất, vì không tồn tại crontab nào) | MATCH | `crontab -l` tất cả user liên quan → rỗng; `/etc/cron.d` chỉ có certbot/php/sysstat/e2scrub hệ thống | Ingest job hiện chạy qua in-app scheduler (node-cron) bên trong PM2, không qua OS cron |
| `.gitignore` reconciliation debt | Production có ~117 file (đa số SEO generated HTML + vài JS/CSS core) chưa từng vào Git — phát hiện từ audit `10 - Application Code Reconciliation Audit` | Staging chỉ có những gì đã vào Git (qua CI/CD) | MISMATCH (đã biết trước, chưa đóng) | Xem file `10 - Application Code Reconciliation Audit (Production vs Staging vs Git).md` | Đây là **debt tồn từ trước**, không phải lỗi mới. Cần Phase reconciliation riêng nếu muốn Git = 100% nguồn thật của Production |

---

## 2. Database

| Area | Production (`iflux`) | Staging (`iflux_staging`) | Status | Evidence | Gap |
|---|---|---|---|---|---|
| Số bảng (`public` schema) | 100 | 100 | MATCH | `information_schema.tables` count | — |
| Danh sách tên bảng | — | — | MATCH | `diff` 2 danh sách tên bảng → **IDENTICAL** | — |
| Số cột (toàn schema) | 857 | 857 | MATCH | `information_schema.columns` count | — |
| Số index | 258 | 258 | MATCH | `pg_indexes` count | — |
| Số constraint | 873 | 873 | MATCH | `information_schema.table_constraints` count | — |
| Số view | 0 | 0 | MATCH | `information_schema.views` count | — |
| Số trigger | 1 | 1 | MATCH | `information_schema.triggers` count | — |
| Migration state (`schema_migrations` applied) | 16 | 16 | MATCH | `select count(*) from schema_migrations` | — |
| Dữ liệu — **tại thời điểm clone** (14/08 ~09:11) | users=9, community_posts=4015, stocks=1526, sectors=19 | Giống Production tại thời điểm đó | MATCH (point-in-time) | Đã verify trong Plan 12 execution log | — |
| Dữ liệu — **hiện tại** (14/08 ~10:50, tức ~99 phút sau clone) | users=9, **community_posts=4038**, stocks=1526 | users=9, **community_posts=4015**, stocks=1526 | **MISMATCH (data drift, đúng như thiết kế)** | `select count(*) from community_posts` 2 phía; `max(created_at)`: Production `10:50:04`, Staging `09:11:18` | Staging DB là **snapshot một lần**, không sync liên tục. Production tiếp tục nhận dữ liệu mới (23 bài viết mới trong ~99 phút) mà Staging không có. **Đây không phải lỗi** — đúng theo quyết định Owner (raw clone một lần, không đồng bộ định kỳ) — nhưng phải ghi rõ: Staging **không phải live mirror**, chỉ là baseline snapshot tại 14/08/2026 09:11 |
| DB ownership/credentials | role `iflux` | role `iflux_staging` (đã verify riêng, không dùng chung credentials Production) | MATCH (isolation) | Đã verify khi thực hiện clone (Plan 12) | — |

---

## 3. Runtime / Infrastructure

| Area | Production | Staging | Status | Evidence | Gap |
|---|---|---|---|---|---|
| Linux user chạy app | `root` (PM2 `iflux-api` chạy dưới root) | `iflux-app` (uid 998, isolated) | MISMATCH (đã biết, là rủi ro tồn tại của Production, không phải của Staging) | `pm2 list` cột `user` | Đây là **debt của Production cũ** (chạy app bằng root là rủi ro bảo mật) — Staging đã làm đúng hơn (user riêng), không cần "đồng bộ giống Production" ở điểm này |
| Deploy user | Không có user `iflux-deploy` riêng cho Production (deploy tay qua root/SSH) | `iflux-deploy` (uid 997) — scoped sudo chỉ chạy `deploy-switch.sh` | MISMATCH (chủ đích, đúng thiết kế Plan 12) | `id iflux-deploy` | — |
| Node version | v20.20.0 | v20.20.0 | MATCH | đã nêu trên | — |
| Process manager | PM2 | PM2 | MATCH | — | — |
| Reverse proxy | Nginx, snippet 612 dòng | Nginx, snippet 611 dòng | MATCH (đã nêu trên) | — | — |
| Storage/uploads dir | `/var/iflux/storage/media` (owner root) | `/var/iflux/storage-staging/media` (owner `iflux-app`, riêng biệt) | MATCH (kiến trúc isolation đúng) | `ls -la` cả 2 | Riêng thư mục, không share — đúng BR-23 |
| Env var keys — tổng số | 40 key trong `.env` | 39 key trong `ecosystem.staging.config.js` (khác cơ chế: Staging set trực tiếp trong PM2 config, không dùng file `.env` rời) | MISMATCH (cơ chế khác, nội dung lệch 1 phần — xem chi tiết dưới) | `diff` danh sách key (chỉ tên, không in giá trị secret) | Xem 3 dòng chi tiết bên dưới |
| → Thiếu trên Staging | `ADMIN_PASSWORD_HASH` không có trong `ecosystem.staging.config.js` | — | MISMATCH | grep key | Cần xác nhận Admin login trên Staging dùng cơ chế nào nếu thiếu hash này |
| → Thiếu trên Staging | `DNSE_API_VERSION`, `DNSE_AUTH_URL`, `DNSE_BASE_URL`, `DNSE_DATAFEED_HOST/PATH/PORT`, `DNSE_DATE_HEADER` — toàn bộ endpoint config của DNSE (nguồn dữ liệu giá cổ phiếu realtime) | Chỉ có 4 key credential (`DNSE_API_KEY/USERNAME/PASSWORD/ACCOUNT_EMAIL`) và **cả 4 đều để trống `''`** | **MISMATCH (xác nhận, có ảnh hưởng thật)** | `grep -i DNSE` trong `ecosystem.staging.config.js` → toàn bộ rỗng | DNSE realtime feed **không hoạt động trên Staging** (thiếu cả credential thật và cả endpoint config). Có `VNSTOCK_FORCE_FALLBACK` như phương án dự phòng, nhưng đây vẫn là gap thật cần Owner biết trước khi coi Staging là "giống Production 100%" cho phần thị trường/giá cổ phiếu realtime |
| → Thừa trên Staging (không có ở Production) | Không có `REDIS_URL` trong `.env` Production | Có `REDIS_URL` trong `ecosystem.staging.config.js` | MISMATCH | grep key | Redis server đang **active** trên máy (dùng chung hạ tầng cho cả 2 môi trường theo `systemctl is-active redis-server` → active), nhưng chỉ Staging có config trỏ vào — nghĩa là Staging có thể đã bật một capability cache mà Production chưa từng dùng. Cần xác nhận đây có phải cố ý nâng cấp hay là cấu hình thừa cần dọn |
| → Thừa trên Staging (không có ở Production) | Không có `RESEND_API_KEY`, `SMTP_HOST/USER/PASS` trong Production `.env` | Có đủ 4 key trong Staging config | MISMATCH | grep key | Xem chi tiết ở mục Email (External Integrations) — cả 2 đều đang bypass gửi mail thật nên hiện chưa gây side-effect, nhưng cấu hình không đối xứng |
| → Khác cơ chế nhưng tương đương | Production: 1 `DATABASE_URL` duy nhất | Staging: tách `DATABASE_URL` + `DATABASE_ADMIN_URL/NAME/USER/PASSWORD` | MATCH (tương đương chức năng) | — | Không phải gap, chỉ khác style cấu hình |
| `SCHEDULER_ENABLED` | `true` | `true` | MATCH | grep/pm2 env | Cron job trong app **đang chạy thật trên cả 2 môi trường** — cần theo dõi side-effect (mục External Integrations) |
| `QUEUE_ENABLED` | `false` | `false` | MATCH | grep/pm2 env | Queue module tồn tại trong code nhưng tắt ở cả 2, không phát sinh side-effect |
| `EMAIL_OTP_DEMO` | `true` (`EMAIL_OTP_DEMO_CODE=123456`) | `true` (giống) | MATCH | grep/pm2 env | Production **hiện tại cũng đang demo mode**, không gửi email OTP thật — do đó Staging giống Production ở hành vi này (không phải Staging kém hơn) |
| Redis service | active (system-wide) | active (system-wide, **service chung** với Production, không phải instance riêng) | MISMATCH (rủi ro isolation nếu Staging thật sự dùng Redis) | `systemctl is-active redis-server` = active; chỉ 1 instance trên server | Nếu Staging bắt đầu dùng Redis thật (do có `REDIS_URL`) mà không tách DB index/namespace, đây là **lỗ hổng isolation tiềm ẩn** cần audit riêng trước khi tin tưởng "cache layer" độc lập |

---

## 4. External Integrations

| Integration | Production | Staging | Status | Evidence | Gap |
|---|---|---|---|---|---|
| Google Sign-In (OAuth Client ID) | `642927266497-o04c...apps.googleusercontent.com`, enabled | **Cùng Client ID**, enabled | MATCH (config) | `curl /api/auth/social/config` — response identical | Nhưng **hành vi thật đã biết bị lỗi** trên Staging (nút Google không hoạt động) — nguyên nhân đã xác định trước: domain `staging.iflux.vn` khả năng chưa được thêm vào "Authorized JavaScript origins" của Client ID này trên Google Cloud Console (hành động thuộc Owner, ngoài phạm vi server) |
| Email (transactional) | Không cấu hình SMTP/Resend nào trong `.env`; `EMAIL_OTP_DEMO=true` → không gửi email thật | Có cấu hình `RESEND_API_KEY`+`SMTP_*` nhưng `EMAIL_OTP_DEMO=true` → cũng không gửi thật | MATCH (hành vi hiện tại), MISMATCH (capability cấu hình) | grep key + giá trị `EMAIL_OTP_DEMO` | Cả 2 hiện không gửi email thật nên an toàn side-effect, nhưng cấu hình không đối xứng — nếu tắt demo mode, Staging có thể gửi email thật (rủi ro side-effect) còn Production thì không có cấu hình để gửi |
| DNSE (dữ liệu giá cổ phiếu realtime) | Cấu hình đầy đủ endpoint + credential | Thiếu toàn bộ endpoint, credential để trống | MISMATCH | Đã nêu ở mục Runtime | Xem trên |
| Cache/queue bên ngoài (Redis) | Không dùng | Có cấu hình, share instance với Production | MISMATCH | Đã nêu ở mục Runtime | Xem trên |
| CDN/Cloudflare | `iflux.vn` proxied (orange-cloud) | `staging.iflux.vn` proxied (orange-cloud), cùng zone Cloudflare | MATCH | Cloudflare API `dns_records` — cả 2 domain `proxied: true` | — |
| Payment | Không tìm thấy tích hợp Stripe/VNPay/Momo/PayOS nào trong code | Không tìm thấy | NOT APPLICABLE | `grep -ril` trong `backend/src/config` → không có kết quả | Tính năng chưa tồn tại ở Product, không phải gap Staging vs Production |
| Monitoring/Observability (Sentry, Datadog, New Relic...) | Không tìm thấy | Không tìm thấy | NOT APPLICABLE | `grep -ril` trong `backend/src`, `package.json` → không có kết quả | Chưa tích hợp ở cả 2, không phải gap riêng của Staging |
| Third-party APIs khác (vnstock ingest) | `.venv` Python đầy đủ, `VNSTOCK_PYTHON` config có | Cần xác nhận `.venv` Python đã được set up trên Staging (source 3 file khớp, nhưng `.venv` là generated — chưa verify đã `pip install` trên Staging chưa) | UNKNOWN / NOT VERIFIED | Không chạy lệnh thực thi worker để test | Cần verify riêng: `ls /var/iflux/backend-staging/current/workers/.venv` có tồn tại không, và chạy thử 1 lần ingest xem có lỗi không |

---

## 5. Website Behavior

Tất cả các route dưới đây được test bằng `curl` trực tiếp tới domain thật (`https://iflux.vn` và `https://staging.iflux.vn`) tại thời điểm audit — không dùng cache local, không giả định.

| Route | Production | Staging | Status |
|---|---|---|---|
| `/home` | 301 | 301 | MATCH |
| `/dang-nhap` (login) | 200 | 200 | MATCH |
| `/dang-ky` (register) | 200 | 200 | MATCH |
| `/cong-dong` (community) | 200 | 200 | MATCH |
| `/thi-truong` (market) | 200 | 200 | MATCH |
| `/dong-tien` (flow) | 200 | 200 | MATCH |
| `/co-phieu` (stocks) | 200 | 200 | MATCH |
| `/nganh` (sectors) | 200 | 200 | MATCH |
| `/he-sinh-thai` (ecosystems) | 200 | 200 | MATCH |
| `/robots.txt` | 200 | 200 (nội dung khác có chủ đích: `Disallow: /`) | MATCH (status), khác nội dung có chủ đích |
| `/sitemap.xml` | 200, domain trong nội dung = `https://iflux.vn` | 200, nhưng nội dung **cũng trả `https://iflux.vn`** (không phải `staging.iflux.vn`) | **MISMATCH (nội dung)** | Root cause xác định: `PUBLIC_SITE_URL` không được set ở cả 2 môi trường, code fallback hardcode `'https://iflux.vn'` tại ~15 file (`sitemap/providers/*.js`, `seo-platform/*.js`, `community-articles.service.js`...). Rủi ro thấp (đã có `noindex`/`Disallow`), nhưng là root cause thật, không phải giả định |
| `/favicon.ico` | 302 | 302 | MATCH |
| `/api/health` | 404 (không có endpoint health-check riêng) | 404 (giống) | MATCH (cả 2 đều thiếu health endpoint — NOT APPLICABLE vì chưa từng tồn tại) |
| `/Admin_Design_system/app/dashboard/index.html` | 301 | 301 | MATCH |
| `X-IFlux-Env` header | `production` | `staging` | MATCH (đúng như thiết kế, chứng minh isolation marker hoạt động) |
| Đăng ký/Đăng nhập Google (chức năng thật, không chỉ status code) | Hoạt động | **Đã biết lỗi** — nút Google không phản hồi | MISMATCH (đã biết từ trước, chưa được Owner xử lý ở Google Cloud Console) | Chưa PASS — cần Owner cập nhật Authorized JavaScript origins |
| Đăng nhập bằng 9 tài khoản đã clone | N/A (tài khoản gốc) | 9 tài khoản chỉ có Google (không có password) → **không đăng nhập được** vì Google login đang lỗi | MISMATCH (hệ quả của gap Google OAuth trên) | Đã ghi nhận ở phiên trước |
| SEO/OG metadata canonical domain | `https://iflux.vn` (đúng vì đây chính là domain) | `https://iflux.vn` (SAI — vẫn tự nhận là iflux.vn dù đang chạy trên staging) | MISMATCH | `head-renderer.js`, `breadcrumb.js`, `index-boundary.js` cùng hardcode | Cùng root cause với sitemap |

---

## 6. Tổng hợp Gap còn mở (ưu tiên theo mức ảnh hưởng)

| # | Gap | Mức ảnh hưởng | Trạng thái |
|---|---|---|---|
| 1 | Google Sign-In không hoạt động trên `staging.iflux.vn` (Authorized JavaScript origins ở Google Cloud Console) | **Cao** — chặn toàn bộ đăng ký/đăng nhập bằng Google, chặn cả 9 tài khoản đã clone | Đang chờ Owner xử lý ở Google Console (ngoài phạm vi server) |
| 2 | DNSE realtime feed không cấu hình trên Staging (credential rỗng + thiếu endpoint) | Trung bình — ảnh hưởng dữ liệu giá cổ phiếu realtime khi test trên Staging | Chưa xử lý |
| 3 | `PUBLIC_SITE_URL` hardcode `iflux.vn` áp dụng cả 2 môi trường — Staging tự nhận diện SEO/sitemap/OG là `iflux.vn` | Thấp (đã có noindex chặn crawl) nhưng là root cause code thật cần sửa nếu muốn Staging tự nhận diện đúng domain | Chưa xử lý |
| 4 | Staging DB là snapshot một lần (14/08 09:11), không sync — đang lệch dần với Production live | Thấp/trung bình, đúng thiết kế Owner đã chấp thuận, nhưng cần nhắc lại mỗi lần dùng để test | Theo thiết kế, không phải bug |
| 5 | ~117 file Production chưa từng vào Git (SEO generated + vài core JS/CSS) — debt từ audit `10 -...` trước | Trung bình — Git chưa là 100% source of truth của Production hiện tại | Chưa xử lý, ngoài phạm vi Staging reconstruction (Plan 12 đã chọn không rsync mù toàn bộ) |
| 6 | Staging có cấu hình Redis/Resend/SMTP mà Production không có (capability thừa, chưa rõ có chủ đích) | Thấp, nhưng cần Owner xác nhận có chủ đích hay dọn bớt | Chưa xác nhận |
| 7 | Chưa verify `.venv` Python (vnstock ingest) đã setup đúng và chạy thử được trên Staging | Chưa xác định | UNKNOWN / NOT VERIFIED |
| 8 | Production chạy app bằng user `root` (PM2 `iflux-api`) — rủi ro bảo mật tồn tại của Production, không phải lỗi của Staging | Trung bình (thuộc nợ kỹ thuật Production cũ) | Ghi nhận, không thuộc phạm vi Staging |

---

## 7. Kết luận Phase 1

> **B. PARTIALLY VERIFIED**

**Vì sao không phải FULLY VERIFIED:**
- Database schema = MATCH tuyệt đối (100 bảng, 857 cột, 258 index, 873 constraint, 16 migration — khớp 1:1). Đây là phần mạnh nhất.
- Application/Source (code, Nginx routing, Node version, PM2, route HTTP status) = MATCH ở hầu hết các điểm đo được.
- Nhưng có **3 gap xác nhận có ảnh hưởng thật** (Google Sign-In, DNSE realtime feed, SEO canonical domain hardcode) và **1 gap dữ liệu cố ý-theo-thiết kế nhưng đang lệch dần** (DB snapshot không sync).
- Có **1 mục chưa verify được** (Python `.venv` vnstock ingest trên Staging) — ghi đúng `UNKNOWN / NOT VERIFIED`, không suy diễn thành MATCH.

**Vì sao không phải NOT VERIFIED:**
- Có evidence thật, đo được, so sánh trực tiếp (không phải assumption) cho toàn bộ 5 lớp bắt buộc (Source, Database, Runtime, Integrations, Behavior).
- Phần lõi quan trọng nhất (DB schema, routing, core page behavior, isolation marker `X-IFlux-Env`) đã MATCH có chứng cứ.

**Kết luận:** Staging hiện tại là baseline **gần đúng** với Production, đủ để dùng làm **Reference/Dev environment** theo đúng vai trò Owner đã định nghĩa ("STAGING 1 — Đồng bộ 100% với Production... Reference/Dev"), nhưng **chưa đạt 100%** — cụ thể còn 3 gap ảnh hưởng chức năng (Google login, DNSE, SEO domain) cần xử lý nếu muốn dùng Staging để test đầy đủ tính năng liên quan.

---

## Phase 2 — Đóng task migration cũ

> **Old Production Migration Task: CLOSED**

Task "Production cũ → Staging" (khởi động từ Plan 12, thực thi 12-14/08/2026) được đóng tại đây với kết quả **PARTIALLY VERIFIED** ở trên. Không tiếp tục coi "đưa Staging giống Production" là mục tiêu mở — các gap còn lại (mục 6) được chuyển thành backlog riêng nếu Owner muốn xử lý tiếp, không tự động nằm trong task Git Deployment Reconstruction này nữa.

`iflux.vn` (Production cũ) tiếp tục là **Production chính thức, LIVE, phục vụ user thật** — không xóa, không reset, không rebuild, không chuyển thành staging, không thay thế. Chỉ deploy vào Production cũ khi thực sự cần thiết để duy trì hệ thống hoặc xử lý production-critical issue.

---

## Phase 7 — Ghi nhận chiến lược mới (chờ xác nhận trước khi thi công Phase 3+)

Theo chỉ thị Owner, chiến lược tiếp theo được ghi nhận là:

1. **`iflux.vn`** = LIVE PRODUCTION, phục vụ user thật, giữ nguyên xuyên suốt giai đoạn rebuild.
2. **`staging.iflux.vn`** = DEVELOPMENT / VERIFICATION — vai trò xác nhận ở Phase 1 báo cáo này (PARTIALLY VERIFIED), tiếp tục là reference/dev, không phải nguồn để clone toàn bộ.
3. **`production.iflux.vn`** = **CLEAN REBUILD TARGET** — trắng tinh, không copy nguyên trạng Production cũ, không copy nguyên trạng Staging, không migrate toàn bộ application. Chỉ dựng foundation Git deployment tối thiểu, sau đó rebuild từng capability theo chuỗi `SoT → Contract → Implementation trên Staging → Audit → Test → PASS → Promote`.
4. `staging.iflux.vn` và `production.iflux.vn` thuộc **cùng một Git flow** (2 nhánh/2 target deploy từ cùng repo GitHub, không phải 2 nguồn tách biệt).
5. `production.iflux.vn` **không phải** Production chính thức của user cho đến khi có **Cutover Gate** riêng được Owner phê duyệt — cần đạt tiêu chí functional parity, data/integration readiness, security, performance, SEO, observability, deployment/recovery, acceptance testing.

**New Production Strategy: APPROVED FOR EXECUTION (ghi nhận theo chỉ thị)** — nhưng việc **thi công hạ tầng thật** cho `production.iflux.vn` (tạo subdomain DNS, Nginx vhost, PM2 process, DB `iflux_production` rỗng, workflow GitHub Actions `deploy-production.yml`, cấp SSL...) là một khối công việc hạ tầng riêng, **chưa thực hiện trong lượt này** — theo đúng gate của Owner: Phase 1 (verify) phải xong trước, và Phase 3 (tạo Production mới) là bước kế tiếp cần một phiên thi công riêng.

> **Old Production remains LIVE.**
> **`production.iflux.vn` = CLEAN REBUILD TARGET (chưa thi công hạ tầng, đã ghi nhận chiến lược).**

---

## Phase 3 — Staging 2 Infrastructure + GitHub Deployment Path: ✅ PASS / CLOSED (2026-08-14)

Owner quyết định: không xử lý 3 gap ở mục 6 trước (chúng là environment-specific của Staging 1, không phải blocker cho Clean Rebuild). Mở Phase 3 ngay, chỉ dựng hạ tầng — chưa copy application.

**Đã hoàn thành (evidence):**

| Hạng mục | Trạng thái | Evidence |
|---|---|---|
| DNS `production.iflux.vn` | ✅ A record → origin, proxied (Cloudflare) | `dns_records` API response |
| SSL | ✅ Let's Encrypt cert riêng, HTTPS live | `certbot --nginx` output, `curl -I` |
| Nginx vhost | ✅ Tối giản, KHÔNG copy routing cũ, `X-Robots-Tag: noindex`, `X-IFlux-Env: newprod-clean` | file `/etc/nginx/sites-enabled/production.iflux.vn.conf` |
| Linux user runtime | ✅ `iflux-newprod` (uid 996, dedicated, chưa chạy app) | `id iflux-newprod` |
| Thư mục atomic release | ✅ `/var/www/iflux/releases-newprod/`, `/var/iflux/backend-newprod/releases/` (rỗng, chờ CI) | `ls -la` |
| Database | ✅ `iflux_newprod`, role riêng, **0 bảng** (không restore, không migrate) | `information_schema.tables` count = 0 |
| Deploy-switch script + sudoers | ✅ `iflux-newprod-deploy-switch.sh`, scoped hẹp, KHÔNG bao giờ đụng path Production/Staging 1 | test qua `sudo -u iflux-deploy sudo -n ...` PASS |
| GitHub deployment path | ✅ Branch `production-clean` (orphan, chỉ có `web/index.html` placeholder + workflow), `.github/workflows/deploy-production-new.yml` | CI run: `Job result: Succeeded`, release id khớp commit SHA, `https://production.iflux.vn` live |
| Application | ⬜ Rỗng theo đúng thiết kế — chỉ 1 trang placeholder tĩnh, KHÔNG phải sản phẩm thật | Nội dung `web/index.html` |
| Config/secrets | ⬜ Rỗng — chưa có `.env` nào cho Staging 2, credential DB lưu riêng trên server (`/root/.iflux-newprod-db-credential.env`, không có trong Git) | — |

**Không làm (đúng theo yêu cầu Owner):** không clone Production, không clone Staging 1, không restore DB nào, không copy `.env`/secrets/PM2 ecosystem/Nginx config cũ.

**Sự cố phát sinh trong Phase 3 (đã xử lý minh bạch):** mất `infra/staging/staging.env` (khôi phục SSH, không khôi phục được Cloudflare token — Owner xác nhận không phải blocker, xem `14 -...` mục 5).

**Chính sách mới phát sinh trong Phase 3, đã lock:** `14 - SSH ↔ Deployment Boundary Policy (Owner Directive).md` — `iflux.vn` chính thức thành Protected Live Environment.

---

## Phase 4 — Clean Rebuild: Architecture/Foundation (đang mở)

> **Phase 4 KHÔNG PHẢI "copy Staging 1 sang Staging 2".** Staging 2 vẫn giữ nguyên trạng rỗng vừa dựng ở Phase 3.

Phase 4 = xây **kiến trúc/nền tảng** cho Clean Rebuild trước khi promote bất kỳ capability nghiệp vụ nào — theo đúng chuỗi đã định ở mục Phase 5 (`SoT → Contract → Implementation trên Staging 1 → Audit → Test → PASS → Promote vào Staging 2`).

**Phạm vi Phase 4 (đề xuất, chờ Owner xác nhận chi tiết khi bắt đầu):**

- Xác định **kiến trúc backend/frontend nền tảng** cho Staging 2 (không phải business feature) — ví dụ: cấu trúc thư mục chuẩn, quy ước module, migration runner rỗng (chưa có bảng nghiệp vụ nào), health-check endpoint, logging/error handling nền.
- **Không** đưa bất kỳ business logic/UI nghiệp vụ nào vào trước khi có SoT/Contract riêng cho capability đó.
- Danh sách capability sẽ rebuild theo thứ tự (do Owner quyết) — mỗi capability đi qua đúng chuỗi Promote ở Phase 5, không dồn nhiều capability vào 1 lần "cho nhanh".

**Chưa bắt đầu thi công Phase 4 tại thời điểm ghi nhận này — chờ Owner xác nhận phạm vi/thứ tự trước khi code.**
