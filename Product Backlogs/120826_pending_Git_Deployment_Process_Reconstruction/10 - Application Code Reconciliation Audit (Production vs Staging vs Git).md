STATUS: `AUDIT-ONLY — KHÔNG SỬA CODE` — Trigger: Owner test flow đăng ký trên `staging.iflux.vn` phát hiện thiếu Google Login, còn icon Google cũ không hoạt động, submit không đi tiếp. Theo yêu cầu Owner: **KHÔNG sửa form đăng ký cho giống Production trước** — audit này chỉ trả lời "tại sao Staging khác Production" và "Git đã capture đúng code Production chưa".
Phase liên quan: **Phase 4 (Staging Isolation)** — phát sinh ngoài kế hoạch gốc (PM2/nginx runtime), nhưng đúng bản chất câu hỏi lớn của toàn task **Git Deployment Process Reconstruction**.
Không có thay đổi code/file nào được thực hiện trong audit này. Production không bị đụng. Staging không bị đụng (ngoại trừ PM2/nginx runtime đã làm ở bước trước, không liên quan phần này).

---

## Kết luận ngắn (executive summary)

**Staging (`/var/www/iflux/staging`) không phải là bản copy đầy đủ/mới nhất của Production, và cũng không phải bản checkout từ Git.** Đây là một tập file tĩnh hỗn hợp — phần lớn là snapshot cũ (một số file có mtime tháng 7, trước khi Google Login được rebuild), cộng thêm vài file sandbox/mock/dev cũ không liên quan Production, cộng thêm 2 file môi trường mới (`iflux-env-bootstrap.js`, `iflux-runtime-env.js`) có vẻ được thêm riêng cho việc dựng Staging gần đây.

**Git (commit `bb9512a`, nhánh `github/production` = `github/staging` = cùng 1 commit) ĐÃ capture đúng — khớp 100% — với đúng 3 file cốt lõi làm nên chức năng đăng ký + Google Login trên Production hiện tại.** Vấn đề không nằm ở Git, không nằm ở Production, không nằm ở cấu hình Google OAuth (backend Staging đã có đúng `GOOGLE_CLIENT_ID`, endpoint `/auth/social/config` trả đúng). Vấn đề nằm **thuần túy ở việc `/var/www/iflux/staging` chưa từng được đồng bộ đầy đủ** — có thể do được tạo thủ công một lần trong quá khứ và không có quy trình cập nhật lại theo Production.

---

## Trả lời 6 câu hỏi Owner đặt ra

### 1. Code trên Staging lấy từ đâu?

Không xác định được một nguồn duy nhất — bằng chứng cho thấy đây là **tập hợp không đồng nhất theo thời gian**, không phải 1 lần copy sạch:

- Đa số file trùng khớp nội dung với Production nhưng ở **snapshot cũ hơn** (ví dụ `User_Web/auth/register.html` trên Staging có `mtime = 2026-07-31 21:46`, Production hiện tại là `2026-08-10 11:30`).
- Có ít nhất 1 file xác nhận là **sandbox/mock cũ, không phải code Production thật**: `User_Web/iflux-web-ui/mock-market.js` trên Staging có comment đầu file `/* Sandbox market snapshot — shape mirror 09 §2.1 */` — file cùng tên tồn tại trong Git nhưng ở path khác hẳn (`Admin_Design_system/iflux-admin-ui/mock-market.js`), nghĩa là bản trên Staging **không đến từ Git repo hiện tại, không đến từ Production** — là 1 bản rời, có khả năng từ 1 phiên bản demo/dev cũ.
- Có 12 file tồn tại trên Staging nhưng **không tồn tại trên Production hiện tại**: `account/profile-panels.html`, `community/tag.html`, `community/topic.html`, `guest/guest.css`, `guest/index.html`, `hub.html`, `iflux-web-ui/community-story-page.js`, `iflux-web-ui/guest-page.js`, `iflux-web-ui/iflux-env-bootstrap.js`, `iflux-web-ui/iflux-runtime-env.js`, `iflux-web-ui/market-page.js`, `iflux-web-ui/mock-market.js`.
  - Riêng `iflux-env-bootstrap.js` / `iflux-runtime-env.js` có nội dung tham chiếu trực tiếp `port === '8888'`, `host === '103.154.177.157'`, `host.indexOf('staging.') === 0` — đây rõ ràng là code viết **riêng cho việc nhận diện môi trường Staging** (khả năng cao được thêm vào gần đây, phục vụ đúng việc dựng Staging đang làm), không phải leftover cũ.

**Kết luận: Staging không có 1 nguồn gốc đơn nhất — là kết quả pha trộn giữa (a) snapshot Production cũ chưa cập nhật, (b) leftover sandbox/mock không rõ nguồn, (c) vài file mới thêm riêng cho môi trường Staging.**

### 2. Production cũ đang chạy commit/version nào?

