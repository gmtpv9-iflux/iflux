# 05 — Mandatory Audit, tiếp tục theo ưu tiên A→G (Owner chỉ định)

| | |
|--|--|
| **Input** | `04 - Owner Architecture Decisions.md` §15 — "Continue Mandatory Audit, priority A→G" |
| **Implementation** | `NOT AUTHORIZED` — toàn bộ dưới đây là read-only audit |
| **Phương pháp** | Đọc source code local (`backend/src`), SSH read-only vào server, `git`/`comm`/`du` local |

---

## A. Staging Isolation Audit

### A.1 Database

| Fact | Value | Tag |
|---|---|---|
| Engine | PostgreSQL 14.20 (Ubuntu) | ✅ |
| DB Production hiện tại | `iflux`, kích thước **599 MB** | ✅ `pg_size_pretty(pg_database_size(...))` |
| Schema tracking | `schema_migrations` — hiện có **16 hàng** đã apply (tăng từ 13 hôm 2026-08-01 lên 16 hôm nay — 3 migration mới trong 11 ngày) | ✅ |
| DB `iflux_staging` (theo `staging.env`) | **Không tồn tại** trên Postgres (đã xác nhận ở audit 02 — chỉ có `iflux` + `iflux_legacy_pre202607`) | ✅ |
| Bảng chứa dữ liệu tài chính/side-effect thật | `affiliate_payout_requests`, `affiliate_order_credits` | ✅ — cần cách ly để test Staging không tạo "yêu cầu rút tiền" giả lẫn vào hàng đợi Admin xử lý thật |
| Bảng chứa PII người dùng thật | users/accounts, comments, orders… (chưa list đủ 100+ bảng, nhưng chắc chắn tồn tại theo domain) | 🟡 — khuyến nghị **không** clone toàn bộ data thật vào Staging (giảm rủi ro PII ở môi trường ít khoá hơn) |

### A.2 Migration mechanism

| Fact | Value | Tag |
|---|---|---|
| Cách apply | `npm run migrate` → `node scripts/migrate.js`, tracking bảng `schema_migrations (filename UNIQUE)` | ✅ (kế thừa từ `SoT — Deployment.md` §7, verified lại còn đúng) |
| File migration | `backend/migrations/*.sql`, hiện tại `du -sh` = 300K, migration mới nhất `056_community_rss_article_schema_v2.sql` | ✅ |
| 1 file migration mồ côi nằm sai vị trí | `/var/iflux/backend/007_affiliate_payout_requests.sql` — nằm **ngay tại root `backend/`**, không nằm trong `migrations/` — cần Owner xác nhận: đã áp dụng hay là file rác còn sót | 🟡 — flag mới, chưa từng ghi trong `SoT — Deployment.md` |
| `ensureDatabase()` có thể fail nếu thiếu `DATABASE_ADMIN_URL` | Đã ghi nhận trong `SoT — Deployment.md` §7.1 — vẫn đúng, cần tính vào lúc dựng Staging DB (phải chạy migration thành công trên DB mới, không chỉ rsync file) | ✅ kế thừa |

### A.3 Cache / Redis

| Fact | Value | Tag |
|---|---|---|
| Engine | Redis 6.0.16, standalone, native (không container) | ✅ |
| Dùng chung 1 instance cho Production (và "Staging" hiện tại) | Đúng — `staging.env` không khai Redis riêng | ✅ |
| Mức độ rủi ro nếu Staging test đụng Redis chung | Trung bình — Redis ở đây chủ yếu cache (không phải nguồn sự thật) nhưng cache key namespace cần soát để Staging test không vô tình đọc/ghi đè cache Production (ví dụ session, rate-limit counter) | 🟡 — cần audit thêm namespace key thực tế trước khi Implement (không nằm trong scope audit này) |

### A.4 Queue / Workers

| Fact | Value | Tag |
|---|---|---|
| Queue framework (`backend/src/core/queue/queue.js`) | **Chỉ là in-memory "bootstrap shell"** — chưa kết nối broker ngoài thật (dù có check `isRedisEnabled()`), `enqueue()` chỉ push vào array JS trong process | ✅ đọc code — rủi ro side-effect thấp hơn dự kiến ban đầu |
| `backend/workers/` (thư mục riêng) | Tồn tại trên server (`drwxr-xr-x 4 ... workers`) — cần audit nội dung cụ thể ở Gate sau nếu Owner muốn chi tiết hơn (chưa đọc code trong audit này, không nằm trong critical path Staging isolation vì queue hiện là shell nội bộ) | 🟡 |

### A.5 Cron / Scheduled jobs

