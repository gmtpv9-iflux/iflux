STATUS: `PLAN ONLY — CHƯA THỰC HIỆN` — theo đúng Owner direction mới nhất (2026-08-12). Chưa rsync, chưa xoá Staging cũ, chưa sửa Production, chưa đổi DNS/nginx, chưa deploy application. **STOP sau khi plan này xong, chờ Owner review/approve.**
Phase liên quan: **Phase 4 (Staging Isolation)** — thay thế hoàn toàn hướng "reconcile Staging cũ" bằng hướng mới "reconstruct Staging từ Production hiện tại qua Git/GitHub".

---

## 0. Ghi nhận Owner direction (tóm tắt để đối chiếu, không diễn giải lại)

- **Production cũ** (`iflux.vn`) = baseline application hiện tại, không đổi trong suốt quá trình.
- **Staging cũ** (`103.154.177.157:8888`, `staging.iflux.vn` hiện tại) = **legacy, bị bỏ**, không dùng filesystem/229-file-gap của nó làm danh sách cần phục hồi.
- **Staging mới** = built từ Production hiện tại, qua GitHub, theo BR-23 isolation (DB/credential/side-effect tách biệt — **giữ nguyên**, không đổi so với đã làm ở Phase 4 trước).
- Endpoint `staging.iflux.vn` và (nếu cần) `:8888` **được tái sử dụng**, không bắt buộc đổi domain.
- Kiến trúc đích: `Production cũ → capture → GitHub/Git → CI/CD → Staging mới → test → PASS → Production mới`.
- Việc cần làm bây giờ: **chỉ viết plan này**, không thực hiện.

---

## 1. Production application baseline lấy từ đâu?

**Nguồn duy nhất:** filesystem sống trên server `103.154.177.157` (đã xác nhận qua audit `10 -...`/`11 -...`: Production **không phải git repo**, không có `.git`) —

```text
Frontend : /var/www/iflux/production
Backend  : /var/iflux/backend
```

Không có nguồn thứ 2 nào đáng tin hơn (Git hiện tại **không** đầy đủ — xem mục 2). Tất cả việc "capture" phải đọc trực tiếp 2 path trên tại 1 thời điểm cố định (snapshot), ghi rõ timestamp, để làm baseline nhất quán — tránh vừa đọc vừa để Production tiếp tục đổi live giữa lúc capture (rủi ro thấp vì Production ít đổi theo giờ, nhưng phải ghi nhận rõ SHA/timestamp capture để truy vết sau).

## 2. File nào cần đưa vào Git?

Đã có bằng chứng cụ thể từ audit `10 -...` (frontend) + kiểm tra bổ sung hôm nay (backend) — tổng hợp lại thành 4 nhóm:

