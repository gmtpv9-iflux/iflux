STATUS: `AUDIT-ONLY — KHÔNG SỬA / KHÔNG XOÁ / KHÔNG DISABLE bất kỳ cơ chế nào` — theo đúng yêu cầu Owner. Không rsync Production→Staging, không sửa application code, không xoá file, không commit, không đụng Production trong audit này.
Phase liên quan: **Phase 4 (Staging Isolation)** — điều kiện bắt buộc trước khi reconstruct Staging application baseline.
Mục tiêu: xác định toàn bộ cơ chế GitLab/CI/CD/cron/systemd/PM2/webhook cũ **có khả năng tự động ghi đè filesystem Staging** sau khi reconstruction, để đảm bảo việc dựng lại Staging không bị 1 cơ chế cũ âm thầm phá.

---

## Phạm vi đã kiểm tra

1. Git remotes + toàn bộ 21 branch (local + remote-tracking) — tìm `.gitlab-ci.yml`.
2. GitLab API/UI (qua GitLab MCP server) — webhook, CI/CD Variables, Runners, Protected Branches.
3. Server production (`103.154.177.157:7878`, toàn bộ hệ thống, không giới hạn riêng path Staging): GitLab Runner binary/service, crontab (root + `iflux-app` + `iflux-deploy` + `www-data`), systemd units custom, SSH `authorized_keys`, `known_hosts`, private key files toàn hệ thống, cổng đang listen, `.git` directory bất kỳ đâu trên server, PM2 dump history (process từng được định nghĩa), bash history, log rsync/deploy trong `/var/log`.
4. Repo local: toàn bộ file có tên deploy/webhook/hook, `.github/workflows` thật (loại trừ submodule `tabler-icons`), file credential (`infra/staging/*.env*`) — xem có target Staging tự động nào không.

## Kết quả chi tiết theo từng câu hỏi Owner

### Q1 — Staging hiện đang nhận deployment từ GitLab/GitLab CI/CD nào?

**Không có.** `.gitlab-ci.yml` không tồn tại ở working tree hiện tại, không tồn tại ở `origin/main`, và không tồn tại ở **bất kỳ branch nào trong 21 branch** (local + remote-tracking) — đã loop kiểm tra toàn bộ (kế thừa từ audit `02 - Mandatory Audit Evidence.md` AU-01.F, đã re-verify lại không có thay đổi). Repo local có remote GitLab (`origin` = `git@gitlab.com:gm.tpv9/iflux.git`) nhưng remote này **chỉ dùng để lưu source code (SCM)**, không có pipeline nào định nghĩa.

### Q2 — Toàn bộ webhook, pipeline, runner, deploy script, SSH key, environment/config, cron/systemd/PM2 hook nào có thể tự động ghi vào Staging?

| Hạng mục | Kết quả |
|---|---|
| GitLab Runner (binary/service) | **Không cài** — `which gitlab-runner` rỗng, không có `/etc/gitlab-runner`, không có systemd unit, không có dpkg package |
| Webhook listener (port bất thường) | **Không** — toàn bộ port đang listen trên server chỉ gồm: nginx (80/443/8888), postgres (127.0.0.1:5432), redis (127.0.0.1:6379), node backend Production (127.0.0.1:3001) + Staging (127.0.0.1:3002), sshd (7878). Không có process nào khác nghe webhook |
| Cron job | **Không** — `crontab -l` rỗng cho cả `root`, `iflux-app`, `iflux-deploy`, `www-data` |
| Systemd unit custom (deploy/webhook/hook) | **Không** — chỉ có unit hệ thống mặc định (`cloud-init-hotplugd`), không có unit nào tên iflux/deploy/webhook |
| PM2 hook tự deploy | **Không** — `pm2 dump` (root) chỉ ghi nhận 2 process tồn tại từ trước: `iflux-api`, `sbe-web` (site khác, không liên quan) — không có process Staging nào từng được định nghĩa trước khi Agent tự tạo `iflux-api-staging` ở bước PM2 runtime vừa rồi |
| SSH key deploy (machine-to-machine) | **Không tồn tại đường vào nào ngoài password root** — `/root/.ssh/authorized_keys` = 0 byte (0 key được đăng ký), `known_hosts` không có entry `gitlab.com` (server này **không** có kết nối SSH-out tới GitLab để tự `git pull`) |
| `.git` directory bất kỳ đâu trên server | **Không tìm thấy** (`find / -iname ".git" -type d`, giới hạn depth 6 — kể cả `/var/www`, `/var/iflux`, `/root`, `/home`) — xác nhận lại: Production và Staging **không phải git checkout**, thuần filesystem |
| Deploy script đã commit trong repo | **Không** — không có `.sh` deploy nào, không Makefile, không npm script `deploy` (kế thừa AU-02, re-verify) |
| Environment/config variable trỏ target Staging cho auto-deploy | **Không tìm thấy trong repo** — `infra/staging/deploy-production.env` chỉ có target **Production** (`DEPLOY_WEB_PRODUCTION=/var/www/iflux/production`), không có biến nào trỏ Staging tự động |
| GitHub Actions workflow (song song, không phải GitLab nhưng cùng loại rủi ro) | **Không tồn tại file nào** trong `.github/workflows/` ở repo thật (khác `tabler-icons-3.44.0` — đó là thư mục thư viện icon bên thứ 3, workflow của nó không liên quan iFlux) — khớp với `07 - Plan.md` Phase 5/6 vẫn ở trạng thái chưa triển khai |