| Job | Cron expression | Side-effect | Tag |
|---|---|---|---|
| `heartbeat` | `*/5 * * * *` | Nội bộ, không side-effect ngoài | ✅ |
| `rss-community-ingest` | theo `rssCron` config | **Gọi RSS feed ngoài thật**, ghi vào DB (`community_rss_*` tables) | ✅ — nếu Staging chạy job này với DB riêng, an toàn (chỉ ghi vào Staging DB); rủi ro chỉ là tăng lưu lượng gọi RSS ngoài gấp đôi |
| `vnstock-content-ingest` | theo `vnCron` config | Gọi nguồn dữ liệu chứng khoán ngoài, ghi DB | ✅ tương tự |
| `media-auto-import` | theo `mediaCron` config | Ghi file vào `storage/media` + DB | ✅ — **cần Staging có `STORAGE_LOCAL_PATH` riêng**, không dùng chung `/var/iflux/storage` của Production (tránh media Staging lẫn vào thư mục Production) |
| Cơ chế tắt/mở | `SCHEDULER_ENABLED` (config flag đã có sẵn trong code, không cần code mới) | ✅ — có thể tắt scheduler cho Staging nếu Owner muốn giảm side-effect ngoài, hoặc bật nếu muốn test đầy đủ |

### A.6 WebSocket

| Fact | Value | Tag |
|---|---|---|
| Package `ws`/`socket.io` trong `package.json` | **Không có** | ✅ |
| "WebSocket" xuất hiện trong code | Chỉ là **MQTT over WSS cho DNSE** (comment trong `dnse.client.js`), chưa xác nhận có implement thật hay chỉ mô tả kế hoạch — không tìm thấy dependency `mqtt` trong `package.json` | 🟡 — không phải rủi ro isolation ở mức nghiêm trọng, nhưng cần Owner biết đây là tích hợp ngoài (DNSE) chứ không phải WebSocket nội bộ giữa Frontend↔Backend |

### A.7 External APIs / Payment / Affiliate / Email

| Hạng mục | Fact | Rủi ro cho Staging | Tag |
|---|---|---|---|
| **DNSE (market data provider)** | `dnse.client.js` — login bằng `DNSE_USERNAME`/`DNSE_PASSWORD` thật, gọi `https://api.dnse.com.vn/...` | Nếu Staging dùng chung credential DNSE với Production → có thể tranh session/rate-limit. Cần: credential riêng (nếu DNSE hỗ trợ) hoặc tắt tính năng này ở Staging | 🟡 |
| **Affiliate Payout** | `affiliate-payouts/*.service.js` — **KHÔNG gọi cổng thanh toán tự động nào** (Stripe/PayPal/MoMo/VNPay không tìm thấy). Chỉ lưu thông tin ngân hàng + tạo "yêu cầu rút tiền" trong DB, Admin xử lý tay ngoài hệ thống | Rủi ro **thấp hơn ban đầu tưởng** — vì không có real-money API call tự động. Nhưng vẫn cần DB riêng để không tạo payout request giả lẫn vào hàng đợi Admin thật | ✅ mức độ rủi ro đã hạ, nhưng **vẫn cần DB isolation** (đúng yêu cầu BR-23) |
| **Email/Notification** | 2 provider thật: `smtp.provider.js`, `resend.provider.js` (Resend — dịch vụ email ngoài thật) | **Cao** — nếu Staging test chạy full flow (đăng ký, OTP…) mà dùng credential email thật → gửi email thật tới người dùng thật. Cần: credential email Staging riêng, hoặc chuyển sang provider "no-op/log-only" cho Staging | ✅ — cần quyết định rõ ở Solution: Staging phải có SMTP/Resend key riêng (sandbox hoặc log-only), không dùng chung key Production |

### A.8 File/Storage

| Fact | Value | Tag |
|---|---|---|
| Production storage | `/var/iflux/storage/media` = 5.1 GB | ✅ |
| Staging storage hiện tại | Không tách — nếu chạy, sẽ ghi chung `/var/iflux/storage` (vì dùng chung backend) | ✅ — cần path riêng khi có backend Staging riêng |

### A.9 Kết luận A — Staging Isolation

> Rủi ro side-effect thực tế **thấp hơn** so với lo ngại ban đầu ở 2 điểm (Queue chỉ là in-memory shell chưa kết nối broker thật; Affiliate Payout không gọi cổng thanh toán tự động) — nhưng **cao hơn** ở 1 điểm chưa được nhắc tới trước đó: **Email thật (SMTP + Resend) có thể gửi mail thật tới user thật nếu Staging test không có credential riêng**. Kết hợp với gap DB đã biết, danh sách bắt buộc phải tách cho Staging là: **Database, Database credentials, Storage/media path, Email provider credentials (SMTP/Resend), DNSE credential (nếu muốn test market data đầy đủ)**. Redis/Queue có thể dùng chung tạm thời với rủi ro thấp (ghi chú lại, không block).