| Nhóm | Ví dụ | Quyết định đề xuất |
|---|---|---|
| **A. Source code ứng dụng** (đã có trong Git, khớp Production) | Đa số `User_Web/iflux-web-ui/*.js/css`, `Admin_Design_system/**`, `backend/src/**` | Giữ nguyên, đây là phần Git đã đúng |
| **B. Source code ứng dụng CÒN THIẾU trong Git** (có ở Production, chưa commit) | Frontend: `auth.js` (root), `iflux-platform-boot.js` (root), `bootstrap.js`, `shell-boot.js`, `loyalty-affiliate-store.js` (root), `profile-bind.js`, `profile-activity-store.js`, `profile-local-scope.js`, 10 file CSS (`community.css`, `market.css`, `flow.css`, `faq.css`, `alerts.css`, `profile.css`, `stock.css`, `watchlist.css`, `widget-shell.css`, `insight-share.css`, `feature-suggestions.css`) + `iflux-onboarding-slides.js`, `feature-suggestions-*.js`, `hub-page.js`, `community-top-watchlist-store.js`, `flow-score-top-mock.js`, `loyalty-page.js`, `pricing-page.js`, `widgets/watchlist-page/index.js`, `pages/community.manifest.js`.<br>Backend: module `onboarding` (`onboarding.routes.js`, `onboarding.service.js`), module `plans` (`plans.routes.js`, `plans-runtime-file.js`), module `sitemap` (toàn bộ — `sitemap.routes.js`, `sitemap.service.js`, `sitemap.registry.js`, `providers/*.js`), `content.routes.js`, `content.service.js`, `affiliate-balance.service.js`, `wave-e-admin.service.js`, module `admin-auth` (`app.js`, `index.js`), `admin-rbac/admin-auth.service.js`, `config/app.js`, `config/auth.service.js`. | **Phải commit bổ sung vào Git trước khi dùng làm baseline Staging** — nếu không, Staging mới sẽ lại thiếu đúng các module này (lặp lại đúng lỗi vừa audit ở Staging cũ) |
| **C. File nghi ngờ đã đổi tên/refactor** (tồn tại ở Git nhưng KHÔNG còn ở Production — cần xác nhận trước khi xoá khỏi Git hoặc giữ) | `modules/interaction/interaction-thread.service.js`, `modules/media/media.routes.js` + `media.service.js`, `modules/subscription/wave-e-admin.routes.js` + `wave-e-admin.service.js`, `modules/market/market.routes.js` + `market.service.js` (Production có bản mới `market-public.routes.js` cạnh bản cũ — cần audit code diff, không suy đoán) | **Cần Owner/Agent audit code-diff riêng** (không tự xoá/giữ dựa vào tên file) — đây là rủi ro thật nếu route cũ trong Git bị route mới trên Production ghi đè logic mà chưa nhận ra |
| **D. Cruft rõ ràng không phải source** | `app.js.bak-1783817586` (backup file, có `.bak-<timestamp>` trong tên), `.DS_Store` bất kỳ đâu | **Không đưa vào Git, không đưa vào Staging** — xoá khỏi Production cũng nên làm (nhưng đó là hành động sửa Production → **cần Owner approve riêng**, không tự động trong plan này) |

## 3. File nào là generated/runtime, loại khỏi source?

Xác nhận từ audit `10 -...` — các path sau **có pattern rõ ràng là output tự sinh, không phải source thủ công**:

```text
User_Web/sectors/<id>/index.html            (6 file, id 1-6)
User_Web/stocks/<TICKER>/index.html          (nhiều mã, ví dụ ACB, BHX, CMG...)
User_Web/cong-dong/<ticker>/<slug>/index.html (bài SEO theo mã CK)
User_Web/ecosystems/<slug>/index.html
User_Web/iflux-plans-v1.json
User_Web/data/iflux-routes.json
```

**Đề xuất:** thêm `.gitignore` rule cho các pattern này (loại khỏi Git tương lai) + xác nhận với Owner cơ chế sinh ra chúng hiện tại là gì (cron/script nào? — đã audit không thấy cron trên server, nghĩa là các trang này được sinh bằng 1 script chạy tay/1 lần, cần xác định script đó nằm ở đâu để Staging mới cũng có khả năng tự sinh lại nếu cần, thay vì copy tay).

**Runtime/storage — chắc chắn loại khỏi Git & khỏi việc "capture application":**

```text
/var/iflux/storage (Production uploads)     → KHÔNG copy sang Staging (đã có storage-staging riêng, rỗng, đúng BR-23)
node_modules/ (backend + bất kỳ đâu)
logs/, *.log
.env, .env.* (secrets thật)
```

## 4. Config nào phải chuyển thành Staging config?

**Đã làm xong ở Phase 4 (PM2 runtime) — giữ nguyên, không cần làm lại:**

| Biến | Production | Staging (đã set) |
|---|---|---|
| `DATABASE_*` | `iflux` | `iflux_staging` (đã tách, schema parity 100% — audit `09`) |
| `PORT` | 3001 | 3002 |
| `STORAGE_LOCAL_PATH` | `/var/iflux/storage` | `/var/iflux/storage-staging` |
| `JWT_SECRET`, `ADMIN_API_KEY` | riêng | riêng (đã generate khác) |
| `DNSE_*`, `SMTP_*`, `RESEND_API_KEY`, `EMAIL_PROVIDER` | thật | rỗng/không set — tắt side-effect thật |
| `GOOGLE_CLIENT_ID` | thật | **giống Production** (dùng chung 1 OAuth app — đã verify hoạt động đúng ở audit `10`) — Owner cần xác nhận có muốn tách OAuth Client ID riêng cho Staging hay tiếp tục dùng chung (rủi ro thấp vì Client ID không phải secret tuyệt đối, nhưng domain callback cần đúng `staging.iflux.vn` trong Google Console nếu Owner muốn tách) |
| `CORS_ORIGIN` | `iflux.vn` | `staging.iflux.vn` + IP:8888 (đã set) |