### Q3 — Repository/branch/path mà deployment cũ đang sử dụng?

Không có "deployment cũ" theo nghĩa tự động. Theo tài liệu `Docs/SoT — Deployment.md` (đã audit trước, re-confirm): **Deploy = chuỗi lệnh SSH/rsync gõ tay** từ working tree local (máy Agent) thẳng vào `/var/www/iflux/production` và `/var/iflux/backend` trên server, **không đi qua GitLab commit/MR** (Case B/D trong SoT — deploy không bắt buộc commit trước). Repository GitLab chỉ đóng vai trò lưu trữ song song, tách biệt hoàn toàn khỏi hành động deploy thật.

Riêng với `/var/www/iflux/staging`: không tìm được bất kỳ bằng chứng nào (log, history, script) ghi lại **ai/khi nào/bằng cách nào** thư mục này được tạo — phù hợp với kết luận ở audit `10 -...` rằng đây là tập file thủ công không đồng nhất, khả năng cao được copy tay qua nhiều lần rải rác trong quá khứ, không phải kết quả của 1 pipeline.

### Q4 — Environment/config variables liên quan deployment target của Staging?

Chỉ tìm thấy ở `infra/staging/staging.env` (đã audit ở bước PM2 trước) — đây là file **credential cho Agent SSH tay vào server**, không phải config cho 1 pipeline tự động:

```
DEPLOY_HOST, DEPLOY_SSH_PORT, DEPLOY_SSH_USER, DEPLOY_SSH_PASSWORD, DEPLOY_RSYNC_SSH
CF_API_TOKEN, CF_ZONE_ID (Cloudflare cache purge)
```

Không có biến nào dạng `GITLAB_*`, `CI_*`, `RUNNER_*`, `WEBHOOK_*` trong bất kỳ file `.env*` nào của repo.

### Q5 — Cơ chế cũ có thể tự động ghi đè filesystem Staging sau khi reconstruct không?

**Không có bằng chứng nào cho thấy có.** Không có process nào đang chạy, không có schedule nào đang chờ, không có webhook nào đang nghe, không có SSH key nào cho phép 1 hệ thống ngoài tự đăng nhập vào server này để ghi file. Rủi ro ghi đè tự động từ cơ chế cũ ở mức server hiện tại = **thấp, gần như bằng 0** dựa trên bằng chứng filesystem/process trực tiếp.

---

## Bảng tổng hợp (đúng format Owner yêu cầu)