---

## B. Production/Git Reconciliation Strategy — Evidence

| Phân tích | Kết quả | Tag |
|---|---|---|
| File trong Production đã sửa sau commit Git cuối (>2026-08-10) | 361 (Frontend/Admin) + 21 (Backend) = 382 | ✅ |
| Trong đó, **trùng khớp với uncommitted changes ở Local working tree hiện tại** | **257 file** (≈67% của 382, ≈76% của 339 local uncommitted) | ✅ `comm -12` |
| File Production đã đổi nhưng **KHÔNG** có trong danh sách uncommitted local (261→104 sau khi loại trừ trùng) | 104 file — toàn bộ là `User_Web` (87) + `Admin_Design_system` (17) — **không diff với git HEAD**, nghĩa là nội dung khớp Git, chỉ là mtime mới hơn (do rsync/checkout gần đây, không phải drift nội dung) | ✅ |
| File uncommitted Local nhưng **chưa thấy đổi tương ứng trên Production** gần đây | 82 file — khả năng là WIP chưa deploy, hoặc tàn dư từ task đã bỏ (ví dụ Sidebar Scroll Behavior đã bị Owner quyết định "xoá code rác, phục hồi trạng thái trước task") | 🟡 — cần rà lại 82 file này ở bước Reconciliation thật (không làm trong audit này) |

**Ý nghĩa cho chiến lược reconciliation:**

> **Local working tree (bao gồm phần uncommitted) hiện là bản phản ánh gần nhất với Production thật** — không phải Git HEAD (43 commit, dừng ở 2026-08-10). Đây là bằng chứng quan trọng cho việc thiết kế "cutover baseline": khi migrate sang GitHub, **ứng viên hợp lý nhất cho "revision đầu tiên coi là Source of Truth"** là một commit **mới**, được tạo từ đúng trạng thái Local working tree hiện tại (sau khi rà soát kỹ 82 file lệch) — **không phải** cố gắng suy ra "Production đã từng chạy commit nào trong 43 commit cũ". Đây chỉ là **quan sát bằng chứng**, việc chọn baseline chính xác nào là quyết định Solution/Plan, chưa quyết ở đây.

---

## C. Deployment Boundary — bổ sung chi tiết

| Path | Loại | Kích thước | Ghi chú |
|---|---|---|---|
| `/var/iflux/backend/node_modules` | Dependency (build-time, không phải source) | 82M | Không nên nằm trong Git/artifact nguồn — cài lại qua `npm ci` lúc deploy, hoặc đóng gói sẵn trong artifact tuỳ SD-03 |
| `/var/iflux/backend/src` | Application code | 1.9M | Deploy Unit: Backend |
| `/var/iflux/backend/migrations` | Schema | 300K | Deploy Unit: Migration (tách riêng, đúng SoT cũ) |
| `/var/iflux/backend/data` | Runtime config nhỏ | — | Persistent, không thuộc code sync |
| `/var/iflux/backend/007_affiliate_payout_requests.sql` | **Mồ côi, sai vị trí** | 768 bytes | Cần Owner xác nhận: file rác hay migration thật chưa được move đúng chỗ — **không tự xoá trong audit này** |
| `/var/iflux/backend/.env` | Secret/environment config | 1.6K | Không thuộc Git — đúng nguyên tắc, giữ nguyên |
| `/var/iflux/backend/.env.staging.example` | Template — **đã có sẵn ý định Staging từ trước, chưa triển khai** | — | Có thể tái sử dụng làm điểm khởi đầu khi dựng Staging backend thật |
| `/var/iflux/backend/Dockerfile`, `docker-compose.yml` | Sẵn có, không dùng trên Production | — | Có thể là input cho SD-03 nếu Owner sau này muốn hướng container hoá (không quyết ở đây) |

---

## D. Credential / Deployment Identity — Infra feasibility

| Fact | Value | Tag |
|---|---|---|
| OS | Ubuntu 22.04.1 LTS | ✅ |
| User hiện có trên server | Chỉ `root`, `www-data`, `redis`, `postgres` — **không có user riêng cho application/deploy** | ✅ — PM2 process `iflux-api` cũng chạy bằng `root` (không phải user riêng — rủi ro least-privilege rộng hơn cả phạm vi SSH, ghi nhận thêm ngoài BRD nhưng liên quan) |
| `sudo` | Có sẵn (`/usr/bin/sudo`) — đủ khả năng tạo user mới, set quyền | ✅ |
| Outbound network tới `github.com` / `api.github.com` | **Thông suốt** — HTTP 200, ~0.4s | ✅ — xác nhận **self-hosted GitHub Actions runner khả thi về mặt hạ tầng** (runner chỉ cần outbound, không cần mở thêm port inbound) |
| Firewall | `ufw inactive`, `iptables` policy ACCEPT toàn bộ — **không có tường lửa nào đang chặn/bảo vệ** | 🟡 — không phải scope BRD này, nhưng nên ghi nhận làm hardening riêng khi làm credential/deploy identity (ví dụ: giới hạn port 7878 SSH chỉ nhận từ IP cần thiết) |