**Không xác định được bằng git commit SHA — vì `/var/www/iflux/production` không phải git repo** (không có `.git`). Đây tự nó là 1 finding trung tâm của task Git Deployment Reconstruction: Production hiện tại được vận hành hoàn toàn bằng file trên đĩa (deploy thủ công qua rsync/SSH trong lịch sử), không có version tracking nào ở tầng filesystem.

Xác định gián tiếp qua nội dung: file `register.html` + toàn bộ chain JS (`auth-register-boot.js`, `legacy-bridge.js`, `auth-register-init.js`, `auth-social.js`) trên Production hiện tại **khớp 100% (diff rỗng)** với đúng các file tương ứng trong Git working tree ở commit `bb9512a`. Git log của các file này cho thấy commit gần nhất liên quan là:

```
9df7509 feat(auth): rebuild Google social login as Provider/UseCase/Verifier
c416523 chore(milestone): freeze Safe Baseline 2026-07-30
4357417 chore: snapshot remaining local baseline before large next task
bb9512a chore: establish Git deployment reconciliation baseline
```

→ Production hiện tại đang chạy đúng code **sau khi Google Login được rebuild** (khoảng 2026-07-30), và code đó **đã được Git baseline `bb9512a` capture đúng** (ít nhất cho nhóm file liên quan đăng ký/Google Login).

### 3. Git hiện tại đang ở commit nào?

- Local working tree: branch `backup/100826-appshell-foundation-20260810`, HEAD = `bb9512acc8e8d3746e863d565050abd773851c25` ("chore: establish Git deployment reconciliation baseline", 2026-08-12 15:32:27).
- `remotes/github/production` = `remotes/github/staging` = **cùng đúng commit `bb9512a`** (đã verify bằng `git log -1` cả 2 remote branch — không lệch nhau, đây là baseline chung được set up ở Phase 1-3).

### 4. Form đăng ký trên Production cũ nằm ở source nào?

```
User_Web/auth/register.html                                (markup + nút Google dạng <div id="ifx-google-signin-btn">)
  └─ <script type="module" src=".../runtime/auth-register-boot.js">
       └─ import legacy-bridge.js (sequential script loader)
       └─ load chain: iflux-platform-boot.js → iflux-api-bundle.js → auth.js
                     → iflux-customers-store.js → iflux-credentials-store.js
                     → loyalty-affiliate-store.js → auth-social.js  (Google/Apple/FB/Zalo wiring)
                     → iflux-user-data-sync.js → iflux-admin-ui.js → iflux-web-ui.js
                     → auth-register-init.js  (GIS renderButton + form submit handler)
```

**Đã kiểm tra từng file trong chain này tồn tại ở đâu:**

| File | Production | Staging | Git local |
|---|---|---|---|
| `User_Web/auth/register.html` | ✅ | ✅ (bản cũ hơn, cùng markup Google) | ✅ khớp 100% với Production |
| `runtime/auth-register-boot.js` | ✅ | ❌ **THIẾU** | ✅ |
| `runtime/legacy-bridge.js` | ✅ | ❌ **THIẾU** | ✅ |
| `auth-register-init.js` | ✅ | ❌ **THIẾU** | ✅ |
| `auth-social.js` | ✅ | ✅ | ✅ |
| 8 file còn lại trong chain | ✅ | ✅ | (chưa cần kiểm tra — không phải nguyên nhân) |

→ **Nguyên nhân kỹ thuật trực tiếp của cả 3 triệu chứng Owner báo cáo (thiếu Google Login, icon cũ không hoạt động, submit không đi tiếp) là do đúng 3 file này bị thiếu trên Staging.** Thiếu `auth-register-boot.js` → toàn bộ chain phía sau không load được → `auth-social.js` (dù có mặt) không được gọi để render nút Google thật → chỉ còn icon `<div>` tĩnh (fallback HTML) hiển thị nhưng không có JS gắn hành vi → và `auth-register-init.js` (xử lý submit form) cũng không load được → submit không có tác dụng.

### 5. Google OAuth configuration nằm trong code hay environment/config?

**Nằm ở backend environment/config, KHÔNG hardcode trong frontend code.**

- Frontend (`auth-social.js`) không có `client_id` hardcode — hàm `fetchSocialConfigDirect()` gọi `GET {API_BASE}/auth/social/config` để lấy config tại runtime.
- Backend đọc `GOOGLE_CLIENT_ID` từ biến môi trường (`process.env` qua `src/config`), trả về qua route `/auth/social/config`.
- Đã verify Staging backend (port 3002) trả đúng:

```json
{"google":{"enabled":true,"clientId":"642927266497-o04c7abj4rbj1lobf906342ivhaoecse.apps.googleusercontent.com"}, ...}
```

  — **giống 100% với Production** (đã đặt sẵn trong `ecosystem.staging.config.js` ở bước PM2 trước, không phải fix mới trong audit này).