| Legacy mechanism | Source | Trigger | Target | Config/secret | Active? | Risk of overwriting new Staging | Action required |
|---|---|---|---|---|---|---|---|
| GitLab CI/CD Pipeline (`.gitlab-ci.yml`) | N/A | N/A | N/A | N/A | ❌ Không tồn tại (đã quét 21 branch) | Không | Không cần — không có gì để disconnect |
| GitLab Runner (self-hosted) | N/A | N/A | N/A | N/A | ❌ Không cài trên server | Không | Không cần |
| GitLab Webhook (project/group level) | GitLab project settings | ? | ? | ? | 🔴 **Unknown** — không truy vấn được qua GitLab UI/API (GitLab MCP server ở trạng thái cần auth qua browser, Agent không tự hoàn tất được; không có quyền SSH-out từ server tới GitLab để suy luận gián tiếp) | 🔴 Unknown — về mặt server-side (nhận), rủi ro = 0 vì không có gì nghe webhook; nhưng chưa loại trừ được **ở phía GitLab** có webhook trỏ tới 1 endpoint khác không phải server này | **Owner tự kiểm tra GitLab UI**: Project → Settings → Webhooks. Agent không thể tự xác nhận |
| GitLab CI/CD Variables | GitLab project settings | N/A | N/A | N/A | 🔴 **Unknown** — cùng lý do trên | Thấp (vì không có pipeline nào dùng chúng) | Owner tự kiểm tra GitLab UI nếu muốn khẳng định tuyệt đối |
| Cron job (server) | — | — | — | — | ❌ Rỗng cho mọi user liên quan | Không | Không cần |
| Systemd unit/hook (server) | — | — | — | — | ❌ Không có unit custom nào | Không | Không cần |
| PM2 hook tự deploy | — | — | — | — | ❌ Không — chỉ có process chạy tay | Không | Không cần |
| SSH key machine-to-machine | — | — | — | — | ❌ `authorized_keys` 0 byte — chỉ có đường vào password | Không | Không cần (nhưng đây là rủi ro bảo mật khác, đã ghi ở audit `02 -...` AU-03, không thuộc phạm vi audit này) |
| Deploy script committed trong repo | — | — | — | — | ❌ Không tồn tại | Không | Không cần |
| GitHub Actions workflow (song song GitLab) | Repo `.github/workflows/` | N/A | N/A | N/A | ❌ Chưa tạo file nào (Phase 5/6 của `07 - Plan.md` chưa triển khai) | Không | Không cần — nhưng cần nhớ **không tạo trigger tự động trỏ Staging cho tới khi Plan Phase 5 được Owner approve chính thức** |
| Thao tác thủ công (SSH/rsync tay) từng tạo ra state hiện tại của `/var/www/iflux/staging` | Không xác định được người/thời điểm cụ thể — suy luận từ mtime file hỗn hợp (một số file tháng 7, một số mới) | Thao tác người/Agent gõ tay, không lặp lại tự động | `/var/www/iflux/staging` | Không có config nào — không phải pipeline | ⚠️ Đã xảy ra trong quá khứ, không active/lặp lại | Không có rủi ro **tự động** lặp lại — nhưng nếu **có người khác (không phải Agent hiện tại)** vẫn còn quen SSH tay vào server và ghi đè Staging ngoài quy trình mới, đó là rủi ro **con người**, không phải cơ chế | Owner nên thông báo nội bộ (nếu có người khác từng làm việc này) để tránh ghi đè song song trong lúc reconstruct |

---

## Giới hạn của audit này (minh bạch, không giả định)

1. **GitLab-side (webhook, CI/CD Variables, Runner đăng ký ở tầng GitLab, Protected Branch rules)** — Agent **không** xác nhận được qua API vì GitLab MCP server yêu cầu xác thực qua browser (OAuth), cần Owner tự thao tác đăng nhập; Agent không có quyền tự hoàn tất luồng này. Đây là giới hạn **giống hoàn toàn** với audit `02 - Mandatory Audit Evidence.md` trước đó (GitLab MCP lỗi kết nối) — tức là qua nhiều lần audit, hạng mục này vẫn chưa được đóng.
2. **Bash history root gần như rỗng** (1 dòng) — không dùng được để loại trừ tuyệt đối các lệnh gitlab/webhook đã từng gõ tay trong quá khứ (không phải vì không có, mà vì cơ chế ghi history không hoạt động với các lệnh SSH non-interactive).
3. Audit chỉ kiểm tra **1 server origin** (`103.154.177.157`) — không loại trừ khả năng có 1 máy/agent khác (ngoài phạm vi audit) có quyền SSH riêng và từng ghi vào Staging; chỉ có thể kết luận **trên server này không có cơ chế tự động nào**, không thể kết luận về mọi máy có thể SSH vào nó (vì đường vào là password chung — bất kỳ ai biết password đều có thể SSH tay, nhưng đó là rủi ro credential đã ghi ở audit `02` AU-03, không phải "cơ chế" theo nghĩa Owner hỏi ở đây).

## Kết luận

**Không tìm thấy cơ chế GitLab CI/CD, webhook, runner, cron, systemd, PM2 hook, hay SSH-key automation nào đang active và có khả năng tự động ghi đè `/var/www/iflux/staging` sau khi reconstruct.** Rủi ro overwrite tự động ở mức server = thấp/gần như 0 dựa trên bằng chứng trực tiếp. Rủi ro còn lại duy nhất mang tính **con người** (ai đó SSH tay ghi đè song song) và **1 hạng mục GitLab-side chưa xác nhận được qua API** (cần Owner tự mở GitLab UI kiểm tra Webhooks/Variables/Runners nếu muốn khép hoàn toàn 100%, hoặc approve cho Agent thực hiện OAuth qua trình duyệt).