**Kết luận D:** Hạ tầng hiện tại **đủ điều kiện kỹ thuật** để triển khai một trong hai hướng SD-04/SD-06 ưu tiên của Owner: (1) self-hosted GitHub Actions runner cài trên server hiện tại (outbound-only, không cần thêm SSH key/port), hoặc (2) SSH key + user least-privilege riêng nếu Owner muốn dùng GitHub-hosted runner gọi vào server qua SSH. Cả hai đều **loại bỏ hoàn toàn** nhu cầu SSH password.

---

## E. GitLab → GitHub Migration — Feasibility Audit

| Fact | Value | Tag |
|---|---|---|
| Git LFS | Không dùng (`git lfs` không phải command hợp lệ trên máy; không `.gitattributes` LFS) | ✅ |
| Submodules | Không có (`.gitmodules` không tồn tại, `git submodule status` rỗng) | ✅ |
| Kích thước `.git` | 46M — nhỏ, migration nhanh | ✅ |
| Blob lớn nhất trong lịch sử | ~3.1MB (`.tmp/phase5-reg-e2e/B-valid-owner.png` — ảnh test cũ) — không có blob khổng lồ nào cần cảnh báo | ✅ |
| Cơ chế migrate an toàn (preserve history) | `git clone --mirror git@gitlab.com:gm.tpv9/iflux.git` → `git push --mirror git@github.com:<org>/<repo>.git` — chuẩn công nghiệp, giữ 100% branch/tag/history | 🟡 Đề xuất kỹ thuật — **chưa thực hiện**, cần Owner approve ở Gate 1 + tạo GitHub repo đích trước |
| Rủi ro | Thấp về mặt kỹ thuật Git. Rủi ro thật nằm ở **decision nào là baseline** (xem mục B), không nằm ở cơ chế migrate Git tự nó | ✅ |

---

## F. CI/CD Architecture — GitHub-specific candidate (ghi nhận, chưa quyết)

| Khả năng GitHub cung cấp sẵn | Map với yêu cầu Owner | Tag |
|---|---|---|
| **GitHub Environments + Required Reviewers** | Khớp trực tiếp yêu cầu "Human Release Gate" (mục 4 Owner Decision) — GitHub cho phép gắn 1 Environment (ví dụ `production`) yêu cầu người duyệt thủ công trước khi Job trong workflow được chạy | 🟡 Candidate — chưa quyết, để Gate 1 |
| **Branch protection rules trên `production`** | Khớp yêu cầu "protected release branch", "cấm auto-merge từ staging" | 🟡 Candidate |
| **Self-hosted Runner đăng ký theo repo** | Khớp phát hiện ở mục D (outbound-only, không cần key SSH nếu Runner cài trực tiếp trên server) | 🟡 Candidate |
| **GitHub Actions Secrets (Environment-scoped)** | Khớp yêu cầu "secure secret management", scope riêng theo Staging/Production | 🟡 Candidate |

Đây **chỉ là ghi nhận khả năng có sẵn của nền tảng đã chọn (GitHub Actions)**, không phải quyết định thiết kế cuối — thiết kế workflow cụ thể thuộc Plan, sau khi Gate 1 approve.

---

## G. Rollback Mechanism — Evidence Input

| Fact | Value | Tag |
|---|---|---|
| Rollback hiện tại | rsync lại file cũ từ máy Local/Agent — không có định danh SHA | ✅ kế thừa audit 02 |
| Ứng viên rollback mới | Phụ thuộc SD-03 (Deployment Mechanism) — nếu chọn Atomic Release + symlink → rollback = đổi symlink, tức khắc, đúng SHA. Nếu chọn Artifact-based → rollback = redeploy artifact cũ theo tag/SHA qua GitHub Actions | 🟡 Candidate, chờ SD-03 |
| Rollback cần test trước cutover cuối (Owner mục 9) | Chưa test — sẽ đưa vào Plan làm bước bắt buộc trước Gate 4 | ⏳ |

---

**Không có thay đổi nào được thực hiện đối với Git, Production, Staging trong toàn bộ audit A→G này.** Tiếp theo: `06 - Gate 1 SoT + Solution Package.md`.