→ **Backend/config của Staging cho Google OAuth đã đúng và sẵn sàng.** Vấn đề 100% nằm ở phía frontend static file thiếu, không liên quan gì đến cấu hình OAuth hay biến môi trường.

### 6. Staging có đang chạy đúng code baseline mà chúng ta định đưa vào Git hay không?

**Không.** Bằng chứng định lượng — so sánh toàn bộ cây `User_Web` giữa Production live và Staging live:

```
229 file tồn tại ở Production, KHÔNG tồn tại ở Staging
 12 file tồn tại ở Staging, KHÔNG tồn tại ở Production
```

229 file thiếu bao gồm cả trang thật (toàn bộ `ecosystems/*/index.html`, nhiều trang `cong-dong/*/*/index.html`) và nhiều module JS lõi (`auth.js`, `iflux-platform-boot.js`, `bootstrap.js`, và 3 file chain đăng ký nêu ở câu 4). Đây không phải lệch nhỏ — đây là 2 codebase ở 2 thời điểm rất khác nhau.

---

## Finding phụ (ngoài phạm vi câu hỏi gốc, nhưng liên quan trực tiếp mục tiêu toàn task)

So sánh Git working tree (`bb9512a`) vs Production live cho thấy Git **cũng chưa capture đủ 100%** Production:

```
39  file chỉ có ở Git local, không có ở Production live   (cần audit riêng — có thể file đã xoá/đổi tên trên Production)
117 file chỉ có ở Production live, không có ở Git local
```

117 file này gồm 2 nhóm rõ rệt:

1. **Trang tĩnh generated cho SEO** (`sectors/1..6/index.html`, `stocks/<TICKER>/index.html`, `cong-dong/*/*/index.html`, `ecosystems/*/index.html`, `iflux-plans-v1.json`, `data/iflux-routes.json`) — nhiều khả năng là output tự sinh (build-time hoặc cronjob), không phải source thủ công. Không có `.gitignore` rule loại trừ các path này — nghĩa là quyết định "có nên track hay không" **chưa được đưa ra rõ ràng**, không phải bị bỏ sót có chủ đích.
2. **Module JS/CSS thật** không nằm trong 2 nhóm trên: `User_Web/auth.js` (root, khác `iflux-web-ui/auth.js`), `iflux-platform-boot.js` (root), `bootstrap.js`, `shell-boot.js`, `loyalty-affiliate-store.js` (root), `profile-bind.js`, `profile-activity-store.js`, `profile-local-scope.js`, và nhiều CSS (`community.css`, `market.css`, `flow.css`, `faq.css`, `alerts.css`, `profile.css`, `stock.css`, `watchlist.css`, `widget-shell.css`, `insight-share.css`, `feature-suggestions.css`).

**Đây là gap thật của Phase 1/2 Reconciliation (capture Production vào Git) — chưa đóng hoàn toàn.** Không nằm trong phạm vi Phase 4 (Staging Isolation runtime), nêu ra ở đây để Owner quyết định có mở lại Phase 1/2 review hay xử lý riêng.

---

## KHÔNG đã làm trong audit này (theo đúng yêu cầu Owner)

- Không sửa `register.html`.
- Không copy/sync 3 file thiếu từ Production hoặc Git sang Staging.
- Không sửa cấu hình Google OAuth (đã đúng, không cần sửa).
- Không đụng Production.
- Không commit gì vào Git.

## Việc cần Owner quyết định tiếp (không tự chọn thay)

1. **Cách đưa Staging về đúng baseline:** đồng bộ Staging từ Git (commit `bb9512a`, coi Git là source of truth từ giờ) — hay rsync trực tiếp từ Production live? Hai cách cho kết quả gần như giống nhau ở nhóm file đăng ký (vì Git đã khớp Production ở nhóm này), nhưng khác nhau ở 117 file "chỉ có ở Production" — nếu đồng bộ từ Git, Staging sẽ **thiếu** đúng 117 file đó (bao gồm nhiều trang SEO generated); nếu rsync từ Production, Staging sẽ có đủ nhưng vẫn tiếp tục đứng ngoài Git tracking.
2. **117 file "chỉ có ở Production, chưa có ở Git"** — coi là generated/build-output (loại trừ khỏi Git bằng `.gitignore` có chủ đích) hay coi là source thật cần commit bổ sung? Cần Owner xác nhận trước khi Agent động vào Git.
3. **12 file leftover trên Staging** (mock-market.js, guest/, hub.html, ...) — xoá luôn (vì không liên quan cả Git và Production hiện tại) hay giữ lại vì mục đích riêng nào đó Owner đang dùng?

Sau khi Owner chốt hướng ở câu 1-3, Agent mới thực hiện đồng bộ Staging (đúng lúc đó mới đụng đến form đăng ký, và khi đó sẽ tự động fix theo đúng chỗ, không phải "sửa form cho giống Production" một cách rời rạc như warning ban đầu của Owner).