→ **An toàn để tiến hành bước tiếp theo (reconstruct Staging application baseline)** xét trên khía cạnh "không có pipeline cũ nào sẽ tự ghi đè lại" — chờ Owner approve theo đúng yêu cầu trước khi Agent đổi bất kỳ deployment path nào.

---

## Bổ sung (2026-08-12, sau khi Owner cung cấp evidence) — "Legacy Staging reference": `http://103.154.177.157:8888/Admin_Design_system/app/dashboard/index.html`

Owner phát hiện URL này và nghi ngờ đây là 1 server/service legacy riêng. Đã audit read-only, **không sửa/restart/delete/disable gì**.

### Trả lời 4 câu hỏi

| # | Câu hỏi | Kết quả |
|---|---|---|
| 1 | IP `103.154.177.157:8888` là server/service nào? | Chính là server origin hiện tại (`DEPLOY_HOST=103.154.177.157` trong `infra/staging/staging.env`) — port `8888` là cổng nginx phục vụ Staging trực tiếp qua IP (không qua Cloudflare), **cùng 1 nginx server block** với domain `https://staging.iflux.vn` đã dựng ở bước trước trong task này. Verify bằng: (a) response header `X-IFlux-Env: staging` xuất hiện khi test path không bị 1 location riêng che (`/`, path 404) — đúng cấu hình đã thêm; (b) diff nội dung file `dashboard/index.html` qua `IP:8888` và qua `https://staging.iflux.vn` → **giống 100% byte-for-byte**. |
| 2 | Có phải chính server Production/Staging mới, hay legacy server riêng? | **Chính là server Production/Staging hiện tại** (1 server duy nhất, `103.154.177.157`) — Production chạy port 3001 (nginx 80/443, domain `iflux.vn`), Staging chạy port 3002 (nginx 8888 + domain `staging.iflux.vn` mới thêm 443/80 ở bước trước). **Không có server thứ 2 nào khác.** Port `8888` + thư mục `/var/www/iflux/staging` + config nginx `iflux-staging.conf` **đã tồn tại từ trước phiên làm việc hiện tại** — xác nhận qua backup nginx đầu tiên Agent tạo lúc 18:25 hôm nay (trước khi sửa gì) đã thấy sẵn `listen 8888; server_name staging.iflux.vn _;` — nghĩa là hạ tầng port 8888 do 1 phase/thao tác trước đó dựng lên, Agent chỉ tiếp tục dùng lại (sửa `proxy_pass` port + thêm domain 80/443), không tự tạo mới. |
| 3 | Source/deployment relationship với GitLab cũ? | **Không có quan hệ trực tiếp nào tìm được.** File `dashboard/index.html` trên Staging (22.338 byte, `Last-Modified: 07/07/2026`) không chứa marker GitLab CI nào (`CI_COMMIT`, `CI_PIPELINE`, build id, comment generator — grep không khớp). Bản trong Git working tree (`bb9512a`) có kích thước **8.164 byte — khớp chính xác với bản Production hiện tại** (Aug 10), **khác hoàn toàn** bản trên Staging (22.338 byte, cũ hơn ~1 tháng, gần 3× to hơn — cấu trúc trang đã đổi nhiều giữa 2 thời điểm). → File trên Staging là 1 snapshot cũ từ đầu tháng 7, **không liên quan tới bất kỳ pipeline GitLab nào** (đã xác nhận ở audit chính phía trên: không có `.gitlab-ci.yml`, không Runner, không webhook active trên server này). |
| 4 | Còn active/accessible hay chỉ legacy artifact? | **Vẫn active và accessible ngay bây giờ** — `curl` trực tiếp trả `HTTP/1.1 200 OK`, nginx đang serve thật (không phải cache chết hay DNS trỏ sai). Nhưng **nội dung là legacy artifact** (snapshot đầu tháng 7, chưa được cập nhật theo Production hiện tại) — đúng như phát hiện ở audit `10 - Application Code Reconciliation Audit...`: Staging là tập file hỗn hợp cũ/mới, chưa đồng bộ. |

### Kết luận bổ sung

Đây **không phải** 1 server/service legacy tách biệt cần lo ngại về mặt hạ tầng — đây chính xác là **Staging hiện tại** (cùng server, cùng nginx block, cùng static root) mà task này đang reconstruct, truy cập qua IP:port thô thay vì qua domain. "Legacy" đúng ở khía cạnh **nội dung file cũ** (snapshot tháng 7, khác Production/Git ~1 tháng), không phải ở khía cạnh **có 1 hệ thống deploy GitLab riêng nào đang chạy ngầm**. Không phát hiện thêm rủi ro overwrite tự động nào ngoài những gì đã kết luận ở audit chính phía trên.