→ Mục 4 **không cần làm gì thêm** khi reconstruct — chỉ cần đảm bảo application code mới không hardcode giá trị Production vào đâu ngoài các biến trên (kiểm tra lại 1 lần sau reconstruct).

## 5. DB/data boundary giữ như thế nào?

**Không đổi — đây là phần đã xong và đúng BR-23, không nằm trong scope reconstruction lần này.** `iflux_staging` (đã đạt structural parity 100% với Production ở audit `09`) tiếp tục là DB của Staging mới. Owner đã nói rõ "**Không copy Production DB thành Staging DB**" — plan này chỉ đổi **application code**, không đụng dữ liệu.

## 6. Cách deploy GitHub → Staging?

Đây là quyết định kiến trúc lớn nhất còn mở — 2 lựa chọn, cần Owner chốt:

| Lựa chọn | Mô tả | Ưu | Nhược |
|---|---|---|---|
| **A. Deploy thủ công có kiểm soát trước, CI/CD thật sau (Phase 5)** | Sau khi Git có đủ baseline (mục 2), Agent SSH tay `rsync`/`git archive` từ đúng 1 commit Git cụ thể sang `/var/www/iflux/staging` + `/var/iflux/backend-staging` (nếu tách riêng path backend) — có log, có commit SHA ghi lại, giống cách đang deploy Production hiện nay | Làm được ngay, không phụ thuộc hạ tầng CI/CD chưa có (self-hosted runner chưa đăng ký — xem `07 - Plan.md` Phase 5 vẫn pending) | Vẫn là thao tác tay — đúng như Owner muốn thoát khỏi ("Staging mới... qua GitHub/CI-CD"), chỉ là bước đệm |
| **B. Dựng CI/CD (Phase 5) trước, rồi để pipeline tự deploy Staging lần đầu** | Làm đúng Phase 5 (`07 - Plan.md`: tạo user `iflux-deploy`, cài self-hosted runner, viết `deploy-staging.yml`) trước, sau đó push code baseline lên nhánh `staging` để pipeline tự chạy | Đúng kiến trúc đích ngay từ đầu, không có bước "thủ công tạm" | Kéo dài thời gian trước khi Staging mới có nội dung; Phase 5 chưa test bao giờ — rủi ro build "vừa reconstruct vừa build pipeline" cùng lúc, khó cô lập lỗi nếu Staging mới sai (không biết do baseline sai hay do pipeline sai) |

**Đề xuất (chờ Owner chốt):** Làm **A trước** để có Staging mới nội dung đúng, verify parity xong (mục 9) → sau đó làm Phase 5 (B) để pipeline hoá lại đúng quy trình đã verify, tránh debug 2 lớp rủi ro (nội dung + pipeline) cùng lúc. Đây khớp thứ tự Owner đã tự chốt trước đó trong `07 - Plan.md` ("Isolation xong rồi mới nối CI/CD").

## 7. Cách giải phóng/repoint `staging.iflux.vn`?

**Không cần đổi DNS/Cloudflare** — domain đã trỏ đúng server này (audit `11`). Việc "giải phóng" ở đây chỉ là: **thay nội dung filesystem tại `/var/www/iflux/staging` + backend tại `/var/iflux/backend` (instance Staging port 3002)** từ baseline cũ (legacy, hỗn hợp) sang baseline mới (reconstruct từ Production qua Git). Nginx block, cert SSL riêng, PM2 process `iflux-api-staging` — **đã dựng đúng ở Phase 4 trước, giữ nguyên, không cần dựng lại.**

## 8. Cách xử lý endpoint `:8888`?

Owner nói "chỉ giữ nếu architecture mới cần". Đánh giá: `:8888` hiện chỉ có giá trị là **đường truy cập trực tiếp qua IP, không qua Cloudflare** — dùng để Agent/Owner debug khi domain có vấn đề. Không phải yêu cầu bắt buộc của BR-23. **Đề xuất 2 lựa chọn cho Owner chọn:**

- **Giữ** — tiện debug, rủi ro thấp (không public trong tài liệu/DNS, chỉ ai biết IP mới gọi được), nhưng đây chính là endpoint Owner vừa gọi là "legacy reference" — nếu giữ, cần đổi cách gọi tên trong tài liệu để không còn gây hiểu lầm là "legacy".
- **Đóng** (bỏ `listen 8888` khỏi nginx) — sạch hơn, đúng tinh thần "bỏ hẳn cái cũ", nhưng mất đường debug trực tiếp khi cần (vẫn còn cách khác: SSH vào server rồi `curl 127.0.0.1:3002` trực tiếp, không cần mở port ra ngoài).

## 9. Cách verify Staging mới đạt parity với Production cũ?

Tái sử dụng đúng phương pháp đã dùng ở audit `10 -...` (đã có sẵn, không cần nghĩ mới):

1. **File-list diff = 0** giữa `/var/www/iflux/staging` (mới) và Git commit dùng làm baseline (không so trực tiếp với Production filesystem nữa, vì Git bây giờ là SoT sau khi mục 2 hoàn tất).
2. **Functional smoke test**: đăng ký + Google Login + submit form (chính luồng Owner vừa phát hiện lỗi) phải hoạt động đúng trên `staging.iflux.vn`.
3. **API parity**: các endpoint chính (`/api/market/master/sectors`, `/api/auth/social/config`, …) trả đúng cấu trúc response, data khác Production (vì DB khác) nhưng **schema/format giống**.
4. **Dual verification** (đúng khuôn mẫu đã làm ở Phase 4 PM2 trước): Agent verify qua evidence kỹ thuật + Owner tự tay test 1 luồng side-effect thật, xác nhận không chạm Production.

## 10. Rollback strategy nếu reconstruction thất bại?

- **Trước khi ghi đè bất kỳ file nào lên `/var/www/iflux/staging` / backend Staging**, di chuyển toàn bộ baseline cũ sang path backup có timestamp (ví dụ `/var/www/iflux/staging.legacy-20260812/`) — **không xoá**, đúng nguyên tắc "không xoá Staging cũ" cho tới khi Owner xác nhận Staging mới ổn định.
- Nếu Staging mới lỗi sau khi switch: revert nginx `root`/PM2 script trỏ lại path backup cũ trong vài giây (atomic switch kiểu symlink, không phải copy đè lại) — mô hình giống atomic release Owner đã định hướng ở Phase 5/6 (`current` symlink).
- **Production không nằm trong đường rollback này** — vì Production không bị đụng ở bất kỳ bước nào của plan này, nên không cần rollback Production.

---

## Trình tự thực hiện SAU KHI Owner approve (chưa làm, chỉ liệt kê để Owner review trình tự)

```text
1. Đóng gap Git (mục 2 nhóm B) — commit các file source còn thiếu, audit riêng nhóm C trước khi quyết định
2. Xác nhận .gitignore cho nhóm generated (mục 3)
3. Owner chốt mục 6 (deploy path) và mục 8 (:8888)
4. Backup Staging cũ sang path timestamp (không xoá)
5. Deploy baseline mới (Git commit đã chốt) vào Staging theo đúng lựa chọn mục 6
6. Verify theo mục 9 (Agent + Owner dual verification)
7. Nếu PASS → cập nhật 07 - Plan.md, đánh dấu Phase 4 Exit Gate
8. Nếu FAIL → rollback theo mục 10, quay lại bước phù hợp
```

## Không làm trong plan này (đúng yêu cầu Owner)

Chưa rsync Production→Staging. Chưa xoá file/thư mục nào trên Staging cũ. Chưa sửa Production. Chưa đổi DNS/Cloudflare/nginx. Chưa deploy application nào. Chưa commit gì vào Git. **Chờ Owner review plan này trước khi làm bất kỳ bước nào ở trên.**
